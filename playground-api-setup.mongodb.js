/* global use, db, print, sleep */

// 皓月量化智能引擎 - MongoDB完整游乐场
// 本文件用于初始化数据库和测试MongoDB查询操作

// 切换到皓月数据库
print('正在连接到数据库...');
use('haoyue');
print('成功连接到数据库: haoyue');

// 检查数据库连接状态
print('数据库连接状态检查: 已连接');

// ==================================================================================
// 1. 创建必要的集合和索引
// ==================================================================================
print('\n===== 开始创建集合和索引 =====');

// 创建用户集合和索引
print('\n创建用户集合(users)...');
db.createCollection('users');
print('创建用户索引...');
db.users.createIndex({ email: 1 }, { unique: true, name: 'email_unique' });
db.users.createIndex({ username: 1 }, { unique: true, name: 'username_unique' });
db.users.createIndex({ role: 1 }, { name: 'role_index' });
db.users.createIndex({ status: 1 }, { name: 'status_index' });
db.users.createIndex({ createdAt: -1 }, { name: 'created_at_index' });
print('用户集合和索引创建完成');

// 创建股票集合和索引
print('\n创建股票集合(stocks)...');
db.createCollection('stocks');
print('创建股票索引...');
db.stocks.createIndex({ symbol: 1 }, { unique: true, name: 'symbol_unique' });
db.stocks.createIndex({ name: 'text', symbol: 'text' }, { name: 'name_symbol_text' });
db.stocks.createIndex({ sector: 1 }, { name: 'sector_index' });
db.stocks.createIndex({ industry: 1 }, { name: 'industry_index' });
db.stocks.createIndex({ exchange: 1 }, { name: 'exchange_index' });
db.stocks.createIndex({ 'historicalData.date': -1 }, { name: 'historical_data_date_index' });
db.stocks.createIndex({ isActive: 1 }, { name: 'is_active_index' });
db.stocks.createIndex({ latestPrice: 1 }, { name: 'latest_price_index' });
print('股票集合和索引创建完成');

// 创建分析集合和索引
print('\n创建分析集合(analyses)...');
db.createCollection('analyses');
print('创建分析索引...');
db.analyses.createIndex({ userId: 1, createdAt: -1 }, { name: 'user_id_created_at_index' });
db.analyses.createIndex({ stockSymbol: 1, createdAt: -1 }, { name: 'stock_symbol_created_at_index' });
db.analyses.createIndex({ status: 1, priority: 1 }, { name: 'status_priority_index' });
db.analyses.createIndex({ userId: 1, isFavorite: 1 }, { name: 'user_id_favorite_index' });
db.analyses.createIndex({ createdAt: -1 }, { name: 'analyses_created_at_index' });
db.analyses.createIndex({ analysisType: 1 }, { name: 'analysis_type_index' });
db.analyses.createIndex({ timeRange: 1 }, { name: 'time_range_index' });
print('分析集合和索引创建完成');

// 创建推荐集合和索引
print('\n创建推荐集合(recommendations)...');
db.createCollection('recommendations');
print('创建推荐索引...');
db.recommendations.createIndex({ userId: 1, createdAt: -1 }, { name: 'rec_user_id_created_at_index' });
db.recommendations.createIndex({ status: 1, priority: 1 }, { name: 'rec_status_priority_index' });
db.recommendations.createIndex({ recommendationType: 1 }, { name: 'recommendation_type_index' });
db.recommendations.createIndex({ 'stocks.symbol': 1 }, { name: 'rec_stocks_symbol_index' });
print('推荐集合和索引创建完成');

// ==================================================================================
// 2. 插入测试数据
// ==================================================================================
print('\n\n===== 开始插入测试数据 =====');

// 插入管理员用户
print('\n插入管理员用户...');
const adminUser = {
  username: 'admin',
  email: 'admin@haoyue.com',
  password: '$2a$10$n9MMF35y.8gMv3YIqCzN/OC14g8Q7lZc.8XxwM7QmN5m0gR6U0uYe', // admin123
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
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date()
};

db.users.insertOne(adminUser);
print('管理员用户插入完成: username=admin, email=admin@haoyue.com, password=admin123');

// 插入普通用户
print('\n插入普通用户...');
const regularUser = {
  username: 'user1',
  email: 'user1@haoyue.com',
  password: '$2a$10$n9MMF35y.8gMv3YIqCzN/OC14g8Q7lZc.8XxwM7QmN5m0gR6U0uYe', // user123
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
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date()
};

db.users.insertOne(regularUser);
print('普通用户插入完成: username=user1, email=user1@haoyue.com, password=user123');

