const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const aiController = require('../controllers/ai.controller');
const { protect, validateRequest } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalysisRequest:
 *       type: object
 *       required:
 *         - stockSymbol
 *       properties:
 *         stockSymbol: 
 *           type: string
 *           description: 股票代码
 *           example: "AAPL"
 *         analysisType: 
 *           type: string
 *           enum: [fundamental, technical, sentiment, comprehensive, custom]
 *           default: comprehensive
 *           description: 分析类型
 *         timeRange: 
 *           type: string
 *           enum: [1d, 1w, 1m, 3m, 6m, 1y, 2y, 5y, max]
 *           default: 1y
 *           description: 时间范围
 *         priority: 
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           default: medium
 *           description: 优先级
 *     Analysis: 
 *       type: object
 *       properties:
 *         id: 
 *           type: string
 *           description: 分析任务唯一ID
 *         userId: 
 *           type: string
 *           description: 用户ID
 *         stockSymbol: 
 *           type: string
 *           description: 股票代码
 *         analysisType: 
 *           type: string
 *           description: 分析类型
 *         timeRange: 
 *           type: string
 *           description: 时间范围
 *         priority: 
 *           type: string
 *           description: 优先级
 *         status: 
 *           type: string
 *           enum: [pending, in-progress, completed, failed, canceled]
 *           description: 分析状态
 *         result: 
 *           type: object
 *           description: 分析结果
 *         isFavorite: 
 *           type: boolean
 *           description: 是否收藏
 *         createdAt: 
 *           type: string
 *           format: date-time
 *         updatedAt: 
 *           type: string
 *           format: date-time
 *         completedAt: 
 *           type: string
 *           format: date-time
 *     AnalysisStats: 
 *       type: object
 *       properties:
 *         totalAnalyses: 
 *           type: number
 *         completedAnalyses: 
 *           type: number
 *         pendingAnalyses: 
 *           type: number
 *         failedAnalyses: 
 *           type: number
 *         mostAnalyzedStocks: 
 *           type: array
 *           items: 
 *             type: object
 *             properties:
 *               symbol: 
 *                 type: string
 *               count: 
 *                 type: number
 *     ShareRequest: 
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId: 
 *           type: string
 *           description: 要分享的用户ID
 *         permission: 
 *           type: string
 *           enum: [view, edit, comment]
 *           default: view
 *           description: 分享权限
 *     AnalysisNote: 
 *       type: object
 *       required:
 *         - note
 *       properties:
 *         id: 
 *           type: string
 *           description: 笔记ID
 *         note: 
 *           type: string
 *           description: 笔记内容
 *         createdAt: 
 *           type: string
 *           format: date-time
 *         updatedAt: 
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/analysis:
 *   post:
 *     summary: 创建AI分析任务
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalysisRequest'
 *     responses:
 *       201:
 *         description: 成功创建分析任务
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Analysis'
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
 */
// 创建AI分析任务
router.post(
  '/',
  protect,
  [
    check('stockSymbol', '请提供股票代码').not().isEmpty(),
    check('analysisType')
      .optional()
      .isIn(['fundamental', 'technical', 'sentiment', 'comprehensive', 'custom']),
    check('timeRange')
      .optional()
      .isIn(['1d', '1w', '1m', '3m', '6m', '1y', '2y', '5y', 'max']),
    check('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
  ],
  validateRequest,
  aiController.createAnalysis
);

/**
 * @swagger
 * /api/analysis:
 *   get:
 *     summary: 获取分析任务列表
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-progress, completed, failed, canceled]
 *         description: 筛选特定状态的分析任务
 *       - in: query
 *         name: stockSymbol
 *         schema:
 *           type: string
 *         description: 筛选特定股票的分析任务
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取分析任务列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 analyses: 
 *                   type: array
 *                   items: 
 *                     $ref: '#/components/schemas/Analysis'
 *                 total: 
 *                   type: number
 *                 page: 
 *                   type: number
 *                 limit: 
 *                   type: number
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 获取分析任务列表
router.get('/', protect, aiController.getAnalysisList);

/**
 * @swagger
 * /api/analysis/{id}:
 *   get:
 *     summary: 获取分析任务详情
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分析任务ID
 *     responses:
 *       200:
 *         description: 成功获取分析任务详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Analysis'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 分析任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 获取分析任务详情
router.get('/:id', protect, aiController.getAnalysisById);

/**
 * @swagger
 * /api/analysis/{id}/cancel:
 *   put:
 *     summary: 取消分析任务
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分析任务ID
 *     responses:
 *       200:
 *         description: 成功取消分析任务
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Analysis'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 分析任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: 无法取消已完成的任务
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 取消分析任务
router.put('/:id/cancel', protect, aiController.cancelAnalysis);

/**
 * @swagger
 * /api/analysis/stats:
 *   get:
 *     summary: 获取分析统计
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取分析统计
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisStats'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 获取分析统计
router.get('/stats', protect, aiController.getAnalysisStats);

/**
 * @swagger
 * /api/analysis/{id}/favorite:
 *   put:
 *     summary: 标记分析结果为收藏
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分析任务ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFavorite: 
 *                 type: boolean
 *                 description: 是否收藏
 *     responses:
 *       200:
 *         description: 成功更新收藏状态
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Analysis'
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
 *         description: 分析任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 标记分析结果为收藏
router.put(
  '/:id/favorite',
  protect,
  [
    check('isFavorite', '请提供收藏状态').isBoolean()
  ],
  validateRequest,
  aiController.toggleFavorite
);

/**
 * @swagger
 * /api/analysis/{id}/share:
 *   post:
 *     summary: 分享分析结果
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分析任务ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareRequest'
 *     responses:
 *       200:
 *         description: 成功分享分析结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 sharedAnalysis: 
 *                   type: object
 *                   properties:
 *                     id: 
 *                       type: string
 *                     analysisId: 
 *                       type: string
 *                     userId: 
 *                       type: string
 *                     permission: 
 *                       type: string
 *                     createdAt: 
 *                       type: string
 *                       format: date-time
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
 *         description: 分析任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 分享分析结果
router.post(
  '/:id/share',
  protect,
  [
    check('userId', '请提供用户ID').not().isEmpty(),
    check('permission')
      .optional()
      .isIn(['view', 'edit', 'comment'])
  ],
  validateRequest,
  aiController.shareAnalysis
);

/**
 * @swagger
 * /api/analysis/{id}/notes:
 *   post:
 *     summary: 添加分析笔记
 *     tags: [AI分析]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 分析任务ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AnalysisNote'
 *     responses:
 *       201:
 *         description: 成功添加分析笔记
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisNote'
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
 *         description: 分析任务不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 添加分析笔记
router.post(
  '/:id/notes',
  protect,
  [
    check('note', '请提供笔记内容').not().isEmpty()
  ],
  validateRequest,
  aiController.addAnalysisNote
);

module.exports = router;