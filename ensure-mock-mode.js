// 确保在数据库连接失败时使用模拟数据模式
require('dotenv').config();
const { isMongoDBConnected } = require('./config/db');
const { mockUsers, mockStocks } = require('./utils/mockDataManager');

console.log('🔧 确保模拟数据模式');
console.log('====================');

// 检查数据库连接状态
const isConnected = isMongoDBConnected();
console.log('数据库连接状态:', isConnected ? '已连接' : '未连接');

if (!isConnected) {
  console.log('⚠️  数据库未连接，将使用模拟数据模式');
  console.log('👤 模拟用户数量:', mockUsers.length);
  console.log('📈 模拟股票数量:', mockStocks.length);
  
  // 设置环境变量以确保使用模拟数据
  process.env.MOCK_MODE = 'true';
  console.log('✅ 已设置MOCK_MODE=true');
} else {
  console.log('✅ 数据库已连接，使用真实数据');
}

// 验证关键API端点
console.log('\n🔍 验证API端点:');
console.log('  - GET /api/stocks (获取股票列表)');
console.log('  - GET /api/stocks/:symbol (获取股票详情)');
console.log('  - POST /api/auth/login (用户登录)');
console.log('  - GET /api/auth/me (获取当前用户)');

console.log('\n💡 提示:');
console.log('  前端页面空白可能是因为:');
console.log('  1. 数据库连接失败导致无法获取真实数据');
console.log('  2. 前端期望的数据格式与后端返回不匹配');
console.log('  3. 前端组件未正确处理模拟数据');