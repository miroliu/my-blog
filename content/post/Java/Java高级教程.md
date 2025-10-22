---
title: Java高级教程
description: 深入学习Java的高级特性，掌握集合框架、泛型、多线程、反射、注解、IO流、NIO等核心高级功能。
date: 2025-10-22T16:30:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
---

# Java高级教程

本教程将深入介绍Java的高级特性，这些特性是Java开发中不可或缺的重要部分，掌握它们将帮助你编写更高效、更灵活的Java应用程序。

## 一、Java集合框架

### 1.1 集合框架概述

Java集合框架是Java提供的一套用于存储和操作对象的接口和类，主要位于`java.util`包中。

- **Collection接口**：单列集合的根接口
  - **List**：有序、可重复的集合
  - **Set**：无序、不可重复的集合
  - **Queue**：队列，先进先出的数据结构
- **Map接口**：双列集合，存储键值对

### 1.2 List接口实现类

- **ArrayList**：基于动态数组实现，随机访问快，增删慢
- **LinkedList**：基于双向链表实现，增删快，随机访问慢
- **Vector**：线程安全的动态数组，性能较低

```java
// ArrayList使用
List<String> arrayList = new ArrayList<>();
arrayList.add("Java");
arrayList.add("Python");
arrayList.add("C++");
System.out.println(arrayList.get(1));  // 输出：Python

// LinkedList使用
List<Integer> linkedList = new LinkedList<>();
linkedList.add(10);
linkedList.add(20);
linkedList.addFirst(5);
linkedList.addLast(30);
System.out.println(linkedList);  // 输出：[5, 10, 20, 30]
```

### 1.3 Set接口实现类

- **HashSet**：基于哈希表实现，无序，不允许重复
- **LinkedHashSet**：维护插入顺序的HashSet
- **TreeSet**：基于红黑树实现，有序（自然排序或定制排序）

```java
// HashSet使用
Set<String> hashSet = new HashSet<>();
hashSet.add("Apple");
hashSet.add("Banana");
hashSet.add("Apple");  // 重复元素，不会被添加
System.out.println(hashSet);  // 输出：[Apple, Banana]（顺序可能不同）

// TreeSet使用
Set<Integer> treeSet = new TreeSet<>();
treeSet.add(30);
treeSet.add(10);
treeSet.add(20);
System.out.println(treeSet);  // 输出：[10, 20, 30]（自然排序）
```

### 1.4 Map接口实现类

- **HashMap**：基于哈希表实现，键不允许重复，线程不安全
- **LinkedHashMap**：维护键插入顺序的HashMap
- **TreeMap**：基于红黑树实现，按键排序
- **Hashtable**：线程安全的哈希表，性能较低
- **ConcurrentHashMap**：线程安全且高效的哈希表

```java
// HashMap使用
Map<String, Integer> hashMap = new HashMap<>();
hashMap.put("Java", 95);
hashMap.put("Python", 90);
hashMap.put("C++", 85);
System.out.println(hashMap.get("Java"));  // 输出：95

// 遍历Map
for (Map.Entry<String, Integer> entry : hashMap.entrySet()) {
    System.out.println(entry.getKey() + ": " + entry.getValue());
}
```

### 1.5 集合工具类

- **Collections**：提供了一系列静态方法来操作集合
- **Arrays**：提供了一系列静态方法来操作数组

```java
// Collections工具类
List<Integer> numbers = new ArrayList<>(Arrays.asList(5, 2, 9, 1, 5, 6));
Collections.sort(numbers);  // 排序
Collections.reverse(numbers);  // 反转
Collections.shuffle(numbers);  // 随机打乱
Collections.max(numbers);  // 获取最大值
Collections.min(numbers);  // 获取最小值
Collections.frequency(numbers, 5);  // 统计元素出现次数

// Arrays工具类
int[] arr = {3, 1, 4, 1, 5, 9};
Arrays.sort(arr);  // 排序
Arrays.toString(arr);  // 数组转字符串
Arrays.fill(arr, 10);  // 填充数组
Arrays.copyOf(arr, 10);  // 复制数组
Arrays.binarySearch(arr, 5);  // 二分查找
```

## 二、泛型

### 2.1 泛型的概念

泛型是Java SE 5引入的特性，它允许在定义类、接口和方法时使用类型参数，实现代码的重用和类型安全。

### 2.2 泛型类和泛型接口

