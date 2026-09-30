---
title: "Vue 3 与Pinia状态管理实战"
date: 2025-10-30T10:20:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["Vue 3", "Pinia", "状态管理", "前端开发", "响应式系统", "TypeScript", "组件通信", "架构设计"]
license: ""
hidden: false
---

# Vue 3 与Pinia状态管理实战

## 前言

状态管理是现代前端应用开发中的核心概念之一，尤其是在构建复杂应用时。Vue 3 生态中，Pinia 已经成为官方推荐的状态管理解决方案，它提供了更简洁的 API、更好的 TypeScript 支持和更强大的功能。本文将详细介绍 Pinia 的基本概念、使用方法和最佳实践，并通过实战案例展示如何在 Vue 3 应用中进行有效的状态管理。

## 一、Pinia 简介

### 1. Pinia 是什么？

Pinia 是 Vue 官方推荐的状态管理库，它是 Vuex 的后继者，提供了更现代化的 API 和更好的开发体验。Pinia 的主要特点包括：

- **类型安全**：完全支持 TypeScript，提供自动类型推断
- **直观的 API**：移除了 mutations，简化了状态管理逻辑
- **模块化设计**：每个 store 都是一个独立的模块，可以灵活组合
- **DevTools 支持**：提供优秀的开发工具集成
- **服务器端渲染支持**：内置 SSR 支持
- **插件系统**：支持丰富的插件扩展

### 2. 安装与配置

安装 Pinia：

```bash
# 使用 npm
npm install pinia

# 使用 yarn
yarn add pinia

# 使用 pnpm
pnpm add pinia
```

在 Vue 3 应用中配置 Pinia：

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

## 二、Pinia 核心概念

### 1. Store 定义

在 Pinia 中，store 是使用 `defineStore()` 函数定义的，它接收两个参数：store 的唯一 id 和配置对象。

```javascript
// stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // 状态定义
  state: () => ({
    count: 0,
    name: '计数器'
  }),
  
  // 计算属性
  getters: {
    doubleCount: (state) => state.count * 2,
    // 可以访问其他 getter
    doubleCountPlusOne: (state, getters) => getters.doubleCount + 1
  },
  
  // 方法（相当于 Vuex 中的 actions 和 mutations）
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    // 支持异步操作
    async incrementAsync() {
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.increment()
    }
  }
})
```

使用组合式 API 语法定义 store（推荐）：

```javascript
// stores/useCounter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // 状态
  const count = ref(0)
  const name = ref('计数器')
  
  // getters
  const doubleCount = computed(() => count.value * 2)
  const doubleCountPlusOne = computed(() => doubleCount.value + 1)
  
  // actions
  function increment() {
    count.value++
  }
  
  function decrement() {
    count.value--
  }
  
  async function incrementAsync() {
    await new Promise(resolve => setTimeout(resolve, 1000))
    increment()
  }
  
  // 返回需要暴露的状态和方法
  return {
    count,
    name,
    doubleCount,
    doubleCountPlusOne,
    increment,
    decrement,
    incrementAsync
  }
})
```

### 2. 使用 Store

在组件中使用 store：

```vue
<script setup>
import { useCounterStore } from '@/stores/counter'

// 获取 store 实例
const counterStore = useCounterStore()

// 直接访问状态
const currentCount = counterStore.count

// 访问 getter
const doubleValue = counterStore.doubleCount

// 调用 action
function handleIncrement() {
  counterStore.increment()
}

async function handleIncrementAsync() {
  await counterStore.incrementAsync()
}
</script>

<template>
  <div>
    <h2>{{ counterStore.name }}</h2>
    <p>当前计数: {{ counterStore.count }}</p>
    <p>双倍计数: {{ counterStore.doubleCount }}</p>
    <button @click="counterStore.increment">增加</button>
    <button @click="counterStore.decrement">减少</button>
    <button @click="handleIncrementAsync">异步增加</button>
  </div>
</template>
```

