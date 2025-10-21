---
title: hugo 使用教程
description: Create beautiful interactive image gallery using Markdown
draft: false
date: 2025-10-21
tags:
  - hugo
---




## 📝 ​**Front Matter 属性详解**​

### ​**1. 基础属性**​

```
---
title: "心清如水"           # 文章标题（必填）
description: ""            # 文章描述/摘要（SEO重要）
date: 2025-10-21T18:48:36+08:00  # 创建时间（自动生成）
---
```

### ​**2. 媒体相关**​

```
image: ""                  # 文章特色图片路径
# 示例: image: "/images/featured.jpg"
# 示例: image: "https://example.com/image.jpg"
```

### ​**3. 功能开关**​

```
math: false                # 是否启用数学公式渲染（KaTeX）
license: ""                # 版权声明（如："CC BY-NC-ND 4.0"）
hidden: false              # 是否在列表中隐藏（但仍可直接访问）
comments: true             # 是否启用评论系统
draft: true                # 是否为草稿模式（重要！）
```

---

## 🎯 ​**重点属性说明**​

### ​**`draft: true`（草稿模式）​**​

```
draft: true    # 草稿：不会在正式构建中发布
draft: false   # 正式：会发布到网站
```

​**构建时的区别：​**​

```
# 默认不构建草稿
hugo

# 构建包含草稿
hugo --buildDrafts
# 或
hugo -D

# 开发服务器查看草稿
hugo server -D
```

### ​**`date`（日期控制）​**​

```
# 控制文章排序和发布
date: 2025-10-21T18:48:36+08:00  # 精确到秒
date: 2025-10-21                 # 只到日期
```

---

## 🔧 ​**常用属性补充**​

### ​**分类和标签**​

```
categories: ["技术", "Hugo"]
tags: ["前端", "静态网站", "教程"]
```

### ​**作者信息**​

```
author: "你的名字"
authors: ["作者1", "作者2"]
```

### ​**自定义参数**​

```
params:
  featured_image: "/images/cover.jpg"
  reading_time: true  # 显示阅读时间
  toc: true          # 显示目录
```

---

## 📁 ​**完整示例**​

```
---
title: "Hugo Front Matter 详解"
description: "全面解析 Hugo 文章元数据的各项属性"
date: 2025-10-21T18:48:36+08:00
image: "/images/hugo-frontmatter.jpg"
math: false
license: "CC BY-NC-SA 4.0"
hidden: false
comments: true
draft: false
categories: ["技术", "博客"]
tags: ["Hugo", "Front Matter", "教程"]
author: "你的名字"
params:
  toc: true
  reading_time: true
---
```

---

## 🚀 ​**最佳实践建议**​

### ​**1. 必填属性**​

```
title:    # 必须有标题
date:     # 必须有日期（Hugo自动生成）
draft:    # 明确是否为草稿
```

### ​**2. SEO优化**​

```
description: "50-160字符的吸引人描述"
image: "高质量的特色图片"
```

### ​**3. 组织管理**​

```
categories: ["大类"]     # 1-2个主要分类
tags: ["关键词1", "关键词2"]  # 5-10个相关标签
```

---

## 💡 ​**格式支持**​

Hugo 支持三种 Front Matter 格式：

### ​**YAML（最常用）​**​

```
---
title: "示例"
draft: true
---
```

### ​**TOML**​

```
+++
title = "示例"
draft = true
+++
```

### ​**JSON**​

```
{
  "title": "示例",
  "draft": true
}
```

​**推荐使用 YAML 格式**，可读性最好！

---

## 🔍 ​**查看效果**​

### ​**构建时检查**​

```
# 构建正式版本（不含草稿）
hugo

# 构建包含草稿
hugo -D

# 实时预览（含草稿）
hugo server -D
```
