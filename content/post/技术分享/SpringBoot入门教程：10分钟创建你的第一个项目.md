---
title: "Spring Boot入门教程：10分钟创建你的第一个项目"
description: "从零开始学习Spring Boot，搞懂自动配置、快速开发、常用注解，让Java开发变得超级简单"
date: 2026-04-15T10:30:00+08:00
categories: ["技术分享"]
tags:
  - Spring Boot
  - Java
  - Spring
  - Web开发
  - 微服务
comments: true
---

## 前言

"Spring Boot是什么？"

"学Spring Boot有什么用？"

"我已经会Spring了，还需要学Spring Boot吗？"

"Spring Boot真的10分钟就能创建一个项目？"

别担心，这篇文章就是为零基础同学准备的。用最通俗的语言，最完整的示例，带你快速掌握Spring Boot。

---

## 一、Spring Boot是什么？

### 1.1 一句话理解Spring Boot

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot是什么？                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Spring Boot = Spring的"脚手架"                                │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   想象你要盖房子：                                       │   │
│   │                                                         │   │
│   │   以前盖房子（纯Spring）：                              │   │
│   │   ├── 自己买砖头                                       │   │
│   │   ├── 自己买水泥                                       │   │
│   │   ├── 自己买钢筋                                       │   │
│   │   ├── 自己设计图纸                                     │   │
│   │   ├── 自己找工人                                       │   │
│   │   └── 耗时几个月                                      │   │
│   │                                                         │   │
│   │   现在盖房子（Spring Boot）：                          │   │
│   │   ├── 买个集装箱房子                                   │   │
│   │   ├── 通水电就能住                                     │   │
│   │   └── 一天搞定！                                      │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   Spring Boot就是让你：                                          │
│   ├── 配置更少                                                  │
│   ├── 开发更快                                                  │
│   └── 运行更简单                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Spring vs Spring Boot对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring vs Spring Boot                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                      纯Spring                          │   │
│   │                                                         │   │
│   │   ❌ 配置多：                                           │   │
│   │      ├── applicationContext.xml                        │   │
│   │      ├── dispatcher-servlet.xml                        │   │
│   │      ├── web.xml                                       │   │
│   │      └── 数据库配置、事务配置...                       │   │
│   │                                                         │   │
│   │   ❌ 依赖多：                                           │   │
│   │      ├── spring-core                                   │   │
│   │      ├── spring-beans                                  │   │
│   │      ├── spring-context                                │   │
│   │      └── ... 几十个依赖                                │   │
│   │                                                         │   │
│   │   ❌ 部署难：                                           │   │
│   │      ├── 打成war包                                      │   │
│   │      ├── 部署到Tomcat                                  │   │
│   │      └── 配置各种参数                                  │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Spring Boot                         │   │
│   │                                                         │   │
│   │   ✅ 配置少：                                           │   │
│   │      └── application.properties（一个文件就够了）        │   │
│   │                                                         │   │
│   │   ✅ 依赖少：                                           │   │
│   │      └── spring-boot-starter-web（一个搞定所有）        │   │
│   │                                                         │   │
│   │   ✅ 部署简单：                                         │   │
│   │      └── java -jar xxx.jar（直接运行）                  │   │
│   │                                                         │   │
│   │   ✅ 自动配置：                                         │   │
│   │      └── Spring Boot帮你配置好一切                      │   │
│   │                                                         │   │
│   │   ✅ 内嵌服务器：                                       │   │
│   │      └── 自带Tomcat/Jetty，不用单独安装                 │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Spring Boot核心特性

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot核心特性                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1️⃣ 自动配置（Auto Configuration）                            │
│      Spring Boot会根据你添加的依赖，自动配置                      │
│                                                                 │
│   2️⃣ 起步依赖（Starter）                                       │
│      spring-boot-starter-xxx，一个依赖包含一堆依赖                │
│                                                                 │
│   3️⃣ 内嵌服务器                                                │
│      Tomcat/Jetty/Undertow内置，不用单独安装                      │
│                                                                 │
│   4️⃣ 健康检查                                                  │
│      自带监控Actuator                                           │
│                                                                 │
│   5️⃣ 零配置开发                                                │
│      注解 + 约定大于配置                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、创建第一个Spring Boot项目

