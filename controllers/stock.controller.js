const mongoose = require('mongoose');
const Stock = require('../models/Stock');
const axios = require('axios');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { isMongoDBConnected } = require('../config/db');

// 模拟股票数据（A股）
const mockStocks = [
  { 
    id: '1',
    symbol: '000001.SZ', 
    name: '平安银行', 
    market: 'SZSE',
    price: 118.82, 
    change: -5.03, 
    changePercent: -4.23,
    volume: 57392888,
    marketCap: 3020000000000,
    pe: 29.56,
    pb: 3.21,
    eps: 6.33,
    dividend: 0.96,
    sector: '金融',
    industry: '银行',
    description: '平安银行(000001.SZ) 是一只在深圳证券交易所上市的A股股票。',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  { 
    id: '2',
    symbol: '000002.SZ', 
    name: '万科A', 
    market: 'SZSE',
    price: 127.07, 
    change: 6.06, 
    changePercent: 4.77,
    volume: 25678912,
    marketCap: 3250000000000,
    pe: 35.21,
    pb: 12.45,
    eps: 11.65,
    dividend: 2.72,
    sector: '房地产',
    industry: '房地产开发',
    description: '万科A(000002.SZ) 是一只在深圳证券交易所上市的A股股票。',
    isActive: true,
    createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  { 
    id: '3',
    symbol: '000333.SZ', 
    name: '美的集团', 
    market: 'SZSE',
    price: 844.13, 
    change: -32.58, 
    changePercent: -3.86,
    volume: 89234567,
    marketCap: 750000000000,
    pe: 62.34,
    pb: 8.76,
    eps: 3.73,
    dividend: 0,
    sector: '家用电器',
    industry: '白色家电',
    description: '美的集团(000333.SZ) 是一只在深圳证券交易所上市的A股股票。',
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  { 
    id: '4',
    symbol: '000651.SZ', 
    name: '格力电器', 
    market: 'SZSE',
    price: 499.04, 
    change: 18.54, 
    changePercent: 3.71,
    volume: 45678901,
    marketCap: 1980000000000,
    pe: 48.76,
    pb: 7.89,
    eps: 4.06,
    dividend: 0,
    sector: '家用电器',
    industry: '白色家电',
    description: '格力电器(000651.SZ) 是一只在深圳证券交易所上市的A股股票。',
    isActive: true,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  { 
    id: '5',
    symbol: '000858.SZ', 
    name: '五粮液', 
    market: 'SZSE',
    price: 96.43, 
    change: -3.51, 
    changePercent: -3.63,
    volume: 23456789,
    marketCap: 1920000000000,
    pe: 26.45,
    pb: 4.32,
    eps: 5.09,
    dividend: 0,
    sector: '食品饮料',
    industry: '白酒',
    description: '五粮液(000858.SZ) 是一只在深圳证券交易所上市的A股股票。',
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  { 
    id: '6',
    symbol: '600036.SH', 
    name: '招商银行', 
    market: 'SHSE',
    price: 68.25, 
    change: 0.96, 
    changePercent: 1.41,
    volume: 34567890,
    marketCap: 1560000000000,
    pe: 32.18,
    pb: 5.67,
    eps: 4.12,
    dividend: 1.25,
    sector: '金融',
    industry: '银行',
    description: '招商银行(600036.SH) 是一只在上海证券交易所上市的A股股票。',
    isActive: true,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  { 
    id: '7',
    symbol: '600519.SH', 
    name: '贵州茅台', 
    market: 'SHSE',
    price: 509.10, 
    change: 1.28, 
    changePercent: 0.25,
    volume: 12345678,
    marketCap: 2340000000000,
    pe: 45.67,
    pb: 8.91,
    eps: 11.18,
    dividend: 3.45,
    sector: '食品饮料',
    industry: '白酒',
    description: '贵州茅台(600519.SH) 是一只在上海证券交易所上市的A股股票。',
    isActive: true,
    createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  { 
    id: '8',
    symbol: '601318.SH', 
    name: '中国平安', 
    market: 'SHSE',
    price: 861.41, 
    change: 14.15, 
    changePercent: 1.64,
    volume: 45678901,
    marketCap: 1890000000000,
    pe: 38.76,
    pb: 6.45,
    eps: 8.92,
    dividend: 2.18,
    sector: '金融',
    industry: '保险',
    description: '中国平安(601318.SH) 是一只在上海证券交易所上市的A股股票。',
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

// MongoDB连接状态检查已从db.js导入

// 获取所有股票列表
exports.getAllStocks = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      sector, 
      industry, 
      exchange, 
      sort = 'symbol', 
      order = 'asc' 
    } = req.query;

    // 如果MongoDB未连接，返回模拟数据
    if (!isMongoDBConnected()) {
      let filteredMockStocks = [...mockStocks];
      
      // 应用过滤条件
      if (search) {
        const searchLower = search.toLowerCase();
        filteredMockStocks = filteredMockStocks.filter(stock => 
          stock.symbol.toLowerCase().includes(searchLower) || 
          stock.name.toLowerCase().includes(searchLower)
        );
      }
      
      if (sector) {
        filteredMockStocks = filteredMockStocks.filter(stock => stock.sector.includes(sector));
      }
      
      if (industry) {
        filteredMockStocks = filteredMockStocks.filter(stock => stock.industry.includes(industry));
      }
      
      // 应用排序
      if (sort === 'symbol') {
        filteredMockStocks.sort((a, b) => a.symbol.localeCompare(b.symbol) * (order === 'asc' ? 1 : -1));
      } else if (sort === 'name') {
        filteredMockStocks.sort((a, b) => a.name.localeCompare(b.name) * (order === 'asc' ? 1 : -1));
      } else if (sort === 'price') {
        filteredMockStocks.sort((a, b) => (a.price - b.price) * (order === 'asc' ? 1 : -1));
      }
      
      // 应用分页
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const paginatedMockStocks = filteredMockStocks.slice(startIndex, startIndex + parseInt(limit));
      
      return res.status(200).json({
        success: true,
        message: '股票列表获取成功(模拟数据)',
        count: paginatedMockStocks.length,
        total: filteredMockStocks.length,
        totalPages: Math.ceil(filteredMockStocks.length / limit),
        currentPage: page * 1,
        stocks: paginatedMockStocks,
        mongodbStatus: 'not connected'
      });
    }

    // 原始逻辑 - MongoDB连接时执行
    // 构建查询条件
    const query = {};
    
    if (search) {
      query.$or = [
        { symbol: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (sector) {
      query.sector = { $regex: sector, $options: 'i' };
    }
    
    if (industry) {
      query.industry = { $regex: industry, $options: 'i' };
    }
    
    if (exchange) {
      query.exchange = exchange;
    }
    
    query.isActive = true;

    // 构建排序条件
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    // 执行查询
    const stocks = await Stock.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // 获取总数
    const total = await Stock.countDocuments(query);

    res.status(200).json({
      success: true,
      count: stocks.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page * 1,
      stocks
    });
  } catch (error) {
    logger.error('获取股票列表错误:', error);
    
    // 如果是数据库错误，返回模拟数据
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        sector, 
        industry, 
        sort = 'symbol', 
        order = 'asc' 
      } = req.query;
      
      let filteredMockStocks = [...mockStocks];
      
      // 应用过滤条件
      if (search) {
        const searchLower = search.toLowerCase();
        filteredMockStocks = filteredMockStocks.filter(stock => 
          stock.symbol.toLowerCase().includes(searchLower) || 
          stock.name.toLowerCase().includes(searchLower)
        );
      }
      
      if (sector) {
        filteredMockStocks = filteredMockStocks.filter(stock => stock.sector.includes(sector));
      }
      
      if (industry) {
        filteredMockStocks = filteredMockStocks.filter(stock => stock.industry.includes(industry));
      }
      
      // 应用排序
      if (sort === 'symbol') {
        filteredMockStocks.sort((a, b) => a.symbol.localeCompare(b.symbol) * (order === 'asc' ? 1 : -1));
      } else if (sort === 'name') {
        filteredMockStocks.sort((a, b) => a.name.localeCompare(b.name) * (order === 'asc' ? 1 : -1));
      } else if (sort === 'price') {
        filteredMockStocks.sort((a, b) => (a.price - b.price) * (order === 'asc' ? 1 : -1));
      }
      
      // 应用分页
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const paginatedMockStocks = filteredMockStocks.slice(startIndex, startIndex + parseInt(limit));
      
      return res.status(200).json({
        success: true,
        message: '股票列表获取成功(模拟数据)',
        count: paginatedMockStocks.length,
        total: filteredMockStocks.length,
        totalPages: Math.ceil(filteredMockStocks.length / limit),
        currentPage: page * 1,
        stocks: paginatedMockStocks,
        mongodbStatus: 'error'
      });
    }

    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取单个股票详情
exports.getStockById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 如果MongoDB未连接，返回模拟数据
    if (!isMongoDBConnected()) {
      const mockStock = mockStocks.find(s => s.symbol === id.toUpperCase() || s.id === id);
      
      if (!mockStock) {
        return res.status(404).json({
          message: '股票不存在'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '股票详情获取成功(模拟数据)',
        stock: mockStock,
        mongodbStatus: 'not connected'
      });
    }

    // 原始逻辑 - MongoDB连接时执行
    const stock = await Stock.findOne({
      $or: [
        { _id: id },
        { symbol: id.toUpperCase() }
      ],
      isActive: true
    });

    if (!stock) {
      return res.status(404).json({
        message: '股票不存在'
      });
    }

    res.status(200).json({
      success: true,
      stock
    });
  } catch (error) {
    logger.error('获取股票详情错误:', error);
    
    // 如果是数据库错误，返回模拟数据
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      const { id } = req.params;
      const mockStock = mockStocks.find(s => s.symbol === id.toUpperCase() || s.id === id);
      
      if (!mockStock) {
        return res.status(404).json({
          message: '股票不存在'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: '股票详情获取成功(模拟数据)',
        stock: mockStock,
        mongodbStatus: 'error'
      });
    }

    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取股票列表（兼容旧接口）
exports.getStockList = async (req, res) => {
  // 重定向到getAllStocks方法
  return exports.getAllStocks(req, res);
};

// 获取股票详情（兼容旧接口）
exports.getStockDetail = async (req, res) => {
  // 重定向到getStockById方法
  return exports.getStockById(req, res);
};

// 获取股票历史数据
exports.getStockHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { 
      startDate, 
      endDate, 
      interval = 'daily',
      limit = 30 
    } = req.query;

    const stock = await Stock.findOne({
      symbol: symbol.toUpperCase(),
      isActive: true
    });

    if (!stock) {
      return res.status(404).json({
        message: '股票不存在'
      });
    }

    // 过滤历史数据
    let historicalData = [...stock.historicalData];
    
    // 按日期排序
    historicalData.sort((a, b) => a.date - b.date);

    // 应用日期范围过滤
    if (startDate) {
      const start = new Date(startDate);
      historicalData = historicalData.filter(item => new Date(item.date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      historicalData = historicalData.filter(item => new Date(item.date) <= end);
    }

    // 应用间隔过滤
    if (interval !== 'daily') {
      // 这里可以实现不同时间间隔的数据聚合
      // 简化处理，返回所有数据
    }

    // 限制返回数量
    if (limit && historicalData.length > limit) {
      historicalData = historicalData.slice(-limit);
    }

    res.status(200).json({
      success: true,
      symbol: stock.symbol,
      name: stock.name,
      interval,
      count: historicalData.length,
      historicalData
    });
  } catch (error) {
    console.error('获取股票历史数据错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取股票技术指标
exports.getStockTechnicalIndicators = async (req, res) => {
  try {
    const { symbol } = req.params;

    const stock = await Stock.findOne({
      symbol: symbol.toUpperCase(),
      isActive: true
    });

    if (!stock) {
      return res.status(404).json({
        message: '股票不存在'
      });
    }

    res.status(200).json({
      success: true,
      symbol: stock.symbol,
      name: stock.name,
      technicalIndicators: stock.technicalIndicators,
      latestPrice: stock.latestPrice,
      change: stock.change,
      changePercent: stock.changePercent,
      latestUpdate: stock.latestUpdate
    });
  } catch (error) {
    console.error('获取股票技术指标错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取股票AI评级
exports.getStockAiRatings = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;

    const stock = await Stock.findOne({
      symbol: symbol.toUpperCase(),
      isActive: true
    });

    if (!stock) {
      return res.status(404).json({
        message: '股票不存在'
      });
    }

    // 获取最新的AI评级
    let aiRatings = [...stock.aiRatings];
    aiRatings.sort((a, b) => b.date - a.date);
    
    if (limit && aiRatings.length > limit) {
      aiRatings = aiRatings.slice(0, limit);
    }

    res.status(200).json({
      success: true,
      symbol: stock.symbol,
      name: stock.name,
      count: aiRatings.length,
      latestRating: aiRatings.length > 0 ? aiRatings[0] : null,
      aiRatings
    });
  } catch (error) {
    console.error('获取股票AI评级错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取股票新闻
exports.getStockNews = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20 } = req.query;

    const stock = await Stock.findOne({
      symbol: symbol.toUpperCase(),
      isActive: true
    });

    if (!stock) {
      return res.status(404).json({
        message: '股票不存在'
      });
    }

    // 获取最新新闻
    let news = [...stock.news];
    news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    
    if (limit && news.length > limit) {
      news = news.slice(0, limit);
    }

    res.status(200).json({
      success: true,
      symbol: stock.symbol,
      name: stock.name,
      count: news.length,
      news
    });
  } catch (error) {
    console.error('获取股票新闻错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 搜索股票
exports.searchStocks = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        message: '请提供搜索关键词'
      });
    }

    const stocks = await Stock.find({
      $or: [
        { symbol: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    })
    .limit(limit * 1)
    .sort({ symbol: 1 });

    res.status(200).json({
      success: true,
      count: stocks.length,
      stocks: stocks.map(stock => ({
        id: stock._id,
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        sector: stock.sector,
        industry: stock.industry,
        latestPrice: stock.latestPrice,
        change: stock.change,
        changePercent: stock.changePercent
      }))
    });
  } catch (error) {
    console.error('搜索股票错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取行业列表
exports.getSectors = async (req, res) => {
  try {
    const sectors = await Stock.distinct('sector', { isActive: true });
    
    res.status(200).json({
      success: true,
      count: sectors.length,
      sectors: sectors.filter(Boolean).sort()
    });
  } catch (error) {
    console.error('获取行业列表错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取产业列表
exports.getIndustries = async (req, res) => {
  try {
    const { sector } = req.query;
    const query = { isActive: true };
    
    if (sector) {
      query.sector = { $regex: sector, $options: 'i' };
    }

    const industries = await Stock.distinct('industry', query);
    
    res.status(200).json({
      success: true,
      count: industries.length,
      industries: industries.filter(Boolean).sort()
    });
  } catch (error) {
    console.error('获取产业列表错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 更新股票数据（管理员）
exports.updateStockData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const updates = req.body;

    const stock = await Stock.findOneAndUpdate(
      { symbol: symbol.toUpperCase() },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!stock) {
      return res.status(404).json({
        message: '股票不存在'
      });
    }

    res.status(200).json({
      success: true,
      message: '股票数据更新成功',
      stock
    });
  } catch (error) {
    console.error('更新股票数据错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 添加新股票（管理员）
exports.addNewStock = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { symbol } = req.body;

    // 检查股票是否已存在
    let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });

    if (stock) {
      return res.status(400).json({
        message: '股票已存在'
      });
    }

    stock = new Stock({
      ...req.body,
      symbol: symbol.toUpperCase(),
      isActive: true
    });

    await stock.save();

    res.status(201).json({
      success: true,
      message: '股票添加成功',
      stock
    });
  } catch (error) {
    console.error('添加新股票错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 删除股票（管理员）
exports.deleteStock = async (req, res) => {
  try {
    const { symbol } = req.params;

    const stock = await Stock.findOneAndDelete({
      symbol: symbol.toUpperCase()
    });

    if (!stock) {
      return res.status(404).json({
        message: '股票不存在'
      });
    }

    res.status(200).json({
      success: true,
      message: '股票删除成功'
    });
  } catch (error) {
    console.error('删除股票错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};