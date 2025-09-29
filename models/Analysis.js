const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stockSymbol: {
    type: String,
    required: [true, '请提供股票代码'],
    trim: true,
    uppercase: true
  },
  stockName: {
    type: String,
    required: [true, '请提供股票名称'],
    trim: true
  },
  analysisType: {
    type: String,
    enum: ['fundamental', 'technical', 'sentiment', 'comprehensive', 'custom'],
    default: 'comprehensive'
  },
  timeRange: {
    type: String,
    enum: ['1d', '1w', '1m', '3m', '6m', '1y', '2y', '5y', 'max'],
    default: '1y'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  result: {
    overallRating: {
      type: Number,
      min: 1,
      max: 10
    },
    recommendation: {
      type: String,
      enum: ['strong sell', 'sell', 'hold', 'buy', 'strong buy']
    },
    confidenceLevel: {
      type: Number,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['very low', 'low', 'medium', 'high', 'very high']
    },
    targetPrice: {
      type: Number
    },
    stopLossPrice: {
      type: Number
    },
    upsidePotential: {
      type: Number
    },
    downsideRisk: {
      type: Number
    }
  },
  factors: {
    fundamentalScore: {
      type: Number,
      min: 0,
      max: 100
    },
    technicalScore: {
      type: Number,
      min: 0,
      max: 100
    },
    sentimentScore: {
      type: Number,
      min: 0,
      max: 100
    },
    marketScore: {
      type: Number,
      min: 0,
      max: 100
    },
    industryScore: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  technicalIndicators: {
    movingAverages: {
      ma5: Number,
      ma10: Number,
      ma20: Number,
      ma60: Number,
      ma120: Number,
      ma250: Number
    },
    oscillators: {
      rsi: Number,
      macd: Number,
      signalLine: Number,
      stochastic: Number,
      williamsR: Number
    },
    volatility: {
      bollingerBands: {
        upper: Number,
        middle: Number,
        lower: Number,
        bandwidth: Number,
        percentB: Number
      },
      averageTrueRange: Number,
      standardDeviation: Number
    },
    volume: {
      averageVolume: Number,
      volumeTrend: String,
      onBalanceVolume: Number
    }
  },
  fundamentalAnalysis: {
    financialRatios: {
      peRatio: Number,
      pbRatio: Number,
      psRatio: Number,
      peGrowthRatio: Number,
      dividendYield: Number,
      roe: Number,
      roa: Number,
      roi: Number,
      debtEquityRatio: Number,
      currentRatio: Number,
      quickRatio: Number
    },
    growthMetrics: {
      revenueGrowth: Number,
      earningsGrowth: Number,
      epsGrowth: Number,
      dividendGrowth: Number,
      bookValueGrowth: Number
    },
    profitability: {
      grossMargin: Number,
      operatingMargin: Number,
      netMargin: Number,
      profitMargin: Number
    },
    valuation: {
      intrinsicValue: Number,
      fairValue: Number,
      priceToFairValue: Number,
      discountPremium: Number
    }
  },
  sentimentAnalysis: {
    newsSentiment: {
      score: Number,
      trend: String,
      articleCount: Number
    },
    socialMediaSentiment: {
      score: Number,
      trend: String,
      mentionCount: Number
    },
    analystRecommendations: {
      averageRating: Number,
      recommendation: String,
      analystCount: Number
    },
    institutionalInvestors: {
      ownershipChange: Number,
      currentOwnership: Number
    }
  },
  marketAnalysis: {
    marketTrend: String,
    sectorPerformance: Number,
    industryRank: Number,
    marketCapRank: Number,
    liquidity: Number,
    correlation: Number
  },
  riskAnalysis: {
    marketRisk: Number,
    industryRisk: Number,
    companySpecificRisk: Number,
    regulatoryRisk: Number,
    currencyRisk: Number,
    interestRateRisk: Number,
    politicalRisk: Number,
    totalRiskScore: Number
  },
  aiExplanation: {
    reasoning: String,
    keyFactors: [String],
    assumptions: [String],
    limitations: [String],
    confidenceFactors: [String]
  },
  charts: {
    priceChart: String,
    technicalChart: String,
    fundamentalChart: String,
    comparisonChart: String
  },
  notes: {
    userNotes: String,
    aiNotes: String,
    followUpActions: [String]
  },
  executionTime: {
    startTime: Date,
    endTime: Date,
    duration: Number
  },
  cost: {
    creditsUsed: Number,
    costInUSD: Number
  },
  metadata: {
    modelVersion: String,
    apiVersion: String,
    dataSources: [String],
    lastUpdated: Date
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    permission: {
      type: String,
      enum: ['view', 'edit', 'comment'],
      default: 'view'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
AnalysisSchema.index({ userId: 1, createdAt: -1 });
AnalysisSchema.index({ stockSymbol: 1, createdAt: -1 });
AnalysisSchema.index({ status: 1, priority: 1 });
AnalysisSchema.index({ userId: 1, isFavorite: 1 });
AnalysisSchema.index({ createdAt: -1 });

// 虚拟字段：分析持续时间（分钟）
AnalysisSchema.virtual('durationMinutes').get(function() {
  if (!this.executionTime || !this.executionTime.startTime || !this.executionTime.endTime) {
    return null;
  }
  
  const durationMs = this.executionTime.endTime - this.executionTime.startTime;
  return Math.round(durationMs / (1000 * 60));
});

// 虚拟字段：是否为近期分析（7天内）
AnalysisSchema.virtual('isRecent').get(function() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return this.createdAt >= sevenDaysAgo;
});

// 方法：更新分析状态
AnalysisSchema.methods.updateStatus = function(status, progress = null, result = null) {
  this.status = status;
  
  if (progress !== null) {
    this.progress = progress;
  }
  
  if (result && status === 'completed') {
    this.result = { ...this.result, ...result };
    this.executionTime = this.executionTime || {};
    this.executionTime.endTime = Date.now();
    this.executionTime.duration = this.executionTime.endTime - (this.executionTime.startTime || Date.now());
  }
  
  if (status === 'processing' && !this.executionTime) {
    this.executionTime = {
      startTime: Date.now()
    };
  }
  
  return this.save();
};

// 方法：添加AI解释
AnalysisSchema.methods.addAiExplanation = function(explanation) {
  this.aiExplanation = { ...this.aiExplanation, ...explanation };
  return this.save();
};

// 方法：添加用户笔记
AnalysisSchema.methods.addUserNote = function(note) {
  this.notes = this.notes || {};
  this.notes.userNotes = note;
  this.metadata = this.metadata || {};
  this.metadata.lastUpdated = Date.now();
  return this.save();
};

// 方法：分享分析
AnalysisSchema.methods.shareAnalysis = function(userId, permission = 'view') {
  const existingShare = this.sharedWith.find(share => 
    share.userId.toString() === userId.toString()
  );
  
  if (existingShare) {
    existingShare.permission = permission;
    existingShare.sharedAt = Date.now();
  } else {
    this.sharedWith.push({
      userId,
      permission,
      sharedAt: Date.now()
    });
  }
  
  return this.save();
};

// 方法：标记为收藏
AnalysisSchema.methods.toggleFavorite = function(isFavorite) {
  this.isFavorite = isFavorite;
  return this.save();
};

module.exports = mongoose.model('Analysis', AnalysisSchema);