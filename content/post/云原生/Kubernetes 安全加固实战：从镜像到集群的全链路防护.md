---
title: Kubernetes 安全加固实战：从镜像到集群的全链路防护
description: 系统讲解 Kubernetes 集群安全防护体系，覆盖镜像安全、容器运行时安全、网络隔离、RBAC、Secret 管理、Pod Security Standards 等核心内容，并给出企业级落地的安全最佳实践
slug: kubernetes安全加固实战
date: 2026-09-30T17:40:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["云原生"]
---

# Kubernetes 安全加固实战：从镜像到集群的全链路防护

## 引言：安全是云原生的"地基"

很多团队把 K8s 当作"万能编排器"，却忽略了它本身的安全模型其实非常开放。K8s 默认的设置几乎等同于"全员可读写"，在生产环境裸跑等同于把数据库的 3306 端口暴露在公网。

本文将带你系统地搭建 K8s 安全防护体系，覆盖**4 个层级、12 个核心控制点**，并提供可直接落地的 YAML 配置。

## 第一章：云原生安全的 4 层防御模型

云原生安全的最佳实践是**分层防御(Defense in Depth)**，单一防线必破：

```
┌─────────────────────────────────────────────────┐
│ L1: 供应链安全 (镜像/依赖/Base Image)            │
├─────────────────────────────────────────────────┤
│ L2: 集群访问安全 (RBAC/SSO/审计)                │
├─────────────────────────────────────────────────┤
│ L3: 工作负载安全 (Pod/Network/Policy)           │
├─────────────────────────────────────────────────┤
│ L4: 运行时安全 (运行时检测/告警/响应)            │
└─────────────────────────────────────────────────┘
```

面试时能把这个模型画出来 + 说出每层的具体措施，会非常加分。

## 第二章：L1 供应链安全

### 2.1 镜像构建阶段

#### (1) 最小化基础镜像

```dockerfile
# 反例：完整发行版
FROM ubuntu:22.04

# 正例：distroless（无 shell、无包管理器、攻击面最小）
FROM gcr.io/distroless/java:11

# 正例：alpine（轻量、但有 shell，权衡安全与可调试性）
FROM alpine:3.18
```

**面试高频追问**：为什么 distroless 比 alpine 更安全？

> 答：distroless 镜像没有 shell、包管理器、甚至没有 libc（Java 静态链接），攻击者拿到容器权限后难以执行命令或下载工具。Alpine 虽然小但保留了 ash shell 和 apk，攻击面更大。

#### (2) 多阶段构建

```dockerfile
# 阶段 1：编译
FROM golang:1.21 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o /app/server

# 阶段 2：运行（最终镜像只有可执行文件）
FROM gcr.io/distroless/static
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

#### (3) 用户权限降级

```dockerfile
# 创建非 root 用户
RUN addgroup -S app && adduser -S app -G app
USER app    # 切换到非 root
```

```yaml
# K8s 层强制（最佳）
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 3000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

### 2.2 镜像扫描

```bash
# Trivy（推荐开源方案）
trivy image nginx:1.25

# 输出示例：
# nginx:1.25 (debian 12.4)
# =========================
# Total: 45 (UNKNOWN: 0, LOW: 30, MEDIUM: 12, HIGH: 3, CRITICAL: 0)
```

#### 在 CI 中集成

```yaml
# .gitlab-ci.yml
stages:
  - build
  - scan
  - deploy

container_scan:
  stage: scan
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 1 --severity CRITICAL my-app:${CI_COMMIT_SHA}
```

### 2.3 镜像签名（防止供应链投毒）

```bash
# 使用 cosign 签名镜像
cosign sign --key cosign.key my-registry.com/my-app:v1.0

# 验证签名
cosign verify --key cosign.pub my-registry.com/my-app:v1.0
```

生产推荐方案：**Sigstore + cosign**，CNCF 毕业项目。

## 第三章：L2 集群访问安全

### 3.1 认证 (Authentication)

集群支持多种认证方式：

| 方式 | 适用场景 |
|------|---------|
| **X509 证书** | 组件间通信（kubelet、kube-proxy） |
| **ServiceAccount Token** | Pod 内应用访问 API Server |
| **OIDC** | 集成企业 SSO（Okta、Keycloak） |
| **Webhook** | 自定义认证后端 |

### 3.2 鉴权 (Authorization)

#### RBAC 最小权限原则

```yaml
# 反例：给整个集群的写权限
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: dev-admin
subjects:
- kind: User
  name: dev@company.com
roleRef:
  kind: ClusterRole
  name: cluster-admin   # ❌ 太大
  apiGroup: rbac.authorization.k8s.io

# 正例：限制到特定 namespace 的读权限
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: dev
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]   # 只读
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dev-pod-reader
  namespace: dev
subjects:
- kind: User
  name: dev@company.com
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

#### 进阶：用 RBAC Visualizer 审查权限

```bash
# 查看用户实际拥有的权限
kubectl auth can-i list pods --as dev@company.com -n dev

# 生成权限图谱
rbac-tool list
```

### 3.3 ServiceAccount 最佳实践

```yaml
# 1. 为每个应用创建独立 SA
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order-service
  namespace: production

