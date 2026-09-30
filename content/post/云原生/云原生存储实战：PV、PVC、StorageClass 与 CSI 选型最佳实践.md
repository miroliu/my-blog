---
title: 云原生存储实战：PV/PVC、StorageClass 与 CSI 选型最佳实践
description: 系统讲解 Kubernetes 存储体系，从 PV/PVC 模型、StorageClass 动态供给、CSI 插件机制到 Ceph/Longhorn/NFS 等存储方案对比，并给出生产级存储选型与性能调优指南
slug: 云原生存储实战
date: 2026-09-30T18:20:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["云原生"]
---

# 云原生存储实战：PV/PVC、StorageClass 与 CSI 选型最佳实践

## 引言：为什么存储是云原生的"老大难"

容器是无状态的、易漂移的；但**数据是有状态的、不能丢失的**。这种根本矛盾让存储成为云原生落地中最具挑战的一环。

常见的生产场景问题：

- 数据库 Pod 重启后数据没了？
- StatefulSet 跨节点漂移后数据访问不到？
- 多 Pod 共享存储怎么配置？
- 备份恢复怎么做？

本文系统讲解 K8s 存储体系，并给出可落地的选型与最佳实践。

## 第一章：K8s 存储核心概念

### 1.1 存储的三层抽象

```
┌─────────────────────────────────────────────────┐
│ 用户视角：PVC（PersistentVolumeClaim）           │
│   "我需要 100Gi 的存储"                         │
├─────────────────────────────────────────────────┤
│ 平台视角：PV（PersistentVolume）                │
│   "我提供这块存储"                                │
├─────────────────────────────────────────────────┤
│ 基础设施视角：底层存储（NFS/Ceph/云盘）           │
│   "我有真实磁盘"                                │
└─────────────────────────────────────────────────┘
```

### 1.2 PVC 是怎么绑定 PV 的？

```
┌──────────────┐    申请     ┌──────────────────┐
│    PVC       │ ──────────▶ │ StorageClass     │
│ 100Gi, RWO   │            │ (动态供给)        │
└──────┬───────┘            └────────┬─────────┘
       │                            │
       │ 找不到就触发              │ 创建
       ▼                            ▼
┌──────────────┐    绑定    ┌──────────────────┐
│    PV        │ ◀─────────│    PV            │
│ 100Gi, RWO   │           │  100Gi, gp3      │
└──────────────┘            └──────────────────┘
```

## 第二章：PV 与 PVC 详解

### 2.1 PV 定义示例

```yaml
# 静态 PV
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-data-01
spec:
  capacity:
    storage: 100Gi
  accessModes:
  - ReadWriteOnce          # RWO：单节点读写
  persistentVolumeReclaimPolicy: Retain   # 回收策略
  storageClassName: manual                # 不走动态供给
  hostPath:
    path: /mnt/data
```

### 2.2 PVC 定义

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
  namespace: production
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi       # 申请容量
  storageClassName: gp3   # 指定 StorageClass
```

### 2.3 访问模式

| 模式 | 缩写 | 适用 |
|------|--------|------|
| **ReadWriteOnce** | RWO | 单节点读写（数据库） |
| **ReadOnlyMany** | ROX | 多节点只读（配置文件） |
| **ReadWriteMany** | RWX | 多节点读写（共享文件系统） |

**面试高频**：RWX 为什么不是所有存储都支持？

> 答：因为 RWX 需要**共享文件系统语义**（如 NFS、对象存储）。传统块存储（云盘、本地磁盘）只能 RWO。

### 2.4 回收策略

```yaml
persistentVolumeReclaimPolicy:
  # Retain（默认）：保留数据，手动清理
  # Recycle：删除数据（已废弃）
  # Delete：删除底层存储
```

生产推荐 **Retain** + 自动备份，避免误删。

### 2.5 在 Pod 中使用

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:15
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: postgres-data-pvc
```

## 第三章：StorageClass 动态供给

### 3.1 为什么需要动态供给

静态 PV 需要预先创建，大规模集群运维成本极高。**StorageClass** 让你声明"我要 100Gi 存储"，K8s 自动创建 PV。

### 3.2 StorageClass 定义

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
provisioner: ebs.csi.aws.com   # AWS EBS
volumeBindingMode: WaitForFirstConsumer   # 延迟到 Pod 调度时
allowVolumeExpansionParameters: { "type": "gp3", "fsType": "ext4" }
parameters:
  type: gp3
  iopsPerGB: "3000"
  throughput: "125"
