@echo off
REM 一键启动脚本 - 工程资料归档管理系统
REM 自动激活虚拟环境、启动HTTP服务器并打开浏览器

chcp 65001 >nul
cls

SET PORT=8000
SET URL=http://localhost:%PORT%

echo ==========================================
echo    工程资料归档管理系统
echo    一键启动脚本 v1.0
echo ==========================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"
echo 📂 工作目录: %CD%
echo.

REM 检查并激活Python虚拟环境
SET VENV_ACTIVATED=0

if exist "myenv\Scripts\activate.bat" (
    echo 🔍 检测到虚拟环境: myenv
    echo ✅ 激活虚拟环境...
    call myenv\Scripts\activate.bat
    SET VENV_ACTIVATED=1
    echo ✓ 虚拟环境已激活 ^(myenv^)
    echo.
) else if exist "venv\Scripts\activate.bat" (
    echo 🔍 检测到虚拟环境: venv
    echo ✅ 激活虚拟环境...
    call venv\Scripts\activate.bat
    SET VENV_ACTIVATED=1
    echo ✓ 虚拟环境已激活 ^(venv^)
    echo.
) else if exist ".venv\Scripts\activate.bat" (
    echo 🔍 检测到虚拟环境: .venv
    echo ✅ 激活虚拟环境...
    call .venv\Scripts\activate.bat
    SET VENV_ACTIVATED=1
    echo ✓ 虚拟环境已激活 ^(.venv^)
    echo.
) else (
    echo ℹ️  未检测到虚拟环境，使用系统Python
    echo.
)

REM 启动浏览器（后台）
echo ==========================================
echo 🚀 启动HTTP服务器
echo ==========================================
echo.

REM 延迟2秒后打开浏览器
start "" /B timeout /t 2 /nobreak >nul && start "" "%URL%"

REM 检查Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ 使用 Python 启动服务器
    echo 📡 服务器地址: %URL%
    echo 🌐 浏览器将自动打开...
    echo ⏹️  按 Ctrl+C 停止服务器
    echo.
    echo ==========================================
    echo.
    python -m http.server %PORT%
    goto :end
)

REM 检查http-server
where http-server >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ 使用 http-server 启动服务器
    echo 📡 服务器地址: %URL%
    echo 🌐 浏览器将自动打开...
    echo ⏹️  按 Ctrl+C 停止服务器
    echo.
    echo ==========================================
    echo.
    http-server -p %PORT%
    goto :end
)

REM 检查serve
where serve >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ 使用 serve 启动服务器
    echo 📡 服务器地址: %URL%
    echo 🌐 浏览器将自动打开...
    echo ⏹️  按 Ctrl+C 停止服务器
    echo.
    echo ==========================================
    echo.
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
echo.
echo ==========================================
echo 🛑 服务器已停止
if %VENV_ACTIVATED% EQU 1 (
    echo 📦 虚拟环境仍保持激活状态
)
echo ==========================================
echo.
pause
