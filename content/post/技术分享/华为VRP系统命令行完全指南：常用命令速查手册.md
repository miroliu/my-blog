---
title: "华为数通设备命令行完全指南：常用命令速查手册"
description: "覆盖华为VRP系统设备（交换机、路由器）的日常工作场景：系统基础、接口配置、VLAN/MSTP、静态/RIP/OSPF/BGP、ACL、NAT、SNMP/VLAN间路由、用户管理、诊断命令。"
slug: "huawei-vrp-command-reference"
date: 2026-05-02T11:00:00+08:00
image: ""
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["技术分享"]
---

# 华为数通设备命令行完全指南：常用命令速查手册

> **适用平台**：华为VRP系统设备（S5700/S5700-SI/S6700系列交换机、AR1220/AR2240路由器等）
> **固件版本**：VRP V200R019C00 及以上（大多数命令在各版本间通用）
> **约定**：`[]`内为可选参数，`|`表示多选一，`<>`内为需填写的值

---

## 一、系统与登录基础

### 1.1 基础查看命令

| 功能 | 命令 | 说明 |
|------|------|------|
| 查看当前配置 | `display current-configuration` | 显示running-config，简写 `dis cu` |
| 查看启动配置 | `display saved-configuration` | 显示flash中保存的配置 |
| 查看设备版本 | `display version` | 显示VRP版本、运行时间、CPU/内存占用 |
| 查看接口摘要 | `display ip interface brief` | 快速查看各接口IP和状态，简写 `dis ip int br` |
| 查看指定接口详情 | `display interface GigabitEthernet 0/0/1` | 显示接口的详细统计信息 |
| 查看设备序列号 | `display esn` | 显示设备ESN序列号 |
| 查看CPU使用率 | `display cpu-usage` | 显示CPU各进程占用率 |
| 查看内存使用率 | `display memory-usage` | 显示内存占用情况 |
| 查看告警信息 | `display trapbuffer` | 显示设备Trap缓存的告警 |
| 查看日志 | `display logbuffer` | 显示系统日志 |
| 查看MAC地址表 | `display mac-address` | 查看所有MAC表项 |
| 查看ARP表 | `display arp-all` | 查看动态+静态ARP |

### 1.2 系统操作命令

```bash
# 进入系统视图
<Huawei> system-view
[Huawei]

# 修改设备名称
[Huawei] sysname SW-CORE-01

# 设置设备时区和时间
[Huawei] clock timezone GMT+8 add 8
[Huawei] clock datetime 10:30:00 2026-05-04

# 保存配置（重要！重启后生效）
<Huawei> save

# 比较当前配置与保存的配置差异
< Huawei> compare configuration

# 重启设备
<Huawei> reboot

# 清空配置（恢复出厂）
<Huawei> reset save-configuration
<Huawei> reboot

# 配置别名（简化命令）
[Huawei] command-alias execmode system-view
[Huawei] command-alias execmode execute
```

### 1.3 用户与登录管理

```bash
# 进入VTY用户界面（远程登录）
[Huawei] user-interface vty 0 4

# 设置AAA认证
[Huawei] authentication-mode aaa
[Huawei] quit

# 进入AAA视图配置本地用户
[Huawei] aaa
[Huawei-aaa] local-user admin password irreversible-cipher <ENCRYPTED-PASSWORD>
[Huawei-aaa] local-user admin privilege level 15
[Huawei-aaa] local-user admin service-type http ssh telnet
[Huawei-aaa] quit

# 启用SSH（推荐，禁用Telnet）
[Huawei] ssh user admin
[Huawei] ssh user admin authentication-type password
[Huawei] ssh user admin service-type stelnet
[Huawei] ssh user admin assign rsa-key admin
[Huawei] stelnet server enable

# 设置Console口密码
[Huawei] user-interface console 0
[Huawei-ui-console0] authentication-mode password
[Huawei-ui-console0] set authentication password cipher <PASSWORD>
[Huawei-ui-console0] quit

# 查看当前登录用户
[Huawei] display users
```

---

## 二、接口与IP配置

