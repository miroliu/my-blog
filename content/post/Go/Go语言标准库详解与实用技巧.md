---
title: Go语言标准库详解与实用技巧
description: 系统介绍Go语言标准库的核心包及其使用方法，包括文件操作、网络编程、JSON处理、时间管理等常用功能，帮助开发者熟练掌握标准库的应用
slug: go-standard-library-guide
date: 2024-11-01T10:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["Go"]
---

# Go语言标准库详解与实用技巧

## 引言：标准库的重要性

Go语言的标准库是Go生态系统中最基础、最重要的部分，它提供了丰富的功能模块，涵盖了文件操作、网络通信、数据编码、时间处理等几乎所有常见的编程需求。熟练掌握标准库的使用，是成为一名优秀Go开发者的必备技能。

Go标准库的特点：
- **设计简洁**：API设计清晰、一致，遵循Go语言的哲学
- **稳定性高**：经过严格测试，向后兼容性好
- **性能优秀**：许多核心组件经过精心优化
- **功能完备**：覆盖了大多数常见的开发需求
- **文档完善**：提供详细的使用文档和示例

本文将系统介绍Go语言标准库中最常用的核心包，包括它们的基本用法、常见技巧以及最佳实践，帮助你更高效地使用标准库解决实际问题。

## 第一章：文件与IO操作

### 1.1 os包：操作系统功能

`os`包提供了与操作系统交互的功能，包括文件操作、进程管理、环境变量等。

#### 文件创建与打开

```go
package main

import (
    "fmt"
    "os"
)

func main() {
    // 创建新文件，权限为0644（读写/读/读）
    file, err := os.Create("example.txt")
    if err != nil {
        fmt.Printf("创建文件失败: %v\n", err)
        return
    }
    defer file.Close() // 确保文件被关闭
    
    // 写入内容
    file.WriteString("Hello, Go!\n")
    fmt.Println("文件创建并写入成功")
    
    // 打开已存在的文件
    existingFile, err := os.Open("example.txt")
    if err != nil {
        fmt.Printf("打开文件失败: %v\n", err)
        return
    }
    defer existingFile.Close()
    
    // 以读写模式打开文件
    readWriteFile, err := os.OpenFile("example.txt", os.O_RDWR|os.O_APPEND, 0644)
    if err != nil {
        fmt.Printf("打开文件失败: %v\n", err)
        return
    }
    defer readWriteFile.Close()
}
```

#### 文件信息与操作

```go
func main() {
    // 获取文件信息
    info, err := os.Stat("example.txt")
    if err != nil {
        fmt.Printf("获取文件信息失败: %v\n", err)
        return
    }
    
    fmt.Printf("文件名: %s\n", info.Name())
    fmt.Printf("文件大小: %d 字节\n", info.Size())
    fmt.Printf("是否为目录: %v\n", info.IsDir())
    fmt.Printf("修改时间: %v\n", info.ModTime())
    fmt.Printf("权限: %v\n", info.Mode())
    
    // 检查文件是否存在
    if _, err := os.Stat("non_existent.txt"); os.IsNotExist(err) {
        fmt.Println("文件不存在")
    }
    
    // 重命名文件
    err = os.Rename("example.txt", "renamed.txt")
    if err != nil {
        fmt.Printf("重命名文件失败: %v\n", err)
    }
    
    // 删除文件
    err = os.Remove("renamed.txt")
    if err != nil {
        fmt.Printf("删除文件失败: %v\n", err)
    }
}
```

#### 目录操作

```go
func main() {
    // 创建目录
    err := os.Mkdir("new_dir", 0755) // 权限：读写执行/读执行/读执行
    if err != nil {
        fmt.Printf("创建目录失败: %v\n", err)
    }
    
    // 创建多级目录
    err = os.MkdirAll("parent/child/grandchild", 0755)
    if err != nil {
        fmt.Printf("创建多级目录失败: %v\n", err)
    }
    
    // 读取目录内容
    files, err := os.ReadDir("parent")
    if err != nil {
        fmt.Printf("读取目录失败: %v\n", err)
    } else {
        fmt.Println("parent目录内容:")
        for _, file := range files {
            fmt.Printf("%s\t%s\n", file.Name(), getFileOrDirType(file))
        }
    }
    
    // 删除空目录
    err = os.Remove("new_dir")
    if err != nil {
        fmt.Printf("删除目录失败: %v\n", err)
    }
    
    // 删除目录及其所有内容
    err = os.RemoveAll("parent")
    if err != nil {
        fmt.Printf("删除目录树失败: %v\n", err)
    }
}

func getFileOrDirType(file os.DirEntry) string {
    if file.IsDir() {
        return "[目录]"
    }
    return "[文件]"
}
```

