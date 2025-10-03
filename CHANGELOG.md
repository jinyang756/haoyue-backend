# 变更日志

## [1.0.0] - 2025-10-03

### 新增

- 集成 adminMongo 到后端服务，提供数据库管理界面
- 在开发环境中可通过 `/admin/mongo` 路径访问 adminMongo
- 添加 MongoDB 管理工具使用指南文档

### 修改

- 更新 README.md 文档，添加关于 adminMongo 集成的说明
- 配置 adminMongo 使用端口 1235 避免端口冲突
- 明确前端项目部署平台为 Netlify，后端项目部署平台为 Vercel

### 技术栈

- Node.js + Express + MongoDB
- JWT 认证
- Swagger API 文档
- Docker 容器化部署
- 部署平台: Vercel

## [0.1.0] - 2025-09-30

### 初始化

- 项目创建
- 基础功能实现
- API 文档集成 (Swagger)
- 用户认证系统
- 股票数据管理
- AI 分析功能
- 定时任务系统
