---
title: Go语言并发编程：Goroutines与Channels详解
description: 深入探讨Go语言的并发编程模型，包括Goroutines的创建与管理、Channels的使用、同步原语以及并发设计模式，帮助开发者掌握Go语言并发编程技术
slug: go-concurrency-programming
date: 2024-10-30T10:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["Go"]
---

# Go语言并发编程：Goroutines与Channels详解

## 引言：Go语言的并发哲学

并发编程是现代软件开发中的重要课题，随着多核处理器的普及，充分利用系统资源进行并发计算成为提升程序性能的关键。Go语言在设计之初就将并发作为核心特性，提供了简洁而强大的并发编程模型，使开发者能够轻松编写高效的并发程序。

与传统的多线程模型不同，Go语言的并发模型基于CSP（Communicating Sequential Processes）理论，通过goroutines和channels实现了"不要通过共享内存来通信，而要通过通信来共享内存"的编程理念。这种设计使得Go语言在处理并发任务时更加安全、高效，也更易于理解和维护。

本文将深入探讨Go语言的并发编程特性，包括goroutines的创建与管理、channels的使用、同步原语以及并发设计模式，帮助你掌握Go语言并发编程的精髓。

## 第一章：Goroutines基础

### 1.1 Goroutines是什么？

Goroutine是Go语言中并发执行的轻量级线程。与传统线程相比，goroutine的创建和调度开销非常小，一个程序可以轻松创建成千上万个goroutine。

Goroutine的特点：
- **轻量级**：占用内存少，启动开销小
- **由Go运行时调度**：不是直接映射到系统线程
- **多路复用**：多个goroutine可能运行在同一个系统线程上
- **抢占式调度**：运行时可以在goroutine阻塞时切换到其他goroutine
- **自动管理**：不需要手动创建和销毁线程池

### 1.2 创建和启动Goroutine

创建goroutine非常简单，只需要在函数调用前加上`go`关键字：

```go
package main

import (
    "fmt"
    "time"
)

func sayHello() {
    fmt.Println("Hello from goroutine")
}

func main() {
    // 启动一个goroutine
    go sayHello()
    
    // 主goroutine需要等待一下，否则可能子goroutine还没执行就退出了
    time.Sleep(time.Second)
    fmt.Println("Hello from main")
}
```

也可以使用匿名函数创建goroutine：

```go
func main() {
    go func() {
        fmt.Println("Hello from anonymous goroutine")
    }()
    
    time.Sleep(time.Second)
}
```

向goroutine传递参数：

```go
func main() {
    go func(message string) {
        fmt.Println(message)
    }("Hello with parameter")
    
    time.Sleep(time.Second)
}
```

### 1.3 Goroutine生命周期

Goroutine的生命周期由Go运行时管理，不需要我们手动控制：

1. **创建**：使用`go`关键字创建goroutine
2. **执行**：goroutine执行函数体中的代码
3. **终止**：函数执行完毕或panic而未被恢复时终止

当主goroutine（main函数）终止时，所有其他goroutine也会被强制终止，无论它们是否执行完毕。这就是为什么在上面的例子中我们需要使用`time.Sleep`来让主goroutine等待子goroutine执行完毕。

### 1.4 Goroutine与系统线程的关系

Go运行时包含一个调度器，负责将goroutine分配到系统线程上执行。调度器采用了M:N的调度模型，即M个goroutine运行在N个系统线程上。

主要组件：
- **G**：表示goroutine
- **M**：表示系统线程（machine）
- **P**：表示处理器（processor），是连接G和M的中间层

调度器的工作原理：
- 当goroutine阻塞（如IO操作、通道操作等）时，调度器会将其挂起，并将其他goroutine调度到线程上执行
- 当阻塞的goroutine恢复时，会重新进入可运行队列
- 调度器会定期执行goroutine切换，防止某个goroutine长时间占用线程

通过这种方式，Go能够高效地管理大量的并发任务，充分利用多核处理器的性能。

## 第二章：Channels

