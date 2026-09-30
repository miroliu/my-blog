---
title: "Spring入门指南：通俗易懂的Java开发框架教程"
description: "从零开始学习Spring框架，搞懂IoC/DI依赖注入、AOP面向切面编程，适合所有Java初学者"
date: 2026-04-15T09:00:00+08:00
categories: ["技术分享"]
tags:
  - Spring
  - Java
  - IoC
  - DI
  - 依赖注入
  - AOP
comments: true
---

## 前言

"Spring是什么？"

"学Java为什么要学Spring？"

"IoC是什么？DI又是什么？"

"面向切面编程听不懂啊！"

别担心，这篇文章就是为零基础同学准备的。用最通俗的语言，最直白的例子，带你彻底搞懂Spring。

---

## 一、Spring是什么？

### 1.1 一句话理解Spring

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring是什么？                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Spring = Java开发的"超级工具箱"                               │
│                                                                 │
│   就像：                                                        │
│   ├── 厨房有各种工具（刀、锅、铲子...）                        │
│   └── Spring有各种功能（帮你快速开发）                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   没有Spring：                                          │   │
│   │   你要自己造轮子、自己组装、自己调试                      │   │
│   │                                                         │   │
│   │   有Spring：                                            │   │
│   │   Spring帮你做好一切，你只管用！                        │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Spring能做什么？

```
┌─────────────────────────────────────────────────────────────────┐
│                      Spring功能一览                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1️⃣ Web开发                                              │   │
│   │    做个网站、处理用户请求、返回网页                       │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 2️⃣ 数据库操作                                           │   │
│   │    连接数据库、增删改查                                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 3️⃣ 事务管理                                             │   │
│   │    保证数据一致性，转账不出错                            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 4️⃣ 安全控制                                             │   │
│   │    登录验证、权限控制                                    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 5️⃣ 远程调用                                             │   │
│   │    调用其他系统的接口                                    │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 6️⃣ 消息队列                                             │   │
│   │    异步处理、解耦                                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   等等...Spring几乎能帮你做所有事情！                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Spring家族成员

```
┌─────────────────────────────────────────────────────────────────┐
│                      Spring家族                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        ┌──────────┐                            │
│                        │  Spring  │                            │
│                        │  框架    │                            │
│                        └────┬─────┘                            │
│                             │                                   │
│     ┌──────────┬───────────┼───────────┬──────────┐             │
│     │          │           │           │          │             │
│     ▼          ▼           ▼           ▼          ▼             │
│ ┌───────┐ ┌───────┐ ┌──────────┐ ┌───────┐ ┌──────────┐        │
│ │Spring │ │Spring │ │ Spring   │ │Spring │ │ Spring   │        │
│ │ Web   │ │DAO/   │ │ Context  │ │ AOP   │ │ TX       │        │
│ │ (MVC) │ │ ORM   │ │ (容器)   │ │ (切面) │ │ (事务)   │        │
│ └───────┘ └───────┘ └──────────┘ └───────┘ └──────────┘        │
│                                                                 │
│                        Spring生态                                │
│     ┌──────────┬───────────┬───────────┬──────────┐             │
│     │          │           │           │          │             │
│     ▼          ▼           ▼           ▼          ▼             │
│ ┌───────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐      │
│ │Spring │ │ Spring   │ │ Spring   │ │Spring │ │ Spring   │      │
│ │Boot   │ │ Cloud    │ │ Security │ │ Data  │ │ Batch   │      │
│ │启动器 │ │ 微服务   │ │ 安全    │ │ 数据   │ │ 批处理  │      │
│ └───────┘ └──────────┘ └──────────┘ └───────┘ └──────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、第一个Spring程序

### 2.1 创建Maven项目

```xml
<!-- pom.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>spring-demo</artifactId>
    <version>1.0-SNAPSHOT</version>

    <dependencies>
        <!-- Spring核心依赖 -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
            <version>6.0.11</version>
        </dependency>

        <!-- 单元测试 -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.0</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

### 2.2 创建User类

```java
package com.example.spring;

/**
 * 用户类 - 我们的第一个Spring Bean
 */
public class User {

    private String name;
    private int age;

    // 构造方法
    public User() {
        System.out.println("User对象被创建了！");
    }

