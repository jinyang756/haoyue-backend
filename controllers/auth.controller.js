const User = require('../models/User');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const { isMongoDBConnected } = require('../config/db');
const jwt = require('jsonwebtoken');

// 用户注册
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, name } = req.body;

    // 检查MongoDB连接状态
    if (!isMongoDBConnected()) {
      return res.status(503).json({
        success: false,
        message: '数据库连接不可用'
      });
    }

    // MongoDB已连接，使用真实数据库
    // 检查用户是否已存在
    let user = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (user) {
      return res.status(400).json({
        message: '用户已存在，请使用其他邮箱或用户名'
      });
    }

    // 创建验证token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    
    // 创建新用户
    user = new User({
      username,
      email,
      password,
      name,
      verificationToken,
      verificationTokenExpire: Date.now() + 24 * 60 * 60 * 1000 // 24小时有效期
    });

    await user.save();

    // 发送验证邮件
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    
    const message = `
      <h1>欢迎使用皓月量化智能引擎</h1>
      <p>请点击下方链接验证您的邮箱：</p>
      <a href="${verificationUrl}" target="_blank">验证邮箱</a>
      <p>如果您没有注册过我们的服务，请忽略此邮件。</p>
    `;

    await sendEmail({
      email: user.email,
      subject: '邮箱验证 - 皓月量化智能引擎',
      html: message
    });

    // 生成token
    const token = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    res.status(201).json({
      success: true,
      message: '注册成功！请查收邮箱验证邮件',
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 使用Auth0管理API获取用户列表
exports.getAuth0Users = async (req, res) => {
  try {
    const { getManagementApiToken } = require('../config/auth0');
    const axios = require('axios');
    
    // 获取管理API令牌
    const token = await getManagementApiToken();
    
    // 使用管理API令牌获取用户列表
    const response = await axios.get(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    res.status(200).json({
      success: true,
      message: '成功获取Auth0用户列表',
      users: response.data
    });
  } catch (error) {
    console.error('获取Auth0用户列表失败:', error);
    res.status(500).json({
      message: '获取用户列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // 检查MongoDB连接状态
    if (!isMongoDBConnected()) {
      return res.status(503).json({
        success: false,
        message: '数据库连接不可用'
      });
    }

    // MongoDB已连接，使用真实数据库
    // 检查用户是否存在
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: '邮箱或密码错误'
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return res.status(403).json({
        message: user.status === 'inactive' ? '账号未激活' : '账号已被禁用'
      });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: '邮箱或密码错误'
      });
    }

    // 更新最后登录时间
    await user.updateLastLogin();

    // 生成token
    const token = user.generateToken();
    const refreshToken = user.generateRefreshToken();

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        preferences: user.preferences,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 刷新Token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        message: '请提供刷新token'
      });
    }

    // 验证refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 查找用户
    const user = await User.findById(decoded.id);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        message: '刷新token无效'
      });
    }

    // 生成新的token
    const newToken = user.generateToken();
    const newRefreshToken = user.generateRefreshToken();

    res.status(200).json({
      success: true,
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('刷新token错误:', error);
    res.status(401).json({
      message: '刷新token无效或已过期'
    });
  }
};

// 邮箱验证
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: '验证链接无效或已过期'
      });
    }

    // 更新用户状态
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: '邮箱验证成功！'
    });
  } catch (error) {
    console.error('邮箱验证错误:', error);
    res.status(500).json({
      message: '服务器错误'
    });
  }
};

// 忘记密码
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: '用户不存在'
      });
    }

    // 创建重置token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // 加密token存入数据库
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15分钟有效期

    await user.save();

    // 发送重置邮件
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    const message = `
      <h1>密码重置请求</h1>
      <p>您收到此邮件是因为有人请求重置您的密码。</p>
      <p>请点击下方链接重置密码（15分钟内有效）：</p>
      <a href="${resetUrl}" target="_blank">重置密码</a>
      <p>如果您没有请求重置密码，请忽略此邮件。</p>
    `;

    await sendEmail({
      email: user.email,
      subject: '密码重置 - 皓月量化智能引擎',
      html: message
    });

    res.status(200).json({
      success: true,
      message: '密码重置邮件已发送'
    });
  } catch (error) {
    console.error('忘记密码错误:', error);
    res.status(500).json({
      message: '服务器错误'
    });
  }
};

// 重置密码
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 加密token进行比较
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: '重置链接无效或已过期'
      });
    }

    // 更新密码
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: '密码重置成功！请重新登录'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      message: '服务器错误'
    });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: '用户不存在'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified,
        status: user.status,
        preferences: user.preferences,
        subscription: user.subscription,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        daysRegistered: user.daysRegistered
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      message: '服务器错误'
    });
  }
};

// 登出
exports.logout = async (req, res) => {
  try {
    // 客户端应该删除本地存储的token
    res.status(200).json({
      success: true,
      message: '成功登出'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      message: '服务器错误'
    });
  }
};

// 重新发送验证邮件
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: '用户不存在'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        message: '邮箱已验证'
      });
    }

    // 创建新的验证token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    
    user.verificationToken = verificationToken;
    user.verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24小时有效期

    await user.save();

    // 发送验证邮件
    const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verificationToken}`;
    
    const message = `
      <h1>邮箱验证</h1>
      <p>请点击下方链接验证您的邮箱：</p>
      <a href="${verificationUrl}" target="_blank">验证邮箱</a>
      <p>如果您没有注册过我们的服务，请忽略此邮件。</p>
    `;

    await sendEmail({
      email: user.email,
      subject: '邮箱验证 - 皓月量化智能引擎',
      html: message
    });

    res.status(200).json({
      success: true,
      message: '验证邮件已重新发送'
    });
  } catch (error) {
    console.error('重新发送验证邮件错误:', error);
    res.status(500).json({
      message: '服务器错误'
    });
  }
};