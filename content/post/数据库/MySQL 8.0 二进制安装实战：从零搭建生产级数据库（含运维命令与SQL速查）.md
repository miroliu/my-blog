---
title: "MySQL 8.0 二进制安装实战：从零搭建生产级数据库（含运维命令与SQL速查）"
description: "不用yum/apt，不用源码编译，纯二进制方式安装MySQL 8.0。从下载、解压、初始化、systemd服务、远程连接配置，到日常运维命令和SQL实战，一篇讲透。适合CentOS/Ubuntu，生产环境可直接套用。"
slug: "mysql-8-binary-install-ops-sql"
date: 2026-08-09T22:50:00+08:00
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["数据库", "MySQL"]
tags:
  [
    "MySQL",
    "MySQL 8.0",
    "二进制安装",
    "tar.xz",
    "运维",
    "systemd",
    "SQL",
    "mysqld",
    "CentOS",
    "Ubuntu",
  ]
---

# MySQL 8.0 二进制安装实战：从零搭建生产级数据库（含运维命令与SQL速查）

## 前言

MySQL 的安装方式有四种：

| 方式               | 适用场景              | 优缺点                                     |
| ------------------ | --------------------- | ------------------------------------------ |
| **yum/apt 包管理** | 快速测试、个人开发    | 版本受发行版限制，路径散乱，升级麻烦       |
| **源码编译**       | 需要深度定制          | 耗时长，编译参数踩坑多，**生产环境不推荐** |
| **官方RPM/DEB包**  | CentOS/Ubuntu生产     | ✅ 推荐，简单直接                          |
| **二进制 tar 包**  | 任意Linux、单机多实例 | ✅ **本文重点**，灵活可控                  |

**为什么推荐二进制安装？**

- 路径统一（`/usr/local/mysql`），不污染系统目录
- 版本自由（想装8.0.32还是8.0.42随便选）
- 一台机器可以装**多个实例**（端口分开即可）
- 卸载干净（直接删目录，不留垃圾）
- 升级方便（停服→替换二进制→重启）

**适合谁？**

- 不想被 yum/apt 的版本绑死的运维/DBA
- 需要在一台机器上跑多个 MySQL 实例做测试
- 生产环境需要统一部署规范（很多大厂都是这样）

下面开始实战。

---

## 一、安装前准备

### 1.1 环境要求

| 项目  | 最低                    | 推荐                    |
| ----- | ----------------------- | ----------------------- |
| OS    | CentOS 7 / Ubuntu 18.04 | CentOS 7 / Ubuntu 22.04 |
| CPU   | 1核                     | 2核+                    |
| 内存  | 1GB                     | 4GB+                    |
| 磁盘  | 2GB                     | 50GB+（生产）           |
| glibc | 2.17+                   | 2.28+                   |

### 1.2 下载二进制包

**官网地址**：https://dev.mysql.com/downloads/mysql/

找到 **"Linux - Generic"** 那一栏，下载对应的 tar.xz 包：

```
mysql-8.0.42-linux-glibc2.28-x86_64.tar.xz   ← glibc 2.28+（推荐CentOS 8/Ubuntu 20+）
mysql-8.0.42-linux-glibc2.17-x86_64.tar.xz   ← glibc 2.17（兼容CentOS 7）
```

> **如何查看自己的 glibc 版本？**
>
> ```bash
> ldd --version | head -n 1
> # 或
> strings /lib64/libc.so.6 | grep -i "GNU C Library" | head -1
> ```

### 1.3 上传安装包

```bash
# 假设下载到本地后传到服务器
scp mysql-8.0.42-linux-glibc2.28-x86_64.tar.xz root@192.168.1.100:/usr/local/src/

# 服务器上进入目录
cd /usr/local/src
ls -lh mysql-8.0.42-linux-glibc2.28-x86_64.tar.xz
```

### 1.4 创建 mysql 用户和目录

```bash
# 创建运行用户（关键！不要用root跑MySQL）
groupadd mysql
useradd -r -g mysql -s /bin/false mysql   # -s /bin/false 表示不能登录系统

# 创建目录结构（后面会用到）
mkdir -p /usr/local/mysql                    # 主安装目录
mkdir -p /usr/local/mysql/data               # 数据目录（datadir）
mkdir -p /var/log/mysql                      # 日志目录
mkdir -p /var/run/mysql                      # pid 文件目录
mkdir -p /usr/local/mysql/etc                # 配置文件目录
```

