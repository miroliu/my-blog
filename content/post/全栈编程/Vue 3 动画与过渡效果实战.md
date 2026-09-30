---
title: "Vue 3 动画与过渡效果实战"
date: 2025-10-30T09:50:00+08:00
draft: false
categories: ["全栈编程"]
tags: ["Vue 3", "动画", "过渡效果", "前端开发", "CSS动画", "JavaScript动画", "UI设计", "用户体验"]
license: ""
hidden: false
---

# Vue 3 动画与过渡效果实战

## 前言

动画和过渡效果是现代Web应用中不可或缺的一部分，它们能极大地提升用户体验，使界面更加生动和友好。Vue 3 提供了强大且灵活的动画系统，本文将详细介绍Vue 3的动画与过渡效果实现方式，并通过实际案例展示如何创建各种精美的动画效果。

## 一、Vue 3 动画基础

### 1. 过渡组件

Vue 3 提供了内置的 `<Transition>` 组件，用于为单个元素或组件的插入、更新和移除添加过渡效果：

```vue
<template>
  <div>
    <button @click="show = !show">切换显示</button>
    <Transition name="fade">
      <p v-if="show">这是一段可以过渡的内容</p>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(false)
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

### 2. 过渡类名

Vue 3 在元素过渡过程中会添加一系列CSS类：

- **进入阶段**：
  - `v-enter-from`: 进入过渡的开始状态
  - `v-enter-active`: 进入过渡的激活状态
  - `v-enter-to`: 进入过渡的结束状态

- **离开阶段**：
  - `v-leave-from`: 离开过渡的开始状态
  - `v-leave-active`: 离开过渡的激活状态
  - `v-leave-to`: 离开过渡的结束状态

如果使用了 `name` 属性，类名将以该名称为前缀，如 `fade-enter-from`。

### 3. 过渡模式

Vue 3 提供了两种过渡模式，通过 `mode` 属性设置：

```vue
<Transition name="fade" mode="out-in">
  <component :is="currentView" />
</Transition>
```

- **`in-out`**: 新元素先进入，然后旧元素离开
- **`out-in`**: 旧元素先离开，然后新元素进入

## 二、CSS 过渡效果

### 1. 基本过渡效果

最简单的过渡效果是通过CSS过渡属性实现的：

```vue
<template>
  <div>
    <button @click="show = !show">切换内容</button>
    <Transition name="slide-fade">
      <div v-if="show" class="box">过渡内容</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(false)
</script>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateX(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(10px);
  opacity: 0;
}

.box {
  background-color: #42b983;
  color: white;
  padding: 20px;
  border-radius: 4px;
  display: inline-block;
}
</style>
```

### 2. 多元素过渡

当在同一个 `<Transition>` 组件中条件渲染多个元素时，需要使用 `key` 属性区分它们：

```vue
<template>
  <div>
    <button @click="toggle">切换</button>
    <Transition name="fade">
      <p v-if="isVisible" key="on">已显示</p>
      <p v-else key="off">已隐藏</p>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isVisible = ref(true)

function toggle() {
  isVisible.value = !isVisible.value
}
</script>
```

### 3. 列表过渡

Vue 3 提供了 `<TransitionGroup>` 组件用于列表的过渡：

```vue
<template>
  <div>
    <button @click="addItem">添加项目</button>
    <button @click="removeItem">移除项目</button>
    <TransitionGroup name="list" tag="ul">
      <li v-for="item in items" :key="item" class="list-item">
        {{ item }}
      </li>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([1, 2, 3, 4, 5])
const nextNum = ref(6)

function addItem() {
  items.value.push(nextNum.value++)
}

function removeItem() {
  items.value.pop()
}
</script>

