---
title: "K3s入门完全指南：轻量级Kubernetes，学会k3s就会k8s吗？"
description: "详解K3s与K8s的区别、K3s的安装配置、以及学会K3s是否等同于掌握K8s"
date: 2026-04-22T20:00:00+08:00
categories: ["技术分享"]
tags:
  - K3s
  - Kubernetes
  - K8s
  - 容器编排
  - 云原生
  - DevOps
comments: true
---

## 前言

"K3s是什么？和K8s有什么关系？"

"我的服务器配置不高，能跑Kubernetes吗？"

"学会了K3s是不是就等于会K8s了？"

这些问题困扰着很多想要入门云原生的朋友。今天我们就来全面解答。

---

## 一、K8s vs K3s：先搞清楚关系

### 1.1 一句话总结

```
┌─────────────────────────────────────────────────────────────────┐
│                    K8s vs K3s 一句话总结                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Kubernetes (K8s) = 功能完整的容器编排平台                       │
│   │                重量级，适合大规模生产环境                      │
│   │                                                          │
│   └──→ K3s = K8s的轻量发行版                                  │
│                    精简版，适合边缘/开发/小规模                     │
│                                                                 │
│   简单类比：                                                    │
│   ├── K8s = 完整版Windows（功能全但占资源）                      │
│   └── K3s = Windows精简版（够用且轻量）                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 核心区别对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    K8s vs K3s 核心区别                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      Kubernetes (K8s)                      │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   架构：                                                │   │
│   │   ├── Control Plane (Master): apiserver, etcd,         │   │
│   │   │   scheduler, controller-manager                      │   │
│   │   ├── Worker Nodes: kubelet, kube-proxy, containerd    │   │
│   │   └── 需要独立部署多个组件                               │   │
│   │                                                         │   │
│   │   资源需求：                                            │   │
│   │   ├── Master: 2核CPU + 4GB内存+                        │   │
│   │   ├── Worker: 2核CPU + 2GB内存+                        │   │
│   │   └── 集群推荐：3台+服务器                             │   │
│   │                                                         │   │
│   │   复杂度：                                              │   │
│   │   ├── 安装复杂（kubeadm/kops）                         │   │
│   │   ├── 配置项多                                          │   │
│   │   └── 学习曲线陡峭                                      │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                        K3s                              │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   架构：                                                │   │
│   │   ├── 单二进制文件：所有组件打包在一起                   │   │
│   │   ├── 默认SQLite（可选etcd）                           │   │
│   │   └── 一条命令即可启动集群                              │   │
│   │                                                         │   │
│   │   资源需求：                                            │   │
│   │   ├── 最低：512MB内存 + 1核CPU                         │   │
│   │   ├── 推荐：1GB内存 + 2核CPU                           │   │
│   │   └── 单节点即可运行                                   │   │
│   │                                                         │   │
│   │   复杂度：                                              │   │
│   │   ├── 一键安装                                         │   │
│   │   ├── 配置简化                                          │   │
│   │   └── 学习曲线平缓                                      │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 详细功能对比

| 功能/组件 | K8s | K3s | 说明 |
|-----------|-----|------|------|
| **API Server** | ✅ | ✅ | 核心组件 |
| **etcd** | ✅ 外置 | ✅ 内置/SQLite | K3s默认更轻量 |
| **Scheduler** | ✅ | ✅ | 调度器 |
| **Controller Manager** | ✅ | ✅ | 控制器管理 |
| **Kubelet** | ✅ | ✅ | 节点代理 |
| **Kube-proxy** | ✅ | ✅ | 网络代理 |
| **Container Runtime** | docker/containerd | containerd (内置) | K3s内置 |
| **Ingress Controller** | 需单独安装 | Traefik (内置) | K3s更方便 |
| **Load Balancer** | 需单独安装 | servicelb (内置) | K3s更方便 |
| **Helm** | 需单独安装 | 内置 | K3s更方便 |
| **CoreDNS** | 需单独安装 | 内置 | K3s更方便 |
| **Metrics Server** | 需单独安装 | 内置 | K3s更方便 |
| **存储类** | 多种 | Local-Path (默认) | K3s默认本地存储 |

### 1.4 K8s vs K3s 架构图

#### Kubernetes (K8s) 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes (K8s) 架构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    ┌─────────────────────────────────┐          │
│                    │         Control Plane           │          │
│                    │  ┌───────────────────────────┐│          │
│                    │  │      API Server           ││          │
│                    │  ├───────────────────────────┤│          │
│                    │  │      etcd                 ││          │
│                    │  ├───────────────────────────┤│          │
│                    │  │  Controller Manager      ││          │
│                    │  ├───────────────────────────┤│          │
│                    │  │      Scheduler           ││          │
│                    │  └───────────────────────────┘│          │
│                    └─────────────────────────────────┘          │
│                                │                                │
│            ┌───────────────────┼───────────────────┐          │
│            ▼                   ▼                   ▼          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│   │   Node 1    │     │   Node 2    │     │   Node N    │   │
│   │ ┌─────────┐ │     │ ┌─────────┐ │     │ ┌─────────┐ │   │
│   │ │Kubelet  │ │     │ │Kubelet  │ │     │ │Kubelet  │ │   │
│   │ ├─────────┤ │     │ ├─────────┤ │     │ ├─────────┤ │   │
│   │ │Kube-proxy│ │    │ │Kube-proxy│ │    │ │Kube-proxy│ │   │
│   │ ├─────────┤ │     │ ├─────────┤ │     │ ├─────────┤ │   │
│   │ │ Container│ │    │ │ Container│ │    │ │ Container│ │   │
│   │ │ Runtime  │ │    │ │ Runtime  │ │    │ │ Runtime  │ │   │
│   │ └─────────┘ │     │ └─────────┘ │     │ └─────────┘ │   │
│   └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                                 │
│   特点：                                                        │
│   ├── 组件多，需要独立部署                                       │
│   ├── 至少需要3台服务器（生产环境）                             │
│   └── 资源消耗大                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### K3s 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        K3s 架构                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │            K3s Server (单节点)                  │   │   │
│   │   │  ┌───────────────────────────────────────────┐ │   │   │
│   │   │  │          Control Plane + etcd             │ │   │   │
│   │   │  │  ┌─────────┐ ┌───────┐ ┌─────────────┐  │ │   │   │
│   │   │  │  │APIServer│ │  etcd │ │ Scheduler  │  │ │   │   │
│   │   │  │  └─────────┘ └───────┘ └─────────────┘  │ │   │   │
│   │   │  │  ┌───────────────────────────────────┐  │ │   │   │
│   │   │  │  │      Controller Manager           │  │ │   │   │
│   │   │  │  └───────────────────────────────────┘  │ │   │   │
│   │   │  └───────────────────────────────────────────┘ │   │   │
│   │   │  ┌───────────────────────────────────────────┐ │   │   │
│   │   │  │           内置组件                        │ │   │   │
│   │   │  │  Traefik │ servicelb │ Helm │ CoreDNS   │ │   │   │
│   │   │  └───────────────────────────────────────────┘ │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                         │                              │   │
│   │                         ▼                              │   │
│   │   ┌─────────────────────────────────────────────────┐   │   │
│   │   │             K3s Agent (工作节点)               │   │   │
│   │   │  ┌─────────┐ ┌─────────┐ ┌─────────────┐      │   │   │
│   │   │  │Kubelet  │ │Kube-   │ │  Containerd │      │   │   │
│   │   │  │         │ │proxy    │ │  (内置)    │      │   │   │
│   │   │  └─────────┘ └─────────┘ └─────────────┘      │   │   │
│   │   └─────────────────────────────────────────────────┘   │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   特点：                                                        │
│   ├── 单二进制文件，约50MB                                     │
│   ├── 一条命令启动集群                                         │
│   ├── 最低512MB内存即可运行                                    │
│   └── 默认SQLite，可用内嵌etcd                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、K3s移除/简化的内容

### 2.1 移除的组件

```
┌─────────────────────────────────────────────────────────────────┐
│                    K3s移除的组件                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   以下是K3s默认不包含的组件，但可以手动添加：                     │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  组件                  │  说明                        │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  Cloud Provider        │  云厂商集成（AWS/GCP/Azure）│   │
│   │  (部分)                │                              │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  Storage Drivers       │  部分存储驱动（可用其他替代）│   │
│   │  (部分)                │                              │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  etcd高可用            │  默认单节点etcd             │   │
│   │  (默认)                │  (可选外部etcd)            │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  Docker依赖            │  使用containerd替代         │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  某些认证插件          │  可通过配置启用              │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   💡 注意：这些组件不是不能用，而是需要额外配置                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 简化的内容