    // Getter和Setter
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }

    // 业务方法
    public void sayHello() {
        System.out.println("Hello, 我是" + name + "，今年" + age + "岁！");
    }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + "}";
    }
}
```

### 2.3 创建Spring配置文件

```xml
<!-- resources/applicationContext.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!--
        bean标签：告诉Spring创建一个对象
        class: 要创建对象的类（全限定类名）
        id: 给这个对象起个名字，方便后面使用
    -->
    <bean id="user" class="com.example.spring.User">
        <!-- property标签：设置属性值 -->
        <property name="name" value="张三"/>
        <property name="age" value="25"/>
    </bean>

</beans>
```

### 2.4 创建测试类

```java
package com.example.spring;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;

public class SpringTest {

    @Test
    public void testFirstSpring() {
        // 1. 加载Spring配置文件，创建Spring容器
        ApplicationContext context =
            new ClassPathXmlApplicationContext("applicationContext.xml");

        // 2. 从容器中获取对象（根据bean的id）
        User user = (User) context.getBean("user");

        // 3. 调用对象的方法
        user.sayHello();

        // 打印结果：Hello, 我是张三，今年25岁！
    }
}
```

**运行结果：**
```
User对象被创建了！
Hello, 我是张三，今年25岁！
```

### 2.5 图解第一个Spring程序

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring程序执行流程                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. 创建ApplicationContext（Spring容器）                       │
│      applicationContext.xml                                     │
│           │                                                     │
│           ▼                                                     │
│      ┌────────────────────────────────────────────────────┐    │
│      │              Spring容器（Container）                 │    │
│      │                                                     │    │
│      │   user ──────────────────→ User对象                 │    │
│      │   (id)                    name="张三"               │    │
│      │                          age=25                     │    │
│      │                                                     │    │
│      └────────────────────────────────────────────────────┘    │
│           │                                                     │
│           ▼                                                     │
│      getBean("user")                                           │
│           │                                                     │
│           ▼                                                     │
│      ┌────────────────┐                                        │
│      │   User对象     │                                        │
│      │   sayHello()  │                                        │
│      └────────────────┘                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、IoC控制反转

### 3.1 什么是IoC？

```
┌─────────────────────────────────────────────────────────────────┐
│                    IoC控制反转 - 通俗解释                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   IoC = Inversion of Control = 控制反转                         │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   举个例子：汽车和轮子                                   │   │
│   │                                                         │   │
│   │   ❌ 传统方式（主动创建）：                              │   │
│   │      class 汽车 {                                       │   │
│   │          轮子 = new 轮子();  // 自己造轮子              │   │
│   │      }                                                  │   │
│   │                                                         │   │
│   │   ✅ Spring方式（IoC）：                                 │   │
│   │      class 汽车 {                                       │   │
│   │          轮子轮子;  // 别人给我，我等着                  │   │
│   │      }                                                  │   │
│   │                                                         │   │
│   │      Spring会帮你 new 轮子()，然后"给"你               │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   简单说：                                                       │
│   ├── 以前：自己 new 对象                                       │
│   └── 现在：Spring帮你 new，你等着用就行                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 IoC的原理

```
┌─────────────────────────────────────────────────────────────────┐
│                    IoC原理图解                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   没有IoC（主动创建）：                                         │
│   ┌────────────┐                                              │
│   │   User类    │                                              │
│   │            │                                              │
│   │ new User() │ ──────→ User对象                             │
│   └────────────┘                                              │
│       │                                                        │
│       │ 自己控制                                               │
│       └────────────────────────────────────────────→ 耦合严重  │
│                                                                 │
│   有IoC（被动接收）：                                           │
│   ┌────────────┐                                              │
│   │   User类    │                                              │
│   │            │                                              │
│   │  轮子轮子; │ ←──────────┐                                 │
│   └────────────┘           │                                   │
│       │                    │                                   │
│       │ 不需要new          │ Spring注入                        │
│       │ 只要一个属性       │ 轮子轮子 = new 轮子()             │
│       │                    │                                   │
│       └──────────────────────────────→ 耦合度低               │
│                                                                 │
│   好处：                                                        │
│   ├── 类之间的耦合降低了                                        │
│   ├── 代码更容易测试                                           │
│   ├── 代码更灵活，容易替换组件                                  │
│   └── 便于管理对象                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 四、DI依赖注入

### 4.1 什么是DI？

```
┌─────────────────────────────────────────────────────────────────┐
│                    DI依赖注入 - 通俗解释                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   DI = Dependency Injection = 依赖注入                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   依赖：一个类要用到另一个类                             │   │
│   │                                                         │   │
│   │   class 汽车 {                                          │   │
│   │       轮子轮子;  // 汽车依赖轮子                        │   │
│   │   }                                                     │   │
│   │                                                         │   │
│   │   注入：把依赖的对象传进来                               │   │
│   │                                                         │   │
│   │   class 汽车 {                                          │   │
│   │       轮子轮子;                                          │   │
│   │                                                         │   │
│   │       // 构造方法注入                                    │   │
│   │       public 汽车(轮子 w) {                             │   │
│   │           轮子 = w;                                     │   │
│   │       }                                                 │   │
│   │   }                                                     │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   简单说：                                                       │
│   └── 我需要什么，Spring就给我什么                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 三种注入方式

