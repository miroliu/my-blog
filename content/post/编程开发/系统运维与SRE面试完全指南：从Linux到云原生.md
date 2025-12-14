---
title: 系统运维与SRE面试完全指南：从Linux到云原生
description: 全面系统的运维和SRE面试指南，涵盖Linux、网络、容器、Kubernetes、监控、故障处理等所有面试要点
date: 2025-12-10 18:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["编程开发"]
---

# 系统运维与 SRE 面试完全指南：从 Linux 到云原生

系统运维和 SRE（Site Reliability Engineering）是 IT 行业的重要岗位，需要掌握 Linux、网络、容器、监控、故障处理等多方面知识。本文为你提供一套完整的运维和 SRE 面试指南，帮助你全面准备，成功拿到心仪的 Offer。

## 第一章：面试前准备（第 1 周）

### 1.1 岗位理解

#### 运维工程师 vs SRE

- **运维工程师**：传统运维，关注系统稳定
- **SRE**：可靠性工程，关注系统可靠性、可观测性、自动化

#### 核心能力

- **Linux 系统**：系统管理、性能优化
- **网络知识**：TCP/IP、HTTP、DNS
- **容器技术**：Docker、Kubernetes
- **监控告警**：Prometheus、Grafana
- **自动化**：脚本编写、CI/CD
- **故障处理**：问题定位、快速恢复

### 1.2 知识体系梳理

#### 运维知识体系

- **Linux 基础**：命令、文件系统、进程管理
- **网络基础**：TCP/IP、HTTP、DNS、负载均衡
- **容器技术**：Docker、Kubernetes
- **监控告警**：Prometheus、Grafana、ELK
- **自动化运维**：Ansible、Terraform、CI/CD
- **云服务**：AWS、阿里云、腾讯云

## 第二章：Linux 系统面试题（第 1-2 周）

### 2.1 Linux 基础命令

#### 常见问题

**Q1: 常用的 Linux 命令？**

```bash
# 文件操作
ls, cd, pwd, mkdir, rm, cp, mv, find, grep

# 文件查看
cat, less, more, head, tail, vi, vim

# 进程管理
ps, top, htop, kill, killall, jobs, bg, fg

# 网络相关
netstat, ss, ifconfig, ip, ping, curl, wget

# 系统信息
uname, df, du, free, uptime, whoami, id
```

**Q2: 如何查看系统资源使用情况？**

```bash
# CPU 使用率
top
htop
vmstat 1

# 内存使用
free -h
cat /proc/meminfo

# 磁盘使用
df -h
du -sh *

# 网络流量
iftop
nethogs
```

**Q3: 如何查找大文件？**

```bash
# 查找大于 100M 的文件
find / -type f -size +100M

# 查找占用空间最大的目录
du -h --max-depth=1 | sort -hr

# 查找最近修改的文件
find / -type f -mtime -7
```

### 2.2 进程管理

#### 常见问题

**Q1: 进程的状态？**

- **R**：运行中（Running）
- **S**：睡眠（Sleeping）
- **D**：不可中断睡眠（Disk sleep）
- **Z**：僵尸进程（Zombie）
- **T**：停止（Stopped）

**Q2: 如何杀死进程？**

```bash
# 正常终止
kill PID

# 强制终止
kill -9 PID

# 根据名称杀死
killall process_name
pkill process_name

# 杀死所有相关进程
pkill -f "pattern"
```

**Q3: 如何查看进程的详细信息？**

```bash
# 查看进程树
pstree

# 查看进程打开的文件
lsof -p PID

# 查看进程的网络连接
netstat -p | grep PID
ss -p | grep PID

# 查看进程的环境变量
cat /proc/PID/environ
```

### 2.3 文件系统

#### 常见问题

**Q1: Linux 文件系统结构？**

```
/
├── bin      # 二进制可执行文件
├── boot     # 启动文件
├── dev      # 设备文件
├── etc      # 配置文件
├── home     # 用户目录
├── lib      # 库文件
├── opt      # 可选软件
├── proc     # 进程信息
├── root     # root 用户目录
├── sbin     # 系统二进制文件
├── tmp      # 临时文件
├── usr      # 用户程序
└── var      # 可变数据
```