### 1.5 卸载可能冲突的包

```bash
# CentOS
yum list installed | grep -i mysql
yum remove -y mysql mysql-server mysql-libs mariadb* 2>/dev/null || true

# Ubuntu
dpkg -l | grep -i mysql
apt-get purge -y mysql-* mariadb-* 2>/dev/null || true

# 查找残留
find / -name "my.cnf" 2>/dev/null
find / -name "mysql" -type d 2>/dev/null
```

> **坑**：如果之前装过 `mariadb`，可能 `libmysqlclient` 跟新装的 MySQL 冲突，必须卸载干净。

---

## 二、正式安装

### 2.1 解压安装包

```bash
cd /usr/local/src

# 解压（会得到 mysql-8.0.42-linux-glibc2.28-x86_64 目录）
tar -xvf mysql-8.0.42-linux-glibc2.28-x86_64.tar.xz

# 移动到目标位置
mv mysql-8.0.42-linux-glibc2.28-x86_64/* /usr/local/mysql/

# 清理
rm -rf mysql-8.0.42-linux-glibc2.28-x86_64*

# 查看目录结构
ls /usr/local/mysql/
# bin  docs  include  lib  LICENSE  man  README  share  support-files
```

### 2.2 设置环境变量

```bash
cat >> /etc/profile << 'EOF'

# MySQL Environment Variables
export MYSQL_HOME=/usr/local/mysql
export PATH=$PATH:$MYSQL_HOME/bin
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:$MYSQL_HOME/lib
EOF

source /etc/profile

# 验证（任何目录都能用 mysql 命令）
mysql --version
# mysql  Ver 8.0.42 for Linux on x86_64 (MySQL Community Server - GPL)
```

### 2.3 创建配置文件

二进制安装**没有默认的 `/etc/my.cnf`**，必须手动创建。

```bash
cat > /usr/local/mysql/etc/my.cnf << 'EOF'
[client]
port            = 3306
socket          = /tmp/mysql.sock
default-character-set = utf8mb4

[mysql]
default-character-set = utf8mb4

[mysqld]
# ============ 基础配置 ============
user            = mysql
port            = 3306
basedir         = /usr/local/mysql
datadir         = /usr/local/mysql/data
socket          = /tmp/mysql.sock
pid-file        = /var/run/mysql/mysqld.pid
tmpdir          = /tmp
log-error       = /var/log/mysql/error.log
slow_query_log_file = /var/log/mysql/slow.log
general_log_file    = /var/log/mysql/general.log

# ============ 字符集 ============
character-set-server = utf8mb4
collation-server     = utf8mb4_unicode_ci
init_connect         = 'SET NAMES utf8mb4'
skip-character-set-client-handshake

# ============ 引擎 ============
default-storage-engine = InnoDB
default-authentication-plugin = mysql_native_password

# ============ 内存相关 ============
innodb_buffer_pool_size = 1G          # 生产建议物理内存的50-70%
innodb_log_file_size    = 256M        # redo log大小
innodb_log_buffer_size  = 16M
innodb_flush_log_at_trx_commit = 1    # 1=最安全（每次commit刷盘），2=折中
sync_binlog            = 1           # binlog刷盘

# ============ 连接相关 ============
max_connections        = 500
max_user_connections   = 0           # 0=不限制
wait_timeout           = 28800       # 8小时
interactive_timeout    = 28800
max_allowed_packet     = 64M

# ============ 日志 ============
log-bin                = /var/log/mysql/mysql-bin
binlog_format          = ROW
expire_logs_days       = 7            # binlog保留7天
server-id              = 1

slow_query_log         = ON
long_query_time        = 2            # 超过2秒算慢

# ============ 安全 ============
skip-name-resolve                       # 禁用DNS反查，提高连接速度
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
EOF

# 创建软链接，方便其他工具找配置
ln -sf /usr/local/mysql/etc/my.cnf /etc/my.cnf
```

> **注意**：上面 `innodb_buffer_pool_size = 1G` 是按 4GB 内存写的，生产环境要按实际调整。

