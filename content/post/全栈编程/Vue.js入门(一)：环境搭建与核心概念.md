---
title: "Vue.js入门(一)：环境搭建与核心概念"
date: 2025-10-30T10:25:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["Vue.js", "前端", "入门教程", "环境搭建", "核心概念", "MVVM"]
license: ""
hidden: false
---

# Vue.js入门(一)：环境搭建与核心概念

## 前言

Vue.js是一套用于构建用户界面的渐进式JavaScript框架，由尤雨溪创建并维护。它易于上手，同时也可以用于构建复杂的单页应用。本系列教程将从基础开始，逐步深入Vue.js的各个方面，帮助你掌握Vue.js的开发技巧。

## Vue.js的特点

Vue.js具有以下显著特点：

1. **渐进式框架**：可以根据需求逐步采用Vue.js的功能
2. **响应式数据绑定**：通过Object.defineProperty实现数据与视图的自动同步
3. **组件化开发**：将界面拆分为可复用的组件
4. **虚拟DOM**：提高渲染性能
5. **指令系统**：提供丰富的内置指令如`v-if`、`v-for`等
6. **单文件组件**：使用.vue文件封装模板、样式和逻辑

## 环境搭建

### 使用Vue CLI

Vue CLI是Vue.js官方提供的脚手架工具，用于快速搭建Vue.js项目。

#### 安装Node.js和npm

首先，确保你已经安装了Node.js和npm。可以通过以下命令检查版本：

```bash
node -v
npm -v
```

