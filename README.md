# 皓月量化智能引擎 - 后端API服务

## 项目概述

皓月量化智能引擎是一个基于AI的股票分析平台，提供全面的股票数据分析、技术指标计算、AI智能推荐等功能。本项目是平台的后端API服务，采用Node.js + Express + MongoDB技术栈开发，负责数据处理、业务逻辑实现和AI分析计算。

## 主要功能

### 1. 用户管理

- 用户注册、登录、认证
- 权限管理（普通用户、VIP用户、管理员）
- 用户偏好设置
- 订阅管理

### 2. 股票数据

- 实时股票价格获取
- 历史数据查询
- 技术指标计算（RSI、MACD、布林带等）
- 股票搜索和筛选

### 3. AI分析

- 多维度分析（基本面、技术面、情绪分析）
- 智能推荐系统
- 风险评估
- 目标价格预测

### 4. 定时任务

- 股票数据自动更新
- 技术指标定期计算
- 维护任务执行

## 技术栈

- **后端框架**: Node.js + Express
- **数据库**: MongoDB
- **认证**: JWT (JSON Web Tokens)
- **密码加密**: bcryptjs
- **数据验证**: express-validator
- **HTTP请求**: axios
- **定时任务**: node-schedule
- **日志**: winston
- **邮件服务**: nodemailer
- **容器化**: Docker
- **API文档**: Swagger
- **部署平台**: Vercel / 自建服务器

## 项目结构

```
haoyue-backend/
├── config/                 # 配置文件（数据库、邮件等）
│   └── db.js               # 数据库配置
├── controllers/            # 控制器（处理请求和响应）
│   ├── ai.controller.js    # AI分析控制器
│   ├── auth.controller.js  # 认证控制器
│   └── stock.controller.js # 股票数据控制器
├── middleware/             # 中间件（认证、日志等）
│   └── auth.js             # 认证中间件
├── models/                 # 数据模型
│   ├── Analysis.js         # 分析模型
│   ├── Recommendation.js   # 推荐模型
│   ├── Stock.js            # 股票模型
│   └── User.js             # 用户模型
├── routes/                 # 路由配置
│   ├── analysis.routes.js  # 分析相关路由
│   ├── auth.routes.js      # 认证相关路由
│   ├── recommendation.routes.js  # 推荐相关路由
│   ├── stock.routes.js     # 股票数据路由
│   └── user.routes.js      # 用户相关路由
├── services/               # 业务逻辑层
│   ├── ai.service.js       # AI服务
│   ├── schedule.service.js # 定时任务服务
│   └── stock.service.js    # 股票数据服务
├── utils/                  # 工具函数
│   ├── constants.js        # 常量定义
│   ├── email.js            # 邮件工具
│   ├── helpers.js          # 辅助函数
│   └── logger.js           # 日志工具
├── logs/                   # 日志文件
├── uploads/                # 上传文件
├── docker/                 # Docker相关配置
│   └── mongo-init.js       # MongoDB初始化脚本
├── .env.example            # 环境变量模板
├── .gitignore              # Git忽略文件
├── package.json            # 项目配置
├── Dockerfile              # Docker构建文件
├── docker-compose.yml      # Docker Compose配置
├── README.md               # 项目说明
├── swagger.js              # Swagger文档配置
└── index.js                # 入口文件
```

## 快速开始

### 环境要求

- Node.js 16+
- MongoDB 5.0+
- npm 8+
- Docker（可选，用于容器化部署）

### 本地开发

1. **克隆项目**

```bash
git clone <项目仓库地址>
cd haoyue-backend
```

2. **安装依赖**

```bash
npm install
```

3. **配置环境变量**

复制 `.env.example` 文件为 `.env` 并修改相应配置：

```bash
cp .env.example .env
# 编辑 .env 文件，设置MongoDB连接字符串、JWT密钥等
```

4. **启动服务**

```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start
```

5. **访问API**

服务启动后，API将在 `http://localhost:5001` 可用：

- API首页: `http://localhost:5001`
- 健康检查: `http://localhost:5001/health`
- Swagger文档: `http://localhost:5001/api/docs`

## 环境变量配置

`.env` 文件需要包含以下关键配置：