| K8s | K3s |
|-----|-----|
| 手动部署各组件 | 一键安装 |
| 独立安装etcd集群 | 内置SQLite/单节点etcd |
| 手动配置网络插件 | 默认Flannel |
| 手动安装Ingress | 内置Traefik |
| 手动安装存储 | 默认Local-Path |
| yaml配置复杂 | 配置简化 |

---

## 三、学会K3s = 学会K8s？

### 3.1 答案：基本等于，但有差异

```
┌─────────────────────────────────────────────────────────────────┐
│                学会K3s = 学会K8s？                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      ✅ 等于的部分                      │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   Kubernetes核心概念：                                   │   │
│   │   ├── Pod / Deployment / StatefulSet / DaemonSet       │   │
│   │   ├── Service / Ingress / ConfigMap / Secret           │   │
│   │   ├── Volume / PV / PVC                               │   │
│   │   ├── Namespace / Label / Annotation                   │   │
│   │   └── RBAC / NetworkPolicy                            │   │
│   │                                                         │   │
│   │   核心操作：                                             │   │
│   │   ├── kubectl apply -f xxx.yaml                       │   │
│   │   ├── kubectl get/create/delete pods/svc/deploy       │   │
│   │   ├── kubectl describe/logs/exec                      │   │
│   │   └── kubectl rollout/restart/scale                    │   │
│   │                                                         │   │
│   │   核心原理：                                             │   │
│   │   ├── 控制循环机制                                      │   │
│   │   ├── 调度原理                                          │   │
│   │   ├── 网络模型                                          │   │
│   │   └── 存储机制                                          │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     ⚠️ 差异的部分                      │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   生产环境K8s额外知识：                                 │   │
│   │   ├── etcd集群部署与运维                               │   │
│   │   ├── 高可用架构设计                                    │   │
│   │   ├── 云厂商特定集成（如AWS EBS/GCP Cloud SQL）         │   │
│   │   ├── 多集群管理（ federation）                        │   │
│   │   ├── 高级网络（CNI插件、Calico等）                    │   │
│   │   ├── 认证授权细节（OIDC、LDAP集成）                   │   │
│   │   └── 性能调优和监控告警                                │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 学习路径

```
┌─────────────────────────────────────────────────────────────────┐
│                    从K3s到K8s的学习路径                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   第一阶段：K3s入门（1-2周）                                    │
│   ├── 安装K3s                                                │
│   ├── 部署第一个应用                                          │
│   ├── 学习Pod/Service/Deployment                              │
│   └── 完成基础操作                                            │
│                          ↓                                      │
│   第二阶段：K3s进阶（2-4周）                                   │
│   ├── ConfigMap/Secret                                       │
│   ├── Ingress/Traefik                                        │
│   ├── 存储（Local-Path）                                      │
│   ├── Helm使用                                               │
│   └── 日志和监控                                              │
│                          ↓                                      │
│   第三阶段：K8s迁移（1-2周）                                   │
│   ├── 安装生产级K8s集群                                       │
│   ├── 配置外部etcd                                            │
│   ├── 安装生产级网络插件                                       │
│   └── 迁移K3s应用到K8s                                        │
│                          ↓                                      │
│   第四阶段：K8s深入（持续）                                    │
│   ├── 高可用架构                                             │
│   ├── 云厂商集成                                              │
│   ├── 安全加固                                               │
│   └── 性能优化                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、K3s安装与配置

