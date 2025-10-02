const fs = require('fs');
const path = require('path');

// 路由文件映射
const routeFiles = [
  { file: 'auth.routes.js', prefix: '/api/auth' },
  { file: 'user.routes.js', prefix: '/api/users' },
  { file: 'stock.routes.js', prefix: '/api/stocks' },
  { file: 'analysis.routes.js', prefix: '/api/analysis' },
  { file: 'recommendation.routes.js', prefix: '/api/recommendations' },
  { file: 'news.routes.js', prefix: '/api/news' }
];

// 遍历所有路由文件并修复Swagger路径
routeFiles.forEach(({ file, prefix }) => {
  const filePath = path.join(__dirname, '../routes', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 匹配Swagger路径注释
    const swaggerPathRegex = /\/\*\*\s*\n\s*\*\s*@swagger\s*\n\s*\*\s*(\/[^\s*]+):\s*\n/g;
    
    // 替换完整的API路径为相对路径
    content = content.replace(swaggerPathRegex, (match, fullPath) => {
      if (fullPath.startsWith(prefix)) {
        const relativePath = fullPath.substring(prefix.length) || '/';
        return match.replace(fullPath, relativePath);
      }
      return match;
    });
    
    // 写入修改后的内容
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ 已修复 ${file} 中的Swagger路径`);
  } else {
    console.log(`✗ 文件不存在: ${filePath}`);
  }
});

console.log('所有路由文件的Swagger路径修复完成！');