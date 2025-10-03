#!/usr/bin/env node

/**
 * MongoDB 连接测试脚本
 * 用于验证 MongoDB Compass 和 adminMongo 的连接配置
 */

const { MongoClient, ServerApiVersion } = require('mongodb');
const { logger } = require('../utils/logger');

// 从环境变量获取 MongoDB URI
const getMongoUri = () => {
  return process.env.MONGODB_URI || 
         process.env.MONGO_URI || 
         'mongodb://localhost:27017/haoyue_dev';
};

// MongoDB 客户端配置
const mongoClientOptions = {
  serverApi: ServerApiVersion.v1,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
};

async function testConnection() {
  let client;
  
  try {
    const uri = getMongoUri();
    console.log('🧪 测试 MongoDB 连接...');
    console.log(`🔗 连接字符串: ${uri}`);
    
    // 创建客户端并连接
    client = new MongoClient(uri, mongoClientOptions);
    await client.connect();
    
    console.log('✅ MongoDB 连接成功!');
    
    // 获取数据库信息
    const db = client.db();
    const dbName = db.databaseName || 'default';
    console.log(`📂 数据库名称: ${dbName}`);
    
    // 列出所有集合
    const collections = await db.listCollections().toArray();
    console.log(`📋 集合列表 (${collections.length} 个):`);
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name}`);
    });
    
    // 获取数据库统计信息
    const stats = await db.stats();
    console.log(`📊 数据库统计:`);
    console.log(`   文档数量: ${stats.objects}`);
    console.log(`   数据大小: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   存储大小: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    
    // 提供故障排除建议
    console.log('\n💡 故障排除建议:');
    console.log('1. 检查 MongoDB 服务是否正在运行');
    console.log('2. 验证连接字符串是否正确');
    console.log('3. 确认防火墙设置是否允许连接');
    console.log('4. 检查用户名和密码是否正确');
    
    return false;
  } finally {
    // 关闭连接
    if (client) {
      await client.close();
      console.log('🔚 连接已关闭');
    }
  }
}

// 执行测试
if (require.main === module) {
  testConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('未处理的错误:', error);
      process.exit(1);
    });
}

module.exports = { testConnection };