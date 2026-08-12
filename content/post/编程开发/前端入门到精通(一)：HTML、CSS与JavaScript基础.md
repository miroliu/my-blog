---
title: "前端入门到精通(一)：HTML、CSS与JavaScript基础"
date: 2025-10-30 09:25:00+08:00
categories:
  - "编程开发"
tags:
  - "前端"
  - "HTML"
  - "CSS"
  - "JavaScript"
  - "Web开发"
  - "入门教程"
image: ""
mermaid: false
math: false
license: ""
hidden: false
comments: true
---

# 前端入门到精通(一)：HTML、CSS与JavaScript基础

## 引言

在当今数字化时代，前端开发已经成为构建现代网站和Web应用程序的关键技能。前端开发涉及创建用户直接交互的界面部分，包括网站的结构、样式和交互行为。无论你是完全的编程新手，还是有其他编程经验想要转向Web开发，掌握HTML、CSS和JavaScript这三大核心技术都是前端开发的基础。本文将作为前端入门系列的第一篇，带你从零基础开始，系统学习前端开发的基础知识。

## 什么是前端开发？

### 前端开发的定义

前端开发，也称为客户端开发，是指创建网站或Web应用程序的用户界面部分的过程。前端开发者负责将设计师的设计稿转化为用户可以与之交互的网页，确保网站的视觉效果和用户体验。

### 前端开发的重要性

在Web开发中，前端是用户与网站交互的第一界面，直接影响用户体验。一个优秀的前端可以：

- 提供直观、美观的用户界面
- 确保网站的响应速度和性能
- 增强用户与网站的交互体验
- 提高网站的可访问性和兼容性

### 前端开发的职业前景

随着互联网的快速发展和Web应用的普及，前端开发工程师的需求持续增长。前端开发不仅是一个热门的职业选择，也是一个不断发展的领域，新的技术和框架不断涌现，为开发者提供了更多的机会和挑战。

## HTML基础

### HTML的定义与作用

HTML（HyperText Markup Language，超文本标记语言）是用于创建网页结构的标准标记语言。HTML使用一系列标签来描述网页的内容和结构，这些标签告诉浏览器如何显示网页的各个部分。

### HTML文档的基本结构

一个基本的HTML文档结构如下：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的第一个HTML页面</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>这是我的第一个HTML页面。</p>
</body>
</html>
```

让我们来解释一下这个结构中的各个部分：

- `<!DOCTYPE html>`：声明文档类型，告诉浏览器这是一个HTML5文档
- `<html>`：HTML文档的根元素
- `<head>`：包含文档的元数据，如字符集、视口设置、标题等
- `<meta charset="UTF-8">`：设置文档的字符编码为UTF-8，支持中文等多语言
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">`：设置视口，确保在移动设备上正确显示
- `<title>`：设置网页的标题，显示在浏览器标签栏中
- `<body>`：包含网页的可见内容，如文本、图片、链接等

### 常用HTML标签

#### 文本相关标签

- `<h1>` 到 `<h6>`：标题标签，`<h1>` 是最大的标题，`<h6>` 是最小的标题
- `<p>`：段落标签
- `<strong>` 或 `<b>`：加粗文本
- `<em>` 或 `<i>`：斜体文本
- `<br>`：换行标签
- `<hr>`：水平线标签
- `<span>`：行内元素，用于对文本的一部分进行样式设置
- `<div>`：块级元素，用于组织和布局页面内容

示例：

```html
<h1>一级标题</h1>
<h2>二级标题</h2>
<p>这是一个<strong>重要的</strong>段落，其中包含<em>强调的</em>文本。</p>
<p>这是第一段。<br>这是第二段。</p>
<hr>
<div>
    <h3>这是一个区块</h3>
    <p>区块中的内容</p>
</div>
```

#### 链接和列表

- `<a>`：链接标签，用于创建超链接
  - `href` 属性：指定链接的目标地址
  - `target` 属性：指定链接在何处打开（如 `_blank` 在新窗口打开）

- `<ul>`：无序列表
- `<ol>`：有序列表
- `<li>`：列表项

示例：

```html
<a href="https://www.example.com" target="_blank">访问示例网站</a>

<h3>无序列表</h3>
<ul>
    <li>项目一</li>
    <li>项目二</li>
    <li>项目三</li>
</ul>

<h3>有序列表</h3>
<ol>
    <li>第一步</li>
    <li>第二步</li>
    <li>第三步</li>
</ol>
```

#### 图片和多媒体

- `<img>`：图片标签
  - `src` 属性：指定图片的URL
  - `alt` 属性：指定图片的替代文本，提高可访问性
  - `width` 和 `height` 属性：指定图片的宽度和高度

- `<audio>`：音频标签
- `<video>`：视频标签

示例：

```html
<img src="image.jpg" alt="示例图片" width="300" height="200">

<audio controls>
    <source src="audio.mp3" type="audio/mpeg">
    您的浏览器不支持音频元素。
</audio>

<video controls width="400">
    <source src="video.mp4" type="video/mp4">
    您的浏览器不支持视频元素。
</video>
```

#### 表单元素

表单用于收集用户输入的数据，是交互式网站的重要组成部分。

- `<form>`：表单标签
  - `action` 属性：指定表单提交的目标URL
  - `method` 属性：指定表单提交的方法（`get` 或 `post`）

