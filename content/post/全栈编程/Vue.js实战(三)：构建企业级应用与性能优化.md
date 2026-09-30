---
title: "Vue.js实战(三)：构建企业级应用与性能优化"
date: 2025-10-30T09:25:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["Vue.js", "企业级应用", "性能优化", "Vue 3", "Composition API", "实战案例"]
license: ""
hidden: false
---

# Vue.js实战(三)：构建企业级应用与性能优化

## 前言

在前两篇教程中，我们学习了Vue.js的基础概念、组件系统、状态管理和路由。在本文中，我们将深入探讨如何使用Vue.js构建企业级应用，并重点关注性能优化策略。企业级应用通常具有复杂的业务逻辑、大量的数据处理和严格的性能要求，因此需要更全面的架构设计和优化方案。

## 项目概述

我们将构建一个企业级的电商管理系统，具有以下功能：

1. 产品管理（CRUD操作）
2. 用户管理和权限控制
3. 订单管理
4. 数据可视化仪表盘
5. 响应式设计，支持多设备访问

### 技术栈

- **前端**：
  - Vue 3 + Composition API
  - TypeScript
  - Vue Router 4
  - Pinia（新一代状态管理）
  - Element Plus（UI组件库）
  - Axios（HTTP客户端）
  - ECharts（数据可视化）

- **构建工具**：
  - Vite（更快的开发体验）
  - Vitest（单元测试）
  - ESLint + Prettier（代码规范）

- **后端**（模拟）：
  - JSON Server（模拟API）

## 项目架构设计

### 目录结构

```
ecommerce-admin/
├── public/
├── src/
│   ├── assets/         # 静态资源
│   ├── components/     # 通用组件
│   │   ├── common/     # 基础UI组件
│   │   ├── business/   # 业务组件
│   │   └── layout/     # 布局组件
│   ├── composables/    # 可复用的组合式函数
│   ├── directives/     # 自定义指令
│   ├── hooks/          # 自定义Hooks
│   ├── locales/        # 国际化资源
│   ├── pages/          # 页面组件
│   ├── router/         # 路由配置
│   ├── services/       # API服务
│   ├── stores/         # Pinia状态管理
│   ├── types/          # TypeScript类型定义
│   ├── utils/          # 工具函数
│   ├── App.vue
│   ├── main.ts
│   └── vite-env.d.ts
├── tests/              # 测试文件
├── .eslintrc.js
├── .prettierrc.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── package.json
```

### 核心架构原则

1. **组件化**：将UI拆分为可复用的组件，每个组件负责特定的功能
2. **关注点分离**：业务逻辑、状态管理和UI展示分离
3. **类型安全**：全面使用TypeScript确保类型安全
4. **响应式设计**：使用Composition API实现响应式状态管理
5. **可扩展性**：模块化设计，便于未来功能扩展
6. **性能优化**：采用懒加载、虚拟滚动等技术提升性能

## 项目初始化

### 创建项目

```bash
npm create vite@latest ecommerce-admin -- --template vue-ts
cd ecommerce-admin
npm install
```

### 安装依赖

```bash
# 核心依赖
npm install vue-router@4 pinia axios element-plus echarts

# 开发依赖
npm install -D vitest @testing-library/vue eslint prettier @vue/eslint-config-prettier @vue/eslint-config-typescript

# 模拟后端
npm install -D json-server
```

### 配置文件

#### vite.config.ts

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
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    // 构建优化配置
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // 分割代码块
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          elementPlus: ['element-plus'],
          echarts: ['echarts']
        }
      }
    }
  }
});
```

#### tsconfig.json

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
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 核心功能实现

### 1. 路由配置

创建`src/router/index.ts`：

```typescript
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Layout from '@/components/layout/Layout.vue';

// 懒加载路由组件
const Dashboard = () => import('@/pages/Dashboard.vue');
const Products = () => import('@/pages/Products.vue');
const ProductDetail = () => import('@/pages/ProductDetail.vue');
const Orders = () => import('@/pages/Orders.vue');
const Users = () => import('@/pages/Users.vue');
const Login = () => import('@/pages/Login.vue');
const NotFound = () => import('@/pages/NotFound.vue');