#### 方式1：构造方法注入

```java
// 1. 创建轮子类
public class Wheel {
    private String brand;

    public Wheel(String brand) {
        this.brand = brand;
    }

    @Override
    public String toString() {
        return "Wheel{brand='" + brand + "'}";
    }
}

// 2. 创建汽车类（使用构造方法注入）
public class Car {
    private String name;
    private Wheel wheel;

    // 构造方法注入
    public Car(String name, Wheel wheel) {
        this.name = name;
        this.wheel = wheel;
    }

    public void drive() {
        System.out.println(name + "使用" + wheel + "在行驶");
    }
}
```

```xml
<!-- Spring配置文件 -->
<bean id="wheel" class="com.example.Wheel">
    <constructor-arg value="米其林"/>
</bean>

<bean id="car" class="com.example.Car">
    <!-- constructor-arg：构造方法参数 -->
    <constructor-arg value="宝马"/>
    <constructor-arg ref="wheel"/>
</bean>
```

```
执行结果：宝马使用Wheel{brand='米其林'}在行驶
```

#### 方式2：Set方法注入

```java
// 1. 创建手机类
public class Phone {
    private String brand;

    public void setBrand(String brand) {
        this.brand = brand;
    }

    @Override
    public String toString() {
        return "Phone{brand='" + brand + "'}";
    }
}

// 2. 创建人类（使用Set方法注入）
public class Person {
    private String name;
    private Phone phone;

    // Set方法注入
    public void setName(String name) {
        this.name = name;
    }

    public void setPhone(Phone phone) {
        this.phone = phone;
    }

    public void call() {
        System.out.println(name + "用" + phone + "打电话");
    }
}
```

```xml
<!-- Spring配置文件 -->
<bean id="phone" class="com.example.Phone">
    <property name="brand" value="苹果"/>
</bean>

<bean id="person" class="com.example.Person">
    <property name="name" value="李四"/>
    <!-- ref：引用另一个bean -->
    <property name="phone" ref="phone"/>
</bean>
```

```
执行结果：李四用Phone{brand='苹果'}打电话
```

#### 方式3：p命名空间注入（简化写法）

```xml
<!-- 使用p命名空间简化 -->
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:p="http://www.springframework.org/schema/p"
       ...>

    <bean id="phone" class="com.example.Phone" p:brand="华为"/>

    <bean id="person" class="com.example.Person"
          p:name="王五" p:phone-ref="phone"/>

</beans>
```

### 4.3 注入方式对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    三种注入方式对比                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┬─────────────┬─────────────┐                   │
│   │  方式        │  写法       │  推荐程度   │                   │
│   ├─────────────┼─────────────┼─────────────┤                   │
│   │ 构造方法注入 │ 通过constructor-arg│ ⭐⭐⭐⭐⭐  │
│   │             │             │  推荐使用   │                   │
│   ├─────────────┼─────────────┼─────────────┤                   │
│   │ Setter注入  │ 通过property │ ⭐⭐⭐⭐    │
│   │             │             │  常用      │                   │
│   ├─────────────┼─────────────┼─────────────┤                   │
│   │ p命名空间   │ 简化写法    │ ⭐⭐⭐      │
│   │             │             │  简化配置   │                   │
│   └─────────────┴─────────────┴─────────────┘                   │
│                                                                 │
│   选择建议：                                                     │
│   ├── 必选依赖用构造方法                                         │
│   ├── 可选依赖用Setter方法                                       │
│   └── 简单配置用p命名空间                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 五、Bean管理

