const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { config } = require('../config/db');

/**
 * 生成JWT Token
 * @param {Object} payload - Token载荷
 * @param {string} expiresIn - 过期时间
 * @returns {string} - JWT Token
 */
const generateToken = (payload, expiresIn = config.jwt.expiresIn) => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

/**
 * 生成刷新Token
 * @param {Object} payload - Token载荷
 * @returns {string} - 刷新Token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, { 
    expiresIn: config.jwt.refreshExpiresIn 
  });
};

/**
 * 验证JWT Token
 * @param {string} token - JWT Token
 * @returns {Object} - 解码后的Token
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * 验证刷新Token
 * @param {string} token - 刷新Token
 * @returns {Object} - 解码后的Token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} - 随机字符串
 */
const generateRandomString = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * 生成验证码
 * @param {number} length - 验证码长度
 * @returns {string} - 验证码
 */
const generateVerificationCode = (length = 6) => {
  return Math.random().toString(36).substr(2, length).toUpperCase();
};

/**
 * 密码加密
 * @param {string} password - 原始密码
 * @returns {string} - 加密后的密码
 */
const encryptPassword = async (password) => {
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * 密码验证
 * @param {string} password - 原始密码
 * @param {string} hashedPassword - 加密后的密码
 * @returns {boolean} - 验证结果
 */
const verifyPassword = async (password, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hashedPassword);
};

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串
 * @returns {string} - 格式化后的日期
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 计算两个日期之间的天数差
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {number} - 天数差
 */
const getDaysBetween = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.round(Math.abs((start - end) / oneDay));
};

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} - 节流后的函数
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 生成API响应格式
 * @param {boolean} success - 是否成功
 * @param {any} data - 数据
 * @param {string} message - 消息
 * @param {number} statusCode - 状态码
 * @returns {Object} - API响应
 */
const apiResponse = (success, data = null, message = '', statusCode = 200) => {
  const response = {
    success,
    statusCode
  };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return response;
};

/**
 * 计算分页
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @returns {Object} - 分页参数
 */
const calculatePagination = (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return {
    skip,
    limit: parseInt(limit),
    page: parseInt(page)
  };
};

/**
 * 生成分页响应
 * @param {Array} data - 数据列表
 * @param {number} total - 总数量
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @returns {Object} - 分页响应
 */
const paginatedResponse = (data, total, page = 1, limit = 20) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      total,
      totalPages,
      currentPage: parseInt(page),
      limit: parseInt(limit),
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
};

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} - 验证结果
 */
const isValidEmail = (email) => {
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} - 验证结果
 */
const isValidPhone = (phone) => {
  const re = /^1[3-9]\d{9}$/;
  return re.test(phone);
};

/**
 * 验证URL格式
 * @param {string} url - URL地址
 * @returns {boolean} - 验证结果
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} - 拷贝后的对象
 */
const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 合并对象
 * @param {Object} target - 目标对象
 * @param  {...Object} sources - 源对象
 * @returns {Object} - 合并后的对象
 */
const mergeObjects = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (target && source && typeof target === 'object' && typeof source === 'object') {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object') {
          target[key] = mergeObjects(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }
  }

  return mergeObjects(target, ...sources);
};

/**
 * 生成随机颜色
 * @returns {string} - 随机颜色
 */
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * 计算百分比
 * @param {number} value - 当前值
 * @param {number} total - 总值
 * @param {number} decimals - 小数位数
 * @returns {number} - 百分比
 */
const calculatePercentage = (value, total, decimals = 2) => {
  if (total === 0) return 0;
  return Math.round((value / total * 100) * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * 格式化数字为千分位
 * @param {number} number - 数字
 * @param {number} decimals - 小数位数
 * @returns {string} - 格式化后的数字
 */
const formatNumber = (number, decimals = 2) => {
  return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * 生成唯一ID
 * @returns {string} - 唯一ID
 */
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

/**
 * 检查对象是否为空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} - 检查结果
 */
const isEmptyObject = (obj) => {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * 数组去重
 * @param {Array} array - 要去重的数组
 * @returns {Array} - 去重后的数组
 */
const uniqueArray = (array) => {
  return [...new Set(array)];
};

/**
 * 数组排序
 * @param {Array} array - 要排序的数组
 * @param {string} key - 排序键
 * @param {string} order - 排序顺序
 * @returns {Array} - 排序后的数组
 */
const sortArray = (array, key, order = 'asc') => {
  return array.sort((a, b) => {
    if (a[key] < b[key]) return order === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  generateRandomString,
  generateVerificationCode,
  encryptPassword,
  verifyPassword,
  formatDate,
  getDaysBetween,
  debounce,
  throttle,
  apiResponse,
  calculatePagination,
  paginatedResponse,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  deepClone,
  mergeObjects,
  getRandomColor,
  calculatePercentage,
  formatNumber,
  generateUniqueId,
  isEmptyObject,
  uniqueArray,
  sortArray
};