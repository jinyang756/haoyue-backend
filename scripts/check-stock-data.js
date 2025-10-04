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
  await checkStockData();
  mongoose.connection.close();
});

async function checkStockData() {
  try {
    // 获取所有股票
    const allStocks = await Stock.find({});
    console.log(`数据库中共有 ${allStocks.length} 只股票`);
    
    // 显示前10只股票的信息
    console.log('\n前10只股票信息:');
    allStocks.slice(0, 10).forEach((stock, index) => {
      console.log(`${index + 1}. ${stock.symbol} - ${stock.name} (价格: ${stock.latestPrice})`);
    });
    
    // 查找可能的A股股票
    const chinaStocks = await Stock.find({
      symbol: { $regex: /.*\\.(SZ|SH)$/ }
    });
    console.log(`\n匹配A股格式的股票数量: ${chinaStocks.length}`);
    
    // 查找以数字开头的股票
    const numericStocks = await Stock.find({
      symbol: { $regex: /^\\d+/ }
    });
    console.log(`以数字开头的股票数量: ${numericStocks.length}`);
    
    // 显示所有股票代码格式
    const symbols = allStocks.map(stock => stock.symbol);
    console.log('\n所有股票代码格式示例:');
    symbols.slice(0, 20).forEach(symbol => console.log(symbol));
    
  } catch (error) {
    console.error('检查股票数据时出错:', error);
  }
}