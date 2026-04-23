---
title: "OpenStack组件安装指南：操作系统选择与安装方式"
description: "详解OpenStack安装方式，支持的操作系统，控制节点和计算节点的组件安装步骤"
date: 2026-04-14T08:00:00+08:00
categories: ["技术分享"]
tags:
  - OpenStack
  - 安装部署
  - Ubuntu
  - CentOS
  - Rocky Linux
comments: true
---

## 前言

很多人问：OpenStack是不是要用专门的系统？或者需要定制的ISO？

**答案：不需要！**

OpenStack可以安装在普通的Linux系统上，就像安装其他软件一样简单。

---

## 一、OpenStack支持哪些操作系统？

### 1.1 官方支持的操作系统

OpenStack对操作系统非常包容，主流的Linux都可以安装：

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenStack 支持的操作系统                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ⭐ Ubuntu                        ⭐ Rocky Linux               │
│      Ubuntu 22.04 LTS (Jammy)        Rocky Linux 8/9            │
│      Ubuntu 24.04 LTS (Noble)                                   │
│                                                                 │
│   ⭐ Debian                         ⭐ Oracle Linux              │
│      Debian 11 (Bullseye)             Oracle Linux 8/9           │
│      Debian 12 (Bookworm)                                       │
│                                                                 │
│   ⭐ CentOS Stream                   ⭐ Red Hat Enterprise      │
│      CentOS Stream 8/9                 RHEL 8/9                  │
│                                                                 │
│   ⭐ SUSE Linux Enterprise                                      │
│      SLE 15 SP4+                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 各操作系统对比

| 操作系统 | 推荐度 | 说明 |
|----------|--------|------|
| **Ubuntu Server** | ⭐⭐⭐⭐⭐ | 官方推荐，更新快，文档丰富 |
| **Rocky Linux** | ⭐⭐⭐⭐⭐ | CentOS替代，社区活跃 |
| **CentOS Stream** | ⭐⭐⭐⭐ | 免费，但Stream版本不稳定 |
| **RHEL** | ⭐⭐⭐⭐ | 企业首选，有商业支持 |
| **Debian** | ⭐⭐⭐ | 稳定，但包可能较旧 |
| **SUSE SLE** | ⭐⭐⭐ | 企业使用，有商业支持 |

### 1.3 我的推荐

```
学习/个人使用：Ubuntu Server 22.04 LTS
├── 安装简单
├── 文档最多
├── 社区活跃
└── 遇到问题容易找到答案

生产环境：Rocky Linux 9 或 Ubuntu 22.04 LTS
├── Rocky Linux：CentOS替代，稳定性好
├── Ubuntu：社区大，企业也常用
└── RHEL：有商业支持，企业首选
```

---

## 二、安装OpenStack的几种方式

### 2.1 安装方式一览

```
┌─────────────────────────────────────────────────────────────────┐
│                      OpenStack 安装方式                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   方式一：官方仓库安装 ⭐⭐⭐⭐⭐                                  │
│   ├── apt install / yum install                                 │
│   ├── 最简单，推荐新手                                           │
│   └── Ubuntu/CentOS官方仓库                                     │
│                                                                 │
│   方式二：DevStack ⭐⭐⭐⭐                                      │
│   ├── 官方推荐的开发/学习工具                                    │
│   ├── 一键脚本安装                                              │
│   └── 适合快速体验                                              │
│                                                                 │
│   方式三：MicroStack ⭐⭐⭐⭐                                    │
│   ├── Canonical出品的简化版                                      │
│   ├── 一键安装，单节点                                          │
│   └── 适合完全新手                                              │
│                                                                 │
│   方式四：Kolla-Ansible ⭐⭐⭐⭐                                 │
│   ├── 容器化部署                                                │
│   ├── 高可用支持                                                │
│   └── 生产环境推荐                                              │
│                                                                 │
│   方式五：TripleO ⭐⭐⭐                                        │
│   ├── OpenStack on OpenStack                                   │
│   ├── Undercloud + Overcloud                                    │
│   └── 复杂，大型生产环境                                         │
│                                                                 │
│   方式六：源码安装 ⭐⭐                                          │
│   ├── 从GitHub编译                                              │
│   ├── 适合开发者                                                │
│   └── 不推荐新手                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 方式一：官方仓库安装（推荐）

**原理：**

```
普通Linux系统
     │
     ▼
添加OpenStack官方仓库
     │
     ▼
