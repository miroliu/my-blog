---
title: "Vue.js进阶(二)：组件通信、状态管理与路由"
date: 2025-10-30T09:25:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["Vue.js", "前端", "进阶教程", "组件通信", "状态管理", "Vuex", "Vue Router"]
license: ""
hidden: false
---

# Vue.js进阶(二)：组件通信、状态管理与路由

## 前言

在Vue.js入门教程中，我们学习了Vue.js的基础概念和环境搭建。本文将深入探讨Vue.js的进阶内容，包括组件通信、状态管理和路由等重要概念，这些是构建复杂Vue应用的关键。

## 组件通信

在Vue.js应用中，组件是构建界面的基本单位。组件之间需要进行数据传递和通信，Vue.js提供了多种组件通信方式。

### 父组件向子组件传递数据：Props

父组件可以通过props向子组件传递数据：

```vue
<!-- ParentComponent.vue -->
<template>
  <div>
    <ChildComponent 
      :message="parentMessage" 
      :user="user" 
      :callback="parentCallback" 
    />
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  name: 'ParentComponent',
  components: {
    ChildComponent
  },
  data() {
    return {
      parentMessage: 'Hello from parent',
      user: {
        name: 'John',
        age: 30
      }
    }
  },
  methods: {
    parentCallback(data) {
      console.log('Callback from child:', data)
    }
  }
}
</script>

<!-- ChildComponent.vue -->
<template>
  <div>
    <p>{{ message }}</p>
    <p>{{ user.name }} is {{ user.age }} years old</p>
    <button @click="callParent">Call Parent</button>
  </div>
</template>

<script>
export default {
  name: 'ChildComponent',
  // 定义props
  props: {
    // 基本类型
    message: {
      type: String,
      required: true,
      default: 'Default message'
    },
    // 对象类型
    user: {
      type: Object,
      required: true,
      // 对象或数组的默认值必须是一个函数
      default() {
        return { name: 'Guest', age: 0 }
      }
    },
    // 函数类型
    callback: {
      type: Function
    }
  },
  methods: {
    callParent() {
      if (this.callback) {
        this.callback('Hello from child')
      }
    }
  }
}
</script>
```

### 子组件向父组件传递数据：自定义事件

子组件可以通过自定义事件向父组件发送消息：

```vue
<!-- ChildComponent.vue -->
<template>
  <div>
    <button @click="sendDataToParent">Send Data</button>
  </div>
</template>

<script>
export default {
  name: 'ChildComponent',
  data() {
    return {
      childData: 'Data from child'
    }
  },
  methods: {
    sendDataToParent() {
      // 触发自定义事件，第一个参数是事件名，后面是要传递的数据
      this.$emit('child-event', this.childData, { additional: 'info' })
    }
  }
}
</script>

<!-- ParentComponent.vue -->
<template>
  <div>
    <ChildComponent @child-event="handleChildEvent" />
    <p>Data from child: {{ receivedData }}</p>
  </div>
</template>

<script>
import ChildComponent from './ChildComponent.vue'

export default {
  name: 'ParentComponent',
  components: {
    ChildComponent
  },
  data() {
    return {
      receivedData: ''
    }
  },
  methods: {
    handleChildEvent(data, additionalData) {
      this.receivedData = data
      console.log('Additional data:', additionalData)
    }
  }
}
</script>
```

### 兄弟组件通信：EventBus

对于兄弟组件之间的通信，可以使用一个空的Vue实例作为事件总线：

```javascript
// eventBus.js
import Vue from 'vue'
export const EventBus = new Vue()

// ComponentA.vue
<template>
  <div>
    <button @click="sendMessage">Send Message</button>
  </div>
</template>

<script>
import { EventBus } from './eventBus'

export default {
  name: 'ComponentA',
  methods: {
    sendMessage() {
      EventBus.$emit('message-event', 'Hello from Component A')
    }
  }
}
</script>

// ComponentB.vue
<template>
  <div>
    <p>Message from Component A: {{ message }}</p>
  </div>
</template>

<script>
import { EventBus } from './eventBus'

export default {
  name: 'ComponentB',
  data() {
    return {
      message: ''
    }
  },
  mounted() {
    // 监听事件
    this.eventBusListener = EventBus.$on('message-event', (message) => {
      this.message = message
    })
  },
  beforeDestroy() {
    // 组件销毁前移除事件监听，防止内存泄漏
    EventBus.$off('message-event', this.eventBusListener)
  }
}
</script>
```

