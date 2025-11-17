/**
 * 多卷管理器 - 负责多案卷的数据管理
 * 符合 GB 50328-2014 标准
 */

class VolumeManager {
    constructor() {
        this.projectInfo = {
            id: this.generateId(),
            name: '',
            unit: '',
            createDate: this.getTodayDate(),
            secretLevel: '',
            retentionPeriod: '永久'
        };

        this.volumes = [];  // 案卷列表
        this.currentVolumeId = null;  // 当前编辑的案卷ID
        this.transferData = {  // 移交书数据
            note: '本工程档案资料已按GB 50328-2014标准整理完毕，现移交存档。',
            transferPerson: '',
            transferDate: '',
            receivePerson: '',
            receiveDate: ''
        };
    }

    // ========== 工程管理 ==========

    /**
     * 设置工程信息
     */
    setProjectInfo(info) {
        Object.assign(this.projectInfo, info);
    }

    /**
     * 获取工程信息
     */
    getProjectInfo() {
        return this.projectInfo;
    }

    // ========== 案卷管理 ==========

    /**
     * 创建新案卷
     */
    createVolume(title = '') {
        const volume = {
            id: this.generateId(),
            volumeNo: this.volumes.length + 1,
            title: title || `案卷${this.volumes.length + 1}`,
            archiveNo: '',
            startDate: '',
            endDate: '',
            createDate: this.getTodayDate(),

            // 卷内目录
            directory: [],

            // 卷内备考表
            record: {
                totalPages: 0,
                textPages: 0,
                drawingPages: 0,
                photoCount: 0,
                note: '',
                creator: '',
                createDate: '',
                reviewer: '',
                reviewDate: ''
            },

            // 封面数据（部分字段从工程信息继承）
            cover: {
                archiveNo: '',
                title: title || `案卷${this.volumes.length + 1}`,
                unit: this.projectInfo.unit || '',
                startDate: '',
                endDate: '',
                secretLevel: this.projectInfo.secretLevel || '',
                retentionPeriod: this.projectInfo.retentionPeriod || '永久',
                volumeNumber: this.volumes.length + 1,
                totalVolumes: 0  // 会在导出时自动设置
            }
        };

        this.volumes.push(volume);
        this.currentVolumeId = volume.id;
        return volume;
    }

    /**
     * 获取案卷列表
     */
    getVolumes() {
        return this.volumes;
    }

    /**
     * 获取指定案卷
     */
    getVolume(id) {
        return this.volumes.find(v => v.id === id);
    }

    /**
     * 获取当前案卷
     */
    getCurrentVolume() {
        if (!this.currentVolumeId && this.volumes.length > 0) {
            this.currentVolumeId = this.volumes[0].id;
        }
        return this.getVolume(this.currentVolumeId);
    }

    /**
     * 切换当前案卷
     */
    switchVolume(id) {
        const volume = this.getVolume(id);
        if (volume) {
            this.currentVolumeId = id;
            return volume;
        }
        return null;
    }

    /**
     * 删除案卷
     */
    deleteVolume(id) {
        const index = this.volumes.findIndex(v => v.id === id);
        if (index !== -1) {
            this.volumes.splice(index, 1);

            // 重新分配案卷号
            this.volumes.forEach((v, idx) => {
                v.volumeNo = idx + 1;
                v.cover.volumeNumber = idx + 1;
            });

            // 如果删除的是当前案卷，切换到第一个
            if (this.currentVolumeId === id) {
                this.currentVolumeId = this.volumes.length > 0 ? this.volumes[0].id : null;
            }

            return true;
        }
        return false;
    }

    /**
     * 更新案卷信息
     */
    updateVolume(id, data) {
        const volume = this.getVolume(id);
        if (volume) {
            Object.assign(volume, data);
            return true;
        }
        return false;
    }

    // ========== 卷内目录管理（兼容原有接口） ==========

    /**
     * 获取当前卷的卷内目录
     */
    getDirectory() {
        const volume = this.getCurrentVolume();
        return volume ? volume.directory : [];
    }

    /**
     * 添加卷内目录行
     */
    addDirectoryRow(data = {}) {
        const volume = this.getCurrentVolume();
        if (!volume) {
            // 如果没有案卷，自动创建一个
            this.createVolume();
            return this.addDirectoryRow(data);
        }

        const row = {
            id: this.generateId(),
            serial: data.serial || volume.directory.length + 1,
            fileNumber: data.fileNumber || '',
            responsible: data.responsible || '',
            title: data.title || '',
            date: data.date || '',
            pages: data.pages || '',
            remark: data.remark || '',
            selected: false
        };

        volume.directory.push(row);
        return row;
    }

