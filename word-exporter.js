/**
 * Word文档导出器
 * 使用docx.js库生成符合GB 50328-2014标准的Word文档
 */

class WordExporter {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.docx = window.docx;
    }

    /**
     * 导出卷内目录
     */
    async exportDirectory() {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType, BorderStyle } = this.docx;

        // 创建表格行
        const tableRows = [
            // 表头
            new TableRow({
                children: [
                    this.createTableCell('序号', { bold: true, width: 8 }),
                    this.createTableCell('文件编号', { bold: true, width: 15 }),
                    this.createTableCell('责任者', { bold: true, width: 15 }),
                    this.createTableCell('文件题名', { bold: true, width: 30 }),
                    this.createTableCell('日期', { bold: true, width: 12 }),
                    this.createTableCell('页次', { bold: true, width: 10 }),
                    this.createTableCell('备注', { bold: true, width: 10 })
                ]
            }),
            // 数据行
            ...this.dataManager.directoryData.map(row =>
                new TableRow({
                    children: [
                        this.createTableCell(row.serial.toString(), { width: 8 }),
                        this.createTableCell(row.fileNumber, { width: 15 }),
                        this.createTableCell(row.responsible, { width: 15 }),
                        this.createTableCell(row.title, { width: 30 }),
                        this.createTableCell(row.date, { width: 12 }),
                        this.createTableCell(row.pages, { width: 10 }),
                        this.createTableCell(row.remark, { width: 10 })
                    ]
                })
            )
        ];

        // 创建表格
        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
        });

        // 创建文档
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: '卷内目录',
                        heading: 'Heading1',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),
                    table,
                    new Paragraph({
                        text: `\n制表日期：${this.dataManager.getTodayDate()}`,
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 200 }
                    })
                ]
            }]
        });

        await this.saveDocument(doc, `卷内目录_${this.dataManager.getTodayDate()}.docx`);
    }

    /**
     * 导出卷内备考表
     */
    async exportRecord() {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType } = this.docx;

        const data = this.dataManager.recordData;

        const tableRows = [
            this.createInfoRow('本案卷共有文件材料', `${data.totalPages || 0} 页`),
            this.createInfoRow('其中：文字材料', `${data.textPages || 0} 页`),
            this.createInfoRow('图样材料', `${data.drawingPages || 0} 页`),
            this.createInfoRow('照片', `${data.photoCount || 0} 张`),
            this.createInfoRow('说明', data.note || ''),
            this.createInfoRow('立卷人', `${data.creator || ''}    日期：${data.createDate || ''}`),
            this.createInfoRow('审核人', `${data.reviewer || ''}    日期：${data.reviewDate || ''}`)
        ];

        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: '卷内备考表',
                        heading: 'Heading1',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),
                    table
                ]
            }]
        });

        await this.saveDocument(doc, `卷内备考表_${this.dataManager.getTodayDate()}.docx`);
    }

    /**
     * 导出案卷封面
     */
    async exportCover() {
        const { Document, Packer, Paragraph, TextRun, AlignmentType } = this.docx;

        const data = this.dataManager.coverData;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: '案卷封面',
                        heading: 'Heading1',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    this.createInfoParagraph('档号', data.archiveNo || ''),
                    this.createInfoParagraph('案卷题名', data.title || ''),
                    this.createInfoParagraph('编制单位', data.unit || ''),
                    this.createInfoParagraph('起止日期', `${data.startDate || ''} 至 ${data.endDate || ''}`),
                    this.createInfoParagraph('密级', data.secretLevel || '无'),
                    this.createInfoParagraph('保管期限', data.retentionPeriod || '永久'),
                    this.createInfoParagraph('本工程共', `${data.totalVolumes || 1} 卷`),
                    this.createInfoParagraph('本案卷为第', `${data.volumeNumber || 1} 卷`)
                ]
            }]
        });

        await this.saveDocument(doc, `案卷封面_${this.dataManager.getTodayDate()}.docx`);
    }

    /**
     * 导出案卷目录
     */
    async exportCatalog() {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } = this.docx;

        const tableRows = [
            // 表头
            new TableRow({
                children: [
                    this.createTableCell('案卷号', { bold: true, width: 10 }),
                    this.createTableCell('案卷题名', { bold: true, width: 25 }),
                    this.createTableCell('文字(页)', { bold: true, width: 10 }),
                    this.createTableCell('图纸(张)', { bold: true, width: 10 }),
                    this.createTableCell('其他', { bold: true, width: 10 }),
                    this.createTableCell('编制单位', { bold: true, width: 15 }),
                    this.createTableCell('编制日期', { bold: true, width: 10 }),
                    this.createTableCell('保管期限', { bold: true, width: 10 })
                ]
            }),
            // 数据行
            ...this.dataManager.catalogData.map(entry =>
                new TableRow({
                    children: [
                        this.createTableCell(entry.volumeNo.toString(), { width: 10 }),
                        this.createTableCell(entry.title, { width: 25 }),
                        this.createTableCell(entry.textPages.toString(), { width: 10 }),
                        this.createTableCell(entry.drawingPages.toString(), { width: 10 }),
                        this.createTableCell(entry.other || '', { width: 10 }),
                        this.createTableCell(entry.unit, { width: 15 }),
                        this.createTableCell(entry.createDate, { width: 10 }),
                        this.createTableCell(entry.retentionPeriod, { width: 10 })
                    ]
                })
            )
        ];

        const table = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: '案卷目录',
                        heading: 'Heading1',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 300 }
                    }),
                    table
                ]
            }]
        });

        await this.saveDocument(doc, `案卷目录_${this.dataManager.getTodayDate()}.docx`);
    }

    /**
     * 导出档案移交书
     */
    async exportTransfer() {
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, AlignmentType } = this.docx;

        const data = this.dataManager.coverData;
        const recordData = this.dataManager.recordData;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: '档案移交书',
                        heading: 'Heading1',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        text: `工程名称：${data.title || ''}`,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: `移交单位：${data.unit || ''}`,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: `移交日期：${this.dataManager.getTodayDate()}`,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: `案卷数量：${data.totalVolumes || 1} 卷`,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: `文件总页数：${recordData.totalPages || 0} 页`,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: '移交说明：',
                        spacing: { after: 100 }
                    }),
                    new Paragraph({
                        text: recordData.note || '本工程档案资料已按GB 50328-2014标准整理完毕，现移交存档。',
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        text: '移交人签字：_______________    日期：_______________',
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: '接收人签字：_______________    日期：_______________',
                        spacing: { after: 200 }
                    })
                ]
            }]
        });

        await this.saveDocument(doc, `档案移交书_${this.dataManager.getTodayDate()}.docx`);
    }

    /**
     * 导出所有文档（打包为zip）
     */
    async exportAll() {
        showToast('正在生成所有Word文档，请稍候...', 'success');

        // 依次导出所有文档
        await this.exportDirectory();
        await new Promise(resolve => setTimeout(resolve, 500));

        await this.exportRecord();
        await new Promise(resolve => setTimeout(resolve, 500));

        await this.exportCover();
        await new Promise(resolve => setTimeout(resolve, 500));

        await this.exportCatalog();
        await new Promise(resolve => setTimeout(resolve, 500));

        await this.exportTransfer();

        showToast('所有Word文档已导出完成', 'success');
    }

    // ========== 辅助方法 ==========

    /**
     * 创建表格单元格
     */
    createTableCell(text, options = {}) {
        const { TableCell, Paragraph, TextRun, WidthType, AlignmentType, BorderStyle } = this.docx;

        return new TableCell({
            width: { size: options.width || 10, type: WidthType.PERCENTAGE },
            children: [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: text,
                            bold: options.bold || false,
                            size: 22,
                            font: 'SimSun'
                        })
                    ]
                })
            ]
        });
    }

    /**
     * 创建信息行（用于备考表）
     */
    createInfoRow(label, value) {
        const { TableRow } = this.docx;

        return new TableRow({
            children: [
                this.createTableCell(label, { bold: true, width: 30 }),
                this.createTableCell(value, { width: 70 })
            ]
        });
    }

    /**
     * 创建信息段落（用于封面）
     */
    createInfoParagraph(label, value) {
        const { Paragraph, TextRun } = this.docx;

        return new Paragraph({
            spacing: { after: 200 },
            children: [
                new TextRun({
                    text: `${label}：`,
                    bold: true,
                    size: 28,
                    font: 'SimSun'
                }),
                new TextRun({
                    text: value,
                    size: 28,
                    font: 'SimSun'
                })
            ]
        });
    }

    /**
     * 保存文档
     */
    async saveDocument(doc, filename) {
        const { Packer } = this.docx;

        try {
            const blob = await Packer.toBlob(doc);
            saveAs(blob, filename);
            console.log(`Word文档已导出: ${filename}`);
        } catch (error) {
            console.error('导出Word文档失败:', error);
            showToast('导出Word文档失败', 'error');
            throw error;
        }
    }
}

// 创建全局导出器实例
const wordExporter = new WordExporter(dataManager);