### 5.1 Bean的作用域

```xml
<!-- bean的作用域 -->
<bean id="user" class="com.example.User" scope="作用域">
</bean>
```

| 作用域 | 说明 | 示例 |
|--------|------|------|
| **singleton** | 单例，整个容器只有一个实例（默认） | 每次getBean都返回同一个对象 |
| **prototype** | 原型，每次getBean都创建新实例 | 每次getBean都返回新对象 |
| **request** | 每次HTTP请求创建一个 | Web应用中 |
| **session** | 每次HTTP会话创建一个 | Web应用中 |

```
┌─────────────────────────────────────────────────────────────────┐
│                    singleton vs prototype                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   singleton（单例）：                                            │
│   ┌────────────┐                                                │
│   │ Bean       │                                                │
│   │ ┌────────┐ │                                                │
│   │ │ User   │ │ ← 只有1个对象                                  │
│   │ └────────┘ │                                                │
│   └────────────┘                                                │
│        ▲     ▲     ▲                                           │
│        │     │     │                                           │
│        └──┬──┴─────┘                                           │
│           getBean()                                            │
│                                                                 │
│   prototype（原型）：                                            │
│   ┌────────────┐                                                │
│   │ Bean       │                                                │
│   │ ┌────────┐ │ ┌────────┐ │ ┌────────┐                      │
│   │ │ User1 │ │ │ User2 │ │ │ User3 │  ← 每次都创建新对象     │
│   │ └────────┘ │ └────────┘ │ └────────┘                      │
│   └────────────┘                                                │
│        ▲     ▲     ▲                                           │
│        └──┬──┴─────┘                                           │
│           getBean()                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Bean的生命周期

```
┌─────────────────────────────────────────────────────────────────┐
│                    Bean生命周期                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   创建对象                                                       │
│       │                                                         │
│       ▼                                                         │
│   ┌─────────────────┐                                          │
│   │ 1. 调用构造方法  │ ← Bean的构造方法被调用                   │
│   └────────┬────────┘                                          │
│            ▼                                                    │
│   ┌─────────────────┐                                          │
│   │ 2. 设置属性值    │ ← 依赖注入（DI）                         │
│   └────────┬────────┘                                          │
│            ▼                                                    │
│   ┌─────────────────┐                                          │
│   │ 3. BeanNameAware│ ← Spring把Bean的名字告诉你               │
│   └────────┬────────┘                                          │
│            ▼                                                    │
│   ┌─────────────────┐                                          │
│   │ 4. BeanFactoryAware│ ← Spring把BeanFactory给你            │
│   └────────┬────────┘                                          │
│            ▼                                                    │
│   ┌─────────────────┐                                          │
│   │ 5. InitializingBean│ ← 对象初始化                          │
│   │    afterPropertiesSet() │                                 │
│   └────────┬────────┘                                          │
│            ▼                                                    │
│   ┌─────────────────┐                                          │
│   │ 6. init-method  │ ← 自定义初始化方法                       │
│   └────────┬────────┘                                          │
│            ▼                                                    │
│   ════════════════════                                          │
│   ║   Bean可以使用  ║  ← 正常工作状态                          │
│   ════════════════════                                          │
│            │                                                    │
│            ▼                                                    │
│   ┌─────────────────┐                                          │
│   │ 7. DisposableBean│ ← 对象销毁                              │
│   │    destroy()    │                                         │
│   └────────┬────────┘                                          │
│            ▼                                                    │
│   ┌─────────────────┐                                          │
│   │ 8. destroy-method│ ← 自定义销毁方法                        │
│   └────────┬────────┘                                          │
│            ▼                                                    │
│       对象被销毁                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 六、注解开发

### 6.1 为什么用注解？

```
┌─────────────────────────────────────────────────────────────────┐
│                    XML配置 vs 注解                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   XML配置：                                                     │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ <bean id="user" class="com.example.User">            │     │
│   │     <property name="name" value="张三"/>             │     │
│   │     <property name="age" value="25"/>               │     │
│   │ </bean>                                               │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                 │
│   注解：                                                        │
│   ┌──────────────────────────────────────────────────────┐     │
│   │ @Component                                             │     │
│   │ public class User {                                    │     │
│   │     @Value("张三")                                    │     │
│   │     private String name;                              │     │
│   │     @Value("25")                                      │     │
│   │     private int age;                                  │     │
│   │ }                                                     │     │
│   └──────────────────────────────────────────────────────┘     │
│                                                                 │
│   注解的好处：                                                  │
│   ├── 代码更简洁                                               │
│   ├── 配置更集中（就在类上）                                    │
│   └── 开发效率更高                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 常用注解

#### 6.2.1 对象创建注解

```java
package com.example;

