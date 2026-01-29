/**
 * ========================================
 * 高度な音声合成システム (レベル3)
 * ========================================
 * 目的: Web Speech API + Web Audio APIで世界最高峰の音声体験を無料で実現
 * 
 * 機能:
 * 1. 多様な声質選択（性別、年齢、方言）
 * 2. 感情表現（喜び、驚き、優しさ）
 * 3. リズムと強調の制御
 * 4. 効果音とBGMの統合
 * 5. 読み上げ字幕の同期表示
 */

class AdvancedSpeechManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.audioContext = null;
    this.voices = [];
    this.currentUtterance = null;
    this.isReading = false;
    
    // 音声設定
    this.settings = {
      voice: null,
      rate: 1.0,      // 速度 (0.1 - 10)
      pitch: 1.0,     // ピッチ (0 - 2)
      volume: 1.0,    // 音量 (0 - 1)
      emotion: 'neutral' // neutral, happy, excited, gentle
    };
    
    // 感情別の設定
    this.emotionPresets = {
      neutral: { rate: 1.0, pitch: 1.0 },
      happy: { rate: 1.2, pitch: 1.3 },
      excited: { rate: 1.3, pitch: 1.4 },
      gentle: { rate: 0.9, pitch: 0.95 },
      serious: { rate: 0.95, pitch: 0.9 }
    };
    
    console.log('✅ AdvancedSpeechManager 初期化開始');
    this.init();
  }
  
  async init() {
    try {
      // Web Audio API初期化
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // 音声リスト読み込み
      await this.loadVoices();
      
      // 音声リスト更新のリスナー
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
      
      console.log('✅ AdvancedSpeechManager 初期化完了');
    } catch (error) {
      console.error('❌ 初期化エラー:', error);
    }
  }
  
  /**
   * 利用可能な音声リストを読み込み
   */
  async loadVoices() {
    return new Promise((resolve) => {
      const getVoices = () => {
        this.voices = this.synthesis.getVoices();
        
        if (this.voices.length > 0) {
          console.log(`✅ ${this.voices.length}個の音声を読み込みました`);
          
          // 日本語音声を優先的に選択
          const japaneseVoice = this.getJapaneseVoice();
          if (japaneseVoice) {
            this.settings.voice = japaneseVoice;
            console.log('✅ 日本語音声を選択:', japaneseVoice.name);
          }
          
          resolve();
        }
      };
      
      getVoices();
      
      // 音声リストがまだ空の場合、少し待つ
      if (this.voices.length === 0) {
        setTimeout(getVoices, 100);
      }
    });
  }
  
  /**
   * 日本語音声を取得（優先順位付き）
   */
  getJapaneseVoice() {
    // 優先順位: Google日本語 > Microsoft日本語 > その他の日本語
    const priorities = [
      'Google 日本語',
      'Microsoft Ayumi',
      'Microsoft Ichiro',
      'Kyoko',
      'Otoya'
    ];
    
    for (const priority of priorities) {
      const voice = this.voices.find(v => v.name.includes(priority));
      if (voice) return voice;
    }
    
    // どれも見つからない場合、日本語を含む最初の音声
    return this.voices.find(v => v.lang.startsWith('ja'));
  }
  
  /**
   * 全ての日本語音声を取得
   */
  getAllJapaneseVoices() {
    return this.voices.filter(v => v.lang.startsWith('ja'));
  }
  
  /**
   * テキストを読み上げ
   * @param {string} text - 読み上げるテキスト
   * @param {Object} options - オプション設定
   */
  speak(text, options = {}) {
    if (!text) return;
    
    // 既存の読み上げを停止
    this.stop();
    
    // 設定を適用
    const config = {
      ...this.settings,
      ...options
    };
    
    // 感情プリセットを適用
    if (config.emotion && this.emotionPresets[config.emotion]) {
      const preset = this.emotionPresets[config.emotion];
      config.rate = preset.rate;
      config.pitch = preset.pitch;
    }
    
    // 発話オブジェクト作成
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.voice = config.voice;
    this.currentUtterance.rate = config.rate;
    this.currentUtterance.pitch = config.pitch;
    this.currentUtterance.volume = config.volume;
    
    // イベントハンドラ
    this.currentUtterance.onstart = () => {
      this.isReading = true;
      console.log('🔊 読み上げ開始');
      
      // 字幕表示
      if (window.subtitleDisplay) {
        window.subtitleDisplay.showSubtitle(text);
      }
    };
    
    this.currentUtterance.onend = () => {
      this.isReading = false;
      console.log('✅ 読み上げ完了');
      
      // 字幕非表示
      if (window.subtitleDisplay) {
        window.subtitleDisplay.hideSubtitle();
      }
    };
    
    this.currentUtterance.onerror = (e) => {
      console.error('❌ 読み上げエラー:', e);
      this.isReading = false;
    };
    
    // 読み上げ開始
    this.synthesis.speak(this.currentUtterance);
  }
  
  /**
   * ステップバイステップで読み上げ
   * @param {Array<string>} steps - ステップ配列
   * @param {number} pauseDuration - ステップ間の間隔（ms）
   */
  async speakStepByStep(steps, pauseDuration = 1000) {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // ステップ番号を追加
      const text = `ステップ${i + 1}。${step}`;
      
      await this.speakWithPromise(text);
      
      // 次のステップまで待機
      if (i < steps.length - 1) {
        await this.pause(pauseDuration);
      }
    }
  }
  
  /**
   * Promise版の読み上げ
   */
  speakWithPromise(text, options = {}) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 設定を適用
      const config = { ...this.settings, ...options };
      if (config.emotion && this.emotionPresets[config.emotion]) {
        const preset = this.emotionPresets[config.emotion];
        config.rate = preset.rate;
        config.pitch = preset.pitch;
      }
      
      utterance.voice = config.voice;
      utterance.rate = config.rate;
      utterance.pitch = config.pitch;
      utterance.volume = config.volume;
      
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      
      this.synthesis.speak(utterance);
    });
  }
  
  /**
   * 停止
   */
  stop() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.isReading = false;
    }
  }
  
  /**
   * 一時停止
   */
  pause(duration = 500) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }
  
  /**
   * 音声設定パネルを表示
   */
  showSettingsPanel() {
    const existingPanel = document.getElementById('speech-settings-panel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }
    
    const panel = document.createElement('div');
    panel.id = 'speech-settings-panel';
    panel.className = 'fixed top-20 right-4 bg-white rounded-lg shadow-2xl p-6 z-50 w-96';
    panel.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800">🎙️ 音声設定</h3>
        <button onclick="this.parentElement.parentElement.remove()" 
                class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="space-y-4">
        <!-- 音声選択 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">音声</label>
          <select id="voice-select" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            ${this.getAllJapaneseVoices().map(voice => `
              <option value="${voice.name}" ${this.settings.voice?.name === voice.name ? 'selected' : ''}>
                ${voice.name}
              </option>
            `).join('')}
          </select>
        </div>
        
        <!-- 速度 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            速度: <span id="rate-value">${this.settings.rate.toFixed(1)}</span>
          </label>
          <input type="range" id="rate-slider" 
                 min="0.5" max="2.0" step="0.1" value="${this.settings.rate}"
                 class="w-full">
        </div>
        
        <!-- ピッチ -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ピッチ: <span id="pitch-value">${this.settings.pitch.toFixed(1)}</span>
          </label>
          <input type="range" id="pitch-slider" 
                 min="0.5" max="2.0" step="0.1" value="${this.settings.pitch}"
                 class="w-full">
        </div>
        
        <!-- 音量 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            音量: <span id="volume-value">${Math.round(this.settings.volume * 100)}%</span>
          </label>
          <input type="range" id="volume-slider" 
                 min="0" max="1" step="0.1" value="${this.settings.volume}"
                 class="w-full">
        </div>
        
        <!-- 感情プリセット -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">感情</label>
          <div class="grid grid-cols-2 gap-2">
            ${Object.keys(this.emotionPresets).map(emotion => `
              <button onclick="window.advancedSpeechManager.setEmotion('${emotion}')"
                      class="px-3 py-2 rounded-lg border-2 transition
                             ${this.settings.emotion === emotion ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                             hover:border-blue-400">
                ${this.getEmotionLabel(emotion)}
              </button>
            `).join('')}
          </div>
        </div>
        
        <!-- テスト -->
        <button onclick="window.advancedSpeechManager.speak('こんにちは。これはテストです。', {})"
                class="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          🔊 テスト再生
        </button>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // イベントリスナー設定
    document.getElementById('voice-select').addEventListener('change', (e) => {
      const voice = this.voices.find(v => v.name === e.target.value);
      if (voice) {
        this.settings.voice = voice;
        console.log('音声変更:', voice.name);
      }
    });
    
    document.getElementById('rate-slider').addEventListener('input', (e) => {
      this.settings.rate = parseFloat(e.target.value);
      document.getElementById('rate-value').textContent = this.settings.rate.toFixed(1);
    });
    
    document.getElementById('pitch-slider').addEventListener('input', (e) => {
      this.settings.pitch = parseFloat(e.target.value);
      document.getElementById('pitch-value').textContent = this.settings.pitch.toFixed(1);
    });
    
    document.getElementById('volume-slider').addEventListener('input', (e) => {
      this.settings.volume = parseFloat(e.target.value);
      document.getElementById('volume-value').textContent = Math.round(this.settings.volume * 100) + '%';
    });
  }
  
  /**
   * 感情を設定
   */
  setEmotion(emotion) {
    this.settings.emotion = emotion;
    console.log('感情設定:', emotion);
    
    // パネルを再描画
    const panel = document.getElementById('speech-settings-panel');
    if (panel) {
      panel.remove();
      this.showSettingsPanel();
    }
  }
  
  /**
   * 感情ラベルを取得
   */
  getEmotionLabel(emotion) {
    const labels = {
      neutral: '普通',
      happy: '嬉しい',
      excited: '興奮',
      gentle: '優しい',
      serious: '真面目'
    };
    return labels[emotion] || emotion;
  }
}

