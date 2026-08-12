---
title: "ext4 / Btrfs / NTFS / XFS 四大文件系统深度对比：原理、特性与 Btrfs 快照完全解析"
description: "全面对比 Linux 和 Windows 生态最常用的四个文件系统：ext4、Btrfs、NTFS、XFS。深入讲解 Btrfs 的 COW 写时复制原理、Copy-on-Write 快照机制、Subvolume 子卷系统、Extent 分配方式，以及为什么现代 NAS 和服务器都在向 Btrfs 迁移。"
slug: "ext4-btrfs-ntfs-xfs-file-systems-comparison-cow-snapshot"
date: 2026-07-19T12:00:00+08:00
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["技术分享"]
tags:
  [
    "文件系统",
    "ext4",
    "Btrfs",
    "NTFS",
    "XFS",
    "COW",
    "Copy-on-Write",
    "快照",
    "Snapshot",
    "Subvolume",
    "Extent",
    "RAID",
    "Linux",
    "数据校验",
    "磁盘管理",
    "ZFS",
    "存储技术",
  ]
---

# ext4 / Btrfs / NTFS / XFS 四大文件系统深度对比：原理、特性与 Btrfs 快照完全解析

## 前言

文件系统是操作系统最核心的底层组件之一。它决定了：

- 文件怎么存、怎么读、怎么找
- 数据损坏时能不能自愈
- 大文件、小文件、千万级文件的极限性能
- 能不能做快照、能不能透明压缩、能不能做 RAID

不同的文件系统有完全不同的设计哲学：有的追求**极致稳定**（ext4），有的追求**极致性能**（XFS），有的追求**功能丰富**（Btrfs、ZFS），有的追求**Windows 平台兼容**（NTFS）。

这篇文章会从原理到实战，带你彻底搞懂 `ext4`、`Btrfs`、`NTFS`、`XFS` 这四个最主流的文件系统，并**重点解析 Btrfs 的快照原理** —— 这是它在容器、NAS、备份场景中大火的核心原因。

---

## 一、四个文件系统的速览

```
┌─────────────────────────────────────────────────────────────┐
│                文件系统生态地图                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Linux 生态                                                  │
│   ├── ext4 ────── 经典稳定，Linux 装机量最大的默认 FS          │
│   ├── XFS ─────── RHEL/CentOS 默认，擅长大文件                 │
│   └── Btrfs ───── 现代特性集大成者，COW + 快照 + 内置 RAID      │
│                                                             │
│  Windows 生态                                                 │
│   └── NTFS ────── Windows 默认，权限/加密/日志俱全              │
│                                                             │
│  其他现代 FS                                                  │
│   ├── ZFS ─────── 存储界的传奇，OpenZFS 跨平台                 │
│   ├── APFS ────── macOS/iOS 默认                               │
│   └── ReFS ────── Windows Server 现代版                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**一句话定位**：

| 文件系统  | 一句话定位                                       |
| --------- | ------------------------------------------------ |
| **ext4**  | 经典稳定，生产环境"够用就好"的代名词             |
| **XFS**   | 大文件场景的性能王者，默认 RHEL/CentOS           |
| **Btrfs** | Linux 生态的"现代特性集"，COW + 快照 + 内置 RAID |
| **NTFS**  | Windows 的标配，跨平台场景的必经之路             |

---

## 二、ext4：Linux 生态的常青树

### 2.1 历史脉络

ext4 是 ext 系列（extended file system）的第四代：

```
ext2（1993）→ ext3（2001）→ ext4（2008）→ 至今
                ↑              ↑
                加入日志       Extent + 多块分配 + 大容量支持
```

ext4 在 ext3 的基础上做了重大改进，但保持了**相同的设计哲学**：简单、稳定、向后兼容。

### 2.2 核心特性

- **日志模式（Journaling）**：用日志保证文件系统一致性，崩溃后快速恢复
- **Extent 分配**：用"区间"代替"块映射"，提高大文件性能
- **最大文件大小**：1 EB（实际受限于块大小）
- **最大卷大小**：1 EB
- **延迟分配（Delayed Allocation）**：合并多次小块写入为一次大块写入
- **多块分配器（MBalloc）**：一次分配多个块，减少碎片

### 2.3 优势与局限

```
✓ 优势：
  - 极度稳定，20 年实战检验
  - 性能可预期，没有"惊喜"
  - 几乎所有 Linux 工具都支持
  - 修复工具成熟（e2fsck）
  - 资源占用低

