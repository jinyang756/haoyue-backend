# Vercel 部署说明

## 部署配置

### 1. 环境变量配置

在Vercel项目设置中，需要配置以下环境变量：

| 环境变量名 | 描述 | 示例值 |
|-----------|------|--------|
| `MONGODB_URI` | MongoDB连接字符串 | `mongodb+srv://username:password@cluster.mongodb.net/database` |
| `JWT_SECRET` | JWT密钥 | `your_jwt_secret_key_here` |
| `JWT_REFRESH_SECRET` | JWT刷新密钥 | `your_refresh_secret_key_here` |
| `NODE_ENV` | 运行环境 | `production` |

### 2. 构建和部署设置

Vercel会自动使用项目根目录下的 `vercel.json` 配置文件进行部署。

## 配置文件说明

### vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "api/test.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/test",
      "dest": "api/test.js"
    },
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## 部署注意事项

### 1. 无服务器环境限制

- Vercel是一个无服务器平台，不支持长时间运行的进程
- 定时任务服务在Vercel环境中会自动禁用
- 文件系统访问受限，日志只能输出到控制台

### 2. 数据库连接

- 使用MongoDB Atlas作为数据库服务
- 确保MongoDB URI配置正确
- Vercel环境中使用MongoClient进行数据库连接

### 3. API端点

部署后可通过以下端点访问API：

- 主应用: `https://your-project.vercel.app/`
- 健康检查: `https://your-project.vercel.app/health`
- 测试端点: `https://your-project.vercel.app/test`
- API路由: `https://your-project.vercel.app/api/*`

## 故障排除

### 1. 500错误

如果遇到500错误，请检查：

1. 环境变量是否正确配置
2. MongoDB连接字符串是否有效
3. JWT密钥是否已设置
4. 查看Vercel部署日志获取详细错误信息

### 2. 数据库连接失败

如果数据库连接失败：

1. 检查MongoDB URI格式是否正确
2. 确认MongoDB Atlas集群是否允许Vercel IP访问
3. 验证数据库用户名和密码

### 3. API无法访问

如果API无法访问：

1. 检查路由配置是否正确
2. 确认CORS设置是否允许跨域访问
3. 验证请求头和认证信息

## 测试部署

部署完成后，可以通过以下方式测试：

1. 访问测试端点: `https://your-project.vercel.app/test`
2. 检查健康状态: `https://your-project.vercel.app/health`
3. 尝试注册用户: `POST https://your-project.vercel.app/api/auth/register`

## 性能优化

### 1. 冷启动优化

- 减少依赖包大小
- 避免在函数初始化时执行耗时操作
- 合理使用缓存机制

### 2. 响应时间优化

- 优化数据库查询
- 减少不必要的中间件
- 使用CDN加速静态资源

## 安全考虑

### 1. 环境变量

- 敏感信息应通过Vercel环境变量配置
- 不要在代码中硬编码密钥

### 2. 访问控制

- 使用适当的认证和授权机制
- 配置CORS策略限制跨域访问

### 3. 输入验证

- 对所有API输入进行验证
- 防止SQL注入和XSS攻击