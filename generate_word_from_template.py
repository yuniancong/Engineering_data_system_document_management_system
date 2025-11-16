#!/usr/bin/env python3
"""
使用真实模板生成Word文档的Python脚本
这个脚本可以作为参考，将逻辑转换为JavaScript
"""

from zipfile import ZipFile
import xml.etree.ElementTree as ET
import json
import sys
from io import BytesIO

def generate_directory_doc(template_path, data, output_path):
    """
    使用模板生成卷内目录Word文档

    参数:
        template_path: 模板文件路径
        data: 数据列表，每项包含 serial, title, fileNumber, responsible, date, pages, remark
        output_path: 输出文件路径
    """

    # 命名空间
    namespaces = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    }

    # 注册命名空间
    for prefix, uri in namespaces.items():
        ET.register_namespace(prefix, uri)

    # 读取模板
    with ZipFile(template_path, 'r') as template_zip:
        # 读取document.xml
        xml_content = template_zip.read('word/document.xml')
        root = ET.fromstring(xml_content)

        # 找到表格
        table = root.find('.//w:tbl', namespaces)
        if table is None:
            raise ValueError("模板中没有找到表格")

        # 找到所有行
        rows = table.findall('.//w:tr', namespaces)
        if len(rows) < 4:
            raise ValueError("模板表格行数不足")

        # 获取第4行作为数据行模板（第1行是标题，第2行是空行，第3行是表头）
        if len(rows) > 3:
            template_row = rows[3]
        else:
            # 如果没有第4行，使用第3行（表头行）作为模板
            template_row = rows[2]

        # 删除所有数据行（保留标题行、空行和表头行）
        for row in rows[3:]:
            table.remove(row)

        # 添加新数据行
        for item in data:
            new_row = ET.fromstring(ET.tostring(template_row))
            cells = new_row.findall('.//w:tc', namespaces)

            if len(cells) >= 7:
                # 填充数据 - 注意模板中的列顺序
                # 序号, 文件材料题名, 原字编号, 编制单位, 编制日期, 页次, 备注
                set_cell_text(cells[0], str(item.get('serial', '')), namespaces)
                set_cell_text(cells[1], item.get('title', ''), namespaces)
                set_cell_text(cells[2], item.get('fileNumber', ''), namespaces)
                set_cell_text(cells[3], item.get('responsible', ''), namespaces)
                set_cell_text(cells[4], item.get('date', ''), namespaces)
                set_cell_text(cells[5], item.get('pages', ''), namespaces)
                set_cell_text(cells[6], item.get('remark', ''), namespaces)

            table.append(new_row)

        # 将修改后的XML写回
        modified_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)

        # 创建新的docx文件
        with ZipFile(output_path, 'w') as output_zip:
            # 复制所有文件
            for item in template_zip.namelist():
                if item != 'word/document.xml':
                    output_zip.writestr(item, template_zip.read(item))

            # 写入修改后的document.xml
            output_zip.writestr('word/document.xml', modified_xml)

def set_cell_text(cell, text, namespaces):
    """设置单元格文本"""
    # 找到或创建段落
    para = cell.find('.//w:p', namespaces)
    if para is None:
        para = ET.SubElement(cell, '{%s}p' % namespaces['w'])

    # 找到或创建run
    run = para.find('.//w:r', namespaces)
    if run is None:
        run = ET.SubElement(para, '{%s}r' % namespaces['w'])

    # 找到或创建文本元素
    text_elem = run.find('.//w:t', namespaces)
    if text_elem is None:
        text_elem = ET.SubElement(run, '{%s}t' % namespaces['w'])

    text_elem.text = text

if __name__ == '__main__':
    # 示例数据
    sample_data = [
        {
            'serial': 1,
            'title': '施工组织设计',
            'fileNumber': 'SG-001',
            'responsible': '某建设单位',
            'date': '2024-01-15',
            'pages': '1-20',
            'remark': ''
        },
        {
            'serial': 2,
            'title': '开工报告',
            'fileNumber': 'SG-002',
            'responsible': '某监理单位',
            'date': '2024-01-16',
            'pages': '21-25',
            'remark': ''
        }
    ]

    template_path = 'templates/表三、卷内目录.docx'
    output_path = 'output_test.docx'

    try:
        generate_directory_doc(template_path, sample_data, output_path)
        print(f"成功生成文档: {output_path}")
    except Exception as e:
        print(f"错误: {e}", file=sys.stderr)
        sys.exit(1)
