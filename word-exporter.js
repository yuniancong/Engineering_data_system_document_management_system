/**
 * Word文档导出器 - 基于真实模板
 * 使用JSZip和XML DOM操作来填充模板数据
 * 模板数据以base64格式内嵌，无需HTTP服务器
 */

class WordExporter {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.debugLog = []; // Debug日志
    }

    /**
     * 记录debug信息
     */
    log(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            time: timestamp,
            message: message,
            data: data
        };
        this.debugLog.push(logEntry);
        console.log(`[${timestamp}] ${message}`, data || '');
    }

    /**
     * 获取debug日志
     */
    getDebugLog() {
        return this.debugLog;
    }

    /**
     * 清空debug日志
     */
    clearDebugLog() {
        this.debugLog = [];
    }

    /**
     * 导出卷内目录
     */
    async exportDirectory() {
        try {
            this.log('开始导出卷内目录');
            showToast('正在生成卷内目录...', 'success');

            const data = this.dataManager.directoryData;
            this.log('数据行数', data.length);

            // 从内嵌的base64数据加载模板
            this.log('加载模板数据');
            const templateBlob = await this.loadTemplateFromBase64('directory');
            this.log('模板加载成功', `大小: ${templateBlob.size} bytes`);

            const zip = await JSZip.loadAsync(templateBlob);
            this.log('解析ZIP成功');

            // 读取document.xml
            const docXml = await zip.file('word/document.xml').async('string');
            this.log('读取document.xml成功', `长度: ${docXml.length}`);

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(docXml, 'text/xml');

            // 检查解析错误
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('XML解析失败: ' + parseError.textContent);
            }
            this.log('XML解析成功');

            // 找到表格
            const table = xmlDoc.getElementsByTagName('w:tbl')[0];
            if (!table) {
                throw new Error('模板中未找到表格');
            }
            this.log('找到表格');

            // 获取所有行
            const rows = table.getElementsByTagName('w:tr');
            this.log('表格行数', rows.length);

            if (rows.length < 4) {
                throw new Error('模板表格格式不正确，行数不足');
            }

            // 保留前3行（标题和表头），使用第4行作为模板
            const templateRow = rows[3].cloneNode(true);
            this.log('克隆模板行成功');

            // 删除第4行及以后的所有行
            let deletedCount = 0;
            while (rows.length > 3) {
                table.removeChild(rows[3]);
                deletedCount++;
            }
            this.log('删除原有数据行', deletedCount);

            // 添加数据行
            data.forEach((item, index) => {
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

                    this.log(`添加数据行 ${index + 1}`, {
                        serial: item.serial,
                        title: item.title,
                        fileNumber: item.fileNumber
                    });
                } else {
                    this.log(`警告：行 ${index + 1} 单元格数量不足`, cells.length);
                }

                table.appendChild(newRow);
            });
            this.log('所有数据行已添加');

            // 序列化XML
            const serializer = new XMLSerializer();
            const modifiedXml = serializer.serializeToString(xmlDoc);
            this.log('XML序列化成功', `长度: ${modifiedXml.length}`);

            // 更新zip中的document.xml
            zip.file('word/document.xml', modifiedXml);
            this.log('更新document.xml完成');

            // 生成新的docx文件
            const blob = await zip.generateAsync({type: 'blob'});
            this.log('生成DOCX文件成功', `大小: ${blob.size} bytes`);

            const filename = `卷内目录_${this.dataManager.getTodayDate()}.docx`;
            saveAs(blob, filename);
            this.log('文件保存成功', filename);

            showToast('卷内目录已导出', 'success');
        } catch (error) {
            this.log('导出失败', error.message);
            console.error('导出卷内目录失败:', error);
            showToast('导出失败: ' + error.message, 'error');
        }
    }

    /**
     * 导出卷内备考表
     */
    async exportRecord() {
        showToast('备考表模板暂未完成，使用简化格式导出', 'warning');
        await this.exportRecordSimple();
    }

    /**
     * 导出案卷封面
     */
    async exportCover() {
        showToast('封面模板暂未完成，使用简化格式导出', 'warning');
        await this.exportCoverSimple();
    }

    /**
     * 导出案卷目录
     */
    async exportCatalog() {
        showToast('案卷目录模板暂未完成，使用简化格式导出', 'warning');
        await this.exportCatalogSimple();
    }

    /**
     * 导出档案移交书
     */
    async exportTransfer() {
        showToast('移交书模板暂未完成，使用简化格式导出', 'warning');
        await this.exportTransferSimple();
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
            this.log('批量导出失败', error.message);
            console.error('导出失败:', error);
            showToast('部分文档导出失败', 'error');
        }
    }

    // ========== 辅助方法 ==========

    /**
     * 从Base64数据加载模板
     */
    async loadTemplateFromBase64(templateName) {
        try {
            this.log(`加载模板: ${templateName}`);

            // 检查模板数据是否存在
            if (typeof WORD_TEMPLATES === 'undefined') {
                throw new Error('模板数据未加载，请确保word-templates-data.js已正确引入');
            }

            const base64Data = WORD_TEMPLATES[templateName];
            if (!base64Data) {
                throw new Error(`模板 ${templateName} 不存在`);
            }

            this.log('Base64数据长度', base64Data.length);

            // 将base64转换为Blob
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const blob = new Blob([bytes], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });

            this.log('Blob创建成功', `大小: ${blob.size}`);
            return blob;
        } catch (error) {
            this.log('加载模板失败', error.message);
            throw new Error(`加载模板失败: ${error.message}`);
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
            // 如果没有文本元素，尝试创建
            const para = cell.getElementsByTagName('w:p')[0];
            if (para) {
                const run = para.getElementsByTagName('w:r')[0];
                if (run) {
                    const t = document.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:t');
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
        this.log('HTML格式文档已保存', filename);
    }
}

// 创建全局导出器实例
const wordExporter = new WordExporter(dataManager);
