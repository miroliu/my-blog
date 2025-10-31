---
title: "TypeScript进阶(二)：泛型、高级类型与模块化开发"
date: 2025-10-30T12:25:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["TypeScript", "前端", "进阶教程", "泛型", "高级类型", "模块化"]
license: ""
hidden: false
---

# TypeScript进阶(二)：泛型、高级类型与模块化开发

## 前言

在上一篇教程中，我们学习了TypeScript的基础语法和环境搭建。在本文中，我们将深入探讨TypeScript的高级特性，包括泛型、高级类型系统、模块化开发等。这些特性将帮助你写出更类型安全、更灵活的代码。

## 泛型

泛型是TypeScript最强大的特性之一，它允许你编写可重用的组件，这些组件可以支持多种类型而不是单一类型。

### 泛型函数

```typescript
// 泛型函数定义
function identity<T>(arg: T): T {
  return arg;
}

// 使用泛型函数
let output1 = identity<string>("myString");  // 明确指定类型
let output2 = identity(42);  // 类型推断为number

// 泛型数组
function loggingIdentity<T>(arg: T[]): T[] {
  console.log(arg.length);  // 数组有length属性，所以不会报错
  return arg;
}
```

### 泛型接口

```typescript
interface GenericIdentityFn<T> {
  (arg: T): T;
}

function identity<T>(arg: T): T {
  return arg;
}

let myIdentity: GenericIdentityFn<number> = identity;
```

### 泛型类

```typescript
class GenericNumber<T> {
  zeroValue: T;
  add: (x: T, y: T) => T;
}

let myGenericNumber = new GenericNumber<number>();
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function(x, y) { return x + y; };

let stringNumeric = new GenericNumber<string>();
stringNumeric.zeroValue = "";
stringNumeric.add = function(x, y) { return x + y; };
```

### 泛型约束

有时候我们需要限制泛型可以接受的类型范围：

```typescript
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);  // 现在我们知道它有length属性，所以不会报错
  return arg;
}

// loggingIdentity(3);  // 错误，number没有length属性
loggingIdentity({ length: 10, value: 3 });
```

### 泛型与keyof操作符

`keyof`操作符可以获取一个对象类型的所有键：

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

let x = { a: 1, b: 2, c: 3, d: 4 };

getProperty(x, "a"); // 正确
// getProperty(x, "m"); // 错误，"m"不是x的键
```

## 高级类型

### 交叉类型

交叉类型使用`&`符号将多个类型合并为一个：

```typescript
interface Person {
  name: string;
  age: number;
}

interface Employee {
  employeeId: number;
  department: string;
}

// EmployeePerson同时拥有Person和Employee的所有属性
type EmployeePerson = Person & Employee;

const emp: EmployeePerson = {
  name: "John",
  age: 30,
  employeeId: 1001,
  department: "Engineering"
};
```

### 联合类型

联合类型使用`|`符号表示一个值可以是几种类型之一：

```typescript
function formatCommandline(command: string[] | string) {
  let line = "";
  if (typeof command === "string") {
    line = command.trim();
  } else {
    line = command.join(" ").trim();
  }
  return line;
}

// 联合类型的属性访问
interface Bird {
  fly(): void;
  layEggs(): void;
}

interface Fish {
  swim(): void;
  layEggs(): void;
}

function getSmallPet(): Fish | Bird {
  // ...
  return { fly() {}, layEggs() {} } as Bird;
}

let pet = getSmallPet();
pet.layEggs(); // 正确，layEggs在两个类型中都存在
// pet.swim();    // 错误，swim只在Fish中存在
```

### 类型守卫

类型守卫允许你在运行时检查类型：

```typescript
// 使用typeof进行类型守卫
function padLeft(value: string, padding: string | number) {
  if (typeof padding === "number") {
    return Array(padding + 1).join(" ") + value;
  }
  if (typeof padding === "string") {
    return padding + value;
  }
  throw new Error(`Expected string or number, got '${padding}'.`);
}

// 使用instanceof进行类型守卫
class Bird {
  fly() { console.log("Flying"); }
}

class Fish {
  swim() { console.log("Swimming"); }
}

function move(animal: Bird | Fish) {
  if (animal instanceof Bird) {
    animal.fly();
  } else {
    animal.swim();
  }
}

// 使用自定义类型守卫
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

let pet = getSmallPet();
if (isFish(pet)) {
  pet.swim();
} else {
  pet.fly();
}
```

### 字符串字面量类型

字符串字面量类型允许你指定一个字符串必须是特定的值：

```typescript
type Easing = "ease-in" | "ease-out" | "ease-in-out";

