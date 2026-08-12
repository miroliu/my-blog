---
title: 前端零基础教程(三)：JavaScript基础入门
description: 从零开始学习JavaScript，掌握变量、函数、DOM操作、事件处理等核心知识
date: 2025-12-09 13:20:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["编程开发"]
---

# 前端零基础教程(三)：JavaScript 基础入门

JavaScript 是前端开发的核心，用于实现网页的交互功能。本文将从零开始，系统学习 JavaScript 的基础知识，帮助你掌握网页交互的开发。

## 第一章：JavaScript 基础认知（第 1 周）

### 1.1 什么是 JavaScript

#### JavaScript 的定义

- **脚本语言**：解释执行的编程语言
- **客户端语言**：主要在浏览器中运行
- **动态语言**：变量类型可以动态改变
- **事件驱动**：基于事件响应用户操作

#### JavaScript 的作用

- **DOM 操作**：动态修改网页内容
- **事件处理**：响应用户交互
- **数据验证**：表单验证和数据校验
- **异步操作**：处理 AJAX 请求

### 1.2 JavaScript 的引入方式

#### 内部脚本

```html
<script>
  console.log("Hello, JavaScript!");
</script>
```

#### 外部脚本（推荐）

```html
<script src="script.js"></script>
```

```javascript
// script.js
console.log("Hello, JavaScript!");
```

#### 内联事件（不推荐）

```html
<button onclick="alert('Hello')">点击</button>
```

### 1.3 开发工具

#### 浏览器控制台

- **F12**：打开开发者工具
- **Console 标签**：运行 JavaScript 代码
- **调试工具**：设置断点、查看变量

#### 代码编辑器

- **VS Code**：推荐使用
- **浏览器扩展**：Live Server 等插件

## 第二章：JavaScript 基础语法（第 1-2 周）

### 2.1 变量和数据类型

#### 变量声明

```javascript
// var（不推荐）
var name = "Tom";

// let（推荐用于变量）
let age = 20;
age = 21; // 可以重新赋值

// const（推荐用于常量）
const PI = 3.14159;
// PI = 3.14; // 错误，不能重新赋值
```

#### 数据类型

```javascript
// 基本数据类型
let str = "字符串"; // 字符串
let num = 123; // 数字
let bool = true; // 布尔值
let nul = null; // 空值
let undef = undefined; // 未定义
let sym = Symbol("symbol"); // 符号

// 引用数据类型
let obj = { name: "Tom", age: 20 }; // 对象
let arr = [1, 2, 3]; // 数组
let func = function () {}; // 函数
```

#### 类型转换

```javascript
// 转换为字符串
String(123); // "123"
(123).toString(); // "123"
123 + ""; // "123"

// 转换为数字
Number("123"); // 123
parseInt("123"); // 123
parseFloat("123.45"); // 123.45
+"123"; // 123

// 转换为布尔值
Boolean(1); // true
Boolean(0); // false
!!1; // true
```

### 2.2 运算符

#### 算术运算符

```javascript
let a = 10,
  b = 3;
a + b; // 13 加法
a - b; // 7 减法
a * b; // 30 乘法
a / b; // 3.333... 除法
a % b; // 1 取余
a ** b; // 1000 幂运算
```

#### 比较运算符

```javascript
let a = 5,
  b = 3;
a > b; // true 大于
a < b; // false 小于
a >= b; // true 大于等于
a <= b; // false 小于等于
a == b; // false 相等（会类型转换）
a === b; // false 严格相等（不类型转换）
a != b; // true 不等
a !== b; // true 严格不等
```

#### 逻辑运算符

```javascript
true && false; // false 逻辑与
true || false; // true 逻辑或
!true; // false 逻辑非

// 短路求值
let name = "";
let displayName = name || "Guest"; // "Guest"
```

#### 赋值运算符

```javascript
let a = 10;
a += 5; // a = 15
a -= 3; // a = 12
a *= 2; // a = 24
a /= 4; // a = 6
```

