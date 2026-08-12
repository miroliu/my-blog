---
title: "TypeScript高级特性与设计模式实战"
date: 2025-10-30T09:45:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["TypeScript", "高级特性", "设计模式", "泛型", "装饰器", "类型体操", "前端开发", "架构设计"]
license: ""
hidden: false
---

# TypeScript高级特性与设计模式实战

## 前言

TypeScript作为JavaScript的超集，不仅提供了静态类型检查，还引入了许多高级特性，使得代码更加健壮和可维护。本文将深入探讨TypeScript的高级特性，并结合设计模式展示如何在实际项目中应用这些特性。

## 一、TypeScript高级类型系统

### 1. 条件类型

条件类型允许我们根据类型关系选择不同的类型：

```typescript
// 条件类型基本语法
T extends U ? X : Y

// 示例：提取Promise的返回类型
type PromiseType<T> = T extends Promise<infer R> ? R : T;

// 使用示例
type StringType = PromiseType<Promise<string>>; // string
type NumberType = PromiseType<number>; // number

// 递归条件类型：展平数组
type Flatten<T> = T extends Array<infer U> ? Flatten<U> : T;

type NestedArray = Flatten<number[][]>; // number
```

### 2. 映射类型

映射类型允许我们基于现有类型创建新类型：

```typescript
// 基本映射类型
interface Person {
  name: string;
  age: number;
}

// Readonly映射
type ReadonlyPerson = { readonly [K in keyof Person]: Person[K] };

// Partial映射
type PartialPerson = { [K in keyof Person]?: Person[K] };

// Required映射
type RequiredPerson = { [K in keyof Person]-?: Person[K] };

// 自定义映射
type ToString<T> = { [K in keyof T]: string };

// 联合类型映射
type UnionType = 'a' | 'b' | 'c';
type UnionRecord = { [K in UnionType]: K };
```

### 3. 模板字面量类型

模板字面量类型允许我们使用模板字符串语法创建类型：

```typescript
// 基本模板字面量类型
type Greeting = `Hello ${'World' | 'TypeScript'}`; // 'Hello World' | 'Hello TypeScript'

// 与映射类型结合
type EventName<T extends string> = `${T}Changed`;
type EventHandler<T extends string> = (newValue: any) => void;

interface Events {
  click: MouseEvent;
  focus: FocusEvent;
}

type EventHandlers = {
  [K in keyof Events as EventName<K>]: (event: Events[K]) => void;
};

// 类型推断结合
type Getter<T extends string> = `get${Capitalize<T>}`;
type Setter<T extends string> = `set${Capitalize<T>}`;

interface PropertyAccessors<T extends Record<string, any>> {
  [K in keyof T as Getter<string & K>]: () => T[K];
  [K in keyof T as Setter<string & K>]: (value: T[K]) => void;
}
```

### 4. 索引类型

索引类型允许我们处理对象的属性和索引：

```typescript
// keyof操作符
interface Person {
  name: string;
  age: number;
}

type PersonKeys = keyof Person; // 'name' | 'age'

// T[K]索引访问
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 索引签名
type Dictionary<T> = { [key: string]: T };
type ReadonlyDictionary<T> = { readonly [key: string]: T };

type NumberDictionary = Dictionary<number>; // { [key: string]: number }
```

## 二、装饰器模式实战

### 1. 装饰器基础

TypeScript支持类装饰器、方法装饰器、属性装饰器和参数装饰器：

```typescript
// 类装饰器
function Component(target: Function) {
  // 为类添加元数据
  target.prototype.isComponent = true;
  return target;
}

// 方法装饰器
function LogMethod(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function(...args: any[]) {
    console.log(`Method ${propertyKey} called with args:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`Method ${propertyKey} returned:`, result);
    return result;
  };
  
  return descriptor;
}

// 属性装饰器
function DefaultValue(value: any) {
  return function(target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      value: value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  };
}

// 参数装饰器
function Validate(target: any, propertyKey: string, parameterIndex: number) {
  console.log(`Validating parameter at index ${parameterIndex} for ${propertyKey}`);
}
```

### 2. 实现依赖注入容器

使用装饰器实现简单的依赖注入容器：

```typescript
// 依赖元数据存储
interface InjectableMetadata {
  token: any;
}

const INJECTABLE_METADATA_KEY = Symbol('injectable');
const INJECT_METADATA_KEY = Symbol('inject');

// 可注入装饰器
function Injectable() {
  return function(target: Function) {
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, {}, target);
    return target;
  };
}

// 注入装饰器
function Inject(token?: any) {
  return function(target: any, propertyKey: string | symbol, parameterIndex: number) {
    const existingInjections = Reflect.getOwnMetadata(INJECT_METADATA_KEY, target, propertyKey) || [];
    existingInjections[parameterIndex] = { token: token || target.constructor };    
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjections, target, propertyKey);
  };
}

// 简单的依赖注入容器
class Container {
  private instances = new Map<any, any>();
  private providers = new Map<any, () => any>();

