# -*- coding: utf-8 -*-
"""
学生校内双证管理系统 - 路演 PPT 生成脚本
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
import os

# 配色方案
PRIMARY = RGBColor(0x16, 0x77, 0xFF)     # 主题蓝
DARK = RGBColor(0x00, 0x1C, 0x40)        # 深色
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT_BG = RGBColor(0xF0, 0xF5, 0xFF)    # 浅蓝背景
ACCENT_GREEN = RGBColor(0x52, 0xC4, 0x1A)
ACCENT_ORANGE = RGBColor(0xFA, 0x8C, 0x16)
ACCENT_RED = RGBColor(0xFF, 0x4D, 0x4F)
GRAY = RGBColor(0x8C, 0x8C, 0x8C)
DARK_TEXT = RGBColor(0x26, 0x26, 0x26)
CARD_BG = RGBColor(0xE6, 0xF7, 0xFF)

prs = Presentation()
prs.slide_width = Inches(13.333)   # 16:9 widescreen
prs.slide_height = Inches(7.5)

# ============================================================
# Helper functions
# ============================================================
def add_bg(slide, color=DARK):
    """添加幻灯片纯色背景"""
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_rect(slide, left, top, width, height, color=None, transparency=0):
    """添加矩形色块"""
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.line.fill.background()
    if color:
        shape.fill.solid()
        shape.fill.fore_color.rgb = color
    return shape

def add_text_box(slide, left, top, width, height, text, font_size=18, color=DARK_TEXT,
                 bold=False, alignment=PP_ALIGN.LEFT, font_name='Microsoft YaHei'):
    """添加文本框"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = text
    p.font.size = Pt(font_size)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font_name
    p.alignment = alignment
    return txBox

def add_multi_text(slide, left, top, width, height, lines, font_size=16, color=DARK_TEXT,
                   bold_first=False, line_spacing=1.5):
    """添加多行文本框"""
    txBox = slide.shapes.add_textbox(left, top, width, height)
    tf = txBox.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        if i == 0:
            p = tf.paragraphs[0]
        else:
            p = tf.add_paragraph()
        p.text = line
        p.font.size = Pt(font_size)
        p.font.color.rgb = color
        p.font.name = 'Microsoft YaHei'
        if bold_first and i == 0:
            p.font.bold = True
        p.space_after = Pt(font_size * (line_spacing - 1) * 0.7)
    return txBox

def add_card(slide, left, top, width, height, title, items, title_color=PRIMARY,
             card_color=CARD_BG):
    """添加功能卡片"""
    shape = add_rect(slide, left, top, width, height, color=CARD_BG)
    shape.shadow.inherit = False

    # 小色条
    add_rect(slide, left, top, Inches(0.06), height, color=title_color)

    # 标题
    add_text_box(slide, left + Inches(0.2), top + Inches(0.15), width - Inches(0.3), Inches(0.4),
                 title, font_size=16, color=title_color, bold=True)

    # 内容
    text = '\n'.join([f'• {item}' for item in items])
    add_text_box(slide, left + Inches(0.2), top + Inches(0.6), width - Inches(0.3), height - Inches(0.7),
                 text, font_size=11, color=DARK_TEXT)

def add_step_arrow(slide, left, top, width, height, step_num, title, desc, color=PRIMARY):
    """添加流程步骤"""
    shape = add_rect(slide, left, top, width, height, color=color)
    shape.shadow.inherit = False
    add_text_box(slide, left + Inches(0.1), top + Inches(0.05), Inches(0.5), Inches(0.5),
                 str(step_num), font_size=28, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, left + Inches(0.5), top + Inches(0.1), width - Inches(0.6), Inches(0.4),
                 title, font_size=14, color=WHITE, bold=True)
    add_text_box(slide, left + Inches(0.5), top + Inches(0.5), width - Inches(0.6), Inches(0.5),
                 desc, font_size=9, color=RGBColor(0xDD, 0xDD, 0xFF))

def add_section_header(slide, number, title, subtitle=""):
    """添加章节页 - 左侧数字+标题"""
    # 左侧蓝色区域
    add_rect(slide, Inches(0), Inches(0), Inches(4.5), Inches(7.5), color=PRIMARY)
    # 数字
    add_text_box(slide, Inches(0.8), Inches(1.5), Inches(3), Inches(1.5),
                 f"0{number}", font_size=72, color=WHITE, bold=True)
    # 标题
    add_text_box(slide, Inches(0.8), Inches(3.5), Inches(3.2), Inches(1),
                 title, font_size=32, color=WHITE, bold=True)
    if subtitle:
        add_text_box(slide, Inches(0.8), Inches(4.5), Inches(3.2), Inches(0.6),
                     subtitle, font_size=14, color=RGBColor(0xBB, 0xCC, 0xFF))


# ============================================================
# Slide 1: 封面
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
add_bg(slide, DARK)

# 装饰线条
add_rect(slide, Inches(1.5), Inches(2.2), Inches(2), Inches(0.015), color=PRIMARY)
add_rect(slide, Inches(1.5), Inches(4.3), Inches(10), Inches(0.008), color=RGBColor(0x33, 0x55, 0x88))

