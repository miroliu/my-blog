---
title: "PostgreSQL 二进制安装实战：从零搭建生产级数据库（含运维命令与SQL速查）"
description: "不依赖yum/apt，纯二进制方式安装PostgreSQL。从EDB下载、初始化数据库集群、配置远程连接、systemd服务，到日常运维命令、SQL实战、流复制和备份恢复，一篇讲透。适合CentOS/Ubuntu生产环境。"
slug: "postgresql-binary-install-ops-sql"
date: 2026-08-09T22:50:00+08:00
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["数据库", "PostgreSQL"]
tags:
  [
    "PostgreSQL",
    "PG",
    "二进制安装",
    "tar.gz",
    "EDB",
    "运维",
    "systemd",
    "SQL",
    "psql",
    "CentOS",
    "Ubuntu",
    "pgAdmin",
  ]
---

# PostgreSQL 二进制安装实战：从零搭建生产级数据库（含运维命令与SQL速查）

## 前言

PostgreSQL（简称 PG）号称"世界上最先进的开源关系型数据库"，在以下场景里几乎是无可争议的首选：

- **地理空间数据**（PostGIS 扩展，吊打 MySQL）
- **JSON/JSONB 半结构化数据**（比 MySQL 的 JSON 强至少 3 倍）
- **复杂查询 / 数据分析**（优化器极强）
- **金融级严格事务**（SQL 标准遵循度最高）
- **海量数据 + 高并发写入**（CynosDB、TiDB 都有 PG 的影子）

但 PostgreSQL 的安装对新手不太友好——尤其是二进制方式，跟 MySQL 的"tar 一解压就跑"思路不一样。

**为什么选二进制安装？**

| 方式       | 优缺点                                               |
| ---------- | ---------------------------------------------------- |
| yum/apt    | 版本受发行版限制；依赖多；卸载麻烦                   |
| 源码编译   | 灵活可定制，但编译时间 30 分钟+，报错排查困难        |
| **二进制** | ✅ **官方提供**（EDB）；预编译好；解压即用；路径统一 |

本文用 **EDB 提供的 PostgreSQL 16 二进制包**作为演示（也是 PostgreSQL 官方推荐的方式），覆盖：

- 二进制安装（解压→建用户→初始化→配置）
- systemd 服务化
- 远程连接 + 用户管理
- 运维常用命令
- SQL 实战（CRUD + 高级特性）
- 流复制（主备）
- 备份恢复（pg_dump / pg_basebackup / WAL归档）

---

## 一、安装前准备

### 1.1 下载二进制包

**EDB 官方下载地址**：https://www.enterprisedb.com/download-postgresql-binaries

```bash
# 在页面里选择：
# PostgreSQL 16 (当前生产主流 LTS 版本)
# Linux x86-64
# 下载得到：
# postgresql-16.4-1-linux-x64-binaries.tar.gz
```

> 也可以从 PostgreSQL 官网（https://www.postgresql.org/download/linux/）选 "Linux x86-64" → "Binary Installer" 跳转。
>
> **为什么不从源码编译？** 编译 PG 主要为了加扩展（比如 PostGIS），普通安装直接用二进制又快又稳。

### 1.2 系统环境检查

```bash
# 查看系统版本
cat /etc/os-release
uname -a

# 检查依赖（PG二进制包是动态链接，需要这些库）
ldd --version | head -1      # glibc 2.17+ 一般没问题
```

### 1.3 创建 postgres 用户和目录

```bash
# 创建运行用户（PG 强制不能用 root 启动）
groupadd -g 999 postgres
useradd -u 999 -g postgres -d /home/postgres -s /bin/bash postgres
passwd postgres
# 输入两次密码（pg 用户的系统密码，可选）

# PG 二进制安装默认路径（EDB 包约定）
mkdir -p /opt/postgresql                     # 软件目录（解压后这里）
mkdir -p /opt/postgresql/data                # 数据目录（默认）
mkdir -p /var/log/postgresql                 # 日志
mkdir -p /var/run/postgresql                 # pid 文件

# 给目录授权
chown -R postgres:postgres /opt/postgresql
chown -R postgres:postgres /var/log/postgresql
chown -R postgres:postgres /var/run/postgresql
```

### 1.4 清理旧环境

```bash
# 如果之前装过
yum remove -y postgresql* 2>/dev/null
apt-get purge -y postgresql* 2>/dev/null
find / -name "postgresql.conf" 2>/dev/null
rm -rf /var/lib/pgsql /opt/postgresql   # 谨慎！
```

---

## 二、正式安装

### 2.1 解压安装包

```bash
# 上传包到服务器
scp postgresql-16.4-1-linux-x64-binaries.tar.gz root@192.168.1.100:/opt/

# 解压（EDB的二进制包，目录结构是 postgresql/xxx）
cd /opt
tar -xvf postgresql-16.4-1-linux-x64-binaries.tar.gz
ls
# pgsql/      ← 实际内容在这！

# 移动到 /opt/postgresql
mv pgsql postgresql
ls /opt/postgresql/
# bin  doc  include  installer  lib  share  pgAdmin4
```

**目录结构说明**：

