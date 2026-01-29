/**
 * 学習レポートUI (Learning Reports UI)
 * 週次・月次レポート、ScTN経年変化グラフ
 * 2026-01-29 実装
 */

class LearningReportsUI {
  constructor(config = {}) {
    this.studentId = config.studentId || 1
    this.apiBase = config.apiBase || '/api'
    this.chartInstances = {}
  }

  /**
   * 週次レポートを生成
   */
  async generateWeeklyReport(weekStart, weekEnd) {
    try {
      const response = await fetch(`${this.apiBase}/reports/weekly/${this.studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, weekEnd })
      })

      const data = await response.json()
      if (data.success) {
        this.showToast('週次レポートを生成しました', 'success')
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('週次レポート生成エラー:', error)
      this.showToast('レポート生成に失敗しました', 'error')
      return null
    }
  }

  /**
   * 月次レポートを生成
   */
  async generateMonthlyReport(monthStart, monthEnd) {
    try {
      const response = await fetch(`${this.apiBase}/reports/monthly/${this.studentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthStart, monthEnd })
      })

      const data = await response.json()
      if (data.success) {
        this.showToast('月次レポートを生成しました', 'success')
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('月次レポート生成エラー:', error)
      this.showToast('レポート生成に失敗しました', 'error')
      return null
    }
  }

  /**
   * 週次レポート一覧を表示
   */
  async renderWeeklyReports(containerId = 'weekly-reports-container', limit = 12) {
    const container = document.getElementById(containerId)
    if (!container) {
      console.error(`${containerId} が見つかりません`)
      return
    }

    try {
      const response = await fetch(`${this.apiBase}/reports/weekly/${this.studentId}/list?limit=${limit}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      if (!data.reports || data.reports.length === 0) {
        container.innerHTML = `
          <div class="text-center text-gray-500 py-8">
            <i class="fas fa-chart-line text-4xl mb-4"></i>
            <p>まだ週次レポートがありません</p>
            <button class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    onclick="learningReportsUI.generateCurrentWeekReport()">
              <i class="fas fa-plus mr-2"></i>
              今週のレポートを作成
            </button>
          </div>
        `
        return
      }

      container.innerHTML = `
        <div class="space-y-4">
          ${data.reports.map(report => this.renderWeeklyReportCard(report)).join('')}
        </div>
      `
    } catch (error) {
      console.error('週次レポート一覧取得エラー:', error)
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          週次レポートを取得できませんでした
        </div>
      `
    }
  }

  /**
   * 週次レポートカードをレンダリング
   */
  renderWeeklyReportCard(report) {
    const accuracy = (report.average_accuracy * 100).toFixed(1)
    const studyHours = (report.total_study_time / 3600).toFixed(1)

    return `
      <div class="weekly-report-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-lg font-bold text-gray-800">
              ${this.formatDateRange(report.week_start_date, report.week_end_date)}
            </h4>
            <p class="text-sm text-gray-500">週次レポート</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-600">${report.cards_reviewed}</div>
            <div class="text-xs text-gray-500">カード復習数</div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="text-center">
            <div class="text-xl font-semibold text-green-600">${accuracy}%</div>
            <div class="text-xs text-gray-600">正答率</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold text-purple-600">${studyHours}h</div>
            <div class="text-xs text-gray-600">学習時間</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold text-orange-600">${report.spaced_learning_reviews}</div>
            <div class="text-xs text-gray-600">分散学習</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold text-pink-600">
              ${report.sctn_metacognition_score ? report.sctn_metacognition_score.toFixed(1) : '-'}
            </div>
            <div class="text-xs text-gray-600">メタ認知</div>
          </div>
        </div>
        
        <div class="flex items-center justify-end space-x-2">
          <button class="btn-view-detail px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  data-report-id="${report.id}">
            <i class="fas fa-eye mr-1"></i>
            詳細を見る
          </button>
        </div>
      </div>
    `
  }

  /**
   * 月次レポート一覧を表示
   */
  async renderMonthlyReports(containerId = 'monthly-reports-container', limit = 12) {
    const container = document.getElementById(containerId)
    if (!container) {
      console.error(`${containerId} が見つかりません`)
      return
    }

    try {
      const response = await fetch(`${this.apiBase}/reports/monthly/${this.studentId}/list?limit=${limit}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      if (!data.reports || data.reports.length === 0) {
        container.innerHTML = `
          <div class="text-center text-gray-500 py-8">
            <i class="fas fa-calendar-alt text-4xl mb-4"></i>
            <p>まだ月次レポートがありません</p>
          </div>
        `
        return
      }

      container.innerHTML = `
        <div class="space-y-4">
          ${data.reports.map(report => this.renderMonthlyReportCard(report)).join('')}
        </div>
      `
    } catch (error) {
      console.error('月次レポート一覧取得エラー:', error)
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          月次レポートを取得できませんでした
        </div>
      `
    }
  }

  /**
   * 月次レポートカードをレンダリング
   */
  renderMonthlyReportCard(report) {
    const accuracy = (report.average_accuracy * 100).toFixed(1)
    const studyHours = (report.total_study_time / 3600).toFixed(1)

    return `
      <div class="monthly-report-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="text-lg font-bold text-gray-800">
              ${this.formatMonth(report.month_start_date)}
            </h4>
            <p class="text-sm text-gray-500">月次レポート</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-blue-600">${report.cards_mastered}</div>
            <div class="text-xs text-gray-500">習得カード数</div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="text-center">
            <div class="text-xl font-semibold text-green-600">${accuracy}%</div>
            <div class="text-xs text-gray-600">平均正答率</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold text-purple-600">${studyHours}h</div>
            <div class="text-xs text-gray-600">総学習時間</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold text-orange-600">
              ${report.spaced_learning_effectiveness.toFixed(2)}
            </div>
            <div class="text-xs text-gray-600">学習効果</div>
          </div>
          <div class="text-center">
            <div class="text-xl font-semibold text-pink-600">${report.collaboration_score}</div>
            <div class="text-xs text-gray-600">協働学習</div>
          </div>
        </div>
        
        <div class="flex items-center justify-end space-x-2">
          <button class="btn-download-pdf px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  data-report-id="${report.id}">
            <i class="fas fa-file-pdf mr-1"></i>
            PDF出力
          </button>
          <button class="btn-view-detail px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  data-report-id="${report.id}">
            <i class="fas fa-eye mr-1"></i>
            詳細を見る
          </button>
        </div>
      </div>
    `
  }

  /**
   * ScTN経年変化グラフを表示
   */
  async renderScTNTrendChart(canvasId = 'sctn-trend-chart', months = 12) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`${canvasId} が見つかりません`)
      return
    }

    try {
      const response = await fetch(`${this.apiBase}/reports/sctn-trend/${this.studentId}?months=${months}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Chart.jsでグラフを描画
      const ctx = canvas.getContext('2d')
      
      // 既存のチャートを破棄
      if (this.chartInstances[canvasId]) {
        this.chartInstances[canvasId].destroy()
      }

      const dimensions = ['metacognition', 'self_regulation', 'motivation', 'collaboration']
      const colors = {
        metacognition: '#3B82F6',
        self_regulation: '#10B981',
        motivation: '#F59E0B',
        collaboration: '#EC4899'
      }
      const labels = {
        metacognition: 'メタ認知',
        self_regulation: '自己調整',
        motivation: '動機づけ',
        collaboration: '協働学習'
      }

      const datasets = dimensions.map(dim => {
        const dimData = data.trend[dim] || []
        return {
          label: labels[dim],
          data: dimData.map(d => ({
            x: d.date,
            y: d.score
          })),
          borderColor: colors[dim],
          backgroundColor: colors[dim] + '20',
          tension: 0.4,
          fill: false
        }
      }).filter(ds => ds.data.length > 0)

      this.chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'week',
                displayFormats: {
                  week: 'MM/DD'
                }
              },
              title: {
                display: true,
                text: '日付'
              }
            },
            y: {
              min: 0,
              max: 5,
              title: {
                display: true,
                text: 'スコア'
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          }
        }
      })
    } catch (error) {
      console.error('ScTN経年変化グラフ表示エラー:', error)
    }
  }

  /**
   * 習熟度推移グラフを表示
   */
  async renderMasteryTrendChart(canvasId = 'mastery-trend-chart', days = 30) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`${canvasId} が見つかりません`)
      return
    }

    try {
      const response = await fetch(`${this.apiBase}/reports/mastery-trend/${this.studentId}?days=${days}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      const ctx = canvas.getContext('2d')
      
      if (this.chartInstances[canvasId]) {
        this.chartInstances[canvasId].destroy()
      }

      const chartData = data.trend.map(item => ({
        x: item.review_date,
        y: item.avg_mastery,
        accuracy: item.accuracy,
        cardsReviewed: item.cards_reviewed
      }))

      this.chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: '平均習熟度',
              data: chartData,
              borderColor: '#8B5CF6',
              backgroundColor: '#8B5CF620',
              tension: 0.4,
              fill: true,
              yAxisID: 'y'
            },
            {
              label: '正答率',
              data: chartData.map(d => ({ x: d.x, y: d.accuracy * 100 })),
              borderColor: '#10B981',
              backgroundColor: '#10B98120',
              tension: 0.4,
              fill: false,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'day',
                displayFormats: {
                  day: 'MM/DD'
                }
              },
              title: {
                display: true,
                text: '日付'
              }
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              min: 0,
              max: 1,
              title: {
                display: true,
                text: '習熟度'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              min: 0,
              max: 100,
              title: {
                display: true,
                text: '正答率 (%)'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top'
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                afterLabel: function(context) {
                  const item = chartData[context.dataIndex]
                  return `復習カード数: ${item.cardsReviewed}`
                }
              }
            }
          }
        }
      })
    } catch (error) {
      console.error('習熟度推移グラフ表示エラー:', error)
    }
  }

  /**
   * 今週のレポートを生成
   */
  async generateCurrentWeekReport() {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // 日曜日
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // 土曜日

    const report = await this.generateWeeklyReport(
      weekStart.toISOString().split('T')[0],
      weekEnd.toISOString().split('T')[0]
    )

    if (report) {
      await this.renderWeeklyReports()
    }
  }

  /**
   * 今月のレポートを生成
   */
  async generateCurrentMonthReport() {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const report = await this.generateMonthlyReport(
      monthStart.toISOString().split('T')[0],
      monthEnd.toISOString().split('T')[0]
    )

    if (report) {
      await this.renderMonthlyReports()
    }
  }

  /**
   * 日付範囲フォーマット
   */
  formatDateRange(start, end) {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
  }

  /**
   * 月フォーマット
   */
  formatMonth(dateString) {
    const date = new Date(dateString)
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  /**
   * トースト通知を表示
   */
  showToast(message, type = 'info') {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      info: 'bg-blue-500',
      warning: 'bg-yellow-500'
    }

    const toast = document.createElement('div')
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300`
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
    `

    document.body.appendChild(toast)

    setTimeout(() => {
      toast.style.opacity = '0'
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  }
}

// グローバルに公開
window.LearningReportsUI = LearningReportsUI
