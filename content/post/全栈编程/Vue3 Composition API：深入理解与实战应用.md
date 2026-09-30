---
title: "Vue3 Composition API：深入理解与实战应用"
date: 2025-10-30T09:25:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["Vue3", "Composition API", "深入理解", "实战应用", "前端框架", "响应式系统"]
license: ""
hidden: false
---

# Vue3 Composition API：深入理解与实战应用

## 前言

Vue 3 引入的 Composition API 是前端开发中的一项重要创新，它彻底改变了我们组织和复用 Vue 组件逻辑的方式。相比 Vue 2 的 Options API，Composition API 提供了更灵活的代码组织、更好的逻辑复用能力以及更优的 TypeScript 支持。本文将深入解析 Composition API 的核心原理，并通过实战案例展示其在复杂应用中的强大能力。

## 为什么需要 Composition API？

### Options API 的局限性

在 Vue 2 中，Options API 通过 `data`、`methods`、`computed` 等选项组织组件逻辑，这种方式在小型组件中表现良好，但随着组件复杂度增加，会暴露出一些问题：

1. **代码组织问题**：相关逻辑分散在不同选项中，难以追踪和维护
2. **逻辑复用困难**：mixins 存在命名冲突、来源不明等问题
3. **类型推导不佳**：与 TypeScript 结合时体验不够理想
4. **代码压缩不友好**：属性名无法被压缩，影响优化效果

### Composition API 的优势

Composition API 提供了更现代、更灵活的解决方案：

1. **更好的逻辑组织**：相关逻辑可以组织在一起，提高可维护性
2. **更优的逻辑复用**：通过组合式函数（Composition Functions）实现无副作用的逻辑复用
3. **出色的类型支持**：与 TypeScript 配合无间，提供完整的类型推导
4. **更灵活的代码组织**：可以按功能组织代码，而不是按生命周期
5. **更好的 tree-shaking 支持**：只引入使用的 API，减小打包体积

## Composition API 核心概念

### 1. setup 函数

`setup` 函数是 Composition API 的入口点，在组件实例创建之前执行：

```vue
<template>
  <div>
    <p>{{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// 响应式数据
const count = ref(0);

// 计算属性
const doubleCount = computed(() => count.value * 2);

// 方法
const increment = () => {
  count.value++;
};

// 生命周期钩子
onMounted(() => {
  console.log('Component mounted with count:', count.value);
});
</script>
```

### 2. 响应式数据 API

#### ref

`ref` 用于创建响应式的引用类型数据：

```typescript
import { ref } from 'vue';

// 创建基本类型的响应式数据
const count = ref(0);
const message = ref('Hello');

// 创建对象类型的响应式数据
const user = ref({
  name: 'Alice',
  age: 25
});

// 修改值
count.value++;
user.value.age = 26;
```

#### reactive

`reactive` 用于创建响应式的对象：

```typescript
import { reactive } from 'vue';

// 创建响应式对象
const state = reactive({
  count: 0,
  user: {
    name: 'Bob',
    address: {
      city: 'Beijing',
      street: 'Main St'
    }
  },
  items: [1, 2, 3]
});

// 直接修改属性
state.count++;
state.user.address.city = 'Shanghai';
state.items.push(4);
```

#### ref vs reactive

| 特性 | ref | reactive |
|------|-----|----------|
| 适用类型 | 基本类型和引用类型 | 仅对象类型 |
| 访问方式 | 需要 .value | 直接访问属性 |
| 解构赋值 | 配合 toRefs 使用 | 解构会丢失响应性 |
| 类型推导 | 更友好 | 需要明确类型 |

### 3. 计算属性和侦听器

#### computed

创建计算属性：

```typescript
import { ref, computed } from 'vue';

const firstName = ref('John');
const lastName = ref('Doe');

// 只读计算属性
const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`;
});

// 可写计算属性
const fullName2 = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (newValue) => {
    const parts = newValue.split(' ');
    firstName.value = parts[0] || '';
    lastName.value = parts[1] || '';
  }
});

