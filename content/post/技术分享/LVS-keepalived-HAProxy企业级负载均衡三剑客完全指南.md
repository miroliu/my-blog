---
title: "LVS + Keepalived + HAProxy：企业级负载均衡三剑客完全指南"
description: "从理论到实操，系统讲解LVS四层负载均衡原理、Keepalived VRRP高可用、HAProxy七层负载均衡与ACL策略，附完整配置示例与生产架构设计。"
slug: "lvs-keepalived-haproxy-complete-guide"
date: 2026-05-04T17:00:00+08:00
image: ""
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["技术分享"]
---

# LVS + Keepalived + HAProxy：企业级负载均衡三剑客完全指南

## 前言

一个日活10万人的电商网站，促销时QPS瞬间从500飙到50000，后台只有两台应用服务器。如果流量直接打到这两台机器，毫无疑问会崩溃。怎么办？

答案是**负载均衡（Load Balancing）**。

但负载均衡不是一个工具，而是一套技术体系。从Linux内核级的LVS，到保障高可用的Keepalived，再到功能强大的七层代理HAProxy，这三者组合起来，构成了国内大多数互联网企业生产环境的流量入口架构。

本文的目标是：**让一个完全没有负载均衡经验的工程师，看完后能独立搭建一套生产级别的高可用负载均衡集群，并理解每一步配置背后的原理。**

---

## 一、为什么要负载均衡：从一道面试题说起

### 1.1 没有负载均衡时的问题

```
用户请求
    ↓
直接访问 Server A（单点）
    ↓
问题1：Server A挂了 → 网站全挂
问题2：10000并发同时打Server A → CPU打满 → 响应缓慢 → 超时
问题3：Server A的网卡打满 → 新请求全部丢包
```

### 1.2 加了负载均衡后

```
用户请求（大量并发）
    ↓
┌─────────────────────────────┐
│       负载均衡器（LB）       │
│   分发请求到多台Real Server  │
└──────┬──────────┬──────────┘
       ↓          ↓
   Server A    Server B    Server C
   (Web)      (Web)       (Web)
       ↑          ↑          ↑
   ┌────┴──────────┴──────────┐
   │       应用服务器集群        │
   └───────────────────────────┘
       ↓          ↓
   数据库      数据库
```

**负载均衡解决的三件事：**

- **高性能**：将并发请求分散到多台服务器，每台只承担1/N的负载
- **高可用**：任意一台Real Server故障，LB自动剔除，流量切换到健康节点
- **横向扩展**：业务增长时，只需在RS池中增加服务器，无需修改任何配置

### 1.3 四层负载均衡 vs 七层负载均衡

这是负载均衡最核心的概念区分，面试必问。

| 对比维度 | 四层负载均衡（LVS） | 七层负载均衡（HAProxy/Nginx） |
|---------|----------------|--------------------------|
| 工作层级 | TCP/UDP层（IP + 端口） | 应用层（HTTP/HTTPS/FTP等） |
| 转发依据 | 源/目的IP + 端口 | URL路径、Header、Cookie、请求内容 |
| 性能 | 极高（内核态处理，无协议解析） | 较高（需解析HTTP内容） |
| 功能深度 | 基础分发 + 健康检查 | 路由策略、ACL、 rewrite、限流、WAF |
| 场景 | 大流量基础分发 | 细粒度路由、Web加速、安全防护 |
| 代表工具 | LVS | HAProxy、Nginx |
| 理解难度 | 难（涉及内核和NAT/DR原理） | 中（配置直观） |

> **企业实际做法**：LVS/HAProxy做入口流量分发（七层精确控制），LVS直连后端RS做四层高速转发。"四层+七层"组合是目前最常见的高性能架构。

---

## 二、LVS：Linux内核级四层负载均衡

### 2.1 LVS是什么

LVS（Linux Virtual Server）是Linux内核原生提供的高性能负载均衡功能，由章文嵩博士（阿里云创始人之一）在1998年开发并贡献进Linux内核主线。它工作在内核态，**直接在内核的Netfilter钩子中处理数据包**，无需在用户空间复制数据，因此性能极高。

LVS的转发性能可以达到**几十万甚至上百万每秒并发**，远超HAProxy和Nginx。

### 2.2 LVS三种工作模式

这是LVS最难理解的知识点。先搞清楚数据包从客户端到Real Server、再到客户端的完整路径，就理解了三种模式的核心差异。

#### 模式一：NAT模式（地址转换）

