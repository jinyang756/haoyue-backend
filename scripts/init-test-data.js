#!/usr/bin/env node

/**
 * 初始化测试数据脚本
 * 用于在开发环境中创建一些示例数据，便于使用 MongoDB 管理工具进行测试
 */

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// 数据模型
const User = require('../models/User');
const Content = require('../models/Content');
const Stock = require('../models/Stock');
const Subscription = require('../models/Subscription');

// MongoDB 连接配置
const getMongoUri = () => {
  return process.env.MONGODB_URI || 
         process.env.MONGO_URI || 
         'mongodb://localhost:27017/haoyue_dev';
};

const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  autoIndex: true,
  connectTimeoutMS: 10000,
};

async function initTestData() {
  try {
    console.log('🌱 开始初始化测试数据...');
    
    // 连接数据库
    const mongoUri = getMongoUri();
    console.log(`🔗 连接数据库: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, mongooseOptions);
    console.log('✅ 数据库连接成功!');
    
    // 清空现有数据（仅在开发环境）
    if (process.env.NODE_ENV !== 'production') {
      console.log('🗑️  清空现有数据...');
      await User.deleteMany({});
      await Content.deleteMany({});
      await Stock.deleteMany({});
      await Subscription.deleteMany({});
      console.log('✅ 数据清空完成');
    } else {
      console.log('⚠️  生产环境，跳过数据清空');
      return;
    }
    
    // 创建测试用户
    console.log('👤 创建测试用户...');
    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'user1',
        email: 'user1@example.com',
        password: 'user123',
        role: 'user'
      },
      {
        username: 'vipuser',
        email: 'vip@example.com',
        password: 'vip123',
        role: 'vip'
      }
    ];
    
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      // 注意：在实际应用中，密码应该被加密
      // 这里为了简化测试，我们直接保存
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`   ✅ 用户 ${userData.username} 创建成功`);
    }
    
    // 创建测试内容
    console.log('📄 创建测试内容...');
    const contents = [
      {
        title: '欢迎使用皓月量化平台',
        content: '这是平台的第一篇内容，介绍了皓月量化平台的基本功能和使用方法。',
        category: 'guide',
        status: 'published'
      },
      {
        title: '最新股市分析报告',
        content: '本报告分析了当前股市的趋势和投资机会，为投资者提供参考。',
        category: 'news',
        status: 'published'
      },
      {
        title: '技术指标使用指南',
        content: '详细介绍了各种技术指标的计算方法和使用场景。',
        category: 'guide',
        status: 'draft'
      }
    ];
    
    for (const contentData of contents) {
      const content = new Content(contentData);
      await content.save();
      console.log(`   ✅ 内容 "${contentData.title}" 创建成功`);
    }
    
    // 创建测试股票数据
    console.log('📈 创建测试股票数据...');
    const stocks = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ'
      },
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        exchange: 'NASDAQ'
      },
      {
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        exchange: 'NASDAQ'
      }
    ];
    
    for (const stockData of stocks) {
      const stock = new Stock(stockData);
      await stock.save();
      console.log(`   ✅ 股票 ${stockData.symbol} 创建成功`);
    }
    
    // 创建测试订阅
    console.log('💳 创建测试订阅...');
    const subscriptions = [
      {
        user: createdUsers[1]._id, // user1
        plan: 'basic',
        status: 'active',
        amount: 99,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后
      },
      {
        user: createdUsers[2]._id, // vipuser
        plan: 'premium',
        status: 'active',
        amount: 299,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 365天后
      }
    ];
    
    for (const subscriptionData of subscriptions) {
      const subscription = new Subscription(subscriptionData);
      await subscription.save();
      console.log(`   ✅ 订阅创建成功`);
    }
    
    console.log('🎉 测试数据初始化完成!');
    console.log('   👤 创建了 3 个用户');
    console.log('   📄 创建了 3 篇内容');
    console.log('   📈 创建了 3 支股票数据');
    console.log('   💳 创建了 2 个订阅');
    
  } catch (error) {
    console.error('❌ 初始化测试数据失败:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('🔚 数据库连接已关闭');
  }
}

// 执行初始化
if (require.main === module) {
  initTestData()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('未处理的错误:', error);
      process.exit(1);
    });
}

module.exports = { initTestData };