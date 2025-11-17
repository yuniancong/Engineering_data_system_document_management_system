/**
 * 主应用逻辑
 * 工程资料归档管理系统
 */

// ========== 全局变量 ==========
let clipboardMode = false; // 列粘贴模式开关
let selectedClipboardColumn = null; // 当前选中的列
let clipboardPermissionGranted = false; // 剪贴板权限是否已授予

// ========== 初始化剪贴板权限状态 ==========
// 从localStorage读取权限状态
const savedPermission = localStorage.getItem('clipboardPermissionGranted');
if (savedPermission === 'true') {
    clipboardPermissionGranted = true;
}

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

            // 如果切换到移交书标签页，自动刷新统计数据
            if (targetTab === 'transfer' && typeof renderTransferStats === 'function') {
                renderTransferStats();
            }
        });
    });
}

// ========== 卷内目录功能 ==========
function initDirectory() {
    const addRowBtn = document.getElementById('addRowBtn');
    const deleteRowBtn = document.getElementById('deleteRowBtn');
    const autoGenerateBtn = document.getElementById('autoGenerateBtn');
    const pasteRowBtn = document.getElementById('pasteRowBtn');
    const clipboardToggle = document.getElementById('clipboardModeToggle');
    const selectAllCheckbox = document.getElementById('selectAll');

    // 添加行
    addRowBtn.addEventListener('click', () => {
        const row = dataManager.addDirectoryRow();
        dataManager.reorderDirectory(); // 重新分配序号
        renderDirectoryTable(); // 重新渲染整个表格以更新序号
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

    // 粘贴整行（批量粘贴 - 默认顺序）
    pasteRowBtn.addEventListener('click', async () => {
        await pasteWholeRows();
    });

    // 自定义粘贴（打开对话框）
    const pasteRowCustomBtn = document.getElementById('pasteRowCustomBtn');
    pasteRowCustomBtn.addEventListener('click', () => {
        openCustomPasteDialog();
    });

    // 切换列粘贴模式
    clipboardToggle.addEventListener('change', async (e) => {
        clipboardMode = e.target.checked;
        const clipboardButtons = document.getElementById('clipboardButtons');
        clipboardButtons.style.display = clipboardMode ? 'flex' : 'none';

        if (clipboardMode) {
            // 启用时预先请求剪贴板权限
            const granted = await requestClipboardPermission();
            if (granted) {
                initClipboardButtons();
                showToast('列粘贴模式已启用', 'success');
            } else {
                // 如果权限被拒绝，取消勾选
                clipboardToggle.checked = false;
                clipboardMode = false;
                showToast('需要授权剪贴板权限才能使用此功能', 'error');
            }
        } else {
            showToast('列粘贴模式已关闭');
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
            <input type="number" class="field-serial" value="${row.serial}" min="1" readonly>
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

    // 字段输入事件（序号不需要监听，因为是只读的）
    const fields = ['fileNumber', 'responsible', 'title', 'date', 'pages', 'remark'];
    fields.forEach(field => {
        const input = tr.querySelector(`.field-${field}`);
        input.addEventListener('input', (e) => {
            dataManager.updateDirectoryRow(row.id, field, e.target.value);
        });
    });

    tbody.appendChild(tr);
}

/**
 * 请求剪贴板权限（只在第一次请求，之后永久记住）
 */
async function requestClipboardPermission() {
    // 如果已经授权，直接返回true
    if (clipboardPermissionGranted) {
        return true;
    }

    try {
        // 尝试读取剪贴板以触发权限请求
        await navigator.clipboard.readText();

        // 权限授予成功，保存到全局变量和localStorage
        clipboardPermissionGranted = true;
        localStorage.setItem('clipboardPermissionGranted', 'true');

        console.log('剪贴板权限已授予并保存');
        return true;
    } catch (error) {
        console.log('剪贴板权限被拒绝:', error.message);
        clipboardPermissionGranted = false;
        localStorage.setItem('clipboardPermissionGranted', 'false');
        return false;
    }
}

// ========== 列粘贴模式（剪贴板按钮） ==========
function initClipboardButtons() {
    const buttons = document.querySelectorAll('.clipboard-btn-small');

    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const column = btn.dataset.column;
            try {
                const text = await navigator.clipboard.readText();

                // 如果权限之前没有保存，现在保存
                if (!clipboardPermissionGranted) {
                    clipboardPermissionGranted = true;
                    localStorage.setItem('clipboardPermissionGranted', 'true');
                }

                pasteToColumn(column, text);
                showToast(`已粘贴到【${btn.textContent}】列`, 'success');
            } catch (error) {
                showToast('读取剪贴板失败，请刷新页面重新授权', 'error');
                console.error('剪贴板读取失败:', error);
            }
        });
    });
}

/**
 * 将剪贴板内容粘贴到指定列
 */
function pasteToColumn(column, text) {
    if (!text || !text.trim()) {
        showToast('剪贴板内容为空', 'warning');
        return;
    }

    // 处理多行数据（支持从Excel复制）
    const lines = text.trim().split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        showToast('没有有效数据可粘贴', 'warning');
        return;
    }

    let pastedCount = 0;

    lines.forEach(line => {
        const value = line.trim();
        if (!value) return;

        // 找到第一个未填写该列的行（该列为空字符串或undefined）
        let targetRow = dataManager.directoryData.find(row => {
            return !row[column] || row[column].toString().trim() === '';
        });

        // 如果没有找到空行，创建新行
        if (!targetRow) {
            targetRow = dataManager.addDirectoryRow();
        }

        // 更新数据
        dataManager.updateDirectoryRow(targetRow.id, column, value);
        pastedCount++;
    });

    // 重新分配序号并渲染表格
    dataManager.reorderDirectory();
    renderDirectoryTable();

    if (pastedCount > 0) {
        showToast(`已粘贴 ${pastedCount} 项数据`, 'success');
    }
}