#### 环境变量

```go
func main() {
    // 设置环境变量
    os.Setenv("GOPATH", "/path/to/go")
    
    // 获取环境变量
    gopath := os.Getenv("GOPATH")
    fmt.Printf("GOPATH: %s\n", gopath)
    
    // 获取所有环境变量
    envs := os.Environ()
    fmt.Println("所有环境变量:")
    for _, env := range envs {
        fmt.Println(env)
    }
    
    // 清除环境变量
    os.Unsetenv("GOPATH")
}
```

### 1.2 io/ioutil包与io包

Go 1.16之后，`ioutil`包的许多函数被移到了`os`和`io`包中。下面介绍一些常用的IO操作函数。

#### 读写文件内容

```go
package main

import (
    "fmt"
    "io"
    "os"
)

func main() {
    // 读取整个文件内容
    content, err := os.ReadFile("example.txt")
    if err != nil {
        fmt.Printf("读取文件失败: %v\n", err)
        return
    }
    fmt.Printf("文件内容: %s\n", content)
    
    // 写入内容到文件（覆盖）
    err = os.WriteFile("output.txt", []byte("Hello, WriteFile!\n"), 0644)
    if err != nil {
        fmt.Printf("写入文件失败: %v\n", err)
    }
}
```

#### 复制文件

```go
func copyFile(dst, src string) error {
    // 打开源文件
    source, err := os.Open(src)
    if err != nil {
        return err
    }
    defer source.Close()
    
    // 创建目标文件
    destination, err := os.Create(dst)
    if err != nil {
        return err
    }
    defer destination.Close()
    
    // 复制内容
    _, err = io.Copy(destination, source)
    return err
}

func main() {
    err := copyFile("copy.txt", "example.txt")
    if err != nil {
        fmt.Printf("复制文件失败: %v\n", err)
    } else {
        fmt.Println("文件复制成功")
    }
}
```

#### 使用缓冲区读写

```go
func main() {
    // 使用bufio包进行带缓冲的读写
    file, err := os.Create("buffered.txt")
    if err != nil {
        fmt.Printf("创建文件失败: %v\n", err)
        return
    }
    defer file.Close()
    
    // 创建写入器
    writer := bufio.NewWriter(file)
    writer.WriteString("第一行\n")
    writer.WriteString("第二行\n")
    writer.Flush() // 确保所有数据被写入文件
    
    // 创建读取器
    readFile, _ := os.Open("buffered.txt")
    defer readFile.Close()
    
    reader := bufio.NewReader(readFile)
    line1, _ := reader.ReadString('\n')
    line2, _ := reader.ReadString('\n')
    
    fmt.Printf("读取的第一行: %s", line1)
    fmt.Printf("读取的第二行: %s", line2)
    
    // 按行读取所有内容
    scanner := bufio.NewScanner(readFile)
    fmt.Println("使用Scanner读取文件:")
    for scanner.Scan() {
        fmt.Println(scanner.Text())
    }
}
```

## 第二章：网络编程

### 2.1 net包：网络基础

`net`包提供了网络I/O的基本功能，包括TCP/IP、UDP、Unix域套接字等。

#### TCP服务器

```go
package main

import (
    "fmt"
    "net"
    "os"
)

func handleConnection(conn net.Conn) {
    defer conn.Close()
    
    fmt.Printf("客户端连接: %s\n", conn.RemoteAddr().String())
    
    // 创建一个缓冲区用于接收数据
    buffer := make([]byte, 1024)
    
    for {
        // 读取客户端发送的数据
        n, err := conn.Read(buffer)
        if err != nil {
            fmt.Printf("读取数据失败: %v\n", err)
            break
        }
        
        data := buffer[:n]
        fmt.Printf("收到数据: %s\n", data)
        
        // 向客户端发送响应
        _, err = conn.Write([]byte("服务器已收到: " + string(data)))
        if err != nil {
            fmt.Printf("发送数据失败: %v\n", err)
            break
        }
    }
}

func main() {
    // 监听指定端口
    listener, err := net.Listen("tcp", ":8080")
    if err != nil {
        fmt.Printf("监听失败: %v\n", err)
        os.Exit(1)
    }
    defer listener.Close()
    
    fmt.Println("TCP服务器启动，监听端口 8080...")
    
    // 接受客户端连接
    for {
        conn, err := listener.Accept()
        if err != nil {
            fmt.Printf("接受连接失败: %v\n", err)
            continue
        }
        
        // 为每个客户端连接启动一个goroutine处理
        go handleConnection(conn)
    }
}
```