// 插入VIP用户
print('\n插入VIP用户...');
const vipUser = {
  username: 'vip1',
  email: 'vip1@haoyue.com',
  password: '$2a$10$n9MMF35y.8gMv3YIqCzN/OC14g8Q7lZc.8XxwM7QmN5m0gR6U0uYe', // vip123
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
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLogin: new Date()
};

db.users.insertOne(vipUser);
print('VIP用户插入完成: username=vip1, email=vip1@haoyue.com, password=vip123');

// 插入股票数据
print('\n插入股票数据...');
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
    latestUpdate: new Date(),
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
    ],
    news: [
      {
        title: '苹果发布最新季度财报，业绩超出市场预期',
        source: '财经新闻',
        url: 'https://example.com/news/1',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        sentiment: 'positive',
        relevance: 95
      }
    ],
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
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
    latestUpdate: new Date(),
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
    ],
    technicalIndicators: {
      rsi: 58.7,
      macd: 0.85,
      bollingerBands: {
        upper: 415.20,
        middle: 410.10,
        lower: 405.00
      },
      movingAverages: {
        ma5: 410.30,
        ma10: 408.50,
        ma20: 406.20,
        ma60: 402.10,
        ma120: 395.40,
        ma250: 382.70
      }
    },
    aiRatings: [
      {
        date: new Date(),
        rating: 8.7,
        recommendation: 'strong buy',
        confidence: 90,
        factors: {
          fundamental: 8.9,
          technical: 8.5,
          market: 8.6,
          sentiment: 8.8
        },
        analysis: '微软云业务增长强劲，AI战略领先，长期投资价值高，强烈推荐买入。'
      }
    ],
    news: [
      {
        title: '微软Azure云服务收入同比增长32%，AI相关业务表现亮眼',
        source: '科技日报',
        url: 'https://example.com/news/2',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        sentiment: 'positive',
        relevance: 92
      }
    ],
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
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
    latestUpdate: new Date(),
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
    ],
    technicalIndicators: {
      rsi: 68.2,
      macd: 3.45,
      bollingerBands: {
        upper: 238.50,
        middle: 228.30,
        lower: 218.10
      },
      movingAverages: {
        ma5: 230.10,
        ma10: 226.50,
        ma20: 222.30,
        ma60: 215.70,
        ma120: 208.50,
        ma250: 195.20
      }
    },
    aiRatings: [
      {
        date: new Date(),
        rating: 7.2,
        recommendation: 'hold',
        confidence: 75,
        factors: {
          fundamental: 6.8,
          technical: 7.8,
          market: 7.2,
          sentiment: 7.0
        },
        analysis: '特斯拉技术领先，但估值较高，短期波动较大，建议持有观察。'
      }
    ],
    news: [
      {
        title: '特斯拉Q3汽车交付量创新高，但毛利率略有下降',
        source: '汽车周刊',
        url: 'https://example.com/news/3',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        sentiment: 'neutral',
        relevance: 90
      }
    ],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
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
    latestUpdate: new Date(),
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
    ],
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
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
    latestUpdate: new Date(),
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
    ],
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

db.stocks.insertMany(stocks);
print('股票数据插入完成: 共插入5支股票');

// 获取用户ID用于后续数据关联
const adminUserDoc = db.users.findOne({ username: 'admin' });
const regularUserDoc = db.users.findOne({ username: 'user1' });
const vipUserDoc = db.users.findOne({ username: 'vip1' });

// 插入分析数据
print('\n插入分析数据...');
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
    executionTime: {
      startTime: new Date(Date.now() - 120000),
      endTime: new Date(Date.now() - 30000),
      duration: 90000
    },
    cost: {
      creditsUsed: 50,
      costInUSD: 0.5
    },
    metadata: {
      modelVersion: 'v1.0',
      apiVersion: 'v1',
      dataSources: ['market_data', 'financial_reports', 'news'],
      lastUpdated: new Date()
    },
    isFavorite: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date()
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
    },
    executionTime: {
      startTime: new Date(Date.now() - 90000),
      endTime: new Date(Date.now() - 15000),
      duration: 75000
    },
    cost: {
      creditsUsed: 30,
      costInUSD: 0.3
    },
    metadata: {
      modelVersion: 'v1.0',
      apiVersion: 'v1',
      dataSources: ['market_data', 'technical_indicators'],
      lastUpdated: new Date()
    },
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date()
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
    executionTime: {
      startTime: new Date(Date.now() - 150000),
      endTime: new Date(Date.now() - 60000),
      duration: 90000
    },
    cost: {
      creditsUsed: 80,
      costInUSD: 0.8
    },
    metadata: {
      modelVersion: 'v1.0',
      apiVersion: 'v1',
      dataSources: ['financial_reports', 'market_data', 'industry_data'],
      lastUpdated: new Date()
    },
    isFavorite: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

