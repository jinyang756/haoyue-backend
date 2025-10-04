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
  await updateAllStocksData();
  mongoose.connection.close();
});

async function updateAllStocksData() {
  try {
    // 获取所有A股股票
    const allStocks = await Stock.find({
      symbol: { $regex: /^\d{6}\.(SZ|SH)$/ }
    });
    
    console.log(`数据库中共有 ${allStocks.length} 只A股股票`);
    
    // 更新每只股票的数据
    for (const stock of allStocks) {
      try {
        console.log(`正在更新 ${stock.symbol} (${stock.name}) 的数据...`);
        
        // 生成新的价格数据
        const basePrice = Math.random() * 1000 + 10; // 10-1010元的基础价格
        const changePercent = (Math.random() - 0.5) * 0.1; // -5% 到 +5% 的波动
        const change = basePrice * changePercent;
        
        // 更新股票数据
        stock.latestPrice = parseFloat(basePrice.toFixed(2));
        stock.change = parseFloat(change.toFixed(2));
        stock.changePercent = parseFloat((changePercent * 100).toFixed(2));
        stock.latestUpdate = new Date();
        stock.marketCap = Math.floor(Math.random() * 1000000000000) + 10000000000; // 100亿到1万亿市值
        stock.peRatio = parseFloat((Math.random() * 50 + 5).toFixed(2)); // 5-55的市盈率
        stock.eps = parseFloat((Math.random() * 10).toFixed(2)); // 0-10的每股收益
        stock.dividendYield = parseFloat((Math.random() * 3).toFixed(2)); // 0-3%的股息率
        stock.beta = parseFloat((Math.random() * 2).toFixed(2)); // 0-2的贝塔值
        
        // 生成新的历史数据（最近30个交易日）
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
        
        stock.historicalData = historicalData;
        
        // 保存更新后的股票数据
        await stock.save();
        console.log(`✓ 成功更新 ${stock.symbol} 的数据`);
      } catch (error) {
        console.error(`✗ 更新 ${stock.symbol} 数据时出错:`, error.message);
      }
    }
    
    console.log('所有股票数据更新完成');
  } catch (error) {
    console.error('更新所有股票数据时出错:', error);
  }
}