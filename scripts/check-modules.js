const fs = require('fs');
const path = require('path');

// 配置要检查的模块列表
const modulesToCheck = [
  { name: 'mongoose', type: 'core' },
  { name: 'express', type: 'core' },
  { name: 'express-validator', type: 'middleware' },
  { name: 'axios', type: 'http' },
  { name: 'bcryptjs', type: 'security' },
  { name: 'jsonwebtoken', type: 'security' },
  { name: 'cors', type: 'middleware' },
  { name: 'dotenv', type: 'config' },
  { name: 'winston', type: 'logging' },
  { name: 'node-schedule', type: 'scheduling' },
  { name: 'swagger-jsdoc', type: 'documentation' },
  { name: 'swagger-ui-express', type: 'documentation' },
  { name: '@vercel/functions', type: 'deployment' }
];

// 定义每种模块类型预期的导出内容
const expectedExports = {
  mongoose: { has: ['Schema', 'model', 'connect', 'Types'] },
  express: { has: ['Router', 'json', 'urlencoded', 'static'] },
  'express-validator': { has: ['check', 'validationResult', 'body'] },
  axios: { has: ['get', 'post', 'put', 'delete', 'create'] },
  bcryptjs: { has: ['hash', 'compare', 'genSalt'] },
  jsonwebtoken: { has: ['sign', 'verify', 'decode'] },
  cors: { isFunction: true },
  dotenv: { has: ['config', 'parse'] },
  winston: { has: ['createLogger', 'format', 'transports'] },
  'node-schedule': { has: ['scheduleJob', 'cancelJob'] },
  'swagger-jsdoc': { isFunction: true },
  'swagger-ui-express': { has: ['serve', 'setup'] },
  '@vercel/functions': { has: ['EdgeFunction', 'middleware'] }
};

/**
 * 检查模块是否可导入及其导出内容
 * @param {string} moduleName - 模块名称
 * @returns {Object} 检查结果
 */
function checkModule(moduleName) {
  try {
    // 获取绝对路径以避免相对路径问题
    const modulePath = getAbsoluteModulePath(moduleName);
    console.log(`正在检查模块: ${moduleName} (路径: ${modulePath})`);
    
    // 尝试导入模块
    const module = require(moduleName);
    const result = {
      module: moduleName,
      exists: true,
      imported: true,
      version: getModuleVersion(moduleName),
      issues: [],
      exports: {}
    };

    // 验证导出内容
    if (expectedExports[moduleName]) {
      const expected = expectedExports[moduleName];
      
      // 检查是否是函数
      if (expected.isFunction && typeof module !== 'function') {
        result.issues.push(`模块不是预期的函数类型，实际类型: ${typeof module}`);
      }
      
      // 检查预期的导出属性
      if (expected.has) {
        for (const prop of expected.has) {
          if (module[prop] === undefined) {
            result.issues.push(`缺少预期的导出属性: ${prop}`);
          } else {
            result.exports[prop] = typeof module[prop];
          }
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`检查模块 ${moduleName} 时出错:`, error.message);
    
    // 根据错误类型提供更具体的信息
    if (error.code === 'MODULE_NOT_FOUND') {
      return {
        module: moduleName,
        exists: false,
        imported: false,
        issues: [`模块未找到: ${moduleName}`],
        error: error.message
      };
    } else if (error instanceof SyntaxError) {
      return {
        module: moduleName,
        exists: true,
        imported: false,
        issues: [`模块存在但导入失败，语法错误: ${error.message}`],
        error: error.message
      };
    }
    
    return {
      module: moduleName,
      exists: false,
      imported: false,
      issues: [`导入失败: ${error.message}`],
      error: error.message
    };
  }
}

/**
 * 获取模块的绝对路径
 * @param {string} moduleName - 模块名称
 * @returns {string} 模块的绝对路径
 */
function getAbsoluteModulePath(moduleName) {
  try {
    // 尝试解析模块路径
    const resolvePath = path.resolve(__dirname, '../node_modules', moduleName);
    
    // 检查路径是否存在
    if (fs.existsSync(resolvePath)) {
      return resolvePath;
    }
    
    // 如果不存在，尝试使用require.resolve
    return require.resolve(moduleName);
  } catch (error) {
    return `无法解析模块路径: ${moduleName}`;
  }
}

/**
 * 获取模块的版本信息
 * @param {string} moduleName - 模块名称
 * @returns {string|null} 模块版本号
 */
function getModuleVersion(moduleName) {
  try {
    const packageJsonPath = path.join(
      path.dirname(require.resolve(`${moduleName}/package.json`)),
      'package.json'
    );
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return '未知版本';
  }
}

/**
 * 运行所有模块检查
 */
function runModuleChecks() {
  console.log('开始检查必要的模块...');
  console.log('==============================');
  
  const results = [];
  const summary = {
    total: modulesToCheck.length,
    success: 0,
    failed: 0,
    issues: []
  };

  for (const mod of modulesToCheck) {
    const result = checkModule(mod.name);
    results.push(result);
    
    if (result.imported && result.issues.length === 0) {
      summary.success++;
      console.log(`✓ ${mod.name}: 模块加载成功`);
    } else {
      summary.failed++;
      console.log(`✗ ${mod.name}: 模块加载失败`);
      result.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      summary.issues.push(...result.issues);
    }
    
    console.log('------------------------------');
  }

  // 生成总结报告
  console.log('模块检查总结:');
  console.log('==============================');
  console.log(`总模块数: ${summary.total}`);
  console.log(`成功加载: ${summary.success}`);
  console.log(`加载失败: ${summary.failed}`);
  
  if (summary.issues.length > 0) {
    console.log('发现的问题:');
    summary.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    // 生成建议
    console.log('\n建议的解决方案:');
    const missingModules = modulesToCheck.filter(mod => 
      !results.find(r => r.module === mod.name && r.exists)
    );
    
    if (missingModules.length > 0) {
      console.log('- 运行以下命令安装缺失的模块:');
      console.log(`  npm install ${missingModules.map(m => m.name).join(' ')}`);
    }
    
    const corruptedModules = results.filter(r => r.exists && !r.imported);
    if (corruptedModules.length > 0) {
      console.log('- 以下模块可能已损坏，建议重新安装:');
      corruptedModules.forEach(mod => console.log(`  - ${mod.module}`));
    }
  } else {
    console.log('✓ 所有模块都成功加载，未发现问题!');
  }

  // 将结果保存到文件
  try {
    fs.writeFileSync(
      path.join(__dirname, '../logs/module-check-results.json'),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        summary,
        results
      }, null, 2)
    );
    console.log('\n检查结果已保存到 logs/module-check-results.json');
  } catch (error) {
    console.error('保存检查结果失败:', error.message);
  }

  return summary.failed === 0;
}

// 执行检查并根据结果设置退出码
if (require.main === module) {
  const success = runModuleChecks();
  process.exit(success ? 0 : 1);
}

module.exports = {
  checkModule,
  runModuleChecks
};