// 使用
fullName2.value = 'Jane Smith';
```

#### watch

创建侦听器：

```typescript
import { ref, reactive, watch, watchEffect } from 'vue';

const count = ref(0);
const state = reactive({ name: 'Alice', age: 25 });

// 监听 ref
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// 监听 reactive 对象的特定属性
watch(
  () => state.name,
  (newName, oldName) => {
    console.log(`Name changed from ${oldName} to ${newName}`);
  }
);

// 监听多个源
watch(
  [count, () => state.age],
  ([newCount, newAge], [oldCount, oldAge]) => {
    console.log(`Count changed: ${oldCount} -> ${newCount}`);
    console.log(`Age changed: ${oldAge} -> ${newAge}`);
  }
);

// 立即执行的监听
watchEffect(() => {
  console.log(`Count is: ${count.value}, Age is: ${state.age}`);
});
```

### 4. 生命周期钩子

Composition API 中的生命周期钩子以函数形式导入：

```typescript
import {
  onMounted,
  onUpdated,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onErrorCaptured,
  onRenderTracked,
  onRenderTriggered
} from 'vue';

// 组件挂载后
onMounted(() => {
  console.log('Component mounted');
});

// 组件更新前
onBeforeUpdate(() => {
  console.log('Component about to update');
});

// 错误捕获
onErrorCaptured((error, instance, info) => {
  console.error('Error captured:', error, info);
  // 返回 true 可以阻止错误继续传播
  return false;
});
```

### 5. 依赖注入

使用 `provide` 和 `inject` 实现跨组件通信：

```typescript
// 父组件
import { provide, ref } from 'vue';

const currentUser = ref({ name: 'Admin', role: 'admin' });
const updateUser = (user) => {
  currentUser.value = user;
};

provide('user', {
  currentUser,
  updateUser
});

// 子组件
import { inject, Ref } from 'vue';

const user = inject('user');
console.log(user.currentUser.value.name);
user.updateUser({ name: 'New Admin', role: 'admin' });

// 带默认值的注入
const theme = inject('theme', 'light');

// 类型安全的注入
interface User {
  name: string;
  role: string;
}

interface UserProvide {
  currentUser: Ref<User>;
  updateUser: (user: User) => void;
}

const user = inject<UserProvide>('user');
```

## Composition API 深入原理

### 1. 响应式系统工作原理

Vue 3 的响应式系统基于 ES6 Proxy 实现：

#### 核心设计

```typescript
// 简化的 reactive 实现原理
function reactive(target) {
  // 检查目标是否为对象
  if (typeof target !== 'object' || target === null) {
    return target;
  }
  
  // 创建 Proxy 代理
  return new Proxy(target, {
    get(target, key, receiver) {
      // 收集依赖
      track(target, key);
      // 获取属性值
      const result = Reflect.get(target, key, receiver);
      // 递归处理嵌套对象
      if (typeof result === 'object' && result !== null) {
        return reactive(result);
      }
      return result;
    },
    set(target, key, value, receiver) {
      // 设置新值
      const result = Reflect.set(target, key, value, receiver);
      // 触发更新
      trigger(target, key);
      return result;
    },
    deleteProperty(target, key) {
      // 删除属性
      const result = Reflect.deleteProperty(target, key);
      // 触发更新
      trigger(target, key);
      return result;
    }
  });
}
```

#### 依赖收集与触发

Vue 3 使用了一个依赖收集系统来跟踪响应式数据的变化：

1. **依赖收集 (track)**：当读取响应式数据时，记录下正在使用该数据的副作用函数
2. **依赖触发 (trigger)**：当修改响应式数据时，通知相关的副作用函数重新执行

### 2. ref 的实现原理

```typescript
// 简化的 ref 实现原理
function ref(value) {
  // 创建一个带有 value 属性的对象
  const refObject = {
    _isRef: true, // 标记为 ref 对象
    get value() {
      // 收集依赖
      track(refObject, 'value');
      return value;
    },
    set value(newValue) {
      // 仅当值改变时更新
      if (newValue !== value) {
        value = newValue;
        // 触发更新
        trigger(refObject, 'value');
      }
    }
  };
  
  return refObject;
}