**Q2: 文件权限？**

```bash
# 权限表示
rwx rwx rwx
所有者 组 其他

# 数字表示
755 = rwxr-xr-x
644 = rw-r--r--

# 修改权限
chmod 755 file
chmod u+x file
chmod -R 755 directory
```

**Q3: 软链接和硬链接的区别？**

- **硬链接**：指向 inode，删除原文件不影响
- **软链接**：指向文件路径，删除原文件失效

```bash
# 创建硬链接
ln source target

# 创建软链接
ln -s source target
```

### 2.4 系统性能优化

#### 常见问题

**Q1: 如何优化系统性能？**

```bash
# 1. 优化内核参数
vim /etc/sysctl.conf
sysctl -p

# 2. 调整文件描述符限制
ulimit -n 65535

# 3. 优化 I/O 调度器
echo deadline > /sys/block/sda/queue/scheduler

# 4. 关闭不必要的服务
systemctl disable service_name

# 5. 优化内存使用
echo 1 > /proc/sys/vm/drop_caches
```

**Q2: 如何排查系统负载高的问题？**

```bash
# 1. 查看系统负载
uptime
top

# 2. 查看 CPU 使用情况
top
vmstat 1
sar -u 1

# 3. 查看 I/O 使用情况
iostat -x 1
iotop

# 4. 查看内存使用
free -h
vmstat 1

# 5. 查看网络流量
iftop
nethogs
```

## 第三章：网络知识面试题（第 2-3 周）

### 3.1 TCP/IP 协议

#### 常见问题

**Q1: TCP 和 UDP 的区别？**

- **TCP**：面向连接、可靠、有序、慢
- **UDP**：无连接、不可靠、无序、快

**Q2: TCP 三次握手和四次挥手？**

```
三次握手：
客户端 -> SYN -> 服务端
服务端 -> SYN+ACK -> 客户端
客户端 -> ACK -> 服务端

四次挥手：
客户端 -> FIN -> 服务端
服务端 -> ACK -> 客户端
服务端 -> FIN -> 客户端
客户端 -> ACK -> 服务端
```

**Q3: TCP 的拥塞控制？**

- **慢启动**：拥塞窗口指数增长
- **拥塞避免**：拥塞窗口线性增长
- **快重传**：收到 3 个重复 ACK 立即重传
- **快恢复**：快速恢复拥塞窗口

### 3.2 HTTP/HTTPS

#### 常见问题

**Q1: HTTP 和 HTTPS 的区别？**

- **HTTP**：明文传输，端口 80
- **HTTPS**：加密传输，端口 443，使用 SSL/TLS

**Q2: HTTP 状态码？**

- **2xx**：成功（200 OK, 201 Created）
- **3xx**：重定向（301 Moved, 302 Found）
- **4xx**：客户端错误（404 Not Found, 403 Forbidden）
- **5xx**：服务端错误（500 Internal Error, 502 Bad Gateway）

**Q3: HTTP 请求方法？**

- **GET**：获取资源
- **POST**：创建资源
- **PUT**：更新资源
- **DELETE**：删除资源
- **PATCH**：部分更新

### 3.3 DNS

#### 常见问题

**Q1: DNS 解析过程？**

```
1. 查询本地 hosts 文件
2. 查询本地 DNS 缓存
3. 查询本地 DNS 服务器
4. 查询根域名服务器
5. 查询顶级域名服务器
6. 查询权威域名服务器
7. 返回 IP 地址
```

**Q2: DNS 记录类型？**

- **A**：IPv4 地址
- **AAAA**：IPv6 地址
- **CNAME**：别名
- **MX**：邮件服务器
- **TXT**：文本记录

## 第四章：Docker 和容器化（第 3 周）

### 4.1 Docker 基础

#### 常见问题

**Q1: Docker 和虚拟机的区别？**

- **Docker**：容器，共享宿主机内核，轻量级
- **虚拟机**：完整操作系统，独立内核，重量级

**Q2: Docker 常用命令？**

```bash
# 镜像操作
docker images
docker pull image_name
docker build -t image_name .
docker rmi image_name

# 容器操作
docker ps
docker run -d -p 80:80 image_name
docker stop container_id
docker rm container_id
docker logs container_id
docker exec -it container_id /bin/bash
```