import org.springframework.stereotype.Component;

/**
 * @Component：把这个类交给Spring管理，创建对象
 * value：指定bean的id，默认是类名首字母小写
 */
@Component(value = "user")
public class User {

    private String name;
    private int age;

    public void sayHello() {
        System.out.println("Hello!");
    }
}

// 等价于XML：
// <bean id="user" class="com.example.User"/>
```

```java
// 其他衍生注解（功能一样，只是语义更明确）

@Service      // 用于Service层
public class UserService {}

@Repository   // 用于DAO层
public class UserDao {}

@Controller   // 用于Web层
public class UserController {}
```

#### 6.2.2 属性注入注解

```java
package com.example;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class Car {

    private String brand;

    // @Value：注入简单值
    @Value("宝马")
    public void setBrand(String brand) {
        this.brand = brand;
    }
}

@Component
public class Person {

    private String name;
    private Car car;

    @Value("张三")
    public void setName(String name) {
        this.name = name;
    }

    // @Autowired：自动注入
    // Spring会自动从容器中找Car类型的对象，注入进来
    @Autowired
    public void setCar(Car car) {
        this.car = car;
    }

    public void drive() {
        System.out.println(name + "开" + car);
    }
}
```

#### 6.2.3 完全注解开发

```java
// 创建一个配置类，替代XML配置文件
package com.example;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration  // 这是一个配置类
@ComponentScan("com.example")  // 扫描哪些包
public class SpringConfig {
    // 配置类内容
}
```

```java
// 测试类
@Test
public void test() {
    // 使用AnnotationConfigApplicationContext加载配置类
    ApplicationContext context =
        new AnnotationConfigApplicationContext(SpringConfig.class);

    // 获取对象
    Person person = context.getBean("person", Person.class);
    person.drive();
}
```

---

## 七、AOP面向切面编程

### 7.1 什么是AOP？

```
┌─────────────────────────────────────────────────────────────────┐
│                    AOP面向切面编程 - 通俗解释                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   AOP = Aspect Oriented Programming = 面向切面编程               │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   场景：记录日志                                         │   │
│   │                                                         │   │
│   │   传统方式（每个方法都写日志）：                          │   │
│   │   ─────────────────────                                 │   │
│   │   public void addUser() {                               │   │
│   │       log.info("开始添加用户");                          │   │
│   │       // 业务代码                                       │   │
│   │       log.info("添加用户完成");                          │   │
│   │   }                                                    │   │
│   │                                                         │   │
│   │   public void deleteUser() {                            │   │
│   │       log.info("开始删除用户");                          │   │
│   │       // 业务代码                                       │   │
│   │       log.info("删除用户完成");                          │   │
│   │   }                                                    │   │
│   │                                                         │   │
│   │   问题：日志代码重复！每个方法都要写！                     │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   AOP方式（切面统一处理）：                               │   │
│   │   ─────────────────────                                 │   │
│   │   切面：记录日志                                         │   │
│   │                                                         │   │
│   │   ┌─────────┐                                           │   │
│   │   │ addUser │ ← 切面自动加日志                          │   │
│   │   └─────────┘                                           │   │
│   │         │                                               │   │
│   │         ▼                                               │   │
│   │   ┌─────────┐                                           │   │
│   │   │deleteUser│ ← 切面自动加日志                          │   │
│   │   └─────────┘                                           │   │
│   │                                                         │   │
│   │   好处：日志只写一次，作用于所有方法！                     │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 AOP术语

