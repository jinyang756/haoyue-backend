const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { logger } = require('../utils/logger');

// 加载环境变量
dotenv.config({ path: '.env.test' });

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 简单的测试路由
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: '测试服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

// 健康检查路由
app.get('/api/health', async (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 模拟错误路由
app.get('/api/error', (req, res) => {
  throw new Error('这是一个测试错误');
});

// 数据库连接函数
async function connectDB() {
  try {
    logger.info('正在连接到测试数据库...');
    
    await mongoose.connect(process.env.MONGO_URI_TEST, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    logger.info('✓ 测试数据库连接成功');
    return true;
  } catch (error) {
    logger.error('✗ 测试数据库连接失败:', error.message);
    
    // 在测试环境中，如果数据库连接失败，我们仍然可以运行服务器进行API测试
    logger.warn('警告: 数据库连接失败，但测试服务器仍将继续运行');
    return false;
  }
}

// 关闭数据库连接
async function closeDB() {
  try {
    if (mongoose.connection.readyState === 1) {
      logger.info('正在关闭数据库连接...');
      await mongoose.connection.close();
      logger.info('✓ 数据库连接已关闭');
      return true;
    }
    logger.info('数据库连接已经关闭或未建立');
    return true;
  } catch (error) {
    logger.error('关闭数据库连接时出错:', error.message);
    // 即使关闭失败也不抛出异常，继续执行其他清理操作
    return false;
  }
}

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDB();
    
    // 启动服务器
    const PORT = process.env.TEST_PORT || 5001;
    const server = app.listen(PORT, () => {
      logger.info(`✓ 测试服务器已启动在端口: ${PORT}`);
      logger.info(`测试环境: ${process.env.NODE_ENV || 'development'}`);
    });
    
    // 保存服务器实例以便后续关闭
    app.locals.server = server;
    
    // 设置全局错误处理
    setupErrorHandlers(app);
    
    // 监听进程信号，优雅关闭
    setupGracefulShutdown(server);
    
    return server;
  } catch (error) {
    logger.error('✗ 启动测试服务器失败:', error.message);
    logger.error('错误堆栈:', error.stack);
    
    // 尝试优雅关闭
    await shutdown();
    
    // 由于这是测试服务器，如果启动失败，我们仍然返回一个拒绝的Promise
    throw error;
  }
}

// 设置全局错误处理
function setupErrorHandlers(app) {
  // 处理404错误
  app.use((req, res, next) => {
    const error = new Error(`请求的资源未找到: ${req.originalUrl}`);
    error.status = 404;
    next(error);
  });

  // 全局错误处理中间件
  app.use((err, req, res, next) => {
    const statusCode = err.status || 500;
    const errorMessage = err.message || '服务器错误';
    
    logger.error(`错误 [${statusCode}]: ${errorMessage}`);
    logger.error('错误堆栈:', err.stack);
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack
      })
    });
  });
}

// 设置优雅关闭
function setupGracefulShutdown(server) {
  // 监听SIGINT信号 (Ctrl+C)
  process.on('SIGINT', async () => {
    logger.info('接收到中断信号，正在优雅关闭服务器...');
    await shutdown();
  });

  // 监听SIGTERM信号 (通常由系统发送)
  process.on('SIGTERM', async () => {
    logger.info('接收到终止信号，正在优雅关闭服务器...');
    await shutdown();
  });

  // 监听未捕获的异常
  process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error.message);
    logger.error('错误堆栈:', error.stack);
    // 给一些时间记录日志，然后关闭
    setTimeout(() => shutdown(), 1000);
  });

  // 监听未处理的Promise拒绝
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝:', reason);
    logger.error('Promise:', promise);
    // 给一些时间记录日志，然后关闭
    setTimeout(() => shutdown(), 1000);
  });
}

// 优雅关闭服务器和资源
async function shutdown() {
  try {
    logger.info('开始优雅关闭测试服务器...');
    
    // 创建关闭操作的Promise数组
    const shutdownPromises = [];
    
    // 关闭服务器
    if (app.locals.server) {
      shutdownPromises.push(new Promise((resolve) => {
        try {
          app.locals.server.close((err) => {
            if (err) {
              logger.error('关闭服务器时出错:', err.message);
            } else {
              logger.info('✓ 测试服务器已关闭');
            }
            resolve();
          });
        } catch (err) {
          logger.error('执行服务器关闭时出错:', err.message);
          resolve();
        }
      }));
    }
    
    // 关闭数据库连接
    shutdownPromises.push(closeDB());
    
    // 等待所有关闭操作完成，设置超时
    try {
      await Promise.all(shutdownPromises);
    } catch (err) {
      logger.error('执行关闭操作时出错:', err.message);
      // 即使有错误也继续，尽量关闭更多资源
    }
    
    // 确保所有日志都已写入
    await flushLogs();
    
    logger.info('✓ 所有资源已成功关闭');
    
    // 延迟退出，确保所有异步操作完成
    setTimeout(() => {
      process.exit(0);
    }, 500);
    
  } catch (error) {
    logger.error('优雅关闭过程中发生错误:', error.message);
    logger.error('错误堆栈:', error.stack);
    
    // 即使在关闭过程中出错，也要确保进程最终退出
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

// 确保日志已刷新到磁盘
async function flushLogs() {
  try {
    // 给日志系统一些时间来刷新缓冲区
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  } catch (error) {
    logger.error('刷新日志时出错:', error.message);
    return false;
  }
}

// 如果直接运行此脚本，则启动服务器
if (require.main === module) {
  startServer().catch(error => {
    logger.error('启动测试服务器失败，退出进程');
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
  shutdown,
  connectDB,
  closeDB
};