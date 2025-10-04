const aiService = require('./ai.service');
const Stock = require('../models/Stock');
const Analysis = require('../models/Analysis');
const { logger } = require('../utils/logger');

class AlphaBotService {
  constructor() {
    // 将AI服务的方法绑定到当前实例
    this.createAnalysisTask = aiService.createAnalysisTask.bind(aiService);
    this.processAnalysisTask = aiService.processAnalysisTask.bind(aiService);
  }

  /**
   * AlphaBot选股逻辑
   * @param {Object} options - 选股选项
   * @returns {Promise<Array>} - 选股结果
   */
  async selectStocks(options = {}) {
    try {
      logger.info('AlphaBot开始选股');
      
      // 获取所有A股股票
      const chinaStocks = await Stock.find({
        symbol: { $regex: /^\d{6}\.(SZ|SH)$/ }
      });
      
      logger.info(`共找到 ${chinaStocks.length} 只A股股票`);
      
      // 为每只股票生成综合分析报告（如果不存在）
      const analyses = [];
      for (const stock of chinaStocks) {
        try {
          // 检查是否已有分析报告
          let analysis = await Analysis.findOne({
            stockSymbol: stock.symbol,
            analysisType: 'comprehensive'
          }).sort({ createdAt: -1 });
          
          // 如果没有分析报告或报告过期（超过7天），则生成新的报告
          if (!analysis || (Date.now() - analysis.createdAt.getTime() > 7 * 24 * 60 * 60 * 1000)) {
            logger.info(`为 ${stock.symbol} 生成新的综合分析报告`);
            analysis = await this.createAnalysisTask({
              userId: '68e05a5eb2d891faa6ab9cd8', // 管理员用户
              stockSymbol: stock.symbol,
              analysisType: 'comprehensive',
              timeRange: '1y',
              priority: 'medium'
            });
            
            // 等待分析完成
            await this.waitForAnalysisCompletion(analysis._id);
            analysis = await Analysis.findById(analysis._id);
          }
          
          analyses.push({
            stock,
            analysis: analysis.result
          });
        } catch (error) {
          logger.error(`分析 ${stock.symbol} 时出错:`, error);
        }
      }
      
      // 根据AlphaBot逻辑筛选股票
      const selectedStocks = this.filterStocksByAlphaBotLogic(analyses, options);
      
      logger.info(`AlphaBot选股完成，选出 ${selectedStocks.length} 只股票`);
      return selectedStocks;
    } catch (error) {
      logger.error('AlphaBot选股出错:', error);
      throw error;
    }
  }
  
  /**
   * 根据AlphaBot逻辑筛选股票
   * @param {Array} analyses - 股票分析数据
   * @param {Object} options - 筛选选项
   * @returns {Array} - 筛选后的股票
   */
  filterStocksByAlphaBotLogic(analyses, options = {}) {
    // AlphaBot选股逻辑：
    // 1. 综合评级 >= 7.0
    // 2. 置信度 >= 70%
    // 3. 风险等级为低或中等
    // 4. 基本面得分 >= 70
    // 5. 技术面得分 >= 60
    // 6. 上涨潜力 >= 15%
    
    const {
      minRating = 7.0,
      minConfidence = 70,
      maxRiskLevel = 'medium',
      minFundamentalScore = 70,
      minTechnicalScore = 60,
      minUpsidePotential = 15
    } = options;
    
    const RISK_LEVELS = {
      'very low': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'very high': 5
    };
    
    const filteredStocks = analyses.filter(({ stock, analysis }) => {
      // 检查必要字段是否存在
      if (!analysis || !analysis.result || !analysis.factors) {
        return false;
      }
      
      const { result, factors } = analysis;
      
      // 应用筛选条件
      return (
        result.overallRating >= minRating &&
        result.confidenceLevel >= minConfidence &&
        RISK_LEVELS[result.riskLevel] <= RISK_LEVELS[maxRiskLevel] &&
        factors.fundamentalScore >= minFundamentalScore &&
        factors.technicalScore >= minTechnicalScore &&
        result.upsidePotential >= minUpsidePotential
      );
    });
    
    // 按综合评级排序
    return filteredStocks.sort((a, b) => b.analysis.result.overallRating - a.analysis.result.overallRating);
  }
  
