const mongoose = require('mongoose');
const Stock = require('../models/Stock');
const Analysis = require('../models/Analysis');
require('dotenv').config();

// 连接数据库
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/haoyue';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB连接错误:'));
db.once('open', async () => {
  console.log('MongoDB连接成功');
  await generateVariousAnalysisTypes();
  mongoose.connection.close();
});

async function generateVariousAnalysisTypes() {
  try {
    // 获取所有A股股票
    const allStocks = await Stock.find({
      symbol: { $regex: /^\d{6}\.(SZ|SH)$/ }
    });
    
    console.log(`数据库中共有 ${allStocks.length} 只A股股票`);
    
    // 为每只股票生成不同类型的分析报告
    const analysisTypes = ['fundamental', 'technical', 'sentiment'];
    let createdCount = 0;
    
    for (const stock of allStocks) {
      try {
        // 为每种分析类型生成报告（如果还不存在）
        for (const type of analysisTypes) {
          const existingAnalysis = await Analysis.findOne({
            stockSymbol: stock.symbol,
            analysisType: type
          });
          
          if (!existingAnalysis) {
            console.log(`正在为 ${stock.symbol} (${stock.name}) 生成${type}分析报告...`);
            
            // 生成分析报告
            const analysisData = {
              userId: '68e05a5eb2d891faa6ab9cd8', // 管理员用户
              stockSymbol: stock.symbol,
              stockName: stock.name,
              analysisType: type,
              timeRange: '1y',
              priority: 'medium',
              status: 'completed',
              progress: 100,
              completedAt: new Date(),
              result: {
                overallRating: parseFloat((Math.random() * 6 + 4).toFixed(1)), // 4-10分
                recommendation: getRandomRecommendation(),
                confidenceLevel: Math.floor(Math.random() * 40 + 60), // 60-100%
                riskLevel: getRandomRiskLevel(),
                targetPrice: parseFloat((stock.latestPrice * (1 + (Math.random() * 0.3 - 0.1))).toFixed(2)),
                stopLossPrice: parseFloat((stock.latestPrice * (0.85 + Math.random() * 0.1)).toFixed(2)),
                upsidePotential: Math.round(Math.random() * 30 + 10), // 10-40%
                downsideRisk: Math.round(Math.random() * 20 + 5) // 5-25%
              },
              factors: generateFactorsForType(type),
              technicalIndicators: type === 'technical' || type === 'comprehensive' ? generateTechnicalIndicators(stock) : {},
              fundamentalAnalysis: type === 'fundamental' || type === 'comprehensive' ? generateFundamentalAnalysis(stock) : {},
              sentimentAnalysis: type === 'sentiment' || type === 'comprehensive' ? generateSentimentAnalysis(stock) : {},
              marketAnalysis: type === 'comprehensive' ? generateMarketAnalysis(stock) : {},
              riskAnalysis: type === 'comprehensive' ? generateRiskAnalysis() : {},
              aiExplanation: generateAIExplanation(stock, type),
              executionTime: {
                startTime: new Date(Date.now() - 3600000), // 1小时前
                endTime: new Date(),
                duration: 3600000 // 1小时
              },
              cost: {
                creditsUsed: getTypeCost(type),
                costInUSD: getTypeCost(type) / 100
              },
              metadata: {
                modelVersion: 'v2.1',
                apiVersion: '1.0',
                dataSources: ['Wind', '公司公告', '市场新闻'],
                lastUpdated: new Date()
              },
              isFavorite: false
            };
            
            const analysis = new Analysis(analysisData);
            await analysis.save();
            console.log(`✓ 成功为 ${stock.symbol} 生成${type}分析报告`);
            createdCount++;
          }
        }
      } catch (error) {
        console.error(`✗ 为 ${stock.symbol} 生成分析报告时出错:`, error.message);
      }
    }
    
    console.log(`新分析报告生成完成，共创建 ${createdCount} 份报告`);
  } catch (error) {
    console.error('生成各种类型分析报告时出错:', error);
  }
}

/**
 * 随机生成推荐建议
 */
function getRandomRecommendation() {
  const recommendations = ['strong buy', 'buy', 'hold', 'sell', 'strong sell'];
  return recommendations[Math.floor(Math.random() * recommendations.length)];
}

/**
 * 随机生成风险等级
 */
function getRandomRiskLevel() {
  const riskLevels = ['very low', 'low', 'medium', 'high', 'very high'];
  return riskLevels[Math.floor(Math.random() * riskLevels.length)];
}

/**
 * 根据分析类型生成因子评分
 */
