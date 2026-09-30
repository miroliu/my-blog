---
title: Helm 与 Kustomize 实战：Kubernetes 应用打包与配置管理的双轨最佳实践
description: 系统对比 Helm 与 Kustomize 两大 K8s 配置管理工具，从 Chart 编写、模板语法、版本管理到生产级实践，并给出企业级应用打包与发布的最佳方案
slug: helm与kustomize实战
date: 2026-09-30T17:50:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["云原生"]
---

# Helm 与 Kustomize 实战：Kubernetes 应用打包与配置管理的双轨最佳实践

## 引言：为什么要学包管理

当你管理一个 K8s 应用时，会发现"配置文件"不是一两个 YAML，而是几十上百个：

- Deployment、StatefulSet、DaemonSet
- Service、Ingress、NetworkPolicy
- ConfigMap、Secret、ServiceAccount
- RBAC 资源（Role、RoleBinding）
- CRD（HorizontalPodAutoscaler、PodDisruptionBudget）

如果每个环境（dev/staging/prod）都复制一套，**配置漂移**会让你痛不欲生；如果用纯 sed/grep 替换，又容易出错。

Helm 和 Kustomize 就是为了解决**应用打包**和**配置管理**两大痛点而生的。它们的设计哲学不同，但都已成为事实标准。

## 第一章：Helm 核心概念

### 1.1 Helm 是什么

Helm 是 K8s 的**包管理器**，类比 Linux 的 `apt` 或 macOS 的 `brew`：

- **Chart**：应用的打包格式（一个目录）
- **Release**：Chart 部署到集群后的实例
- **Repository**：Chart 仓库

### 1.2 Chart 目录结构

```bash
my-app/
├── Chart.yaml       # Chart 元数据
├── values.yaml      # 默认配置
├── charts/          # 子 Chart 依赖
├── templates/       # 模板文件（K8s YAML + Go template）
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl # 模板辅助函数
│   └── NOTES.txt    # 安装后提示
└── .helmignore      # 打包排除文件
```

### 1.3 Chart.yaml

```yaml
apiVersion: v2
name: my-app
description: My Application
type: application
version: 1.0.0      # Chart 版本
appVersion: "2.1.0" # 应用版本
maintainers:
- name: ops-team
  email: ops@example.com
dependencies:
- name: postgresql
  version: "12.1.0"
  repository: "https://charts.bitnami.com/bitnami"
```

## 第二章：Helm 模板语法

