---
title: 算法面试题解：LeetCode高频题与解题思路
description: 系统整理LeetCode高频算法题，提供详细解题思路和代码实现，帮助快速提升算法面试能力
date: 2025-12-10 10:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories: ["编程开发"]
---

# 算法面试题解：LeetCode 高频题与解题思路

算法是技术面试的重要组成部分，LeetCode 是算法练习的主要平台。本文系统整理 LeetCode 高频算法题，提供详细的解题思路和代码实现，帮助你快速提升算法面试能力。

## 第一章：算法面试准备（第1周）

### 1.1 算法基础

#### 时间复杂度

- **O(1)**：常数时间
- **O(log n)**：对数时间
- **O(n)**：线性时间
- **O(n log n)**：线性对数时间
- **O(n²)**：平方时间
- **O(2ⁿ)**：指数时间

#### 空间复杂度

- **O(1)**：常数空间
- **O(n)**：线性空间
- **O(n²)**：平方空间

### 1.2 数据结构

#### 常用数据结构

- **数组**：连续内存，随机访问快
- **链表**：动态内存，插入删除快
- **栈**：LIFO，后进先出
- **队列**：FIFO，先进先出
- **哈希表**：O(1) 查找
- **树**：层次结构
- **图**：节点和边

## 第二章：数组类高频题（第1-2周）

### 2.1 两数之和（LeetCode 1）

#### 题目

给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出和为目标值的那两个整数，并返回它们的数组下标。

#### 解题思路

使用哈希表存储已遍历的元素，查找 `target - nums[i]`。

#### 代码实现