#### TCP客户端

```go
func main() {
    // 连接到服务器
    conn, err := net.Dial("tcp", "localhost:8080")
    if err != nil {
        fmt.Printf("连接服务器失败: %v\n", err)
        os.Exit(1)
    }
    defer conn.Close()
    
    // 发送数据
    message := "Hello, TCP Server!"
    _, err = conn.Write([]byte(message))
    if err != nil {
        fmt.Printf("发送数据失败: %v\n", err)
        return
    }
    
    // 接收响应
    buffer := make([]byte, 1024)
    n, err := conn.Read(buffer)
    if err != nil {
        fmt.Printf("接收数据失败: %v\n", err)
        return
    }
    
    response := buffer[:n]
    fmt.Printf("收到服务器响应: %s\n", response)
}
```

### 2.2 net/http包：HTTP服务器与客户端

`net/http`包提供了HTTP客户端和服务器的实现，是Go语言中最常用的包之一。

#### HTTP服务器

```go
func main() {
    // 注册路由处理函数
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Hello, World! %s\n", r.URL.Path)
    })
    
    http.HandleFunc("/api/data", func(w http.ResponseWriter, r *http.Request) {
        // 设置响应头
        w.Header().Set("Content-Type", "application/json")
        
        // 根据请求方法处理
        switch r.Method {
        case "GET":
            fmt.Fprintf(w, `{"message": "This is a GET request"}`)
        case "POST":
            // 解析请求体
            if r.Body != nil {
                body, _ := io.ReadAll(r.Body)
                defer r.Body.Close()
                fmt.Fprintf(w, `{"message": "Received POST data", "data": "%s"}`, string(body))
            }
        default:
            w.WriteHeader(http.StatusMethodNotAllowed)
            fmt.Fprintf(w, `{"error": "Method not allowed"}`)
        }
    })
    
    // 启动HTTP服务器
    fmt.Println("HTTP服务器启动，监听端口 8080...")
    http.ListenAndServe(":8080", nil)
}
```

#### HTTP客户端

```go
func main() {
    // 发送GET请求
    resp, err := http.Get("http://localhost:8080/")
    if err != nil {
        fmt.Printf("GET请求失败: %v\n", err)
        return
    }
    defer resp.Body.Close()
    
    // 读取响应体
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        fmt.Printf("读取响应失败: %v\n", err)
        return
    }
    
    fmt.Printf("GET响应状态码: %d\n", resp.StatusCode)
    fmt.Printf("GET响应内容: %s\n", body)
    
    // 发送POST请求
    postData := []byte(`{"name": "Go", "version": "1.20"}`)
    postResp, err := http.Post("http://localhost:8080/api/data", 
        "application/json", bytes.NewBuffer(postData))
    if err != nil {
        fmt.Printf("POST请求失败: %v\n", err)
        return
    }
    defer postResp.Body.Close()
    
    postBody, _ := io.ReadAll(postResp.Body)
    fmt.Printf("POST响应状态码: %d\n", postResp.StatusCode)
    fmt.Printf("POST响应内容: %s\n", postBody)
    
    // 使用自定义客户端
    client := &http.Client{
        Timeout: 5 * time.Second,
    }
    req, _ := http.NewRequest("GET", "http://localhost:8080/api/data", nil)
    req.Header.Add("Authorization", "Bearer token123")
    
    customResp, err := client.Do(req)
    if err != nil {
        fmt.Printf("自定义请求失败: %v\n", err)
        return
    }
    defer customResp.Body.Close()
}
```

### 2.3 实现一个简单的REST API服务

下面是一个使用`net/http`包实现的简单REST API服务示例：

