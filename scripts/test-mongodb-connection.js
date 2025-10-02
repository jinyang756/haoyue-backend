#!/usr/bin/env node

/**
 * MongoDB连接测试脚本
 * 用于测试MongoDB连接配置是否正确
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { logger } = require('../utils/logger');

// 加载环境变量
dotenv.config();

// MongoDB连接配置
const mongoUri = process.env.MONGODB_URI || 
                process.env.MONGO_URI || 
                process.env.MongoDB_MONGODB_URI || 
                'mongodb://localhost:27017/haoyue';

const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  autoIndex: process.env.NODE_ENV !== 'production',
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 2,
  heartbeatFrequencyMS: 15000,
  appName: 'haoyue-backend'
};

/**
 * 测试MongoDB连接
 */
async function testMongoDBConnection() {
  try {
    logger.info('开始测试MongoDB连接...');
    logger.info(`连接字符串: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//[username]:[password]@')}`);
    
    // 尝试连接
    const conn = await mongoose.connect(mongoUri, mongooseOptions);
    
    logger.info('MongoDB连接成功!');
    logger.info(`数据库主机: ${conn.connection.host}`);
    logger.info(`数据库名称: ${conn.connection.name}`);
    
    // 测试基本操作
    try {
      // 创建测试集合
      const testSchema = new mongoose.Schema({
        name: String,
        createdAt: { type: Date, default: Date.now }
      });
      
      const TestModel = mongoose.model('TestConnection', testSchema);
      
      // 插入测试文档
      const testDoc = new TestModel({ name: 'Connection Test' });
      await testDoc.save();
      logger.info('插入测试文档成功');
      
      // 查询测试文档
      const foundDoc = await TestModel.findOne({ name: 'Connection Test' });
      if (foundDoc) {
        logger.info('查询测试文档成功');
      } else {
        logger.warn('查询测试文档失败');
      }
      
      // 删除测试文档
      await TestModel.deleteOne({ name: 'Connection Test' });
      logger.info('删除测试文档成功');
      
      // 删除测试模型
      await TestModel.collection.drop();
      logger.info('清理测试集合成功');
      
    } catch (opError) {
      logger.warn('数据库操作测试失败:', opError.message);
    }
    
    // 断开连接
    await mongoose.connection.close();
    logger.info('MongoDB连接测试完成');
    
    process.exit(0);
  } catch (error) {
    logger.error('MongoDB连接测试失败:', error.message);
    
    // 提供故障排除建议
    logger.info('\n故障排除建议:');
    logger.info('1. 检查MongoDB连接字符串是否正确');
    logger.info('2. 确认MongoDB Atlas中的用户权限设置');
    logger.info('3. 检查网络连接是否正常');
    logger.info('4. 确认IP地址是否已添加到MongoDB Atlas白名单');
    logger.info('5. 验证用户名和密码是否正确');
    
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  testMongoDBConnection();
}