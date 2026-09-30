---
title: "前端入门到精通(三)：状态管理、API交互与性能优化"
date: 2025-10-30T09:25:00+08:00
categories:
  - "编程开发"
tags:
  - "前端"
  - "状态管理"
  - "API交互"
  - "性能优化"
  - "Redux"
  - "Vuex"
  - "网络请求"
image: ""
mermaid: false
math: false
license: ""
hidden: false
comments: true
---

# 前端入门到精通(三)：状态管理、API交互与性能优化

## 引言

随着前端应用复杂度的不断提升，我们面临着越来越多的挑战，如复杂状态管理、与后端API的高效交互以及如何优化应用性能等。这些问题如果不能得到很好的解决，将会导致应用代码难以维护、用户体验下降等问题。本文作为前端入门系列的第三篇，将带您深入学习前端状态管理、API交互和性能优化等高级主题，帮助您构建更强大、更高效的前端应用。

## 前端状态管理

### 为什么需要状态管理？

在简单的前端应用中，我们可以使用框架内置的状态管理方式（如React的useState、Vue的data选项等）来管理组件状态。但是，随着应用复杂度的增加，特别是当多个组件需要共享状态、状态更新逻辑变得复杂时，这些简单的状态管理方式就显得力不从心了。

常见的状态管理挑战：

- **状态共享**：多个组件需要访问和修改同一个状态
- **状态更新逻辑复杂**：状态更新依赖于多个因素或需要执行复杂的计算
- **状态变更追踪**：难以追踪状态何时、何处以及为什么被修改
- **组件间通信**：组件层级嵌套过深时，组件间的数据传递变得困难

为了解决这些问题，我们需要专门的状态管理解决方案。

### Redux（React生态）

Redux是一个用于JavaScript应用的可预测状态容器，主要用于React应用的状态管理，但也可以与其他框架结合使用。

#### Redux核心概念

1. **Store**：存储应用的状态树
2. **Actions**：描述发生了什么的纯对象
3. **Reducers**：指定如何根据Actions更新状态的纯函数
4. **Dispatch**：触发Actions的方法
5. **Selectors**：从状态树中提取数据的函数

#### Redux工作流程

1. 用户交互触发Action
2. 通过dispatch()方法分发Action
3. Reducer处理Action并返回新的状态
4. Store更新状态
5. 视图根据新状态重新渲染

#### Redux的安装与基本使用

**安装Redux和React-Redux**：

```bash
npm install redux react-redux @reduxjs/toolkit
```

**基本使用示例**：

1. **创建Redux Store**：

```javascript
// store.js
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});
```

2. **创建Slice**：

```javascript
// counterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  value: 0,
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      // Redux Toolkit允许我们在reducers中直接修改状态
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
    },
  },
});

// 导出actions
export const { increment, decrement, incrementByAmount } = counterSlice.actions;

// 导出reducer
export default counterSlice.reducer;
```

3. **在应用中使用Redux**：

```jsx
// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { store } from './store';
import { Provider } from 'react-redux';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

4. **在组件中使用Redux状态**：

```jsx
// Counter.js
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement, incrementByAmount } from './counterSlice';

function Counter() {
  // 从Redux store中获取状态
  const count = useSelector((state) => state.counter.value);
  // 获取dispatch函数
  const dispatch = useDispatch();

  return (
    <div>
      <div>
        <button
          aria-label="Increment value"
          onClick={() => dispatch(increment())}
        >
          +
        </button>
        <span>{count}</span>
        <button
          aria-label="Decrement value"
          onClick={() => dispatch(decrement())}
        >
          -
        </button>
        <button
          onClick={() => dispatch(incrementByAmount(5))}
        >
          +5
        </button>
      </div>
    </div>
  );
}

export default Counter;
```

### Vuex（Vue生态）

Vuex是Vue.js官方的状态管理库，它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。

#### Vuex核心概念

1. **State**：存储应用状态的对象
2. **Getters**：从State中派生出的计算属性
3. **Mutations**：更改State的唯一方法，必须是同步函数
4. **Actions**：提交Mutations而不是直接变更状态，可以包含异步操作
5. **Modules**：将store分割成模块化，每个模块拥有自己的state、mutations、actions、getters

#### Vuex的安装与基本使用

**安装Vuex**：

```bash
npm install vuex@next --save  # Vue 3
# 或
npm install vuex@3 --save  # Vue 2
```

**基本使用示例**：

1. **创建Vuex Store**：

```javascript
// store/index.js
import { createStore } from 'vuex'

export default createStore({
  state: {
    count: 0
  },
  getters: {
    doubleCount: (state) => {
      return state.count * 2
    }
  },
  mutations: {
    increment (state) {
      state.count++
    },
    decrement (state) {
      state.count--
    },
    incrementByAmount (state, amount) {
      state.count += amount
    }
  },
  actions: {
    incrementAsync ({ commit }) {
      setTimeout(() => {
        commit('increment')
      }, 1000)
    },
    incrementByAmountAsync ({ commit }, amount) {
      setTimeout(() => {
        commit('incrementByAmount', amount)
      }, 1000)
    }
  },
  modules: {
    // 可以在这里定义子模块
  }
})
```

2. **在应用中使用Vuex**：

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import store from './store'

createApp(App).use(store).mount('#app')
```