### 2.1 使用Spring Initializr（推荐）

**方式1：网页创建**

1. 打开 https://start.spring.io/
2. 选择项目类型（Maven/Gradle）
3. 填写项目信息
4. 选择依赖（Web、JPA、MySQL等）
5. 点击Generate生成项目

**方式2：IDEA创建**

1. File → New → Project
2. 选择Spring Initializr
3. 填写项目信息
4. 选择依赖
5. 创建

### 2.2 项目结构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot项目结构                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   my-springboot-demo/          ← 项目名                          │
│   │                                                              │
│   ├── src/                                                         │
│   │   ├── main/                                                   │
│   │   │   ├── java/com/example/demo/                            │
│   │   │   │   ├── DemoApplication.java    ← 启动类              │
│   │   │   │   ├── controller/              ← 控制器层           │
│   │   │   │   ├── service/                 ← 服务层             │
│   │   │   │   ├── mapper/                 ← 数据层             │
│   │   │   │   ├── entity/                  ← 实体类              │
│   │   │   │   └── config/                 ← 配置类             │
│   │   │   │                                                        │
│   │   │   └── resources/                                          │
│   │   │       ├── application.properties   ← 配置文件           │
│   │   │       ├── static/                  ← 静态资源           │
│   │   │       └── templates/               ← 模板文件           │
│   │   │                                                        │
│   │   └── test/                                                  │
│   │       └── java/                                              │
│   │           └── DemoApplicationTests.java                      │
│   │                                                              │
│   ├── pom.xml                  ← Maven配置                      │
│   └── .mvn/                    ← Maven wrapper                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 pom.xml配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 父工程：Spring Boot的版本锁定 -->
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.5</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>my-springboot-demo</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>my-springboot-demo</name>

    <!-- 配置编码 -->
    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <!-- 依赖 -->
    <dependencies>
        <!-- Web开发起步依赖（包含Tomcat、Spring MVC等） -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- 测试起步依赖 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- Lombok（简化代码） -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- 如果需要数据库 -->
        <!--
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
        </dependency>
        -->
    </dependencies>

    <!-- Maven构建配置 -->
    <build>
        <plugins>
            <!-- Spring Boot打包插件 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 2.4 启动类

```java
package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Boot启动类
 *
 * @SpringBootApplication = 开启以下功能：
 * 1. @Configuration - 当前类是配置类
 * 2. @EnableAutoConfiguration - 开启自动配置
 * 3. @ComponentScan - 扫描当前包及子包
 */
@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        // 启动Spring Boot应用
        SpringApplication.run(DemoApplication.class, args);

        System.out.println("============= 启动成功！ =============");
        System.out.println("访问地址：http://localhost:8080");
    }
}
```

### 2.5 运行项目

```bash
# 方式1：IDEA直接运行
# 右键点击 DemoApplication，选择 Run

# 方式2：命令行运行
mvn spring-boot:run

# 方式3：打包后运行
mvn clean package
java -jar target/my-springboot-demo-0.0.1-SNAPSHOT.jar
```

**运行结果：**
```
============= 启动成功！ =============
访问地址：http://localhost:8080

  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::               (v3.1.5)
```

---

## 三、创建RESTful API

### 3.1 什么是RESTful？

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESTful API 是什么？                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   RESTful = REST风格 + HTTP协议                                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   HTTP方法  │  操作        │  示例                      │   │
│   │   ────────  │  ──────      │  ──────                   │   │
│   │   GET       │  查询        │  GET /users               │   │
│   │   POST      │  新增        │  POST /users              │   │
│   │   PUT       │  修改        │  PUT /users/1             │   │
│   │   DELETE    │  删除        │  DELETE /users/1          │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   RESTful的特点：                                                │
│   ├── 使用URL定位资源                                            │
│   ├── 使用HTTP动词描述操作                                      │
│   ├── 前后端分离                                                │
│   └── 标准化的接口设计                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 创建实体类

