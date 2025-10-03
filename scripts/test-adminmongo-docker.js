#!/usr/bin/env node

/**
 * Docker 环境下 adminMongo 测试脚本
 * 用于验证 Docker 环境中 adminMongo 是否能正确连接到 MongoDB 数据库
 */

const http = require('http');

console.log('正在测试 Docker 环境下的 adminMongo 集成...');

// 测试 adminMongo 是否可访问
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/admin/mongo',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`adminMongo 响应状态码: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✓ adminMongo 在 Docker 环境中正常工作');
    console.log('请访问 http://localhost:5000/admin/mongo 来使用 adminMongo');
  } else {
    console.log('⚠ adminMongo 可能存在问题，请检查日志');
  }
  
  // 读取响应数据
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    // 检查是否包含 adminMongo 的特征内容
    if (data.includes('adminMongo') || data.includes('MongoDB')) {
      console.log('✓ 响应内容包含 adminMongo 特征，集成成功');
    } else {
      console.log('⚠ 响应内容不包含 adminMongo 特征，可能需要进一步检查');
    }
    
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('adminMongo 测试失败:', error.message);
  console.log('请确保 Docker 环境已启动并且后端服务正在运行');
  process.exit(1);
});

req.end();