### 2.4 初始化数据目录

```bash
# 给目录授权
chown -R mysql:mysql /usr/local/mysql
chown -R mysql:mysql /var/log/mysql
chown -R mysql:mysql /var/run/mysql

# 关键步骤：初始化（生成系统表、root临时密码）
/usr/local/mysql/bin/mysqld \
  --initialize \
  --user=mysql \
  --basedir=/usr/local/mysql \
  --datadir=/usr/local/mysql/data \
  --explicit_defaults_for_timestamp

# 查看生成的临时密码
grep 'temporary password' /var/log/mysql/error.log
# 2026-08-12T14:50:00.123456Z 5 [Note] [MY-010454] [Server] A temporary password is generated for root@localhost: Abc123Xyz!Temp
```

> **坑**：`--initialize`（带横线）会生成临时密码。`--initialize-insecure` 不会生成密码，但只用于本地测试，**生产千万别用**。

> **如果初始化报错**：80%是 `/etc/my.cnf` 配置问题，或者 `/var/log/mysql` 目录没授权。先看 `error.log` 最后一行的报错。

### 2.5 配置 systemd 服务

```bash
cat > /usr/lib/systemd/system/mysqld.service << 'EOF'
[Unit]
Description=MySQL Server
Documentation=man:mysqld(8)
Documentation=http://dev.mysql.com/doc/refman/en/using-systemd.html
After=network.target
After=syslog.target

[Service]
User=mysql
Group=mysql
Type=forking
PIDFile=/var/run/mysql/mysqld.pid

# 启动命令
ExecStart=/usr/local/mysql/bin/mysqld \
  --defaults-file=/usr/local/mysql/etc/my.cnf \
  --daemonize

ExecStop=/usr/local/mysql/bin/mysqladmin shutdown
ExecReload=/bin/kill -HUP $MAINPID

# 资源限制
LimitNOFILE=65535
LimitNPROC=65535

# 重启策略
Restart=on-failure
RestartPreventExitStatus=1
PrivateTmp=false

# 安全
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

# 重载systemd
systemctl daemon-reload

# 开机自启
systemctl enable mysqld

# 启动
systemctl start mysqld

# 查看状态
systemctl status mysqld
```

**如果没有 systemd（极少数情况），用 init.d 方式**：

```bash
cp /usr/local/mysql/support-files/mysql.server /etc/init.d/mysqld
chkconfig --add mysqld
chkconfig mysqld on
service mysqld start
```

### 2.6 首次登录 + 修改密码

```bash
# 用临时密码登录
mysql -uroot -p'Abc123Xyz!Temp'

# 必须立刻修改密码（MySQL 8.0 默认密码策略强）
mysql> ALTER USER 'root'@'localhost' IDENTIFIED BY 'YourNewPass123!';
mysql> FLUSH PRIVILEGES;

# 退出，用新密码登录验证
mysql -uroot -p'YourNewPass123!'
```

> **注意**：MySQL 8.0 默认使用 `caching_sha2_password` 插件，部分老客户端（如 navicat 11）连不上。配置里我已改成 `mysql_native_password`，兼容性好。

---

## 三、远程连接配置

### 3.1 防火墙开放 3306

```bash
# CentOS 7
firewall-cmd --zone=public --add-port=3306/tcp --permanent
firewall-cmd --reload

# Ubuntu (ufw)
ufw allow 3306/tcp

# iptables
iptables -A INPUT -p tcp --dport 3306 -j ACCEPT
```

### 3.2 创建远程用户

```sql
-- MySQL 8.0 创建用户和授权必须分开
CREATE USER 'appuser'@'%' IDENTIFIED BY 'AppPass123!';

-- 授予权限
GRANT SELECT, INSERT, UPDATE, DELETE ON mydb.* TO 'appuser'@'%';

-- 如果要所有库所有权限
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' WITH GRANT OPTION;

-- 立即生效
FLUSH PRIVILEGES;

-- 查看用户
SELECT user, host, plugin FROM mysql.user;
```

### 3.3 允许远程连接

