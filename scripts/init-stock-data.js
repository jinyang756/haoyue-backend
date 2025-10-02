#!/usr/bin/env node

/**
 * 股票数据初始化脚本
 * 用于初始化股票数据，支持真实数据和模拟数据两种模式
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Stock = require('../models/Stock');
const { connectDB, isMongoDBConnected } = require('../config/db');
const { logger } = require('../utils/logger');

// 加载环境变量
dotenv.config();

// 股票数据模板
const STOCK_TEMPLATES = [
  { 
    symbol: 'AAPL', 
    name: '苹果公司', 
    exchange: 'NASDAQ',
    sector: '科技',
    industry: '消费电子'
  },
  { 
    symbol: 'MSFT', 
    name: '微软公司', 
    exchange: 'NASDAQ',
    sector: '科技',
    industry: '软件服务'
  },
  { 
    symbol: 'GOOGL', 
    name: '谷歌', 
    exchange: 'NASDAQ',
    sector: '科技',
    industry: '互联网服务'
  },
  { 
    symbol: 'AMZN', 
    name: '亚马逊', 
    exchange: 'NASDAQ',
    sector: '消费',
    industry: '电子商务'
  },
  { 
    symbol: 'TSLA', 
    name: '特斯拉', 
    exchange: 'NASDAQ',
    sector: '汽车',
    industry: '汽车制造'
  },
  { 
    symbol: 'META', 
    name: 'Meta平台', 
    exchange: 'NASDAQ',
    sector: '科技',
    industry: '社交媒体'
  },
  { 
    symbol: 'NVDA', 
    name: '英伟达', 
    exchange: 'NASDAQ',
    sector: '科技',
    industry: '半导体'
  },
  { 
    symbol: 'NFLX', 
    name: '网飞', 
    exchange: 'NASDAQ',
    sector: '娱乐',
    industry: '流媒体'
  },
  { 
    symbol: 'JPM', 
    name: '摩根大通', 
    exchange: 'NYSE',
    sector: '金融',
    industry: '银行'
  },
  { 
    symbol: 'JNJ', 
    name: '强生公司', 
    exchange: 'NYSE',
    sector: '医疗',
    industry: '制药'
  }
];

/**
 * 生成模拟股票数据
 * @param {Object} template - 股票模板
 * @returns {Object} 股票数据
 */
function generateMockStockData(template) {
  // 生成随机价格数据
  const basePrice = Math.random() * 300 + 50; // 50-350美元的基础价格
  const changePercent = (Math.random() - 0.5) * 0.1; // -5% 到 +5% 的波动
  const change = basePrice * changePercent;
  
  // 生成历史数据
  const historicalData = [];
  let currentPrice = basePrice * (1 - changePercent * 5); // 5天前的价格
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 模拟价格波动
    const dayChangePercent = (Math.random() - 0.5) * 0.05; // -2.5% 到 +2.5% 的波动
    const open = currentPrice;
    const close = open * (1 + dayChangePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 10000000) + 1000000; // 100万到1000万的成交量
    
    historicalData.push({
      date: date,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume,
      adjustedClose: parseFloat(close.toFixed(2))
    });
    
    currentPrice = close;
  }
  
  return {
    symbol: template.symbol,
    name: template.name,
    exchange: template.exchange,
    sector: template.sector,
    industry: template.industry,
    description: `${template.name} (${template.symbol}) 是一家在${template.exchange}交易所上市的领先企业。`,
    website: `https://www.${template.symbol.toLowerCase()}.com`,
    isActive: true,
    latestPrice: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat((changePercent * 100).toFixed(2)),
    latestUpdate: new Date(),
    marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000, // 100亿到1万亿市值
    peRatio: parseFloat((Math.random() * 50 + 10).toFixed(2)), // 10-60的市盈率
    eps: parseFloat((Math.random() * 20).toFixed(2)), // 0-20的每股收益
    dividendYield: parseFloat((Math.random() * 5).toFixed(2)), // 0-5%的股息率
    beta: parseFloat((Math.random() * 2).toFixed(2)), // 0-2的贝塔值
    historicalData: historicalData
  };
}

/**
 * 初始化股票数据
 */
async function initStockData() {
  try {
    logger.info('开始初始化股票数据...');
    
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
    
    // 为每个股票模板生成数据
    for (const template of STOCK_TEMPLATES) {
      try {
        if (dbConnected) {
          // 数据库模式：保存到MongoDB
          let stock = await Stock.findOne({ symbol: template.symbol });
          
          if (!stock) {
            const stockData = generateMockStockData(template);
            stock = new Stock(stockData);
            await stock.save();
            logger.info(`创建股票数据: ${template.symbol} - ${template.name}`);
          } else {
            logger.info(`股票数据已存在: ${template.symbol} - ${template.name}`);
          }
        } else {
          // 模拟数据模式：只打印数据
          const stockData = generateMockStockData(template);
          logger.info(`生成模拟股票数据: ${template.symbol} - ${template.name}`, {
            price: stockData.latestPrice,
            change: stockData.change,
            changePercent: stockData.changePercent
          });
        }
      } catch (error) {
        logger.error(`处理股票数据失败 ${template.symbol}:`, error.message);
      }
    }
    
    if (dbConnected) {
      // 验证数据
      const stockCount = await Stock.countDocuments();
      logger.info(`数据库中共有 ${stockCount} 只股票`);
      
      // 断开数据库连接
      await mongoose.connection.close();
      logger.info('数据库连接已关闭');
    } else {
      logger.info('模拟数据生成完成');
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('初始化股票数据过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  initStockData();
}

module.exports = {
  initStockData,
  generateMockStockData
};