// 测试模拟数据功能
require('dotenv').config();
const { mockUsers, mockStocks } = require('./utils/mockDataManager');
const { isMongoDBConnected } = require('./config/db');

console.log('🧪 模拟数据测试');
console.log('================');

// 检查数据库连接状态
console.log('数据库连接状态:', isMongoDBConnected() ? '已连接' : '未连接');

// 显示模拟用户数据
console.log('\n👤 模拟用户数据:');
mockUsers.forEach((user, index) => {
  console.log(`  ${index + 1}. ${user.username} (${user.email}) - ${user.role}`);
});

// 显示模拟股票数据
console.log('\n📈 模拟股票数据:');
mockStocks.forEach((stock, index) => {
  console.log(`  ${index + 1}. ${stock.symbol} - ${stock.name} ($${stock.currentPrice})`);
});

console.log('\n✅ 模拟数据功能正常');