```bash
# 检查配置：默认只监听 127.0.0.1，需要改成 0.0.0.0
grep "bind-address" /usr/local/mysql/etc/my.cnf
# 没有就是默认（绑 127.0.0.1）

# 修改
sed -i 's/^bind-address/bind-address/' /usr/local/mysql/etc/my.cnf   # 确保有这行
echo "bind-address = 0.0.0.0" >> /usr/local/mysql/etc/my.cnf

# 重启生效
systemctl restart mysqld
```

### 3.4 测试远程连接

```bash
# 在另一台机器
mysql -h 192.168.1.100 -P 3306 -u appuser -p'AppPass123!'
```

---

## 四、运维常用命令（生产必备）

### 4.1 服务管理

```bash
# 启动 / 停止 / 重启 / 状态
systemctl start mysqld
systemctl stop mysqld
systemctl restart mysqld
systemctl reload mysqld        # 平滑重载配置（8.0支持）
systemctl status mysqld

# 查看是否开机启动
systemctl is-enabled mysqld
```

### 4.2 连接相关

```bash
# 本地登录
mysql -uroot -p
mysql -uroot -p密码               # ⚠️ 不推荐，会留在history里

# 远程登录
mysql -h 192.168.1.100 -P 3306 -uappuser -p'密码'

# 指定socket登录（unix下）
mysql -uroot -p -S /tmp/mysql.sock

# 指定配置文件
mysql --defaults-file=/path/my.cnf -uroot -p

# 登录后查看连接信息
mysql> \s                       # status
mysql> SELECT @@hostname, @@version, @@port;
mysql> SHOW PROCESSLIST;        # 查看所有连接
mysql> SHOW FULL PROCESSLIST;   # 显示完整SQL
```

### 4.3 用户与权限

```sql
-- 创建用户
CREATE USER 'tom'@'192.168.1.%' IDENTIFIED BY 'TomPass123!';

-- 修改密码
ALTER USER 'tom'@'%' IDENTIFIED BY 'NewPass456!';

-- 查看用户
SELECT user, host, plugin, authentication_string FROM mysql.user;

-- 授予权限
GRANT SELECT ON mydb.* TO 'tom'@'%';
GRANT ALL ON mydb.t1 TO 'tom'@'%';
GRANT ALL PRIVILEGES ON *.* TO 'admin'@'%' WITH GRANT OPTION;

-- 查看权限
SHOW GRANTS FOR 'tom'@'%';

-- 撤销权限
REVOKE SELECT ON mydb.* FROM 'tom'@'%';

-- 删除用户
DROP USER 'tom'@'%';

-- 修改密码策略（生产慎用）
SET GLOBAL validate_password.policy = LOW;
SET GLOBAL validate_password.length = 6;
```

### 4.4 数据库操作

```sql
-- 查看所有库
SHOW DATABASES;

-- 创建库（指定字符集）
CREATE DATABASE mydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用库
USE mydb;

-- 删除库（生产慎用！）
DROP DATABASE mydb;

-- 查看当前库
SELECT DATABASE();

-- 查看表
SHOW TABLES;
SHOW TABLES FROM mydb;
```

### 4.5 表与数据

```sql
-- 创建表
CREATE TABLE users (
    id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    email      VARCHAR(100) NOT NULL,
    age        TINYINT UNSIGNED DEFAULT 0,
    salary     DECIMAL(10,2),
    bio        TEXT,
    status     ENUM('active','disabled') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 插入数据
INSERT INTO users(username, email, age) VALUES
    ('tom', 'tom@x.com', 25),
    ('jerry', 'jerry@x.com', 30);

-- 批量插入
INSERT INTO users(username, email, age) VALUES
    ('alice','alice@x.com',28),
    ('bob','bob@x.com',32),
    ('charlie','charlie@x.com',45);

-- 查询
SELECT * FROM users;
SELECT id, username, email FROM users WHERE age > 25 ORDER BY created_at DESC LIMIT 10;
SELECT COUNT(*), AVG(age), MAX(salary) FROM users;

-- 更新
UPDATE users SET age = age + 1 WHERE username = 'tom';

-- 删除
DELETE FROM users WHERE status = 'disabled';
TRUNCATE TABLE users;   -- 清空所有数据，不可回滚！

-- 查看表结构
DESC users;
SHOW CREATE TABLE users\G
```

### 4.6 索引

