---
title: "SRE工程师技术成长指南：从入门到精通的完整学习路线"
description: "详解SRE工程师需要掌握的核心技术栈：Linux、监控、容器、云原生、自动化、编程能力，以及SRE方法论和最佳实践"
date: 2026-04-22T22:00:00+08:00
categories: ["技术分享"]
tags:
  - SRE
  - 运维工程师
  - DevOps
  - Kubernetes
  - Prometheus
  - 可观测性
  - 自动化运维
comments: true
---

## 前言

"SRE工程师要学什么？"

"只会Linux够不够？"

"SRE和传统运维有什么区别？"

"如何从传统运维转型SRE？"

这些问题困扰着很多想要进入SRE领域的朋友。今天我们就来全面解答。

---

## 一、SRE是什么

### 1.1 SRE定义

```
┌─────────────────────────────────────────────────────────────────┐
│                    SRE是什么？                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   SRE = Site Reliability Engineering                           │
│       = 站点可靠性工程                                         │
│                                                                 │
│   核心理念：                                                   │
│   ├── 用软件工程的方法解决运维问题                             │
│   ├── 追求可靠性优先                                           │
│   ├── 自动化代替人工操作                                       │
│   └── 持续改进                                                │
│                                                                 │
│   起源：Google于2003年提出                                     │
│   目标：将错误预算用于创新而不是灭火                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 SRE vs 传统运维

```
┌─────────────────────────────────────────────────────────────────┐
│                    SRE vs 传统运维                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    传统运维                              │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   特点：                                                │   │
│   │   ├── 人工操作为主                                      │   │
│   │   ├── 救火式响应                                        │   │
│   │   ├── 变更频率低                                        │   │
│   │   └── 可靠性依赖人员经验                                │   │
│   │                                                         │   │
│   │   问题：                                                │   │
│   │   ├── 重复劳动多                                       │   │
│   │   ├── 容易出错                                         │   │
│   │   └── 难以规模化                                        │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    SRE                                 │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   特点：                                                │   │
│   │   ├── 自动化优先                                       │   │
│   │   ├── 主动预防                                         │   │
│   │   ├── 快速迭代                                         │   │
│   │   └── 用数据说话                                       │   │
│   │                                                         │   │
│   │   优势：                                                │   │
│   │   ├── 可重复、可验证                                    │   │
│   │   ├── 可规模化                                         │   │
│   │   └── 持续改进                                         │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 SRE核心指标

```
┌─────────────────────────────────────────────────────────────────┐
│                    SRE核心指标：SLO/SLI/SLA                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   SLA (Service Level Agreement) - 服务级别协议          │   │
│   │   └── 对客户的承诺，包含赔偿条款                        │   │
│   │                                                         │   │
│   │   SLO (Service Level Objective) - 服务级别目标          │   │
│   │   └── 内部目标，通常比SLA更严格                        │   │
│   │                                                         │   │
│   │   SLI (Service Level Indicator) - 服务级别指标          │   │
│   │   └── 实际测量的指标                                   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   示例：                                                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   SLA: 99.9% 可用性（年停机<8.7小时）                  │   │
│   │   │                                                    │   │
│   │   ├── 赔偿：每超过1小时赔偿...                        │   │
│   │   └── 对客户承诺                                       │   │
│   │                                                         │   │
│   │   SLO: 99.95% 可用性（年停机<4.4小时）                 │   │
│   │   │                                                    │   │
│   │   └── 内部目标，留有Buffer                            │   │
│   │                                                         │   │
│   │   SLI: 实际测量值                                       │   │
│   │   │                                                    │   │
│   │   ├── 延迟: P99 < 200ms                               │   │
│   │   ├── 可用性: 99.97%                                  │   │
│   │   └── 错误率: < 0.1%                                 │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   错误预算 = 1 - SLO                                          │
│   如果SLO=99.95%，则错误预算=0.05%                            │
│   错误预算用完 → 停止变更，专注可靠性                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、SRE技能全景图

### 2.1 技能金字塔

```
┌─────────────────────────────────────────────────────────────────┐
│                    SRE工程师技能金字塔                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                          ▲                                      │
│                         /│\                                     │
│                        / │ \                                    │
│                       /  │  \                                   │
│                      /   │   \                                  │
│                     /    │    \                                 │
│                    /     │     \                                │
│                   /      │      \                               │
│                  /       │       \                              │
│                 /        │        \                             │
│                /         │         \                            │
│               /          │          \                           │
│              /           │           \                          │
│             /            │            \                         │
│            ┌─────────────┴─────────────┐                      │
│            │       SRE方法论            │                      │
│            │  SLO/错误预算/On-Call      │                      │
│            ├───────────────────────────┤                      │
│            │       编程能力            │                      │
│            │   Python/Go/Shell        │                      │
│            ├───────────────────────────┤                      │
│            │     云原生技术            │                      │
│            │  K8s/Docker/ServiceMesh  │                      │
│            ├───────────────────────────┤                      │
│            │     监控与可观测性        │                      │
│            │ Prometheus/Grafana/ELK  │                      │
│            ├───────────────────────────┤                      │
│            │     基础设施              │                      │
│            │  Linux/网络/安全         │                      │
│            └───────────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技能模块详解