add_text_box(slide, Inches(1.5), Inches(2.4), Inches(10), Inches(0.7),
             '学生校内双证管理系统', font_size=44, color=WHITE, bold=True)
add_text_box(slide, Inches(1.5), Inches(3.15), Inches(10), Inches(0.5),
             'Dual Certificate Management System for Students on Campus', font_size=18, color=RGBColor(0x99, 0xBB, 0xDD))
add_text_box(slide, Inches(1.5), Inches(4.5), Inches(10), Inches(0.5),
             '人社证书 · 专业证书 · 校内引进证书   |   报名 → 考试 → AI审核 → 归档  全流程管理',
             font_size=14, color=GRAY)
add_text_box(slide, Inches(1.5), Inches(5.8), Inches(10), Inches(0.4),
             '技术栈：React 18 + TypeScript + Ant Design 5   |   Node.js + Express + SQLite   |   AI 智能审核引擎',
             font_size=12, color=GRAY)


# ============================================================
# Slide 2: 项目背景
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 1, '项目背景', 'Project Background')

# 右侧内容 - 两个卡片
# 痛点卡片
shape = add_rect(slide, Inches(5.2), Inches(0.8), Inches(7.3), Inches(2.8), color=LIGHT_BG)
add_text_box(slide, Inches(5.5), Inches(1.0), Inches(6.8), Inches(0.4),
             '🎯 核心痛点', font_size=18, color=PRIMARY, bold=True)
add_multi_text(slide, Inches(5.5), Inches(1.5), Inches(6.8), Inches(2.0), [
    '• 学校内部多种证书管理混乱，人社、专业、校内引进三种类型各自为政',
    '• 报名、考试、取证全流程依赖纸质表格和人工传递',
    '• 成绩审核缺乏统一标准，审核效率低',
    '• 证书获取数据分散在多个系统，无法统一查询统计',
    '• 培训信息和辅导材料缺少统一公示平台',
], font_size=12, line_spacing=1.8)

# 目标卡片
shape = add_rect(slide, Inches(5.2), Inches(4.0), Inches(7.3), Inches(3.0), color=LIGHT_BG)
add_text_box(slide, Inches(5.5), Inches(4.2), Inches(6.8), Inches(0.4),
             '✅ 系统目标', font_size=18, color=ACCENT_GREEN, bold=True)
add_multi_text(slide, Inches(5.5), Inches(4.7), Inches(6.8), Inches(2.2), [
    '• 建立统一的校内双证管理平台，覆盖人社、专业、校内引进三种证书类型',
    '• 实现报名→审核→考试→AI审核→归档的全流程数字化闭环',
    '• 通过 AI 辅助审核提升审核效率与标准一致性',
    '• 按班级自动归档，一键生成 Excel 报表',
    '• 提供公开信息门户，学生可自助查阅培训与材料',
], font_size=12, line_spacing=1.8)


# ============================================================
# Slide 3: 系统架构
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 2, '系统架构', 'System Architecture')

# 架构图 - 简化的三层结构
# 前端层
add_rect(slide, Inches(5.5), Inches(0.6), Inches(6.5), Inches(1.5), color=PRIMARY)
add_text_box(slide, Inches(5.7), Inches(0.7), Inches(6), Inches(0.4),
             '🖥️  前端展示层 (React 18 + TypeScript + Ant Design 5)', font_size=13, color=WHITE, bold=True)
add_multi_text(slide, Inches(5.7), Inches(1.15), Inches(6), Inches(0.8), [
    'Login / Dashboard / Students / Certificates / Registrations',
    'Exams (AI审核) / Records / Archives / Training / Materials / 公开门户',
], font_size=9, color=RGBColor(0xDD, 0xEE, 0xFF), line_spacing=1.3)

# 箭头1
add_text_box(slide, Inches(8.5), Inches(2.1), Inches(0.5), Inches(0.3), '⬇', font_size=20, color=GRAY, alignment=PP_ALIGN.CENTER)

# 后端层
add_rect(slide, Inches(5.5), Inches(2.4), Inches(6.5), Inches(1.5), color=RGBColor(0x08, 0x99, 0xFF))
add_text_box(slide, Inches(5.7), Inches(2.5), Inches(6), Inches(0.4),
             '⚙️  后端服务层 (Node.js + Express + TypeScript)', font_size=13, color=WHITE, bold=True)
add_multi_text(slide, Inches(5.7), Inches(2.95), Inches(6), Inches(0.8), [
    'Auth (JWT+bcrypt)  |  Controllers (10 modules)  |  AI Review Engine',
    'Multer (文件上传)  |  XLSX (Excel解析)  |  RESTful API (30+ endpoints)',
], font_size=9, color=RGBColor(0xDD, 0xEE, 0xFF), line_spacing=1.3)

# 箭头2
add_text_box(slide, Inches(8.5), Inches(3.9), Inches(0.5), Inches(0.3), '⬇', font_size=20, color=GRAY, alignment=PP_ALIGN.CENTER)

