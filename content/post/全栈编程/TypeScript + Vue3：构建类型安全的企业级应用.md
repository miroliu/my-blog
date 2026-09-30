---
title: "TypeScript + Vue3：构建类型安全的企业级应用"
date: 2025-10-30T09:25:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["TypeScript", "Vue3", "企业级应用", "类型安全", "Composition API", "高级应用", "实战"]
license: ""
hidden: false
---

# TypeScript + Vue3：构建类型安全的企业级应用

## 前言

在现代前端开发中，构建类型安全的应用程序变得越来越重要。TypeScript 提供了强大的类型系统，而 Vue 3 的 Composition API 则为我们提供了更灵活的代码组织方式。本文将深入探讨如何结合 TypeScript 和 Vue 3 的优势，构建类型安全、可维护的企业级应用程序，并通过实际案例展示最佳实践。

## TypeScript 与 Vue 3 的结合优势

### 1. 完整的类型支持

Vue 3 从设计之初就考虑了对 TypeScript 的支持，提供了完整的类型定义。结合 TypeScript，我们可以获得以下好处：

- **编译时类型检查**：在开发阶段捕获潜在错误
- **智能代码补全**：IDE 能够提供更准确的代码提示
- **类型文档**：类型定义本身就是最好的文档
- **重构安全性**：重构代码时更加安全可靠

### 2. Composition API 与 TypeScript 的完美配合

Vue 3 的 Composition API 与 TypeScript 结合得非常好：

- **函数式编程风格**：更符合 TypeScript 的类型推断
- **更好的类型推导**：自动推断响应式数据的类型
- **类型安全的组合式函数**：自定义 hooks 可以有明确的类型定义
- **模块间的类型共享**：更容易共享和复用类型定义

## 项目设置与配置

### 初始化项目

使用 Vite 创建一个 Vue 3 + TypeScript 项目：

```bash
npm create vite@latest enterprise-app -- --template vue-ts
cd enterprise-app
npm install
```

### TypeScript 配置优化

