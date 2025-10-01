require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
// 导入定时任务服务，确保在服务器启动时初始化定时任务
require('./services/schedule.service');
// 导入Swagger相关模块
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger.js');
// 导入数据库连接函数
const { connectDB, closeDB } = require('./config/db.js');

// 初始化Express应用
const app = express();
// 使用环境变量或默认端口
const PORT = process.env.PORT || 5001;

// 中间件配置
app.use(helmet()); // 安全头设置
app.use(cors()); // 跨域支持
app.use(morgan('dev')); // 日志记录
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // 表单解析

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 连接数据库
connectDB();

// 路由导入
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const stockRoutes = require('./routes/stock.routes');
const analysisRoutes = require('./routes/analysis.routes');
const recommendationRoutes = require('./routes/recommendation.routes');

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/recommendations', recommendationRoutes);

// 配置Swagger文档路由
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// 健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '皓月量化智能引擎API服务正常运行',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 首页路由
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用皓月量化智能引擎API',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      stocks: '/api/stocks',
      analysis: '/api/analysis',
      recommendations: '/api/recommendations'
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: '请求的资源不存在',
    path: req.path
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`皓月量化智能引擎API服务已启动，端口: ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API地址: http://localhost:${PORT}/api`);
  console.log(`Swagger文档: http://localhost:${PORT}/api/docs`);
});

// Vercel会自动处理HTTP请求，通过module.exports导出app

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  try {
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error('关闭服务器时出错:', error);
    process.exit(1);
  }
});

module.exports = app;