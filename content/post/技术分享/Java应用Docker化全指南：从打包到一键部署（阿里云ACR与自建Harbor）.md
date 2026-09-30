---
title: "Java应用Docker化全指南：从打包到一键部署（阿里云ACR + 自建Harbor）"
description: "手把手教你在本地将Spring Boot应用打包成Docker镜像，推送到阿里云容器镜像服务ACR和自建Harbor仓库，然后用一条Docker命令完成生产环境部署。包含Dockerfile编写、多阶段构建、镜像加速、Harbor配置等实战内容。"
slug: "java-spring-boot-docker-packaging-acr-harbor-one-command-deploy"
date: 2026-07-18T19:00:00+08:00
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["技术分享"]
tags:
  [
    "Docker",
    "Java",
    "Spring Boot",
    "容器化",
    "阿里云ACR",
    "Harbor",
    "容器镜像",
    "镜像仓库",
    "多阶段构建",
    "一键部署",
    "CI/CD",
    "Dockerfile",
    "Maven",
    "Gradle",
    "容器编排",
    "镜像加速",
  ]
---

# Java应用Docker化全指南：从打包到一键部署（阿里云ACR + 自建Harbor）

## 前言

把Java应用跑起来很简单——本地装JDK，命令行跑`java -jar app.jar`，齐活。

但生产环境完全不是这么回事。一台服务器上可能跑着十几个不同语言、不同版本、不同依赖的应用，它们之间互相"抢地盘"（端口冲突、库版本冲突、环境变量冲突），运维人员每次部署都像拆炸弹。

**Docker** 解决的就是这个问题——把应用和它的整个运行环境（操作系统、JDK、依赖库、配置文件）一起打包成一个**镜像**，镜像在任何装了Docker的机器上都能原封不动地运行。

这篇文章，我用一个最常见的Spring Boot应用做例子，覆盖完整的实战流程：

```
本地写Java代码
    → 打包成Docker镜像
    → 推送到阿里云ACR容器镜像仓库
    → 或推送到自建Harbor仓库
    → 服务器上一条命令拉取并运行
```

无论你用哪种仓库，**最后部署的命令都是一样的**。

---

## 一、准备工作：环境确认

### 1.1 需要安装的软件

在开始之前，确保你的机器上安装了以下软件：

```bash
# 检查 Docker 是否安装（版本 >= 18.09）
docker --version
# Docker version 26.1.3, build 97e0e27

# 检查 Docker 是否正常运行
docker ps
# CONTAINER ID   IMAGE   COMMAND   CREATED   STATUS   PORTS   NAMES
# （无输出表示正常运行，空容器列表）

# 检查 Maven 或 Gradle（根据你的项目选择）
mvn --version
# Apache Maven 3.9.6 ...

# 或检查 Gradle
gradle --version
```

如果没有安装，以下是各系统安装方式：

