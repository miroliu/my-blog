---
title: "Kafka完全指南：从应用场景到实战部署"
description: "详解Kafka消息队列的应用场景、安装部署、核心概念和使用方法，搭配ELK日志系统实战"
date: 2026-04-19T09:00:00+08:00
categories: ["技术分享"]
tags:
  - Kafka
  - 消息队列
  - 大数据
  - ELK
  - 日志系统
comments: true
---

## 前言

Kafka是什么？很多人可能听说过，但不知道它能做什么、怎么用。

简单来说：**Kafka就是一个超级快的信息传递系统**。

本文将用通俗易懂的方式，带你从零掌握Kafka。

---

## 一、Kafka是什么？

### 1.1 一句话理解Kafka

```
Kafka = 餐厅的传菜员

厨师做好菜 → 传菜员拿走 → 送到各个客人桌上
               ↓
Producer生产消息 → Kafka排队 → Consumer消费消息
```

**Kafka就是一个消息队列**，但它比普通的队列强大得多：
- 可以处理海量消息（每秒百万级别）
- 消息可以持久化保存（可以回看）
- 支持多个消费者（一个消息多人消费）

### 1.2 Kafka的工作原理

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kafka 工作原理                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producer（生产者）                                             │
│       ↓ 发送消息                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Kafka集群                            │   │
│   │                                                         │   │
│   │   Topic: order-topic                                    │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐                 │   │
│   │   │Partition│ │Partition│ │Partition│                 │   │
│   │   │    0    │ │    1    │ │    2    │                 │   │
│   │   │  [msg]  │ │  [msg]  │ │  [msg]  │                 │   │
│   │   │  [msg]  │ │  [msg]  │ │  [msg]  │                 │   │
│   │   └─────────┘ └─────────┘ └─────────┘                 │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│       ↓ 消费消息                                                 │
│   Consumer（消费者）                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Kafka vs 其他消息队列

| 特性 | Kafka | RabbitMQ | ActiveMQ | RocketMQ |
|------|-------|----------|----------|----------|
| **吞吐量** | 百万/秒 | 万/秒 | 万/秒 | 十万/秒 |
| **消息持久化** | ✅ 支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **消息回溯** | ✅ 支持 | ❌ 不支持 | ❌ 不支持 | ❌ 支持 |
| **多消费者** | ✅ 支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **消息优先级** | ❌ 不支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **事务支持** | ✅ 支持 | ❌ 半支持 | ❌ 支持 | ✅ 支持 |
| **延迟** | 毫秒级 | 毫秒级 | 毫秒级 | 毫秒级 |

---

## 二、Kafka核心概念

### 2.1 核心术语解释

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kafka 核心概念                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Producer（生产者）                                             │
│   └── 发送消息的应用，比如你的网站、APP                          │
│                                                                 │
│   Consumer（消费者）                                             │
│   └── 接收消息的应用，比如数据分析、日志处理                      │
│                                                                 │
│   Topic（主题）                                                  │
│   └── 消息的分类，类似于文件夹，比如"订单消息"、"日志消息"         │
│                                                                 │
│   Partition（分区）                                               │
│   └── Topic的物理分片，提高并行处理能力                          │
│                                                                 │
│   Broker（代理）                                                  │
│   └── Kafka的服务器，一个Kafka集群有多个Broker                   │
│                                                                 │
│   Producer Group（生产者组）                                      │
│   └── 多个生产者一起工作                                         │
│                                                                 │
│   Consumer Group（消费者组）                                       │
│   └── 多个消费者一起工作，一条消息只被组内一个消费者消费           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Topic和Partition详解

