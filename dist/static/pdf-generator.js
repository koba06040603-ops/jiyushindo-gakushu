/**
 * PDF出力機能 (PDF Generator)
 * 学習レポートのPDF生成
 * 2026-01-29 実装
 */

class PDFGenerator {
  constructor() {
    this.jsPDF = null
  }

  /**
   * jsPDFライブラリを初期化
   */
  async initialize() {
    if (this.jsPDF) return

    // jsPDFライブラリをロード
    if (typeof window.jspdf === 'undefined') {
      console.error('jsPDF ライブラリが読み込まれていません')
      return false
    }
    
    this.jsPDF = window.jspdf.jsPDF
    return true
  }

  /**
   * 週次レポートPDF生成
   */
  async generateWeeklyReportPDF(reportData, studentName = '児童') {
    await this.initialize()
    if (!this.jsPDF) {
      throw new Error('PDF生成ライブラリの初期化に失敗しました')
    }

    const doc = new this.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // タイトル
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('週次学習レポート', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // 生徒名と期間
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`児童名: ${studentName}`, 20, yPosition)
    yPosition += 7
    doc.text(`期間: ${this.formatDateRange(reportData.weekStart, reportData.weekEnd)}`, 20, yPosition)
    yPosition += 15

    // サマリーセクション
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('学習サマリー', 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // サマリーボックス
    const summaryData = [
      { label: '総復習回数', value: `${reportData.totalReviews || 0}回`, color: [59, 130, 246] },
      { label: '復習カード数', value: `${reportData.uniqueCards || 0}枚`, color: [16, 185, 129] },
      { label: '平均正答率', value: `${(reportData.accuracyRate || 0).toFixed(1)}%`, color: [245, 158, 11] },
      { label: '総学習時間', value: `${Math.floor((reportData.totalStudyTime || 0) / 60)}分`, color: [139, 92, 246] }
    ]

    const boxWidth = (pageWidth - 50) / 2
    const boxHeight = 20
    let xPos = 20
    let rowIndex = 0

    summaryData.forEach((item, index) => {
      if (index % 2 === 0 && index > 0) {
        yPosition += boxHeight + 5
        xPos = 20
        rowIndex++
      }

      // ボックスの背景
      doc.setFillColor(item.color[0], item.color[1], item.color[2])
      doc.setDrawColor(item.color[0], item.color[1], item.color[2])
      doc.roundedRect(xPos, yPosition, boxWidth, boxHeight, 2, 2, 'S')

      // ラベル
      doc.setTextColor(100, 100, 100)
      doc.setFontSize(8)
      doc.text(item.label, xPos + 5, yPosition + 7)

      // 値
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(item.value, xPos + 5, yPosition + 15)
      doc.setFont('helvetica', 'normal')

      xPos += boxWidth + 10
    })

    yPosition += boxHeight + 15

    // 自己調整学習セクション
    if (reportData.srlBreakdown) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('自己調整学習の実践', 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      const srlData = [
        { label: '予見段階', value: reportData.srlBreakdown.foresee || 0, color: [59, 130, 246] },
        { label: '遂行段階', value: reportData.srlBreakdown.performance || 0, color: [16, 185, 129] },
        { label: '内省段階', value: reportData.srlBreakdown.reflection || 0, color: [245, 158, 11] }
      ]

      const maxSRL = Math.max(...srlData.map(d => d.value), 1)
      const barWidth = pageWidth - 90

      srlData.forEach(item => {
        doc.setTextColor(0, 0, 0)
        doc.text(item.label, 20, yPosition + 4)
        
        // バーグラフ
        const width = (item.value / maxSRL) * barWidth
        doc.setFillColor(item.color[0], item.color[1], item.color[2])
        doc.roundedRect(70, yPosition, width, 6, 1, 1, 'F')
        
        // 数値
        doc.text(`${item.value}回`, 70 + width + 5, yPosition + 4)
        
        yPosition += 10
      })

      yPosition += 5
    }

    // ScTNスコアセクション
    if (reportData.sctnProgress) {
      // 新しいページが必要か確認
      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('ScTNスコア', 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      const sctnData = [
        { label: 'メタ認知', value: reportData.sctnProgress.metacognition_score || 0, color: [59, 130, 246] },
        { label: '自己調整', value: reportData.sctnProgress.self_regulation_score || 0, color: [16, 185, 129] },
        { label: '動機づけ', value: reportData.sctnProgress.motivation_score || 0, color: [245, 158, 11] }
      ]

      sctnData.forEach(item => {
        if (item.value > 0) {
          doc.setTextColor(0, 0, 0)
          doc.text(item.label, 20, yPosition + 4)
          
          // バーグラフ（最大5.0）
          const width = (item.value / 5.0) * (pageWidth - 90)
          doc.setFillColor(item.color[0], item.color[1], item.color[2])
          doc.roundedRect(70, yPosition, width, 6, 1, 1, 'F')
          
          // スコア
          doc.text(item.value.toFixed(1), 70 + width + 5, yPosition + 4)
          
          yPosition += 10
        }
      })

      yPosition += 5
    }

    // 学習方略トップ3
    if (reportData.topStrategies && reportData.topStrategies.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('効果的だった学習方略トップ3', 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      reportData.topStrategies.slice(0, 3).forEach((strategy, index) => {
        const rank = index + 1
        doc.setTextColor(0, 0, 0)
        doc.text(`${rank}. ${this.translateStrategyType(strategy.strategy_type)}`, 25, yPosition)
        doc.text(`効果: ${(strategy.avg_effectiveness || 0).toFixed(1)}/5.0`, 100, yPosition)
        doc.text(`使用回数: ${strategy.usage_count || 0}回`, 150, yPosition)
        yPosition += 7
      })

      yPosition += 5
    }

    // フッター
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`生成日時: ${new Date().toLocaleString('ja-JP')}`, 20, pageHeight - 10)
    doc.text('自由進度学習支援システム', pageWidth - 60, pageHeight - 10)

    return doc
  }

  /**
   * 月次レポートPDF生成
   */
  async generateMonthlyReportPDF(reportData, studentName = '児童') {
    await this.initialize()
    if (!this.jsPDF) {
      throw new Error('PDF生成ライブラリの初期化に失敗しました')
    }

    const doc = new this.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 20

    // タイトル
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('月次学習レポート', pageWidth / 2, yPosition, { align: 'center' })
    yPosition += 10

    // 生徒名と期間
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`児童名: ${studentName}`, 20, yPosition)
    yPosition += 7
    doc.text(`期間: ${this.formatMonth(reportData.monthStart)}`, 20, yPosition)
    yPosition += 15

    // 総合評価セクション
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('総合評価', 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const summaryData = [
      { label: '総復習回数', value: `${reportData.totalReviews || 0}回`, color: [59, 130, 246] },
      { label: '習得カード数', value: `${reportData.uniqueCards || 0}枚`, color: [16, 185, 129] },
      { label: '平均正答率', value: `${(reportData.avgAccuracy || 0).toFixed(1)}%`, color: [245, 158, 11] },
      { label: '総学習時間', value: `${Math.floor((reportData.totalTime || 0) / 3600)}時間`, color: [139, 92, 246] },
      { label: '学習効果', value: `${(reportData.avgQuality || 0).toFixed(2)}`, color: [236, 72, 153] },
      { label: '協働学習', value: `${reportData.collaboration?.answers_shared || 0}回`, color: [251, 146, 60] }
    ]

    const boxWidth = (pageWidth - 50) / 2
    const boxHeight = 20
    let xPos = 20

    summaryData.forEach((item, index) => {
      if (index % 2 === 0 && index > 0) {
        yPosition += boxHeight + 5
        xPos = 20
      }

      doc.setFillColor(item.color[0], item.color[1], item.color[2])
      doc.setDrawColor(item.color[0], item.color[1], item.color[2])
      doc.roundedRect(xPos, yPosition, boxWidth, boxHeight, 2, 2, 'S')

      doc.setTextColor(100, 100, 100)
      doc.setFontSize(8)
      doc.text(item.label, xPos + 5, yPosition + 7)

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(item.value, xPos + 5, yPosition + 15)
      doc.setFont('helvetica', 'normal')

      xPos += boxWidth + 10
    })

    yPosition += boxHeight + 20

    // 習熟度推移グラフ（簡易版テキスト）
    if (reportData.masteryTrend && reportData.masteryTrend.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('習熟度の推移', 20, yPosition)
      yPosition += 10

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('※ 詳細なグラフはWebダッシュボードでご確認ください', 20, yPosition)
      yPosition += 7

      // 最初と最後のデータポイント
      const first = reportData.masteryTrend[0]
      const last = reportData.masteryTrend[reportData.masteryTrend.length - 1]
      
      doc.text(`開始時: ${(first.avg_mastery || 0).toFixed(2)}`, 20, yPosition)
      yPosition += 6
      doc.text(`終了時: ${(last.avg_mastery || 0).toFixed(2)}`, 20, yPosition)
      yPosition += 6
      
      const improvement = ((last.avg_mastery || 0) - (first.avg_mastery || 0)).toFixed(2)
      doc.text(`向上: ${improvement > 0 ? '+' : ''}${improvement}`, 20, yPosition)
      yPosition += 15
    }

    // ScTN経年変化（最新スコア）
    if (reportData.sctnTrend && reportData.sctnTrend.length > 0) {
      const latest = reportData.sctnTrend[reportData.sctnTrend.length - 1]
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('ScTNスコア（最新）', 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      const sctnData = [
        { label: 'メタ認知', value: latest.metacognition || 0, color: [59, 130, 246] },
        { label: '自己調整', value: latest.self_regulation || 0, color: [16, 185, 129] },
        { label: '動機づけ', value: latest.motivation || 0, color: [245, 158, 11] },
        { label: '協働学習', value: latest.collaboration || 0, color: [236, 72, 153] }
      ]

      sctnData.forEach(item => {
        if (item.value > 0) {
          doc.setTextColor(0, 0, 0)
          doc.text(item.label, 20, yPosition + 4)
          
          const width = (item.value / 5.0) * (pageWidth - 90)
          doc.setFillColor(item.color[0], item.color[1], item.color[2])
          doc.roundedRect(70, yPosition, width, 6, 1, 1, 'F')
          
          doc.text(item.value.toFixed(1), 70 + width + 5, yPosition + 4)
          
          yPosition += 10
        }
      })

      yPosition += 10
    }

    // 協働学習の実績
    if (reportData.collaboration) {
      if (yPosition > pageHeight - 50) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('協働学習の実績', 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      doc.text(`共有した回答: ${reportData.collaboration.answers_shared || 0}件`, 20, yPosition)
      yPosition += 7
      doc.text(`評価した回答: ${reportData.collaboration.evaluations_given || 0}件`, 20, yPosition)
      yPosition += 7
      doc.text(`平均評価: ${(reportData.collaboration.avg_rating_received || 0).toFixed(1)}/5.0`, 20, yPosition)
      yPosition += 15
    }

    // フッター
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`生成日時: ${new Date().toLocaleString('ja-JP')}`, 20, pageHeight - 10)
    doc.text('自由進度学習支援システム', pageWidth - 60, pageHeight - 10)

    return doc
  }

  /**
   * PDFをダウンロード
   */
  downloadPDF(doc, filename) {
    doc.save(filename)
  }

  /**
   * 日付範囲フォーマット
   */
  formatDateRange(start, end) {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.getFullYear()}年${s.getMonth() + 1}月${s.getDate()}日 - ${e.getMonth() + 1}月${e.getDate()}日`
  }

  /**
   * 月フォーマット
   */
  formatMonth(dateString) {
    const date = new Date(dateString)
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  /**
   * 学習方略タイプを翻訳
   */
  translateStrategyType(type) {
    const translations = {
      'spaced_practice': '分散学習',
      'retrieval_practice': '検索練習',
      'interleaved_practice': '交互配置',
      'elaboration': '精緻化',
      'concrete_examples': '具体例',
      'dual_coding': '二重符号化'
    }
    return translations[type] || type
  }
}

// グローバルに公開
window.PDFGenerator = PDFGenerator