```java
// 泛型类
public class Box<T> {
    private T content;
    
    public void setContent(T content) {
        this.content = content;
    }
    
    public T getContent() {
        return content;
    }
}

// 使用泛型类
Box<String> stringBox = new Box<>();
stringBox.setContent("Hello, Generics!");
String content = stringBox.getContent();

Box<Integer> integerBox = new Box<>();
integerBox.setContent(100);
int value = integerBox.getContent();

// 泛型接口
public interface List<E> {
    void add(E element);
    E get(int index);
    // 其他方法
}
```

### 2.3 泛型方法

```java
public class GenericMethodDemo {
    // 泛型方法
    public static <T> void printArray(T[] array) {
        for (T element : array) {
            System.out.print(element + " ");
        }
        System.out.println();
    }
    
    // 带边界的泛型方法
    public static <T extends Number> double sum(T[] array) {
        double total = 0.0;
        for (T element : array) {
            total += element.doubleValue();
        }
        return total;
    }
}

// 使用泛型方法
Integer[] intArray = {1, 2, 3, 4, 5};
String[] stringArray = {"Java", "Python", "C++"};

GenericMethodDemo.printArray(intArray);  // 输出：1 2 3 4 5
GenericMethodDemo.printArray(stringArray);  // 输出：Java Python C++

Double[] doubleArray = {1.5, 2.5, 3.5};
double sum = GenericMethodDemo.sum(doubleArray);  // sum = 7.5
```

### 2.4 泛型通配符

- **?**：无界通配符，表示任意类型
- **? extends T**：上界通配符，表示T类型或其子类型
- **? super T**：下界通配符，表示T类型或其父类型

```java
// 无界通配符
public void printList(List<?> list) {
    for (Object element : list) {
        System.out.println(element);
    }
}

// 上界通配符
public double calculateAverage(List<? extends Number> numbers) {
    double sum = 0.0;
    for (Number number : numbers) {
        sum += number.doubleValue();
    }
    return sum / numbers.size();
}

// 下界通配符
public void addNumbers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
    list.add(3);
}
```

## 三、多线程编程

### 3.1 线程的创建和启动

- **继承Thread类**
- **实现Runnable接口**
- **实现Callable接口**

```java
// 继承Thread类
class MyThread extends Thread {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println("Thread-" + i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

// 实现Runnable接口
class MyRunnable implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println("Runnable-" + i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

// 实现Callable接口
class MyCallable implements Callable<Integer> {
    @Override
    public Integer call() throws Exception {
        int sum = 0;
        for (int i = 1; i <= 100; i++) {
            sum += i;
        }
        return sum;
    }
}

// 使用线程
public class ThreadDemo {
    public static void main(String[] args) throws Exception {
        // Thread方式
        MyThread thread = new MyThread();
        thread.start();
        
        // Runnable方式
        Thread runnableThread = new Thread(new MyRunnable());
        runnableThread.start();
        
        // Callable方式
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<Integer> future = executor.submit(new MyCallable());
        Integer result = future.get();  // 获取返回值
        System.out.println("Sum: " + result);
        executor.shutdown();
    }
}
```

### 3.2 线程同步

- **synchronized关键字**：同步方法或同步代码块
- **Lock接口**：提供更灵活的锁操作
- **volatile关键字**：保证变量的可见性

```java
// synchronized同步方法
public synchronized void synchronizedMethod() {
    // 同步代码
}

// synchronized同步代码块
public void methodWithSynchronizedBlock() {
    synchronized (this) {
        // 同步代码
    }
}

// Lock接口
Lock lock = new ReentrantLock();
try {
    lock.lock();
    // 同步代码
} finally {
    lock.unlock();  // 确保释放锁
}

// volatile关键字
private volatile boolean running = true;
```

### 3.3 线程池

线程池用于管理线程资源，提高线程的重用率，减少创建和销毁线程的开销。

```java
// 创建线程池
ExecutorService executor = Executors.newFixedThreadPool(5);

// 提交任务
for (int i = 0; i < 10; i++) {
    final int taskId = i;
    executor.submit(() -> {
        System.out.println("Task " + taskId + " executed by " + Thread.currentThread().getName());
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    });
}

// 关闭线程池
executor.shutdown();

// 等待线程池终止
try {
    executor.awaitTermination(1, TimeUnit.MINUTES);
} catch (InterruptedException e) {
    e.printStackTrace();
}
```

## 四、反射

### 4.1 反射的概念

反射是Java的一种机制，允许程序在运行时检查、访问和修改类、方法、字段等信息。

