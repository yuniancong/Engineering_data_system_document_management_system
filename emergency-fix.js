/**
 * 紧急修复脚本
 * 在浏览器控制台运行此脚本来诊断和修复问题
 */

console.log('🔧 开始紧急修复...');

// ========== 修复1: 强制重新绑定新建案卷按钮 ==========
function fixCreateVolumeButton() {
    console.log('修复新建案卷按钮...');

    const btn = document.getElementById('createVolumeBtn');
    if (!btn) {
        console.error('❌ 新建案卷按钮不存在');
        return false;
    }

    // 移除所有现有事件监听器
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // 重新绑定事件
    newBtn.addEventListener('click', function() {
        console.log('🆕 新建案卷按钮被点击');

        try {
            if (typeof volumeManager === 'undefined' || !volumeManager) {
                alert('系统未正确初始化，请刷新页面');
                return;
            }

            const volumeNo = volumeManager.volumes.length + 1;
            const defaultTitle = `案卷${volumeNo}`;

            console.log(`正在创建: ${defaultTitle}`);
            const volume = volumeManager.createVolume(defaultTitle);
            console.log(`✅ 创建成功:`, volume);

            volumeManager.saveData();

            // 刷新案卷列表
            if (typeof renderVolumesList === 'function') {
                renderVolumesList();
            }

            // 切换到卷内目录
            switchToTab('directory');

            // 刷新卷内目录
            if (typeof renderDirectoryTable === 'function') {
                renderDirectoryTable();
            }

            alert(`已创建"${defaultTitle}"，请填写卷内目录数据`);

        } catch (error) {
            console.error('❌ 创建失败:', error);
            alert('创建失败: ' + error.message);
        }
    });

    console.log('✅ 新建案卷按钮已修复');
    return true;
}

// ========== 修复2: 强制刷新移交书统计 ==========
function fixTransferStats() {
    console.log('修复移交书统计...');

    try {
        if (typeof volumeManager === 'undefined' || !volumeManager) {
            console.error('❌ volumeManager未初始化');
            return false;
        }

        const stats = volumeManager.generateTransferStats();
        console.log('📊 统计数据:', stats);

        // 更新页面显示
        const elements = {
            'transferTotalVolumes': stats.totalVolumes,
            'transferTotalFiles': stats.totalFiles,
            'transferTotalPages': stats.totalPages,
            'transferTextVolumes': stats.textVolumes,
            'transferTextPages': stats.textPages,
            'transferDrawingVolumes': stats.drawingVolumes,
            'transferDrawingPages': stats.drawingPages,
            'transferPhotoCount': stats.photoCount
        };

        let updated = 0;
        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = value;
                updated++;
            } else {
                console.warn(`⚠️ 元素不存在: ${id}`);
            }
        }

        console.log(`✅ 已更新 ${updated} 个统计数据元素`);
        return true;

    } catch (error) {
        console.error('❌ 刷新统计失败:', error);
        return false;
    }
}

// ========== 修复3: 重新绑定刷新统计按钮 ==========
function fixSyncButton() {
    console.log('修复刷新统计按钮...');

    const btn = document.getElementById('syncTransferBtn');
    if (!btn) {
        console.error('❌ 刷新统计按钮不存在');
        return false;
    }

    // 移除所有现有事件监听器
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    // 重新绑定事件
    newBtn.addEventListener('click', function() {
        console.log('🔄 刷新统计按钮被点击');
        fixTransferStats();
        alert('统计数据已刷新');
    });

    console.log('✅ 刷新统计按钮已修复');
    return true;
}

// ========== 修复4: 强制显示调试面板的导入按钮 ==========
function checkDebugPanel() {
    console.log('检查调试面板...');

    if (typeof debugHelper === 'undefined' || !debugHelper) {
        console.error('❌ debugHelper未初始化');
        console.log('尝试手动初始化...');

        if (typeof dataManager !== 'undefined' && typeof wordExporter !== 'undefined') {
            window.debugHelper = new DebugHelper(dataManager, wordExporter);
            debugHelper.createDebugButton();
            console.log('✅ debugHelper已手动初始化');
        } else {
            console.error('❌ 依赖对象未加载');
            return false;
        }
    }

    console.log('✅ debugHelper存在');
    console.log('提示：点击右下角🔍按钮，切换到"操作"标签页查看导入按钮');
    return true;
}

// ========== 系统诊断 ==========
function diagnoseSystem() {
    console.log('\n========== 系统诊断 ==========');

    console.log('\n📋 全局对象检查:');
    console.log('VolumeManager类:', typeof VolumeManager !== 'undefined' ? '✅' : '❌');
    console.log('volumeManager实例:', typeof volumeManager !== 'undefined' && volumeManager ? '✅' : '❌');
    console.log('DataManager类:', typeof DataManager !== 'undefined' ? '✅' : '❌');
    console.log('dataManager实例:', typeof dataManager !== 'undefined' && dataManager ? '✅' : '❌');
    console.log('debugHelper实例:', typeof debugHelper !== 'undefined' && debugHelper ? '✅' : '❌');

    if (typeof volumeManager !== 'undefined' && volumeManager) {
        console.log('\n📦 案卷数据:');
        console.log('案卷数量:', volumeManager.volumes.length);
        console.log('当前案卷:', volumeManager.getCurrentVolume()?.title || '无');

        const stats = volumeManager.generateTransferStats();
        console.log('\n📊 统计数据:');
        console.table(stats);
    }

    console.log('\n🎯 关键元素检查:');
    const elements = [
        'createVolumeBtn',
        'syncTransferBtn',
        'volumesList',
        'transferTotalVolumes',
        'transferTotalFiles',
        'transferTotalPages'
    ];

    elements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`${id}:`, el ? '✅' : '❌');
    });

    console.log('\n========== 诊断完成 ==========\n');
}

// ========== 执行所有修复 ==========
function applyAllFixes() {
    console.log('\n========== 执行所有修复 ==========');

    diagnoseSystem();

    console.log('\n开始修复...');
    const results = [];

    results.push({name: '新建案卷按钮', success: fixCreateVolumeButton()});
    results.push({name: '刷新统计按钮', success: fixSyncButton()});
    results.push({name: '移交书统计数据', success: fixTransferStats()});
    results.push({name: '调试面板', success: checkDebugPanel()});

    console.log('\n========== 修复结果 ==========');
    results.forEach(r => {
        console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
    });

    console.log('\n🎉 修复完成！');
    console.log('提示：');
    console.log('1. 刷新页面后可能需要重新运行此脚本');
    console.log('2. 导入功能在调试面板的"操作"标签页');
    console.log('3. 如仍有问题，请查看上面的诊断信息');

    return results;
}

// 自动执行修复
console.log('⏳ 等待2秒后自动执行修复...');
setTimeout(() => {
    applyAllFixes();
}, 2000);

// 导出到全局作用域
window.emergencyFix = {
    diagnose: diagnoseSystem,
    fixAll: applyAllFixes,
    fixCreateButton: fixCreateVolumeButton,
    fixTransferStats: fixTransferStats,
    fixSyncButton: fixSyncButton
};

console.log('\n💡 可用命令:');
console.log('emergencyFix.diagnose()     - 诊断系统');
console.log('emergencyFix.fixAll()        - 执行所有修复');
console.log('emergencyFix.fixCreateButton() - 只修复新建按钮');
console.log('emergencyFix.fixTransferStats() - 只刷新统计数据');
