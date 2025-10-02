// 模拟Vercel无服务器环境
process.env.VERCEL = '1';

// 引入修复后的logger模块
const { logger } = require('./utils/logger');

console.log('开始测试修复后的logger.js文件...');
console.log('当前环境: 模拟无服务器环境 (VERCEL=1)');

// 测试不同级别的日志输出
try {
  logger.info('这是一条信息日志');
  logger.warn('这是一条警告日志');
  logger.error('这是一条错误日志');
  
  // 测试带元数据的日志
  logger.info('带元数据的日志', { userId: '123', action: 'test' });
  
  // 测试错误对象
  const testError = new Error('测试错误');
  logger.error('记录错误对象', testError);
  
  console.log('\n✅ 所有日志测试完成，没有出现崩溃错误。');
  console.log('✅ Logger模块在无服务器环境中正常工作。');
} catch (error) {
  console.error('❌ 测试失败:', error.message);
  console.error(error.stack);
}