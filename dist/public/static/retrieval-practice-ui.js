/**
 * 検索練習UI (Retrieval Practice UI)
 * 能動的想起・テスト効果
 * 2026-01-29 実装
 */

class RetrievalPracticeUI {
  constructor(config = {}) {
    this.studentId = config.studentId || 1
    this.apiBase = config.apiBase || '/api'
    this.currentSessionId = null
    this.currentCard = null
    this.startTime = null
  }

  /**
   * 検索練習セッション開始
   */
  async startSession(cardId, recallType = 'free_recall') {
    try {
      const response = await fetch(`${this.apiBase}/retrieval-practice/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: this.studentId,
          cardId: cardId,
          recallType: recallType
        })
      })

      const data = await response.json()
      if (data.success) {
        this.currentSessionId = data.sessionId
        this.currentCard = data.card
        this.startTime = Date.now()
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('検索練習セッション開始エラー:', error)
      this.showToast('セッション開始に失敗しました', 'error')
      return null
    }
  }

  /**
   * 検索練習問題表示
   */
  renderPracticeQuestion(containerId = 'retrieval-practice-container') {
    const container = document.getElementById(containerId)
    if (!container || !this.currentCard) {
      console.error('コンテナまたはカードが見つかりません')
      return
    }

    const recallTypes = {
      'free_recall': {
        title: '自由想起',
        icon: 'brain',
        description: '何も見ずに思い出して答えてください',
        placeholder: 'できるだけ詳しく思い出して書いてください...'
      },
      'cued_recall': {
        title: '手がかり想起',
        icon: 'lightbulb',
        description: 'ヒントを参考に思い出して答えてください',
        placeholder: 'ヒントを参考に答えを書いてください...'
      },
      'recognition': {
        title: '再認',
        icon: 'check-circle',
        description: '正しい答えを選んでください',
        placeholder: ''
      },
      'elaborative_recall': {
        title: '精緻化想起',
        icon: 'comments',
        description: '詳しく説明してください',
        placeholder: '理由や具体例を含めて詳しく説明してください...'
      }
    }

    const recallInfo = recallTypes[this.currentCard.recall_type] || recallTypes['free_recall']

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-${recallInfo.icon} text-blue-600 mr-2"></i>
              ${recallInfo.title}
            </h2>
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-600">
                <i class="fas fa-clock mr-1"></i>
                <span id="timer">00:00</span>
              </div>
              <div class="text-sm text-gray-600">
                カード ${this.currentCard.card_number}
              </div>
            </div>
          </div>
          <p class="text-gray-600 mb-4">${recallInfo.description}</p>
        </div>

        <div class="mb-6 p-6 bg-blue-50 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">
            ${this.currentCard.card_title}
          </h3>
          ${this.currentCard.problem_description ? `
            <div class="text-gray-700 mb-4">
              ${this.escapeHtml(this.currentCard.problem_description)}
            </div>
          ` : ''}
          ${this.currentCard.problem_image_url ? `
            <img src="${this.currentCard.problem_image_url}" alt="問題画像" class="max-w-full rounded-lg mb-4">
          ` : ''}
        </div>

        <div class="mb-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            あなたの回答
          </label>
          <textarea id="student-answer" rows="8" 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="${recallInfo.placeholder}"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              自信度（1-100）
            </label>
            <input type="range" id="confidence-rating" min="0" max="100" value="50" 
                   class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
            <div class="flex justify-between text-xs text-gray-600 mt-1">
              <span>全く自信なし</span>
              <span id="confidence-value" class="font-semibold">50</span>
              <span>完全に自信あり</span>
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              難易度（1-5）
            </label>
            <div class="flex items-center space-x-2">
              ${[1, 2, 3, 4, 5].map(i => `
                <button type="button" class="difficulty-btn w-12 h-12 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center font-semibold text-gray-700"
                        data-difficulty="${i}">
                  ${i}
                </button>
              `).join('')}
            </div>
            <input type="hidden" id="difficulty-rating" value="3">
          </div>
        </div>

        <div class="flex items-center justify-end space-x-3">
          <button id="btn-cancel" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fas fa-times mr-2"></i>
            キャンセル
          </button>
          <button id="btn-submit-answer" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <i class="fas fa-paper-plane mr-2"></i>
            回答を送信
          </button>
        </div>
      </div>
    `

    // タイマー開始
    this.startTimer()

    // 自信度スライダー
    const confidenceSlider = document.getElementById('confidence-rating')
    const confidenceValue = document.getElementById('confidence-value')
    confidenceSlider.addEventListener('input', (e) => {
      confidenceValue.textContent = e.target.value
    })

    // 難易度ボタン
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.difficulty-btn').forEach(b => {
          b.classList.remove('border-blue-500', 'bg-blue-100')
        })
        e.currentTarget.classList.add('border-blue-500', 'bg-blue-100')
        document.getElementById('difficulty-rating').value = e.currentTarget.dataset.difficulty
      })
    })

    // 送信ボタン
    document.getElementById('btn-submit-answer').addEventListener('click', () => {
      this.submitAnswer()
    })

    // キャンセルボタン
    document.getElementById('btn-cancel').addEventListener('click', () => {
      if (confirm('検索練習をキャンセルしますか？')) {
        container.innerHTML = ''
      }
    })
  }

  /**
   * タイマー開始
   */
  startTimer() {
    const timerElement = document.getElementById('timer')
    if (!timerElement) return

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }

    updateTimer()
    this.timerInterval = setInterval(updateTimer, 1000)
  }

  /**
   * タイマー停止
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
      this.timerInterval = null
    }
  }

  /**
   * 回答送信
   */
  async submitAnswer() {
    const answerText = document.getElementById('student-answer')?.value
    const confidence = parseInt(document.getElementById('confidence-rating')?.value || '50')
    const difficulty = parseInt(document.getElementById('difficulty-rating')?.value || '3')

    if (!answerText || answerText.trim() === '') {
      this.showToast('回答を入力してください', 'warning')
      return
    }

    const responseTime = Math.floor((Date.now() - this.startTime) / 1000)
    this.stopTimer()

    // 送信ボタンを無効化
    const submitBtn = document.getElementById('btn-submit-answer')
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>評価中...'
    }

    try {
      const response = await fetch(`${this.apiBase}/retrieval-practice/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.currentSessionId,
          studentAnswer: answerText,
          responseTime: responseTime,
          confidenceRating: confidence,
          difficultyRating: difficulty
        })
      })

      const data = await response.json()
      if (data.success) {
        this.showEvaluationResult(data.evaluation)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('回答送信エラー:', error)
      this.showToast('回答の送信に失敗しました', 'error')
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>回答を送信'
      }
    }
  }

  /**
   * 評価結果表示
   */
  showEvaluationResult(evaluation) {
    const container = document.getElementById('retrieval-practice-container')
    if (!container) return

    const overallScore = evaluation.overallScore
    const scoreColor = overallScore >= 80 ? 'green' : overallScore >= 60 ? 'yellow' : 'red'
    const scoreIcon = overallScore >= 80 ? 'check-circle' : overallScore >= 60 ? 'exclamation-circle' : 'times-circle'

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-24 h-24 bg-${scoreColor}-100 rounded-full mb-4">
            <i class="fas fa-${scoreIcon} text-5xl text-${scoreColor}-600"></i>
          </div>
          <h2 class="text-3xl font-bold text-gray-800 mb-2">
            総合スコア: ${overallScore.toFixed(1)}点
          </h2>
          <p class="text-gray-600">
            ${overallScore >= 80 ? '素晴らしい！よく理解しています' : 
              overallScore >= 60 ? 'もう少し復習しましょう' : 
              'さらに学習が必要です'}
          </p>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-8">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-3xl font-bold text-blue-600 mb-1">${evaluation.accuracyScore.toFixed(0)}</div>
            <div class="text-sm text-gray-600">正確性</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-3xl font-bold text-green-600 mb-1">${evaluation.completenessScore.toFixed(0)}</div>
            <div class="text-sm text-gray-600">完全性</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <div class="text-3xl font-bold text-purple-600 mb-1">${evaluation.precisionScore.toFixed(0)}</div>
            <div class="text-sm text-gray-600">精度</div>
          </div>
        </div>

        ${evaluation.metacognitionGap !== undefined ? `
          <div class="mb-8 p-4 ${Math.abs(evaluation.metacognitionGap) < 20 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border-2 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-2">
              <i class="fas fa-brain mr-2"></i>
              メタ認知ギャップ: ${evaluation.metacognitionGap > 0 ? '+' : ''}${evaluation.metacognitionGap.toFixed(1)}
            </h3>
            <p class="text-sm text-gray-700">
              ${Math.abs(evaluation.metacognitionGap) < 20 ? 
                '自己評価と実際の成績がほぼ一致しています。自分の理解度を正確に把握できています。' :
                evaluation.metacognitionGap > 0 ?
                '自信過剰気味です。もう少し慎重に自己評価しましょう。' :
                '自信不足です。実際にはよく理解できています。'}
            </p>
          </div>
        ` : ''}

        ${evaluation.feedback ? `
          <div class="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 class="font-semibold text-gray-800 mb-3">
              <i class="fas fa-comment-dots mr-2"></i>
              詳細フィードバック
            </h3>
            <div class="text-gray-700 whitespace-pre-wrap">${this.escapeHtml(evaluation.feedback)}</div>
          </div>
        ` : ''}

        <div class="flex items-center justify-center space-x-3">
          <button id="btn-view-answer" class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <i class="fas fa-eye mr-2"></i>
            正解を見る
          </button>
          <button id="btn-next-practice" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <i class="fas fa-forward mr-2"></i>
            次の練習へ
          </button>
          <button id="btn-finish" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fas fa-check mr-2"></i>
            終了
          </button>
        </div>
      </div>
    `

    // 正解を見るボタン
    document.getElementById('btn-view-answer')?.addEventListener('click', () => {
      this.showCorrectAnswer()
    })

    // 次の練習へボタン
    document.getElementById('btn-next-practice')?.addEventListener('click', () => {
      this.loadRecommendedCards()
    })

    // 終了ボタン
    document.getElementById('btn-finish')?.addEventListener('click', () => {
      container.innerHTML = ''
      this.showToast('お疲れ様でした！', 'success')
    })
  }

  /**
   * 正解表示
   */
  showCorrectAnswer() {
    if (!this.currentCard) return

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
            正解
          </h3>
          <button class="btn-close text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <div class="bg-green-50 p-6 rounded-lg">
          <pre class="whitespace-pre-wrap text-gray-700">${this.escapeHtml(this.currentCard.answer || '')}</pre>
        </div>
        ${this.currentCard.answer_image_url ? `
          <div class="mt-4">
            <img src="${this.currentCard.answer_image_url}" alt="解答画像" class="max-w-full rounded-lg">
          </div>
        ` : ''}
      </div>
    `

    document.body.appendChild(modal)

    modal.querySelector('.btn-close')?.addEventListener('click', () => {
      modal.remove()
    })

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
  }

  /**
   * 推奨カード読み込み
   */
  async loadRecommendedCards() {
    // 実装は省略（統合ダッシュボードで実装）
    this.showToast('推奨カードを読み込み中...', 'info')
  }

  /**
   * 統計表示
   */
  async renderStats(containerId = 'retrieval-stats-container') {
    const container = document.getElementById(containerId)
    if (!container) return

    try {
      const response = await fetch(`${this.apiBase}/retrieval-practice/stats/${this.studentId}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      const stats = data.stats

      container.innerHTML = `
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-blue-600">${stats.basic.total_sessions || 0}</div>
            <div class="text-sm text-gray-600 mt-1">総セッション数</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-green-600">${(stats.basic.avg_accuracy || 0).toFixed(1)}</div>
            <div class="text-sm text-gray-600 mt-1">平均正確性</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-purple-600">${(stats.basic.avg_completeness || 0).toFixed(1)}</div>
            <div class="text-sm text-gray-600 mt-1">平均完全性</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-orange-600">${(stats.basic.avg_precision || 0).toFixed(1)}</div>
            <div class="text-sm text-gray-600 mt-1">平均精度</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-pink-600">${Math.floor(stats.basic.avg_response_time || 0)}s</div>
            <div class="text-sm text-gray-600 mt-1">平均回答時間</div>
          </div>
          <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-indigo-600">${(stats.basic.avg_confidence || 0).toFixed(1)}</div>
            <div class="text-sm text-gray-600 mt-1">平均自信度</div>
          </div>
        </div>
      `
    } catch (error) {
      console.error('統計取得エラー:', error)
      container.innerHTML = '<p class="text-red-500">統計を読み込めませんでした</p>'
    }
  }

  /**
   * トースト通知
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
}

// グローバルに公開
window.RetrievalPracticeUI = RetrievalPracticeUI