reclaimPolicy: Delete
```

### 3.3 关键参数

#### volumeBindingMode

- **Immediate**：PVC 创建立即绑定（适用于单 AZ）
- **WaitForFirstConsumer**（推荐）：等 Pod 调度到节点后再创建（多 AZ 场景）

```yaml
# 多 AZ 场景必须用 WaitForFirstConsumer
volumeBindingMode: WaitForFirstConsumer
```

**为什么重要**：如果你在 us-east-1a 创建 PVC，存储也在 1a；如果 Pod 调度到 1b，挂载会失败。

### 3.4 各云厂商 StorageClass 对比

| 云厂商 | Provisioner | 默认 SC |
|--------|-------------|----------|
| **AWS** | ebs.csi.aws.com | gp3 |
| **GCP** | pd.csi.storage.gke.io | pd-ssd |
| **Azure** | disk.csi.azure.com | managed-csi |
| **阿里云** | diskplugin.csi.alibabacloud.com | alicloud-disk-essd |
| **腾讯云** | com.tencent.cloud.csi.cbs | cbs |

## 第四章：CSI（Container Storage Interface）

### 4.1 CSI 是什么

CSI 是 K8s 与存储系统之间的**标准接口**，类似 CRI（容器运行时）、CNI（网络）。

```
┌─────────────────────────────────────────────────┐
│                Kubernetes Core                  │
│  (Pod, PVC, Volume Controller)                  │
└─────────────────────┬───────────────────────────┘
                      │ CSI
┌─────────────────────▼───────────────────────────┐
│              CSI Driver（Sidecar）              │
│  - external-provisioner                         │
│  - external-attacher                            │
│  - external-snapshotter                         │
│  - external-resizer                             │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│           存储后端                              │
│  AWS EBS / Ceph / Longhorn / NFS               │
└─────────────────────────────────────────────────┘
```

### 4.2 CSI 三大能力

#### (1) 动态供给

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ceph-rbd
provisioner: rbd.csi.ceph.com
parameters:
  clusterID: <ceph-cluster-id>
  pool: kubernetes
  imageFeatures: layering
  csi.storage.k8s.io/provisioner-secret-name: ceph-secret
  csi.storage.k8s.io/node-publish-secret-name: ceph-secret
  fsType: ext4
```

#### (2) 卷快照

```yaml
# VolumeSnapshotClass
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshotClass
metadata:
  name: csi-snapclass
driver: rbd.csi.ceph.com
deletionPolicy: Delete

---
# 快照
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: data-snapshot
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: data-pvc
```

#### (3) 卷扩容

```yaml
# 修改 PVC 即可触发扩容
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  resources:
    requests:
      storage: 200Gi    # 从 100Gi 扩到 200Gi
```

要求 `allowVolumeExpansion: true`。

### 4.3 StorageClass + VolumeBinding 实战

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: local-ssd
provisioner: kubernetes.io/no-provisioner   # 静态
volumeBindingMode: WaitForFirstConsumer
reclaimPolicy: Delete
```

```yaml
# 配套的 PV
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-ssd-pv
spec:
  capacity:
    storage: 500Gi
  accessModes:
  - ReadWriteOnce
  storageClassName: local-ssd
  persistentVolumeReclaimPolicy: Delete
  local:
    path: /mnt/ssd1
  nodeAffinity:        # 限定节点
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values:
          - node-with-ssd
```

## 第五章：存储方案选型

### 5.1 主流方案对比

| 方案 | 类型 | 适用场景 | 优点 | 缺点 |
|------|------|---------|------|------|
| **云厂商块存储** | 块存储 | 数据库、高 IOPS | 简单、稳定、高性能 | 受限于单一 AZ |
| **Ceph** | 分布式 | 大规模、自建集群 | 成熟、多协议 | 运维复杂 |
| **Longhorn** | 分布式 | 中小集群 | 简单、UI 友好 | 性能不如 Ceph |
| **NFS** | 文件 | 共享数据、配置文件 | 简单、通用 | 单点、性能一般 |
| **GlusterFS** | 分布式 | 传统场景 | 兼容性好 | 社区热度下降 |
| **OpenEBS** | 分布式 | 多场景 | 多种引擎可选 | 较复杂 |

### 5.2 选型决策树

```
是否有云厂商？
├─ 是 → 用云块存储（gp3/EBS SSD）
│       需要多 AZ？→ 配 WaitForFirstConsumer
│       需要共享？→ 加 NFS/EFS
└─ 否 → 自建集群
         ├─ 大规模（>100 节点）→ Ceph（Rook 编排）
         ├─ 中小规模 → Longhorn
         └─ 简单共享 → NFS + hostPath 备份