让我们优化 `tsconfig.json` 配置，以获得更好的开发体验：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "typeRoots": ["./node_modules/@types", "./src/types"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Vite 配置优化

在 `vite.config.ts` 中添加路径别名和其他优化配置：

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

## 类型系统设计

### 核心类型定义

在企业级应用中，建立一个完善的类型系统至关重要。让我们创建一个集中的类型定义文件：

```typescript
// src/types/index.ts

// 通用分页响应接口
export interface PaginationResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

// API 响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'manager' | 'user';

// 产品相关类型
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  categoryId: string;
  images: string[];
  inventory: {
    quantity: number;
    sku: string;
  };
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 订单相关类型
export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type PaymentMethod = 'credit_card' | 'paypal' | 'bank_transfer';
```

### API 服务类型定义

为 API 服务创建类型安全的接口：

```typescript
// src/services/api/types.ts

import { User, Product, Order, PaginationResponse, ApiResponse } from '@/types';

// 用户服务接口
export interface UserService {
  getUsers(params?: UserListParams): Promise<PaginationResponse<User>>;
  getUserById(id: string): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
  updateUser(id: string, data: UpdateUserDto): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
}

// 产品服务接口
export interface ProductService {
  getProducts(params?: ProductListParams): Promise<PaginationResponse<Product>>;
  getProductById(id: string): Promise<Product>;
  createProduct(data: CreateProductDto): Promise<Product>;
  updateProduct(id: string, data: UpdateProductDto): Promise<Product>;
  deleteProduct(id: string): Promise<boolean>;
}

// 订单服务接口
export interface OrderService {
  getOrders(params?: OrderListParams): Promise<PaginationResponse<Order>>;
  getOrderById(id: string): Promise<Order>;
  createOrder(data: CreateOrderDto): Promise<Order>;
  updateOrder(id: string, data: UpdateOrderDto): Promise<Order>;
  cancelOrder(id: string): Promise<Order>;
}

// 数据传输对象 (DTOs)
export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  permissions?: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserListParams {
  page?: number;
  perPage?: number;
  role?: UserRole;
  search?: string;
  sortBy?: 'createdAt' | 'username' | 'email';
  sortOrder?: 'asc' | 'desc';
}

// 其他参数和 DTO 接口定义...
```

## 类型安全的状态管理

使用 Pinia 创建类型安全的状态管理：

```typescript
// src/stores/userStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { User, UserRole } from '@/types';
import { userApi } from '@/services/api';

export const useUserStore = defineStore('user', () => {
  // 状态
  const currentUser = ref<User | null>(null);
  const token = ref<string | null>(null);
  const users = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => currentUser.value?.role === 'admin');
  const isManager = computed(() => 
    currentUser.value?.role === 'admin' || currentUser.value?.role === 'manager'
  );

  // 方法
  const login = async (email: string, password: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await userApi.login({ email, password });
      token.value = response.token;
      currentUser.value = response.user;
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response;
    } catch (err: any) {
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await userApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      token.value = null;
      currentUser.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const initializeAuth = () => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken;
        currentUser.value = JSON.parse(savedUser);
      } catch (err) {
        console.error('Failed to parse user data:', err);
        logout();
      }
    }
  };

  const fetchUsers = async (params = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await userApi.getUsers(params);
      users.value = response.data;
      return response;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch users';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const hasPermission = (permission: string) => {
    return currentUser.value?.permissions.includes(permission) || false;
  };

  return {
    // 状态
    currentUser,
    token,
    users,
    loading,
    error,
    // 计算属性
    isAuthenticated,
    isAdmin,
    isManager,
    // 方法
    login,
    logout,
    initializeAuth,
    fetchUsers,
    hasPermission
  };
});
```

## 类型安全的组件开发

### 1. 类型化组件 Props 和 Emits

使用 TypeScript 为组件的 Props 和 Emits 添加类型：

```vue
<template>
  <div class="user-card">
    <div class="user-avatar">
      {{ userInitials }}
    </div>
    <div class="user-info">
      <h3>{{ user.firstName }} {{ user.lastName }}</h3>
      <p class="user-email">{{ user.email }}</p>
      <div class="user-role" :class="`role-${user.role}`">
        {{ roleLabel }}
      </div>
    </div>
    <div class="user-actions">
      <el-button type="primary" size="small" @click="handleEdit">编辑</el-button>
      <el-button type="danger" size="small" @click="handleDelete">删除</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { User, UserRole } from '@/types';

// Props 类型定义
interface Props {
  user: User;
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: true
});

// Emits 类型定义
const emit = defineEmits<{
  (e: 'edit', userId: string): void;
  (e: 'delete', userId: string): void;
}>();

// 计算属性
const userInitials = computed(() => {
  return `${props.user.firstName.charAt(0)}${props.user.lastName.charAt(0)}`.toUpperCase();
});

const roleLabel = computed(() => {
  const roleLabels: Record<UserRole, string> = {
    admin: '管理员',
    manager: '经理',
    user: '普通用户'
  };
  return roleLabels[props.user.role];
});

// 方法
const handleEdit = () => {
  if (props.editable) {
    emit('edit', props.user.id);
  }
};

const handleDelete = () => {
  if (props.editable) {
    emit('delete', props.user.id);
  }
};
</script>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  margin-right: 16px;
}

.user-info {
  flex: 1;
}

.user-email {
  color: #606266;
  margin: 4px 0;
}

.user-role {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.role-admin {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.role-manager {
  background-color: #ecf5ff;
  color: #409eff;
}

.role-user {
  background-color: #f0f9eb;
  color: #67c23a;
}

.user-actions {
  display: flex;
  gap: 8px;
}
</style>
```

### 2. 类型安全的组合式函数

创建类型安全的组合式函数，实现业务逻辑复用：

```typescript
// src/composables/useFormValidation.ts
import { ref, reactive } from 'vue';

interface ValidationRule {
  required?: boolean;
  message: string;
  validator?: (value: any) => boolean;
}

export function useFormValidation<T extends Record<string, any>>() {
  const form = reactive<T>({} as T);
  const errors = reactive<Partial<Record<keyof T, string>>>({});
  const loading = ref(false);
  const rules = reactive<Partial<Record<keyof T, ValidationRule[]>>>({});

  const validateField = (field: keyof T): boolean => {
    const fieldRules = rules[field];
    if (!fieldRules) return true;

    for (const rule of fieldRules) {
      // 检查必填
      if (rule.required && (!form[field] || form[field].toString().trim() === '')) {
        errors[field] = rule.message;
        return false;
      }

      // 自定义验证器
      if (rule.validator && !rule.validator(form[field])) {
        errors[field] = rule.message;
        return false;
      }
    }

    // 清除错误
    delete errors[field];
    return true;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    
    Object.keys(rules).forEach(field => {
      const fieldValid = validateField(field as keyof T);
      if (!fieldValid) isValid = false;
    });

    return isValid;
  };

  const setRules = (newRules: Partial<Record<keyof T, ValidationRule[]>>) => {
    Object.assign(rules, newRules);
  };

  const resetForm = () => {
    Object.keys(form).forEach(key => {
      delete form[key];
    });
    Object.keys(errors).forEach(key => {
      delete errors[key];
    });
  };

  return {
    form,
    errors,
    loading,
    rules,
    validateField,
    validateForm,
    setRules,
    resetForm
  };
}
```

使用这个组合式函数：

```vue
<template>
  <el-form :model="form" @submit.prevent="handleSubmit">
    <el-form-item label="用户名" :error="errors.username">
      <el-input
        v-model="form.username"
        placeholder="请输入用户名"
        @blur="validateField('username')"
      />
    </el-form-item>
    
    <el-form-item label="邮箱" :error="errors.email">
      <el-input
        v-model="form.email"
        type="email"
        placeholder="请输入邮箱"
        @blur="validateField('email')"
      />
    </el-form-item>
    
    <el-form-item label="密码" :error="errors.password">
      <el-input
        v-model="form.password"
        type="password"
        placeholder="请输入密码"
        @blur="validateField('password')"
      />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" :loading="loading" native-type="submit">
        提交
      </el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { useFormValidation } from '@/composables/useFormValidation';
import { ElMessage } from 'element-plus';

interface UserForm {
  username: string;
  email: string;
  password: string;
}

const emit = defineEmits<{
  (e: 'submit', formData: UserForm): void;
}>();

// 使用表单验证组合式函数
const {
  form,
  errors,
  loading,
  validateField,
  validateForm,
  setRules,
  resetForm
} = useFormValidation<UserForm>();

// 设置验证规则
setRules({
  username: [
    { required: true, message: '请输入用户名' },
    { 
      validator: (value) => value.length >= 3 && value.length <= 20, 
      message: '用户名长度应在3-20个字符之间'
    }
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { 
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 
      message: '请输入有效的邮箱地址'
    }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { 
      validator: (value) => value.length >= 6, 
      message: '密码长度至少为6个字符'
    }
  ]
});

// 提交表单
const handleSubmit = async () => {
  if (!validateForm()) {
    ElMessage.error('请检查表单填写是否正确');
    return;
  }

  try {
    loading.value = true;
    emit('submit', { ...form });
    ElMessage.success('表单提交成功');
  } catch (error) {
    ElMessage.error('表单提交失败');
  } finally {
    loading.value = false;
  }
};
</script>
```

### 3. 类型安全的路由和导航

使用 TypeScript 增强 Vue Router 的类型安全性：

```typescript
// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Layout from '@/components/layout/Layout.vue';
import { useUserStore } from '@/stores/userStore';

// 类型定义
interface RouteMeta {
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresManager?: boolean;
  permissions?: string[];
  title?: string;
}

declare module 'vue-router' {
  interface RouteMeta extends RouteMeta {}
}

// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '仪表盘' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/Users.vue'),
        meta: { 
          title: '用户管理',
          requiresManager: true,
          permissions: ['user:read']
        }
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/products/Products.vue'),
        meta: { 
          title: '产品管理',
          permissions: ['product:read']
        }
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: () => import('@/views/products/ProductDetail.vue'),
        props: true,
        meta: { 
          title: '产品详情',
          permissions: ['product:read']
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// 全局前置守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  
  // 初始化认证状态
  if (!userStore.token && !userStore.isAuthenticated) {
    userStore.initializeAuth();
  }
  
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 企业管理系统` : '企业管理系统';
  
  // 检查是否需要认证
  if (to.meta.requiresAuth !== false && !userStore.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }
  
  // 已认证用户访问登录页，重定向到首页
  if (to.name === 'Login' && userStore.isAuthenticated) {
    return next({ name: 'Dashboard' });
  }
  
  // 检查权限
  if (to.meta.permissions) {
    const hasPermission = to.meta.permissions.some(permission => 
      userStore.hasPermission(permission)
    );
    
    if (!hasPermission) {
      return next({ name: 'NotFound' });
    }
  }
  
  // 检查是否需要管理员权限
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return next({ name: 'NotFound' });
  }
  
  // 检查是否需要经理权限
  if (to.meta.requiresManager && !userStore.isManager) {
    return next({ name: 'NotFound' });
  }
  
  next();
});

