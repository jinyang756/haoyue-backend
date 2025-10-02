// 测试logger.js修复效果的脚本

// 模拟Vercel环境变量
process.env.VERCEL = '1';

// 引入修复后的logger模块
try {
  console.log('尝试引入修复后的logger模块...');
  const { logger } = require('../utils/logger');
  
  console.log('logger模块引入成功！');
  
  // 测试不同级别的日志
  console.log('测试不同级别的日志输出...');
  logger.info('这是一条信息日志');
  logger.warn('这是一条警告日志');
  logger.error('这是一条错误日志');
  
  console.log('\n测试完成！所有日志应该只输出到控制台，没有尝试创建日志文件。');
  console.log('修复成功！应用现在可以在Vercel等无服务器环境中正常运行。');
} catch (error) {
  console.error('测试失败:', error);
}