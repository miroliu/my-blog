---
title: "OpenStack云平台部署实战：详细安装步骤与配置指南"
date: 2025-10-25T11:00:00+08:00
draft: false
categories: ["云原生"]
tags: ["OpenStack", "安装部署", "配置指南", "Kolla-Ansible"]
author: "技术教程"
---

# OpenStack云平台部署实战：详细安装步骤与配置指南

## 前言

部署OpenStack云平台是一个复杂的系统工程，涉及多个服务组件的安装、配置和集成。选择合适的部署方法和工具对于成功搭建OpenStack环境至关重要。本文将详细介绍OpenStack的部署方法，包括手动部署和自动化部署工具的使用，并提供一个完整的多节点部署实例，帮助读者顺利构建自己的OpenStack云平台。

## 一、OpenStack部署方法概述

### 1.1 部署方法比较

**手动部署**
- **优点**：灵活性高，对系统有深入理解
- **缺点**：步骤繁琐，容易出错，维护难度大
- **适用场景**：学习环境、小规模测试、定制化需求

**自动化部署**
- **优点**：部署速度快，一致性好，便于维护
- **缺点**：定制化程度相对较低
- **适用场景**：生产环境、大规模部署、快速部署

### 1.2 主流部署工具

**Kolla-Ansible**
- 基于Docker容器化部署
- 使用Ansible自动化工具
- 支持多节点和高可用部署
- 官方推荐的部署工具之一

**DevStack**
- 专为开发和测试设计
- 单节点快速部署
- 支持一键安装所有组件

**Packstack**
- 基于RHEL/CentOS的部署工具
- 使用Puppet自动化
- 支持单节点和多节点部署

**TripleO (OpenStack on OpenStack)**
- 高级部署工具
- 支持裸机部署
- 适合大规模生产环境

**Charmed OpenStack**
- 基于Juju编排工具
- 支持自动化运维和升级
- 适合企业级部署

### 1.3 部署前准备工作

**硬件要求**
- **控制节点**：至少8GB内存，推荐16GB；至少4核CPU；至少100GB存储
- **计算节点**：至少8GB内存；至少4核CPU；至少100GB存储；支持硬件虚拟化(Intel VT-x或AMD-V)
- **存储节点**：根据需求配置大容量存储；推荐使用SSD提升性能
- **网络要求**：至少两张网卡，一张用于管理网络，一张用于数据网络

**软件要求**
- **操作系统**：Ubuntu Server 20.04 LTS或CentOS/RHEL 8.x
- **Python版本**：Python 3.6+
- **Docker**：Kolla-Ansible部署方式需要
- **网络服务**：NTP服务同步时间

**网络规划**
- **管理网络**：用于OpenStack组件间通信
- **数据网络**：用于虚拟机数据传输
- **外部网络**：连接互联网的网络
- **API网络**：提供API服务访问

## 二、使用Kolla-Ansible部署OpenStack

### 2.1 Kolla-Ansible简介

Kolla-Ansible是OpenStack官方推荐的容器化部署工具，它使用Docker容器运行OpenStack服务组件，并通过Ansible实现自动化部署和配置。Kolla-Ansible支持多种部署模式，包括单节点开发环境和多节点生产环境。

### 2.2 环境准备

**系统要求**
- 操作系统：Ubuntu 20.04 LTS或CentOS 8
- 控制节点至少16GB内存
- 所有节点需要支持SSH免密码登录
- 所有节点需要安装Python 3和pip

**配置主机名和hosts文件**

以控制节点为例，配置主机名：

```bash
# Ubuntu系统
sudo hostnamectl set-hostname controller

# CentOS系统
sudo hostnamectl set-hostname controller
```

编辑/etc/hosts文件，添加所有节点的IP和主机名映射：

```bash
192.168.10.10  controller
192.168.10.11  compute1
192.168.10.12  compute2
192.168.10.13  storage1
192.168.10.14  network1
```

**安装依赖包**

Ubuntu系统：
```bash
sudo apt update
sudo apt install -y python3-dev python3-pip libffi-dev gcc libssl-dev git
```

