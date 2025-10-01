// 全局模拟数据管理模块
// 用于在MongoDB未连接时提供模拟数据

// 模拟用户数据
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@haoyue.com',
    password: '$2a$10$Qe1l55O1W.7d9qH5W7QeYeY1Qe1l55O1W.7d9qH5W7QeYeY1Qe', // 模拟加密的密码 'admin123'
    name: '管理员',
    role: 'admin',
    status: 'active',
    emailVerified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastLogin: new Date()
  },
  {
    id: '2',
    username: 'user1',
    email: 'user1@haoyue.com',
    password: '$2a$10$Qe1l55O1W.7d9qH5W7QeYeY1Qe1l55O1W.7d9qH5W7QeYeY1Qe', // 模拟加密的密码 'user123'
    name: '普通用户',
    role: 'user',
    status: 'active',
    emailVerified: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastLogin: new Date()
  },
  {
    id: '3',
    username: 'vip1',
    email: 'vip1@haoyue.com',
    password: '$2a$10$Qe1l55O1W.7d9qH5W7QeYeY1Qe1l55O1W.7d9qH5W7QeYeY1Qe', // 模拟加密的密码 'vip123'
    name: 'VIP用户',
    role: 'vip',
    status: 'active',
    emailVerified: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    lastLogin: new Date()
  }
];

