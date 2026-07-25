---
title: "Btrfs + Snapper 完全指南：服务器系统更新的"时光机" — 自动快照与一键回滚实战"
description: "运维人员的噩梦：yum update 之后系统崩了？别让一次更新毁掉你的周末！本文详解如何使用 Btrfs 文件系统 + Snapper 工具为服务器打造自动化的"时光机"——升级前自动快照、升级失败一键回滚、Snapper 定时快照策略、与包管理器集成、跨快照 diff、备份集成，让你的 Linux 服务器拥有"任意回档"的超能力。"
slug: "btrfs-snapper-server-time-machine-auto-snapshot-rollback"
date: 2026-07-19T12:30:00+08:00
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["技术分享"]
tags:
  [
    "Btrfs",
    "Snapper",
    "快照",
    "Snapshot",
    "回滚",
    "Rollback",
    "时间机器",
    "服务器运维",
    "yum",
    "dnf",
    "apt",
    "pacman",
    "systemd",
    "自动快照",
    "COW",
    "Copy-on-Write",
    "数据安全",
    "Linux系统管理",
    "openSUSE",
    "SUSE",
    "RHEL",
    "CentOS",
  ]
---

# Btrfs + Snapper 完全指南：服务器系统更新的"时光机"

## 前言

每个运维都经历过这样的场景：

```
周五 18:00，部署完毕，准备下班。
周五 18:30，老板来电话："安全漏洞，紧急升级！"
周五 19:00，执行：yum update -y
周五 19:30，升级完成，重启。
周五 19:35，黑屏了——新内核与显卡驱动不兼容。
周五 19:36，看着屏幕上转圈的启动失败动画，
         你突然意识到——今晚的约会完了。
```

**这不是段子，这是 Linux 运维的真实日常**。

Windows 有"系统还原点"，macOS 有 Time Machine，**为什么 Linux 没有"升级前自动备份"的标准机制**？

答案是：以前没有，但现在有了——**Btrfs + Snapper**。

Snapper 是 openSUSE 出品的快照管理工具，能与 zypper / yum / dnf / apt / pacman 包管理器**深度集成**，自动在升级前后创建快照，升级失败只需一条命令回滚到上一秒的状态。

这篇文章，我会带你从零搭建这套"系统时光机"：

```
Btrfs 文件系统（COW 快照零成本）
  +
Snapper 工具（自动创建/清理快照）
  +
包管理器集成（升级前自动快照）
  +
开机自动 rollback 支持（内核级回滚）
  =
服务器升级不再提心吊胆
```

---

## 一、原理：为什么 Snapper 是"时光机"

### 1.1 Snapper 是什么

**Snapper** 是 openSUSE 项目开发的**快照管理工具**，由 Arvin Schnell 于 2012 年发起，目前由 openSUSE 团队维护。

它不是文件系统，而是 **Btrfs 子卷快照的"管理者"**，解决三个核心问题：

```
1. 自动创建：配合包管理器，升级/安装前自动打快照
2. 自动清理：根据时间、数目，删除过老的快照
3. 傻瓜回滚：用 snapper rollback 一键还原到某个快照
```

### 1.2 工作原理图

```
        包管理器 (yum/dnf/apt)
            │
            │ 升级前自动调用
            ↓
   Snapper pre-snapshot hook（钩子）
            │
            │ btrfs subvolume snapshot
            ↓
    [只读快照 #123] ←—— 升级前的"档案"
            │
            ↓
   包管理器执行升级
            │
            ↓
   Snapper post-snapshot hook（钩子）
            │
            │ btrfs subvolume snapshot
            ↓
    [只读快照 #124] ←—— 升级后的"现场"

如果升级成功：保留两个快照（保留现场证据）
如果升级失败：snapper undochange → 回滚到 #123
```

### 1.3 适合谁