**Q3: Dockerfile 编写？**

```dockerfile
FROM ubuntu:20.04
WORKDIR /app
COPY . .
RUN apt-get update && apt-get install -y python3
EXPOSE 8080
CMD ["python3", "app.py"]
```

### 4.2 Docker 网络和存储

#### 常见问题

**Q1: Docker 网络模式？**

- **bridge**：桥接网络（默认）
- **host**：主机网络
- **none**：无网络
- **overlay**：跨主机网络

**Q2: Docker 数据卷？**

```bash
# 创建数据卷
docker volume create my_volume

# 挂载数据卷
docker run -v my_volume:/data image_name

# 挂载主机目录
docker run -v /host/path:/container/path image_name
```

## 第五章：Kubernetes 面试题（第 3-4 周）

### 5.1 Kubernetes 基础

#### 常见问题

**Q1: Kubernetes 的核心概念？**

- **Pod**：最小部署单元
- **Service**：服务发现和负载均衡
- **Deployment**：部署管理
- **Namespace**：资源隔离
- **ConfigMap/Secret**：配置管理

**Q2: Pod 的生命周期？**

```
Pending -> Running -> Succeeded/Failed
```

**Q3: Service 的类型？**

- **ClusterIP**：集群内部访问
- **NodePort**：节点端口访问
- **LoadBalancer**：负载均衡器
- **ExternalName**：外部服务

### 5.2 Kubernetes 进阶

#### 常见问题

**Q1: 如何实现滚动更新？**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
        - name: app
          image: my-app:v2
```

**Q2: 如何实现资源限制？**

```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "200m"
```

**Q3: 如何排查 Pod 问题？**

```bash
# 查看 Pod 状态
kubectl get pods

# 查看 Pod 详情
kubectl describe pod pod_name

# 查看 Pod 日志
kubectl logs pod_name

# 进入 Pod
kubectl exec -it pod_name -- /bin/bash

# 查看事件
kubectl get events
```

## 第六章：监控和告警（第 4 周）

### 6.1 Prometheus

#### 常见问题

**Q1: Prometheus 的架构？**

- **Prometheus Server**：数据采集和存储
- **Exporters**：指标导出器
- **Alertmanager**：告警管理
- **Grafana**：可视化

**Q2: PromQL 查询？**

```promql
# 查询 CPU 使用率
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 查询内存使用率
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# 查询 QPS
rate(http_requests_total[5m])
```

**Q3: 告警规则配置？**

```yaml
groups:
  - name: example
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "CPU usage is above 80%"
```

### 6.2 日志管理

#### 常见问题

**Q1: ELK 栈的使用？**

- **Elasticsearch**：日志存储和搜索
- **Logstash**：日志收集和处理
- **Kibana**：日志可视化

**Q2: 日志收集方案？**

- **Filebeat**：轻量级日志收集
- **Fluentd**：统一日志层
- **Loki**：轻量级日志聚合

## 第七章：自动化运维（第 4-5 周）

### 7.1 Ansible

#### 常见问题

**Q1: Ansible 的使用？**

```yaml
# playbook 示例
- hosts: web_servers
  tasks:
    - name: Install nginx
      yum:
        name: nginx
        state: present

    - name: Start nginx
      systemd:
        name: nginx
        state: started
        enabled: yes
```

**Q2: Ansible 的优势？**

- **无代理**：通过 SSH 执行
- **幂等性**：多次执行结果一致
- **简单易用**：YAML 语法

### 7.2 CI/CD

#### 常见问题

**Q1: CI/CD 流程？**

```
代码提交 -> 自动构建 -> 自动测试 -> 自动部署
```

**Q2: Jenkins Pipeline？**

```groovy
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package'
            }
        }
        stage('Test') {
            steps {
                sh 'mvn test'
            }
        }
        stage('Deploy') {
            steps {
                sh 'kubectl apply -f k8s/'
            }
        }
    }
}
```

## 第八章：故障处理（第 5 周）

### 8.1 故障排查流程

#### 常见问题

**Q1: 故障排查步骤？**

1. **确认问题**：了解故障现象
2. **收集信息**：日志、监控、告警
3. **定位问题**：分析日志和监控数据
4. **解决问题**：修复或回滚
5. **总结复盘**：分析原因，制定预防措施

**Q2: 常见故障类型？**

- **服务不可用**：检查服务状态、网络、资源
- **性能下降**：检查 CPU、内存、I/O、网络
- **数据丢失**：检查备份、日志、数据库
- **安全漏洞**：检查日志、权限、配置

### 8.2 故障处理案例

#### 案例一：服务响应慢

```bash
# 1. 查看系统负载
top
uptime