# 数据层
add_rect(slide, Inches(5.5), Inches(4.2), Inches(6.5), Inches(1.2), color=DARK)
add_text_box(slide, Inches(5.7), Inches(4.3), Inches(6), Inches(0.4),
             '🗄️  数据存储层 (SQLite - sql.js 纯JS实现)', font_size=13, color=WHITE, bold=True)
add_multi_text(slide, Inches(5.7), Inches(4.75), Inches(6), Inches(0.5), [
    'users  |  students  |  certificates  |  registrations  |  exams  |  records  |  archives',
], font_size=9, color=RGBColor(0xAA, 0xAA, 0xAA), line_spacing=1.3)

# 右侧特性标注
features_info = [
    ('📦 批量导入', 'Excel导入\n学生/考试/证书'),
    ('🤖 AI审核', '三维度评估\n智能判定'),
    ('🔐 安全认证', 'JWT Token\n权限管控'),
    ('🔗 教务对接', '模拟接口\n可扩展'),
]
for i, (title, desc) in enumerate(features_info):
    y = Inches(0.8) + Inches(1.3) * i
    shape = add_rect(slide, Inches(5.5), y, Inches(1.7), Inches(1.1), color=CARD_BG)
    add_text_box(slide, Inches(5.6), y + Inches(0.1), Inches(1.5), Inches(0.35),
                 title, font_size=11, color=PRIMARY, bold=True)
    add_text_box(slide, Inches(5.6), y + Inches(0.45), Inches(1.5), Inches(0.55),
                 desc, font_size=9, color=GRAY)

features_info_row2 = [
    ('📊 统计看板', '仪表盘\n多维度分析'),
    ('📁 按班归档', '自动归档\nExcel导出'),
    ('🌐 公开门户', '信息公示\n无需登录'),
    ('⚡ 零配置', 'sql.js\n无需安装DB'),
]
for i, (title, desc) in enumerate(features_info_row2):
    y = Inches(0.8) + Inches(1.3) * i
    shape = add_rect(slide, Inches(7.3), y, Inches(1.7), Inches(1.1), color=CARD_BG)
    add_text_box(slide, Inches(7.4), y + Inches(0.1), Inches(1.5), Inches(0.35),
                 title, font_size=11, color=PRIMARY, bold=True)
    add_text_box(slide, Inches(7.4), y + Inches(0.45), Inches(1.5), Inches(0.55),
                 desc, font_size=9, color=GRAY)

# 底部教务对接
shape = add_rect(slide, Inches(5.5), Inches(5.7), Inches(6.5), Inches(0.5), color=RGBColor(0xE6, 0xF7, 0xFF))
add_text_box(slide, Inches(5.7), Inches(5.75), Inches(6), Inches(0.35),
             '🔗 教务系统对接 (加分项) — GET /api/edusys/certificates/:studentNo  |  POST /api/edusys/sync',
             font_size=10, color=PRIMARY)

# 启动命令
shape = add_rect(slide, Inches(5.5), Inches(6.5), Inches(6.5), Inches(0.5), color=DARK)
add_text_box(slide, Inches(5.7), Inches(6.55), Inches(6.0), Inches(0.35),
             'cd server && npm run dev (端口3001)   |   cd client && npm run dev (端口5173)',
             font_size=10, color=RGBColor(0xAA, 0xBB, 0xCC))


# ============================================================
# Slide 4: 证书类型体系
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 3, '证书类型体系', 'Certificate Categories')

cert_types = [
    ('1', '人社证书', 'RENSHE', '人力资源和社会保障部门\n颁发的职业资格证书', PRIMARY, [
        '计算机等级考试二级', '英语四级(CET-4)', '电工证', '焊工证'
    ]),
    ('2', '专业证书', 'ZHUANYE', '专业相关的行业\n认证证书', ACCENT_GREEN, [
        '会计从业资格证', '软件设计师', '建造师资格证'
    ]),
    ('3', '校内引进证书', 'XIAONEI', '学校引进的各类\n技能认证证书', ACCENT_ORANGE, [
        '普通话等级证书', '电子商务师', '市场营销师'
    ]),
]

for i, (num, name, code, desc, color, examples) in enumerate(cert_types):
    left = Inches(5.3) + Inches(2.7) * i
    # 卡片背景
    shape = add_rect(slide, left, Inches(1.0), Inches(2.4), Inches(5.5), color=LIGHT_BG)
    # 顶部色条
    add_rect(slide, left, Inches(1.0), Inches(2.4), Inches(0.09), color=color)
    # 编号
    add_text_box(slide, left + Inches(0.2), Inches(1.2), Inches(0.6), Inches(0.6),
                 num, font_size=36, color=color, bold=True)
    # 名称
    add_text_box(slide, left + Inches(0.8), Inches(1.35), Inches(1.4), Inches(0.4),
                 name, font_size=20, color=color, bold=True)
    # 编码
    add_text_box(slide, left + Inches(0.8), Inches(1.8), Inches(1.4), Inches(0.3),
                 code, font_size=10, color=GRAY)
    # 描述
    add_text_box(slide, left + Inches(0.3), Inches(2.4), Inches(1.8), Inches(0.9),
                 desc, font_size=11, color=DARK_TEXT)
    # 示例证书
    add_text_box(slide, left + Inches(0.3), Inches(3.5), Inches(1.8), Inches(0.3),
                 '示例证书：', font_size=10, color=GRAY, bold=True)
    for j, ex in enumerate(examples):
        add_text_box(slide, left + Inches(0.3), Inches(3.9) + Inches(0.35) * j,
                     Inches(1.8), Inches(0.3), f'▸ {ex}', font_size=10, color=DARK_TEXT)

