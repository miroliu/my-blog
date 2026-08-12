---
title: "思科IOS/IOS-XE设备命令行完全指南：常用命令速查手册"
description: "覆盖思科IOS/IOS-XE设备（Catalyst交换机、ISR/ASR路由器）的日常工作场景：系统基础、接口配置、VLAN/VTP/SPanning-Tree、静态/RIP/OSPF/BGP、ACL、NAT、HSRP/GLBP、端口通道、DHCP、SNMP、排障命令。"
slug: "cisco-ios-command-reference"
date: 2026-05-02T11:30:00+08:00
image: ""
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["技术分享"]
---

# 思科IOS/IOS-XE设备命令行完全指南：常用命令速查手册

> **适用平台**：Cisco IOS（15.x及以上）/ IOS-XE（Catalyst 9000系列交换机、ISR 4000/ASR 1000系列路由器）
> **固件版本**：IOS 15.2(4)M / IOS-XE 17.x（大多数命令在各版本间通用）
> **约定**：`[]`内为可选参数，`|`表示多选一，`()`内为注释或提示

---

## 一、系统与登录基础

### 1.1 基础查看命令

| 功能             | 命令                                  | 说明                                        |
| ---------------- | ------------------------------------- | ------------------------------------------- |
| 查看运行配置     | `show running-config`                 | 显示当前配置，简写 `sh run`                 |
| 查看启动配置     | `show startup-config`                 | 显示flash中保存的配置                       |
| 查看设备版本     | `show version`                        | 显示IOS版本、运行时间、flash/内存信息       |
| 查看接口摘要     | `show ip interface brief`             | 快速查看各接口IP和状态，简写 `sh ip int br` |
| 查看指定接口详情 | `show interfaces GigabitEthernet 0/1` | 显示接口详细统计信息                        |
| 查看CPU使用率    | `show processes cpu`                  | 显示CPU各进程占用                           |
| 查看内存         | `show memory`                         | 显示内存使用情况                            |
| 查看MAC地址表    | `show mac address-table`              | 查看MAC表，简写 `sh mac add`                |
| 查看ARP表        | `show arp`                            | 查看ARP缓存                                 |
| 查看日志         | `show log`                            | 显示系统日志                                |
| 查看告警         | `show alarms`                         | 显示设备告警信息                            |

### 1.2 系统操作命令

```bash
# 进入特权模式（enable）
Switch> enable
Switch#

# 进入全局配置模式
Switch# configure terminal
Switch(config)#

# 修改设备名称
Switch(config)# hostname SW-CORE-01
SW-CORE-01(config)#

# 设置时区和时间
SW-CORE-01(config)# clock timezone GMT 8
SW-CORE-01# clock set 10:30:00 4 May 2026

# 保存配置
SW-CORE-01# copy running-config startup-config
# 或
SW-CORE-01# write memory
# 简写
SW-CORE-01# copy run start

# 查看配置差异（未保存的改动）
SW-CORE-01# show running-config diff

# 重启设备
SW-CORE-01# reload

# 恢复出厂设置
SW-CORE-01# write erase
SW-CORE-01# reload

# 配置别名（简化命令）
SW-CORE-01(config)# alias exec sri show run int
SW-CORE-01# sri    # 等价于 show run int

# 配置历史命令记录大小
SW-CORE-01(config)# history size 200
```

### 1.3 用户与登录管理