```
┌─────────────────────────────────────────────────────────────────┐
│                    SRE技能模块                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   模块1：基础能力（地基）                                       │
│   ├── Linux系统管理                                           │
│   ├── 计算机网络                                              │
│   ├── Shell脚本                                               │
│   └── 基础安全                                                │
│                                                                 │
│   模块2：监控与可观测性                                        │
│   ├── 指标监控（Prometheus/Grafana）                          │
│   ├── 日志系统（ELK/Loki）                                     │
│   ├── 链路追踪（Jaeger/Zipkin）                               │
│   └── 可观测性架构                                            │
│                                                                 │
│   模块3：容器与编排                                            │
│   ├── Docker基础与进阶                                        │
│   ├── Kubernetes深入理解                                       │
│   ├── Helm Charts                                            │
│   └── Service Mesh (Istio/Linkerd)                           │
│                                                                 │
│   模块4：自动化与基础设施                                       │
│   ├── IaC (Terraform/Ansible)                                 │
│   ├── CI/CD (GitLab CI/Jenkins/ArgoCD)                       │
│   ├── 配置管理                                                │
│   └── 秘钥管理                                                │
│                                                                 │
│   模块5：云平台                                                │
│   ├── AWS/GCP/Azure基础                                       │
│   ├── 云原生服务                                              │
│   └── 多云管理                                                │
│                                                                 │
│   模块6：编程能力                                              │
│   ├── Python (首选)                                           │
│   ├── Go (加分)                                               │
│   └── 脚本能力                                                │
│                                                                 │
│   模块7：SRE方法论                                             │
│   ├── On-Call实践                                            │
│   ├── 故障管理                                               │
│   ├── 容量规划                                               │
│   └── 持续改进                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、基础能力（地基）

### 3.1 Linux系统管理

```
┌─────────────────────────────────────────────────────────────────┐
│                    Linux系统管理技能清单                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   系统管理：                                                    │
│   ├── 用户和用户组管理（useradd/groupadd/sudoers）             │
│   ├── 权限管理（chmod/chown/ACL）                              │
│   ├── 进程管理（ps/top/pgrep/systemctl）                      │
│   ├── 服务管理（systemd/init）                                  │
│   ├── 定时任务（cron/anacron）                                 │
│   └── 系统日志（/var/log/journald）                           │
│                                                                 │
│   文件系统：                                                    │
│   ├── 磁盘管理（fdisk/parted/lvm）                            │
│   ├── 文件系统操作（mkfs/mount/df/du）                        │
│   ├── 软链接和硬链接                                           │
│   └── 权限和ACL                                               │
│                                                                 │
│   网络管理：                                                    │
│   ├── 网络配置（ip/ifconfig/netplan）                          │
│   ├── DNS配置（/etc/resolv.conf）                             │
│   ├── 路由（route/ip route）                                   │
│   ├── 防火墙（iptables/nftables/ufw）                         │
│   └── 网络诊断（ping/traceroute/tcpdump/ss/netstat）          │
│                                                                 │
│   包管理：                                                      │
│   ├── Debian/Ubuntu: apt/dpkg                                 │
│   ├── RHEL/CentOS: yum/dnf/rpm                               │
│   └── Alpine: apk                                              │
│                                                                 │
│   性能分析：                                                    │
│   ├── CPU: top/htop/vmstat/sar                                │
│   ├── 内存: free/vmstat                                        │
│   ├── 磁盘: iostat/iotop                                      │
│   └── 网络: iftop/nethogs                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 常用命令速查

```bash
# ===== 系统信息 =====
uname -a                    # 查看系统信息
hostname                    # 主机名
uptime                      # 运行时间
cat /etc/os-release         # OS版本

# ===== 进程管理 =====
ps aux | grep nginx         # 查看进程
top / htop                  # 实时进程
pkill -9 nginx             # 强制杀死进程
systemctl status nginx      # 服务状态
systemctl restart nginx     # 重启服务

# ===== 磁盘管理 =====
df -h                       # 磁盘使用
du -sh *                    # 目录大小
lsblk                       # 块设备
fdisk -l                    # 分区表

# ===== 网络诊断 =====
ip addr                     # IP地址
ip route                    # 路由表
ss -tlnp                    # 监听端口
netstat -antp               # 连接状态
curl -I http://example.com  # HTTP检测

# ===== 日志查看 =====
journalctl -u nginx         # 服务日志
tail -f /var/log/nginx     # 实时日志
grep "error" /var/log/     # 日志搜索
```

### 3.2 计算机网络