3. **在组件中使用Vuex状态**：

```vue
<!-- Counter.vue -->
<template>
  <div>
    <div>
      <button @click="increment">+</button>
      <span>{{ count }}</span>
      <span>（翻倍：{{ doubleCount }}）</span>
      <button @click="decrement">-</button>
      <button @click="incrementByAmount(5)">+5</button>
      <button @click="incrementAsync">异步+</button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  name: 'Counter',
  computed: {
    ...mapState(['count']),
    ...mapGetters(['doubleCount'])
  },
  methods: {
    ...mapMutations(['increment', 'decrement', 'incrementByAmount']),
    ...mapActions(['incrementAsync'])
  }
}
</script>
```

或者在Vue 3组合式API中使用：

```vue
<!-- Counter.vue -->
<template>
  <div>
    <div>
      <button @click="increment">+</button>
      <span>{{ count }}</span>
      <span>（翻倍：{{ doubleCount }}）</span>
      <button @click="decrement">-</button>
      <button @click="incrementByAmount(5)">+5</button>
      <button @click="incrementAsync">异步+</button>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'Counter',
  setup() {
    const store = useStore()
    
    // 计算属性
    const count = computed(() => store.state.count)
    const doubleCount = computed(() => store.getters.doubleCount)
    
    // 方法
    const increment = () => store.commit('increment')
    const decrement = () => store.commit('decrement')
    const incrementByAmount = (amount) => store.commit('incrementByAmount', amount)
    const incrementAsync = () => store.dispatch('incrementAsync')
    
    return {
      count,
      doubleCount,
      increment,
      decrement,
      incrementByAmount,
      incrementAsync
    }
  }
}
</script>
```

### Pinia（Vue 3推荐）

Pinia是Vue团队推荐的新一代状态管理库，为Vue 3设计，同时也兼容Vue 2。Pinia相比Vuex更加简单、类型安全，并且移除了mutations的概念。

#### Pinia的安装与基本使用

**安装Pinia**：

```bash
npm install pinia
```

**基本使用示例**：

1. **创建Pinia实例**：

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

2. **定义Store**：

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // 状态
  state: () => ({
    count: 0
  }),
  // 计算属性
  getters: {
    doubleCount: (state) => state.count * 2
  },
  // 操作（可以包含异步操作）
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    incrementByAmount(amount) {
      this.count += amount
    },
    async incrementAsync() {
      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.count++
    }
  }
})
```

3. **在组件中使用Store**：

```vue
<!-- Counter.vue -->
<template>
  <div>
    <div>
      <button @click="increment">+</button>
      <span>{{ count }}</span>
      <span>（翻倍：{{ doubleCount }}）</span>
      <button @click="decrement">-</button>
      <button @click="incrementByAmount(5)">+5</button>
      <button @click="incrementAsync">异步+</button>
    </div>
  </div>
</template>

<script>
import { useCounterStore } from '@/stores/counter'

export default {
  name: 'Counter',
  setup() {
    const counter = useCounterStore()
    
    return {
      // 直接从store中解构出状态和方法
      count: counter.count,
      doubleCount: counter.doubleCount,
      increment: counter.increment,
      decrement: counter.decrement,
      incrementByAmount: counter.incrementByAmount,
      incrementAsync: counter.incrementAsync
    }
  }
}
</script>
```

### 状态管理最佳实践

1. **状态的粒度控制**：不要把所有状态都放在全局状态管理中，只将需要在多个组件间共享的状态放在全局store中
2. **遵循单向数据流**：状态的流动应该是单向的，从store流向组件
3. **模块化**：对于大型应用，使用模块化结构来组织状态
4. **状态持久化**：对于需要持久化的状态（如用户登录状态），可以结合localStorage或sessionStorage实现
5. **避免过度使用**：简单的应用可能不需要专门的状态管理库，框架内置的状态管理可能已经足够

## API交互

在现代前端应用中，与后端API的交互是必不可少的。前端应用需要从后端获取数据、提交数据、更新数据等。本节将介绍前端API交互的各种方法和最佳实践。

### Fetch API

Fetch API是浏览器内置的用于发起网络请求的API，它提供了一个更现代、更强大、更灵活的替代XMLHttpRequest的方式。

#### 基本用法

```javascript
// 基本GET请求
fetch('https://api.example.com/users')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log(data);
  })
  .catch(error => {
    console.error('There was a problem with the fetch operation:', error);
  });

