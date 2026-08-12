---
title: n8n安装教程：从入门到部署的完整指南
date: 2025-10-30T16:45:00+08:00
draft: false
categories:
  - 系统运维
tags:
  - n8n
  - 自动化工具
  - 工作流
  - Docker
  - Node.js
  - 安装教程
  - 服务器部署
  - 自托管
hidden: false
---

# n8n安装教程：从入门到部署的完整指南

## 1. 引言

n8n是一款强大的开源工作流自动化工具，它允许用户通过可视化界面连接各种应用和服务，创建自动化工作流。无论是简单的任务自动化还是复杂的业务流程集成，n8n都能胜任。本文将详细介绍n8n在不同环境下的安装方法、配置步骤以及部署最佳实践，帮助您快速搭建属于自己的工作流自动化平台。

## 2. n8n概述

n8n（"n-eight-n"）是一个可扩展的工作流自动化平台，具有以下特点：

- **可视化工作流设计**：通过拖拽方式创建复杂工作流
- **丰富的集成支持**：内置200多个节点，连接各种服务和API
- **高度可定制**：支持自定义节点和触发器
- **开源免费**：基于MIT许可证，可完全自托管
- **事件驱动**：支持定时触发、Webhook、API调用等多种触发方式
- **数据转换能力**：强大的数据处理和转换功能

## 3. 系统要求

在安装n8n之前，请确保您的系统满足以下要求：

### 3.1 硬件要求

- **CPU**：至少2核（推荐4核以上）
- **内存**：至少2GB RAM（推荐4GB以上）
- **存储**：至少1GB可用磁盘空间（取决于数据量和工作流复杂度）

### 3.2 软件要求

- **Node.js**：版本16.x或更高
- **npm**：与Node.js兼容的版本
- **数据库**（可选）：PostgreSQL 10.x或更高（默认使用SQLite）
- **Docker**（如果使用Docker安装）：最新稳定版

## 4. 安装方法

n8n提供多种安装方式，下面将详细介绍每种方式的安装步骤。

### 4.1 使用npm安装（适合开发环境）

这是最直接的安装方式，适合开发和测试环境：

```bash
# 安装n8n（全局安装）
npm install -g n8n

# 启动n8n
n8n start
```

启动成功后，您可以通过浏览器访问 `http://localhost:5678` 来使用n8n。

### 4.2 使用Docker安装（推荐生产环境）

使用Docker是部署n8n最简单且推荐的方式，特别是对于生产环境：

#### 4.2.1 基本Docker安装

```bash
# 拉取n8n镜像
docker pull n8nio/n8n

# 启动n8n容器
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

这个命令将启动n8n，并将配置文件和数据持久化到主机的`~/.n8n`目录。

#### 4.2.2 使用Docker Compose安装

对于更复杂的部署，推荐使用Docker Compose：

1. 创建一个`docker-compose.yml`文件：

```yaml
version: '3'
services:
  n8n:
    image: n8nio/n8n
    container_name: n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password  # 请更改此密码
      - N8N_HOST=${N8N_HOST:-localhost}
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://${N8N_HOST:-localhost}:5678/
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
    external: true  # 使用外部卷以确保数据持久化
```

2. 创建持久化卷并启动n8n：

```bash
# 创建Docker卷
docker volume create n8n_data

# 使用环境变量设置主机名（可选）
export N8N_HOST=your-domain.com

# 启动服务
docker-compose up -d
```

### 4.3 使用PostgreSQL数据库

对于生产环境，推荐使用PostgreSQL数据库而不是默认的SQLite：

#### 4.3.1 使用Docker Compose配置PostgreSQL

更新您的`docker-compose.yml`文件：

```yaml
version: '3'
services:
  postgres:
    image: postgres:13
    container_name: postgres
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=your_secure_password  # 请更改此密码
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -h localhost -U n8n']
      interval: 5s
      timeout: 5s
      retries: 5

  n8n:
    image: n8nio/n8n
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password  # 请更改此密码
      - N8N_HOST=${N8N_HOST:-localhost}
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://${N8N_HOST:-localhost}:5678/
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=your_secure_password  # 与上面PostgreSQL密码相同
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  n8n_data:
```

启动服务：

```bash
docker-compose up -d
```

### 4.4 在云服务器上安装

#### 4.4.1 在Ubuntu服务器上安装

```bash
# 更新系统包
apt update && apt upgrade -y