  // 注册提供者
  provide<T>(token: any, provider: () => T): void {
    this.providers.set(token, provider);
  }

  // 获取实例
  get<T>(token: any): T {
    // 检查是否已有实例
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    // 检查是否有提供者
    if (this.providers.has(token)) {
      const instance = this.providers.get(token)!();
      this.instances.set(token, instance);
      return instance;
    }

    // 尝试直接实例化类
    if (typeof token === 'function') {
      const isInjectable = Reflect.hasOwnMetadata(INJECTABLE_METADATA_KEY, token);
      if (!isInjectable) {
        throw new Error(`Cannot instantiate non-injectable class ${token.name}`);
      }

      // 获取构造函数参数的注入元数据
      const paramTypes = Reflect.getMetadata('design:paramtypes', token) || [];
      const injections = Reflect.getMetadata(INJECT_METADATA_KEY, token, 'constructor') || [];

      // 解析依赖
      const dependencies = paramTypes.map((paramType: any, index: number) => {
        const injectionToken = injections[index]?.token || paramType;
        return this.get(injectionToken);
      });

      // 创建实例
      const instance = new token(...dependencies);
      this.instances.set(token, instance);
      return instance;
    }

    throw new Error(`No provider found for token: ${token}`);
  }
}

// 使用示例
@Injectable()
class Logger {
  log(message: string): void {
    console.log(`[LOG]: ${message}`);
  }
}

@Injectable()
class UserService {
  constructor(@Inject() private logger: Logger) {}

  createUser(username: string): void {
    this.logger.log(`Creating user: ${username}`);
    // 用户创建逻辑
  }
}

// 使用容器
const container = new Container();
container.provide(Logger, () => new Logger());
const userService = container.get(UserService);
userService.createUser('john_doe'); // 输出: [LOG]: Creating user: john_doe
```

## 三、工厂模式与构建器模式

### 1. 工厂模式

工厂模式用于创建对象，隐藏创建逻辑：

```typescript
// 产品接口
interface Product {
  operation(): string;
}

// 具体产品类
class ConcreteProductA implements Product {
  operation(): string {
    return 'Product A operation';
  }
}

class ConcreteProductB implements Product {
  operation(): string {
    return 'Product B operation';
  }
}

// 工厂接口
interface Factory {
  createProduct(type: 'A' | 'B'): Product;
}

// 具体工厂类
class ConcreteFactory implements Factory {
  createProduct(type: 'A' | 'B'): Product {
    switch (type) {
      case 'A':
        return new ConcreteProductA();
      case 'B':
        return new ConcreteProductB();
      default:
        throw new Error(`Unknown product type: ${type}`);
    }
  }
}

// 使用泛型的工厂模式
class GenericFactory {
  static create<T>(constructor: new () => T): T {
    return new constructor();
  }
}

// 使用示例
const factory = new ConcreteFactory();
const productA = factory.createProduct('A');
const productB = factory.createProduct('B');

const genericProductA = GenericFactory.create(ConcreteProductA);
```

### 2. 构建器模式

构建器模式用于构建复杂对象：

```typescript
// 产品类
class Computer {
  constructor(
    public cpu: string,
    public ram: string,
    public storage: string,
    public gpu?: string,
    public cooling?: string
  ) {}
}

// 构建器接口
interface ComputerBuilder {
  setCPU(cpu: string): this;
  setRAM(ram: string): this;
  setStorage(storage: string): this;
  setGPU(gpu: string): this;
  setCooling(cooling: string): this;
  build(): Computer;
}

// 具体构建器
class ConcreteComputerBuilder implements ComputerBuilder {
  private cpu: string = '';
  private ram: string = '';
  private storage: string = '';
  private gpu?: string;
  private cooling?: string;

  setCPU(cpu: string): this {
    this.cpu = cpu;
    return this;
  }

  setRAM(ram: string): this {
    this.ram = ram;
    return this;
  }

  setStorage(storage: string): this {
    this.storage = storage;
    return this;
  }

  setGPU(gpu: string): this {
    this.gpu = gpu;
    return this;
  }

  setCooling(cooling: string): this {
    this.cooling = cooling;
    return this;
  }

  build(): Computer {
    // 验证必要参数
    if (!this.cpu || !this.ram || !this.storage) {
      throw new Error('CPU, RAM and storage are required');
    }

    return new Computer(this.cpu, this.ram, this.storage, this.gpu, this.cooling);
  }
}

// 指挥者类
class Director {
  buildGamingComputer(builder: ComputerBuilder): Computer {
    return builder
      .setCPU('Intel Core i9')
      .setRAM('32GB DDR4')
      .setStorage('2TB NVMe SSD')
      .setGPU('NVIDIA RTX 3080')
      .setCooling('Liquid Cooling')
      .build();
  }

  buildOfficeComputer(builder: ComputerBuilder): Computer {
    return builder
      .setCPU('Intel Core i5')
      .setRAM('16GB DDR4')
      .setStorage('512GB SSD')
      .build();
  }
}

