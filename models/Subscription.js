const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
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
    enum: ['alipay', 'wechat', 'bank', 'credit_card']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: {
    type: String
  },
  features: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, {
  timestamps: true
});

// 索引
SubscriptionSchema.index({ user: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ endDate: 1 });

// 虚拟字段：是否过期
SubscriptionSchema.virtual('isExpired').get(function() {
  return this.endDate && this.endDate < new Date();
});

// 虚拟字段：是否激活
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// 中间件：保存前检查状态
SubscriptionSchema.pre('save', function(next) {
  // 如果是试用期，设置试用结束时间
  if (this.isTrial && !this.trialEnd) {
    // 免费试用7天
    this.trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  
  // 如果没有结束时间，根据计划设置默认时间
  if (!this.endDate) {
    const now = new Date();
    switch (this.plan) {
      case 'basic':
        this.endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      case 'premium':
        this.endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      case 'enterprise':
        this.endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      default:
        // free plan 永不过期
        break;
    }
  }
  
  next();
});

module.exports = mongoose.model('Subscription', SubscriptionSchema);