#!/usr/bin/env node

/**
 * 检查数据完整性脚本
 * 检查A股数据是否完整，识别缺失的数据并提供补全建议
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Analysis = require('../models/Analysis');
const Recommendation = require('../models/Recommendation');
const Content = require('../models/Content');
const Subscription = require('../models/Subscription');
const { connectDB, isMongoDBConnected } = require('../config/db');
const { logger } = require('../utils/logger');

// 加载环境变量
dotenv.config();

/**
 * 检查数据完整性
 */
async function checkDataCompleteness() {
  try {
    logger.info('开始检查数据完整性...');
    
    // 尝试连接数据库
    let dbConnected = false;
    try {
      await connectDB();
      dbConnected = isMongoDBConnected();
      if (dbConnected) {
        logger.info('数据库连接成功');
      } else {
        logger.warn('数据库连接失败');
        process.exit(1);
      }
    } catch (error) {
      logger.error('数据库连接失败:', error.message);
      process.exit(1);
    }
    
    // 1. 检查A股股票数据
    logger.info('检查A股股票数据...');
    const chinaStocks = await Stock.find({
      $or: [
        { symbol: { $regex: /\.SH$/ } },
        { symbol: { $regex: /\.SZ$/ } }
      ]
    });
    
    logger.info(`A股股票数量: ${chinaStocks.length}`);
    if (chinaStocks.length > 0) {
      logger.info('前5只股票:');
      chinaStocks.slice(0, 5).forEach(stock => {
        logger.info(`  ${stock.symbol} - ${stock.name}`);
      });
    }
    
    // 2. 检查用户数据
    logger.info('检查用户数据...');
    const users = await User.find({});
    logger.info(`用户数量: ${users.length}`);
    if (users.length > 0) {
      users.forEach(user => {
        logger.info(`  ${user.username} (${user.role})`);
      });
    }
    
    // 3. 检查分析报告数据
    logger.info('检查分析报告数据...');
    const analyses = await Analysis.find({
      $or: [
        { stockSymbol: { $regex: /\.SH$/ } },
        { stockSymbol: { $regex: /\.SZ$/ } }
      ]
    });
    
    logger.info(`A股分析报告数量: ${analyses.length}`);
    if (analyses.length > 0) {
      logger.info('前5份分析报告:');
      analyses.slice(0, 5).forEach(analysis => {
        logger.info(`  ${analysis.stockSymbol} - ${analysis.stockName} (${analysis.analysisType})`);
      });
    }
    
    // 4. 检查推荐数据
    logger.info('检查推荐数据...');
    const recommendations = await Recommendation.find({});
    logger.info(`推荐组合数量: ${recommendations.length}`);
    if (recommendations.length > 0) {
      recommendations.forEach(recommendation => {
        logger.info(`  ${recommendation.title} (${recommendation.recommendationType})`);
        logger.info(`    包含 ${recommendation.stocks.length} 只股票`);
      });
    }
    
    // 5. 检查内容数据
    logger.info('检查内容数据...');
    const contents = await Content.find({});
    logger.info(`内容数量: ${contents.length}`);
    if (contents.length > 0) {
      contents.forEach(content => {
        logger.info(`  ${content.title} (${content.category})`);
      });
    }
    
    // 6. 检查订阅数据
    logger.info('检查订阅数据...');
    const subscriptions = await Subscription.find({});
    logger.info(`订阅数量: ${subscriptions.length}`);
    if (subscriptions.length > 0) {
      subscriptions.forEach(subscription => {
        const user = users.find(u => u._id.toString() === subscription.user.toString());
        logger.info(`  ${user ? user.username : '未知用户'} - ${subscription.plan} (${subscription.status})`);
      });
    }
    
    // 7. 识别缺失的数据
    logger.info('识别缺失的数据...');
    
    // 检查是否有股票缺少分析报告
    const stocksWithoutAnalysis = [];
    for (const stock of chinaStocks) {
      const hasAnalysis = analyses.some(analysis => analysis.stockSymbol === stock.symbol);
      if (!hasAnalysis) {
        stocksWithoutAnalysis.push(stock);
      }
    }
    
    if (stocksWithoutAnalysis.length > 0) {
      logger.warn(`发现 ${stocksWithoutAnalysis.length} 只股票缺少分析报告:`);
      stocksWithoutAnalysis.forEach(stock => {
        logger.warn(`  ${stock.symbol} - ${stock.name}`);
      });
    } else {
      logger.info('所有股票都有对应的分析报告');
    }
    
    // 检查推荐组合是否包含所有重要股票
    const importantStocks = [
      '000001.SZ', // 平安银行
      '600519.SH', // 贵州茅台
      '000333.SZ', // 美的集团
      '600036.SH', // 招商银行
      '300750.SZ'  // 宁德时代
    ];
    
    const missingFromRecommendations = [];
    for (const stockSymbol of importantStocks) {
      let foundInAnyRecommendation = false;
      for (const recommendation of recommendations) {
        if (recommendation.stocks.some(stock => stock.symbol === stockSymbol)) {
          foundInAnyRecommendation = true;
          break;
        }
      }
      if (!foundInAnyRecommendation) {
        missingFromRecommendations.push(stockSymbol);
      }
    }
    
    if (missingFromRecommendations.length > 0) {
      logger.warn(`以下重要股票未包含在任何推荐组合中:`);
      missingFromRecommendations.forEach(symbol => {
        const stock = chinaStocks.find(s => s.symbol === symbol);
        logger.warn(`  ${symbol} - ${stock ? stock.name : '未知股票'}`);
      });
    } else {
      logger.info('所有重要股票都已包含在推荐组合中');
    }
    
    logger.info('数据完整性检查完成!');
    
    // 断开数据库连接
    await mongoose.connection.close();
    logger.info('数据库连接已关闭');
    
    process.exit(0);
  } catch (error) {
    logger.error('检查数据完整性过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  checkDataCompleteness();
}

module.exports = {
  checkDataCompleteness
};