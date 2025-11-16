/**
 * 主应用逻辑
 * 工程资料归档管理系统
 */

// ========== 全局变量 ==========
let clipboardMode = false; // 点按模式开关
let selectedClipboardColumn = null; // 当前选中的列

// ========== 页面加载完成后初始化 ==========
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadDataFromStorage();
});

/**
 * 初始化应用
 */
function initializeApp() {
    // 初始化标签页切换
    initTabs();

    // 初始化卷内目录
    initDirectory();

    // 初始化卷内备考表
    initRecord();

    // 初始化案卷封面
    initCover();

    // 初始化案卷目录
    initCatalog();

    // 初始化数据操作
    initDataActions();

    // 自动保存
    setInterval(() => {
        dataManager.saveToLocalStorage();
    }, 30000); // 每30秒自动保存
}

// ========== 标签页切换 ==========
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // 移除所有活动状态
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // 激活当前标签
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// ========== 卷内目录功能 ==========
function initDirectory() {
    const addRowBtn = document.getElementById('addRowBtn');
    const deleteRowBtn = document.getElementById('deleteRowBtn');
    const autoGenerateBtn = document.getElementById('autoGenerateBtn');
    const clipboardToggle = document.getElementById('clipboardModeToggle');
    const selectAllCheckbox = document.getElementById('selectAll');

    // 添加行
    addRowBtn.addEventListener('click', () => {
        const row = dataManager.addDirectoryRow();
        appendDirectoryRow(row);
        showToast('已添加新行');
    });

    // 删除选中行
    deleteRowBtn.addEventListener('click', () => {
        if (confirm('确定要删除选中的行吗？')) {
            dataManager.deleteSelectedRows();
            renderDirectoryTable();
            showToast('已删除选中行');
        }
    });

    // 自动生成其他表格
    autoGenerateBtn.addEventListener('click', () => {
        dataManager.autoGenerateAll();
        renderRecordForm();
        renderCoverForm();
        renderCatalogTable();
        showToast('已自动生成所有表格', 'success');
    });

    // 切换点按模式
    clipboardToggle.addEventListener('change', (e) => {
        clipboardMode = e.target.checked;
        const clipboardButtons = document.getElementById('clipboardButtons');
        clipboardButtons.style.display = clipboardMode ? 'grid' : 'none';

        if (clipboardMode) {
            initClipboardButtons();
            showToast('点按模式已启用，点击列按钮可粘贴剪贴板内容', 'success');
        } else {
            showToast('点按模式已关闭');
        }
    });

    // 全选
    selectAllCheckbox.addEventListener('change', (e) => {
        dataManager.toggleAllSelection(e.target.checked);
        renderDirectoryTable();
    });

    // 初始添加一行
    if (dataManager.directoryData.length === 0) {
        for (let i = 0; i < 3; i++) {
            dataManager.addDirectoryRow();
        }
    }
    renderDirectoryTable();
}

/**
 * 渲染卷内目录表格
 */
function renderDirectoryTable() {
    const tbody = document.getElementById('directoryTableBody');
    tbody.innerHTML = '';

    dataManager.directoryData.forEach((row, index) => {
        appendDirectoryRow(row);
    });
}

/**
 * 添加卷内目录行
 */
function appendDirectoryRow(row) {
    const tbody = document.getElementById('directoryTableBody');
    const tr = document.createElement('tr');
    tr.dataset.id = row.id;
    if (row.selected) {
        tr.classList.add('selected');
    }

    tr.innerHTML = `
        <td>
            <input type="checkbox" class="row-checkbox" ${row.selected ? 'checked' : ''}>
        </td>
        <td>
            <input type="number" class="field-serial" value="${row.serial}" min="1">
        </td>
        <td>
            <input type="text" class="field-fileNumber" value="${row.fileNumber}"
                   placeholder="发文号/图号">
        </td>
        <td>
            <input type="text" class="field-responsible" value="${row.responsible}"
                   placeholder="单位/个人">
        </td>
        <td>
            <input type="text" class="field-title" value="${row.title}"
                   placeholder="文件题名">
        </td>
        <td>
            <input type="date" class="field-date" value="${row.date}">
        </td>
        <td>
            <input type="text" class="field-pages" value="${row.pages}"
                   placeholder="1-5">
        </td>
        <td>
            <input type="text" class="field-remark" value="${row.remark}">
        </td>
    `;

    // 添加事件监听
    const checkbox = tr.querySelector('.row-checkbox');
    checkbox.addEventListener('change', () => {
        dataManager.toggleRowSelection(row.id);
        tr.classList.toggle('selected');
    });

    // 字段输入事件
    const fields = ['serial', 'fileNumber', 'responsible', 'title', 'date', 'pages', 'remark'];
    fields.forEach(field => {
        const input = tr.querySelector(`.field-${field}`);
        input.addEventListener('input', (e) => {
            dataManager.updateDirectoryRow(row.id, field, e.target.value);
        });
    });

    tbody.appendChild(tr);
}

