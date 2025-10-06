const axios = require('axios');
const Stock = require('../models/Stock');
const { logger } = require('../utils/logger');
const axios = require('axios');

class StockService {
  /**
   * 从Alpha Vantage获取股票数据
   * @param {string} symbol - 股票代码
   * @returns {Promise<Object>} - 股票数据
   */
  async getStockDataFromAlphaVantage(symbol) {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol,
          apikey: apiKey
        }
      });

      const data = response.data;
      if (!data['Global Quote'] || Object.keys(data['Global Quote']).length === 0) {
        throw new Error('Stock data not found');
      }

      return data['Global Quote'];
    } catch (error) {
      logger.error('Error fetching data from Alpha Vantage:', error);
      throw error;
    }
  }

  /**
   * 从Alpha Vantage获取历史数据
   * @param {string} symbol - 股票代码
   * @param {string} interval - 时间间隔
   * @returns {Promise<Object>} - 历史数据
   */
  async getHistoricalDataFromAlphaVantage(symbol, interval = 'daily') {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }

      let functionName;
      switch (interval) {
        case 'daily':
          functionName = 'TIME_SERIES_DAILY';
          break;
        case 'weekly':
          functionName = 'TIME_SERIES_WEEKLY';
          break;
        case 'monthly':
          functionName = 'TIME_SERIES_MONTHLY';
          break;
        default:
          functionName = 'TIME_SERIES_DAILY';
      }

      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: functionName,
          symbol: symbol,
          apikey: apiKey,
          outputsize: 'compact'
        }
      });

      const data = response.data;
      const timeSeriesKey = `Time Series (${interval.charAt(0).toUpperCase() + interval.slice(1)})`;
      
      if (!data[timeSeriesKey]) {
        throw new Error('Historical data not found');
      }

      return data[timeSeriesKey];
    } catch (error) {
      logger.error('Error fetching historical data from Alpha Vantage:', error);
      throw error;
    }
  }

  /**
   * 从Finnhub获取股票数据
   * @param {string} symbol - 股票代码
   * @returns {Promise<Object>} - 股票数据
   */
  async getStockDataFromFinnhub(symbol) {
    try {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        throw new Error('Finnhub API key not configured');
      }

      const response = await axios.get('https://finnhub.io/api/v1/quote', {
        params: {
          symbol: symbol,
          token: apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching data from Finnhub:', error);
      throw error;
    }
  }

  /**
   * 从Finnhub获取公司基本信息
   * @param {string} symbol - 股票代码
   * @returns {Promise<Object>} - 公司信息
   */
  async getCompanyProfileFromFinnhub(symbol) {
    try {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        throw new Error('Finnhub API key not configured');
      }

      const response = await axios.get('https://finnhub.io/api/v1/stock/profile2', {
        params: {
          symbol: symbol,
          token: apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching company profile from Finnhub:', error);
      throw error;
    }
  }

  /**
   * 从Finnhub获取新闻
   * @param {string} symbol - 股票代码
   * @returns {Promise<Object>} - 新闻数据
   */
  async getNewsFromFinnhub(symbol) {
    try {
      const apiKey = process.env.FINNHUB_API_KEY;
      if (!apiKey) {
        throw new Error('Finnhub API key not configured');
      }

      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(fromDate.getDate() - 30);

      const response = await axios.get('https://finnhub.io/api/v1/company-news', {
        params: {
          symbol: symbol,
          from: fromDate.toISOString().split('T')[0],
          to: today.toISOString().split('T')[0],
          token: apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Error fetching news from Finnhub:', error);
      throw error;
    }
  }



  /**
   * 更新股票最新价格
   * @param {string} symbol - 股票代码
   * @returns {Promise<Stock>} - 更新后的股票
   */
  async updateStockPrice(symbol) {
    try {
      let stockData;
      
      // 尝试从多个API获取数据
      try {
        stockData = await this.getStockDataFromFinnhub(symbol);
        if (!stockData || stockData.c === 0) {
          throw new Error('Finnhub returned empty data');
        }
      } catch (error) {
        logger.warn(`Finnhub failed for ${symbol}, trying Alpha Vantage:`, error.message);
        stockData = await this.getStockDataFromAlphaVantage(symbol);
      }

      // 查找或创建股票记录
      let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      if (!stock) {
        // 尝试从公司信息API获取公司名称
        let companyName = symbol;
        try {
          const companyProfile = await this.getCompanyProfileFromFinnhub(symbol);
          companyName = companyProfile.name || symbol;
        } catch (error) {
          logger.warn(`Failed to get company profile for ${symbol}:`, error.message);
          // 使用默认名称
          companyName = symbol;
        }
        
        stock = new Stock({
          symbol: symbol.toUpperCase(),
          name: companyName,
          exchange: 'NASDAQ', // 默认交易所
          isActive: true
        });
      }

      // 更新股票数据
      if (stockData.c) {
        // Finnhub数据格式
        stock.latestPrice = stockData.c;
        stock.change = stockData.c - stockData.pc;
        stock.changePercent = ((stockData.c - stockData.pc) / stockData.pc) * 100;
        stock.volume = stockData.v;
      } else if (stockData['05. price']) {
        // Alpha Vantage数据格式
        const currentPrice = parseFloat(stockData['05. price']);
        const previousClose = parseFloat(stockData['08. previous close']);
        stock.latestPrice = currentPrice;
        stock.change = currentPrice - previousClose;
        stock.changePercent = ((currentPrice - previousClose) / previousClose) * 100;
        // Alpha Vantage不提供成交量
      } else if (stockData.currentPrice) {
        // 模拟数据格式
        stock.latestPrice = stockData.currentPrice;
        stock.change = stockData.change;
        stock.changePercent = stockData.changePercent;
        stock.volume = stockData.volume;
        stock.marketCap = stockData.marketCap;
        stock.peRatio = stockData.peRatio;
        stock.sector = stockData.sector;
        stock.description = stockData.description;
      }

      stock.updatedAt = new Date();
      await stock.save();

      logger.info(`股票价格更新完成: ${symbol} - $${stock.latestPrice}`);
      return stock;
    } catch (error) {
      logger.error(`更新股票价格失败 ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 获取所有股票列表
   * @returns {Promise<Array>} - 股票列表
   */
  async getAllStocks() {
    try {
        // 从数据库获取
        const stocks = await Stock.find({ isActive: true }).limit(100);
        return stocks;
      } catch (error) {
        logger.error('获取股票列表失败:', error);
        throw error;
      }
  }

  /**
   * 搜索股票
   * @param {string} query - 搜索关键词
   * @returns {Promise<Array>} - 搜索结果
   */
  async searchStocks(query) {
    try {
        // 从数据库搜索
        const stocks = await Stock.find({
          $or: [
            { symbol: { $regex: query, $options: 'i' } },
            { name: { $regex: query, $options: 'i' } }
          ],
          isActive: true
        }).limit(20);
        return stocks;
      } catch (error) {
        logger.error(`搜索股票"${query}"失败:`, error);
        throw error;
      }
  }

  /**
   * 获取股票详情
   * @param {string} symbol - 股票代码
   * @returns {Promise<Object>} - 股票详情
   */
  async getStockDetails(symbol) {
    try {
        // 从数据库获取
        const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
        if (!stock) {
          throw new Error(`股票${symbol}不存在`);
        }
        return stock;
      } catch (error) {
        logger.error(`获取股票${symbol}详情失败:`, error);
        throw error;
      }
  }

  /**
   * 更新历史数据
   * @param {string} symbol - 股票代码
   * @param {string} interval - 时间间隔
   * @returns {Promise<void>}
   */
  async updateHistoricalData(symbol, interval = 'daily') {
    try {
      // 尝试从API获取历史数据
      const historicalData = await this.getHistoricalDataFromAlphaVantage(symbol, interval);

      // 更新股票的历史数据
      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      if (stock) {
        // 转换历史数据格式
        const formattedData = [];
        for (const [date, data] of Object.entries(historicalData)) {
          formattedData.push({
            date: new Date(date),
            open: parseFloat(data['1. open']),
            high: parseFloat(data['2. high']),
            low: parseFloat(data['3. low']),
            close: parseFloat(data['4. close']),
            volume: parseInt(data['5. volume'])
          });
        }
        
        // 按日期排序并保留最新的数据
        formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));
        stock.historicalData = formattedData.slice(0, 100); // 保留最近100天的数据
        stock.updatedAt = new Date();
        await stock.save();
        
        logger.info(`历史数据更新完成: ${symbol} (${interval})`);
      }
    } catch (error) {
      logger.error(`更新${symbol}历史数据失败:`, error);
      throw error;
    }
  }

  /**
   * 更新股票新闻
   * @param {string} symbol - 股票代码
   * @returns {Promise<void>}
   */
  async updateStockNews(symbol) {
    try {
      // 尝试从API获取新闻
      const newsData = await this.getNewsFromFinnhub(symbol);

      // 更新股票的新闻数据
      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      if (stock) {
        // 转换新闻数据格式
        const formattedNews = newsData.slice(0, 10).map(item => ({
          title: item.headline || item.title,
          source: item.source,
          publishedAt: new Date(item.datetime * 1000 || item.publishedAt),
          url: item.url,
          summary: item.summary,
          sentiment: item.sentiment || 'neutral'
        }));
        
        stock.news = formattedNews;
        stock.updatedAt = new Date();
        await stock.save();
        
        logger.info(`新闻数据更新完成: ${symbol}`);
      }
    } catch (error) {
      logger.error(`更新${symbol}新闻数据失败:`, error);
      throw error;
    }
  }

  /**
   * 计算技术指标
   * @param {string} symbol - 股票代码
   * @returns {Promise<void>}
   */
  async calculateTechnicalIndicators(symbol) {
    try {
      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      if (!stock) {
        throw new Error(`Stock not found: ${symbol}`);
      }

      // 如果没有历史数据，无法计算技术指标
      if (!stock.historicalData || stock.historicalData.length === 0) {
        logger.warn(`股票${symbol}没有历史数据，无法计算技术指标`);
        return;
      }

      // 计算简单的技术指标
      const data = stock.historicalData.slice(0, 30); // 使用最近30天的数据
      
      // 计算RSI (14天)
      const rsi = this.calculateRSI(data.map(d => d.close), 14);
      
      // 计算移动平均线
      const closes = data.map(d => d.close);
      const sma5 = this.calculateSMA(closes, 5);
      const sma10 = this.calculateSMA(closes, 10);
      const sma20 = this.calculateSMA(closes, 20);
      
      // 计算MACD
      const macd = this.calculateMACD(closes);
      
      // 计算布林带
      const bollinger = this.calculateBollingerBands(closes, 20, 2);
      
      // 更新技术指标
      stock.technicalIndicators = {
        rsi: rsi,
        sma5: sma5,
        sma10: sma10,
        sma20: sma20,
        macd: macd,
        bollingerBands: bollinger,
        updatedAt: new Date()
      };
      
      await stock.save();
      logger.info(`技术指标计算完成: ${symbol}`);
    } catch (error) {
      logger.error(`计算${symbol}技术指标失败:`, error);
      throw error;
    }
  }

  // 简单的RSI计算
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50; // 默认值
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // 简单的SMA计算
  calculateSMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // 简单的MACD计算
  calculateMACD(prices) {
    if (prices.length < 26) return 0;
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    return ema12 - ema26;
  }

  // 简单的EMA计算
  calculateEMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
  }

  // 简单的布林带计算
  calculateBollingerBands(prices, period = 20, multiplier = 2) {
    if (prices.length < period) {
      return {
        upper: prices[prices.length - 1] || 0,
        middle: prices[prices.length - 1] || 0,
        lower: prices[prices.length - 1] || 0
      };
    }
    
    const sma = this.calculateSMA(prices, period);
    const squaredDiffs = prices.slice(0, period).map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * multiplier),
      middle: sma,
      lower: sma - (stdDev * multiplier)
    };
  }
}

module.exports = new StockService();