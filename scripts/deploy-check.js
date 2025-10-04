#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 检查部署前必需的文件和配置是否正确
 */

const fs = require('fs');
const path = require('path');

// 检查文件是否存在
function checkFileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

// 检查目录是否存在
function checkDirExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// 检查必需的文件
const requiredFiles = [
  'package.json',
  'package-lock.json',
  'vercel.json',
  'README.md',
  'CHANGELOG.md',
  '.gitignore',
  'index.js',
  'swagger.js',
  'tsoa.json'
];

// 检查必需的目录
const requiredDirs = [
  'api',
  'config',
  'controllers',
  'middleware',
  'models',
  'routes',
  'services',
  'utils'
];

console.log('🚀 开始部署前检查...\n');

let hasError = false;

// 检查根目录文件
console.log('📁 检查必需的文件...');
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (checkFileExists(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} (缺失)`);
    hasError = true;
  }
}

console.log('');

// 检查必需的目录
console.log('📂 检查必需的目录...');
for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (checkDirExists(dirPath)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} (缺失)`);
    hasError = true;
  }
}

console.log('');

// 检查环境变量文件
console.log('⚙️  检查环境变量配置...');
const envExamplePath = path.join(__dirname, '..', '.env.example');
if (checkFileExists(envExamplePath)) {
  console.log('  ✅ .env.example');
} else {
  console.log('  ❌ .env.example (缺失)');
  hasError = true;
}

console.log('');

// 检查不应该包含在Git中的文件
console.log('🚫 检查不应该包含在Git中的文件...');
const shouldNotInclude = [
  '.env',
  '.env.local',
  '.env.development.local',
  '.env.test.local',
  '.env.production.local',
  'node_modules',
  'logs'
];

for (const item of shouldNotInclude) {
  const itemPath = path.join(__dirname, '..', item);
  if (checkFileExists(itemPath) || checkDirExists(itemPath)) {
    console.log(`  ⚠️  ${item} (应该在.gitignore中)`);
  } else {
    console.log(`  ✅ ${item} (正确忽略)`);
  }
}

console.log('');

// 检查Vercel相关配置
console.log('🔧 检查Vercel相关配置...');
const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');
if (checkFileExists(vercelJsonPath)) {
  console.log('  ✅ vercel.json');
} else {
  console.log('  ❌ vercel.json (缺失)');
  hasError = true;
}

console.log('');

// 检查Netlify相关配置是否已清理
console.log('🧹 检查Netlify相关配置清理...');
const netlifyItems = [
  'netlify.toml'
];

let netlifyClean = true;
for (const item of netlifyItems) {
  const itemPath = path.join(__dirname, '..', item);
  if (checkFileExists(itemPath)) {
    console.log(`  ❌ ${item} (Netlify相关配置未清理)`);
    netlifyClean = false;
    hasError = true;
  }
}

if (netlifyClean) {
  console.log('  ✅ Netlify相关配置已清理');
}

// 检查package.json中是否包含Vercel相关依赖
console.log('📦 检查Vercel相关依赖...');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (checkFileExists(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  let hasVercelDeps = false;
  
  // 检查dependencies
  if (packageJson.dependencies) {
    for (const dep in packageJson.dependencies) {
      if (dep.includes('vercel')) {
        hasVercelDeps = true;
        break;
      }
    }
  }
  
  // 检查devDependencies
  if (packageJson.devDependencies) {
    for (const dep in packageJson.devDependencies) {
      if (dep.includes('vercel')) {
        hasVercelDeps = true;
        break;
      }
    }
  }
  
  if (hasVercelDeps) {
    console.log('  ✅ 包含Vercel相关依赖');
  } else {
    console.log('  ⚠️  未发现Vercel相关依赖（可能需要安装@vercel/node）');
  }
} else {
  console.log('  ❌ package.json (缺失)');
  hasError = true;
}

console.log('');

// 最终检查结果
if (hasError) {
  console.log('❌ 部署前检查失败，请修复上述问题后再部署。');
  process.exit(1);
} else {
  console.log('✅ 部署前检查通过，可以进行部署。');
  process.exit(0);
}