### 2.1 Channels基础

Channel是Go语言中goroutine之间通信的管道。通过channel，一个goroutine可以向另一个goroutine发送数据，实现安全的数据共享。

Channel的特点：
- **类型化**：每个channel都有一个特定的类型，只能传递该类型的值
- **同步或异步**：可以创建带缓冲或不带缓冲的channel
- **线程安全**：channel的操作是原子的，不需要额外的锁机制
- **双向或单向**：可以限制channel只能发送或只能接收

### 2.2 创建和使用Channel

创建channel使用`make`函数：

```go
// 创建不带缓冲的channel（同步channel）
ch := make(chan int)

// 创建带缓冲的channel（异步channel）
ch := make(chan int, 10)
```

发送和接收操作：

```go
// 发送数据到channel
ch <- 42

// 从channel接收数据
value := <-ch

// 也可以使用多重赋值检查channel是否关闭
value, ok := <-ch
```

关闭channel：

```go
// 关闭channel
close(ch)
```

注意事项：
- 向已关闭的channel发送数据会导致panic
- 从已关闭的channel接收数据会返回零值和一个布尔值false
- 不要重复关闭同一个channel
- 通常只由发送方关闭channel

### 2.3 无缓冲Channel vs 有缓冲Channel

#### 无缓冲Channel

无缓冲channel（也称为同步channel）没有存储空间，发送操作会阻塞，直到有goroutine从channel接收数据。同样，接收操作也会阻塞，直到有goroutine发送数据到channel。

```go
func main() {
    ch := make(chan int) // 无缓冲channel
    
    go func() {
        fmt.Println("发送前")
        ch <- 42 // 阻塞，直到有goroutine接收
        fmt.Println("发送后")
    }()
    
    fmt.Println("接收前")
    value := <-ch // 阻塞，直到有goroutine发送
    fmt.Println("接收后，值为:", value)
}
```

无缓冲channel保证了发送和接收操作的同步，适用于需要严格同步的场景。

#### 有缓冲Channel

有缓冲channel有一定的存储空间，发送操作只有在缓冲区满时才会阻塞，接收操作只有在缓冲区空时才会阻塞。

```go
func main() {
    ch := make(chan int, 2) // 有2个缓冲槽位的channel
    
    // 可以连续发送2个值而不阻塞
    ch <- 1
    ch <- 2
    
    // 再发送会阻塞，因为缓冲区已满
    // ch <- 3 // 这行会阻塞
    
    // 接收一个值后，缓冲区有了空间
    fmt.Println(<-ch) // 输出: 1
    
    // 现在可以再发送一个值
    ch <- 3
    
    // 接收剩余的值
    fmt.Println(<-ch) // 输出: 2
    fmt.Println(<-ch) // 输出: 3
}
```

有缓冲channel适用于生产者和消费者处理速度不均衡的场景，可以起到缓冲作用。

### 2.4 单向Channel

Go语言允许创建单向channel，即只能发送或只能接收的channel：

```go
// 创建单向channel
var sendCh chan<- int  // 只能发送的channel
var recvCh <-chan int  // 只能接收的channel

// 从双向channel转换为单向channel
ch := make(chan int)
sendCh = ch // 双向channel可以隐式转换为单向channel
recvCh = ch
```

单向channel主要用于函数参数和返回值，明确函数对channel的使用方式：

```go
// 只发送数据的函数
func sendOnly(ch chan<- int, values ...int) {
    for _, v := range values {
        ch <- v
    }
    close(ch)
}

// 只接收数据的函数
func recvOnly(ch <-chan int) {
    for v := range ch {
        fmt.Println("接收:", v)
    }
}

func main() {
    ch := make(chan int)
    
    go sendOnly(ch, 1, 2, 3)
    recvOnly(ch)
}
```

### 2.5 遍历Channel

可以使用`for range`循环遍历channel，直到channel被关闭：

