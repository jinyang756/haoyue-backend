const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { protect, validateRequest, getAuthMiddleware, authorize } = require('../middleware/auth');
const { getManagementApiToken } = require('../config/auth0');

// 获取当前配置的认证中间件
const authMiddleware = getAuthMiddleware();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: 用户名，至少3个字符
 *         email:
 *           type: string
 *           description: 用户邮箱
 *         password:
 *           type: string
 *           description: 用户密码，至少6个字符
 *         name:
 *           type: string
 *           description: 用户姓名，可选
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: 用户邮箱
 *         password:
 *           type: string
 *           description: 用户密码
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: 刷新令牌
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           description: 用户邮箱
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 *           description: 新密码，至少6个字符
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT访问令牌
 *         refreshToken:
 *           type: string
 *           description: 刷新令牌
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: 用户注册
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: 注册成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: 注册失败，参数错误或用户已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: 用户登录
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: 认证失败，邮箱或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/login',
  [
    check('email', '请提供有效的邮箱').isEmail(),
    check('password', '请提供密码').exists()
  ],
  validateRequest,
  authController.login
);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: 刷新访问令牌
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: 令牌刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: 刷新令牌无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/refresh-token',
  [
    check('refreshToken', '请提供刷新token').exists()
  ],
  validateRequest,
  authController.refreshToken
);

/**
 * @swagger
 * /verify-email/{token}:
 *   get:
 *     summary: 验证邮箱
 *     tags: [认证]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: 邮箱验证令牌
 *     responses:
 *       200:
 *         description: 邮箱验证成功
 *       400:
 *         description: 验证令牌无效或已过期
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: 忘记密码
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: 重置密码链接已发送到邮箱
 *       404:
 *         description: 邮箱不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/forgot-password',
  [
    check('email', '请提供有效的邮箱').isEmail()
  ],
  validateRequest,
  authController.forgotPassword
);

/**
 * @swagger
 * /reset-password/{token}:
 *   post:
 *     summary: 重置密码
 *     tags: [认证]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: 重置密码令牌
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: 密码重置成功
 *       400:
 *         description: 重置令牌无效或已过期
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/reset-password/:token',
  [
    check('password', '密码至少6个字符').isLength({ min: 6 })
  ],
  validateRequest,
  authController.resetPassword
);

/**
 * @swagger
 * /me:
 *   get:
 *     summary: 获取当前用户信息
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', [...authMiddleware], authController.getCurrentUser);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: 用户登出
 *     tags: [认证]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 登出成功
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', [...authMiddleware], authController.logout);

/**
 * @swagger
 * /resend-verification:
 *   post:
 *     summary: 重新发送验证邮件
 *     tags: [认证]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: 验证邮件已重新发送
 *       404:
 *         description: 邮箱不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/resend-verification',
  [
    check('email', '请提供有效的邮箱').isEmail()
  ],
  validateRequest,
  authController.resendVerificationEmail
);

/**
 * @swagger
 * /get-management-token: 
 *   get: 
 *     summary: 获取Auth0管理API令牌
 *     tags: [认证管理]
 *     security: 
 *       - bearerAuth: []
 *     responses: 
 *       200: 
 *         description: 成功获取管理API令牌
 *         content: 
 *           application/json: 
 *             schema: 
 *               type: object
 *               properties: 
 *                 success: 
 *                   type: boolean
 *                 message: 
 *                   type: string
 *                 access_token: 
 *                   type: string
 *       401: 
 *         description: 未授权，需要有效的访问令牌
 *       500: 
 *         description: 服务器错误
 */
// 获取Auth0管理API令牌 (仅管理员)
router.get('/get-management-token', protect, authorize('admin'), async (req, res) => {
  try {
    // 获取管理API令牌
    const token = await getManagementApiToken();
    
    res.status(200).json({
      success: true,
      message: '成功获取Auth0管理API令牌',
      access_token: token
    });
  } catch (error) {
    console.error('获取Auth0管理API令牌失败:', error);
    res.status(500).json({
      message: '获取管理API令牌失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

  /**
   * @swagger
   * /get-auth0-users: 
   *   get: 
   *     summary: 使用Auth0管理API获取用户列表
   *     tags: [认证管理]
   *     security: 
   *       - bearerAuth: []
   *     responses: 
   *       200: 
   *         description: 成功获取用户列表
   *         content: 
   *           application/json: 
   *             schema: 
   *               type: object
   *               properties: 
   *                 success: 
   *                   type: boolean
   *                 message: 
   *                   type: string
   *                 users: 
   *                   type: array
   *                   items: 
   *                     type: object
   *       401: 
   *         description: 未授权，需要有效的访问令牌
   *       403: 
   *         description: 权限不足，需要管理员权限
   *       500: 
   *         description: 服务器错误
   */
  // 使用Auth0管理API获取用户列表 (仅管理员)
  router.get('/get-auth0-users', protect, authorize('admin'), authController.getAuth0Users);

  module.exports = router;