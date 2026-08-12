---
title: "Kubernetes组件详解：控制平面 vs 计算节点"
description: "通俗讲解K8S的组件架构，控制节点和计算节点的分工，对比OpenStack帮助理解"
date: 2026-04-20T10:00:00+08:00
categories: ["技术分享"]
tags:
  - Kubernetes
  - K8S
  - 容器编排
  - 控制平面
  - 计算节点
comments: true
---

## 前言

之前我们讲了OpenStack分为控制节点和计算节点。那么Kubernetes（K8S）是不是也这样分的呢？

**答案是：是的！K8S也有控制平面和计算节点的区分，但叫法和架构有所不同。**

这篇文章帮你彻底搞懂K8S的组件架构。

---

## 一、K8S vs OpenStack：架构对比

### 1.1 整体架构对比

```
┌─────────────────────────────────────────────────────────────────┐
│              OpenStack vs Kubernetes 架构对比                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      OpenStack                          │   │
│   │                                                         │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │              控制节点（Controller）              │   │   │
│   │   │  Keystone / Nova-API / Neutron / Glance        │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                         │                               │   │
│   │                         ▼                               │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│   │   │计算节点1 │ │计算节点2 │ │计算节点3 │ │计算节点4 │    │   │
│   │   │KVM+VM   │ │KVM+VM   │ │KVM+VM   │ │KVM+VM   │    │   │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│   │                                                         │   │
│   │   管理的是：虚拟机（VM）                                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      Kubernetes                         │   │
│   │                                                         │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │              控制平面（Control Plane）            │   │   │
│   │   │  API Server / Scheduler / etcd / Controller      │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                         │                               │   │
│   │                         ▼                               │   │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│   │   │  Node1  │ │  Node2  │ │  Node3  │ │  Node4  │    │   │
│   │   │Docker   │ │Docker   │ │Docker   │ │Docker   │    │   │
│   │   │ Pod/Pod │ │ Pod/Pod │ │ Pod/Pod │ │ Pod/Pod │    │   │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│   │                                                         │   │
│   │   管理的是：容器（Container）                             │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 关键区别

| 对比项           | OpenStack       | Kubernetes        |
| ---------------- | --------------- | ----------------- |
| **管理对象**     | 虚拟机（VM）    | 容器（Container） |
| **控制节点名称** | Controller Node | Control Plane     |
| **计算节点名称** | Compute Node    | Node / Worker     |
| **虚拟化**       | KVM/Xen/VMware  | Docker/Containerd |
| **资源单元**     | 虚拟机          | Pod（容器组）     |
| **网络**         | Neutron         | CNI插件           |
| **存储**         | Cinder/Glance   | CSI插件           |
| **复杂度**       | 较高            | 相对简单          |

### 1.3 类比理解

```
┌─────────────────────────────────────────────────────────────────┐
│                        用餐厅比喻理解                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   OpenStack = 经营一家实体餐厅                                    │
│   ├── 招聘厨师（创建虚拟机）                                      │
│   ├── 每个厨师独立工作（独立操作系统）                             │
│   ├── 厨师之间用盘子传菜（网络通信）                               │
│   └── 资源需求大（每台VM占用资源多）                              │
│                                                                 │
│   Kubernetes = 经营一家快餐店                                      │
│   ├── 流水线作业（容器化）                                         │
│   ├── 一个厨师同时做多份汉堡（资源共享）                           │
│   ├── 效率高、成本低                                              │
│   └── 快速扩张/收缩（弹性伸缩）                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、K8S控制平面（Control Plane）

### 2.1 控制平面是什么？

**控制平面就是K8S的"大脑"，负责：**

- 管理整个集群
- 调度应用
- 监控状态
- 处理故障

