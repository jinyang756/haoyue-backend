const schedule = require('node-schedule');
const stockService = require('./stock.service');
const { logger } = require('../utils/logger');
const Stock = require('../models/Stock');

class ScheduleService {
  constructor() {
    this.jobs = {};
    this.initializeJobs();
  }

  /**
   * 初始化所有定时任务
   */
  initializeJobs() {
    // 每天9:30更新所有活跃股票价格
    this.jobs.dailyPriceUpdate = schedule.scheduleJob('0 30 9 * * 1-5', async () => {
      await this.updateAllStockPrices();
    });

    // 每天18:00更新历史数据
    this.jobs.dailyHistoricalUpdate = schedule.scheduleJob('0 0 18 * * *', async () => {
      await this.updateHistoricalData();
    });

    // 每小时更新新闻
    this.jobs.hourlyNewsUpdate = schedule.scheduleJob('0 * * * *', async () => {
      await this.updateStockNews();
    });

    // 每天20:00计算技术指标
    this.jobs.dailyTechnicalIndicators = schedule.scheduleJob('0 0 20 * * *', async () => {
      await this.calculateTechnicalIndicators();
    });

    // 每周日22:00执行维护任务
    this.jobs.weeklyMaintenance = schedule.scheduleJob('0 0 22 * * 0', async () => {
      await this.performMaintenance();
    });

    logger.info('所有定时任务已初始化');
  }

  /**
   * 更新所有活跃股票价格
   */
  async updateAllStockPrices() {
    try {
      logger.info('开始更新所有股票价格...');
      
      // 获取所有活跃股票
      const stocks = await Stock.find({ isActive: true });
      const symbols = stocks.map(stock => stock.symbol);
      
      if (symbols.length === 0) {
        logger.info('没有需要更新的股票');
        return;
      }

      // 分批更新，避免API调用过于频繁
      const batchSize = 10;
      for (let i = 0; i < symbols.length; i += batchSize) {
        const batch = symbols.slice(i, i + batchSize);
        await stockService.batchUpdateStocks(batch);
        await this.delay(2000); // 每批之间延迟2秒
      }

      logger.info(`完成更新 ${symbols.length} 只股票价格`);
    } catch (error) {
      logger.error('更新股票价格任务失败:', error);
    }
  }

  /**
   * 更新历史数据
   */
  async updateHistoricalData() {
    try {
      logger.info('开始更新历史数据...');
      
      // 获取最近更新的股票
      const stocks = await Stock.find({ isActive: true })
        .sort({ 'historicalData.0.date': 1 })
        .limit(50);

      for (const stock of stocks) {
        try {
          await stockService.updateHistoricalData(stock.symbol, 'daily');
          await this.delay(1000);
        } catch (error) {
          logger.error(`更新 ${stock.symbol} 历史数据失败:`, error);
        }
      }

      logger.info('历史数据更新完成');
    } catch (error) {
      logger.error('更新历史数据任务失败:', error);
    }
  }

  /**
   * 更新股票新闻
   */
  async updateStockNews() {
    try {
      logger.info('开始更新股票新闻...');
      
      // 获取热门股票
      const stocks = await Stock.find({ isActive: true })
        .sort({ marketCap: -1 })
        .limit(20);

      for (const stock of stocks) {
        try {
          await stockService.updateStockNews(stock.symbol);
          await this.delay(1500);
        } catch (error) {
          logger.error(`更新 ${stock.symbol} 新闻失败:`, error);
        }
      }

      logger.info('股票新闻更新完成');
    } catch (error) {
      logger.error('更新股票新闻任务失败:', error);
    }
  }

  /**
   * 计算技术指标
   */
  async calculateTechnicalIndicators() {
    try {
      logger.info('开始计算技术指标...');
      
      // 获取有足够历史数据的股票
      const stocks = await Stock.find({ 
        isActive: true,
        $expr: { $gte: [{ $size: '$historicalData' }, 20] }
      }).limit(30);

      for (const stock of stocks) {
        try {
          await stockService.calculateTechnicalIndicators(stock.symbol);
          await this.delay(1000);
        } catch (error) {
          logger.error(`计算 ${stock.symbol} 技术指标失败:`, error);
        }
      }

      logger.info('技术指标计算完成');
    } catch (error) {
      logger.error('计算技术指标任务失败:', error);
    }
  }

