#!/bin/bash
# 一键启动脚本 - 工程资料归档管理系统
# 自动激活虚拟环境、启动HTTP服务器并打开浏览器

# 默认端口
DEFAULT_PORT=8000
PORT=$DEFAULT_PORT

# 清屏
clear

echo "=========================================="
echo "   工程资料归档管理系统"
echo "   一键启动脚本 v1.1"
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
is_port_in_use() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -Pi :$port -sTCP:LISTEN -t &> /dev/null
        return $?
    elif command -v netstat &> /dev/null; then
        netstat -an | grep ":$port " | grep -q LISTEN
        return $?
    else
        # 如果没有可用的检测工具，假设端口可用
        return 1
    fi
}

# 查找可用端口
find_available_port() {
    local start_port=$1
    local max_attempts=10
    local current_port=$start_port

    for ((i=0; i<max_attempts; i++)); do
        if ! is_port_in_use $current_port; then
            PORT=$current_port
            return 0
        fi
        current_port=$((current_port + 1))
    done

    return 1
}

# 检查并处理端口占用
echo "🔍 检查端口可用性..."
if is_port_in_use $DEFAULT_PORT; then
    echo "⚠️  端口 $DEFAULT_PORT 已被占用"
    echo "🔄 正在查找可用端口..."

    if find_available_port $((DEFAULT_PORT + 1)); then
        echo "✓ 找到可用端口: $PORT"
        echo ""
    else
        echo "❌ 错误: 无法找到可用端口 (尝试了 $DEFAULT_PORT-$((DEFAULT_PORT + 9)))"
        echo ""
        echo "建议："
        echo "  1. 关闭占用这些端口的其他程序"
        echo "  2. 手动指定端口: PORT=9000 ./run.sh"
        echo ""
        exit 1
    fi
else
    echo "✓ 端口 $PORT 可用"
    echo ""
fi

URL="http://localhost:$PORT"

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