### 3. 状态修改

在 Pinia 中，有多种方式可以修改状态：

**1. 直接修改状态**

```javascript
const counterStore = useCounterStore()
counterStore.count++
counterStore.name = '新计数器'
```

**2. 使用 $patch 方法批量修改**

```javascript
// 对象形式
counterStore.$patch({
  count: counterStore.count + 1,
  name: '更新后的计数器'
})

// 函数形式（更灵活）
counterStore.$patch((state) => {
  state.count += 10
  state.name = '批量更新的计数器'
})
```

**3. 通过 actions 修改**

```javascript
// 调用 store 中定义的 action
counterStore.increment()
```

**4. 重置状态**

```javascript
// 重置到初始状态
counterStore.$reset()
```

## 三、Pinia 高级特性

### 1. Store 间通信

在 Pinia 中，store 之间可以相互调用，实现状态共享和通信：

```javascript
// stores/user.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  
  function setUser(user) {
    currentUser.value = user
  }
  
  function logout() {
    currentUser.value = null
  }
  
  return {
    currentUser,
    setUser,
    logout
  }
})

// stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const userStore = useUserStore() // 访问其他 store
  
  const totalPrice = computed(() => {
    return items.value.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  })
  
  function addToCart(product, quantity = 1) {
    // 可以使用 userStore 的状态
    if (!userStore.currentUser) {
      console.warn('用户未登录')
      return false
    }
    
    const existingItem = items.value.find(item => item.id === product.id)
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        ...product,
        quantity
      })
    }
    return true
  }
  
  function clearCart() {
    items.value = []
  }
  
  return {
    items,
    totalPrice,
    addToCart,
    clearCart
  }
})
```

### 2. 持久化存储

使用插件实现 store 状态的持久化：

```bash
npm install pinia-plugin-persistedstate
```

配置持久化插件：

```javascript
// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.mount('#app')
```

在 store 中启用持久化：

```javascript
// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    currentUser: null,
    token: ''
  }),
  actions: {
    login(user, token) {
      this.currentUser = user
      this.token = token
    },
    logout() {
      this.currentUser = null
      this.token = ''
    }
  },
  persist: true // 启用持久化
})

// 或使用组合式 API 语法
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  
  // ...
  
  return {
    items
    // ...
  }
}, {
  persist: {
    key: 'my-app-cart', // 存储的键名
    storage: localStorage, // 存储位置
    paths: ['items'] // 只持久化 items
  }
})
```

### 3. Store 插件

Pinia 提供了灵活的插件系统，可以扩展 store 的功能：

```javascript
// storePlugin.js
// 日志插件示例
function loggerPlugin(context) {
  // 可以访问到当前 store
  const { store } = context
  
  console.log(`[Pinia] 初始化 store: ${store.$id}`)
  
  // 监听 store 变化
  store.$subscribe((mutation, state) => {
    console.log(`[Pinia] store ${store.$id} 发生变化:`, {
      mutation,
      state
    })
  })
}

// 错误处理插件
function errorHandlingPlugin(context) {
  const { store } = context
  
  // 包装 actions，添加错误处理
  const originalActions = { ...store.$options.actions }
  store.$options.actions = {
    ...originalActions,
    $executeWithErrorHandling(action, ...args) {
      try {
        return originalActions[action].apply(this, args)
      } catch (error) {
        console.error(`[Pinia] store ${store.$id} action ${action} 执行失败:`, error)
        throw error
      }
    }
  }
}

// main.js
import { createPinia } from 'pinia'
import loggerPlugin from './storePlugin'
import errorHandlingPlugin from './errorHandlingPlugin'

const pinia = createPinia()
pinia.use(loggerPlugin)
pinia.use(errorHandlingPlugin)
```

### 4. 组合式 Store

使用组合式 API 语法可以更灵活地组合多个 store 的逻辑：