// POST请求
fetch('https://api.example.com/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '张三',
    email: 'zhangsan@example.com'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

#### 使用async/await

使用async/await可以使异步代码看起来更像同步代码，使代码更易于理解和维护。

```javascript
async function fetchUsers() {
  try {
    const response = await fetch('https://api.example.com/users');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
}

// 调用函数
fetchUsers();
```

### Axios

Axios是一个基于Promise的HTTP客户端，用于浏览器和Node.js环境。它提供了许多方便的特性，如请求/响应拦截、错误处理、取消请求等，是目前前端开发中最流行的HTTP客户端之一。

#### 安装与基本使用

**安装Axios**：

```bash
npm install axios
```

**基本用法**：

```javascript
import axios from 'axios';

// 基本GET请求
axios.get('https://api.example.com/users')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });

// POST请求
axios.post('https://api.example.com/users', {
  name: '张三',
  email: 'zhangsan@example.com'
})
.then(response => {
  console.log(response.data);
})
.catch(error => {
  console.error('Error:', error);
});

// 使用async/await
async function fetchUsers() {
  try {
    const response = await axios.get('https://api.example.com/users');
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

#### 创建Axios实例

对于大型应用，我们通常会创建一个配置好的Axios实例，以便在整个应用中复用相同的配置。

```javascript
// api.js
import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    // 处理错误
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，重定向到登录页面
          window.location.href = '/login';
          break;
        case 403:
          // 禁止访问
          console.error('没有权限访问该资源');
          break;
        case 404:
          // 资源不存在
          console.error('请求的资源不存在');
          break;
        case 500:
          // 服务器错误
          console.error('服务器错误');
          break;
        default:
          console.error('请求失败');
      }
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('网络错误，请检查您的网络连接');
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
```

**使用创建的实例**：

```javascript
import api from './api';