```go
// 用户结构体
type User struct {
    ID   string `json:"id"`
    Name string `json:"name"`
    Age  int    `json:"age"`
}

// 模拟数据库
var users = map[string]User{
    "1": {ID: "1", Name: "张三", Age: 30},
    "2": {ID: "2", Name: "李四", Age: 25},
}

func main() {
    // 使用ServeMux路由
    mux := http.NewServeMux()
    
    // 注册路由
    mux.HandleFunc("/users", getUsers)
    mux.HandleFunc("/users/", getUser)
    mux.HandleFunc("/users/create", createUser)
    mux.HandleFunc("/users/update/", updateUser)
    mux.HandleFunc("/users/delete/", deleteUser)
    
    // 添加CORS中间件
    handler := corsMiddleware(mux)
    
    // 启动服务器
    fmt.Println("REST API服务器启动，监听端口 8080...")
    http.ListenAndServe(":8080", handler)
}

// 获取所有用户
func getUsers(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(users)
}

// 获取单个用户
func getUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != "GET" {
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
    }
    
    // 提取用户ID
    id := strings.TrimPrefix(r.URL.Path, "/users/")
    if id == "" {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "缺少用户ID"})
        return
    }
    
    user, exists := users[id]
    if !exists {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "用户不存在"})
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

// 创建用户
func createUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
    }
    
    var newUser User
    if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "无效的用户数据"})
        return
    }
    
    // 简单生成ID
    newID := fmt.Sprintf("%d", len(users)+1)
    newUser.ID = newID
    users[newID] = newUser
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(newUser)
}

// 更新用户
func updateUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != "PUT" {
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
    }
    
    id := strings.TrimPrefix(r.URL.Path, "/users/update/")
    if id == "" {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "缺少用户ID"})
        return
    }
    
    if _, exists := users[id]; !exists {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "用户不存在"})
        return
    }
    
    var updatedUser User
    if err := json.NewDecoder(r.Body).Decode(&updatedUser); err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "无效的用户数据"})
        return
    }
    
    updatedUser.ID = id
    users[id] = updatedUser
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(updatedUser)
}

// 删除用户
func deleteUser(w http.ResponseWriter, r *http.Request) {
    if r.Method != "DELETE" {
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
    }
    
    id := strings.TrimPrefix(r.URL.Path, "/users/delete/")
    if id == "" {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "缺少用户ID"})
        return
    }
    
    if _, exists := users[id]; !exists {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "用户不存在"})
        return
    }
    
    delete(users, id)
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "用户删除成功"})
}

// CORS中间件
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if r.Method == "OPTIONS" {
            w.WriteHeader(http.StatusOK)
            return
        }
        
        next.ServeHTTP(w, r)
    })
}
```

## 第三章：数据编码与解析

### 3.1 encoding/json包：JSON处理

`encoding/json`包提供了JSON数据的编码和解码功能，是处理JSON数据的标准方式。

#### JSON编码（序列化）

```go
package main

import (
    "encoding/json"
    "fmt"
)

// 定义结构体
type Person struct {
    Name    string   `json:"name"`              // 字段标签指定JSON键名
    Age     int      `json:"age"`               // 小写字母开头的字段不会被导出
    Email   string   `json:"email,omitempty"`   // omitempty表示空值不输出
    Hobbies []string `json:"hobbies"`
    Height  float64  `json:"height,omitempty"`
}

func main() {
    // 创建Person实例
    person := Person{
        Name:    "张三",
        Age:     30,
        Email:   "zhangsan@example.com",
        Hobbies: []string{"读书", "游泳", "编程"},
    }
    
    // 编码为JSON字符串
    jsonData, err := json.Marshal(person)
    if err != nil {
        fmt.Printf("JSON编码失败: %v\n", err)
        return
    }
    fmt.Printf("JSON字符串: %s\n", jsonData)
    
    // 使用MarshalIndent进行格式化输出
    formattedJSON, err := json.MarshalIndent(person, "", "  ")
    if err != nil {
        fmt.Printf("JSON格式化失败: %v\n", err)
        return
    }
    fmt.Printf("格式化JSON:\n%s\n", formattedJSON)
    
    // 编码map
    data := map[string]interface{}{
        "name":  "李四",
        "age":   25,
        "scores": []int{85, 90, 95},
    }
    mapJSON, _ := json.MarshalIndent(data, "", "  ")
    fmt.Printf("Map的JSON:\n%s\n", mapJSON)
}
```

#### JSON解码（反序列化）

```go
func main() {
    // JSON字符串
    jsonStr := `{
        "name": "王五",
        "age": 35,
        "email": "wangwu@example.com",
        "hobbies": ["爬山", "摄影", "旅游"],
        "height": 1.75
    }`
    
    // 解码到结构体
    var person Person
    err := json.Unmarshal([]byte(jsonStr), &person)
    if err != nil {
        fmt.Printf("JSON解码失败: %v\n", err)
        return
    }
    fmt.Printf("解码后的Person: %+v\n", person)
    
    // 解码到map
    var data map[string]interface{}
    err = json.Unmarshal([]byte(jsonStr), &data)
    if err != nil {
        fmt.Printf("JSON解码到map失败: %v\n", err)
        return
    }
    fmt.Printf("解码到map: %+v\n", data)
    
    // 访问map中的嵌套数据
    if hobbies, ok := data["hobbies"].([]interface{}); ok {
        fmt.Println("爱好:")
        for _, hobby := range hobbies {
            fmt.Printf("- %v\n", hobby)
        }
    }
    
    // 使用Decoder从io.Reader读取JSON
    reader := strings.NewReader(jsonStr)
    decoder := json.NewDecoder(reader)
    var decodedPerson Person
    decoder.Decode(&decodedPerson)
    fmt.Printf("使用Decoder解码: %+v\n", decodedPerson)
}
```

