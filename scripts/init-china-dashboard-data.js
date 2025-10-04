#!/usr/bin/env node

/**
 * A股仪表板数据初始化脚本
 * 专门用于创建中国A股市场的分析和推荐数据
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Analysis = require('../models/Analysis');
const Recommendation = require('../models/Recommendation');
const { connectDB, isMongoDBConnected } = require('../config/db');
const { logger } = require('../utils/logger');

// 加载环境变量
dotenv.config();

// A股分析报告模板
const CHINA_ANALYSES = [
  {
    stockSymbol: '000001.SZ',
    stockName: '平安银行',
    analysisType: 'comprehensive',
    timeRange: '1y',
    result: {
      overallRating: 7.8,
      recommendation: 'hold',
      confidenceLevel: 82,
      riskLevel: 'medium',
      targetPrice: 18.50,
      stopLossPrice: 14.20,
      upsidePotential: 12.3,
      downsideRisk: 8.7
    },
    factors: {
      fundamentalScore: 75,
      technicalScore: 80,
      sentimentScore: 78,
      marketScore: 72,
      industryScore: 76
    }
  },
  {
    stockSymbol: '000002.SZ',
    stockName: '万科A',
    analysisType: 'fundamental',
    timeRange: '1y',
    result: {
      overallRating: 6.5,
      recommendation: 'hold',
      confidenceLevel: 75,
      riskLevel: 'medium',
      targetPrice: 22.80,
      stopLossPrice: 17.50,
      upsidePotential: 8.2,
      downsideRisk: 10.3
    },
    factors: {
      fundamentalScore: 70,
      technicalScore: 65,
      sentimentScore: 68,
      marketScore: 62,
      industryScore: 65
    }
  },
  {
    stockSymbol: '000651.SZ',
    stockName: '格力电器',
    analysisType: 'technical',
    timeRange: '6m',
    result: {
      overallRating: 8.2,
      recommendation: 'buy',
      confidenceLevel: 85,
      riskLevel: 'low',
      targetPrice: 58.60,
      stopLossPrice: 48.20,
      upsidePotential: 15.7,
      downsideRisk: 6.8
    },
    factors: {
      fundamentalScore: 78,
      technicalScore: 85,
      sentimentScore: 82,
      marketScore: 75,
      industryScore: 79
    }
  },
  {
    stockSymbol: '600519.SH',
    stockName: '贵州茅台',
    analysisType: 'sentiment',
    timeRange: '3m',
    result: {
      overallRating: 9.1,
      recommendation: 'buy',
      confidenceLevel: 90,
      riskLevel: 'medium',
      targetPrice: 1850.00,
      stopLossPrice: 1620.00,
      upsidePotential: 8.9,
      downsideRisk: 12.4
    },
    factors: {
      fundamentalScore: 92,
      technicalScore: 88,
      sentimentScore: 95,
      marketScore: 85,
      industryScore: 90
    }
  },
  {
    stockSymbol: '300750.SZ',
    stockName: '宁德时代',
    analysisType: 'comprehensive',
    timeRange: '1y',
    result: {
      overallRating: 8.7,
      recommendation: 'buy',
      confidenceLevel: 88,
      riskLevel: 'high',
      targetPrice: 265.40,
      stopLossPrice: 210.50,
      upsidePotential: 18.3,
      downsideRisk: 15.7
    },
    factors: {
      fundamentalScore: 85,
      technicalScore: 82,
      sentimentScore: 90,
      marketScore: 80,
      industryScore: 88
    }
  }
];

// A股推荐组合模板
const CHINA_RECOMMENDATIONS = [
  {
    recommendationType: 'personalized',
    title: '稳健蓝筹A股组合',
    description: '适合稳健型投资者的A股蓝筹股组合，包含银行、白酒、家电等行业的龙头企业',
    stocks: [
      {
        symbol: '000001.SZ',
        name: '平安银行',
        exchange: 'SZSE',
        sector: '金融',
        industry: '银行',
        recommendation: 'hold',
        rating: 7.8,
        confidence: 82,
        targetPrice: 18.50,
        currentPrice: 16.48,
        upsidePotential: 12.3,
        riskLevel: 'medium',
        timeHorizon: 'long-term',
        weight: 25,
        reasons: ['稳定的分红政策', '良好的资产质量', '零售业务转型成功'],
        riskFactors: ['利率风险', '信用风险'],
        catalysts: ['经济复苏', '货币政策宽松']
      },
      {
        symbol: '600519.SH',
        name: '贵州茅台',
        exchange: 'SHSE',
        sector: '食品饮料',
        industry: '白酒',
        recommendation: 'buy',
        rating: 9.1,
        confidence: 90,
        targetPrice: 1850.00,
        currentPrice: 1698.50,
        upsidePotential: 8.9,
        riskLevel: 'medium',
        timeHorizon: 'long-term',
        weight: 30,
        reasons: ['品牌价值突出', '产品供不应求', '盈利能力强'],
        riskFactors: ['高端消费受限', '政策风险'],
        catalysts: ['消费升级', '节假日消费旺季']
      },
      {
        symbol: '000333.SZ',
        name: '美的集团',
        exchange: 'SZSE',
        sector: '家用电器',
        industry: '白色家电',
        recommendation: 'buy',
        rating: 8.3,
        confidence: 85,
        targetPrice: 78.50,
        currentPrice: 68.20,
        upsidePotential: 15.1,
        riskLevel: 'low',
        timeHorizon: 'medium-term',
        weight: 20,
        reasons: ['产品竞争力强', '海外市场拓展', '数字化转型'],
        riskFactors: ['原材料价格波动', '汇率风险'],
        catalysts: ['家电下乡政策', '智能家居发展']
      },
      {
        symbol: '600036.SH',
        name: '招商银行',
        exchange: 'SHSE',
        sector: '金融',
        industry: '银行',
        recommendation: 'buy',
        rating: 8.5,
        confidence: 87,
        targetPrice: 42.80,
        currentPrice: 38.60,
        upsidePotential: 10.9,
        riskLevel: 'low',
        timeHorizon: 'long-term',
        weight: 25,
        reasons: ['零售业务领先', '资产质量优良', '金融科技布局'],
        riskFactors: ['利率风险', '房地产风险'],
        catalysts: ['经济复苏', '财富管理业务增长']
      }
    ],
    performance: {
      totalReturn: 18.7,
      annualizedReturn: 22.3,
      sharpeRatio: 1.35,
      maxDrawdown: -7.2,
      winRate: 75,
      averageProfit: 15.2,
      averageLoss: -3.8
    },
    strategy: {
      investmentStyle: 'value',
      riskTolerance: 'moderate',
      timeHorizon: 'long-term',
      diversification: {
        maxPositionSize: 30,
        sectorLimit: 40,
        industryLimit: 25
      },
      rebalancing: {
        frequency: 'monthly',
        threshold: 5,
        lastRebalanced: new Date(),
        nextRebalance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }
  },
  {
    recommendationType: 'ai',
    title: '高成长A股组合',
    description: '适合积极型投资者的高成长A股组合，包含新能源、半导体、生物医药等新兴行业',
    stocks: [
      {
        symbol: '300750.SZ',
        name: '宁德时代',
        exchange: 'SZSE',
        sector: '电气设备',
        industry: '电源设备',
        recommendation: 'buy',
        rating: 8.7,
        confidence: 88,
        targetPrice: 265.40,
        currentPrice: 224.30,
        upsidePotential: 18.3,
        riskLevel: 'high',
        timeHorizon: 'medium-term',
        weight: 30,
        reasons: ['动力电池龙头', '技术领先', '全球市场份额高'],
        riskFactors: ['行业竞争加剧', '原材料价格波动'],
        catalysts: ['新能源车渗透率提升', '储能市场发展']
      },
      {
        symbol: '688981.SH',
        name: '中芯国际',
        exchange: 'SHSE',
        sector: '电子',
        industry: '半导体',
        recommendation: 'hold',
        rating: 7.5,
        confidence: 80,
        targetPrice: 68.50,
        currentPrice: 58.70,
        upsidePotential: 16.7,
        riskLevel: 'high',
        timeHorizon: 'long-term',
        weight: 25,
        reasons: ['国产替代需求', '技术不断进步', '政策支持'],
        riskFactors: ['技术壁垒', '国际制裁风险'],
        catalysts: ['自主可控政策', '5G/AI发展']
      },
      {
        symbol: '603259.SH',
        name: '药明康德',
        exchange: 'SHSE',
        sector: '医药生物',
        industry: '医疗服务',
        recommendation: 'buy',
        rating: 8.8,
        confidence: 86,
        targetPrice: 135.00,
        currentPrice: 118.40,
        upsidePotential: 14.0,
        riskLevel: 'medium',
        timeHorizon: 'long-term',
        weight: 25,
        reasons: ['CRO行业龙头', '客户资源丰富', '研发能力强'],
        riskFactors: ['政策风险', '汇率风险'],
        catalysts: ['创新药发展', '医药外包需求增长']
      },
      {
        symbol: '002594.SZ',
        name: '比亚迪',
        exchange: 'SZSE',
        sector: '汽车',
        industry: '汽车整车',
        recommendation: 'buy',
        rating: 8.9,
        confidence: 89,
        targetPrice: 285.00,
        currentPrice: 245.60,
        upsidePotential: 16.0,
        riskLevel: 'high',
        timeHorizon: 'medium-term',
        weight: 20,
        reasons: ['新能源车领军企业', '技术领先', '品牌影响力强'],
        riskFactors: ['行业竞争激烈', '原材料成本'],
        catalysts: ['新能源车政策支持', '海外市场拓展']
      }
    ],
    performance: {
      totalReturn: 32.5,
      annualizedReturn: 45.8,
      sharpeRatio: 1.25,
      maxDrawdown: -18.5,
      winRate: 68,
      averageProfit: 22.7,
      averageLoss: -8.3
    },
    strategy: {
      investmentStyle: 'growth',
      riskTolerance: 'aggressive',
      timeHorizon: 'medium-term',
      diversification: {
        maxPositionSize: 30,
        sectorLimit: 50,
        industryLimit: 35
      },
      rebalancing: {
        frequency: 'weekly',
        threshold: 7,
        lastRebalanced: new Date(),
        nextRebalance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    }
  }
];

/**
 * 初始化A股仪表板数据
 */
