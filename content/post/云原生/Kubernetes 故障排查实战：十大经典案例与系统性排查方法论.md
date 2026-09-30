---
title: Kubernetes 故障排查实战：十大经典案例与系统性排查方法论
description: 整理 Kubernetes 生产环境最常见的十类故障，从 Pod 调度失败、CrashLoopBackOff、节点 NotReady 到 DNS 解析异常，给出标准化排查流程与解决方案
slug: kubernetes故障排查十大经典案例
date: 2026-09-30T18:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["云原生"]
---

# Kubernetes 故障排查实战：十大经典案例与系统性排查方法论

## 引言：故障排查的思维方式

K8s 故障排查和传统应用最大的不同是：**问题不在机器上，而在对象关系里**。

一个 Pod 起不来，原因可能是：
- 镜像问题
- 资源不足
- 节点污点
- PVC 绑定失败
- ServiceAccount 缺失
- NetworkPolicy 拦截
- 镜像仓库凭证

排查 K8s 故障的核心是**分层定位**：从现象出发，逐层深入。

本文整理了生产中最常见的 10 类故障，给出标准化的排查步骤和解决方案。

## 排查方法论：四步定位法

### 第一步：观察现象

```bash
# 资源概览
kubectl get all -n <namespace>

# 详细信息
kubectl describe pod <pod-name> -n <namespace>

# 集群事件
kubectl get events --sort-by=.metadata.creationTimestamp -A
```

### 第二步：缩小范围

判断故障域：

| 故障域 | 现象 | 工具 |
|---------|---------|------|
| 单 Pod | 某个 Pod 起不来 | kubectl describe/logs |
| 单节点 | 节点上的 Pod 都异常 | kubectl/SSH |
| 全集群 | 大面积异常 | 控制平面组件 |

### 第三步：深入调试

```bash
# 进入容器调试
kubectl exec -it <pod-name> -- /bin/sh

# 临时启动调试 Pod（共享网络）
kubectl run debug --rm -it --image=nicolaka/netshoot -- bash

# 端口转发
kubectl port-forward <pod-name> 8080:80
```

### 第四步：根因分析与解决

找到根因后，按照"**修复 → 验证 → 防回归**"三步走。

## 案例一：Pod 一直 Pending

### 现象

```bash
$ kubectl get pod
NAME          READY   STATUS    RESTARTS   AGE
my-app-xxx    0/1     Pending   0          5m
```

### 排查流程

```bash
$ kubectl describe pod my-app-xxx
```

### 常见原因与解决

#### (1) 资源不足

```
Events:
  Warning  FailedScheduling  ...  0/3 nodes are available:
  3 Insufficient cpu.
```

**解决**：
```bash
# 查看节点分配
kubectl describe nodes | grep -A 5 "Allocated resources"
# 删除无用 Pod，或降低 request，或增加节点
```

#### (2) 节点污点

```
Events:
  Warning  FailedScheduling  ...  node(s) had taint {key=value:effect},
  that the pod didn't tolerate.
```

**解决**：
```yaml
# Pod 容忍污点
tolerations:
- key: "dedicated"
  operator: "Equal"
  value: "gpu"
  effect: "NoSchedule"
```

#### (3) PVC 绑定失败

```
Events:
  Warning  FailedScheduling  ...  persistentvolumeclaim "data" not found.
```

**解决**：
```bash
kubectl get pvc -n <namespace>
kubectl describe pvc <pvc-name>
```

#### (4) nodeSelector 不匹配

```yaml
# Pod 用了 nodeSelector 但没有节点匹配
nodeSelector:
  gpu: true
```

**解决**：为节点打标签或调整 selector。

## 案例二：CrashLoopBackOff

### 现象

```bash
$ kubectl get pod
NAME          READY   STATUS             RESTARTS   AGE
my-app-xxx    0/1     CrashLoopBackOff   5          3m
```

### 排查流程

```bash
# 关键：看上一次启动日志
$ kubectl logs my-app-xxx --previous
```

### 常见原因

#### (1) 应用启动错误

```
Error: could not connect to database
```

**解决**：检查 ConfigMap、Secret、Service 名称。

