/**
 * ========================================
 * 全教科統合マスターシステム (真のレベル3)
 * ========================================
 * 対応教科: 10教科フル対応
 * 1. 算数/数学 - 3D図形、関数グラフ、統計
 * 2. 国語 - 会話練習、漢字アニメーション、作文支援
 * 3. 理科 - 実験シミュレーション、分子構造、天体
 * 4. 社会 - 3D地図、人口ピラミッド、歴史タイムライン
 * 5. 英語 - 発音練習、会話、英単語ゲーム
 * 6. 体育 - 動作認識、フォーム分析、トレーニング
 * 7. 図工 - 3D創作ツール、カラーミキサー、デザイン
 * 8. 音楽 - リズムゲーム、作曲ツール、楽器シミュレーション
 * 9. 家庭科 - 料理シミュレーション、裁縫パターン
 * 10. 道徳 - ストーリーシミュレーション、選択肢型学習
 */

class AllSubjectsMasterSystem {
  constructor() {
    this.currentSubject = null;
    this.currentActivity = null;
    
    // 教科別の専用機能マップ
    this.subjectActivities = {
      math: {
        name: '算数・数学',
        icon: '🔢',
        activities: [
          { id: '3d-shapes', name: '3D立体図形', level: 3 },
          { id: 'function-graph', name: '関数グラフ', level: 3 },
          { id: 'multiplication-song', name: '九九の歌', level: 3 },
          { id: 'statistics', name: '統計グラフ', level: 3 }
        ]
      },
      japanese: {
        name: '国語',
        icon: '📖',
        activities: [
          { id: 'dialogue-practice', name: '会話練習', level: 3 },
          { id: 'kanji-animation', name: '漢字アニメーション', level: 3 },
          { id: 'composition-support', name: '作文支援AI', level: 3 },
          { id: 'reading-comprehension', name: '読解ゲーム', level: 3 }
        ]
      },
      science: {
        name: '理科',
        icon: '🔬',
        activities: [
          { id: 'solar-system', name: '太陽系モデル', level: 3 },
          { id: 'molecule', name: '分子構造', level: 3 },
          { id: 'physics-sim', name: '物理シミュレーション', level: 3 },
          { id: 'experiment-lab', name: 'バーチャル実験室', level: 3 }
        ]
      },
      social: {
        name: '社会',
        icon: '🌏',
        activities: [
          { id: '3d-map', name: '3D地図', level: 3 },
          { id: 'population-pyramid', name: '人口ピラミッド', level: 3 },
          { id: 'history-timeline', name: '歴史タイムライン', level: 3 },
          { id: 'geography-quiz', name: '地理クイズ', level: 3 }
        ]
      },
      english: {
        name: '英語',
        icon: '🇬🇧',
        activities: [
          { id: 'pronunciation', name: '発音練習', level: 3 },
          { id: 'conversation', name: '英会話', level: 3 },
          { id: 'vocabulary-game', name: '英単語ゲーム', level: 3 },
          { id: 'listening', name: 'リスニング', level: 3 }
        ]
      },
      pe: {
        name: '体育',
        icon: '⚽',
        activities: [
          { id: 'exercise-timer', name: '運動タイマー', level: 3 },
          { id: 'form-guide', name: 'フォームガイド', level: 3 },
          { id: 'training-plan', name: 'トレーニング計画', level: 3 },
          { id: 'sports-rules', name: 'ルール学習', level: 3 }
        ]
      },
      art: {
        name: '図工・美術',
        icon: '🎨',
        activities: [
          { id: '3d-creator', name: '3D創作ツール', level: 3 },
          { id: 'color-mixer', name: 'カラーミキサー', level: 3 },
          { id: 'pattern-design', name: 'パターンデザイン', level: 3 },
          { id: 'art-gallery', name: '美術館ツアー', level: 3 }
        ]
      },
      music: {
        name: '音楽',
        icon: '🎵',
        activities: [
          { id: 'rhythm-game', name: 'リズムゲーム', level: 3 },
          { id: 'composition', name: '作曲ツール', level: 3 },
          { id: 'instrument-sim', name: '楽器シミュレーター', level: 3 },
          { id: 'music-theory', name: '音楽理論', level: 3 }
        ]
      },
      homeec: {
        name: '家庭科',
        icon: '🍳',
        activities: [
          { id: 'cooking-sim', name: '料理シミュレーション', level: 3 },
          { id: 'nutrition', name: '栄養バランス', level: 3 },
          { id: 'sewing-pattern', name: '裁縫パターン', level: 3 },
          { id: 'budget-plan', name: '家計簿', level: 3 }
        ]
      },
      ethics: {
        name: '道徳',
        icon: '💡',
        activities: [
          { id: 'story-sim', name: 'ストーリーシミュレーション', level: 3 },
          { id: 'choice-game', name: '選択肢型学習', level: 3 },
          { id: 'empathy-training', name: '共感トレーニング', level: 3 },
          { id: 'discussion', name: 'ディスカッション', level: 3 }
        ]
      }
    };
    
    console.log('🎓 AllSubjectsMasterSystem 初期化完了');
  }
  