```java
package com.example.demo.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户实体类
 */
@Data          // Lombok：自动生成get/set/toString等
@NoArgsConstructor  // 无参构造
@AllArgsConstructor // 全参构造
public class User {

    private Long id;
    private String name;
    private Integer age;
    private String email;
}
```

### 3.3 创建Controller

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

/**
 * 用户控制器
 *
 * @RestController = @Controller + @ResponseBody
 * 类上所有方法的返回值都直接返回JSON
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    // 模拟数据库
    private static List<User> userList = new ArrayList<>();

    static {
        userList.add(new User(1L, "张三", 25, "zhangsan@example.com"));
        userList.add(new User(2L, "李四", 30, "lisi@example.com"));
        userList.add(new User(3L, "王五", 28, "wangwu@example.com"));
    }

    /**
     * 查询所有用户
     * GET /api/users
     */
    @GetMapping
    public List<User> getAllUsers() {
        return userList;
    }

    /**
     * 根据ID查询用户
     * GET /api/users/1
     */
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userList.stream()
                .filter(user -> user.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    /**
     * 新增用户
     * POST /api/users
     */
    @PostMapping
    public String addUser(@RequestBody User user) {
        // 生成新ID
        Long newId = userList.stream()
                .mapToLong(User::getId)
                .max()
                .orElse(0) + 1;
        user.setId(newId);
        userList.add(user);
        return "用户添加成功，ID：" + newId;
    }

    /**
     * 修改用户
     * PUT /api/users/1
     */
    @PutMapping("/{id}")
    public String updateUser(@PathVariable Long id, @RequestBody User user) {
        for (int i = 0; i < userList.size(); i++) {
            if (userList.get(i).getId().equals(id)) {
                user.setId(id);
                userList.set(i, user);
                return "用户修改成功";
            }
        }
        return "用户不存在";
    }

    /**
     * 删除用户
     * DELETE /api/users/1
     */
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        boolean removed = userList.removeIf(user -> user.getId().equals(id));
        return removed ? "用户删除成功" : "用户不存在";
    }
}
```

### 3.4 测试接口

```bash
# 查询所有用户
curl http://localhost:8080/api/users

# 根据ID查询
curl http://localhost:8080/api/users/1

# 新增用户
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"赵六","age":22,"email":"zhaoliu@example.com"}'

# 修改用户
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"张三(已修改)","age":26,"email":"zhangsan_new@example.com"}'

# 删除用户
curl -X DELETE http://localhost:8080/api/users/3
```

---

## 四、常用注解详解

### 4.1 Spring Boot核心注解

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot常用注解                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   @SpringBootApplication                                        │
│   ├── 标记启动类                                                │
│   └── 包含自动配置、组件扫描                                    │
│                                                                 │
│   @RestController                                               │
│   ├── RESTful控制器                                            │
│   └── 相当于 @Controller + @ResponseBody                       │
│                                                                 │
│   @Controller                                                   │
│   └── 传统MVC控制器                                            │
│                                                                 │
│   @RequestMapping                                               │
│   ├── 请求映射                                                  │
│   └── GET/POST/PUT/DELETE                                      │
│                                                                 │
│   @GetMapping / @PostMapping / @PutMapping / @DeleteMapping    │
│   └── 特定HTTP方法的映射                                        │
│                                                                 │
│   @PathVariable                                                 │
│   └── 获取URL路径参数                                           │
│                                                                 │
│   @RequestParam                                                │
│   └── 获取请求参数                                              │
│                                                                 │
│   @RequestBody                                                 │
│   └── 获取请求体（JSON）                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 注解使用示例

```java
@RestController
@RequestMapping("/api/demo")
public class DemoController {

    /**
     * 路径参数示例
     * GET /api/demo/user/123
     */
    @GetMapping("/user/{id}")
    public String getUser(@PathVariable("id") Long id) {
        return "用户ID：" + id;
    }

