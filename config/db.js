const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
  appName: 'haoyue-backend'
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
  serverApi: ServerApiVersion.v1
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
    const client = new MongoClient(uri, mongoClientOptions);
    logger.debug('创建了新的MongoDB客户端');
    return client;
  } catch (error) {
    logger.error('创建MongoDB客户端失败:', error.message);
    return null;
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
    
    // 在Vercel环境中使用MongoClient
    if (process.env.VERCEL === '1') {
      try {
        const uri = getMongoUri();
        if (!uri) {
          throw new Error('Vercel环境中未配置MongoDB URI');
        }
        
        // 使用MongoClient进行连接（更适合Vercel无服务器环境）
        mongoClient = new MongoClient(uri, mongoClientOptions);
        await mongoClient.connect();
        isVercel = true;
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

module.exports = {
  connectDB,
  closeDB,
  getMongoClient,
  isMongoDBConnected,
  mongoClient,
  isVercel
};