```javascript
// stores/useProduct.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProductStore = defineStore('product', () => {
  const products = ref([])
  const loading = ref(false)
  
  const getProductById = (id) => {
    return products.value.find(product => product.id === id)
  }
  
  async function fetchProducts() {
    loading.value = true
    try {
      // 模拟 API 请求
      await new Promise(resolve => setTimeout(resolve, 500))
      products.value = [
        { id: 1, name: '产品 1', price: 100 },
        { id: 2, name: '产品 2', price: 200 },
        { id: 3, name: '产品 3', price: 300 }
      ]
    } catch (error) {
      console.error('获取产品失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  return {
    products,
    loading,
    getProductById,
    fetchProducts
  }
})

// 组合多个 store 的逻辑
// stores/useShop.js
import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useProductStore } from './useProduct'
import { useCartStore } from './useCart'
import { useUserStore } from './useUser'

export const useShopStore = defineStore('shop', () => {
  const productStore = useProductStore()
  const cartStore = useCartStore()
  const userStore = useUserStore()
  
  // 组合多个 store 的状态和方法
  const cartWithDetails = computed(() => {
    return cartStore.items.map(cartItem => {
      const product = productStore.getProductById(cartItem.id)
      return {
        ...cartItem,
        productDetails: product
      }
    })
  })
  
  const isCartEmpty = computed(() => cartStore.items.length === 0)
  
  async function checkout() {
    if (!userStore.currentUser) {
      throw new Error('用户未登录')
    }
    
    if (isCartEmpty.value) {
      throw new Error('购物车为空')
    }
    
    // 模拟结算操作
    await new Promise(resolve => setTimeout(resolve, 1000))
    cartStore.clearCart()
    return true
  }
  
  return {
    cartWithDetails,
    isCartEmpty,
    checkout,
    // 暴露子 store 的方法供外部使用
    fetchProducts: productStore.fetchProducts,
    addToCart: cartStore.addToCart,
    login: userStore.login,
    logout: userStore.logout
  }
})
```

## 四、Pinia 与 TypeScript 结合

### 1. 类型定义

Pinia 提供了出色的 TypeScript 支持，可以为 store 提供完整的类型定义：

```typescript
// stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义接口
interface User {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
}

interface UserState {
  currentUser: User | null
  token: string
  loading: boolean
}

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const token = ref<string>('')
  const loading = ref<boolean>(false)
  
  // 计算属性
  const isLoggedIn = computed(() => !!currentUser.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  
  // 方法
  async function login(username: string, password: string): Promise<User> {
    loading.value = true
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUser: User = {
        id: 1,
        username,
        email: `${username}@example.com`,
        role: 'user'
      }
      
      currentUser.value = mockUser
      token.value = 'mock-jwt-token'
      
      return mockUser
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }
  
  function logout(): void {
    currentUser.value = null
    token.value = ''
  }
  
  return {
    currentUser,
    token,
    loading,
    isLoggedIn,
    isAdmin,
    login,
    logout
  }
})
```

### 2. 类型安全的 Store 访问

使用 TypeScript 可以确保在组件中使用 store 时的类型安全：

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// TypeScript 会提供自动完成和类型检查
const username = userStore.currentUser?.username // string | undefined
const isAdmin = userStore.isAdmin // boolean