✗ 局限：
  - 没有内建快照（需要 LVM 或第三方工具）
  - 没有透明压缩
  - 没有数据校验（bit rot 静默腐化）
  - 没有内建 RAID
  - 单目录文件数有限（数十万级别）
```

### 2.4 典型应用场景

- Linux 服务器系统盘
- 数据库存储（MySQL、PostgreSQL）—— 稳定优先
- 需要长时间不重启的生产环境
- 老旧机器、低资源环境

---

## 三、XFS：高性能 64 位日志文件系统

### 3.1 起源与定位

XFS 由 SGI（硅谷图形公司）于 1993 年开发，最初用于 IRIX 操作系统。2001 年移植到 Linux。RHEL 7 起成为默认文件系统。

XFS 的设计目标是：**高吞吐量、大文件、大容量**。

### 3.2 核心特性

- **分配组（Allocation Groups，AG）**：把磁盘分成多个独立管理单元，并行操作，扩展性强
- **B+ 树索引**：高效空间管理，文件系统大小决定索引效率
- **延迟分配**：合并多次写操作
- **在线扩容**：可以在挂载状态下扩展文件系统（不能缩小）
- **在线碎片整理**：xfs_fsr 工具
- **最大文件/卷大小**：8 EB（实际受限于 64 位寻址）

```
XFS 分配组结构：
  ┌──────┬──────┬──────┬──────┬──────┐
  │ AG0  │ AG1  │ AG2  │ AG3  │ AG4  │
  │超级B │  元数据│  数据│  数据│  数据│
  │  + 数据│              │      │      │
  └──────┴──────┴──────┴──────┴──────┘
  ↑ 每个 AG 独立管理自己的 inode、空闲空间、journal
  ↑ 多 AG 并行操作 → 多核性能极佳
```

### 3.3 优势与局限

```
✓ 优势：
  - 大文件性能极佳（视频、数据库、科学计算）
  - 多核 CPU 扩展性强（AG 并行）
  - 在线扩容（lvextend + xfs_growfs）
  - 稳定可靠（RHEL 主力 FS）
  - 性能可预测

✗ 局限：
  - 不支持缩小（这是公认的硬限制）
  - 没有内建快照（需要 dm-thin 或外部工具）
  - 没有数据校验
  - 没有内建 RAID
  - 单机部署成本相对高（适合大磁盘）
```

### 3.4 典型应用场景

- 大数据存储（Hadoop、NFS 服务）
- 视频编辑、流媒体
- 数据库（大文件型）
- RHEL/CentOS 7/8/9 默认
- 机器学习训练数据集

---

## 四、NTFS：Windows 生态的标配

### 4.1 设计理念

NTFS（New Technology File System）从 Windows NT 时代（1993）开始使用，是 Windows 操作系统的默认文件系统。

NTFS 的核心设计目标不是极致性能，而是**企业级功能完整性**：

- 权限管理（ACL）
- 加密（EFS）
- 压缩（NTFS 压缩）
- 配额管理
- 日志（Journal）
- 硬链接、符号链接、连接点
- 事务性 NTFS（TxF）
- 变更日志（USN Journal）

### 4.2 核心特性

- **段对象（Stream）**：文件可以有多个数据流（ADS）
- **访问控制列表（ACL）**：细粒度权限控制
- **加密文件系统（EFS）**：基于用户证书的透明加密
- **加密块（Cluster）大小**：4KB ~ 64KB
- **最大文件/卷大小**：16 EB（理论值，实际受限于操作系统）
- **日志**：所有元数据修改都记录到 `$LogFile`

### 4.3 优势与局限

```
✓ 优势：
  - 完善的权限与安全模型
  - 文件级加密（EFS）
  - 透明压缩（NTFS 压缩）
  - 单目录文件数：理论上 4G+
  - Windows 生态完整支持

✗ 局限：
  - 跨平台兼容性差（Linux 写 NTFS 长期不稳定）
  - 没有 COW 快照（早期 VSS 是基于卷影复制）
  - 没有数据校验
  - 设计复杂，性能不如 XFS/ext4
  - 大量小文件性能下降明显
