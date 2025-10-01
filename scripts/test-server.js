// 简化的服务器测试脚本，用于排查崩溃问题
const express = require('express');
const { connectDB, closeDB } = require('./config/db');
const { logger } = require('./utils/logger');

// 增加全局错误处理，捕获未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  console.error('堆栈跟踪:', error.stack);
  process.exit(1);
});

// 增加全局Promise拒绝处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;

async function startTestServer() {
  try {
    console.log('开始启动测试服务器...');
    
    // 连接数据库
    console.log('尝试连接MongoDB...');
    const dbConnection = await connectDB();
    console.log('MongoDB连接状态:', dbConnection ? '成功' : '失败');
    
    // 简单的健康检查路由
    app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: { connected: true }
      });
    });
    
    // 启动服务器
    const server = app.listen(PORT, () => {
      console.log(`测试服务器运行在 http://localhost:${PORT}`);
      console.log('请访问 /health 端点测试服务器');
    });
    
    // 优雅关闭
    const shutdown = async () => {
      console.log('正在关闭服务器...');
      await server.close();
      await closeDB();
      console.log('服务器和数据库连接已关闭');
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
  } catch (error) {
    console.error('服务器启动失败:', error);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  }
}

// 启动测试服务器
startTestServer();