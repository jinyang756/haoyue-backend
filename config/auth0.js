const { auth } = require('express-oauth2-jwt-bearer');
const User = require('../models/User');
const axios = require('axios');

// 验证Auth0 JWT令牌的中间件
const jwtCheck = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: 'RS256'
});

// 从Auth0用户信息创建或更新本地用户
const syncAuth0User = async (req, res, next) => {
  try {
    // 获取JWT令牌中的用户信息
    const auth0UserId = req.auth.payload.sub;
    const email = req.auth.payload.email;
    const username = req.auth.payload.nickname || email.split('@')[0];
    const name = req.auth.payload.name;
    const avatar = req.auth.payload.picture;

    // 检查用户是否已存在
    let user = await User.findOne({ email });

    if (!user) {
      // 创建新用户
      user = new User({
        username,
        email,
        name,
        avatar,
        emailVerified: true,
        status: 'active',
        // 设置默认密码（用户将通过Auth0登录，不需要本地密码）
        password: 'auth0_' + Math.random().toString(36).substring(2, 15)
      });

      await user.save();
    } else if (user.status !== 'active') {
      // 如果用户存在但状态不是active，返回403
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

    // 更新最后登录时间
    await user.updateLastLogin();

    next();
  } catch (error) {
    console.error('同步Auth0用户失败:', error);
    res.status(500).json({
      message: '服务器错误'
    });
  }
};

// 组合的Auth0认证中间件
const auth0Auth = [jwtCheck, syncAuth0User];

// 获取管理API访问令牌
const getManagementApiToken = async () => {
  try {
    const response = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        grant_type: 'client_credentials',
        client_id: process.env.AUTH0_CLIENT_ID,
        client_secret: process.env.AUTH0_CLIENT_SECRET,
        audience: 'https://athendrakomin.jp.auth0.com/api/v2/'
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('获取Auth0管理API令牌失败:', error);
    throw error;
  }
};

module.exports = {
  jwtCheck,
  syncAuth0User,
  auth0Auth,
  getAuth0Config: () => ({
    domain: process.env.AUTH0_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    audience: process.env.AUTH0_AUDIENCE,
    callbackUrl: process.env.AUTH0_CALLBACK_URL,
    logoutUrl: process.env.AUTH0_LOGOUT_URL,
    managementApiAudience: 'https://athendrakomin.jp.auth0.com/api/v2/'
  }),
  getManagementApiToken
};