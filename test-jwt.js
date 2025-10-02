require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('测试 JWT 功能:');

try {
  // 测试生成 token
  const payload = { id: 'test-user-id', role: 'user' };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log('✅ JWT Token 生成成功');
  console.log('Token:', token.substring(0, 20) + '...');

  // 测试验证 token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('✅ JWT Token 验证成功');
  console.log('Decoded:', decoded);

  // 测试刷新 token
  const refreshToken = jwt.sign({ id: 'test-user-id' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  console.log('✅ Refresh Token 生成成功');
  console.log('Refresh Token:', refreshToken.substring(0, 20) + '...');

  // 测试验证刷新 token
  const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  console.log('✅ Refresh Token 验证成功');
  console.log('Decoded Refresh:', decodedRefresh);

} catch (error) {
  console.error('❌ JWT 测试失败:', error.message);
}