**Windows / macOS**：下载 [Docker Desktop](https://www.docker.com/products/docker-desktop/) 安装包，一键安装。

**Linux（Ubuntu/Debian）**：

```bash
# 一行命令安装 Docker
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun

# 当前用户加入 docker 组（免 sudo）
sudo usermod -aG docker $USER
newgrp docker
```

**Linux（CentOS/RHEL）**：

```bash
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 1.2 一个简单的Spring Boot应用

为了演示，我准备了一个最简化的Spring Boot REST API项目。项目结构如下：

```
demo-app/
├── pom.xml
├── src/
│   └── main/
│       ├── java/com/example/demo/
│       │   ├── DemoApplication.java
│       │   └── HelloController.java
│       └── resources/
│           └── application.yml
└── Dockerfile
```

**pom.xml**（Maven配置）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>demo-app</artifactId>
    <version>1.0.0</version>
    <name>demo-app</name>
    <description>Docker Demo Spring Boot Application</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

**DemoApplication.java**（启动类）：

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

**HelloController.java**（REST接口）：

```java
package com.example.demo;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api")
public class HelloController {

    @Value("${app.version:1.0.0}")
    private String version;

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Docker! Version: " + version;
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}
```

**application.yml**：

```yaml
server:
  port: 8080

app:
  version: "1.0.0"

spring:
  application:
    name: demo-app
```

先在本地确认应用能跑通：

```bash
cd demo-app
mvn clean package -DskipTests
java -jar target/demo-app-1.0.0.jar
```

浏览器访问 `http://localhost:8080/api/hello`，看到 `Hello from Docker! Version: 1.0.0` 即成功。

---

## 二、编写Dockerfile：多阶段构建

### 2.1 最简单的Dockerfile

Dockerfile 是构建镜像的"配方"。先看一个最基础的版本：

```dockerfile
# 基础镜像：包含 JDK 17
FROM eclipse-temurin:17-jre

# 工作目录
WORKDIR /app

# 复制打包好的 jar 文件
COPY target/demo-app-1.0.0.jar app.jar

# 暴露端口
EXPOSE 8080

# 启动命令
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# 在项目根目录构建镜像
docker build -t demo-app:1.0.0 .

# 查看镜像
docker images | grep demo-app
# REPOSITORY   TAG      IMAGE ID       CREATED        SIZE
# demo-app     1.0.0    a3f8e2c1d9b4   10秒前        234MB

# 本地运行测试
docker run -d --name demo-test -p 8080:8080 demo-app:1.0.0
curl http://localhost:8080/api/hello
# Hello from Docker! Version: 1.0.0

# 清理测试容器
docker stop demo-test && docker rm demo-test
```

这个 Dockerfile 可以工作，但它有几个问题：

1. **镜像体积大**：包含了整个 JRE（Java Runtime），而 `eclipse-temurin:17-jre` 是精简版，已经比较小了，但如果用 `17-jdk` 会更大
2. **没有分离源码和产物**：源码被留在了镜像里（通过 `COPY . .` 会带入）
3. **每次重新构建整个镜像**：没有利用 Docker 的层缓存，代码改一行就要重装依赖

### 2.2 多阶段构建：标准生产实践

多阶段构建（Multi-Stage Build）是生产环境的标准做法。它用**两个 FROM 指令**，第一阶段负责编译打包，第二阶段只复制编译产物：

```dockerfile
# ============================================
# 阶段一：构建阶段（Maven/JDK 环境）
# ============================================
# 使用 Maven 官方镜像，包含 Maven + JDK 17
FROM maven:3.9-eclipse-temurin-17 AS builder

# 设置工作目录
WORKDIR /build

# 先复制 pom.xml（利用 Docker 层缓存：依赖不会每次重新下载）
COPY pom.xml .

# 下载依赖（只在 pom.xml 变化时重新执行）
RUN mvn dependency:go-offline -B

# 复制源码
COPY src ./src

# 打包（跳过测试，加快构建）
RUN mvn clean package -DskipTests

# ============================================
# 阶段二：运行阶段（只保留 JRE 和 jar 文件）
# ============================================
# 使用 JRE 镜像（比 JDK 镜像小很多）
FROM eclipse-temurin:17-jre AS runtime

WORKDIR /app

# 从构建阶段复制打包好的 jar 文件
COPY --from=builder /build/target/demo-app-1.0.0.jar app.jar

# 运行用户（非 root）运行应用（安全最佳实践）
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:8080/api/health || exit 1

# 启动命令
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**多阶段构建的优势**：

```
传统方式（单阶段）：
  源码 → Maven 编译 → 所有依赖 + JDK + 源码 → 镜像（~500MB）
          ↑
          包含编译工具、Maven、源码（暴露安全风险）

多阶段构建（两阶段）：
  阶段一：源码 → Maven 编译 → 输出 jar（~200MB 构建容器）
  阶段二：只复制 jar + JRE → 最终镜像（~234MB）

最终镜像只包含运行时需要的东西，不包含：
  - Maven 工具
  - 编译依赖（node_modules、.m2 缓存等）
  - 源代码
  - JDK 开发工具
```

### 2.3 .dockerignore：避免复制不需要的文件

在项目根目录创建 `.dockerignore` 文件，排除不需要打包进镜像的内容：

```
# Git 版本控制
.git
.gitignore

# Maven 打包产物（不需要，构建时重新生成）
target/

# IDE 配置
.idea/
*.iml
.vscode/

# 构建日志
*.log
logs/

# 测试文件
*Test.java
*Tests.java
src/test/

# 其他
README.md
Dockerfile*
docker-compose*
*.md
```

这和 `.gitignore` 的逻辑完全一样，目的是减少 `COPY` 指令传输的文件量，加快构建速度。

### 2.4 Jib：不用写Dockerfile的构建方式

如果你连 Dockerfile 都不想写，**Google Jib** 是另一个优秀的选择——它直接集成到 Maven/Gradle 中，用插件构建镜像：

**Maven 方式（只需在 pom.xml 添加插件）**：

```xml
<plugin>
    <groupId>com.google.cloud.tools</groupId>
    <artifactId>jib-maven-plugin</artifactId>
    <version>3.4.3</version>
    <configuration>
        <from>
            <image>eclipse-temurin:17-jre</image>
        </from>
        <to>
            <!-- 镜像地址，构建后直接推到仓库 -->
            <image>registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app</image>
            <tags>
                <tag>1.0.0</tag>
                <tag>latest</tag>
            </tags>
        </to>
        <container>
            <jvmFlags>
                <jvmFlag>-Xms256m</jvmFlag>
                <jvmFlag>-Xmx512m</jvmFlag>
            </jvmFlags>
            <ports>
                <port>8080</port>
            </ports>
        </container>
    </configuration>
</plugin>
```

```bash
# 一条命令构建并推送到远程仓库
mvn compile jib:build

# 或者只构建本地镜像（不推送）
mvn compile jib:dockerBuild
```

Jib 自动处理多阶段构建、层拆分（按依赖 / 资源 / 类分层），构建出的镜像支持 Docker 层缓存，部署时**只下载变更的层**，极大加快部署速度。

---

## 三、镜像标签与版本管理策略

镜像标签（Tag）不是简单的版本号，它反映了镜像的来源、版本和用途：

```bash
# 常用标签命名规范
镜像名:版本号
镜像名:latest        # 始终指向最新版本（不推荐生产使用）
镜像名:1.0.0         # 语义化版本
镜像名:1.0.0-hotfix # 带后缀的版本
镜像名:20260718      # 日期版本
镜像名:git-abcd1234  # Git commit SHA（CI/CD 自动生成）

# 示例
demo-app:1.0.0          # 正式版本
demo-app:1.0.1-beta     # 测试版本
demo-app:1.0.1          # 最新修复版本
```

**语义化版本（Semantic Versioning）**：

```
版本格式：主版本.次版本.修订版本

1.0.0 → 首次发布
1.0.1 → 修复 Bug，不改功能
1.1.0 → 新增功能，向后兼容
2.0.0 → 破坏性变更，不兼容旧版本

常见后缀：
  -alpha：内部测试版
  -beta：公开测试版
  -rc：候选发布版（Release Candidate）
  -stable：稳定版
```

---

## 四、推送到阿里云容器镜像服务ACR

### 4.1 阿里云ACR简介

阿里云容器镜像服务（Container Registry，简称ACR）是阿里云提供的企业级Docker镜像仓库服务，支持**容器镜像**和**Helm Chart**的托管、推送、拉取。

**ACR的两个版本**：

| 版本 | 说明 | 费用 |
|------|------|------|
| **ACR 个人版** | 基础功能，单个仓库，500MB存储 | 免费 |
| **ACR 企业版** | 企业级，高可用，VPC内网访问，镜像安全扫描 | 按量付费/包年 |

### 4.2 创建镜像仓库

**第一步：开通阿里云ACR服务**

登录阿里云控制台 → 搜索"容器镜像服务" → 点击"创建实例"（按提示操作）。

**第二步：创建命名空间**

命名空间（Namespace）是仓库的分组，类似Maven的groupId：

```
命名空间格式建议：
  公司域名反写 + 产品名
  com.example.demo
  或
  团队名-项目名
  myteam-app
```

**第三步：创建镜像仓库**

```
仓库名称：demo-app
命名空间：your-namespace
仓库类型：私有
代码源：不导入代码（手动推送）
```

创建完成后，你会看到仓库地址，格式为：

```
registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app
```

### 4.3 配置凭证并推送

**第一步：获取Registry密码**

阿里云控制台 → 容器镜像服务 → 访问凭证 → 设置独立登录密码。

**第二步：Docker登录**

```bash
# 方式一：命令行登录（交互式）
docker login registry.cn-hangzhou.aliyuncs.com
# Username: your-namespace
# Password: ********
# Login Succeeded

# 方式二：非交互式登录（CI/CD场景）
echo "your-password" | docker login registry.cn-hangzhou.aliyuncs.com -u your-namespace --password-stdin
```

> **注意**：阿里云ACR支持使用阿里云AccessKey登录，不需要单独创建Docker Registry密码。也可以在容器镜像服务控制台的"访问凭证"中生成专用的Registry密码。

**第三步：给镜像打标签**

```bash
# 镜像ID可以通过 docker images 查看
# 格式：registry地址/命名空间/镜像名:版本号
docker tag demo-app:1.0.0 registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app:1.0.0
docker tag demo-app:1.0.0 registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app:latest
```

**第四步：推送镜像**

```bash
# 推送到阿里云ACR
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app:1.0.0
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app:latest

# 推送过程示例
# docker.io/library/demo-app:1.0.0: Resolving "demo-app" 
# ...分层上传...
# 1.0.0: digest: sha256:abc123... size: 1234
```

**推送完成后，在阿里云控制台可以看到镜像列表**。

### 4.4 阿里云镜像加速器

如果从Docker Hub拉取官方镜像速度慢，可以配置阿里云镜像加速器：

```bash
# 创建 Docker 配置目录（如果没有）
sudo mkdir -p /etc/docker

# 配置镜像加速器（每个账号的加速地址不同，需在阿里云控制台获取）
sudo tee /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": ["https://your-id.mirror.aliyuncs.com"]
}
EOF

