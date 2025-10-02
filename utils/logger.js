const path = require('path');
const fs = require('fs');
const winston = require('winston');

// 创建日志目录
const logDir = path.join(__dirname, '../logs');

// 定义日志级别顺序
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5
};

// 定义日志格式 - 文件日志使用JSON格式
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label']
  }),
  winston.format.json()
);

// 定义控制台日志格式
const consoleLogFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...metadata } = info;
    const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : '';
    return `${timestamp} [${level}]: ${message} ${meta}`;
  })
);

// 检查环境变量，设置日志级别
const getLogLevel = () => {
  const level = process.env.LOG_LEVEL || 'info';
  
  // 确保日志级别是有效的
  if (!Object.keys(logLevels).includes(level)) {
    console.warn(`无效的日志级别: ${level}，使用默认级别: info`);
    return 'info';
  }
  
  return level;
};

// 检查是否在无服务器环境（如Vercel）中运行
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

// 确保日志目录存在 - 只在非无服务器环境中尝试创建
let canWriteFiles = false;
if (!isServerless) {
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    canWriteFiles = true;
  } catch (error) {
    console.warn('无法创建日志目录，将只使用控制台日志:', error.message);
  }
} else {
  console.log('检测到无服务器环境，将只使用控制台日志');
}

// 创建日志器配置
const loggerConfig = {
  levels: logLevels,
  level: getLogLevel(),
  format: isServerless ? consoleLogFormat : fileLogFormat,
  defaultMeta: {
    service: 'haoyue-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [],
  exceptionHandlers: [],
  rejectionHandlers: []
};

// 只在能够写入文件的环境中添加文件日志传输
if (canWriteFiles) {
  loggerConfig.transports = [
    // 错误日志文件 - 只记录错误级别的日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      zippedArchive: true
    }),
    
    // 警告日志文件 - 只记录警告级别的日志
    new winston.transports.File({
      filename: path.join(logDir, 'warn.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      zippedArchive: true
    }),
    
    // 组合日志文件 - 记录所有级别的日志
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true,
      zippedArchive: true
    })
  ];
  
  // 添加异常处理器
  loggerConfig.exceptionHandlers = [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ];
  
  // 添加拒绝处理器
  loggerConfig.rejectionHandlers = [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ];
}

// 创建日志器
const logger = winston.createLogger(loggerConfig);

// 始终在无服务器环境中使用控制台日志
// 在开发环境或调试模式下也使用控制台日志
const shouldUseConsole = isServerless || process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true';

if (shouldUseConsole) {
  logger.add(new winston.transports.Console({
    format: consoleLogFormat,
    // 在开发环境下可以显示所有级别的日志，在调试模式下可以显示更详细的日志
    level: process.env.DEBUG === 'true' ? 'debug' : getLogLevel()
  }));
}

// 在无服务器环境中，添加额外的控制台信息
if (isServerless) {
  console.log('正在无服务器环境中运行，将只使用控制台日志');
}

/**
 * 请求日志中间件
 * 记录HTTP请求的详细信息，包括方法、URL、状态码、响应时间等
 * @param {Request} req - 请求对象
 * @param {Response} res - 响应对象
 * @param {NextFunction} next - 下一个中间件
 */
const requestLogger = (req, res, next) => {
  // 忽略健康检查和文档路由的日志
  const ignoredPaths = ['/health', '/api/docs', '/api/docs/'];
  const shouldIgnore = ignoredPaths.some(path => 
    req.originalUrl.startsWith(path)
  );

  if (shouldIgnore && process.env.NODE_ENV === 'production') {
    return next();
  }

  const start = Date.now();
  const requestBody = ['POST', 'PUT', 'PATCH'].includes(req.method) && req.body 
    ? { ...req.body } 
    : null;

  // 移除敏感信息
  if (requestBody) {
    if (requestBody.password) requestBody.password = '******';
    if (requestBody.confirmPassword) requestBody.confirmPassword = '******';
    if (requestBody.token) requestBody.token = '******';
    if (requestBody.apiKey) requestBody.apiKey = '******';
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : 'anonymous',
      ...(requestBody && { body: requestBody }),
      responseSize: res.get('Content-Length') || 0
    };

    // 根据状态码选择日志级别
    if (res.statusCode >= 500) {
      logger.error('HTTP Request Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request Warning', logData);
    } else if (res.statusCode >= 300) {
      logger.info('HTTP Request Redirect', logData);
    } else {
      // 只有在调试模式或非生产环境下才记录所有成功请求
      const logLevel = process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production' ? 'info' : 'verbose';
      logger[logLevel]('HTTP Request Success', logData);
    }
  });

  next();
};

/**
 * 错误日志记录
 * 记录应用程序中的错误信息
 * @param {Error} error - 错误对象
 * @param {Request} req - 请求对象
 * @param {Response} res - 响应对象
 */
const errorLogger = (error, req, res) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user ? req.user.id : 'anonymous',
    statusCode: error.statusCode || 500,
    ...(error.code && { errorCode: error.code }),
    ...(error.details && { details: error.details })
  };

  logger.error('Error occurred', errorData);
};

/**
 * 性能监控日志
 * 用于记录函数或操作的执行时间
 * @param {string} operation - 操作名称
 * @param {Function} fn - 要执行的函数
 * @param {any[]} args - 函数参数
 * @returns {Promise<any>} - 函数执行结果
 */
async function logPerformance(operation, fn, ...args) {
  const start = Date.now();
  try {
    const result = await fn(...args);
    const duration = Date.now() - start;
    
    // 只有执行时间超过阈值才记录，避免日志过多
    if (duration > 1000) {
      logger.warn('Performance Warning', { operation, duration: `${duration}ms` });
    } else if (process.env.DEBUG === 'true') {
      logger.debug('Performance Info', { operation, duration: `${duration}ms` });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Performance Error', { operation, duration: `${duration}ms`, error: error.message });
    throw error;
  }
}

/**
 * 安全事件日志
 * 记录安全相关的事件
 * @param {string} event - 事件名称
 * @param {Object} details - 事件详情
 */
const securityLogger = (event, details) => {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent,
    userId: details.userId || 'anonymous',
    ...details
  };

  logger.warn('Security Event', logData);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  logPerformance,
  securityLogger
};