```go
func main() {
    ch := make(chan int, 3)
    ch <- 1
    ch <- 2
    ch <- 3
    close(ch) // 必须关闭channel，否则for range会一直阻塞
    
    // 遍历channel中的所有值
    for v := range ch {
        fmt.Println(v)
    }
}
```

注意：如果channel没有被关闭，`for range`循环会一直等待新值，导致死锁。

## 第三章：同步原语

### 3.1 WaitGroup

`WaitGroup`用于等待一组goroutine完成执行。它特别适用于当你需要等待所有goroutine都执行完毕后再继续执行主程序的场景。

使用方法：
1. 创建`WaitGroup`变量
2. 使用`Add()`方法设置计数器
3. 在每个goroutine中调用`Done()`方法减少计数器
4. 使用`Wait()`方法阻塞直到计数器归0

```go
func main() {
    var wg sync.WaitGroup
    
    // 设置计数器为3，表示有3个goroutine
    wg.Add(3)
    
    for i := 1; i <= 3; i++ {
        go func(id int) {
            // 函数退出时调用Done()
            defer wg.Done()
            
            fmt.Printf("Goroutine %d 开始\n", id)
            time.Sleep(time.Second)
            fmt.Printf("Goroutine %d 结束\n", id)
        }(i)
    }
    
    fmt.Println("等待所有goroutine完成...")
    wg.Wait() // 阻塞直到所有goroutine调用Done()
    fmt.Println("所有goroutine已完成")
}
```

注意：`WaitGroup`的计数器不能小于0，否则会触发panic。通常使用`defer wg.Done()`确保即使发生panic也能正确调用`Done()`。

### 3.2 Mutex

`Mutex`（互斥锁）用于保护共享资源，确保在同一时刻只有一个goroutine可以访问该资源。

使用方法：
1. 创建`sync.Mutex`变量
2. 在访问共享资源前调用`Lock()`方法获取锁
3. 在访问完成后调用`Unlock()`方法释放锁

```go
func main() {
    var counter int
    var mutex sync.Mutex
    var wg sync.WaitGroup
    
    // 启动1000个goroutine，每个都将counter增加1000
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            
            for j := 0; j < 1000; j++ {
                // 获取锁
                mutex.Lock()
                // 临界区：访问共享资源
                counter++
                // 释放锁
                mutex.Unlock()
            }
        }()
    }
    
    wg.Wait()
    fmt.Println("counter =", counter) // 应该输出 1,000,000
}
```

使用`defer mutex.Unlock()`可以确保即使发生panic也能释放锁，避免死锁：

```go
mutex.Lock()
defer mutex.Unlock()
// 访问共享资源...
```

### 3.3 RWMutex

`RWMutex`（读写锁）是对`Mutex`的改进，允许多个goroutine同时读取共享资源，但写入时需要独占锁。这在读取操作远多于写入操作的场景中可以提高并发性能。

方法：
- `RLock()`：获取读锁，多个goroutine可以同时持有
- `RUnlock()`：释放读锁
- `Lock()`：获取写锁，独占，会阻塞所有读锁和写锁
- `Unlock()`：释放写锁

```go
func main() {
    var data map[string]int = make(map[string]int)
    var rwMutex sync.RWMutex
    var wg sync.WaitGroup
    
    // 启动5个goroutine写入数据
    for i := 0; i < 5; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            
            key := fmt.Sprintf("key-%d", id)
            // 获取写锁
            rwMutex.Lock()
            data[key] = id * 10
            rwMutex.Unlock()
        }(i)
    }
    
    // 启动10个goroutine读取数据
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            
            // 获取读锁
            rwMutex.RLock()
            // 多个goroutine可以同时读取
            for key, value := range data {
                fmt.Printf("Reader %d: %s = %d\n", id, key, value)
            }
            rwMutex.RUnlock()
        }(i)
    }
    
    wg.Wait()
}
```

### 3.4 Once

`Once`用于确保某个函数只执行一次，常用于初始化场景。

使用方法：
1. 创建`sync.Once`变量
2. 使用`Do()`方法传入要执行的函数

