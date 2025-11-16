#!/usr/bin/env python3
"""
HTTP服务器启动脚本 - Python版本
适用于已安装Python 3的环境
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# 配置
PORT = 8000
DIRECTORY = Path(__file__).parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def end_headers(self):
        # 添加CORS头，允许跨域访问
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # 禁用缓存，便于开发调试
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def main():
    os.chdir(DIRECTORY)

    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 60)
        print("工程资料归档管理系统 - HTTP服务器")
        print("=" * 60)
        print(f"服务器地址: {url}")
        print(f"服务器端口: {PORT}")
        print(f"工作目录: {DIRECTORY}")
        print()
        print("✅ 服务器已启动！")
        print()
        print("请在浏览器中访问上述地址，或等待浏览器自动打开...")
        print("按 Ctrl+C 停止服务器")
        print("=" * 60)

        # 尝试自动打开浏览器
        try:
            webbrowser.open(url)
        except:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n服务器已停止")

if __name__ == "__main__":
    main()
