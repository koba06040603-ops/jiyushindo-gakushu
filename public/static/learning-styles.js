// ===== Phase 9: 学習スタイル対応機能 =====
// 視覚型・聴覚型・体感型の学習スタイルに応じた問題表現

class LearningStyleManager {
  constructor() {
    this.currentStyle = 'visual' // デフォルトは視覚型
    this.styles = {
      visual: {
        name: '視覚型',
        icon: '👁️',
        description: '図やイラストで学ぶのが得意',
        color: '#3b82f6'
      },
      auditory: {
        name: '聴覚型',
        icon: '👂',
        description: '音声や説明で学ぶのが得意',
        color: '#10b981'
      },
      kinesthetic: {
        name: '体感型',
        icon: '✋',
        description: '体を動かして学ぶのが得意',
        color: '#f59e0b'
      }
    }
    this.isInitialized = false
    
    console.log('🎨 LearningStyleManager 初期化')
  }
  
  /**
   * 学習スタイルマネージャーを初期化
   * @param {string} initialStyle - 初期スタイル（visual/auditory/kinesthetic）
   */
  async initialize(initialStyle = 'visual') {
    if (this.isInitialized) {
      console.log('⚠️ すでに初期化済みです')
      return
    }
    
    this.currentStyle = initialStyle
    this.isInitialized = true
    
    // スタイル選択UIを作成
    this.createStyleSelectorUI()
    
    // 音声合成を準備（聴覚型用）
    this.prepareSpeechSynthesis()
    
    console.log('✅ LearningStyleManager 初期化完了:', this.currentStyle)
  }
  
  /**
   * スタイル選択UIを作成
   */
  createStyleSelectorUI() {
    // スタイル選択コンテナ
    if (document.getElementById('learning-style-selector')) {
      return // すでに存在する
    }
    
    const container = document.createElement('div')
    container.id = 'learning-style-selector'
    container.className = 'fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-40'
    container.style.cssText = 'position: fixed; bottom: 1rem; left: 1rem; background-color: white; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); padding: 1rem; z-index: 40;'
    
    container.innerHTML = `
      <div class="mb-2">
        <h4 class="text-sm font-bold text-gray-700 mb-2">学習スタイル</h4>
        <div class="flex gap-2">
          ${Object.keys(this.styles).map(styleKey => {
            const style = this.styles[styleKey]
            const isActive = styleKey === this.currentStyle
            return `
              <button
                data-style="${styleKey}"
                class="style-button flex flex-col items-center justify-center w-20 h-20 rounded-lg border-2 transition ${
                  isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }"
                style="border-color: ${isActive ? style.color : '#d1d5db'}; background-color: ${isActive ? style.color + '20' : 'white'};"
                title="${style.description}"
              >
                <div class="text-2xl mb-1">${style.icon}</div>
                <div class="text-xs font-medium" style="color: ${style.color};">${style.name}</div>
              </button>
            `
          }).join('')}
        </div>
      </div>
      <div class="text-xs text-gray-500 mt-2">
        ${this.styles[this.currentStyle].description}
      </div>
    `
    
    document.body.appendChild(container)
    
