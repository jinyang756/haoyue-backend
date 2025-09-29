const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { protect, authorize, validateRequest } = require('../middleware/auth');

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