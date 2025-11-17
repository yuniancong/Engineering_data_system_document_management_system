/**
 * 调试和诊断工具
 * 用于检查模板、数据和导出功能的状态
 */

// 全局日志存储
const debugLogs = [];
const MAX_LOGS = 200; // 最多保存200条日志

// 覆盖console.log以捕获所有日志
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = function(...args) {
    const timestamp = new Date().toLocaleTimeString();
    debugLogs.push({ time: timestamp, level: 'log', message: args.join(' ') });
    if (debugLogs.length > MAX_LOGS) debugLogs.shift();
    originalConsoleLog.apply(console, args);
};

console.error = function(...args) {
    const timestamp = new Date().toLocaleTimeString();
    debugLogs.push({ time: timestamp, level: 'error', message: args.join(' ') });
    if (debugLogs.length > MAX_LOGS) debugLogs.shift();
    originalConsoleError.apply(console, args);
};

console.warn = function(...args) {
    const timestamp = new Date().toLocaleTimeString();
    debugLogs.push({ time: timestamp, level: 'warn', message: args.join(' ') });
    if (debugLogs.length > MAX_LOGS) debugLogs.shift();
    originalConsoleWarn.apply(console, args);
};

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
            width: 500px;
            max-height: 85vh;
            background: white;
            border: 2px solid #333;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: monospace;
            font-size: 12px;
            display: flex;
            flex-direction: column;
        `;

        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #ddd;">
                <h3 style="margin: 0;">🔍 调试面板</h3>
                <button onclick="document.getElementById('debug-panel').remove()" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
            </div>

            <div style="display: flex; border-bottom: 1px solid #ddd; background: #f5f5f5;">
                <button class="debug-tab active" data-tab="status" style="flex: 1; padding: 10px; border: none; background: white; cursor: pointer; font-weight: bold;">状态</button>
                <button class="debug-tab" data-tab="logs" style="flex: 1; padding: 10px; border: none; background: transparent; cursor: pointer;">日志</button>
                <button class="debug-tab" data-tab="actions" style="flex: 1; padding: 10px; border: none; background: transparent; cursor: pointer;">操作</button>
            </div>

            <div id="debug-content" style="padding: 20px; overflow-y: auto; flex: 1;"></div>
        `;

        document.body.appendChild(panel);

        // 绑定标签页切换
        panel.querySelectorAll('.debug-tab').forEach(btn => {
            btn.onclick = () => {
                panel.querySelectorAll('.debug-tab').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                });
                btn.classList.add('active');
                btn.style.background = 'white';
                this.updateDebugContent(btn.dataset.tab);
            };
        });

        this.updateDebugContent('status');
    }

    /**
     * 更新调试内容
     */
    updateDebugContent(tab) {
        const content = document.getElementById('debug-content');
        if (!content) return;

        switch(tab) {
            case 'status':
                content.innerHTML = this.getStatusContent();
                break;
            case 'logs':
                content.innerHTML = this.getLogsContent();
                break;
            case 'actions':
                content.innerHTML = this.getActionsContent();
                break;
        }
    }

    /**
     * 获取状态内容
     */
    getStatusContent() {
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 10px 0 5px 0; color: #2196F3;">📊 数据状态</h4>
                ${this.checkDataStatus()}
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="margin: 10px 0 5px 0; color: #4CAF50;">📄 模板状态</h4>
                ${this.checkTemplateStatus()}
            </div>

            <div style="margin-bottom: 15px;">
                <h4 style="margin: 10px 0 5px 0; color: #FF5722;">🎯 系统状态</h4>
                ${this.checkSystemStatus()}
            </div>
        `;
    }

    /**
     * 获取日志内容
     */
    getLogsContent() {
        const logsHtml = debugLogs.slice().reverse().map(log => {
            const color = log.level === 'error' ? '#f44336' :
                         log.level === 'warn' ? '#ff9800' : '#666';
            return `<div style="padding: 5px; border-bottom: 1px solid #eee; font-size: 11px;">
                <span style="color: #999;">[${log.time}]</span>
                <span style="color: ${color}; font-weight: bold;">${log.level.toUpperCase()}</span>
                <span style="color: #333;">${log.message}</span>
            </div>`;
        }).join('');

        return `
            <div style="margin-bottom: 10px; display: flex; gap: 10px;">
                <button onclick="debugHelper.clearLogs()" style="background: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">
                    🗑️ 清空日志
                </button>
                <button onclick="debugHelper.refreshLogs()" style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; flex: 1;">
                    🔄 刷新
                </button>
            </div>
            <div style="max-height: 400px; overflow-y: auto; background: #fafafa; border: 1px solid #ddd; border-radius: 4px;">
                ${logsHtml || '<div style="padding: 20px; text-align: center; color: #999;">暂无日志</div>'}
            </div>
            <div style="margin-top: 10px; font-size: 11px; color: #999;">
                共 ${debugLogs.length} 条日志（最多保存 ${MAX_LOGS} 条）
            </div>
        `;
    }

    /**
     * 获取操作内容
     */
    getActionsContent() {
        return `
            <div style="margin-bottom: 15px;">
                <h4 style="margin: 10px 0 5px 0; color: #FF9800;">🔧 快速操作</h4>
                ${this.getQuickActions()}
            </div>
        `;
    }

    /**
     * 检查系统状态
     */
    checkSystemStatus() {
        const hasVolumeManager = typeof volumeManager !== 'undefined' && volumeManager !== null;
        const hasDataManager = typeof dataManager !== 'undefined' && dataManager !== null;
        const hasWordExporter = typeof wordExporter !== 'undefined' && wordExporter !== null;

        return `
            <div style="background: #f5f5f5; padding: 10px; border-radius: 4px;">
                <div style="margin: 5px 0;">
                    ${hasVolumeManager ? '✅' : '❌'} <strong>VolumeManager:</strong> ${hasVolumeManager ? '已加载' : '未加载'}
                    ${hasVolumeManager ? `<br><span style="margin-left: 20px; font-size: 11px;">案卷数: ${volumeManager.volumes.length}, 当前: ${volumeManager.getCurrentVolume()?.title || '无'}</span>` : ''}
                </div>
                <div style="margin: 5px 0;">
                    ${hasDataManager ? '✅' : '❌'} <strong>DataManager:</strong> ${hasDataManager ? '已加载' : '未加载'}
                </div>
                <div style="margin: 5px 0;">
                    ${hasWordExporter ? '✅' : '❌'} <strong>WordExporter:</strong> ${hasWordExporter ? '已加载' : '未加载'}
                </div>
                <div style="margin: 5px 0;">
                    <strong>新建案卷按钮:</strong> ${document.getElementById('createVolumeBtn') ? '✅ 存在' : '❌ 不存在'}
                </div>
            </div>
        `;
    }

    /**
     * 清空日志
     */
    clearLogs() {
        debugLogs.length = 0;
        this.updateDebugContent('logs');
        showToast('日志已清空', 'success');
    }

    /**
     * 刷新日志
     */
    refreshLogs() {
        this.updateDebugContent('logs');
        showToast('日志已刷新', 'success');
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
                <button onclick="debugHelper.exportDataJSON()" style="background: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 5px;">
                    💾 导出数据到JSON文件
                </button>
                <button onclick="document.getElementById('import-data-file').click()" style="background: #2196F3; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%; margin-bottom: 5px;">
                    📂 从JSON文件导入数据
                </button>
                <input type="file" id="import-data-file" accept=".json" style="display: none;" onchange="debugHelper.importDataJSON(this.files[0])">
                <button onclick="debugHelper.viewStorageData()" style="background: #607D8B; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; width: 100%;">
                    🗄️ 查看存储数据
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
            this.updateDebugContent('status');
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
        try {
            let data;

            // 优先导出多卷数据
            if (typeof volumeManager !== 'undefined' && volumeManager && volumeManager.volumes.length > 0) {
                data = {
                    type: 'multi-volume',
                    projectInfo: volumeManager.projectInfo,
                    volumes: volumeManager.volumes,
                    transferData: volumeManager.transferData,
                    exportTime: new Date().toISOString(),
                    exportVersion: '2.0'
                };
            } else {
                // 导出单卷数据（向后兼容）
                data = {
                    type: 'single-volume',
                    directory: this.dataManager.directoryData,
                    record: this.dataManager.recordData,
                    cover: this.dataManager.coverData,
                    catalog: this.dataManager.catalogData,
                    exportTime: new Date().toISOString(),
                    exportVersion: '1.0'
                };
            }

            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const projectName = volumeManager?.projectInfo?.name || '工程档案';
            a.download = `${projectName}_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            console.log('数据已导出:', data);
            showToast('数据已导出为JSON文件', 'success');
        } catch (error) {
            console.error('导出失败:', error);
            showToast('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 导入数据从JSON文件
     */
    async importDataJSON(file) {
        if (!file) {
            showToast('请选择文件', 'warning');
            return;
        }

        try {
            console.log('正在导入文件:', file.name);
            const text = await file.text();
            const data = JSON.parse(text);

            console.log('导入的数据:', data);

            if (!data.type) {
                showToast('文件格式不正确', 'error');
                return;
            }

            if (!confirm(`确定要导入数据吗？\n\n类型: ${data.type}\n版本: ${data.exportVersion}\n导出时间: ${data.exportTime}\n\n当前数据将被覆盖！`)) {
                return;
            }

            if (data.type === 'multi-volume') {
                // 导入多卷数据
                if (typeof volumeManager === 'undefined' || !volumeManager) {
                    showToast('多卷管理系统未加载', 'error');
                    return;
                }

                volumeManager.projectInfo = data.projectInfo || volumeManager.projectInfo;
                volumeManager.volumes = data.volumes || [];
                volumeManager.transferData = data.transferData || volumeManager.transferData;

                if (volumeManager.volumes.length > 0) {
                    volumeManager.currentVolumeId = volumeManager.volumes[0].id;
                }

                volumeManager.saveData();

                // 刷新UI
                if (typeof renderVolumesList === 'function') {
                    renderVolumesList();
                }
                if (typeof renderProjectInfo === 'function') {
                    renderProjectInfo();
                }
                if (typeof renderTransferStats === 'function') {
                    renderTransferStats();
                }

                showToast(`成功导入 ${volumeManager.volumes.length} 个案卷`, 'success');
                console.log('多卷数据导入成功');

            } else if (data.type === 'single-volume') {
                // 导入单卷数据
                this.dataManager.directoryData = data.directory || [];
                this.dataManager.recordData = data.record || {};
                this.dataManager.coverData = data.cover || {};
                this.dataManager.catalogData = data.catalog || [];

                this.dataManager.saveToLocalStorage();

                // 刷新UI
                if (typeof renderDirectoryTable === 'function') {
                    renderDirectoryTable();
                }
                if (typeof renderRecordForm === 'function') {
                    renderRecordForm();
                }
                if (typeof renderCoverForm === 'function') {
                    renderCoverForm();
                }
                if (typeof renderCatalogTable === 'function') {
                    renderCatalogTable();
                }

                showToast('单卷数据导入成功', 'success');
                console.log('单卷数据导入成功');
            }

            // 刷新调试面板
            this.updateDebugContent('status');

            // 清空文件输入
            document.getElementById('import-data-file').value = '';

        } catch (error) {
            console.error('导入失败:', error);
            showToast('导入失败: ' + error.message, 'error');
        }
    }

    /**
     * 查看存储数据
     */
    viewStorageData() {
        const multiVolumeData = localStorage.getItem('volumeData');
        const singleVolumeData = localStorage.getItem('archiveData');

        if (multiVolumeData) {
            console.log('多卷数据 (volumeData):', JSON.parse(multiVolumeData));
        }
        if (singleVolumeData) {
            console.log('单卷数据 (archiveData):', JSON.parse(singleVolumeData));
        }

        if (multiVolumeData || singleVolumeData) {
            alert('数据已输出到控制台，按F12查看');
        } else {
            alert('本地存储中没有数据');
        }
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
