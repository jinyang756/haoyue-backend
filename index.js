require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// 初始化Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 中间件配置
app.use(helmet()); // 安全头设置
app.use(cors()); // 跨域支持
app.use(morgan('dev')); // 日志记录
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // 表单解析

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB连接
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/haoyue', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB连接成功'))
.catch(err => console.error('MongoDB连接失败:', err));

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
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('正在关闭服务器...');
  mongoose.connection.close(false, () => {
    console.log('MongoDB连接已关闭');
    process.exit(0);
  });
});

module.exports = app;