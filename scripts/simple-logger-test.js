// 简单的logger测试脚本

// 模拟Vercel环境变量
process.env.VERCEL = '1';

// 尝试直接引入模块
console.log('尝试直接引入winston模块...');
try {
  const winston = require('winston');
  console.log('winston模块引入成功！版本:', winston.version || '未知');
} catch (error) {
  console.error('winston模块引入失败:', error);
}

console.log('\n测试完成。');