```
客户端（CIP → VIP）  →  LVS Director  →  Real Server（RS）
                          NAT转换            SNAT/DNAT             

客户端 ←（响应数据）←   LVS Director  ←  Real Server
        CIP ← VIP            ↑                  
                      DNAT转换后           CIP ← RIP
```

**工作原理：**

1. 客户端请求VIP：源IP=CIP，目标IP=VIP
2. LVS收到包后，修改目标IP为某台RS的RIP（DNAT），源IP修改为LVS的DIP（SNAT）
3. RS收到请求，以为是LVS发的，直接响应数据到LVS的DIP
4. LVS再次做NAT转换（源IP改回VIP），发给客户端

**特点**：

- 所有返回流量都经过LVS，容易成为瓶颈
- RS必须配置默认网关指向LVS
- 支持端口映射（80→8080）

```bash
# RS上的配置（NAT模式必须）
# 所有RS的默认网关必须指向LVS的DIP
route add default gw 192.168.10.10
```

#### 模式二：DR模式（直接路由，Direct Routing）——企业最常用

```
客户端（ CIP → VIP） → LVS Director → Real Server
                          改MAC             ARP抑制

客户端（ CIP ← VIP） ←                ← Real Server
                   ← 直接响应，无需经过LVS
```

**工作原理：**

1. 客户端请求VIP，LVS收到包后，**只修改目标MAC地址**为某台RS的MAC，源/目标IP不变
2. RS收到包，发现目标IP是自己（VIP），直接处理请求
3. RS直接回复客户端（源IP=VIP），**不经过LVS**
4. 关键：RS必须抑制对VIP的ARP响应（否则客户端可能直接发给RS，绕开LVS）

**特点**：

- 返回流量**不经过LVS**，LVS压力小，性能最高
- IP层无修改，只修改MAC层
- RS必须与LVS在同一物理网段
- **生产环境最常用的模式**

#### 模式三：TUN模式（IP隧道）

```
客户端（ CIP → VIP） → LVS Director → Real Server
                          IP隧道封装     隧道解封装

客户端 ←（直接响应）←                   ← Real Server
```

**工作原理**：LVS将IP包外层再封装一层IP头（隧道），RS解封装后处理。RS可以与LVS跨广域网。

**三种模式对比：**

| 维度 | NAT | DR | TUN |
|------|-----|-----|-----|
| 性能 | 低（双向NAT） | 高（单向L2转发） | 高 |
| RS网络要求 | 与LVS同网段 | 与LVS同网段 | 可跨网段 |
| 端口映射 | 支持 | 不支持 | 不支持 |
| 常用场景 | 小规模内部 | **生产环境首选** | 跨地域集群 |
| 配置复杂度 | RS需改网关 | RS需抑制ARP | RS需隧道支持 |

### 2.3 LVS核心概念

```
LVS架构中的四个核心概念：

Client（客户端）
    │
    ↓ 访问VIP（Virtual IP，虚拟IP，LVS对外提供服务的IP）
┌─────────────────────────┐
│     LVS Director         │  ← 调度器，负责分发请求
│  （Load Balancer）       │
│                          │
│  VIP: 192.168.10.100   │  ← 虚拟IP（面向客户端）
│  DIP: 192.168.10.10    │  ← 内部IP（LVS与RS通信）
└──────────┬──────────────┘
           ↓ 分发算法调度
┌──────────┴──────────────┐
│   Real Server Pool      │  ← 真实服务器池
│  RS1: 192.168.10.21   │
│  RS2: 192.168.10.22   │
│  RS3: 192.168.10.23   │
└─────────────────────────┘
```

**LVS调度算法（8种核心算法）：**

| 算法 | 命令关键字 | 原理 | 适用场景 |
|------|----------|------|---------|
| 轮询 | rr | 每个请求依次发给下一个RS | 服务器性能相同 |
| 加权轮询 | wrr | 按权重比例分发 | 服务器性能不同时 |
| 最少连接 | lc | 发给当前连接数最少的RS | 长连接业务 |
| 加权最少连接 | wlc | 优先级×连接数综合评估 | 混合性能场景 |
| 源地址哈希 | sh | 同一源IP永远发到同一RS | 会话保持 |
| 目标地址哈希 | dh | 同一目标IP发到同一RS | 缓存命中优化 |
| 最短期望延迟 | sed | (active*256+inactive)/weight | NQ算法改进版 |
| 永不排队 | nq | 有空闲RS立即分配 | 高并发短连接 |

### 2.4 LVS实操：ipvsadm 命令详解

#### 安装

```bash
# CentOS/RHEL
yum install -y ipvsadm

# Ubuntu/Debian
apt install -y ipvsadm

# 验证内核模块加载
lsmod | grep ip_vs
# 预期输出：ip_vs_sh ip_vs_wrr ip_vs_rr ip_vs_lc ip_vs ...
```

