// 加载环境变量配置
require('dotenv').config();

// 导入核心库
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// 导入自定义工具
const { logger, requestLogger, errorLogger, logPerformance } = require('./utils/logger.js');

// 导入定时任务服务，确保在服务器启动时初始化定时任务
require('./services/schedule.service');

// 导入Swagger相关模块
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger.js');

// 导入数据库连接函数
const { connectDB, closeDB, isMongoDBConnected } = require('./config/db.js');

// 初始化Express应用
const app = express();

// 使用环境变量或默认端口
const PORT = process.env.PORT || 5001;

// CORS配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://haoyue-frontend.vercel.app' 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// 安全头配置 - 增强的helmet配置
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", process.env.API_URL || ''],
      frameSrc: ["'none'"]
    }
  },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  dnsPrefetchControl: true,
  expectCt: {
    maxAge: 86400,
    enforce: true
  },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
};

// 中间件配置
app.use(helmet(helmetConfig)); // 增强的安全头设置
app.use(cors(corsOptions)); // 配置的CORS支持
app.use(requestLogger); // 自定义请求日志中间件
app.use(express.json({ limit: '10mb' })); // JSON解析，限制大小防止DoS攻击
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
})); // 表单解析，限制大小

// 静态文件服务配置
const staticOptions = {
  dotfiles: 'deny',
  etag: true,
  extensions: ['htm', 'html'],
  index: false,
  maxAge: '1d',
  redirect: false,
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'public, max-age=86400');
  }
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));

// 创建上传目录（如果不存在）
const uploadsDir = path.join(__dirname, 'uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info(`创建上传目录: ${uploadsDir}`);
}

// 连接数据库 - 使用性能监控包装
logPerformance('数据库连接', connectDB).catch(error => {
  logger.error('数据库连接初始化失败:', error.message);
  // 在开发环境中继续运行，但在生产环境中可能需要退出
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// 路由导入
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const stockRoutes = require('./routes/stock.routes');
const analysisRoutes = require('./routes/analysis.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const newsRoutes = require('./routes/news.routes');

// 配置Swagger文档路由
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true
  }
}));
logger.info(`Swagger文档已启用: /api/docs`);

// 健康检查路由 - 增强版本
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'success',
    message: '皓月量化智能引擎API服务正常运行',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      type: 'MongoDB',
      connected: isMongoDBConnected(),
      connectionStatus: isMongoDBConnected() ? 'Connected' : 'Disconnected'
    },
    uptime: process.uptime(),
    memoryUsage: {
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
    },
    apiEndpoints: {
      auth: '/api/auth',
      users: '/api/users',
      stocks: '/api/stocks',
      analysis: '/api/analysis',
      recommendations: '/api/recommendations',
      news: '/api/news'
    }
  };

  // 根据Accept头返回不同格式
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/plain')) {
    let plainText = `Health Check Report\n`;
    plainText += `Status: ${healthStatus.status}\n`;
    plainText += `Time: ${healthStatus.timestamp}\n`;
    plainText += `Version: ${healthStatus.version}\n`;
    plainText += `Database: ${healthStatus.database.connectionStatus}\n`;
    res.status(200).send(plainText);
  } else {
    res.status(200).json(healthStatus);
  }
});

// API路由前缀 - 使用性能监控包装每个路由组
app.use('/api/auth', logPerformance.bind(null, 'Auth路由'), authRoutes);
app.use('/api/users', logPerformance.bind(null, 'User路由'), userRoutes);
app.use('/api/stocks', logPerformance.bind(null, 'Stock路由'), stockRoutes);
app.use('/api/analysis', logPerformance.bind(null, 'Analysis路由'), analysisRoutes);
app.use('/api/recommendations', logPerformance.bind(null, 'Recommendations路由'), recommendationRoutes);
app.use('/api/news', logPerformance.bind(null, 'News路由'), newsRoutes);

// 首页路由 - 增强版本
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用皓月量化智能引擎API',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: '/api/docs',
    healthCheck: '/health',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      stocks: '/api/stocks',
      analysis: '/api/analysis',
      recommendations: '/api/recommendations',
      news: '/api/news'
    }
  });
});