// 使用示例
const builder = new ConcreteComputerBuilder();
const director = new Director();

const gamingComputer = director.buildGamingComputer(builder);
const officeComputer = director.buildOfficeComputer(builder);

// 直接使用构建器
const customComputer = new ConcreteComputerBuilder()
  .setCPU('AMD Ryzen 7')
  .setRAM('64GB DDR4')
  .setStorage('4TB NVMe SSD')
  .setGPU('AMD Radeon RX 6800')
  .build();
```

## 四、观察者模式与发布订阅模式

### 1. 观察者模式

观察者模式定义了对象间的一对多依赖关系：

```typescript
// 观察者接口
interface Observer<T> {
  update(data: T): void;
}

// 可观察对象接口
interface Observable<T> {
  subscribe(observer: Observer<T>): void;
  unsubscribe(observer: Observer<T>): void;
  notify(data: T): void;
}

// 具体可观察对象
class ConcreteObservable<T> implements Observable<T> {
  private observers: Observer<T>[] = [];

  subscribe(observer: Observer<T>): void {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer);
    }
  }

  unsubscribe(observer: Observer<T>): void {
    const index = this.observers.indexOf(observer);
    if (index !== -1) {
      this.observers.splice(index, 1);
    }
  }

  notify(data: T): void {
    this.observers.forEach(observer => observer.update(data));
  }
}

// 具体观察者
class ConcreteObserver<T> implements Observer<T> {
  constructor(private name: string) {}

  update(data: T): void {
    console.log(`${this.name} received update:`, data);
  }
}

// 使用示例
const subject = new ConcreteObservable<string>();
const observer1 = new ConcreteObserver<string>('Observer 1');
const observer2 = new ConcreteObserver<string>('Observer 2');

subject.subscribe(observer1);
subject.subscribe(observer2);
subject.notify('Hello World'); // 两个观察者都会收到通知

subject.unsubscribe(observer1);
subject.notify('Hello Again'); // 只有observer2会收到通知
```

### 2. 发布订阅模式

发布订阅模式是观察者模式的变种，通过事件总线连接发布者和订阅者：

```typescript
// 事件总线接口
interface EventBus {
  on(event: string, callback: (...args: any[]) => void): void;
  off(event: string, callback?: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  once(event: string, callback: (...args: any[]) => void): void;
}

// 具体事件总线
class ConcreteEventBus implements EventBus {
  private events: Map<string, Set<(...args: any[]) => void>> = new Map();

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (!this.events.has(event)) return;

    if (callback) {
      // 移除特定回调
      this.events.get(event)!.delete(callback);
      // 如果事件没有回调了，删除事件
      if (this.events.get(event)!.size === 0) {
        this.events.delete(event);
      }
    } else {
      // 移除事件的所有回调
      this.events.delete(event);
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events.has(event)) return;

    // 复制回调集合，避免回调执行过程中修改集合导致的问题
    const callbacks = Array.from(this.events.get(event)!);
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  once(event: string, callback: (...args: any[]) => void): void {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback);
      callback(...args);
    };
    this.on(event, onceCallback);
  }
}

// 全局事件总线实例
const eventBus = new ConcreteEventBus();

// 使用装饰器简化事件订阅
function Subscribe(event: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    // 保存原始的constructor，避免重写constructor导致的问题
    const originalConstructor = target.constructor;
    
    // 创建新的constructor
    const newConstructor = function(...args: any[]) {
      // 调用原始constructor
      const instance = new originalConstructor(...args);
      
      // 订阅事件
      eventBus.on(event, (...eventArgs: any[]) => {
        // 调用方法，绑定this为实例
        originalMethod.apply(instance, eventArgs);
      });
      
      return instance;
    };
    
    // 复制原型和静态属性
    newConstructor.prototype = originalConstructor.prototype;
    Object.setPrototypeOf(newConstructor, originalConstructor);
    
    return {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: descriptor.writable,
      value: function(...args: any[]) {
        return newConstructor(...args);
      }
    };
  };
}

// 使用示例
class UserNotifier {
  @Subscribe('user:created')
  onUserCreated(user: { id: string; name: string }) {
    console.log(`New user created: ${user.name} (ID: ${user.id})`);
  }

  @Subscribe('user:updated')
  onUserUpdated(user: { id: string; name: string }) {
    console.log(`User updated: ${user.name} (ID: ${user.id})`);
  }
}

// 初始化订阅者
const notifier = new UserNotifier();

// 发布事件
eventBus.emit('user:created', { id: '1', name: 'John Doe' });
eventBus.emit('user:updated', { id: '1', name: 'John Smith' });
```

## 五、适配器模式与外观模式

### 1. 适配器模式

适配器模式用于将一个类的接口转换为客户端期望的另一个接口：

```typescript
// 目标接口
interface Target {
  request(): string;
}

// 适配者类
class Adaptee {
  specificRequest(): string {
    return 'Specific request';
  }
}

