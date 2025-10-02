const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize, validateRequest } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: 
 *           type: string
 *           description: 用户唯一ID
 *         username: 
 *           type: string
 *           description: 用户名
 *         email: 
 *           type: string
 *           description: 用户邮箱
 *         role: 
 *           type: string
 *           description: 用户角色 (user, admin)
 *           enum: [user, admin]
 *         status: 
 *           type: string
 *           description: 用户状态 (active, inactive)
 *           enum: [active, inactive]
 *         name: 
 *           type: string
 *           description: 用户姓名
 *         createdAt: 
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt: 
 *           type: string
 *           format: date-time
 *           description: 更新时间
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         name: 
 *           type: string
 *           description: 用户姓名，最多50个字符
 *         email: 
 *           type: string
 *           description: 用户邮箱
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword: 
 *           type: string
 *           description: 当前密码
 *         newPassword: 
 *           type: string
 *           description: 新密码，至少6个字符
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: 获取所有用户（仅管理员）
 *     tags: [用户管理]
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
 *                 message: 
 *                   type: string
 *                 users: 
 *                   type: array
 *                   items: 
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 禁止访问，需要管理员权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 获取所有用户（仅管理员）
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    res.status(200).json({
      message: '获取用户列表成功',
      users: []
    });
  } catch (error) {
    res.status(500).json({
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: 获取用户详情
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功获取用户详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 user: 
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 获取用户详情
router.get('/:id', protect, async (req, res) => {
  try {
    res.status(200).json({
      message: '获取用户详情成功',
      user: {
        id: req.params.id,
        username: '示例用户',
        email: 'example@test.com',
        role: 'user',
        status: 'active',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: 更新用户信息
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: 成功更新用户信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 user: 
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: 参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 更新用户信息
router.put('/:id', protect, [
  check('name', '姓名长度不能超过50个字符').optional().isLength({ max: 50 }),
  check('email', '请提供有效的邮箱').optional().isEmail()
], validateRequest, async (req, res) => {
  try {
    res.status(200).json({
      message: '更新用户信息成功',
      user: {
        id: req.params.id,
        ...req.body
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: 删除用户（仅管理员）
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     responses:
 *       200:
 *         description: 成功删除用户
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 禁止访问，需要管理员权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 删除用户（仅管理员）
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    res.status(200).json({
      message: '删除用户成功'
    });
  } catch (error) {
    res.status(500).json({
      message: '服务器错误',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /{id}/password:
 *   put:
 *     summary: 更新用户密码
 *     tags: [用户管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 用户ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: 密码更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *       400:
 *         description: 参数错误或当前密码不正确
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 用户不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 更新用户密码
router.put('/:id/password', protect, [
  check('currentPassword', '请提供当前密码').exists(),
  check('newPassword', '新密码至少6个字符').isLength({ min: 6 })
], validateRequest, async (req, res) => {
  try {
    res.status(200).json({
      message: '密码更新成功'
    });
  } catch (error) {
    res.status(500).json({
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;