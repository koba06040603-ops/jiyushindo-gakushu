// ============================================================================
// ケース9: 繰り返し強化（タブ付き）
// ============================================================================
function demoCase9Repetition() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 w-[95vw] h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
      <button onclick="this.closest('.fixed').remove()" 
        class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-50 bg-white rounded-full p-2 shadow-lg">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-redo-alt mr-2 text-amber-600"></i>
          ケース9: 繰り返しで定着
        </h3>
        <p class="text-base text-amber-600">特別支援：反復練習で確実に記憶</p>
      </div>
      
      <div class="flex border-b border-gray-300 mb-4">
        <button onclick="switchTab('learn', 'case9')" data-tab-target="case9-learn"
          class="flex-1 py-3 text-base font-semibold border-b-4 border-amber-600 text-amber-600 transition-all hover:bg-amber-50">
          <i class="fas fa-book mr-2"></i>学習内容
        </button>
        <button onclick="switchTab('experience', 'case9')" data-tab-target="case9-experience"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-hand-pointer mr-2"></i>体験してみる
        </button>
        <button onclick="switchTab('video', 'case9')" data-tab-target="case9-video"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-film mr-2"></i>AI動画
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-2">
        <div data-tab-content="case9-learn" class="bg-white rounded-xl p-6 shadow-inner">
          <div class="text-center mb-6">
            <i class="fas fa-sync-alt text-6xl text-amber-600"></i>
            <p class="text-amber-700 font-bold text-2xl mt-3">🔁 繰り返し版: 3×4</p>
          </div>
          
          <div class="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-lg mb-4">
            <h4 class="font-bold text-amber-800 text-xl mb-3">📝 繰り返しのポイント</h4>
            <div class="space-y-2 text-gray-700">
              <p>✓ 1回目: 3 × 4 = 12</p>
              <p>✓ 2回目: 3 × 4 = 12</p>
              <p>✓ 3回目: 3 × 4 = 12</p>
              <p class="font-bold text-amber-700 mt-3">何度も繰り返すことで確実に記憶！</p>
            </div>
          </div>
        </div>
        
        <div data-tab-content="case9-experience" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-layer-group text-6xl text-amber-600"></i>
            <p class="text-amber-700 font-bold text-2xl mt-3">フラッシュカード練習</p>
            <p class="text-gray-600 mt-2">カードをめくって答えを確認しよう！</p>
          </div>
          
          <div class="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl p-8">
            <div class="mb-6 text-center">
              <div class="text-lg font-bold text-amber-800 mb-2">練習回数: <span id="case9-count">0</span> / 5</div>
              <div class="h-2 bg-gray-300 rounded-full overflow-hidden">
                <div id="case9-progress" class="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500" style="width: 0%"></div>
              </div>
            </div>
            
            <div class="bg-white rounded-xl p-8 mb-6 min-h-[300px] flex items-center justify-center cursor-pointer hover:shadow-lg transition-all" id="case9-flashcard" onclick="flipCard9()">
              <div id="case9-card-content" class="text-center">
                <div class="text-6xl font-bold text-amber-700 mb-4">3 × 4</div>
                <p class="text-gray-600">クリックして答えを見る</p>
              </div>
            </div>
            
            <div class="flex gap-4 justify-center">
              <button onclick="nextCard9()" 
                class="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md">
                次のカード
              </button>
              <button onclick="resetCards9()" 
                class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all">
                リセット
              </button>
            </div>
          </div>
        </div>
        
        <div data-tab-content="case9-video" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-video text-6xl text-amber-600"></i>
            <p class="text-amber-700 font-bold text-2xl mt-3">AI生成繰り返し学習動画</p>
          </div>
          <div class="text-center mb-6">
            <button onclick="generateRepetitionVideo()" 
              class="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold py-4 px-10 rounded-lg transition-all shadow-md text-lg">
              <i class="fas fa-play-circle mr-2"></i>動画を生成する
            </button>
          </div>
          <div id="repetitionVideoPreview"></div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  window.case9Count = 0
  window.case9Flipped = false
}

