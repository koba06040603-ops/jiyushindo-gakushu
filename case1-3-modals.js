// =============================================================================
// ケース1-3: 基本の個別最適化 - タブ付きモーダル実装
// =============================================================================

// ケース1: 得意な児童（ZPD上限）
function demoCase1Advanced() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 w-[95vw] h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
      <button onclick="this.closest('.fixed').remove()" 
        class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-50 bg-white rounded-full p-2 shadow-lg">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-rocket mr-2 text-purple-600"></i>
          ケース1: 得意な児童（ZPD上限）
        </h3>
        <p class="text-base text-purple-600">理論7: 足場かけ理論 - 最近接発達領域の上限に挑戦</p>
      </div>
      
      <div class="flex border-b border-gray-300 mb-4">
        <button onclick="switchTab('learn', 'case1')" data-tab-target="case1-learn"
          class="flex-1 py-3 text-base font-semibold border-b-4 border-purple-600 text-purple-600 transition-all hover:bg-purple-50">
          <i class="fas fa-book mr-2"></i>学習内容
        </button>
        <button onclick="switchTab('experience', 'case1')" data-tab-target="case1-experience"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-hand-pointer mr-2"></i>体験してみる
        </button>
        <button onclick="switchTab('video', 'case1')" data-tab-target="case1-video"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-film mr-2"></i>AI動画
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <!-- 学習内容タブ -->
        <div id="case1-learn" class="tab-content">
          <div class="bg-white rounded-lg p-6 mb-4 shadow">
            <h4 class="font-bold text-xl mb-4 text-purple-700">
              <i class="fas fa-graduation-cap mr-2"></i>得意な児童Aさんの特徴
            </h4>
            <div class="space-y-3 text-gray-700">
              <p><strong>学習者の特徴:</strong> 算数が得意、どんどん進みたい</p>
              <p><strong>選択コース:</strong> <span class="bg-purple-600 text-white px-3 py-1 rounded">ぐんぐんコース</span></p>
              <p><strong>教育理論:</strong> Vygotsky (1978) 最近接発達領域（ZPD）の上限</p>
              <p class="text-sm text-gray-600 bg-purple-50 p-3 rounded">
                既に習得している内容は省略し、より高度な問題へ挑戦。ZPDの上限を目指し、得意をさらに伸ばす。
              </p>
            </div>
          </div>
          
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-purple-700">
              <i class="fas fa-tools mr-2"></i>活用している機能
            </h4>
            <ul class="space-y-3 text-gray-700">
              <li class="flex items-start">
                <i class="fas fa-video text-purple-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>AI生成動画:</strong> 「九九の計算手順」解説動画（Gemini Veo）<br>
                  <span class="text-sm text-gray-600">発展的な内容をビジュアルで理解</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-image text-purple-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>AI生成画像:</strong> 「3×4の図解」（Flux Pro）<br>
                  <span class="text-sm text-gray-600">複雑な概念を視覚化</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-chart-line text-purple-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>学習データ分析:</strong> 得意分野を可視化→次の挑戦<br>
                  <span class="text-sm text-gray-600">強みを活かして更なる成長</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-trophy text-purple-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>学習成果:</strong> 1週間でコース完了、選択問題もクリア<br>
                  <span class="text-sm text-gray-600">別のコースや単元にも挑戦中</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- 体験してみるタブ -->
        <div id="case1-experience" class="tab-content hidden">
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-purple-700">
              <i class="fas fa-rocket mr-2"></i>得意な児童向け：発展的な問題
            </h4>
            <p class="mb-6 text-gray-700">基礎はできているので、応用問題に挑戦しましょう！</p>
            
            <div class="mb-6">
              <div class="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg mb-4">
                <h5 class="font-bold text-lg mb-3 text-purple-800">
                  <i class="fas fa-brain mr-2"></i>発展問題
                </h5>
                <p class="text-gray-800 mb-4">
                  3×4=12を使って、次の問題に答えましょう：<br>
                  もし3個ずつ8箱あったら、答えはどうなりますか？<br>
                  考え方も説明してください。
                </p>
                <textarea id="case1-answer" 
                  class="w-full p-3 border-2 border-purple-300 rounded-lg mb-3" 
                  rows="4" 
                  placeholder="あなたの答えと考え方を書いてください..."></textarea>
                <button onclick="checkCase1Answer()" 
                  class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md">
                  <i class="fas fa-check-circle mr-2"></i>答えを確認
                </button>
              </div>
              <div id="case1-result" class="mt-4"></div>
            </div>
          </div>
        </div>
        
        <!-- AI動画タブ -->
        <div id="case1-video" class="tab-content hidden">
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-purple-700">
              <i class="fas fa-film mr-2"></i>AI生成動画・画像デモ
            </h4>
            <p class="mb-6 text-gray-700">得意な児童向けの発展的なコンテンツをAIで生成します。</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                <h5 class="font-bold text-lg mb-3 text-purple-800">
                  <i class="fas fa-video mr-2"></i>AI解説動画
                </h5>
                <p class="text-gray-700 mb-4">九九の計算手順を視覚的に解説します（Gemini Veo）</p>
                <button onclick="demoCase1Video()" 
                  class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md">
                  <i class="fas fa-play-circle mr-2"></i>動画を生成する
                </button>
              </div>
              
              <div class="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-lg">
                <h5 class="font-bold text-lg mb-3 text-pink-800">
                  <i class="fas fa-image mr-2"></i>AI生成画像
                </h5>
                <p class="text-gray-700 mb-4">3×4の図解をAIで生成します（Flux Pro）</p>
                <button onclick="demoCase1Image()" 
                  class="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-md">
                  <i class="fas fa-image mr-2"></i>画像を生成する
                </button>
              </div>
            </div>
            
            <div id="case1VideoPreview" class="mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

