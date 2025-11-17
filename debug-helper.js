/**
 * 调试和诊断工具
 * 用于检查模板、数据和导出功能的状态
 */

class DebugHelper {
    constructor(dataManager, wordExporter) {
        this.dataManager = dataManager;
        this.wordExporter = wordExporter;
    }

    /**
     * 显示调试面板
     */
    showDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0;">🔍 调试面板</h3>
                <button onclick="document.getElementById('debug-panel').remove()" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
            </div>
            <div id="debug-content"></div>
        `;

        document.body.appendChild(panel);
        this.updateDebugInfo();
    }

    /**
     * 更新调试信息
     */
    updateDebugInfo() {
        const content = document.getElementById('debug-content');
        if (!content) return;

        const html = `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 10px 0 5px 0; color: #2196F3;">📊 数据状态</h4>
                ${this.checkDataStatus()}
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="margin: 10px 0 5px 0; color: #4CAF50;">📄 模板状态</h4>
                ${this.checkTemplateStatus()}
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="margin: 10px 0 5px 0; color: #FF9800;">🔧 快速操作</h4>
                ${this.getQuickActions()}
            </div>
        `;

        content.innerHTML = html;
    }

    /**
     * 检查数据状态
     */
    checkDataStatus() {
        const recordData = this.dataManager.recordData;
        const coverData = this.dataManager.coverData;
        const directoryData = this.dataManager.directoryData;
        const catalogData = this.dataManager.catalogData;

        return `
            <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                <strong>卷内目录：</strong> ${directoryData.length} 行<br>
                <strong>备考表数据：</strong><br>
                <div style="margin-left: 15px;">
                    总页数: ${recordData.totalPages || '<span style="color: red;">未设置</span>'}<br>
                    文字页: ${recordData.textPages || '<span style="color: red;">未设置</span>'}<br>
                    图样页: ${recordData.drawingPages || '<span style="color: red;">未设置</span>'}<br>
                    照片数: ${recordData.photoCount || '<span style="color: red;">未设置</span>'}<br>
                    立卷人: ${recordData.creator || '<span style="color: red;">未设置</span>'}<br>
                    审核人: ${recordData.reviewer || '<span style="color: red;">未设置</span>'}
                </div>
                <strong>封面数据：</strong><br>
                <div style="margin-left: 15px;">
                    档号: ${coverData.archiveNo || '<span style="color: red;">未设置</span>'}<br>
                    题名: ${coverData.title || '<span style="color: red;">未设置</span>'}<br>
                    单位: ${coverData.unit || '<span style="color: red;">未设置</span>'}<br>
                    起止日期: ${coverData.startDate || '?'} ~ ${coverData.endDate || '?'}
                </div>
                <strong>案卷目录：</strong> ${catalogData.length} 卷
            </div>
        `;
    }

    /**
     * 检查模板状态
     */
    checkTemplateStatus() {
        return `
            <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                <p style="margin: 5px 0;">
                    <strong>提示：</strong>备考表、封面、移交书需要在模板中添加占位符才能正常导出数据。
                </p>
                <button onclick="debugHelper.showTemplateGuide()" style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 10px;">
                    📖 查看模板配置指南
                </button>
                <button onclick="debugHelper.testTemplateExport()" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 5px;">
                    🧪 测试导出功能
                </button>
            </div>
        `;
    }

    /**
     * 获取快速操作按钮
     */
    getQuickActions() {
        return `
            <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                <button onclick="debugHelper.autoGenerateAll()" style="background: #FF9800; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 5px;">
                    ⚡ 自动生成所有数据
                </button>
                <button onclick="debugHelper.exportDataJSON()" style="background: #9C27B0; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 5px;">
                    💾 导出数据JSON
                </button>
                <button onclick="debugHelper.viewStorageData()" style="background: #607D8B; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 5px;">
                    🗄️ 查看存储数据
                </button>
                <button onclick="debugHelper.showDebugLogs()" style="background: #00BCD4; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%;">
                    📋 查看Debug日志
                </button>
            </div>
        `;
    }

    /**
     * 显示模板配置指南
     */
    showTemplateGuide() {
        const guide = `
# Word模板配置指南

## 问题原因
备考表和封面导出为空，是因为模板文件中没有添加占位符。

## 解决方法

### 1. 编辑模板文件
打开以下模板文件并添加占位符：

**表四、卷内备考表.docx：**
本案卷共有文件材料 {{totalPages}} 页
其中：文字材料 {{textPages}} 页
图样材料 {{drawingPages}} 页
照片 {{photoCount}} 张
说明：{{note}}
立卷人：{{creator}}  日期：{{createDate}}
审核人：{{reviewer}}  日期：{{reviewDate}}

**表二、档案封面.docx：**
档号：{{archiveNo}}
案卷题名：{{title}}
编制单位：{{unit}}
起止日期：{{startDate}} 至 {{endDate}}
密级：{{secretLevel}}
保管期限：{{retentionPeriod}}
本工程共：{{totalVolumes}} 卷
本案卷为第：{{volumeNumber}} 卷

### 2. 保存模板
编辑完成后保存模板文件到 templates/ 目录

### 3. 重新导出
再次点击导出按钮，数据将自动填充

## 详细说明
查看文件：templates/模板占位符说明.md
        `;

        alert(guide);
        console.log(guide);
    }

    /**
     * 测试模板导出
     */
    async testTemplateExport() {
        const result = {
            directory: false,
            record: false,
            cover: false,
            catalog: false
        };

        try {
            console.log('🧪 开始测试导出功能...');

            // 测试备考表数据
            console.log('备考表数据：', this.dataManager.recordData);
            result.record = !!this.dataManager.recordData.totalPages;

            // 测试封面数据
            console.log('封面数据：', this.dataManager.coverData);
            result.cover = !!this.dataManager.coverData.title;

            // 测试卷内目录数据
            console.log('卷内目录数据：', this.dataManager.directoryData);
            result.directory = this.dataManager.directoryData.length > 0;

            // 测试案卷目录数据
            console.log('案卷目录数据：', this.dataManager.catalogData);
            result.catalog = this.dataManager.catalogData.length > 0;

            const summary = `
测试结果：
✅ 卷内目录数据：${result.directory ? '有数据' : '⚠️ 无数据'}
${result.record ? '✅' : '⚠️'} 备考表数据：${result.record ? '有数据' : '无数据或不完整'}
${result.cover ? '✅' : '⚠️'} 封面数据：${result.cover ? '有数据' : '无数据或不完整'}
${result.catalog ? '✅' : '⚠️'} 案卷目录数据：${result.catalog ? '有数据' : '无数据'}

${(!result.record || !result.cover) ? '\n⚠️ 建议：先点击"自动生成其他表格"按钮生成数据' : ''}
            `;

            alert(summary);
            console.log(summary);
        } catch (error) {
            console.error('测试失败：', error);
            alert('测试失败：' + error.message);
        }
    }

    /**
     * 自动生成所有数据
     */
    autoGenerateAll() {
        try {
            this.dataManager.autoGenerateAll();
            renderRecordForm();
            renderCoverForm();
            renderCatalogTable();
            this.updateDebugInfo();
            showToast('已自动生成所有表格数据', 'success');
        } catch (error) {
            console.error('自动生成失败：', error);
            showToast('自动生成失败：' + error.message, 'error');
        }
    }

    /**
     * 导出数据为JSON
     */
    exportDataJSON() {
        const data = {
            directory: this.dataManager.directoryData,
            record: this.dataManager.recordData,
            cover: this.dataManager.coverData,
            catalog: this.dataManager.catalogData,
            exportTime: new Date().toISOString()
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `调试数据_${this.dataManager.getTodayDate()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('数据已导出为JSON', 'success');
    }