# 底部说明
shape = add_rect(slide, Inches(5.3), Inches(6.8), Inches(7.5), Inches(0.4), color=DARK)
add_text_box(slide, Inches(5.5), Inches(6.85), Inches(7), Inches(0.3),
             '系统支持自定义证书类型和证书信息，管理员可灵活配置报名规则和报名条件',
             font_size=10, color=RGBColor(0xAA, 0xBB, 0xCC))


# ============================================================
# Slide 5: 核心功能模块
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)

# 顶部标题栏
add_rect(slide, Inches(0), Inches(0), Inches(13.333), Inches(1.2), color=PRIMARY)
add_text_box(slide, Inches(0.5), Inches(0.2), Inches(5), Inches(0.5),
             '核心功能模块', font_size=30, color=WHITE, bold=True)
add_text_box(slide, Inches(0.5), Inches(0.7), Inches(5), Inches(0.4),
             'Core Functional Modules', font_size=14, color=RGBColor(0xBB, 0xDD, 0xFF))

modules = [
    ('📊', '仪表盘', '统计概览\n各类型证书通过率\n报名数/获证数'),
    ('👨‍🎓', '学生管理', 'CRUD管理\nExcel批量导入\n按班级筛选'),
    ('📜', '证书管理', '三种证书类型\n证书信息维护\n报名规则设置'),
    ('📝', '报名管理', '学生报名\n审核批准/拒绝\n批量导入'),
    ('📄', '考试管理', '考试信息提交\nAI智能审核\n人工复核'),
    ('🏆', '证书记录', '获取情况管理\n批量导入\n数据统计'),
    ('📦', '归档管理', '按班级归档\nExcel自动生成\n归档详情查看'),
    ('🌐', '公开门户', '证书信息展示\n培训/材料公示\n无需登录查看'),
]

for i, (icon, title, desc) in enumerate(modules):
    row = i // 4
    col = i % 4
    left = Inches(0.5) + Inches(3.15) * col
    top = Inches(1.5) + Inches(2.85) * row

    shape = add_rect(slide, left, top, Inches(2.9), Inches(2.6), color=LIGHT_BG)

    # Icon
    add_text_box(slide, left + Inches(0.2), top + Inches(0.15), Inches(0.6), Inches(0.6),
                 icon, font_size=32)
    # Title
    add_text_box(slide, left + Inches(0.9), top + Inches(0.2), Inches(1.8), Inches(0.45),
                 title, font_size=18, color=PRIMARY, bold=True)
    # Desc
    add_text_box(slide, left + Inches(0.3), top + Inches(0.9), Inches(2.3), Inches(1.5),
                 desc, font_size=11, color=DARK_TEXT)


# ============================================================
# Slide 6: AI 审核引擎
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, DARK)
add_text_box(slide, Inches(0.8), Inches(0.4), Inches(8), Inches(0.6),
             '🤖 AI 智能审核引擎', font_size=36, color=WHITE, bold=True)
add_text_box(slide, Inches(0.8), Inches(1.0), Inches(8), Inches(0.4),
             '三维度智能评估 — 材料完整性 × 成绩合格性 × 前置条件审核', font_size=14, color=RGBColor(0x88, 0xAA, 0xCC))

# 三个维度卡片
dimensions = [
    ('📋', '材料完整性', '检查是否上传了\n考试结果附件材料\n（成绩单/证书扫描件）', PRIMARY),
    ('📈', '成绩合格性', '验证考试成绩是否\n达到及格线标准\n（默认 60 分）', ACCENT_GREEN),
    ('✅', '前置条件审核', '确认报名是否已通过\n管理员审核\n确保流程合规', ACCENT_ORANGE),
]

for i, (icon, title, desc, color) in enumerate(dimensions):
    left = Inches(0.8) + Inches(4.2) * i
    top = Inches(1.8)

    shape = add_rect(slide, left, top, Inches(3.8), Inches(2.5), color=RGBColor(0x0A, 0x2A, 0x50))
    # 顶部色线
    add_rect(slide, left, top, Inches(3.8), Inches(0.06), color=color)
    add_text_box(slide, left + Inches(0.3), top + Inches(0.3), Inches(0.6), Inches(0.6),
                 icon, font_size=36)
    add_text_box(slide, left + Inches(1.0), top + Inches(0.35), Inches(2.5), Inches(0.45),
                 title, font_size=22, color=color, bold=True)
    add_text_box(slide, left + Inches(0.3), top + Inches(1.1), Inches(3.2), Inches(1.2),
                 desc, font_size=12, color=RGBColor(0xAA, 0xBB, 0xCC))