```sql
-- 创建索引
CREATE INDEX idx_username ON users(username);
CREATE UNIQUE INDEX uk_email ON users(email);
CREATE INDEX idx_combo ON users(status, created_at);  -- 组合索引

-- 查看索引
SHOW INDEX FROM users;

-- 删除索引
DROP INDEX idx_username ON users;

-- 强制走索引
SELECT * FROM users FORCE INDEX(idx_email) WHERE email = 'tom@x.com';

-- 分析表（更新统计信息）
ANALYZE TABLE users;

-- 检查表
CHECK TABLE users;
```

### 4.7 备份与恢复（生产救命）

```bash
# 1. mysqldump（逻辑备份，小库适用）
mysqldump -uroot -p \
  --single-transaction \
  --master-data=2 \
  --routines \
  --triggers \
  --events \
  --default-character-set=utf8mb4 \
  --databases mydb > /backup/mydb_$(date +%Y%m%d).sql

# 备份所有库
mysqldump -uroot -p --all-databases --single-transaction > /backup/all_$(date +%Y%m%d).sql

# 恢复
mysql -uroot -p < /backup/mydb_20260812.sql

# 2. mysqlbinlog（基于时间点恢复）
mysqlbinlog --start-datetime="2026-08-12 14:00:00" \
            --stop-datetime="2026-08-12 15:00:00" \
            /var/log/mysql/mysql-bin.000123 | mysql -uroot -p

# 3. xtrabackup（物理备份，大库首选，需单独安装）
xtrabackup --backup --target-dir=/backup/full
xtrabackup --prepare --target-dir=/backup/full
xtrabackup --copy-back --target-dir=/backup/full
```

### 4.8 慢查询分析

```sql
-- 查看慢查询配置
SHOW VARIABLES LIKE '%slow%';
SHOW VARIABLES LIKE 'long_query_time';

-- 实时看慢SQL
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;

-- 用 mysqldumpslow 工具分析日志文件
--! /bin/bash
mysqldumpslow -t 10 -s at /var/log/mysql/slow.log    # at = 平均耗时
```

### 4.9 主从复制（生产高可用）

**主库配置**（`/etc/my.cnf`）：

```ini
[mysqld]
server-id       = 1
log-bin         = mysql-bin
binlog_format   = ROW
gtid_mode       = ON
enforce-gtid-consistency = ON
```

**从库配置**：

```ini
[mysqld]
server-id       = 2
log-bin         = mysql-bin
binlog_format   = ROW
gtid_mode       = ON
enforce-gtid-consistency = ON
read-only       = ON
relay_log       = relay-bin
log_slave_updates = ON
```

**主库授权**：

```sql
CREATE USER 'repl'@'192.168.1.%' IDENTIFIED WITH mysql_native_password BY 'ReplPass123!';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'192.168.1.%';
FLUSH PRIVILEGES;
```

**从库设置**：

```sql
CHANGE MASTER TO
    MASTER_HOST='192.168.1.100',
    MASTER_USER='repl',
    MASTER_PASSWORD='ReplPass123!',
    MASTER_AUTO_POSITION=1;    -- 基于GTID

START SLAVE;
SHOW SLAVE STATUS\G    -- 看 Slave_IO_Running: Yes, Slave_SQL_Running: Yes 就成功了
```

### 4.10 性能监控

```sql
-- 实时查看正在执行的SQL
SELECT * FROM information_schema.PROCESSLIST WHERE COMMAND != 'Sleep';

-- 查看锁等待
SELECT * FROM performance_schema.data_locks LIMIT 10;
SELECT * FROM performance_schema.data_lock_waits LIMIT 10;

-- 查看InnoDB状态
SHOW ENGINE INNODB STATUS\G

-- 查看库大小
SELECT
    table_schema AS '数据库',
    SUM(data_length + index_length) / 1024 / 1024 AS '大小(MB)'
FROM information_schema.tables
GROUP BY table_schema
ORDER BY SUM(data_length + index_length) DESC;

-- 查看连接数
SHOW STATUS LIKE 'Threads_connected';
SHOW STATUS LIKE 'Max_used_connections';

-- 查看QPS/TPS（粗略）
SHOW GLOBAL STATUS LIKE 'Questions';
SHOW GLOBAL STATUS LIKE 'Com_commit';
SHOW GLOBAL STATUS LIKE 'Com_rollback';
```

