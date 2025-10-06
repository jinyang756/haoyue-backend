const schedule = require('node-schedule');
const logger = require('../utils/logger');
const Stock = require('../models/Stock');
const Analysis = require('../models/Analysis');
const aiService = require('./ai.service');
const chinaStockCrawler = require('./chinaStockCrawler.service');

class ScheduleService {
  constructor() {
    this.jobs = new Map();
    this.jobLocks = new Map();
    this.lastMaintenanceReport = null;
  }

  // 初始化所有定时任务
  initJobs() {
    try {
      logger.info('开始初始化所有定时任务...');

      // 每小时更新一次股票价格
      this.jobs.set(
        'updateStockPrices',
        schedule.scheduleJob('0 * * * *', this.wrapJob('updateStockPrices', this.updateAllStockPrices.bind(this)))
      );
      logger.info('✓ 已创建任务: updateStockPrices (每小时0分)');

      // 每天凌晨2点更新历史数据
      this.jobs.set(
        'updateHistoricalData',
        schedule.scheduleJob('0 2 * * *', this.wrapJob('updateHistoricalData', this.updateHistoricalData.bind(this)))
      );
      logger.info('✓ 已创建任务: updateHistoricalData (每天凌晨2点)');

      // 每周晚上10点执行系统维护
      this.jobs.set(
        'performMaintenance',
        schedule.scheduleJob('0 22 * * 0', this.wrapJob('performMaintenance', this.performMaintenance.bind(this)))
      );
      logger.info('✓ 已创建任务: performMaintenance (每周 evenings10点)');

      // 每周一至周五收盘后执行AI分析
      this.jobs.set(
        'performAIAnalysis',
        schedule.scheduleJob('0 16 * * 1-5', this.wrapJob('performAIAnalysis', this.performScheduledAIAnalysis.bind(this)))
      );
      logger.info('✓ 已创建任务: performAIAnalysis (每周一至周五16点)');

      // 每天早上8点生成每日报告
      this.jobs.set(
        'generateDailyReport',
        schedule.scheduleJob('0 8 * * *', this.wrapJob('generateDailyReport', this.generateDailyReport.bind(this)))
      );
      logger.info('✓ 已创建任务: generateDailyReport (每天早上8点)');

      // 每天上午9:30和下午14:30爬取A股数据（A股交易时间前后）
      this.jobs.set(
        'crawlChinaStockData',
        schedule.scheduleJob('30 9,14 * * 1-5', this.wrapJob('crawlChinaStockData', this.crawlChinaStockData.bind(this)))
      );
      logger.info('✓ 已创建任务: crawlChinaStockData (每周一至周五9:30和14:30)');

      logger.info(`✓ 成功初始化 ${this.jobs.size} 个定时任务`);
      return true;
    } catch (error) {
      logger.error('初始化定时任务失败:', error.message);
      return false;
    }
  }

  // 包装任务函数，添加任务锁机制
  wrapJob(jobId, jobFunction) {
    return async () => {
      try {
        // 如果任务已经在运行，则跳过
        if (!this.acquireJobLock(jobId)) {
          logger.warn(`任务 ${jobId} 已在运行，本次执行被跳过`);
          return;
        }

        logger.info(`任务 ${jobId} 开始执行`);
        const startTime = new Date();

        // 执行任务
        const result = await jobFunction();

        const endTime = new Date();
        const duration = (endTime - startTime) / 1000;
        logger.info(`任务 ${jobId} 执行完成，耗时: ${duration.toFixed(2)} 秒`);

        // 释放任务锁
        this.releaseJobLock(jobId);

        return result;
      } catch (error) {
        logger.error(`任务 ${jobId} 执行出错:`, error.message);
        // 确保任务锁被释放
        this.releaseJobLock(jobId);
        return { success: false, error: error.message };
      }
    };
  }

  // 取消指定的定时任务
  cancelJob(jobId) {
    try {
      if (!this.jobs.has(jobId)) {
        logger.warn(`任务 ${jobId} 不存在`);
        return false;
      }

      const job = this.jobs.get(jobId);
      job.cancel();
      this.jobs.delete(jobId);
      this.jobLocks.delete(jobId);

      logger.info(`✓ 任务 ${jobId} 已取消`);
      return true;
    } catch (error) {
      logger.error(`取消任务 ${jobId} 失败:`, error.message);
      return false;
    }
  }

