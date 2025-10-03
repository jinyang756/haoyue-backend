#!/usr/bin/env node

/**
 * 验证 adminMongo 是否正常工作的脚本
 */

const http = require('http');

console.log('正在验证 adminMongo 是否正常工作...');

// 测试 adminMongo 主页
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/admin/mongo',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`adminMongo 主页响应状态码: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    console.log('✓ adminMongo 主页可以正常访问');
    
    // 检查响应头
    if (res.headers['content-type'] && res.headers['content-type'].includes('text/html')) {
      console.log('✓ 响应内容类型正确 (text/html)');
    } else {
      console.log('⚠ 响应内容类型可能不正确');
    }
  } else {
    console.log('⚠ adminMongo 主页访问可能存在问题');
  }
  
  // 读取部分响应数据来检查内容
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    // 只读取前1000个字符来检查
    if (data.length > 1000) {
      res.destroy(); // 停止读取更多数据
    }
  });
  
  res.on('end', () => {
    // 检查是否包含 adminMongo 的特征内容
    if (data.includes('adminMongo') || data.includes('MongoDB')) {
      console.log('✓ 响应内容包含 adminMongo 特征');
    } else {
      console.log('⚠ 响应内容不包含 adminMongo 特征');
    }
    
    // 测试测试路由
    testTestRoute();
  });
});

req.on('error', (error) => {
  console.error('adminMongo 主页测试失败:', error.message);
  console.log('请确保后端服务正在运行');
  
  // 仍然测试测试路由
  testTestRoute();
});

req.end();

// 测试 adminMongo 测试路由
function testTestRoute() {
  console.log('\n正在测试 adminMongo 测试路由...');
  
  const testOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/admin/mongo/test',
    method: 'GET'
  };
  
  const testReq = http.request(testOptions, (res) => {
    console.log(`adminMongo 测试路由响应状态码: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('✓ adminMongo 测试路由正常工作');
      
      // 读取响应数据
      let testData = '';
      res.on('data', (chunk) => {
        testData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(testData);
          if (jsonData.status === 'success' && jsonData.message.includes('adminMongo')) {
            console.log('✓ 测试路由返回了正确的响应');
            console.log('\n🎉 adminMongo 集成验证完成!');
          } else {
            console.log('⚠ 测试路由返回了意外的响应');
          }
        } catch (parseError) {
          console.log('⚠ 无法解析测试路由的响应');
        }
      });
    } else {
      console.log('⚠ adminMongo 测试路由可能存在问题');
    }
  });
  
  testReq.on('error', (error) => {
    console.error('adminMongo 测试路由测试失败:', error.message);
  });
  
  testReq.end();
}