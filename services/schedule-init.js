/**
 * 定时任务初始化脚本
 * 负责初始化和启动所有定时任务
 */
const logger = require('../utils/logger');
const scheduleService = require('./schedule.service');
const db = require('../config/db');

/**
 * 初始化定时任务系统
 * @returns {Promise<boolean>} - 是否初始化成功
 */
async function initializeScheduleSystem() {
  try {
    logger.info('===== 开始初始化定时任务系统 =====');
    
    // 确保数据库已连接
    const isDbConnected = await ensureDatabaseConnection();
    if (!isDbConnected) {
      logger.error('数据库连接失败，无法初始化定时任务系统');
      return false;
    }
    
    // 初始化所有定时任务
    const isInitialized = scheduleService.initJobs();
    
    if (isInitialized) {
      logger.info('===== 定时任务系统初始化成功 =====');
      
      // 记录初始化后的任务状态
      const jobsStatus = scheduleService.getJobsStatus();
      logger.info(`当前定时任务状态: ${JSON.stringify(jobsStatus, null, 2)}`);
      
      // 可选：手动触发一次A股数据爬取任务，用于测试
      // await scheduleService.triggerJob('crawlChinaStockData');
      
      return true;
    } else {
      logger.error('===== 定时任务系统初始化失败 =====');
      return false;
    }
  } catch (error) {
    logger.error('初始化定时任务系统时发生错误:', error.message);
    logger.error('错误堆栈:', error.stack);
    return false;
  }
}

/**
 * 确保数据库已连接
 * @returns {Promise<boolean>} - 数据库是否已连接
 */
async function ensureDatabaseConnection() {
  try {
    logger.info('检查数据库连接状态...');
    
    // 尝试获取数据库连接状态
    const connectionState = db.connection.readyState;
    
    if (connectionState === 1) {
      // 1表示已连接
      logger.info('数据库已连接');
      return true;
    } else if (connectionState === 0 || connectionState === 2) {
      // 0表示未连接，2表示正在连接
      logger.info('等待数据库连接...');
      
      // 设置连接超时
      const connectionTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('数据库连接超时')), 30000);
      });
      
      // 等待连接成功
      await Promise.race([
        new Promise(resolve => {
          db.connection.once('connected', () => {
            logger.info('数据库连接成功');
            resolve(true);
          });
          db.connection.once('error', error => {
            logger.error('数据库连接错误:', error.message);
            resolve(false);
          });
        }),
        connectionTimeout
      ]);
      
      return db.connection.readyState === 1;
    } else {
      logger.warn(`数据库连接状态未知: ${connectionState}`);
      return false;
    }
  } catch (error) {
    logger.error('检查数据库连接状态时发生错误:', error.message);
    return false;
  }
}

/**
 * 关闭定时任务系统
 * @returns {boolean} - 是否关闭成功
 */
function shutdownScheduleSystem() {
  try {
    logger.info('===== 开始关闭定时任务系统 =====');
    
    // 取消所有定时任务
    const isCanceled = scheduleService.cancelAllJobs();
    
    if (isCanceled) {
      logger.info('===== 定时任务系统关闭成功 =====');
      return true;
    } else {
      logger.error('===== 定时任务系统关闭失败 =====');
      return false;
    }
  } catch (error) {
    logger.error('关闭定时任务系统时发生错误:', error.message);
    return false;
  }
}

/**
 * 处理进程终止信号
 */
function setupProcessHandlers() {
  // 监听SIGINT信号（Ctrl+C）
  process.on('SIGINT', () => {
    logger.info('收到终止信号，正在关闭定时任务系统...');
    shutdownScheduleSystem();
    // 延迟退出，确保任务关闭完成
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  });
  
  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error.message);
    logger.error('错误堆栈:', error.stack);
    // 发生严重错误时，尝试优雅关闭系统
    try {
      shutdownScheduleSystem();
    } catch (shutdownError) {
      logger.error('关闭系统时发生错误:', shutdownError.message);
    }
    // 1秒后强制退出
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });
}

/**
 * 导出函数和方法
 */
module.exports = {
  initializeScheduleSystem,
  shutdownScheduleSystem,
  setupProcessHandlers
};

/**
 * 如果直接运行此脚本，则初始化定时任务系统
 */
if (require.main === module) {
  (async () => {
    setupProcessHandlers();
    await initializeScheduleSystem();
  })();
}