async function handleLogin() {
  try {
    // 类型安全的调用，会检查参数类型
    const user = await userStore.login('admin', 'password123')
    console.log('登录成功:', user.username)
  } catch (error) {
    console.error('登录失败')
  }
}
</script>
```

## 五、Pinia 最佳实践

### 1. Store 结构设计

**模块化组织**：按照功能模块划分 store：

```
stores/
├── user.ts        # 用户相关状态
├── product.ts     # 产品相关状态
├── cart.ts        # 购物车相关状态
├── order.ts       # 订单相关状态
└── common.ts      # 通用状态
```

**Store 粒度**：避免创建过大的 store，保持每个 store 的职责单一：

- 好的做法：按功能领域划分小而专注的 store
- 避免：创建包含整个应用所有状态的单一 store

### 2. 状态管理策略

**状态分类**：

- **应用级状态**：用户信息、权限、全局配置等
- **模块级状态**：特定功能模块所需的状态
- **UI 状态**：组件内部的临时状态（通常使用组件内部状态即可）

**状态更新模式**：

- 简单状态更新可以直接修改
- 复杂的状态转换应该通过 actions 进行
- 异步操作必须在 actions 中处理

### 3. 性能优化

**避免不必要的响应式开销**：

- 对于大型数据集合，考虑使用 `shallowRef`
- 对于不需要响应式的数据，使用 `markRaw`

**优化订阅**：

```javascript
const unsubscribe = store.$subscribe((mutation, state) => {
  // 仅在特定状态变化时执行操作
  if (mutation.events.key === 'count') {
    // 处理 count 变化
  }
}, { detached: true }) // detached: true 使订阅在组件卸载后仍然有效

// 组件卸载时取消订阅
onUnmounted(() => unsubscribe())
```

### 4. 测试策略

使用 Vitest 测试 Pinia store：

```typescript
// stores/user.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from './user'

describe('User Store', () => {
  beforeEach(() => {
    // 创建新的 pinia 实例用于测试
    setActivePinia(createPinia())
  })
  
  it('should initialize with correct state', () => {
    const store = useUserStore()
    expect(store.currentUser).toBeNull()
    expect(store.token).toBe('')
    expect(store.loading).toBe(false)
    expect(store.isLoggedIn).toBe(false)
  })
  
  it('should login successfully', async () => {
    const store = useUserStore()
    const user = await store.login('testuser', 'password')
    
    expect(user.username).toBe('testuser')
    expect(store.currentUser).toEqual(user)
    expect(store.token).toBe('mock-jwt-token')
    expect(store.isLoggedIn).toBe(true)
  })
  
  it('should logout correctly', () => {
    const store = useUserStore()
    store.currentUser = { id: 1, username: 'test', email: 'test@example.com', role: 'user' }
    store.token = 'test-token'
    
    store.logout()
    
    expect(store.currentUser).toBeNull()
    expect(store.token).toBe('')
    expect(store.isLoggedIn).toBe(false)
  })
})
```

## 六、实战案例：电商应用状态管理

下面是一个完整的电商应用状态管理实战案例，使用 Vue 3 + TypeScript + Pinia 实现：

### 1. 项目结构

```
/src
  /stores
    /index.ts       # store 导出文件
    /user.ts        # 用户 store
    /product.ts     # 产品 store
    /cart.ts        # 购物车 store
    /order.ts       # 订单 store
    /category.ts    # 分类 store
    /common.ts      # 通用 store
```

### 2. 产品 Store

```typescript
// stores/product.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Product {
  id: number
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  categoryId: number
  stock: number
  sales: number
  isHot?: boolean
  isNew?: boolean
}

interface ProductFilter {
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  keyword?: string
  sortBy?: 'price' | 'sales' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
  page: number
  pageSize: number
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const featuredProducts = ref<Product[]>([])
  const currentProduct = ref<Product | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const filter = ref<ProductFilter>({
    page: 1,
    pageSize: 10
  })
  const totalCount = ref(0)
  
  // 计算属性
  const paginatedProducts = computed(() => {
    let filtered = [...products.value]
    
    // 应用筛选条件
    if (filter.value.categoryId) {
      filtered = filtered.filter(p => p.categoryId === filter.value.categoryId)
    }
    
    if (filter.value.minPrice !== undefined) {
      filtered = filtered.filter(p => p.price >= filter.value.minPrice!)
    }
    
    if (filter.value.maxPrice !== undefined) {
      filtered = filtered.filter(p => p.price <= filter.value.maxPrice!)
    }
    
    if (filter.value.keyword) {
      const keyword = filter.value.keyword.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword)
      )
    }
    