```
┌─────────────────────────────────────────────────────────────────┐
│                    AOP核心术语                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Join point（连接点）：可以被增强的方法                 │   │
│   │   → 你的业务方法（addUser, deleteUser...）              │   │
│   │                                                         │   │
│   │   Pointcut（切入点）：实际被增强的方法                   │   │
│   │   → 真正被加了日志的方法                                │   │
│   │                                                         │   │
│   │   Advice（通知/增强）：你要做的事                        │   │
│   │   → 日志打印、事务开启、性能监控...                      │   │
│   │                                                         │   │
│   │   Aspect（切面）：通知 + 切入点                          │   │
│   │   → 把"在哪里增强"和"增强什么"合起来                    │   │
│   │                                                         │   │
│   │   Weaving（织入）：把通知应用到目标对象的过程            │   │
│   │   → 编译时/运行时/加载时                                │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 通知类型

```
┌─────────────────────────────────────────────────────────────────┐
│                    通知类型（增强时机）                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  @Before   │ 前置通知    │ 方法执行前                   │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  @After    │ 后置通知    │ 方法执行后（finally）          │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  @AfterReturning │ 返回通知 │ 方法正常返回后             │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  @AfterThrowing  │ 异常通知 │ 方法抛出异常后             │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │  @Around    │ 环绕通知    │ 方法执行前后都执行           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                     执行顺序图                           │   │
│   │                                                         │   │
│   │        @Before                                          │   │
│   │           │                                             │   │
│   │           ▼                                             │   │
│   │     ┌──────────┐                                       │   │
│   │     │ 业务方法  │                                       │   │
│   │     └──────────┘                                       │   │
│   │           │                                             │   │
│   │     ┌─────┴─────┐                                      │   │
│   │     │ 正常/异常  │                                      │   │
│   │     └─────┬─────┘                                      │   │
│   │           │                                             │   │
│   │    ┌──────┴──────┐                                    │   │
│   │    │             │                                     │   │
│   │    ▼             ▼                                     │   │
│   │ @AfterReturning  @AfterThrowing                        │   │
│   │    │             │                                     │   │
│   │    └──────┬──────┘                                    │   │
│   │           │                                            │   │
│   │           ▼                                            │   │
│   │        @After                                         │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 AOP小实战

#### 1. 添加依赖

```xml
<dependency>
    <groupId>org.aspectj</groupId>
    <artifactId>aspectjweaver</artifactId>
    <version>1.9.19</version>
</dependency>
```

#### 2. 创建切面类

```java
package com.example.aspect;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

/**
 * 日志切面：自动给所有业务方法加日志
 */
@Aspect  // 标记这是一个切面类
@Component  // 交给Spring管理
public class LogAspect {

    // 定义切入点：哪些方法要被增强
    // execution(访问修饰符 返回类型 包名.类名.方法名(参数))
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void pointcut() {}

    // 前置通知
    @Before("pointcut()")
    public void before() {
        System.out.println("【日志】方法开始执行...");
    }

    // 后置通知
    @AfterReturning("pointcut()")
    public void afterReturning() {
        System.out.println("【日志】方法正常返回...");
    }

    // 异常通知
    @AfterThrowing("pointcut()")
    public void afterThrowing() {
        System.out.println("【日志】方法抛出异常...");
    }

    // 后置通知（始终执行）
    @After("pointcut()")
    public void after() {
        System.out.println("【日志】方法执行完毕...");
    }

    // 环绕通知
    @Around("pointcut()")
    public Object around(ProceedingJoinPoint joinPoint) throws Throwable {
        System.out.println("【环绕-前】开始...");
        Object result = joinPoint.proceed();  // 执行目标方法
        System.out.println("【环绕-后】结束...");
        return result;
    }
}
```

#### 3. 业务类

```java
package com.example.service;

import org.springframework.stereotype.Service;

@Service
public class UserService {

    public void addUser(String name) {
        System.out.println("添加用户：" + name);
    }

    public void deleteUser(int id) {
        System.out.println("删除用户：" + id);
    }

    public int findUser() {
        System.out.println("查找用户...");
        return 100;
    }
}
```

#### 4. 配置类

```java
package com.example;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@Configuration
@ComponentScan("com.example")
@EnableAspectJAutoProxy  // 开启AOP自动代理
public class AppConfig {}
```

#### 5. 测试

```java
@Test
public void testAOP() {
    ApplicationContext context =
        new AnnotationConfigApplicationContext(AppConfig.class);

    UserService userService = context.getBean(UserService.class);
    userService.addUser("张三");
}
```

**输出结果：**
```
【日志】方法开始执行...
【环绕-前】开始...
添加用户：张三
【环绕-后】结束...
【日志】方法正常返回...
【日志】方法执行完毕...
```