```

### 4.4 典型应用场景

- Windows 系统盘
- 办公文件、文档共享
- 需要 Windows ACL 权限控制的场景
- 跨 Windows 平台的兼容性需求

### 4.5 Linux 读写 NTFS

Linux 长期通过 `ntfs-3g`（基于 FUSE）读写 NTFS，但存在性能问题。**ntfs3** 内核驱动（2020 年合并）显著改善了性能：

```bash
# Linux 5.15+ 内核自带 ntfs3 驱动
mount -t ntfs3 /dev/sda1 /mnt/windows

# 或使用传统 ntfs-3g
mount -t ntfs-3g /dev/sda1 /mnt/windows
```

**重要提醒**：生产环境不建议在 Linux 服务器上对 NTFS 做高强度写入，可能导致文件系统损坏。

---

## 五、Btrfs：现代特性的集大成者

### 5.1 Btrfs 的设计哲学

Btrfs（B-tree FS，Butter FS）由 Oracle 于 2007 年宣布，目标是**取代 ext4**，成为 Linux 的下一代默认文件系统。

Btrfs 的口号是 **"让存储像数据库一样工作"**。

它的设计哲学和 ZFS 类似（事实上 Btrfs 借鉴了大量 ZFS 的思想），把传统文件系统+卷管理+RAID 整合成一个统一的系统：

```
传统架构：
  磁盘 → 物理卷 → LVM 卷组 → 逻辑卷 → ext4 文件系统 → 目录树
  多个步骤，多个工具

Btrfs 架构：
  磁盘 → Btrfs 文件系统（自带卷管理、RAID、快照）
  一个步骤，一个 FS
```

### 5.2 Btrfs 核心特性

- **COW（Copy-on-Write，写时复制）**：所有数据写入都先复制再修改，这是快照、压缩的基础
- **Extent-based 存储**：和 XFS 类似，用区间描述磁盘占用
- **B-tree 索引**：所有元数据都用 B-tree 索引
- **子卷（Subvolume）**：可以在一个 FS 内创建多个独立的"伪根"
- **快照（Snapshot）**：秒级、近乎零成本
- **透明压缩（zlib / lzo / zstd）**
- **内建 RAID（RAID 0/1/5/6/10）**
- **数据校验（Checksum）**：自动检测静默数据损坏
- **在线扩容、缩减、平衡（Balance）**
- **发送/接收（Send/Receive）**：高效增量备份
- **配额（Quota）**：子卷级配额管理

### 5.3 Btrfs 的优势与局限

```
✓ 优势：
  - 内建快照，秒级完成
  - 内建 RAID，无需 mdadm
  - 数据校验，防止静默损坏
  - 透明压缩（zstd 几乎不影响性能）
  - 子卷可以独立挂载
  - 增量备份（send/receive）
  - 支持 SSD TRIM

✗ 局限：
  - 稳定性历史上不如 ext4（2016 年前问题多）
  - RAID 5/6 实现长期不成熟（2024 年仍需注意）
  - 单文件修复能力弱（损坏后只能恢复整个子卷）
  - 工具链相对较新
  - 不支持 ext4 那种内核原生 fsck 全面修复
```

### 5.4 Btrfs 实战命令

```bash
# 创建 Btrfs 文件系统
mkfs.btrfs -L mydata /dev/sdb1

# 挂载
mount -t btrfs /dev/sdb1 /mnt/data

# 创建子卷
btrfs subvolume create /mnt/data/subvol1
btrfs subvolume create /mnt/data/subvol2

# 单独挂载子卷
mount -t btrfs -o subvol=subvol1 /dev/sdb1 /mnt/subvol1

# 启用透明压缩
mount -o remount,compress=zstd /mnt/data

# 创建快照
btrfs subvolume snapshot /mnt/data/subvol1 /mnt/data/snap1