function generateFactorsForType(type) {
  const factors = {
    fundamentalScore: 0,
    technicalScore: 0,
    sentimentScore: 0,
    marketScore: 0,
    industryScore: 0
  };
  
  switch (type) {
    case 'fundamental':
      factors.fundamentalScore = Math.round(Math.random() * 30 + 60);
      break;
    case 'technical':
      factors.technicalScore = Math.round(Math.random() * 30 + 60);
      break;
    case 'sentiment':
      factors.sentimentScore = Math.round(Math.random() * 30 + 60);
      break;
    default:
      // 综合分析
      factors.fundamentalScore = Math.round(Math.random() * 30 + 60);
      factors.technicalScore = Math.round(Math.random() * 30 + 60);
      factors.sentimentScore = Math.round(Math.random() * 30 + 60);
      factors.marketScore = Math.round(Math.random() * 30 + 60);
      factors.industryScore = Math.round(Math.random() * 30 + 60);
  }
  
  return factors;
}

/**
 * 生成技术指标
 */
function generateTechnicalIndicators(stock) {
  return {
    movingAverages: {
      ma5: parseFloat((stock.latestPrice * (0.98 + Math.random() * 0.04)).toFixed(2)),
      ma10: parseFloat((stock.latestPrice * (0.97 + Math.random() * 0.06)).toFixed(2)),
      ma20: parseFloat((stock.latestPrice * (0.95 + Math.random() * 0.1)).toFixed(2)),
      ma60: parseFloat((stock.latestPrice * (0.9 + Math.random() * 0.2)).toFixed(2)),
      ma120: parseFloat((stock.latestPrice * (0.85 + Math.random() * 0.3)).toFixed(2)),
      ma250: parseFloat((stock.latestPrice * (0.8 + Math.random() * 0.4)).toFixed(2))
    },
    oscillators: {
      rsi: Math.round(Math.random() * 40 + 30),
      macd: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      signalLine: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      stochastic: Math.round(Math.random() * 40 + 30),
      williamsR: Math.round(Math.random() * -40 - 30)
    }
  };
}

/**
 * 生成基本面分析
 */
function generateFundamentalAnalysis(stock) {
  return {
    financialRatios: {
      peRatio: parseFloat((Math.random() * 20 + 5).toFixed(2)),
      pbRatio: parseFloat((Math.random() * 5 + 1).toFixed(2)),
      psRatio: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
      dividendYield: parseFloat((Math.random() * 5).toFixed(2)),
      roe: parseFloat((Math.random() * 20 + 5).toFixed(2)),
      debtEquityRatio: parseFloat((Math.random() * 2).toFixed(2))
    }
  };
}

/**
 * 生成情绪分析
 */
function generateSentimentAnalysis(stock) {
  return {
    newsSentiment: {
      score: parseFloat((Math.random() * 2 - 1).toFixed(2)),
      trend: Math.random() > 0.5 ? 'up' : 'down',
      articleCount: Math.round(Math.random() * 50 + 10)
    }
  };
}

/**
 * 生成市场分析
 */
function generateMarketAnalysis(stock) {
  return {
    marketTrend: Math.random() > 0.5 ? 'bullish' : 'bearish',
    sectorPerformance: parseFloat((Math.random() * 20 - 10).toFixed(2)),
    industryRank: Math.round(Math.random() * 20 + 1)
  };
}

/**
 * 生成风险分析
 */
function generateRiskAnalysis() {
  return {
    marketRisk: Math.round(Math.random() * 4 + 1),
    industryRisk: Math.round(Math.random() * 4 + 1),
    companySpecificRisk: Math.round(Math.random() * 4 + 1),
    totalRiskScore: Math.round(Math.random() * 4 + 1)
  };
}

/**
 * 根据分析类型生成AI解释
 */
function generateAIExplanation(stock, type) {
  const recommendations = ['strong buy', 'buy', 'hold', 'sell', 'strong sell'];
  const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];
  
  let reasoning = '';
  switch (type) {
    case 'fundamental':
      reasoning = `基于基本面分析，${stock.name}(${stock.symbol})的财务状况${Math.random() > 0.5 ? '良好' : '一般'}，建议${recommendation}。`;
      break;
    case 'technical':
      reasoning = `基于技术面分析，${stock.name}(${stock.symbol})的技术指标${Math.random() > 0.5 ? '显示买入信号' : '呈现中性态势'}，建议${recommendation}。`;
      break;
    case 'sentiment':
      reasoning = `基于市场情绪分析，${stock.name}(${stock.symbol})的新闻情绪${Math.random() > 0.5 ? '积极' : '平稳'}，建议${recommendation}。`;
      break;
    default:
      reasoning = `基于综合分析，${stock.name}(${stock.symbol})的整体表现${Math.random() > 0.5 ? '良好' : '一般'}，建议${recommendation}。`;
  }
  
  return {
    reasoning: reasoning,
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
  };
}

/**
 * 根据分析类型获取成本
 */
function getTypeCost(type) {
  switch (type) {
    case 'fundamental': return 12;
    case 'technical': return 10;
    case 'sentiment': return 8;
    default: return 15;
  }
}