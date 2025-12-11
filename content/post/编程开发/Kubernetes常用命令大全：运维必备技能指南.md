---
title: "Kubernetes常用命令大全：运维必备技能指南"
description: "全面整理Kubernetes日常运维中最常用的命令，涵盖集群管理、Pod操作、服务管理、部署调度等核心功能，包含实用示例和最佳实践。"
date: 2025-11-30 14:30:00+08:00
categories:
  - 编程开发
image:
math:
license:
hidden: false
comments: true
draft: false
tags:
  - Kubernetes
  - K8s
  - 容器编排
  - DevOps
  - 运维
  - 命令行
---

# Kubernetes常用命令大全：运维必备技能指南

Kubernetes（简称K8s）作为现代容器编排的主流平台，已成为DevOps工程师和后端开发者必备的技能。熟练掌握K8s命令行工具（kubectl）对于日常的运维工作至关重要。本文整理了K8s日常运维中最常用的命令，涵盖集群管理、Pod操作、服务管理、部署调度等核心功能，帮助您快速提升K8s运维效率。

## 第一章：kubectl基础配置

### 1.1 集群连接配置

```bash
# 配置集群访问信息
kubectl config set-cluster my-cluster --server=https://kubernetes.example.com:6443
kubectl config set-credentials my-user --token=<your-token>
kubectl config set-context my-context --cluster=my-cluster --user=my-user
kubectl config use-context my-context

# 查看当前配置
kubectl config view
kubectl config current-context

# 列出所有上下文
kubectl config get-contexts

# 切换上下文
kubectl config use-context another-context
```

### 1.2 基础连接测试

```bash
# 检查集群连接状态
kubectl cluster-info

# 检查节点状态
kubectl get nodes

# 查看集群信息
kubectl version --client
kubectl version --short

# 授权检查
kubectl auth can-i create deployments --namespace=default
kubectl auth can-i '*' '*' --all-namespaces
```

## 第二章：命名空间管理

### 2.1 命名空间基础操作

```bash
# 查看所有命名空间
kubectl get namespaces
kubectl get ns

# 查看特定命名空间中的资源
kubectl get pods -n kube-system
kubectl get svc -n default

# 创建命名空间
kubectl create namespace dev
kubectl create namespace staging
kubectl create namespace production

# 删除命名空间（谨慎操作）
kubectl delete namespace dev

# 查看当前命名空间
kubectl config view --minify | grep namespace
```

### 2.2 命名空间资源配额

```bash
# 创建命名空间并设置资源配额
kubectl create namespace dev --dry-run=client -o yaml | kubectl apply -f -

# 查看命名空间详情
kubectl describe namespace production
```

## 第三章：Pod管理命令

### 3.1 Pod基础操作

```bash
# 查看Pod列表
kubectl get pods
kubectl get pods -o wide
kubectl get pods --all-namespaces

# 查看Pod详细信息
kubectl describe pod my-pod
kubectl describe pod my-pod -n default

# 查看Pod日志
kubectl logs my-pod
kubectl logs -f my-pod  # 跟踪日志
kubectl logs --tail=100 my-pod  # 查看最后100行
kubectl logs my-pod -c container-name  # 查看特定容器日志

# 进入Pod执行命令
kubectl exec -it my-pod -- /bin/bash
kubectl exec -it my-pod -c container-name -- /bin/sh

# 复制文件到Pod
kubectl cp /local/file my-pod:/remote/file
kubectl cp my-pod:/remote/file /local/file
```

### 3.2 Pod创建和删除

```bash
# 从YAML文件创建Pod
kubectl apply -f pod-definition.yaml

# 创建临时Pod（用于调试）
kubectl run debug-pod --image=busybox --rm -it --restart=Never -- /bin/sh

# 删除Pod
kubectl delete pod my-pod
kubectl delete pod my-pod -n default
kubectl delete -f pod-definition.yaml

# 强制删除Pod（绕过优雅终止）
kubectl delete pod my-pod --grace-period=0 --force
```

### 3.3 Pod调试和诊断