#### (2) 健康检查失败

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5      # 5 秒检查一次，连续失败 3 次重启
```

应用启动需要 30 秒，但探针 10 秒后就检测 → 误杀。

**解决**：调整 `initialDelaySeconds`，或改用 `startupProbe`。

#### (3) OOMKilled

```bash
$ kubectl describe pod my-app-xxx
Last State: Terminated
  Reason: OOMKilled
  Exit Code: 137
```

**解决**：增加 memory limits，或优化应用内存。

```yaml
resources:
  requests:
    memory: "256Mi"
  limits:
    memory: "1Gi"
```

#### (4) 权限错误

```
Error: cannot create ServiceAccount: permission denied
```

**解决**：检查 RBAC 绑定。

## 案例三：Pod 无法访问 Service

### 现象

应用能起来，但访问其他 Service 报 connection refused。

### 排查流程

```bash
# 1. Service 是否存在
kubectl get svc -n <namespace>

# 2. Endpoints 是否有 Pod IP
kubectl get endpoints <service-name>
# 如果 endpoints 为空，说明 selector 不匹配

# 3. 从 Pod 内测试
kubectl exec -it <pod-name> -- curl http://my-service:8080

# 4. DNS 解析
kubectl exec -it <pod-name> -- nslookup my-service
```

### 常见原因

#### (1) selector 不匹配

```yaml
# Service
selector:
  app: backend       # 但 Pod 的 label 是 app: backend-v2
```

#### (2) CoreDNS 异常

```bash
# 检查 CoreDNS Pod
kubectl get pod -n kube-system -l k8s-app=kube-dns

# 测试 DNS
kubectl run debug --rm -it --image=busybox -- nslookup my-service
```

#### (3) NetworkPolicy 拦截

默认 Deny 策略下，没在白名单中的流量被丢弃。

```yaml
# 检查 NetworkPolicy
kubectl get networkpolicy -n <namespace>
```

## 案例四：节点 NotReady

### 现象

```bash
$ kubectl get nodes
NAME      STATUS     ROLES    AGE
node-1    NotReady   worker   10d
```

### 排查流程

```bash
# 1. SSH 到节点
systemctl status kubelet

# 2. 查看 kubelet 日志
journalctl -u kubelet -n 200 --no-pager

# 3. 看节点事件
kubectl describe node node-1
```

### 常见原因

#### (1) kubelet 进程异常

```bash
systemctl restart kubelet
journalctl -u kubelet -f
```

#### (2) 磁盘满

kubelet 默认在 diskPressure > 85% 时自动停止汇报 → NotReady。

```bash
df -h
# 清理 docker/containerd
docker system prune -a
```

#### (3) 证书过期

```bash
journalctl -u kubelet | grep -i certificate
```

**解决**：
```bash
# 重启会自动续期（kubelet 证书）
systemctl restart kubelet

# 或手动续期
kubeadm certs renew all
systemctl restart kubelet
```

#### (4) 与 API Server 网络不通

```bash
curl -k https://<api-server>:6443/healthz
```

## 案例五：ImagePullBackOff

### 现象

```bash
$ kubectl get pod
NAME          READY   STATUS             RESTARTS   AGE
my-app-xxx    0/1     ImagePullBackOff   0          2m
```

### 排查流程

```bash
$ kubectl describe pod my-app-xxx
Events:
  Failed to pull image "my-app:v1": rpc error: code = Unknown
  desc = Error response from daemon: pull access denied for my-app
```

### 常见原因

#### (1) 镜像不存在

```bash
# 验证镜像 tag
docker pull my-app:v1
```

#### (2) 私有仓库凭证缺失

```bash
# 创建 secret
kubectl create secret docker-registry regcred \
  --docker-server=<registry> \
  --docker-username=<user> \
  --docker-password=<pass> \
  -n <namespace>
```

```yaml
# Pod 使用
spec:
  imagePullSecrets:
  - name: regcred
```

#### (3) 镜像仓库限流/网络问题

Docker Hub 对匿名用户有严格限流。使用自建 Harbor / 阿里云 ACR。

## 案例六：服务响应慢

### 现象

应用日志没报错，但 P99 延迟从 100ms 飙到 5s。

### 排查流程

#### (1) 排查资源

```bash
# 节点级
kubectl top nodes