### 4.1 快速安装（单节点）

```bash
# 方式1：一条命令安装（推荐）
curl -sfL https://get.k3s.io | sh -

# 方式2：指定版本安装
curl -sfL https://get.k3s.io | INSTALL_K3S_VERSION=v1.28.4+k3s1 sh -

# 方式3：离线安装
# 下载安装包
wget https://github.com/k3s-io/k3s/releases/download/v1.28.4+k3s1/k3s
chmod +x k3s
sudo mv k3s /usr/local/bin/

# 启动
sudo k3s server &
```

### 4.2 多节点集群安装

#### Server节点（主节点）

```bash
# 安装Server节点
curl -sfL https://get.k3s.io | sh -s - server \
  --token=<TOKEN> \
  --cluster-init

# 获取Token（用于Agent节点加入）
cat /var/lib/rancher/k3s/server/node-token

# 启动时指定Token
curl -sfL https://get.k3s.io | sh -s - server \
  --token=K10a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5::server:abcdef1234567890 \
  --cluster-init
```

#### Agent节点（工作节点）

```bash
# Agent节点加入集群
curl -sfL https://get.k3s.io | K3S_URL=https://<SERVER_IP>:6443 \
  K3S_TOKEN=<TOKEN> sh -

# 示例
curl -sfL https://get.k3s.io | K3S_URL=https://192.168.1.100:6443 \
  K3S_TOKEN=K10a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5::server:abcdef1234567890 \
  sh -
```

