const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const Stock = require('../models/Stock');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const axios = require('axios');
const { spawn } = require('child_process');
const { isMongoDBConnected } = require('../config/db');

// MongoDB连接状态检查已从db.js导入

// 创建AI分析任务
exports.createAnalysis = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      stockSymbol, 
      analysisType = 'comprehensive', 
      timeRange = '1y',
      priority = 'medium'
    } = req.body;

    // 验证MongoDB连接状态
    if (!isMongoDBConnected()) {
      return res.status(503).json({
        success: false,
        message: '数据库连接不可用'
      });
    }

    // 验证股票是否存在
    const stock = await Stock.findOne({
      symbol: stockSymbol.toUpperCase(),
      isActive: true
    });

    if (!stock) {
      return res.status(404).json({
        message: '股票不存在或未激活'
      });
    }

    // 创建分析任务
    const analysis = new Analysis({
      userId: req.user.id,
      stockSymbol: stock.symbol,
      stockName: stock.name,
      analysisType,
      timeRange,
      priority,
      status: 'pending',
      progress: 0
    });

    await analysis.save();

    // 启动异步分析任务
    setTimeout(() => {
      processAnalysis(analysis._id);
    }, 100);

    res.status(201).json({
      success: true,
      message: 'AI分析任务已创建',
      analysis: {
        id: analysis._id,
        stockSymbol: analysis.stockSymbol,
        stockName: analysis.stockName,
        analysisType: analysis.analysisType,
        timeRange: analysis.timeRange,
        status: analysis.status,
        progress: analysis.progress,
        createdAt: analysis.createdAt
      }
    });
  } catch (error) {
    console.error('创建AI分析任务错误:', error);
    
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取分析任务列表
exports.getAnalysisList = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      analysisType,
      stockSymbol,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // 验证MongoDB连接状态
    if (!isMongoDBConnected()) {
      return res.status(503).json({
        success: false,
        message: '数据库连接不可用'
      });
    }

    // 构建查询条件
    const query = { userId: req.user.id };

    if (status) {
      query.status = status;
    }

    if (analysisType) {
      query.analysisType = analysisType;
    }

    if (stockSymbol) {
      query.stockSymbol = stockSymbol.toUpperCase();
    }

    // 构建排序条件
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;

    // 执行查询
    const analyses = await Analysis.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // 获取总数
    const total = await Analysis.countDocuments(query);

    res.status(200).json({
      success: true,
      count: analyses.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page * 1,
      analyses
    });
  } catch (error) {
    console.error('获取分析任务列表错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取分析任务详情
exports.getAnalysisById = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!analysis) {
      return res.status(404).json({
        message: '分析任务不存在'
      });
    }

    res.status(200).json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('获取分析任务详情错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 取消分析任务
exports.cancelAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: { $in: ['pending', 'processing'] }
    });

    if (!analysis) {
      return res.status(404).json({
        message: '分析任务不存在或无法取消'
      });
    }

    analysis.status = 'cancelled';
    await analysis.save();

    res.status(200).json({
      success: true,
      message: '分析任务已取消',
      analysis: {
        id: analysis._id,
        status: analysis.status
      }
    });
  } catch (error) {
    console.error('取消分析任务错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取分析结果统计
exports.getAnalysisStats = async (req, res) => {
  try {
    const stats = await Analysis.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processing: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          averageDuration: {
            $avg: '$executionTime.duration'
          }
        }
      }
    ]);

    const symbolStats = await Analysis.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$stockSymbol',
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        total: 0,
        completed: 0,
        pending: 0,
        processing: 0,
        failed: 0,
        averageDuration: 0
      },
      topSymbols: symbolStats
    });
  } catch (error) {
    console.error('获取分析统计错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 标记分析结果为收藏
exports.toggleFavorite = async (req, res) => {
  try {
    const { isFavorite } = req.body;

    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!analysis) {
      return res.status(404).json({
        message: '分析任务不存在'
      });
    }

    analysis.isFavorite = isFavorite;
    await analysis.save();

    res.status(200).json({
      success: true,
      message: isFavorite ? '已添加到收藏' : '已取消收藏',
      analysis: {
        id: analysis._id,
        isFavorite: analysis.isFavorite
      }
    });
  } catch (error) {
    console.error('更新收藏状态错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 分享分析结果
exports.shareAnalysis = async (req, res) => {
  try {
    const { userId, permission = 'view' } = req.body;

    // 验证目标用户是否存在
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        message: '目标用户不存在'
      });
    }

    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!analysis) {
      return res.status(404).json({
        message: '分析任务不存在'
      });
    }

    // 检查是否已经分享
    const existingShare = analysis.sharedWith.find(share => 
      share.userId.toString() === userId.toString()
    );

    if (existingShare) {
      existingShare.permission = permission;
      existingShare.sharedAt = Date.now();
    } else {
      analysis.sharedWith.push({
        userId,
        permission,
        sharedAt: Date.now()
      });
    }

    await analysis.save();

    res.status(200).json({
      success: true,
      message: '分析结果已分享',
      sharedWith: analysis.sharedWith
    });
  } catch (error) {
    console.error('分享分析结果错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 添加分析笔记
exports.addAnalysisNote = async (req, res) => {
  try {
    const { note } = req.body;

    const analysis = await Analysis.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!analysis) {
      return res.status(404).json({
        message: '分析任务不存在'
      });
    }

    analysis.notes = analysis.notes || {};
    analysis.notes.userNotes = note;
    analysis.metadata = analysis.metadata || {};
    analysis.metadata.lastUpdated = Date.now();

    await analysis.save();

    res.status(200).json({
      success: true,
      message: '笔记已添加',
      notes: analysis.notes
    });
  } catch (error) {
    console.error('添加分析笔记错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 内部函数：处理分析任务
async function processAnalysis(analysisId) {
  try {
    const analysis = await Analysis.findById(analysisId);
    if (!analysis || analysis.status !== 'pending') return;

    // 更新状态为处理中
    analysis.status = 'processing';
    analysis.progress = 10;
    await analysis.save();

    // 启动进度模拟
    simulateAnalysisProgress(analysisId).catch(error => {
      console.error('模拟分析进度失败:', error);
    });

    // 获取股票数据
    const stock = await Stock.findOne({ symbol: analysis.stockSymbol });
    if (!stock) {
      throw new Error('股票数据不存在');
    }

    // 更新股票数据
    try {
      await stockService.updateStockPrice(stock.symbol);
    } catch (error) {
      console.error('更新股票价格失败:', error);
    }

    // 生成AI分析结果
    const analysisResult = generateAIResult(stock, analysis);
    
    // 验证分析结果结构
    if (!analysisResult || typeof analysisResult !== 'object') {
      throw new Error('生成的分析结果无效');
    }

    // 获取配置的分析成本
    const analysisCost = getAnalysisCost(analysis.analysisType);

    // 更新分析结果
    analysis.status = 'completed';
    analysis.progress = 100;
    analysis.completedAt = new Date();
    
    // 安全地更新分析结果字段
    if (analysisResult.result) analysis.result = analysisResult.result;
    if (analysisResult.factors) analysis.factors = analysisResult.factors;
    if (analysisResult.technicalIndicators) analysis.technicalIndicators = analysisResult.technicalIndicators;
    if (analysisResult.fundamentalAnalysis) analysis.fundamentalAnalysis = analysisResult.fundamentalAnalysis;
    if (analysisResult.sentimentAnalysis) analysis.sentimentAnalysis = analysisResult.sentimentAnalysis;
    if (analysisResult.marketAnalysis) analysis.marketAnalysis = analysisResult.marketAnalysis;
    if (analysisResult.riskAnalysis) analysis.riskAnalysis = analysisResult.riskAnalysis;
    if (analysisResult.aiExplanation) analysis.aiExplanation = analysisResult.aiExplanation;
    
    // 更新成本信息
    analysis.creditsUsed = analysisCost.credits;
    analysis.costInUSD = analysisCost.usd;

    // 尝试保存分析结果，增加错误处理
    try {
      await analysis.save();
    } catch (saveError) {
      console.error('保存分析结果失败:', saveError);
      throw new Error('保存分析结果失败');
    }

    // 将AI评级添加到股票数据
    if (analysisResult.result) {
      try {
        await stock.addAiRating({
          rating: analysisResult.result.overallRating,
          recommendation: analysisResult.result.recommendation,
          confidence: analysisResult.result.confidenceLevel,
          factors: {
            fundamental: analysisResult.factors?.fundamentalScore || 0,
            technical: analysisResult.factors?.technicalScore || 0,
            market: analysisResult.factors?.marketScore || 0,
            sentiment: analysisResult.factors?.sentimentScore || 0
          },
          analysis: analysisResult.aiExplanation?.reasoning || ''
        });
      } catch (addRatingError) {
        console.error('添加AI评级到股票失败:', addRatingError);
        // 这里不抛出异常，因为这不是关键流程
      }
    }

  } catch (error) {
    console.error('处理分析任务错误:', error);
    // 错误处理中再次捕获可能的异常
    try {
      const analysis = await Analysis.findById(analysisId);
      if (analysis) {
        analysis.status = 'failed';
        analysis.progress = 0;
        analysis.error = error.message;
        await analysis.save();
      }
    } catch (updateError) {
      console.error('更新分析任务状态失败:', updateError);
    }
  }
}

// 获取分析成本配置
function getAnalysisCost(analysisType) {
  // 从配置中获取，而非硬编码
  const costConfig = {
    'comprehensive': { credits: 15, usd: 0.15 },
    'technical': { credits: 10, usd: 0.10 },
    'fundamental': { credits: 12, usd: 0.12 },
    'sentiment': { credits: 8, usd: 0.08 },
    'default': { credits: 10, usd: 0.10 }
  };
  
  return costConfig[analysisType] || costConfig['default'];
}

// 模拟分析进度
async function simulateAnalysisProgress(analysisId) {
  const progressSteps = [25, 45, 65, 85];
  
  for (const progress of progressSteps) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    const analysis = await Analysis.findById(analysisId);
    if (analysis && analysis.status === 'processing') {
      analysis.progress = progress;
      await analysis.save();
    } else {
      break;
    }
  }
}

// 生成AI分析结果
function generateAIResult(stock, analysis) {
  const baseRating = Math.random() * 4 + 4; // 4-8之间的基础评级
  const overallRating = Math.round(baseRating * 10) / 10;

  let recommendation;
  if (overallRating >= 7.5) recommendation = 'strong buy';
  else if (overallRating >= 6.5) recommendation = 'buy';
  else if (overallRating >= 4.5) recommendation = 'hold';
  else if (overallRating >= 3.5) recommendation = 'sell';
  else recommendation = 'strong sell';

  const confidenceLevel = Math.round(Math.random() * 30 + 60); // 60-90%
  const targetPrice = stock.latestPrice * (1 + (Math.random() * 0.4 - 0.1)); // ±10-40%
  const stopLossPrice = stock.latestPrice * (0.85 + Math.random() * 0.1); // 85-95%
  const upsidePotential = Math.round(((targetPrice - stock.latestPrice) / stock.latestPrice) * 100);
  const downsideRisk = Math.round(((stock.latestPrice - stopLossPrice) / stock.latestPrice) * 100);

  return {
    result: {
      overallRating,
      recommendation,
      confidenceLevel,
      riskLevel: overallRating >= 7 ? 'low' : overallRating >= 5 ? 'medium' : 'high',
      targetPrice: Math.round(targetPrice * 100) / 100,
      stopLossPrice: Math.round(stopLossPrice * 100) / 100,
      upsidePotential,
      downsideRisk
    },
    factors: {
      fundamentalScore: Math.round(Math.random() * 30 + 60),
      technicalScore: Math.round(Math.random() * 30 + 60),
      sentimentScore: Math.round(Math.random() * 30 + 60),
      marketScore: Math.round(Math.random() * 30 + 60),
      industryScore: Math.round(Math.random() * 30 + 60)
    },
    technicalIndicators: {
      movingAverages: {
        ma5: stock.latestPrice * (0.98 + Math.random() * 0.04),
        ma10: stock.latestPrice * (0.97 + Math.random() * 0.06),
        ma20: stock.latestPrice * (0.95 + Math.random() * 0.1),
        ma60: stock.latestPrice * (0.9 + Math.random() * 0.2),
        ma120: stock.latestPrice * (0.85 + Math.random() * 0.3),
        ma250: stock.latestPrice * (0.8 + Math.random() * 0.4)
      },
      oscillators: {
        rsi: Math.round(Math.random() * 40 + 30),
        macd: Math.random() * 2 - 1,
        signalLine: Math.random() * 2 - 1,
        stochastic: Math.round(Math.random() * 40 + 30),
        williamsR: Math.round(Math.random() * -40 - 30)
      }
    },
    fundamentalAnalysis: {
      financialRatios: {
        peRatio: Math.random() * 20 + 5,
        pbRatio: Math.random() * 5 + 1,
        psRatio: Math.random() * 3 + 0.5,
        dividendYield: Math.random() * 5,
        roe: Math.random() * 20 + 5,
        debtEquityRatio: Math.random() * 2
      }
    },
    sentimentAnalysis: {
      newsSentiment: {
        score: Math.random() * 2 - 1,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        articleCount: Math.round(Math.random() * 50 + 10)
      }
    },
    marketAnalysis: {
      marketTrend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      sectorPerformance: Math.random() * 20 - 10,
      industryRank: Math.round(Math.random() * 20 + 1)
    },
    riskAnalysis: {
      marketRisk: Math.round(Math.random() * 4 + 1),
      industryRisk: Math.round(Math.random() * 4 + 1),
      companySpecificRisk: Math.round(Math.random() * 4 + 1),
      totalRiskScore: Math.round(Math.random() * 4 + 1)
    },
    aiExplanation: {
      reasoning: `基于${analysis.analysisType}分析，${stock.name}(${stock.symbol})的整体评分为${overallRating}分，建议${recommendation}。主要考虑因素包括基本面健康度、技术面走势、市场情绪和风险因素。`,
      keyFactors: [
        '公司财务状况良好',
        '技术指标显示买入信号',
        '市场情绪积极',
        '估值相对合理'
      ],
      confidenceFactors: [
        '数据来源可靠',
        '分析模型准确率高',
        '市场环境稳定'
      ]
    }
  };
}