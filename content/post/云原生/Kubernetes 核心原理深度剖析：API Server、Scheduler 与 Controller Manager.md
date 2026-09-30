---
title: Kubernetes 核心原理深度剖析：API Server、Scheduler 与 Controller Manager
description: 从源码级视角深入剖析 Kubernetes 三大核心组件——API Server、Scheduler、Controller Manager 的内部工作原理，揭示声明式 API 与控制器模式背后的设计哲学
slug: kubernetes核心原理深度剖析
date: 2026-09-30T11:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["云原生"]
---

# Kubernetes 核心原理深度剖析：API Server、Scheduler 与 Controller Manager

## 引言：为什么必须理解 K8s 原理

很多运维同学用 Kubernetes 已经非常熟练：写 YAML、调 kubectl、排查 Pod 异常。但一旦面试被问到：

- "Scheduler 的调度流程是怎样的？"
- "Controller Manager 是怎么保证副本数的？"
- "API Server 的请求处理链路是什么？"

就只能答到表面。**会用和懂原理，是面试区分初级与中高级的关键分水岭。**

本文将从设计哲学出发，逐层拆解这三个核心组件，让你既能在面试中讲清楚原理，又能在生产中通过原理定位问题。

## 第一章：Kubernetes 控制平面总览

### 1.1 整体架构

Kubernetes 控制平面由以下核心组件组成：

```
                ┌─────────────────────────────────────────┐
                │              API Server                 │
                │   (etcd 的唯一入口，RESTful 网关)        │
                └───────┬──────────┬──────────┬───────────┘
                        │          │          │
              ┌─────────▼─┐  ┌─────▼─────┐  ┌─▼──────────────┐
              │ Scheduler │  │  Controller│  │  kubelet       │
              │  (调度器)  │  │   Manager   │  │ (节点代理)     │
              └───────────┘  └───────────┘  └────────────────┘
                        │
                ┌───────▼─────────┐
                │      etcd       │
                │  (强一致存储)    │
                └─────────────────┘
```

### 1.2 核心设计哲学

在深入每个组件前，先记住三条贯穿始终的设计原则：

1. **声明式**：用户描述"想要什么"，系统负责达成
2. **控制器模式 + 调和循环(Reconcile Loop)**：持续观察状态并纠正偏差
3. **API Server 是唯一入口**：所有组件都通过 API Server 读写 etcd，绝不绕过

**面试黄金回答**："Kubernetes 本质上是一个分布式状态机，所有组件都是这个状态机的观察者或执行者。"

## 第二章：API Server 深度剖析

### 2.1 API Server 的核心职责

API Server 是 Kubernetes 的"门面"，具体职责包括：

- 提供 RESTful API（kubectl 实际就是 HTTP 客户端）
- 验证与鉴权（Authentication、Authorization、Admission）
- 持久化对象到 etcd
- 提供 Watch 机制，通知客户端变更

### 2.2 请求处理链路

一次 `kubectl apply` 的完整处理链路：

```
HTTP 请求
   │
   ▼
① 认证 (Authentication)
   │  证书 / Token / ServiceAccount
   ▼
② 鉴权 (Authorization)
   │  RBAC / ABAC / Node / Webhook
   ▼
③ 准入控制 (Admission Control)
   │  MutatingWebhook → ValidatingWebhook
   ▼
④ 对象验证 (Schema Validation)
   ▼
⑤ 写入 etcd
   ▼
⑦ 触发 Watch 事件
```

**面试高频追问**：Mutating 和 Validating Webhook 的执行顺序？

> 答：所有 Mutating Webhook 先串行执行（按配置顺序），再做对象 Schema 验证，最后并行执行 Validating Webhook。

### 2.3 几个关键的设计细节

#### (1) 为什么是 etcd 而不是 MySQL？

etcd 使用 Raft 一致性协议，能够在保证强一致的同时提供良好的读写吞吐。Kubernetes 不需要 MySQL 那种事务，因为大部分场景是"读 + 写整个对象"，而不是部分字段更新。

#### (2) Watch 机制如何工作？

API Server 会为每个客户端维护一个长连接。当 etcd 中数据变更时，API Server 通过内部的 watchCache 把事件推给客户端。这避免了客户端轮询。