# 审核结果
results = [
    ('✅ 通过', '材料完整\n成绩合格\n前置满足', ACCENT_GREEN),
    ('⚠️ 需补充材料', '材料不完整\n需补充后重审', ACCENT_ORANGE),
    ('❌ 不通过', '成绩不合格\n或前置不满足', ACCENT_RED),
]

add_text_box(slide, Inches(0.8), Inches(4.6), Inches(8), Inches(0.5),
             '审核结果输出', font_size=18, color=WHITE, bold=True)

for i, (title, desc, color) in enumerate(results):
    left = Inches(0.8) + Inches(4.2) * i
    top = Inches(5.2)
    shape = add_rect(slide, left, top, Inches(3.8), Inches(1.5), color=RGBColor(0x0A, 0x2A, 0x50))
    add_rect(slide, left, top, Inches(3.8), Inches(0.06), color=color)
    add_text_box(slide, left + Inches(0.3), top + Inches(0.2), Inches(3.2), Inches(0.45),
                 title, font_size=18, color=color, bold=True)
    add_text_box(slide, left + Inches(0.3), top + Inches(0.7), Inches(3.2), Inches(0.7),
                 desc, font_size=11, color=GRAY)

# 左下角 - 可替换说明
add_text_box(slide, Inches(0.8), Inches(7.0), Inches(8), Inches(0.3),
             '💡 内置模拟AI引擎 (server/src/services/aiReviewService.ts)，可替换为真实 AI API（如 GPT/Claude）',
             font_size=10, color=RGBColor(0x66, 0x88, 0xAA))


# ============================================================
# Slide 7: 操作流程演示
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 4, '业务流程', 'Business Workflow')

# 流程步骤
steps = [
    ('1', '创建\n学生', '录入学生信息\n或Excel批量导入'),
    ('2', '创建\n证书', '定义证书信息\n设置报名规则'),
    ('3', '学生\n报名', '选择学生和证书\n提交报名'),
    ('4', '审核\n报名', '管理员审核\n批准或拒绝'),
    ('5', '提交\n考试', '录入考试成绩\n上传附件材料'),
    ('6', 'AI\n审核', '自动评估\n三维度审核'),
    ('7', '人工\n复核', '最终审批\n自动生成证书记录'),
    ('8', '按班\n归档', '按班级归档\n导出Excel文件'),
]
colors_flow = [PRIMARY, RGBColor(0x08, 0x99, 0xFF), ACCENT_GREEN, ACCENT_ORANGE,
               RGBColor(0x72, 0x2E, 0xD1), RGBColor(0xEB, 0x2F, 0x96), ACCENT_RED, DARK]

for i, (num, title, desc) in enumerate(steps):
    left = Inches(5.0) + Inches(1.05) * i
    top = Inches(1.5)
    color_idx = min(i, len(colors_flow) - 1)
    color = colors_flow[color_idx]

    shape = add_rect(slide, left, top, Inches(0.9), Inches(1.6), color=color)
    add_text_box(slide, left + Inches(0.05), top + Inches(0.1), Inches(0.8), Inches(0.3),
                 num, font_size=16, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, left + Inches(0.05), top + Inches(0.4), Inches(0.8), Inches(0.6),
                 title, font_size=10, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, left + Inches(0.05), top + Inches(1.0), Inches(0.8), Inches(0.55),
                 desc, font_size=7, color=RGBColor(0xDD, 0xDD, 0xFF), alignment=PP_ALIGN.CENTER)

# 箭头
for i in range(7):
    left = Inches(5.9) + Inches(1.05) * i
    add_text_box(slide, left, Inches(2.1), Inches(0.15), Inches(0.3),
                 '→', font_size=14, color=GRAY, alignment=PP_ALIGN.CENTER)

# 详细操作说明区域
sections_detail = [
    ('管理端操作', [
        '1️⃣ 打开浏览器访问 http://localhost:5173',
        '2️⃣ 使用默认账号 admin / admin123 登录',
        '3️⃣ 左侧导航栏进入各管理模块',
        '4️⃣ 完成学生/证书的创建和数据录入',
        '5️⃣ 依次执行报名→审核→考试→归档流程',
    ]),
    ('批量操作', [
        '📥 学生批量导入：上传Excel文件（学号/姓名/班级…）',
        '📥 考试批量导入：上传Excel文件（学号/证书/成绩…）',
        '📥 证书记录批量导入：上传Excel文件',
        '📤 归档导出：按班级自动生成Excel归档文件',
    ]),
    ('公开门户', [
        '🌐 访问 http://localhost:5173/public（无需登录）',
        '📜 查看所有证书信息和报名要求',
        '📚 查阅公开的培训安排和辅导材料',
        '🔗 可嵌入学校官网或公众号作为信息公示页',
    ]),
]

for i, (title, items) in enumerate(sections_detail):
    left = Inches(5.0) + Inches(2.9) * i
    top = Inches(3.5)
    shape = add_rect(slide, left, top, Inches(2.67), Inches(3.7), color=LIGHT_BG)
    add_text_box(slide, left + Inches(0.15), top + Inches(0.15), Inches(2.4), Inches(0.4),
                 title, font_size=15, color=PRIMARY, bold=True)
    add_multi_text(slide, left + Inches(0.15), top + Inches(0.6), Inches(2.4), Inches(3.0),
                   items, font_size=10, line_spacing=1.8)


