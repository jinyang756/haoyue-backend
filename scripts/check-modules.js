// 检查模块导入是否有问题
console.log('开始检查模块导入...');

// 逐个检查关键模块
const checkModule = (name, path) => {
  try {
    console.log(`尝试导入 ${name}...`);
    const module = require(path);
    console.log(`${name} 导入成功`);
    return true;
  } catch (error) {
    console.error(`${name} 导入失败:`, error.message);
    console.error('错误堆栈:', error.stack);
    return false;
  }
};

// 检查核心模块
checkModule('Express', 'express');
checkModule('Mongoose', 'mongoose');
checkModule('MongoDB', 'mongodb');

// 检查配置和工具模块
checkModule('Config DB', './config/db');
checkModule('Logger', './utils/logger');

// 检查模型模块
checkModule('Stock Model', './models/Stock');

// 检查服务模块
checkModule('Stock Service', './services/stock.service');
checkModule('Schedule Service', './services/schedule.service');

console.log('模块检查完成');