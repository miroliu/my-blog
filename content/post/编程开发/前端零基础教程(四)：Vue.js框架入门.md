---
title: 前端零基础教程(四)：Vue.js框架入门
description: 从零开始学习Vue.js，掌握组件、指令、响应式数据、路由等核心概念
date: 2025-12-09 14:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["编程开发"]
---

# 前端零基础教程(四)：Vue.js 框架入门

Vue.js 是一个渐进式 JavaScript 框架，用于构建用户界面。本文将从零开始，系统学习 Vue.js 的基础知识，帮助你掌握现代前端框架开发。

## 第一章：Vue.js 基础认知（第 1 周）

### 1.1 什么是 Vue.js

#### Vue.js 的定义

- **渐进式框架**：可以逐步采用，不需要重写整个项目
- **响应式系统**：数据变化自动更新视图
- **组件化开发**：将页面拆分为可复用的组件
- **易学易用**：学习曲线平缓，文档完善

#### Vue.js 的优势

- **简单易学**：语法简洁，上手快
- **性能优秀**：虚拟 DOM 和响应式系统
- **生态丰富**：Vue Router、Vuex、Pinia 等
- **社区活跃**：中文文档完善，社区支持好

### 1.2 环境准备

#### CDN 引入（学习用）

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>Vue.js 入门</title>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  </head>
  <body>
    <div id="app">
      <h1>{{ message }}</h1>
    </div>

    <script>
      const { createApp } = Vue;

      createApp({
        data() {
          return {
            message: "Hello, Vue.js!",
          };
        },
      }).mount("#app");
    </script>
  </body>
</html>
```

#### 使用 Vite 创建项目（推荐）

```bash
# 创建 Vue 项目
npm create vue@latest my-project

# 进入项目目录
cd my-project

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 1.3 Vue 实例

#### 创建 Vue 应用

```javascript
// Vue 3 方式
import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);
app.mount("#app");
```

#### 选项式 API

```javascript
export default {
  data() {
    return {
      message: "Hello, Vue!",
    };
  },
  methods: {
    greet() {
      alert(this.message);
    },
  },
};
```

#### 组合式 API

```javascript
import { ref } from "vue";

export default {
  setup() {
    const message = ref("Hello, Vue!");

    const greet = () => {
      alert(message.value);
    };

    return {
      message,
      greet,
    };
  },
};
```

## 第二章：模板语法（第 1-2 周）

### 2.1 插值

#### 文本插值

```vue
<template>
  <div>
    <p>{{ message }}</p>
    <p v-text="message"></p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: "Hello, Vue!",
    };
  },
};
</script>
```

#### 原始 HTML

```vue
<template>
  <div>
    <p>{{ rawHtml }}</p>
    <p v-html="rawHtml"></p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      rawHtml: "<strong>加粗文本</strong>",
    };
  },
};
</script>
```

#### 表达式

```vue
<template>
  <div>
    <p>{{ number + 1 }}</p>
    <p>{{ ok ? "YES" : "NO" }}</p>
    <p>{{ message.split("").reverse().join("") }}</p>
  </div>
</template>
```

### 2.2 指令

#### v-bind（属性绑定）

```vue
<template>
  <div>
    <!-- 绑定属性 -->
    <img v-bind:src="imageSrc" v-bind:alt="imageAlt" />

    <!-- 简写 -->
    <img :src="imageSrc" :alt="imageAlt" />

    <!-- 绑定 class -->
    <div :class="{ active: isActive }">内容</div>
    <div :class="[classA, classB]">内容</div>

    <!-- 绑定 style -->
    <div :style="{ color: textColor, fontSize: fontSize + 'px' }">内容</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      imageSrc: "image.jpg",
      imageAlt: "图片",
      isActive: true,
      classA: "class-a",
      classB: "class-b",
      textColor: "red",
      fontSize: 16,
    };
  },
};
</script>
```

#### v-if/v-else（条件渲染）

```vue
<template>
  <div>
    <p v-if="isVisible">显示的内容</p>
    <p v-else>隐藏时显示的内容</p>

    <div v-if="type === 'A'">类型 A</div>
    <div v-else-if="type === 'B'">类型 B</div>
    <div v-else>其他类型</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isVisible: true,
      type: "A",
    };
  },
};
</script>
```

