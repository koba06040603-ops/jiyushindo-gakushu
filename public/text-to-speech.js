/**
 * 音声読み上げ機能（Text-to-Speech）
 * Web Speech API を使用した無料の音声読み上げ
 */

// ============================================
// 音声読み上げマネージャー
// ============================================

class TextToSpeechManager {
    constructor() {
        // Web Speech API のチェック
        this.synthesis = window.speechSynthesis
        this.isSupported = 'speechSynthesis' in window
        
        // 現在の音声設定
        this.currentVoice = null
        this.rate = 1.0 // 読み上げ速度（0.1-10）
        this.pitch = 1.0 // 音の高さ（0-2）
        this.volume = 1.0 // 音量（0-1）
        this.lang = 'ja-JP' // 言語
        
        // 状態管理
        this.isSpeaking = false
        this.isPaused = false
        
        // 利用可能な音声のロード
        this.voices = []
        this.loadVoices()
        
        // 音声リストの変更イベント
        if (this.synthesis) {
            this.synthesis.onvoiceschanged = () => {
                this.loadVoices()
            }
        }
    }
    
    /**
     * 利用可能な音声をロード
     */
    loadVoices() {
        if (!this.isSupported) return
        
        this.voices = this.synthesis.getVoices()
        
        // 日本語音声を優先的に選択
        const japaneseVoices = this.voices.filter(voice => 
            voice.lang.startsWith('ja')
        )
        
        if (japaneseVoices.length > 0) {
            // Google日本語音声を優先
            this.currentVoice = japaneseVoices.find(v => v.name.includes('Google')) || japaneseVoices[0]
        } else {
            this.currentVoice = this.voices[0]
        }
        
        console.log(`✅ 音声読み上げ: ${this.voices.length}個の音声が利用可能`)
        console.log(`📢 選択された音声: ${this.currentVoice?.name}`)
    }
    
    /**
     * テキストを読み上げ
     * @param {string} text - 読み上げるテキスト
     * @param {object} options - オプション設定
     */
    speak(text, options = {}) {
        if (!this.isSupported) {
            console.warn('⚠️ お使いのブラウザは音声読み上げをサポートしていません')
            return Promise.reject(new Error('Speech synthesis not supported'))
        }
        
        // 既存の読み上げを停止
        this.stop()
        
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text)
            
            // 音声設定
            utterance.voice = this.currentVoice
            utterance.rate = options.rate || this.rate
            utterance.pitch = options.pitch || this.pitch
            utterance.volume = options.volume || this.volume
            utterance.lang = options.lang || this.lang
            
            // イベントハンドラー
            utterance.onstart = () => {
                this.isSpeaking = true
                this.isPaused = false
                console.log('🔊 読み上げ開始')
            }
            
            utterance.onend = () => {
                this.isSpeaking = false
                this.isPaused = false
                console.log('✅ 読み上げ完了')
                resolve()
            }
            
            utterance.onerror = (event) => {
                this.isSpeaking = false
                this.isPaused = false
                console.error('❌ 読み上げエラー:', event.error)
                reject(event)
            }
            
            utterance.onpause = () => {
                this.isPaused = true
                console.log('⏸️ 読み上げ一時停止')
            }
            
            utterance.onresume = () => {
                this.isPaused = false
                console.log('▶️ 読み上げ再開')
            }
            
            // 読み上げ開始
            this.synthesis.speak(utterance)
        })
    }
    
    /**
     * 読み上げを一時停止
     */
    pause() {
        if (this.isSupported && this.isSpeaking && !this.isPaused) {
            this.synthesis.pause()
        }
    }
    
    /**
     * 読み上げを再開
     */
    resume() {
        if (this.isSupported && this.isSpeaking && this.isPaused) {
            this.synthesis.resume()
        }
    }
    
    /**
     * 読み上げを停止
     */
    stop() {
        if (this.isSupported) {
            this.synthesis.cancel()
            this.isSpeaking = false
            this.isPaused = false
        }
    }
    
    /**
     * 音声設定を変更
     */
    setVoice(voiceIndex) {
        if (voiceIndex >= 0 && voiceIndex < this.voices.length) {
            this.currentVoice = this.voices[voiceIndex]
            console.log(`🎤 音声変更: ${this.currentVoice.name}`)
        }
    }
    
    /**
     * 読み上げ速度を変更（0.1-10）
     */
    setRate(rate) {
        this.rate = Math.max(0.1, Math.min(10, rate))
        console.log(`⏩ 速度変更: ${this.rate}倍速`)
    }
    
    /**
     * 音の高さを変更（0-2）
     */
    setPitch(pitch) {
        this.pitch = Math.max(0, Math.min(2, pitch))
        console.log(`🎵 音の高さ変更: ${this.pitch}`)
    }
    
    /**
     * 音量を変更（0-1）
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume))
        console.log(`🔊 音量変更: ${Math.round(this.volume * 100)}%`)
    }
    
    /**
     * 利用可能な音声のリストを取得
     */
    getVoices() {
        return this.voices.map((voice, index) => ({
            index,
            name: voice.name,
            lang: voice.lang,
            default: voice.default,
            localService: voice.localService
        }))
    }
    
    /**
     * 音声読み上げのサポート状況を確認
     */
    checkSupport() {
        return {
            supported: this.isSupported,
            voicesCount: this.voices.length,
            currentVoice: this.currentVoice?.name,
            lang: this.lang
        }
    }
}

