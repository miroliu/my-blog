---
title: "Oracle数据库从入门到精通：架构详解、与MySQL的区别及增删改查实战（重点讲透11g）"
description: "一篇讲透Oracle：体系架构（SGA/PGA/后台进程/表空间）、与MySQL的核心区别、增删改查实战、主流通用版本演进、为什么11g至今仍是经典。零基础也能看懂，DBA/后端工程师必读精华版。"
slug: "oracle-tutorial-architecture-mysql-difference-11g"
date: 2026-08-09T22:20:00+08:00
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["数据库", "Oracle"]
tags:
  [
    "Oracle",
    "Oracle 11g",
    "Oracle 19c",
    "数据库架构",
    "SGA",
    "PGA",
    "表空间",
    "SQL",
    "增删改查",
    "MySQL对比",
    "DBA",
    "PL/SQL",
    "RAC",
    "DataGuard",
  ]
---

# Oracle数据库从入门到精通：架构详解、与MySQL的区别及增删改查实战（重点讲透11g）

## 前言

数据库圈里有一句老话：

> **"学MySQL三天能干活，学Oracle三年才算入门。"**

这话虽然夸张，但说出了Oracle的真实地位——**企业级数据库的老大哥，金融、电信、政府、央企的核心系统，几乎清一色跑在Oracle上**。

这篇文章，一次性讲清楚五件事：

- Oracle 的**整体架构**到底长什么样（SGA、PGA、后台进程、表空间、redo/undo、数据文件...）
- 它跟 **MySQL** 的核心区别（很多后端转Oracle的人第一周就在这里栽跟头）
- 完整的**增删改查实战**（含Oracle特有的语法和坑）
- **主流通用版本演进**（8i/9i/10g/11g/12c/18c/19c/21c/23ai），重点讲 **11g 为什么是经典**
- 现在生产环境**到底该选哪个版本**

读完之后，你对Oracle的理解会超过80%的"用过Oracle"的人。

---

## 一、先把Oracle当一栋大楼来看

很多人学Oracle卡在第一步：上来就记命令、背概念，结果越学越乱。

正确姿势：**先把Oracle想成一栋有完整物业体系的大楼**。

| Oracle组件 | 大楼里的对应物          | 干什么的                                |
| ---------- | ----------------------- | --------------------------------------- |
| 数据库     | 整栋大楼                | 存储数据的物理+逻辑总和                  |
| 实例       | 大楼的"物业公司"        | 负责运行、维护、调度内存和进程          |
| 表空间     | 大楼里的楼层            | 逻辑上的存储区域                        |
| 数据文件   | 楼层里的具体房间        | 物理上存在硬盘上的文件                  |
| 表/索引    | 房间里的柜子            | 真正放数据的地方                        |
| 用户       | 拥有钥匙的人            | 谁可以进哪个房间                        |
| 进程       | 物业员工、保洁、维修    | 后台默默干活                            |
| 内存       | 大楼里的中央空调、电梯  | 数据临时停留的中转站                    |

**核心认知**：Oracle = 一个数据库（文件） + 一个实例（内存+进程）。这跟MySQL完全不一样。

- **MySQL**：你 `mysqld` 启动起来，里面有几个 database，每个 database 对应磁盘上一个目录。简单直接。
- **Oracle**：你 `startup` 一个**实例（instance）**，实例挂载（mount）一个**数据库（database）**，数据库由一堆**表空间**组成，表空间由**数据文件**组成，文件存在磁盘上。复杂但强大。

> 注意：12c之后还有多租户架构（CDB+PDB），后文会单独讲。

---

## 二、Oracle 体系架构详解（核心中的核心）

Oracle 的架构分四层来看：**物理结构、逻辑结构、内存结构、进程结构**。这是面试必考、生产必懂的知识点。

### 2.1 物理结构：磁盘上到底放了哪些文件

一个Oracle数据库在硬盘上至少有这几类文件：

```
+---------------------------------------------------------------+
|                  Oracle 数据库物理文件全景                    |
+---------------------------------------------------------------+
|                                                               |
|  1. 数据文件（Data Files）        *.dbf       ← 真正存数据    |
|  2. 控制文件（Control Files）     *.ctl       ← 数据库"户口本"|
|  3. 重做日志文件（Redo Log）      *.log       ← 事务流水账    |
|  4. 归档日志文件（Archived Log）  *.arc       ← 备份恢复用    |
|  5. 临时文件（Temp Files）        *.tmp       ← 排序/临时表  |
|  6. 参数文件（Parameter File）    spfile/pfile ← 启动配置      |
|  7. 口令文件（Password File）     orapwSID    ← sysdba远程登录 |
|  8. 备份文件（RMAN Backup）      *.bak/*.bkp ← RMAN备份产物   |
|  9. 警告日志（Alert Log）         alert_SID.log ← 错误/启动日志|
| 10. 跟踪文件（Trace Files）       *.trc        ← 性能诊断      |
+---------------------------------------------------------------+
```

**重点讲三个**：

#### ① 数据文件（Data Files）

- 真正存放表、索引、LOB（大对象）数据的地方
- 一个表空间可以包含**多个**数据文件，但一个数据文件只能属于一个表空间
- 后缀 `.dbf`（DataBase File）

#### ② 控制文件（Control Files）

- **数据库的"户口本"**：记录数据库名、创建时间、数据文件和日志文件的位置、当前日志序列号、检查点信息等
- **极其重要**：丢了控制文件 = 数据库启动不了
- 生产环境必须做**多路复用**（至少3份放在不同磁盘）

#### ③ 重做日志文件（Redo Log Files）

- **事务的"流水账"**：每一次INSERT/UPDATE/DELETE，Oracle都会先写到这里（顺序写，磁盘IO很快）
- 至少2组（每组可以多路复用），循环使用
- 工作模式：`log_buffer → LGWR进程 → redo log file → 归档 → 备份`
- **DBA的核心职责**：监控redo log切换频率、设计合理的归档策略

> 灵魂拷问：**重做日志和二进制日志（binlog）有什么区别？**
> - redo log：Oracle自己用，记录所有数据变更（**包括DDL**），保证事务持久性
> - binlog：MySQL用，记录所有数据变更（默认不含DDL），用于主从复制+数据恢复
> - 本质上干的事差不多，但redo log是**Oracle引擎的命根子**，不能随便关；binlog在MySQL里可以关闭