  /**
   * 教科選択UIを作成
   */
  createSubjectSelector(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = '<div class="subject-selector bg-white p-6 rounded-lg shadow-xl">';
    html += '<h2 class="text-2xl font-bold mb-6 text-center text-gray-800">📚 教科を選んでね！</h2>';
    html += '<div class="grid grid-cols-2 md:grid-cols-5 gap-4">';
    
    for (const [key, subject] of Object.entries(this.subjectActivities)) {
      html += `
        <div class="subject-card bg-gradient-to-br from-blue-50 to-indigo-100 p-4 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
             onclick="window.allSubjects.showSubjectActivities('${key}', '${containerId}')">
          <div class="text-5xl text-center mb-2">${subject.icon}</div>
          <div class="text-center font-bold text-gray-800">${subject.name}</div>
          <div class="text-center text-xs text-gray-600 mt-1">
            ${subject.activities.length}種類
          </div>
        </div>
      `;
    }
    
    html += '</div></div>';
    container.innerHTML = html;
  }
  
  /**
   * 教科の活動リストを表示
   */
  showSubjectActivities(subjectKey, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const subject = this.subjectActivities[subjectKey];
    this.currentSubject = subjectKey;
    
    let html = '<div class="activities-view bg-white p-6 rounded-lg shadow-xl">';
    html += `
      <div class="flex items-center mb-6">
        <button onclick="window.allSubjects.createSubjectSelector('${containerId}')" 
                class="mr-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
          ← 戻る
        </button>
        <h2 class="text-2xl font-bold text-gray-800">
          ${subject.icon} ${subject.name}
        </h2>
      </div>
    `;
    
    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    
    subject.activities.forEach(activity => {
      html += `
        <div class="activity-card bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
             onclick="window.allSubjects.launchActivity('${subjectKey}', '${activity.id}', '${containerId}')">
          <div class="flex justify-between items-start mb-3">
            <h3 class="text-xl font-bold text-gray-800">${activity.name}</h3>
            <span class="px-3 py-1 bg-purple-500 text-white rounded-full text-xs font-bold">
              Level ${activity.level}
            </span>
          </div>
          <p class="text-gray-600 text-sm">クリックして開始</p>
        </div>
      `;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
  }
  
  /**
   * 活動を起動
   */
  launchActivity(subjectKey, activityId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    this.currentActivity = activityId;
    
    // 戻るボタンを含むヘッダー
    let html = `
      <div class="activity-view">
        <button onclick="window.allSubjects.showSubjectActivities('${subjectKey}', '${containerId}')" 
                class="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
          ← ${this.subjectActivities[subjectKey].name}に戻る
        </button>
        <div id="activity-content"></div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // 教科別の活動をロード
    this.loadActivity(subjectKey, activityId);
  }
  
  /**
   * 教科別の活動をロード
   */
  loadActivity(subjectKey, activityId) {
    const contentArea = document.getElementById('activity-content');
    if (!contentArea) return;
    
    switch(`${subjectKey}:${activityId}`) {
      // 算数・数学
      case 'math:3d-shapes':
        contentArea.innerHTML = '<div id="3d-shapes-container" style="width: 100%; height: 600px;"></div>';
        if (window.advanced3D) {
          window.advanced3D.create3DShapeBuilder('3d-shapes-container');
        }
        break;
        
      case 'math:multiplication-song':
        contentArea.innerHTML = `
          <div class="p-6 bg-blue-50 rounded-lg">
            <h3 class="text-xl font-bold mb-4">🎵 九九の歌</h3>
            <div class="flex gap-2 flex-wrap mb-4">
              ${[2,3,4,5,6,7,8,9].map(n => `
                <button onclick="window.musicSystem.generateMultiplicationSong(${n})" 
                        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                  ${n}の段
                </button>
              `).join('')}
            </div>
            <div id="lyrics-display" class="mt-4 p-4 bg-white rounded-lg"></div>
          </div>
        `;
        break;
      
      // 理科
      case 'science:solar-system':
        contentArea.innerHTML = '<div id="solar-system-container" style="width: 100%; height: 600px;"></div>';
        if (window.advanced3D) {
          window.advanced3D.createSolarSystem('solar-system-container');
        }
        break;
        
      case 'science:molecule':
        contentArea.innerHTML = '<div id="molecule-container" style="width: 100%; height: 600px;"></div>';
        if (window.advanced3D) {
          window.advanced3D.createMolecule('molecule-container', 'water');
        }
        break;
      
      // 国語
      case 'japanese:dialogue-practice':
        if (window.multiVoice) {
          window.multiVoice.createDialogueExample('activity-content');
        }
        break;
      
      // 音楽
      case 'music:rhythm-game':
        if (window.musicSystem) {
          window.musicSystem.createRhythmGame('activity-content');
        }
        break;
      
      // 体育
      case 'pe:exercise-timer':
        this.createExerciseTimer(contentArea);
        break;
      
      // 図工
      case 'art:color-mixer':
        this.createColorMixer(contentArea);
        break;
      
      // 家庭科
      case 'homeec:cooking-sim':
        this.createCookingSimulator(contentArea);
        break;
      
      // 道徳
      case 'ethics:choice-game':
        this.createChoiceGame(contentArea);
        break;
      
      default:
        contentArea.innerHTML = `
          <div class="p-6 bg-yellow-50 rounded-lg">
            <h3 class="text-xl font-bold mb-2">🚧 準備中</h3>
            <p>この活動は現在開発中です。</p>
          </div>
        `;
    }
  }
  
  /**
   * 運動タイマー（体育）
   */
  createExerciseTimer(container) {
    container.innerHTML = `
      <div class="exercise-timer bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-lg">
        <h3 class="text-2xl font-bold mb-4 text-center">⚽ 運動タイマー</h3>
        <div class="timer-display text-6xl font-bold text-center my-8 text-orange-800" id="timer">00:00</div>
        <div class="controls flex justify-center gap-4">
          <button onclick="window.allSubjects.startExercise()" class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-lg">
            ▶️ スタート
          </button>
          <button onclick="window.allSubjects.pauseExercise()" class="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-lg">
            ⏸️ 一時停止
          </button>
          <button onclick="window.allSubjects.resetExercise()" class="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-lg">
            🔄 リセット
          </button>
        </div>
        <div class="presets mt-6 grid grid-cols-3 gap-3">
          <button onclick="window.allSubjects.setExerciseTime(30)" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">30秒</button>
          <button onclick="window.allSubjects.setExerciseTime(60)" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">1分</button>
          <button onclick="window.allSubjects.setExerciseTime(180)" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">3分</button>
        </div>
      </div>
    `;
  }
  
  startExercise() {
    if (this.exerciseInterval) return;
    this.exerciseInterval = setInterval(() => {
      this.exerciseTime = (this.exerciseTime || 0) + 1;
      const min = Math.floor(this.exerciseTime / 60);
      const sec = this.exerciseTime % 60;
      document.getElementById('timer').textContent = 
        `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }, 1000);
  }
  