```env
# 服务器配置
PORT=5001
NODE_ENV=development

# MongoDB配置
MONGO_URI=mongodb://localhost:27017/haoyue

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# 邮件服务配置（可选）
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password

# API限制配置
RATE_LIMIT_WINDOW_MS=15*60*1000
RATE_LIMIT_MAX=100
```

## Docker部署

### 使用Docker Compose（推荐）

```bash
# 启动所有服务（API服务和MongoDB）
docker-compose up -d

# 查看API服务日志
docker-compose logs -f api

# 停止服务
docker-compose down
```

### 单独构建Docker镜像

```bash
# 构建镜像
docker build -t haoyue-api .

# 运行容器（需要单独的MongoDB实例）
docker run -d -p 5001:5001 --env-file .env --name haoyue-api haoyue-api
```

## Vercel部署

本项目支持一键部署到Vercel：

1. 将代码推送到GitHub仓库
2. 在Vercel上导入GitHub仓库
3. 配置环境变量（在Vercel控制台的Settings > Environment Variables中）
   - MONGODB_URI: MongoDB连接字符串 (推荐使用)
   - 或 MONGO_URI: MongoDB连接字符串 (向后兼容)
   - JWT_SECRET: JWT密钥
   - NODE_ENV: production
   - 其他必要的环境变量 (参考.env.example文件)
4. 点击Deploy按钮开始部署

## API文档

项目已集成Swagger文档，启动服务后可访问 `http://localhost:5001/api/docs` 查看完整的API文档。以下是主要API接口概览：

### 认证相关

| 接口 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | 公开 |
| `/api/auth/login` | POST | 用户登录 | 公开 |
| `/api/auth/refresh-token` | POST | 刷新Token | 公开 |
| `/api/auth/verify-email/:token` | GET | 邮箱验证 | 公开 |
| `/api/auth/forgot-password` | POST | 忘记密码 | 公开 |
| `/api/auth/reset-password/:token` | POST | 重置密码 | 公开 |
| `/api/auth/me` | GET | 获取当前用户信息 | 用户 |
| `/api/auth/logout` | POST | 登出 | 用户 |
| `/api/auth/resend-verification` | POST | 重新发送验证邮件 | 用户 |

### 股票数据相关

| 接口 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/stocks` | GET | 获取股票列表 | 公开 |
| `/api/stocks/:id` | GET | 获取股票详情 | 公开 |
| `/api/stocks/:symbol/history` | GET | 获取历史数据 | 公开 |
| `/api/stocks/:symbol/technical` | GET | 获取技术指标 | 公开 |
| `/api/stocks/:symbol/ai-ratings` | GET | 获取AI评级 | 公开 |
| `/api/stocks/:symbol/news` | GET | 获取股票新闻 | 公开 |
| `/api/stocks/search` | GET | 搜索股票 | 公开 |

### AI分析相关

| 接口 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/analysis` | POST | 创建分析任务 | 用户 |
| `/api/analysis` | GET | 获取分析列表 | 用户 |
| `/api/analysis/:id` | GET | 获取分析详情 | 用户 |
| `/api/analysis/:id/cancel` | PUT | 取消分析任务 | 用户 |
| `/api/analysis/stats` | GET | 获取分析统计 | 用户 |
| `/api/analysis/batch` | POST | 批量分析任务 | VIP/管理员 |
| `/api/analysis/export/:id` | GET | 导出分析报告 | 用户 |

### 推荐相关