// unref 辅助函数 - 获取 ref 的原始值
function unref(ref) {
  return isRef(ref) ? ref.value : ref;
}

// isRef 辅助函数 - 检查是否为 ref 对象
function isRef(value) {
  return !!value && value._isRef === true;
}
```

### 3. computed 的实现原理

```typescript
// 简化的 computed 实现原理
function computed(getterOrOptions) {
  // 确定是 getter 函数还是 options 对象
  let getter;
  let setter;
  
  if (typeof getterOrOptions === 'function') {
    getter = getterOrOptions;
    setter = () => console.warn('Write operation failed: computed value is readonly');
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  
  // 用于存储计算结果的变量
  let dirty = true;
  let value;
  
  // 创建计算属性的 effect
  const effect = effect(getter, {
    lazy: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true;
        // 通知依赖更新
        trigger(ref, 'value');
      }
    }
  });
  
  // 创建 ref 对象
  const ref = {
    _isRef: true,
    get value() {
      // 如果计算值已过期，重新计算
      if (dirty) {
        value = effect();
        dirty = false;
      }
      // 收集依赖
      track(ref, 'value');
      return value;
    },
    set value(newValue) {
      setter(newValue);
    }
  };
  
  return ref;
}
```

## 组合式函数设计模式

### 1. 组合式函数基础

组合式函数是 Composition API 的核心复用机制：

```typescript
// src/composables/useCounter.ts
import { ref, computed } from 'vue';

export function useCounter(initialValue = 0) {
  const count = ref(initialValue);
  const doubleCount = computed(() => count.value * 2);
  
  const increment = () => count.value++;
  const decrement = () => count.value--;
  const reset = () => count.value = initialValue;
  
  return {
    count,
    doubleCount,
    increment,
    decrement,
    reset
  };
}

// 使用示例
const { count, doubleCount, increment } = useCounter(10);
```

### 2. 异步组合式函数

```typescript
// src/composables/useApi.ts
import { ref, computed, onUnmounted } from 'vue';

export function useApi<T>(url: string) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const controller = new AbortController();
  
  const fetchData = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      data.value = await response.json();
    } catch (err) {
      if (err.name !== 'AbortError') {
        error.value = err.message || 'Failed to fetch data';
      }
    } finally {
      loading.value = false;
    }
  };
  
  const isSuccess = computed(() => data.value !== null && !error.value);
  
  // 自动清理
  onUnmounted(() => {
    controller.abort();
  });
  
  return {
    data,
    loading,
    error,
    isSuccess,
    fetchData
  };
}

// 使用示例
const { data: posts, loading, error, fetchData } = useApi<Post[]>('/api/posts');
fetchData();
```

### 3. 生命周期相关组合式函数

```typescript
// src/composables/useEventListener.ts
import { onMounted, onUnmounted } from 'vue';

export function useEventListener(
  target: EventTarget | Ref<EventTarget | null | undefined>,
  event: string,
  callback: EventListenerOrEventListenerObject
) {
  let currentTarget: EventTarget | null = null;
  
  // 从 ref 中获取目标或直接使用目标
  const getTarget = () => {
    return isRef(target) ? target.value : target;
  };
  
  const cleanup = () => {
    if (currentTarget) {
      currentTarget.removeEventListener(event, callback);
      currentTarget = null;
    }
  };
  
  onMounted(() => {
    const el = getTarget();
    if (el) {
      currentTarget = el;
      currentTarget.addEventListener(event, callback);
    }
  });
  
  onUnmounted(cleanup);
  
  return {
    cleanup
  };
}