```
┌─────────────────────────────────────────────────────────────────┐
│                      控制平面（Control Plane）                    │
│                     （K8S集群的大脑）                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │     ┌─────────────────────────────────────────────┐   │   │
│   │     │          kube-apiserver（API服务器）         │   │   │
│   │     │           K8S的入口，所有请求都经过它          │   │   │
│   │     └─────────────────────────────────────────────┘   │   │
│   │                         │                             │   │
│   │                         ▼                             │   │
│   │     ┌─────────────────────────────────────────────┐   │   │
│   │     │          etcd（分布式数据库）                 │   │   │
│   │     │           保存集群所有数据                    │   │   │
│   │     └─────────────────────────────────────────────┘   │   │
│   │                         │                             │   │
│   │                         ▼                             │   │
│   │     ┌─────────────────────────────────────────────┐   │   │
│   │     │        kube-scheduler（调度器）               │   │   │
│   │     │         决定Pod放在哪个节点                   │   │   │
│   │     └─────────────────────────────────────────────┘   │   │
│   │                         │                             │   │
│   │                         ▼                             │   │
│   │     ┌─────────────────────────────────────────────┐   │   │
│   │     │     kube-controller-manager（控制器管理器）   │   │   │
│   │     │          管理各种控制器                       │   │   │
│   │     └─────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 控制平面四大组件

#### ① kube-apiserver（API服务器）⭐ 必须

**功能：**

- K8S的入口，所有请求都经过它
- 处理 kubectl 命令
- 各个组件之间的通信枢纽

**类比：** 前台接待员 / 门卫

```
用户 ──→ kubectl ──→ kube-apiserver ──→ etcd
                                    │
                                    ├──→ kube-scheduler
                                    ├──→ kube-controller-manager
                                    └──→ kubelet (通过watch)
```

**特点：**

- 支持水平扩展（多实例）
- 提供REST API
- 支持认证授权

---

#### ② etcd（分布式数据库）⭐ 必须

**功能：**

- 保存集群所有数据
- 存储Pod信息、Service信息、ConfigMap等
- 分布式一致性存储

**类比：** 餐厅的订单系统 / 仓库管理系统

**重要配置：**

```bash
# etcd 数据存储位置
--data-dir=/var/lib/etcd

# etcd 集群配置
--initial-cluster="node1=https://192.168.1.1:2380,node2=https://192.168.1.2:2380"

# etcd 备份重要！
etcdctl snapshot save snapshot.db
```

**生产环境建议：**

- 至少3节点集群
- 使用SSD存储
- 定期备份

---

#### ③ kube-scheduler（调度器）⭐ 必须

**功能：**

- 决定新Pod应该放在哪个Node
- 考虑资源需求、亲和性、拓扑等

**类比：** 餐厅的派单员

```
新Pod创建请求
      │
      ▼
scheduler决策
      │
      ├── 资源是否足够？CPU/内存
      ├── 节点亲和性？
      ├── 污点容忍？
      ├── 数据本地性？
      └── 选择最优节点
            │
            ▼
      绑定到选定节点
```

**调度策略：**

```yaml
# 资源请求
resources:
  requests:
    memory: "64Mi"
    cpu: "250m"
  limits:
    memory: "128Mi"
    cpu: "500m"

# 节点亲和性
nodeSelector:
  disktype: ssd

# 亲和性规则
affinity:
  nodeAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      nodeSelectorTerms:
        - matchExpressions:
            - key: "node-role"
              operator: In
              values: ["worker"]

# 污点容忍
tolerations:
  - key: "node-role"
    operator: "Equal"
    value: "compute"
    effect: "NoSchedule"
