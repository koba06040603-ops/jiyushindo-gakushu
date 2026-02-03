// ケース7-12のタブ付き実装（一時ファイル）

// ケース7: スモールステップ（タブ付き）
function demoCase7SmallSteps() {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl p-6 w-[95vw] h-[95vh] relative shadow-2xl overflow-hidden flex flex-col">
      <button onclick="this.closest('.fixed').remove()" 
        class="absolute top-4 right-4 text-gray-600 hover:text-gray-900 transition-colors z-50 bg-white rounded-full p-2 shadow-lg">
        <i class="fas fa-times text-2xl"></i>
      </button>
      
      <div class="text-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-2">
          <i class="fas fa-shoe-prints mr-2 text-green-600"></i>
          ケース7: スモールステップで理解
        </h3>
        <p class="text-base text-green-600">特別支援：ゆっくり・ていねいに・ステップごと</p>
      </div>
      
      <!-- タブナビゲーション -->
      <div class="flex border-b border-gray-300 mb-4">
        <button onclick="switchTab('learn', 'case7')" data-tab-target="case7-learn"
          class="flex-1 py-3 text-base font-semibold border-b-4 border-green-600 text-green-600 transition-all hover:bg-green-50">
          <i class="fas fa-book mr-2"></i>学習内容
        </button>
        <button onclick="switchTab('experience', 'case7')" data-tab-target="case7-experience"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-hand-pointer mr-2"></i>体験してみる
        </button>
        <button onclick="switchTab('video', 'case7')" data-tab-target="case7-video"
          class="flex-1 py-3 text-base font-semibold text-gray-600 transition-all hover:bg-gray-50">
          <i class="fas fa-film mr-2"></i>AI動画
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-2">
        <!-- タブ1: 学習内容 -->
        <div data-tab-content="case7-learn" class="bg-white rounded-xl p-6 shadow-inner">
          <div class="text-center mb-6">
            <i class="fas fa-shoe-prints text-6xl text-green-600"></i>
            <p class="text-green-700 font-bold text-2xl mt-3">👣 スモールステップ版: 3×4</p>
          </div>
          
          <div class="space-y-4">
            <div class="bg-green-50 border-l-4 border-green-400 p-5 rounded-lg">
              <div class="flex items-center mb-3">
                <span class="text-3xl mr-2">1️⃣</span>
                <h4 class="font-bold text-green-800 text-xl">ステップ1: 3を1回</h4>
              </div>
              <div class="ml-12 text-gray-700">まず 3 を数えます → <strong>3</strong></div>
            </div>
            
            <div class="bg-teal-50 border-l-4 border-teal-400 p-5 rounded-lg">
              <div class="flex items-center mb-3">
                <span class="text-3xl mr-2">2️⃣</span>
                <h4 class="font-bold text-teal-800 text-xl">ステップ2: もう1回 3</h4>
              </div>
              <div class="ml-12 text-gray-700">3 に 3 をたします → <strong>6</strong></div>
            </div>
            
            <div class="bg-cyan-50 border-l-4 border-cyan-400 p-5 rounded-lg">
              <div class="flex items-center mb-3">
                <span class="text-3xl mr-2">3️⃣</span>
                <h4 class="font-bold text-cyan-800 text-xl">ステップ3: さらに 3</h4>
              </div>
              <div class="ml-12 text-gray-700">6 に 3 をたします → <strong>9</strong></div>
            </div>
            
            <div class="bg-blue-50 border-l-4 border-blue-400 p-5 rounded-lg">
              <div class="flex items-center mb-3">
                <span class="text-3xl mr-2">4️⃣</span>
                <h4 class="font-bold text-blue-800 text-xl">ステップ4: 最後の 3</h4>
              </div>
              <div class="ml-12 text-gray-700">9 に 3 をたします → <strong class="text-2xl text-blue-700">12！</strong></div>
            </div>
          </div>
        </div>
        
        <!-- タブ2: 体験してみる -->
        <div data-tab-content="case7-experience" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-tasks text-6xl text-green-600"></i>
            <p class="text-green-700 font-bold text-2xl mt-3">ステップ進行バー</p>
            <p class="text-gray-600 mt-2">ボタンを押してステップを進めよう！</p>
          </div>
          
          <div class="bg-gradient-to-br from-green-100 to-teal-100 rounded-xl p-8 mb-6">
            <!-- 進行バー -->
            <div class="mb-6">
              <div class="h-4 bg-gray-300 rounded-full overflow-hidden">
                <div id="case7-progress" class="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-500" style="width: 0%"></div>
              </div>
              <p class="text-center text-lg font-bold text-green-700 mt-2">
                ステップ: <span id="case7-step-number">0</span> / 4
              </p>
            </div>
            
            <!-- ステップ表示 -->
            <div class="bg-white rounded-lg p-6 mb-6 min-h-[150px]">
              <div id="case7-step-content" class="text-center text-gray-600">
                「次のステップ」ボタンを押して始めよう！
              </div>
            </div>
            
            <!-- ボタン -->
            <div class="flex gap-4 justify-center">
              <button onclick="nextStep7()" 
                class="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-3 px-8 rounded-lg transition-all shadow-md">
                次のステップ →
              </button>
              <button onclick="resetSteps7()" 
                class="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg transition-all">
                リセット
              </button>
            </div>
          </div>
        </div>
        
        <!-- タブ3: AI動画 -->
        <div data-tab-content="case7-video" class="bg-white rounded-xl p-6 shadow-inner hidden">
          <div class="text-center mb-6">
            <i class="fas fa-video text-6xl text-green-600"></i>
            <p class="text-green-700 font-bold text-2xl mt-3">AI生成スモールステップ動画</p>
            <p class="text-gray-600 mt-2">ゆっくりていねいに段階的に理解する動画</p>
          </div>
          
          <div class="text-center mb-6">
            <button onclick="generateSmallStepsVideo()" 
              class="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold py-4 px-10 rounded-lg transition-all shadow-md hover:shadow-lg text-lg">
              <i class="fas fa-play-circle mr-2"></i>動画を生成する
            </button>
          </div>
          
          <div id="smallStepsVideoPreview"></div>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  window.case7CurrentStep = 0
}