function flipCard9() {
  const cardContent = document.getElementById('case9-card-content')
  if (!window.case9Flipped) {
    cardContent.innerHTML = `
      <div class="text-8xl font-bold text-green-600 mb-4">12</div>
      <p class="text-gray-600">正解！</p>
    `
    window.case9Flipped = true
  } else {
    cardContent.innerHTML = `
      <div class="text-6xl font-bold text-amber-700 mb-4">3 × 4</div>
      <p class="text-gray-600">クリックして答えを見る</p>
    `
    window.case9Flipped = false
  }
}

function nextCard9() {
  window.case9Count = (window.case9Count || 0) + 1
  if (window.case9Count > 5) window.case9Count = 5
  
  const countEl = document.getElementById('case9-count')
  const progressEl = document.getElementById('case9-progress')
  const cardContent = document.getElementById('case9-card-content')
  
  if (countEl) countEl.textContent = window.case9Count
  if (progressEl) progressEl.style.width = `${window.case9Count * 20}%`
  
  if (cardContent) {
    cardContent.innerHTML = `
      <div class="text-6xl font-bold text-amber-700 mb-4">3 × 4</div>
      <p class="text-gray-600">クリックして答えを見る</p>
    `
  }
  window.case9Flipped = false
  
  if (window.case9Count === 5) {
    setTimeout(() => {
      if (cardContent) {
        cardContent.innerHTML = `
          <div class="text-4xl font-bold text-green-600 mb-4">🎉 完璧！</div>
          <p class="text-lg text-gray-700">5回練習しました！</p>
        `
      }
    }, 500)
  }
}

function resetCards9() {
  window.case9Count = 0
  window.case9Flipped = false
  const countEl = document.getElementById('case9-count')
  const progressEl = document.getElementById('case9-progress')
  const cardContent = document.getElementById('case9-card-content')
  
  if (countEl) countEl.textContent = '0'
  if (progressEl) progressEl.style.width = '0%'
  if (cardContent) {
    cardContent.innerHTML = `
      <div class="text-6xl font-bold text-amber-700 mb-4">3 × 4</div>
      <p class="text-gray-600">クリックして答えを見る</p>
    `
  }
}