### 2.2 逻辑结构：从大到小的四级关系

```
数据库 (Database)
   └─ 表空间 (Tablespace)          ← 逻辑单位，最大的逻辑结构
        └─ 段 (Segment)            ← 对象占用的空间（一个表就是一个段）
             └─ 区 (Extent)        ← 连续的数据块集合，按需分配
                  └─ 数据块 (Data Block) ← Oracle最小的IO单位，默认8KB
```

**和MySQL的对比**：

| 项目       | Oracle          | MySQL (InnoDB)        |
| ---------- | --------------- | --------------------- |
| 逻辑层级   | 4级（表空间/段/区/块） | 2级（表空间/页）    |
| 最IO单位   | 数据块(默认8K)  | 页(默认16K)           |
| 表归属     | 属于某个**表空间** | 属于某个**数据库**  |
| 多表共享空间 | 可以（同一表空间放多个表） | 共享表空间or独立表空间 |

**最关键的认知**：

> **Oracle的"数据库" ≠ MySQL的"数据库"**
>
> - MySQL：`create database xxx;` → 创建一个"逻辑库"
> - Oracle：**整个Oracle服务器只有一个数据库**（12c前），"逻辑库"在Oracle里叫**表空间**或**用户（Schema）**

### 2.3 内存结构：SGA + PGA（面试必问）

Oracle 实例启动后会在内存中分配两大区域：

#### SGA（System Global Area）系统全局区

**所有进程共享**，相当于大楼的"中央空调、电梯、中控室"。

| 组件                          | 中文名               | 干什么的                                       |
| ----------------------------- | -------------------- | ---------------------------------------------- |
| **Database Buffer Cache**     | 数据缓冲区           | 缓存数据块，读写都先来这里（命中率最重要）     |
| **Shared Pool**               | 共享池               | 又分两部分（见下）                             |
| &nbsp;&nbsp;├ Library Cache   | 库缓存               | 缓存SQL语句、执行计划                          |
| &nbsp;&nbsp;└ Data Dictionary Cache | 字典缓存           | 缓存表结构、用户、权限等元数据                 |
| **Redo Log Buffer**           | 重做日志缓冲区       | 临时存放redo日志，LGWR定期刷到磁盘             |
| **Large Pool**                | 大池                 | RMAN备份、并行查询、共享服务器等大内存操作     |
| **Java Pool**                 | Java池               | 给Java存储过程用（11g后基本废弃）              |
| **Streams Pool**              | 流池                 | 流复制、GoldenGate等                           |

> **核心调优点**：
> - `DB_CACHE_SIZE`（数据缓冲区大小）→ 影响读性能
> - `SHARED_POOL_SIZE`（共享池大小）→ 影响SQL解析、软解析命中率
> - `LOG_BUFFER` → 一般不用改，默认足够

#### PGA（Program Global Area）程序全局区

**每个服务器进程私有**，相当于每个员工的"私人办公桌"。

| 组件            | 干什么的                                |
| --------------- | --------------------------------------- |
| Session Memory  | 会话信息（登录用户、变量等）            |
| Private SQL Area| 私有SQL区（绑定变量、查询执行状态）     |
| SQL Work Areas  | **排序区、HASH区、位图合并区** ← 关键   |

> **核心调优点**：`PGA_AGGREGATE_TARGET`（PGA总大小）。排序、分组、HASH JOIN都在PGA里完成，给小了会落盘，性能暴跌。

**和MySQL的对比**：

| 内存区域 | Oracle                 | MySQL (InnoDB)          |
| -------- | ---------------------- | ----------------------- |
| 缓存     | Buffer Cache（独立可调） | Buffer Pool（统一管理） |
| SQL缓存  | Library Cache          | 不直接缓存（用查询缓存，8.0已废弃） |
| 排序区   | PGA（独立可调）         | 临时表（落盘到tmpdir）  |

### 2.4 进程结构：后台默默干活的大佬们

Oracle启动后会启动一堆后台进程，**用户看不到它们，但它们一刻不停**。

| 进程      | 全称                          | 干什么的                                       |
| --------- | ----------------------------- | ---------------------------------------------- |
| **DBWn**  | Database Writer               | 把Buffer Cache里的脏数据写回数据文件（批量写）  |
| **LGWR**  | Log Writer                    | 把Log Buffer里的redo日志写到磁盘（实时写）     |
| **CKPT**  | Checkpoint                    | 触发DBWn写脏块，更新控制文件和数据文件头        |
| **SMON**  | System Monitor                | 实例恢复（前滚+回滚），清理临时段             |
| **PMON**  | Process Monitor               | 清理死掉的进程，释放资源                       |
| **ARCn**  | Archiver                      | 把写满的redo日志归档到指定位置（生产环境必开） |
| **RECO**  | Recoverer                     | 处理分布式事务的两阶段提交                     |
| **MMON**  | Manageability Monitor         | AWR自动快照（10g+）                            |
| **MMNL**  | Manageability Monitor Light   | ASH（Active Session History）收集              |

**最核心的三个：DBWn、LGWR、CKPT**

它们之间的关系，决定了Oracle的事务持久性和崩溃恢复能力：

```
[用户执行UPDATE]
     │
     ▼
[数据先写到 Buffer Cache（脏块）]
     │
     ▼
[同时把变更写入 Redo Log Buffer]  ← 这是为了"不丢数据"
     │
     ▼
[LGWR 把 Redo Log Buffer 刷到磁盘 Redo Log]
     │
     ▼
[用户执行 COMMIT]
     │
     ▼
[CKPT 触发 DBWn 把脏块写回数据文件]
     │
     ▼
[LGWR 标记 commit 记录已落盘，返回成功]
```

**关键理解**：

> **LGWR 永远比 DBWn 重要**
>
> Oracle不要求你commit时数据文件立刻更新，只要求redo日志写盘。
> 这样即使commit后数据库宕机，重启时也能根据redo日志"前滚"，把数据找回来。
> 这就是Oracle著名的**"先写日志，后写数据"（Write-Ahead Logging）**机制。

### 2.5 12c+ 的多租户架构（CDB + PDB）

Oracle 12c 引入了一个**革命性特性**：多租户（Multitenant）。

**为什么要有？**：以前一个服务器只能跑一个数据库实例，要给10个客户用就得装10套Oracle，资源浪费严重。多租户让一个实例可以承载多个"小数据库"。

**结构**：