- `<input>`：输入字段
  - `type` 属性：指定输入字段的类型（`text`, `password`, `email`, `number`, `checkbox`, `radio`, `submit` 等）
  - `name` 属性：指定输入字段的名称，用于表单提交
  - `placeholder` 属性：指定输入字段的提示文本
  - `required` 属性：指定输入字段为必填项

- `<label>`：为表单元素提供标签
- `<textarea>`：多行文本输入框
- `<select>` 和 `<option>`：下拉选择框
- `<button>`：按钮

示例：

```html
<form action="submit.php" method="post">
    <div>
        <label for="username">用户名：</label>
        <input type="text" id="username" name="username" placeholder="请输入用户名" required>
    </div>
    <div>
        <label for="password">密码：</label>
        <input type="password" id="password" name="password" placeholder="请输入密码" required>
    </div>
    <div>
        <label for="email">邮箱：</label>
        <input type="email" id="email" name="email" placeholder="请输入邮箱">
    </div>
    <div>
        <label>性别：</label>
        <input type="radio" id="male" name="gender" value="male">
        <label for="male">男</label>
        <input type="radio" id="female" name="gender" value="female">
        <label for="female">女</label>
    </div>
    <div>
        <label>爱好：</label>
        <input type="checkbox" id="hobby1" name="hobby[]" value="reading">
        <label for="hobby1">阅读</label>
        <input type="checkbox" id="hobby2" name="hobby[]" value="music">
        <label for="hobby2">音乐</label>
    </div>
    <div>
        <label for="city">城市：</label>
        <select id="city" name="city">
            <option value="beijing">北京</option>
            <option value="shanghai">上海</option>
            <option value="guangzhou">广州</option>
        </select>
    </div>
    <div>
        <label for="message">留言：</label>
        <textarea id="message" name="message" rows="4" cols="50" placeholder="请输入留言内容"></textarea>
    </div>
    <button type="submit">提交</button>
    <button type="reset">重置</button>
</form>
```

### HTML5新特性

HTML5是HTML的最新版本，引入了许多新的特性和元素，使Web开发更加灵活和强大。

#### 语义化标签

HTML5引入了一系列语义化标签，使HTML文档的结构更加清晰，有利于搜索引擎优化（SEO）和提高可访问性。

- `<header>`：文档或节的页眉
- `<nav>`：导航链接
- `<main>`：文档的主要内容
- `<article>`：独立的内容，如博客文章、新闻报道等
- `<section>`：文档中的节或区域
- `<aside>`：侧边栏或补充内容
- `<footer>`：文档或节的页脚

示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML5语义化结构示例</title>
</head>
<body>
    <header>
        <h1>网站标题</h1>
        <nav>
            <ul>
                <li><a href="#">首页</a></li>
                <li><a href="#">关于我们</a></li>
                <li><a href="#">服务</a></li>
                <li><a href="#">联系我们</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section>
            <h2>最新文章</h2>
            <article>
                <h3>文章标题一</h3>
                <p>文章内容...</p>
            </article>
            <article>
                <h3>文章标题二</h3>
                <p>文章内容...</p>
            </article>
        </section>
        
        <aside>
            <h3>相关链接</h3>
            <ul>
                <li><a href="#">链接一</a></li>
                <li><a href="#">链接二</a></li>
            </ul>
        </aside>
    </main>
    
    <footer>
        <p>&copy; 2025 网站版权所有</p>
    </footer>
</body>
</html>
```

#### 其他HTML5新特性

- **Canvas**：用于在网页上绘制图形
- **SVG**：用于绘制矢量图形
- **本地存储**：`localStorage` 和 `sessionStorage`
- **Web Workers**：用于在后台运行JavaScript
- **WebSockets**：用于实现实时通信
- **地理位置**：获取用户的地理位置

## CSS基础

### CSS的定义与作用

CSS（Cascading Style Sheets，层叠样式表）是用于描述HTML文档外观和样式的语言。通过CSS，我们可以控制网页的颜色、字体、布局等视觉效果，使网页更加美观和专业。

### CSS的引入方式

在HTML文档中引入CSS有三种主要方式：

#### 1. 内联样式（Inline Style）

直接在HTML元素中使用`style`属性来定义样式。这种方式虽然方便，但不利于样式的复用和维护，一般只在特殊情况下使用。

示例：

```html
<p style="color: red; font-size: 18px;">这是一个红色的段落。</p>
```

#### 2. 内部样式表（Internal Style Sheet）

在HTML文档的`<head>`部分使用`<style>`标签来定义样式。这种方式适用于单个HTML文档的样式定义。

示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>内部样式表示例</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
        }
        h1 {
            color: blue;
            text-align: center;
        }
        p {
            color: #333;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <h1>标题</h1>
    <p>这是一个段落。</p>
</body>
</html>
```

#### 3. 外部样式表（External Style Sheet）

将CSS代码保存在一个单独的`.css`文件中，然后在HTML文档中使用`<link>`标签来引入这个CSS文件。这是最常用的方式，有利于样式的复用和维护，特别是在大型项目中。

示例：

首先，创建一个名为`style.css`的CSS文件：

```css
body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
}
h1 {
    color: blue;
    text-align: center;
}
p {
    color: #333;
    font-size: 16px;
}
```

然后，在HTML文档中引入这个CSS文件：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>外部样式表示例</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>标题</h1>
    <p>这是一个段落。</p>