```
/opt/postgresql/
├── bin/                # 可执行文件：psql、pg_ctl、initdb、postgres、pg_dump...
├── doc/                # 文档
├── include/            # C 头文件（开发用）
├── installer/          # 安装器相关
├── lib/                # 共享库
├── share/              # 数据（如 timezone、字符集）
└── pgAdmin4/           # 官方GUI工具（Web版）
```

### 2.2 配置环境变量

```bash
cat >> /etc/profile << 'EOF'

# PostgreSQL Environment
export PG_HOME=/opt/postgresql
export PGDATA=/opt/postgresql/data
export PATH=$PATH:$PG_HOME/bin
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$PG_HOME/lib
EOF

source /etc/profile

# 验证
psql --version
# psql (PostgreSQL) 16.4
```

### 2.3 初始化数据库集群

**核心步骤**：`initdb` 命令会生成一个全新的数据库集群（PG 中"一个集群 = 一套数据库 + 一套配置 + 一个端口"）。

```bash
# 切换到 postgres 用户（PG 严禁 root 运行 initdb）
su - postgres

# 设置数据目录
export PGDATA=/opt/postgresql/data

# 初始化（-E 字符集，--locale 区域，-U 指定超级用户）
initdb \
  -E UTF8 \
  --locale=C \
  -U postgres \
  -W \
  --data-checksums \
  /opt/postgresql/data

# -W 会提示输入 postgres 用户密码
# --data-checksums 开启数据校验（强烈推荐，生产必开）

# 成功后看到：
# Success. You can now start the database server using:
#     pg_ctl -D /opt/postgresql/data -l logfile start
```

> **关键区别（vs MySQL）**：
>
> - PG 的"数据库集群"（database cluster）= PG 服务的整个实例
> - MySQL 的"实例"= 一个 mysqld 进程
> - PG 一个端口服务可以有**多个 database**（db1、db2、db3...），但都属于同一个集群

> **PG 早期版本（10 以下）叫 `initdb` 之前要用 `postgres` 用户**；10+ 直接 `initdb` 即可。

### 2.4 配置监听和远程连接

```bash
# 切换到 postgres 用户
su - postgres

# 修改监听地址（默认只监听 127.0.0.1）
vi /opt/postgresql/data/postgresql.conf
# 修改以下几行（默认是被注释的）

# 监听地址
listen_addresses = '*'                # 监听所有
port = 5432                           # PG 默认端口

# 连接数
max_connections = 200                 # 最大连接数

# 内存
shared_buffers = 2GB                  # 共享内存，建议物理内存的25%
effective_cache_size = 6GB            # 优化器估算的可用缓存

# WAL
wal_level = replica                   # 流复制必开
max_wal_size = 2GB
min_wal_size = 512MB

# 归档（备份恢复用）
archive_mode = on
archive_command = 'cp %p /opt/postgresql/archive/%f'   # 简单拷贝，生产用更复杂的

# 日志
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000     # 慢查询阈值（毫秒）

# 创建归档目录
mkdir -p /opt/postgresql/archive
chown postgres:postgres /opt/postgresql/archive
```

**配置 pg_hba.conf（客户端认证）**：

```bash
vi /opt/postgresql/data/pg_hba.conf

# 在文件末尾追加（或修改原有的 IPv4 local connections 那行）

# TYPE  DATABASE        USER            ADDRESS                 METHOD
# 允许所有地址用密码连接所有库
host    all             all             0.0.0.0/0               md5
host    replication     replicator      192.168.1.0/24          md5    # 流复制专用

# 上面那行的意思是：
#   - host：TCP/IP连接（不是local socket）
#   - all：所有数据库
#   - all：所有用户
#   - 0.0.0.0/0：所有 IP（生产建议限制网段，如 192.168.1.0/24）
#   - md5：密码认证（最常见的加密方式）
```

> **认证方式速查**：
>
> - `trust`：无条件放行（仅本地测试用）
> - `md5`：MD5加密密码（兼容老客户端）
> - `scram-sha-256`：更安全的密码加密（PG 10+ 默认推荐）
> - `peer`：操作系统用户必须同名（仅 local）

### 2.5 启动 PostgreSQL

```bash
# 方式一：pg_ctl（最简单）
su - postgres
pg_ctl -D /opt/postgresql/data -l /var/log/postgresql/server.log start

# 方式二：postgres 直接启动（调试用）
postgres -D /opt/postgresql/data &

# 查看是否启动
ps aux | grep postgres | grep -v grep
# postgres 12345  ... /opt/postgresql/bin/postgres -D /opt/postgresql/data

# 查看端口
netstat -tlnp | grep 5432
# tcp  0  0  0.0.0.0:5432  0.0.0.0:*  LISTEN  12345/postgres

# 测试连接
psql -U postgres -h 127.0.0.1
# Password for user postgres:
# postgres=#    ← 进入命令行
```

### 2.6 配置 systemd 服务（生产推荐）

