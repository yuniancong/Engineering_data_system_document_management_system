/**
 * 多卷管理UI控制器
 * 处理案卷管理、移交书等页面的用户交互
 */

// 全局变量（允许与其他脚本共享同一个实例）
let volumeManager = (typeof window !== 'undefined' && window.volumeManager)
    ? window.volumeManager
    : null;

/**
 * 初始化多卷管理UI
 */
function initVolumeUI() {
    console.log('开始初始化多卷管理UI...');

    // 等待volumeManager初始化完成
    if (typeof VolumeManager === 'undefined') {
        console.error('VolumeManager未加载，请确保volume-manager.js已正确引入');
        return;
    }
    console.log('VolumeManager类已加载');

    // 初始化volumeManager（如果还没有实例）
    if (!volumeManager) {
        console.log('创建VolumeManager实例...');
        volumeManager = new VolumeManager();

        if (typeof window !== 'undefined') {
            window.volumeManager = volumeManager;
        }
    } else {
        console.log('复用已存在的VolumeManager实例');
    }

    // 优先从本地存储加载
    const loaded = volumeManager.loadFromLocalStorage();
    if (loaded) {
        console.log('✓ 已从volumeData中恢复案卷数据');
    } else {
        console.log('未找到保存的数据，尝试迁移旧版数据...');
        if (volumeManager.migrateFromOldData()) {
            console.log('✓ 已迁移旧版数据到多卷管理器');
        }
    }

    // 如果依旧没有案卷，创建一个默认案卷
    if (volumeManager.volumes.length === 0) {
        console.log('创建默认案卷...');
        volumeManager.createVolume('第1卷');
        // 保存默认案卷
        volumeManager.saveToLocalStorage();
        console.log('✓ 已创建并保存默认案卷');
    }
    console.log(`✓ 当前有 ${volumeManager.volumes.length} 个案卷`);

    // 渲染工程信息
    console.log('渲染工程信息...');
    renderProjectInfo();

    // 渲染案卷列表
    console.log('渲染案卷列表...');
    renderVolumesList();

    // 渲染移交书统计
    console.log('渲染移交书统计...');
    renderTransferStats();

    // 绑定事件
    console.log('绑定UI事件...');
    bindVolumeEvents();

    console.log('✓ 多卷管理UI初始化完成');
}

/**
 * 渲染工程信息
 */
function renderProjectInfo() {
    const info = volumeManager.projectInfo;

    document.getElementById('projectName').value = info.name || '';
    document.getElementById('projectUnit').value = info.unit || '';
    document.getElementById('projectSecretLevel').value = info.secretLevel || '';
    document.getElementById('projectRetentionPeriod').value = info.retentionPeriod || '永久';
}

/**
 * 渲染案卷列表
 */
function renderVolumesList() {
    const volumesList = document.getElementById('volumesList');
    const volumeCount = document.getElementById('volumeCount');

    volumeCount.textContent = volumeManager.volumes.length;

    if (volumeManager.volumes.length === 0) {
        volumesList.innerHTML = '<div class="empty-state"><p>暂无案卷，请点击"新建案卷"创建</p></div>';
        return;
    }

    let html = '';
    volumeManager.volumes.forEach(volume => {
        const isActive = volume.id === volumeManager.currentVolumeId;
        const stats = volumeManager.calculatePageStatistics(volume.id);

        html += `
            <div class="volume-card ${isActive ? 'active' : ''}" data-volume-id="${volume.id}">
                <div class="volume-card-header">
                    <div class="volume-card-title">
                        案卷${volume.volumeNo}：${volume.title}
                    </div>
                    <div class="volume-card-actions">
                        <button class="btn btn-sm btn-primary switch-volume-btn" data-volume-id="${volume.id}">
                            ${isActive ? '✓ 当前' : '切换'}
                        </button>
                        <button class="btn btn-sm btn-warning edit-volume-btn" data-volume-id="${volume.id}">编辑</button>
                        <button class="btn btn-sm btn-danger delete-volume-btn" data-volume-id="${volume.id}">删除</button>
                    </div>
                </div>
                <div class="volume-card-body">
                    <div class="volume-stat">
                        <strong>文件数：</strong>${volume.directory.length} 份
                    </div>
                    <div class="volume-stat">
                        <strong>总页数：</strong>${stats.totalPages} 页
                    </div>
                    <div class="volume-stat">
                        <strong>照片：</strong>${stats.photoCount} 张
                    </div>
                </div>
            </div>
        `;
    });

    volumesList.innerHTML = html;
}

