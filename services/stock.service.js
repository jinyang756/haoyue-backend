const axios = require('axios');
const Stock = require('../models/Stock');
const { logger } = require('../utils/logger');

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
        logger.warn('Finnhub failed, trying Alpha Vantage:', error.message);
        stockData = await this.getStockDataFromAlphaVantage(symbol);
      }

      // 查找或创建股票记录
      let stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      if (!stock) {
        const companyProfile = await this.getCompanyProfileFromFinnhub(symbol);
        stock = new Stock({
          symbol: symbol.toUpperCase(),
          name: companyProfile.name || symbol,
          exchange: companyProfile.exchange || 'NYSE',
          sector: companyProfile.finnhubIndustry || '',
          description: companyProfile.description || '',
          website: companyProfile.weburl || '',
          logo: companyProfile.logo || '',
          marketCap: companyProfile.marketCapitalization || 0,
          isActive: true
        });
      }

      // 更新价格数据
      const priceData = this.formatPriceData(stockData);
      await stock.updateLatestPrice(priceData);

      logger.info(`Stock price updated: ${symbol} - $${priceData.close}`);
      return stock;
    } catch (error) {
      logger.error(`Error updating stock price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 更新股票历史数据
   * @param {string} symbol - 股票代码
   * @param {string} interval - 时间间隔
   * @returns {Promise<Stock>} - 更新后的股票
   */
  async updateHistoricalData(symbol, interval = 'daily') {
    try {
      const historicalData = await this.getHistoricalDataFromAlphaVantage(symbol, interval);
      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });

      if (!stock) {
        throw new Error('Stock not found');
      }

      // 格式化历史数据
      const formattedData = this.formatHistoricalData(historicalData);
      
      // 更新历史数据
      stock.historicalData = formattedData;
      await stock.save();

      logger.info(`Historical data updated for ${symbol}: ${formattedData.length} records`);
      return stock;
    } catch (error) {
      logger.error(`Error updating historical data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 更新股票新闻
   * @param {string} symbol - 股票代码
   * @returns {Promise<Stock>} - 更新后的股票
   */
  async updateStockNews(symbol) {
    try {
      const newsData = await this.getNewsFromFinnhub(symbol);
      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });

      if (!stock) {
        throw new Error('Stock not found');
      }

      // 格式化新闻数据
      const formattedNews = this.formatNewsData(newsData);
      
      // 清空现有新闻并添加新新闻
      stock.news = [];
      for (const news of formattedNews) {
        await stock.addNews(news);
      }

      logger.info(`News updated for ${symbol}: ${formattedNews.length} articles`);
      return stock;
    } catch (error) {
      logger.error(`Error updating news for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 格式化价格数据
   * @param {Object} data - 原始价格数据
   * @returns {Object} - 格式化后的价格数据
   */
  formatPriceData(data) {
    if (data.c !== undefined) {
      // Finnhub格式
      return {
        open: data.o,
        high: data.h,
        low: data.l,
        close: data.c,
        volume: data.v,
        adjustedClose: data.c
      };
    } else if (data['05. price'] !== undefined) {
      // Alpha Vantage格式
      return {
        open: parseFloat(data['02. open']),
        high: parseFloat(data['03. high']),
        low: parseFloat(data['04. low']),
        close: parseFloat(data['05. price']),
        volume: parseInt(data['06. volume']),
        adjustedClose: parseFloat(data['05. price'])
      };
    } else {
      throw new Error('Unsupported price data format');
    }
  }

  /**
   * 格式化历史数据
   * @param {Object} data - 原始历史数据
   * @returns {Array} - 格式化后的历史数据
   */
  formatHistoricalData(data) {
    return Object.entries(data).map(([date, values]) => ({
      date: new Date(date),
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
      adjustedClose: parseFloat(values['4. close'])
    })).sort((a, b) => a.date - b.date);
  }

  /**
   * 格式化新闻数据
   * @param {Array} data - 原始新闻数据
   * @returns {Array} - 格式化后的新闻数据
   */
  formatNewsData(data) {
    return data.map(news => ({
      title: news.headline,
      source: news.source,
      url: news.url,
      publishedAt: new Date(news.datetime * 1000),
      sentiment: this.analyzeSentiment(news.headline),
      relevance: Math.random() * 40 + 60 // 60-100% 相关性
    })).sort((a, b) => b.publishedAt - a.publishedAt);
  }

  /**
   * 简单的情感分析
   * @param {string} text - 文本内容
   * @returns {string} - 情感分析结果
   */
  analyzeSentiment(text) {
    const positiveWords = ['up', 'rise', 'gain', 'positive', 'good', 'excellent', 'strong', 'beat', 'surpass', 'growth'];
    const negativeWords = ['down', 'fall', 'loss', 'negative', 'bad', 'poor', 'weak', 'miss', 'decline', 'drop'];

    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * 批量更新股票数据
   * @param {Array} symbols - 股票代码数组
   * @returns {Promise<Array>} - 更新结果
   */
  async batchUpdateStocks(symbols) {
    const results = [];
    
    for (const symbol of symbols) {
      try {
        const stock = await this.updateStockPrice(symbol);
        results.push({
          symbol,
          success: true,
          price: stock.latestPrice
        });
      } catch (error) {
        results.push({
          symbol,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 计算技术指标
   * @param {string} symbol - 股票代码
   * @returns {Promise<Object>} - 技术指标
   */
  async calculateTechnicalIndicators(symbol) {
    try {
      const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
      if (!stock || stock.historicalData.length < 20) {
        throw new Error('Insufficient historical data');
      }

      const data = [...stock.historicalData].sort((a, b) => a.date - b.date);
      const closes = data.map(item => item.close);

      const indicators = {
        movingAverages: this.calculateMovingAverages(closes),
        rsi: this.calculateRSI(closes),
        macd: this.calculateMACD(closes),
        bollingerBands: this.calculateBollingerBands(closes)
      };

      stock.technicalIndicators = indicators;
      await stock.save();

      logger.info(`Technical indicators updated for ${symbol}`);
      return indicators;
    } catch (error) {
      logger.error(`Error calculating technical indicators for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 计算移动平均线
   * @param {Array} prices - 价格数组
   * @returns {Object} - 移动平均线
   */
  calculateMovingAverages(prices) {
    const ma5 = this.calculateMA(prices, 5);
    const ma10 = this.calculateMA(prices, 10);
    const ma20 = this.calculateMA(prices, 20);
    const ma60 = this.calculateMA(prices, 60);
    const ma120 = this.calculateMA(prices, 120);
    const ma250 = this.calculateMA(prices, 250);

    return {
      ma5,
      ma10,
      ma20,
      ma60,
      ma120,
      ma250
    };
  }

  /**
   * 计算简单移动平均线
   * @param {Array} prices - 价格数组
   * @param {number} period - 周期
   * @returns {number} - 移动平均线值
   */
  calculateMA(prices, period) {
    if (prices.length < period) return null;
    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return Math.round((sum / period) * 100) / 100;
  }

  /**
   * 计算RSI指标
   * @param {Array} prices - 价格数组
   * @param {number} period - 周期
   * @returns {number} - RSI值
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.round(rsi * 100) / 100;
  }

  /**
   * 计算MACD指标
   * @param {Array} prices - 价格数组
   * @returns {Object} - MACD值
   */
  calculateMACD(prices) {
    if (prices.length < 26) return null;

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;

    // 计算MACD信号线（9期EMA）
    const signalLine = this.calculateSignalLine(prices);

    return {
      macd: Math.round(macd * 10000) / 10000,
      signalLine: Math.round(signalLine * 10000) / 10000,
      histogram: Math.round((macd - signalLine) * 10000) / 10000
    };
  }

  /**
   * 计算指数移动平均线
   * @param {Array} prices - 价格数组
   * @param {number} period - 周期
   * @returns {number} - EMA值
   */
  calculateEMA(prices, period) {
    if (prices.length < period) return null;

    const k = 2 / (period + 1);
    const lastPrices = prices.slice(-period);
    
    // 初始EMA使用SMA
    let ema = lastPrices.reduce((a, b) => a + b, 0) / period;

    // 计算后续EMA
    for (let i = prices.length - period - 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * k + ema;
    }

    return ema;
  }

  /**
   * 计算MACD信号线
   * @param {Array} prices - 价格数组
   * @returns {number} - 信号线值
   */
  calculateSignalLine(prices) {
    if (prices.length < 35) return null;

    const macdValues = [];
    for (let i = prices.length - 34; i < prices.length; i++) {
      const slice = prices.slice(0, i + 1);
      const ema12 = this.calculateEMA(slice, 12);
      const ema26 = this.calculateEMA(slice, 26);
      macdValues.push(ema12 - ema26);
    }

    return this.calculateEMA(macdValues, 9);
  }

  /**
   * 计算布林带
   * @param {Array} prices - 价格数组
   * @param {number} period - 周期
   * @param {number} stdDev - 标准差倍数
   * @returns {Object} - 布林带值
   */
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return null;

    const slice = prices.slice(-period);
    const middleBand = slice.reduce((a, b) => a + b, 0) / period;

    // 计算标准差
    const variance = slice.reduce((sum, price) => {
      return sum + Math.pow(price - middleBand, 2);
    }, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    const upperBand = middleBand + (standardDeviation * stdDev);
    const lowerBand = middleBand - (standardDeviation * stdDev);
    const bandwidth = ((upperBand - lowerBand) / middleBand) * 100;
    const percentB = ((prices[prices.length - 1] - lowerBand) / (upperBand - lowerBand)) * 100;

    return {
      upper: Math.round(upperBand * 100) / 100,
      middle: Math.round(middleBand * 100) / 100,
      lower: Math.round(lowerBand * 100) / 100,
      bandwidth: Math.round(bandwidth * 100) / 100,
      percentB: Math.round(percentB * 100) / 100
    };
  }
}

module.exports = new StockService();