```

---

#### ④ kube-controller-manager（控制器管理器）⭐ 必须

**功能：**

- 运行各种控制器
- 维护集群期望状态

**控制器列表：**

| 控制器                          | 功能                    |
| ------------------------------- | ----------------------- |
| **Node Controller**             | 监控节点状态，故障检测  |
| **Replication Controller**      | 管理Pod副本数           |
| **Deployment Controller**       | 管理Deployment          |
| **StatefulSet Controller**      | 管理有状态应用          |
| **DaemonSet Controller**        | 确保每个节点运行一个Pod |
| **Job Controller**              | 管理Job任务             |
| **CronJob Controller**          | 管理定时任务            |
| **Service Controller**          | 管理Service             |
| **Endpoint Controller**         | 管理Endpoints           |
| **Namespace Controller**        | 管理Namespace           |
| **PersistentVolume Controller** | 管理PV                  |

```
kube-controller-manager
     │
     ├── Node Controller（节点控制器）
     │       └── 监控节点健康状态
     │
     ├── Replication Controller（副本控制器）
     │       └── 确保Pod副本数正确
     │
     ├── Deployment Controller（部署控制器）
     │       └── 管理应用部署和更新
     │
     ├── Endpoint Controller（端点控制器）
     │       └── 更新Service对应的Pod地址
     │
     └── ... 其他控制器
```

---

### 2.3 控制平面组件总结

```
┌─────────────────────────────────────────────────────────────────┐
│                    控制平面组件速查表                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────┬────────────────────────────────────┐   │
│   │     组件         │              功能                    │   │
│   ├──────────────────┼────────────────────────────────────┤   │
│   │ kube-apiserver  │ K8S入口，接收处理所有请求            │   │
│   │ etcd            │ 存储集群数据                         │   │
│   │ kube-scheduler  │ 调度Pod到合适节点                   │   │
│   │ kube-controller │ 运行各种控制器，维护期望状态          │   │
│   └──────────────────┴────────────────────────────────────┘   │
│                                                                 │
│   最小化控制平面：API Server + etcd + Scheduler + Controller    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、K8S计算节点（Node）

### 3.1 Node是什么？

**Node就是K8S的工作节点，负责：**

- 运行Pod（容器）
- 汇报节点状态
- 提供计算资源

```
┌─────────────────────────────────────────────────────────────────┐
│                        计算节点（Node）                          │
│                      （K8S集群的肌肉）                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      Node（工作节点）                    │   │
│   │                                                         │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │              kubelet（节点代理）                  │   │   │
│   │   │           与API Server通信                        │   │   │
│   │   │           管理Pod生命周期                          │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                         │                             │   │
│   │                         ▼                             │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │           kube-proxy（网络代理）                 │   │   │
│   │   │            实现Service网络                        │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                         │                             │   │
│   │                         ▼                             │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │          Container Runtime（容器运行时）         │   │   │
│   │   │              Docker / containerd                  │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                         │                             │   │
│   │                         ▼                             │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │                    Pod                          │   │   │
│   │   │    ┌────────┐    ┌────────┐                   │   │   │
│   │   │    │Container│    │Container│                   │   │   │
│   │   │    │   NGINX  │    │   APP   │                   │   │   │
│   │   │    └────────┘    └────────┘                   │   │   │
│   │   │         Pod = 容器组，最小调度单位              │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Node三大组件

#### ① kubelet（节点代理）⭐ 必须

**功能：**

- 与API Server通信
- 管理本节点Pod
- 监控容器状态
- 汇报节点信息

**类比：** 餐厅的厨师

```
API Server ──→ 分配Pod ──→ kubelet
                              │
                              ├──→ 创建Pod
                              ├──→ 启动容器
                              ├──→ 监控健康
                              └──→ 汇报状态
```

**工作流程：**

```bash
# 1. kubelet watch API Server，等待分配Pod
# 2. 收到Pod规格（PodSpec）
# 3. 调用容器运行时创建容器
# 4. 配置网络（通过CNI）
# 5. 设置存储（通过CSI）
# 6. 持续监控健康状态
# 7. 汇报给API Server
```

---

#### ② kube-proxy（网络代理）⭐ 必须

**功能：**

- 实现Service的网络
- 负载均衡
- 服务发现

**类比：** 餐厅的传菜员

```
Service VIP (10.96.0.1)
      │
      ▼