# 安装Node.js和npm
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt install -y nodejs

# 安装n8n
npm install -g n8n

# 创建n8n用户
adduser --disabled-password --gecos "" n8n

# 创建systemd服务文件
cat > /etc/systemd/system/n8n.service << EOF
[Unit]
Description=n8n workflow automation
Documentation=https://docs.n8n.io/
After=network.target

[Service]
Type=simple
User=n8n
ExecStart=/usr/local/bin/n8n start
Restart=on-failure
Environment="N8N_BASIC_AUTH_ACTIVE=true"
Environment="N8N_BASIC_AUTH_USER=admin"
Environment="N8N_BASIC_AUTH_PASSWORD=your_secure_password"
Environment="WEBHOOK_URL=https://your-domain.com/"
Environment="N8N_PROTOCOL=https"
Environment="N8N_HOST=your-domain.com"

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
systemctl daemon-reload
systemctl enable n8n
systemctl start n8n
```

## 5. 环境配置

n8n可以通过环境变量进行配置，以下是一些常用的配置选项：

### 5.1 基本配置

```bash
# 基本认证
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password

# 主机和端口配置
N8N_HOST=your-domain.com
N8N_PORT=5678
N8N_PROTOCOL=https

# Webhook URL配置（重要！用于接收外部触发）
WEBHOOK_URL=https://your-domain.com/

# 时区设置
GENERIC_TIMEZONE=Asia/Shanghai
TZ=Asia/Shanghai
```

### 5.2 数据库配置

```bash
# PostgreSQL配置
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=db_password

# SQLite配置（默认）
DB_TYPE=sqlite
DB_SQLITE_DATABASE_PATH=/home/node/.n8n/database.sqlite
```

### 5.3 高级配置

```bash
# 执行模式
EXECUTIONS_MODE=queue

# 队列模式配置
QUEUE_BULL_REDIS_HOST=localhost
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_PASSWORD=redis_password

# 并行执行限制
EXECUTIONS_PROCESS=5
EXECUTIONS_TIMEOUT=3600

# 禁用自动更新检查
N8N_DISABLE_UPDATE_CHECK=true

# 加密密钥（重要！请务必设置并安全保存）
N8N_ENCRYPTION_KEY=your_encryption_key
```

## 6. 安全加固

### 6.1 使用HTTPS

在生产环境中，强烈建议使用HTTPS：

#### 6.1.1 使用Nginx作为反向代理

```bash
# 安装Nginx
apt install -y nginx

# 安装Certbot（用于获取免费SSL证书）
apt install -y certbot python3-certbot-nginx

# 创建Nginx配置
cat > /etc/nginx/sites-available/n8n << EOF
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/

# 测试配置并重启Nginx
nginx -t
systemctl restart nginx

# 获取SSL证书
certbot --nginx -d your-domain.com
```

### 6.2 安全最佳实践

1. **设置强密码**：使用复杂的管理员密码
2. **限制访问IP**：通过防火墙规则限制访问
3. **定期备份**：定期备份n8n配置和数据库
4. **及时更新**：保持n8n版本最新，修复安全漏洞
5. **使用环境变量存储敏感信息**：避免硬编码密码等敏感信息

```bash
# 使用UFW限制访问IP
ufw allow from 192.168.1.0/24 to any port 5678
```

## 7. 备份与恢复

### 7.1 备份

#### 7.1.1 Docker部署的备份

```bash
# 停止n8n服务
docker-compose down

