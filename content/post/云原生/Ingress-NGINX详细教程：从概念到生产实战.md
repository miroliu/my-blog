---
title: "Ingress-NGINX 详细教程：从概念到生产实战"
date: 2025-12-14 16:00:00+08:00
categories: ["云原生"]
tags: ["Ingress", "Ingress-NGINX", "Kubernetes", "K8s", "负载均衡", "反向代理", "DevOps"]
draft: false
---

在 Kubernetes 里，把服务暴露出去有几种方式：`ClusterIP`、`NodePort`、`LoadBalancer`、`Ingress`。  
实践中，**Ingress + Ingress Controller（最常见就是 Ingress-NGINX）** 几乎是 HTTP/HTTPS 流量入口的标准方案。

这篇文章会系统讲清楚：

- **Ingress 是什么、Ingress-NGINX 扮演什么角色**
- **如何在集群中安装 Ingress-NGINX（YAML / Helm 两种方式）**
- **如何编写 Ingress 规则，实现域名/路径路由、HTTPS、重写、限流等功能**
- **常见问题排查与生产环境最佳实践**

> 文中示例主要以 NGINX Ingress Controller 官方项目 `ingress-nginx` 为基础说明。

---

## 一、Ingress 与 Ingress-NGINX 基本概念

### 1.1 Service vs Ingress：各自负责什么？

- **Service**
  - 解决的是：**Pod IP 不稳定**，提供一个稳定的虚拟 IP（ClusterIP）来访问后端 Pod
  - 类型：
    - `ClusterIP`：仅集群内访问
    - `NodePort`：每个节点暴露一个端口对外
    - `LoadBalancer`：云厂商提供负载均衡器
- **Ingress**
  - 解决的是：**HTTP/HTTPS 七层路由问题**
  - 按域名、路径，把请求分发到不同 Service
  - 本身只是一个「路由规则」资源，对应的实际转发逻辑由 **Ingress Controller** 实现

一句话总结：

- **Service 解决“服务发现”和四层转发”**
- **Ingress 解决“七层路由和统一入口”**

### 1.2 什么是 Ingress-NGINX？

- Ingress-NGINX 是 Kubernetes 官方推荐的 **基于 NGINX 的 Ingress Controller 实现**
- 它的主要职责：
  - 监听集群内的 Ingress 资源变更
  - 动态生成/刷新 NGINX 配置
  - 把外部流量（80/443）转发到对应的 Service/Pod

适用场景：

- 多个业务共享同一套入口（一个或少数几个 IP/域名）
- 需要七层能力：路径路由、域名路由、TLS 终止、重写、限流、WAF 集成等

---

## 二、安装 Ingress-NGINX：两种常见方式

> 在安装前，请确认你已经有一个可用的 K8s 集群（如 kubeadm、k3s、KubeSphere、Rancher 集群等）。

### 2.1 使用官方 YAML 快速安装（适合学习/测试）

官方提供了一键部署的 YAML：

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.11.2/deploy/static/provider/cloud/deploy.yaml
```

> 注意：版本号请根据实际最新版本调整，如 `controller-v1.x.x`。

安装完成后，检查 Ingress-NGINX 组件：

```bash
kubectl get pod -n ingress-nginx
kubectl get svc -n ingress-nginx
```

常见输出（不同环境略有差异）：

- Pod：`ingress-nginx-controller-xxxxx` 处于 `Running` 状态
- Service：
  - 在云环境（如阿里云 ACK）：Service 类型通常为 `LoadBalancer`
  - 在自建集群：可能是 `NodePort`，需要自己配外部负载均衡（如物理/云负载、Keepalived+Nginx 等）

### 2.2 使用 Helm 安装（推荐生产环境）

Helm 是 K8s 上事实标准的包管理工具，使用它可以：

- 方便配置参数（端口、副本数、资源限制等）
- 后续升级/回滚更方便

#### 2.2.1 安装 Helm（如未安装）

参考官方文档简略步骤（Linux 示例）：

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

helm version
```

#### 2.2.2 添加 Ingress-NGINX 仓库并安装

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# 安装到 ingress-nginx 命名空间
kubectl create namespace ingress-nginx

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --set controller.replicaCount=2 \
  --set controller.service.type=LoadBalancer
```

关键参数说明：

- `controller.replicaCount=2`：控制器副本数，保证高可用
- `controller.service.type=LoadBalancer`：
  - 云环境：自动创建负载均衡器，并分配外网 IP
  - 自建环境：你可以改成 `NodePort`，再结合外部负载器使用

更多参数可以通过：

```bash
helm show values ingress-nginx/ingress-nginx > values.yaml
```

然后编辑 `values.yaml` 再安装：

```bash
helm install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx -f values.yaml
```

---

## 三、最小可用 Ingress 示例：域名 + 路径转发

假设你已经有一个 Service：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  type: ClusterIP
  selector:
    app: my-app
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
      name: http
```

我们希望通过 `http://my-app.example.com/` 访问它。

### 3.1 一个最简单的 Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx # 对应 Ingress-NGINX 的 ingressClassName（视部署而定）
  rules:
    - host: my-app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

应用：

```bash
kubectl apply -f my-app-ingress.yaml
```

然后在 DNS 或 hosts 中配置：

```text
<INGRESS_CONTROLLER_IP>  my-app.example.com
```

浏览器访问 `http://my-app.example.com/` 即可。

### 3.2 多服务路径路由示例

假设有两个 Service：`svc-api` 和 `svc-web`：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: multi-service
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: svc-api
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: svc-web
                port:
                  number: 80
```

- 访问 `http://app.example.com/` → `svc-web`
- 访问 `http://app.example.com/api` → `svc-api`