</body>
</html>
```

### CSS选择器

CSS选择器用于选择要应用样式的HTML元素。了解不同的选择器对于编写有效的CSS代码至关重要。

#### 1. 基础选择器

- **元素选择器**：根据元素名称选择元素
  
  ```css
  p { color: red; }
  ```

- **ID选择器**：根据元素的`id`属性选择元素，使用`#`符号
  
  ```css
  #header { background-color: blue; }
  ```
  
  注意：一个HTML文档中每个ID应该是唯一的。

- **类选择器**：根据元素的`class`属性选择元素，使用`.`符号
  
  ```css
  .container { width: 1000px; margin: 0 auto; }
  ```
  
  注意：一个HTML元素可以有多个类，一个类也可以应用于多个HTML元素。

- **通用选择器**：选择所有元素，使用`*`符号
  
  ```css
  * { margin: 0; padding: 0; }
  ```

#### 2. 组合选择器

- **后代选择器**：选择元素内的所有后代元素，使用空格分隔
  
  ```css
  div p { color: green; }
  ```

- **子选择器**：选择元素的直接子元素，使用`>`符号
  
  ```css
  ul > li { list-style-type: none; }
  ```

- **相邻兄弟选择器**：选择紧接在另一个元素后面的元素，使用`+`符号
  
  ```css
  h1 + p { font-weight: bold; }
  ```

- **通用兄弟选择器**：选择在另一个元素后面的所有兄弟元素，使用`~`符号
  
  ```css
  h1 ~ p { color: purple; }
  ```

#### 3. 属性选择器

根据元素的属性选择元素。

```css
/* 选择所有具有title属性的元素 */
[title] { color: orange; }

/* 选择title属性值为"example"的元素 */
[title="example"] { color: pink; }

/* 选择title属性值以"ex"开头的元素 */
[title^="ex"] { color: brown; }

/* 选择title属性值以"ple"结尾的元素 */
[title$="ple"] { color: gray; }

/* 选择title属性值包含"amp"的元素 */
[title*="amp"] { color: cyan; }
```

#### 4. 伪类和伪元素

- **伪类**：用于选择处于特定状态的元素，使用`:`符号
  
  ```css
  /* 链接的不同状态 */
  a:link { color: blue; }
  a:visited { color: purple; }
  a:hover { color: red; }
  a:active { color: green; }
  
  /* 选择第一个子元素 */
  p:first-child { font-weight: bold; }
  
  /* 选择最后一个子元素 */
  p:last-child { color: gray; }
  
  /* 选择第n个子元素 */
  li:nth-child(2) { color: orange; }
  ```

- **伪元素**：用于选择元素的特定部分，使用`::`符号
  
  ```css
  /* 选择元素的首行 */
  p::first-line { font-weight: bold; }
  
  /* 选择元素的首字母 */
  p::first-letter { font-size: 2em; color: red; }
  
  /* 在元素内容前插入内容 */
  p::before { content: "前缀"; }
  
  /* 在元素内容后插入内容 */
  p::after { content: "后缀"; }
  ```

### CSS盒模型

盒模型是CSS中的一个基本概念，它描述了HTML元素在页面中所占空间的方式。每个HTML元素都可以看作是一个盒子，包括内容区域、内边距、边框和外边距。

#### 盒模型的组成部分

1. **内容区域（Content）**：元素的实际内容，如文本、图片等
2. **内边距（Padding）**：内容区域与边框之间的空间
3. **边框（Border）**：内边距与外边距之间的边界
4. **外边距（Margin）**：元素与其他元素之间的空间

#### 盒模型的计算方式

在CSS中，盒模型有两种计算方式：标准盒模型和IE盒模型。

- **标准盒模型**：元素的宽度和高度仅包括内容区域的宽度和高度
  
  ```css
  box-sizing: content-box;
  ```
  
  总宽度 = width + padding-left + padding-right + border-left + border-right
  总高度 = height + padding-top + padding-bottom + border-top + border-bottom

- **IE盒模型**：元素的宽度和高度包括内容区域、内边距和边框
  
  ```css
  box-sizing: border-box;
  ```
  
  内容宽度 = width - padding-left - padding-right - border-left - border-right
  内容高度 = height - padding-top - padding-bottom - border-top - border-bottom

现代Web开发中，`box-sizing: border-box;`使用更为广泛，因为它使得元素的宽度和高度计算更加直观和可控。

### CSS常用属性

#### 文本样式

- `color`：设置文本颜色
- `font-family`：设置字体
- `font-size`：设置字体大小
- `font-weight`：设置字体粗细（normal, bold, 100-900）
- `font-style`：设置字体样式（normal, italic, oblique）
- `text-align`：设置文本对齐方式（left, right, center, justify）
- `text-decoration`：设置文本装饰（none, underline, overline, line-through）
- `text-indent`：设置文本缩进
- `line-height`：设置行高
- `letter-spacing`：设置字符间距
- `word-spacing`：设置单词间距

示例：

```css
p {
    color: #333;
    font-family: Arial, "Microsoft YaHei", sans-serif;
    font-size: 16px;
    font-weight: normal;
    font-style: italic;
    text-align: justify;
    text-decoration: none;
    text-indent: 2em;
    line-height: 1.5;
    letter-spacing: 1px;
    word-spacing: 5px;
}
```

#### 背景样式

- `background-color`：设置背景颜色
- `background-image`：设置背景图片
- `background-repeat`：设置背景图片的重复方式（repeat, repeat-x, repeat-y, no-repeat）
- `background-position`：设置背景图片的位置
- `background-size`：设置背景图片的大小
- `background-attachment`：设置背景图片的固定方式（scroll, fixed, local）
- `background`：背景属性的简写形式