### 2.1 三层接口配置（给交换机/路由器配IP）

```bash
# 方式一：进入接口视图直接配IP（三层交换机的VLANIF）
[Huawei] interface Vlanif 100
[Huawei-Vlanif100] ip address 192.168.100.1 24
[Huawei-Vlanif100] undo shutdown
[Huawei-Vlanif100] quit

# 方式二：进入物理接口配IP（路由器或三层交换机端口）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] ip address 10.0.1.1 255.255.255.0
[Huawei-GigabitEthernet0/0/1] description To-ISP
[Huawei-GigabitEthernet0/0/1] undo shutdown
[Huawei-GigabitEthernet0/0/1] quit

# 方式三：配置Loopback接口（常用于Router-ID、OSPF/BGP源地址）
[Huawei] interface LoopBack 0
[Huawei-LoopBack0] ip address 1.1.1.1 32
[Huawei-LoopBack0] quit

# 配置子接口（单臂路由/VLAN间路由）
[Huawei] interface GigabitEthernet 0/0/1.100
[Huawei-GigabitEthernet0/0/1.100] dot1q termination vid 100
[Huawei-GigabitEthernet0/0/1.100] ip address 192.168.100.1 24
[Huawei-GigabitEthernet0/0/1.100] arp broadcast enable
[Huawei-GigabitEthernet0/0/1.100] quit

# 配置接口MTU
[Huawei-GigabitEthernet0/0/1] mtu 1500

# 配置接口速率/双工
[Huawei-GigabitEthernet0/0/1] speed 1000
[Huawei-GigabitEthernet0/0/1] duplex full

# 查看接口状态
[Huawei] display interface GigabitEthernet 0/0/1
[Huawei] display ip interface brief
```

### 2.2 二层接口配置（交换机端口）

```bash
[Huawei] interface GigabitEthernet 0/0/1

# 设为Access端口（连接PC/服务器）
[Huawei-GigabitEthernet0/0/1] port link-type access
[Huawei-GigabitEthernet0/0/1] port default vlan 10

# 设为Trunk端口（连接交换机/路由器）
[Huawei-GigabitEthernet0/0/1] port link-type trunk
[Huawei-GigabitEthernet0/0/1] port trunk allow-pass vlan 10 20 30
[Huawei-GigabitEthernet0/0/1] port trunk pvid vlan 100   # 可选：Native VLAN

# 设为Hybrid端口（混合模式，最灵活）
[Huawei-GigabitEthernet0/0/1] port link-type hybrid
[Huawei-GigabitEthernet0/0/1] port hybrid tagged vlan 10 20   #Tagged: 始终带标签
[Huawei-GigabitEthernet0/0/1] port hybrid untagged vlan 30    #Untagged: 剥除标签
[Huawei-GigabitEthernet0/0/1] port hybrid pvid vlan 30

# 开启端口（默认开启，误操作时使用）
[Huawei-GigabitEthernet0/0/1] undo shutdown

# 端口安全
[Huawei-GigabitEthernet0/0/1] port-security enable
[Huawei-GigabitEthernet0/0/1] port-security max-mac-num 5
[Huawei-GigabitEthernet0/0/1] port-security mac-address sticky

# 开启环路检测（防止二层环路）
[Huawei] loopback-detect enable
[Huawei-GigabitEthernet0/0/1] loopback-detect enable

# 端口隔离（同一VLAN内二层隔离）
[Huawei] port-isolate mode l2    # 全局开启
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] am isolate GigabitEthernet 0/0/2  # G1/0/1和G1/0/2隔离

[Huawei] quit
```

---

## 三、VLAN与生成树

### 3.1 VLAN配置