# 查看磁盘使用
btrfs filesystem df /mnt/data
btrfs filesystem usage /mnt/data
```

### 5.5 Btrfs 的典型应用场景

- 个人 NAS、家庭服务器（OpenMediaVault、Synology、QNAP 现代版本）
- Docker 容器存储（特别适合 btrfs + overlay2）
- 备份服务器（增量复制 send/receive）
- 虚拟机存储（KVM 镜像）
- 大型数据库（PostgreSQL 16+ 在 Btrfs 上表现优秀）

---

## 六、四文件系统全方位对比

### 6.1 功能矩阵

| 特性                     | ext4           | XFS              | NTFS             | Btrfs                         |
| ------------------------ | -------------- | ---------------- | ---------------- | ----------------------------- |
| **类别**                 | 传统日志 FS    | 传统日志 FS      | 企业日志 FS      | 现代 COW FS                   |
| **COW 写时复制**         | ❌             | ❌               | ❌               | ✅                            |
| **内建快照**             | ❌             | ❌               | ❌（VSS 基于卷） | ✅                            |
| **透明压缩**             | ❌             | ❌               | ✅（NTFS 压缩）  | ✅（zlib/lzo/zstd）           |
| **数据校验（Checksum）** | ❌             | ❌               | ❌               | ✅                            |
| **内建 RAID**            | ❌             | ❌               | ❌               | ✅（RAID 0/1/5/6/10）         |
| **子卷（Subvolume）**    | ❌             | ❌               | ❌               | ✅                            |
| **多设备支持**           | ❌             | ❌               | 部分（Spanned）  | ✅                            |
| **在线扩容**             | ✅             | ✅               | ✅               | ✅                            |
| **在线缩减**             | ✅             | ❌               | ✅               | ✅                            |
| **在线碎片整理**         | ✅（e4defrag） | ✅（xfs_fsr）    | ✅（defrag）     | ✅（btrfs filesystem defrag） |
| **ACL 权限**             | ✅             | ✅               | ✅（强）         | ✅                            |
| **透明加密**             | ❌             | ❌               | ✅（EFS）        | ❌（需要 dm-crypt）           |
| **配额管理**             | 部分（quota）  | ✅（xfs_quota）  | ✅（Quota）      | ✅（qgroup）                  |
| **修复工具**             | ✅（e2fsck）   | ✅（xfs_repair） | ✅（chkdsk）     | ⚠️（scrub 校验）              |
| **成熟度**               | ⭐⭐⭐⭐⭐     | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐⭐       | ⭐⭐⭐⭐                      |

### 6.2 性能对比

性能取决于具体的负载（读多写少、大文件 vs 小文件、随机 vs 顺序），但根据业界基准测试：

```
大文件顺序读写：
  XFS > Btrfs > ext4 > NTFS

小文件随机读写：
  XFS ≈ Btrfs > ext4 > NTFS

创建/删除大量小文件：
  Btrfs > XFS > ext4 > NTFS

元数据操作（创建目录、移动文件）：
  Btrfs > XFS > ext4 > NTFS

数据库（PostgreSQL/MySQL）：
  XFS ≈ ext4 > Btrfs (旧) > NTFS
  （Btrfs 在新版本内核下接近 XFS）
```

### 6.3 场景推荐

| 场景               | 推荐                 | 理由                  |
| ------------------ | -------------------- | --------------------- |
| Linux 服务器系统盘 | ext4                 | 稳定、低开销          |
| RHEL/CentOS 默认   | XFS                  | 官方默认              |
| 大文件存储         | XFS                  | 大文件性能王者        |
| 大数据/Hadoop      | XFS                  | 高吞吐                |
| 数据库（MySQL/PG） | XFS 或 ext4          | 性能稳定              |
| NAS / 家庭媒体库   | Btrfs                | 快照、压缩、校验      |
| 容器/虚拟机存储    | Btrfs                | 容器场景-friendly     |
| 备份服务器         | Btrfs                | 增量快照 send/receive |
| Windows 系统盘     | NTFS                 | 唯一选择              |
| 跨平台文件共享     | NTFS（限制）或 exFAT | 兼容性                |

---

## 七、Btrfs 快照原理深度解析

### 7.1 什么是快照

**快照（Snapshot）** 是文件系统在某个时间点的"拍照"。快照允许你：

- 在不中断服务的情况下，备份当前状态
- 升级前打个快照，升级失败随时回滚
- 创建测试环境（基于某个快照做实验）

**快照的两种根本类型**：

```
写时复制快照（Copy-on-Write，COW）：
  写入新数据前，先把旧数据复制到快照空间
  → 快照创建瞬间完成，几乎零空间
  → 写入时性能损失（需要先复制）
  → Btrfs、ZFS 采用