#### 核心命令

```bash
# 清理所有规则（操作前先清空）
ipvsadm -C

# 添加VIP（LVS对外服务的虚拟IP）
# -A: 添加虚拟服务  -t: TCP协议  -s: 调度算法
ipvsadm -A -t 192.168.10.100:80 -s wrr -p 20

# 参数说明：
# -t 192.168.10.100:80  → 监听TCP 192.168.10.100:80
# -s wrr                 → 使用加权轮询算法
# -p 20                 → 会话保持20秒（同一人发到同一RS）

# 添加Real Server（将RS加入集群）
# -a: 添加真实服务器  -r: RS的RIP  -g: DR模式（直接路由）
# -w: 权重
ipvsadm -a -t 192.168.10.100:80 -r 192.168.10.21:80 -g -w 3
ipvsadm -a -t 192.168.10.100:80 -r 192.168.10.22:80 -g -w 2
ipvsadm -a -t 192.168.10.100:80 -r 192.168.10.23:80 -g -w 1

# 查看LVS集群状态
ipvsadm -Ln

# 预期输出：
# IP Virtual Server version 1.2.1 (size=4096)
# Prot LocalAddress:Port Scheduler Flags
#   -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
# TCP  192.168.10.100:80 wrr persistent 20
#   -> 192.168.10.21:80             Route   3      10         5
#   -> 192.168.10.22:80             Route   2      8          3
#   -> 192.168.10.23:80             Route   1      5          2

# ActiveConn：活跃连接数（正在处理的请求）
# InActConn：非活跃连接数（等待中的请求）

# 查看详细统计
ipvsadm -Ln --stats

# 查看持久化连接
ipvsadm -Ln --persistent-conn

# 修改RS权重（动态调整，无需重建连接）
ipvsadm -e -t 192.168.10.100:80 -r 192.168.10.21:80 -g -w 5

# 删除RS
ipvsadm -d -t 192.168.10.100:80 -r 192.168.10.21:80

# 删除VIP
ipvsadm -D -t 192.168.10.100:80

# 保存规则（重启后生效）
ipvsadm-save > /etc/sysconfig/ipvsadm
# 或者
service ipvsadm save

# 开机自启
systemctl enable ipvsadm
```

#### NAT模式配置示例

```bash
# LVS Director上操作（NAT模式需要开启转发）
# 1. 开启Linux内核IP转发
echo "net.ipv4.ip_forward = 1" >> /etc/sysctl.conf
sysctl -p

# 2. 配置DIP（内网IP，用于与RS通信）
ifconfig eth0:0 192.168.10.10 netmask 255.255.255.0 up

# 3. 添加VIP（面向客户端）
ifconfig eth0:1 192.168.10.100 netmask 255.255.255.0 up

# 4. 添加LVS规则（-m表示NAT模式）
ipvsadm -C
ipvsadm -A -t 192.168.10.100:80 -s wrr
ipvsadm -a -t 192.168.10.100:80 -r 192.168.10.21:80 -m -w 3
ipvsadm -a -t 192.168.10.100:80 -r 192.168.10.22:80 -m -w 2

# Real Server上配置：
# 1. 绑定VIP（LO口，用于接收发给VIP的包）
ifconfig lo:0 192.168.10.100 netmask 255.255.255.255 up

# 2. 抑制ARP（核心！防止RS直接响应客户端ARP请求）
echo "1" > /proc/sys/net/ipv4/conf/lo/arp_ignore
echo "2" > /proc/sys/net/ipv4/conf/lo/arp_announce
echo "1" > /proc/sys/net/ipv4/conf/all/arp_ignore
echo "2" > /proc/sys/net/ipv4/conf/all/arp_announce

# 3. 修改默认网关（必须指向LVS的DIP）
route add default gw 192.168.10.10
```

---

## 三、Keepalived：VRRP高可用协议实现

### 3.1 为什么需要Keepalived

LVS Director本身也是一个单点。如果LVS挂了，整个集群就不可用了。Keepalived解决的问题是：**当LVS主节点故障时，备节点自动接管VIP，继续提供服务。**

### 3.2 Keepalived的核心：VRRP协议

**VRRP（Virtual Router Redundancy Protocol）** 的工作原理非常像班长竞选：

```
场景：全班选一个班长（VIP对外服务）
• 班长A（Master，主节点）：负责管理班级事务（处理请求）
• 班长B（Backup，备节点）：随时准备接任
• 如果班长A不吭声（没有发心跳），超过一定时间（默认3秒）
  → 班长B认为班长A挂了 → 班长B自动成为新的班长
```

