---
title: "TypeScript入门(一)：环境搭建与基础语法"
date: 2025-10-30T11:25:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["TypeScript", "前端", "入门教程", "基础语法", "环境搭建"]
license: ""
hidden: false
---

# TypeScript入门(一)：环境搭建与基础语法

## 前言

TypeScript是JavaScript的超集，它添加了静态类型检查和面向对象编程的特性，使代码更安全、更易维护。本系列教程将从环境搭建开始，逐步深入TypeScript的各个核心概念，帮助你掌握这门强大的语言。

## 什么是TypeScript？

TypeScript是由微软开发的开源编程语言，它通过在JavaScript基础上添加静态类型定义来增强JavaScript的功能。TypeScript最终会被编译成纯JavaScript代码，因此可以在任何支持JavaScript的环境中运行。

### TypeScript的主要特点

1. **静态类型检查**：在编译时就能发现类型错误
2. **增强的IDE支持**：提供更好的代码补全、导航和重构功能
3. **面向对象特性**：类、接口、继承、泛型等
4. **更好的代码组织和维护性**：大型项目更容易管理
5. **向后兼容**：完全兼容JavaScript代码

## 环境搭建

### 安装Node.js

TypeScript的编译器依赖Node.js环境，首先需要安装Node.js。

1. 访问 [Node.js官网](https://nodejs.org/) 下载并安装最新稳定版
2. 安装完成后，打开终端验证安装

```bash
node -v
npm -v
```

### 安装TypeScript

使用npm全局安装TypeScript编译器：

```bash
npm install -g typescript
```

验证TypeScript是否安装成功：

```bash
ts -v
# 或者
tsc -v
```

### 创建第一个TypeScript项目

1. 创建项目目录

```bash
mkdir typescript-demo
cd typescript-demo
```

2. 初始化npm项目

```bash
npm init -y
```

3. 创建TypeScript配置文件

```bash
tsc --init
```

这会在当前目录生成一个 `tsconfig.json` 文件，包含TypeScript的编译配置选项。

4. 创建第一个TypeScript文件

创建 `hello.ts` 文件：

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`;
}

const message = greet("TypeScript");
console.log(message);
```

5. 编译并运行

```bash
tsc hello.ts
node hello.js
```

你将看到输出：`Hello, TypeScript!`

## TypeScript基础语法

### 类型注解

TypeScript最基本的特性就是类型注解，它允许你为变量、函数参数和返回值指定类型。

```typescript
// 变量类型注解
let count: number = 5;
let name: string = "TypeScript";
let isActive: boolean = true;

// 函数参数和返回值类型注解
function add(a: number, b: number): number {
  return a + b;
}

// 数组类型
let numbers: number[] = [1, 2, 3, 4, 5];
let fruits: string[] = ["apple", "banana", "orange"];

// 元组类型
let user: [string, number] = ["John", 30];
```

### 基本数据类型

TypeScript包含以下基本数据类型：

1. **number**：所有数字类型，包括整数和浮点数
2. **string**：文本类型
3. **boolean**：布尔值，true或false
4. **undefined**：未定义值
5. **null**：空值
6. **symbol**：唯一标识符
7. **bigint**：大整数

```typescript
let decimal: number = 6;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;

let fullName: string = `John Doe`;
let sentence: string = `Hello, my name is ${ fullName }.`;

let isDone: boolean = false;

let u: undefined = undefined;
let n: null = null;

let sym1: symbol = Symbol();
let sym2: symbol = Symbol("key");

let big: bigint = BigInt(100);
```

### 类型推断

TypeScript会在没有明确指定类型的情况下，根据上下文自动推断变量的类型。

```typescript
// 类型推断为number
let count = 5;

// 类型推断为string
let name = "TypeScript";

// 函数返回值类型推断为number
function add(a: number, b: number) {
  return a + b;
}
```

### 联合类型

联合类型表示一个值可以是几种类型之一，使用竖线 `|` 分隔。

```typescript
let id: string | number;
id = "abc123"; // 有效
id = 123;      // 有效
// id = true;  // 无效

function printId(id: string | number) {
  console.log("ID: " + id);
}
```

### 类型断言

类型断言允许你告诉编译器你比它更了解某个值的类型。有两种语法：

```typescript
// 尖括号语法
let someValue: any = "this is a string";
let strLength: number = (<string>someValue).length;

// as语法（更常用，特别是在JSX中）
let someValue: any = "this is a string";
let strLength: number = (someValue as string).length;
```

## 接口

接口定义了对象的结构，指定了对象应该有哪些属性和方法。

```typescript
interface Person {
  firstName: string;
  lastName: string;
  age?: number; // 可选属性
  readonly id: number; // 只读属性
  greet: () => string; // 方法
}

const person: Person = {
  firstName: "John",
  lastName: "Doe",
  id: 1001,
  greet: () => { return "Hello!"; }
};

// 可选属性可以不包含
const anotherPerson: Person = {
  firstName: "Jane",
  lastName: "Smith",
  id: 1002,
  greet: () => { return "Hi there!"; }
};
```

## 类

TypeScript支持面向对象编程，可以定义类、继承、实现接口等。

```typescript
class Animal {
  // 字段
  name: string;
  
  // 构造函数
  constructor(name: string) {
    this.name = name;
  }
  
  // 方法
  speak(): void {
    console.log(`${this.name} makes a noise.`);
  }
}

// 继承
class Dog extends Animal {
  breed: string;
  
  constructor(name: string, breed: string) {
    super(name); // 调用父类构造函数
    this.breed = breed;
  }
  
  // 重写父类方法
  speak(): void {
    console.log(`${this.name} barks.`);
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
dog.speak(); // 输出: Buddy barks.
```

## 访问修饰符

TypeScript提供了三种访问修饰符：

1. **public**：默认，任何地方都可以访问
2. **private**：只能在类内部访问
3. **protected**：可以在类内部和子类中访问

```typescript
class Person {
  public name: string;     // 公开属性
  private age: number;     // 私有属性
  protected email: string; // 受保护属性
  
  constructor(name: string, age: number, email: string) {
    this.name = name;
    this.age = age;
    this.email = email;
  }
  
  public greet() {
    return `Hello, my name is ${this.name}`;
  }
  
  private getAge() {
    return this.age; // 只能在类内部访问
  }
}

class Employee extends Person {
  constructor(name: string, age: number, email: string) {
    super(name, age, email);
  }
  
  getEmail() {
    return this.email; // 子类可以访问protected属性
  }
  
  // 无法访问private属性
  // getEmployeeAge() {
  //   return this.age; // 错误
  // }
}
```

## 模块系统

TypeScript支持ES模块系统，可以导入和导出模块。

```typescript
// math.ts
export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

// app.ts
import { add, subtract } from './math';

console.log(add(5, 3));      // 8
console.log(subtract(10, 4)); // 6

// 或者使用默认导出
// math.ts
export default {
  add,
  subtract
};

// app.ts
import math from './math';

console.log(math.add(5, 3));      // 8
console.log(math.subtract(10, 4)); // 6
```

## 实战练习

创建一个简单的学生管理系统，包含以下功能：

1. 定义Student接口
2. 创建Student类
3. 实现添加、查找和显示学生信息的功能

```typescript
// student.ts

interface StudentInfo {
  id: number;
  name: string;
  age: number;
  grade: string;
}

class Student implements StudentInfo {
  id: number;
  name: string;
  age: number;
  grade: string;
  
  constructor(id: number, name: string, age: number, grade: string) {
    this.id = id;
    this.name = name;
    this.age = age;
    this.grade = grade;
  }
  
  displayInfo(): string {
    return `ID: ${this.id}, Name: ${this.name}, Age: ${this.age}, Grade: ${this.grade}`;
  }
}

class StudentManager {
  private students: Student[] = [];
  
  addStudent(student: Student): void {
    this.students.push(student);
  }
  
  findStudentById(id: number): Student | undefined {
    return this.students.find(student => student.id === id);
  }
  
  displayAllStudents(): void {
    console.log("==== Student List ====");
    this.students.forEach(student => {
      console.log(student.displayInfo());
    });
  }
}

// app.ts
// 导入上面的类和接口
// 然后使用它们

const manager = new StudentManager();

const student1 = new Student(101, "Alice", 18, "A");
const student2 = new Student(102, "Bob", 19, "B");

manager.addStudent(student1);
manager.addStudent(student2);
manager.displayAllStudents();

const foundStudent = manager.findStudentById(101);
if (foundStudent) {
  console.log(`Found student: ${foundStudent.displayInfo()}`);
}
```

## 总结

本文介绍了TypeScript的基础环境搭建和核心语法，包括：

1. 安装Node.js和TypeScript
2. 创建和运行TypeScript项目
3. 基本数据类型和类型注解
4. 接口和类的使用
5. 访问修饰符
6. 模块系统

在下一篇教程中，我们将深入学习TypeScript的高级特性，包括泛型、命名空间、高级类型等。敬请期待！