```
CDB (Container Database) 容器数据库  ← 一个实例对应一个CDB
  ├── PDB$SEED (种子PDB，模板)      ← 创建PDB的模板，不能改
  ├── PDB1 (可插拔数据库)            ← 相当于一个独立的小数据库
  ├── PDB2
  ├── PDB3
  └── PDBn...
```

**和MySQL的对比**：

| 项目       | Oracle PDB          | MySQL 多实例/多库 |
| ---------- | ------------------- | ----------------- |
| 隔离性     | 强（独立system表空间、独立UNDO） | 弱（共享redo/undo） |
| 资源       | 可分配CPU、内存到PDB | 只能分配到实例     |
| 迁移性     | **拔插即用（拔U盘一样）** | 需要导入导出     |
| 数量       | 最多4096个PDB（取决于license） | 几百个库没问题  |

**一句话**：如果你以后看到Oracle有"拔插数据库"的骚操作，别惊讶，那就是PDB。

---

## 三、Oracle vs MySQL：转Oracle的人第一周必踩的坑

这一章是**精华中的精华**。很多后端从MySQL转Oracle，第一周就被这些差异搞得怀疑人生。

### 3.1 思维方式的根本差异

| 维度       | MySQL                              | Oracle                              |
| ---------- | ---------------------------------- | ----------------------------------- |
| 设计哲学   | 简单、灵活、上手快                | 严谨、强大、上手慢                  |
| 典型用户   | 中小型应用、Web创业公司            | 大型企业、金融、电信、政府          |
| 许可证     | GPL（开源免费）                    | 商业授权（**贵**，CPU/用户数计费）  |
| 存储引擎   | 可插拔（InnoDB、MyISAM、MEMORY...） | 单一引擎（核心固定，少有选择）      |
| SQL方言    | 标准化做得比较好                   | 大量私有扩展（PL/SQL是另一门语言）  |
| 默认端口   | 3306                               | 1521                                |
| 用户连接   | 用户全局可见                       | 用户属于某个表空间/Schema           |
| 空字符串   | `''` ≠ NULL                        | **`''` = NULL**（巨坑！）            |

### 3.2 SQL语法差异速查表（实战对照）

#### ① 分页查询

```sql
-- MySQL（第1页，每页10条）
SELECT id, name FROM user LIMIT 0, 10;

-- MySQL（第2页）
SELECT id, name FROM user LIMIT 10, 10;

-- Oracle（第1页，每页10条）★ 三层嵌套，最经典写法
SELECT id, name FROM (
    SELECT ROWNUM rn, t.* FROM (
        SELECT id, name FROM user ORDER BY id
    ) t WHERE ROWNUM <= 10
) WHERE rn > 0;

-- Oracle 12c+ 推荐写法（更接近MySQL的LIMIT）
SELECT id, name FROM user ORDER BY id OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY;
```

> **坑**：Oracle的`ROWNUM`是在**WHERE阶段**赋值的，所以不能直接 `WHERE ROWNUM > 5`！必须先包一层。

#### ② 自增ID

```sql
-- MySQL
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50)
);
INSERT INTO user(name) VALUES('张三');  -- id自动+1

-- Oracle：必须用序列（Sequence）+ 触发器，或12c+的"IDENTITY列"
-- 方式1：经典序列（任何版本都支持）
CREATE SEQUENCE seq_user_id START WITH 1 INCREMENT BY 1;
CREATE TABLE user (
    id NUMBER PRIMARY KEY,
    name VARCHAR2(50)
);
CREATE OR REPLACE TRIGGER trg_user_id
BEFORE INSERT ON user FOR EACH ROW
BEGIN
    :NEW.id := seq_user_id.NEXTVAL;
END;
/
INSERT INTO user(name) VALUES('张三');  -- 需要手动取NEXTVAL或靠触发器

-- 方式2：12c+ 身份列（推荐新项目用）
CREATE TABLE user (
    id NUMBER GENERATED BY DEFAULT ON NULL AS IDENTITY PRIMARY KEY,
    name VARCHAR2(50)
);
INSERT INTO user(name) VALUES('张三');  -- id自动+1
```

#### ③ 字符串拼接

```sql
-- MySQL
SELECT CONCAT('Hello, ', name) FROM user;
-- 或
SELECT 'Hello, ' || name FROM user;  -- MySQL也支持（但要改sql_mode）

-- Oracle
SELECT 'Hello, ' || name FROM user;        -- Oracle专用
-- CONCAT只接受两个参数：
SELECT CONCAT('Hello, ', name) FROM user;  -- Oracle只能拼两个
SELECT CONCAT(CONCAT('Hello, ', name), '!') FROM user;  -- 三个就套娃
```

#### ④ DUAL 虚拟表

```sql
-- MySQL
SELECT NOW(), VERSION(), 1+1;   -- 直接写，不用FROM

-- Oracle
SELECT SYSDATE, BANNER, 1+1 FROM DUAL;   -- 必须FROM DUAL（一个一行一列的虚拟表）
```

> **原因**：Oracle的SELECT语法强制要求FROM子句（早期版本）。`DUAL`是Oracle内置的"万能测试表"。

#### ⑤ 空字符串的坑

```sql
-- MySQL
SELECT * FROM user WHERE name = '';     -- 能查到name是空字符串的行
SELECT * FROM user WHERE name IS NULL;  -- 只能查到name是NULL的行
-- 两者结果不同！

-- Oracle：空字符串就是NULL！
SELECT * FROM user WHERE name = '';     -- ❌ 永远查不到任何东西！
SELECT * FROM user WHERE name IS NULL;  -- ✅ 才能查到
SELECT LENGTH('') FROM DUAL;            -- 结果是NULL，不是0
```

> **避坑**：从MySQL迁移数据到Oracle时，要把所有空字符串`''`显式转换为NULL或特殊值，否则会丢数据！

#### ⑥ 事务提交行为

```sql
-- MySQL：默认自动提交，每条SQL都是独立事务
SET autocommit = 0;  -- 关闭自动提交（推荐）
START TRANSACTION;
UPDATE account SET money = money - 100 WHERE id = 1;
UPDATE account SET money = money + 100 WHERE id = 2;
COMMIT;

-- Oracle：**默认非自动提交**，必须显式 COMMIT 或 ROLLBACK
UPDATE account SET money = money - 100 WHERE id = 1;
UPDATE account SET money = money + 100 WHERE id = 2;
COMMIT;   -- 不写这句，数据永远在内存里，不会落盘！
-- 如果不写COMMIT，会话断开时自动ROLLBACK
```