```
┌─────────────────────────────────────────────────────────────────┐
│                      Topic 和 Partition                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Topic: order-topic（订单主题）                                  │
│   │                                                               │
│   ├─ Partition 0                                                │
│   │   ├── 消息1 (offset: 0)                                     │
│   │   ├── 消息2 (offset: 1)                                     │
│   │   └── 消息3 (offset: 2)                                     │
│   │                                                               │
│   ├─ Partition 1                                                │
│   │   ├── 消息4 (offset: 0)                                     │
│   │   └── 消息5 (offset: 1)                                     │
│   │                                                               │
│   └─ Partition 2                                                │
│       ├── 消息6 (offset: 0)                                     │
│       └── 消息7 (offset: 1)                                     │
│                                                                   │
│   特点：                                                          │
│   - 每个Partition内的消息有序                                    │
│   - 不同Partition之间消息无序                                    │
│   - Partition可以提高并行处理能力                                │
│   - Partition可以设置副本数，提高可靠性                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 消息的顺序性

```
场景1：单Partition（保证顺序）
┌────────────────────────────────────┐
│ Partition 0                        │
│ 消息1 → 消息2 → 消息3 → 消息4      │
│                                     │
│ ✅ 消费者按顺序收到：1, 2, 3, 4    │
└────────────────────────────────────┘

场景2：多Partition（不保证顺序）
┌────────────────────────────────────┐
│ Partition 0    Partition 1         │
│ 消息1           消息2               │
│ 消息3           消息4               │
│                                     │
│ ❌ 消费者可能收到：1, 3, 2, 4     │
└────────────────────────────────────┘