```bash
# 查看Pod事件
kubectl get events --sort-by=.metadata.creationTimestamp

# 查看Pod资源使用情况
kubectl top pod
kubectl top pod --all-namespaces

# 查看Pod中容器的端口
kubectl get pod my-pod -o jsonpath='{.spec.containers[*].ports}'

# 查看Pod的环境变量
kubectl exec my-pod -- env

# 端口转发（用于调试）
kubectl port-forward my-pod 8080:80
kubectl port-forward pod/my-pod 8080:80 -n default
```

## 第四章：Deployment管理

### 4.1 Deployment基础操作

```bash
# 查看Deployment列表
kubectl get deployments
kubectl get deploy

# 查看Deployment详情
kubectl describe deployment my-app

# 扩缩容操作
kubectl scale deployment my-app --replicas=3
kubectl scale deployment my-app --replicas=1 --current-replicas=3

# 更新Deployment
kubectl set image deployment/my-app app=my-app:v2
kubectl set env deployment/my-app ENV=production

# 查看Deployment历史
kubectl rollout history deployment/my-app
kubectl rollout history deployment/my-app --revision=2

# 回滚Deployment
kubectl rollout undo deployment/my-app
kubectl rollout undo deployment/my-app --to-revision=1
```

### 4.2 Deployment创建和管理

```bash
# 从YAML文件创建Deployment
kubectl apply -f deployment.yaml

# 创建Deployment（命令行方式）
kubectl create deployment nginx --image=nginx --replicas=3

# 查看Deployment状态
kubectl rollout status deployment/my-app

# 删除Deployment
kubectl delete deployment my-app
kubectl delete -f deployment.yaml
```

### 4.3 Deployment策略配置

```bash
# 滚动更新配置
kubectl patch deployment my-app -p '{"spec":{"strategy":{"rollingUpdate":{"maxSurge":1,"maxUnavailable":0}}}}'

# 查看Deployment策略
kubectl get deployment my-app -o yaml | grep -A 10 strategy
```

## 第五章：Service管理

### 5.1 Service基础操作

```bash
# 查看Service列表
kubectl get services
kubectl get svc

# 查看Service详情
kubectl describe service my-service

# 查看Service的端点
kubectl get endpoints my-service

# 测试Service连通性
kubectl run test-pod --image=busybox --rm -it --restart=Never -- wget -qO- http://my-service:80
```

### 5.2 Service创建和管理

```bash
# 创建Service（命令行方式）
kubectl expose deployment my-app --port=80 --target-port=8080 --type=ClusterIP
kubectl expose deployment my-app --port=80 --target-port=8080 --type=NodePort
kubectl expose deployment my-app --port=80 --target-port=8080 --type=LoadBalancer

# 创建LoadBalancer Service
kubectl create service loadbalancer my-app-lb --tcp=80:8080

# 删除Service
kubectl delete service my-service
```

### 5.3 Ingress管理

```bash
# 查看Ingress列表
kubectl get ingress

# 创建Ingress
kubectl create ingress my-app --rule="my-app.example.com/*=my-app:80"

# 查看Ingress详情
kubectl describe ingress my-app
```

## 第六章：ConfigMap和Secret管理

### 6.1 ConfigMap操作

```bash
# 查看ConfigMap列表
kubectl get configmaps
kubectl get cm

# 创建ConfigMap
kubectl create configmap app-config --from-file=config.yaml
kubectl create configmap app-config --from-env-file=env.txt
kubectl create configmap app-config --from-literal=key1=value1 --from-literal=key2=value2

# 查看ConfigMap内容
kubectl get configmap app-config -o yaml

# 删除ConfigMap
kubectl delete configmap app-config
```

### 6.2 Secret操作

```bash
# 查看Secret列表
kubectl get secrets

# 创建Secret
kubectl create secret generic my-secret --from-literal=password=secret123
kubectl create secret tls my-tls-secret --cert=path/to/cert --key=path/to/key

# 查看Secret内容
kubectl get secret my-secret -o yaml

# 解码Secret值
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 -d

# 删除Secret
kubectl delete secret my-secret
```

## 第七章：存储管理

### 7.1 PersistentVolume和PersistentVolumeClaim

