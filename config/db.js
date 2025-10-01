const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { attachDatabasePool } = require('@vercel/functions');
const { logger } = require('../utils/logger');

// Vercel production MongoDB client
let mongoClient = null;
let isVercel = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

// 统一的环境变量处理
const getMongoUri = () => {
  // 支持多种环境变量格式
  const uri = process.env.MONGODB_URI || 
              process.env.MONGO_URI || 
              process.env.MongoDB_MONGODB_URI || // Vercel integration format
              'mongodb://localhost:27017/haoyue';
  
  // 如果是开发环境且没有设置URI，记录提示信息
  if (process.env.NODE_ENV !== 'production' && uri === 'mongodb://localhost:27017/haoyue') {
    logger.warn('使用默认MongoDB连接地址，请在.env文件中配置MONGODB_URI以使用自定义连接');
  }
  
  return uri;
};

// 数据库连接配置
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // 服务器选择超时
  socketTimeoutMS: 45000,         // 套接字超时
  family: 4,                      // 使用IPv4避免潜在的IPv6问题
  autoIndex: process.env.NODE_ENV !== 'production', // 生产环境关闭自动索引
  connectTimeoutMS: 10000,        // 连接超时
  maxPoolSize: 10,                // 连接池最大连接数
  minPoolSize: 2,                 // 连接池最小连接数
  heartbeatFrequencyMS: 15000,    // 心跳频率
  appName: 'haoyue-backend',
  // 添加serverApi选项以支持MongoDB Atlas的Stable API
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
};

// MongoDB客户端配置选项
const mongoClientOptions = {
  appName: "haoyue-backend",
  serverSelectionTimeoutMS: 5000,  // 服务器选择超时
  socketTimeoutMS: 45000,         // 套接字超时
  family: 4,                      // 使用IPv4避免潜在的IPv6问题
  connectTimeoutMS: 10000,        // 连接超时
  maxPoolSize: 10,                // 连接池最大连接数
  minPoolSize: 2,                 // 连接池最小连接数
  heartbeatFrequencyMS: 15000,    // 心跳频率
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
};

/**
 * 创建并配置MongoDB客户端
 */
const createMongoClient = () => {
  const uri = getMongoUri();
  
  if (!uri) {
    logger.warn('未配置MongoDB URI环境变量');
    return null;
  }
  
  try {
    if (process.env.NODE_ENV === 'development') {
      // 在开发模式下，使用全局变量以便在模块重载时保留值
      if (!global._mongoClient) {
        global._mongoClient = new MongoClient(uri, mongoClientOptions);
        logger.debug('创建了新的MongoDB客户端（开发模式）');
      }
      return global._mongoClient;
    } else {
      // 在生产模式下，最好不使用全局变量
      const client = new MongoClient(uri, mongoClientOptions);
      
      // 附加客户端以确保在函数暂停时正确清理
      attachDatabasePool(client);
      logger.debug('创建了新的MongoDB客户端（生产模式）');
      return client;
    }
  } catch (error) {
    logger.error('创建MongoDB客户端失败:', error.message);
    return null;
  }
};

// 检查是否在Vercel环境中运行
const initializeVercelClient = () => {
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1') {
    try {
      // 直接创建MongoDB客户端
      mongoClient = createMongoClient();
      isVercel = true;
      logger.info('Vercel MongoDB客户端加载成功');
    } catch (err) {
      logger.error('加载Vercel MongoDB客户端失败:', err.message);
    }
  }
};

/**
 * 检查MongoDB连接状态
 */
exports.isMongoDBConnected = () => {
  if (isVercel && mongoClient) {
    return mongoClient.topology && mongoClient.topology.isConnected();
  }
  return mongoose.connection.readyState === 1;
};

/**
 * 数据库配置和连接
 */
const connectDB = async () => {
  try {
    // 增加连接尝试计数器
    connectionAttempts++;
    
    // 初始化Vercel客户端
    initializeVercelClient();

    // 在生产环境中使用Vercel MongoDB客户端
    if (isVercel && mongoClient) {
      try {
        await mongoClient.connect();
        logger.info('MongoDB连接成功 (Vercel客户端)');
        return { connection: { host: 'Vercel MongoDB Atlas' } };
      } catch (vercelError) {
        logger.error('Vercel MongoDB连接失败:', vercelError.message);
        logger.warn('尝试使用Mongoose连接...');
      }
    }

    // 降级到Mongoose连接
    const mongoUri = getMongoUri();
    
    // 如果已经连接，返回现有连接
    if (mongoose.connection.readyState === 1) {
      logger.info('已经连接到MongoDB，复用现有连接');
      return mongoose.connection;
    }

    // 设置连接事件监听
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB连接已建立');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB连接错误:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB连接已断开');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB连接已重新建立');
    });

    const conn = await mongoose.connect(mongoUri, mongooseOptions);
    
    // 重置连接尝试计数器
    connectionAttempts = 0;
    
    logger.info(`MongoDB连接成功: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB连接失败:', error.message);
    
    // 连接重试逻辑
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
      const retryDelay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000); // 指数退避算法
      logger.warn(`将在${retryDelay / 1000}秒后尝试第${connectionAttempts + 1}次连接...`);
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          resolve(await connectDB());
        }, retryDelay);
      });
    } else {
      logger.error(`达到最大连接尝试次数(${MAX_CONNECTION_ATTEMPTS})，连接失败`);
      
      // 在开发环境中可以继续运行（使用模拟数据），但在生产环境中应该退出
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
      
      // 返回一个模拟的连接对象
      return { 
        connection: { 
          host: '模拟连接',
          db: { model: () => ({}) }
        },
        isMock: true
      };
    }
  }
};

/**
 * 关闭数据库连接
 */
const closeDB = async () => {
  try {
    // Close Vercel MongoDB client if used
    if (isVercel && mongoClient && mongoClient.topology && mongoClient.topology.isConnected()) {
      await mongoClient.close();
      logger.info('Vercel MongoDB client连接已关闭');
    }
    
    // Close Mongoose connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('Mongoose MongoDB连接已关闭');
    }
  } catch (error) {
    logger.error('关闭MongoDB连接失败:', error);
  }
};

/**
 * 数据库断开重连处理
 */
// Only set up Mongoose event listeners if not using Vercel client
if (!isVercel) {
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB连接已断开，尝试重连...');
    setTimeout(connectDB, 5000);
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB连接错误:', err);
  });
}

/**
 * Get MongoDB client instance
 * Returns Mongoose connection in development, Vercel client in production
 */
const getMongoClient = () => {
  return isVercel && mongoClient ? mongoClient : mongoose.connection;
};

/**
 * Check if MongoDB is connected
 */
const isMongoDBConnected = () => {
  if (isVercel && mongoClient) {
    return mongoClient.topology && mongoClient.topology.isConnected();
  }
  return mongoose.connection.readyState === 1;
};

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
  config,
  getMongoClient,
  isMongoDBConnected,
  mongoClient,
  isVercel
};