apt install openstack 或 yum install openstack
     │
     ▼
自动安装所有组件
     │
     ▼
配置OpenStack ✓
```

**特点：**
- ✅ 最接近生产环境
- ✅ 可以自定义安装
- ✅ 学会后可以直接用于生产
- ❌ 配置较多，需要手动配置

---

### 2.3 方式二：DevStack（学习推荐）

**原理：**

```
Ubuntu/CentOS系统
     │
     ▼
下载DevStack脚本
     │
     ▼
编写local.conf配置文件
     │
     ▼
执行./stack.sh
     │
     ▼
全自动安装 ✓
```

**特点：**
- ✅ 一键安装，非常简单
- ✅ 适合学习、测试
- ✅ 可以快速体验OpenStack
- ❌ 不适合生产环境
- ❌ 只支持All-in-One

---

### 2.4 方式三：MicroStack（完全新手）

**原理：**

```
Ubuntu系统
     │
     ▼
snap install microstack
     │
     ▼
microstack init --auto
     │
     ▼
完成！ ✓
```

**特点：**
- ✅ 超级简单，3条命令搞定
- ✅ Canonical官方维护
- ❌ 功能简化
- ❌ 不支持分布式部署

---

## 三、Ubuntu系统安装OpenStack详解

### 3.1 前提条件

**支持的Ubuntu版本：**
- Ubuntu 22.04 LTS (Jammy) ⭐ 推荐
- Ubuntu 24.04 LTS (Noble)

**系统要求：**

| 组件 | 最低要求 | 推荐配置 |
|------|----------|----------|
| CPU | 4核心 | 8+核心 |
| 内存 | 8GB | 16GB+ |
| 磁盘 | 40GB | 100GB+ |
| 网络 | 1块网卡 | 2块网卡 |

**启用硬件虚拟化：**

```bash
# 检查CPU是否支持虚拟化
egrep -c '(vmx|svm)' /proc/cpuinfo
# 输出大于0表示支持

# 如果在虚拟机中，确保启用嵌套虚拟化
# VMware: 勾选 "Virtualize Intel VT-x/EPT"
# KVM: 已默认支持
```

---

### 3.2 控制节点安装（Ubuntu 22.04）

#### 第一步：系统准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置主机名
sudo hostnamectl set-hostname controller

# 配置hosts文件
sudo tee /etc/hosts << EOF
127.0.0.1 localhost
192.168.1.100 controller
192.168.1.101 compute1
EOF

# 安装基础软件
sudo apt install -y chrony vim curl wget git
```

#### 第二步：安装数据库（MySQL/MariaDB）

```bash
# 安装MariaDB
sudo apt install -y mariadb-server python3-pymysql

# 创建配置文件
sudo tee /etc/mysql/mariadb.conf.d/99-openstack.cnf << 'EOF'
[mysqld]
bind-address = 0.0.0.0
default-storage-engine = innodb
innodb_file_per_table = on
max_connections = 4096
collation-server = utf8_general_ci
character-set-server = utf8
EOF

# 启动服务
sudo systemctl enable mariadb
sudo systemctl start mariadb

# 安全初始化
sudo mysql_secure_installation
```

#### 第三步：安装消息队列（RabbitMQ）

```bash
# 安装RabbitMQ
sudo apt install -y rabbitmq-server

# 启动服务
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server

# 创建OpenStack用户
sudo rabbitmqctl add_user openstack RABBIT_PASS
sudo rabbitmqctl set_permissions openstack ".*" ".*" ".*"
```

#### 第四步：安装Memcached

```bash
# 安装Memcached
sudo apt install -y memcached python3-memcache

# 配置Memcached
sudo sed -i 's/127.0.0.1/0.0.0.0/g' /etc/memcached.conf

# 启动服务
sudo systemctl enable memcached
sudo systemctl start memcached
```

#### 第五步：添加OpenStack仓库

```bash
# 安装OpenStack仓库工具
sudo apt install -y software-properties-common

# 添加OpenStack Yoga仓库（Ubuntu 22.04）
sudo add-apt-repository cloud-archive:yoga

# 更新软件包
sudo apt update && apt dist-upgrade -y
```

#### 第六步：安装OpenStack核心组件