function animate(element: HTMLElement, easing: Easing) {
  // ...
}

animate(document.getElementById("app")!, "ease-in"); // 正确
// animate(document.getElementById("app")!, "linear"); // 错误
```

### 映射类型

映射类型允许你基于旧类型创建新类型：

```typescript
interface Person {
  name: string;
  age: number;
}

// 创建只读版本
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type ReadonlyPerson = Readonly<Person>;

// 创建可选版本
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type PartialPerson = Partial<Person>;

// 创建必填版本
type Required<T> = {
  [P in keyof T]-?: T[P];
};

type RequiredPerson = Required<PartialPerson>;

// 创建属性选取版本
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type PersonName = Pick<Person, "name">;
```

### 条件类型

条件类型根据类型关系选择不同的类型：

```typescript
type TypeName<T> = 
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends Function ? "function" :
  "object";

// 分发条件类型
type TypeNameUnion<T> = T extends any ? TypeName<T> : never;
type TypeNames = TypeNameUnion<string | number | boolean>; // "string" | "number" | "boolean"

// 提取类型
type Extract<T, U> = T extends U ? T : never;
type T0 = Extract<"a" | "b" | "c", "a" | "f">;  // "a"

// 排除类型
type Exclude<T, U> = T extends U ? never : T;
type T1 = Exclude<"a" | "b" | "c", "a" | "f">;  // "b" | "c"
```

## 模块化开发

### ES模块导入导出

TypeScript完全支持ES模块系统：

```typescript
// user.ts
// 导出单个函数
export function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

// 导出变量
export const DEFAULT_PAGE_SIZE = 10;

// 导出接口
export interface User {
  id: number;
  name: string;
  email: string;
}

// 导出类
export class UserService {
  getUser(id: number): User {
    // 模拟获取用户
    return { id, name: "User " + id, email: `user${id}@example.com` };
  }
}

// 默认导出
export default class DefaultUserService extends UserService {
  // 扩展默认服务
}

// app.ts
// 导入命名导出
import { formatUserName, DEFAULT_PAGE_SIZE, User, UserService } from './user';

// 导入默认导出
import DefaultUserService from './user';

// 导入所有内容
import * as UserModule from './user';

// 使用导入的内容
const userName = formatUserName("John", "Doe");
const userService = new UserService();
const user = userService.getUser(1);
```

### 命名空间

在TypeScript中，命名空间是另一种组织代码的方式：

```typescript
// 在math.ts中
namespace MathUtils {
  export function add(x: number, y: number): number {
    return x + y;
  }
  
  export function subtract(x: number, y: number): number {
    return x - y;
  }
  
  // 内部使用的函数，不导出
  function validateNumber(num: any): boolean {
    return typeof num === 'number' && !isNaN(num);
  }
}

// 在app.ts中
console.log(MathUtils.add(5, 3));
console.log(MathUtils.subtract(10, 4));
// MathUtils.validateNumber(5); // 错误，未导出
```

### 路径映射

在大型项目中，可以使用路径映射来简化模块导入：

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"]
    }
  }
}
```

然后在代码中可以这样导入：

```typescript
import { Button } from '@components/Button';
import { formatDate } from '@utils/date';
import { UserType } from '@types/user';
```

## 装饰器

装饰器是一种特殊类型的声明，可以附加到类声明、方法、访问器、属性或参数上。装饰器使用`@expression`语法，其中表达式必须计算为一个函数，该函数会在运行时被调用，带有装饰的声明信息。

### 类装饰器

```typescript
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return "Hello, " + this.greeting;
  }
}
```

### 方法装饰器

```typescript
function enumerable(value: boolean) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    descriptor.enumerable = value;
  };
}

class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }

  @enumerable(false)
  greet() {
    return "Hello, " + this.greeting;
  }
}
```

### 属性装饰器

```typescript
function format(target: any, propertyKey: string) {
  let value: string = target[propertyKey];
  
  const getter = () => {
    return value;
  };
  
  const setter = (newVal: string) => {
    value = newVal.trim();
  };
  
  Object.defineProperty(target, propertyKey, {
    get: getter,
    set: setter,
    enumerable: true,
    configurable: true
  });
}

class Person {
  @format
  name: string;
  
  constructor(name: string) {
    this.name = name;
  }
}
```

## 实战项目：构建一个类型安全的数据验证库