    /**
     * 更新卷内目录行
     */
    updateDirectoryRow(id, field, value) {
        const volume = this.getCurrentVolume();
        if (!volume) return false;

        const row = volume.directory.find(r => r.id === id);
        if (row && field !== 'serial') {
            row[field] = value;
            return true;
        }
        return false;
    }

    /**
     * 删除选中的行
     */
    deleteSelectedRows() {
        const volume = this.getCurrentVolume();
        if (!volume) return;

        volume.directory = volume.directory.filter(row => !row.selected);
        this.reorderDirectory();
    }

    /**
     * 重新排序卷内目录
     */
    reorderDirectory() {
        const volume = this.getCurrentVolume();
        if (!volume) return;

        volume.directory.forEach((row, index) => {
            row.serial = index + 1;
        });
    }

    /**
     * 切换行选中状态
     */
    toggleRowSelection(id) {
        const volume = this.getCurrentVolume();
        if (!volume) return;

        const row = volume.directory.find(r => r.id === id);
        if (row) {
            row.selected = !row.selected;
        }
    }

    /**
     * 全选/取消全选
     */
    toggleAllSelection(selected) {
        const volume = this.getCurrentVolume();
        if (!volume) return;

        volume.directory.forEach(row => {
            row.selected = selected;
        });
    }

    // ========== 数据统计与计算 ==========

    /**
     * 计算总页数
     */
    calculateTotalPages(volumeId = null) {
        const volume = volumeId ? this.getVolume(volumeId) : this.getCurrentVolume();
        if (!volume) return 0;

        let maxPage = 0;
        volume.directory.forEach(row => {
            if (!row.pages) return;

            const pageStr = row.pages.toString().trim();
            const segments = pageStr.split(/[,，]/);

            segments.forEach(segment => {
                if (segment.includes('-')) {
                    const [start, end] = segment.split('-').map(p => parseInt(p.trim()));
                    if (!isNaN(end)) {
                        maxPage = Math.max(maxPage, end);
                    }
                } else {
                    const page = parseInt(segment.trim());
                    if (!isNaN(page)) {
                        maxPage = Math.max(maxPage, page);
                    }
                }
            });
        });

        return maxPage;
    }

    /**
     * 智能分类文件类型
     */
    classifyDocumentType(row) {
        const title = (row.title || '').toLowerCase();
        const fileNumber = (row.fileNumber || '').toLowerCase();
        const remark = (row.remark || '').toLowerCase();
        const combined = title + fileNumber + remark;

        const photoKeywords = ['照片', '相片', '图片', 'photo', 'jpg', 'jpeg', 'png', '影像'];
        const drawingKeywords = ['图', '图纸', '设计图', '施工图', '图样', 'dwg', 'cad', '平面图', '立面图', '剖面图'];

        if (photoKeywords.some(keyword => combined.includes(keyword))) {
            return 'photo';
        } else if (drawingKeywords.some(keyword => combined.includes(keyword))) {
            return 'drawing';
        } else {
            return 'text';
        }
    }

    /**
     * 计算单行的页数
     */
    calculateRowPageCount(pagesStr) {
        if (!pagesStr) return 0;

        let count = 0;
        const pageStr = pagesStr.toString().trim();
        const segments = pageStr.split(/[,，]/);

        segments.forEach(segment => {
            if (segment.includes('-')) {
                const [start, end] = segment.split('-').map(p => parseInt(p.trim()));
                if (!isNaN(start) && !isNaN(end)) {
                    count += (end - start + 1);
                }
            } else {
                const page = parseInt(segment.trim());
                if (!isNaN(page)) {
                    count += 1;
                }
            }
        });

        return count;
    }

    /**
     * 计算页数统计
     */
    calculatePageStatistics(volumeId = null) {
        const volume = volumeId ? this.getVolume(volumeId) : this.getCurrentVolume();
        if (!volume) return { textPages: 0, drawingPages: 0, photoCount: 0 };

        let textPages = 0;
        let drawingPages = 0;
        let photoCount = 0;

        volume.directory.forEach(row => {
            if (!row.pages) return;

            const type = this.classifyDocumentType(row);
            const pageCount = this.calculateRowPageCount(row.pages);

            if (type === 'photo') {
                photoCount += pageCount;
            } else if (type === 'drawing') {
                drawingPages += pageCount;
            } else {
                textPages += pageCount;
            }
        });

        return { textPages, drawingPages, photoCount };
    }

    /**
     * 获取日期范围
     */
    getDateRange(volumeId = null) {
        const volume = volumeId ? this.getVolume(volumeId) : this.getCurrentVolume();
        if (!volume) return { startDate: '', endDate: '' };

        const dates = volume.directory
            .map(row => row.date)
            .filter(date => date && date.trim());

        if (dates.length === 0) {
            return { startDate: '', endDate: '' };
        }

        const sortedDates = dates.sort();
        return {
            startDate: sortedDates[0],
            endDate: sortedDates[sortedDates.length - 1]
        };
    }

