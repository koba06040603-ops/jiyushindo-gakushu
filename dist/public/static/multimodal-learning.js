/**
 * マルチモーダル学習システム
 * Web Speech API + 視覚補助機能
 * 
 * 機能:
 * 1. テキスト読み上げ（TTS）
 * 2. 音声認識（STT）
 * 3. 画像拡大・ズーム
 * 4. テキストハイライト
 * 5. カラースキーム（ダークモード・ハイコントラスト）
 * 6. フォントサイズ調整
 * 7. 読みやすさ補助（行間・文字間隔）
 */

// =============================================================================
// 1. Web Speech API - テキスト読み上げ（TTS）
// =============================================================================

class TextToSpeechController {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.isPaused = false;
        
        // 音声リスト取得
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        console.log('Available voices:', this.voices.length);
    }

    /**
     * テキストを読み上げ
     * @param {string} text - 読み上げるテキスト
     * @param {object} options - オプション（lang, rate, pitch, volume）
     */
    speak(text, options = {}) {
        // 既存の読み上げを停止
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // 言語設定（デフォルト: 日本語）
        utterance.lang = options.lang || 'ja-JP';
        
        // 音声選択（日本語音声を優先）
        const voice = this.voices.find(v => v.lang.startsWith(utterance.lang)) || this.voices[0];
        if (voice) {
            utterance.voice = voice;
        }
        
        // 読み上げ速度（0.1-10、デフォルト: 1）
        utterance.rate = options.rate || 1.0;
        
        // ピッチ（0-2、デフォルト: 1）
        utterance.pitch = options.pitch || 1.0;
        
        // 音量（0-1、デフォルト: 1）
        utterance.volume = options.volume || 1.0;

        // イベントリスナー
        utterance.onstart = () => {
            console.log('Speech started');
            this.isPaused = false;
        };

        utterance.onend = () => {
            console.log('Speech ended');
            this.currentUtterance = null;
        };

        utterance.onerror = (event) => {
            console.error('Speech error:', event.error);
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }

    /**
     * 読み上げ一時停止
     */
    pause() {
        if (this.synth.speaking && !this.isPaused) {
            this.synth.pause();
            this.isPaused = true;
        }
    }

    /**
     * 読み上げ再開
     */
    resume() {
        if (this.isPaused) {
            this.synth.resume();
            this.isPaused = false;
        }
    }

    /**
     * 読み上げ停止
     */
    stop() {
        this.synth.cancel();
        this.currentUtterance = null;
        this.isPaused = false;
    }

    /**
     * 読み上げ中かどうか
     */
    isSpeaking() {
        return this.synth.speaking;
    }
}

// =============================================================================
// 2. Web Speech API - 音声認識（STT）
// =============================================================================

class SpeechRecognitionController {
    constructor() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported');
            this.supported = false;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'ja-JP';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
        