示例：

```css
body {
    background-color: #f0f0f0;
    background-image: url("background.jpg");
    background-repeat: no-repeat;
    background-position: center top;
    background-size: cover;
    background-attachment: fixed;
}

/* 简写形式 */
body {
    background: #f0f0f0 url("background.jpg") no-repeat center top / cover fixed;
}
```

#### 边框样式

- `border-width`：设置边框宽度
- `border-style`：设置边框样式（none, solid, dotted, dashed, double等）
- `border-color`：设置边框颜色
- `border`：边框属性的简写形式
- `border-radius`：设置边框圆角
- `box-shadow`：设置元素阴影

示例：

```css
div {
    border-width: 2px;
    border-style: solid;
    border-color: #ccc;
    border-radius: 5px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}

/* 简写形式 */
div {
    border: 2px solid #ccc;
    border-radius: 5px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
}
```

#### 布局相关属性

- `display`：设置元素的显示类型（block, inline, inline-block, none等）
- `position`：设置元素的定位方式（static, relative, absolute, fixed, sticky）
- `float`：设置元素的浮动方式（left, right, none）
- `clear`：清除浮动（left, right, both, none）
- `width`：设置元素宽度
- `height`：设置元素高度
- `margin`：设置外边距
- `padding`：设置内边距
- `overflow`：设置内容溢出时的处理方式（visible, hidden, scroll, auto）
- `z-index`：设置元素的堆叠顺序

示例：

```css
/* 块级元素示例 */
.container {
    display: block;
    width: 1000px;
    margin: 0 auto;
    padding: 20px;
    overflow: hidden;
}

/* 定位示例 */
.header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 100;
}

.sidebar {
    position: absolute;
    top: 50px;
    left: 0;
    width: 200px;
}

.content {
    margin-left: 220px;
}

/* 浮动示例 */
img {
    float: left;
    margin-right: 10px;
}

.clearfix::after {
    content: "";
    display: table;
    clear: both;
}
```

## JavaScript基础

### JavaScript的定义与作用

JavaScript是一种具有函数优先特性的轻量级、解释型或即时编译型的编程语言。它是Web开发的核心技术之一，与HTML和CSS一起构成了现代Web开发的基础。JavaScript可以使网页具有交互性，实现动态效果，响应用户操作等。

### JavaScript的引入方式

在HTML文档中引入JavaScript有三种主要方式：

#### 1. 内联脚本（Inline Script）

直接在HTML元素的事件属性中写入JavaScript代码。这种方式虽然简单，但不利于代码的复用和维护，一般不推荐使用。

示例：

```html
<button onclick="alert('Hello, World!')">点击我</button>
```

#### 2. 内部脚本（Internal Script）

在HTML文档的`<head>`或`<body>`部分使用`<script>`标签来定义JavaScript代码。

示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>内部脚本示例</title>
    <script>
        function showMessage() {
            alert('Hello, World!');
        }
    </script>
</head>
<body>
    <button onclick="showMessage()">点击我</button>
</body>
</html>
```

#### 3. 外部脚本（External Script）

将JavaScript代码保存在一个单独的`.js`文件中，然后在HTML文档中使用`<script>`标签来引入这个JavaScript文件。这是最常用的方式，有利于代码的复用和维护。

示例：

首先，创建一个名为`script.js`的JavaScript文件：

```javascript
function showMessage() {
    alert('Hello, World!');
}
```

然后，在HTML文档中引入这个JavaScript文件：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>外部脚本示例</title>
</head>
<body>
    <button onclick="showMessage()">点击我</button>
    <script src="script.js"></script>
</body>
</html>
```

注意：通常建议将JavaScript代码放在HTML文档的末尾（`</body>`标签之前），这样可以确保HTML元素在JavaScript代码执行之前已经加载完成。

### JavaScript的基本语法

#### 变量声明

在JavaScript中，使用`var`、`let`或`const`关键字来声明变量。

- `var`：传统的变量声明方式，具有函数作用域或全局作用域
- `let`：ES6引入的变量声明方式，具有块级作用域
- `const`：ES6引入的常量声明方式，具有块级作用域，声明后不能重新赋值

示例：

```javascript
var name = "张三";
let age = 25;
const PI = 3.14159;

// var声明的变量可以被重复声明
var name = "李四";

// let声明的变量不能被重复声明在同一作用域
// let age = 30; // 错误

// const声明的常量不能被重新赋值
// PI = 3.14; // 错误
```

#### 数据类型

JavaScript是一种动态类型语言，变量的类型可以在运行时改变。JavaScript有以下几种数据类型：

- **基本数据类型**：
  - `Number`：数字类型（整数和浮点数）
  - `String`：字符串类型
  - `Boolean`：布尔类型（true和false）
  - `Undefined`：未定义类型
  - `Null`：空值类型
  - `Symbol`：ES6引入的符号类型
  - `BigInt`：ES11引入的大整数类型

- **引用数据类型**：
  - `Object`：对象类型
  - `Array`：数组类型
  - `Function`：函数类型

示例：

```javascript
// 基本数据类型
let num = 42;
let str = "Hello";
let bool = true;
let undef;
let n = null;
let sym = Symbol("id");
let bigInt = BigInt("9007199254740991");

// 引用数据类型
let obj = { name: "张三", age: 25 };
let arr = [1, 2, 3, 4, 5];
let func = function() { console.log("Hello"); };

// 使用typeof运算符检查数据类型
console.log(typeof num); // "number"
console.log(typeof str); // "string"
console.log(typeof bool); // "boolean"
console.log(typeof undef); // "undefined"
console.log(typeof n); // "object" (这是JavaScript的一个历史遗留问题)
console.log(typeof sym); // "symbol"
console.log(typeof bigInt); // "bigint"
console.log(typeof obj); // "object"
console.log(typeof arr); // "object"
console.log(typeof func); // "function"
```