```bash
# 创建VLAN
[Huawei] vlan 10
[Huawei-vlan10] description SALES-DEPT
[Huawei-vlan10] quit

# 批量创建VLAN
[Huawei] vlan batch 20 30 40

# 创建VLAN并进入VLAN视图（带描述）
[Huawei] vlan 10
[Huawei-vlan10] name IT-DEPT
[Huawei-vlan10] quit

# 删除VLAN
[Huawei] undo vlan 10

# 将端口加入VLAN（Access模式）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] port link-type access
[Huawei-GigabitEthernet0/0/1] port default vlan 10

# 批量将端口加入VLAN
[Huawei] port-group admin
[Huawei-port-group-admin] group-member GigabitEthernet 0/0/1 to GigabitEthernet 0/0/10
[Huawei-port-group-admin] port link-type access
[Huawei-port-group-admin] port default vlan 20

# 查看VLAN信息
[Huawei] display vlan
[Huawei] display port vlan
```

### 3.2 MSTP（多实例生成树）

```bash
# 全局使能MSTP
[Huawei] stp enable
[Huawei] stp mode mstp

# 进入MSTP域视图
[Huawei] stp region-configuration

# 定义域名、修订级别、VLAN映射
[Huawei-mst-region] region-name HUAWEI-CORE
[Huawei-mst-region] revision-level 1
[Huawei-mst-region] instance 1 vlan 10 20
[Huawei-mst-region] instance 2 vlan 30 40
[Huawei-mst-region] active region-configuration

# 设置根桥（实例1的核心交换机）
[Huawei] stp instance 1 root primary
[Huawei] stp instance 2 root secondary

# 或者手动指定根桥优先级
[Huawei] stp instance 1 priority 4096
[Huawei] stp instance 2 priority 8192

# 边缘端口（连接终端，禁用生成树）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] stp edged-port enable

# 查看MSTP状态
[Huawei] display stp brief
[Huawei] display stp region-configuration
```

---

## 四、静态路由与默认路由

```bash
# 配置静态路由
[Huawei] ip route-static 192.168.20.0 24 10.0.1.2
[Huawei] ip route-static 192.168.20.0 24 GigabitEthernet 0/0/1 10.0.1.2   # 指定出接口

# 配置默认路由（0.0.0.0/0）
[Huawei] ip route-static 0.0.0.0 0 202.96.128.1

# 配置浮动静态路由（备份路由，优先级低的作为备份）
[Huawei] ip route-static 192.168.20.0 24 10.0.1.2 preference 100
[Huawei] ip route-static 192.168.20.0 24 10.0.2.2 preference 200

# 配置静态ARP（静态MAC映射）
[Huawei] static-arp resolve 192.168.1.100 mac-address 5489-98cf-6a0c
[Huawei] static-arp resolve vlanif 10 192.168.1.100 mac-address 5489-98cf-6a0c

# 查看路由表
[Huawei] display ip routing-table
[Huawei] display ip routing-table verbose      # 详细
[Huawei] display ip routing-table 192.168.20.0  # 查特定路由
[Huawei] display ip routing-table protocol static  # 只看静态路由

# 查看路由表摘要
[Huawei] display ip routing-table statistics
```

---

## 五、动态路由协议

### 5.1 RIP

```bash
[Huawei] rip 1
[Huawei-rip-1] version 2            # 使用RIPv2（支持VLSM）
[Huawei-rip-1] network 192.168.10.0
[Huawei-rip-1] network 10.0.0.0
[Huawei-rip-1] import-route static  # 引入静态路由
[Huawei-rip-1] quit

# 路由认证（相邻路由器需配置相同Key-ID）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] rip authentication-mode simple plain HUAWEI@123
[Huawei-GigabitEthernet0/0/1] quit
```

### 5.2 OSPF