kube-proxy 负载均衡
      │
      ├──→ Pod1 (192.168.1.2:8080)
      ├──→ Pod2 (192.168.1.3:8080)
      └──→ Pod3 (192.168.1.4:8080)
```

**网络模式：**

| 模式          | 说明               |
| ------------- | ------------------ |
| **iptables**  | 规则转发（默认）   |
| **ipvs**      | IPVS转发（高性能） |
| **userspace** | 用户空间代理（旧） |

**配置：**

```yaml
# 查看kube-proxy模式
kubectl get configmap -n kube-system kube-proxy -o yaml

# 切换到ipvs模式
kubectl edit configmap kube-proxy -n kube-system
# 设置 mode: "ipvs"
```

---

#### ③ Container Runtime（容器运行时）⭐ 必须

**功能：**

- 拉取镜像
- 创建容器
- 运行容器

**K8S支持的容器运行时：**

| 运行时         | 说明                             |
| -------------- | -------------------------------- |
| **containerd** | ⭐ Docker官方推荐，K8S 1.24+默认 |
| **Docker**     | 早期使用，现在通常用containerd   |
| **cri-o**      | OCI标准实现，RedHat系            |
| **CRI-O**      | 轻量级                           |

**架构演变：**

```
早期架构：
Kubelet → dockershim → Docker → containerd → runc

现在架构：
Kubelet → CRI → containerd → runc

containerd-shim → 直接管理容器（无Docker守护进程）
```

**containerd配置：**

```bash
# 查看containerd版本
containerd --version

# containerd配置文件
/etc/containerd/config.toml

# 重启containerd
systemctl restart containerd
```

---

### 3.3 Pod：K8S的最小调度单位

```
┌─────────────────────────────────────────────────────────────────┐
│                        Pod 结构图                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                         Pod                             │   │
│   │                                                         │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │           共享网络（同一IP）                      │   │   │
│   │   │                                                 │   │   │
│   │   │   ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │   │
│   │   │   │Container1│  │Container2│  │Container3│    │   │   │
│   │   │   │   nginx   │  │   app    │  │  redis   │    │   │   │
│   │   │   │    :80    │  │   :8080  │  │   :6379  │    │   │   │
│   │   │   └──────────┘  └──────────┘  └──────────┘    │   │   │
│   │   │                                                 │   │   │
│   │   │   共享存储（同一个Volume）                       │   │   │
│   │   │   共享localhost（可以互相访问）                   │   │   │
│   │   │                                                 │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   IP: 10.244.1.15                                              │
│   Host: node1                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、控制平面 vs 计算节点对比

### 4.1 核心对比

