const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recommendationType: {
    type: String,
    enum: ['personalized', 'market', 'sector', 'ai', 'trending', 'value', 'growth', 'dividend', 'custom'],
    default: 'personalized'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'expired', 'paused'],
    default: 'active'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  title: {
    type: String,
    required: [true, '请提供推荐标题'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  stocks: [{
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    exchange: {
      type: String,
      trim: true
    },
    sector: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    recommendation: {
      type: String,
      enum: ['strong sell', 'sell', 'hold', 'buy', 'strong buy'],
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    targetPrice: {
      type: Number
    },
    currentPrice: {
      type: Number
    },
    upsidePotential: {
      type: Number
    },
    riskLevel: {
      type: String,
      enum: ['very low', 'low', 'medium', 'high', 'very high'],
      default: 'medium'
    },
    timeHorizon: {
      type: String,
      enum: ['short-term', 'medium-term', 'long-term'],
      default: 'medium-term'
    },
    weight: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    },
    reasons: [String],
    riskFactors: [String],
    catalysts: [String],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  performance: {
    totalReturn: {
      type: Number,
      default: 0
    },
    annualizedReturn: {
      type: Number,
      default: 0
    },
    sharpeRatio: {
      type: Number,
      default: 0
    },
    maxDrawdown: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    averageProfit: {
      type: Number,
      default: 0
    },
    averageLoss: {
      type: Number,
      default: 0
    },
    profitFactor: {
      type: Number,
      default: 0
    },
    performanceMetrics: [{
      date: Date,
      totalValue: Number,
      return: Number,
      benchmarkReturn: Number,
      alpha: Number,
      beta: Number
    }]
  },
  strategy: {
    investmentStyle: {
      type: String,
      enum: ['value', 'growth', 'momentum', 'quality', 'dividend', 'small-cap', 'large-cap', 'mid-cap', 'sector-rotation', 'market-neutral', 'long-short', 'other'],
      default: 'value'
    },
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive', 'very aggressive'],
      default: 'moderate'
    },
    timeHorizon: {
      type: String,
      enum: ['short-term', 'medium-term', 'long-term'],
      default: 'medium-term'
    },
    diversification: {
      maxPositionSize: Number,
      sectorLimit: Number,
      industryLimit: Number,
      countryLimit: Number
    },
    rebalancing: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'semi-annually', 'annually', 'on-demand'],
        default: 'monthly'
      },
      threshold: Number,
      lastRebalanced: Date,
      nextRebalance: Date
    }
  },
  aiSettings: {
    modelVersion: {
      type: String,
      default: 'v1.0'
    },
    confidenceThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    riskAdjustment: {
      type: Boolean,
      default: true
    },
    diversificationEnabled: {
      type: Boolean,
      default: true
    },
    sentimentAnalysisEnabled: {
      type: Boolean,
      default: true
    },
    technicalAnalysisEnabled: {
      type: Boolean,
      default: true
    },
    fundamentalAnalysisEnabled: {
      type: Boolean,
      default: true
    },
    marketCorrelationEnabled: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['ai', 'analyst', 'hybrid', 'systematic'],
      default: 'ai'
    },
    algorithm: String,
    dataSources: [String],
    modelVersion: String,
    lastGenerated: {
      type: Date,
      default: Date.now
    },
    nextUpdate: Date,
    updateFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'manual'],
      default: 'weekly'
    }
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    likes: {
      type: Number,
      default: 0
    }
  }],
  tags: [String],
  categories: [String],
  notes: {
    userNotes: String,
    systemNotes: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
RecommendationSchema.index({ userId: 1, createdAt: -1 });
RecommendationSchema.index({ recommendationType: 1, status: 1 });
RecommendationSchema.index({ 'stocks.symbol': 1 });
RecommendationSchema.index({ isFavorite: 1 });
RecommendationSchema.index({ isPublic: 1 });
RecommendationSchema.index({ tags: 1 });
RecommendationSchema.index({ createdAt: -1 });

// 虚拟字段：推荐组合的平均评级
RecommendationSchema.virtual('averageRating').get(function() {
  if (!this.stocks || this.stocks.length === 0) return 0;
  
  const totalRating = this.stocks.reduce((sum, stock) => sum + stock.rating, 0);
  return Math.round((totalRating / this.stocks.length) * 10) / 10;
});

// 虚拟字段：推荐组合的总权重
RecommendationSchema.virtual('totalWeight').get(function() {
  if (!this.stocks || this.stocks.length === 0) return 0;
  
  return this.stocks.reduce((sum, stock) => sum + stock.weight, 0);
});

// 虚拟字段：推荐的股票数量
RecommendationSchema.virtual('stockCount').get(function() {
  return this.stocks ? this.stocks.length : 0;
});

// 虚拟字段：是否为近期推荐（30天内）
RecommendationSchema.virtual('isRecent').get(function() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.createdAt >= thirtyDaysAgo;
});