### 跨层级组件通信：provide/inject

对于嵌套层级较深的组件，可以使用Vue的provide/inject API进行通信：

```vue
<!-- ParentComponent.vue -->
<template>
  <div>
    <MiddleComponent />
  </div>
</template>

<script>
import MiddleComponent from './MiddleComponent.vue'

export default {
  name: 'ParentComponent',
  provide() {
    return {
      theme: 'dark',
      userData: this.userData,
      updateUserData: this.updateUserData
    }
  },
  data() {
    return {
      userData: {
        name: 'John',
        role: 'Admin'
      }
    }
  },
  methods: {
    updateUserData(data) {
      this.userData = { ...this.userData, ...data }
    }
  }
}
</script>

<!-- DeepChildComponent.vue (嵌套在MiddleComponent内部) -->
<template>
  <div :class="theme">
    <p>User: {{ userData.name }} ({{ userData.role }})</p>
    <button @click="changeRole">Change Role</button>
  </div>
</template>

<script>
export default {
  name: 'DeepChildComponent',
  inject: ['theme', 'userData', 'updateUserData'],
  methods: {
    changeRole() {
      this.updateUserData({ role: 'User' })
    }
  }
}
</script>

<style scoped>
.dark {
  background-color: #333;
  color: #fff;
}
</style>
```

## Vuex状态管理

对于大型应用，组件间的状态共享和管理变得复杂，此时需要使用Vuex进行集中式状态管理。

### Vuex的核心概念

1. **State**: 存储应用的状态
2. **Getters**: 从state派生状态，类似于计算属性
3. **Mutations**: 更改state的唯一方法，必须是同步函数
4. **Actions**: 处理异步操作，可以包含任意异步逻辑
5. **Modules**: 将store分割成模块化的store

### 安装和使用Vuex

#### 安装Vuex

```bash
npm install vuex --save
```

#### 创建Vuex Store

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  // 状态
  state: {
    count: 0,
    todos: [
      { id: 1, text: 'Learn Vue', done: true },
      { id: 2, text: 'Learn Vuex', done: false }
    ]
  },
  
  // Getters
  getters: {
    doneTodos: state => {
      return state.todos.filter(todo => todo.done)
    },
    doneTodosCount: (state, getters) => {
      return getters.doneTodos.length
    },
    getTodoById: (state) => (id) => {
      return state.todos.find(todo => todo.id === id)
    }
  },
  
  // Mutations
  mutations: {
    increment(state) {
      state.count++
    },
    decrement(state) {
      state.count--
    },
    incrementBy(state, payload) {
      state.count += payload.amount
    },
    addTodo(state, todo) {
      state.todos.push(todo)
    },
    toggleTodo(state, todoId) {
      const todo = state.todos.find(t => t.id === todoId)
      if (todo) {
        todo.done = !todo.done
      }
    }
  },
  
  // Actions
  actions: {
    incrementAsync({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 1000)
    },
    incrementByAsync({ commit }, payload) {
      setTimeout(() => {
        commit('incrementBy', payload)
      }, 1000)
    },
    // 模拟API调用添加待办事项
    addTodoAsync({ commit }, text) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const newTodo = {
            id: Date.now(),
            text,
            done: false
          }
          commit('addTodo', newTodo)
          resolve(newTodo)
        }, 500)
      })
    }
  },
  
  // Modules
  modules: {
    // 可以在这里定义子模块
  }
})
```

#### 在Vue应用中使用Vuex

```javascript
// main.js
import Vue from 'vue'
import App from './App.vue'
import store from './store'