// 使用示例
const { cleanup } = useEventListener(
  window,
  'resize',
  () => console.log('Window resized')
);
```

## 实战项目：高级数据表格组件

让我们构建一个使用 Composition API 的高级数据表格组件，展示真实项目中的应用：

### 1. 数据表格组合式函数

```typescript
// src/composables/useDataTable.ts
import { ref, computed, reactive, watch } from 'vue';

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface FilterOptions {
  [key: string]: any;
}

interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export function useDataTable<T>(fetchFn: Function) {
  // 状态
  const items = ref<T[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  
  // 分页
  const pagination = reactive<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  
  // 筛选
  const filters = reactive<FilterOptions>({});
  
  // 排序
  const sort = reactive<SortOptions>({
    field: '',
    direction: 'asc'
  });
  
  // 计算属性
  const pageNumbers = computed(() => {
    const numbers = [];
    const totalPages = pagination.totalPages;
    const current = pagination.page;
    
    // 生成页码数组
    let start = Math.max(1, current - 2);
    let end = Math.min(totalPages, start + 4);
    
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      numbers.push(i);
    }
    
    return numbers;
  });
  
  // 加载数据
  const loadData = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters,
        sortBy: sort.field,
        sortDirection: sort.direction
      };
      
      const response = await fetchFn(params);
      items.value = response.data;
      pagination.total = response.meta.total;
      pagination.totalPages = Math.ceil(response.meta.total / pagination.pageSize);
    } catch (err: any) {
      error.value = err.message || 'Failed to load data';
    } finally {
      loading.value = false;
    }
  };
  
  // 分页方法
  const setPage = (page: number) => {
    pagination.page = page;
  };
  
  const setPageSize = (size: number) => {
    pagination.pageSize = size;
    pagination.page = 1; // 重置到第一页
  };
  
  const nextPage = () => {
    if (pagination.page < pagination.totalPages) {
      pagination.page++;
    }
  };
  
  const prevPage = () => {
    if (pagination.page > 1) {
      pagination.page--;
    }
  };
  
  // 排序方法
  const setSort = (field: string) => {
    if (sort.field === field) {
      // 切换排序方向
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sort.field = field;
      sort.direction = 'asc';
    }
  };
  
  // 筛选方法
  const setFilter = (key: string, value: any) => {
    filters[key] = value;
    pagination.page = 1; // 重置到第一页
  };
  
  const clearFilters = () => {
    Object.keys(filters).forEach(key => {
      delete filters[key];
    });
    pagination.page = 1;
  };
  
  // 重置表格
  const resetTable = () => {
    pagination.page = 1;
    pagination.pageSize = 10;
    clearFilters();
    sort.field = '';
    sort.direction = 'asc';
  };
  
  // 监听分页、筛选和排序变化，自动重新加载数据
  watch(
    [() => pagination.page, () => pagination.pageSize, filters, sort],
    () => {
      loadData();
    },
    { deep: true }
  );
  
  return {
    items,
    loading,
    error,
    pagination,
    filters,
    sort,
    pageNumbers,
    loadData,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    setSort,
    setFilter,
    clearFilters,
    resetTable
  };
}
```

### 2. 数据表格组件

```vue
<template>
  <div class="data-table">
    <!-- 工具栏 -->
    <div class="table-toolbar" v-if="showToolbar">
      <slot name="toolbar"></slot>
      
      <!-- 搜索框 -->
      <el-input
        v-if="searchable"
        v-model="searchQuery"
        placeholder="搜索..."
        prefix-icon="el-icon-search"
        clearable
        @clear="handleSearch"
        @keyup.enter="handleSearch"
      />
    </div>
    
    <!-- 表格 -->
    <el-table
      v-loading="loading"
      :data="items"
      style="width: 100%"
      @sort-change="handleSortChange"
      v-bind="tableProps"
    >
      <template v-for="column in columns" :key="column.prop">
        <el-table-column
          v-if="column.type !== 'selection'"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable || false"
          :align="column.align || 'left'"
          :fixed="column.fixed || false"
        >
          <template #default="scope">
            <slot :name="column.prop" v-bind="{ row: scope.row, column }">
              {{ formatValue(scope.row[column.prop], column) }}
            </slot>
          </template>
        </el-table-column>
        <el-table-column
          v-else
          type="selection"
          width="55"
          :fixed="column.fixed || false"
        />
      </template>
      
      <!-- 操作列 -->
      <el-table-column
        v-if="showActions"
        label="操作"
        width="180"
        fixed="right"
      >
        <template #default="scope">
          <slot name="actions" v-bind="{ row: scope.row }"></slot>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="table-pagination">
      <div class="pagination-info">
        共 {{ pagination.total }} 条记录，第 {{ pagination.page }} / {{ pagination.totalPages }} 页
      </div>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="prev, pager, next, jumper, sizes"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 空状态 -->
    <div v-if="!loading && items.length === 0" class="empty-state">
      <el-empty description="暂无数据"></el-empty>
    </div>
    
    <!-- 错误状态 -->
    <div v-if="error" class="error-state">
      <el-alert
        :title="error"
        type="error"
        show-icon
        :closable="false"
      />
      <el-button type="primary" @click="refresh">重试</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDataTable } from '@/composables/useDataTable';