```bash
# 进入线路配置模式（VTY：0-4，共5个并发会话）
SW-CORE-01(config)# line vty 0 4
SW-CORE-01(config-line)# login local              # 本地AAA认证
SW-CORE-01(config-line)# transport input ssh telnet  # 推荐SSH，禁用Telnet
SW-CORE-01(config-line)# exec-timeout 10 0         # 10分钟无操作自动断开
SW-CORE-01(config-line)# exit

# 配置本地用户名和密码
SW-CORE-01(config)# username admin privilege 15 secret Cisco@123
# privilege 15=完全管理权限, secret=加密存储

# 配置enable密码（进入特权模式的密码）
SW-CORE-01(config)# enable secret Cisco@2026

# 配置Console口
SW-CORE-01(config)# line con 0
SW-CORE-01(config-line)# login local
SW-CORE-01(config-line)# exec-timeout 0 0    # Console口永不断开
SW-CORE-01(config-line)# logging synchronous   # 日志同步显示

# 配置SSH（生成RSA密钥）
SW-CORE-01(config)# ip domain-name mycompany.com
SW-CORE-01(config)# crypto key generate rsa general-keys modulus 2048
SW-CORE-01(config)# ip ssh version 2
SW-CORE-01(config)# ip ssh authentication-retries 3
SW-CORE-01(config)# ip ssh time-out 60

# 限制VTY登录IP（ACL控制）
SW-CORE-01(config)# line vty 0 4
SW-CORE-01(config-line)# access-class 23 in

# 查看当前登录用户
SW-CORE-01# show users
SW-CORE-01# show sessions   # 当前会话
```

---

## 二、接口与IP配置

### 2.1 三层接口配置（路由器或三层交换机）

```bash
# 方式一：给路由器物理接口配IP
Router(config)# interface GigabitEthernet 0/0
Router(config-if)# ip address 10.0.1.1 255.255.255.0
Router(config-if)# description To-Core-Switch
Router(config-if)# no shutdown
Router(config-if)# exit

# 方式二：三层交换机的SVI（交换虚拟接口）
SW-CORE-01(config)# interface Vlan 100
SW-CORE-01(config-if)# ip address 192.168.100.1 255.255.255.0
SW-CORE-01(config-if)# no shutdown
SW-CORE-01(config-if)# exit

# 方式三：配置Loopback接口
Router(config)# interface Loopback 0
Router(config-if)# ip address 1.1.1.1 255.255.255.255
Router(config-if)# exit

# 方式四：子接口（单臂路由/Inter-VLAN Routing）
SW-CORE-01(config)# interface GigabitEthernet 0/1.100
SW-CORE-01(config-subif)# encapsulation dot1Q 100
SW-CORE-01(config-subif)# ip address 192.168.100.1 255.255.255.0
SW-CORE-01(config-subif)# no shutdown
SW-CORE-01(config-subif)# exit

# 启用三层交换机的路由功能（让SVI生效）
SW-CORE-01(config)# ip routing

# 配置接口MTU
SW-CORE-01(config-if)# mtu 9000

# 配置接口速率/双工（不建议手动设置，auto协商更可靠）
SW-CORE-01(config-if)# speed 1000
SW-CORE-01(config-if)# duplex full

# 查看接口状态
SW-CORE-01# show interfaces GigabitEthernet 0/1
SW-CORE-01# show ip interface brief
SW-CORE-01# show interfaces trunk    # 查看trunk端口
```

### 2.2 二层接口配置（交换机端口）

```bash
SW-CORE-01(config)# interface GigabitEthernet 1/0/1

# 设为Access端口（连接PC/服务器）
SW-CORE-01(config-if)# switchport mode access
SW-CORE-01(config-if)# switchport access vlan 10
SW-CORE-01(config-if)# spanning-tree portfast    # 连接终端，开启portfast加速收敛

# 设为Trunk端口（连接交换机/路由器）
SW-CORE-01(config-if)# switchport mode trunk
SW-CORE-01(config-if)# switchport trunk allowed vlan 10,20,30
SW-CORE-01(config-if)# switchport trunk native vlan 99  # Native VLAN（建议修改默认）

# 设为DTP动态协商（接非Cisco设备时慎用）
SW-CORE-01(config-if)# switchport mode dynamic desirable   # 主动协商Trunk
SW-CORE-01(config-if)# switchport mode dynamic auto        # 被动接受Trunk

# 端口安全（安全MAC地址）
SW-CORE-01(config-if)# switchport port-security
SW-CORE-01(config-if)# switchport port-security maximum 5
SW-CORE-01(config-if)# switchport port-security violation restrict  # 违规处理：restrict/shutdown/protect
SW-CORE-01(config-if)# switchport port-security mac-address sticky  # 动态学习+粘性绑定

# 保护端口（同一VLAN内端口间二层隔离）
SW-CORE-01(config-if)# switchport protected

# 查看端口安全
SW-CORE-01# show port-security interface GigabitEthernet 1/0/1
SW-CORE-01# show port-security address
```