---

## 五、SQL 速查精华（从删库到跑路）

### 5.1 完整实战示例

```sql
-- ==========================================
-- 1. DDL（数据定义）
-- ==========================================
CREATE DATABASE IF NOT EXISTS shop DEFAULT CHARSET utf8mb4;
USE shop;

CREATE TABLE products (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    price       DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock       INT UNSIGNED NOT NULL DEFAULT 0,
    category_id INT UNSIGNED,
    tags        JSON,                 -- MySQL 5.7+ JSON类型
    description TEXT,
    is_active   TINYINT(1) DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category_id),
    INDEX idx_price (price)
) ENGINE=InnoDB;

-- 修改表
ALTER TABLE products ADD COLUMN view_count INT DEFAULT 0;
ALTER TABLE products MODIFY COLUMN name VARCHAR(300);
ALTER TABLE products DROP COLUMN view_count;
ALTER TABLE products RENAME TO goods;
RENAME TABLE goods TO products;

-- ==========================================
-- 2. DML（数据操作）
-- ==========================================
INSERT INTO products(name, price, stock, category_id, tags) VALUES
('iPhone 15', 5999.00, 100, 1, JSON_ARRAY('手机','苹果','5G')),
('小米14',  3999.00, 200, 1, JSON_ARRAY('手机','小米','5G')),
('华为Mate60', 5499.00, 150, 1, JSON_ARRAY('手机','华为','5G')),
('MacBook Pro', 14999.00, 50, 2, JSON_ARRAY('电脑','苹果','笔记本'));

-- 查询
SELECT * FROM products WHERE price BETWEEN 3000 AND 6000;
SELECT * FROM products WHERE tags->'$[0]' = '手机';
SELECT category_id, COUNT(*) cnt, AVG(price) avg_price
  FROM products GROUP BY category_id HAVING COUNT(*) > 0;
SELECT * FROM products ORDER BY price DESC LIMIT 5 OFFSET 0;

-- 子查询
SELECT * FROM products WHERE price > (SELECT AVG(price) FROM products);

-- 关联
SELECT p.name, p.price, c.category_name
FROM products p LEFT JOIN categories c ON p.category_id = c.id;

-- UPDATE
UPDATE products SET stock = stock - 1, price = price * 0.9 WHERE id = 1;

-- DELETE
DELETE FROM products WHERE stock = 0;
TRUNCATE TABLE products;

-- ==========================================
-- 3. 事务
-- ==========================================
SET autocommit = 0;       -- 关闭自动提交
START TRANSACTION;
UPDATE products SET stock = stock - 1 WHERE id = 1;
INSERT INTO orders(product_id, qty) VALUES (1, 1);
COMMIT;
-- ROLLBACK;  -- 出错回滚

-- ==========================================
-- 4. 视图 / 函数 / 存储过程
-- ==========================================
CREATE VIEW v_active_products AS
SELECT id, name, price FROM products WHERE is_active = 1;

CREATE FUNCTION fn_get_price_level(p DECIMAL(10,2))
RETURNS VARCHAR(20) DETERMINISTIC
RETURN CASE
    WHEN p < 1000  THEN '便宜'
    WHEN p < 5000  THEN '中等'
    WHEN p < 10000 THEN '贵'
    ELSE '土豪款'
END;

SELECT name, price, fn_get_price_level(price) level FROM products;

-- ==========================================
-- 5. 常用聚合 / 窗口函数（8.0+）
-- ==========================================
SELECT
    name, price,
    ROW_NUMBER() OVER (ORDER BY price DESC) rn,
    RANK()       OVER (ORDER BY price DESC)    rk,
    DENSE_RANK() OVER (ORDER BY price DESC)    drk,
    SUM(price)   OVER ()                       total,
    AVG(price)   OVER (PARTITION BY category_id) avg_cat
FROM products;
```

### 5.2 数据导入导出