interface Column {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: boolean | 'left' | 'right';
  sortable?: boolean | 'custom';
  type?: 'selection';
  formatter?: (value: any, row: any) => any;
}

interface TableProps {
  columns: Column[];
  fetchData: Function;
  showToolbar?: boolean;
  searchable?: boolean;
  showActions?: boolean;
  [key: string]: any;
}

const props = withDefaults(defineProps<TableProps>(), {
  showToolbar: true,
  searchable: false,
  showActions: true
});

const emit = defineEmits<{
  (e: 'selection-change', rows: any[]): void;
  (e: 'sort-change', { column, prop, order }: { column: any, prop: string, order: string }): void;
}>();

const searchQuery = ref('');

// 使用数据表格组合式函数
const {
  items,
  loading,
  error,
  pagination,
  loadData,
  setPage,
  setPageSize,
  setSort,
  setFilter
} = useDataTable(props.fetchData);

// 格式化值
const formatValue = (value: any, column: Column) => {
  if (column.formatter) {
    return column.formatter(value, { ...value });
  }
  
  // 默认格式化
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  
  // 格式化日期
  if (value instanceof Date || (typeof value === 'string' && value.includes('-'))) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
  }
  
  return value;
};

// 搜索处理
const handleSearch = () => {
  setFilter('search', searchQuery.value);
};

// 排序处理
const handleSortChange = (sort: { column: any, prop: string, order: string }) => {
  emit('sort-change', sort);
  
  if (sort.prop && sort.order) {
    setSort(sort.prop);
  }
};

// 分页处理
const handleSizeChange = (size: number) => {
  setPageSize(size);
};

const handleCurrentChange = (current: number) => {
  setPage(current);
};

// 刷新数据
const refresh = () => {
  loadData();
};

// 暴露方法给父组件
defineExpose({
  refresh,
  setFilter,
  loadData
});

// 初始化加载数据
loadData();
</script>

