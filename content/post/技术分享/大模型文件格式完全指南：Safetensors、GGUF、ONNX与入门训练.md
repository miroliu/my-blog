---
title: "大模型文件格式完全指南：从入门到实践"
description: "详解大模型常用文件格式（Safetensors、Pickle、HDF5、GGUF等）、如何使用这些格式、以及如何进行简单的模型训练"
date: 2026-04-22T16:00:00+08:00
categories: ["技术分享"]
tags:
  - 大语言模型
  - 模型格式
  - Safetensors
  - GGUF
  - PyTorch
  - 模型训练
comments: true
---

## 前言

"大模型的权重文件是什么格式？"

"Safetensors和Pickle有什么区别？"

"GGUF是什么？手机上能跑大模型吗？"

"我想训练自己的模型，从哪里开始？"

这些问题是很多AI爱好者经常遇到的。今天我们就来全面解答。

---

## 一、大模型文件格式一览

### 1.1 主流格式汇总

```
┌─────────────────────────────────────────────────────────────────┐
│                    大模型文件格式总览                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   PyTorch格式 (.pt, .pth)               │   │
│   │                   最通用，但安全性存疑                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   Safetensors格式 (.safetensors)         │   │
│   │                   安全快速，大模型默认推荐               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   GGUF格式 (.gguf, .ggml)               │   │
│   │                   量化模型专用，CPU/手机可运行           │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   HuggingFace格式 (model.safetensors)    │   │
│   │                   HuggingFace生态默认格式               │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   TensorFlow格式 (.pb, .ckpt)           │   │
│   │                   TensorFlow/Keras使用                  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   ONNX格式 (.onnx)                      │   │
│   │                   跨框架通用，部署友好                   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 格式对比表

| 格式 | 扩展名 | 开发者 | 安全性 | 加载速度 | 适用场景 |
|------|--------|--------|--------|----------|----------|
| **PyTorch** | .pt, .pth | Meta | ⚠️ 有风险 | 慢 | 训练/研究 |
| **Safetensors** | .safetensors | HuggingFace | ✅ 安全 | 快 | 推理/部署 |
| **GGUF** | .gguf, .ggml | llama.cpp | ✅ 安全 | 快 | 本地推理 |
| **TensorFlow** | .pb, .ckpt | Google | ⚠️ 一般 | 中 | TF项目 |
| **ONNX** | .onnx | 微软/Meta | ✅ 安全 | 中 | 跨平台部署 |
| **HDF5** | .h5 | HDF Group | ✅ 安全 | 慢 | 科研/大文件 |
| **JAX** | .msgpack | Google | ✅ 安全 | 快 | JAX框架 |

---

## 二、PyTorch格式（.pt, .pth）

### 2.1 什么是PyTorch格式

```
┌─────────────────────────────────────────────────────────────────┐
│                    PyTorch格式详解                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PyTorch格式 = Python的Pickle序列化 + PyTorch的张量结构        │
│                                                                 │
│   特点：                                                        │
│   ├── ✅ 兼容性最好，几乎所有框架都能加载                        │
│   ├── ✅ PyTorch默认格式                                       │
│   ├── ✅ 支持完整的Python对象（包括自定义类）                    │
│   ├── ⚠️ 安全性问题：可以执行任意Python代码                    │
│   └── ⚠️ 加载速度慢，不支持零拷贝                              │
│                                                                 │
│   文件结构：                                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   model.pth                                              │   │
│   │   ├── model_state_dict  ← 模型权重                      │   │
│   │   ├── optimizer_state_dict ← 优化器状态                  │   │
│   │   ├── epoch          ← 训练轮次                        │   │
│   │   └── loss          ← 当前损失值                        │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 保存模型

