const axios = require('axios');
const { logger } = require('../utils/logger');
const { A股交易所, CACHE } = require('../utils/constants');
const Stock = require('../models/Stock');
const { taskLock } = require('./schedule.service');

// 免费A股数据源配置
const CHINA_STOCK_DATA_SOURCES = {
  // 新浪财经API
  sina: {
    name: '新浪财经',
    baseUrl: 'http://hq.sinajs.cn',
    stockListUrl: 'https://vip.stock.finance.sina.com.cn/mkt/#hs_a',
    rateLimit: 1000, // 请求间隔(毫秒)
  },
  // 东方财富API
  eastmoney: {
    name: '东方财富',
    baseUrl: 'http://push2.eastmoney.com',
    stockListUrl: 'http://quote.eastmoney.com/stock_list.html',
    rateLimit: 1000,
  },
  // 腾讯财经API
  tencent: {
    name: '腾讯财经',
    baseUrl: 'http://qt.gtimg.cn',
    stockListUrl: 'http://gu.qq.com/hk00001/gp',
    rateLimit: 1000,
  },
  // 网易财经API
  netease: {
    name: '网易财经',
    baseUrl: 'http://api.money.126.net',
    stockListUrl: 'http://quotes.money.163.com/stock',
    rateLimit: 1000,
  },
  // 雪球API
  xueqiu: {
    name: '雪球',
    baseUrl: 'https://stock.xueqiu.com',
    stockListUrl: 'https://xueqiu.com/hq',
    rateLimit: 2000,
  },
};

class ChinaStockCrawlerService {
  constructor() {
    this.cache = new Map();
    this.currentDataSource = 'sina'; // 默认使用新浪财经
  }

  // 切换数据源
  switchDataSource(sourceName) {
    if (CHINA_STOCK_DATA_SOURCES[sourceName]) {
      this.currentDataSource = sourceName;
      logger.info(`已切换A股数据源为: ${CHINA_STOCK_DATA_SOURCES[sourceName].name}`);
    } else {
      logger.warn(`不支持的数据源: ${sourceName}，继续使用当前数据源: ${this.currentDataSource}`);
    }
  }