```bash
cat > /usr/lib/systemd/system/postgresql.service << 'EOF'
[Unit]
Description=PostgreSQL database server
Documentation=man:postgres(1)
After=network.target

[Service]
Type=forking
User=postgres
Group=postgres

# 环境变量
Environment=PGDATA=/opt/postgresql/data
Environment=PG_OOM_ADJUST_FILE=/proc/self/oom_score_adj
Environment=PG_OOM_ADJUST_VALUE=0

# 启动
ExecStart=/opt/postgresql/bin/pg_ctl -D ${PGDATA} -l /var/log/postgresql/server.log start

# 停止（带超时，等待30秒）
ExecStop=/opt/postgresql/bin/pg_ctl -D ${PGDATA} -m fast stop

# 重启
ExecReload=/opt/postgresql/bin/pg_ctl -D ${PGDATA} reload

# 优雅停机超时
TimeoutStopSec=30

# 重启策略
Restart=on-failure
RestartSec=10

# 资源限制
LimitNOFILE=65535
LimitNPROC=65535

[Install]
WantedBy=multi-user.target
EOF

# 重载并启动
systemctl daemon-reload
systemctl enable postgresql
systemctl start postgresql
systemctl status postgresql
```

### 2.7 首次登录配置

```bash
# 用 postgres 用户登录（数据库超级用户）
psql -U postgres -h 127.0.0.1
# 输入密码（在 initdb 时设置的）

# 修改 postgres 密码（生产建议）
postgres=# ALTER USER postgres WITH PASSWORD 'YourNewPass123!';
postgres=# \q

# 改 pg_hba.conf 把 postgres 的连接方式改成 md5
# local   all             postgres                                md5
```

### 2.8 防火墙和远程连接

```bash
# CentOS 7
firewall-cmd --zone=public --add-port=5432/tcp --permanent
firewall-cmd --reload

# Ubuntu
ufw allow 5432/tcp

# 另一台机器测试
psql -h 192.168.1.100 -U postgres -d postgres
```

---

## 三、用户与权限管理（PG 跟 MySQL 差很多）

PG 的权限体系比 MySQL 复杂得多，但更精细。

### 3.1 角色（Role）的概念

**关键认知**：PG 里没有"用户"和"组"的区别，统一叫**角色（role）**：

```sql
-- 创建登录角色（可以登录）
CREATE ROLE appuser LOGIN PASSWORD 'AppPass123!';

-- 创建组角色（不能登录，用来继承权限）
CREATE ROLE app_group;

-- 把 appuser 加进组
GRANT app_group TO appuser;

-- 查看所有角色
\du
SELECT rolname, rolsuper, rolcanlogin FROM pg_roles;
```

### 3.2 权限层级

PG 的权限分**多级**：

| 层级   | 例子                      | SQL 操作                                 |
| ------ | ------------------------- | ---------------------------------------- |
| 数据库 | `GRANT ALL ON DATABASE x` | CREATE, CONNECT, TEMPORARY               |
| 模式   | `GRANT ON SCHEMA x`       | USAGE, CREATE                            |
| 表     | `GRANT ON TABLE x`        | SELECT, INSERT, UPDATE, DELETE, TRUNCATE |
| 列     | `GRANT (col) ON TABLE x`  | SELECT(col), UPDATE(col)                 |
| 序列   | `GRANT ON SEQUENCE x`     | USAGE, SELECT, UPDATE                    |
| 函数   | `GRANT ON FUNCTION x`     | EXECUTE                                  |

### 3.3 实战：完整权限配置

```sql
-- 1. 建业务库
CREATE DATABASE shop OWNER appuser;

-- 2. 切到新库
\c shop

-- 3. 建模式（schema，PG的"命名空间"）
CREATE SCHEMA app AUTHORIZATION appuser;

-- 4. 给角色授权
GRANT CONNECT ON DATABASE shop TO appuser;
GRANT USAGE, CREATE ON SCHEMA app TO appuser;

-- 5. 让 appuser 可以操作表（默认表 owner 自动有全权）
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA app TO appuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA app TO appuser;

-- 6. 未来自动授权
ALTER DEFAULT PRIVILEGES IN SCHEMA app
GRANT ALL ON TABLES TO appuser;

-- 7. 收回权限
REVOKE ALL ON DATABASE shop FROM PUBLIC;     -- 重要！PG默认PUBLIC有CONNECT
```

### 3.4 常用 psql 命令（终端内）

```bash
# 连接
psql -h HOST -p PORT -U USER -d DB

# 进入psql后：
\l                  # 列出所有数据库
\c dbname           # 切换数据库
\dn                 # 列出所有模式(schema)
\dt                 # 列出当前库的所有表
\dt schema.*        # 列出指定schema的所有表
\d tablename        # 查看表结构
\d+ tablename       # 查看表结构（含注释、大小）
\di                 # 查看索引
\dv                 # 查看视图
\df                 # 查看函数
\du                 # 查看角色
\dx                 # 查看扩展
\q                  # 退出
\?                  # 查看所有命令
\conninfo           # 查看当前连接信息
\timing             # 开启计时（SQL执行时间）
```

---

## 四、运维常用命令（生产必备）

### 4.1 服务管理