VRRP的**心跳机制**：主节点每1秒（ Advertisement_Interval）向组内所有节点发送VRRP广告包。如果Backup节点在3倍时间内没收到广告包（默认3秒），就认为主节点挂了，主动接替。

### 3.3 Keepalived + LVS的工作原理

```
正常状态：
┌──────────────────┐
│  Keepalived Master │  ← VIP所在节点，活跃处理请求
│  (LVS Master)      │
│  state: MASTER     │
│  priority: 150     │
└────────┬───────────┘
         │ VRRP心跳（每1秒）
         ↓
┌──────────────────┐
│  Keepalived Backup │  ← 监控中，备机
│  (LVS Backup)      │
│  state: BACKUP     │
│  priority: 100     │
└──────────────────┘

Master故障后：
  Backup节点3秒内没收到心跳 → 自动切换为MASTER → 接管VIP → 继续服务
```

### 3.4 Keepalived实操配置

#### 安装

```bash
# CentOS/RHEL
yum install -y keepalived

# Ubuntu/Debian
apt install -y keepalived

# 验证
keepalived -v
# Keepalived 2.x.x
```

#### Keepalived配置文件结构

```bash
# 主配置文件位置
/etc/keepalived/keepalived.conf

# 配置结构总览：
global_defs { }           # 全局配置：邮件通知、router_id
vrrp_instance VI_1 { }    # VRRP实例：一个VIP的高可用组
virtual_server { }        # LVS集群服务定义（关联到LVS ipvsadm）
```

#### 实操一：LVS + Keepalived 高可用配置（DR模式）

**LVS Master节点配置：**

```bash
# /etc/keepalived/keepalived.conf

global_defs {
    router_id LVS_MASTER          # 节点标识，在同一VRRP组内唯一
    script_user root              # 健康检查脚本运行用户
    enable_script_security        # 启用脚本安全（禁止root运行非root脚本）
}

# 定义VRRP实例（VIP的高可用）
vrrp_instance VI_1 {
    state BACKUP          # 启动状态（正式环境用BACKUP，避免脑裂）
    interface eth0        # 网卡名（VIP绑定的物理网卡）
    virtual_router_id 51  # 虚拟路由ID，同一VRRP组内必须相同（1-255）
    priority 150          # 优先级，Master要高于Backup
    advert_int 1         # 心跳间隔（秒），Master每1秒发一次VRRP广告
    nopreempt            # 非抢占模式（推荐生产使用，避免频繁切换）
    # preempt_delay 300   # 抢占延迟（故障恢复后等待5分钟再抢回）
    
    authentication {     # VRRP认证，防止伪造VRRP包
        auth_type PASS    # 简单密码认证
        auth_pass 1111    # 密码（同一VRRP组内必须一致）
    }
    
    # VIP定义（对外提供服务的虚拟IP）
    virtual_ipaddress {
        192.168.10.100/24 dev eth0    # VIP和绑定网卡
        # 192.168.10.101/24 dev eth0  # 支持多个VIP
    }
    
    # 通知脚本（状态变化时发送告警）
    notify_master "/etc/keepalived/notify.sh master"
    notify_backup "/etc/keepalived/notify.sh backup"
    notify_fault "/etc/keepalived/notify.sh fault"
}

# 定义LVS集群服务（将Keepalived与LVS ipvsadm关联）
virtual_server 192.168.10.100 80 {
    delay_loop 6           # 健康检查间隔（秒）
    lb_algo wrr            # 负载均衡算法：rr/wrr/lc/wlc/sh/dh
    lb_kind DR              # LVS模式：NAT/TUN/DR
    persistence_timeout 20  # 会话保持时间（秒）
    protocol TCP           # 协议类型：TCP/UDP
    
    # Real Server 1
    real_server 192.168.10.21 80 {
        weight 3           # 权重（数值越大，分到的请求越多）
        inhibit_on_failure # 当健康检查失败时，将权重设为0而不是删除RS
        
        # 健康检查方式：HTTP_GET（推荐，比TCP更准确）
        HTTP_GET {
            url {
                path /index.html
                status_code 200    # 返回200则认为RS健康
            }
            connect_timeout 3
            nb_get_retry 3        # 重试3次
            delay_before_retry 2  # 重试间隔2秒
        }
        
        # 简单TCP检查（轻量）
        # TCP_CHECK {
        #     connect_port 80
        #     connect_timeout 3
        # }
    }
    
    # Real Server 2
    real_server 192.168.10.22 80 {
        weight 2
        HTTP_GET {
            url {
                path /index.html
                status_code 200
            }
            connect_timeout 3
            nb_get_retry 3
            delay_before_retry 2
        }
    }
}
```

