// 使用相对路径引用项目依赖
const mongoose = require('./haoyue-backend/node_modules/mongoose');
const bcrypt = require('./haoyue-backend/node_modules/bcryptjs');

// 定义模型
const StockSchema = new mongoose.Schema({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  exchange: { type: String, required: true },
  sector: { type: String },
  industry: { type: String },
  country: { type: String },
  isActive: { type: Boolean, default: true },
  description: { type: String },
  website: { type: String },
  marketCap: { type: Number },
  peRatio: { type: Number },
  eps: { type: Number },
  dividendYield: { type: Number },
  beta: { type: Number },
  latestPrice: { type: Number },
  change: { type: Number },
  changePercent: { type: Number },
  latestUpdate: { type: Date, default: Date.now },
  historicalData: [{
    date: { type: Date },
    open: { type: Number },
    high: { type: Number },
    low: { type: Number },
    close: { type: Number },
    volume: { type: Number },
    adjustedClose: { type: Number }
  }],
  technicalIndicators: {
    rsi: { type: Number },
    macd: { type: Number },
    bollingerBands: {
      upper: { type: Number },
      middle: { type: Number },
      lower: { type: Number }
    },
    movingAverages: {
      ma5: { type: Number },
      ma10: { type: Number },
      ma20: { type: Number },
      ma60: { type: Number },
      ma120: { type: Number },
      ma250: { type: Number }
    }
  },
  aiRatings: [{
    date: { type: Date },
    rating: { type: Number },
    recommendation: { type: String },
    confidence: { type: Number },
    factors: {
      fundamental: { type: Number },
      technical: { type: Number },
      market: { type: Number },
      sentiment: { type: Number }
    },
    analysis: { type: String }
  }],
  news: [{
    title: { type: String },
    source: { type: String },
    url: { type: String },
    publishedAt: { type: Date },
    sentiment: { type: String },
    relevance: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['user', 'vip', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  emailVerified: { type: Boolean, default: false },
  preferences: {
    darkMode: { type: Boolean, default: false },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    favoriteStocks: [{ type: String }]
  },
  subscription: {
    plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const AnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stockSymbol: { type: String, required: true },
  stockName: { type: String },
  analysisType: { type: String, enum: ['comprehensive', 'technical', 'fundamental', 'sentiment'] },
  timeRange: { type: String, enum: ['1d', '1w', '1m', '3m', '6m', '1y', '3y', '5y'] },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  progress: { type: Number, default: 0 },
  result: {
    overallRating: { type: Number },
    recommendation: { type: String, enum: ['strong sell', 'sell', 'hold', 'buy', 'strong buy'] },
    confidenceLevel: { type: Number },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
    targetPrice: { type: Number },
    stopLossPrice: { type: Number },
    upsidePotential: { type: Number },
    downsideRisk: { type: Number }
  },
  factors: {
    fundamentalScore: { type: Number },
    technicalScore: { type: Number },
    sentimentScore: { type: Number },
    marketScore: { type: Number },
    industryScore: { type: Number }
  },
  executionTime: {
    startTime: { type: Date },
    endTime: { type: Date },
    duration: { type: Number }
  },
  cost: {
    creditsUsed: { type: Number },
    costInUSD: { type: Number }
  },
  metadata: {
    modelVersion: { type: String },
    apiVersion: { type: String },
    dataSources: [{ type: String }],
    lastUpdated: { type: Date }
  },
  isFavorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const RecommendationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recommendationType: { type: String, enum: ['personalized', 'trending', 'sector', 'market'] },
  status: { type: String, enum: ['active', 'expired', 'draft'], default: 'active' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  title: { type: String, required: true },
  description: { type: String },
  stocks: [{
    symbol: { type: String },
    name: { type: String },
    exchange: { type: String },
    sector: { type: String },
    industry: { type: String },
    recommendation: { type: String },
    rating: { type: Number },
    confidence: { type: Number },
    targetPrice: { type: Number },
    currentPrice: { type: Number },
    upsidePotential: { type: Number },
    riskLevel: { type: String },
    timeHorizon: { type: String },
    weight: { type: Number },
    reasons: [{ type: String }],
    riskFactors: [{ type: String }],
    catalysts: [{ type: String }],
    lastUpdated: { type: Date }
  }],
  performance: {
    totalReturn: { type: Number },
    annualizedReturn: { type: Number },
    sharpeRatio: { type: Number },
    maxDrawdown: { type: Number },
    winRate: { type: Number },
    averageProfit: { type: Number },
    averageLoss: { type: Number },
    profitFactor: { type: Number }
  },
  strategy: {
    investmentStyle: { type: String },
    riskTolerance: { type: String },
    timeHorizon: { type: String },
    diversification: {
      maxPositionSize: { type: Number },
      sectorLimit: { type: Number },
      industryLimit: { type: Number },
      countryLimit: { type: Number }
    },
    rebalancing: {
      frequency: { type: String },
      threshold: { type: Number },
      lastRebalanced: { type: Date },
      nextRebalance: { type: Date }
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SystemLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  level: { type: String, enum: ['debug', 'info', 'warn', 'error', 'fatal'] },
  source: { type: String },
  message: { type: String },
  details: { type: mongoose.Schema.Types.Mixed }
});

const ScheduleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  taskType: { type: String },
  cronExpression: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'paused'], default: 'active' },
  lastRunAt: { type: Date },
  nextRunAt: { type: Date },
  runCount: { type: Number, default: 0 },
  lastSuccessAt: { type: Date },
  lastFailureAt: { type: Date },
  failureCount: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 连接数据库
async function connectDB() {
  try {
    const mongoURI = 'mongodb://localhost:27017/haoyue';
    console.log(`正在连接到MongoDB: ${mongoURI}`);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('成功连接到MongoDB');
  } catch (error) {
    console.error('MongoDB连接失败:', error.message);
    process.exit(1);
  }
}

// 创建模型实例
const Stock = mongoose.model('Stock', StockSchema);
const User = mongoose.model('User', UserSchema);
const Analysis = mongoose.model('Analysis', AnalysisSchema);
const Recommendation = mongoose.model('Recommendation', RecommendationSchema);
const SystemLog = mongoose.model('SystemLog', SystemLogSchema);
const Schedule = mongoose.model('Schedule', ScheduleSchema);

// 创建集合和索引
async function createCollectionsAndIndexes() {
  try {
    console.log('\n===== 开始创建集合和索引 =====');

    // 创建用户集合和索引
    console.log('\n创建用户集合和索引...');
    await User.createIndexes();
    console.log('用户集合和索引创建完成');

    // 创建股票集合和索引
    console.log('\n创建股票集合和索引...');
    await Stock.createIndexes();
    console.log('股票集合和索引创建完成');

    // 创建分析集合和索引
    console.log('\n创建分析集合和索引...');
    await Analysis.createIndexes();
    console.log('分析集合和索引创建完成');

    // 创建推荐集合和索引
    console.log('\n创建推荐集合和索引...');
    await Recommendation.createIndexes();
    console.log('推荐集合和索引创建完成');

    // 创建系统日志集合和索引
    console.log('\n创建系统日志集合和索引...');
    await SystemLog.createIndexes();
    console.log('系统日志集合和索引创建完成');

    // 创建任务调度集合和索引
    console.log('\n创建任务调度集合和索引...');
    await Schedule.createIndexes();
    console.log('任务调度集合和索引创建完成');

  } catch (error) {
    console.error('创建集合和索引失败:', error.message);
    throw error;
  }
}

// 插入测试数据
async function insertTestData() {
  try {
    console.log('\n\n===== 开始插入测试数据 =====');

    // 插入用户数据
    console.log('\n插入用户数据...');
    const password = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      username: 'admin',
      email: 'admin@haoyue.com',
      password: password,
      name: '管理员',
      role: 'admin',
      status: 'active',
      emailVerified: true,
      preferences: {
        darkMode: false,
        notifications: {
          email: true,
          sms: false
        },
        favoriteStocks: ['AAPL', 'MSFT']
      },
      subscription: {
        plan: 'enterprise',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });
    await adminUser.save();
    console.log('管理员用户插入完成: username=admin, email=admin@haoyue.com, password=admin123');

    const regularUser = new User({
      username: 'user1',
      email: 'user1@haoyue.com',
      password: password,
      name: '普通用户',
      role: 'user',
      status: 'active',
      emailVerified: true,
      preferences: {
        darkMode: true,
        notifications: {
          email: true,
          sms: false
        },
        favoriteStocks: ['TSLA', 'AMZN']
      },
      subscription: {
        plan: 'free',
        isActive: true
      }
    });
    await regularUser.save();
    console.log('普通用户插入完成: username=user1, email=user1@haoyue.com, password=user123');

    const vipUser = new User({
      username: 'vip1',
      email: 'vip1@haoyue.com',
      password: password,
      name: 'VIP用户',
      role: 'vip',
      status: 'active',
      emailVerified: true,
      preferences: {
        darkMode: false,
        notifications: {
          email: true,
          sms: true
        },
        favoriteStocks: ['GOOGL', 'META']
      },
      subscription: {
        plan: 'premium',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });
    await vipUser.save();
    console.log('VIP用户插入完成: username=vip1, email=vip1@haoyue.com, password=vip123');

    // 插入股票数据
    console.log('\n插入股票数据...');
    const stocks = [
      {
        symbol: 'AAPL',
        name: '苹果公司',
        exchange: 'NASDAQ',
        sector: '科技',
        industry: '电子设备',
        country: '美国',
        isActive: true,
        description: '苹果公司设计、制造和销售智能手机、个人电脑、平板电脑、可穿戴设备和配件，并提供各种相关服务。',
        website: 'https://www.apple.com',
        marketCap: 3.02,
        peRatio: 30.5,
        eps: 6.15,
        dividendYield: 0.55,
        beta: 1.21,
        latestPrice: 187.23,
        change: 1.23,
        changePercent: 0.66,
        historicalData: [
          {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            open: 186.00,
            high: 187.50,
            low: 185.20,
            close: 187.23,
            volume: 50432100,
            adjustedClose: 187.23
          },
          {
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            open: 188.50,
            high: 189.00,
            low: 186.00,
            close: 186.00,
            volume: 45678900,
            adjustedClose: 186.00
          }
        ],
        technicalIndicators: {
          rsi: 62.3,
          macd: 1.25,
          bollingerBands: {
            upper: 192.50,
            middle: 186.30,
            lower: 180.10
          },
          movingAverages: {
            ma5: 185.70,
            ma10: 184.30,
            ma20: 183.10,
            ma60: 179.50,
            ma120: 175.20,
            ma250: 168.80
          }
        },
        aiRatings: [
          {
            date: new Date(),
            rating: 8.5,
            recommendation: 'buy',
            confidence: 88,
            factors: {
              fundamental: 8.7,
              technical: 8.3,
              market: 8.5,
              sentiment: 8.6
            },
            analysis: '苹果公司基本面稳健，技术面走强，市场情绪积极，推荐买入。'
          }
        ]
      },
      {
        symbol: 'MSFT',
        name: '微软公司',
        exchange: 'NASDAQ',
        sector: '科技',
        industry: '软件服务',
        country: '美国',
        isActive: true,
        description: '微软公司开发、授权和支持软件、服务、设备和解决方案。',
        website: 'https://www.microsoft.com',
        marketCap: 3.25,
        peRatio: 32.8,
        eps: 12.50,
        dividendYield: 0.80,
        beta: 0.95,
        latestPrice: 410.56,
        change: -2.34,
        changePercent: -0.57,
        historicalData: [
          {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            open: 412.90,
            high: 413.20,
            low: 410.10,
            close: 410.56,
            volume: 25341200,
            adjustedClose: 410.56
          }
        ]
      },
      {
        symbol: 'TSLA',
        name: '特斯拉',
        exchange: 'NASDAQ',
        sector: '汽车',
        industry: '汽车制造',
        country: '美国',
        isActive: true,
        description: '特斯拉设计、开发、制造和销售全电动汽车和能源存储系统，并提供相关服务。',
        website: 'https://www.tesla.com',
        marketCap: 0.75,
        peRatio: 78.5,
        eps: 3.00,
        dividendYield: 0,
        beta: 2.25,
        latestPrice: 232.87,
        change: 5.67,
        changePercent: 2.5,
        historicalData: [
          {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            open: 227.20,
            high: 233.50,
            low: 226.80,
            close: 232.87,
            volume: 125432100,
            adjustedClose: 232.87
          }
        ]
      },
      {
        symbol: 'AMZN',
        name: '亚马逊',
        exchange: 'NASDAQ',
        sector: '零售',
        industry: '电子商务',
        country: '美国',
        isActive: true,
        description: '亚马逊是一家全球性的电子商务、云计算、数字流媒体和人工智能公司。',
        website: 'https://www.amazon.com',
        marketCap: 1.98,
        peRatio: 35.2,
        eps: 5.65,
        dividendYield: 0,
        beta: 1.18,
        latestPrice: 198.45,
        change: 0.89,
        changePercent: 0.45,
        historicalData: [
          {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            open: 197.56,
            high: 198.80,
            low: 197.10,
            close: 198.45,
            volume: 35432100,
            adjustedClose: 198.45
          }
        ]
      },
      {
        symbol: 'GOOGL',
        name: '谷歌',
        exchange: 'NASDAQ',
        sector: '科技',
        industry: '互联网服务',
        country: '美国',
        isActive: true,
        description: '谷歌是一家全球性的科技公司，专注于互联网相关服务和产品。',
        website: 'https://www.google.com',
        marketCap: 1.92,
        peRatio: 28.7,
        eps: 4.70,
        dividendYield: 0,
        beta: 1.05,
        latestPrice: 134.78,
        change: -1.23,
        changePercent: -0.91,
        historicalData: [
          {
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
            open: 136.01,
            high: 136.50,
            low: 134.50,
            close: 134.78,
            volume: 28987600,
            adjustedClose: 134.78
          }
        ]
      }
    ];

    await Stock.insertMany(stocks);
    console.log('股票数据插入完成: 共插入5支股票');

    // 获取用户ID用于关联
    const [adminUserDoc, regularUserDoc, vipUserDoc] = await Promise.all([
      User.findOne({ username: 'admin' }),
      User.findOne({ username: 'user1' }),
      User.findOne({ username: 'vip1' })
    ]);

    // 插入分析数据
    console.log('\n插入分析数据...');
    const analyses = [
      {
        userId: adminUserDoc._id,
        stockSymbol: 'AAPL',
        stockName: '苹果公司',
        analysisType: 'comprehensive',
        timeRange: '1y',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        result: {
          overallRating: 8.5,
          recommendation: 'buy',
          confidenceLevel: 88,
          riskLevel: 'medium',
          targetPrice: 205.00,
          stopLossPrice: 175.00,
          upsidePotential: 9.5,
          downsideRisk: 6.5
        },
        factors: {
          fundamentalScore: 87,
          technicalScore: 83,
          sentimentScore: 86,
          marketScore: 85,
          industryScore: 88
        },
        isFavorite: true
      },
      {
        userId: regularUserDoc._id,
        stockSymbol: 'TSLA',
        stockName: '特斯拉',
        analysisType: 'technical',
        timeRange: '6m',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        result: {
          overallRating: 7.2,
          recommendation: 'hold',
          confidenceLevel: 75,
          riskLevel: 'high',
          targetPrice: 250.00,
          stopLossPrice: 210.00,
          upsidePotential: 7.4,
          downsideRisk: 9.8
        },
        factors: {
          fundamentalScore: 68,
          technicalScore: 78,
          sentimentScore: 70,
          marketScore: 72,
          industryScore: 75
        }
      },
      {
        userId: vipUserDoc._id,
        stockSymbol: 'MSFT',
        stockName: '微软公司',
        analysisType: 'fundamental',
        timeRange: '5y',
        status: 'completed',
        priority: 'high',
        progress: 100,
        result: {
          overallRating: 8.7,
          recommendation: 'strong buy',
          confidenceLevel: 90,
          riskLevel: 'medium',
          targetPrice: 450.00,
          stopLossPrice: 380.00,
          upsidePotential: 9.6,
          downsideRisk: 7.4
        },
        factors: {
          fundamentalScore: 89,
          technicalScore: 85,
          sentimentScore: 88,
          marketScore: 86,
          industryScore: 90
        },
        isFavorite: true
      }
    ];

    await Analysis.insertMany(analyses);
    console.log('分析数据插入完成: 共插入3条分析记录');

    // 插入推荐数据
    console.log('\n插入推荐数据...');
    const recommendations = [
      {
        userId: adminUserDoc._id,
        recommendationType: 'personalized',
        status: 'active',
        priority: 'high',
        title: '科技股投资组合推荐',
        description: '根据您的风险偏好和投资目标，推荐的科技股投资组合',
        stocks: [
          {
            symbol: 'AAPL',
            name: '苹果公司',
            exchange: 'NASDAQ',
            sector: '科技',
            industry: '电子设备',
            recommendation: 'buy',
            rating: 8.5,
            confidence: 88,
            targetPrice: 205.00,
            currentPrice: 187.23,
            upsidePotential: 9.5,
            riskLevel: 'medium',
            timeHorizon: 'long-term',
            weight: 30
          },
          {
            symbol: 'MSFT',
            name: '微软公司',
            exchange: 'NASDAQ',
            sector: '科技',
            industry: '软件服务',
            recommendation: 'strong buy',
            rating: 8.7,
            confidence: 90,
            targetPrice: 450.00,
            currentPrice: 410.56,
            upsidePotential: 9.6,
            riskLevel: 'medium',
            timeHorizon: 'long-term',
            weight: 35
          },
          {
            symbol: 'GOOGL',
            name: '谷歌',
            exchange: 'NASDAQ',
            sector: '科技',
            industry: '互联网服务',
            recommendation: 'buy',
            rating: 8.0,
            confidence: 85,
            targetPrice: 150.00,
            currentPrice: 134.78,
            upsidePotential: 11.3,
            riskLevel: 'medium',
            timeHorizon: 'long-term',
            weight: 35
          }
        ]
      },
      {
        userId: regularUserDoc._id,
        recommendationType: 'trending',
        status: 'active',
        priority: 'medium',
        title: '热门成长股推荐',
        description: '当前市场上表现强劲的成长股推荐',
        stocks: [
          {
            symbol: 'TSLA',
            name: '特斯拉',
            exchange: 'NASDAQ',
            sector: '汽车',
            industry: '汽车制造',
            recommendation: 'hold',
            rating: 7.2,
            confidence: 75,
            targetPrice: 250.00,
            currentPrice: 232.87,
            upsidePotential: 7.4,
            riskLevel: 'high',
            timeHorizon: 'medium-term',
            weight: 50
          },
          {
            symbol: 'AMZN',
            name: '亚马逊',
            exchange: 'NASDAQ',
            sector: '零售',
            industry: '电子商务',
            recommendation: 'buy',
            rating: 7.8,
            confidence: 82,
            targetPrice: 220.00,
            currentPrice: 198.45,
            upsidePotential: 10.9,
            riskLevel: 'medium',
            timeHorizon: 'medium-term',
            weight: 50
          }
        ]
      }
    ];

    await Recommendation.insertMany(recommendations);
    console.log('推荐数据插入完成: 共插入2条推荐记录');

    // 插入系统日志
    console.log('\n插入系统日志...');
    const logs = [
      {
        level: 'info',
        source: 'server',
        message: '服务器启动成功',
        details: {
          version: '1.0.0',
          environment: 'development',
          port: 3000
        }
      },
      {
        level: 'info',
        source: 'database',
        message: '数据库初始化完成',
        details: {
          collections: 6,
          indexes: 25
        }
      },
      {
        level: 'info',
        source: 'api',
        message: 'API服务初始化完成',
        details: {
          endpoints: 25,
          middleware: 8
        }
      }
    ];

    await SystemLog.insertMany(logs);
    console.log('系统日志插入完成: 共插入3条日志');

  } catch (error) {
    console.error('插入测试数据失败:', error.message);
    throw error;
  }
}

// 验证数据插入结果
async function verifyData() {
  try {
    console.log('\n\n===== 验证数据插入结果 =====');

    // 验证用户数据
    const userCount = await User.countDocuments();
    console.log(`用户集合记录数: ${userCount}`);

    // 验证股票数据
    const stockCount = await Stock.countDocuments();
    console.log(`股票集合记录数: ${stockCount}`);

    // 验证分析数据
    const analysisCount = await Analysis.countDocuments();
    console.log(`分析集合记录数: ${analysisCount}`);

    // 验证推荐数据
    const recommendationCount = await Recommendation.countDocuments();
    console.log(`推荐集合记录数: ${recommendationCount}`);

    // 验证系统日志
    const logCount = await SystemLog.countDocuments();
    console.log(`系统日志集合记录数: ${logCount}`);

  } catch (error) {
    console.error('验证数据失败:', error.message);
    throw error;
  }
}

// 主函数
async function initDatabase() {
  try {
    await connectDB();
    await createCollectionsAndIndexes();
    await insertTestData();
    await verifyData();

    console.log('\n\n===== 数据库服务设置完成 =====');
    console.log('\n所有必要的集合、索引和测试数据已成功创建！');
    console.log('\n您现在可以：');
    console.log('1. 使用提供的测试用户登录系统');
    console.log('   - 管理员: username=admin, password=admin123');
    console.log('   - 普通用户: username=user1, password=user123');
    console.log('   - VIP用户: username=vip1, password=vip123');
    console.log('2. 测试API功能，包括股票查询、AI分析、推荐等');
    console.log('3. 在MongoDB Compass或其他MongoDB客户端中查看和管理数据');
    console.log('\n数据库初始化过程已完成！');

    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initDatabase();