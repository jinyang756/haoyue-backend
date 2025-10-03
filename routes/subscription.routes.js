const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { protect } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 计划ID
 *         name:
 *           type: string
 *           description: 计划名称
 *         price:
 *           type: number
 *           description: 价格
 *         billingCycle:
 *           type: string
 *           description: 计费周期
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           description: 功能列表
 *         limitations:
 *           type: array
 *           items:
 *             type: string
 *           description: 限制列表
 *     Subscription:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: 订阅ID
 *         user:
 *           type: string
 *           description: 用户ID
 *         plan:
 *           type: string
 *           description: 计划类型
 *         status:
 *           type: string
 *           description: 订阅状态
 *         amount:
 *           type: number
 *           description: 金额
 *         billingCycle:
 *           type: string
 *           description: 计费周期
 *         paymentMethod:
 *           type: string
 *           description: 支付方式
 *         paymentStatus:
 *           type: string
 *           description: 支付状态
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 开始日期
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 结束日期
 *     CreateSubscriptionRequest:
 *       type: object
 *       required:
 *         - plan
 *       properties:
 *         plan:
 *           type: string
 *           description: 计划类型
 *         billingCycle:
 *           type: string
 *           description: 计费周期
 *         paymentMethod:
 *           type: string
 *           description: 支付方式
 *         discountCode:
 *           type: string
 *           description: 折扣码
 *     ProcessPaymentRequest:
 *       type: object
 *       required:
 *         - subscriptionId
 *         - paymentMethod
 *       properties:
 *         subscriptionId:
 *           type: string
 *           description: 订阅ID
 *         paymentMethod:
 *           type: string
 *           description: 支付方式
 *         paymentData:
 *           type: object
 *           description: 支付数据
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: 获取所有订阅计划
 *     tags: [订阅]
 *     responses:
 *       200:
 *         description: 成功获取订阅计划
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 plans:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SubscriptionPlan'
 */
router.get('/plans', subscriptionController.getPlans);

/**
 * @swagger
 * /current:
 *   get:
 *     summary: 获取当前用户订阅
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取用户订阅
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: 未授权
 */
router.get('/current', protect, subscriptionController.getCurrentUserSubscription);

/**
 * @swagger
 * /:
 *   post:
 *     summary: 创建订阅
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriptionRequest'
 *     responses:
 *       201:
 *         description: 成功创建订阅
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/', protect, subscriptionController.createSubscription);

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: 更新订阅
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订阅ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan:
 *                 type: string
 *               billingCycle:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功更新订阅
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 订阅不存在
 */
router.put('/:id', protect, subscriptionController.updateSubscription);

/**
 * @swagger
 * /{id}/cancel:
 *   post:
 *     summary: 取消订阅
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订阅ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: 取消原因
 *     responses:
 *       200:
 *         description: 成功取消订阅
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 订阅不存在
 */
router.post('/:id/cancel', protect, subscriptionController.cancelSubscription);

/**
 * @swagger
 * /history:
 *   get:
 *     summary: 获取订阅历史
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取订阅历史
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 subscriptions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Subscription'
 *       401:
 *         description: 未授权
 */
router.get('/history', protect, subscriptionController.getSubscriptionHistory);

/**
 * @swagger
 * /payment:
 *   post:
 *     summary: 处理支付
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessPaymentRequest'
 *     responses:
 *       200:
 *         description: 成功处理支付
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 subscription:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: 支付失败
 *       401:
 *         description: 未授权
 *       404:
 *         description: 订阅不存在
 */
router.post('/payment', protect, subscriptionController.processPayment);

/**
 * @swagger
 * /team:
 *   get:
 *     summary: 获取团队成员
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取团队成员
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 teamMembers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: 未授权
 */
router.get('/team', protect, subscriptionController.getTeamMembers);

/**
 * @swagger
 * /team:
 *   post:
 *     summary: 添加团队成员
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: 团队成员邮箱
 *     responses:
 *       200:
 *         description: 成功添加团队成员
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 member:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 订阅不存在或已达最大成员数
 */
router.post('/team', protect, subscriptionController.addTeamMember);

/**
 * @swagger
 * /team/{memberId}:
 *   delete:
 *     summary: 移除团队成员
 *     tags: [订阅]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         description: 成员ID
 *     responses:
 *       200:
 *         description: 成功移除团队成员
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 成员不存在
 */
router.delete('/team/:memberId', protect, subscriptionController.removeTeamMember);

module.exports = router;