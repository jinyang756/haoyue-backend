/**
 * 应用程序常量配置
 */
module.exports = {
  /**
   * 应用程序信息
   */
  APP: {
    NAME: '皓月量化智能引擎',
    VERSION: '1.0.0',
    DESCRIPTION: '基于AI的股票分析平台',
    AUTHOR: '皓月科技',
    EMAIL: 'contact@haoyuequant.com',
    WEBSITE: 'https://www.haoyuequant.com'
  },

  /**
   * 用户角色
   */
  USER_ROLES: {
    USER: 'user',
    VIP: 'vip',
    ADMIN: 'admin'
  },

  /**
   * 用户状态
   */
  USER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BANNED: 'banned'
  },

  /**
   * 订阅计划
   */
  SUBSCRIPTION_PLANS: {
    FREE: 'free',
    BASIC: 'basic',
    PREMIUM: 'premium',
    ENTERPRISE: 'enterprise'
  },

  /**
   * 分析类型
   */
  ANALYSIS_TYPES: {
    FUNDAMENTAL: 'fundamental',
    TECHNICAL: 'technical',
    SENTIMENT: 'sentiment',
    COMPREHENSIVE: 'comprehensive',
    CUSTOM: 'custom'
  },

  /**
   * 分析状态
   */
  ANALYSIS_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled'
  },

  /**
   * 分析优先级
   */
  ANALYSIS_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent'
  },

  /**
   * 时间范围
   */
  TIME_RANGES: {
    '1D': '1d',
    '1W': '1w',
    '1M': '1m',
    '3M': '3m',
    '6M': '6m',
    '1Y': '1y',
    '2Y': '2y',
    '5Y': '5y',
    MAX: 'max'
  },

  /**
   * 推荐建议
   */
  RECOMMENDATIONS: {
    STRONG_SELL: 'strong sell',
    SELL: 'sell',
    HOLD: 'hold',
    BUY: 'buy',
    STRONG_BUY: 'strong buy'
  },

  /**
   * 风险等级
   */
  RISK_LEVELS: {
    VERY_LOW: 'very low',
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    VERY_HIGH: 'very high'
  },

  /**
   * 投资风格
   */
  INVESTMENT_STYLES: {
    VALUE: 'value',
    GROWTH: 'growth',
    MOMENTUM: 'momentum',
    QUALITY: 'quality',
    DIVIDEND: 'dividend',
    SMALL_CAP: 'small-cap',
    LARGE_CAP: 'large-cap',
    MID_CAP: 'mid-cap',
    SECTOR_ROTATION: 'sector-rotation',
    MARKET_NEUTRAL: 'market-neutral',
    LONG_SHORT: 'long-short',
    OTHER: 'other'
  },

  /**
   * 风险承受能力
   */
  RISK_TOLERANCE: {
    CONSERVATIVE: 'conservative',
    MODERATE: 'moderate',
    AGGRESSIVE: 'aggressive',
    VERY_AGGRESSIVE: 'very aggressive'
  },

  /**
   * 投资时间范围
   */
  INVESTMENT_HORIZON: {
    SHORT_TERM: 'short-term',
    MEDIUM_TERM: 'medium-term',
    LONG_TERM: 'long-term'
  },

  /**
   * 交易所
   */
  EXCHANGES: {
    NYSE: 'NYSE',
    NASDAQ: 'NASDAQ',
    AMEX: 'AMEX',
    SHSE: 'SHSE',
    SZSE: 'SZSE',
    HKEX: 'HKEX',
    TSE: 'TSE',
    LSE: 'LSE',
    OTHER: 'OTHER'
  },

  /**
   * HTTP状态码
   */
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503
  },

  /**
   * 错误消息
   */
  ERROR_MESSAGES: {
    UNAUTHORIZED: '未授权访问，请先登录',
    FORBIDDEN: '权限不足，无法访问此资源',
    NOT_FOUND: '请求的资源不存在',
    BAD_REQUEST: '请求参数错误',
    SERVER_ERROR: '服务器内部错误',
    VALIDATION_ERROR: '数据验证失败',
    DUPLICATE_ENTRY: '数据已存在',
    RATE_LIMIT_EXCEEDED: '请求过于频繁，请稍后再试',
    DATABASE_ERROR: '数据库操作失败',
    EMAIL_SEND_FAILED: '邮件发送失败',
    FILE_UPLOAD_FAILED: '文件上传失败',
    API_KEY_INVALID: 'API密钥无效',
    TOKEN_EXPIRED: 'Token已过期',
    TOKEN_INVALID: 'Token无效'
  },

  /**
   * 成功消息
   */
  SUCCESS_MESSAGES: {
    REGISTER_SUCCESS: '注册成功',
    LOGIN_SUCCESS: '登录成功',
    LOGOUT_SUCCESS: '登出成功',
    PASSWORD_RESET_SUCCESS: '密码重置成功',
    EMAIL_VERIFIED: '邮箱验证成功',
    PROFILE_UPDATED: '个人信息更新成功',
    ANALYSIS_CREATED: '分析任务创建成功',
    ANALYSIS_COMPLETED: '分析任务完成',
    ANALYSIS_CANCELLED: '分析任务已取消',
    RECOMMENDATION_GENERATED: '推荐组合生成成功',
    STOCK_ADDED: '股票添加成功',
    STOCK_UPDATED: '股票信息更新成功',
    FAVORITE_ADDED: '已添加到收藏',
    FAVORITE_REMOVED: '已取消收藏',
    SHARE_SUCCESS: '分享成功',
    NOTIFICATION_SENT: '通知已发送',
    MAINTENANCE_COMPLETED: '维护任务完成'
  },

  /**
   * 正则表达式
   */
  REGEX: {
    EMAIL: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
    PHONE: /^1[3-9]\d{9}$/,
    USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
    URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
    SYMBOL: /^[A-Za-z0-9]{1,10}$/,
    DATE: /^\d{4}-\d{2}-\d{2}$/,
    TIME: /^\d{2}:\d{2}:\d{2}$/,
    DATETIME: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
  },

  /**
   * 分页配置
   */
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MAX_PAGE: 1000
  },

  /**
   * 限流配置
   */
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15分钟
    MAX_REQUESTS: 100, // 最大请求数
    MESSAGE: '请求过于频繁，请稍后再试'
  },

  /**
   * 文件上传配置
   */
  UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    UPLOAD_PATH: './uploads',
    MAX_FILES: 10
  },

  /**
   * 缓存配置
   */
  CACHE: {
    DEFAULT_TTL: 300, // 5分钟
    STOCK_DATA_TTL: 300, // 5分钟
    ANALYSIS_TTL: 3600, // 1小时
    NEWS_TTL: 1800, // 30分钟
    USER_DATA_TTL: 1800 // 30分钟
  },

  /**
   * 邮件配置
   */
  EMAIL: {
    VERIFICATION_SUBJECT: '邮箱验证 - 皓月量化智能引擎',
    PASSWORD_RESET_SUBJECT: '密码重置 - 皓月量化智能引擎',
    WELCOME_SUBJECT: '欢迎加入皓月量化智能引擎',
    ANALYSIS_COMPLETED_SUBJECT: 'AI分析报告 - {stockName}',
    SUBSCRIPTION_REMINDER_SUBJECT: '订阅到期提醒',
    SUCCESS_TEMPLATE: 'success',
    ERROR_TEMPLATE: 'error',
    WARNING_TEMPLATE: 'warning'
  },

  /**
   * API路径
   */
  API_PATHS: {
    AUTH: '/api/auth',
    USERS: '/api/users',
    STOCKS: '/api/stocks',
    ANALYSIS: '/api/analysis',
    RECOMMENDATIONS: '/api/recommendations',
    NEWS: '/api/news',
    FAVORITES: '/api/favorites',
    SHARES: '/api/shares',
    SETTINGS: '/api/settings',
    STATS: '/api/stats',
    HEALTH: '/health',
    DOCS: '/api/docs'
  },

  /**
   * 权限配置
   */
  PERMISSIONS: {
    VIEW: 'view',
    EDIT: 'edit',
    DELETE: 'delete',
    SHARE: 'share',
    ADMIN: 'admin'
  }
};