```bash
# 启停
systemctl start postgresql
systemctl stop postgresql
systemctl restart postgresql
systemctl reload postgresql         # 平滑重载配置（不停服务）

# pg_ctl 命令（不需要 sudo）
pg_ctl start -D $PGDATA -l /var/log/postgresql/server.log
pg_ctl stop  -D $PGDATA -m fast    # fast = 等连接断开，immediate = 立即
pg_ctl reload -D $PGDATA
pg_ctl status -D $PGDATA

# 查看版本
psql --version
postgres --version

# 查看启动时间
psql -U postgres -c "SELECT pg_postmaster_start_time();"
```

### 4.2 连接与查询

```bash
# 本地连接
psql -U postgres
psql -U postgres -d shop

# 远程连接
psql -h 192.168.1.100 -U appuser -d shop

# 单条命令模式
psql -U postgres -d shop -c "SELECT COUNT(*) FROM users;"
psql -U postgres -d shop -c "SELECT * FROM users LIMIT 10;"

# 多个SQL
psql -U postgres -d shop <<EOF
SELECT 1;
SELECT 2;
\q
EOF

# 登录时直接执行脚本
psql -U postgres -d shop -f /path/script.sql
```

### 4.3 数据库与表空间

```sql
-- 查看所有库
\l
SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database;

-- 创建库
CREATE DATABASE mydb OWNER appuser ENCODING 'UTF8' LC_COLLATE 'en_US.UTF-8';

-- 删库（生产慎用）
DROP DATABASE mydb;

-- 查看表空间
\db
SELECT spcname, pg_size_pretty(pg_tablespace_size(spcname)) FROM pg_tablespace;

-- 创建表空间（把表建在指定目录）
CREATE TABLESPACE fast_disk LOCATION '/data/pg/fastdisk';

-- 在指定表空间建表
CREATE TABLE t1 (id int) TABLESPACE fast_disk;
```

### 4.4 慢查询分析

```sql
-- 查看当前慢查询（pg_stat_statements 扩展）
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;   -- 需要先在 postgresql.conf 配置

-- 配置 postgresql.conf
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = top

-- 重启生效
systemctl restart postgresql

-- 查询慢SQL排行
SELECT
    calls,
    round(mean_exec_time::numeric, 2) avg_ms,
    round(total_exec_time::numeric, 2) total_ms,
    query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- 当前正在执行的SQL
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;

-- 杀会话
SELECT pg_cancel_backend(pid);       -- 温和取消
SELECT pg_terminate_backend(pid);    -- 强制终止

-- 查看锁等待
SELECT bl.pid AS blocked_pid, bl.usename AS blocked_user, bl.query AS blocked_query,
       kl.pid AS blocking_pid, kl.usename AS blocking_user, kl.query AS blocking_query
FROM pg_stat_activity bl
JOIN pg_locks bl_l ON bl.pid = bl_l.pid
JOIN pg_locks kl_l ON bl_l.locktype = kl_l.locktype
    AND bl_l.database = kl_l.database
    AND bl_l.relation = kl_l.relation
    AND bl_l.pid != kl_l.pid
JOIN pg_stat_activity kl ON kl_l.pid = kl.pid
WHERE NOT bl_l.granted;
```

### 4.5 备份与恢复

#### pg_dump（逻辑备份）

```bash
# 备份单个库
pg_dump -h 127.0.0.1 -U postgres -d shop -F c -f /backup/shop_$(date +%Y%m%d).dump
# -F c = 自定义格式（压缩，推荐）
# -F p = 纯SQL文本
# -F t = tar格式

# 备份指定表
pg_dump -h 127.0.0.1 -U postgres -d shop -t users -F c -f /backup/users.dump

# 备份所有库
pg_dumpall -h 127.0.0.1 -U postgres -f /backup/all.sql

# 恢复
pg_restore -h 127.0.0.1 -U postgres -d shop_new -c /backup/shop_20260812.dump
# -c = 先清空再恢复

# 纯SQL格式直接用 psql
psql -U postgres -d shop < /backup/shop.sql
```

#### pg_basebackup（物理备份，重要！）

```bash
# 完整物理备份（用于PITR、流复制初始化）
pg_basebackup -h 127.0.0.1 -U postgres \
  -D /backup/base_$(date +%Y%m%d) \
  -Ft -z -P -Xs
# -Ft = tar格式
# -z  = gzip压缩
# -P  = 显示进度
# -Xs = 同时备份WAL流
```

#### WAL归档 + PITR（时间点恢复）

```bash
# postgresql.conf 已经配置了：
# wal_level = replica
# archive_mode = on
# archive_command = 'cp %p /opt/postgresql/archive/%f'

# 强制触发一次 checkpoint
psql -U postgres -c "SELECT pg_switch_wal();"

# 查看归档
ls /opt/postgresql/archive/

# 恢复流程（灾难恢复）
# 1. 停服
systemctl stop postgresql

# 2. 清空数据目录
rm -rf /opt/postgresql/data

# 3. 用 pg_basebackup 恢复基础备份
cp -r /backup/base_20260812/* /opt/postgresql/data/
chown -R postgres:postgres /opt/postgresql/data

# 4. 创建恢复配置文件
cat > /opt/postgresql/data/recovery.signal << EOF
restore_command = 'cp /opt/postgresql/archive/%f %p'
recovery_target_time = '2026-08-12 14:30:00'    # 恢复到指定时间
recovery_target_action = 'promote'             # 恢复后提升为可读写
EOF

# 5. 启动（进入恢复模式）
systemctl start postgresql

# 6. 验证
psql -U postgres -c "SELECT now();"
```

