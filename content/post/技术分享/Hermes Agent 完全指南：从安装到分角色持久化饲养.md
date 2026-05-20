---
title: "Hermes Agent 完全指南：从安装到分角色持久化饲养"
description: "Hermes Agent 是 Nous Research 出品的开源 AI 终端助手，功能强大且高度可定制。本文详细介绍安装配置、持久化任务系统、分角色饲养技巧，以及和生产力的结合方法。"
slug: "hermes-agent-complete-guide-persistent-tasks-roles"
date: 2026-05-16T11:00:00+08:00
image: ""
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["技术分享"]
tags:
  [
    "Hermes Agent",
    "AI助手",
    "终端工具",
    "自动化",
    "大模型",
    " Nous Research",
    "持久化任务",
    "Cron",
    "SOUL.md",
    "角色系统",
  ]
---

# Hermes Agent 完全指南：从安装到分角色持久化饲养

## 前言

最近在找一个真正能融入日常工作的 AI 助手，试了不少方案——ChatGPT CLI、Claude Code、OpenAI CLI……要么太重，要么功能太散，要么就是"一次性对话"用完就忘。

直到我遇到了 **Hermes Agent**。

它是 Nous Research（就是那个做 Hugging Face 模型的公司）开源的终端 AI 助手，最打动我的不是某个单一功能，而是它整个设计理念：**像一个真正的同事，而不是一个问答机器**。

它能记住我的偏好，能定时跑任务，能分角色工作，能跨会话保持上下文，还能接入各种平台（Discord、Telegram、Slack……）。今天这篇文章，把我踩过的坑、总结的经验全部整理出来，供大家参考。

---

## 一、Hermes Agent 是什么

简单说：Hermes Agent 是一个运行在终端里的 AI 助手，基于大语言模型驱动，但比普通对话强得多。

它的核心特点：

```
持久化记忆  → 跨会话记住你的偏好、项目、环境
分角色系统  → 可以为不同场景定义不同的人格和工作方式
定时任务    → 像 cron 一样自动运行任务，结果推送到任意平台
工具集系统  → Web搜索、终端命令、文件编辑、代码执行、浏览器自动化……
Skills系统  → 可插拔的工作流知识库，按需加载
多平台接入  → Telegram、Discord、Slack、WhatsApp、邮件等
MCP支持    → 可以连接任何 MCP 服务器扩展工具能力
持久化 Session → 对话不丢失，随时可以继续
```