```bash
# 导入
mysql -uroot -p mydb < /backup/data.sql
mysql -uroot -p mydb -e "source /backup/data.sql"

# 导出CSV
SELECT * FROM products INTO OUTFILE '/tmp/products.csv'
  FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
  LINES TERMINATED BY '\n';

# 加载CSV（注意：secure_file_priv 默认可能限制）
LOAD DATA INFILE '/tmp/products.csv'
INTO TABLE products
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

# 查看 secure_file_priv
SHOW VARIABLES LIKE 'secure_file_priv';
# NULL = 禁用，'' = 任意路径，'/path' = 限定路径
```

---

## 六、避坑指南（生产踩过的坑）

| 坑                          | 现象                                 | 解决方案                     |
| --------------------------- | ------------------------------------ | ---------------------------- |
| 表名/字段名用关键字         | 报错                                 | 加反引号 \`select\`          |
| utf8 ≠ utf8mb4              | emoji存不进去、varchar索引长度计算错 | **统一用 utf8mb4**           |
| DATETIME 没时区             | 跨时区乱套                           | 用 TIMESTAMP 或约定 UTC      |
| JOIN 字段没索引             | 全表扫，库崩                         | EXPLAIN 检查，给字段加索引   |
| 不开慢查询日志              | 不知道哪些SQL慢                      | `slow_query_log=ON` 默认开启 |
| binlog 单文件撑爆           | 磁盘满                               | `expire_logs_days=7` + 监控  |
| `WHERE 1=1 ORDER BY RAND()` | 全表扫                               | 业务不要这么做               |
| SELECT \* 不带 LIMIT        | 大表OOM                              | **生产禁用 SELECT \***       |
| 大事务未提交                | 锁等待、行锁升级                     | 单事务行数<1万               |
| MyISAM 还在用               | 无事务、无行锁                       | **全部换 InnoDB**            |
| root 跑应用                 | 权限过大、审计困难                   | 单独建应用账号               |
| 弱密码                      | 一秒被破解                           | 12位以上大小写数字符号       |
| 客户端 caching_sha2         | navicat 11 连不上                    | 改成 mysql_native_password   |

---

## 七、常用系统信息查询

```sql
-- 版本信息
SELECT VERSION();                          -- 8.0.42
SHOW VARIABLES LIKE 'version%';

-- 字符集
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- 引擎信息
SHOW ENGINES;

-- 运行时长
SHOW STATUS LIKE 'Uptime';

-- 所有配置变量
SHOW VARIABLES;

-- 表大小（含索引）
SELECT
    table_name,
    table_rows,
    data_length / 1024 / 1024 AS data_mb,
    index_length / 1024 / 1024 AS index_mb,
    (data_length + index_length) / 1024 / 1024 AS total_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY (data_length + index_length) DESC;

-- 锁信息
SELECT * FROM performance_schema.metadata_locks LIMIT 10;

-- 当前binlog位点
SHOW MASTER STATUS;
```

---

## 八、升级与卸载

### 8.1 升级到新版本（原地升级 8.0.x → 8.0.y）

```bash
# 1. 备份（必做！）
mysqldump -uroot -p --all-databases --single-transaction --routines --triggers --events > /backup/all_pre_upgrade.sql

# 2. 停止服务
systemctl stop mysqld