---

## 五、流复制（主备架构）

PG 16 的流复制非常成熟，是生产环境标配。

### 5.1 主库配置

```ini
# /opt/postgresql/data/postgresql.conf
wal_level = replica
max_wal_senders = 10
wal_keep_size = 1GB                  # 16+ 用 wal_keep_size（替代 wal_keep_segments）
archive_mode = on
archive_command = 'cp %p /opt/postgresql/archive/%f'
```

```bash
# 创建复制用户
psql -U postgres <<EOF
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'ReplPass123!';
EOF
```

```bash
# 修改 pg_hba.conf 允许备库连接复制流
# host  replication  replicator  192.168.1.0/24  scram-sha-256
```

### 5.2 备库搭建

```bash
# 1. 停服（如有）
systemctl stop postgresql

# 2. 清空备库数据目录
rm -rf /opt/postgresql/data
mkdir -p /opt/postgresql/data
chown postgres:postgres /opt/postgresql/data

# 3. 从主库做基础备份
su - postgres
pg_basebackup -h 192.168.1.100 -U replicator \
  -D /opt/postgresql/data \
  -Fp -Xs -P -R
# -R 自动创建 standby.signal 和 postgresql.auto.conf

# 4. 启动备库
systemctl start postgresql
```

### 5.3 验证复制状态

```sql
-- 在主库执行
SELECT * FROM pg_stat_replication;
-- pid | usesysid | usename | application_name | client_addr | state | sync_state
-- 看到 state = 'streaming' + sync_state = 'async' 就OK了

-- 在备库查看
SELECT pg_is_in_recovery();   -- 返回 t 表示是备库

-- 主库写入测试
psql -U postgres -d shop -c "INSERT INTO test_replication VALUES (1, NOW());"

-- 备库查看
psql -U postgres -d shop -c "SELECT * FROM test_replication;"
-- 应该能查到刚才插入的数据
```

### 5.4 主备切换（switchover）

```bash
# 1. 主库降级（提升原备库为主）
# 在原备库上执行
su - postgres
pg_ctl promote -D /opt/postgresql/data

# 2. 验证
psql -U postgres -c "SELECT pg_is_in_recovery();"   -- 返回 f 表示已提升为主
```

---

## 六、SQL 实战速查（从入门到精通）

### 6.1 DDL（数据定义）

```sql
-- 创建库
CREATE DATABASE shop OWNER appuser ENCODING 'UTF8';

-- 创建模式（schema，PG特有）
CREATE SCHEMA app;

-- 创建表（PG 的语法超丰富）
CREATE TABLE app.users (
    id          BIGSERIAL PRIMARY KEY,                 -- 自增ID（PG特有类型）
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL,
    age         SMALLINT CHECK (age BETWEEN 0 AND 150),
    salary      NUMERIC(10,2) DEFAULT 0,
    profile     JSONB,                                  -- JSONB = 二进制JSON，可索引
    tags        TEXT[],                                 -- 数组类型（PG独有）
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,  -- 带时区时间
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_email UNIQUE (email)
);

-- 表注释
COMMENT ON TABLE app.users IS '用户表';
COMMENT ON COLUMN app.users.username IS '登录名';

-- 修改表
ALTER TABLE app.users ADD COLUMN phone VARCHAR(20);
ALTER TABLE app.users ALTER COLUMN phone TYPE VARCHAR(30);
ALTER TABLE app.users RENAME COLUMN phone TO mobile;
ALTER TABLE app.users DROP COLUMN mobile;
ALTER TABLE app.users ADD CONSTRAINT chk_age CHECK (age > 0);
ALTER TABLE app.users DROP CONSTRAINT chk_age;

-- 创建表分区（PG 10+ 内置分区表）
CREATE TABLE app.orders (
    id        BIGSERIAL,
    order_no  VARCHAR(50),
    user_id   BIGINT,
    amount    NUMERIC(10,2),
    created_at TIMESTAMPTZ
) PARTITION BY RANGE (created_at);

CREATE TABLE app.orders_2026 PARTITION OF app.orders
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE app.orders_2027 PARTITION OF app.orders
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
```

### 6.2 DML（数据操作）