| 接口 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/recommendations` | GET | 获取推荐列表 | 公开 |
| `/api/recommendations/:id` | GET | 获取推荐详情 | 公开 |
| `/api/recommendations/create` | POST | 创建自定义推荐 | VIP/管理员 |
| `/api/recommendations/performance/:id` | GET | 获取推荐绩效 | 用户 |
| `/api/recommendations/favorite/:id` | POST | 收藏推荐 | 用户 |
| `/api/recommendations/favorites` | GET | 获取收藏的推荐 | 用户 |
| `/api/recommendations/latest` | GET | 获取最新推荐 | 公开 |
| `/api/recommendations/top` | GET | 获取热门推荐 | 公开 |

## 数据库设计

### 用户表 (User)

- 用户基本信息、认证信息、偏好设置、订阅信息

### 股票表 (Stock)

- 股票基础信息、历史价格、技术指标、AI评级、新闻

### 分析表 (Analysis)

- 分析任务信息、结果数据、技术指标、风险评估

### 推荐表 (Recommendation)

- 推荐组合、股票列表、权重配置、性能跟踪

## 安全特性

- JWT认证机制
- 密码加密存储（使用bcryptjs）
- 输入验证（使用express-validator）
- 访问频率限制
- CORS配置
- 安全HTTP头
- 数据备份策略

## 性能优化

- 数据库索引优化
- 缓存策略
- 异步处理
- 批量操作
- 分页查询
- 代码模块化

## 自建服务器部署建议

### 生产环境

1. **使用PM2进程管理**

```bash
npm install -g pm2
pm2 start index.js --name "haoyue-api"
pm2 startup  # 设置开机自启
pm2 save     # 保存当前进程列表
```

2. **配置Nginx反向代理**

```nginx
server {
    listen 80;
    server_name api.haoyuequant.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **启用HTTPS**

建议使用Let's Encrypt获取免费SSL证书：

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.haoyuequant.com
```

## 监控和日志

- 使用PM2监控应用状态：`pm2 monit`
- 配置日志轮转
- 设置错误告警
- 定期备份MongoDB数据：
  ```bash
  mongodump --db haoyue --out /backup/mongo/$(date +%Y%m%d)
  ```

### 数据库连接问题

- 检查MongoDB服务是否正常运行
- 确认MONGO_URI环境变量配置正确
- 检查防火墙设置是否允许连接MongoDB端口

### API请求错误

- 检查请求参数是否符合要求
- 查看应用日志获取详细错误信息
- 确认用户权限是否满足接口要求

### 性能问题

- 使用MongoDB索引优化查询性能
- 检查是否有长时间运行的任务阻塞事件循环
- 考虑使用缓存减少数据库访问

## 开发指南

### 代码规范

- 遵循Node.js最佳实践
- 使用ES6+特性
- API设计遵循RESTful原则
- 错误处理统一化
- 为API添加Swagger文档注释（参考已有路由文件格式）

### 测试

- 编写单元测试和集成测试
- 使用Postman测试API接口
- 进行性能测试
- 使用Swagger文档测试接口功能

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 变更日志

项目的变更历史记录在根目录的 [CHANGELOG.md](../CHANGELOG.md) 文件中。请在提交PR时更新此文件，记录重要的变更。

## 数据可视化

项目使用 MongoDB Charts 进行数据可视化展示：

- [公开仪表板](https://charts.mongodb.com/charts-haoyue-ejjgvho/public/dashboards/68de15da-809c-406a-8ad5-92c828f50dcb) - 展示公开的股票数据和分析结果
- [私有仪表板](https://charts.mongodb.com/charts-haoyue-ejjgvho/dashboards/68de15da-809c-406a-8ad5-92c828f50dcb) - 包含详细的系统数据和管理功能（仅限授权用户访问）

详细信息请参见 [MONGODB_CHARTS.md](../MONGODB_CHARTS.md) 文件。

## 前端集成

前端项目部署在Netlify (zhengyutouzi.com)，通过API与后端服务通信。前端项目包含：

- 专业的首页展示页面
- 用户认证和权限管理界面
- 股票数据展示和分析界面
- AI分析结果展示界面
- 响应式设计适配各种设备

## 开发工具

### adminMongo 集成

在开发环境中，项目已集成 adminMongo 用于数据库管理：

- 访问地址: http://localhost:5001/admin/mongo
- 配置文件: [adminMongo 配置](../adminMongo/config/app.json)
- 数据库连接配置: [adminMongo 连接配置](../adminMongo/config/config.json)

### MongoDB Compass

推荐使用 MongoDB Compass 进行数据库可视化管理：

- 下载地址: [MongoDB Compass](https://www.mongodb.com/try/download/compass)
- 连接字符串: `mongodb://localhost:27017/haoyue_dev`

## 文档规范

所有 Markdown 文档都应遵循项目规范，详情请参见 [Markdown 格式规范指南](docs/MARKDOWN_STYLE_GUIDE.md)。

## 许可证

本项目采用MIT许可证