```
┌─────────────────────────────────────────────────────────────────┐
│                 控制平面 vs 计算节点                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      控制平面                            │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   角色：管理者/大脑                                      │   │
│   │                                                         │   │
│   │   组件：                                                │   │
│   │   ├── kube-apiserver    ← API入口                      │   │
│   │   ├── etcd              ← 数据存储                      │   │
│   │   ├── kube-scheduler   ← 调度器                        │   │
│   │   └── kube-controller  ← 控制器                        │   │
│   │                                                         │   │
│   │   数量：1-3节点（小规模可用1节点）                       │   │
│   │   资源：较低（4核8GB足够）                               │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                            ⬆️                                   │
│                       调度/管理                                  │
│                            ⬇️                                   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      计算节点                            │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   角色：执行者/肌肉                                      │   │
│   │                                                         │   │
│   │   组件：                                                │   │
│   │   ├── kubelet           ← 节点代理                      │   │
│   │   ├── kube-proxy       ← 网络代理                      │   │
│   │   ├── containerd       ← 容器运行时                      │   │
│   │   └── Pod              ← 运行容器                       │   │
│   │                                                         │   │
│   │   数量：可扩展（1-N个）                                 │   │
│   │   资源：较高（看工作负载）                               │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 详细对比表

| 对比项         | 控制平面                                | 计算节点                        |
| -------------- | --------------------------------------- | ------------------------------- |
| **别称**       | Master                                  | Worker / Node                   |
| **数量**       | 1-7节点                                 | 1-N节点                         |
| **核心组件**   | API Server, etcd, Scheduler, Controller | kubelet, kube-proxy, containerd |
| **运行Pod**    | ❌ 不运行                               | ✅ 运行                         |
| **处理请求**   | ✅ 处理所有                             | ❌ 不处理                       |
| **资源需求**   | 较低                                    | 高                              |
| **可靠性要求** | 高                                      | 中等                            |
| **可扩展性**   | 有限                                    | 灵活                            |

---

## 五、完整架构图

### 5.1 K8S集群完整架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        K8S 完整架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                     控制平面 (Control Plane)               │  │
│   │                                                          │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│   │  │ kube-apiserver│ │    etcd    │  │  scheduler  │     │  │
│   │  │   :6443      │  │   :2379    │  │             │     │  │
│   │  └──────┬──────┘  └──────┬──────┘  └──────┬─────┘     │  │
│   │         │                 │                 │            │  │
│   │         └─────────────────┼─────────────────┘            │  │
│   │                           │                              │  │
│   │                           ▼                              │  │
│   │                 ┌─────────────────┐                    │  │
│   │                 │ kube-controller │                    │  │
│   │                 │    -manager     │                    │  │
│   │                 └─────────────────┘                    │  │
│   │                                                          │  │
│   └──────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
│          ┌───────────────────┼───────────────────┐              │
│          │                   │                   │              │
│          ▼                   ▼                   ▼              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │    Node1    │     │    Node2    │     │    Node3    │   │
│   │  (计算节点)  │     │  (计算节点)  │     │  (计算节点)  │   │
│   │             │     │             │     │             │   │
│   │  ┌───────┐  │     │  ┌───────┐  │     │  ┌───────┐  │   │
│   │  │ kubelet│  │     │  │ kubelet│  │     │  │ kubelet│  │   │
│   │  └───────┘  │     │  └───────┘  │     │  └───────┘  │   │
│   │  ┌───────┐  │     │  ┌───────┐  │     │  ┌───────┐  │   │
│   │  │proxy  │  │     │  │proxy  │  │     │  │proxy  │  │   │
│   │  └───────┘  │     │  └───────┘  │     │  └───────┘  │   │
│   │  ┌───────┐  │     │  ┌───────┐  │     │  ┌───────┐  │   │
│   │  │containerd│ │     │  │containerd│ │     │  │containerd│ │   │
│   │  └───────┘  │     │  └───────┘  │     │  └───────┘  │   │
│   │             │     │             │     │             │   │
│   │  ┌───────┐  │     │  ┌───────┐  │     │  ┌───────┐  │   │
│   │  │  Pod  │  │     │  │  Pod  │  │     │  │  Pod  │  │   │
│   │  │nginx  │  │     │  │  app  │  │     │  │ mysql │  │   │
│   │  └───────┘  │     │  └───────┘  │     │  └───────┘  │   │
│   │             │     │             │     │             │   │
│   └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 K8S vs OpenStack 组件对应关系

```
┌─────────────────────────────────────────────────────────────────┐
│              K8S vs OpenStack 组件对应关系                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                        控制平面                          │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   K8S                        OpenStack                 │   │
│   │   ───                        ────────                  │   │
│   │   kube-apiserver      ←→     Nova-API                  │   │
│   │   etcd               ←→     MySQL                      │   │
│   │   kube-scheduler     ←→     Nova-Scheduler             │   │
│   │   kube-controller    ←→     Nova-Conductor             │   │
│   │   (无对应)           ←→     Keystone (认证)            │   │
│   │   (无对应)           ←→     Neutron (网络)             │   │
│   │   (无对应)           ←→     Glance (镜像)              │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                        计算节点                          │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   K8S                        OpenStack                 │   │
│   │   ───                        ────────                  │   │
│   │   kubelet              ←→     nova-compute             │   │
│   │   kube-proxy           ←→     neutron-agent            │   │
│   │   containerd           ←→     libvirt (KVM)           │   │
│   │   Pod                 ←→     VM                       │   │
│   │   Container            ←→     (VM内应用)               │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、K8S安装教程