```python
import torch
import torch.nn as nn

# 定义一个简单模型
class SimpleModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.linear1 = nn.Linear(10, 20)
        self.relu = nn.ReLU()
        self.linear2 = nn.Linear(20, 5)

    def forward(self, x):
        x = self.linear1(x)
        x = self.relu(x)
        x = self.linear2(x)
        return x

# 创建模型
model = SimpleModel()

# ========== 方式1：保存整个模型（包括结构）==========
torch.save(model, 'model_whole.pt')

# ========== 方式2：只保存权重（推荐）==========
torch.save(model.state_dict(), 'model_weights.pt')

# ========== 方式3：保存检查点（训练中断恢复）==========
checkpoint = {
    'epoch': 10,
    'model_state_dict': model.state_dict(),
    'optimizer_state_dict': optimizer.state_dict(),
    'loss': 0.25,
}
torch.save(checkpoint, 'checkpoint.pt')
```

### 2.3 加载模型

```python
import torch

# ========== 方式1：加载整个模型 ==========
model = torch.load('model_whole.pt')  # 不推荐，有安全隐患

# ========== 方式2：加载权重（推荐）==========
model = SimpleModel()  # 先创建模型结构
model.load_state_dict(torch.load('model_weights.pt'))
model.eval()  # 设置为评估模式

# ========== 方式3：加载检查点 ==========
checkpoint = torch.load('checkpoint.pt')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
start_epoch = checkpoint['epoch'] + 1
```

### 2.4 注意事项

```
┌─────────────────────────────────────────────────────────────────┐
│                    PyTorch格式注意事项                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ⚠️ 安全警告：                                                 │
│   ├── .pt/.pth文件可能包含恶意代码                              │
│   ├── 永远不要加载来源不明的模型文件                            │
│   └── 可能导致代码执行漏洞                                      │
│                                                                 │
│   💡 最佳实践：                                                 │
│   ├── 生产环境优先使用Safetensors                               │
│   ├── 只加载可信来源的模型                                      │
│   └── 使用torch.load时设置weights_only=False要谨慎              │
│                                                                 │
│   📊 文件大小：                                                 │
│   ├── 7B模型 ≈ 14GB (FP32)                                    │
│   ├── 7B模型 ≈ 7GB (FP16)                                     │
│   └── 7B模型 ≈ 3.5GB (INT8)                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、Safetensors格式

### 3.1 什么是Safetensors

```
┌─────────────────────────────────────────────────────────────────┐
│                    Safetensors格式详解                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Safetensors = HuggingFace开发的安全张量序列化格式              │
│                                                                 │
│   核心优势：                                                    │
│   ├── ✅ 零拷贝加载：直接映射到内存，不拷贝数据                  │
│   ├── ✅ 安全性：不能执行任意Python代码                         │
│   ├── ✅ 快速：加载速度比PyTorch快2-10倍                        │
│   ├── ✅ 分片：支持大模型分片存储                                │
│   └── ✅ 流式加载：可以只加载部分权重                           │
│                                                                 │
│   对比PyTorch：                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   PyTorch:  读取文件 → 反序列化 → 拷贝到内存           │   │
│   │              (慢，因为有多次拷贝)                      │   │
│   │                                                         │   │
│   │   Safetensors: 内存映射 → 直接使用                     │   │
│   │              (快，零拷贝)                              │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 保存模型

```python
from safetensors.torch import save_file
import torch

# 假设我们有权重字典
tensors = {
    "model.layer1.weight": torch.randn(512, 512),
    "model.layer1.bias": torch.randn(512),
    "model.layer2.weight": torch.randn(512, 512),
    "model.layer2.bias": torch.randn(512),
}

# 保存为Safetensors格式
save_file(tensors, "model.safetensors")

# 分片保存（大模型）
save_file(tensors, "model_part1.safetensors")
```

### 3.3 加载模型

```python
from safetensors import safe_open
import torch

# 方法1：一次性加载
from safetensors.torch import load_file
state_dict = load_file("model.safetensors")
print(state_dict.keys())

# 方法2：流式加载（只加载需要的层）
with safe_open("model.safetensors", framework="pt", device="cpu") as f:
    # 只加载特定的key
    layer1_weight = f.get_tensor("model.layer1.weight")
    print(f"Shape: {layer1_weight.shape}")
```

