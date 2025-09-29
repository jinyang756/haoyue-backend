const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stockController = require('../controllers/stock.controller');
const { protect, authorize, validateRequest } = require('../middleware/auth');

// 公开路由
router.get('/', stockController.getAllStocks);
router.get('/search', stockController.searchStocks);
router.get('/sectors', stockController.getSectors);
router.get('/industries', stockController.getIndustries);
router.get('/:id', stockController.getStockById);
router.get('/:symbol/history', stockController.getStockHistory);
router.get('/:symbol/technical', stockController.getStockTechnicalIndicators);
router.get('/:symbol/ai-ratings', stockController.getStockAiRatings);
router.get('/:symbol/news', stockController.getStockNews);

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

router.put(
  '/:symbol',
  protect,
  authorize('admin'),
  stockController.updateStockData
);

router.delete(
  '/:symbol',
  protect,
  authorize('admin'),
  stockController.deleteStock
);

module.exports = router;