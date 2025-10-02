#!/usr/bin/env node

/**
 * 股票数据生成脚本
 * 用于从免费API获取真实股票数据并保存到MongoDB
 */

const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const Stock = require('../models/Stock');
const { connectDB } = require('../config/db');
const { logger } = require('../utils/logger');

// 加载环境变量
dotenv.config();

// 常用美股股票列表
const STOCK_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', exchange: 'NASDAQ' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
  { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE' },
  { symbol: 'MA', name: 'Mastercard Incorporated', exchange: 'NYSE' },
  { symbol: 'DIS', name: 'The Walt Disney Company', exchange: 'NYSE' },
  { symbol: 'HD', name: 'The Home Depot Inc.', exchange: 'NYSE' }
];

/**
 * 从Alpha Vantage获取股票数据
 * @param {string} symbol - 股票代码
 * @returns {Promise<Object>} 股票数据
 */
async function getStockDataFromAlphaVantage(symbol) {
  try {
    // 注意：Alpha Vantage免费API有调用频率限制（5次/分钟，500次/天）
    const response = await axios.get(`https://www.alphavantage.co/query`, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: process.env.ALPHA_VANTAGE_API_KEY || 'YOUR_API_KEY_HERE'
      }
    });

    const data = response.data;
    if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
      throw new Error(`No data found for symbol: ${symbol}`);
    }

    return data['Global Quote'];
  } catch (error) {
    logger.error(`Error fetching data for ${symbol} from Alpha Vantage:`, error.message);
    throw error;
  }
}

/**
 * 生成模拟历史数据
 * @param {number} days - 天数
 * @param {number} basePrice - 基础价格
 * @returns {Array} 历史数据数组
 */
function generateHistoricalData(days, basePrice) {
  const data = [];
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // 模拟价格波动
    const changePercent = (Math.random() - 0.5) * 0.1; // -5% 到 +5% 的波动
    const open = currentPrice;
    const close = open * (1 + changePercent);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 10000000) + 1000000; // 100万到1000万的成交量
    
    data.push({
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
  
  return data;
}

/**
 * 生成模拟技术指标
 * @returns {Object} 技术指标对象
 */
function generateTechnicalIndicators() {
  return {
    rsi: Math.floor(Math.random() * 100),
    macd: (Math.random() * 10 - 5).toFixed(2),
    bollingerBands: {
      upper: (Math.random() * 200 + 100).toFixed(2),
      middle: (Math.random() * 200 + 50).toFixed(2),
      lower: (Math.random() * 100).toFixed(2)
    },
    movingAverages: {
      ma5: (Math.random() * 200 + 50).toFixed(2),
      ma10: (Math.random() * 200 + 50).toFixed(2),
      ma20: (Math.random() * 200 + 50).toFixed(2),
      ma60: (Math.random() * 200 + 50).toFixed(2),
      ma120: (Math.random() * 200 + 50).toFixed(2),
      ma250: (Math.random() * 200 + 50).toFixed(2)
    }
  };
}

/**
 * 生成模拟AI评级
 * @returns {Array} AI评级数组
 */
function generateAiRatings() {
  const ratings = [];
  const count = Math.floor(Math.random() * 5) + 1; // 1-5个评级
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i * 7); // 每周一个评级
    
    ratings.push({
      date: date,
      rating: Math.floor(Math.random() * 10) + 1, // 1-10分
      recommendation: ['strong sell', 'sell', 'hold', 'buy', 'strong buy'][Math.floor(Math.random() * 5)],
      confidence: Math.floor(Math.random() * 100), // 0-100的置信度
      factors: {
        fundamental: Math.floor(Math.random() * 100),
        technical: Math.floor(Math.random() * 100),
        market: Math.floor(Math.random() * 100),
        sentiment: Math.floor(Math.random() * 100)
      },
      analysis: `这是AI生成的分析报告，包含对${STOCK_SYMBOLS[Math.floor(Math.random() * STOCK_SYMBOLS.length)].symbol}股票的综合评估。`
    });
  }
  
  return ratings;
}

/**
 * 生成模拟新闻
 * @returns {Array} 新闻数组
 */