    // ボタンのイベントリスナー
    container.querySelectorAll('.style-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const newStyle = button.getAttribute('data-style')
        this.changeStyle(newStyle)
      })
    })
    
    console.log('✅ スタイル選択UI作成完了')
  }
  
  /**
   * 学習スタイルを変更
   * @param {string} newStyle - 新しいスタイル
   */
  changeStyle(newStyle) {
    if (!this.styles[newStyle]) {
      console.error('❌ 無効なスタイル:', newStyle)
      return
    }
    
    const oldStyle = this.currentStyle
    this.currentStyle = newStyle
    
    console.log(`🎨 学習スタイル変更: ${oldStyle} → ${newStyle}`)
    
    // UIを更新
    this.updateStyleSelectorUI()
    
    // 現在表示中の問題を再レンダリング
    this.rerenderCurrentProblem()
    
    // 変更通知を表示
    if (window.realtimeNotificationManager) {
      window.realtimeNotificationManager.showNotification({
        type: 'success',
        title: '学習スタイル変更',
        message: `${this.styles[newStyle].name}に変更しました`,
        duration: 3000
      })
    }
  }
  
  /**
   * スタイル選択UIを更新
   */
  updateStyleSelectorUI() {
    const container = document.getElementById('learning-style-selector')
    if (!container) return
    
    // ボタンのアクティブ状態を更新
    container.querySelectorAll('.style-button').forEach(button => {
      const styleKey = button.getAttribute('data-style')
      const style = this.styles[styleKey]
      const isActive = styleKey === this.currentStyle
      
      button.style.borderColor = isActive ? style.color : '#d1d5db'
      button.style.backgroundColor = isActive ? style.color + '20' : 'white'
      
      if (isActive) {
        button.classList.add('border-blue-500', 'bg-blue-50')
        button.classList.remove('border-gray-300')
      } else {
        button.classList.remove('border-blue-500', 'bg-blue-50')
        button.classList.add('border-gray-300')
      }
    })
    
    // 説明文を更新
    const description = container.querySelector('.text-xs.text-gray-500')
    if (description) {
      description.textContent = this.styles[this.currentStyle].description
    }
  }
  
  /**
   * 現在の問題を再レンダリング
   */
  rerenderCurrentProblem() {
    console.log('🔄 問題を再レンダリング中...')
    
    // グローバル関数を使用して問題を再表示
    if (typeof window.currentCardData !== 'undefined' && window.currentCardData) {
      this.renderProblem(window.currentCardData)
    }
  }
  
  /**
   * 学習スタイルに応じた問題表現を生成
   * @param {Object} cardData - カードデータ
   * @returns {Object} スタイル別の問題表現
   */
  generateStyledProblem(cardData) {
    const { problem_description, answer, card_title } = cardData
    
    switch (this.currentStyle) {
      case 'visual':
        return this.generateVisualProblem(cardData)
      case 'auditory':
        return this.generateAuditoryProblem(cardData)
      case 'kinesthetic':
        return this.generateKinestheticProblem(cardData)
      default:
        return {
          title: card_title,
          content: problem_description,
          answer: answer
        }
    }
  }
  
  /**
   * 視覚型の問題表現を生成
   * @param {Object} cardData
   * @returns {Object}
   */
  generateVisualProblem(cardData) {
    const { problem_description, answer, card_title } = cardData
    
    // 自動図解生成エリアのID
    const diagramId = `diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 図やイラストを含む視覚的な表現
    let visualContent = `
      <div class="visual-problem">
        <div class="problem-title text-xl font-bold mb-4 text-blue-600">
          ${card_title}
        </div>
        <div class="problem-visual bg-blue-50 p-6 rounded-lg mb-4">
          ${this.addVisualEnhancements(problem_description)}
        </div>
        <div id="${diagramId}" class="auto-diagram bg-white p-4 rounded-lg border-2 border-blue-200 mb-4"></div>
        <div id="progress-ring-${diagramId}" class="progress-area flex justify-center mt-4"></div>
      </div>
    `
    
    // 問題が表示された後に図解を自動生成
    setTimeout(() => {
      if (window.visualDiagramGenerator) {
        window.visualDiagramGenerator.autoGenerateDiagram(problem_description, diagramId)
      }
    }, 100)
    
    return {
      title: card_title,
      content: visualContent,
      answer: answer,
      enhancements: ['自動図解', '色分け', 'アイコン', '進捗リング']
    }
  }
  
  /**
   * 聴覚型の問題表現を生成
   * @param {Object} cardData
   * @returns {Object}
   */
  generateAuditoryProblem(cardData) {
    const { problem_description, answer, card_title } = cardData
    
    // 音声読み上げ機能を含む表現
    let auditoryContent = `
      <div class="auditory-problem">
        <div class="problem-title text-xl font-bold mb-4 text-green-600">
          ${card_title}
          <button 
            class="read-aloud-btn ml-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
            onclick="window.learningStyleManager.readAloud('${card_title}. ${problem_description.replace(/'/g, "\\'")}')">
            🔊 読み上げ
          </button>
        </div>
        <div class="problem-auditory bg-green-50 p-6 rounded-lg mb-4">
          ${this.addAuditoryEnhancements(problem_description)}
        </div>
      </div>
    `
    
    return {
      title: card_title,
      content: auditoryContent,
      answer: answer,
      enhancements: ['音声読み上げ', 'リズム', '擬音語']
    }
  }
  
  /**
   * 体感型の問題表現を生成
   * @param {Object} cardData
   * @returns {Object}
   */
  generateKinestheticProblem(cardData) {
    const { problem_description, answer, card_title } = cardData
    
    // インタラクティブな体験を含む表現
    let kinestheticContent = `
      <div class="kinesthetic-problem">
        <div class="problem-title text-xl font-bold mb-4 text-orange-600">
          ${card_title}
        </div>
        <div class="problem-kinesthetic bg-orange-50 p-6 rounded-lg mb-4">
          ${this.addKinestheticEnhancements(problem_description)}
        </div>
        <div class="interactive-area mt-4 p-4 bg-white border-2 border-dashed border-orange-300 rounded-lg">
          <p class="text-sm text-gray-600 mb-2">👆 ここで実際に試してみよう！</p>
          ${this.createInteractiveElements(cardData)}
        </div>
      </div>
    `
    
    return {
      title: card_title,
      content: kinestheticContent,
      answer: answer,
      enhancements: ['体験', 'インタラクティブ', '操作']
    }
  }
  
  /**
   * 視覚的な強化を追加
   * @param {string} text
   * @returns {string}
   */
  addVisualEnhancements(text) {
    // 数字を強調
    let enhanced = text.replace(/(\d+)/g, '<span class="text-2xl font-bold text-blue-600">$1</span>')
    
    // 演算記号を強調し、アイコンも追加
    enhanced = enhanced.replace(/\+/g, '<span class="text-3xl font-bold text-green-500 mx-2">➕</span>')
    enhanced = enhanced.replace(/-/g, '<span class="text-3xl font-bold text-red-500 mx-2">➖</span>')
    enhanced = enhanced.replace(/×/g, '<span class="text-3xl font-bold text-purple-500 mx-2">✖️</span>')
    enhanced = enhanced.replace(/÷/g, '<span class="text-3xl font-bold text-orange-500 mx-2">➗</span>')
    enhanced = enhanced.replace(/=/g, '<span class="text-3xl font-bold text-blue-500 mx-2">🟰</span>')
    
    // 分数の表現を強化
    enhanced = enhanced.replace(/(\d+)\/(\d+)/g, (match, num, den) => {
      return `<span class="inline-flex flex-col items-center text-blue-600 font-bold mx-2">
        <span class="border-b-2 border-blue-600 pb-1">${num}</span>
        <span class="pt-1">${den}</span>
      </span>`
    })
    
    // キーワードを色分け
    enhanced = enhanced.replace(/(答え|解|求め)/g, '<span class="bg-yellow-200 px-2 py-1 rounded font-bold">$1</span>')
    enhanced = enhanced.replace(/(合計|全部|すべて)/g, '<span class="bg-green-200 px-2 py-1 rounded font-bold">$1</span>')
    enhanced = enhanced.replace(/(残り|差|ちがい)/g, '<span class="bg-red-200 px-2 py-1 rounded font-bold">$1</span>')
    
    // 改行を適切に処理
    enhanced = enhanced.replace(/\n/g, '<br>')
    
    return enhanced
  }
  
  /**
   * 聴覚的な強化を追加
   * @param {string} text
   * @returns {string}
   */
  addAuditoryEnhancements(text) {
    // リズムを追加（読みやすく区切る）
    text = text.replace(/([。、])/g, '$1 ')
    
    // 重要な単語を強調
    text = text.replace(/(計算|答え|問題)/g, '<strong class="text-green-700">$1</strong>')
    
    // 改行を適切に処理
    text = text.replace(/\n/g, '<br>')
    
    return text
  }
  
  /**
   * 体感的な強化を追加
   * @param {string} text
   * @returns {string}
   */
  addKinestheticEnhancements(text) {
    // ステップバイステップの指示を追加
    let steps = text.split(/[。\n]/).filter(s => s.trim())
    
    if (steps.length > 1) {
      return steps.map((step, index) => 
        `<div class="step mb-3 flex items-start">
          <div class="step-number bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3 flex-shrink-0">
            ${index + 1}
          </div>
          <div class="step-content text-gray-700">
            ${step.trim()}
          </div>
        </div>`
      ).join('')
    }
    
    return text
  }
  
  /**
   * インタラクティブ要素を作成
   * @param {Object} cardData
   * @returns {string}
   */
  createInteractiveElements(cardData) {
    // 簡単な計算問題の場合、ドラッグ&ドロップの数字パズルを作成
    return `
      <div class="interactive-puzzle flex gap-2 justify-center">
        <div class="puzzle-piece bg-orange-200 p-3 rounded cursor-move" draggable="true">
          1
        </div>
        <div class="puzzle-piece bg-orange-200 p-3 rounded cursor-move" draggable="true">
          2
        </div>
        <div class="puzzle-piece bg-orange-200 p-3 rounded cursor-move" draggable="true">
          3
        </div>
      </div>
      <div class="drop-zone mt-4 p-4 border-2 border-dashed border-gray-300 rounded min-h-[50px] text-center text-gray-400">
        ここに答えをドロップ
      </div>
    `
  }
  
  /**
   * 問題をレンダリング
   * @param {Object} cardData
   */
  renderProblem(cardData) {
    const styledProblem = this.generateStyledProblem(cardData)
    
    // 問題表示エリアを更新
    const problemArea = document.getElementById('problem-area')
    if (problemArea) {
      problemArea.innerHTML = styledProblem.content
    }
    
    // グローバル変数に保存
    window.currentCardData = cardData
    
    console.log('✅ 問題レンダリング完了:', this.currentStyle)
  }
  
  /**
   * 音声合成を準備
   */
  prepareSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      console.log('✅ 音声合成機能が利用可能です')
      this.speechSynthesis = window.speechSynthesis
    } else {
      console.warn('⚠️ 音声合成機能が利用できません')
      this.speechSynthesis = null
    }
  }
  
  /**
   * テキストを読み上げ
   * @param {string} text - 読み上げるテキスト
   */
  readAloud(text) {
    if (!this.speechSynthesis) {
      alert('音声読み上げ機能が利用できません')
      return
    }
    
    // 既存の読み上げを停止
    this.speechSynthesis.cancel()
    
    // 読み上げを開始
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ja-JP'
    utterance.rate = 0.9 // 少しゆっくり
    utterance.pitch = 1.0
    
    utterance.onstart = () => {
      console.log('🔊 読み上げ開始')
    }
    
    utterance.onend = () => {
      console.log('✅ 読み上げ完了')
    }
    
    utterance.onerror = (error) => {
      console.error('❌ 読み上げエラー:', error)
    }
    
    this.speechSynthesis.speak(utterance)
  }
  
  /**
   * 読み上げを停止
   */
  stopReading() {
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel()
    }
  }
  
  /**
   * 学習スタイルを取得
   * @returns {string}
   */
  getCurrentStyle() {
    return this.currentStyle
  }
  
  /**
   * 学習スタイル情報を取得
   * @returns {Object}
   */
  getStyleInfo() {
    return this.styles[this.currentStyle]
  }
}

// グローバルインスタンスを作成
window.learningStyleManager = new LearningStyleManager()

console.log('✅ learning-styles.js 読み込み完了')