### 6.1 安装方式对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    K8S 安装方式对比                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   方式一：kubeadm ⭐⭐⭐⭐⭐（推荐）                              │
│   ├── 官方推荐的安装工具                                         │
│   ├── 适合生产环境                                              │
│   └── 可以自定义配置                                            │
│                                                                 │
│   方式二：k3s ⭐⭐⭐⭐                                         │
│   ├── 轻量级K8S                                                │
│   ├── 适合边缘计算、个人学习                                     │
│   └── 资源占用小                                               │
│                                                                 │
│   方式三：Minikube ⭐⭐⭐⭐                                     │
│   ├── 单节点K8S                                                │
│   ├── 适合本地开发测试                                          │
│   └── 不能用于生产                                              │
│                                                                 │
│   方式四：Rancher ⭐⭐⭐⭐                                     │
│   ├── Web界面管理                                               │
│   ├── 多集群管理                                               │
│   └── 企业版功能丰富                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 kubeadm 安装（生产推荐）

#### 环境准备

```bash
# 系统要求
# - Ubuntu 16.04+ / CentOS 7+ / Debian 9+
# - 2核CPU / 2GB内存 / 20GB磁盘
# - 网络互通

# 关闭防火墙
systemctl stop firewalld
systemctl disable firewalld

# 关闭SELinux
setenforce 0
sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config

# 关闭Swap
swapoff -a
sed -i '/ swap / s/^\(.*\)$/#\1/' /etc/fstab

# 配置内核参数
cat > /etc/sysctl.d/k8s.conf << 'EOF'
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF
sysctl --system
```

#### 安装Docker/containerd

```bash
# 安装containerd（K8S 1.24+推荐）
# 或者安装Docker
apt update && apt install -y docker.io

# 配置containerd（如果使用Docker则跳过）
cat > /etc/modules-load.d/containerd.conf << 'EOF'
overlay
br_netfilter
EOF

modprobe overlay
modprobe br_netfilter

cat > /etc/sysctl.d/99-kubernetes-cri.conf << 'EOF'
net.bridge.bridge-nf-call-iptables  = 1
net.ipv4.ip_forward                 = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF

sysctl --system

# 生成containerd配置
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml

# 修改配置文件
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
sed -i 's/sandbox_image = "k8s.gcr.io\/pause:3.6"/sandbox_image = "registry.aliyuncs.com\/google_containers\/pause:3.9"/g' /etc/containerd/config.toml

# 重启containerd
systemctl enable containerd
systemctl restart containerd
```

#### 安装K8S组件

```bash
# 添加阿里云镜像源
curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add -
echo "deb https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list

# 安装K8S组件
apt update
apt install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

# 检查版本
kubelet --version
# kubectl version
# kubeadm version
```

#### 初始化控制平面

```bash
# 在控制节点执行
kubeadm init \
  --apiserver-advertise-address=192.168.1.100 \
  --image-repository registry.aliyuncs.com/google_containers \
  --kubernetes-version v1.28.0 \
  --service-cidr=10.96.0.0/12 \
  --pod-network-cidr=10.244.0.0/16

# 记录输出的join命令
# 例如：
# kubeadm join 192.168.1.100:6443 --token xxx --discovery-token-ca-cert-hash sha256:xxx
```

#### 配置kubectl

```bash
# 普通用户配置
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 或者root用户
export KUBECONFIG=/etc/kubernetes/admin.conf
echo "export KUBECONFIG=/etc/kubernetes/admin.conf" >> ~/.bashrc
```