# 重启 Docker 服务
sudo systemctl daemon-reload
sudo systemctl restart docker

# 验证加速器配置
docker info | grep "Registry Mirrors"
# Registry Mirrors:
#  https://your-id.mirror.aliyuncs.com/
```

### 4.5 一键构建：从源代码到镜像

ACR支持**容器镜像服务ACR EE的ACR Build**，直接从源码构建镜像，你甚至不需要在本地安装Docker：

```
流程：
  Git 仓库（GitHub/GitLab/阿里云Code）→ 触发构建 → ACR Build 自动编译 → 镜像推送到仓库

优势：
  - 本地无需安装 Docker
  - 云端构建环境标准化
  - 自动支持多架构构建（AMD64 + ARM64）
```

配置方法：阿里云控制台 → 容器镜像服务 → 构建 → 绑定代码仓库 → 设置 Dockerfile 路径和构建规则。

---

## 五、推送到自建Harbor仓库

### 5.1 Harbor是什么

**Harbor** 是 VMware 开源的企业级 Docker Registry 项目，由 CNCF 孵化，是私有镜像仓库的首选方案。

相比直接使用 Docker Registry（开源但功能简单），Harbor 提供了：

```
- Web UI（可视化管理界面）
- 镜像安全扫描（Trivy / Clair）
- 镜像签名与内容信任（Notary）
- 角色权限管理（RBAC）
- 镜像复制（跨数据中心同步）
- LDAP/AD 集成（企业统一认证）
- 镜像清理策略（自动删除旧镜像）
```

### 5.2 安装Harbor

Harbor 支持多种安装方式，生产环境推荐使用 **Docker Compose** 或 **Helm**（部署在 Kubernetes 上）。

**方式一：Docker Compose 安装（适用于2-10台主机的规模）**

```bash
# 下载 Harbor 安装包（选择稳定版本）
wget https://github.com/goharbor/harbor/releases/download/v2.10.2/harbor-online-installer-v2.10.2.tgz

