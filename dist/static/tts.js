// テキスト読み上げ機能（Web Speech API）
class TextToSpeechManager {
  constructor() {
    this.synthesis = window.speechSynthesis
    this.voices = []
    this.currentUtterance = null
    this.isSpeaking = false
    
    // 音声リストの初期化
    this.loadVoices()
    
    // 音声リストの変更を監視
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this.loadVoices()
    }
  }
  
  loadVoices() {
    this.voices = this.synthesis.getVoices()
    console.log('✅ 読み上げ音声を読み込みました:', this.voices.length)
  }
  
  // テキストを読み上げ
  speak(text, options = {}) {
    // 既に読み上げ中の場合は停止
    if (this.isSpeaking) {
      this.stop()
    }
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // オプション設定
    utterance.lang = options.lang || 'ja-JP'
    utterance.rate = options.rate || 1.0    // 速度 (0.1 - 10)
    utterance.pitch = options.pitch || 1.0  // 音高 (0 - 2)
    utterance.volume = options.volume || 1.0 // 音量 (0 - 1)
    
    // 日本語音声を選択
    const japaneseVoice = this.voices.find(voice => 
      voice.lang === 'ja-JP' || voice.lang.startsWith('ja')
    )
    if (japaneseVoice) {
      utterance.voice = japaneseVoice
    }
    
    // イベントハンドラ
    utterance.onstart = () => {
      this.isSpeaking = true
      console.log('🔊 読み上げ開始:', text.substring(0, 50) + '...')
      if (options.onStart) options.onStart()
    }
    
    utterance.onend = () => {
      this.isSpeaking = false
      console.log('✅ 読み上げ完了')
      if (options.onEnd) options.onEnd()
    }
    
    utterance.onerror = (event) => {
      this.isSpeaking = false
      console.error('❌ 読み上げエラー:', event.error)
      if (options.onError) options.onError(event.error)
    }
    
    this.currentUtterance = utterance
    this.synthesis.speak(utterance)
  }
  
  // 読み上げ停止
  stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel()
      this.isSpeaking = false
      console.log('⏹️ 読み上げ停止')
    }
  }
  
  // 一時停止
  pause() {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause()
      console.log('⏸️ 読み上げ一時停止')
    }
  }
  
  // 再開
  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume()
      console.log('▶️ 読み上げ再開')
    }
  }
  
  // 読み上げボタンを追加
  addSpeakButton(element, text) {
    const button = document.createElement('button')
    button.className = 'tts-button inline-flex items-center ml-2 text-blue-600 hover:text-blue-800'
    button.innerHTML = '<i class="fas fa-volume-up"></i>'
    button.title = '読み上げる'
    button.onclick = (e) => {
      e.stopPropagation()
      this.speak(text || element.textContent)
    }
    
    element.style.position = 'relative'
    element.style.display = 'inline-block'
    element.appendChild(button)
    
    return button
  }
  
  // 要素に読み上げ機能を追加
  enableForElement(selector) {
    const elements = document.querySelectorAll(selector)
    elements.forEach(element => {
      this.addSpeakButton(element, element.textContent)
    })
  }
}

// グローバルインスタンスを作成
window.ttsManager = new TextToSpeechManager()
window.TextToSpeechManager = TextToSpeechManager

console.log('✅ テキスト読み上げ機能を初期化しました')