async function generateRepetitionVideo() {
  const previewDiv = document.getElementById('repetitionVideoPreview')
  if (!previewDiv) return
  
  previewDiv.innerHTML = '<div class="bg-white rounded-lg p-6 text-center"><div class="animate-spin mb-4 mx-auto inline-block"><i class="fas fa-spinner text-5xl text-amber-600"></i></div><p class="text-amber-700 font-semibold">AI動画生成中...</p></div>'
  
  try {
    const response = await fetch('/api/media/generate-video-support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseNumber: 9 })
    })
    const data = await response.json()
    previewDiv.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-lg">
        <div class="bg-gray-900 rounded-lg overflow-hidden mb-4" style="height: 500px;">
          <iframe srcdoc="${data.animationHtml.replace(/"/g, '&quot;')}" class="w-full h-full" frameborder="0" sandbox="allow-scripts"></iframe>
        </div>
        <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p class="text-lg text-green-800"><i class="fas fa-check-circle mr-2"></i><strong>生成完了！</strong> ${data.note}</p>
        </div>
      </div>
    `
  } catch (error) {
    previewDiv.innerHTML = '<div class="bg-white rounded-lg p-6 text-center text-red-600"><i class="fas fa-exclamation-circle text-6xl mb-4"></i><p>エラーが発生しました</p></div>'
  }
}

window.demoCase9Repetition = demoCase9Repetition
window.flipCard9 = flipCard9
window.nextCard9 = nextCard9
window.resetCards9 = resetCards9
window.generateRepetitionVideo = generateRepetitionVideo

console.log('✅ ケース9（繰り返し強化）タブ付きバージョン実装完了')

// ============================================================================
// ケース10: テスト準備（タブ付き）
// ============================================================================
function demoCase10TestPrep() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 w-[95vw] h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
      <button onclick="this.closest('.fixed').remove()" 
        class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-50 bg-white rounded-full p-2 shadow-lg">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-file-alt mr-2 text-yellow-600"></i>
          ケース10: よく出る問題
        </h3>
        <p class="text-base text-yellow-600">テスト準備：頻出パターンを集中学習</p>
      </div>
      
      <div class="flex border-b border-gray-300 mb-4">
        <button onclick="switchTab('learn', 'case10')" data-tab-target="case10-learn"
          class="flex-1 py-3 text-base font-semibold border-b-4 border-yellow-600 text-yellow-600 transition-all hover:bg-yellow-50">
          <i class="fas fa-book mr-2"></i>学習内容
        </button>
        <button onclick="switchTab('experience', 'case10')" data-tab-target="case10-experience"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-hand-pointer mr-2"></i>体験してみる
        </button>
        <button onclick="switchTab('video', 'case10')" data-tab-target="case10-video"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-film mr-2"></i>AI動画
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-2">
        <div data-tab-content="case10-learn" class="bg-white rounded-xl p-6 shadow-inner">
          <div class="text-center mb-6">
            <i class="fas fa-star text-6xl text-yellow-600"></i>
            <p class="text-yellow-700 font-bold text-2xl mt-3">⭐ よく出る: 3×4</p>
          </div>
          
          <div class="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-lg mb-4">
            <h4 class="font-bold text-yellow-800 text-xl mb-3">📌 頻出ポイント</h4>
            <div class="space-y-2 text-gray-700">
              <p>✓ 3×4 は九九の基本</p>
              <p>✓ 4×3 と同じ答え</p>
              <p>✓ 素早く 12 と答えられるように</p>
            </div>
          </div>
          
          <div class="bg-orange-50 border-l-4 border-orange-400 p-5 rounded-lg">
            <h4 class="font-bold text-orange-800 text-xl mb-3">⚡ 素早く解くコツ</h4>
            <div class="space-y-2 text-gray-700">
              <p>✓ 3を4回足す: 3+3+3+3</p>
              <p>✓ 覚え方: 「さざんが じゅうに」</p>
              <p class="font-bold text-yellow-700 mt-3">答え: 12</p>
            </div>
          </div>
        </div>
        
        <div data-tab-content="case10-experience" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-stopwatch text-6xl text-yellow-600"></i>
            <p class="text-yellow-700 font-bold text-2xl mt-3">クイックテスト</p>
            <p class="text-gray-600 mt-2">10秒以内に答えよう！</p>
          </div>
          
          <div class="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl p-8">
            <div class="mb-6 text-center">
              <div class="text-lg font-bold text-yellow-800 mb-2">残り時間: <span id="case10-timer" class="text-3xl">10</span> 秒</div>
              <div class="h-2 bg-gray-300 rounded-full overflow-hidden">
                <div id="case10-timer-bar" class="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all" style="width: 100%"></div>
              </div>
            </div>
            
            <div class="bg-white rounded-xl p-8 mb-6 text-center">
              <div class="text-6xl font-bold text-yellow-700 mb-6">3 × 4 = ?</div>
              
              <div class="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <button onclick="checkAnswer10(9)" 
                  class="bg-white hover:bg-yellow-100 border-2 border-yellow-300 rounded-lg py-6 text-3xl font-bold transition-all hover:scale-105">
                  9
                </button>
                <button onclick="checkAnswer10(12)" 
                  class="bg-white hover:bg-yellow-100 border-2 border-yellow-300 rounded-lg py-6 text-3xl font-bold transition-all hover:scale-105">
                  12
                </button>
                <button onclick="checkAnswer10(15)" 
                  class="bg-white hover:bg-yellow-100 border-2 border-yellow-300 rounded-lg py-6 text-3xl font-bold transition-all hover:scale-105">
                  15
                </button>
              </div>
            </div>
            
            <div id="case10-result" class="text-center text-xl font-bold min-h-[3rem]"></div>
            
            <div class="text-center">
              <button onclick="startTimer10()" 
                class="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md">
                テスト開始
              </button>
            </div>
          </div>
        </div>
        
        <div data-tab-content="case10-video" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-video text-6xl text-yellow-600"></i>
            <p class="text-yellow-700 font-bold text-2xl mt-3">AI生成テスト対策動画</p>
          </div>
          <div class="text-center mb-6">
            <button onclick="generateTestPrepVideo()" 
              class="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-4 px-10 rounded-lg transition-all shadow-md text-lg">
              <i class="fas fa-play-circle mr-2"></i>動画を生成する
            </button>
          </div>
          <div id="testPrepVideoPreview"></div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  window.case10TimerActive = false
  window.case10TimeLeft = 10
}

function startTimer10() {
  window.case10TimeLeft = 10
  window.case10TimerActive = true
  const resultEl = document.getElementById('case10-result')
  if (resultEl) resultEl.innerHTML = ''
  
  const interval = setInterval(() => {
    if (!window.case10TimerActive) {
      clearInterval(interval)
      return
    }
    
    window.case10TimeLeft--
    const timerEl = document.getElementById('case10-timer')
    const timerBarEl = document.getElementById('case10-timer-bar')
    
    if (timerEl) timerEl.textContent = window.case10TimeLeft
    if (timerBarEl) timerBarEl.style.width = `${window.case10TimeLeft * 10}%`
    
    if (window.case10TimeLeft <= 0) {
      clearInterval(interval)
      window.case10TimerActive = false
      if (resultEl) {
        resultEl.innerHTML = '<div class="bg-red-100 border-2 border-red-400 rounded-lg p-4"><i class="fas fa-clock mr-2"></i>時間切れ！もう一度挑戦しよう</div>'
      }
    }
  }, 1000)
}

function checkAnswer10(answer) {
  if (!window.case10TimerActive) {
    return
  }
  
  window.case10TimerActive = false
  const resultEl = document.getElementById('case10-result')
  
  if (answer === 12) {
    const timeUsed = 10 - window.case10TimeLeft
    resultEl.innerHTML = `
      <div class="bg-green-100 border-2 border-green-400 rounded-lg p-4">
        <i class="fas fa-check-circle text-green-600 mr-2"></i>
        正解！ ${timeUsed}秒で答えました！
      </div>
    `
  } else {
    resultEl.innerHTML = '<div class="bg-red-100 border-2 border-red-400 rounded-lg p-4"><i class="fas fa-times-circle text-red-600 mr-2"></i>不正解。答えは12です</div>'
  }
}

async function generateTestPrepVideo() {
  const previewDiv = document.getElementById('testPrepVideoPreview')
  if (!previewDiv) return
  
  previewDiv.innerHTML = '<div class="bg-white rounded-lg p-6 text-center"><div class="animate-spin mb-4 mx-auto inline-block"><i class="fas fa-spinner text-5xl text-yellow-600"></i></div><p class="text-yellow-700 font-semibold">AI動画生成中...</p></div>'
  
  try {
    const response = await fetch('/api/media/generate-video-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseNumber: 10 })
    })
    const data = await response.json()
    previewDiv.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-lg">
        <div class="bg-gray-900 rounded-lg overflow-hidden mb-4" style="height: 500px;">
          <iframe srcdoc="${data.animationHtml.replace(/"/g, '&quot;')}" class="w-full h-full" frameborder="0" sandbox="allow-scripts"></iframe>
        </div>
        <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p class="text-lg text-green-800"><i class="fas fa-check-circle mr-2"></i><strong>生成完了！</strong> ${data.note}</p>
        </div>
      </div>
    `
  } catch (error) {
    previewDiv.innerHTML = '<div class="bg-white rounded-lg p-6 text-center text-red-600"><i class="fas fa-exclamation-circle text-6xl mb-4"></i><p>エラーが発生しました</p></div>'
  }
}