// 路由守卫
const requireAuth = (to: any, from: any, next: any) => {
  const isLoggedIn = localStorage.getItem('token');
  if (isLoggedIn) {
    next();
  } else {
    next('/login');
  }
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: 'products',
        name: 'Products',
        component: Products
      },
      {
        path: 'products/:id',
        name: 'ProductDetail',
        component: ProductDetail,
        props: true
      },
      {
        path: 'orders',
        name: 'Orders',
        component: Orders
      },
      {
        path: 'users',
        name: 'Users',
        component: Users
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// 全局前置守卫
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    requireAuth(to, from, next);
  } else {
    next();
  }
});

export default router;
```

### 2. 状态管理

创建`src/stores/user.ts`：

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi, logout as logoutApi } from '@/services/auth';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  permissions: string[];
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);
  const hasPermission = computed(() => (perm: string) => {
    return user.value?.permissions.includes(perm) || false;
  });

  const login = async (username: string, password: string) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await loginApi(username, password);
      user.value = response.user;
      token.value = response.token;
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err: any) {
      error.value = err.message || 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const initializeUser = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      token.value = storedToken;
      try {
        user.value = JSON.parse(storedUser);
      } catch (err) {
        console.error('Failed to parse user data:', err);
        logout();
      }
    }
  };

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    hasPermission,
    login,
    logout,
    initializeUser
  };
});
```

