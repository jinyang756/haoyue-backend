const jwt = require('jsonwebtoken');
const User = require('../models/User');
// 保护路由中间件
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 从请求头获取token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 检查token是否存在
    if (!token) {
      return res.status(401).json({
        message: '未授权访问，请先登录'
      });
    }

    try {
      // 验证token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 查找用户
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          message: '用户不存在'
        });
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return res.status(403).json({
          message: user.status === 'inactive' ? '账号未激活' : '账号已被禁用'
        });
      }

      // 将用户信息添加到请求对象
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      next();
    } catch (error) {
      console.error('Token验证错误:', error);
      return res.status(401).json({
        message: 'Token无效或已过期'
      });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    res.status(500).json({
      message: '服务器错误'
    });
  }
};

// 角色授权中间件
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: '未授权访问，请先登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: '权限不足，无法访问此资源'
      });
    }

    next();
  };
};

// API访问频率限制中间件
exports.rateLimit = (windowMs, maxRequests) => {
  const requests = new Map();

  return (req, res, next) => {
    const clientIP = req.ip;
    const now = Date.now();

    // 清理过期的请求记录
    for (const [ip, requestTimes] of requests.entries()) {
      requests.set(ip, requestTimes.filter(time => time > now - windowMs));
      if (requests.get(ip).length === 0) {
        requests.delete(ip);
      }
    }

    // 获取当前客户端的请求记录
    const clientRequests = requests.get(clientIP) || [];

    // 检查是否超过限制
    if (clientRequests.length >= maxRequests) {
      return res.status(429).json({
        message: '请求过于频繁，请稍后再试',
        retryAfter: Math.ceil((windowMs - (now - clientRequests[0])) / 1000)
      });
    }

    // 记录当前请求时间
    clientRequests.push(now);
    requests.set(clientIP, clientRequests);

    next();
  };
};

// API密钥验证中间件
exports.apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      message: '请提供API密钥'
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      message: 'API密钥无效'
    });
  }

  next();
};

// 请求日志中间件
exports.logRequest = (req, res, next) => {
  const start = Date.now();

  // 响应结束时记录日志
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - ${req.ip}`);
  });

  next();
};

// 输入验证中间件
exports.validateRequest = (validationRules) => {
  return async (req, res, next) => {
    // 执行所有验证规则
    await Promise.all(validationRules.map(rule => rule.run(req)));

    // 检查验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '请求参数验证失败',
        errors: errors.array()
      });
    }

    next();
  };
};

// CORS配置中间件
exports.corsConfig = (req, res, next) => {
  const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

// 错误处理中间件
exports.errorHandler = (err, req, res, next) => {
  console.error('错误处理中间件:', err);

  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      message: '数据验证失败',
      errors: messages
    });
  }

  // Mongoose重复键错误
  if (err.code === 11000) {
    return res.status(400).json({
      message: '数据已存在',
      field: Object.keys(err.keyValue)[0]
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token无效'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token已过期'
    });
  }

  // 默认500错误
  res.status(err.statusCode || 500).json({
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};