/**
 * ========================================
 * 字幕表示システム
 * ========================================
 */
class SubtitleDisplay {
  constructor() {
    this.container = null;
    this.init();
  }
  
  init() {
    // 字幕コンテナを作成
    this.container = document.createElement('div');
    this.container.id = 'subtitle-container';
    this.container.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 z-40 max-w-2xl';
    this.container.style.display = 'none';
    document.body.appendChild(this.container);
    
    console.log('✅ SubtitleDisplay 初期化完了');
  }
  
  /**
   * 字幕を表示
   */
  showSubtitle(text) {
    this.container.innerHTML = `
      <div class="bg-black bg-opacity-75 text-white px-6 py-3 rounded-lg shadow-2xl text-center text-lg">
        ${text}
      </div>
    `;
    this.container.style.display = 'block';
    this.container.style.animation = 'slideUp 0.3s ease-out';
  }
  
  /**
   * 字幕を非表示
   */
  hideSubtitle() {
    this.container.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => {
      this.container.style.display = 'none';
    }, 300);
  }
}

/**
 * ========================================
 * 効果音システム (Web Audio API)
 * ========================================
 */
class EnhancedSoundEffects {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    console.log('✅ EnhancedSoundEffects 初期化完了');
  }
  
  /**
   * ビープ音を再生
   */
  playBeep(frequency = 440, duration = 200, type = 'sine') {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration / 1000);
  }
  
  /**
   * 正解音
   */
  playCorrectSound() {
    this.playBeep(523.25, 100, 'sine'); // C5
    setTimeout(() => this.playBeep(659.25, 100, 'sine'), 100); // E5
    setTimeout(() => this.playBeep(783.99, 200, 'sine'), 200); // G5
  }
  
  /**
   * 不正解音
   */
  playIncorrectSound() {
    this.playBeep(200, 300, 'sawtooth');
  }
  
  /**
   * クリック音
   */
  playClickSound() {
    this.playBeep(800, 50, 'square');
  }
  
  /**
   * メロディーを再生
   */
  playMelody(notes, tempo = 500) {
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playBeep(note.frequency, note.duration || tempo * 0.8, note.type || 'sine');
      }, tempo * index);
    });
  }
}

// グローバルインスタンス作成
window.advancedSpeechManager = new AdvancedSpeechManager();
window.subtitleDisplay = new SubtitleDisplay();
window.enhancedSoundEffects = new EnhancedSoundEffects();

console.log('✅ advanced-speech.js 読み込み完了');