    /**
     * 获取最常见的责任者
     */
    getMostCommonResponsible(volumeId = null) {
        const volume = volumeId ? this.getVolume(volumeId) : this.getCurrentVolume();
        if (!volume) return '';

        const responsibles = volume.directory
            .map(row => row.responsible)
            .filter(r => r && r.trim());

        if (responsibles.length === 0) return '';

        const counts = {};
        responsibles.forEach(r => {
            counts[r] = (counts[r] || 0) + 1;
        });

        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    }

    // ========== 自动生成功能 ==========

    /**
     * 同步到备考表（当前卷）
     */
    syncToRecord() {
        const volume = this.getCurrentVolume();
        if (!volume) return;

        const stats = this.calculatePageStatistics();
        volume.record.totalPages = this.calculateTotalPages();
        volume.record.textPages = stats.textPages;
        volume.record.drawingPages = stats.drawingPages;
        volume.record.photoCount = stats.photoCount;
    }

    /**
     * 同步到封面（当前卷）
     */
    syncToCover() {
        const volume = this.getCurrentVolume();
        if (!volume) return;

        const dateRange = this.getDateRange();
        const responsible = this.getMostCommonResponsible();

        if (!volume.cover.title || volume.cover.title === `案卷${volume.volumeNo}`) {
            const firstTitle = volume.directory[0]?.title || '';
            volume.cover.title = firstTitle || volume.title;
        }

        volume.cover.unit = responsible || volume.cover.unit || this.projectInfo.unit;
        volume.cover.startDate = dateRange.startDate || volume.cover.startDate;
        volume.cover.endDate = dateRange.endDate || volume.cover.endDate;
        volume.cover.totalVolumes = this.volumes.length;
    }

    /**
     * 自动生成当前卷的所有数据
     */
    autoGenerateCurrent() {
        this.syncToRecord();
        this.syncToCover();
    }

    /**
     * 为指定案卷生成备考表数据
     */
    generateRecordForVolume(volumeId) {
        const volume = this.getVolume(volumeId);
        if (!volume) return;

        const stats = this.calculatePageStatistics(volumeId);
        volume.record.totalPages = this.calculateTotalPages(volumeId);
        volume.record.textPages = stats.textPages;
        volume.record.drawingPages = stats.drawingPages;
        volume.record.photoCount = stats.photoCount;
    }

    /**
     * 为指定案卷生成封面数据
     */
    generateCoverForVolume(volumeId) {
        const volume = this.getVolume(volumeId);
        if (!volume) return;

        const dateRange = this.getDateRange(volumeId);
        const responsible = this.getMostCommonResponsible(volumeId);

        if (!volume.cover.title || volume.cover.title === `案卷${volume.volumeNo}`) {
            const firstTitle = volume.directory[0]?.title || '';
            volume.cover.title = firstTitle || volume.title;
        }

        volume.cover.unit = responsible || volume.cover.unit || this.projectInfo.unit;
        volume.cover.startDate = dateRange.startDate || volume.cover.startDate;
        volume.cover.endDate = dateRange.endDate || volume.cover.endDate;
        volume.cover.totalVolumes = this.volumes.length;
    }

    /**
     * 生成案卷目录（汇总所有卷）
     */
    generateCatalog() {
        return this.volumes.map(volume => {
            const stats = this.calculatePageStatistics(volume.id);
            return {
                id: volume.id,
                volumeNo: volume.volumeNo,
                title: volume.title || volume.cover.title,
                textPages: stats.textPages,
                drawingPages: stats.drawingPages,
                other: stats.photoCount > 0 ? `照片${stats.photoCount}张` : '',
                unit: volume.cover.unit,
                createDate: volume.createDate,
                retentionPeriod: volume.cover.retentionPeriod,
                secretLevel: volume.cover.secretLevel || '',
                remark: ''
            };
        });
    }

    /**
     * 生成移交书统计数据
     */
    generateTransferStats() {
        let totalFiles = 0;
        let totalPages = 0;
        let textPages = 0;
        let drawingPages = 0;
        let photoCount = 0;
        let textVolumes = 0;
        let drawingVolumes = 0;
        let otherVolumes = 0;

        this.volumes.forEach(volume => {
            totalFiles += volume.directory.length;
            totalPages += this.calculateTotalPages(volume.id);

            const stats = this.calculatePageStatistics(volume.id);
            textPages += stats.textPages;
            drawingPages += stats.drawingPages;
            photoCount += stats.photoCount;

            // 判断卷的类型
            if (stats.textPages > stats.drawingPages) {
                textVolumes++;
            } else if (stats.drawingPages > stats.textPages) {
                drawingVolumes++;
            } else if (stats.textPages === 0 && stats.drawingPages === 0) {
                otherVolumes++;
            } else {
                textVolumes++;  // 相等时归为文字材料
            }
        });

        return {
            totalVolumes: this.volumes.length,
            totalFiles,
            totalPages,
            textPages,
            drawingPages,
            photoCount,
            textVolumes,
            drawingVolumes,
            otherVolumes,
            textFiles: totalFiles,  // 简化：暂时等于总文件数
            drawingFiles: 0,
            photoFiles: photoCount
        };
    }