### 3.4 HuggingFace使用

```python
from transformers import AutoModel, AutoTokenizer

# 自动使用Safetensors格式
model = AutoModel.from_pretrained(
    "meta-llama/Llama-2-7b",
    trust_remote_code=True
)

# 模型会自动保存为Safetensors格式
# tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b")

# 手动指定保存格式
model.save_pretrained(
    "my_model",
    safe_serialization=True  # 强制使用Safetensors
)
```

---

## 四、GGUF格式（量化模型）

### 4.1 什么是GGUF

```
┌─────────────────────────────────────────────────────────────────┐
│                    GGUF格式详解                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   GGUF = GPU Model Format（ llama.cpp 项目）                    │
│                                                                 │
│   核心用途：                                                    │
│   ├── 让大模型能在CPU/手机/树莓派上运行                          │
│   ├── 量化压缩，减小模型体积                                    │
│   └── 高速推理，无需GPU                                        │
│                                                                 │
│   量化级别：                                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   Q2_K  ━━━━━━━━━━━━━━━━━━━ 2bit量化                    │   │
│   │   Q3_K  ━━━━━━━━━━━━━━━━ 3bit量化                    │   │
│   │   Q4_0  ━━━━━━━━━━━━━━━━ 4bit量化                    │   │
│   │   Q4_K_M ━━━━━━━━━━━━━━ 4bit量化(中质量)            │   │
│   │   Q5_0  ━━━━━━━━━━━━━━ 5bit量化                      │   │
│   │   Q5_K_M ━━━━━━━━━━━━ 5bit量化(中质量)              │   │
│   │   Q6_K  ━━━━━━━━━━━━ 6bit量化                      │   │
│   │   Q8_0  ━━━━━━━━━━ 8bit量化(接近FP16)              │   │
│   │   F16   ━━━━━━━━ 16bit浮点(原始精度)              │   │
│   │   F32   ━━━━ 32bit浮点(双精度)                  │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   7B模型大小参考：                                             │
│   ├── F16: ~14GB（需要16GB+显存/内存）                        │
│   ├── Q8_0: ~7GB（需要8GB+）                                  │
│   ├── Q6_K: ~5.5GB（需要6GB+）                                │
│   ├── Q5_K_M: ~4.5GB（需要5GB+）                              │
│   ├── Q4_K_M: ~4GB（需要4GB+）                                │
│   ├── Q3_K_M: ~3.5GB（需要4GB+）                             │
│   └── Q2_K: ~2.75GB（需要3GB+）                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 模型转换（FP16 → GGUF）

```python
# 使用llama.cpp工具转换

# 1. 安装llama.cpp
pip install llama-cpp-python

# 2. 下载HuggingFace模型
# git clone https://huggingface.co/meta-llama/Llama-2-7b

# 3. 转换模型
# 使用convert.py脚本
python llama.cpp/convert.py \
    --model-dir Llama-2-7b \
    --outfile model.gguf \
    --outtype f16  # 或 q4_k_m, q8_0等

# 4. 量化（进一步压缩）
./quantize ./model.gguf ./model-Q4_K_M.gguf Q4_K_M
```

### 4.3 使用GGUF模型

#### 使用llama.cpp Python API

```python
from llama_cpp import Llama

# 加载GGUF模型
llm = Llama(
    model_path="./model-Q4_K_M.gguf",
    n_ctx=2048,      # 上下文长度
    n_threads=4,     # CPU线程数
    n_gpu_layers=0,  # GPU层数（0=纯CPU）
)

# 生成文本
response = llm.create_chat_completion(
    messages=[
        {"role": "system", "content": "你是一个有帮助的助手"},
        {"role": "user", "content": "解释什么是量子计算"}
    ]
)