```

### 5.3 生产方案深度对比

#### Ceph（通过 Rook 部署）

```yaml
# CephCluster CR
apiVersion: ceph.rook.io/v1
kind: CephCluster
metadata:
  name: rook-ceph
  namespace: rook-ceph
spec:
  cephVersion:
    image: quay.io/ceph/ceph:v17.2.6
  dataDirHostPath: /var/lib/rook
  mon:
    count: 3
  storage:
    useAllNodes: true
    useAllDevices: true
  dashboard:
    enabled: true
```

**适用**：大规模生产、对性能有要求、有专人运维。

#### Longhorn

```bash
# 一键安装
helm repo add longhorn https://charts.longhorn.io
helm install longhorn longhorn/longhorn --namespace longhorn-system --create-namespace
```

**适用**：中小规模、追求简单、有 K8s 经验。

#### 云块存储 + NFS 混合

- **数据库 → 云块存储**（高性能、HDD）
- **共享文件 → 云厂商 NFS / EFS**
- **备份 → 对象存储（S3/OSS）**

**适用**：云上部署、运维团队小。

## 第六章：生产级实践

### 6.1 StatefulSet 实战

StatefulSet 是 K8s 处理有状态应用的标准方式：

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    spec:
      containers:
      - name: postgres
        image: postgres:15
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ReadWriteOnce]
      storageClassName: gp3
      resources:
        requests:
          storage: 100Gi
```

**关键特性**：

- 稳定的网络标识：`postgres-0.postgres.default.svc.cluster.local`
- 每个 Pod 独占 PVC：`postgres-data-postgres-0`
- 有序部署、扩容

### 6.2 性能调优

#### (1) IOPS 调优

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: high-iops
provisioner: ebs.csi.aws.com
parameters:
  type: io2
  iopsPerGB: "1000"        # 每 GB 1000 IOPS
  throughput: "1000"
```

#### (2) 文件系统选择

```yaml
# 大量小文件：xfs
parameters:
  fsType: xfs

# 大文件顺序读写：ext4
parameters:
  fsType: ext4

# 数据库（MySQL/PostgreSQL）：xfs 性能更好
```

#### (3) 挂载选项

```yaml
volumeMounts:
- name: data
  mountPath: /var/lib/postgresql/data
  # PostgreSQL 推荐 mount 选项
```

CSI Driver 通常会设置合适的默认 mount 选项。

### 6.3 数据保护

#### (1) 备份策略

```yaml
# Velero 备份（PV 级别）
apiVersion: velero.io/v1
kind: Backup
metadata:
  name: daily-backup
spec:
  schedule: "0 2 * * *"
  includedNamespaces:
  - production
  ttl: 720h
```

#### (2) 卷快照

```yaml
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: data-snapshot-pre-upgrade
spec:
  volumeSnapshotClassName: csi-snapclass
  source:
    persistentVolumeClaimName: postgres-data-postgres-0
```

#### (3) 异地容灾

跨区域复制：

```yaml
# 例如 Ceph RBD mirror、S3 跨区域复制
```

### 6.4 监控告警

```promql
# 卷使用率
kubelet_volume_stats_available_bytes / kubelet_volume_stats_capacity_bytes < 0.2

# IOPS
rate(kubelet_volume_stats_inodes[5m])

# PVC Pending
kube_persistentvolumeclaim_status_phase{phase="Pending"} == 1
```

## 第七章：常见问题与排障

### 7.1 PVC 一直 Pending

```bash
$ kubectl describe pvc data-pvc
Events:
  Warning  ProvisioningFailed  ...  Failed to provision volume with StorageClass "gp3":
  failed to create volume: ResourceNotFoundException
```

常见原因：

- **StorageClass 不存在**：`kubectl get sc`
- **配额超限**：`kubectl describe resourcequota`
- **CSI 异常**：`kubectl logs -n kube-system -l app=csi-driver`

### 7.2 挂载失败

```bash
Events:
  Warning  FailedMount  ...  Unable to attach or mount volumes
