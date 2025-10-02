const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPlans,
  createSubscription,
  cancelSubscription,
  getUserSubscription,
  checkFeatureAccess,
  updatePaymentStatus
} = require('../services/subscription.service');

/**
 * @swagger
 * components:
 *   schemas:
 *     SubscriptionPlan:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: 计划名称
 *         price:
 *           type: number
 *           description: 价格
 *         features:
 *           type: object
 *           description: 功能列表
 *         description:
 *           type: string
 *           description: 计划描述
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
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: 开始日期
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: 结束日期
 *         amount:
 *           type: number
 *           description: 金额
 *         currency:
 *           type: string
 *           description: 货币
 *         paymentMethod:
 *           type: string
 *           description: 支付方式
 *         paymentStatus:
 *           type: string
 *           description: 支付状态
 *         transactionId:
 *           type: string
 *           description: 交易ID
 *         features:
 *           type: object
 *           description: 功能权限
 *     CreateSubscriptionRequest:
 *       type: object
 *       required:
 *         - plan
 *       properties:
 *         plan:
 *           type: string
 *           description: 计划类型
 *         paymentMethod:
 *           type: string
 *           description: 支付方式
 *         transactionId:
 *           type: string
 *           description: 交易ID
 */

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: 获取所有订阅计划
 *     tags: [订阅管理]
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
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/SubscriptionPlan'
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await getPlans();
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /:
 *   post:
 *     summary: 创建订阅
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSubscriptionRequest'
 *     responses:
 *       200:
 *         description: 成功创建订阅
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 */
router.post('/', protect, async (req, res) => {
  try {
    const { plan, paymentMethod, transactionId } = req.body;
    const subscription = await createSubscription(req.user.id, plan, {
      paymentMethod,
      transactionId
    });
    
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /me:
 *   get:
 *     summary: 获取当前用户订阅信息
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取订阅信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 */
router.get('/me', protect, async (req, res) => {
  try {
    const subscription = await getUserSubscription(req.user.id);
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /{id}/cancel:
 *   put:
 *     summary: 取消订阅
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 订阅ID
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
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 订阅不存在
 */
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const subscription = await cancelSubscription(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /feature/{featureName}:
 *   get:
 *     summary: 检查用户是否有特定功能权限
 *     tags: [订阅管理]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: featureName
 *         required: true
 *         schema:
 *           type: string
 *         description: 功能名称
 *     responses:
 *       200:
 *         description: 成功检查功能权限
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: boolean
 *                   description: 是否有权限
 */
router.get('/feature/:featureName', protect, async (req, res) => {
  try {
    const hasAccess = await checkFeatureAccess(req.user.id, req.params.featureName);
    res.status(200).json({
      success: true,
      data: hasAccess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;