# 解压
tar -xzf harbor-online-installer-v2.10.2.tgz
cd harbor

# 复制并编辑配置文件
cp harbor.yml.tmpl harbor.yml
vim harbor.yml
```

**harbor.yml 核心配置项**：

```yaml
# hostname：访问 Harbor 的域名或 IP
hostname: harbor.your-domain.com

# http：非 HTTPS 配置（仅供内网测试使用）
# 生产环境务必配置 HTTPS
http:
  port: 80

# https：生产环境必须配置
# 需要提前准备好 SSL 证书
https:
  port: 443
  certificate: /your/cert/path/your-domain.com.crt
  private_key: /your/cert/path/your-domain.com.key

# 数据库配置
database:
  password: ChangeThisPassword123!

# Admin 初始密码
harbor_admin_password: ChangeThisAdminPassword123!

# 镜像存储路径
image_storage_path: /data/harbor/registry

# 是否有LDAP（企业环境建议开启）
# ldap_url: ldap://ldap.your-domain.com
# ldap_searchdn: cn=admin,dc=your-domain,dc=com
# ldap_searchpw: YourLDAPPassword
# ldap_basedn: dc=your-domain,dc=com
```

```bash
# 安装 Harbor（会自动下载所需 Docker 镜像）
sudo ./install.sh

# 安装带 Trivy 安全扫描的版本
sudo ./install.sh --with-trivy

# 安装完整版本（包含所有插件）
sudo ./install.sh --with-notary --with-trivy --with-clair
```

**方式二：Helm 安装（适用于 Kubernetes 环境）**

```bash
# 添加 Harbor Helm 仓库
helm repo add harbor https://helm.goharbor.io
helm repo update

# 安装 Harbor 到 Kubernetes
helm install harbor harbor/harbor \
  --namespace harbor \
  --create-namespace \
  --set expose.ingress.hosts.core=harbor.your-domain.com \
  --set expose.ingress.hosts.notary=harbor.your-domain.com \
  --set expose.tls.enabled=false \
  --set persistence.persistentVolumeClaim.registry.size=100Gi \
  --set adminPassword=YourSecurePassword123