写时重定向快照（Redirect-on-Write，ROW）：
  新数据写入新位置，不动旧数据
  → 写入性能好
  → 删除旧数据时性能差
  → LVM 旧版本采用

引用快照（Reference）：
  不实际复制数据，只记录指针
  → 实际是 COW 的一种
```

### 7.2 Btrfs 的 COW 机制

Btrfs 的所有写操作都是 **COW（Copy-on-Write，写时复制）**。这是理解 Btrfs 快照的关键。

**传统文件系统的覆盖写（Overwrite）**：

```
时间 T1：文件 A 的数据在块 100，inode 指向 100
         ↓ 用户修改文件 A
时间 T2：读取块 100 → 在内存中修改 → 写回块 100（原地覆盖）
         没有任何副本，如果电源中断 → 数据丢失
```

**COW 文件系统的写时复制**：

```
时间 T1：文件 A 的数据在块 100，inode 指向 100
         ↓ 用户修改文件 A
时间 T2：
  1. 找到空闲块 200
  2. 把块 100 的内容复制到块 200
  3. 在块 200 上修改数据
  4. 把 inode 指向 200
  5. 旧块 100 暂时保留（成为快照的"资源"）

结果：旧版数据（块 100）被保留，新版数据（块 200）生效
     任何意外的崩溃都不会破坏旧数据
```

### 7.3 Btrfs 的元数据和数据组织

Btrfs 用 **Extent（区间）** 取代传统的"块映射"：

```
传统块映射（ext4）：
  文件 offset 0-4095 → 块 100
  文件 offset 4096-8191 → 块 101
  文件 offset 8192-12287 → 块 102
  ...
  每 4KB 都要一个映射项 → 大文件元数据巨大

Btrfs Extent 映射：
  文件 offset 0-1048575 → 块 100-355（连续 256 个块）
  一个 extent 描述一整段连续空间
  → 大文件元数据极小
```

Btrfs 的所有元数据（extent 映射、目录、inode）都用 **B-tree 索引**：

```
Btrfs 的 B-tree 树形结构：

           根节点
          /      \
        内部节点  内部节点
        /     \
     叶子1    叶子2
   (extent) (extent)
   (inode)  (inode)
   (目录)    (目录)
```

**关键点**：所有元数据都在 B-tree 中，而且 B-tree 本身也是 **COW** 的。

### 7.4 Btrfs 快照原理：让快照成为"零成本"

有了 COW 机制，Btrfs 快照的实现就非常简单了：

**创建快照的步骤**：

```bash
# 短短几秒完成
btrfs subvolume snapshot /mnt/data /mnt/data/snap1
# Create a snapshot of '/mnt/data' in '/mnt/data/snap1'
```

**底层发生了什么**：

```
快照创建前：
  子卷 data 的 Root B-tree 根节点是 ROOT_1
  data 的所有数据通过 ROOT_1 索引

快照创建后：
  snap1 有自己的根 ROOT_2（顶层 B-tree 节点）
  但 ROOT_2 和 ROOT_1 指向完全相同的 extent 节点
  → 没有复制任何数据！
  → 创建一个根 B-tree 节点的时间：< 1 秒
```

```
  Root_Tree
    ├── RO Subvol data → ROOT_1 ──┐
    │                              │ 共享 extent
    └── RO Subvol snap1 → ROOT_2 ─┘
```

**关键洞察**：快照的"零成本"来自 COW 机制——创建快照时**任何数据都还没被修改**，所以无需复制任何东西。快照和原始子卷共享所有 extent。

### 7.5 数据写入时：COW 的神奇之处

**当原始子卷的数据被修改时**：

```
假设根 B-tree 节点 ROOT_1 要被修改：

传统 COW（每次写都复制）：
  🔄 必须从叶子节点开始，逐层复制整个路径
  → 大文件写入性能差

Btrfs 优化（lazy COW / nodatacow 模式）：
  对于 data extent，可以选择：
  1. 默认 COW（写入安全但开销）
  2. nodatacow（必须用某些工具如 dd 创建大文件）
  3. 某些场景下可以配置 partial COW
