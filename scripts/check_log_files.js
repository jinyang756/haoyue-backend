const fs = require('fs');
const path = require('path');

// 获取今天的日期
const today = new Date();
const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD格式

// 日志目录
const logsDir = path.join(__dirname, 'logs');

console.log('检查日期:', todayStr);
console.log('日志目录:', logsDir);

// 检查日志目录是否存在
if (!fs.existsSync(logsDir)) {
  console.log('日志目录不存在！');
  process.exit(1);
}

// 列出日志目录中的所有文件
console.log('\n日志目录中的文件:');
try {
  const files = fs.readdirSync(logsDir);
  
  if (files.length === 0) {
    console.log('  日志目录为空');
  } else {
    files.forEach(file => {
      // 获取文件信息
      const stats = fs.statSync(path.join(logsDir, file));
      const fileDate = new Date(stats.mtime).toISOString().split('T')[0];
      
      // 检查文件是否是今天修改的
      const isToday = fileDate === todayStr;
      
      console.log(`  ${file} (修改日期: ${fileDate}) ${isToday ? '[今天]' : ''}`);
    });
  }
} catch (error) {
  console.error('读取日志目录失败:', error.message);
}

// 尝试直接检查今天应该有的日志文件
const expectedLogFiles = [
  `stock_price_update_${todayStr}.log`,
  `stock_history_update_${todayStr}.log`,
  `news_update_${todayStr}.log`,
  `technical_indicators_${todayStr}.log`
];

console.log('\n检查特定的今天日志文件:');
expectedLogFiles.forEach(filename => {
  const filePath = path.join(logsDir, filename);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${filename} 存在`);
    
    // 读取文件的前几行来验证内容
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').slice(0, 5); // 只读取前5行
      console.log(`    内容预览: ${lines.filter(l => l.trim()).join(' | ')}`);
    } catch (e) {
      console.log(`    无法读取文件内容: ${e.message}`);
    }
  } else {
    console.log(`  ✗ ${filename} 不存在`);
  }
});

console.log('\n检查完成！');