# Pod 级
kubectl top pods -n <namespace>
```

#### (2) 看 HPA/VPA

```bash
kubectl get hpa
kubectl describe hpa <hpa-name>
```

#### (3) 看监控数据（Grafana/Prometheus）

```promql
# CPU 使用率
sum(rate(container_cpu_usage_seconds_total{namespace="prod"}[5m]))

# 网络流量
sum(rate(container_network_receive_bytes_total{namespace="prod"}[5m]))
```

### 常见原因

1. **CPU 资源争抢**：节点过载，Pod 调度到热点节点
2. **HPA 配置不合理**：扩容不及时
3. **下游服务慢**：用 Tracing 定位瓶颈点
4. **数据库慢查询**：检查 DB 监控

## 案例七：DNS 解析异常

### 现象

Pod 内 `nslookup my-service` 失败或超时。

### 排查流程

```bash
# 1. CoreDNS 状态
kubectl get pod -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns

# 2. nodelocaldns（如果启用）
kubectl get pod -n kube-system -l k8s-app=nodelocaldns

# 3. Pod 内 DNS 配置
kubectl exec -it <pod-name> -- cat /etc/resolv.conf
# 正常应该是：
# nameserver 10.96.0.10
# search <namespace>.svc.cluster.local svc.cluster.local cluster.local
# ndots:5
```

### 常见原因

#### (1) CoreDNS Pod 异常

```bash
kubectl rollout restart deployment coredns -n kube-system
```

#### (2) Pod 内 resolv.conf 异常

某些自定义 CNI/网络插件覆盖 resolv.conf。

#### (3) 高并发场景 CoreDNS 性能瓶颈

解决：部署 NodeLocal DNSCache。

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-local-dns
  namespace: kube-system
# ... 略
```

## 案例八：PVC Pending

### 现象

```bash
$ kubectl get pvc
NAME      STATUS    VOLUME   CAPACITY   ACCESS MODES
data-pvc  Pending                             RWO
```

### 排查流程

```bash
kubectl describe pvc data-pvc
```

### 常见原因

#### (1) 没有匹配的 PV

```yaml
# PVC
storageClassName: gp3
accessModes: [ReadWriteOnce]
requests: { storage: 100Gi }
```

需要 StorageClass 正确配置且 Provisioner 正常工作。

#### (2) StorageClass 不存在

```bash
kubectl get storageclass
```

#### (3) 配额限制

```yaml
# 查看 namespace 配额
kubectl get resourcequota -n <namespace>
kubectl describe resourcequota -n <namespace>
```

## 案例九：Pod 启动时间过长

### 现象

Pod 启动后几分钟才 Ready，影响发布速度。

### 优化方向

#### (1) 镜像优化

```dockerfile
# 多阶段构建，减少镜像体积
FROM golang:1.21 AS builder
WORKDIR /app
COPY go.* .
RUN go mod download   # 先缓存依赖
COPY . .
RUN CGO_ENABLED=0 go build

# 拉取基础镜像用 distroless（最小化）
```

#### (2) 应用启动优化

```go
// Go 应用：避免启动时同步阻塞
go func() {
    initDB()  // 异步初始化
}()

// 立即启动 HTTP 服务
http.ListenAndServe(":8080", nil)
```

#### (3) 探针合理配置

```yaml
# 使用 startupProbe 给应用足够启动时间
startupProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 30
  periodSeconds: 5      # 给 150 秒启动

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 0
  periodSeconds: 10
```

#### (4) 镜像预热（K8s 1.28+）

```yaml
# 在节点上预拉镜像
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: my-runtime
spec:
  overhead:
    podFixed:
      memory: "120Mi"
```

## 案例十：节点时钟漂移

### 现象

TLS 握手失败、证书过期、数据库连接异常。

### 排查

```bash
# 查看节点时间
date
timedatectl status

# 与 API Server 时间对比
kubectl exec -it <pod-name> -- date
```

### 解决

```bash
# 启用 NTP 同步
timedatectl set-ntp true
systemctl restart systemd-timesyncd

# 或部署 chrony
yum install -y chrony
systemctl enable --now chronyd
```

## 排查工具箱

### 必备工具