// GET请求
async function fetchUsers() {
  try {
    const data = await api.get('/users');
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// POST请求
async function createUser(userData) {
  try {
    const data = await api.post('/users', userData);
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### 跨域资源共享（CORS）

在前端开发中，我们经常会遇到跨域问题。跨域是指从一个域的网页去请求另一个域的资源，由于浏览器的同源策略，默认情况下跨域请求是被禁止的。

#### 什么是同源策略？

同源策略是浏览器的一个安全特性，它限制了一个源（origin）的文档或者它加载的脚本如何能与另一个源的资源进行交互。同源是指协议、域名和端口都相同。

#### 解决跨域问题的方法

##### 1. 后端配置CORS

后端服务器通过设置适当的HTTP头来允许跨域请求，这是最常用也是最推荐的方法。

例如，在Express.js中：

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// 允许所有来源的跨域请求
app.use(cors());

// 或者配置特定的来源
app.use(cors({
  origin: 'http://localhost:3000', // 只允许这个域名的请求
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 其他路由和中间件
// ...

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
```

##### 2. 代理服务器

在开发环境中，可以使用代理服务器来转发请求，从而避免跨域问题。

**在Create React App中配置代理**：

在`package.json`中添加：

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "proxy": "http://localhost:3001",
  // ...
}
```

**在Vue CLI中配置代理**：

在`vue.config.js`中添加：

```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
}
```

##### 3. JSONP

JSONP是一种利用script标签没有跨域限制的特性来实现跨域数据获取的方法。但是JSONP只支持GET请求，并且存在安全风险，现在已经不太推荐使用。

```javascript
function fetchData(callbackName) {
  const script = document.createElement('script');
  script.src = `http://api.example.com/data?callback=${callbackName}`;
  document.body.appendChild(script);
}

window.handleResponse = function(data) {
  console.log(data);
  // 处理返回的数据
};

fetchData('handleResponse');
```

### GraphQL

GraphQL是一种用于API的查询语言，也是一个满足你数据查询的运行时。GraphQL提供了一种更高效、更强大和更灵活的API交互方式。

与REST API相比，GraphQL允许客户端精确指定它需要的数据，避免了过度获取或获取不足的问题，减少了网络请求的次数。

#### Apollo Client

Apollo Client是一个功能强大的JavaScript GraphQL客户端，可以与React、Vue等前端框架集成。

**安装Apollo Client**：

```bash
npm install @apollo/client graphql
```

**基本使用示例（React）**：

1. **设置Apollo Client**：

```javascript
// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'https://api.example.com/graphql',
  cache: new InMemoryCache()
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
```

2. **在组件中使用Apollo Client**：

```jsx
import { useQuery, gql } from '@apollo/client';

// 定义GraphQL查询
const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
    }
  }
`;

function UserList() {
  const { loading, error, data } = useQuery(GET_USERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.users.map(user => (
        <li key={user.id}>
          {user.name} ({user.email})
        </li>
      ))}
    </ul>
  );
}
```

## 前端性能优化

前端性能优化是构建高质量Web应用的关键一环。良好的性能可以提升用户体验、增加用户留存率、提高搜索引擎排名等。本节将介绍前端性能优化的各种方法和最佳实践。

### 性能测量

在进行性能优化之前，我们需要先了解应用的当前性能状况。以下是一些常用的性能测量工具和方法。

#### 浏览器开发者工具

现代浏览器的开发者工具提供了强大的性能分析功能。

- **Performance面板**：记录和分析页面运行时的性能
- **Network面板**：监控网络请求和响应时间
- **Lighthouse**：Google提供的自动化工具，可以评估网页质量并提供优化建议

#### 核心Web指标

Core Web Vitals是Google定义的一组关键性能指标，用于衡量用户体验的三个核心方面：加载性能、交互性和视觉稳定性。

1. **Largest Contentful Paint (LCP)**：最大内容绘制，测量页面主要内容加载的速度，理想值为2.5秒或更短
2. **First Input Delay (FID)**：首次输入延迟，测量页面响应第一次用户交互的时间，理想值为100毫秒或更短
3. **Cumulative Layout Shift (CLS)**：累积布局偏移，测量页面元素意外移动的程度，理想值为0.1或更低

### 网络优化

#### 减少HTTP请求数量

HTTP请求是Web性能的主要瓶颈之一，减少请求数量可以显著提高页面加载速度。

1. **合并文件**：将多个CSS或JavaScript文件合并成一个
2. **CSS Sprites**：将多个小图片合并到一个大图片中，通过CSS的background-position来显示不同的部分
3. **使用字体图标**：代替图片图标，减少请求数量和文件大小
4. **内联关键CSS**：将关键CSS直接内联到HTML中，避免额外的请求

#### 减少资源大小

减少资源大小可以减少下载时间和带宽消耗。

1. **压缩JavaScript**：使用UglifyJS、Terser等工具压缩JavaScript代码
2. **压缩CSS**：使用csso、clean-css等工具压缩CSS代码
3. **压缩HTML**：移除HTML中的空格、注释等不必要的字符
4. **图片优化**：
   - 使用适当的图片格式（JPEG、PNG、WebP等）
   - 使用工具压缩图片（如TinyPNG、ImageOptim等）
   - 使用响应式图片（srcset和sizes属性）
   - 懒加载图片
5. **使用WebP格式**：WebP是一种现代图片格式，比JPEG和PNG更小，同时保持相同的视觉质量

#### 利用缓存

合理利用缓存可以减少重复的网络请求，提高页面加载速度。

1. **HTTP缓存**：通过设置适当的Cache-Control、Expires、ETag等HTTP头来控制浏览器缓存
2. **Service Worker缓存**：使用Service Worker实现离线缓存和资源预加载
3. **本地存储**：使用localStorage、sessionStorage存储一些不常变化的数据

#### 延迟加载（Lazy Loading）

延迟加载是指在需要时才加载资源，而不是在页面初始加载时就加载所有资源。

1. **图片懒加载**：只在图片进入视口时才加载
   
   ```html
   <img loading="lazy" src="image.jpg" alt="示例图片">
   ```

2. **组件懒加载**：在需要时才加载组件

   **React中的懒加载**：
   ```jsx
   import React, { lazy, Suspense } from 'react';

   const LazyComponent = lazy(() => import('./LazyComponent'));

   function App() {
     return (
       <div>
         <Suspense fallback={<div>Loading...</div>}>
           <LazyComponent />
         </Suspense>
       </div>
     );
   }
   ```

   **Vue中的懒加载**：
   ```javascript
   const LazyComponent = () => import('./LazyComponent.vue');
   
   const routes = [
     {
       path: '/lazy',
       component: LazyComponent
     }
   ];
   ```

3. **代码分割**：将代码分割成小块，按需加载

### 渲染优化

#### 虚拟DOM和高效渲染

虚拟DOM是React、Vue等框架使用的一种技术，它是对真实DOM的轻量级JavaScript表示。通过虚拟DOM，这些框架可以最小化DOM操作，提高渲染性能。

1. **React中的渲染优化**：
   - 使用React.memo避免不必要的重新渲染
   - 使用useMemo和useCallback优化性能
   - 避免在render方法中创建新函数和对象

   ```jsx
   import React, { useMemo, useCallback } from 'react';

   // 使用React.memo优化组件
   const MemoizedComponent = React.memo(({ value }) => {
     console.log('Rendering MemoizedComponent');
     return <div>{value}</div>;
   });

   function ParentComponent() {
     const [count, setCount] = React.useState(0);
     const [text, setText] = React.useState('');
     
     // 使用useMemo缓存计算结果
     const expensiveValue = useMemo(() => {
       console.log('Computing expensive value');
       return count * 2;
     }, [count]);
     
     // 使用useCallback缓存函数
     const handleClick = useCallback(() => {
       console.log('Button clicked');
     }, []);
     
     return (
       <div>
         <button onClick={() => setCount(count + 1)}>Increment</button>
         <input value={text} onChange={(e) => setText(e.target.value)} />
         <MemoizedComponent value={expensiveValue} />
         <button onClick={handleClick}>Click Me</button>
       </div>
     );
   }
   ```

2. **Vue中的渲染优化**：
   - 使用v-once避免重复渲染
   - 使用v-memo有条件地跳过组件更新
   - 使用keep-alive缓存组件实例

   ```vue
   <template>
     <div>
       <!-- 使用v-once标记只渲染一次的内容 -->
       <div v-once>这个内容只会渲染一次: {{ staticValue }}</div>
       
       <!-- 使用v-memo有条件地跳过更新 -->
       <div v-memo="[valueA, valueB]">
         只有当valueA或valueB改变时才会重新渲染
       </div>
       
       <!-- 使用keep-alive缓存组件实例 -->
       <keep-alive>
         <component :is="currentComponent" />
       </keep-alive>
     </div>
   </template>
   ```

#### CSS优化

CSS对页面渲染性能有很大影响，以下是一些CSS优化技巧。

1. **简化选择器**：复杂的CSS选择器会增加浏览器的计算负担
2. **避免使用昂贵的属性**：如box-shadow、border-radius等可能会导致性能问题
3. **使用CSS动画代替JavaScript动画**：CSS动画通常比JavaScript动画性能更好
4. **使用CSS变量**：方便主题切换和维护
5. **避免阻塞渲染的CSS**：将关键CSS内联到HTML中，非关键CSS异步加载

#### JavaScript优化

JavaScript的执行会阻塞浏览器的主线程，影响用户交互，以下是一些JavaScript优化技巧。

1. **减少DOM操作**：DOM操作是昂贵的，应该尽量减少
2. **避免不必要的计算**：缓存计算结果，避免重复计算
3. **使用Web Workers**：将耗时的计算移到后台线程
4. **避免内存泄漏**：及时清理不再使用的事件监听器、定时器等
5. **使用事件委托**：对于大量相似元素，使用事件委托代替为每个元素添加事件监听器

### 构建优化

#### 代码分割

代码分割是将代码拆分成更小的块，然后按需加载的技术。这可以减少初始加载时间，提高应用性能。

1. **Webpack中的代码分割**：
   ```javascript
   // webpack.config.js
   module.exports = {
     // ...
     optimization: {
       splitChunks: {
         chunks: 'all',
         cacheGroups: {
           vendor: {
             test: /[\\/]node_modules[\\/]/,
             name(module) {
               // 获取包名
               const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
               return `npm.${packageName.replace('@', '')}`;
             }
           }
         }
       }
     }
   };
   ```

2. **动态导入**：
   ```javascript
   // 动态导入模块
   import('./heavy-module.js')
     .then(module => {
       // 使用模块
       module.doSomething();
     })
     .catch(error => {
       console.error('加载模块失败:', error);
     });
   ```

#### 树摇（Tree Shaking）

树摇是一种优化技术，用于移除JavaScript代码中未使用的部分。现代打包工具如Webpack、Rollup等都支持树摇。

要启用树摇，需要确保代码是ESM（ECMAScript模块）格式，并且没有副作用。

```javascript
// package.json
{
  "name": "my-app",
  "sideEffects": ["*.css", "**/*.css", "src/setupProxy.js"], // 标记有副作用的文件
  // ...
}
```

#### 预加载和预连接

使用HTML的预加载和预连接功能可以提前加载关键资源，提高页面性能。

```html
<!-- 预加载关键CSS -->
<link rel="preload" href="critical.css" as="style">

<!-- 预加载字体 -->
<link rel="preload" href="font.woff2" as="font" type="font/woff2" crossorigin>

<!-- 预连接到重要的第三方域名 -->
<link rel="preconnect" href="https://api.example.com">

<!-- 预加载关键JavaScript -->
<link rel="preload" href="critical.js" as="script">
```

## 实践项目：构建一个天气应用

现在，让我们结合前面所学的知识，构建一个天气应用，实践状态管理、API交互和性能优化等技术。

### 项目概述

我们将构建一个天气应用，它可以：
1. 显示用户当前位置的天气信息
2. 允许用户搜索其他城市的天气
3. 显示未来几天的天气预报
4. 保存用户的搜索历史

### 技术栈

- React（前端框架）
- Redux Toolkit（状态管理）
- Axios（API请求）
- OpenWeatherMap API（天气数据）
- CSS Modules（样式）

### 项目结构

```
weather-app/
├── public/
├── src/
│   ├── components/
│   │   ├── WeatherCard.js
│   │   ├── ForecastList.js
│   │   ├── SearchBar.js
│   │   ├── HistoryList.js
│   │   └── LoadingSpinner.js
│   ├── features/
│   │   ├── weather/
│   │   │   └── weatherSlice.js
│   │   └── history/
│   │       └── historySlice.js
│   ├── services/
│   │   └── weatherAPI.js
│   ├── utils/
│   │   └── formatters.js
│   ├── App.js
│   ├── index.js
│   └── store.js
├── package.json
└── README.md
```

### 实现步骤

#### 1. 创建项目

使用Create React App创建项目：

```bash
npx create-react-app weather-app
cd weather-app
```

#### 2. 安装依赖

```bash
npm install @reduxjs/toolkit react-redux axios
```

#### 3. 设置Redux Store

创建`src/store.js`文件：

```javascript
import { configureStore } from '@reduxjs/toolkit';
import weatherReducer from './features/weather/weatherSlice';
import historyReducer from './features/history/historySlice';

export const store = configureStore({
  reducer: {
    weather: weatherReducer,
    history: historyReducer,
  },
});
```

#### 4. 创建Weather Slice

创建`src/features/weather/weatherSlice.js`文件：

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCurrentWeather, fetchForecast } from '../../services/weatherAPI';

export const getCurrentWeather = createAsyncThunk(
  'weather/getCurrentWeather',
  async (location, { rejectWithValue }) => {
    try {
      const data = await fetchCurrentWeather(location);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getForecast = createAsyncThunk(
  'weather/getForecast',
  async (location, { rejectWithValue }) => {
    try {
      const data = await fetchForecast(location);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  current: null,
  forecast: null,
  loading: false,
  error: null,
  location: '',
};

const weatherSlice = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    setLocation: (state, action) => {
      state.location = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getCurrentWeather cases
      .addCase(getCurrentWeather.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentWeather.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getCurrentWeather.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // getForecast cases
      .addCase(getForecast.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getForecast.fulfilled, (state, action) => {
        state.loading = false;
        state.forecast = action.payload;
      })
      .addCase(getForecast.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setLocation, clearError } = weatherSlice.actions;

export default weatherSlice.reducer;
```

#### 5. 创建History Slice

创建`src/features/history/historySlice.js`文件：

```javascript
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: JSON.parse(localStorage.getItem('weatherSearchHistory') || '[]'),
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    addSearch: (state, action) => {
      // 避免重复项
      const exists = state.items.some(item => 
        item.city.toLowerCase() === action.payload.city.toLowerCase()
      );
      
      if (!exists) {
        // 添加到开头
        state.items.unshift(action.payload);
        // 只保留最近10条记录
        if (state.items.length > 10) {
          state.items = state.items.slice(0, 10);
        }
        // 保存到localStorage
        localStorage.setItem('weatherSearchHistory', JSON.stringify(state.items));
      }
    },
    removeSearch: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      localStorage.setItem('weatherSearchHistory', JSON.stringify(state.items));
    },
    clearHistory: (state) => {
      state.items = [];
      localStorage.removeItem('weatherSearchHistory');
    },
  },
});

export const { addSearch, removeSearch, clearHistory } = historySlice.actions;

export default historySlice.reducer;
```

#### 6. 创建Weather API服务

创建`src/services/weatherAPI.js`文件：

```javascript
import axios from 'axios';

// 替换为你的API密钥
const API_KEY = 'your_api_key_here';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  params: {
    appid: API_KEY,
    units: 'metric', // 使用摄氏度
    lang: 'zh_cn', // 使用中文
  },
});

// 获取当前天气
export const fetchCurrentWeather = async (location) => {
  const params = typeof location === 'string' 
    ? { q: location } 
    : { lat: location.lat, lon: location.lon };
  
  const response = await api.get('/weather', { params });
  return response.data;
};

// 获取天气预报
export const fetchForecast = async (location) => {
  const params = typeof location === 'string' 
    ? { q: location } 
    : { lat: location.lat, lon: location.lon };
  
  const response = await api.get('/forecast', { params });
  return response.data;
};

// 获取用户当前位置的坐标
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持地理定位'));
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error('获取位置失败'));
      }
    );
  });
};
```

#### 7. 创建组件

创建`src/components/LoadingSpinner.js`文件：

```jsx
import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner() {
  return <div className="loading-spinner"></div>;
}

