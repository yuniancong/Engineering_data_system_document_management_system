/**
 * 数据管理器 - 负责数据存储、计算和同步
 * 符合 GB 50328-2014 标准
 */

class DataManager {
    constructor() {
        this.directoryData = []; // 卷内目录数据
        this.recordData = {};    // 卷内备考表数据
        this.coverData = {};     // 案卷封面数据
        this.catalogData = [];   // 案卷目录数据
    }

    // ========== 卷内目录数据管理 ==========

    /**
     * 添加卷内目录行
     */
    addDirectoryRow(data = {}) {
        const row = {
            id: this.generateId(),
            serial: data.serial || this.directoryData.length + 1,
            fileNumber: data.fileNumber || '',
            responsible: data.responsible || '',
            title: data.title || '',
            date: data.date || '',
            pages: data.pages || '',
            remark: data.remark || '',
            selected: false
        };
        this.directoryData.push(row);
        return row;
    }

    /**
     * 更新卷内目录行
     */
    updateDirectoryRow(id, field, value) {
        const row = this.directoryData.find(r => r.id === id);
        if (row) {
            // 序号是自动分配的，不允许手动更新
            if (field !== 'serial') {
                row[field] = value;
            }
        }
    }

    /**
     * 删除选中的卷内目录行
     */
    deleteSelectedRows() {
        this.directoryData = this.directoryData.filter(row => !row.selected);
        this.reorderDirectory();
    }

    /**
     * 重新排序卷内目录并自动分配序号
     */
    reorderDirectory() {
        // 自动分配序号：从1开始递增
        this.directoryData.forEach((row, index) => {
            row.serial = index + 1;
        });
    }

    /**
     * 切换行选中状态
     */
    toggleRowSelection(id) {
        const row = this.directoryData.find(r => r.id === id);
        if (row) {
            row.selected = !row.selected;
        }
    }

    /**
     * 全选/取消全选
     */
    toggleAllSelection(selected) {
        this.directoryData.forEach(row => {
            row.selected = selected;
        });
    }

    // ========== 数据统计与计算 ==========

