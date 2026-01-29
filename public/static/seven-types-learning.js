/**
 * ========================================
 * 7タイプ個別最適化学習システム
 * ========================================
 * 
 * 基本3タイプ（VARK理論）:
 * 1. Visual（視覚型）- 図・色・イメージで学ぶ
 * 2. Auditory（聴覚型）- 音・説明・リズムで学ぶ
 * 3. Kinesthetic（体感型）- 体験・操作・動きで学ぶ
 * 
 * 拡張4タイプ（多重知能 + コルブ）:
 * 4. Logical（論理型）- 論理・パターン・システム思考
 * 5. Social（社会型）- 協働・対話・グループ学習
 * 6. Solitary（独習型）- 個人・内省・自己ペース
 * 7. Nature（自然型）- 実世界・観察・分類
 * 
 * 各タイプに最適化された学習体験を提供
 */

class SevenTypesLearningSystem {
  constructor() {
    this.learningTypes = {
      visual: {
        name: '視覚型',
        icon: '👁️',
        color: '#3b82f6',
        description: '図やイラスト、色分けで学ぶのが得意',
        strategies: [
          '3D図形・アニメーション',
          'カラーコーディング',
          'マインドマップ',
          '図解・チャート'
        ],
        keywords: ['見る', '図', '色', 'イメージ', '視覚化']
      },
      auditory: {
        name: '聴覚型',
        icon: '👂',
        color: '#10b981',
        description: '音声や説明、リズムで学ぶのが得意',
        strategies: [
          '音声読み上げ',
          'リズム・歌',
          '対話学習',
          '音声メモ'
        ],
        keywords: ['聞く', '音', 'リズム', '説明', '会話']
      },
      kinesthetic: {
        name: '体感型',
        icon: '✋',
        color: '#f59e0b',
        description: '体を動かして、実際に操作して学ぶのが得意',
        strategies: [
          'ドラッグ&ドロップ',
          '物理シミュレーション',
          '実験・体験',
          'ジェスチャー操作'
        ],
        keywords: ['触る', '動かす', '体験', '操作', '実践']
      },
      logical: {
        name: '論理型',
        icon: '🧮',
        color: '#8b5cf6',
        description: 'パターンや論理、システム思考で学ぶのが得意',
        strategies: [
          'アルゴリズム可視化',
          'パターン認識',
          '因果関係の図解',
          'フローチャート'
        ],
        keywords: ['論理', 'パターン', 'システム', '原因', '結果']
      },
      social: {
        name: '社会型',
        icon: '👥',
        color: '#ec4899',
        description: 'グループ学習や対話を通じて学ぶのが得意',
        strategies: [
          'ペア学習',
          'ディスカッション',
          'ロールプレイ',
          '協働プロジェクト'
        ],
        keywords: ['協力', '対話', 'グループ', '共有', '教え合い']
      },
      solitary: {
        name: '独習型',
        icon: '🧘',
        color: '#06b6d4',
        description: '一人で集中して、自分のペースで学ぶのが得意',
        strategies: [
          '自己診断テスト',
          '個人プロジェクト',
          '内省ジャーナル',
          'マイペース学習'
        ],
        keywords: ['一人', '集中', '内省', '自己', 'ペース']
      },
      nature: {
        name: '自然型',
        icon: '🌿',
        color: '#84cc16',
        description: '実世界の観察や分類、自然との関わりで学ぶのが得意',
        strategies: [
          '実世界の例',
          '分類・カテゴリー化',
          '観察日記',
          'フィールドワーク'
        ],
        keywords: ['観察', '自然', '実世界', '分類', '環境']
      }
    };
    
    this.currentType = 'visual'; // デフォルト
    this.mixedTypes = []; // 複数タイプ対応
    
    console.log('✅ SevenTypesLearningSystem 初期化完了');
  }
  