#### (3) List-Watch 模式

所有控制器（包括 Scheduler、Controller Manager、kubelet）都是通过 List-Watch 模式工作的：

1. **List**：先全量拉取，建立本地缓存
2. **Watch**：订阅增量变更
3. **调和**：根据变更触发本地逻辑

## 第三章：Scheduler 调度器原理

### 3.1 Scheduler 的职责

Scheduler 负责为新创建的 Pod **选择最合适的节点**。它本身不直接创建 Pod，而是把调度决策写回 API Server（具体表现为给 Pod 的 `spec.nodeName` 字段赋值）。

### 3.2 调度流程

Scheduler 的内部工作流分为两个阶段：

#### 第一阶段：预选 (Predicates / Filters)

过滤掉不满足硬性条件的节点，例如：

- 节点资源是否够用（CPU、内存、磁盘）
- 节点是否被 NoSchedule 污点
- Pod 与节点的亲和性/反亲和性
- PVC 是否能在节点上挂载
- 节点是否处于 NotReady 状态

#### 第二阶段：优选 (Priorities / Scoring)

对通过预选的节点打分，选出最高分：

- 资源利用率均衡（LeastAllocated）
- Pod 间亲和性分散度
- 镜像本地缓存
- Taint 容忍度

**面试加分点**：从 K8s 1.22 起，调度框架(Scheduling Framework)成为默认实现，它把调度过程拆分为多个扩展点（PreFilter、Filter、Score、Reserve、Permit、PreBind、PostBind 等），方便自定义调度插件。

### 3.3 调度框架的关键扩展点

```go
// 简化版 Scheduler 扩展点
type Handle interface {
    // 预选：过滤不可调度的节点
    FilterNodes(ctx, pod) []*v1.Node
    // 优选：为节点打分
    Score(ctx, pod, nodes) PluginResult
    // 预留资源（防止并发调度冲突）
    Reserve(ctx, pod, node) Status
    // 准许（用于批调度）
    Permit(ctx, pod, node) Status
    // 绑定前回调
    PreBind(ctx, pod, node) Status
    // 绑定
    Bind(ctx, pod, node) Status
}
```

### 3.4 调度器的高可用

生产环境的 Scheduler 通常部署 3 个副本，通过 **Leader Election** 选举出一个 active 实例。只有 active 实例才会真正执行调度，其他实例处于待命状态。

```yaml
# kube-scheduler 的 leader election 配置
apiVersion: kubeprovider.config.k8s.io/v1
kind: KubeSchedulerConfiguration
profiles:
- schedulerName: default-scheduler
leaderElection:
  leaderElect: true
  resourceLock: endpointsleases  # K8s 1.22+ 改用 lease
```

## 第四章：Controller Manager 控制器原理

### 4.1 Controller Manager 是什么

Controller Manager 是**一组控制器的集合**，每个控制器都是一个独立的调和循环。常见的控制器包括：

- **Deployment Controller**：管理 ReplicaSet
- **ReplicaSet Controller**：维持 Pod 副本数
- **StatefulSet Controller**：管理有状态应用
- **DaemonSet Controller**：每个节点运行一个 Pod
- **Node Controller**：监听节点心跳
- **Job Controller**：管理批处理任务
- **Endpoint Controller**：维护 Service Endpoints
- **ServiceAccount Controller**：默认 SA 与 Token 创建

### 4.2 控制器模式的核心逻辑

每个控制器都遵循同一个模式：

```python
while True:
    actual = read_from_api_server()       # 读取实际状态
    desired = compute_desired(actual)     # 计算期望状态
    if actual != desired:
        reconcile(actual, desired)        # 调和
    sleep(interval)                       # 或基于 watch 触发
```

伪代码虽简单，但生产实现要复杂得多：要处理并发、错误重试、幂等性、事件去重。

### 4.3 以 Deployment 为例剖析控制器工作流

当你执行 `kubectl apply -f deployment.yaml`，背后发生的事情：

```
用户创建 Deployment
        │
        ▼
Deployment Controller 检测到 Deployment 变化
        │
        ▼
根据 Deployment 模板创建/更新 ReplicaSet
        │
        ▼
ReplicaSet Controller 检测到 ReplicaSet 变化
        │
        ▼
比较实际 Pod 数与期望副本数
        │
        ▼
差异时创建/删除 Pod
        │
        ▼
Pod 调度到节点，kubelet 启动容器
```

