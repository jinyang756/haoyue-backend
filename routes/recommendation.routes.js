const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize, validateRequest } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Recommendation: 
 *       type: object
 *       properties:
 *         id: 
 *           type: string
 *           description: 推荐唯一ID
 *         stockSymbol: 
 *           type: string
 *           description: 股票代码
 *           example: "AAPL"
 *         stockName: 
 *           type: string
 *           description: 股票名称
 *           example: "苹果公司"
 *         recommendationType: 
 *           type: string
 *           enum: [买入, 持有, 卖出]
 *           description: 推荐类型
 *         confidenceScore: 
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: 置信度分数
 *           example: 0.85
 *         reason: 
 *           type: string
 *           description: 推荐理由
 *         timeRange: 
 *           type: string
 *           enum: [short, medium, long]
 *           description: 时间范围
 *         detailedAnalysis: 
 *           type: string
 *           description: 详细分析
 *         technicalIndicators: 
 *           type: object
 *           description: 技术指标
 *           properties:
 *             macd: 
 *               type: string
 *             rsi: 
 *               type: string
 *             ma: 
 *               type: string
 *         fundamentalIndicators: 
 *           type: object
 *           description: 基本面指标
 *           properties:
 *             peRatio: 
 *               type: number
 *             eps: 
 *               type: number
 *             revenueGrowth: 
 *               type: number
 *         createdAt: 
 *           type: string
 *           format: date-time
 *         updatedAt: 
 *           type: string
 *           format: date-time
 *     CreateRecommendationRequest: 
 *       type: object
 *       required:
 *         - stockSymbol
 *         - recommendationType
 *         - confidenceScore
 *         - reason
 *       properties:
 *         stockSymbol: 
 *           type: string
 *           description: 股票代码
 *         recommendationType: 
 *           type: string
 *           enum: [买入, 持有, 卖出]
 *           description: 推荐类型
 *         confidenceScore: 
 *           type: number
 *           minimum: 0
 *           maximum: 1
 *           description: 置信度分数
 *         reason: 
 *           type: string
 *           description: 推荐理由
 *         timeRange: 
 *           type: string
 *           enum: [short, medium, long]
 *           description: 时间范围
 *         detailedAnalysis: 
 *           type: string
 *           description: 详细分析
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: 获取推荐列表
 *     tags: [推荐]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [买入, 持有, 卖出]
 *         description: 推荐类型筛选
 *       - in: query
 *         name: stockSymbol
 *         schema:
 *           type: string
 *         description: 股票代码筛选
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [short, medium, long]
 *         description: 时间范围筛选
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
 *         description: 成功获取推荐列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 recommendations: 
 *                   type: array
 *                   items: 
 *                     $ref: '#/components/schemas/Recommendation'
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
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 获取推荐列表
router.get('/', protect, async (req, res) => {
  try {
    const { type, stockSymbol, timeRange } = req.query;
    res.status(200).json({
      message: '获取推荐列表成功',
      recommendations: [
        {
          id: '1',
          stockSymbol: 'AAPL',
          stockName: '苹果公司',
          recommendationType: '买入',
          confidenceScore: 0.85,
          reason: '技术面和基本面均表现良好',
          timeRange: timeRange || 'short',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          stockSymbol: 'MSFT',
          stockName: '微软公司',
          recommendationType: '持有',
          confidenceScore: 0.72,
          reason: '短期波动但长期看好',
          timeRange: timeRange || 'medium',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ]
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
 *     summary: 获取单个推荐详情
 *     tags: [推荐]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 推荐ID
 *     responses:
 *       200:
 *         description: 成功获取推荐详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 recommendation: 
 *                   $ref: '#/components/schemas/Recommendation'
 *       401:
 *         description: 未授权，需要有效的访问令牌
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 推荐不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 获取单个推荐详情
router.get('/:id', protect, async (req, res) => {
  try {
    res.status(200).json({
      message: '获取推荐详情成功',
      recommendation: {
        id: req.params.id,
        stockSymbol: 'AAPL',
        stockName: '苹果公司',
        recommendationType: '买入',
        confidenceScore: 0.85,
        reason: '技术面和基本面均表现良好',
        detailedAnalysis: '经过AI模型综合分析，该股票在未来3个月内有较大上涨潜力。',
        technicalIndicators: {
          macd: '买入信号',
          rsi: '中性',
          ma: '金叉'
        },
        fundamentalIndicators: {
          peRatio: 25.5,
          eps: 6.21,
          revenueGrowth: 12.3
        },
        timeRange: 'short',
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
 * /:
 *   post:
 *     summary: 创建推荐（仅管理员）
 *     tags: [推荐]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecommendationRequest'
 *     responses:
 *       201:
 *         description: 成功创建推荐
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 recommendation: 
 *                   $ref: '#/components/schemas/Recommendation'
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
 *       403:
 *         description: 禁止访问，需要管理员权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 创建推荐（仅管理员）
router.post('/', protect, authorize('admin'), [
  check('stockSymbol', '请提供股票代码').not().isEmpty(),
  check('recommendationType', '请提供推荐类型').isIn(['买入', '持有', '卖出']),
  check('confidenceScore', '请提供置信度分数').isFloat({ min: 0, max: 1 }),
  check('reason', '请提供推荐理由').not().isEmpty()
], validateRequest, async (req, res) => {
  try {
    res.status(201).json({
      message: '创建推荐成功',
      recommendation: {
        id: '3',
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
 *   put:
 *     summary: 更新推荐（仅管理员）
 *     tags: [推荐]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 推荐ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stockSymbol: 
 *                 type: string
 *                 description: 股票代码
 *               recommendationType: 
 *                 type: string
 *                 enum: [买入, 持有, 卖出]
 *                 description: 推荐类型
 *               confidenceScore: 
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: 置信度分数
 *               reason: 
 *                 type: string
 *                 description: 推荐理由
 *               timeRange: 
 *                 type: string
 *                 enum: [short, medium, long]
 *                 description: 时间范围
 *               detailedAnalysis: 
 *                 type: string
 *                 description: 详细分析
 *     responses:
 *       200:
 *         description: 成功更新推荐
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 recommendation: 
 *                   $ref: '#/components/schemas/Recommendation'
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
 *       403:
 *         description: 禁止访问，需要管理员权限
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 推荐不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 更新推荐（仅管理员）
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    res.status(200).json({
      message: '更新推荐成功',
      recommendation: {
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
 *     summary: 删除推荐（仅管理员）
 *     tags: [推荐]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 推荐ID
 *     responses:
 *       200:
 *         description: 成功删除推荐
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
 *         description: 推荐不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 删除推荐（仅管理员）
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    res.status(200).json({
      message: '删除推荐成功'
    });
  } catch (error) {
    res.status(500).json({
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;