**LVS Backup节点配置：**

```bash
# /etc/keepalived/keepalived.conf（与Master的差异标注）

global_defs {
    router_id LVS_BACKUP    # 唯一标识
}

vrrp_instance VI_1 {
    state BACKUP            # Backup节点也是BACKUP
    interface eth0
    virtual_router_id 51    # 必须与Master一致
    priority 100            # 优先级低于Master（150 > 100）
    advert_int 1
    nopreempt              # 非抢占模式
    authentication {
        auth_type PASS
        auth_pass 1111     # 密码必须一致
    }
    virtual_ipaddress {
        192.168.10.100/24 dev eth0
    }
}

# LVS集群服务配置与Master完全一致
virtual_server 192.168.10.100 80 {
    delay_loop 6
    lb_algo wrr
    lb_kind DR
    persistence_timeout 20
    protocol TCP
    
    real_server 192.168.10.21 80 {
        weight 3
        HTTP_GET {
            url { path /index.html; status_code 200; }
            connect_timeout 3; nb_get_retry 3; delay_before_retry 2;
        }
    }
    
    real_server 192.168.10.22 80 {
        weight 2
        HTTP_GET {
            url { path /index.html; status_code 200; }
            connect_timeout 3; nb_get_retry 3; delay_before_retry 2;
        }
    }
}
```

**RS（Real Server）上的DR模式配置脚本：**

```bash
#!/bin/bash
# /etc/init.d/lvs-rs （RS启动脚本，在每台Real Server上运行）

VIP=192.168.10.100
HOSTNAME=$(hostname)

case "$1" in
start)
    echo "启动 LVS Real Server ($HOSTNAME)"
    # 绑定VIP到LO接口
    ifconfig lo:0 $VIP netmask 255.255.255.255 broadcast $VIP up
    # 抑制ARP（DR模式核心，防止RS响应VIP的ARP查询）
    echo 1 > /proc/sys/net/ipv4/conf/lo/arp_ignore
    echo 2 > /proc/sys/net/ipv4/conf/lo/arp_announce
    echo 1 > /proc/sys/net/ipv4/conf/all/arp_ignore
    echo 2 > /proc/sys/net/ipv4/conf/all/arp_announce
    ;;
stop)
    echo "停止 LVS Real Server ($HOSTNAME)"
    ifconfig lo:0 down
    echo 0 > /proc/sys/net/ipv4/conf/lo/arp_ignore
    echo 0 > /proc/sys/net/ipv4/conf/lo/arp_announce
    echo 0 > /proc/sys/net/ipv4/conf/all/arp_ignore
    echo 0 > /proc/sys/net/ipv4/conf/all/arp_announce
    ;;
*)
    echo "Usage: $0 {start|stop}"
    exit 1
esac
```

```bash
# 给脚本加执行权限并启动
chmod +x /etc/init.d/lvs-rs
/etc/init.d/lvs-rs start

# 加入开机自启
echo "/etc/init.d/lvs-rs start" >> /etc/rc.local
```

#### 启动和验证

```bash
# 两台LVS节点都启动Keepalived
systemctl start keepalived
systemctl enable keepalived

# 查看VIP漂移情况（在Master上）
ip addr show eth0
# 预期看到：inet 192.168.10.100/24 scope global secondary eth0
# ← 这说明VIP已绑定在Master上

# 在Backup上查看（VIP不应该出现）
ip addr show eth0
# 预期：没有192.168.10.100（因为VIP在Master上）

# 查看LVS集群状态
ipvsadm -Ln

# 查看Keepalived日志（排查问题）
tail -f /var/log/messages | grep -i keepalived
```

#### 实操二：自定义健康检查脚本（检测MySQL存活）

```bash
#!/bin/bash
# /etc/keepalived/check_mysql.sh
# 检测MySQL是否存活，如果挂了则关闭Keepalived，触发VIP漂移

MYSQL_HOST="192.168.10.21"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="MySQL@123"
TIMEOUT=5

# 使用nc（netcat）检测端口
nc -z -w $TIMEOUT $MYSQL_HOST $MYSQL_PORT > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "MySQL on $MYSQL_HOST:$MYSQL_PORT is DOWN, stopping Keepalived"
    systemctl stop keepalived
    exit 1
fi

exit 0
```

