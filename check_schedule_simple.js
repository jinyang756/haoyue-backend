// 简单检查定时任务状态
const scheduleService = require('./services/schedule.service');

// 打印任务是否存在
console.log('检查定时任务初始化...');
console.log('定时任务对象存在:', !!scheduleService.jobs);
console.log('任务数量:', Object.keys(scheduleService.jobs).length);
console.log('任务列表:', Object.keys(scheduleService.jobs));

console.log('检查完成!');