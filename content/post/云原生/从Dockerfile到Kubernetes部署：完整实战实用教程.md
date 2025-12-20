---
title: "从 Dockerfile 到 Kubernetes 部署：完整实战实用教程"
date: 2025-12-14 15:00:00+08:00
categories: ["云原生"]
tags: ["Docker", "Dockerfile", "Kubernetes", "K8s", "容器化", "DevOps", "CI/CD"]
draft: false
---

很多同学已经会写一点 Dockerfile，但真正想把一个应用完整跑到 Kubernetes 上，经常会卡在几步：  
**Dockerfile 怎么写才规范？镜像构建好后怎么推到私有仓库（比如 Harbor）？K8s 的 Deployment/Service/Ingress 又该怎么写？**  
这篇文章就是围绕这些问题，给出一条从 0 到 1 的完整路径。

整篇教程围绕一个最常见场景来讲：  
**一个简单的 Web 应用 → 打包成 Docker 镜像 → 推送到 Harbor → 在 Kubernetes 中部署并对外提供访问。**

---

## 1. 准备一个简单的 Web 应用（示例）

为了聚焦容器与 K8s 部署，我们用一个极简的 Node.js Web 服务作为示例，你可以替换成自己的语言和框架。

目录结构示例：

```text
my-app/
  ├─ package.json
  ├─ package-lock.json (可选)
  └─ app.js
```

`package.json` 示例：

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

`app.js` 示例：

```js
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello from Docker & Kubernetes!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

> 如果你用的是 Go / Java / Python，只需要保证有一个可启动的 HTTP 服务即可，后续 Dockerfile 写法略有不同，但思路完全一样。

---

## 2. 编写 Dockerfile：从源码到镜像

### 2.1 一个规范的 Dockerfile 示例（Node.js 版本）

在项目根目录 `my-app/` 下新建 `Dockerfile`：

```dockerfile
# 1. 使用官方 Node.js 基础镜像（生产环境建议使用 slim / alpine 版本）
FROM node:18-alpine AS builder

# 2. 设置工作目录
WORKDIR /app

# 3. 仅拷贝依赖声明文件，先安装依赖（利用缓存）
COPY package*.json ./
RUN npm install --only=production

# 4. 拷贝应用源码
COPY . .

# 5. 暴露容器内部端口（K8s 不依赖此指令，但便于文档化）
EXPOSE 3000

# 6. 指定启动命令
CMD ["npm", "start"]
```

说明与最佳实践要点：

- **固定基础镜像版本**：如 `node:18-alpine`，避免 `latest` 带来的不可预期变更
- **分阶段 COPY**：先 COPY `package*.json` 再 `npm install`，充分利用 Docker 层缓存，提升构建速度
- **WORKDIR**：统一工作目录，避免到处 `cd`
- **CMD/ENTRYPOINT**：用 CMD 指定进程启动命令

> 如果是 Go 应用，常见模式是多阶段构建：第一阶段编译，第二阶段仅拷贝编译产物到一个极简基础镜像（如 `alpine`）。

### 2.2 本地构建镜像

在 `my-app` 目录下执行：

```bash
docker build -t my-app:1.0.0 .
```

构建成功后，可以本地先跑一下：

```bash
docker run --rm -p 3000:3000 my-app:1.0.0
```

浏览器访问 `http://localhost:3000`，看到返回内容说明镜像没问题。

---

## 3. 推送镜像到私有仓库（以 Harbor 为例）

真实环境中，我们不会直接让 K8s 去本地拉镜像，而是推送到一个集中镜像仓库（比如你已经搭好的 Harbor）。

假设你的 Harbor 地址为：`harbor.example.com`，项目（Project）为 `demo`。

### 3.1 登录 Harbor

```bash
docker login harbor.example.com
# 按提示输入用户名和密码
```

### 3.2 给镜像打上仓库地址标签

```bash
docker tag my-app:1.0.0 harbor.example.com/demo/my-app:1.0.0
```

### 3.3 推送镜像

```bash
docker push harbor.example.com/demo/my-app:1.0.0
```

推送成功后，在 Harbor Web 控制台中可以看到 `demo/my-app:1.0.0` 这个镜像。

> **提示**：建议为镜像增加清晰的版本命名规范，例如：`1.0.0`、`1.0.0-build.20251214` 等，同时保留一个 `latest` 作为便于测试使用的标签。

---

## 4. 在 Kubernetes 中部署：Deployment + Service

下面以最常见的方式在 K8s 中部署这个服务：  
**一个 Deployment 管理 Pod 副本，一个 Service 暴露成集群内服务。**

你可以创建一个独立目录（如 `k8s/`），用于存放所有 YAML 文件。

### 4.1 Deployment 配置示例

新建 `k8s/deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3 # 副本数，可根据实际情况调整
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: harbor.example.com/demo/my-app:1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
      imagePullSecrets:
        - name: harbor-secret
```

**关键点说明**：