```bash
# 在Keepalived配置中引用自定义脚本
real_server 192.168.10.21 80 {
    weight 3
    # 替换HTTP_GET为自定义脚本检查
    notify_down "/etc/keepalived/check_mysql.sh"
    MISC_CHECK {
        use_virtd_id 55
        misc_path "/etc/keepalived/check_mysql.sh"
        misc_timeout 3
    }
}
```

### 3.5 Keepalived的常见问题与排查

```
问题1：VIP在两台机器上都出现了（脑裂）
原因：Master和Backup之间网络不通，Backup误以为Master挂了
解决：检查两台机器之间的网络连通性，确认VRRP组播是否能正常传递

问题2：VIP漂移后无法访问
原因：RS的ARP抑制配置丢失（重启后/proc/sys内容未持久化）
解决：确保RS的开机自启脚本正确执行lvs-rs start

问题3：VIP能漂移但请求不响应
原因：LVS规则未同步（ipvsadm规则在Master上，但Backup接管后没有规则）
解决：确保两台机器的Keepalived配置文件中的virtual_server { }块完全一致

问题4：健康检查正常但RS实际已故障
原因：HTTP_GET只检查/index.html，但该页面有缓存，真实服务已挂
解决：检查关键的动态接口（如/api/health），或使用TCP_CHECK代替
```

---

## 四、HAProxy：功能强大的七层负载均衡

### 4.1 HAProxy vs LVS：什么时候用HAProxy

| 场景 | 推荐工具 | 原因 |
|------|---------|------|
| 超大流量入口（10万+ QPS） | LVS | 内核态，性能最高 |
| 需要URL路由/A/B测试 | HAProxy | 七层解析能力 |
| HTTPS卸载（SSL证书） | HAProxy | 内置SSL终结 |
| HTTP Header改写/重定向 | HAProxy | 正则改写 |
| 灰度/金丝雀发布 | HAProxy | ACL细粒度路由 |
| MySQL/Redis负载均衡 | HAProxy | TCP层代理 |
| 日志/限流/WAF | HAProxy | 丰富的ACL和日志 |

### 4.2 HAProxy核心配置结构

```bash
# /etc/haproxy/haproxy.cfg

# 全局配置
global
    log /dev/log local0 info
    maxconn 4096                # 单进程最大连接数
    user haproxy
    group haproxy
    daemon                       # 后台运行
    stats socket /var/run/haproxy.sock mode 600

# 默认配置（所有frontend/backend的默认参数）
defaults
    log     global
    mode    http                 # 模式：http（7层）/ tcp（4层）
    option  httplog              # HTTP日志格式（记录详细信息）
    option  dontlognull          # 不记录空连接日志
    timeout connect 5000         # 连接超时（ms）
    timeout client  30000        # 客户端超时
    timeout server  30000        # 服务端超时
    option  redispatch          # 服务器down时重新分发（session失效）
    retries 3                    # 重试次数

# 统计页面（监控用）
listen stats_page
    bind 0.0.0.0:8888           # 监控页面监听端口
    stats enable
    stats uri /haproxy_stats     # 访问路径
    stats auth admin:haproxy123  # 认证账号
    stats refresh 5s             # 自动刷新（5秒）

# Frontend：接收客户端请求的前端入口
frontend http_front
    bind *:80                   # 监听所有网卡的80端口
    bind *:443 ssl crt /etc/ssl/certs/server.pem  # HTTPS
    
    # ACL规则：按路径路由
    acl url_static path_beg -i /static /images /css /js
    acl url_api path_beg -i /api /v1 /v2
    acl url_admin path_beg -i /admin /manage
    
    # 使用backend
    use_backend static_backend if url_static
    use_backend api_backend if url_api
    use_backend admin_backend if url_admin
    
    # 默认backend（未匹配以上规则时）
    default_backend web_backend

# Backend：真实服务器池
backend web_backend
    mode http
    balance roundrobin           # 负载均衡算法
    # 算法选项：roundrobin/leastconn/source/uri/hdr
    
    # 健康检查
    option httpchk GET /health.html
    http-check expect status 200
    
    # Real Server列表
    server web1 192.168.10.21:80 check inter 2000 rise 2 fall 3
    server web2 192.168.10.22:80 check inter 2000 rise 2 fall 3
    server web3 192.168.10.23:80 check inter 2000 rise 2 fall 3
    
    # 参数说明：
    # check：开启健康检查
    # inter 2000：每2秒检查一次
    # rise 2：连续2次成功则标记为健康
    # fall 3：连续3次失败则标记为不健康

backend api_backend
    mode http
    balance leastconn             # 最少连接算法（适合长连接API）
    option httpchk GET /api/health
    server api1 192.168.10.31:8080 check
    server api2 192.168.10.32:8080 check
    # Cookie粘性：同一用户的请求发到同一台服务器
    cookie SERVERID insert indirect nocache
    server api1 192.168.10.31:8080 cookie api1 check
    server api2 192.168.10.32:8080 cookie api2 check
```