    /**
     * 查询参数示例
     * GET /api/demo/search?name=张三&age=25
     */
    @GetMapping("/search")
    public String search(
            @RequestParam("name") String name,
            @RequestParam(value = "age", required = false) Integer age) {
        return "查询：" + name + "，年龄：" + age;
    }

    /**
     * 请求体示例（接收JSON）
     * POST /api/demo/save
     * Body: {"name":"张三","age":25}
     */
    @PostMapping("/save")
    public String save(@RequestBody User user) {
        return "保存用户：" + user;
    }

    /**
     * 多种请求方式
     */
    @GetMapping("/get")
    public String get() {
        return "GET请求";
    }

    @PostMapping("/post")
    public String post() {
        return "POST请求";
    }

    @PutMapping("/put")
    public String put() {
        return "PUT请求";
    }

    @DeleteMapping("/delete")
    public String delete() {
        return "DELETE请求";
    }
}
```

---

## 五、配置文件

### 5.1 application.properties

```properties
# 服务配置
server.port=8080
server.servlet.context-path=/myapp

# 应用配置
spring.application.name=my-springboot-demo

# 日志配置
logging.level.root=INFO
logging.level.com.example.demo=DEBUG

# 数据源配置（如果需要数据库）
spring.datasource.url=jdbc:mysql://localhost:3306/test
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA配置
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
```

### 5.2 application.yml（推荐）

```yaml
# 同样的配置，用YAML格式更简洁
server:
  port: 8080
  servlet:
    context-path: /myapp

spring:
  application:
    name: my-springboot-demo

  datasource:
    url: jdbc:mysql://localhost:3306/test?useSSL=false
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    root: INFO
    com.example.demo: DEBUG
```

### 5.3 多环境配置

```
src/main/resources/
├── application.yml              # 默认配置
├── application-dev.yml          # 开发环境
├── application-test.yml         # 测试环境
└── application-prod.yml        # 生产环境
```

```properties
# application.yml 指定激活哪个环境
spring:
  profiles:
    active: dev
```

---

## 六、整合数据库

### 6.1 添加依赖

```xml
<dependencies>
    <!-- Spring Data JPA（简化数据库操作） -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>

    <!-- MySQL驱动 -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
    </dependency>

    <!-- Druid连接池（可选） -->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid-spring-boot-3-starter</artifactId>
        <version>1.2.18</version>
    </dependency>
</dependencies>
```

### 6.2 配置数据源

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo?useSSL=false&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update  # 自动更新表结构
    show-sql: true      # 显示SQL
    properties:
      hibernate:
        format_sql: true
```

### 6.3 创建实体类

```java
package com.example.demo.entity;

import jakarta.persistence.*;  // 注意：Spring Boot 3.x用jakarta
import lombok.Data;

@Data
@Entity  // 标记为JPA实体类
@Table(name = "t_user")  // 指定表名
public class User {

    @Id  // 主键
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // 自增
    private Long id;

    @Column(nullable = false, length = 50)  // 列配置
    private String name;

    @Column
    private Integer age;

    @Column(length = 100)
    private String email;
}
```

### 6.4 创建Repository

```java
package com.example.demo.mapper;

import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * JPA Repository
 * 自动提供 CRUD 方法
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // 自定义查询方法（方法名自动解析）
    List<User> findByName(String name);
    List<User> findByAgeGreaterThan(Integer age);
    List<User> findByNameContaining(String keyword);
}
```

### 6.5 创建Service

```java
package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.mapper.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor  // Lombok：自动生成构造方法注入
public class UserService {

    private final UserRepository userRepository;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User saveUser(User user) {
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public List<User> searchByName(String name) {
        return userRepository.findByName(name);
    }
}
```

### 6.6 修改Controller

```java
package com.example.demo.controller;

import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PostMapping
    public User addUser(@RequestBody User user) {
        return userService.saveUser(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        return userService.saveUser(user);
    }

    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return "删除成功";
    }

    @GetMapping("/search")
    public List<User> searchByName(@RequestParam String name) {
        return userService.searchByName(name);
    }
}
```

