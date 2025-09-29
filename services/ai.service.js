const Analysis = require('../models/Analysis');
const Stock = require('../models/Stock');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const stockService = require('./stock.service');
const { sendAnalysisReport } = require('../utils/email');

class AIService {
  /**
   * 创建AI分析任务
   * @param {Object} options - 分析选项
   * @returns {Promise<Analysis>} - 创建的分析任务
   */
  async createAnalysisTask(options) {
    try {
      const { userId, stockSymbol, analysisType, timeRange, priority } = options;

      // 验证用户
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('用户不存在');
      }

      // 验证股票
      let stock = await Stock.findOne({ symbol: stockSymbol.toUpperCase() });
      if (!stock) {
        // 尝试从外部API获取并创建股票
        try {
          stock = await stockService.updateStockPrice(stockSymbol);
        } catch (error) {
          throw new Error('股票不存在且无法从外部API获取数据');
        }
      }

      // 创建分析任务
      const analysis = new Analysis({
        userId,
        stockSymbol: stock.symbol,
        stockName: stock.name,
        analysisType: analysisType || 'comprehensive',
        timeRange: timeRange || '1y',
        priority: priority || 'medium',
        status: 'pending',
        progress: 0
      });

      await analysis.save();

      // 异步处理分析
      this.processAnalysisTask(analysis._id).catch(error => {
        logger.error(`分析任务处理失败 ${analysis._id}:`, error);
      });

      logger.info(`创建AI分析任务: ${analysis._id} - ${stock.symbol}`);
      return analysis;
    } catch (error) {
      logger.error('创建AI分析任务失败:', error);
      throw error;
    }
  }

  /**
   * 处理分析任务
   * @param {string} analysisId - 分析任务ID
   */
  async processAnalysisTask(analysisId) {
    try {
      const analysis = await Analysis.findById(analysisId);
      if (!analysis || analysis.status !== 'pending') return;

      // 更新状态为处理中
      analysis.status = 'processing';
      analysis.progress = 10;
      await analysis.save();

      // 1. 更新股票数据
      await this.updateStockData(analysis);
      analysis.progress = 30;
      await analysis.save();

      // 2. 计算技术指标
      await this.calculateTechnicalIndicators(analysis);
      analysis.progress = 50;
      await analysis.save();

      // 3. 执行AI分析
      const analysisResult = await this.performAIAnalysis(analysis);
      analysis.progress = 80;
      await analysis.save();

      // 4. 生成最终报告
      await this.generateFinalReport(analysis, analysisResult);
      analysis.status = 'completed';
      analysis.progress = 100;
      await analysis.save();

      // 5. 发送通知
      await this.sendAnalysisNotification(analysis);

      logger.info(`分析任务完成: ${analysisId} - ${analysis.stockSymbol}`);
    } catch (error) {
      logger.error(`处理分析任务失败 ${analysisId}:`, error);
      
      const analysis = await Analysis.findById(analysisId);
      if (analysis) {
        analysis.status = 'failed';
        analysis.progress = 0;
        await analysis.save();
      }
    }
  }

  /**
   * 更新股票数据
   * @param {Analysis} analysis - 分析任务
   */
  async updateStockData(analysis) {
    try {
      // 更新最新价格
      await stockService.updateStockPrice(analysis.stockSymbol);
      
      // 更新历史数据
      await stockService.updateHistoricalData(analysis.stockSymbol, 'daily');
      
      // 更新新闻
      await stockService.updateStockNews(analysis.stockSymbol);
      
      logger.info(`股票数据更新完成: ${analysis.stockSymbol}`);
    } catch (error) {
      logger.error(`更新股票数据失败 ${analysis.stockSymbol}:`, error);
      throw error;
    }
  }

  /**
   * 计算技术指标
   * @param {Analysis} analysis - 分析任务
   */
  async calculateTechnicalIndicators(analysis) {
    try {
      await stockService.calculateTechnicalIndicators(analysis.stockSymbol);
      logger.info(`技术指标计算完成: ${analysis.stockSymbol}`);
    } catch (error) {
      logger.error(`计算技术指标失败 ${analysis.stockSymbol}:`, error);
      throw error;
    }
  }

  /**
   * 执行AI分析
   * @param {Analysis} analysis - 分析任务
   * @returns {Object} - 分析结果
   */
  async performAIAnalysis(analysis) {
    try {
      const stock = await Stock.findOne({ symbol: analysis.stockSymbol });
      if (!stock) {
        throw new Error('股票数据不存在');
      }

      // 根据分析类型执行不同的分析
      switch (analysis.analysisType) {
        case 'fundamental':
          return this.analyzeFundamentals(stock, analysis);
        case 'technical':
          return this.analyzeTechnical(stock, analysis);
        case 'sentiment':
          return this.analyzeSentiment(stock, analysis);
        case 'comprehensive':
        default:
          return this.analyzeComprehensive(stock, analysis);
      }
    } catch (error) {
      logger.error(`执行AI分析失败 ${analysis.stockSymbol}:`, error);
      throw error;
    }
  }

  /**
   * 基本面分析
   * @param {Stock} stock - 股票数据
   * @param {Analysis} analysis - 分析任务
   * @returns {Object} - 分析结果
   */
  analyzeFundamentals(stock, analysis) {
    // 模拟基本面分析逻辑
    const baseScore = Math.random() * 4 + 4; // 4-8分
    
    return {
      result: {
        overallRating: Math.round(baseScore * 10) / 10,
        recommendation: baseScore >= 7 ? 'buy' : baseScore >= 5 ? 'hold' : 'sell',
        confidenceLevel: Math.round(Math.random() * 30 + 60),
        riskLevel: baseScore >= 7 ? 'low' : baseScore >= 5 ? 'medium' : 'high',
        targetPrice: stock.latestPrice * (1 + (Math.random() * 0.3 - 0.1)),
        stopLossPrice: stock.latestPrice * (0.85 + Math.random() * 0.1),
        upsidePotential: Math.round(((stock.latestPrice * 1.2 - stock.latestPrice) / stock.latestPrice) * 100),
        downsideRisk: Math.round(((stock.latestPrice - stock.latestPrice * 0.9) / stock.latestPrice) * 100)
      },
      factors: {
        fundamentalScore: Math.round(baseScore * 10),
        technicalScore: 0,
        sentimentScore: 0,
        marketScore: 0,
        industryScore: 0
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
      aiExplanation: {
        reasoning: `基于基本面分析，${stock.name}的财务状况${baseScore >= 7 ? '良好' : baseScore >= 5 ? '一般' : '较差'}，建议${baseScore >= 7 ? '买入' : baseScore >= 5 ? '持有' : '卖出'}。`,
        keyFactors: ['盈利能力', '财务健康度', '成长性', '估值水平'],
        confidenceFactors: ['财务数据可靠性', '行业地位']
      }
    };
  }

  /**
   * 技术面分析
   * @param {Stock} stock - 股票数据
   * @param {Analysis} analysis - 分析任务
   * @returns {Object} - 分析结果
   */
  analyzeTechnical(stock, analysis) {
    const rsi = stock.technicalIndicators?.rsi || 50;
    const macd = stock.technicalIndicators?.macd?.macd || 0;
    
    let technicalScore = 50;
    if (rsi > 30 && rsi < 70) technicalScore += 10;
    if (rsi < 40) technicalScore += 15;
    if (macd > 0) technicalScore += 10;
    
    const baseScore = technicalScore / 10;
    
    return {
      result: {
        overallRating: Math.round(baseScore * 10) / 10,
        recommendation: baseScore >= 7 ? 'buy' : baseScore >= 5 ? 'hold' : 'sell',
        confidenceLevel: Math.round(Math.random() * 30 + 60),
        riskLevel: baseScore >= 7 ? 'low' : baseScore >= 5 ? 'medium' : 'high',
        targetPrice: stock.latestPrice * (1 + (Math.random() * 0.3 - 0.1)),
        stopLossPrice: stock.latestPrice * (0.85 + Math.random() * 0.1),
        upsidePotential: Math.round(((stock.latestPrice * 1.2 - stock.latestPrice) / stock.latestPrice) * 100),
        downsideRisk: Math.round(((stock.latestPrice - stock.latestPrice * 0.9) / stock.latestPrice) * 100)
      },
      factors: {
        fundamentalScore: 0,
        technicalScore: technicalScore,
        sentimentScore: 0,
        marketScore: 0,
        industryScore: 0
      },
      technicalIndicators: stock.technicalIndicators,
      aiExplanation: {
        reasoning: `基于技术面分析，${stock.name}的技术指标${baseScore >= 7 ? '显示买入信号' : baseScore >= 5 ? '中性' : '显示卖出信号'}，建议${baseScore >= 7 ? '买入' : baseScore >= 5 ? '持有' : '卖出'}。`,
        keyFactors: ['RSI指标', 'MACD指标', '移动平均线', '成交量'],
        confidenceFactors: ['技术形态清晰度', '指标一致性']
      }
    };
  }

  /**
   * 情绪分析
   * @param {Stock} stock - 股票数据
   * @param {Analysis} analysis - 分析任务
   * @returns {Object} - 分析结果
   */
  analyzeSentiment(stock, analysis) {
    const positiveNews = stock.news.filter(n => n.sentiment === 'positive').length;
    const negativeNews = stock.news.filter(n => n.sentiment === 'negative').length;
    
    let sentimentScore = 50;
    if (positiveNews > negativeNews) sentimentScore += 20;
    if (positiveNews > negativeNews * 2) sentimentScore += 15;
    
    const baseScore = sentimentScore / 10;
    
    return {
      result: {
        overallRating: Math.round(baseScore * 10) / 10,
        recommendation: baseScore >= 7 ? 'buy' : baseScore >= 5 ? 'hold' : 'sell',
        confidenceLevel: Math.round(Math.random() * 30 + 60),
        riskLevel: baseScore >= 7 ? 'low' : baseScore >= 5 ? 'medium' : 'high',
        targetPrice: stock.latestPrice * (1 + (Math.random() * 0.3 - 0.1)),
        stopLossPrice: stock.latestPrice * (0.85 + Math.random() * 0.1),
        upsidePotential: Math.round(((stock.latestPrice * 1.2 - stock.latestPrice) / stock.latestPrice) * 100),
        downsideRisk: Math.round(((stock.latestPrice - stock.latestPrice * 0.9) / stock.latestPrice) * 100)
      },
      factors: {
        fundamentalScore: 0,
        technicalScore: 0,
        sentimentScore: sentimentScore,
        marketScore: 0,
        industryScore: 0
      },
      sentimentAnalysis: {
        newsSentiment: {
          score: (positiveNews - negativeNews) / (positiveNews + negativeNews + 1),
          trend: positiveNews > negativeNews ? 'up' : 'down',
          articleCount: stock.news.length
        }
      },
      aiExplanation: {
        reasoning: `基于市场情绪分析，${stock.name}的新闻情绪${baseScore >= 7 ? '积极' : baseScore >= 5 ? '中性' : '消极'}，建议${baseScore >= 7 ? '买入' : baseScore >= 5 ? '持有' : '卖出'}。`,
        keyFactors: ['新闻情绪', '市场关注度', '分析师评级'],
        confidenceFactors: ['新闻来源可靠性', '样本数量']
      }
    };
  }

  /**
   * 综合分析
   * @param {Stock} stock - 股票数据
   * @param {Analysis} analysis - 分析任务
   * @returns {Object} - 分析结果
   */
  analyzeComprehensive(stock, analysis) {
    // 综合各种分析方法
    const fundamentalScore = Math.random() * 40 + 50;
    const technicalScore = Math.random() * 40 + 50;
    const sentimentScore = Math.random() * 40 + 50;
    const marketScore = Math.random() * 40 + 50;
    const industryScore = Math.random() * 40 + 50;
    
    const overallScore = (
      fundamentalScore * 0.3 +
      technicalScore * 0.25 +
      sentimentScore * 0.2 +
      marketScore * 0.15 +
      industryScore * 0.1
    );
    
    const baseScore = overallScore / 10;
    
    return {
      result: {
        overallRating: Math.round(baseScore * 10) / 10,
        recommendation: this.getRecommendation(baseScore),
        confidenceLevel: Math.round(Math.random() * 30 + 60),
        riskLevel: this.getRiskLevel(baseScore),
        targetPrice: stock.latestPrice * (1 + (Math.random() * 0.4 - 0.1)),
        stopLossPrice: stock.latestPrice * (0.85 + Math.random() * 0.1),
        upsidePotential: Math.round(((stock.latestPrice * 1.2 - stock.latestPrice) / stock.latestPrice) * 100),
        downsideRisk: Math.round(((stock.latestPrice - stock.latestPrice * 0.9) / stock.latestPrice) * 100)
      },
      factors: {
        fundamentalScore,
        technicalScore,
        sentimentScore,
        marketScore,
        industryScore
      },
      technicalIndicators: stock.technicalIndicators,
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
          articleCount: stock.news.length
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
        reasoning: `基于综合分析，${stock.name}的整体表现${this.getPerformanceDescription(baseScore)}，建议${this.getRecommendation(baseScore)}。`,
        keyFactors: ['基本面', '技术面', '市场情绪', '行业前景', '宏观环境'],
        confidenceFactors: ['数据完整性', '模型准确性', '市场稳定性']
      }
    };
  }

  /**
   * 生成最终报告
   * @param {Analysis} analysis - 分析任务
   * @param {Object} analysisResult - 分析结果
   */
  async generateFinalReport(analysis, analysisResult) {
    try {
      analysis.result = analysisResult.result;
      analysis.factors = analysisResult.factors;
      analysis.technicalIndicators = analysisResult.technicalIndicators;
      analysis.fundamentalAnalysis = analysisResult.fundamentalAnalysis;
      analysis.sentimentAnalysis = analysisResult.sentimentAnalysis;
      analysis.marketAnalysis = analysisResult.marketAnalysis;
      analysis.riskAnalysis = analysisResult.riskAnalysis;
      analysis.aiExplanation = analysisResult.aiExplanation;
      
      analysis.executionTime = {
        startTime: analysis.createdAt,
        endTime: Date.now(),
        duration: Date.now() - analysis.createdAt.getTime()
      };
      
      analysis.cost = {
        creditsUsed: 10,
        costInUSD: 0.1
      };
      
      await analysis.save();
      
      // 将AI评级添加到股票数据
      const stock = await Stock.findOne({ symbol: analysis.stockSymbol });
      if (stock && analysisResult.result) {
        await stock.addAiRating({
          rating: analysisResult.result.overallRating,
          recommendation: analysisResult.result.recommendation,
          confidence: analysisResult.result.confidenceLevel,
          factors: {
            fundamental: analysisResult.factors.fundamentalScore,
            technical: analysisResult.factors.technicalScore,
            market: analysisResult.factors.marketScore,
            sentiment: analysisResult.factors.sentimentScore
          },
          analysis: analysisResult.aiExplanation.reasoning
        });
      }
      
      logger.info(`最终报告生成完成: ${analysis._id}`);
    } catch (error) {
      logger.error(`生成最终报告失败 ${analysis._id}:`, error);
      throw error;
    }
  }

  /**
   * 发送分析结果通知
   * @param {Analysis} analysis - 分析任务
   */
  async sendAnalysisNotification(analysis) {
    try {
      const user = await User.findById(analysis.userId);
      if (user && user.email) {
        await sendAnalysisReport(user.email, analysis);
        logger.info(`分析报告已发送至: ${user.email}`);
      }
    } catch (error) {
      logger.error(`发送分析报告失败 ${analysis._id}:`, error);
    }
  }

  /**
   * 获取推荐建议
   * @param {number} score - 分数
   * @returns {string} - 推荐建议
   */
  getRecommendation(score) {
    if (score >= 8.5) return 'strong buy';
    if (score >= 7) return 'buy';
    if (score >= 5.5) return 'hold';
    if (score >= 4) return 'sell';
    return 'strong sell';
  }

  /**
   * 获取风险等级
   * @param {number} score - 分数
   * @returns {string} - 风险等级
   */
  getRiskLevel(score) {
    if (score >= 8) return 'very low';
    if (score >= 6.5) return 'low';
    if (score >= 5) return 'medium';
    if (score >= 3.5) return 'high';
    return 'very high';
  }

  /**
   * 获取表现描述
   * @param {number} score - 分数
   * @returns {string} - 表现描述
   */
  getPerformanceDescription(score) {
    if (score >= 8.5) return '优秀';
    if (score >= 7) return '良好';
    if (score >= 5.5) return '一般';
    if (score >= 4) return '较差';
    return '很差';
  }

  /**
   * 批量处理分析任务
   * @param {Array} taskIds - 任务ID数组
   */
  async batchProcessTasks(taskIds) {
    for (const taskId of taskIds) {
      try {
        await this.processAnalysisTask(taskId);
      } catch (error) {
        logger.error(`批量处理任务失败 ${taskId}:`, error);
      }
    }
  }

  /**
   * 获取分析统计数据
   * @param {string} userId - 用户ID
   * @returns {Object} - 统计数据
   */
  async getAnalysisStats(userId) {
    try {
      const stats = await Analysis.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
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

      return stats[0] || {
        total: 0,
        completed: 0,
        pending: 0,
        processing: 0,
        failed: 0,
        averageDuration: 0
      };
    } catch (error) {
      logger.error('获取分析统计失败:', error);
      throw error;
    }
  }
}

module.exports = new AIService();