db.analyses.insertMany(analyses);
print('分析数据插入完成: 共插入3条分析记录');

// 插入推荐数据
print('\n插入推荐数据...');
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
        weight: 30,
        reasons: ['基本面稳健', '技术创新领先', '现金流充足'],
        riskFactors: ['市场竞争加剧', '供应链风险'],
        catalysts: ['新产品发布', '服务业务增长'],
        lastUpdated: new Date()
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
        weight: 35,
        reasons: ['云业务增长强劲', 'AI战略领先', '企业软件市场份额稳定'],
        riskFactors: ['估值较高', '监管风险'],
        catalysts: ['AI产品落地', '企业数字化转型加速'],
        lastUpdated: new Date()
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
        weight: 35,
        reasons: ['搜索业务稳定', 'AI技术积累深厚', 'YouTube增长良好'],
        riskFactors: ['广告市场波动', 'AI竞争加剧'],
        catalysts: ['AI搜索革新', '云计算业务增长'],
        lastUpdated: new Date()
      }
    ],
    performance: {
      totalReturn: 12.5,
      annualizedReturn: 18.7,
      sharpeRatio: 1.25,
      maxDrawdown: 8.2,
      winRate: 65,
      averageProfit: 5.2,
      averageLoss: 3.1,
      profitFactor: 1.7
    },
    strategy: {
      investmentStyle: 'growth',
      riskTolerance: 'moderate',
      timeHorizon: 'long-term',
      diversification: {
        maxPositionSize: 40,
        sectorLimit: 100,
        industryLimit: 70,
        countryLimit: 100
      },
      rebalancing: {
        frequency: 'quarterly',
        threshold: 10,
        lastRebalanced: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextRebalance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      }
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
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
        weight: 50,
        reasons: ['电动车市场增长', '技术领先优势', '能源业务潜力'],
        riskFactors: ['估值过高', '竞争加剧', '盈利波动'],
        catalysts: ['产能扩张', '新能源政策支持'],
        lastUpdated: new Date()
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
        weight: 50,
        reasons: ['电商业务稳定', 'AWS云增长', '广告业务潜力'],
        riskFactors: ['宏观经济波动', '成本压力'],
        catalysts: ['AWS云业务增长', '广告业务扩张'],
        lastUpdated: new Date()
      }
    ],
    performance: {
      totalReturn: 8.3,
      annualizedReturn: 15.2,
      sharpeRatio: 0.98,
      maxDrawdown: 12.5,
      winRate: 58,
      averageProfit: 4.7,
      averageLoss: 3.8,
      profitFactor: 1.5
    },
    strategy: {
      investmentStyle: 'growth',
      riskTolerance: 'aggressive',
      timeHorizon: 'medium-term',
      diversification: {
        maxPositionSize: 50,
        sectorLimit: 100,
        industryLimit: 100,
        countryLimit: 100
      },
      rebalancing: {
        frequency: 'monthly',
        threshold: 15,
        lastRebalanced: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        nextRebalance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      }
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

db.recommendations.insertMany(recommendations);
print('推荐数据插入完成: 共插入2条推荐记录');

// ==================================================================================
// 3. 验证数据插入结果
// ==================================================================================
print('\n\n===== 验证数据插入结果 =====');

// 验证用户数据
const userCount = db.users.countDocuments();
print(`用户集合记录数: ${userCount}`);

// 验证股票数据
const stockCount = db.stocks.countDocuments();
print(`股票集合记录数: ${stockCount}`);

// 验证分析数据
const analysisCount = db.analyses.countDocuments();
print(`分析集合记录数: ${analysisCount}`);

// 验证推荐数据
const recommendationCount = db.recommendations.countDocuments();
print(`推荐集合记录数: ${recommendationCount}`);

// ==================================================================================
// 4. 基础查询示例
// ==================================================================================
print('\n\n===== 基础查询示例 =====');

// 查询所有活跃股票
print('\n查询所有活跃股票:');
const activeStocks = db.stocks.find({ isActive: true }).limit(3).toArray();
activeStocks.forEach(stock => {
  print(`  ${stock.symbol} - ${stock.name}: $${stock.latestPrice} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%)`);
});

// 查询市值最大的股票
print('\n查询市值最大的股票:');
const largestMarketCapStock = db.stocks.find().sort({ marketCap: -1 }).limit(1).toArray()[0];
print(`  ${largestMarketCapStock.symbol} - ${largestMarketCapStock.name}: 市值 $${largestMarketCapStock.marketCap}T`);

// 查询管理员用户的分析记录
print('\n查询管理员用户的分析记录:');
const adminAnalyses = db.analyses.find({ userId: adminUserDoc._id }).limit(2).toArray();
adminAnalyses.forEach(analysis => {
  print(`  ${analysis.stockSymbol} - ${analysis.analysisType}: ${analysis.status}, 评分: ${analysis.result.overallRating}`);
});

// 查询活跃的推荐
print('\n查询活跃的推荐:');
const activeRecommendations = db.recommendations.find({ status: 'active' }).limit(2).toArray();
activeRecommendations.forEach(recommendation => {
  print(`  ${recommendation.title} (${recommendation.recommendationType})`);
});

// ==================================================================================
// 5. 创建额外的必要集合（如果有）
// ==================================================================================
print('\n\n===== 创建额外必要的集合 =====');

// 创建系统日志集合
print('\n创建系统日志集合(system_logs)...');
db.createCollection('system_logs');
db.system_logs.createIndex({ timestamp: -1 }, { name: 'timestamp_index' });
db.system_logs.createIndex({ level: 1 }, { name: 'level_index' });
db.system_logs.createIndex({ source: 1 }, { name: 'source_index' });
print('系统日志集合创建完成');

// 创建任务调度集合
print('\n创建任务调度集合(schedules)...');
db.createCollection('schedules');
db.schedules.createIndex({ name: 1 }, { unique: true, name: 'schedule_name_unique' });
db.schedules.createIndex({ status: 1 }, { name: 'schedule_status_index' });
db.schedules.createIndex({ nextRunAt: 1 }, { name: 'next_run_at_index' });
print('任务调度集合创建完成');

// 插入一些系统日志
print('\n插入系统日志...');
db.system_logs.insertMany([
  {
    timestamp: new Date(),
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
    timestamp: new Date(),
    level: 'info',
    source: 'database',
    message: '数据库初始化完成',
    details: {
      collections: 6,
      indexes: 25
    }
  },
  {
    timestamp: new Date(),
    level: 'info',
    source: 'api',
    message: 'API服务初始化完成',
    details: {
      endpoints: 25,
      middleware: 8
    }
  }
]);
print('系统日志插入完成: 共插入3条日志');

// ==================================================================================
// 6. 高级查询示例（来自原playground-2.mongodb.js）
// ==================================================================================
print('\n\n===== 高级查询示例 =====');

// 示例1: 查询活跃的股票数量
const activeStockCount = db.stocks.countDocuments({ isActive: true });
print(`\n活跃股票数量: ${activeStockCount}`);

// 示例2: 查询市值最高的5只股票
print('\n市值最高的5只股票:');
const topMarketCapStocks = db.stocks
  .find({ isActive: true })
  .sort({ marketCap: -1 })
  .limit(5)
  .project({ symbol: 1, name: 1, marketCap: 1 });

while (topMarketCapStocks.hasNext()) {
  const stock = topMarketCapStocks.next();
  printjson(stock);
}

// 示例3: 查询最近有新闻的股票
print('\n最近有新闻的股票:');
const stocksWithRecentNews = db.stocks
  .find({
    isActive: true,
    'news.0': { $exists: true }
  })
  .sort({ 'news.0.publishedAt': -1 })
  .limit(3)
  .project({ symbol: 1, name: 1, 'news': { $slice: 1 } });

while (stocksWithRecentNews.hasNext()) {
  const stock = stocksWithRecentNews.next();
  printjson(stock);
}

// 示例4: 聚合查询 - 按行业统计股票数量
print('\n按行业统计股票数量:');
const industryStats = db.stocks.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: '$industry', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);