// 类适配器
class ClassAdapter extends Adaptee implements Target {
  request(): string {
    const result = this.specificRequest();
    return `Class Adapter: ${result}`;
  }
}

// 对象适配器
class ObjectAdapter implements Target {
  constructor(private adaptee: Adaptee) {}

  request(): string {
    const result = this.adaptee.specificRequest();
    return `Object Adapter: ${result}`;
  }
}

// 使用示例
const classAdapter = new ClassAdapter();
console.log(classAdapter.request()); // 输出: Class Adapter: Specific request

const adaptee = new Adaptee();
const objectAdapter = new ObjectAdapter(adaptee);
console.log(objectAdapter.request()); // 输出: Object Adapter: Specific request

// 实际应用场景：新旧API适配
interface NewAPI {
  createUser(data: { username: string; email: string }): void;
  getUser(id: string): void;
}

class OldAPI {
  registerUser(username: string, email: string): void {
    console.log(`Old API: Registering user ${username}`);
  }

  fetchUser(userId: string): void {
    console.log(`Old API: Fetching user ${userId}`);
  }
}

class APIAdapter implements NewAPI {
  constructor(private oldAPI: OldAPI) {}

  createUser(data: { username: string; email: string }): void {
    this.oldAPI.registerUser(data.username, data.email);
  }

  getUser(id: string): void {
    this.oldAPI.fetchUser(id);
  }
}
```

### 2. 外观模式

外观模式提供了一个统一的接口，简化了复杂子系统的使用：

```typescript
// 子系统类
class CPU {
  start(): void {
    console.log('CPU started');
  }

  shutdown(): void {
    console.log('CPU shutdown');
  }
}

class Memory {
  load(): void {
    console.log('Memory loaded');
  }

  unload(): void {
    console.log('Memory unloaded');
  }
}

class HardDrive {
  read(): void {
    console.log('Hard drive reading');
  }

  write(): void {
    console.log('Hard drive writing');
  }
}

// 外观类
class ComputerFacade {
  private cpu: CPU;
  private memory: Memory;
  private hardDrive: HardDrive;

  constructor() {
    this.cpu = new CPU();
    this.memory = new Memory();
    this.hardDrive = new HardDrive();
  }

  // 提供简单的启动接口
  start(): void {
    console.log('Starting computer...');
    this.cpu.start();
    this.memory.load();
    this.hardDrive.read();
    console.log('Computer started successfully');
  }

  // 提供简单的关机接口
  shutdown(): void {
    console.log('Shutting down computer...');
    this.hardDrive.write();
    this.memory.unload();
    this.cpu.shutdown();
    console.log('Computer shut down successfully');
  }
}

// 使用示例
const computer = new ComputerFacade();
computer.start(); // 一键启动，内部执行多个子系统操作
computer.shutdown(); // 一键关机，内部执行多个子系统操作

// 实际应用场景：API客户端
class HTTPClient {
  get(url: string, options?: any): Promise<any> {
    console.log(`HTTP GET to ${url}`);
    // 实际HTTP请求逻辑
    return Promise.resolve({ data: 'success' });
  }

  post(url: string, data: any, options?: any): Promise<any> {
    console.log(`HTTP POST to ${url}`, data);
    // 实际HTTP请求逻辑
    return Promise.resolve({ data: 'success' });
  }
}

class AuthService {
  login(username: string, password: string): Promise<any> {
    console.log(`Authenticating user ${username}`);
    // 实际认证逻辑
    return Promise.resolve({ token: 'jwt_token' });
  }

  logout(): Promise<void> {
    console.log('Logging out');
    // 实际登出逻辑
    return Promise.resolve();
  }
}

class ApiFacade {
  private httpClient: HTTPClient;
  private authService: AuthService;

  constructor() {
    this.httpClient = new HTTPClient();
    this.authService = new AuthService();
  }

  async loginAndFetchData(username: string, password: string): Promise<any> {
    // 登录并获取token
    const { token } = await this.authService.login(username, password);
    
    // 使用token获取数据
    return this.httpClient.get('/api/data', { headers: { Authorization: `Bearer ${token}` } });
  }

  async logoutAndCleanup(): Promise<void> {
    await this.authService.logout();
    // 清理本地数据等
  }
}
```

## 六、策略模式与命令模式

### 1. 策略模式

策略模式定义了一系列算法，并使它们可以互换：

```typescript
// 策略接口
interface SortingStrategy {
  sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[];
}

// 具体策略
class BubbleSortStrategy implements SortingStrategy {
  sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    const sortedArray = [...array];
    const n = sortedArray.length;
    
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (compareFn ? compareFn(sortedArray[j], sortedArray[j + 1]) > 0 : sortedArray[j] > sortedArray[j + 1]) {
          [sortedArray[j], sortedArray[j + 1]] = [sortedArray[j + 1], sortedArray[j]];
        }
      }
    }
    
    return sortedArray;
  }
}