<style>
.list-item {
  display: inline-block;
  margin-right: 10px;
  background: #42b983;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}
</style>
```

## 三、CSS 动画

### 1. 基本动画效果

除了过渡效果，Vue 3 也支持CSS动画：

```vue
<template>
  <div>
    <button @click="show = !show">切换动画</button>
    <Transition name="bounce">
      <div v-if="show" class="animated-box">动画元素</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(false)
</script>

<style>
.bounce-enter-active {
  animation: bounce-in 0.5s ease-in;
}

.bounce-leave-active {
  animation: bounce-out 0.5s ease-out;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes bounce-out {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(0);
  }
}

.animated-box {
  background: #42b983;
  color: white;
  padding: 20px;
  border-radius: 4px;
  display: inline-block;
}
</style>
```

### 2. 交错动画

使用 `<TransitionGroup>` 和 CSS 变量可以创建交错动画效果：

```vue
<template>
  <div>
    <button @click="shuffle">随机排序</button>
    <TransitionGroup name="staggered-fade" tag="div" class="stagger-container">
      <div
        v-for="(item, index) in items"
        :key="item.id"
        class="stagger-item"
        :style="{ '--index': index }"
      >
        {{ item.text }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([
  { id: 1, text: 'Item 1' },
  { id: 2, text: 'Item 2' },
  { id: 3, text: 'Item 3' },
  { id: 4, text: 'Item 4' },
  { id: 5, text: 'Item 5' }
])

function shuffle() {
  items.value = [...items.value].sort(() => Math.random() - 0.5)
}
</script>

<style>
.stagger-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stagger-item {
  background: #42b983;
  color: white;
  padding: 10px;
  border-radius: 4px;
  min-width: 100px;
  text-align: center;
}

.staggered-fade-enter-active,
.staggered-fade-leave-active {
  transition: all 0.5s ease;
  transition-delay: calc(var(--index) * 0.1s);
}

.staggered-fade-enter-from,
.staggered-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.staggered-fade-move {
  transition: transform 0.5s ease;
}
</style>
```

## 四、JavaScript 动画

### 1. 自定义过渡类

Vue 3 允许使用 JavaScript 钩子来控制动画：

```vue
<template>
  <div>
    <button @click="show = !show">切换JS动画</button>
    <Transition
      name="js-animation"
      @before-enter="beforeEnter"
      @enter="enter"
      @after-enter="afterEnter"
      @enter-cancelled="enterCancelled"
      @before-leave="beforeLeave"
      @leave="leave"
      @after-leave="afterLeave"
      @leave-cancelled="leaveCancelled"
    >
      <div v-if="show" ref="animatedElement" class="js-box">JS动画元素</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(false)
const animatedElement = ref(null)

function beforeEnter(el) {
  el.style.opacity = 0
  el.style.transform = 'translateX(-20px)'
}

function enter(el, done) {
  const duration = 500
  const startTime = Date.now()
  
  function animate() {
    const progress = Math.min((Date.now() - startTime) / duration, 1)
    const easeOutCubic = 1 - Math.pow(1 - progress, 3)
    
    el.style.opacity = progress
    el.style.transform = `translateX(-20px + ${20 * easeOutCubic}px)`
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      done()
    }
  }
  
  requestAnimationFrame(animate)
}

function afterEnter(el) {
  console.log('动画完成')
}

function enterCancelled(el) {
  console.log('进入动画取消')
}

function beforeLeave(el) {
  el.style.opacity = 1
}

function leave(el, done) {
  const duration = 500
  const startTime = Date.now()
  
  function animate() {
    const progress = Math.min((Date.now() - startTime) / duration, 1)
    const easeInCubic = Math.pow(progress, 3)
    
    el.style.opacity = 1 - progress
    el.style.transform = `translateX(${20 * easeInCubic}px)`
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      done()
    }
  }
  
  requestAnimationFrame(animate)
}

function afterLeave(el) {
  console.log('离开动画完成')
}

function leaveCancelled(el) {
  console.log('离开动画取消')
}
</script>

<style>
.js-box {
  background: #42b983;
  color: white;
  padding: 20px;
  border-radius: 4px;
  display: inline-block;
}
</style>
```

### 2. 集成第三方动画库

Vue 3 可以轻松集成第三方动画库，如 GSAP：

```vue
<template>
  <div>
    <button @click="show = !show">GSAP动画</button>
    <Transition
      @enter="enterWithGSAP"
      @leave="leaveWithGSAP"
    >
      <div v-if="show" class="gsap-box">GSAP动画元素</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 动态导入GSAP