new Vue({
  store, // 将store实例注入到所有子组件
  render: h => h(App)
}).$mount('#app')
```

#### 在组件中使用Vuex

```vue
<!-- CounterComponent.vue -->
<template>
  <div>
    <h2>Count: {{ count }}</h2>
    <h3>Done Todos: {{ doneTodosCount }}</h3>
    
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
    <button @click="incrementBy(5)">Increment by 5</button>
    <button @click="incrementAsync">Increment Async</button>
    
    <div>
      <input v-model="newTodoText" @keyup.enter="addTodo" placeholder="Add a todo">
    </div>
    
    <ul>
      <li v-for="todo in todos" :key="todo.id" @click="toggleTodo(todo.id)">
        {{ todo.text }} - {{ todo.done ? 'Done' : 'Not Done' }}
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  name: 'CounterComponent',
  data() {
    return {
      newTodoText: ''
    }
  },
  // 使用mapState辅助函数
  computed: {
    ...mapState([
      'count',
      'todos'
    ]),
    // 使用mapGetters辅助函数
    ...mapGetters([
      'doneTodosCount'
    ])
  },
  // 使用mapMutations辅助函数
  methods: {
    ...mapMutations([
      'increment',
      'decrement',
      'toggleTodo'
    ]),
    // 使用mapActions辅助函数
    ...mapActions([
      'incrementAsync',
      'addTodoAsync'
    ]),
    // 自定义方法
    incrementBy(amount) {
      this.$store.commit('incrementBy', { amount })
    },
    async addTodo() {
      if (this.newTodoText.trim()) {
        await this.addTodoAsync(this.newTodoText)
        this.newTodoText = ''
      }
    }
  }
}
</script>
```

### Vuex模块化

对于大型应用，可以将store拆分为多个模块：

```javascript
// store/modules/counter.js
const state = {
  count: 0
}

const getters = {
  doubleCount: state => state.count * 2
}

const mutations = {
  increment(state) {
    state.count++
  }
}

const actions = {
  incrementAsync({ commit }) {
    setTimeout(() => {
      commit('increment')
    }, 1000)
  }
}

export default {
  namespaced: true, // 启用命名空间
  state,
  getters,
  mutations,
  actions
}

// store/modules/todos.js
const state = {
  todos: []
}

const mutations = {
  addTodo(state, todo) {
    state.todos.push(todo)
  }
}

export default {
  namespaced: true,
  state,
  mutations
}

// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import counter from './modules/counter'
import todos from './modules/todos'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    counter,
    todos
  }
})
```

在组件中使用模块化的store：

```javascript
// 在组件中
computed: {
  ...mapState('counter', ['count']),
  ...mapGetters('counter', ['doubleCount']),
  ...mapState('todos', ['todos'])
},
methods: {
  ...mapMutations('counter', ['increment']),
  ...mapActions('counter', ['incrementAsync']),
  ...mapMutations('todos', ['addTodo'])
}
```

## Vue Router路由

Vue Router是Vue.js官方的路由管理器，用于构建单页应用。

### 安装和基本配置

#### 安装Vue Router

```bash
npm install vue-router --save
```

#### 配置路由

```javascript
// router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'

// 导入组件
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import User from '../views/User.vue'
import NotFound from '../views/NotFound.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/user/:id',
    name: 'User',
    component: User,
    // 嵌套路由
    children: [
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/UserProfile.vue')
      },
      {
        path: 'posts',
        name: 'UserPosts',
        component: () => import('../views/UserPosts.vue')
      }
    ]
  },
  // 动态导入（懒加载）
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  // 重定向
  {
    path: '/home',
    redirect: '/' // 重定向到首页
  },
  // 404页面
  {
    path: '*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = new VueRouter({
  mode: 'history', // 使用history模式
  base: process.env.BASE_URL,
  routes,
  // 滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { x: 0, y: 0 }
    }
  }
})

export default router
```

#### 在Vue应用中使用路由

```javascript
// main.js
import Vue from 'vue'
import App from './App.vue'
import router from './router'

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
```

#### 路由模板

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link>
      <router-link to="/about">About</router-link>
      <router-link :to="{ name: 'User', params: { id: 123 } }">User</router-link>
      <router-link to="/dashboard">Dashboard</router-link>
    </nav>
    <router-view />
  </div>
</template>
```

### 路由参数和查询