print(response['choices'][0]['message']['content'])
```

#### 使用Ollama（推荐）

```bash
# 安装Ollama
# Mac: brew install ollama
# Linux: curl -fsSL https://ollama.com/install.sh | sh
# Windows: 下载安装包

# 运行GGUF模型
ollama run llama2

# 或者导入本地GGUF模型
ollama create mymodel -f ./Modelfile
# Modelfile内容：
# FROM ./model-Q4_K_M.gguf
# PARAMETER temperature 0.7
# SYSTEM "你是一个有帮助的助手"

# 使用模型
ollama run mymodel
```

#### 使用text-generation-webui

```bash
# 克隆项目
git clone https://github.com/oobabooga/text-generation-webui.git
cd text-generation-webui

# 下载模型到models目录
# 模型会自动转换为GGUF格式

# 启动
python server.py --model model-name --n-gpu-layers 0
```

---

## 五、ONNX格式（跨平台部署）

### 5.1 什么是ONNX

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONNX格式详解                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ONNX = Open Neural Network Exchange                           │
│                                                                 │
│   核心用途：                                                    │
│   ├── 模型跨框架转换（PyTorch ↔ TensorFlow）                    │
│   ├── 部署到各种平台（Windows/Linux/Mac/移动端）                │
│   ├── 硬件加速优化（TensorRT/ONNX Runtime）                    │
│   └── 推理优化，减少延迟                                        │
│                                                                 │
│   支持的框架：                                                  │
│   ├── PyTorch                                                  │
│   ├── TensorFlow/Keras                                         │
│   ├── Scikit-learn                                             │
│   ├── MXNet                                                    │
│   └── 更多...                                                   │
│                                                                 │
│   部署平台：                                                    │
│   ├── Windows (.NET)                                           │
│   ├── Linux (C++/Python)                                       │
│   ├── 移动端 (iOS/Android)                                    │
│   ├── Web (WebAssembly)                                        │
│   └── 云端 (Azure, AWS)                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 PyTorch → ONNX

```python
import torch
import torch.onnx

# 定义模型
class SimpleModel(torch.nn.Module):
    def __init__(self):
        super().__init__()
        self.linear = torch.nn.Linear(10, 5)

    def forward(self, x):
        return self.linear(x)

model = SimpleModel()
model.eval()

# 导出为ONNX
dummy_input = torch.randn(1, 10)  # Batch=1, Input=10
output_path = "model.onnx"

torch.onnx.export(
    model,
    dummy_input,
    output_path,
    export_params=True,
    opset_version=14,          # ONNX算子集版本
    do_constant_folding=True,   # 常量折叠优化
    input_names=['input'],      # 输入名称
    output_names=['output'],    # 输出名称
    dynamic_axes={              # 动态维度
        'input': {0: 'batch_size'},
        'output': {0: 'batch_size'}
    }
)

print(f"模型已导出到: {output_path}")
```

### 5.3 ONNX Runtime推理

```python
import onnxruntime as ort
import numpy as np

# 创建推理会话
session = ort.InferenceSession("model.onnx")

# 准备输入
input_data = np.random.randn(1, 10).astype(np.float32)

# 推理
outputs = session.run(
    None,  # 输出名称，None表示所有输出
    {"input": input_data}
)

print(f"输出形状: {outputs[0].shape}")
print(f"输出结果: {outputs[0]}")
```

---

## 六、模型格式选择指南

### 6.1 根据场景选择

```
┌─────────────────────────────────────────────────────────────────┐
│                    模型格式选择决策树                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   开始                                                           │
│     │                                                          │
│     ▼                                                          │
│   你要做什么？                                                  │
│     │                                                          │
│     ├─ 训练模型 ──→ PyTorch (.pt)                             │
│     │                                                          │
│     ├─ 推理部署 ──→ HuggingFace Safetensors                   │
│     │                                                          │
│     ├─ 本地运行（无GPU）─→ GGUF                               │
│     │                                                          │
│     ├─ 跨平台部署 ──→ ONNX                                    │
│     │                                                          │
│     └─ 移动端/嵌入式 ──→ TensorFlow Lite / ONNX Runtime        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 格式对比详情