场景3：需要严格顺序怎么办？
┌────────────────────────────────────┐
│ 解决方案：用消息Key                 │
│                                     │
│ Producer发送：                      │
│ key="order-001" → 一致性哈希 → Partition 0
│ key="order-002" → 一致性哈希 → Partition 0
│ key="order-003" → 一致性哈希 → Partition 0
│                                     │
│ ✅ 同一个订单的消息都在同一Partition│
└────────────────────────────────────┘
```

---

## 三、Kafka应用场景

### 3.1 应用场景总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Kafka 应用场景                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   场景1：日志收集系统 ⭐⭐⭐⭐⭐                                 │
│   ├── 收集所有服务的日志                                        │
│   ├── 统一发送到Kafka                                           │
│   └── 配合ELK分析日志                                           │
│                                                                 │
│   场景2：消息队列 ⭐⭐⭐⭐⭐                                     │
│   ├── 异步处理订单                                              │
│   ├── 发送短信、邮件通知                                        │
│   └── 订单完成后解耦                                            │
│                                                                 │
│   场景3：用户行为追踪 ⭐⭐⭐⭐                                   │
│   ├── 收集用户点击、浏览、搜索行为                               │
│   ├── 实时分析用户画像                                          │
│   └── 推荐系统数据源                                            │
│                                                                 │
│   场景4：实时流处理 ⭐⭐⭐⭐                                     │
│   ├── 实时统计网站PV/UV                                         │
│   ├── 实时监控告警                                              │
│   └── 实时数据大屏                                              │
│                                                                 │
│   场景5：事件溯源 ⭐⭐⭐⭐                                       │
│   ├── 记录所有业务操作                                          │
│   ├── 用于审计、回滚                                              │
│   └── 构建事件驱动架构                                          │
│                                                                 │
│   场景6：系统解耦 ⭐⭐⭐⭐                                       │
│   ├── 微服务之间通信                                            │
│   ├── 削峰填谷                                                  │
│   └── 系统解耦                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 场景详解：日志收集系统（ELK + Kafka）

**架构图：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ELK + Kafka 日志系统架构                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   应用服务器群                                                   │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                        │
│   │ Web服务器│  │ APP服务器│  │ 数据库   │                        │
│   └────┬────┘  └────┬────┘  └────┬────┘                        │
│        │            │            │                              │
│        └────────────┼────────────┘                              │
│                     │                                            │
│                     ▼                                            │
│          ┌─────────────────────┐                                │
│          │   Filebeat (收集)   │                                │
│          │   日志文件 → Kafka   │                                │
│          └──────────┬──────────┘                                │
│                     │                                            │
│                     ▼                                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Kafka集群                             │   │
│   │   Topic: app-logs                                      │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐                 │   │
│   │   │Partition│ │Partition│ │Partition│                 │   │
│   │   │    0    │ │    1    │ │    2    │                 │   │
│   │   └─────────┘ └─────────┘ └─────────┘                 │   │
│   └───────────────────────────┬───────────────────────────────┘   │
│                              │                                    │
│         ┌────────────────────┼────────────────────┐              │
│         │                    │                    │              │
│         ▼                    ▼                    ▼              │
│   ┌───────────┐      ┌───────────┐      ┌───────────┐          │
│   │  Logstash │      │  Logstash │      │  Logstash │          │
│   │  (消费者1) │      │  (消费者2) │      │  (消费者3) │          │
│   └─────┬─────┘      └─────┬─────┘      └─────┬─────┘          │
│         │                    │                    │                │
│         └────────────────────┼────────────────────┘              │
│                              │                                    │
│                              ▼                                    │
│                    ┌─────────────────┐                          │
│                    │    Elasticsearch   │                      │
│                    │    (存储+搜索)     │                      │
│                    └─────────┬─────────┘                          │
│                              │                                    │
│                              ▼                                    │
│                    ┌─────────────────┐                          │
│                    │     Kibana       │                          │
│                    │   (可视化展示)   │                          │
│                    └─────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**为什么用Kafka而不是直接发送到Elasticsearch？**

| 直接发送 | 使用Kafka |
|----------|-----------|
| 容易丢失消息 | 消息持久化，不丢失 |
| 无法回溯 | 可以回溯消费 |
| 消费端压力大 | 解耦，削峰填谷 |
| 无法多消费者 | 支持多个消费者 |
| 难以扩展 | 轻松扩展 |

---

### 3.3 场景详解：订单系统解耦

**没有Kafka的系统：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    直接调用（耦合严重）                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   用户下单                                                       │
│      │                                                          │
│      ▼                                                          │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    订单服务                               │  │
│   │                                                          │  │
│   │   // 同步处理所有事情                                      │  │
│   │   orderService.createOrder() {                           │  │
│   │       // 1. 创建订单                                       │  │
│   │       // 2. 扣库存                                         │  │
│   │       // 3. 发送短信                                       │  │
│   │       // 4. 发送邮件                                       │  │
│   │       // 5. 添加积分                                       │  │
│   │       // 6. 更新推荐系统                                   │  │
│   │       // 7. 记录日志                                       │  │
│   │   }                                                        │  │
│   │                                                          │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│   问题：                                                          │
│   ❌ 所有服务耦合在一起                                          │
│   ❌ 一个服务挂了，其他都受影响                                  │
│   ❌ 难以扩展新功能                                              │
│   ❌ 测试困难                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**使用Kafka后：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kafka解耦（推荐）                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   用户下单                                                       │
│      │                                                          │
│      ▼                                                          │
│   ┌────────────────────────────────────────────────────────┐   │
│   │              订单服务（生产者）                         │   │
│   │                                                        │   │
│   │   send("order-created", orderId)                       │   │
│   │                        │                               │   │
│   └────────────────────────┼───────────────────────────────┘   │
│                            │                                   │
│                            ▼                                   │
│   ┌────────────────────────────────────────────────────────┐   │
│   │              Kafka (order-topic)                       │   │
│   │                                                        │   │
│   │   Partition0: [order-001]                             │   │
│   │   Partition1: [order-002]                             │   │
│   │   Partition2: [order-003]                             │   │
│   │                                                        │   │
│   └────────────────────────┬───────────────────────────────┘   │
│                            │                                   │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐              │
│   │  库存服务  │   │  短信服务  │   │  积分服务  │              │
│   │ (消费者1)  │   │ (消费者2)  │   │ (消费者3)  │              │
│   └───────────┘   └───────────┘   └───────────┘              │
│         │                 │                 │                   │
│         ▼                 ▼                 ▼                   │
│   ┌───────────┐   ┌───────────┐   ┌───────────┐              │
│   │  邮件服务  │   │ 日志服务   │   │ 推荐服务   │              │
│   │ (消费者4)  │   │ (消费者5)  │   │ (消费者6)  │              │
│   └───────────┘   └───────────┘   └───────────┘              │
│                                                                 │
│   优点：                                                          │
│   ✅ 服务完全解耦                                                │
│   ✅ 一个服务挂了不影响其他                                      │
│   ✅ 轻松添加新功能                                              │
│   ✅ 可以回溯消息                                                │
│   ✅ 削峰填谷                                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.4 场景详解：实时数据统计

```
┌─────────────────────────────────────────────────────────────────┐
│                    实时数据大屏架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   数据源                                                         │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐                       │
│   │ 订单数据 │  │ 用户行为 │  │  监控数据 │                       │
│   └────┬────┘  └────┬────┘  └────┬────┘                       │
│        │             │             │                            │
│        └─────────────┼─────────────┘                            │
│                      │                                          │
│                      ▼                                          │
│              ┌──────────────┐                                  │
│              │    Kafka     │                                  │
│              │  raw-data    │                                  │
│              └──────┬───────┘                                  │
│                     │                                          │
│         ┌───────────┼───────────┐                              │
│         │           │           │                              │
│         ▼           ▼           ▼                              │
│   ┌───────────┐ ┌───────────┐ ┌───────────┐                   │
│   │  Flink    │ │  Spark    │ │  Kafka    │                   │
│   │  Streaming│ │  Streaming│ │  Streams  │                   │
│   └─────┬─────┘ └─────┬─────┘ └─────┬─────┘                   │
│         │             │             │                          │
│         └─────────────┼─────────────┘                          │
│                       │                                        │
│                       ▼                                        │
│               ┌─────────────┐                                 │
│               │ Elasticsearch│                                 │
│               │  (统计结果)  │                                 │
│               └──────┬──────┘                                 │
│                      │                                          │
│                      ▼                                          │
│               ┌─────────────┐                                 │
│               │   Grafana   │                                 │
│               │  (数据大屏)  │                                 │
│               └─────────────┘                                 │
│                                                                 │
│   实时展示：                                                     │
│   📊 今日订单数                                                  │
│   📊 当前在线人数                                                │
│   📊 销售额统计                                                  │
│   📊 系统监控指标                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、Kafka安装教程