```vue
<!-- User.vue -->
<template>
  <div>
    <h1>User Page</h1>
    <p>User ID: {{ $route.params.id }}</p>
    <p>Query Param: {{ $route.query.sort }}</p>
    
    <div class="user-tabs">
      <router-link :to="{ name: 'UserProfile', params: { id: $route.params.id } }">
        Profile
      </router-link>
      <router-link :to="{ name: 'UserPosts', params: { id: $route.params.id } }">
        Posts
      </router-link>
    </div>
    
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'User',
  // 监听路由变化
  watch: {
    '$route'(to, from) {
      // 当路由参数变化时重新获取数据
      this.fetchUserData(to.params.id)
    }
  },
  // 组件挂载时获取数据
  mounted() {
    this.fetchUserData(this.$route.params.id)
  },
  methods: {
    fetchUserData(id) {
      // 模拟API调用
      console.log(`Fetching data for user ${id}`)
    }
  }
}
</script>
```

### 导航守卫

导航守卫用于控制导航的过程，可以实现权限控制、页面跳转等功能。

#### 全局前置守卫

```javascript
// router/index.js
router.beforeEach((to, from, next) => {
  console.log('Global before each guard')
  
  // 检查是否需要身份验证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isLoggedIn = localStorage.getItem('user') !== null
  
  if (requiresAuth && !isLoggedIn) {
    // 未登录，跳转到登录页
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    // 允许通过
    next()
  }
})

// 定义需要身份验证的路由
const routes = [
  // ...
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      requiresAuth: true
    }
  }
  // ...
]
```

#### 路由独享守卫

```javascript
const routes = [
  // ...
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/Admin.vue'),
    beforeEnter: (to, from, next) => {
      // 检查用户是否是管理员
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.isAdmin) {
        next()
      } else {
        next('/403') // 跳转到403页面
      }
    }
  }
  // ...
]
```

#### 组件内守卫

```vue
<script>
export default {
  name: 'UserEdit',
  // 进入路由前
  beforeRouteEnter(to, from, next) {
    // 在这个守卫中，组件实例还未创建，所以不能访问this
    // 但是可以通过传递回调的方式访问组件实例
    next(vm => {
      // vm就是组件实例
      vm.checkPermission()
    })
  },
  
  // 路由更新时（例如参数变化）
  beforeRouteUpdate(to, from, next) {
    this.fetchData(to.params.id)
    next()
  },
  
  // 离开路由前
  beforeRouteLeave(to, from, next) {
    // 可以询问用户是否确认离开
    if (this.hasUnsavedChanges) {
      if (confirm('Do you want to leave without saving?')) {
        next()
      } else {
        next(false) // 取消导航
      }
    } else {
      next()
    }
  },
  
  data() {
    return {
      hasUnsavedChanges: false
    }
  },
  
  methods: {
    checkPermission() {
      // 检查权限
    },
    fetchData(id) {
      // 获取数据
    }
  }
}
</script>
```

## 实战项目：Vue.js博客系统

让我们创建一个使用Vue.js、Vuex和Vue Router的博客系统，展示Vue.js的高级特性。

### 项目结构

```
vue-blog/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── PostList.vue
│   │   ├── PostItem.vue
│   │   ├── CommentList.vue
│   │   └── CommentForm.vue
│   ├── views/
│   │   ├── Home.vue
│   │   ├── PostDetail.vue
│   │   ├── About.vue
│   │   ├── Login.vue
│   │   └── Dashboard.vue
│   ├── store/
│   │   ├── index.js
│   │   ├── modules/
│   │   │   ├── posts.js
│   │   │   ├── comments.js
│   │   │   └── user.js
│   │   └── getters.js
│   ├── router/
│   │   └── index.js
│   ├── api/
│   │   └── index.js
│   ├── App.vue
│   └── main.js
├── package.json
└── README.md
```

### 实现步骤

#### 1. 创建项目并安装依赖

```bash
npm create vite@latest vue-blog -- --template vue
cd vue-blog
npm install vuex vue-router axios
```

#### 2. 配置路由

```javascript
// src/router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/post/:id',
    name: 'PostDetail',
    component: () => import('../views/PostDetail.vue')
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '*',
    redirect: '/' // 重定向到首页
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isLoggedIn = localStorage.getItem('user') !== null
  
  if (requiresAuth && !isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
```