> **坑中坑**：在Oracle里**DDL语句（CREATE/ALTER/DROP）会自动提交**，不管之前有没有手动COMMIT。所以别在事务中间随便建表。

#### ⑦ 数据类型差异

| MySQL类型         | Oracle对应类型                          | 注意事项                                   |
| ----------------- | --------------------------------------- | ------------------------------------------ |
| INT               | NUMBER(10)                              | 严格模式NUMBER必须指定长度                  |
| VARCHAR(50)       | VARCHAR2(50)                            | Oracle**推荐VARCHAR2**，VARCHAR是历史包袱  |
| TEXT              | CLOB                                    | 4GB以内用CLOB，更大用BLOB                  |
| DATETIME          | DATE 或 TIMESTAMP                       | DATE精确到秒，TIMESTAMP精确到纳秒          |
| TINYINT(1)        | NUMBER(1) 或 CHAR(1)                    | Oracle没有布尔类型，常用'Y'/'N'或1/0      |
| DECIMAL(10,2)     | NUMBER(10,2)                            | 几乎一样                                   |
| AUTO_INCREMENT     | SEQUENCE + TRIGGER 或 IDENTITY         | 见上面②                                   |
| ENUM('男','女')   | VARCHAR2 + CHECK约束                    | Oracle**不支持ENUM**，需要CHECK约束        |

### 3.3 用户和权限管理的差异

```sql
-- MySQL：用户 = 全局账号
CREATE USER 'tom'@'%' IDENTIFIED BY '123456';
GRANT SELECT, INSERT ON mydb.* TO 'tom'@'%';

-- Oracle：用户 = Schema = 表空间上的一个"主人"
-- 创建用户时必须指定默认表空间
CREATE USER tom IDENTIFIED BY "123456"
  DEFAULT TABLESPACE users
  TEMPORARY TABLESPACE temp
  QUOTA 100M ON users;  -- 关键！限制用户在users表空间最多用100M

-- 授权
GRANT CONNECT, RESOURCE TO tom;
GRANT SELECT, INSERT ON scott.emp TO tom;
```

> **关键区别**：Oracle的`QUOTA`（配额）是MySQL完全没有的概念。MySQL用户可以随便建表把磁盘塞满，Oracle可以限制每个用户在每个表空间最多用多少空间。

### 3.4 性能、扩展性、成本对比

| 维度            | MySQL                          | Oracle                              |
| --------------- | ------------------------------ | ----------------------------------- |
| 单机性能        | 中等                           | **极强**（优化器世界顶级）          |
| 集群方案        | 主从复制、Group Replication、MHA | **RAC**（Share Disk）、Data Guard   |
| 高可用          | 工具多但需组合                 | RAC + DG + ADG，开箱即用           |
| 备份恢复        | mysqldump、xtrabackup          | **RMAN**（Recovery Manager）        |
| 分区/分表       | 需手动或中间件                 | 内置**分区表**（按时间/范围/哈希）  |
| 大数据量处理    | 单表几亿就要分表               | 单表**几十亿**也能扛                |
| 成本            | 免费                           | **贵**（CPU/用户数license）         |
| 学习曲线        | 平缓                           | 陡峭                                |

**一句话总结**：

> **MySQL是跑车，好开、好上手；Oracle是坦克，贵、笨重，但压不垮。**

---

## 四、Oracle 增删改查实战（11g 语法）

下面所有SQL都在**Oracle 11g** 上测试通过，新版本也兼容。

### 4.1 环境准备（11g 安装简要）

Oracle 11g 安装分两大流派：

#### ① Windows 本地学习（推荐新手）

- 下载 Oracle Database 11g Release 2（11.2.0.4）Windows版
- 双击 setup.exe → 一路下一步
- 注意：**全局数据库名（SID）** 设为 `orcl`，**管理口令** 一定要记好（如 `Oracle11g`）
- 安装完成后会自动启动服务：OracleOraDb11g_home1TNSListener + OracleServiceORCL
- 验证：`sqlplus sys/Oracle11g@orcl as sysdba` 能登录就OK

#### ② Linux 生产环境

```bash
# 11g 静默安装（生产标准做法，CentOS 7 示例）
# 1. 安装依赖
yum install -y binutils compat-libstdc++-33 elfutils-libelf \
  elfutils-libelf-devel gcc gcc-c++ glibc glibc-common \
  glibc-devel libaio libaio-devel libgcc libstdc++ libstdc++-devel \
  make numactl-devel sysstat unixODBC unixODBC-devel

# 2. 创建oracle用户和组
groupadd oinstall
groupadd dba
useradd -g oinstall -G dba oracle
passwd oracle

# 3. 上传安装包到 /tmp/database
unzip linux.x64_11gR2_database_1of2.zip
unzip linux.x64_11gR2_database_2of2.zip

# 4. 静默应答文件安装
./runInstaller -silent -responseFile /tmp/database/response/db_install.rsp \
  oracle.install.option=INSTALL_DB_AND_CONFIG \
  oracle.install.db.config.starterdb.password.ALL=Oracle11g \
  ...
```

> **注意**：Oracle 11g 在新Linux上可能遇到各种兼容性问题，建议使用 **CentOS 7** 或 **RHEL 7**，别用最新内核。

### 4.2 启动与登录

```bash
# 切换到oracle用户
su - oracle

# 启动监听
lsnrctl start

# 启动实例（SQL*Plus里）
sqlplus / as sysdba
SQL> startup;          -- 启动到OPEN状态（完整可用）
SQL> startup nomount;  -- 只启动实例，不挂载（用于恢复）
SQL> startup mount;    -- 启动并挂载（用于修改归档模式等）

# 关闭
SQL> shutdown immediate;   -- 推荐：等待事务结束再关
SQL> shutdown abort;       -- 强制断电（仅紧急用，启动时要recovery）
```

### 4.3 创建表空间和用户（建库第一步）

