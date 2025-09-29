const Stock = require('../models/Stock');
const axios = require('axios');
const { validationResult } = require('express-validator');

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
    console.error('获取股票列表错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取单个股票详情
exports.getStockById = async (req, res) => {
  try {
    const stock = await Stock.findOne({
      $or: [
        { _id: req.params.id },
        { symbol: req.params.id.toUpperCase() }
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
    console.error('获取股票详情错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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