// 方法：添加股票到推荐
RecommendationSchema.methods.addStock = function(stockData) {
  const existingStock = this.stocks.find(stock => stock.symbol === stockData.symbol);
  
  if (existingStock) {
    // 更新现有股票
    Object.assign(existingStock, stockData);
    existingStock.lastUpdated = Date.now();
  } else {
    // 添加新股票
    this.stocks.push({
      ...stockData,
      lastUpdated: Date.now()
    });
  }
  
  return this.save();
};

// 方法：移除股票从推荐
RecommendationSchema.methods.removeStock = function(symbol) {
  this.stocks = this.stocks.filter(stock => stock.symbol !== symbol);
  return this.save();
};

// 方法：更新股票权重
RecommendationSchema.methods.updateStockWeight = function(symbol, weight) {
  const stock = this.stocks.find(stock => stock.symbol === symbol);
  if (stock) {
    stock.weight = weight;
    return this.save();
  }
  return Promise.reject(new Error('股票不存在'));
};

// 方法：重新平衡推荐组合
RecommendationSchema.methods.rebalance = function() {
  if (!this.stocks || this.stocks.length === 0) {
    return Promise.resolve(this);
  }
  
  const totalWeight = this.stocks.reduce((sum, stock) => sum + stock.weight, 0);
  if (totalWeight !== 100) {
    const scaleFactor = 100 / totalWeight;
    this.stocks.forEach(stock => {
      stock.weight = Math.round(stock.weight * scaleFactor);
    });
    
    // 调整最后一个股票的权重以确保总和为100
    const adjustedTotal = this.stocks.slice(0, -1).reduce((sum, stock) => sum + stock.weight, 0);
    this.stocks[this.stocks.length - 1].weight = 100 - adjustedTotal;
  }
  
  this.strategy.rebalancing.lastRebalanced = Date.now();
  
  // 设置下次重新平衡时间
  const nextRebalance = new Date();
  switch (this.strategy.rebalancing.frequency) {
    case 'daily':
      nextRebalance.setDate(nextRebalance.getDate() + 1);
      break;
    case 'weekly':
      nextRebalance.setDate(nextRebalance.getDate() + 7);
      break;
    case 'monthly':
      nextRebalance.setMonth(nextRebalance.getMonth() + 1);
      break;
    case 'quarterly':
      nextRebalance.setMonth(nextRebalance.getMonth() + 3);
      break;
    case 'semi-annually':
      nextRebalance.setMonth(nextRebalance.getMonth() + 6);
      break;
    case 'annually':
      nextRebalance.setFullYear(nextRebalance.getFullYear() + 1);
      break;
    default:
      // on-demand
      nextRebalance.setFullYear(nextRebalance.getFullYear() + 1);
  }
  
  this.strategy.rebalancing.nextRebalance = nextRebalance;
  
  return this.save();
};

// 方法：更新推荐状态
RecommendationSchema.methods.updateStatus = function(status) {
  this.status = status;
  return this.save();
};

// 方法：标记为收藏
RecommendationSchema.methods.toggleFavorite = function(isFavorite) {
  this.isFavorite = isFavorite;
  return this.save();
};

// 方法：添加评论
RecommendationSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    userId,
    content,
    createdAt: Date.now(),
    likes: 0
  });
  return this.save();
};

// 方法：更新性能指标
RecommendationSchema.methods.updatePerformance = function(performanceData) {
  this.performance = { ...this.performance, ...performanceData };
  return this.save();
};

module.exports = mongoose.model('Recommendation', RecommendationSchema);