export default router;
```

## 类型安全的 API 服务

创建类型安全的 API 服务层：

```typescript
// src/services/api/index.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';
import { useUserStore } from '@/stores/userStore';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const userStore = useUserStore();
    const token = userStore.token || localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<ApiResponse>) => {
    const userStore = useUserStore();
    
    // 处理认证错误
    if (error.response?.status === 401) {
      userStore.logout();
      window.location.href = '/login';
    }
    
    // 处理其他错误
    const errorMessage = error.response?.data?.error?.message || '网络请求失败';
    return Promise.reject(new Error(errorMessage));
  }
);

// 导出 API 服务
export * from './userApi';
export * from './productApi';
export * from './orderApi';

export default apiClient;
```

实现具体的 API 服务：

```typescript
// src/services/api/userApi.ts
import apiClient from '.';
import { User, UserRole, PaginationResponse, ApiResponse } from '@/types';
import { UserListParams, CreateUserDto, UpdateUserDto, LoginCredentials, AuthResponse } from './types';

class UserApiService implements UserService {
  async getUsers(params?: UserListParams): Promise<PaginationResponse<User>> {
    return apiClient.get('/users', { params });
  }

  async getUserById(id: string): Promise<User> {
    return apiClient.get(`/users/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return apiClient.post('/users', data);
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    return apiClient.put(`/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<boolean> {
    await apiClient.delete(`/users/${id}`);
    return true;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post('/auth/login', credentials);
  }

  async logout(): Promise<void> {
    return apiClient.post('/auth/logout');
  }
}

export const userApi = new UserApiService();
export interface UserService {
  getUsers(params?: UserListParams): Promise<PaginationResponse<User>>;
  getUserById(id: string): Promise<User>;
  createUser(data: CreateUserDto): Promise<User>;
  updateUser(id: string, data: UpdateUserDto): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  logout(): Promise<void>;
}
```

## 企业级应用实战：权限管理系统

让我们创建一个企业级权限管理系统，展示 TypeScript 和 Vue 3 的结合使用：

### 1. 权限管理组件

```vue
<template>
  <el-card shadow="hover">
    <template #header>
      <div class="card-header">
        <span>角色权限管理</span>
        <el-button type="primary" size="small" @click="showAddRoleDialog = true">
          添加角色
        </el-button>
      </div>
    </template>
    
    <el-table
      v-loading="loading"
      :data="roles"
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="角色名称" />
      <el-table-column prop="description" label="角色描述" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="editRole(scope.row)">
            编辑
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="deleteRole(scope.row)"
            :disabled="scope.row.name === 'admin'"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="showAddRoleDialog"
      :title="editingRole ? '编辑角色' : '添加角色'"
      width="50%"
    >
      <el-form :model="roleForm" :rules="roleFormRules" ref="roleFormRef">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input 
            v-model="roleForm.description" 
            type="textarea" 
            placeholder="请输入角色描述"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="权限设置">
          <el-tree
            v-model="roleForm.permissions"
            :data="permissionTree"
            show-checkbox
            node-key="id"
            :default-expand-all="true"
            :props="{
              children: 'children',
              label: 'name'
            }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddRoleDialog = false">取消</el-button>
          <el-button type="primary" @click="handleRoleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { roleApi } from '@/services/api';
import { Role, Permission } from '@/types';

// 响应式数据
const loading = ref(false);
const roles = ref<Role[]>([]);
const selectedRoles = ref<Role[]>([]);
const showAddRoleDialog = ref(false);
const editingRole = ref<Role | null>(null);
const roleFormRef = ref();

// 角色表单
const roleForm = reactive({
  name: '',
  description: '',
  permissions: [] as string[]
});

// 角色表单验证规则
const roleFormRules = reactive({
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度应在 2 到 20 个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入角色描述', trigger: 'blur' }
  ]
});