```

### 5.3 配置Harbor

**创建项目（Project）**：

Harbor 中的"项目"类似于阿里云ACR的"命名空间"，用于隔离不同团队或应用的镜像：

```
Harbor 项目类型：
  - 私有项目（Private）：只有被授权的用户可以拉取/推送
  - 公有项目（Public）：任何人都可以拉取，但推送仍需授权
  - 系统项目（System）：用于镜像复制（Replication）
```

通过 Harbor Web UI 创建：

```
登录地址：http://harbor.your-domain.com（默认 admin / Harbor12345）
→ 新建项目 → 项目名称：demo → 访问级别：私有 → 确定
```

**创建用户**：

```
Harbor Web UI → 系统管理 → 用户管理 → 创建用户
用户名：developer
邮箱：developer@your-domain.com
密码：******
```

**分配权限**：

```
项目 → demo → 成员 → 添加成员 → 选择角色（开发者/维护者/管理员）
```

### 5.4 推送镜像到Harbor

```bash
# 第一步：配置 Docker（添加 Harbor 为可信仓库）
# 如果 Harbor 使用的是自签名证书（测试环境），需要把证书加入 Docker 信任列表

# 方法一：修改 /etc/docker/daemon.json
sudo tee /etc/docker/daemon.json <<EOF
{
  "insecure-registries": ["harbor.your-domain.com"],
  "registry-mirrors": ["https://your-id.mirror.aliyuncs.com"]
}
EOF

sudo systemctl restart docker

# 方法二（推荐生产使用）：导入真实证书
sudo cp your-domain.com.crt /etc/docker/certs.d/harbor.your-domain.com/ca.crt
sudo systemctl restart docker

# 第二步：登录 Harbor
docker login harbor.your-domain.com
# Username: admin
# Password: Harbor12345

# 第三步：打标签
docker tag demo-app:1.0.0 harbor.your-domain.com/demo/demo-app:1.0.0
docker tag demo-app:1.0.0 harbor.your-domain.com/demo/demo-app:latest

# 第四步：推送
docker push harbor.your-domain.com/demo/demo-app:1.0.0

# 第五步：验证
# 访问 http://harbor.your-domain.com → 查看项目 demo → 可以看到镜像列表
```

### 5.5 Harbor 高可用与灾备

生产环境 Harbor 推荐部署多个副本，通过 **PostgreSQL 主从复制 + Redis 共享会话 + 共享存储（NFS/Ceph）** 实现高可用。

```
Harbor 高可用架构：
  ┌─────────────────────────────────────────────────┐
  │                    负载均衡器                      │
  │              (Nginx / F5 / SLB)                  │
  └────────────────────┬───────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
    ┌─────────┐   ┌─────────┐   ┌─────────┐
    │ Harbor  │   │ Harbor  │   │ Harbor  │
    │  Node 1 │   │  Node 2 │   │  Node 3 │
    └────┬────┘   └────┬────┘   └────┬────┘
         │              │              │
         └──────────────┼──────────────┘
                        ↓
         ┌──────────────────────────────┐
         │  PostgreSQL 主从复制          │
         │  Redis 共享会话               │
         │  NFS/对象存储 共享镜像存储      │
         └──────────────────────────────┘
```

---

## 六、生产服务器一键部署

### 6.1 核心部署命令

无论镜像在阿里云ACR还是自建Harbor，**部署命令都是完全一样的**。只需要替换镜像地址即可。

```bash
# 一行命令：拉取镜像并启动容器
docker run -d \
  --name demo-app \
  -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=10.0.1.100 \
  -e DB_PORT=3306 \
  -e DB_NAME=demo \
  -e DB_USER=demo_user \
  --restart=unless-stopped \
  --log-opt max-size=100m \
  --log-opt max-file=5 \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app:1.0.0

# 参数说明：
# -d                      后台运行（detached）
# --name demo-app         容器名称
# -p 8080:8080            端口映射（主机端口:容器端口）
# -e                      设置环境变量（Spring Boot 读取）
# --restart=unless-stopped  容器退出时自动重启（服务器重启也自动恢复）
# --log-opt               日志轮转：单个日志文件最大100MB，保留5个文件
```

### 6.2 一键部署脚本

把部署命令写成一个 shell 脚本，方便复用和版本管理：

**deploy.sh**：

```bash
#!/bin/bash
# ============================================
# 一键部署脚本 - Java Docker 应用
# 用法：./deploy.sh [镜像地址] [版本]
# 示例：./deploy.sh registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app 1.0.0
# ============================================

