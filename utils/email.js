const nodemailer = require('nodemailer');

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_PORT === 465, // 465端口使用SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

/**
 * 发送邮件
 * @param {Object} options - 邮件选项
 * @param {string} options.email - 收件人邮箱
 * @param {string} options.subject - 邮件主题
 * @param {string} options.html - 邮件HTML内容
 * @param {string} [options.text] - 邮件文本内容
 * @returns {Promise} - 发送结果
 */
const sendEmail = async (options) => {
  try {
    // 邮件配置
    const mailOptions = {
      from: `${process.env.APP_NAME || '皓月量化智能引擎'} <${process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '') // 从HTML提取纯文本
    };

    // 发送邮件
    const result = await transporter.sendMail(mailOptions);
    
    console.log('邮件发送成功:', result.messageId);
    return result;
  } catch (error) {
    console.error('邮件发送失败:', error);
    
    // 如果是开发环境且没有配置SMTP，不抛出错误
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('开发环境下未配置SMTP，邮件未实际发送');
      return { messageId: 'dev-mode-fake-id' };
    }
    
    throw error;
  }
};

/**
 * 发送欢迎邮件
 * @param {string} email - 用户邮箱
 * @param {string} name - 用户姓名
 * @param {string} username - 用户名
 * @returns {Promise} - 发送结果
 */
const sendWelcomeEmail = async (email, name, username) => {
  const html = `
    <h1>欢迎加入 ${process.env.APP_NAME || '皓月量化智能引擎'}！</h1>
    <p>亲爱的 ${name || username}，</p>
    <p>感谢您注册我们的服务！您的账号已成功创建。</p>
    <p><strong>用户名：</strong>${username}</p>
    <p><strong>邮箱：</strong>${email}</p>
    <p>我们提供专业的股票AI分析服务，帮助您做出更明智的投资决策。</p>
    <p>祝您投资顺利！</p>
    <p>此致<br>${process.env.APP_NAME || '皓月量化智能引擎'} 团队</p>
  `;

  return sendEmail({
    email,
    subject: '欢迎加入 ' + (process.env.APP_NAME || '皓月量化智能引擎'),
    html
  });
};

/**
 * 发送密码重置邮件
 * @param {string} email - 用户邮箱
 * @param {string} resetUrl - 重置链接
 * @returns {Promise} - 发送结果
 */
const sendPasswordResetEmail = async (email, resetUrl) => {
  const html = `
    <h1>密码重置请求</h1>
    <p>您收到此邮件是因为有人请求重置您的密码。</p>
    <p>请点击下方链接重置密码（15分钟内有效）：</p>
    <a href="${resetUrl}" target="_blank" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      重置密码
    </a>
    <p>如果您没有请求重置密码，请忽略此邮件。</p>
    <p>此致<br>${process.env.APP_NAME || '皓月量化智能引擎'} 团队</p>
  `;

  return sendEmail({
    email,
    subject: '密码重置 - ' + (process.env.APP_NAME || '皓月量化智能引擎'),
    html
  });
};

/**
 * 发送邮箱验证邮件
 * @param {string} email - 用户邮箱
 * @param {string} verificationUrl - 验证链接
 * @returns {Promise} - 发送结果
 */
const sendEmailVerification = async (email, verificationUrl) => {
  const html = `
    <h1>邮箱验证</h1>
    <p>请点击下方链接验证您的邮箱：</p>
    <a href="${verificationUrl}" target="_blank" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      验证邮箱
    </a>
    <p>如果您没有注册过我们的服务，请忽略此邮件。</p>
    <p>此致<br>${process.env.APP_NAME || '皓月量化智能引擎'} 团队</p>
  `;

  return sendEmail({
    email,
    subject: '邮箱验证 - ' + (process.env.APP_NAME || '皓月量化智能引擎'),
    html
  });
};

/**
 * 发送分析报告邮件
 * @param {string} email - 用户邮箱
 * @param {Object} analysis - 分析结果
 * @returns {Promise} - 发送结果
 */
const sendAnalysisReport = async (email, analysis) => {
  const html = `
    <h1>AI分析报告：${analysis.stockName} (${analysis.stockSymbol})</h1>
    <p><strong>分析类型：</strong>${analysis.analysisType}</p>
    <p><strong>时间范围：</strong>${analysis.timeRange}</p>
    <p><strong>分析结果：</strong>${analysis.result.recommendation}</p>
    <p><strong>综合评分：</strong>${analysis.result.overallRating}/10</p>
    <p><strong>目标价格：</strong>$${analysis.result.targetPrice}</p>
    <p><strong>置信度：</strong>${analysis.result.confidenceLevel}%</p>
    <p><strong>AI分析：</strong>${analysis.aiExplanation.reasoning}</p>
    <p>点击查看详细报告：<a href="${process.env.FRONTEND_URL}/analysis/${analysis._id}">查看详情</a></p>
    <p>此致<br>${process.env.APP_NAME || '皓月量化智能引擎'} 团队</p>
  `;

  return sendEmail({
    email,
    subject: 'AI分析报告 - ' + analysis.stockName,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
  sendAnalysisReport
};