### 4.1 环境准备

**系统要求：**

| 组件 | 最低配置 | 推荐配置 |
|------|----------|----------|
| CPU | 2核心 | 4+核心 |
| 内存 | 4GB | 8GB+ |
| 磁盘 | 20GB | 100GB+ SSD |
| 系统 | CentOS 7+ / Ubuntu 18+ | CentOS 8 / Ubuntu 22 |

**Java要求：**
```bash
# Kafka需要Java运行环境
java -version
# OpenJDK 11 或更高版本
```

### 4.2 单节点安装（学习用）

#### 第一步：下载Kafka

```bash
# 创建安装目录
sudo mkdir -p /opt/kafka
cd /opt/kafka

# 下载Kafka（选择合适的版本）
wget https://downloads.apache.org/kafka/3.6.1/kafka_2.13-3.6.1.tgz

# 解压
tar -xzf kafka_2.13-3.6.1.tgz
ln -s kafka_2.13-3.6.1 current

# 进入目录
cd /opt/kafka/current
```

#### 第二步：配置Zookeeper（Kafka内置）

Kafka依赖Zookeeper来管理集群，虽然新版Kafka可以使用KRaft模式不需要Zookeeper，但生产环境仍推荐使用Zookeeper。

```bash
# 启动Zookeeper（使用内置的）
bin/zookeeper-server-start.sh config/zookeeper.properties

# 后台运行
bin/zookeeper-server-start.sh -daemon config/zookeeper.properties
```

#### 第三步：启动Kafka

```bash
# 修改配置（可选）
vim config/server.properties

# 关键配置项：
# broker.id=0
# listeners=PLAINTEXT://localhost:9092
# log.dirs=/tmp/kafka-logs
# zookeeper.connect=localhost:2181

# 启动Kafka
bin/kafka-server-start.sh config/server.properties

# 后台运行
bin/kafka-server-start.sh -daemon config/server.properties
```

#### 第四步：验证安装