#### 运算符

JavaScript支持多种运算符：

- **算术运算符**：`+`, `-`, `*`, `/`, `%`, `++`, `--`
- **赋值运算符**：`=`, `+=`, `-=`, `*=`, `/=`, `%=`
- **比较运算符**：`==`, `===`, `!=`, `!==`, `>`, `<`, `>=`, `<=`
- **逻辑运算符**：`&&` (与), `||` (或), `!` (非)
- **三元运算符**：`condition ? expr1 : expr2`
- **字符串运算符**：`+` (用于字符串拼接)

示例：

```javascript
// 算术运算符
let a = 10, b = 3;
console.log(a + b); // 13
console.log(a - b); // 7
console.log(a * b); // 30
console.log(a / b); // 3.3333333333333335
console.log(a % b); // 1
console.log(a++); // 10 (先返回a的值，再自增)
console.log(++a); // 12 (先自增，再返回a的值)

// 赋值运算符
let c = 5;
c += 3; // 等同于 c = c + 3
console.log(c); // 8

// 比较运算符
let x = 5, y = "5";
console.log(x == y); // true (只比较值，不比较类型)
console.log(x === y); // false (比较值和类型)
console.log(x != y); // false
console.log(x !== y); // true
console.log(x > 3); // true

// 逻辑运算符
let d = true, e = false;
console.log(d && e); // false
console.log(d || e); // true
console.log(!d); // false

// 三元运算符
let age = 18;
let status = age >= 18 ? "成年" : "未成年";
console.log(status); // "成年"

// 字符串运算符
let str1 = "Hello", str2 = "World";
console.log(str1 + " " + str2); // "Hello World"
```

#### 流程控制语句

##### 条件语句

- **if语句**：
  
  ```javascript
  let age = 20;
  if (age >= 18) {
      console.log("成年人");
  } else {
      console.log("未成年人");
  }
  ```

- **if-else if-else语句**：
  
  ```javascript
  let score = 85;
  if (score >= 90) {
      console.log("优秀");
  } else if (score >= 80) {
      console.log("良好");
  } else if (score >= 60) {
      console.log("及格");
  } else {
      console.log("不及格");
  }
  ```

- **switch语句**：
  
  ```javascript
  let day = 3;
  let dayName;
  
  switch (day) {
      case 1:
          dayName = "星期一";
          break;
      case 2:
          dayName = "星期二";
          break;
      case 3:
          dayName = "星期三";
          break;
      case 4:
          dayName = "星期四";
          break;
      case 5:
          dayName = "星期五";
          break;
      case 6:
          dayName = "星期六";
          break;
      case 7:
          dayName = "星期日";
          break;
      default:
          dayName = "无效的日期";
  }
  
  console.log(dayName); // "星期三"
  ```

##### 循环语句

- **for循环**：
  
  ```javascript
  for (let i = 0; i < 5; i++) {
      console.log(i); // 输出0, 1, 2, 3, 4
  }
  ```

- **while循环**：
  
  ```javascript
  let i = 0;
  while (i < 5) {
      console.log(i); // 输出0, 1, 2, 3, 4
      i++;
  }
  ```

- **do-while循环**：
  
  ```javascript
  let i = 0;
  do {
      console.log(i); // 输出0, 1, 2, 3, 4
      i++;
  } while (i < 5);
  ```

- **for...in循环**：用于遍历对象的属性
  
  ```javascript
  let person = { name: "张三", age: 25, city: "北京" };
  for (let key in person) {
      console.log(key + ": " + person[key]);
  }
  // 输出：
  // name: 张三
  // age: 25
  // city: 北京
  ```

- **for...of循环**：ES6引入，用于遍历可迭代对象（如数组、字符串等）
  
  ```javascript
  let fruits = ["苹果", "香蕉", "橙子"];
  for (let fruit of fruits) {
      console.log(fruit); // 输出"苹果", "香蕉", "橙子"
  }
  ```

### 函数

函数是JavaScript中的基本构建块之一，用于封装可重用的代码块。

#### 函数的定义与调用

在JavaScript中，有多种定义函数的方式：

##### 1. 函数声明

```javascript
function greet(name) {
    return "Hello, " + name + "!";
}

console.log(greet("张三")); // "Hello, 张三!"
```

##### 2. 函数表达式

```javascript
let greet = function(name) {
    return "Hello, " + name + "!";
};

console.log(greet("李四")); // "Hello, 李四!"
```

##### 3. 箭头函数（ES6）

```javascript
let greet = (name) => {
    return "Hello, " + name + "!";
};

// 如果函数体只有一条返回语句，可以省略花括号和return关键字
let greetShort = name => "Hello, " + name + "!";

console.log(greet("王五")); // "Hello, 王五!"
console.log(greetShort("赵六")); // "Hello, 赵六!"
```

#### 函数参数

JavaScript函数可以接受任意数量的参数，即使函数定义中指定了参数数量。

- **默认参数（ES6）**：
  
  ```javascript
  function greet(name = "World") {
      return "Hello, " + name + "!";
  }
  
  console.log(greet()); // "Hello, World!"
  console.log(greet("张三")); // "Hello, 张三!"
  ```