```
┌─────────────────────────────────────────────────────────────────┐
│                    计算机网络技能清单                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   网络分层模型：                                                │
│   ├── 应用层 (HTTP/DNS/TLS/SSH)                               │
│   ├── 传输层 (TCP/UDP/端口)                                   │
│   ├── 网络层 (IP/路由/ICMP)                                    │
│   ├── 链路层 (ARP/以太网/MAC)                                  │
│   └── 物理层                                                   │
│                                                                 │
│   核心协议：                                                    │
│   ├── TCP: 三次握手/四次挥手/滑动窗口                          │
│   ├── UDP: 快速但无连接                                        │
│   ├── DNS: 递归查询/迭代查询/缓存                              │
│   ├── HTTP: 请求响应/状态码/Headers                            │
│   ├── TLS: 加密握手/证书                                       │
│   └── DHCP: 动态IP分配                                         │
│                                                                 │
│   网络工具：                                                    │
│   ├── 诊断: ping/traceroute/mtr                               │
│   ├── 抓包: tcpdump/wireshark                                 │
│   ├── 隧道: ssh tunnel/vpn                                    │
│   └── 负载: haproxy/nginx                                     │
│                                                                 │
│   网络安全：                                                    │
│   ├── 防火墙规则                                              │
│   ├── TLS/SSL证书                                              │
│   ├── VPN/隧道                                                │
│   └── 网络隔离/VLAN                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Shell脚本

```
┌─────────────────────────────────────────────────────────────────┐
│                    Shell脚本技能清单                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   基础语法：                                                    │
│   ├── 变量定义和使用                                           │
│   ├── 条件判断 (if/case)                                       │
│   ├── 循环 (for/while/until)                                   │
│   ├── 函数定义                                                 │
│   └── 数组和字符串处理                                         │
│                                                                 │
│   常用命令：                                                    │
│   ├── 文件: cat/grep/sed/awk/sort/uniq/wc                    │
│   ├── 文本: cut/tr/xargs/find                                  │
│   ├── 网络: curl/wget/ssh/scp                                  │
│   └── 系统: systemctl/crontab                                  │
│                                                                 │
│   进阶技巧：                                                    │
│   ├── 管道和重定向                                             │
│   ├── 正则表达式                                              │
│   ├── 进程替换                                                │
│   └── 命令行参数处理                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 实战脚本示例

```bash
#!/bin/bash
# 示例1：系统健康检查脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# 检查函数
check_cpu() {
    usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$usage > 80" | bc -l) )); then
        echo -e "${RED}CPU使用率过高: ${usage}%${NC}"
        return 1
    else
        echo -e "${GREEN}CPU使用率: ${usage}%${NC}"
        return 0
    fi
}

check_memory() {
    usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
    if (( $(echo "$usage > 85" | bc -l) )); then
        echo -e "${RED}内存使用率过高: ${usage}%${NC}"
        return 1
    else
        echo -e "${GREEN}内存使用率: ${usage}%${NC}"
        return 0
    fi
}

check_disk() {
    usage=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [ "$usage" -gt 90 ]; then
        echo -e "${RED}磁盘使用率过高: ${usage}%${NC}"
        return 1
    else
        echo -e "${GREEN}磁盘使用率: ${usage}%${NC}"
        return 0
    fi
}

check_service() {
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}Nginx: 运行中${NC}"
    else
        echo -e "${RED}Nginx: 已停止${NC}"
        return 1
    fi
}

# 主流程
echo "===== 系统健康检查 ====="
check_cpu
check_memory
check_disk
check_service
echo "===== 检查完成 ====="
```

---

## 四、监控与可观测性

### 4.1 可观测性三支柱

```
┌─────────────────────────────────────────────────────────────────┐
│                    可观测性三支柱                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │                 可观测性 (Observability)                │   │
│   │                                                         │   │
│   │                    ┌───────────┐                       │   │
│   │                    │   Metrics  │                       │   │
│   │                    │   (指标)    │                       │   │
│   │                    └─────┬─────┘                       │   │
│   │                          │                             │   │
│   │         ┌────────────────┼────────────────┐           │   │
│   │         │                │                │             │   │
│   │         ▼                ▼                ▼             │   │
│   │   ┌──────────┐    ┌──────────┐    ┌──────────┐       │   │
│   │   │  Logs   │    │ Traces  │    │  Events │       │   │
│   │   │  (日志)  │    │  (追踪)  │    │ (事件)   │       │   │
│   │   └──────────┘    └──────────┘    └──────────┘       │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   三支柱对比：                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  类型   │  定义        │  工具          │  用途        │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ Metrics │ 数值型指标   │ Prometheus     │ 监控告警    │   │
│   │ Logs   │ 事件记录     │ ELK/Loki       │ 问题排查    │   │
│   │ Traces │ 请求链路     │ Jaeger/Zipkin  │ 性能分析    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Prometheus监控体系

```
┌─────────────────────────────────────────────────────────────────┐
│                    Prometheus监控体系                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   架构图：                                                      │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │         ┌─────────────────────────────────────────┐     │   │
│   │         │           Prometheus Server             │     │   │
│   │         │  ┌───────────┐      ┌───────────────┐  │     │   │
│   │         │  │ Retrieval │ ───→ │    TSDB       │  │     │   │
│   │         │  │ (拉取)   │      │  (时序存储)   │  │     │   │
│   │         │  └───────────┘      └───────────────┘  │     │   │
│   │         └─────────────────────────────────────────┘     │   │
│   │                        │                               │   │
│   │                        ▼                               │   │
│   │         ┌─────────────────────────────────────────┐     │   │
│   │         │              Alertmanager              │     │   │
│   │         │           (告警管理)                   │     │   │
│   │         └─────────────────────────────────────────┘     │   │
│   │                        │                               │   │
│   │                        ▼                               │   │
│   │         ┌─────────────────────────────────────────┐     │   │
│   │         │              Grafana                   │     │   │
│   │         │           (可视化展示)                 │     │   │
│   │         └─────────────────────────────────────────┘     │   │
│   │                                                         │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │              Exporters (被监控目标)            │   │   │
│   │   │  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐ │   │   │
│   │   │  │  Node  │ │   MySQL│ │ Nginx  │ │ K8s   │ │   │   │
│   │   │  │Exporter│ │Exporter│ │Exporter│ │Exporter│ │   │   │
│   │   │  └────────┘ └────────┘ └────────┘ └───────┘ │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   核心概念：                                                    │
│   ├── Metrics: 时序数据，有名称/labels/timestamp/value         │
│   ├── Targets: 监控目标，通过service discovery或静态配置       │
│   ├── PromQL: 查询语言                                        │
│   ├── Recording Rules: 预计算                                 │
│   └── Alert Rules: 告警规则                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Prometheus实战配置

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - "rules/*.yml"