async function initChinaDashboardData() {
  try {
    logger.info('开始初始化A股仪表板数据...');
    
    // 尝试连接数据库
    let dbConnected = false;
    try {
      await connectDB();
      dbConnected = isMongoDBConnected();
      if (dbConnected) {
        logger.info('数据库连接成功');
      } else {
        logger.warn('数据库连接失败，将使用模拟数据模式');
      }
    } catch (error) {
      logger.warn('数据库连接失败，将使用模拟数据模式:', error.message);
    }
    
    if (!dbConnected) {
      logger.error('无法连接到数据库，无法初始化A股仪表板数据');
      process.exit(1);
    }
    
    // 获取用户数据
    const users = await User.find({});
    if (users.length === 0) {
      logger.warn('未找到用户数据，请先运行 npm run init-test-data 初始化用户数据');
      process.exit(1);
    }
    
    // 获取A股股票数据
    const chinaStocks = await Stock.find({
      $or: [
        { symbol: { $regex: /\.SZ$/ } },
        { symbol: { $regex: /\.SH$/ } }
      ]
    });
    
    if (chinaStocks.length === 0) {
      logger.warn('未找到A股股票数据，请先运行 npm run init-china-data 初始化A股股票数据');
      process.exit(1);
    }
    
    logger.info(`找到 ${chinaStocks.length} 只A股股票`);
    
    // 创建A股分析数据
    logger.info('创建A股分析数据...');
    for (const analysisTemplate of CHINA_ANALYSES) {
      try {
        // 检查股票是否存在
        const stock = chinaStocks.find(s => s.symbol === analysisTemplate.stockSymbol);
        if (!stock) {
          logger.warn(`未找到股票 ${analysisTemplate.stockSymbol}，跳过分析报告创建`);
          continue;
        }
        
        // 选择一个用户（使用user1）
        const user = users.find(u => u.username === 'user1') || users[0];
        
        // 创建分析数据
        const analysisData = {
          userId: user._id,
          stockSymbol: analysisTemplate.stockSymbol,
          stockName: analysisTemplate.stockName,
          analysisType: analysisTemplate.analysisType,
          timeRange: analysisTemplate.timeRange,
          status: 'completed',
          priority: 'high',
          progress: 100,
          result: analysisTemplate.result,
          factors: analysisTemplate.factors,
          technicalIndicators: {
            movingAverages: {
              ma5: stock.latestPrice * (1 + (Math.random() - 0.5) * 0.05),
              ma10: stock.latestPrice * (1 + (Math.random() - 0.5) * 0.05),
              ma20: stock.latestPrice * (1 + (Math.random() - 0.5) * 0.05),
              ma60: stock.latestPrice * (1 + (Math.random() - 0.5) * 0.05),
              ma120: stock.latestPrice * (1 + (Math.random() - 0.5) * 0.05),
              ma250: stock.latestPrice * (1 + (Math.random() - 0.5) * 0.05)
            },
            oscillators: {
              rsi: Math.floor(Math.random() * 40) + 30, // 30-70
              macd: (Math.random() - 0.5) * 2,
              signalLine: (Math.random() - 0.5) * 2,
              stochastic: Math.floor(Math.random() * 100),
              williamsR: Math.floor(Math.random() * 100) - 100
            }
          },
          fundamentalAnalysis: {
            financialRatios: {
              peRatio: stock.peRatio || (Math.random() * 30 + 5),
              pbRatio: (Math.random() * 5 + 1),
              psRatio: (Math.random() * 10 + 1),
              dividendYield: stock.dividendYield || (Math.random() * 3),
              roe: (Math.random() * 20 + 5),
              debtEquityRatio: (Math.random() * 2)
            },
            growthMetrics: {
              revenueGrowth: (Math.random() * 20 + 5),
              earningsGrowth: (Math.random() * 25 + 5),
              epsGrowth: (Math.random() * 30 + 5)
            }
          },
          aiExplanation: {
            reasoning: `该股票在行业中具有领先地位，基本面稳健，技术面呈现${Math.random() > 0.5 ? '上升' : '盘整'}趋势。`,
            keyFactors: ['行业地位', '财务状况', '技术趋势', '市场情绪'],
            assumptions: ['行业政策稳定', '市场需求持续'],
            limitations: ['市场波动风险', '政策变化风险'],
            confidenceFactors: ['稳定的盈利能力', '良好的成长性']
          },
          executionTime: {
            startTime: new Date(Date.now() - 3600000),
            endTime: new Date(),
            duration: 3600000
          },
          cost: {
            creditsUsed: 5,
            costInUSD: 0.25
          },
          metadata: {
            modelVersion: 'v2.1',
            apiVersion: '1.0',
            dataSources: ['Wind', '公司公告', '市场新闻'],
            lastUpdated: new Date()
          },
          isFavorite: Math.random() > 0.5
        };
        
        const analysis = new Analysis(analysisData);
        await analysis.save();
        logger.info(`创建A股分析报告: ${analysisTemplate.stockSymbol} - ${analysisTemplate.stockName}`);
      } catch (error) {
        logger.error(`创建A股分析报告失败 ${analysisTemplate.stockSymbol}:`, error.message);
      }
    }
    
    // 创建A股推荐数据
    logger.info('创建A股推荐数据...');
    for (const recommendationTemplate of CHINA_RECOMMENDATIONS) {
      try {
        // 选择一个VIP用户
        const user = users.find(u => u.username === 'vipuser') || users[0];
        
        // 创建推荐数据
        const recommendationData = {
          userId: user._id,
          recommendationType: recommendationTemplate.recommendationType,
          status: 'active',
          priority: 'high',
          title: recommendationTemplate.title,
          description: recommendationTemplate.description,
          stocks: recommendationTemplate.stocks,
          performance: recommendationTemplate.performance,
          strategy: recommendationTemplate.strategy,
          aiSettings: {
            modelVersion: 'v2.1',
            confidenceThreshold: 70,
            riskAdjustment: true,
            diversificationEnabled: true
          },
          metadata: {
            source: 'ai',
            algorithm: 'A股优化算法',
            dataSources: ['Wind', '公司公告', '市场新闻'],
            lastGenerated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            updateFrequency: 'weekly'
          },
          isFavorite: true,
          isPublic: false,
          tags: ['A股', '中国股市', recommendationTemplate.recommendationType === 'personalized' ? '稳健' : '成长'],
          categories: ['A股', '投资组合']
        };
        
        const recommendation = new Recommendation(recommendationData);
        await recommendation.save();
        logger.info(`创建A股推荐组合: ${recommendationTemplate.title}`);
      } catch (error) {
        logger.error(`创建A股推荐组合失败 ${recommendationTemplate.title}:`, error.message);
      }
    }
    
    logger.info('A股仪表板数据初始化完成!');
    logger.info(`创建了 ${CHINA_ANALYSES.length} 个A股分析报告`);
    logger.info(`创建了 ${CHINA_RECOMMENDATIONS.length} 个A股投资推荐`);
    
    // 断开数据库连接
    await mongoose.connection.close();
    logger.info('数据库连接已关闭');
    
    process.exit(0);
  } catch (error) {
    logger.error('初始化A股仪表板数据过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  initChinaDashboardData();
}

module.exports = {
  initChinaDashboardData
};