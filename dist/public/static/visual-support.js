// 動的視覚支援機能
class VisualSupportManager {
  constructor() {
    this.highlightColor = '#FFE  B3B'
    this.focusColor = '#90EE90'
    this.currentHighlight = null
    this.focusMode = false
  }
  
  // テキストをハイライト
  highlightText(element) {
    if (this.currentHighlight) {
      this.clearHighlight()
    }
    
    element.style.backgroundColor = this.highlightColor
    element.style.transition = 'background-color 0.3s'
    this.currentHighlight = element
  }
  
  // ハイライトをクリア
  clearHighlight() {
    if (this.currentHighlight) {
      this.currentHighlight.style.backgroundColor = ''
      this.currentHighlight = null
    }
  }
  
  // フォーカスモード（集中モード）
  toggleFocusMode(targetElement) {
    this.focusMode = !this.focusMode
    
    if (this.focusMode) {
      // フォーカスモードON: 背景を暗くして対象要素を強調
      const overlay = document.createElement('div')
      overlay.id = 'focus-mode-overlay'
      overlay.className = 'fixed inset-0 bg-black/50 z-40'
      overlay.onclick = () => this.toggleFocusMode()
      document.body.appendChild(overlay)
      
      targetElement.classList.add('focus-mode-active')
      targetElement.style.position = 'relative'
      targetElement.style.zIndex = '50'
      targetElement.style.boxShadow = '0 0 0 4px ' + this.focusColor
      targetElement.style.borderRadius = '8px'
      
      console.log('🎯 フォーカスモードON')
    } else {
      // フォーカスモードOFF
      const overlay = document.getElementById('focus-mode-overlay')
      if (overlay) overlay.remove()
      
      targetElement.classList.remove('focus-mode-active')
      targetElement.style.zIndex = ''
      targetElement.style.boxShadow = ''
      
      console.log('👁️ フォーカスモードOFF')
    }
  }
  
  // テキストサイズ調整
  adjustTextSize(element, scale) {
    const currentSize = parseFloat(window.getComputedStyle(element).fontSize)
    const newSize = currentSize * scale
    element.style.fontSize = newSize + 'px'
    element.style.transition = 'font-size 0.3s'
  }
  
  // 行間調整
  adjustLineHeight(element, height) {
    element.style.lineHeight = height
    element.style.transition = 'line-height 0.3s'
  }
  
  // カラーコントラスト調整（ハイコントラストモード）
  toggleHighContrast() {
    document.body.classList.toggle('high-contrast-mode')
    
    if (document.body.classList.contains('high-contrast-mode')) {
      document.body.style.filter = 'contrast(1.5)'
      console.log('🎨 ハイコントラストモードON')
    } else {
      document.body.style.filter = ''
      console.log('🎨 ハイコントラストモードOFF')
    }
  }
  
  // ルビ（ふりがな）を追加
  addRuby(kanji, reading) {
    return `<ruby>${kanji}<rt>${reading}</rt></ruby>`
  }
  
  // 数式を視覚化（色分け）
  visualizeMath(expression) {
    // 例: "23 × 4 = 92" → 色分け表示
    const parts = expression.split(/([+\-×÷=])/)
    return parts.map((part, index) => {
      if (['+', '-', '×', '÷'].includes(part.trim())) {
        return `<span class="text-red-600 font-bold text-xl mx-1">${part}</span>`
      } else if (part.trim() === '=') {
        return `<span class="text-blue-600 font-bold text-xl mx-1">${part}</span>`
      } else {
        return `<span class="text-gray-800 font-semibold">${part}</span>`
      }
    }).join('')
  }
  
  // アニメーションで注目を集める
  pulseAnimation(element, duration = 2000) {
    element.classList.add('animate-pulse')
    setTimeout(() => {
      element.classList.remove('animate-pulse')
    }, duration)
  }
  
  // ステップバイステップ表示
  async showStepByStep(steps, container, delay = 1000) {
    container.innerHTML = ''
    
    for (let i = 0; i < steps.length; i++) {
      const stepDiv = document.createElement('div')
      stepDiv.className = 'step-item mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500 opacity-0'
      stepDiv.innerHTML = `
        <div class="flex items-center mb-2">
          <span class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
            ${i + 1}
          </span>
          <h4 class="font-bold text-gray-800">ステップ ${i + 1}</h4>
        </div>
        <p class="text-gray-700 ml-11">${steps[i]}</p>
      `
      
      container.appendChild(stepDiv)
      
      // フェードインアニメーション
      setTimeout(() => {
        stepDiv.style.transition = 'opacity 0.5s'
        stepDiv.style.opacity = '1'
      }, 50)
      
      // 読み上げ
      if (window.ttsManager) {
        window.ttsManager.speak(`ステップ${i + 1}。${steps[i]}`)
      }
      
      // 次のステップまで待機
      if (i < steps.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  // カラーブラインドモード（色覚サポート）
  applyColorBlindMode(mode) {
    const filters = {
      'protanopia': 'url("#protanopia-filter")',    // 赤色盲
      'deuteranopia': 'url("#deuteranopia-filter")', // 緑色盲
      'tritanopia': 'url("#tritanopia-filter")',     // 青色盲
      'normal': 'none'
    }
    
    document.body.style.filter = filters[mode] || filters.normal
    console.log('🎨 色覚サポートモード:', mode)
  }
}

// グローバルインスタンスを作成
window.visualSupport = new VisualSupportManager()
window.VisualSupportManager = VisualSupportManager

console.log('✅ 動的視覚支援機能を初期化しました')
