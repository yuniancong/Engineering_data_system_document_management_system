/**
 * Word文档导出器
 * 使用HTML格式生成.doc文件（浏览器完全兼容）
 */

class WordExporter {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * 导出卷内目录
     */
    async exportDirectory() {
        const data = this.dataManager.directoryData;

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>卷内目录</title>
    <style>
        body { font-family: SimSun, "仿宋_GB2312"; font-size: 12pt; }
        h1 { text-align: center; font-size: 16pt; font-weight: bold; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid black; padding: 5px; text-align: center; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .footer { text-align: right; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>卷内目录</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 8%;">序号</th>
                <th style="width: 15%;">文件编号</th>
                <th style="width: 15%;">责任者</th>
                <th style="width: 30%;">文件题名</th>
                <th style="width: 12%;">日期</th>
                <th style="width: 10%;">页次</th>
                <th style="width: 10%;">备注</th>
            </tr>
        </thead>
        <tbody>
`;

        data.forEach(row => {
            html += `
            <tr>
                <td>${row.serial}</td>
                <td>${this.escapeHtml(row.fileNumber)}</td>
                <td>${this.escapeHtml(row.responsible)}</td>
                <td>${this.escapeHtml(row.title)}</td>
                <td>${this.escapeHtml(row.date)}</td>
                <td>${this.escapeHtml(row.pages)}</td>
                <td>${this.escapeHtml(row.remark)}</td>
            </tr>`;
        });

        html += `
        </tbody>
    </table>
    <div class="footer">制表日期：${this.dataManager.getTodayDate()}</div>
</body>
</html>`;

        this.downloadAsWord(html, `卷内目录_${this.dataManager.getTodayDate()}.doc`);
    }

    /**
     * 导出卷内备考表
     */
    async exportRecord() {
        const data = this.dataManager.recordData;

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>卷内备考表</title>
    <style>
        body { font-family: SimSun, "仿宋_GB2312"; font-size: 12pt; }
        h1 { text-align: center; font-size: 16pt; font-weight: bold; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid black; padding: 8px; }
        th { background-color: #f0f0f0; font-weight: bold; width: 30%; }
        td { width: 70%; }
    </style>
</head>
<body>
    <h1>卷内备考表</h1>
    <table>
        <tr>
            <th>本案卷共有文件材料</th>
            <td>${data.totalPages || 0} 页</td>
        </tr>
        <tr>
            <th>其中：文字材料</th>
            <td>${data.textPages || 0} 页</td>
        </tr>
        <tr>
            <th>图样材料</th>
            <td>${data.drawingPages || 0} 页</td>
        </tr>
        <tr>
            <th>照片</th>
            <td>${data.photoCount || 0} 张</td>
        </tr>
        <tr>
            <th>说明</th>
            <td>${this.escapeHtml(data.note || '')}</td>
        </tr>
        <tr>
            <th>立卷人</th>
            <td>${this.escapeHtml(data.creator || '')}　　日期：${this.escapeHtml(data.createDate || '')}</td>
        </tr>
        <tr>
            <th>审核人</th>
            <td>${this.escapeHtml(data.reviewer || '')}　　日期：${this.escapeHtml(data.reviewDate || '')}</td>
        </tr>
    </table>
</body>
</html>`;

        this.downloadAsWord(html, `卷内备考表_${this.dataManager.getTodayDate()}.doc`);
    }

    /**
     * 导出案卷封面
     */
    async exportCover() {
        const data = this.dataManager.coverData;

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>案卷封面</title>
    <style>
        body { font-family: SimSun, "仿宋_GB2312"; font-size: 14pt; padding: 40px; }
        h1 { text-align: center; font-size: 18pt; font-weight: bold; margin: 30px 0; }
        .info-row { margin: 25px 0; line-height: 2; }
        .label { font-weight: bold; display: inline-block; width: 150px; }
        .value { display: inline-block; }
    </style>
</head>
<body>
    <h1>案卷封面</h1>
    <div class="info-row">
        <span class="label">档号：</span>
        <span class="value">${this.escapeHtml(data.archiveNo || '')}</span>
    </div>
    <div class="info-row">
        <span class="label">案卷题名：</span>
        <span class="value">${this.escapeHtml(data.title || '')}</span>
    </div>
    <div class="info-row">
        <span class="label">编制单位：</span>
        <span class="value">${this.escapeHtml(data.unit || '')}</span>
    </div>
    <div class="info-row">
        <span class="label">起止日期：</span>
        <span class="value">${this.escapeHtml(data.startDate || '')} 至 ${this.escapeHtml(data.endDate || '')}</span>
    </div>
    <div class="info-row">
        <span class="label">密级：</span>
        <span class="value">${this.escapeHtml(data.secretLevel || '无')}</span>
    </div>
    <div class="info-row">
        <span class="label">保管期限：</span>
        <span class="value">${this.escapeHtml(data.retentionPeriod || '永久')}</span>
    </div>
    <div class="info-row">
        <span class="label">本工程共：</span>
        <span class="value">${data.totalVolumes || 1} 卷</span>
    </div>
    <div class="info-row">
        <span class="label">本案卷为第：</span>
        <span class="value">${data.volumeNumber || 1} 卷</span>
    </div>
</body>
</html>`;

        this.downloadAsWord(html, `案卷封面_${this.dataManager.getTodayDate()}.doc`);
    }

    /**
     * 导出案卷目录
     */
    async exportCatalog() {
        const data = this.dataManager.catalogData;

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>案卷目录</title>
    <style>
        body { font-family: SimSun, "仿宋_GB2312"; font-size: 12pt; }
        h1 { text-align: center; font-size: 16pt; font-weight: bold; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid black; padding: 5px; text-align: center; }
        th { background-color: #f0f0f0; font-weight: bold; }
    </style>
</head>
<body>
    <h1>案卷目录</h1>
    <table>
        <thead>
            <tr>
                <th style="width: 10%;">案卷号</th>
                <th style="width: 25%;">案卷题名</th>
                <th style="width: 10%;">文字(页)</th>
                <th style="width: 10%;">图纸(张)</th>
                <th style="width: 10%;">其他</th>
                <th style="width: 15%;">编制单位</th>
                <th style="width: 10%;">编制日期</th>
                <th style="width: 10%;">保管期限</th>
            </tr>
        </thead>
        <tbody>
`;

        data.forEach(entry => {
            html += `
            <tr>
                <td>${entry.volumeNo}</td>
                <td>${this.escapeHtml(entry.title)}</td>
                <td>${entry.textPages}</td>
                <td>${entry.drawingPages}</td>
                <td>${this.escapeHtml(entry.other || '')}</td>
                <td>${this.escapeHtml(entry.unit)}</td>
                <td>${this.escapeHtml(entry.createDate)}</td>
                <td>${this.escapeHtml(entry.retentionPeriod)}</td>
            </tr>`;
        });

        html += `
        </tbody>
    </table>
</body>
</html>`;

        this.downloadAsWord(html, `案卷目录_${this.dataManager.getTodayDate()}.doc`);
    }

    /**
     * 导出档案移交书
     */
    async exportTransfer() {
        const data = this.dataManager.coverData;
        const recordData = this.dataManager.recordData;

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>档案移交书</title>
    <style>
        body { font-family: SimSun, "仿宋_GB2312"; font-size: 14pt; padding: 40px; }
        h1 { text-align: center; font-size: 18pt; font-weight: bold; margin: 30px 0; }
        .info-row { margin: 20px 0; line-height: 2; }
        .signature { margin-top: 40px; line-height: 2.5; }
    </style>
</head>
<body>
    <h1>档案移交书</h1>
    <div class="info-row">
        <strong>工程名称：</strong>${this.escapeHtml(data.title || '')}
    </div>
    <div class="info-row">
        <strong>移交单位：</strong>${this.escapeHtml(data.unit || '')}
    </div>
    <div class="info-row">
        <strong>移交日期：</strong>${this.dataManager.getTodayDate()}
    </div>
    <div class="info-row">
        <strong>案卷数量：</strong>${data.totalVolumes || 1} 卷
    </div>
    <div class="info-row">
        <strong>文件总页数：</strong>${recordData.totalPages || 0} 页
    </div>
    <div class="info-row">
        <strong>移交说明：</strong>
    </div>
    <div class="info-row" style="margin-left: 40px;">
        ${this.escapeHtml(recordData.note || '本工程档案资料已按GB 50328-2014标准整理完毕，现移交存档。')}
    </div>
    <div class="signature">
        移交人签字：_______________　　日期：_______________
    </div>
    <div class="signature">
        接收人签字：_______________　　日期：_______________
    </div>
</body>
</html>`;

        this.downloadAsWord(html, `档案移交书_${this.dataManager.getTodayDate()}.doc`);
    }

    /**
     * 导出所有文档
     */
    async exportAll() {
        showToast('正在生成所有Word文档，请稍候...', 'success');

        try {
            await this.exportDirectory();
            await this.delay(500);

            await this.exportRecord();
            await this.delay(500);

            await this.exportCover();
            await this.delay(500);

            await this.exportCatalog();
            await this.delay(500);

            await this.exportTransfer();

            showToast('所有Word文档已导出完成', 'success');
        } catch (error) {
            console.error('导出失败:', error);
            showToast('部分文档导出失败', 'error');
        }
    }

    // ========== 辅助方法 ==========

    /**
     * HTML转义
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 下载为Word文档
     */
    downloadAsWord(html, filename) {
        // 添加Microsoft Word的XML命名空间和样式
        const fullHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
    <meta charset='utf-8'>
    <meta name=ProgId content=Word.Document>
    <meta name=Generator content="Microsoft Word">
    <meta name=Originator content="Microsoft Word">
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
</head>
${html}
</html>`;

        // 创建Blob
        const blob = new Blob(['\ufeff', fullHtml], {
            type: 'application/msword'
        });

        // 使用FileSaver下载
        saveAs(blob, filename);

        console.log(`Word文档已导出: ${filename}`);
    }
}

// 创建全局导出器实例
const wordExporter = new WordExporter(dataManager);