```go
var once sync.Once
var initialized bool

func initialize() {
    fmt.Println("执行初始化")
    initialized = true
}

func main() {
    var wg sync.WaitGroup
    
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            
            // 多次调用，但initialize只会执行一次
            once.Do(initialize)
            fmt.Printf("Goroutine %d: 初始化完成 = %v\n", id, initialized)
        }(i)
    }
    
    wg.Wait()
}
```

`Once`是线程安全的，不需要额外的同步机制。

### 3.5 Cond

`Cond`（条件变量）用于在某些条件满足时通知goroutine。它通常与互斥锁一起使用，允许goroutine在条件不满足时等待，在条件满足时被唤醒。

主要方法：
- `Wait()`：等待条件满足，会自动释放锁并阻塞，被唤醒时重新获取锁
- `Signal()`：唤醒一个等待的goroutine
- `Broadcast()`：唤醒所有等待的goroutine

```go
func main() {
    var mutex sync.Mutex
    cond := sync.NewCond(&mutex)
    var ready bool
    var wg sync.WaitGroup
    
    // 启动3个goroutine等待条件满足
    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func(id int) {
            defer wg.Done()
            
            mutex.Lock()
            defer mutex.Unlock()
            
            fmt.Printf("Goroutine %d: 等待条件满足\n", id)
            // 等待条件满足
            for !ready { // 使用for循环检查条件，防止虚假唤醒
                cond.Wait()
            }
            fmt.Printf("Goroutine %d: 条件已满足，继续执行\n", id)
        }(i)
    }
    
    // 模拟准备工作
    time.Sleep(2 * time.Second)
    
    // 设置条件并通知等待的goroutine
    mutex.Lock()
    ready = true
    fmt.Println("条件已准备就绪，通知所有等待的goroutine")
    cond.Broadcast() // 通知所有等待的goroutine
    // cond.Signal() // 只通知一个等待的goroutine
    mutex.Unlock()
    
    wg.Wait()
}
```

注意：在`Wait()`之前必须先获取锁，并且在循环中检查条件，因为`Wait()`可能会被虚假唤醒。

## 第四章：并发设计模式

### 4.1 生产者-消费者模式

生产者-消费者是最常见的并发设计模式，通过channel连接生产者和消费者goroutine。

```go
func producer(ch chan<- int, count int) {
    defer close(ch)
    
    for i := 1; i <= count; i++ {
        fmt.Printf("生产者: 生产 %d\n", i)
        ch <- i
        time.Sleep(100 * time.Millisecond) // 模拟生产过程
    }
}

func consumer(id int, ch <-chan int, wg *sync.WaitGroup) {
    defer wg.Done()
    
    for value := range ch {
        fmt.Printf("消费者 %d: 消费 %d\n", id, value)
        time.Sleep(200 * time.Millisecond) // 模拟消费过程
    }
}

func main() {
    ch := make(chan int, 5) // 带缓冲的channel
    var wg sync.WaitGroup
    
    // 启动生产者
    go producer(ch, 10)
    
    // 启动3个消费者
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go consumer(i, ch, &wg)
    }
    
    // 等待所有消费者完成
    wg.Wait()
    fmt.Println("所有任务完成")
}
```

在这个例子中，生产者将数据发送到channel，多个消费者从channel接收数据进行处理。带缓冲的channel可以减少生产者和消费者之间的等待。

### 4.2 Worker Pool模式

Worker Pool模式创建一组工作线程（worker），它们从任务队列中获取任务并执行。这种模式适用于有大量任务需要并行处理的场景。