```javascript
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(n)

### 2.2 三数之和（LeetCode 15）

#### 题目

给你一个包含 n 个整数的数组 `nums`，判断 `nums` 中是否存在三个元素 a，b，c，使得 a + b + c = 0？请你找出所有和为 0 且不重复的三元组。

#### 解题思路

排序后使用双指针，固定一个数，用双指针找另外两个数。

#### 代码实现

```javascript
function threeSum(nums) {
    const result = [];
    nums.sort((a, b) => a - b);
    
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        
        let left = i + 1;
        let right = nums.length - 1;
        
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            if (sum === 0) {
                result.push([nums[i], nums[left], nums[right]]);
                while (left < right && nums[left] === nums[left + 1]) left++;
                while (left < right && nums[right] === nums[right - 1]) right--;
                left++;
                right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    
    return result;
}
```

**时间复杂度**：O(n²)  
**空间复杂度**：O(1)

### 2.3 盛最多水的容器（LeetCode 11）

#### 题目

给你 n 个非负整数 a1，a2，...，an，每个数代表坐标中的一个点 (i, ai)。在坐标内画 n 条垂直线，垂直线 i 的两个端点分别为 (i, ai) 和 (i, 0)。找出其中的两条线，使得它们与 x 轴共同构成的容器可以容纳最多的水。

#### 解题思路

使用双指针，从两端向中间移动，每次移动较短的边。

#### 代码实现

```javascript
function maxArea(height) {
    let left = 0;
    let right = height.length - 1;
    let maxArea = 0;
    
    while (left < right) {
        const area = Math.min(height[left], height[right]) * (right - left);
        maxArea = Math.max(maxArea, area);
        
        if (height[left] < height[right]) {
            left++;
        } else {
            right--;
        }
    }
    
    return maxArea;
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(1)

### 2.4 移动零（LeetCode 283）

#### 题目

给定一个数组 `nums`，编写一个函数将所有 0 移动到数组的末尾，同时保持非零元素的相对顺序。

#### 解题思路

使用双指针，一个指针遍历数组，一个指针指向非零元素的位置。

#### 代码实现

```javascript
function moveZeroes(nums) {
    let slow = 0;
    
    for (let fast = 0; fast < nums.length; fast++) {
        if (nums[fast] !== 0) {
            [nums[slow], nums[fast]] = [nums[fast], nums[slow]];
            slow++;
        }
    }
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(1)

## 第三章：字符串类高频题（第2周）

### 3.1 无重复字符的最长子串（LeetCode 3）

#### 题目

给定一个字符串 `s`，请你找出其中不含有重复字符的最长子串的长度。

#### 解题思路

使用滑动窗口，用哈希表记录字符位置。

#### 代码实现

```javascript
function lengthOfLongestSubstring(s) {
    const map = new Map();
    let maxLen = 0;
    let left = 0;
    
    for (let right = 0; right < s.length; right++) {
        if (map.has(s[right]) && map.get(s[right]) >= left) {
            left = map.get(s[right]) + 1;
        }
        map.set(s[right], right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    
    return maxLen;
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(min(n, m))，m 是字符集大小

### 3.2 最长回文子串（LeetCode 5）

#### 题目

给你一个字符串 `s`，找到 `s` 中最长的回文子串。

#### 解题思路

中心扩展法，从每个字符或每两个字符中间向两边扩展。

#### 代码实现

```javascript
function longestPalindrome(s) {
    let start = 0;
    let maxLen = 0;
    
    function expandAroundCenter(left, right) {
        while (left >= 0 && right < s.length && s[left] === s[right]) {
            left--;
            right++;
        }
        return right - left - 1;
    }
    
    for (let i = 0; i < s.length; i++) {
        const len1 = expandAroundCenter(i, i);
        const len2 = expandAroundCenter(i, i + 1);
        const len = Math.max(len1, len2);
        
        if (len > maxLen) {
            maxLen = len;
            start = i - Math.floor((len - 1) / 2);
        }
    }
    
    return s.substring(start, start + maxLen);
}
```

**时间复杂度**：O(n²)  
**空间复杂度**：O(1)

### 3.3 有效的括号（LeetCode 20）

#### 题目

给定一个只包括 `'('`，`')'`，`'{'`，`'}'`，`'['`，`']'` 的字符串 `s`，判断字符串是否有效。

#### 解题思路

使用栈，遇到左括号入栈，遇到右括号匹配栈顶。

#### 代码实现

```javascript
function isValid(s) {
    const stack = [];
    const map = {
        ')': '(',
        '}': '{',
        ']': '['
    };
    
    for (let char of s) {
        if (char in map) {
            if (stack.length === 0 || stack.pop() !== map[char]) {
                return false;
            }
        } else {
            stack.push(char);
        }
    }
    
    return stack.length === 0;
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(n)

## 第四章：链表类高频题（第2-3周）

### 4.1 反转链表（LeetCode 206）

#### 题目

给你单链表的头节点 `head`，请你反转链表，并返回反转后的链表。

#### 解题思路

使用三个指针，逐个反转节点。

#### 代码实现

```javascript
function reverseList(head) {
    let prev = null;
    let curr = head;
    
    while (curr !== null) {
        const next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    
    return prev;
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(1)

### 4.2 合并两个有序链表（LeetCode 21）

#### 题目

将两个升序链表合并为一个新的升序链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。

#### 解题思路

使用双指针，比较两个链表的节点值，较小的加入结果链表。

#### 代码实现

```javascript
function mergeTwoLists(l1, l2) {
    const dummy = new ListNode(0);
    let curr = dummy;
    
    while (l1 !== null && l2 !== null) {
        if (l1.val < l2.val) {
            curr.next = l1;
            l1 = l1.next;
        } else {
            curr.next = l2;
            l2 = l2.next;
        }
        curr = curr.next;
    }
    
    curr.next = l1 !== null ? l1 : l2;
    return dummy.next;
}
```

**时间复杂度**：O(n + m)  
**空间复杂度**：O(1)

### 4.3 链表中环的检测（LeetCode 141）

#### 题目

给定一个链表，判断链表中是否有环。

#### 解题思路

使用快慢指针，如果存在环，快指针会追上慢指针。

#### 代码实现

```javascript
function hasCycle(head) {
    if (head === null || head.next === null) {
        return false;
    }
    
    let slow = head;
    let fast = head.next;
    
    while (slow !== fast) {
        if (fast === null || fast.next === null) {
            return false;
        }
        slow = slow.next;
        fast = fast.next.next;
    }
    
    return true;
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(1)

## 第五章：树类高频题（第3-4周）

### 5.1 二叉树的最大深度（LeetCode 104）

#### 题目

给定一个二叉树，找出其最大深度。

#### 解题思路

递归计算左右子树的最大深度，取较大值加 1。

#### 代码实现

```javascript
function maxDepth(root) {
    if (root === null) {
        return 0;
    }
    
    const leftDepth = maxDepth(root.left);
    const rightDepth = maxDepth(root.right);
    
    return Math.max(leftDepth, rightDepth) + 1;
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(h)，h 是树的高度

### 5.2 二叉树的遍历

#### 前序遍历（LeetCode 144）

```javascript
function preorderTraversal(root) {
    const result = [];
    
    function traverse(node) {
        if (node === null) return;
        result.push(node.val);
        traverse(node.left);
        traverse(node.right);
    }
    
    traverse(root);
    return result;
}
```

#### 中序遍历（LeetCode 94）

```javascript
function inorderTraversal(root) {
    const result = [];
    
    function traverse(node) {
        if (node === null) return;
        traverse(node.left);
        result.push(node.val);
        traverse(node.right);
    }
    
    traverse(root);
    return result;
}
```

#### 后序遍历（LeetCode 145）

```javascript
function postorderTraversal(root) {
    const result = [];
    
    function traverse(node) {
        if (node === null) return;
        traverse(node.left);
        traverse(node.right);
        result.push(node.val);
    }
    
    traverse(root);
    return result;
}
```

### 5.3 对称二叉树（LeetCode 101）

#### 题目

给定一个二叉树，检查它是否是镜像对称的。

#### 解题思路

递归比较左右子树是否镜像对称。

#### 代码实现

```javascript
function isSymmetric(root) {
    if (root === null) return true;
    
    function isMirror(left, right) {
        if (left === null && right === null) return true;
        if (left === null || right === null) return false;
        if (left.val !== right.val) return false;
        
        return isMirror(left.left, right.right) && 
               isMirror(left.right, right.left);
    }
    
    return isMirror(root.left, root.right);
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(h)

## 第六章：动态规划高频题（第4-5周）

### 6.1 爬楼梯（LeetCode 70）

#### 题目

假设你正在爬楼梯。需要 n 阶你才能到达楼顶。每次你可以爬 1 或 2 个台阶。你有多少种不同的方法可以爬到楼顶呢？

#### 解题思路

动态规划，`dp[i] = dp[i-1] + dp[i-2]`。

#### 代码实现

```javascript
function climbStairs(n) {
    if (n <= 2) return n;
    
    let first = 1;
    let second = 2;
    
    for (let i = 3; i <= n; i++) {
        const third = first + second;
        first = second;
        second = third;
    }
    
    return second;
}
```

**时间复杂度**：O(n)  
**空间复杂度**：O(1)

### 6.2 最长递增子序列（LeetCode 300）

#### 题目

给你一个整数数组 `nums`，找到其中最长严格递增子序列的长度。

#### 解题思路

动态规划，`dp[i]` 表示以 `nums[i]` 结尾的最长递增子序列长度。

#### 代码实现

```javascript
function lengthOfLIS(nums) {
    const dp = new Array(nums.length).fill(1);
    let maxLen = 1;
    
    for (let i = 1; i < nums.length; i++) {
        for (let j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLen = Math.max(maxLen, dp[i]);
    }
    
    return maxLen;
}
```

**时间复杂度**：O(n²)  
**空间复杂度**：O(n)

### 6.3 最长公共子序列（LeetCode 1143）

#### 题目

给定两个字符串 `text1` 和 `text2`，返回这两个字符串的最长公共子序列的长度。

#### 解题思路

动态规划，`dp[i][j]` 表示 `text1[0..i]` 和 `text2[0..j]` 的最长公共子序列长度。

#### 代码实现

```javascript
function longestCommonSubsequence(text1, text2) {
    const m = text1.length;
    const n = text2.length;
    const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (text1[i - 1] === text2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    return dp[m][n];
}
```

**时间复杂度**：O(m × n)  
**空间复杂度**：O(m × n)

## 第七章：回溯算法高频题（第5周）

### 7.1 全排列（LeetCode 46）

#### 题目

给定一个不含重复数字的数组 `nums`，返回其所有可能的全排列。

#### 解题思路

回溯算法，使用 visited 数组标记已使用的元素。

#### 代码实现

```javascript
function permute(nums) {
    const result = [];
    const path = [];
    const used = new Array(nums.length).fill(false);
    
    function backtrack() {
        if (path.length === nums.length) {
            result.push([...path]);
            return;
        }
        
        for (let i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            
            path.push(nums[i]);
            used[i] = true;
            backtrack();
            path.pop();
            used[i] = false;
        }
    }
    
    backtrack();
    return result;
}
```

**时间复杂度**：O(n × n!)  
**空间复杂度**：O(n)

### 7.2 组合总和（LeetCode 39）

#### 题目

给定一个无重复元素的数组 `candidates` 和一个目标数 `target`，找出 `candidates` 中所有可以使数字和为 `target` 的组合。

#### 解题思路

回溯算法，注意去重和剪枝。

#### 代码实现

```javascript
function combinationSum(candidates, target) {
    const result = [];
    const path = [];
    
    function backtrack(start, sum) {
        if (sum === target) {
            result.push([...path]);
            return;
        }
        
        if (sum > target) return;
        
        for (let i = start; i < candidates.length; i++) {
            path.push(candidates[i]);
            backtrack(i, sum + candidates[i]);
            path.pop();
        }
    }
    
    backtrack(0, 0);
    return result;
}
```

**时间复杂度**：O(2^n)  
**空间复杂度**：O(target)

## 第八章：排序算法（第5-6周）

### 8.1 快速排序

#### 代码实现

```javascript
function quickSort(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
        const pivot = partition(arr, low, high);
        quickSort(arr, low, pivot - 1);
        quickSort(arr, pivot + 1, high);
    }
    return arr;
}

function partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;
    
    for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
}
```

**时间复杂度**：平均 O(n log n)，最坏 O(n²)  
**空间复杂度**：O(log n)

### 8.2 归并排序

#### 代码实现

```javascript
function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    
    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
            result.push(left[i++]);
        } else {
            result.push(right[j++]);
        }
    }
    
    return result.concat(left.slice(i)).concat(right.slice(j));
}
```

**时间复杂度**：O(n log n)  
**空间复杂度**：O(n)

## 第九章：面试技巧（第6周）

### 9.1 解题步骤

#### 五步解题法

1. **理解题目**：仔细阅读题目，理解需求
2. **分析思路**：分析解题思路，考虑边界情况
3. **编写代码**：编写代码，注意代码规范
4. **测试验证**：测试边界情况和特殊情况
5. **优化改进**：优化时间和空间复杂度

### 9.2 常见错误

#### 避免的错误

- **边界条件**：注意数组为空、单个元素等情况
- **溢出问题**：注意整数溢出
- **变量命名**：使用有意义的变量名
- **代码注释**：适当添加注释

### 9.3 时间管理

#### 时间分配

- **理解题目**：5 分钟
- **分析思路**：10 分钟
- **编写代码**：15 分钟
- **测试优化**：10 分钟

## 第十章：高频题汇总

### 10.1 必刷题清单

#### 数组类（10 题）

1. 两数之和
2. 三数之和
3. 盛最多水的容器
4. 移动零
5. 合并两个有序数组
6. 旋转数组
7. 买卖股票的最佳时机
8. 最大子数组和
9. 合并区间
10. 跳跃游戏

#### 字符串类（10 题）

1. 无重复字符的最长子串
2. 最长回文子串
3. 有效的括号
4. 字符串转换整数
5. 最长公共前缀
6. 字母异位词分组
7. 编辑距离
8. 正则表达式匹配
9. 最小覆盖子串
10. 单词拆分

#### 链表类（10 题）

1. 反转链表
2. 合并两个有序链表
3. 链表中环的检测
4. 删除链表的倒数第 N 个结点
5. 两数相加
6. 相交链表
7. 回文链表
8. 合并 K 个升序链表
9. 旋转链表
10. 复制带随机指针的链表

#### 树类（10 题）

1. 二叉树的最大深度
2. 对称二叉树
3. 二叉树的遍历
4. 二叉树的层序遍历
5. 从前序与中序遍历序列构造二叉树
6. 路径总和
7. 二叉搜索树的最近公共祖先
8. 验证二叉搜索树
9. 二叉树中的最大路径和
10. 序列化二叉树

#### 动态规划（10 题）

1. 爬楼梯
2. 最长递增子序列
3. 最长公共子序列
4. 编辑距离
5. 打家劫舍
6. 零钱兑换
7. 最长回文子串
8. 单词拆分
9. 不同路径
10. 最大子数组和

## 结语：多刷题，多总结

算法面试需要：

1. **扎实基础**：数据结构、算法基础
2. **多刷题**：LeetCode 刷题，熟悉题型
3. **多总结**：总结解题思路和模板
4. **多练习**：通过练习提高熟练度

记住：

- **理解思路**：理解算法思路，不要死记硬背
- **多练习**：通过大量练习提高熟练度
- **总结模板**：总结常见题型的解题模板
- **保持冷静**：面试时保持冷静，理清思路

愿每一位开发者都能在算法面试中取得好成绩！