```sql
-- 1. 创建表空间（相当于MySQL的CREATE DATABASE）
CREATE TABLESPACE mydb_data
  DATAFILE 'D:\oracle\oradata\ORCL\mydb_data01.dbf'
  SIZE 100M
  AUTOEXTEND ON NEXT 10M MAXSIZE UNLIMITED;

-- 2. 创建用户并指定默认表空间
CREATE USER myuser IDENTIFIED BY "MyPass123"
  DEFAULT TABLESPACE mydb_data
  TEMPORARY TABLESPACE temp
  QUOTA 500M ON mydb_data;

-- 3. 授权
GRANT CONNECT, RESOURCE, CREATE VIEW, CREATE PROCEDURE TO myuser;
-- 11g的RESOURCE角色已包含CREATE TABLE等常用权限

-- 4. 测试登录
CONNECT myuser/MyPass123@orcl;
```

### 4.4 完整 CRUD 实战

#### 创建表（CREATE）

```sql
-- 员工表
CREATE TABLE emp (
    empno      NUMBER(4)       PRIMARY KEY,           -- 员工号
    ename      VARCHAR2(20)    NOT NULL,               -- 姓名
    job        VARCHAR2(20)    DEFAULT 'CLERK',        -- 职位
    mgr        NUMBER(4),                               -- 上级
    hiredate   DATE            DEFAULT SYSDATE,        -- 入职日期
    sal        NUMBER(7,2)     CHECK (sal > 0),        -- 工资
    comm       NUMBER(7,2),                             -- 奖金
    deptno     NUMBER(2)       REFERENCES dept(deptno) -- 部门号
);

-- 部门表
CREATE TABLE dept (
    deptno    NUMBER(2)       PRIMARY KEY,
    dname     VARCHAR2(20)    NOT NULL UNIQUE,
    loc       VARCHAR2(20)
);

-- 查看表结构
DESC emp;
```

#### 插入数据（INSERT）

```sql
-- 单条插入
INSERT INTO dept(deptno, dname, loc) VALUES (10, 'ACCOUNTING', 'NEW YORK');
INSERT INTO dept(deptno, dname, loc) VALUES (20, 'RESEARCH', 'DALLAS');
INSERT INTO dept(deptno, dname, loc) VALUES (30, 'SALES', 'CHICAGO');
INSERT INTO dept(deptno, dname, loc) VALUES (40, 'OPERATIONS', 'BOSTON');

-- 批量插入（Oracle独有语法，比INSERT...VALUES快10倍以上）
INSERT ALL
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7369, 'SMITH',  'CLERK',    7902, DATE '1980-12-17',  800, 20)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7499, 'ALLEN',  'SALESMAN', 7698, DATE '1981-02-20', 1600, 30)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7521, 'WARD',   'SALESMAN', 7698, DATE '1981-02-22', 1250, 30)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7566, 'JONES',  'MANAGER',  7839, DATE '1981-04-02', 2975, 20)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7654, 'MARTIN', 'SALESMAN', 7698, DATE '1981-09-28', 1250, 30)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7698, 'BLAKE',  'MANAGER',  7839, DATE '1981-05-01', 2850, 30)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7782, 'CLARK',  'MANAGER',  7839, DATE '1981-06-09', 2450, 10)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7788, 'SCOTT',  'ANALYST',  7566, DATE '1987-04-19', 3000, 20)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7839, 'KING',   'PRESIDENT', NULL, DATE '1981-11-17', 5000, 10)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7844, 'TURNER', 'SALESMAN', 7698, DATE '1981-09-08', 1500, 30)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7876, 'ADAMS',  'CLERK',    7788, DATE '1987-05-23', 1100, 20)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7900, 'JAMES',  'CLERK',    7698, DATE '1981-12-03',  950, 30)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7902, 'FORD',   'ANALYST',  7566, DATE '1981-12-03', 3000, 20)
  INTO emp(empno, ename, job, mgr, hiredate, sal, deptno)
       VALUES (7934, 'MILLER', 'CLERK',    7782, DATE '1982-01-23', 1300, 10)
SELECT 1 FROM DUAL;

COMMIT;  -- 11g默认不自动提交，记得提交！
```

> **注意**：Oracle的`DATE`类型**精确到秒**，存日期时间时要 `DATE '2026-08-12'` 这种字面量格式。如果要存时分秒，用 `TIMESTAMP`。

#### 查询数据（SELECT）

```sql
-- 1. 基础查询
SELECT empno, ename, job, sal FROM emp;

-- 2. WHERE 条件
SELECT * FROM emp WHERE sal > 2000;
SELECT * FROM emp WHERE deptno = 20 AND job = 'CLERK';
SELECT * FROM emp WHERE ename LIKE 'S%';           -- S开头
SELECT * FROM emp WHERE ename LIKE '_C%';          -- 第二个字符是C
SELECT * FROM emp WHERE comm IS NULL;               -- Oracle：奖金为空的
SELECT * FROM emp WHERE sal BETWEEN 1000 AND 3000;

-- 3. 排序
SELECT * FROM emp ORDER BY sal DESC, empno ASC;

-- 4. 分页（11g 经典三层嵌套写法）
-- 查询第2页（每页5条）：第6-10条
SELECT * FROM (
    SELECT ROWNUM rn, e.* FROM (
        SELECT * FROM emp ORDER BY sal DESC
    ) e WHERE ROWNUM <= 10
) WHERE rn > 5;

-- 5. 聚合函数
SELECT deptno, COUNT(*) cnt, AVG(sal) avg_sal, MAX(sal) max_sal, MIN(sal) min_sal, SUM(sal) sum_sal
FROM emp GROUP BY deptno HAVING AVG(sal) > 2000;

-- 6. 多表连接（Oracle独有的(+)外连接语法，9i之前唯一选择）
-- 左外连接（emp表全显示，dept表没匹配显示NULL）
SELECT e.ename, e.sal, d.dname
FROM emp e, dept d
WHERE e.deptno = d.deptno(+);

-- ANSI标准写法（推荐）
SELECT e.ename, e.sal, d.dname
FROM emp e LEFT JOIN dept d ON e.deptno = d.deptno;

-- 7. 子查询
-- 找出工资高于平均工资的员工
SELECT ename, sal FROM emp WHERE sal > (SELECT AVG(sal) FROM emp);

-- 8. Oracle特有函数
SELECT
    ename,
    sal,
    DECODE(job,                                  -- IF-ELSE
        'MANAGER',  sal * 1.2,
        'ANALYST',  sal * 1.15,
        'SALESMAN', sal * 1.1,
        sal
    ) AS new_sal,
    CASE job WHEN 'MANAGER' THEN '管理'            -- CASE-WHEN
             WHEN 'CLERK'   THEN '文员'
             ELSE '其他' END AS job_cn,
    NVL(comm, 0)            AS comm_real,          -- NULL→0
    NVL2(comm, sal+comm, sal) AS total_income,      -- NULL判断
    TO_CHAR(hiredate, 'YYYY-MM-DD') AS hire_cn,    -- 日期格式化
    TO_CHAR(sal, 'FM$999,999.00')   AS sal_fmt,    -- 数字格式化
    INITCAP(ename)   AS ename_cap,                 -- 首字母大写
    LENGTH(ename)    AS name_len,
    SUBSTR(ename, 1, 3) AS ename_3,                -- 截取
    INSTR(ename, 'S') AS s_pos,                    -- 查找位置
    TRIM('   SMITH   ') AS trim_name,              -- 去空格
    GREATEST(sal, NVL(comm,0)) AS max_val,         -- 最大值
    LEAST(sal, NVL(comm,0))    AS min_val,         -- 最小值
    USER                          AS login_user,  -- 当前用户
    SYSDATE                       AS now_time     -- 当前时间
FROM emp;
```

