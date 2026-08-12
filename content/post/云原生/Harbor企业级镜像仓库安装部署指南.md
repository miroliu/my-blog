---
title: "Harbor 企业级镜像仓库安装部署指南"
date: 2025-12-14 10:00:00+08:00
categories: ["云原生"]
tags: ["Harbor", "Docker", "容器镜像", "镜像仓库", "DevOps", "运维实践"]
draft: false
---

Harbor 是由 VMware 开源的企业级容器镜像仓库，提供了基于角色的访问控制、镜像漏洞扫描、镜像签名、镜像复制等功能，是企业构建私有镜像仓库的首选方案之一。本文将从零开始，手把手教你在生产环境中部署一套完整的 Harbor 镜像仓库系统。

> 本教程基于 Harbor v2.9+，适用于 CentOS/RHEL 7/8/9、Ubuntu 20.04/22.04 等主流 Linux 发行版。

---

## 1. Harbor 简介：为什么选择 Harbor？

### 1.1 Harbor 的核心特性

相比于 Docker Registry 官方镜像仓库，Harbor 提供了更多企业级功能：

- **用户管理与 RBAC**：基于项目的角色权限控制，支持 LDAP/AD 集成
- **镜像扫描**：集成 Trivy/Clair 进行漏洞扫描，保障镜像安全
- **镜像签名与验证**：支持 Notary 内容信任机制
- **镜像复制**：支持多 Harbor 实例之间的镜像同步（跨数据中心）
- **审计日志**：完整的操作审计日志记录
- **配额管理**：限制项目存储空间和镜像数量
- **Web UI**：友好的图形化管理界面
- **Webhook**：镜像推送/拉取事件通知

### 1.2 典型应用场景

- **内网私有镜像仓库**：替代公有云镜像服务，保障数据安全
- **CI/CD 流水线**：作为构建产物的集中存储点
- **多集群镜像分发**：通过镜像复制功能，实现跨地域分发
- **镜像安全管控**：通过漏洞扫描和签名机制，降低供应链风险

---

## 2. 环境准备：硬件、软件与网络规划

### 2.1 硬件资源建议

根据规模不同，建议配置如下：

| 环境类型 | CPU   | 内存  | 磁盘           | 说明                      |
| -------- | ----- | ----- | -------------- | ------------------------- |
| 测试环境 | 2 核  | 4 GB  | 50 GB SSD      | 验证功能、学习使用        |
| 小型生产 | 4 核  | 8 GB  | 200 GB SSD     | 100 以内用户、日推送 < 50 |
| 中型生产 | 8 核  | 16 GB | 500 GB SSD     | 500 以内用户、高频推拉取  |
| 大型生产 | 16 核 | 32 GB | 2 TB SSD + NAS | 需要外挂存储、分布式部署  |

**重点提示**：

- **磁盘空间**是最关键的资源，镜像数据会快速增长，建议定期清理历史镜像
- **SSD 磁盘**推荐用于镜像元数据和数据库，提升访问速度
- 如需长期归档，可挂载 NAS 或对象存储作为后端

### 2.2 软件依赖

Harbor 基于 Docker Compose 部署，需要提前安装：

- **Docker**：v20.10+ 或更高版本
- **Docker Compose**：v2.0+ 或更高版本（推荐使用 Docker Compose V2）
- **OpenSSL**：用于生成 HTTPS 证书（如不使用外部证书）

操作系统要求：

- CentOS/RHEL 7.x 及以上
- Ubuntu 20.04 LTS 及以上
- Debian 10 及以上

### 2.3 网络与域名规划

在生产环境中，建议：

- **域名规划**：为 Harbor 分配一个独立域名，如 `harbor.example.com`
- **HTTPS 证书**：强烈建议配置 HTTPS（自签名或通过 Let's Encrypt 申请）
- **防火墙开放端口**：
  - `80`：HTTP（用于重定向到 HTTPS）
  - `443`：HTTPS（主要访问端口）
  - `4443`（可选）：Notary 服务端口