    // 排序
    if (filter.value.sortBy) {
      filtered.sort((a, b) => {
        let aValue = a[filter.value.sortBy! as keyof Product]
        let bValue = b[filter.value.sortBy! as keyof Product]
        
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue?.toString().toLowerCase() || ''
        }
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return filter.value.sortOrder === 'desc' ? -comparison : comparison
      })
    }
    
    return filtered
  })
  
  const displayedProducts = computed(() => {
    const start = (filter.value.page - 1) * filter.value.pageSize
    const end = start + filter.value.pageSize
    return paginatedProducts.value.slice(start, end)
  })
  
  const totalPages = computed(() => {
    return Math.ceil(totalCount.value / filter.value.pageSize)
  })
  
  // 方法
  async function fetchProducts() {
    loading.value = true
    error.value = null
    
    try {
      // 模拟 API 请求
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟数据
      products.value = Array.from({ length: 50 }, (_, index) => ({
        id: index + 1,
        name: `产品 ${index + 1}`,
        description: `这是产品 ${index + 1} 的详细描述`,
        price: Math.floor(Math.random() * 1000) + 100,
        originalPrice: Math.floor(Math.random() * 1500) + 200,
        image: `https://via.placeholder.com/300x300?text=Product+${index + 1}`,
        categoryId: Math.floor(Math.random() * 5) + 1,
        stock: Math.floor(Math.random() * 100) + 1,
        sales: Math.floor(Math.random() * 1000),
        isHot: Math.random() > 0.7,
        isNew: Math.random() > 0.8
      }))
      
      totalCount.value = products.value.length
      
      // 获取特色产品
      featuredProducts.value = products.value
        .filter(p => p.isHot)
        .slice(0, 6)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取产品失败'
      console.error('获取产品失败:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function fetchProductById(id: number) {
    loading.value = true
    error.value = null
    
    try {
      // 模拟 API 请求
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const product = products.value.find(p => p.id === id)
      if (!product) {
        throw new Error('产品不存在')
      }
      
      currentProduct.value = product
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取产品详情失败'
      console.error('获取产品详情失败:', err)
    } finally {
      loading.value = false
    }
  }
  
  function updateFilter(newFilter: Partial<ProductFilter>) {
    filter.value = {
      ...filter.value,
      ...newFilter,
      // 当筛选条件改变时，重置到第一页
      page: newFilter.categoryId !== undefined || 
            newFilter.keyword !== undefined ||
            newFilter.minPrice !== undefined ||
            newFilter.maxPrice !== undefined ||
            newFilter.sortBy !== undefined ||
            newFilter.sortOrder !== undefined
              ? 1
              : filter.value.page
    }
  }
  
  function setPage(page: number) {
    if (page > 0 && page <= totalPages.value) {
      filter.value.page = page
    }
  }
  
  return {
    products,
    featuredProducts,
    currentProduct,
    loading,
    error,
    filter,
    totalCount,
    totalPages,
    displayedProducts,
    fetchProducts,
    fetchProductById,
    updateFilter,
    setPage
  }
})
```

### 3. 购物车 Store

```typescript
// stores/cart.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useProductStore } from './product'
import { useUserStore } from './user'