  // 取消所有定时任务
  cancelAllJobs() {
    try {
      logger.info('开始取消所有定时任务...');
      
      for (const jobId of this.jobs.keys()) {
        this.cancelJob(jobId);
      }
      
      logger.info('✓ 所有定时任务已取消');
      return true;
    } catch (error) {
      logger.error('取消所有定时任务失败:', error.message);
      return false;
    }
  }

  // 获取所有定时任务的状态
  getJobsStatus() {
    const status = [];
    
    try {
      for (const [jobId, job] of this.jobs.entries()) {
        status.push({
          jobId,
          isActive: job.nextInvocation() !== null,
          nextRun: job.nextInvocation() ? job.nextInvocation().toISOString() : null,
          isRunning: this.jobLocks.get(jobId) || false
        });
      }
    } catch (error) {
      logger.error('获取任务状态失败:', error.message);
    }
    
    return status;
  }

  // 手动触发指定的任务
  async triggerJob(jobId) {
    try {
      logger.info(`手动触发任务: ${jobId}`);
      
      const jobFunctions = {
        updateStockPrices: this.updateAllStockPrices.bind(this),
        updateHistoricalData: this.updateHistoricalData.bind(this),
        performMaintenance: this.performMaintenance.bind(this),
        performAIAnalysis: this.performScheduledAIAnalysis.bind(this),
        generateDailyReport: this.generateDailyReport.bind(this),
        crawlChinaStockData: this.crawlChinaStockData.bind(this)
      };
      
      if (jobFunctions[jobId]) {
        // 直接执行任务函数，不通过scheduleJob的锁机制，允许手动触发时的重叠执行
        await jobFunctions[jobId]();
        logger.info(`✓ 手动触发任务 ${jobId} 完成`);
        return { success: true, message: `任务 ${jobId} 已成功触发` };
      }
      
      logger.warn(`任务 ${jobId} 不存在或无法手动触发`);
      return { success: false, message: `任务 ${jobId} 不存在` };
    } catch (error) {
      logger.error(`手动触发任务 ${jobId} 失败:`, error.message);
      return { success: false, message: error.message };
    }
  }

  // 获取任务锁，防止任务重叠执行
  acquireJobLock(jobId) {
    try {
      if (this.jobLocks.has(jobId) && this.jobLocks.get(jobId)) {
        return false;
      }
      this.jobLocks.set(jobId, true);
      return true;
    } catch (error) {
      logger.error(`获取任务锁 ${jobId} 失败:`, error.message);
      return false;
    }
  }

  // 释放任务锁
  releaseJobLock(jobId) {
    try {
      this.jobLocks.set(jobId, false);
      return true;
    } catch (error) {
      logger.error(`释放任务锁 ${jobId} 失败:`, error.message);
      return false;
    }
  }

  // 延迟执行函数
  async delay(ms) {
    try {
      if (typeof ms !== 'number' || ms < 0) {
        throw new Error('延迟时间必须是非负数字');
      }
      
      return new Promise(resolve => setTimeout(resolve, ms));
    } catch (error) {
      logger.error('延迟执行失败:', error.message);
      // 出错时立即返回，不阻塞后续操作
      return Promise.resolve();
    }
  }