让我们创建一个类型安全的数据验证库，展示TypeScript高级特性的实际应用。

### 项目概述

我们将构建一个简单但功能强大的数据验证库，它能够：
1. 根据类型定义自动验证数据
2. 提供自定义验证规则
3. 生成友好的错误信息

### 实现步骤

#### 1. 定义验证器接口和基础类型

```typescript
// validator.ts

// 验证结果接口
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 验证器接口
interface Validator<T> {
  validate(value: any): ValidationResult;
}

// 基础验证器类
abstract class BaseValidator<T> implements Validator<T> {
  abstract validate(value: any): ValidationResult;
  
  protected createSuccess(): ValidationResult {
    return { isValid: true, errors: [] };
  }
  
  protected createFailure(errors: string[]): ValidationResult {
    return { isValid: false, errors };
  }
}
```

#### 2. 实现基本类型验证器

```typescript
// 字符串验证器
class StringValidator extends BaseValidator<string> {
  constructor(
    private minLength?: number,
    private maxLength?: number,
    private pattern?: RegExp,
    private required: boolean = true
  ) {
    super();
  }
  
  validate(value: any): ValidationResult {
    const errors: string[] = [];
    
    if (value === undefined || value === null) {
      if (this.required) {
        errors.push('Value is required');
      }
      return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
    }
    
    if (typeof value !== 'string') {
      errors.push('Value must be a string');
      return this.createFailure(errors);
    }
    
    if (this.minLength !== undefined && value.length < this.minLength) {
      errors.push(`String length must be at least ${this.minLength}`);
    }
    
    if (this.maxLength !== undefined && value.length > this.maxLength) {
      errors.push(`String length must be at most ${this.maxLength}`);
    }
    
    if (this.pattern !== undefined && !this.pattern.test(value)) {
      errors.push('String does not match required pattern');
    }
    
    return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
  }
}

// 数字验证器
class NumberValidator extends BaseValidator<number> {
  constructor(
    private min?: number,
    private max?: number,
    private integerOnly: boolean = false,
    private required: boolean = true
  ) {
    super();
  }
  
  validate(value: any): ValidationResult {
    const errors: string[] = [];
    
    if (value === undefined || value === null) {
      if (this.required) {
        errors.push('Value is required');
      }
      return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
    }
    
    if (typeof value !== 'number' || isNaN(value)) {
      errors.push('Value must be a number');
      return this.createFailure(errors);
    }
    
    if (this.integerOnly && !Number.isInteger(value)) {
      errors.push('Value must be an integer');
    }
    
    if (this.min !== undefined && value < this.min) {
      errors.push(`Number must be at least ${this.min}`);
    }
    
    if (this.max !== undefined && value > this.max) {
      errors.push(`Number must be at most ${this.max}`);
    }
    
    return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
  }
}

// 布尔值验证器
class BooleanValidator extends BaseValidator<boolean> {
  constructor(private required: boolean = true) {
    super();
  }
  
  validate(value: any): ValidationResult {
    const errors: string[] = [];
    
    if (value === undefined || value === null) {
      if (this.required) {
        errors.push('Value is required');
      }
      return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
    }
    
    if (typeof value !== 'boolean') {
      errors.push('Value must be a boolean');
    }
    
    return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
  }
}
```

#### 3. 实现对象验证器

```typescript
// 对象属性验证器映射
type ValidatorMap<T> = {
  [K in keyof T]: Validator<T[K]>;
};

// 对象验证器
class ObjectValidator<T extends object> extends BaseValidator<T> {
  constructor(
    private validators: ValidatorMap<T>,
    private required: boolean = true
  ) {
    super();
  }
  
  validate(value: any): ValidationResult {
    const errors: string[] = [];
    
    if (value === undefined || value === null) {
      if (this.required) {
        errors.push('Object is required');
      }
      return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
    }
    
    if (typeof value !== 'object' || Array.isArray(value)) {
      errors.push('Value must be an object');
      return this.createFailure(errors);
    }
    
    // 验证每个属性
    for (const key in this.validators) {
      if (this.validators.hasOwnProperty(key)) {
        const validator = this.validators[key];
        const result = validator.validate((value as any)[key]);
        
        if (!result.isValid) {
          // 为错误添加属性路径前缀
          result.errors.forEach(error => {
            errors.push(`${key}: ${error}`);
          });
        }
      }
    }
    
    return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
  }
}
```

#### 4. 实现数组验证器

