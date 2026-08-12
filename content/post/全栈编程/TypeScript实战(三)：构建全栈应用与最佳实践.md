---
title: "TypeScript实战(三)：构建全栈应用与最佳实践"
date: 2025-10-30T09:25:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["TypeScript", "全栈", "实战案例", "Node.js", "Express", "MongoDB", "最佳实践"]
license: ""
hidden: false
---

# TypeScript实战(三)：构建全栈应用与最佳实践

## 前言

在前两篇教程中，我们学习了TypeScript的基础语法、高级特性和类型系统。在本文中，我们将使用TypeScript构建一个完整的全栈应用，涵盖前端和后端开发，并分享一些TypeScript开发的最佳实践。

## 项目概述

我们将构建一个全栈待办事项管理应用，具有以下功能：

1. 用户注册和登录
2. 待办事项的CRUD操作
3. 待办事项分类和标签
4. 数据持久化
5. 响应式UI设计

### 技术栈

- **前端**：
  - React + TypeScript
  - React Router for navigation
  - Axios for API calls
  - Material-UI for UI components
  - Formik + Yup for form validation

- **后端**：
  - Node.js + Express
  - TypeScript
  - MongoDB + Mongoose
  - JWT for authentication
  - bcrypt for password hashing

## 后端开发

### 项目初始化

```bash
mkdir todo-backend
cd todo-backend
npm init -y
npm install typescript ts-node @types/node express @types/express mongoose @types/mongoose bcrypt @types/bcrypt jsonwebtoken @types/jsonwebtoken cors @types/cors dotenv
npm install --save-dev nodemon
```

### TypeScript配置

创建`tsconfig.json`文件：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### 项目结构

```
todo-backend/
├── src/
│   ├── config/
│   │   └── db.ts
│   ├── controllers/
│   │   ├── authController.ts
│   │   └── todoController.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── models/
│   │   ├── User.ts
│   │   └── Todo.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   └── todoRoutes.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── generateToken.ts
│   └── app.ts
├── .env
├── tsconfig.json
└── package.json
```

### 数据库配置

创建`src/config/db.ts`：

```typescript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
```

### 类型定义

创建`src/types/index.ts`：

```typescript
import { Request } from 'express';

// 用户相关类型
export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

// 待办事项相关类型
export interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  category?: string;
  tags?: string[];
  dueDate?: Date;
  user: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoInput {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  dueDate?: Date;
}

// 扩展Express Request接口
export interface CustomRequest extends Request {
  user?: User;
}
```

### 模型定义

创建`src/models/User.ts`：

```typescript
import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

interface UserSchema extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema: Schema<UserSchema> = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre<UserSchema>('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码验证方法
userSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<UserSchema>('User', userSchema);

export default User;
```

创建`src/models/Todo.ts`：

```typescript
import mongoose, { Schema } from 'mongoose';

interface TodoSchema extends mongoose.Document {
  title: string;
  description?: string;
  completed: boolean;
  category?: string;
  tags?: string[];
  dueDate?: Date;
  user: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema: Schema<TodoSchema> = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  dueDate: {
    type: Date
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Todo = mongoose.model<TodoSchema>('Todo', todoSchema);

export default Todo;
```

### JWT工具函数

创建`src/utils/generateToken.ts`：

```typescript
import jwt from 'jsonwebtoken';

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: '30d'
  });
};

export default generateToken;
```

### 中间件

创建`src/middleware/auth.ts`：

```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { CustomRequest } from '@/types';
import User from '@/models/User';

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    
    (req as CustomRequest).user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export default auth;
```

创建`src/middleware/errorHandler.ts`：

```typescript
import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  message: string;
  stack?: string;
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const error: ErrorResponse = {
    message: err.message || 'Server Error'
  };
  
  // Log error for development
  console.error(err.stack);
  
  // Add stack trace in development environment
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }
  
  res.status(500).json(error);
};

export default errorHandler;
```

### 控制器

创建`src/controllers/authController.ts`：

```typescript
import { Request, Response } from 'express';
import User from '@/models/User';
import generateToken from '@/utils/generateToken';
import { UserInput, UserLoginInput } from '@/types';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request<{}, {}, UserInput>, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = await User.create({
      name,
      email,
      password
    });
    
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id.toString())
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request<{}, {}, UserLoginInput>, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (user && await user.matchPassword(password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id.toString())
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - user is added by auth middleware
    const user = await User.findById(req.user._id).select('-password');
    
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
```

创建`src/controllers/todoController.ts`：