```sql
-- 插入
INSERT INTO app.users(username, email, profile, tags) VALUES
('tom',   'tom@x.com',   '{"city":"Beijing","hobby":["code","music"]}', ARRAY['vip','active']),
('jerry', 'jerry@x.com', '{"city":"Shanghai"}',                          ARRAY['normal']);

-- JSON/JSONB 操作（PG 杀手锏）
SELECT username, profile->>'city' AS city, profile->'hobby'->>0 AS first_hobby FROM app.users;
SELECT * FROM app.users WHERE profile->>'city' = 'Beijing';
SELECT * FROM app.users WHERE profile @> '{"hobby":"code"}';
SELECT * FROM app.users WHERE tags @> ARRAY['vip'];

-- 数组操作
SELECT * FROM app.users WHERE 'vip' = ANY(tags);
SELECT username, array_to_string(tags, ',') FROM app.users;

-- 查询
SELECT * FROM app.users WHERE age > 20 ORDER BY created_at DESC LIMIT 10 OFFSET 0;
SELECT * FROM app.users WHERE username LIKE 't%';
SELECT * FROM app.users WHERE email ~ '^[a-z]+@x\.com$';   -- 正则

-- 聚合 + 窗口函数（PG 窗口函数天下第一）
SELECT
    username,
    age,
    RANK() OVER (ORDER BY age DESC) AS age_rank,
    DENSE_RANK() OVER (ORDER BY age DESC) AS dense_rank,
    ROW_NUMBER() OVER (PARTITION BY is_active ORDER BY created_at) AS rn,
    LAG(username) OVER (ORDER BY created_at) AS prev_user,
    LEAD(username) OVER (ORDER BY created_at) AS next_user,
    SUM(salary) OVER (PARTITION BY is_active) AS active_total_salary
FROM app.users;

-- CTE（公用表达式，比MySQL更强大）
WITH RECURSIVE org_tree AS (
    SELECT id, name, manager_id, 0 AS level
    FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, t.level + 1
    FROM employees e JOIN org_tree t ON e.manager_id = t.id
)
SELECT * FROM org_tree;

-- UPDATE
UPDATE app.users SET age = age + 1 WHERE username = 'tom';
UPDATE app.users SET profile = profile || '{"vip":true}' WHERE username = 'tom';   -- JSON 合并

-- DELETE
DELETE FROM app.users WHERE is_active = FALSE;
TRUNCATE TABLE app.users;     -- 清空表
```

### 6.3 JSONB 查询（PG 的王牌）

```sql
-- 创建带 JSONB 索引的表
CREATE TABLE app.events (
    id    BIGSERIAL PRIMARY KEY,
    data  JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GIN 索引（JSONB 查询必备）
CREATE INDEX idx_events_data ON app.events USING GIN (data);

-- 查询示例
INSERT INTO app.events(data) VALUES
('{"event":"click","user":"tom","page":"home","tags":["hot","new"]}'),
('{"event":"purchase","user":"jerry","amount":99.9,"items":["book"]}');

-- 1. 包含关系
SELECT * FROM app.events WHERE data @> '{"event":"click"}';
-- 2. 存在键
SELECT * FROM app.events WHERE data ? 'amount';
-- 3. 路径取值
SELECT data->>'event' AS event_type, data->'items' AS items FROM app.events;
-- 4. 嵌套更新
UPDATE app.events SET data = data || '{"processed":true}' WHERE data->>'event' = 'click';
```

### 6.4 索引大全

```sql
-- B-Tree 索引（默认）
CREATE INDEX idx_users_username ON app.users (username);
CREATE UNIQUE INDEX uk_users_email ON app.users (email);

-- 组合索引
CREATE INDEX idx_users_active_created ON app.users (is_active, created_at DESC);

-- 部分索引（PG 杀手锏）
CREATE INDEX idx_active_users ON app.users (created_at) WHERE is_active = TRUE;

-- 函数索引
CREATE INDEX idx_users_lower_email ON app.users (LOWER(email));
SELECT * FROM app.users WHERE LOWER(email) = 'tom@x.com';

-- 数组索引
CREATE INDEX idx_users_tags ON app.users USING GIN (tags);

-- JSONB 索引
CREATE INDEX idx_users_profile ON app.users USING GIN (profile jsonb_path_ops);

-- 并发创建索引（不锁表）
CREATE INDEX CONCURRENTLY idx_users_phone ON app.users (phone);

-- 删除索引
DROP INDEX IF EXISTS idx_users_username;
```

### 6.5 视图、函数、存储过程

```sql
-- 普通视图
CREATE VIEW v_active_users AS
SELECT id, username, email FROM app.users WHERE is_active = TRUE;

-- 物化视图（带缓存的视图，超快）
CREATE MATERIALIZED VIEW mv_user_stats AS
SELECT
    date_trunc('day', created_at) AS day,
    COUNT(*) AS user_count,
    AVG(age) AS avg_age
FROM app.users
GROUP BY date_trunc('day', created_at);

-- 刷新物化视图（手动或定时）
REFRESH MATERIALIZED VIEW mv_user_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_stats;   -- 并发刷新（需唯一索引）

-- 自定义函数（PL/pgSQL）
CREATE OR REPLACE FUNCTION fn_get_user_level(uid BIGINT)
RETURNS VARCHAR AS $$
DECLARE
    user_age SMALLINT;
    result VARCHAR(20);
BEGIN
    SELECT age INTO user_age FROM app.users WHERE id = uid;
    IF user_age IS NULL THEN
        RETURN 'unknown';
    ELSIF user_age < 20 THEN
        result := '少年';
    ELSIF user_age < 40 THEN
        result := '青年';
    ELSE
        result := '大叔';
    END IF;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

SELECT fn_get_user_level(1);

-- 存储过程（PG 11+）
CREATE OR REPLACE PROCEDURE sp_clean_inactive_users()
LANGUAGE plpgsql AS $$
BEGIN
    DELETE FROM app.users WHERE is_active = FALSE AND updated_at < NOW() - INTERVAL '90 days';
END;
$$;

CALL sp_clean_inactive_users();
```