| 用户 | 适合程度 | 原因 |
|------|---------|------|
| **个人 Linux 桌面** | ⭐⭐⭐⭐⭐ | Manjaro / openSUSE Tumbleweed 默认启用 |
| **服务器管理员** | ⭐⭐⭐⭐⭐ | 系统升级前自动快照 |
| **企业运维** | ⭐⭐⭐⭐ | 与自动化运维集成 |
| **开发者本地 VM** | ⭐⭐⭐⭐⭐ | 系统折腾不怕坏 |
| **生产数据库服务器** | ⭐⭐⭐ | 不推荐（数据库有自己的备份方案） |

---

## 二、准备：搭建 Btrfs 文件系统

### 2.1 检查现有系统是否已经是 Btrfs

```bash
# 查看系统盘文件系统类型
df -Th /

# 典型输出（已使用 Btrfs）：
# Filesystem     Type   Size  Used Avail Use% Mounted on
# /dev/sda2      btrfs  100G   45G   55G  45% /

# 如果不是 Btrfs，需要重新规划
```

**重要前提**：Snapper 依赖 Btrfs 的 COW 快照特性。如果你的根文件系统是 ext4 / XFS，**Snapper 用不了**。

### 2.2 新装系统时启用 Btrfs

#### openSUSE（Snapper 默认开箱即用）

openSUSE Tumbleweed / Leap 默认就是 Btrfs + Snapper，安装时无需任何配置：

```
安装 openSUSE 时：
  - 根分区类型：默认 Btrfs
  - Snapper：默认安装并自动配置
  - 安装完，重启后立刻就有快照可用
```

#### Manjaro / Arch Linux

```bash
# 安装时选择 btrfs 文件系统
# 安装 snapper 和 snap-pac
sudo pacman -S snapper snap-pac grub-btrfs

# 创建根目录配置
sudo snapper -c root create-config /

# 创建初始快照（重要：snapper rollback 需要至少两个快照）
sudo snapper -c root create --description "Initial snapshot"

# 启用 snapper 自动清理定时器
sudo systemctl enable --now snapper-timeline.timer
sudo systemctl enable --now snapper-cleanup.timer
```

#### RHEL 9 / CentOS Stream 9

```bash
# 安装 snapper
sudo dnf install snapper

# 创建根目录配置
sudo snapper -c root create-config /

# 修改 /etc/fstab，让根目录以 subvol=@ 形式挂载
# （Anaconda 安装 Btrfs 时默认已经做了）

# 重启或重新挂载（snapper 修改了 /etc/fstab）
sudo reboot

# 创建初始快照
sudo snapper -c root create --description "Initial state"
```

#### Ubuntu / Debian（部分支持）

Ubuntu 22.04+ 默认支持 Btrfs，但 **Snapper 在 Ubuntu 上的集成度不如 openSUSE**，需要手动配置：

```bash
# 安装 snapper
sudo apt install snapper

# 创建配置
sudo snapper -c root create-config /

# 关键步骤：Ubuntu 的子卷布局和 openSUSE 不同，需要调整
# Ubuntu 的根目录通常在 subvolid=5（top-level），不是 @ 子卷
# 详细配置见后文"Ubuntu 特殊处理"章节
```

### 2.3 验证环境

```bash
# 检查 Snapper 是否安装
snapper --version
# snapper 0.10.x

# 查看已有配置
sudo snapper list-configs
# Config | Subvolume
# -------+----------
# root   | /

# 查看快照列表（初始可能为空）
sudo snapper list
# # | Type   | Pre # | Date                     | User | Cleanup | Description           | Userdata
# ---+--------+-------+--------------------------+------+---------+-----------------------+---------
# 0  | single |       |                          | root |         | current               |

# 如果报 "IO Error"，通常是 /etc/snapper/configs/root 中 SUBVOLUME 配置不对
```

---

## 三、配置 Snapper：精细化设置

### 3.1 配置文件位置

Snapper 的配置都在 `/etc/snapper/configs/` 目录下：

```bash
ls /etc/snapper/configs/
# root      ← 根目录配置（最常用）

# 配置文件内容（默认的 root 配置）
cat /etc/snapper/configs/root
```

