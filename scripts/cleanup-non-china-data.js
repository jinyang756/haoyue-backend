#!/usr/bin/env node

/**
 * 清理非A股数据脚本
 * 删除数据库中与A股无关的数据，只保留A股相关数据
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
 * 清理非A股数据
 */
async function cleanupNonChinaData() {
  try {
    logger.info('开始清理非A股数据...');
    
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
    
    // 1. 清理非A股股票数据
    logger.info('清理非A股股票数据...');
    const nonChinaStocks = await Stock.find({
      $and: [
        { symbol: { $not: /\.SH$/ } },
        { symbol: { $not: /\.SZ$/ } }
      ]
    });
    
    if (nonChinaStocks.length > 0) {
      const nonChinaStockIds = nonChinaStocks.map(stock => stock._id);
      const deletedStockCount = await Stock.deleteMany({
        _id: { $in: nonChinaStockIds }
      });
      logger.info(`删除了 ${deletedStockCount.deletedCount} 只非A股股票`);
    } else {
      logger.info('没有发现非A股股票数据');
    }
    
    // 2. 清理与非A股相关的分析报告
    logger.info('清理与非A股相关的分析报告...');
    const nonChinaAnalyses = await Analysis.find({
      $and: [
        { stockSymbol: { $not: /\.SH$/ } },
        { stockSymbol: { $not: /\.SZ$/ } }
      ]
    });
    
    if (nonChinaAnalyses.length > 0) {
      const nonChinaAnalysisIds = nonChinaAnalyses.map(analysis => analysis._id);
      const deletedAnalysisCount = await Analysis.deleteMany({
        _id: { $in: nonChinaAnalysisIds }
      });
      logger.info(`删除了 ${deletedAnalysisCount.deletedCount} 份非A股分析报告`);
    } else {
      logger.info('没有发现与非A股相关的分析报告');
    }
    
    // 3. 清理与非A股相关的推荐
    logger.info('清理包含非A股的推荐组合...');
    // 先找出包含非A股的推荐
    const recommendationsWithNonChinaStocks = await Recommendation.find({
      'stocks.symbol': {
        $not: { $regex: /\.SH$|\.SZ$/ }
      }
    });
    
    // 删除这些推荐
    if (recommendationsWithNonChinaStocks.length > 0) {
      const recommendationIds = recommendationsWithNonChinaStocks.map(rec => rec._id);
      const deletedRecommendationCount = await Recommendation.deleteMany({
        _id: { $in: recommendationIds }
      });
      logger.info(`删除了 ${deletedRecommendationCount.deletedCount} 个包含非A股的推荐组合`);
    }
    
    // 4. 清理只包含A股的推荐中非A股部分
    logger.info('清理A股推荐中的非A股成分...');
    const chinaRecommendations = await Recommendation.find({
      'stocks.symbol': { $regex: /\.SH$|\.SZ$/ }
    });
    
    for (const recommendation of chinaRecommendations) {
      const originalStockCount = recommendation.stocks.length;
      recommendation.stocks = recommendation.stocks.filter(stock => 
        stock.symbol.endsWith('.SH') || stock.symbol.endsWith('.SZ')
      );
      
      if (recommendation.stocks.length < originalStockCount) {
        await recommendation.save();
        logger.info(`从推荐 "${recommendation.title}" 中移除了 ${originalStockCount - recommendation.stocks.length} 只非A股`);
      }
    }
    
    // 5. 如果没有A股相关数据了，可以考虑删除空的推荐
    const remainingChinaRecommendations = await Recommendation.find({
      'stocks.symbol': { $regex: /\.SH$|\.SZ$/ }
    });
    
    if (remainingChinaRecommendations.length === 0) {
      const deletedEmptyRecommendations = await Recommendation.deleteMany({});
      logger.info(`删除了 ${deletedEmptyRecommendations.deletedCount} 个空推荐组合`);
    }
    
    logger.info('非A股数据清理完成!');
    
    // 显示清理后的统计信息
    const stockCount = await Stock.countDocuments();
    const analysisCount = await Analysis.countDocuments();
    const recommendationCount = await Recommendation.countDocuments();
    const userCount = await User.countDocuments();
    const contentCount = await Content.countDocuments();
    const subscriptionCount = await Subscription.countDocuments();
    
    logger.info('清理后数据库统计:');
    logger.info(`  股票: ${stockCount} 只`);
    logger.info(`  分析报告: ${analysisCount} 份`);
    logger.info(`  投资推荐: ${recommendationCount} 个`);
    logger.info(`  用户: ${userCount} 个`);
    logger.info(`  内容: ${contentCount} 篇`);
    logger.info(`  订阅: ${subscriptionCount} 个`);
    
    // 断开数据库连接
    await mongoose.connection.close();
    logger.info('数据库连接已关闭');
    
    process.exit(0);
  } catch (error) {
    logger.error('清理非A股数据过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  cleanupNonChinaData();
}

module.exports = {
  cleanupNonChinaData
};