interface CartItem {
  productId: number
  quantity: number
  selected: boolean
  addedAt: Date
}

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const productStore = useProductStore()
  const userStore = useUserStore()
  
  // 计算属性
  const cartWithProducts = computed(() => {
    return items.value.map(item => {
      const product = productStore.products.find(p => p.id === item.productId)
      return {
        ...item,
        product,
        totalPrice: product ? product.price * item.quantity : 0
      }
    }).filter(item => item.product !== undefined)
  })
  
  const selectedItems = computed(() => {
    return cartWithProducts.value.filter(item => item.selected)
  })
  
  const totalPrice = computed(() => {
    return selectedItems.value.reduce((total, item) => total + item.totalPrice, 0)
  })
  
  const totalQuantity = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })
  
  const selectedCount = computed(() => {
    return selectedItems.value.reduce((total, item) => total + item.quantity, 0)
  })
  
  const isAllSelected = computed(() => {
    return items.value.length > 0 && items.value.every(item => item.selected)
  })
  
  const isEmpty = computed(() => items.value.length === 0)
  
  // 方法
  function addToCart(productId: number, quantity: number = 1) {
    if (!userStore.isLoggedIn) {
      console.warn('请先登录')
      return false
    }
    
    const existingItem = items.value.find(item => item.productId === productId)
    
    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        productId,
        quantity,
        selected: true,
        addedAt: new Date()
      })
    }
    
    return true
  }
  
  function removeFromCart(productId: number) {
    items.value = items.value.filter(item => item.productId !== productId)
  }
  
  function updateQuantity(productId: number, quantity: number) {
    const item = items.value.find(item => item.productId === productId)
    if (item) {
      item.quantity = Math.max(1, quantity)
    }
  }
  
  function toggleSelect(productId: number) {
    const item = items.value.find(item => item.productId === productId)
    if (item) {
      item.selected = !item.selected
    }
  }
  
  function selectAll(select: boolean) {
    items.value.forEach(item => {
      item.selected = select
    })
  }
  
  function clearCart() {
    items.value = []
  }
  
  function clearSelected() {
    items.value = items.value.filter(item => !item.selected)
  }
  
  // 批量操作
  function updateItems(updates: Array<{ productId: number; quantity: number; selected?: boolean }>) {
    updates.forEach(update => {
      const item = items.value.find(i => i.productId === update.productId)
      if (item) {
        item.quantity = Math.max(1, update.quantity)
        if (update.selected !== undefined) {
          item.selected = update.selected
        }
      }
    })
  }
  
  return {
    items,
    cartWithProducts,
    selectedItems,
    totalPrice,
    totalQuantity,
    selectedCount,
    isAllSelected,
    isEmpty,
    addToCart,
    removeFromCart,
    updateQuantity,
    toggleSelect,
    selectAll,
    clearCart,
    clearSelected,
    updateItems
  }
}, {
  persist: {
    key: 'ecommerce-cart',
    storage: localStorage
  }
})
```

### 4. 在组件中使用 Store

```vue
<!-- ProductList.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProductStore } from '@/stores/product'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const productStore = useProductStore()
const cartStore = useCartStore()
const userStore = useUserStore()

const loading = ref(false)

// 加载产品数据
onMounted(async () => {
  loading.value = true
  await productStore.fetchProducts()
  loading.value = false
})

// 添加到购物车
function handleAddToCart(productId: number) {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  
  const success = cartStore.addToCart(productId, 1)
  if (success) {
    alert('已添加到购物车')
  }
}

// 分页处理
function changePage(page: number) {
  productStore.setPage(page)
}

// 排序处理
function sortBy(field: 'price' | 'sales', order: 'asc' | 'desc') {
  productStore.updateFilter({ sortBy: field, sortOrder: order })
}
</script>

