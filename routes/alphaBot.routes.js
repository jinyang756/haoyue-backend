const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const alphaBotController = require('../controllers/alphaBot.controller');
const { protect, validateRequest } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     AlphaBotStockSelection:
 *       type: object
 *       properties:
 *         stock:
 *           type: object
 *           properties:
 *             symbol:
 *               type: string
 *               description: 股票代码
 *             name:
 *               type: string
 *               description: 股票名称
 *             latestPrice:
 *               type: number
 *               description: 最新价格
 *         analysis:
 *           type: object
 *           properties:
 *             overallRating:
 *               type: number
 *               description: 综合评级
 *             recommendation:
 *               type: string
 *               description: 投资建议
 *             confidenceLevel:
 *               type: number
 *               description: 置信度
 *             riskLevel:
 *               type: string
 *               description: 风险等级
 *             upsidePotential:
 *               type: number
 *               description: 上涨潜力
 *     AlphaBotDiagnosis:
 *       type: object
 *       properties:
 *         stock:
 *           type: object
 *           properties:
 *             symbol:
 *               type: string
 *               description: 股票代码
 *             name:
 *               type: string
 *               description: 股票名称
 *             price:
 *               type: number
 *               description: 当前价格
 *         analysis:
 *           type: object
 *           properties:
 *             overallRating:
 *               type: number
 *               description: 综合评级
 *             recommendation:
 *               type: string
 *               description: 投资建议
 *             confidenceLevel:
 *               type: number
 *               description: 置信度
 *             riskLevel:
 *               type: string
 *               description: 风险等级
 *             targetPrice:
 *               type: number
 *               description: 目标价格
 *             stopLossPrice:
 *               type: number
 *               description: 止损价格
 *             upsidePotential:
 *               type: number
 *               description: 上涨潜力
 *             downsideRisk:
 *               type: number
 *               description: 下跌风险
 *         alphaBotDiagnosis:
 *           type: object
 *           properties:
 *             summary:
 *               type: string
 *               description: 诊断摘要
 *             strengths:
 *               type: array
 *               items:
 *                 type: string
 *               description: 优势
 *             weaknesses:
 *               type: array
 *               items:
 *                 type: string
 *               description: 劣势
 *             investmentAdvice:
 *               type: array
 *               items:
 *                 type: string
 *               description: 投资建议
 *             riskWarnings:
 *               type: array
 *               items:
 *                 type: string
 *               description: 风险提示
 */

/**
 * @swagger
 * /alphaBot/select-stocks:
 *   post:
 *     summary: AlphaBot选股
 *     tags: [AlphaBot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               minRating:
 *                 type: number
 *                 description: 最低综合评级
 *               minConfidence:
 *                 type: number
 *                 description: 最低置信度
 *               maxRiskLevel:
 *                 type: string
 *                 description: 最高等级风险
 *               minFundamentalScore:
 *                 type: number
 *                 description: 最低基本面得分
 *               minTechnicalScore:
 *                 type: number
 *                 description: 最低技术面得分
 *               minUpsidePotential:
 *                 type: number
 *                 description: 最低上涨潜力
 *     responses:
 *       200:
 *         description: 成功选股
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AlphaBotStockSelection'
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.post(
  '/select-stocks',
  protect,
  alphaBotController.selectStocks
);

/**
 * @swagger
 * /alphaBot/diagnose/{stockSymbol}:
 *   get:
 *     summary: AlphaBot诊股
 *     tags: [AlphaBot]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stockSymbol
 *         required: true
 *         schema:
 *           type: string
 *         description: 股票代码
 *     responses:
 *       200:
 *         description: 成功诊股
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/AlphaBotDiagnosis'
 *       400:
 *         description: 参数错误
 *       401:
 *         description: 未授权
 *       404:
 *         description: 股票未找到
 *       500:
 *         description: 服务器错误
 */
router.get(
  '/diagnose/:stockSymbol',
  protect,
  alphaBotController.diagnoseStock
);

/**
 * @swagger
 * /alphaBot/options:
 *   get:
 *     summary: 获取AlphaBot配置选项
 *     tags: [AlphaBot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取配置选项
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: 未授权
 *       500:
 *         description: 服务器错误
 */
router.get(
  '/options',
  protect,
  alphaBotController.getAlphaBotOptions
);

module.exports = router;