set -e  # 遇到错误立即退出

# 默认配置
IMAGE_REGISTRY="${1:-registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app}"
VERSION="${2:-latest}"
CONTAINER_NAME="demo-app"
HOST_PORT="8080"
CONTAINER_PORT="8080"

# 完整镜像地址
FULL_IMAGE="${IMAGE_REGISTRY}:${VERSION}"

echo "========================================"
echo "  Java Docker 一键部署脚本"
echo "========================================"
echo "  镜像地址：${FULL_IMAGE}"
echo "  容器名称：${CONTAINER_NAME}"
echo "  端口映射：${HOST_PORT}:${CONTAINER_PORT}"
echo "========================================"

# 1. 登录镜像仓库（根据镜像地址自动判断）
if [[ "$IMAGE_REGISTRY" == *"aliyuncs.com"* ]]; then
    echo "[1/6] 登录阿里云ACR..."
    docker login --username="${ALIYUN_USERNAME:-your-namespace}" \
        registry.cn-hangzhou.aliyuncs.com || true
elif [[ "$IMAGE_REGISTRY" == *"harbor"* ]]; then
    echo "[1/6] 登录 Harbor..."
    docker login --username="${HARBOR_USERNAME:-admin}" \
        "$(echo $IMAGE_REGISTRY | awk -F/ '{print $1}')" || true
fi

# 2. 拉取最新镜像
echo "[2/6] 拉取镜像 ${FULL_IMAGE}..."
docker pull "${FULL_IMAGE}"

# 3. 停止并删除旧容器（如果存在）
echo "[3/6] 清理旧容器..."
docker stop "${CONTAINER_NAME}" 2>/dev/null || true
docker rm "${CONTAINER_NAME}" 2>/dev/null || true

# 4. 启动新容器
echo "[4/6] 启动新容器..."
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST="${DB_HOST:-localhost}" \
  -e DB_PORT="${DB_PORT:-3306}" \
  -e DB_NAME="${DB_NAME:-demo}" \
  -e DB_USER="${DB_USER:-root}" \
  -e DB_PASSWORD="${DB_PASSWORD}" \
  --restart=unless-stopped \
  --log-opt max-size=100m \
  --log-opt max-file=5 \
  --memory=512m \
  --memory-reservation=256m \
  "${FULL_IMAGE}"

# 5. 检查容器健康状态
echo "[5/6] 检查容器启动状态..."
sleep 5
if docker ps | grep -q "${CONTAINER_NAME}"; then
    echo "  ✓ 容器启动成功"
else
    echo "  ✗ 容器启动失败，查看日志："
    docker logs "${CONTAINER_NAME}"
    exit 1
fi

# 6. 显示部署结果
echo "[6/6] 部署完成！"
echo ""
echo "  应用地址：http://localhost:${HOST_PORT}/api/hello"
echo "  健康检查：http://localhost:${HOST_PORT}/api/health"
echo ""
echo "  常用命令："
echo "  - 查看日志：docker logs -f ${CONTAINER_NAME}"
echo "  - 进入容器：docker exec -it ${CONTAINER_NAME} /bin/sh"
echo "  - 停止应用：docker stop ${CONTAINER_NAME}"
echo "  - 重启应用：docker restart ${CONTAINER_NAME}"
echo "========================================"
```

```bash
# 给脚本加执行权限
chmod +x deploy.sh

# 部署到阿里云ACR
./deploy.sh registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app 1.0.0

# 部署到自建Harbor
./deploy.sh harbor.your-domain.com/demo/demo-app 1.0.0

# 部署最新版本
./deploy.sh registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app latest
```

### 6.3 生产环境一键部署（Systemd 管理）

在生产服务器上，用 **Systemd** 管理容器比直接 `docker run` 更安全——Systemd 会在服务器重启后自动拉起容器，并记录日志到系统日志：

**/etc/systemd/system/demo-app.service**：

```ini
[Unit]
Description=Java Demo Application
Documentation=https://github.com/your-org/demo-app
After=network-online.target
Wants=network-online.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes

# 环境变量文件（敏感信息放这里，不写在 service 文件里）
EnvironmentFile=/etc/demo-app/env.conf