```bash
# 安装Keystone（身份认证）
sudo apt install -y keystone

# 安装Glance（镜像服务）
sudo apt install -y glance

# 安装Nova（计算服务 - 控制部分）
sudo apt install -y nova-api nova-scheduler nova-conductor nova-novncproxy

# 安装Placement（资源追踪）
sudo apt install -y placement-api

# 安装Neutron（网络服务 - 控制部分）
sudo apt install -y neutron-server neutron-dhcp-agent neutron-l3-agent neutron-linuxbridge-agent neutron-metadata-agent

# 安装Horizon（Web界面）
sudo apt install -y horizon
```

#### 第七步：配置各组件

```bash
# 配置Keystone
# （需要编辑 /etc/keystone/keystone.conf）

# 配置Glance
# （需要编辑 /etc/glance/glance-api.conf）

# 配置Nova
# （需要编辑 /etc/nova/nova.conf）

# 配置Neutron
# （需要编辑 /etc/neutron/neutron.conf）

# 同步数据库
sudo su -s /bin/bash -c "keystone-manage db_sync" keystone
sudo su -s /bin/bash -c "glance-manage db_sync" glance
sudo su -s /bin/bash -c "nova-manage api_db sync" nova
sudo su -s /bin/bash -c "nova-manage db sync" nova

# 重启所有服务
sudo systemctl restart keystone
sudo systemctl restart glance-api
sudo systemctl restart nova-api
sudo systemctl restart nova-scheduler
sudo systemctl restart nova-conductor
sudo systemctl restart neutron-server
```

#### 控制节点完整安装脚本

```bash
#!/bin/bash
# 控制节点一键安装脚本 (Ubuntu 22.04)
# ⚠️ 仅供参考，生产环境请手动配置

set -e

echo "========== 开始安装OpenStack控制节点 =========="

# 1. 系统准备
echo "[1/7] 系统准备..."
apt update && apt upgrade -y
apt install -y chrony vim curl wget git software-properties-common

# 2. 安装数据库
echo "[2/7] 安装数据库..."
apt install -y mariadb-server python3-pymysql
cat > /etc/mysql/mariadb.conf.d/99-openstack.cnf << 'EOF'
[mysqld]
bind-address = 0.0.0.0
default-storage-engine = innodb
innodb_file_per_table = on
max_connections = 4096
EOF
systemctl enable mariadb
systemctl start mariadb

# 3. 安装消息队列
echo "[3/7] 安装消息队列..."
apt install -y rabbitmq-server
systemctl enable rabbitmq-server
systemctl start rabbitmq-server
rabbitmqctl set_permissions openstack ".*" ".*" ".*"

# 4. 安装Memcached
echo "[4/7] 安装Memcached..."
apt install -y memcached python3-memcache
sed -i 's/127.0.0.1/0.0.0.0/g' /etc/memcached.conf
systemctl enable memcached
systemctl start memcached

# 5. 添加OpenStack仓库
echo "[5/7] 添加OpenStack仓库..."
add-apt-repository cloud-archive:yoga -y
apt update && apt dist-upgrade -y

# 6. 安装OpenStack组件
echo "[6/7] 安装OpenStack组件..."
apt install -y keystone glancePlacement
apt install -y nova-api nova-scheduler nova-conductor nova-novncproxy
apt install -y neutron-server neutron-dhcp-agent neutron-l3-agent neutron-linuxbridge-agent neutron-metadata-agent
apt install -y horizon

# 7. 同步数据库
echo "[7/7] 同步数据库..."
# 需要先配置各组件的配置文件后执行
# sudo -u keystone keystone-manage db_sync
# sudo -u glance glance-manage db_sync
# sudo -u nova nova-manage api_db sync
# sudo -u nova nova-manage db sync

echo "========== 控制节点基础安装完成 =========="
echo "下一步：请配置各组件的配置文件"
```

---

### 3.3 计算节点安装（Ubuntu 22.04）

计算节点比控制节点简单得多，只需要安装必要的组件。

#### 第一步：系统准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 配置主机名
sudo hostnamectl set-hostname compute1

# 配置hosts文件
sudo tee /etc/hosts << EOF
127.0.0.1 localhost
192.168.1.100 controller
192.168.1.101 compute1
EOF

# 安装基础软件
sudo apt install -y chrony vim curl wget
```

#### 第二步：安装KVM虚拟化

```bash
# 安装KVM和依赖
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

# 验证KVM安装
kvm-ok
# 应该输出：KVM acceleration can be used

