#!/usr/bin/env node

/**
 * 测试Vercel环境中Swagger文档是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('开始测试Vercel环境中Swagger文档配置...');

// 检查Swagger JSON文件是否存在
const swaggerFilePath = path.join(__dirname, '../build/swagger.json');
console.log(`检查Swagger文件: ${swaggerFilePath}`);

if (fs.existsSync(swaggerFilePath)) {
  console.log('✓ Swagger JSON文件存在');
  
  try {
    const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8');
    const swaggerJson = JSON.parse(swaggerContent);
    
    console.log('✓ Swagger JSON文件格式正确');
    console.log(`  - API版本: ${swaggerJson.info?.version}`);
    console.log(`  - API标题: ${swaggerJson.info?.title}`);
    console.log(`  - 路由数量: ${Object.keys(swaggerJson.paths || {}).length}`);
    
    // 检查关键路由是否存在（使用相对路径）
    const keyRoutes = ['/register', '/login', '/'];
    keyRoutes.forEach(route => {
      if (swaggerJson.paths && swaggerJson.paths[route]) {
        console.log(`  ✓ 路由文档存在: ${route}`);
      } else {
        console.log(`  ✗ 路由文档缺失: ${route}`);
      }
    });
  } catch (error) {
    console.error('✗ Swagger JSON文件解析失败:', error.message);
  }
} else {
  console.log('✗ Swagger JSON文件不存在');
  console.log('  请运行 "npm run build-docs" 生成Swagger文档');
}

// 检查Vercel配置
const vercelConfigPath = path.join(__dirname, '../vercel.json');
console.log(`\n检查Vercel配置: ${vercelConfigPath}`);

if (fs.existsSync(vercelConfigPath)) {
  console.log('✓ Vercel配置文件存在');
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    
    // 检查路由配置
    if (vercelConfig.routes) {
      console.log('✓ Vercel路由配置存在');
      
      // 检查Swagger相关路由
      const swaggerRoutes = vercelConfig.routes.filter(route => 
        route.src.includes('/api/docs')
      );
      
      if (swaggerRoutes.length > 0) {
        console.log('✓ Swagger路由配置存在');
        swaggerRoutes.forEach(route => {
          console.log(`  - ${route.src} -> ${route.dest}`);
        });
      } else {
        console.log('✗ Swagger路由配置缺失');
      }
    } else {
      console.log('✗ Vercel路由配置缺失');
    }
  } catch (error) {
    console.error('✗ Vercel配置文件解析失败:', error.message);
  }
} else {
  console.log('✗ Vercel配置文件不存在');
}

console.log('\n测试完成。如果所有检查都通过，Swagger文档应该在Vercel环境中正常工作。');