```bash
# 检查Kafka进程
jps | grep Kafka

# 检查端口
netstat -tlnp | grep 9092

# 创建测试Topic
bin/kafka-topics.sh --create --topic test --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

# 查看Topic列表
bin/kafka-topics.sh --list --bootstrap-server localhost:9092

# 发送测试消息
echo "Hello Kafka" | bin/kafka-console-producer.sh --topic test --bootstrap-server localhost:9092

# 消费测试消息
bin/kafka-console-consumer.sh --topic test --from-beginning --bootstrap-server localhost:9092
```

---

### 4.3 Kafka一键安装脚本

```bash
#!/bin/bash
# Kafka一键安装脚本
# 适用于 CentOS 7+ / Ubuntu 18+

set -e

KAFKA_VERSION="3.6.1"
SCALA_VERSION="2.13"
KAFKA_HOME="/opt/kafka"

echo "========== 开始安装Kafka =========="

# 1. 安装Java
echo "[1/6] 安装Java..."
if command -v apt &> /dev/null; then
    apt update && apt install -y openjdk-11-jdk
elif command -v yum &> /dev/null; then
    yum install -y java-11-openjdk java-11-openjdk-devel
fi

# 验证Java
java -version

# 2. 下载Kafka
echo "[2/6] 下载Kafka..."
cd /opt
if [ ! -f "kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz" ]; then
    wget https://downloads.apache.org/kafka/${KAFKA_VERSION}/kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz
fi

# 3. 解压安装
echo "[3/6] 解压安装..."
tar -xzf kafka_${SCALA_VERSION}-${KAFKA_VERSION}.tgz
ln -sf /opt/kafka_${SCALA_VERSION}-${KAFKA_VERSION} ${KAFKA_HOME}

# 4. 配置环境变量
echo "[4/6] 配置环境变量..."
echo "export KAFKA_HOME=${KAFKA_HOME}" >> /etc/profile
echo "export PATH=\$PATH:\$KAFKA_HOME/bin" >> /etc/profile
source /etc/profile

# 5. 启动Zookeeper
echo "[5/6] 启动Zookeeper..."
mkdir -p /tmp/zookeeper /tmp/kafka-logs
${KAFKA_HOME}/bin/zookeeper-server-start.sh -daemon ${KAFKA_HOME}/config/zookeeper.properties

# 等待Zookeeper启动
sleep 5

# 6. 启动Kafka
echo "[6/6] 启动Kafka..."
${KAFKA_HOME}/bin/kafka-server-start.sh -daemon ${KAFKA_HOME}/config/server.properties

# 等待Kafka启动
sleep 5

# 验证
echo ""
echo "========== 安装完成 =========="
echo "KAFKA_HOME: ${KAFKA_HOME}"
echo ""

# 检查进程
jps | grep -E "(Kafka|Zookeeper)" || echo "进程检查完成"

# 创建测试Topic
${KAFKA_HOME}/bin/kafka-topics.sh --create --topic test --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1

echo ""
echo "========== 测试 =========="
echo "Topic列表:"
${KAFKA_HOME}/bin/kafka-topics.sh --list --bootstrap-server localhost:9092

echo ""
echo "发送测试消息:"
echo "test message" | ${KAFKA_HOME}/bin/kafka-console-producer.sh --topic test --bootstrap-server localhost:9092

echo ""
echo "消费测试消息:"
${KAFKA_HOME}/bin/kafka-console-consumer.sh --topic test --from-beginning --max-messages 1 --bootstrap-server localhost:9092

echo ""
echo "========== 安装成功！ =========="
echo ""
echo "常用命令："
echo "  启动Zookeeper: ${KAFKA_HOME}/bin/zookeeper-server-start.sh -daemon ${KAFKA_HOME}/config/zookeeper.properties"
echo "  启动Kafka:     ${KAFKA_HOME}/bin/kafka-server-start.sh -daemon ${KAFKA_HOME}/config/server.properties"
echo "  停止Kafka:     ${KAFKA_HOME}/bin/kafka-server-stop.sh"
echo "  停止Zookeeper: ${KAFKA_HOME}/bin/zookeeper-server-stop.sh"
```

---

### 4.4 Docker安装Kafka（最简单）

