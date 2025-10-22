---
title: Go语言项目实战：构建Web应用
description: 详细讲解如何使用Go语言构建现代化Web应用，包括项目结构设计、路由管理、数据库操作、中间件实现、前后端交互等核心内容，通过实际案例掌握Go Web开发全流程
slug: go-web-development-practical-guide
date: 2024-11-05T10:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["Go"]
---

# Go语言项目实战：构建Web应用

## 引言：Go语言与Web开发

Go语言凭借其卓越的性能、简洁的语法和强大的并发特性，已成为构建高性能Web应用的理想选择。从简单的API服务到复杂的微服务架构，Go都展现出了优异的表现。特别是其标准库中的`net/http`包，提供了构建Web服务的基础功能，配合丰富的第三方库，可以快速开发出稳定、高效的Web应用。

本文将带领你从零开始，使用Go语言构建一个完整的Web应用。我们将覆盖项目结构设计、路由管理、数据库交互、中间件实现、认证授权、前后端交互等核心内容，并通过一个实际的项目案例，让你掌握Go Web开发的全流程。

## 第一章：项目结构设计

### 1.1 Go项目标准结构

一个良好的项目结构对于代码的可维护性和扩展性至关重要。Go语言社区推荐的标准项目结构通常包括以下几个部分：

```
my-web-app/
├── cmd/
│   └── server/
│       └── main.go        # 应用入口
├── internal/
│   ├── handler/           # HTTP处理器
│   ├── middleware/        # 中间件
│   ├── model/             # 数据模型
│   ├── repository/        # 数据访问层
│   └── service/           # 业务逻辑层
├── pkg/                   # 可导出的包
├── web/                   # 前端资源
│   ├── static/            # 静态资源(CSS, JS, 图片等)
│   └── templates/         # 模板文件
├── config/                # 配置文件
├── scripts/               # 脚本文件
├── go.mod                 # Go模块定义
├── go.sum                 # 依赖校验
├── .env.example           # 环境变量示例
├── build.sh               # 构建脚本
└── README.md              # 项目说明
```

主要目录说明：
- **cmd/**：应用程序的入口点，包含main函数
- **internal/**：内部包，不对外暴露
  - **handler/**：HTTP请求处理函数
  - **middleware/**：HTTP中间件
  - **model/**：数据模型和结构体定义
  - **repository/**：数据库操作和数据访问
  - **service/**：业务逻辑层
- **pkg/**：可以被其他项目导入的公共包
- **web/**：前端相关资源
- **config/**：配置文件和配置处理

### 1.2 项目初始化与依赖管理

首先，我们需要初始化一个Go模块并设置依赖管理：

```bash
# 创建项目目录
mkdir -p my-web-app/{cmd/server,internal/{handler,middleware,model,repository,service},pkg,web/{static,templates},config}

# 进入项目目录
cd my-web-app

# 初始化Go模块
go mod init github.com/yourusername/my-web-app

# 添加常用依赖
go get github.com/gin-gonic/gin     # Web框架
go get github.com/jinzhu/gorm       # ORM框架
go get github.com/jinzhu/gorm/dialects/sqlite  # SQLite驱动
go get github.com/joho/godotenv     # 环境变量管理
go get github.com/golang-jwt/jwt/v4 # JWT认证
go get github.com/go-playground/validator/v10 # 数据验证
```

创建一个简单的main.go作为应用入口：

```go
// cmd/server/main.go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/yourusername/my-web-app/internal/handler"
	"github.com/yourusername/my-web-app/internal/middleware"
	"github.com/yourusername/my-web-app/internal/repository"
	"github.com/yourusername/my-web-app/internal/service"
)

func main() {
	// 加载环境变量
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// 初始化数据库连接
	db, err := repository.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 初始化存储库
	userRepo := repository.NewUserRepository(db)
	productRepo := repository.NewProductRepository(db)

	// 初始化服务
	userService := service.NewUserService(userRepo)
	productService := service.NewProductService(productRepo)

	// 初始化处理器
	userHandler := handler.NewUserHandler(userService)
	productHandler := handler.NewProductHandler(productService)

	// 设置Gin模式
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建Gin引擎
	router := gin.Default()

	// 添加中间件
	router.Use(middleware.Logger())
	router.Use(middleware.ErrorHandler())

	// 静态文件服务
	router.Static("/static", "./web/static")
	router.LoadHTMLGlob("./web/templates/**/*")

	// 路由设置
	api := router.Group("/api")
	{
		// 公开路由
		api.POST("/register", userHandler.Register)
		api.POST("/login", userHandler.Login)

		// 需要认证的路由
		protected := api.Group("/")
		protected.Use(middleware.Auth())
		{
			// 用户相关路由
			protected.GET("/users/me", userHandler.GetProfile)
			protected.PUT("/users/me", userHandler.UpdateProfile)

			// 产品相关路由
			protected.GET("/products", productHandler.List)
			protected.GET("/products/:id", productHandler.Get)
			protected.POST("/products", productHandler.Create)
			protected.PUT("/products/:id", productHandler.Update)
			protected.DELETE("/products/:id", productHandler.Delete)
		}
	}

	// 前端路由
	router.GET("/*any", func(c *gin.Context) {
		c.HTML(200, "index.html", gin.H{})
	})

	// 获取端口
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 启动服务器
	fmt.Printf("Server starting on port %s\n", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
```

### 1.3 配置管理

创建配置文件和配置处理模块：

1. **.env.example**：环境变量示例文件

```
# 数据库配置
DATABASE_URL="sqlite3://./data.db"

# 服务器配置
PORT=8080
GIN_MODE=debug

# JWT配置
JWT_SECRET="your-secret-key"
JWT_EXPIRY=24h

# 日志配置
LOG_LEVEL=info
```

2. **config/config.go**：配置处理模块

```go
// internal/config/config.go
package config

import (
	"os"
	"time"
)

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
	JWT      JWTConfig
	Log      LogConfig
}

type DatabaseConfig struct {
	URL string
}

type ServerConfig struct {
	Port    string
	GinMode string
}

type JWTConfig struct {
	Secret string
	Expiry time.Duration
}

type LogConfig struct {
	Level string
}

// LoadConfig 加载配置
func LoadConfig() *Config {
	jwtExpiry, _ := time.ParseDuration(getEnv("JWT_EXPIRY", "24h"))

	return &Config{
		Database: DatabaseConfig{
			URL: getEnv("DATABASE_URL", "sqlite3://./data.db"),
		},
		Server: ServerConfig{
			Port:    getEnv("PORT", "8080"),
			GinMode: getEnv("GIN_MODE", "debug"),
		},
		JWT: JWTConfig{
			Secret: getEnv("JWT_SECRET", "default-secret-key"),
			Expiry: jwtExpiry,
		},
		Log: LogConfig{
			Level: getEnv("LOG_LEVEL", "info"),
		},
	}
}