#### 3. 配置Vuex Store

```javascript
// src/store/modules/user.js
const state = {
  user: null,
  isLoggedIn: false
}

const mutations = {
  SET_USER(state, user) {
    state.user = user
    state.isLoggedIn = !!user
  }
}

const actions = {
  login({ commit }, credentials) {
    // 模拟登录API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = {
          id: 1,
          username: credentials.username,
          email: `${credentials.username}@example.com`
        }
        // 保存到localStorage
        localStorage.setItem('user', JSON.stringify(user))
        commit('SET_USER', user)
        resolve(user)
      }, 500)
    })
  },
  logout({ commit }) {
    localStorage.removeItem('user')
    commit('SET_USER', null)
  },
  checkAuth({ commit }) {
    const user = localStorage.getItem('user')
    if (user) {
      commit('SET_USER', JSON.parse(user))
    }
  }
}

const getters = {
  currentUser: state => state.user,
  isLoggedIn: state => state.isLoggedIn
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

// src/store/modules/posts.js
const state = {
  posts: [],
  currentPost: null,
  loading: false,
  error: null
}

const mutations = {
  SET_POSTS(state, posts) {
    state.posts = posts
  },
  SET_CURRENT_POST(state, post) {
    state.currentPost = post
  },
  ADD_POST(state, post) {
    state.posts.unshift(post)
  },
  UPDATE_POST(state, updatedPost) {
    const index = state.posts.findIndex(p => p.id === updatedPost.id)
    if (index !== -1) {
      state.posts.splice(index, 1, updatedPost)
    }
    if (state.currentPost && state.currentPost.id === updatedPost.id) {
      state.currentPost = updatedPost
    }
  },
  DELETE_POST(state, postId) {
    state.posts = state.posts.filter(p => p.id !== postId)
  },
  SET_LOADING(state, status) {
    state.loading = status
  },
  SET_ERROR(state, error) {
    state.error = error
  }
}

const actions = {
  fetchPosts({ commit }) {
    commit('SET_LOADING', true)
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        const posts = [
          {
            id: 1,
            title: 'Vue.js Basics',
            content: 'Vue.js is a progressive JavaScript framework...',
            author: 'John Doe',
            createdAt: '2023-04-10T10:00:00Z',
            comments: []
          },
          {
            id: 2,
            title: 'Vuex for State Management',
            content: 'Vuex is the official state management library for Vue...',
            author: 'Jane Smith',
            createdAt: '2023-04-11T14:30:00Z',
            comments: []
          }
        ]
        commit('SET_POSTS', posts)
        commit('SET_LOADING', false)
        resolve(posts)
      }, 800)
    })
  },
  fetchPostById({ commit, state }, postId) {
    // 如果已经有这个帖子，直接返回
    const existingPost = state.posts.find(p => p.id === parseInt(postId))
    if (existingPost) {
      commit('SET_CURRENT_POST', existingPost)
      return Promise.resolve(existingPost)
    }
    
    // 否则模拟API调用
    commit('SET_LOADING', true)
    return new Promise((resolve) => {
      setTimeout(() => {
        const post = {
          id: parseInt(postId),
          title: `Post ${postId}`,
          content: `Content for post ${postId}...`,
          author: 'Author Name',
          createdAt: new Date().toISOString(),
          comments: []
        }
        commit('SET_CURRENT_POST', post)
        commit('SET_LOADING', false)
        resolve(post)
      }, 500)
    })
  }
}

const getters = {
  allPosts: state => state.posts,
  currentPost: state => state.currentPost,
  isLoading: state => state.loading
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

// src/store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import posts from './modules/posts'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user,
    posts
  }
})
```

#### 4. 创建主应用组件