```bash
# 使用Docker Compose安装Kafka

# 创建docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    container_name: zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"
    volumes:
      - zookeeper_data:/var/lib/zookeeper/data
    networks:
      - kafka-network

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    container_name: kafka
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
    volumes:
      - kafka_data:/var/lib/kafka/data
    networks:
      - kafka-network

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
      KAFKA_CLUSTERS_0_ZOOKEEPER: zookeeper:2181
    networks:
      - kafka-network

volumes:
  zookeeper_data:
  kafka_data:

networks:
  kafka-network:
    driver: bridge
EOF

# 启动
docker-compose up -d

# 访问Kafka UI: http://localhost:8080
```

---

## 五、Kafka常用命令

### 5.1 Topic操作

```bash
# 创建Topic
kafka-topics.sh --create \
  --topic my-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# 查看所有Topic
kafka-topics.sh --list --bootstrap-server localhost:9092

# 查看Topic详情
kafka-topics.sh --describe --topic my-topic --bootstrap-server localhost:9092

# 修改Topic（增加分区）
kafka-topics.sh --alter \
  --topic my-topic \
  --partitions 5 \
  --bootstrap-server localhost:9092

# 删除Topic
kafka-topics.sh --delete --topic my-topic --bootstrap-server localhost:9092
```

### 5.2 生产者操作

```bash
# 启动生产者（控制台）
kafka-console-producer.sh --topic my-topic --bootstrap-server localhost:9092

# 发送带Key的消息
kafka-console-producer.sh --topic my-topic --bootstrap-server localhost:9092 \
  --property parse.key=true \
  --property key.separator=:

# 生产者性能测试
kafka-producer-perf-test.sh \
  --topic my-topic \
  --num-records 1000000 \
  --record-size 1000 \
  --throughput 10000 \
  --producer-props bootstrap.servers=localhost:9092
```

### 5.3 消费者操作

```bash
# 启动消费者（控制台）
kafka-console-consumer.sh --topic my-topic --from-beginning --bootstrap-server localhost:9092

# 消费者组方式消费
kafka-console-consumer.sh \
  --topic my-topic \
  --group my-consumer-group \
  --bootstrap-server localhost:9092

# 查看消费者组
kafka-consumer-groups.sh --list --bootstrap-server localhost:9092

# 查看消费者组详情
kafka-consumer-groups.sh \
  --group my-consumer-group \
  --describe \
  --bootstrap-server localhost:9092

# 消费者性能测试
kafka-consumer-perf-test.sh \
  --topic my-topic \
  --messages 1000000 \
  --threads 4 \
  --bootstrap-server localhost:9092
```

### 5.4 集群操作

```bash
# 添加Broker
# 1. 复制server.properties为server-1.properties
# 2. 修改broker.id=1
# 3. 修改listeners端口
# 4. 启动新Broker

# Leader平衡
kafka-leader-election.sh --topic my-topic --bootstrap-server localhost:9092 -- election PREFERRED_REPLICA

# 分区重分配
# 1. 先生成计划
kafka-reassign-partitions.sh --generate \
  --topics-to-move-json-file topics.json \
  --broker-list "0,1,2,3" \
  --zookeeper localhost:2181

# 2. 执行重分配
kafka-reassign-partitions.sh --execute \
  --reassignment-json-file reassign.json \
  --zookeeper localhost:2181
```

---

## 六、Kafka + ELK实战配置

### 6.1 完整架构

```
应用服务器                          日志处理集群
┌─────────┐                        ┌─────────────────────────────────┐
│ Filebeat │ ───────────┐          │                                 │
└─────────┘            │          │                                 │
┌─────────┐            │          │                                 │
│ Filebeat │ ──────────┼──────────→│ Kafka                          │
└─────────┘            │          │  Topic: app-logs                 │
┌─────────┐            │          │                                 │
│ Filebeat │ ─────────┘          │                                 │
└─────────┘                      │                                 │
                                 │                                 │
                                 │         ┌───────────┐            │
                                 └────────→│  Logstash │            │
                                           └─────┬─────┘            │
                                                 │                  │
                                                 ▼                  │
                                           ┌───────────┐            │
                                           │Elasticsearch│           │
                                           └─────┬─────┘            │
                                                 │                  │
                                                 ▼                  │
                                           ┌───────────┐            │
                                           │  Kibana   │            │
                                           └───────────┘            │
                                           Web界面展示               │
                                         └─────────────────────────────────┘
```