    /**
     * 查看存储数据
     */
    viewStorageData() {
        const data = localStorage.getItem('archiveData');
        if (data) {
            console.log('LocalStorage 数据：', JSON.parse(data));
            alert('数据已输出到控制台，按F12查看');
        } else {
            alert('本地存储中没有数据');
        }
    }

    /**
     * 显示Debug日志
     */
    showDebugLogs() {
        // 创建日志窗口
        const logsWindow = window.open('', 'Debug日志', 'width=800,height=600');

        if (!logsWindow) {
            alert('请允许弹出窗口以查看Debug日志');
            return;
        }

        // 收集所有日志信息
        const logs = this.collectDebugLogs();

        // 生成HTML内容
        logsWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Debug日志 - 工程资料归档管理系统</title>
                <style>
                    body {
                        font-family: 'Consolas', 'Monaco', monospace;
                        padding: 20px;
                        background: #1e1e1e;
                        color: #d4d4d4;
                    }
                    h1 {
                        color: #4EC9B0;
                        border-bottom: 2px solid #4EC9B0;
                        padding-bottom: 10px;
                    }
                    h2 {
                        color: #DCDCAA;
                        margin-top: 30px;
                    }
                    .log-section {
                        background: #252526;
                        padding: 15px;
                        margin: 10px 0;
                        border-radius: 5px;
                        border-left: 4px solid #007ACC;
                    }
                    .log-item {
                        margin: 5px 0;
                        padding: 5px;
                    }
                    .log-key {
                        color: #9CDCFE;
                        font-weight: bold;
                    }
                    .log-value {
                        color: #CE9178;
                    }
                    .log-number {
                        color: #B5CEA8;
                    }
                    .log-null {
                        color: #569CD6;
                    }
                    pre {
                        background: #1e1e1e;
                        padding: 10px;
                        border-radius: 3px;
                        overflow-x: auto;
                    }
                    .toolbar {
                        position: fixed;
                        top: 10px;
                        right: 10px;
                        z-index: 1000;
                    }
                    button {
                        background: #007ACC;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        margin: 0 5px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                    }
                    button:hover {
                        background: #005A9E;
                    }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <button onclick="window.print()">🖨️ 打印</button>
                    <button onclick="copyAll()">📋 复制全部</button>
                    <button onclick="window.close()">❌ 关闭</button>
                </div>
                <h1>🔍 Debug日志</h1>
                <p style="color: #858585;">生成时间: ${new Date().toLocaleString()}</p>
                ${logs}
                <script>
                    function copyAll() {
                        const text = document.body.innerText;
                        navigator.clipboard.writeText(text).then(() => {
                            alert('日志已复制到剪贴板');
                        }).catch(err => {
                            alert('复制失败: ' + err);
                        });
                    }
                </script>
            </body>
            </html>
        `);

        logsWindow.document.close();
    }

    /**
     * 收集所有Debug日志
     */
    collectDebugLogs() {
        let html = '';

        // 1. 系统信息
        html += `
            <div class="log-section">
                <h2>📱 系统信息</h2>
                <div class="log-item"><span class="log-key">浏览器:</span> <span class="log-value">${navigator.userAgent}</span></div>
                <div class="log-item"><span class="log-key">当前URL:</span> <span class="log-value">${window.location.href}</span></div>
                <div class="log-item"><span class="log-key">屏幕分辨率:</span> <span class="log-number">${window.screen.width} x ${window.screen.height}</span></div>
                <div class="log-item"><span class="log-key">可用内存:</span> <span class="log-number">${navigator.deviceMemory || '未知'} GB</span></div>
            </div>
        `;

        // 2. VolumeManager状态
        if (typeof volumeManager !== 'undefined' && volumeManager) {
            html += `
                <div class="log-section">
                    <h2>📦 VolumeManager状态</h2>
                    <div class="log-item"><span class="log-key">案卷数量:</span> <span class="log-number">${volumeManager.volumes.length}</span></div>
                    <div class="log-item"><span class="log-key">当前案卷ID:</span> <span class="log-value">${volumeManager.currentVolumeId || '未设置'}</span></div>
                    <div class="log-item"><span class="log-key">工程名称:</span> <span class="log-value">${volumeManager.projectInfo.name || '未设置'}</span></div>
                    <div class="log-item"><span class="log-key">编制单位:</span> <span class="log-value">${volumeManager.projectInfo.unit || '未设置'}</span></div>
                    <pre>${JSON.stringify(volumeManager.projectInfo, null, 2)}</pre>
                </div>
            `;

            // 案卷列表详情
            html += `
                <div class="log-section">
                    <h2>📚 案卷列表详情</h2>
            `;
            volumeManager.volumes.forEach((volume, index) => {
                html += `
                    <div class="log-item">
                        <strong>案卷 ${index + 1}:</strong> ${volume.title}
                        <div style="margin-left: 20px;">
                            <span class="log-key">ID:</span> <span class="log-value">${volume.id}</span><br>
                            <span class="log-key">文件数:</span> <span class="log-number">${volume.directory.length}</span><br>
                            <span class="log-key">创建日期:</span> <span class="log-value">${volume.createDate}</span>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        } else {
            html += `
                <div class="log-section">
                    <h2>📦 VolumeManager状态</h2>
                    <div class="log-item"><span class="log-null">⚠️ VolumeManager未初始化</span></div>
                </div>
            `;
        }

        // 3. LocalStorage数据
        html += `
            <div class="log-section">
                <h2>💾 LocalStorage数据</h2>
        `;
        try {
            const volumeData = localStorage.getItem('volumeData');
            const archiveData = localStorage.getItem('archiveData');

            if (volumeData) {
                html += `
                    <div class="log-item"><span class="log-key">volumeData:</span> 存在 (${(volumeData.length / 1024).toFixed(2)} KB)</div>
                    <pre>${JSON.stringify(JSON.parse(volumeData), null, 2).substring(0, 1000)}...</pre>
                `;
            } else {
                html += `<div class="log-item"><span class="log-null">volumeData: 不存在</span></div>`;
            }

            if (archiveData) {
                html += `
                    <div class="log-item"><span class="log-key">archiveData:</span> 存在 (${(archiveData.length / 1024).toFixed(2)} KB)</div>
                `;
            } else {
                html += `<div class="log-item"><span class="log-null">archiveData: 不存在</span></div>`;
            }
        } catch (error) {
            html += `<div class="log-item"><span class="log-null">读取失败: ${error.message}</span></div>`;
        }
        html += `</div>`;

        // 4. 控制台日志（如果可用）
        html += `
            <div class="log-section">
                <h2>📝 控制台提示</h2>
                <div class="log-item">打开浏览器控制台 (F12) 查看详细的运行时日志</div>
                <div class="log-item">
                    <strong>常用命令:</strong><br>
                    <code>volumeManager</code> - 查看案卷管理器<br>
                    <code>dataManager</code> - 查看数据管理器<br>
                    <code>localStorage</code> - 查看本地存储
                </div>
            </div>
        `;

        // 5. 错误信息（如果有）
        html += `
            <div class="log-section">
                <h2>⚠️ 错误信息</h2>
                <div class="log-item" id="error-list">无错误记录</div>
            </div>
        `;

        return html;
    }

    /**
     * 创建调试按钮
     */
    createDebugButton() {
        const button = document.createElement('button');
        button.innerHTML = '🔍 调试';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            font-size: 14px;
            font-weight: bold;
            z-index: 9999;
        `;
        button.onclick = () => this.showDebugPanel();
        document.body.appendChild(button);
    }
}

// 全局调试助手实例（在dataManager和wordExporter初始化后创建）
let debugHelper = null;

// 页面加载完成后初始化调试助手
document.addEventListener('DOMContentLoaded', function() {
    // 等待其他组件初始化
    setTimeout(() => {
        if (typeof dataManager !== 'undefined' && typeof wordExporter !== 'undefined') {
            debugHelper = new DebugHelper(dataManager, wordExporter);
            debugHelper.createDebugButton();
            console.log('🔍 调试助手已启用。点击右下角按钮打开调试面板。');
        }
    }, 1000);
});