官方文档：[https://hermes-agent.nousresearch.com](https://hermes-agent.nousresearch.com)

---

## 二、安装——Windows 用户需要注意的事

### 2.1 环境要求

**最重要的事说在前面：Hermes Agent 需要类 Unix 环境，不支持原生 Windows。**

Windows 用户必须先装 WSL2（Windows Subsystem for Linux），然后在 WSL2 里运行。

```
需要的条件：
- Python 3.10+
- pip 或 uv 包管理器
- WSL2（Windows 用户）
- Linux / macOS 直接装即可
- 一个 64K 以上上下文窗口的大模型（后面会讲怎么配置）
```

### 2.2 安装步骤（以 Linux/macOS/WSL2 为例）

**方式一：pip 安装（最简单，推荐）**

```bash
pip install hermes-agent
hermes postinstall     # 可选：自动安装 Node.js、浏览器、ripgrep、ffmpeg
```

**方式二：官方安装脚本（跟踪 main 分支，获取最新功能）**

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

安装完成后重载 shell：

```bash
source ~/.bashrc   # 如果用 bash
source ~/.zshrc    # 如果用 zsh
```

**Windows + WSL2 注意事项：**

```
1. 先安装 WSL2（PowerShell 管理员模式）：
   wsl --install

2. 装完重启后进入 WSL：
   wsl

3. 然后在 WSL 里执行上面的安装命令

4. 图形界面：WSL2 需要 X Server 才能显示图形窗口
   如果要跑浏览器自动化，需要配置 WSLg 或用 vcxsrv
```

### 2.3 初始化配置

```bash
hermes setup
```

这个交互式向导会引导你完成：

- 选择 AI 模型供应商
- 配置 API Key
- 设置终端工具集
- 基本配置确认

### 2.4 配置 AI 模型供应商

这是最关键的一步。Hermes 支持非常多的模型供应商：

| 供应商           | 说明                              | 适合场景             |
| ---------------- | --------------------------------- | -------------------- |
| Nous Portal      | Nous Research 自家平台，零配置    | 快速上手             |
| OpenAI           | GPT-4o / GPT-5 系列               | 通用对话、复杂推理   |
| Anthropic        | Claude 系列                       | 高质量写作、长上下文 |
| OpenRouter       | 聚合数十个模型，一个 API key 搞定 | 灵活切换模型         |
| 阿里云 DashScope | 通义千问（Qwen）系列              | 中文场景、国内用户   |
| DeepSeek         | DeepSeek 系列                     | 性价比高             |
| Ollama           | 本地模型                          | 隐私敏感、无网络环境 |
| vLLM / SGLang    | 自托管模型                        | 企业内网部署         |

**连接 Ollama 本地模型（最推荐的免费方案）：**

```bash
# 先确保 Ollama 已经跑起来，下载需要的模型
ollama pull qwen3.5:27b
ollama pull gemma4

# 然后在 Hermes 里配置
hermes model
# → 选择 "Custom endpoint (enter URL manually)"
# → URL 填：http://127.0.0.1:11434/v1
# → API Key 留空（Ollama 不需要）
# → 模型名填：qwen3.5:27b（或 gemma4）
```

**Windows 用户如果 Ollama 在宿主机而非 WSL2 里**，需要把 URL 改成 Windows 的 IP：

```bash
# 在 PowerShell 里查本机 IP
ipconfig

# Ollama 默认端口 11434，URL 改成：
# http://<你的IP>:11434/v1
```

### 2.5 验证安装

```bash
hermes
# 或者用新版 TUI 界面（推荐）
hermes --tui
```

第一次运行应该能看到欢迎横幅，显示你选的模型、可用工具集、已安装的 Skills。

如果看到回复正常，恭喜，安装成功了！

---

## 三、核心概念：理解 Hermes 的设计逻辑

在开始用之前，先理解几个核心概念，能让你少走很多弯路。

### 3.1 Session（会话）——对话不丢失

Hermes 的每个对话都是一个 Session，存储在 SQLite 数据库里（`~/.hermes/state.db`）。

```
hermes                  # 开始新对话
hermes --continue       # 继续上一个对话（-c 是短写法）
hermes sessions list    # 查看所有历史会话
```

这解决了一个很大的痛点：**用 ChatGPT 的时候，聊着聊着换了话题，回头想找之前的内容就找不到了**。Hermes 的 Session 可以随时恢复，还能按关键词搜索历史对话。

### 3.2 Memory（记忆系统）——让 AI 记住你

Hermes 有两套持久化记忆：

| 文件        | 用途                                          | 字符上限 | 大约 Token |
| ----------- | --------------------------------------------- | -------- | ---------- |
| `MEMORY.md` | AI 的个人笔记：环境事实、项目规范、学到的东西 | 2,200    | ~800       |
| `USER.md`   | 用户画像：偏好、交流风格、技能水平            | 1,375    | ~500       |

文件位置：`~/.hermes/memories/`

**记忆在系统提示词里的样子：**

```
══════════════════════════ MEMORY (personal notes) [67% — 1,474/2,200 chars] ══════════════════════════
User's project is a Rust web service at ~/code/myapi using Axum + SQLx
This machine runs Ubuntu 22.04, has Docker installed
User prefers concise responses, dislikes verbose explanations
```

**为什么有容量限制？** 因为记忆内容会进入每次对话的系统提示词，容量太大会浪费 Token、增加延迟、浪费钱。限制是刻意设计的。

**什么时候该存记忆？**

```
应该存：
  ✓ 用户偏好："我喜欢 TypeScript，不喜欢 JavaScript"
  ✓ 环境事实："这台服务器是 Debian 12，跑着 PostgreSQL 16"
  ✓ 修正："不要用 sudo 运行 Docker，用户在 docker 组里"
  ✓ 项目规范："项目用 tabs，120字符宽限，Google 风格文档注释"
  ✓ 学到的教训："测试服务器 SSH 端口是 2222，不是默认的 22"
  ✓ 重要事实："我的 API key 每月轮换一次"

不应该存：
  ✗ 太模糊的信息："用户问了 Python" —— 说了等于没说
  ✗ 能重新搜到的："Python 3.12 支持 f-string 嵌套" —— 随时能查
  ✗ 大段原始数据：代码块、日志、数据表 —— 记忆装不下
  ✗ 单会话的临时信息：临时文件路径、一次性的调试上下文
```

### 3.3 SOUL.md——定义 AI 的人格

`SOUL.md` 是 Hermes 的**人格定义文件**，它决定了 AI 怎么说话、什么风格、什么态度。

文件位置：`~/.hermes/SOUL.md`

**一个好的 SOUL.md 示例：**

```markdown
# Personality

你是一个务实的老工程师，有清晰的判断力。
你追求真相、清晰和有用，而不是礼貌性的废话。

## 风格

- 直接但不冷漠
- 喜欢干货，不喜欢废话
- 发现问题会直接指出来
- 不确定的事情会直接说"我不确定"
- 除非需要深度解释，否则保持简洁

## 避免

- 拍马屁
- 过度热情或 hype 语言
- 用户说错了还顺着说
- 过度解释显而易见的事情

## 技术态度

- 简单系统优于复杂系统
- 关注真实可用的方案，不追求理想架构
- 边界情况是设计的一部分，不是最后清理
```

**和 AGENTS.md 的区别：**

```
SOUL.md  → 身份认同、语气、沟通风格、性格（持久跟随，不分项目）
AGENTS.md → 项目架构、编码规范、工具偏好、仓库约定（跟项目走）
```

简单记忆法：**跟你这个人走的 → SOUL.md；跟这个项目走的 → AGENTS.md。**

### 3.4 Skills——按需加载的知识包

Skills 是 Hermes 的可插拔知识系统。你可以理解为"给 AI 装备的专业工具书"。

```
hermes skills search kubernetes    # 搜索某个领域的 skill
hermes skills install openai/k8s   # 安装某个 skill
```

内置的 Skills 包括：`plan`（生成实施计划）、`excalidraw`（画图）、`github-pr-workflow`（GitHub PR 工作流）、`gif-search`（搜 GIF）……

Skills 支持**渐进式加载**（Progressive Disclosure），不会一次性把全部内容塞进上下文：

```
Level 0: skills_list()      → 只返回名称和描述列表（~3k tokens）
Level 1: skill_view(name)    → 加载完整 Skill 内容（按需）
Level 2: skill_view(name, path) → 加载 Skill 的某个具体文件
```

---

## 四、持久化任务系统——像 cron 一样工作

这是 Hermes 最强大的功能之一：**自然语言创建定时任务**。

### 4.1 基本用法

**方式一：对话中直接说**

```
用户：每天早上 9 点，帮我检查 GitHub 有没有什么重要的新 issue，然后发摘要到我的 Telegram。

Hermes：好的，我已经创建了一个每天 9 点的定时任务，检测新的 GitHub issues 并汇总。
        任务 ID：abc123，你之后可以用 /cron list 查看和 管理它。
```

**方式二：用 /cron 命令**

```bash
/cron add 30m "提醒我站起来活动一下"
/cron add "every 2h" "检查服务器状态"
/cron add "every 1h" "检查有没有新的博客文章" --skill blogwatcher
/cron add "every 1h" "同时用两个 skill" --skill blogwatcher --skill maps
```

**方式三：用 hermes 命令行**

```bash
hermes cron create "every 2h" "检查服务器状态"
hermes cron create "every 1d at 09:00" "检查 GitHub issues" --skill github
hermes cron create "every 1d at 09:00" "同时用两个 skill" --skill blogwatcher --skill maps --name "早间简报"
```

### 4.2 定时表达式

Hermes 支持自然语言和标准 cron 表达式：

```
30m          → 30分钟后
every 2h     → 每2小时
every 1d at 09:00  → 每天9点
every 1w     → 每周
every 6h     → 每6小时
"0 9 * * *"  → 标准 cron 表达式：每天9点
"*/15 * * * *"  → 标准 cron：每15分钟
```

### 4.3 任务生命周期管理

```bash
/cron list              # 列出所有任务
/cron pause <job_id>    # 暂停任务
/cron resume <job_id>   # 恢复任务
/cron run <job_id>      # 手动触发一次
/cron edit <job_id> --schedule "every 4h"   # 修改执行周期
/cron edit <job_id> --prompt "新的任务描述"  # 修改任务内容
/cron edit <job_id> --skill blogwatcher      # 添加 skill
/cron edit <job_id> --remove-skill blogwatcher  # 移除 skill
/cron remove <job_id>  # 删除任务
```

### 4.4 在指定项目目录运行

默认情况下，定时任务在系统默认目录运行，不加载项目配置。

如果想在特定项目目录下运行（比如加载 `AGENTS.md`、`CLAUDE.md`）：

```bash
hermes cron create "every 1d at 09:00" \
  "检查 CI 健康状态，汇总 PR" \
  --workdir /home/me/projects/acme
```

**重要：** 带 `workdir` 的任务会**串行执行**（而不是并行），因为多个任务同时修改 `TERMINAL_CWD` 会产生冲突。

### 4.5 多平台结果推送

定时任务的结果不只是存在本地，可以直接推送到各个平台：

```
发送到源对话    → 在哪个对话创建的就发回哪里（默认）
发送到 Telegram → 配置好 Telegram Bot 后直接推送消息
发送到 Discord  → Webhook 方式发送到指定频道
发送到文件      → 写入本地文件
```

在平台对话里创建的定时任务，会默认推送到那个平台。

### 4.6 无 Agent 模式

定时任务有两种运行模式：

```
有 Agent 模式（默认）：完整 LLM 参与，执行复杂判断和推理
无 Agent 模式：纯脚本执行，stdout 直接推送，零 LLM 消耗
```

无 Agent 模式适合简单到不需要 AI 判断的重复性工作：

```bash
# 通过 cronjob tool 调用：
cronjob(
    action="create",
    prompt="tail -100 /var/log/app.log | grep ERROR",
    schedule="every 5m",
    agent_enabled=False,  # 关闭 Agent，只跑脚本
    name="错误日志监控"
)
```

---

## 五、分角色饲养——让多个 AI 同时为你工作

这是 Hermes 最有趣的设计：**同一个 AI 实例，可以养出不同"性格"的副手**。

### 5.1 为什么需要分角色

一个人工作的时候，通常会有多种场景：

```
工作模式  → 需要严谨、专业、注重细节
学习模式  → 需要耐心解释、能举例子
个人助理模式  → 需要简洁、快速、不废话
创意头脑风暴  → 需要跳脱、不拘一格
```

给每个场景配一个专属的 AI 人格，效率会高很多——不用每次都从头解释"我今天想让你怎么工作"。

### 5.2 内置角色切换

Hermes 内置了很多有趣的角色，可以随时切换：

```bash
/personality helpful     # 友好的通用助手
/personality concise     # 简洁直接，只说重点
/personality technical   # 技术专家模式，细节丰富
/personality creative    # 创意头脑风暴
/personality teacher     # 耐心的老师，举例清晰
/personality kawaii      # 可爱风格，星星眼 ✨
/personality catgirl     # 猫娘风格， nya~
/personality pirate      # 海盗船长风格
/personality shakespeare # 莎士比亚戏剧风格
/personality noir        # 黑色电影侦探风格
/personality uwu         # 极可爱风格
/personality philosopher # 哲学家模式，深沉思考
/personality hype        # 超级亢奋风格 !!!
```

示例效果：

```
/personality pirate
用户：解释一下什么是 REST API
船长 Hermes：
"Ahoy there, matey! Ye be askin' about REST APIs, aye?
Arr, let me spin ye a tale... A REST API be like a tavern's service bell —
ye ring it with a proper request, the barkeep brings ye the right grog.
GET be checkin' the menu, POST be orderin' a new drink,
PUT be changin' yer order, DELETE be cancellin' the tab.
Arr! 🦜"
```

### 5.3 自定义角色

**方式一：通过 SOUL.md 设置全局默认人格**

编辑 `~/.hermes/SOUL.md`：

```markdown
# Hermes - 你的默认人格

你是一个务实的技术人，讲究效率，追求真相。
你的风格：直接、有深度、偶尔带点幽默。
你不拍马屁，有问题直接说。
```

**方式二：通过 config.yaml 定义命名角色**

```yaml
# ~/.hermes/config.yaml
agent:
  personalities:
    codereviewer: >
      你是一个严谨的代码审查员。
      你的工作是找出 bug、安全漏洞、性能问题和不清晰的设计。
      你直接、准确、有建设性。
      审查时先说结论，再给具体改进建议。

    dataanalyst: >
      你是一个专业的数据分析师。
      你擅长用数据讲故事，习惯用图表辅助说明。
      你的分析遵循"假设-验证-结论"的流程。
      输出结构：发现 → 数据支撑 → 建议

    writingassistant: >
      你是一个写作助手，风格清晰简洁。
      你擅长把复杂的事情用简单的语言说清楚。
      你会主动建议删除废话，简化表达。
```

然后切换：

```bash
/personality codereviewer   # 切换到代码审查员模式
/personality dataanalyst    # 切换到数据分析师模式
/personality writingassistant  # 切换到写作助手模式
```

**方式三：每个项目一套角色**

在项目根目录放一个 `SOUL.md`，这个项目就自动使用该角色：

```
~/code/my-blog/
├── SOUL.md       # 这个项目专属人格：博客写作者
├── AGENTS.md    # 项目规范
└── content/
    └── ...

~/code/my-api/
├── SOUL.md       # 这个项目专属人格：后端工程师
├── AGENTS.md    # 项目规范
└── src/
    └── ...
```

**原理：** Hermes 会从当前工作目录加载 `SOUL.md` 和 `AGENTS.md`。所以你在哪个目录启动对话，就会用哪个目录的配置。

### 5.4 多角色协作工作流

一个实际的工作流示例：

```
场景：开发一个新功能

角色1：Architect（架构师）
  /personality technical
  "帮我设计一个用户积分系统的架构"
  → 输出：整体设计、数据库结构、API 规范

角色2：Developer（开发者）
  /personality default（你的全局 SOUL）
  "按照刚才的架构，实现这个功能"
  → 输出：具体代码实现

角色3：CodeReviewer（代码审查员）
  /personality codereviewer
  "审查刚才写的代码，重点关注安全性和性能"
  → 输出：审查意见、改进建议

角色4：TestEngineer（测试工程师）
  "为这个功能设计测试用例"
  → 输出：单元测试、集成测试、E2E 测试用例
```

这种工作流的精髓在于：**每个角色都有自己专注的视角，不会混在一起处理**。你不需要在"写代码"和"检查代码"之间切换上下文，切换角色就行。

### 5.5 角色的记忆隔离

不同角色可以有不同的记忆：

```
Architect 的 MEMORY.md：
  - 熟悉微服务架构，有 5 年系统设计经验
  - 偏好用图表辅助设计
  - 关注可扩展性和技术债务

Developer 的 MEMORY.md：
  - 熟悉 Python 和 Go
  - 偏好 TDD 开发方式
  - 关注代码可读性和测试覆盖
```

**注意：** 角色的记忆存储在同一个 `~/.hermes/memories/` 目录，但可以在对话中通过不同 Session 隔离使用。

### 5.6 Auto-Routing：消息自动路由到对应角色

Hermes 正在开发一个很酷的功能：**根据消息内容自动路由到最合适的角色**。

```
你发消息："帮我优化一下数据库查询性能"
  → 自动路由到 "Database Expert" 角色（加载数据库优化相关的 SOUL）

你发消息："写一封给客户的道歉邮件"
  → 自动路由到 "Writing Assistant" 角色（加载写作规范）

你发消息："这个模块的代码有问题"
  → 自动路由到 "Code Reviewer" 角色
```

目前这个功能还在发展中，但设计思路已经明确了：通过轻量级分类，自动把消息路由到对应的角色 Session，每个角色有自己独立的系统提示词和工作上下文。

---

## 六、进阶技巧

### 6.1 工具集（Toolsets）按平台配置

不同平台（CLI、Telegram、Discord……）可以开启不同的工具集：

```bash
hermes tools     # 交互式配置每个平台启用哪些工具集
```

可用工具集：

```
terminal       → 终端命令执行
read_file      → 读取文件
write_file     → 写文件
patch          → 补丁编辑
search_files   → 搜索文件
execute_code   → 执行代码
web            → 网页浏览
browser        → 浏览器自动化
memory         → 记忆管理
skills         → Skills 管理
cronjob        → 定时任务管理
```

**安全建议：** Telegram/Discord 等公共平台**不要开启** `write_file` 和 `terminal`，只开 `read_file` 和 `web`。CLI 可以全开。

### 6.2 MCP 服务器接入

MCP（Model Context Protocol）可以让 Hermes 连接各种外部服务：

```yaml
# ~/.hermes/config.yaml
mcp_servers:
  github:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxxx"
```

接入后，Hermes 可以直接操作你的 GitHub 仓库、数据库、各种 API——不需要写额外的集成代码。

### 6.3 记忆满了怎么办

当 `MEMORY.md` 快满时（超过 80%），需要整理：

```bash
# 查看当前记忆使用量
# （在系统提示词头部可以看到百分比）

# 让 Hermes 自动整理：
"我的记忆快满了，帮我整理一下，删除不重要的，合并相关的"
```

手动整理技巧：

```
合并多个相关条目 → 3 条"项目用 X" 可以合并成 1 条综合描述
删除过期条目 → "测试服务器 IP 是 10.0.1.50" 这种如果服务器已经下线就删掉
精简冗余表达 → "这个项目使用 Python" 变成 "项目：~/code/api，Python + FastAPI"
```

### 6.4 会话搜索

如果某个信息不在记忆里，但记得在之前的对话中聊过：

```bash
hermes sessions list   # 列出所有历史会话
# 找到相关的会话后，Hermes 可以滚动浏览该会话的完整内容
```

**注意：** 记忆（MEMORY.md）存的是关键事实，Session Search 存的是所有对话历史。前者是精心挑选的，后者是完整的。

|      | 持久记忆             | 会话搜索            |
| ---- | -------------------- | ------------------- |
| 容量 | ~1,300 tokens        | 无限制（所有历史）  |
| 速度 | 即时（系统提示词里） | ~20ms（FTS5 搜索）  |
| 成本 | 每次对话都消耗 Token | 免费（本地 SQLite） |
| 用途 | 关键事实始终可用     | 找具体讨论内容      |

### 6.5 Checkpoints（快照回滚）

Hermes 在修改文件之前会自动打快照，出问题可以回滚：

```bash
/rollback   # 回滚到上一次快照
```

### 6.6 代理和回退策略

可以配置多个模型供应商，设置优先级：

```yaml
# ~/.hermes/config.yaml
model:
  default: anthropic/claude-sonnet-4.6
  provider_routing:
    enabled: true
    strategy: cost # 按成本排序，或 speed / quality
    fallback:
      - provider: openai
        model: gpt-4.1
      - provider: deepseek
        model: deepseek-chat
```

主模型出问题，自动切换到备选模型，不中断工作。

---

## 七、实际工作流示例

### 7.1 日常开发工作流

```
早上 9:00（定时任务）：
  → 自动检查 GitHub 新 PR、新 Issue、新 CI 状态
  → 汇总发到 Discord 频道

上午：
  /personality technical
  "帮我分析 ~/code/api 的性能瓶颈"
  → 架构分析，输出改进建议

下午：
  /personality codereviewer
  "帮我 review 这几个 PR：#123, #124, #125"
  → 详细代码审查，输出意见

下班前：
  /personality default
  "把今天的进度整理成工作日志，写到 ~/notes/daily/2026-05-05.md"
  → 自动生成工作总结
```

### 7.2 内容创作工作流

```
/personality writingassistant
"我要写一篇关于 Kubernetes 持久化卷的博客，帮我列大纲"
→ 输出：文章结构、每个章节的核心论点、推荐配图方向

/plan "用上一个大纲，写一篇 3000 字的技术博客"
→ 输出：Markdown 格式完整文章

/personality technical
"帮我检查这篇文章的技术准确性，重点检查 Kubernetes PV/PVC 部分"
→ 输出：技术校验意见

/hermes acp   # 在 VS Code 里直接查看和编辑生成的内容
```

### 7.3 个人知识管理

```
"帮我把 ~/docs 目录下的所有 markdown 文件整理成一个知识图谱，输出到 ~/notes/knowledge-map.md"
"每周日 20:00 扫描一遍我的笔记目录，找出这周新加的内容，汇总更新"
"帮我建立一个书签知识库，分类整理我常看的技术博客"
```

---

## 八、常见问题与排障

### 8.1 Hermes 启动后没有回复或回复异常

```bash
# 按顺序排查
hermes doctor          # 诊断配置问题
hermes model           # 确认模型供应商和 API Key 配置正确
```

### 8.2 自定义 Endpoint（Ollama/vLLM）返回乱码

```bash
# 常见原因：
# 1. Base URL 写错了（结尾多了/或少了一些路径）
#    正确：http://127.0.0.1:11434/v1  （注意是 /v1，不是根路径）
# 2. 模型名称拼写错误
#    检查 ollama list 确认实际模型名

# 先用 curl 验证 endpoint 是否正常
curl http://127.0.0.1:11434/v1/models
```

### 8.3 定时任务没有执行

```bash
hermes gateway status   # 检查 gateway 是否在运行（定时任务依赖 gateway）
hermes cron list        # 确认任务确实存在
hermes cron run <id>    # 手动触发一次，看错误信息
```

### 8.4 记忆没有保存

```bash
# 检查会话是否正常保存
hermes sessions list

# 检查记忆文件权限
ls -la ~/.hermes/memories/

# 如果文件不存在或权限不对，重建
hermes memory setup
```

### 8.5 WSL2 下权限问题

```bash
# Windows 文件系统（/mnt/c）可能有权限问题
# 建议把 Hermes 配置放在 WSL 文件系统里，不要放在 /mnt/c 下

# 检查 HERMES_HOME
echo $HERMES_HOME   # 应该在 ~/.hermes，不是 /mnt/c/...
```

---

## 九、配置参考

### 9.1 完整 config.yaml 示例

```yaml
# ~/.hermes/config.yaml

# 模型配置
model:
  default: anthropic/claude-opus-4.5
  provider_routing:
    enabled: false
    fallback:
      - provider: openai
        model: gpt-4.1
      - provider: deepseek
        model: deepseek-chat

# 记忆配置
memory:
  memory_enabled: true
  user_profile_enabled: true
  memory_char_limit: 2200
  user_char_limit: 1375

# 终端配置
terminal:
  backend: local # local / docker / ssh
  # backend: docker  # 安全隔离用 docker

# Agent 配置
agent:
  # 内置人格定义
  personalities:
    codereviewer: >
      你是严格的代码审查员，关注安全性、性能、可读性。
      发现问题直接说，不绕弯子。

# MCP 服务器
mcp_servers:
  # github:
  #   command: npx
  #   args: ["-y", "@modelcontextprotocol/server-github"]
  #   env:
  #     GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_xxx"
```

### 9.2 关键环境变量

```bash
# ~/.hermes/.env

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxx

# OpenAI
OPENAI_API_KEY=sk-xxxx

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxxx

# 阿里云（通义千问）
DASHSCOPE_API_KEY=sk-xxxx

# DeepSeek
DEEPSEEK_API_KEY=sk-xxxx

# Ollama（本地，无需 API Key）
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
```

---

## 十、总结

用 Hermes Agent 这段时间，我最大的感受是：**它不只是一个 AI 对话工具，而是一个可以"养成"的工作伙伴。**

```
记忆 → 记住你的偏好和环境，不用每次都重新解释
角色 → 不同场景用不同模式，不用切换上下文
定时任务 → 把重复劳动自动化，空出时间做真正需要思考的事
Session → 对话不丢失，随时可以继续
Skills → 把工作流封装成可复用的工具包
```

如果你也在找一款能真正融入日常工作的 AI 助手，建议先从安装开始，配置好一个趁手的模型，然后开一个真实的对话试试。

安装文档：[https://hermes-agent.nousresearch.com/docs/getting-started/quickstart](https://hermes-agent.nousresearch.com/docs/getting-started/quickstart)

有问题可以在 GitHub 上提 Issue：https://github.com/NousResearch/hermes-agent

---

_关联文章：_

- _《n8n 自动化工具与大模型集成实战指南》—— 另一个强大的自动化工具，适合图形化工作流_
- _《大模型赋能：独立开发 AI 应用全指南》—— 如何用 LLM API 构建自己的 AI 应用_
- _《从零理解 Transformer：让大模型听懂人话的技术底层》—— 理解 AI 助手背后的原理_
