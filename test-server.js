const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 解析JSON
app.use(express.json());

// 静态文件服务
app.use(express.static(path.join(__dirname, '../haoyue-frontend/build')));

// 简单的API路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: '测试服务器运行正常',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: '这是来自测试服务器的响应',
    data: {
      id: 1,
      name: '测试数据',
      value: 123.45
    }
  });
});

// 所有其他路由都返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../haoyue-frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`测试服务器运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 查看前端应用`);
  console.log(`API测试端点: http://localhost:${PORT}/api/test`);
});