### 6.6 事务控制

```sql
-- 显式事务
BEGIN;
UPDATE app.users SET is_active = FALSE WHERE username = 'tom';
INSERT INTO audit_log(action, user_id) VALUES ('disable', 1);
COMMIT;   -- 提交，ROLLBACK 回滚，ROLLBACK TO savepoint 回滚到保存点

-- SAVEPOINT
BEGIN;
UPDATE app.users SET age = 30 WHERE id = 1;
SAVEPOINT sp1;
UPDATE app.users SET age = 40 WHERE id = 1;
ROLLBACK TO sp1;   -- age 回到 30
COMMIT;

-- 隔离级别（PG 默认 READ COMMITTED）
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

---

## 七、PostgreSQL 杀手锏特性（MySQL 没有的）

### 7.1 JSONB（吊打 MySQL JSON）

```sql
-- MySQL 的 JSON 是文本，PG 的 JSONB 是二进制，可索引、压缩
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    data JSONB
);
CREATE INDEX idx_products_data ON products USING GIN (data);

-- 强大的查询
SELECT * FROM products WHERE data @> '{"category":"phone","brand":"apple"}';
SELECT * FROM products WHERE data->'specs'->>'cpu' = 'M3';
```

### 7.2 数组类型

```sql
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    tags TEXT[]
);
INSERT INTO posts(title, tags) VALUES
('PG入门', ARRAY['database','tutorial']),
('Python教程', ARRAY['python','tutorial']);

SELECT * FROM posts WHERE 'tutorial' = ANY(tags);
SELECT * FROM posts WHERE tags && ARRAY['python','pg'];   -- 包含任一
```

### 7.3 全文检索（内置）

```sql
-- 不需要 Elasticsearch 也能做全文搜索
CREATE TABLE articles (
    id BIGSERIAL PRIMARY KEY,
    title TEXT,
    body TEXT,
    tsv TSVECTOR
);

CREATE INDEX idx_articles_tsv ON articles USING GIN (tsv);

-- 触发器自动更新 tsv
CREATE TRIGGER trg_articles_tsv
BEFORE INSERT OR UPDATE ON articles FOR EACH ROW
EXECUTE FUNCTION
    tsvector_update_trigger(tsv, 'pg_catalog.simple', title, body);

-- 查询
SELECT * FROM articles
WHERE tsv @@ to_tsquery('postgresql & binary');
```

### 7.4 upsert（ON CONFLICT）

```sql
INSERT INTO app.users(username, email, age)
VALUES ('tom', 'tom@x.com', 25)
ON CONFLICT (username) DO UPDATE
SET email = EXCLUDED.email, age = EXCLUDED.age;
```

### 7.5 LISTEN / NOTIFY（实时通知）

```sql
-- 一个会话
LISTEN channel_new_user;

-- 另一个会话
NOTIFY channel_new_user, 'tom inserted';

-- 第一个会话会收到通知
```

---

## 八、避坑指南（生产血泪总结）

| 坑                             | 现象                         | 解决方案                                       |
| ------------------------------ | ---------------------------- | ---------------------------------------------- |
| `initdb` 用 root 跑            | `initdb: cannot run as root` | 切换 `su - postgres`                           |
| pg_hba.conf 没改               | 远程连不上                   | 改 `host all all 0.0.0.0/0 md5`                |
| `listen_addresses` 没改        | 只监听 127.0.0.1             | `listen_addresses = '*'`                       |
| WAL 没开 `archive_mode`        | 没法做 PITR                  | `archive_mode = on` + `archive_command`        |
| 防火墙没开 5432                | 远程连不上                   | `firewall-cmd --add-port=5432/tcp`             |
| 用 root 启动 postgres          | 报权限错                     | 必须用 postgres 用户                           |
| 删库直接 `rm -rf`              | 数据丢失                     | `DROP DATABASE` 或 pg_dump 先备                |
| `SELECT *` 不带 LIMIT          | 大表 OOM                     | 加 LIMIT                                       |
| 不用 `BIGSERIAL`               | int4 序列号用完              | 业务大表用 `BIGSERIAL`（int8）                 |
| jsonb 字段不加 GIN 索引        | 查询全表扫                   | JSONB 必加 GIN                                 |
| `VACUUM` 长期不跑              | 表膨胀、查询变慢             | 配 `autovacuum = on`                           |
| 时区不统一                     | 时间混乱                     | 用 `TIMESTAMPTZ`，统一 UTC                     |
| 字符串函数编码不匹配           | 编码错误                     | 库用 `UTF8`，客户端用 `client_encoding = UTF8` |
| 没设 `shared_buffers`          | 性能差                       | 设为物理内存的 25%                             |
| 忘记 `pg_stat_statements` 扩展 | 没法做慢查询分析             | 安装 + 配置 `shared_preload_libraries`         |

---

## 九、常用配置参数速查

```ini
# postgresql.conf 必调参数
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 2GB                 # 内存的25%
effective_cache_size = 6GB           # 内存的70%
work_mem = 64MB                      # 单个查询排序用
maintenance_work_mem = 512MB         # VACUUM/建索引用
wal_buffers = 16MB
max_wal_size = 2GB
min_wal_size = 512MB
wal_level = replica
max_wal_senders = 10
archive_mode = on
archive_command = 'cp %p /archive/%f'
random_page_cost = 1.1               # SSD 必改
effective_io_concurrency = 200       # SSD 必改
log_min_duration_statement = 1000    # 慢查询日志
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
shared_preload_libraries = 'pg_stat_statements'
autovacuum = on
```

---

## 十、常用 SQL 速查

```sql
-- 库大小
SELECT pg_size_pretty(pg_database_size(current_database()));