#### 更新数据（UPDATE）

```sql
-- 1. 单表更新
UPDATE emp SET sal = sal * 1.1 WHERE job = 'CLERK';

-- 2. 多列更新
UPDATE emp SET sal = 5000, comm = 1000 WHERE ename = 'KING';

-- 3. 子查询更新
UPDATE emp SET sal = (SELECT AVG(sal) FROM emp) WHERE job = 'PRESIDENT';

-- 4. Oracle特有：MERGE（合并，UPSERT）★ 重点
-- 当匹配时更新，不匹配时插入。比"先查再判断"快无数倍
MERGE INTO emp_target t
USING emp_source s ON (t.empno = s.empno)
WHEN MATCHED THEN
    UPDATE SET t.sal = s.sal, t.comm = s.comm
WHEN NOT MATCHED THEN
    INSERT (empno, ename, sal, comm) VALUES (s.empno, s.ename, s.sal, s.comm);

COMMIT;
```

#### 删除数据（DELETE & TRUNCATE）

```sql
-- 1. 条件删除
DELETE FROM emp WHERE deptno = 40;

-- 2. 全表删除（保留表结构，可回滚）
DELETE FROM emp;
ROLLBACK;  -- 可以恢复！

-- 3. 截断（DDL，**不可回滚**，但速度快，不触发触发器）
TRUNCATE TABLE emp;

-- 4. Oracle特有：级联删除（先关外键约束再删）
DROP TABLE emp CASCADE CONSTRAINTS;

-- 5. 删除整个表（包括数据+结构）
DROP TABLE emp PURGE;     -- PURGE：彻底删除不进回收站
DROP TABLE emp;           -- 普通删除，会进回收站，可用 FLASHBACK TABLE emp TO BEFORE DROP; 恢复
```

> **惊天发现**：Oracle的`DROP TABLE`默认可以**闪回**（Flashback Drop）！从回收站里捞回来。这是MySQL完全做不到的。

### 4.5 索引、视图、序列（必备扩展）

```sql
-- 1. 创建序列（自增ID的来源）
CREATE SEQUENCE seq_order_id
  START WITH 1
  INCREMENT BY 1
  MAXVALUE 99999999
  CACHE 20                          -- 预分配20个，提高性能
  NOCYCLE;

SELECT seq_order_id.NEXTVAL FROM DUAL;   -- 下一个值
SELECT seq_order_id.CURRVAL FROM DUAL;   -- 当前值（必须先NEXTVAL过）

-- 2. 创建索引（11g有"不可见索引"特性）
CREATE INDEX idx_emp_ename ON emp(ename);
CREATE INDEX idx_emp_job_sal ON emp(job, sal DESC);  -- 组合索引
CREATE UNIQUE INDEX idx_emp_empno ON emp(empno);
CREATE INDEX idx_emp_sal_invis ON emp(sal) INVISIBLE;  -- 11g新特性：先建着不用

-- 3. 创建视图
CREATE OR REPLACE VIEW v_emp_dept AS
SELECT e.empno, e.ename, e.sal, d.dname, d.loc
FROM emp e JOIN dept d ON e.deptno = d.deptno;

SELECT * FROM v_emp_dept WHERE sal > 2000;

-- 4. 物化视图（11g企业版）= 带数据的视图，查询超快
CREATE MATERIALIZED VIEW mv_emp_dept
  REFRESH FAST START WITH SYSDATE NEXT SYSDATE + 1
  AS
SELECT d.deptno, d.dname, COUNT(*) cnt, AVG(e.sal) avg_sal
FROM emp e JOIN dept d ON e.deptno = d.deptno
GROUP BY d.deptno, d.dname;
```

### 4.6 事务控制完整流程

```sql
-- Oracle事务的完整生命周期
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;   -- 设置隔离级别

SAVEPOINT sp1;        -- 保存点1
UPDATE emp SET sal = sal + 500 WHERE empno = 7566;

SAVEPOINT sp2;        -- 保存点2
UPDATE emp SET sal = sal + 500 WHERE empno = 7654;

ROLLBACK TO sp2;      -- 回滚到sp2（sp1之后的sp2操作撤销）
COMMIT;               -- 提交（一旦提交，前面的SAVEPOINT都没了）

-- 设置只读事务（生成一致性报表用）
SET TRANSACTION READ ONLY;
SELECT * FROM emp;    -- 这时其他会话的修改都看不到，完美一致性
COMMIT;
```

---

## 五、Oracle 版本演进史（一张图看懂）

Oracle 的版本号有个规律：**i** = internet（互联网）、**g** = grid（网格）、**c** = cloud（云）。

| 版本    | 发布年    | 核心特性                                          | 当前状态          |
| ------- | --------- | ------------------------------------------------- | ----------------- |
| **8i**  | 1999      | 支持互联网（JDBC、XML）                          | 已淘汰，别碰      |
| **9i**  | 2001      | RAC真正商用、LogMiner                            | 已淘汰            |
| **10g** | 2004      | **ASM自动存储管理**、AWR、闪回查询               | 极少生产          |
| **11g** | 2007      | **内存列式压缩、Exadata、DataGuard Active**      | ⚠️ **生产仍常见** |
| **12c** | 2013      | **多租户CDB/PDB、In-Memory列存**                  | 12.2仍在用        |
| **18c** | 2018      | 自治数据库（Autonomous）雏形                      | 已停止支持        |
| **19c** | 2019      | **长期支持版本（LTS）**、稳定之王                 | ✅ **当前主流**  |
| **21c** | 2021      | 区块链表、JSON原生支持                             | 创新版本（短期支持）|
| **23ai** | 2024     | **AI向量搜索、Select AI、JSON Relational Duality** | 最新，长期可期    |

