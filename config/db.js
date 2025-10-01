const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * 数据库配置和连接
 */
const connectDB = async () => {
  try {
    // Updated connection options for MongoDB Atlas compatibility
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/haoyue', {
      serverSelectionTimeoutMS: 5000, // Server selection timeout
      socketTimeoutMS: 45000,        // Socket timeout
      family: 4                      // Use IPv4 to avoid potential IPv6 issues
    });

    logger.info(`MongoDB连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB连接失败:', error);
    logger.warn('服务将继续运行，但部分依赖数据库的功能可能不可用');
    // 不退出进程，继续运行服务器
    return null;
  }
};

/**
 * 关闭数据库连接
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB连接已关闭');
  } catch (error) {
    logger.error('关闭MongoDB连接失败:', error);
  }
};

/**
 * 数据库断开重连处理
 */
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB连接已断开，尝试重连...');
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB连接错误:', err);
});

/**
 * 应用配置
 */
const config = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_secret_key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
  },
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15分钟
    max: process.env.RATE_LIMIT_MAX || 100 // 最大请求数
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: `${process.env.APP_NAME || '皓月量化智能引擎'} <${process.env.SMTP_USER}>`
  },
  apiKeys: {
    alphaVantage: process.env.ALPHA_VANTAGE_API_KEY,
    finnhub: process.env.FINNHUB_API_KEY,
    polygon: process.env.POLYGON_API_KEY,
    openai: process.env.OPENAI_API_KEY
  },
  ai: {
    modelUrl: process.env.AI_MODEL_URL || 'https://api.openai.com/v1/chat/completions',
    confidenceThreshold: process.env.AI_CONFIDENCE_THRESHOLD || 70,
    analysisInterval: process.env.ANALYSIS_INTERVAL || 3600000 // 1小时
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  },
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: process.env.UPLOAD_MAX_SIZE || 5 * 1024 * 1024 // 5MB
  }
};

module.exports = {
  connectDB,
  closeDB,
  config
};