// getEnv 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
```

## 第二章：数据模型与数据库交互

### 2.1 定义数据模型

在Go中，我们通常使用结构体来定义数据模型。下面是用户和产品两个简单的数据模型：

```go
// internal/model/user.go
package model

import (
	"time"

	"github.com/jinzhu/gorm"
)

type User struct {
	ID        uint      `json:"id" gorm:"primary_key"`
	Username  string    `json:"username" gorm:"unique;not null"`
	Email     string    `json:"email" gorm:"unique;not null"`
	Password  string    `json:"-" gorm:"not null"` // 不序列化密码
	Name      string    `json:"name"`
	Role      string    `json:"role" gorm:"default:'user'"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// BeforeCreate GORM钩子，创建前自动设置时间
func (u *User) BeforeCreate(scope *gorm.Scope) error {
	scope.SetColumn("CreatedAt", time.Now())
	scope.SetColumn("UpdatedAt", time.Now())
	return nil
}

// BeforeUpdate GORM钩子，更新前自动设置时间
func (u *User) BeforeUpdate(scope *gorm.Scope) error {
	scope.SetColumn("UpdatedAt", time.Now())
	return nil
}

// internal/model/product.go
package model

import (
	"time"

	"github.com/jinzhu/gorm"
)

type Product struct {
	ID          uint      `json:"id" gorm:"primary_key"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	Price       float64   `json:"price" gorm:"not null"`
	SKU         string    `json:"sku" gorm:"unique"`
	Stock       int       `json:"stock" gorm:"default:0"`
	Category    string    `json:"category"`
	ImageURL    string    `json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName 指定表名
func (Product) TableName() string {
	return "products"
}

// BeforeCreate GORM钩子
func (p *Product) BeforeCreate(scope *gorm.Scope) error {
	scope.SetColumn("CreatedAt", time.Now())
	scope.SetColumn("UpdatedAt", time.Now())
	return nil
}

// BeforeUpdate GORM钩子
func (p *Product) BeforeUpdate(scope *gorm.Scope) error {
	scope.SetColumn("UpdatedAt", time.Now())
	return nil
}
```

### 2.2 数据库连接与迁移

接下来，我们需要设置数据库连接和自动迁移功能：

```go
// internal/repository/db.go
package repository

import (
	"log"
	"os"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
	"github.com/yourusername/my-web-app/internal/model"
)

var DB *gorm.DB

// InitDB 初始化数据库连接
func InitDB() (*gorm.DB, error) {
	// 获取数据库URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "./data.db" // 默认使用SQLite
	} else {
		// 如果是sqlite3://格式的URL，提取路径部分
		if len(dbURL) > 9 && dbURL[:9] == "sqlite3://" {
			dbURL = dbURL[9:]
		}
	}

	// 连接数据库
	db, err := gorm.Open("sqlite3", dbURL)
	if err != nil {
		return nil, err
	}

	// 设置连接池参数
	db.DB().SetMaxIdleConns(10)
	db.DB().SetMaxOpenConns(100)

	// 启用日志
	if os.Getenv("GIN_MODE") != "release" {
		db.LogMode(true)
	}

	// 自动迁移
	if err := migrateDB(db); err != nil {
		return nil, err
	}

	DB = db
	return db, nil
}

// migrateDB 执行数据库迁移
func migrateDB(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// 自动迁移表结构
	if err := db.AutoMigrate(
		&model.User{},
		&model.Product{},
	).Error; err != nil {
		return err
	}

	// 创建默认管理员用户
	createDefaultAdmin(db)

	log.Println("Database migrations completed successfully")
	return nil
}

// createDefaultAdmin 创建默认管理员用户
func createDefaultAdmin(db *gorm.DB) {
	var count int
	db.Model(&model.User{}).Where("role = ?", "admin").Count(&count)

	if count == 0 {
		admin := model.User{
			Username: "admin",
			Email:    "admin@example.com",
			Password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // password: admin123
			Name:     "Administrator",
			Role:     "admin",
		}

		db.Create(&admin)
		log.Println("Default admin user created")
	}
}
```

### 2.3 数据访问层（Repository）

实现用户和产品的数据访问层：

```go
// internal/repository/user_repository.go
package repository

import (
	"github.com/jinzhu/gorm"
	"github.com/yourusername/my-web-app/internal/model"
)

type UserRepository interface {
	Create(user *model.User) error
	FindByID(id uint) (*model.User, error)
	FindByUsername(username string) (*model.User, error)
	FindByEmail(email string) (*model.User, error)
	Update(user *model.User) error
	Delete(id uint) error
	List(page, pageSize int) ([]model.User, int64, error)
}

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository 创建用户存储库
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) FindByID(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByUsername(username string) (*model.User, error) {
	var user model.User
	err := r.db.Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) FindByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) Update(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) Delete(id uint) error {
	return r.db.Delete(&model.User{}, id).Error
}

func (r *userRepository) List(page, pageSize int) ([]model.User, int64, error) {
	var users []model.User
	var count int64

	// 计算总数
	if err := r.db.Model(&model.User{}).Count(&count).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := r.db.Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, count, nil
}

// internal/repository/product_repository.go
package repository

import (
	"github.com/jinzhu/gorm"
	"github.com/yourusername/my-web-app/internal/model"
)

type ProductRepository interface {
	Create(product *model.Product) error
	FindByID(id uint) (*model.Product, error)
	FindBySKU(sku string) (*model.Product, error)
	Update(product *model.Product) error
	Delete(id uint) error
	List(page, pageSize int, category string) ([]model.Product, int64, error)
	Search(query string, page, pageSize int) ([]model.Product, int64, error)
}

type productRepository struct {
	db *gorm.DB
}

// NewProductRepository 创建产品存储库
func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (r *productRepository) Create(product *model.Product) error {
	return r.db.Create(product).Error
}

func (r *productRepository) FindByID(id uint) (*model.Product, error) {
	var product model.Product
	err := r.db.First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) FindBySKU(sku string) (*model.Product, error) {
	var product model.Product
	err := r.db.Where("sku = ?", sku).First(&product).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) Update(product *model.Product) error {
	return r.db.Save(product).Error
}

func (r *productRepository) Delete(id uint) error {
	return r.db.Delete(&model.Product{}, id).Error
}

func (r *productRepository) List(page, pageSize int, category string) ([]model.Product, int64, error) {
	var products []model.Product
	var count int64

	query := r.db.Model(&model.Product{})
	if category != "" {
		query = query.Where("category = ?", category)
	}

	// 计算总数
	if err := query.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Find(&products).Error; err != nil {
		return nil, 0, err
	}

	return products, count, nil
}

func (r *productRepository) Search(query string, page, pageSize int) ([]model.Product, int64, error) {
	var products []model.Product
	var count int64

	searchQuery := r.db.Model(&model.Product{}).Where(
		"name LIKE ? OR description LIKE ? OR sku LIKE ?",
		"%"+query+"%",
		"%"+query+"%",
		"%"+query+"%",
	)

	// 计算总数
	if err := searchQuery.Count(&count).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := searchQuery.Offset(offset).Limit(pageSize).Find(&products).Error; err != nil {
		return nil, 0, err
	}

	return products, count, nil
}
```

## 第三章：业务逻辑层（Service）

### 3.1 用户服务

实现用户相关的业务逻辑，包括注册、登录、获取用户信息等功能：

```go
// internal/service/user_service.go
package service

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/jinzhu/gorm"
	"github.com/yourusername/my-web-app/internal/model"
	"github.com/yourusername/my-web-app/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(username, email, password, name string) (*model.User, error)
	Login(username, password string) (string, *model.User, error)
	GetUserByID(id uint) (*model.User, error)
	UpdateUser(user *model.User) error
	ChangePassword(userID uint, oldPassword, newPassword string) error
	GenerateToken(user *model.User) (string, error)
}

type userService struct {
	userRepo repository.UserRepository
}

// NewUserService 创建用户服务
func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

// Register 用户注册
func (s *userService) Register(username, email, password, name string) (*model.User, error) {
	// 检查用户名是否已存在
	existingUser, _ := s.userRepo.FindByUsername(username)
	if existingUser != nil {
		return nil, errors.New("用户名已存在")
	}

	// 检查邮箱是否已存在
	existingEmail, _ := s.userRepo.FindByEmail(email)
	if existingEmail != nil {
		return nil, errors.New("邮箱已被注册")
	}

	// 哈希密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 创建用户
	user := &model.User{
		Username: username,
		Email:    email,
		Password: string(hashedPassword),
		Name:     name,
		Role:     "user",
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

// Login 用户登录
func (s *userService) Login(username, password string) (string, *model.User, error) {
	// 查找用户
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", nil, errors.New("用户名或密码错误")
		}
		return "", nil, err
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", nil, errors.New("用户名或密码错误")
	}

	// 生成JWT令牌
	token, err := s.GenerateToken(user)
	if err != nil {
		return "", nil, err
	}

	return token, user, nil
}

// GetUserByID 根据ID获取用户
func (s *userService) GetUserByID(id uint) (*model.User, error) {
	return s.userRepo.FindByID(id)
}

// UpdateUser 更新用户信息
func (s *userService) UpdateUser(user *model.User) error {
	// 检查用户是否存在
	existingUser, err := s.userRepo.FindByID(user.ID)
	if err != nil {
		return err
	}

	// 检查用户名是否被其他用户使用
	if existingUser.Username != user.Username {
		usernameUser, _ := s.userRepo.FindByUsername(user.Username)
		if usernameUser != nil && usernameUser.ID != user.ID {
			return errors.New("用户名已被使用")
		}
	}

	// 检查邮箱是否被其他用户使用
	if existingUser.Email != user.Email {
		emailUser, _ := s.userRepo.FindByEmail(user.Email)
		if emailUser != nil && emailUser.ID != user.ID {
			return errors.New("邮箱已被使用")
		}
	}

	// 保留密码和角色不被更新
	user.Password = existingUser.Password
	user.Role = existingUser.Role

	return s.userRepo.Update(user)
}

// ChangePassword 修改密码
func (s *userService) ChangePassword(userID uint, oldPassword, newPassword string) error {
	// 获取用户
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return err
	}

	// 验证旧密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		return errors.New("旧密码错误")
	}

	// 哈希新密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	// 更新密码
	user.Password = string(hashedPassword)
	return s.userRepo.Update(user)
}

// GenerateToken 生成JWT令牌
func (s *userService) GenerateToken(user *model.User) (string, error) {
	// 定义JWT声明
	claims := jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"role":     user.Role,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // 24小时过期
		"iat":      time.Now().Unix(),
	}

	// 创建令牌
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 使用密钥签名令牌
	tokenString, err := token.SignedString([]byte("your-secret-key"))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}
```

### 3.2 产品服务

实现产品相关的业务逻辑：

```go
// internal/service/product_service.go
package service

import (
	"errors"

	"github.com/jinzhu/gorm"
	"github.com/yourusername/my-web-app/internal/model"
	"github.com/yourusername/my-web-app/internal/repository"
)

type ProductService interface {
	Create(product *model.Product) error
	GetProductByID(id uint) (*model.Product, error)
	UpdateProduct(product *model.Product) error
	DeleteProduct(id uint) error
	ListProducts(page, pageSize int, category string) ([]model.Product, int64, error)
	SearchProducts(query string, page, pageSize int) ([]model.Product, int64, error)
	UpdateStock(id uint, quantity int) error
}

type productService struct {
	productRepo repository.ProductRepository
}

// NewProductService 创建产品服务
func NewProductService(productRepo repository.ProductRepository) ProductService {
	return &productService{productRepo: productRepo}
}

// Create 创建产品
func (s *productService) Create(product *model.Product) error {
	// 检查SKU是否已存在
	if product.SKU != "" {
		existingProduct, _ := s.productRepo.FindBySKU(product.SKU)
		if existingProduct != nil {
			return errors.New("SKU已存在")
		}
	}

	return s.productRepo.Create(product)
}

// GetProductByID 根据ID获取产品
func (s *productService) GetProductByID(id uint) (*model.Product, error) {
	product, err := s.productRepo.FindByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("产品不存在")
		}
		return nil, err
	}
	return product, nil
}

// UpdateProduct 更新产品
func (s *productService) UpdateProduct(product *model.Product) error {
	// 检查产品是否存在
	existingProduct, err := s.productRepo.FindByID(product.ID)
	if err != nil {
		return err
	}

	// 检查SKU是否被其他产品使用
	if existingProduct.SKU != product.SKU && product.SKU != "" {
		skuProduct, _ := s.productRepo.FindBySKU(product.SKU)
		if skuProduct != nil && skuProduct.ID != product.ID {
			return errors.New("SKU已被使用")
		}
	}

	return s.productRepo.Update(product)
}

// DeleteProduct 删除产品
func (s *productService) DeleteProduct(id uint) error {
	// 检查产品是否存在
	_, err := s.productRepo.FindByID(id)
	if err != nil {
		return err
	}

	return s.productRepo.Delete(id)
}

// ListProducts 列出产品
func (s *productService) ListProducts(page, pageSize int, category string) ([]model.Product, int64, error) {
	// 设置默认值
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10
	}

	return s.productRepo.List(page, pageSize, category)
}

// SearchProducts 搜索产品
func (s *productService) SearchProducts(query string, page, pageSize int) ([]model.Product, int64, error) {
	// 设置默认值
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10
	}

	return s.productRepo.Search(query, page, pageSize)
}

// UpdateStock 更新库存
func (s *productService) UpdateStock(id uint, quantity int) error {
	product, err := s.productRepo.FindByID(id)
	if err != nil {
		return err
	}

	// 更新库存
	product.Stock += quantity
	if product.Stock < 0 {
		return errors.New("库存不足")
	}

	return s.productRepo.Update(product)
}
```

## 第四章：HTTP处理器与路由

### 4.1 HTTP中间件

实现常用的HTTP中间件，如日志记录、错误处理、认证等：

```go
// internal/middleware/logger.go
package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger 日志中间件
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 开始时间
		startTime := time.Now()

		// 处理请求
		c.Next()

		// 结束时间
		endTime := time.Now()

		// 执行时间
		latency := endTime.Sub(startTime)

		// 请求方法
		method := c.Request.Method

		// 请求路由
		path := c.Request.URL.Path

		// 状态码
		statusCode := c.Writer.Status()

		// 客户端IP
		clientIP := c.ClientIP()

		// 日志格式
		log.Printf("%s | %3d | %13v | %15s | %s | %s",
			endTime.Format("2006/01/02 - 15:04:05"),
			statusCode,
			latency,
			clientIP,
			method,
			path,
		)
	}
}

// internal/middleware/error_handler.go
package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorResponse 错误响应结构
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}

// ErrorHandler 错误处理中间件
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// 处理所有错误
		for _, err := range c.Errors {
			// 根据错误类型设置状态码
			statusCode := http.StatusInternalServerError

			// 可以根据不同的错误类型设置不同的状态码
			if _, ok := err.Err.(ValidationError); ok {
				statusCode = http.StatusBadRequest
			} else if _, ok := err.Err.(NotFoundError); ok {
				statusCode = http.StatusNotFound
			} else if _, ok := err.Err.(UnauthorizedError); ok {
				statusCode = http.StatusUnauthorized
			}

			// 返回错误响应
			c.JSON(statusCode, ErrorResponse{
				Error:   err.Err.Error(),
				Message: err.Error(),
			})
			return
		}
	}
}

// 自定义错误类型
type ValidationError struct { Error string }
func (e ValidationError) Error() string { return e.Error }

type NotFoundError struct { Error string }
func (e NotFoundError) Error() string { return e.Error }

type UnauthorizedError struct { Error string }
func (e UnauthorizedError) Error() string { return e.Error }

// internal/middleware/auth.go
package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// Auth 认证中间件
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从请求头获取令牌
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error: "未提供认证令牌",
			})
			c.Abort()
			return
		}

		// 检查认证头格式
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error: "认证格式无效",
			})
			c.Abort()
			return
		}

		// 解析令牌
		tokenString := parts[1]
		claims := &jwt.MapClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// 验证签名算法
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("无效的签名方法")
			}
			return []byte("your-secret-key"), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error: "无效的认证令牌",
			})
			c.Abort()
			return
		}

		// 将用户信息存储到上下文中
		userID := uint((*claims)["id"].(float64))
		username := (*claims)["username"].(string)
		email := (*claims)["email"].(string)
		role := (*claims)["role"].(string)

		c.Set("userID", userID)
		c.Set("username", username)
		c.Set("email", email)
		c.Set("role", role)

		c.Next()
	}
}

// AdminAuth 管理员权限中间件
func AdminAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 确保Auth中间件已执行
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, ErrorResponse{
				Error: "未认证",
			})
			c.Abort()
			return
		}

		// 检查是否为管理员
		if role != "admin" {
			c.JSON(http.StatusForbidden, ErrorResponse{
				Error: "权限不足，需要管理员权限",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
```

### 4.2 用户处理器

实现用户相关的HTTP请求处理器：

```go
// internal/handler/user_handler.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/my-web-app/internal/middleware"
	"github.com/yourusername/my-web-app/internal/model"
	"github.com/yourusername/my-web-app/internal/service"
)

type UserHandler struct {
	userService service.UserService
}

// NewUserHandler 创建用户处理器
func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

// RegisterRequest 注册请求结构
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required"`
}