CentOS系统：
```bash
sudo dnf install -y python3-devel python3-pip gcc openssl-devel libffi-devel git
```

**升级pip并安装Ansible**

```bash
pip3 install --upgrade pip
pip3 install ansible==5.10.0
```

### 2.3 安装Kolla-Ansible

**克隆Kolla-Ansible代码库**

```bash
git clone https://opendev.org/openstack/kolla-ansible.git
cd kolla-ansible
git checkout stable/xena  # 根据需要选择版本
```

**安装Kolla-Ansible**

```bash
pip3 install -e .
```

**复制配置文件**

```bash
# 创建配置目录
sudo mkdir -p /etc/kolla
cp -r etc/kolla/* /etc/kolla/

# 复制Ansible inventory文件
cp ansible/inventory/all-in-one ansible/inventory/multinode /etc/kolla/
```

### 2.4 配置Kolla-Ansible

**编辑Ansible inventory文件**

对于多节点部署，编辑/etc/kolla/multinode文件：

```ini
[control]
controller ansible_user=ubuntu ansible_password=your_password

[network]
network1 ansible_user=ubuntu ansible_password=your_password

[compute]
compute1 ansible_user=ubuntu ansible_password=your_password
compute2 ansible_user=ubuntu ansible_password=your_password

[storage]
storage1 ansible_user=ubuntu ansible_password=your_password

[monitoring]
controller ansible_user=ubuntu ansible_password=your_password

[deployment:children]
control
network
compute
storage
```

**配置Kolla部署参数**

编辑/etc/kolla/globals.yml文件，设置基本配置参数：

```yaml
# 部署类型：source或binary\kkolla_install_type: "binary"

# OpenStack版本\kkolla_internal_vip_address: "192.168.10.254"

# 网络配置
network_interface: "ens33"
neutron_external_interface: "ens34"

# 启用的服务
enable_cinder: "yes"
enable_manila: "no"
enable_ceph: "yes"
enable_prometheus: "yes"

# 认证方式
keystone_admin_password: "admin_password"

# 选择安装的OpenStack版本
enable_horizon: "yes"
enable_neutron_vpnaas: "no"
enable_neutron_fwaas: "no"
enable_neutron_lbaas: "no"
```

**生成随机密码**

```bash
cd /etc/kolla
kolla-genpwd
```

### 2.5 运行部署前检查

```bash
ansible -i /etc/kolla/multinode all -m ping
kolla-ansible -i /etc/kolla/multinode prechecks
```

### 2.6 执行部署

**部署基础服务**

```bash
kolla-ansible -i /etc/kolla/multinode bootstrap-servers
```

**部署OpenStack服务**

```bash
kolla-ansible -i /etc/kolla/multinode deploy
```

### 2.7 部署后配置

**安装OpenStack客户端**

```bash
pip3 install python-openstackclient python-glanceclient python-neutronclient
```

**生成OpenStack环境变量脚本**

```bash
kolla-ansible -i /etc/kolla/multinode post-deploy
```

**加载环境变量**

```bash
source /etc/kolla/admin-openrc.sh
```

**验证部署**

```bash
openstack service list
openstack endpoint list
openstack user list
```

## 三、使用DevStack部署单节点OpenStack

### 3.1 DevStack简介

DevStack是一个用于快速部署OpenStack开发环境的脚本集。它支持一键安装所有OpenStack组件，适合开发测试和学习使用。DevStack通常部署在单节点上，配置相对简单。

### 3.2 DevStack安装步骤

**系统要求**
- 操作系统：Ubuntu 20.04 LTS或CentOS 8
- 至少8GB内存，推荐16GB
- 至少100GB存储
- 支持硬件虚拟化

**创建stack用户**

```bash
sudo useradd -s /bin/bash -d /opt/stack -m stack
echo "stack ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/stack
```

**切换到stack用户**

```bash
sudo su - stack
```

**克隆DevStack代码库**

```bash
git clone https://opendev.org/openstack/devstack.git
cd devstack
```

**创建local.conf配置文件**