class QuickSortStrategy implements SortingStrategy {
  sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    const sortedArray = [...array];
    
    if (sortedArray.length <= 1) return sortedArray;
    
    this.quickSort(sortedArray, 0, sortedArray.length - 1, compareFn || ((a, b) => a > b ? 1 : -1));
    return sortedArray;
  }
  
  private quickSort<T>(array: T[], low: number, high: number, compareFn: (a: T, b: T) => number): void {
    if (low < high) {
      const pivotIndex = this.partition(array, low, high, compareFn);
      this.quickSort(array, low, pivotIndex - 1, compareFn);
      this.quickSort(array, pivotIndex + 1, high, compareFn);
    }
  }
  
  private partition<T>(array: T[], low: number, high: number, compareFn: (a: T, b: T) => number): number {
    const pivot = array[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
      if (compareFn(array[j], pivot) < 0) {
        i++;
        [array[i], array[j]] = [array[j], array[i]];
      }
    }
    
    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    return i + 1;
  }
}

// 上下文类
class SortContext {
  constructor(private strategy: SortingStrategy) {}
  
  setStrategy(strategy: SortingStrategy): void {
    this.strategy = strategy;
  }
  
  sort<T>(array: T[], compareFn?: (a: T, b: T) => number): T[] {
    return this.strategy.sort(array, compareFn);
  }
}

// 使用示例
const numbers = [5, 2, 9, 1, 5, 6];

// 使用冒泡排序
const bubbleSortStrategy = new BubbleSortStrategy();
const context = new SortContext(bubbleSortStrategy);
const bubbleSorted = context.sort(numbers);
console.log('Bubble sort result:', bubbleSorted);

// 切换到快速排序
const quickSortStrategy = new QuickSortStrategy();
context.setStrategy(quickSortStrategy);
const quickSorted = context.sort(numbers);
console.log('Quick sort result:', quickSorted);

// 使用自定义比较函数排序对象
const users = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 22 }
];

const sortedByAge = context.sort(users, (a, b) => a.age - b.age);
console.log('Sorted by age:', sortedByAge);
```

### 2. 命令模式

命令模式将请求封装为对象，从而使用户可以用不同的请求参数化对象：

```typescript
// 命令接口
interface Command {
  execute(): void;
  undo(): void;
}

// 接收者类
class TextEditor {
  private text: string = '';
  
  append(text: string): void {
    this.text += text;
    console.log(`Text appended: "${text}". Current text: "${this.text}"`);
  }
  
  delete(length: number): void {
    const deletedText = this.text.slice(-length);
    this.text = this.text.slice(0, -length);
    console.log(`Deleted "${deletedText}". Current text: "${this.text}"`);
  }
  
  getText(): string {
    return this.text;
  }
  
  setText(text: string): void {
    this.text = text;
  }
}

// 具体命令：添加文本
class AppendTextCommand implements Command {
  private previousText: string;
  
  constructor(
    private editor: TextEditor,
    private text: string
  ) {
    this.previousText = editor.getText();
  }
  
  execute(): void {
    this.editor.append(this.text);
  }
  
  undo(): void {
    this.editor.setText(this.previousText);
    console.log(`Undo: Text restored to "${this.previousText}"`);
  }
}

// 具体命令：删除文本
class DeleteTextCommand implements Command {
  private deletedText: string = '';
  
  constructor(
    private editor: TextEditor,
    private length: number
  ) {}
  
  execute(): void {
    const currentText = this.editor.getText();
    this.deletedText = currentText.slice(-this.length);
    this.editor.delete(this.length);
  }
  
  undo(): void {
    this.editor.append(this.deletedText);
    console.log(`Undo: Restored deleted text "${this.deletedText}"`);
  }
}

// 调用者类：命令管理器
class CommandManager {
  private commandHistory: Command[] = [];
  private undoStack: Command[] = [];
  
  executeCommand(command: Command): void {
    command.execute();
    this.commandHistory.push(command);
    // 清空撤销栈，因为执行新命令后无法继续之前的撤销操作
    this.undoStack = [];
  }
  
  undo(): void {
    if (this.commandHistory.length === 0) {
      console.log('Nothing to undo');
      return;
    }
    
    const command = this.commandHistory.pop()!;
    command.undo();
    this.undoStack.push(command);
  }
  
  redo(): void {
    if (this.undoStack.length === 0) {
      console.log('Nothing to redo');
      return;
    }
    
    const command = this.undoStack.pop()!;
    command.execute();
    this.commandHistory.push(command);
  }
}

// 使用示例
const editor = new TextEditor();
const commandManager = new CommandManager();

// 执行添加文本命令
const appendCommand1 = new AppendTextCommand(editor, 'Hello');
commandManager.executeCommand(appendCommand1);

const appendCommand2 = new AppendTextCommand(editor, ' World');
commandManager.executeCommand(appendCommand2);

// 执行删除文本命令
const deleteCommand = new DeleteTextCommand(editor, 6);
commandManager.executeCommand(deleteCommand);