---

## 三、VLAN与生成树

### 3.1 VLAN配置

```bash
# 创建VLAN（必须在VLAN Database或全局配置模式下）
SW-CORE-01(config)# vlan 10
SW-CORE-01(config-vlan)# name SALES-DEPT
SW-CORE-01(config-vlan)# exit

# 批量创建VLAN（范围）
SW-CORE-01(config)# vlan 20,30,40

# 将端口加入VLAN
SW-CORE-01(config)# interface range GigabitEthernet 1/0/1 - 10
SW-CORE-01(config-if-range)# switchport mode access
SW-CORE-01(config-if-range)# switchport access vlan 20
SW-CORE-01(config-if-range)# exit

# 删除VLAN（删除前确保端口已移出）
SW-CORE-01(config)# no vlan 10

# VTP（VLAN Trunking Protocol，减少多台交换机VLAN配置量）
# 透明模式（不参与VTP，透传VLAN信息）
SW-CORE-01(config)# vtp mode transparent
# 服务器模式（可创建/修改/删除VLAN）
SW-CORE-01(config)# vtp mode server
SW-CORE-01(config)# vtp domain CISCO-CORE
SW-CORE-01(config)# vtp password Cisco@123

# 查看VLAN信息
SW-CORE-01# show vlan
SW-CORE-01# show vlan brief
SW-CORE-01# show vlan id 10
SW-CORE-01# show vtp status
```

### 3.2 生成树协议（PVST+/RPVST+/MST）

```bash
# PVST+（每VLAN一个生成树，默认开启）
SW-CORE-01(config)# spanning-tree mode pvst

# Rapid PVST+（快速收敛，推荐使用）
SW-CORE-01(config)# spanning-tree mode rapid-pvst

# 设置根桥（VLAN 10的根桥）
SW-CORE-01(config)# spanning-tree vlan 10 root primary
SW-CORE-01(config)# spanning-tree vlan 10 priority 24576  # 手动指定优先级（4096的倍数）

# 设置备份根桥
SW-CORE-01(config)# spanning-tree vlan 10 root secondary

# 边缘端口（连接终端，加速收敛）
SW-CORE-01(config)# interface range GigabitEthernet 1/0/1 - 10
SW-CORE-01(config-if-range)# spanning-tree portfast
SW-CORE-01(config-if-range)# spanning-tree bpduguard enable  # 收到BPDU则端口err-disable

# MSTP（多实例生成树，推荐大型网络）
SW-CORE-01(config)# spanning-tree mode mstp

# 配置MST区域
SW-CORE-01(config)# spanning-tree mst configuration
SW-CORE-01(config-mst)# instance 1 vlan 10,20
SW-CORE-01(config-mst)# instance 2 vlan 30,40
SW-CORE-01(config-mst)# name CISCO-REGION
SW-CORE-01(config-mst)# revision 1
SW-CORE-01(config-mst)# exit

SW-CORE-01(config)# spanning-tree mst 1 root primary
SW-CORE-01(config)# spanning-tree mst 2 root secondary

# 查看生成树状态
SW-CORE-01# show spanning-tree
SW-CORE-01# show spanning-tree vlan 10
SW-CORE-01# show spanning-tree mst 1
SW-CORE-01# show spanning-tree interface GigabitEthernet 1/0/1
```

---

## 四、静态路由与默认路由