/**
 * 批量粘贴整行数据（Excel式粘贴）
 */
async function pasteWholeRows() {
    try {
        // 读取剪贴板
        const text = await navigator.clipboard.readText();

        if (!text || !text.trim()) {
            showToast('剪贴板内容为空', 'warning');
            return;
        }

        // 如果权限之前没有保存，现在保存
        if (!clipboardPermissionGranted) {
            clipboardPermissionGranted = true;
            localStorage.setItem('clipboardPermissionGranted', 'true');
        }

        // 按行分割
        const rows = text.trim().split('\n').filter(line => line.trim());

        if (rows.length === 0) {
            showToast('没有有效数据可粘贴', 'warning');
            return;
        }

        let pastedRowCount = 0;

        rows.forEach(rowText => {
            // 检测是否包含制表符（Tab），如果有则按Tab分割
            let columns;
            if (rowText.includes('\t')) {
                // Excel格式：用Tab分割
                columns = rowText.split('\t');
            } else {
                // 单列数据，可能是题名
                columns = [rowText];
            }

            // 创建新行
            const newRow = dataManager.addDirectoryRow();

            // 根据列数映射数据
            // 列顺序：文件编号、责任者、文件题名、日期、页次、备注
            const fieldMapping = ['fileNumber', 'responsible', 'title', 'date', 'pages', 'remark'];

            columns.forEach((value, index) => {
                const trimmedValue = value.trim();
                if (trimmedValue && index < fieldMapping.length) {
                    const field = fieldMapping[index];
                    dataManager.updateDirectoryRow(newRow.id, field, trimmedValue);
                }
            });

            pastedRowCount++;
        });

        // 重新分配序号并渲染表格
        dataManager.reorderDirectory();
        renderDirectoryTable();

        showToast(`已粘贴 ${pastedRowCount} 行数据`, 'success');
    } catch (error) {
        console.error('粘贴整行失败:', error);
        showToast('读取剪贴板失败，请确保已授权', 'error');
    }
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
    const exportWordBtn = document.getElementById('exportWordBtn');
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
        exportToExcel();
    });

    // Word导出按钮
    exportWordBtn.addEventListener('click', () => {
        openWordExportDialog();
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

// ========== Excel导出功能 ==========
/**
 * 导出为Excel文件（包含所有表格）
 */
function exportToExcel() {
    try {
        // 创建工作簿
        const wb = XLSX.utils.book_new();

        // 1. 卷内目录工作表
        const directoryData = [
            ['序号', '文件编号', '责任者', '文件题名', '日期', '页次', '备注'],
            ...dataManager.directoryData.map(row => [
                row.serial,
                row.fileNumber,
                row.responsible,
                row.title,
                row.date,
                row.pages,
                row.remark
            ])
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(directoryData);
        XLSX.utils.book_append_sheet(wb, ws1, '卷内目录');

        // 2. 卷内备考表工作表
        const recordData = [
            ['项目', '数值'],
            ['总页数', dataManager.recordData.totalPages || 0],
            ['文字材料（页）', dataManager.recordData.textPages || 0],
            ['图样材料（页）', dataManager.recordData.drawingPages || 0],
            ['照片（张）', dataManager.recordData.photoCount || 0],
            ['说明', dataManager.recordData.note || ''],
            ['立卷人', dataManager.recordData.creator || ''],
            ['立卷日期', dataManager.recordData.createDate || ''],
            ['审核人', dataManager.recordData.reviewer || ''],
            ['审核日期', dataManager.recordData.reviewDate || '']
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(recordData);
        XLSX.utils.book_append_sheet(wb, ws2, '卷内备考表');

        // 3. 案卷封面工作表
        const coverData = [
            ['项目', '内容'],
            ['档号', dataManager.coverData.archiveNo || ''],
            ['案卷题名', dataManager.coverData.title || ''],
            ['编制单位', dataManager.coverData.unit || ''],
            ['起始日期', dataManager.coverData.startDate || ''],
            ['结束日期', dataManager.coverData.endDate || ''],
            ['密级', dataManager.coverData.secretLevel || ''],
            ['保管期限', dataManager.coverData.retentionPeriod || ''],
            ['本工程共（卷）', dataManager.coverData.totalVolumes || 1],
            ['本案卷为第（卷）', dataManager.coverData.volumeNumber || 1]
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(coverData);
        XLSX.utils.book_append_sheet(wb, ws3, '案卷封面');

        // 4. 案卷目录工作表
        const catalogData = [
            ['案卷号', '案卷题名', '文字(页)', '图纸(张)', '其他', '编制单位', '编制日期', '保管期限', '密级', '备注'],
            ...dataManager.catalogData.map(entry => [
                entry.volumeNo,
                entry.title,
                entry.textPages,
                entry.drawingPages,
                entry.other,
                entry.unit,
                entry.createDate,
                entry.retentionPeriod,
                entry.secretLevel,
                entry.remark
            ])
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(catalogData);
        XLSX.utils.book_append_sheet(wb, ws4, '案卷目录');

        // 生成Excel文件并下载
        const fileName = `工程资料归档_${dataManager.getTodayDate()}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showToast('Excel文件已导出', 'success');
    } catch (error) {
        console.error('导出Excel失败:', error);
        showToast('导出Excel失败，请检查浏览器是否支持', 'error');
    }
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

// ========== 自定义粘贴功能 ==========
let clipboardDataForCustomPaste = null; // 暂存剪贴板数据

/**
 * 打开自定义粘贴对话框
 */
async function openCustomPasteDialog() {
    try {
        // 读取剪贴板
        const text = await navigator.clipboard.readText();

        if (!text || !text.trim()) {
            showToast('剪贴板内容为空', 'warning');
            return;
        }

        // 保存剪贴板数据
        clipboardDataForCustomPaste = text;

        // 显示对话框
        const dialog = document.getElementById('pasteCustomDialog');
        dialog.style.display = 'block';

        // 初始化事件监听（只初始化一次）
        if (!dialog.dataset.initialized) {
            initCustomPasteDialog();
            dialog.dataset.initialized = 'true';
        }

    } catch (error) {
        console.error('读取剪贴板失败:', error);
        showToast('读取剪贴板失败，请确保已授权', 'error');
    }
}

/**
 * 初始化自定义粘贴对话框
 */
function initCustomPasteDialog() {
    // 关闭按钮
    document.getElementById('closeCustomDialog').addEventListener('click', closeCustomPasteDialog);
    document.getElementById('cancelCustomPaste').addEventListener('click', closeCustomPasteDialog);

    // 点击背景关闭
    document.getElementById('pasteCustomDialog').addEventListener('click', (e) => {
        if (e.target.id === 'pasteCustomDialog') {
            closeCustomPasteDialog();
        }
    });

    // 确定粘贴按钮
    document.getElementById('confirmCustomPaste').addEventListener('click', executeCustomPaste);

    // 预设按钮
    document.getElementById('presetDefault').addEventListener('click', () => {
        setColumnMapping(['fileNumber', 'responsible', 'title', 'date', 'pages', 'remark']);
    });

    document.getElementById('presetTitleOnly').addEventListener('click', () => {
        setColumnMapping(['title', '', '', '', '', '']);
    });

    document.getElementById('presetTitleDate').addEventListener('click', () => {
        setColumnMapping(['title', 'date', '', '', '', '']);
    });
}

/**
 * 关闭自定义粘贴对话框
 */
function closeCustomPasteDialog() {
    document.getElementById('pasteCustomDialog').style.display = 'none';
    clipboardDataForCustomPaste = null;
}

/**
 * 设置列映射
 */
function setColumnMapping(mapping) {
    const selects = document.querySelectorAll('.column-select');
    selects.forEach((select, index) => {
        if (index < mapping.length) {
            select.value = mapping[index] || '';
        }
    });
}

/**
 * 执行自定义粘贴
 */
function executeCustomPaste() {
    if (!clipboardDataForCustomPaste) {
        showToast('没有可粘贴的数据', 'warning');
        closeCustomPasteDialog();
        return;
    }

    // 获取列映射
    const selects = document.querySelectorAll('.column-select');
    const columnMapping = [];
    selects.forEach(select => {
        columnMapping.push(select.value);
    });

    // 检查是否至少选择了一列
    const hasMapping = columnMapping.some(value => value !== '');
    if (!hasMapping) {
        showToast('请至少选择一列进行映射', 'warning');
        return;
    }

    // 执行粘贴
    pasteWholeRowsWithMapping(clipboardDataForCustomPaste, columnMapping);

    // 关闭对话框
    closeCustomPasteDialog();
}

/**
 * 使用自定义列映射粘贴整行数据
 */
function pasteWholeRowsWithMapping(text, columnMapping) {
    try {
        // 按行分割
        const rows = text.trim().split('\n').filter(line => line.trim());

        if (rows.length === 0) {
            showToast('没有有效数据可粘贴', 'warning');
            return;
        }

        let pastedRowCount = 0;

        rows.forEach(rowText => {
            // 检测是否包含制表符（Tab），如果有则按Tab分割
            let columns;
            if (rowText.includes('\t')) {
                columns = rowText.split('\t');
            } else {
                columns = [rowText];
            }

            // 创建新行
            const newRow = dataManager.addDirectoryRow();

            // 根据自定义映射填充数据
            columns.forEach((value, index) => {
                const trimmedValue = value.trim();
                if (trimmedValue && index < columnMapping.length && columnMapping[index]) {
                    const field = columnMapping[index];
                    dataManager.updateDirectoryRow(newRow.id, field, trimmedValue);
                }
            });

            pastedRowCount++;
        });

        // 重新分配序号并渲染表格
        dataManager.reorderDirectory();
        renderDirectoryTable();

        showToast(`已粘贴 ${pastedRowCount} 行数据`, 'success');
    } catch (error) {
        console.error('自定义粘贴失败:', error);
        showToast('粘贴失败', 'error');
    }
}

// ========== Word导出对话框功能 ==========

/**
 * 打开Word导出对话框
 */
function openWordExportDialog() {
    const dialog = document.getElementById('wordExportDialog');
    dialog.style.display = 'block';

    // 初始化事件监听（只初始化一次）
    if (!dialog.dataset.initialized) {
        initWordExportDialog();
        dialog.dataset.initialized = 'true';
    }
}

/**
 * 初始化Word导出对话框
 */
function initWordExportDialog() {
    // 关闭按钮
    document.getElementById('closeWordExportDialog').addEventListener('click', closeWordExportDialog);
    document.getElementById('cancelWordExport').addEventListener('click', closeWordExportDialog);

    // 点击背景关闭
    document.getElementById('wordExportDialog').addEventListener('click', (e) => {
        if (e.target.id === 'wordExportDialog') {
            closeWordExportDialog();
        }
    });

    // 导出选项按钮
    const exportButtons = document.querySelectorAll('.export-option-btn');
    exportButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const template = btn.dataset.template;
            await handleWordExport(template);
            closeWordExportDialog();
        });
    });
}

/**
 * 关闭Word导出对话框
 */
function closeWordExportDialog() {
    document.getElementById('wordExportDialog').style.display = 'none';
}

/**
 * 处理Word导出
 */
async function handleWordExport(template) {
    try {
        showToast('正在生成Word文档，请稍候...', 'success');

        switch (template) {
            case 'directory':
                await wordExporter.exportDirectory();
                showToast('卷内目录已导出', 'success');
                break;
            case 'record':
                await wordExporter.exportRecord();
                showToast('卷内备考表已导出', 'success');
                break;
            case 'cover':
                await wordExporter.exportCover();
                showToast('案卷封面已导出', 'success');
                break;
            case 'catalog':
                await wordExporter.exportCatalog();
                showToast('案卷目录已导出', 'success');
                break;
            case 'transfer':
                await wordExporter.exportTransfer();
                showToast('档案移交书已导出', 'success');
                break;
            case 'all':
                await wordExporter.exportAll();
                break;
            default:
                showToast('未知的导出类型', 'error');
        }
    } catch (error) {
        console.error('Word导出失败:', error);
        showToast('Word导出失败: ' + error.message, 'error');
    }
}
