---
title: 云原生可观测性体系：Metrics、Logging、Tracing 三大支柱实战
description: 系统讲解云原生时代的可观测性三大支柱——指标(Metrics)、日志(Logging)、链路追踪(Tracing)，给出基于 Prometheus + Loki + Tempo 的开源完整方案与生产最佳实践
slug: 云原生可观测性三大支柱
date: 2026-09-30T14:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["云原生"]
---

# 云原生可观测性体系：Metrics、Logging、Tracing 三大支柱实战

## 引言：从监控到可观测性

传统监控关心的是"**系统是否在跑**"：CPU 高不高、磁盘满没满。而云原生时代的可观测性(Observability)关心的是"**系统为什么是这样**"——你能从外部输出推断出内部状态的能力。

CNCF 把可观测性拆分为三大支柱：**Metrics（指标）、Logging（日志）、Tracing（链路追踪）**。三者各有侧重，又彼此互补。

本文将带你系统地理解这三大支柱，并给出一套生产级、可落地的开源方案。

## 第一章：为什么需要可观测性

### 1.1 云原生带来的挑战

和传统单体应用相比，云原生系统有三个显著特征：

- **动态性**：Pod IP 会变、副本数会自动扩缩、节点会故障转移
- **分布式**：一次请求会经过网关、网关、认证、订单、库存、支付等多个服务
- **多语言**：Go、Java、Python、Node.js 异构并存

这些特征让传统的"ssh 到机器看日志"模式彻底失效。你需要的是**统一采集、统一存储、统一查询**的可观测平台。

### 1.2 三大支柱的定位

| 支柱 | 回答的问题 | 数据形态 | 典型工具 |
|------|-----------|----------|---------|
| **Metrics** | 系统现在多忙？趋势如何？ | 时序数值 | Prometheus |
| **Logging** | 发生了什么？错误详情？ | 离散事件 | Loki、ELK |
| **Tracing** | 一个请求走过了哪些服务？ | 调用链 | Jaeger、Tempo |

它们不是选择题——生产环境必须三者齐备。

## 第二章：Metrics 指标体系

### 2.1 Prometheus 核心架构

Prometheus 是 CNCF 毕业的时序数据库与监控系统，核心架构：

```
┌──────────────┐      pull      ┌─────────────┐
│  应用 Exporter│◀─────────────│  Prometheus │
└──────────────┘               └──────┬──────┘
                                        │ remote_write
                                        ▼
                                 ┌─────────────┐
                                 │   Thanos    │
                                 │ / Cortex    │
                                 └──────┬──────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │   Grafana   │
                                 └─────────────┘
```

### 2.2 指标类型

Prometheus 定义了四种指标类型：

#### (1) Counter（计数器）

单调递增的累计值，例如请求数、错误数。

```go
httpRequestsTotal.WithLabelValues("200", "GET").Inc()
```

#### (2) Gauge（仪表盘）

可增可减的瞬时值，例如在线用户数、内存使用率。

```go
memoryUsageBytes.Set(float64(memstats.Alloc))
```

#### (3) Histogram（直方图）

对观测值分桶统计，用于计算分位数（P95、P99）。

```go
requestDuration.WithLabelValues("api").Observe(elapsed)
```

#### (4) Summary（摘要）

在客户端计算分位数，精度高但不可聚合。

```go
# 与 Histogram 的差别：
# Histogram 在服务端聚合，Summary 在客户端预聚合
# Histogram 适合集群级聚合，Summary 适合单实例精确值
```

### 2.3 PromQL 实战

```promql
# QPS（每秒请求数）
rate(http_requests_total[5m])

# 错误率
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))

# P99 延迟
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)
```

### 2.4 K8s 上的 Prometheus 最佳实践

#### 方案一：Operator 方式（推荐）

```bash
# kube-prometheus-stack 是 CNCF 推荐的开源方案
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kube-prom prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace
```

它会一并部署：

- Prometheus Operator
- Alertmanager
- Grafana + 预置 dashboard
- kube-state-metrics
- node-exporter

#### 方案二：自部署模式（小集群）

```yaml
# prometheus.yaml 核心配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
```

**面试高频问题**：Prometheus 为什么用 Pull 而不是 Push？

> 答：
> 1. 集中控制：Prometheus 决定采集频率，目标应用无需关心
> 2. 健康检查：Pull 失败即表示目标不可达，天然支持告警
> 3. 跨网络/防火墙友好：避免每个应用暴露 Push 端口
> 4. 一致性：所有指标采集周期一致，便于计算 rate

### 2.5 大规模集群的扩展