function generateNews(symbol) {
  const news = [];
  const count = Math.floor(Math.random() * 10) + 5; // 5-15条新闻
  
  const titles = [
    `${symbol}发布新产品，股价有望上涨`,
    `${symbol}财报超预期，分析师上调评级`,
    `${symbol}与知名企业达成战略合作`,
    `${symbol}在新兴市场扩张，增长前景乐观`,
    `${symbol}技术创新获得行业认可`,
    `${symbol}面临监管挑战，股价承压`,
    `${symbol}高管变动引发市场关注`,
    `${symbol}股息政策调整，投资者反应积极`,
    `${symbol}研发投入增加，长期价值凸显`,
    `${symbol}市场份额持续扩大`
  ];
  
  const sources = ['财经新闻', '证券时报', '华尔街日报', '金融时报', '彭博社', '路透社'];
  const sentiments = ['positive', 'negative', 'neutral'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // 最近30天的新闻
    
    news.push({
      title: titles[Math.floor(Math.random() * titles.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      url: `https://example.com/news/${symbol}-${i}`,
      publishedAt: date,
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      relevance: Math.floor(Math.random() * 40) + 60 // 60-100的相关性
    });
  }
  
  return news;
}

/**
 * 创建或更新股票数据
 * @param {Object} stockInfo - 股票信息
 */
async function createOrUpdateStock(stockInfo) {
  try {
    let stockData;
    
    // 如果配置了API密钥，尝试从真实API获取数据
    if (process.env.ALPHA_VANTAGE_API_KEY && process.env.ALPHA_VANTAGE_API_KEY !== 'YOUR_API_KEY_HERE') {
      try {
        stockData = await getStockDataFromAlphaVantage(stockInfo.symbol);
        logger.info(`获取到${stockInfo.symbol}的真实数据`);
      } catch (error) {
        logger.warn(`无法获取${stockInfo.symbol}的真实数据，使用模拟数据:`, error.message);
      }
    }
    
    // 如果没有获取到真实数据，生成模拟数据
    if (!stockData) {
      // 生成模拟价格数据
      const basePrice = Math.random() * 300 + 50; // 50-350美元的基础价格
      stockData = {
        '01. symbol': stockInfo.symbol,
        '02. open': (basePrice * (1 + (Math.random() - 0.5) * 0.02)).toFixed(2),
        '03. high': (basePrice * (1 + Math.random() * 0.03)).toFixed(2),
        '04. low': (basePrice * (1 - Math.random() * 0.03)).toFixed(2),
        '05. price': basePrice.toFixed(2),
        '06. volume': Math.floor(Math.random() * 10000000) + 1000000,
        '07. latest trading day': new Date().toISOString().split('T')[0],
        '08. previous close': (basePrice * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2),
        '09. change': (Math.random() * 10 - 5).toFixed(2),
        '10. change percent': ((Math.random() * 10 - 5)).toFixed(2) + '%'
      };
    }
    
    // 查找或创建股票记录
    let stock = await Stock.findOne({ symbol: stockInfo.symbol });
    
    if (!stock) {
      stock = new Stock({
        symbol: stockInfo.symbol,
        name: stockInfo.name,
        exchange: stockInfo.exchange,
        sector: ['科技', '金融', '消费', '医疗', '工业', '能源'][Math.floor(Math.random() * 6)],
        industry: ['软件服务', '银行', '零售', '制药', '制造业', '石油天然气'][Math.floor(Math.random() * 6)],
        description: `${stockInfo.name} (${stockInfo.symbol}) 是一家在${stockInfo.exchange}交易所上市的公司。`,
        website: `https://www.${stockInfo.symbol.toLowerCase()}.com`,
        logo: `https://logo.example.com/${stockInfo.symbol}.png`,
        isActive: true
      });
    }
    
    // 更新价格数据
    const latestPrice = parseFloat(stockData['05. price']);
    const previousClose = parseFloat(stockData['08. previous close'] || latestPrice * 0.99);
    const change = parseFloat(stockData['09. change'] || (latestPrice - previousClose));
    const changePercent = parseFloat(stockData['10. change percent'] || ((change / previousClose) * 100));
    
    stock.latestPrice = latestPrice;
    stock.change = change;
    stock.changePercent = changePercent;
    stock.latestUpdate = new Date(stockData['07. latest trading day'] || new Date());
    
    // 设置其他财务指标
    stock.marketCap = Math.floor(Math.random() * 1000000000000) + 10000000000; // 100亿到1万亿市值
    stock.peRatio = (Math.random() * 50 + 10).toFixed(2); // 10-60的市盈率
    stock.eps = (Math.random() * 20).toFixed(2); // 0-20的每股收益
    stock.dividendYield = (Math.random() * 5).toFixed(2); // 0-5%的股息率
    stock.beta = (Math.random() * 2).toFixed(2); // 0-2的贝塔值
    
    // 生成历史数据（最近30天）
    stock.historicalData = generateHistoricalData(30, latestPrice);
    
    // 生成技术指标
    stock.technicalIndicators = generateTechnicalIndicators();
    
    // 生成AI评级
    stock.aiRatings = generateAiRatings();
    
    // 生成新闻
    stock.news = generateNews(stockInfo.symbol);
    
    // 保存到数据库
    await stock.save();
    logger.info(`成功保存股票数据: ${stockInfo.symbol} - ${stockInfo.name}`);
    
    return stock;
  } catch (error) {
    logger.error(`处理股票数据失败 ${stockInfo.symbol}:`, error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    logger.info('开始生成股票数据...');
    
    // 连接数据库
    await connectDB();
    logger.info('数据库连接成功');
    
    // 为每个股票生成数据
    for (const stockInfo of STOCK_SYMBOLS) {
      try {
        await createOrUpdateStock(stockInfo);
        // 添加延迟以避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`处理股票失败 ${stockInfo.symbol}:`, error);
      }
    }
    
    logger.info('股票数据生成完成');
    
    // 验证数据
    const stockCount = await Stock.countDocuments();
    logger.info(`数据库中共有 ${stockCount} 只股票`);
    
    // 断开数据库连接
    await mongoose.connection.close();
    logger.info('数据库连接已关闭');
    
    process.exit(0);
  } catch (error) {
    logger.error('生成股票数据过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  createOrUpdateStock,
  generateHistoricalData,
  generateTechnicalIndicators,
  generateAiRatings,
  generateNews
};