### 4.2 反射的核心类

- **Class**：表示类的实例
- **Method**：表示类的方法
- **Field**：表示类的字段
- **Constructor**：表示类的构造方法

### 4.3 反射的使用

```java
// 获取Class对象
Class<?> clazz1 = Class.forName("java.lang.String");
Class<?> clazz2 = String.class;
Class<?> clazz3 = "hello".getClass();

// 获取构造方法
Constructor<?>[] constructors = clazz1.getDeclaredConstructors();
Constructor<?> constructor = clazz1.getConstructor(String.class);

// 创建对象
Object instance = constructor.newInstance("反射创建的字符串");

// 获取方法
Method[] methods = clazz1.getDeclaredMethods();
Method lengthMethod = clazz1.getMethod("length");

// 调用方法
int length = (int) lengthMethod.invoke(instance);

// 获取字段
Field[] fields = clazz1.getDeclaredFields();
Field valueField = clazz1.getDeclaredField("value");
valueField.setAccessible(true);  // 访问私有字段

// 修改字段值
char[] value = (char[]) valueField.get(instance);
value[0] = 'H';
```

## 五、注解

### 5.1 注解的概念

注解（Annotation）是Java SE 5引入的一种元数据，可以添加到类、方法、字段等元素上，用于提供额外的信息。

### 5.2 内置注解

- **@Override**：标记方法重写了父类方法
- **@Deprecated**：标记方法已过时
- **@SuppressWarnings**：抑制警告
- **@SafeVarargs**：抑制可变参数相关的警告
- **@FunctionalInterface**：标记函数式接口

### 5.3 自定义注解

```java
// 定义自定义注解
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MyAnnotation {
    String value() default "默认值";
    int count() default 0;
}

// 使用自定义注解
public class AnnotationDemo {
    @MyAnnotation(value = "测试方法", count = 1)
    public void testMethod() {
        System.out.println("测试方法");
    }
    
    // 通过反射获取注解信息
    public static void main(String[] args) throws Exception {
        Class<?> clazz = AnnotationDemo.class;
        Method method = clazz.getMethod("testMethod");
        
        if (method.isAnnotationPresent(MyAnnotation.class)) {
            MyAnnotation annotation = method.getAnnotation(MyAnnotation.class);
            System.out.println("value: " + annotation.value());
            System.out.println("count: " + annotation.count());
        }
    }
}
```

## 六、IO流

### 6.1 IO流的分类

- **按流向分**：输入流、输出流
- **按操作数据分**：字节流、字符流
- **按功能分**：节点流、处理流

### 6.2 字节流

- **InputStream**：字节输入流基类
- **OutputStream**：字节输出流基类

