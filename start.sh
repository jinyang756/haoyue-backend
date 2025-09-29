#!/bin/bash

# 皓月量化智能引擎启动脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Node.js是否安装
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}错误: Node.js未安装，请先安装Node.js 16+${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ $NODE_MAJOR -lt 16 ]; then
        echo -e "${RED}错误: Node.js版本过低，请升级到16+版本${NC}"
        exit 1
    fi
}

# 检查npm是否安装
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: npm未安装，请先安装npm${NC}"
        exit 1
    fi
}

# 检查MongoDB连接
check_mongodb() {
    if [ -z "$MONGODB_URI" ]; then
        echo -e "${YELLOW}警告: MONGODB_URI环境变量未设置${NC}"
        return
    fi
    
    # 尝试连接MongoDB（简化检查）
    node -e "
        const mongoose = require('mongoose');
        (async () => {
            try {
                await mongoose.connect(process.env.MONGODB_URI);
                console.log('${GREEN}MongoDB连接成功${NC}');
                await mongoose.connection.close();
            } catch (error) {
                console.log('${RED}MongoDB连接失败:${NC}', error.message);
            }
        })();
    "
}

# 安装依赖
install_dependencies() {
    echo -e "${YELLOW}正在安装依赖包...${NC}"
    npm install --production
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}依赖包安装完成${NC}"
    else
        echo -e "${RED}依赖包安装失败${NC}"
        exit 1
    fi
}

# 启动应用
start_app() {
    echo -e "${YELLOW}正在启动皓月量化智能引擎...${NC}"
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}警告: .env文件不存在，将使用系统环境变量${NC}"
    fi
    
    # 使用PM2启动应用
    if command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}使用PM2启动应用${NC}"
        pm2 start index.js --name "haoyue-api"
        
        # 保存PM2配置
        pm2 save
        
        # 设置PM2开机启动
        pm2 startup
        
        echo -e "${GREEN}应用启动成功${NC}"
        echo -e "${GREEN}应用名称: haoyue-api${NC}"
        echo -e "${GREEN}查看日志: pm2 logs haoyue-api${NC}"
        echo -e "${GREEN}停止应用: pm2 stop haoyue-api${NC}"
    else
        echo -e "${YELLOW}PM2未安装，使用node直接启动${NC}"
        node index.js
    fi
}

# 开发模式启动
start_dev() {
    echo -e "${YELLOW}正在启动开发模式...${NC}"
    
    # 检查开发依赖
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}正在安装所有依赖包...${NC}"
        npm install
    fi
    
    npm run dev
}

# 显示帮助信息
show_help() {
    echo "皓月量化智能引擎启动脚本"
    echo "用法: ./start.sh [选项]"
    echo
    echo "选项:"
    echo "  start         启动应用（生产模式）"
    echo "  dev           启动开发模式"
    echo "  install       安装依赖包"
    echo "  check         检查系统环境"
    echo "  help          显示帮助信息"
    echo
    echo "示例:"
    echo "  ./start.sh start      # 启动生产模式"
    echo "  ./start.sh dev        # 启动开发模式"
    echo "  ./start.sh install    # 安装依赖"
}

# 主函数
main() {
    case "$1" in
        start)
            check_node
            check_npm
            install_dependencies
            check_mongodb
            start_app
            ;;
        dev)
            check_node
            check_npm
            start_dev
            ;;
        install)
            check_npm
            install_dependencies
            ;;
        check)
            check_node
            check_npm
            check_mongodb
            echo -e "${GREEN}系统环境检查完成${NC}"
            ;;
        help)
            show_help
            ;;
        *)
            echo -e "${RED}错误: 无效的选项${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"