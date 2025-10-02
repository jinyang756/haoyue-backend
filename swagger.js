const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: '皓月量化智能引擎API文档',
    description: '提供股票数据、智能分析和用户管理等功能的API接口文档',
    version: '1.0.0',
    contact: {
      name: '皓月量化团队',
      email: 'contact@haoyue-quant.com'
    },
    license: {
      name: 'MIT License',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  host: 'localhost:5001',
  schemes: ['http'],
  consumes: ['application/json'],
  produces: ['application/json'],
  tags: [
    {
      name: '认证',
      description: '用户认证相关接口'
    },
    {
      name: '用户管理',
      description: '用户管理相关接口'
    },
    {
      name: '股票',
      description: '股票数据相关接口'
    },
    {
      name: '分析',
      description: '股票分析相关接口'
    },
    {
      name: '推荐',
      description: '股票推荐相关接口'
    },
    {
      name: '新闻',
      description: '新闻资讯相关接口'
    }
  ],
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: '用于访问受保护资源的JWT令牌'
    }
  },
  definitions: {
    User: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          description: '用户唯一ID'
        },
        username: {
          type: 'string',
          description: '用户名'
        },
        email: {
          type: 'string',
          description: '用户邮箱'
        },
        role: {
          type: 'string',
          enum: ['user', 'admin'],
          description: '用户角色'
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: '更新时间'
        }
      }
    },
    Stock: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          description: '股票唯一ID'
        },
        symbol: {
          type: 'string',
          description: '股票代码'
        },
        name: {
          type: 'string',
          description: '股票名称'
        },
        market: {
          type: 'string',
          description: '股票市场'
        },
        price: {
          type: 'number',
          description: '当前价格'
        },
        change: {
          type: 'number',
          description: '价格变动'
        },
        changePercent: {
          type: 'number',
          description: '价格变动百分比'
        },
        volume: {
          type: 'number',
          description: '成交量'
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: '更新时间'
        }
      }
    },
    Analysis: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          description: '分析结果唯一ID'
        },
        stockId: {
          type: 'string',
          description: '关联的股票ID'
        },
        stockSymbol: {
          type: 'string',
          description: '股票代码'
        },
        analysisDate: {
          type: 'string',
          format: 'date-time',
          description: '分析日期'
        },
        indicators: {
          type: 'object',
          description: '技术指标分析结果'
        },
        aiPrediction: {
          type: 'object',
          description: 'AI预测结果'
        },
        sentiment: {
          type: 'number',
          description: '情感分析得分'
        },
        overallRating: {
          type: 'string',
          enum: ['买入', '持有', '卖出'],
          description: '综合评级'
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间'
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: '更新时间'
        }
      }
    },
    RegisterRequest: {
      type: 'object',
      required: ['username', 'email', 'password'],
      properties: {
        username: {
          type: 'string',
          description: '用户名，至少3个字符'
        },
        email: {
          type: 'string',
          description: '用户邮箱'
        },
        password: {
          type: 'string',
          description: '用户密码，至少6个字符'
        },
        name: {
          type: 'string',
          description: '用户姓名，可选'
        }
      }
    },
    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          description: '用户邮箱'
        },
        password: {
          type: 'string',
          description: '用户密码'
        }
      }
    },
    AuthResponse: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          description: 'JWT访问令牌'
        },
        refreshToken: {
          type: 'string',
          description: '刷新令牌'
        },
        user: {
          $ref: '#/definitions/User'
        }
      }
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: '响应状态'
        },
        message: {
          type: 'string',
          description: '错误消息'
        },
        stack: {
          type: 'string',
          description: '错误堆栈（仅开发环境可见）'
        }
      }
    }
  }
};

const outputFile = './build/swagger.json';
const endpointsFiles = [
  './routes/auth.routes.js',
  './routes/user.routes.js',
  './routes/stock.routes.js',
  './routes/analysis.routes.js',
  './routes/recommendation.routes.js',
  './routes/news.routes.js'
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger 文档生成完成！');
});