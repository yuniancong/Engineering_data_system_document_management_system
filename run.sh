#!/bin/bash
# 一键启动脚本 - 工程资料归档管理系统
# 自动激活虚拟环境、启动HTTP服务器并打开浏览器

PORT=8000
URL="http://localhost:$PORT"

# 清屏
clear

echo "=========================================="
echo "   工程资料归档管理系统"
echo "   一键启动脚本 v1.0"
echo "=========================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📂 工作目录: $SCRIPT_DIR"
echo ""

# 检查并激活Python虚拟环境
VENV_ACTIVATED=false

if [ -d "myenv" ]; then
    echo "🔍 检测到虚拟环境: myenv"
    echo "✅ 激活虚拟环境..."
    source myenv/bin/activate
    VENV_ACTIVATED=true
    echo "✓ 虚拟环境已激活 (myenv)"
    echo ""
elif [ -d "venv" ]; then
    echo "🔍 检测到虚拟环境: venv"
    echo "✅ 激活虚拟环境..."
    source venv/bin/activate
    VENV_ACTIVATED=true
    echo "✓ 虚拟环境已激活 (venv)"
    echo ""
elif [ -d ".venv" ]; then
    echo "🔍 检测到虚拟环境: .venv"
    echo "✅ 激活虚拟环境..."
    source .venv/bin/activate
    VENV_ACTIVATED=true
    echo "✓ 虚拟环境已激活 (.venv)"
    echo ""
else
    echo "ℹ️  未检测到虚拟环境，使用系统Python"
    echo ""
fi

# 检查端口是否被占用
check_port() {
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$PORT -sTCP:LISTEN -t &> /dev/null; then
            echo "⚠️  警告: 端口 $PORT 已被占用"
            echo "请关闭占用该端口的程序，或修改脚本中的 PORT 变量"
            echo ""
            read -p "是否继续尝试启动？(y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
}

check_port

# 自动打开浏览器的函数
open_browser() {
    echo "⏳ 等待服务器启动..."
    sleep 2

    echo "🌐 正在打开浏览器..."
    if command -v xdg-open &> /dev/null; then
        xdg-open "$URL" &> /dev/null &
        echo "✓ 浏览器已打开 (xdg-open)"
    elif command -v open &> /dev/null; then
        open "$URL" &> /dev/null &
        echo "✓ 浏览器已打开 (open)"
    elif command -v gnome-open &> /dev/null; then
        gnome-open "$URL" &> /dev/null &
        echo "✓ 浏览器已打开 (gnome-open)"
    elif command -v python3 &> /dev/null; then
        python3 -m webbrowser "$URL" &> /dev/null &
        echo "✓ 浏览器已打开 (python webbrowser)"
    else
        echo "⚠️  无法自动打开浏览器，请手动访问: $URL"
    fi
}

# 清理函数
cleanup() {
    echo ""
    echo ""
    echo "=========================================="
    echo "🛑 服务器已停止"
    if [ "$VENV_ACTIVATED" = true ]; then
        echo "📦 虚拟环境仍保持激活状态"
    fi
    echo "=========================================="
    exit 0
}

# 捕获Ctrl+C信号
trap cleanup INT TERM

# 启动浏览器（后台运行）
open_browser &

# 检查并启动HTTP服务器
echo "=========================================="
echo "🚀 启动HTTP服务器"
echo "=========================================="
echo ""

if command -v python3 &> /dev/null; then
    echo "✅ 使用 Python 3 启动服务器"
    echo "📡 服务器地址: $URL"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    echo "=========================================="
    echo ""
    python3 -m http.server $PORT
    cleanup
fi

if command -v python &> /dev/null; then
    echo "✅ 使用 Python 启动服务器"
    echo "📡 服务器地址: $URL"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    echo "=========================================="
    echo ""
    python -m http.server $PORT
    cleanup
fi

# 检查Node.js的http-server
if command -v http-server &> /dev/null; then
    echo "✅ 使用 http-server 启动服务器"
    echo "📡 服务器地址: $URL"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    echo "=========================================="
    echo ""
    http-server -p $PORT
    cleanup
fi

# 检查Node.js的serve
if command -v serve &> /dev/null; then
    echo "✅ 使用 serve 启动服务器"
    echo "📡 服务器地址: $URL"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    echo "=========================================="
    echo ""
    serve -p $PORT
    cleanup
fi

# 都没有找到
echo "❌ 错误：未找到可用的HTTP服务器工具"
echo ""
echo "请安装以下工具之一："
echo "  1. Python 3:              sudo apt install python3"
echo "  2. Node.js + http-server: npm install -g http-server"
echo "  3. Node.js + serve:       npm install -g serve"
echo ""
echo "推荐：Python 3（最简单）"
echo "=========================================="
exit 1