单台 Prometheus 在 5000+ 节点集群中会面临存储与查询瓶颈。常用扩展方案：

- **Thanos**：全局视图 + 对象存储 + 跨集群查询
- **Cortex / Mimir**：水平扩展 + 多租户
- **Victoria Metrics**：更高压缩比，性能更强

## 第三章：Logging 日志体系

### 3.1 日志的两条路径

#### 路径一：传统 ELK/EFK 栈

```
Pod ──stdout──> Fluentd/Filebeat ──> Elasticsearch ──> Kibana
```

ELK 栈成熟但有两个痛点：索引开销大、运维复杂。

#### 路径二：Loki + Grafana（推荐云原生）

```
Pod ──stdout──> Promtail ──> Loki ──> Grafana
```

Loki 的设计哲学：**只索引元数据，不索引全文**。日志内容以压缩块存储，类似对象存储。这让 Loki 的存储成本远低于 ELK。

### 3.2 Loki 实战配置

#### Promtail 采集器

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: promtail-config
data:
  promtail.yaml: |
    server:
      http_listen_port: 9080
    positions:
      filename: /tmp/positions.yaml
    clients:
      - url: http://loki:3100/loki/api/v1/push
    scrape_configs:
    - job_name: kubernetes-pods
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        target_label: app
      - source_labels: [__meta_kubernetes_pod_phase]
        target_label: phase
```

#### 应用层日志规范

```go
// Go 应用：使用 logrus + zap 等结构化日志
log.Info("user login",
  zap.String("user_id", uid),
  zap.String("ip", ip),
  zap.Int64("duration_ms", cost.Milliseconds()),
)
// 输出 JSON 格式而非纯文本，便于 Loki 解析
```

#### LogQL 查询语言

```logql
# 查询 app=order-service 的错误日志
{app="order-service"} |= "ERROR"

# 正则匹配
{app="order-service"} |~ "timeout|connection refused"

# 按 JSON 字段过滤
sum(rate({app="order-service"} |= "ERROR" [5m]))
```

### 3.3 日志采集的几个关键决策

| 决策 | 推荐 |
|------|------|
| **stdout vs 文件** | K8s 推荐 stdout，配合 logrotate 由 Kubelet 处理 |
| **结构化 vs 非结构化** | 结构化（JSON），便于查询与聚合 |
| **采样 vs 全量** | 错误全量，正常采样（生产建议 10%） |
| **集中 vs 本地** | 集中存到 Loki，但保留本地最近 1 小时供应急 |

## 第四章：Tracing 链路追踪

### 4.1 OpenTelemetry 标准

CNCF 在 2021 年把 OpenTelemetry 设为推荐标准。它的目标是统一 Metrics/Logging/Tracing 三大支柱的采集 SDK。

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────┐
│   Application   │───▶│ OpenTelemetry SDK│───▶│   Collector  │
└─────────────────┘    └──────────────────┘    └──────┬───────┘
                                                    │
                                ┌───────────────────┼────────────────┐
                                ▼                   ▼                ▼
                           Tempo/Jaeger        Prometheus          Loki
                            (Traces)           (Metrics)          (Logs)
```

### 4.2 关键概念

- **Trace**：一次请求的完整调用链
- **Span**：调用链中的一个节点，包含开始时间、耗时、标签
- **Context Propagation**：跨服务传递追踪上下文（通过 W3C Trace Context 标准）

### 4.3 实战：Go 应用接入 OpenTelemetry

```go
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
    "go.opentelemetry.io/otel/sdk/trace"
)

// 初始化 tracer
func initTracer() {
    exporter, _ := otlptracegrpc.New(ctx,
        otlptracegrpc.WithEndpoint("otel-collector:4317"),
        otlptracegrpc.WithInsecure())
    
    tp := trace.NewTracerProvider(
        trace.WithBatcher(exporter),
        trace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName("order-service"),
        )),
    )
    otel.SetTracerProvider(tp)
}

// 在 HTTP handler 中埋点
func (h *Handler) CreateOrder(w http.ResponseWriter, r *http.Request) {
    tracer := otel.Tracer("order-service")
    ctx, span := tracer.Start(r.Context(), "CreateOrder")
    defer span.End()
    
    // ... 业务逻辑
}
```

### 4.4 服务间传播

HTTP 请求的 trace 传播示例：

```go
// 服务 A 注入 trace header
req, _ := http.NewRequestWithContext(ctx, "GET", "http://inventory:8080/stock", nil)
otel.GetTextMapPropagator().Inject(ctx, propagation.HeaderCarrier(req.Header))

// 服务 B 提取
ctx = otel.GetTextMapPropagator().Extract(ctx, propagation.HeaderCarrier(req.Header))
```