  /**
   * AlphaBot诊股逻辑
   * @param {string} stockSymbol - 股票代码
   * @returns {Promise<Object>} - 诊股结果
   */
  async diagnoseStock(stockSymbol) {
    try {
      logger.info(`AlphaBot开始诊股: ${stockSymbol}`);
      
      // 获取股票数据
      const stock = await Stock.findOne({ symbol: stockSymbol.toUpperCase() });
      if (!stock) {
        throw new Error(`股票 ${stockSymbol} 不存在`);
      }
      
      // 生成综合分析报告
      let analysis = await Analysis.findOne({
        stockSymbol: stock.symbol,
        analysisType: 'comprehensive'
      }).sort({ createdAt: -1 });
      
      // 如果没有分析报告或报告过期（超过1天），则生成新的报告
      if (!analysis || (Date.now() - analysis.createdAt.getTime() > 24 * 60 * 60 * 1000)) {
        logger.info(`为 ${stock.symbol} 生成新的综合分析报告`);
        const analysisTask = await this.createAnalysisTask({
          userId: '68e05a5eb2d891faa6ab9cd8', // 管理员用户
          stockSymbol: stock.symbol,
          analysisType: 'comprehensive',
          timeRange: '1y',
          priority: 'high'
        });
        
        // 等待分析完成
        await this.waitForAnalysisCompletion(analysisTask._id);
        analysis = await Analysis.findById(analysisTask._id);
      }
      
      // 生成AlphaBot诊股报告
      const diagnosis = this.generateAlphaBotDiagnosis(stock, analysis);
      
      logger.info(`AlphaBot诊股完成: ${stockSymbol}`);
      return diagnosis;
    } catch (error) {
      logger.error(`AlphaBot诊股 ${stockSymbol} 出错:`, error);
      throw error;
    }
  }
  
  /**
   * 生成AlphaBot诊股报告
   * @param {Stock} stock - 股票数据
   * @param {Analysis} analysis - 分析报告
   * @returns {Object} - 诊股报告
   */
  generateAlphaBotDiagnosis(stock, analysis) {
    if (!analysis || !analysis.result) {
      return {
        stock: {
          symbol: stock.symbol,
          name: stock.name,
          price: stock.latestPrice
        },
        diagnosis: {
          overallRating: 0,
          recommendation: 'hold',
          confidenceLevel: 0,
          riskLevel: 'medium',
          diagnosis: '无法生成诊股报告，缺少分析数据'
        }
      };
    }
    
    const { result, factors, technicalIndicators, fundamentalAnalysis } = analysis;
    
    // AlphaBot诊股逻辑：
    // 1. 综合评估各项指标
    // 2. 生成详细的诊断说明
    // 3. 提供投资建议和风险提示
    
    const diagnosis = {
      stock: {
        symbol: stock.symbol,
        name: stock.name,
        price: stock.latestPrice
      },
      analysis: {
        overallRating: result.overallRating,
        recommendation: result.recommendation,
        confidenceLevel: result.confidenceLevel,
        riskLevel: result.riskLevel,
        targetPrice: result.targetPrice,
        stopLossPrice: result.stopLossPrice,
        upsidePotential: result.upsidePotential,
        downsideRisk: result.downsideRisk
      },
      factors: {
        fundamentalScore: factors.fundamentalScore,
        technicalScore: factors.technicalScore,
        sentimentScore: factors.sentimentScore,
        marketScore: factors.marketScore,
        industryScore: factors.industryScore
      },
      technicalIndicators: {
        rsi: technicalIndicators.oscillators?.rsi,
        macd: technicalIndicators.oscillators?.macd,
        ma20: technicalIndicators.movingAverages?.ma20,
        ma60: technicalIndicators.movingAverages?.ma60
      },
      fundamentalMetrics: {
        peRatio: fundamentalAnalysis.financialRatios?.peRatio,
        pbRatio: fundamentalAnalysis.financialRatios?.pbRatio,
        roe: fundamentalAnalysis.financialRatios?.roe,
        debtEquityRatio: fundamentalAnalysis.financialRatios?.debtEquityRatio
      },
      alphaBotDiagnosis: {
        summary: this.generateDiagnosisSummary(result, factors),
        strengths: this.identifyStrengths(result, factors, technicalIndicators, fundamentalAnalysis),
        weaknesses: this.identifyWeaknesses(result, factors, technicalIndicators, fundamentalAnalysis),
        investmentAdvice: this.generateInvestmentAdvice(result),
        riskWarnings: this.generateRiskWarnings(result)
      }
    };
    
    return diagnosis;
  }
  
  /**
   * 生成诊断摘要
   */
  generateDiagnosisSummary(result, factors) {
    const rating = result.overallRating;
    const recommendation = result.recommendation;
    
    if (rating >= 8.5) {
      return `该股票综合表现优秀，各项指标健康，${this.getRecommendationText(recommendation)}建议。`;
    } else if (rating >= 7.0) {
      return `该股票综合表现良好，基本面稳健，${this.getRecommendationText(recommendation)}建议。`;
    } else if (rating >= 5.5) {
      return `该股票综合表现一般，需要关注风险，建议${this.getRecommendationText(recommendation)}。`;
    } else {
      return `该股票综合表现较差，风险较高，建议${this.getRecommendationText(recommendation)}。`;
    }
  }
  