function checkCase1Answer() {
  const answer = document.getElementById('case1-answer').value
  const resultEl = document.getElementById('case1-result')
  
  if (!answer.trim()) {
    resultEl.innerHTML = '<div class="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4"><i class="fas fa-exclamation-circle text-yellow-600 mr-2"></i>答えを入力してください</div>'
    return
  }
  
  // 簡易的な評価（実際にはAI評価を使用）
  const hasAnswer = answer.includes('24') || answer.includes('二十四')
  const hasThinking = answer.length > 20
  
  if (hasAnswer && hasThinking) {
    resultEl.innerHTML = `
      <div class="bg-green-100 border-2 border-green-400 rounded-lg p-4">
        <i class="fas fa-check-circle text-green-600 mr-2"></i>
        <strong>素晴らしい！</strong><br>
        正解です！3×8=24ですね。考え方も説明できていて素晴らしいです。<br>
        <span class="text-sm text-green-700 mt-2 block">
          💡 3×4=12を2倍すれば3×8になる、という考え方もできますね！
        </span>
      </div>
    `
  } else {
    resultEl.innerHTML = `
      <div class="bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
        <i class="fas fa-lightbulb text-blue-600 mr-2"></i>
        もう一度考えてみましょう。<br>
        ヒント：3×4=12です。3×8は3×4の何倍でしょうか？
      </div>
    `
  }
}