# 3. 保留配置和数据，替换二进制
cp -r /usr/local/mysql /usr/local/mysql_old_backup
rm -rf /usr/local/mysql
tar -xvf mysql-8.0.43-linux-glibc2.28-x86_64.tar.xz
mv mysql-8.0.43-linux-glibc2.28-x86_64/* /usr/local/mysql/

# 4. 启动并升级数据字典
systemctl start mysqld
mysql_upgrade -uroot -p    # 8.0自带升级工具

# 5. 验证
mysql -uroot -p -e "SELECT VERSION();"
```

### 8.2 完全卸载

```bash
# 停服
systemctl stop mysqld
systemctl disable mysqld

# 清理
rm -rf /usr/local/mysql
rm -rf /var/log/mysql
rm -rf /etc/my.cnf /etc/init.d/mysqld
rm -rf /usr/lib/systemd/system/mysqld.service
systemctl daemon-reload

# 清理用户
userdel -r mysql
groupdel mysql

# 清理环境变量
sed -i '/MYSQL_HOME/d' /etc/profile
sed -i '/mysql.*bin/d' /etc/profile
source /etc/profile
```

---

## 九、单机多实例（高级玩法）

**场景**：测试环境一台机器跑 MySQL 5.7 + 8.0 + MariaDB 三套实例。

```bash
# 准备三套目录
mkdir -p /usr/local/mysql-{3306,3307,3308}/{data,logs,etc}

# 复制3份配置，端口和socket不一样
cp my.cnf.template /usr/local/mysql-3306/etc/my.cnf
cp my.cnf.template /usr/local/mysql-3307/etc/my.cnf
cp my.cnf.template /usr/local/mysql-3308/etc/my.cnf

# 分别修改端口、datadir、socket、pid-file、log-error、log-bin
# 比如 3306 的配置：
#   port = 3306
#   datadir = /usr/local/mysql-3306/data
#   socket = /tmp/mysql3306.sock
#   pid-file = /var/run/mysql-3306.pid
#   log-error = /usr/local/mysql-3306/logs/error.log
#   log-bin = /usr/local/mysql-3306/logs/mysql-bin

# 初始化三次（每次指定不同的 datadir 和 basedir）
mysqld --initialize --user=mysql --datadir=/usr/local/mysql-3306/data --basedir=/usr/local/mysql
mysqld --initialize --user=mysql --datadir=/usr/local/mysql-3307/data --basedir=/usr/local/mysql
mysqld --initialize --user=mysql --datadir=/usr/local/mysql-3308/data --basedir=/usr/local/mysql

# 启动三次（每次指定不同的配置文件）
mysqld --defaults-file=/usr/local/mysql-3306/etc/my.cnf --daemonize
mysqld --defaults-file=/usr/local/mysql-3307/etc/my.cnf --daemonize
mysqld --defaults-file=/usr/local/mysql-3308/etc/my.cnf --daemonize

# 连接
mysql -uroot -p -S /tmp/mysql3306.sock
mysql -uroot -p -P 3307 -h 127.0.0.1
```

---

## 十、总结

| 步骤   | 关键命令                                             |
| ------ | ---------------------------------------------------- | ---- | ---------------- |
| 下载   | mysql-8.0.xx-linux-glibc2.xx-x86_64.tar.xz           |
| 解压   | `tar -xvf xxx.tar.xz` 到 `/usr/local/mysql`          |
| 建用户 | `useradd -r -g mysql mysql`                          |
| 初始化 | `mysqld --initialize --user=mysql ...`               |
| 启停   | `systemctl {start                                    | stop | restart} mysqld` |
| 改密码 | `ALTER USER 'root'@'localhost' IDENTIFIED BY 'xxx';` |
| 远程   | 改 `bind-address = 0.0.0.0` + 建用户 + 防火墙        |
| 备份   | `mysqldump --single-transaction`                     |
| 恢复   | `mysql < xxx.sql` 或 `mysqlbinlog`                   |

**最后一条建议**：

> **生产环境，永远先备份再操作。备份！备份！备份！重要的事说三遍。**

---

## 附录：常用命令速查

```bash
# 启停
systemctl {start|stop|restart|status} mysqld

# 登录
mysql -uroot -p
mysql -hHOST -PPORT -uUSER -p

# 备份恢复
mysqldump -uroot -p --databases mydb > mydb.sql
mysqldump -uroot -p --all-databases > all.sql
mysql -uroot -p < mydb.sql

# 主从
SHOW MASTER STATUS;
SHOW SLAVE STATUS\G
START SLAVE;
STOP SLAVE;

# 性能
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS\G
SHOW STATUS LIKE 'Threads_%';
EXPLAIN SELECT * FROM users WHERE id = 1;

# 维护
ANALYZE TABLE users;
OPTIMIZE TABLE users;
CHECK TABLE users;
REPAIR TABLE users;

# 杂项
mysqladmin -uroot -p ping
mysqladmin -uroot -p status
mysqladmin -uroot -p processlist
mysqladmin -uroot -p shutdown
```

---

> **下一篇预告**：《PostgreSQL 二进制安装实战：从单库到主从流复制》
>
> 如果觉得有用，**点赞 + 收藏 + 关注**，是我继续肝下去的最大动力！

---

_版权声明：本文采用 CC BY-NC-SA 4.0 协议，转载请保留作者及原文链接。_
