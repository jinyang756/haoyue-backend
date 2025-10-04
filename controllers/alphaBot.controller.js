const alphaBotService = require('../services/alphaBot.service');
const { logger } = require('../utils/logger');

/**
 * AlphaBot选股
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function selectStocks(req, res) {
  try {
    const options = req.body || {};
    
    logger.info('AlphaBot选股请求', { options });
    
    const selectedStocks = await alphaBotService.selectStocks(options);
    
    res.status(200).json({
      success: true,
      message: '选股完成',
      data: selectedStocks,
      count: selectedStocks.length
    });
  } catch (error) {
    logger.error('AlphaBot选股错误:', error);
    
    res.status(500).json({
      success: false,
      message: '选股失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
}

/**
 * AlphaBot诊股
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function diagnoseStock(req, res) {
  try {
    const { stockSymbol } = req.params;
    
    if (!stockSymbol) {
      return res.status(400).json({
        success: false,
        message: '请提供股票代码'
      });
    }
    
    logger.info('AlphaBot诊股请求', { stockSymbol });
    
    const diagnosis = await alphaBotService.diagnoseStock(stockSymbol);
    
    res.status(200).json({
      success: true,
      message: '诊股完成',
      data: diagnosis
    });
  } catch (error) {
    logger.error('AlphaBot诊股错误:', error);
    
    res.status(500).json({
      success: false,
      message: '诊股失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
}

/**
 * 获取AlphaBot配置选项
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
async function getAlphaBotOptions(req, res) {
  try {
    const options = {
      selectStocks: {
        minRating: {
          type: 'number',
          default: 7.0,
          description: '最低综合评级'
        },
        minConfidence: {
          type: 'number',
          default: 70,
          description: '最低置信度(%)'
        },
        maxRiskLevel: {
          type: 'string',
          default: 'medium',
          description: '最高等级风险',
          values: ['very low', 'low', 'medium', 'high', 'very high']
        },
        minFundamentalScore: {
          type: 'number',
          default: 70,
          description: '最低基本面得分'
        },
        minTechnicalScore: {
          type: 'number',
          default: 60,
          description: '最低技术面得分'
        },
        minUpsidePotential: {
          type: 'number',
          default: 15,
          description: '最低上涨潜力(%)'
        }
      }
    };
    
    res.status(200).json({
      success: true,
      data: options
    });
  } catch (error) {
    logger.error('获取AlphaBot配置选项错误:', error);
    
    res.status(500).json({
      success: false,
      message: '获取配置选项失败',
      error: process.env.NODE_ENV === 'development' ? error.message : '内部服务器错误'
    });
  }
}

module.exports = {
  selectStocks,
  diagnoseStock,
  getAlphaBotOptions
};