```bash
# 配置静态路由
Router(config)# ip route 192.168.20.0 255.255.255.0 10.0.1.2
Router(config)# ip route 192.168.20.0 255.255.255.0 GigabitEthernet 0/0 10.0.1.2  # 指定出接口

# 配置默认路由（0.0.0.0/0）
Router(config)# ip route 0.0.0.0 0.0.0.0 202.96.128.1

# 配置浮动静态路由（备份路由，AD值高作为备份）
Router(config)# ip route 192.168.20.0 255.255.255.0 10.0.1.2 10   # AD=10，主路由
Router(config)# ip route 192.168.20.0 255.255.255.0 10.0.2.2 20   # AD=20，备份

# 路由汇总（手动汇总，减少路由表条目）
Router(config)# ip route 192.168.0.0 255.255.0.0 10.0.1.2

# 静态ARP（MAC静态映射）
Router(config)# arp 192.168.1.100 aabb.ccdd.eeff arpa

# 查看路由表
Router# show ip route
Router# show ip route static    # 只看静态路由
Router# show ip route ospf      # 只看OSPF路由
Router# show ip route bgp       # 只看BGP路由
Router# show ip route 192.168.20.0   # 查看特定路由

# 路由追踪（traceroute）
Router# traceroute 8.8.8.8
```

---

## 五、动态路由协议

### 5.1 RIP

```bash
Router(config)# router rip
Router(config-router)# version 2           # RIPv2（支持VLSM，默认自动汇总需关闭）
Router(config-router)# no auto-summary
Router(config-router)# network 192.168.10.0
Router(config-router)# network 10.0.0.0
Router(config-router)# passive-interface GigabitEthernet 0/0   # 不在该接口发送RIP更新
Router(config-router)# redistribute static                        # 引入静态路由
Router(config-router)# exit

# 路由认证（MD5）
Router(config)# key chain RIP-AUTH
Router(config-keychain)# key 1
Router(config-keychain-key)# key-string Cisco@123
Router(config-keychain-key)# exit
Router(config)# interface GigabitEthernet 0/0
Router(config-if)# ip rip authentication mode md5
Router(config-if)# ip rip authentication key-chain RIP-AUTH
```

### 5.2 OSPF

```bash
# OSPF基础配置（进程ID仅本地有效）
Router(config)# router ospf 1
Router(config-router)# router-id 1.1.1.1
Router(config-router)# network 192.168.10.0 0.0.0.255 area 0     # 骨干区域
Router(config-router)# network 10.0.1.0 0.0.0.255 area 0
Router(config-router)# network 192.168.20.0 0.0.0.255 area 1     # 非骨干区域

# OSPF被动接口（只接收路由更新，不发送）
Router(config-router)# passive-interface default
Router(config-router)# no passive-interface GigabitEthernet 0/0   # 指定接口开启OSPF

# 调整OSPF Cost
Router(config)# interface GigabitEthernet 0/0
Router(config-if)# ip ospf cost 10

# OSPF接口认证（区域0必须全网启用认证）
Router(config)# interface GigabitEthernet 0/0
Router(config-if)# ip ospf authentication message-digest
Router(config-if)# ip ospf authentication-key Cisco@123

# 引入外部路由（redistribute）
Router(config)# router ospf 1
Router(config-router)# redistribute static subnets
Router(config-router)# default-information originate always   # 始终下发默认路由
Router(config-router)# redistribute connected subnets

# OSPF汇总（减少LSA泛洪）
Router(config)# router ospf 1
Router(config-router)# area 1 range 192.168.0.0 255.255.0.0   # 区域间汇总
Router(config-router)# summary-address 172.16.0.0 255.255.0.0   # 外部路由汇总

# 查看OSPF状态
Router# show ip ospf neighbor
Router# show ip ospf neighbor detail
Router# show ip ospf database
Router# show ip ospf
Router# show ip ospf interface GigabitEthernet 0/0
Router# show ip ospf border-routers
```

### 5.3 BGP

