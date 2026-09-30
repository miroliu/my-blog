---
title: "Vue 3 组合式API最佳实践与模式"
date: 2025-10-30T10:10:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["Vue 3", "组合式API", "最佳实践", "前端开发", "Composition API", "设计模式", "可复用逻辑", "状态管理"]
license: ""
hidden: false
---

# Vue 3 组合式API最佳实践与模式

## 前言

Vue 3 引入的组合式API（Composition API）为Vue应用程序开发带来了新的编程范式，使我们能够更好地组织和复用逻辑代码。本文将详细介绍组合式API的最佳实践、常见模式以及实际应用场景，帮助开发者充分利用这一强大特性构建高质量的Vue应用。

## 一、组合式API基础回顾

### 1. setup函数

setup函数是组合式API的入口点，在组件实例创建前执行：

```vue
<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'

// 响应式状态
const count = ref(0)
const state = reactive({ name: 'Vue 3', version: '3.3+' })

// 计算属性
const doubleCount = computed(() => count.value * 2)

// 监听器
watch(count, (newValue, oldValue) => {
  console.log(`从 ${oldValue} 变为 ${newValue}`)
})

// 生命周期钩子
onMounted(() => {
  console.log('组件已挂载')
})

// 暴露给模板的函数
function increment() {
  count.value++
}
</script>

<template>
  <div>
    <p>计数: {{ count }}</p>
    <p>双倍计数: {{ doubleCount }}</p>
    <p>应用: {{ state.name }} v{{ state.version }}</p>
    <button @click="increment">增加</button>
  </div>
</template>
```

### 2. 响应式API

Vue 3 提供了多种创建响应式数据的API：

```javascript
import { ref, reactive, computed, toRefs, toRef, shallowRef, shallowReactive } from 'vue'

// 基础响应式
const count = ref(0) // 基本类型的响应式引用
const user = reactive({ name: '张三', age: 30 }) // 对象的响应式代理

// 计算属性
const fullName = computed(() => `${user.firstName} ${user.lastName}`)

// 转换API
const userRefs = toRefs(user) // 将reactive对象转换为ref对象
const nameRef = toRef(user, 'name') // 为特定属性创建ref

// 浅层响应式
const shallowState = shallowReactive({ info: { nested: 'value' } }) // 仅顶层响应式
const shallowCount = shallowRef({ count: 0 }) // ref的.value不自动深层响应式
```

## 二、组合式函数模式

### 1. 基本组合式函数

组合式函数（Composables）是封装和复用逻辑的主要方式：

```javascript
// useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  const doubleCount = computed(() => count.value * 2)
  
  return {
    count,
    increment,
    decrement,
    doubleCount
  }
}
```

使用组合式函数：

```vue
<script setup>
import { useCounter } from './useCounter'

// 可以在同一组件中使用多次，互不影响
const { count, increment, decrement, doubleCount } = useCounter(10)
const { count: counter2, increment: increment2 } = useCounter(5)
</script>
```

### 2. 异步操作组合式函数

封装异步操作的组合式函数：

```javascript
// useFetch.js
import { ref, computed, watch } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  
  const execute = async () => {
    if (!url.value) return
    
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(url.value)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      data.value = await response.json()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  // 当url变化时自动重新请求
  watch(url, execute, { immediate: true })
  
  return {
    data,
    error,
    loading,
    refetch: execute
  }
}
```

使用异步组合式函数：

```vue
<script setup>
import { ref } from 'vue'
import { useFetch } from './useFetch'

const userId = ref(1)
const userUrl = computed(() => `https://api.example.com/users/${userId.value}`)

const { data: user, error, loading, refetch } = useFetch(userUrl)

function changeUser(newId) {
  userId.value = newId
  // 不需要手动调用refetch，watch会自动触发
}
</script>
```

### 3. 事件处理组合式函数

封装事件处理逻辑：

```javascript
// useEventListener.js
import { onMounted, onUnmounted } from 'vue'