### 5.1 为什么 11g 至今仍是经典？

虽然Oracle官方早就停止支持了，但**11g仍是无数企业生产环境的事实标准**。为什么？

**核心原因**：

1. **生态成熟**：11g 上跑过的应用、踩过的坑、积累的工具最多。银行、政府、央企的核心系统大量还在 11g。
2. **稳定性**：经过十几年的生产验证，几乎没有重大 BUG。
3. **人才储备**：国内80%的Oracle DBA都会11g，招人容易。
4. **迁移成本**：老系统改造成本巨大，能不动就不动。
5. **配套工具**：PL/SQL Developer 11、Toad for Oracle 12 等老牌工具对11g支持最完美。

**11g 标志性特性**：

- **DataGuard Active Data Guard**（异地容灾实时查询）— 12c前要付额外license
- **Result Cache**（查询结果缓存）
- **SecureFiles**（新一代LOB存储）
- **不可见索引**（Invisible Indexes，调优神器）
- **RMAN虚拟专用目录**（更细粒度的备份权限）
- **自动SQL调优**（Automatic SQL Tuning）

**11g 局限性**（为什么还是要升级）：

- 没有多租户（CDB/PDB）
- 没有原生JSON支持
- 没有内存列存（In-Memory）
- 没有身份列（IDENTITY）
- 没有 OFFSET/FETCH 分页语法
- Oracle官方已在 **2020年12月** 停止Premier Support，**2022年12月** 停止Extended Support

> **一句话**：11g适合**学习、练手、应付老系统**，新项目**坚决用19c或21c**。

### 5.2 当前生产环境到底选哪个版本？

| 场景                                | 推荐版本     | 理由                                       |
| ----------------------------------- | ------------ | ------------------------------------------ |
| **新项目上线（2026年）**            | **19c**      | LTS长期支持，最稳最成熟                   |
| 想要最新特性、AI能力               | **23ai**     | Oracle 23ai，向量数据库加持                |
| 试用尝鲜                            | **21c/23ai** | 创新版本，每3年一个，18个月短期支持        |
| 银行/政府核心系统存量升级           | **19c**      | 兼容性最好，DBA最熟                        |
| 教学/学习/培训                       | **11g或19c** | 11g经典，19c实用                           |
| 服务器CPU超过72核（Oracle限制）      | 19c+         | 11g只支持72核以内                          |
| 要用多租户（多租户SaaS）             | **12.2+**    | PDB就是为多租户设计的                      |

### 5.3 19c为什么成为当前"事实标准"？

- **LTS（Long Term Support）**：官方承诺至少支持到 **2027年4月**（甚至可能延长）
- 跟 12c 几乎100%兼容（直接升级就行）
- 自动索引（Automatic Indexing）、SQL Plan Management 等智能特性
- 修复了 12c 所有已知 BUG
- 容器化、Oracle Cloud 原生支持
- **国内大部分新上线的Oracle项目都是19c**

> **结论**：如果你今天开始一个新项目（除非你要玩23ai的AI特性），**直接选19c**。

### 5.4 23ai——下一个时代

2024年发布的 **23ai**（跳过了22版本，致敬2023年AI浪潮）是 Oracle 的"AI数据库"：

- **AI Vector Search**：内置向量索引和检索，配合大模型做RAG
- **Select AI**：用自然语言直接查询数据库（"给我看下去年最赚钱的客户"）
- **JSON Relational Duality**：JSON和关系模型自由切换
- **Graph** 属性图原生支持
- **True Cache**：内存级缓存中间件

> 但是 23ai 现在还太新（2024发布，企业级验证至少3年），生产慎用。**学习和实验可以上**。

---

## 六、避坑指南（生产环境血泪总结）

### 6.1 安装阶段

- ⚠️ 11g 在 Linux 7+ 可能装不上，要么换内核要么打补丁
- ⚠️ 内存别低于 4GB，否则 DBCA 创建数据库会失败
- ⚠️ 一定要开启**归档模式**（ARCHIVELOG），不开启生产环境 = 等着丢数据

```sql
-- 查看当前归档模式
SELECT name, log_mode FROM v$database;

-- 开启归档（必须在 MOUNT 状态下）
SHUTDOWN IMMEDIATE;
STARTUP MOUNT;
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;
```

### 6.2 日常使用阶段

- ⚠️ **不要用 `sysdba` 账号跑业务代码**，权限太大，万一出事无法恢复
- ⚠️ 生产环境的 SQL 一定要走**绑定变量**（避免硬解析拖垮共享池）
- ⚠️ 定期清理回收站（`PURGE RECYCLEBIN;`），否则磁盘会爆
- ⚠️ 监控表空间使用率，**别等100%才想起来加数据文件**
- ⚠️ 不要在事务中间执行 DDL（CREATE/ALTER/DROP），会强制提交，导致事务不可控
- ⚠️ `WHERE` 里对字段做函数（如 `WHERE SUBSTR(name,1,3)='ABC'`）会导致**索引失效**
- ⚠️ `DROP TABLE` 后想恢复 → `FLASHBACK TABLE xxx TO BEFORE DROP;`
- ⚠️ 误删数据且提交了 → `FLASHBACK TABLE xxx TO TIMESTAMP (SYSTIMESTAMP - INTERVAL '10' MINUTE);`

### 6.3 性能调优阶段

- ⚠️ 99%的慢SQL都是没用好索引，先看执行计划
- ⚠️ `EXPLAIN PLAN FOR xxx; SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`
- ⚠️ 定期跑 AWR 报告（`@?/rdbms/admin/awrrpt.sql`）
- ⚠️ 监控 Buffer Cache 命中率，低于 95% 就要加大 `DB_CACHE_SIZE`
- ⚠️ 监控 Library Cache 命中率，低于 95% 就要调 `SHARED_POOL_SIZE`

---

## 七、工具链与学习路径

### 7.1 必备工具