#### 自定义JSON编码与解码

可以通过实现`json.Marshaler`和`json.Unmarshaler`接口来自定义JSON的编码和解码行为。

```go
// 自定义时间类型
type CustomTime time.Time

// 实现Marshaler接口
func (ct CustomTime) MarshalJSON() ([]byte, error) {
    // 按照自定义格式输出时间
    formatted := fmt.Sprintf("\"%s\"", time.Time(ct).Format("2006-01-02 15:04:05"))
    return []byte(formatted), nil
}

// 实现Unmarshaler接口
func (ct *CustomTime) UnmarshalJSON(data []byte) error {
    // 解析自定义格式的时间
    var timeStr string
    if err := json.Unmarshal(data, &timeStr); err != nil {
        return err
    }
    
    t, err := time.Parse("2006-01-02 15:04:05", timeStr)
    if err != nil {
        return err
    }
    
    *ct = CustomTime(t)
    return nil
}

// 包含自定义时间的结构体
type Event struct {
    Name      string     `json:"name"`
    Timestamp CustomTime `json:"timestamp"`
}

func main() {
    // 创建事件
    event := Event{
        Name:      "会议",
        Timestamp: CustomTime(time.Now()),
    }
    
    // 编码
    jsonData, _ := json.MarshalIndent(event, "", "  ")
    fmt.Printf("自定义编码JSON:\n%s\n", jsonData)
    
    // 解码
    jsonStr := `{
        "name": "聚会",
        "timestamp": "2023-12-25 18:00:00"
    }`
    
    var decodedEvent Event
    json.Unmarshal([]byte(jsonStr), &decodedEvent)
    fmt.Printf("解码后的事件: %+v, 时间: %v\n", 
        decodedEvent.Name, time.Time(decodedEvent.Timestamp))
}
```

### 3.2 encoding/xml包：XML处理

`encoding/xml`包提供了XML数据的编码和解码功能。

```go
// 定义XML结构体
type Book struct {
    XMLName xml.Name `xml:"book"`
    ID      string   `xml:"id,attr"` // XML属性
    Title   string   `xml:"title"`
    Author  string   `xml:"author"`
    Year    int      `xml:"year"`
    Price   float64  `xml:"price"`
}

func main() {
    // 创建Book实例
    book := Book{
        ID:     "1",
        Title:  "Go程序设计语言",
        Author: "Alan A. A. Donovan",
        Year:   2015,
        Price:  89.0,
    }
    
    // 编码为XML
    xmlData, err := xml.MarshalIndent(book, "", "  ")
    if err != nil {
        fmt.Printf("XML编码失败: %v\n", err)
        return
    }
    
    // 添加XML声明
    xmlStr := xml.Header + string(xmlData)
    fmt.Printf("XML数据:\n%s\n", xmlStr)
    
    // 解码XML
    xmlInput := `<?xml version="1.0" encoding="UTF-8"?>\n<book id="2">\n  <title>Go并发编程实战</title>\n  <author>Go专家</author>\n  <year>2020</year>\n  <price>79.0</price>\n</book>`
    
    var decodedBook Book
    err = xml.Unmarshal([]byte(xmlInput), &decodedBook)
    if err != nil {
        fmt.Printf("XML解码失败: %v\n", err)
        return
    }
    
    fmt.Printf("解码后的Book: %+v\n", decodedBook)
}
```

## 第四章：时间与日期处理

### 4.1 time包：时间管理

`time`包提供了时间的测量和显示功能，是处理时间和日期的标准库。

#### 获取当前时间

```go
func main() {
    // 获取当前时间
    now := time.Now()
    fmt.Printf("当前时间: %v\n", now)
    
    // 获取UTC时间
    utcNow := now.UTC()
    fmt.Printf("UTC时间: %v\n", utcNow)
    
    // 获取Unix时间戳（秒）
    unixSec := now.Unix()
    fmt.Printf("Unix时间戳(秒): %d\n", unixSec)
    
    // 获取Unix时间戳（毫秒）
    unixNano := now.UnixNano()
    fmt.Printf("Unix时间戳(纳秒): %d\n", unixNano)
    fmt.Printf("Unix时间戳(毫秒): %d\n", unixNano/1e6)
}
```

#### 时间格式化