# ============================================================
# Slide 8: 页面展示（选几个关键页面截图说明）
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 5, '系统页面', 'System Pages')

pages_list = [
    ('🔐 Login', '登录页', 'JWT认证\n默认admin/admin123'),
    ('📊 Dashboard', '仪表盘', '数据统计\n多维度看板'),
    ('👨‍🎓 Students', '学生管理', 'CRUD\nExcel批量导入\n班级筛选'),
    ('📜 Certificates', '证书管理', '三类证书\n报名规则配置'),
    ('📝 Registrations', '报名管理', '报名+审核\n批准/拒绝'),
    ('🤖 Exams', '考试管理', 'AI审核\n人工复核\n批量导入'),
    ('📦 Archives', '归档管理', '按班归档\nExcel导出\n通过率统计'),
    ('🌐 Public', '公开门户', '无需登录\n信息公示'),
]

for i, (icon, title, desc) in enumerate(pages_list):
    row = i // 4
    col = i % 4
    left = Inches(5.3) + Inches(2.05) * col
    top = Inches(1.2) + Inches(3.0) * row

    shape = add_rect(slide, left, top, Inches(1.85), Inches(2.7), color=LIGHT_BG)
    add_text_box(slide, left + Inches(0.15), top + Inches(0.15), Inches(1.5), Inches(0.35),
                 icon, font_size=16, color=PRIMARY, bold=True)
    add_text_box(slide, left + Inches(0.15), top + Inches(0.55), Inches(1.5), Inches(0.35),
                 title, font_size=14, color=DARK_TEXT, bold=True)
    add_text_box(slide, left + Inches(0.15), top + Inches(1.0), Inches(1.5), Inches(1.5),
                 desc, font_size=10, color=DARK_TEXT)

# 底部说明
shape = add_rect(slide, Inches(5.3), Inches(7.0), Inches(7.5), Inches(0.35), color=DARK)
add_text_box(slide, Inches(5.5), Inches(7.03), Inches(7), Inches(0.25),
             '前端基于 Ant Design 5 组件库，自适应布局，支持多端访问',
             font_size=10, color=RGBColor(0xAA, 0xBB, 0xCC))


# ============================================================
# Slide 9: 教务系统对接
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 6, '教务系统对接', 'Edu System Integration (加分项)')

# API 接口展示
shape = add_rect(slide, Inches(5.3), Inches(0.8), Inches(7.5), Inches(2.5), color=LIGHT_BG)
add_text_box(slide, Inches(5.6), Inches(1.0), Inches(7), Inches(0.4),
             '📡 模拟教务系统 API 接口', font_size=18, color=PRIMARY, bold=True)

# 两个接口
add_rect(slide, Inches(5.6), Inches(1.6), Inches(3.0), Inches(1.3), color=WHITE)
add_text_box(slide, Inches(5.8), Inches(1.7), Inches(2.6), Inches(0.3),
             'GET 查询接口', font_size=14, color=PRIMARY, bold=True)
add_multi_text(slide, Inches(5.8), Inches(2.05), Inches(2.6), Inches(0.7), [
    '/api/edusys/certificates/:studentNo',
    '输入学号 → 返回学生证书获取情况',
    '包含证书类型、获取日期、编号、成绩',
], font_size=9, line_spacing=1.6)

add_rect(slide, Inches(8.9), Inches(1.6), Inches(3.6), Inches(1.3), color=WHITE)
add_text_box(slide, Inches(9.1), Inches(1.7), Inches(3.2), Inches(0.3),
             'POST 同步接口', font_size=14, color=ACCENT_GREEN, bold=True)
add_multi_text(slide, Inches(9.1), Inches(2.05), Inches(3.2), Inches(0.7), [
    '/api/edusys/sync',
    '从教务系统批量同步证书数据',
    '自动匹配学生和证书，去重插入',
], font_size=9, line_spacing=1.6)

# 数据流展示
add_text_box(slide, Inches(6.5), Inches(3.6), Inches(1.5), Inches(0.4),
             '数据同步流程', font_size=16, color=DARK_TEXT, bold=True)