  /**
   * 学習タイプ診断
   * 簡易版：質問に答えて最適なタイプを判定
   */
  async diagnoseLearningSty() {
    const questions = [
      {
        q: '新しいことを学ぶとき、どれが一番好きですか？',
        options: [
          { text: '図やイラストを見る', type: 'visual', score: 3 },
          { text: '説明を聞く', type: 'auditory', score: 3 },
          { text: '実際に試してみる', type: 'kinesthetic', score: 3 },
          { text: '仕組みを考える', type: 'logical', score: 3 },
          { text: '友達と話し合う', type: 'social', score: 3 },
          { text: '一人でじっくり考える', type: 'solitary', score: 3 },
          { text: '実際の例で学ぶ', type: 'nature', score: 3 }
        ]
      },
      {
        q: '問題を解くとき、どうしますか？',
        options: [
          { text: '図を描いてみる', type: 'visual', score: 2 },
          { text: '声に出して読む', type: 'auditory', score: 2 },
          { text: '実際に動かしてみる', type: 'kinesthetic', score: 2 },
          { text: 'パターンを探す', type: 'logical', score: 2 },
          { text: '誰かに相談する', type: 'social', score: 2 },
          { text: '静かに考える', type: 'solitary', score: 2 },
          { text: '実例で考える', type: 'nature', score: 2 }
        ]
      },
      {
        q: '休み時間は何をしたいですか？',
        options: [
          { text: '絵を描く・見る', type: 'visual', score: 1 },
          { text: '音楽を聴く・歌う', type: 'auditory', score: 1 },
          { text: '体を動かす', type: 'kinesthetic', score: 1 },
          { text: 'パズルをする', type: 'logical', score: 1 },
          { text: '友達と遊ぶ', type: 'social', score: 1 },
          { text: '読書する', type: 'solitary', score: 1 },
          { text: '外で遊ぶ', type: 'nature', score: 1 }
        ]
      }
    ];
    
    return questions;
  }
  
  /**
   * 診断結果から最適タイプを判定
   */
  calculateLearningType(answers) {
    const scores = {};
    
    // 各タイプのスコアを集計
    Object.keys(this.learningTypes).forEach(type => {
      scores[type] = 0;
    });
    
    answers.forEach(answer => {
      scores[answer.type] += answer.score;
    });
    
    // トップ3を取得
    const sorted = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    const primaryType = sorted[0][0];
    const secondaryTypes = sorted.slice(1).map(([type]) => type);
    
    return {
      primary: primaryType,
      secondary: secondaryTypes,
      scores: scores,
      recommendation: this.generateRecommendation(primaryType, secondaryTypes)
    };
  }
  
  /**
   * 推奨学習方法を生成
   */
  generateRecommendation(primary, secondary) {
    const primaryInfo = this.learningTypes[primary];
    
    let recommendation = `あなたの主な学習タイプは「${primaryInfo.name}」です！\n\n`;
    recommendation += `${primaryInfo.icon} ${primaryInfo.description}\n\n`;
    recommendation += `おすすめの学習方法:\n`;
    
    primaryInfo.strategies.forEach((strategy, index) => {
      recommendation += `${index + 1}. ${strategy}\n`;
    });
    
    if (secondary.length > 0) {
      recommendation += `\nサブタイプ: `;
      recommendation += secondary.map(type => this.learningTypes[type].name).join('、');
      recommendation += `\nこれらの方法も組み合わせると効果的です。`;
    }
    
    return recommendation;
  }
  
  /**
   * タイプ別学習コンテンツ生成
   */
  generateContentForType(type, problemData) {
    const { problem_description, answer, card_title } = problemData;
    
    switch(type) {
      case 'visual':
        return this.generateVisualContent(problemData);
      
      case 'auditory':
        return this.generateAuditoryContent(problemData);
      
      case 'kinesthetic':
        return this.generateKinestheticContent(problemData);
      
      case 'logical':
        return this.generateLogicalContent(problemData);
      
      case 'social':
        return this.generateSocialContent(problemData);
      
      case 'solitary':
        return this.generateSolitaryContent(problemData);
      
      case 'nature':
        return this.generateNatureContent(problemData);
      
      default:
        return this.generateVisualContent(problemData);
    }
  }
  