- **剩余参数（ES6）**：
  
  ```javascript
  function sum(...numbers) {
      let total = 0;
      for (let num of numbers) {
          total += num;
      }
      return total;
  }
  
  console.log(sum(1, 2, 3)); // 6
  console.log(sum(1, 2, 3, 4, 5)); // 15
  ```

#### 函数作用域

在JavaScript中，函数内部声明的变量具有函数作用域，只能在函数内部访问。而在函数外部声明的变量具有全局作用域，可以在任何地方访问。

ES6引入了块级作用域，使用`let`和`const`声明的变量具有块级作用域，只能在声明它们的块（如`{}`内部）中访问。

```javascript
// 全局变量
let globalVar = "全局变量";

function myFunction() {
    // 局部变量
    let localVar = "局部变量";
    
    console.log(globalVar); // 可以访问全局变量
    console.log(localVar); // 可以访问局部变量
    
    if (true) {
        // 块级作用域变量
        let blockVar = "块级变量";
        console.log(blockVar); // 可以访问块级变量
    }
    
    // console.log(blockVar); // 错误，不能访问块级变量
}

myFunction();
// console.log(localVar); // 错误，不能访问局部变量
```

### DOM操作基础

DOM（Document Object Model，文档对象模型）是HTML和XML文档的编程接口。通过DOM，JavaScript可以访问和操作HTML文档的所有元素。

#### 选择元素

在JavaScript中，有多种方法可以选择HTML元素：

- `document.getElementById(id)`：根据ID选择元素
- `document.getElementsByClassName(class)`：根据类名选择元素，返回元素集合
- `document.getElementsByTagName(tag)`：根据标签名选择元素，返回元素集合
- `document.querySelector(selector)`：根据CSS选择器选择第一个匹配的元素
- `document.querySelectorAll(selector)`：根据CSS选择器选择所有匹配的元素，返回NodeList

示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOM选择示例</title>
</head>
<body>
    <div id="container">
        <h1 class="title">标题</h1>
        <p class="content">段落一</p>
        <p class="content">段落二</p>
    </div>
    
    <script>
        // 根据ID选择元素
        let container = document.getElementById("container");
        console.log(container);
        
        // 根据类名选择元素
        let contents = document.getElementsByClassName("content");
        console.log(contents);
        console.log(contents[0]);
        
        // 根据标签名选择元素
        let paragraphs = document.getElementsByTagName("p");
        console.log(paragraphs);
        
        // 根据CSS选择器选择第一个匹配的元素
        let title = document.querySelector(".title");
        console.log(title);
        
        // 根据CSS选择器选择所有匹配的元素
        let allContents = document.querySelectorAll(".content");
        console.log(allContents);
        
        // 遍历NodeList
        allContents.forEach(function(element) {
            console.log(element.textContent);
        });
    </script>
</body>
</html>
```

#### 修改元素

一旦选择了元素，就可以修改其内容、属性和样式。

##### 修改内容

- `element.textContent`：获取或设置元素的文本内容
- `element.innerHTML`：获取或设置元素的HTML内容

```javascript
let title = document.querySelector(".title");
title.textContent = "新标题";

let container = document.querySelector("#container");
container.innerHTML += "<p>新添加的段落</p>";
```

##### 修改属性

- `element.getAttribute(attribute)`：获取元素的属性值
- `element.setAttribute(attribute, value)`：设置元素的属性值
- `element.removeAttribute(attribute)`：移除元素的属性

```javascript
let link = document.querySelector("a");
console.log(link.getAttribute("href")); // 获取href属性值
link.setAttribute("href", "https://www.example.com"); // 设置href属性值
link.setAttribute("target", "_blank"); // 添加target属性
```

##### 修改样式

- `element.style.property`：获取或设置元素的内联样式
- `element.classList.add(class)`：添加CSS类
- `element.classList.remove(class)`：移除CSS类
- `element.classList.toggle(class)`：切换CSS类（如果存在则移除，如果不存在则添加）

```javascript
let element = document.querySelector(".content");

// 设置内联样式
element.style.color = "red";
element.style.fontSize = "18px";

// 使用classList
element.classList.add("highlight"); // 添加highlight类
element.classList.remove("content"); // 移除content类
element.classList.toggle("active"); // 切换active类
```

#### 事件处理

事件是用户与网页交互时发生的动作，如点击、鼠标移动、键盘输入等。JavaScript可以通过事件监听器来响应这些事件。

##### 添加事件监听器

使用`element.addEventListener(event, function)`方法来添加事件监听器。

```javascript
let button = document.querySelector("button");

button.addEventListener("click", function() {
    console.log("按钮被点击了！");
});