```
# 关键字段说明：
SUBVOLUME="/"
FSTYPE="btrfs"
QGROUP=""
SPACE_LIMIT="0.5"
FREE_LIMIT="0.2"

# 数字时间线快照保留策略
TIMELINE_CREATE="yes"
TIMELINE_LIMIT_HOURLY="10"
TIMELINE_LIMIT_DAILY="10"
TIMELINE_LIMIT_WEEKLY="0"
TIMELINE_LIMIT_MONTHLY="10"
TIMELINE_LIMIT_YEARLY="0"

# 预/后快照钩子（包管理器集成）
PRE_CLEANUP="yes"
POST_CLEANUP="yes"
```

### 3.2 修改配置：调整快照保留策略

```bash
# 直接编辑配置文件
sudo vim /etc/snapper/configs/root
```

**一份实战推荐配置**：

```ini
# 子卷路径
SUBVOLUME="/"
FSTYPE="btrfs"

# 空间限制：快照最多占用 50% 卷空间（防止快照撑爆磁盘）
SPACE_LIMIT="0.5"
# 当卷剩余空间少于 20% 时，自动清理快照
FREE_LIMIT="0.2"

# ===== 数字时间线快照（每隔一段时间自动拍）=====
TIMELINE_CREATE="yes"

# 每小时保留 5 个
TIMELINE_LIMIT_HOURLY="5"
# 每天保留 7 个
TIMELINE_LIMIT_DAILY="7"
# 每周保留 3 个
TIMELINE_LIMIT_WEEKLY="3"
# 每月保留 6 个
TIMELINE_LIMIT_MONTHLY="6"
# 每年保留 0 个（不保留）
TIMELINE_LIMIT_YEARLY="0"

# ===== 预/后快照清理 =====
# 自动清理 yum/zypper/apt 创建的"未命名"快照
PRE_CLEANUP="yes"
POST_CLEANUP="yes"

# 包管理器命令过滤（哪些命令触发预快照）
# ALLOW_USERS=""
# ALLOW_GROUPS=""
```

**配置字段详细说明**：

```
SPACE_LIMIT="0.5"
  → 快照最大占用 50% 的卷空间
  → 超过会自动清理最老的快照

FREE_LIMIT="0.2"
  → 当空闲空间少于 20%，自动清理快照
  → 防止磁盘被快照撑爆

TIMELINE_LIMIT_HOURLY="5"
  → 最多保留 5 个"每小时快照"
  → 旧的会被自动清理
```

### 3.3 重要：Btrfs 子卷布局

**openSUSE 标准布局**（snapper rollback 完美支持）：

```
top-level (subvolid=5)
├── @         ← 根目录 (/)
│   ├── bin/
│   ├── etc/
│   ├── home/
│   └── usr/
├── @home     ← /home 目录
├── @snapshots ← 快照存储目录（不要手动修改）
└── @var      ← /var 目录
```

**/etc/fstab 关键挂载项**：

```
UUID=xxxx  /            btrfs  subvol=@,defaults      0  0
UUID=xxxx  /home        btrfs  subvol=@home,defaults  0  0
UUID=xxxx  /.snapshots  btrfs  subvol=@snapshots,defaults  0  0
```

这种布局让 **`snapper rollback`** 命令可以无副作用地把系统回滚到某个快照。

### 3.4 Ubuntu 特殊处理

Ubuntu 22.04 默认把根目录放在 subvolid=5（顶层），而不是 `@` 子卷。这种情况下：

**选项一：手动改为 openSUSE 风格（推荐）**

```bash
# 1. 从 Live USB 启动
# 2. 挂载 btrfs 顶层
mount -o subvolid=5 /dev/sda2 /mnt

# 3. 创建 @ 子卷
btrfs subvolume create /mnt/@

# 4. 复制所有文件到 @ 子卷
cp -a /mnt/old_root/. /mnt/@/

# 5. 修改 /etc/fstab
# 把 / 挂载改成 subvol=@
# UUID=xxx  /  btrfs  subvol=@,defaults  0  0

# 6. 重启进入新系统
```

**选项二：仅用 Snapper 创建快照，不使用 rollback（Ubuntu 默认情况）**

Ubuntu 的 Subvolume 布局让 snapper rollback 命令无法直接使用，但**手动 undochange 可以工作**：

