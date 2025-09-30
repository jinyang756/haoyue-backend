// 详细检查每个定时任务的执行状态
const scheduleService = require('./services/schedule.service');
const schedule = require('node-schedule');

// 检查node-schedule的版本
console.log('node-schedule版本:', require('node-schedule/package.json').version);

// 获取今天的日期
const today = new Date();
today.setHours(0, 0, 0, 0);

// 日期格式化函数
function formatDate(date) {
  if (!date) return '未知';
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

console.log('\n====== 定时任务详细状态检查 ======');
console.log('检查日期:', formatDate(new Date()));
console.log('检查的是今天(', formatDate(today).split(' ')[0], ')及以后的执行情况\n');

// 尝试直接访问schedule的全局任务列表
const globalJobs = schedule.scheduledJobs;
console.log('全局任务数量:', Object.keys(globalJobs).length);
console.log('全局任务列表:', Object.keys(globalJobs));

// 检查每个任务的状态
Object.keys(globalJobs).forEach(jobName => {
  const job = globalJobs[jobName];
  
  console.log(`\n任务: ${jobName}`);
  console.log('  是否存在:', !!job);
  
  // 尝试获取下次执行时间
  try {
    // 尝试不同的方法获取下次执行时间，因为不同版本的API可能不同
    let nextTime = null;
    if (job.nextInvocation) {
      nextTime = job.nextInvocation();
    } else if (job.nextDate) {
      nextTime = job.nextDate();
    } else if (job._job && job._job.nextInvocation) {
      nextTime = job._job.nextInvocation();
    }
    
    console.log('  下次执行时间:', nextTime ? formatDate(nextTime) : '未知');
  } catch (e) {
    console.log('  下次执行时间: 无法获取', e.message);
  }
  
  // 检查任务是否在今天执行过
  try {
    // 尝试检查job对象的其他属性，看是否能找到执行记录
    console.log('  任务配置:', job._scheduledJobs ? Object.keys(job._scheduledJobs) : '简单任务');
    
    // 输出任务的更多详细信息，帮助调试
    console.log('  任务类型:', typeof job);
    console.log('  可用方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(job)).filter(m => typeof job[m] === 'function' && m !== 'constructor').join(', '));
  } catch (e) {
    console.log('  获取详细信息失败:', e.message);
  }
});

console.log('\n====== 检查完成 ======');