---
title: IntelliJ IDEA 热部署完整配置指南
description: Spring Boot项目热部署配置教程，包含自动和手动热部署方法，解决常见问题
date: 2025-11-19 21:00:00+0000
image: 
draft: false
categories: ["Java开发", "IntelliJ IDEA", "Spring Boot", "开发工具"]
---

参考文章
https://longsheng.org/post/20359.html

# IntelliJ IDEA 热部署教程

## 📚 什么是热部署？

热部署（Hot Reload/Hot Swap）是指在应用运行过程中，修改代码后无需重启应用，就能让修改立即生效的功能。这样可以大大提高开发效率，节省重启应用的时间。

## ✅ 项目已配置

你的项目已经配置了 **Spring Boot DevTools**，这是实现热部署的基础工具。在 `pom.xml` 中可以看到：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-devtools</artifactId>
    <scope>runtime</scope>
    <optional>true</optional>
</dependency>
```

## 🚀 配置步骤

### 方法一：自动热部署（推荐）

#### 1. 开启 IDEA 自动编译

1. 打开 IDEA 设置：

   - **Windows/Linux**: `File` → `Settings` (或按 `Ctrl + Alt + S`)
   - **Mac**: `IntelliJ IDEA` → `Preferences` (或按 `Cmd + ,`)

2. 找到编译设置：

   - 导航到：`Build, Execution, Deployment` → `Compiler`
   - ✅ 勾选 **`Build project automatically`**（自动构建项目）

   > 💡 **说明**：勾选后，当你保存文件（`Ctrl + S`）时，IDEA 会自动编译这个文件，生成新的 `.class` 文件。但这只是编译，不会自动更新到运行中的应用。

3. 开启运行时自动编译：

   - 按 `Ctrl + Shift + A` (Mac: `Cmd + Shift + A`) 打开快速搜索
   - 输入 `Registry` 并打开
   - 找到并勾选 **`compiler.automake.allow.when.app.running`**

   > 💡 **说明**：这个选项允许在应用运行时进行自动编译。配合下面的运行配置，才能实现完整的热部署。

#### 2. 配置运行方式

1. 运行应用：

   - 点击右上角的运行配置下拉菜单
   - 选择 `Edit Configurations...`

2. 配置更新策略：

   - 在 `On 'Update' action` 下拉框中选择：**`Update classes and resources`**
   - 在 `On frame deactivation` 下拉框中选择：**`Update classes and resources`**

   > 💡 **完整流程**：
   >
   > 1. 你修改代码并保存（`Ctrl + S`）
   > 2. IDEA 自动编译（因为勾选了自动编译）
   > 3. IDEA 检测到编译完成，自动更新到运行中的应用（因为配置了 `Update classes and resources`）
   > 4. DevTools 检测到类文件变化，重新加载类
   > 5. 你的修改立即生效！🎉

3. 启动应用：
   - 点击运行按钮启动应用
   - 或者使用快捷键 `Shift + F10`

#### 3. 测试热部署

1. 启动应用后，修改任意 Java 文件（比如 Controller 中的方法）
2. 保存文件（`Ctrl + S`）
3. 观察 IDEA 右下角，会显示 "Classes reloaded" 或类似的提示
4. 刷新浏览器，修改应该已经生效！

---

### 方法二：手动触发更新

如果自动更新没有生效，可以手动触发：

#### 快捷键方式

- **Windows/Linux**: `Ctrl + F9` (重新编译)
- **Mac**: `Cmd + F9`

或者使用更强大的更新：

- **Windows/Linux**: `Ctrl + F10` → 选择 `Update 'xxx' Application`
- **Mac**: `Ctrl + R` → 选择 `Update 'xxx' Application`

#### 工具栏方式

1. 运行应用后，在 IDEA 底部会显示运行窗口
2. 点击运行窗口左侧的 **🔄 更新按钮**（Update Application）
3. 选择更新类型：
   - `Update classes and resources` - 更新类和资源文件（推荐）
   - `Update classes` - 仅更新类文件
   - `Redeploy` - 重新部署
   - `Restart` - 重启应用

---

## 📝 热部署支持的文件类型

### ✅ 支持热部署（无需重启）

- **Java 类文件**（Controller、Service、Entity 等）
- **静态资源**（HTML、CSS、JS、图片等）
- **配置文件**（`application.yml`、`application.properties`）
- **Thymeleaf 模板**（`.html` 文件）

### ❌ 不支持热部署（需要重启）

- **修改了 `@SpringBootApplication` 主类**
- **修改了 `pom.xml` 依赖**
- **修改了数据库连接配置**（某些情况下）
- **添加了新的 Bean 定义**（某些情况下）
- **修改了静态资源路径配置**

---

## 🔧 常见问题解决

### 问题 1：修改代码后没有自动更新

**解决方案：**

1. 检查是否开启了自动编译（见方法一步骤 1）
2. 检查运行配置（见方法一步骤 2）
3. 手动按 `Ctrl + F9` 重新编译
4. 如果还是不行，尝试 `Ctrl + F10` 手动更新

### 问题 2：修改了 HTML 模板但没有生效

**解决方案：**

1. 检查 `application.yml` 中 Thymeleaf 缓存是否关闭：

   ```yaml
   thymeleaf:
     cache: false # 确保是 false
   ```

2. 清除浏览器缓存（`Ctrl + Shift + Delete`）
3. 使用无痕模式测试

### 问题 3：修改了配置文件但没有生效

**解决方案：**

- 对于 `application.yml`，通常需要手动触发更新（`Ctrl + F10`）
- 或者重启应用（某些配置更改必须重启）

### 问题 4：DevTools 没有生效

**解决方案：**

1. 确保 `pom.xml` 中 DevTools 依赖存在
2. 重新导入 Maven 项目：
   - 右键 `pom.xml` → `Maven` → `Reload Project`
3. 清理并重新编译：
   - `Build` → `Rebuild Project`

### 问题 5：热部署后出现类加载错误

**解决方案：**

- 完全重启应用（停止后重新运行）
- 清理编译输出：`Build` → `Clean Project`

---

## 💡 最佳实践

1. **开发时使用热部署，生产环境禁用**

   - DevTools 在生产环境会自动禁用，但建议在打包时排除它

2. **合理使用更新策略**

   - 小改动：使用 `Update classes and resources`
   - 大改动：直接重启应用更稳定

3. **定期清理编译缓存**

   - 如果遇到奇怪的问题，尝试 `Build` → `Clean Project`

4. **使用 Live Reload（可选）**
   - DevTools 还支持浏览器自动刷新
   - 需要安装浏览器插件：LiveReload
   - 访问：http://localhost:8960 时会自动连接

---

## 🎯 快速检查清单

在开始使用热部署前，确保：

- [ ] `pom.xml` 中已添加 `spring-boot-devtools` 依赖
- [ ] IDEA 设置中开启了 `Build project automatically`
- [ ] Registry 中开启了 `compiler.automake.allow.when.app.running`
- [ ] 运行配置中设置了 `Update classes and resources`
- [ ] `application.yml` 中 Thymeleaf 缓存已关闭

---

## 📖 快捷键速查

| 操作     | Windows/Linux | Mac        |
| -------- | ------------- | ---------- |
| 保存文件 | `Ctrl + S`    | `Cmd + S`  |
| 重新编译 | `Ctrl + F9`   | `Cmd + F9` |
| 更新应用 | `Ctrl + F10`  | `Ctrl + R` |
| 运行应用 | `Shift + F10` | `Ctrl + R` |
| 停止应用 | `Ctrl + F2`   | `Cmd + F2` |

---

## 🎉 开始使用

现在你可以：

1. 启动应用
2. 修改代码
3. 保存文件（或等待自动保存）
4. 观察 IDEA 提示或手动触发更新
5. 刷新浏览器查看效果

**享受高效的开发体验吧！** 🚀

---

## 📚 参考资源

- [Spring Boot DevTools 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/using.html#using.devtools)
- [IntelliJ IDEA 官方文档](https://www.jetbrains.com/help/idea/)