### 4.3 配置kubectl

```bash
# 复制kubeconfig到本地
scp root@<SERVER_IP>:/etc/rancher/k3s/k3s.yaml ~/.kube/config

# 或在Server节点上直接使用
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# 验证
kubectl get nodes

# 输出示例：
# NAME           STATUS   ROLES                  AGE   VERSION
# k3s-server     Ready    control-plane,master   1d    v1.28.4+k3s1
# k3s-agent-1    Ready    <none>                 1d    v1.28.4+k3s1
```

### 4.4 配置国内镜像源

```bash
# 安装时指定镜像
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--snapshotter native" sh -

# 或创建配置文件
sudo mkdir -p /etc/rancher/k3s/
sudo cat > /etc/rancher/k3s/registries.yaml << 'EOF'
mirrors:
  docker.io:
    endpoint:
      - "https://docker.mirrors.ustc.edu.cn"
      - "https://registry-1.docker.io"
  quay.io:
    endpoint:
      - "https://quay.mirrors.ustc.edu.cn"
EOF

# 重启K3s
sudo systemctl restart k3s
```

---

## 五、K3s常用操作

### 5.1 基础命令

```bash
# 查看节点
kubectl get nodes
kubectl get nodes -o wide

# 查看Pod（所有命名空间）
kubectl get pods -A
kubectl get pods -A -o wide

# 查看Service
kubectl get svc -A

# 查看Deployment
kubectl get deploy -A

# 查看日志
kubectl logs -n <namespace> <pod-name>
kubectl logs -f -n <namespace> <pod-name>

# 进入Pod
kubectl exec -it -n <namespace> <pod-name> -- /bin/sh

# 删除资源
kubectl delete -f <yaml-file>
kubectl delete pod <pod-name> -n <namespace>
```

### 5.2 部署应用示例

#### Nginx deployment

```yaml
# nginx-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 2
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
spec:
  selector:
    app: nginx
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

```bash
# 部署
kubectl apply -f nginx-deployment.yaml

# 查看
kubectl get pods,svc -l app=nginx

# 测试
kubectl run curl --image=curlimages/curl -it --rm -- curl nginx-service
```

#### 暴露服务（Ingress）

```yaml
# nginx-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nginx-ingress
  annotations:
    kubernetes.io/ingress.class: traefik
spec:
  rules:
  - host: nginx.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: nginx-service
            port:
              number: 80
```

```bash
# 部署Ingress
kubectl apply -f nginx-ingress.yaml
```

### 5.3 ConfigMap和Secret

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
data:
  nginx.conf: |
    server {
      listen 80;
      server_name localhost;
      location / {
        root /usr/share/nginx/html;
        index index.html;
      }
    }
---
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
type: Opaque
stringData:
  DATABASE_URL: "postgres://user:pass@db:5432/mydb"
  API_KEY: "your-secret-api-key"
```

```bash
# 挂载到Pod
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml

# 在Pod中使用
# env:
#   - name: DATABASE_URL
#     valueFrom:
#       secretKeyRef:
#         name: app-secret
#         key: DATABASE_URL
```

### 5.4 Helm使用

