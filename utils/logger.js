const winston = require('winston');
const path = require('path');

// 创建日志目录
const logDir = path.join(__dirname, '../logs');
const fs = require('fs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 定义控制台格式
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    return `${info.timestamp} [${info.level}]: ${info.message}`;
  })
);

// 创建日志器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'haoyue-api' },
  transports: [
    // 错误日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // 组合日志文件
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

/**
 * 请求日志中间件
 * @param {Request} req - 请求对象
 * @param {Response} res - 响应对象
 * @param {NextFunction} next - 下一个中间件
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user.id : 'anonymous'
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

/**
 * 错误日志记录
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
    statusCode: error.statusCode || 500
  };

  logger.error('Error occurred', errorData);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger
};