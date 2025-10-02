const crypto = require('crypto');
const { logger } = require('./logger');

// 模拟数据存储
class MockDataManager {
  constructor() {
    this.mockUsers = [];
    this.mockStocks = [];
    this.mockAnalyses = [];
    this.mockRecommendations = [];
    this.mockNews = [];
    
    // 初始化模拟数据
    this.initializeMockData();
  }

  // 初始化模拟数据
  initializeMockData() {
    this.initMockUsers();
    this.initMockStocks();
    this.initMockAnalyses();
    this.initMockRecommendations();
    this.initMockNews();
  }

  // 初始化模拟用户数据
  initMockUsers() {
    // 注意：这只是模拟数据，在生产环境中密码应该使用bcrypt等安全方式哈希存储
    this.mockUsers = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        // 模拟密码: admin123 (使用SHA-256哈希)
        passwordHash: '0192023a7bbd73250516f069df18b500',
        role: 'admin',
        createdAt: new Date('2023-01-01T00:00:00Z')
      },
      {
        id: '2',
        username: 'user1',
        email: 'user1@example.com',
        // 模拟密码: user123 (使用SHA-256哈希)
        passwordHash: '6ad14ba9986e3615423dfca256d04e3f',
        role: 'user',
        createdAt: new Date('2023-01-02T00:00:00Z')
      },
      {
        id: '3',
        username: 'analyst1',
        email: 'analyst1@example.com',
        // 模拟密码: analyst123 (使用SHA-256哈希)
        passwordHash: '4297f44b13955235245b2497399d7a93',
        role: 'analyst',
        createdAt: new Date('2023-01-03T00:00:00Z')
      }
    ];
  }

  // 初始化模拟股票数据
  initMockStocks() {
    this.mockStocks = [
      {
        id: 'AAPL',
        name: 'Apple Inc.',
        industry: 'Technology',
        currentPrice: 182.48,
        previousClose: 181.25,
        change: 1.23,
        changePercent: 0.68,
        marketCap: 2850000000000,
        volume: 52000000,
        peRatio: 29.45,
        sector: 'Consumer Electronics',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
        // 添加技术指标
        technicalIndicators: {
          rsi: 65.2,
          macd: 2.1,
          sma20: 178.5,
          sma50: 172.3,
          sma200: 158.7,
          bollingerUpper: 189.3,
          bollingerLower: 174.6,
          volumeAvg: 48000000,
          atr: 3.2
        },
        // 添加基本面指标
        fundamentalIndicators: {
          eps: 6.19,
          revenue: 385000000000,
          profitMargin: 0.26,
          debtToEquity: 1.7,
          roe: 0.42,
          dividendYield: 0.0055
        }
      },
      {
        id: 'MSFT',
        name: 'Microsoft Corporation',
        industry: 'Technology',
        currentPrice: 372.35,
        previousClose: 370.18,
        change: 2.17,
        changePercent: 0.59,
        marketCap: 3020000000000,
        volume: 28000000,
        peRatio: 34.8,
        sector: 'Software',
        description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
        technicalIndicators: {
          rsi: 58.7,
          macd: 1.3,
          sma20: 368.2,
          sma50: 361.4,
          sma200: 328.9,
          bollingerUpper: 378.1,
          bollingerLower: 364.3,
          volumeAvg: 26000000,
          atr: 4.1
        },
        fundamentalIndicators: {
          eps: 10.69,
          revenue: 211000000000,
          profitMargin: 0.37,
          debtToEquity: 0.5,
          roe: 0.34,
          dividendYield: 0.0082
        }
      },
      {
        id: 'GOOGL',
        name: 'Alphabet Inc.',
        industry: 'Technology',
        currentPrice: 142.58,
        previousClose: 141.23,
        change: 1.35,
        changePercent: 0.96,
        marketCap: 1980000000000,
        volume: 18000000,
        peRatio: 28.7,
        sector: 'Internet',
        description: 'Alphabet Inc. provides various products and services globally. It operates through Google Services, Google Cloud, and Other Bets segments.',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
        technicalIndicators: {
          rsi: 62.4,
          macd: 0.9,
          sma20: 139.8,
          sma50: 136.2,
          sma200: 128.5,
          bollingerUpper: 146.3,
          bollingerLower: 138.1,
          volumeAvg: 16000000,
          atr: 2.8
        },
        fundamentalIndicators: {
          eps: 4.96,
          revenue: 207000000000,
          profitMargin: 0.21,
          debtToEquity: 0.1,
          roe: 0.18,
          dividendYield: 0
        }
      }
    ];
  }

  // 初始化模拟分析数据
  initMockAnalyses() {
    this.mockAnalyses = [
      {
        id: '1',
        stockId: 'AAPL',
        userId: '3',
        type: 'comprehensive',
        result: {
          overallScore: 85,
          recommendation: 'Buy',
          confidenceLevel: 0.85
        },
        factors: [
          { name: 'Technical Strength', value: 88 },
          { name: 'Fundamental Health', value: 90 },
          { name: 'Sentiment Score', value: 78 }
        ],
        analysisDate: new Date('2023-08-15T10:30:00Z'),
        createdAt: new Date('2023-08-15T10:30:00Z'),
        updatedAt: new Date('2023-08-15T10:30:00Z')
      },
      {
        id: '2',
        stockId: 'MSFT',
        userId: '3',
        type: 'technical',
        result: {
          overallScore: 78,
          recommendation: 'Hold',
          confidenceLevel: 0.75
        },
        factors: [
          { name: 'Trend Strength', value: 82 },
          { name: 'Momentum', value: 75 },
          { name: 'Volume Analysis', value: 76 }
        ],
        analysisDate: new Date('2023-08-14T14:20:00Z'),
        createdAt: new Date('2023-08-14T14:20:00Z'),
        updatedAt: new Date('2023-08-14T14:20:00Z')
      }
    ];
  }

  // 初始化模拟推荐数据
  initMockRecommendations() {
    this.mockRecommendations = [
      {
        id: '1',
        userId: '1',
        stocks: ['AAPL', 'MSFT', 'GOOGL'],
        reason: 'Strong fundamentals and growth potential in tech sector',
        riskLevel: 'Medium',
        recommendedDate: new Date('2023-08-16T09:00:00Z'),
        createdAt: new Date('2023-08-16T09:00:00Z'),
        updatedAt: new Date('2023-08-16T09:00:00Z')
      },
      {
        id: '2',
        userId: '2',
        stocks: ['AAPL'],
        reason: 'Technical indicators showing bullish trend',
        riskLevel: 'Low',
        recommendedDate: new Date('2023-08-15T16:30:00Z'),
        createdAt: new Date('2023-08-15T16:30:00Z'),
        updatedAt: new Date('2023-08-15T16:30:00Z')
      }
    ];
  }

  // 初始化模拟新闻数据
  initMockNews() {
    this.mockNews = [
      {
        id: '1',
        stockId: 'AAPL',
        title: 'Apple Announces New iPhone 15 Series',
        source: 'TechCrunch',
        url: 'https://techcrunch.com/apple-announces-new-iphone-15-series/',
        publishDate: new Date('2023-09-12T09:00:00Z'),
        sentiment: 'Positive',
        createdAt: new Date('2023-09-12T09:00:00Z'),
        updatedAt: new Date('2023-09-12T09:00:00Z')
      },
      {
        id: '2',
        stockId: 'MSFT',
        title: 'Microsoft Reports Strong Quarterly Earnings',
        source: 'CNBC',
        url: 'https://cnbc.com/microsoft-reports-strong-quarterly-earnings/',
        publishDate: new Date('2023-09-11T14:30:00Z'),
        sentiment: 'Positive',
        createdAt: new Date('2023-09-11T14:30:00Z'),
        updatedAt: new Date('2023-09-11T14:30:00Z')
      }
    ];
  }

  // 获取用户数据
  getUsers() {
    return [...this.mockUsers];
  }

  // 通过ID获取用户
  getUserById(id) {
    return this.mockUsers.find(user => user.id === id);
  }

  // 获取股票数据
  getStocks() {
    return [...this.mockStocks];
  }

  // 通过ID获取股票
  getStockById(id) {
    return this.mockStocks.find(stock => stock.id === id);
  }

  // 获取分析数据
  getAnalyses() {
    return [...this.mockAnalyses];
  }

  // 获取推荐数据
  getRecommendations() {
    return [...this.mockRecommendations];
  }

  // 获取新闻数据
  getNews() {
    return [...this.mockNews];
  }

  // 根据股票ID获取新闻
  getNewsByStockId(stockId) {
    return this.mockNews.filter(news => news.stockId === stockId);
  }

  // 验证用户密码（模拟实现）
  mockMatchPassword(username, password) {
    try {
      // 注意：这只是模拟环境的简化实现，生产环境应使用bcrypt等安全库
      const user = this.mockUsers.find(u => u.username === username);
      if (!user) {
        logger.warn(`用户 ${username} 不存在`);
        return false;
      }
      
      // 模拟密码验证（使用MD5哈希进行比较，实际生产环境应使用bcrypt等更安全的方式）
      const passwordHash = this._mockHashPassword(password);
      const match = passwordHash === user.passwordHash;
      
      if (match) {
        logger.info(`用户 ${username} 登录验证成功`);
      } else {
        logger.warn(`用户 ${username} 密码验证失败`);
      }
      
      return match;
    } catch (error) {
      logger.error('密码验证过程中出错:', error.message);
      return false;
    }
  }
  
  // 模拟哈希密码的辅助方法
  _mockHashPassword(password) {
    try {
      // 注意：这只是模拟环境的简化实现，生产环境应使用bcrypt等安全库
      const hash = crypto.createHash('md5').update(password).digest('hex');
      return hash;
    } catch (error) {
      logger.error('密码哈希过程中出错:', error.message);
      // 在哈希过程失败时返回一个随机哈希以确保安全
      return crypto.randomBytes(16).toString('hex');
    }
  }

  // 添加新的分析记录
  addMockAnalysis(analysis) {
    const newAnalysis = {
      id: `${Date.now()}`,
      ...analysis,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockAnalyses.push(newAnalysis);
    return newAnalysis;
  }

  // 清除所有模拟数据
  clearAllMockData() {
    try {
      logger.info('正在清除所有模拟数据...');
      this.mockUsers = [];
      this.mockStocks = [];
      this.mockAnalyses = [];
      this.mockRecommendations = [];
      this.mockNews = [];
      logger.info('模拟数据已清除');
      return true;
    } catch (error) {
      logger.error('清除模拟数据时出错:', error.message);
      return false;
    }
  }

  // 重新加载模拟数据
  reloadMockData() {
    try {
      logger.info('正在重新加载模拟数据...');
      this.clearAllMockData();
      this.initializeMockData();
      logger.info('模拟数据已重新加载');
      return true;
    } catch (error) {
      logger.error('重新加载模拟数据时出错:', error.message);
      return false;
    }
  }

  // 获取数据统计信息
  getDataStats() {
    return {
      users: this.mockUsers.length,
      stocks: this.mockStocks.length,
      analyses: this.mockAnalyses.length,
      recommendations: this.mockRecommendations.length,
      news: this.mockNews.length,
      lastUpdated: new Date().toISOString()
    };
  }
}

// 创建单例实例
const mockDataManager = new MockDataManager();

// 导出模拟数据管理实例
module.exports = mockDataManager;

// 导出MockDataManager类（用于测试或扩展）
module.exports.MockDataManager = MockDataManager;

// 导出模拟密码匹配函数供外部使用
module.exports.mockMatchPassword = mockDataManager.mockMatchPassword.bind(mockDataManager);