```ini
[[local|localrc]]
ADMIN_PASSWORD=secret
DATABASE_PASSWORD=$ADMIN_PASSWORD
RABBIT_PASSWORD=$ADMIN_PASSWORD
SERVICE_PASSWORD=$ADMIN_PASSWORD

# 启用的服务
ENABLED_SERVICES=key,glance,nova,n-crt,n-obj,n-cpu,n-cond,n-sch,n-api,n-cauth,neutron,q-svc,q-agt,q-dhcp,q-l3,q-meta,horizon,cinder,c-api,c-vol,c-sch

# 网络配置
HOST_IP=192.168.10.10
FLOATING_RANGE=192.168.20.0/24
PUBLIC_NETWORK_GATEWAY=192.168.20.1
Q_FLOATING_ALLOCATION_POOL=start=192.168.20.10,end=192.168.20.100
PUBLIC_INTERFACE=eth0
```

**执行安装脚本**

```bash
./stack.sh
```

**验证安装**

安装完成后，可以通过以下方式验证：
- Web界面：http://[主机IP]/dashboard
- 命令行：使用openstack命令

## 四、多节点OpenStack部署实战

### 4.1 网络拓扑规划

本实战案例使用5台服务器部署OpenStack多节点环境：
- 1台控制节点：运行核心服务组件
- 2台计算节点：运行虚拟机实例
- 1台存储节点：提供存储服务
- 1台网络节点：处理网络流量

**网络配置**
- 管理网络：192.168.10.0/24
- 数据网络：192.168.20.0/24
- 外部网络：172.16.1.0/24
- API VIP：192.168.10.254

### 4.2 控制节点部署

**安装前准备**

```bash
# 更新系统
sudo apt update
sudo apt upgrade -y

# 安装依赖包
sudo apt install -y python3-dev python3-pip libffi-dev gcc libssl-dev git

# 配置NTP服务
sudo apt install -y chrony
sudo systemctl enable chrony
sudo systemctl start chrony

# 关闭防火墙和SELinux(生产环境建议配置适当的规则)
sudo ufw disable
```

**安装和配置数据库**

```bash
# 安装MariaDB
sudo apt install -y mariadb-server python3-pymysql

# 配置MySQL
sudo tee /etc/mysql/mariadb.conf.d/99-openstack.cnf << EOF
[mysqld]
bind-address = 0.0.0.0
default-storage-engine = innodb
innodb_file_per_table = on
max_connections = 4096
collation-server = utf8_general_ci
character-set-server = utf8
EOF

# 重启MySQL服务
sudo systemctl restart mariadb
sudo systemctl enable mariadb

# 安全配置MySQL
sudo mysql_secure_installation
```

**安装和配置消息队列**

```bash
# 安装RabbitMQ
sudo apt install -y rabbitmq-server

# 创建OpenStack用户
sudo rabbitmqctl add_user openstack RABBIT_PASS
sudo rabbitmqctl set_permissions openstack ".*" ".*" ".*"
```

**安装和配置Memcached**

```bash
# 安装Memcached
sudo apt install -y memcached python3-memcache

# 配置Memcached
sudo sed -i 's/127.0.0.1/0.0.0.0/g' /etc/memcached.conf
sudo systemctl restart memcached
sudo systemctl enable memcached
```

### 4.3 核心服务安装

**安装Keystone服务**

```bash
# 创建数据库和用户
mysql -u root -p -e "CREATE DATABASE keystone;"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'localhost' IDENTIFIED BY 'KEYSTONE_DBPASS';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON keystone.* TO 'keystone'@'%' IDENTIFIED BY 'KEYSTONE_DBPASS';"

# 安装Keystone包
sudo apt install -y keystone

# 配置Keystone
sudo tee /etc/keystone/keystone.conf << EOF
[database]
connection = mysql+pymysql://keystone:KEYSTONE_DBPASS@controller/keystone

[token]
driver = fernet
EOF

# 同步数据库
sudo su -s /bin/sh -c "keystone-manage db_sync" keystone

# 初始化Fernet密钥存储
sudo keystone-manage fernet_setup --keystone-user keystone --keystone-group keystone
sudo keystone-manage credential_setup --keystone-user keystone --keystone-group keystone

# 引导身份服务
sudo keystone-manage bootstrap --bootstrap-password ADMIN_PASS \
  --bootstrap-admin-url http://controller:5000/v3/ \
  --bootstrap-internal-url http://controller:5000/v3/ \
  --bootstrap-public-url http://controller:5000/v3/ \
  --bootstrap-region-id RegionOne

# 配置Apache服务
sudo tee /etc/apache2/apache2.conf << EOF
ServerName controller
EOF

# 重启Apache服务
sudo systemctl restart apache2
sudo systemctl enable apache2
```