// ケース7のステップ進行関数
function nextStep7() {
  window.case7CurrentStep = (window.case7CurrentStep || 0) + 1
  if (window.case7CurrentStep > 4) window.case7CurrentStep = 4
  
  const stepNumber = document.getElementById('case7-step-number')
  const progressBar = document.getElementById('case7-progress')
  const stepContent = document.getElementById('case7-step-content')
  
  if (stepNumber) stepNumber.textContent = window.case7CurrentStep
  if (progressBar) progressBar.style.width = `${window.case7CurrentStep * 25}%`
  
  const steps = [
    { title: 'スタート', content: '3×4 を 4つのステップで学びます', emoji: '🚀', value: '' },
    { title: 'ステップ1', content: 'まず 3 を数えます', emoji: '1️⃣', value: '= 3' },
    { title: 'ステップ2', content: '3 に 3 をたします', emoji: '2️⃣', value: '= 6' },
    { title: 'ステップ3', content: '6 に 3 をたします', emoji: '3️⃣', value: '= 9' },
    { title: 'ステップ4', content: '9 に 3 をたします', emoji: '4️⃣', value: '= 12 完成！' }
  ]
  
  const step = steps[window.case7CurrentStep]
  if (stepContent && step) {
    stepContent.innerHTML = `
      <div class="text-6xl mb-4">${step.emoji}</div>
      <div class="text-2xl font-bold text-green-800 mb-2">${step.title}</div>
      <div class="text-lg text-gray-700 mb-4">${step.content}</div>
      <div class="text-3xl font-bold text-green-600">${step.value}</div>
    `
  }
}

function resetSteps7() {
  window.case7CurrentStep = 0
  const stepNumber = document.getElementById('case7-step-number')
  const progressBar = document.getElementById('case7-progress')
  const stepContent = document.getElementById('case7-step-content')
  
  if (stepNumber) stepNumber.textContent = '0'
  if (progressBar) progressBar.style.width = '0%'
  if (stepContent) stepContent.innerHTML = '「次のステップ」ボタンを押して始めよう！'
}

// ケース7のグローバル登録
window.demoCase7SmallSteps = demoCase7SmallSteps
window.nextStep7 = nextStep7
window.resetSteps7 = resetSteps7

console.log('✅ ケース7（スモールステップ）タブ付きバージョン実装完了')