| 场景 | 推荐格式 | 原因 |
|------|----------|------|
| **PyTorch训练** | .pt/.pth | 原生支持，功能完整 |
| **HuggingFace推理** | .safetensors | HF默认，安全快速 |
| **本地CPU运行** | .gguf | 量化支持，内存友好 |
| **移动端部署** | .tflite/.onnx | 跨平台，体积小 |
| **生产环境部署** | .safetensors | 安全，可靠 |
| **模型转换中间格式** | .onnx | 通用，标准化 |

---

## 七、模型文件结构解析

### 7.1 HuggingFace模型结构

```
┌─────────────────────────────────────────────────────────────────┐
│                    HuggingFace模型目录结构                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   my-model/                    ← 模型目录                        │
│   │                                                              │
│   ├── config.json             ← 配置文件（模型架构）             │
│   ├── model.safetensors       ← 模型权重                        │
│   ├── tokenizer.json          ← 分词器配置                       │
│   ├── tokenizer_config.json   ← 分词器设置                       │
│   ├── vocab.json              ← 词表                            │
│   ├── merges.txt              ← BPE合并规则                     │
│   ├── special_tokens_map.json ← 特殊token映射                   │
│   └── generation_config.json  ← 生成配置                        │
│                                                                 │
│   config.json示例：                                             │
│   {                                                           │
│     "architectures": ["LlamaForCausalLM"],                     │
│     "hidden_size": 4096,                                       │
│     "num_attention_heads": 32,                                 │
│     "num_hidden_layers": 32,                                   │
│     "vocab_size": 32000,                                      │
│     "rope_theta": 10000,                                       │
│     ...                                                        │
│   }                                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 查看模型信息

```python
from transformers import AutoConfig, AutoModel

# 加载配置（不加载权重）
config = AutoConfig.from_pretrained("meta-llama/Llama-2-7b")
print(f"模型类型: {config.architectures}")
print(f"隐藏层大小: {config.hidden_size}")
print(f"注意力头数: {config.num_attention_heads}")
print(f"层数: {config.num_hidden_layers}")
print(f"词表大小: {config.vocab_size}")

# 估算模型大小
param_count = sum(p.numel() for p in config.parameters())
print(f"参数数量: {param_count:,}")
print(f"模型大小(F32): {param_count * 4 / 1e9:.2f} GB")
print(f"模型大小(F16): {param_count * 2 / 1e9:.2f} GB")
print(f"模型大小(Q8): {param_count * 1 / 1e9:.2f} GB")
```

---

## 八、模型训练入门

### 8.1 训练环境准备

```
┌─────────────────────────────────────────────────────────────────┐
│                    训练环境准备                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   硬件要求（以7B模型为例）：                                    │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   全参数训练：                                          │   │
│   │   ├── GPU: 8× A100 (80GB) 或更高                       │   │
│   │   ├── 内存: 512GB+                                     │   │
│   │   └── 存储: 1TB+ SSD                                   │   │
│   │                                                         │   │
│   │   LoRA微调：                                           │   │
│   │   ├── GPU: 1× RTX 3090/4090 (24GB) 或更高              │   │
│   │   ├── 内存: 64GB+                                      │   │
│   │   └── 存储: 500GB+ SSD                                 │   │
│   │                                                         │   │
│   │   QLoRA微调：                                          │   │
│   │   ├── GPU: 1× RTX 3080 (10GB) 即可                    │   │
│   │   ├── 内存: 32GB+                                      │   │
│   │   └── 存储: 200GB+ SSD                                 │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   软件环境：                                                    │
│   ├── Python 3.9+                                             │
│   ├── PyTorch 2.0+                                            │
│   ├── Transformers 4.30+                                      │
│   ├── CUDA 11.8+ / cuDNN 8.0+                                │
│   └── 常用库: accelerate, peft, bitsandbytes                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 全参数训练示例