    /**
     * 计算总页数
     * 根据页次字段统计，支持格式：单页(5)、范围(5-10)、多段(5-10,15-20)
     */
    calculateTotalPages() {
        let maxPage = 0;

        this.directoryData.forEach(row => {
            if (!row.pages) return;

            const pageStr = row.pages.toString().trim();
            // 支持多种格式：5, 5-10, 5-10,15-20
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
     * 智能分类文件类型（文字、图样、照片）
     * 根据文件题名、文件编号、备注等判断
     */
    classifyDocumentType(row) {
        const title = row.title.toLowerCase();
        const fileNumber = row.fileNumber.toLowerCase();
        const remark = row.remark.toLowerCase();
        const combined = title + fileNumber + remark;

        // 照片识别关键词
        const photoKeywords = ['照片', '相片', '图片', 'photo', 'jpg', 'jpeg', 'png', '影像'];
        // 图样识别关键词
        const drawingKeywords = ['图', '图纸', '设计图', '施工图', '图样', 'dwg', 'cad', '平面图', '立面图', '剖面图'];

        if (photoKeywords.some(keyword => combined.includes(keyword))) {
            return 'photo';
        } else if (drawingKeywords.some(keyword => combined.includes(keyword))) {
            return 'drawing';
        } else {
            return 'text'; // 默认为文字材料
        }
    }

    /**
     * 计算页数统计（文字、图样）
     */
    calculatePageStatistics() {
        let textPages = 0;
        let drawingPages = 0;
        let photoCount = 0;

        this.directoryData.forEach(row => {
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
     * 获取日期范围
     */
    getDateRange() {
        const dates = this.directoryData
            .map(row => row.date)
            .filter(date => date && date.trim())
            .sort();

        if (dates.length === 0) {
            return { startDate: '', endDate: '' };
        }

        return {
            startDate: dates[0],
            endDate: dates[dates.length - 1]
        };
    }

    /**
     * 提取案卷题名（智能分析）
     */
    extractCaseTitle() {
        if (this.directoryData.length === 0) {
            return '';
        }

        // 尝试从第一个文件题名中提取工程名称
        const firstTitle = this.directoryData[0].title;

        // 如果有多个文件，尝试找出共同前缀
        if (this.directoryData.length > 1) {
            let commonPrefix = firstTitle;
            for (let i = 1; i < this.directoryData.length; i++) {
                const title = this.directoryData[i].title;
                let j = 0;
                while (j < commonPrefix.length && j < title.length &&
                       commonPrefix[j] === title[j]) {
                    j++;
                }
                commonPrefix = commonPrefix.substring(0, j);
                if (commonPrefix.length < 5) break; // 太短则放弃
            }

            if (commonPrefix.length >= 5) {
                return commonPrefix.trim();
            }
        }

        return firstTitle;
    }

    /**
     * 提取责任单位（最常出现的责任者）
     */
    extractResponsibleUnit() {
        const units = {};
        this.directoryData.forEach(row => {
            if (row.responsible) {
                units[row.responsible] = (units[row.responsible] || 0) + 1;
            }
        });

        let maxCount = 0;
        let mainUnit = '';
        for (const [unit, count] of Object.entries(units)) {
            if (count > maxCount) {
                maxCount = count;
                mainUnit = unit;
            }
        }

        return mainUnit;
    }

    // ========== 自动生成其他表格 ==========

    /**
     * 自动生成卷内备考表
     */
    generateRecordTable() {
        const totalPages = this.calculateTotalPages();
        const { textPages, drawingPages, photoCount } = this.calculatePageStatistics();

        this.recordData = {
            totalPages,
            textPages,
            drawingPages,
            photoCount,
            note: this.recordData.note || '',
            creator: this.recordData.creator || '',
            createDate: this.recordData.createDate || this.getTodayDate(),
            reviewer: this.recordData.reviewer || '',
            reviewDate: this.recordData.reviewDate || ''
        };

        return this.recordData;
    }

    /**
     * 自动生成案卷封面
     */
    generateCoverTable() {
        const { startDate, endDate } = this.getDateRange();
        const title = this.extractCaseTitle();
        const unit = this.extractResponsibleUnit();

        this.coverData = {
            archiveNo: this.coverData.archiveNo || '',
            title: this.coverData.title || title,
            unit: this.coverData.unit || unit,
            startDate: this.coverData.startDate || startDate,
            endDate: this.coverData.endDate || endDate,
            secretLevel: this.coverData.secretLevel || '',
            retentionPeriod: this.coverData.retentionPeriod || '永久',
            totalVolumes: this.coverData.totalVolumes || 1,
            volumeNumber: this.coverData.volumeNumber || 1
        };

        return this.coverData;
    }

    /**
     * 将当前卷添加到案卷目录
     */
    addCurrentVolumeToCatalog() {
        const { textPages, drawingPages, photoCount } = this.calculatePageStatistics();

        const catalogEntry = {
            id: this.generateId(),
            volumeNo: this.coverData.volumeNumber || this.catalogData.length + 1,
            title: this.coverData.title || this.extractCaseTitle(),
            textPages,
            drawingPages: drawingPages + photoCount, // 图纸和照片合并
            other: '',
            unit: this.coverData.unit || this.extractResponsibleUnit(),
            createDate: this.getTodayDate(),
            retentionPeriod: this.coverData.retentionPeriod || '永久',
            secretLevel: this.coverData.secretLevel || '',
            remark: ''
        };

        // 检查是否已存在相同卷号
        const existingIndex = this.catalogData.findIndex(
            item => item.volumeNo === catalogEntry.volumeNo
        );

        if (existingIndex >= 0) {
            // 更新现有条目
            this.catalogData[existingIndex] = catalogEntry;
        } else {
            // 添加新条目
            this.catalogData.push(catalogEntry);
        }

        return catalogEntry;
    }

    // ========== 同步功能 ==========

    /**
     * 从卷内目录同步到卷内备考表
     */
    syncToRecord() {
        return this.generateRecordTable();
    }

    /**
     * 从卷内目录同步到案卷封面
     */
    syncToCover() {
        return this.generateCoverTable();
    }

    /**
     * 从当前卷同步到案卷目录
     */
    syncToCatalog() {
        // 先确保备考表和封面是最新的
        this.generateRecordTable();
        this.generateCoverTable();
        return this.addCurrentVolumeToCatalog();
    }

    /**
     * 自动生成所有表格
     */
    autoGenerateAll() {
        this.generateRecordTable();
        this.generateCoverTable();
        this.addCurrentVolumeToCatalog();
    }

    // ========== 数据持久化 ==========

    /**
     * 保存所有数据到 LocalStorage
     */
    saveToLocalStorage() {
        const data = {
            directory: this.directoryData,
            record: this.recordData,
            cover: this.coverData,
            catalog: this.catalogData,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('archiveData', JSON.stringify(data));
    }

    /**
     * 从 LocalStorage 加载数据
     */
    loadFromLocalStorage() {
        const dataStr = localStorage.getItem('archiveData');
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                this.directoryData = data.directory || [];
                this.recordData = data.record || {};
                this.coverData = data.cover || {};
                this.catalogData = data.catalog || [];
                return true;
            } catch (error) {
                console.error('加载数据失败:', error);
                return false;
            }
        }
        return false;
    }

    /**
     * 导出数据为 JSON
     */
    exportToJSON() {
        const data = {
            directory: this.directoryData,
            record: this.recordData,
            cover: this.coverData,
            catalog: this.catalogData,
            exportDate: new Date().toISOString(),
            standard: 'GB 50328-2014'
        };
        return JSON.stringify(data, null, 2);
    }

    /**
     * 从 JSON 导入数据
     */
    importFromJSON(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            this.directoryData = data.directory || [];
            this.recordData = data.record || {};
            this.coverData = data.cover || {};
            this.catalogData = data.catalog || [];
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    /**
     * 清空所有数据
     */
    clearAllData() {
        this.directoryData = [];
        this.recordData = {};
        this.coverData = {};
        this.catalogData = [];
    }

    // ========== 工具方法 ==========

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 获取今天日期
     */
    getTodayDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * 格式化日期（符合GB标准：YYYY-MM-DD）
     */
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date)) return dateStr;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// 创建全局数据管理器实例
const dataManager = new DataManager();
