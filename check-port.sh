#!/bin/bash
# 端口管理辅助脚本
# 帮助查找和终止占用端口的进程

PORT=${1:-8000}

echo "=========================================="
echo "   端口管理工具"
echo "=========================================="
echo ""
echo "检查端口: $PORT"
echo ""

# 检查端口占用
check_port() {
    if command -v lsof &> /dev/null; then
        echo "📋 使用 lsof 检查端口..."
        RESULT=$(lsof -Pi :$PORT -sTCP:LISTEN 2>/dev/null)
        if [ -n "$RESULT" ]; then
            echo "✓ 找到占用端口 $PORT 的进程:"
            echo ""
            echo "$RESULT"
            echo ""

            # 获取PID
            PID=$(echo "$RESULT" | tail -n 1 | awk '{print $2}')
            if [ -n "$PID" ]; then
                echo "进程ID (PID): $PID"
                echo ""
                read -p "是否要终止该进程？(y/N) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    kill $PID 2>/dev/null
                    if [ $? -eq 0 ]; then
                        echo "✓ 进程已终止"
                    else
                        echo "⚠️  终止失败，尝试强制终止..."
                        kill -9 $PID 2>/dev/null
                        if [ $? -eq 0 ]; then
                            echo "✓ 进程已强制终止"
                        else
                            echo "❌ 无法终止进程，可能需要管理员权限"
                            echo "   请尝试: sudo kill $PID"
                        fi
                    fi
                else
                    echo "已取消"
                fi
            fi
        else
            echo "✓ 端口 $PORT 未被占用"
        fi
    elif command -v netstat &> /dev/null; then
        echo "📋 使用 netstat 检查端口..."
        RESULT=$(netstat -an | grep ":$PORT " | grep LISTEN)
        if [ -n "$RESULT" ]; then
            echo "✓ 端口 $PORT 被占用:"
            echo ""
            echo "$RESULT"
            echo ""
            echo "⚠️  netstat 无法显示进程信息"
            echo "请使用以下命令查看详细信息:"
            echo "  lsof -Pi :$PORT"
        else
            echo "✓ 端口 $PORT 未被占用"
        fi
    else
        echo "❌ 未找到可用的端口检测工具 (lsof 或 netstat)"
        echo ""
        echo "请安装 lsof:"
        echo "  macOS: brew install lsof"
        echo "  Ubuntu/Debian: sudo apt install lsof"
    fi
}

# 查找可用端口
find_ports() {
    echo ""
    echo "🔍 查找可用端口 (8000-8010)..."
    echo ""

    for p in {8000..8010}; do
        if command -v lsof &> /dev/null; then
            if ! lsof -Pi :$p -sTCP:LISTEN -t &> /dev/null; then
                echo "  ✓ 端口 $p 可用"
            else
                echo "  ✗ 端口 $p 被占用"
            fi
        fi
    done
}

# 执行检查
check_port

# 如果提供了 -a 参数，显示所有可用端口
if [ "$2" = "-a" ]; then
    find_ports
fi

echo ""
echo "=========================================="
echo ""
echo "使用说明："
echo "  检查端口: ./check-port.sh 8000"
echo "  查找可用端口: ./check-port.sh 8000 -a"
echo ""
