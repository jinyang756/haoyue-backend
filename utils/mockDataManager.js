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
        symbol: 'AAPL',
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
        exchange: 'NASDAQ',
        description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
        isActive: true,
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
        },
        // 添加历史数据
        historicalData: this.generateMockHistoricalData('AAPL', 30),
        // 添加新闻
        news: this.generateMockNews('AAPL', 5)
      },
      {
        id: 'MSFT',
        symbol: 'MSFT',
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
        exchange: 'NASDAQ',
        description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
        isActive: true,
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
        },
        historicalData: this.generateMockHistoricalData('MSFT', 30),
        news: this.generateMockNews('MSFT', 5)
      },
      {
        id: 'GOOGL',
        symbol: 'GOOGL',
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
        exchange: 'NASDAQ',
        description: 'Alphabet Inc. provides various products and services globally. It operates through Google Services, Google Cloud, and Other Bets segments.',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
        isActive: true,
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
        },
        historicalData: this.generateMockHistoricalData('GOOGL', 30),
        news: this.generateMockNews('GOOGL', 5)
      },
      {
        id: 'AMZN',
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        industry: 'E-commerce',
        currentPrice: 135.79,
        previousClose: 134.25,
        change: 1.54,
        changePercent: 1.15,
        marketCap: 1780000000000,
        volume: 35000000,
        peRatio: 45.2,
        sector: 'Internet Retail',
        exchange: 'NASDAQ',
        description: 'Amazon.com, Inc. engages in the provision of online retail shopping services.',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
        isActive: true,
        technicalIndicators: {
          rsi: 55.3,
          macd: 1.8,
          sma20: 132.4,
          sma50: 128.7,
          sma200: 122.3,
          bollingerUpper: 139.2,
          bollingerLower: 129.8,
          volumeAvg: 32000000,
          atr: 3.1
        },
        fundamentalIndicators: {
          eps: 3.00,
          revenue: 514000000000,
          profitMargin: 0.05,
          debtToEquity: 0.8,
          roe: 0.15,
          dividendYield: 0
        },
        historicalData: this.generateMockHistoricalData('AMZN', 30),
        news: this.generateMockNews('AMZN', 5)
      },
      {
        id: 'TSLA',
        symbol: 'TSLA',
        name: 'Tesla, Inc.',
        industry: 'Automotive',
        currentPrice: 248.32,
        previousClose: 245.18,
        change: 3.14,
        changePercent: 1.28,
        marketCap: 790000000000,
        volume: 85000000,
        peRatio: 62.8,
        sector: 'Auto Manufacturers',
        exchange: 'NASDAQ',
        description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems.',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date(),
        isActive: true,
        technicalIndicators: {
          rsi: 68.9,
          macd: 4.2,
          sma20: 242.1,
          sma50: 235.6,
          sma200: 218.4,
          bollingerUpper: 254.7,
          bollingerLower: 239.8,
          volumeAvg: 78000000,
          atr: 6.3
        },
        fundamentalIndicators: {
          eps: 3.95,
          revenue: 96800000000,
          profitMargin: 0.18,
          debtToEquity: 0.2,
          roe: 0.28,
          dividendYield: 0
        },
        historicalData: this.generateMockHistoricalData('TSLA', 30),
        news: this.generateMockNews('TSLA', 5)
      }
    ];
  }

  // 生成模拟历史数据
  generateMockHistoricalData(symbol, days) {
    const data = [];
    const basePrice = this.mockStocks.find(s => s.symbol === symbol)?.currentPrice || 100;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // 生成随机价格波动
      const volatility = 0.02; // 2%波动
      const changePercent = (Math.random() - 0.5) * 2 * volatility;
      const close = basePrice * (1 + changePercent * (days - i) / days);
      const open = close * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 50000000) + 10000000;
      
      data.push({
        date: date,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: volume
      });
    }
    
    return data;
  }

  // 生成模拟新闻
  generateMockNews(symbol, count) {
    const news = [];
    const companies = {
      'AAPL': 'Apple',
      'MSFT': 'Microsoft',
      'GOOGL': 'Google',
      'AMZN': 'Amazon',
      'TSLA': 'Tesla'
    };
    
    const topics = [
      '财报业绩超出预期',
      '新产品发布引发市场关注',
      '技术创新获得行业认可',
      '战略合作拓展市场份额',
      '管理层变动影响公司发展',
      '监管政策变化带来新机遇',
      '市场分析机构上调评级',
      '投资者关系活动增强信心'
    ];
    
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      news.push({
        title: `${companies[symbol] || symbol}${topics[Math.floor(Math.random() * topics.length)]}`,
        source: ['财经新闻', '华尔街日报', '彭博社', '路透社', '金融时报'][Math.floor(Math.random() * 5)],
        publishedAt: date,
        url: `https://example.com/news/${symbol.toLowerCase()}-${Date.now()}-${i}`,
        summary: `这是关于${companies[symbol] || symbol}的模拟新闻摘要。该新闻报道了公司最新的发展动态和市场表现。`,
        sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)]
      });
    }
    
    return news;
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
          { name: 'Price Trend', value: 82 },
          { name: 'Volume Analysis', value: 75 },
          { name: 'Support Resistance', value: 77 }
        ],
        analysisDate: new Date('2023-08-16T14:45:00Z'),
        createdAt: new Date('2023-08-16T14:45:00Z'),
        updatedAt: new Date('2023-08-16T14:45:00Z')
      }
    ];
  }

  // 初始化模拟推荐数据
  initMockRecommendations() {
    this.mockRecommendations = [
      {
        id: '1',
        userId: '1',
        type: 'portfolio',
        stocks: [
          { symbol: 'AAPL', weight: 30, reason: '技术创新领先' },
          { symbol: 'MSFT', weight: 40, reason: '云计算增长强劲' },
          { symbol: 'GOOGL', weight: 30, reason: '广告业务稳定' }
        ],
        createdAt: new Date('2023-08-01T09:00:00Z'),
        updatedAt: new Date('2023-08-01T09:00:00Z')
      }
    ];
  }

  // 初始化模拟新闻数据
  initMockNews() {
    this.mockNews = [
      {
        id: '1',
        title: '科技股财报季来临，市场关注AI发展',
        content: '随着科技公司财报季的到来，投资者密切关注人工智能技术的发展对公司业绩的影响。',
        source: '财经新闻',
        publishedAt: new Date('2023-08-10T08:00:00Z'),
        tags: ['科技股', '财报', 'AI']
      }
    ];
  }

  // 获取所有模拟股票
  getAllMockStocks() {
    return this.mockStocks;
  }

  // 根据股票代码获取模拟股票
  getMockStock(symbol) {
    const stock = this.mockStocks.find(s => s.symbol === symbol.toUpperCase());
    if (!stock) {
      // 如果找不到，创建一个新的模拟股票
      return this.createMockStock(symbol);
    }
    return stock;
  }

  // 创建新的模拟股票
  createMockStock(symbol) {
    const newStock = {
      id: symbol,
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Company`,
      industry: 'Technology',
      currentPrice: parseFloat((Math.random() * 200 + 50).toFixed(2)),
      previousClose: parseFloat((Math.random() * 200 + 50).toFixed(2)),
      change: parseFloat((Math.random() * 10 - 5).toFixed(2)),
      changePercent: parseFloat((Math.random() * 10 - 5).toFixed(2)),
      marketCap: Math.floor(Math.random() * 1000000000000) + 100000000000,
      volume: Math.floor(Math.random() * 50000000) + 1000000,
      peRatio: parseFloat((Math.random() * 50 + 10).toFixed(2)),
      sector: 'Technology',
      exchange: 'NASDAQ',
      description: `This is a mock stock for ${symbol.toUpperCase()}.`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      technicalIndicators: {
        rsi: parseFloat((Math.random() * 100).toFixed(2)),
        macd: parseFloat((Math.random() * 10 - 5).toFixed(2)),
        sma20: parseFloat((Math.random() * 200 + 50).toFixed(2)),
        sma50: parseFloat((Math.random() * 200 + 50).toFixed(2)),
        sma200: parseFloat((Math.random() * 200 + 50).toFixed(2))
      },
      fundamentalIndicators: {
        eps: parseFloat((Math.random() * 10).toFixed(2)),
        revenue: Math.floor(Math.random() * 100000000000) + 10000000000,
        profitMargin: parseFloat((Math.random() * 0.3).toFixed(2)),
        debtToEquity: parseFloat((Math.random() * 2).toFixed(2)),
        roe: parseFloat((Math.random() * 0.3).toFixed(2)),
        dividendYield: parseFloat((Math.random() * 0.05).toFixed(2))
      },
      historicalData: this.generateMockHistoricalData(symbol, 30),
      news: this.generateMockNews(symbol, 5)
    };
    
    this.mockStocks.push(newStock);
    return newStock;
  }

  // 搜索模拟股票
  searchMockStocks(query) {
    return this.mockStocks.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // 获取模拟历史数据
  getMockHistoricalData(symbol, interval) {
    const stock = this.mockStocks.find(s => s.symbol === symbol.toUpperCase());
    if (stock && stock.historicalData) {
      return stock.historicalData;
    }
    return this.generateMockHistoricalData(symbol, 30);
  }

  // 获取模拟新闻
  getMockNews(symbol) {
    const stock = this.mockStocks.find(s => s.symbol === symbol.toUpperCase());
    if (stock && stock.news) {
      return stock.news;
    }
    return this.generateMockNews(symbol, 5);
  }

  // 获取所有模拟用户
  getAllMockUsers() {
    return this.mockUsers;
  }

  // 根据ID获取模拟用户
  getMockUserById(id) {
    return this.mockUsers.find(user => user.id === id);
  }

  // 根据邮箱获取模拟用户
  getMockUserByEmail(email) {
    return this.mockUsers.find(user => user.email === email);
  }

  // 获取所有模拟分析
  getAllMockAnalyses() {
    return this.mockAnalyses;
  }

  // 根据ID获取模拟分析
  getMockAnalysisById(id) {
    return this.mockAnalyses.find(analysis => analysis.id === id);
  }

  // 获取所有模拟推荐
  getAllMockRecommendations() {
    return this.mockRecommendations;
  }

  // 根据ID获取模拟推荐
  getMockRecommendationById(id) {
    return this.mockRecommendations.find(recommendation => recommendation.id === id);
  }

  // 获取所有模拟新闻
  getAllMockNews() {
    return this.mockNews;
  }

  // 根据ID获取模拟新闻
  getMockNewsById(id) {
    return this.mockNews.find(news => news.id === id);
  }
}

// 导出单例实例
module.exports = {
  mockDataManager: new MockDataManager()
};