#### 安装网络插件（CNI）

```bash
# 安装Calico（推荐）
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

# 或者安装Flannel
kubectl apply -f https://raw.githubusercontent.com/flannel-io/flannel/master/Documentation/kube-flannel.yml

# 查看Pod状态
kubectl get pods -n kube-system

# 等待Ready
kubectl get nodes
```

#### 添加计算节点

```bash
# 在计算节点上执行（使用上面记录的join命令）
kubeadm join 192.168.1.100:6443 \
  --token xxx \
  --discovery-token-ca-cert-hash sha256:xxx

# 在控制节点验证
kubectl get nodes
```

---

### 6.3 一键安装脚本

```bash
#!/bin/bash
# K8S一键安装脚本（控制平面）
# 适用于Ubuntu 22.04

set -e

echo "========== 开始安装K8S控制平面 =========="

# 1. 环境准备
echo "[1/6] 环境准备..."
swapoff -a
sed -i '/ swap / s/^\(.*\)$/#\1/' /etc/fstab

cat > /etc/sysctl.d/k8s.conf << 'EOF'
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF
sysctl --system

# 2. 安装Docker
echo "[2/6] 安装Docker..."
apt update && apt install -y docker.io
systemctl enable docker && systemctl start docker

# 3. 安装K8S组件
echo "[3/6] 安装K8S组件..."
curl https://mirrors.aliyun.com/kubernetes/apt/doc/apt-key.gpg | apt-key add -
echo "deb https://mirrors.aliyun.com/kubernetes/apt kubernetes-xenial main" > /etc/apt/sources.list.d/kubernetes.list
apt update
apt install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl

# 4. 初始化集群
echo "[4/6] 初始化集群..."
KUBE_IP="192.168.1.100"
read -p "请输入控制平面IP [$KUBE_IP]: " INPUT_IP
KUBE_IP=${INPUT_IP:-$KUBE_IP}
kubeadm init --apiserver-advertise-address=$KUBE_IP \
  --image-repository registry.aliyuncs.com/google_containers \
  --kubernetes-version v1.28.0

# 5. 配置kubectl
echo "[5/6] 配置kubectl..."
mkdir -p $HOME/.kube
cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
chown $(id -u):$(id -g) $HOME/.kube/config

# 6. 安装网络插件
echo "[6/6] 安装Calico网络插件..."
kubectl apply -f https://docs.projectcalico.org/manifests/calico.yaml

echo ""
echo "========== 安装完成 =========="
echo ""
echo "下一步："
echo "1. 添加计算节点："
echo "   kubeadm join $KUBE_IP:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>"
echo ""
echo "2. 检查集群状态："
echo "   kubectl get nodes"
echo "   kubectl get pods -n kube-system"
echo ""
echo "3. 生成新的join命令（如果需要）："
echo "   kubeadm token create --print-join-command"
```

---

### 6.4 k3s安装（最简单）

```bash
# k3s是轻量级K8S，安装超简单

# 控制平面安装
curl -sfL https://get.k3s.io | sh -

# 获取join命令
cat /var/lib/rancher/k3s/server/node-token

# 计算节点安装
curl -sfL https://get.k3s.io | K3S_URL=https://myserver:6443 K3S_TOKEN=mynodetoken sh -

# 查看节点
kubectl get nodes
```

---

## 七、常用命令

### 7.1 集群管理

```bash
# 查看节点
kubectl get nodes

# 查看Pod
kubectl get pods -A

# 查看集群信息
kubectl cluster-info

# 查看节点详情
kubectl describe node node-name

# 节点标记
kubectl label node node-name node-role.kubernetes.io/worker=worker

# 节点排水（维护前）
kubectl drain node-name --ignore-daemonsets --delete-emptydir-data

# 节点恢复
kubectl uncordon node-name
```

### 7.2 Pod管理