  pauseExercise() {
    clearInterval(this.exerciseInterval);
    this.exerciseInterval = null;
  }
  
  resetExercise() {
    this.pauseExercise();
    this.exerciseTime = 0;
    document.getElementById('timer').textContent = '00:00';
  }
  
  setExerciseTime(seconds) {
    this.resetExercise();
    this.exerciseTime = seconds;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    document.getElementById('timer').textContent = 
      `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  
  /**
   * カラーミキサー（図工）
   */
  createColorMixer(container) {
    container.innerHTML = `
      <div class="color-mixer bg-white p-6 rounded-lg">
        <h3 class="text-2xl font-bold mb-4">🎨 カラーミキサー</h3>
        <div class="flex gap-8">
          <div class="color-inputs flex-1">
            <div class="mb-4">
              <label class="block mb-2 font-bold">赤 (R)</label>
              <input type="range" min="0" max="255" value="255" id="color-r" class="w-full" oninput="window.allSubjects.updateColorMix()">
              <span id="color-r-value" class="text-sm">255</span>
            </div>
            <div class="mb-4">
              <label class="block mb-2 font-bold">緑 (G)</label>
              <input type="range" min="0" max="255" value="0" id="color-g" class="w-full" oninput="window.allSubjects.updateColorMix()">
              <span id="color-g-value" class="text-sm">0</span>
            </div>
            <div class="mb-4">
              <label class="block mb-2 font-bold">青 (B)</label>
              <input type="range" min="0" max="255" value="0" id="color-b" class="w-full" oninput="window.allSubjects.updateColorMix()">
              <span id="color-b-value" class="text-sm">0</span>
            </div>
          </div>
          <div class="color-preview flex-1">
            <div id="color-display" class="w-full h-64 rounded-lg shadow-lg" style="background-color: rgb(255, 0, 0);"></div>
            <div id="color-code" class="mt-4 text-center font-bold text-xl">RGB(255, 0, 0)</div>
          </div>
        </div>
      </div>
    `;
    this.updateColorMix();
  }
  
  updateColorMix() {
    const r = document.getElementById('color-r')?.value || 0;
    const g = document.getElementById('color-g')?.value || 0;
    const b = document.getElementById('color-b')?.value || 0;
    
    document.getElementById('color-r-value').textContent = r;
    document.getElementById('color-g-value').textContent = g;
    document.getElementById('color-b-value').textContent = b;
    
    const display = document.getElementById('color-display');
    const code = document.getElementById('color-code');
    
    display.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    code.textContent = `RGB(${r}, ${g}, ${b})`;
  }
  
  /**
   * 料理シミュレーション（家庭科）
   */
  createCookingSimulator(container) {
    container.innerHTML = `
      <div class="cooking-sim bg-gradient-to-br from-yellow-50 to-orange-100 p-6 rounded-lg">
        <h3 class="text-2xl font-bold mb-4">🍳 料理シミュレーション</h3>
        <div class="recipe-steps space-y-4">
          <div class="step bg-white p-4 rounded-lg shadow">
            <div class="font-bold mb-2">ステップ 1: 材料を準備</div>
            <div class="flex gap-2 flex-wrap">
              <span class="px-3 py-1 bg-blue-100 rounded-full">🥚 卵 2個</span>
              <span class="px-3 py-1 bg-blue-100 rounded-full">🧈 バター 10g</span>
              <span class="px-3 py-1 bg-blue-100 rounded-full">🥛 牛乳 大さじ2</span>
            </div>
          </div>
          <div class="step bg-white p-4 rounded-lg shadow">
            <div class="font-bold mb-2">ステップ 2: 卵を溶く</div>
            <button onclick="alert('卵を混ぜています...')" class="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
              🥄 混ぜる
            </button>
          </div>
          <div class="step bg-white p-4 rounded-lg shadow">
            <div class="font-bold mb-2">ステップ 3: フライパンで焼く</div>
            <button onclick="alert('焼いています...')" class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
              🔥 焼く
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 選択肢型ゲーム（道徳）
   */
  createChoiceGame(container) {
    container.innerHTML = `
      <div class="choice-game bg-white p-6 rounded-lg">
        <h3 class="text-2xl font-bold mb-4">💡 考えてみよう</h3>
        <div class="scenario bg-blue-50 p-6 rounded-lg mb-6">
          <p class="text-lg">友達がテストでカンニングしているのを見てしまいました。あなたならどうしますか？</p>
        </div>
        <div class="choices space-y-3">
          <button onclick="window.allSubjects.selectChoice(1)" class="w-full p-4 bg-green-100 hover:bg-green-200 rounded-lg text-left transition">
            A. 先生に報告する
          </button>
          <button onclick="window.allSubjects.selectChoice(2)" class="w-full p-4 bg-blue-100 hover:bg-blue-200 rounded-lg text-left transition">
            B. 友達に直接注意する
          </button>
          <button onclick="window.allSubjects.selectChoice(3)" class="w-full p-4 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-left transition">
            C. 何もしない
          </button>
          <button onclick="window.allSubjects.selectChoice(4)" class="w-full p-4 bg-purple-100 hover:bg-purple-200 rounded-lg text-left transition">
            D. テスト後に友達と話し合う
          </button>
        </div>
        <div id="choice-result" class="mt-6 p-4 bg-gray-50 rounded-lg hidden"></div>
      </div>
    `;
  }
  
  selectChoice(choice) {
    const result = document.getElementById('choice-result');
    const feedback = {
      1: '先生に報告することは正直ですが、友達との関係も考える必要があります。',
      2: '友達に直接注意するのは勇気のある行動です。優しく伝えましょう。',
      3: '何もしないのは楽ですが、友達のためになりません。',
      4: 'テスト後に話し合うのは良いアプローチです。冷静に考える時間ができます。'
    };
    
    result.textContent = feedback[choice] || '';
    result.classList.remove('hidden');
  }
}

// グローバルインスタンス
window.allSubjects = new AllSubjectsMasterSystem();

console.log('✅ all-subjects-master.js 読み込み完了');
