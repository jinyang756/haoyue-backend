# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --only=production

# 复制应用代码
COPY . .

# 创建日志目录
RUN mkdir -p /app/logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# 启动应用
CMD ["npm", "start"]