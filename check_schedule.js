const scheduleService = require('./services/schedule.service');

// 打印当前所有定时任务的状态
console.log('检查定时任务状态...');
const jobsStatus = scheduleService.getJobsStatus();
console.log('定时任务状态:', jobsStatus);

// 查看是否有最近执行的任务
const hasRecentJobs = Object.values(jobsStatus).some(job => job.lastDate);
console.log('是否有最近执行的任务:', hasRecentJobs);

console.log('检查完成!');