```vue
<!-- src/App.vue -->
<template>
  <div id="app">
    <header>
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
        <div class="user-actions">
          <template v-if="isLoggedIn">
            <span class="username">Hello, {{ currentUser.username }}</span>
            <router-link to="/dashboard">Dashboard</router-link>
            <button @click="logout" class="logout-btn">Logout</button>
          </template>
          <template v-else>
            <router-link to="/login">Login</router-link>
          </template>
        </div>
      </nav>
    </header>
    
    <main>
      <router-view />
    </main>
    
    <footer>
      <p>&copy; 2023 Vue Blog. All rights reserved.</p>
    </footer>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'App',
  computed: {
    ...mapState('user', ['user']),
    ...mapGetters('user', ['isLoggedIn', 'currentUser'])
  },
  methods: {
    ...mapActions('user', ['logout'])
  },
  created() {
    // 检查用户是否已登录
    this.$store.dispatch('user/checkAuth')
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
}

#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

header {
  padding: 20px 0;
  border-bottom: 1px solid #ddd;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

nav a {
  margin-right: 20px;
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

nav a:hover {
  color: #42b983;
}

.user-actions {
  display: flex;
  align-items: center;
}

.username {
  margin-right: 20px;
  font-weight: 500;
}

.logout-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #ff4757;
}

main {
  padding: 40px 0;
  min-height: 60vh;
}

footer {
  padding: 20px 0;
  text-align: center;
  border-top: 1px solid #ddd;
  margin-top: 40px;
}
</style>
```

#### 5. 创建首页和文章详情页