**配置环境变量**

```bash
export OS_USERNAME=admin
export OS_PASSWORD=ADMIN_PASS
export OS_PROJECT_NAME=admin
export OS_USER_DOMAIN_NAME=Default
export OS_PROJECT_DOMAIN_NAME=Default
export OS_AUTH_URL=http://controller:5000/v3
export OS_IDENTITY_API_VERSION=3
```

**创建服务项目和角色**

```bash
openstack project create --domain default --description "Service Project" service
openstack role create user
```

### 4.4 计算节点配置

**安装依赖包**

```bash
sudo apt update
sudo apt install -y python3-dev python3-pip libffi-dev gcc libssl-dev
```

**安装Nova计算服务**

```bash
sudo apt install -y nova-compute

# 配置Nova
sudo tee /etc/nova/nova.conf << EOF
[DEFAULT]
enable_instance_password = true
my_ip = 192.168.10.11
use_neutron = true
firewall_driver = nova.virt.firewall.NoopFirewallDriver

[api]
auth_strategy = keystone

[keystone_authtoken]
www_authenticate_uri = http://controller:5000/
auth_url = http://controller:5000/
memcached_servers = controller:11211
auth_type = password
project_domain_name = Default
user_domain_name = Default
project_name = service
username = nova
password = NOVA_PASS

[vnc]
enabled = true
server_listen = 0.0.0.0
server_proxyclient_address = \$my_ip
novncproxy_base_url = http://controller:6080/vnc_auto.html

[glance]
api_servers = http://controller:9292

[oslo_concurrency]
lock_path = /var/lib/nova/tmp

[placement]
region_name = RegionOne
project_domain_name = Default
project_name = service
auth_type = password
user_domain_name = Default
auth_url = http://controller:5000/v3
username = placement
password = PLACEMENT_PASS
EOF

# 重启Nova计算服务
sudo systemctl restart nova-compute
sudo systemctl enable nova-compute
```

### 4.5 网络节点配置

**安装Neutron服务**

```bash
sudo apt install -y neutron-server neutron-plugin-ml2 neutron-linuxbridge-agent neutron-dhcp-agent neutron-metadata-agent

# 配置ML2插件
sudo tee /etc/neutron/plugins/ml2/ml2_conf.ini << EOF
[DEFAULT]

[ml2]
type_drivers = flat,vlan,vxlan
enable_security_group = true
mechanism_drivers = linuxbridge,l2population
extension_drivers = port_security

[ml2_type_flat]
flat_networks = provider

[ml2_type_vxlan]
vni_ranges = 1:1000

[securitygroup]
enable_ipset = true
EOF

# 重启Neutron服务
sudo systemctl restart neutron-server neutron-linuxbridge-agent neutron-dhcp-agent neutron-metadata-agent
sudo systemctl enable neutron-server neutron-linuxbridge-agent neutron-dhcp-agent neutron-metadata-agent
```

## 五、OpenStack部署后的验证与测试

### 5.1 验证服务状态

```bash
# 检查各服务状态
sudo systemctl status nova-api neutron-server glance-api cinder-api

# 检查容器状态(对于Kolla部署)
docker ps | grep openstack
```

### 5.2 创建测试虚拟机

**创建网络**

