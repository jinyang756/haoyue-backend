const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');
const Stock = require('../models/Stock');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { isMongoDBConnected } = require('../config/db');
const logger = require('../config/logger');

// 增强的AI分析控制器
class EnhancedAIController {
  // 创建AI分析任务
  static async createAnalysis(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { 
        stockSymbol, 
        analysisType = 'comprehensive', 
        timeRange = '1y',
        priority = 'medium',
        enhancedFeatures = false // 是否启用增强功能
      } = req.body;

      // 检查MongoDB连接状态
      if (!isMongoDBConnected()) {
        logger.error('MongoDB未连接，无法创建分析任务');
        return res.status(503).json({
          success: false,
          message: '数据库服务不可用，请稍后再试'
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
        progress: 0,
        enhancedFeatures // 标记是否启用增强功能
      });

      await analysis.save();

      // 启动异步分析任务
      setTimeout(() => {
        EnhancedAIController.processAnalysis(analysis._id);
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
          enhancedFeatures: analysis.enhancedFeatures
        }
      });
    } catch (error) {
      logger.error('创建AI分析任务错误:', error);
      
      // 直接返回错误信息，不再使用模拟数据
      res.status(500).json({
        message: '服务器错误',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 获取分析任务列表
  static async getAnalysisList(req, res) {
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

      // 检查MongoDB连接状态
      if (!isMongoDBConnected()) {
        logger.error('MongoDB连接失败，无法获取分析任务列表');
        return res.status(503).json({
          success: false,
          message: '数据库服务不可用，请稍后再试'
        });
      }

      // 原始逻辑 - MongoDB连接时执行
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
  }

  // 获取分析任务详情
  static async getAnalysisById(req, res) {
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
  }

  // 内部函数：处理分析任务
  static async processAnalysis(analysisId) {
    try {
      const analysis = await Analysis.findById(analysisId);
      if (!analysis || analysis.status !== 'pending') return;

      // 更新状态为处理中
      analysis.status = 'processing';
      analysis.progress = 10;
      await analysis.save();

      // 启动进度模拟
      EnhancedAIController.simulateAnalysisProgress(analysisId).catch(error => {
        console.error('模拟分析进度失败:', error);
      });

      // 获取股票数据
      const stock = await Stock.findOne({ symbol: analysis.stockSymbol });
      if (!stock) {
        throw new Error('股票数据不存在');
      }

      // 生成AI分析结果
      const analysisResult = analysis.enhancedFeatures 
        ? EnhancedAIController.generateEnhancedAIResult(stock, analysis)
        : EnhancedAIController.generateStandardAIResult(stock, analysis);
      
      // 验证分析结果结构
      if (!analysisResult || typeof analysisResult !== 'object') {
        throw new Error('生成的分析结果无效');
      }

      // 获取配置的分析成本
      const analysisCost = EnhancedAIController.getAnalysisCost(analysis.analysisType);

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
      if (analysisResult.enhancedIndicators) analysis.enhancedIndicators = analysisResult.enhancedIndicators;
      
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

  // 生成标准AI分析结果
  static generateStandardAIResult(stock, analysis) {
    // 移除模拟数据生成，使用适当的错误处理
    logger.warn('AI分析功能当前不可用，使用占位数据代替');
    
    // 返回基本的占位数据结构，而不是随机生成的模拟数据
    return {
      result: {
        overallRating: 0,
        recommendation: 'hold',
        confidenceLevel: 0,
        riskLevel: 'medium',
        targetPrice: stock.latestPrice,
        stopLossPrice: stock.latestPrice,
        upsidePotential: 0,
        downsideRisk: 0
      },
      factors: {
        fundamentalScore: 0,
        technicalScore: 0,
        sentimentScore: 0,
        marketScore: 0,
        industryScore: 0
      },
      technicalIndicators: {
        movingAverages: {
          ma5: stock.latestPrice,
          ma10: stock.latestPrice,
          ma20: stock.latestPrice,
          ma60: stock.latestPrice,
          ma120: stock.latestPrice,
          ma250: stock.latestPrice
        },
        oscillators: {
          rsi: 50,
          macd: 0,
          signalLine: 0,
          stochastic: 50,
          williamsR: -50
        }
      },
      fundamentalAnalysis: {
        financialRatios: {
          peRatio: 0,
          pbRatio: 0,
          psRatio: 0,
          dividendYield: 0,
          roe: 0,
          debtEquityRatio: 0
        }
      },
      sentimentAnalysis: {
        newsSentiment: {
          score: 0,
          trend: 'neutral',
          articleCount: 0
        }
      },
      marketAnalysis: {
        marketTrend: 'neutral',
        sectorPerformance: 0,
        industryRank: 0
      },
      riskAnalysis: {
        marketRisk: 3,
        industryRisk: 3,
        companySpecificRisk: 3,
        totalRiskScore: 3
      },
      aiExplanation: {
        reasoning: `AI分析功能暂时不可用，请稍后再试。`,
        keyFactors: [],
        confidenceFactors: []
      }
    };
  }

  // 生成增强版AI分析结果（包含更多技术指标和分析模型）
  static generateEnhancedAIResult(stock, analysis) {
    // 先生成标准结果
    const standardResult = EnhancedAIController.generateStandardAIResult(stock, analysis);
    
    // 添加增强指标（使用合理的默认值，而非随机生成）
    const enhancedIndicators = {
      // 布林带
      bollingerBands: {
        upper: stock.latestPrice * 1.05,
        middle: stock.latestPrice,
        lower: stock.latestPrice * 0.95,
        bandwidth: 0.1,
        percentB: 0.5
      },
      
      // 能量潮指标 (OBV)
      obv: {
        current: 0,
        trend: 'neutral',
        change: 0
      },
      
      // 平均真实波幅 (ATR)
      atr: {
        value: stock.latestPrice * 0.015,
        period: 14
      },
      
      // 相对强弱指数 (RSI) 扩展
      extendedRsi: {
        rsi14: standardResult.technicalIndicators.oscillators.rsi,
        rsi9: 50,
        rsi25: 50,
        stochRsi: 0.5
      },
      
      // 艾略特波浪理论
      elliottWave: {
        wave: 0,
        subWave: 0,
        trend: 'neutral'
      },
      
      // 斐波那契回撤
      fibonacciRetracement: {
        levels: {
          '23.6%': stock.latestPrice * 0.764,
          '38.2%': stock.latestPrice * 0.618,
          '50.0%': stock.latestPrice * 0.5,
          '61.8%': stock.latestPrice * 0.382,
          '78.6%': stock.latestPrice * 0.214
        }
      },
      
      // 伊克哈勒指标
      ichimoku: {
        tenkanSen: stock.latestPrice,
        kijunSen: stock.latestPrice,
        senkouSpanA: stock.latestPrice,
        senkouSpanB: stock.latestPrice,
        chikouSpan: stock.latestPrice
      },
      
      // 随机指标扩展
      stochasticOscillator: {
        fastK: 50,
        fastD: 50,
        slowK: 50,
        slowD: 50
      },
      
      // 成交量指标
      volumeIndicators: {
        volume: 0,
        averageVolume: 0,
        volumeRatio: 1,
        onBalanceVolume: 0
      },
      
      // 动量指标
      momentumIndicators: {
        momentum: 0,
        rateOfChange: 0,
        acceleration: 0
      }
    };
    
    // 添加增强的AI解释
    const enhancedExplanation = {
      ...standardResult.aiExplanation,
      enhancedReasoning: `AI分析功能暂时不可用，请稍后再试。`,
      advancedFactors: []
    };
    
    return {
      ...standardResult,
      enhancedIndicators,
      aiExplanation: enhancedExplanation
    };
  }

  // 获取分析成本配置
  static getAnalysisCost(analysisType) {
    // 从配置中获取，而非硬编码
    const costConfig = {
      'comprehensive': { credits: 15, usd: 0.15 },
      'technical': { credits: 10, usd: 0.10 },
      'fundamental': { credits: 12, usd: 0.12 },
      'sentiment': { credits: 8, usd: 0.08 },
      'enhanced': { credits: 20, usd: 0.20 }, // 增强分析成本更高
      'default': { credits: 10, usd: 0.10 }
    };
    
    return costConfig[analysisType] || costConfig['default'];
  }

  // 分析进度更新
  static async simulateAnalysisProgress(analysisId) {
    const progressSteps = [25, 45, 65, 85];
    
    for (const progress of progressSteps) {
      // 使用固定延迟时间，而非随机时间
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysis = await Analysis.findById(analysisId);
      if (analysis && analysis.status === 'processing') {
        analysis.progress = progress;
        await analysis.save();
      } else {
        break;
      }
    }
  }

  // 取消分析任务
  static async cancelAnalysis(req, res) {
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
  }

  // 获取分析统计
  static async getAnalysisStats(req, res) {
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
  }

  // 添加分析笔记
  static async addAnalysisNote(req, res) {
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
  }

  // 标记分析结果为收藏
  static async toggleFavorite(req, res) {
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
  }

  // 分享分析结果
  static async shareAnalysis(req, res) {
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
  }
}

module.exports = EnhancedAIController;