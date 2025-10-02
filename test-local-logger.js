// 模拟本地开发环境
process.env.NODE_ENV = 'development';

// 引入修复后的logger模块
const { logger } = require('./utils/logger');

console.log('开始测试修复后的logger.js文件（本地环境）...');
console.log('当前环境: 本地开发环境 (NODE_ENV=development)');

// 测试不同级别的日志输出
try {
  logger.info('这是一条本地环境的信息日志');
  logger.warn('这是一条本地环境的警告日志');
  logger.error('这是一条本地环境的错误日志');
  
  // 测试带元数据的日志
  logger.info('本地环境带元数据的日志', { userId: '456', action: 'local-test' });
  
  console.log('\n✅ 本地环境日志测试完成');
  console.log('✅ 检查logs目录是否已创建，并查看是否生成了日志文件');
} catch (error) {
  console.error('❌ 本地环境测试失败:', error.message);
  console.error(error.stack);
}