scrape_configs:
  # 监控自身
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # 监控Linux主机
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  # 监控Kubernetes
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - source_labels: [__address__]
        regex: '(.*):10250'
        replacement: '${1}:9100'
        target_label: __address__
```

```yaml
# rules/node.yml - 告警规则
groups:
  - name: node_alerts
    interval: 30s
    rules:
      # CPU使用率过高
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU使用率过高"
          description: "实例 {{ $labels.instance }} CPU使用率超过80%，当前值: {{ $value }}%"

      # 内存使用率过高
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "内存使用率过高"
          description: "实例 {{ $labels.instance }} 内存使用率超过85%，当前值: {{ $value }}%"

      # 磁盘空间不足
      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes{fstype!~"tmpfs|fuse.lxcfs"} / node_filesystem_size_bytes{fstype!~"tmpfs|fuse.lxcfs"}) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "磁盘空间不足"
          description: "实例 {{ $labels.instance }} 磁盘 {{ $labels.mountpoint }} 剩余空间不足10%"

      # 服务宕机
      - alert: TargetDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "监控目标宕机"
          description: "{{ $labels.job }} - {{ $labels.instance }} 已宕机超过1分钟"
```

### 4.3 Grafana可视化

```
┌─────────────────────────────────────────────────────────────────┐
│                    Grafana使用指南                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   常用PromQL示例：                                              │
│                                                                 │
│   # 系统指标                                                   │
│   node_cpu_seconds_total{mode="idle"}                          │
│   rate(node_cpu_seconds_total[5m])                             │
│   avg by (instance)(rate(node_cpu_seconds_total[5m]))         │
│                                                                 │
│   # 内存指标                                                   │
│   node_memory_MemTotal_bytes                                   │
│   node_memory_MemAvailable_bytes                               │
│   (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100
│                                                                 │
│   # 网络指标                                                   │
│   rate(node_network_receive_bytes_total[5m])                   │
│   rate(node_network_transmit_bytes_total[5m])                  │
│                                                                 │
│   # Kubernetes指标                                            │
│   kube_pod_container_resource_requests_cpu_cores               │
│   kube_pod_container_resource_limits_cpu_cores                 │
│   sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)   │
│                                                                 │
│   # 应用指标（自定义）                                          │
│   http_requests_total{method="GET", status="200"}             │
│   rate(http_requests_total[5m])                               │
│   histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 日志系统

```
┌─────────────────────────────────────────────────────────────────┐
│                    日志系统方案                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ELK Stack:                                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   日志流程：                                           │   │
│   │                                                         │   │
│   │   应用日志 ──→ Filebeat ──→ Logstash ──→ Elasticsearch │
│   │                                            │            │   │
│   │                                            ▼            │   │
│   │                                      Kibana           │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Loki + Promtail:                                             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   日志流程：                                           │   │
│   │                                                         │   │
│   │   应用日志 ──→ Promtail ──→ Loki ──→ Grafana           │   │
│   │                                                         │   │
│   │   优点：                                               │   │
│   │   ├── 原生支持Prometheus标签                          │   │
│   │   ├── 资源消耗低                                      │   │
│   │   └── 和监控系统集成方便                               │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   推荐架构：                                                    │
│   ├── 小规模: Loki + Promtail + Grafana                      │
│   ├── 中规模: ELK Stack                                       │
│   └── 大规模: 多集群 + 联邦                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、容器与编排

### 5.1 Docker基础

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker技能清单                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   核心概念：                                                    │
│   ├── 镜像 (Image): 只读模板                                  │
│   ├── 容器 (Container): 镜像的运行实例                        │
│   ├── 仓库 (Registry): 存储和分发镜像                        │
│   └── Dockerfile: 构建镜像的脚本                               │
│                                                                 │
│   基础命令：                                                    │
│   ├── 镜像: docker pull/build/rmi/images                     │
│   ├── 容器: docker run/ps/stop/rm/exec/logs                  │
│   ├── 网络: docker network ls/create/connect                  │
│   └── 存储: docker volume ls/create/inspect                    │
│                                                                 │
│   进阶技能：                                                    │
│   ├── Dockerfile优化 (多阶段构建/层缓存)                       │
│   ├── Docker Compose (多容器编排)                             │
│   ├── Docker Registry (私有镜像仓库)                          │
│   └── Docker网络模式 (bridge/host/overlay)                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Dockerfile最佳实践

```dockerfile
# 示例：多阶段构建的Node.js应用
# 阶段1：构建
FROM node:18-alpine AS builder
WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .
RUN npm run build

# 阶段2：运行
FROM node:18-alpine AS runner
WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# 设置用户
USER nextjs

EXPOSE 3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