# 查看KVM模块
lsmod | grep kvm
# 应该显示：kvm_intel 或 kvm_amd
```

#### 第三步：启用IP转发和网桥

```bash
# 编辑sysctl配置
cat >> /etc/sysctl.conf << 'EOF'
net.ipv4.ip_forward=1
net.bridge.bridge-nf-call-iptables=1
net.bridge.bridge-nf-call-ip6tables=1
EOF

# 生效配置
sysctl -p
```

#### 第四步：添加OpenStack仓库

```bash
# 添加OpenStack仓库（与控制节点一致）
sudo add-apt-repository cloud-archive:yoga -y
sudo apt update && apt dist-upgrade -y
```

#### 第五步：安装计算组件

```bash
# 安装Nova Compute（KVM）
sudo apt install -y nova-compute

# 安装Neutron网络代理（Linuxbridge）
sudo apt install -y neutron-linuxbridge-agent

# 安装Placement客户端
sudo apt install -yPlacement-agent
```

#### 第六步：配置连接到控制节点

```bash
# 编辑 /etc/nova/nova.conf
# 需要配置以下内容：
[DEFAULT]
auth_url = http://192.168.1.100:5000/v3
mysql = mysql+pymysql://nova:NOVA_DBPASS@192.168.1.100/nova
rabbit_host = 192.168.1.100
rabbit_user = openstack
rabbit_password = RABBIT_PASS

[placement]
auth_url = http://192.168.1.100:5000/v3
auth_type = password
username = placement
password = PLACEMENT_PASS
project_domain_name = Default
user_domain_name = Default

[neutron]
auth_url = http://192.168.1.100:5000/v3
auth_type = password
username = neutron
password = NEUTRON_PASS
project_domain_name = Default
user_domain_name = Default
```

#### 第七步：启动服务

```bash
# 启用并启动服务
sudo systemctl enable nova-compute
sudo systemctl enable neutron-linuxbridge-agent

sudo systemctl start nova-compute
sudo systemctl start neutron-linuxbridge-agent
```

#### 计算节点完整安装脚本

```bash
#!/bin/bash
# 计算节点一键安装脚本 (Ubuntu 22.04)
# ⚠️ 仅供参考，生产环境请手动配置

set -e

echo "========== 开始安装OpenStack计算节点 =========="

# 1. 系统准备
echo "[1/6] 系统准备..."
apt update && apt upgrade -y
apt install -y chrony vim curl wget

# 2. 安装KVM虚拟化
echo "[2/6] 安装KVM虚拟化..."
apt install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

# 验证KVM
kvm-ok || echo "警告：KVM可能无法正常工作"

# 3. 配置内核参数
echo "[3/6] 配置内核参数..."
cat >> /etc/sysctl.conf << 'EOF'
net.ipv4.ip_forward=1
net.bridge.bridge-nf-call-iptables=1
EOF
sysctl -p

# 4. 添加OpenStack仓库
echo "[4/6] 添加OpenStack仓库..."
add-apt-repository cloud-archive:yoga -y
apt update && apt dist-upgrade -y

# 5. 安装OpenStack组件
echo "[5/6] 安装OpenStack组件..."
apt install -y nova-compute
apt install -y neutron-linuxbridge-agent
apt install -yPlacement-agent

# 6. 启动服务
echo "[6/6] 启动服务..."
systemctl enable nova-compute
systemctl enable neutron-linuxbridge-agent
systemctl start nova-compute
systemctl start neutron-linuxbridge-agent

echo "========== 计算节点安装完成 =========="
echo "下一步：在控制节点验证计算节点是否注册成功"
```

---

## 四、CentOS/Rocky Linux安装OpenStack

### 4.1 CentOS Stream 9 安装

Rocky Linux和CentOS Stream的安装方式基本相同，以Rocky Linux为例：

#### 控制节点安装（Rocky Linux 9）

```bash
# 1. 安装OpenStack仓库
sudo dnf install -y centos-release-openstack-yoga
sudo dnf config-manager --enable openstack-yoga

# 2. 更新系统
sudo dnf update -y

# 3. 安装数据库
sudo dnf install -y mariadb-server python3-mariadb

# 4. 安装消息队列
sudo dnf install -y rabbitmq-server

# 5. 安装Memcached
sudo dnf install -y memcached python3-memcached

# 6. 安装OpenStack组件
sudo dnf install -y openstack-keystone
sudo dnf install -y openstack-glance
sudo dnf install -y openstack-nova-api openstack-nova-scheduler openstack-nova-conductor
sudo dnf install -y openstack-placement-api
sudo dnf install -y openstack-neutron openstack-neutron-linuxbridge-agent
sudo dnf install -y openstack-dashboard