```java
// 文件字节输入流
FileInputStream fis = null;
try {
    fis = new FileInputStream("input.txt");
    byte[] buffer = new byte[1024];
    int bytesRead;
    while ((bytesRead = fis.read(buffer)) != -1) {
        System.out.write(buffer, 0, bytesRead);
    }
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (fis != null) {
        try {
            fis.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

// 文件字节输出流
FileOutputStream fos = null;
try {
    fos = new FileOutputStream("output.txt");
    String content = "Hello, Java IO!";
    fos.write(content.getBytes());
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (fos != null) {
        try {
            fos.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 6.3 字符流

- **Reader**：字符输入流基类
- **Writer**：字符输出流基类

```java
// 文件字符输入流
FileReader reader = null;
try {
    reader = new FileReader("input.txt");
    char[] buffer = new char[1024];
    int charsRead;
    while ((charsRead = reader.read(buffer)) != -1) {
        System.out.print(new String(buffer, 0, charsRead));
    }
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (reader != null) {
        try {
            reader.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

// 文件字符输出流
FileWriter writer = null;
try {
    writer = new FileWriter("output.txt");
    String content = "Hello, Java字符流!";
    writer.write(content);
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (writer != null) {
        try {
            writer.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 6.4 缓冲流

缓冲流可以提高IO操作的效率，它们在内存中创建缓冲区，减少实际读写次数。

```java
// 缓冲字节流
BufferedInputStream bis = null;
BufferedOutputStream bos = null;
try {
    bis = new BufferedInputStream(new FileInputStream("input.txt"));
    bos = new BufferedOutputStream(new FileOutputStream("output.txt"));
    
    byte[] buffer = new byte[1024];
    int bytesRead;
    while ((bytesRead = bis.read(buffer)) != -1) {
        bos.write(buffer, 0, bytesRead);
    }
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (bos != null) bos.close();
    if (bis != null) bis.close();
}

// 缓冲字符流
BufferedReader br = null;
BufferedWriter bw = null;
try {
    br = new BufferedReader(new FileReader("input.txt"));
    bw = new BufferedWriter(new FileWriter("output.txt"));
    
    String line;
    while ((line = br.readLine()) != null) {
        bw.write(line);
        bw.newLine();
    }
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (bw != null) bw.close();
    if (br != null) br.close();
}
```

### 6.5 Java 7的try-with-resources

Java 7引入的try-with-resources语句可以自动关闭实现了AutoCloseable接口的资源。

```java
// 使用try-with-resources
try (BufferedReader br = new BufferedReader(new FileReader("input.txt"));
     BufferedWriter bw = new BufferedWriter(new FileWriter("output.txt"))) {
    
    String line;
    while ((line = br.readLine()) != null) {
        bw.write(line);
        bw.newLine();
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

## 七、NIO

### 7.1 NIO的概念

NIO（New IO）是Java SE 4引入的IO API，提供了非阻塞IO操作，支持缓冲区（Buffer）、通道（Channel）和选择器（Selector）等新特性。

### 7.2 Buffer

Buffer是一个容器，用于存储特定类型的数据。

```java
// Buffer的使用
ByteBuffer buffer = ByteBuffer.allocate(1024);

// 写入数据
buffer.put("Hello, NIO!".getBytes());

// 切换到读取模式
buffer.flip();

// 读取数据
byte[] bytes = new byte[buffer.remaining()];
buffer.get(bytes);
String content = new String(bytes);
System.out.println(content);

// 清空缓冲区（准备再次写入）
buffer.clear();
```

### 7.3 Channel

Channel是数据传输的通道，可以双向传输数据。

```java
// FileChannel的使用
try (FileChannel inChannel = new FileInputStream("input.txt").getChannel();
     FileChannel outChannel = new FileOutputStream("output.txt").getChannel()) {
    
    ByteBuffer buffer = ByteBuffer.allocate(1024);
    
    while (inChannel.read(buffer) != -1) {
        buffer.flip();  // 切换到读取模式
        outChannel.write(buffer);  // 写入目标通道
        buffer.clear();  // 清空缓冲区
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

### 7.4 Selector

Selector用于监视多个通道的事件，可以实现单线程管理多个连接。

```java
// Selector的基本使用
try {
    // 创建Selector
    Selector selector = Selector.open();
    
    // 创建ServerSocketChannel
    ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
    serverSocketChannel.bind(new InetSocketAddress(8080));
    serverSocketChannel.configureBlocking(false);
    
    // 注册感兴趣的事件
    serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
    
    while (true) {
        // 等待事件发生
        int readyChannels = selector.select();
        if (readyChannels == 0) continue;
        
        // 获取所有就绪的SelectionKey
        Set<SelectionKey> selectionKeys = selector.selectedKeys();
        Iterator<SelectionKey> iterator = selectionKeys.iterator();
        
        while (iterator.hasNext()) {
            SelectionKey key = iterator.next();
            
            if (key.isAcceptable()) {
                // 处理连接事件
                ServerSocketChannel serverChannel = (ServerSocketChannel) key.channel();
                SocketChannel clientChannel = serverChannel.accept();
                clientChannel.configureBlocking(false);
                clientChannel.register(selector, SelectionKey.OP_READ);
            } else if (key.isReadable()) {
                // 处理读事件
                SocketChannel clientChannel = (SocketChannel) key.channel();
                // 读取数据...
            }
            
            iterator.remove();
        }
    }
} catch (IOException e) {
    e.printStackTrace();
}
```

## 八、学习建议

1. **循序渐进**：高级特性需要在掌握基础的前提下学习
2. **理解原理**：不要只记住API，要理解背后的原理和设计思想
3. **多做练习**：通过实际项目应用这些高级特性
4. **关注性能**：了解各种特性的性能影响
5. **学习源码**：阅读JDK源码，了解标准库的实现方式

## 结语

本教程介绍了Java的高级特性，包括集合框架、泛型、多线程、反射、注解、IO流和NIO等。掌握这些特性对于编写高质量的Java程序至关重要。

Java是一门不断发展的语言，随着新版本的发布，还会有更多新特性出现。持续学习和实践是掌握Java编程的关键。祝你在Java学习之路上取得更大的进步！