---
# 2. 绑定最小权限
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: production
  name: order-service-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  resourceNames: ["order-service-config"]
  verbs: ["get"]
```

```yaml
# 3. Pod 中使用
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  template:
    spec:
      serviceAccountName: order-service   # 指定 SA
      automountServiceAccountToken: false   # 不需要 K8s API 时关闭
```

### 3.4 API Server 访问控制

```yaml
# kube-apiserver 启动参数（生产推荐）
spec:
  containers:
  - command:
    - kube-apiserver
    - --anonymous-auth=false                    # 禁用匿名
    - --authorization-mode=Node,RBAC            # 启用 RBAC
    - --enable-admission-plugins=NodeRestriction,PodSecurity
    - --audit-log-maxage=30                     # 审计日志保留
    - --audit-log-path=/var/log/kubernetes/audit.log
    - --tls-min-version=VersionTLS12             # 强制 TLS 1.2+
```

## 第四章：L3 工作负载安全

### 4.1 Pod Security Standards

K8s 1.25+ 取代了已废弃的 PodSecurityPolicy，提供三个级别：

| 级别 | 行为 | 适用 |
|------|------|------|
| **privileged** | 不限制 | 系统组件 |
| **baseline** | 防止已知提权 | 默认推荐 |
| **restricted** | 强制最小权限 | 业务工作负载 |

#### 启用方式（Namespace 标签）

```bash
# 在 namespace 上启用 restricted 级别
kubectl label ns production \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

#### Restricted 级别强制要求

```yaml
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
      runAsNonRoot: true
      runAsUser: 1000
```

### 4.2 NetworkPolicy 网络隔离

**默认情况下，K8s Pod 之间网络是全通的**——这是巨大的安全风险。

#### 示例：限制前端只能访问后端

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: database
    ports:
    - protocol: TCP
      port: 5432
  - to:                          # 允许 DNS
    - namespaceSelector: {}
    ports:
    - protocol: UDP
      port: 53
```

#### 默认拒绝 + 白名单策略

```yaml
# 在生产 namespace 默认拒绝所有流量
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: production
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

**面试加分点**：能说出 NetworkPolicy 依赖 CNI 的实现（Calico、Cilium 支持完整 NetworkPolicy；Flannel 不支持）。

### 4.3 Secret 管理

#### (1) 加密 Etcd 中的 Secret

```yaml
# kube-apiserver 启动参数
spec:
  containers:
  - command:
    - kube-apiserver
    - --encryption-provider-config=/etc/kubernetes/encryption-config.yaml
```

```yaml
# encryption-config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: <base64-encoded-32-byte-key>
      - identity: {}
```

#### (2) 推荐方案：External Secrets Operator

```yaml
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: production
spec:
  provider:
    vault:
      server: "https://vault.internal:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "production"

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: db-credentials-secret
  data:
  - secretKey: password
    remoteRef:
      key: secret/data/db
      property: password
```

**优势**：Secret 不存在 Git / Etcd 中，运行时从 Vault 拉取；支持自动轮转。

## 第五章：L4 运行时安全

### 5.1 Falco 运行时威胁检测

Falco 是 CNCF 孵化项目，基于 eBPF/Libscap 检测容器异常行为：

```yaml
# 检测规则示例：特权容器启动
- rule: Launch Privileged Container
  desc: Detect privileged container
  condition: >
    container_started and container
    and container.security_context.privileged=true
  output: >
    Privileged container started
    (user=%user.name command=%container.start.command
     image=%container.image.repository)
  priority: WARNING
```

```yaml
# 部署 Falco
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco --namespace falco --create-namespace
```

### 5.2 Tetragon（更现代的 eBPF 方案）

```yaml
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: block-ssh
spec:
  kprobes:
    - call: "security_bpf_prog"
      syscall: false
  tracepoints:
    - subsystem: "raw_syscalls"
      event: "sys_enter"
      args:
        - index: 0
          type: "int"
          label: "syscall"
      selectors:
        - matchArgs:
            - index: 0
              operator: "Equal"
              values:
                - 322       # execve in x86_64
          matchActions:
            - action: Sigkill
```

### 5.3 镜像准入控制

#### OPA Gatekeeper

```yaml
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8sallowedrepos
spec:
  crd:
    spec:
      names:
        kind: K8sAllowedRepos
      validation:
        openAPIV3Schema:
          properties:
            repos:
              type: array
              items:
                type: string
  targets:
    - rego: |
        package k8sallowedrepos
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not startswith(container.image, "my-registry.com/")
          msg := sprintf("镜像必须来自内部仓库: %v", [container.image])
        }
```

```yaml
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sAllowedRepos
metadata:
  name: only-internal-registry
spec:
  match:
    kinds:
      - apiGroups: ["apps"]
        kinds: ["Deployment"]
  parameters:
    repos:
      - "my-registry.com/"
```

#### Kyverno（更简单的替代）

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-image-registries
spec:
  validationFailureAction: Enforce
  rules:
  - name: only-internal-registry
    match:
      any:
      - resources:
          kinds:
          - Pod
    validate:
      message: "镜像必须来自内部仓库"
      pattern:
        spec:
          containers:
          - image: "my-registry.com/*"