#### v-show（条件显示）

```vue
<template>
  <div>
    <p v-show="isVisible">内容（通过 CSS display 控制）</p>
  </div>
</template>
```

#### v-for（列表渲染）

```vue
<template>
  <div>
    <!-- 遍历数组 -->
    <ul>
      <li v-for="(item, index) in items" :key="index">
        {{ index }}: {{ item }}
      </li>
    </ul>

    <!-- 遍历对象 -->
    <ul>
      <li v-for="(value, key) in user" :key="key">{{ key }}: {{ value }}</li>
    </ul>

    <!-- 遍历数字 -->
    <span v-for="n in 10" :key="n">{{ n }}</span>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: ["苹果", "香蕉", "橙子"],
      user: {
        name: "Tom",
        age: 20,
        email: "tom@example.com",
      },
    };
  },
};
</script>
```

#### v-on（事件监听）

```vue
<template>
  <div>
    <!-- 点击事件 -->
    <button v-on:click="handleClick">点击</button>

    <!-- 简写 -->
    <button @click="handleClick">点击</button>

    <!-- 传递参数 -->
    <button @click="handleClick('参数')">点击</button>

    <!-- 事件修饰符 -->
    <button @click.stop="handleClick">阻止冒泡</button>
    <button @click.prevent="handleClick">阻止默认</button>

    <!-- 按键修饰符 -->
    <input @keyup.enter="handleEnter" />
  </div>
</template>

<script>
export default {
  methods: {
    handleClick() {
      console.log("点击了按钮");
    },
    handleEnter() {
      console.log("按了回车");
    },
  },
};
</script>
```

#### v-model（双向绑定）

```vue
<template>
  <div>
    <!-- 文本输入 -->
    <input v-model="message" placeholder="输入内容" />
    <p>输入的内容：{{ message }}</p>

    <!-- 复选框 -->
    <input type="checkbox" v-model="checked" />
    <p>选中状态：{{ checked }}</p>

    <!-- 单选按钮 -->
    <input type="radio" value="A" v-model="selected" />
    <input type="radio" value="B" v-model="selected" />
    <p>选中：{{ selected }}</p>

    <!-- 下拉选择 -->
    <select v-model="selectedOption">
      <option value="option1">选项1</option>
      <option value="option2">选项2</option>
    </select>
    <p>选中：{{ selectedOption }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: "",
      checked: false,
      selected: "A",
      selectedOption: "option1",
    };
  },
};
</script>
```

## 第三章：组件基础（第 2-3 周）

### 3.1 组件定义

#### 全局组件

```javascript
// main.js
import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);

// 注册全局组件
app.component("MyComponent", {
  template: "<div>我的组件</div>",
});

app.mount("#app");
```

#### 局部组件

```vue
<!-- App.vue -->
<template>
  <div>
    <MyComponent />
  </div>
</template>

<script>
import MyComponent from "./components/MyComponent.vue";

export default {
  components: {
    MyComponent,
  },
};
</script>
```

### 3.2 组件通信

#### Props（父传子）

```vue
<!-- 父组件 -->
<template>
  <div>
    <ChildComponent :message="parentMessage" :user="user" />
  </div>
</template>

<script>
import ChildComponent from "./ChildComponent.vue";

export default {
  components: {
    ChildComponent,
  },
  data() {
    return {
      parentMessage: "来自父组件的消息",
      user: { name: "Tom", age: 20 },
    };
  },
};
</script>
```

```vue
<!-- 子组件 -->
<template>
  <div>
    <p>{{ message }}</p>
    <p>{{ user.name }} - {{ user.age }}</p>
  </div>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      required: true,
    },
    user: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>
```

#### 事件（子传父）

```vue
<!-- 子组件 -->
<template>
  <button @click="sendMessage">发送消息</button>
</template>

<script>
export default {
  methods: {
    sendMessage() {
      this.$emit("message", "来自子组件的消息");
    },
  },
};
</script>
```

```vue
<!-- 父组件 -->
<template>
  <div>
    <ChildComponent @message="handleMessage" />
    <p>{{ receivedMessage }}</p>
  </div>
</template>

<script>
import ChildComponent from "./ChildComponent.vue";

export default {
  components: {
    ChildComponent,
  },
  data() {
    return {
      receivedMessage: "",
    };
  },
  methods: {
    handleMessage(message) {
      this.receivedMessage = message;
    },
  },
};
</script>
```