// ケース2: 苦手な児童（ZPD下限）
function demoCase2Struggling() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 w-[95vw] h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
      <button onclick="this.closest('.fixed').remove()" 
        class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-50 bg-white rounded-full p-2 shadow-lg">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-seedling mr-2 text-blue-600"></i>
          ケース2: 苦手な児童（ZPD下限）
        </h3>
        <p class="text-base text-blue-600">理論7: 足場かけ理論 - スモールステップで段階的支援</p>
      </div>
      
      <div class="flex border-b border-gray-300 mb-4">
        <button onclick="switchTab('learn', 'case2')" data-tab-target="case2-learn"
          class="flex-1 py-3 text-base font-semibold border-b-4 border-blue-600 text-blue-600 transition-all hover:bg-blue-50">
          <i class="fas fa-book mr-2"></i>学習内容
        </button>
        <button onclick="switchTab('experience', 'case2')" data-tab-target="case2-experience"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-hand-pointer mr-2"></i>体験してみる
        </button>
        <button onclick="switchTab('video', 'case2')" data-tab-target="case2-video"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-film mr-2"></i>AI音声・対話
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <!-- 学習内容タブ -->
        <div id="case2-learn" class="tab-content">
          <div class="bg-white rounded-lg p-6 mb-4 shadow">
            <h4 class="font-bold text-xl mb-4 text-blue-700">
              <i class="fas fa-heart mr-2"></i>苦手な児童Bさんの特徴
            </h4>
            <div class="space-y-3 text-gray-700">
              <p><strong>学習者の特徴:</strong> 算数に苦手意識、じっくり学びたい</p>
              <p><strong>選択コース:</strong> <span class="bg-green-600 text-white px-3 py-1 rounded">ゆっくりコース</span></p>
              <p><strong>教育理論:</strong> Wood et al. (1976) Scaffolding理論</p>
              <p class="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                スモールステップで段階的に支援。丁寧な説明と安心感を提供し、小さな成功体験の積み重ねで自信を育む。
              </p>
            </div>
          </div>
          
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-blue-700">
              <i class="fas fa-tools mr-2"></i>活用している機能
            </h4>
            <ul class="space-y-3 text-gray-700">
              <li class="flex items-start">
                <i class="fas fa-music text-blue-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>AI生成音楽:</strong> 「九九の歌（3の段）」で暗記支援<br>
                  <span class="text-sm text-gray-600">楽しく覚えられる音楽コンテンツ</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-volume-up text-blue-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>AI音声読み上げ:</strong> やさしい言葉で説明（Minimax TTS）<br>
                  <span class="text-sm text-gray-600">聴覚優位の学習スタイルに対応</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-robot text-blue-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>AI先生対話:</strong> 質問5回→丁寧に回答<br>
                  <span class="text-sm text-gray-600">わからないことを安心して質問できる</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-smile text-blue-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>学習成果:</strong> 2週間でコース完了、苦手を克服<br>
                  <span class="text-sm text-gray-600">自信を持って学習できるようになった</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- 体験してみるタブ -->
        <div id="case2-experience" class="tab-content hidden">
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-blue-700">
              <i class="fas fa-hands-helping mr-2"></i>苦手な児童向け：スモールステップ
            </h4>
            <p class="mb-6 text-gray-700">ゆっくり、一歩ずつ進みましょう。できたことを確認しながら進めます。</p>
            
            <div id="case2-steps" class="mb-6">
              <div class="bg-gradient-to-r from-blue-100 to-cyan-100 p-6 rounded-lg mb-4">
                <h5 class="font-bold text-lg mb-3 text-blue-800">
                  <i class="fas fa-shoe-prints mr-2"></i>ステップ1: かけ算の意味
                </h5>
                <p class="text-gray-800 mb-4">
                  3×4は「3を4回たす」という意味です。<br>
                  3 + 3 + 3 + 3 = ?
                </p>
                <input type="number" id="case2-step1" 
                  class="w-32 p-3 border-2 border-blue-300 rounded-lg mr-3" 
                  placeholder="答え">
                <button onclick="checkCase2Step(1)" 
                  class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
                  <i class="fas fa-check mr-2"></i>確認
                </button>
                <div id="case2-step1-result" class="mt-3"></div>
              </div>
              
              <div id="case2-step2-container" class="hidden">
                <div class="bg-gradient-to-r from-blue-100 to-cyan-100 p-6 rounded-lg mb-4">
                  <h5 class="font-bold text-lg mb-3 text-blue-800">
                    <i class="fas fa-check-circle text-green-600 mr-2"></i>ステップ2: かけ算で書く
                  </h5>
                  <p class="text-gray-800 mb-4">
                    素晴らしい！では、これをかけ算で書くと？<br>
                    3 × 4 = ?
                  </p>
                  <input type="number" id="case2-step2" 
                    class="w-32 p-3 border-2 border-blue-300 rounded-lg mr-3" 
                    placeholder="答え">
                  <button onclick="checkCase2Step(2)" 
                    class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all">
                    <i class="fas fa-check mr-2"></i>確認
                  </button>
                  <div id="case2-step2-result" class="mt-3"></div>
                </div>
              </div>
              
              <div id="case2-complete" class="hidden">
                <div class="bg-green-100 border-2 border-green-400 rounded-lg p-6 text-center">
                  <i class="fas fa-trophy text-green-600 text-5xl mb-4"></i>
                  <h5 class="font-bold text-2xl text-green-800 mb-2">完璧です！</h5>
                  <p class="text-gray-700">
                    3×4=12 が理解できましたね。<br>
                    ゆっくりでも、確実に進めば必ずできるようになります！
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- AI音声・対話タブ -->
        <div id="case2-video" class="tab-content hidden">
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-blue-700">
              <i class="fas fa-headphones mr-2"></i>AI音声・対話デモ
            </h4>
            <p class="mb-6 text-gray-700">苦手な児童向けの聴覚支援コンテンツをAIで生成します。</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                <h5 class="font-bold text-lg mb-3 text-blue-800">
                  <i class="fas fa-music mr-2"></i>AI生成音楽
                </h5>
                <p class="text-gray-700 mb-4 text-sm">九九の歌（3の段）で楽しく暗記</p>
                <button onclick="demoCase2Music()" 
                  class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md">
                  <i class="fas fa-play-circle mr-2"></i>音楽を生成
                </button>
              </div>
              
              <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 p-6 rounded-lg">
                <h5 class="font-bold text-lg mb-3 text-cyan-800">
                  <i class="fas fa-volume-up mr-2"></i>AI音声読み上げ
                </h5>
                <p class="text-gray-700 mb-4 text-sm">やさしい言葉で丁寧に説明</p>
                <button onclick="demoCase2Voice()" 
                  class="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md">
                  <i class="fas fa-microphone mr-2"></i>音声を生成
                </button>
              </div>
              
              <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-lg">
                <h5 class="font-bold text-lg mb-3 text-indigo-800">
                  <i class="fas fa-robot mr-2"></i>AI先生対話
                </h5>
                <p class="text-gray-700 mb-4 text-sm">わからないことを質問できる</p>
                <button onclick="demoCase2AI()" 
                  class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md">
                  <i class="fas fa-comments mr-2"></i>対話を開始
                </button>
              </div>
            </div>
            
            <div id="case2AudioPreview" class="mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

