---
title: "IT天空 万能驱动EasyDrv，EasyU命令安装驱动简介"
date: 2025-10-28T09:25:00+08:00
categories:
  - 桌面运维
image:
math:
license:
hidden: false
comments: true
draft: false
tags:
  - 驱动安装

---
## IT天空 万能驱动EasyDrv，EasyU命令安装驱动简介

#### 简介
IT天空的万能驱动是经常使用的一个工具，封装了大部分驱动。

IT天空 - 新的十年，新的天空 (itsk.com)

是我脑子坏了？还是域名换了。

#### 主要备忘#
运行参数

（1）/r 或 /reboot

自动重启（部署中无效）


（2）/u 或 /unzip
只解压不安装（PE下无效）

（3）/c 或 /clean
安装后删除已解压驱动

（4）/a 或 /auto
自动执行（兼容fa/forceAuto旧参数），部署中无需设置此参数亦自动

可以组合使用，例如安装完成后自动删除已解压的驱动再重启，/a /c /r

 

静默安装参数一直是我们的痛。这个藏的比较深，怕忘记，先记下。


原文转至
https://www.cnblogs.com/jackadam/p/18174196