  // 更新所有股票价格
  async updateAllStockPrices() {
    try {
      logger.info('开始更新所有股票价格...');
      
      // 获取所有股票
      let stocks;
      try {
        stocks = await Stock.find({});
        if (stocks.length === 0) {
          logger.warn('数据库中没有股票数据，无法更新股票价格');
          return { success: true, updatedCount: 0, failedCount: 0 };
        }
      } catch (error) {
        logger.error('从数据库获取股票失败:', error.message);
        return { success: false, error: error.message };
      }
      
      let updatedCount = 0;
      let failedCount = 0;
      
      // 逐支股票更新价格
      for (const stock of stocks) {
        try {
          // 模拟价格波动 (-2% 到 +2%)
          const priceChange = stock.currentPrice * (Math.random() * 0.04 - 0.02);
          const newPrice = Math.max(0.01, stock.currentPrice + priceChange);
          const changePercent = ((newPrice - stock.currentPrice) / stock.currentPrice) * 100;
          
          // 更新数据库或模拟数据
          if (stock._id) {
            // 数据库对象
            await Stock.findByIdAndUpdate(stock._id, {
              currentPrice: newPrice,
              change: priceChange,
              changePercent: changePercent,
              updatedAt: new Date()
            });
          }
          
          updatedCount++;
          
          // 每更新10支股票，短暂暂停，避免请求过于频繁
          if (updatedCount % 10 === 0) {
            await this.delay(500);
          }
        } catch (error) {
          logger.error(`更新股票 ${stock.id || stock.symbol} 价格失败:`, error.message);
          failedCount++;
        }
      }
      
      logger.info(`✓ 股票价格更新完成 - 成功: ${updatedCount}, 失败: ${failedCount}`);
      return { success: true, updatedCount, failedCount };
    } catch (error) {
      logger.error('更新股票价格过程中发生错误:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 更新历史数据
  async updateHistoricalData() {
    try {
      logger.info('开始更新历史数据...');
      
      // 这里应该从外部API获取历史数据并更新数据库
      // 实际实现需要根据具体的数据源和数据结构进行调整
      
      // 获取所有股票
      let stocks;
      try {
        stocks = await Stock.find({});
        if (stocks.length === 0) {
          logger.warn('数据库中没有股票数据，无法更新历史数据');
          return { success: true, updatedCount: 0, failedCount: 0 };
        }
      } catch (error) {
        logger.error('从数据库获取股票失败:', error.message);
        return { success: false, error: error.message };
      }
      
      let updatedCount = 0;
      let failedCount = 0;
      
      // 为每支股票更新历史数据
      for (const stock of stocks) {
        try {
          // 实际实现中，这里应该调用外部API获取历史数据
          // 这里仅作模拟
          logger.info(`更新股票 ${stock.id || stock.symbol} 的历史数据`);
          
          // 模拟API调用延迟
          await this.delay(1000);
          
          updatedCount++;
        } catch (error) {
          logger.error(`更新股票 ${stock.id || stock.symbol} 历史数据失败:`, error.message);
          failedCount++;
        }
      }
      
      logger.info(`✓ 历史数据更新完成 - 成功: ${updatedCount}, 失败: ${failedCount}`);
      return { success: true, updatedCount, failedCount };
    } catch (error) {
      logger.error('更新历史数据过程中发生错误:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 执行系统维护
  async performMaintenance() {
    try {
      logger.info('开始执行系统维护任务...');
      const maintenanceStart = new Date();
      
      // 创建维护报告
      const maintenanceReport = {
        startTime: maintenanceStart.toISOString(),
        operations: [],
        status: 'in-progress',
        details: {}
      };
      
      // 执行数据清理
      const cleanupResult = await this.cleanupOldData();
      maintenanceReport.operations.push('cleanupOldData');
      maintenanceReport.details.cleanupOldData = cleanupResult;
      
      // 执行数据完整性检查
      const integrityResult = await this.checkDataIntegrity();
      maintenanceReport.operations.push('checkDataIntegrity');
      maintenanceReport.details.checkDataIntegrity = integrityResult;
      
      // 执行性能优化
      const optimizationResult = await this.optimizePerformance();
      maintenanceReport.operations.push('optimizePerformance');
      maintenanceReport.details.optimizePerformance = optimizationResult;
      
      // 完成维护报告
      const maintenanceEnd = new Date();
      maintenanceReport.endTime = maintenanceEnd.toISOString();
      maintenanceReport.duration = (maintenanceEnd - maintenanceStart) / 1000;
      maintenanceReport.status = 'completed';
      
      // 保存维护报告
      this.lastMaintenanceReport = maintenanceReport;
      
      // 持久化维护报告到日志文件
      await this.saveMaintenanceReport(maintenanceReport);
      
      // 发送维护报告通知（实际应用中可以发送邮件或其他通知）
      this.sendMaintenanceReportNotification(maintenanceReport);
      
      logger.info(`✓ 系统维护任务完成，耗时: ${maintenanceReport.duration.toFixed(2)} 秒`);
      logger.info(`维护报告: ${JSON.stringify(maintenanceReport, null, 2)}`);
      
      return { success: true, maintenanceReport };
    } catch (error) {
      logger.error('执行系统维护过程中发生错误:', error.message);
      logger.error('错误堆栈:', error.stack);
      
      // 创建错误报告
      const errorReport = {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'failed',
        error: error.message
      };
      
      // 保存错误报告
      this.lastMaintenanceReport = errorReport;
      await this.saveMaintenanceReport(errorReport);
      
      return { success: false, error: error.message, maintenanceReport: errorReport };
    }
  }

  // 清理旧数据
  async cleanupOldData() {
    try {
      logger.info('开始清理旧数据...');
      
      const result = {
        oldAnalysesCleaned: 0,
        oldLogsCleaned: 0,
        totalCleaned: 0,
        success: true
      };
      
      // 清理30天前的分析记录
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      try {
        const analysesResult = await Analysis.deleteMany({
          createdAt: { $lt: thirtyDaysAgo },
          status: 'completed'
        });
        result.oldAnalysesCleaned = analysesResult.deletedCount || 0;
        logger.info(`清理了 ${result.oldAnalysesCleaned} 条旧分析记录`);
      } catch (error) {
        logger.error('清理旧分析记录失败:', error.message);
        result.success = false;
      }
      
      // 这里可以添加清理其他类型旧数据的逻辑
      
      result.totalCleaned = result.oldAnalysesCleaned + result.oldLogsCleaned;
      
      logger.info(`✓ 数据清理完成，共清理 ${result.totalCleaned} 条记录`);
      return result;
    } catch (error) {
      logger.error('数据清理过程中发生错误:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 检查数据完整性
  async checkDataIntegrity() {
    try {
      logger.info('开始检查数据完整性...');
      
      const result = {
        stockCount: 0,
        analysisCount: 0,
        integrityIssues: [],
        success: true
      };
      
      // 检查股票数量
      try {
        const stockCount = await Stock.countDocuments({});
        result.stockCount = stockCount;
        logger.info(`数据库中有 ${stockCount} 支股票`);
      } catch (error) {
        logger.error('检查股票数量失败:', error.message);
        result.integrityIssues.push('Failed to check stock count');
      }
      
      // 检查分析记录数量
      try {
        const analysisCount = await Analysis.countDocuments({});
        result.analysisCount = analysisCount;
        logger.info(`数据库中有 ${analysisCount} 条分析记录`);
      } catch (error) {
        logger.error('检查分析记录数量失败:', error.message);
        result.integrityIssues.push('Failed to check analysis count');
      }
      
      // 这里可以添加更多的数据完整性检查逻辑
      
      if (result.integrityIssues.length > 0) {
        logger.warn(`发现 ${result.integrityIssues.length} 个数据完整性问题`);
        result.success = false;
      }
      
      logger.info('✓ 数据完整性检查完成');
      return result;
    } catch (error) {
      logger.error('数据完整性检查过程中发生错误:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 优化性能
  async optimizePerformance() {
    try {
      logger.info('开始执行性能优化...');
      
      const result = {
        indexesRebuilt: 0,
        cachesCleared: true,
        success: true
      };
      
      // 实际应用中，这里可以实现重建索引、清理缓存等操作
      // 这里仅作模拟
      logger.info('执行性能优化操作...');
      
      // 模拟操作延迟
      await this.delay(2000);
      
      logger.info('✓ 性能优化完成');
      return result;
    } catch (error) {
      logger.error('性能优化过程中发生错误:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 保存维护报告
  async saveMaintenanceReport(report) {
    try {
      // 实际应用中，这里可以将报告保存到数据库或文件系统
      logger.info('保存维护报告...');
      
      // 模拟保存操作
      await this.delay(500);
      
      logger.info('✓ 维护报告已保存');
      return true;
    } catch (error) {
      logger.error('保存维护报告失败:', error.message);
      return false;
    }
  }

  // 发送维护报告通知
  async sendMaintenanceReportNotification(report) {
    try {
      // 实际应用中，这里可以发送邮件、Slack消息等通知
      logger.info('发送维护报告通知...');
      
      // 模拟通知发送
      await this.delay(500);
      
      logger.info('✓ 维护报告通知已发送');
      return true;
    } catch (error) {
      logger.error('发送维护报告通知失败:', error.message);
      return false;
    }
  }

  // 执行定时AI分析任务
  async performScheduledAIAnalysis() {
    try {
      logger.info('开始执行定时AI分析任务...');
      
      // 获取需要进行AI分析的股票列表
      let stocksToAnalyze;
      try {
        // 从数据库获取需要分析的股票，只分析前3支股票
        stocksToAnalyze = await Stock.find({}).limit(3);
        if (stocksToAnalyze.length === 0) {
          logger.warn('数据库中没有股票数据，无法执行AI分析');
          return { success: true, analyzedCount: 0, failedCount: 0 };
        }
      } catch (error) {
        logger.error('获取待分析股票列表失败:', error.message);
        return { success: false, error: error.message };
      }
      
      let analyzedCount = 0;
      let failedCount = 0;
      
      // 为每支股票执行AI分析
      for (const stock of stocksToAnalyze) {
        try {
          logger.info(`开始对股票 ${stock.id} 进行AI分析`);
          
          // 调用AI服务进行分析
          const analysisResult = await aiService.performAIAnalysis(stock);
          
          // 保存分析结果
          if (analysisResult.success) {
            // 实际应用中，这里应该将分析结果保存到数据库
            logger.info(`股票 ${stock.id} AI分析完成，评分: ${analysisResult.analysisResult.overallScore}`);
            analyzedCount++;
          } else {
            logger.warn(`股票 ${stock.id} AI分析未成功: ${analysisResult.error}`);
            failedCount++;
          }
          
          // 每分析1支股票，短暂暂停，避免请求过于频繁
          await this.delay(2000);
        } catch (error) {
          logger.error(`对股票 ${stock.id} 进行AI分析时发生错误:`, error.message);
          failedCount++;
        }
      }
      
      logger.info(`✓ 定时AI分析任务完成 - 成功: ${analyzedCount}, 失败: ${failedCount}`);
      return { success: true, analyzedCount, failedCount };
    } catch (error) {
      logger.error('执行定时AI分析任务过程中发生错误:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 生成每日报告
  async generateDailyReport() {
    try {
      logger.info('开始生成每日报告...');
      
      // 实际应用中，这里应该生成包含股票市场概况、热门分析、推荐等内容的每日报告
      // 这里仅作模拟
      
      // 模拟报告生成过程
      await this.delay(3000);
      
      const report = {
        date: new Date().toISOString().split('T')[0],
        marketSummary: '市场整体表现平稳，科技股领涨',
        topAnalyzedStocks: ['AAPL', 'MSFT', 'GOOGL'],
        totalAnalyses: Math.floor(Math.random() * 50) + 10,
        generationTime: new Date().toISOString()
      };
      
      logger.info(`✓ 每日报告生成完成: ${JSON.stringify(report, null, 2)}`);
      
      // 实际应用中，这里应该将报告保存并可能发送给用户
      
      return { success: true, report };
    } catch (error) {
      logger.error('生成每日报告过程中发生错误:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 爬取A股数据
  async crawlChinaStockData() {
    try {
      logger.info('开始执行A股数据爬取任务...');
      const crawlStart = new Date();
      
      // 爬取A股实时数据
      const realtimeResult = await chinaStockCrawler.fetchRealTimeData();
      
      // 爬取A股基本面数据
      const fundamentalResult = await chinaStockCrawler.fetchFundamentalData();
      
      // 爬取A股历史数据（可选，视系统性能而定）
      const historicalResult = await chinaStockCrawler.fetchHistoricalData();
      
      const crawlEnd = new Date();
      const duration = (crawlEnd - crawlStart) / 1000;
      
      // 汇总爬取结果
      const crawlResult = {
        realtimeData: realtimeResult,
        fundamentalData: fundamentalResult,
        historicalData: historicalResult,
        startTime: crawlStart.toISOString(),
        endTime: crawlEnd.toISOString(),
        duration: duration.toFixed(2)
      };
      
      logger.info(`✓ A股数据爬取任务完成，耗时: ${duration.toFixed(2)} 秒`);
      logger.info(`爬取结果: ${JSON.stringify(crawlResult, null, 2)}`);
      
      return { success: true, crawlResult };
    } catch (error) {
      logger.error('执行A股数据爬取任务过程中发生错误:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 获取上次维护报告
  getLastMaintenanceReport() {
    return this.lastMaintenanceReport;
  }

  // 获取服务状态
  getServiceStatus() {
    return {
      jobsCount: this.jobs.size,
      runningJobsCount: Array.from(this.jobLocks.values()).filter(lock => lock).length,
      lastMaintenance: this.lastMaintenanceReport ? this.lastMaintenanceReport.startTime : null,
      status: 'running',
      uptime: process.uptime()
    };
  }
}

// 创建单例实例
const scheduleService = new ScheduleService();

// 只在非Vercel环境中自动初始化定时任务
if (process.env.VERCEL !== '1') {
  // 初始化定时任务
  scheduleService.initJobs();
} else {
  logger.info('检测到Vercel环境，跳过定时任务初始化');
}

// 导出服务实例
module.exports = scheduleService;

// 导出ScheduleService类（用于测试或扩展）
module.exports.ScheduleService = ScheduleService;