```bash
# 1. kubectl 插件
kubectl krew install neat        # 清理输出
kubectl krew install resource-capacity   # 资源容量
kubectl krew install df-pv       # PV 使用情况
kubectl krew install who-can     # RBAC 查询
kubectl krew install insights     # 集群健康诊断

# 2. 调试镜像
kubectl run netshoot --rm -it --image=nicolaka/netshoot -- bash
# 内含：nslookup, dig, curl, tcpdump, etc.

# 3. 进程级调试
kubectl debug <pod> -it --image=busybox --target=<container>
```

### 常用命令速查

```bash
# 查看 Pod 调度失败原因
kubectl get events --field-selector reason=FailedScheduling

# 查看哪些 Pod 在节点上
kubectl get pods -A --field-selector spec.nodeName=node-1

# 资源使用排名
kubectl top pods -A --sort-by=memory

# 强制删除卡住的 Pod
kubectl delete pod <pod> --force --grace-period=0

# 临时禁用 webhook（紧急恢复）
kubectl patch validatingwebhookconfiguration <name> -p '{"webhooks":null}'
```

## 面试高频问题

### Q1：Pod Pending 第一步看什么？

> 答：`kubectl describe pod`，看 Events 部分。90% 的调度失败原因都在那里。

### Q2：CrashLoopBackOff 的排查顺序？

> 答：
> 1. `kubectl logs --previous`：看上次崩溃日志
> 2. `kubectl describe pod`：看 Events
> 3. 检查 livenessProbe 配置（最常被忽视）
> 4. 看 exit code：137=OOMKilled，139=segfault

### Q3：如何排查 Service 连不上？

> 答：
> 1. `kubectl get endpoints <svc>`：确认有 Pod IP
> 2. Pod 内 `curl <svc>:<port>`：测连通性
> 3. `nslookup <svc>`：测 DNS
> 4. 看 NetworkPolicy 是否拦截

### Q4：节点 NotReady 怎么紧急恢复？

> 答：
> 1. `kubectl cordon node-1`：先驱逐流量
> 2. SSH 到节点排查 kubelet
> 3. 常见：磁盘满、证书过期、进程挂
> 4. 排查期间节点上的 Pod 会自动迁移

### Q5：如何快速定位哪个 Pod 吃资源最多？

> 答：`kubectl top pods -A --sort-by=memory` 或 `--sort-by=cpu`。

## 生产最佳实践

### 1. 建立 Runbook

把每个常见故障的排查步骤写成 Runbook，新人也能照着做。

### 2. 部署故障自愈系统

```yaml
# 自动清理异常 Pod
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pod-reaper
spec:
  template:
    spec:
      containers:
      - name: reaper
        image: my-registry.com/pod-reaper
        env:
        - name: RESTART_THRESHOLD
          value: "5"   # 5 分钟内重启超过 5 次告警
```

### 3. 混沌工程演练

```bash
# Chaos Mesh 注入故障
kubectl apply -f - <<EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-failure
spec:
  action: pod-failure
  mode: one
  selector:
    namespaces: [production]
    labelSelectors:
      app: my-app
EOF
```

### 4. 完善监控告警

```yaml
# 关键告警
- alert: PodRestartingFrequently
  expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
- alert: NodeNotReady
  expr: kube_node_status_condition{condition="Ready",status="true"} == 0
- alert: PVCBoundFailed
  expr: kube_persistentvolumeclaim_status_phase{phase="Pending"} == 1
```

## 结语：故障排查是体系化能力

K8s 故障排查不是"靠经验"，而是**结构化的思考**：

1. **明确现象**：Pod 什么状态、什么时候开始
2. **缩小范围**：是单 Pod、单节点、还是全集群
3. **分层深入**：网络、存储、调度、运行时
4. **善用工具**：kubectl describe、logs、events 三件套

建议你把本文保存为书签，每次遇到问题按 Runbook 走一遍。熟练后，自然能形成自己的肌肉记忆。

下一篇，我们将进入 Operator 开发实战：CRD 与 controller-runtime。

---

> 配套阅读：
> - [Kubernetes 核心原理深度剖析](#)
> - [云原生可观测性体系](#)
> - [Kubernetes 安全加固实战](#)