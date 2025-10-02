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
 * /:
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
 * /search:
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
 * /sectors:
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
router.get('/sectors', stockController.getAllSectors);

/**
 * @swagger
 * /{symbol}:
 *   get:
 *     summary: 获取股票详情
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
 *         description: 成功获取股票详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 stock: 
 *                   $ref: '#/components/schemas/Stock'
 *       404:
 *         description: 股票未找到
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
router.get('/:symbol', stockController.getStockBySymbol);

/**
 * @swagger
 * /{symbol}/history:
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
 *         name: period
 *         schema:
 *           type: string
 *           enum: [1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, max]
 *         description: 时间周期
 *     responses:
 *       200:
 *         description: 成功获取历史数据
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
 *         description: 股票未找到
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
 * /{symbol}/technical:
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
 *         description: 成功获取技术指标
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 indicators: 
 *                   $ref: '#/components/schemas/TechnicalIndicator'
 *       404:
 *         description: 股票未找到
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
router.get('/:symbol/technical', stockController.getTechnicalIndicators);

/**
 * @swagger
 * /{symbol}/news:
 *   get:
 *     summary: 获取股票相关新闻
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
 *         description: 成功获取相关新闻
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
 *         description: 股票未找到
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
 * /{symbol}/update:
 *   post:
 *     summary: 更新股票数据
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
 *         description: 成功更新股票数据
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: 
 *                   type: string
 *                 stock: 
 *                   $ref: '#/components/schemas/Stock'
 *       404:
 *         description: 股票未找到
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
router.post('/:symbol/update', protect, authorize('admin'), stockController.updateStockData);

module.exports = router;