// 模拟股票数据
const mockStocks = [
  {
    id: '1',
    symbol: 'AAPL',
    name: '苹果公司',
    price: 187.23,
    change: 1.23,
    changePercent: 0.66,
    marketCap: 3.02,
    sector: '科技',
    industry: '电子设备',
    description: '苹果公司设计、制造和销售智能手机、个人电脑、平板电脑、可穿戴设备和配件，并提供各种相关服务。',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '2',
    symbol: 'MSFT',
    name: '微软公司',
    price: 410.56,
    change: -2.34,
    changePercent: -0.57,
    marketCap: 3.25,
    sector: '科技',
    industry: '软件服务',
    description: '微软公司开发、授权和支持软件、服务、设备和解决方案。',
    isActive: true,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '3',
    symbol: 'TSLA',
    name: '特斯拉',
    price: 232.87,
    change: 5.67,
    changePercent: 2.5,
    marketCap: 0.75,
    sector: '汽车',
    industry: '汽车制造',
    description: '特斯拉设计、开发、制造和销售全电动汽车和能源存储系统，并提供相关服务。',
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '4',
    symbol: 'AMZN',
    name: '亚马逊',
    price: 198.45,
    change: 0.89,
    changePercent: 0.45,
    marketCap: 1.98,
    sector: '零售',
    industry: '电子商务',
    description: '亚马逊是一家全球性的电子商务、云计算、数字流媒体和人工智能公司。',
    isActive: true,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    id: '5',
    symbol: 'GOOGL',
    name: '谷歌',
    price: 134.78,
    change: -1.23,
    changePercent: -0.91,
    marketCap: 1.92,
    sector: '科技',
    industry: '互联网服务',
    description: '谷歌是一家全球性的科技公司，专注于互联网相关服务和产品。',
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

// 模拟分析数据
const mockAnalyses = [
  {
    id: '1',
    stockSymbol: 'AAPL',
    stockName: '苹果公司',
    analysisType: 'comprehensive',
    timeRange: '1y',
    status: 'completed',
    progress: 100,
    userId: '1',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    completedAt: new Date(),
    results: {
      overallScore: 85,
      recommendation: '买入',
      technicalScore: 82,
      fundamentalScore: 88,
      riskLevel: '中等',
      priceTarget: 205.00
    }
  },
  {
    id: '2',
    stockSymbol: 'MSFT',
    stockName: '微软公司',
    analysisType: 'technical',
    timeRange: '6m',
    status: 'in-progress',
    progress: 65,
    userId: '1',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
  },
  {
    id: '3',
    stockSymbol: 'TSLA',
    stockName: '特斯拉',
    analysisType: 'fundamental',
    timeRange: '1y',
    status: 'completed',
    progress: 100,
    userId: '2',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    results: {
      overallScore: 72,
      recommendation: '持有',
      technicalScore: 78,
      fundamentalScore: 68,
      riskLevel: '高',
      priceTarget: 250.00
    }
  }
];

// 模拟推荐数据
const mockRecommendations = [
  {
    id: '1',
    userId: '1',
    title: '科技股投资组合推荐',
    description: '根据您的风险偏好和投资目标，推荐的科技股投资组合',
    status: 'active',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    stocks: [
      {
        symbol: 'AAPL',
        name: '苹果公司',
        recommendation: '买入',
        rating: 8.5,
        targetPrice: 205.00
      },
      {
        symbol: 'MSFT',
        name: '微软公司',
        recommendation: '买入',
        rating: 8.7,
        targetPrice: 450.00
      },
      {
        symbol: 'GOOGL',
        name: '谷歌',
        recommendation: '买入',
        rating: 8.0,
        targetPrice: 150.00
      }
    ]
  },
  {
    id: '2',
    userId: '2',
    title: '热门成长股推荐',
    description: '当前市场上表现强劲的成长股推荐',
    status: 'active',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
    stocks: [
      {
        symbol: 'TSLA',
        name: '特斯拉',
        recommendation: '持有',
        rating: 7.2,
        targetPrice: 250.00
      },
      {
        symbol: 'AMZN',
        name: '亚马逊',
        recommendation: '买入',
        rating: 7.8,
        targetPrice: 220.00
      }
    ]
  }
];

// 模拟新闻数据
const mockNews = [
  {
    id: '1',
    title: '苹果公司发布最新季度财报，营收超预期',
    content: '苹果公司今日发布最新季度财报，显示营收和利润均超出市场预期。公司CEO表示，iPhone和服务业务表现强劲...',
    source: '财经新闻',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    stockSymbols: ['AAPL']
  },
  {
    id: '2',
    title: '微软宣布重大AI战略升级，股价应声上涨',
    content: '微软今日宣布了一系列AI战略升级，包括新一代AI模型和云服务整合。分析师认为这将进一步巩固微软在企业AI市场的领先地位...',
    source: '科技日报',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    stockSymbols: ['MSFT']
  },
  {
    id: '3',
    title: '特斯拉第四季度汽车交付量创新高',
    content: '特斯拉公布第四季度汽车交付量，创历史新高。尽管面临供应链挑战，公司仍实现了强劲的交付增长...',
    source: '汽车新闻',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    stockSymbols: ['TSLA']
  }
];

// 生成模拟token
const generateMockToken = (userId, role) => {
  // 这只是一个简单的模拟token，实际应用中应该使用JWT等安全的认证方式
  return `mock-token-${userId}-${role}-${Date.now()}`;
};

// 模拟密码验证
const mockMatchPassword = (password) => {
  // 所有模拟用户的密码都是固定的
  const validPasswords = ['admin123', 'user123', 'vip123'];
  return validPasswords.includes(password);
};

// 导出模拟数据和工具函数
module.exports = {
  mockUsers,
  mockStocks,
  mockAnalyses,
  mockRecommendations,
  mockNews,
  generateMockToken,
  mockMatchPassword,
  // 添加新用户到模拟数据
  addMockUser: (userData) => {
    const newUser = {
      id: Math.random().toString(36).substring(2, 15),
      ...userData,
      status: 'active',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    };
    mockUsers.push(newUser);
    return newUser;
  },
  // 更新模拟分析状态
  updateMockAnalysisStatus: (analysisId, status, progress, results) => {
    const analysis = mockAnalyses.find(a => a.id === analysisId);
    if (analysis) {
      analysis.status = status;
      if (progress !== undefined) analysis.progress = progress;
      if (results) analysis.results = results;
      if (status === 'completed') {
        analysis.completedAt = new Date();
      }
    }
    return analysis;
  }
};