---

## 七、整合MyBatis

### 7.1 添加依赖

```xml
<dependencies>
    <!-- MyBatis起步依赖 -->
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>3.0.2</version>
    </dependency>

    <!-- MySQL -->
    <dependency>
        <groupId>com.mysql</groupId>
        <artifactId>mysql-connector-j</artifactId>
    </dependency>
</dependencies>
```

### 7.2 配置MyBatis

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.example.demo.entity
  configuration:
    map-underscore-to-camel-case: true  # 开启驼峰命名转换
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # 显示SQL
```

### 7.3 创建Mapper接口

```java
package com.example.demo.mapper;

import com.example.demo.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Insert;

import java.util.List;

@Mapper  // 标记为MyBatis Mapper
public interface UserMapper {

    @Select("SELECT * FROM t_user")
    List<User> findAll();

    @Select("SELECT * FROM t_user WHERE id = #{id}")
    User findById(@Param("id") Long id);

    @Insert("INSERT INTO t_user(name, age, email) VALUES(#{name}, #{age}, #{email})")
    int insert(User user);
}
```

---

## 八、Spring Boot DevTools热部署

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

**功能：**
- 修改代码后自动重启
- 无需手动重启
- 加快开发效率

---

## 九、常用起步依赖

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot起步依赖                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   spring-boot-starter-web                                       │
│   └── Web开发（Spring MVC + Tomcat）                           │
│                                                                 │
│   spring-boot-starter-data-jpa                                   │
│   └── JPA数据库操作                                             │
│                                                                 │
│   spring-boot-starter-data-redis                                 │
│   └── Redis缓存                                                 │
│                                                                 │
│   spring-boot-starter-security                                   │
│   └── 安全控制                                                 │
│                                                                 │
│   spring-boot-starter-thymeleaf                                  │
│   └── 模板引擎                                                 │
│                                                                 │
│   spring-boot-starter-websocket                                  │
│   └── WebSocket通信                                            │
│                                                                 │
│   spring-boot-starter-actuator                                   │
│   └── 监控端点                                                 │
│                                                                 │
│   lombok                                                        │
│   └── 简化代码                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 十、打包部署

### 10.1 打包

```bash
# 打包（跳过测试）
mvn clean package -DskipTests

# 打包后文件位置
# target/my-springboot-demo-0.0.1-SNAPSHOT.jar
```

### 10.2 运行

```bash
# Linux/Mac
java -jar my-springboot-demo-0.0.1-SNAPSHOT.jar

# Windows
java -jar target\my-springboot-demo-0.0.1-SNAPSHOT.jar

# 指定端口
java -jar my-springboot-demo-0.0.1-SNAPSHOT.jar --server.port=8888

# 指定配置文件
java -jar my-springboot-demo-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### 10.3 Docker部署

```dockerfile
FROM openjdk:17-slim
COPY target/my-springboot-demo-0.0.1-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```bash
# 构建镜像
docker build -t my-springboot-demo .

# 运行容器
docker run -d -p 8080:8080 --name demo my-springboot-demo
```

---

## 十一、常见问题

### 11.1 端口被占用

```bash
# Windows查看端口占用
netstat -ano | findstr 8080
taskkill /PID <进程ID> /F

# Linux查看端口占用
lsof -i:8080
kill -9 <进程ID>
```

### 11.2 静态资源访问

```
src/main/resources/
├── static/          # 静态资源目录
│   ├── css/
│   ├── js/
│   └── images/
└── templates/       # 模板目录
    └── index.html
