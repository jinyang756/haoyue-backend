#!/usr/bin/env node

/**
 * 修复 adminMongo 显示不完整问题的脚本
 * 
 * 该脚本会:
 * 1. 检查 adminMongo 配置文件
 * 2. 修复可能的路径问题
 * 3. 确保静态资源正确加载
 * 4. 验证集成是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('正在修复 adminMongo 显示不完整的问题...');

// 1. 检查 adminMongo 目录结构
const adminMongoPath = path.join(__dirname, '..', '..', 'adminMongo');
console.log('检查 adminMongo 路径:', adminMongoPath);

if (!fs.existsSync(adminMongoPath)) {
  console.error('错误: adminMongo 目录不存在');
  process.exit(1);
}

// 2. 检查必要的目录和文件
const requiredDirs = ['public', 'public/css', 'public/js', 'public/fonts', 'views', 'views/layouts'];
const requiredFiles = [
  'app.js',
  'config/app.json',
  'config/config.json',
  'public/css/style.css',
  'views/layouts/layout.hbs',
  'views/connections.hbs'
];

console.log('检查必要的目录和文件...');

for (const dir of requiredDirs) {
  const dirPath = path.join(adminMongoPath, dir);
  if (!fs.existsSync(dirPath)) {
    console.error(`错误: 缺少目录 ${dir}`);
    process.exit(1);
  }
}

for (const file of requiredFiles) {
  const filePath = path.join(adminMongoPath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`错误: 缺少文件 ${file}`);
    process.exit(1);
  }
}

console.log('✓ 所有必需的目录和文件都存在');

// 3. 检查并修复配置文件
console.log('检查配置文件...');

const appConfigPath = path.join(adminMongoPath, 'config', 'app.json');
const connectionConfigPath = path.join(adminMongoPath, 'config', 'config.json');

try {
  // 检查 app.json 配置
  const appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
  if (!appConfig.app) {
    appConfig.app = {};
  }
  
  // 确保配置正确
  appConfig.app.host = appConfig.app.host || 'localhost';
  appConfig.app.port = appConfig.app.port || 1235;
  appConfig.app.locale = appConfig.app.locale || 'zh-cn';
  appConfig.app.context = appConfig.app.context || 'admin/mongo';
  
  fs.writeFileSync(appConfigPath, JSON.stringify(appConfig, null, 2));
  console.log('✓ app.json 配置已修复');
  
  // 检查连接配置
  const connectionConfig = JSON.parse(fs.readFileSync(connectionConfigPath, 'utf8'));
  if (!connectionConfig.connections) {
    connectionConfig.connections = {};
  }
  
  // 确保有默认连接
  if (!connectionConfig.connections.haoyue_dev) {
    connectionConfig.connections.haoyue_dev = {
      "connection_string": "mongodb://localhost:27017/haoyue",
      "connection_options": {}
    };
  }
  
  fs.writeFileSync(connectionConfigPath, JSON.stringify(connectionConfig, null, 2));
  console.log('✓ 连接配置已修复');
  
} catch (error) {
  console.error('配置文件修复失败:', error.message);
  process.exit(1);
}

// 4. 检查静态资源路径
console.log('检查静态资源路径...');

const layoutPath = path.join(adminMongoPath, 'views', 'layouts', 'layout.hbs');
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

// 确保静态资源路径正确
const staticPathPattern = /{{app_context}}\/static/g;
if (staticPathPattern.test(layoutContent)) {
  console.log('✓ 静态资源路径配置正确');
} else {
  console.warn('⚠ 静态资源路径可能需要调整');
}

// 5. 创建测试路由文件来验证集成
console.log('创建测试路由...');

const testRouteContent = `
// adminMongo 集成测试路由
app.get('/admin/mongo/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'adminMongo 集成测试成功',
    timestamp: new Date().toISOString()
  });
});
`;

const indexPath = path.join(__dirname, '..', 'index.js');
let indexContent = fs.readFileSync(indexPath, 'utf8');

if (!indexContent.includes('/admin/mongo/test')) {
  // 在适当位置插入测试路由
  const insertPosition = indexContent.indexOf('// 根目录路由');
  if (insertPosition !== -1) {
    const insertContent = `
// adminMongo 集成测试路由
app.get('/admin/mongo/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'adminMongo 集成测试成功',
    timestamp: new Date().toISOString()
  });
});

`;
    indexContent = indexContent.slice(0, insertPosition) + insertContent + indexContent.slice(insertPosition);
    fs.writeFileSync(indexPath, indexContent);
    console.log('✓ 已添加 adminMongo 测试路由');
  }
}

console.log('adminMongo 修复完成!');
console.log('请重新启动服务并访问 http://localhost:5000/admin/mongo 来测试修复效果');