export function useEventListener(target, event, callback) {
  onMounted(() => {
    target.addEventListener(event, callback)
  })
  
  onUnmounted(() => {
    target.removeEventListener(event, callback)
  })
}
```

使用事件处理组合式函数：

```vue
<script setup>
import { ref } from 'vue'
import { useEventListener } from './useEventListener'

const counter = ref(0)

// 监听窗口滚动事件
useEventListener(
  window,
  'scroll',
  () => {
    console.log('滚动位置:', window.scrollY)
    counter.value++
  }
)

// 监听元素事件
const button = ref(null)
useEventListener(
  () => button.value, // 支持ref或返回元素的函数
  'click',
  () => {
    console.log('按钮被点击')
  }
)
</script>

<template>
  <button ref="button">点击我</button>
</template>
```

### 4. 状态管理组合式函数

轻量级状态管理：

```javascript
// useStore.js
import { reactive, provide, inject } from 'vue'

// 创建store
const createStore = (initialState) => {
  const state = reactive(initialState)
  
  const mutations = {
    SET_USER(state, user) {
      state.user = user
    },
    SET_LOADING(state, isLoading) {
      state.loading = isLoading
    }
  }
  
  const actions = {
    async fetchUser({ commit }, userId) {
      commit('SET_LOADING', true)
      try {
        const response = await fetch(`/api/users/${userId}`)
        const user = await response.json()
        commit('SET_USER', user)
        return user
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
  
  // 执行mutations的辅助函数
  const commit = (mutation, payload) => {
    if (mutations[mutation]) {
      mutations[mutation](state, payload)
    }
  }
  
  // 执行actions的辅助函数
  const dispatch = async (action, payload) => {
    if (actions[action]) {
      return actions[action]({ commit, dispatch, state }, payload)
    }
  }
  
  return {
    state,
    commit,
    dispatch
  }
}

// 创建store实例
const store = createStore({
  user: null,
  loading: false
})

// 提供全局store
export function provideStore() {
  provide('store', store)
}

// 注入并使用store
export function useStore() {
  const store = inject('store')
  if (!store) {
    throw new Error('store not provided')
  }
  return store
}
```

使用状态管理组合式函数：

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'
import { provideStore } from './useStore'

const app = createApp(App)
provideStore()
app.mount('#app')
```

```vue
<script setup>
import { useStore } from './useStore'

const { state, dispatch } = useStore()

onMounted(async () => {
  await dispatch('fetchUser', 1)
})
</script>
```

## 三、组合式API高级模式

### 1. 组合式函数工厂模式

创建返回组合式函数的工厂：

```javascript
// usePagination.js
import { ref, computed } from 'vue'

export function createPagination(options = {}) {
  const { 
    pageSize = 10, 
    initialPage = 1 
  } = options
  
  return function usePagination(items) {
    const currentPage = ref(initialPage)
    const pageSizeRef = ref(pageSize)
    
    const totalItems = computed(() => items.value?.length || 0)
    const totalPages = computed(() => 
      Math.ceil(totalItems.value / pageSizeRef.value) || 1
    )
    
    const paginatedItems = computed(() => {
      if (!items.value) return []
      
      const startIndex = (currentPage.value - 1) * pageSizeRef.value
      const endIndex = startIndex + pageSizeRef.value
      
      return items.value.slice(startIndex, endIndex)
    })
    
    const goToPage = (page) => {
      currentPage.value = Math.max(1, Math.min(page, totalPages.value))
    }
    
    const nextPage = () => goToPage(currentPage.value + 1)
    const prevPage = () => goToPage(currentPage.value - 1)
    const setPageSize = (size) => {
      pageSizeRef.value = size
      currentPage.value = 1 // 重置到第一页
    }
    
    return {
      currentPage,
      pageSize: pageSizeRef,
      totalItems,
      totalPages,
      paginatedItems,
      goToPage,
      nextPage,
      prevPage,
      setPageSize
    }
  }
}
```

使用工厂创建的组合式函数：

```vue
<script setup>
import { ref } from 'vue'
import { createPagination } from './usePagination'

// 创建不同配置的分页组合式函数
const useSmallPagination = createPagination({ pageSize: 5 })
const useLargePagination = createPagination({ pageSize: 20 })

// 示例数据
const allItems = ref(Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: `项目 ${i + 1}` })))

// 使用分页
const { 
  currentPage, 
  paginatedItems, 
  nextPage, 
  prevPage 
} = useSmallPagination(allItems)
</script>
```

### 2. 可配置组合式函数

创建高度可配置的组合式函数：

```javascript
// useValidatedForm.js
import { reactive, computed } from 'vue'

export function useValidatedForm(initialValues = {}, validations = {}) {
  const formData = reactive({ ...initialValues })
  const errors = reactive({})
  const touched = reactive({})
  
  // 验证规则函数
  const validationRules = {
    required: (value) => !!value || '此字段为必填项',
    minLength: (min) => (value) => 
      (!value || value.length >= min) || `最少需要 ${min} 个字符`,
    maxLength: (max) => (value) => 
      (!value || value.length <= max) || `最多允许 ${max} 个字符`,
    pattern: (regex, message) => (value) => 
      (!value || regex.test(value)) || (message || '格式不正确'),
    custom: (validator) => validator
  }
  
  // 验证单个字段
  const validateField = (field) => {
    const value = formData[field]
    const fieldValidations = validations[field]
    
    if (!fieldValidations) {
      delete errors[field]
      return true
    }
    
    for (const [ruleName, ruleValue] of Object.entries(fieldValidations)) {
      let validator
      
      if (ruleName === 'custom') {
        validator = ruleValue
      } else if (validationRules[ruleName]) {
        if (typeof validationRules[ruleName] === 'function') {
          if (ruleName === 'minLength' || ruleName === 'maxLength' || ruleName === 'pattern') {
            validator = validationRules[ruleName](ruleValue)
          } else {
            validator = validationRules[ruleName]
          }
        }
      }
      
      if (validator) {
        const errorMessage = validator(value)
        if (errorMessage !== true) {
          errors[field] = errorMessage
          return false
        }
      }
    }
    
    delete errors[field]
    return true
  }
  
  // 验证所有字段
  const validateAll = () => {
    let isValid = true
    
    for (const field in validations) {
      touched[field] = true
      const fieldIsValid = validateField(field)
      isValid = isValid && fieldIsValid
    }
    
    return isValid
  }
  
  // 提交表单
  const submit = (onSubmit) => {
    if (validateAll()) {
      return onSubmit({ ...formData })
    }
    return Promise.reject({ errors })
  }
  
  // 重置表单
  const reset = () => {
    Object.keys(formData).forEach(key => {
      formData[key] = initialValues[key] ?? ''
    })
    
    Object.keys(errors).forEach(key => {
      delete errors[key]
    })
    
    Object.keys(touched).forEach(key => {
      delete touched[key]
    })
  }
  
  // 更新单个字段
  const setFieldValue = (field, value) => {
    formData[field] = value
    
    if (touched[field]) {
      validateField(field)
    }
  }
  
  // 标记字段为已触摸
  const markFieldTouched = (field) => {
    touched[field] = true
    validateField(field)
  }
  
  // 计算属性：表单是否有错误
  const hasErrors = computed(() => Object.keys(errors).length > 0)
  
  // 计算属性：表单是否有效
  const isValid = computed(() => {
    // 只有当所有必填字段都已触摸且无错误时，表单才有效
    const requiredFields = Object.entries(validations)
      .filter(([_, rules]) => rules.required)
      .map(([field]) => field)
    
    const allRequiredTouched = requiredFields.every(field => touched[field])
    
    return allRequiredTouched && !hasErrors.value
  })
  
  return {
    formData,
    errors,
    touched,
    hasErrors,
    isValid,
    validateField,
    validateAll,
    submit,
    reset,
    setFieldValue,
    markFieldTouched
  }
}
```

使用可配置表单验证：

```vue
<script setup>
import { useValidatedForm } from './useValidatedForm'

const { 
  formData, 
  errors, 
  touched, 
  isValid,
  validateField,
  submit 
} = useValidatedForm(
  { // 初始值
    username: '',
    email: '',
    password: ''
  },
  { // 验证规则
    username: {
      required: true,
      minLength: 3,
      maxLength: 20
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      custom: (value) => {
        // 自定义异步验证可以在submit时处理
        return true
      }
    },
    password: {
      required: true,
      minLength: 6,
      custom: (value) => {
        return /[A-Z]/.test(value) || '密码必须包含至少一个大写字母'
      }
    }
  }
)

const handleSubmit = async (data) => {
  console.log('表单数据:', data)
  // 这里可以进行API调用
  // return fetch('/api/register', { method: 'POST', body: JSON.stringify(data) })
}

const onSubmit = async () => {
  try {
    await submit(handleSubmit)
    console.log('表单提交成功')
  } catch (error) {
    console.error('表单验证失败', error)
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div>
      <label for="username">用户名</label>
      <input
        id="username"
        v-model="formData.username"
        @blur="markFieldTouched('username')"
        @input="validateField('username')"
      />
      <span v-if="touched.username && errors.username" class="error">{{ errors.username }}</span>
    </div>
    
    <div>
      <label for="email">邮箱</label>
      <input
        id="email"
        type="email"
        v-model="formData.email"
        @blur="markFieldTouched('email')"
        @input="validateField('email')"
      />
      <span v-if="touched.email && errors.email" class="error">{{ errors.email }}</span>
    </div>
    
    <div>
      <label for="password">密码</label>
      <input
        id="password"
        type="password"
        v-model="formData.password"
        @blur="markFieldTouched('password')"
        @input="validateField('password')"
      />
      <span v-if="touched.password && errors.password" class="error">{{ errors.password }}</span>
    </div>
    
    <button type="submit" :disabled="!isValid">注册</button>
  </form>
</template>
```

### 3. 生命周期钩子组合式函数

封装生命周期相关逻辑：

```javascript
// useLifecycleLogger.js
import { 
  onMounted, 
  onUpdated, 
  onUnmounted, 
  onBeforeMount, 
  onBeforeUpdate, 
  onBeforeUnmount
} from 'vue'

export function useLifecycleLogger(componentName = 'Component') {
  onBeforeMount(() => {
    console.log(`${componentName}: onBeforeMount`)
  })
  
  onMounted(() => {
    console.log(`${componentName}: onMounted`)
  })
  
  onBeforeUpdate(() => {
    console.log(`${componentName}: onBeforeUpdate`)
  })
  
  onUpdated(() => {
    console.log(`${componentName}: onUpdated`)
  })
  
  onBeforeUnmount(() => {
    console.log(`${componentName}: onBeforeUnmount`)
  })
  
  onUnmounted(() => {
    console.log(`${componentName}: onUnmounted`)
  })
}
```

使用生命周期日志记录：

```vue
<script setup>
import { useLifecycleLogger } from './useLifecycleLogger'

// 自动记录组件的所有生命周期事件
useLifecycleLogger('MyComponent')
</script>
```

### 4. 组合式函数的组合

组合多个组合式函数创建更复杂的功能：

```javascript
// useAuth.js
import { ref, computed } from 'vue'
import { useFetch } from './useFetch'
import { useStorage } from './useStorage'

export function useAuth() {
  const user = ref(null)
  const isAuthenticated = computed(() => !!user.value)
  const { setItem, getItem, removeItem } = useStorage()
  
  // 初始化：从本地存储恢复用户信息
  const storedUser = getItem('user')
  if (storedUser) {
    user.value = storedUser
  }
  
  const login = async (credentials) => {
    try {
      // 使用之前定义的useFetch组合式函数
      const { data, error } = useFetch('https://api.example.com/auth/login')
      // 模拟登录请求
      // await loginRequest...
      
      user.value = { id: 1, username: credentials.username, role: 'user' }
      setItem('user', user.value)
      setItem('authToken', 'fake-token-12345')
      
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }
  
  const logout = () => {
    user.value = null
    removeItem('user')
    removeItem('authToken')
  }
  
  const checkAuthStatus = async () => {
    try {
      // 验证token是否有效
      // const response = await fetch('/api/auth/verify')
      // if (response.ok) { ... }
      return isAuthenticated.value
    } catch (err) {
      logout()
      return false
    }
  }
  
  return {
    user,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus
  }
}
```

## 四、组合式API与TypeScript结合

### 1. 类型安全的组合式函数

使用TypeScript增强组合式函数的类型安全性：

```typescript
// useCounter.ts
import { ref, computed, Ref } from 'vue'

interface UseCounterOptions {
  initialValue?: number
  min?: number
  max?: number
}

interface UseCounterReturn {
  count: Ref<number>
  doubleCount: Ref<number>
  increment: () => void
  decrement: () => void
  reset: () => void
  setValue: (value: number) => void
}

export function useCounter(options: UseCounterOptions = {}): UseCounterReturn {
  const { initialValue = 0, min, max } = options
  
  const count = ref(initialValue)
  
  const increment = () => {
    if (max === undefined || count.value < max) {
      count.value++
    }
  }
  
  const decrement = () => {
    if (min === undefined || count.value > min) {
      count.value--
    }
  }
  
  const reset = () => {
    count.value = initialValue
  }
  
  const setValue = (value: number) => {
    if (min !== undefined && value < min) {
      count.value = min
    } else if (max !== undefined && value > max) {
      count.value = max
    } else {
      count.value = value
    }
  }
  
  const doubleCount = computed(() => count.value * 2)
  
  return {
    count,
    doubleCount,
    increment,
    decrement,
    reset,
    setValue
  }
}
```

使用类型安全的组合式函数：

```vue
<script setup lang="ts">
import { useCounter } from './useCounter'

// TypeScript会提供完整的类型推断和自动完成
const counter = useCounter({ 
  initialValue: 5, 
  min: 0, 
  max: 10 
})

// counter.count 是 Ref<number> 类型
// counter.increment 是 () => void 类型
</script>
```

### 2. 泛型组合式函数

创建可重用的泛型组合式函数：

```typescript
// useArray.ts
import { ref, Ref } from 'vue'

export function useArray<T>(initialValue: T[] = []): {
  items: Ref<T[]>
  add: (item: T) => void
  remove: (index: number) => void
  clear: () => void
  find: (predicate: (item: T) => boolean) => T | undefined
  filter: (predicate: (item: T) => boolean) => T[]
  map: <U>(callback: (item: T) => U) => U[]
} {
  const items = ref<T[]>([...initialValue])
  
  const add = (item: T) => {
    items.value.push(item)
  }
  
  const remove = (index: number) => {
    if (index >= 0 && index < items.value.length) {
      items.value.splice(index, 1)
    }
  }
  
  const clear = () => {
    items.value = []
  }
  
  const find = (predicate: (item: T) => boolean): T | undefined => {
    return items.value.find(predicate)
  }
  
  const filter = (predicate: (item: T) => boolean): T[] => {
    return items.value.filter(predicate)
  }
  
  const map = <U>(callback: (item: T) => U): U[] => {
    return items.value.map(callback)
  }
  
  return {
    items,
    add,
    remove,
    clear,
    find,
    filter,
    map
  }
}
```

使用泛型组合式函数：

```vue
<script setup lang="ts">
import { useArray } from './useArray'

interface User {
  id: number
  name: string
  age: number
}

// 类型安全的用户数组操作
const users = useArray<User>([
  { id: 1, name: '张三', age: 25 },
  { id: 2, name: '李四', age: 30 }
])

// add方法只接受User类型参数
users.add({ id: 3, name: '王五', age: 28 })

// filter方法返回User[]类型
const youngUsers = users.filter(user => user.age < 30)

// TypeScript会正确推断出类型
console.log(youngUsers[0]?.name) // string | undefined
</script>
```

## 五、组合式API最佳实践

### 1. 命名约定

- 组合式函数使用 `use` 开头命名，例如 `useCounter`、`useFetch`
- 返回的响应式数据使用有意义的名称
- 避免过于通用或模糊的函数名

### 2. 组合式函数的边界

- 组合式函数应该专注于单一功能
- 避免在一个组合式函数中处理过多不同的逻辑
- 当组合式函数变得复杂时，考虑将其拆分为更小的组合式函数

### 3. 状态管理最佳实践

- 对于简单状态，使用组件内部的 `ref` 和 `reactive`
- 对于跨组件状态，使用组合式函数共享逻辑
- 对于复杂应用状态，考虑使用 Pinia 或 Vuex

### 4. 性能优化

- 避免在组合式函数中创建不必要的响应式数据
- 使用 `shallowRef` 和 `shallowReactive` 处理大型对象
- 合理使用 `markRaw` 跳过不需要响应式的数据
- 使用 `watchEffect` 时注意清理副作用

```javascript
// 好的做法：清理副作用
watchEffect((onCleanup) => {
  const timer = setTimeout(() => {
    console.log('定时器触发')
  }, 1000)
  
  // 清理函数
  onCleanup(() => {
    clearTimeout(timer)
  })
})
```

### 5. 代码组织

- 将相关的组合式函数放在同一文件或目录中
- 按功能模块组织组合式函数
- 提供清晰的文档和注释

## 六、实战案例：构建类型安全的表单组件

下面是一个完整的实战案例，展示如何使用组合式API和TypeScript构建一个类型安全的表单组件：

```vue
<!-- TypeSafeForm.vue -->
<script setup lang="ts">
import { reactive, computed, Ref } from 'vue'

// 表单字段类型定义
interface FormField<T> {
  value: T
  error: string | null
  touched: boolean
  validate: () => boolean
}

// 表单配置选项
interface FormOptions<T extends Record<string, any>> {
  initialValues: T
  onSubmit: (values: T) => Promise<void> | void
}

// 定义props
interface Props<T extends Record<string, any>> {
  options: FormOptions<T>
}

const props = defineProps<Props<any>>()

// 创建表单字段
const fields = reactive<Record<string, FormField<any>>>({})

// 初始化表单
Object.entries(props.options.initialValues).forEach(([key, value]) => {
  fields[key] = {
    value,
    error: null,
    touched: false,
    validate: () => true // 默认验证函数
  }
})

// 表单是否有效
const isValid = computed(() => {
  return Object.values(fields).every(field => {
    return field.touched ? field.error === null : true
  })
})

// 表单数据
const formData = computed(() => {
  const data: Record<string, any> = {}
  Object.entries(fields).forEach(([key, field]) => {
    data[key] = field.value
  })
  return data
})

// 更新字段值
const updateField = (name: string, value: any) => {
  if (fields[name]) {
    fields[name].value = value
    if (fields[name].touched) {
      fields[name].validate()
    }
  }
}

// 标记字段为已触摸
const touchField = (name: string) => {
  if (fields[name]) {
    fields[name].touched = true
    fields[name].validate()
  }
}

// 设置字段验证器
const setFieldValidator = (name: string, validator: (value: any) => string | null | true) => {
  if (fields[name]) {
    const originalValidate = fields[name].validate
    fields[name].validate = () => {
      const result = validator(fields[name].value)
      fields[name].error = result === true ? null : result
      return fields[name].error === null
    }
    
    // 如果字段已触摸，重新验证
    if (fields[name].touched) {
      fields[name].validate()
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  // 标记所有字段为已触摸并验证
  Object.keys(fields).forEach(name => {
    fields[name].touched = true
    fields[name].validate()
  })
  
  if (isValid.value) {
    await props.options.onSubmit(formData.value)
  }
}

// 重置表单
const resetForm = () => {
  Object.entries(props.options.initialValues).forEach(([key, value]) => {
    if (fields[key]) {
      fields[key].value = value
      fields[key].error = null
      fields[key].touched = false
    }
  })
}

// 暴露给父组件的方法
defineExpose({
  updateField,
  touchField,
  setFieldValidator,
  resetForm,
  formData
})
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <slot :fields="fields" :updateField="updateField" :touchField="touchField"></slot>
    
    <div class="form-actions">
      <button type="button" @click="resetForm">重置</button>
      <button type="submit" :disabled="!isValid">提交</button>
    </div>
  </form>
</template>
```

使用类型安全的表单组件：

```vue
<script setup lang="ts">
import { ref } from 'vue'
import TypeSafeForm from './TypeSafeForm.vue'

interface LoginForm {
  username: string
  password: string
  rememberMe: boolean
}

const formRef = ref<InstanceType<typeof TypeSafeForm> | null>(null)
const formOptions = {
  initialValues: {
    username: '',
    password: '',
    rememberMe: false
  } as LoginForm,
  onSubmit: async (values: LoginForm) => {
    console.log('提交表单:', values)
    // 模拟API调用
    // await loginApi(values)
  }
}

// 设置验证规则
sconst setValidations = () => {
  if (formRef.value) {
    formRef.value.setFieldValidator('username', (value) => {
      if (!value) return '用户名不能为空'
      if (value.length < 3) return '用户名至少需要3个字符'
      return true
    })
    
    formRef.value.setFieldValidator('password', (value) => {
      if (!value) return '密码不能为空'
      if (value.length < 6) return '密码至少需要6个字符'
      return true
    })
  }
}
</script>

<template>
  <div class="login-form">
    <h2>用户登录</h2>
    <TypeSafeForm ref="formRef" :options="formOptions" v-slot="{ fields, updateField, touchField }">
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          type="text"
          :value="fields.username.value"
          @input="updateField('username', $event.target.value)"
          @blur="touchField('username')"
          :class="{ error: fields.username.touched && fields.username.error }"
        />
        <span v-if="fields.username.touched && fields.username.error" class="error-message">
          {{ fields.username.error }}
        </span>
      </div>
      
      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          type="password"
          :value="fields.password.value"
          @input="updateField('password', $event.target.value)"
          @blur="touchField('password')"
          :class="{ error: fields.password.touched && fields.password.error }"
        />
        <span v-if="fields.password.touched && fields.password.error" class="error-message">
          {{ fields.password.error }}
        </span>
      </div>
      
      <div class="form-group checkbox">
        <label>
          <input
            type="checkbox"
            :checked="fields.rememberMe.value"
            @change="updateField('rememberMe', $event.target.checked)"
          />
          记住我
        </label>
      </div>
    </TypeSafeForm>
  </div>
</template>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

input[type="text"],
input[type="password"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
}

input.error {
  border-color: #e74c3c;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button[type="submit"] {
  background-color: #42b983;
  color: white;
}

button[type="submit"]:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
}
</style>
```

## 总结

Vue 3 的组合式API为我们提供了一种更灵活、更强大的方式来组织组件逻辑。通过本文介绍的组合式函数模式、最佳实践和实战案例，我们可以更好地利用这一特性来构建可维护、可复用的Vue应用。

主要内容回顾：

1. **组合式API基础**：setup函数和响应式API
2. **组合式函数模式**：基本组合式函数、异步操作、事件处理和状态管理
3. **高级模式**：工厂模式、可配置组合式函数、生命周期钩子和组合式函数的组合
4. **TypeScript集成**：类型安全的组合式函数和泛型组合式函数
5. **最佳实践**：命名约定、组合式函数边界、状态管理和性能优化
6. **实战案例**：类型安全的表单组件实现

通过不断实践和总结，我们可以掌握更多组合式API的高级技巧，构建出更加优雅、高效的Vue 3应用。