```bash
# OSPF基础配置（进程ID仅本地有效，不同路由器可用不同进程号）
[Huawei] ospf 1 router-id 1.1.1.1
[Huawei-ospf-1] area 0.0.0.0           # 进入骨干区域0
[Huawei-ospf-1-area-0.0.0.0] network 192.168.10.0 0.0.0.255
[Huawei-ospf-1-area-0.0.0.0] network 10.0.1.0 0.0.0.255
[Huawei-ospf-1-area-0.0.0.0] quit
[Huawei-ospf-1] quit

# 多区域OSPF
[Huawei] ospf 1 router-id 1.1.1.1
[Huawei-ospf-1] area 0.0.0.0
[Huawei-ospf-1-area-0.0.0.0] network 192.168.0.0 0.0.0.255
[Huawei-ospf-1-area-0.0.0.0] quit
[Huawei-ospf-1] area 0.0.0.1
[Huawei-ospf-1-area-0.0.0.1] network 192.168.10.0 0.0.0.255
[Huawei-ospf-1-area-0.0.0.1] quit

# OSPF接口认证
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] ospf authentication-mode md5 1 plain Huawei@123
[Huawei-GigabitEthernet0/0/1] quit

# 调整OSPF Cost（影响选路）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] ospf cost 10

# 引入外部路由（redistribute）
[Huawei] ospf 1
[Huawei-ospf-1] import-route static
[Huawei-ospf-1] default-route-advertise always   # 始终下发默认路由

# 查看OSPF状态
[Huawei] display ospf peer brief
[Huawei] display ospf lsdb
[Huawei] display ospf routing
[Huawei] display ospf interface GigabitEthernet 0/0/1
[Huawei] display ospf interface
```

### 5.3 BGP

```bash
# BGP基础配置（AS号需全网一致）
[Huawei] bgp 65001
[Huawei-bgp] router-id 1.1.1.1

# 配置邻居（IBGP，同AS内，习惯用Loopback地址建立连接）
[Huawei-bgp] peer 2.2.2.2 as-number 65001
[Huawei-bgp] peer 2.2.2.2 connect-interface LoopBack 0   # 使用Loopback建立邻居

# 配置邻居（EBGP，跨AS）
[Huawei-bgp] peer 10.0.1.2 as-number 65002

# 在BGP视图下引入IGP路由（OSPF/直连）
[Huawei-bgp] import-route ospf 1
[Huawei-bgp] import-route direct

# 宣告网络到BGP
[Huawei-bgp] network 192.168.10.0 255.255.255.0

# 配置BGP路由聚合（汇总）
[Huawei-bgp] aggregate 192.168.0.0 255.255.0.0 detail-suppressed

# 配置BGP路由策略（路由过滤/属性修改）
[Huawei] route-policy HUAWEI-EXPORT permit node 10
[Huawei-route-policy] apply as-path 65001 65001 additive
[Huawei-route-policy] quit
[Huawei] bgp 65001
[Huawei-bgp] peer 2.2.2.2 route-policy HUAWEI-EXPORT export

# 查看BGP状态
[Huawei] display bgp peer
[Huawei] display bgp routing-table
[Huawei] display bgp routing-table 192.168.10.0
[Huawei] display bgp vpnv4 all routing-table
```

---

## 六、ACL访问控制列表

```bash
# 基础ACL（2000-2999）：只匹配源地址
[Huawei] acl 2000
[Huawei-acl-basic-2000] rule 5 permit source 192.168.10.0 0.0.0.255
[Huawei-acl-basic-2000] rule 10 deny source 192.168.1.0 0.0.0.255
[Huawei-acl-basic-2000] quit

# 高级ACL（3000-3999）：匹配源/目的地址、端口、协议
[Huawei] acl 3000
[Huawei-acl-adv-3000] rule permit tcp source 192.168.10.0 0.0.0.255 destination-port eq 80
[Huawei-acl-adv-3000] rule permit tcp source 192.168.10.0 0.0.0.255 destination-port eq 443
[Huawei-acl-adv-3000] rule deny tcp source 192.168.10.0 0.0.0.255 destination 10.0.0.1 0
[Huawei-acl-adv-3000] rule permit icmp source 192.168.10.0 0.0.0.255 destination any
[Huawei-acl-adv-3000] rule deny ip source any destination any
[Huawei-acl-adv-3000] quit

# ACL应用示例：接口调用（Inbound/Outbound）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] traffic-filter inbound acl 3000

# ACL应用示例：策略路由
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] traffic-policy PBR inbound

# 查看ACL
[Huawei] display acl all
[Huawei] display acl 3000
```

---

## 七、NAT网络地址转换

