const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect, validateRequest } = require('../middleware/auth');

// 用户注册
router.post(
  '/register',
  [
    check('username', '用户名至少3个字符').isLength({ min: 3 }),
    check('email', '请提供有效的邮箱').isEmail(),
    check('password', '密码至少6个字符').isLength({ min: 6 }),
    check('name', '请提供姓名').optional().isLength({ max: 50 })
  ],
  validateRequest,
  authController.register
);

// 用户登录
router.post(
  '/login',
  [
    check('email', '请提供有效的邮箱').isEmail(),
    check('password', '请提供密码').exists()
  ],
  validateRequest,
  authController.login
);

// 刷新Token
router.post(
  '/refresh-token',
  [
    check('refreshToken', '请提供刷新token').exists()
  ],
  validateRequest,
  authController.refreshToken
);

// 邮箱验证
router.get('/verify-email/:token', authController.verifyEmail);

// 忘记密码
router.post(
  '/forgot-password',
  [
    check('email', '请提供有效的邮箱').isEmail()
  ],
  validateRequest,
  authController.forgotPassword
);

// 重置密码
router.post(
  '/reset-password/:token',
  [
    check('password', '密码至少6个字符').isLength({ min: 6 })
  ],
  validateRequest,
  authController.resetPassword
);

// 获取当前用户信息
router.get('/me', protect, authController.getCurrentUser);

// 登出
router.post('/logout', protect, authController.logout);

// 重新发送验证邮件
router.post(
  '/resend-verification',
  [
    check('email', '请提供有效的邮箱').isEmail()
  ],
  validateRequest,
  authController.resendVerificationEmail
);

module.exports = router;