ExecStartPre=-/usr/bin/docker stop demo-app
ExecStartPre=-/usr/bin/docker rm demo-app
ExecStart=/usr/bin/docker run \
    --name demo-app \
    -p 8080:8080 \
    --env-file /etc/demo-app/env.conf \
    --restart=unless-stopped \
    --log-opt max-size=100m \
    --log-opt max-file=5 \
    --memory=512m \
    --memory-reservation=256m \
    --cpus=1.0 \
    --read-only \
    --tmpfs /tmp:rw,noexec,nosuid,size=64m \
    "${IMAGE_REGISTRY}:${IMAGE_TAG}"

ExecStop=/usr/bin/docker stop -t 30 demo-app
ExecStop=/usr/bin/docker rm demo-app

# 安全设置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true

[Install]
WantedBy=multi-user.target
```

**/etc/demo-app/env.conf**（环境变量，存放数据库密码等敏感信息）：

```
SPRING_PROFILES_ACTIVE=prod
DB_HOST=10.0.1.100
DB_PORT=3306
DB_NAME=demo
DB_USER=demo_user
DB_PASSWORD=YourSecureDBPassword123!
```

```bash
# 部署步骤
sudo cp demo-app.service /etc/systemd/system/
sudo cp env.conf /etc/demo-app/env.conf
sudo chmod 600 /etc/demo-app/env.conf  # 限制权限

# 设置镜像地址和版本（可以用脚本自动修改）
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start demo-app

# 设置开机自启
sudo systemctl enable demo-app

# 查看服务状态
sudo systemctl status demo-app

# 查看日志
sudo journalctl -u demo-app -f
```

### 6.4 更新版本：一条命令搞定

当有新版本需要发布时，只需要改一行配置，然后重启服务：

```bash
# 编辑版本配置
sudo vim /etc/demo-app/env.conf
# 修改 IMAGE_TAG=1.0.1

# 重启服务（自动拉取新镜像、重建容器）
sudo systemctl restart demo-app

# 查看是否升级成功
curl http://localhost:8080/api/hello
# 应该返回 "Hello from Docker! Version: 1.0.1"

# 查看升级日志
sudo journalctl -u demo-app -n 20 --no-pager
```

---

## 七、数据持久化与配置管理

### 7.1 数据持久化：数据不能丢

Java应用如果有本地文件存储（如上传文件、日志），必须配置 **Docker 数据卷**，否则容器删除后数据就没了：

```bash
# 创建数据卷
docker volume create demo-app-data

# 启动时挂载数据卷
docker run -d \
  --name demo-app \
  -v demo-app-data:/app/data \
  -p 8080:8080 \
  registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app:1.0.0

# 查看数据卷信息
docker inspect demo-app --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```

**生产环境推荐**：使用云存储或分布式存储（如阿里云 OSS、MinIO）存储应用数据，而不是本地数据卷。

### 7.2 使用配置中心

生产环境的配置不应该写死在镜像里。推荐使用 **Spring Cloud Config** 或 **Nacos** 配置中心：

```yaml
# application.yml 中配置 Nacos
spring:
  cloud:
    nacos:
      config:
        server-addr: nacos-service:8848
        namespace: production
        group: DEFAULT_GROUP
        file-extension: yaml
      discovery:
        server-addr: nacos-service:8848
```

配置中心的好处：**改配置不需要重新打包镜像，不需要重启容器**，配置变更自动推送到应用。

### 7.3 敏感信息管理

**不要把密码、密钥写在 Dockerfile 或 env.conf 中**：

```bash
# 错误做法（密码写在代码里）
ENV DB_PASSWORD=MySecretPassword123

# 正确做法一：运行时通过环境变量传入
docker run -e DB_PASSWORD="$(cat /run/secrets/db_password)" ...

# 正确做法二：使用 Docker Secrets（Swarm 模式）
echo "MySecretPassword123" | docker secret create db_password -
docker service create --secret db_password ...

# 正确做法三：使用 Vault（HashiCorp Vault）管理密钥
# 应用从 Vault API 获取密钥，不在环境中明文存储
```

---

## 八、最佳实践与常见问题

### 8.1 镜像优化的黄金法则

```
镜像体积：越小越好
  ✓ 多阶段构建（只保留运行时文件）
  ✓ 使用 alpine / distroless 等精简基础镜像
  ✓ 利用 .dockerignore 排除无关文件
  ✓ Java 17+ 推荐使用 jlink 自定义 JRE（只包含需要的模块）

构建速度：越快越好
  ✓ .dockerignore 减少 COPY 范围
  ✓ COPY 指令顺序：先复制 pom.xml，再复制源码
  ✓ 利用 Docker 层缓存（不变的内容放前面）

