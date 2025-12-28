#!/bin/bash

# 紫微斗数命盘分析系统 - 一键启动
# 双击此文件即可启动服务器并打开浏览器

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 清屏
clear

echo -e "${PURPLE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}║          ${YELLOW}☯  紫微斗数命盘分析系统  ☯${PURPLE}                  ║${NC}"
echo -e "${PURPLE}║                                                            ║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 检查.env文件是否存在
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    echo -e "${RED}❌ 错误：未找到 .env 配置文件${NC}"
    echo -e "${YELLOW}请先配置 Gemini API 密钥${NC}"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

# 检查API密钥是否已配置
if ! grep -q "GEMINI_API_KEY=.\+" "$SCRIPT_DIR/.env"; then
    echo -e "${RED}❌ 错误：Gemini API 密钥未配置${NC}"
    echo -e "${YELLOW}请编辑 .env 文件，填入您的 API 密钥${NC}"
    echo ""
    echo -e "${CYAN}配置步骤：${NC}"
    echo "1. 打开项目目录下的 .env 文件"
    echo "2. 将 GEMINI_API_KEY= 后面填入您的实际密钥"
    echo "3. 保存文件后重新运行此脚本"
    echo ""
    read -p "按回车键退出..."
    exit 1
fi

# 进入backend目录
cd "$SCRIPT_DIR/backend" || {
    echo -e "${RED}❌ 错误：无法进入 backend 目录${NC}"
    read -p "按回车键退出..."
    exit 1
}

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  首次运行，正在安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ 依赖安装失败${NC}"
        read -p "按回车键退出..."
        exit 1
    fi
    echo -e "${GREEN}✅ 依赖安装成功${NC}"
    echo ""
fi

# 启动服务器
echo -e "${GREEN}🚀 正在启动服务器...${NC}"
echo ""

# 在后台启动服务器
node server.js &
SERVER_PID=$!

# 等待服务器启动（3秒）
echo -e "${CYAN}⏳ 等待服务器启动...${NC}"
sleep 3

# 检查服务器是否成功启动
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ 服务器启动成功！${NC}"
    echo ""
    echo -e "${CYAN}🌐 正在打开浏览器...${NC}"
    echo -e "${CYAN}访问地址: http://localhost:3000${NC}"
    echo ""
    
    # 打开浏览器
    open "http://localhost:3000"
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}✨ 系统已启动！${NC}"
    echo ""
    echo -e "${YELLOW}提示：${NC}"
    echo "  • 浏览器已自动打开系统界面"
    echo "  • 服务器正在后台运行"
    echo "  • 要停止服务器，请关闭此窗口或按 Ctrl+C"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # 等待服务器进程
    wait $SERVER_PID
else
    echo -e "${RED}❌ 服务器启动失败${NC}"
    read -p "按回车键退出..."
    exit 1
fi

# 服务器停止后的提示
echo ""
echo -e "${YELLOW}服务器已停止${NC}"
read -p "按回车键关闭此窗口..."