```bash
# BGP基础配置（AS号全网必须一致）
Router(config)# router bgp 65001
Router(config-router)# bgp router-id 1.1.1.1
Router(config-router)# no synchronization

# 配置IBGP邻居（同AS，习惯用Loopback建立连接）
Router(config-router)# neighbor 2.2.2.2 remote-as 65001
Router(config-router)# neighbor 2.2.2.2 update-source Loopback 0

# 配置EBGP邻居（跨AS）
Router(config-router)# neighbor 10.0.1.2 remote-as 65002

# BGP路由宣告
Router(config-router)# network 192.168.10.0 mask 255.255.255.0

# 在BGP视图下引入IGP路由
Router(config-router)# redistribute ospf 1
Router(config-router)# redistribute connected

# BGP路由聚合（汇总）
Router(config-router)# aggregate-address 192.168.0.0 255.255.0.0 summary-only  # summary-only：抑制明细路由

# 配置BGP路由映射（route-map）
Router(config)# route-map BGP-EXPORT permit 10
Router(config-route-map)# set as-path prepend 65001 65001
Router(config-route-map)# exit
Router(config)# router bgp 65001
Router(config-router)# neighbor 2.2.2.2 route-map BGP-EXPORT out

# BGP路径属性控制（Local Preference / MED / AS-Path）
Router(config)# route-map LOC-PREF permit 10
Router(config-route-map)# set local-preference 200
Router(config-route-map)# exit

# 查看BGP状态
Router# show ip bgp
Router# show ip bgp neighbors
Router# show ip bgp summary
Router# show ip bgp 192.168.10.0
Router# show ip bgp vpnv4 vrf <VRF-NAME>
```

---

## 六、ACL访问控制列表

```bash
# 标准ACL（编号1-99/1300-1999）：只匹配源地址，应用于靠近目的地
Router(config)# access-list 1 permit 192.168.10.0 0.0.0.255
Router(config)# access-list 1 deny 192.168.1.0 0.0.0.255
Router(config)# access-list 1 permit any   # 末尾隐含deny any any，需注意

# 扩展ACL（编号100-199/2000-2699）：匹配源/目的地址、端口、协议
Router(config)# access-list 100 permit tcp 192.168.10.0 0.0.0.255 any eq 80
Router(config)# access-list 100 permit tcp 192.168.10.0 0.0.0.255 any eq 443
Router(config)# access-list 100 deny tcp any host 10.0.0.1 eq telnet
Router(config)# access-list 100 permit icmp any any
Router(config)# access-list 100 deny ip any any

# 命名ACL（更清晰，推荐使用）
Router(config)# ip access-list extended WEB-FILTER
Router(config-ext-nacl)# permit tcp 192.168.10.0 0.0.0.255 any eq www
Router(config-ext-nacl)# permit tcp 192.168.10.0 0.0.0.255 any eq 443
Router(config-ext-nacl)# deny ip any any log   # deny时记录日志

# ACL应用到接口
Router(config)# interface GigabitEthernet 0/1
Router(config-if)# ip access-group 100 in     # inbound/ outbound
Router(config-if)# ip access-group WEB-FILTER out

# ACL应用到VTY线路（限制SSH/Telnet登录）
Router(config)# line vty 0 4
Router(config-line)# access-class 23 in

# 查看ACL
Router# show access-lists
Router# show ip access-lists
Router# show access-lists 100
```

---

## 七、NAT网络地址转换

```bash
# 场景1：PAT（端口地址转换，多对一，最常用）
Router(config)# ip nat inside source list 1 interface GigabitEthernet 0/1 overload
Router(config)# access-list 1 permit 192.168.10.0 0.0.0.255
Router(config)# interface GigabitEthernet 0/1
Router(config-if)# ip nat outside
Router(config-if)# exit
Router(config)# interface GigabitEthernet 0/0
Router(config-if)# ip nat inside
Router(config-if)# exit

# 场景2：静态NAT（一对一，发布内部服务器）
Router(config)# ip nat inside source static tcp 192.168.10.100 80 202.96.128.100 80
Router(config)# ip nat inside source static tcp 192.168.10.100 443 202.96.128.100 443

# 场景3：动态NAT（地址池，私有→公网，一对一）
Router(config)# ip nat pool NAT-POOL 202.96.128.100 202.96.128.110 netmask 255.255.255.0
Router(config)# access-list 2 permit 192.168.20.0 0.0.0.255
Router(config)# ip nat inside source list 2 pool NAT-POOL

# 场景4：静态PAT（内部服务端口映射，overload）
Router(config)# ip nat inside source static tcp 192.168.10.100 8080 202.96.128.100 80 overload

# NAT超时时间调整
Router(config)# ip nat translation timeout 86400    # 默认86400秒（24小时）
Router(config)# ip nat translation udp-timeout 300
Router(config)# ip nat translation dns-timeout 60

# 查看NAT状态
Router# show ip nat translations
Router# show ip nat statistics
Router# clear ip nat translation *   # 清除NAT会话表
```