// 自定义API错误处理中间件
app.use((err, req, res, next) => {
  // 记录错误到日志
  errorLogger(err, req, res);
  
  // 标准化错误响应格式
  const errorResponse = {
    status: 'error',
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? {
      name: err.name,
      stack: err.stack,
      details: err.details
    } : undefined,
    path: req.path,
    timestamp: new Date().toISOString()
  };
  
  // 根据错误类型设置合适的状态码
  let statusCode = 500;
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'UnauthorizedError') statusCode = 401;
  if (err.name === 'ForbiddenError') statusCode = 403;
  if (err.name === 'NotFoundError') statusCode = 404;
  if (err.name === 'ConflictError') statusCode = 409;
  if (err.name === 'RateLimitError') statusCode = 429;
  
  res.status(statusCode).json(errorResponse);
});

// 404处理 - 增强版本
app.use((req, res) => {
  // 记录404错误
  logger.warn(`404 Not Found - ${req.method} ${req.path}`);
  
  res.status(404).json({
    status: 'error',
    message: '请求的资源不存在',
    path: req.path,
    method: req.method,
    availablePaths: {
      docs: '/api/docs',
      health: '/health',
      root: '/'
    }
  });
});

// 启动服务器
const server = app.listen(PORT, () => {
  const startupMessage = {
    service: '皓月量化智能引擎API服务',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    apiUrl: `http://localhost:${PORT}/api`,
    swaggerDocs: `http://localhost:${PORT}/api/docs`,
    healthCheck: `http://localhost:${PORT}/health`
  };
  
  logger.info('服务器启动成功', startupMessage);
  
  // 在非生产环境中，打印到控制台以便开发调试
  if (process.env.NODE_ENV !== 'production') {
    console.log('\x1b[32m%s\x1b[0m', `✅ 服务器启动成功: http://localhost:${PORT}`);
    console.log('\x1b[36m%s\x1b[0m', `📚 Swagger文档: http://localhost:${PORT}/api/docs`);
    console.log('\x1b[36m%s\x1b[0m', `🏥 健康检查: http://localhost:${PORT}/health`);
    console.log('\x1b[33m%s\x1b[0m', `🌍 环境: ${process.env.NODE_ENV || 'development'}`);
  }
});

// 设置服务器超时时间（2分钟）
server.timeout = 120000;

// Vercel会自动处理HTTP请求，通过module.exports导出app

// 优雅关闭处理 - 增强版本
const shutdown = async () => {
  logger.info('开始优雅关闭服务器...');
  
  try {
    // 关闭HTTP服务器，不再接受新请求
    if (server && typeof server.close === 'function') {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error('HTTP服务器关闭出错:', err);
            reject(err);
          } else {
            logger.info('HTTP服务器已成功关闭');
            resolve();
          }
        });
      });
    }
    
    // 关闭数据库连接
    if (typeof closeDB === 'function') {
      await closeDB();
      logger.info('数据库连接已关闭');
    }
    
    // 清理其他资源
    logger.info('所有资源已成功释放');
    process.exit(0);
  } catch (error) {
    logger.error('优雅关闭过程中发生错误:', error);
    process.exit(1);
  }
};

// 捕获各种终止信号
process.on('SIGINT', () => {
  logger.info('接收到SIGINT信号（Ctrl+C），开始关闭服务器...');
  shutdown();
});

process.on('SIGTERM', () => {
  logger.info('接收到SIGTERM信号，开始关闭服务器...');
  shutdown();
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err);
  // 在非生产环境中保持进程运行以便调试
  if (process.env.NODE_ENV !== 'production') {
    logger.warn('在开发环境中，进程将继续运行以方便调试');
  } else {
    // 在生产环境中，尝试优雅关闭
    shutdown();
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', { reason, promise });
  // 不像未捕获的异常那样严重，通常不需要立即关闭服务器
});

// 导出app供Vercel使用
module.exports = app;