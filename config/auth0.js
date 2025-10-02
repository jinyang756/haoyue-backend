const { logger } = require('../utils/logger');
const jwt = require('jsonwebtoken');

/**
 * 验证Auth0访问令牌
 * @param {string} token - Auth0访问令牌
 * @returns {Promise<Object>} 验证结果对象
 */
exports.auth0Auth = async (token) => {
  try {
    // 在开发环境下，为了测试方便，简化验证逻辑
    if (process.env.NODE_ENV === 'development') {
      // 只做基本的格式检查，不实际调用Auth0 API
      if (token && token.length > 10) {
        return {
          isValid: true,
          user: {
            id: 'dev-user-' + Date.now(),
            email: 'dev@example.com',
            name: 'Developer User',
            role: 'admin',
            avatar: 'https://via.placeholder.com/150'
          }
        };
      }
      throw new Error('开发环境：无效的Auth0令牌格式');
    }
    
    // 生产环境下的验证逻辑会在这里实现
    throw new Error('生产环境Auth0验证暂未实现');
  } catch (error) {
    logger.error('Auth0令牌验证失败:', error.message);
    return {
      isValid: false,
      error: error.message
    };
  }
};

/**
 * 验证JWT令牌
 * 由于项目同时使用JWT和Auth0，这里添加一个兼容的验证函数
 */
exports.verifyToken = async (token) => {
  try {
    // 首先尝试作为JWT令牌验证
    if (token && token.length < 500) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
          isValid: true,
          user: { id: decoded.id }
        };
      } catch (jwtError) {
        // JWT验证失败，可能是Auth0令牌，继续尝试
        logger.debug('JWT验证失败，尝试作为Auth0令牌验证:', jwtError.message);
      }
    }
    
    // 然后尝试作为Auth0令牌验证
    return await exports.auth0Auth(token);
  } catch (error) {
    logger.error('令牌验证失败:', error.message);
    return {
      isValid: false,
      error: error.message
    };
  }
};

/**
 * 获取Auth0配置
 */
exports.getAuth0Config = () => {
  return {
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
    callbackUrl: process.env.AUTH0_CALLBACK_URL,
    logoutUrl: process.env.AUTH0_LOGOUT_URL
  };
};

/**
 * 生成认证URL
 */
exports.getAuth0LoginUrl = () => {
  const config = exports.getAuth0Config();
  return `https://${config.domain}/authorize?` +
    `response_type=code&` +
    `client_id=${config.clientId}&` +
    `redirect_uri=${encodeURIComponent(config.callbackUrl)}&` +
    `scope=openid profile email&` +
    `audience=${encodeURIComponent(config.audience)}`;
};

module.exports = {
  auth0Auth: exports.auth0Auth,
  verifyToken: exports.verifyToken,
  getAuth0Config: exports.getAuth0Config,
  getAuth0LoginUrl: exports.getAuth0LoginUrl
};