let gsap = null

onMounted(async () => {
  const GSAPModule = await import('gsap')
  gsap = GSAPModule.default
})

const show = ref(false)

function enterWithGSAP(el, done) {
  if (!gsap) return done()
  
  gsap.from(el, {
    opacity: 0,
    y: 50,
    scale: 0.8,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: done
  })
}

function leaveWithGSAP(el, done) {
  if (!gsap) return done()
  
  gsap.to(el, {
    opacity: 0,
    y: -50,
    scale: 0.8,
    duration: 0.5,
    ease: 'power2.in',
    onComplete: done
  })
}
</script>

<style>
.gsap-box {
  background: #42b983;
  color: white;
  padding: 20px;
  border-radius: 4px;
  display: inline-block;
}
</style>
```

## 五、实战案例

### 1. 手风琴组件

创建一个带动画效果的手风琴组件：

```vue
<template>
  <div class="accordion">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="accordion-item"
    >
      <div
        class="accordion-header"
        :class="{ active: activeIndex === index }"
        @click="toggleItem(index)"
      >
        <span class="accordion-title">{{ item.title }}</span>
        <span class="accordion-icon" :class="{ rotated: activeIndex === index }">▼</span>
      </div>
      <Transition name="accordion">
        <div v-if="activeIndex === index" class="accordion-content">
          {{ item.content }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeIndex = ref(0)

const items = ref([
  {
    id: 1,
    title: '手风琴项 1',
    content: '这是手风琴项 1 的详细内容。这里可以放置很长的文本或其他内容。'
  },
  {
    id: 2,
    title: '手风琴项 2',
    content: '这是手风琴项 2 的详细内容。这里可以放置很长的文本或其他内容。'
  },
  {
    id: 3,
    title: '手风琴项 3',
    content: '这是手风琴项 3 的详细内容。这里可以放置很长的文本或其他内容。'
  }
])

function toggleItem(index) {
  activeIndex.value = activeIndex.value === index ? null : index
}
</script>

<style>
.accordion {
  max-width: 600px;
  margin: 0 auto;
  border-radius: 4px;
  overflow: hidden;
}

.accordion-item {
  border-bottom: 1px solid #e0e0e0;
}

.accordion-header {
  background: #f8f9fa;
  padding: 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s ease;
}

.accordion-header:hover {
  background: #e9ecef;
}

.accordion-header.active {
  background: #42b983;
  color: white;
}

.accordion-title {
  font-weight: 500;
}

.accordion-icon {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.accordion-icon.rotated {
  transform: rotate(-180deg);
}

.accordion-content {
  padding: 15px;
  background: white;
}

.accordion-enter-active,
.accordion-leave-active {
  max-height: 500px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
```

### 2. 平滑滚动导航

创建一个带有平滑滚动动画的导航栏：

```vue
<template>
  <nav class="navbar" :class="{ fixed: scrolled }">
    <div class="navbar-container">
      <div class="navbar-brand">My App</div>
      <ul class="navbar-links">
        <li v-for="link in navLinks" :key="link.id">
          <a
            :href="link.href"
            class="nav-link"
            :class="{ active: activeSection === link.id }"
            @click.prevent="scrollToSection(link.id)"
          >
            {{ link.text }}
          </a>
        </li>
      </ul>
    </div>
  </nav>
  
  <div class="sections">
    <section id="home" class="section">首页内容</section>
    <section id="about" class="section">关于我们</section>
    <section id="services" class="section">我们的服务</section>
    <section id="contact" class="section">联系我们</section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const scrolled = ref(false)
const activeSection = ref('home')

const navLinks = ref([
  { id: 'home', text: '首页', href: '#home' },
  { id: 'about', text: '关于', href: '#about' },
  { id: 'services', text: '服务', href: '#services' },
  { id: 'contact', text: '联系', href: '#contact' }
])

function handleScroll() {
  // 检测滚动位置以固定导航栏
  scrolled.value = window.scrollY > 50
  
  // 检测当前可见的部分
  const sections = navLinks.value.map(link => document.getElementById(link.id))
  const currentSection = sections.find(section => {
    if (!section) return false
    const rect = section.getBoundingClientRect()
    return rect.top <= 100 && rect.bottom >= 100
  })
  
  if (currentSection) {
    activeSection.value = currentSection.id
  }
}

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId)
  if (element) {
    window.scrollTo({
      top: element.offsetTop - 70, // 考虑导航栏高度
      behavior: 'smooth'
    })
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
}

.navbar {
  background: transparent;
  padding: 20px 0;
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
  z-index: 1000;
}

.navbar.fixed {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 10px 0;
  position: fixed;
  top: 0;
  left: 0;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.navbar.fixed .navbar-brand {
  color: #42b983;
}

.navbar-links {
  display: flex;
  list-style: none;
}

.navbar-links li {
  margin-left: 30px;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
}

.nav-link:hover {
  color: #42b983;
}

.nav-link.active {
  color: #42b983;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background: #42b983;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    width: 0;
    left: 50%;
  }
  to {
    width: 100%;
    left: 0;
  }
}

.section {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 36px;
  font-weight: bold;
}

#home {
  background: #f8f9fa;
  color: #333;
}

#about {
  background: #42b983;
  color: white;
}

