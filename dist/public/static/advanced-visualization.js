/**
 * 高度なデータ可視化 (Advanced Data Visualization)
 * Chart.jsを使用した詳細なグラフとチャート
 * 2026-01-29 実装
 */

class AdvancedVisualization {
  constructor(config = {}) {
    this.studentId = config.studentId || 1
    this.apiBase = config.apiBase || '/api'
    this.chartInstances = {}
  }

  /**
   * 学習方略効果比較グラフ
   */
  async renderStrategyEffectivenessChart(canvasId = 'strategy-effectiveness-chart') {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`${canvasId} が見つかりません`)
      return
    }

    try {
      // データ取得（デモデータ）
      const strategies = [
        { name: '分散学習', effectiveness: 4.5, usage: 120 },
        { name: '検索練習', effectiveness: 4.2, usage: 85 },
        { name: '交互配置', effectiveness: 4.0, usage: 60 },
        { name: '協働学習', effectiveness: 4.3, usage: 95 },
        { name: '精緻化', effectiveness: 3.8, usage: 40 },
        { name: '二重符号化', effectiveness: 3.9, usage: 50 }
      ]

      const ctx = canvas.getContext('2d')
      
      if (this.chartInstances[canvasId]) {
        this.chartInstances[canvasId].destroy()
      }

      this.chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: strategies.map(s => s.name),
          datasets: [
            {
              label: '効果スコア',
              data: strategies.map(s => s.effectiveness),
              backgroundColor: 'rgba(59, 130, 246, 0.7)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2,
              yAxisID: 'y'
            },
            {
              label: '使用回数',
              data: strategies.map(s => s.usage),
              backgroundColor: 'rgba(16, 185, 129, 0.7)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 2,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              min: 0,
              max: 5,
              title: {
                display: true,
                text: '効果スコア (1-5)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              min: 0,
              title: {
                display: true,
                text: '使用回数'
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
              intersect: false
            }
          }
        }
      })
    } catch (error) {
      console.error('学習方略効果比較グラフエラー:', error)
    }
  }

  /**
   * 学習時間の分布（ヒートマップ風）
   */
  async renderStudyTimeHeatmap(canvasId = 'study-time-heatmap', days = 30) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`${canvasId} が見つかりません`)
      return
    }

    try {
      // デモデータ生成
      const today = new Date()
      const data = []
      const labels = []

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        labels.push(date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }))
        
        // ランダムな学習時間（0-120分）
        data.push(Math.floor(Math.random() * 120))
      }

      const ctx = canvas.getContext('2d')
      
      if (this.chartInstances[canvasId]) {
        this.chartInstances[canvasId].destroy()
      }

      this.chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: '学習時間（分）',
            data: data,
            backgroundColor: data.map(value => {
              if (value >= 90) return 'rgba(16, 185, 129, 0.8)'
              if (value >= 60) return 'rgba(59, 130, 246, 0.8)'
              if (value >= 30) return 'rgba(245, 158, 11, 0.8)'
              return 'rgba(239, 68, 68, 0.8)'
            }),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              display: true,
              grid: {
                display: false
              }
            },
            y: {
              display: true,
              min: 0,
              title: {
                display: true,
                text: '学習時間（分）'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `学習時間: ${context.parsed.y}分`
                }
              }
            }
          }
        }
      })
    } catch (error) {
      console.error('学習時間ヒートマップエラー:', error)
    }
  }

  /**
   * 概念習熟度レーダーチャート
   */
  async renderConceptMasteryRadar(canvasId = 'concept-mastery-radar') {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`${canvasId} が見つかりません`)
      return
    }

    try {
      // デモデータ
      const concepts = [
        { name: '数と計算', mastery: 0.85 },
        { name: '図形', mastery: 0.72 },
        { name: '測定', mastery: 0.68 },
        { name: 'データ活用', mastery: 0.78 },
        { name: '変化と関係', mastery: 0.65 }
      ]

      const ctx = canvas.getContext('2d')
      
      if (this.chartInstances[canvasId]) {
        this.chartInstances[canvasId].destroy()
      }

      this.chartInstances[canvasId] = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: concepts.map(c => c.name),
          datasets: [{
            label: '習熟度',
            data: concepts.map(c => c.mastery),
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(139, 92, 246, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(139, 92, 246, 1)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0,
              max: 1,
              ticks: {
                stepSize: 0.2
              }
            }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top'
            }
          }
        }
      })
    } catch (error) {
      console.error('概念習熟度レーダーチャートエラー:', error)
    }
  }

  /**
   * 学習進捗の累積グラフ
   */
  async renderCumulativeProgressChart(canvasId = 'cumulative-progress-chart', days = 30) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`${canvasId} が見つかりません`)
      return
    }

    try {
      const today = new Date()
      const dates = []
      const cumulativeCards = []
      const cumulativeTime = []

      let totalCards = 0
      let totalTime = 0

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        dates.push(date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }))
        
        // 日々の増加
        totalCards += Math.floor(Math.random() * 5)
        totalTime += Math.floor(Math.random() * 60)
        
        cumulativeCards.push(totalCards)
        cumulativeTime.push(totalTime)
      }

      const ctx = canvas.getContext('2d')
      
      if (this.chartInstances[canvasId]) {
        this.chartInstances[canvasId].destroy()
      }

      this.chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: '累積習得カード数',
              data: cumulativeCards,
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              tension: 0.4,
              yAxisID: 'y'
            },
            {
              label: '累積学習時間（分）',
              data: cumulativeTime,
              borderColor: 'rgba(16, 185, 129, 1)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              min: 0,
              title: {
                display: true,
                text: '習得カード数'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              min: 0,
              title: {
                display: true,
                text: '学習時間（分）'
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
              intersect: false
            }
          }
        }
      })
    } catch (error) {
      console.error('累積進捗グラフエラー:', error)
    }
  }

  /**
   * 正答率の推移（移動平均付き）
   */
  async renderAccuracyTrendChart(canvasId = 'accuracy-trend-chart', days = 30) {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`${canvasId} が見つかりません`)
      return
    }

    try {
      const today = new Date()
      const dates = []
      const accuracyData = []
      const movingAverage = []

      // データ生成
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        dates.push(date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }))
        
        // ランダムな正答率（60-95%、徐々に向上する傾向）
        const baseAccuracy = 60 + ((days - i) / days) * 20
        const accuracy = baseAccuracy + Math.random() * 15
        accuracyData.push(accuracy)
        
        // 7日移動平均
        if (accuracyData.length >= 7) {
          const avg = accuracyData.slice(-7).reduce((a, b) => a + b) / 7
          movingAverage.push(avg)
        } else {
          movingAverage.push(null)
        }
      }

      const ctx = canvas.getContext('2d')
      
      if (this.chartInstances[canvasId]) {
        this.chartInstances[canvasId].destroy()
      }

      this.chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: '日次正答率',
              data: accuracyData,
              borderColor: 'rgba(245, 158, 11, 0.5)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderWidth: 1,
              pointRadius: 2,
              fill: false
            },
            {
              label: '7日移動平均',
              data: movingAverage,
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0)',
              borderWidth: 3,
              pointRadius: 0,
              fill: false,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0,
              max: 100,
              title: {
                display: true,
                text: '正答率 (%)'
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
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
                }
              }
            }
          }
        }
      })
    } catch (error) {
      console.error('正答率推移グラフエラー:', error)
    }
  }

  /**
   * 学習セッション分布（ドーナツチャート）
   */
  async renderSessionDistributionChart(canvasId = 'session-distribution-chart') {
    const canvas = document.getElementById(canvasId)
    if (!canvas) {
      console.error(`${canvasId} が見つかりません`)
      return
    }

    try {
      const data = {
        labels: ['分散学習', '検索練習', '交互配置', '協働学習', 'その他'],
        datasets: [{
          data: [35, 25, 20, 15, 5],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(156, 163, 175, 0.8)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      }

      const ctx = canvas.getContext('2d')
      
      if (this.chartInstances[canvasId]) {
        this.chartInstances[canvasId].destroy()
      }

      this.chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'right'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.parsed
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return `${label}: ${value}回 (${percentage}%)`
                }
              }
            }
          }
        }
      })
    } catch (error) {
      console.error('セッション分布チャートエラー:', error)
    }
  }

  /**
   * すべてのグラフを一度に描画
   */
  async renderAllCharts() {
    await Promise.all([
      this.renderStrategyEffectivenessChart(),
      this.renderStudyTimeHeatmap(),
      this.renderConceptMasteryRadar(),
      this.renderCumulativeProgressChart(),
      this.renderAccuracyTrendChart(),
      this.renderSessionDistributionChart()
    ])
  }

  /**
   * チャートを破棄
   */
  destroyChart(canvasId) {
    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy()
      delete this.chartInstances[canvasId]
    }
  }

  /**
   * すべてのチャートを破棄
   */
  destroyAllCharts() {
    Object.keys(this.chartInstances).forEach(canvasId => {
      this.destroyChart(canvasId)
    })
  }
}

// グローバルに公開
window.AdvancedVisualization = AdvancedVisualization