// Register 用户注册
func (h *UserHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "请求数据无效",
			Message: err.Error(),
		})
		return
	}

	user, err := h.userService.Register(req.Username, req.Email, req.Password, req.Name)
	if err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "注册成功",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"name":     user.Name,
			"role":     user.Role,
		},
	})
}

// LoginRequest 登录请求结构
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login 用户登录
func (h *UserHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "请求数据无效",
		})
		return
	}

	token, user, err := h.userService.Login(req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "登录成功",
		"token":   token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"name":     user.Name,
			"role":     user.Role,
		},
	})
}

// GetProfile 获取用户资料
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, middleware.ErrorResponse{
			Error: "用户不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        user.ID,
			"username":  user.Username,
			"email":     user.Email,
			"name":      user.Name,
			"role":      user.Role,
			"created_at": user.CreatedAt,
			"updated_at": user.UpdatedAt,
		},
	})
}

// UpdateProfileRequest 更新资料请求结构
type UpdateProfileRequest struct {
	Username string `json:"username" binding:"omitempty,min=3,max=50"`
	Email    string `json:"email" binding:"omitempty,email"`
	Name     string `json:"name" binding:"omitempty"`
}

// UpdateProfile 更新用户资料
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "请求数据无效",
		})
		return
	}

	// 获取现有用户
	user, err := h.userService.GetUserByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, middleware.ErrorResponse{
			Error: "用户不存在",
		})
		return
	}

	// 更新字段
	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Name != "" {
		user.Name = req.Name
	}

	if err := h.userService.UpdateUser(user); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "资料更新成功",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"name":     user.Name,
			"role":     user.Role,
		},
	})
}