如果没有安装，可以从[Node.js官网](https://nodejs.org/)下载并安装。

#### 安装Vue CLI

使用npm全局安装Vue CLI：

```bash
npm install -g @vue/cli
```

安装完成后，可以通过以下命令检查版本：

```bash
vue --version
```

#### 创建Vue项目

使用Vue CLI创建新项目：

```bash
vue create my-vue-app
```

创建过程中会提示选择预设配置，可以选择默认配置或手动选择功能。对于初学者，建议选择默认配置。

#### 启动项目

项目创建完成后，进入项目目录并启动开发服务器：

```bash
cd my-vue-app
npm run serve
```

然后在浏览器中访问http://localhost:8080，你将看到Vue.js的欢迎页面。

### 使用Vite

Vite是一个现代化的前端构建工具，提供极速的开发服务器启动和热模块替换。Vue官方现在推荐使用Vite来创建新项目。

#### 创建Vite项目

```bash
npm create vite@latest my-vue-app -- --template vue
```

或者使用yarn：

```bash
yarn create vite my-vue-app --template vue
```

#### 安装依赖并启动

```bash
cd my-vue-app
npm install
npm run dev
```

## Vue实例

每个Vue应用都是通过创建一个新的Vue实例开始的：

```javascript
const app = new Vue({
  el: '#app', // 挂载点
  data: {
    message: 'Hello Vue!'
  },
  methods: {
    showMessage() {
      alert(this.message);
    }
  }
});
```

对应的HTML：

```html
<div id="app">
  {{ message }}
  <button @click="showMessage">Show Message</button>
</div>
```

### Vue实例的生命周期

Vue实例有一个完整的生命周期，从创建到销毁。以下是Vue实例的主要生命周期钩子：

1. **beforeCreate**：实例初始化之后，数据观测和事件配置之前被调用
2. **created**：实例创建完成后被调用，此时可以访问数据和方法，但DOM尚未挂载
3. **beforeMount**：挂载开始之前被调用
4. **mounted**：实例挂载到DOM后被调用，此时可以访问DOM元素
5. **beforeUpdate**：数据更新时调用，发生在虚拟DOM重新渲染之前
6. **updated**：DOM更新后调用
7. **beforeDestroy**：实例销毁之前调用
8. **destroyed**：实例销毁后调用

示例：

```javascript
const app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  },
  beforeCreate() {
    console.log('beforeCreate: ', this.message); // undefined
  },
  created() {
    console.log('created: ', this.message); // Hello Vue!
  },
  mounted() {
    console.log('mounted: ', this.$el.textContent); // Hello Vue!
  }
});
```

## 模板语法

### 插值

#### 文本插值

最基本的数据绑定形式是文本插值，使用双大括号：

```html
<div>{{ message }}</div>
```

#### 原始HTML

要输出原始HTML，可以使用`v-html`指令：

```html
<div v-html="rawHtml"></div>
```

#### 属性绑定

使用`v-bind`指令（可缩写为`:`）绑定HTML属性：

```html
<div v-bind:id="dynamicId"></div>
<!-- 缩写 -->
<div :id="dynamicId"></div>
```

#### JavaScript表达式

在模板中可以使用JavaScript表达式：

```html
<div>{{ number + 1 }}</div>
<div>{{ ok ? 'YES' : 'NO' }}</div>
<div>{{ message.split('').reverse().join('') }}</div>
```

### 指令

指令是带有`v-`前缀的特殊属性，它们应用特殊的响应式行为到DOM上。

#### 条件渲染

```html
<!-- v-if -->
<div v-if="seen">Now you see me</div>
<div v-else-if="elseIfCondition">Else if condition</div>
<div v-else>Now you don't</div>

<!-- v-show -->
<div v-show="seen">Always rendered, but toggles display CSS property</div>
```

**注意**：`v-if`是真正的条件渲染，会根据条件完全销毁和重建元素；而`v-show`只是切换元素的CSS display属性。

#### 列表渲染

```html
<ul>
  <li v-for="item in items" :key="item.id">{{ item.text }}</li>
</ul>

<!-- 获取索引 -->
<ul>
  <li v-for="(item, index) in items" :key="index">{{ index }}: {{ item.text }}</li>
</ul>

<!-- 遍历对象 -->
<ul>
  <li v-for="(value, key, index) in object" :key="key">{{ index }}. {{ key }}: {{ value }}</li>
</ul>
```

#### 事件处理

使用`v-on`指令（可缩写为`@`）监听DOM事件：

```html
<!-- 基本用法 -->
<button v-on:click="counter += 1">Add 1</button>
<!-- 缩写 -->
<button @click="counter += 1">Add 1</button>

<!-- 调用方法 -->
<button @click="greet">Greet</button>

<!-- 内联表达式 -->
<button @click="say('hi')">Say hi</button>
<button @click="say('what')">Say what</button>

<!-- 访问事件对象 -->
<button @click="warn('Form cannot be submitted yet.', $event)">Submit</button>
```

#### 表单输入绑定

使用`v-model`指令在表单元素和数据之间创建双向数据绑定：

```html
<!-- 文本 -->
<input v-model="message" placeholder="edit me">
<p>Message is: {{ message }}</p>

<!-- 复选框 -->
<input type="checkbox" id="checkbox" v-model="checked">
<label for="checkbox">{{ checked }}</label>

<!-- 多个复选框，绑定到同一个数组 -->
<input type="checkbox" id="jack" value="Jack" v-model="checkedNames">
<label for="jack">Jack</label>
<input type="checkbox" id="john" value="John" v-model="checkedNames">
<label for="john">John</label>
<p>Checked names: {{ checkedNames }}</p>

<!-- 单选按钮 -->
<input type="radio" id="one" value="One" v-model="picked">
<label for="one">One</label>
<input type="radio" id="two" value="Two" v-model="picked">
<label for="two">Two</label>
<p>Picked: {{ picked }}</p>

<!-- 选择框 -->
<select v-model="selected">
  <option disabled value="">请选择</option>
  <option>A</option>
  <option>B</option>
  <option>C</option>
</select>
<p>Selected: {{ selected }}</p>
```

## 计算属性和侦听器

### 计算属性

计算属性用于处理复杂的逻辑，并且具有缓存特性：

```javascript
const app = new Vue({
  el: '#app',
  data: {
    message: 'Hello'
  },
  computed: {
    // 计算属性的getter
    reversedMessage: function () {
      // this 指向 vm 实例
      return this.message.split('').reverse().join('');
    }
  }
});
```

```html
<p>Original message: {{ message }}</p>
<p>Computed reversed message: {{ reversedMessage }}</p>
```

### 侦听器

使用`watch`选项可以响应数据的变化：

```javascript
const app = new Vue({
  el: '#app',
  data: {
    question: '',
    answer: 'I cannot give you an answer until you ask a question!'
  },
  watch: {
    // 当 question 发生变化时，这个函数会被调用
    question: function (newQuestion, oldQuestion) {
      this.answer = 'Waiting for you to stop typing...';
      this.debouncedGetAnswer();
    }
  },
  created: function () {
    // 创建一个防抖函数
    this.debouncedGetAnswer = _.debounce(this.getAnswer, 500);
  },
  methods: {
    getAnswer: function () {
      if (this.question.indexOf('?') === -1) {
        this.answer = 'Questions usually contain a question mark. ;-)';
        return;
      }
      this.answer = 'Thinking...';
      // 模拟API调用
      setTimeout(() => {
        this.answer = 'Here is an answer for: ' + this.question;
      }, 1000);
    }
  }
});
```

## 组件系统

组件是Vue.js最强大的功能之一，它允许我们使用小型、独立和可复用的组件构建大型应用。

### 全局注册组件

```javascript
// 注册一个全局组件
Vue.component('my-component', {
  // 组件的模板
  template: '<div>A custom component!</div>',
  // 组件的数据必须是一个函数
  data: function () {
    return {
      count: 0
    }
  },
  methods: {
    increment: function () {
      this.count++
    }
  }
});

// 在Vue实例中使用
const app = new Vue({
  el: '#app'
});
```

```html
<div id="app">
  <my-component></my-component>
</div>
```

### 局部注册组件

```javascript
// 定义一个局部组件
const Child = {
  template: '<div>A child component</div>',
  data() {
    return {
      childData: 'child data'
    }
  }
};

const app = new Vue({
  el: '#app',
  components: {
    // <my-component> 将只在父组件模板中可用
    'my-component': Child
  }
});
```

### 单文件组件

在大型应用中，通常使用单文件组件（.vue文件），它可以包含模板、脚本和样式：

```vue
<!-- MyComponent.vue -->
<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button @click="increment">Count: {{ count }}</button>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<!-- 添加scoped属性使样式只应用于该组件 -->
<style scoped>
.hello {
  font-family: Arial, sans-serif;
}
</style>
```

在其他组件中使用：

```vue
<template>
  <div id="app">
    <MyComponent msg="Hello Vue!" />
  </div>
</template>

<script>
import MyComponent from './components/MyComponent.vue'

export default {
  name: 'App',
  components: {
    MyComponent
  }
}
</script>
```

## 实战项目：简易待办事项应用

现在，让我们创建一个简单的待办事项应用，来巩固所学的Vue.js知识。

### 项目结构

```
my-todo-app/
├── public/
│   └── index.html
├── src/
│   ├── assets/
│   ├── components/
│   │   └── TodoItem.vue
│   ├── App.vue
│   └── main.js
├── package.json
└── README.md
```

### 实现步骤

#### 1. 创建项目

使用Vite创建一个新的Vue项目：

```bash
npm create vite@latest my-todo-app -- --template vue
cd my-todo-app
npm install
```

#### 2. 创建TodoItem组件

在`src/components`目录下创建`TodoItem.vue`：

```vue
<!-- TodoItem.vue -->
<template>
  <li :class="{ completed: todo.completed }">
    <input 
      type="checkbox" 
      :checked="todo.completed" 
      @change="toggleTodo"
    >
    <span @dblclick="editTodo" v-if="!isEditing">{{ todo.text }}</span>
    <input 
      v-else 
      v-model="editText" 
      @keyup.enter="saveEdit" 
      @keyup.esc="cancelEdit" 
      @blur="saveEdit" 
      ref="editInput"
    >
    <button @click="deleteTodo" class="delete-btn">×</button>
  </li>
</template>

<script>
export default {
  name: 'TodoItem',
  props: {
    todo: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isEditing: false,
      editText: ''
    }
  },
  methods: {
    toggleTodo() {
      this.$emit('toggle', this.todo.id);
    },
    deleteTodo() {
      this.$emit('delete', this.todo.id);
    },
    editTodo() {
      this.isEditing = true;
      this.editText = this.todo.text;
      // 在编辑模式下聚焦输入框
      this.$nextTick(() => {
        this.$refs.editInput.focus();
      });
    },
    saveEdit() {
      if (this.editText.trim()) {
        this.$emit('update', this.todo.id, this.editText.trim());
      } else {
        this.$emit('delete', this.todo.id);
      }
      this.isEditing = false;
    },
    cancelEdit() {
      this.isEditing = false;
    }
  }
}
</script>

<style scoped>
li {
  padding: 10px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
}

.completed span {
  text-decoration: line-through;
  color: #888;
}

input[type="text"] {
  flex: 1;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.delete-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 18px;
  color: #ff6b6b;
  cursor: pointer;
}

.delete-btn:hover {
  color: #ff4757;
}
</style>
```

#### 3. 创建App组件

修改`src/App.vue`：

```vue
<template>
  <div id="app">
    <h1>Todo List</h1>
    <div class="todo-app">
      <input 
        v-model="newTodoText" 
        @keyup.enter="addTodo" 
        placeholder="What needs to be done?"
        class="todo-input"
      >
      
      <ul class="todo-list">
        <TodoItem 
          v-for="todo in todos" 
          :key="todo.id" 
          :todo="todo" 
          @toggle="toggleTodo" 
          @delete="deleteTodo"
          @update="updateTodo"
        />
      </ul>
      
      <div class="todo-footer" v-if="todos.length > 0">
        <span>{{ remainingCount }} items left</span>
        <div class="filters">
          <button 
            @click="setFilter('all')" 
            :class="{ active: currentFilter === 'all' }"
          >
            All
          </button>
          <button 
            @click="setFilter('active')" 
            :class="{ active: currentFilter === 'active' }"
          >
            Active
          </button>
          <button 
            @click="setFilter('completed')" 
            :class="{ active: currentFilter === 'completed' }"
          >
            Completed
          </button>
        </div>
        <button @click="clearCompleted" v-if="completedCount > 0">
          Clear completed
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import TodoItem from './components/TodoItem.vue'

export default {
  name: 'App',
  components: {
    TodoItem
  },
  data() {
    return {
      newTodoText: '',
      todos: [],
      nextTodoId: 1,
      currentFilter: 'all'
    }
  },
  computed: {
    filteredTodos() {
      switch (this.currentFilter) {
        case 'active':
          return this.todos.filter(todo => !todo.completed)
        case 'completed':
          return this.todos.filter(todo => todo.completed)
        default:
          return this.todos
      }
    },
    remainingCount() {
      return this.todos.filter(todo => !todo.completed).length
    },
    completedCount() {
      return this.todos.filter(todo => todo.completed).length
    }
  },
  methods: {
    addTodo() {
      if (this.newTodoText.trim()) {
        this.todos.push({
          id: this.nextTodoId++,
          text: this.newTodoText.trim(),
          completed: false
        })
        this.newTodoText = ''
      }
    },
    toggleTodo(id) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        todo.completed = !todo.completed
      }
    },
    deleteTodo(id) {
      const index = this.todos.findIndex(t => t.id === id)
      if (index !== -1) {
        this.todos.splice(index, 1)
      }
    },
    updateTodo(id, text) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        todo.text = text
      }
    },
    setFilter(filter) {
      this.currentFilter = filter
    },
    clearCompleted() {
      this.todos = this.todos.filter(todo => !todo.completed)
    }
  },
  // 页面加载时从localStorage加载数据
  mounted() {
    const savedTodos = localStorage.getItem('todos')
    if (savedTodos) {
      this.todos = JSON.parse(savedTodos)
      // 更新下一个ID
      if (this.todos.length > 0) {
        this.nextTodoId = Math.max(...this.todos.map(todo => todo.id)) + 1
      }
    }
  },
  // 数据变化时保存到localStorage
  watch: {
    todos: {
      handler(newTodos) {
        localStorage.setItem('todos', JSON.stringify(newTodos))
      },
      deep: true
    }
  }
}
</script>

<style>
#app {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #2c3e50;
  text-align: center;
}

.todo-app {
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  border-radius: 5px;
  overflow: hidden;
}

.todo-input {
  width: 100%;
  padding: 15px;
  font-size: 16px;
  border: none;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
}

.todo-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.todo-footer {
  padding: 10px 15px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #666;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 10px;
}

.filters button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 3px 5px;
}

.filters button.active {
  border: 1px solid #ddd;
  border-radius: 3px;
}

button {
  cursor: pointer;
  background: none;
  border: none;
  color: #666;
}

button:hover {
  color: #000;
}
</style>
```

#### 4. 运行项目

```bash
npm run dev
```

打开浏览器访问http://localhost:3000，你应该能看到一个功能完整的待办事项应用。

## 总结

本文介绍了Vue.js的基础环境搭建和核心概念，包括：

1. **Vue.js的特点**：渐进式框架、响应式数据绑定、组件化开发等
2. **环境搭建**：使用Vue CLI和Vite创建Vue项目
3. **Vue实例**：创建Vue实例和生命周期钩子
4. **模板语法**：插值、指令、事件处理等
5. **计算属性和侦听器**：处理复杂逻辑和响应数据变化
6. **组件系统**：全局注册和局部注册组件、单文件组件

通过实战项目，我们创建了一个简易的待办事项应用，展示了Vue.js的基本功能。在下一篇教程中，我们将深入学习Vue.js的组件通信、动画效果和路由功能，敬请期待！