#!/bin/bash
# HTTP服务器启动脚本 - Shell版本
# 自动检测可用的HTTP服务器工具并启动

PORT=8000

echo "=========================================="
echo "工程资料归档管理系统 - HTTP服务器"
echo "=========================================="

# 检查Python
if command -v python3 &> /dev/null; then
    echo "✅ 使用 Python 3 启动服务器..."
    echo "服务器地址: http://localhost:$PORT"
    echo "按 Ctrl+C 停止服务器"
    echo "=========================================="
    python3 -m http.server $PORT
    exit 0
fi

if command -v python &> /dev/null; then
    echo "✅ 使用 Python 启动服务器..."
    echo "服务器地址: http://localhost:$PORT"
    echo "按 Ctrl+C 停止服务器"
    echo "=========================================="
    python -m http.server $PORT
    exit 0
fi

# 检查Node.js的http-server
if command -v http-server &> /dev/null; then
    echo "✅ 使用 http-server 启动服务器..."
    echo "服务器地址: http://localhost:$PORT"
    echo "按 Ctrl+C 停止服务器"
    echo "=========================================="
    http-server -p $PORT
    exit 0
fi

# 检查Node.js的serve
if command -v serve &> /dev/null; then
    echo "✅ 使用 serve 启动服务器..."
    echo "服务器地址: http://localhost:$PORT"
    echo "按 Ctrl+C 停止服务器"
    echo "=========================================="
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