**核心思想**：每一层只关心自己的"邻居"——Deployment 只关心 ReplicaSet，ReplicaSet 只关心 Pod。这种层层调和是 K8s 健壮性的来源。

### 4.4 Informer 机制：控制器为什么能扛住大规模集群

如果每个控制器都直接 List-Watch API Server，会对 API Server 造成巨大压力。Kubernetes 的解决方案是 **Informer 机制**：

```
API Server ──watch──> Reflector ──> DeltaFIFO ──> Indexer (本地缓存)
                              │
                              └──> EventHandlers ──> 控制器业务逻辑
```

关键设计：

- **Reflector**：单线程 List-Watch，维护增量队列
- **DeltaFIFO**：去重，保证事件有序
- **Indexer**：本地线程安全的缓存，避免每次都访问 API Server
- **SharedInformer**：多个控制器共享同一份缓存，大幅降低 API Server 压力

**面试高赞答案**："Informer 把对 API Server 的高频访问收敛为本地缓存读，并通过事件机制保证最终一致性，是 K8s 能支撑 5000+ 节点集群的关键之一。"

## 第五章：一次 Pod 创建的完整旅程

为了把三个组件串起来，我们跟踪一个 Pod 的完整创建过程：

```
1. kubectl apply -f pod.yaml
   │
   ▼
2. API Server 鉴权 + 准入控制，写入 etcd（Pod.Spec.NodeName 为空）
4. ①Scheduler Watch 到新 Pod，开始调度
   │   预选 → 优选 → Reserve → Permit
   ▼
3. API Server 更新 Pod.Spec.NodeName
   │
   ▼
4. ②kubelet Watch 到 Pod.Spec.NodeName 已分配
   │   ① 调用 CRI（containerd）启动容器
   │   ② 调用 CNI（Calico/Cilium）配置网络
   │   ③ 调用 CSI 挂载存储
   ▼
5. kubelet 周期性上报 Pod 状态到 API Server
   │
   ▼
6. ③Controller Manager 持续调和，修正偏差
```

## 第六章：面试高频问题精讲

### Q1：API Server 是无状态的吗？为什么可以做水平扩展？

> 答：是的，API Server 本身是无状态的，所有状态都在 etcd 中。所以可以水平扩展，前面挂负载均衡即可。

### Q2：Scheduler 调度失败，Pod 一直 Pending，怎么排查？

> 排查思路：
> 1. `kubectl describe pod` 查看 Events，找出失败原因
> 2. 常见原因：资源不足、节点污点未容忍、亲和性冲突、PV 不可用
> 3. `kubectl get events --sort-by=.metadata.creationTimestamp` 全局事件
> 4. 进阶：`kubectl get <pod> -o yaml` 检查最终状态

### Q3：Controller Manager 的调和循环间隔是多少？

> 默认是 5 秒一次 Resync。但更现代的设计是基于 Watch 事件触发，避免轮询。

### Q4：如何自定义控制器？

> 使用 controller-runtime（Kubebuilder 底层框架）：
> 1. 定义 CRD（CustomResourceDefinition）
> 2. 实现 Reconcile() 方法
> 3. 启动 Manager，注册控制器

### Q5：K8s 1.20+ 移除了 Docker Shim，对架构有什么影响？

> Docker 作为容器运行时通过 dockershim 实现，现在直接对接 containerd。架构更清晰，性能更好，但运维习惯需要调整。

## 结语：原理是面试的硬通货

云原生岗位面试中，对 K8s 原理的考察权重极高。建议你围绕以下三条主线复习：

1. **API Server**：请求处理流程、鉴权、准入控制
2. **Scheduler**：调度框架、扩展点、高可用
3. **Controller Manager**：控制器模式、Informer、Reconcile 循环

下一篇，我们将进入可观测性专题：Metrics、Logging、Tracing 三大支柱如何构建生产级的可观测体系。

---

> 推荐阅读：[Kubernetes 核心概念与实战指南](https://example.com) 作为基础铺垫。