```go
func main() {
    now := time.Now()
    
    // 格式化时间（注意：必须使用2006-01-02 15:04:05作为参考时间）
    fmt.Printf("标准格式: %s\n", now.Format(time.RFC3339))
    fmt.Printf("日期: %s\n", now.Format("2006-01-02"))
    fmt.Printf("时间: %s\n", now.Format("15:04:05"))
    fmt.Printf("完整格式: %s\n", now.Format("2006年01月02日 15:04:05"))
    
    // 解析时间字符串
    layout := "2006-01-02"
    t, err := time.Parse(layout, "2023-12-25")
    if err != nil {
        fmt.Printf("解析时间失败: %v\n", err)
    } else {
        fmt.Printf("解析的时间: %v\n", t)
    }
    
    // 带时区解析
    tz, _ := time.LoadLocation("Asia/Shanghai")
    t2, err := time.ParseInLocation(layout, "2023-12-25", tz)
    if err != nil {
        fmt.Printf("带时区解析失败: %v\n", err)
    } else {
        fmt.Printf("带时区解析的时间: %v\n", t2)
    }
}
```

#### 时间计算与比较

```go
func main() {
    now := time.Now()
    
    // 时间加减
    oneHourLater := now.Add(time.Hour)
    twoDaysEarlier := now.AddDate(0, 0, -2) // 年, 月, 日
    
    fmt.Printf("当前时间: %v\n", now)
    fmt.Printf("一小时后: %v\n", oneHourLater)
    fmt.Printf("两天前: %v\n", twoDaysEarlier)
    
    // 时间差
    diff := oneHourLater.Sub(now)
    fmt.Printf("时间差: %v\n", diff)
    fmt.Printf("小时差: %f\n", diff.Hours())
    fmt.Printf("分钟差: %f\n", diff.Minutes())
    fmt.Printf("秒差: %f\n", diff.Seconds())
    
    // 时间比较
    fmt.Printf("now在oneHourLater之前: %v\n", now.Before(oneHourLater))
    fmt.Printf("now在twoDaysEarlier之后: %v\n", now.After(twoDaysEarlier))
    fmt.Printf("now与now相等: %v\n", now.Equal(now))
    
    // 定时器
    timer := time.AfterFunc(2*time.Second, func() {
        fmt.Println("2秒后执行")
    })
    defer timer.Stop() // 确保定时器被停止
    
    // 等待定时器触发
    time.Sleep(3 * time.Second)
}
```

### 4.2 定时器与Ticker

#### 使用定时器（Timer）

```go
func main() {
    // 创建定时器
    timer := time.NewTimer(2 * time.Second)
    defer timer.Stop() // 确保定时器被停止
    
    fmt.Println("等待定时器触发...")
    <-timer.C // 阻塞直到定时器触发
    fmt.Println("定时器已触发")
    
    // 使用time.After（一次性定时器）
    fmt.Println("等待一次性定时器...")
    <-time.After(1 * time.Second)
    fmt.Println("一次性定时器已触发")
    
    // 重置定时器
    timer.Reset(3 * time.Second)
    fmt.Println("等待重置后的定时器...")
    <-timer.C
    fmt.Println("重置后的定时器已触发")
}
```

#### 使用Ticker

```go
func main() {
    // 创建Ticker
    ticker := time.NewTicker(1 * time.Second)
    defer ticker.Stop()
    
    // 创建一个通道用于停止
    done := make(chan bool)
    
    // 启动一个goroutine处理tick事件
    go func() {
        for {
            select {
            case <-ticker.C:
                fmt.Printf("tick: %v\n", time.Now().Format("15:04:05"))
            case <-done:
                fmt.Println("ticker已停止")
                return
            }
        }
    }()
    
    // 5秒后停止ticker
    time.Sleep(5 * time.Second)
    done <- true
    
    fmt.Println("程序结束")
}
```

## 第五章：命令行参数与环境

### 5.1 flag包：命令行参数解析

`flag`包提供了命令行参数的定义、解析和使用功能。

#### 基本用法

```go
func main() {
    // 定义命令行参数
    namePtr := flag.String("name", "World", "用户名")
    agePtr := flag.Int("age", 30, "年龄")
    heightPtr := flag.Float64("height", 1.75, "身高")
    verbosePtr := flag.Bool("verbose", false, "详细模式")
    
    // 解析命令行参数
    flag.Parse()
    
    // 使用解析后的参数
    fmt.Printf("Hello, %s!\n", *namePtr)
    fmt.Printf("年龄: %d\n", *agePtr)
    fmt.Printf("身高: %.2f\n", *heightPtr)
    fmt.Printf("详细模式: %v\n", *verbosePtr)
    
    // 获取非选项参数
    args := flag.Args()
    fmt.Printf("非选项参数数量: %d\n", len(args))
    for i, arg := range args {
        fmt.Printf("参数 %d: %s\n", i, arg)
    }
}
```