```bash
# 查看PV和PVC
kubectl get pv
kubectl get pvc

# 创建PVC
kubectl create -f pvc-definition.yaml

# 查看PVC详细信息
kubectl describe pvc my-pvc

# 查看PV详细信息
kubectl describe pv my-pv
```

### 7.2 StorageClass

```bash
# 查看StorageClass
kubectl get storageclass
kubectl get sc

# 查看默认StorageClass
kubectl get storageclass -o jsonpath='{.items[?(@.metadata.annotations.storageclass\.kubernetes\.io/is-default-class=="true")].metadata.name}'
```

## 第八章：节点管理

### 8.1 节点基础操作

```bash
# 查看节点列表
kubectl get nodes
kubectl get nodes -o wide

# 查看节点详细信息
kubectl describe node worker-node-1

# 查看节点污点
kubectl get nodes -o json | jq '.items[] | {name: .metadata.name, taints: .spec.taints}'
```

### 8.2 节点维护操作

```bash
# 标记节点不可调度
kubectl cordon worker-node-1

# 取消节点不可调度标记
kubectl uncordon worker-node-1

# 排空节点
kubectl drain worker-node-1 --ignore-daemonsets --delete-emptydir-data

# 强制排空节点
kubectl drain worker-node-1 --ignore-daemonsets --delete-emptydir-data --force

# 查看节点状态
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}'
```

## 第九章：监控和诊断

### 9.1 资源监控

```bash
# 查看集群资源总览
kubectl top nodes
kubectl top pods --all-namespaces

# 查看命名空间资源使用
kubectl top namespace

# 查看节点上所有Pod的资源使用
kubectl top node worker-node-1 --containers

# 按命名空间查看资源使用
kubectl top pods -n kube-system
```

### 9.2 事件和日志

```bash
# 查看集群事件
kubectl get events --all-namespaces --sort-by=.metadata.creationTimestamp

# 查看命名空间事件
kubectl get events -n default --sort-by=.metadata.creationTimestamp

# 查看组件日志（需要kube-system权限）
kubectl logs -n kube-system kube-apiserver-master
kubectl logs -n kube-system kube-controller-manager-master
kubectl logs -n kube-system kube-scheduler-master

# 查看系统组件状态
kubectl get componentstatuses
kubectl get cs
```

### 9.3 资源配额和限制

```bash
# 查看资源配额
kubectl get resourcequota
kubectl get quota

# 查看限制范围
kubectl get limitrange
kubectl get limits

# 查看命名空间的资源使用情况
kubectl describe resourcequota -n default
```

## 第十章：高级操作和自动化

### 10.1 批量操作

```bash
# 批量删除所有Pod
kubectl delete pods --all -n default

# 批量缩放Deployment
kubectl scale deployment --all --replicas=0 -n default

# 批量更新镜像版本
kubectl set image deployment -l app=myapp app=myapp:v2 -n default

# 批量重启Pod
kubectl rollout restart deployment -l app=myapp -n default
```

### 10.2 标签选择器

```bash
# 使用标签选择Pod
kubectl get pods -l app=nginx
kubectl get pods -l tier=frontend,env=production

# 使用标签选择Service
kubectl get svc -l app=myapp

# 查看所有标签
kubectl get pods --show-labels

# 添加标签
kubectl label pods my-pod env=production

# 移除标签
kubectl label pods my-pod env-
```

### 10.3 污点和容忍

```bash
# 查看节点污点
kubectl get nodes -o json | jq '.items[].spec.taints'

# 为节点添加污点
kubectl taint nodes worker-node-1 dedicated=gpu:NoSchedule
kubectl taint nodes worker-node-1 dedicated=gpu:NoExecute

# 移除节点污点
kubectl taint nodes worker-node-1 dedicated=gpu:NoSchedule-

# 为Pod添加容忍
kubectl patch deployment my-app -p '{"spec":{"template":{"spec":{"tolerations":[{"key":"dedicated","operator":"Equal","value":"gpu","effect":"NoSchedule"}]}}}}'
```

## 第十一章：网络策略

### 11.1 网络策略管理

