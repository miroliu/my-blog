---
title: "Kubernetes v1.19.16 二进制高可用部署"
description: "Kubernetes v1.19.16 二进制高可用部署指南"
slug: "kubernetes-v1-19-16-binary-high-availability-deployment"
date: 2025-10-25T18:00:00+08:00
image: ""
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["云原生"]
---



[md]# Kubernetes v1.19.16 二进制高可用部署

## 一、环境

### 服务器信息

| 主机名  | IP           | 备注                               |
| ------- | ------------ | ---------------------------------- |
| master1 | 10.3.121.20  | Master1, ETCD, Keepalived, HAProxy |
| master2 | 10.3.121.21  | Master2, ETCD, Keepalived, HAProxy |
| master3 | 10.3.121.22  | Master3, ETCD, Keepalived, HAProxy |
| worker1 | 10.3.121.23  | worker1                            |
| worker2 | 10.3.121.24  | worker2                            |
| worker3 | 10.3.121.25  | worker3                            |
| worker4 | 10.3.121.26  | worker4                            |
| SLB     | 10.3.121.100 | 虚拟IP                             |

> `API Server` 高可用通过 HAProxy + Keepalived实现。

### 服务版本与K8S集群说明

- `slb`设置`TCP监听`，监听6443端口(通过四层负载到master apiserver)。
- 所有`系统`使用 `CentOS 7.x` 版本，并且内核都升到`5.x`版本。
- K8S 集群使用 `Iptables 模式`（kube-proxy 注释中预留 `Ipvs` 模式配置）
- Calico 使用 `IPIP` 模式
- 集群使用默认 `svc.cluster.local`
- `10.10.0.1` 为集群 kubernetes svc 解析ip
- Docker CE version 20.10.17
- Kubernetes Version v1.19.16
- Etcd Version v3.4.19
- Calico Version v3.21.6
- Coredns Version 1.9.3
- Metrics-Server Version v0.6.1
- 污点添加与删除
- Ingress 安装
- Rancher 安装
- StorageClass 创建
- Harbor 安装



```bash
$ kubectl get svc

NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
kubernetes   ClusterIP   10.10.0.1    <none>        443/TCP   6d23h
```



### Service 和 Pods Ip 段划分

| 名称               | IP网段       | 备注                       |
| ------------------ | ------------ | -------------------------- |
| service-cluster-ip | 10.10.0.0/16 | 可用地址 65534             |
| pods-ip            | 10.20.0.0/16 | 可用地址 65534             |
| 集群dns            | 10.10.0.2    | 用于集群service域名解析    |
| k8s svc            | 10.10.0.1    | 集群 kubernetes svc 解析ip |

## 二、环境初始化

> 在 `master1` 安装Ansible服务

### 2.1 安装ansible软件包  需要epel源

```bash
$ yum -y install epel-release
$ yum -y install ansible
$ sed -e 's!^metalink=!#metalink=!g' \
    -e 's!^#baseurl=!baseurl=!g' \
    -e 's!//download\.fedoraproject\.org/pub!//mirrors.tuna.tsinghua.edu.cn!g' \
    -e 's!//download\.example/pub!//mirrors.tuna.tsinghua.edu.cn!g' \
    -e 's!http://mirrors!https://mirrors!g' \
    -i /etc/yum.repos.d/epel*.repo
```



### 2.3 配置主机ssh免密传输

> 在 `master1` 安装证书生成工具 cfssl，并生成相关证书

```bash
# 在master1执行
$ cd ~/
$ ssh-keygen -t rsa #全部回车
Generating public/private rsa key pair.
Enter file in which to save the key (/root/.ssh/id_rsa):
Created directory '/root/.ssh'.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /root/.ssh/id_rsa.
Your public key has been saved in /root/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:BBXtC1JRZUq0LsAPiFbzHcr0zTXnaBch5cUL75jYuNE root@localhost.localdomain
The key's randomart image is:
+---[RSA 2048]----+
|    o o.=*+.*.=o.|
|   o B =.=.= O o.|
|  o . B.+.= o * .|
| .    .=.... . o |
|       .S...= +  |
|         ..+ E . |
|            o    |
|           .     |
|                 |
+----[SHA256]-----+

# 公钥复制到所有对应主机
for i in you ip; do ssh-copy-id -i /root/.ssh/id_rsa.pub $i; done
#测试连接
$ ssh 10.3.121.21
$ cat << EOF >> /etc/ansible/hosts
[node]
10.3.121.20
10.3.121.21
10.3.121.22
10.3.121.23
10.3.121.24
10.3.121.25
10.3.121.26

[master]
10.3.121.20
10.3.121.21
10.3.121.22

[worker]
10.3.121.23
10.3.121.24
10.3.121.25
10.3.121.26
EOF

#测试
$ ansible node -m ping
```



### 2.4 设置主机名、升级内核、安装 Docker ce

运行下面 `init.sh` shell 脚本，脚本完成下面四项任务：

- 设置服务器 `hostname`
- 安装 `k8s依赖环境`
- `升级系统内核`（升级Centos7系统内核，解决Docker-ce版本兼容问题）
- 安装 `docker ce` 20.10.17 版本

> Ps：init.sh 脚本只用于 `Centos`，支持 `重复运行`。

```bash
#!/usr/bin/env bash

function Check_linux_system(){
    linux_version=`cat /etc/redhat-release`
    if [[ ${linux_version} =~ "CentOS" ]];then
        echo -e "\033[32;32m 系统为 ${linux_version} \033[0m \n"
    else
        echo -e "\033[32;32m 系统不是CentOS,该脚本只支持CentOS环境\033[0m \n"
        exit 1
    fi
}

function Set_basic(){
    systemctl status firewalld | grep dead &> /dev/null && echo -e "\033[32;32m firewalld已关闭，退出基础设置步骤 \033[0m \n" && return
    yum install -y nfs-utils curl yum-utils device-mapper-persistent-data lvm2 net-tools conntrack-tools wget vim unzip ntpdate libseccomp libtool-ltdl telnet iptables-services
    systemctl stop firewalld
    systemctl disable firewalld
    swapoff -a
    sed -i 's/.*swap.*/#&/' /etc/fstab
    setenforce 0
    sed -i "s/^SELINUX=enforcing/SELINUX=disabled/g" /etc/sysconfig/selinux
    sed -i "s/^SELINUX=enforcing/SELINUX=disabled/g" /etc/selinux/config
    sed -i "s/^SELINUX=permissive/SELINUX=disabled/g" /etc/sysconfig/selinux
    sed -i "s/^SELINUX=permissive/SELINUX=disabled/g" /etc/selinux/config
    cat << EOF >> /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
#示例：host绑定到所有节点,host名称自定义
10.3.121.20 master1
10.3.121.21 master2
10.3.121.22 master3
10.3.121.23 worker1
10.3.121.24 worker2
10.3.121.25 worker2
10.3.121.26 worker3
EOF
    local address=`ifconfig eth0 | grep inet\ | awk '{print $2}'`
    local hostname=`cat /etc/hosts | grep $address | awk '{print $2}'`
    echo "$hostname" > /etc/hostname

}

function Install_depend_environment(){
    rpm -qa | grep kernel-5 &> /dev/null && echo -e "\033[32;32m 已完成内核升级，退出依赖环境安装步骤 \033[0m \n" && return
    timedatectl set-timezone Asia/Shanghai
    ntpdate time.nist.gov
    date
    ulimit -SHn 65535
    cat << EOF >> /etc/security/limits.conf
* soft nofile 655360
* hard nofile 131072
* soft nproc 655350
* hard nproc 655350
* soft memlock unlimited
* hard memlock unlimited
EOF
    cat > /etc/modules-load.d/ipvs.conf << EOF
ip_vs
ip_vs_lc
ip_vs_wlc
ip_vs_rr
ip_vs_wrr
ip_vs_lblc
ip_vs_lblcr
ip_vs_dh
ip_vs_sh
ip_vs_fo
ip_vs_nq
ip_vs_sed
ip_vs_ftp
ip_vs_sh
nf_conntrack
ip_tables
ip_set
xt_set
ipt_set
ipt_rpfilter
ipt_REJECT
ipip
EOF
    cat << EOF > /etc/sysctl.d/k8s.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
fs.may_detach_mounts = 1
vm.overcommit_memory=1
vm.panic_on_oom=0
fs.inotify.max_user_watches=89100
fs.file-max=52706963
fs.nr_open=52706963
net.netfilter.nf_conntrack_max=2310720
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_probes = 3
net.ipv4.tcp_keepalive_intvl =15
net.ipv4.tcp_max_tw_buckets = 36000
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_max_orphans = 327680
net.ipv4.tcp_orphan_retries = 3
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.ip_conntrack_max = 131072
net.ipv4.tcp_max_syn_backlog = 16384
net.ipv4.tcp_timestamps = 0
net.core.somaxconn = 16384
EOF
    sysctl --system
}

function Install_docker(){
    rpm -qa | grep docker && echo -e "\033[32;32m 已安装docker，退出安装docker步骤 \033[0m \n" && return
    yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    yum makecache fast
    yum -y install docker-ce docker-ce-cli
    systemctl enable docker.service
    systemctl start docker.service
    systemctl stop docker.service
    vim /etc/docker/daemon.json
    {
        "exec-opts": ["native.cgroupdriver=systemd"],
        "log-driver": "json-file",
        "log-opts": {
                "max-size": "500m",
                "max-file": "3",
                "labels": "somelabel",
                "env": "os,customer"
        },
        "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn", "https://hub-mirror.c.163.com", "https://4xr1qpsp.mirror.aliyuncs.com"]
}
   
    systemctl daemon-reload
    systemctl start docker
}

# 初始化顺序
Check_linux_system && \
Set_basic && \
Install_depend_environment && \
Install_docker
```