### 5.2 Kubernetes深入

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes技能清单                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   核心资源：                                                    │
│   ├── Workloads: Pod/Deployment/StatefulSet/DaemonSet         │
│   ├── Networking: Service/Ingress/NetworkPolicy                │
│   ├── Config: ConfigMap/Secret                                  │
│   ├── Storage: PV/PVC/StorageClass                             │
│   └── Security: ServiceAccount/Role/RoleBinding                │
│                                                                 │
│   核心概念：                                                    │
│   ├── 调度: Node/Pod亲和性/污点容忍                           │
│   ├── 扩缩容: HPA/VPA/Cluster Autoscaler                      │
│   ├── 滚动更新: RollingUpdate/RollingBack                      │
│   └── 网络模型: DNS/Service/Ingress                           │
│                                                                 │
│   运维技能：                                                    │
│   ├── 集群部署: kubeadm/k3s/minikube                          │
│   ├── 存储管理: CSI/StorageClass                              │
│   ├── 安全加固: NetworkPolicy/PodSecurityPolicy/RBAC          │
│   └── 监控排障: kubectl describe/logs/exec/debug              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Kubernetes核心配置

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: myapp
    spec:
      terminationGracePeriodSeconds: 60
      containers:
      - name: myapp
        image: myregistry/myapp:v1.0.0
        ports:
        - containerPort: 8080
          name: http
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 10"]
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: myapp
              topologyKey: kubernetes.io/hostname
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
---
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 5.3 Helm Charts

```
┌─────────────────────────────────────────────────────────────────┐
│                    Helm使用指南                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   核心概念：                                                    │
│   ├── Chart: Helm包，包含模板和配置                            │
│   ├── Release: Chart的运行实例                                 │
│   ├── Repository: Chart仓库                                     │
│   └── Values: 配置参数                                         │
│                                                                 │
│   常用命令：                                                    │
│   ├── helm search repo nginx                                 │
│   ├── helm install my-nginx bitnami/nginx                     │
│   ├── helm upgrade my-nginx bitnami/nginx                     │
│   ├── helm rollback my-nginx 1                               │
│   ├── helm list -A                                           │
│   └── helm uninstall my-nginx                                 │
│                                                                 │
│   创建Chart:                                                    │
│   ├── helm create mychart                                    │
│   ├── 编辑Chart.yaml/values.yaml/templates/                   │
│   ├── helm lint mychart                                      │
│   └── helm package mychart                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、自动化与基础设施

### 6.1 IaC基础设施即代码

```
┌─────────────────────────────────────────────────────────────────┐
│                    IaC工具对比                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Terraform                             │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   特点：                                                │   │
│   │   ├── HCL语言，声明式                                   │   │
│   │   ├── 支持多云（AWS/GCP/Azure）                        │   │
│   │   ├── 状态管理                                         │   │
│   │   └── 执行计划预览                                     │   │
│   │                                                         │   │
│   │   适用场景：                                            │   │
│   │   ├── 基础设施创建和更新                                │   │
│   │   ├── 多云环境管理                                      │   │
│   │   └── 基础设施销毁重建                                  │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Ansible                               │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   特点：                                                │   │
│   │   ├── YAML语言，幂等性                                  │   │
│   │   ├── SSH连接，Agentless                              │   │
│   │   ├── 丰富的模块库                                     │   │
│   │   └── 适合配置管理                                     │   │
│   │                                                         │   │
│   │   适用场景：                                            │   │
│   │   ├── 配置管理和应用部署                                │   │
│   │   ├── 操作系统配置                                    │   │
│   │   └── 批量任务执行                                     │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   推荐组合：                                                    │
│   ├── Terraform: 基础设施创建/销毁                             │
│   └── Ansible: 配置管理/应用部署                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Terraform实战

```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "prod-vpc"
    Environment = "prod"
    ManagedBy   = "terraform"
  }
}

# 子网
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "public-subnet-${count.index + 1}"
  }
}

# EKS集群
resource "aws_eks_cluster" "main" {
  name     = "prod-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = aws_subnet.public[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}

# 变量定义
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}
```

### 6.2 CI/CD持续集成

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD工具链                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   常用工具：                                                    │
│   ├── GitLab CI/CD: GitLab内置                                 │
│   ├── Jenkins: 老牌，功能强大                                  │
│   ├── ArgoCD: GitOps for Kubernetes                           │
│   └── GitHub Actions: GitHub集成                               │
│                                                                 │
│   CI/CD流程：                                                   │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Code Commit                                           │   │
│   │       │                                                 │   │
│   │       ▼                                                 │   │
│   │   ┌─────────┐                                          │   │
│   │   │  Build  │ 编译/打包                                │   │
│   │   └────┬────┘                                          │   │
│   │        ▼                                                │   │
│   │   ┌─────────┐                                          │   │
│   │   │  Test   │ 单元测试/集成测试                       │   │
│   │   └────┬────┘                                          │   │
│   │        ▼                                                │   │
│   │   ┌─────────┐                                          │   │
│   │   │  Scan   │ 安全扫描/代码扫描                       │   │
│   │   └────┬────┘                                          │   │
│   │        ▼                                                │   │
│   │   ┌─────────┐                                          │   │
│   │   │  Push   │ 推送镜像                                │   │
│   │   └────┬────┘                                          │   │
│   │        ▼                                                │   │
│   │   ┌─────────┐                                          │   │
│   │   │ Deploy  │ 部署到环境                              │   │
│   │   └─────────┘                                          │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### GitLab CI示例

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - scan
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA

# 构建阶段
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - main
    - develop