function checkCase2Step(step) {
  if (step === 1) {
    const answer = document.getElementById('case2-step1').value
    const resultEl = document.getElementById('case2-step1-result')
    
    if (answer == 12) {
      resultEl.innerHTML = '<div class="bg-green-100 border-2 border-green-400 rounded-lg p-3 mt-2"><i class="fas fa-check-circle text-green-600 mr-2"></i>正解です！よくできました！</div>'
      setTimeout(() => {
        document.getElementById('case2-step2-container').classList.remove('hidden')
      }, 1000)
    } else {
      resultEl.innerHTML = '<div class="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mt-2"><i class="fas fa-lightbulb text-yellow-600 mr-2"></i>もう一度数えてみましょう。3+3+3+3 を指で数えてもいいですよ。</div>'
    }
  } else if (step === 2) {
    const answer = document.getElementById('case2-step2').value
    const resultEl = document.getElementById('case2-step2-result')
    
    if (answer == 12) {
      resultEl.innerHTML = '<div class="bg-green-100 border-2 border-green-400 rounded-lg p-3 mt-2"><i class="fas fa-star text-yellow-500 mr-2"></i>完璧です！</div>'
      setTimeout(() => {
        document.getElementById('case2-complete').classList.remove('hidden')
      }, 1000)
    } else {
      resultEl.innerHTML = '<div class="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mt-2"><i class="fas fa-lightbulb text-yellow-600 mr-2"></i>ステップ1の答えと同じですよ。</div>'
    }
  }
}

