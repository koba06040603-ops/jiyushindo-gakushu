#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
松川村AI学習システム - 正しいURL版PDF生成スクリプト
全46枚のスライドを正しいURLで生成します
"""

import json
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os

# 日本語フォントの登録（システムにインストールされているフォントを使用）
try:
    # まずNotoフォントを試す
    pdfmetrics.registerFont(TTFont('NotoSans', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', subfontIndex=0))
    pdfmetrics.registerFont(TTFont('NotoSans-Bold', '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc', subfontIndex=0))
    FONT_NAME = 'NotoSans'
    FONT_NAME_BOLD = 'NotoSans-Bold'
except:
    try:
        # 次にIPAフォントを試す
        pdfmetrics.registerFont(TTFont('IPAGothic', '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf'))
        FONT_NAME = 'IPAGothic'
        FONT_NAME_BOLD = 'IPAGothic'
    except:
        # デフォルトフォントを使用
        FONT_NAME = 'Helvetica'
        FONT_NAME_BOLD = 'Helvetica-Bold'
        print("警告: 日本語フォントが見つかりません。デフォルトフォントを使用します。")

def create_pdf(output_filename):
    """PDFファイルを生成"""
    
    # スライドデータを読み込み
    with open('/home/user/webapp/slides_data.json', 'r', encoding='utf-8') as f:
        slides_data = json.load(f)
    
    # PDFドキュメントを作成
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=20*mm,
        bottomMargin=20*mm
    )
    
    # ストーリー（コンテンツ）を作成
    story = []
    
    # スタイルを定義
    styles = getSampleStyleSheet()
    
    # カスタムスタイル
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontName=FONT_NAME_BOLD,
        fontSize=24,
        textColor='#2C3E50',
        alignment=TA_CENTER,
        spaceAfter=30
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontName=FONT_NAME_BOLD,
        fontSize=16,
        textColor='#2980B9',
        spaceAfter=12
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontName=FONT_NAME,
        fontSize=11,
        leading=16,
        spaceAfter=10
    )
    
    url_style = ParagraphStyle(
        'CustomURL',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=10,
        textColor='#3498DB',
        leftIndent=10,
        spaceAfter=10
    )
    
    instruction_style = ParagraphStyle(
        'CustomInstruction',
        parent=styles['Normal'],
        fontName=FONT_NAME,
        fontSize=9,
        textColor='#7F8C8D',
        leftIndent=10,
        spaceAfter=20
    )
    
    # 表紙ページ
    story.append(Spacer(1, 30*mm))
    story.append(Paragraph("松川村AI個別最適化学習システム", title_style))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph("全46枚スライド（2026年2月版）", heading_style))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        "※ 各スライドに画像URLが記載されています。URLから画像をダウンロードしてください。",
        normal_style
    ))
    story.append(PageBreak())
    
    # 第1部の区切りページ
    story.append(Spacer(1, 50*mm))
    story.append(Paragraph("第1部", title_style))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph("システム概要とエビデンス", heading_style))
    story.append(Paragraph("スライド1-16", normal_style))
    story.append(PageBreak())
    
    # 各スライドを生成
    part2_started = False
    part3_started = False
    
    for slide in slides_data:
        slide_num = slide['num']
        slide_title = slide['title']
        slide_url_code = slide['url']
        slide_content = slide['content']
        
        # 第2部の区切りページ
        if slide_num == 17 and not part2_started:
            story.append(Spacer(1, 50*mm))
            story.append(Paragraph("第2部", title_style))
            story.append(Spacer(1, 10*mm))
            story.append(Paragraph("主要機能とUI/UX", heading_style))
            story.append(Paragraph("スライド17-31", normal_style))
            story.append(PageBreak())
            part2_started = True
        
        # 第3部の区切りページ
        if slide_num == 32 and not part3_started:
            story.append(Spacer(1, 50*mm))
            story.append(Paragraph("第3部", title_style))
            story.append(Spacer(1, 10*mm))
            story.append(Paragraph("導入プロセスと成功戦略", heading_style))
            story.append(Paragraph("スライド32-46", normal_style))
            story.append(PageBreak())
            part3_started = True
        
        # スライドタイトル
        story.append(Paragraph(f"スライド{slide_num}: {slide_title}", heading_style))
        story.append(Spacer(1, 5*mm))
        
        # 内容説明
        story.append(Paragraph(f"<b>内容:</b> {slide_content}", normal_style))
        story.append(Spacer(1, 3*mm))
        
        # 画像挿入プレースホルダー
        story.append(Paragraph("【画像をここに挿入してください】", normal_style))
        story.append(Spacer(1, 5*mm))
        
        # 画像ダウンロードURL
        full_url = f"https://www.genspark.ai/api/files/s/{slide_url_code}?cache_control=3600"
        story.append(Paragraph("<b>画像ダウンロードURL:</b>", normal_style))
        story.append(Paragraph(full_url, url_style))
        story.append(Spacer(1, 3*mm))
        
        # ダウンロード手順
        story.append(Paragraph(
            "<b>手順:</b> URLをブラウザで開く → 画像を右クリック → 「名前を付けて画像を保存」→ PowerPointに挿入",
            instruction_style
        ))
        
        # ページ番号
        story.append(Paragraph(f"{slide_num}/46", instruction_style))
        
        # 改ページ
        story.append(PageBreak())
    
    # PDFを生成
    print(f"PDF生成中... {output_filename}")
    doc.build(story)
    print(f"✅ PDF生成完了: {output_filename}")
    
    # ファイルサイズを表示
    file_size = os.path.getsize(output_filename)
    print(f"ファイルサイズ: {file_size / 1024:.1f} KB")

if __name__ == "__main__":
    output_file = "/home/user/webapp/松川村AI学習システム_全46枚スライド_正しいURL版.pdf"
    create_pdf(output_file)
    print("\n" + "="*60)
    print("PDF生成が完了しました！")
    print("="*60)
    print(f"\nファイル: {output_file}")
    print("\n次のステップ:")
    print("1. このPDFをダウンロード")
    print("2. 各スライドのURLから画像をダウンロード")
    print("3. PowerPointに画像を挿入")
    print("="*60)