export default LoadingSpinner;
```

创建`src/components/LoadingSpinner.css`文件：

```css
.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 20px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

创建`src/components/WeatherCard.js`文件：

```jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { formatTemp, formatDate, getWeatherIconUrl } from '../utils/formatters';
import './WeatherCard.css';

function WeatherCard() {
  const { current, loading, error } = useSelector((state) => state.weather);

  if (loading) return <div className="weather-card loading">加载中...</div>;
  if (error) return <div className="weather-card error">错误: {error}</div>;
  if (!current) return <div className="weather-card empty">请搜索城市或允许获取您的位置</div>;

  return (
    <div className="weather-card">
      <div className="weather-header">
        <h2 className="city-name">{current.name}</h2>
        <p className="date">{formatDate(current.dt)}</p>
      </div>
      
      <div className="weather-main">
        <div className="weather-icon">
          <img 
            src={getWeatherIconUrl(current.weather[0].icon)} 
            alt={current.weather[0].description}
          />
        </div>
        <div className="temp-info">
          <div className="current-temp">{formatTemp(current.main.temp)}</div>
          <div className="weather-description">
            {current.weather[0].description}
          </div>
        </div>
      </div>
      
      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">体感温度</span>
          <span className="detail-value">{formatTemp(current.main.feels_like)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">湿度</span>
          <span className="detail-value">{current.main.humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">风速</span>
          <span className="detail-value">{current.wind.speed} m/s</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">气压</span>
          <span className="detail-value">{current.main.pressure} hPa</span>
        </div>
      </div>
    </div>
  );
}

export default WeatherCard;
```