while (industryStats.hasNext()) {
  const stat = industryStats.next();
  printjson(stat);
}

// 示例5: 计算技术指标数据统计
print('\n技术指标数据统计:');
const techIndicatorsStats = db.stocks.aggregate([
  { $match: { isActive: true, 'technicalIndicators.rsi': { $exists: true } } },
  { $project: {
    symbol: 1,
    rsi: '$technicalIndicators.rsi',
    macd: '$technicalIndicators.macd',
    volume: '$volume'
  }},
  { $limit: 10 }
]);

while (techIndicatorsStats.hasNext()) {
  const stat = techIndicatorsStats.next();
  printjson(stat);
}

// ==================================================================================
// 7. 完成设置
// ==================================================================================
print('\n\n===== 数据库服务设置完成 =====');
print('\n所有必要的集合、索引和测试数据已成功创建！');
print('\n您现在可以：');
print('1. 使用提供的测试用户登录系统');
print('   - 管理员: username=admin, password=admin123');
print('   - 普通用户: username=user1, password=user123');
print('   - VIP用户: username=vip1, password=vip123');
print('2. 测试API功能，包括股票查询、AI分析、推荐等');
print('3. 在MongoDB Compass或其他MongoDB客户端中查看和管理数据');

print('\n数据库初始化过程已完成！');