```go
type Task struct {
    ID  int
    Num int
}

func worker(id int, tasks <-chan Task, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    
    for task := range tasks {
        fmt.Printf("Worker %d: 处理任务 %d\n", id, task.ID)
        // 模拟任务处理
        time.Sleep(100 * time.Millisecond)
        results <- task.Num * 2 // 任务结果
    }
}

func main() {
    const numWorkers = 3
    const numTasks = 10
    
    tasks := make(chan Task, numTasks)
    results := make(chan int, numTasks)
    var wg sync.WaitGroup
    
    // 启动工作线程
    wg.Add(numWorkers)
    for i := 1; i <= numWorkers; i++ {
        go worker(i, tasks, results, &wg)
    }
    
    // 发送任务
    for i := 1; i <= numTasks; i++ {
        tasks <- Task{ID: i, Num: i}
    }
    close(tasks) // 关闭任务channel
    
    // 等待所有工作线程完成
    go func() {
        wg.Wait()
        close(results) // 所有工作完成后关闭结果channel
    }()
    
    // 收集结果
    for result := range results {
        fmt.Printf("结果: %d\n", result)
    }
    
    fmt.Println("所有任务完成")
}
```

Worker Pool模式的优点是可以控制并发数量，避免创建过多的goroutine，同时提高了任务处理的效率。

### 4.3 Fan Out/Fan In模式

Fan Out/Fan In模式先将工作分散到多个goroutine中并行处理（Fan Out），然后将结果合并（Fan In）。

```go
func fetchURL(url string) (string, error) {
    fmt.Printf("获取URL: %s\n", url)
    // 模拟HTTP请求
    time.Sleep(1 * time.Second)
    return "内容: " + url, nil
}

func worker(url string, resultCh chan<- string) {
    content, err := fetchURL(url)
    if err != nil {
        fmt.Printf("获取URL失败 %s: %v\n", url, err)
        resultCh <- ""
        return
    }
    resultCh <- content
}

func main() {
    urls := []string{
        "https://example.com/1",
        "https://example.com/2",
        "https://example.com/3",
        "https://example.com/4",
        "https://example.com/5",
    }
    
    resultCh := make(chan string, len(urls))
    
    // Fan Out: 并行处理多个URL
    for _, url := range urls {
        go worker(url, resultCh)
    }
    
    // Fan In: 收集所有结果
    var results []string
    for i := 0; i < len(urls); i++ {
        if content := <-resultCh; content != "" {
            results = append(results, content)
        }
    }
    close(resultCh)
    
    // 处理收集到的结果
    fmt.Println("收集到的结果数量:", len(results))
    for _, result := range results {
        fmt.Println(result)
    }
}
```

Fan Out/Fan In模式特别适用于并行处理多个独立任务，然后汇总结果的场景，如批量API请求、数据并行处理等。

### 4.4 Pipeline模式

Pipeline模式将数据处理分为多个阶段，每个阶段由一个或多个goroutine处理，阶段之间通过channel连接。

```go
// 生成数字
func generator(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            out <- n
        }
    }()
    return out
}

// 平方处理
func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            out <- n * n
        }
    }()
    return out
}

// 过滤处理
func filter(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            if n%3 != 0 { // 过滤掉能被3整除的数
                out <- n
            }
        }
    }()
    return out
}

func main() {
    // 构建pipeline
    in := generator(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    s := square(in)
    f := filter(s)
    
    // 消费结果
    for result := range f {
        fmt.Println(result)
    }
}
```

Pipeline模式的优点是可以将复杂的处理流程分解为简单的、可重用的阶段，每个阶段可以并行处理，提高整体效率。

### 4.5 Context用于控制并发

`context`包用于在goroutine之间传递截止时间、取消信号和其他请求范围的值。

主要功能：
- 取消goroutine执行
- 设置截止时间或超时时间
- 传递请求相关的值

```go
func worker(ctx context.Context, id int, wg *sync.WaitGroup) {
    defer wg.Done()
    
    for {
        select {
        case <-ctx.Done():
            // 收到取消信号
            fmt.Printf("Worker %d: 收到取消信号，退出\n", id)
            return
        default:
            // 正常工作
            fmt.Printf("Worker %d: 工作中\n", id)
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    var wg sync.WaitGroup
    
    // 创建可取消的context
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel() // 确保取消函数被调用
    
    // 启动3个worker
    for i := 1; i <= 3; i++ {
        wg.Add(1)
        go worker(ctx, i, &wg)
    }
    
    // 运行5秒后取消
    time.Sleep(5 * time.Second)
    fmt.Println("取消所有worker")
    cancel() // 发送取消信号
    
    // 等待所有worker退出
    wg.Wait()
    fmt.Println("所有worker已退出")
}
```