// 撤销操作
commandManager.undo(); // 撤销删除操作
commandManager.undo(); // 撤销添加 " World"操作

// 重做操作
commandManager.redo(); // 重做添加 " World"操作
```

## 七、TypeScript类型体操实战

### 1. 类型体操基础

类型体操是指使用TypeScript的类型系统进行复杂的类型转换和计算：

```typescript
// 实现Pick类型
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 实现Omit类型
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// 实现Partial类型
type MyPartial<T> = {
  [P in keyof T]?: T[P];
};

// 实现Required类型
type MyRequired<T> = {
  [P in keyof T]-?: T[P];
};

// 实现Readonly类型
type MyReadonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 实现Record类型
type MyRecord<K extends keyof any, T> = {
  [P in K]: T;
};

// 实现Exclude类型
type MyExclude<T, U> = T extends U ? never : T;

// 实现Extract类型
type MyExtract<T, U> = T extends U ? T : never;

// 实现NonNullable类型
type MyNonNullable<T> = T extends null | undefined ? never : T;

// 实现ReturnType类型
type MyReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R : any;

// 实现Parameters类型
type MyParameters<T extends (...args: any[]) => any> = T extends (...args: infer P) => any ? P : never;
```

### 2. 高级类型体操

实现一些更复杂的类型体操：

```typescript
// 深度Readonly
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 深度Partial
type DeepPartial<T> = T extends Function 
  ? T 
  : T extends Array<infer U> 
    ? DeepPartialArray<U> 
    : T extends ReadonlyArray<infer U> 
      ? ReadonlyArray<DeepPartial<U>> 
      : T extends object 
        ? { [K in keyof T]?: DeepPartial<T[K]> } 
        : T;

// 辅助类型
interface DeepPartialArray<T> extends Array<DeepPartial<T>> {}

// 联合类型转交叉类型
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// 字符串类型转联合类型
type StringToUnion<S extends string> = S extends `${infer First}${infer Rest}` ? First | StringToUnion<Rest> : never;

// 数组类型转联合类型
type ArrayToUnion<T extends any[]> = T[number];

// 联合类型转元组类型
type UnionToTuple<U> = UnionToIntersection<U extends any ? (k: U) => void : never> extends ((k: infer I) => void) ? [I] : never;

// 去除对象中的函数属性
type RemoveFunctionProps<T> = {
  [P in keyof T]: T[P] extends Function ? never : T[P];
};

// 获取对象的所有键路径
type Keys<T> = T extends object ? { [K in keyof T]: K | `${K}.${Keys<T[K]>}` }[keyof T] : never;

// 获取对象指定路径的值类型
type Get<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Get<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

// 示例使用
interface Person {
  name: string;
  age: number;
  address: {
    street: string;
    city: string;
    country: string;
  };
  hobbies: string[];
  greet: () => string;
}

// 测试深度Readonly
const person1: DeepReadonly<Person> = {
  name: 'John',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'Any City',
    country: 'Any Country'
  },
  hobbies: ['reading', 'coding'],
  greet: () => 'Hello'
};
// person1.name = 'Jane'; // 错误：无法分配到 "name" ，因为它是只读属性

// 测试深度Partial
const person2: DeepPartial<Person> = {
  name: 'Jane',
  address: {
    street: '456 Side St'
  }
};

// 测试字符串类型转联合类型
type CharUnion = StringToUnion<'abc'>; // 'a' | 'b' | 'c'

// 测试数组类型转联合类型
type NumberUnion = ArrayToUnion<[1, 2, 3]>; // 1 | 2 | 3

// 测试键路径类型
type PersonKeys = Keys<Person>; // 'name' | 'age' | 'address' | 'hobbies' | 'greet' | 'address.street' | ...

// 测试Get类型
type StreetType = Get<Person, 'address.street'>; // string
```

## 八、实际项目中的应用

### 1. 构建类型安全的API客户端

使用TypeScript高级特性构建类型安全的API客户端：

```typescript
// API端点定义
interface ApiEndpoints {
  'GET /api/users': {
    params: { page?: number; limit?: number };
    response: { data: User[]; total: number; page: number };
  };
  'GET /api/users/:id': {
    params: { id: string };
    response: User;
  };
  'POST /api/users': {
    body: { name: string; email: string };
    response: User;
  };
  'PUT /api/users/:id': {
    params: { id: string };
    body: { name?: string; email?: string };
    response: User;
  };
  'DELETE /api/users/:id': {
    params: { id: string };
    response: { success: boolean };
  };
}

// 用户类型
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// HTTP方法类型
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// 端点键类型
type EndpointKey = keyof ApiEndpoints;

// 提取HTTP方法
type Method<T extends EndpointKey> = T extends `${infer M} ${string}` ? M : never;

// 提取URL路径
type Path<T extends EndpointKey> = T extends `${string} ${infer P}` ? P : never;