```bash
# 查看快照
sudo snapper list

# 撤销某个快照的所有变更
sudo snapper undochange 13..14

# 如果不想用，可以只保留 create / list / delete
```

---

## 四、基础操作：Snapper 入门命令

### 4.1 创建快照

```bash
# 创建单条快照
sudo snapper create --description "升级前手动快照"

# 创建快照时附带重要信息
sudo snapper create \
  --description "升级前快照" \
  --cleanup-algorithm number

# 创建快照对（用于对比"前后"）
sudo snapper create --type pre --description "升级前快照"
# 返回：5
sudo snapper create --type post --pre-number 5 --description "升级后快照"
# 返回：6
```

### 4.2 查看快照

```bash
# 列出所有快照
sudo snapper list

# 输出示例：
# # | Type   | Pre # | Date                     | User | Cleanup | Description           | Userdata
# ---+--------+-------+--------------------------+------+---------+-----------------------+---------
# 0  | single |       |                          | root |         | current               |
# 1  | single |       | 2026-07-20 14:00:00      | root |         | 首次启动后状态          |
# 5  | pre    |       | 2026-07-25 11:30:00      | root | number  | yum                   |
# 6  | post   | 5     | 2026-07-25 11:35:00      | root | number  | yum                   |

# 查看某个快照的详细信息
sudo snapper status 5..6

# 查看两个快照之间的差异
sudo snapper diff 5..6
```

### 4.3 删除快照

```bash
# 按编号删除
sudo snapper delete 5

# 删除一批快照（0-10）
sudo snapper delete 1-10

# 自动清理过期快照（根据 TIMELINE_LIMIT_* 配置）
sudo snapper cleanup timeline
```

### 4.4 关键：快照类型

```
single  : 单一快照（手动创建）
pre     : 预快照（包管理器升级前自动创建）
post    : 后快照（包管理器升级后自动创建）
```

---

## 五、与包管理器集成：自动快照实战

### 5.1 安装 Snapper 钩子

Snapper 与包管理器的"无缝集成"是通过各发行版的 **snap-pac / dnf-plugin-snapper / apt-snapper** 等插件实现的。

#### openSUSE（zypper）

```bash
# snapper 默认已经与 zypper 集成
# 升级前自动 pre-snapshot，升级后自动 post-snapshot
sudo zypper update
# 会看到：
# 正在创建 pre snapshot...已完成
# ...升级过程...
# 正在创建 post snapshot...已完成
```

#### Arch / Manjaro（pacman）：snap-pac

```bash
# 安装
sudo pacman -S snap-pac

# 此后 pacman 自动触发快照：
sudo pacman -Syu
# Pre-snapshot created (snap-pac): #7
# Post-snapshot created (snap-pac): #8
```

#### RHEL / CentOS / Fedora（yum / dnf）：dnf-plugin-snapper

```bash
# 安装 dnf-plugin-snapper（Fedora 包含在 snapper 包中）
sudo dnf install dnf-plugin-snapper

# 或 RHEL：
sudo dnf install dnf-plugin-snapper

# 配置
sudo vim /etc/dnf/plugins/snapper.conf
# 关键字段：
# [main]
# create_snapshots = yes
# snapshot_on_install = no  ← 安装单个包时是否快照（建议 no，避免快照过多）

# 启用
sudo dnf config-manager --enable snapper

# 测试
sudo dnf install htop
# Pre-snapshot created: #9
# Post-snapshot created: #10
```

#### Ubuntu / Debian（apt）：apt-snapper

```bash
# Ubuntu 上 apt-snapper 不在官方仓库，需要从 snap 或 PPA 安装
sudo snap install apt-snapper

# 或下载 deb 包
wget https://github.com/ultimate-priority/apt-snapper/releases/latest/download/apt-snapper.deb
sudo dpkg -i apt-snapper.deb

# 测试
sudo apt install nginx
# 会自动在升级前后创建快照
```

### 5.2 验证集成是否生效

```bash
# 触发一次包安装
sudo dnf install -y tree

# 查看是否创建了快照
sudo snapper list
# 应该看到一对 pre/post 快照

# 查看变更
sudo snapper status <pre-num>..<post-num>
```