### 3.3 插槽

#### 默认插槽

```vue
<!-- 子组件 -->
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">默认标题</slot>
    </div>
    <div class="card-body">
      <slot>默认内容</slot>
    </div>
  </div>
</template>
```

```vue
<!-- 父组件 -->
<template>
  <Card>
    <template #header>
      <h2>自定义标题</h2>
    </template>
    <p>自定义内容</p>
  </Card>
</template>
```

## 第四章：响应式数据（第 3 周）

### 4.1 data 和 computed

#### data

```vue
<template>
  <div>
    <p>{{ count }}</p>
    <button @click="count++">增加</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0,
    };
  },
};
</script>
```

#### computed（计算属性）

```vue
<template>
  <div>
    <p>原价：{{ price }}</p>
    <p>折扣：{{ discount }}</p>
    <p>最终价格：{{ finalPrice }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      price: 100,
      discount: 0.8,
    };
  },
  computed: {
    finalPrice() {
      return this.price * this.discount;
    },
  },
};
</script>
```

### 4.2 methods 和 watch

#### methods

```vue
<template>
  <div>
    <p>{{ message }}</p>
    <button @click="reverseMessage">反转消息</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      message: "Hello, Vue!",
    };
  },
  methods: {
    reverseMessage() {
      this.message = this.message.split("").reverse().join("");
    },
  },
};
</script>
```

#### watch（监听器）

```vue
<template>
  <div>
    <input v-model="searchQuery" placeholder="搜索" />
    <p>搜索结果：{{ results }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: "",
      results: "",
    };
  },
  watch: {
    searchQuery(newVal, oldVal) {
      // 搜索逻辑
      this.results = "搜索: " + newVal;
    },
  },
};
</script>
```

## 第五章：生命周期（第 3-4 周）

### 5.1 生命周期钩子

```vue
<script>
export default {
  data() {
    return {
      message: "Hello",
    };
  },
  beforeCreate() {
    // 实例创建前
    console.log("beforeCreate");
  },
  created() {
    // 实例创建后
    console.log("created");
    // 可以访问 data、methods
  },
  beforeMount() {
    // 挂载前
    console.log("beforeMount");
  },
  mounted() {
    // 挂载后
    console.log("mounted");
    // DOM 已渲染，可以操作 DOM
  },
  beforeUpdate() {
    // 更新前
    console.log("beforeUpdate");
  },
  updated() {
    // 更新后
    console.log("updated");
  },
  beforeUnmount() {
    // 卸载前
    console.log("beforeUnmount");
  },
  unmounted() {
    // 卸载后
    console.log("unmounted");
  },
};
</script>
```

## 第六章：Vue Router（第 4 周）

### 6.1 路由基础

#### 安装和配置

```bash
npm install vue-router@4
```

```javascript
// router/index.js
import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import About from "../views/About.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
```

#### 路由使用

```vue
<!-- App.vue -->
<template>
  <div>
    <nav>
      <router-link to="/">首页</router-link>
      <router-link to="/about">关于</router-link>
    </nav>
    <router-view />
  </div>
</template>
```

### 6.2 路由导航

```vue
<template>
  <div>
    <!-- 声明式导航 -->
    <router-link to="/about">关于</router-link>
    <router-link :to="{ name: 'About' }">关于</router-link>

    <!-- 编程式导航 -->
    <button @click="goToAbout">跳转到关于</button>
  </div>
</template>

<script>
export default {
  methods: {
    goToAbout() {
      this.$router.push("/about");
      // 或
      this.$router.push({ name: "About" });
    },
  },
};
</script>
```

## 第七章：状态管理 Pinia（第 4-5 周）

### 7.1 Pinia 基础

#### 安装和配置

```bash
npm install pinia
```

```javascript
// main.js
import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

const app = createApp(App);
app.use(createPinia());
app.mount("#app");
```

#### 定义 Store

```javascript
// stores/counter.js
import { defineStore } from "pinia";

export const useCounterStore = defineStore("counter", {
  state: () => ({
    count: 0,
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
  },
});
```