// 权限树数据
const permissionTree = ref<Permission[]>([]);

// 加载角色列表
const fetchRoles = async () => {
  try {
    loading.value = true;
    const response = await roleApi.getRoles();
    roles.value = response.data;
  } catch (error) {
    ElMessage.error('获取角色列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载权限列表
const fetchPermissions = async () => {
  try {
    const response = await roleApi.getPermissions();
    permissionTree.value = response.data;
  } catch (error) {
    ElMessage.error('获取权限列表失败');
  }
};

// 编辑角色
const editRole = (role: Role) => {
  editingRole.value = { ...role };
  roleForm.name = role.name;
  roleForm.description = role.description;
  roleForm.permissions = [...role.permissions];
  showAddRoleDialog.value = true;
};

// 删除角色
const deleteRole = async (role: Role) => {
  if (role.name === 'admin') {
    ElMessage.warning('管理员角色不能删除');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除角色「${role.name}」吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await roleApi.deleteRole(role.id);
    ElMessage.success('角色删除成功');
    await fetchRoles();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('角色删除失败');
    }
  }
};

// 提交角色表单
const handleRoleSubmit = async () => {
  try {
    await roleFormRef.value.validate();
    
    if (editingRole.value) {
      // 更新角色
      await roleApi.updateRole(editingRole.value.id, {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions
      });
      ElMessage.success('角色更新成功');
    } else {
      // 创建角色
      await roleApi.createRole({
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions
      });
      ElMessage.success('角色创建成功');
    }
    
    showAddRoleDialog.value = false;
    await fetchRoles();
    resetForm();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

// 重置表单
const resetForm = () => {
  roleForm.name = '';
  roleForm.description = '';
  roleForm.permissions = [];
  editingRole.value = null;
  if (roleFormRef.value) {
    roleFormRef.value.resetFields();
  }
};

// 处理表格选择
const handleSelectionChange = (selection: Role[]) => {
  selectedRoles.value = selection;
};

// 初始化
onMounted(async () => {
  await Promise.all([
    fetchRoles(),
    fetchPermissions()
  ]);
});
</script>
```

### 2. 用户管理系统的类型定义

```typescript
// src/types/permission.ts

// 权限定义
export interface Permission {
  id: string;
  name: string;
  description: string;
  code: string;
  children?: Permission[];
}

// 角色定义
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// 角色相关的DTO
export interface CreateRoleDto {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleListParams {
  page?: number;
  perPage?: number;
  search?: string;
}
```

### 3. 权限指令

创建类型安全的权限指令：

```typescript
// src/directives/permission.ts
import { App, DirectiveBinding } from 'vue';
import { useUserStore } from '@/stores/userStore';

// 权限指令
const permissionDirective = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const userStore = useUserStore();
    const permissions = binding.value;
    
    // 检查权限
    const hasPermission = Array.isArray(permissions)
      ? permissions.some(permission => userStore.hasPermission(permission))
      : userStore.hasPermission(permissions);
    
    // 无权限时隐藏元素
    if (!hasPermission) {
      el.style.display = 'none';
    }
  },
  // 当权限发生变化时更新
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const userStore = useUserStore();
    const permissions = binding.value;
    
    const hasPermission = Array.isArray(permissions)
      ? permissions.some(permission => userStore.hasPermission(permission))
      : userStore.hasPermission(permissions);
    
    if (hasPermission) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  }
};

// 注册指令
export function registerPermissionDirective(app: App) {
  app.directive('permission', permissionDirective);
}
```

使用权限指令：

```vue
<template>
  <el-button v-permission="'user:create" type="primary">添加用户</el-button>
  <el-button v-permission="['user:edit', 'user:update']" type="success">编辑用户</el-button>
  <div v-permission="'dashboard:view'">
    <!-- 仪表盘内容 -->
  </div>
</template>
```

## 性能优化和最佳实践

### 1. 代码分割和懒加载

使用动态导入实现代码分割和懒加载：

```typescript
// 路由懒加载
const Users = () => import('@/views/users/Users.vue');
const Products = () => import('@/views/products/Products.vue');
const Orders = () => import('@/views/orders/Orders.vue');

// 组件懒加载
const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'));
```

### 2. 虚拟滚动处理大数据

```vue
<el-table-v2
  :columns="columns"
  :data="data"
  :height="400"
  :item-height="47"
  :row-key="row => row.id"
/>
```

### 3. 响应式数据优化

对于大型对象，使用 shallowRef 或 markRaw：

```typescript
import { shallowRef, markRaw } from 'vue';

// 不需要深度响应的大型对象
const largeConfig = shallowRef({
  // 大型配置对象
});

// 完全不需要响应性的第三方库实例
const chartInstance = markRaw(createChart());
```

### 4. 避免不必要的重新渲染

使用 v-memo 避免不必要的重新渲染：

```vue
<div v-for="item in items" v-memo="[item.id, item.updatedAt]">
  {{ item.name }}
</div>
```

### 5. 类型安全的组合式函数最佳实践

```typescript
// 使用泛型创建类型安全的组合式函数
export function useApi<T>(endpoint: string) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchData = async (params?: any) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await apiClient.get<T>(endpoint, { params });
      data.value = response;
      return response;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    data,
    loading,
    error,
    fetchData
  };
}

