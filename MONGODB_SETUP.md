# MongoDB数据库配置指南

## 1. MongoDB Atlas配置步骤

### 1.1 创建MongoDB Atlas账户

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 注册账户或登录现有账户

### 1.2 创建集群

1. 在Atlas控制台中点击"Build a Cluster"
2. 选择免费的"M0"层级（适合开发测试）
3. 选择云服务商和区域（推荐AWS）
4. 点击"Create Cluster"

### 1.3 配置数据库用户

1. 在左侧导航栏选择"Database Access"
2. 点击"Add New Database User"
3. 选择"Password"作为认证方式
4. 输入用户名和密码（请记录下来）
5. 在"Database User Privileges"中选择"Atlas Admin"
6. 点击"Add User"

### 1.4 配置网络访问

1. 在左侧导航栏选择"Network Access"
2. 点击"Add IP Address"
3. 选择"Allow Access From Anywhere"（0.0.0.0/0）或添加特定IP地址
4. 点击"Confirm"

### 1.5 获取连接字符串

1. 在Clusters页面点击"Connect"
2. 选择"Connect your application"
3. 选择Node.js驱动程序
4. 复制连接字符串
5. 将`<username>`和`<password>`替换为实际的用户名和密码

## 2. 环境变量配置

在项目根目录的`.env`文件中配置以下环境变量：

```env
# MongoDB连接字符串
MONGODB_URI=mongodb+srv://your_username:your_password@cluster_name.mongodb.net/database_name?retryWrites=true&w=majority

# JWT密钥（用于用户认证）
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
```

## 3. 常见问题解决

### 3.1 认证失败

- 检查用户名和密码是否正确
- 确认用户具有足够的权限
- 验证用户是否已添加到正确的项目中

### 3.2 网络连接问题

- 检查IP白名单设置
- 确认防火墙没有阻止连接
- 验证连接字符串是否正确

### 3.3 连接超时

- 检查网络连接是否稳定
- 确认MongoDB Atlas集群状态是否正常
- 尝试使用不同的网络环境

## 4. 数据初始化

配置好MongoDB连接后，可以运行以下命令初始化数据：

```bash
# 初始化股票数据
npm run init-data

# 生成更多模拟数据
npm run generate-data
```

## 5. 验证连接

使用以下命令测试MongoDB连接：

```bash
# 测试数据库连接
npm run test-db
```

## 6. 本地开发配置

如果不想使用MongoDB Atlas，也可以使用本地MongoDB：

1. 安装MongoDB Community Server
2. 启动MongoDB服务
3. 在`.env`文件中配置：

```env
MONGODB_URI=mongodb://localhost:27017/haoyue
```

## 7. 安全建议

1. 不要在代码中硬编码敏感信息
2. 使用环境变量存储连接字符串和密钥
3. 定期轮换密码和密钥
4. 限制IP访问范围
5. 使用强密码策略