> 在每台机器上运行 init.sh 脚本，示例如下：

```bash
# 所有节点执行，init.sh 后面接的第一个参数是设置服务器主机名
$ chmod +x init.sh && ./init.sh
$ ansible worker -m script -a 'init.sh'
# 执行完 init.sh 脚本，请重启服务器
$ ansible worker -m shell -a 'systemctl enable --now systemd-modules-load.service'

```



### 2.5 HAProxy和Keepalived部署



> master节点执行的操作

```bash
$ ansible master -m yum -a 'name=haproxy state=installed'
$ ansible master -m yum -a 'name=keepalived state=installed'

# 所有master节点操作HAProxy
$ ansible master -m shell -a 'cat > /etc/haproxy/haproxy.cfg << "EOF"
global
  maxconn 2000
  ulimit-n 16384
  log 127.0.0.1 local0 err
  stats timeout 30s
defaults
  log global
  mode http
  option httplog
  timeout connect 5000
  timeout client 50000
  timeout server 50000
  timeout http-request 15s
  timeout http-keep-alive 15s
frontend monitor-in
  bind *:33305
  mode http
  option httplog
  monitor-uri /monitor
frontend k8s-master
  bind 0.0.0.0:16443
  bind 127.0.0.1:16443
  mode tcp
  option tcplog
  tcp-request inspect-delay 5s
  default_backend k8s-master
backend k8s-master
  mode tcp
  option tcplog
  option tcp-check
  balance roundrobin
  default-server inter 10s downinter 5s rise 2 fall 2 slowstart 60s maxconn 250 maxqueue 256 weight 100
  server zb-master-01 10.3.121.20:6443 check
  server zb-master-02 10.3.121.21:6443 check
  server zb-master-03 10.3.121.22:6443 check
EOF'
```



> 登陆到 `master1`操作

```bash
$ cat > /etc/keepalived/keepalived.conf << "EOF"
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
script_user root
    enable_script_security
}
vrrp_script check_apiserver {
    script "/etc/keepalived/check_apiserver.sh"
    interval 5
    weight -5
    fall 2
    rise 1
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    mcast_src_ip 10.3.121.20
    virtual_router_id 51
    priority 100
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA_AUTH
    }
    virtual_ipaddress {
        10.3.121.100
    }
    track_script {
       check_apiserver
    }
}
EOF
```



> 登陆到 `master2`操作

```bash
$ cat > /etc/keepalived/keepalived.conf << "EOF"
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
script_user root
    enable_script_security
}
vrrp_script check_apiserver {
    script "/etc/keepalived/check_apiserver.sh"
    interval 5
    weight -5
    fall 2
    rise 1
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    mcast_src_ip 10.3.121.21
    virtual_router_id 51
    priority 99
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA_AUTH
    }
    virtual_ipaddress {
        10.3.121.100
    }
    track_script {
       check_apiserver
    }
}
EOF
```



> 登陆到 `master3`操作

```bash
$ cat > /etc/keepalived/keepalived.conf << "EOF"
! Configuration File for keepalived
global_defs {
    router_id LVS_DEVEL
script_user root
    enable_script_security
}
vrrp_script check_apiserver {
    script "/etc/keepalived/check_apiserver.sh"
    interval 5
    weight -5
    fall 2
    rise 1
}
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    mcast_src_ip 10.3.121.22
    virtual_router_id 51
    priority 98
    advert_int 2
    authentication {
        auth_type PASS
        auth_pass K8SHA_KA_AUTH
    }
    virtual_ipaddress {
        10.3.121.100
    }
    track_script {
       check_apiserver
    }
}
EOF
```



> `master`节点执行操作

```bash
#健康检查脚本
$ ansible master -m shell -a 'cat > /etc/keepalived/check_apiserver.sh << "EOF"
#!/bin/bash
err=0
for k in $(seq 1 3)
do
   check_code=$(pgrep haproxy)
   if [[ $check_code == "" ]]; then
       err=$(expr $err + 1)
       sleep 1
       continue
   else
       err=0
       break
   fi
done
if [[ $err != "0" ]]; then
   echo "systemctl stop keepalived"
   /usr/bin/systemctl stop keepalived
   exit 1
else
   exit 0
fi
EOF'

$ ansible master -m shell -a 'chmod u+x /etc/keepalived/check_apiserver.sh'

#服务启动
$ ansible master -m shell -a 'systemctl daemon-reload'
$ ansible master -m shell -a 'systemctl enable --now haproxy'
$ ansible master -m shell -a 'systemctl enable --now keepalived'
$ ansible master -m shell -a 'systemctl status haproxy keepalived'

```



## 三、Kubernetes 部署

### 部署顺序

- 1、自签TLS证书
- 2、部署Etcd集群
- 3、创建 metrics-server 证书
- 4、获取K8S二进制包
- 5、创建Node节点kubeconfig文件
- 6、配置Master组件并运行
- 7、配置kubelet证书自动续期和创建Node授权用户
- 8、配置Node组件并运行
- 9、安装calico网络，使用IPIP模式
- 10、集群CoreDNS部署
- 11、部署集群监控服务 Metrics Server
- 12、污点删除与添加
- 13、安装Ingress

### 3.1 自签TLS证书

> 在 `master1` 安装证书生成工具 cfssl，并生成相关证书

```bash
# 创建目录用于存放 K8S工具包证书
$ mkdir /data/k8s-package -p
$ cd /data/k8s-package
$ tar xf k8s-package.tar.gz

# 创建目录用于存放 SSL 证书
$ mkdir /data/ssl -p

# 下载工具
$ wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
$ wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
$ wget https://pkg.cfssl.org/R1.2/cfssl-certinfo_linux-amd64


# 添加执行权限
$ cd /data/k8s-package
$ chmod +x cfssl_linux-amd64 cfssljson_linux-amd64 cfssl-certinfo_linux-amd64

# 移动到 /usr/local/bin 目录下
$ mv cfssl_linux-amd64 /usr/bin/cfssl
$ mv cfssljson_linux-amd64  /usr/bin/cfssljson
$ mv cfssl-certinfo_linux-amd64 /usr/bin/cfssl-certinfo
```



```bash
# 进入证书目录
$ cd /data/ssl/

# 创建 certificate.sh 脚本
$ vim  certificate.sh
```



> PS：证书有效期为 `100年`，
>
> certificate.sh文件内容