#### 使用自定义类型

```go
// 自定义类型
type ArrayValue []string

// 实现flag.Value接口
func (a *ArrayValue) String() string {
    return strings.Join(*a, ",")
}

func (a *ArrayValue) Set(s string) error {
    *a = strings.Split(s, ",")
    return nil
}

func main() {
    // 定义自定义类型的参数
    var hobbies ArrayValue
    flag.Var(&hobbies, "hobbies", "爱好，用逗号分隔")
    
    flag.Parse()
    
    fmt.Printf("爱好: %v\n", hobbies)
}
```

### 5.2 os/exec包：执行外部命令

`os/exec`包提供了执行外部命令的功能。

```go
func main() {
    // 执行简单命令
    cmd := exec.Command("echo", "Hello, Go!")
    output, err := cmd.Output()
    if err != nil {
        fmt.Printf("执行命令失败: %v\n", err)
        return
    }
    
    fmt.Printf("命令输出: %s\n", output)
    
    // 获取命令的标准输出和错误输出
    cmd2 := exec.Command("ls", "-la")
    var stdout, stderr bytes.Buffer
    cmd2.Stdout = &stdout
    cmd2.Stderr = &stderr
    
    err = cmd2.Run()
    if err != nil {
        fmt.Printf("执行命令失败: %v\n", err)
        fmt.Printf("错误输出: %s\n", stderr.String())
        return
    }
    
    fmt.Printf("命令输出:\n%s\n", stdout.String())
    
    // 执行shell命令
    shellCmd := exec.Command("sh", "-c", "echo $HOME && date")
    shellOutput, err := shellCmd.CombinedOutput() // 合并标准输出和错误输出
    if err != nil {
        fmt.Printf("执行shell命令失败: %v\n", err)
        return
    }
    
    fmt.Printf("Shell命令输出:\n%s\n", shellOutput)
}
```

## 第六章：其他常用标准库

### 6.1 strings包：字符串操作

`strings`包提供了字符串处理的各种函数。

```go
func main() {
    str := "Hello, Go Language!"
    
    // 字符串查找
    fmt.Printf("是否包含Go: %v\n", strings.Contains(str, "Go"))
    fmt.Printf("是否包含任一字符: %v\n", strings.ContainsAny(str, "abcXYZ"))
    fmt.Printf("Go的位置: %d\n", strings.Index(str, "Go"))
    fmt.Printf("最后一个o的位置: %d\n", strings.LastIndex(str, "o"))
    
    // 字符串修改
    fmt.Printf("转大写: %s\n", strings.ToUpper(str))
    fmt.Printf("转小写: %s\n", strings.ToLower(str))
    fmt.Printf("替换Go为Golang: %s\n", strings.Replace(str, "Go", "Golang", -1))
    fmt.Printf("只替换第一个o: %s\n", strings.Replace(str, "o", "O", 1))
    
    // 字符串分割与连接
    parts := strings.Split(str, ", ")
    fmt.Printf("分割结果: %v\n", parts)
    fmt.Printf("重新连接: %s\n", strings.Join(parts, ":"))
    
    // 字符串修剪
    str2 := "  Hello, World!  \n"
    fmt.Printf("修剪空白: '%s'\n", strings.TrimSpace(str2))
    fmt.Printf("修剪前缀He: '%s'\n", strings.TrimPrefix(str, "He"))
    fmt.Printf("修剪后缀! : '%s'\n", strings.TrimSuffix(str, "!"))
    fmt.Printf("修剪字符集: '%s'\n", strings.Trim("!!Hello!!", "!"))
}
```

### 6.2 strconv包：字符串与其他类型转换

`strconv`包提供了字符串与基本类型之间的转换功能。

```go
func main() {
    // 字符串转整数
    i, err := strconv.Atoi("123")
    if err != nil {
        fmt.Printf("转换失败: %v\n", err)
    } else {
        fmt.Printf("字符串'123'转整数: %d\n", i)
    }
    
    // 整数转字符串
    s := strconv.Itoa(456)
    fmt.Printf("整数456转字符串: '%s'\n", s)
    
    // 字符串转浮点数
    f, err := strconv.ParseFloat("3.14159", 64)
    if err != nil {
        fmt.Printf("转换失败: %v\n", err)
    } else {
        fmt.Printf("字符串'3.14159'转浮点数: %f\n", f)
    }
    
    // 浮点数转字符串
    fs := strconv.FormatFloat(2.71828, 'f', 5, 64)
    fmt.Printf("浮点数2.71828转字符串: '%s'\n", fs)
    
    // 字符串转布尔值
    b, err := strconv.ParseBool("true")
    if err != nil {
        fmt.Printf("转换失败: %v\n", err)
    } else {
        fmt.Printf("字符串'true'转布尔值: %v\n", b)
    }
    
    // 布尔值转字符串
    bs := strconv.FormatBool(false)
    fmt.Printf("布尔值false转字符串: '%s'\n", bs)
}
```