// ChangePasswordRequest 修改密码请求结构
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}

// ChangePassword 修改密码
func (h *UserHandler) ChangePassword(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "请求数据无效",
		})
		return
	}

	if err := h.userService.ChangePassword(userID.(uint), req.OldPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "密码修改成功",
	})
}

// GetUserByID 根据ID获取用户（管理员功能）
func (h *UserHandler) GetUserByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "无效的用户ID",
		})
		return
	}

	user, err := h.userService.GetUserByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, middleware.ErrorResponse{
			Error: "用户不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}
```

### 4.3 产品处理器

实现产品相关的HTTP请求处理器：

```go
// internal/handler/product_handler.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/yourusername/my-web-app/internal/middleware"
	"github.com/yourusername/my-web-app/internal/model"
	"github.com/yourusername/my-web-app/internal/service"
)

type ProductHandler struct {
	productService service.ProductService
}

// NewProductHandler 创建产品处理器
func NewProductHandler(productService service.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

// CreateProductRequest 创建产品请求结构
type CreateProductRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"required,gt=0"`
	SKU         string  `json:"sku"`
	Stock       int     `json:"stock" binding:"gte=0"`
	Category    string  `json:"category"`
	ImageURL    string  `json:"image_url"`
}

// Create 创建产品
func (h *ProductHandler) Create(c *gin.Context) {
	// 检查权限
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, middleware.ErrorResponse{
			Error: "权限不足",
		})
		return
	}

	var req CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "请求数据无效",
		})
		return
	}

	product := &model.Product{
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		SKU:         req.SKU,
		Stock:       req.Stock,
		Category:    req.Category,
		ImageURL:    req.ImageURL,
	}

	if err := h.productService.Create(product); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "产品创建成功",
		"product": product,
	})
}

// Get 获取单个产品
func (h *ProductHandler) Get(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "无效的产品ID",
		})
		return
	}

	product, err := h.productService.GetProductByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"product": product,
	})
}

// UpdateProductRequest 更新产品请求结构
type UpdateProductRequest struct {
	Name        string  `json:"name" binding:"omitempty"`
	Description string  `json:"description"`
	Price       float64 `json:"price" binding:"omitempty,gt=0"`
	SKU         string  `json:"sku"`
	Stock       int     `json:"stock" binding:"omitempty,gte=0"`
	Category    string  `json:"category"`
	ImageURL    string  `json:"image_url"`
}

// Update 更新产品
func (h *ProductHandler) Update(c *gin.Context) {
	// 检查权限
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, middleware.ErrorResponse{
			Error: "权限不足",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "无效的产品ID",
		})
		return
	}

	var req UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "请求数据无效",
		})
		return
	}

	// 获取现有产品
	product, err := h.productService.GetProductByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	// 更新字段
	if req.Name != "" {
		product.Name = req.Name
	}
	product.Description = req.Description
	if req.Price > 0 {
		product.Price = req.Price
	}
	if req.SKU != "" {
		product.SKU = req.SKU
	}
	if req.Stock >= 0 {
		product.Stock = req.Stock
	}
	product.Category = req.Category
	product.ImageURL = req.ImageURL

	if err := h.productService.UpdateProduct(product); err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "产品更新成功",
		"product": product,
	})
}

// Delete 删除产品
func (h *ProductHandler) Delete(c *gin.Context) {
	// 检查权限
	role, _ := c.Get("role")
	if role != "admin" {
		c.JSON(http.StatusForbidden, middleware.ErrorResponse{
			Error: "权限不足",
		})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "无效的产品ID",
		})
		return
	}

	if err := h.productService.DeleteProduct(uint(id)); err != nil {
		c.JSON(http.StatusNotFound, middleware.ErrorResponse{
			Error: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "产品删除成功",
	})
}

// List 列出产品
func (h *ProductHandler) List(c *gin.Context) {
	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	category := c.Query("category")

	products, total, err := h.productService.ListProducts(page, pageSize, category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, middleware.ErrorResponse{
			Error: "获取产品列表失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"pagination": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

// Search 搜索产品
func (h *ProductHandler) Search(c *gin.Context) {
	// 获取查询参数
	query := c.Query("q")
	if query == "" {
		c.JSON(http.StatusBadRequest, middleware.ErrorResponse{
			Error: "搜索关键词不能为空",
		})
		return
	}

	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	products, total, err := h.productService.SearchProducts(query, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, middleware.ErrorResponse{
			Error: "搜索产品失败",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"products": products,
		"query":    query,
		"pagination": gin.H{
			"total":     total,
			"page":      page,
			"page_size": pageSize,
			"pages":     (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}
```

## 第五章：前端集成与部署

### 5.1 前端模板

为我们的Web应用创建一个简单的HTML模板：

```html
<!-- web/templates/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Go Web应用</title>
    <!-- 引入Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- 引入自定义样式 -->
    <link href="/static/css/main.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="/">Go Web应用</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="/">首页</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/products">产品列表</a>
                    </li>
                </ul>
                <div id="auth-controls">
                    <a href="/login" class="btn btn-outline-light me-2">登录</a>
                    <a href="/register" class="btn btn-primary">注册</a>
                </div>
                <div id="user-controls" class="d-none">
                    <span id="username" class="text-light me-3"></span>
                    <a href="/profile" class="btn btn-outline-light me-2">个人中心</a>
                    <button id="logout" class="btn btn-danger">退出登录</button>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div id="content">
            <!-- 内容将通过JavaScript动态加载 -->
            <div class="jumbotron">
                <h1 class="display-4">欢迎使用Go Web应用</h1>
                <p class="lead">这是一个使用Go语言开发的现代化Web应用框架。</p>
                <hr class="my-4">
                <p>点击下方按钮开始探索。</p>
                <a class="btn btn-primary btn-lg" href="/products" role="button">查看产品</a>
            </div>
        </div>
    </div>

    <!-- 引入jQuery -->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!-- 引入Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <!-- 引入自定义JS -->
    <script src="/static/js/main.js"></script>
</body>
</html>
```

### 5.2 静态资源

创建一些必要的静态资源文件：

1. **CSS文件**：

```css
/* web/static/css/main.css */
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    padding-top: 56px;
}

.product-card {
    margin-bottom: 20px;
    transition: transform 0.2s;
}

.product-card:hover {
    transform: translateY(-5px);
}

.product-image {
    height: 200px;
    object-fit: cover;
}

.card-body {
    display: flex;
    flex-direction: column;
}

.card-title {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
}

.card-text {
    flex-grow: 1;
}

.price {
    font-size: 1.2rem;
    font-weight: bold;
    color: #dc3545;
}

.spinner {
    display: none;
    margin: 20px auto;
    width: 50px;
    height: 50px;
}

.alert {
    margin-top: 20px;
}
```

2. **JavaScript文件**：

```javascript
// web/static/js/main.js

// API基础URL
const API_BASE_URL = '/api';

// 存储token
function setToken(token) {
    localStorage.setItem('token', token);
}

function getToken() {
    return localStorage.getItem('token');
}

function removeToken() {
    localStorage.removeItem('token');
}

// 检查登录状态
function checkAuth() {
    const token = getToken();
    if (token) {
        // 验证token并更新UI
        $.ajax({
            url: API_BASE_URL + '/users/me',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            success: function(response) {
                // 更新UI为登录状态
                $('#auth-controls').addClass('d-none');
                $('#user-controls').removeClass('d-none');
                $('#username').text(response.user.name);
            },
            error: function() {
                // Token无效，清除并更新UI
                removeToken();
                updateAuthUI();
            }
        });
    } else {
        updateAuthUI();
    }
}

// 更新认证UI
function updateAuthUI() {
    if (getToken()) {
        $('#auth-controls').addClass('d-none');
        $('#user-controls').removeClass('d-none');
    } else {
        $('#auth-controls').removeClass('d-none');
        $('#user-controls').addClass('d-none');
    }
}

// 退出登录
function logout() {
    removeToken();
    updateAuthUI();
    showMessage('成功退出登录', 'success');
    navigateTo('/');
}

// 显示消息
function showMessage(message, type = 'info') {
    const alertTypes = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    };
    
    const alertType = alertTypes[type] || alertTypes.info;
    
    const alertHtml = `
        <div class="alert ${alertType} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    $('#content').prepend(alertHtml);
    
    // 3秒后自动关闭
    setTimeout(() => {
        $('.alert').alert('close');
    }, 3000);
}