#### 使用 Store

```vue
<template>
  <div>
    <p>计数：{{ counterStore.count }}</p>
    <p>双倍：{{ counterStore.doubleCount }}</p>
    <button @click="counterStore.increment">增加</button>
    <button @click="counterStore.decrement">减少</button>
  </div>
</template>

<script>
import { useCounterStore } from "@/stores/counter";

export default {
  setup() {
    const counterStore = useCounterStore();
    return {
      counterStore,
    };
  },
};
</script>
```

## 第八章：实战项目（第 5-6 周）

### 8.1 项目一：待办事项应用（Vue 版）

#### 项目功能

- 添加、删除、完成待办
- 本地存储
- 使用 Vue 组件化开发

```vue
<!-- TodoApp.vue -->
<template>
  <div class="todo-app">
    <h1>待办事项</h1>
    <div class="input-group">
      <input
        v-model="newTodo"
        @keyup.enter="addTodo"
        placeholder="输入待办事项"
      />
      <button @click="addTodo">添加</button>
    </div>
    <ul class="todo-list">
      <TodoItem
        v-for="(todo, index) in todos"
        :key="index"
        :todo="todo"
        @toggle="toggleTodo(index)"
        @delete="deleteTodo(index)"
      />
    </ul>
  </div>
</template>

<script>
import TodoItem from "./TodoItem.vue";

export default {
  components: {
    TodoItem,
  },
  data() {
    return {
      newTodo: "",
      todos: JSON.parse(localStorage.getItem("todos")) || [],
    };
  },
  watch: {
    todos: {
      handler(newTodos) {
        localStorage.setItem("todos", JSON.stringify(newTodos));
      },
      deep: true,
    },
  },
  methods: {
    addTodo() {
      if (this.newTodo.trim()) {
        this.todos.push({
          text: this.newTodo,
          completed: false,
        });
        this.newTodo = "";
      }
    },
    toggleTodo(index) {
      this.todos[index].completed = !this.todos[index].completed;
    },
    deleteTodo(index) {
      this.todos.splice(index, 1);
    },
  },
};
</script>
```

```vue
<!-- TodoItem.vue -->
<template>
  <li :class="{ completed: todo.completed }">
    <input
      type="checkbox"
      :checked="todo.completed"
      @change="$emit('toggle')"
    />
    <span>{{ todo.text }}</span>
    <button @click="$emit('delete')">删除</button>
  </li>
</template>

<script>
export default {
  props: {
    todo: {
      type: Object,
      required: true,
    },
  },
  emits: ["toggle", "delete"],
};
</script>
```

### 8.2 项目二：用户管理系统

#### 项目功能

- 用户列表展示
- 添加、编辑、删除用户
- 表单验证
- 路由导航

## 第九章：学习资源与下一步

### 9.1 学习资源

#### 官方文档

- **Vue.js 官方文档**：最权威的 Vue 文档
- **Vue Router 文档**：路由管理文档
- **Pinia 文档**：状态管理文档

#### 在线教程

- **Vue.js 教程**：官方教程
- **Vue Mastery**：Vue 视频教程
- **B 站 Vue 教程**：中文视频教程

### 9.2 下一步学习

#### 进阶主题

- **Vue 3 Composition API**：组合式 API 深入
- **TypeScript + Vue**：类型安全开发
- **Vue 性能优化**：性能优化技巧
- **SSR/Nuxt.js**：服务端渲染

#### 项目实战

- **电商网站**：完整的前端项目
- **管理系统**：后台管理系统
- **移动端应用**：使用 Vue 开发移动应用

## 结语：Vue.js 让开发更高效

Vue.js 是现代前端开发的重要工具，掌握 Vue.js 能够：

1. **提高效率**：组件化开发，代码复用
2. **响应式更新**：数据变化自动更新视图
3. **生态完善**：路由、状态管理等工具齐全
4. **易于维护**：代码结构清晰，易于维护

记住，学习 Vue.js 需要：

- **多实践**：通过项目练习巩固知识
- **理解原理**：理解响应式系统和虚拟 DOM
- **阅读文档**：经常查阅官方文档
- **持续学习**：关注 Vue 新特性和最佳实践

下一步，我们将学习前端工程化，掌握现代前端开发工具链。继续加油！