# 测试阶段
test:unit:
  stage: test
  image: node:18-alpine
  script:
    - npm ci
    - npm run test:unit
  coverage: '/Coverage: \d+\.\d+%/'
  artifacts:
    reports:
      junit: coverage/junit.xml

test:integration:
  stage: test
  image: node:18-alpine
  services:
    - postgres:15
    - redis:7
  script:
    - npm ci
    - npm run test:integration
  only:
    - main

# 安全扫描
security:trivy:
  stage: scan
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy image --exit-code 0 --severity HIGH,CRITICAL $DOCKER_IMAGE
  allow_failure: true
  only:
    - main

# 部署阶段
deploy:staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/myapp myapp=$DOCKER_IMAGE -n staging
    - kubectl rollout status deployment/myapp -n staging
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

deploy:prod:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/myapp myapp=$DOCKER_IMAGE -n production
    - kubectl rollout status deployment/myapp -n production
  environment:
    name: production
    url: https://example.com
  when: manual
  only:
    - main
```

---

## 七、编程能力

### 7.1 Python必备技能

```
┌─────────────────────────────────────────────────────────────────┐
│                    Python SRE技能清单                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   基础能力：                                                    │
│   ├── 语法基础（变量/函数/类/模块）                            │
│   ├── 数据结构（列表/字典/集合/元组）                           │
│   ├── 文件操作                                                 │
│   └── 异常处理                                                 │
│                                                                 │
│   SRE必备库：                                                  │
│   ├── requests: HTTP请求                                       │
│   ├── paramiko: SSH连接                                       │
│   ├── psutil: 系统监控                                        │
│   ├── fabric: 远程部署                                        │
│   ├── schedule: 定时任务                                      │
│   └── logging: 日志记录                                       │
│                                                                 │
│   运维自动化：                                                  │
│   ├── Kubernetes Client (kubernetes.client)                    │
│   ├── Docker SDK (docker)                                     │
│   ├── Prometheus Client (prometheus_client)                   │
│   └── Cloud SDK (boto3/azure-sdk)                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Python SRE脚本示例

```python
#!/usr/bin/env python3
"""Kubernetes健康检查和告警脚本"""

import sys
import time
from datetime import datetime
from kubernetes import client, config
from kubernetes.client.rest import ApiException

class K8sHealthChecker:
    def __init__(self):
        try:
            config.load_incluster_config()
        except config.ConfigException:
            config.load_kube_config()
        self.v1 = client.CoreV1Api()
        self.apps_v1 = client.AppsV1Api()

    def check_node_status(self):
        """检查节点状态"""
        print("===== 节点状态 =====")
        nodes = self.v1.list_node()
        issues = []

        for node in nodes.items:
            conditions = {c.type: c.status for c in node.status.conditions}
            if conditions.get('Ready') != 'True':
                issues.append(f"节点 {node.metadata.name} 不是Ready状态")
            print(f"节点: {node.metadata.name}, Ready: {conditions.get('Ready', 'Unknown')}")

        return issues

    def check_pod_status(self, namespace='default'):
        """检查Pod状态"""
        print(f"\n===== {namespace} 命名空间Pod状态 =====")
        issues = []

        pods = self.v1.list_namespaced_pod(namespace)
        for pod in pods.items:
            phase = pod.status.phase
            if phase != 'Running':
                issues.append(f"Pod {pod.metadata.name} 状态异常: {phase}")
                print(f"❌ {pod.metadata.name}: {phase}")
            else:
                # 检查容器状态
                container_statuses = pod.status.container_statuses or []
                for cs in container_statuses:
                    if not cs.ready:
                        issues.append(f"容器 {cs.name} 未就绪")
                        print(f"❌ {pod.metadata.name}/{cs.name}: NotReady")
                    elif cs.state.waiting:
                        issues.append(f"容器 {cs.name} 等待中: {cs.state.waiting.reason}")
                        print(f"⚠️ {pod.metadata.name}/{cs.name}: {cs.state.waiting.reason}")
                    else:
                        print(f"✓ {pod.metadata.name}/{cs.name}: Running")

        return issues

    def check_hpa_status(self, namespace='default'):
        """检查HPA状态"""
        print(f"\n===== {namespace} 命名空间HPA状态 =====")
        try:
            hpas = self.apps_v1.list_namespaced_horizontal_pod_autoscaler(namespace)
            for hpa in hpas.items:
                current = hpa.status.current_replicas or 0
                desired = hpa.status.desired_replicas or 0
                min_replicas = hpa.spec.min_replicas or 1
                max_replicas = hpa.spec.max_replicas

                print(f"{hpa.metadata.name}: 当前={current}, 期望={desired}, 范围={min_replicas}-{max_replicas}")

                if current < min_replicas:
                    print(f"⚠️ HPA {hpa.metadata.name} 当前副本数低于最小值")
        except ApiException as e:
            print(f"HPA检查失败: {e}")

    def run_health_check(self, namespace='default'):
        """执行完整健康检查"""
        print(f"\n{'='*50}")
        print(f"Kubernetes健康检查 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*50}")

        all_issues = []
        all_issues.extend(self.check_node_status())
        all_issues.extend(self.check_pod_status(namespace))
        self.check_hpa_status(namespace)

        print(f"\n{'='*50}")
        if all_issues:
            print(f"发现 {len(all_issues)} 个问题:")
            for issue in all_issues:
                print(f"  - {issue}")
            return 1
        else:
            print("✓ 所有检查通过")
            return 0

if __name__ == '__main__':
    namespace = sys.argv[1] if len(sys.argv) > 1 else 'default'
    checker = K8sHealthChecker()
    sys.exit(checker.run_health_check(namespace))
```