// 提取参数类型
type Params<T extends EndpointKey> = ApiEndpoints[T] extends { params: infer P } ? P : never;

// 提取请求体类型
type RequestBody<T extends EndpointKey> = ApiEndpoints[T] extends { body: infer B } ? B : never;

// 提取响应类型
type Response<T extends EndpointKey> = ApiEndpoints[T]['response'];

// API客户端类
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // 通用请求方法
  async request<T extends EndpointKey>(
    endpoint: T,
    options?: {
      params?: Params<T>;
      body?: RequestBody<T>;
      headers?: Record<string, string>;
    }
  ): Promise<Response<T>> {
    const method = endpoint.split(' ')[0] as HttpMethod;
    const path = endpoint.split(' ')[1];
    
    // 构建URL
    let url = `${this.baseUrl}${path}`;
    
    // 处理路径参数
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (url.includes(`:${key}`)) {
          url = url.replace(`:${key}`, String(value));
        }
      });
      
      // 添加查询参数
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (!path.includes(`:${key}`) && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    // 构建请求配置
    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    };
    
    // 添加请求体
    if (options?.body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(options.body);
    }
    
    // 发送请求
    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data as Response<T>;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
  
  // 便捷方法：GET
  get<T extends EndpointKey & `GET ${string}`>(
    endpoint: T,
    params?: Params<T>,
    headers?: Record<string, string>
  ): Promise<Response<T>> {
    return this.request(endpoint, { params, headers });
  }
  
  // 便捷方法：POST
  post<T extends EndpointKey & `POST ${string}`>(
    endpoint: T,
    body: RequestBody<T>,
    params?: Params<T>,
    headers?: Record<string, string>
  ): Promise<Response<T>> {
    return this.request(endpoint, { params, body, headers });
  }
  
  // 便捷方法：PUT
  put<T extends EndpointKey & `PUT ${string}`>(
    endpoint: T,
    body: RequestBody<T>,
    params?: Params<T>,
    headers?: Record<string, string>
  ): Promise<Response<T>> {
    return this.request(endpoint, { params, body, headers });
  }
  
  // 便捷方法：DELETE
  delete<T extends EndpointKey & `DELETE ${string}`>(
    endpoint: T,
    params?: Params<T>,
    headers?: Record<string, string>
  ): Promise<Response<T>> {
    return this.request(endpoint, { params, headers });
  }
}

// 使用示例
const apiClient = new ApiClient('https://api.example.com');

// 获取用户列表
async function getUsers() {
  const response = await apiClient.get('GET /api/users', { page: 1, limit: 10 });
  console.log(response.data); // User[] 类型
}

// 获取单个用户
async function getUser(id: string) {
  const user = await apiClient.get('GET /api/users/:id', { id });
  console.log(user.name); // string 类型
}

// 创建用户
async function createUser(name: string, email: string) {
  const newUser = await apiClient.post('POST /api/users', { name, email });
  console.log(newUser.id); // string 类型
}
```

### 2. 实现类型安全的状态管理

使用TypeScript实现类型安全的状态管理：

```typescript
// 状态管理接口
interface StateManager<T extends Record<string, any>> {
  // 获取状态
  getState<K extends keyof T>(key?: K): K extends undefined ? T : T[K];
  
  // 设置状态
  setState<K extends keyof T>(key: K, value: T[K]): void;
  
  // 批量设置状态
  setStatePartial(state: Partial<T>): void;
  
  // 订阅状态变化
  subscribe<K extends keyof T>(key: K, listener: (newValue: T[K], oldValue: T[K]) => void): () => void;
  
  // 订阅所有状态变化
  subscribeAll(listener: (newState: T, oldState: T) => void): () => void;
  
  // 批量更新（原子操作）
  update(updater: (state: Readonly<T>) => Partial<T>): void;
}

// 具体状态管理器实现
class ConcreteStateManager<T extends Record<string, any>> implements StateManager<T> {
  private state: T;
  private listeners: Map<keyof T, Set<(newValue: any, oldValue: any) => void>> = new Map();
  private allListeners: Set<(newState: T, oldState: T) => void> = new Set();

  constructor(initialState: T) {
    this.state = { ...initialState };
  }

  getState<K extends keyof T>(key?: K): K extends undefined ? T : T[K] {
    if (key === undefined) {
      return { ...this.state } as K extends undefined ? T : T[K];
    }
    return this.state[key] as K extends undefined ? T : T[K];
  }

  setState<K extends keyof T>(key: K, value: T[K]): void {
    const oldValue = this.state[key];
    if (oldValue !== value) {
      const oldState = { ...this.state };
      this.state = { ...this.state, [key]: value };
      
      // 通知相关监听器
      if (this.listeners.has(key)) {
        this.listeners.get(key)!.forEach(listener => listener(value, oldValue));
      }
      
      // 通知所有监听器
      this.allListeners.forEach(listener => listener({ ...this.state }, oldState));
    }
  }