```bash
# K3s已内置Helm，查看版本
helm version

# 添加Helm仓库
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# 安装应用
helm install my-nginx bitnami/nginx

# 查看安装的应用
helm list -A

# 升级应用
helm upgrade my-nginx bitnami/nginx --set image.tag=1.24

# 卸载应用
helm uninstall my-nginx
```

---

## 六、K3s存储配置

### 6.1 默认Local-Path存储

```yaml
# K3s默认已配置Local-Path存储类
# 查看存储类
kubectl get storageclass

# 输出：
# NAME         PROVISIONER             AGE
# local-path   driver.local.storage   1d

# 使用示例
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: my-pvc
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: local-path
---
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
  - name: test
    image: nginx
    volumeMounts:
    - name: test-volume
      mountPath: /data
  volumes:
  - name: test-volume
    persistentVolumeClaim:
      claimName: my-pvc
```

### 6.2 NFS存储（可选）

```yaml
# nfs-storageclass.yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs
provisioner: k8s-sigs.io/nfs-subdir-external-provisioner
parameters:
  archiveOnDelete: "false"
  onDelete: "delete"
---
# NFS PVC
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-pvc
spec:
  storageClassName: nfs
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
```

---

## 七、K3s常用配置

### 7.1 禁用不需要的功能

```bash
# /etc/systemd/system/k3s.service.env
K3S_KUBECONFIG_MODE="644"
K3S_TOKEN="your-secure-token"
K3S_DISABLE:
  - traefik    # 禁用Traefik Ingress
  - servicelb  # 禁用Service LB
  - metrics-server  # 禁用Metrics

# 重启生效
sudo systemctl restart k3s
```

### 7.2 启用容器运行时

```bash
# 查看containerd配置
sudo cat /var/lib/rancher/k3s/agent/etc/containerd/config.toml

# 重载配置
sudo k3s-save
sudo systemctl restart k3s-agent
```

### 7.3 私有仓库认证

```bash
# 创建secret
kubectl create secret docker-registry my-registry \
  --docker-server=https://registry.example.com \
  --docker-username=admin \
  --docker-password=password \
  --docker-email=user@example.com

# 在Pod中使用
# imagePullSecrets:
#   - name: my-registry
```

---

## 八、K3s vs K8s选型指南

### 8.1 选K3s的场景

```
┌─────────────────────────────────────────────────────────────────┐
│                    推荐使用K3s的场景                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ✅ 开发/测试环境                                              │
│      └── 配置简单，快速启动                                      │
│                                                                 │
│   ✅ 学习Kubernetes                                            │
│      └── 门槛低，容易上手                                       │
│                                                                 │
│   ✅ 边缘计算/IoT                                              │
│      └── 资源占用低，适合树莓派/边缘设备                         │
│                                                                 │
│   ✅ 小规模部署（< 10节点）                                     │
│      └── 单节点即可运行                                          │
│                                                                 │
│   ✅ CI/CD环境                                                 │
│      └── 快速创建/销毁集群                                      │
│                                                                 │
│   ✅ 资源受限环境                                               │
│      └── 最低512MB内存即可                                      │
│                                                                 │
│   ✅ 地理位置分散的节点                                         │
│      └── 减少运维复杂度                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 选K8s的场景

```
┌─────────────────────────────────────────────────────────────────┐
│                    推荐使用K8s的场景                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ✅ 生产环境（大规模）                                         │
│      └── 高可用、多节点、需要SLA保障                              │
│                                                                 │
│   ✅ 企业级应用                                                 │
│      └── 需要多团队协作、复杂权限管理                             │
│                                                                 │
│   ✅ 云厂商深度集成                                             │
│      └── AWS EKS / GCP GKE / Azure AKS                         │
│                                                                 │
│   ✅ 高级网络需求                                               │
│      └── Calico网络策略、负载均衡器集成                          │
│                                                                 │
│   ✅ 大规模存储需求                                             │
│      └── 云存储（EBS/GCP PD/Azure Disk）                       │
│                                                                 │
│   ✅ 需要最新特性                                               │
│      └── K8s最新版本的所有功能                                 │
│                                                                 │
│   ✅ 严格安全合规                                               │
│      └── 高级安全策略、审计日志                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 选型决策树

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes选型决策树                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                       开始                                       │
│                         │                                       │
│                         ▼                                       │
│                    是生产环境？                                   │
│                    /          \                                 │
│                  是            否                                │
│                   \          /                                  │
│                    ▼          ▼                                 │
│              ┌─────────┐  预算有限？                            │
│              │   K8s   │ /      \                              │
│              │  生产级  │ 是      否                             │
│              └─────────┘  \    /                               │
│                           ▼   ▼                                │
│                      ┌──────┐ ┌──────┐                        │
│                      │  K3s │ │  K8s │                        │
│                      │(轻量) │ │(完整) │                        │
│                      └──────┘ └──────┘                        │
│                         │         │                             │
│                         ▼         ▼                             │
│                    ┌─────────────────┐                        │
│                    │                 │                        │
│                    │  单节点K3s可满足  │                        │
│                    │  学习/开发/测试  │                        │
│                    └─────────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 九、K3s常用场景示例