```

**访问地址：**
- http://localhost:8080/images/logo.png
- http://localhost:8080/js/main.js

### 11.3 全局异常处理

```java
package com.example.demo.config;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice  // 全局异常处理器
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public Map<String, Object> handleException(Exception e) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 500);
        result.put("message", e.getMessage());
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }
}
```

---

## 十二、总结

### 12.1 Spring Boot核心知识点

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot核心知识点                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1️⃣ Spring Boot是什么？                                       │
│      → Spring的快速开发框架                                      │
│      → 自动配置、起步依赖、内嵌服务器                            │
│                                                                 │
│   2️⃣ 创建项目                                                  │
│      → Spring Initializr                                        │
│      → pom.xml配置起步依赖                                      │
│      → @SpringBootApplication启动                               │
│                                                                 │
│   3️⃣ RESTful API                                               │
│      → @RestController                                          │
│      → @GetMapping/@PostMapping/@PutMapping/@DeleteMapping      │
│      → @PathVariable/@RequestBody/@RequestParam                 │
│                                                                 │
│   4️⃣ 配置文件                                                  │
│      → application.properties / application.yml                │
│      → 多环境配置                                               │
│                                                                 │
│   5️⃣ 整合数据库                                                │
│      → JPA（自动提供CRUD）                                      │
│      → MyBatis（手写SQL）                                      │
│                                                                 │
│   6️⃣ 部署                                                      │
│      → java -jar xxx.jar                                        │
│      → Docker部署                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Spring vs Spring Boot

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring vs Spring Boot                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Spring：                                                       │
│   ├── 配置多（XML配置）                                         │
│   ├── 依赖多（需要手动添加很多依赖）                             │
│   ├── 部署难（需要配置Tomcat）                                  │
│   └── 适合学习原理                                              │
│                                                                 │
│   Spring Boot：                                                  │
│   ├── 配置少（约定大于配置）                                    │
│   ├── 依赖少（起步依赖一键添加）                                 │
│   ├── 部署简单（java -jar运行）                                  │
│   └── 适合企业开发                                              │
│                                                                 │
│   建议：                                                        │
│   → 先学Spring，理解原理                                        │
│   → 再学Spring Boot，用于实际开发                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 12.3 学习路线

```
┌─────────────────────────────────────────────────────────────────┐
│                    Spring Boot学习路线                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   第一步：创建项目                                              │
│   └── Spring Initializr快速创建                                 │
│                                                                 │
│   第二步：Hello World                                           │
│   └── 第一个REST API                                           │
│                                                                 │
│   第三步：请求处理                                              │
│   └── @RequestMapping各种用法                                    │
│                                                                 │
│   第四步：整合数据库                                            │
│   └── JPA/MyBatis                                              │
│                                                                 │
│   第五步：常用功能                                              │
│   └── 事务、异常处理、日志                                      │
│                                                                 │
│   第六步：项目实战                                              │
│   └── 完整的后端项目                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 12.4 完整示例代码结构

```
my-springboot-demo/
├── src/main/java/com/example/demo/
│   ├── DemoApplication.java          # 启动类
│   ├── controller/
│   │   └── UserController.java       # 控制器
│   ├── service/
│   │   ├── UserService.java          # 服务接口
│   │   └── impl/
│   │       └── UserServiceImpl.java  # 服务实现
│   ├── mapper/
│   │   └── UserRepository.java       # 数据层
│   ├── entity/
│   │   └── User.java                 # 实体类
│   └── config/
│       └── WebConfig.java            # 配置类
├── src/main/resources/
│   ├── application.yml               # 配置文件
│   └── mapper/                       # MyBatis XML
└── pom.xml                           # Maven配置
```

---

## 结尾

```
┌─────────────────────────────────────────────────────────────────┐
│                    恭喜你入门Spring Boot！                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   🎉 你已经学会了：                                              │
│   ├── Spring Boot基础                                           │
│   ├── RESTful API开发                                          │
│   ├── 常用注解                                                  │
│   ├── 配置文件                                                  │
│   ├── 数据库整合                                                │
│   └── 项目打包部署                                              │
│                                                                 │
│   🚀 接下来可以学习：                                            │
│   ├── Spring Cloud（微服务）                                    │
│   ├── Spring Security（安全）                                   │
│   ├── Redis缓存                                                │
│   ├── MQ消息队列                                               │
│   └── Docker容器化                                             │
│                                                                 │
│   记住：多写代码、多实践！                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*希望这篇文章能帮你快速入门Spring Boot！如果有问题，欢迎在评论区交流。*