---

## 八、HSRP/VRRP与链路聚合

### 8.1 HSRP（热备份路由协议，Cisco私有）

```bash
# 核心交换机A（活跃设备）
SW-CORE-01(config)# interface Vlan 100
SW-CORE-01(config-if)# standby 1 ip 192.168.100.254   # 虚拟网关地址
SW-CORE-01(config-if)# standby 1 priority 150          # 默认100，值越大越优先
SW-CORE-01(config-if)# standby 1 preempt              # 抢占（优先级恢复后夺回活跃）
SW-CORE-01(config-if)# standby 1 track GigabitEthernet 1/0/1 100   # 上行链路监控，降100优先级
SW-CORE-01(config-if)# exit

# 核心交换机B（备份设备）
SW-CORE-01(config)# interface Vlan 100
SW-CORE-01(config-if)# standby 1 ip 192.168.100.254
SW-CORE-01(config-if)# standby 1 priority 120
SW-CORE-01(config-if)# standby 1 preempt
SW-CORE-01(config-if)# exit

# VRRP（Cisco/IOS-XE也支持标准VRRP）
SW-CORE-01(config)# interface Vlan 100
SW-CORE-01(config-if)# vrrp 1 ip 192.168.100.254
SW-CORE-01(config-if)# vrrp 1 priority 150
SW-CORE-01(config-if)# vrrp 1 preempt

# GLBP（网关负载均衡协议，Cisco私有，优于HSRP）
SW-CORE-01(config)# interface Vlan 100
SW-CORE-01(config-if)# glbp 1 ip 192.168.100.254
SW-CORE-01(config-if)# glbp 1 priority 150
SW-CORE-01(config-if)# glbp 1 load-balancing host-dependent  # 主机相关负载均衡

# 查看HSRP/VRRP状态
SW-CORE-01# show standby brief
SW-CORE-01# show vrrp
SW-CORE-01# show glbp
```

### 8.2 链路聚合（Port-Channel/EtherChannel）

```bash
# 方式一：PAgP（Cisco私有，自动协商）
SW-CORE-01(config)# interface range GigabitEthernet 1/0/23 - 24
SW-CORE-01(config-if-range)# channel-group 1 mode auto    # 被动模式
SW-CORE-01(config-if-range)# switchport mode trunk
SW-CORE-01(config-if-range)# switchport trunk allowed vlan 10,20
SW-CORE-01(config-if-range)# exit

# 方式二：LACP（Cisco和标准均支持，推荐使用）
SW-CORE-01(config)# interface range GigabitEthernet 1/0/23 - 24
SW-CORE-01(config-if-range)# channel-group 1 mode active   # 主动发送LACP包
SW-CORE-01(config-if-range)# switchport mode trunk
SW-CORE-01(config-if-range)# switchport trunk allowed vlan 10,20
SW-CORE-01(config-if-range)# exit

# 配置Port-Channel属性
SW-CORE-01(config)# interface Port-channel 1
SW-CORE-01(config-if)# switchport mode trunk
SW-CORE-01(config-if)# switchport trunk allowed vlan 10,20
SW-CORE-01(config-if)# ip address 10.0.0.1 255.255.255.0   # 三层端口时配IP

# 负载均衡算法
SW-CORE-01(config)# port-channel load-balance src-dst-ip   # 基于源+目的IP
SW-CORE-01(config)# port-channel load-balance src-dst-mac  # 基于源+目的MAC
# 可选: src-ip, dst-ip, src-mac, dst-mac, src-dst-ip, src-dst-mac

# 查看链路聚合状态
SW-CORE-01# show etherchannel summary
SW-CORE-01# show etherchannel port-channel
SW-CORE-01# show interfaces port-channel 1
```