### 5.3 实战演练：升级失败一键回滚

**第一步：升级前查看可用快照**

```bash
sudo snapper list
# 5  pre    -  2026-07-25 11:30:00  root  number  yum
# 6  post   5 2026-07-25 11:35:00  root  number  yum
```

**第二步：执行升级（故意制造故障）**

```bash
# 假设升级某个包导致系统问题
sudo dnf update -y kernel-*
sudo reboot
# 重启后内核 Panic，进不去系统！
```

**第三步：从 GRUB 进入 snapshot 回滚**

重启时按 `Shift`（BIOS）或 `Esc`（UEFI）进入 GRUB 菜单：

```
GRUB 菜单:
  ┌────────────────────────────────────────┐
  │ openSUSE Tumbleweed                   │
  │ openSUSE Tumbleweed (snapshot 5)      │ ← 选择这个
  │ Advanced options for openSUSE...      │
  │ ...                                   │
  └────────────────────────────────────────┘
```

选择带 "(snapshot X)" 后缀的菜单项，系统会用 **snapshot X 的根目录** 启动（同时修改子卷指向，让默认启动也指向该快照）。

**第四步：登录系统后，把默认启动固定到回滚版本**

```bash
# 把 snapshot 5 设为默认（注意不是创建新快照，而是切换默认子卷）
sudo snapper rollback 5

# 或者用 btrfs 命令手动修改默认子卷
sudo btrfs subvolume set-default $(btrfs subvolume list / | grep "@/.snapshots/5/snapshot" | awk '{print $2}')

# 重启验证
sudo reboot
```

**第五步：如果回滚成功，删除出问题的快照**

```bash
sudo snapper delete 6
```

### 5.4 不重启回滚：snapper undochange

**`snapper rollback`** 需要重启，但 **`snapper undochange`** 可以在运行时回滚到某个快照：

```bash
# 撤销从快照 5 到快照 6 的所有变更
# （会把 6 的状态反向修改回 5 的状态）
sudo snapper undochange 5..6

# 撤销 5..6 的 /etc 下变更（只回滚配置文件）
sudo snapper undochange -f 5..6

# 撤销 5..6 的 /usr 下变更（回滚软件包文件）
sudo snapper undochange -f 5..6 /usr
```

**注意**：
- `undochange` 会在当前运行的系统上回滚文件，可能导致正在运行的程序崩溃
- 回滚 `/etc` 风险较高（可能影响正在运行的服务的配置）
- 推荐场景：升级失败后，在重启**之前**先 undochange，或者干脆重启进 snapshot

---

## 六、snap-pac-yr（自动快照增强）

### 6.1 手动定期快照

除了包管理器触发，还可以让 Snapper **定时自动快照**：

```bash
# snapper 自带两个定时器
sudo systemctl status snapper-timeline.timer
sudo systemctl status snapper-cleanup.timer

# 启动并启用
sudo systemctl enable --now snapper-timeline.timer   # 每天创建时间线快照
sudo systemctl enable --now snapper-cleanup.timer    # 每天清理过期快照
```

**默认行为**：
- `snapper-timeline.timer`：每小时一次时间线快照
- `snapper-cleanup.timer`：每天一次清理过期快照（按 TIMELINE_LIMIT_* 配置）

### 6.2 snap-pac 的 pre/post 行为

`snap-pac` 的默认行为：

```bash
# 安装/升级/删除 包都会触发 pre + post 快照
sudo pacman -S htop
# 触发 pre snapshot
# 执行 pacman -S htop
# 触发 post snapshot

# 升级系统
sudo pacman -Syu
# 触发 pre snapshot
# 执行 pacman -Syu
# 触发 post snapshot
```

**避免快照过多**：可以在 `/etc/snapper/configs/root` 中开启 PRE_CLEANUP：

```ini
PRE_CLEANUP="yes"  # 清理无对应 post 的 pre 快照
POST_CLEANUP="yes" # 清理无对应 pre 的 post 快照
```