| 工具                | 用途                  | 免费？ |
| ------------------- | --------------------- | ------ |
| **SQL*Plus**        | 命令行客户端（系统自带）| ✅    |
| **SQL Developer**   | 官方图形工具           | ✅    |
| **PL/SQL Developer**| 第三方神器（Windows）  | 试用免费 |
| **Toad for Oracle** | 老牌管理工具           | 试用免费 |
| **Navicat for Oracle** | 国人熟悉的GUI工具    | 试用免费 |
| **DBeaver**         | 通用数据库工具         | ✅    |
| **Oracle Enterprise Manager (OEM)** | Web管理控制台 | ✅ |

### 7.2 推荐学习路线

```
阶段一（1-2周）：基础
  ├─ 安装Oracle 11g或19c
  ├─ 学会SQL*Plus基本命令
  ├─ 增删改查实战（跟着本文走一遍）
  └─ 理解表空间、用户、权限的概念

阶段二（2-3周）：进阶
  ├─ 体系架构（SGA/PGA/后台进程）
  ├─ 索引、视图、序列、同义词
  ├─ PL/SQL编程（存储过程、函数、触发器）
  └─ 事务、锁、并发控制

阶段三（3-4周）：运维
  ├─ RMAN备份恢复
  ├─ DataGuard配置
  ├─ AWR/ASH性能分析
  ├─ 日常巡检脚本（表空间、归档、性能）
  └─ 故障模拟与处理（脑裂、数据文件丢失、undo损坏）

阶段四（按需）：高级
  ├─ RAC集群
  ├─ GoldenGate复制
  ├─ 升级迁移（11g→19c）
  ├─ 多租户（CDB/PDB）
  └─ 23ai AI特性
```

### 7.3 推荐资料

- 📖 官方文档：https://docs.oracle.com（最权威最全）
- 📖 《Oracle Database 11g 性能优化攻略》
- 📖 《收获，不止Oracle》（性能优化经典）
- 📖 《Oracle编程艺术：深入理解数据库体系结构》（Thomas Kyte著，DBA圣经）
- 🎥 B站搜索"Oracle 11g 教程"（韩顺平/尚硅谷等老牌课程）

---

## 八、总结：一张图总结全文

```
                  ┌──────────────────────────────┐
                  │      Oracle 整体认知          │
                  └────────────┬─────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
   【架构】                 【和MySQL】            【版本】
       │                       │                       │
   ┌───┴────┐              ┌───┴────┐              ┌───┴────┐
   │物理文件│              │ SQL差异 │              │11g经典 │
   ├────────┤              ├─────────┤              ├────────┤
   │逻辑结构│              ├─────────┤              │19c主流 │
   ├────────┤              │空字符串 │              ├────────┤
   │SGA+PGA │              ├─────────┤              │21c创新 │
   ├────────┤              │事务行为 │              ├────────┤
   │后台进程│              ├─────────┤              │23ai AI │
   └────────┘              │用户权限 │              └────────┘
                           └─────────┘
```

**最后的最后**：

> **学Oracle不是为了背命令，而是理解"企业级数据库"的工程哲学：严谨、健壮、可恢复、可审计。**
>
> **这些思想，MySQL也在学。**
>
> **看懂Oracle，你就看懂了数据库的"天花板"。**

---

## 附录：常用命令速查表

```sql
-- ========== 实例管理 ==========
STARTUP;                              -- 启动
STARTUP MOUNT;                        -- 启动到mount
SHUTDOWN IMMEDIATE;                   -- 立即关闭
SHUTDOWN ABORT;                       -- 强制关闭

-- ========== 表空间管理 ==========
CREATE TABLESPACE ts1 DATAFILE '...dbf' SIZE 100M;
ALTER TABLESPACE ts1 ADD DATAFILE '...dbf' SIZE 100M;
ALTER DATABASE DATAFILE '...dbf' RESIZE 200M;
DROP TABLESPACE ts1 INCLUDING CONTENTS;

-- ========== 用户管理 ==========
CREATE USER u1 IDENTIFIED BY "pwd" DEFAULT TABLESPACE ts1 QUOTA 100M ON ts1;
ALTER USER u1 QUOTA 200M ON ts1;
DROP USER u1 CASCADE;
GRANT CONNECT, RESOURCE TO u1;
REVOKE CONNECT FROM u1;

-- ========== 表管理 ==========
CREATE TABLE t1 (id NUMBER PRIMARY KEY, name VARCHAR2(50));
ALTER TABLE t1 ADD (age NUMBER(3));
ALTER TABLE t1 MODIFY (name VARCHAR2(100));
ALTER TABLE t1 DROP COLUMN age;
TRUNCATE TABLE t1;
DROP TABLE t1 PURGE;
FLASHBACK TABLE t1 TO BEFORE DROP;

-- ========== 索引管理 ==========
CREATE INDEX idx_t1_name ON t1(name);
CREATE UNIQUE INDEX uk_t1_id ON t1(id);
DROP INDEX idx_t1_name;

-- ========== 数据查询 ==========
SELECT * FROM t1 WHERE ROWNUM <= 10;                          -- 取前10
SELECT * FROM (SELECT ROWNUM rn, t.* FROM t1) WHERE rn > 5;   -- 分页
SELECT t.*, ROWNUM FROM t1;                                   -- 显示行号

-- ========== 会话管理 ==========
SELECT username, machine, status FROM v$session WHERE username IS NOT NULL;
ALTER SYSTEM KILL SESSION 'sid,serial#';
ALTER SYSTEM DISCONNECT SESSION 'sid,serial#' IMMEDIATE;

-- ========== 常用视图 ==========
SELECT * FROM v$instance;              -- 实例信息
SELECT * FROM v$database;              -- 数据库信息
SELECT * FROM dba_tablespaces;         -- 表空间
SELECT * FROM dba_users;               -- 用户
SELECT * FROM dba_data_files;          -- 数据文件
SELECT * FROM v$log;                    -- redo日志
SELECT * FROM v$session;               -- 会话
SELECT * FROM v$sql;                    -- 当前SQL
SELECT * FROM v$lock;                   -- 锁
```

---

> **下一篇预告**：《Oracle DataGuard 实战：搭建主备容灾，10分钟搞定金融级高可用》
>
> 如果觉得这篇有用，**点赞 + 收藏 + 关注**，是我继续肝下去的最大动力！

---

*版权声明：本文采用 CC BY-NC-SA 4.0 协议，转载请保留作者及原文链接。*