### 7.2 Go语言（加分项）

```
┌─────────────────────────────────────────────────────────────────┐
│                    Go语言SRE技能清单                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   适用场景：                                                    │
│   ├── CLI工具开发                                              │
│   ├──Exporter开发                                              │
│   ├── 高性能服务                                              │
│   └── 云原生组件开发                                          │
│                                                                 │
│   核心库：                                                      │
│   ├── net/http: HTTP服务                                       │
│   ├── prometheus/client_golang: Prometheus指标                │
│   ├── client-go: Kubernetes客户端                             │
│   └── log/slog: 日志                                          │
│                                                                 │
│   推荐学习资源：                                                │
│   ├── Go语言圣经                                              │
│   ├── Go Web编程                                              │
│   └── K8s源码阅读                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 八、云平台

### 8.1 主流云平台对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    主流云平台对比                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┬─────────────┬─────────────┬─────────────┐   │
│   │   服务      │     AWS     │     GCP     │    Azure    │   │
│   ├─────────────┼─────────────┼─────────────┼─────────────┤   │
│   │  计算       │    EC2      │   GCE      │    VM      │   │
│   │  容器       │    EKS      │    GKE     │    AKS     │   │
│   │  对象存储   │     S3      │    GCS     │    Blob    │   │
│   │  数据库     │    RDS      │   CloudSQL │   AzureSQL │   │
│   │  负载均衡   │     ALB     │   CloudLB │    ALB     │   │
│   │  CDN       │   CloudFront│ CloudCDN  │   AzureCDN │   │
│   │  DNS       │   Route53   │ Cloud DNS │   AzureDNS │   │
│   │  监控       │   CloudWatch│   CloudMon │   Monitor  │   │
│   └─────────────┴─────────────┴─────────────┴─────────────┘   │
│                                                                 │
│   推荐：                                                        │
│   ├── AWS: 生态最完善，文档丰富                                │
│   ├── GCP: Kubernetes原生，性价比高                            │
│   └── Azure: 微软生态集成好                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 多云管理

```
┌─────────────────────────────────────────────────────────────────┐
│                    多云管理策略                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   工具选择：                                                    │
│   ├── Terraform: 基础设施编排                                  │
│   ├── Pulumi: 编程式IaC                                       │
│   ├── Crossplane: K8s原生多云                                 │
│   └── Ansible: 配置管理                                        │
│                                                                 │
│   最佳实践：                                                    │
│   ├── 抽象层设计（不绑定特定云）                               │
│   ├── 统一监控和日志                                           │
│   ├── 统一身份认证                                             │
│   └── 自动化故障转移                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 九、SRE方法论

### 9.1 On-Call实践

```
┌─────────────────────────────────────────────────────────────────┐
│                    On-Call最佳实践                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   On-Call流程：                                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   告警触发 ──→ 响应 ──→ 确认 ──→ 调查 ──→ 解决       │   │
│   │     │                                         │         │   │
│   │     │              ↑                         │         │   │
│   │     └──────────────┴─────────────────────────┘         │   │
│   │                    升级流程                            │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   关键指标：                                                    │
│   ├── MTTR: Mean Time To Recovery (平均恢复时间)               │
│   ├── MTTA: Mean Time To Acknowledge (平均确认时间)             │
│   └── 告警疲劳度管理                                           │
│                                                                 │
│   最佳实践：                                                    │
│   ├── 告警分级：P1/P2/P3/P4                                   │
│   ├── 非工作时间告警抑制                                      │
│   ├── 值班轮换制度                                            │
│   ├── On-Call文档标准化                                       │
│   └── 事后review流程                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 故障管理

```
┌─────────────────────────────────────────────────────────────────┐
│                    故障管理流程                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   故障生命周期：                                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   ┌──────────┐                                          │   │
│   │   │  Detection │ 检测到故障                             │   │
│   │   └────┬─────┘                                          │   │
│   │        ▼                                                │   │
│   │   ┌──────────┐                                          │   │
│   │   │ Response  │ 立即响应止血                           │   │
│   │   └────┬─────┘                                          │   │
│   │        ▼                                                │   │
│   │   ┌──────────┐                                          │   │
│   │   │  Analyze  │ 分析根因                              │   │
│   │   └────┬─────┘                                          │   │
│   │        ▼                                                │   │
│   │   ┌──────────┐                                          │   │
│   │   │  Resolve │ 修复问题                               │   │
│   │   └────┬─────┘                                          │   │
│   │        ▼                                                │   │
│   │   ┌──────────┐                                          │   │
│   │   │ Postmortem│ 复盘改进                              │   │
│   │   └──────────┘                                          │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Postmortem模板：                                             │
│   ├── 故障时间线                                              │
│   ├── 影响范围                                                │
│   ├── 根本原因                                                │
│   ├── 止血措施                                                │
│   ├── 改进措施                                                │
│   └── Action Items                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 容量规划