```typescript
import { Request, Response } from 'express';
import { CustomRequest, TodoInput } from '@/types';
import Todo from '@/models/Todo';

// @desc    Get all todos for a user
// @route   GET /api/todos
// @access  Private
export const getTodos = async (req: Request, res: Response) => {
  try {
    const userId = (req as CustomRequest).user?._id;
    
    const todos = await Todo.find({ user: userId });
    res.json(todos);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single todo
// @route   GET /api/todos/:id
// @access  Private
export const getTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as CustomRequest).user?._id;
    
    const todo = await Todo.findOne({ 
      _id: req.params.id,
      user: userId 
    });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    res.json(todo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new todo
// @route   POST /api/todos
// @access  Private
export const createTodo = async (req: Request<{}, {}, TodoInput>, res: Response) => {
  try {
    const userId = (req as CustomRequest).user?._id;
    const { title, description, category, tags, dueDate } = req.body;
    
    const todo = await Todo.create({
      title,
      description,
      category,
      tags,
      dueDate,
      user: userId
    });
    
    res.status(201).json(todo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a todo
// @route   PUT /api/todos/:id
// @access  Private
export const updateTodo = async (req: Request<{ id: string }, {}, Partial<TodoInput>>, res: Response) => {
  try {
    const userId = (req as CustomRequest).user?._id;
    
    const todo = await Todo.findOneAndUpdate(
      {
        _id: req.params.id,
        user: userId
      },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    res.json(todo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a todo
// @route   DELETE /api/todos/:id
// @access  Private
export const deleteTodo = async (req: Request, res: Response) => {
  try {
    const userId = (req as CustomRequest).user?._id;
    
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: userId
    });
    
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
```

### 路由

创建`src/routes/authRoutes.ts`：

```typescript
import express from 'express';
import { registerUser, loginUser, getUserProfile } from '@/controllers/authController';
import auth from '@/middleware/auth';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', auth, getUserProfile);

export default router;
```

创建`src/routes/todoRoutes.ts`：

```typescript
import express from 'express';
import {
  getTodos,
  getTodo,
  createTodo,
  updateTodo,
  deleteTodo
} from '@/controllers/todoController';
import auth from '@/middleware/auth';

const router = express.Router();

router.route('/')
  .get(auth, getTodos)
  .post(auth, createTodo);

router.route('/:id')
  .get(auth, getTodo)
  .put(auth, updateTodo)
  .delete(auth, deleteTodo);

export default router;
```

### 主应用文件

创建`src/app.ts`：

