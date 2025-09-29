const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: [true, '请提供股票代码'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, '请提供股票名称'],
    trim: true
  },
  exchange: {
    type: String,
    required: [true, '请提供交易所'],
    enum: ['NYSE', 'NASDAQ', 'AMEX', 'SHSE', 'SZSE', 'HKEX', 'TSE', 'LSE', 'OTHER']
  },
  sector: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true
  },
  marketCap: {
    type: Number
  },
  peRatio: {
    type: Number
  },
  eps: {
    type: Number
  },
  dividendYield: {
    type: Number
  },
  beta: {
    type: Number
  },
  latestPrice: {
    type: Number
  },
  change: {
    type: Number
  },
  changePercent: {
    type: Number
  },
  latestUpdate: {
    type: Date
  },
  historicalData: [{
    date: {
      type: Date,
      required: true
    },
    open: {
      type: Number,
      required: true
    },
    high: {
      type: Number,
      required: true
    },
    low: {
      type: Number,
      required: true
    },
    close: {
      type: Number,
      required: true
    },
    volume: {
      type: Number,
      required: true
    },
    adjustedClose: {
      type: Number
    }
  }],
  technicalIndicators: {
    rsi: {
      type: Number
    },
    macd: {
      type: Number
    },
    bollingerBands: {
      upper: Number,
      middle: Number,
      lower: Number
    },
    movingAverages: {
      ma5: Number,
      ma10: Number,
      ma20: Number,
      ma60: Number,
      ma120: Number,
      ma250: Number
    }
  },
  aiRatings: [{
    date: {
      type: Date,
      default: Date.now
    },
    rating: {
      type: Number,
      min: 1,
      max: 10
    },
    recommendation: {
      type: String,
      enum: ['strong sell', 'sell', 'hold', 'buy', 'strong buy']
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    factors: {
      fundamental: Number,
      technical: Number,
      market: Number,
      sentiment: Number
    },
    analysis: String
  }],
  news: [{
    title: String,
    source: String,
    url: String,
    publishedAt: Date,
    sentiment: {
      type: String,
      enum: ['positive', 'negative', 'neutral']
    },
    relevance: Number
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 索引
StockSchema.index({ symbol: 1 });
StockSchema.index({ name: 'text', symbol: 'text' });
StockSchema.index({ sector: 1 });
StockSchema.index({ industry: 1 });
StockSchema.index({ exchange: 1 });
StockSchema.index({ 'historicalData.date': -1 });

// 虚拟字段：计算52周高低
StockSchema.virtual('fiftyTwoWeekHigh').get(function() {
  if (!this.historicalData || this.historicalData.length === 0) return null;
  
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const recentData = this.historicalData.filter(item => item.date >= oneYearAgo);
  if (recentData.length === 0) return null;
  
  return Math.max(...recentData.map(item => item.high));
});

StockSchema.virtual('fiftyTwoWeekLow').get(function() {
  if (!this.historicalData || this.historicalData.length === 0) return null;
  
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const recentData = this.historicalData.filter(item => item.date >= oneYearAgo);
  if (recentData.length === 0) return null;
  
  return Math.min(...recentData.map(item => item.low));
});

// 虚拟字段：获取最新AI评级
StockSchema.virtual('latestAiRating').get(function() {
  if (!this.aiRatings || this.aiRatings.length === 0) return null;
  
  return this.aiRatings.sort((a, b) => b.date - a.date)[0];
});

// 方法：更新最新价格
StockSchema.methods.updateLatestPrice = function(priceData) {
  this.latestPrice = priceData.close;
  this.change = priceData.close - priceData.open;
  this.changePercent = ((priceData.close - priceData.open) / priceData.open) * 100;
  this.latestUpdate = Date.now();
  
  // 添加到历史数据
  if (this.historicalData.length > 365 * 5) { // 保留5年数据
    this.historicalData.shift();
  }
  
  this.historicalData.push({
    date: new Date(),
    open: priceData.open,
    high: priceData.high,
    low: priceData.low,
    close: priceData.close,
    volume: priceData.volume,
    adjustedClose: priceData.adjustedClose
  });
  
  return this.save();
};

// 方法：添加AI评级
StockSchema.methods.addAiRating = function(ratingData) {
  if (this.aiRatings.length > 100) { // 保留最近100个评级
    this.aiRatings.shift();
  }
  
  this.aiRatings.push({
    date: Date.now(),
    rating: ratingData.rating,
    recommendation: ratingData.recommendation,
    confidence: ratingData.confidence,
    factors: ratingData.factors,
    analysis: ratingData.analysis
  });
  
  return this.save();
};

// 方法：添加新闻
StockSchema.methods.addNews = function(newsData) {
  if (this.news.length > 50) { // 保留最近50条新闻
    this.news.shift();
  }
  
  this.news.push({
    title: newsData.title,
    source: newsData.source,
    url: newsData.url,
    publishedAt: newsData.publishedAt,
    sentiment: newsData.sentiment,
    relevance: newsData.relevance
  });
  
  return this.save();
};

module.exports = mongoose.model('Stock', StockSchema);