  /**
   * 論理型コンテンツ
   */
  generateLogicalContent(problemData) {
    const { problem_description, answer, card_title } = problemData;
    
    return {
      title: card_title,
      content: `
        <div class="logical-problem bg-gradient-to-br from-purple-50 to-indigo-100 p-6 rounded-lg">
          <div class="problem-title text-xl font-bold mb-4 text-purple-800">
            🧮 ${card_title}
          </div>
          
          <div class="problem-breakdown bg-white p-4 rounded-lg mb-4">
            <h4 class="font-bold mb-2 text-purple-700">📋 問題の構造</h4>
            <div class="space-y-2">
              ${this.extractLogicalSteps(problem_description)}
            </div>
          </div>
          
          <div class="pattern-analysis bg-white p-4 rounded-lg mb-4">
            <h4 class="font-bold mb-2 text-purple-700">🔍 パターン分析</h4>
            <div id="pattern-display"></div>
          </div>
          
          <div class="flowchart bg-white p-4 rounded-lg">
            <h4 class="font-bold mb-2 text-purple-700">📊 解法フローチャート</h4>
            <div id="flowchart-display"></div>
          </div>
        </div>
      `,
      answer: answer,
      enhancements: ['論理構造', 'パターン', 'フローチャート']
    };
  }
  
  /**
   * 社会型コンテンツ
   */
  generateSocialContent(problemData) {
    const { problem_description, answer, card_title } = problemData;
    
    return {
      title: card_title,
      content: `
        <div class="social-problem bg-gradient-to-br from-pink-50 to-rose-100 p-6 rounded-lg">
          <div class="problem-title text-xl font-bold mb-4 text-pink-800">
            👥 ${card_title}
          </div>
          
          <div class="group-discussion bg-white p-4 rounded-lg mb-4">
            <h4 class="font-bold mb-2 text-pink-700">💬 グループディスカッション</h4>
            <p class="text-gray-700 mb-3">${problem_description}</p>
            <button onclick="window.sevenTypes.startGroupMode('${card_title}')" 
                    class="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
              👥 友達と一緒に考える
            </button>
          </div>
          
          <div class="peer-help bg-white p-4 rounded-lg mb-4">
            <h4 class="font-bold mb-2 text-pink-700">🤝 助け合い機能</h4>
            <button onclick="window.sevenTypes.requestHelp()" 
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
              ❓ 友達に質問する
            </button>
            <button onclick="window.sevenTypes.offerHelp()" 
                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
              ✋ 友達を助ける
            </button>
          </div>
          
          <div class="role-play bg-white p-4 rounded-lg">
            <h4 class="font-bold mb-2 text-pink-700">🎭 ロールプレイ</h4>
            <p class="text-sm text-gray-600">この問題を先生役・生徒役で説明し合ってみよう</p>
          </div>
        </div>
      `,
      answer: answer,
      enhancements: ['協働学習', 'ディスカッション', 'ロールプレイ']
    };
  }
  
  /**
   * 独習型コンテンツ
   */
  generateSolitaryContent(problemData) {
    const { problem_description, answer, card_title } = problemData;
    
    return {
      title: card_title,
      content: `
        <div class="solitary-problem bg-gradient-to-br from-cyan-50 to-blue-100 p-6 rounded-lg">
          <div class="problem-title text-xl font-bold mb-4 text-cyan-800">
            🧘 ${card_title}
          </div>
          
          <div class="self-paced bg-white p-4 rounded-lg mb-4">
            <h4 class="font-bold mb-2 text-cyan-700">⏱️ マイペース学習モード</h4>
            <p class="text-gray-700 mb-3">${problem_description}</p>
            <div class="flex gap-2">
              <button onclick="window.sevenTypes.setTimer(5)" class="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600">5分</button>
              <button onclick="window.sevenTypes.setTimer(10)" class="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600">10分</button>
              <button onclick="window.sevenTypes.setTimer(15)" class="px-3 py-1 bg-cyan-500 text-white rounded hover:bg-cyan-600">15分</button>
            </div>
          </div>
          
          <div class="reflection-journal bg-white p-4 rounded-lg mb-4">
            <h4 class="font-bold mb-2 text-cyan-700">📔 振り返りジャーナル</h4>
            <textarea id="reflection-text" 
                      class="w-full p-2 border rounded" 
                      rows="4" 
                      placeholder="何を学びましたか？どう感じましたか？"></textarea>
            <button onclick="window.sevenTypes.saveReflection()" 
                    class="mt-2 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600">
              💾 保存
            </button>
          </div>
          
          <div class="quiet-mode bg-white p-4 rounded-lg">
            <h4 class="font-bold mb-2 text-cyan-700">🔇 静かな環境モード</h4>
            <button onclick="window.sevenTypes.enableQuietMode()" 
                    class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              🌙 集中モードON
            </button>
          </div>
        </div>
      `,
      answer: answer,
      enhancements: ['自己ペース', '内省', '集中環境']
    };
  }
  