#services {
  background: #3498db;
  color: white;
}

#contact {
  background: #e74c3c;
  color: white;
}
</style>
```

### 3. 模态框组件

创建一个带动画效果的模态框组件：

```vue
<template>
  <Transition name="modal">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <div class="modal-content" role="dialog" aria-modal="true">
        <button class="modal-close" @click="close" aria-label="关闭">×</button>
        
        <div v-if="title" class="modal-header">
          <h2 class="modal-title">{{ title }}</h2>
        </div>
        
        <div class="modal-body">
          <slot></slot>
        </div>
        
        <div v-if="$slots.footer" class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  closeOnClickOutside: {
    type: Boolean,
    default: true
  },
  closeOnEsc: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['close', 'update:visible'])

// 处理ESC键关闭
function handleEsc(event) {
  if (event.key === 'Escape' && props.visible && props.closeOnEsc) {
    close()
  }
}

// 关闭模态框
function close() {
  emit('close')
  emit('update:visible', false)
}

// 监听ESC键
onMounted(() => {
  document.addEventListener('keydown', handleEsc)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
})

// 防止背景滚动
watch(() => props.visible, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 5px;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #333;
}

.modal-header {
  padding: 20px 20px 0;
  border-bottom: 1px solid #eee;
}

.modal-title {
  margin: 0 0 20px;
  font-size: 20px;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content {
  transform: scale(0.9);
}

.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>

<!-- 使用示例 -->
<!-- 
<template>
  <div>
    <button @click="showModal = true">打开模态框</button>
    <MyModal
      v-model:visible="showModal"
      title="示例模态框"
    >
      <p>这是模态框的内容区域，可以放置任何内容。</p>
      <div slot="footer">
        <button @click="showModal = false">取消</button>
        <button @click="showModal = false" class="primary">确定</button>
      </div>
    </MyModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MyModal from './MyModal.vue'

const showModal = ref(false)
</script>
 -->
```

### 4. 数字滚动动画

创建一个数字滚动动画效果：

```vue
<template>
  <div class="counter-container">
    <div class="counter-item" v-for="(digit, index) in displayDigits" :key="index">
      <div
        class="counter-digits"
        :style="{ transform: `translateY(-${digit * 100}%)` }"
      >
        <div v-for="n in 10" :key="n" class="counter-digit">{{ n === 10 ? 0 : n }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 1000
  },
  digitCount: {
    type: Number,
    default: 6
  }
})

// 显示的数字
const displayNumber = ref(0)

// 计算显示的数字数组
const displayDigits = computed(() => {
  const paddedNumber = displayNumber.value.toString().padStart(props.digitCount, '0')
  return paddedNumber.split('').map(d => parseInt(d))
})