// ============================================
// グローバルインスタンス
// ============================================

// グローバルに1つだけインスタンスを作成
const ttsManager = new TextToSpeechManager()

// ============================================
// 便利な関数（簡易インターフェース）
// ============================================

/**
 * テキストを読み上げ（シンプル版）
 * @param {string} text - 読み上げるテキスト
 */
function speakText(text) {
    return ttsManager.speak(text)
}

/**
 * 読み上げを停止
 */
function stopSpeaking() {
    ttsManager.stop()
}

/**
 * 読み上げを一時停止
 */
function pauseSpeaking() {
    ttsManager.pause()
}

/**
 * 読み上げを再開
 */
function resumeSpeaking() {
    ttsManager.resume()
}

/**
 * 読み上げ速度を変更
 * @param {number} rate - 速度（0.5=ゆっくり、1.0=普通、1.5=速い、2.0=とても速い）
 */
function setSpeechRate(rate) {
    ttsManager.setRate(rate)
}

/**
 * 音量を変更
 * @param {number} volume - 音量（0.0-1.0）
 */
function setSpeechVolume(volume) {
    ttsManager.setVolume(volume)
}

/**
 * 音声読み上げボタンを作成
 * @param {string} text - 読み上げるテキスト
 * @param {string} buttonText - ボタンのテキスト（デフォルト: '🔊 読み上げ'）
 */
function createSpeechButton(text, buttonText = '🔊 読み上げ') {
    const button = document.createElement('button')
    button.className = 'px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm'
    button.innerHTML = buttonText
    
    button.addEventListener('click', () => {
        if (ttsManager.isSpeaking) {
            ttsManager.stop()
            button.innerHTML = buttonText
        } else {
            ttsManager.speak(text).then(() => {
                button.innerHTML = buttonText
            }).catch(() => {
                button.innerHTML = buttonText
            })
            button.innerHTML = '⏸️ 停止'
        }
    })
    
    return button
}

/**
 * 音声読み上げコントロールパネルを作成
 */
function createSpeechControlPanel() {
    const panel = document.createElement('div')
    panel.className = 'bg-white rounded-lg shadow p-4 space-y-3'
    panel.innerHTML = `
        <h3 class="text-lg font-bold text-gray-800 mb-3">🔊 音声読み上げ設定</h3>
        
        <!-- 速度調整 -->
        <div>
            <label class="text-sm font-semibold text-gray-700 block mb-1">
                読み上げ速度: <span id="rateValue">1.0</span>倍速
            </label>
            <input 
                type="range" 
                id="rateSlider" 
                min="0.5" 
                max="2.0" 
                step="0.1" 
                value="1.0" 
                class="w-full"
            />
        </div>
        
        <!-- 音量調整 -->
        <div>
            <label class="text-sm font-semibold text-gray-700 block mb-1">
                音量: <span id="volumeValue">100</span>%
            </label>
            <input 
                type="range" 
                id="volumeSlider" 
                min="0" 
                max="1" 
                step="0.1" 
                value="1.0" 
                class="w-full"
            />
        </div>
        
        <!-- 音声選択 -->
        <div>
            <label class="text-sm font-semibold text-gray-700 block mb-1">音声選択</label>
            <select id="voiceSelect" class="w-full px-3 py-2 border rounded">
                <!-- JavaScriptで動的に追加 -->
            </select>
        </div>
        
        <!-- テストボタン -->
        <button 
            id="testSpeechBtn" 
            class="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium"
        >
            🎤 テスト読み上げ
        </button>
    `
    
    // イベントハンドラー設定（次のページロード時）
    setTimeout(() => {
        const rateSlider = document.getElementById('rateSlider')
        const rateValue = document.getElementById('rateValue')
        const volumeSlider = document.getElementById('volumeSlider')
        const volumeValue = document.getElementById('volumeValue')
        const voiceSelect = document.getElementById('voiceSelect')
        const testBtn = document.getElementById('testSpeechBtn')
        
        if (rateSlider && rateValue) {
            rateSlider.addEventListener('input', (e) => {
                const rate = parseFloat(e.target.value)
                rateValue.textContent = rate.toFixed(1)
                ttsManager.setRate(rate)
            })
        }
        
        if (volumeSlider && volumeValue) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value)
                volumeValue.textContent = Math.round(volume * 100)
                ttsManager.setVolume(volume)
            })
        }
        
        if (voiceSelect) {
            // 音声リストを追加
            const voices = ttsManager.getVoices()
            voices.forEach(voice => {
                const option = document.createElement('option')
                option.value = voice.index
                option.textContent = `${voice.name} (${voice.lang})`
                if (voice.index === 0) option.selected = true
                voiceSelect.appendChild(option)
            })
            
            voiceSelect.addEventListener('change', (e) => {
                ttsManager.setVoice(parseInt(e.target.value))
            })
        }
        
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                ttsManager.speak('これは音声読み上げのテストです。正しく聞こえていますか？')
            })
        }
    }, 100)
    
    return panel
}

console.log('✅ 音声読み上げ機能がロードされました')
