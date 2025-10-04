const alphaBotService = require('../services/alphaBot.service');

// 连接数据库
require('dotenv').config();
const mongoose = require('mongoose');
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/haoyue';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB连接错误:'));
db.once('open', async () => {
  console.log('MongoDB连接成功');
  await testAlphaBotDiagnose();
  mongoose.connection.close();
});

async function testAlphaBotDiagnose() {
  try {
    console.log('开始测试AlphaBot诊股功能...');
    
    // 使用已有的股票代码进行测试
    const testStockSymbol = '000001.SZ'; // 平安银行
    
    console.log(`\\n=== 测试AlphaBot诊股 (${testStockSymbol}) ===`);
    const diagnosis = await alphaBotService.diagnoseStock(testStockSymbol);
    
    console.log(`股票: ${diagnosis.stock.name} (${diagnosis.stock.symbol})`);
    console.log(`当前价格: ${diagnosis.stock.price}`);
    console.log(`综合评级: ${diagnosis.analysis.overallRating}`);
    console.log(`投资建议: ${diagnosis.analysis.recommendation}`);
    console.log(`置信度: ${diagnosis.analysis.confidenceLevel}%`);
    console.log(`风险等级: ${diagnosis.analysis.riskLevel}`);
    
    if (diagnosis.analysis.targetPrice) {
      console.log(`目标价格: ${diagnosis.analysis.targetPrice}`);
      console.log(`止损价格: ${diagnosis.analysis.stopLossPrice}`);
      console.log(`上涨潜力: ${diagnosis.analysis.upsidePotential}%`);
      console.log(`下跌风险: ${diagnosis.analysis.downsideRisk}%`);
    }
    
    console.log('\\nAlphaBot诊断:');
    console.log(`摘要: ${diagnosis.alphaBotDiagnosis.summary}`);
    console.log(`优势: ${diagnosis.alphaBotDiagnosis.strengths.join(', ')}`);
    console.log(`劣势: ${diagnosis.alphaBotDiagnosis.weaknesses.join(', ')}`);
    console.log(`投资建议: ${diagnosis.alphaBotDiagnosis.investmentAdvice.join('; ')}`);
    console.log(`风险提示: ${diagnosis.alphaBotDiagnosis.riskWarnings.join('; ')}`);
    
    console.log('\\nAlphaBot诊股测试完成');
  } catch (error) {
    console.error('AlphaBot诊股测试出错:', error);
  }
}