### 4.5 后端选择

| 方案 | 特点 |
|------|------|
| **Jaeger** | CNCF 毕业项目，UI 漂亮，存储依赖 ES/Cassandra |
| **Tempo** | Grafana 生态，存储使用对象存储（S3/GCS），成本低 |
| **Zipkin** | 轻量，Twitter 开源 |

**推荐组合**：Grafana + Prometheus + Loki + Tempo（统一面板，统一告警）。

## 第五章：三大支柱的统一

### 5.1 为什么必须统一

Metrics 告诉你"哪里有问题"，Logs 告诉你"问题细节"，Tracing 告诉你"问题在哪一段"。三者缺一不可，但更关键的是**关联**：

```
TraceID: abc123
  ├── Span (create-order, 50ms)
  ├── Span (call-inventory, 20ms)
  ├── Span (call-payment, 30ms)
  └── Logs:
       INFO  order created, orderId=888, traceId=abc123
       ERROR payment failed, code=insufficient, traceId=abc123
```

通过 TraceID 关联，可以在 Grafana 中一键跳转。

### 5.2 Grafana 统一视图

```yaml
# grafana-datasources.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-datasources
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
    - name: Prometheus
      type: prometheus
      url: http://prometheus:9090
    - name: Loki
      type: loki
      url: http://loki:3100
    - name: Tempo
      type: tempo
      url: http://tempo:3200
```

在 Loki 查询结果中点击 TraceID，可自动跳转到 Tempo 的对应链路。

## 第六章：生产最佳实践

### 6.1 告警分级

```yaml
# Prometheus Alertmanager 告警分级
groups:
- name: example
  rules:
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m]))
      /
      sum(rate(http_requests_total[5m])) > 0.05
    for: 5m
    labels:
      severity: critical      # 严重
    annotations:
      summary: "服务错误率超 5%"

  - alert: HighLatency
    expr: histogram_quantile(0.99, ...) > 1
    for: 10m
    labels:
      severity: warning        # 警告
```

### 6.2 容量规划

以 100 节点 K8s 集群为例：

| 组件 | 资源 | 存储 | 备注 |
|------|------|------|------|
| Prometheus | 8C16G × 2 | 500GB SSD | 主备双实例 |
| Loki | 4C8G × 3 | 1TB 对象存储 | 索引小，存储大 |
| Tempo | 4C8G × 2 | 500GB 对象存储 | |
| Grafana | 2C4G × 1 | 20GB | |

### 6.3 常见陷阱

1. **指标高基数爆炸**：label 中使用 userId、orderId 这种高基数字段，会让 Prometheus 内存爆炸
2. **日志全量发送**：高峰期日志写入阻塞应用 stdout，建议采样
3. **Trace 采样率**：全量采集存储成本爆炸，建议生产环境采样率 1%-10%

## 第七章：面试高频问题

### Q1：Metrics、Logging、Tracing 的区别与适用场景？

> Metrics：监控告警，趋势分析，聚合统计
> Logging：错误排查，事件回溯，结构化字段过滤
> Tracing：调用链分析，性能瓶颈定位，跨服务追踪

### Q2：OpenTelemetry 与 OpenTracing 的关系？

> OpenTracing 是 CNCF 早期的标准，已合并到 OpenTelemetry。OpenTelemetry 是统一 SDK，覆盖三大支柱。

### Q3：Loki 为什么比 ES 便宜？

> Loki 只索引 label（相当于 ES 的元数据），不索引全文。日志压缩存储。查询时通过 label 缩小范围后全量扫描。代价是查询灵活性不如 ES，但对运维场景足够。

### Q4：TraceID 如何贯穿日志与指标？

> 通过 Context Propagation。在日志中输出 traceId 字段，并在 Grafana 中配置跳转。

### Q5：SLO 怎么制定？

> 服务等级目标(SLO) = 可用性 / 延迟 / 错误率三选一或组合。
> 例如：99.9% 的请求在 200ms 内完成。配合错误预算(Error Budget)管理发布节奏。

## 结语：可观测性是云原生的"基础设施"

很多团队把可观测性当作锦上添花，实际上它是**云原生系统稳定性的核心保障**。建议在系统设计之初就考虑：

1. 应用结构化日志
2. 暴露 metrics 端点
3. 引入 OpenTelemetry SDK
4. 部署统一的 Grafana + Prometheus + Loki + Tempo 套件

下一篇，我们将进入 GitOps 专题：用 ArgoCD 实现声明式持续交付。

---

> 配套阅读：[Kubernetes 核心原理深度剖析](#)、[微服务架构与云原生实践](#)