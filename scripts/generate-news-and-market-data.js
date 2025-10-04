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
  await generateNewsAndMarketData();
  mongoose.connection.close();
});

async function generateNewsAndMarketData() {
  try {
    // 获取所有A股股票
    const stocks = await Stock.find({
      symbol: { $regex: /^\d{6}\.(SZ|SH)$/ }
    });
    
    console.log(`数据库中共有 ${stocks.length} 只A股股票`);
    
    // 为每只股票更新新闻和市场数据
    for (const stock of stocks) {
      try {
        console.log(`正在为 ${stock.symbol} (${stock.name}) 更新新闻和市场数据...`);
        
        // 生成模拟新闻数据
        const news = [];
        const newsCount = Math.floor(Math.random() * 10) + 5; // 5-15条新闻
        
        for (let i = 0; i < newsCount; i++) {
          const date = new Date();
          date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // 最近30天内的新闻
          
          news.push({
            title: generateNewsTitle(stock.name, stock.industry),
            content: generateNewsContent(stock.name, stock.industry),
            source: getRandomNewsSource(),
            date: date,
            sentiment: getRandomSentiment(),
            relevance: Math.random()
          });
        }
        
        // 更新股票数据
        stock.news = news;
        stock.marketTrend = getRandomMarketTrend();
        stock.volume = Math.floor(Math.random() * 100000000) + 10000000; // 1000万到1亿的成交量
        stock.volumeAvg = Math.floor(Math.random() * 50000000) + 5000000; // 500万到5000万的平均成交量
        stock.volatility = parseFloat((Math.random() * 0.3).toFixed(4)); // 0-30%的波动率
        
        // 行业相关数据
        stock.industryGrowth = parseFloat((Math.random() * 0.2 - 0.1).toFixed(4)); // -10%到+10%的行业增长率
        stock.industryRank = Math.floor(Math.random() * 20) + 1; // 1-20的行业排名
        stock.marketShare = parseFloat((Math.random() * 0.5).toFixed(4)); // 0-50%的市场份额
        
        await stock.save();
        console.log(`✓ 成功为 ${stock.symbol} 更新新闻和市场数据`);
      } catch (error) {
        console.error(`✗ 为 ${stock.symbol} 更新新闻和市场数据时出错:`, error.message);
      }
    }
    
    console.log('新闻和市场数据更新完成');
  } catch (error) {
    console.error('生成新闻和市场数据时出错:', error);
  }
}

/**
 * 生成新闻标题
 */
function generateNewsTitle(stockName, industry) {
  const titles = [
    `${stockName}发布最新财报，业绩超预期`,
    `${stockName}在${industry}领域取得重大突破`,
    `${stockName}宣布重大投资计划`,
    `${stockName}与行业巨头达成战略合作`,
    `${stockName}新产品获得市场热烈反响`,
    `${stockName}荣获行业重要奖项`,
    `${stockName}股价创新高，分析师上调评级`,
    `${stockName}在技术创新方面领先同行`,
    `${stockName}扩大生产能力，满足市场需求`,
    `${stockName}在国际市场拓展取得进展`
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
}

/**
 * 生成新闻内容
 */
function generateNewsContent(stockName, industry) {
  const contents = [
    `${stockName}今日发布了最新季度财报，营收和利润均超出市场预期。公司表示，这主要得益于在${industry}领域的持续创新和市场拓展。`,
    `${stockName}宣布在${industry}技术方面取得重大突破，这一创新将为公司带来新的增长点，并有望引领行业发展方向。`,
    `${stockName}计划投资数十亿元用于扩大生产规模和技术研发，以满足不断增长的市场需求，并巩固在${industry}领域的领先地位。`,
    `${stockName}与国际知名企业达成战略合作协议，双方将在技术研发、市场拓展等方面展开深度合作，共同推动${industry}行业发展。`,
    `${stockName}推出的新产品在上市后获得市场热烈反响，订单量远超预期，显示出强大的市场竞争力。`,
    `${stockName}凭借卓越的表现和创新能力，荣获${industry}行业年度最佳企业奖，这是对公司实力的充分肯定。`,
    `${stockName}股价近期持续上涨，多家券商上调其投资评级，认为公司在${industry}领域具有广阔的发展前景。`,
    `${stockName}在技术创新方面持续投入，已获得多项技术专利，在${industry}领域保持技术领先优势。`,
    `${stockName}通过优化生产流程和扩大产能，有效提升了市场供应能力，能够更好地满足客户需求。`,
    `${stockName}积极拓展国际市场，已在多个国家和地区建立销售网络，国际化战略取得显著成效。`
  ];
  
  return contents[Math.floor(Math.random() * contents.length)];
}

/**
 * 随机生成新闻来源
 */
function getRandomNewsSource() {
  const sources = [
    '财经日报',
    '证券时报',
    '上海证券报',
    '中国证券报',
    '经济参考报',
    '第一财经',
    '财新网',
    '新浪财经',
    '腾讯财经',
    '网易财经'
  ];
  
  return sources[Math.floor(Math.random() * sources.length)];
}

/**
 * 随机生成情绪
 */
function getRandomSentiment() {
  const sentiments = ['positive', 'negative', 'neutral'];
  return sentiments[Math.floor(Math.random() * sentiments.length)];
}

/**
 * 随机生成市场趋势
 */
function getRandomMarketTrend() {
  const trends = ['bullish', 'bearish', 'neutral'];
  return trends[Math.floor(Math.random() * trends.length)];
}