### 6.2 Filebeat配置

```yaml
# /etc/filebeat/filebeat.yml

filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/*.log
      - /opt/app/logs/*.log
    fields:
      service: my-app
      env: production
    fields_under_root: true

  - type: log
    enabled: true
    paths:
      - /var/log/nginx/access.log
    fields:
      service: nginx
      env: production
    fields_under_root: true

output.kafka:
  hosts: ["kafka1:9092", "kafka2:9092", "kafka3:9092"]
  topic: app-logs
  partition.round_robin:
    reachable_only: false
  required_acks: 1
  compression: gzip
  max_message_bytes: 1000000

logging.level: info
```

### 6.3 Logstash配置

```ruby
# /etc/logstash/conf.d/kafka-input.conf

input {
  kafka {
    bootstrap_servers => "kafka1:9092,kafka2:9092,kafka3:9092"
    topics => ["app-logs"]
    group_id => "logstash-consumers"
    codec => json
    decorate_events => true
  }
}

filter {
  if [service] == "nginx" {
    grok {
      match => { "message" => "%{IPORHOST:client_ip} - %{DATA:user} \[%{HTTPDATE:timestamp}\] \"%{WORD:method} %{URIPATHPARAM:request} HTTP/%{NUMBER:http_version}\" %{NUMBER:status:int} %{NUMBER:bytes:int} \"%{DATA:referrer}\" \"%{DATA:agent}\"" }
    }
    date {
      match => [ "timestamp", "dd/MMM/yyyy:HH:mm:ss Z" ]
      target => "@timestamp"
    }
  }

  if [service] == "my-app" {
    json {
      source => "message"
    }
    date {
      match => [ "timestamp", "ISO8601" ]
      target => "@timestamp"
    }
  }

  # 添加标签
  mutate {
    add_field => { "environment" => "%{[fields][env]}" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
  
  # 调试输出
  stdout { codec => rubydebug }
}
```

### 6.4 Elasticsearch配置

```yaml
# /etc/elasticsearch/elasticsearch.yml

cluster.name: elk-cluster
node.name: elk-node-1
node.master: true
node.data: true

network.host: 0.0.0.0
http.port: 9200

# 集群配置
discovery.seed_hosts: ["elasticsearch1", "elasticsearch2", "elasticsearch3"]

# 内存设置
bootstrap.memory_lock: true
ES_JAVA_OPTS: "-Xms4g -Xmx4g"

# 索引设置
action.auto_create_index: true
```

### 6.5 Kibana配置

```bash
# 访问 Kibana
# http://your-ip:5601

# 创建索引模式
# 1. 访问 Management → Index Patterns
# 2. 创建 "app-logs-*" 索引模式
# 3. 设置时间字段为 @timestamp
```

---

## 七、Kafka管理工具

### 7.1 Kafka Manager（CMAK）

```bash
# Docker安装
docker run -d \
  --name kafka-manager \
  -p 9000:9000 \
  -e ZK_HOSTS="zookeeper:2181" \
  hlebalbau/kafka-manager:stable
```

### 7.2 Kafka UI

```bash
# Docker安装
docker run -d \
  --name kafka-ui \
  -p 8080:8080 \
  -e KAFKA_CLUSTERS_0_NAME=local \
  -e KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=kafka:9092 \
  provectuslabs/kafka-ui:latest
```

### 7.3 Kafdrop

```bash
# Docker安装
docker run -d \
  --name kafdrop \
  -p 9000:9000 \
  -e KAFKA_BROKERCONNECT=localhost:9092 \
  obsidiandynamics/kafdrop
```

---

## 八、Kafka性能优化

### 8.1 生产者优化

