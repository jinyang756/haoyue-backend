# MongoDB 管理工具使用指南

## 概述

本文档介绍如何配置和使用 MongoDB Compass 和 adminMongo 来管理皓月量化平台的数据库。

## 目录

1. [MongoDB Compass 配置](#mongodb-compass-配置)
2. [adminMongo 配置](#adminmongo-配置)
3. [连接测试](#连接测试)
4. [使用技巧](#使用技巧)

## MongoDB Compass 配置

### 安装

1. 访问 [MongoDB Compass 下载页面](https://www.mongodb.com/try/download/compass)
2. 下载适用于您操作系统的版本
3. 安装并启动 Compass

### 连接配置

1. 打开 MongoDB Compass
2. 在连接界面输入以下信息：

**开发环境:**

```env
连接字符串: mongodb://localhost:27017/haoyue_dev
```

**生产环境:**

```env
连接字符串: mongodb+srv://<username>:<password>@cluster.example.com/haoyue?retryWrites=true&w=majority
```

3. 点击"连接"按钮

## adminMongo 配置

### 安装方式一：独立运行（推荐）

```bash
# 进入 adminMongo 目录
cd ../adminMongo

# 安装依赖
npm install

# 启动服务
npm start
```

### 安装方式二：集成到后端服务

在开发环境中，adminMongo 已经集成到后端服务中，可以通过以下 URL 访问：
- 开发环境: http://localhost:5001/admin/mongo

### 配置连接

1. 编辑 `config/app.json` 文件
2. 添加以下配置：

```json
{
  "app": {
    "host": "localhost",
    "port": 1234,
    "cookieSecret": "haoyue-admin-secret",
    "sessionSecret": "haoyue-session-secret"
  },
  "connections": {
    "haoyue_dev": {
      "connection_string": "mongodb://localhost:27017/haoyue_dev",
      "database": "haoyue_dev"
    }
  }
}
```

3. 重启 adminMongo 服务
4. 访问 <http://localhost:1234> 或 <http://localhost:5001/admin/mongo>（集成模式）

## 连接测试

### 使用 npm 脚本测试

```bash
# 在 haoyue-backend 目录中运行
npm run test-db
```

### 手动测试连接

```bash
# 使用 mongo shell 测试
mongosh "mongodb://localhost:27017/haoyue_dev"
```

## 使用技巧

### MongoDB Compass 使用技巧

1. **数据浏览**:
   - 使用过滤器快速查找文档
   - 通过字段进行排序
   - 查看文档的详细结构

2. **查询构建**:
   - 使用可视化查询构建器
   - 查看查询执行计划
   - 分析查询性能

3. **模式分析**:
   - 查看集合的文档结构
   - 分析字段分布
   - 识别需要索引的字段

### adminMongo 使用技巧

1. **快速操作**:
   - 创建、读取、更新、删除文档
   - 批量导入/导出数据
   - 执行 MongoDB 命令

2. **数据管理**:
   - 查看集合统计信息
   - 管理索引
   - 监控数据库状态

## 皓月平台数据库结构

### 主要集合

1. **users**: 用户信息
2. **stocks**: 股票数据
3. **analyses**: 分析结果
4. **recommendations**: 推荐信息
5. **contents**: 内容管理数据
6. **subscriptions**: 订阅信息

### 重要字段说明

- 所有集合都有自动创建的 `createdAt` 和 `updatedAt` 时间戳字段
- 关联字段使用 ObjectId 引用其他集合
- 枚举字段有预定义的值范围

## 安全注意事项

### 开发环境

- 可以使用默认配置进行本地开发
- 确保 MongoDB 服务正在运行

### 生产环境

- 严格限制管理工具的访问权限
- 使用强密码和身份验证
- 定期备份数据库
- 监控数据库操作日志

通过合理配置和使用这些工具，可以显著提升皓月量化平台的数据库管理效率。