// 使用示例
const { data: products, loading, error, fetchData } = useApi<Product[]>('/products');
```

## 总结

本文深入探讨了如何结合 TypeScript 和 Vue 3 构建类型安全的企业级应用，通过详细的代码示例和最佳实践，展示了这两种技术的强大组合。主要内容包括：

1. **TypeScript 与 Vue 3 的结合优势**：静态类型检查、智能代码补全、更好的可维护性
2. **项目设置与配置**：TypeScript 和 Vite 配置优化
3. **类型系统设计**：核心类型定义、API 服务类型定义
4. **类型安全的状态管理**：使用 Pinia 创建类型安全的 Store
5. **类型安全的组件开发**：组件 Props 和 Emits 类型化、组合式函数、路由和导航
6. **类型安全的 API 服务**：创建类型安全的 API 服务层
7. **企业级应用实战**：权限管理系统实现
8. **性能优化和最佳实践**：代码分割、虚拟滚动、响应式数据优化

通过结合 TypeScript 和 Vue 3，我们可以构建出类型安全、性能优异、易于维护的企业级应用。在实际项目中，应该充分利用 TypeScript 的类型系统和 Vue 3 的 Composition API，建立完善的类型定义和组件体系，提高开发效率和代码质量。

希望本文对您在企业级应用开发中使用 TypeScript 和 Vue 3 有所帮助！