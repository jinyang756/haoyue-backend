#!/usr/bin/env node

/**
 * A股股票数据补充脚本
 * 用于添加更多中国A股市场股票数据，丰富数据源
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Stock = require('../models/Stock');
const { connectDB, isMongoDBConnected } = require('../config/db');
const { logger } = require('../utils/logger');

// 加载环境变量
dotenv.config();

// 补充的A股主要股票列表
const ADDITIONAL_CHINA_STOCKS = [
  // 金融行业
  { 
    symbol: '600030.SH', 
    name: '中信证券', 
    exchange: 'SHSE',
    sector: '金融',
    industry: '证券'
  },
  { 
    symbol: '601398.SH', 
    name: '工商银行', 
    exchange: 'SHSE',
    sector: '金融',
    industry: '银行'
  },
  { 
    symbol: '601601.SH', 
    name: '中国太保', 
    exchange: 'SHSE',
    sector: '金融',
    industry: '保险'
  },
  
  // 科技行业
  { 
    symbol: '000063.SZ', 
    name: '中兴通讯', 
    exchange: 'SZSE',
    sector: '电子',
    industry: '通信设备'
  },
  { 
    symbol: '300033.SZ', 
    name: '同花顺', 
    exchange: 'SZSE',
    sector: '计算机',
    industry: '软件开发'
  },
  { 
    symbol: '600570.SH', 
    name: '恒生电子', 
    exchange: 'SHSE',
    sector: '计算机',
    industry: '软件服务'
  },
  
  // 消费行业
  { 
    symbol: '600887.SH', 
    name: '伊利股份', 
    exchange: 'SHSE',
    sector: '食品饮料',
    industry: '乳制品'
  },
  { 
    symbol: '000895.SZ', 
    name: '双汇发展', 
    exchange: 'SZSE',
    sector: '食品饮料',
    industry: '食品加工'
  },
  { 
    symbol: '600332.SH', 
    name: '白云山', 
    exchange: 'SHSE',
    sector: '医药生物',
    industry: '中药'
  },
  
  // 新能源行业
  { 
    symbol: '002460.SZ', 
    name: '赣锋锂业', 
    exchange: 'SZSE',
    sector: '有色金属',
    industry: '稀有金属'
  },
  { 
    symbol: '300014.SZ', 
    name: '亿纬锂能', 
    exchange: 'SZSE',
    sector: '电气设备',
    industry: '电池'
  },
  { 
    symbol: '601012.SH', 
    name: '隆基绿能', 
    exchange: 'SHSE',
    sector: '电气设备',
    industry: '光伏设备'
  },
  
  // 汽车行业
  { 
    symbol: '600104.SH', 
    name: '上汽集团', 
    exchange: 'SHSE',
    sector: '汽车',
    industry: '汽车整车'
  },
  { 
    symbol: '000625.SZ', 
    name: '长安汽车', 
    exchange: 'SZSE',
    sector: '汽车',
    industry: '汽车整车'
  },
  
  // 基建行业
  { 
    symbol: '601800.SH', 
    name: '中国交建', 
    exchange: 'SHSE',
    sector: '建筑装饰',
    industry: '基础建设'
  },
  { 
    symbol: '601186.SH', 
    name: '中国铁建', 
    exchange: 'SHSE',
    sector: '建筑装饰',
    industry: '基础建设'
  },
  
  // 能源行业
  { 
    symbol: '600028.SH', 
    name: '中国石化', 
    exchange: 'SHSE',
    sector: '采掘',
    industry: '石油开采'
  },
  { 
    symbol: '600900.SH', 
    name: '长江电力', 
    exchange: 'SHSE',
    sector: '公用事业',
    industry: '电力'
  },
  
  // 传媒行业
  { 
    symbol: '600088.SH', 
    name: '中视传媒', 
    exchange: 'SHSE',
    sector: '传媒',
    industry: '电视广播'
  },
  { 
    symbol: '300059.SZ', 
    name: '东方财富', 
    exchange: 'SZSE',
    sector: '传媒',
    industry: '互联网传媒'
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
    description: `${template.name} (${template.symbol}) 是一只在深圳证券交易所或上海证券交易所上市的A股股票，属于${template.sector}行业中的${template.industry}子行业。`,
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
 * 补充A股股票数据
 */
async function supplementChinaStockData() {
  try {
    // 连接数据库
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/haoyue';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB连接成功');
    
    // 检查每只股票是否已存在，如果不存在则创建
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const stockTemplate of ADDITIONAL_CHINA_STOCKS) {
      try {
        // 检查股票是否已存在
        const existingStock = await Stock.findOne({ symbol: stockTemplate.symbol });
        
        if (existingStock) {
          console.log(`股票 ${stockTemplate.symbol} 已存在，跳过`);
          skippedCount++;
        } else {
          // 生成股票数据
          const stockData = generateChinaStockData(stockTemplate);
          
          // 创建股票记录
          const stock = new Stock(stockData);
          await stock.save();
          
          console.log(`✓ 成功创建股票: ${stock.symbol} - ${stock.name}`);
          createdCount++;
        }
      } catch (error) {
        console.error(`✗ 创建股票 ${stockTemplate.symbol} 时出错:`, error.message);
      }
    }
    
    console.log(`\n数据补充完成:`);
    console.log(`- 新增股票: ${createdCount} 只`);
    console.log(`- 跳过股票: ${skippedCount} 只`);
    console.log(`- 总计股票: ${ADDITIONAL_CHINA_STOCKS.length} 只`);
    
    // 断开数据库连接
    await mongoose.connection.close();
    console.log('MongoDB连接已关闭');
    
  } catch (error) {
    console.error('补充A股股票数据时出错:', error);
    process.exit(1);
  }
}

// 执行数据补充
if (require.main === module) {
  supplementChinaStockData();
}

module.exports = {
  ADDITIONAL_CHINA_STOCKS,
  generateChinaStockData,
  supplementChinaStockData
};