```bash
# 查看网络策略
kubectl get networkpolicies
kubectl get netpol

# 创建网络策略
kubectl create -f network-policy.yaml

# 查看网络策略详情
kubectl describe networkpolicy my-network-policy
```

## 第十二章：最佳实践和技巧

### 12.1 命令别名设置

```bash
# 添加到~/.bashrc或~/.zshrc
alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias ke='kubectl exec -it'
alias kc='kubectl create'
alias kdel='kubectl delete'
alias kdp='kubectl delete pod'
alias kdf='kubectl delete -f'

# 查看Pod的详细信息（扩展）
alias kdpods='kubectl get pods -o wide'
alias kdpodsall='kubectl get pods --all-namespaces -o wide'
```

### 12.2 常用技巧

```bash
# 快速查看Pod日志（最近10行）
kubectl logs --tail=10 my-pod

# 实时跟踪日志
kubectl logs -f --tail=0 my-pod

# 查看前一个容器的日志
kubectl logs my-pod --previous

# 查看多个Pod的日志
kubectl logs -l app=myapp --tail=100

# 快速进入Pod执行命令
kubectl run tmp-shell --rm -i --tty --image busybox -- /bin/sh

# 查看资源配置（YAML格式）
kubectl get deployment my-app -o yaml

# 导出资源配置
kubectl get deployment my-app -o yaml > my-app-deployment.yaml
```

### 12.3 性能优化

```bash
# 使用宽输出格式
kubectl get pods -o wide

# 使用JSONPath提取特定信息
kubectl get pods -o jsonpath='{.items[*].metadata.name}'

# 使用自定义列输出
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,IP:.status.podIP

# 过滤输出
kubectl get pods --field-selector status.phase=Running
```

## 第十三章：故障排查指南

### 13.1 常见问题排查

```bash
# Pod无法启动
kubectl describe pod my-pod
kubectl logs my-pod --previous
kubectl get events --sort-by=.metadata.creationTimestamp

# Service无法访问
kubectl get endpoints my-service
kubectl describe service my-service
kubectl run test-pod --image=busybox --rm -it --restart=Never -- wget -qO- http://my-service:80

# 节点不可用
kubectl describe node worker-node-1
kubectl get events --field-selector involvedObject.kind=Node,involvedObject.name=worker-node-1

# Deployment更新失败
kubectl rollout status deployment/my-app
kubectl rollout historykubectl rollout undo deployment deployment/my-app
/my-app
```

### 13.2 网络诊断

```bash
# 测试Pod间连通性
kubectl run test-pod --image=busybox --rm -it --restart=Never -- sh -c "wget -qO- http://my-service:80"

# 查看DNS解析
kubectl run test-pod --image=busybox --rm -it --restart=Never -- nslookup kubernetes.default

# 测试外部连通性
kubectl run test-pod --image=busybox --rm -it --restart=Never -- sh -c "ping 8.8.8.8"
```

## 结语

Kubernetes命令行工具（kubectl）是运维人员日常工作中最重要的工具之一。本文整理的命令覆盖了K8s日常运维的各个方面，从基础的集群管理到高级的网络策略，从简单的Pod操作到复杂的故障排查。

建议在实际使用中：
1. **熟记常用命令**：高频使用的命令要能够熟练掌握
2. **理解命令含义**：不仅要知道怎么用，更要理解为什么这样用
3. **实践练习**：在测试环境中多练习各种操作
4. **查看文档**：遇到不熟悉的命令时及时查阅官方文档
5. **安全第一**：生产环境中操作前要充分评估风险

掌握这些命令将大大提升您在Kubernetes环境下的工作效率和运维能力，为构建稳定可靠的容器化应用奠定坚实基础。

---

**延伸阅读推荐**：
- [Kubernetes官方文档](https://kubernetes.io/docs/)
- [kubectl命令参考](https://kubernetes.io/docs/reference/kubectl/)
- [Kubernetes最佳实践指南](https://kubernetes.io/docs/setup/best-practices/)

**实践建议**：
1. 在本地搭建Kubernetes测试环境进行练习
2. 建立命令速查表，便于日常工作参考
3. 定期复习和更新K8s知识，关注版本更新
4. 参与Kubernetes社区，学习更多实践经验