```

## 第六章：审计与监控

### 6.1 审计日志

```yaml
# audit-policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
- level: RequestResponse
  namespaces: ["production"]
  verbs: ["create", "update", "delete", "patch"]
- level: Metadata
  verbs: ["get", "list", "watch"]
- level: None
  resources:
  - group: ""
    resources: ["events"]
```

推送到 Loki 便于检索：

```yaml
containers:
- name: audit
  args:
  - --audit-log-path=-
  - --audit-policy-file=/etc/kubernetes/audit-policy.yaml
```

### 6.2 安全监控指标

```promql
# 可疑事件
rate(audit_event_count{verb="exec",namespace="production"}[5m])

# 失败登录
rate(apiserver_audit_count{verb="create",objectRef_resource="serviceaccounts",response_code=~"4.."}[5m])
```

## 第七章：面试高频问题

### Q1：K8s 默认是安全的吗？

> 答：不是。K8s 设计哲学是"开放可配置"，默认设置偏向于开发友好：
> - Pod 默认可以特权模式运行
> - 网络默认全通
> - ServiceAccount 默认挂载到 Pod
> - 匿名请求默认开启
>
> 生产环境必须显式加固。

### Q2：PodSecurityPolicy 为什么被废弃？

> 答：K8s 1.21 弃用 PSP，1.25 移除。原因：
> 1. API 设计复杂，难以调试
> 2. 权限反转：准入控制要求特权，但准入是反向作用
> 3. 策略合并规则令人困惑
>
> 替代方案：Pod Security Standards（内置）+ Gatekeeper/Kyverno（外部策略引擎）。

### Q3：NetworkPolicy 和 Service Mesh 的安全作用区别？

> 答：
> - **NetworkPolicy**：L3/L4 网络隔离（IP、端口、协议），由 CNI 实现
> - **Service Mesh**：L7 应用层控制（mTLS、流量策略、零信任），由 sidecar 实现
>
> 两者互补：NetworkPolicy 控制"谁能连我"，Mesh 控制"连接怎么加密、怎么鉴权"。

### Q4：如何实现镜像的可信供应链？

> 答：完整流程：
> 1. **构建**：SBOM（软件物料清单）生成
> 2. **扫描**：Trivy / Grype 检测 CVE
> 3. **签名**：cosign + Sigstore 签名
> 4. **验证**：准入控制器验证签名后才允许部署
> 5. **追溯**：漏洞出现时快速定位受影响镜像版本

### Q5：如何处理 K8s Secret 泄露？

> 答：
> 1. 立即轮转 Secret（数据库密码、API Key）
> 2. 检查 Git 历史（`git log -p | grep secret`）
> 3. 检查 Etcd 备份
> 4. 启用 Etcd 加密（即使备份泄露也安全）
> 5. 长期方案：迁移到 Vault + External Secrets

### Q6：生产环境的 RBAC 设计原则？

> 答：
> 1. **最小权限**：按 namespace + 资源类型细粒度划分
> 2. **按角色**：用 Role 而非直接绑定 User
> 3. **避免 cluster-admin**：业务账号不应有集群级权限
> 4. **定期审计**：用 `kubectl auth can-i` 验证实际权限
> 5. **区分环境**：dev/staging/prod 权限严格隔离

## 第八章：生产落地清单

### 8.1 上线前必做检查

- [ ] 所有镜像经 Trivy 扫描，无 Critical 漏洞
- [ ] 镜像签名（cosign）
- [ ] Pod 使用非 root 用户
- [ ] 启用 Pod Security Standards（restricted）
- [ ] 启用 NetworkPolicy（默认拒绝 + 显式允许）
- [ ] SA Token 不自动挂载（不必要时）
- [ ] Secret 经 Vault 等外部系统管理
- [ ] API Server 审计日志开启
- [ ] RBAC 最小权限审计通过
- [ ] 运行时检测（Falco）部署

### 8.2 推荐工具栈

| 层级 | 推荐工具 |
|------|---------|
| **镜像扫描** | Trivy、Grype |
| **镜像签名** | cosign + Sigstore |
| **策略执行** | Kyverno（推荐）、OPA Gatekeeper |
| **Secret 管理** | Vault + External Secrets |
| **运行时检测** | Falco、Tetragon |
| **审计分析** | Loki + Grafana |

## 结语：安全是持续过程

云原生安全不是一次性工作，而是**持续演进的体系**。建议你：

1. **建立基线**：本文提供的检查清单作为起点
2. **持续验证**：定期用 kube-bench / kube-hunter 扫描
3. **演练响应**：模拟镜像泄露、权限提升等场景
4. **跟随社区**：CKA/CKAD/CKS 认证体系是学习路径

下一篇，我们将进入 Helm 与 Kustomize：K8s 应用打包的事实标准。

---

> 配套阅读：
> - [Kubernetes 核心原理深度剖析](#)
> - [云原生可观测性体系](#)
> - [GitOps 与 ArgoCD 实战](#)