```bash

cat > ca-config.json << EOF
{
  "signing": {
    "default": {
      "expiry": "876000h"
    },
    "profiles": {
      "kubernetes": {
         "expiry": "876000h",
         "usages": [
            "signing",
            "key encipherment",
            "server auth",
            "client auth"
        ]
      }
    }
  }
}
EOF

cat > ca-csr.json << EOF
{
    "CN": "kubernetes",
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "Beijing",
            "ST": "Beijing",
              "O": "k8s",
            "OU": "System"
        }
    ]
}
EOF

cfssl gencert -initca ca-csr.json | cfssljson -bare ca -

#-----------------------

cat > server-csr.json << EOF
{
    "CN": "kubernetes",
    "hosts": [
      "127.0.0.1",
      "10.3.121.20",
      "10.10.0.1",
      "10.3.121.100",
      "kubernetes",
      "kubernetes.default",
      "kubernetes.default.svc",
      "kubernetes.default.svc.cluster",
      "kubernetes.default.svc.cluster.local"
    ],
    "key": {
        "algo": "rsa",
        "size": 2048
    },
    "names": [
        {
            "C": "CN",
            "L": "BeiJing",
            "ST": "BeiJing",
            "O": "k8s",
            "OU": "System"
        }
    ]
}
EOF

cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes server-csr.json | cfssljson -bare server

#-----------------------

cat > admin-csr.json <<EOF
{
  "CN": "admin",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "L": "BeiJing",
      "ST": "BeiJing",
      "O": "system:masters",
      "OU": "System"
    }
  ]
}
EOF

cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes admin-csr.json | cfssljson -bare admin

#-----------------------

cat > kube-proxy-csr.json <<EOF
{
  "CN": "system:kube-proxy",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "L": "BeiJing",
      "ST": "BeiJing",
      "O": "k8s",
      "OU": "System"
    }
  ]
}
EOF

cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes kube-proxy-csr.json | cfssljson -bare kube-proxy
```



根据自己环境修改 `certificate.sh` 脚本

```bash
      "10.3.121.20",
      "10.3.121.21",
      "10.3.121.22",
      "10.10.0.1",
      "apiserver.cluster.local",
```



修改完脚本，然后执行

```bash
$ bash certificate.sh

-rw-r--r-- 1 root root 1009 6月  18 14:14 admin.csr
-rw-r--r-- 1 root root  229 6月  18 14:14 admin-csr.json
-rw------- 1 root root 1679 6月  18 14:14 admin-key.pem
-rw-r--r-- 1 root root 1403 6月  18 14:14 admin.pem
-rw-r--r-- 1 root root  296 6月  18 14:14 ca-config.json
-rw-r--r-- 1 root root 1001 6月  18 14:14 ca.csr
-rw-r--r-- 1 root root  266 6月  18 14:14 ca-csr.json
-rw------- 1 root root 1675 6月  18 14:14 ca-key.pem
-rw-r--r-- 1 root root 1359 6月  18 14:14 ca.pem
-rw-r--r-- 1 root root 2286 6月  18 14:14 certificate.sh
-rw-r--r-- 1 root root 1009 6月  18 14:14 kube-proxy.csr
-rw-r--r-- 1 root root  230 6月  18 14:14 kube-proxy-csr.json
-rw------- 1 root root 1675 6月  18 14:14 kube-proxy-key.pem
-rw-r--r-- 1 root root 1403 6月  18 14:14 kube-proxy.pem
-rw-r--r-- 1 root root 1269 6月  18 14:14 server.csr
-rw-r--r-- 1 root root  574 6月  18 14:14 server-csr.json
-rw------- 1 root root 1679 6月  18 14:14 server-key.pem
-rw-r--r-- 1 root root 1639 6月  18 14:14 server.pem
```

### 3.2 部署Etcd集群

> master1 机器上操作，把执行文件copy到 master2 master3

