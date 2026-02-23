/**
 * 協働学習UI (Collaborative Learning UI)
 * 友達の回答比較・相互評価システム
 * 2026-01-29 実装
 */

class CollaborativeLearningUI {
  constructor(config = {}) {
    this.studentId = config.studentId || 1
    this.classCode = config.classCode || 'CLASS001'
    this.cardId = config.cardId || null
    this.apiBase = config.apiBase || '/api'
  }

  /**
   * 友達の回答一覧を取得して表示
   */
  async loadPeerAnswers(cardId) {
    this.cardId = cardId
    const container = document.getElementById('peer-answers-container')
    if (!container) {
      console.error('peer-answers-container が見つかりません')
      return
    }

    try {
      const response = await fetch(
        `${this.apiBase}/collaborative/peer-answers/${cardId}?studentId=${this.studentId}&classCode=${this.classCode}`
      )
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      this.renderPeerAnswers(data.answers, container)
    } catch (error) {
      console.error('友達の回答取得エラー:', error)
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          友達の回答を取得できませんでした
        </div>
      `
    }
  }

  /**
   * 友達の回答を表示
   */
  renderPeerAnswers(answers, container) {
    if (!answers || answers.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <i class="fas fa-users text-4xl mb-4"></i>
          <p>まだ友達の回答がありません</p>
        </div>
      `
      return
    }

    container.innerHTML = `
      <div class="space-y-4">
        ${answers.map(answer => this.renderPeerAnswerCard(answer)).join('')}
      </div>
    `

    // イベントリスナーを設定
    this.attachAnswerEventListeners()
  }

  /**
   * 個別の回答カードをレンダリング
   */
  renderPeerAnswerCard(answer) {
    const rating = parseFloat(answer.average_rating || 0)
    const stars = this.renderStars(rating)

    return `
      <div class="peer-answer-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow" data-answer-id="${answer.id}">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              ${answer.student_name.charAt(0)}
            </div>
            <div>
              <h4 class="font-semibold text-gray-800">${this.escapeHtml(answer.student_name)}</h4>
              <p class="text-sm text-gray-500">${answer.approach_type || '標準解法'}</p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="text-right">
              <div class="flex items-center space-x-1">
                ${stars}
              </div>
              <p class="text-xs text-gray-500 mt-1">${answer.evaluation_count}件の評価</p>
            </div>
          </div>
        </div>
        
        <div class="answer-content bg-gray-50 rounded-lg p-4 mb-4">
          <pre class="whitespace-pre-wrap text-sm text-gray-700 font-mono">${this.escapeHtml(answer.answer_text)}</pre>
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4 text-sm text-gray-600">
            <span><i class="fas fa-eye"></i> ${answer.view_count}</span>
            <span><i class="fas fa-thumbs-up"></i> ${answer.helpful_count}</span>
            <span class="text-xs">${this.formatDate(answer.created_at)}</span>
          </div>
          <div class="flex items-center space-x-2">
            <button class="btn-helpful px-4 py-2 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    data-answer-id="${answer.id}">
              <i class="fas fa-thumbs-up"></i> 役に立った
            </button>
            <button class="btn-evaluate px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    data-answer-id="${answer.id}">
              <i class="fas fa-star"></i> 評価する
            </button>
          </div>
        </div>
      </div>
    `
  }

