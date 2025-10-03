const Subscription = require('../models/Subscription');
const User = require('../models/User');
const mongoose = require('mongoose');

// 获取所有订阅计划
exports.getPlans = async (req, res) => {
  try {
    // 定义所有订阅计划
    const plans = [
      {
        id: 'free',
        name: '免费版',
        price: 0,
        billingCycle: '终身',
        features: [
          '基础股票查询',
          '每日AI分析 1次',
          '3个技术指标',
          '基础数据可视化'
        ],
        limitations: [
          '无数据导出',
          '无优先支持'
        ],
        maxTeamMembers: 1
      },
      {
        id: 'basic',
        name: '基础版',
        price: 99,
        billingCycle: '月付',
        features: [
          '股票查询',
          '每日AI分析 5次',
          '8个技术指标',
          '数据导出',
          '基础支持'
        ],
        limitations: [
          '无优先支持'
        ],
        maxTeamMembers: 1
      },
      {
        id: 'premium',
        name: '高级版',
        price: 299,
        billingCycle: '月付',
        features: [
          '股票查询',
          '每日AI分析 20次',
          '15个技术指标',
          '数据导出',
          '优先支持',
          '自定义指标'
        ],
        limitations: [],
        maxTeamMembers: 3
      },
      {
        id: 'vip',
        name: 'VIP版',
        price: 599,
        billingCycle: '月付',
        features: [
          '股票查询',
          '每日AI分析 50次',
          '20个技术指标',
          '数据导出',
          '优先支持',
          '自定义指标',
          '专属分析师',
          '投资组合管理'
        ],
        limitations: [],
        maxTeamMembers: 5
      },
      {
        id: 'platinum',
        name: '白金版',
        price: 1999,
        billingCycle: '月付',
        features: [
          '股票查询',
          '每日AI分析 无限次',
          '技术指标 无限个',
          '数据导出',
          '优先支持',
          '自定义指标',
          '专属分析师',
          '投资组合管理',
          '风险评估',
          'API访问',
          '团队协作'
        ],
        limitations: [],
        maxTeamMembers: 10
      }
    ];

    res.status(200).json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('获取订阅计划错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取用户当前订阅
exports.getCurrentUserSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ user: req.user.id })
      .populate('user', 'username email');

    if (!subscription) {
      return res.status(404).json({
        message: '未找到订阅信息'
      });
    }

    res.status(200).json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('获取用户订阅错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 创建订阅
exports.createSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, paymentMethod, discountCode, invoiceInfo } = req.body;

    // 检查用户是否已有活跃订阅
    const existingSubscription = await Subscription.findOne({
      user: req.user.id,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        message: '您已有活跃的订阅，请先取消当前订阅'
      });
    }

    // 获取计划价格
    const planDetails = getPlanDetails(plan);
    if (!planDetails) {
      return res.status(400).json({
        message: '无效的订阅计划'
      });
    }

    let amount = planDetails.price;
    
    // 应用折扣（如果有）
    let discountAmount = 0;
    if (discountCode) {
      const discount = await validateDiscountCode(discountCode);
      if (discount && discount.isValid) {
        discountAmount = discount.amount;
        amount = Math.max(0, amount - discountAmount);
      }
    }

    // 根据计费周期调整价格
    switch (billingCycle) {
      case 'quarterly':
        amount *= 3;
        // 季付9折
        amount *= 0.9;
        break;
      case 'yearly':
        amount *= 12;
        // 年付8折
        amount *= 0.8;
        break;
      default:
        // monthly
        break;
    }

    // 创建订阅
    const subscription = new Subscription({
      user: req.user.id,
      plan,
      amount: Math.round(amount),
      billingCycle: billingCycle || 'monthly',
      paymentMethod,
      discountCode,
      discountAmount,
      invoiceInfo,
      maxTeamMembers: planDetails.maxTeamMembers || 1
    });

    await subscription.save();

    // 更新用户角色
    await User.findByIdAndUpdate(req.user.id, {
      role: plan === 'premium' || plan === 'vip' || plan === 'platinum' || plan === 'enterprise' ? 'vip' : 'user'
    });

    res.status(201).json({
      success: true,
      message: '订阅创建成功',
      subscription
    });
  } catch (error) {
    console.error('创建订阅错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 取消订阅
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body; // 获取取消原因
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({
        message: '订阅不存在'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        message: '订阅状态不允许取消'
      });
    }

    subscription.status = 'cancelled';
    subscription.cancellationReason = reason; // 保存取消原因
    await subscription.save();

    // 更新用户角色为普通用户
    await User.findByIdAndUpdate(req.user.id, {
      role: 'user'
    });

    res.status(200).json({
      success: true,
      message: '订阅已取消',
      subscription
    });
  } catch (error) {
    console.error('取消订阅错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新订阅（续订或升级）
exports.updateSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, paymentMethod } = req.body;
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({
        message: '订阅不存在'
      });
    }

    // 更新订阅信息
    subscription.plan = plan;
    if (billingCycle) {
      subscription.billingCycle = billingCycle;
    }
    if (paymentMethod) {
      subscription.paymentMethod = paymentMethod;
    }

    // 获取新计划价格
    const planDetails = getPlanDetails(plan);
    if (!planDetails) {
      return res.status(400).json({
        message: '无效的订阅计划'
      });
    }

    subscription.amount = planDetails.price;
    subscription.maxTeamMembers = planDetails.maxTeamMembers || 1;

    await subscription.save();

    // 更新用户角色
    await User.findByIdAndUpdate(req.user.id, {
      role: plan === 'premium' || plan === 'vip' || plan === 'platinum' || plan === 'enterprise' ? 'vip' : 'user'
    });

    res.status(200).json({
      success: true,
      message: '订阅更新成功',
      subscription
    });
  } catch (error) {
    console.error('更新订阅错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取订阅历史
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      subscriptions
    });
  } catch (error) {
    console.error('获取订阅历史错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 模拟支付处理
exports.processPayment = async (req, res) => {
  try {
    const { subscriptionId, paymentMethod, paymentData } = req.body;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        message: '订阅不存在'
      });
    }

    // 模拟支付处理
    // 在实际应用中，这里会集成真实的支付网关
    const paymentResult = {
      success: true,
      transactionId: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      paymentMethod
    };

    if (paymentResult.success) {
      subscription.paymentStatus = 'completed';
      subscription.transactionId = paymentResult.transactionId;
      subscription.status = 'active';
      subscription.startDate = new Date();
      
      // 设置结束日期
      const now = new Date();
      switch (subscription.billingCycle) {
        case 'quarterly':
          subscription.endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
          break;
        case 'yearly':
          subscription.endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
          break;
        case 'lifetime':
          subscription.endDate = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
          break;
        default:
          subscription.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      await subscription.save();

      res.status(200).json({
        success: true,
        message: '支付成功，订阅已激活',
        subscription
      });
    } else {
      subscription.paymentStatus = 'failed';
      await subscription.save();

      res.status(400).json({
        success: false,
        message: '支付失败'
      });
    }
  } catch (error) {
    console.error('处理支付错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 辅助函数：获取计划详情
function getPlanDetails(planId) {
  const plans = {
    free: { name: '免费版', price: 0, maxTeamMembers: 1 },
    basic: { name: '基础版', price: 99, maxTeamMembers: 1 },
    premium: { name: '高级版', price: 299, maxTeamMembers: 3 },
    enterprise: { name: '企业版', price: 999, maxTeamMembers: 20 },
    vip: { name: 'VIP版', price: 599, maxTeamMembers: 5 },
    platinum: { name: '白金版', price: 1999, maxTeamMembers: 10 }
  };
  
  return plans[planId];
}

// 辅助函数：验证折扣码（模拟）
async function validateDiscountCode(code) {
  // 在实际应用中，这里会查询数据库验证折扣码
  const validDiscounts = {
    'SAVE10': { isValid: true, amount: 10 },
    'SAVE20': { isValid: true, amount: 20 },
    'SAVE50': { isValid: true, amount: 50 }
  };
  
  return validDiscounts[code] || { isValid: false, amount: 0 };
}

// 获取团队成员
exports.getTeamMembers = async (req, res) => {
  try {
    // 查找用户的活跃订阅
    const subscription = await Subscription.findOne({ 
      user: req.user.id, 
      status: 'active' 
    }).populate('teamMembers', 'username email');

    if (!subscription) {
      return res.status(404).json({
        message: '未找到活跃订阅'
      });
    }

    // 获取团队成员信息
    const teamMembers = subscription.teamMembers || [];
    
    // 添加主用户到团队成员列表
    const mainUser = await User.findById(req.user.id).select('username email');
    const allMembers = [mainUser, ...teamMembers];

    res.status(200).json({
      success: true,
      teamMembers: allMembers
    });
  } catch (error) {
    console.error('获取团队成员错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 添加团队成员
exports.addTeamMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: '请提供成员邮箱'
      });
    }

    // 查找用户的活跃订阅
    const subscription = await Subscription.findOne({ 
      user: req.user.id, 
      status: 'active' 
    });

    if (!subscription) {
      return res.status(404).json({
        message: '未找到活跃订阅'
      });
    }

    // 检查是否已达最大成员数
    if (subscription.teamMembers && subscription.teamMembers.length >= subscription.maxTeamMembers - 1) {
      return res.status(400).json({
        message: '已达到最大团队成员数'
      });
    }

    // 查找要添加的用户
    const memberUser = await User.findOne({ email });
    if (!memberUser) {
      return res.status(404).json({
        message: '未找到该用户'
      });
    }

    // 检查用户是否已在团队中
    if (subscription.teamMembers && subscription.teamMembers.some(member => member.equals(memberUser._id))) {
      return res.status(400).json({
        message: '该用户已在团队中'
      });
    }

    // 添加团队成员
    if (!subscription.teamMembers) {
      subscription.teamMembers = [];
    }
    subscription.teamMembers.push(memberUser._id);
    await subscription.save();

    // 更新成员用户的订阅信息
    memberUser.subscription = {
      plan: subscription.plan,
      expiresAt: subscription.endDate,
      isActive: true
    };
    await memberUser.save();

    res.status(200).json({
      success: true,
      message: '成功添加团队成员',
      member: {
        id: memberUser._id,
        username: memberUser.username,
        email: memberUser.email
      }
    });
  } catch (error) {
    console.error('添加团队成员错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 移除团队成员
exports.removeTeamMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        message: '无效的成员ID'
      });
    }

    // 查找用户的活跃订阅
    const subscription = await Subscription.findOne({ 
      user: req.user.id, 
      status: 'active' 
    });

    if (!subscription) {
      return res.status(404).json({
        message: '未找到活跃订阅'
      });
    }

    // 检查成员是否在团队中
    if (!subscription.teamMembers || !subscription.teamMembers.some(member => member.equals(memberId))) {
      return res.status(404).json({
        message: '成员不在团队中'
      });
    }

    // 移除团队成员
    subscription.teamMembers = subscription.teamMembers.filter(member => !member.equals(memberId));
    await subscription.save();

    // 更新被移除用户的订阅信息
    const memberUser = await User.findById(memberId);
    if (memberUser) {
      memberUser.subscription = {
        plan: 'free',
        expiresAt: null,
        isActive: false
      };
      await memberUser.save();
    }

    res.status(200).json({
      success: true,
      message: '成功移除团队成员'
    });
  } catch (error) {
    console.error('移除团队成员错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};