  /**
   * 执行维护任务
   */
  async performMaintenance() {
    try {
      logger.info('开始执行维护任务...');
      
      // 清理旧数据
      await this.cleanupOldData();
      
      // 检查数据完整性
      await this.checkDataIntegrity();
      
      // 生成维护报告
      await this.generateMaintenanceReport();

      logger.info('维护任务执行完成');
    } catch (error) {
      logger.error('维护任务失败:', error);
    }
  }

  /**
   * 清理旧数据
   */
  async cleanupOldData() {
    try {
      logger.info('开始清理旧数据...');
      
      // 清理超过3年的历史数据
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      await Stock.updateMany(
        {},
        { $pull: { historicalData: { date: { $lt: threeYearsAgo } } } }
      );

      // 清理超过90天的新闻
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      await Stock.updateMany(
        {},
        { $pull: { news: { publishedAt: { $lt: ninetyDaysAgo } } } }
      );

      // 清理超过180天的AI评级
      const oneHundredEightyDaysAgo = new Date();
      oneHundredEightyDaysAgo.setDate(oneHundredEightyDaysAgo.getDate() - 180);

      await Stock.updateMany(
        {},
        { $pull: { aiRatings: { date: { $lt: oneHundredEightyDaysAgo } } } }
      );

      logger.info('旧数据清理完成');
    } catch (error) {
      logger.error('清理旧数据失败:', error);
    }
  }

  /**
   * 检查数据完整性
   */
  async checkDataIntegrity() {
    try {
      logger.info('开始检查数据完整性...');
      
      // 检查缺少历史数据的股票
      const stocksWithoutHistory = await Stock.find({
        isActive: true,
        $expr: { $lt: [{ $size: '$historicalData' }, 10] }
      });

      if (stocksWithoutHistory.length > 0) {
        logger.warn(`发现 ${stocksWithoutHistory.length} 只股票缺少历史数据:`, 
          stocksWithoutHistory.map(s => s.symbol).join(', '));
      }

      // 检查价格为0的股票
      const stocksWithZeroPrice = await Stock.find({
        isActive: true,
        latestPrice: { $lte: 0 }
      });

      if (stocksWithZeroPrice.length > 0) {
        logger.warn(`发现 ${stocksWithZeroPrice.length} 只股票价格异常:`, 
          stocksWithZeroPrice.map(s => s.symbol).join(', '));
      }

      logger.info('数据完整性检查完成');
    } catch (error) {
      logger.error('数据完整性检查失败:', error);
    }
  }

  /**
   * 生成维护报告
   */
  async generateMaintenanceReport() {
    try {
      const report = {
        timestamp: new Date(),
        stockCount: await Stock.countDocuments({ isActive: true }),
        totalMarketCap: await this.calculateTotalMarketCap(),
        lastUpdated: new Date()
      };

      // 可以将报告保存到数据库或发送邮件
      logger.info('维护报告:', report);
    } catch (error) {
      logger.error('生成维护报告失败:', error);
    }
  }

  /**
   * 计算总市值
   */
  async calculateTotalMarketCap() {
    const result = await Stock.aggregate([
      { $match: { isActive: true, marketCap: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$marketCap' } } }
    ]);

    return result[0]?.total || 0;
  }

  /**
   * 添加新的定时任务
   * @param {string} name - 任务名称
   * @param {string} cronTime - Cron表达式
   * @param {Function} jobFunction - 任务函数
   */
  addJob(name, cronTime, jobFunction) {
    if (this.jobs[name]) {
      this.jobs[name].cancel();
    }

    this.jobs[name] = schedule.scheduleJob(cronTime, jobFunction);
    logger.info(`添加新的定时任务: ${name}`);
  }

  /**
   * 取消定时任务
   * @param {string} name - 任务名称
   */
  cancelJob(name) {
    if (this.jobs[name]) {
      this.jobs[name].cancel();
      delete this.jobs[name];
      logger.info(`取消定时任务: ${name}`);
    }
  }

  /**
   * 获取所有定时任务状态
   * @returns {Object} - 任务状态
   */
  getJobsStatus() {
    const status = {};
    for (const [name, job] of Object.entries(this.jobs)) {
      status[name] = {
        running: job.running,
        lastDate: job.lastDate ? job.lastDate().toISOString() : null,
        nextDate: job.nextDate() ? job.nextDate().toISOString() : null
      };
    }
    return status;
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟时间（毫秒）
   * @returns {Promise} - 延迟Promise
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建单例实例
const scheduleService = new ScheduleService();

module.exports = scheduleService;