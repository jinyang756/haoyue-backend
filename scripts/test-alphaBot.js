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
  await testAlphaBot();
  mongoose.connection.close();
});

async function testAlphaBot() {
  try {
    console.log('开始测试AlphaBot功能...');
    
    // 测试选股功能
    console.log('\\n=== 测试AlphaBot选股 ===');
    const selectedStocks = await alphaBotService.selectStocks({
      minRating: 7.0,
      minConfidence: 70,
      maxRiskLevel: 'medium'
    });
    
    console.log(`选出 ${selectedStocks.length} 只股票:`);
    selectedStocks.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. ${item.stock.symbol} - ${item.stock.name}`);
      console.log(`   评级: ${item.analysis.result.overallRating}`);
      console.log(`   建议: ${item.analysis.result.recommendation}`);
      console.log(`   置信度: ${item.analysis.result.confidenceLevel}%`);
    });
    
    // 测试诊股功能（以第一只选中的股票为例）
    if (selectedStocks.length > 0) {
      const testStock = selectedStocks[0].stock.symbol;
      console.log(`\\n=== 测试AlphaBot诊股 (${testStock}) ===`);
      const diagnosis = await alphaBotService.diagnoseStock(testStock);
      
      console.log(`股票: ${diagnosis.stock.name} (${diagnosis.stock.symbol})`);
      console.log(`当前价格: ${diagnosis.stock.price}`);
      console.log(`综合评级: ${diagnosis.analysis.overallRating}`);
      console.log(`投资建议: ${diagnosis.analysis.recommendation}`);
      console.log(`置信度: ${diagnosis.analysis.confidenceLevel}%`);
      console.log(`风险等级: ${diagnosis.analysis.riskLevel}`);
      console.log(`目标价格: ${diagnosis.analysis.targetPrice}`);
      console.log(`止损价格: ${diagnosis.analysis.stopLossPrice}`);
      console.log(`上涨潜力: ${diagnosis.analysis.upsidePotential}%`);
      console.log(`下跌风险: ${diagnosis.analysis.downsideRisk}%`);
      
      console.log('\\nAlphaBot诊断:');
      console.log(`摘要: ${diagnosis.alphaBotDiagnosis.summary}`);
      console.log(`优势: ${diagnosis.alphaBotDiagnosis.strengths.join(', ')}`);
      console.log(`劣势: ${diagnosis.alphaBotDiagnosis.weaknesses.join(', ')}`);
      console.log(`投资建议: ${diagnosis.alphaBotDiagnosis.investmentAdvice.join('; ')}`);
      console.log(`风险提示: ${diagnosis.alphaBotDiagnosis.riskWarnings.join('; ')}`);
    }
    
    console.log('\\nAlphaBot测试完成');
  } catch (error) {
    console.error('AlphaBot测试出错:', error);
  }
}