# 2. 查看网络连接
netstat -an | grep ESTABLISHED | wc -l
ss -s

# 3. 查看数据库连接
mysql> SHOW PROCESSLIST;

# 4. 查看应用日志
tail -f /var/log/app/error.log

# 5. 查看慢查询
mysql> SHOW VARIABLES LIKE 'slow_query%';
```

#### 案例二：内存泄漏

```bash
# 1. 查看内存使用
free -h
cat /proc/meminfo

# 2. 查看进程内存
ps aux --sort=-%mem | head

# 3. 查看内存泄漏
valgrind --leak-check=full ./app

# 4. 分析内存快照
jmap -dump:format=b,file=heap.bin PID
jhat heap.bin
```

## 第九章：SRE 核心概念（第 5-6 周）

### 9.1 SRE 原则

#### 核心原则

- **错误预算**：允许的故障时间
- **自动化**：减少人工操作
- **可观测性**：监控、日志、追踪
- **持续改进**：从故障中学习

### 9.2 SLA/SLO/SLI

#### 定义

- **SLA**：服务级别协议（Service Level Agreement）
- **SLO**：服务级别目标（Service Level Objective）
- **SLI**：服务级别指标（Service Level Indicator）

#### 示例

```
SLA: 99.9% 可用性（每月最多 43 分钟故障）
SLO: 响应时间 < 200ms（95% 请求）
SLI: 请求成功率、响应时间
```

### 9.3 可观测性

#### 三大支柱

- **Metrics**：指标（Prometheus）
- **Logs**：日志（ELK、Loki）
- **Traces**：追踪（Jaeger、Zipkin）

## 第十章：云服务面试题（第 6 周）

### 10.1 AWS/阿里云

#### 常见问题

**Q1: 云服务的主要服务？**

- **计算**：EC2、ECS
- **存储**：S3、OSS
- **数据库**：RDS、MongoDB
- **网络**：VPC、负载均衡
- **监控**：CloudWatch、云监控

**Q2: 如何设计高可用架构？**

- **多可用区部署**：跨可用区部署
- **负载均衡**：使用负载均衡器
- **自动伸缩**：根据负载自动扩容
- **故障转移**：自动故障转移

## 第十一章：面试技巧（第 6 周）

### 11.1 项目经验准备

#### 项目要点

- **项目背景**：为什么做这个项目
- **技术选型**：为什么选择这些技术
- **架构设计**：如何设计系统架构
- **故障处理**：遇到的故障和解决方案
- **性能优化**：如何优化系统性能

### 11.2 常见问题

**Q: 如何保证系统高可用？**

- **冗余**：多实例、多可用区
- **监控**：实时监控系统状态
- **告警**：及时告警和通知
- **自动化**：自动化故障恢复
- **演练**：定期故障演练

**Q: 如何处理线上故障？**

- **快速响应**：快速定位问题
- **止损**：快速恢复服务
- **根因分析**：分析问题根因
- **改进措施**：制定改进措施

## 结语：充分准备，自信面试

运维和 SRE 面试需要：

1. **扎实基础**：Linux、网络、系统知识
2. **容器技术**：Docker、Kubernetes
3. **监控告警**：Prometheus、Grafana
4. **自动化**：脚本、CI/CD、自动化工具
5. **故障处理**：问题定位和解决能力

记住：

- **多实践**：通过实际项目积累经验
- **多总结**：总结常见问题和解决方案
- **持续学习**：关注新技术和最佳实践
- **保持冷静**：面试时保持冷静和自信

愿每一位运维和 SRE 工程师都能找到心仪的工作！
