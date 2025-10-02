// MongoDB连接修复脚本
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // 加载环境变量

// 检查并修复MongoDB连接问题
const fixMongoDBConnection = () => {
  console.log('检查MongoDB连接配置...');
  
  // 检查环境变量中的MongoDB配置
  if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;
    console.log('✅ 找到MongoDB URI:', uri.substring(0, 50) + '...');
    
    // 检查URI是否包含用户名和密码
    if (uri.includes('@')) {
      console.log('✅ MongoDB URI格式正确');
      return true;
    } else {
      console.log('❌ MongoDB URI格式不正确，缺少认证信息');
      return false;
    }
  } else {
    console.log('❌ 未找到MongoDB URI配置');
    return false;
  }
};

// 测试数据库连接
const testDatabaseConnection = async () => {
  console.log('测试数据库连接...');
  
  try {
    // 动态导入mongoose
    const mongoose = await import('mongoose');
    
    // 从环境变量获取URI
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/haoyue';
    console.log('使用URI:', uri.substring(0, 50) + '...');
    
    // 尝试连接
    await mongoose.default.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // 使用IPv4
    });
    
    console.log('✅ 数据库连接成功');
    await mongoose.default.connection.close();
    return true;
  } catch (error) {
    console.log('❌ 数据库连接失败:', error.message);
    return false;
  }
};

// 提供修复建议
const provideFixSuggestions = () => {
  console.log('\n🔧 修复建议:');
  console.log('1. 检查MongoDB Atlas集群的用户名和密码是否正确');
  console.log('2. 确保MongoDB Atlas集群允许来自您的IP地址的连接');
  console.log('3. 检查网络连接是否正常');
  console.log('4. 确保MongoDB URI格式正确');
  console.log('5. 如果问题持续存在，可以使用模拟数据模式进行开发');
};

// 主函数
const main = async () => {
  console.log('🚀 MongoDB连接诊断工具');
  console.log('========================');
  
  // 检查配置
  const configOk = fixMongoDBConnection();
  
  if (configOk) {
    // 测试连接
    const connectionOk = await testDatabaseConnection();
    
    if (!connectionOk) {
      provideFixSuggestions();
    }
  } else {
    console.log('请检查.env文件中的MongoDB配置');
  }
};

// 执行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixMongoDBConnection, testDatabaseConnection, provideFixSuggestions };