创建`src/components/WeatherCard.css`文件：

```css
.weather-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.weather-header {
  text-align: center;
  margin-bottom: 20px;
}

.city-name {
  font-size: 28px;
  margin: 0 0 8px 0;
}

.date {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.weather-icon img {
  width: 100px;
  height: 100px;
}

.temp-info {
  text-align: center;
}

.current-temp {
  font-size: 48px;
  font-weight: 300;
  margin-bottom: 8px;
}

.weather-description {
  font-size: 18px;
  text-transform: capitalize;
}

.weather-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.detail-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.detail-label {
  display: block;
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 18px;
  font-weight: 500;
}

.loading, .error, .empty {
  text-align: center;
  padding: 40px 20px;
  font-size: 18px;
}
```

创建`src/components/ForecastList.js`文件：

```jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { formatTemp, formatDate, getWeatherIconUrl } from '../utils/formatters';
import './ForecastList.css';

function ForecastList() {
  const { forecast } = useSelector((state) => state.weather);

  if (!forecast) return null;

  // 按天分组，只显示每天的一个预报（例如中午12点）
  const dailyForecast = [];
  const dayMap = new Map();

  forecast.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();
    
    // 选择每天中午12点左右的预报，或者第一个预报
    if (!dayMap.has(dayKey) || Math.abs(date.getHours() - 12) < Math.abs(new Date(dayMap.get(dayKey) * 1000).getHours() - 12)) {
      dayMap.set(dayKey, item.dt);
      dailyForecast.push(item);
    }
  });

  // 只显示未来5天的预报
  const nextFiveDays = dailyForecast.slice(0, 5);

  return (
    <div className="forecast-list">
      <h3>未来5天预报</h3>
      <div className="forecast-items">
        {nextFiveDays.map((item, index) => (
          <div className="forecast-item" key={index}>
            <div className="forecast-date">{formatDate(item.dt, 'short')}</div>
            <div className="forecast-icon">
              <img 
                src={getWeatherIconUrl(item.weather[0].icon)} 
                alt={item.weather[0].description}
              />
            </div>
            <div className="forecast-desc">{item.weather[0].description}</div>
            <div className="forecast-temp">
              <span className="max-temp">{formatTemp(item.main.temp_max)}</span>
              <span className="min-temp">{formatTemp(item.main.temp_min)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ForecastList;
```