  /**
   * 自然型コンテンツ
   */
  generateNatureContent(problemData) {
    const { problem_description, answer, card_title } = problemData;
    
    return {
      title: card_title,
      content: `
        <div class="nature-problem bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg">
          <div class="problem-title text-xl font-bold mb-4 text-green-800">
            🌿 ${card_title}
          </div>
          
          <div class="real-world-example bg-white p-4 rounded-lg mb-4">
            <h4 class="font-bold mb-2 text-green-700">🌍 実世界の例</h4>
            <p class="text-gray-700 mb-3">${this.convertToRealWorld(problem_description)}</p>
          </div>
          
          <div class="observation-log bg-white p-4 rounded-lg mb-4">
            <h4 class="font-bold mb-2 text-green-700">🔭 観察ノート</h4>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="font-semibold">見つけたもの:</span>
                <input type="text" class="flex-1 p-2 border rounded" placeholder="何に気づきましたか？">
              </div>
              <div class="flex items-center gap-2">
                <span class="font-semibold">分類:</span>
                <select class="p-2 border rounded">
                  <option>同じ仲間</option>
                  <option>違う仲間</option>
                  <option>特別なもの</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="field-work bg-white p-4 rounded-lg">
            <h4 class="font-bold mb-2 text-green-700">🥾 フィールドワーク</h4>
            <p class="text-sm text-gray-600 mb-2">外に出て、同じような例を探してみよう</p>
            <button onclick="window.sevenTypes.startFieldWork()" 
                    class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              🌳 探しに行く
            </button>
          </div>
        </div>
      `,
      answer: answer,
      enhancements: ['実世界の例', '観察', '分類']
    };
  }
  
  /**
   * 論理的ステップを抽出
   */
  extractLogicalSteps(text) {
    // 簡易版：文章を分解してステップ化
    const steps = text.split(/[。、]/).filter(s => s.trim());
    
    return steps.map((step, index) => `
      <div class="flex items-start gap-2 p-2 bg-purple-50 rounded">
        <span class="font-bold text-purple-600">Step ${index + 1}:</span>
        <span>${step}</span>
      </div>
    `).join('');
  }
  
  /**
   * 実世界の例に変換
   */
  convertToRealWorld(text) {
    // 簡易版：算数の問題を実世界の状況に変換
    const realWorldExamples = {
      '足し算': 'りんごを集める',
      '引き算': 'お菓子を食べる',
      '掛け算': '花壇に花を植える',
      '割り算': 'ケーキを分ける'
    };
    
    let converted = text;
    Object.entries(realWorldExamples).forEach(([key, value]) => {
      if (text.includes(key)) {
        converted += `\n\n🌍 例えば: ${value}ときを想像してみよう`;
      }
    });
    
    return converted;
  }
  
  /**
   * 診断UIを作成
   */
  createDiagnosisUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="diagnosis-ui bg-white p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
        <h2 class="text-3xl font-bold text-center mb-6 text-gray-800">
          🎯 あなたの学習タイプ診断
        </h2>
        
        <div id="diagnosis-content" class="space-y-6">
          <div class="text-center">
            <button onclick="window.sevenTypes.startDiagnosis()" 
                    class="px-8 py-4 bg-blue-500 text-white text-xl rounded-lg hover:bg-blue-600 transition shadow-lg">
              診断を始める
            </button>
          </div>
        </div>
        
        <div class="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          ${Object.entries(this.learningTypes).map(([key, type]) => `
            <div class="type-card p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg text-center">
              <div class="text-4xl mb-2">${type.icon}</div>
              <div class="font-bold text-sm">${type.name}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * 診断開始
   */
  async startDiagnosis() {
    const questions = await this.diagnoseLearningSty();
    this.currentQuestionIndex = 0;
    this.answers = [];
    
    this.showQuestion(questions[0]);
  }
  