使用超时：

```go
// 设置5秒超时
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
```

使用截止时间：

```go
// 设置2024年1月1日截止
deadline := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
ctx, cancel := context.WithDeadline(context.Background(), deadline)
defer cancel()
```

## 第五章：并发安全与最佳实践

### 5.1 常见的并发问题

#### 竞态条件

竞态条件（Race Condition）是指多个goroutine同时访问共享资源，且至少有一个是写入操作，导致程序行为不可预测。

```go
// 竞态条件示例
var counter int
var wg sync.WaitGroup

func main() {
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++ // 竞态条件：多个goroutine同时修改counter
        }()
    }
    
    wg.Wait()
    fmt.Println("counter =", counter) // 结果可能小于1000
}
```

可以使用`go run -race`命令检测竞态条件。

#### 死锁

死锁（Deadlock）是指两个或多个goroutine互相等待对方释放资源，导致程序永久阻塞。

```go
// 死锁示例
func main() {
    ch1 := make(chan int)
    ch2 := make(chan int)
    
    go func() {
        ch1 <- 1 // 等待ch1可写
        <-ch2    // 等待ch2可读
    }()
    
    go func() {
        ch2 <- 2 // 等待ch2可写
        <-ch1    // 等待ch1可读
    }()
    
    time.Sleep(10 * time.Second) // 程序会在这里死锁
}
```

#### 活锁

活锁（Livelock）是指goroutine虽然没有阻塞，但由于不断重试操作而无法继续执行。

```go
// 活锁示例
func main() {
    var mutex1, mutex2 sync.Mutex
    var wg sync.WaitGroup
    
    wg.Add(2)
    
    // goroutine 1
    go func() {
        defer wg.Done()
        
        for {
            mutex1.Lock()
            time.Sleep(10 * time.Millisecond) // 增加死锁概率
            
            if mutex2.TryLock() {
                fmt.Println("Goroutine 1: 获取两个锁成功")
                mutex2.Unlock()
                mutex1.Unlock()
                break
            } else {
                // 获取失败，释放第一个锁并重试
                mutex1.Unlock()
                time.Sleep(10 * time.Millisecond) // 让出时间片
            }
        }
    }()
    
    // goroutine 2
    go func() {
        defer wg.Done()
        
        for {
            mutex2.Lock()
            time.Sleep(10 * time.Millisecond) // 增加死锁概率
            
            if mutex1.TryLock() {
                fmt.Println("Goroutine 2: 获取两个锁成功")
                mutex1.Unlock()
                mutex2.Unlock()
                break
            } else {
                // 获取失败，释放第二个锁并重试
                mutex2.Unlock()
                time.Sleep(10 * time.Millisecond) // 让出时间片
            }
        }
    }()
    
    wg.Wait()
    fmt.Println("完成")
}
```

### 5.2 并发安全的最佳实践

#### 避免共享状态

"不要通过共享内存来通信，而要通过通信来共享内存"是Go语言的并发哲学。尽量使用channel进行goroutine间通信，而不是共享内存。

#### 使用适当的同步机制

当必须共享内存时，使用适当的同步机制如Mutex、RWMutex等保护共享资源。

#### 避免死锁的原则

1. **避免嵌套锁**：尽量不要在持有一个锁的同时获取另一个锁
2. **统一锁的获取顺序**：如果必须获取多个锁，确保所有goroutine按相同的顺序获取
3. **使用带超时的锁尝试**：使用`TryLock`或带超时的context
4. **保持锁的作用域小**：尽量减少持有锁的时间

#### 使用Context管理goroutine生命周期

使用`context`包管理goroutine的生命周期，确保goroutine能够及时退出，避免资源泄露。

#### 限制并发数量

