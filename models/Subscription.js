const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise', 'vip', 'platinum'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending', 'suspended'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  isTrial: {
    type: Boolean,
    default: false
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'CNY'
  },
  paymentMethod: {
    type: String,
    enum: ['alipay', 'wechat', 'bank', 'credit_card', 'paypal', 'apple_pay', 'google_pay']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  features: {
    type: Map,
    of: Boolean,
    default: {}
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly', 'lifetime'],
    default: 'monthly'
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  discountCode: {
    type: String
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  // 新增字段用于支持团队订阅
  teamMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxTeamMembers: {
    type: Number,
    default: 1
  },
  // 发票信息
  invoiceInfo: {
    type: {
      companyName: String,
      taxId: String,
      address: String,
      phone: String
    }
  },
  // 试用期相关
  trialPeriod: {
    type: Number, // 试用天数
    default: 7
  },
  // 取消原因
  cancellationReason: {
    type: String
  }
}, {
  timestamps: true
});

// 索引
SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ endDate: 1 });
SubscriptionSchema.index({ plan: 1 });

// 虚拟字段：是否过期
SubscriptionSchema.virtual('isExpired').get(function() {
  return this.endDate && this.endDate < new Date();
});

// 虚拟字段：是否激活
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// 虚拟字段：计划详情
SubscriptionSchema.virtual('planDetails').get(function() {
  const plans = {
    free: {
      name: '免费版',
      price: 0,
      features: {
        '基础股票查询': true,
        '每日AI分析': 1,
        '技术指标': 3,
        '数据导出': false,
        '优先支持': false
      }
    },
    basic: {
      name: '基础版',
      price: 99,
      features: {
        '股票查询': true,
        '每日AI分析': 5,
        '技术指标': 8,
        '数据导出': true,
        '优先支持': false
      }
    },
    premium: {
      name: '高级版',
      price: 299,
      features: {
        '股票查询': true,
        '每日AI分析': 20,
        '技术指标': 15,
        '数据导出': true,
        '优先支持': true,
        '自定义指标': true
      }
    },
    enterprise: {
      name: '企业版',
      price: 999,
      features: {
        '股票查询': true,
        '每日AI分析': '无限',
        '技术指标': '无限',
        '数据导出': true,
        '优先支持': true,
        '自定义指标': true,
        'API访问': true,
        '团队协作': true
      }
    },
    vip: {
      name: 'VIP版',
      price: 599,
      features: {
        '股票查询': true,
        '每日AI分析': 50,
        '技术指标': 20,
        '数据导出': true,
        '优先支持': true,
        '自定义指标': true,
        '专属分析师': true
      }
    },
    platinum: {
      name: '白金版',
      price: 1999,
      features: {
        '股票查询': true,
        '每日AI分析': '无限',
        '技术指标': '无限',
        '数据导出': true,
        '优先支持': true,
        '自定义指标': true,
        '专属分析师': true,
        '投资组合管理': true,
        '风险评估': true
      }
    }
  };
  
  return plans[this.plan] || plans.free;
});

// 中间件：保存前检查状态
SubscriptionSchema.pre('save', function(next) {
  // 如果是试用期，设置试用结束时间
  if (this.isTrial && !this.trialEnd) {
    // 免费试用7天
    this.trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  // 如果没有结束时间，根据计划和计费周期设置默认时间
  if (!this.endDate) {
    const now = new Date();
    let daysToAdd = 30; // 默认月付
    
    switch (this.billingCycle) {
      case 'quarterly':
        daysToAdd = 90;
        break;
      case 'yearly':
        daysToAdd = 365;
        break;
      case 'lifetime':
        // 终身订阅，设置为100年后
        this.endDate = new Date(now.getFullYear() + 100, now.getMonth(), now.getDate());
        break;
      default:
        // monthly
        break;
    }
    
    if (this.billingCycle !== 'lifetime') {
      this.endDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }
  }
  
  next();
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);