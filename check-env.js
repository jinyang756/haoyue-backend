require('dotenv').config();

console.log('环境变量检查:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '已配置' : '未配置');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '已配置' : '未配置');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '已配置' : '未配置');

if (process.env.JWT_SECRET) {
  console.log('JWT_SECRET 长度:', process.env.JWT_SECRET.length);
}

if (process.env.JWT_REFRESH_SECRET) {
  console.log('JWT_REFRESH_SECRET 长度:', process.env.JWT_REFRESH_SECRET.length);
}