// 动画函数
function animate(from, to, duration) {
  return new Promise(resolve => {
    const startTime = Date.now()
    
    function updateNumber() {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // 使用缓动函数
      const easeOutQuad = progress * (2 - progress)
      displayNumber.value = Math.floor(from + (to - from) * easeOutQuad)
      
      if (progress < 1) {
        requestAnimationFrame(updateNumber)
      } else {
        displayNumber.value = to
        resolve()
      }
    }
    
    requestAnimationFrame(updateNumber)
  })
}

// 监听value变化
watch(() => props.value, async (newValue) => {
  await animate(displayNumber.value, newValue, props.duration)
})

// 组件挂载时初始化
onMounted(async () => {
  await animate(0, props.value, props.duration)
})
</script>

<style scoped>
.counter-container {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.counter-item {
  position: relative;
  width: 40px;
  height: 60px;
  overflow: hidden;
  background-color: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.counter-digits {
  transition: transform 0.3s ease;
  text-align: center;
}

.counter-digit {
  height: 60px;
  line-height: 60px;
  font-size: 40px;
  font-weight: bold;
  color: #333;
}
</style>

<!-- 使用示例 -->
<!-- 
<template>
  <div>
    <h2>数字滚动动画示例</h2>
    <Counter :value="count" />
    <button @click="count = Math.floor(Math.random() * 1000000)">随机数</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Counter from './Counter.vue'

const count = ref(123456)
</script>
 -->
```

## 六、性能优化

### 1. 避免不必要的重绘

动画性能优化的关键是减少浏览器的重绘和回流：

```css
/* 好的做法：使用 transform 和 opacity */
.animate-optimized {
  transition: transform 0.3s ease, opacity 0.3s ease;
  /* 而不是改变 width, height, top, left 等会导致回流的属性 */
}
```

### 2. 使用 will-change 属性

对于复杂动画，可以使用 `will-change` 属性提示浏览器预先渲染：

```css
.heavy-animation {
  will-change: transform, opacity;
}
```

### 3. 动画批处理

使用 Vue 3 的 nextTick 进行动画批处理：

```javascript
import { nextTick } from 'vue'

async function animateMultipleElements() {
  // 先更新数据
  items.value.forEach(item => {
    item.active = true
  })
  
  // 等待DOM更新后再执行动画
  await nextTick()
  
  // 批量添加动画类
  items.value.forEach(item => {
    item.animate = true
  })
}
```

### 4. 使用 CSS 变量实现灵活动画

CSS 变量可以让动画更加灵活和可配置：

```vue
<template>
  <div 
    class="configurable-animation"
    :style="{
      '--animation-duration': duration + 'ms',
      '--animation-delay': delay + 'ms',
      '--animation-color': color
    }"
  >
    动画元素
  </div>
</template>

<script setup>
import { ref } from 'vue'

const duration = ref(1000)
const delay = ref(0)
const color = ref('#42b983')
</script>

<style>
.configurable-animation {
  background-color: var(--animation-color);
  animation: pulse var(--animation-duration) ease var(--animation-delay) infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
```

## 总结

Vue 3 提供了强大而灵活的动画系统，通过内置的 `<Transition>` 和 `<TransitionGroup>` 组件，我们可以轻松实现各种精美的过渡和动画效果。本文介绍了Vue 3动画的基础知识、CSS过渡与动画、JavaScript动画，以及实际项目中的应用案例。

主要内容回顾：

1. **Vue 3 动画基础**：了解了过渡组件、过渡类名和过渡模式
2. **CSS 过渡效果**：实现了基本过渡、多元素过渡和列表过渡
3. **CSS 动画**：创建了基本动画和交错动画效果
4. **JavaScript 动画**：使用JS钩子和第三方库控制动画
5. **实战案例**：开发了手风琴组件、平滑滚动导航、模态框和数字滚动动画
6. **性能优化**：学习了减少重绘、使用will-change属性和动画批处理等优化技巧

通过合理运用这些动画技术，我们可以提升用户体验，使界面更加生动和友好。在实际开发中，应根据项目需求选择合适的动画方案，并注意性能优化，避免过度使用复杂动画导致性能问题。