但通常建议**保留 pre + post 对**，因为这是升级证据。

---

## 七、GRUB 集成：开机选择快照启动

### 7.1 openSUSE 自动配置

openSUSE 默认在 GRUB 中加入所有快照的启动项：

```
GRUB 菜单:
  openSUSE Tumbleweed
  openSUSE Tumbleweed, with Linux 6.x.x-1-default
  openSUSE Tumbleweed, with Linux 6.x.x-1-default (recovery mode)
  ► openSUSE Snapshots
      openSUSE Tumbleweed (snapshot 5)
      openSUSE Tumbleweed (snapshot 6)
      ...
```

### 7.2 Manjaro / Arch 手动配置（grub-btrfs）

```bash
# 安装 grub-btrfs
sudo pacman -S grub-btrfs

# 启用服务（自动从快照检测启动项）
sudo systemctl enable --now grub-btrfsd.service

# 重新生成 GRUB 配置
sudo grub-mkconfig -o /boot/grub/grub.cfg

# 重启后，GRUB 菜单会自动出现 "Arch Linux Snapshots" 子菜单
```

### 7.3 RHEL / CentOS 手动配置

```bash
# RHEL 没有现成的 grub-btrfs 包
# 需要手动写 GRUB 入口或用脚本自动生成

# 方案一：每次创建快照后手动更新 GRUB
cat > /etc/grub.d/35_btrfs_snapshots << 'EOF'
#!/bin/sh
# 列出所有快照
SNAPSHOTS=$(btrfs subvolume list -s / | awk '{print $NF}')
for snap in $SNAPSHOTS; do
    echo "menuentry 'Snapshot $snap' { ... }"
done
EOF

sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

---

## 八、与备份集成：snapshot → 备份

### 8.1 完整备份方案

Snapper 快照虽然好用，但它和快照在**同一个卷**上。如果磁盘物理损坏，快照也救不了你。

```
灾难等级：
  1. 软件故障（升级后系统崩）→ Snapper 快照能救
  2. 误删文件 → Snapper 快照能救
  3. 文件系统损坏 → Snapper 快照可能也坏
  4. 磁盘物理损坏 → Snapper 快照丢失
```

**真正的备份需要 send/receive 到另一块盘或远程服务器**：

```bash
# 把根目录快照发送到外部磁盘
sudo btrfs send /.snapshots/5/snapshot | \
  sudo btrfs receive /mnt/backup-disk/snapshots/

# 增量备份（只发送差异）
sudo btrfs send -p /.snapshots/5/snapshot \
               -c /.snapshots/6/snapshot | \
  sudo btrfs receive /mnt/backup-disk/snapshots/
```

### 8.2 Snapper + btrbk 自动备份

`btrbk` 是基于 btrfs send/receive 的专业备份工具，可以和 Snapper 协同：

```bash
# 安装 btrbk
sudo dnf install btrbk  # 或 apt install btrbk

# 配置 /etc/btrbk/btrbk.conf
cat > /etc/btrbk/btrbk.conf << 'EOF'
# 每小时快照保留 7 份
snapshot_dir /.snapshots
# 目标：本地备份盘
target /mnt/backup-disk/btrbk
target_send_compress zstd
EOF

# 启用定时器
sudo systemctl enable --now btrbk.timer
```

---

## 九、实战案例：完整的"时光机"工作流

### 9.1 场景一：服务器日常升级

```bash
# 1. 升级前查看当前快照
sudo snapper list
# #5  pre    -  2026-07-25 11:30:00  root  number  yum
# #6  post   5 2026-07-25 11:35:00  root  number  yum

# 2. 执行升级
sudo dnf update -y
# 自动创建 #7 (pre) 和 #8 (post)

# 3. 升级成功
sudo reboot
# 启动正常，升级完成

# 4. 一周后，删除旧快照
sudo snapper cleanup timeline
```

### 9.2 场景二：升级失败回滚

```bash
# 1. 升级后某个服务起不来
sudo dnf update -y openssl
sudo systemctl restart nginx
# Job for nginx.service failed because... OpenSSL 错误

