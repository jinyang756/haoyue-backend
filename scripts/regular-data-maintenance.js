#!/usr/bin/env node

/**
 * 定期数据维护脚本
 * 用于定期更新和补全数据库中的各种数据
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const { promisify } = require('util');

// 加载环境变量
dotenv.config();

// 将exec转换为Promise版本
const execAsync = promisify(exec);

// 数据维护任务列表
const MAINTENANCE_TASKS = [
  {
    name: '更新所有股票数据',
    script: 'node scripts/update-all-stocks-data.js',
    description: '更新所有股票的价格和历史数据'
  },
  {
    name: '生成各种类型的分析报告',
    script: 'node scripts/generate-various-analysis-types.js',
    description: '为股票生成基本面、技术面和情绪面分析报告'
  },
  {
    name: '生成新闻和市场数据',
    script: 'node scripts/generate-news-and-market-data.js',
    description: '更新股票的新闻和市场相关数据'
  }
];

/**
 * 执行数据维护任务
 */
async function performMaintenance() {
  console.log('开始执行定期数据维护任务...\n');
  
  // 连接数据库
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/haoyue';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('MongoDB连接成功\n');
  
  // 执行每个维护任务
  for (const task of MAINTENANCE_TASKS) {
    try {
      console.log(`执行任务: ${task.name}`);
      console.log(`说明: ${task.description}\n`);
      
      const { stdout, stderr } = await execAsync(task.script);
      
      if (stdout) {
        console.log(stdout);
      }
      
      if (stderr) {
        console.error('错误输出:', stderr);
      }
      
      console.log(`✓ 任务 "${task.name}" 执行完成\n`);
    } catch (error) {
      console.error(`✗ 任务 "${task.name}" 执行失败:`, error.message, '\n');
    }
  }
  
  // 断开数据库连接
  await mongoose.connection.close();
  console.log('MongoDB连接已关闭');
  console.log('定期数据维护任务执行完成!');
}

/**
 * 主函数
 */
async function main() {
  try {
    await performMaintenance();
  } catch (error) {
    console.error('执行定期数据维护时出错:', error);
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  performMaintenance,
  MAINTENANCE_TASKS
};