flow_steps = ['教务系统', 'API调用', '学生匹配', '证书匹配', '数据入库']
for i, step in enumerate(flow_steps):
    left = Inches(5.5) + Inches(1.5) * i
    top = Inches(4.2)
    color = [DARK, PRIMARY, ACCENT_GREEN, ACCENT_ORANGE, RGBColor(0x72, 0x2E, 0xD1)][i]
    add_rect(slide, left, top, Inches(1.25), Inches(0.8), color=color)
    add_text_box(slide, left + Inches(0.05), top + Inches(0.2), Inches(1.15), Inches(0.4),
                 step, font_size=12, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    if i < 4:
        add_text_box(slide, left + Inches(1.25), top + Inches(0.2), Inches(0.25), Inches(0.3),
                     '→', font_size=18, color=GRAY, alignment=PP_ALIGN.CENTER)

# 模拟数据示例
add_text_box(slide, Inches(5.5), Inches(5.5), Inches(7), Inches(0.4),
             '📋 模拟同步数据示例', font_size=16, color=DARK_TEXT, bold=True)

shape = add_rect(slide, Inches(5.5), Inches(6.0), Inches(7), Inches(1.2), color=LIGHT_BG)
add_multi_text(slide, Inches(5.7), Inches(6.1), Inches(6.5), Inches(1.0), [
    '学生 2024001 → 计算机等级考试二级 | 2025-03-15 | CERT-2025-001 | 85分',
    '学生 2024002 → 英语四级(CET-4)     | 2025-06-20 | CET4-2025-002 | 520分',
    '学生 2024003 → 软件设计师           | 2025-05-10 | SD-2025-003   | 78分',
], font_size=10, line_spacing=1.7)


# ============================================================
# Slide 10: API 接口总览
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 7, 'API 接口', 'RESTful API Endpoints')

api_groups = [
    ('🔐 认证', [('POST /api/auth/login', '登录获取Token'), ('GET /api/auth/me', '当前用户信息')]),
    ('👨‍🎓 学生', [('GET/POST /api/students', 'CRUD'), ('POST batch-import', 'Excel批量导入')]),
    ('📜 证书', [('GET/POST /api/certificates', 'CRUD'), ('GET types', '证书类型')]),
    ('📋 规则', [('GET/POST /api/registration-rules', '报名规则CRUD')]),
    ('📝 报名', [('GET/POST /api/registrations', '列表+新增'), ('PUT /:id/review', '审核')]),
    ('📄 考试', [('GET/POST /api/exam-submissions', '列表+提交'), ('POST /:id/ai-review', 'AI审核'), ('PUT /:id/review', '人工审核')]),
    ('🏆 记录', [('GET/POST /api/certificate-records', 'CRUD'), ('GET /api/stats', '统计')]),
    ('📦 归档', [('GET/POST /api/archives', '列表+归档'), ('GET /:id/export', '导出Excel')]),
]

for i, (group, endpoints) in enumerate(api_groups):
    row = i // 4
    col = i % 4
    left = Inches(5.2) + Inches(2.1) * col
    top = Inches(0.8) + Inches(3.1) * row

    shape = add_rect(slide, left, top, Inches(1.95), Inches(2.8), color=LIGHT_BG)
    add_text_box(slide, left + Inches(0.15), top + Inches(0.1), Inches(1.6), Inches(0.35),
                 group, font_size=14, color=PRIMARY, bold=True)
    for j, (ep, desc) in enumerate(endpoints):
        y = top + Inches(0.55) + Inches(0.7) * j
        add_text_box(slide, left + Inches(0.15), y, Inches(1.6), Inches(0.3),
                     ep, font_size=8, color=PRIMARY, bold=True)
        add_text_box(slide, left + Inches(0.15), y + Inches(0.22), Inches(1.6), Inches(0.25),
                     desc, font_size=8, color=GRAY)

# 底部统计
shape = add_rect(slide, Inches(5.2), Inches(7.0), Inches(7.5), Inches(0.35), color=DARK)
add_text_box(slide, Inches(5.4), Inches(7.0), Inches(7), Inches(0.3),
             '共计 30+ RESTful API 端点，涵盖认证、CRUD、审核、统计、归档、教务对接等全部业务',
             font_size=10, color=RGBColor(0xAA, 0xBB, 0xCC))


# ============================================================
# Slide 11: 技术亮点
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 8, '技术亮点', 'Technical Highlights')

highlights = [
    ('🤖', 'AI 智能审核', '内置三维度 AI 审核引擎，自动评估材料完整性、成绩合格性和前置条件。结果附带置信度和详细评语，审查可追溯。预留真实 AI API 接口，可对接 GPT/Claude 等大模型。'),
    ('📦', '全栈 TypeScript', '前后端统一使用 TypeScript，共享类型定义。编译时类型检查减少运行时错误，IDE 智能提示提升开发效率。'),
    ('⚡', '零配置数据库', '使用 sql.js（纯 JavaScript 实现的 SQLite），无需安装任何数据库软件。npm install 即可运行，数据持久化到本地文件。'),
    ('🔐', 'JWT 安全认证', '基于 JWT + bcrypt 的认证体系，Token 过期自动刷新，中间件拦截未授权请求。支持超级管理员和普通管理员角色。'),
    ('📊', '批量数据处理', '全流程支持 Excel 批量导入（学生/报名/考试/证书记录）。按班级自动归档，一键导出 Excel 报表。使用 xlsx 库实现多格式兼容。'),
    ('🌐', '信息公示门户', '独立公开门户页面，无需登录即可查阅证书信息、培训安排和辅导材料。可嵌入学校官网或公众号。'),
    ('🔗', '教务系统对接', '标准 RESTful API 对接教务系统，支持按学号查询证书获取情况和批量同步。采用模拟数据演示，可快速替换为真实接口。'),
    ('🎨', '现代 UI 体验', '基于 Ant Design 5 组件库，响应式侧边栏布局。统计仪表盘实时展示核心指标，支持多维度筛选。主题可定制。'),
]