### 2.3 条件语句

#### if/else

```javascript
let age = 20;

if (age >= 18) {
  console.log("成年人");
} else {
  console.log("未成年人");
}

// 多重条件
if (age < 13) {
  console.log("儿童");
} else if (age < 18) {
  console.log("青少年");
} else {
  console.log("成年人");
}
```

#### switch

```javascript
let day = 1;

switch (day) {
  case 1:
    console.log("星期一");
    break;
  case 2:
    console.log("星期二");
    break;
  default:
    console.log("其他");
}
```

#### 三元运算符

```javascript
let age = 20;
let status = age >= 18 ? "成年人" : "未成年人";
console.log(status); // "成年人"
```

### 2.4 循环语句

#### for 循环

```javascript
// 基本 for 循环
for (let i = 0; i < 5; i++) {
  console.log(i); // 0, 1, 2, 3, 4
}

// 遍历数组
let arr = [1, 2, 3, 4, 5];
for (let i = 0; i < arr.length; i++) {
  console.log(arr[i]);
}
```

#### while 循环

```javascript
let i = 0;
while (i < 5) {
  console.log(i);
  i++;
}

// do...while
let j = 0;
do {
  console.log(j);
  j++;
} while (j < 5);
```

#### for...of 循环

```javascript
// 遍历数组
let arr = [1, 2, 3];
for (let item of arr) {
  console.log(item); // 1, 2, 3
}

// 遍历字符串
let str = "hello";
for (let char of str) {
  console.log(char); // h, e, l, l, o
}
```

#### for...in 循环

```javascript
// 遍历对象
let obj = { name: "Tom", age: 20 };
for (let key in obj) {
  console.log(key, obj[key]); // name Tom, age 20
}
```

#### 数组方法

```javascript
let arr = [1, 2, 3, 4, 5];

// forEach
arr.forEach(function (item, index) {
  console.log(item, index);
});

// map
let doubled = arr.map(function (item) {
  return item * 2;
});

// filter
let evens = arr.filter(function (item) {
  return item % 2 === 0;
});
```

## 第三章：函数（第 2-3 周）

### 3.1 函数声明

#### 函数声明

```javascript
// 函数声明
function greet(name) {
  return "Hello, " + name;
}

// 函数表达式
const greet = function (name) {
  return "Hello, " + name;
};

// 箭头函数
const greet = (name) => {
  return "Hello, " + name;
};

// 箭头函数简化
const greet = (name) => "Hello, " + name;
```

#### 函数调用

```javascript
greet("Tom"); // "Hello, Tom"

// 立即执行函数
(function () {
  console.log("立即执行");
})();
```

### 3.2 函数参数

#### 参数和返回值

```javascript
// 基本参数
function add(a, b) {
  return a + b;
}

// 默认参数
function greet(name = "Guest") {
  return "Hello, " + name;
}

// 剩余参数
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}

sum(1, 2, 3, 4); // 10
```

### 3.3 作用域

#### 全局作用域和局部作用域

```javascript
// 全局变量
let globalVar = "全局变量";

function test() {
  // 局部变量
  let localVar = "局部变量";
  console.log(globalVar); // 可以访问全局变量
  console.log(localVar); // 可以访问局部变量
}

console.log(globalVar); // 可以访问
// console.log(localVar); // 错误，不能访问局部变量
```

#### 闭包

```javascript
function outer() {
  let count = 0;

  function inner() {
    count++;
    return count;
  }

  return inner;
}

const counter = outer();
console.log(counter()); // 1
console.log(counter()); // 2
```

## 第四章：对象和数组（第 3 周）

### 4.1 对象

#### 对象创建

```javascript
// 对象字面量
let person = {
  name: "Tom",
  age: 20,
  greet: function () {
    return "Hello, " + this.name;
  },
};

// 访问属性
person.name; // "Tom"
person["age"]; // 20
person.greet(); // "Hello, Tom"

// 添加属性
person.email = "tom@example.com";

// 删除属性
delete person.age;
```