```

排查：

```bash
# 节点上检查
mount | grep /var/lib/kubelet/pods

# CSI 驱动日志
kubectl logs -n kube-system -l app=csi-driver
```

### 7.3 数据丢失

**恢复步骤**：

```bash
# 1. 立即停止 Pod
kubectl scale deployment <name> --replicas=0

# 2. 保留现场
kubectl get pvc -o yaml > pvc-backup.yaml

# 3. 从快照恢复
kubectl apply -f volume-restore.yaml

# 4. 验证数据完整性
```

## 第八章：面试高频问题

### Q1：PV 和 PVC 的关系？

> 答：
> - **PV**：集群级别的存储资源（管理员视角）
> - **PVC**：用户对存储的申请（用户视角）
> - **绑定**：PVC 创建时 K8s 自动匹配满足要求的 PV
>
> 类比：PV 是房东的房子，PVC 是租房合同。

### Q2：StorageClass 有什么作用？

> 答：动态供给 PV。用户声明"我需要 100Gi gp3 存储"，K8s 调用 CSI Driver 自动创建 PV。生产必备。

### Q3：什么是 CSI？为什么 K8s 不直接对接存储？

> 答：
> - **CSI**：容器存储接口标准
> - K8s 通过 CSI 把存储实现交给厂商
> - 类似 CNI（网络）、CRI（容器运行时）
>
> 解耦让 K8s 核心精简，生态丰富。

### Q4：ReadWriteMany 为什么难实现？

> 答：RWX 需要**共享文件系统语义**（多节点同时挂载、可读写）。传统块存储只能在单节点挂载。能支持 RWX 的：
> - 网络文件系统：NFS、GlusterFS、CephFS
> - 分布式文件系统：JuiceFS、Alluxio
> - 对象存储挂载：S3FS

### Q5：StatefulSet 和 Deployment 存储方面的区别？

> 答：
> - **Deployment**：Pod 共享 PVC（一般用 emptyDir 或共享存储）
> - **StatefulSet**：每个 Pod 独立 PVC（volumeClaimTemplates）
>
> StatefulSet 适合数据库等有状态应用，Deployment 适合无状态服务。

### Q6：什么是 volumeBindingMode？什么时候用 WaitForFirstConsumer？

> 答：
> - **Immediate**：PVC 创建立即绑定 PV
> - **WaitForFirstConsumer**：等 Pod 调度后再创建 PV
>
> 多 AZ 场景必须用 WaitForFirstConsumer，保证存储和 Pod 在同一 AZ。

### Q7：本地存储 vs 分布式存储？

> 答：
> - **本地存储**（hostPath、local PV）：性能最佳，但 Pod 不能跨节点漂移
> - **分布式存储**（Ceph、Longhorn）：可跨节点，有网络开销
>
> 数据库推荐本地 SSD 提升性能，但要有副本机制（主从同步）。

## 第九章：生产 Checklist

### 上线前必做

- [ ] StorageClass 配置 `WaitForFirstConsumer`
- [ ] 启用 `allowVolumeExpansion`
- [ ] 配置合理的回收策略（推荐 Retain）
- [ ] 备份方案验证（Velero / 卷快照）
- [ ] 监控告警（卷使用率、IOPS、Pending PVC）
- [ ] 资源配额（避免某个 namespace 占满所有存储）

### 性能优化清单

- [ ] 选择合适的存储类（gp3、io2）
- [ ] 文件系统选择（XFS vs ext4）
- [ ] mount 选项优化
- [ ] 节点本地缓存（部分场景）

## 结语：存储是云原生落地的"最后一公里"

K8s 存储不是单一技术，而是**完整的体系**：

1. 概念层：PV/PVC/StorageClass
2. 接口层：CSI
3. 实现层：Ceph、Longhorn、云存储
4. 运维层：备份、监控、扩容

掌握这套体系，你就能在云原生时代游刃有余地处理任何存储场景。

学习建议：

1. 先在云上用云存储熟悉 PVC 流程
2. 部署 Longhorn 体验分布式存储
3. 最后学 Ceph 应对大规模生产

---

> 配套阅读：
> - [Kubernetes 核心原理深度剖析](#)
> - [Kubernetes 故障排查实战](#)
> - [Kubernetes Operator 开发实战](#)