### 6.3 regexp包：正则表达式

`regexp`包提供了正则表达式的匹配功能。

```go
func main() {
    // 编译正则表达式
    re, err := regexp.Compile(`\d+`)
    if err != nil {
        fmt.Printf("编译正则表达式失败: %v\n", err)
        return
    }
    
    str := "abc123def456ghi"
    
    // 查找第一个匹配
    match := re.FindString(str)
    fmt.Printf("第一个匹配: '%s'\n", match)
    
    // 查找所有匹配
    matches := re.FindAllString(str, -1)
    fmt.Printf("所有匹配: %v\n", matches)
    
    // 查找匹配的位置
    loc := re.FindStringIndex(str)
    fmt.Printf("第一个匹配的位置: %v\n", loc)
    
    // 替换匹配的部分
    replaced := re.ReplaceAllString(str, "[NUM]")
    fmt.Printf("替换后: '%s'\n", replaced)
    
    // 使用函数替换
    replacedFunc := re.ReplaceAllStringFunc(str, func(s string) string {
        num, _ := strconv.Atoi(s)
        return fmt.Sprintf("{%d}", num*2)
    })
    fmt.Printf("函数替换后: '%s'\n", replacedFunc)
    
    // 验证字符串是否匹配
    emailRe := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
    emails := []string{
        "user@example.com",
        "invalid-email",
        "another.user@domain.co.uk",
    }
    
    for _, email := range emails {
        if emailRe.MatchString(email) {
            fmt.Printf("'%s' 是有效的邮箱地址\n", email)
        } else {
            fmt.Printf("'%s' 不是有效的邮箱地址\n", email)
        }
    }
}
```

### 6.4 sort包：排序

`sort`包提供了排序和搜索功能。

```go
func main() {
    // 排序整数切片
    ints := []int{5, 2, 9, 1, 5, 6}
    sort.Ints(ints)
    fmt.Printf("排序后的整数: %v\n", ints)
    
    // 排序字符串切片
    strings := []string{"banana", "apple", "cherry", "date"}
    sort.Strings(strings)
    fmt.Printf("排序后的字符串: %v\n", strings)
    
    // 自定义排序
    people := []struct {
        Name string
        Age  int
    }{
        {"张三", 30},
        {"李四", 25},
        {"王五", 35},
        {"赵六", 28},
    }
    
    // 按年龄排序
    sort.Slice(people, func(i, j int) bool {
        return people[i].Age < people[j].Age
    })
    
    fmt.Println("按年龄排序的人员:")
    for _, p := range people {
        fmt.Printf("%s: %d岁\n", p.Name, p.Age)
    }
    
    // 搜索
    sorted := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
    idx := sort.SearchInts(sorted, 7)
    fmt.Printf("数字7在排序切片中的位置: %d\n", idx)
    
    // 自定义搜索
    idx2 := sort.Search(len(sorted), func(i int) bool {
        return sorted[i] >= 6
    })
    fmt.Printf("第一个>=6的元素位置: %d\n", idx2)
}
```

## 结语：掌握标准库，提升开发效率

Go语言的标准库是一个功能强大、设计精良的工具集，它为开发者提供了解决各种常见问题的标准方法。通过本文的介绍，我们了解了Go标准库中最常用的一些包，包括文件IO、网络编程、数据编码、时间处理、命令行参数解析等。

熟练掌握标准库的使用，可以帮助我们：

1. **提高开发效率**：标准库提供了现成的解决方案，避免重复造轮子
2. **保证代码质量**：标准库经过充分测试和优化，质量可靠
3. **增强代码可维护性**：使用标准库使代码更加规范、统一
4. **提升程序性能**：许多标准库组件经过性能优化

在实际开发中，我们应该养成查阅标准库文档的习惯，充分利用标准库提供的功能。同时，也要注意标准库的版本变化，及时了解新特性和API的变化。

Go语言的标准库虽然强大，但并不是万能的。对于一些特定领域的需求，我们可能还需要使用第三方库。不过，理解和掌握标准库是使用Go语言进行开发的基础，也是成为一名优秀Go开发者的必经之路。

希望本文能够帮助你更好地理解和使用Go语言的标准库，在实际项目中发挥它的强大功能，提升你的开发效率和代码质量。