    // ========== 数据持久化 ==========

    /**
     * 保存到LocalStorage
     */
    saveToLocalStorage() {
        const data = {
            projectInfo: this.projectInfo,
            volumes: this.volumes,
            currentVolumeId: this.currentVolumeId,
            transferData: this.transferData
        };
        localStorage.setItem('volumeData', JSON.stringify(data));
    }

    /**
     * 保存数据（别名方法，兼容性）
     */
    saveData() {
        return this.saveToLocalStorage();
    }

    /**
     * 从LocalStorage加载
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('volumeData');
            if (data) {
                const parsed = JSON.parse(data);

                // 验证数据格式
                if (!parsed || typeof parsed !== 'object') {
                    console.error('volumeData 格式无效');
                    return false;
                }

                // 加载数据
                this.projectInfo = parsed.projectInfo || this.projectInfo;
                this.volumes = Array.isArray(parsed.volumes) ? parsed.volumes : [];
                this.currentVolumeId = parsed.currentVolumeId || null;
                this.transferData = parsed.transferData || this.transferData;

                console.log(`成功加载 ${this.volumes.length} 个案卷`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('加载 volumeData 失败:', error);
            // 如果数据损坏，清除并重新开始
            localStorage.removeItem('volumeData');
            return false;
        }
    }

    /**
     * 从旧数据迁移
     */
    migrateFromOldData() {
        try {
            const oldData = localStorage.getItem('archiveData');
            if (oldData && this.volumes.length === 0) {
                const parsed = JSON.parse(oldData);

                // 验证旧数据格式
                if (!parsed || typeof parsed !== 'object') {
                    console.error('archiveData 格式无效，跳过迁移');
                    return false;
                }

                // 创建第一个卷
                const volume = this.createVolume('第1卷');

                // 迁移数据
                volume.directory = Array.isArray(parsed.directoryData) ? parsed.directoryData : [];
                volume.record = parsed.recordData || volume.record;
                if (parsed.coverData && typeof parsed.coverData === 'object') {
                    Object.assign(volume.cover, parsed.coverData);
                    volume.title = parsed.coverData.title || volume.title;
                }

                // 保存到新格式
                this.saveToLocalStorage();
                console.log('✓ 已从旧数据迁移到新的多卷管理系统');
                return true;
            }
            return false;
        } catch (error) {
            console.error('迁移旧数据失败:', error);
            // 迁移失败不影响新数据使用
            return false;
        }
    }

    /**
     * 清空所有数据
     */
    clearAllData() {
        this.volumes = [];
        this.currentVolumeId = null;
        this.projectInfo = {
            id: this.generateId(),
            name: '',
            unit: '',
            createDate: this.getTodayDate(),
            secretLevel: '',
            retentionPeriod: '永久'
        };
        this.transferData = {
            note: '本工程档案资料已按GB 50328-2014标准整理完毕，现移交存档。',
            transferPerson: '',
            transferDate: '',
            receivePerson: '',
            receiveDate: ''
        };
    }

    /**
     * 导出整个项目数据为JSON文件
     */
    exportProjectData() {
        const data = {
            version: '1.0',
            exportDate: this.getTodayDate(),
            standard: 'GB 50328-2014',
            projectInfo: this.projectInfo,
            volumes: this.volumes,
            currentVolumeId: this.currentVolumeId,
            transferData: this.transferData
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `${this.projectInfo.name || '工程项目'}_${this.getTodayDate()}.json`;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        return fileName;
    }

    /**
     * 从JSON文件导入项目数据
     */
    importProjectData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // 验证数据格式
            if (!data.projectInfo || !data.volumes) {
                throw new Error('无效的项目数据格式');
            }

            // 导入数据
            this.projectInfo = data.projectInfo;
            this.volumes = data.volumes;
            this.currentVolumeId = data.currentVolumeId || null;
            this.transferData = data.transferData || this.transferData;

            // 保存到LocalStorage
            this.saveToLocalStorage();

            return true;
        } catch (error) {
            console.error('导入项目数据失败:', error);
            throw error;
        }
    }

    // ========== 辅助方法 ==========

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取今天的日期
     */
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// 将类暴露到全局，供其他脚本按需创建/复用实例
if (typeof window !== 'undefined') {
    window.VolumeManager = VolumeManager;
}
