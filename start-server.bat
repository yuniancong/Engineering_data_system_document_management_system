@echo off
REM HTTP服务器启动脚本 - Windows批处理版本
REM 自动检测可用的HTTP服务器工具并启动

SET PORT=8000

echo ==========================================
echo 工程资料归档管理系统 - HTTP服务器
echo ==========================================

REM 检查Python 3
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ 使用 Python 启动服务器...
    echo 服务器地址: http://localhost:%PORT%
    echo 按 Ctrl+C 停止服务器
    echo ==========================================
    python -m http.server %PORT%
    goto :end
)

REM 检查http-server
where http-server >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ 使用 http-server 启动服务器...
    echo 服务器地址: http://localhost:%PORT%
    echo 按 Ctrl+C 停止服务器
    echo ==========================================
    http-server -p %PORT%
    goto :end
)

REM 检查serve
where serve >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ 使用 serve 启动服务器...
    echo 服务器地址: http://localhost:%PORT%
    echo 按 Ctrl+C 停止服务器
    echo ==========================================
    serve -p %PORT%
    goto :end
)

REM 都没有找到
echo ❌ 错误：未找到可用的HTTP服务器工具
echo.
echo 请安装以下工具之一：
echo   1. Python:              https://www.python.org/downloads/
echo   2. Node.js + http-server:  npm install -g http-server
echo   3. Node.js + serve:        npm install -g serve
echo.
echo 推荐：Python（最简单）
echo ==========================================
pause
goto :end

:end