// 显示加载状态
function showLoading() {
    $('#content').append('<div class="spinner"><div class="spinner-border" role="status"><span class="visually-hidden">加载中...</span></div></div>');
    $('.spinner').show();
}

// 隐藏加载状态
function hideLoading() {
    $('.spinner').hide().remove();
}

// 页面导航
function navigateTo(path) {
    window.location.href = path;
}

// 获取URL参数
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// API请求封装
function apiRequest(endpoint, method, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            url: API_BASE_URL + endpoint,
            method: method,
            contentType: 'application/json',
            success: function(response) {
                resolve(response);
            },
            error: function(xhr) {
                let errorMessage = '操作失败';
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // 无法解析错误响应
                }
                reject(new Error(errorMessage));
            }
        };

        // 添加token（如果存在）
        const token = getToken();
        if (token) {
            options.headers = {
                'Authorization': 'Bearer ' + token
            };
        }

        // 添加数据（如果提供）
        if (data !== null) {
            options.data = JSON.stringify(data);
        }

        $.ajax(options);
    });
}

// 页面加载完成后执行
$(document).ready(function() {
    // 检查认证状态
    checkAuth();
    
    // 绑定退出登录事件
    $('#logout').on('click', logout);
    
    // 根据当前路径加载对应的视图
    const path = window.location.pathname;
    if (path === '/products' || path.startsWith('/products/')) {
        loadProductsView();
    } else if (path === '/login') {
        loadLoginView();
    } else if (path === '/register') {
        loadRegisterView();
    } else if (path === '/profile') {
        loadProfileView();
    }
});