```bash
# 场景1：Easy IP（小型网络，出接口IP直接做转换）
[Huawei] acl 2000
[Huawei-acl-basic-2000] rule permit source 192.168.10.0 0.0.0.255
[Huawei-acl-basic-2000] quit
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] nat outbound 2000
[Huawei-GigabitEthernet0/0/1] quit

# 场景2：NAT Server（发布内部服务器，供外部访问）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] nat server protocol tcp global 202.96.128.100 80 inside 192.168.10.100 80
[Huawei-GigabitEthernet0/0/1] nat server protocol tcp global 202.96.128.100 443 inside 192.168.10.100 443
[Huawei-GigabitEthernet0/0/1] quit

# 场景3：NAPT（地址池转换，多对多）
[Huawei] nat address-group 1 202.96.128.100 202.96.128.110
[Huawei] acl 2001
[Huawei-acl-basic-2001] rule permit source 192.168.20.0 0.0.0.255
[Huawei-acl-basic-2001] quit
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] nat outbound 2001 address-group 1
[Huawei-GigabitEthernet0/0/1] quit

# 查看NAT会话表
[Huawei] display nat session all
[Huawei] display nat server
[Huawei] display nat statistics
```

---

## 八、VRRP与链路聚合

### 8.1 VRRP（虚拟路由冗余）

```bash
# 核心交换机A（主设备）
[Huawei] interface Vlanif 100
[Huawei-Vlanif100] vrrp vrid 1 virtual-ip 192.168.100.254   # 虚拟网关地址
[Huawei-Vlanif100] vrrp vrid 1 priority 150                # 默认100，值越大越优先
[Huawei-Vlanif100] vrrp vrid 1 preempt-mode timer delay 10  # 抢占延迟10秒
[Huawei-Vlanif100] vrrp vrid 1 track interface GigabitEthernet 0/0/1 reduced 50  # 上行链路监控
[Huawei-Vlanif100] quit

# 核心交换机B（备份设备，只需配置虚IP）
[Huawei] interface Vlanif 100
[Huawei-Vlanif100] vrrp vrid 1 virtual-ip 192.168.100.254
[Huawei-Vlanif100] vrrp vrid 1 priority 120
[Huawei-Vlanif100] quit

# 查看VRRP状态
[Huawei] display vrrp brief
[Huawei] display vrrp interface Vlanif 100
```

### 8.2 链路聚合（ETH-Trunk）

```bash
# 方式一：手工负载均衡模式（无LACP协议）
[Huawei] interface Eth-Trunk 1
[Huawei-Eth-Trunk1] mode manual load-balance
[Huawei-Eth-Trunk1] trunkport GigabitEthernet 0/0/1 to 0/0/3
[Huawei-Eth-Trunk1] port link-type trunk
[Huawei-Eth-Trunk1] port trunk allow-pass vlan all
[Huawei-Eth-Trunk1] load-balance src-dst-ip    # 基于源+目的IP的负载均衡
[Huawei-Eth-Trunk1] quit

# 方式二：LACP协议模式（推荐，支持主动/被动）
[Huawei] interface Eth-Trunk 1
[Huawei-Eth-Trunk1] mode lacp-static
[Huawei-Eth-Trunk1] trunkport GigabitEthernet 0/0/1 to 0/0/3
[Huawei-Eth-Trunk1] lacp timeout fast      # 快速探测（1秒）
[Huawei-Eth-Trunk1] lacp priority 32768   # 系统优先级（越小越优先）
[Huawei-Eth-Trunk1] max active linknumber 2   # 最大活跃链路数（其余为备份）
[Huawei-Eth-Trunk1] quit

# 边缘设备配置（接入交换机一侧的LACP）
[Huawei] interface Eth-Trunk 1
[Huawei-Eth-Trunk1] mode lacp-static
[Huawei-Eth-Trunk1] trunkport GigabitEthernet 0/0/1 to 0/0/2
[Huawei-Eth-Trunk1] port link-type trunk
[Huawei-Eth-Trunk1] port trunk allow-pass vlan 10 20

# 查看链路聚合状态
[Huawei] display eth-trunk
[Huawei] display eth-trunk 1
```