-- 表大小（含索引）
SELECT
    schemaname, relname,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid))        AS table_size,
    pg_size_pretty(pg_indexes_size(relid))        AS index_size,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

-- 死元组（VACUUM 是否需要）
SELECT schemaname, relname, n_dead_tup, n_live_tup
FROM pg_stat_user_tables WHERE n_dead_tup > 1000;

-- 索引使用率（哪些索引从来没被用）
SELECT schemaname, relname, indexrelname, idx_scan
FROM pg_stat_user_indexes WHERE idx_scan = 0;

-- 当前活动连接数
SELECT count(*) FROM pg_stat_activity;

-- 最长运行的SQL
SELECT pid, now() - query_start AS duration, query, state
FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC LIMIT 10;

-- 表膨胀率（VACUUM前看这个）
SELECT
    schemaname, relname,
    pg_size_pretty(pg_relation_size(relid)) AS size,
    n_dead_tup
FROM pg_stat_user_tables WHERE n_dead_tup > 0 ORDER BY n_dead_tup DESC;
```

---

## 总结

| 步骤   | 关键命令                                                   |
| ------ | ---------------------------------------------------------- | ---- | -------------------- |
| 下载   | EDB 官方二进制包 `postgresql-XX-linux-x64-binaries.tar.gz` |
| 解压   | `tar -xvf xxx.tar.gz`，移动到 `/opt/postgresql`            |
| 建用户 | `useradd -u 999 -g postgres -d /home/postgres postgres`    |
| 初始化 | `initdb -E UTF8 --locale=C -U postgres -W`                 |
| 启停   | `systemctl {start                                          | stop | restart} postgresql` |
| 远程   | `listen_addresses='*'` + 改 `pg_hba.conf`                  |
| 备份   | `pg_dump` / `pg_basebackup`                                |
| 恢复   | `pg_restore` / PITR                                        |
| 主从   | `pg_basebackup -R`                                         |
| 工具链 | `psql`、`pg_dump`、`pg_basebackup`、`pgAdmin 4`            |

**最后一条建议**：

> **PG 的精髓在 SQL 本身。MySQL 是"够用就行"，PG 是"想得到的都能写"。**
>
> **当你用 JSONB、数组、窗口函数、CTE 写出优雅查询时，你才会真正爱上 PostgreSQL。**

---

## 附录：MySQL ↔ PostgreSQL 速查对比

| 概念           | MySQL                                | PostgreSQL                         |
| -------------- | ------------------------------------ | ---------------------------------- |
| 端口           | 3306                                 | 5432                               |
| 命令行         | `mysql`                              | `psql`                             |
| 超级用户       | `root`                               | `postgres`                         |
| 自增类型       | `AUTO_INCREMENT`                     | `SERIAL` / `BIGSERIAL`             |
| 当前时间       | `NOW()`                              | `NOW()` / `CURRENT_TIMESTAMP`      |
| JSON           | `JSON`（文本）                       | `JSON` / `JSONB`（二进制）         |
| 布尔           | `TINYINT(1)` / `BOOLEAN`             | `BOOLEAN`（原生）                  |
| 数组           | ❌                                   | ✅ `TEXT[]` 等                     |
| 数组查询       | JOIN 表                              | `tag = ANY(ARRAY['x','y'])`        |
| upsert         | `INSERT ... ON DUPLICATE KEY UPDATE` | `INSERT ... ON CONFLICT DO UPDATE` |
| 全文检索       | 需配置                               | 内置                               |
| 物化视图       | ❌                                   | ✅                                 |
| 窗口函数       | 8.0+                                 | 长期支持，更强大                   |
| CTE            | 8.0+                                 | 长期支持，`WITH RECURSIVE`         |
| PITR           | binlog 时间点                        | WAL 归档 + `recovery.signal`       |
| 主从           | binlog 复制                          | 流复制（WAL）                      |
| 用户管理       | `CREATE USER`                        | `CREATE ROLE ... LOGIN`            |
| 默认端口外的DB | `database`                           | `database` + `schema`              |

---

> **上一篇**：《MySQL 8.0 二进制安装实战》（同系列）
>
> **下一篇预告**：《MySQL ↔ PostgreSQL 数据迁移实战：从 schema 设计到 SQL 改写》
>
> 如果觉得有用，**点赞 + 收藏 + 关注**，是我继续肝下去的最大动力！

---

_版权声明：本文采用 CC BY-NC-SA 4.0 协议，转载请保留作者及原文链接。_