```typescript
// 数组验证器
class ArrayValidator<T> extends BaseValidator<T[]> {
  constructor(
    private itemValidator: Validator<T>,
    private minLength?: number,
    private maxLength?: number,
    private required: boolean = true
  ) {
    super();
  }
  
  validate(value: any): ValidationResult {
    const errors: string[] = [];
    
    if (value === undefined || value === null) {
      if (this.required) {
        errors.push('Array is required');
      }
      return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
    }
    
    if (!Array.isArray(value)) {
      errors.push('Value must be an array');
      return this.createFailure(errors);
    }
    
    if (this.minLength !== undefined && value.length < this.minLength) {
      errors.push(`Array length must be at least ${this.minLength}`);
    }
    
    if (this.maxLength !== undefined && value.length > this.maxLength) {
      errors.push(`Array length must be at most ${this.maxLength}`);
    }
    
    // 验证数组中的每个元素
    value.forEach((item: any, index: number) => {
      const result = this.itemValidator.validate(item);
      if (!result.isValid) {
        // 为错误添加索引前缀
        result.errors.forEach(error => {
          errors.push(`[${index}]: ${error}`);
        });
      }
    });
    
    return errors.length > 0 ? this.createFailure(errors) : this.createSuccess();
  }
}
```

#### 5. 创建验证器工厂函数

```typescript
// 验证器工厂
export const createValidator = {
  string: (options?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    required?: boolean;
  }): StringValidator => {
    return new StringValidator(
      options?.minLength,
      options?.maxLength,
      options?.pattern,
      options?.required !== false
    );
  },
  
  number: (options?: {
    min?: number;
    max?: number;
    integerOnly?: boolean;
    required?: boolean;
  }): NumberValidator => {
    return new NumberValidator(
      options?.min,
      options?.max,
      options?.integerOnly || false,
      options?.required !== false
    );
  },
  
  boolean: (required: boolean = true): BooleanValidator => {
    return new BooleanValidator(required);
  },
  
  object: <T extends object>(
    validators: ValidatorMap<T>,
    required: boolean = true
  ): ObjectValidator<T> => {
    return new ObjectValidator<T>(validators, required);
  },
  
  array: <T>(
    itemValidator: Validator<T>,
    options?: {
      minLength?: number;
      maxLength?: number;
      required?: boolean;
    }
  ): ArrayValidator<T> => {
    return new ArrayValidator<T>(
      itemValidator,
      options?.minLength,
      options?.maxLength,
      options?.required !== false
    );
  }
};
```

#### 6. 使用示例

```typescript
// 定义用户类型
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  active: boolean;
  roles: string[];
  profile: {
    bio: string;
    avatar?: string;
  };
}

// 创建用户验证器
const userValidator = createValidator.object<User>({
  id: createValidator.number({ integerOnly: true, min: 1 }),
  name: createValidator.string({ minLength: 2, maxLength: 50 }),
  email: createValidator.string({ 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format'
  }),
  age: createValidator.number({ min: 18, max: 120, integerOnly: true }),
  active: createValidator.boolean(),
  roles: createValidator.array(createValidator.string()),
  profile: createValidator.object({
    bio: createValidator.string({ maxLength: 500 }),
    avatar: createValidator.string({ required: false })
  })
});

// 测试有效用户
const validUser: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  active: true,
  roles: ["user", "admin"],
  profile: {
    bio: "Software developer",
    avatar: "https://example.com/avatar.jpg"
  }
};

const validResult = userValidator.validate(validUser);
console.log("Valid user result:", validResult);

// 测试无效用户
const invalidUser = {
  id: "not-a-number",
  name: "J",
  email: "invalid-email",
  age: 15,
  active: "yes",
  roles: [1, "admin"],
  profile: {
    bio: "a".repeat(600)
  }
};

const invalidResult = userValidator.validate(invalidUser);
console.log("Invalid user result:", invalidResult);
```

## 总结

本文介绍了TypeScript的高级特性，包括：

1. **泛型**：创建可重用的组件，支持多种类型
2. **高级类型**：联合类型、交叉类型、映射类型、条件类型等
3. **类型守卫**：在运行时检查类型
4. **模块化开发**：ES模块、命名空间、路径映射
5. **装饰器**：修饰类、方法、属性等

这些高级特性使TypeScript成为一个强大的类型系统，可以在编译时捕获更多错误，提高代码质量和可维护性。通过实战项目，我们展示了如何使用这些特性构建一个类型安全的数据验证库。

在下一篇教程中，我们将学习如何在实际项目中使用TypeScript与前端框架（如React、Vue）结合，敬请期待！