### 2.1 基础语法

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.appName }}
  labels:
    {{- include "my-app.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount | default 3 }}
  selector:
    matchLabels:
      app: {{ .Values.appName }}
  template:
    metadata:
      labels:
        app: {{ .Values.appName }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.port }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

### 2.2 关键函数

#### (1) 条件渲染

```yaml
{{- if .Values.serviceAccount.create }}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "my-app.fullname" . }}
{{- end }}
```

#### (2) 循环渲染

```yaml
{{- range .Values.configurations }}
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .name }}
data:
  {{- range $key, $value := .data }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
{{- end }}
```

#### (3) 命名模板

```yaml
# templates/_helpers.tpl
{{/*
Expand the name of the chart.
*/}}
{{- define "my-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end }}

{{- define "my-app.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end }}

{{- define "my-app.labels" -}}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" }}
app.kubernetes.io/name: {{ include "my-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
```

### 2.3 values.yaml 设计

```yaml
# 默认值
replicaCount: 3

image:
  repository: my-app
  pullPolicy: IfNotPresent
  tag: ""           # 默认用 Chart.AppVersion

imagePullSecrets:
- name: regcred

serviceAccount:
  create: true
  name: ""

podAnnotations: {}

podSecurityContext:
  fsGroup: 2000

securityContext:
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: false
  className: nginx
  annotations: {}
  hosts:
    - host: chart-example.local
      paths:
        - path: /
          pathType: ImplementationSpecific
  tls: []

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## 第三章：Helm 实战命令

### 3.1 安装 Chart

```bash
# 从仓库安装
helm install my-release bitnami/postgresql

# 自定义 values
helm install my-release ./my-app \
  -f my-values.yaml \
  --namespace production \
  --create-namespace

# 模拟安装（验证渲染结果）
helm install my-release ./my-app --dry-run --debug

# 等待资源就绪
helm install my-release ./my-app --wait --timeout 5m
```

### 3.2 升级与回滚

```bash
# 升级（自动合并复用）
helm upgrade my-release ./my-app -f new-values.yaml

# 原子操作（先 uninstall 再 install）
helm upgrade --install my-release ./my-app

# 查看历史
helm history my-release

# 回滚到指定版本
helm rollback my-release 2
```

### 3.3 Helm 3 与 Helm 2 的核心区别

| 特性 | Helm 2 | Helm 3 |
|------|--------|--------|
| Tiller | 需要 | 无需，客户端直接与 K8s API 通信 |
| Release 名称 | 全局唯一 | namespace 内唯一 |
| 默认 Chart 类型 | - | application / library |
| 依赖管理 | requirements.yaml + `helm dep update` | Chart.yaml 的 dependencies |

## 第四章：Kustomize 核心概念

### 4.1 Kustomize 是什么

Kustomize 是**无模板的 K8s 配置管理工具**，哲学与 Helm 不同：

- **不渲染模板**：原始 YAML + patch 叠加
- **声明式管理**：用 kustomization.yaml 描述最终状态
- **K8s 原生**：`kubectl apply -k` 内置支持

### 4.2 目录结构

```bash
my-app/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── kustomization.yaml
│   └── namespace.yaml
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── patch-replicas.yaml
    └── prod/
        ├── kustomization.yaml
        ├── patch-replicas.yaml
        └── patch-ingress.yaml
```

### 4.3 base/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
- deployment.yaml
- service.yaml
- namespace.yaml

commonLabels:
  app: my-app

namePrefix: prod-

images:
- name: my-app
  newName: my-registry.com/my-app
  newTag: v1.0.0
```

### 4.4 overlays/prod/kustomization.yaml

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: production

resources:
- ../../base

namePrefix: ""      # 不再加前缀

replicas:
- name: my-app
  count: 5

images:
- name: my-app
  newTag: v1.0.0

patches:
- path: patch-ingress.yaml
- path: patch-resources.yaml

configMapGenerator:
- name: app-config
  literals:
  - LOG_LEVEL=info
  - ENV=production
```

### 4.5 Patch 示例

```yaml
# patch-replicas.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 5
  template:
    spec:
      containers:
      - name: my-app
        resources:
          limits:
            cpu: "1"
            memory: 1Gi
```

```yaml
# strategic merge patch（更强大）
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
      - name: my-app
        env:
        - name: LOG_LEVEL
          value: "info"
```

## 第五章：Helm vs Kustomize 深度对比

### 5.1 哲学差异

| 维度 | Helm | Kustomize |
|------|------|-----------|
| **核心思想** | 模板 + 参数化 | 无模板 + 叠加 patch |
| **语言** | Go template | 原生 YAML + patch |
| **可读性** | 模板渲染后阅读 | 直接读原 YAML |
| **复用** | 子 Chart、模板函数 | base + overlay 继承 |
| **打包分发** | Chart + Repository | 目录结构 |
| **生态** | 大量现成 Chart | K8s 原生 |

### 5.2 适用场景

#### Helm 适合：

1. **发布可复用的应用**：第三方中间件（PostgreSQL、Redis、Prometheus）
2. **复杂的多资源打包**：一个 Chart 含 10+ 资源
3. **需要版本管理**：通过 Chart 版本号管理

#### Kustomize 适合：

1. **多环境配置管理**：dev/staging/prod 共享 base
2. **不需要复杂逻辑**：纯配置调整
3. **直接读原 YAML**：团队成员不需要懂模板语法

### 5.3 黄金组合：Helm + Kustomize

很多团队的做法是：

```
Helm Chart（应用打包）
    ↓
helm template 渲染出 YAML
    ↓
Kustomize 叠加环境特定配置
    ↓
kubectl apply
```

或反过来：

```
Kustomize 渲染环境配置
    ↓
集成到 Helm Chart 的 values.yaml
```

```bash
# 组合使用：渲染 Helm 后用 Kustomize patch
helm template my-app ./chart | kubectl apply -f -
# 或更优雅：
helm template my-app ./chart > /tmp/rendered.yaml
cd overlays/prod && kubectl apply -k .
```

## 第六章：进阶实战

### 6.1 Helm 依赖管理

```yaml
# Chart.yaml
dependencies:
- name: postgresql
  version: 12.1.0
  repository: https://charts.bitnami.com/bitnami
  condition: postgresql.enabled
```

```bash
# 更新依赖
helm dependency update

# 打包
helm package .

# 上传到仓库
helm push my-app-1.0.0.tgz oci://registry-1.docker.io/myorg
```

### 6.2 Helm Hooks

```yaml
# templates/job-migration.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "my-app.fullname" . }}-migration
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: migration
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        command: ["/app/migrate.sh"]
```

常用 Hook 类型：

| Hook | 触发时机 |
|------|---------|
| `pre-install` | 安装前 |
| `post-install` | 安装后 |
| `pre-upgrade` | 升级前 |
| `post-upgrade` | 升级后 |
| `pre-delete` | 删除前 |
| `test` | helm test 时 |

### 6.3 Helmfile：多 Chart 编排

```yaml
# helmfile.yaml
repositories:
- name: bitnami
  url: https://charts.bitnami.com/bitnami

releases:
- name: postgresql
  chart: bitnami/postgresql
  version: 12.1.0
  values:
    - persistence: {size: 100Gi}

- name: my-app
  chart: ./charts/my-app
  version: 1.0.0
  values:
    - replicaCount: 5
    - ingress: {enabled: true}
  needs:
  - postgresql    # 依赖顺序
```

```bash
helmfile apply     # 应用所有
helmfile diff      # 查看差异
```

### 6.4 ArgoCD + Helm + Kustomize

在 GitOps 流程中，可以混合使用：

```yaml
# ArgoCD Application
spec:
  source:
    repoURL: https://github.com/myorg/my-app.git
    targetRevision: main
    path: charts/my-app
    plugin:
      name: kustomize-build
```

## 第八章：面试高频问题

### Q1：Helm 和 Kustomize 怎么选？

> 答：
> - Helm 适合**应用打包与分发**（发布到 Helm Hub 的应用）
> - Kustomize 适合**环境配置管理**（同一应用在多环境部署）
> - 实际生产中常组合使用：Helm 打基础包，Kustomize 处理环境差异

### Q2：Helm 的 `helm template` 和 `helm install` 区别？

> 答：
> - `helm install`：真正部署到集群，生成 Release 记录
> - `helm template`：只渲染 YAML，不部署。常用于 CI 流水线或与 Kustomize 组合

### Q3：Helm release 回滚会丢失数据吗？

> 答：不会丢失 PV 中的数据，但会回滚 Deployment 的镜像版本、ConfigMap 内容等。**StatefulSet 的 PV 持久保留**——这就是为什么有状态应用要用 StatefulSet。

### Q4：为什么说 Kustomize 调试更简单？

> 答：
> - Kustomize 不渲染模板，最终 YAML 和原 YAML 几乎一致
> - `kubectl apply -k` 前可以用 `kubectl kustomize` 直接看最终结果
> - 不需要懂 Go template 语法

### Q5：如何测试 Helm Chart？

> 答：
> 1. `helm install --dry-run --debug`：模拟安装
> 2. `helm lint`：静态检查
> 3. **helm-unittest 插件**：单元测试（断言渲染结果）
> 4. 在 CI 中部署到 kind/minikube 验证

### Q6：Chart 版本和 App 版本区别？

> 答：
> - **Chart version（version）**：Chart 自身的版本（template 变更时递增）
> - **App version（appVersion）**：Chart 打包的应用版本（应用发布新版本时递增）
> - 两者独立，方便兼容旧版 Chart 升级到新版应用

## 第九章：生产最佳实践

### 9.1 Chart 设计原则

1. **单一职责**：一个 Chart 只打包一个应用
2. **合理默认值**：开箱即用，无需复杂配置
3. **最小权限**：默认开启安全加固（PodSecurityContext）
4. **支持升级路径**：考虑已有用户的升级场景
5. **完善文档**：README.md + NOTES.txt

### 9.2 values.yaml 命名规范

```yaml
# 推荐：分层命名
image:
  repository: my-app
  tag: ""
  pullPolicy: IfNotPresent

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

# 避免：扁平命名
imageRepository: my-app
imageTag: ""
cpuRequest: 100m
```

### 9.3 Secret 处理

```yaml
# values.yaml 中不存明文 Secret
db:
  password: ""    # 占位，实际从外部注入

# 推荐：使用 --set 或 external-secret-values
# helm install my-app ./chart --set db.password=$(vault kv get -field=password secret/db)
```

### 9.4 CI/CD 集成

```yaml
# GitHub Actions 示例
- name: Lint Chart
  run: helm lint ./chart

- name: Template
  run: helm template my-release ./chart > rendered.yaml

- name: Diff
  run: |
    helm diff upgrade my-release ./chart -y .
```

## 结语：选择最适合的工具

工具之争没有绝对答案：

- 内部应用 + 多环境：**Kustomize**（简单直接）
- 第三方中间件：**Helm**（生态丰富）
- 复杂应用：**Helm + Kustomize**（扬长避短）
- GitOps：**ArgoCD 原生支持两者**

建议你先在一个项目里用 Kustomize，熟练后再上 Helm，最后组合使用。

下一篇，我们将进入 K8s 故障排查：十大经典案例分析。

---

> 配套阅读：
> - [Kubernetes 核心原理深度剖析](#)
> - [GitOps 与 ArgoCD 实战](#)
> - [Kubernetes 安全加固实战](#)