<style scoped>
.data-table {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.pagination-info {
  color: #606266;
}

.empty-state,
.error-state {
  padding: 40px 0;
  text-align: center;
}

.error-state button {
  margin-top: 16px;
}
</style>
```

### 3. 使用数据表格组件

```vue
<template>
  <div class="users-page">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="showAddUserDialog = true">
            <i class="el-icon-plus"></i>
            添加用户
          </el-button>
        </div>
      </template>
      
      <AdvancedDataTable
        ref="tableRef"
        :columns="columns"
        :fetch-data="fetchUsers"
        :searchable="true"
        :show-actions="true"
        @sort-change="handleSort"
      >
        <!-- 自定义工具栏 -->
        <template #toolbar>
          <el-select
            v-model="roleFilter"
            placeholder="按角色筛选"
            clearable
            @change="handleRoleFilter"
          >
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="用户" value="user"></el-option>
          </el-select>
          
          <el-button type="info" @click="exportUsers">
            <i class="el-icon-download"></i>
            导出用户
          </el-button>
        </template>
        
        <!-- 自定义状态列 -->
        <template #status="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '活跃' : '禁用' }}
          </el-tag>
        </template>
        
        <!-- 自定义操作列 -->
        <template #actions="{ row }">
          <el-button type="primary" size="small" @click="editUser(row)">
            编辑
          </el-button>
          <el-button 
            :type="row.status === 'active' ? 'danger' : 'success'" 
            size="small" 
            @click="toggleUserStatus(row)"
          >
            {{ row.status === 'active' ? '禁用' : '启用' }}
          </el-button>
          <el-button type="danger" size="small" @click="deleteUser(row)">
            删除
          </el-button>
        </template>
      </AdvancedDataTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AdvancedDataTable from '@/components/AdvancedDataTable.vue';
import { userApi } from '@/services/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const tableRef = ref();
const roleFilter = ref('');
const showAddUserDialog = ref(false);

// 表格列定义
const columns = [
  {
    prop: 'id',
    label: 'ID',
    width: 80,
    align: 'center'
  },
  {
    prop: 'username',
    label: '用户名',
    minWidth: 120,
    sortable: 'custom'
  },
  {
    prop: 'email',
    label: '邮箱',
    minWidth: 200
  },
  {
    prop: 'role',
    label: '角色',
    width: 100,
    align: 'center',
    sortable: 'custom'
  },
  {
    prop: 'status',
    label: '状态',
    width: 100,
    align: 'center'
  },
  {
    prop: 'createdAt',
    label: '创建时间',
    width: 180,
    align: 'center',
    sortable: 'custom',
    formatter: (value: string) => {
      return new Date(value).toLocaleString();
    }
  }
];

// 获取用户数据
const fetchUsers = async (params: any) => {
  try {
    const response = await userApi.getUsers(params);
    return {
      data: response.data,
      meta: {
        total: response.meta.total,
        page: response.meta.page,
        perPage: response.meta.perPage
      }
    };
  } catch (error) {
    ElMessage.error('获取用户列表失败');
    throw error;
  }
};

// 处理排序
const handleSort = (sort: any) => {
  console.log('Sort:', sort);
};

// 角色筛选
const handleRoleFilter = () => {
  tableRef.value.setFilter('role', roleFilter.value);
};

// 编辑用户
const editUser = (user: any) => {
  showAddUserDialog.value = true;
  console.log('Edit user:', user);
};

// 切换用户状态
const toggleUserStatus = async (user: any) => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await userApi.updateUserStatus(user.id, newStatus);
    tableRef.value.refresh();
    ElMessage.success(`用户已${newStatus === 'active' ? '启用' : '禁用'}`);
  } catch (error) {
    ElMessage.error('操作失败');
  }
};