#### 对象方法

```javascript
let obj = { a: 1, b: 2, c: 3 };

// Object.keys
Object.keys(obj); // ["a", "b", "c"]

// Object.values
Object.values(obj); // [1, 2, 3]

// Object.entries
Object.entries(obj); // [["a", 1], ["b", 2], ["c", 3]]
```

### 4.2 数组

#### 数组操作

```javascript
let arr = [1, 2, 3];

// 访问元素
arr[0]; // 1

// 修改元素
arr[0] = 10;

// 添加元素
arr.push(4); // 末尾添加
arr.unshift(0); // 开头添加

// 删除元素
arr.pop(); // 删除末尾
arr.shift(); // 删除开头

// 数组长度
arr.length; // 3
```

#### 数组方法

```javascript
let arr = [1, 2, 3, 4, 5];

// map - 映射
let doubled = arr.map((x) => x * 2); // [2, 4, 6, 8, 10]

// filter - 过滤
let evens = arr.filter((x) => x % 2 === 0); // [2, 4]

// reduce - 归约
let sum = arr.reduce((a, b) => a + b, 0); // 15

// find - 查找
let found = arr.find((x) => x > 3); // 4

// some - 是否有满足条件的
arr.some((x) => x > 4); // true

// every - 是否都满足条件
arr.every((x) => x > 0); // true

// forEach - 遍历
arr.forEach((x) => console.log(x));
```

## 第五章：DOM 操作（第 4 周）

### 5.1 获取元素

```javascript
// 通过 ID
let element = document.getElementById("myId");

// 通过类名
let elements = document.getElementsByClassName("myClass");

// 通过标签名
let elements = document.getElementsByTagName("div");

// 通过选择器（推荐）
let element = document.querySelector("#myId");
let elements = document.querySelectorAll(".myClass");
```

### 5.2 修改内容

```javascript
let element = document.querySelector("#myId");

// 修改文本内容
element.textContent = "新文本";
element.innerText = "新文本";
element.innerHTML = "<strong>新文本</strong>";

// 修改属性
element.setAttribute("class", "new-class");
element.className = "new-class";
element.id = "new-id";

// 修改样式
element.style.color = "red";
element.style.fontSize = "20px";
element.style.display = "none";
```

### 5.3 创建和删除元素

```javascript
// 创建元素
let newDiv = document.createElement("div");
newDiv.textContent = "新元素";
newDiv.className = "new-class";

// 添加到页面
let parent = document.querySelector("#container");
parent.appendChild(newDiv);

// 插入元素
parent.insertBefore(newDiv, parent.firstChild);

// 删除元素
parent.removeChild(newDiv);
// 或
newDiv.remove();
```

### 5.4 操作类名

```javascript
let element = document.querySelector("#myId");

// 添加类
element.classList.add("new-class");

// 删除类
element.classList.remove("old-class");

// 切换类
element.classList.toggle("active");

// 检查类
element.classList.contains("active"); // true/false

// 替换类
element.classList.replace("old", "new");
```

## 第六章：事件处理（第 4-5 周）

### 6.1 事件监听

#### 添加事件监听

```javascript
// 方法一：addEventListener（推荐）
let button = document.querySelector("#myButton");
button.addEventListener("click", function () {
  console.log("按钮被点击");
});

// 方法二：onclick（不推荐）
button.onclick = function () {
  console.log("按钮被点击");
};
```

#### 常用事件

