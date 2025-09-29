const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const aiController = require('../controllers/ai.controller');
const { protect, validateRequest } = require('../middleware/auth');

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

// 获取分析任务列表
router.get('/', protect, aiController.getAnalysisList);

// 获取分析任务详情
router.get('/:id', protect, aiController.getAnalysisById);

// 取消分析任务
router.put('/:id/cancel', protect, aiController.cancelAnalysis);

// 获取分析统计
router.get('/stats', protect, aiController.getAnalysisStats);

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