// ========== 点按模式（剪贴板按钮） ==========
function initClipboardButtons() {
    const buttons = document.querySelectorAll('.clipboard-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const column = btn.dataset.column;
            try {
                const text = await navigator.clipboard.readText();
                pasteToColumn(column, text);
                showToast(`已粘贴到【${btn.textContent.replace('📋 ', '')}】列`, 'success');
            } catch (error) {
                showToast('读取剪贴板失败，请确保已授权', 'error');
                console.error('剪贴板读取失败:', error);
            }
        });
    });
}

/**
 * 将剪贴板内容粘贴到指定列
 */
function pasteToColumn(column, text) {
    // 处理多行数据（支持从Excel复制）
    const lines = text.trim().split('\n');

    lines.forEach((line, index) => {
        const value = line.trim();
        if (!value) return;

        // 找到第一个未填写该列的行，或创建新行
        let targetRow = dataManager.directoryData.find(row => !row[column]);

        if (!targetRow) {
            targetRow = dataManager.addDirectoryRow();
        }

        // 更新数据
        dataManager.updateDirectoryRow(targetRow.id, column, value);
    });

    // 重新渲染表格
    renderDirectoryTable();
}

// ========== 卷内备考表功能 ==========
function initRecord() {
    const syncBtn = document.getElementById('syncRecordBtn');

    syncBtn.addEventListener('click', () => {
        dataManager.syncToRecord();
        renderRecordForm();
        showToast('已从卷内目录同步', 'success');
    });

    // 字段变化监听
    const fields = [
        'textPages', 'drawingPages', 'photoCount', 'recordNote',
        'recordCreator', 'recordCreateDate', 'recordReviewer', 'recordReviewDate'
    ];

    fields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            input.addEventListener('change', (e) => {
                const field = fieldId.replace('record', '').toLowerCase();
                const mappedField = {
                    'textpages': 'textPages',
                    'drawingpages': 'drawingPages',
                    'photocount': 'photoCount',
                    'note': 'note',
                    'creator': 'creator',
                    'createdate': 'createDate',
                    'reviewer': 'reviewer',
                    'reviewdate': 'reviewDate'
                }[field] || field;

                dataManager.recordData[mappedField] = e.target.value;
            });
        }
    });
}

/**
 * 渲染卷内备考表
 */
function renderRecordForm() {
    const data = dataManager.recordData;

    document.getElementById('totalPages').value = data.totalPages || 0;
    document.getElementById('textPages').value = data.textPages || 0;
    document.getElementById('drawingPages').value = data.drawingPages || 0;
    document.getElementById('photoCount').value = data.photoCount || 0;
    document.getElementById('recordNote').value = data.note || '';
    document.getElementById('recordCreator').value = data.creator || '';
    document.getElementById('recordCreateDate').value = data.createDate || '';
    document.getElementById('recordReviewer').value = data.reviewer || '';
    document.getElementById('recordReviewDate').value = data.reviewDate || '';
}

// ========== 案卷封面功能 ==========
function initCover() {
    const syncBtn = document.getElementById('syncCoverBtn');

    syncBtn.addEventListener('click', () => {
        dataManager.syncToCover();
        renderCoverForm();
        showToast('已从卷内目录同步', 'success');
    });

    // 字段变化监听
    const fields = [
        'coverArchiveNo', 'coverTitle', 'coverUnit',
        'coverStartDate', 'coverEndDate', 'coverSecretLevel',
        'coverRetentionPeriod', 'coverTotalVolumes', 'coverVolumeNumber'
    ];

    fields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            input.addEventListener('change', (e) => {
                const field = fieldId.replace('cover', '').toLowerCase();
                const mappedField = {
                    'archiveno': 'archiveNo',
                    'title': 'title',
                    'unit': 'unit',
                    'startdate': 'startDate',
                    'enddate': 'endDate',
                    'secretlevel': 'secretLevel',
                    'retentionperiod': 'retentionPeriod',
                    'totalvolumes': 'totalVolumes',
                    'volumenumber': 'volumeNumber'
                }[field] || field;

                dataManager.coverData[mappedField] = e.target.value;
            });
        }
    });
}

/**
 * 渲染案卷封面
 */
function renderCoverForm() {
    const data = dataManager.coverData;

    document.getElementById('coverArchiveNo').value = data.archiveNo || '';
    document.getElementById('coverTitle').value = data.title || '';
    document.getElementById('coverUnit').value = data.unit || '';
    document.getElementById('coverStartDate').value = data.startDate || '';
    document.getElementById('coverEndDate').value = data.endDate || '';
    document.getElementById('coverSecretLevel').value = data.secretLevel || '';
    document.getElementById('coverRetentionPeriod').value = data.retentionPeriod || '永久';
    document.getElementById('coverTotalVolumes').value = data.totalVolumes || 1;
    document.getElementById('coverVolumeNumber').value = data.volumeNumber || 1;
}

