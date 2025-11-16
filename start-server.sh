#!/bin/bash
# HTTP服务器一键启动脚本 - Shell版本
# 自动激活虚拟环境、启动HTTP服务器并打开浏览器

PORT=8000
URL="http://localhost:$PORT"

echo "=========================================="
echo "工程资料归档管理系统 - 一键启动"
echo "=========================================="

# 检查并激活Python虚拟环境
if [ -d "myenv" ]; then
    echo "🔍 检测到虚拟环境: myenv"
    echo "✅ 激活虚拟环境..."
    source myenv/bin/activate
    echo "✓ 虚拟环境已激活"
    echo ""
elif [ -d "venv" ]; then
    echo "🔍 检测到虚拟环境: venv"
    echo "✅ 激活虚拟环境..."
    source venv/bin/activate
    echo "✓ 虚拟环境已激活"
    echo ""
elif [ -d ".venv" ]; then
    echo "🔍 检测到虚拟环境: .venv"
    echo "✅ 激活虚拟环境..."
    source .venv/bin/activate
    echo "✓ 虚拟环境已激活"
    echo ""
else
    echo "ℹ️  未检测到虚拟环境，使用系统Python"
    echo ""
fi

# 自动打开浏览器的函数
open_browser() {
    sleep 2  # 等待服务器启动
    if command -v xdg-open &> /dev/null; then
        xdg-open "$URL" &> /dev/null &
    elif command -v open &> /dev/null; then
        open "$URL" &> /dev/null &
    elif command -v gnome-open &> /dev/null; then
        gnome-open "$URL" &> /dev/null &
    fi
}

# 启动浏览器（后台运行）
open_browser &

# 检查Python
if command -v python3 &> /dev/null; then
    echo "✅ 使用 Python 3 启动服务器..."
    echo "📡 服务器地址: $URL"
    echo "🌐 浏览器将自动打开..."
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo "=========================================="
    echo ""
    python3 -m http.server $PORT
    exit 0
fi

if command -v python &> /dev/null; then
    echo "✅ 使用 Python 启动服务器..."
    echo "📡 服务器地址: $URL"
    echo "🌐 浏览器将自动打开..."
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo "=========================================="
    echo ""
    python -m http.server $PORT
    exit 0
fi

# 检查Node.js的http-server
if command -v http-server &> /dev/null; then
    echo "✅ 使用 http-server 启动服务器..."
    echo "📡 服务器地址: $URL"
    echo "🌐 浏览器将自动打开..."
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo "=========================================="
    echo ""
    http-server -p $PORT
    exit 0
fi

# 检查Node.js的serve
if command -v serve &> /dev/null; then
    echo "✅ 使用 serve 启动服务器..."
    echo "📡 服务器地址: $URL"
    echo "🌐 浏览器将自动打开..."
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo "=========================================="
    echo ""
    serve -p $PORT
    exit 0
fi

# 都没有找到
echo "❌ 错误：未找到可用的HTTP服务器工具"
echo ""
echo "请安装以下工具之一："
echo "  1. Python 3:         sudo apt install python3"
echo "  2. Node.js + http-server:  npm install -g http-server"
echo "  3. Node.js + serve:        npm install -g serve"
echo ""
echo "推荐：Python 3（最简单）"
echo "=========================================="
exit 1
