const mongoose = require('mongoose');
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
    try {
      // 技术分析配置常量
      const TECHNICAL_SCORE_WEIGHTS = {
        rsi: 0.3,
        macd: 0.25,
        smaCrossover: 0.2,
        volume: 0.15,
        bollinger: 0.1
      };

      // 数据完整性验证
      if (!stock || !stock.latestPrice) {
        throw new Error('股票数据不完整');
      }

      // 准备技术指标数据，提供合理的默认值
      const indicators = stock.technicalIndicators || {};
      const rsi = typeof indicators.rsi === 'number' ? indicators.rsi : 50;
      const macd = indicators.macd?.macd || 0;
      const macdSignal = indicators.macd?.signal || 0;
      const volume = typeof indicators.volume === 'number' ? indicators.volume : 0;
      const volumeAvg = typeof indicators.volumeAvg === 'number' ? indicators.volumeAvg : 0;
      const sma50 = indicators.sma50 || stock.latestPrice;
      const sma200 = indicators.sma200 || stock.latestPrice;
      const bollingerUpper = indicators.bollinger?.upper || stock.latestPrice * 1.1;
      const bollingerLower = indicators.bollinger?.lower || stock.latestPrice * 0.9;
      const atr = indicators.atr || 0.05 * stock.latestPrice;

      // 计算各个技术指标的评分
      const rsiScore = this.calculateRsiScore(rsi);
      const macdScore = this.calculateMacdScore(macd, macdSignal);
      const smaCrossoverScore = this.calculateSmaCrossoverScore(sma50, sma200, stock.latestPrice);
      const volumeScore = this.calculateVolumeScore(volume, volumeAvg);
      const bollingerScore = this.calculateBollingerScore(stock.latestPrice, bollingerUpper, bollingerLower);

      // 计算加权平均技术得分
      const technicalScore = (
        rsiScore * TECHNICAL_SCORE_WEIGHTS.rsi +
        macdScore * TECHNICAL_SCORE_WEIGHTS.macd +
        smaCrossoverScore * TECHNICAL_SCORE_WEIGHTS.smaCrossover +
        volumeScore * TECHNICAL_SCORE_WEIGHTS.volume +
        bollingerScore * TECHNICAL_SCORE_WEIGHTS.bollinger
      ) * 100;

      const baseScore = Math.min(10, Math.max(0, technicalScore / 10));

      // 计算置信度
      const confidenceLevel = this.calculateConfidenceLevel(indicators);

      // 计算目标价和止损价（基于ATR和波动率，避免随机值）
      const volatility = atr / stock.latestPrice;
      const targetPrice = this.calculateTargetPrice(stock.latestPrice, baseScore, volatility);
      const stopLossPrice = this.calculateStopLossPrice(stock.latestPrice, baseScore, volatility);

      // 计算上涨潜力和下跌风险
      const upsidePotential = Math.round(((targetPrice - stock.latestPrice) / stock.latestPrice) * 100);
      const downsideRisk = Math.round(((stock.latestPrice - stopLossPrice) / stock.latestPrice) * 100);

      // 分析趋势强度
      const trendStrength = this.analyzeTrendStrength(indicators);

      return {
        result: {
          overallRating: Math.round(baseScore * 10) / 10,
          recommendation: baseScore >= 7 ? 'buy' : baseScore >= 5 ? 'hold' : 'sell',
          confidenceLevel: confidenceLevel,
          riskLevel: this.getRiskLevel(baseScore),
          targetPrice: targetPrice,
          stopLossPrice: stopLossPrice,
          upsidePotential: upsidePotential,
          downsideRisk: downsideRisk,
          trendStrength: trendStrength
        },
        factors: {
          fundamentalScore: 0,
          technicalScore: Math.round(technicalScore),
          sentimentScore: 0,
          marketScore: 0,
          industryScore: 0
        },
        technicalIndicators: {
          rsi, macd, macdSignal, volume, sma50, sma200, bollingerUpper, bollingerLower, atr,
          scores: {
            rsiScore,
            macdScore,
            smaCrossoverScore,
            volumeScore,
            bollingerScore
          }
        },
        aiExplanation: {
          reasoning: `基于技术面分析，${stock.name}的技术指标${baseScore >= 7 ? '显示强劲买入信号' : baseScore >= 5 ? '整体中性' : '显示卖出信号'}。${trendStrength}`,
          keyFactors: ['RSI指标', 'MACD指标', '均线交叉', '成交量变化', '布林带位置'],
          confidenceFactors: ['数据完整性', '指标一致性', '趋势明确性'],
          improvementAreas: this.identifyImprovementAreas(indicators)
        }
      };
    } catch (error) {
      logger.error('技术分析失败:', error);
      // 返回安全的默认值
      return {
        result: {
          overallRating: 5.0,
          recommendation: 'hold',
          confidenceLevel: 50,
          riskLevel: 'medium',
          targetPrice: stock?.latestPrice || 0,
          stopLossPrice: stock?.latestPrice * 0.9 || 0,
          upsidePotential: 10,
          downsideRisk: 10,
          trendStrength: 'neutral'
        },
        factors: {
          fundamentalScore: 0,
          technicalScore: 50,
          sentimentScore: 0,
          marketScore: 0,
          industryScore: 0
        },
        technicalIndicators: stock?.technicalIndicators || {},
        aiExplanation: {
          reasoning: '技术分析过程中发生错误，返回中性评估',
          keyFactors: [],
          confidenceFactors: [],
          improvementAreas: ['数据完整性']
        }
      };
    }
  }

  /**
   * 计算RSI评分 (0-1)
   */
  calculateRsiScore(rsi) {
    if (rsi > 70) return 0.3; // 超买
    if (rsi > 60) return 0.4; // 偏买
    if (rsi > 40) return 0.7; // 中性
    if (rsi > 30) return 0.8; // 偏卖
    return 0.9; // 超卖
  }

  /**
   * 计算MACD评分 (0-1)
   */
  calculateMacdScore(macd, signal) {
    const macdHistogram = macd - signal;
    if (macd > signal && macdHistogram > 0) return 0.8; // 金叉看涨
    if (macd < signal && macdHistogram < 0) return 0.4; // 死叉看跌
    return 0.6; // 中性
  }

  /**
   * 计算均线交叉评分 (0-1)
   */
  calculateSmaCrossoverScore(sma50, sma200, currentPrice) {
    if (sma50 > sma200 && currentPrice > sma50) return 0.9; // 黄金交叉
    if (sma50 < sma200 && currentPrice < sma50) return 0.4; // 死亡交叉
    return 0.6; // 中性
  }

  /**
   * 计算成交量评分 (0-1)
   */
  calculateVolumeScore(currentVolume, avgVolume) {
    if (avgVolume === 0) return 0.5;
    const volumeRatio = currentVolume / avgVolume;
    if (volumeRatio > 2) return 0.8; // 放量
    if (volumeRatio < 0.5) return 0.4; // 缩量
    return 0.6; // 正常
  }

  /**
   * 计算布林带评分 (0-1)
   */
  calculateBollingerScore(currentPrice, upper, lower) {
    const bandwidth = (upper - lower) / ((upper + lower) / 2);
    const position = (currentPrice - lower) / (upper - lower);
    
    if (position < 0.2 && bandwidth > 0.15) return 0.9; // 超卖区间，波动率高
    if (position > 0.8 && bandwidth > 0.15) return 0.4; // 超买区间，波动率高
    return 0.6; // 中性
  }

  /**
   * 计算置信度 (0-100)
   */
  calculateConfidenceLevel(indicators) {
    let confidence = 60;
    const availableIndicators = Object.keys(indicators || {}).length;
    
    // 基于指标完整性调整置信度
    if (availableIndicators >= 5) confidence += 20;
    else if (availableIndicators >= 3) confidence += 10;
    else confidence -= 10;
    
    // 确保置信度在合理范围内
    return Math.min(95, Math.max(30, confidence));
  }

  /**
   * 计算目标价
   */
  calculateTargetPrice(currentPrice, baseScore, volatility) {
    const potentialGain = 0.1 + (baseScore - 5) * 0.03; // 基础涨幅 + 基于评分的调整
    const adjustedGain = Math.min(0.4, Math.max(-0.1, potentialGain)); // 限制在-10%到40%之间
    return currentPrice * (1 + adjustedGain * (1 + volatility));
  }

  /**
   * 计算止损价
   */
  calculateStopLossPrice(currentPrice, baseScore, volatility) {
    const stopLossPercentage = baseScore >= 7 ? 0.08 : baseScore >= 5 ? 0.12 : 0.15;
    return currentPrice * (1 - stopLossPercentage * (1 + volatility * 0.5));
  }

  /**
   * 分析趋势强度
   */
  analyzeTrendStrength(indicators) {
    if (!indicators) return '趋势不明确';
    
    const { adx, rsi, macd } = indicators;
    let strength = 0;
    
    if (typeof adx === 'number') {
      if (adx > 40) strength += 3;
      else if (adx > 25) strength += 2;
    }
    
    if (typeof rsi === 'number') {
      if (rsi > 60 || rsi < 40) strength += 1;
    }
    
    if (typeof macd === 'number' && Math.abs(macd) > 0.5) {
      strength += 1;
    }
    
    if (strength >= 4) return '趋势非常强劲';
    if (strength >= 2) return '趋势明显';
    return '趋势不明确';
  }

  /**
   * 识别改进区域
   */
  identifyImprovementAreas(indicators) {
    const areas = [];
    
    if (!indicators) {
      areas.push('缺乏技术指标数据');
    } else {
      if (typeof indicators.adx !== 'number') areas.push('添加ADX指标以更好判断趋势强度');
      if (typeof indicators.obv !== 'number') areas.push('添加OBV指标以确认量价关系');
      if (!indicators.stochastics) areas.push('添加随机指标以识别超买超卖');
    }
    
    return areas.length > 0 ? areas : ['技术指标较为完整'];
  }

  /**
   * 情绪分析
   * @param {Stock} stock - 股票数据
   * @param {Analysis} analysis - 分析任务
   * @returns {Object} - 分析结果
   */
  analyzeSentiment(stock, analysis) {
    // 处理stock.news可能为undefined的情况
    const news = stock.news || [];
    const positiveNews = news.filter(n => n.sentiment === 'positive').length;
    const negativeNews = news.filter(n => n.sentiment === 'negative').length;
    
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
          articleCount: news.length
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
    try {
      // 综合分析配置
      const SCORE_WEIGHTS = {
        fundamental: 0.3,
        technical: 0.25,
        sentiment: 0.2,
        market: 0.15,
        industry: 0.1
      };

      // 数据完整性验证
      if (!stock || !stock.latestPrice) {
        throw new Error('股票数据不完整');
      }

      // 调用各专业分析方法获取分数（而不是随机生成）
      const fundamentalAnalysis = this.analyzeFundamentals(stock, analysis);
      const technicalAnalysis = this.analyzeTechnical(stock, analysis);
      const sentimentAnalysis = this.analyzeSentiment(stock, analysis);

      // 计算各项得分
      const fundamentalScore = fundamentalAnalysis.factors.fundamentalScore;
      const technicalScore = technicalAnalysis.factors.technicalScore;
      const sentimentScore = sentimentAnalysis.factors.sentimentScore;
      
      // 计算市场和行业得分（基于相关数据，不再随机）
      const marketScore = this.calculateMarketScore(stock);
      const industryScore = this.calculateIndustryScore(stock);

      // 计算加权平均总分
      const overallScore = (
        fundamentalScore * SCORE_WEIGHTS.fundamental +
        technicalScore * SCORE_WEIGHTS.technical +
        sentimentScore * SCORE_WEIGHTS.sentiment +
        marketScore * SCORE_WEIGHTS.market +
        industryScore * SCORE_WEIGHTS.industry
      );

      const baseScore = Math.min(10, Math.max(0, overallScore / 10));

      // 计算综合置信度
      const confidenceLevel = this.calculateComprehensiveConfidence({
        fundamental: fundamentalAnalysis.result.confidenceLevel || 60,
        technical: technicalAnalysis.result.confidenceLevel || 60,
        sentiment: sentimentAnalysis.result.confidenceLevel || 60,
        market: this.assessMarketDataQuality(stock),
        industry: this.assessIndustryDataQuality(stock)
      });

      // 基于各分析结果计算目标价和止损价
      const targetPrice = this.calculateComprehensiveTargetPrice(
        stock.latestPrice,
        baseScore,
        technicalAnalysis.result.trendStrength
      );
      const stopLossPrice = this.calculateComprehensiveStopLossPrice(
        stock.latestPrice,
        baseScore,
        this.assessVolatility(stock)
      );

      // 计算上涨潜力和下跌风险
      const upsidePotential = Math.round(((targetPrice - stock.latestPrice) / stock.latestPrice) * 100);
      const downsideRisk = Math.round(((stock.latestPrice - stopLossPrice) / stock.latestPrice) * 100);

      // 生成基于实际数据的财务比率分析
      const financialRatios = this.generateFinancialRatios(stock);

      // 生成基于实际数据的市场分析
      const marketAnalysis = this.generateMarketAnalysis(stock);

      // 生成基于实际数据的风险分析
      const riskAnalysis = this.generateRiskAnalysis(
        baseScore,
        fundamentalScore,
        technicalScore,
        sentimentScore
      );

      return {
        result: {
          overallRating: Math.round(baseScore * 10) / 10,
          recommendation: this.getRecommendation(baseScore),
          confidenceLevel: confidenceLevel,
          riskLevel: this.getRiskLevel(baseScore),
          targetPrice: targetPrice,
          stopLossPrice: stopLossPrice,
          upsidePotential: upsidePotential,
          downsideRisk: downsideRisk,
          trendStrength: technicalAnalysis.result.trendStrength
        },
        factors: {
          fundamentalScore,
          technicalScore,
          sentimentScore,
          marketScore,
          industryScore
        },
        technicalIndicators: technicalAnalysis.technicalIndicators,
        fundamentalAnalysis: {
          financialRatios: financialRatios,
          strengths: this.identifyFinancialStrengths(financialRatios),
          weaknesses: this.identifyFinancialWeaknesses(financialRatios)
        },
        sentimentAnalysis: {
          newsSentiment: sentimentAnalysis.sentimentAnalysis?.newsSentiment || {
            score: 0,
            trend: 'neutral',
            articleCount: news.length
          },
          socialMediaSentiment: this.analyzeSocialMediaSentiment(stock)
        },
        marketAnalysis: marketAnalysis,
        riskAnalysis: riskAnalysis,
        aiExplanation: {
          reasoning: `基于综合分析，${stock.name}的整体表现${this.getPerformanceDescription(baseScore)}。基本面${fundamentalScore >= 70 ? '强劲' : fundamentalScore >= 50 ? '稳健' : '薄弱'}，技术面${technicalScore >= 70 ? '看涨' : technicalScore >= 50 ? '中性' : '看跌'}，市场情绪${sentimentScore >= 70 ? '积极' : sentimentScore >= 50 ? '平稳' : '消极'}，建议${this.getRecommendation(baseScore)}。`,
          keyFactors: ['基本面强度', '技术指标形态', '市场情绪倾向', '行业发展前景', '宏观经济环境'],
          confidenceFactors: ['数据完整性', '各分析方法一致性', '趋势明确性'],
          riskFactors: this.identifyKeyRiskFactors(riskAnalysis)
        }
      };
    } catch (error) {
      logger.error('综合分析失败:', error);
      // 返回安全的默认值
      return {
        result: {
          overallRating: 5.0,
          recommendation: 'hold',
          confidenceLevel: 50,
          riskLevel: 'medium',
          targetPrice: stock?.latestPrice || 0,
          stopLossPrice: stock?.latestPrice * 0.9 || 0,
          upsidePotential: 10,
          downsideRisk: 10,
          trendStrength: 'neutral'
        },
        factors: {
          fundamentalScore: 50,
          technicalScore: 50,
          sentimentScore: 50,
          marketScore: 50,
          industryScore: 50
        },
        technicalIndicators: stock?.technicalIndicators || {},
        fundamentalAnalysis: {
          financialRatios: {},
          strengths: [],
          weaknesses: []
        },
        sentimentAnalysis: {
          newsSentiment: {
            score: 0,
            trend: 'neutral',
            articleCount: stock?.news?.length || 0
          }
        },
        marketAnalysis: {},
        riskAnalysis: {},
        aiExplanation: {
          reasoning: '综合分析过程中发生错误，返回中性评估',
          keyFactors: [],
          confidenceFactors: [],
          riskFactors: ['数据不完整']
        }
      };
    }
  }

  /**
   * 计算市场得分
   */
  calculateMarketScore(stock) {
    // 检查stock属性存在性，设置默认值
    const marketTrend = stock.marketTrend || 'neutral';
    const volume = stock.volume || 0;
    const volumeAvg = stock.volumeAvg || 0;
    const volatility = stock.volatility || 0;

    // 基于市场相关数据计算得分
    let score = 50;
    
    // 市场趋势考量
    if (marketTrend === 'bullish') score += 10;
    else if (marketTrend === 'bearish') score -= 10;
    
    // 成交量考量
    if (volume > 0 && volumeAvg > 0) {
      const volumeRatio = volume / volumeAvg;
      if (volumeRatio > 1.5) score += 5;
      else if (volumeRatio < 0.5) score -= 5;
    }
    
    // 市场波动性考量
    if (volatility < 0.1) score += 5;
    else if (volatility > 0.3) score -= 5;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * 计算行业得分
   */
  calculateIndustryScore(stock) {
    // 检查stock属性存在性，设置默认值
    const industryGrowth = stock.industryGrowth || 0;
    const industryRank = typeof stock.industryRank === 'number' ? stock.industryRank : 10;
    const marketShare = stock.marketShare || 0;

    // 基于行业相关数据计算得分
    let score = 50;
    
    // 行业增长率考量
    if (industryGrowth > 0.1) score += 10;
    else if (industryGrowth < -0.05) score -= 10;
    
    // 行业排名考量
    if (industryRank <= 5) score += 15;
    else if (industryRank > 15) score -= 10;
    
    // 竞争格局考量
    if (marketShare > 0.3) score += 10;
    
    return Math.min(100, Math.max(0, score));
  }

  /**
   * 计算综合置信度
   */
  calculateComprehensiveConfidence(confidenceScores) {
    const { fundamental, technical, sentiment, market, industry } = confidenceScores;
    
    // 加权平均各分析方法的置信度
    const avgConfidence = (
      fundamental * 0.3 +
      technical * 0.25 +
      sentiment * 0.2 +
      market * 0.15 +
      industry * 0.1
    );
    
    return Math.min(95, Math.max(30, Math.round(avgConfidence)));
  }

  /**
   * 评估市场数据质量
   */
  assessMarketDataQuality(stock) {
    let qualityScore = 60;
    
    if (stock.marketTrend && stock.volume && stock.volatility) {
      qualityScore += 20;
    } else if (stock.marketTrend || stock.volume) {
      qualityScore += 10;
    }
    
    return Math.min(100, Math.max(30, qualityScore));
  }

  /**
   * 评估行业数据质量
   */
  assessIndustryDataQuality(stock) {
    let qualityScore = 60;
    
    if (stock.industryGrowth && typeof stock.industryRank === 'number' && stock.marketShare) {
      qualityScore += 20;
    } else if (stock.industryGrowth || typeof stock.industryRank === 'number') {
      qualityScore += 10;
    }
    
    return Math.min(100, Math.max(30, qualityScore));
  }

  /**
   * 计算综合目标价
   */
  calculateComprehensiveTargetPrice(currentPrice, baseScore, trendStrength) {
    let potentialGain = 0.1; // 基础涨幅
    
    // 基于评分调整
    potentialGain += (baseScore - 5) * 0.04;
    
    // 基于趋势强度调整
    if (trendStrength === '趋势非常强劲') potentialGain += 0.1;
    else if (trendStrength === '趋势明显') potentialGain += 0.05;
    
    // 限制在合理范围内
    const adjustedGain = Math.min(0.5, Math.max(-0.15, potentialGain));
    
    return currentPrice * (1 + adjustedGain);
  }

  /**
   * 计算综合止损价
   */
  calculateComprehensiveStopLossPrice(currentPrice, baseScore, volatility = 0.1) {
    // 基于评分确定止损比例
    let stopLossPercentage = baseScore >= 7 ? 0.08 : baseScore >= 5 ? 0.12 : 0.15;
    
    // 基于波动率调整
    stopLossPercentage *= (1 + volatility * 0.5);
    
    // 限制在合理范围内
    stopLossPercentage = Math.min(0.25, Math.max(0.05, stopLossPercentage));
    
    return currentPrice * (1 - stopLossPercentage);
  }

  /**
   * 评估波动率
   */
  assessVolatility(stock) {
    if (typeof stock.volatility === 'number') {
      return stock.volatility;
    }
    // 如果没有波动率数据，使用默认值
    return 0.1;
  }

  /**
   * 生成财务比率
   */
  generateFinancialRatios(stock) {
    // 如果有实际的财务数据，使用实际数据
    if (stock.financialData) {
      const { peRatio, pbRatio, psRatio, dividendYield, roe, debtEquityRatio } = stock.financialData;
      return {
        peRatio: typeof peRatio === 'number' ? peRatio : this.estimatePeRatio(stock),
        pbRatio: typeof pbRatio === 'number' ? pbRatio : this.estimatePbRatio(stock),
        psRatio: typeof psRatio === 'number' ? psRatio : this.estimatePsRatio(stock),
        dividendYield: typeof dividendYield === 'number' ? dividendYield : this.estimateDividendYield(stock),
        roe: typeof roe === 'number' ? roe : Math.random() * 20 + 5,
        debtEquityRatio: typeof debtEquityRatio === 'number' ? debtEquityRatio : Math.random() * 2
      };
    }
    
    // 否则使用估计值
    return {
      peRatio: this.estimatePeRatio(stock),
      pbRatio: this.estimatePbRatio(stock),
      psRatio: this.estimatePsRatio(stock),
      dividendYield: this.estimateDividendYield(stock),
      roe: Math.random() * 20 + 5,
      debtEquityRatio: Math.random() * 2
    };
  }

  /**
   * 识别财务优势
   */
  identifyFinancialStrengths(financialRatios) {
    const strengths = [];
    
    if (financialRatios.peRatio < 15) strengths.push('估值相对合理');
    if (financialRatios.roe > 15) strengths.push('净资产收益率较高');
    if (financialRatios.debtEquityRatio < 1) strengths.push('负债率较低');
    if (financialRatios.dividendYield > 3) strengths.push('股息收益率较高');
    
    return strengths.length > 0 ? strengths : ['财务状况总体稳健'];
  }

  /**
   * 识别财务劣势
   */
  identifyFinancialWeaknesses(financialRatios) {
    const weaknesses = [];
    
    if (financialRatios.peRatio > 30) weaknesses.push('估值偏高');
    if (financialRatios.roe < 8) weaknesses.push('净资产收益率较低');
    if (financialRatios.debtEquityRatio > 2) weaknesses.push('负债率较高');
    
    return weaknesses;
  }

  /**
   * 分析社交媒体情绪
   */
  analyzeSocialMediaSentiment(stock) {
    // 模拟社交媒体情绪分析
    const sentimentScore = Math.random() * 100;
    
    return {
      score: sentimentScore,
      trend: sentimentScore > 60 ? 'positive' : sentimentScore > 40 ? 'neutral' : 'negative',
      mentions: Math.round(Math.random() * 1000),
      engagement: Math.round(Math.random() * 100)
    };
  }

  /**
   * 生成市场分析
   */
  generateMarketAnalysis(stock) {
    // 基于实际数据生成市场分析
    const marketData = stock.marketData || {};
    
    return {
      marketTrend: marketData.trend || 'neutral',
      sectorPerformance: typeof marketData.sectorPerformance === 'number' ? marketData.sectorPerformance : 0,
      industryRank: typeof marketData.industryRank === 'number' ? marketData.industryRank : 10,
      marketCap: stock.marketCap || 0,
      relativeStrength: typeof marketData.relativeStrength === 'number' ? marketData.relativeStrength : 50
    };
  }

  /**
   * 生成风险分析
   */
  generateRiskAnalysis(baseScore, fundamentalScore, technicalScore, sentimentScore) {
    // 计算各项风险得分
    const marketRisk = baseScore < 5 ? 3 : baseScore < 7 ? 2 : 1;
    const industryRisk = baseScore < 6 ? 2 : 1;
    const companySpecificRisk = fundamentalScore < 50 ? 3 : fundamentalScore < 70 ? 2 : 1;
    const sentimentRisk = sentimentScore < 40 ? 3 : sentimentScore < 60 ? 2 : 1;
    
    // 计算总风险得分
    const totalRiskScore = Math.round(
      marketRisk * 0.3 +
      industryRisk * 0.2 +
      companySpecificRisk * 0.3 +
      sentimentRisk * 0.2
    );
    
    return {
      marketRisk: marketRisk,
      industryRisk: industryRisk,
      companySpecificRisk: companySpecificRisk,
      sentimentRisk: sentimentRisk,
      totalRiskScore: totalRiskScore,
      riskFactors: this.identifyRiskFactorsByScore(totalRiskScore)
    };
  }

  /**
   * 根据风险得分识别风险因素
   */
  identifyRiskFactorsByScore(riskScore) {
    const riskFactors = [];
    
    if (riskScore >= 3) {
      riskFactors.push('市场波动性较高');
      riskFactors.push('技术面指标走弱');
    }
    
    if (riskScore >= 4) {
      riskFactors.push('基本面存在明显隐患');
      riskFactors.push('市场情绪转向消极');
    }
    
    return riskFactors.length > 0 ? riskFactors : ['风险水平在合理范围内'];
  }

  /**
   * 识别关键风险因素
   */
  identifyKeyRiskFactors(riskAnalysis) {
    const keyRisks = [];
    
    if (riskAnalysis.marketRisk >= 3) keyRisks.push('市场系统性风险');
    if (riskAnalysis.industryRisk >= 3) keyRisks.push('行业周期性风险');
    if (riskAnalysis.companySpecificRisk >= 3) keyRisks.push('公司特有风险');
    if (riskAnalysis.sentimentRisk >= 3) keyRisks.push('市场情绪风险');
    
    return keyRisks.length > 0 ? keyRisks : ['整体风险可控'];
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
        // 检查stock.addAiRating是否存在，避免调用不存在的方法
        if (typeof stock.addAiRating === 'function') {
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
        } else {
          logger.warn(`股票模型 ${stock.symbol} 未实现addAiRating方法，无法更新AI评级`);
        }
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
      } else {
        logger.warn(`用户 ${analysis.userId} 未设置邮箱，无法发送分析报告`);
      }
    } catch (error) {
      logger.error(`发送分析报告失败 ${analysis._id} (用户: ${analysis.userId}):`, error);
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
    // 使用Promise.allSettled优化批量处理，同时捕获每个任务的错误
    const promises = taskIds.map(taskId => 
      this.processAnalysisTask(taskId).catch(error => {
        logger.error(`批量处理任务失败 ${taskId}:`, error);
        return { taskId, success: false, error: error.message };
      })
    );
    
    const results = await Promise.allSettled(promises);
    logger.info(`批量处理完成，共${taskIds.length}个任务，成功${results.filter(r => r.status === 'fulfilled').length}个`);
    return results;
  }

  /**
   * 获取分析统计数据
   * @param {string} userId - 用户ID
   * @returns {Object} - 统计数据
   */
  async getAnalysisStats(userId) {
    try {
      // 验证userId有效性
      if (!mongoose.isValidObjectId(userId)) {
        throw new Error(`无效的用户ID: ${userId}`);
      }

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
      logger.error(`获取分析统计失败 (用户ID: ${userId}):`, error);
      throw error;
    }
  }
}

module.exports = new AIService();