```bash
# 创建外部网络
openstack network create --external --provider-physical-network provider --provider-network-type flat provider

# 创建子网
openstack subnet create --network provider --allocation-pool start=192.168.20.10,end=192.168.20.100 --dns-nameserver 8.8.8.8 --gateway 192.168.20.1 --subnet-range 192.168.20.0/24 provider

# 创建内部网络
openstack network create selfservice

# 创建内部子网
openstack subnet create --network selfservice --dns-nameserver 8.8.8.8 --gateway 10.0.0.1 --subnet-range 10.0.0.0/24 selfservice

# 创建路由器
openstack router create router
openstack router set --external-gateway provider router
openstack router add subnet router selfservice
```

**创建密钥对**

```bash
openstack keypair create --public-key ~/.ssh/id_rsa.pub mykey
```

**创建安全组规则**

```bash
openstack security group rule create --proto icmp default
openstack security group rule create --proto tcp --dst-port 22 default
```

**创建虚拟机实例**

```bash
openstack flavor create --id 0 --vcpus 1 --ram 1024 --disk 10 m1.nano
openstack image create --disk-format qcow2 --container-format bare --public --file cirros-0.5.1-x86_64-disk.img cirros
openstack server create --flavor m1.nano --image cirros --nic net-id=$(openstack network show selfservice -f value -c id) --security-group default --key-name mykey test-vm
```

**分配浮动IP**

```bash
FLOATING_IP=$(openstack floating ip create provider -f value -c floating_ip_address)
openstack server add floating ip test-vm $FLOATING_IP
echo "虚拟机浮动IP: $FLOATING_IP"
```

### 5.3 验证虚拟机访问

```bash
# 测试SSH连接
ssh cirros@$FLOATING_IP

# 测试网络连通性
ping -c 4 $FLOATING_IP
```

## 六、OpenStack部署常见问题与解决方案

### 6.1 网络配置问题

**问题：** Neutron服务无法启动或网络连接失败

**解决方案：**
- 检查网络接口配置是否正确
- 验证防火墙设置是否允许相应端口
- 确保br_netfilter模块已加载：`modprobe br_netfilter`
- 检查Linux bridge配置：`brctl show`

### 6.2 存储服务问题

**问题：** Cinder卷创建失败或挂载失败

**解决方案：**
- 检查存储后端配置是否正确
- 验证卷服务状态：`systemctl status cinder-volume`
- 检查LVM配置：`pvdisplay`, `vgdisplay`, `lvdisplay`
- 查看日志文件：`/var/log/cinder/volume.log`

### 6.3 计算服务问题

**问题：** 虚拟机创建失败或无法启动

**解决方案：**
- 检查Nova服务状态：`systemctl status nova-compute`
- 验证计算节点资源是否充足
- 确认虚拟化支持：`egrep -c '(vmx|svm)' /proc/cpuinfo`
- 查看日志文件：`/var/log/nova/nova-compute.log`

### 6.4 认证服务问题

**问题：** Keystone认证失败

**解决方案：**
- 检查环境变量设置是否正确
- 验证数据库连接：`mysql -u keystone -p`
- 检查Apache服务状态：`systemctl status apache2`
- 查看日志文件：`/var/log/apache2/error.log`

## 结语

部署OpenStack云平台是一个复杂但有价值的过程。本文详细介绍了OpenStack的部署方法，包括使用Kolla-Ansible进行容器化部署和使用DevStack进行单节点快速部署，并提供了多节点部署的实战案例。在实际部署过程中，读者可能会遇到各种问题，需要根据具体情况进行排查和解决。通过本文的指导，希望读者能够成功部署自己的OpenStack云平台，为后续的学习和应用打下基础。

## 参考资源

1. OpenStack官方文档：https://docs.openstack.org/
2. Kolla-Ansible文档：https://docs.openstack.org/kolla-ansible/latest/
3. DevStack文档：https://docs.openstack.org/devstack/latest/
4. OpenStack部署最佳实践：https://docs.openstack.org/project-deploy-guide/kolla-ansible/latest/

---

**免责声明**：本文中的配置参数仅供参考，实际部署时请根据具体环境进行调整。在生产环境中部署OpenStack前，建议先在测试环境中进行充分验证。