二进制包下载地址：[https://github.com/etcd-io/etcd/releases/download/v3.4.7/etcd-v3.4.7-linux-amd64.tar.gz](https://links.jianshu.com/go?to=https%3A%2F%2Fgithub.com%2Fetcd-io%2Fetcd%2Freleases%2Fdownload%2Fv3.4.7%2Fetcd-v3.4.7-linux-amd64.tar.gz)



```bash
# 创建存储etcd数据目录
$ ansible master -m shell -a 'mkdir /data/etcd/ -p'

# 创建 k8s 集群配置目录
$ ansible master -m shell -a 'mkdir /opt/kubernetes/{bin,cfg,ssl}  -p'

# 下载二进制etcd包，并把执行文件放到 /opt/kubernetes/bin/ 目录
$ cd /data/etcd/
$ tar xf /data/k8s-package/etcd-v3.4.7-linux-amd64.tar.gz -C /data/etcd/
$ cd /data/etcd/etcd-v3.4.7-linux-amd64
$ cp -a etcd etcdctl /opt/kubernetes/bin/

# 把 /opt/kubernetes/bin 目录加入到 PATH
$ ansible master -m shell -a "echo 'export PATH=$PATH:/opt/kubernetes/bin' >> /etc/profile"
$ ansible master -m shell -a 'source /etc/profile'
```



> 回到到 `master1` 操作

```bash
# 进入 K8S 集群证书目录
$ cd /data/ssl

# 把证书 copy 到 master1 机器 /opt/kubernetes/ssl/ 目录
$ cp ca*pem ca-config.json server*pem /opt/kubernetes/ssl/

# 把etcd执行文件与证书 copy 到 master2  master3 机器
# 把 etcd.sh 脚本  copy 到 master2 master3 机器上
for i in zb-master-02 zb-master-03; do
    scp -r /opt/kubernetes/ssl/*  root@$i:/opt/kubernetes/ssl/
done
```

```bash
$ cd /data/etcd

# 编写 etcd 配置文件脚本

$ vim etcd.sh
```



> `etcd.sh`文件内容

```bash
#!/bin/bash

ETCD_NAME=`cat /etc/hostname`
ETCD_IP=`ifconfig eth0 | grep inet\ | awk '{print $2}'`
ETCD_CLUSTER=${1:-"etcd01=https://127.0.0.1:2379"}

cat <<EOF >/opt/kubernetes/cfg/etcd.yml
name: ${ETCD_NAME}
data-dir: /var/lib/etcd/default.etcd
listen-peer-urls: https://${ETCD_IP}:2380
listen-client-urls: https://${ETCD_IP}:2379,https://127.0.0.1:2379

advertise-client-urls: https://${ETCD_IP}:2379
initial-advertise-peer-urls: https://${ETCD_IP}:2380
initial-cluster: ${ETCD_CLUSTER}
initial-cluster-token: etcd-cluster
initial-cluster-state: new

client-transport-security:
  cert-file: /opt/kubernetes/ssl/server.pem
  key-file: /opt/kubernetes/ssl/server-key.pem
  client-cert-auth: false
  trusted-ca-file: /opt/kubernetes/ssl/ca.pem
  auto-tls: false

peer-transport-security:
  cert-file: /opt/kubernetes/ssl/server.pem
  key-file: /opt/kubernetes/ssl/server-key.pem
  client-cert-auth: false
  trusted-ca-file: /opt/kubernetes/ssl/ca.pem
  auto-tls: false

debug: false
logger: zap
log-outputs: [stderr]
EOF

cat <<EOF >/usr/lib/systemd/system/etcd.service
[Unit]
Description=Etcd Server
Documentation=https://github.com/etcd-io/etcd
Conflicts=etcd.service
After=network.target
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
LimitNOFILE=65536
Restart=on-failure
RestartSec=5s
TimeoutStartSec=0
ExecStart=/opt/kubernetes/bin/etcd --config-file=/opt/kubernetes/cfg/etcd.yml

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable etcd
systemctl restart etcd
```

```bash
# 执行 etcd.sh 生成配置脚本
$ chmod +x etcd.sh

$ ansible master -m script -a '/data/etcd/etcd.sh zb-master-01=https://10.3.121.20:2380,zb-master-02=https://10.3.121.21:2380,zb-master-03=https://10.3.121.22:2380'

# 查看 etcd 是否启动正常
$ ansible master -m shell -a 'ps -ef | grep etcd'
$ ansible master -m shell -a 'netstat -ntplu | grep etcd'

tcp        0      0 10.3.121.20:2379      0.0.0.0:*               LISTEN      1558/etcd
tcp        0      0 127.0.0.1:2379          0.0.0.0:*               LISTEN      1558/etcd
tcp        0      0 10.3.121.20:2380      0.0.0.0:*               LISTEN      1558/etcd
```



```bash
# 随便登陆一台master机器，查看 etcd 集群是否正常
$ ETCDCTL_API=3 etcdctl --write-out=table \
--cacert=/opt/kubernetes/ssl/ca.pem --cert=/opt/kubernetes/ssl/server.pem --key=/opt/kubernetes/ssl/server-key.pem \
--endpoints=https://10.3.121.20:2379,https://10.3.121.21:2379,https://10.3.121.22:2379 endpoint health

+---------------------------------+--------+-------------+-------+
|            ENDPOINT             | HEALTH |    TOOK     | ERROR |
+---------------------------------+--------+-------------+-------+
| https://10.3.121.20:2379        |   true | 38.721248ms |       |
| https://10.3.121.21:2379        |   true | 38.621248ms |       |
| https://10.3.121.22:2379        |   true | 38.821248ms |       |
+---------------------------------+--------+-------------+-------+
```

### 3.3 创建 metrics-server 证书

创建 metrics-server 使用的证书

> 登陆到 `master1` 操作

```bash
$ cd /data/ssl/

# 注意: "CN": "system:metrics-server" 一定是这个，因为后面授权时用到这个名称，否则会报禁止匿名访问
$ cat > metrics-server-csr.json <<EOF
{
  "CN": "system:metrics-server",
  "hosts": [],
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "CN",
      "ST": "BeiJing",
      "L": "BeiJing",
      "O": "k8s",
      "OU": "system"
    }
  ]
}
EOF
```



生成 metrics-server 证书和私钥

```bash
# 生成证书
$ cfssl gencert -ca=/opt/kubernetes/ssl/ca.pem -ca-key=/opt/kubernetes/ssl/ca-key.pem -config=/opt/kubernetes/ssl/ca-config.json -profile=kubernetes metrics-server-csr.json | cfssljson -bare metrics-server

# copy 到 /opt/kubernetes/ssl 目录
$ cp metrics-server-key.pem metrics-server.pem /opt/kubernetes/ssl/

# copy 到 master2 master3 机器上
for i in zb-master-02 zb-master-03; do
    scp metrics-server-key.pem metrics-server.pem root@$i:/opt/kubernetes/ssl/
done
```



### 3.4 获取K8S二进制包

> 登陆到 `master1` 操作

```bash
# 创建存放 k8s 二进制包目录
$ cd /data/k8s-package
$ tar xf kubernetes-server-linux-amd64.tar.gz
```

master 节点需要用到：

- kubectl
- kube-scheduler
- kube-apiserver
- kube-controller-manager

node 节点需要用到：

- kubelet
- kube-proxy

> PS：本文master节点也做为一个node节点，所以需要用到 kubelet kube-proxy 执行文件



```bash
# 进入解压出来二进制包bin目录
$ cd /data/k8s-package/kubernetes/server/bin

# cpoy 执行文件到 /opt/kubernetes/bin 目录
$ cp -a kube-apiserver kube-controller-manager kube-scheduler kubectl kubelet kube-proxy /opt/kubernetes/bin

# copy 执行文件到 master2 master3 机器 /opt/kubernetes/bin 目录
for i in master2 master3; do
    scp kube-apiserver kube-controller-manager kube-scheduler kubectl kubelet kube-proxy root@$i:/opt/kubernetes/bin/
done

```

### 3.5 创建Node节点kubeconfig文件

> 登陆到 `master1` 操作

- 创建TLS Bootstrapping Token
- 创建kubelet kubeconfig
- 创建kube-proxy kubeconfig



```bash
$ cd /data/ssl/

# 修改第10行 KUBE_APISERVER 地址
$ vim kubeconfig.sh
```



> `kubeconfig.sh`文件内容

```bash
# 创建 TLS Bootstrapping Token
export BOOTSTRAP_TOKEN=$(head -c 16 /dev/urandom | od -An -t x | tr -d ' ')
cat > token.csv <<EOF
${BOOTSTRAP_TOKEN},kubelet-bootstrap,10001,"system:kubelet-bootstrap"
EOF

#----------------------

# 创建kubelet bootstrapping kubeconfig
export KUBE_APISERVER="https://10.3.121.200:16443"

# 设置集群参数
kubectl config set-cluster kubernetes \
  --certificate-authority=./ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=bootstrap.kubeconfig

# 设置客户端认证参数
kubectl config set-credentials kubelet-bootstrap \
  --token=${BOOTSTRAP_TOKEN} \
  --kubeconfig=bootstrap.kubeconfig

# 设置上下文参数
kubectl config set-context default \
  --cluster=kubernetes \
  --user=kubelet-bootstrap \
  --kubeconfig=bootstrap.kubeconfig

# 设置默认上下文
kubectl config use-context default --kubeconfig=bootstrap.kubeconfig

#----------------------

# 创建kube-proxy kubeconfig文件

kubectl config set-cluster kubernetes \
  --certificate-authority=./ca.pem \
  --embed-certs=true \
  --server=${KUBE_APISERVER} \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config set-credentials kube-proxy \
  --client-certificate=./kube-proxy.pem \
  --client-key=./kube-proxy-key.pem \
  --embed-certs=true \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config set-context default \
  --cluster=kubernetes \
  --user=kube-proxy \
  --kubeconfig=kube-proxy.kubeconfig

kubectl config use-context default --kubeconfig=kube-proxy.kubeconfig
```



```bash
# 生成证书
$ sh kubeconfig.sh

# 输出下面结果
kubeconfig.sh   kube-proxy-csr.json  kube-proxy.kubeconfig
kube-proxy.csr  kube-proxy-key.pem   kube-proxy.pem bootstrap.kubeconfig
```



```bash
# copy *kubeconfig 文件到 /opt/kubernetes/cfg 目录
$ cp *kubeconfig /opt/kubernetes/cfg

# copy 到 master2 master3 机器上
for i in 10.3.121.21 10.3.121.22; do
    scp *kubeconfig root@$i:/opt/kubernetes/cfg
done
```

### 3.6 配置Master组件并运行

> 登陆到 `master1` `master2` `master3` 操作

```bash
# 创建 /data/k8s-master 目录，用于存放 master 配置执行脚本
$ mkdir /data/k8s-master
```



> 登陆到 `master1`操作

```bash
$ cd /data/k8s-master

# 创建生成 kube-apiserver 配置文件脚本
$ vim apiserver.sh
```



> `apiserver.sh`文件内容

```bash
#!/bin/bash

MASTER_ADDRESS=`ifconfig eth0 | grep inet\ | awk '{print $2}'`
ETCD_SERVERS=${1:-"http://127.0.0.1:2379"}

cat <<EOF >/opt/kubernetes/cfg/kube-apiserver
KUBE_APISERVER_OPTS="--logtostderr=false \\
--v=2 \\
--log-dir=/var/log/kubernetes \\
--etcd-servers=${ETCD_SERVERS} \\
--bind-address=0.0.0.0 \\
--secure-port=6443 \\
--advertise-address=${MASTER_ADDRESS} \\
--allow-privileged=true \\
--service-cluster-ip-range=10.10.0.0/16 \\
--enable-admission-plugins=NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota,NodeRestriction \\
--authorization-mode=RBAC,Node \\
--kubelet-https=true \\
--enable-bootstrap-token-auth=true \\
--token-auth-file=/opt/kubernetes/cfg/token.csv \\
--service-node-port-range=1-65535 \\
--kubelet-client-certificate=/opt/kubernetes/ssl/server.pem \\
--kubelet-client-key=/opt/kubernetes/ssl/server-key.pem \\
--tls-cert-file=/opt/kubernetes/ssl/server.pem  \\
--tls-private-key-file=/opt/kubernetes/ssl/server-key.pem \\
--client-ca-file=/opt/kubernetes/ssl/ca.pem \\
--service-account-key-file=/opt/kubernetes/ssl/ca-key.pem \\
--etcd-cafile=/opt/kubernetes/ssl/ca.pem \\
--etcd-certfile=/opt/kubernetes/ssl/server.pem \\
--etcd-keyfile=/opt/kubernetes/ssl/server-key.pem \\
--requestheader-client-ca-file=/opt/kubernetes/ssl/ca.pem \\
--requestheader-extra-headers-prefix=X-Remote-Extra- \\
--requestheader-group-headers=X-Remote-Group \\
--requestheader-username-headers=X-Remote-User \\
--proxy-client-cert-file=/opt/kubernetes/ssl/metrics-server.pem \\
--proxy-client-key-file=/opt/kubernetes/ssl/metrics-server-key.pem \\
--runtime-config=api/all=true \\
--audit-log-maxage=30 \\
--audit-log-maxbackup=3 \\
--audit-log-maxsize=100 \\
--audit-log-truncate-enabled=true \\
--audit-log-path=/var/log/kubernetes/k8s-audit.log"
EOF

cat <<EOF >/usr/lib/systemd/system/kube-apiserver.service
[Unit]
Description=Kubernetes API Server
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=-/opt/kubernetes/cfg/kube-apiserver
ExecStart=/opt/kubernetes/bin/kube-apiserver \$KUBE_APISERVER_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable kube-apiserver
systemctl restart kube-apiserver
```



```bash
# 创建生成 kube-controller-manager 配置文件脚本
$ vim controller-manager.sh
```



> `controller-manager.sh`文件内容

```bash
#!/bin/bash

MASTER_ADDRESS=${1:-"127.0.0.1"}

cat <<EOF >/opt/kubernetes/cfg/kube-controller-manager
KUBE_CONTROLLER_MANAGER_OPTS="--logtostderr=true \\
--v=2 \\
--master=${MASTER_ADDRESS}:8080 \\
--leader-elect=true \\
--bind-address=0.0.0.0 \\
--service-cluster-ip-range=10.10.0.0/16 \\
--cluster-name=kubernetes \\
--cluster-signing-cert-file=/opt/kubernetes/ssl/ca.pem \\
--cluster-signing-key-file=/opt/kubernetes/ssl/ca-key.pem  \\
--service-account-private-key-file=/opt/kubernetes/ssl/ca-key.pem \\
--experimental-cluster-signing-duration=87600h0m0s \\
--feature-gates=RotateKubeletServerCertificate=true \\
--feature-gates=RotateKubeletClientCertificate=true \\
--allocate-node-cidrs=true \\
--cluster-cidr=10.20.0.0/16 \\
--root-ca-file=/opt/kubernetes/ssl/ca.pem"
EOF

cat <<EOF >/usr/lib/systemd/system/kube-controller-manager.service
[Unit]
Description=Kubernetes Controller Manager
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=-/opt/kubernetes/cfg/kube-controller-manager
ExecStart=/opt/kubernetes/bin/kube-controller-manager \$KUBE_CONTROLLER_MANAGER_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable kube-controller-manager
systemctl restart kube-controller-manager
```



```bash
# 创建生成 kube-scheduler 配置文件脚本
$ vim scheduler.sh
```



> `scheduler.sh`文件内容

```bash
#!/bin/bash

MASTER_ADDRESS=${1:-"127.0.0.1"}

cat <<EOF >/opt/kubernetes/cfg/kube-scheduler
KUBE_SCHEDULER_OPTS="--logtostderr=true \\
--v=2 \\
--master=${MASTER_ADDRESS}:8080 \\
--address=0.0.0.0 \\
--leader-elect"
EOF

cat <<EOF >/usr/lib/systemd/system/kube-scheduler.service
[Unit]
Description=Kubernetes Scheduler
Documentation=https://github.com/kubernetes/kubernetes

[Service]
EnvironmentFile=-/opt/kubernetes/cfg/kube-scheduler
ExecStart=/opt/kubernetes/bin/kube-scheduler \$KUBE_SCHEDULER_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable kube-scheduler
systemctl restart kube-scheduler
```



```bash
# 添加执行权限
$ chmod +x *.sh

$ cp /data/ssl/token.csv /opt/kubernetes/cfg/

# copy token.csv 和 master 配置到 master2 master3 机器上
for i in 10.3.121.21 10.3.121.22; do
    scp /data/ssl/token.csv root@$i:/opt/kubernetes/cfg
done       

# 生成 master配置文件并运行

$ ansible master -m script -a '/data/k8s-master/apiserver.sh https://10.3.121.20:2379,https://10.3.121.21:2379,https://10.3.121.22:2379'
$ ansible master -m script -a '/data/k8s-master/controller-manager.sh 127.0.0.1'
$ ansible master -m script -a '/data/k8s-master/scheduler.sh 127.0.0.1'

# 查看master三个服务是否正常运行
$ ps -ef | grep kube
$ netstat -ntpl | grep kube-

```



> 登陆到 `master1`

```bash
#生成管理员config文件，并存放到 ~/.kube/config 目录下
$ cd /data/ssl

$ cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=kubernetes admin-csr.json | cfssljson -bare admin

$ cp admin*.pem /opt/kubernetes/ssl/

$ kubectl config set-cluster kubernetes --certificate-authority=ca.pem --embed-certs=true --server=https://192.9.104.96:6443 --kubeconfig=kube.config

$ kubectl config set-credentials admin --client-certificate=admin.pem --client-key=admin-key.pem --embed-certs=true --kubeconfig=kube.config

$ kubectl config set-context kubernetes --cluster=kubernetes --user=admin --kubeconfig=kube.config

$ kubectl config use-context kubernetes --kubeconfig=kube.config

$ cp kube.config ~/.kube/config

for i in 10.3.121.21 10.3.121.22; do
    scp admin*.pem root@$i:/opt/kubernetes/ssl/
    scp /root/.kube/config root@$i:/root/.kube/
done

#执行验证
$ ansible master -m shell -a 'echo "export KUBECONFIG=$HOME/.kube/config" >> /etc/profile'

$ ansible master -m shell -a 'source /etc/profile'

$ ansible master -m shell -a 'kubectl cluster-info'

$ ansible master -m shell -a 'kubectl get all --all-namespaces'

# 随便登陆一台master查看集群健康状态
$ ansible master -m shell -a 'kubectl  get cs'

NAME                 STATUS    MESSAGE             ERROR
scheduler            Healthy   ok
controller-manager   Healthy   ok
etcd-2               Healthy   {"health":"true"}
etcd-1               Healthy   {"health":"true"}
etcd-0               Healthy   {"health":"true"}
```

### 3.7 配置kubelet证书自动续期和创建Node授权用户

> 登陆到 `master1` 操作

创建 `Node节点` 授权用户 `kubelet-bootstrap`

```bash
$ kubectl create clusterrolebinding  kubelet-bootstrap --clusterrole=system:node-bootstrapper  --user=kubelet-bootstrap
```



创建自动批准相关 CSR 请求的 ClusterRole

```bash
# 创建证书旋转配置存放目录
$ mkdir ~/yaml/kubelet-certificate-rotating -p
$ cd ~/yaml/kubelet-certificate-rotating
$ vim tls-instructs-csr.yaml
```



> `tls-instructs-csr.yaml `文件内容

```yaml
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: system:certificates.k8s.io:certificatesigningrequests:selfnodeserver
rules:
- apiGroups: ["certificates.k8s.io"]
  resources: ["certificatesigningrequests/selfnodeserver"]
  verbs: ["create"]
```



```bash
# 部署
$ kubectl apply -f tls-instructs-csr.yaml
```

自动批准 kubelet-bootstrap 用户 TLS bootstrapping 首次申请证书的 CSR 请求



```bash
$ kubectl create clusterrolebinding node-client-auto-approve-csr --clusterrole=system:certificates.k8s.io:certificatesigningrequests:nodeclient --user=kubelet-bootstrap
```

自动批准 system:nodes 组用户更新 kubelet 自身与 apiserver 通讯证书的 CSR 请求



```bash
$ kubectl create clusterrolebinding node-client-auto-renew-crt --clusterrole=system:certificates.k8s.io:certificatesigningrequests:selfnodeclient --group=system:nodes
```

自动批准 system:nodes 组用户更新 kubelet 10250 api 端口证书的 CSR 请求



```bash
$ kubectl create clusterrolebinding node-server-auto-renew-crt --clusterrole=system:certificates.k8s.io:certificatesigningrequests:selfnodeserver --group=system:nodes
```

### 3.8 配置Worker节点组件并运行

首先我们先了解下 `kubelet` 中 `kubelet.kubeconfig` 配置是如何生成？

`kubelet.kubeconfig` 配置是通过 `TLS Bootstrapping` 机制生成，下面是生成的流程图。

![img](?imageMogr2/auto-orient/strip|imageView2/2/w/542/format/webp)



> 登陆到master1节点操作

```bash
$ cd /data/ssl

$ BOOTSTRAP_TOKEN=$(awk -F "," '{print $1}' /opt/kubernetes/cfg/token.csv)

$ kubectl config set-cluster kubernetes --certificate-authority=ca.pem --embed-certs=true --server=https://192.9.104.96:6443 --kubeconfig=kubelet-bootstrap.kubeconfig

$ kubectl config set-credentials kubelet-bootstrap --token=${BOOTSTRAP_TOKEN} --kubeconfig=kubelet-bootstrap.kubeconfig

$ kubectl config set-context default --cluster=kubernetes --user=kubelet-bootstrap --kubeconfig=kubelet-bootstrap.kubeconfig

$ kubectl config use-context default --kubeconfig=kubelet-bootstrap.kubeconfig

$ kubectl create clusterrolebinding cluster-system-anonymous --clusterrole=cluster-admin --user=kubelet-bootstrap

$ kubectl create clusterrolebinding kubelet-bootstrap --clusterrole=system:node-bootstrapper --user=kubelet-bootstrap --kubeconfig=kubelet-bootstrap.kubeconfig
(Error from server (AlreadyExists): clusterrolebindings.rbac.authorization.k8s.io "kubelet-bootstrap" already exists)已存在就不用管

$ kubectl describe clusterrolebinding cluster-system-anonymou
Name:         cluster-system-anonymous
Labels:       <none>
Annotations:  <none>
Role:
  Kind:  ClusterRole
  Name:  cluster-admin
Subjects:
  Kind  Name               Namespace
  ----  ----               ---------
  User  kubelet-bootstrap  

$ kubectl describe clusterrolebinding kubelet-bootstra
Name:         kubelet-bootstrap
Labels:       <none>
Annotations:  <none>
Role:
  Kind:  ClusterRole
  Name:  system:node-bootstrapper
Subjects:
  Kind  Name               Namespace
  ----  ----               ---------
  User  kubelet-bootstrap
  
# 创建 node 节点生成配置目录
$ mkdir /data/k8s-node
$ cd /data/k8s-node
# 创建生成 kubelet 配置脚本
$ vim kubelet.sh
```



> `kubelet.sh`文件内容

```bash
#!/bin/bash

DNS_SERVER_IP=${1:-"10.10.0.2"}
HOSTNAME=`cat /etc/hostname`
CLUETERDOMAIN=${2:-"cluster.local"}

cat <<EOF >/opt/kubernetes/cfg/kubelet.conf
KUBELET_OPTS="--logtostderr=true \\
--v=2 \\
--hostname-override=${HOSTNAME} \\
--kubeconfig=/opt/kubernetes/cfg/kubelet.kubeconfig \\
--bootstrap-kubeconfig=/opt/kubernetes/cfg/bootstrap.kubeconfig \\
--config=/opt/kubernetes/cfg/kubelet-config.yml \\
--cert-dir=/opt/kubernetes/ssl \\
--network-plugin=cni \\
--cni-conf-dir=/etc/cni/net.d \\
--cni-bin-dir=/opt/cni/bin \\
--pod-infra-container-image=yangpeng2468/google_containers-pause-amd64:3.2"
EOF

cat <<EOF >/opt/kubernetes/cfg/kubelet-config.yml
kind: KubeletConfiguration # 使用对象
apiVersion: kubelet.config.k8s.io/v1beta1 # api版本
address: 0.0.0.0 # 监听地址
port: 10250 # 当前kubelet的端口
readOnlyPort: 10255 # kubelet暴露的端口
cgroupDriver: systemd # 驱动，要于docker info显示的驱动一致
clusterDNS:
  - ${DNS_SERVER_IP}
clusterDomain: ${CLUETERDOMAIN}  # 集群域
failSwapOn: false # 关闭swap

# 身份验证
authentication:
  anonymous:
    enabled: false
  webhook:
    cacheTTL: 2m0s
    enabled: true
  x509:
    clientCAFile: /opt/kubernetes/ssl/ca.pem

# 授权
authorization:
  mode: Webhook
  webhook:
    cacheAuthorizedTTL: 5m0s
    cacheUnauthorizedTTL: 30s

# Node 资源保留
evictionHard:
  imagefs.available: 15%
  memory.available: 1G
  nodefs.available: 10%
  nodefs.inodesFree: 5%
evictionPressureTransitionPeriod: 5m0s

# 镜像删除策略
imageGCHighThresholdPercent: 85
imageGCLowThresholdPercent: 80
imageMinimumGCAge: 2m0s

# 旋转证书
rotateCertificates: true # 旋转kubelet client 证书
featureGates:
  RotateKubeletServerCertificate: true
  RotateKubeletClientCertificate: true

maxOpenFiles: 1000000
maxPods: 60
EOF

cat <<EOF >/usr/lib/systemd/system/kubelet.service
[Unit]
Description=Kubernetes Kubelet
After=docker.service
Requires=docker.service

[Service]
EnvironmentFile=-/opt/kubernetes/cfg/kubelet.conf
ExecStart=/opt/kubernetes/bin/kubelet \$KUBELET_OPTS
Restart=on-failure
KillMode=process

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable kubelet
systemctl restart kubelet
```



```bash
# 创建生成 kube-proxy 配置脚本
$ vim proxy.sh
```



> `proxy.sh`文件内容

```bash
#!/bin/bash

HOSTNAME=`cat /etc/hostname`

cat <<EOF >/opt/kubernetes/cfg/kube-proxy.conf
KUBE_PROXY_OPTS="--logtostderr=true \\
--v=2 \\
--config=/opt/kubernetes/cfg/kube-proxy-config.yml"
EOF

cat <<EOF >/opt/kubernetes/cfg/kube-proxy-config.yml
kind: KubeProxyConfiguration
apiVersion: kubeproxy.config.k8s.io/v1alpha1
address: 0.0.0.0 # 监听地址
metricsBindAddress: 0.0.0.0:10249 # 监控指标地址,监控获取相关信息 就从这里获取
clientConnection:
  kubeconfig: /opt/kubernetes/cfg/kube-proxy.kubeconfig # 读取配置文件
hostnameOverride: ${HOSTNAME} # 注册到k8s的节点名称唯一
clusterCIDR: 10.10.0.0/16 # service IP范围
#mode: iptables # 使用iptables模式

# 使用 ipvs 模式
mode: ipvs # ipvs 模式
ipvs:
  scheduler: "rr"
iptables:
  masqueradeAll: true
EOF

cat <<EOF >/usr/lib/systemd/system/kube-proxy.service
[Unit]
Description=Kubernetes Proxy
After=network.target

[Service]
EnvironmentFile=-/opt/kubernetes/cfg/kube-proxy.conf
ExecStart=/opt/kubernetes/bin/kube-proxy \$KUBE_PROXY_OPTS
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable kube-proxy
systemctl restart kube-proxy
```



> 所有worker节点操作

```bash
# 节点生成配置目录
$ ansible worker -m shell -a 'mkdir /opt/kubernetes/{bin,cfg,ssl} -p'
$ ansible worker -m shell -a 'mkdir /data/k8s-node -p'
```



> 登陆到 `master1` 操作，将以下文件传输到各个worker节点上

```bash
# copy kubelet.sh proxy.sh 脚本到 worker节点上
$ chmod +x /data/k8s-node/*.sh


for i in k8s-test-worker-01; do
    scp -r -oHostKeyAlgorithms=+ssh-rsa /opt/kubernetes/cfg/bootstrap.kubeconfig root@$i:/opt/kubernetes/cfg/ && \
    scp -r -oHostKeyAlgorithms=+ssh-rsa /opt/kubernetes/cfg/kube-proxy.kubeconfig root@$i:/opt/kubernetes/cfg/ && \
    scp -r -oHostKeyAlgorithms=+ssh-rsa /opt/kubernetes/bin/kubelet root@$i:/opt/kubernetes/bin/ && \
    scp -r -oHostKeyAlgorithms=+ssh-rsa /opt/kubernetes/bin/kube-proxy root@$i:/opt/kubernetes/bin/ && \
    scp -r -oHostKeyAlgorithms=+ssh-rsa /opt/kubernetes/ssl/ca.pem root@$i:/opt/kubernetes/ssl/
    scp -r -oHostKeyAlgorithms=+ssh-rsa /data/k8s-node/*.sh root@$i:/data/k8s-node/
done


```



> 所有节点执 操作

```bash
# 生成 node 配置文件
$ chmod +x *.sh
$ ansible master -m script -a '/data/k8s-node/kubelet.sh 10.10.0.2 cluster.local'
$ ansible master -m script -a '/data/k8s-node/proxy.sh'
$ ansible worker -m script -a '/data/k8s-node/kubelet.sh 10.10.0.2 cluster.local'
$ ansible worker -m script -a '/data/k8s-node/proxy.sh'
# 查看服务是否启动
$ ansible worker -m shell -a "netstat -ntpl | egrep 'kubelet|kube-proxy'"
$ netstat -ntpl | egrep 'kubelet|kube-proxy'
```



```bash
# 随便登陆一台master机器查看node节点是否添加成功
$ kubectl get node

NAME       STATUS   ROLES    AGE    VERSION
master1   NoReady    <none>   4d4h   v1.19.16
master2   NoReady    <none>   4d4h   v1.19.16
master3   NoReady    <none>   4d4h   v1.19.16
worker1   NoReady    <none>   4d4h   v1.19.16
worker2   NoReady    <none>   4d4h   v1.19.16
worker3   NoReady    <none>   4d4h   v1.19.16
worker4   NoReady    <none>   4d4h   v1.19.16
```



> 上面 Node 节点处理 `NoReady` 状态，是因为目前还没有安装网络组件，下文安装网络组件。

#### 解决无法查询pods日志问题

```bash
$ vim ~/yaml/apiserver-to-kubelet-rbac.yml
```



```yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: kubelet-api-admin
subjects:
- kind: User
  name: kubernetes
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: system:kubelet-api-admin
  apiGroup: rbac.authorization.k8s.io
```



```bash
# 应用
$ kubectl apply -f ~/yaml/apiserver-to-kubelet-rbac.yml
```

### 3.9 安装calico网络

> 登陆到 `master1` 操作

下载 `Calico Version v3.14.0` Yaml 文件

```bash
$ wget https://docs.projectcalico.org/v3.21/manifests/calico.yaml --no-check-certificate
```

#### `calico-etcd.yaml` 需要修改如下配置：

##### Secret 配置修改

修改 Pods 使用的 `IP 网段`，默认使用 `192.168.0.0/16` 网段，将其修改为`10.20.0.0/16`网段

```yaml
675             #- name: CALICO_IPV4POOL_CIDR
676             #  value: "192.168.0.0/16"
675             - name: CALICO_IPV4POOL_CIDR
676               value: "10.20.0.0/16"
677             # Disable file logging so `kubectl logs` works.
678             - name: CALICO_DISABLE_FILE_LOGGING
679               value: "true"
680             # Set Felix endpoint to host default action to ACCEPT.
681             - name: FELIX_DEFAULTENDPOINTTOHOSTACTION
682               value: "ACCEPT"
683             # Disable IPv6 on Kubernetes.
684             - name: FELIX_IPV6SUPPORT
685               value: "false"
686             # Set Felix logging to "info"
687             - name: FELIX_LOGSEVERITYSCREEN
688               value: "info"
689             - name: FELIX_HEALTHENABLED
```

默认为IPIP网络模式，更改为BGP模式。

```yaml
        # Cluster type to identify the deployment type
        - name: CLUSTER_TYPE
          value: "k8s,bgp"
        # Auto-detect the BGP IP address.
        - name: IP
          value: "autodetect"
        # Enable IPIP
        - name: CALICO_IPV4POOL_IPIP
          value: "Never"
        # Enable or Disable VXLAN on the default IP pool.
        - name: CALICO_IPV4POOL_VXLAN
          value: "Never"
        # Set MTU for tunnel device used if ipip is enabled
        - name: FELIX_IPINIPMTU
```


```bash
# 通过创建必要的自定义资源来安装 Calico。
$ kubectl create -f /data/k8s-package/calico/calico.yaml

# 查看 calico pods
$ kubectl  get pods -n kube-system  | grep calico

# 查看 node 是否正常，现在 node 服务正常了
$ kubectl get node
NAME       STATUS   ROLES    AGE    VERSION
master1   Ready    <none>   4d4h   v1.19.16
master2   Ready    <none>   4d4h   v1.19.16
master3   Ready    <none>   4d4h   v1.19.16
worker1   Ready    <none>   4d4h   v1.19.16
worker2   Ready    <none>   4d4h   v1.19.16
worker3   Ready    <none>   4d4h   v1.19.16
worker4   Ready    <none>   4d4h   v1.19.16
```

### 3.10 集群CoreDNS部署

> 登陆到 `master1` 操作

`deploy.sh` 是一个便捷的脚本，用于生成coredns yaml 配置。

```bash
# 安装依赖 jq 命令
$ yum install epel-release -y
$ yum install jq -y
$ cd ~/yaml
$ mkdir coredns
$ cd coredns

# 下载 CoreDNS 项目
$ git clone https://github.com/coredns/deployment.git
$ cd coredns/deployment/kubernetes

$ vim deploy.sh
```



默认情况下 `CLUSTER_DNS_IP` 是自动获取kube-dns的集群ip的，但是由于没有部署kube-dns所以只能手动指定一个集群ip。

```yaml
103 if [[ -z $CLUSTER_DNS_IP ]]; then
104   # Default IP to kube-dns IP
105   # CLUSTER_DNS_IP=$(kubectl get service --namespace kube-system kube-dns -o jsonpath="{.spec.clusterIP}")
106   CLUSTER_DNS_IP=10.10.0.2
```



```bash
# 查看执行效果，并未开始部署
$ ./deploy.sh

# 执行部署
$ ./deploy.sh | kubectl apply -f -

# 查看 Coredns
$ kubectl get svc,pods -n kube-system| grep coredns
```



测试 Coredns 解析



busybox.yaml

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  namespace: default
spec:
  containers:
  - name: busybox
    image: busybox:1.28.4
    command:
      - sleep
      - "3600"
    imagePullPolicy: IfNotPresent
  restartPolicy: Always
```





```bash
# 部署
$ kubectl apply -f busybox.yaml

# 测试解析，下面是解析正常
$ kubectl exec -i busybox -n default -- nslookup kubernetes

Server:    10.10.0.2
Address 1: 10.10.0.2 kube-dns.kube-system.svc.cluster.local

Name:      kubernetes
Address 1: 10.10.0.1 kubernetes.default.svc.cluster.local
```



### 3.11 部署集群监控服务 Metrics Server

> 登陆到 `master1` 操作

```bash
$ cd /data/k8s-package/metrics-server/deploy/1.8+
```

```bash
# 部署
$ kubectl apply -f .

# 验证
$ kubectl top node
NAME       CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
master1   72m          7%     7921Mi          53%
master2   121m         3%     7852Mi          42%
master3   300m         3%     7833Mi          46%
worker1   154m         1%     31833Mi          4%
worker2   745m         1%     31345Mi          3%
worker3   131m         1%     31452Mi          5%
worker4   174m         1%     31213Mi          6%
# 内存单位 Mi=1024*1024字节  M=1000*1000字节
# CPU单位 1核=1000m 即 250m=1/4核
```

### 3.12 污点添加和删除

```bash
# 添加污点
$ kubectl taint node k8s-master node-role.kubernetes.io/master:NoSchedule
node/k8s-master tainted
#查看
$ kubectl describe node k8s-master | grep Taint
Taints:             node-role.kubernetes.io/master:NoSchedule

#移除污点
$ kubectl taint node k8s-master node-role.kubernetes.io/master:NoSchedule-
```

### 3.13 Ingress 安装

```bash
# 在master1节点执行
$ cd /data/k8s-package/ingress
$ kubectl apply -f nginx-ingress.yaml

$ kubectl get pods -n ingress-nginx -o wide
NAME                                        READY   STATUS      RESTARTS   AGE     IP              NODE         NOMINATED NODE   READINESS GATES
ingress-nginx-admission-create-54blj        0/1     Completed   0          2m49s   10.20.254.145   k8s-worker   <none>           <none>
ingress-nginx-admission-patch-k5fdk         0/1     Completed   0          2m49s   10.20.254.146   k8s-worker   <none>           <none>
ingress-nginx-controller-75599f77c7-5nvx7   1/1     Running     0          2m49s   10.20.254.147   k8s-worker   <none>           <none>

#创建一个demo验证
$ kubectl apply -f ingress-demo-app.yaml

$ kubectl get ingress ingress-test -o wide
NAME           CLASS    HOSTS            ADDRESS       PORTS   AGE
ingress-test   <none>   ingress.k8s.io   10.3.121.25   80      3m34s

```



nginx-ingress-controller.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx

---

kind: ConfigMap
apiVersion: v1
metadata:
  name: nginx-configuration
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx

---
kind: ConfigMap
apiVersion: v1
metadata:
  name: tcp-services
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx

---
kind: ConfigMap
apiVersion: v1
metadata:
  name: udp-services
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nginx-ingress-serviceaccount
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx

---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: nginx-ingress-clusterrole
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
rules:
  - apiGroups:
      - ""
    resources:
      - configmaps
      - endpoints
      - nodes
      - pods
      - secrets
    verbs:
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - nodes
    verbs:
      - get
  - apiGroups:
      - ""
    resources:
      - services
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - ""
    resources:
      - events
    verbs:
      - create
      - patch
  - apiGroups:
      - "extensions"
      - "networking.k8s.io"
    resources:
      - ingresses
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - "extensions"
      - "networking.k8s.io"
    resources:
      - ingresses/status
    verbs:
      - update

---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: Role
metadata:
  name: nginx-ingress-role
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
rules:
  - apiGroups:
      - ""
    resources:
      - configmaps
      - pods
      - secrets
      - namespaces
    verbs:
      - get
  - apiGroups:
      - ""
    resources:
      - configmaps
    resourceNames:
      # Defaults to "<election-id>-<ingress-class>"
      # Here: "<ingress-controller-leader>-<nginx>"
      # This has to be adapted if you change either parameter
      # when launching the nginx-ingress-controller.
      - "ingress-controller-leader-nginx"
    verbs:
      - get
      - update
  - apiGroups:
      - ""
    resources:
      - configmaps
    verbs:
      - create
  - apiGroups:
      - ""
    resources:
      - endpoints
    verbs:
      - get

---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: RoleBinding
metadata:
  name: nginx-ingress-role-nisa-binding
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: nginx-ingress-role
subjects:
  - kind: ServiceAccount
    name: nginx-ingress-serviceaccount
    namespace: ingress-nginx

---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: nginx-ingress-clusterrole-nisa-binding
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: nginx-ingress-clusterrole
subjects:
  - kind: ServiceAccount
    name: nginx-ingress-serviceaccount
    namespace: ingress-nginx

---

apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-ingress-controller
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: ingress-nginx
      app.kubernetes.io/part-of: ingress-nginx
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ingress-nginx
        app.kubernetes.io/part-of: ingress-nginx
      annotations:
        prometheus.io/port: "10254"
        prometheus.io/scrape: "true"
    spec:
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: nginx-ingress-controller
                operator: In
                values:
                - "true"
    spec:
      # wait up to five minutes for the drain of connections
      terminationGracePeriodSeconds: 300
      serviceAccountName: nginx-ingress-serviceaccount
      nodeSelector:
        kubernetes.io/os: linux
      containers:
        - name: nginx-ingress-controller
          image: quay.io/kubernetes-ingress-controller/nginx-ingress-controller:0.30.0
          args:
            - /nginx-ingress-controller
            - --configmap=$(POD_NAMESPACE)/nginx-configuration
            - --tcp-services-configmap=$(POD_NAMESPACE)/tcp-services
            - --udp-services-configmap=$(POD_NAMESPACE)/udp-services
            - --publish-service=$(POD_NAMESPACE)/ingress-nginx
            - --annotations-prefix=nginx.ingress.kubernetes.io
          securityContext:
            allowPrivilegeEscalation: true
            capabilities:
              drop:
                - ALL
              add:
                - NET_BIND_SERVICE
            # www-data -> 101
            runAsUser: 101
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: POD_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
          ports:
            - name: http
              containerPort: 80
              protocol: TCP
              hostIP: your ip
              hostPort: 80
            - name: https
              containerPort: 443
              protocol: TCP
              hostIP: your ip
              hostPort: 443
          livenessProbe:
            failureThreshold: 3
            httpGet:
              path: /healthz
              port: 10254
              scheme: HTTP
            initialDelaySeconds: 10
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 10
          readinessProbe:
            failureThreshold: 3
            httpGet:
              path: /healthz
              port: 10254
              scheme: HTTP
            periodSeconds: 10
            successThreshold: 1
            timeoutSeconds: 10
          lifecycle:
            preStop:
              exec:
                command:
                  - /wait-shutdown
                  ##nodeName: zb-master-01
---

apiVersion: v1
kind: LimitRange
metadata:
  name: ingress-nginx
  namespace: ingress-nginx
  labels:
    app.kubernetes.io/name: ingress-nginx
    app.kubernetes.io/part-of: ingress-nginx
spec:
  limits:
  - min:
      memory: 90Mi
      cpu: 100m
    type: Container

```



### 3.14 Rancher 安装

```bash
添加helm仓库：
$ cd /data/k8s-package/
$ tar xf helm-v3.3.4-linux-amd64.tar.gz
$ chmod +x linux-amd64/helm
$ mv linux-amd64/helm /usr/local/sbin/
请将命令中的<CHART_REPO>，替换为latest，stable或alpha。更多信息，请查看选择 Rancher 版本来选择最适合你的仓库。

latest: 建议在尝试新功能时使用。
stable: 建议在生产环境中使用。（推荐）
alpha: 未来版本的实验性预览。
注意：不支持从 Alpha 到 Alpha 之间的升级。

$ helm repo add rancher-stable http://rancher-mirror.oss-cn-beijing.aliyuncs.com/server-charts/stable
创建命名空间：
$ kubectl create namespace cattle-system

使用rancher生成的证书：
$ cd /data/k8s-package
$ kubectl apply -f cert-manager.crds.yaml

添加 Jetstack Helm 仓库：
$ helm repo add jetstack https://charts.jetstack.io

更新本地 Helm chart 仓库缓存
$ helm repo update

$ helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.5.1
NAME: cert-manager
LAST DEPLOYED: Sun Jun 19 15:46:46 2022
NAMESPACE: cert-manager
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
cert-manager v1.5.1 has been deployed successfully!

In order to begin issuing certificates, you will need to set up a ClusterIssuer
or Issuer resource (for example, by creating a 'letsencrypt-staging' issuer).

More information on the different types of issuers and how to configure them
can be found in our documentation:

https://cert-manager.io/docs/configuration/

For information on how to configure cert-manager to automatically provision
Certificates for Ingress resources, take a look at the `ingress-shim`
documentation:

https://cert-manager.io/docs/usage/ingress/

$ helm install rancher rancher-stable/rancher \
--namespace cattle-system \
--set hostname=zb.rancher.k8s.io \
--set replicas=3 \
--version v2.5.12
NAME: rancher
LAST DEPLOYED: Sun Jun 19 01:56:00 2022
NAMESPACE: cattle-system
STATUS: deployed
REVISION: 1
TEST SUITE: None
NOTES:
Rancher Server has been installed.

NOTE: Rancher may take several minutes to fully initialize. Please standby while Certificates are being issued and Ingress comes up.

Check out our docs at https://rancher.com/docs/rancher/v2.x/en/

Browse to https://rancher.example.local

Happy Containering!

```



### 3.15 StorageClass 创建，以提供PVC

> 仅示例，通过NFS挂载共享，建议通过外部高可用性存储挂载共享

```bash
$ yum install -y nfs-utils

$ echo "/data/storageClass *(insecure,rw,sync,no_root_squash)" > /etc/exports

# 在master执行
$ chmod -R 777 /data/storageClass

# 使配置生效
$ exportfs -r

#检查配置是否生效
$ exportfs

$ systemctl enable rpcbind && systemctl start rpcbind

$ systemctl enable nfs && systemctl start nfs
```

```
创建nfs-client-provisioner.yaml文件
```

> `nfs-client-provisioner.yaml`文件内容

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: nfs-provisioner
  namespace: default
---
kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
   name: nfs-provisioner-runner
   namespace: default
rules:
   -  apiGroups: [""]
      resources: ["persistentvolumes"]
      verbs: ["get", "list", "watch", "create", "delete"]
   -  apiGroups: [""]
      resources: ["persistentvolumeclaims"]
      verbs: ["get", "list", "watch", "update"]
   -  apiGroups: ["storage.k8s.io"]
      resources: ["storageclasses"]
      verbs: ["get", "list", "watch"]
   -  apiGroups: [""]
      resources: ["events"]
      verbs: ["watch", "create", "update", "patch"]
   -  apiGroups: [""]
      resources: ["services", "endpoints"]
      verbs: ["get","create","list", "watch","update"]
   -  apiGroups: ["extensions"]
      resources: ["podsecuritypolicies"]
      resourceNames: ["nfs-provisioner"]
      verbs: ["use"]
---
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: run-nfs-provisioner
subjects:
  - kind: ServiceAccount
    name: nfs-provisioner
    namespace: default
roleRef:
  kind: ClusterRole
  name: nfs-provisioner-runner
  apiGroup: rbac.authorization.k8s.io
---
apiVersion: storage.k8s.io/v1beta1
kind: StorageClass
metadata:
  name: nfs-storage
  namespace: default
provisioner: nfs
reclaimPolicy: Retain
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nfs-client-provisioner
  namespace: default
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nfs-client-provisioner
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: nfs-client-provisioner
    spec:
      serviceAccount: nfs-provisioner
      containers:
        - name: guosen-nfs-client-provisioner
          image: registry.cn-hangzhou.aliyuncs.com/open-ali/nfs-client-provisioner
          imagePullPolicy: IfNotPresent
          volumeMounts:
            - name: nfs-client-root
              mountPath:  /persistentvolumes
          env:
            - name: PROVISIONER_NAME
              value: nfs
            - name: NFS_SERVER
              value: 10.3.121.20
            - name: NFS_PATH
              value: /data/storageClass
      volumes:
        - name: nfs-client-root
          nfs:
            server: 10.3.121.20
            path: /data/storageClass
```

```bash
$ kubectl create -f nfs-client-provisioner.yaml
```[/md]