创建`src/stores/product.ts`：

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { 
  getProducts as getProductsApi,
  getProductById as getProductByIdApi,
  createProduct as createProductApi,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi
} from '@/services/product';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
}

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const currentProduct = ref<Product | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    limit: 10,
    total: 0
  });

  const totalPages = computed(() => 
    Math.ceil(pagination.value.total / pagination.value.limit)
  );

  const getProducts = async (page = 1, limit = 10, filters = {}) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await getProductsApi(page, limit, filters);
      products.value = response.data;
      pagination.value = {
        page,
        limit,
        total: response.total
      };
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch products';
    } finally {
      loading.value = false;
    }
  };

  const getProductById = async (id: number) => {
    try {
      loading.value = true;
      error.value = null;
      const product = await getProductByIdApi(id);
      currentProduct.value = product;
      return product;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createProduct = async (productData: ProductFormData) => {
    try {
      loading.value = true;
      error.value = null;
      const newProduct = await createProductApi(productData);
      products.value.unshift(newProduct);
      pagination.value.total++;
      return newProduct;
    } catch (err: any) {
      error.value = err.message || 'Failed to create product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateProduct = async (id: number, productData: Partial<ProductFormData>) => {
    try {
      loading.value = true;
      error.value = null;
      const updatedProduct = await updateProductApi(id, productData);
      
      // 更新列表中的产品
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        products.value[index] = updatedProduct;
      }
      
      // 更新当前产品（如果正在查看的是这个产品）
      if (currentProduct.value?.id === id) {
        currentProduct.value = updatedProduct;
      }
      
      return updatedProduct;
    } catch (err: any) {
      error.value = err.message || 'Failed to update product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteProduct = async (id: number) => {
    try {
      loading.value = true;
      error.value = null;
      await deleteProductApi(id);
      
      // 从列表中移除产品
      products.value = products.value.filter(p => p.id !== id);
      pagination.value.total--;
      
      // 清除当前产品（如果正在查看的是这个产品）
      if (currentProduct.value?.id === id) {
        currentProduct.value = null;
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to delete product';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    currentProduct,
    loading,
    error,
    pagination,
    totalPages,
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
  };
});
```

### 3. API服务

创建`src/services/api.ts`：

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiInstance extends AxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

// 创建axios实例
const api: ApiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token');
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
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    // 处理错误响应
    if (error.response) {
      // 服务器返回错误状态码
      switch (error.response.status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          // 禁止访问
          console.error('Forbidden');
          break;
        case 404:
          // 资源未找到
          console.error('Not found');
          break;
        case 500:
          // 服务器错误
          console.error('Server error');
          break;
        default:
          console.error('Request failed:', error.response.data.message || 'Unknown error');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('Network error');
    } else {
      // 请求配置出错
      console.error('Request config error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
```

创建`src/services/product.ts`：

```typescript
import api from './api';
import { Product, ProductFormData } from '@/stores/product';

interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export const getProducts = async (
  page = 1,
  limit = 10,
  filters = {}
): Promise<ProductListResponse> => {
  const params = {
    page,
    limit,
    ...filters
  };
  return api.get<ProductListResponse>('/products', { params });
};

export const getProductById = async (id: number): Promise<Product> => {
  return api.get<Product>(`/products/${id}`);
};

export const createProduct = async (productData: ProductFormData): Promise<Product> => {
  return api.post<Product>('/products', productData);
};

export const updateProduct = async (
  id: number,
  productData: Partial<ProductFormData>
): Promise<Product> => {
  return api.put<Product>(`/products/${id}`, productData);
};

export const deleteProduct = async (id: number): Promise<void> => {
  return api.delete(`/products/${id}`);
};
```

### 4. 组件开发

创建`src/components/layout/Layout.vue`：

```vue
<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="250px" class="sidebar" :class="{ 'sidebar-collapsed': collapsed }">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Logo" class="logo" />
        <span class="logo-text" :class="{ 'hidden': collapsed }">E-Commerce Admin</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
      >
        <el-menu-item index="/">
          <el-icon><Document /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        
        <el-menu-item index="/products">
          <el-icon><Box /></el-icon>
          <template #title>产品管理</template>
        </el-menu-item>
        
        <el-menu-item index="/orders">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container>
      <!-- 头部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button 
            icon="el-icon-menu" 
            circle 
            @click="toggleSidebar"
            class="sidebar-toggle-btn"
          />
        </div>
        
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="36">
                {{ userInitial }}
              </el-avatar>
              <span class="user-name">{{ user?.username }}</span>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleProfile">个人资料</el-dropdown-item>
                <el-dropdown-item @click="handleLogout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 内容区域 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/stores/user';
import {
  Document,
  Box,
  ShoppingCart,
  User,
  ArrowDown
} from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const collapsed = ref(false);
const cachedViews = ref<string[]>([]);

// 计算属性
const activeMenu = computed(() => {
  return route.path;
});

const user = computed(() => userStore.user);

const userInitial = computed(() => {
  return user.value?.username.charAt(0).toUpperCase() || 'U';
});

// 方法
const toggleSidebar = () => {
  collapsed.value = !collapsed.value;
};

const handleProfile = () => {
  // 跳转到个人资料页面
};

const handleLogout = async () => {
  await userStore.logout();
  router.push('/login');
};

// 监听路由变化，添加到缓存视图
watch(
  () => route.name,
  (newName) => {
    if (newName && typeof newName === 'string') {
      if (!cachedViews.value.includes(newName)) {
        cachedViews.value.push(newName);
      }
    }
  },
  { immediate: true }
);

// 初始化
onMounted(() => {
  userStore.initializeUser();
});
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  color: #fff;
  transition: width 0.3s ease;
  overflow: hidden;
}

.sidebar-collapsed {
  width: 64px !important;
}

.logo-container {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #1f2937;
}

.logo {
  width: 32px;
  height: 32px;
  border-radius: 4px;
}

.logo-text {
  margin-left: 12px;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.logo-text.hidden {
  display: none;
}

.sidebar-menu {
  border-right: none;
  height: calc(100% - 73px);
}

.header {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
}

.sidebar-toggle-btn {
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  margin: 0 8px;
  font-size: 14px;
}

.main-content {
  background-color: #f5f7fa;
  padding: 24px;
  overflow-y: auto;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

创建`src/pages/Products.vue`：

```vue
<template>
  <div class="products-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>产品管理</span>
          <el-button type="primary" @click="handleAddProduct">
            <el-icon><Plus /></el-icon>
            添加产品
          </el-button>
        </div>
      </template>
      
      <!-- 搜索和筛选 -->
      <div class="search-filter">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchQuery"
              placeholder="搜索产品名称"
              prefix-icon="el-icon-search"
              @input="handleSearch"
            />
          </el-col>
          <el-col :span="6">
            <el-select v-model="categoryFilter" placeholder="筛选分类" clearable>
              <el-option
                v-for="category in categories"
                :key="category"
                :label="category"
                :value="category"
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="statusFilter" placeholder="筛选状态" clearable>
              <el-option label="有库存" :value="'in_stock'" />
              <el-option label="库存不足" :value="'low_stock'" />
              <el-option label="缺货" :value="'out_of_stock'" />
            </el-select>
          </el-col>
        </el-row>
      </div>
      
      <!-- 产品表格 -->
      <div class="table-wrapper">
        <el-table
          v-loading="productStore.loading"
          :data="productStore.products"
          style="width: 100%"
          @sort-change="handleSort"
        >
          <el-table-column prop="id" label="ID" width="80" sortable />
          <el-table-column prop="name" label="产品名称" min-width="200">
            <template #default="scope">
              <div class="product-name-cell">
                <img :src="scope.row.images[0]" alt="产品图片" class="product-thumb" />
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="price" label="价格" width="100" sortable>
            <template #default="scope">
              ¥{{ scope.row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="100" sortable>
            <template #default="scope">
              <span :class="getStockClass(scope.row.stock)">
                {{ scope.row.stock }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180" sortable>
            <template #default="scope">
              {{ formatDate(scope.row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleEditProduct(scope.row)">
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDeleteProduct(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="productStore.pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 产品表单对话框 -->
    <ProductForm
      :visible="showProductForm"
      :product="editingProduct"
      :title="productFormTitle"
      @save="handleSaveProduct"
      @cancel="handleCancelProduct"
    />
    
    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="showDeleteDialog"
      title="确认删除"
      width="30%"
    >
      <p>确定要删除产品「{{ deletingProduct?.name }}」吗？</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">取消</el-button>
          <el-button type="danger" @click="confirmDeleteProduct">
            确定删除
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useProductStore, Product, ProductFormData } from '@/stores/product';
import ProductForm from '@/components/business/ProductForm.vue';
import { Plus } from '@element-plus/icons-vue';
import { formatDate } from '@/utils/date';

const router = useRouter();
const productStore = useProductStore();

// 响应式数据
const showProductForm = ref(false);
const showDeleteDialog = ref(false);
const editingProduct = ref<Product | null>(null);
const deletingProduct = ref<Product | null>(null);
const searchQuery = ref('');
const categoryFilter = ref('');
const statusFilter = ref('');
const pagination = ref({
  page: 1,
  limit: 10
});
const sortField = ref('');
const sortOrder = ref('');

// 模拟分类数据
const categories = [
  '电子产品',
  '服装鞋帽',
  '食品饮料',
  '家居生活',
  '美妆个护',
  '运动户外'
];

// 计算属性
const productFormTitle = computed(() => {
  return editingProduct.value ? '编辑产品' : '添加产品';
});

// 方法
const loadProducts = async () => {
  const filters: any = {};
  
  if (searchQuery.value) {
    filters.name = searchQuery.value;
  }
  
  if (categoryFilter.value) {
    filters.category = categoryFilter.value;
  }
  
  if (statusFilter.value) {
    switch (statusFilter.value) {
      case 'in_stock':
        filters.minStock = 10;
        break;
      case 'low_stock':
        filters.minStock = 1;
        filters.maxStock = 9;
        break;
      case 'out_of_stock':
        filters.maxStock = 0;
        break;
    }
  }
  
  if (sortField.value && sortOrder.value) {
    filters.sortBy = sortField.value;
    filters.sortOrder = sortOrder.value;
  }
  
  await productStore.getProducts(pagination.value.page, pagination.value.limit, filters);
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadProducts();
};

const handleSort = ({ prop, order }: { prop: string; order: string }) => {
  sortField.value = prop;
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc';
  loadProducts();
};

const handleSizeChange = (size: number) => {
  pagination.value.limit = size;
  pagination.value.page = 1;
  loadProducts();
};

const handleCurrentChange = (current: number) => {
  pagination.value.page = current;
  loadProducts();
};

const handleAddProduct = () => {
  editingProduct.value = null;
  showProductForm.value = true;
};

const handleEditProduct = (product: Product) => {
  editingProduct.value = { ...product };
  showProductForm.value = true;
};

const handleDeleteProduct = (product: Product) => {
  deletingProduct.value = product;
  showDeleteDialog.value = true;
};

const handleSaveProduct = async (productData: ProductFormData) => {
  try {
    if (editingProduct.value) {
      // 更新产品
      await productStore.updateProduct(editingProduct.value.id, productData);
      ElMessage.success('产品更新成功');
    } else {
      // 创建产品
      await productStore.createProduct(productData);
      ElMessage.success('产品添加成功');
    }
    handleCancelProduct();
  } catch (error) {
    ElMessage.error('操作失败，请重试');
  }
};

const handleCancelProduct = () => {
  showProductForm.value = false;
  editingProduct.value = null;
};

const confirmDeleteProduct = async () => {
  if (deletingProduct.value) {
    try {
      await productStore.deleteProduct(deletingProduct.value.id);
      ElMessage.success('产品删除成功');
      showDeleteDialog.value = false;
      deletingProduct.value = null;
    } catch (error) {
      ElMessage.error('删除失败，请重试');
    }
  }
};

const getStockClass = (stock: number) => {
  if (stock === 0) return 'stock-out';
  if (stock < 10) return 'stock-low';
  return 'stock-normal';
};

// 初始化
onMounted(() => {
  loadProducts();
});
</script>

<style scoped>
.products-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-filter {
  margin-bottom: 20px;
}

.table-wrapper {
  margin-bottom: 20px;
}

.product-name-cell {
  display: flex;
  align-items: center;
}

.product-thumb {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-right: 10px;
  object-fit: cover;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.stock-out {
  color: #f56c6c;
}

.stock-low {
  color: #e6a23c;
}

.stock-normal {
  color: #67c23a;
}
</style>
```

## 性能优化策略

### 1. 代码分割与懒加载

#### 路由懒加载

```typescript
// 在router/index.ts中
const Dashboard = () => import('@/pages/Dashboard.vue');
const Products = () => import('@/pages/Products.vue');
```

#### 组件懒加载

```vue
<script setup lang="ts">
// 条件性导入重型组件
const HeavyComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'));
</script>
```

### 2. 虚拟滚动

使用Element Plus的虚拟滚动组件处理大数据列表：

```vue
<template>
  <el-virtual-list
    v-model="scrollTop"
    :data-key="'id'"
    :data-sources="orders"
    :data-component="orderItemComponent"
    :height="400"
    :item-height="80"
    :item-key="'id'"
  />
</template>
```

### 3. 缓存优化

#### 组件缓存

```vue
<keep-alive :include="cachedViews">
  <component :is="Component" />
</keep-alive>
```

#### 数据缓存

```typescript
// 在store中实现缓存逻辑
const cachedProducts = ref<Map<number, Product>>(new Map());

const getProductById = async (id: number) => {
  // 检查缓存
  if (cachedProducts.value.has(id)) {
    return cachedProducts.value.get(id)!;
  }
  
  // 缓存未命中，从API获取
  const product = await getProductByIdApi(id);
  
  // 更新缓存
  cachedProducts.value.set(id, product);
  
  return product;
};
```

### 4. 图片优化

#### 延迟加载

```vue
<img v-lazy="product.imageUrl" alt="产品图片" />
```

#### 图片压缩和格式转换

使用WebP格式和适当的压缩：

```typescript
// 图片URL构建函数
const buildImageUrl = (imagePath: string, size = 'medium') => {
  // 根据size参数返回不同尺寸的图片
  const sizeMap = {
    small: 'w_100,h_100',
    medium: 'w_300,h_300',
    large: 'w_800,h_800'
  };
  
  return `${imagePath}?${sizeMap[size as keyof typeof sizeMap]}&format=webp`;
};
```

### 5. 状态管理优化

#### 模块化Store

将状态管理按照功能模块拆分，避免单一Store过大。

#### 使用Pinia的缓存

```typescript
export const useProductStore = defineStore('product', {
  state: () => ({
    products: [],
    // ...
  }),
  getters: {
    // 缓存计算结果
    featuredProducts: (state) => {
      return state.products.filter(p => p.featured);
    }
  },
  actions: {
    // ...
  },
  // 持久化配置
  persist: {
    key: 'product-store',
    storage: localStorage,
    paths: ['filters', 'sortConfig'] // 只持久化特定字段
  }
});
```

### 6. 渲染优化

#### 使用v-memo减少不必要的渲染

```vue
<template>
  <div v-for="item in items" v-memo="[item.id, item.updatedAt]">
    {{ item.name }}
  </div>
</template>
```

#### 避免深层响应式对象

对于大对象，使用shallowRef或markRaw：

```typescript
import { shallowRef, markRaw } from 'vue';

// 对于不需要深度响应的大型配置对象
const config = shallowRef({
  // 大型配置对象
});

// 对于完全不需要响应性的对象
const externalLibraryInstance = markRaw(createExternalLibrary());
```

### 7. 网络优化

#### 请求防抖和节流

```typescript
import { debounce } from 'lodash-es';

// 搜索防抖
const handleSearch = debounce(async (query: string) => {
  await searchProducts(query);
}, 300);
```

#### 批量请求合并

```typescript
// 合并短时间内的多个请求
class RequestBatcher {
  private queue: any[] = [];
  private isProcessing = false;
  private delay = 100;

  add(request: any) {
    return new Promise((resolve) => {
      this.queue.push({ request, resolve });
      this.process();
    });
  }

  private process() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    setTimeout(() => {
      const batch = [...this.queue];
      this.queue = [];
      
      // 处理批量请求
      this.handleBatch(batch).then(() => {
        this.isProcessing = false;
        if (this.queue.length > 0) {
          this.process();
        }
      });
    }, this.delay);
  }

  private async handleBatch(batch: any[]) {
    // 实现批量处理逻辑
  }
}
```

## 测试与部署

### 单元测试

创建`tests/unit/components/ProductForm.spec.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductForm from '@/components/business/ProductForm.vue';
import { ElMessage } from 'element-plus';

// Mock Element Plus消息组件
vi.mock('element-plus', () => ({
  ElMessage: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('ProductForm.vue', () => {
  let wrapper: any;
  const mockProps = {
    visible: true,
    product: null,
    title: '添加产品',
    onSave: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    wrapper = mount(ProductForm, {
      props: mockProps,
      global: {
        stubs: {
          'el-dialog': true,
          'el-form': true,
          'el-form-item': true,
          'el-input': true,
          'el-upload': true,
          'el-button': true
        }
      }
    });
  });

  it('should render correctly', () => {
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.props('visible')).toBe(true);
    expect(wrapper.props('title')).toBe('添加产品');
  });

  it('should emit cancel event when cancel button is clicked', () => {
    wrapper.find('[data-test="cancel-button"]').trigger('click');
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('should validate form before submitting', async () => {
    // 设置表单数据
    wrapper.vm.form = {
      name: '', // 空名称，应该触发验证错误
      description: 'Test description',
      price: 100,
      category: '电子产品',
      stock: 50,
      images: []
    };

    await wrapper.find('[data-test="submit-button"]').trigger('click');
    
    // 验证应该失败，onSave不应该被调用
    expect(mockProps.onSave).not.toHaveBeenCalled();
    expect(wrapper.vm.formError).toBeTruthy();
  });
});
```

### 构建与部署

#### 构建配置优化

```typescript
// vite.config.ts中的构建优化
build: {
  sourcemap: false,
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true
    }
  },
  rollupOptions: {
    output: {
      // 分割代码块
      manualChunks: {
        vendor: ['vue', 'vue-router', 'pinia'],
        elementPlus: ['element-plus'],
        echarts: ['echarts']
      }
    }
  }
}
```

#### CI/CD配置

创建`.github/workflows/deploy.yml`：

```yaml
name: Deploy Vue.js App

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run lint
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build project
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
      
      - name: Deploy to server
        uses: easingthemes/ssh-deploy@v2
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          ARGS: "-rltgoDzvO --delete"
          SOURCE: "dist/"
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: "${{ secrets.REMOTE_TARGET_DIR }}"
```

## 总结

在本文中，我们学习了如何使用Vue.js构建企业级应用，并探讨了一系列性能优化策略。通过实际案例，我们展示了：

1. **项目架构设计**：采用模块化、组件化的架构，使用TypeScript确保类型安全
2. **核心功能实现**：包括路由配置、状态管理、API服务和组件开发
3. **性能优化策略**：
   - 代码分割与懒加载
   - 虚拟滚动处理大数据列表
   - 缓存优化（组件缓存和数据缓存）
   - 图片优化（延迟加载、压缩和格式转换）
   - 状态管理优化
   - 渲染优化（v-memo、避免深层响应式）
   - 网络优化（请求防抖、节流和批量合并）
4. **测试与部署**：单元测试和CI/CD配置

企业级应用开发需要综合考虑功能实现、性能优化、代码可维护性等多方面因素。Vue.js提供了强大而灵活的工具集，结合良好的架构设计和优化策略，可以构建出高性能、可维护的企业级应用。

在实际项目中，应该根据具体的业务需求和技术环境，选择合适的优化策略，并在开发过程中持续监控和优化应用性能。

在下一篇教程中，我们将比较Vue.js与React、Angular等其他前端框架的异同，帮助你选择最适合项目需求的技术栈。