创建`src/components/ForecastList.css`文件：

```css
.forecast-list {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.forecast-list h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
}

.forecast-items {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 10px;
}

.forecast-item {
  flex: 0 0 120px;
  text-align: center;
  padding: 16px 12px;
  background-color: #f8f9fa;
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.forecast-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.forecast-date {
  font-size: 14px;
  font-weight: 500;
  color: #555;
  margin-bottom: 12px;
}

.forecast-icon img {
  width: 60px;
  height: 60px;
  margin-bottom: 8px;
}

.forecast-desc {
  font-size: 12px;
  color: #777;
  margin-bottom: 12px;
  text-transform: capitalize;
}

.forecast-temp {
  display: flex;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.max-temp {
  font-weight: 600;
  color: #333;
}

.min-temp {
  color: #777;
}
```

创建`src/components/SearchBar.js`文件：

```jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentWeather, getForecast, setLocation, clearError } from '../features/weather/weatherSlice';
import { addSearch } from '../features/history/historySlice';
import { getCurrentLocation } from '../services/weatherAPI';
import './SearchBar.css';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.weather);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    dispatch(clearError());
    dispatch(setLocation(searchTerm));
    
    // 并行请求当前天气和预报
    try {
      const currentWeather = await dispatch(getCurrentWeather(searchTerm)).unwrap();
      await dispatch(getForecast(searchTerm)).unwrap();
      
      // 添加到搜索历史
      dispatch(addSearch({
        id: Date.now(),
        city: currentWeather.name,
        country: currentWeather.sys.country,
        date: new Date().toISOString()
      }));
    } catch (error) {
      // 错误已经在slice中处理
    }
    
    setSearchTerm('');
  };

  const handleLocationClick = async () => {
    try {
      dispatch(clearError());
      const location = await getCurrentLocation();
      
      // 并行请求当前天气和预报
      await Promise.all([
        dispatch(getCurrentWeather(location)),
        dispatch(getForecast(location))
      ]);
    } catch (error) {
      dispatch(getCurrentWeather.rejected(error.message));
    }
  };

  return (
    <div className="search-bar">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="输入城市名称..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading}
          className="search-input"
        />
        <button 
          type="submit" 
          disabled={loading || !searchTerm.trim()}
          className="search-button"
        >
          {loading ? '搜索中...' : '搜索'}
        </button>
      </form>
      <button 
        onClick={handleLocationClick}
        disabled={loading}
        className="location-button"
        title="使用当前位置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </button>
    </div>
  );
}

export default SearchBar;
```

创建`src/components/SearchBar.css`文件：

```css
.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.search-bar form {
  flex: 1;
  display: flex;
  gap: 0;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  font-size: 16px;
  border: 2px solid #ddd;
  border-radius: 8px 0 0 8px;
  outline: none;
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: #667eea;
}

.search-button {
  padding: 12px 24px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-button:hover:not(:disabled) {
  background-color: #5a5fd8;
}

.search-button:disabled {
  background-color: #a0a4e6;
  cursor: not-allowed;
}

.location-button {
  padding: 12px;
  background-color: #f8f9fa;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s;
}

.location-button:hover:not(:disabled) {
  background-color: #e9ecef;
  border-color: #ccc;
}

.location-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

创建`src/components/HistoryList.js`文件：

```jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeSearch, clearHistory } from '../features/history/historySlice';
import { getCurrentWeather, getForecast, setLocation } from '../features/weather/weatherSlice';
import './HistoryList.css';