---

## 九、DHCP服务

```bash
# DHCP服务器（基于全局地址池）
[Huawei] dhcp enable
[Huawei] ip pool HQ-POOL
[Huawei-ip-pool-HQ-POOL] network 192.168.10.0 mask 255.255.255.0
[Huawei-ip-pool-HQ-POOL] gateway-list 192.168.10.254
[Huawei-ip-pool-HQ-POOL] dns-list 8.8.8.8 114.114.114.114
[Huawei-ip-pool-HQ-POOL] lease day 3
[Huawei-ip-pool-HQ-POOL] excluded-ip-address 192.168.10.1 192.168.10.10  # 排除地址段
[Huawei-ip-pool-HQ-POOL] quit
[Huawei] interface Vlanif 100
[Huawei-Vlanif100] dhcp select global    # 引用全局地址池
[Huawei-Vlanif100] quit

# DHCP服务器（基于接口地址池）
[Huawei] dhcp enable
[Huawei] interface Vlanif 200
[Huawei-Vlanif200] ip address 192.168.20.1 24
[Huawei-Vlanif200] dhcp select interface
[Huawei-Vlanif200] dhcp server dns-list 8.8.8.8
[Huawei-Vlanif200] dhcp server lease day 7

# DHCP中继（跨VLAN获取DHCP）
[Huawei] dhcp enable
[Huawei] interface Vlanif 100
[Huawei-Vlanif100] dhcp select relay
[Huawei-Vlanif100] dhcp relay server-ip 10.0.0.1   # 指向DHCP服务器地址
[Huawei-Vlanif100] quit

# 查看DHCP状态
[Huawei] display ip pool
[Huawei] display ip pool interface Vlanif100
[Huawei] display dhcp relay
```

---

## 十、QoS服务质量

```bash
# 流量整形（限制出接口带宽）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] qos lr outbound cir 50000 pir 80000
# cir=承诺信息速率(保证带宽), pir=峰值信息速率(最大带宽), 单位Kbps

# 队列调度（WFQ权重公平队列，PQ优先级队列，RR轮询）
[Huawei-GigabitEthernet0/0/1] qos queue-profile QUEUE-1
[Huawei-qos-queue-profile-QUEUE-1] schedule pq 5 wfq 1 to 3   # 队列5用PQ，其余用WFQ
[Huawei-qos-queue-profile-QUEUE-1] quit
[Huawei-GigabitEthernet0/0/1] qos queue-profile QUEUE-1

# 拥塞管理（优先级映射：DSCP/802.1p到队列）
[Huawei] diffserv domain DEFAULT
[Huawei-diffserv-domain-DEFAULT] remark 8021p 6 local-precedence ef
[Huawei-diffserv-domain-DEFAULT] quit
```

---

## 十一、堆叠与集群（iStack / CSS）

```bash
# iStack堆叠配置（将多台交换机虚拟成一台）
# 步骤1：设置堆叠ID和优先级
[Huawei] stack member 1 priority 200
[Huawei] stack member 1 domain 10
# 步骤2：配置堆叠端口（业务口堆叠，需先关闭端口）
[Huawei] interface GigabitEthernet 0/0/1
[Huawei-GigabitEthernet0/0/1] shutdown
[Huawei-GigabitEthernet0/0/1] stack-port mode ethernet
[Huawei-GigabitEthernet0/0/1] stack-port member 1/1 port-typeagg  # 成员1的堆叠口1
[Huawei-GigabitEthernet0/0/1] quit
# 步骤3：使能堆叠
[Huawei] stack enable

# 查看堆叠状态
<Huawei> display stack
<Huawei> display stack configuration
<Huawei> display stack port
```

---

## 十二、SNMP监控