---

## 四、HTTPS / TLS 配置

In production，**HTTP 一般都会升级到 HTTPS**。Ingress-NGINX 可以作为 TLS 终止点。

### 4.1 创建 TLS Secret

假设你已经有证书文件 `tls.crt` 和私钥 `tls.key`：

```bash
kubectl create secret tls my-app-tls \
  --cert=tls.crt \
  --key=tls.key \
  -n default
```

### 4.2 在 Ingress 中启用 TLS

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - my-app.example.com
      secretName: my-app-tls
  rules:
    - host: my-app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app
                port:
                  number: 80
```

访问 `https://my-app.example.com` 即可使用 TLS。

### 4.3 强制 HTTP 跳转 HTTPS

通过注解实现：

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
```

这样访问 `http://` 会自动 301 跳转到 `https://`。

---

## 五、常用 NGINX 注解实战（重写、超时、限流等）

Ingress-NGINX 提供大量注解（Annotations）用来控制 NGINX 行为，这里挑最常用的一些。

### 5.1 路径重写（Rewrite）

场景：外部路径 `/api/`，内部服务只认识 `/`。

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: svc-api
                port:
                  number: 80
```

请求 `http://app.example.com/api/users` 会被重写为后端的 `/users`。

### 5.2 超时设置

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "10"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "60"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
```

### 5.3 限流（Rate Limit）

对某个入口做 QPS 限制：

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "10"         # 每秒最大请求数
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "5"
    nginx.ingress.kubernetes.io/limit-rate-after: "1m"  # 超过 1M 之后限速
```

### 5.4 白名单 / 黑名单

```yaml
metadata:
  annotations:
    nginx.ingress.kubernetes.io/whitelist-source-range: "10.0.0.0/8,192.168.0.0/16"
    # nginx.ingress.kubernetes.io/blacklist-source-range: "1.2.3.4/32"
```

---

## 六、Ingress-NGINX 调试与问题排查

### 6.1 常见排查步骤

1. **检查 Ingress 对象本身**

```bash
kubectl get ingress -A
kubectl describe ingress my-app -n default
```

2. **检查 Service / Pod 是否正常**

```bash
kubectl get svc my-app -n default
kubectl get pods -l app=my-app -n default
```

3. **检查 Ingress Controller 日志**

```bash
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller
```

4. **查看 NGINX 生成的配置（高级排查）**

```bash
kubectl exec -it -n ingress-nginx deploy/ingress-nginx-controller -- \
  cat /etc/nginx/nginx.conf
```

### 6.2 常见问题示例

**问题 1：访问域名报 404 Not Found（Ingress 默认后端）**

排查思路：

- 域名是否正确解析到 Ingress Controller 的 IP？
- Ingress 规则中的 `host` 是否和你访问的 Host 匹配？
- `ingressClassName` 是否与 Controller 的 class 一致（如 `nginx`）？

**问题 2：浏览器访问超时**

- 检查 Service 是否有对应的后端 Pod
- 检查 Pod 容器端口是否与 `targetPort` 一致
- 使用 Pod 内部 `curl` 测试 Service：  
  `kubectl exec -it <pod> -- curl http://my-app.default.svc.cluster.local`

**问题 3：HTTPS 报证书错误**

- 确认 TLS Secret 名称与 Ingress 中 `secretName` 一致
- 用 `kubectl get secret my-app-tls -o yaml` 确认证书数据存在
- 如果是自签名证书，需要在客户端导入信任

---

## 七、生产环境最佳实践

### 7.1 高可用和扩展

- Ingress-NGINX Controller 副本数至少 2+，并开启 Pod 反亲和：

```yaml
spec:
  template:
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: app.kubernetes.io/name
                    operator: In
                    values:
                      - ingress-nginx
              topologyKey: "kubernetes.io/hostname"
```

- 在云环境中使用 `LoadBalancer` Service；在自建环境中使用外部负载均衡/Keepalived

### 7.2 监控与日志

- 启用 Prometheus Metrics，监控：
  - QPS、响应时间、状态码分布
  - NGINX 连接数、后端错误率
- 接入集中日志系统（ELK / Loki），分析访问日志和错误日志

### 7.3 安全与限流

- 强制使用 HTTPS，自动跳转 HTTP→HTTPS
- 针对敏感接口配置 IP 白名单 / 限流
- 与 WAF、安全网关集成，抵御常见攻击（SQL 注入、XSS 等）

### 7.4 配置管理与版本控制

- 所有 Ingress YAML 纳入 Git 管理
- 通过 GitOps / CI-CD 系统一致化部署（Argo CD / Flux / GitLab CI 等）
- 避免在集群中直接手工编辑 YAML

---

## 八、小结：把 Ingress-NGINX 用明白

从整体来看，使用 Ingress-NGINX 的套路可以概括为：

1. **集群部署 Ingress-NGINX 控制器**（YAML 或 Helm）
2. **为每个 HTTP/HTTPS 服务编写 Service + Ingress**，让流量按「域名/路径」路由到对应后端
3. **使用 TLS + 注解** 实现 HTTPS、重写、限流、白名单等高级功能
4. **做好监控、日志和高可用**，将 Ingress 入口当作「网关级」关键组件来运维

当你能熟练完成：

- 为任意新服务写出对应的 Ingress 规则
- 排查 404/超时/TLS 失败等常见问题
- 结合 Helm/CI-CD 对 Ingress 做版本化管理

就说明你已经真正掌握了 Ingress-NGINX。  
后续你可以再进一步探索：**基于 Ingress 的蓝绿发布、灰度发布、A/B 测试，以及与 API Gateway（如 Kong、APISIX）结合的高级玩法。**