使用Worker Pool模式或信号量限制并发数量，避免创建过多的goroutine。

```go
// 使用信号量限制并发
func main() {
    semaphore := make(chan struct{}, 5) // 最多5个并发
    var wg sync.WaitGroup
    
    for i := 1; i <= 20; i++ {
        wg.Add(1)
        
        // 获取信号量
        semaphore <- struct{}{}
        
        go func(id int) {
            defer wg.Done()
            defer func() { <-semaphore }() // 释放信号量
            
            fmt.Printf("处理任务 %d\n", id)
            time.Sleep(1 * time.Second)
        }(i)
    }
    
    wg.Wait()
}
```

#### 优雅关闭

确保程序能够优雅地关闭，所有goroutine都能正常退出。

```go
func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()
    
    // 启动工作goroutine
    go worker(ctx)
    
    // 监听中断信号
    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
    
    // 等待中断信号
    <-sigCh
    fmt.Println("收到中断信号，正在关闭...")
    
    // 取消所有goroutine
    cancel()
    
    // 等待所有操作完成
    time.Sleep(1 * time.Second)
    fmt.Println("已关闭")
}
```

### 5.3 性能调优

#### 减少锁竞争

1. **使用细粒度锁**：将大锁拆分为多个小锁
2. **使用RWMutex**：在读多写少的场景中使用读写锁
3. **使用原子操作**：对于简单的计数器等，可以使用`sync/atomic`包的原子操作

```go
// 使用原子操作
var counter int64

func main() {
    var wg sync.WaitGroup
    
    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            atomic.AddInt64(&counter, 1) // 原子操作，无需锁
        }()
    }
    
    wg.Wait()
    fmt.Println("counter =", counter)
}
```

#### 合理设置Channel缓冲区

根据实际需求设置合适的channel缓冲区大小，太小会导致频繁阻塞，太大会浪费内存。

#### 避免goroutine泄漏

确保每个goroutine都能正常退出，避免goroutine泄漏。

```go
// 潜在的goroutine泄漏
func leakyFunction() <-chan int {
    ch := make(chan int)
    
    go func() {
        for i := 0; ; i++ {
            ch <- i // 如果没有消费者，这个goroutine会一直阻塞
        }
    }()
    
    return ch
}

// 避免泄漏的版本
func nonLeakyFunction(ctx context.Context) <-chan int {
    ch := make(chan int)
    
    go func() {
        defer close(ch)
        for i := 0; ; i++ {
            select {
            case ch <- i:
                // 发送成功
            case <-ctx.Done():
                // 收到取消信号，退出goroutine
                return
            }
        }
    }()
    
    return ch
}
```

## 结语：掌握Go并发编程的艺术

Go语言的并发模型为开发者提供了强大而灵活的并发编程能力。通过goroutines和channels，Go语言实现了轻量级并发和安全的通信机制，使得编写并发程序变得简单而高效。

在本文中，我们深入探讨了Go语言的并发特性，包括：

1. **Goroutines**：Go语言的轻量级线程，是并发的基本单位
2. **Channels**：goroutine间通信的管道，实现了"通过通信来共享内存"
3. **同步原语**：WaitGroup、Mutex、RWMutex、Once、Cond等，用于协调goroutine
4. **并发设计模式**：生产者-消费者、Worker Pool、Fan Out/Fan In、Pipeline等
5. **并发安全与最佳实践**：避免常见并发问题，编写高效、安全的并发程序

掌握Go语言的并发编程不仅可以提高程序性能，还能更好地利用现代多核处理器的能力。在实际开发中，我们应该根据具体需求选择合适的并发模式，同时注意并发安全，避免竞态条件、死锁等问题。

Go语言的并发哲学——"不要通过共享内存来通信，而要通过通信来共享内存"——为我们提供了一种思考并发问题的新方式。通过实践这种哲学，我们可以编写出更加清晰、安全、高效的并发程序。

希望本文能够帮助你更好地理解和掌握Go语言的并发编程技术，在实际项目中应用这些知识，构建高性能的并发系统。