```vue
<!-- src/views/Home.vue -->
<template>
  <div class="home">
    <h1>Vue Blog</h1>
    <p>Welcome to our blog platform built with Vue.js</p>
    
    <div v-if="isLoading" class="loading">Loading posts...</div>
    
    <div v-else class="post-list">
      <PostItem 
        v-for="post in allPosts" 
        :key="post.id" 
        :post="post" 
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import PostItem from '../components/PostItem.vue'

export default {
  name: 'Home',
  components: {
    PostItem
  },
  computed: {
    ...mapGetters('posts', ['allPosts', 'isLoading'])
  },
  methods: {
    ...mapActions('posts', ['fetchPosts'])
  },
  created() {
    this.fetchPosts()
  }
}
</script>

<style scoped>
.home {
  text-align: center;
}

.home h1 {
  margin-bottom: 10px;
  color: #2c3e50;
}

.home p {
  margin-bottom: 30px;
  color: #7f8c8d;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.post-list {
  max-width: 800px;
  margin: 0 auto;
}
</style>

<!-- src/components/PostItem.vue -->
<template>
  <div class="post-item">
    <h2><router-link :to="{ name: 'PostDetail', params: { id: post.id } }">{{ post.title }}</router-link></h2>
    <div class="post-meta">
      <span>By {{ post.author }}</span>
      <span>{{ formatDate(post.createdAt) }}</span>
    </div>
    <p class="post-excerpt">{{ getExcerpt(post.content) }}</p>
    <router-link :to="{ name: 'PostDetail', params: { id: post.id } }" class="read-more">Read more</router-link>
  </div>
</template>

<script>
export default {
  name: 'PostItem',
  props: {
    post: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    getExcerpt(content) {
      return content.length > 150 ? content.substring(0, 150) + '...' : content
    }
  }
}
</script>

<style scoped>
.post-item {
  background-color: #fff;
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.post-item h2 {
  margin-bottom: 10px;
}

.post-item h2 a {
  color: #2c3e50;
  text-decoration: none;
}

.post-item h2 a:hover {
  color: #42b983;
}

.post-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  color: #7f8c8d;
  font-size: 14px;
}

.post-excerpt {
  margin-bottom: 15px;
  color: #555;
}

.read-more {
  display: inline-block;
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
}

.read-more:hover {
  text-decoration: underline;
}
</style>

<!-- src/views/PostDetail.vue -->
<template>
  <div class="post-detail">
    <div v-if="isLoading" class="loading">Loading post...</div>
    
    <div v-else-if="currentPost" class="post-content">
      <h1>{{ currentPost.title }}</h1>
      <div class="post-meta">
        <span>By {{ currentPost.author }}</span>
        <span>{{ formatDate(currentPost.createdAt) }}</span>
      </div>
      <div class="content">
        {{ currentPost.content }}
      </div>
      
      <div class="comments-section">
        <h3>Comments</h3>
        <CommentForm @submit="addComment" />
        <CommentList :comments="currentPost.comments || []" />
      </div>
    </div>
    
    <div v-else class="error">Post not found</div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import CommentForm from '../components/CommentForm.vue'
import CommentList from '../components/CommentList.vue'

export default {
  name: 'PostDetail',
  components: {
    CommentForm,
    CommentList
  },
  computed: {
    ...mapGetters('posts', ['currentPost', 'isLoading'])
  },
  methods: {
    ...mapActions('posts', ['fetchPostById']),
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    addComment(commentText) {
      if (!this.currentPost) return
      
      const newComment = {
        id: Date.now(),
        text: commentText,
        author: this.$store.getters['user/currentUser']?.username || 'Anonymous',
        createdAt: new Date().toISOString()
      }
      
      // 更新本地状态（在真实应用中应该调用API）
      const updatedPost = {
        ...this.currentPost,
        comments: [...(this.currentPost.comments || []), newComment]
      }
      
      this.$store.commit('posts/SET_CURRENT_POST', updatedPost)
      this.$store.commit('posts/UPDATE_POST', updatedPost)
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        this.fetchPostById(newId)
      }
    }
  }
}
</script>

<style scoped>
.post-detail {
  max-width: 800px;
  margin: 0 auto;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

.post-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.post-content h1 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.post-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  color: #7f8c8d;
  font-size: 14px;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
}

.content {
  line-height: 1.8;
  margin-bottom: 30px;
  white-space: pre-line;
}

.comments-section {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.comments-section h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}
</style>

<!-- src/components/CommentForm.vue -->
<template>
  <div class="comment-form">
    <h4>Add a comment</h4>
    <textarea 
      v-model="commentText" 
      placeholder="Write your comment..." 
      rows="3"
    ></textarea>
    <button @click="submitComment" :disabled="!commentText.trim()">Submit</button>
  </div>
</template>

<script>
export default {
  name: 'CommentForm',
  data() {
    return {
      commentText: ''
    }
  },
  methods: {
    submitComment() {
      if (this.commentText.trim()) {
        this.$emit('submit', this.commentText.trim())
        this.commentText = ''
      }
    }
  }
}
</script>

<style scoped>
.comment-form {
  margin-bottom: 30px;
}

.comment-form h4 {
  margin-bottom: 10px;
  color: #333;
}

.comment-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: 10px;
  font-family: inherit;
}

.comment-form button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.comment-form button:hover:not(:disabled) {
  background-color: #3aa676;
}

.comment-form button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>

<!-- src/components/CommentList.vue -->
<template>
  <div class="comment-list">
    <div v-if="comments.length === 0" class="no-comments">No comments yet. Be the first to comment!</div>
    
    <div v-for="comment in comments" :key="comment.id" class="comment">
      <div class="comment-header">
        <span class="comment-author">{{ comment.author }}</span>
        <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
      </div>
      <div class="comment-text">{{ comment.text }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CommentList',
  props: {
    comments: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.comment-list {
  margin-top: 20px;
}

.no-comments {
  text-align: center;
  padding: 20px;
  color: #7f8c8d;
  font-style: italic;
}

.comment {
  padding: 15px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 500;
  color: #42b983;
}

.comment-date {
  font-size: 12px;
  color: #7f8c8d;
}

.comment-text {
  line-height: 1.6;
  color: #333;
}
</style>
```

## 总结

本文深入探讨了Vue.js的进阶内容，包括：

1. **组件通信**：通过props、自定义事件、EventBus、provide/inject等多种方式实现组件间数据传递和交互
2. **状态管理**：使用Vuex进行集中式状态管理，包括state、getters、mutations、actions和modules
3. **路由**：使用Vue Router实现单页应用的路由功能，包括路由配置、路由参数、导航守卫等

通过实战项目，我们创建了一个功能完整的博客系统，展示了如何结合Vue.js、Vuex和Vue Router构建现代化的Web应用。这些高级特性是构建复杂Vue应用的基础，掌握它们将帮助你开发出更加健壮、可维护的前端应用。

在下一篇教程中，我们将学习Vue.js的高级特性，如动画和过渡、插件开发、测试等，敬请期待！