```javascript
// 鼠标事件
element.addEventListener("click", handler); // 点击
element.addEventListener("dblclick", handler); // 双击
element.addEventListener("mouseenter", handler); // 鼠标进入
element.addEventListener("mouseleave", handler); // 鼠标离开
element.addEventListener("mousemove", handler); // 鼠标移动

// 键盘事件
element.addEventListener("keydown", handler); // 按下
element.addEventListener("keyup", handler); // 释放
element.addEventListener("keypress", handler); // 按下字符键

// 表单事件
element.addEventListener("submit", handler); // 提交
element.addEventListener("change", handler); // 改变
element.addEventListener("focus", handler); // 聚焦
element.addEventListener("blur", handler); // 失焦

// 窗口事件
window.addEventListener("load", handler); // 加载完成
window.addEventListener("resize", handler); // 窗口大小改变
window.addEventListener("scroll", handler); // 滚动
```

### 6.2 事件对象

```javascript
element.addEventListener("click", function (event) {
  // 事件类型
  console.log(event.type); // "click"

  // 目标元素
  console.log(event.target); // 触发事件的元素

  // 鼠标位置
  console.log(event.clientX, event.clientY); // 鼠标坐标

  // 阻止默认行为
  event.preventDefault();

  // 阻止事件冒泡
  event.stopPropagation();
});
```

### 6.3 事件委托

```javascript
// 事件委托：在父元素上监听，处理子元素事件
let list = document.querySelector("#list");

list.addEventListener("click", function (event) {
  if (event.target.tagName === "LI") {
    console.log("点击了列表项:", event.target.textContent);
  }
});
```

## 第七章：表单处理（第 5 周）

### 7.1 表单验证

```javascript
let form = document.querySelector("#myForm");

form.addEventListener("submit", function (event) {
  event.preventDefault(); // 阻止默认提交

  let username = document.querySelector("#username").value;
  let email = document.querySelector("#email").value;

  // 验证用户名
  if (username.length < 3) {
    alert("用户名至少3个字符");
    return;
  }

  // 验证邮箱
  let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("邮箱格式不正确");
    return;
  }

  // 提交表单
  console.log("表单验证通过");
  // form.submit();
});
```

### 7.2 实时验证

```javascript
let input = document.querySelector("#username");

input.addEventListener("input", function () {
  let value = this.value;

  if (value.length < 3) {
    this.style.borderColor = "red";
    showError("用户名至少3个字符");
  } else {
    this.style.borderColor = "green";
    hideError();
  }
});
```

## 第八章：异步编程（第 5-6 周）

### 8.1 定时器

```javascript
// setTimeout - 延迟执行
setTimeout(function () {
  console.log("3秒后执行");
}, 3000);

// setInterval - 定时执行
let timer = setInterval(function () {
  console.log("每秒执行");
}, 1000);

// 清除定时器
clearInterval(timer);
```

### 8.2 Promise

```javascript
// 创建 Promise
let promise = new Promise(function (resolve, reject) {
  setTimeout(function () {
    let success = true;
    if (success) {
      resolve("操作成功");
    } else {
      reject("操作失败");
    }
  }, 1000);
});

// 使用 Promise
promise
  .then(function (result) {
    console.log(result); // "操作成功"
  })
  .catch(function (error) {
    console.error(error); // "操作失败"
  });
```

### 8.3 async/await

```javascript
// async 函数
async function fetchData() {
  try {
    let response = await fetch("/api/data");
    let data = await response.json();
    return data;
  } catch (error) {
    console.error("错误:", error);
  }
}

// 调用
fetchData().then((data) => console.log(data));
```

### 8.4 Fetch API