---

## 九、DHCP服务

```bash
# DHCP服务器（全局地址池）
Router(config)# ip dhcp pool HQ-POOL
Router(dhcp-config)# network 192.168.10.0 255.255.255.0
Router(dhcp-config)# default-router 192.168.10.254
Router(dhcp-config)# dns-server 8.8.8.8 114.114.114.114
Router(dhcp-config)# domain-name mycompany.com
Router(dhcp-config)# lease 3               # 租约天数
Router(dhcp-config)# exit

# DHCP排除地址（不分配的地址段）
Router(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.10

# DHCP中继（跨VLAN获取DHCP）
Router(config)# interface Vlan 100
Router(config-if)# ip helper-address 10.0.0.1   # 指向DHCP服务器地址
Router(config-if)# exit

# DHCP Snooping（防DHCP欺骗，在接入交换机配置）
SW-ACCESS(config)# ip dhcp snooping
SW-ACCESS(config)# ip dhcp snooping vlan 10
SW-ACCESS(config)# interface GigabitEthernet 1/0/1
SW-ACCESS(config-if)# ip dhcp snooping trust   # 上联端口设为trust

# 查看DHCP状态
Router# show ip dhcp pool
Router# show ip dhcp binding
Router# show ip dhcp conflict
Router# show ip dhcp server statistics
```

---

## 十、QoS服务质量

```bash
# 流量分类与标记
Router(config)# class-map match-all WEB-CLASS
Router(config-cmap)# match access-group name WEB-FILTER
Router(config-cmap)# exit

# 策略映射（应用QoS策略）
Router(config)# policy-map QOS-POLICY
Router(config-pmap)# class WEB-CLASS
Router(config-pmap-c)# set dscp ef         # 标记为EF（加速转发）
Router(config-pmap-c)# priority            # 严格优先级队列（PQ）
Router(config-pmap-c)# bandwidth percent 30  # 最小保证带宽
Router(config-pmap)# class class-default
Router(config-pmap-c)# fair-queue            # 公平队列
Router(config-pmap)# exit

# 在接口应用策略
Router(config)# interface GigabitEthernet 0/0
Router(config-if)# service-policy output QOS-POLICY

# 流量整形与 policing
Router(config-if)# service-policy output QOS-POLICY
Router(config-if)# speed 1000
Router(config-if)# tx-ring-limit 50   # 调整 transmit ring
```

---

## 十一、堆叠（StackWise）与虚拟化

```bash
# StackWise堆叠（Catalyst 3750/3850系列）
# 主交换机配置（选举优先级设置）
SW-1# switch 1 priority 15
SW-1# switch 1 stack SSD enable
SW-1# reload slot 1

# 成员交换机配置
SW-2# switch 2 provision ws-c3850-48t
SW-2# reload slot 2

# 查看堆叠状态
SW-1# show switch
SW-1# show switch detail
SW-1# show stack-power

# VSS（虚拟交换系统， Catalyst 4500-X/6500系列）
# Switch 1配置
SW-1(config)# switch virtual domain 10
SW-1(config-vs-domain)# switch 1 priority 110
SW-1(config-vs-domain)# switch 1 virtual mac address 001e.beef.1000
SW-1(config)# interface GigabitEthernet 1/1/1 - 2
SW-1(config-if-range)# channel-group 1 mode on
# Switch 2配置类似，priority 100

# 查看VSS
SW-1# show switch virtual
SW-1# show switch virtual role
```

---

## 十二、SNMP监控

```bash
# SNMPv2c（读团体名+写团体名）
Router(config)# snmp-server community public ro              # 只读
Router(config)# snmp-server community private rw             # 读写
Router(config)# snmp-server location Beijing-DC-Floor3
Router(config)# snmp-server contact admin@example.com
Router(config)# snmp-server enable traps                     # 开启Trap
Router(config)# snmp-server host 10.0.0.100 version 2c public  # Trap接收服务器

# SNMPv3（推荐生产环境）
Router(config)# snmp-server group MonitorGroup v3 priv
Router(config)# snmp-server user netmon MonitorGroup v3 auth sha Cisco@123 priv aes 256 Cisco@456
Router(config)# snmp-server view iso included
Router(config)# snmp-server host 10.0.0.100 v3 auth netmon

# 配置SNMP Trap源
Router(config)# snmp-server trap-source Loopback 0
```