```typescript
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from '@/config/db';
import authRoutes from '@/routes/authRoutes';
import todoRoutes from '@/routes/todoRoutes';
import errorHandler from '@/middleware/errorHandler';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 环境配置

创建`.env`文件：

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/todo-app
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 启动脚本

更新`package.json`：

```json
{
  "name": "todo-backend",
  "version": "1.0.0",
  "description": "Todo app backend with TypeScript and Express",
  "main": "dist/app.js",
  "scripts": {
    "start": "node dist/app.js",
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": ["typescript", "express", "mongodb", "todo"],
  "author": "Your Name",
  "license": "MIT"
}
```

## 前端开发

### 项目初始化

```bash
mkdir todo-frontend
cd todo-frontend
npx create-react-app . --template typescript
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled formik yup @mui/icons-material
```

### 项目结构

```
todo-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── TodoList.tsx
│   │   ├── TodoItem.tsx
│   │   ├── TodoForm.tsx
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useTodos.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   └── todoService.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── formatDate.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── react-app-env.d.ts
├── package.json
└── tsconfig.json
```

### 类型定义

创建`src/types/index.ts`：

```typescript
// 用户相关类型
export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// 待办事项相关类型
export interface Todo {
  _id: string;
  title: string;
  description?: string;
  completed: boolean;
  category?: string;
  tags?: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoFormData {
  title: string;
  description?: string;
  category?: string;
  tags?: string;
  dueDate?: string;
}

// 表单相关类型
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
}
```

### API配置

创建`src/services/api.ts`：

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL
});

// 添加请求拦截器，自动添加认证token
api.interceptors.request.use(
  (config) => {
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

export default api;
```

### 服务层

创建`src/services/authService.ts`：

```typescript
import api from './api';
import { LoginFormData, RegisterFormData, User } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const login = async (credentials: LoginFormData): Promise<AuthResponse> => {
  const response = await api.post('/auth/login', credentials);
  
  if (response.data) {
    // 保存到localStorage
    localStorage.setItem('user', JSON.stringify(response.data));
    localStorage.setItem('token', response.data.token);
  }
  
  return {
    user: response.data,
    token: response.data.token
  };
};

export const register = async (userData: RegisterFormData): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', userData);
  
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
    localStorage.setItem('token', response.data.token);
  }
  
  return {
    user: response.data,
    token: response.data.token
  };
};

export const logout = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};
```

创建`src/services/todoService.ts`：

```typescript
import api from './api';
import { Todo, TodoFormData } from '../types';

export const getTodos = async (): Promise<Todo[]> => {
  const response = await api.get('/todos');
  return response.data;
};

export const getTodo = async (id: string): Promise<Todo> => {
  const response = await api.get(`/todos/${id}`);
  return response.data;
};

export const createTodo = async (todoData: TodoFormData): Promise<Todo> => {
  // 将逗号分隔的标签字符串转换为数组
  const data = { ...todoData };
  if (data.tags && typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  }
  
  const response = await api.post('/todos', data);
  return response.data;
};

export const updateTodo = async (id: string, todoData: Partial<TodoFormData>): Promise<Todo> => {
  // 将逗号分隔的标签字符串转换为数组
  const data = { ...todoData };
  if (data.tags && typeof data.tags === 'string') {
    data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  }
  
  const response = await api.put(`/todos/${id}`, data);
  return response.data;
};

export const toggleTodo = async (id: string, completed: boolean): Promise<Todo> => {
  const response = await api.put(`/todos/${id}`, { completed });
  return response.data;
};

export const deleteTodo = async (id: string): Promise<void> => {
  await api.delete(`/todos/${id}`);
};
```

### 认证上下文

创建`src/context/AuthContext.tsx`：

```tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { login, register, logout, getCurrentUser } from '../services/authService';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = getCurrentUser();
        const currentToken = localStorage.getItem('token');
        
        if (currentUser && currentToken) {
          setUser(currentUser);
          setToken(currentToken);
        }
      } catch (err) {
        setError('Failed to load user');
        console.error('Failed to load user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const loginHandler = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await login({ email, password });
      setUser(response.user);
      setToken(response.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const registerHandler = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await register({ name, email, password });
      setUser(response.user);
      setToken(response.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutHandler = () => {
    logout();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const value = {
    user,
    token,
    isLoading,
    error,
    login: loginHandler,
    register: registerHandler,
    logout: logoutHandler
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
```

### 自定义Hooks

创建`src/hooks/useAuth.ts`：

```typescript
import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
```

创建`src/hooks/useTodos.ts`：

```typescript
import { useState, useEffect } from 'react';
import { Todo, TodoFormData } from '../types';
import {
  getTodos,
  createTodo as createTodoApi,
  updateTodo,
  toggleTodo,
  deleteTodo as deleteTodoApi
} from '../services/todoService';
import { useAuth } from './useAuth';

export const useTodos = () => {
  const { isLoggedIn } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = async () => {
    if (!isLoggedIn) {
      setTodos([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getTodos();
      setTodos(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch todos');
      console.error('Failed to fetch todos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [isLoggedIn]);

  const createTodo = async (todoData: TodoFormData) => {
    try {
      setError(null);
      const newTodo = await createTodoApi(todoData);
      setTodos([...todos, newTodo]);
      return newTodo;
    } catch (err: any) {
      setError(err.message || 'Failed to create todo');
      throw err;
    }
  };

  const updateTodoItem = async (id: string, todoData: Partial<TodoFormData>) => {
    try {
      setError(null);
      const updatedTodo = await updateTodo(id, todoData);
      setTodos(todos.map(todo => (todo._id === id ? updatedTodo : todo)));
      return updatedTodo;
    } catch (err: any) {
      setError(err.message || 'Failed to update todo');
      throw err;
    }
  };

  const toggleTodoStatus = async (id: string, completed: boolean) => {
    try {
      setError(null);
      const updatedTodo = await toggleTodo(id, completed);
      setTodos(todos.map(todo => (todo._id === id ? updatedTodo : todo)));
      return updatedTodo;
    } catch (err: any) {
      setError(err.message || 'Failed to toggle todo');
      throw err;
    }
  };

  const deleteTodoItem = async (id: string) => {
    try {
      setError(null);
      await deleteTodoApi(id);
      setTodos(todos.filter(todo => todo._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete todo');
      throw err;
    }
  };

  return {
    todos,
    isLoading,
    error,
    fetchTodos,
    createTodo,
    updateTodo: updateTodoItem,
    toggleTodo: toggleTodoStatus,
    deleteTodo: deleteTodoItem
  };
};
```

### 组件实现

创建`src/components/Navbar.tsx`：

```tsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Todo App
        </Typography>
        <Box>
          {user ? (
            <>
              <Typography variant="body1" sx={{ mr: 2, color: 'white' }}>
                Welcome, {user.name}
              </Typography>
              <Button color="inherit" onClick={() => navigate('/')}>Todos</Button>
              <Button color="inherit" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>Login</Button>
              <Button color="inherit" onClick={() => navigate('/register')}>Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
```

创建`src/components/TodoForm.tsx`：

```tsx
import React, { useState } from 'react';
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Formik, Form, FormikProps } from 'formik';
import * as Yup from 'yup';
import { TodoFormData } from '../types';

interface TodoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TodoFormData) => Promise<void>;
  initialValues?: TodoFormData;
  title?: string;
}

const validationSchema = Yup.object().shape({
  title: Yup.string().required('Title is required'),
  description: Yup.string(),
  category: Yup.string(),
  tags: Yup.string(),
  dueDate: Yup.string()
});

const TodoForm: React.FC<TodoFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialValues = {
    title: '',
    description: '',
    category: '',
    tags: '',
    dueDate: ''
  },
  title = 'Create Todo'
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: TodoFormData, { resetForm }: FormikProps<TodoFormData>) => {
    try {
      setIsSubmitting(true);
      await onSubmit(values);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleBlur, values, errors, touched }) => (
            <Form>
              <TextField
                autoFocus
                margin="dense"
                name="title"
                label="Title"
                type="text"
                fullWidth
                variant="outlined"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.title && !!errors.title}
                helperText={touched.title && errors.title}
              />
              <TextField
                margin="dense"
                name="description"
                label="Description"
                type="text"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.description && !!errors.description}
                helperText={touched.description && errors.description}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={values.category}
                  label="Category"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                  <MenuItem value="shopping">Shopping</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <TextField
                margin="dense"
                name="tags"
                label="Tags (comma separated)"
                type="text"
                fullWidth
                variant="outlined"
                value={values.tags}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.tags && !!errors.tags}
                helperText={touched.tags && errors.tags}
              />
              <TextField
                margin="dense"
                name="dueDate"
                label="Due Date"
                type="date"
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                value={values.dueDate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.dueDate && !!errors.dueDate}
                helperText={touched.dueDate && errors.dueDate}
              />
            </Form>
          )}
        </Formik>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          type="submit" 
          onClick={() => document.querySelector('form')?.dispatchEvent(
            new Event('submit', { cancelable: true })
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TodoForm;
```

## TypeScript最佳实践

### 1. 命名约定

- **类型名称**：使用PascalCase（如`User`, `TodoItem`）
- **变量和函数**：使用camelCase（如`getUser`, `todoList`）
- **接口**：使用PascalCase，可选添加`I`前缀（如`User`或`IUser`）
- **枚举**：使用PascalCase，枚举值使用ALL_CAPS（如`Status`，`Status.ACTIVE`）
- **私有属性**：使用下划线前缀（如`_privateMethod`）

### 2. 类型安全

- 始终为函数参数和返回值添加类型注解
- 避免使用`any`类型，优先使用更具体的类型
- 为对象和数组定义明确的接口或类型别名
- 使用联合类型表示可能有多种类型的值
- 使用类型断言时要谨慎，确保类型转换的安全性

### 3. 高级类型使用

- 使用泛型创建可复用的组件和函数
- 使用类型守卫处理运行时类型检查
- 使用映射类型和条件类型创建复杂的类型转换
- 利用`keyof`和索引类型进行安全的属性访问

### 4. 模块化

- 使用ES模块系统（import/export）
- 为每个功能创建单独的文件或模块
- 使用路径别名简化导入路径
- 遵循单一职责原则，每个模块只负责一个功能

### 5. 错误处理

- 使用TypeScript的错误类型系统
- 为API调用和异步操作添加错误处理
- 使用try/catch捕获和处理异常
- 定义应用程序特定的错误类

### 6. 工具和配置

- 配置严格的tsconfig.json设置
- 使用ESLint和Prettier保持代码质量和一致性
- 使用类型声明文件处理第三方库
- 为常用类型创建共享的类型定义文件

## 总结

在本文中，我们使用TypeScript构建了一个完整的全栈待办事项应用，涵盖了以下内容：

1. **后端开发**：使用Node.js、Express和TypeScript构建RESTful API，连接MongoDB数据库，实现用户认证和待办事项管理
2. **前端开发**：使用React、TypeScript和Material-UI构建用户界面，实现表单验证、状态管理和API交互
3. **最佳实践**：分享了TypeScript开发的最佳实践，包括命名约定、类型安全、模块化等

通过这个实战项目，我们展示了TypeScript如何在全栈开发中提供类型安全和开发效率。TypeScript的静态类型系统可以在开发阶段捕获许多错误，提高代码质量和可维护性。

在下一篇教程中，我们将比较TypeScript与其他编程语言的区别，以及如何在不同的框架和环境中使用TypeScript，敬请期待！