/**
 * 渲染移交书统计数据
 */
function renderTransferStats() {
    if (!volumeManager) return;
    const stats = volumeManager.generateTransferStats();

    document.getElementById('transferTotalVolumes').textContent = stats.totalVolumes;
    document.getElementById('transferTotalFiles').textContent = stats.totalFiles;
    document.getElementById('transferTotalPages').textContent = stats.totalPages;
    document.getElementById('transferTextVolumes').textContent = stats.textVolumes;
    document.getElementById('transferTextPages').textContent = stats.textPages;
    document.getElementById('transferDrawingVolumes').textContent = stats.drawingVolumes;
    document.getElementById('transferDrawingPages').textContent = stats.drawingPages;
    document.getElementById('transferPhotoCount').textContent = stats.photoCount;

    // 渲染移交信息
    const transferData = volumeManager.transferData;
    document.getElementById('transferNote').value = transferData.note || '本工程档案资料已按GB 50328-2014标准整理完毕，现移交存档。';
    document.getElementById('transferPerson').value = transferData.transferPerson || '';
    document.getElementById('transferDate').value = transferData.transferDate || '';
    document.getElementById('receivePerson').value = transferData.receivePerson || '';
    document.getElementById('receiveDate').value = transferData.receiveDate || '';
}

/**
 * 绑定事件
 */
function bindVolumeEvents() {
    const createBtn = document.getElementById('createVolumeBtn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateVolumeDialog);
        console.log('✓ 新建案卷按钮事件已绑定');
    } else {
        console.error('✗ 未找到新建案卷按钮 (createVolumeBtn)');
    }

    // 生成汇总数据按钮
    const generateBtn = document.getElementById('generateAllBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateAllData);
        console.log('✓ 生成汇总数据按钮事件已绑定');
    }

    // 刷新移交书统计按钮
    const syncBtn = document.getElementById('syncTransferBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            renderTransferStats();
            showToast('统计数据已刷新', 'success');
        });
        console.log('✓ 刷新统计按钮事件已绑定');
    }

    // 新建案卷对话框按钮
    document.getElementById('confirmCreateVolume')?.addEventListener('click', confirmCreateVolume);
    document.getElementById('cancelCreateVolume')?.addEventListener('click', hideCreateVolumeDialog);
    document.getElementById('closeCreateVolumeDialog')?.addEventListener('click', hideCreateVolumeDialog);

    // 工程信息变更监听
    document.getElementById('projectName')?.addEventListener('change', saveProjectInfo);
    document.getElementById('projectUnit')?.addEventListener('change', saveProjectInfo);
    document.getElementById('projectSecretLevel')?.addEventListener('change', saveProjectInfo);
    document.getElementById('projectRetentionPeriod')?.addEventListener('change', saveProjectInfo);

    // 移交信息变更监听
    document.getElementById('transferNote')?.addEventListener('change', saveTransferInfo);
    document.getElementById('transferPerson')?.addEventListener('change', saveTransferInfo);
    document.getElementById('transferDate')?.addEventListener('change', saveTransferInfo);
    document.getElementById('receivePerson')?.addEventListener('change', saveTransferInfo);
    document.getElementById('receiveDate')?.addEventListener('change', saveTransferInfo);

    // 案卷列表事件委托
    const volumesList = document.getElementById('volumesList');
    if (volumesList) {
        volumesList.addEventListener('click', handleVolumeListClick);
        console.log('✓ 案卷列表事件委托已绑定');
    }

    // 导出/导入项目数据按钮
    const exportProjectBtn = document.getElementById('exportProjectDataBtn');
    const importProjectBtn = document.getElementById('importProjectDataBtn');
    const debugLogsBtn = document.getElementById('openDebugLogsBtn');

    if (exportProjectBtn) {
        exportProjectBtn.addEventListener('click', exportProjectData);
        console.log('✓ 导出项目数据按钮事件已绑定');
    }

    if (importProjectBtn) {
        importProjectBtn.addEventListener('click', importProjectData);
        console.log('✓ 导入项目数据按钮事件已绑定');
    }

    if (debugLogsBtn) {
        debugLogsBtn.addEventListener('click', () => {
            if (typeof debugHelper !== 'undefined' && debugHelper) {
                debugHelper.showDebugPanel();
            } else {
                showToast('调试工具正在初始化，请稍后重试', 'warning');
            }
        });
        console.log('✓ Debug日志按钮事件已绑定');
    }
}