<template>
  <div class="product-list">
    <h1>产品列表</h1>
    
    <!-- 筛选和排序 -->
    <div class="filters">
      <div class="sort-options">
        <span>排序方式:</span>
        <button 
          @click="sortBy('price', 'asc')"
          :class="{ active: productStore.filter.sortBy === 'price' && productStore.filter.sortOrder === 'asc' }"
        >
          价格 ↑
        </button>
        <button 
          @click="sortBy('price', 'desc')"
          :class="{ active: productStore.filter.sortBy === 'price' && productStore.filter.sortOrder === 'desc' }"
        >
          价格 ↓
        </button>
        <button 
          @click="sortBy('sales', 'desc')"
          :class="{ active: productStore.filter.sortBy === 'sales' && productStore.filter.sortOrder === 'desc' }"
        >
          销量 ↓
        </button>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    
    <!-- 错误提示 -->
    <div v-else-if="productStore.error" class="error">
      {{ productStore.error }}
    </div>
    
    <!-- 产品列表 -->
    <div v-else class="products-grid">
      <div 
        v-for="product in productStore.displayedProducts" 
        :key="product.id"
        class="product-card"
      >
        <div class="product-image">
          <img :src="product.image" :alt="product.name" />
          <span v-if="product.isHot" class="badge hot">热销</span>
          <span v-if="product.isNew" class="badge new">新品</span>
        </div>
        <div class="product-info">
          <h3 class="product-name">{{ product.name }}</h3>
          <div class="product-price">
            <span class="price">¥{{ product.price }}</span>
            <span v-if="product.originalPrice" class="original-price">¥{{ product.originalPrice }}</span>
          </div>
          <div class="product-stats">
            <span>库存: {{ product.stock }}</span>
            <span>销量: {{ product.sales }}</span>
          </div>
          <button 
            class="add-to-cart-btn"
            @click="handleAddToCart(product.id)"
            :disabled="product.stock === 0"
          >
            {{ product.stock === 0 ? '缺货' : '加入购物车' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div v-if="!loading && productStore.totalPages > 1" class="pagination">
      <button 
        @click="changePage(productStore.filter.page - 1)"
        :disabled="productStore.filter.page === 1"
      >
        上一页
      </button>
      
      <span v-for="page in productStore.totalPages" :key="page">
        <button 
          @click="changePage(page)"
          :class="{ active: productStore.filter.page === page }"
        >
          {{ page }}
        </button>
      </span>
      
      <button 
        @click="changePage(productStore.filter.page + 1)"
        :disabled="productStore.filter.page === productStore.totalPages"
      >
        下一页
      </button>
      
      <span class="page-info">
        共 {{ productStore.totalCount }} 件商品，第 {{ productStore.filter.page }} / {{ productStore.totalPages }} 页
      </span>
    </div>
  </div>
</template>

<style scoped>
.product-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.filters {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sort-options button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.sort-options button.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.loading, .error {
  text-align: center;
  padding: 50px;
}

.error {
  color: #e74c3c;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.product-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.badge {
  position: absolute;
  top: 10px;
  padding: 4px 8px;
  font-size: 12px;
  color: white;
  border-radius: 4px;
}

.badge.hot {
  left: 10px;
  background-color: #e74c3c;
}

.badge.new {
  right: 10px;
  background-color: #3498db;
}

.product-info {
  padding: 15px;
}

.product-name {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.product-price {
  margin-bottom: 10px;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: #e74c3c;
}

.original-price {
  margin-left: 10px;
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.product-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.add-to-cart-btn {
  width: 100%;
  padding: 10px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.add-to-cart-btn:hover:not(:disabled) {
  background-color: #3aa576;
}

.add-to-cart-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex-wrap: wrap;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.pagination button:disabled {
  background-color: #f8f9fa;
  color: #ccc;
  cursor: not-allowed;
}

.page-info {
  margin-left: 20px;
  color: #666;
}
</style>
```

## 总结

Pinia 作为 Vue 3 官方推荐的状态管理库，提供了简洁明了的 API 和出色的 TypeScript 支持，使得状态管理变得更加简单和高效。本文详细介绍了 Pinia 的核心概念、高级特性、最佳实践和实战案例，帮助开发者掌握如何在 Vue 3 应用中进行有效的状态管理。

主要内容回顾：

1. **Pinia 基础**：Store 定义、状态修改和组件使用
2. **高级特性**：Store 间通信、持久化存储、插件系统和组合式 Store
3. **TypeScript 集成**：类型定义和类型安全的 Store 访问
4. **最佳实践**：Store 结构设计、状态管理策略和性能优化
5. **实战案例**：电商应用状态管理的完整实现

通过合理使用 Pinia，我们可以构建出状态管理清晰、可维护性高的 Vue 3 应用，提升开发效率和代码质量。