// 使用箭头函数
button.addEventListener("click", () => {
    console.log("使用箭头函数处理点击事件");
});
```

##### 常见事件类型

- **鼠标事件**：`click`, `dblclick`, `mouseover`, `mouseout`, `mousemove`, `mousedown`, `mouseup`
- **键盘事件**：`keydown`, `keyup`, `keypress`
- **表单事件**：`submit`, `change`, `input`, `focus`, `blur`
- **窗口事件**：`load`, `resize`, `scroll`, `unload`

示例：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>事件处理示例</title>
    <style>
        .box {
            width: 100px;
            height: 100px;
            background-color: red;
            margin: 20px;
        }
        .highlight {
            background-color: blue;
        }
    </style>
</head>
<body>
    <button id="myButton">点击我</button>
    <div class="box" id="myBox"></div>
    <input type="text" id="myInput" placeholder="输入一些内容">
    
    <script>
        // 点击事件
        let button = document.getElementById("myButton");
        button.addEventListener("click", function() {
            alert("按钮被点击了！");
        });
        
        // 鼠标事件
        let box = document.getElementById("myBox");
        box.addEventListener("mouseover", function() {
            this.classList.add("highlight");
        });
        box.addEventListener("mouseout", function() {
            this.classList.remove("highlight");
        });
        
        // 键盘事件
        let input = document.getElementById("myInput");
        input.addEventListener("input", function() {
            console.log("输入的内容：" + this.value);
        });
        
        // 窗口事件
        window.addEventListener("resize", function() {
            console.log("窗口大小改变了");
        });
    </script>
</body>
</html>
```

## 前端开发工具

### 开发环境设置

#### 文本编辑器/IDE

选择一个好的文本编辑器或IDE对于前端开发至关重要。以下是一些常用的编辑器：

- **Visual Studio Code**：微软开发的轻量级代码编辑器，具有丰富的插件生态系统，是目前最流行的前端开发工具之一。
- **Sublime Text**：轻量级、高性能的文本编辑器，具有强大的自定义能力。
- **Atom**：GitHub开发的开源文本编辑器，可高度自定义。
- **WebStorm**：JetBrains开发的专业JavaScript IDE，功能强大但较重。

#### 浏览器开发工具

现代浏览器都内置了开发工具，用于调试和测试网页。以下是一些常用的浏览器开发工具功能：

- **元素（Elements）**：查看和修改HTML和CSS
- **控制台（Console）**：执行JavaScript代码和查看错误信息
- **源代码（Sources）**：查看和调试JavaScript代码
- **网络（Network）**：监控网络请求和响应
- **应用（Application）**：管理浏览器存储（Cookie、LocalStorage等）

在Chrome、Firefox等浏览器中，可以通过按`F12`或右键点击网页并选择"检查"来打开开发工具。

### 版本控制

版本控制是管理代码变更的重要工具，对于团队协作和代码管理至关重要。Git是目前最流行的版本控制系统。

#### Git基础

- **安装Git**：从[Git官网](https://git-scm.com/)下载并安装Git。
- **初始化仓库**：使用`git init`命令在当前目录初始化一个Git仓库。
- **添加文件**：使用`git add .`命令添加所有文件到暂存区。
- **提交更改**：使用`git commit -m "提交信息"`命令提交更改。
- **查看状态**：使用`git status`命令查看仓库状态。
- **查看历史**：使用`git log`命令查看提交历史。

#### 远程仓库

GitHub、GitLab、Gitee等平台提供了远程Git仓库服务，方便代码的备份和团队协作。

- **添加远程仓库**：`git remote add origin 远程仓库URL`
- **推送到远程仓库**：`git push -u origin master`
- **从远程仓库拉取**：`git pull origin master`

## 实践项目：创建一个简单的个人网页

现在，让我们将所学的HTML、CSS和JavaScript知识结合起来，创建一个简单的个人网页。

### 项目结构

```
personal-website/
├── index.html
├── styles.css
└── script.js
```

### HTML代码（index.html）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>我的个人网页</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <h1>欢迎访问我的个人网页</h1>
        <nav>
            <ul>
                <li><a href="#about">关于我</a></li>
                <li><a href="#skills">我的技能</a></li>
                <li><a href="#contact">联系我</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="about">
            <h2>关于我</h2>
            <div class="about-content">
                <img src="https://via.placeholder.com/200" alt="我的照片">
                <p>大家好！我是张三，一名前端开发爱好者。我热爱学习新技术，喜欢将创意转化为实际的网页作品。</p>
                <p>这是我创建的第一个个人网页，虽然简单，但包含了我对前端开发的热情和努力。</p>
            </div>
        </section>
        
        <section id="skills">
            <h2>我的技能</h2>
            <div class="skills-container">
                <div class="skill-item">
                    <h3>HTML</h3>
                    <div class="skill-bar">
                        <div class="skill-progress html">80%</div>
                    </div>
                </div>
                <div class="skill-item">
                    <h3>CSS</h3>
                    <div class="skill-bar">
                        <div class="skill-progress css">70%</div>
                    </div>
                </div>
                <div class="skill-item">
                    <h3>JavaScript</h3>
                    <div class="skill-bar">
                        <div class="skill-progress javascript">60%</div>
                    </div>
                </div>
            </div>
        </section>
        
        <section id="contact">
            <h2>联系我</h2>
            <form id="contact-form">
                <div>
                    <label for="name">姓名：</label>
                    <input type="text" id="name" name="name" placeholder="请输入您的姓名" required>
                </div>
                <div>
                    <label for="email">邮箱：</label>
                    <input type="email" id="email" name="email" placeholder="请输入您的邮箱" required>
                </div>
                <div>
                    <label for="message">留言：</label>
                    <textarea id="message" name="message" rows="4" placeholder="请输入您的留言" required></textarea>
                </div>
                <button type="submit">发送</button>
            </form>
        </section>
    </main>
    
    <footer>
        <p>&copy; 2025 张三的个人网页. 保留所有权利。</p>
    </footer>
    
    <script src="script.js"></script>
</body>
</html>
```

### CSS代码（styles.css）

```css
/* 全局样式重置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', 'Microsoft YaHei', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
}

/* 页眉样式 */
header {
    background-color: #35424a;
    color: white;
    padding: 20px 0;
    text-align: center;
}

header h1 {
    margin-bottom: 15px;
}

nav ul {
    list-style-type: none;
}

nav ul li {
    display: inline;
    margin: 0 15px;
}

nav a {
    color: white;
    text-decoration: none;
    font-weight: bold;
    transition: color 0.3s;
}

nav a:hover {
    color: #e8491d;
}

/* 主内容样式 */
main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

section {
    background-color: white;
    padding: 30px;
    margin-bottom: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

section h2 {
    color: #35424a;
    margin-bottom: 20px;
    border-bottom: 2px solid #e8491d;
    padding-bottom: 10px;
}

/* 关于我部分 */
.about-content {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
}

.about-content img {
    border-radius: 50%;
    margin-right: 30px;
    margin-bottom: 20px;
}

.about-content p {
    margin-bottom: 15px;
    font-size: 18px;
}

/* 技能部分 */
.skills-container {
    margin-top: 20px;
}

.skill-item {
    margin-bottom: 20px;
}

.skill-item h3 {
    margin-bottom: 10px;
    color: #555;
}

.skill-bar {
    width: 100%;
    height: 25px;
    background-color: #ddd;
    border-radius: 5px;
    overflow: hidden;
}

.skill-progress {
    height: 100%;
    text-align: center;
    line-height: 25px;
    color: white;
    border-radius: 5px;
    transition: width 1s ease-in-out;
}

.skill-progress.html {
    background-color: #e8491d;
    width: 80%;
}

.skill-progress.css {
    background-color: #2980b9;
    width: 70%;
}

.skill-progress.javascript {
    background-color: #f39c12;
    width: 60%;
}

/* 联系部分 */
#contact-form {
    margin-top: 20px;
}

#contact-form div {
    margin-bottom: 20px;
}