```

**当原始子卷的某个 Block 100 的数据被修改时**：

```
修改前：
  ROOT_1 → 共享 extent → Block 100（snap1 仍可见）

修改过程（COW）：
  1. 分配新的 Block 200
  2. 把 Block 100 的内容复制到 Block 200
  3. 在 Block 200 上修改数据
  4. 把 ROOT_1 指向 Block 200
  5. Block 100 仍然保留（快照仍可访问）

修改后：
  ROOT_1 → Block 200（新版）
  ROOT_2 → Block 100（旧版，快照访问）
```

**这就是 COW 快照的精髓**：

```
原始子卷得到：所有写操作都"复制 + 改 + 指向新块"
快照保留：旧版的数据（extent 100）被保留，新版不影响快照

共享程度：
  没有变化的 extent：原始 + 快照共享（零空间）
  被修改的 extent：复制了一份（少量空间）
```

### 7.6 快照空间占用分析

```
情景一：刚创建快照，数据完全没变
  快照空间占用：0（只增加一个根 B-tree 节点）

情景二：修改了文件 A 的第 1 个块
  快照空间占用：1 个块（4KB-8KB）

情景三：删除了文件 B
  原始子卷释放 B 的 extent
  快照保留 B 的 extent（防止快照损坏）
  → 快照占用：B 原本的大小

这是 Btrfs 快照的"陷阱"：
  原始子卷删除文件，快照中仍保留
  → 必须通过 btrfs subvolume delete 删除快照，
    或 send/receive 收回空间
```

### 7.7 快照的完整生命周期

```bash
# 1. 创建子卷（被快照的对象）
btrfs subvolume create /mnt/data/projects

# 2. 创建快照（升级前先打快照）
btrfs subvolume snapshot /mnt/data/projects /mnt/data/projects-snap-20260725

# 3. 升级系统
apt upgrade -y  # 或 yum update

# 4. 升级失败，回滚
# 步骤：
#   4.1 删除当前子卷
btrfs subvolume delete /mnt/data/projects
#   4.2 还原快照
btrfs subvolume snapshot /mnt/data/projects-snap-20260725 /mnt/data/projects

# 5. 删除旧快照（释放空间）
btrfs subvolume delete /mnt/data/projects-snap-20260725
```

### 7.8 快照 vs 备份：重要区别

```
快照（Snapshot）：
  - 在同一文件系统内
  - 几乎零成本
  - 不防文件系统损坏（损坏会一起损坏）
  - 适合快速回滚、临时备份
  - 不能替代真正的备份

备份（Backup）：
  - 在另一个文件系统或设备上
  - 占用等量的空间
  - 防文件系统损坏、物理故障
  - 需要定期执行
  - btrfs send/receive 可以做增量备份
```

### 7.9 Btrfs 增量备份：send/receive

Btrfs 的 send/receive 是它的杀手级特性，可以做**高效的增量备份**：

```bash
# 第一次：完整快照发送到远程
btrfs send /mnt/data/projects-snap-20260725 | \
  ssh user@backup-server "btrfs receive /mnt/backup/"

# 第二次：只发送增量差异
btrfs send -p /mnt/data/projects-snap-20260725 \
           -c /mnt/data/projects-snap-20260726 | \
  ssh user@backup-server "btrfs receive /mnt/backup/"

# 第二次只传输第 26 日相比第 25 日的差异数据
# → 首次 100GB，增量可能只有 100MB
```

这种基于 COW 的增量备份，比 `rsync` 高效得多（rsync 需要扫描所有文件做 diff）。

---

## 八、Btrfs 高级特性实战

### 8.1 多设备文件系统（JBOD / RAID）

```bash
# 把 3 块盘做成 Btrfs RAID1（每份数据存 2 份）
mkfs.btrfs -L mydata -m raid1 -d raid1 /dev/sdb /dev/sdc /dev/sdd

# 在线添加设备
btrfs device add /dev/sde /mnt/data

# 平衡数据分布到所有设备
btrfs balance start /mnt/data

# 替换故障设备
btrfs device replace /dev/sdb /dev/sdf /mnt/data