# 7. 启动服务
sudo systemctl enable mariadb
sudo systemctl start mariadb
sudo systemctl enable rabbitmq-server
sudo systemctl start rabbitmq-server
sudo systemctl enable memcached
sudo systemctl start memcached
```

#### 计算节点安装（Rocky Linux 9）

```bash
# 1. 安装OpenStack仓库
sudo dnf install -y centos-release-openstack-yoga
sudo dnf config-manager --enable openstack-yoga

# 2. 更新系统
sudo dnf update -y

# 3. 安装KVM虚拟化
sudo dnf install -y qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils

# 4. 安装OpenStack计算组件
sudo dnf install -y openstack-nova-compute
sudo dnf install -y openstack-neutron-linuxbridge-agent
sudo dnf install -y openstack-placement

# 5. 启用服务
sudo systemctl enable libvirtd
sudo systemctl start libvirtd
sudo systemctl enable openstack-nova-compute
sudo systemctl start openstack-nova-compute
```

---

## 五、不需要定制ISO！

### 5.1 常见误区

```
❌ 误区1：OpenStack需要专用系统
   真相：普通的Ubuntu、CentOS就可以安装

❌ 误区2：需要下载OpenStack定制的ISO
   真相：不需要，从官方仓库安装即可

❌ 误区3：OpenStack只能在虚拟机里运行
   真相：可以安装在物理机上，也可以虚拟机里
```

### 5.2 安装原理

```
┌─────────────────────────────────────────────────────────────────┐
│                    OpenStack安装原理                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. 安装普通Linux系统（Ubuntu/CentOS/Rocky）                   │
│      └── 就像安装普通服务器一样                                   │
│                                                                 │
│   2. 添加OpenStack官方仓库                                       │
│      └── apt/yum 添加一个软件源                                  │
│                                                                 │
│   3. 安装OpenStack软件包                                         │
│      └── apt install openstack-xxx                             │
│      └── yum install openstack-xxx                              │
│                                                                 │
│   4. 配置各组件                                                  │
│      └── 编辑配置文件                                            │
│      └── 连接数据库                                              │
│      └── 连接消息队列                                            │
│                                                                 │
│   5. 启动服务                                                    │
│      └── systemctl start openstack-xxx                          │
│                                                                 │
│   就是这么简单！                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 需要的软件

```
安装OpenStack只需要：

1. 一个普通的Linux系统
   ├── Ubuntu Server 22.04/24.04
   ├── Rocky Linux 8/9
   ├── CentOS Stream 8/9
   ├── Debian 11/12
   └── RHEL 8/9

2. 网络连接（下载软件包）

3. 足够的磁盘空间

4. CPU支持虚拟化（计算节点需要）
```

---

## 六、三种快速安装方式对比

### 6.1 MicroStack（最简单）

```bash
# 适合：完全新手，只想体验OpenStack
# 系统：Ubuntu 18.04+

sudo snap install microstack --beta --classic
sudo microstack init --auto

# 访问 http://localhost/horizon
```

### 6.2 DevStack（学习推荐）

```bash
# 适合：学习OpenStack，需要完整功能
# 系统：Ubuntu / CentOS / Debian

# 创建stack用户
sudo useradd -s /bin/bash -d /opt/stack -m stack
echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack

# 切换到stack用户
sudo -u stack -i

# 下载DevStack
git clone https://opendev.org/openstack/devstack /opt/stack/devstack

# 创建配置文件
cat > /opt/stack/devstack/local.conf << 'EOF'
[[local|localrc]]
ADMIN_PASSWORD=secret
DATABASE_PASSWORD=$ADMIN_PASSWORD
RABBIT_PASSWORD=$ADMIN_PASSWORD
SERVICE_PASSWORD=$ADMIN_PASSWORD
HOST_IP=192.168.1.100
EOF

# 开始安装
cd /opt/stack/devstack
./stack.sh

# 等待15-30分钟安装完成
```

### 6.3 手动安装（生产推荐）

```bash
# 适合：生产环境，需要自定义配置
# 系统：Ubuntu / Rocky Linux

# 手动一步步安装：
# 1. 安装数据库
# 2. 安装消息队列
# 3. 安装各组件
# 4. 手动配置每个组件
# 5. 连接各组件

# 参考官方文档：
# https://docs.openstack.org/install/
```