  /**
   * 星評価を表示
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    let stars = ''
    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star text-yellow-400"></i>'
    }
    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt text-yellow-400"></i>'
    }
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star text-gray-300"></i>'
    }
    return stars
  }

  /**
   * イベントリスナーを設定
   */
  attachAnswerEventListeners() {
    // 役に立ったボタン
    document.querySelectorAll('.btn-helpful').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const answerId = e.currentTarget.dataset.answerId
        await this.toggleHelpful(answerId)
      })
    })

    // 評価ボタン
    document.querySelectorAll('.btn-evaluate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const answerId = e.currentTarget.dataset.answerId
        this.showEvaluationModal(answerId)
      })
    })

    // 回答カードのクリックで閲覧記録
    document.querySelectorAll('.peer-answer-card').forEach(card => {
      const answerId = card.dataset.answerId
      let viewStartTime = Date.now()

      card.addEventListener('mouseenter', () => {
        viewStartTime = Date.now()
      })

      card.addEventListener('mouseleave', () => {
        const duration = Date.now() - viewStartTime
        if (duration > 1000) { // 1秒以上閲覧した場合
          this.recordView(answerId, duration)
        }
      })
    })
  }

  /**
   * 役に立ったマークを切り替え
   */
  async toggleHelpful(answerId) {
    try {
      const response = await fetch(`${this.apiBase}/collaborative/toggle-helpful`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: this.studentId,
          answerId: parseInt(answerId)
        })
      })

      const data = await response.json()
      if (data.success) {
        this.showToast(data.message, 'success')
        await this.loadPeerAnswers(this.cardId)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('役に立ったマーク切り替えエラー:', error)
      this.showToast('エラーが発生しました', 'error')
    }
  }

  /**
   * 評価モーダルを表示
   */
  showEvaluationModal(answerId) {
    const modal = document.getElementById('evaluation-modal')
    if (!modal) {
      console.error('evaluation-modal が見つかりません')
      return
    }

    modal.innerHTML = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-star text-yellow-400 mr-2"></i>
              友達の回答を評価
            </h3>
            <button class="btn-close text-gray-400 hover:text-gray-600" onclick="document.getElementById('evaluation-modal').innerHTML = ''">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <form id="evaluation-form" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                総合評価 <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center space-x-2">
                ${[1, 2, 3, 4, 5].map(i => `
                  <button type="button" class="star-btn text-3xl text-gray-300 hover:text-yellow-400 transition-colors" data-rating="${i}">
                    <i class="far fa-star"></i>
                  </button>
                `).join('')}
              </div>
              <input type="hidden" name="rating" id="rating-input" required>
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                良かった点
              </label>
              <textarea name="helpfulAspects" rows="3" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="どんなところが役に立ちましたか？"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                詳しいフィードバック
              </label>
              <textarea name="feedbackText" rows="4" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="この回答を見て気づいたこと、感じたことを書いてください"></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                学んだこと
              </label>
              <textarea name="learningGained" rows="3" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="この回答から何を学びましたか？"></textarea>
            </div>
            
            <div class="flex items-center justify-end space-x-3 pt-4">
              <button type="button" class="btn-cancel px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                キャンセル
              </button>
              <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <i class="fas fa-paper-plane mr-2"></i>
                評価を送信
              </button>
            </div>
          </form>
        </div>
      </div>
    `

    modal.style.display = 'block'

    // 星評価のイベントリスナー
    const starButtons = modal.querySelectorAll('.star-btn')
    starButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const rating = index + 1
        document.getElementById('rating-input').value = rating
        
        // 星の表示を更新
        starButtons.forEach((b, i) => {
          const icon = b.querySelector('i')
          if (i <= index) {
            icon.classList.remove('far', 'text-gray-300')
            icon.classList.add('fas', 'text-yellow-400')
          } else {
            icon.classList.remove('fas', 'text-yellow-400')
            icon.classList.add('far', 'text-gray-300')
          }
        })
      })
    })

    // フォーム送信
    const form = modal.querySelector('#evaluation-form')
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await this.submitEvaluation(answerId, new FormData(form))
      modal.innerHTML = ''
    })

    // キャンセルボタン
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
      modal.innerHTML = ''
    })
  }

  /**
   * 評価を送信
   */
  async submitEvaluation(answerId, formData) {
    try {
      const response = await fetch(`${this.apiBase}/collaborative/submit-evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluatorId: this.studentId,
          answerId: parseInt(answerId),
          rating: parseInt(formData.get('rating')),
          feedbackText: formData.get('feedbackText'),
          helpfulAspects: formData.get('helpfulAspects'),
          learningGained: formData.get('learningGained')
        })
      })

      const data = await response.json()
      if (data.success) {
        this.showToast(data.message, 'success')
        await this.loadPeerAnswers(this.cardId)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('評価送信エラー:', error)
      this.showToast('評価の送信に失敗しました', 'error')
    }
  }

  /**
   * 閲覧記録を保存
   */
  async recordView(answerId, duration) {
    try {
      await fetch(`${this.apiBase}/collaborative/record-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerId: this.studentId,
          answerId: parseInt(answerId),
          viewDuration: Math.floor(duration / 1000) // 秒単位
        })
      })
    } catch (error) {
      console.error('閲覧記録エラー:', error)
    }
  }

  /**
   * 自分の回答を投稿
   */
  async submitMyAnswer(cardId, answerText, approachType = '標準解法', isPublic = true) {
    try {
      const response = await fetch(`${this.apiBase}/collaborative/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: this.studentId,
          cardId: parseInt(cardId),
          answerText: answerText,
          approachType: approachType,
          isPublic: isPublic
        })
      })

      const data = await response.json()
      if (data.success) {
        this.showToast(data.message, 'success')
        return true
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('回答投稿エラー:', error)
      this.showToast('回答の投稿に失敗しました', 'error')
      return false
    }
  }

  /**
   * 協働学習統計を取得
   */
  async loadStats() {
    try {
      const response = await fetch(`${this.apiBase}/collaborative/stats/${this.studentId}`)
      const data = await response.json()

      if (data.success) {
        return data.stats
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('統計取得エラー:', error)
      return null
    }
  }

  /**
   * 統計を表示
   */
  async renderStats(containerId = 'collaboration-stats') {
    const container = document.getElementById(containerId)
    if (!container) return

    const stats = await this.loadStats()
    if (!stats) {
      container.innerHTML = '<p class="text-red-500">統計を読み込めませんでした</p>'
      return
    }

    container.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div class="stat-card bg-white rounded-lg shadow p-4 text-center">
          <div class="text-3xl font-bold text-blue-600">${stats.totalAnswers}</div>
          <div class="text-sm text-gray-600 mt-1">投稿した回答</div>
        </div>
        <div class="stat-card bg-white rounded-lg shadow p-4 text-center">
          <div class="text-3xl font-bold text-green-600">${stats.evaluationsGiven}</div>
          <div class="text-sm text-gray-600 mt-1">評価した回数</div>
        </div>
        <div class="stat-card bg-white rounded-lg shadow p-4 text-center">
          <div class="text-3xl font-bold text-purple-600">${stats.answersViewed}</div>
          <div class="text-sm text-gray-600 mt-1">閲覧した回答</div>
        </div>
        <div class="stat-card bg-white rounded-lg shadow p-4 text-center">
          <div class="text-3xl font-bold text-yellow-600">${stats.helpfulReceived}</div>
          <div class="text-sm text-gray-600 mt-1">役に立ったマーク</div>
        </div>
        <div class="stat-card bg-white rounded-lg shadow p-4 text-center">
          <div class="text-3xl font-bold text-orange-600">${stats.publicAnswers}</div>
          <div class="text-sm text-gray-600 mt-1">公開した回答</div>
        </div>
        <div class="stat-card bg-white rounded-lg shadow p-4 text-center">
          <div class="text-3xl font-bold text-pink-600">${stats.averageRating.toFixed(1)}</div>
          <div class="text-sm text-gray-600 mt-1">平均評価</div>
        </div>
      </div>
    `
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

  /**
   * HTMLエスケープ
   */
  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * 日付フォーマット
   */
  formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return '今日'
    if (days === 1) return '昨日'
    if (days < 7) return `${days}日前`
    if (days < 30) return `${Math.floor(days / 7)}週間前`
    return date.toLocaleDateString('ja-JP')
  }
}

// グローバルに公開
window.CollaborativeLearningUI = CollaborativeLearningUI