function HistoryList() {
  const { items } = useSelector((state) => state.history);
  const dispatch = useDispatch();

  if (items.length === 0) return null;

  const handleItemClick = async (item) => {
    const location = `${item.city},${item.country}`;
    dispatch(setLocation(location));
    
    // 并行请求当前天气和预报
    await Promise.all([
      dispatch(getCurrentWeather(location)),
      dispatch(getForecast(location))
    ]);
  };

  const handleRemoveItem = (id) => {
    dispatch(removeSearch(id));
  };

  const handleClearAll = () => {
    if (window.confirm('确定要清除所有搜索历史吗？')) {
      dispatch(clearHistory());
    }
  };

  return (
    <div className="history-list">
      <div className="history-header">
        <h3>搜索历史</h3>
        <button onClick={handleClearAll} className="clear-button">
          清除
        </button>
      </div>
      <ul className="history-items">
        {items.map((item) => (
          <li key={item.id} className="history-item">
            <button 
              className="history-item-button" 
              onClick={() => handleItemClick(item)}
            >
              {item.city}, {item.country}
            </button>
            <button 
              className="remove-button" 
              onClick={() => handleRemoveItem(item.id)}
              title="删除"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default HistoryList;
```

创建`src/components/HistoryList.css`文件：

```css
.history-list {
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.history-header h3 {
  color: #333;
  margin: 0;
  font-size: 20px;
}

.clear-button {
  padding: 6px 12px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-button:hover {
  background-color: #d32f2f;
}

.history-items {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.history-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.history-item-button {
  flex: 1;
  padding: 10px 16px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  text-align: left;
  transition: all 0.3s;
}

.history-item-button:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.remove-button {
  width: 30px;
  height: 30px;
  margin-left: 12px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.remove-button:hover {
  background-color: #d32f2f;
}
```

#### 8. 创建工具函数

创建`src/utils/formatters.js`文件：

```javascript
// 格式化温度
export function formatTemp(temp) {
  return `${Math.round(temp)}°C`;
}

// 格式化日期
export function formatDate(timestamp, format = 'full') {
  const date = new Date(timestamp * 1000);
  
  if (format === 'short') {
    // 短格式：Mon, 22
    return date.toLocaleDateString('zh-CN', {
      weekday: 'short',
      day: 'numeric'
    });
  } else {
    // 长格式：2023年6月22日 星期四
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }
}

// 获取天气图标URL
export function getWeatherIconUrl(iconCode) {
  return `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
```

#### 9. 创建主App组件

修改`src/App.js`文件：

```jsx
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getCurrentWeather, getForecast } from './features/weather/weatherSlice';
import { getCurrentLocation } from './services/weatherAPI';
import WeatherCard from './components/WeatherCard';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import HistoryList from './components/HistoryList';
import './App.css';

function App() {
  const dispatch = useDispatch();

  // 页面加载时，尝试获取用户当前位置的天气
  useEffect(() => {
    const fetchLocationWeather = async () => {
      try {
        const location = await getCurrentLocation();
        // 并行请求当前天气和预报
        await Promise.all([
          dispatch(getCurrentWeather(location)),
          dispatch(getForecast(location))
        ]);
      } catch (error) {
        console.log('无法获取位置或天气数据，使用默认城市');
        // 使用默认城市（例如北京）
        const defaultLocation = 'Beijing,CN';
        await Promise.all([
          dispatch(getCurrentWeather(defaultLocation)),
          dispatch(getForecast(defaultLocation))
        ]);
      }
    };

    fetchLocationWeather();
  }, [dispatch]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>天气预报</h1>
      </header>
      <main className="app-main">
        <SearchBar />
        <WeatherCard />
        <div className="app-bottom">
          <div className="app-left">
            <ForecastList />
          </div>
          <div className="app-right">
            <HistoryList />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;`;

修改`src/App.css`文件：

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 32px;
}

.app-header h1 {
  font-size: 36px;
  color: #333;
  font-weight: 700;
}

.app-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.app-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .app-bottom {
    grid-template-columns: 1fr;
  }
}

.app-left,
.app-right {
  width: 100%;
}
```

#### 10. 更新index.js文件

修改`src/index.js`文件：

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

### 性能优化要点

在这个天气应用中，我们应用了多种性能优化技术：

1. **代码分割**：使用动态导入分割代码块，减小初始加载体积
2. **状态管理优化**：使用Redux Toolkit的createAsyncThunk和适当的状态结构管理复杂状态
3. **网络请求优化**：
   - 使用axios拦截器统一处理请求/响应
   - 并行请求当前天气和预报数据
   - 缓存搜索历史到localStorage
4. **组件性能优化**：
   - 使用条件渲染避免不必要的DOM操作
   - 适当的组件拆分和组合
5. **响应式设计**：适配不同屏幕尺寸

## 总结

本文介绍了前端状态管理、API交互和性能优化三个重要方面的知识。通过学习Redux、Vuex、Pinia等状态管理库，我们可以更好地管理复杂应用的状态；通过学习Fetch API、Axios等工具，我们可以高效地与后端API交互；通过学习各种性能优化技术，我们可以构建更快速、更流畅的用户体验。

在实践项目中，我们将这些知识应用到了一个天气应用的开发中，实现了状态管理、API交互和性能优化的结合。通过这个项目，我们可以看到这些技术如何协同工作，构建一个功能完整、性能良好的前端应用。

前端开发是一个不断发展的领域，新的技术和工具不断涌现。作为前端开发者，我们需要持续学习，关注新技术，同时也要注重基础知识和最佳实践，这样才能在复杂多变的前端世界中保持竞争力。

在下一篇文章中，我们将深入探讨前端工程化、自动化测试等高级话题，敬请期待！