# 移除设备
btrfs device delete /dev/sdb /mnt/data
```

### 8.2 透明压缩

```bash
# 挂载时启用 zstd 压缩（推荐）
mount -o compress=zstd /dev/sdb1 /mnt/data

# 重新挂载启用压缩
mount -o remount,compress=zstd /mnt/data

# 性能与压缩比：
# zstd:  压缩率好，CPU 开销低（推荐日常）
# lzo:   压缩率低，速度最快
# zlib:  压缩率好，CPU 开销高
```

对文本、日志、代码等可压缩数据，zstd 通常能压缩到 30-50%，对性能影响通常 < 5%。

### 8.3 数据校验（Scrub）

```bash
# 手动启动 scrub（检查所有数据完整性）
btrfs scrub start /mnt/data

# 查看 scrub 状态
btrfs scrub status /mnt/data

# 添加到 crontab 每周自动 scrub
0 3 * * 0 /sbin/btrfs scrub start /mnt/data
```

Btrfs 的 checksum 可以检测出**静默数据损坏**（silent bit rot）—— 这种损坏磁盘 SMART 检测不到、文件系统也没察觉，传统 ext4/XFS 完全无能为力。

---

## 九、文件系统选型决策树

```
你的系统是什么？
  ├─ Windows → NTFS（唯一选择）
  └─ Linux
      │
      ├─ 你的应用是数据库（MySQL/PostgreSQL）？
      │   ├─ 是 → XFS 或 ext4（生产 OLTP 仍以稳定为先）
      │   └─ 否 → 继续
      │
      ├─ 你需要快照、压缩、校验、增量备份？
      │   ├─ 是 → Btrfs
      │   └─ 否 → 继续
      │
      ├─ 你的磁盘很大（> 10TB）？
      │   ├─ 是，多文件大文件为主 → XFS
      │   └─ 否，小文件为主 → ext4 或 Btrfs
      │
      └─ 你需要兼容性、不折腾？
          └─ ext4（最稳）
```

**最终推荐表**：

| 业务场景           | 推荐        | 热度       |
| ------------------ | ----------- | ---------- |
| Linux 服务器系统盘 | ext4        | ⭐⭐⭐⭐⭐ |
| RHEL/CentOS 默认   | XFS         | ⭐⭐⭐⭐⭐ |
| 大数据、机器学习   | XFS         | ⭐⭐⭐⭐⭐ |
| NAS 家用/小型      | Btrfs       | ⭐⭐⭐⭐⭐ |
| 容器主机           | Btrfs       | ⭐⭐⭐⭐   |
| 数据库生产         | XFS 或 ext4 | ⭐⭐⭐⭐   |
| 增量备份服务器     | Btrfs       | ⭐⭐⭐⭐⭐ |
| Windows 系统盘     | NTFS        | ⭐⭐⭐⭐⭐ |

---

## 结语

文件系统没有绝对的"最好"，只有"最适合"：

- **ext4**：稳定可靠，20 年沉淀，所有 Linux 工程师都熟悉
- **XFS**：大文件和多核性能王者，企业级首选
- **NTFS**：Windows 生态的唯一选择
- **Btrfs**：COW + 快照 + 校验 + 压缩，是现代存储的未来

特别值得一提的是 Btrfs 的快照设计——基于 COW 机制，让快照成为"零成本"操作。这不只是一个技术特性，它**改变了系统管理员的工作方式**：

升级前 `btrfs subvolume snapshot`，失败就 `btrfs subvolume snapshot -r` 还原；备份用 `btrfs send/receive` 做增量同步；文件系统损坏用 `btrfs scrub` 检测。

这套机制让"回滚"和"备份"从昂贵复杂的运维操作，变成了几秒钟的事。

理解了 COW 和快照，你就已经掌握了现代文件系统的核心思想——这个思想也在 ZFS、APFS、ReFS 中体现。

---

**相关推荐阅读**：

- [Linux NFS配置：让多台服务器共享存储](https://blog.example.com/linux-nfs-share)
- [Proxmox VE虚拟化平台部署实战](https://blog.example.com/proxmox-ve-deploy)
- [Kubernetes存储管理：PV、PVC、StorageClass完全指南](https://blog.example.com/kubernetes-storage-pv-pvc)