/**
 * 处理案卷列表点击事件
 */
function handleVolumeListClick(e) {
    const target = e.target;

    // 切换案卷
    if (target.classList.contains('switch-volume-btn')) {
        const volumeId = target.dataset.volumeId;
        switchVolume(volumeId);
    }

    // 编辑案卷
    if (target.classList.contains('edit-volume-btn')) {
        const volumeId = target.dataset.volumeId;
        editVolume(volumeId);
    }

    // 删除案卷
    if (target.classList.contains('delete-volume-btn')) {
        const volumeId = target.dataset.volumeId;
        deleteVolume(volumeId);
    }
}

/**
 * 显示新建案卷对话框
 */
function showCreateVolumeDialog() {
    console.log('显示新建案卷对话框');
    const dialog = document.getElementById('createVolumeDialog');
    if (dialog) {
        dialog.style.display = 'block';
        const titleInput = document.getElementById('newVolumeTitle');
        if (titleInput) {
            titleInput.value = '';
            titleInput.focus();
        }
        console.log('✓ 对话框已显示');
    } else {
        console.error('✗ 未找到新建案卷对话框 (createVolumeDialog)');
    }
}

/**
 * 隐藏新建案卷对话框
 */
function hideCreateVolumeDialog() {
    document.getElementById('createVolumeDialog').style.display = 'none';
}

/**
 * 确认创建案卷
 */
function confirmCreateVolume() {
    const title = document.getElementById('newVolumeTitle').value.trim();

    if (!title) {
        showToast('请输入案卷题名', 'warning');
        return;
    }

    const volume = volumeManager.createVolume(title);
    volumeManager.saveData();

    hideCreateVolumeDialog();
    renderVolumesList();

    showToast(`案卷"${title}"创建成功`, 'success');
}

/**
 * 切换案卷
 */
function switchVolume(volumeId) {
    if (volumeManager.switchVolume(volumeId)) {
        volumeManager.saveData();
        renderVolumesList();

        // 刷新当前卷的数据到表单
        if (typeof syncCurrentVolumeToForms === 'function') {
            syncCurrentVolumeToForms();
        }

        const volume = volumeManager.getCurrentVolume();
        showToast(`已切换到"${volume.title}"`, 'success');

        // 自动切换到卷内目录标签页
        const directoryTab = document.querySelector('[data-tab="directory"]');
        if (directoryTab) {
            directoryTab.click();
        }
    }
}

/**
 * 编辑案卷
 */
function editVolume(volumeId) {
    const volume = volumeManager.volumes.find(v => v.id === volumeId);
    if (!volume) return;

    const newTitle = prompt('请输入新的案卷题名：', volume.title);
    if (newTitle && newTitle.trim() !== '' && newTitle !== volume.title) {
        volume.title = newTitle.trim();
        volumeManager.saveData();
        renderVolumesList();
        showToast('案卷题名已更新', 'success');
    }
}

/**
 * 删除案卷
 */
