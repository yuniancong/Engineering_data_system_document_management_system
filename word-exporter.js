/**
 * Word文档导出器 - 基于真实模板
 * 使用JSZip和XML DOM操作来填充模板数据
 */

class WordExporter {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.templates = {
            directory: 'templates/表三、卷内目录.docx',
            record: 'templates/表四、备考表.docx',
            cover: 'templates/表二、档案封面.docx',
            catalog: 'templates/表一、档案移交目录.docx',
            transfer: 'templates/附件3-移交书.docx'
        };
    }

    /**
     * 导出卷内目录
     */
    async exportDirectory() {
        try {
            showToast('正在生成卷内目录...', 'success');

            const templatePath = this.templates.directory;
            const data = this.dataManager.directoryData;

            // 加载模板
            const templateBlob = await this.loadTemplate(templatePath);
            const zip = await JSZip.loadAsync(templateBlob);

            // 读取document.xml
            const docXml = await zip.file('word/document.xml').async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(docXml, 'text/xml');

            // 找到表格
            const table = xmlDoc.getElementsByTagName('w:tbl')[0];
            if (!table) {
                throw new Error('模板中未找到表格');
            }

            // 获取所有行
            const rows = table.getElementsByTagName('w:tr');
            if (rows.length < 4) {
                throw new Error('模板表格格式不正确');
            }

            // 保留前3行（标题和表头），使用第4行作为模板
            const templateRow = rows[3].cloneNode(true);

            // 删除第4行及以后的所有行
            while (rows.length > 3) {
                table.removeChild(rows[3]);
            }

            // 添加数据行
            data.forEach(item => {
                const newRow = templateRow.cloneNode(true);
                const cells = newRow.getElementsByTagName('w:tc');

                if (cells.length >= 7) {
                    // 按照模板列顺序填充：序号, 文件材料题名, 原字编号, 编制单位, 编制日期, 页次, 备注
                    this.setCellText(cells[0], item.serial.toString());
                    this.setCellText(cells[1], item.title);           // 文件材料题名
                    this.setCellText(cells[2], item.fileNumber);      // 原字编号
                    this.setCellText(cells[3], item.responsible);     // 编制单位
                    this.setCellText(cells[4], item.date);            // 编制日期
                    this.setCellText(cells[5], item.pages);           // 页次
                    this.setCellText(cells[6], item.remark);          // 备注
                }

                table.appendChild(newRow);
            });

            // 序列化XML
            const serializer = new XMLSerializer();
            const modifiedXml = serializer.serializeToString(xmlDoc);

            // 更新zip中的document.xml
            zip.file('word/document.xml', modifiedXml);

            // 生成新的docx文件
            const blob = await zip.generateAsync({type: 'blob'});
            saveAs(blob, `卷内目录_${this.dataManager.getTodayDate()}.docx`);

            showToast('卷内目录已导出', 'success');
        } catch (error) {
            console.error('导出卷内目录失败:', error);
            showToast('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 导出卷内备考表
     */
    async exportRecord() {
        try {
            showToast('正在生成卷内备考表...', 'success');

            const templatePath = this.templates.record;
            const data = this.dataManager.recordData;

            // 加载模板
            const templateBlob = await this.loadTemplate(templatePath);
            const zip = await JSZip.loadAsync(templateBlob);

            // 读取document.xml
            const docXml = await zip.file('word/document.xml').async('string');

            // 替换占位符
            let modifiedXml = docXml;
            const replacements = {
                '{{totalPages}}': data.totalPages || '0',
                '{{textPages}}': data.textPages || '0',
                '{{drawingPages}}': data.drawingPages || '0',
                '{{photoCount}}': data.photoCount || '0',
                '{{note}}': data.note || '',
                '{{creator}}': data.creator || '',
                '{{createDate}}': data.createDate || '',
                '{{reviewer}}': data.reviewer || '',
                '{{reviewDate}}': data.reviewDate || ''
            };

            // 执行替换
            Object.keys(replacements).forEach(placeholder => {
                const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
                modifiedXml = modifiedXml.replace(regex, this.escapeXml(replacements[placeholder]));
            });

            // 更新zip中的document.xml
            zip.file('word/document.xml', modifiedXml);

            // 生成新的docx文件
            const blob = await zip.generateAsync({type: 'blob'});
            saveAs(blob, `卷内备考表_${this.dataManager.getTodayDate()}.docx`);

            showToast('卷内备考表已导出', 'success');
        } catch (error) {
            console.error('导出卷内备考表失败:', error);
            showToast('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 导出案卷封面
     */
    async exportCover() {
        try {
            showToast('正在生成案卷封面...', 'success');

            const templatePath = this.templates.cover;
            const data = this.dataManager.coverData;

            // 加载模板
            const templateBlob = await this.loadTemplate(templatePath);
            const zip = await JSZip.loadAsync(templateBlob);

            // 读取document.xml
            const docXml = await zip.file('word/document.xml').async('string');

            // 替换占位符
            let modifiedXml = docXml;
            const replacements = {
                '{{archiveNo}}': data.archiveNo || '',
                '{{title}}': data.title || '',
                '{{unit}}': data.unit || '',
                '{{startDate}}': data.startDate || '',
                '{{endDate}}': data.endDate || '',
                '{{secretLevel}}': data.secretLevel || '',
                '{{retentionPeriod}}': data.retentionPeriod || '永久',
                '{{totalVolumes}}': data.totalVolumes || '1',
                '{{volumeNumber}}': data.volumeNumber || '1'
            };

            // 执行替换
            Object.keys(replacements).forEach(placeholder => {
                const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
                modifiedXml = modifiedXml.replace(regex, this.escapeXml(replacements[placeholder]));
            });

            // 更新zip中的document.xml
            zip.file('word/document.xml', modifiedXml);

            // 生成新的docx文件
            const blob = await zip.generateAsync({type: 'blob'});
            saveAs(blob, `案卷封面_${this.dataManager.getTodayDate()}.docx`);

            showToast('案卷封面已导出', 'success');
        } catch (error) {
            console.error('导出案卷封面失败:', error);
            showToast('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 导出案卷目录（档案移交目录 - 表一）
     */
    async exportCatalog() {
        try {
            showToast('正在生成档案移交目录...', 'success');

            const templatePath = this.templates.catalog;
            const data = this.dataManager.catalogData;

            // 加载模板
            const templateBlob = await this.loadTemplate(templatePath);
            const zip = await JSZip.loadAsync(templateBlob);

            // 读取document.xml
            const docXml = await zip.file('word/document.xml').async('string');
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(docXml, 'text/xml');

            // 找到表格
            const table = xmlDoc.getElementsByTagName('w:tbl')[0];
            if (!table) {
                throw new Error('模板中未找到表格');
            }

            // 获取所有行
            const rows = table.getElementsByTagName('w:tr');
            if (rows.length < 3) {
                throw new Error('模板表格格式不正确');
            }

            // 保留前2行（标题和表头），使用第3行作为模板
            const templateRow = rows[2].cloneNode(true);

            // 删除第3行及以后的所有行
            while (rows.length > 2) {
                table.removeChild(rows[2]);
            }

            // 添加数据行
            data.forEach(item => {
                const newRow = templateRow.cloneNode(true);
                const cells = newRow.getElementsByTagName('w:tc');

                if (cells.length >= 8) {
                    // 按照模板列顺序填充：案卷号, 案卷题名, 文字(页), 图纸(张), 其他, 编制单位, 编制日期, 保管期限
                    this.setCellText(cells[0], item.volumeNo.toString());
                    this.setCellText(cells[1], item.title);
                    this.setCellText(cells[2], item.textPages.toString());
                    this.setCellText(cells[3], item.drawingPages.toString());
                    this.setCellText(cells[4], item.other || '');
                    this.setCellText(cells[5], item.unit);
                    this.setCellText(cells[6], item.createDate);
                    this.setCellText(cells[7], item.retentionPeriod);
                }

                table.appendChild(newRow);
            });

            // 序列化XML
            const serializer = new XMLSerializer();
            const modifiedXml = serializer.serializeToString(xmlDoc);

            // 更新zip中的document.xml
            zip.file('word/document.xml', modifiedXml);

            // 生成新的docx文件
            const blob = await zip.generateAsync({type: 'blob'});
            saveAs(blob, `档案移交目录_${this.dataManager.getTodayDate()}.docx`);

            showToast('档案移交目录已导出', 'success');
        } catch (error) {
            console.error('导出档案移交目录失败:', error);
            showToast('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 导出档案移交书
     */
    async exportTransfer() {
        try {
            showToast('正在生成档案移交书...', 'success');

            const templatePath = this.templates.transfer;

            // 优先使用volumeManager，如果不存在则使用dataManager（向后兼容）
            let replacements = {};

            if (typeof volumeManager !== 'undefined' && volumeManager) {
                // 使用多卷管理系统的数据
                const projectInfo = volumeManager.projectInfo;
                const transferData = volumeManager.transferData;
                const stats = volumeManager.generateTransferStats();

                replacements = {
                    // 基本信息
                    '{{title}}': projectInfo.name || '',
                    '{{unit}}': projectInfo.unit || '',
                    '{{date}}': this.dataManager.getTodayDate(),
                    '{{archiveNo}}': projectInfo.id || '',
                    '{{secretLevel}}': projectInfo.secretLevel || '',
                    '{{retentionPeriod}}': projectInfo.retentionPeriod || '永久',

                    // 统计数据（自动计算）
                    '{{totalVolumes}}': stats.totalVolumes.toString(),
                    '{{totalFiles}}': stats.totalFiles.toString(),
                    '{{totalPages}}': stats.totalPages.toString(),
                    '{{textPages}}': stats.textPages.toString(),
                    '{{drawingPages}}': stats.drawingPages.toString(),
                    '{{photoCount}}': stats.photoCount.toString(),
                    '{{textVolumes}}': stats.textVolumes.toString(),
                    '{{drawingVolumes}}': stats.drawingVolumes.toString(),
                    '{{otherVolumes}}': stats.otherVolumes.toString(),

                    // 移交信息（用户填写）
                    '{{note}}': transferData.note || '本工程档案资料已按GB 50328-2014标准整理完毕，现移交存档。',
                    '{{transferPerson}}': transferData.transferPerson || '',
                    '{{transferDate}}': transferData.transferDate || '',
                    '{{receivePerson}}': transferData.receivePerson || '',
                    '{{receiveDate}}': transferData.receiveDate || ''
                };
            } else {
                // 向后兼容：使用旧的dataManager数据
                const coverData = this.dataManager.coverData;
                const recordData = this.dataManager.recordData;

                replacements = {
                    '{{title}}': coverData.title || '',
                    '{{unit}}': coverData.unit || '',
                    '{{date}}': this.dataManager.getTodayDate(),
                    '{{totalVolumes}}': coverData.totalVolumes || '1',
                    '{{totalFiles}}': this.dataManager.directoryData.length.toString(),
                    '{{totalPages}}': recordData.totalPages || '0',
                    '{{textPages}}': recordData.textPages || '0',
                    '{{drawingPages}}': recordData.drawingPages || '0',
                    '{{photoCount}}': recordData.photoCount || '0',
                    '{{textVolumes}}': '1',
                    '{{drawingVolumes}}': '0',
                    '{{otherVolumes}}': '0',
                    '{{note}}': recordData.note || '本工程档案资料已按GB 50328-2014标准整理完毕，现移交存档。',
                    '{{archiveNo}}': coverData.archiveNo || '',
                    '{{retentionPeriod}}': coverData.retentionPeriod || '永久',
                    '{{transferPerson}}': '',
                    '{{transferDate}}': '',
                    '{{receivePerson}}': '',
                    '{{receiveDate}}': ''
                };
            }

            // 加载模板
            const templateBlob = await this.loadTemplate(templatePath);
            const zip = await JSZip.loadAsync(templateBlob);

            // 读取document.xml
            const docXml = await zip.file('word/document.xml').async('string');

            // 替换占位符
            let modifiedXml = docXml;
            Object.keys(replacements).forEach(placeholder => {
                const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
                modifiedXml = modifiedXml.replace(regex, this.escapeXml(replacements[placeholder]));
            });

            // 更新zip中的document.xml
            zip.file('word/document.xml', modifiedXml);

            // 生成新的docx文件
            const blob = await zip.generateAsync({type: 'blob'});
            saveAs(blob, `档案移交书_${this.dataManager.getTodayDate()}.docx`);

            showToast('档案移交书已导出', 'success');
        } catch (error) {
            console.error('导出档案移交书失败:', error);
            showToast('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 导出所有文档
     */
    async exportAll() {
        showToast('正在生成所有Word文档，请稍候...', 'success');

        try {
            await this.exportDirectory();
            await this.delay(800);

            await this.exportRecord();
            await this.delay(800);

            await this.exportCover();
            await this.delay(800);

            await this.exportCatalog();
            await this.delay(800);

            await this.exportTransfer();

            showToast('所有Word文档已导出完成', 'success');
        } catch (error) {
            console.error('导出失败:', error);
            showToast('部分文档导出失败', 'error');
        }
    }

    // ========== 辅助方法 ==========

    /**
     * 加载模板文件
     */
    async loadTemplate(templatePath) {
        try {
            const response = await fetch(templatePath);
            if (!response.ok) {
                throw new Error(`无法加载模板: ${templatePath}`);
            }
            return await response.blob();
        } catch (error) {
            console.error('加载模板失败:', error);
            throw new Error('请确保通过HTTP服务器运行此应用（不能使用file://协议）');
        }
    }

    /**
     * 设置单元格文本
     */
    setCellText(cell, text) {
        const textElements = cell.getElementsByTagName('w:t');
        if (textElements.length > 0) {
            textElements[0].textContent = text || '';
        } else {
            // 如果没有文本元素，创建一个简单的结构
            const para = cell.getElementsByTagName('w:p')[0];
            if (para) {
                const run = para.getElementsByTagName('w:r')[0];
                if (run) {
                    const t = xmlDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:t');
                    t.textContent = text || '';
                    run.appendChild(t);
                }
            }
        }
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== 简化格式导出（备用方案） ==========

    async exportRecordSimple() {
        const data = this.dataManager.recordData;
        const html = this.generateRecordHTML(data);
        this.downloadAsWord(html, `卷内备考表_${this.dataManager.getTodayDate()}.doc`);
    }

    async exportCoverSimple() {
        const data = this.dataManager.coverData;
        const html = this.generateCoverHTML(data);
        this.downloadAsWord(html, `案卷封面_${this.dataManager.getTodayDate()}.doc`);
    }

    async exportCatalogSimple() {
        const data = this.dataManager.catalogData;
        const html = this.generateCatalogHTML(data);
        this.downloadAsWord(html, `案卷目录_${this.dataManager.getTodayDate()}.doc`);
    }

    async exportTransferSimple() {
        const data = this.dataManager.coverData;
        const recordData = this.dataManager.recordData;
        const html = this.generateTransferHTML(data, recordData);
        this.downloadAsWord(html, `档案移交书_${this.dataManager.getTodayDate()}.doc`);
    }

    generateRecordHTML(data) {
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>卷内备考表</title>
<style>body{font-family:SimSun,"宋体";font-size:12pt;}
h1{text-align:center;font-size:16pt;font-weight:bold;margin:20px 0;}
table{width:100%;border-collapse:collapse;margin:20px 0;}
th,td{border:1px solid black;padding:8px;}
th{background-color:#f0f0f0;font-weight:bold;width:30%;}
td{width:70%;}</style></head><body>
<h1>卷内备考表</h1><table>
<tr><th>本案卷共有文件材料</th><td>${data.totalPages || 0} 页</td></tr>
<tr><th>其中：文字材料</th><td>${data.textPages || 0} 页</td></tr>
<tr><th>图样材料</th><td>${data.drawingPages || 0} 页</td></tr>
<tr><th>照片</th><td>${data.photoCount || 0} 张</td></tr>
<tr><th>说明</th><td>${this.escapeHtml(data.note || '')}</td></tr>
<tr><th>立卷人</th><td>${this.escapeHtml(data.creator || '')}　　日期：${this.escapeHtml(data.createDate || '')}</td></tr>
<tr><th>审核人</th><td>${this.escapeHtml(data.reviewer || '')}　　日期：${this.escapeHtml(data.reviewDate || '')}</td></tr>
</table></body></html>`;
    }

    generateCoverHTML(data) {
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>案卷封面</title>
<style>body{font-family:SimSun,"宋体";font-size:14pt;padding:40px;}
h1{text-align:center;font-size:18pt;font-weight:bold;margin:30px 0;}
.info-row{margin:25px 0;line-height:2;}
.label{font-weight:bold;display:inline-block;width:150px;}
.value{display:inline-block;}</style></head><body>
<h1>案卷封面</h1>
<div class="info-row"><span class="label">档号：</span><span class="value">${this.escapeHtml(data.archiveNo || '')}</span></div>
<div class="info-row"><span class="label">案卷题名：</span><span class="value">${this.escapeHtml(data.title || '')}</span></div>
<div class="info-row"><span class="label">编制单位：</span><span class="value">${this.escapeHtml(data.unit || '')}</span></div>
<div class="info-row"><span class="label">起止日期：</span><span class="value">${this.escapeHtml(data.startDate || '')} 至 ${this.escapeHtml(data.endDate || '')}</span></div>
<div class="info-row"><span class="label">密级：</span><span class="value">${this.escapeHtml(data.secretLevel || '无')}</span></div>
<div class="info-row"><span class="label">保管期限：</span><span class="value">${this.escapeHtml(data.retentionPeriod || '永久')}</span></div>
<div class="info-row"><span class="label">本工程共：</span><span class="value">${data.totalVolumes || 1} 卷</span></div>
<div class="info-row"><span class="label">本案卷为第：</span><span class="value">${data.volumeNumber || 1} 卷</span></div>
</body></html>`;
    }

    generateCatalogHTML(data) {
        let rows = '';
        data.forEach(entry => {
            rows += `<tr>
<td>${entry.volumeNo}</td><td>${this.escapeHtml(entry.title)}</td>
<td>${entry.textPages}</td><td>${entry.drawingPages}</td>
<td>${this.escapeHtml(entry.other || '')}</td><td>${this.escapeHtml(entry.unit)}</td>
<td>${this.escapeHtml(entry.createDate)}</td><td>${this.escapeHtml(entry.retentionPeriod)}</td>
</tr>`;
        });

        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>案卷目录</title>
<style>body{font-family:SimSun,"宋体";font-size:12pt;}
h1{text-align:center;font-size:16pt;font-weight:bold;margin:20px 0;}
table{width:100%;border-collapse:collapse;margin:20px 0;}
th,td{border:1px solid black;padding:5px;text-align:center;}
th{background-color:#f0f0f0;font-weight:bold;}</style></head><body>
<h1>案卷目录</h1><table>
<thead><tr>
<th style="width:10%;">案卷号</th><th style="width:25%;">案卷题名</th>
<th style="width:10%;">文字(页)</th><th style="width:10%;">图纸(张)</th>
<th style="width:10%;">其他</th><th style="width:15%;">编制单位</th>
<th style="width:10%;">编制日期</th><th style="width:10%;">保管期限</th>
</tr></thead><tbody>${rows}</tbody>
</table></body></html>`;
    }

    generateTransferHTML(data, recordData) {
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>档案移交书</title>
<style>body{font-family:SimSun,"宋体";font-size:14pt;padding:40px;}
h1{text-align:center;font-size:18pt;font-weight:bold;margin:30px 0;}
.info-row{margin:20px 0;line-height:2;}
.signature{margin-top:40px;line-height:2.5;}</style></head><body>
<h1>档案移交书</h1>
<div class="info-row"><strong>工程名称：</strong>${this.escapeHtml(data.title || '')}</div>
<div class="info-row"><strong>移交单位：</strong>${this.escapeHtml(data.unit || '')}</div>
<div class="info-row"><strong>移交日期：</strong>${this.dataManager.getTodayDate()}</div>
<div class="info-row"><strong>案卷数量：</strong>${data.totalVolumes || 1} 卷</div>
<div class="info-row"><strong>文件总页数：</strong>${recordData.totalPages || 0} 页</div>
<div class="info-row"><strong>移交说明：</strong></div>
<div class="info-row" style="margin-left:40px;">${this.escapeHtml(recordData.note || '本工程档案资料已按GB 50328-2014标准整理完毕，现移交存档。')}</div>
<div class="signature">移交人签字：_______________　　日期：_______________</div>
<div class="signature">接收人签字：_______________　　日期：_______________</div>
</body></html>`;
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 转义XML特殊字符
     */
    escapeXml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    downloadAsWord(html, filename) {
        const fullHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'>
<meta name=ProgId content=Word.Document>
<meta name=Generator content="Microsoft Word">
<meta name=Originator content="Microsoft Word"></head>
${html}
</html>`;

        const blob = new Blob(['\ufeff', fullHtml], {type: 'application/msword'});
        saveAs(blob, filename);
    }
}

// 创建全局导出器实例
const wordExporter = new WordExporter(dataManager);