  setStatePartial(state: Partial<T>): void {
    const oldState = { ...this.state };
    let hasChanged = false;
    
    // 检查是否有变化
    Object.entries(state).forEach(([key, value]) => {
      if (this.state[key as keyof T] !== value) {
        hasChanged = true;
      }
    });
    
    if (hasChanged) {
      this.state = { ...this.state, ...state };
      
      // 通知每个变化字段的监听器
      Object.entries(state).forEach(([key, value]) => {
        const typedKey = key as keyof T;
        const oldValue = oldState[typedKey];
        
        if (oldValue !== value && this.listeners.has(typedKey)) {
          this.listeners.get(typedKey)!.forEach(listener => listener(value, oldValue));
        }
      });
      
      // 通知所有监听器
      this.allListeners.forEach(listener => listener({ ...this.state }, oldState));
    }
  }

  subscribe<K extends keyof T>(
    key: K,
    listener: (newValue: T[K], oldValue: T[K]) => void
  ): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(listener);
    
    // 返回取消订阅函数
    return () => {
      if (this.listeners.has(key)) {
        this.listeners.get(key)!.delete(listener);
        
        // 如果没有监听器了，删除该键
        if (this.listeners.get(key)!.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  subscribeAll(listener: (newState: T, oldState: T) => void): () => void {
    this.allListeners.add(listener);
    
    // 返回取消订阅函数
    return () => {
      this.allListeners.delete(listener);
    };
  }

  update(updater: (state: Readonly<T>) => Partial<T>): void {
    const oldState = { ...this.state };
    const partialState = updater({ ...this.state });
    
    // 检查是否有变化
    let hasChanged = false;
    Object.entries(partialState).forEach(([key, value]) => {
      if (this.state[key as keyof T] !== value) {
        hasChanged = true;
      }
    });
    
    if (hasChanged) {
      this.state = { ...this.state, ...partialState };
      
      // 通知每个变化字段的监听器
      Object.entries(partialState).forEach(([key, value]) => {
        const typedKey = key as keyof T;
        const oldValue = oldState[typedKey];
        
        if (oldValue !== value && this.listeners.has(typedKey)) {
          this.listeners.get(typedKey)!.forEach(listener => listener(value, oldValue));
        }
      });
      
      // 通知所有监听器
      this.allListeners.forEach(listener => listener({ ...this.state }, oldState));
    }
  }
}

// 使用示例
interface AppState {
  count: number;
  user: { name: string; isLoggedIn: boolean };
  theme: 'light' | 'dark';
}

// 创建状态管理器
const initialState: AppState = {
  count: 0,
  user: { name: 'Guest', isLoggedIn: false },
  theme: 'light'
};

const stateManager = new ConcreteStateManager(initialState);

// 订阅特定状态变化
const unsubscribeCount = stateManager.subscribe('count', (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`);
});

// 订阅所有状态变化
const unsubscribeAll = stateManager.subscribeAll((newState, oldState) => {
  console.log('State changed:', { oldState, newState });
});

// 设置状态
stateManager.setState('count', 1); // 会触发count和all的监听器

// 批量设置状态
stateManager.setStatePartial({
  count: 2,
  theme: 'dark'
}); // 会触发count、theme和all的监听器

// 使用update方法
stateManager.update(state => ({
  user: { ...state.user, name: 'John Doe' }
})); // 会触发user和all的监听器

// 获取状态
const count = stateManager.getState('count'); // 类型为number
const user = stateManager.getState('user'); // 类型为{ name: string; isLoggedIn: boolean }
const fullState = stateManager.getState(); // 类型为AppState

// 取消订阅
unsubscribeCount(); // 不再接收count变化的通知
unsubscribeAll(); // 不再接收所有变化的通知
```

## 总结

本文深入探讨了TypeScript的高级特性与设计模式的实战应用。通过学习条件类型、映射类型、模板字面量类型等高级类型系统特性，以及装饰器、工厂模式、观察者模式等设计模式，我们可以构建更加健壮、可维护的TypeScript应用。

主要内容回顾：

1. **TypeScript高级类型系统**：掌握了条件类型、映射类型、模板字面量类型和索引类型等高级特性
2. **装饰器模式实战**：学习了如何使用装饰器实现依赖注入容器等功能
3. **工厂模式与构建器模式**：通过具体案例展示了如何封装对象创建逻辑
4. **观察者模式与发布订阅模式**：实现了事件驱动的架构设计
5. **适配器模式与外观模式**：解决了接口不兼容和简化复杂系统的问题
6. **策略模式与命令模式**：实现了算法族的封装和请求的参数化
7. **TypeScript类型体操实战**：练习了复杂类型转换和计算技巧
8. **实际项目中的应用**：展示了如何在API客户端和状态管理中应用这些技术

通过灵活运用这些高级特性和设计模式，我们可以大大提高代码的质量和开发效率，构建更加优雅和可维护的TypeScript应用。无论是中小型项目还是大型企业级应用，这些技术都能帮助我们应对各种复杂的开发挑战。