  /**
   * 获取建议文本
   */
  getRecommendationText(recommendation) {
    switch (recommendation) {
      case 'strong buy': return '强烈买入';
      case 'buy': return '买入';
      case 'hold': return '持有';
      case 'sell': return '卖出';
      case 'strong sell': return '强烈卖出';
      default: return '持有';
    }
  }
  
  /**
   * 识别优势
   */
  identifyStrengths(result, factors, technicalIndicators, fundamentalAnalysis) {
    const strengths = [];
    
    if (factors.fundamentalScore >= 80) {
      strengths.push('基本面强劲');
    }
    
    if (factors.technicalScore >= 70) {
      strengths.push('技术面良好');
    }
    
    if (result.upsidePotential >= 25) {
      strengths.push('上涨潜力大');
    }
    
    if (result.confidenceLevel >= 80) {
      strengths.push('分析置信度高');
    }
    
    // 技术指标检查
    const rsi = technicalIndicators.oscillators?.rsi;
    if (rsi && rsi >= 50 && rsi <= 70) {
      strengths.push('RSI指标处于健康区间');
    }
    
    // 基本面指标检查
    const roe = fundamentalAnalysis.financialRatios?.roe;
    if (roe && roe >= 15) {
      strengths.push('净资产收益率较高');
    }
    
    return strengths.length > 0 ? strengths : ['暂未发现明显优势'];
  }
  
  /**
   * 识别劣势
   */
  identifyWeaknesses(result, factors, technicalIndicators, fundamentalAnalysis) {
    const weaknesses = [];
    
    if (factors.fundamentalScore < 60) {
      weaknesses.push('基本面较弱');
    }
    
    if (factors.technicalScore < 50) {
      weaknesses.push('技术面偏弱');
    }
    
    if (result.downsideRisk >= 20) {
      weaknesses.push('下跌风险较大');
    }
    
    if (result.confidenceLevel < 60) {
      weaknesses.push('分析置信度较低');
    }
    
    // 技术指标检查
    const rsi = technicalIndicators.oscillators?.rsi;
    if (rsi && (rsi < 30 || rsi > 70)) {
      weaknesses.push('RSI指标显示超买或超卖');
    }
    
    // 基本面指标检查
    const debtRatio = fundamentalAnalysis.financialRatios?.debtEquityRatio;
    if (debtRatio && debtRatio >= 1) {
      weaknesses.push('负债率较高');
    }
    
    return weaknesses.length > 0 ? weaknesses : ['暂未发现明显劣势'];
  }
  
  /**
   * 生成投资建议
   */
  generateInvestmentAdvice(result) {
    const advice = [];
    
    switch (result.recommendation) {
      case 'strong buy':
        advice.push('该股票具有强烈买入信号，可重点关注');
        advice.push('建议分批建仓，控制仓位风险');
        break;
      case 'buy':
        advice.push('该股票具有买入信号，可适当配置');
        advice.push('建议关注关键支撑位，逢低吸纳');
        break;
      case 'hold':
        advice.push('该股票建议持有观察');
        advice.push('可继续持有现有仓位，关注后续变化');
        break;
      case 'sell':
        advice.push('该股票建议减持');
        advice.push('可考虑逐步减仓，控制风险');
        break;
      case 'strong sell':
        advice.push('该股票具有强烈卖出信号，建议清仓');
        advice.push('应尽快减持或清仓，避免进一步损失');
        break;
    }
    
    if (result.upsidePotential >= 20) {
      advice.push(`上涨潜力达${result.upsidePotential}%，具有较好收益空间`);
    }
    
    if (result.downsideRisk >= 15) {
      advice.push(`下跌风险达${result.downsideRisk}%，需设置合理止损`);
    }
    
    return advice;
  }
  
  /**
   * 生成风险提示
   */
  generateRiskWarnings(result) {
    const warnings = [];
    
    if (result.riskLevel === 'high' || result.riskLevel === 'very high') {
      warnings.push('该股票风险等级较高，投资需谨慎');
    }
    
    if (result.downsideRisk >= 25) {
      warnings.push(`最大下跌风险达${result.downsideRisk}%，请注意风险控制`);
    }
    
    if (result.confidenceLevel < 70) {
      warnings.push('分析置信度较低，建议结合其他信息综合判断');
    }
    
    return warnings.length > 0 ? warnings : ['当前风险水平在合理范围内'];
  }
  
  /**
   * 等待分析完成
   */
  async waitForAnalysisCompletion(analysisId, timeout = 300000) { // 5分钟超时
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const analysis = await Analysis.findById(analysisId);
      if (analysis && analysis.status === 'completed') {
        return analysis;
      }
      
      if (analysis && analysis.status === 'failed') {
        throw new Error('分析任务失败');
      }
      
      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('分析任务超时');
  }
}

module.exports = new AlphaBotService();