---

## 3. 安装 Docker 与 Docker Compose

### 3.1 安装 Docker（以 CentOS 7/8 为例）

```bash
# 卸载旧版本（如有）
sudo yum remove docker docker-client docker-client-latest \
  docker-common docker-latest docker-latest-logrotate \
  docker-logrotate docker-engine

# 安装依赖
sudo yum install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 官方仓库（或使用国内镜像加速）
sudo yum-config-manager --add-repo \
  https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker CE
sudo yum install -y docker-ce docker-ce-cli containerd.io

# 启动 Docker 并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 验证安装
docker --version
```

**Ubuntu 系统**可使用：

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
```

### 3.2 安装 Docker Compose V2

Docker Compose V2 已经作为 Docker CLI 插件集成，推荐直接使用：

```bash
# 如果 Docker 版本较新，可能已内置 Compose V2
docker compose version

# 如果没有，手动安装（以 v2.23.0 为例，请根据最新版本调整）
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

---

## 4. 下载与安装 Harbor

### 4.1 下载 Harbor 安装包

访问 [Harbor GitHub Releases](https://github.com/goharbor/harbor/releases)，选择最新稳定版本下载。

以 v2.9.0 为例（安装时请根据实际版本调整）：

```bash
# 下载在线安装包（推荐，体积小）
cd /opt
sudo wget https://github.com/goharbor/harbor/releases/download/v2.9.0/harbor-online-installer-v2.9.0.tgz

# 或下载离线安装包（内网环境推荐）
# sudo wget https://github.com/goharbor/harbor/releases/download/v2.9.0/harbor-offline-installer-v2.9.0.tgz

# 解压
sudo tar xvf harbor-online-installer-v2.9.0.tgz
cd harbor
```

### 4.2 配置 Harbor

Harbor 提供了一个配置模板 `harbor.yml.tmpl`，需要复制并修改：

```bash
sudo cp harbor.yml.tmpl harbor.yml
sudo vim harbor.yml
```

**关键配置项说明**：

```yaml
# Harbor 访问地址（必须修改）
hostname: harbor.example.com

# HTTP 配置（如果只用 HTTPS 可以注释掉）
http:
  port: 80

# HTTPS 配置（强烈建议启用）
https:
  port: 443
  certificate: /opt/harbor/cert/harbor.crt # 证书路径
  private_key: /opt/harbor/cert/harbor.key # 私钥路径

# Harbor 管理员初始密码（务必修改）
harbor_admin_password: Harbor12345

# 数据库配置
database:
  password: root123 # PostgreSQL 数据库密码
  max_idle_conns: 100
  max_open_conns: 900

# 数据存储路径（确保磁盘空间充足）
data_volume: /data

# 日志配置
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor

# （可选）启用 Trivy 镜像扫描
trivy:
  ignore_unfixed: false
  skip_update: false
  offline_scan: false
  insecure: false
```

### 4.3 生成 HTTPS 证书（自签名）

**生产环境建议使用正规 CA 签发的证书或 Let's Encrypt。**

如果用于测试，可以生成自签名证书：

```bash
# 创建证书目录
sudo mkdir -p /opt/harbor/cert
cd /opt/harbor/cert

# 生成 CA 私钥
sudo openssl genrsa -out ca.key 4096

# 生成 CA 证书
sudo openssl req -x509 -new -nodes -sha512 -days 3650 \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=IT/CN=harbor.example.com" \
  -key ca.key \
  -out ca.crt

# 生成 Harbor 私钥
sudo openssl genrsa -out harbor.key 4096

# 生成证书签名请求（CSR）
sudo openssl req -sha512 -new \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=example/OU=IT/CN=harbor.example.com" \
  -key harbor.key \
  -out harbor.csr

# 生成 x509 v3 扩展文件
cat > v3.ext <<-EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1=harbor.example.com
DNS.2=harbor
IP.1=192.168.1.100
EOF

# 使用 v3.ext 生成 Harbor 证书
sudo openssl x509 -req -sha512 -days 3650 \
  -extfile v3.ext \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -in harbor.csr \
  -out harbor.crt

# 清理临时文件
sudo rm -f harbor.csr v3.ext ca.srl
```

**重要**：如果使用自签名证书，需要在 Docker 客户端信任该证书（见后文）。

### 4.4 运行安装脚本

```bash
cd /opt/harbor

# 安装 Harbor（不带 Notary 和 Trivy）
sudo ./install.sh

# 或启用所有组件（推荐）
sudo ./install.sh --with-trivy --with-chartmuseum
```

安装过程中会自动：

1. 拉取必要的 Docker 镜像
2. 生成配置文件
3. 启动 Harbor 各组件容器

等待几分钟，看到类似输出即表示成功：

```
✔ ----Harbor has been installed and started successfully.----
```

### 4.5 验证安装

```bash
# 查看 Harbor 容器运行状态
sudo docker-compose ps

# 应该看到类似输出（所有服务 State 为 Up）
NAME                COMMAND                  SERVICE             STATUS              PORTS
harbor-core         "/harbor/entrypoint.…"   core                running (healthy)
harbor-db           "/docker-entrypoint.…"   postgresql          running (healthy)
harbor-jobservice   "/harbor/entrypoint.…"   jobservice          running (healthy)
harbor-log          "/bin/sh -c /usr/loc…"   log                 running (healthy)
harbor-portal       "nginx -g 'daemon of…"   portal              running (healthy)
nginx               "nginx -g 'daemon of…"   proxy               running (healthy)   0.0.0.0:80->8080/tcp, 0.0.0.0:443->8443/tcp
redis               "redis-server /etc/r…"   redis               running (healthy)
registry            "/home/harbor/entryp…"   registry            running (healthy)
registryctl         "/home/harbor/start.…"   registryctl         running (healthy)
trivy-adapter       "/home/scanner/entry…"   trivy-adapter       running (healthy)
```

---

## 5. 配置 Docker 客户端信任 Harbor 证书

### 5.1 为什么需要信任证书？

如果使用自签名证书，Docker 客户端默认不信任，会报错：

```
Error response from daemon: Get "https://harbor.example.com/v2/": x509: certificate signed by unknown authority
```

需要在每台 Docker 客户端主机上配置信任。

### 5.2 配置方法（Linux）

```bash
# 将 Harbor CA 证书复制到系统信任目录
sudo mkdir -p /etc/docker/certs.d/harbor.example.com
sudo scp root@harbor-server:/opt/harbor/cert/ca.crt \
  /etc/docker/certs.d/harbor.example.com/ca.crt

# 重启 Docker
sudo systemctl restart docker
```

### 5.3 配置方法（macOS）

```bash
# 将证书导入系统钥匙串
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain ca.crt

# 重启 Docker Desktop
```

### 5.4 配置方法（Windows）

1. 将 `ca.crt` 导入到「受信任的根证书颁发机构」
2. 重启 Docker Desktop

---

## 6. 使用 Harbor：登录、推送和拉取镜像

### 6.1 Web UI 登录

在浏览器访问：`https://harbor.example.com`

- **默认用户名**：`admin`
- **默认密码**：在 `harbor.yml` 中配置的 `harbor_admin_password`

登录后可以：

- 创建项目（Project）
- 添加用户并分配角色
- 查看镜像仓库、标签、扫描结果
- 配置镜像复制策略

### 6.2 Docker 客户端登录

```bash
docker login harbor.example.com
# 输入用户名和密码
```

### 6.3 推送镜像

```bash
# 以推送 nginx:latest 为例

# 1. 从公有仓库拉取镜像
docker pull nginx:latest

# 2. 重新打标签（格式：harbor地址/项目名/镜像名:标签）
docker tag nginx:latest harbor.example.com/library/nginx:latest

# 3. 推送到 Harbor
docker push harbor.example.com/library/nginx:latest
```

### 6.4 拉取镜像

```bash
docker pull harbor.example.com/library/nginx:latest
```

### 6.5 在 Kubernetes 中使用 Harbor

创建 Secret：

```bash
kubectl create secret docker-registry harbor-secret \
  --docker-server=harbor.example.com \
  --docker-username=admin \
  --docker-password=Harbor12345 \
  --docker-email=admin@example.com
```

在 Pod/Deployment 中引用：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: test-pod
spec:
  containers:
    - name: nginx
      image: harbor.example.com/library/nginx:latest
  imagePullSecrets:
    - name: harbor-secret
```

---

## 7. Harbor 常见运维操作

### 7.1 启动/停止 Harbor

```bash
cd /opt/harbor

# 停止
sudo docker-compose down

# 启动
sudo docker-compose up -d

# 重启
sudo docker-compose restart
```

### 7.2 查看日志

```bash
# 查看所有服务日志
sudo docker-compose logs -f

# 查看特定服务日志
sudo docker-compose logs -f core
sudo docker-compose logs -f registry
```

### 7.3 备份 Harbor 数据

**关键数据位置**：

- **数据库**：PostgreSQL 容器数据卷（`/data/database`）
- **镜像数据**：Registry 存储（`/data/registry`）
- **配置文件**：`/opt/harbor/harbor.yml`

备份脚本示例：

```bash
#!/bin/bash
BACKUP_DIR="/backup/harbor-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

# 停止 Harbor
cd /opt/harbor
sudo docker-compose down

# 备份数据目录
sudo tar czf $BACKUP_DIR/harbor-data.tar.gz /data

# 备份配置
sudo cp /opt/harbor/harbor.yml $BACKUP_DIR/

# 启动 Harbor
sudo docker-compose up -d

echo "Backup completed: $BACKUP_DIR"
```

### 7.4 升级 Harbor

```bash
# 1. 备份现有数据（见上文）

# 2. 下载新版本安装包
cd /opt
sudo wget https://github.com/goharbor/harbor/releases/download/v2.10.0/harbor-online-installer-v2.10.0.tgz
sudo tar xvf harbor-online-installer-v2.10.0.tgz

# 3. 停止旧版本
cd /opt/harbor
sudo docker-compose down

# 4. 迁移配置文件（新版本可能有配置项变化）
cd /opt/harbor-new
sudo cp /opt/harbor/harbor.yml ./

# 5. 运行数据库迁移（如需要）
# （新版本通常会自动迁移）

# 6. 重新安装
sudo ./install.sh --with-trivy --with-chartmuseum

# 7. 验证升级
sudo docker-compose ps
```

**升级前务必查看官方 Release Notes 了解变更内容！**

---

## 8. 生产环境最佳实践

### 8.1 高可用架构

单节点 Harbor 存在单点故障风险，生产环境建议：

- **数据库高可用**：使用外部 PostgreSQL 集群（如 Patroni + Etcd）
- **存储高可用**：镜像数据使用共享存储（NFS、Ceph RBD、S3）
- **负载均衡**：多个 Harbor 实例前端部署 Nginx/HAProxy
- **镜像复制**：跨地域部署多套 Harbor，配置镜像同步

### 8.2 存储优化

- **定期清理**：删除不再使用的镜像和标签，执行垃圾回收（GC）

```bash
# 在 Web UI 中配置定期 GC 任务，或手动执行：
docker exec -it harbor-jobservice /bin/bash
# 在容器内执行 GC
```

- **对象存储后端**：将 Registry 存储配置为 S3/OSS/MinIO，降低本地存储压力

修改 `harbor.yml`：

```yaml
storage_service:
  s3:
    accesskey: <access_key>
    secretkey: <secret_key>
    region: us-west-1
    bucket: harbor-images
```

### 8.3 安全加固

- **强密码策略**：定期修改 `admin` 和数据库密码
- **LDAP/AD 集成**：统一用户认证
- **镜像扫描**：启用 Trivy 自动扫描，阻止高危镜像
- **内容信任（Notary）**：启用镜像签名验证
- **审计日志**：定期导出审计日志到 SIEM 系统

### 8.4 监控与告警

推荐使用 Prometheus + Grafana 监控 Harbor：

- Harbor 官方提供 Prometheus Exporter
- 监控指标：镜像推拉取速率、存储使用率、容器健康状态
- 告警规则：磁盘空间不足、服务异常、扫描发现高危漏洞

---

## 9. 常见问题排查

### 9.1 无法访问 Harbor Web UI

**检查步骤**：

```bash
# 1. 检查防火墙
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=443/tcp --permanent
sudo firewall-cmd --reload

# 2. 检查 Nginx 容器状态
sudo docker-compose ps
sudo docker-compose logs nginx

# 3. 检查域名解析
ping harbor.example.com
```

### 9.2 Docker 推送镜像报错

**错误示例**：

```
denied: requested access to the resource is denied
```

**解决方法**：

- 确认已在 Harbor Web UI 中创建了项目（如 `library`）
- 确认用户有该项目的 `Developer` 或 `Maintainer` 权限
- 检查镜像名称格式是否正确：`harbor.example.com/项目名/镜像名:标签`

### 9.3 Harbor 磁盘空间不足

```bash
# 查看磁盘使用
df -h /data

# 执行垃圾回收（需要先停止 Harbor）
cd /opt/harbor
sudo docker-compose down
sudo docker run -it --name gc --rm --volumes-from registry \
  goharbor/registry-photon:v2.9.0 \
  garbage-collect --dry-run /etc/registry/config.yml

# 确认无误后，执行真正的 GC（去掉 --dry-run）
sudo docker run -it --name gc --rm --volumes-from registry \
  goharbor/registry-photon:v2.9.0 \
  garbage-collect /etc/registry/config.yml

sudo docker-compose up -d
```

### 9.4 证书过期

自签名证书默认有效期 10 年，如已过期：

```bash
# 重新生成证书（参考 4.3 节）
# 更新 harbor.yml 中的证书路径
# 重启 Harbor
cd /opt/harbor
sudo docker-compose down
sudo docker-compose up -d
```

---

## 10. 总结：从安装到投产的完整清单

最后，梳理一遍完整的安装投产流程：

1. **环境准备**
   - ✅ 准备服务器（至少 4C8G、100GB 磁盘）
   - ✅ 安装 Docker 和 Docker Compose
   - ✅ 规划域名、申请或生成 HTTPS 证书
2. **安装 Harbor**
   - ✅ 下载安装包并解压
   - ✅ 修改 `harbor.yml`（hostname、密码、存储路径）
   - ✅ 运行 `install.sh`
3. **配置客户端**
   - ✅ 信任 Harbor 证书（自签名时必须）
   - ✅ 测试 `docker login` 和镜像推拉取
4. **基础配置**
   - ✅ 创建项目、添加用户、分配权限
   - ✅ 启用镜像扫描（Trivy）
   - ✅ 配置定期垃圾回收
5. **投产前检查**
   - ✅ 配置监控告警（Prometheus）
   - ✅ 制定备份策略（定期备份数据库和镜像数据)
   - ✅ 编写应急预案（服务异常、磁盘满等）
6. **持续运维**
   - ✅ 定期升级 Harbor 版本
   - ✅ 关注安全公告，及时打补丁
   - ✅ 定期审计日志，清理无用镜像

按照这条路径操作，你就能在生产环境中搭建一套稳定可靠的 Harbor 镜像仓库系统。  
如果在实际部署过程中遇到问题，可以参考官方文档或社区论坛获取帮助。祝你部署顺利！