  // 从缓存获取数据
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    return null;
  }

  // 缓存数据
  setCachedData(key, data, ttl = CACHE.STOCK_DATA) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  }

  // 获取单个A股股票的实时数据
  async getStockRealtimeData(symbol, exchange) {
    const cacheKey = `stock:${symbol}:realtime`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const source = CHINA_STOCK_DATA_SOURCES[this.currentDataSource];
      let result;

      switch (this.currentDataSource) {
        case 'sina':
          result = await this.getSinaStockData(symbol, exchange);
          break;
        case 'tencent':
          result = await this.getTencentStockData(symbol, exchange);
          break;
        case 'eastmoney':
          result = await this.getEastmoneyStockData(symbol, exchange);
          break;
        default:
          result = await this.getSinaStockData(symbol, exchange);
      }

      // 缓存数据
      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      logger.error(`获取A股股票数据失败 (${symbol}):`, error.message);
      // 尝试切换数据源
      this.switchToNextDataSource();
      throw error;
    }
  }

  // 新浪财经API获取股票数据
  async getSinaStockData(symbol, exchange) {
    // 构建新浪API的股票代码格式
    let sinaCode;
    if (exchange === A股交易所.上证) {
      sinaCode = `sh${symbol}`;
    } else if (exchange === A股交易所.深证) {
      sinaCode = `sz${symbol}`;
    } else {
      throw new Error(`不支持的A股交易所: ${exchange}`);
    }

    const url = `${CHINA_STOCK_DATA_SOURCES.sina.baseUrl}?list=${sinaCode}`;
    const response = await axios.get(url);
    
    // 解析新浪返回的字符串数据
    const dataStr = response.data;
    const match = dataStr.match(/var\s+hq_str_\w+="([^"]+)"/);
    if (!match) {
      throw new Error(`解析新浪股票数据失败: ${dataStr}`);
    }

    const dataArray = match[1].split(',');
    
    // 新浪A股数据格式映射
    return {
      symbol,
      name: dataArray[0],
      open: parseFloat(dataArray[1]),
      previousClose: parseFloat(dataArray[2]),
      latestPrice: parseFloat(dataArray[3]),
      high: parseFloat(dataArray[4]),
      low: parseFloat(dataArray[5]),
      buy: parseFloat(dataArray[6]),
      sell: parseFloat(dataArray[7]),
      volume: parseFloat(dataArray[8]),
      amount: parseFloat(dataArray[9]),
      // 其他字段可以根据需要添加
      timestamp: new Date().toISOString(),
      source: 'sina',
    };
  }

  // 腾讯财经API获取股票数据
  async getTencentStockData(symbol, exchange) {
    // 构建腾讯API的股票代码格式
    let tencentCode;
    if (exchange === A股交易所.上证) {
      tencentCode = `sh${symbol}`;
    } else if (exchange === A股交易所.深证) {
      tencentCode = `sz${symbol}`;
    } else {
      throw new Error(`不支持的A股交易所: ${exchange}`);
    }

    const url = `${CHINA_STOCK_DATA_SOURCES.tencent.baseUrl}?q=${tencentCode}`;
    const response = await axios.get(url);
    
    // 解析腾讯返回的字符串数据
    const dataStr = response.data;
    const match = dataStr.match(/v_\w+="([^"]+)"/);
    if (!match) {
      throw new Error(`解析腾讯股票数据失败: ${dataStr}`);
    }

    const dataArray = match[1].split('~');
    
    // 腾讯A股数据格式映射
    return {
      symbol,
      name: dataArray[1],
      open: parseFloat(dataArray[5]),
      previousClose: parseFloat(dataArray[4]),
      latestPrice: parseFloat(dataArray[3]),
      high: parseFloat(dataArray[33]),
      low: parseFloat(dataArray[34]),
      buy: parseFloat(dataArray[9]),
      sell: parseFloat(dataArray[10]),
      volume: parseFloat(dataArray[36]),
      amount: parseFloat(dataArray[37]),
      timestamp: new Date().toISOString(),
      source: 'tencent',
    };
  }

  // 东方财富API获取股票数据
  async getEastmoneyStockData(symbol, exchange) {
    // 简化实现，实际需要根据东方财富API的具体格式调整
    const url = `${CHINA_STOCK_DATA_SOURCES.eastmoney.baseUrl}/api/qt/stock/get?secid=${exchange === A股交易所.上证 ? '1.' : '0.'}${symbol}&fields=f43,f57,f58,f60,f62,f107,f162,f163,f164,f165,f166`;
    const response = await axios.get(url);
    
    const data = response.data;
    if (data.ret !== 0) {
      throw new Error(`东方财富API返回错误: ${data.msg}`);
    }

    const ticker = data.data;
    return {
      symbol,
      name: ticker.f58,
      open: parseFloat(ticker.f62),
      previousClose: parseFloat(ticker.f60),
      latestPrice: parseFloat(ticker.f43),
      high: parseFloat(ticker.f162),
      low: parseFloat(ticker.f163),
      volume: parseFloat(ticker.f164),
      amount: parseFloat(ticker.f165),
      timestamp: new Date().toISOString(),
      source: 'eastmoney',
    };
  }

  // 获取A股股票列表
  async getStockList(exchange = null) {
    const cacheKey = `stock:list:${exchange || 'all'}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      let stockList = [];
      
      // 如果指定了交易所，只获取该交易所的股票
      if (exchange && (exchange === A股交易所.上证 || exchange === A股交易所.深证)) {
        const exchangeStocks = await this.getExchangeStockList(exchange);
        stockList = stockList.concat(exchangeStocks);
      } else {
        // 否则获取所有A股股票
        const shStocks = await this.getExchangeStockList(A股交易所.上证);
        const szStocks = await this.getExchangeStockList(A股交易所.深证);
        stockList = stockList.concat(shStocks, szStocks);
      }

      // 缓存数据
      this.setCachedData(cacheKey, stockList, CACHE.STOCK_LIST);
      return stockList;
    } catch (error) {
      logger.error(`获取A股股票列表失败:`, error.message);
      throw error;
    }
  }

  // 获取指定交易所的股票列表
  async getExchangeStockList(exchange) {
    // 从数据库获取股票列表
    try {
      const stocks = await Stock.find({
        exchange: exchange,
        isActive: true
      }, { symbol: 1, name: 1, exchange: 1, sector: 1, industry: 1, _id: 0 });
      
      if (!stocks || stocks.length === 0) {
        logger.warn(`数据库中没有找到${exchange}的股票列表`);
        throw new Error(`数据库中没有找到${exchange}的股票列表`);
      }
      
      return stocks;
    } catch (error) {
      logger.error(`获取${exchange}股票列表失败:`, error.message);
      throw error;
    }
  }

  // 获取A股股票历史数据
  async getStockHistoricalData(symbol, exchange, startDate, endDate) {
    const cacheKey = `stock:${symbol}:historical:${startDate}:${endDate}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // 从数据库获取历史数据
      const historicalData = await StockPriceHistory.find({
        symbol: symbol,
        exchange: exchange,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: 1 });
      
      if (!historicalData || historicalData.length === 0) {
        logger.warn(`数据库中没有找到${symbol}在${startDate}至${endDate}期间的历史数据`);
        throw new Error(`没有找到历史数据`);
      }
      
      // 格式化数据
      const formattedData = historicalData.map(record => ({
        date: record.date,
        open: record.open,
        high: record.high,
        low: record.low,
        close: record.close,
        volume: record.volume
      }));

      // 缓存数据
      this.setCachedData(cacheKey, formattedData, CACHE.HISTORICAL_DATA);
      return formattedData;
    } catch (error) {
      logger.error(`获取A股股票历史数据失败 (${symbol}):`, error.message);
      throw error;
    }
  }

  // 获取A股股票的基本面数据
  async getStockFundamentalData(symbol, exchange) {
    const cacheKey = `stock:${symbol}:fundamental`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      // 从数据库获取基本面数据
      const stock = await Stock.findOne({
        symbol: symbol,
        exchange: exchange
      });
      
      if (!stock) {
        logger.warn(`数据库中没有找到股票${symbol}的基本面数据`);
        throw new Error(`没有找到股票数据`);
      }
      
      // 获取最新的财务报告
      const financialReport = await FinancialReport.findOne({
        symbol: symbol,
        exchange: exchange
      }).sort({ reportDate: -1 });
      
      // 构建基本面数据
      const fundamentalData = {
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        marketCap: stock.marketCap || 0,
        peRatio: stock.peRatio || 0,
        pbRatio: financialReport ? financialReport.pbRatio : 0,
        psRatio: financialReport ? financialReport.psRatio : 0,
        roe: financialReport ? financialReport.roe : 0,
        roa: financialReport ? financialReport.roa : 0,
        debtEquityRatio: financialReport ? financialReport.debtEquityRatio : 0,
        revenueGrowth: financialReport ? financialReport.revenueGrowth : 0,
        earningsGrowth: financialReport ? financialReport.earningsGrowth : 0,
        eps: stock.eps || 0,
        dividendYield: stock.dividendYield || 0,
        timestamp: new Date().toISOString()
      };

      // 缓存数据
      this.setCachedData(cacheKey, fundamentalData, CACHE.FUNDAMENTAL_DATA);
      return fundamentalData;
    } catch (error) {
      logger.error(`获取A股股票基本面数据失败 (${symbol}):`, error.message);
      throw error;
    }
  }

  // 切换到下一个可用的数据源
  switchToNextDataSource() {
    const sources = Object.keys(CHINA_STOCK_DATA_SOURCES);
    const currentIndex = sources.indexOf(this.currentDataSource);
    const nextIndex = (currentIndex + 1) % sources.length;
    this.switchDataSource(sources[nextIndex]);
  }

  // 保存A股股票数据到数据库
  async saveStockDataToDB(stockData) {
    try {
      let stock = await Stock.findOne({ symbol: stockData.symbol, exchange: stockData.exchange });
      
      if (!stock) {
        // 创建新股票记录
        stock = new Stock({
          symbol: stockData.symbol,
          name: stockData.name,
          exchange: stockData.exchange,
          sector: stockData.sector || '未知',
          industry: stockData.industry || '未知',
          country: '中国',
          isActive: true
        });
      }

      // 更新股票价格和基本信息
      if (stockData.latestPrice) {
        stock.latestPrice = stockData.latestPrice;
        stock.open = stockData.open;
        stock.high = stockData.high;
        stock.low = stockData.low;
        stock.change = stockData.latestPrice - stockData.previousClose;
        stock.changePercent = ((stockData.latestPrice - stockData.previousClose) / stockData.previousClose) * 100;
        stock.latestUpdate = new Date();
      }

      // 更新基本面数据
      if (stockData.marketCap) {
        stock.marketCap = stockData.marketCap;
        stock.peRatio = stockData.peRatio;
        stock.eps = stockData.eps;
        stock.dividendYield = stockData.dividendYield;
      }

      // 保存到数据库
      await stock.save();
      logger.info(`已保存A股股票数据到数据库: ${stockData.symbol} ${stockData.name}`);
      return stock;
    } catch (error) {
      logger.error(`保存A股股票数据到数据库失败 (${stockData.symbol}):`, error.message);
      throw error;
    }
  }

  // 批量爬取A股股票数据
  async batchCrawlStocks(exchange = null, limit = 100) {
    const lockName = 'batchCrawlStocks';
    const lockAcquired = await taskLock.acquire(lockName);
    
    if (!lockAcquired) {
      logger.info('批量爬取A股股票任务已在运行中，跳过本次执行');
      return { success: false, message: '任务已在运行中' };
    }

    try {
      logger.info(`开始批量爬取${exchange || '所有'}A股股票数据，限制: ${limit}`);
      
      // 获取股票列表
      const stockList = await this.getStockList(exchange);
      const stocksToCrawl = stockList.slice(0, limit);
      
      let successCount = 0;
      let failedCount = 0;
      
      // 逐个爬取并保存股票数据
      for (const stock of stocksToCrawl) {
        try {
          // 获取实时数据
          const realtimeData = await this.getStockRealtimeData(stock.symbol, stock.exchange);
          
          // 合并数据
          const completeData = {
            ...stock,
            ...realtimeData
          };
          
          // 获取基本面数据
          try {
            const fundamentalData = await this.getStockFundamentalData(stock.symbol, stock.exchange);
            Object.assign(completeData, fundamentalData);
          } catch (fundamentalError) {
            logger.warn(`获取基本面数据失败 (${stock.symbol}):`, fundamentalError.message);
          }
          
          // 保存到数据库
          await this.saveStockDataToDB(completeData);
          successCount++;
          
          // 遵守API的速率限制
          await new Promise(resolve => setTimeout(resolve, CHINA_STOCK_DATA_SOURCES[this.currentDataSource].rateLimit));
        } catch (error) {
          logger.error(`爬取股票数据失败 (${stock.symbol}):`, error.message);
          failedCount++;
        }
      }
      
      logger.info(`批量爬取A股股票数据完成，成功: ${successCount}, 失败: ${failedCount}`);
      
      return {
        success: true,
        message: `批量爬取A股股票数据完成`,
        successCount,
        failedCount,
        totalProcessed: successCount + failedCount
      };
    } catch (error) {
      logger.error('批量爬取A股股票数据过程中发生错误:', error.message);
      return {
        success: false,
        message: error.message
      };
    } finally {
      // 释放锁
      await taskLock.release(lockName);
    }
  }
}

module.exports = new ChinaStockCrawlerService();