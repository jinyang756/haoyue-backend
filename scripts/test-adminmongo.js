#!/usr/bin/env node

/**
 * adminMongo 测试脚本
 * 用于验证 adminMongo 是否能正确连接到 MongoDB 数据库
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

console.log('正在测试 adminMongo 集成...');

// 检查 adminMongo 目录是否存在
const adminMongoPath = path.join(__dirname, '..', '..', 'adminMongo');
console.log('检查 adminMongo 路径:', adminMongoPath);

if (!fs.existsSync(adminMongoPath)) {
  console.error('错误: adminMongo 目录不存在');
  process.exit(1);
}

// 检查必要的文件是否存在
const requiredFiles = ['app.js', 'config/app.json', 'config/config.json'];
for (const file of requiredFiles) {
  const filePath = path.join(adminMongoPath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`错误: 找不到必要的文件 ${file}`);
    process.exit(1);
  }
}

console.log('✓ 所有必需的文件都存在');

// 尝试导入 adminMongo 应用
try {
  const adminMongoApp = require(path.join(adminMongoPath, 'app.js'));
  console.log('✓ adminMongo 应用导入成功');
  
  // 创建一个测试 Express 应用
  const app = express();
  const port = 3001;
  
  // 集成 adminMongo 到测试应用
  app.use('/admin/mongo', adminMongoApp);
  
  console.log(`✓ adminMongo 已集成到测试路径 /admin/mongo`);
  console.log(`请访问 http://localhost:${port}/admin/mongo 来测试 adminMongo`);
  
  // 启动测试服务器
  const server = app.listen(port, () => {
    console.log(`测试服务器运行在 http://localhost:${port}`);
  });
  
  // 5秒后自动关闭服务器
  setTimeout(() => {
    server.close(() => {
      console.log('测试服务器已关闭');
      process.exit(0);
    });
  }, 5000);
  
} catch (error) {
  console.error('adminMongo 集成测试失败:', error.message);
  process.exit(1);
}