#contact-form label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

#contact-form input,
#contact-form textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 16px;
}

#contact-form button {
    background-color: #35424a;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s;
}

#contact-form button:hover {
    background-color: #e8491d;
}

/* 页脚样式 */
footer {
    background-color: #35424a;
    color: white;
    text-align: center;
    padding: 20px 0;
    margin-top: 40px;
}

/* 响应式设计 */
@media (max-width: 768px) {
    nav ul li {
        display: block;
        margin: 10px 0;
    }
    
    .about-content {
        flex-direction: column;
        text-align: center;
    }
    
    .about-content img {
        margin-right: 0;
    }
}
```

### JavaScript代码（script.js）

```javascript
// 页面加载完成后执行
window.addEventListener('load', function() {
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        });
    });
    
    // 表单提交处理
    const contactForm = document.getElementById('contact-form');
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        
        // 简单验证
        if (!name || !email || !message) {
            alert('请填写所有必填字段！');
            return;
        }
        
        // 模拟表单提交
        console.log('表单提交成功！');
        console.log('姓名:', name);
        console.log('邮箱:', email);
        console.log('留言:', message);
        
        // 显示成功消息
        alert('感谢您的留言，我会尽快回复您！');
        
        // 重置表单
        contactForm.reset();
    });
    
    // 技能条动画
    const skillBars = document.querySelectorAll('.skill-progress');
    
    function showSkills() {
        const skillsSection = document.getElementById('skills');
        const skillsSectionTop = skillsSection.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (skillsSectionTop < windowHeight - 100) {
            skillBars.forEach(bar => {
                bar.style.width = bar.style.width;
            });
        }
    }
    
    // 初始检查
    showSkills();
    
    // 滚动时检查
    window.addEventListener('scroll', showSkills);
});
```

### 如何运行这个项目

1. 在计算机上创建一个新的文件夹，命名为`personal-website`。
2. 在该文件夹中创建三个文件：`index.html`、`styles.css`和`script.js`。
3. 将上面的代码复制到相应的文件中。
4. 双击`index.html`文件，它将在默认浏览器中打开。
5. 尝试与网页交互，看看会发生什么！

## 总结

本文作为前端入门系列的第一篇，介绍了前端开发的基础知识，包括HTML、CSS和JavaScript的核心概念和基本用法。我们学习了：

- 前端开发的定义、重要性和职业前景
- HTML的基本结构、常用标签和HTML5新特性
- CSS的引入方式、选择器、盒模型和常用属性
- JavaScript的基本语法、数据类型、函数和DOM操作
- 前端开发工具和环境设置
- 如何创建一个简单的个人网页

这些知识是前端开发的基础，掌握好它们对于进一步学习前端开发至关重要。在接下来的系列文章中，我们将深入学习更多前端开发的知识和技术，帮助你从入门到精通前端开发。

记住，学习前端开发需要不断地实践和探索。尝试创建更多的网页，实验不同的HTML标签、CSS样式和JavaScript功能，这样你才能真正掌握前端开发的技能。祝你在前端开发的学习道路上取得成功！

## 延伸阅读

- [MDN Web Docs](https://developer.mozilla.org/zh-CN/) - Mozilla开发者网络，提供全面的Web技术文档
- [W3Schools](https://www.w3schools.com/) - 提供Web开发教程、参考手册和实例
- [HTML5 教程](https://www.runoob.com/html/html5-intro.html) - 菜鸟教程HTML5部分
- [CSS 教程](https://www.runoob.com/css/css-tutorial.html) - 菜鸟教程CSS部分
- [JavaScript 教程](https://www.runoob.com/js/js-tutorial.html) - 菜鸟教程JavaScript部分