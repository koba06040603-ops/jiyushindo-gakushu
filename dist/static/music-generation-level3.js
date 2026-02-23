/**
 * ========================================
 * 音楽生成・リズム学習システム (真のレベル3)
 * ========================================
 * 使用技術:
 * - Tone.js: 音楽合成、リズムパターン、メロディー生成
 * - Web Audio API: 複数音声の同時再生
 * 
 * 機能:
 * 1. 九九の歌自動生成（算数）
 * 2. リズムゲーム（音楽）
 * 3. 複数音声による会話（国語・英語）
 * 4. 学習用BGM自動生成
 */

class MusicGenerationSystem {
  constructor() {
    this.synth = null;
    this.sequences = [];
    this.isPlaying = false;
    
    console.log('🎵 MusicGenerationSystem 初期化開始');
    this.init();
  }
  
  async init() {
    // Tone.jsを動的に読み込み
    if (typeof Tone === 'undefined') {
      await this.loadToneJS();
    }
    
    // シンセサイザー初期化
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    
    console.log('✅ MusicGenerationSystem 初期化完了');
  }
  
  /**
   * Tone.jsを動的に読み込み
   */
  async loadToneJS() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tone@14.8.49/build/Tone.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  /**
   * 九九の歌を生成（算数）
   * @param {number} number - 段数（2-9）
   */
  async generateMultiplicationSong(number) {
    await Tone.start(); // ユーザーインタラクション後に開始
    
    const lyrics = [];
    const notes = [];
    
    // C major scale
    const scale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
    
    for (let i = 1; i <= 9; i++) {
      const result = number * i;
      lyrics.push(`${number}×${i}は${result}`);
      
      // メロディーをランダムに生成（実際は規則的な方が良い）
      notes.push({
        time: (i - 1) * 0.5,
        note: scale[i % 8],
        duration: '8n'
      });
    }
    
    // シーケンス作成
    const sequence = new Tone.Sequence((time, note) => {
      this.synth.triggerAttackRelease(note.note, note.duration, time);
    }, notes.map(n => ({ note: n.note, duration: n.duration })), '4n');
    
    sequence.start(0);
    Tone.Transport.start();
    
    // 歌詞表示
    this.displayLyrics(lyrics);
    
    // 8秒後に停止
    setTimeout(() => {
      Tone.Transport.stop();
      sequence.dispose();
    }, 8000);
  }
  
  /**
   * 歌詞を表示
   */
  displayLyrics(lyrics) {
    const container = document.getElementById('lyrics-display') || this.createLyricsDisplay();
    container.innerHTML = '<div class="text-center text-lg font-bold">' + lyrics.join('<br>') + '</div>';
  }
  
  /**
   * 歌詞表示エリアを作成
   */
  createLyricsDisplay() {
    const container = document.createElement('div');
    container.id = 'lyrics-display';
    container.className = 'fixed bottom-32 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-xl z-40';
    document.body.appendChild(container);
    return container;
  }
  