### 4.3 HAProxy ACL高级用法（灰度发布实战）

ACL（Access Control List）是HAProxy的灵魂，用好ACL可以实现精细的流量控制。

```bash
# 完整灰度发布配置示例

frontend web_front
    bind *:80
    
    # ACL：按Cookie判断用户群体（运营/内测）
    acl is_beta_user hdr_reg(Cookie,.*beta=1.*) -m found
    acl is_vip_user hdr(Cookie) -m sub VIP
    
    # ACL：按URL路径（不同接口走不同集群）
    acl is_admin path_beg /admin /manage /internal
    
    # ACL：按源IP白名单
    acl is_office src 10.0.0.0/8
    acl is_office src 172.16.0.0/12
    acl is_office src 192.168.0.0/16
    
    # ACL：按请求头（X-Request-ID存在）
    acl has_trace hdr(X-Request-ID) -m found
    
    # ACL：按User-Agent（移动端）
    acl is_mobile hdr(User-Agent) -i mobile|android|iphone
    
    # 路由策略
    # Beta用户走新版本集群
    use_backend web_v2 if is_beta_user
    # VIP用户走高配集群
    use_backend web_premium if is_vip_user
    # 管理员走内网集群
    use_backend admin_backend if is_admin
    # 移动端走移动版集群
    use_backend web_mobile if is_mobile
    # 默认走主集群
    default_backend web_v1

# 主集群（v1，稳定版本）
backend web_v1
    balance roundrobin
    option httpchk GET /health
    server web1 192.168.10.21:80 cookie v1 check inter 2000
    server web2 192.168.10.22:80 cookie v1 check inter 2000

# 新版本集群（v2，金丝雀）
backend web_v2
    balance roundrobin
    option httpchk GET /health
    server web3 192.168.10.31:80 cookie v2 check inter 2000

# 高配集群
backend web_premium
    balance leastconn
    server premium1 192.168.10.41:80 cookie prem1 check

# 管理员内网集群
backend admin_backend
    balance roundrobin
    # 仅允许内网访问（已经在ACL中控制）
    server admin1 10.0.1.21:80 check
```

### 4.4 HAProxy监控页面

```bash
# 启动HAProxy
systemctl start haproxy
systemctl enable haproxy

# 访问监控页面
# http://HAProxy-IP:8888/haproxy_stats
# 账号：admin  密码：haproxy123

# 通过socket手动操作（无需重启）
echo "show stat" | socat stdio /var/run/haproxy.sock
echo "show info" | socat stdio /var/run/haproxy.sock

# 动态下线/上线RS（热操作）
echo "disable server web_backend/web1" | socat stdio /var/run/haproxy.sock
# web1被标记为DOWN，不再接收请求
echo "enable server web_backend/web1" | socat stdio /var/run/haproxy.sock
# web1恢复，自动上线

# 查看后端健康状态
echo "show backend" | socat stdio /var/run/haproxy.sock
```

---

## 五、生产架构：LVS + Keepalived + HAProxy组合实战

### 5.1 经典组合架构

在实际生产中，LVS、Keepalived、HAProxy 三者的组合通常如下：

```
                         用户流量
                            ↓
              ┌────────────────────────┐
              │   互联网              │
              └──────────┬─────────────┘
                         ↓
          ┌───────────────────────────┐
          │    第一层：四层负载均衡    │
          │  LVS Master ←→ LVS Backup  │
          │  (Keepalived VRRP 高可用)  │
          │  VIP: 202.96.128.100     │
          │  模式: DR                 │
          └──────────┬────────────────┘
                     ↓ 分发到多台HAProxy
          ┌──────────┴──────────────────┐
          │    第二层：七层负载均衡     │
          │  HAProxy-1    HAProxy-2   │
          │  SSL卸载      HAProxy-3   │
          │  URL路由                   │
          │  ACL/WAF                  │
          └──────────┬────────────────┘
                     ↓
          ┌──────────┴──────────────────┐
          │    第三层：应用服务器        │
          │  Web-1    Web-2    Web-3   │
          │  (Nginx)  (Nginx)  (Nginx)│
          └────────────────────────────┘
```

**为什么需要两层？**

- **LVS层**：处理超大流量（百万级并发），做最基础的四层分发，同时通过Keepalived保证高可用
- **HAProxy层**：做七层精细化处理（SSL终结、Cookie粘性、URL路由、ACL控制、访问日志）

