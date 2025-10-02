const app = require('../index.js');

// Vercel需要导出一个处理函数
module.exports = (req, res) => {
  // 确保在Vercel环境中正确处理请求
  if (!req || !res) {
    console.error('Invalid request or response object');
    return;
  }
  
  // 将请求传递给Express应用处理
  return app(req, res);
};