```python
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import load_dataset
import torch

# 1. 加载模型和分词器
model_name = "meta-llama/Llama-2-7b"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,  # FP16训练
    device_map="auto"
)

# 2. 准备数据集
def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        truncation=True,
        max_length=512,
        padding="max_length"
    )

# 加载示例数据集
dataset = load_dataset("wikipedia", "zh", split="train[:1000]")
tokenized_dataset = dataset.map(tokenize_function, batched=True)

# 3. 配置训练参数
training_args = TrainingArguments(
    output_dir="./output",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-5,
    num_train_epochs=3,
    fp16=True,                    # 混合精度
    save_steps=100,
    save_total_limit=3,
    logging_steps=10,
    warmup_steps=100,
)

# 4. 创建Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
    data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
)

# 5. 开始训练
trainer.train()

# 6. 保存模型
trainer.save_model("./my-trained-model")
tokenizer.save_pretrained("./my-trained-model")
```

### 8.3 LoRA微调（推荐入门）

```python
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer
)
from peft import LoraConfig, get_peft_model, TaskType
import torch

# 1. 加载模型
model_name = "meta-llama/Llama-2-7b"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.float16,
    device_map="auto"
)

# 2. 配置LoRA
lora_config = LoraConfig(
    r=8,                          # LoRA秩（越大效果越好，但更慢）
    lora_alpha=16,                # LoRA alpha参数
    target_modules=[               # 目标模块
        "q_proj",
        "v_proj",
        "k_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj"
    ],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM
)

# 3. 应用LoRA
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# 可训练参数: ~0.1%（原始7B参数的千分之一）

# 4. 训练参数
training_args = TrainingArguments(
    output_dir="./lora-output",
    per_device_train_batch_size=4,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,          # LoRA可以用更高的学习率
    num_train_epochs=3,
    fp16=True,
    save_steps=100,
    logging_steps=10,
)

# 5. 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
)

trainer.train()

# 6. 合并权重并保存
model = model.merge_and_unload()
model.save_pretrained("./final-model")
```

### 8.4 QLoRA微调（最低配置）

```python
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import torch

# 1. 4位量化配置
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,                    # 4位加载
    bnb_4bit_quant_type="nf4",           # NF4量化类型
    bnb_4bit_compute_dtype=torch.float16,  # 计算精度
    bnb_4bit_use_double_quant=True,        # 双重量化
)

# 2. 加载量化模型
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto"
)

# 3. 准备训练
model = prepare_model_for_kbit_training(model)

# 4. 应用LoRA
lora_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM
)

model = get_peft_model(model, lora_config)

# 5. 训练配置
training_args = TrainingArguments(
    output_dir="./qlora-output",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    num_train_epochs=3,
    fp16=True,
    logging_steps=10,
)

# 6. 训练
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset,
)

trainer.train()
```

### 8.5 训练方式对比