- `image`：使用你在 Harbor 中的完整镜像地址
- `replicas`：副本数至少 2~3，保证基础高可用
- `resources`：为容器设置合理的 CPU/内存 requests 与 limits，防止资源失控
- `imagePullSecrets`：用于从私有仓库拉取镜像（下面讲如何创建）

### 4.2 创建 Harbor 拉取凭据 Secret

在你的 K8s 集群中执行：

```bash
kubectl create secret docker-registry harbor-secret \
  --docker-server=harbor.example.com \
  --docker-username=你的Harbor用户名 \
  --docker-password=你的Harbor密码 \
  --docker-email=you@example.com
```

该 Secret 会被 `Deployment` 中的 `imagePullSecrets` 引用，用于拉取私有镜像。

### 4.3 创建 Service 暴露服务

新建 `k8s/service.yaml`：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  type: ClusterIP # 集群内部访问，如需外网访问配合 Ingress / NodePort / LoadBalancer
  selector:
    app: my-app
  ports:
    - name: http
      port: 80        # Service 端口
      targetPort: 3000 # Pod 内部容器端口
```

创建资源：

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

查看运行情况：

```bash
kubectl get pods -l app=my-app
kubectl get svc my-app
```

在集群内可以通过 `my-app:80` 访问这个服务（如在其他 Pod 内 `curl http://my-app`）。

---

## 5. 使用 Ingress 暴露 HTTP 访问（可选但强烈推荐）

如果你的集群已经安装了 Ingress Controller（如 Nginx Ingress Controller），可以通过 Ingress 为服务配置域名访问。

### 5.1 Ingress 示例

新建 `k8s/ingress.yaml`：

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx # 视你的集群而定，有的使用 "nginx" 或默认类
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

应用 Ingress：

```bash
kubectl apply -f k8s/ingress.yaml
```

在 DNS 或 hosts 中配置：

```text
<IngressControllerIP>  my-app.example.com
```

然后在浏览器打开 `http://my-app.example.com` 即可访问你的应用。

---

## 6. 镜像升级与 K8s 滚动发布

### 6.1 构建 & 推送新版本镜像

假设你对代码做了修改，准备发布 `1.0.1` 版本：

```bash
docker build -t my-app:1.0.1 .
docker tag my-app:1.0.1 harbor.example.com/demo/my-app:1.0.1
docker push harbor.example.com/demo/my-app:1.0.1
```

### 6.2 更新 Deployment 中的镜像版本

更新 `k8s/deployment.yaml` 中：

```yaml
image: harbor.example.com/demo/my-app:1.0.1
```

然后应用：

```bash
kubectl apply -f k8s/deployment.yaml
```

Kubernetes 会自动执行**滚动更新（RollingUpdate）**：

- 一部分旧 Pod 被缩减
- 同时创建新版本 Pod
- 始终保持有一定数量的 Pod 对外服务

查看滚动更新过程：

```bash
kubectl rollout status deployment/my-app
kubectl get pods -l app=my-app -w
```

### 6.3 回滚到旧版本

如果新版本有问题，可以快速回滚：

```bash
kubectl rollout undo deployment/my-app
```

或回滚到指定历史版本：

```bash
kubectl rollout history deployment/my-app
kubectl rollout undo deployment/my-app --to-revision=2
```

---

## 7. 从 Dockerfile 到 K8s 的一条完整 SOP

最后把实践流程浓缩成一个可执行的 SOP，方便你在实际项目中反复使用：

1. **准备应用代码**
   - 确保本地可以通过 `npm start` / `python app.py` / `./app` 等方式正常启动
2. **编写 Dockerfile**
   - 选择合适的基础镜像
   - 设置 `WORKDIR`、COPY 代码和依赖
   - 指定暴露端口和启动命令
3. **本地构建和测试镜像**
   - `docker build -t my-app:1.0.0 .`
   - `docker run -p 3000:3000 my-app:1.0.0` 进行验证
4. **推送到私有仓库**
   - `docker tag my-app:1.0.0 harbor.example.com/demo/my-app:1.0.0`
   - `docker push harbor.example.com/demo/my-app:1.0.0`
5. **编写 K8s YAML**
   - `Deployment`：镜像地址、副本数、资源限制、环境变量、`imagePullSecrets`
   - `Service`：将 Pod 暴露为集群内服务
   - `Ingress`（可选）：对外提供 HTTP/HTTPS 访问
6. **应用到集群**
   - `kubectl apply -f k8s/`
   - 通过 `kubectl get pods,svc,ingress` 检查状态
7. **持续发布与回滚**
   - 新版本 → 构建镜像 → 推送 → 更新 Deployment → 观察滚动更新
   - 如有问题，使用 `kubectl rollout undo` 快速回退

做到这一整套流程之后，你就完成了从“单机应用”到“云原生应用”的第一个闭环：  
**任何一个新服务，只要写好 Dockerfile 和 YAML，就可以快速上线到 Kubernetes。**

如果你愿意，后续我们可以再写一篇「结合 CI/CD（比如 GitLab CI / GitHub Actions），从 Git 提交自动构建 Docker 镜像并部署到 K8s」的进阶教程，把整个流程完全自动化。\