```bash
# SNMPv2c（读团体名+写团体名，团体名建议复杂）
[Huawei] snmp-agent
[Huawei] snmp-agent sys-info version v2c v3
[Huawei] snmp-agent community read public
[Huawei] snmp-agent community write private
[Huawei] snmp-agent sys-info location Beijing-DC-Floor3
[Huawei] snmp-agent sys-info contact admin@example.com

# SNMPv3（更安全，推荐生产环境使用）
[Huawei] snmp-agent group v3 MonitorGroup privacy
[Huawei] snmp-agent usm-user v3 netdevicemonitor
[Huawei] snmp-agent usm-user v3 netdevicemonitor authentication-mode sha
[Huawei] snmp-agent usm-user v3 netdevicemonitor privacy-mode aes128
[Huawei] snmp-agent target-host trap address udp-domain 10.0.0.100 params securityname netdevicemonitor v3 privacy

# 配置Trap告警发送
[Huawei] snmp-agent trap enable
[Huawei] snmp-agent target-host trap address udp-domain 10.0.0.100 udp-port 162 params securityname public
```

---

## 十三、诊断与排障命令

```bash
# ===== 通用排障 =====
[Huawei] ping 192.168.1.1
[Huawei] ping -a 192.168.10.1 192.168.1.1    # 指定源地址Ping
[Huawei] ping -c 100 -s 1400 192.168.1.1     # Ping 100次，包大小1400字节
[Huawei] tracert 8.8.8.8                      # 路由追踪

# ===== OSPF排障 =====
[Huawei] display ospf peer
[Huawei] display ospf interface
[Huawei] display ospf lsdb router             # 查看LSA类型1
[Huawei] display ospf routing
[Huawei] reset ospf 1 process                 # 重置OSPF进程（慎用）

# ===== BGP排障 =====
[Huawei] display bgp peer
[Huawei] display bgp routing-table
[Huawei] display bgp routing-table statistics
[Huawei] refresh bgp all export               # 刷新BGP出方向路由
[Huawei] refresh bgp all import               # 刷新BGP入方向路由

# ===== MAC/ARP排障 =====
[Huawei] display mac-address dynamic vlan 10
[Huawei] display mac-address aging-time
[Huawei] display arp all
[Huawei] display arp interface Vlanif 100
[Huawei] display arp statistics all

# ===== MSTP排障 =====
[Huawei] display stp brief
[Huawei] display stp interface GigabitEthernet 0/0/1
[Huawei] display stp region-configuration

# ===== 链路排障 =====
[Huawei] display interface GigabitEthernet 0/0/1
# 重点关注：CRC错误、丢包、带宽利用率
[Huawei] display port-statistic interface GigabitEthernet 0/0/1

# ===== 抓包（镜像） =====
[Huawei] observe-port 1 interface GigabitEthernet 0/0/1  # 观察端口
[Huawei] interface GigabitEthernet 0/0/2
[Huawei-GigabitEthernet0/0/2] port-mirroring to observe-port 1 inbound
[Huawei-GigabitEthernet0/0/2] quit

# ===== 清除统计/表项（排障时临时使用） =====
[Huawei] reset count interface GigabitEthernet 0/0/1
[Huawei] reset mac-address
[Huawei] reset arp all
[Huawei] reset traffic-statistics interface GigabitEthernet 0/0/1
```

---

## 十四、常见配置错误排查思路

```
问题1：OSPF邻居起不来
→ 检查：区域ID是否一致、网段是否在network宣告范围内、接口是否UP、
        认证是否匹配、hello/dead计时器是否一致、MTU是否一致（需两端一致）

问题2：PC获取不到DHCP地址
→ 检查：DHCP服务是否使能(dhcp enable)、地址池网段与VLANIF是否在同一网段、
        是否引用了正确的地址池(global/interface)、排除地址范围是否正确

问题3：VLAN间无法互通
→ 检查：终端网关是否指向VLANIF地址、交换机间Trunk是否放行了对应VLAN、
        二层是否允许VLAN通过、STP是否阻断了端口

问题4：路由表中无路由
→ 检查：是否正确宣告了网段、是否引入了路由、ACL是否误伤了路由协议报文、
        静态路由是否指定了正确的下一跳和出接口
```

---

*参考设备平台：S5700/6700系列交换机、AR1220/2240路由器，VRP V200R019C00*