---

## 十三、诊断与排障命令

```bash
# ===== 通用排障 =====
Router# ping 192.168.1.1
Router# ping                           # 交互式Ping
Router# ping source 192.168.10.1 target 192.168.1.1     # 指定源地址
Router# traceroute 8.8.8.8
Router# show controllers GigabitEthernet 0/0   # 查看接口硬件信息（CRC错误等）
Router# show interfaces status              # 所有端口状态汇总

# ===== OSPF排障 =====
Router# show ip ospf neighbor
Router# show ip ospf database
Router# show ip ospf interface
Router# debug ip ospf adjacency       # 调试邻居关系建立过程（慎用）
Router# clear ip ospf process          # 重置OSPF进程（慎用）

# ===== BGP排障 =====
Router# show ip bgp
Router# show ip bgp neighbors
Router# show ip bgp vpnv4 all neighbors
Router# clear ip bgp * soft         # 软清BGP会话（不中断连接刷新路由）
Router# clear ip bgp 2.2.2.2        # 清除与指定邻居的BGP会话

# ===== MAC/ARP排障 =====
Router# show mac address-table
Router# show mac address-table aging-time
Router# show mac address-table dynamic address aaaa.bbbb.cccc
Router# show arp
Router# show ip arp

# ===== 生成树排障 =====
Router# show spanning-tree
Router# show spanning-tree blockedports   # 查看被阻塞的端口

# ===== 链路排障 =====
Router# show interfaces GigabitEthernet 0/1
# 重点：CRC errors, runts, giants, input errors, output drops
Router# show interfaces GigabitEthernet 0/1 counters

# ===== CDP/LLDP（发现邻居设备） =====
Router# show cdp neighbors
Router# show cdp neighbors detail
Router# show lldp neighbors
Router# lldp run       # 全局开启LLDP（默认可能关闭）
Router# cdp run         # 全局开启CDP（Cisco私有）

# ===== 抓包（SPAN镜像） =====
Router# monitor session 1 source interface GigabitEthernet 0/1 both
Router# monitor session 1 destination interface GigabitEthernet 0/2
# 查看SPAN会话
Router# show monitor

# ===== 清除统计/表项（排障时临时使用） =====
Router# clear counters
Router# clear mac address-table dynamic
Router# clear arp-cache
Router# clear spanning-tree detected-protocols
```

---

## 十四、常见配置错误排查思路

```
问题1：OSPF邻居起不来
→ 检查：network网段和反掩码是否正确、区域ID是否一致、
        认证是否匹配、hello/dead计时器是否一致（默认10/40秒）、
        接口是否UP、MTU是否一致（思科默认1500）、是否配置为Passive接口

问题2：PC获取不到DHCP地址
→ 检查：地址池网段与VLANIF/SVI是否在同一网段、
        排除地址范围是否包含了VLANIF IP本身、
        中继接口是否配置了helper-address、是否配置在正确VLAN上

问题3：VLAN间无法互通
→ 检查：PC网关是否指向SVI IP、交换机间Trunk是否放行了对应VLAN、
        SVI是否配置了no shutdown、三层路由是否开启（ip routing）

问题4：BGP邻居起不来
→ 检查：AS号是否匹配、邻居地址是否可达（路由表中是否有到邻居的路由）、
        更新源是否一致（IBGP建议用Loopback）、
        EBGP直连默认TTL=1，多跳时需配置neighbor x.x.x.x ebgp-multihop 2
```

---

_参考设备平台：Cisco Catalyst 2960/3750/3850/9300系列交换机、ISR 4000/ASR 1000系列路由器，IOS/IOS-XE 15.x~17.x_
