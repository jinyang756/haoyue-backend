const mongoose = require('mongoose');
const Stock = require('../models/Stock');
const axios = require('axios');
const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');
const { isMongoDBConnected } = require('../config/db');

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