// ケース3: 欠席が多い児童（分散学習）
function demoCase3Absent() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 w-[95vw] h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
      <button onclick="this.closest('.fixed').remove()" 
        class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-50 bg-white rounded-full p-2 shadow-lg">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-home mr-2 text-yellow-600"></i>
          ケース3: 欠席が多い児童（分散学習）
        </h3>
        <p class="text-base text-yellow-600">理論6: 認知科学 - 分散学習効果を活用</p>
      </div>
      
      <div class="flex border-b border-gray-300 mb-4">
        <button onclick="switchTab('learn', 'case3')" data-tab-target="case3-learn"
          class="flex-1 py-3 text-base font-semibold border-b-4 border-yellow-600 text-yellow-600 transition-all hover:bg-yellow-50">
          <i class="fas fa-book mr-2"></i>学習内容
        </button>
        <button onclick="switchTab('experience', 'case3')" data-tab-target="case3-experience"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-hand-pointer mr-2"></i>体験してみる
        </button>
        <button onclick="switchTab('video', 'case3')" data-tab-target="case3-video"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-film mr-2"></i>AI動画
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <!-- 学習内容タブ -->
        <div id="case3-learn" class="tab-content">
          <div class="bg-white rounded-lg p-6 mb-4 shadow">
            <h4 class="font-bold text-xl mb-4 text-yellow-700">
              <i class="fas fa-calendar-alt mr-2"></i>欠席が多い児童Cさんの特徴
            </h4>
            <div class="space-y-3 text-gray-700">
              <p><strong>学習者の特徴:</strong> 体調不良で欠席が多い</p>
              <p><strong>選択コース:</strong> <span class="bg-blue-600 text-white px-3 py-1 rounded">しっかりコース</span></p>
              <p><strong>教育理論:</strong> Cepeda et al. (2006) 分散学習効果</p>
              <p class="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                欠席による学習の間隔を逆手に取り、分散学習効果を活用。間隔を開けた復習で長期記憶を強化。
              </p>
            </div>
          </div>
          
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-yellow-700">
              <i class="fas fa-tools mr-2"></i>活用している機能
            </h4>
            <ul class="space-y-3 text-gray-700">
              <li class="flex items-start">
                <i class="fas fa-video text-yellow-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>AI解説動画:</strong> 授業の代わりに5秒の要点動画<br>
                  <span class="text-sm text-gray-600">自宅から授業内容を理解</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-chart-bar text-yellow-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>進捗ボード:</strong> 教師がリアルタイムで見守り<br>
                  <span class="text-sm text-gray-600">励ましメッセージで孤立感を軽減</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-microphone text-yellow-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>音声メモ機能:</strong> 気持ちを記録<br>
                  <span class="text-sm text-gray-600">先生とのつながりを保つ</span>
                </div>
              </li>
              <li class="flex items-start">
                <i class="fas fa-clock text-yellow-600 mr-3 mt-1 text-xl"></i>
                <div>
                  <strong>学習成果:</strong> 自宅から学習継続、遅れを取り戻す<br>
                  <span class="text-sm text-gray-600">場所を選ばず、24時間いつでも学習可能</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- 体験してみるタブ -->
        <div id="case3-experience" class="tab-content hidden">
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-yellow-700">
              <i class="fas fa-redo mr-2"></i>欠席が多い児童向け：復習カレンダー
            </h4>
            <p class="mb-6 text-gray-700">欠席した日の学習内容を、間隔を開けて復習しましょう。分散学習効果で記憶が定着します。</p>
            
            <div class="mb-6">
              <div class="bg-gradient-to-r from-yellow-100 to-amber-100 p-6 rounded-lg mb-4">
                <h5 class="font-bold text-lg mb-3 text-yellow-800">
                  <i class="fas fa-calendar-check mr-2"></i>学習スケジュール
                </h5>
                <div class="space-y-3">
                  <div class="bg-white p-4 rounded-lg border-2 border-yellow-300">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-bold text-yellow-800">1日目:</span>
                        <span class="ml-2">初めて学習（3×4の意味）</span>
                      </div>
                      <button onclick="markCase3Day(1)" id="case3-day1-btn"
                        class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-all">
                        <i class="fas fa-check mr-1"></i>完了
                      </button>
                    </div>
                  </div>
                  
                  <div class="bg-white p-4 rounded-lg border-2 border-gray-300 opacity-50" id="case3-day2">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-bold text-gray-600">3日目:</span>
                        <span class="ml-2">1回目の復習</span>
                        <span class="text-sm text-gray-500 ml-2">(2日間空ける)</span>
                      </div>
                      <button onclick="markCase3Day(2)" id="case3-day2-btn" disabled
                        class="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed">
                        未解放
                      </button>
                    </div>
                  </div>
                  
                  <div class="bg-white p-4 rounded-lg border-2 border-gray-300 opacity-50" id="case3-day3">
                    <div class="flex items-center justify-between">
                      <div>
                        <span class="font-bold text-gray-600">7日目:</span>
                        <span class="ml-2">2回目の復習</span>
                        <span class="text-sm text-gray-500 ml-2">(1週間空ける)</span>
                      </div>
                      <button onclick="markCase3Day(3)" id="case3-day3-btn" disabled
                        class="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed">
                        未解放
                      </button>
                    </div>
                  </div>
                </div>
                
                <div id="case3-complete-msg" class="hidden mt-4 bg-green-100 border-2 border-green-400 rounded-lg p-4 text-center">
                  <i class="fas fa-trophy text-green-600 text-4xl mb-2"></i>
                  <p class="font-bold text-green-800 text-lg">分散学習完了！</p>
                  <p class="text-gray-700 text-sm mt-2">
                    間隔を開けた復習で、長期記憶に定着しました！<br>
                    詰め込みより3倍効果的です。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- AI動画タブ -->
        <div id="case3-video" class="tab-content hidden">
          <div class="bg-white rounded-lg p-6 shadow">
            <h4 class="font-bold text-xl mb-4 text-yellow-700">
              <i class="fas fa-film mr-2"></i>AI解説動画デモ
            </h4>
            <p class="mb-6 text-gray-700">欠席した日の授業内容を5秒の動画で理解できます。</p>
            
            <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg">
              <h5 class="font-bold text-lg mb-3 text-yellow-800">
                <i class="fas fa-video mr-2"></i>授業の要点動画
              </h5>
              <p class="text-gray-700 mb-4">
                3×4のかけ算の意味を5秒で解説します（Gemini Veo）<br>
                <span class="text-sm text-gray-600">授業に参加できなくても、自宅で学習できます</span>
              </p>
              <button onclick="demoCase3Video()" 
                class="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md">
                <i class="fas fa-play-circle mr-2"></i>動画を生成する
              </button>
            </div>
            
            <div id="case3VideoPreview" class="mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
}