  /**
   * 質問を表示
   */
  showQuestion(question) {
    const content = document.getElementById('diagnosis-content');
    if (!content) return;
    
    content.innerHTML = `
      <div class="question-card">
        <h3 class="text-2xl font-bold mb-6 text-center">${question.q}</h3>
        <div class="options space-y-3">
          ${question.options.map((option, index) => `
            <button onclick="window.sevenTypes.selectAnswer(${index})" 
                    class="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-lg transition border-2 border-transparent hover:border-blue-500">
              ${option.text}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  /**
   * 回答を選択
   */
  async selectAnswer(optionIndex) {
    const questions = await this.diagnoseLearningSty();
    const currentQ = questions[this.currentQuestionIndex];
    const selectedOption = currentQ.options[optionIndex];
    
    this.answers.push(selectedOption);
    this.currentQuestionIndex++;
    
    if (this.currentQuestionIndex < questions.length) {
      this.showQuestion(questions[this.currentQuestionIndex]);
    } else {
      this.showResult();
    }
  }
  
  /**
   * 結果を表示
   */
  showResult() {
    const result = this.calculateLearningType(this.answers);
    const content = document.getElementById('diagnosis-content');
    if (!content) return;
    
    const primaryType = this.learningTypes[result.primary];
    
    content.innerHTML = `
      <div class="result-card">
        <div class="text-center mb-6">
          <div class="text-8xl mb-4">${primaryType.icon}</div>
          <h3 class="text-3xl font-bold mb-2" style="color: ${primaryType.color}">
            ${primaryType.name}
          </h3>
          <p class="text-xl text-gray-600">${primaryType.description}</p>
        </div>
        
        <div class="recommendations bg-gray-50 p-6 rounded-lg mb-6">
          <h4 class="font-bold text-xl mb-4">📚 おすすめの学習方法:</h4>
          <ul class="space-y-2">
            ${primaryType.strategies.map(strategy => `
              <li class="flex items-start gap-2">
                <span class="text-green-500">✓</span>
                <span>${strategy}</span>
              </li>
            `).join('')}
          </ul>
        </div>
        
        ${result.secondary.length > 0 ? `
          <div class="secondary-types bg-blue-50 p-6 rounded-lg mb-6">
            <h4 class="font-bold text-xl mb-4">🎨 サブタイプ:</h4>
            <div class="flex gap-4">
              ${result.secondary.map(type => {
                const typeInfo = this.learningTypes[type];
                return `
                  <div class="flex items-center gap-2">
                    <span class="text-3xl">${typeInfo.icon}</span>
                    <span class="font-semibold">${typeInfo.name}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="scores bg-white p-6 rounded-lg border-2">
          <h4 class="font-bold text-xl mb-4">📊 詳細スコア:</h4>
          <div class="space-y-2">
            ${Object.entries(result.scores)
              .sort(([,a], [,b]) => b - a)
              .map(([type, score]) => {
                const typeInfo = this.learningTypes[type];
                const percentage = (score / 6) * 100;
                return `
                  <div>
                    <div class="flex justify-between mb-1">
                      <span>${typeInfo.icon} ${typeInfo.name}</span>
                      <span class="font-bold">${score}/6</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-3">
                      <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all" 
                           style="width: ${percentage}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
          </div>
        </div>
        
        <div class="actions mt-6 flex gap-4 justify-center">
          <button onclick="window.sevenTypes.saveResult('${result.primary}')" 
                  class="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            💾 結果を保存
          </button>
          <button onclick="window.sevenTypes.startDiagnosis()" 
                  class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
            🔄 もう一度診断
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * 結果を保存
   */
  async saveResult(primaryType) {
    this.currentType = primaryType;
    
    // ローカルストレージに保存
    localStorage.setItem('learningType', primaryType);
    localStorage.setItem('learningTypeTimestamp', Date.now());
    
    alert(`✅ 学習タイプ「${this.learningTypes[primaryType].name}」を保存しました！`);
    
    // 学習スタイルマネージャーに反映
    if (window.learningStyleManager) {
      window.learningStyleManager.currentStyle = this.mapToVAK(primaryType);
    }
  }
  
  /**
   * 7タイプをVAKにマッピング
   */
  mapToVAK(type) {
    const mapping = {
      visual: 'visual',
      auditory: 'auditory',
      kinesthetic: 'kinesthetic',
      logical: 'visual', // 論理型は視覚的な図解が有効
      social: 'auditory', // 社会型は対話が有効
      solitary: 'visual', // 独習型は視覚的資料が有効
      nature: 'kinesthetic' // 自然型は体験が有効
    };
    
    return mapping[type] || 'visual';
  }
}

// グローバルインスタンス
window.sevenTypes = new SevenTypesLearningSystem();

console.log('✅ seven-types-learning.js 読み込み完了');