// 加载产品列表视图
async function loadProductsView() {
    showLoading();
    try {
        const page = getUrlParam('page') || 1;
        const category = getUrlParam('category') || '';
        const response = await apiRequest(`/products?page=${page}&category=${category}`, 'GET');
        
        let content = `
            <h1 class="mb-4">产品列表</h1>
            <div class="row">
        `;
        
        response.products.forEach(product => {
            content += `
                <div class="col-md-4">
                    <div class="card product-card">
                        <img src="${product.image_url || '/static/images/placeholder.jpg'}" 
                             class="card-img-top product-image" 
                             alt="${product.name}">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">${product.description.substring(0, 100)}...</p>
                            <div class="mt-auto">
                                <p class="price">¥${product.price.toFixed(2)}</p>
                                <button class="btn btn-primary view-product" data-id="${product.id}">查看详情</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        content += `</div>`;
        
        // 添加分页
        content += `
            <div class="mt-4">
                <nav aria-label="Page navigation">
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${response.pagination.page === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="?page=${response.pagination.page - 1}" aria-label="Previous">
                                <span aria-hidden="true">&laquo;</span>
                            </a>
                        </li>
        `;
        
        for (let i = 1; i <= response.pagination.pages; i++) {
            content += `
                <li class="page-item ${i === response.pagination.page ? 'active' : ''}">
                    <a class="page-link" href="?page=${i}">${i}</a>
                </li>
            `;
        }
        
        content += `
                        <li class="page-item ${response.pagination.page === response.pagination.pages ? 'disabled' : ''}">
                            <a class="page-link" href="?page=${response.pagination.page + 1}" aria-label="Next">
                                <span aria-hidden="true">&raquo;</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        `;
        
        $('#content').html(content);
        
        // 绑定查看详情按钮事件
        $('.view-product').on('click', function() {
            const productId = $(this).data('id');
            navigateTo(`/products/${productId}`);
        });
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// 加载登录视图
function loadLoginView() {
    const content = `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h2 class="text-center">用户登录</h2>
                    </div>
                    <div class="card-body">
                        <form id="login-form">
                            <div class="mb-3">
                                <label for="username" class="form-label">用户名</label>
                                <input type="text" class="form-control" id="username" name="username" required>
                            </div>
                            <div class="mb-3">
                                <label for="password" class="form-label">密码</label>
                                <input type="password" class="form-control" id="password" name="password" required>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-block">登录</button>
                            </div>
                        </form>
                    </div>
                    <div class="card-footer text-center">
                        <p>还没有账号？ <a href="/register">立即注册</a></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#content').html(content);
    
    // 绑定表单提交事件
    $('#login-form').on('submit', async function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        
        try {
            const response = await apiRequest('/login', 'POST', { username, password });
            setToken(response.token);
            checkAuth();
            showMessage('登录成功', 'success');
            navigateTo('/');
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
}

// 加载注册视图
function loadRegisterView() {
    const content = `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h2 class="text-center">用户注册</h2>
                    </div>
                    <div class="card-body">
                        <form id="register-form">
                            <div class="mb-3">
                                <label for="reg-username" class="form-label">用户名</label>
                                <input type="text" class="form-control" id="reg-username" name="username" required minlength="3" maxlength="50">
                            </div>
                            <div class="mb-3">
                                <label for="reg-email" class="form-label">邮箱</label>
                                <input type="email" class="form-control" id="reg-email" name="email" required>
                            </div>
                            <div class="mb-3">
                                <label for="reg-name" class="form-label">姓名</label>
                                <input type="text" class="form-control" id="reg-name" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label for="reg-password" class="form-label">密码</label>
                                <input type="password" class="form-control" id="reg-password" name="password" required minlength="6">
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary btn-block">注册</button>
                            </div>
                        </form>
                    </div>
                    <div class="card-footer text-center">
                        <p>已有账号？ <a href="/login">立即登录</a></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#content').html(content);
    
    // 绑定表单提交事件
    $('#register-form').on('submit', async function(e) {
        e.preventDefault();
        
        const username = $('#reg-username').val();
        const email = $('#reg-email').val();
        const name = $('#reg-name').val();
        const password = $('#reg-password').val();
        
        try {
            await apiRequest('/register', 'POST', { username, email, password, name });
            showMessage('注册成功，请登录', 'success');
            navigateTo('/login');
        } catch (error) {
            showMessage(error.message, 'error');
        }
    });
}

// 加载个人资料视图
async function loadProfileView() {
    if (!getToken()) {
        navigateTo('/login');
        return;
    }
    
    showLoading();
    try {
        const response = await apiRequest('/users/me', 'GET');
        const user = response.user;
        
        const content = `
            <h1 class="mb-4">个人资料</h1>
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">账号信息</h5>
                    <p class="card-text"><strong>ID:</strong> ${user.id}</p>
                    <p class="card-text"><strong>用户名:</strong> ${user.username}</p>
                    <p class="card-text"><strong>邮箱:</strong> ${user.email}</p>
                    <p class="card-text"><strong>姓名:</strong> ${user.name}</p>
                    <p class="card-text"><strong>角色:</strong> ${user.role}</p>
                    <p class="card-text"><strong>注册时间:</strong> ${new Date(user.created_at).toLocaleString()}</p>
                    <p class="card-text"><strong>更新时间:</strong> ${new Date(user.updated_at).toLocaleString()}</p>
                    
                    <div class="mt-4">
                        <button id="edit-profile" class="btn btn-primary me-2">编辑资料</button>
                        <button id="change-password" class="btn btn-secondary">修改密码</button>
                    </div>
                </div>
            </div>
            
            <!-- 编辑资料模态框 -->
            <div class="modal fade" id="edit-profile-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">编辑个人资料</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-profile-form">
                                <div class="mb-3">
                                    <label for="edit-username" class="form-label">用户名</label>
                                    <input type="text" class="form-control" id="edit-username" name="username" value="${user.username}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-email" class="form-label">邮箱</label>
                                    <input type="email" class="form-control" id="edit-email" name="email" value="${user.email}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="edit-name" class="form-label">姓名</label>
                                    <input type="text" class="form-control" id="edit-name" name="name" value="${user.name}" required>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="submit" form="edit-profile-form" class="btn btn-primary">保存</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 修改密码模态框 -->
            <div class="modal fade" id="change-password-modal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">修改密码</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="change-password-form">
                                <div class="mb-3">
                                    <label for="old-password" class="form-label">旧密码</label>
                                    <input type="password" class="form-control" id="old-password" name="old_password" required>
                                </div>
                                <div class="mb-3">
                                    <label for="new-password" class="form-label">新密码</label>
                                    <input type="password" class="form-control" id="new-password" name="new_password" required minlength="6">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
                            <button type="submit" form="change-password-form" class="btn btn-primary">修改</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('#content').html(content);
        
        // 绑定编辑资料按钮事件
        $('#edit-profile').on('click', function() {
            const editProfileModal = new bootstrap.Modal(document.getElementById('edit-profile-modal'));
            editProfileModal.show();
        });
        
        // 绑定修改密码按钮事件
        $('#change-password').on('click', function() {
            const changePasswordModal = new bootstrap.Modal(document.getElementById('change-password-modal'));
            changePasswordModal.show();
        });
        
        // 绑定编辑资料表单提交事件
        $('#edit-profile-form').on('submit', async function(e) {
            e.preventDefault();
            
            const username = $('#edit-username').val();
            const email = $('#edit-email').val();
            const name = $('#edit-name').val();
            
            try {
                await apiRequest('/users/me', 'PUT', { username, email, name });
                showMessage('资料更新成功', 'success');
                const editProfileModal = bootstrap.Modal.getInstance(document.getElementById('edit-profile-modal'));
                editProfileModal.hide();
                loadProfileView(); // 重新加载页面以显示更新后的数据
            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
        
        // 绑定修改密码表单提交事件
        $('#change-password-form').on('submit', async function(e) {
            e.preventDefault();
            
            const oldPassword = $('#old-password').val();
            const newPassword = $('#new-password').val();
            
            try {
                await apiRequest('/users/me/change-password', 'POST', { old_password: oldPassword, new_password: newPassword });
                showMessage('密码修改成功', 'success');
                const changePasswordModal = bootstrap.Modal.getInstance(document.getElementById('change-password-modal'));
                changePasswordModal.hide();
                // 清空表单
                this.reset();
            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
    } catch (error) {
        showMessage(error.message, 'error');
        if (error.message.includes('未认证') || error.message.includes('无效')) {
            removeToken();
            navigateTo('/login');
        }
    } finally {
        hideLoading();
    }
})
```

### 5.3 构建和部署

#### 5.3.1 构建脚本

创建一个构建脚本，用于编译Go应用：

```bash
#!/bin/bash

# build.sh
set -e

echo "开始构建Go Web应用..."

# 设置Go环境变量
export GO111MODULE=on
export GOPROXY=https://goproxy.io,direct

# 清理旧的构建产物
rm -rf output
mkdir -p output

# 安装依赖
echo "安装依赖..."
go mod download

# 构建应用
echo "编译应用..."
go build -o output/my-web-app ./cmd/server

# 复制配置文件
echo "复制配置文件..."
cp .env.example output/
cp -r web/ output/

# 创建启动脚本
cat > output/start.sh << 'EOF'
#!/bin/bash

# 检查是否存在.env文件，如果不存在则从示例文件复制
if [ ! -f .env ]; then
    echo "创建.env文件..."
    cp .env.example .env
fi

# 启动应用
echo "启动Go Web应用..."
./my-web-app
EOF

# 设置执行权限
chmod +x output/start.sh
chmod +x output/my-web-app

echo "构建完成！构建产物位于 output/ 目录"
echo "使用以下命令启动应用："
echo "cd output && ./start.sh"
```

#### 5.3.2 Docker部署

创建Dockerfile，用于容器化部署：

```dockerfile
# Dockerfile
FROM golang:1.20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制go.mod和go.sum文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .

# 构建应用
RUN go build -o my-web-app ./cmd/server

# 第二阶段构建，使用alpine作为基础镜像
FROM alpine:3.16

# 设置工作目录
WORKDIR /app

# 复制构建产物和配置文件
COPY --from=builder /app/my-web-app .
COPY --from=builder /app/web ./web
COPY .env.example .

# 创建.env文件
RUN cp .env.example .env

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["./my-web-app"]
```

创建docker-compose.yml文件，用于多容器部署：

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    container_name: go-web-app
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - PORT=8080
      - GIN_MODE=release
      - DATABASE_URL=./data/data.db
      - JWT_SECRET=your-secret-key-production
    restart: unless-stopped
```

#### 5.3.3 部署步骤

使用Docker部署应用：

1. **构建Docker镜像**

```bash
docker build -t go-web-app:latest .
```

2. **使用docker-compose启动**

```bash
docker-compose up -d
```

3. **验证部署**

```bash
docker-compose ps
```

访问 http://localhost:8080 查看应用。

## 第六章：测试与调试

### 6.1 单元测试

为核心功能编写单元测试：

```go
// internal/service/user_service_test.go
package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/yourusername/my-web-app/internal/model"
	"github.com/yourusername/my-web-app/mocks"
)

func TestUserService_Register(t *testing.T) {
	// 创建模拟的存储库
	mockRepo := new(mocks.UserRepository)

	// 设置模拟行为
	mockRepo.On("FindByUsername", "testuser").Return(nil, nil)
	mockRepo.On("FindByEmail", "test@example.com").Return(nil, nil)
	mockRepo.On("Create", &model.User{
		Username: "testuser",
		Email:    "test@example.com",
		Name:     "Test User",
		Role:     "user",
	}).Return(nil)

	// 创建服务
	service := NewUserService(mockRepo)

	// 测试注册功能
	user, err := service.Register("testuser", "test@example.com", "password123", "Test User")

	// 验证结果
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "testuser", user.Username)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, "Test User", user.Name)
	assert.Equal(t, "user", user.Role)

	// 验证模拟调用
	mockRepo.AssertExpectations(t)
}
```

### 6.2 集成测试

使用Gin的测试工具进行API集成测试：

```go
// cmd/server/main_test.go
package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestRegisterAPI(t *testing.T) {
	// 设置测试模式
	gin.SetMode(gin.TestMode)

	// 创建路由
	router := setupRouter()

	// 创建测试请求
	reqBody := map[string]string{
		"username": "testuser",
		"email":    "test@example.com",
		"password": "password123",
		"name":     "Test User",
	}
	bodyBytes, _ := json.Marshal(reqBody)
	req := httptest.NewRequest("POST", "/api/register", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")

	// 执行请求
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// 验证响应
	assert.Equal(t, http.StatusCreated, w.Code)

	// 解析响应体
	var response map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &response)

	// 验证响应内容
	assert.Equal(t, "注册成功", response["message"])
	userData, ok := response["user"].(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, "testuser", userData["username"])
	assert.Equal(t, "test@example.com", userData["email"])
	assert.Equal(t, "Test User", userData["name"])
}
```

### 6.3 日志和调试

添加结构化日志和调试信息：

```go
// internal/middleware/logger.go
package middleware

import (
	"encoding/json"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// LoggerWithZap 使用zap的日志中间件
func LoggerWithZap() gin.HandlerFunc {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	return func(c *gin.Context) {
		// 开始时间
		startTime := time.Now()

		// 处理请求
		c.Next()

		// 结束时间
		endTime := time.Now()
		latency := endTime.Sub(startTime)

		// 构建日志字段
		fields := []zap.Field{
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.String("query", c.Request.URL.RawQuery),
			zap.String("ip", c.ClientIP()),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("latency", latency),
			zap.String("user_agent", c.Request.UserAgent()),
		}

		// 根据状态码记录不同级别的日志
		if len(c.Errors) > 0 {
			logger.Error("Request error", append(fields, zap.String("error", c.Errors.String()))...)
		} else if c.Writer.Status() >= 500 {
			logger.Error("Server error", fields...)
		} else if c.Writer.Status() >= 400 {
			logger.Warn("Client error", fields...)
		} else {
			logger.Info("Request", fields...)
		}
	}
}
```

## 第七章：总结与最佳实践

### 7.1 项目总结

在本项目中，我们使用Go语言构建了一个完整的Web应用，涵盖了以下关键技术点：

1. **项目结构设计**：采用了清晰的分层架构，包括处理器层、服务层、存储库层和模型层
2. **数据库交互**：使用GORM进行ORM映射和数据库操作
3. **HTTP处理**：使用Gin框架处理HTTP请求和路由
4. **认证授权**：实现了基于JWT的认证机制和角色权限控制
5. **中间件实现**：创建了日志记录、错误处理、认证等中间件
6. **前端集成**：使用HTML、CSS和JavaScript构建了简单的前端界面
7. **容器化部署**：使用Docker和docker-compose实现了应用的容器化和编排
8. **测试与调试**：添加了单元测试和集成测试，提高了代码质量

### 7.2 Go Web开发最佳实践

#### 7.2.1 代码组织

- **使用分层架构**：控制器/处理器 -> 服务层 -> 存储库层 -> 数据模型
- **遵循标准目录结构**：使用cmd、internal、pkg等目录组织代码
- **接口抽象**：使用接口定义服务和存储库的行为，便于测试和替换实现

#### 7.2.2 性能优化

- **连接池管理**：合理配置数据库连接池参数
- **缓存使用**：对频繁访问的数据使用缓存
- **异步处理**：对耗时操作使用goroutine异步处理
- **内存管理**：避免不必要的内存分配，注意切片和映射的预分配

#### 7.2.3 安全考虑

- **输入验证**：对所有用户输入进行严格验证
- **密码加密**：使用bcrypt等安全算法加密存储密码
- **参数绑定**：使用Gin的绑定功能，避免SQL注入
- **HTTPS使用**：在生产环境中使用HTTPS
- **CORS配置**：合理配置跨域资源共享

#### 7.2.4 可维护性

- **日志记录**：使用结构化日志，便于问题排查
- **错误处理**：统一的错误处理机制
- **配置管理**：使用环境变量或配置文件管理配置
- **文档编写**：为API和关键函数添加文档注释
- **测试覆盖**：编写单元测试和集成测试，确保代码质量

### 7.3 后续优化方向

1. **添加缓存**：使用Redis缓存热点数据
2. **数据库优化**：添加索引，优化查询性能
3. **API文档**：集成Swagger自动生成API文档
4. **监控告警**：添加Prometheus和Grafana监控
5. **CI/CD集成**：添加持续集成和持续部署流程
6. **微服务拆分**：将单体应用拆分为微服务架构
7. **国际化支持**：添加多语言支持

## 结语

通过本项目的实践，我们学习了如何使用Go语言构建现代化的Web应用。Go语言的简洁性、高性能和并发特性使其成为Web开发的理想选择。在实际项目中，我们应该根据具体需求选择合适的框架和工具，并遵循最佳实践，构建出稳定、高效、安全的Web应用。

希望本文能够帮助你快速入门Go Web开发，并在实际项目中应用所学知识。Go语言生态系统正在不断发展壮大，有越来越多的优秀库和工具可供使用。持续学习和实践是掌握Go Web开发的关键。

Happy coding with Go!"}]}}}