---

## 八、Spring整合MyBatis

### 8.1 添加依赖

```xml
<dependencies>
    <!-- Spring核心 -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>6.0.11</version>
    </dependency>

    <!-- Spring JDBC（数据库操作） -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-jdbc</artifactId>
        <version>6.0.11</version>
    </dependency>

    <!-- MyBatis -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.5.14</version>
    </dependency>

    <!-- MyBatis整合Spring -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis-spring</artifactId>
        <version>3.0.2</version>
    </dependency>

    <!-- 数据库驱动 -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
        <version>8.0.33</version>
    </dependency>

    <!-- 阿里连接池 -->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid</artifactId>
        <version>1.2.18</version>
    </dependency>
</dependencies>
```

### 8.2 配置类

```java
package com.example.config;

import com.alibaba.druid.pool.DruidDataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import javax.sql.DataSource;

@Configuration
public class MyBatisConfig {

    // 数据源
    @Bean
    public DataSource dataSource() {
        DruidDataSource dataSource = new DruidDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUrl("jdbc:mysql://localhost:3306/mybatis?useSSL=false");
        dataSource.setUsername("root");
        dataSource.setPassword("123456");
        return dataSource;
    }

    // SqlSessionFactory
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
        SqlSessionFactoryBean factoryBean = new SqlSessionFactoryBean();
        factoryBean.setDataSource(dataSource);
        // 配置mapper文件位置
        factoryBean.setMapperLocations(
            new PathMatchingResourcePatternResolver()
                .getResources("classpath:mapper/*.xml")
        );
        return factoryBean.getObject();
    }
}
```

### 8.3 完整项目结构

```
spring-mybatis-demo/
├── src/main/java/com/example/
│   ├── config/
│   │   ├── AppConfig.java
│   │   └── MyBatisConfig.java
│   ├── entity/
│   │   └── User.java
│   ├── mapper/
│   │   ├── UserMapper.java
│   │   └── UserMapper.xml
│   ├── service/
│   │   ├── UserService.java
│   │   └── impl/
│   │       └── UserServiceImpl.java
│   └── SpringApplication.java
├── src/main/resources/
│   ├── applicationContext.xml
│   └── mapper/
│       └── UserMapper.xml
└── pom.xml
```

---

## 九、总结

### 9.1 Spring核心知识点

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring核心知识点                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1️⃣ Spring是什么？                                            │
│      → Java开发框架，提供IoC和AOP等核心功能                      │
│                                                                 │
│   2️⃣ IoC控制反转                                              │
│      → 对象由Spring创建，程序被动接收                             │
│      → 降低耦合                                                 │
│                                                                 │
│   3️⃣ DI依赖注入                                                │
│      → Spring把依赖的对象注入进来                                 │
│      → 构造方法注入 / Setter注入                                 │
│                                                                 │
│   4️⃣ Bean管理                                                  │
│      → 作用域：singleton / prototype                            │
│      → 生命周期：创建 → 初始化 → 使用 → 销毁                    │
│                                                                 │
│   5️⃣ 注解开发                                                  │
│      → @Component, @Service, @Repository, @Controller           │
│      → @Autowired, @Value                                     │
│                                                                 │
│   6️⃣ AOP面向切面编程                                           │
│      → 通知类型：@Before/@After/@Around...                    │
│      → 把横切关注点与业务分离                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 学习路线

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring学习路线                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   第一阶段：Spring Core                                        │
│   ├── IoC/DI                                                  │
│   ├── Bean管理                                                 │
│   └── 注解开发                                                 │
│                                                                 │
│   第二阶段：Spring AOP                                         │
│   ├── AOP概念                                                 │
│   ├── 通知类型                                                 │
│   └── 切面编程                                                 │
│                                                                 │
│   第三阶段：Spring整合                                          │
│   ├── 整合MyBatis                                             │
│   ├── 整合JUnit                                                │
│   └── 事务管理                                                 │
│                                                                 │
│   第四阶段：Spring MVC                                         │
│   ├── Web开发                                                 │
│   └── 控制器                                                  │
│                                                                 │
│   第五阶段：Spring Boot                                       │
│   └── 快速开发框架（后面单独讲）                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*希望这篇文章能帮你入门Spring！如果有问题，欢迎在评论区交流。*