```javascript
// GET 请求
fetch("/api/users")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error(error));

// POST 请求
fetch("/api/users", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ name: "Tom", age: 20 }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

## 第九章：实战项目（第 6 周）

### 9.1 项目一：待办事项应用

#### 项目功能

- 添加待办事项
- 标记完成
- 删除事项
- 本地存储

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>待办事项</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      .container {
        max-width: 600px;
        margin: 50px auto;
        padding: 20px;
      }

      .input-group {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }

      .input-group input {
        flex: 1;
        padding: 10px;
        font-size: 16px;
      }

      .input-group button {
        padding: 10px 20px;
        background-color: #4caf50;
        color: white;
        border: none;
        cursor: pointer;
      }

      .todo-list {
        list-style: none;
      }

      .todo-item {
        display: flex;
        align-items: center;
        padding: 10px;
        margin-bottom: 10px;
        background-color: #f5f5f5;
        border-radius: 5px;
      }

      .todo-item.completed {
        text-decoration: line-through;
        opacity: 0.6;
      }

      .todo-item input[type="checkbox"] {
        margin-right: 10px;
      }

      .todo-item span {
        flex: 1;
      }

      .todo-item button {
        background-color: #f44336;
        color: white;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>待办事项</h1>
      <div class="input-group">
        <input type="text" id="todoInput" placeholder="输入待办事项" />
        <button id="addBtn">添加</button>
      </div>
      <ul class="todo-list" id="todoList"></ul>
    </div>

    <script>
      const todoInput = document.getElementById("todoInput");
      const addBtn = document.getElementById("addBtn");
      const todoList = document.getElementById("todoList");

      // 从本地存储加载
      let todos = JSON.parse(localStorage.getItem("todos")) || [];

      // 渲染列表
      function renderTodos() {
        todoList.innerHTML = "";
        todos.forEach((todo, index) => {
          const li = document.createElement("li");
          li.className = "todo-item" + (todo.completed ? " completed" : "");
          li.innerHTML = `
                    <input type="checkbox" ${todo.completed ? "checked" : ""}>
                    <span>${todo.text}</span>
                    <button>删除</button>
                `;

          // 切换完成状态
          li.querySelector("input").addEventListener("change", function () {
            todos[index].completed = this.checked;
            saveTodos();
            renderTodos();
          });

          // 删除
          li.querySelector("button").addEventListener("click", function () {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
          });

          todoList.appendChild(li);
        });
      }

      // 保存到本地存储
      function saveTodos() {
        localStorage.setItem("todos", JSON.stringify(todos));
      }

      // 添加待办
      addBtn.addEventListener("click", function () {
        const text = todoInput.value.trim();
        if (text) {
          todos.push({ text, completed: false });
          saveTodos();
          renderTodos();
          todoInput.value = "";
        }
      });

      // 回车添加
      todoInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          addBtn.click();
        }
      });

      // 初始渲染
      renderTodos();
    </script>
  </body>
</html>
```

### 9.2 项目二：图片轮播

#### 项目功能

- 自动轮播
- 手动切换
- 指示器
- 过渡动画

## 第十章：学习资源与下一步

### 10.1 学习资源

#### 官方文档

- **MDN JavaScript 文档**：最权威的 JavaScript 文档
- **JavaScript.info**：现代 JavaScript 教程
- **ES6 教程**：ECMAScript 6 新特性

#### 在线练习

- **freeCodeCamp**：免费 JavaScript 课程
- **LeetCode**：算法练习
- **Codewars**：编程挑战

### 10.2 下一步学习

#### 框架学习

- **Vue.js**：渐进式 JavaScript 框架
- **React**：用于构建用户界面的库
- **Angular**：完整的前端框架

#### 进阶主题

- **ES6+ 新特性**：箭头函数、解构、模块等
- **TypeScript**：类型安全的 JavaScript
- **Node.js**：服务端 JavaScript

## 结语：JavaScript 让网页动起来

JavaScript 是前端开发的核心，掌握 JavaScript 能够：

1. **实现交互**：响应用户操作，创建动态效果
2. **操作 DOM**：动态修改网页内容
3. **处理数据**：验证表单、处理数据
4. **异步编程**：处理网络请求和异步操作

记住，学习 JavaScript 需要：

- **多练习**：通过项目实践巩固知识
- **理解概念**：理解作用域、闭包、异步等概念
- **阅读文档**：经常查阅 MDN 文档
- **持续学习**：关注 JavaScript 新特性和最佳实践

下一步，我们将学习前端框架，进入现代前端开发。继续加油！