window.demoCase10TestPrep = demoCase10TestPrep
window.startTimer10 = startTimer10
window.checkAnswer10 = checkAnswer10
window.generateTestPrepVideo = generateTestPrepVideo

console.log('✅ ケース10（テスト準備）タブ付きバージョン実装完了')

// ============================================================================
// ケース11: 応用問題（タブ付き）
// ============================================================================
function demoCase11Advanced() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 w-[95vw] h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
      <button onclick="this.closest('.fixed').remove()" 
        class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-50 bg-white rounded-full p-2 shadow-lg">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-puzzle-piece mr-2 text-purple-600"></i>
          ケース11: 応用問題
        </h3>
        <p class="text-base text-purple-600">テスト準備：発展的な問題に挑戦</p>
      </div>
      
      <div class="flex border-b border-gray-300 mb-4">
        <button onclick="switchTab('learn', 'case11')" data-tab-target="case11-learn"
          class="flex-1 py-3 text-base font-semibold border-b-4 border-purple-600 text-purple-600 transition-all hover:bg-purple-50">
          <i class="fas fa-book mr-2"></i>学習内容
        </button>
        <button onclick="switchTab('experience', 'case11')" data-tab-target="case11-experience"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-hand-pointer mr-2"></i>体験してみる
        </button>
        <button onclick="switchTab('video', 'case11')" data-tab-target="case11-video"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-film mr-2"></i>AI動画
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-2">
        <div data-tab-content="case11-learn" class="bg-white rounded-xl p-6 shadow-inner">
          <div class="text-center mb-6">
            <i class="fas fa-brain text-6xl text-purple-600"></i>
            <p class="text-purple-700 font-bold text-2xl mt-3">🧩 応用問題: 3×4</p>
          </div>
          
          <div class="bg-purple-50 border-l-4 border-purple-400 p-5 rounded-lg mb-4">
            <h4 class="font-bold text-purple-800 text-xl mb-3">🎯 応用パターン</h4>
            <div class="space-y-3 text-gray-700">
              <p class="font-semibold">問題1: 3人の子どもに、それぞれ4個ずつリンゴを配ります。全部で何個必要？</p>
              <p class="ml-4">→ 3 × 4 = 12個</p>
              <p class="font-semibold mt-3">問題2: 1箱に3個入ったお菓子が4箱あります。全部で何個？</p>
              <p class="ml-4">→ 3 × 4 = 12個</p>
            </div>
          </div>
        </div>
        
        <div data-tab-content="case11-experience" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-puzzle-piece text-6xl text-purple-600"></i>
            <p class="text-purple-700 font-bold text-2xl mt-3">パズルチャレンジ</p>
            <p class="text-gray-600 mt-2">ピースを正しく組み合わせよう！</p>
          </div>
          
          <div class="bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl p-8">
            <div class="bg-white rounded-xl p-6 mb-6">
              <div class="text-xl font-bold text-purple-800 mb-4 text-center">
                文章問題から式を作ろう
              </div>
              
              <div class="bg-purple-50 rounded-lg p-4 mb-6">
                <p class="text-lg text-gray-700 text-center">
                  「1つの箱に <strong class="text-purple-700">3個</strong> のボールが入っています。<br>
                  このような箱が <strong class="text-purple-700">4箱</strong> あります。<br>
                  ボールは全部で何個ありますか？」
                </p>
              </div>
              
              <div class="grid grid-cols-3 gap-4 mb-6">
                <button onclick="selectPuzzlePiece11('3')" id="piece-3" 
                  class="bg-white hover:bg-purple-100 border-2 border-purple-300 rounded-lg py-6 text-3xl font-bold transition-all hover:scale-105">
                  3
                </button>
                <button onclick="selectPuzzlePiece11('×')" id="piece-times" 
                  class="bg-white hover:bg-purple-100 border-2 border-purple-300 rounded-lg py-6 text-3xl font-bold transition-all hover:scale-105">
                  ×
                </button>
                <button onclick="selectPuzzlePiece11('4')" id="piece-4" 
                  class="bg-white hover:bg-purple-100 border-2 border-purple-300 rounded-lg py-6 text-3xl font-bold transition-all hover:scale-105">
                  4
                </button>
              </div>
              
              <div class="bg-gray-100 rounded-lg p-4 min-h-[80px] flex items-center justify-center">
                <div id="case11-formula" class="text-4xl font-bold text-purple-700">
                  式: ___
                </div>
              </div>
            </div>
            
            <div id="case11-result" class="text-center text-xl font-bold min-h-[3rem]"></div>
            
            <div class="text-center">
              <button onclick="checkPuzzle11()" 
                class="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md mr-2">
                答え合わせ
              </button>
              <button onclick="resetPuzzle11()" 
                class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all">
                リセット
              </button>
            </div>
          </div>
        </div>
        
        <div data-tab-content="case11-video" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-video text-6xl text-purple-600"></i>
            <p class="text-purple-700 font-bold text-2xl mt-3">AI生成応用問題動画</p>
          </div>
          <div class="text-center mb-6">
            <button onclick="generateAdvancedVideo()" 
              class="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-4 px-10 rounded-lg transition-all shadow-md text-lg">
              <i class="fas fa-play-circle mr-2"></i>動画を生成する
            </button>
          </div>
          <div id="advancedVideoPreview"></div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  window.case11PuzzlePieces = []
}

