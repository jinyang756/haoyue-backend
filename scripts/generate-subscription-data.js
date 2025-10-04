const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
require('dotenv').config();

// 连接数据库
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/haoyue';
mongoose.connect(mongoUri, {
  // 移除已弃用的选项
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB连接错误:'));
db.once('open', async () => {
  console.log('MongoDB连接成功');
  await generateSubscriptionData();
  mongoose.connection.close();
});

async function generateSubscriptionData() {
  try {
    // 获取所有用户
    const users = await User.find({});
    console.log(`数据库中共有 ${users.length} 个用户`);
    
    // 为每个用户创建订阅数据（如果还不存在）
    let createdCount = 0;
    
    for (const user of users) {
      try {
        // 检查用户是否已有订阅
        const existingSubscription = await Subscription.findOne({ user: user._id });
        
        if (!existingSubscription) {
          console.log(`正在为用户 ${user.username} 创建订阅数据...`);
          
          // 随机选择一个计划
          const plan = getRandomPlan();
          const amount = getPlanPrice(plan);
          
          // 生成订阅数据
          const subscriptionData = {
            user: user._id,
            plan: plan,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 一年后到期
            amount: amount,
            currency: 'CNY',
            features: new Map(Object.entries(generateFeaturesMapForPlan(plan))),
            usage: {
              analyses: Math.floor(Math.random() * 100),
              recommendations: Math.floor(Math.random() * 50),
              alerts: Math.floor(Math.random() * 200)
            },
            paymentHistory: [{
              amount: amount,
              currency: 'CNY',
              date: new Date(),
              status: 'completed'
            }]
          };
          
          const subscription = new Subscription(subscriptionData);
          await subscription.save();
          console.log(`✓ 成功为用户 ${user.username} 创建订阅数据`);
          createdCount++;
        }
      } catch (error) {
        console.error(`✗ 为用户 ${user.username} 创建订阅数据时出错:`, error.message);
      }
    }
    
    console.log(`用户订阅数据创建完成，共创建 ${createdCount} 份订阅`);
  } catch (error) {
    console.error('生成用户订阅数据时出错:', error);
  }
}

/**
 * 随机生成订阅计划
 */
function getRandomPlan() {
  const plans = ['free', 'basic', 'premium', 'enterprise'];
  return plans[Math.floor(Math.random() * plans.length)];
}

/**
 * 根据订阅计划生成Map格式的功能列表
 */
function generateFeaturesMapForPlan(plan) {
  const featuresArray = generateFeaturesForPlan(plan);
  const featuresMap = {};
  
  // 将数组转换为Map格式
  featuresArray.forEach(feature => {
    featuresMap[feature] = true;
  });
  
  return featuresMap;
}

/**
 * 根据订阅计划生成功能列表
 */
function generateFeaturesForPlan(plan) {
  switch (plan) {
    case 'free':
      return ['basic_analysis', 'limited_recommendations'];
    case 'basic':
      return ['basic_analysis', 'standard_recommendations', 'email_alerts'];
    case 'premium':
      return ['advanced_analysis', 'personalized_recommendations', 'real_time_alerts', 'priority_support'];
    case 'enterprise':
      return ['all_analysis_types', 'custom_recommendations', 'real_time_alerts', 'dedicated_support', 'api_access'];
    default:
      return ['basic_analysis'];
  }
}

/**
 * 根据订阅计划获取价格
 */
function getPlanPrice(plan) {
  switch (plan) {
    case 'free': return 0;
    case 'basic': return 99;
    case 'premium': return 299;
    case 'enterprise': return 999;
    default: return 0;
  }
}