```properties
# producer.properties

# 批量发送
batch.size=16384
linger.ms=10

# 压缩
compression.type=gzip

# 确认机制
acks=1  # 生产环境用 all

# 重试
retries=3

# 内存
buffer.memory=33554432
```

### 8.2 消费者优化

```properties
# consumer.properties

# 消费者线程数
num.consumer.fetchers=4

# 批量获取
fetch.min.bytes=1
fetch.max.wait.ms=500

# 自动提交（可改为手动）
enable.auto.commit=true
auto.commit.interval.ms=1000

# 内存
max.partition.fetch.bytes=1048576
```

### 8.3 Broker优化

```properties
# server.properties

# 网络线程
num.network.threads=8

# IO线程
num.io.threads=16

# 套接字缓冲区
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400

# 日志配置
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000

# 副本配置
replication.factor=3
min.insync.replicas=2
```

---

## 九、常见问题

### 9.1 Q: Kafka和RabbitMQ的区别？

| 对比 | Kafka | RabbitMQ |
|------|-------|----------|
| **设计目标** | 高吞吐量日志系统 | 通用消息队列 |
| **吞吐量** | 百万/秒 | 万/秒 |
| **消息顺序** | 分区内有序 | 可以保证全局有序 |
| **消息 TTL** | 基于时间或大小 | 基于队列 |
| **消息确认** | offset方式 | ACK机制 |
| **适用场景** | 日志、大数据 | 业务消息 |

**选择建议：**
- 日志收集、大数据 → Kafka
- 业务消息、任务队列 → RabbitMQ

### 9.2 Q: Kafka消息会丢失吗？

```bash
# 防止消息丢失的配置：

# 生产者：确认机制
acks=all
retries=3

# Broker：副本配置
replication.factor=3
min.insync.replicas=2

# 消费者：手动提交offset
enable.auto.commit=false
```

### 9.3 Q: 如何保证消息顺序？

```bash
# 方案1：单Partition
# 创建Topic时指定 partitions=1

# 方案2：使用消息Key
# 相同Key的消息发送到同一Partition
producer.send(new ProducerRecord("topic", key, value));
```

### 9.4 Q: 如何处理消息重复？

```bash
# 消息幂等处理：
# 1. 消费端做去重
# 2. 使用唯一ID
# 3. 数据库唯一索引
# 4. Redis去重
```

### 9.5 Q: Kafka如何实现高可用？

```bash
# 1. 多Broker集群
# 2. 多副本机制
# 3. Controller选举
# 4. ISR机制
# 5. 监控告警
```

---

## 十、总结

### 10.1 Kafka核心要点

```
1. Kafka是什么？
   └── 分布式消息队列，高吞吐量，持久化

2. 核心概念：
   ├── Producer（生产者）
   ├── Consumer（消费者）
   ├── Topic（主题）
   ├── Partition（分区）
   └── Broker（服务器）

3. 应用场景：
   ├── 日志收集（ELK）
   ├── 消息队列
   ├── 实时流处理
   └── 系统解耦

4. 安装方式：
   ├── 单机安装
   ├── Docker安装
   └── 集群安装
```

### 10.2 快速开始命令

```bash
# 1. 一键安装（Docker）
docker-compose up -d

# 2. 创建Topic
kafka-topics.sh --create --topic my-topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1

# 3. 发送消息
kafka-console-producer.sh --topic my-topic --bootstrap-server localhost:9092

# 4. 消费消息
kafka-console-consumer.sh --topic my-topic --from-beginning --bootstrap-server localhost:9092

# 5. 查看Topic
kafka-topics.sh --list --bootstrap-server localhost:9092
```

### 10.3 应用场景速查

| 场景 | 推荐方案 | 说明 |
|------|----------|------|
| 日志收集 | Kafka + ELK | 经典组合 |
| 订单系统 | Kafka + 消费者 | 解耦异步 |
| 实时大屏 | Kafka + Flink | 实时统计 |
| 行为分析 | Kafka + Spark | 用户画像 |
| 系统监控 | Kafka + Prometheus | 指标收集 |

---

*希望这篇文章能帮助你全面了解Kafka！如果有问题，欢迎在评论区交流。*