安全性：越严越好
  ✓ 非 root 用户运行容器
  ✓ 只读根文件系统（--read-only）
  ✓ 丢弃所有 Linux 能力（--cap-drop ALL）
  ✓ 不使用 latest 标签（每次指定明确版本）
  ✓ 定期扫描镜像漏洞（Trivy / Clair）
```

### 8.2 Java应用容器化的特殊注意事项

```bash
# JVM 内存设置：容器有内存限制时，JVM 需要感知到
# Java 10+ 自动检测容器内存限制（推荐）
docker run -m 512m ... demo-app:1.0.0
# JVM 会自动把 -Xmx 设置为容器内存的 25-50%

# Java 8/9 需要手动指定
docker run -m 512m \
  -e JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0" \
  demo-app:1.0.0

# 禁止 JVM 自动检测（某些场景需要）
-e JAVA_OPTS="-XX:-UseContainerSupport"

# GC 优化：容器化环境推荐使用 G1 GC
-e JAVA_OPTS="-XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# 时区问题：Java 默认用 UTC，生产环境需要设置时区
-e TZ=Asia/Shanghai
# 或在 Dockerfile 中：
RUN ln -snf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```

### 8.3 常见报错与解决

**错误一：镜像拉取失败（image not found）**

```bash
# 错误信息：Error response from daemon: pull access denied
# 解决：检查镜像地址和登录凭证
docker images | grep demo-app
docker login <registry-url>
```

**错误二：端口被占用（port already allocated）**

```bash
# 错误信息：Error starting userland proxy: listen tcp4 0.0.0.0:8080: bind: address already in use
# 解决：查看占用端口的进程
lsof -i:8080
# 或换一个端口
docker run -p 8081:8080 ...
```

**错误三：容器启动后立即退出（exited with code 0）**

```bash
# 查看容器日志，找具体原因
docker logs demo-app

# 常见原因：
# - Java 应用启动失败（端口冲突、数据库连不上）
# - 健康检查失败（HEALTHCHECK 指令）
# - 权限问题（挂载的目录没有写权限）
```

**错误四：内存溢出（OOMKilled）**

```bash
# 查看容器状态
docker stats --no-stream demo-app
# 或
docker inspect demo-app | grep -A 5 OOMKilled

# 解决：增加内存限制或优化 JVM 堆大小
docker run -m 1g --memory-swap=1g ...
```

### 8.4 从Docker到Kubernetes

当应用数量增加，需要多个容器协调工作时，单台服务器的 Docker 就力不从心了。**Kubernetes（K8s）** 是容器编排的事实标准：

```
Docker（单主机管理）：
  docker run -d demo-app:1.0.0
  只能管理一台服务器上的容器

Kubernetes（多主机编排）：
  kubectl apply -f deployment.yaml
  自动管理跨多台服务器的数百个容器副本

一个 deployment.yaml 示例（Kubernetes 部署描述文件）：
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-app
  template:
    metadata:
      labels:
        app: demo-app
    spec:
      containers:
      - name: demo-app
        image: registry.cn-hangzhou.aliyuncs.com/your-namespace/demo-app:1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "prod"
---
apiVersion: v1
kind: Service
metadata:
  name: demo-app
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
  selector:
    app: demo-app
```

如果你已经有了打包好的 Docker 镜像，迁移到 Kubernetes 几乎不需要修改任何代码——**Docker 镜像是 Kubernetes 的通用交付格式**。

---

## 结语

回顾整个流程，我们完成了一条完整链路：

```
代码 → Maven 打包 → Docker 多阶段构建 → 推送仓库 → 一键部署

本地开发（Docker Desktop）
  → 阿里云 ACR（云端托管）
  → 自建 Harbor（私有可控）
  → 生产服务器（Systemd 管理）
```

Docker 解决的不仅是"在我机器上能跑"的问题，它让**应用的交付从'给源代码让人部署'变成了'给一个镜像让人运行'"**。镜像在哪里构建、推到哪里、部署到哪台机器——这些都可以灵活选择，唯一不变的是：**一次构建，到处运行**。

记住这条黄金法则：

```
镜像要小 → 多阶段构建，alpine 基础镜像
构建要快 → .dockerignore + 层缓存
运行要稳 → 非 root 用户 + 资源限制 + 健康检查
配置要灵 → 环境变量 + 配置中心
```

祝你的Java应用容器化之路顺利！

---

**相关推荐阅读**：

- [Docker与容器化：从基础到实践](https://blog.example.com/docker-containerization)
- [Kubernetes核心概念与实战指南](https://blog.example.com/kubernetes-core-concepts)
- [n8n安装教程：从入门到部署的完整指南](https://blog.example.com/n8n-installation-guide)