```
┌─────────────────────────────────────────────────────────────────┐
│                    训练方式对比                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    全参数训练 (Full Fine-tuning)         │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   训练参数：100%                                       │   │
│   │   GPU需求：8× A100 (80GB)                             │   │
│   │   效果：最好                                           │   │
│   │   速度：最慢                                           │   │
│   │   成本：最高                                           │   │
│   │                                                         │   │
│   │   适用：有充足算力的企业/研究                           │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    LoRA微调                              │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   训练参数：~0.1-1%                                    │   │
│   │   GPU需求：1× RTX 3090 (24GB)                         │   │
│   │   效果：接近全参数                                     │   │
│   │   速度：快                                             │   │
│   │   成本：中                                             │   │
│   │                                                         │   │
│   │   适用：个人开发者/中小企业                             │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    QLoRA微调（推荐入门）                 │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │                                                         │   │
│   │   训练参数：~0.1%                                      │   │
│   │   GPU需求：1× RTX 3080 (10GB)                         │   │
│   │   效果：接近LoRA                                       │   │
│   │   速度：中                                             │   │
│   │   成本：低                                             │   │
│   │                                                         │   │
│   │   适用：预算有限的个人开发者                            │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 九、常见问题

### 9.1 模型加载相关

```
┌─────────────────────────────────────────────────────────────────┐
│                    模型加载常见问题Q&A                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Q: 模型加载很慢怎么办？                                       │
│   A: 改用Safetensors格式，支持零拷贝加载                        │
│                                                                 │
│   Q: 提示"Out of memory"？                                     │
│   A: 使用量化模型（GGUF Q4_K_M）或减小batch_size               │
│                                                                 │
│   Q: 找不到模型？                                              │
│   A: 检查HuggingFace模型ID，或手动下载到本地                   │
│                                                                 │
│   Q: 加载报错"Unexpected key"?                                 │
│   A: 模型权重与模型结构不匹配，检查config.json                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 模型格式转换

```
┌─────────────────────────────────────────────────────────────────┐
│                    模型格式转换Q&A                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Q: PyTorch → Safetensors?                                     │
│   A:                                                              │
│   ```python                                                      │
│   from safetensors.torch import save_file                       │
│   state_dict = torch.load("model.pt")                           │
│   save_file(state_dict, "model.safetensors")                    │
│   ```                                                            │
│                                                                 │
│   Q: PyTorch → ONNX?                                            │
│   A:                                                              │
│   ```python                                                      │
│   torch.onnx.export(model, input, "model.onnx")                 │
│   ```                                                            │
│                                                                 │
│   Q: HF模型 → GGUF?                                             │
│   A: 使用llama.cpp的convert.py脚本                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 十、总结

### 10.1 格式选择速查

| 需求 | 格式 | 命令/方法 |
|------|------|-----------|
| 训练模型 | .pt/.pth | torch.save |
| HuggingFace推理 | .safetensors | model.save_pretrained(safe_serialization=True) |
| 本地CPU运行 | .gguf | llama.cpp转换 |
| 跨平台部署 | .onnx | torch.onnx.export |
| 手机端部署 | .tflite | TensorFlow Lite转换器 |

### 10.2 入门路线图

```
┌─────────────────────────────────────────────────────────────────┐
│                    模型学习路线                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   第一阶段：了解格式                                             │
│   ├── 知道Safetensors是安全的                                   │
│   ├── 知道GGUF是给CPU用的                                      │
│   └── 能下载和使用HuggingFace模型                              │
│                                                                 │
│   第二阶段：运行模型                                            │
│   ├── 本地运行GGUF模型（Ollama）                                │
│   ├── 使用HuggingFace Transformers                              │
│   └── 部署简单推理服务                                          │
│                                                                 │
│   第三阶段：微调模型                                            │
│   ├── QLoRA微调小模型                                          │
│   ├── 准备数据集                                                │
│   └── 训练并部署                                                │
│                                                                 │
│   第四阶段：深入研究                                            │
│   ├── 全参数训练                                                │
│   ├── 模型架构理解                                              │
│   └── 自定义训练流程                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 推荐工具

| 工具 | 用途 | 链接 |
|------|------|------|
| **HuggingFace** | 模型托管/下载 | huggingface.co |
| **Ollama** | 本地运行LLM | ollama.com |
| **llama.cpp** | 量化/推理 | github.com/ggerganov/llama.cpp |
| **text-generation-webui** | Web界面 | github.com/oobabooga/text-generation-webui |
| **Axolotl** | 训练工具 | github.com/OpenAccess-AI-Collective/axolotl |
| **LLaMA Factory** | 训练UI | github.com/hiyouga/LLaMA-Factory |

---

*希望这篇文章能帮你全面了解大模型文件格式！如果有问题，欢迎在评论区交流。*
