const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockController = require('../controllers/stock.controller');
const { protect, authorize, validateRequest } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Stock:
 *       type: object
 *       properties:
 *         id: 
 *           type: string
 *           description: 股票唯一ID
 *         symbol: 
 *           type: string
 *           description: 股票代码
 *           example: "AAPL"
 *         name: 
 *           type: string
 *           description: 股票名称
 *           example: "苹果公司"
 *         exchange: 
 *           type: string
 *           description: 交易所
 *           example: "NASDAQ"
 *         sector: 
 *           type: string
 *           description: 行业板块
 *         industry: 
 *           type: string
 *           description: 具体行业
 *         price: 
 *           type: number
 *           description: 当前价格
 *           example: 150.75
 *         change: 
 *           type: number
 *           description: 价格变动
 *           example: 2.35
 *         changePercent: 
 *           type: number
 *           description: 价格变动百分比
 *           example: 1.58
 *         marketCap: 
 *           type: number
 *           description: 市值
 *         volume: 
 *           type: number
 *           description: 成交量
 *         createdAt: 
 *           type: string
 *           format: date-time
 *         updatedAt: 
 *           type: string
 *           format: date-time
 *     StockHistory: 
 *       type: object
 *       properties:
 *         date: 
 *           type: string
 *           format: date
 *         open: 
 *           type: number
 *         high: 
 *           type: number
 *         low: 
 *           type: number
 *         close: 
 *           type: number
 *         volume: 
 *           type: number
 *     TechnicalIndicator: 
 *       type: object
 *       properties:
 *         name: 
 *           type: string
 *         value: 
 *           type: number
 *         date: 
 *           type: string
 *           format: date
 *     StockNews: 
 *       type: object
 *       properties:
 *         id: 
 *           type: string
 *         title: 
 *           type: string
 *         source: 
 *           type: string
 *         publishedAt: 
 *           type: string
 *           format: date-time
 *         url: 
 *           type: string
 *           format: uri
 *     AddStockRequest: 
 *       type: object
 *       required:
 *         - symbol
 *         - name
 *         - exchange
 *       properties:
 *         symbol: 
 *           type: string
 *           description: 股票代码
 *         name: 
 *           type: string
 *           description: 股票名称
 *         exchange: 
 *           type: string
 *           description: 交易所
 *         sector: 
 *           type: string
 *           description: 行业板块
 *         industry: 
 *           type: string
 *           description: 具体行业
 */