        this.isListening = false;
        this.onResultCallback = null;
        this.onErrorCallback = null;
        this.supported = true;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            if (this.onResultCallback) {
                this.onResultCallback({
                    transcript,
                    isFinal,
                    confidence: result[0].confidence
                });
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            
            if (this.onErrorCallback) {
                this.onErrorCallback(event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
        };
    }

    /**
     * 音声認識開始
     */
    start(onResult, onError) {
        if (!this.supported) {
            console.error('Speech Recognition not supported');
            return;
        }

        this.onResultCallback = onResult;
        this.onErrorCallback = onError;
        
        this.recognition.start();
        this.isListening = true;
    }

    /**
     * 音声認識停止
     */
    stop() {
        if (this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }
}

// =============================================================================
// 3. 視覚補助機能
// =============================================================================

class VisualAccessibilityController {
    constructor() {
        this.currentZoom = 1.0;
        this.currentColorScheme = 'light';
        this.currentFontSize = 16;
        
        // 設定をローカルストレージから復元
        this.loadSettings();
    }

    /**
     * 画像拡大・ズーム
     */
    setupImageZoom(imageSelector = 'img') {
        document.querySelectorAll(imageSelector).forEach(img => {
            img.style.cursor = 'zoom-in';
            img.addEventListener('click', (e) => {
                this.zoomImage(e.target);
            });
        });
    }

    zoomImage(imgElement) {
        // モーダルで拡大表示
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            cursor: zoom-out;
        `;

        const zoomedImg = document.createElement('img');
        zoomedImg.src = imgElement.src;
        zoomedImg.style.cssText = `
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
        `;

        modal.appendChild(zoomedImg);
        document.body.appendChild(modal);

        modal.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    /**
     * テキストハイライト
     */
    highlightText(selector, keyword, color = 'yellow') {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const text = el.textContent;
            if (text.includes(keyword)) {
                const highlightedText = text.replace(
                    new RegExp(keyword, 'gi'),
                    `<mark style="background-color: ${color};">$&</mark>`
                );
                el.innerHTML = highlightedText;
            }
        });
    }

    /**
     * カラースキーム切り替え
     */
    setColorScheme(scheme) {
        this.currentColorScheme = scheme;
        const root = document.documentElement;

        switch (scheme) {
            case 'dark':
                root.style.setProperty('--bg-color', '#1a1a1a');
                root.style.setProperty('--text-color', '#ffffff');
                root.style.setProperty('--link-color', '#66b3ff');
                document.body.style.backgroundColor = '#1a1a1a';
                document.body.style.color = '#ffffff';
                break;
            
            case 'high-contrast':
                root.style.setProperty('--bg-color', '#000000');
                root.style.setProperty('--text-color', '#ffff00');
                root.style.setProperty('--link-color', '#00ff00');
                document.body.style.backgroundColor = '#000000';
                document.body.style.color = '#ffff00';
                break;
            
            case 'light':
            default:
                root.style.setProperty('--bg-color', '#ffffff');
                root.style.setProperty('--text-color', '#000000');
                root.style.setProperty('--link-color', '#0066cc');
                document.body.style.backgroundColor = '#ffffff';
                document.body.style.color = '#000000';
                break;
        }

        this.saveSettings();
    }

    /**
     * フォントサイズ調整
     */
    setFontSize(size) {
        this.currentFontSize = size;
        document.documentElement.style.fontSize = `${size}px`;
        this.saveSettings();
    }

    increaseFontSize() {
        this.setFontSize(Math.min(this.currentFontSize + 2, 32));
    }

    decreaseFontSize() {
        this.setFontSize(Math.max(this.currentFontSize - 2, 12));
    }

    /**
     * 読みやすさ補助
     */
    setReadability(options = {}) {
        const style = document.createElement('style');
        style.id = 'readability-style';
        
        // 既存のスタイルを削除
        const existing = document.getElementById('readability-style');
        if (existing) {
            existing.remove();
        }

        const lineHeight = options.lineHeight || 1.6;
        const letterSpacing = options.letterSpacing || '0.05em';
        const wordSpacing = options.wordSpacing || '0.1em';

        style.textContent = `
            body {
                line-height: ${lineHeight} !important;
                letter-spacing: ${letterSpacing} !important;
                word-spacing: ${wordSpacing} !important;
            }
        `;

        document.head.appendChild(style);
        this.saveSettings();
    }

    /**
     * 設定保存
     */
    saveSettings() {
        const settings = {
            colorScheme: this.currentColorScheme,
            fontSize: this.currentFontSize,
            zoom: this.currentZoom
        };
        localStorage.setItem('accessibility_settings', JSON.stringify(settings));
    }

    /**
     * 設定読み込み
     */
    loadSettings() {
        const saved = localStorage.getItem('accessibility_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (settings.colorScheme) {
                this.setColorScheme(settings.colorScheme);
            }
            if (settings.fontSize) {
                this.setFontSize(settings.fontSize);
            }
        }
    }
}

// =============================================================================
// グローバルインスタンス
// =============================================================================

// 初期化関数
function initializeMultimodalLearning() {
    window.ttsController = new TextToSpeechController();
    window.sttController = new SpeechRecognitionController();
    window.visualController = new VisualAccessibilityController();
    
    console.log('Multimodal Learning System initialized');
}

// DOMContentLoaded時に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMultimodalLearning);
} else {
    initializeMultimodalLearning();
}