for i, (icon, title, desc) in enumerate(highlights):
    row = i // 2
    col = i % 2
    left = Inches(5.3) + Inches(4.0) * col
    top = Inches(0.8) + Inches(1.6) * row

    shape = add_rect(slide, left, top, Inches(3.8), Inches(1.4), color=LIGHT_BG)
    add_text_box(slide, left + Inches(0.2), top + Inches(0.1), Inches(0.5), Inches(0.5),
                 icon, font_size=24)
    add_text_box(slide, left + Inches(0.7), top + Inches(0.12), Inches(2.8), Inches(0.35),
                 title, font_size=16, color=PRIMARY, bold=True)
    add_text_box(slide, left + Inches(0.2), top + Inches(0.55), Inches(3.4), Inches(0.75),
                 desc, font_size=9, color=DARK_TEXT)


# ============================================================
# Slide 12: 项目总结
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, WHITE)
add_section_header(slide, 9, '项目总结', 'Project Summary')

# 左侧 - 达成的目标
add_text_box(slide, Inches(5.3), Inches(0.8), Inches(7), Inches(0.5),
             '✅ 系统实现的核心价值', font_size=20, color=PRIMARY, bold=True)

achievements = [
    '覆盖人社/专业/校内引进三类证书的全生命周期管理',
    '实现从报名→审核→考试→AI审核→归档的完整数字化闭环',
    '内置 AI 智能审核引擎，提升审核效率和标准一致性',
    '支持批量数据导入和按班级自动归档，大幅降低人工工作量',
    '公开信息门户实现证书/培训/材料的统一公示',
    '预留教务系统对接接口，便于跨系统数据互通',
    '全栈 TypeScript + 零配置数据库，开箱即用',
]

for i, ach in enumerate(achievements):
    add_text_box(slide, Inches(5.5), Inches(1.4) + Inches(0.45) * i, Inches(7), Inches(0.4),
                 f'✔ {ach}', font_size=12, color=DARK_TEXT)

# 右侧统计框
stats_data = [
    ('10', '功能模块'),
    ('30+', 'API端点'),
    ('8', '数据库表'),
    ('3', '证书类型'),
    ('2', '部署服务'),
    ('1', '天完成'),
]
for i, (num, label) in enumerate(stats_data):
    row = i // 3
    col = i % 3
    left = Inches(5.5) + Inches(2.5) * col
    top = Inches(4.7) + Inches(1.1) * row
    shape = add_rect(slide, left, top, Inches(2.2), Inches(0.85), color=PRIMARY)
    add_text_box(slide, left + Inches(0.1), top + Inches(0.05), Inches(2.0), Inches(0.4),
                 num, font_size=24, color=WHITE, bold=True, alignment=PP_ALIGN.CENTER)
    add_text_box(slide, left + Inches(0.1), top + Inches(0.48), Inches(2.0), Inches(0.3),
                 label, font_size=10, color=RGBColor(0xDD, 0xEE, 0xFF), alignment=PP_ALIGN.CENTER)

# 底部启动命令
shape = add_rect(slide, Inches(5.3), Inches(7.0), Inches(7.5), Inches(0.4), color=DARK)
add_text_box(slide, Inches(5.5), Inches(7.03), Inches(7), Inches(0.3),
             '🚀 快速启动: cd server && npm run dev  |  cd client && npm run dev  （默认账号: admin / admin123）',
             font_size=10, color=RGBColor(0xAA, 0xBB, 0xCC))


# ============================================================
# Slide 13: 结束页
# ============================================================
slide = prs.slides.add_slide(prs.slide_layouts[6])
add_bg(slide, DARK)

add_text_box(slide, Inches(1.5), Inches(2.0), Inches(10), Inches(1),
             '感谢聆听', font_size=48, color=WHITE, bold=True)
add_text_box(slide, Inches(1.5), Inches(3.0), Inches(10), Inches(0.6),
             '学生校内双证管理系统', font_size=28, color=PRIMARY)

add_rect(slide, Inches(1.5), Inches(3.8), Inches(3), Inches(0.01), color=PRIMARY)

add_multi_text(slide, Inches(1.5), Inches(4.2), Inches(10), Inches(2.5), [
    '📜 人社证书 · 专业证书 · 校内引进证书 — 全流程数字化管理',
    '🤖 AI 智能审核引擎 — 三维度自动评估',
    '📦 批量导入 & 按班级归档 — 高效数据管理',
    '🌐 公开信息门户 — 透明化信息公示',
    '',
    '技术栈: React 18 + TypeScript + Ant Design 5 | Node.js + Express + SQLite',
    '前端: http://localhost:5173 | 后端: http://localhost:3001',
    '默认账号: admin / admin123',
], font_size=14, color=RGBColor(0x99, 0xBB, 0xDD), line_spacing=1.6)


# ============================================================
# 保存
# ============================================================
output_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    '学生校内双证管理系统_路演PPT.pptx'
)
prs.save(output_path)
print(f'PPT saved to: {output_path}')
print(f'Total slides: {len(prs.slides)}')