### 5.2 双层高可用完整配置

#### 整体流程

```
LVS Master（VIP: 202.96.128.100）
    ↓ DR模式直接路由到
HAProxy-1:80 → web1:8080, web2:8080, web3:8080
HAProxy-2:80 → web1:8080, web2:8080, web3:8080
HAProxy-3:80 → web1:8080, web2:8080, web3:8080

当HAProxy-1故障：
  LVS自动剔除HAProxy-1
  流量切换到HAProxy-2和HAProxy-3
  → 对用户无感知
```

#### LVS层配置（Keepalived管理VIP）

```bash
# /etc/keepalived/keepalived.conf（LVS Master）

global_defs { router_id LVS_MASTER }
vrrp_instance VI_1 {
    state BACKUP
    interface eth0
    virtual_router_id 100
    priority 150
    advert_int 1
    nopreempt
    authentication { auth_type PASS; auth_pass HAProxy@2026; }
    virtual_ipaddress { 202.96.128.100/24 dev eth0 }
}

virtual_server 202.96.128.100 80 {
    delay_loop 6
    lb_algo wrr
    lb_kind DR
    persistence_timeout 30
    protocol TCP
    
    # 三台HAProxy作为RS
    real_server 192.168.10.101 80 { weight 3; TCP_CHECK { connect_port 80; connect_timeout 3; } }
    real_server 192.168.10.102 80 { weight 3; TCP_CHECK { connect_port 80; connect_timeout 3; } }
    real_server 192.168.10.103 80 { weight 2; TCP_CHECK { connect_port 80; connect_timeout 3; } }
}
```

#### HAProxy层配置（三台HAProxy配置完全一致）

```bash
# /etc/haproxy/haproxy.cfg（三台HAProxy节点配置相同）

global
    log /dev/log local0 info
    maxconn 80000
    daemon
    stats socket /var/run/haproxy.sock mode 600 level admin

defaults
    log     global
    mode    http
    option  httplog
    option  dontlognull
    timeout connect 5000
    timeout client  30000
    timeout server  30000
    option  redispatch
    option  httpchk GET /health

listen stats_page
    bind 0.0.0.0:8888
    stats enable
    stats uri /haproxy_stats
    stats auth admin:haproxy2026

frontend http_front
    bind *:80
    default_backend web_backend

backend web_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    # 三台Nginx Web服务器
    server web1 192.168.20.21:8080 check inter 2000 rise 2 fall 3 weight 100
    server web2 192.168.20.22:8080 check inter 2000 rise 2 fall 3 weight 100
    server web3 192.168.20.23:8080 check inter 2000 rise 2 fall 3 weight 100
    # Cookie粘性
    cookie SERVERID insert indirect nocache
```

#### 验证测试

```bash
# 1. 查看VIP在哪台LVS上
ip addr show eth0 | grep 202.96.128.100
# → Master上应有VIP，Backup上无VIP

# 2. 查看LVS规则（HAProxy作为RS）
ipvsadm -Ln

# 3. 模拟HAProxy故障
systemctl stop haproxy   # 在HAProxy-1上执行
# 观察：LVS自动将HAProxy-1从RS池中剔除
sleep 5
ipvsadm -Ln

# 4. 模拟LVS Master故障（VIP漂移到Backup）
systemctl stop keepalived   # 在Master上执行
# 观察：VIP在Backup上出现
# 观察：HAProxy层无感知（VIP漂移对HAProxy透明）

# 5. 全量压测
ab -n 10000 -c 500 http://202.96.128.100/index.html
# 预期：三台Web服务器的access log均有请求记录
```

---

## 六、总结：三种工具的选型决策

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| 小网站（QPS < 1000） | Nginx单节点 | 简单，零配置 |
| 中型网站（QPS 1000-5万） | HAProxy + 多RS | 成本低，功能强 |
| 大型互联网（QPS 5万+） | LVS(DR) + HAProxy + Keepalived | 最强性能 + 高可用 |
| 金融/高可用要求极高 | 双LVS + 双HAProxy集群 | 双重高可用 |
| 需要SSL卸载 | HAProxy层做SSL终结 | HAProxy原生支持 |
| 需要精确URL路由 | HAProxy ACL | 七层解析能力 |
| 超高并发（50万+ QPS） | LVS DR直连后端Nginx | 减少一层转发 |

---

*关联文章：*
- *《企业网络路由协议选型与核心技术指南》——负载均衡的下层网络架构设计*
- *《Istio服务网格完全指南》——Service Mesh层面的流量管理*
