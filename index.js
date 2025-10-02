// 加载环境变量配置
require('dotenv').config();

// 导入核心库
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// 导入自定义工具
const { logger, requestLogger, errorLogger, logPerformance } = require('./utils/logger.js');

// 导入Swagger相关模块
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');

// 读取生成的Swagger文档
let swaggerSpecs;
try {
  // 在Vercel环境中使用不同的路径
  const swaggerPath = process.env.VERCEL === '1' 
    ? path.join(__dirname, 'build', 'swagger.json')
    : path.join(__dirname, 'build', 'swagger.json');
  swaggerSpecs = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
} catch (error) {
  logger.warn('Swagger文档未找到，将使用空配置:', error.message);
  swaggerSpecs = {};
}

// 导入数据库连接函数
const { connectDB, closeDB, isMongoDBConnected } = require('./config/db.js');

// 初始化Express应用
const app = express();

// 使用环境变量或默认端口
const PORT = process.env.PORT || 5001;

// CORS配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || ['https://haoyue-frontend.vercel.app', 'https://zhengyutouzi.com', 'https://jiuzhougroup.vip'] 
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

// 只在非Vercel环境中提供静态文件服务
if (process.env.VERCEL !== '1') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));
  
  // 创建上传目录（如果不存在）
  const uploadsDir = path.join(__dirname, 'uploads');
  const fs = require('fs');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info(`创建上传目录: ${uploadsDir}`);
  }
}

// 连接数据库 - 使用性能监控包装
// 在Vercel环境中，我们不立即连接数据库，而是在需要时连接
if (process.env.VERCEL !== '1') {
  logPerformance('数据库连接', connectDB).catch(error => {
    logger.error('数据库连接初始化失败:', error.message);
    // 在开发环境中继续运行，但在生产环境中可能需要退出
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}

// 路由导入
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const stockRoutes = require('./routes/stock.routes');
const analysisRoutes = require('./routes/analysis.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const newsRoutes = require('./routes/news.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const contentRoutes = require('./routes/content.routes');

// 配置Swagger文档路由（在Vercel环境中也启用，但使用特殊处理）
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL === '1') {
  // 在Vercel环境中，我们仍然提供Swagger文档，但使用特殊配置
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      // 在Vercel环境中，我们使用相对路径
      url: process.env.VERCEL === '1' ? '/api/docs/swagger.json' : undefined
    }
  }));
  logger.info(`Swagger文档已启用: /api/docs`);
  
  // 在Vercel环境中提供Swagger JSON文件
  if (process.env.VERCEL === '1') {
    app.get('/api/docs/swagger.json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpecs);
    });
  }
} else {
  // 在生产环境中（非Vercel），仍然提供Swagger文档
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true
    }
  }));
  logger.info(`Swagger文档已启用: /api/docs`);
}

// 健康检查路由 - 增强版本
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'success',
    message: '皓月量化智能引擎API服务正常运行',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1' ? 'true' : 'false',
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
      news: '/api/news',
      subscriptions: '/api/subscriptions',
      contents: '/api/contents',
      docs: '/api/docs'
    }
  };

  // 根据Accept头返回不同格式
  const acceptHeader = req.headers.accept || '';
  if (acceptHeader.includes('text/plain')) {
    let plainText = `Health Check Report\n`;
    plainText += `Status: ${healthStatus.status}\n`;
    plainText += `Time: ${healthStatus.timestamp}\n`;
    plainText += `Version: ${healthStatus.version}\n`;
    plainText += `Environment: ${healthStatus.environment}\n`;
    plainText += `Vercel: ${healthStatus.vercel}\n`;
    plainText += `Database: ${healthStatus.database.connectionStatus}\n`;
    res.status(200).send(plainText);
  } else {
    res.status(200).json(healthStatus);
  }
});

// API路由前缀 - 使用性能监控包装每个路由组
// 修复logPerformance包装函数的使用方式
app.use('/api/auth', (req, res, next) => {
  logPerformance('Auth路由', () => authRoutes(req, res, next)).catch(next);
});

app.use('/api/users', (req, res, next) => {
  logPerformance('User路由', () => userRoutes(req, res, next)).catch(next);
});

app.use('/api/stocks', (req, res, next) => {
  logPerformance('Stock路由', () => stockRoutes(req, res, next)).catch(next);
});

app.use('/api/analysis', (req, res, next) => {
  logPerformance('Analysis路由', () => analysisRoutes(req, res, next)).catch(next);
});

app.use('/api/recommendations', (req, res, next) => {
  logPerformance('Recommendation路由', () => recommendationRoutes(req, res, next)).catch(next);
});

app.use('/api/news', (req, res, next) => {
  logPerformance('News路由', () => newsRoutes(req, res, next)).catch(next);
});

app.use('/api/subscriptions', (req, res, next) => {
  logPerformance('Subscription路由', () => subscriptionRoutes(req, res, next)).catch(next);
});

app.use('/api/contents', (req, res, next) => {
  logPerformance('Content路由', () => contentRoutes(req, res, next)).catch(next);
});

// 根目录路由
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用皓月量化智能引擎API服务',
    version: process.env.APP_VERSION || '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// 关于页面路由
app.get('/about', (req, res) => {
  res.json({
    message: '关于皓月量化智能引擎',
    description: '皓月量化是一个基于AI的股票分析平台，提供实时股票数据、技术分析和智能投资建议。',
    version: process.env.APP_VERSION || '1.0.0',
    contact: {
      email: 'contact@haoyue-quant.com',
      website: 'https://haoyue-quant.com'
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
    path: req.originalUrl
  });
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  // 记录错误日志
  errorLogger(error, req, res);
  
  // 确定状态码
  const statusCode = error.statusCode || 500;
  
  // 发送错误响应
  res.status(statusCode).json({
    success: false,
    message: error.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: error
    })
  });
});

// 只在非Vercel环境中启动服务器
if (process.env.VERCEL !== '1') {
  // 优雅关闭处理
  process.on('SIGTERM', async () => {
    logger.info('收到SIGTERM信号，正在优雅关闭...');
    try {
      await closeDB();
      process.exit(0);
    } catch (error) {
      logger.error('关闭过程中发生错误:', error);
      process.exit(1);
    }
  });

  process.on('SIGINT', async () => {
    logger.info('收到SIGINT信号，正在优雅关闭...');
    try {
      await closeDB();
      process.exit(0);
    } catch (error) {
      logger.error('关闭过程中发生错误:', error);
      process.exit(1);
    }
  });

  // 启动服务器
  app.listen(PORT, () => {
    logger.info(`皓月量化智能引擎API服务启动成功`);
    logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`端口: ${PORT}`);
    logger.info(`文档: http://localhost:${PORT}/api/docs`);
  });
}

// 导出应用供Vercel使用
module.exports = app;