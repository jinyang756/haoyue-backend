const Subscription = require('../models/Subscription');
const User = require('../models/User');

// 订阅计划配置
const PLAN_CONFIG = {
  free: {
    name: '免费版',
    price: 0,
    features: {
      'basic_analysis': true,
      'stock_search': true,
      'technical_indicators': true,
      'ai_recommendations': false,
      'advanced_charts': false,
      'priority_support': false
    },
    description: '基础功能免费使用'
  },
  basic: {
    name: '基础版',
    price: 99,
    features: {
      'basic_analysis': true,
      'stock_search': true,
      'technical_indicators': true,
      'ai_recommendations': true,
      'advanced_charts': false,
      'priority_support': false
    },
    description: '包含AI推荐功能'
  },
  premium: {
    name: '高级版',
    price: 299,
    features: {
      'basic_analysis': true,
      'stock_search': true,
      'technical_indicators': true,
      'ai_recommendations': true,
      'advanced_charts': true,
      'priority_support': true
    },
    description: '完整功能，优先支持'
  },
  enterprise: {
    name: '企业版',
    price: 999,
    features: {
      'basic_analysis': true,
      'stock_search': true,
      'technical_indicators': true,
      'ai_recommendations': true,
      'advanced_charts': true,
      'priority_support': true
    },
    description: '企业级功能，专属服务'
  }
};

// 获取所有订阅计划
exports.getPlans = async () => {
  return PLAN_CONFIG;
};

// 为用户创建订阅
exports.createSubscription = async (userId, planType, paymentData = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 检查用户是否已有活跃订阅
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: 'active'
    });

    if (existingSubscription) {
      throw new Error('用户已有活跃订阅');
    }

    // 获取计划配置
    const planConfig = PLAN_CONFIG[planType];
    if (!planConfig) {
      throw new Error('无效的订阅计划');
    }

    // 创建订阅记录
    const subscription = new Subscription({
      user: userId,
      plan: planType,
      amount: planConfig.price,
      paymentMethod: paymentData.paymentMethod,
      transactionId: paymentData.transactionId,
      features: planConfig.features,
      status: paymentData.transactionId ? 'active' : 'pending'
    });

    await subscription.save();

    // 如果是付费订阅且支付成功，更新用户角色
    if (planConfig.price > 0 && paymentData.transactionId) {
      user.role = planType === 'premium' || planType === 'enterprise' ? 'vip' : 'user';
      user.subscription = {
        plan: planType,
        expiresAt: subscription.endDate,
        isActive: true
      };
      await user.save();
    }

    return subscription;
  } catch (error) {
    throw new Error(`创建订阅失败: ${error.message}`);
  }
};

// 取消订阅
exports.cancelSubscription = async (subscriptionId, userId) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error('订阅不存在');
    }

    if (subscription.user.toString() !== userId) {
      throw new Error('无权限操作此订阅');
    }

    subscription.status = 'cancelled';
    await subscription.save();

    // 更新用户订阅状态
    const user = await User.findById(userId);
    if (user) {
      user.subscription.isActive = false;
      if (user.role === 'vip') {
        user.role = 'user';
      }
      await user.save();
    }

    return subscription;
  } catch (error) {
    throw new Error(`取消订阅失败: ${error.message}`);
  }
};

// 获取用户订阅信息
exports.getUserSubscription = async (userId) => {
  try {
    const subscription = await Subscription.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'username email role');

    return subscription;
  } catch (error) {
    throw new Error(`获取订阅信息失败: ${error.message}`);
  }
};

// 检查用户是否有特定功能权限
exports.checkFeatureAccess = async (userId, feature) => {
  try {
    const subscription = await Subscription.findOne({ 
      user: userId, 
      status: 'active' 
    });

    // 如果没有订阅或订阅已过期，只能访问免费功能
    if (!subscription || subscription.isExpired) {
      const freePlan = PLAN_CONFIG.free;
      return freePlan.features[feature] || false;
    }

    // 检查订阅计划是否包含该功能
    return subscription.features.get(feature) || false;
  } catch (error) {
    console.error('检查功能权限失败:', error);
    return false;
  }
};

// 更新订阅支付状态
exports.updatePaymentStatus = async (subscriptionId, status, transactionId = null) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error('订阅不存在');
    }

    subscription.paymentStatus = status;
    if (transactionId) {
      subscription.transactionId = transactionId;
    }

    // 如果支付成功，激活订阅
    if (status === 'completed') {
      subscription.status = 'active';
      
      // 更新用户订阅信息
      const user = await User.findById(subscription.user);
      if (user) {
        user.role = subscription.plan === 'premium' || subscription.plan === 'enterprise' ? 'vip' : 'user';
        user.subscription = {
          plan: subscription.plan,
          expiresAt: subscription.endDate,
          isActive: true
        };
        await user.save();
      }
    }

    await subscription.save();
    return subscription;
  } catch (error) {
    throw new Error(`更新支付状态失败: ${error.message}`);
  }
};