# 备份卷数据
docker run --rm -v n8n_data:/source -v $(pwd):/backup alpine tar -czf /backup/n8n_backup.tar.gz -C /source .

# 如果使用PostgreSQL，备份数据库
docker exec -t postgres pg_dumpall -c -U n8n > postgres_backup.sql

# 重启服务
docker-compose up -d
```

#### 7.1.2 直接安装的备份

```bash
# 停止n8n服务
systemctl stop n8n

# 备份n8n数据
cp -r /home/n8n/.n8n /backup/n8n_backup/$(date +%Y%m%d)

# 重启服务
systemctl start n8n
```

### 7.2 恢复

#### 7.2.1 Docker部署的恢复

```bash
# 停止服务
docker-compose down

# 恢复卷数据
docker run --rm -v n8n_data:/target -v $(pwd):/backup alpine sh -c "rm -rf /target/* && tar -xzf /backup/n8n_backup.tar.gz -C /target"

# 如果使用PostgreSQL，恢复数据库
docker exec -i postgres psql -U n8n < postgres_backup.sql

# 重启服务
docker-compose up -d
```

## 8. 常见问题解决

### 8.1 启动问题

**问题**：n8n无法启动，报错"Error: listen EADDRINUSE: address already in use :::5678"
**解决**：端口5678已被占用，更改端口或关闭占用端口的进程

```bash
# 查找占用端口的进程
lsof -i :5678

# 或更改n8n端口
export N8N_PORT=5679
docker run -p 5679:5679 ...
```

### 8.2 无法访问Web界面

**问题**：浏览器无法访问n8n Web界面
**解决**：
1. 检查防火墙设置
2. 确认n8n服务是否正常运行
3. 验证端口映射是否正确
4. 检查反向代理配置

```bash
# 检查n8n服务状态
systemctl status n8n  # 或
docker ps  # 对于Docker部署

# 检查防火墙设置
ufw status
```

### 8.3 数据库连接问题

**问题**：无法连接到PostgreSQL数据库
**解决**：
1. 确认PostgreSQL服务正在运行
2. 检查数据库凭据是否正确
3. 验证网络连接

```bash
# 测试数据库连接
docker exec -it n8n psql -h postgres -U n8n -d n8n -c "SELECT 1;"
```

## 9. 进阶使用

### 9.1 安装自定义节点

n8n支持安装社区开发的自定义节点：

```bash
# 在Docker容器中安装自定义节点
docker exec -it n8n npm install n8n-nodes-slack-advanced

# 重启容器以加载新节点
docker restart n8n
```

### 9.2 使用n8n CLI工具

n8n提供了命令行工具，方便管理工作流：

```bash
# 列出所有工作流
n8n workflow:list

# 导出工作流
n8n export:workflow --all --output=workflows.json

# 导入工作流
n8n import:workflow --input=workflows.json

# 执行工作流
n8n execute --workflow=workflowId
```

### 9.3 设置自动更新

创建一个简单的脚本来自动更新n8n：

```bash
#!/bin/bash
# 保存为 update_n8n.sh

docker-compose down
docker pull n8nio/n8n
docker-compose up -d

echo "n8n has been updated and restarted"
```

设置定时任务：

```bash
# 每月自动更新
0 0 1 * * /path/to/update_n8n.sh >> /var/log/n8n_update.log 2>&1
```

## 10. 总结

本文详细介绍了n8n的多种安装方法，包括使用npm、Docker以及在生产环境中的部署配置。无论您是想在开发环境中快速尝试，还是在生产环境中稳定部署，都可以根据本文的指南找到适合的安装方式。

安装n8n只是开始，接下来您可以探索n8n强大的工作流自动化能力，连接各种服务和应用，创建属于自己的自动化工作流。如果您在安装过程中遇到任何问题，请参考官方文档或社区论坛寻求帮助。

祝您使用n8n愉快，享受自动化带来的高效工作体验！