```
┌─────────────────────────────────────────────────────────────────┐
│                    容量规划方法                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   容量规划维度：                                                │
│   ├── 计算容量: CPU/内存                                      │
│   ├── 存储容量: 磁盘空间/IOPS                                 │
│   ├── 网络容量: 带宽/连接数                                   │
│   └── 应用容量: QPS/并发/响应时间                             │
│                                                                 │
│   规划方法：                                                    │
│   ├── 趋势分析: 基于历史数据预测                              │
│   ├── 容量模型: 建立容量公式                                  │
│   ├── 压力测试: 确定系统上限                                  │
│   └── Buffer预留: 预留20-30%Buffer                           │
│                                                                 │
│   自动化扩缩容：                                                │
│   ├── K8s: HPA/VPA/Cluster Autoscaler                        │
│   ├── AWS: ASG/Auto Scaling                                  │
│   └── 云原生: KEDA/ Karpenter                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 十、学习路线图

### 10.1 SRE成长路径

```
┌─────────────────────────────────────────────────────────────────┐
│                    SRE工程师成长路径                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Level 1: 运维基础（0-1年）                                   │
│   ├── Linux系统管理                                           │
│   ├── Shell脚本编写                                           │
│   ├── 网络基础                                                │
│   ├── 基础监控 (Zabbix/Nagios)                                │
│   └── 简单自动化                                              │
│                           ↓                                      │
│   Level 2: 容器与编排（1-2年）                                 │
│   ├── Docker深入                                              │
│   ├── Kubernetes掌握                                          │
│   ├── CI/CD工具                                               │
│   └── 监控体系 (Prometheus/Grafana)                           │
│                           ↓                                      │
│   Level 3: 云原生SRE（2-3年）                                  │
│   ├── 云平台 (AWS/GCP/Azure)                                 │
│   ├── IaC (Terraform/Ansible)                                 │
│   ├── 服务网格                                                │
│   └── 可观测性架构                                            │
│                           ↓                                      │
│   Level 4: 高级SRE（3-5年）                                    │
│   ├── SRE方法论深入                                          │
│   ├── 故障演练                                                │
│   ├── 性能调优                                                │
│   ├── 平台工程                                                │
│   └── 团队影响                                                │
│                           ↓                                      │
│   Level 5: SRE专家/架构师（5年+）                             │
│   ├── 全局架构设计                                            │
│   ├── 成本优化                                                │
│   ├── 技术战略                                                │
│   └── 团队建设                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 每日学习计划

```
┌─────────────────────────────────────────────────────────────────┐
│                    SRE每日学习计划                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   建议时间分配：                                                │
│   ├── 30% 理论学习                                            │
│   ├── 50% 实践操作                                            │
│   └── 20% 总结复盘                                            │
│                                                                 │
│   推荐学习节奏：                                                │
│   ├── 每天: 1-2小时                                           │
│   ├── 每周: 完成一个小主题                                     │
│   ├── 每月: 完成一个大模块                                     │
│   └── 每季: 实践一个完整项目                                   │
│                                                                 │
│   学习资源：                                                    │
│   ├── 官方文档 (Kubernetes/Docker/Prometheus)                  │
│   ├── 技术书籍                                                │
│   ├── 在线课程 (Coursera/Udemy/Linux Foundation)               │
│   ├── 博客文章 (CNCF/云厂商博客)                              │
│   └── 社区交流 (Meetup/Slack/微信群)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 十一、总结

### 11.1 SRE核心技能清单

```
┌─────────────────────────────────────────────────────────────────┐
│                    SRE核心技能清单                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   必备技能（必须掌握）：                                        │
│   ├── Linux系统管理                                           │
│   ├── Shell脚本                                               │
│   ├── 计算机网络                                              │
│   ├── Docker容器                                              │
│   ├── Kubernetes                                              │
│   ├── Prometheus + Grafana                                    │
│   ├── CI/CD基础                                              │
│   ├── Python基础                                              │
│   ├── 日志系统                                                │
│   └── SRE方法论（On-Call/SLO/Postmortem）                    │
│                                                                 │
│   加分技能（提升竞争力）：                                      │
│   ├── Go语言                                                  │
│   ├── Terraform/IaC                                          │
│   ├── 云平台深入                                              │
│   ├── Service Mesh                                            │
│   ├── 安全加固                                                │
│   └── 性能调优                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 快速入门命令

```bash
# ===== Linux基础 =====
# 系统信息
uname -a && cat /etc/os-release

# 进程管理
ps aux | grep -E "nginx|java|python" | head -10

# 磁盘和内存
df -h && free -h

# ===== Docker =====
docker ps -a && docker images
docker logs -f container_name --tail 100
docker exec -it container_name /bin/bash

# ===== Kubernetes =====
kubectl get pods,svc,deploy -n namespace
kubectl describe pod pod_name -n namespace
kubectl logs -f pod_name -n namespace
kubectl get events --sort-by='.lastTimestamp' -A

# ===== 监控 =====
curl -s http://prometheus:9090/api/v1/query?query=up
curl -s http://prometheus:9090/api/v1/targets

# ===== 网络 =====
curl -I https://example.com
netstat -tlnp | grep LISTEN
ss -s

# ===== 日志 =====
journalctl -u nginx --since "1 hour ago" --no-pager
grep -E "ERROR|FATAL" /var/log/app.log | tail -50
```

---

*希望这篇文章能帮你规划好SRE的学习路径！记住，SRE是一个持续学习的领域，技术在不断演进，保持学习的热情很重要。*