function deleteVolume(volumeId) {
    const volume = volumeManager.volumes.find(v => v.id === volumeId);
    if (!volume) return;

    if (!confirm(`确定要删除案卷"${volume.title}"吗？\n删除后数据将无法恢复！`)) {
        return;
    }

    if (volumeManager.deleteVolume(volumeId)) {
        volumeManager.saveData();
        renderVolumesList();
        showToast('案卷已删除', 'success');

        // 如果删除的是当前卷，刷新表单
        if (typeof syncCurrentVolumeToForms === 'function') {
            syncCurrentVolumeToForms();
        }
    } else {
        showToast('无法删除最后一个案卷', 'error');
    }
}

/**
 * 保存工程信息
 */
function saveProjectInfo() {
    volumeManager.projectInfo.name = document.getElementById('projectName').value.trim();
    volumeManager.projectInfo.unit = document.getElementById('projectUnit').value.trim();
    volumeManager.projectInfo.secretLevel = document.getElementById('projectSecretLevel').value;
    volumeManager.projectInfo.retentionPeriod = document.getElementById('projectRetentionPeriod').value;
    volumeManager.saveData();
}

/**
 * 保存移交信息
 */
function saveTransferInfo() {
    volumeManager.transferData.note = document.getElementById('transferNote').value.trim();
    volumeManager.transferData.transferPerson = document.getElementById('transferPerson').value.trim();
    volumeManager.transferData.transferDate = document.getElementById('transferDate').value;
    volumeManager.transferData.receivePerson = document.getElementById('receivePerson').value.trim();
    volumeManager.transferData.receiveDate = document.getElementById('receiveDate').value;
    volumeManager.saveData();
}

/**
 * 生成所有汇总数据
 */
function generateAllData() {
    try {
        // 为所有案卷生成备考表和封面
        volumeManager.volumes.forEach(volume => {
            volumeManager.generateRecordForVolume(volume.id);
            volumeManager.generateCoverForVolume(volume.id);
        });

        // 生成案卷目录
        volumeManager.generateCatalog();

        // 刷新移交书统计
        renderTransferStats();

        volumeManager.saveData();

        showToast('所有汇总数据已生成', 'success');
    } catch (error) {
        console.error('生成汇总数据失败：', error);
        showToast('生成汇总数据失败：' + error.message, 'error');
    }
}

/**
 * 从当前卷同步数据到表单
 * 这个函数将被app.js调用，用于在切换案卷时更新UI
 */
function syncCurrentVolumeToForms() {
    const currentVolume = volumeManager.getCurrentVolume();
    if (!currentVolume) return;

    // 更新卷内目录表格
    if (typeof renderDirectoryTable === 'function') {
        renderDirectoryTable();
    }

    // 更新备考表表单
    if (typeof renderRecordForm === 'function') {
        renderRecordForm();
    }

    // 更新封面表单
    if (typeof renderCoverForm === 'function') {
        renderCoverForm();
    }

    // 更新案卷目录表格
    if (typeof renderCatalogTable === 'function') {
        renderCatalogTable();
    }
}

/**
 * 导出整个项目数据
 */
function exportProjectData() {
    try {
        const fileName = volumeManager.exportProjectData();
        showToast(`项目数据已导出为 ${fileName}`, 'success');
    } catch (error) {
        console.error('导出项目数据失败:', error);
        showToast('导出项目数据失败: ' + error.message, 'error');
    }
}

/**
 * 导入整个项目数据
 */
function importProjectData() {
    // 创建文件选择器
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const jsonString = event.target.result;
                volumeManager.importProjectData(jsonString);

                // 刷新所有UI
                renderProjectInfo();
                renderVolumesList();
                renderTransferStats();
                syncCurrentVolumeToForms();

                showToast('项目数据导入成功！', 'success');
            } catch (error) {
                console.error('导入失败:', error);
                showToast('导入失败: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    };

    input.click();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - 开始初始化多卷管理UI');

    // 直接初始化，不延迟
    try {
        initVolumeUI();
        console.log('多卷管理UI初始化成功');
    } catch (error) {
        console.error('多卷管理UI初始化失败:', error);
    }
});