  /**
   * リズムゲーム（音楽）
   */
  createRhythmGame(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="rhythm-game bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg">
        <h3 class="text-2xl font-bold mb-4 text-center text-purple-800">🎵 リズムゲーム</h3>
        
        <div class="game-area relative bg-white rounded-lg p-8 h-96 overflow-hidden">
          <div id="rhythm-track" class="absolute top-0 left-0 w-full h-full">
            <!-- ノーツがここに表示される -->
          </div>
          
          <div class="hit-line absolute bottom-16 left-0 w-full h-2 bg-red-500"></div>
          
          <div class="controls absolute bottom-4 left-0 w-full flex justify-center gap-4">
            <button onclick="window.musicSystem.hitNote(0)" class="hit-btn w-16 h-16 bg-blue-500 text-white rounded-full text-2xl font-bold hover:bg-blue-600 active:scale-95 transition">
              A
            </button>
            <button onclick="window.musicSystem.hitNote(1)" class="hit-btn w-16 h-16 bg-green-500 text-white rounded-full text-2xl font-bold hover:bg-green-600 active:scale-95 transition">
              S
            </button>
            <button onclick="window.musicSystem.hitNote(2)" class="hit-btn w-16 h-16 bg-yellow-500 text-white rounded-full text-2xl font-bold hover:bg-yellow-600 active:scale-95 transition">
              D
            </button>
            <button onclick="window.musicSystem.hitNote(3)" class="hit-btn w-16 h-16 bg-red-500 text-white rounded-full text-2xl font-bold hover:bg-red-600 active:scale-95 transition">
              F
            </button>
          </div>
        </div>
        
        <div class="score-display mt-4 text-center">
          <div class="text-2xl font-bold text-purple-800">スコア: <span id="rhythm-score">0</span></div>
          <div class="text-lg text-gray-600">コンボ: <span id="rhythm-combo">0</span></div>
        </div>
        
        <div class="controls mt-4 flex justify-center gap-4">
          <button onclick="window.musicSystem.startRhythmGame()" class="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-lg font-bold">
            ▶️ スタート
          </button>
          <button onclick="window.musicSystem.stopRhythmGame()" class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-lg font-bold">
            ⏹️ 停止
          </button>
        </div>
      </div>
    `;
    
    // キーボードイベント
    document.addEventListener('keydown', (e) => {
      const keyMap = { 'a': 0, 's': 1, 'd': 2, 'f': 3 };
      if (keyMap[e.key.toLowerCase()] !== undefined) {
        this.hitNote(keyMap[e.key.toLowerCase()]);
      }
    });
  }
  
  /**
   * リズムゲーム開始
   */
  async startRhythmGame() {
    await Tone.start();
    
    this.isPlaying = true;
    this.score = 0;
    this.combo = 0;
    this.notes = [];
    
    // ノーツ生成ループ
    this.noteGenerationInterval = setInterval(() => {
      if (this.isPlaying) {
        this.spawnNote();
      }
    }, 1000);
    
    // ノーツ移動ループ
    this.noteUpdateInterval = setInterval(() => {
      this.updateNotes();
    }, 16); // 60fps
  }
  
  /**
   * リズムゲーム停止
   */
  stopRhythmGame() {
    this.isPlaying = false;
    clearInterval(this.noteGenerationInterval);
    clearInterval(this.noteUpdateInterval);
    
    // 結果表示
    if (window.visualFeedback) {
      window.visualFeedback.showScorePopup(this.score, `最終コンボ: ${this.combo}`);
    }
  }
  
  /**
   * ノーツを生成
   */
  spawnNote() {
    const lane = Math.floor(Math.random() * 4);
    const track = document.getElementById('rhythm-track');
    if (!track) return;
    
    const note = document.createElement('div');
    note.className = 'rhythm-note absolute w-12 h-12 rounded-full';
    note.style.left = `${25 * lane + 12.5}%`;
    note.style.top = '0px';
    note.dataset.lane = lane;
    note.dataset.y = 0;
    
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
    note.classList.add(colors[lane]);
    
    track.appendChild(note);
    this.notes.push({ element: note, lane, y: 0 });
    
    // 音を鳴らす
    const notes = ['C4', 'D4', 'E4', 'F4'];
    this.synth.triggerAttackRelease(notes[lane], '8n');
  }
  
  /**
   * ノーツを更新
   */
  updateNotes() {
    this.notes.forEach((note, index) => {
      note.y += 3;
      note.element.style.top = `${note.y}px`;
      
      // 画面外に出たら削除
      if (note.y > 400) {
        note.element.remove();
        this.notes.splice(index, 1);
        this.combo = 0;
        document.getElementById('rhythm-combo').textContent = this.combo;
      }
    });
  }
  
  /**
   * ノーツをヒット
   */
  hitNote(lane) {
    const hitZone = { top: 300, bottom: 350 };
    
    const hitNotes = this.notes.filter(note => 
      note.lane === lane && 
      note.y >= hitZone.top && 
      note.y <= hitZone.bottom
    );
    
    if (hitNotes.length > 0) {
      // ヒット成功
      const note = hitNotes[0];
      note.element.remove();
      this.notes.splice(this.notes.indexOf(note), 1);
      
      this.combo++;
      this.score += 10 * this.combo;
      
      document.getElementById('rhythm-score').textContent = this.score;
      document.getElementById('rhythm-combo').textContent = this.combo;
      
      // エフェクト
      if (window.enhancedSoundEffects) {
        window.enhancedSoundEffects.playCorrectSound();
      }
    } else {
      // ミス
      this.combo = 0;
      document.getElementById('rhythm-combo').textContent = this.combo;
      
      if (window.enhancedSoundEffects) {
        window.enhancedSoundEffects.playIncorrectSound();
      }
    }
  }
  
  /**
   * 学習用BGM生成
   */
  async generateStudyBGM(mood = 'calm') {
    await Tone.start();
    
    const patterns = {
      calm: {
        chords: [['C4', 'E4', 'G4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['C4', 'E4', 'G4']],
        tempo: 60
      },
      energetic: {
        chords: [['C4', 'E4', 'G4'], ['D4', 'F#4', 'A4'], ['E4', 'G4', 'B4'], ['C4', 'E4', 'G4']],
        tempo: 120
      },
      focus: {
        chords: [['A3', 'C4', 'E4'], ['D4', 'F4', 'A4'], ['E4', 'G4', 'B4'], ['A3', 'C4', 'E4']],
        tempo: 80
      }
    };
    
    const pattern = patterns[mood] || patterns.calm;
    Tone.Transport.bpm.value = pattern.tempo;
    
    const sequence = new Tone.Sequence((time, chord) => {
      this.synth.triggerAttackRelease(chord, '2n', time);
    }, pattern.chords, '1m');
    
    sequence.start(0);
    sequence.loop = true;
    Tone.Transport.start();
    
    console.log(`🎵 ${mood} BGM再生中`);
  }
  
  /**
   * BGM停止
   */
  stopBGM() {
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }
}

/**
 * ========================================
 * 複数音声会話システム
 * ========================================
 * 目的: 国語・英語のダイアログ学習
 */
class MultiVoiceConversation {
  constructor() {
    this.speakers = [];
    this.currentDialogue = [];
    console.log('💬 MultiVoiceConversation 初期化完了');
  }
  
  /**
   * 話者を設定
   */
  async setupSpeakers() {
    const voices = speechSynthesis.getVoices();
    
    // 日本語音声を複数選択
    this.speakers = [
      voices.find(v => v.name.includes('Kyoko') || v.name.includes('Google 日本語')),
      voices.find(v => v.name.includes('Otoya') || v.name.includes('Microsoft Ayumi')),
      voices.find(v => v.name.includes('Google 日本語'))
    ].filter(Boolean);
    
    if (this.speakers.length === 0) {
      this.speakers = [voices[0], voices[1] || voices[0]];
    }
    
    console.log(`✅ ${this.speakers.length}人の話者を設定`);
  }
  
  /**
   * 会話を再生
   * @param {Array} dialogue - [{speaker: 0, text: "こんにちは"}, ...]
   */
  async playConversation(dialogue) {
    await this.setupSpeakers();
    
    for (let line of dialogue) {
      await this.speak(line.text, line.speaker || 0);
      await this.pause(500);
    }
  }
  
  /**
   * 指定した話者で読み上げ
   */
  speak(text, speakerIndex) {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.speakers[speakerIndex % this.speakers.length];
      utterance.rate = 1.0;
      utterance.pitch = speakerIndex === 0 ? 1.2 : 0.9; // 話者によってピッチ変更
      
      utterance.onend = resolve;
      speechSynthesis.speak(utterance);
      
      // 字幕表示
      if (window.subtitleDisplay) {
        window.subtitleDisplay.showSubtitle(text);
      }
    });
  }
  
  /**
   * 一時停止
   */
  pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 会話例を作成（国語：ダイアログ学習）
   */
  createDialogueExample(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const dialogue = [
      { speaker: 0, text: '太郎: おはようございます！' },
      { speaker: 1, text: '花子: おはよう、太郎くん。今日は良い天気ね。' },
      { speaker: 0, text: '太郎: はい！公園で遊びませんか？' },
      { speaker: 1, text: '花子: いいわね！行きましょう。' }
    ];
    
    container.innerHTML = `
      <div class="conversation-player bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg">
        <h3 class="text-xl font-bold mb-4 text-green-800">💬 会話練習</h3>
        <div class="dialogue-lines space-y-3 mb-4">
          ${dialogue.map(line => `
            <div class="dialogue-line p-3 bg-white rounded-lg shadow">
              ${line.text}
            </div>
          `).join('')}
        </div>
        <button onclick="window.multiVoice.playConversation(${JSON.stringify(dialogue)})" 
                class="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-lg font-bold">
          🔊 会話を再生
        </button>
      </div>
    `;
  }
}

// グローバルインスタンス
window.musicSystem = new MusicGenerationSystem();
window.multiVoice = new MultiVoiceConversation();

console.log('✅ music-generation-level3.js 読み込み完了');
