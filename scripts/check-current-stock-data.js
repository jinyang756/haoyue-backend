const mongoose = require('mongoose');
const Stock = require('../models/Stock');
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
  await checkCurrentStockData();
  mongoose.connection.close();
});

async function checkCurrentStockData() {
  try {
    // 获取所有股票
    const allStocks = await Stock.find({});
    console.log(`数据库中共有 ${allStocks.length} 只股票`);
    
    // 按交易所分组统计
    const exchangeStats = {};
    const sectorStats = {};
    const industryStats = {};
    
    allStocks.forEach(stock => {
      // 交易所统计
      exchangeStats[stock.exchange] = (exchangeStats[stock.exchange] || 0) + 1;
      
      // 行业统计
      sectorStats[stock.sector] = (sectorStats[stock.sector] || 0) + 1;
      
      // 子行业统计
      industryStats[stock.industry] = (industryStats[stock.industry] || 0) + 1;
    });
    
    console.log('\n=== 交易所分布 ===');
    Object.entries(exchangeStats).forEach(([exchange, count]) => {
      console.log(`${exchange}: ${count} 只`);
    });
    
    console.log('\n=== 行业分布 ===');
    Object.entries(sectorStats).forEach(([sector, count]) => {
      console.log(`${sector}: ${count} 只`);
    });
    
    console.log('\n=== 子行业分布 ===');
    Object.entries(industryStats).forEach(([industry, count]) => {
      console.log(`${industry}: ${count} 只`);
    });
    
    // 显示所有股票代码
    console.log('\n=== 所有股票代码 ===');
    allStocks.forEach(stock => {
      console.log(`${stock.symbol} - ${stock.name} (${stock.exchange})`);
    });
    
  } catch (error) {
    console.error('检查股票数据时出错:', error);
  }
}