function selectPuzzlePiece11(piece) {
  window.case11PuzzlePieces = window.case11PuzzlePieces || []
  window.case11PuzzlePieces.push(piece)
  
  const formulaEl = document.getElementById('case11-formula')
  if (formulaEl) {
    formulaEl.textContent = `式: ${window.case11PuzzlePieces.join(' ')}`
  }
  
  // 3つ選んだら自動チェック
  if (window.case11PuzzlePieces.length === 3) {
    setTimeout(checkPuzzle11, 500)
  }
}

function checkPuzzle11() {
  const formula = (window.case11PuzzlePieces || []).join(' ')
  const resultEl = document.getElementById('case11-result')
  
  if (formula === '3 × 4' || formula === '4 × 3') {
    resultEl.innerHTML = `
      <div class="bg-green-100 border-2 border-green-400 rounded-lg p-4">
        <i class="fas fa-check-circle text-green-600 mr-2"></i>
        正解！ 式: ${formula} = 12
      </div>
    `
  } else if (window.case11PuzzlePieces.length === 3) {
    resultEl.innerHTML = '<div class="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4"><i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>もう一度考えてみよう</div>'
  }
}

function resetPuzzle11() {
  window.case11PuzzlePieces = []
  const formulaEl = document.getElementById('case11-formula')
  const resultEl = document.getElementById('case11-result')
  
  if (formulaEl) formulaEl.textContent = '式: ___'
  if (resultEl) resultEl.innerHTML = ''
}