/**
 * @swagger
 * /api/stocks:
 *   get:
 *     summary: 获取所有股票列表
 *     tags: [股票]
 *     responses:
 *       200:
 *         description: 成功获取股票列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 stocks: 
 *                   type: array
 *                   items: 
 *                     $ref: '#/components/schemas/Stock'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// 公开路由
router.get('/', stockController.getAllStocks);

/**
 * @swagger
 * /api/stocks/search:
 *   get:
 *     summary: 搜索股票
 *     tags: [股票]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 搜索关键词（股票代码或名称）
 *     responses:
 *       200:
 *         description: 搜索结果
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 stocks: 
 *                   type: array
 *                   items: 
 *                     $ref: '#/components/schemas/Stock'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/search', stockController.searchStocks);

/**
 * @swagger
 * /api/stocks/sectors:
 *   get:
 *     summary: 获取所有行业板块
 *     tags: [股票]
 *     responses:
 *       200:
 *         description: 成功获取行业板块列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 sectors: 
 *                   type: array
 *                   items: 
 *                     type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/sectors', stockController.getSectors);

/**
 * @swagger
 * /api/stocks/industries:
 *   get:
 *     summary: 获取所有具体行业
 *     tags: [股票]
 *     responses:
 *       200:
 *         description: 成功获取具体行业列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 industries: 
 *                   type: array
 *                   items: 
 *                     type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/industries', stockController.getIndustries);

/**
 * @swagger
 * /api/stocks/{id}:
 *   get:
 *     summary: 获取股票详情
 *     tags: [股票]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 股票ID或代码
 *     responses:
 *       200:
 *         description: 成功获取股票详情
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
 *       404:
 *         description: 股票不存在
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
router.get('/:id', stockController.getStockById);

/**
 * @swagger
 * /api/stocks/{symbol}/history:
 *   get:
 *     summary: 获取股票历史数据
 *     tags: [股票]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: 股票代码
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date
 *         description: 开始日期（YYYY-MM-DD）
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date
 *         description: 结束日期（YYYY-MM-DD）
 *       - in: query
 *         name: interval
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *         description: 数据间隔
 *     responses:
 *       200:
 *         description: 成功获取股票历史数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 history: 
 *                   type: array
 *                   items: 
 *                     $ref: '#/components/schemas/StockHistory'
 *       404:
 *         description: 股票不存在
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
router.get('/:symbol/history', stockController.getStockHistory);

/**
 * @swagger
 * /api/stocks/{symbol}/technical:
 *   get:
 *     summary: 获取股票技术指标
 *     tags: [股票]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: 股票代码
 *     responses:
 *       200:
 *         description: 成功获取股票技术指标
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 indicators: 
 *                   type: array
 *                   items: 
 *                     $ref: '#/components/schemas/TechnicalIndicator'
 *       404:
 *         description: 股票不存在
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
router.get('/:symbol/technical', stockController.getStockTechnicalIndicators);

/**
 * @swagger
 * /api/stocks/{symbol}/ai-ratings:
 *   get:
 *     summary: 获取股票AI评级
 *     tags: [股票]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: 股票代码
 *     responses:
 *       200:
 *         description: 成功获取股票AI评级
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 rating: 
 *                   type: object
 *                   properties:
 *                     score: 
 *                       type: number
 *                     recommendation: 
 *                       type: string
 *                     analysisDate: 
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: 股票不存在
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
router.get('/:symbol/ai-ratings', stockController.getStockAiRatings);

/**
 * @swagger
 * /api/stocks/{symbol}/news:
 *   get:
 *     summary: 获取股票新闻
 *     tags: [股票]
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: 股票代码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 新闻数量限制
 *     responses:
 *       200:
 *         description: 成功获取股票新闻
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 news: 
 *                   type: array
 *                   items: 
 *                     $ref: '#/components/schemas/StockNews'
 *       404:
 *         description: 股票不存在
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
router.get('/:symbol/news', stockController.getStockNews);

/**
 * @swagger
 * /api/stocks:
 *   post:
 *     summary: 添加新股票（仅管理员）
 *     tags: [股票]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddStockRequest'
 *     responses:
 *       201:
 *         description: 成功添加新股票
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
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
 */
// 管理员路由
router.post(
  '/',
  protect,
  authorize('admin'),
  [
    check('symbol', '请提供股票代码').not().isEmpty(),
    check('name', '请提供股票名称').not().isEmpty(),
    check('exchange', '请提供交易所').not().isEmpty()
  ],
  validateRequest,
  stockController.addNewStock
);

/**
 * @swagger
 * /api/stocks/{symbol}:
 *   put:
 *     summary: 更新股票数据（仅管理员）
 *     tags: [股票]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: 股票代码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price: 
 *                 type: number
 *               volume: 
 *                 type: number
 *               marketCap: 
 *                 type: number
 *               sector: 
 *                 type: string
 *               industry: 
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功更新股票数据
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stock'
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
 *         description: 股票不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:symbol',
  protect,
  authorize('admin'),
  stockController.updateStockData
);

/**
 * @swagger
 * /api/stocks/{symbol}:
 *   delete:
 *     summary: 删除股票（仅管理员）
 *     tags: [股票]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: symbol
 *         required: true
 *         schema:
 *           type: string
 *         description: 股票代码
 *     responses:
 *       200:
 *         description: 成功删除股票
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
 *         description: 股票不存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  '/:symbol',
  protect,
  authorize('admin'),
  stockController.deleteStock
);

/**
 * @swagger
 * /api/stocks/schedule-status:
 *   get:
 *     summary: 获取定时任务状态（仅管理员）
 *     tags: [定时任务]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取定时任务状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: 
 *                   type: boolean
 *                   example: true
 *                 status: 
 *                   type: object
 *                   description: 定时任务状态信息
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: 权限不足
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/schedule-status',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const scheduleService = require('../services/schedule.service');
      const status = scheduleService.getJobsStatus();
      res.status(200).json({
        success: true,
        status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取定时任务状态失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;