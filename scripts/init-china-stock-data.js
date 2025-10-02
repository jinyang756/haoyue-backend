#!/usr/bin/env node

/**
 * A股股票数据初始化脚本
 * 专门用于生成中国A股市场股票数据
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Stock = require('../models/Stock');
const { connectDB, isMongoDBConnected } = require('../config/db');
const { logger } = require('../utils/logger');

// 加载环境变量
dotenv.config();

// A股主要股票列表
const CHINA_STOCKS = [
  { 
    symbol: '000001.SZ', 
    name: '平安银行', 
    exchange: 'SZSE',
    sector: '金融',
    industry: '银行'
  },
  { 
    symbol: '000002.SZ', 
    name: '万科A', 
    exchange: 'SZSE',
    sector: '房地产',
    industry: '房地产开发'
  },
  { 
    symbol: '000333.SZ', 
    name: '美的集团', 
    exchange: 'SZSE',
    sector: '家用电器',
    industry: '白色家电'
  },
  { 
    symbol: '000651.SZ', 
    name: '格力电器', 
    exchange: 'SZSE',
    sector: '家用电器',
    industry: '白色家电'
  },
  { 
    symbol: '000858.SZ', 
    name: '五粮液', 
    exchange: 'SZSE',
    sector: '食品饮料',
    industry: '白酒'
  },
  { 
    symbol: '002594.SZ', 
    name: '比亚迪', 
    exchange: 'SZSE',
    sector: '汽车',
    industry: '汽车整车'
  },
  { 
    symbol: '600036.SH', 
    name: '招商银行', 
    exchange: 'SHSE',
    sector: '金融',
    industry: '银行'
  },
  { 
    symbol: '600519.SH', 
    name: '贵州茅台', 
    exchange: 'SHSE',
    sector: '食品饮料',
    industry: '白酒'
  },
  { 
    symbol: '601318.SH', 
    name: '中国平安', 
    exchange: 'SHSE',
    sector: '金融',
    industry: '保险'
  },
  { 
    symbol: '601888.SH', 
    name: '中国中免', 
    exchange: 'SHSE',
    sector: '商业贸易',
    industry: '贸易'
  },
  { 
    symbol: '603259.SH', 
    name: '药明康德', 
    exchange: 'SHSE',
    sector: '医药生物',
    industry: '医疗服务'
  },
  { 
    symbol: '603501.SH', 
    name: '韦尔股份', 
    exchange: 'SHSE',
    sector: '电子',
    industry: '半导体'
  },
  { 
    symbol: '688981.SH', 
    name: '中芯国际', 
    exchange: 'SHSE',
    sector: '电子',
    industry: '半导体'
  },
  { 
    symbol: '300015.SZ', 
    name: '爱尔眼科', 
    exchange: 'SZSE',
    sector: '医药生物',
    industry: '医疗服务'
  },
  { 
    symbol: '300750.SZ', 
    name: '宁德时代', 
    exchange: 'SZSE',
    sector: '电气设备',
    industry: '电源设备'
  },
  { 
    symbol: '300760.SZ', 
    name: '迈瑞医疗', 
    exchange: 'SZSE',
    sector: '医药生物',
    industry: '医疗器械'
  }
];

/**
 * 生成A股模拟股票数据
 * @param {Object} template - 股票模板
 * @returns {Object} 股票数据
 */
function generateChinaStockData(template) {
  // 生成随机价格数据（人民币）
  const basePrice = Math.random() * 1000 + 10; // 10-1010元的基础价格
  const changePercent = (Math.random() - 0.5) * 0.1; // -5% 到 +5% 的波动
  const change = basePrice * changePercent;
  
  // 生成历史数据（最近30个交易日）
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
    const volume = Math.floor(Math.random() * 100000000) + 10000000; // 1000万到1亿的成交量
    
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
    description: `${template.name} (${template.symbol}) 是一只在深圳证券交易所或上海证券交易所上市的A股股票。`,
    website: `http://www.${template.symbol.split('.')[0]}.com.cn`,
    country: '中国',
    isActive: true,
    latestPrice: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat((changePercent * 100).toFixed(2)),
    latestUpdate: new Date(),
    marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000, // 100亿到1万亿市值
    peRatio: parseFloat((Math.random() * 50 + 5).toFixed(2)), // 5-55的市盈率
    eps: parseFloat((Math.random() * 10).toFixed(2)), // 0-10的每股收益
    dividendYield: parseFloat((Math.random() * 3).toFixed(2)), // 0-3%的股息率
    beta: parseFloat((Math.random() * 2).toFixed(2)), // 0-2的贝塔值
    historicalData: historicalData
  };
}

/**
 * 初始化A股股票数据
 */
async function initChinaStockData() {
  try {
    logger.info('开始初始化A股股票数据...');
    
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
    
    // 为每个A股股票生成数据
    for (const template of CHINA_STOCKS) {
      try {
        if (dbConnected) {
          // 数据库模式：保存到MongoDB
          let stock = await Stock.findOne({ symbol: template.symbol });
          
          if (!stock) {
            const stockData = generateChinaStockData(template);
            stock = new Stock(stockData);
            await stock.save();
            logger.info(`创建A股股票数据: ${template.symbol} - ${template.name}`);
          } else {
            logger.info(`A股股票数据已存在: ${template.symbol} - ${template.name}`);
          }
        } else {
          // 模拟数据模式：只打印数据
          const stockData = generateChinaStockData(template);
          logger.info(`生成A股模拟股票数据: ${template.symbol} - ${template.name}`, {
            price: stockData.latestPrice,
            change: stockData.change,
            changePercent: stockData.changePercent
          });
        }
      } catch (error) {
        logger.error(`处理A股股票数据失败 ${template.symbol}:`, error.message);
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
      logger.info('A股模拟数据生成完成');
    }
    
    process.exit(0);
  } catch (error) {
    logger.error('初始化A股股票数据过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  initChinaStockData();
}

module.exports = {
  initChinaStockData,
  generateChinaStockData
};