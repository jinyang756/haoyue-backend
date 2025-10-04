#!/usr/bin/env node

/**
 * 初始化仪表板数据脚本
 * 用于创建分析和推荐数据，构建完整的仪表板视图
 */

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// 数据模型
const User = require('../models/User');
const Stock = require('../models/Stock');
const Analysis = require('../models/Analysis');
const Recommendation = require('../models/Recommendation');

// MongoDB 连接配置
const getMongoUri = () => {
  return process.env.MONGODB_URI || 
         process.env.MONGO_URI || 
         'mongodb://localhost:27017/haoyue_dev';
};

const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  autoIndex: true,
  connectTimeoutMS: 10000,
};

async function initDashboardData() {
  try {
    console.log('📊 开始初始化仪表板数据...');
    
    // 连接数据库
    const mongoUri = getMongoUri();
    console.log(`🔗 连接数据库: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, mongooseOptions);
    console.log('✅ 数据库连接成功!');
    
    // 获取用户和股票数据
    const users = await User.find({});
    const stocks = await Stock.find({});
    
    if (users.length === 0 || stocks.length === 0) {
      console.log('⚠️  请先运行 npm run init-test-data 初始化基础数据');
      return;
    }
    
    console.log(`👤 找到 ${users.length} 个用户`);
    console.log(`📈 找到 ${stocks.length} 支股票`);
    
    // 创建分析数据
    console.log('🔍 创建分析数据...');
    const analyses = [
      {
        userId: users[1]._id, // user1
        stockSymbol: 'AAPL',
        stockName: 'Apple Inc.',
        analysisType: 'comprehensive',
        timeRange: '1y',
        status: 'completed',
        priority: 'high',
        progress: 100,
        result: {
          overallRating: 8.5,
          recommendation: 'buy',
          confidenceLevel: 85,
          riskLevel: 'medium',
          targetPrice: 185.50,
          stopLossPrice: 145.20,
          upsidePotential: 18.5,
          downsideRisk: 12.3
        },
        factors: {
          fundamentalScore: 82,
          technicalScore: 78,
          sentimentScore: 88,
          marketScore: 75,
          industryScore: 80
        },
        technicalIndicators: {
          movingAverages: {
            ma5: 172.50,
            ma10: 168.30,
            ma20: 165.20,
            ma60: 158.40,
            ma120: 152.60,
            ma250: 145.80
          },
          oscillators: {
            rsi: 62,
            macd: 2.15,
            signalLine: 1.85,
            stochastic: 75,
            williamsR: -25
          }
        },
        fundamentalAnalysis: {
          financialRatios: {
            peRatio: 28.5,
            pbRatio: 32.1,
            psRatio: 6.8,
            dividendYield: 0.6,
            roe: 147.2,
            debtEquityRatio: 1.78
          },
          growthMetrics: {
            revenueGrowth: 8.1,
            earningsGrowth: 12.3,
            epsGrowth: 15.7
          }
        },
        aiExplanation: {
          reasoning: '苹果公司表现出强劲的增长势头，技术创新能力强，市场份额持续扩大。技术指标显示股价处于上升趋势，基本面健康，估值合理。',
          keyFactors: ['强劲的营收增长', '技术创新能力', '健康的财务状况', '上升的技术趋势'],
          assumptions: ['市场环境保持稳定', '公司创新能力持续', '供应链问题得到解决'],
          limitations: ['宏观经济变化影响', '技术更新换代风险', '市场竞争加剧'],
          confidenceFactors: ['稳定的营收增长', '强大的品牌影响力', '优秀的管理团队']
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
          dataSources: ['Yahoo Finance', 'Company Reports', 'Market News'],
          lastUpdated: new Date()
        },
        isFavorite: true
      },
      {
        userId: users[1]._id, // user1
        stockSymbol: 'GOOGL',
        stockName: 'Alphabet Inc.',
        analysisType: 'technical',
        timeRange: '6m',
        status: 'completed',
        priority: 'medium',
        progress: 100,
        result: {
          overallRating: 7.2,
          recommendation: 'hold',
          confidenceLevel: 78,
          riskLevel: 'low',
          targetPrice: 142.30,
          stopLossPrice: 125.80,
          upsidePotential: 8.7,
          downsideRisk: 5.2
        },
        factors: {
          fundamentalScore: 75,
          technicalScore: 82,
          sentimentScore: 70,
          marketScore: 72,
          industryScore: 78
        },
        technicalIndicators: {
          movingAverages: {
            ma5: 138.20,
            ma10: 135.60,
            ma20: 132.40,
            ma60: 128.90,
            ma120: 125.30,
            ma250: 120.70
          },
          oscillators: {
            rsi: 58,
            macd: 1.25,
            signalLine: 0.95,
            stochastic: 68,
            williamsR: -32
          }
        },
        aiExplanation: {
          reasoning: '谷歌表现出稳健的增长，但在当前价位上行空间有限。技术指标显示股价处于盘整阶段，建议持有观察。',
          keyFactors: ['稳定的营收增长', '强大的搜索业务', '良好的现金流', '适度的技术指标'],
          assumptions: ['广告市场保持稳定', '云计算业务持续增长'],
          limitations: ['监管风险', '广告市场波动'],
          confidenceFactors: ['市场领导地位', '多元化的业务组合']
        },
        executionTime: {
          startTime: new Date(Date.now() - 1800000),
          endTime: new Date(),
          duration: 1800000
        },
        cost: {
          creditsUsed: 3,
          costInUSD: 0.15
        },
        metadata: {
          modelVersion: 'v2.1',
          apiVersion: '1.0',
          dataSources: ['Yahoo Finance', 'Company Reports'],
          lastUpdated: new Date()
        },
        isFavorite: false
      },
      {
        userId: users[2]._id, // vipuser
        stockSymbol: 'TSLA',
        stockName: 'Tesla Inc.',
        analysisType: 'sentiment',
        timeRange: '3m',
        status: 'completed',
        priority: 'high',
        progress: 100,
        result: {
          overallRating: 6.8,
          recommendation: 'hold',
          confidenceLevel: 72,
          riskLevel: 'high',
          targetPrice: 265.40,
          stopLossPrice: 210.50,
          upsidePotential: 12.3,
          downsideRisk: 18.7
        },
        factors: {
          fundamentalScore: 65,
          technicalScore: 70,
          sentimentScore: 85,
          marketScore: 68,
          industryScore: 72
        },
        sentimentAnalysis: {
          newsSentiment: {
            score: 75,
            trend: 'positive',
            articleCount: 124
          },
          socialMediaSentiment: {
            score: 82,
            trend: 'positive',
            mentionCount: 5421
          },
          analystRecommendations: {
            averageRating: 2.2,
            recommendation: 'hold',
            analystCount: 28
          }
        },
        aiExplanation: {
          reasoning: '特斯拉在社交媒体上获得积极关注，但股价波动较大。基本面表现一般，建议谨慎持有。',
          keyFactors: ['积极的社交媒体情绪', '技术创新能力', '高波动性', '分析师分歧'],
          assumptions: ['电动车市场持续增长', '技术领先地位保持'],
          limitations: ['高估值风险', '竞争加剧', '宏观经济敏感性'],
          confidenceFactors: ['品牌影响力', '技术创新']
        },
        executionTime: {
          startTime: new Date(Date.now() - 2700000),
          endTime: new Date(),
          duration: 2700000
        },
        cost: {
          creditsUsed: 4,
          costInUSD: 0.20
        },
        metadata: {
          modelVersion: 'v2.1',
          apiVersion: '1.0',
          dataSources: ['Social Media', 'News API', 'Analyst Reports'],
          lastUpdated: new Date()
        },
        isFavorite: true
      }
    ];
    
    for (const analysisData of analyses) {
      const analysis = new Analysis(analysisData);
      await analysis.save();
      console.log(`   ✅ 分析 ${analysisData.stockSymbol} 创建成功`);
    }
    
    // 创建推荐数据
    console.log('💡 创建推荐数据...');
    const recommendations = [
      {
        userId: users[1]._id, // user1
        recommendationType: 'personalized',
        status: 'active',
        priority: 'high',
        title: '稳健增长投资组合',
        description: '适合中等风险偏好的投资者，包含科技和消费类股票',
        stocks: [
          {
            symbol: 'AAPL',
            name: 'Apple Inc.',
            exchange: 'NASDAQ',
            sector: 'Technology',
            industry: 'Consumer Electronics',
            recommendation: 'buy',
            rating: 8.5,
            confidence: 85,
            targetPrice: 185.50,
            currentPrice: 156.40,
            upsidePotential: 18.5,
            riskLevel: 'medium',
            timeHorizon: 'medium-term',
            weight: 40,
            reasons: ['强劲的营收增长', '技术创新能力', '健康的财务状况'],
            riskFactors: ['高估值风险', '市场竞争加剧'],
            catalysts: ['新产品发布', '服务业务增长']
          },
          {
            symbol: 'GOOGL',
            name: 'Alphabet Inc.',
            exchange: 'NASDAQ',
            sector: 'Communication Services',
            industry: 'Internet Content & Information',
            recommendation: 'hold',
            rating: 7.2,
            confidence: 78,
            targetPrice: 142.30,
            currentPrice: 132.80,
            upsidePotential: 8.7,
            riskLevel: 'low',
            timeHorizon: 'long-term',
            weight: 35,
            reasons: ['市场领导地位', '稳定的现金流', '多元化的业务'],
            riskFactors: ['监管风险', '广告市场波动'],
            catalysts: ['云计算增长', 'AI技术发展']
          },
          {
            symbol: 'MSFT',
            name: 'Microsoft Corporation',
            exchange: 'NASDAQ',
            sector: 'Technology',
            industry: 'Software - Infrastructure',
            recommendation: 'buy',
            rating: 8.2,
            confidence: 82,
            targetPrice: 385.00,
            currentPrice: 342.60,
            upsidePotential: 12.4,
            riskLevel: 'low',
            timeHorizon: 'long-term',
            weight: 25,
            reasons: ['云计算领导地位', '稳定的营收增长', '强大的研发能力'],
            riskFactors: ['监管风险', '技术更新风险'],
            catalysts: ['Azure云服务增长', 'AI集成']
          }
        ],
        performance: {
          totalReturn: 15.2,
          annualizedReturn: 18.7,
          sharpeRatio: 1.25,
          maxDrawdown: -8.3,
          winRate: 72,
          averageProfit: 12.5,
          averageLoss: -4.2
        },
        strategy: {
          investmentStyle: 'growth',
          riskTolerance: 'moderate',
          timeHorizon: 'long-term',
          diversification: {
            maxPositionSize: 40,
            sectorLimit: 50,
            industryLimit: 30
          },
          rebalancing: {
            frequency: 'monthly',
            threshold: 5,
            lastRebalanced: new Date(),
            nextRebalance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        aiSettings: {
          modelVersion: 'v2.1',
          confidenceThreshold: 70,
          riskAdjustment: true,
          diversificationEnabled: true
        },
        metadata: {
          source: 'ai',
          algorithm: 'Multi-Factor Optimization',
          dataSources: ['Yahoo Finance', 'Company Reports', 'Market News'],
          lastGenerated: new Date(),
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          updateFrequency: 'weekly'
        },
        isFavorite: true,
        isPublic: false,
        tags: ['growth', 'technology', 'diversified'],
        categories: ['personalized', 'portfolio']
      },
      {
        userId: users[2]._id, // vipuser
        recommendationType: 'ai',
        status: 'active',
        priority: 'high',
        title: '高增长潜力投资组合',
        description: '适合高风险偏好的投资者，包含新兴技术和高增长股票',
        stocks: [
          {
            symbol: 'TSLA',
            name: 'Tesla Inc.',
            exchange: 'NASDAQ',
            sector: 'Consumer Cyclical',
            industry: 'Auto Manufacturers',
            recommendation: 'hold',
            rating: 6.8,
            confidence: 72,
            targetPrice: 265.40,
            currentPrice: 236.70,
            upsidePotential: 12.3,
            riskLevel: 'high',
            timeHorizon: 'medium-term',
            weight: 30,
            reasons: ['技术创新能力', '积极的市场情绪', '电动车市场增长'],
            riskFactors: ['高估值', '竞争加剧', '宏观经济敏感性'],
            catalysts: ['新产品发布', '自动驾驶技术进展']
          },
          {
            symbol: 'NVDA',
            name: 'NVIDIA Corporation',
            exchange: 'NASDAQ',
            sector: 'Technology',
            industry: 'Semiconductors',
            recommendation: 'buy',
            rating: 9.1,
            confidence: 88,
            targetPrice: 950.00,
            currentPrice: 845.30,
            upsidePotential: 12.4,
            riskLevel: 'high',
            timeHorizon: 'long-term',
            weight: 35,
            reasons: ['AI芯片领导地位', '强劲的需求增长', '技术创新'],
            riskFactors: ['高估值', '技术更新风险', '供应链依赖'],
            catalysts: ['AI应用扩展', '数据中心增长']
          },
          {
            symbol: 'AMD',
            name: 'Advanced Micro Devices Inc.',
            exchange: 'NASDAQ',
            sector: 'Technology',
            industry: 'Semiconductors',
            recommendation: 'buy',
            rating: 8.3,
            confidence: 80,
            targetPrice: 165.00,
            currentPrice: 142.80,
            upsidePotential: 15.5,
            riskLevel: 'medium',
            timeHorizon: 'medium-term',
            weight: 25,
            reasons: ['市场份额增长', '产品竞争力提升', '数据中心业务增长'],
            riskFactors: ['竞争加剧', '技术风险'],
            catalysts: ['新处理器发布', '数据中心订单增长']
          },
          {
            symbol: 'SHOP',
            name: 'Shopify Inc.',
            exchange: 'NYSE',
            sector: 'Technology',
            industry: 'Software - Application',
            recommendation: 'hold',
            rating: 7.5,
            confidence: 75,
            targetPrice: 85.00,
            currentPrice: 72.40,
            upsidePotential: 17.4,
            riskLevel: 'medium',
            timeHorizon: 'long-term',
            weight: 10,
            reasons: ['电商市场增长', '平台生态扩展', '国际化进展'],
            riskFactors: ['宏观经济影响', '竞争加剧'],
            catalysts: ['新市场扩张', '产品功能增强']
          }
        ],
        performance: {
          totalReturn: 28.7,
          annualizedReturn: 35.2,
          sharpeRatio: 1.15,
          maxDrawdown: -15.8,
          winRate: 68,
          averageProfit: 18.3,
          averageLoss: -7.1
        },
        strategy: {
          investmentStyle: 'growth',
          riskTolerance: 'aggressive',
          timeHorizon: 'medium-term',
          diversification: {
            maxPositionSize: 35,
            sectorLimit: 60,
            industryLimit: 40
          },
          rebalancing: {
            frequency: 'weekly',
            threshold: 7,
            lastRebalanced: new Date(),
            nextRebalance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        aiSettings: {
          modelVersion: 'v2.1',
          confidenceThreshold: 70,
          riskAdjustment: true,
          diversificationEnabled: true
        },
        metadata: {
          source: 'ai',
          algorithm: 'High-Growth Optimization',
          dataSources: ['Yahoo Finance', 'Company Reports', 'Market News'],
          lastGenerated: new Date(),
          nextUpdate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          updateFrequency: 'weekly'
        },
        isFavorite: true,
        isPublic: false,
        tags: ['high-growth', 'technology', 'aggressive'],
        categories: ['ai', 'portfolio']
      }
    ];
    
    for (const recommendationData of recommendations) {
      const recommendation = new Recommendation(recommendationData);
      await recommendation.save();
      console.log(`   ✅ 推荐 "${recommendationData.title}" 创建成功`);
    }
    
    console.log('🎉 仪表板数据初始化完成!');
    console.log(`   🔍 创建了 ${analyses.length} 个分析报告`);
    console.log(`   💡 创建了 ${recommendations.length} 个投资推荐`);
    
  } catch (error) {
    console.error('❌ 初始化仪表板数据失败:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log('🔚 数据库连接已关闭');
  }
}

// 执行初始化
if (require.main === module) {
  initDashboardData()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('未处理的错误:', error);
      process.exit(1);
    });
}

module.exports = { initDashboardData };