// 删除用户
const deleteUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户「${user.username}」吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    await userApi.deleteUser(user.id);
    tableRef.value.refresh();
    ElMessage.success('用户删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 导出用户
const exportUsers = async () => {
  try {
    await userApi.exportUsers();
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
  }
};
</script>
```

## 性能优化技巧

### 1. 使用 markRaw 跳过响应式转换

对于不需要响应式的数据，使用 `markRaw` 跳过 Proxy 转换：

```typescript
import { markRaw, ref } from 'vue';
import { Chart } from 'chart.js';

// 第三方库实例不需要响应式
const chartInstance = ref(null);

onMounted(() => {
  const ctx = canvas.value.getContext('2d');
  // 使用 markRaw 跳过响应式转换
  chartInstance.value = markRaw(new Chart(ctx, options));
});
```

### 2. 使用 shallowRef 和 shallowReactive

对于嵌套层级较深的数据，可以使用浅层响应式：

```typescript
import { shallowRef, shallowReactive } from 'vue';

// 只有根级属性是响应式的
const shallowObj = shallowReactive({
  name: '浅层响应式',
  // 这个对象的属性不是响应式的
  details: {
    age: 25,
    address: '...'
  }
});

// 只有 .value 是响应式的
const shallowData = shallowRef({
  // 这个对象的属性不是响应式的
  nested: {
    value: 1
  }
});
```

### 3. 使用 toRefs 保持解构后的响应性

```typescript
import { reactive, toRefs } from 'vue';

const state = reactive({
  name: 'Vue 3',
  version: '3.3.4'
});

// 使用 toRefs 解构保持响应性
const { name, version } = toRefs(state);

// 现在可以直接使用 name.value 和 version.value
```

### 4. 使用 v-memo 避免不必要的重渲染

```vue
<template>
  <div v-for="item in items" v-memo="[item.id, item.updatedAt]">
    <h3>{{ item.title }}</h3>
    <p>{{ item.content }}</p>
    <span>{{ item.updatedAt }}</span>
  </div>
</template>
```

### 5. 使用 Suspense 和异步组件

```vue
<template>
  <Suspense>
    <template #default>
      <AsyncComponent />
    </template>
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue';

// 异步组件
const AsyncComponent = defineAsyncComponent(() => 
  import('./HeavyComponent.vue')
);
</script>
```

## 与 TypeScript 最佳实践

### 1. 类型化响应式数据

```typescript
import { ref, reactive } from 'vue';

interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
}

// 类型化 ref
const user = ref<User | null>(null);
const users = ref<User[]>([]);

// 类型化 reactive
const state = reactive<{
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}>({
  currentUser: null,
  loading: false,
  error: null
});
```

### 2. 类型化 props 和 emit

```vue
<script setup lang="ts">
// Props 类型定义
interface Props {
  modelValue: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  disabled: false
});

// Emits 类型定义
const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
  (e: 'change', value: number): void;
  (e: 'input', value: number): void;
}>();

// 使用 emit
const updateValue = (value: number) => {
  emit('update:modelValue', value);
  emit('change', value);
};
</script>
```

### 3. 类型化组合式函数

```typescript
// 类型化组合式函数
export function useCounter<T extends number>(initialValue: T = 0 as T) {
  const count = ref<T>(initialValue);
  
  const increment = () => {
    count.value++;
  };
  
  return {
    count,
    increment
  };
}

// 类型化异步组合式函数
export async function useApi<T>(url: string): Promise<{
  data: Ref<T | null>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  refetch: () => Promise<void>;
}> {
  const data = ref<T | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  
  const fetchData = async () => {
    try {
      // 实现获取数据逻辑
    } finally {
      loading.value = false;
    }
  };
  
  await fetchData();
  
  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}
```

## 总结

Vue 3 Composition API 为前端开发带来了革命性的变化，它提供了一种更灵活、更强大的方式来组织和复用组件逻辑。本文深入探讨了 Composition API 的核心概念、工作原理以及在实际项目中的应用，通过构建高级数据表格组件展示了其强大的功能。

主要内容包括：

1. **Composition API 的优势**：更好的逻辑组织、更优的逻辑复用、出色的类型支持
2. **核心 API**：setup 函数、ref、reactive、computed、watch 等
3. **工作原理**：基于 ES6 Proxy 的响应式系统
4. **组合式函数设计模式**：如何创建可复用的逻辑块
5. **实战项目**：构建高级数据表格组件
6. **性能优化技巧**：使用 markRaw、shallowRef、v-memo 等
7. **与 TypeScript 的最佳实践**：类型化响应式数据、props、emit 和组合式函数

通过掌握 Composition API，开发者可以构建出更可维护、更可复用、性能更优的 Vue 应用。无论是小型项目还是大型企业应用，Composition API 都能提供更好的开发体验和代码质量。

在未来的 Vue 开发中，Composition API 将会成为主流的开发模式，掌握它将为你的前端开发能力带来质的飞跃。