async function generateAdvancedVideo() {
  const previewDiv = document.getElementById('advancedVideoPreview')
  if (!previewDiv) return
  
  previewDiv.innerHTML = '<div class="bg-white rounded-lg p-6 text-center"><div class="animate-spin mb-4 mx-auto inline-block"><i class="fas fa-spinner text-5xl text-purple-600"></i></div><p class="text-purple-700 font-semibold">AI動画生成中...</p></div>'
  
  try {
    const response = await fetch('/api/media/generate-video-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseNumber: 11 })
    })
    const data = await response.json()
    previewDiv.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-lg">
        <div class="bg-gray-900 rounded-lg overflow-hidden mb-4" style="height: 500px;">
          <iframe srcdoc="${data.animationHtml.replace(/"/g, '&quot;')}" class="w-full h-full" frameborder="0" sandbox="allow-scripts"></iframe>
        </div>
        <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p class="text-lg text-green-800"><i class="fas fa-check-circle mr-2"></i><strong>生成完了！</strong> ${data.note}</p>
        </div>
      </div>
    `
  } catch (error) {
    previewDiv.innerHTML = '<div class="bg-white rounded-lg p-6 text-center text-red-600"><i class="fas fa-exclamation-circle text-6xl mb-4"></i><p>エラーが発生しました</p></div>'
  }
}

window.demoCase11Advanced = demoCase11Advanced
window.selectPuzzlePiece11 = selectPuzzlePiece11
window.checkPuzzle11 = checkPuzzle11
window.resetPuzzle11 = resetPuzzle11
window.generateAdvancedVideo = generateAdvancedVideo

console.log('✅ ケース11（応用問題）タブ付きバージョン実装完了')

// ============================================================================
// ケース12: 復習（タブ付き）
// ============================================================================
function demoCase12Review() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 w-[95vw] h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
      <button onclick="this.closest('.fixed').remove()" 
        class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-50 bg-white rounded-full p-2 shadow-lg">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-book-open mr-2 text-emerald-600"></i>
          ケース12: 総復習
        </h3>
        <p class="text-base text-emerald-600">テスト準備：重要ポイントを総復習</p>
      </div>
      
      <div class="flex border-b border-gray-300 mb-4">
        <button onclick="switchTab('learn', 'case12')" data-tab-target="case12-learn"
          class="flex-1 py-3 text-base font-semibold border-b-4 border-emerald-600 text-emerald-600 transition-all hover:bg-emerald-50">
          <i class="fas fa-book mr-2"></i>学習内容
        </button>
        <button onclick="switchTab('experience', 'case12')" data-tab-target="case12-experience"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-hand-pointer mr-2"></i>体験してみる
        </button>
        <button onclick="switchTab('video', 'case12')" data-tab-target="case12-video"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-film mr-2"></i>AI動画
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-2">
        <div data-tab-content="case12-learn" class="bg-white rounded-xl p-6 shadow-inner">
          <div class="text-center mb-6">
            <i class="fas fa-clipboard-check text-6xl text-emerald-600"></i>
            <p class="text-emerald-700 font-bold text-2xl mt-3">📚 復習: 3×4</p>
          </div>
          
          <div class="space-y-4">
            <div class="bg-emerald-50 border-l-4 border-emerald-400 p-5 rounded-lg">
              <h4 class="font-bold text-emerald-800 text-xl mb-3">📖 基本を確認</h4>
              <div class="space-y-2 text-gray-700">
                <p>✓ 3×4 の意味: 3が4つ</p>
                <p>✓ たし算: 3+3+3+3</p>
                <p>✓ 答え: 12</p>
              </div>
            </div>
            
            <div class="bg-green-50 border-l-4 border-green-400 p-5 rounded-lg">
              <h4 class="font-bold text-green-800 text-xl mb-3">🔍 間違えやすいポイント</h4>
              <div class="space-y-2 text-gray-700">
                <p>✓ 3×4 と 4×3 は同じ12</p>
                <p>✓ かける数とかけられる数を確認</p>
                <p>✓ 図で確かめる癖をつける</p>
              </div>
            </div>
            
            <div class="bg-teal-50 border-l-4 border-teal-400 p-5 rounded-lg">
              <h4 class="font-bold text-teal-800 text-xl mb-3">🎯 最終チェック</h4>
              <div class="space-y-2 text-gray-700">
                <p class="font-bold text-2xl text-teal-700">3 × 4 = 12 ✓</p>
                <p class="text-xl">準備完璧！自信を持って！</p>
              </div>
            </div>
          </div>
        </div>
        
        <div data-tab-content="case12-experience" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-tasks text-6xl text-emerald-600"></i>
            <p class="text-emerald-700 font-bold text-2xl mt-3">復習チェックリスト</p>
            <p class="text-gray-600 mt-2">理解できたらチェックを入れよう！</p>
          </div>
          
          <div class="bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl p-8">
            <div class="bg-white rounded-xl p-6 space-y-4">
              <div class="flex items-center p-4 border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer" onclick="toggleCheck12(1)">
                <div id="check-1" class="w-8 h-8 border-2 border-emerald-400 rounded flex items-center justify-center mr-4 flex-shrink-0">
                  <i class="fas fa-check text-emerald-600 text-xl hidden"></i>
                </div>
                <div>
                  <p class="font-bold text-emerald-800">3×4 の意味が分かる</p>
                  <p class="text-sm text-gray-600">3が4つ集まった数</p>
                </div>
              </div>
              
              <div class="flex items-center p-4 border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer" onclick="toggleCheck12(2)">
                <div id="check-2" class="w-8 h-8 border-2 border-emerald-400 rounded flex items-center justify-center mr-4 flex-shrink-0">
                  <i class="fas fa-check text-emerald-600 text-xl hidden"></i>
                </div>
                <div>
                  <p class="font-bold text-emerald-800">答えが12だと言える</p>
                  <p class="text-sm text-gray-600">素早く正確に</p>
                </div>
              </div>
              
              <div class="flex items-center p-4 border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer" onclick="toggleCheck12(3)">
                <div id="check-3" class="w-8 h-8 border-2 border-emerald-400 rounded flex items-center justify-center mr-4 flex-shrink-0">
                  <i class="fas fa-check text-emerald-600 text-xl hidden"></i>
                </div>
                <div>
                  <p class="font-bold text-emerald-800">図で説明できる</p>
                  <p class="text-sm text-gray-600">視覚的に理解している</p>
                </div>
              </div>
              
              <div class="flex items-center p-4 border-2 border-emerald-200 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer" onclick="toggleCheck12(4)">
                <div id="check-4" class="w-8 h-8 border-2 border-emerald-400 rounded flex items-center justify-center mr-4 flex-shrink-0">
                  <i class="fas fa-check text-emerald-600 text-xl hidden"></i>
                </div>
                <div>
                  <p class="font-bold text-emerald-800">応用問題も解ける</p>
                  <p class="text-sm text-gray-600">文章題にも対応できる</p>
                </div>
              </div>
            </div>
            
            <div id="case12-result" class="mt-6 text-center text-xl font-bold min-h-[3rem]"></div>
            
            <div class="text-center mt-6">
              <button onclick="resetChecklist12()" 
                class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all">
                リセット
              </button>
            </div>
          </div>
        </div>
        
        <div data-tab-content="case12-video" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-video text-6xl text-emerald-600"></i>
            <p class="text-emerald-700 font-bold text-2xl mt-3">AI生成総復習動画</p>
          </div>
          <div class="text-center mb-6">
            <button onclick="generateReviewVideo()" 
              class="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-4 px-10 rounded-lg transition-all shadow-md text-lg">
              <i class="fas fa-play-circle mr-2"></i>動画を生成する
            </button>
          </div>
          <div id="reviewVideoPreview"></div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  window.case12CheckCount = 0
}

function toggleCheck12(num) {
  const checkEl = document.getElementById(`check-${num}`)
  if (!checkEl) return
  
  const icon = checkEl.querySelector('i')
  const isChecked = !icon.classList.contains('hidden')
  
  if (isChecked) {
    icon.classList.add('hidden')
    window.case12CheckCount = Math.max(0, (window.case12CheckCount || 0) - 1)
  } else {
    icon.classList.remove('hidden')
    window.case12CheckCount = (window.case12CheckCount || 0) + 1
  }
  
  const resultEl = document.getElementById('case12-result')
  if (window.case12CheckCount === 4) {
    resultEl.innerHTML = `
      <div class="bg-green-100 border-2 border-green-400 rounded-lg p-4">
        <i class="fas fa-trophy text-yellow-500 text-3xl mr-2"></i>
        <div class="text-2xl font-bold text-green-700">完璧！すべて理解できています！</div>
      </div>
    `
  } else if (window.case12CheckCount > 0) {
    resultEl.innerHTML = `
      <div class="bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
        <div class="text-lg text-blue-700">チェック数: ${window.case12CheckCount} / 4</div>
      </div>
    `
  } else {
    resultEl.innerHTML = ''
  }
}

function resetChecklist12() {
  window.case12CheckCount = 0
  for (let i = 1; i <= 4; i++) {
    const checkEl = document.getElementById(`check-${i}`)
    if (checkEl) {
      const icon = checkEl.querySelector('i')
      if (icon) icon.classList.add('hidden')
    }
  }
  const resultEl = document.getElementById('case12-result')
  if (resultEl) resultEl.innerHTML = ''
}

async function generateReviewVideo() {
  const previewDiv = document.getElementById('reviewVideoPreview')
  if (!previewDiv) return
  
  previewDiv.innerHTML = '<div class="bg-white rounded-lg p-6 text-center"><div class="animate-spin mb-4 mx-auto inline-block"><i class="fas fa-spinner text-5xl text-emerald-600"></i></div><p class="text-emerald-700 font-semibold">AI動画生成中...</p></div>'
  
  try {
    const response = await fetch('/api/media/generate-video-practice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseNumber: 12 })
    })
    const data = await response.json()
    previewDiv.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-lg">
        <div class="bg-gray-900 rounded-lg overflow-hidden mb-4" style="height: 500px;">
          <iframe srcdoc="${data.animationHtml.replace(/"/g, '&quot;')}" class="w-full h-full" frameborder="0" sandbox="allow-scripts"></iframe>
        </div>
        <div class="bg-green-50 border border-green-200 p-4 rounded-lg">
          <p class="text-lg text-green-800"><i class="fas fa-check-circle mr-2"></i><strong>生成完了！</strong> ${data.note}</p>
        </div>
      </div>
    `
  } catch (error) {
    previewDiv.innerHTML = '<div class="bg-white rounded-lg p-6 text-center text-red-600"><i class="fas fa-exclamation-circle text-6xl mb-4"></i><p>エラーが発生しました</p></div>'
  }
}

window.demoCase12Review = demoCase12Review
window.toggleCheck12 = toggleCheck12
window.resetChecklist12 = resetChecklist12
window.generateReviewVideo = generateReviewVideo

console.log('✅ ケース12（復習）タブ付きバージョン実装完了')

console.log('🎉 全ケース（5, 7, 8, 9, 10, 11, 12）タブ付き実装完了！')