### 9.1 部署博客系统（WordPress）

```yaml
# wordpress.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wordpress-pvc
spec:
  storageClassName: local-path
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wordpress
spec:
  replicas: 1
  selector:
    matchLabels:
      app: wordpress
  template:
    metadata:
      labels:
        app: wordpress
    spec:
      containers:
      - name: wordpress
        image: wordpress:6-php8.2-apache
        ports:
        - containerPort: 80
        env:
        - name: WORDPRESS_DB_HOST
          value: mysql
        - name: WORDPRESS_DB_USER
          value: wordpress
        - name: WORDPRESS_DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-password
        - name: WORDPRESS_DB_NAME
          value: wordpress
        volumeMounts:
        - name: wordpress-persistent-storage
          mountPath: /var/www/html
      volumes:
      - name: wordpress-persistent-storage
        persistentVolumeClaim:
          claimName: wordpress-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: wordpress-service
spec:
  selector:
    app: wordpress
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

### 9.2 部署Python应用

```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# python-app.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: python-api
  labels:
    app: python-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: python-api
  template:
    metadata:
      labels:
        app: python-api
    spec:
      containers:
      - name: python-api
        image: myregistry/python-api:v1.0.0
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: python-api-service
spec:
  selector:
    app: python-api
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
```

### 9.3 部署MySQL数据库

```yaml
# mysql.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
spec:
  storageClassName: local-path
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
---
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
type: Opaque
stringData:
  mysql-root-password: r00tP@ssw0rd
  mysql-password: us3rP@ssw0rd
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mysql
spec:
  selector:
    matchLabels:
      app: mysql
  strategy:
    type: Recreate
  template:
    metadata:
      labels:
        app: mysql
    spec:
      containers:
      - name: mysql
        image: mysql:8.0
        env:
        - name: MYSQL_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-root-password
        - name: MYSQL_DATABASE
          value: myapp
        - name: MYSQL_USER
          value: appuser
        - name: MYSQL_PASSWORD
          valueFrom:
            secretKeyRef:
              name: mysql-secret
              key: mysql-password
        ports:
        - containerPort: 3306
          name: mysql
        volumeMounts:
        - name: mysql-persistent-storage
          mountPath: /var/lib/mysql
      volumes:
      - name: mysql-persistent-storage
        persistentVolumeClaim:
          claimName: mysql-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mysql
spec:
  selector:
    app: mysql
  ports:
  - port: 3306
    targetPort: 3306
  clusterIP: None  # 无头服务，用于有状态应用
```

---

## 十、K3s进阶主题

### 10.1 集群升级

```bash
# 查看可用版本
curl -s https://api.github.com/repos/k3s-io/k3s/releases | grep tag_name

# 升级K3s
curl -sfL https://get.k3s.io | sh -s - server \
  --snapshotter native \
  INSTALL_K3S_VERSION=v1.29.0+k3s1

# Agent节点升级
curl -sfL https://get.k3s.io | sh -s - agent \
  INSTALL_K3S_VERSION=v1.29.0+k3s1 \
  K3S_URL=https://<SERVER>:6443 \
  K3S_TOKEN=<TOKEN>
```

### 10.2 备份与恢复

```bash
# 备份etcd数据（K3s使用SQLite或etcd）
# SQLite备份
sudo cp /var/lib/rancher/k3s/server/db/state.db /path/to/backup/state.db