# 2. 查看刚才的快照
sudo snapper list
# #9 pre  -  升级前
# #10 post 9 - 升级后（当前问题）

# 3. 方法 A：撤销变更（无需重启，但风险较高）
sudo snapper undochange 9..10

# 4. 方法 B：回滚 + 重启（更安全）
sudo snapper rollback 9
sudo reboot

# 5. 重启后系统回到 #9 的状态
```

### 9.3 场景三：误删重要文件

```bash
# 1. 不小心删了 /etc/nginx/nginx.conf
sudo rm /etc/nginx/nginx.conf
sudo nginx -t
# nginx: [emerg] open() "/etc/nginx/nginx.conf" failed...

# 2. 查找最近的快照
sudo snapper list
# #11 timeline - 昨天 12:00 自动快照

# 3. 从快照恢复文件
sudo cp /.snapshots/11/snapshot/etc/nginx/nginx.conf /etc/nginx/

# 4. 验证
sudo nginx -t
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 9.4 场景四：磁盘空间被快照占满

```bash
# 1. df 命令发现磁盘快满了
df -h /
# /dev/sda2  100G  90G  10G  90%  /

# 2. 查看快照占用
sudo btrfs filesystem du -s /.snapshots/*
# 输出每个快照占用的空间

# 3. 清理旧快照
sudo snapper cleanup timeline

# 4. 如果还不行，手动删除
sudo snapper delete 1-50

# 5. 立即释放空间（btrfs 不会自动回收 extent）
sudo btrfs balance start /

# 6. 验证
df -h /
# /dev/sda2  100G  60G  40G  60%  /
```

---

## 十、常见问题与排查

### 10.1 "snapper list" 报 IO Error

```bash
# 原因：SUBVOLUME 配置错误
# 解决：检查 /etc/snapper/configs/root
sudo cat /etc/snapper/configs/root | grep SUBVOLUME
# 应该是 SUBVOLUME="/"
# 如果是 SUBVOLUME="/path/to/subvol"，确认路径存在
```

### 10.2 snapper rollback 重启后还是新版本

```bash
# 原因：snapper rollback 需要 GRUB 配合
# 解决：检查 /etc/fstab
grep " / " /etc/fstab
# 应该是 subvol=@ 形式

# 重新生成 GRUB 配置
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

### 10.3 快照太多，磁盘爆了

```bash
# 查看所有快照占用
sudo btrfs qgroup show /

# 强制清理
sudo snapper delete $(sudo snapper list --columns number | tail -n +3)

# 平衡（回收已删除快照的空间）
sudo btrfs balance start -dusage=50 /
```

### 10.4 Snapper 钩子没生效（升级没创建快照）

```bash
# 检查钩子是否安装
rpm -qa | grep dnf-plugin-snapper
# 或
pacman -Q | grep snap-pac

# 检查 snapper 是否运行
sudo systemctl status snapperd

# 手动触发一次快照测试
sudo snapper create --description "测试快照"
```

### 10.5 Snapper 占用 CPU/IO 资源

```bash
# 限制 Snapper 的 I/O 优先级
# 在 /etc/snapper/configs/root 中添加：
BACKGROUND_COMPARISON="no"   # 关闭后台对比
EMPTY_PRE_POST_CLEANUP="yes" # 清理空快照

# 减少快照数量
TIMELINE_LIMIT_HOURLY="3"
TIMELINE_LIMIT_DAILY="5"
```

---

## 十一、生产环境最佳实践

### 11.1 推荐的配置文件（生产服务器）

```ini
# /etc/snapper/configs/root
SUBVOLUME="/"
FSTYPE="btrfs"

# 空间管理：保留 30% 给快照，超过自动清理
SPACE_LIMIT="0.3"
FREE_LIMIT="0.15"

# 时间线快照策略（精简版）
TIMELINE_CREATE="yes"
TIMELINE_LIMIT_HOURLY="3"   # 每小时 3 个
TIMELINE_LIMIT_DAILY="5"    # 每天 5 个
TIMELINE_LIMIT_WEEKLY="2"   # 每周 2 个
TIMELINE_LIMIT_MONTHLY="3"  # 每月 3 个
TIMELINE_LIMIT_YEARLY="0"

