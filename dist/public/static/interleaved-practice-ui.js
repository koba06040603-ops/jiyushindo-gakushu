/**
 * 交互配置練習UI (Interleaved Practice UI)
 * 概念混合学習・識別能力向上
 * 2026-01-29 実装
 */

class InterleavedPracticeUI {
  constructor(config = {}) {
    this.studentId = config.studentId || 1
    this.apiBase = config.apiBase || '/api'
    this.currentSessionId = null
    this.currentProblem = null
    this.problemIndex = 0
    this.totalProblems = 0
  }

  /**
   * 交互配置セッション開始
   */
  async startSession(strategy = 'adaptive_interleaving') {
    try {
      const response = await fetch(`${this.apiBase}/interleaved-practice/start-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: this.studentId,
          interleavingStrategy: strategy
        })
      })

      const data = await response.json()
      if (data.success) {
        this.currentSessionId = data.sessionId
        this.totalProblems = data.totalProblems
        this.problemIndex = 0
        this.showToast('交互配置練習セッションを開始しました', 'success')
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('交互配置セッション開始エラー:', error)
      this.showToast('セッション開始に失敗しました', 'error')
      return null
    }
  }

  /**
   * 問題表示
   */
  renderProblem(problem, containerId = 'interleaved-practice-container') {
    const container = document.getElementById(containerId)
    if (!container || !problem) {
      console.error('コンテナまたは問題が見つかりません')
      return
    }

    this.currentProblem = problem
    this.problemIndex++

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-random text-purple-600 mr-2"></i>
            交互配置練習
          </h2>
          <div class="text-sm text-gray-600">
            問題 ${this.problemIndex} / ${this.totalProblems}
          </div>
        </div>

        <div class="mb-4">
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                 style="width: ${(this.problemIndex / this.totalProblems) * 100}%"></div>
          </div>
        </div>

        <div class="mb-6 p-6 bg-purple-50 rounded-lg">
          <h3 class="text-lg font-semibold text-gray-800 mb-3">
            ${problem.card_title || '問題'}
          </h3>
          ${problem.problem_description ? `
            <div class="text-gray-700 mb-4">
              ${this.escapeHtml(problem.problem_description)}
            </div>
          ` : ''}
          ${problem.problem_image_url ? `
            <img src="${problem.problem_image_url}" alt="問題画像" class="max-w-full rounded-lg">
          ` : ''}
        </div>

        <div class="mb-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            あなたの回答
          </label>
          <textarea id="problem-answer" rows="6" 
                    class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="回答を入力してください..."></textarea>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            この問題の概念は何ですか？
          </label>
          <select id="identified-concept" 
                  class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="">概念を選択してください</option>
            <option value="algebra">代数</option>
            <option value="geometry">幾何</option>
            <option value="arithmetic">算術</option>
            <option value="statistics">統計</option>
            <option value="measurement">測定</option>
            <option value="other">その他</option>
          </select>
        </div>

        <div class="flex items-center justify-end space-x-3">
          <button id="btn-skip" class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="fas fa-forward mr-2"></i>
            スキップ
          </button>
          <button id="btn-submit-problem" class="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <i class="fas fa-check mr-2"></i>
            回答を送信
          </button>
        </div>
      </div>
    `

    // 送信ボタン
    document.getElementById('btn-submit-problem')?.addEventListener('click', () => {
      this.submitProblemAnswer()
    })

    // スキップボタン
    document.getElementById('btn-skip')?.addEventListener('click', () => {
      if (confirm('この問題をスキップしますか？')) {
        this.submitProblemAnswer(true)
      }
    })
  }

  /**
   * 問題回答送信
   */
  async submitProblemAnswer(isSkipped = false) {
    const answerText = document.getElementById('problem-answer')?.value
    const identifiedConcept = document.getElementById('identified-concept')?.value

    if (!isSkipped && (!answerText || answerText.trim() === '')) {
      this.showToast('回答を入力してください', 'warning')
      return
    }

    if (!isSkipped && !identifiedConcept) {
      this.showToast('概念を選択してください', 'warning')
      return
    }

    const submitBtn = document.getElementById('btn-submit-problem')
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>送信中...'
    }

    try {
      const response = await fetch(`${this.apiBase}/interleaved-practice/submit-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.currentSessionId,
          problemId: this.currentProblem.id,
          isCorrect: isSkipped ? 0 : 1, // 簡易評価（実際はAI評価が必要）
          responseTime: 60, // 仮の値
          identifiedConcept: identifiedConcept || 'unknown',
          confusedConcepts: null
        })
      })

      const data = await response.json()
      if (data.success) {
        if (data.sessionCompleted) {
          this.showSessionComplete()
        } else {
          this.renderProblem(data.nextProblem)
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('問題回答送信エラー:', error)
      this.showToast('回答の送信に失敗しました', 'error')
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.innerHTML = '<i class="fas fa-check mr-2"></i>回答を送信'
      }
    }
  }

  /**
   * セッション完了表示
   */
  showSessionComplete() {
    const container = document.getElementById('interleaved-practice-container')
    if (!container) return

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <div class="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
          <i class="fas fa-check-circle text-5xl text-green-600"></i>
        </div>
        <h2 class="text-3xl font-bold text-gray-800 mb-4">
          セッション完了！
        </h2>
        <p class="text-gray-600 mb-8">
          ${this.totalProblems}問の交互配置練習を完了しました。<br>
          お疲れ様でした！
        </p>
        <div class="flex items-center justify-center space-x-3">
          <button id="btn-view-stats" class="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
            <i class="fas fa-chart-bar mr-2"></i>
            統計を見る
          </button>
          <button id="btn-new-session" class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            <i class="fas fa-redo mr-2"></i>
            新しいセッション
          </button>
        </div>
      </div>
    `

    document.getElementById('btn-view-stats')?.addEventListener('click', () => {
      this.renderStats()
    })

    document.getElementById('btn-new-session')?.addEventListener('click', async () => {
      const data = await this.startSession()
      if (data) {
        // 最初の問題を取得して表示（実装は省略）
        this.showToast('新しいセッションを開始しました', 'success')
      }
    })
  }

  /**
   * 統計表示
   */
  async renderStats(containerId = 'interleaved-stats-container') {
    const container = document.getElementById(containerId)
    if (!container) return

    try {
      const [statsResponse, discriminationResponse] = await Promise.all([
        fetch(`${this.apiBase}/interleaved-practice/stats/${this.studentId}`),
        fetch(`${this.apiBase}/interleaved-practice/discrimination-stats/${this.studentId}`)
      ])

      const statsData = await statsResponse.json()
      const discriminationData = await discriminationResponse.json()

      if (!statsData.success || !discriminationData.success) {
        throw new Error('統計取得に失敗しました')
      }

      const stats = statsData.stats
      const discrimination = discriminationData.stats

      container.innerHTML = `
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-chart-pie text-purple-600 mr-2"></i>
              基本統計
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center p-4 bg-purple-50 rounded-lg">
                <div class="text-3xl font-bold text-purple-600">${stats.basic.total_sessions || 0}</div>
                <div class="text-sm text-gray-600 mt-1">総セッション数</div>
              </div>
              <div class="text-center p-4 bg-blue-50 rounded-lg">
                <div class="text-3xl font-bold text-blue-600">${stats.basic.total_problems || 0}</div>
                <div class="text-sm text-gray-600 mt-1">総問題数</div>
              </div>
              <div class="text-center p-4 bg-green-50 rounded-lg">
                <div class="text-3xl font-bold text-green-600">${((stats.basic.avg_accuracy || 0) * 100).toFixed(1)}%</div>
                <div class="text-sm text-gray-600 mt-1">平均正答率</div>
              </div>
              <div class="text-center p-4 bg-orange-50 rounded-lg">
                <div class="text-3xl font-bold text-orange-600">${Math.floor(stats.basic.avg_response_time || 0)}s</div>
                <div class="text-sm text-gray-600 mt-1">平均回答時間</div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-bullseye text-blue-600 mr-2"></i>
              概念識別能力
            </h3>
            <div class="space-y-3">
              ${discrimination.conceptAccuracy.map((concept: any) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex-1">
                    <div class="font-semibold text-gray-800">${concept.source_concept}</div>
                    <div class="text-sm text-gray-600">
                      ${concept.correct_identifications} / ${concept.total_attempts} 正解
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="w-32 bg-gray-200 rounded-full h-2">
                      <div class="bg-green-500 h-2 rounded-full" 
                           style="width: ${(concept.accuracy_rate * 100).toFixed(0)}%"></div>
                    </div>
                    <div class="text-sm font-semibold text-gray-700 w-12 text-right">
                      ${(concept.accuracy_rate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          ${discrimination.confusionMatrix.length > 0 ? `
            <div class="bg-white rounded-lg shadow-md p-6">
              <h3 class="text-xl font-bold text-gray-800 mb-4">
                <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                よく間違える組み合わせ
              </h3>
              <div class="space-y-2">
                ${discrimination.confusionMatrix.map((confusion: any) => `
                  <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <span class="font-semibold text-gray-800">${confusion.source_concept}</span>
                      <i class="fas fa-arrow-right mx-2 text-gray-400"></i>
                      <span class="font-semibold text-red-600">${confusion.identified_concept}</span>
                    </div>
                    <div class="text-sm text-gray-600">${confusion.count}回</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `
    } catch (error) {
      console.error('統計取得エラー:', error)
      container.innerHTML = '<p class="text-red-500">統計を読み込めませんでした</p>'
    }
  }

  /**
   * セッション一覧表示
   */
  async renderSessionList(containerId = 'session-list-container', limit = 10) {
    const container = document.getElementById(containerId)
    if (!container) return

    try {
      const response = await fetch(`${this.apiBase}/interleaved-practice/sessions/${this.studentId}?limit=${limit}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      if (!data.sessions || data.sessions.length === 0) {
        container.innerHTML = `
          <div class="text-center text-gray-500 py-8">
            <i class="fas fa-random text-4xl mb-4"></i>
            <p>まだセッションがありません</p>
          </div>
        `
        return
      }

      container.innerHTML = `
        <div class="space-y-3">
          ${data.sessions.map((session: any) => {
            const accuracy = session.total_problems > 0 ? 
              (session.correct_answers / session.total_problems * 100).toFixed(1) : 0
            return `
              <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-2">
                  <div>
                    <span class="font-semibold text-gray-800">${session.interleaving_strategy}</span>
                    <span class="text-sm text-gray-500 ml-2">
                      ${new Date(session.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-purple-600">${accuracy}%</div>
                    <div class="text-xs text-gray-500">${session.correct_answers}/${session.total_problems}</div>
                  </div>
                </div>
                <div class="flex items-center space-x-4 text-sm text-gray-600">
                  <span><i class="fas fa-clock mr-1"></i>${Math.floor(session.avg_response_time || 0)}s</span>
                  <span><i class="fas fa-check mr-1"></i>${session.session_status}</span>
                </div>
              </div>
            `
          }).join('')}
        </div>
      `
    } catch (error) {
      console.error('セッション一覧取得エラー:', error)
      container.innerHTML = '<p class="text-red-500">セッション一覧を読み込めませんでした</p>'
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
window.InterleavedPracticeUI = InterleavedPracticeUI