let case3CompletedDays = 0

function markCase3Day(day) {
  case3CompletedDays++
  
  // 現在の日をチェック済みに
  const btn = document.getElementById(`case3-day${day}-btn`)
  btn.innerHTML = '<i class="fas fa-check-circle mr-1"></i>完了'
  btn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700')
  btn.classList.add('bg-green-600')
  btn.disabled = true
  
  // 次の日を解放
  if (day < 3) {
    const nextDay = document.getElementById(`case3-day${day + 1}`)
    const nextBtn = document.getElementById(`case3-day${day + 1}-btn`)
    nextDay.classList.remove('opacity-50')
    nextDay.querySelector('.border-gray-300').classList.remove('border-gray-300')
    nextDay.querySelector('.border-2').classList.add('border-yellow-300')
    nextBtn.disabled = false
    nextBtn.classList.remove('bg-gray-400', 'cursor-not-allowed')
    nextBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700')
    nextBtn.textContent = '完了'
    nextBtn.innerHTML = '<i class="fas fa-check mr-1"></i>完了'
  }
  
  // 全て完了したら
  if (case3CompletedDays === 3) {
    document.getElementById('case3-complete-msg').classList.remove('hidden')
  }
}

// グローバル登録
window.demoCase1Advanced = demoCase1Advanced
window.checkCase1Answer = checkCase1Answer
window.demoCase2Struggling = demoCase2Struggling
window.checkCase2Step = checkCase2Step
window.demoCase3Absent = demoCase3Absent
window.markCase3Day = markCase3Day

console.log('✅ ケース1-3（基本の個別最適化）タブ付きモーダル実装完了')