### 6.4 三种方式对比

| 方式 | 难度 | 灵活性 | 适合场景 |
|------|------|--------|----------|
| MicroStack | ⭐ | 低 | 完全新手 |
| DevStack | ⭐⭐ | 中 | 学习测试 |
| 手动安装 | ⭐⭐⭐⭐ | 高 | 生产环境 |

---

## 七、常见问题

### 7.1 Q: 必须用Ubuntu吗？

**A：不是。**

OpenStack支持多种Linux：
- Ubuntu（最推荐）
- Rocky Linux / CentOS Stream
- Debian
- RHEL / Oracle Linux
- SUSE Linux Enterprise

**推荐Ubuntu的原因：**
- 官方文档最完善
- 社区最活跃
- 安装包更新最快

### 7.2 Q: 计算节点必须装KVM吗？

**A：不是，但KVM最常见。**

OpenStack支持多种虚拟化：

| 虚拟化 | nova-compute包 | 说明 |
|--------|----------------|------|
| **KVM** | nova-compute-kvm | 主流选择，开源免费 |
| **VMware** | nova-compute-vmware | 需要vSphere |
| **Hyper-V** | nova-compute-hyperv | Windows环境 |
| **Xen** | nova-compute-xen | 特定场景 |
| **LXD** | nova-compute-lxd | 容器化 |

**学习/个人使用：KVM**
**企业环境：KVM或VMware**

### 7.3 Q: 控制节点需要什么配置？

```bash
控制节点最低配置：
├── CPU：4核心
├── 内存：8GB
├── 磁盘：50GB
└── 网络：千兆

控制节点推荐配置：
├── CPU：8-16核心
├── 内存：16-32GB
├── 磁盘：100GB+ SSD
└── 网络：千兆/万兆
```

### 7.4 Q: 计算节点需要什么配置？

```bash
计算节点最低配置：
├── CPU：4核心（支持VT-x/AMD-V）
├── 内存：8GB
├── 磁盘：100GB
└── 网络：千兆

计算节点推荐配置：
├── CPU：8-32核心
├── 内存：32-128GB
├── 磁盘：500GB+ SSD（系统）+ 数据盘
└── 网络：千兆/万兆
```

### 7.5 Q: 可以先装一个节点，后面再装另一个吗？

**A：完全可以！**

OpenStack支持组件热添加：

```
第一步：先安装控制节点
    ↓
    配置、测试
    ↓
第二步：再安装计算节点
    ↓
    在控制节点注册
    ↓
第三步：完成！
```

### 7.6 Q: 安装失败怎么办？

```bash
# 1. 查看日志
tail -f /var/log/keystone/keystone.log
tail -f /var/log/nova/nova-api.log

# 2. 检查服务状态
systemctl status mariadb
systemctl status rabbitmq-server
systemctl status keystone

# 3. 检查端口占用
netstat -tlnp | grep 3306  # MySQL
netstat -tlnp | grep 5672  # RabbitMQ
netstat -tlnp | grep 5000  # Keystone

# 4. 检查防火墙
sudo systemctl status ufw
sudo ufw status
```

---

## 八、总结

### 8.1 安装要点

```
1. 不需要定制ISO！
   └── 普通Ubuntu/CentOS/Rocky Linux就可以

2. 控制节点安装：
   ├── 数据库（MySQL）
   ├── 消息队列（RabbitMQ）
   ├── 所有API服务
   └── 不需要KVM

3. 计算节点安装：
   ├── KVM虚拟化（必须）
   ├── nova-compute
   └── neutron-agent

4. 支持的虚拟化：
   ├── KVM（主流）
   ├── VMware
   ├── Hyper-V
   └── Xen
```

### 8.2 安装方式选择

| 场景 | 推荐方式 |
|------|----------|
| 完全新手体验 | MicroStack |
| 学习OpenStack | DevStack |
| 个人Homelab | DevStack或手动 |
| 小规模生产 | 手动安装 |
| 大规模生产 | Kolla-Ansible |

### 8.3 记住这个流程

```
普通Linux系统
     │
     ▼
添加OpenStack仓库（apt/yum）
     │
     ▼
安装软件包（apt install / yum install）
     │
     ▼
配置各组件（编辑配置文件）
     │
     ▼
启动服务
     │
     ▼
完成！
```

---

*祝安装顺利！如果遇到问题，欢迎在评论区交流。*