# 包管理器钩子清理
PRE_CLEANUP="yes"
POST_CLEANUP="yes"
```

### 11.2 监控脚本

```bash
#!/bin/bash
# /usr/local/bin/snapper-monitor.sh
# 监控 Snapper 状态，异常时报警

SNAP_COUNT=$(sudo snapper list --columns number | tail -n +3 | wc -l)
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "WARNING: 磁盘使用率 ${DISK_USAGE}%，快照可能占用了空间"
    sudo snapper cleanup timeline
fi

if [ "$SNAP_COUNT" -gt 200 ]; then
    echo "WARNING: 快照数量 $SNAP_COUNT 过多，建议清理"
fi
```

```bash
# 添加到 crontab，每小时检查
0 * * * * /usr/local/bin/snapper-monitor.sh
```

### 11.3 安全建议

```
1. 定期验证快照可恢复
   - 不要以为快照存在就能恢复
   - 每月做一次实际恢复演练

2. 重要的快照远程备份
   - btrfs send/receive 到远程机器
   - 重要升级前的快照，单独备份

3. 不要在数据库服务运行时 undochange
   - undochange 会改变正在运行的程序文件
   - 可能导致数据库损坏

4. 监控快照空间
   - 快照也可能撑爆磁盘
   - 设置合理的 SPACE_LIMIT

5. 配合 systemd-tmpfiles 清理 /tmp
   - /tmp 中的临时文件不参与快照
   - 但 Snapper 不管理它
```

---

## 十二、与其他快照工具对比

| 工具 | 文件系统 | 集成方式 | 适合场景 |
|------|---------|---------|---------|
| **Snapper** | Btrfs | 包管理器钩子 | 服务器系统盘 |
| **LVM 快照** | LVM | 手动 | 老旧 LVM 系统 |
| **Timeshift** | Btrfs / rsync | 手动 + 定时 | 桌面用户 |
| **ZFS Auto-Snapshot** | ZFS | cron | FreeBSD / NAS |
| **rsnapshot** | 任意 | cron + rsync | 通用备份 |

**Snapper 的独特优势**：**与包管理器深度集成**——其他工具都做不到"升级前自动快照"。

---

## 十三、未来展望：Snapper 与 Snapper 2.0

openSUSE 团队正在开发 **Snapper 2.0**，主要改进：

- 原生 ext4 支持（基于 metadata-level 快照）
- 改进的 LXD/LXC 集成
- 更好的 NFS/SMB 远程快照
- 配置文件格式升级

未来 Snapper 也许会扩展到非 Btrfs 文件系统，但目前 **Btrfs + Snapper 仍是最佳组合**。

---

## 结语

回顾整篇文章，我们搭建了一套**完整的"服务器时光机"**：

```
核心组件：
  - Btrfs 文件系统（COW 快照基础）
  - Snapper 工具（快照管理器）
  - snap-pac / dnf-plugin-snapper（包管理器钩子）
  - grub-btrfs（GRUB 启动菜单集成）
  - btrbk（远程备份，可选）

核心能力：
  1. 升级前自动快照，升级失败一键回滚
  2. 配置文件变更可追溯（snapper status / diff）
  3. 误删文件从快照恢复
  4. 配合 send/receive 做异地备份
```

**从今天起，运维人员可以大胆地执行 `yum update` 了——反正下一秒就能回到过去**。

Linux 生态从来不是"靠勇气运维"的系统，Btrfs + Snapper 让我们在追求效率的同时，也有了**安全的底气**。

运维不应该是孤独的冒险，而应该是**有后盾的工程**。Snapper，就是那个后盾。

---

**相关推荐阅读**：

- [ext4 / Btrfs / NTFS / XFS 四大文件系统深度对比](https://blog.example.com/file-systems-comparison)
- [Linux 服务器故障排查：从崩溃到修复的实战指南](https://blog.example.com/linux-server-troubleshooting)
- [Ansible 自动化运维：让服务器批量配置标准化](https://blog.example.com/ansible-automation)