// ========== 案卷目录功能 ==========
function initCatalog() {
    const addBtn = document.getElementById('addCatalogBtn');
    const syncBtn = document.getElementById('syncCatalogBtn');

    addBtn.addEventListener('click', () => {
        const entry = {
            id: dataManager.generateId(),
            volumeNo: dataManager.catalogData.length + 1,
            title: '',
            textPages: 0,
            drawingPages: 0,
            other: '',
            unit: '',
            createDate: dataManager.getTodayDate(),
            retentionPeriod: '永久',
            secretLevel: '',
            remark: ''
        };
        dataManager.catalogData.push(entry);
        renderCatalogTable();
        showToast('已添加新案卷');
    });

    syncBtn.addEventListener('click', () => {
        dataManager.syncToCatalog();
        renderCatalogTable();
        showToast('已从当前卷同步', 'success');
    });
}

/**
 * 渲染案卷目录表格
 */
function renderCatalogTable() {
    const tbody = document.getElementById('catalogTableBody');
    tbody.innerHTML = '';

    dataManager.catalogData.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${entry.volumeNo}" class="field-volumeNo"></td>
            <td><input type="text" value="${entry.title}" class="field-title"></td>
            <td><input type="number" value="${entry.textPages}" class="field-textPages"></td>
            <td><input type="number" value="${entry.drawingPages}" class="field-drawingPages"></td>
            <td><input type="text" value="${entry.other}" class="field-other"></td>
            <td><input type="text" value="${entry.unit}" class="field-unit"></td>
            <td><input type="date" value="${entry.createDate}" class="field-createDate"></td>
            <td>
                <select class="field-retentionPeriod">
                    <option value="永久" ${entry.retentionPeriod === '永久' ? 'selected' : ''}>永久</option>
                    <option value="长期" ${entry.retentionPeriod === '长期' ? 'selected' : ''}>长期</option>
                    <option value="短期" ${entry.retentionPeriod === '短期' ? 'selected' : ''}>短期</option>
                </select>
            </td>
            <td><input type="text" value="${entry.secretLevel}" class="field-secretLevel"></td>
            <td><input type="text" value="${entry.remark}" class="field-remark"></td>
        `;

        // 添加事件监听
        const fields = ['volumeNo', 'title', 'textPages', 'drawingPages', 'other',
                        'unit', 'createDate', 'retentionPeriod', 'secretLevel', 'remark'];
        fields.forEach(field => {
            const input = tr.querySelector(`.field-${field}`);
            input.addEventListener('change', (e) => {
                entry[field] = e.target.value;
            });
        });

        tbody.appendChild(tr);
    });
}

// ========== 数据操作 ==========
function initDataActions() {
    const saveBtn = document.getElementById('saveDataBtn');
    const loadBtn = document.getElementById('loadDataBtn');
    const exportBtn = document.getElementById('exportDataBtn');
    const clearBtn = document.getElementById('clearDataBtn');

    saveBtn.addEventListener('click', () => {
        dataManager.saveToLocalStorage();
        showToast('数据已保存', 'success');
    });

    loadBtn.addEventListener('click', () => {
        if (dataManager.loadFromLocalStorage()) {
            renderAll();
            showToast('数据已加载', 'success');
        } else {
            showToast('没有找到保存的数据', 'warning');
        }
    });

    exportBtn.addEventListener('click', () => {
        const json = dataManager.exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `archive_data_${dataManager.getTodayDate()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('数据已导出', 'success');
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            dataManager.clearAllData();
            localStorage.removeItem('archiveData');
            renderAll();
            showToast('所有数据已清空', 'warning');
        }
    });
}

/**
 * 从本地存储加载数据
 */
function loadDataFromStorage() {
    if (dataManager.loadFromLocalStorage()) {
        renderAll();
        console.log('已从本地存储加载数据');
    }
}

/**
 * 渲染所有界面
 */
function renderAll() {
    renderDirectoryTable();
    renderRecordForm();
    renderCoverForm();
    renderCatalogTable();
}

// ========== 提示消息 ==========
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ========== 键盘快捷键 ==========
document.addEventListener('keydown', (e) => {
    // Ctrl+S 保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        dataManager.saveToLocalStorage();
        showToast('数据已保存', 'success');
    }

    // Ctrl+G 自动生成
    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        dataManager.autoGenerateAll();
        renderRecordForm();
        renderCoverForm();
        renderCatalogTable();
        showToast('已自动生成所有表格', 'success');
    }
});

// ========== 页面卸载前保存 ==========
window.addEventListener('beforeunload', () => {
    dataManager.saveToLocalStorage();
});