# 恢复
sudo systemctl stop k3s
sudo cp /path/to/backup/state.db /var/lib/rancher/k3s/server/db/state.db
sudo systemctl start k3s
```

### 10.3 监控配置

```bash
# K3s已内置Metrics Server
# 查看资源使用
kubectl top nodes
kubectl top pods -A

# 安装Prometheus + Grafana（可选）
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack
```

### 10.4 日志管理

```bash
# K3s日志位置
sudo journalctl -u k3s -f

# 查看所有容器日志
sudo crictl logs $(sudo crictl ps -q)

# 导出日志
sudo journalctl -u k3s > k3s.log
```

---

## 十一、常见问题

### 11.1 安装问题

```
┌─────────────────────────────────────────────────────────────────┐
│                    安装常见问题Q&A                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Q: 安装失败，提示权限不足？                                   │
│   A: 使用sudo权限执行安装命令                                  │
│                                                                 │
│   Q: Agent节点无法加入集群？                                   │
│   A: 检查Server节点防火墙，端口6443是否开放                     │
│   A: 确认TOKEN正确                                              │
│                                                                 │
│   Q: 镜像拉取失败？                                            │
│   A: 配置国内镜像源或使用私有仓库                               │
│                                                                 │
│   Q: 内存不足？                                                │
│   A: K3s最低要求512MB，建议1GB+                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 运行问题

```
┌─────────────────────────────────────────────────────────────────┐
│                    运行常见问题Q&A                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Q: Pod一直处于Pending状态？                                  │
│   A: 检查存储类是否可用，或资源不足                             │
│                                                                 │
│   Q: Service无法访问？                                         │
│   A: 检查selector是否匹配Pod标签                               │
│                                                                 │
│   Q: Ingress不生效？                                          │
│   A: 检查Traefik是否安装，检查host配置                         │
│                                                                 │
│   Q: Pod无法挂载PVC？                                         │
│   A: 检查StorageClass是否存在                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 十二、总结

### 12.1 K8s vs K3s对比总结

```
┌─────────────────────────────────────────────────────────────────┐
│                    K8s vs K3s 最终对比                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────┬─────────────────────┐                │
│   │        K8s          │        K3s          │                │
│   ├─────────────────────┼─────────────────────┤                │
│   │  单节点最低2C4G     │  单节点最低1C512M   │                │
│   ├─────────────────────┼─────────────────────┤                │
│   │  需要多台服务器     │  单台即可运行       │                │
│   ├─────────────────────┼─────────────────────┤                │
│   │  安装复杂           │  一键安装           │                │
│   ├─────────────────────┼─────────────────────┤                │
│   │  组件独立部署       │  单二进制文件       │                │
│   ├─────────────────────┼─────────────────────┤                │
│   │  功能完整           │  功能精简但够用     │                │
│   ├─────────────────────┼─────────────────────┤                │
│   │  适合大规模生产     │  适合小规模/学习    │                │
│   └─────────────────────┴─────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 学会K3s = 学会K8s？

```
┌─────────────────────────────────────────────────────────────────┐
│                    结论                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ✅ K8s核心概念 = K3s核心概念                                 │
│      学会K3s就掌握了K8s 90%的知识                              │
│                                                                 │
│   ✅ kubectl操作 = 通用                                        │
│      所有K8s命令在K3s上完全适用                                │
│                                                                 │
│   ✅ 资源清单(YAML) = 高度兼容                                 │
│      大部分YAML可直接通用                                      │
│                                                                 │
│   ⚠️ 运维差异                                                   │
│      生产级K8s还需要学习高可用、etcd运维等                       │
│                                                                 │
│   📝 建议：                                                    │
│      先学K3s入门，再深入K8s生产环境                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 12.3 快速入门命令

```bash
# 1. 安装
curl -sfL https://get.k3s.io | sh -

# 2. 获取配置
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# 3. 验证
kubectl get nodes

# 4. 部署应用
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80

# 5. 查看
kubectl get pods,svc
kubectl logs -l app=nginx

# 6. 删除
kubectl delete deployment nginx
kubectl delete service nginx
```

---

*希望这篇文章能帮你快速入门K3s！记住，学会K3s就等于入门了K8s，核心概念和操作是相通的。*