```bash
# 创建Pod
kubectl apply -f pod.yaml

# 查看Pod日志
kubectl logs pod-name

# 进入Pod
kubectl exec -it pod-name -- /bin/bash

# 查看Pod详情
kubectl describe pod pod-name

# 删除Pod
kubectl delete pod pod-name

# 扩缩容
kubectl scale deployment my-app --replicas=3
```

### 7.3 排查问题

```bash
# 查看所有Pod
kubectl get pods -A

# 查看Pod事件
kubectl get events

# 查看资源状态
kubectl top nodes
kubectl top pods -A

# 查看kubelet日志
journalctl -u kubelet -f

# 查看kube-proxy日志
kubectl logs -n kube-system -l k8s-app=kube-proxy -f
```

---

## 八、OpenStack vs K8S：终极对比

### 8.1 定位对比

```
┌─────────────────────────────────────────────────────────────────┐
│                 OpenStack vs Kubernetes 终极对比                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      OpenStack                          │   │
│   │                                                         │   │
│   │   定位：IaaS（基础设施即服务）                           │   │
│   │   管理：虚拟机                                           │   │
│   │   特点：重、复杂、功能全                                  │   │
│   │   适合：企业私有云                                       │   │
│   │                                                         │   │
│   │   组件：                                                │   │
│   │   控制节点：Keystone, Nova, Neutron, Glance...         │   │
│   │   计算节点：nova-compute, neutron-agent                 │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      Kubernetes                         │   │
│   │                                                         │   │
│   │   定位：CaaS（容器即服务）/ PaaS                        │   │
│   │   管理：容器                                            │   │
│   │   特点：轻、简单、弹性好                                 │   │
│   │   适合：云原生应用、微服务                               │   │
│   │                                                         │   │
│   │   组件：                                                │   │
│   │   控制平面：API Server, etcd, Scheduler, Controller     │   │
│   │   计算节点：kubelet, kube-proxy, containerd             │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 核心概念对应

| OpenStack      | Kubernetes       | 说明         |
| -------------- | ---------------- | ------------ |
| VM             | Pod              | 最小调度单位 |
| Flavor         | Resource/Limit   | 资源配置     |
| Image          | Container Image  | 镜像         |
| Snapshot       | Docker commit    | 快照         |
| Project        | Namespace        | 资源隔离     |
| Security Group | NetworkPolicy    | 网络策略     |
| Cinder Volume  | PersistentVolume | 持久存储     |
| Floating IP    | Service/Ingress  | 外部访问     |
| Router         | Service          | 网络路由     |
| Keypair        | Secret           | 密钥管理     |

---

## 九、总结

### 9.1 K8S核心要点

```
1. K8S也有控制平面和计算节点
   ├── 控制平面 = 大脑（管理集群）
   └── 计算节点 = 肌肉（运行容器）

2. 控制平面组件：
   ├── kube-apiserver   ← API入口
   ├── etcd            ← 数据存储
   ├── scheduler       ← 调度器
   └── controller      ← 控制器

3. 计算节点组件：
   ├── kubelet         ← 节点代理
   ├── kube-proxy      ← 网络代理
   └── containerd      ← 容器运行时

4. Pod vs VM：
   ├── Pod = 容器组（K8S最小单位）
   └── VM = 虚拟机（OpenStack最小单位）

5. 安装方式：
   ├── kubeadm（生产推荐）
   ├── k3s（轻量级）
   └── Minikube（本地开发）
```

### 9.2 选择建议

```
什么时候用OpenStack？
├── 需要管理虚拟机
├── 传统IT转型
├── 企业私有云
└── 需要完整IaaS功能

什么时候用Kubernetes？
├── 云原生应用
├── 微服务架构
├── 快速部署和伸缩
├── 容器化应用
└── CI/CD流水线

两者都用？
├── OpenStack提供基础设施
└── Kubernetes运行在OpenStack之上
```

---

_希望这篇文章能帮助你理解K8S的组件架构！如果有问题，欢迎在评论区交流。_
