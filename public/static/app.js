// グローバルエラーハンドラー（詳細ログ付き）
window.addEventListener('error', (event) => {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('🔴 JavaScript Error Detected!')
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('Message:', event.message)
  console.error('File:', event.filename)
  console.error('Line:', event.lineno, 'Column:', event.colno)
  console.error('Error Object:', event.error)
  if (event.error && event.error.stack) {
    console.error('Stack Trace:', event.error.stack)
  }
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('🔴 Unhandled Promise Rejection!')
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('Reason:', event.reason)
  if (event.reason && event.reason.stack) {
    console.error('Stack Trace:', event.reason.stack)
  }
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
})

// 起動時に確認メッセージ
console.log('✅ app.js loaded successfully')
console.log('📦 Available functions:', typeof renderTopPage, typeof showTopPage)

// グローバル状態管理
const state = {
  currentView: 'top', // 'top', 'guide', 'card', 'progress', 'login'
  selectedCurriculum: null,
  selectedCourse: null,
  selectedCard: null,
  student: {
    id: 1, // デモ用
    name: '山田太郎',
    classCode: 'CLASS2024A'
  },
  auth: {
    isAuthenticated: false,
    sessionToken: null,
    refreshToken: null,
    user: null
  }
}

// =============================================================================
// 学習ログ記録機能（個別最適化のためのデータ収集）
// =============================================================================

// 学習セッション管理
const learningSession = {
  sessionId: null,
  startTime: null,
  currentCardStartTime: null,
  stats: {
    totalProblems: 0,
    correctProblems: 0,
    totalHintsUsed: 0,
    totalAIRequests: 0
  }
}

// セッションID生成
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

// 学習セッション開始
async function startLearningSession(unitId) {
  learningSession.sessionId = generateSessionId()
  learningSession.startTime = Date.now()
  learningSession.stats = {
    totalProblems: 0,
    correctProblems: 0,
    totalHintsUsed: 0,
    totalAIRequests: 0
  }
  
  try {
    await axios.post('/api/learning/session/start', {
      student_id: state.student.id || 1,
      unit_id: unitId,
      session_id: learningSession.sessionId
    })
    console.log('📊 学習セッション開始:', learningSession.sessionId)
  } catch (error) {
    console.error('セッション開始エラー:', error)
  }
}

// 学習セッション終了
async function endLearningSession() {
  if (!learningSession.sessionId) return
  
  try {
    await axios.post('/api/learning/session/end', {
      session_id: learningSession.sessionId,
      ...learningSession.stats
    })
    console.log('📊 学習セッション終了:', learningSession.stats)
  } catch (error) {
    console.error('セッション終了エラー:', error)
  }
  
  learningSession.sessionId = null
}

// 学習カード開始時刻記録
function startCardTiming() {
  learningSession.currentCardStartTime = Date.now()
}

// 学習ログ記録関数
async function logLearningActivity(data) {
  try {
    await axios.post('/api/learning/log', {
      student_id: state.student.id || 1,
      unit_id: data.unitId || state.selectedCurriculum?.id,
      card_id: data.cardId,
      course_type: data.courseType || state.selectedCourse?.course_level || 'unknown',
      is_correct: data.isCorrect,
      answer_time_seconds: data.answerTime,
      hint_count: data.hintCount || 0,
      retry_count: data.retryCount || 0,
      difficulty_level: data.difficulty || 'medium',
      problem_type: data.problemType || 'general'
    })
    
    // セッション統計更新
    if (learningSession.sessionId) {
      learningSession.stats.totalProblems++
      if (data.isCorrect) {
        learningSession.stats.correctProblems++
      }
      learningSession.stats.totalHintsUsed += (data.hintCount || 0)
    }
    
    console.log('📝 学習ログ記録成功:', data.cardId)
  } catch (error) {
    console.error('学習ログ記録エラー:', error)
  }
}

// 問題タイプ判定ヘルパー
function getProblemType(cardTitle) {
  if (!cardTitle) return 'general'
  
  if (cardTitle.includes('計算') || cardTitle.includes('かけ算') || cardTitle.includes('たし算')) {
    return 'calculation'
  } else if (cardTitle.includes('文章') || cardTitle.includes('問題')) {
    return 'word_problem'
  } else if (cardTitle.includes('応用') || cardTitle.includes('活用')) {
    return 'application'
  } else if (cardTitle.includes('図') || cardTitle.includes('グラフ')) {
    return 'visualization'
  }
  
  return 'general'
}

// 難易度判定ヘルパー
function getDifficultyLevel(courseLevel) {
  if (!courseLevel) return 'medium'
  
  if (courseLevel === 'じっくり' || courseLevel === '基礎') {
    return 'easy'
  } else if (courseLevel === 'ぐんぐん' || courseLevel === '発展') {
    return 'hard'
  }
  
  return 'medium'
}

// 学習プロファイル更新（バックグラウンド）
async function updateLearningProfile() {
  try {
    const response = await axios.post('/api/learning/profile/update', {
      student_id: state.student.id || 1
    })
    
    if (response.data.success && response.data.profile) {
      console.log('📈 学習プロファイル更新:', response.data.profile)
    }
  } catch (error) {
    console.error('プロファイル更新エラー:', error)
  }
}

// =============================================================================

// グローバルローディング管理
const loadingManager = {
  show: (message = '読み込み中...') => {
    const existing = document.getElementById('global-loading')
    if (existing) return
    
    const loadingDiv = document.createElement('div')
    loadingDiv.id = 'global-loading'
    loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    loadingDiv.innerHTML = `
      <div class="bg-white rounded-lg p-8 shadow-2xl max-w-sm mx-4 text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
        <p class="text-xl font-bold text-gray-800 mb-2">${message}</p>
        <p class="text-sm text-gray-500">しばらくお待ちください</p>
      </div>
    `
    document.body.appendChild(loadingDiv)
  },
  
  hide: () => {
    const loading = document.getElementById('global-loading')
    if (loading) {
      loading.remove()
    }
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  // ローカルストレージから認証情報を復元
  const savedSession = localStorage.getItem('session_token')
  const savedUser = localStorage.getItem('user')
  
  if (savedSession && savedUser) {
    state.auth.sessionToken = savedSession
    state.auth.refreshToken = localStorage.getItem('refresh_token')
    state.auth.user = JSON.parse(savedUser)
    state.auth.isAuthenticated = true
    
    // ユーザー情報をstateに反映
    state.student.id = state.auth.user.id
    state.student.name = state.auth.user.name
    state.student.classCode = state.auth.user.class_code
    
    // WebSocketに接続
    websocket.connect()
    
    // セッションの有効性を確認
    verifySession()
  } else {
    // 未ログインの場合はログイン画面へ
    renderLoginPage()
    return
  }
  
  renderTopPage()
})

// ============================================
// トップページ（学年・教科・単元選択）
// ============================================
async function renderTopPage() {
  state.currentView = 'top'
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <!-- ヘッダー -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-xl p-8 mb-8 text-center">
        <h1 class="text-5xl font-bold text-white mb-3">
          <i class="fas fa-graduation-cap mr-3"></i>
          自由進度学習支援システム
        </h1>
        <p class="text-white text-xl opacity-90">AIで学習カードを自動生成</p>
        <p class="text-white text-sm opacity-75 mt-2">学年・教科・単元名を入力するだけ</p>
      </div>

      <!-- ユーザー情報 -->
      <div class="bg-white rounded-lg shadow p-4 mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <i class="fas fa-user-circle text-3xl text-indigo-500 mr-3"></i>
            <div>
              <p class="text-sm text-gray-500">ログイン中</p>
              <p class="font-bold text-lg">${state.student.name}</p>
              ${state.auth.user ? `<p class="text-xs text-gray-400">${state.auth.user.role === 'teacher' ? '教師' : state.auth.user.role === 'admin' ? '管理者' : '児童・生徒'} | クラス: ${state.student.classCode}</p>` : ''}
            </div>
          </div>
          <button
            onclick="logout()"
            class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <i class="fas fa-sign-out-alt mr-2"></i>ログアウト
          </button>
        </div>
      </div>

      ${state.auth.user && (state.auth.user.role === 'teacher' || state.auth.user.role === 'admin') ? `
      <!-- 教師用メニュー -->
      <div class="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-xl p-6 mb-8">
        <h2 class="text-2xl font-bold text-white mb-4 text-center">
          <i class="fas fa-chalkboard-teacher mr-2"></i>教師用メニュー
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onclick="showProgressBoardSelection()"
            class="bg-white text-blue-600 hover:bg-blue-50 py-4 px-6 rounded-lg font-bold text-lg transition shadow-lg flex items-center justify-center group">
            <i class="fas fa-chart-bar mr-2 text-xl"></i>
            進捗ボードを見る
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
          </button>
          <button 
            onclick="showWeeklyReport()"
            class="bg-white text-indigo-600 hover:bg-indigo-50 py-4 px-6 rounded-lg font-bold text-lg transition shadow-lg flex items-center justify-center group">
            <i class="fas fa-calendar-week mr-2 text-xl"></i>
            週次レポート
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
      </div>
      ` : ''}

      <!-- メインアクション：AI単元生成 -->
      <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-2xl p-10 mb-8">
        <div class="text-center mb-6">
          <div class="inline-block bg-white bg-opacity-20 px-4 py-2 rounded-full text-white text-sm font-bold mb-4">
            ✨ AIが約1分で18枚の学習カードを生成
          </div>
          <h2 class="text-3xl font-bold text-white mb-3">
            <i class="fas fa-wand-magic-sparkles mr-2"></i>
            新しい単元を作成
          </h2>
          <p class="text-white text-lg opacity-90 mb-2">
            学年・教科・単元名を入力するだけで完成！
          </p>
          <p class="text-white text-sm opacity-75">
            3つのコース（じっくり・しっかり・ぐんぐん） × 各6枚 = 18枚の学習カード
          </p>
        </div>
        
        <button 
          onclick="showUnitGeneratorModal()"
          class="w-full bg-white text-purple-600 hover:bg-purple-50 py-6 px-8 rounded-lg font-bold text-2xl transition shadow-xl flex items-center justify-center group">
          <i class="fas fa-magic mr-3 text-3xl group-hover:animate-bounce"></i>
          AIで学習カードを作成する
          <i class="fas fa-arrow-right ml-3 group-hover:translate-x-2 transition-transform"></i>
        </button>

        <!-- 機能紹介 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div class="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 text-center">
            <i class="fas fa-clock text-3xl text-white mb-2"></i>
            <p class="text-white font-bold">約1分</p>
            <p class="text-white text-sm opacity-75">高速生成</p>
          </div>
          <div class="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 text-center">
            <i class="fas fa-book text-3xl text-white mb-2"></i>
            <p class="text-white font-bold">18枚のカード</p>
            <p class="text-white text-sm opacity-75">3コース×6枚</p>
          </div>
          <div class="bg-white bg-opacity-10 backdrop-blur rounded-lg p-4 text-center">
            <i class="fas fa-lightbulb text-3xl text-white mb-2"></i>
            <p class="text-white font-bold">54個のヒント</p>
            <p class="text-white text-sm opacity-75">3段階で自律学習</p>
          </div>
        </div>
      </div>

      <!-- 使い方ガイド -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
          <i class="fas fa-question-circle mr-2 text-indigo-600"></i>
          使い方ガイド
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Step 1 -->
          <div class="text-center">
            <div class="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl font-bold text-indigo-600">1</span>
            </div>
            <h3 class="font-bold text-gray-800 mb-2">学習内容を入力</h3>
            <p class="text-gray-600 text-sm">学年・教科・教科書会社・単元名を入力</p>
          </div>
          
          <!-- Step 2 -->
          <div class="text-center">
            <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl font-bold text-purple-600">2</span>
            </div>
            <h3 class="font-bold text-gray-800 mb-2">AIが自動生成</h3>
            <p class="text-gray-600 text-sm">Gemini 3が約1分で18枚のカードを作成</p>
          </div>
          
          <!-- Step 3 -->
          <div class="text-center">
            <div class="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl font-bold text-pink-600">3</span>
            </div>
            <h3 class="font-bold text-gray-800 mb-2">内容を確認</h3>
            <p class="text-gray-600 text-sm">詳細を確認し、必要に応じて調整</p>
          </div>
          
          <!-- Step 4 -->
          <div class="text-center">
            <div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-3xl font-bold text-green-600">4</span>
            </div>
            <h3 class="font-bold text-gray-800 mb-2">学習を開始</h3>
            <p class="text-gray-600 text-sm">自分のペースで学習を進める</p>
          </div>
        </div>
        
        <!-- 特徴一覧 -->
        <div class="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
          <h3 class="font-bold text-gray-800 mb-4 text-center">
            <i class="fas fa-star mr-2 text-yellow-500"></i>
            このシステムの特徴
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <div>
                <p class="font-bold text-gray-800">3段階のヒント</p>
                <p class="text-gray-600 text-sm">つまずいても安心して進められる</p>
              </div>
            </div>
            <div class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <div>
                <p class="font-bold text-gray-800">実社会とのつながり</p>
                <p class="text-gray-600 text-sm">学びを生活に活かせる</p>
              </div>
            </div>
            <div class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <div>
                <p class="font-bold text-gray-800">自分のペースで学習</p>
                <p class="text-gray-600 text-sm">3つのコースから選べる</p>
              </div>
            </div>
            <div class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <div>
                <p class="font-bold text-gray-800">印刷対応</p>
                <p class="text-gray-600 text-sm">紙で学習したい場合も対応</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 学習スタイル別サンプル（プレゼン用） -->
      <div class="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-xl p-8 mb-8">
        <div class="text-center">
          <div class="inline-block bg-white bg-opacity-20 px-4 py-2 rounded-full text-white text-sm font-bold mb-4">
            👥 プレゼン用サンプル
          </div>
          <h2 class="text-2xl font-bold text-white mb-3">
            <i class="fas fa-brain mr-2"></i>
            学習スタイル別サンプル
          </h2>
          <p class="text-white text-lg opacity-90 mb-4">
            視覚優位・聴覚優位・体験優位の違いを実感できるサンプル
          </p>
          <button 
            onclick="showLearningStyleSamples()"
            class="bg-white text-blue-600 hover:bg-blue-50 py-4 px-8 rounded-lg font-bold text-lg transition shadow-xl flex items-center justify-center mx-auto group">
            <i class="fas fa-eye mr-2 text-xl"></i>
            サンプルを見る
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-2 transition-transform"></i>
          </button>
        </div>
      </div>

    </div>
  `
}

async function loadTopPageData() {
  try {
    // 選択肢データの取得
    const response = await axios.get('/api/curriculum/options')
    const { grades, subjects, textbooks } = response.data

    // 学年選択肢を設定
    const gradeSelect = document.getElementById('gradeSelect')
    grades.forEach(item => {
      const option = document.createElement('option')
      option.value = item.grade
      option.textContent = `小学${item.grade}年`
      gradeSelect.appendChild(option)
    })

    // 教科選択肢を設定
    const subjectSelect = document.getElementById('subjectSelect')
    subjects.forEach(item => {
      const option = document.createElement('option')
      option.value = item.subject
      option.textContent = item.subject
      subjectSelect.appendChild(option)
    })

    // 教科書会社選択肢を設定
    const textbookSelect = document.getElementById('textbookSelect')
    textbooks.forEach(item => {
      const option = document.createElement('option')
      option.value = item.textbook_company
      option.textContent = item.textbook_company
      textbookSelect.appendChild(option)
    })

    // 選択が変更されたら単元リストを更新
    gradeSelect.addEventListener('change', updateUnitList)
    subjectSelect.addEventListener('change', updateUnitList)
    textbookSelect.addEventListener('change', updateUnitList)

    // 開始ボタン
    document.getElementById('startButton').addEventListener('click', () => {
      const unitSelect = document.getElementById('unitSelect')
      const curriculumId = unitSelect.value
      if (curriculumId) {
        loadGuidePage(curriculumId)
      }
    })
  } catch (error) {
    console.error('データ読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
  }
}

async function updateUnitList() {
  const grade = document.getElementById('gradeSelect').value
  const subject = document.getElementById('subjectSelect').value
  const textbook = document.getElementById('textbookSelect').value
  const unitSelect = document.getElementById('unitSelect')
  const startButton = document.getElementById('startButton')

  // リセット
  unitSelect.innerHTML = '<option value="">選択してください</option>'
  startButton.disabled = true

  // 3つすべて選択されている場合のみ単元を読み込み
  if (grade && subject && textbook) {
    try {
      const response = await axios.get('/api/curriculum')
      const curricula = response.data.filter(c => 
        c.grade == grade && 
        c.subject === subject && 
        c.textbook_company === textbook
      )

      if (curricula.length > 0) {
        // カード形式で表示
        unitSelect.innerHTML = ''
        unitSelect.className = 'space-y-2'
        
        curricula.forEach(item => {
          const card = document.createElement('div')
          card.className = 'bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition cursor-pointer flex items-center justify-between group'
          card.innerHTML = `
            <div class="flex-1" onclick="selectUnit(${item.id})">
              <p class="font-bold text-gray-800">${item.unit_order}. ${item.unit_name}</p>
              <p class="text-sm text-gray-500">${item.grade}年 ${item.subject} - ${item.textbook_company}</p>
            </div>
            <div class="flex gap-2">
              <button 
                onclick="event.stopPropagation(); duplicateCurriculum(${item.id})" 
                class="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded transition opacity-0 group-hover:opacity-100"
                title="複製">
                <i class="fas fa-copy"></i>
              </button>
              <button 
                onclick="event.stopPropagation(); editCurriculum(${item.id})" 
                class="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded transition opacity-0 group-hover:opacity-100"
                title="編集">
                <i class="fas fa-edit"></i>
              </button>
              <button 
                onclick="event.stopPropagation(); deleteCurriculum(${item.id}, '${item.unit_name}')" 
                class="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded transition opacity-0 group-hover:opacity-100"
                title="削除">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `
          unitSelect.appendChild(card)
        })
        
        startButton.disabled = false
      } else {
        unitSelect.innerHTML = '<option value="">該当する単元がありません</option>'
        startButton.disabled = true
      }
    } catch (error) {
      console.error('単元リスト読み込みエラー:', error)
    }
  }

  // selectモードの場合のみイベントリスナー追加
  if (unitSelect.tagName === 'SELECT') {
    unitSelect.addEventListener('change', () => {
      startButton.disabled = !unitSelect.value
    })
  }
}

// 単元を選択
function selectUnit(curriculumId) {
  state.selectedCurriculumId = curriculumId
  loadGuidePage(curriculumId)
}

// 単元を削除
// 単元を複製
async function duplicateCurriculum(curriculumId) {
  try {
    // カリキュラムデータを取得
    const response = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum } = response.data
    
    // 複製モーダルを表示
    const modal = document.createElement('div')
    modal.id = 'duplicateModal'
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-copy mr-2 text-green-600"></i>
          単元を複製
        </h2>
        
        <p class="text-gray-600 mb-6">
          「${curriculum.unit_name}」を複製します。<br>
          必要に応じて基本情報を変更してください。
        </p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">学年</label>
            <input type="text" id="dupGrade" value="${curriculum.grade}" 
                   class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">教科</label>
            <input type="text" id="dupSubject" value="${curriculum.subject}" 
                   class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">教科書会社</label>
            <input type="text" id="dupTextbook" value="${curriculum.textbook_company}" 
                   class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">単元名</label>
            <input type="text" id="dupUnitName" value="${curriculum.unit_name}（コピー）" 
                   class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
          </div>
        </div>
        
        <div class="flex gap-4 mt-8">
          <button onclick="executeDuplicate(${curriculumId})" 
                  class="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-3 px-6 rounded-lg font-bold transition shadow-lg">
            <i class="fas fa-check mr-2"></i>
            複製する
          </button>
          <button onclick="closeDuplicateModal()" 
                  class="bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-6 rounded-lg font-bold transition">
            <i class="fas fa-times mr-2"></i>
            キャンセル
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('複製モーダル表示エラー:', error)
    alert(`❌ エラーが発生しました: ${error.message}`)
  }
}

function closeDuplicateModal() {
  const modal = document.getElementById('duplicateModal')
  if (modal) {
    modal.remove()
  }
}

async function executeDuplicate(curriculumId) {
  try {
    const newGrade = document.getElementById('dupGrade').value
    const newSubject = document.getElementById('dupSubject').value
    const newTextbook = document.getElementById('dupTextbook').value
    const newUnitName = document.getElementById('dupUnitName').value
    
    if (!newGrade || !newSubject || !newTextbook || !newUnitName) {
      alert('すべての項目を入力してください')
      return
    }
    
    loadingManager.show('単元を複製中...')
    
    const response = await axios.post(`/api/curriculum/${curriculumId}/duplicate`, {
      newGrade,
      newSubject,
      newTextbook,
      newUnitName
    })
    
    loadingManager.hide()
    closeDuplicateModal()
    
    if (response.data.success) {
      alert(`✅ 単元「${newUnitName}」を複製しました！`)
      // 単元リストを更新
      updateUnitList()
    } else {
      throw new Error(response.data.error || '複製に失敗しました')
    }
  } catch (error) {
    loadingManager.hide()
    console.error('単元複製エラー:', error)
    alert(`❌ 単元の複製に失敗しました: ${error.message}`)
  }
}

async function deleteCurriculum(curriculumId, unitName) {
  const confirmed = confirm(`本当に「${unitName}」を削除しますか？\n\nこの操作は取り消せません。\n- 単元の基本情報\n- すべてのコース\n- すべてのカード\n- すべての問題\nが削除されます。`)
  
  if (!confirmed) {
    return
  }
  
  try {
    const response = await axios.delete(`/api/curriculum/${curriculumId}`)
    
    if (response.data.success) {
      alert(`✅ 「${unitName}」を削除しました`)
      // 単元リストを再読み込み
      updateUnitList()
    } else {
      throw new Error(response.data.error || '削除に失敗しました')
    }
  } catch (error) {
    console.error('削除エラー:', error)
    alert(`❌ 削除に失敗しました: ${error.response?.data?.error || error.message}`)
  }
}

// 単元を編集
async function editCurriculum(curriculumId) {
  try {
    // カリキュラムデータを取得
    const response = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum, courses } = response.data
    
    // 編集モーダルを表示
    showEditCurriculumModal(curriculum, courses)
    
  } catch (error) {
    console.error('編集データ取得エラー:', error)
    alert(`❌ データの取得に失敗しました: ${error.message}`)
  }
}

// 編集モーダルを表示
function showEditCurriculumModal(curriculum, courses) {
  const modal = document.createElement('div')
  modal.id = 'editCurriculumModal'
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto my-8">
      <!-- ヘッダー -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white sticky top-0 z-10">
        <div class="flex justify-between items-center">
          <h2 class="text-3xl font-bold">
            <i class="fas fa-edit mr-2"></i>
            単元編集
          </h2>
          <button onclick="closeEditModal()" class="text-white hover:text-gray-200">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <p class="text-sm mt-2 opacity-90">
          単元の基本情報とカード内容を編集できます
        </p>
      </div>

      <!-- フォーム -->
      <div class="p-8 space-y-8">
        <!-- 基本情報 -->
        <div class="bg-blue-50 rounded-lg p-6">
          <h3 class="text-xl font-bold text-blue-800 mb-4">
            <i class="fas fa-info-circle mr-2"></i>
            基本情報
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">学年</label>
              <input type="text" id="editGrade" value="${curriculum.grade}" 
                     class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">教科</label>
              <input type="text" id="editSubject" value="${curriculum.subject}" 
                     class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">教科書会社</label>
              <input type="text" id="editTextbook" value="${curriculum.textbook_company}" 
                     class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">単元名</label>
              <input type="text" id="editUnitName" value="${curriculum.unit_name}" 
                     class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">単元の目標</label>
              <textarea id="editUnitGoal" rows="3" 
                        class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">${curriculum.unit_goal}</textarea>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-2">非認知目標</label>
              <textarea id="editNonCognitiveGoal" rows="2" 
                        class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none">${curriculum.non_cognitive_goal}</textarea>
            </div>
          </div>
        </div>

        <!-- コースとカードの編集 -->
        ${courses.map((course, courseIndex) => `
          <div class="bg-${course.color_code}-50 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-bold text-${course.color_code}-800">
                <i class="fas fa-layer-group mr-2"></i>
                ${course.course_name} - ${course.course_label}
              </h3>
              <button onclick="saveCardOrder(${course.id}, ${courseIndex})" 
                      class="bg-${course.color_code}-500 hover:bg-${course.color_code}-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                <i class="fas fa-save mr-1"></i>
                並び順を保存
              </button>
            </div>
            
            <p class="text-sm text-${course.color_code}-600 mb-3">
              <i class="fas fa-hand-pointer mr-1"></i>
              ドラッグ&ドロップでカードの順序を変更できます
            </p>
            
            <div id="sortable-cards-${courseIndex}" class="space-y-4">
              ${(course.cards || []).map((card, cardIndex) => `
                <div class="bg-white rounded-lg p-4 border-2 border-${course.color_code}-200 cursor-move" data-card-id="${card.id}">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold text-gray-800">
                      <span class="bg-${course.color_code}-500 text-white px-3 py-1 rounded-full text-sm mr-2">
                        カード ${card.card_number}
                      </span>
                      <input type="text" 
                             id="card-title-${courseIndex}-${cardIndex}" 
                             value="${card.card_title || ''}" 
                             placeholder="カードタイトル"
                             class="inline-block p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none">
                    </h4>
                    <button onclick="toggleCardDetail(${courseIndex}, ${cardIndex})" 
                            class="text-${course.color_code}-600 hover:text-${course.color_code}-800">
                      <i class="fas fa-chevron-down" id="toggle-icon-${courseIndex}-${cardIndex}"></i>
                    </button>
                  </div>
                  
                  <div id="card-detail-${courseIndex}-${cardIndex}" class="hidden space-y-3">
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">問題説明</label>
                      <textarea id="card-problem-${courseIndex}-${cardIndex}" rows="2" 
                                class="w-full p-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none">${card.problem_description || ''}</textarea>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">例題</label>
                      <textarea id="card-example-${courseIndex}-${cardIndex}" rows="2" 
                                class="w-full p-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none">${card.example_problem || ''}</textarea>
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-gray-600 mb-1">解答（必須）</label>
                      <textarea id="card-answer-${courseIndex}-${cardIndex}" rows="2" 
                                class="w-full p-2 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none bg-yellow-50">${card.answer || ''}</textarea>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <!-- 保存ボタン -->
        <div class="flex gap-4">
          <button onclick="saveEditedCurriculum(${curriculum.id})" 
                  class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-8 rounded-lg font-bold text-xl transition shadow-xl">
            <i class="fas fa-save mr-2"></i>
            変更を保存
          </button>
          <button onclick="closeEditModal()" 
                  class="bg-gray-300 hover:bg-gray-400 text-gray-800 py-4 px-8 rounded-lg font-bold text-xl transition">
            <i class="fas fa-times mr-2"></i>
            キャンセル
          </button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // SortableJSでドラッグ&ドロップを有効化
  courses.forEach((course, courseIndex) => {
    const sortableEl = document.getElementById(`sortable-cards-${courseIndex}`)
    if (sortableEl && typeof Sortable !== 'undefined') {
      new Sortable(sortableEl, {
        animation: 150,
        handle: '.cursor-move',
        ghostClass: 'bg-blue-100',
        chosenClass: 'bg-blue-200',
        dragClass: 'opacity-50',
        onEnd: function (evt) {
          console.log(`カードを移動: ${evt.oldIndex} → ${evt.newIndex}`)
        }
      })
    }
  })
  
  // コースとカードデータを保存（保存時に使用）
  window.editingCourses = courses
}

// カード詳細の開閉
function toggleCardDetail(courseIndex, cardIndex) {
  const detail = document.getElementById(`card-detail-${courseIndex}-${cardIndex}`)
  const icon = document.getElementById(`toggle-icon-${courseIndex}-${cardIndex}`)
  
  if (detail.classList.contains('hidden')) {
    detail.classList.remove('hidden')
    icon.classList.remove('fa-chevron-down')
    icon.classList.add('fa-chevron-up')
  } else {
    detail.classList.add('hidden')
    icon.classList.remove('fa-chevron-up')
    icon.classList.add('fa-chevron-down')
  }
}

// 編集モーダルを閉じる
function closeEditModal() {
  const modal = document.getElementById('editCurriculumModal')
  if (modal) {
    modal.remove()
  }
  window.editingCourses = null
}

// 編集内容を保存
async function saveEditedCurriculum(curriculumId) {
  try {
    // 基本情報を取得
    const basicInfo = {
      grade: document.getElementById('editGrade').value,
      subject: document.getElementById('editSubject').value,
      textbook_company: document.getElementById('editTextbook').value,
      unit_name: document.getElementById('editUnitName').value,
      unit_goal: document.getElementById('editUnitGoal').value,
      non_cognitive_goal: document.getElementById('editNonCognitiveGoal').value
    }
    
    // 各カードの変更を収集
    const coursesData = window.editingCourses.map((course, courseIndex) => ({
      id: course.id,
      cards: (course.cards || []).map((card, cardIndex) => ({
        id: card.id,
        card_title: document.getElementById(`card-title-${courseIndex}-${cardIndex}`)?.value || card.card_title,
        problem_description: document.getElementById(`card-problem-${courseIndex}-${cardIndex}`)?.value || card.problem_description,
        example_problem: document.getElementById(`card-example-${courseIndex}-${cardIndex}`)?.value || card.example_problem,
        answer: document.getElementById(`card-answer-${courseIndex}-${cardIndex}`)?.value || card.answer
      }))
    }))
    
    // APIに送信
    const response = await axios.put(`/api/curriculum/${curriculumId}`, {
      basicInfo,
      courses: coursesData
    })
    
    if (response.data.success) {
      alert('✅ 変更を保存しました！')
      closeEditModal()
      // ページを再読み込み
      loadGuidePage(curriculumId)
    } else {
      throw new Error(response.data.error || '保存に失敗しました')
    }
    
  } catch (error) {
    console.error('保存エラー:', error)
    alert(`❌ 保存に失敗しました: ${error.response?.data?.error || error.message}`)
  }
}

// ============================================
// 学習のてびきページ
// ============================================
async function loadGuidePage(curriculumId) {
  state.currentView = 'guide'
  loadingManager.show('学習のてびきを読み込み中...')
  
  try {
    const response = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum, courses } = response.data
    
    //コース選択問題と共通チェックテストをメタデータから取得
    let courseSelectionProblems = []
    let commonCheckTest = null
    try {
      const metaResponse = await axios.get(`/api/curriculum/${curriculumId}/metadata`)
      courseSelectionProblems = metaResponse.data.course_selection_problems || []
      commonCheckTest = metaResponse.data.common_check_test || null
      console.log('✅ メタデータ取得:', {
        courseSelectionCount: courseSelectionProblems.length,
        hasCheckTest: !!commonCheckTest
      })
    } catch (metaError) {
      console.log('⚠️ メタデータなし、デフォルト表示')
    }
    
    // 選択問題を取得
    let optionalProblems = []
    try {
      const optionalResponse = await axios.get(`/api/curriculum/${curriculumId}/optional-problems`)
      optionalProblems = optionalResponse.data.optional_problems || []
      console.log('✅ 選択問題取得:', optionalProblems.length, '件')
    } catch (optionalError) {
      console.log('⚠️ 選択問題なし')
    }
    
    // 導入問題の自動追補チェック
    const missingIntroProblems = courses.filter(c => !c.introduction_problem)
    if (missingIntroProblems.length > 0) {
      console.warn(`⚠️ 導入問題が${missingIntroProblems.length}件欠落しています。自動生成を開始します...`)
      try {
        // 導入問題を自動生成
        console.log(`🔄 導入問題自動生成開始: curriculum_id=${curriculumId}`)
        const introResponse = await axios.post(`/api/curriculum/${curriculumId}/generate-intro-problems`)
        console.log('✅ 導入問題の自動追補完了:', introResponse.data)
        
        // データを再取得
        const reloadResponse = await axios.get(`/api/curriculum/${curriculumId}`)
        courses.splice(0, courses.length, ...reloadResponse.data.courses)
        console.log('✅ データ再取得完了。導入問題数:', courses.filter(c => c.introduction_problem).length)
      } catch (autoGenError) {
        console.error('❌ 導入問題の自動生成に失敗:', autoGenError)
        console.error('エラー詳細:', autoGenError.response?.data || autoGenError.message)
        
        // エラーをユーザーに通知（オプション）
        if (autoGenError.response?.data?.error) {
          console.error('サーバーエラーメッセージ:', autoGenError.response.data.error)
        }
      }
    }
    
    // データの完全性を確認
    const hasAllData = courseSelectionProblems.length === 3 && 
                       optionalProblems.length === 6 &&
                       commonCheckTest && 
                       commonCheckTest.sample_problems?.length === 6 &&
                       courses.filter(c => c.introduction_problem).length === 3
    
    if (!hasAllData) {
      const dataStatus = {
        'コース選択問題': `${courseSelectionProblems.length}/3`,
        '導入問題': `${courses.filter(c => c.introduction_problem).length}/3`,
        'チェックテスト': `${commonCheckTest?.sample_problems?.length || 0}/6`,
        '選択問題': `${optionalProblems.length}/6`
      }
      
      console.warn('⚠️ データが不完全です:', dataStatus)
      
      // 学習カードは必ず存在するはずなので、追加問題のみチェック
      const totalProblems = courseSelectionProblems.length + 
                           (commonCheckTest?.sample_problems?.length || 0) +
                           optionalProblems.length +
                           courses.filter(c => c.introduction_problem).length
      
      const expectedProblems = 3 + 6 + 6 + 3 // 18
      
      if (totalProblems < expectedProblems) {
        console.warn(`📊 追加問題: ${totalProblems}/${expectedProblems}件`)
        console.info('💡 不足している問題は、ページを再読み込みすると自動補完される場合があります')
      }
    } else {
      console.log('✅ すべてのデータが揃っています')
    }
    
    state.selectedCurriculum = curriculum
    state.courses = courses

    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div class="container mx-auto px-4 max-w-5xl">
          
          <!-- 戻るボタンとアクションボタン -->
          <div class="flex justify-between items-center mb-4 print:hidden">
            <button onclick="renderTopPage()" class="text-indigo-600 hover:text-indigo-800 flex items-center text-lg font-semibold transition">
              <i class="fas fa-arrow-left mr-2"></i>トップページにもどる
            </button>
            <div class="flex gap-2">
              <button onclick="printGuide()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg">
                <i class="fas fa-print mr-2"></i>印刷
              </button>
              <button onclick="downloadGuidePDF(${curriculumId})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg">
                <i class="fas fa-file-pdf mr-2"></i>PDF出力
              </button>
              <button onclick="editCurriculum(${curriculumId})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg">
                <i class="fas fa-edit mr-2"></i>編集
              </button>
              <button onclick="loadTeacherOverview(${curriculumId})" class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-lg">
                <i class="fas fa-chalkboard-teacher mr-2"></i>教師用
              </button>
            </div>
          </div>

          <!-- 学習のてびき1枚完結版 -->
          <div class="bg-white rounded-2xl shadow-2xl p-8 print:shadow-none">
            
            <!-- タイトルセクション -->
            <div class="text-center mb-6 border-b-4 border-indigo-600 pb-6">
              <h1 class="text-4xl font-bold text-indigo-700 mb-3">学習のてびき</h1>
              <div class="grid grid-cols-3 gap-4 text-sm mb-4">
                <div class="text-left">
                  <span class="font-bold">学年：</span>${curriculum.grade}年
                </div>
                <div class="text-center">
                  <span class="font-bold">組：</span>____ 組
                </div>
                <div class="text-right">
                  <span class="font-bold">名前：</span>____________________
                </div>
              </div>
              <h2 class="text-3xl font-bold text-gray-800">${curriculum.unit_name}</h2>
            </div>

            <!-- 単元の目標 -->
            <div class="mb-6">
              <div class="bg-blue-100 border-l-4 border-blue-600 p-4 rounded-r-lg mb-3">
                <h3 class="text-xl font-bold text-blue-800 mb-2 flex items-center">
                  <i class="fas fa-bullseye mr-2"></i>たんげんのもくひょう
                </h3>
                <p class="text-gray-800 leading-relaxed">${curriculum.unit_goal}</p>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-green-100 border-l-4 border-green-600 p-3 rounded-r-lg">
                  <h4 class="text-sm font-bold text-green-800 mb-1">
                    <i class="fas fa-heart mr-1"></i>こころのせいちょう
                  </h4>
                  <p class="text-sm text-gray-700">${curriculum.non_cognitive_goal}</p>
                </div>
                <div class="bg-purple-100 border-l-4 border-purple-600 p-3 rounded-r-lg">
                  <h4 class="text-sm font-bold text-purple-800 mb-1">
                    <i class="fas fa-clock mr-1"></i>じゅぎょうじかん
                  </h4>
                  <p class="text-2xl font-bold text-purple-700">ぜんぶで ${curriculum.total_hours} じかん</p>
                </div>
              </div>
            </div>

            <!-- コース選択問題（統合版：導入問題含む） -->
            <div class="mb-6">
              <h3 class="text-2xl font-bold text-center text-gray-800 mb-4 pb-2 border-b-2 border-gray-300">
                <i class="fas fa-route mr-2 text-indigo-600"></i>
                コースをえらぼう！（3つのコースから1つえらんでね）
              </h3>
              <p class="text-center text-gray-600 mb-4 text-sm">
                それぞれのコースの とくちょうが わかる もんだいを しょうかいするよ！
              </p>
              <div class="grid grid-cols-3 gap-4">
                ${courses.map((course, index) => {
                  const problem = courseSelectionProblems[index] || {
                    problem_title: `${course.course_name}の問題`,
                    problem_content: course.description
                  }
                  if (index === 0) {
                    console.log('📋 コース選択問題データ:', {
                      total: courseSelectionProblems.length,
                      problem0: courseSelectionProblems[0],
                      problem1: courseSelectionProblems[1],
                      problem2: courseSelectionProblems[2]
                    })
                  }
                  const colorClasses = index === 0 ? 'border-green-500 bg-gradient-to-br from-green-50 to-white' :
                                     index === 1 ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white' :
                                     'border-purple-500 bg-gradient-to-br from-purple-50 to-white'
                  const badgeClasses = index === 0 ? 'bg-green-500' :
                                      index === 1 ? 'bg-blue-500' :
                                      'bg-purple-500'
                  const iconClasses = index === 0 ? 'text-green-600' :
                                     index === 1 ? 'text-blue-600' :
                                     'text-purple-600'
                  return `
                    <div class="border-4 ${colorClasses} rounded-xl p-5 hover:shadow-2xl transition cursor-pointer" 
                         onclick="selectCourse(${course.id})">
                      <div class="text-center mb-4">
                        <div class="inline-block px-4 py-1 ${badgeClasses} text-white rounded-full font-bold mb-2">
                          ${index + 1}
                        </div>
                        <h4 class="text-xl font-bold text-gray-800">${course.course_name}</h4>
                        <p class="text-sm text-gray-600 font-medium">${course.course_label || course.description}</p>
                      </div>
                      
                      <!-- コース選択問題 -->
                      <div class="bg-white rounded-lg p-3 mb-3 border-2 ${index === 0 ? 'border-green-200' : index === 1 ? 'border-blue-200' : 'border-purple-200'}">
                        <p class="text-sm font-bold text-gray-800 mb-1">✨ ${problem.problem_title}</p>
                        <p class="text-xs text-gray-700 leading-relaxed">${problem.problem_content || problem.problem_description}</p>
                      </div>
                      
                      <!-- 導入問題 -->
                      ${course.introduction_problem ? `
                        <div class="bg-white rounded-lg p-3 border-2 ${index === 0 ? 'border-green-300' : index === 1 ? 'border-blue-300' : 'border-purple-300'} mb-3 group relative">
                          <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center flex-1">
                              <i class="fas fa-star ${iconClasses} mr-2"></i>
                              <p class="text-sm font-bold text-gray-800">${course.introduction_problem.problem_title}</p>
                            </div>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition print:hidden">
                              <button onclick="editIntroductionProblem(${course.id}, ${index})" 
                                      class="text-blue-600 hover:text-blue-800 px-2 py-1 text-xs"
                                      title="編集">
                                <i class="fas fa-edit"></i>
                              </button>
                              <button onclick="deleteIntroductionProblem(${course.id})" 
                                      class="text-red-600 hover:text-red-800 px-2 py-1 text-xs"
                                      title="削除">
                                <i class="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                          <div class="bg-gray-50 rounded p-2 mb-2 border-l-4 ${index === 0 ? 'border-green-500' : index === 1 ? 'border-blue-500' : 'border-purple-500'}">
                            <p class="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">${course.introduction_problem.problem_content}</p>
                          </div>
                          ${course.introduction_problem.answer ? `
                            <div class="bg-yellow-50 rounded p-2 border-l-4 border-yellow-400">
                              <p class="text-xs font-bold text-yellow-700 mb-1">
                                <i class="fas fa-lightbulb mr-1"></i>こたえのヒント
                              </p>
                              <p class="text-xs text-gray-700">${course.introduction_problem.answer}</p>
                            </div>
                          ` : ''}
                        </div>
                      ` : `
                        <div class="bg-gray-100 rounded-lg p-3 border-2 border-dashed border-gray-300 mb-3 text-center">
                          <p class="text-xs text-gray-500 mb-2">導入問題がまだありません</p>
                          <button onclick="addIntroductionProblem(${course.id}, ${index})" 
                                  class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition">
                            <i class="fas fa-plus mr-1"></i>導入問題を追加
                          </button>
                        </div>
                      `}
                      
                      <button class="w-full mt-2 py-2 ${badgeClasses} text-white rounded-lg font-bold text-sm hover:opacity-90 shadow-md">
                        このコースで学しゅうする
                      </button>
                    </div>
                  `
                }).join('')}
              </div>
            </div>

            <!-- チェックテスト（全コース共通） -->
            <div class="mb-6">
              <h3 class="text-2xl font-bold text-center text-gray-800 mb-4 pb-2 border-b-2 border-gray-300">
                <i class="fas fa-check-circle mr-2 text-yellow-600"></i>
                チェックテスト（学しゅうカードがおわったら、ちょうせんしよう！）
              </h3>
              <div class="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
                <p class="text-center text-gray-700 mb-3 font-bold">
                  ⭐ どのコースも共通の基礎基本チェックテスト ⭐<br>
                  学しゅうカードをぜんぶおわらせたら、チェックテストにちょうせんできます。<br>
                  ごうかくすると、下の「えらべるもんだい」にすすめるよ！ 🎉
                </p>
                ${commonCheckTest && commonCheckTest.sample_problems && commonCheckTest.sample_problems.length > 0 ? `
                  <div class="bg-white rounded-xl p-4 mb-3">
                    <h4 class="font-bold text-gray-800 text-center mb-3">
                      📝 ${commonCheckTest.test_description || 'チェックテスト'}
                    </h4>
                    <p class="text-sm text-gray-600 text-center mb-4">
                      ${commonCheckTest.test_note || '基礎基本を確認する問題です'}
                    </p>
                    <div class="space-y-3">
                      ${commonCheckTest.sample_problems.map((problem, index) => `
                        <div class="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-white rounded-lg p-3 group relative">
                          <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                              ${problem.problem_number}
                            </div>
                            <div class="flex-1">
                              <p class="text-sm text-gray-800 mb-2">${problem.problem_text}</p>
                              <div class="bg-yellow-100 rounded px-3 py-1 text-xs text-gray-600">
                                💡 こたえ: ${problem.answer}
                              </div>
                            </div>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition print:hidden">
                              <button onclick="editCheckTestProblem(${curriculum.id}, ${problem.problem_number})" 
                                      class="text-blue-600 hover:text-blue-800 px-2 py-1 text-xs"
                                      title="編集">
                                <i class="fas fa-edit"></i>
                              </button>
                              <button onclick="deleteCheckTestProblem(${curriculum.id}, ${problem.problem_number})" 
                                      class="text-red-600 hover:text-red-800 px-2 py-1 text-xs"
                                      title="削除">
                                <i class="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                    <div class="mt-4 text-center print:hidden">
                      <button onclick="addCheckTestProblem(${curriculum.id})" 
                              class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                        <i class="fas fa-plus mr-2"></i>問題を追加
                      </button>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- 選択問題（2列×3行 = 6題） -->
            <div class="mb-6">
              <h3 class="text-2xl font-bold text-center text-gray-800 mb-4 pb-2 border-b-2 border-gray-300">
                <i class="fas fa-star mr-2 text-pink-600"></i>
                えらべるもんだい（チェックテストごうかく後、やりたいもんだいをえらぼう！）
              </h3>
              <p class="text-center text-gray-600 mb-4 text-sm">
                <i class="fas fa-heart mr-2 text-pink-500"></i>
                6つの はってん もんだいから、じぶんが やってみたい もんだいを えらべるよ！<br>
                どんな ちからが つくのか、かくにんして ちょうせんしよう！
              </p>
              <div class="grid grid-cols-2 gap-4">
                ${optionalProblems.map((problem, index) => `
                  <div class="border-2 border-pink-200 bg-gradient-to-br from-white to-pink-50 rounded-xl p-4 hover:shadow-lg transition">
                    <div class="flex items-start mb-2">
                      <div class="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">
                        ${problem.problem_number}
                      </div>
                      <h4 class="text-base font-bold text-gray-800 flex-1">${problem.problem_title}</h4>
                    </div>
                    <p class="text-sm text-gray-700 mb-2 leading-relaxed">${problem.problem_description}</p>
                    
                    ${problem.learning_meaning ? `
                      <div class="bg-yellow-100 border-l-4 border-yellow-500 rounded-r-lg p-2 mb-2">
                        <p class="text-xs font-semibold text-gray-800 mb-1">
                          <i class="fas fa-lightbulb mr-1 text-yellow-600"></i>この もんだいで なにが できるようになる？
                        </p>
                        <p class="text-xs text-gray-700">${problem.learning_meaning}</p>
                      </div>
                    ` : ''}

                    <div class="flex items-center justify-between text-xs">
                      <span class="px-2 py-1 rounded-full ${
                        problem.difficulty_level === 'medium' ? 'bg-blue-100 text-blue-700' :
                        problem.difficulty_level === 'hard' ? 'bg-orange-100 text-orange-700' :
                        problem.difficulty_level === 'very_hard' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }">
                        ${problem.difficulty_level === 'medium' ? '★★ ふつう' :
                          problem.difficulty_level === 'hard' ? '★★★ むずかしい' :
                          problem.difficulty_level === 'very_hard' ? '★★★★ とてもむずかしい' :
                          '★ かんたん'}
                      </span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 印刷・ツールボタン -->
            <div class="border-t-2 border-gray-300 pt-6 print:hidden">
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onclick="loadLearningPlanPage(${curriculum.id})" 
                        class="bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 px-4 rounded-xl font-bold hover:from-green-600 hover:to-teal-700 transition shadow-lg flex items-center justify-center">
                  <i class="fas fa-calendar-alt mr-2"></i>
                  学習計画表を作る
                </button>
                <button onclick="showIntegratedPrintPreview(${curriculum.id})" 
                        class="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition shadow-lg flex items-center justify-center">
                  <i class="fas fa-print mr-2"></i>
                  いんさつする（全部）
                </button>
                <button onclick="generateQRCode(${curriculum.id})" 
                        class="bg-gradient-to-r from-orange-500 to-red-600 text-white py-3 px-4 rounded-xl font-bold hover:from-orange-600 hover:to-red-700 transition shadow-lg flex items-center justify-center">
                  <i class="fas fa-qrcode mr-2"></i>
                  QRコード生成
                </button>
                <button onclick="loadAnswersTab(${curriculum.id})" 
                        class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition shadow-lg flex items-center justify-center">
                  <i class="fas fa-book-open mr-2"></i>
                  こたえを見る
                </button>
                <button onclick="loadHistoryTab(${curriculum.id})" 
                        class="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition shadow-lg flex items-center justify-center">
                  <i class="fas fa-history mr-2"></i>
                  編集履歴
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `
    
    loadingManager.hide()
  } catch (error) {
    console.error('学習のてびき読み込みエラー:', error)
    loadingManager.hide()
    alert('データの読み込みに失敗しました')
  }
}

// 学習計画表ページ
async function loadLearningPlanPage(curriculumId) {
  state.currentView = 'learning_plan'
  
  try {
    const response = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum, courses } = response.data
    
    // 既存の学習計画を取得
    let existingPlans = []
    try {
      const planResponse = await axios.get(`/api/learning-plan/${state.student.id}/${curriculumId}`)
      existingPlans = planResponse.data.plans || []
    } catch (error) {
      console.log('既存の計画なし、新規作成')
    }
    
    state.selectedCurriculum = curriculum
    state.courses = courses
    
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
        <div class="container mx-auto px-4 max-w-6xl">
          
          <button onclick="loadGuidePage(${curriculumId})" 
                  class="mb-4 text-green-600 hover:text-green-800 flex items-center text-lg font-semibold transition">
            <i class="fas fa-arrow-left mr-2"></i>学習のてびきにもどる
          </button>

          <div class="bg-white rounded-2xl shadow-2xl p-8">
            
            <div class="text-center mb-6 border-b-4 border-green-600 pb-6">
              <h1 class="text-4xl font-bold text-green-700 mb-3">
                <i class="fas fa-calendar-alt mr-3"></i>学習計画表
              </h1>
              <h2 class="text-2xl font-bold text-gray-800">${curriculum.unit_name}</h2>
              <div class="grid grid-cols-3 gap-4 text-sm mt-4">
                <div class="text-left">
                  <span class="font-bold">学年：</span>${curriculum.grade}年
                </div>
                <div class="text-center">
                  <span class="font-bold">組：</span>____ 組
                </div>
                <div class="text-right">
                  <span class="font-bold">名前：</span>${state.student.name}
                </div>
              </div>
            </div>

            <div class="bg-gradient-to-r from-green-100 to-blue-100 rounded-xl p-6 mb-6">
              <h3 class="text-xl font-bold text-green-800 mb-3 flex items-center">
                <i class="fas fa-target mr-2"></i>単元の学習目標
              </h3>
              <p class="text-gray-800 leading-relaxed">${curriculum.unit_goal}</p>
            </div>

            <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-6">
              <h3 class="text-xl font-bold text-purple-800 mb-3 flex items-center">
                <i class="fas fa-heart mr-2"></i>こころの成長目標
              </h3>
              <p class="text-gray-800 leading-relaxed">${curriculum.non_cognitive_goal}</p>
            </div>

            <div class="grid grid-cols-2 gap-6 mb-6">
              <div class="bg-blue-50 rounded-xl p-4">
                <label class="block text-sm font-bold text-blue-800 mb-2">
                  <i class="fas fa-clock mr-2"></i>ぜんぶの学習時間
                </label>
                <div class="flex items-center gap-2">
                  <input type="number" 
                         id="totalHours" 
                         value="${curriculum.total_hours}" 
                         min="3" 
                         max="30" 
                         class="w-24 px-3 py-2 border-2 border-blue-300 rounded-lg font-bold text-xl text-center"
                         onchange="updatePlanHours()">
                  <span class="text-lg font-bold text-blue-700">じかん</span>
                </div>
                <p class="text-xs text-gray-600 mt-2">
                  ※ 1時間目（オリエンテーション）と最後の時間（まとめ）は固定です。<br>
                  自由に計画できるのは<strong id="planHours">${curriculum.total_hours - 2}</strong>時間です。
                </p>
              </div>
              
              <div class="bg-orange-50 rounded-xl p-4">
                <label class="block text-sm font-bold text-orange-800 mb-2">
                  <i class="fas fa-book mr-2"></i>学習する教科
                </label>
                <select id="subjectSelect" 
                        class="w-full px-3 py-2 border-2 border-orange-300 rounded-lg font-bold text-lg"
                        onchange="toggleSubject2()">
                  <option value="1">1教科のみ</option>
                  <option value="2">2教科同時学習</option>
                </select>
              </div>
            </div>

            <div id="subject2Options" class="bg-yellow-50 rounded-xl p-4 mb-6 hidden">
              <h3 class="text-lg font-bold text-yellow-800 mb-3">
                <i class="fas fa-plus-circle mr-2"></i>2教科目を選ぶ
              </h3>
              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">教科</label>
                  <select id="subject2Name" class="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg">
                    <option>算数</option>
                    <option>国語</option>
                    <option>理科</option>
                    <option>社会</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">単元名</label>
                  <input type="text" id="subject2Unit" 
                         placeholder="たとえば：物語を読もう"
                         class="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg">
                </div>
                <div>
                  <label class="block text-sm font-bold text-gray-700 mb-2">時間数</label>
                  <input type="number" id="subject2Hours" value="8" min="1" max="20"
                         class="w-full px-3 py-2 border-2 border-yellow-300 rounded-lg">
                </div>
              </div>
            </div>

            <!-- 学習計画表の使い方説明 -->
            <div class="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
              <h3 class="text-lg font-bold text-blue-800 mb-2">
                <i class="fas fa-info-circle mr-2"></i>学習計画表の使い方
              </h3>
              <ul class="text-sm text-gray-700 space-y-1">
                <li>💡 <strong>学習内容欄</strong>には、その時間に学習するカード番号を書きましょう</li>
                <li>📝 例：「カード2と3」「カード4-6」など、1時間で複数のカードに取り組めます</li>
                <li>🎯 オリエンテーション（1時間目）とまとめ（最終時間）は固定です</li>
                <li>✏️ 計画は途中で修正できます。自分のペースで進めましょう</li>
              </ul>
            </div>

            <div class="overflow-x-auto mb-6">
              <table class="w-full border-collapse border-2 border-gray-300">
                <thead>
                  <tr class="bg-gradient-to-r from-green-200 to-blue-200">
                    <th class="border-2 border-gray-300 px-3 py-2 text-sm font-bold">時間目</th>
                    <th class="border-2 border-gray-300 px-3 py-2 text-sm font-bold">教科</th>
                    <th class="border-2 border-gray-300 px-3 py-2 text-sm font-bold">学習予定日</th>
                    <th class="border-2 border-gray-300 px-3 py-2 text-sm font-bold">学習内容</th>
                    <th class="border-2 border-gray-300 px-3 py-2 text-sm font-bold">よかったこと</th>
                    <th class="border-2 border-gray-300 px-3 py-2 text-sm font-bold">なおしたいこと</th>
                    <th class="border-2 border-gray-300 px-3 py-2 text-sm font-bold">わかったこと</th>
                    <th class="border-2 border-gray-300 px-3 py-2 text-sm font-bold">AIのアドバイス</th>
                  </tr>
                </thead>
                <tbody id="learningPlanTable">
                  ${generateLearningPlanRows(curriculum.total_hours, existingPlans, curriculum)}
                </tbody>
              </table>
            </div>

            <div class="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 mb-6">
              <h3 class="text-xl font-bold text-purple-800 mb-4 flex items-center">
                <i class="fas fa-comments mr-2"></i>単元ぜんたいの振り返り
              </h3>
              <div class="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-bold text-purple-700 mb-2">よかったこと</label>
                  <textarea id="unitReflectionGood" 
                            rows="3" 
                            class="w-full px-3 py-2 border-2 border-purple-300 rounded-lg resize-none"
                            placeholder="単元全体でよかったことを書こう"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-bold text-purple-700 mb-2">なおしたいこと</label>
                  <textarea id="unitReflectionBad" 
                            rows="3" 
                            class="w-full px-3 py-2 border-2 border-purple-300 rounded-lg resize-none"
                            placeholder="次の単元で改善したいことを書こう"></textarea>
                </div>
                <div>
                  <label class="block text-sm font-bold text-purple-700 mb-2">わかったこと</label>
                  <textarea id="unitReflectionLearned" 
                            rows="3" 
                            class="w-full px-3 py-2 border-2 border-purple-300 rounded-lg resize-none"
                            placeholder="新しく学んだこと・発見したことを書こう"></textarea>
                </div>
              </div>
              <button onclick="getUnitReflectionAI()" 
                      class="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-6 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition shadow-lg">
                <i class="fas fa-robot mr-2"></i>たんげんのふり返りAIアドバイスをもらう
              </button>
              <div id="unitAIFeedback" class="mt-4 hidden">
                <div class="bg-white rounded-lg p-4 border-2 border-purple-300">
                  <p class="text-sm font-bold text-purple-700 mb-2">
                    <i class="fas fa-sparkles mr-2"></i>AIからのメッセージ
                  </p>
                  <p id="unitAIFeedbackText" class="text-gray-800"></p>
                </div>
              </div>
            </div>

            <div class="flex gap-4 justify-end">
              <button onclick="saveLearningPlan(${curriculumId})" 
                      class="bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-8 rounded-xl font-bold hover:from-green-600 hover:to-blue-700 transition shadow-lg">
                <i class="fas fa-save mr-2"></i>学習計画を保存する
              </button>
              <button onclick="showIntegratedPrintPreview(${curriculumId})" 
                      class="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-8 rounded-xl font-bold hover:from-purple-600 hover:to-pink-700 transition shadow-lg">
                <i class="fas fa-print mr-2"></i>いんさつする（計画表・てびき・ヒントカード）
              </button>
            </div>

          </div>
        </div>
      </div>
    `
  } catch (error) {
    console.error('学習計画表読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
  }
}

function generateLearningPlanRows(totalHours, existingPlans, curriculum) {
  let rows = ''
  const subject1Name = curriculum.subject || '算数'
  
  for (let i = 1; i <= totalHours; i++) {
    const existingPlan = existingPlans.find(p => p.hour_number === i)
    const isFixed = i === 1 || i === totalHours
    const bgClass = isFixed ? 'bg-gray-100' : 'bg-white'
    const content = i === 1 ? 'オリエンテーション（単元の目標とコースを決める）' 
                   : i === totalHours ? 'まとめ（単元のふり返りと発表）' 
                   : existingPlan?.learning_content || ''
    
    rows += `
      <tr class="${bgClass}">
        <td class="border-2 border-gray-300 px-3 py-2 text-center font-bold">${i}</td>
        <td class="border-2 border-gray-300 px-3 py-2 text-center">
          ${isFixed ? subject1Name : `
            <select class="subject-select w-full px-2 py-1 border border-gray-300 rounded text-sm" 
                    data-hour="${i}">
              <option value="${subject1Name}" selected>${subject1Name}</option>
            </select>
          `}
        </td>
        <td class="border-2 border-gray-300 px-3 py-2">
          <input type="date" 
                 class="planned-date w-full px-2 py-1 border border-gray-300 rounded text-sm"
                 data-hour="${i}"
                 value="${existingPlan?.planned_date || ''}"
                 ${isFixed ? 'readonly' : ''}>
        </td>
        <td class="border-2 border-gray-300 px-3 py-2">
          <input type="text" 
                 class="learning-content w-full px-2 py-1 border border-gray-300 rounded text-sm"
                 data-hour="${i}"
                 value="${content}"
                 placeholder="${isFixed ? '' : '例：カード2と3、カード4-6など'}"
                 ${isFixed ? 'readonly' : ''}>
        </td>
        <td class="border-2 border-gray-300 px-3 py-2">
          <textarea class="reflection-good w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none"
                    rows="2"
                    data-hour="${i}"
                    placeholder="よかったこと"
                    ${isFixed ? 'readonly' : ''}>${existingPlan?.reflection_good || ''}</textarea>
        </td>
        <td class="border-2 border-gray-300 px-3 py-2">
          <textarea class="reflection-bad w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none"
                    rows="2"
                    data-hour="${i}"
                    placeholder="なおしたいこと"
                    ${isFixed ? 'readonly' : ''}>${existingPlan?.reflection_bad || ''}</textarea>
        </td>
        <td class="border-2 border-gray-300 px-3 py-2">
          <textarea class="reflection-learned w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none"
                    rows="2"
                    data-hour="${i}"
                    placeholder="わかったこと"
                    ${isFixed ? 'readonly' : ''}>${existingPlan?.reflection_learned || ''}</textarea>
        </td>
        <td class="border-2 border-gray-300 px-3 py-2">
          ${isFixed ? '<span class="text-xs text-gray-400">-</span>' : `
            <button onclick="getReflectionAI(${i})" 
                    class="ai-feedback-btn w-full bg-blue-500 text-white py-1 px-2 rounded text-xs hover:bg-blue-600 transition">
              <i class="fas fa-robot mr-1"></i>AIアドバイス
            </button>
            <div id="aiFeedback${i}" class="mt-1 text-xs text-gray-700 hidden"></div>
          `}
        </td>
      </tr>
    `
  }
  
  return rows
}

function updatePlanHours() {
  const totalHours = parseInt(document.getElementById('totalHours').value)
  const planHours = totalHours - 2
  document.getElementById('planHours').textContent = planHours
}

function toggleSubject2() {
  const select = document.getElementById('subjectSelect')
  const subject2Options = document.getElementById('subject2Options')
  
  if (select.value === '2') {
    subject2Options.classList.remove('hidden')
    const subjectSelects = document.querySelectorAll('.subject-select')
    const subject2Name = document.getElementById('subject2Name').value
    subjectSelects.forEach(select => {
      if (select.options.length === 1) {
        const option = document.createElement('option')
        option.value = subject2Name
        option.textContent = subject2Name
        select.appendChild(option)
      }
    })
  } else {
    subject2Options.classList.add('hidden')
    const subjectSelects = document.querySelectorAll('.subject-select')
    subjectSelects.forEach(select => {
      if (select.options.length > 1) {
        select.remove(1)
      }
    })
  }
}

async function getReflectionAI(hourNumber) {
  const good = document.querySelector(`.reflection-good[data-hour="${hourNumber}"]`).value
  const bad = document.querySelector(`.reflection-bad[data-hour="${hourNumber}"]`).value
  const learned = document.querySelector(`.reflection-learned[data-hour="${hourNumber}"]`).value
  
  if (!good && !bad && !learned) {
    alert('振り返りを書いてからAIアドバイスをもらおう！')
    return
  }
  
  const feedbackDiv = document.getElementById(`aiFeedback${hourNumber}`)
  feedbackDiv.textContent = 'AIが考えています...'
  feedbackDiv.classList.remove('hidden')
  
  try {
    const response = await axios.post('/api/ai/reflect', {
      reflections: { good, bad, learned },
      type: 'hourly'
    })
    
    feedbackDiv.textContent = response.data.feedback || '応援しています！次もがんばろう！'
    feedbackDiv.className = 'mt-1 text-xs text-blue-700 bg-blue-50 p-2 rounded'
  } catch (error) {
    console.error('AIアドバイス取得エラー:', error)
    feedbackDiv.textContent = '素晴らしい振り返りだね！この調子で頑張ろう！'
    feedbackDiv.className = 'mt-1 text-xs text-green-700 bg-green-50 p-2 rounded'
  }
}

async function getUnitReflectionAI() {
  const good = document.getElementById('unitReflectionGood').value
  const bad = document.getElementById('unitReflectionBad').value
  const learned = document.getElementById('unitReflectionLearned').value
  
  if (!good && !bad && !learned) {
    alert('単元全体の振り返りを書いてからAIアドバイスをもらおう！')
    return
  }
  
  const feedbackDiv = document.getElementById('unitAIFeedback')
  const feedbackText = document.getElementById('unitAIFeedbackText')
  feedbackText.textContent = 'AIが考えています...'
  feedbackDiv.classList.remove('hidden')
  
  try {
    const response = await axios.post('/api/ai/reflect', {
      reflections: { good, bad, learned },
      type: 'unit'
    })
    
    feedbackText.textContent = response.data.feedback || '単元をしっかり学習できましたね！次の単元も楽しみです！'
  } catch (error) {
    console.error('単元AIアドバイス取得エラー:', error)
    feedbackText.textContent = '単元全体の振り返りができました！この経験を次に活かしましょう！'
  }
}

async function saveLearningPlan(curriculumId) {
  const totalHours = parseInt(document.getElementById('totalHours').value)
  const plans = []
  
  for (let i = 1; i <= totalHours; i++) {
    const subject = document.querySelector(`.subject-select[data-hour="${i}"]`)?.value 
                    || state.selectedCurriculum.subject
    const plannedDate = document.querySelector(`.planned-date[data-hour="${i}"]`).value
    const learningContent = document.querySelector(`.learning-content[data-hour="${i}"]`).value
    const reflectionGood = document.querySelector(`.reflection-good[data-hour="${i}"]`).value
    const reflectionBad = document.querySelector(`.reflection-bad[data-hour="${i}"]`).value
    const reflectionLearned = document.querySelector(`.reflection-learned[data-hour="${i}"]`).value
    
    plans.push({
      hour_number: i,
      subject: subject,
      planned_date: plannedDate,
      learning_content: learningContent,
      reflection_good: reflectionGood,
      reflection_bad: reflectionBad,
      reflection_learned: reflectionLearned
    })
  }
  
  const unitReflection = {
    good: document.getElementById('unitReflectionGood').value,
    bad: document.getElementById('unitReflectionBad').value,
    learned: document.getElementById('unitReflectionLearned').value
  }
  
  try {
    const response = await axios.post('/api/learning-plan/save', {
      student_id: state.student.id,
      curriculum_id: curriculumId,
      total_hours: totalHours,
      plans: plans,
      unit_reflection: unitReflection
    })
    
    if (response.data.success) {
      alert('✅ 学習計画を保存しました！')
    } else {
      alert('保存に失敗しました。もう一度試してください。')
    }
  } catch (error) {
    console.error('学習計画保存エラー:', error)
    alert('保存中にエラーが発生しました')
  }
}

// 統合印刷プレビュー（学習計画表・学習のてびき・ヒントカード）
async function showIntegratedPrintPreview(curriculumId) {
  try {
    const response = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum, courses } = response.data
    
    // メタデータ取得
    let courseSelectionProblems = []
    let commonCheckTest = null
    try {
      const metaResponse = await axios.get(`/api/curriculum/${curriculumId}/metadata`)
      courseSelectionProblems = metaResponse.data.course_selection_problems || []
      commonCheckTest = metaResponse.data.common_check_test || null
    } catch (error) {
      console.log('メタデータなし')
    }
    
    // ヒントカード取得
    const allHints = []
    for (const course of courses) {
      const cardsResponse = await axios.get(`/api/courses/${course.id}/cards`)
      for (const card of cardsResponse.data) {
        const cardDetailResponse = await axios.get(`/api/cards/${card.id}`)
        const hints = cardDetailResponse.data.hints || []
        if (hints.length > 0) {
          allHints.push({
            courseName: course.course_name,
            cardTitle: card.card_title,
            cardNumber: card.card_number,
            hints: hints
          })
        }
      }
    }
    
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="print-container">
        <!-- 印刷ボタン（印刷時は非表示） -->
        <div class="no-print mb-6 flex justify-between items-center px-4 py-4 bg-gray-100">
          <button onclick="loadLearningPlanPage(${curriculumId})" 
                  class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg">
            <i class="fas fa-arrow-left mr-2"></i>学習計画表にもどる
          </button>
          <button onclick="window.print()" 
                  class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
            <i class="fas fa-print mr-2"></i>印刷する
          </button>
        </div>

        <!-- 1. 学習のてびき -->
        <div class="print-page bg-white p-8 mb-8">
          <h1 class="text-3xl font-bold text-center mb-6 border-b-4 border-indigo-600 pb-4">学習のてびき</h1>
          <h2 class="text-2xl font-bold text-center mb-4">${curriculum.unit_name}</h2>
          <div class="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div><strong>学年：</strong>${curriculum.grade}年</div>
            <div><strong>組：</strong>____ 組</div>
            <div><strong>名前：</strong>____________________</div>
          </div>
          
          <div class="mb-6 p-4 bg-blue-50 rounded">
            <h3 class="font-bold text-blue-800 mb-2">📚 単元の目標</h3>
            <p class="text-sm">${curriculum.unit_goal}</p>
          </div>
          
          <div class="mb-6 p-4 bg-purple-50 rounded">
            <h3 class="font-bold text-purple-800 mb-2">💖 こころの成長目標</h3>
            <p class="text-sm">${curriculum.non_cognitive_goal}</p>
          </div>
          
          <div class="mb-6">
            <h3 class="font-bold text-lg mb-3 text-indigo-700">🎯 コースの選び方</h3>
            <p class="text-xs text-gray-600 mb-3">各コースの特徴と、どんな問題に取り組むかを確認しましょう</p>
            
            <div class="grid grid-cols-3 gap-4">
              ${courses.map((course, index) => {
                const colorClass = index === 0 ? 'green' : index === 1 ? 'blue' : 'purple';
                const problem = courseSelectionProblems[index];
                return `
                  <div class="border-2 border-${colorClass}-500 bg-${colorClass}-50 rounded p-3">
                    <div class="flex items-center mb-2">
                      <div class="w-6 h-6 rounded-full bg-${colorClass}-500 text-white flex items-center justify-center font-bold text-xs mr-2">
                        ${index + 1}
                      </div>
                      <h4 class="font-bold text-sm text-${colorClass}-800">${course.course_name}</h4>
                    </div>
                    <p class="text-xs text-gray-700 mb-2">${course.description}</p>
                    
                    ${problem ? `
                      <div class="bg-white rounded p-2 mb-2 border border-${colorClass}-200">
                        <p class="text-xs font-bold text-${colorClass}-700 mb-1">
                          <i class="fas fa-star mr-1"></i>${problem.problem_title}
                        </p>
                        <p class="text-xs text-gray-600">${problem.problem_description || problem.problem_content}</p>
                      </div>
                    ` : ''}
                    
                    ${course.introduction_problem ? `
                      <div class="bg-white rounded p-2 border border-${colorClass}-300">
                        <p class="text-xs font-bold text-${colorClass}-700 mb-1">
                          <i class="fas fa-lightbulb mr-1"></i>導入問題
                        </p>
                        <p class="text-xs font-bold mb-1">${course.introduction_problem.problem_title}</p>
                        <p class="text-xs text-gray-700 mb-1">${course.introduction_problem.problem_content}</p>
                        ${course.introduction_problem.answer ? `
                          <div class="bg-yellow-50 rounded px-2 py-1 text-xs mt-1">
                            <strong>💡 ヒント:</strong> ${course.introduction_problem.answer}
                          </div>
                        ` : ''}
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          
          <div class="mb-6">
            <h3 class="font-bold text-lg mb-3">📝 各コースの学習内容</h3>
            ${courses.map(course => `
              <div class="mb-4 p-3 bg-${course.color_code}-50 border-l-4 border-${course.color_code}-600 rounded">
                <h4 class="font-bold text-${course.color_code}-800 mb-2">${course.course_name}</h4>
                <p class="text-xs mb-3">${course.description}</p>
                
                ${course.introduction_problem ? `
                  <div class="bg-white rounded p-3 border-2 border-${course.color_code}-300 mt-2">
                    <p class="text-xs font-bold text-${course.color_code}-700 mb-1">
                      <i class="fas fa-star mr-1"></i>導入問題: ${course.introduction_problem.problem_title}
                    </p>
                    <p class="text-xs text-gray-700 whitespace-pre-wrap">${course.introduction_problem.problem_content}</p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="mb-6">
            <h3 class="font-bold text-lg mb-3 text-yellow-700">
              <i class="fas fa-check-circle mr-2"></i>チェックテスト（全コース共通）
            </h3>
            ${commonCheckTest && commonCheckTest.sample_problems && commonCheckTest.sample_problems.length > 0 ? `
              <div class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                <p class="text-xs font-bold text-center mb-2">${commonCheckTest.test_description}</p>
                <p class="text-xs text-center mb-3">${commonCheckTest.test_note}</p>
                <div class="space-y-2">
                  ${commonCheckTest.sample_problems.map(problem => `
                    <div class="border-2 border-yellow-200 bg-white rounded p-2">
                      <div class="flex items-start gap-2">
                        <div class="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          ${problem.problem_number}
                        </div>
                        <div class="flex-1">
                          <p class="text-xs mb-1">${problem.problem_text}</p>
                          <div class="bg-yellow-100 rounded px-2 py-1 text-xs">💡 ${problem.answer}</div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : '<p class="text-xs text-gray-500">チェックテストなし</p>'}
          </div>
        </div>

        <!-- 2. 学習計画表 -->
        <div class="print-page bg-white p-8 mb-8">
          <h1 class="text-3xl font-bold text-center mb-6 border-b-4 border-green-600 pb-4">学習計画表</h1>
          <h2 class="text-2xl font-bold text-center mb-4">${curriculum.unit_name}</h2>
          <div class="grid grid-cols-3 gap-4 mb-6 text-sm">
            <div><strong>学年：</strong>${curriculum.grade}年</div>
            <div><strong>組：</strong>____ 組</div>
            <div><strong>名前：</strong>____________________</div>
          </div>
          
          <div class="mb-4 p-4 bg-green-50 rounded">
            <h3 class="font-bold text-green-800 mb-2">📚 単元の目標</h3>
            <p class="text-sm">${curriculum.unit_goal}</p>
          </div>
          
          <div class="mb-4 p-4 bg-purple-50 rounded">
            <h3 class="font-bold text-purple-800 mb-2">💖 こころの成長目標</h3>
            <p class="text-sm">${curriculum.non_cognitive_goal}</p>
          </div>
          
          <div class="mb-4 text-sm">
            <strong>総時間数：</strong>${curriculum.total_hours}時間　
            <strong>計画可能時間：</strong>${curriculum.total_hours - 2}時間
          </div>
          
          <table class="w-full border-collapse border-2 border-gray-400 text-xs">
            <thead>
              <tr class="bg-gray-200">
                <th class="border border-gray-400 px-2 py-1">時間目</th>
                <th class="border border-gray-400 px-2 py-1">教科</th>
                <th class="border border-gray-400 px-2 py-1">予定日</th>
                <th class="border border-gray-400 px-2 py-1">学習内容</th>
                <th class="border border-gray-400 px-2 py-1">よかったこと</th>
                <th class="border border-gray-400 px-2 py-1">なおしたいこと</th>
                <th class="border border-gray-400 px-2 py-1">わかったこと</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({length: curriculum.total_hours}, (_, i) => i + 1).map(hour => {
                const isFixed = hour === 1 || hour === curriculum.total_hours
                const content = hour === 1 ? 'オリエンテーション' 
                              : hour === curriculum.total_hours ? 'まとめ' 
                              : ''
                return `
                  <tr class="${isFixed ? 'bg-gray-100' : ''}">
                    <td class="border border-gray-400 px-2 py-1 text-center font-bold">${hour}</td>
                    <td class="border border-gray-400 px-2 py-1">${curriculum.subject}</td>
                    <td class="border border-gray-400 px-2 py-1"></td>
                    <td class="border border-gray-400 px-2 py-1">${content}</td>
                    <td class="border border-gray-400 px-2 py-1"></td>
                    <td class="border border-gray-400 px-2 py-1"></td>
                    <td class="border border-gray-400 px-2 py-1"></td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
          
          <div class="mt-6 p-4 border-2 border-purple-300 rounded">
            <h3 class="font-bold text-purple-800 mb-3">単元全体のふり返り</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <p class="text-xs font-bold mb-1">よかったこと</p>
                <div class="border border-gray-300 rounded p-2 h-20"></div>
              </div>
              <div>
                <p class="text-xs font-bold mb-1">なおしたいこと</p>
                <div class="border border-gray-300 rounded p-2 h-20"></div>
              </div>
              <div>
                <p class="text-xs font-bold mb-1">わかったこと</p>
                <div class="border border-gray-300 rounded p-2 h-20"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. ヒントカード -->
        ${allHints.map(hintCard => `
          <div class="print-page bg-white p-6 mb-8">
            <div class="border-4 border-blue-400 rounded-lg p-4">
              <h2 class="text-xl font-bold text-blue-800 mb-2">${hintCard.courseName}</h2>
              <h3 class="text-lg font-bold text-gray-800 mb-4">
                カード${hintCard.cardNumber}：${hintCard.cardTitle}
              </h3>
              
              ${hintCard.hints.map((hint, idx) => `
                <div class="mb-4 p-3 bg-yellow-${50 * (idx + 1)} border-l-4 border-yellow-${400 + (idx * 100)} rounded">
                  <h4 class="font-bold text-yellow-800 mb-1">💡 ヒント${hint.hint_level}</h4>
                  <p class="text-sm">${hint.hint_text}</p>
                  ${hint.thinking_tool_suggestion ? `
                    <p class="text-xs text-gray-600 mt-2">🛠️ ${hint.thinking_tool_suggestion}</p>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      
      <style>
        @media print {
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    `
  } catch (error) {
    console.error('印刷プレビュー生成エラー:', error)
    alert('印刷プレビューの生成に失敗しました')
  }
}

function getCategoryLabel(category) {
  const labels = {
    'creative': '表現・クリエイティブ',
    'fieldwork': '調査・フィールドワーク',
    'critical': '多角的考察',
    'social': '社会貢献',
    'metacognitive': 'メタ認知',
    'other': 'その他'
  }
  return labels[category] || category
}

// ============================================
// コース選択
// ============================================
async function selectCourse(courseId) {
  try {
    const response = await axios.get(`/api/courses/${courseId}/cards`)
    const cards = response.data
    
    state.selectedCourse = courseId
    
    // 学習セッションを開始（初回のみ）
    if (!learningSession.sessionId) {
      await startLearningSession(state.selectedCurriculum?.id)
    }

    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <!-- ヘッダー -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button onclick="loadGuidePage(${state.selectedCurriculum.id})" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>学習のてびきに戻る
          </button>
          <h1 class="text-3xl font-bold text-indigo-600 mb-2">
            学習カード
          </h1>
          <p class="text-xl text-gray-800">
            ${state.selectedCurriculum.unit_name}
          </p>
        </div>

        <!-- 学習カード一覧 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${cards.map((card, index) => `
            <div class="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                 onclick="loadCardPage(${card.id})">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold text-gray-800">カード ${card.card_number}</h3>
                <div class="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  ${card.card_number}
                </div>
              </div>
              <h4 class="text-lg font-bold text-gray-700 mb-3">${card.card_title}</h4>
              <div class="flex items-center text-sm text-gray-500 mb-3">
                <i class="fas fa-signal mr-2"></i>
                <span>${card.difficulty_level === 'minimum' ? '基本' : card.difficulty_level === 'standard' ? '標準' : '発展'}</span>
              </div>
              ${card.real_world_context ? `
                <p class="text-xs text-gray-600 bg-gray-50 rounded p-2">
                  <i class="fas fa-lightbulb mr-1"></i>${card.real_world_context}
                </p>
              ` : ''}
              <button class="w-full mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-indigo-700 transition">
                学習する
              </button>
            </div>
          `).join('')}
        </div>

        <!-- 進捗ボードへのリンク -->
        <div class="mt-8 text-center">
          <button onclick="loadProgressBoard()" class="bg-green-600 text-white py-3 px-8 rounded-lg font-bold hover:bg-green-700 transition">
            <i class="fas fa-chart-bar mr-2"></i>
            みんなの進捗を見る
          </button>
        </div>
        
        <!-- クラス進捗確認ボタン（児童用）-->
        <div class="mt-4 text-center">
          <button onclick="showClassProgress()" class="bg-blue-500 hover:bg-blue-600 text-white py-3 px-8 rounded-lg font-bold transition">
            <i class="fas fa-users mr-2"></i>
            クラスのみんなの進捗を見る
          </button>
          <p class="text-sm text-gray-600 mt-2">
            できている友達に助けを求めることができます
          </p>
        </div>
      </div>
    `
  } catch (error) {
    console.error('コース読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
  }
}

// 教師用モードへ遷移
async function loadTeacherOverview(curriculumId) {
  try {
    // カリキュラムとコースデータを取得
    const response = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum, courses } = response.data
    
    // コース選択問題と共通チェックテストをメタデータから取得
    let courseSelectionProblems = []
    let commonCheckTest = null
    try {
      const metaResponse = await axios.get(`/api/curriculum/${curriculumId}/metadata`)
      courseSelectionProblems = metaResponse.data.course_selection_problems || []
      commonCheckTest = metaResponse.data.common_check_test || null
      console.log('✅ メタデータ取得 (教師用):', {
        courseSelectionCount: courseSelectionProblems.length,
        hasCheckTest: !!commonCheckTest
      })
    } catch (metaError) {
      console.warn('⚠️ メタデータ取得エラー:', metaError)
    }
    
    // 選択問題を取得
    const optionalProblemsResponse = await axios.get(`/api/curriculum/${curriculumId}/optional-problems`)
    const optionalProblems = optionalProblemsResponse.data.optional_problems || []
    
    // 教師用全体確認画面を表示
    showTeacherOverview({ 
      curriculum, 
      courses, 
      optional_problems: optionalProblems,
      course_selection_problems: courseSelectionProblems,
      common_check_test: commonCheckTest
    })
  } catch (error) {
    console.error('教師用モード読み込みエラー:', error)
    alert('教師用モードの読み込みに失敗しました。')
  }
}

// グローバルスコープに関数を登録
window.renderTopPage = renderTopPage
window.loadGuidePage = loadGuidePage
window.loadTeacherOverview = loadTeacherOverview
window.loadLearningPlanPage = loadLearningPlanPage
window.updatePlanHours = updatePlanHours
window.toggleSubject2 = toggleSubject2
window.getReflectionAI = getReflectionAI
window.getUnitReflectionAI = getUnitReflectionAI
window.saveLearningPlan = saveLearningPlan
window.showIntegratedPrintPreview = showIntegratedPrintPreview
window.selectCourse = selectCourse
window.loadCardPage = loadCardPage
window.loadProgressBoard = loadProgressBoard

// ============================================
// 学習カードページ
// ============================================
async function loadCardPage(cardId) {
  state.currentView = 'card'
  state.selectedCard = cardId
  
  try {
    const response = await axios.get(`/api/cards/${cardId}`)
    const { card, hints, answer } = response.data
    
    // カードデータをグローバルに保存（ヘルプ要請時に使用）
    window.currentCardData = card
    
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <!-- ヘッダー -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button onclick="selectCourse(${state.selectedCourse})" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>学習カード一覧に戻る
          </button>
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-indigo-600 mb-2">
                学習カード ${card.card_number}
              </h1>
              <h2 class="text-xl text-gray-800">${card.card_title}</h2>
            </div>
            <div class="flex items-center gap-3">
              <!-- ヘルプボタン4つ -->
              <button onclick="showAITeacher()" 
                      class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-bold transition shadow-lg flex flex-col items-center justify-center min-w-[100px]"
                      title="AI先生に質問">
                <i class="fas fa-robot text-xl mb-1"></i>
                <span class="text-xs">AI先生</span>
              </button>
              <button onclick="callTeacher()" 
                      class="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-bold transition shadow-lg flex flex-col items-center justify-center min-w-[100px]"
                      title="先生にヘルプを要求">
                <i class="fas fa-chalkboard-teacher text-xl mb-1"></i>
                <span class="text-xs">先生にヘルプ</span>
              </button>
              <button onclick="askFriend()" 
                      class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-bold transition shadow-lg flex flex-col items-center justify-center min-w-[100px]"
                      title="できている友達を確認">
                <i class="fas fa-user-friends text-xl mb-1"></i>
                <span class="text-xs">友達に聞く</span>
              </button>
              <button onclick="toggleHintPanel()" 
                      class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-bold transition shadow-lg flex flex-col items-center justify-center min-w-[100px]"
                      title="ヒントを見る">
                <i class="fas fa-lightbulb text-xl mb-1"></i>
                <span class="text-xs">ヒント</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 旧ヘルプメニューを削除し、ヒントは別途表示 -->
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- メインコンテンツ（左側・中央） -->
          <div class="lg:col-span-2 space-y-6">
            <!-- 新出語句・キーワード -->
            ${card.new_terms ? `
              <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
                <h3 class="text-lg font-bold text-blue-800 mb-3">
                  <i class="fas fa-book mr-2"></i>新しく学ぶこと
                </h3>
                <pre class="text-gray-800 whitespace-pre-wrap font-sans">${card.new_terms}</pre>
              </div>
            ` : ''}

            <!-- 例題 -->
            ${card.example_problem ? `
              <div class="bg-white rounded-lg shadow-lg p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-4">
                  <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>例題
                </h3>
                <div class="bg-yellow-50 rounded-lg p-4 mb-4">
                  <pre class="text-gray-800 whitespace-pre-wrap font-sans font-bold">${card.example_problem}</pre>
                </div>
                ${card.example_solution ? `
                  <div class="bg-green-50 rounded-lg p-4">
                    <h4 class="font-bold text-green-800 mb-2">
                      <i class="fas fa-check-circle mr-2"></i>解き方
                    </h4>
                    <pre class="text-gray-800 whitespace-pre-wrap font-sans">${card.example_solution}</pre>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            <!-- 問題 -->
            <div class="bg-white rounded-lg shadow-lg p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-pencil-alt mr-2 text-indigo-600"></i>問題
              </h3>
              ${card.real_world_context ? `
                <div class="bg-indigo-50 rounded-lg p-3 mb-4 flex items-start">
                  <i class="fas fa-globe mr-2 text-indigo-600 mt-1"></i>
                  <p class="text-sm text-indigo-800">${card.real_world_context}</p>
                </div>
              ` : ''}
              <div class="bg-gray-50 rounded-lg p-6">
                <pre class="text-gray-800 whitespace-pre-wrap font-sans text-lg leading-relaxed">${card.problem_content}</pre>
              </div>
              
              <!-- 回答欄 -->
              <div class="mt-6">
                <label class="block text-sm font-bold text-gray-700 mb-2">あなたの答えを書きましょう</label>
                <textarea id="answerInput" 
                          rows="6" 
                          class="w-full p-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                          placeholder="ここに答えを書いてください..."></textarea>
              </div>

              <!-- 分かった度 -->
              <div class="mt-6">
                <label class="block text-sm font-bold text-gray-700 mb-3">今の分かった度</label>
                <div class="flex justify-around">
                  <button onclick="setUnderstanding(1)" 
                          class="understanding-btn flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition"
                          data-level="1">
                    <span class="text-4xl">😢</span>
                    <span class="text-xs mt-2">わからない</span>
                  </button>
                  <button onclick="setUnderstanding(2)" 
                          class="understanding-btn flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition"
                          data-level="2">
                    <span class="text-4xl">😕</span>
                    <span class="text-xs mt-2">少し難しい</span>
                  </button>
                  <button onclick="setUnderstanding(3)" 
                          class="understanding-btn flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition"
                          data-level="3">
                    <span class="text-4xl">😊</span>
                    <span class="text-xs mt-2">だいたいOK</span>
                  </button>
                  <button onclick="setUnderstanding(4)" 
                          class="understanding-btn flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition"
                          data-level="4">
                    <span class="text-4xl">😄</span>
                    <span class="text-xs mt-2">よくわかる</span>
                  </button>
                  <button onclick="setUnderstanding(5)" 
                          class="understanding-btn flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 transition"
                          data-level="5">
                    <span class="text-4xl">🤩</span>
                    <span class="text-xs mt-2">完璧！</span>
                  </button>
                </div>
              </div>

              <!-- アクションボタン -->
              <div class="mt-6 flex gap-4">
                <button onclick="saveProgress()" 
                        class="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-indigo-700 transition">
                  <i class="fas fa-save mr-2"></i>
                  保存して次へ
                </button>
                <button onclick="showAnswer()" 
                        class="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-gray-600 transition">
                  <i class="fas fa-eye mr-2"></i>
                  解答を見る
                </button>
              </div>
            </div>

            <!-- 解答表示エリア（非表示） -->
            ${(answer || card.answer || card.example_solution) ? `
              <div id="answerSection" class="hidden bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
                <h3 class="text-lg font-bold text-green-800 mb-4">
                  <i class="fas fa-check-circle mr-2"></i>解答
                </h3>
                <div class="bg-white rounded-lg p-4 mb-4">
                  <div class="text-gray-800 whitespace-pre-wrap font-sans" style="line-height: 1.8;">${(answer?.answer_content || card.answer || card.example_solution || '解答は準備中です').replace(/\n/g, '<br>')}</div>
                </div>
                <div class="bg-blue-50 rounded-lg p-4">
                  <h4 class="font-bold text-blue-800 mb-2">
                    <i class="fas fa-info-circle mr-2"></i>解説
                  </h4>
                  <div class="text-gray-700 whitespace-pre-wrap font-sans" style="line-height: 1.8;">${(answer?.explanation || card.real_world_connection || '解説は準備中です').replace(/\n/g, '<br>')}</div>
                </div>
              </div>
            ` : `
              <div id="answerSection" class="hidden bg-gray-50 border-l-4 border-gray-300 rounded-lg p-6">
                <h3 class="text-lg font-bold text-gray-600 mb-4">
                  <i class="fas fa-exclamation-circle mr-2"></i>解答
                </h3>
                <p class="text-gray-600">解答は準備中です</p>
              </div>
            `}
          </div>

          <!-- サイドバー（右側） -->
          <div class="lg:col-span-1 space-y-6">
            <!-- ヒントカードエリア -->
            <div id="hintsArea" class="hidden bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6">
              <h3 class="text-lg font-bold text-yellow-800 mb-4">
                <i class="fas fa-lightbulb mr-2"></i>ヒント
              </h3>
              <div class="space-y-3">
                ${hints.map((hint, index) => `
                  <div class="bg-white rounded-lg p-4">
                    <button onclick="toggleHint(${index})" 
                            class="w-full text-left font-bold text-gray-800 hover:text-indigo-600 transition flex items-center justify-between">
                      <span>ヒント ${hint.hint_number}</span>
                      <i class="fas fa-chevron-down"></i>
                    </button>
                    <div id="hint-${index}" class="hidden mt-3 pt-3 border-t">
                      <pre class="text-gray-700 whitespace-pre-wrap font-sans text-sm">${hint.hint_content}</pre>
                      ${hint.thinking_tool_suggestion ? `
                        <div class="mt-3 bg-blue-50 rounded p-3">
                          <p class="text-xs font-bold text-blue-800 mb-1">
                            <i class="fas fa-tools mr-1"></i>思考ツール
                          </p>
                          <p class="text-xs text-blue-700">${hint.thinking_tool_suggestion}</p>
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- AI先生エリア -->
            <div id="aiTeacherArea" class="hidden bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
              <h3 class="text-lg font-bold text-blue-800 mb-4">
                <i class="fas fa-robot mr-2"></i>AI先生
              </h3>
              <div id="aiChat" class="space-y-3 mb-4 max-h-96 overflow-y-auto">
                <!-- チャットメッセージがここに表示されます -->
              </div>
              <div class="flex gap-2">
                <input type="text" 
                       id="aiQuestionInput" 
                       placeholder="質問を入力..." 
                       class="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                       onkeypress="if(event.key==='Enter') askAI()">
                <button onclick="askAI()" 
                        class="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                  <i class="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>

            <!-- 学習のポイント -->
            <div class="bg-indigo-50 rounded-lg p-6">
              <h3 class="text-lg font-bold text-indigo-800 mb-3">
                <i class="fas fa-star mr-2"></i>学習のポイント
              </h3>
              <ul class="text-sm text-gray-700 space-y-2">
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                  <span>まずは自分で考えてみよう</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                  <span>わからないときは助けを求めよう</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                  <span>間違いは学びのチャンス！</span>
                </li>
              </ul>
            </div>

            <!-- 進捗情報 -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-bold text-gray-800 mb-3">
                <i class="fas fa-chart-line mr-2"></i>あなたの進捗
              </h3>
              <div class="text-sm text-gray-600">
                <p>カード ${card.card_number} / 6</p>
                <div class="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div class="bg-indigo-600 h-3 rounded-full" style="width: ${(card.card_number / 6) * 100}%"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    // 分かった度の状態管理用変数を初期化
    window.currentUnderstandingLevel = 3 // デフォルトは「だいたいOK」
    window.currentHelpType = null
    window.helpCount = 0
    window.currentCardData = { card, hints, answer }

  } catch (error) {
    console.error('学習カード読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
  }
}

// ヘルプメニュー表示
function showHelpMenu() {
  document.getElementById('helpMenu').classList.remove('hidden')
}

// ヘルプメニュー非表示
function closeHelpMenu() {
  document.getElementById('helpMenu').classList.add('hidden')
}

// ヒントカード表示
function showHints() {
  const hintsArea = document.getElementById('hintsArea')
  hintsArea.classList.remove('hidden')
  hintsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  window.currentHelpType = 'hint'
  window.helpCount++
}

// ヒント開閉トグル
function toggleHint(index) {
  const hintContent = document.getElementById(`hint-${index}`)
  const isHidden = hintContent.classList.contains('hidden')
  hintContent.classList.toggle('hidden')
  
  // アイコンの向きを変更
  const button = hintContent.previousElementSibling
  const icon = button.querySelector('i')
  if (isHidden) {
    icon.classList.remove('fa-chevron-down')
    icon.classList.add('fa-chevron-up')
  } else {
    icon.classList.remove('fa-chevron-up')
    icon.classList.add('fa-chevron-down')
  }
}

// AI先生表示
function showAITeacher() {
  const aiArea = document.getElementById('aiTeacherArea')
  aiArea.classList.remove('hidden')
  aiArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  window.currentHelpType = 'ai'
  window.helpCount++
  
  // 初回メッセージ
  const aiChat = document.getElementById('aiChat')
  if (aiChat.children.length === 0) {
    const cardTitle = window.currentCardData?.card?.card_title || '学習カード'
    const welcomeMsg = `こんにちは！AI先生です。\n\n今は「${cardTitle}」を学習していますね。\n\nわからないことや、もっと知りたいことがあったら、なんでも聞いてください！一緒に考えましょう！ 😊`
    addAIMessage(welcomeMsg, 'ai')
  }
  
  // 対話履歴を読み込む
  if (window.aiSessionId) {
    loadConversationHistory()
  }
}

// 対話履歴を読み込む
async function loadConversationHistory() {
  if (!window.aiSessionId) return
  
  try {
    const response = await axios.get(`/api/ai/conversations/${window.aiSessionId}`)
    const conversations = response.data.conversations || []
    
    // 既存のチャットをクリア（ウェルカムメッセージは保持）
    const aiChat = document.getElementById('aiChat')
    const messages = aiChat.querySelectorAll('.message:not(.welcome)')
    messages.forEach(msg => msg.remove())
    
    // 履歴を表示
    conversations.forEach(conv => {
      const type = conv.message_type === 'question' ? 'user' : 'ai'
      addAIMessage(conv.message_text, type)
    })
    
    console.log('対話履歴を読み込みました:', conversations.length, '件')
  } catch (error) {
    console.error('対話履歴の読み込みエラー:', error)
  }
}

// AI先生に質問
async function askAI() {
  const input = document.getElementById('aiQuestionInput')
  const question = input.value.trim()
  
  if (!question) return
  
  // ユーザーメッセージを追加
  addAIMessage(question, 'user')
  input.value = ''
  
  // ローディング表示
  const aiChat = document.getElementById('aiChat')
  const loadingId = 'loading-' + Date.now()
  addAIMessage('考えているよ... 💭', 'ai', loadingId)
  
  try {
    // セッションIDを生成または取得
    if (!window.aiSessionId) {
      window.aiSessionId = `session-${state.student.id}-${state.selectedCard}-${Date.now()}`
    }
    
    // カード情報を取得
    const card = window.currentCardData
    const cardContext = card ? {
      card_title: card.card_title,
      problem_description: card.problem_description,
      new_terms: card.new_terms
    } : null
    
    // AI先生APIを呼び出す
    const response = await axios.post('/api/ai/ask', {
      studentId: state.student.id,
      curriculumId: state.selectedCurriculum.id,
      cardId: state.selectedCard,
      question: question,
      context: cardContext ? JSON.stringify(cardContext) : '',
      sessionId: window.aiSessionId
    })
    
    // ローディングメッセージを削除
    const loadingMsg = document.getElementById(loadingId)
    if (loadingMsg) loadingMsg.remove()
    
    // AIの回答を追加
    const answer = response.data.answer || 'ごめんね、うまく答えられなかったよ。先生に聞いてみてね。'
    addAIMessage(answer, 'ai')
    
    // セッションIDを更新
    if (response.data.sessionId) {
      window.aiSessionId = response.data.sessionId
    }
    
    // トークン使用量を表示（デバッグ用）
    if (response.data.tokensUsed) {
      console.log('AI Tokens used:', response.data.tokensUsed)
    }
    
  } catch (error) {
    console.error('AI質問エラー:', error)
    console.error('エラー詳細:', error.response?.data || error.message)
    const loadingMsg = document.getElementById(loadingId)
    if (loadingMsg) loadingMsg.remove()
    
    // エラーメッセージ
    const errorMsg = error.response?.data?.error || 'エラーが発生しました'
    addAIMessage(`ごめんね、うまく答えられなかったよ。\n\n【先生に聞いてみてね】\n${errorMsg}`, 'ai')
  }
}

// AIチャットメッセージ追加
function addAIMessage(message, sender, loadingId = null) {
  const aiChat = document.getElementById('aiChat')
  const messageDiv = document.createElement('div')
  if (loadingId) messageDiv.id = loadingId
  messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`
  
  messageDiv.innerHTML = `
    <div class="${sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border-2 border-gray-200'} rounded-lg p-3 max-w-[80%] shadow">
      ${sender === 'ai' ? '<div class="flex items-center mb-1"><i class="fas fa-robot text-blue-500 mr-2"></i><span class="font-bold text-xs">AI先生</span></div>' : ''}
      <p class="text-sm whitespace-pre-wrap">${message}</p>
    </div>
  `
  
  aiChat.appendChild(messageDiv)
  aiChat.scrollTop = aiChat.scrollHeight
}

// 先生を呼ぶ
function callTeacher() {
  window.currentHelpType = 'teacher'
  window.helpCount++
  
  // 進捗に記録（先生呼び出しフラグ）
  saveProgress(true)
  
  // WebSocket通知を送信
  if (state.selectedCard && state.selectedCurriculum) {
    const card = window.currentCardData // グローバルに保存されたカードデータ
    sendHelpRequest(
      state.student.id,
      state.student.name,
      state.selectedCurriculum.id,
      state.selectedCard,
      card?.card_title || '学習カード',
      'teacher'
    )
  }
  
  alert('先生に助けを求めました。先生が来るまで他の問題に取り組んでもOKです。')
}

// 友達に聞く
async function askFriend() {
  window.currentHelpType = 'friend'
  window.helpCount++
  
  try {
    // 助けられる友達リストを取得
    const response = await axios.get(
      `/api/help/available-helpers/${state.student.classCode}/${state.selectedCurriculum.id}/${state.selectedCard}`
    )
    const { helpers } = response.data
    
    if (helpers.length === 0) {
      alert('この問題をすでにクリアしている友達がまだいません。\n\nヒントカードやAI先生を使ってみましょう！')
      return
    }
    
    // 助けられる友達リストをモーダルで表示
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-auto p-8">
        <h2 class="text-3xl font-bold text-green-600 mb-6">
          <i class="fas fa-user-friends mr-3"></i>助けられる友達
        </h2>
        
        <div class="bg-green-50 border-2 border-green-300 rounded-lg p-4 mb-6">
          <p class="text-gray-700">
            この問題をすでにクリアしている友達がいます！<br>
            助けを求めてみましょう。
          </p>
        </div>
        
        <div class="space-y-4 mb-6">
          ${helpers.map(helper => `
            <div class="bg-white border-2 border-green-300 rounded-lg p-6 hover:bg-green-50 transition">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-12 h-12 rounded-full bg-green-400 flex items-center justify-center text-white font-bold text-lg mr-4">
                    ${helper.student_number}
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-800">${helper.name}</h3>
                    <p class="text-sm text-gray-600">
                      完了カード数: ${helper.total_completed}枚
                    </p>
                  </div>
                </div>
                <button onclick="requestPeerHelp('${helper.id}', '${helper.name}'); this.closest('.fixed').remove()" 
                        class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg">
                  <i class="fas fa-comments mr-2"></i>助けを求める
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <button onclick="this.closest('.fixed').remove()" 
                class="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg">
          閉じる
        </button>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('友達検索エラー:', error)
    alert('この問題をすでにクリアしている友達がまだいません。\n\nヒントカードやAI先生を使ってみましょう！')
  }
}

// 分かった度設定
function setUnderstanding(level) {
  window.currentUnderstandingLevel = level
  
  // すべてのボタンのスタイルをリセット
  document.querySelectorAll('.understanding-btn').forEach(btn => {
    btn.classList.remove('bg-indigo-100', 'border-2', 'border-indigo-600')
  })
  
  // 選択されたボタンをハイライト
  const selectedBtn = document.querySelector(`[data-level="${level}"]`)
  selectedBtn.classList.add('bg-indigo-100', 'border-2', 'border-indigo-600')
}

// 解答表示
function showAnswer() {
  console.log('🔍 showAnswer() called')
  const answerSection = document.getElementById('answerSection')
  console.log('📦 answerSection element:', answerSection)
  if (answerSection) {
    answerSection.classList.toggle('hidden')
    console.log('✅ Toggled hidden class. Currently hidden:', answerSection.classList.contains('hidden'))
    if (!answerSection.classList.contains('hidden')) {
      answerSection.scrollIntoView({ behavior: 'smooth' })
    }
  } else {
    console.error('❌ answerSection element not found')
  }
}

// ヒントパネル表示/非表示切替
function toggleHintPanel() {
  const hintsArea = document.getElementById('hintsArea')
  if (hintsArea) {
    hintsArea.classList.toggle('hidden')
    if (!hintsArea.classList.contains('hidden')) {
      hintsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
}

// 学習進捗保存
async function saveProgress(teacherCall = false) {
  const answerInput = document.getElementById('answerInput').value
  
  if (!answerInput && !teacherCall) {
    alert('答えを書いてから保存してください。')
    return
  }
  
  try {
    // 解答時間を計算（秒単位）
    let answerTime = 0
    if (learningSession.currentCardStartTime) {
      answerTime = Math.floor((Date.now() - learningSession.currentCardStartTime) / 1000)
    }
    
    // 正解かどうかを理解度から推測（暫定実装）
    const isCorrect = (window.currentUnderstandingLevel || 0) >= 60
    
    // 学習ログを記録
    await logLearningActivity({
      cardId: state.selectedCard,
      unitId: state.selectedCurriculum?.id,
      courseType: state.selectedCourse,
      isCorrect: isCorrect,
      answerTime: answerTime,
      hintCount: window.helpCount || 0,
      retryCount: 0,  // TODO: 再試行回数のトラッキング実装
      difficulty: getDifficultyLevel(state.selectedCourse),
      problemType: getProblemType(state.selectedCard?.card_title || '')
    })
    
    // 進捗を保存
    await axios.post('/api/progress', {
      student_id: state.student.id,
      curriculum_id: state.selectedCurriculum.id,
      course_id: state.selectedCourse,
      learning_card_id: state.selectedCard,
      status: 'completed',
      understanding_level: window.currentUnderstandingLevel,
      help_requested_from: window.currentHelpType,
      help_count: window.helpCount
    })
    
    // WebSocket通知を送信
    sendProgressUpdate(
      state.student.id,
      state.selectedCurriculum.id,
      state.selectedCourse,
      state.selectedCard,
      'completed',
      window.currentUnderstandingLevel
    )
    
    // バックグラウンドでプロファイルを更新（5問ごと）
    if (learningSession.stats.totalProblems % 5 === 0) {
      updateLearningProfile()
    }
    
    if (!teacherCall) {
      alert('保存しました！次のカードに進みましょう。')
      // 次のカードに進む（今は学習カード一覧に戻る）
      selectCourse(state.selectedCourse)
    }
  } catch (error) {
    console.error('進捗保存エラー:', error)
    alert('保存に失敗しました')
  }
}

// グローバルスコープに関数を登録
window.showHelpMenu = showHelpMenu
window.closeHelpMenu = closeHelpMenu
window.showHints = showHints
window.toggleHint = toggleHint
window.showAITeacher = showAITeacher
window.askAI = askAI
window.callTeacher = callTeacher
window.askFriend = askFriend
window.setUnderstanding = setUnderstanding
window.showAnswer = showAnswer
window.toggleHintPanel = toggleHintPanel
window.saveProgress = saveProgress
window.loadLearningPlan = loadLearningPlan
window.loadAnswersTab = loadAnswersTab
window.savePlanReflection = savePlanReflection
window.requestAIFeedback = requestAIFeedback

// ============================================
// 学習計画表ページ
// ============================================
async function loadLearningPlan(curriculumId) {
  state.currentView = 'plan'
  
  try {
    // カリキュラム情報取得
    const currResponse = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum, courses } = currResponse.data
    
    // 既存の計画を取得
    const plansResponse = await axios.get(`/api/plans/${state.student.id}/${curriculumId}`)
    const existingPlans = plansResponse.data
    
    // 学習カードリストを取得（選択したコース用）
    let cards = []
    if (state.selectedCourse) {
      const cardsResponse = await axios.get(`/api/courses/${state.selectedCourse}/cards`)
      cards = cardsResponse.data
    }
    
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <!-- ヘッダー -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button onclick="loadGuidePage(${curriculumId})" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>学習のてびきに戻る
          </button>
          <h1 class="text-3xl font-bold text-green-600 mb-2">
            <i class="fas fa-calendar-alt mr-2"></i>
            学習計画表
          </h1>
          <p class="text-xl text-gray-800">
            ${curriculum.grade}年 ${curriculum.subject} - ${curriculum.unit_name}
          </p>
        </div>

        <!-- 単元情報 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
            <h3 class="text-lg font-bold text-blue-800 mb-2">
              <i class="fas fa-bullseye mr-2"></i>単元の目標
            </h3>
            <p class="text-gray-800 text-sm">${curriculum.unit_goal}</p>
          </div>
          <div class="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
            <h3 class="text-lg font-bold text-green-800 mb-2">
              <i class="fas fa-heart mr-2"></i>心の成長目標
            </h3>
            <p class="text-gray-800 text-sm">${curriculum.non_cognitive_goal}</p>
          </div>
        </div>

        <!-- 単元時数 -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <p class="text-gray-700 font-bold">
            <i class="fas fa-clock mr-2"></i>
            授業時間：全${curriculum.total_hours}時間
          </p>
        </div>

        <!-- 学習計画テーブル -->
        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="bg-gradient-to-r from-green-600 to-green-500 p-6">
            <h2 class="text-2xl font-bold text-white">
              <i class="fas fa-tasks mr-2"></i>
              学習の計画と振り返り
            </h2>
          </div>
          
          <div class="p-6">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">時間</th>
                    <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">予定日</th>
                    <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">実施日</th>
                    <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">学習内容</th>
                    <th class="px-4 py-3 text-left text-sm font-bold text-gray-700">振り返り</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  ${generatePlanRows(curriculum.total_hours, existingPlans, cards)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 単元全体の振り返り -->
        <div class="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">
            <i class="fas fa-flag-checkered mr-2"></i>
            単元全体の振り返り
          </h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">この単元で学んだこと</label>
              <textarea id="unitReflection" 
                        rows="4" 
                        class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        placeholder="この単元で学んだことを書きましょう..."></textarea>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">次に学びたいこと</label>
              <textarea id="nextGoal" 
                        rows="3" 
                        class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                        placeholder="次に学びたいことを書きましょう..."></textarea>
            </div>
            <button onclick="saveUnitReflection()" 
                    class="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-700 transition">
              <i class="fas fa-save mr-2"></i>
              単元の振り返りを保存
            </button>
          </div>
        </div>
      </div>
    `
  } catch (error) {
    console.error('学習計画表読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
  }
}

function generatePlanRows(totalHours, existingPlans, cards) {
  let rows = ''
  
  // 1時間目：オリエンテーション（固定）
  rows += `
    <tr class="bg-yellow-50">
      <td class="px-4 py-3 font-bold">1</td>
      <td class="px-4 py-3 text-sm">-</td>
      <td class="px-4 py-3 text-sm">-</td>
      <td class="px-4 py-3 text-sm font-bold">オリエンテーション</td>
      <td class="px-4 py-3 text-sm text-gray-500">学習の進め方を確認</td>
    </tr>
  `
  
  // 2〜最終時間-1：自由進度学習
  for (let i = 2; i < totalHours; i++) {
    const plan = existingPlans.find(p => p.planned_date && new Date(p.planned_date).getHours() === i) || {}
    const cardId = plan.learning_card_id || ''
    const card = cards.find(c => c.id == cardId)
    
    rows += `
      <tr class="hover:bg-gray-50" id="plan-row-${i}">
        <td class="px-4 py-3 font-bold">${i}</td>
        <td class="px-4 py-3">
          <input type="date" 
                 id="plan-date-${i}" 
                 value="${plan.planned_date || ''}"
                 class="w-full p-2 border rounded text-sm">
        </td>
        <td class="px-4 py-3">
          <input type="date" 
                 id="actual-date-${i}" 
                 value="${plan.actual_date || ''}"
                 class="w-full p-2 border rounded text-sm">
        </td>
        <td class="px-4 py-3">
          <select id="card-select-${i}" class="w-full p-2 border rounded text-sm">
            <option value="">選択してください</option>
            ${cards.map(c => `
              <option value="${c.id}" ${c.id == cardId ? 'selected' : ''}>
                カード${c.card_number}: ${c.card_title}
              </option>
            `).join('')}
          </select>
        </td>
        <td class="px-4 py-3">
          <button onclick="openReflectionModal(${i}, ${plan.id || 'null'})" 
                  class="text-blue-600 hover:text-blue-800 text-sm font-bold">
            <i class="fas fa-edit mr-1"></i>
            ${plan.reflection_good ? '編集' : '記入'}
          </button>
        </td>
      </tr>
    `
  }
  
  // 最終時間：まとめ（固定）
  rows += `
    <tr class="bg-yellow-50">
      <td class="px-4 py-3 font-bold">${totalHours}</td>
      <td class="px-4 py-3 text-sm">-</td>
      <td class="px-4 py-3 text-sm">-</td>
      <td class="px-4 py-3 text-sm font-bold">まとめ</td>
      <td class="px-4 py-3 text-sm text-gray-500">単元全体を振り返る</td>
    </tr>
  `
  
  return rows
}

// 振り返りモーダル表示
function openReflectionModal(hour, planId) {
  const modal = document.createElement('div')
  modal.id = 'reflectionModal'
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="bg-gradient-to-r from-green-600 to-green-500 p-6">
        <h3 class="text-2xl font-bold text-white">
          <i class="fas fa-pencil-alt mr-2"></i>
          ${hour}時間目の振り返り
        </h3>
      </div>
      
      <div class="p-6 space-y-6">
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">
            <i class="fas fa-smile text-green-500 mr-2"></i>
            良かったこと
          </label>
          <textarea id="reflection-good" 
                    rows="3" 
                    class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="うまくいったことや楽しかったことを書きましょう..."></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">
            <i class="fas fa-frown text-orange-500 mr-2"></i>
            難しかったこと
          </label>
          <textarea id="reflection-bad" 
                    rows="3" 
                    class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="難しかったことや困ったことを書きましょう..."></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-bold text-gray-700 mb-2">
            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
            わかったこと
          </label>
          <textarea id="reflection-learned" 
                    rows="3" 
                    class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder="新しくわかったことや発見したことを書きましょう..."></textarea>
        </div>
        
        <div id="ai-feedback-area" class="hidden bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
          <h4 class="font-bold text-blue-800 mb-2">
            <i class="fas fa-robot mr-2"></i>AI先生からのメッセージ
          </h4>
          <p id="ai-feedback-text" class="text-gray-800 text-sm"></p>
        </div>
        
        <div class="flex gap-3">
          <button onclick="requestAIFeedback()" 
                  class="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-blue-700 transition">
            <i class="fas fa-robot mr-2"></i>
            AI先生にコメントをもらう
          </button>
          <button onclick="savePlanReflection(${hour}, ${planId})" 
                  class="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-700 transition">
            <i class="fas fa-save mr-2"></i>
            保存
          </button>
        </div>
        
        <button onclick="closeReflectionModal()" 
                class="w-full bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-400 transition">
          閉じる
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

// 振り返りモーダルを閉じる
function closeReflectionModal() {
  const modal = document.getElementById('reflectionModal')
  if (modal) modal.remove()
}

// AI振り返りフィードバック取得
async function requestAIFeedback() {
  const good = document.getElementById('reflection-good').value
  const bad = document.getElementById('reflection-bad').value
  const learned = document.getElementById('reflection-learned').value
  
  if (!good && !bad && !learned) {
    alert('振り返りを書いてからAI先生に聞いてみましょう！')
    return
  }
  
  const feedbackArea = document.getElementById('ai-feedback-area')
  const feedbackText = document.getElementById('ai-feedback-text')
  
  feedbackText.textContent = '考え中...'
  feedbackArea.classList.remove('hidden')
  
  try {
    const response = await axios.post('/api/ai/reflect', {
      reflection_good: good,
      reflection_bad: bad,
      reflection_learned: learned
    })
    
    feedbackText.textContent = response.data.feedback
  } catch (error) {
    console.error('AI振り返りエラー:', error)
    feedbackText.textContent = 'よくがんばりました！すばらしい振り返りですね。'
  }
}

// 振り返り保存
async function savePlanReflection(hour, planId) {
  const good = document.getElementById('reflection-good').value
  const bad = document.getElementById('reflection-bad').value
  const learned = document.getElementById('reflection-learned').value
  const aiFeedback = document.getElementById('ai-feedback-text').textContent
  
  const planDate = document.getElementById(`plan-date-${hour}`).value
  const actualDate = document.getElementById(`actual-date-${hour}`).value
  const cardId = document.getElementById(`card-select-${hour}`).value
  
  try {
    if (planId && planId !== 'null') {
      // 更新
      await axios.put(`/api/plans/${planId}`, {
        actual_date: actualDate,
        learning_card_id: cardId,
        reflection_good: good,
        reflection_bad: bad,
        reflection_learned: learned,
        ai_feedback: aiFeedback !== '考え中...' ? aiFeedback : null
      })
    } else {
      // 新規作成
      await axios.post('/api/plans', {
        student_id: state.student.id,
        curriculum_id: state.selectedCurriculum.id,
        planned_date: planDate,
        learning_card_id: cardId,
        reflection_good: good,
        reflection_bad: bad,
        reflection_learned: learned
      })
    }
    
    alert('振り返りを保存しました！')
    closeReflectionModal()
    loadLearningPlan(state.selectedCurriculum.id)
  } catch (error) {
    console.error('振り返り保存エラー:', error)
    alert('保存に失敗しました')
  }
}

// 単元全体の振り返り保存
function saveUnitReflection() {
  const reflection = document.getElementById('unitReflection').value
  const nextGoal = document.getElementById('nextGoal').value
  
  if (!reflection && !nextGoal) {
    alert('振り返りを書いてから保存してください。')
    return
  }
  
  alert('単元の振り返りを保存しました！\n\n※実際のシステムでは、ここでデータベースに保存されます。')
}

window.closeReflectionModal = closeReflectionModal

// ============================================
// 解答タブページ
// ============================================
async function loadAnswersTab(curriculumId) {
  state.currentView = 'answers'
  
  try {
    // カリキュラム情報取得
    const currResponse = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum } = currResponse.data
    
    // 解答データ取得
    const answersResponse = await axios.get(`/api/answers/curriculum/${curriculumId}`)
    const { cardAnswers, optionalAnswers } = answersResponse.data
    
    // コース別にグループ化
    const groupedAnswers = {}
    cardAnswers.forEach(answer => {
      const key = answer.course_display_name
      if (!groupedAnswers[key]) {
        groupedAnswers[key] = []
      }
      groupedAnswers[key].push(answer)
    })
    
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <!-- ヘッダー -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button onclick="loadGuidePage(${curriculumId})" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>学習のてびきに戻る
          </button>
          <h1 class="text-3xl font-bold text-blue-600 mb-2">
            <i class="fas fa-book-open mr-2"></i>
            解答と解説
          </h1>
          <p class="text-xl text-gray-800">
            ${curriculum.grade}年 ${curriculum.subject} - ${curriculum.unit_name}
          </p>
        </div>

        <!-- 注意書き -->
        <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
          <h3 class="text-lg font-bold text-yellow-800 mb-2">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            解答を見る前に
          </h3>
          <p class="text-gray-800">
            まずは自分で考えてみましょう！わからないときはヒントやAI先生に聞いてみてね。<br>
            解答はあくまで参考です。自分の答えと比べて、どこが違うか考えてみましょう。
          </p>
        </div>

        <!-- コース別解答 -->
        ${Object.keys(groupedAnswers).map((courseName, index) => `
          <div class="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div class="bg-gradient-to-r ${
              index === 0 ? 'from-green-600 to-green-500' :
              index === 1 ? 'from-blue-600 to-blue-500' :
              'from-purple-600 to-purple-500'
            } p-6">
              <h2 class="text-2xl font-bold text-white">
                <i class="fas fa-layer-group mr-2"></i>
                ${courseName}
              </h2>
            </div>
            
            <div class="p-6 space-y-6">
              ${groupedAnswers[courseName].map(answer => `
                <div class="border-2 border-gray-200 rounded-lg p-6">
                  <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <span class="inline-block w-10 h-10 rounded-full ${
                      index === 0 ? 'bg-green-100 text-green-600' :
                      index === 1 ? 'bg-blue-100 text-blue-600' :
                      'bg-purple-100 text-purple-600'
                    } flex items-center justify-center font-bold mr-3">
                      ${answer.card_number}
                    </span>
                    ${answer.card_title}
                  </h3>
                  
                  ${answer.answer_content ? `
                    <div class="bg-green-50 border-l-4 border-green-500 rounded p-4 mb-4">
                      <h4 class="font-bold text-green-800 mb-2">
                        <i class="fas fa-check-circle mr-2"></i>解答
                      </h4>
                      <pre class="text-gray-800 whitespace-pre-wrap font-sans text-sm">${answer.answer_content}</pre>
                    </div>
                  ` : ''}
                  
                  ${answer.explanation ? `
                    <div class="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
                      <h4 class="font-bold text-blue-800 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>解説
                      </h4>
                      <pre class="text-gray-800 whitespace-pre-wrap font-sans text-sm">${answer.explanation}</pre>
                    </div>
                  ` : ''}
                  
                  ${!answer.answer_content && !answer.explanation ? `
                    <p class="text-gray-500 text-sm">解答は準備中です</p>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <!-- 選択問題の解答 -->
        ${optionalAnswers.length > 0 ? `
          <div class="bg-white rounded-lg shadow-lg overflow-hidden">
            <div class="bg-gradient-to-r from-pink-600 to-purple-500 p-6">
              <h2 class="text-2xl font-bold text-white">
                <i class="fas fa-star mr-2"></i>
                選択問題（発展課題）の解答
              </h2>
            </div>
            
            <div class="p-6 space-y-6">
              ${optionalAnswers.map(answer => `
                <div class="border-2 border-pink-200 rounded-lg p-6 bg-gradient-to-br from-white to-pink-50">
                  <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span class="inline-block w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl mr-3">
                      ${answer.problem_number}
                    </span>
                    ${answer.problem_title}
                  </h3>
                  
                  ${answer.problem_description ? `
                    <div class="bg-white border-l-4 border-pink-400 rounded p-4 mb-4">
                      <h4 class="font-bold text-pink-800 mb-2">
                        <i class="fas fa-file-alt mr-2"></i>問題
                      </h4>
                      <p class="text-gray-800">${answer.problem_description}</p>
                    </div>
                  ` : ''}
                  
                  ${answer.answer_content ? `
                    <div class="bg-green-50 border-l-4 border-green-500 rounded p-4 mb-4">
                      <h4 class="font-bold text-green-800 mb-2">
                        <i class="fas fa-check-circle mr-2"></i>解答例
                      </h4>
                      <pre class="text-gray-800 whitespace-pre-wrap font-sans">${answer.answer_content}</pre>
                    </div>
                  ` : `
                    <div class="bg-gray-50 border-l-4 border-gray-400 rounded p-4 mb-4">
                      <h4 class="font-bold text-gray-600 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>解答について
                      </h4>
                      <p class="text-gray-700 text-sm">
                        選択問題は自由な取り組みです。正解は一つではありません。<br>
                        自分なりの考えや方法で取り組んでみましょう。
                      </p>
                    </div>
                  `}
                  
                  ${answer.explanation ? `
                    <div class="bg-blue-50 border-l-4 border-blue-500 rounded p-4 mb-4">
                      <h4 class="font-bold text-blue-800 mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>解説・考え方のポイント
                      </h4>
                      <pre class="text-gray-800 whitespace-pre-wrap font-sans">${answer.explanation}</pre>
                    </div>
                  ` : ''}
                  
                  ${answer.learning_meaning ? `
                    <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded p-4">
                      <h4 class="font-bold text-yellow-800 mb-2">
                        <i class="fas fa-star mr-2"></i>この問題で学べること
                      </h4>
                      <p class="text-gray-800">${answer.learning_meaning}</p>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ヒント -->
        <div class="bg-indigo-50 rounded-lg p-6 mt-6">
          <h3 class="text-lg font-bold text-indigo-800 mb-3">
            <i class="fas fa-lightbulb mr-2"></i>
            解答を活用するコツ
          </h3>
          <ul class="text-sm text-gray-700 space-y-2">
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <span>自分の答えと比べて、どこが違うか確認しよう</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <span>間違えたところは、なぜ間違えたのか考えよう</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <span>わからないところは、もう一度学習カードに戻ってみよう</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <span>友達と答えを見せ合って、説明し合うのもいいね</span>
            </li>
          </ul>
        </div>
      </div>
    `
  } catch (error) {
    console.error('解答タブ読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
  }
}

// ============================================
// 進捗ボードページ
// ============================================

// 進捗ボード用カリキュラム選択モーダル
async function showProgressBoardSelection() {
  try {
    console.log('📊 進捗ボード選択画面を表示中...')
    // 全カリキュラムを取得
    const response = await axios.get('/api/curriculum/list')
    const curriculums = response.data
    console.log('📚 取得したカリキュラム:', curriculums)
    
    if (curriculums.length === 0) {
      alert('カリキュラムがまだ作成されていません。\n先に「AIで学習カードを作成する」から単元を作成してください。')
      return
    }
    
    // モーダルを表示
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-4xl mx-auto">
          <div class="bg-white rounded-lg shadow-xl p-8">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-3xl font-bold text-gray-800">
                <i class="fas fa-chart-bar mr-2 text-blue-600"></i>
                進捗ボードを表示
              </h2>
              <button onclick="renderTopPage()" class="text-gray-500 hover:text-gray-700">
                <i class="fas fa-times text-2xl"></i>
              </button>
            </div>
            
            <p class="text-gray-600 mb-6">表示したいカリキュラムを選択してください</p>
            
            <div class="space-y-4">
              ${curriculums.map(c => `
                <button 
                  onclick="loadProgressBoard(${c.id})"
                  class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white p-6 rounded-lg shadow-lg transition-all transform hover:scale-105 text-left">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm opacity-90">${c.grade}年 ${c.subject}</p>
                      <p class="text-2xl font-bold">${c.unit_name}</p>
                      <p class="text-sm opacity-75 mt-1">${c.textbook || ''}</p>
                    </div>
                    <i class="fas fa-arrow-right text-3xl"></i>
                  </div>
                </button>
              `).join('')}
            </div>
            
            <div class="mt-6 text-center">
              <button 
                onclick="renderTopPage()"
                class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition">
                <i class="fas fa-arrow-left mr-2"></i>トップページに戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  } catch (error) {
    console.error('カリキュラム一覧取得エラー:', error)
    alert('カリキュラムの読み込みに失敗しました')
  }
}

async function loadProgressBoard(curriculumId, curriculumId2 = null) {
  console.log('🎯 進捗ボード読み込み開始:', curriculumId)
  state.currentView = 'progress'
  showLoading('進捗ボードを読み込み中...')
  
  try {
    // カリキュラム情報取得
    const curriculumIds = curriculumId2 ? `${curriculumId},${curriculumId2}` : curriculumId
    const curriculums = []
    
    console.log('📖 カリキュラム情報を取得中...', curriculumIds)
    for (const id of curriculumIds.split(',')) {
      const response = await axios.get(`/api/curriculum/${id}`)
      curriculums.push(response.data)
      console.log(`✅ カリキュラム ${id} 取得完了:`, response.data.curriculum)
    }
    
    // 進捗ボードデータ取得（新しいAPI）
    console.log('📊 進捗データを取得中...', state.student.classCode)
    const progressResponse = await axios.get(
      `/api/progress-board/class/${state.student.classCode}?curriculumIds=${curriculumIds}`
    )
    const progressData = progressResponse.data
    
    hideLoading()
    
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 md:p-4">
        <!-- ヘッダー（コンパクト） -->
        <div class="bg-white rounded-lg shadow-md p-3 mb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button onclick="showTopPage()" class="text-indigo-600 hover:text-indigo-800 p-2">
                <i class="fas fa-home text-lg"></i>
              </button>
              <h1 class="text-lg md:text-2xl font-bold text-purple-600">
                <i class="fas fa-chart-bar mr-2"></i>進捗ボード
              </h1>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs md:text-sm text-gray-600">クラス: ${state.student.classCode}</span>
              
              <!-- 自動更新トグル -->
              <label class="inline-flex items-center cursor-pointer">
                <input type="checkbox" id="autoRefreshToggle" class="sr-only peer" 
                       onchange="toggleAutoRefresh(${curriculumId})">
                <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span class="ms-2 text-xs md:text-sm font-medium text-gray-600">自動更新</span>
              </label>
              
              <!-- PDF出力 -->
              <button onclick="exportProgressToPDF()" 
                      class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                <i class="fas fa-file-pdf mr-1"></i>PDF
              </button>
              
              <!-- 手動更新 -->
              <button onclick="loadProgressBoard(${curriculumId})" 
                      class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                <i class="fas fa-sync-alt mr-1"></i>更新
              </button>
            </div>
          </div>
          <div class="mt-2 text-sm md:text-base text-gray-700">
            ${curriculums.map(c => `${c.curriculum.grade}年 ${c.curriculum.subject} - ${c.curriculum.unit_name}`).join(' / ')}
          </div>
        </div>

        <!-- コース凡例（コンパクト） -->
        <div class="bg-white rounded-lg shadow p-2 mb-3">
          <div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs md:text-sm">
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 bg-green-500 rounded"></div>
              <span class="font-bold">じっくり</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 bg-blue-500 rounded"></div>
              <span class="font-bold">しっかり</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="w-4 h-4 bg-purple-500 rounded"></div>
              <span class="font-bold">ぐんぐん</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="fas fa-hand-paper text-orange-500"></i>
              <span class="font-bold text-orange-600">ヘルプ</span>
            </div>
            <div class="flex items-center gap-1">
              <i class="fas fa-exclamation-triangle text-red-500"></i>
              <span class="font-bold text-red-600">停滞</span>
            </div>
          </div>
        </div>

        <!-- メイン進捗ボード -->
        <div class="bg-white rounded-lg shadow-md p-2 md:p-4 overflow-x-auto">
          <div class="min-w-[1200px]">
            <!-- ヘッダー行 -->
            <div class="grid grid-cols-[150px_1fr] gap-2 mb-2 text-xs font-bold">
              <div class="bg-gray-100 p-2 rounded text-center">児童名</div>
              <div class="grid grid-cols-[2fr_1fr_2fr_80px] gap-2">
                <div class="bg-gray-100 p-2 rounded text-center">学習カード進捗</div>
                <div class="bg-yellow-100 p-2 rounded text-center">チェックテスト</div>
                <div class="bg-blue-100 p-2 rounded text-center">選択問題</div>
                <div class="bg-gray-100 p-2 rounded text-center">優先度</div>
              </div>
            </div>
            
            <!-- 生徒ごとの進捗行 -->
            ${generateProgressBoardRows(progressData.students, curriculums)}
          </div>
        </div>

        <!-- 指導介入優先リスト -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <!-- ヘルプ要請中 -->
          <div class="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-3">
            <h3 class="text-sm md:text-base font-bold text-orange-800 mb-2 flex items-center">
              <i class="fas fa-hand-paper mr-2"></i>
              ヘルプ要請中（${countHelpRequests(progressData.students)}名）
            </h3>
            <div class="space-y-2 max-h-48 overflow-y-auto text-xs md:text-sm">
              ${generateHelpRequestList(progressData.students)}
            </div>
          </div>

          <!-- 停滞中 -->
          <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-3">
            <h3 class="text-sm md:text-base font-bold text-red-800 mb-2 flex items-center">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              停滞中（${countStagnant(progressData.students)}名）
            </h3>
            <div class="space-y-2 max-h-48 overflow-y-auto text-xs md:text-sm">
              ${generateStagnantList(progressData.students)}
            </div>
          </div>
        </div>

        <!-- ヘルプ統計 -->
        <div class="bg-white rounded-lg shadow-md p-3 mt-3">
          <h3 class="text-sm md:text-base font-bold text-gray-800 mb-3 flex items-center">
            <i class="fas fa-chart-pie mr-2"></i>
            ヘルプの種類別統計
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
            ${generateHelpStatsNew(progressData.students)}
          </div>
              <i class="fas fa-microscope mr-2"></i>
              AI誤答分析で詳しく見る
              <span class="ml-2 text-xs bg-white text-red-600 px-2 py-0.5 rounded animate-pulse">NEW</span>
            </button>
          </div>
        </div>

        <!-- 指導のポイント（教師用） -->
        <div class="bg-blue-50 rounded-lg p-3 mt-3">
          <h3 class="text-sm md:text-base font-bold text-blue-800 mb-2">
            <i class="fas fa-lightbulb mr-2"></i>指導のポイント
          </h3>
          <ul class="text-xs md:text-sm text-gray-700 space-y-1">
            <li><i class="fas fa-check text-green-500 mr-2"></i>優先度スコア100以上: 即座に対応</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>オレンジ背景: ヘルプ要請中</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>赤/黄背景: 停滞中（声掛け推奨）</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>ヘルプ統計でよく使われる支援方法を確認</li>
          </ul>
          
          <!-- レポート機能 -->
          <div class="mt-4 pt-4 border-t border-blue-200">
            <div class="grid grid-cols-2 gap-2">
              <button onclick="showWeeklyReport()" 
                      class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg transition-all shadow text-xs md:text-sm font-bold">
                <i class="fas fa-calendar-week mr-2"></i>週次レポート
              </button>
              <button onclick="showMonthlyReport()" 
                      class="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all shadow text-xs md:text-sm font-bold">
                <i class="fas fa-calendar-alt mr-2"></i>月次レポート
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  } catch (error) {
    console.error('❌ 進捗ボード読み込みエラー:', error)
    console.error('エラー詳細:', error.response?.data || error.message)
    hideLoading()
    alert('データの読み込みに失敗しました: ' + (error.response?.data?.error || error.message))
  }
}

// 進捗バー生成
function generateProgressBars(studentProgress, courses) {
  let html = ''
  
  Object.values(studentProgress).forEach(({ student, progress, allProgress }) => {
    const courseColor = getProgressColor(progress?.course_level)
    const progressPercent = calculateProgressPercent(allProgress, 6) // 6枚のカード想定
    const isStuck = isStudentStuck(progress)
    const needsHelp = progress?.help_requested_from === 'teacher'
    
    html += `
      <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center">
            <span class="text-lg font-bold text-gray-800 mr-3">
              ${student.student_number}. ${student.name}
            </span>
            ${needsHelp ? '<i class="fas fa-hand-paper text-orange-500 text-xl mr-2" title="助けを求めています"></i>' : ''}
            ${isStuck ? '<i class="fas fa-pause-circle text-red-500 text-xl" title="停滞中"></i>' : ''}
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600">
              ${progress ? `${progress.course_display_name}` : 'コース未選択'}
            </p>
            <p class="text-xs text-gray-500">
              ${progress ? `カード ${progress.card_number || '-'}` : '未開始'}
            </p>
          </div>
        </div>
        
        <div class="relative">
          <div class="w-full bg-gray-200 rounded-full h-8">
            <div class="${courseColor} h-8 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-500" 
                 style="width: ${progressPercent}%">
              ${progressPercent > 10 ? `${progressPercent}%` : ''}
            </div>
          </div>
          ${progressPercent <= 10 && progressPercent > 0 ? `
            <span class="absolute right-2 top-1 text-xs font-bold text-gray-700">${progressPercent}%</span>
          ` : ''}
        </div>
        
        ${progress ? `
          <div class="mt-3 flex items-center justify-between text-xs text-gray-600">
            <span>
              <i class="fas fa-heart mr-1"></i>
              理解度: ${getUnderstandingEmoji(progress.understanding_level)}
            </span>
            <span>
              <i class="fas fa-question-circle mr-1"></i>
              助け: ${progress.help_count || 0}回
            </span>
            <span>
              ${progress.help_requested_from ? `<i class="fas fa-info-circle mr-1"></i>${getHelpTypeLabel(progress.help_requested_from)}` : ''}
            </span>
          </div>
        ` : ''}
      </div>
    `
  })
  
  return html || '<p class="text-gray-500">まだ学習データがありません</p>'
}

// 進捗色取得
function getProgressColor(courseLevel) {
  switch (courseLevel) {
    case 'basic': return 'bg-green-500'
    case 'standard': return 'bg-blue-500'
    case 'advanced': return 'bg-purple-500'
    default: return 'bg-gray-400'
  }
}

// 進捗パーセント計算
function calculateProgressPercent(allProgress, totalCards) {
  if (!allProgress || allProgress.length === 0) return 0
  
  const completedCards = new Set(allProgress.map(p => p.learning_card_id)).size
  return Math.round((completedCards / totalCards) * 100)
}

// 停滞判定（10分以上経過）
function isStudentStuck(progress) {
  if (!progress || !progress.created_at) return false
  
  const now = new Date()
  const lastUpdate = new Date(progress.created_at)
  const minutesElapsed = (now - lastUpdate) / 1000 / 60
  
  return minutesElapsed > 10 && progress.status !== 'completed'
}

// 助け要請リスト生成
function generateHelpRequests(studentProgress) {
  const helpRequests = []
  
  Object.values(studentProgress).forEach(({ student, progress }) => {
    if (progress && progress.help_requested_from === 'teacher') {
      helpRequests.push({
        student,
        progress
      })
    }
  })
  
  if (helpRequests.length === 0) {
    return '<p class="text-gray-500 text-sm">現在、助けを求めている児童はいません</p>'
  }
  
  let html = ''
  helpRequests.forEach(({ student, progress }) => {
    html += `
      <div class="bg-white rounded-lg p-3 shadow">
        <p class="font-bold text-gray-800">${student.name}</p>
        <p class="text-sm text-gray-600">カード ${progress.card_number}: ${progress.card_title}</p>
        <p class="text-xs text-gray-500 mt-1">
          <i class="fas fa-clock mr-1"></i>
          ${formatTimestamp(progress.created_at)}
        </p>
      </div>
    `
  })
  
  return html
}

// 停滞中の児童リスト生成
function generateStuckStudents(studentProgress) {
  const stuckStudents = []
  
  Object.values(studentProgress).forEach(({ student, progress }) => {
    if (isStudentStuck(progress)) {
      stuckStudents.push({
        student,
        progress
      })
    }
  })
  
  if (stuckStudents.length === 0) {
    return '<p class="text-gray-500 text-sm">停滞している児童はいません</p>'
  }
  
  let html = ''
  stuckStudents.forEach(({ student, progress }) => {
    const minutesElapsed = Math.round((new Date() - new Date(progress.created_at)) / 1000 / 60)
    html += `
      <div class="bg-white rounded-lg p-3 shadow">
        <p class="font-bold text-gray-800">${student.name}</p>
        <p class="text-sm text-gray-600">カード ${progress.card_number}: ${progress.card_title}</p>
        <p class="text-xs text-red-600 mt-1 font-bold">
          <i class="fas fa-clock mr-1"></i>
          ${minutesElapsed}分間停滞中
        </p>
      </div>
    `
  })
  
  return html
}

// 助けの統計生成
function generateHelpStats(studentProgress) {
  const stats = {
    hint: 0,
    ai: 0,
    teacher: 0,
    friend: 0
  }
  
  Object.values(studentProgress).forEach(({ allProgress }) => {
    allProgress.forEach(p => {
      if (p.help_requested_from) {
        stats[p.help_requested_from] = (stats[p.help_requested_from] || 0) + 1
      }
    })
  })
  
  return `
    <div class="bg-yellow-50 rounded-lg p-4 text-center">
      <i class="fas fa-lightbulb text-yellow-600 text-3xl mb-2"></i>
      <p class="text-2xl font-bold text-gray-800">${stats.hint || 0}</p>
      <p class="text-sm text-gray-600">ヒント</p>
    </div>
    <div class="bg-blue-50 rounded-lg p-4 text-center">
      <i class="fas fa-robot text-blue-600 text-3xl mb-2"></i>
      <p class="text-2xl font-bold text-gray-800">${stats.ai || 0}</p>
      <p class="text-sm text-gray-600">AI先生</p>
    </div>
    <div class="bg-green-50 rounded-lg p-4 text-center">
      <i class="fas fa-chalkboard-teacher text-green-600 text-3xl mb-2"></i>
      <p class="text-2xl font-bold text-gray-800">${stats.teacher || 0}</p>
      <p class="text-sm text-gray-600">先生</p>
    </div>
    <div class="bg-purple-50 rounded-lg p-4 text-center">
      <i class="fas fa-user-friends text-purple-600 text-3xl mb-2"></i>
      <p class="text-2xl font-bold text-gray-800">${stats.friend || 0}</p>
      <p class="text-sm text-gray-600">友達</p>
    </div>
  `
}

// 理解度分布生成
function generateUnderstandingDistribution(studentProgress) {
  const distribution = [0, 0, 0, 0, 0]
  let total = 0
  
  Object.values(studentProgress).forEach(({ progress }) => {
    if (progress && progress.understanding_level) {
      distribution[progress.understanding_level - 1]++
      total++
    }
  })
  
  const emojis = ['😢', '😕', '😊', '😄', '🤩']
  const labels = ['わからない', '少し難しい', 'だいたいOK', 'よくわかる', '完璧！']
  
  let html = ''
  for (let i = 0; i < 5; i++) {
    const count = distribution[i]
    const percent = total > 0 ? Math.round((count / total) * 100) : 0
    html += `
      <div class="bg-gray-50 rounded-lg p-4 text-center">
        <div class="text-4xl mb-2">${emojis[i]}</div>
        <p class="text-2xl font-bold text-gray-800">${count}</p>
        <p class="text-xs text-gray-600">${labels[i]}</p>
        ${total > 0 ? `<p class="text-xs text-gray-500 mt-1">${percent}%</p>` : ''}
      </div>
    `
  }
  
  return html
}

// ヘルパー関数
function getUnderstandingEmoji(level) {
  const emojis = ['😢', '😕', '😊', '😄', '🤩']
  return level ? emojis[level - 1] : '-'
}

function getHelpTypeLabel(type) {
  const labels = {
    hint: 'ヒント',
    ai: 'AI先生',
    teacher: '先生',
    friend: '友達'
  }
  return labels[type] || type
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '-'
  
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.round(diffMs / 1000 / 60)
  
  if (diffMins < 1) return 'たった今'
  if (diffMins < 60) return `${diffMins}分前`
  
  const diffHours = Math.round(diffMins / 60)
  return `${diffHours}時間前`
}

// ==================== Phase 5: 先生カスタマイズモード ====================

// 先生モードの状態管理
let teacherMode = false

// 先生モード切替
function toggleTeacherMode() {
  teacherMode = !teacherMode
  
  if (teacherMode) {
    alert('先生カスタマイズモードに切り替えました！\n\n・学習環境デザイン\n・指導・評価タブ\n・問題編集機能\n\nが利用できます。')
  }
  
  // 現在のページをリロード
  if (state.currentView === 'guide') {
    loadGuidePage(state.selectedCurriculum.id)
  }
}

// 学習環境デザインタブ
async function loadEnvironmentDesignPage(curriculumId) {
  state.currentView = 'environment'
  
  try {
    // 環境デザイン取得
    const designResponse = await axios.get(`/api/environment/design/${curriculumId}`)
    const design = designResponse.data || {}
    
    // カリキュラム情報取得
    const currResponse = await axios.get(`/api/curriculum/${curriculumId}`)
    const curriculum = currResponse.data
    
    document.getElementById('app').innerHTML = `
      <!-- ヘッダー -->
      <div class="bg-white shadow-md p-4 mb-6">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button onclick="loadGuidePage(${curriculumId})" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-left mr-2"></i>学習のてびきに戻る
            </button>
            <h1 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-palette mr-2"></i>学習環境デザイン
            </h1>
          </div>
          <div class="text-sm text-gray-600">
            ${curriculum.curriculum.grade}年 ${curriculum.curriculum.subject} 「${curriculum.curriculum.unit_name}」
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto p-6">
        <!-- 説明 -->
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p class="text-blue-800">
            <i class="fas fa-info-circle mr-2"></i>
            <strong>学習環境デザイン</strong>とは、子どもたちの学びを深め、広げるための様々な活動です。
            チェックを入れた活動が、学習のてびきや学習カードに反映されます。
          </p>
        </div>

        <form id="envDesignForm">
          <!-- 6観点 -->
          ${renderEnvironmentCategory('表現・クリエイティブ', 'expression_creative', design, 
            '自分の考えを絵・図・作品で表現する活動')}
          ${renderEnvironmentCategory('調査・フィールドワーク', 'research_fieldwork', design,
            '身の回りや地域を調べる活動')}
          ${renderEnvironmentCategory('多角的考察・クリティカルシンキング', 'critical_thinking', design,
            '多面的に考え、批判的に検討する活動')}
          ${renderEnvironmentCategory('社会貢献・デザイン思考', 'social_contribution', design,
            '他者のために役立つものを考える活動')}
          ${renderEnvironmentCategory('メタ認知・振り返り', 'metacognition_reflection', design,
            '自分の学び方を振り返る活動')}
          ${renderEnvironmentCategory('問いの生成', 'question_generation', design,
            '次の学びへの問いを作る活動')}

          <!-- 保存ボタン -->
          <div class="flex justify-end space-x-4 mt-8">
            <button type="button" onclick="loadGuidePage(${curriculumId})" 
              class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              キャンセル
            </button>
            <button type="submit" 
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <i class="fas fa-save mr-2"></i>保存する
            </button>
          </div>
        </form>
      </div>
    `
    
    // フォーム送信
    document.getElementById('envDesignForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      await saveEnvironmentDesign(curriculumId, design.id)
    })
    
  } catch (error) {
    console.error('Error loading environment design:', error)
    alert('環境デザインの読み込みに失敗しました')
  }
}

// 環境カテゴリーレンダリング
function renderEnvironmentCategory(title, key, design, description) {
  const enabled = design[`${key}_enabled`] || false
  const content = design[key] || ''
  
  return `
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex items-start space-x-4">
        <input type="checkbox" id="${key}_enabled" name="${key}_enabled" 
          ${enabled ? 'checked' : ''}
          class="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500">
        <div class="flex-1">
          <label for="${key}_enabled" class="text-lg font-bold text-gray-800 cursor-pointer">
            ${title}
          </label>
          <p class="text-sm text-gray-600 mt-1 mb-3">${description}</p>
          <textarea id="${key}" name="${key}" rows="3" 
            placeholder="具体的な活動内容を記入してください（例：〇〇を作る、〇〇を調べる、など）"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >${content}</textarea>
        </div>
      </div>
    </div>
  `
}

// 環境デザイン保存
async function saveEnvironmentDesign(curriculumId, designId) {
  const formData = {
    curriculum_id: curriculumId,
    expression_creative: document.getElementById('expression_creative').value,
    expression_creative_enabled: document.getElementById('expression_creative_enabled').checked,
    research_fieldwork: document.getElementById('research_fieldwork').value,
    research_fieldwork_enabled: document.getElementById('research_fieldwork_enabled').checked,
    critical_thinking: document.getElementById('critical_thinking').value,
    critical_thinking_enabled: document.getElementById('critical_thinking_enabled').checked,
    social_contribution: document.getElementById('social_contribution').value,
    social_contribution_enabled: document.getElementById('social_contribution_enabled').checked,
    metacognition_reflection: document.getElementById('metacognition_reflection').value,
    metacognition_reflection_enabled: document.getElementById('metacognition_reflection_enabled').checked,
    question_generation: document.getElementById('question_generation').value,
    question_generation_enabled: document.getElementById('question_generation_enabled').checked
  }
  
  try {
    if (designId) {
      await axios.put(`/api/environment/design/${designId}`, formData)
    } else {
      await axios.post('/api/environment/design', formData)
    }
    
    alert('学習環境デザインを保存しました！')
    loadGuidePage(curriculumId)
  } catch (error) {
    console.error('Error saving environment design:', error)
    alert('保存に失敗しました')
  }
}

// 指導・評価タブ
async function loadEvaluationPage(curriculumId) {
  state.currentView = 'evaluation'
  
  try {
    // カリキュラム情報取得
    const currResponse = await axios.get(`/api/curriculum/${curriculumId}`)
    const curriculum = currResponse.data
    
    // クラス情報取得（進捗ボードから流用）
    const classCode = state.student?.class_code || 'CLASS2024A'
    const progressResponse = await axios.get(`/api/progress/curriculum/${curriculumId}/class/${classCode}`)
    const students = progressResponse.data
    
    document.getElementById('app').innerHTML = `
      <!-- ヘッダー -->
      <div class="bg-white shadow-md p-4 mb-6">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button onclick="loadGuidePage(${curriculumId})" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-left mr-2"></i>学習のてびきに戻る
            </button>
            <h1 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-clipboard-check mr-2"></i>指導・評価
            </h1>
          </div>
          <div class="text-sm text-gray-600">
            ${curriculum.curriculum.grade}年 ${curriculum.curriculum.subject} 「${curriculum.curriculum.unit_name}」
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto p-6">
        <!-- 生徒選択 -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <label class="block text-lg font-bold text-gray-800 mb-3">
            <i class="fas fa-user mr-2"></i>生徒を選択
          </label>
          <select id="studentSelect" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">-- 生徒を選択してください --</option>
            ${Object.values(students).map(s => `
              <option value="${s.id}">${s.name} (出席番号: ${s.student_number})</option>
            `).join('')}
          </select>
        </div>

        <!-- 評価フォーム（生徒選択後に表示） -->
        <div id="evaluationForm"></div>
      </div>
    `
    
    // 生徒選択イベント
    document.getElementById('studentSelect').addEventListener('change', async (e) => {
      const studentId = e.target.value
      if (studentId) {
        await loadStudentEvaluation(studentId, curriculumId)
      } else {
        document.getElementById('evaluationForm').innerHTML = ''
      }
    })
    
  } catch (error) {
    console.error('Error loading evaluation page:', error)
    alert('指導・評価ページの読み込みに失敗しました')
  }
}

// 生徒の評価データ読み込み
async function loadStudentEvaluation(studentId, curriculumId) {
  try {
    // 3観点評価取得
    const threePointRes = await axios.get(`/api/evaluations/three-point/student/${studentId}/curriculum/${curriculumId}`)
    const threePoint = threePointRes.data || {}
    
    // 非認知能力評価取得
    const nonCognitiveRes = await axios.get(`/api/evaluations/non-cognitive/student/${studentId}/curriculum/${curriculumId}`)
    const nonCognitive = nonCognitiveRes.data || {}
    
    // バッジ取得
    const badgesRes = await axios.get(`/api/badges/student/${studentId}/curriculum/${curriculumId}`)
    const badges = badgesRes.data || []
    
    // ナラティブ取得
    const narrativesRes = await axios.get(`/api/narratives/student/${studentId}/curriculum/${curriculumId}`)
    const narratives = narrativesRes.data || []
    
    document.getElementById('evaluationForm').innerHTML = `
      <!-- 3観点評価 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-check-circle mr-2"></i>学習指導要領3観点評価（ABC評価）
        </h2>
        
        ${renderThreePointEvaluation('知識・技能', 'knowledge_skill', threePoint)}
        ${renderThreePointEvaluation('思考・判断・表現', 'thinking_judgment', threePoint)}
        ${renderThreePointEvaluation('主体的に学習に取り組む態度', 'attitude', threePoint)}
        
        <div class="mt-6">
          <label class="block text-sm font-bold text-gray-700 mb-2">総合所見</label>
          <textarea id="overall_comment" rows="3" 
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="単元全体を通しての総合的な評価を記入してください"
          >${threePoint.overall_comment || ''}</textarea>
        </div>
        
        <div class="flex justify-end mt-4">
          <button onclick="saveThreePointEvaluation(${studentId}, ${curriculumId}, ${threePoint.id || 'null'})"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <i class="fas fa-save mr-2"></i>保存
          </button>
        </div>
      </div>

      <!-- 非認知能力評価 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-heart mr-2"></i>非認知能力評価（1-5段階）
        </h2>
        
        <div class="mb-6">
          <canvas id="radarChart" width="400" height="400"></canvas>
        </div>
        
        ${renderNonCognitiveEvaluation('自己調整能力', 'self_regulation', nonCognitive, '計画を立てて自分で学習を進める力')}
        ${renderNonCognitiveEvaluation('意欲・粘り強さ', 'motivation', nonCognitive, '難しい問題にも諦めずに取り組む力')}
        ${renderNonCognitiveEvaluation('協働性', 'collaboration', nonCognitive, '友達と協力して学ぶ力')}
        ${renderNonCognitiveEvaluation('メタ認知', 'metacognition', nonCognitive, '自分の学び方を振り返る力')}
        ${renderNonCognitiveEvaluation('創造性', 'creativity', nonCognitive, 'オリジナルのアイデアを出す力')}
        ${renderNonCognitiveEvaluation('好奇心', 'curiosity', nonCognitive, '次の学びへの問いを持つ力')}
        ${renderNonCognitiveEvaluation('自己肯定感', 'self_esteem', nonCognitive, '自分に自信を持って学習に取り組む姿勢')}
        
        <div class="flex justify-end mt-4">
          <button onclick="saveNonCognitiveEvaluation(${studentId}, ${curriculumId}, ${nonCognitive.id || 'null'})"
            class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            <i class="fas fa-save mr-2"></i>保存
          </button>
        </div>
      </div>

      <!-- ゲーミフィケーション：バッジ -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-trophy mr-2"></i>獲得バッジ
        </h2>
        ${badges.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${badges.map(badge => `
              <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                <i class="fas fa-medal text-yellow-600 text-4xl mb-2"></i>
                <h3 class="font-bold text-gray-800">${badge.badge_name}</h3>
                <p class="text-sm text-gray-600 mt-1">${badge.badge_description}</p>
                <p class="text-xs text-gray-500 mt-2">${new Date(badge.earned_at).toLocaleDateString('ja-JP')}</p>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-gray-500 text-center py-8">まだバッジを獲得していません</p>
        `}
      </div>

      <!-- ナラティブ：学習ストーリー -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-book-open mr-2"></i>学習ストーリー
        </h2>
        ${narratives.length > 0 ? `
          <div class="space-y-4">
            ${narratives.map(narrative => `
              <div class="border-l-4 border-blue-500 pl-4 py-2">
                <h3 class="font-bold text-gray-800">
                  第${narrative.chapter_number}章: ${narrative.chapter_title}
                  ${narrative.milestone_reached ? '<i class="fas fa-flag-checkered text-green-600 ml-2"></i>' : ''}
                </h3>
                <p class="text-gray-700 mt-2">${narrative.story_content}</p>
              </div>
            `).join('')}
          </div>
        ` : `
          <p class="text-gray-500 text-center py-8">学習ストーリーはまだありません</p>
        `}
      </div>
    `
    
    // レーダーチャート描画（Chart.jsを使う場合のプレースホルダー）
    // 実際の実装ではChart.jsのCDNを読み込んで描画
    drawRadarChart(nonCognitive)
    
  } catch (error) {
    console.error('Error loading student evaluation:', error)
    alert('生徒の評価データの読み込みに失敗しました')
  }
}

// 3観点評価レンダリング
function renderThreePointEvaluation(label, key, data) {
  const value = data[key] || ''
  const comment = data[`${key}_comment`] || ''
  
  return `
    <div class="mb-6 pb-6 border-b border-gray-200">
      <label class="block text-sm font-bold text-gray-700 mb-2">${label}</label>
      <div class="flex items-center space-x-4 mb-2">
        <label class="flex items-center">
          <input type="radio" name="${key}" value="A" ${value === 'A' ? 'checked' : ''}
            class="mr-2 w-5 h-5 text-green-600">
          <span class="text-lg font-bold text-green-600">A</span>
          <span class="text-sm text-gray-600 ml-1">（十分満足できる）</span>
        </label>
        <label class="flex items-center">
          <input type="radio" name="${key}" value="B" ${value === 'B' ? 'checked' : ''}
            class="mr-2 w-5 h-5 text-blue-600">
          <span class="text-lg font-bold text-blue-600">B</span>
          <span class="text-sm text-gray-600 ml-1">（おおむね満足できる）</span>
        </label>
        <label class="flex items-center">
          <input type="radio" name="${key}" value="C" ${value === 'C' ? 'checked' : ''}
            class="mr-2 w-5 h-5 text-red-600">
          <span class="text-lg font-bold text-red-600">C</span>
          <span class="text-sm text-gray-600 ml-1">（努力を要する）</span>
        </label>
      </div>
      <textarea id="${key}_comment" rows="2" 
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="具体的な評価コメントを記入してください"
      >${comment}</textarea>
    </div>
  `
}

// 非認知能力評価レンダリング
function renderNonCognitiveEvaluation(label, key, data, description) {
  const value = data[key] || 0
  const comment = data[`${key}_comment`] || ''
  
  return `
    <div class="mb-6 pb-6 border-b border-gray-200">
      <label class="block text-sm font-bold text-gray-700 mb-1">${label}</label>
      <p class="text-xs text-gray-500 mb-2">${description}</p>
      <div class="flex items-center space-x-2 mb-2">
        ${[1, 2, 3, 4, 5].map(level => `
          <label class="flex flex-col items-center cursor-pointer">
            <input type="radio" name="${key}" value="${level}" ${value == level ? 'checked' : ''}
              class="mb-1 w-5 h-5">
            <span class="text-2xl">${['😢', '😕', '😊', '😄', '🤩'][level - 1]}</span>
            <span class="text-xs text-gray-600">${level}</span>
          </label>
        `).join('')}
      </div>
      <textarea id="${key}_comment" rows="2" 
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        placeholder="具体的な様子や成長を記入してください"
      >${comment}</textarea>
    </div>
  `
}

// レーダーチャート描画（簡易版）
function drawRadarChart(data) {
  // 実際の実装ではChart.jsを使用
  // ここでは簡易的なテキスト表示
  const canvas = document.getElementById('radarChart')
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  ctx.font = '14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('レーダーチャートはChart.jsで実装予定', canvas.width / 2, canvas.height / 2)
}

// 3観点評価保存
async function saveThreePointEvaluation(studentId, curriculumId, evaluationId) {
  const formData = {
    student_id: studentId,
    curriculum_id: curriculumId,
    knowledge_skill: document.querySelector('input[name="knowledge_skill"]:checked')?.value || '',
    knowledge_skill_comment: document.getElementById('knowledge_skill_comment').value,
    thinking_judgment: document.querySelector('input[name="thinking_judgment"]:checked')?.value || '',
    thinking_judgment_comment: document.getElementById('thinking_judgment_comment').value,
    attitude: document.querySelector('input[name="attitude"]:checked')?.value || '',
    attitude_comment: document.getElementById('attitude_comment').value,
    overall_comment: document.getElementById('overall_comment').value
  }
  
  try {
    if (evaluationId && evaluationId !== 'null') {
      await axios.put(`/api/evaluations/three-point/${evaluationId}`, formData)
    } else {
      await axios.post('/api/evaluations/three-point', formData)
    }
    
    alert('3観点評価を保存しました！')
  } catch (error) {
    console.error('Error saving three-point evaluation:', error)
    alert('保存に失敗しました')
  }
}

// 非認知能力評価保存
async function saveNonCognitiveEvaluation(studentId, curriculumId, evaluationId) {
  const formData = {
    student_id: studentId,
    curriculum_id: curriculumId,
    self_regulation: parseInt(document.querySelector('input[name="self_regulation"]:checked')?.value || 0),
    self_regulation_comment: document.getElementById('self_regulation_comment').value,
    motivation: parseInt(document.querySelector('input[name="motivation"]:checked')?.value || 0),
    motivation_comment: document.getElementById('motivation_comment').value,
    collaboration: parseInt(document.querySelector('input[name="collaboration"]:checked')?.value || 0),
    collaboration_comment: document.getElementById('collaboration_comment').value,
    metacognition: parseInt(document.querySelector('input[name="metacognition"]:checked')?.value || 0),
    metacognition_comment: document.getElementById('metacognition_comment').value,
    creativity: parseInt(document.querySelector('input[name="creativity"]:checked')?.value || 0),
    creativity_comment: document.getElementById('creativity_comment').value,
    curiosity: parseInt(document.querySelector('input[name="curiosity"]:checked')?.value || 0),
    curiosity_comment: document.getElementById('curiosity_comment').value,
    self_esteem: parseInt(document.querySelector('input[name="self_esteem"]:checked')?.value || 0),
    self_esteem_comment: document.getElementById('self_esteem_comment').value
  }
  
  try {
    if (evaluationId && evaluationId !== 'null') {
      await axios.put(`/api/evaluations/non-cognitive/${evaluationId}`, formData)
    } else {
      await axios.post('/api/evaluations/non-cognitive', formData)
    }
    
    alert('非認知能力評価を保存しました！')
  } catch (error) {
    console.error('Error saving non-cognitive evaluation:', error)
    alert('保存に失敗しました')
  }
}

// グローバル関数として公開
window.toggleTeacherMode = toggleTeacherMode
window.loadEnvironmentDesignPage = loadEnvironmentDesignPage
window.saveEnvironmentDesign = saveEnvironmentDesign
window.loadEvaluationPage = loadEvaluationPage
window.loadStudentEvaluation = loadStudentEvaluation
window.saveThreePointEvaluation = saveThreePointEvaluation
window.saveNonCognitiveEvaluation = saveNonCognitiveEvaluation

// ==================== 問題編集機能 ====================

// 学習カード編集ページ
async function loadCardEditPage(cardId) {
  state.currentView = 'card_edit'
  
  try {
    // カード詳細取得
    const cardResponse = await axios.get(`/api/cards/${cardId}`)
    const { card, hints } = cardResponse.data
    
    document.getElementById('app').innerHTML = `
      <!-- ヘッダー -->
      <div class="bg-white shadow-md p-4 mb-6">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button onclick="history.back()" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-left mr-2"></i>戻る
            </button>
            <h1 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>学習カード編集
            </h1>
          </div>
          <button onclick="previewCard(${cardId})" 
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <i class="fas fa-eye mr-2"></i>プレビュー
          </button>
        </div>
      </div>

      <div class="max-w-7xl mx-auto p-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 編集フォーム -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-file-alt mr-2"></i>学習カード内容
            </h2>
            
            <form id="cardEditForm">
              <!-- カードタイトル -->
              <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  カードタイトル
                </label>
                <input type="text" id="card_title" 
                  value="${card.card_title || ''}"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 10のまとまりでかける">
              </div>

              <!-- 新出語句・キーワード -->
              <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  新出語句・キーワード
                </label>
                <textarea id="new_terms" rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="新出語句をカンマ区切りで入力"
                >${card.new_terms || ''}</textarea>
                <p class="text-xs text-gray-500 mt-1">例: 10のまとまり, 位, 筆算</p>
              </div>

              <!-- 例題 -->
              <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  例題
                </label>
                <textarea id="example_problem" rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="例題を入力"
                >${card.example_problem || ''}</textarea>
              </div>

              <!-- 例題の解き方 -->
              <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  例題の解き方
                </label>
                <textarea id="example_solution" rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="解き方を入力"
                >${card.example_solution || ''}</textarea>
              </div>

              <!-- 問題文 -->
              <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  問題文
                </label>
                <textarea id="problem_description" rows="4"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="取り組む問題を入力"
                >${card.problem_description || ''}</textarea>
              </div>

              <!-- 実社会との関連 -->
              <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                  実社会との関連
                </label>
                <textarea id="real_world_connection" rows="2"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="実社会でどう使われるか"
                >${card.real_world_connection || ''}</textarea>
              </div>

              <!-- 保存ボタン -->
              <div class="flex justify-end space-x-4">
                <button type="button" onclick="history.back()" 
                  class="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                  キャンセル
                </button>
                <button type="submit" 
                  class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i class="fas fa-save mr-2"></i>保存
                </button>
              </div>
            </form>
          </div>

          <!-- ヒントカード編集 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-lightbulb mr-2"></i>ヒントカード（3段階）
            </h2>
            
            <div id="hintsEditor">
              ${renderHintsEditor(hints)}
            </div>

            <div class="flex justify-end mt-4">
              <button onclick="saveAllHints(${cardId})" 
                class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <i class="fas fa-save mr-2"></i>ヒント保存
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    
    // フォーム送信イベント
    document.getElementById('cardEditForm').addEventListener('submit', async (e) => {
      e.preventDefault()
      await saveCard(cardId)
    })
    
  } catch (error) {
    console.error('Error loading card edit page:', error)
    alert('カード編集ページの読み込みに失敗しました')
  }
}

// ヒントエディタレンダリング
function renderHintsEditor(hints) {
  const hintLevels = ['ヒント1（軽いヒント）', 'ヒント2（もう少し詳しく）', 'ヒント3（ほぼ答え）']
  const hintDescriptions = [
    '考える方向を示すヒント',
    '具体的な手順を示すヒント',
    '9割方答えられるヒント'
  ]
  
  let html = ''
  for (let i = 1; i <= 3; i++) {
    const hint = hints.find(h => h.hint_level === i) || {}
    html += `
      <div class="mb-6 pb-6 border-b border-gray-200">
        <h3 class="text-lg font-bold text-gray-700 mb-2">${hintLevels[i-1]}</h3>
        <p class="text-xs text-gray-500 mb-2">${hintDescriptions[i-1]}</p>
        
        <div class="mb-3">
          <label class="block text-sm font-bold text-gray-600 mb-1">ヒント内容</label>
          <textarea id="hint_${i}_text" rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="ヒント内容を入力"
          >${hint.hint_text || ''}</textarea>
        </div>
        
        <div>
          <label class="block text-sm font-bold text-gray-600 mb-1">思考ツールの提案</label>
          <input type="text" id="hint_${i}_tool"
            value="${hint.thinking_tool_suggestion || ''}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
            placeholder="例: 図に描いてみよう、表を作ってみよう">
        </div>
        
        <input type="hidden" id="hint_${i}_id" value="${hint.id || ''}">
      </div>
    `
  }
  
  return html
}

// カード保存
async function saveCard(cardId) {
  const formData = {
    card_title: document.getElementById('card_title').value,
    new_terms: document.getElementById('new_terms').value,
    example_problem: document.getElementById('example_problem').value,
    example_solution: document.getElementById('example_solution').value,
    problem_description: document.getElementById('problem_description').value,
    real_world_connection: document.getElementById('real_world_connection').value
  }
  
  try {
    await axios.put(`/api/cards/${cardId}`, formData)
    alert('学習カードを保存しました！')
  } catch (error) {
    console.error('Error saving card:', error)
    alert('保存に失敗しました')
  }
}

// 全ヒント保存
async function saveAllHints(cardId) {
  try {
    for (let i = 1; i <= 3; i++) {
      const hintId = document.getElementById(`hint_${i}_id`).value
      const hintData = {
        learning_card_id: cardId,
        hint_level: i,
        hint_text: document.getElementById(`hint_${i}_text`).value,
        thinking_tool_suggestion: document.getElementById(`hint_${i}_tool`).value
      }
      
      if (hintId) {
        // 更新
        await axios.put(`/api/hints/${hintId}`, hintData)
      } else {
        // 新規作成
        await axios.post('/api/hints', hintData)
      }
    }
    
    alert('ヒントカードを保存しました！')
  } catch (error) {
    console.error('Error saving hints:', error)
    alert('ヒントの保存に失敗しました')
  }
}

// プレビュー機能
async function previewCard(cardId) {
  // プレビューは新しいウィンドウまたはモーダルで表示
  const modalHtml = `
    <div id="previewModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-screen overflow-y-auto m-4">
        <div class="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 class="text-xl font-bold text-gray-800">
            <i class="fas fa-eye mr-2"></i>プレビュー
          </h2>
          <button onclick="closePreview()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <div id="previewContent" class="p-6">
          読み込み中...
        </div>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  // カード詳細を取得してプレビュー表示
  try {
    const response = await axios.get(`/api/cards/${cardId}`)
    const { card, hints } = response.data
    
    document.getElementById('previewContent').innerHTML = `
      <!-- 新出語句 -->
      ${card.new_terms ? `
        <div class="bg-yellow-50 rounded-lg p-4 mb-4">
          <h3 class="font-bold text-gray-800 mb-2">
            <i class="fas fa-book mr-2"></i>新出語句・キーワード
          </h3>
          <p class="text-gray-700">${card.new_terms}</p>
        </div>
      ` : ''}

      <!-- 例題 -->
      ${card.example_problem ? `
        <div class="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 class="font-bold text-gray-800 mb-2">
            <i class="fas fa-lightbulb mr-2"></i>例題
          </h3>
          <p class="text-gray-700 mb-2">${card.example_problem}</p>
          ${card.example_solution ? `
            <div class="bg-white rounded p-3 mt-2">
              <p class="text-sm font-bold text-blue-600 mb-1">解き方：</p>
              <p class="text-gray-700">${card.example_solution}</p>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- 問題文 -->
      <div class="bg-white border-2 border-blue-400 rounded-lg p-4 mb-4">
        <h3 class="font-bold text-gray-800 mb-2">
          <i class="fas fa-pencil-alt mr-2"></i>${card.card_title}
        </h3>
        <p class="text-gray-700 whitespace-pre-wrap">${card.problem_description || '問題文が設定されていません'}</p>
      </div>

      <!-- 実社会との関連 -->
      ${card.real_world_connection ? `
        <div class="bg-green-50 rounded-lg p-4 mb-4">
          <h3 class="font-bold text-gray-800 mb-2">
            <i class="fas fa-globe mr-2"></i>実社会との関連
          </h3>
          <p class="text-gray-700">${card.real_world_connection}</p>
        </div>
      ` : ''}

      <!-- ヒントカード -->
      <div class="bg-purple-50 rounded-lg p-4">
        <h3 class="font-bold text-gray-800 mb-3">
          <i class="fas fa-life-ring mr-2"></i>ヒントカード
        </h3>
        ${hints.map(hint => `
          <div class="bg-white rounded-lg p-3 mb-2">
            <p class="text-sm font-bold text-purple-600 mb-1">ヒント${hint.hint_level}:</p>
            <p class="text-gray-700 text-sm">${hint.hint_text || 'ヒントが設定されていません'}</p>
            ${hint.thinking_tool_suggestion ? `
              <p class="text-xs text-gray-500 mt-1">
                <i class="fas fa-tools mr-1"></i>${hint.thinking_tool_suggestion}
              </p>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `
  } catch (error) {
    console.error('Error loading preview:', error)
    document.getElementById('previewContent').innerHTML = '<p class="text-red-600">プレビューの読み込みに失敗しました</p>'
  }
}

// プレビューを閉じる
function closePreview() {
  const modal = document.getElementById('previewModal')
  if (modal) {
    modal.remove()
  }
}

// 学習カード管理ページ（コース別のカード一覧と編集）
async function loadCardManagementPage(courseId) {
  state.currentView = 'card_management'
  
  try {
    // コースの学習カード取得
    const response = await axios.get(`/api/courses/${courseId}/cards`)
    const cards = response.data
    
    document.getElementById('app').innerHTML = `
      <!-- ヘッダー -->
      <div class="bg-white shadow-md p-4 mb-6">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <button onclick="loadGuidePage(${state.selectedCurriculum.id})" class="text-blue-600 hover:text-blue-800">
              <i class="fas fa-arrow-left mr-2"></i>学習のてびきに戻る
            </button>
            <h1 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-tasks mr-2"></i>学習カード管理
            </h1>
          </div>
          <button onclick="addNewCard(${courseId})" 
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <i class="fas fa-plus mr-2"></i>新しいカードを追加
          </button>
        </div>
      </div>

      <div class="max-w-7xl mx-auto p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${cards.map(card => `
            <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
              <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-gray-800">
                  ${card.card_number}. ${card.card_title}
                </h3>
                <span class="text-xs px-2 py-1 rounded ${
                  card.card_type === 'basic' ? 'bg-green-100 text-green-800' :
                  card.card_type === 'advanced' ? 'bg-purple-100 text-purple-800' :
                  'bg-blue-100 text-blue-800'
                }">
                  ${card.card_type}
                </span>
              </div>
              
              <p class="text-sm text-gray-600 mb-4 line-clamp-2">
                ${card.problem_description || '問題文なし'}
              </p>
              
              <div class="flex space-x-2">
                <button onclick="loadCardEditPage(${card.id})" 
                  class="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
                  <i class="fas fa-edit mr-1"></i>編集
                </button>
                <button onclick="previewCard(${card.id})" 
                  class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                  <i class="fas fa-eye"></i>
                </button>
                <button onclick="deleteCard(${card.id}, ${courseId})" 
                  class="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  } catch (error) {
    console.error('Error loading card management page:', error)
    alert('カード管理ページの読み込みに失敗しました')
  }
}

// カード削除
async function deleteCard(cardId, courseId) {
  if (!confirm('このカードを削除してもよろしいですか？')) {
    return
  }
  
  try {
    await axios.delete(`/api/cards/${cardId}`)
    alert('カードを削除しました')
    loadCardManagementPage(courseId)
  } catch (error) {
    console.error('Error deleting card:', error)
    alert('削除に失敗しました')
  }
}

// 新規カード追加（プレースホルダー）
function addNewCard(courseId) {
  alert('新規カード追加機能は準備中です。\n現在は既存のカードの編集のみ対応しています。')
}

// コース選択（問題編集用）
async function showCourseSelectForEdit(curriculumId) {
  try {
    const response = await axios.get(`/api/curriculum/${curriculumId}`)
    const { courses } = response.data
    
    const modalHtml = `
      <div id="courseSelectModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-md m-4">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-lg">
            <h2 class="text-xl font-bold">
              <i class="fas fa-edit mr-2"></i>編集するコースを選択
            </h2>
          </div>
          <div class="p-6">
            <div class="space-y-3">
              ${courses.map(course => `
                <button onclick="closeCourseSelectModal(); loadCardManagementPage(${course.id})" 
                  class="w-full px-6 py-4 rounded-lg font-bold text-left transition ${
                    course.course_level === 'basic' ? 'bg-green-100 hover:bg-green-200 text-green-800' :
                    course.course_level === 'advanced' ? 'bg-purple-100 hover:bg-purple-200 text-purple-800' :
                    'bg-blue-100 hover:bg-blue-200 text-blue-800'
                  }">
                  <i class="fas fa-folder mr-2"></i>${course.course_display_name}
                </button>
              `).join('')}
            </div>
            <button onclick="closeCourseSelectModal()" 
              class="w-full mt-4 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              キャンセル
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  } catch (error) {
    console.error('Error showing course select:', error)
    alert('コース情報の読み込みに失敗しました')
  }
}

// コース選択モーダルを閉じる
function closeCourseSelectModal() {
  const modal = document.getElementById('courseSelectModal')
  if (modal) {
    modal.remove()
  }
}

// ============================================
// Phase 6: AI機能フル実装 - フロントエンド
// ============================================

// AI学習診断ページを読み込む
async function loadAIDiagnosisPage() {
  state.currentView = 'ai-diagnosis'
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="max-w-6xl mx-auto p-6">
      <!-- ヘッダー -->
      <div class="flex justify-between items-center mb-6">
        <button onclick="loadGuidePage(${state.selectedCurriculum.id})" 
                class="text-blue-600 hover:text-blue-800 flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
          戻る
        </button>
        <h1 class="text-3xl font-bold text-gray-800">
          <i class="fas fa-chart-line mr-2"></i>
          AI学習診断
        </h1>
        <div></div>
      </div>

      <!-- ローディング -->
      <div id="diagnosisLoading" class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
        <p class="text-gray-600">AIが学習状況を分析しています...</p>
      </div>

      <!-- 診断結果エリア -->
      <div id="diagnosisResult" class="hidden space-y-6"></div>
    </div>
  `
  
  // AI診断を実行
  try {
    const response = await axios.post('/api/ai/diagnosis', {
      studentId: state.student.id,
      curriculumId: state.selectedCurriculum.id
    })
    
    const diagnosis = response.data
    
    // ローディングを隠して結果を表示
    document.getElementById('diagnosisLoading').classList.add('hidden')
    const resultArea = document.getElementById('diagnosisResult')
    resultArea.classList.remove('hidden')
    
    resultArea.innerHTML = `
      <!-- 全体評価 -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-6 text-white shadow-lg">
        <h2 class="text-2xl font-bold mb-3">
          <i class="fas fa-star mr-2"></i>
          総合評価
        </h2>
        <p class="text-lg leading-relaxed">${diagnosis.overall_assessment || '評価を表示できません'}</p>
      </div>

      <!-- 励ましメッセージ -->
      ${diagnosis.encouragement ? `
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
        <p class="text-yellow-800 font-semibold">
          <i class="fas fa-smile mr-2"></i>
          ${diagnosis.encouragement}
        </p>
      </div>
      ` : ''}

      <!-- 3カラムレイアウト -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 強み -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-green-600 mb-4">
            <i class="fas fa-thumbs-up mr-2"></i>
            あなたの強み
          </h3>
          <ul class="space-y-2">
            ${(diagnosis.strengths || []).map(strength => `
              <li class="flex items-start">
                <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                <span class="text-gray-700">${strength}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- 改善点 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-orange-600 mb-4">
            <i class="fas fa-lightbulb mr-2"></i>
            もっと伸ばせるところ
          </h3>
          <ul class="space-y-2">
            ${(diagnosis.areas_for_improvement || []).map(area => `
              <li class="flex items-start">
                <i class="fas fa-arrow-up text-orange-500 mt-1 mr-2"></i>
                <span class="text-gray-700">${area}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- おすすめアクション -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-blue-600 mb-4">
            <i class="fas fa-rocket mr-2"></i>
            次にやること
          </h3>
          <div class="space-y-3">
            ${(diagnosis.recommendations || []).map(rec => `
              <div class="border-l-4 border-blue-400 pl-3 py-2">
                <p class="font-semibold text-gray-800">${rec.title}</p>
                <p class="text-sm text-gray-600 mt-1">${rec.description}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- アクションボタン -->
      <div class="flex justify-center space-x-4">
        <button onclick="loadAIProblemGenerator()" 
                class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition">
          <i class="fas fa-magic mr-2"></i>
          AI問題を生成する
        </button>
        <button onclick="loadAIPlanSuggestion()" 
                class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition">
          <i class="fas fa-calendar-alt mr-2"></i>
          学習計画を提案してもらう
        </button>
      </div>
    `
  } catch (error) {
    console.error('AI診断エラー:', error)
    document.getElementById('diagnosisLoading').innerHTML = `
      <div class="text-center text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p>診断を実行できませんでした。もう一度お試しください。</p>
      </div>
    `
  }
}

// AI問題生成ページを読み込む
async function loadAIProblemGenerator() {
  state.currentView = 'ai-problem-generator'
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="max-w-4xl mx-auto p-6">
      <!-- ヘッダー -->
      <div class="flex justify-between items-center mb-6">
        <button onclick="loadGuidePage(${state.selectedCurriculum.id})" 
                class="text-blue-600 hover:text-blue-800 flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
          戻る
        </button>
        <h1 class="text-3xl font-bold text-gray-800">
          <i class="fas fa-magic mr-2"></i>
          AI問題生成
        </h1>
        <div></div>
      </div>

      <!-- カード選択 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-tasks mr-2"></i>
          学習カードを選んでね
        </h2>
        <div id="cardSelector" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- カード一覧をここに表示 -->
        </div>
      </div>

      <!-- 難易度選択 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-sliders-h mr-2"></i>
          難易度を選んでね
        </h2>
        <div class="flex space-x-4">
          <button onclick="setDifficulty('easy')" 
                  class="difficulty-btn flex-1 bg-green-100 hover:bg-green-200 text-green-800 font-bold py-3 px-4 rounded-lg border-2 border-transparent transition"
                  data-difficulty="easy">
            <i class="fas fa-smile mr-2"></i>
            やさしい
          </button>
          <button onclick="setDifficulty('normal')" 
                  class="difficulty-btn flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-3 px-4 rounded-lg border-2 border-blue-500 transition"
                  data-difficulty="normal">
            <i class="fas fa-meh mr-2"></i>
            ふつう
          </button>
          <button onclick="setDifficulty('hard')" 
                  class="difficulty-btn flex-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold py-3 px-4 rounded-lg border-2 border-transparent transition"
                  data-difficulty="hard">
            <i class="fas fa-fire mr-2"></i>
            難しい
          </button>
        </div>
      </div>

      <!-- 生成ボタン -->
      <div class="text-center mb-6">
        <button onclick="generateProblem()" 
                id="generateBtn"
                class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
          <i class="fas fa-wand-magic-sparkles mr-2"></i>
          問題を生成する
        </button>
      </div>

      <!-- 生成された問題 -->
      <div id="generatedProblem" class="hidden"></div>
    </div>
  `
  
  // カード一覧を読み込む
  loadCardsForGenerator()
  
  // デフォルト難易度を設定
  state.selectedDifficulty = 'normal'
}

// カード一覧を読み込む（問題生成用）
async function loadCardsForGenerator() {
  try {
    const response = await axios.get(`/api/curriculum/${state.selectedCurriculum.id}`)
    const data = response.data
    
    const cardSelector = document.getElementById('cardSelector')
    
    // すべてのカードを表示
    const allCards = []
    data.courses.forEach(course => {
      course.cards.forEach(card => {
        allCards.push({ ...card, courseName: course.course_name })
      })
    })
    
    cardSelector.innerHTML = allCards.map(card => `
      <button onclick="selectCardForGeneration(${card.id})" 
              class="card-selector-btn text-left p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition"
              data-card-id="${card.id}">
        <div class="flex items-start">
          <span class="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded mr-2 mt-1">
            ${card.card_number}
          </span>
          <div>
            <p class="font-bold text-gray-800">${card.card_title}</p>
            <p class="text-xs text-gray-500 mt-1">${card.courseName}</p>
          </div>
        </div>
      </button>
    `).join('')
    
  } catch (error) {
    console.error('カード読み込みエラー:', error)
  }
}

// カードを選択（問題生成用）
function selectCardForGeneration(cardId) {
  state.selectedCardForGeneration = cardId
  
  // すべてのカードボタンをリセット
  document.querySelectorAll('.card-selector-btn').forEach(btn => {
    btn.classList.remove('border-purple-500', 'bg-purple-50')
    btn.classList.add('border-gray-200')
  })
  
  // 選択したカードをハイライト
  const selectedBtn = document.querySelector(`[data-card-id="${cardId}"]`)
  if (selectedBtn) {
    selectedBtn.classList.add('border-purple-500', 'bg-purple-50')
    selectedBtn.classList.remove('border-gray-200')
  }
}

// 難易度を設定
function setDifficulty(difficulty) {
  state.selectedDifficulty = difficulty
  
  // すべての難易度ボタンをリセット
  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'border-green-500', 'border-red-500')
    btn.classList.add('border-transparent')
  })
  
  // 選択した難易度をハイライト
  const selectedBtn = document.querySelector(`[data-difficulty="${difficulty}"]`)
  if (selectedBtn) {
    const color = difficulty === 'easy' ? 'green' : difficulty === 'hard' ? 'red' : 'blue'
    selectedBtn.classList.add(`border-${color}-500`)
    selectedBtn.classList.remove('border-transparent')
  }
}

// 問題を生成
async function generateProblem() {
  if (!state.selectedCardForGeneration) {
    alert('学習カードを選んでください')
    return
  }
  
  const generateBtn = document.getElementById('generateBtn')
  generateBtn.disabled = true
  generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>AIが問題を作っています...'
  
  try {
    const response = await axios.post('/api/ai/generate-problem', {
      cardId: state.selectedCardForGeneration,
      difficulty: state.selectedDifficulty || 'normal'
    })
    
    const problem = response.data
    
    // 生成された問題を表示
    const problemArea = document.getElementById('generatedProblem')
    problemArea.classList.remove('hidden')
    problemArea.innerHTML = `
      <div class="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white mb-4">
        <h2 class="text-2xl font-bold mb-4">
          <i class="fas fa-star mr-2"></i>
          AIが作った問題
        </h2>
        <div class="bg-white text-gray-800 rounded-lg p-6 mb-4">
          <p class="text-lg font-semibold mb-2">問題：</p>
          <p class="text-xl leading-relaxed">${problem.problem}</p>
        </div>
        
        <!-- 答えを表示/非表示 -->
        <div id="answerSection" class="hidden bg-white text-gray-800 rounded-lg p-6 mb-4">
          <p class="text-lg font-semibold text-green-600 mb-2">正解：</p>
          <p class="text-xl">${problem.answer}</p>
          ${problem.explanation ? `
            <div class="mt-4 border-t pt-4">
              <p class="text-sm font-semibold text-gray-600 mb-2">解き方：</p>
              <p class="text-sm text-gray-700">${problem.explanation}</p>
            </div>
          ` : ''}
        </div>
        
        <!-- ヒント表示 -->
        ${problem.hint ? `
        <div class="bg-yellow-100 text-yellow-800 rounded-lg p-4 mb-4">
          <p class="font-semibold mb-1">
            <i class="fas fa-lightbulb mr-2"></i>
            ヒント：
          </p>
          <p>${problem.hint}</p>
        </div>
        ` : ''}
        
        <!-- アクションボタン -->
        <div class="flex space-x-4">
          <button onclick="toggleAnswer()" 
                  class="bg-white text-purple-600 hover:bg-gray-100 font-bold py-2 px-4 rounded-lg transition">
            <i class="fas fa-eye mr-2"></i>
            答えを見る
          </button>
          <button onclick="generateProblem()" 
                  class="bg-white text-purple-600 hover:bg-gray-100 font-bold py-2 px-4 rounded-lg transition">
            <i class="fas fa-redo mr-2"></i>
            もう一問
          </button>
        </div>
      </div>
    `
    
    // ボタンを元に戻す
    generateBtn.disabled = false
    generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-2"></i>問題を生成する'
    
  } catch (error) {
    console.error('問題生成エラー:', error)
    alert('問題を生成できませんでした')
    generateBtn.disabled = false
    generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles mr-2"></i>問題を生成する'
  }
}

// 答えを表示/非表示
function toggleAnswer() {
  const answerSection = document.getElementById('answerSection')
  answerSection.classList.toggle('hidden')
}

// AI学習計画提案ページを読み込む
async function loadAIPlanSuggestion() {
  state.currentView = 'ai-plan-suggestion'
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="max-w-6xl mx-auto p-6">
      <!-- ヘッダー -->
      <div class="flex justify-between items-center mb-6">
        <button onclick="loadGuidePage(${state.selectedCurriculum.id})" 
                class="text-blue-600 hover:text-blue-800 flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
          戻る
        </button>
        <h1 class="text-3xl font-bold text-gray-800">
          <i class="fas fa-calendar-alt mr-2"></i>
          AI学習計画提案
        </h1>
        <div></div>
      </div>

      <!-- ローディング -->
      <div id="planLoading" class="text-center py-12">
        <i class="fas fa-spinner fa-spin text-4xl text-green-500 mb-4"></i>
        <p class="text-gray-600">AIがあなたに最適な学習計画を考えています...</p>
      </div>

      <!-- 提案結果エリア -->
      <div id="planResult" class="hidden space-y-6"></div>
    </div>
  `
  
  // AI計画提案を実行
  try {
    const response = await axios.post('/api/ai/suggest-plan', {
      studentId: state.student.id,
      curriculumId: state.selectedCurriculum.id
    })
    
    const plan = response.data
    
    // ローディングを隠して結果を表示
    document.getElementById('planLoading').classList.add('hidden')
    const resultArea = document.getElementById('planResult')
    resultArea.classList.remove('hidden')
    
    resultArea.innerHTML = `
      <!-- 全体提案 -->
      <div class="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
        <h2 class="text-2xl font-bold mb-3">
          <i class="fas fa-lightbulb mr-2"></i>
          おすすめの学習計画
        </h2>
        <p class="text-lg leading-relaxed">${plan.overall_suggestion || '提案を表示できません'}</p>
      </div>

      <!-- 2カラムレイアウト -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 日ごとの目標 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-blue-600 mb-4">
            <i class="fas fa-calendar-day mr-2"></i>
            日ごとの目標
          </h3>
          <div class="space-y-4">
            ${(plan.daily_goals || []).map(goal => `
              <div class="border-l-4 border-blue-400 pl-4 py-3 bg-blue-50 rounded-r">
                <p class="font-bold text-gray-800">${goal.day}</p>
                <p class="text-gray-700 mt-1">${goal.goal}</p>
                <p class="text-sm text-gray-500 mt-2">
                  <i class="fas fa-book-open mr-1"></i>
                  目安：${goal.cards}枚
                </p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 週ごとの目標 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-purple-600 mb-4">
            <i class="fas fa-calendar-week mr-2"></i>
            今週の目標
          </h3>
          <div class="space-y-3">
            ${(plan.weekly_goals || []).map(goal => {
              const priorityColor = goal.importance === 'high' ? 'red' : 
                                   goal.importance === 'medium' ? 'yellow' : 'green'
              const priorityLabel = goal.importance === 'high' ? '重要' : 
                                   goal.importance === 'medium' ? '普通' : '低'
              return `
                <div class="border rounded-lg p-4 hover:shadow-md transition">
                  <div class="flex items-start justify-between">
                    <p class="text-gray-800 flex-1">${goal.goal}</p>
                    <span class="bg-${priorityColor}-100 text-${priorityColor}-800 text-xs font-semibold px-2 py-1 rounded ml-2">
                      ${priorityLabel}
                    </span>
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
      </div>

      <!-- 学習のコツ -->
      ${(plan.tips && plan.tips.length > 0) ? `
      <div class="bg-yellow-50 rounded-lg shadow-md p-6">
        <h3 class="text-xl font-bold text-yellow-700 mb-4">
          <i class="fas fa-star mr-2"></i>
          学習のコツ
        </h3>
        <ul class="space-y-2">
          ${plan.tips.map(tip => `
            <li class="flex items-start">
              <i class="fas fa-check-circle text-yellow-500 mt-1 mr-2"></i>
              <span class="text-gray-700">${tip}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}

      <!-- アクションボタン -->
      <div class="flex justify-center space-x-4">
        <button onclick="loadLearningPlanPage()" 
                class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition">
          <i class="fas fa-table mr-2"></i>
          学習計画表を見る
        </button>
        <button onclick="loadAIDiagnosisPage()" 
                class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition">
          <i class="fas fa-chart-line mr-2"></i>
          学習診断を見る
        </button>
      </div>
    `
  } catch (error) {
    console.error('計画提案エラー:', error)
    document.getElementById('planLoading').innerHTML = `
      <div class="text-center text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p>計画を提案できませんでした。もう一度お試しください。</p>
      </div>
    `
  }
}

// AI誤答分析ページを読み込む（先生用）
async function loadAIErrorAnalysis() {
  state.currentView = 'ai-error-analysis'
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="max-w-6xl mx-auto p-6">
      <!-- ヘッダー -->
      <div class="flex justify-between items-center mb-6">
        <button onclick="loadProgressBoard(${state.selectedCurriculum.id})" 
                class="text-blue-600 hover:text-blue-800 flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
          進捗ボードに戻る
        </button>
        <h1 class="text-3xl font-bold text-gray-800">
          <i class="fas fa-microscope mr-2"></i>
          AI誤答分析（先生用）
        </h1>
        <div></div>
      </div>

      <!-- 生徒選択 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-user-graduate mr-2"></i>
          分析する生徒を選んでください
        </h2>
        <div id="studentSelector" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- 生徒一覧をここに表示 -->
        </div>
      </div>

      <!-- 分析結果エリア -->
      <div id="analysisResult" class="hidden space-y-6"></div>
    </div>
  `
  
  // 生徒一覧を読み込む
  loadStudentsForAnalysis()
}

// 生徒一覧を読み込む（分析用）
async function loadStudentsForAnalysis() {
  try {
    const response = await axios.get('/api/progress/curriculum/' + state.selectedCurriculum.id)
    const students = response.data.students
    
    const studentSelector = document.getElementById('studentSelector')
    studentSelector.innerHTML = students.map(student => `
      <button onclick="analyzeStudent(${student.id}, '${student.name}')" 
              class="p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition text-center">
        <i class="fas fa-user-circle text-4xl text-gray-400 mb-2"></i>
        <p class="font-bold text-gray-800">${student.name}</p>
      </button>
    `).join('')
  } catch (error) {
    console.error('生徒読み込みエラー:', error)
  }
}

// 生徒を分析
async function analyzeStudent(studentId, studentName) {
  const analysisResult = document.getElementById('analysisResult')
  analysisResult.classList.remove('hidden')
  analysisResult.innerHTML = `
    <div class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-orange-500 mb-4"></i>
      <p class="text-gray-600">${studentName}さんの学習データをAIが分析しています...</p>
    </div>
  `
  
  try {
    const response = await axios.post('/api/ai/analyze-errors', {
      studentId: studentId,
      curriculumId: state.selectedCurriculum.id
    })
    
    const analysis = response.data
    
    analysisResult.innerHTML = `
      <!-- 生徒名 -->
      <div class="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
        <h2 class="text-2xl font-bold mb-3">
          <i class="fas fa-user-circle mr-2"></i>
          ${studentName}さんの学習分析
        </h2>
        <p class="text-lg leading-relaxed">${analysis.overall_analysis || '分析を表示できません'}</p>
      </div>

      <!-- 3カラムレイアウト -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- つまずきパターン -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-red-600 mb-4">
            <i class="fas fa-exclamation-circle mr-2"></i>
            つまずきパターン
          </h3>
          <div class="space-y-3">
            ${(analysis.error_patterns || []).map(pattern => `
              <div class="border-l-4 border-red-400 pl-3 py-2">
                <p class="font-semibold text-gray-800">${pattern.pattern}</p>
                <p class="text-sm text-gray-600">${pattern.frequency}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 根本原因 -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-yellow-600 mb-4">
            <i class="fas fa-search mr-2"></i>
            根本原因
          </h3>
          <ul class="space-y-2">
            ${(analysis.root_causes || []).map(cause => `
              <li class="flex items-start">
                <i class="fas fa-arrow-right text-yellow-500 mt-1 mr-2"></i>
                <span class="text-gray-700">${cause}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <!-- 指導アドバイス -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-xl font-bold text-blue-600 mb-4">
            <i class="fas fa-chalkboard-teacher mr-2"></i>
            指導アドバイス
          </h3>
          <div class="space-y-3">
            ${(analysis.suggestions_for_teacher || []).map(suggestion => {
              const priorityColor = suggestion.priority === 'high' ? 'red' : 
                                   suggestion.priority === 'medium' ? 'yellow' : 'green'
              return `
                <div class="border rounded-lg p-3 bg-${priorityColor}-50">
                  <p class="text-gray-800 text-sm">${suggestion.suggestion}</p>
                </div>
              `
            }).join('')}
          </div>
        </div>
      </div>

      <!-- サポート方法 -->
      ${(analysis.support_strategies && analysis.support_strategies.length > 0) ? `
      <div class="bg-green-50 rounded-lg shadow-md p-6">
        <h3 class="text-xl font-bold text-green-700 mb-4">
          <i class="fas fa-hands-helping mr-2"></i>
          具体的なサポート方法
        </h3>
        <ul class="space-y-2">
          ${analysis.support_strategies.map(strategy => `
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
              <span class="text-gray-700">${strategy}</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
    `
  } catch (error) {
    console.error('分析エラー:', error)
    analysisResult.innerHTML = `
      <div class="text-center text-red-600 py-12">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p>分析を実行できませんでした。もう一度お試しください。</p>
      </div>
    `
  }
}

// グローバル関数として公開
window.loadCardEditPage = loadCardEditPage
window.loadCardManagementPage = loadCardManagementPage
window.previewCard = previewCard
window.closePreview = closePreview
window.saveCard = saveCard
window.saveAllHints = saveAllHints
window.deleteCard = deleteCard
window.addNewCard = addNewCard
window.showCourseSelectForEdit = showCourseSelectForEdit
window.closeCourseSelectModal = closeCourseSelectModal

// Phase 6: AI機能のグローバル関数
window.loadAIDiagnosisPage = loadAIDiagnosisPage
window.loadAIProblemGenerator = loadAIProblemGenerator
window.loadAIPlanSuggestion = loadAIPlanSuggestion
window.loadAIErrorAnalysis = loadAIErrorAnalysis
window.selectCardForGeneration = selectCardForGeneration
window.setDifficulty = setDifficulty
window.generateProblem = generateProblem
window.toggleAnswer = toggleAnswer
window.analyzeStudent = analyzeStudent

// ============================================
// Phase 7: AI単元自動生成システム
// ============================================

// AI単元生成モーダルを表示
function showUnitGeneratorModal() {
  const modal = document.createElement('div')
  modal.id = 'unitGeneratorModal'
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- ヘッダー -->
      <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white sticky top-0 z-10">
        <div class="flex justify-between items-center">
          <h2 class="text-3xl font-bold">
            <i class="fas fa-magic mr-2"></i>
            AI単元自動生成
          </h2>
          <button onclick="closeUnitGeneratorModal()" class="text-white hover:text-gray-200">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <p class="text-sm mt-2 opacity-90">
          AIが学習コンテンツを自動生成します（約30秒〜1分）
        </p>
      </div>

      <!-- フォーム -->
      <div class="p-8 space-y-6">
        <!-- 基本情報 -->
        <div class="bg-blue-50 rounded-lg p-6">
          <h3 class="text-xl font-bold text-blue-800 mb-4">
            <i class="fas fa-info-circle mr-2"></i>
            基本情報
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- 学年 -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">学年 *</label>
              <select id="genGrade" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none">
                <option value="">選択してください</option>
                <option value="小学1年">小学1年</option>
                <option value="小学2年">小学2年</option>
                <option value="小学3年">小学3年</option>
                <option value="小学4年">小学4年</option>
                <option value="小学5年">小学5年</option>
                <option value="小学6年">小学6年</option>
                <option value="中学1年">中学1年</option>
                <option value="中学2年">中学2年</option>
                <option value="中学3年">中学3年</option>
              </select>
            </div>

            <!-- 教科 -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">教科 *</label>
              <select id="genSubject" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none">
                <option value="">選択してください</option>
                <option value="算数">算数</option>
                <option value="数学">数学</option>
                <option value="国語">国語</option>
                <option value="理科">理科</option>
                <option value="社会">社会</option>
                <option value="英語">英語</option>
                <option value="生活">生活</option>
                <option value="音楽">音楽</option>
                <option value="図工">図工・美術</option>
                <option value="体育">体育</option>
                <option value="家庭科">家庭科</option>
                <option value="技術">技術</option>
                <option value="総合">総合的な学習</option>
                <option value="道徳">道徳</option>
              </select>
            </div>

            <!-- 教科書会社 -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">教科書会社 *</label>
              <select id="genTextbook" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none">
                <option value="">選択してください</option>
                <option value="東京書籍">東京書籍</option>
                <option value="啓林館">啓林館</option>
                <option value="大日本図書">大日本図書</option>
                <option value="学校図書">学校図書</option>
                <option value="教育出版">教育出版</option>
                <option value="日本文教出版">日本文教出版</option>
                <option value="光村図書">光村図書</option>
                <option value="帝国書院">帝国書院</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <!-- 単元名 -->
            <div class="md:col-span-2">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-bold text-gray-700">単元名 *</label>
                <button 
                  id="suggestUnitsBtn" 
                  onclick="suggestUnitNames()"
                  class="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition disabled:opacity-50"
                  disabled>
                  <i class="fas fa-lightbulb mr-1"></i>
                  AIで単元候補を表示
                </button>
              </div>
              <input type="text" id="genUnitName" 
                     placeholder="例: かけ算の筆算（または上のボタンで候補から選択）" 
                     list="unitDatalist"
                     class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none">
              <datalist id="unitDatalist"></datalist>
              <!-- 単元候補表示エリア -->
              <div id="unitSuggestions" class="mt-2 hidden">
                <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-sm font-bold text-purple-800">
                      <i class="fas fa-robot mr-1"></i>
                      AI推奨の単元候補
                    </p>
                    <span class="text-xs text-purple-600">クリックで選択</span>
                  </div>
                  <div id="unitSuggestionList" class="space-y-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- カスタマイズ（不登校・個別支援対応） -->
        <div class="bg-green-50 rounded-lg p-6">
          <h3 class="text-xl font-bold text-green-800 mb-4">
            <i class="fas fa-heart mr-2"></i>
            カスタマイズ（任意）
          </h3>
          <p class="text-sm text-gray-600 mb-4">
            子どもの状況や先生の願いを入力すると、より個別最適化された内容を生成します
          </p>

          <div class="space-y-4">
            <!-- 生徒の状況 -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">
                <i class="fas fa-child mr-1"></i>
                子どもの様子・特性
              </label>
              <textarea id="genStudentNeeds" rows="3" 
                        placeholder="例: 不登校で自宅学習中。ゆっくりペースで学びたい。図や絵があると理解しやすい。"
                        class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"></textarea>
            </div>

            <!-- 先生の願い -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">
                <i class="fas fa-bullseye mr-1"></i>
                先生の願い・重視したいこと
              </label>
              <textarea id="genTeacherGoals" rows="3" 
                        placeholder="例: 自信を持って学習に取り組めるようにしたい。実生活とのつながりを重視したい。"
                        class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"></textarea>
            </div>

            <!-- 学習スタイル -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">
                <i class="fas fa-palette mr-1"></i>
                学習スタイル
              </label>
              <select id="genLearningStyle" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none">
                <option value="">標準</option>
                <option value="視覚優位">視覚優位（図・絵が多い方が良い）</option>
                <option value="聴覚優位">聴覚優位（言葉での説明が良い）</option>
                <option value="体験重視">体験重視（実際に触れて学びたい）</option>
                <option value="ゆっくり">ゆっくりペース</option>
                <option value="発展的">発展的な内容にチャレンジ</option>
              </select>
            </div>

            <!-- 特別支援 -->
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">
                <i class="fas fa-hands-helping mr-1"></i>
                特別な配慮
              </label>
              <textarea id="genSpecialSupport" rows="2" 
                        placeholder="例: 読み書きが苦手なので、文章は短く。感覚過敏があるので穏やかな表現で。"
                        class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"></textarea>
            </div>
            
            <!-- AI品質モード -->
            <div class="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <label class="block text-sm font-bold text-gray-700 mb-3">
                <i class="fas fa-brain mr-1"></i>
                AI生成品質モード
              </label>
              <div class="space-y-3">
                <label class="flex items-start cursor-pointer hover:bg-blue-50 p-3 rounded-lg transition border-2 border-blue-200">
                  <input type="radio" name="qualityMode" value="standard" checked class="mt-1 mr-3">
                  <div>
                    <div class="font-bold text-blue-800">⚡ 標準モード（推奨）</div>
                    <div class="text-sm text-gray-700">Gemini 3 Flash - バランス重視</div>
                    <div class="text-xs text-blue-600 mt-1">
                      生成時間：約1分〜2分 | 3コース×6枚＝18枚のカード確実生成
                    </div>
                  </div>
                </label>
                <label class="flex items-start cursor-pointer hover:bg-purple-50 p-3 rounded-lg transition border-2 border-purple-200">
                  <input type="radio" name="qualityMode" value="high" class="mt-1 mr-3">
                  <div>
                    <div class="font-bold text-purple-800">🌟 確実モード（高品質）</div>
                    <div class="text-sm text-gray-700">Gemini 3 Pro - 最高品質・詳細説明</div>
                    <div class="text-xs text-purple-600 mt-1">
                      生成時間：約2分〜3分 | 複雑な単元・不登校支援・特別支援に最適
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- 生成ボタン -->
        <div class="flex space-x-4">
          <button onclick="closeUnitGeneratorModal()" 
                  class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 px-6 rounded-lg transition">
            <i class="fas fa-times mr-2"></i>
            キャンセル
          </button>
          <button onclick="startUnitGeneration()" 
                  id="generateUnitBtn"
                  class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition">
            <i class="fas fa-wand-magic-sparkles mr-2"></i>
            AIで生成開始
          </button>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  
  // 学年・教科・教科書会社が選択されたら単元候補ボタンを有効化
  const updateSuggestButton = () => {
    const grade = document.getElementById('genGrade').value
    const subject = document.getElementById('genSubject').value
    const textbook = document.getElementById('genTextbook').value
    const suggestBtn = document.getElementById('suggestUnitsBtn')
    
    if (grade && subject && textbook) {
      suggestBtn.disabled = false
    } else {
      suggestBtn.disabled = true
    }
  }
  
  document.getElementById('genGrade').addEventListener('change', updateSuggestButton)
  document.getElementById('genSubject').addEventListener('change', updateSuggestButton)
  document.getElementById('genTextbook').addEventListener('change', updateSuggestButton)
}

// モーダルを閉じる
function closeUnitGeneratorModal() {
  const modal = document.getElementById('unitGeneratorModal')
  if (modal) {
    modal.remove()
  }
}

// AI単元生成を開始
// AIで単元名候補を取得
async function suggestUnitNames() {
  const grade = document.getElementById('genGrade').value
  const subject = document.getElementById('genSubject').value
  const textbook = document.getElementById('genTextbook').value
  
  if (!grade || !subject || !textbook) {
    alert('学年・教科・教科書会社を選択してください')
    return
  }
  
  const suggestBtn = document.getElementById('suggestUnitsBtn')
  const suggestionArea = document.getElementById('unitSuggestions')
  const suggestionList = document.getElementById('unitSuggestionList')
  
  // ローディング表示
  suggestBtn.disabled = true
  suggestBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 生成中...'
  suggestionList.innerHTML = '<div class="text-center text-gray-500 py-2"><i class="fas fa-spinner fa-spin mr-2"></i>AIが単元候補を生成しています...</div>'
  suggestionArea.classList.remove('hidden')
  
  try {
    // Gemini APIで単元候補を取得
    const response = await axios.post('/api/ai/suggest-units', {
      grade,
      subject,
      textbook
    })
    
    if (response.data.error) {
      throw new Error(response.data.error)
    }
    
    const units = response.data.units || []
    
    if (units.length === 0) {
      suggestionList.innerHTML = '<p class="text-sm text-gray-600">候補が見つかりませんでした。手動で入力してください。</p>'
      return
    }
    
    // 単元候補を表示
    suggestionList.innerHTML = units.map((unit, index) => `
      <button 
        onclick="selectSuggestedUnit('${unit.replace(/'/g, "\\'")}', ${index + 1})"
        class="w-full text-left px-3 py-2 bg-white hover:bg-purple-100 border border-purple-200 rounded transition flex items-center justify-between group">
        <span class="text-sm text-gray-800">
          <span class="font-bold text-purple-600 mr-2">${index + 1}.</span>
          ${unit}
        </span>
        <i class="fas fa-chevron-right text-purple-400 opacity-0 group-hover:opacity-100 transition"></i>
      </button>
    `).join('')
    
    suggestBtn.innerHTML = '<i class="fas fa-lightbulb mr-1"></i> 再生成'
    suggestBtn.disabled = false
    
  } catch (error) {
    console.error('単元候補取得エラー:', error)
    suggestionList.innerHTML = '<p class="text-sm text-red-600"><i class="fas fa-exclamation-triangle mr-1"></i> エラーが発生しました。手動で入力してください。</p>'
    suggestBtn.innerHTML = '<i class="fas fa-lightbulb mr-1"></i> AIで単元候補を表示'
    suggestBtn.disabled = false
  }
}

// 候補から単元を選択
function selectSuggestedUnit(unitName, index) {
  document.getElementById('genUnitName').value = unitName
  
  // 選択した候補を強調表示
  const buttons = document.getElementById('unitSuggestionList').querySelectorAll('button')
  buttons.forEach((btn, i) => {
    if (i === index - 1) {
      btn.classList.add('bg-purple-200', 'border-purple-400')
      btn.classList.remove('bg-white', 'hover:bg-purple-100')
    } else {
      btn.classList.remove('bg-purple-200', 'border-purple-400')
      btn.classList.add('bg-white', 'hover:bg-purple-100')
    }
  })
}

async function startUnitGeneration() {
  const grade = document.getElementById('genGrade').value
  const subject = document.getElementById('genSubject').value
  const textbook = document.getElementById('genTextbook').value
  const unitName = document.getElementById('genUnitName').value

  // 必須項目チェック
  if (!grade || !subject || !textbook || !unitName) {
    alert('学年、教科、教科書会社、単元名は必須です')
    return
  }

  // カスタマイズ情報
  const customization = {
    studentNeeds: document.getElementById('genStudentNeeds').value,
    teacherGoals: document.getElementById('genTeacherGoals').value,
    learningStyle: document.getElementById('genLearningStyle').value,
    specialSupport: document.getElementById('genSpecialSupport').value
  }
  
  // 品質モード
  const qualityMode = document.querySelector('input[name="qualityMode"]:checked')?.value || 'standard'

  // モーダルを閉じる
  closeUnitGeneratorModal()

  // 生成プロセス画面を表示
  showGenerationProgress(grade, subject, unitName, qualityMode)

  try {
    // AI単元生成API呼び出し
    const response = await axios.post('/api/ai/generate-unit', {
      grade,
      subject,
      textbook,
      unitName,
      customization,
      qualityMode
    })

    if (response.data.error) {
      throw new Error(response.data.error)
    }

    // 生成成功
    const unitData = response.data.data
    const modelUsed = response.data.model_used

    // プレビュー画面を表示
    showUnitPreview(unitData, modelUsed)

  } catch (error) {
    console.error('単元生成エラー:', error)
    console.error('エラー詳細:', error.response?.data)
    
    // エラー詳細を取得
    const errorDetails = error.response?.data?.details || error.message || '不明なエラー'
    const errorMessage = error.response?.data?.error || '単元の生成に失敗しました'
    const validationErrors = error.response?.data?.validation_errors || []
    
    // エラー表示
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <div class="bg-white rounded-lg shadow-lg p-8">
          <div class="text-center mb-6">
            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">単元生成エラー</h2>
            <p class="text-gray-600 mb-4">
              ${errorMessage}
            </p>
          </div>
          
          <div class="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <h3 class="font-bold text-red-800 mb-2">
              <i class="fas fa-info-circle mr-2"></i>エラー詳細
            </h3>
            <p class="text-sm text-red-700 whitespace-pre-wrap">${errorDetails}</p>
            ${validationErrors.length > 0 ? `
              <div class="mt-4">
                <h4 class="font-bold text-red-800 mb-2">データ検証エラー:</h4>
                <ul class="list-disc list-inside text-sm text-red-700">
                  ${validationErrors.map(err => `<li>${err}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
          
          <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <h3 class="font-bold text-blue-800 mb-2">
              <i class="fas fa-lightbulb mr-2"></i>対処方法
            </h3>
            <ul class="text-sm text-blue-700 list-disc list-inside space-y-1">
              <li>もう一度お試しください（一時的なエラーの可能性があります）</li>
              <li>単元名を変えてみてください</li>
              <li>カスタマイズ内容を簡潔にしてください</li>
              <li>標準モードで試してみてください</li>
            </ul>
          </div>
          
          <div class="flex gap-4">
            <button onclick="renderTopPage()" 
                    class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg">
              <i class="fas fa-home mr-2"></i>
              トップページに戻る
            </button>
            <button onclick="showUnitGeneratorModal()" 
                    class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg">
              <i class="fas fa-redo mr-2"></i>
              もう一度生成する
            </button>
          </div>
        </div>
      </div>
    `
  }
}

// 生成プロセス表示
function showGenerationProgress(grade, subject, unitName, qualityMode = 'standard') {
  const modeLabel = qualityMode === 'high' ? '確実モード（Gemini 3 Pro）' : '標準モード（Gemini 3 Flash）'
  const estimatedTime = qualityMode === 'high' ? '約2〜3分' : '約1分〜2分'
  const totalTime = qualityMode === 'high' ? 180 : 100 // 秒単位
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <div class="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-2xl shadow-2xl p-8">
        
        <!-- ヘッダー -->
        <div class="text-center mb-8">
          <div class="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full mb-4 shadow-lg animate-pulse">
            <i class="fas fa-magic mr-2"></i>
            ✨ AI単元生成中 ✨
          </div>
          <h2 class="text-4xl font-bold text-gray-800 mb-3">
            ${grade} ${subject}
          </h2>
          <h3 class="text-2xl font-bold text-indigo-700 mb-4">
            「${unitName}」
          </h3>
          <div class="mt-3 inline-block bg-white border-2 border-purple-300 text-purple-700 px-6 py-2 rounded-full text-sm font-bold shadow">
            ${modeLabel} - ${estimatedTime}
          </div>
        </div>

        <!-- 現在の作業表示 -->
        <div class="max-w-3xl mx-auto mb-6">
          <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-indigo-200">
            <div class="flex items-center mb-3">
              <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4 animate-spin-slow">
                <i id="currentIcon" class="fas fa-lightbulb text-white text-xl"></i>
              </div>
              <div class="flex-1">
                <p class="text-sm text-gray-500 mb-1">いま作っているもの</p>
                <p id="currentTask" class="text-xl font-bold text-indigo-700">単元の目標を設計中...</p>
              </div>
            </div>
            <div id="taskComment" class="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
              💡 子どもたちがワクワクする単元目標を考えています
            </div>
          </div>
        </div>

        <!-- プログレスバー -->
        <div class="max-w-3xl mx-auto mb-8">
          <div class="bg-gray-200 rounded-full h-8 overflow-hidden shadow-inner">
            <div id="progressBar" class="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-full transition-all duration-300 flex items-center justify-end pr-3"
                 style="width: 0%">
              <span id="progressPercent" class="text-white font-bold text-sm"></span>
            </div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-gray-600">
            <span>開始</span>
            <span id="elapsedTime">0秒経過</span>
            <span>完成</span>
          </div>
        </div>

        <!-- 生成ステップ（横並び） -->
        <div class="max-w-4xl mx-auto mb-8">
          <div class="grid grid-cols-4 gap-3">
            <div id="step1" class="step-card bg-white rounded-xl p-4 shadow text-center border-2 border-gray-200 transition-all">
              <div class="text-3xl mb-2">🎯</div>
              <p class="font-bold text-gray-800 text-sm mb-1">目標設計</p>
              <p class="text-xs text-gray-500">単元目標</p>
              <div class="step-status mt-2 text-xs text-gray-400">待機中</div>
            </div>
            
            <div id="step2" class="step-card bg-white rounded-xl p-4 shadow text-center border-2 border-gray-200 transition-all">
              <div class="text-3xl mb-2">🎨</div>
              <p class="font-bold text-gray-800 text-sm mb-1">コース作成</p>
              <p class="text-xs text-gray-500">3コース設計</p>
              <div class="step-status mt-2 text-xs text-gray-400">待機中</div>
            </div>
            
            <div id="step3" class="step-card bg-white rounded-xl p-4 shadow text-center border-2 border-gray-200 transition-all">
              <div class="text-3xl mb-2">📚</div>
              <p class="font-bold text-gray-800 text-sm mb-1">カード生成</p>
              <p class="text-xs text-gray-500">18枚のカード</p>
              <div class="step-status mt-2 text-xs text-gray-400">待機中</div>
            </div>
            
            <div id="step4" class="step-card bg-white rounded-xl p-4 shadow text-center border-2 border-gray-200 transition-all">
              <div class="text-3xl mb-2">💡</div>
              <p class="font-bold text-gray-800 text-sm mb-1">ヒント作成</p>
              <p class="text-xs text-gray-500">54個のヒント</p>
              <div class="step-status mt-2 text-xs text-gray-400">待機中</div>
            </div>
          </div>
        </div>

        <!-- 励ましメッセージ -->
        <div class="max-w-3xl mx-auto">
          <div class="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 border-2 border-yellow-300 shadow-lg">
            <div class="flex items-start">
              <div class="text-4xl mr-4 animate-bounce">🤖</div>
              <div>
                <p class="font-bold text-orange-800 mb-2">AI先生より</p>
                <p id="encourageMessage" class="text-gray-700">
                  子どもたちが楽しく学べる単元を作っています。もう少しお待ちください！
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    
    <style>
      @keyframes spin-slow {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .animate-spin-slow {
        animation: spin-slow 3s linear infinite;
      }
      .step-card.active {
        border-color: #8b5cf6;
        background: linear-gradient(to bottom, #faf5ff, #ffffff);
        transform: scale(1.05);
      }
      .step-card.completed {
        border-color: #10b981;
        background: linear-gradient(to bottom, #d1fae5, #ffffff);
      }
    </style>
  `

  // 実時間ベースのプログレスアニメーション
  animateRealtimeProgress(totalTime, qualityMode)
}

// 実時間ベースのプログレスアニメーション
function animateRealtimeProgress(totalTime, qualityMode) {
  const startTime = Date.now()
  
  // ステップ定義（実時間配分）
  const steps = [
    {
      id: 1,
      startPercent: 0,
      endPercent: 15,
      icon: 'fa-lightbulb',
      task: '単元の目標を設計中...',
      comment: '💡 子どもたちがワクワクする単元目標を考えています',
      emoji: '🎯'
    },
    {
      id: 2,
      startPercent: 15,
      endPercent: 30,
      icon: 'fa-route',
      task: '3つのコースを作成中...',
      comment: '🎨 ゆっくり・しっかり・どんどんコースを設計しています',
      emoji: '🎨'
    },
    {
      id: 3,
      startPercent: 30,
      endPercent: 75,
      icon: 'fa-cards',
      task: '18枚の学習カードを生成中...',
      comment: '📚 各コース6枚ずつ、合計18枚のカードを作っています',
      emoji: '📚'
    },
    {
      id: 4,
      startPercent: 75,
      endPercent: 100,
      icon: 'fa-comment-dots',
      task: '54個のヒントカードを作成中...',
      comment: '💡 各カードに3段階のヒントを用意しています',
      emoji: '💡'
    }
  ]
  
  // 励ましメッセージ
  const encourageMessages = [
    '子どもたちが楽しく学べる単元を作っています。もう少しお待ちください！',
    'AIが一生懸命、学習カードを作っています。完成まであと少し！',
    '各コースに魅力的な問題を用意しています。ワクワクする内容になりますよ！',
    'ヒントカードも充実させています。子どもたちが自分で考えられるように！'
  ]
  
  let currentStepIndex = 0
  
  const interval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000 // 秒
    const progress = Math.min((elapsed / totalTime) * 100, 99) // 99%まで
    
    // プログレスバー更新
    const progressBar = document.getElementById('progressBar')
    const progressPercent = document.getElementById('progressPercent')
    const elapsedTime = document.getElementById('elapsedTime')
    
    if (progressBar) {
      progressBar.style.width = progress + '%'
      progressPercent.textContent = Math.floor(progress) + '%'
      elapsedTime.textContent = Math.floor(elapsed) + '秒経過'
    }
    
    // 現在のステップを判定
    const currentStep = steps.find((step, index) => {
      return progress >= step.startPercent && progress < step.endPercent
    })
    
    if (currentStep && currentStepIndex !== currentStep.id - 1) {
      currentStepIndex = currentStep.id - 1
      
      // 現在のタスク表示更新
      document.getElementById('currentIcon').className = `fas ${currentStep.icon} text-white text-xl`
      document.getElementById('currentTask').textContent = currentStep.task
      document.getElementById('taskComment').innerHTML = currentStep.comment
      
      // ステップカード更新
      steps.forEach((step, index) => {
        const stepCard = document.getElementById(`step${step.id}`)
        const statusDiv = stepCard.querySelector('.step-status')
        
        if (index < currentStepIndex) {
          stepCard.className = 'step-card bg-white rounded-xl p-4 shadow text-center border-2 transition-all completed'
          statusDiv.textContent = '✅ 完了'
          statusDiv.className = 'step-status mt-2 text-xs text-green-600 font-bold'
        } else if (index === currentStepIndex) {
          stepCard.className = 'step-card bg-white rounded-xl p-4 shadow text-center border-2 transition-all active'
          statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 作業中'
          statusDiv.className = 'step-status mt-2 text-xs text-purple-600 font-bold'
        }
      })
      
      // 励ましメッセージ更新
      if (encourageMessages[currentStepIndex]) {
        document.getElementById('encourageMessage').textContent = encourageMessages[currentStepIndex]
      }
    }
    
    // 100%到達したらクリア
    if (progress >= 99) {
      clearInterval(interval)
    }
  }, 100) // 100msごとに更新
}

// プログレス アニメーション（旧版 - 削除予定）
function animateProgress() {
  let progress = 10
  const interval = setInterval(() => {
    progress += Math.random() * 15
    if (progress > 90) progress = 90
    
    const bar = document.getElementById('progressBar')
    if (bar) {
      bar.style.width = progress + '%'
    }
    
    // ステップ更新
    if (progress > 25) {
      updateStep('step1', '完了', true)
    }
    if (progress > 50) {
      updateStep('step2', '完了', true)
    }
    if (progress > 75) {
      updateStep('step3', '完了', true)
    }
  }, 500)

  // タイムアウト（60秒）
  setTimeout(() => {
    clearInterval(interval)
  }, 60000)
}

// ステップ更新
function updateStep(stepId, status, completed) {
  const step = document.getElementById(stepId)
  if (step && completed) {
    step.classList.remove('opacity-50')
    step.classList.add('bg-green-50')
    const icon = step.querySelector('i')
    icon.className = 'fas fa-check-circle text-green-600 text-2xl mr-4'
    const statusText = step.querySelector('.text-sm')
    statusText.textContent = status
  }
}

// 単元プレビュー表示
function showUnitPreview(unitData, modelUsed) {
  const curriculum = unitData.curriculum
  const courses = unitData.courses || []
  const optionalProblems = unitData.optional_problems || []

  const totalCards = courses.reduce((sum, course) => sum + (course.cards?.length || 0), 0)
  const totalHints = courses.reduce((sum, course) => {
    return sum + (course.cards || []).reduce((hintSum, card) => {
      return hintSum + (card.hints?.length || 0)
    }, 0)
  }, 0)

  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <!-- ヘッダー -->
      <div class="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-lg p-8 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm mb-2">
              <i class="fas fa-check-circle mr-1"></i>
              生成完了
            </div>
            <h1 class="text-4xl font-bold mb-2">
              ${curriculum.unit_name}
            </h1>
            <p class="text-lg opacity-90">
              ${curriculum.grade} ${curriculum.subject} / ${curriculum.textbook_company}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm opacity-75">使用モデル</p>
            <p class="font-bold">${modelUsed}</p>
          </div>
        </div>
      </div>

      <!-- サマリー -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-layer-group text-4xl text-blue-500 mb-2"></i>
          <p class="text-3xl font-bold text-gray-800">${courses.length}</p>
          <p class="text-gray-600">コース</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-book text-4xl text-green-500 mb-2"></i>
          <p class="text-3xl font-bold text-gray-800">${totalCards}</p>
          <p class="text-gray-600">学習カード</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6 text-center">
          <i class="fas fa-lightbulb text-4xl text-yellow-500 mb-2"></i>
          <p class="text-3xl font-bold text-gray-800">${totalHints}</p>
          <p class="text-gray-600">ヒントカード</p>
        </div>
      </div>

      <!-- 単元の目標 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-bullseye mr-2"></i>
          単元の目標
        </h2>
        <div class="space-y-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm font-bold text-blue-800 mb-2">学習目標</p>
            <p class="text-gray-800">${curriculum.unit_goal}</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-sm font-bold text-green-800 mb-2">心の成長目標（非認知能力）</p>
            <p class="text-gray-800">${curriculum.non_cognitive_goal}</p>
          </div>
        </div>
      </div>

      <!-- コース一覧 -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-route mr-2"></i>
          学習コース
        </h2>
        <div class="space-y-4">
          ${courses.map((course, index) => `
            <div class="border-2 border-${course.color_code}-300 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="text-xl font-bold text-${course.color_code}-800">
                  ${course.course_name}
                </h3>
                <span class="bg-${course.color_code}-100 text-${course.color_code}-800 px-3 py-1 rounded-full text-sm font-bold">
                  ${course.cards?.length || 0}枚
                </span>
              </div>
              <p class="text-gray-600 mb-3">${course.description}</p>
              
              <!-- カード一覧（折りたたみ） -->
              <details class="mt-3">
                <summary class="cursor-pointer text-sm text-${course.color_code}-600 hover:text-${course.color_code}-800 font-semibold">
                  カード一覧を表示 ▼
                </summary>
                <div class="mt-3 space-y-2 pl-4">
                  ${(course.cards || []).map(card => `
                    <div class="border-l-4 border-${course.color_code}-300 pl-3 py-2 bg-gray-50 rounded hover:bg-gray-100 transition">
                      <div class="flex items-center justify-between">
                        <div class="flex-1">
                          <p class="font-semibold text-gray-800">
                            <span class="text-${course.color_code}-600">${card.card_number}.</span>
                            ${card.card_title}
                          </p>
                          <p class="text-xs text-gray-500 mt-1">
                            ヒント ${card.hints?.length || 0}段階
                          </p>
                        </div>
                        <button onclick='showCardDetail(${JSON.stringify(card).replace(/'/g, "\\'")})'
                                class="ml-3 bg-${course.color_code}-500 hover:bg-${course.color_code}-600 text-white px-3 py-1 rounded text-sm font-semibold transition">
                          <i class="fas fa-eye mr-1"></i>
                          詳細
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </details>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- アクションボタン -->
      <div class="flex flex-col space-y-3">
        <!-- 教師用：全体確認・編集ボタン -->
        <button onclick="showTeacherOverview(${JSON.stringify(unitData).replace(/"/g, '&quot;')})"
                class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg">
          <i class="fas fa-edit mr-2"></i>
          👨‍🏫 教師用：全体を確認・編集する
        </button>
        <button onclick="showPrintPreview(${JSON.stringify(unitData).replace(/"/g, '&quot;')})" 
                class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg">
          <i class="fas fa-print mr-2"></i>
          印刷用プレビュー（回答欄付き）
        </button>
        <div class="flex space-x-4">
          <button onclick="renderTopPage()" 
                  class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 px-6 rounded-lg transition">
            <i class="fas fa-times mr-2"></i>
            破棄してトップへ
          </button>
          <button onclick="saveGeneratedUnit(${JSON.stringify(unitData).replace(/"/g, '&quot;')})" 
                  class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg">
            <i class="fas fa-save mr-2"></i>
            この単元を保存して使用する
          </button>
        </div>
      </div>
    </div>
  `
}

// 生成した単元を保存
async function saveGeneratedUnit(unitData) {
  // ボタンを無効化してローディング表示
  const saveButton = event.target
  const originalHTML = saveButton.innerHTML
  saveButton.disabled = true
  saveButton.innerHTML = `
    <i class="fas fa-spinner fa-spin mr-2"></i>
    保存中...
  `
  
  try {
    const response = await axios.post('/api/curriculum/save-generated', unitData)
    
    if (response.data.success) {
      const curriculumId = response.data.curriculum_id
      
      // 保存成功表示
      saveButton.innerHTML = `
        <i class="fas fa-check-circle mr-2"></i>
        保存完了！
      `
      saveButton.className = 'flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg'
      
      console.log('✅ 単元を保存しました。curriculum_id:', curriculumId)
      console.log('📊 保存されたデータ:', response.data.saved_data)
      
      // 保存完了表示を維持
      saveButton.innerHTML = `
        <i class="fas fa-check-circle mr-2"></i>
        保存完了！
      `
      
      console.log('✅ 単元を保存しました。curriculum_id:', curriculumId)
      console.log('📊 保存されたデータ:', response.data.saved_data)
      
      // 追加問題を並列生成（必須）
      console.log('🔄 追加問題生成を開始... curriculum_id:', curriculumId)
      
      saveButton.innerHTML = `
        <i class="fas fa-spinner fa-spin mr-2"></i>
        追加問題を生成中... (0/3)
      `
      
      try {
        console.log('🌐 API呼び出し準備完了')
        
        // 3つのAPIを並列実行
        const apiCalls = [
          axios.post(`/api/curriculum/${curriculumId}/generate-course-problems`).catch(e => { console.error('🔴 API1エラー:', e); throw e; }),
          axios.post(`/api/curriculum/${curriculumId}/generate-assessment-problems`).catch(e => { console.error('🔴 API2エラー:', e); throw e; }),
          axios.post(`/api/curriculum/${curriculumId}/generate-intro-problems`).catch(e => { console.error('🔴 API3エラー:', e); throw e; })
        ]
        
        console.log('🚀 API並列実行開始...')
        const [courseProblems, assessmentProblems, introProblems] = await Promise.allSettled(apiCalls)
        console.log('✅ API並列実行完了')
        
        const courseSuccess = courseProblems.status === 'fulfilled'
        const assessmentSuccess = assessmentProblems.status === 'fulfilled'
        const introSuccess = introProblems.status === 'fulfilled'
        
        console.log('✅ コース選択問題:', courseSuccess ? '成功' : '失敗')
        if (courseSuccess) {
          console.log('   レスポンス:', courseProblems.value?.data)
        } else {
          console.error('   エラー詳細:', courseProblems.reason?.response?.data || courseProblems.reason?.message || courseProblems.reason)
        }
        
        console.log('✅ 評価問題:', assessmentSuccess ? '成功' : '失敗')
        if (assessmentSuccess) {
          console.log('   レスポンス:', assessmentProblems.value?.data)
        } else {
          console.error('   エラー詳細:', assessmentProblems.reason?.response?.data || assessmentProblems.reason?.message || assessmentProblems.reason)
        }
        
        console.log('✅ 導入問題:', introSuccess ? '成功' : '失敗')
        if (introSuccess) {
          console.log('   レスポンス:', introProblems.value?.data)
        } else {
          console.error('   エラー詳細:', introProblems.reason?.response?.data || introProblems.reason?.message || introProblems.reason)
        }
        
        if (courseSuccess && assessmentSuccess && introSuccess) {
          saveButton.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            すべて完了！
          `
          console.log('🎉 すべての追加問題が正常に生成されました')
        } else {
          const failed = []
          const success = []
          
          if (!courseSuccess) {
            failed.push('コース選択問題')
          } else {
            success.push('コース選択問題')
          }
          
          if (!assessmentSuccess) {
            failed.push('選択問題・チェックテスト')
          } else {
            success.push('選択問題・チェックテスト')
          }
          
          if (!introSuccess) {
            failed.push('導入問題')
          } else {
            success.push('導入問題')
          }
          
          saveButton.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            ${success.length > 0 ? success.length + '/' + (success.length + failed.length) + ' 完了' : '一部未生成'}
          `
          
          console.warn('⚠️ 一部の追加問題生成に失敗:', failed)
          console.log('✅ 生成成功:', success)
          
          // 重要: アラートは表示せず、学習のてびきで自動補完に任せる
          console.info('💡 失敗した問題は「学習のてびき」画面で自動補完されます')
        }
      } catch (additionalError) {
        console.error('❌ 追加問題生成エラー:', additionalError)
        saveButton.innerHTML = `
          <i class="fas fa-exclamation-triangle mr-2"></i>
          追加問題未生成
        `
        alert('❌ 追加問題の生成に失敗しました。\n\nもう一度新しい単元を生成してください。')
      }
      
      // 学習のてびきページへ遷移
      setTimeout(() => {
        loadGuidePage(curriculumId)
      }, 1500)
    } else {
      const errorMsg = response.data.details || response.data.error || '保存に失敗しました'
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error('単元保存エラー:', error)
    const errorDetails = error.response?.data?.details || error.message || '不明なエラー'
    
    // エラー表示
    saveButton.innerHTML = `
      <i class="fas fa-exclamation-circle mr-2"></i>
      保存失敗
    `
    saveButton.className = 'flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg'
    
    alert(`❌ 単元の保存に失敗しました。\n\nエラー: ${errorDetails}\n\nもう一度お試しください。`)
    
    // 2秒後にボタンを元に戻す
    setTimeout(() => {
      saveButton.disabled = false
      saveButton.innerHTML = originalHTML
      saveButton.className = 'flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg'
    }, 2000)
  }
}

// Phase 7: グローバル関数
window.showUnitGeneratorModal = showUnitGeneratorModal
window.closeUnitGeneratorModal = closeUnitGeneratorModal
window.startUnitGeneration = startUnitGeneration
window.saveGeneratedUnit = saveGeneratedUnit

// 学習カード詳細表示モーダル
function showCardDetail(card) {
  // 学習カード開始時刻を記録
  startCardTiming()
  
  // モーダルHTML
  const modalHTML = `
    <div id="cardDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onclick="closeCardDetail(event)">
      <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onclick="event.stopPropagation()">
        <!-- ヘッダー -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm opacity-75 mb-1">カード ${card.card_number}</div>
              <h2 class="text-2xl font-bold">${card.card_title}</h2>
              <div class="mt-2 inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                ${card.card_type === 'main' ? '📘 メインカード' : card.card_type === 'practice' ? '✏️ 練習カード' : '🚀 チャレンジカード'}
              </div>
            </div>
            <button onclick="closeCardDetail()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
        </div>

        <!-- タブナビゲーション -->
        <div class="bg-gray-100 border-b border-gray-300 flex">
          <button onclick="switchCardTab('problem')" id="tab-problem" 
                  class="flex-1 px-6 py-4 font-bold text-center transition border-b-4 border-blue-600 bg-white text-blue-600">
            <i class="fas fa-tasks mr-2"></i>問題
          </button>
          <button onclick="switchCardTab('hints')" id="tab-hints" 
                  class="flex-1 px-6 py-4 font-bold text-center transition border-b-4 border-transparent hover:bg-gray-50 text-gray-600">
            <i class="fas fa-lightbulb mr-2"></i>ヒント
          </button>
          <button onclick="switchCardTab('answer')" id="tab-answer" 
                  class="flex-1 px-6 py-4 font-bold text-center transition border-b-4 border-transparent hover:bg-gray-50 text-gray-600">
            <i class="fas fa-check-circle mr-2"></i>解答
          </button>
          <button onclick="switchCardTab('explanation')" id="tab-explanation" 
                  class="flex-1 px-6 py-4 font-bold text-center transition border-b-4 border-transparent hover:bg-gray-50 text-gray-600">
            <i class="fas fa-book-open mr-2"></i>解説
          </button>
        </div>

        <!-- タブコンテンツ -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- 問題タブ -->
          <div id="content-problem" class="tab-content space-y-6">
          <!-- 問題説明 -->
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <h3 class="font-bold text-blue-800 mb-2 flex items-center">
              <i class="fas fa-tasks mr-2"></i>
              問題・課題
            </h3>
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <h3 class="font-bold text-blue-800 mb-2 flex items-center">
                <i class="fas fa-tasks mr-2"></i>
                問題・課題
              </h3>
              ${state.auth.user?.role === 'teacher' ? `
                <button onclick="editCardImageUrl(${card.id}, 'problem')" 
                        class="mb-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  <i class="fas fa-image mr-1"></i>
                  ${card.problem_image_url ? '画像URLを編集' : '画像URLを追加'}
                </button>
              ` : ''}
              ${card.problem_image_url ? `
                <div class="mb-4 text-center">
                  <img src="${card.problem_image_url}" alt="問題画像" class="max-w-full h-auto rounded-lg shadow-md mx-auto" style="max-height: 400px;">
                </div>
              ` : ''}
              <p class="text-gray-800 whitespace-pre-wrap text-lg">${card.problem_description || 'なし'}</p>
            </div>

            <!-- 新出用語 -->
            ${card.new_terms ? `
              <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <h3 class="font-bold text-green-800 mb-2 flex items-center">
                  <i class="fas fa-book mr-2"></i>
                  新しく出てくる言葉
                </h3>
                <p class="text-gray-800">${card.new_terms}</p>
              </div>
            ` : ''}

            <!-- 例題 -->
            ${card.example_problem ? `
              <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <h3 class="font-bold text-yellow-800 mb-2 flex items-center">
                  <i class="fas fa-pencil-alt mr-2"></i>
                  例題
                </h3>
                <p class="text-gray-800 mb-3">${card.example_problem}</p>
              </div>
            ` : ''}

            <!-- 実社会とのつながり -->
            ${card.real_world_connection ? `
              <div class="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <h3 class="font-bold text-purple-800 mb-2 flex items-center">
                  <i class="fas fa-globe mr-2"></i>
                  実社会とのつながり
                </h3>
                <p class="text-gray-800">${card.real_world_connection}</p>
              </div>
            ` : ''}
          </div>

          <!-- ヒントタブ -->
          <div id="content-hints" class="tab-content space-y-4 hidden">
            ${card.hints && card.hints.length > 0 ? `
              <div class="space-y-4">
                ${card.hints.map((hint, index) => `
                  <div class="bg-gradient-to-r from-pink-50 to-yellow-50 p-6 rounded-xl border-2 border-pink-200 shadow-md">
                    <div class="flex items-center mb-3">
                      <span class="bg-gradient-to-r from-pink-500 to-yellow-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl mr-3">
                        ${hint.hint_level}
                      </span>
                      <span class="font-bold text-lg text-gray-800">
                        ${hint.hint_level === 1 ? '🤔 まず考えてほしいこと' : hint.hint_level === 2 ? '💡 中間ヒント' : '✨ 答えに近いヒント'}
                      </span>
                    </div>
                    <p class="text-gray-800 text-lg ml-15 mb-3">${hint.hint_text}</p>
                    ${hint.thinking_tool_suggestion ? `
                      <div class="ml-15 bg-white p-3 rounded-lg border-2 border-yellow-300">
                        <p class="text-sm font-bold text-yellow-700 mb-1">
                          <i class="fas fa-tools mr-1"></i>使える思考ツール
                        </p>
                        <p class="text-gray-700">${hint.thinking_tool_suggestion}</p>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-12 text-gray-500">
                <i class="fas fa-lightbulb text-6xl mb-4 opacity-30"></i>
                <p class="text-lg">ヒントはありません</p>
              </div>
            `}
          </div>

          <!-- 解答タブ -->
          <div id="content-answer" class="tab-content space-y-4 hidden">
            ${card.answer || card.example_solution ? `
              <div class="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-400 p-6 rounded-xl shadow-lg">
                <h3 class="font-bold text-green-800 mb-4 flex items-center text-xl">
                  <i class="fas fa-check-circle mr-2 text-2xl"></i>
                  解答
                </h3>
                <div class="bg-white p-6 rounded-lg border-2 border-green-200">
                  ${state.auth.user?.role === 'teacher' ? `
                    <button onclick="editCardImageUrl(${card.id}, 'answer')" 
                            class="mb-3 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      <i class="fas fa-image mr-1"></i>
                      ${card.answer_image_url ? '画像URLを編集' : '画像URLを追加'}
                    </button>
                  ` : ''}
                  ${card.answer_image_url ? `
                    <div class="mb-4 text-center">
                      <img src="${card.answer_image_url}" alt="解答画像" class="max-w-full h-auto rounded-lg shadow-md mx-auto" style="max-height: 400px;">
                    </div>
                  ` : ''}
                  <p class="text-gray-800 text-lg whitespace-pre-wrap">${card.answer || card.example_solution}</p>
                </div>
              </div>
            ` : `
              <div class="text-center py-12 text-gray-500">
                <i class="fas fa-times-circle text-6xl mb-4 opacity-30"></i>
                <p class="text-lg">解答は準備中です</p>
              </div>
            `}
          </div>

          <!-- 解説タブ -->
          <div id="content-explanation" class="tab-content space-y-4 hidden">
            ${card.example_solution ? `
              <div class="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-400 p-6 rounded-xl shadow-lg">
                <h3 class="font-bold text-blue-800 mb-4 flex items-center text-xl">
                  <i class="fas fa-book-open mr-2 text-2xl"></i>
                  解き方・考え方
                </h3>
                <div class="bg-white p-6 rounded-lg border-2 border-blue-200">
                  <p class="text-gray-800 text-lg whitespace-pre-wrap">${card.example_solution}</p>
                </div>
              </div>
            ` : ''}
            
            ${card.real_world_connection ? `
              <div class="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-400 p-6 rounded-xl shadow-lg">
                <h3 class="font-bold text-purple-800 mb-4 flex items-center text-xl">
                  <i class="fas fa-globe mr-2 text-2xl"></i>
                  実社会とのつながり
                </h3>
                <div class="bg-white p-6 rounded-lg border-2 border-purple-200">
                  <p class="text-gray-800 text-lg whitespace-pre-wrap">${card.real_world_connection}</p>
                </div>
              </div>
            ` : ''}
            
            ${!card.example_solution && !card.real_world_connection ? `
              <div class="text-center py-12 text-gray-500">
                <i class="fas fa-book-open text-6xl mb-4 opacity-30"></i>
                <p class="text-lg">解説は準備中です</p>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- フッター -->
        <div class="bg-gray-50 p-4 border-t flex gap-3">
          <button onclick="generateSimilarProblem(${card.id})" 
                  class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg">
            <i class="fas fa-redo mr-2"></i>
            もう1問練習する
          </button>
          <button onclick="closeCardDetail()" 
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
            <i class="fas fa-check mr-2"></i>
            閉じる
          </button>
        </div>
      </div>
    </div>
  `

  // モーダルを表示
  document.body.insertAdjacentHTML('beforeend', modalHTML)
  document.body.style.overflow = 'hidden'
}

// タブ切り替え関数
function switchCardTab(tabName) {
  // すべてのタブボタンを非アクティブに
  document.querySelectorAll('#cardDetailModal button[id^="tab-"]').forEach(btn => {
    btn.className = 'flex-1 px-6 py-4 font-bold text-center transition border-b-4 border-transparent hover:bg-gray-50 text-gray-600'
  })
  
  // アクティブタブのボタンをハイライト
  const activeTab = document.getElementById(`tab-${tabName}`)
  if (activeTab) {
    const colors = {
      problem: 'border-blue-600 bg-white text-blue-600',
      hints: 'border-yellow-600 bg-white text-yellow-600',
      answer: 'border-green-600 bg-white text-green-600',
      explanation: 'border-purple-600 bg-white text-purple-600'
    }
    activeTab.className = `flex-1 px-6 py-4 font-bold text-center transition border-b-4 ${colors[tabName]}`
  }
  
  // すべてのタブコンテンツを非表示
  document.querySelectorAll('#cardDetailModal .tab-content').forEach(content => {
    content.classList.add('hidden')
  })
  
  // 選択されたタブのコンテンツを表示
  const activeContent = document.getElementById(`content-${tabName}`)
  if (activeContent) {
    activeContent.classList.remove('hidden')
  }
}

// 類似問題生成関数（仮実装）
async function generateSimilarProblem(cardId) {
  const button = event.target
  const originalHTML = button.innerHTML
  button.disabled = true
  button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>生成中...'
  
  try {
    const response = await axios.post(`/api/cards/${cardId}/generate-similar`)
    if (response.data.success) {
      // 新しい問題を表示（タブを問題に切り替え）
      alert('✨ 新しい問題を生成しました！\n\n' + response.data.problem.problem_text)
      // TODO: モーダルを更新して新しい問題を表示
    } else {
      throw new Error(response.data.error || '生成に失敗しました')
    }
  } catch (error) {
    console.error('類似問題生成エラー:', error)
    alert('❌ 問題の生成に失敗しました。もう一度お試しください。')
  } finally {
    button.disabled = false
    button.innerHTML = originalHTML
  }
}

// グローバル関数として登録
window.switchCardTab = switchCardTab
window.generateSimilarProblem = generateSimilarProblem

// カード詳細モーダルを閉じる
function closeCardDetail(event) {
  // 背景クリックまたは閉じるボタンの場合のみ閉じる
  if (!event || event.target.id === 'cardDetailModal' || event.type === 'click') {
    const modal = document.getElementById('cardDetailModal')
    if (modal) {
      modal.remove()
      document.body.style.overflow = ''
    }
  }
}

// ヒントセクションにスクロール
function scrollToHints() {
  const hintsSection = document.getElementById('hintsSection')
  if (hintsSection) {
    hintsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// 印刷処理（ローディング表示付き）
function handlePrint() {
  const printButton = document.getElementById('printButton')
  if (!printButton) return
  
  const originalHTML = printButton.innerHTML
  printButton.disabled = true
  printButton.innerHTML = `
    <i class="fas fa-spinner fa-spin mr-2"></i>
    印刷準備中...
  `
  
  // 少し待ってから印刷
  setTimeout(() => {
    window.print()
    
    // 印刷後、ボタンを元に戻す
    setTimeout(() => {
      printButton.disabled = false
      printButton.innerHTML = originalHTML
    }, 1000)
  }, 500)
}

// グローバル関数として公開
window.showCardDetail = showCardDetail
window.closeCardDetail = closeCardDetail

// 印刷用プレビュー表示
function showPrintPreview(unitData) {
  const curriculum = unitData.curriculum
  const courses = unitData.courses || []
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="container mx-auto px-4 py-8 print:p-0">
      <!-- 印刷ボタン（印刷時は非表示） -->
      <div class="no-print mb-6 flex justify-between items-center">
        <button onclick='showUnitPreview(${JSON.stringify(unitData).replace(/'/g, "\\'")})'
                class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg">
          <i class="fas fa-arrow-left mr-2"></i>
          戻る
        </button>
        <button id="printButton" onclick="handlePrint()" 
                class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
          <i class="fas fa-print mr-2"></i>
          印刷する
        </button>
      </div>

      <!-- 印刷用コンテンツ -->
      <div class="bg-white">
        <!-- ヘッダー -->
        <div class="border-b-4 border-blue-600 pb-4 mb-6">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            ${curriculum.unit_name}
          </h1>
          <p class="text-lg text-gray-600">
            ${curriculum.grade} ${curriculum.subject} / ${curriculum.textbook_company}
          </p>
          <div class="mt-3 text-sm text-gray-500">
            総学習時間: ${curriculum.total_hours}時間
          </div>
        </div>

        <!-- 単元の目標 -->
        <div class="mb-8 p-4 bg-blue-50 border-l-4 border-blue-600 rounded print:break-inside-avoid">
          <h2 class="text-xl font-bold text-blue-800 mb-2">📚 単元の目標</h2>
          <p class="text-gray-800">${curriculum.unit_goal}</p>
        </div>

        <!-- 各コースのカード一覧 -->
        ${courses.map((course, courseIndex) => `
          <div class="mb-12 print:break-before-page">
            <div class="bg-${course.color_code}-100 border-l-4 border-${course.color_code}-600 p-4 mb-6">
              <h2 class="text-2xl font-bold text-${course.color_code}-800">
                ${course.course_name}
              </h2>
              <p class="text-${course.color_code}-700 mt-1">${course.description}</p>
            </div>

            <!-- カード一覧 -->
            <div class="space-y-8">
              ${(course.cards || []).map((card, cardIndex) => `
                <div class="border-2 border-gray-300 rounded-lg p-6 print:break-inside-avoid">
                  <!-- カードヘッダー -->
                  <div class="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-200">
                    <h3 class="text-xl font-bold text-gray-800">
                      <span class="bg-${course.color_code}-500 text-white px-3 py-1 rounded-full mr-2">
                        ${card.card_number}
                      </span>
                      ${card.card_title}
                    </h3>
                  </div>

                  <!-- 問題説明 -->
                  <div class="mb-4">
                    <h4 class="font-bold text-blue-700 mb-2">📝 問題・課題</h4>
                    <p class="text-gray-800 whitespace-pre-wrap">${card.problem_description || ''}</p>
                  </div>

                  <!-- 回答欄 -->
                  <div class="mb-4 bg-yellow-50 border-2 border-yellow-300 rounded p-4">
                    <h4 class="font-bold text-yellow-700 mb-3">✏️ あなたの答え</h4>
                    <div class="space-y-2">
                      <div class="border-b-2 border-gray-300 h-10"></div>
                      <div class="border-b-2 border-gray-300 h-10"></div>
                      <div class="border-b-2 border-gray-300 h-10"></div>
                      <div class="border-b-2 border-gray-300 h-10"></div>
                    </div>
                  </div>

                  <!-- 新出用語 -->
                  ${card.new_terms ? `
                    <div class="mb-4 bg-green-50 border-l-4 border-green-500 p-3 rounded-r">
                      <h4 class="font-bold text-green-700 mb-1">📖 新しく出てくる言葉</h4>
                      <p class="text-gray-800">${card.new_terms}</p>
                    </div>
                  ` : ''}

                  <!-- 例題 -->
                  ${card.example_problem ? `
                    <div class="mb-4 bg-purple-50 border-l-4 border-purple-500 p-3 rounded-r">
                      <h4 class="font-bold text-purple-700 mb-2">🎯 例題</h4>
                      <p class="text-gray-800 mb-2">${card.example_problem}</p>
                      ${card.example_solution ? `
                        <div class="bg-white p-2 rounded border border-purple-200 mt-2">
                          <p class="text-sm font-semibold text-purple-600 mb-1">解き方</p>
                          <p class="text-gray-700">${card.example_solution}</p>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}

                  <!-- 実社会とのつながり -->
                  ${card.real_world_connection ? `
                    <div class="mb-4 bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r">
                      <h4 class="font-bold text-orange-700 mb-1">🌐 実社会とのつながり</h4>
                      <p class="text-gray-800">${card.real_world_connection}</p>
                    </div>
                  ` : ''}

                  <!-- ヒント -->
                  ${card.hints && card.hints.length > 0 ? `
                    <div class="bg-pink-50 border-l-4 border-pink-500 p-3 rounded-r">
                      <h4 class="font-bold text-pink-700 mb-3">💡 ヒント（困ったら見てね）</h4>
                      <div class="space-y-2">
                        ${card.hints.map(hint => `
                          <div class="bg-white p-2 rounded border border-pink-200">
                            <span class="inline-block bg-pink-500 text-white px-2 py-1 rounded-full text-sm font-bold mr-2">
                              ${hint.hint_level}
                            </span>
                            <span class="text-gray-800">${hint.hint_text}</span>
                            ${hint.thinking_tool_suggestion ? `
                              <span class="block ml-8 mt-1 text-sm text-pink-600">
                                💭 使える思考ツール: ${hint.thinking_tool_suggestion}
                              </span>
                            ` : ''}
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <style>
      @media print {
        .no-print {
          display: none !important;
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .print\\:break-before-page {
          page-break-before: always;
        }
        .print\\:break-inside-avoid {
          page-break-inside: avoid;
        }
      }
    </style>
  `
}

// グローバル関数として公開
window.showPrintPreview = showPrintPreview

// ============================================
// 教師用全体概観＆編集機能
// ============================================

function showTeacherOverview(unitData) {
  const curriculum = unitData.curriculum
  const courses = unitData.courses || []
  const optionalProblems = unitData.optional_problems || []
  const courseSelectionProblems = unitData.course_selection_problems || []
  const commonCheckTest = unitData.common_check_test || null
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="container mx-auto px-4 py-8">
      <!-- ヘッダー -->
      <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
        <button onclick="showUnitPreview(${JSON.stringify(unitData).replace(/"/g, '&quot;')})" class="text-white hover:text-gray-200 mb-4">
          <i class="fas fa-arrow-left mr-2"></i>プレビューに戻る
        </button>
        <h1 class="text-3xl font-bold mb-2">
          <i class="fas fa-chalkboard-teacher mr-2"></i>
          教師用：全体確認・編集
        </h1>
        <p class="text-lg opacity-90">
          ${curriculum.unit_name} - ${curriculum.grade} ${curriculum.subject}
        </p>
      </div>

      <!-- 目次（クイックナビゲーション） -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-list mr-2"></i>
          目次（クリックでジャンプ）
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a href="#unit-info" class="bg-blue-50 hover:bg-blue-100 p-3 rounded-lg text-center transition">
            <i class="fas fa-info-circle text-blue-600 text-xl mb-1"></i>
            <p class="text-sm font-bold text-blue-800">単元情報</p>
          </a>
          <a href="#learning-plan" class="bg-teal-50 hover:bg-teal-100 p-3 rounded-lg text-center transition">
            <i class="fas fa-calendar-alt text-teal-600 text-xl mb-1"></i>
            <p class="text-sm font-bold text-teal-800">学習計画表</p>
          </a>
          <a href="#learning-guide" class="bg-green-50 hover:bg-green-100 p-3 rounded-lg text-center transition">
            <i class="fas fa-book text-green-600 text-xl mb-1"></i>
            <p class="text-sm font-bold text-green-800">学習のてびき</p>
          </a>
          <a href="#courses" class="bg-purple-50 hover:bg-purple-100 p-3 rounded-lg text-center transition">
            <i class="fas fa-layer-group text-purple-600 text-xl mb-1"></i>
            <p class="text-sm font-bold text-purple-800">全コース・カード</p>
          </a>
          <a href="#answers" class="bg-orange-50 hover:bg-orange-100 p-3 rounded-lg text-center transition">
            <i class="fas fa-file-alt text-orange-600 text-xl mb-1"></i>
            <p class="text-sm font-bold text-orange-800">全解答・解説</p>
          </a>
          <a href="#check-test" class="bg-red-50 hover:bg-red-100 p-3 rounded-lg text-center transition">
            <i class="fas fa-check-circle text-red-600 text-xl mb-1"></i>
            <p class="text-sm font-bold text-red-800">チェックテスト</p>
          </a>
          <a href="#optional-problems" class="bg-pink-50 hover:bg-pink-100 p-3 rounded-lg text-center transition">
            <i class="fas fa-star text-pink-600 text-xl mb-1"></i>
            <p class="text-sm font-bold text-pink-800">選択課題</p>
          </a>
          <a href="#hints" class="bg-yellow-50 hover:bg-yellow-100 p-3 rounded-lg text-center transition">
            <i class="fas fa-lightbulb text-yellow-600 text-xl mb-1"></i>
            <p class="text-sm font-bold text-yellow-800">全ヒント一覧</p>
          </a>
        </div>
      </div>

      <!-- 使い方ガイド -->
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 class="font-bold text-blue-800 mb-2">
          <i class="fas fa-info-circle mr-2"></i>
          使い方
        </h3>
        <ul class="text-sm text-blue-900 space-y-1">
          <li>✅ AIが生成した全てのコンテンツを一覧で確認できます</li>
          <li>✅ 学習計画表で時数の調整・カードの並び替えができます</li>
          <li>✅ 学習のてびき、チェックテスト、選択課題、解答・解説も含まれます</li>
          <li>✅ 各カードの「編集」ボタンで内容を修正できます</li>
          <li>✅ 問題がなければ「この単元を保存して使用する」をクリック</li>
        </ul>
      </div>

      <!-- 統計サマリー -->
      <div id="summary" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-chart-bar mr-2"></i>
          統計サマリー
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg text-center">
            <p class="text-3xl font-bold text-blue-600">${courses.length}</p>
            <p class="text-sm text-gray-600">コース数</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg text-center">
            <p class="text-3xl font-bold text-green-600">${courses.reduce((sum, c) => sum + (c.cards?.length || 0), 0)}</p>
            <p class="text-sm text-gray-600">学習カード</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg text-center">
            <p class="text-3xl font-bold text-yellow-600">${courses.reduce((sum, c) => sum + (c.cards || []).reduce((s, card) => s + (card.hints?.length || 0), 0), 0)}</p>
            <p class="text-sm text-gray-600">ヒント総数</p>
          </div>
          <div class="bg-pink-50 p-4 rounded-lg text-center">
            <p class="text-3xl font-bold text-pink-600">${optionalProblems.length}</p>
            <p class="text-sm text-gray-600">選択課題</p>
          </div>
        </div>
      </div>
          <li>✅ 問題がなければ「この単元を保存して使用する」をクリック</li>
        </ul>
      </div>

      <!-- 単元情報 -->
      <div id="unit-info" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-bullseye mr-2"></i>
          単元情報
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">学年・教科</p>
            <p class="font-bold text-gray-800">${curriculum.grade} ${curriculum.subject}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">教科書会社</p>
            <p class="font-bold text-gray-800">${curriculum.textbook_company}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">総学習時間</p>
            <p class="font-bold text-gray-800">${curriculum.total_hours}時間</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600 mb-1">コース数</p>
            <p class="font-bold text-gray-800">${courses.length}コース</p>
          </div>
        </div>
        
        <div class="bg-blue-50 p-4 rounded-lg mb-3">
          <p class="text-sm font-bold text-blue-800 mb-2">📚 学習目標</p>
          <p class="text-gray-800">${curriculum.unit_goal}</p>
        </div>
        
        <div class="bg-green-50 p-4 rounded-lg">
          <p class="text-sm font-bold text-green-800 mb-2">💖 非認知能力の目標</p>
          <p class="text-gray-800">${curriculum.non_cognitive_goal}</p>
        </div>
      </div>

      <!-- 学習計画表 -->
      <div id="learning-plan" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-calendar-alt mr-2"></i>
          学習計画表（時数調整・カード順序変更）
        </h2>
        
        <div class="bg-teal-50 border-l-4 border-teal-500 p-4 mb-4">
          <h3 class="font-bold text-teal-800 mb-2">
            <i class="fas fa-info-circle mr-2"></i>
            学習計画表の使い方
          </h3>
          <ul class="text-sm text-teal-900 space-y-1">
            <li>✅ 各学習カードの時数を調整できます（＋/－ボタン）</li>
            <li>✅ カードの順序を並び替えられます（ドラッグ＆ドロップまたは↑↓ボタン）</li>
            <li>✅ 総時数が単元の予定時数（${curriculum.total_hours}時間）と一致するように調整してください</li>
            <li>✅ 変更は「保存」ボタンをクリックすると反映されます</li>
          </ul>
        </div>

        ${courses.map((course, courseIndex) => `
          <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-3 pb-2 border-b-2">
              ${course.course_name} 
              <span class="text-sm font-normal text-gray-600">（カード数: ${course.cards?.length || 0}枚）</span>
            </h3>
            
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="p-2 text-left w-12">順序</th>
                    <th class="p-2 text-left w-16">カード番号</th>
                    <th class="p-2 text-left">学習内容</th>
                    <th class="p-2 text-center w-24">教科書ページ</th>
                    <th class="p-2 text-center w-32">時数（時間）</th>
                    <th class="p-2 text-center w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${(course.cards || []).map((card, cardIndex) => `
                    <tr class="border-b hover:bg-gray-50">
                      <td class="p-2">${cardIndex + 1}</td>
                      <td class="p-2 font-bold">カード${card.card_number}</td>
                      <td class="p-2">${card.card_title}</td>
                      <td class="p-2 text-center text-gray-600">${card.textbook_page || '-'}</td>
                      <td class="p-2">
                        <div class="flex items-center justify-center gap-1">
                          <button onclick="adjustCardTime(${courseIndex}, ${cardIndex}, -1)" 
                                  class="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold">
                            －
                          </button>
                          <span class="w-8 text-center font-bold" id="time-${courseIndex}-${cardIndex}">1</span>
                          <button onclick="adjustCardTime(${courseIndex}, ${cardIndex}, 1)" 
                                  class="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-bold">
                            ＋
                          </button>
                        </div>
                      </td>
                      <td class="p-2">
                        <div class="flex items-center justify-center gap-1">
                          ${cardIndex > 0 ? `
                            <button onclick="moveCard(${courseIndex}, ${cardIndex}, -1)" 
                                    class="w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 text-xs">
                              ↑
                            </button>
                          ` : ''}
                          ${cardIndex < (course.cards?.length || 0) - 1 ? `
                            <button onclick="moveCard(${courseIndex}, ${cardIndex}, 1)" 
                                    class="w-6 h-6 bg-blue-100 hover:bg-blue-200 rounded text-blue-700 text-xs">
                              ↓
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                  <tr class="bg-gray-100 font-bold">
                    <td colspan="4" class="p-2 text-right">コース合計時数：</td>
                    <td class="p-2 text-center">
                      <span id="course-total-${courseIndex}">${course.cards?.length || 0}</span> 時間
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `).join('')}

        <div class="flex justify-center">
          <button onclick="saveLocalLearningPlan()" 
                  class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg">
            <i class="fas fa-save mr-2"></i>
            学習計画を保存
          </button>
        </div>
      </div>

      <!-- 学習のてびき -->
      <div id="learning-guide" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-book mr-2"></i>
          学習のてびき
        </h2>
        
        <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <h3 class="font-bold text-green-800 mb-2">📖 学習の進め方</h3>
          <ol class="text-sm text-green-900 space-y-2 ml-4 list-decimal">
            <li>まず、単元の目標を読んで、何を学ぶのか確認しましょう</li>
            <li>自分に合ったコース（じっくり・しっかり・ぐんぐん）を選びます</li>
            <li>学習カードを1枚ずつ進めます（わからない時はヒントやAI先生を使おう）</li>
            <li>全てのカードが終わったら、チェックテストに挑戦！</li>
            <li>チェックテストに合格したら、選択課題で発展的な学習ができます</li>
          </ol>
        </div>

        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <h3 class="font-bold text-blue-800 mb-2">🎯 コースの選び方</h3>
          <div class="space-y-3">
            <div class="bg-white p-3 rounded-lg">
              <p class="font-bold text-green-800 mb-1">🟢 じっくりコース</p>
              <p class="text-sm text-gray-700">基礎からしっかり学びたい人向け。丁寧な説明とたくさんのヒントがあります。</p>
            </div>
            <div class="bg-white p-3 rounded-lg">
              <p class="font-bold text-blue-800 mb-1">🔵 しっかりコース</p>
              <p class="text-sm text-gray-700">標準的な学習ペース。バランスよく学べます。</p>
            </div>
            <div class="bg-white p-3 rounded-lg">
              <p class="font-bold text-purple-800 mb-1">🟣 ぐんぐんコース</p>
              <p class="text-sm text-gray-700">発展的な内容に挑戦したい人向け。応用問題も含まれます。</p>
            </div>
          </div>
        </div>

        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <h3 class="font-bold text-yellow-800 mb-2">💡 困ったときは</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="bg-white p-3 rounded-lg">
              <p class="font-bold text-blue-600 mb-1">🤖 AI先生</p>
              <p class="text-xs text-gray-600">すぐに質問できます</p>
            </div>
            <div class="bg-white p-3 rounded-lg">
              <p class="font-bold text-green-600 mb-1">👨‍🏫 先生に聞く</p>
              <p class="text-xs text-gray-600">先生を呼べます</p>
            </div>
            <div class="bg-white p-3 rounded-lg">
              <p class="font-bold text-purple-600 mb-1">👥 友達に聞く</p>
              <p class="text-xs text-gray-600">できている友達を確認</p>
            </div>
          </div>
        </div>
      </div>

      <!-- コース選択問題 -->
      <div id="course-selection" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-route mr-2"></i>
          コース選択問題（全3問）
        </h2>
        <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4">
          <p class="text-sm text-indigo-900">
            <i class="fas fa-info-circle mr-2"></i>
            <strong>各コースの特徴を知るための問題です。</strong>生徒が自分に合ったコースを選ぶ参考にします。
          </p>
        </div>
        ${courseSelectionProblems.length > 0 ? `
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${courseSelectionProblems.map((problem, index) => {
              const course = courses[index]
              const colorClasses = index === 0 ? 'border-green-500 bg-green-50' :
                                   index === 1 ? 'border-blue-500 bg-blue-50' :
                                   'border-purple-500 bg-purple-50'
              return `
                <div class="border-2 ${colorClasses} rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-bold text-gray-800">${course ? course.course_name : `コース${index + 1}`}</h3>
                    <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      問題 ${index + 1}
                    </span>
                  </div>
                  <div class="bg-white p-3 rounded-lg mb-3">
                    <p class="text-sm font-bold text-gray-800 mb-2">${problem.problem_title}</p>
                    <p class="text-xs text-gray-700">${problem.problem_content || problem.problem_description || ''}</p>
                  </div>
                  ${problem.answer ? `
                    <div class="bg-yellow-50 p-2 rounded-lg">
                      <p class="text-xs font-bold text-yellow-800 mb-1">💡 解答</p>
                      <p class="text-xs text-gray-700">${problem.answer}</p>
                    </div>
                  ` : ''}
                </div>
              `
            }).join('')}
          </div>
        ` : `
          <div class="bg-gray-50 p-4 rounded-lg text-center">
            <i class="fas fa-times-circle text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600">コース選択問題が生成されていません</p>
            <p class="text-xs text-gray-500 mt-2">単元保存後、自動生成されます</p>
          </div>
        `}
      </div>

      <!-- 全コース・全カード一覧 -->
      <div id="courses"></div>
      ${courses.map((course, courseIndex) => `
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl font-bold text-${course.color_code}-800">
              <i class="fas fa-layer-group mr-2"></i>
              ${course.course_name}
            </h2>
            <span class="bg-${course.color_code}-100 text-${course.color_code}-800 px-4 py-2 rounded-full font-bold">
              ${course.cards?.length || 0}枚
            </span>
          </div>
          <p class="text-gray-600 mb-4">${course.description}</p>
          
          <!-- カード一覧 -->
          <div class="space-y-4">
            ${(course.cards || []).map((card, cardIndex) => `
              <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-${course.color_code}-300 transition">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="bg-${course.color_code}-100 text-${course.color_code}-800 px-3 py-1 rounded-full text-sm font-bold">
                        カード ${card.card_number}
                      </span>
                      <span class="text-sm text-gray-500">${card.card_type || 'main'}</span>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">
                      ${card.card_title}
                    </h3>
                  </div>
                  <button onclick="editCardContent(${courseIndex}, ${cardIndex})"
                          class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold transition">
                    <i class="fas fa-edit mr-1"></i>
                    編集
                  </button>
                </div>
                
                <!-- カード内容プレビュー -->
                <div class="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                  <div>
                    <p class="font-bold text-gray-700 mb-1">📝 問題・課題</p>
                    <p class="text-gray-600">${card.problem_description?.substring(0, 100) || '(なし)'}${card.problem_description?.length > 100 ? '...' : ''}</p>
                  </div>
                  
                  <div>
                    <p class="font-bold text-gray-700 mb-1">📚 新出用語</p>
                    <p class="text-gray-600">${card.new_terms || '(なし)'}</p>
                  </div>
                  
                  <div>
                    <p class="font-bold text-gray-700 mb-1">💡 例題</p>
                    <p class="text-gray-600">${card.example_problem?.substring(0, 80) || '(なし)'}${card.example_problem?.length > 80 ? '...' : ''}</p>
                  </div>
                  
                  <div>
                    <p class="font-bold text-gray-700 mb-1">🌍 実社会とのつながり</p>
                    <p class="text-gray-600">${card.real_world_connection?.substring(0, 80) || '(なし)'}${card.real_world_connection?.length > 80 ? '...' : ''}</p>
                  </div>
                  
                  <div>
                    <p class="font-bold text-gray-700 mb-1">💡 ヒント</p>
                    <p class="text-gray-600">${card.hints?.length || 0}段階のヒントを用意</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <!-- 全解答・解説 -->
      <div id="answers" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-file-alt mr-2"></i>
          全解答・解説
        </h2>
        ${courses.map((course, courseIndex) => `
          <div class="mb-6">
            <h3 class="text-xl font-bold text-${course.color_code}-800 mb-3">
              ${course.course_name}
            </h3>
            ${(course.cards || []).map((card, cardIndex) => `
              <div class="bg-gray-50 border-l-4 border-${course.color_code}-500 p-4 mb-3">
                <p class="font-bold text-gray-800 mb-2">
                  カード ${card.card_number}: ${card.card_title}
                </p>
                <div class="bg-white p-3 rounded-lg mb-2">
                  <p class="text-sm font-bold text-green-800 mb-2">
                    <i class="fas fa-check-circle mr-1"></i>解答
                  </p>
                  <div class="text-gray-700" style="line-height: 1.8; white-space: pre-wrap;">${(card.answer || card.example_solution || '解答は例題の解き方を参照してください').replace(/\n/g, '<br>')}</div>
                </div>
                <div class="bg-blue-50 p-3 rounded-lg">
                  <p class="text-sm font-bold text-blue-800 mb-2">
                    <i class="fas fa-info-circle mr-1"></i>解説
                  </p>
                  <div class="text-gray-700" style="line-height: 1.8; white-space: pre-wrap;">${(card.answer_explanation || card.real_world_connection || '解説は準備中です').replace(/\n/g, '<br>')}</div>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <!-- チェックテスト -->
      <div id="check-test" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-check-circle mr-2"></i>
          チェックテスト（全コース共通）
        </h2>
        <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
          <p class="text-sm text-yellow-900">
            <i class="fas fa-info-circle mr-2"></i>
            <strong>どのコースも共通の基礎基本チェックテスト6題です。</strong>単元の知識理解の最低保証として機能します。
          </p>
        </div>
        ${commonCheckTest && commonCheckTest.sample_problems && commonCheckTest.sample_problems.length > 0 ? `
          <div class="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-300 rounded-xl p-6 mb-4">
            <h3 class="font-bold text-yellow-800 mb-2 text-xl">
              📝 ${commonCheckTest.test_description || 'チェックテスト'}
            </h3>
            <p class="text-sm text-gray-700 mb-4">${commonCheckTest.test_note || '基礎基本を確認する問題です'}</p>
            <div class="bg-white rounded-lg p-4">
              <p class="font-bold text-gray-800 mb-2">
                問題数: ${commonCheckTest.problems_count || commonCheckTest.sample_problems.length}題
              </p>
            </div>
          </div>
          
          <div class="space-y-4">
            ${commonCheckTest.sample_problems.map((problem, index) => `
              <div class="bg-gradient-to-r from-yellow-50 to-white border-l-4 border-yellow-500 p-5 rounded-lg shadow-md">
                <div class="flex items-start mb-3">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 text-white flex items-center justify-center font-bold text-lg mr-4 flex-shrink-0">
                    ${problem.problem_number}
                  </div>
                  <div class="flex-1">
                    <span class="text-xs bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-bold">
                      難易度: ${problem.difficulty || 'basic'}
                    </span>
                  </div>
                </div>
                
                <div class="bg-white p-4 rounded-lg mb-3 border-2 border-yellow-200">
                  <p class="text-sm font-bold text-yellow-800 mb-2">📝 問題</p>
                  <p class="text-gray-800 text-lg leading-relaxed">${problem.problem_text}</p>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <p class="text-sm font-bold text-green-800 mb-2">
                    <i class="fas fa-check-circle mr-1"></i>解答
                  </p>
                  <p class="text-gray-800">${problem.answer}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="bg-gray-50 p-4 rounded-lg text-center">
            <i class="fas fa-times-circle text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-600">チェックテストが生成されていません</p>
          </div>
        `}
      </div>

      <!-- 選択課題 -->
      <div id="optional-problems" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-star mr-2"></i>
          選択課題（発展問題）
        </h2>
        ${optionalProblems.length > 0 ? `
          <div class="space-y-4">
            ${optionalProblems.map((problem, index) => `
              <div class="bg-pink-50 border-l-4 border-pink-500 p-4">
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-bold text-gray-800">
                    <span class="bg-pink-200 text-pink-800 px-3 py-1 rounded-full text-sm mr-2">
                      問題 ${index + 1}
                    </span>
                    ${problem.problem_title}
                  </h3>
                  <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                    難易度: ${problem.difficulty_level || '標準'}
                  </span>
                </div>
                <div class="bg-white p-3 rounded-lg mb-3">
                  <p class="text-sm font-bold text-pink-800 mb-1">📝 問題</p>
                  <p class="text-gray-700">${problem.problem_description}</p>
                </div>
                ${problem.hint_text ? `
                  <div class="bg-yellow-50 p-3 rounded-lg">
                    <p class="text-sm font-bold text-yellow-800 mb-1">💡 ヒント</p>
                    <p class="text-gray-700">${problem.hint_text}</p>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="bg-gray-50 p-4 rounded-lg text-center">
            <p class="text-gray-600">
              <i class="fas fa-info-circle mr-2"></i>
              選択課題は保存後、教師が追加できます
            </p>
          </div>
        `}
      </div>

      <!-- 全ヒント一覧 -->
      <div id="hints" class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-lightbulb mr-2"></i>
          全ヒント一覧
        </h2>
        ${courses.map((course, courseIndex) => `
          <div class="mb-6">
            <h3 class="text-xl font-bold text-${course.color_code}-800 mb-3">
              ${course.course_name}
            </h3>
            ${(course.cards || []).map((card, cardIndex) => `
              <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-3">
                <p class="font-bold text-gray-800 mb-3">
                  カード ${card.card_number}: ${card.card_title}
                </p>
                ${(card.hints || []).map((hint, hintIndex) => `
                  <div class="bg-white p-3 rounded-lg mb-2">
                    <p class="text-sm font-bold text-yellow-800 mb-1">
                      💡 ヒント ${hintIndex + 1}
                      ${hint.thinking_tool_suggestion ? `<span class="text-xs text-gray-600 ml-2">(思考ツール: ${hint.thinking_tool_suggestion})</span>` : ''}
                    </p>
                    <p class="text-gray-700">${hint.hint_text || hint.hint_content || ''}</p>
                  </div>
                `).join('')}
                ${(!card.hints || card.hints.length === 0) ? '<p class="text-gray-500 text-sm">ヒントなし</p>' : ''}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>

      <!-- アクションボタン -->
      <div class="bg-white rounded-lg shadow-lg p-6 space-y-4">
        <div class="flex space-x-4">
          <button onclick="showUnitPreview(${JSON.stringify(unitData).replace(/"/g, '&quot;')})" 
                  class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-4 px-6 rounded-lg transition">
            <i class="fas fa-arrow-left mr-2"></i>
            プレビューに戻る
          </button>
          <button onclick="saveGeneratedUnit(${JSON.stringify(unitData).replace(/"/g, '&quot;')})" 
                  class="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg">
            <i class="fas fa-save mr-2"></i>
            ✅ 確認完了：この単元を保存して使用する
          </button>
        </div>
      </div>
    </div>
  `
}

// カード内容編集モーダル（簡易版）
function editCardContent(courseIndex, cardIndex) {
  alert(`カード編集機能\n\nコース ${courseIndex + 1}、カード ${cardIndex + 1} の編集画面を開きます。\n\n※現在は既存の問題編集機能を使用してください。\n学習のてびきページ > 教師用ツール > 問題編集`)
}

// グローバル関数として公開
window.showTeacherOverview = showTeacherOverview
window.editCardContent = editCardContent

// 学習計画表の時数調整
let learningPlanData = { courses: [] }

function adjustCardTime(courseIndex, cardIndex, delta) {
  const timeElement = document.getElementById(`time-${courseIndex}-${cardIndex}`)
  let currentTime = parseInt(timeElement.textContent)
  currentTime = Math.max(0, currentTime + delta)
  timeElement.textContent = currentTime
  
  // コース合計を更新
  updateCourseTotals()
}

function updateCourseTotals() {
  const allCourses = document.querySelectorAll('[id^="course-total-"]')
  let grandTotal = 0
  
  allCourses.forEach((courseElement, courseIndex) => {
    let courseTotal = 0
    const timeElements = document.querySelectorAll(`[id^="time-${courseIndex}-"]`)
    timeElements.forEach(elem => {
      courseTotal += parseInt(elem.textContent)
    })
    courseElement.textContent = courseTotal
    grandTotal += courseTotal
  })
  
  // 総時数を更新
  document.getElementById('total-hours').textContent = grandTotal
  
  // 警告表示
  const targetHours = parseInt(document.getElementById('total-hours').parentElement.querySelector('.text-gray-600').textContent.match(/\d+/)[0])
  const warning = document.getElementById('time-warning')
  if (grandTotal !== targetHours) {
    warning.classList.remove('hidden')
  } else {
    warning.classList.add('hidden')
  }
}

function moveCard(courseIndex, cardIndex, direction) {
  alert(`カード移動機能\\n\\nコース ${courseIndex + 1} のカード ${cardIndex + 1} を${direction > 0 ? '下' : '上'}に移動します。\\n\\n※この機能は次の更新で実装予定です。`)
}

function saveLocalLearningPlan() {
  const courses = []
  document.querySelectorAll('[id^="course-total-"]').forEach((elem, courseIndex) => {
    const cards = []
    document.querySelectorAll(`[id^="time-${courseIndex}-"]`).forEach((timeElem, cardIndex) => {
      cards.push({
        cardIndex: cardIndex,
        allocatedHours: parseInt(timeElem.textContent)
      })
    })
    courses.push({ courseIndex, cards })
  })
  
  learningPlanData = { courses }
  alert('✅ 学習計画表を保存しました！\\n\\n単元保存時に反映されます。')
}

// 印刷機能
function printGuide() {
  window.print()
}

// PDF出力機能
async function downloadGuidePDF(curriculumId) {
  try {
    // PDF生成中メッセージ
    const originalContent = document.getElementById('app').innerHTML
    
    // ローディング表示
    const loadingMsg = document.createElement('div')
    loadingMsg.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    loadingMsg.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <i class="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
        <p class="text-xl font-bold text-gray-800">PDF生成中...</p>
        <p class="text-sm text-gray-600 mt-2">しばらくお待ちください（約10〜30秒）</p>
      </div>
    `
    document.body.appendChild(loadingMsg)
    
    // 印刷用の要素を取得
    const element = document.querySelector('.bg-white.rounded-2xl')
    
    if (!element) {
      throw new Error('印刷対象の要素が見つかりません')
    }
    
    // PDF生成オプション
    const opt = {
      margin: 10,
      filename: `学習のてびき_${state.selectedCurriculum?.unit_name || 'curriculum'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    // PDF生成
    await html2pdf().set(opt).from(element).save()
    
    // ローディング削除
    document.body.removeChild(loadingMsg)
    
    console.log('✅ PDF生成完了')
    
  } catch (error) {
    console.error('PDF生成エラー:', error)
    alert(`❌ PDF生成に失敗しました: ${error.message}\n\nブラウザの印刷機能（Ctrl+P）をご利用ください。`)
    
    // ローディング削除（エラー時）
    const loading = document.querySelector('.fixed.inset-0')
    if (loading) {
      document.body.removeChild(loading)
    }
  }
}

// カードの並び順を保存
async function saveCardOrder(courseId, courseIndex) {
  try {
    const sortableEl = document.getElementById(`sortable-cards-${courseIndex}`)
    if (!sortableEl) {
      throw new Error('カードリストが見つかりません')
    }
    
    // 現在の順序でカードIDを取得
    const cardElements = sortableEl.querySelectorAll('[data-card-id]')
    const cardIds = Array.from(cardElements).map(el => parseInt(el.dataset.cardId))
    
    console.log(`📋 カード並び替え保存: courseId=${courseId}, cards=${cardIds.length}`, cardIds)
    
    loadingManager.show('カードの順序を保存中...')
    
    const response = await axios.post(`/api/course/${courseId}/reorder-cards`, {
      cardIds
    })
    
    loadingManager.hide()
    
    if (response.data.success) {
      alert('✅ カードの並び順を保存しました！')
      console.log('✅ カード並び替え成功:', response.data)
    } else {
      throw new Error(response.data.error || '並び替えに失敗しました')
    }
  } catch (error) {
    loadingManager.hide()
    console.error('カード並び替えエラー:', error)
    alert(`❌ カードの並び替えに失敗しました: ${error.message}`)
  }
}

// QRコード生成
function generateQRCode(curriculumId) {
  const modal = document.createElement('div')
  modal.id = 'qrModal'
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-qrcode mr-2 text-orange-600"></i>
          QRコード生成
        </h2>
        <button onclick="closeQRModal()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      <p class="text-gray-600 mb-6">
        この単元へのアクセス用QRコードを生成します。<br>
        スマートフォンやタブレットで読み取ると、学習のてびきページに直接アクセスできます。
      </p>
      
      <div class="flex flex-col items-center">
        <div id="qrcode-container" class="bg-white p-6 rounded-lg border-4 border-orange-200 mb-6"></div>
        
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 w-full">
          <p class="text-sm text-blue-800">
            <i class="fas fa-info-circle mr-2"></i>
            <strong>アクセスURL:</strong><br>
            <code class="bg-white px-2 py-1 rounded text-xs">${window.location.origin}/?curriculum=${curriculumId}</code>
          </p>
        </div>
        
        <button onclick="downloadQR()" 
                class="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 px-8 rounded-lg font-bold transition shadow-lg">
          <i class="fas fa-download mr-2"></i>
          QRコード画像をダウンロード
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // QRコード生成
  const qrUrl = `${window.location.origin}/?curriculum=${curriculumId}`
  
  if (typeof QRCode !== 'undefined') {
    new QRCode(document.getElementById('qrcode-container'), {
      text: qrUrl,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    })
  } else {
    document.getElementById('qrcode-container').innerHTML = `
      <p class="text-red-600">QRコードライブラリの読み込みに失敗しました</p>
    `
  }
}

function closeQRModal() {
  const modal = document.getElementById('qrModal')
  if (modal) {
    modal.remove()
  }
}

function downloadQR() {
  const canvas = document.querySelector('#qrcode-container canvas')
  if (canvas) {
    const link = document.createElement('a')
    link.download = `qrcode-curriculum-${state.selectedCurriculum?.id || 'unknown'}.png`
    link.href = canvas.toDataURL()
    link.click()
    console.log('✅ QRコード画像をダウンロード')
  } else {
    alert('❌ QRコード画像が見つかりません')
  }
}

window.adjustCardTime = adjustCardTime
window.moveCard = moveCard
window.saveLearningPlan = saveLearningPlan
window.printGuide = printGuide
window.downloadGuidePDF = downloadGuidePDF
window.toggleCardDetail = toggleCardDetail
window.closeEditModal = closeEditModal
window.saveEditedCurriculum = saveEditedCurriculum
window.saveCardOrder = saveCardOrder
window.duplicateCurriculum = duplicateCurriculum
window.closeDuplicateModal = closeDuplicateModal
window.executeDuplicate = executeDuplicate
window.generateQRCode = generateQRCode
window.closeQRModal = closeQRModal
window.downloadQR = downloadQR
window.editIntroProblem = editIntroProblem
window.saveIntroProblem = saveIntroProblem
window.addNewIntroProblem = addNewIntroProblem
window.saveNewIntroProblem = saveNewIntroProblem
window.editCheckTest = editCheckTest
window.saveCheckTest = saveCheckTest
window.addCheckTestProblem = addCheckTestProblem
window.deleteCheckTestProblem = deleteCheckTestProblem
window.editOptionalProblem = editOptionalProblem
window.saveOptionalProblem = saveOptionalProblem
window.deleteOptionalProblem = deleteOptionalProblem
window.addOptionalProblem = addOptionalProblem
window.saveNewOptionalProblem = saveNewOptionalProblem
window.showStudentDetail = showStudentDetail
window.closeStudentDetail = closeStudentDetail
window.exportProgressToPDF = exportProgressToPDF
window.startAutoRefresh = startAutoRefresh
window.stopAutoRefresh = stopAutoRefresh

// ==============================================
// 進捗ボード拡張機能
// ==============================================

// 自動更新タイマー
let autoRefreshInterval = null

// 自動更新開始
function startAutoRefresh(curriculumId, intervalSeconds = 30) {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
  }
  
  autoRefreshInterval = setInterval(() => {
    console.log('🔄 進捗ボードを自動更新中...')
    loadProgressBoard(curriculumId)
  }, intervalSeconds * 1000)
  
  console.log(`✅ 自動更新を開始しました（${intervalSeconds}秒ごと）`)
}

// 自動更新停止
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval)
    autoRefreshInterval = null
    console.log('⏸️ 自動更新を停止しました')
  }
}

// 自動更新トグル
function toggleAutoRefresh(curriculumId) {
  const toggle = document.getElementById('autoRefreshToggle')
  if (toggle && toggle.checked) {
    startAutoRefresh(curriculumId, 30) // 30秒ごと
    console.log('✅ 自動更新ON')
  } else {
    stopAutoRefresh()
    console.log('⏸️ 自動更新OFF')
  }
}
window.toggleAutoRefresh = toggleAutoRefresh

// 児童詳細モーダル表示
function showStudentDetail(studentData) {
  const student = typeof studentData === 'string' ? JSON.parse(studentData) : studentData
  const currProgress = student.curriculums[0] || {}
  const cardProgress = currProgress.card_progress || []
  const checkProgress = currProgress.check_test_progress || []
  const optionalProgress = currProgress.optional_progress || []
  const helpStats = currProgress.help_stats || []
  const priority = currProgress.intervention_priority || 0
  
  // 学習時間の計算
  const totalMinutes = cardProgress.reduce((sum, card) => sum + (card.time_spent || 0), 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  // 平均理解度の計算
  const avgUnderstanding = cardProgress.length > 0 
    ? Math.round(cardProgress.reduce((sum, card) => sum + (card.understanding_level || 0), 0) / cardProgress.length)
    : 0
  
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.id = 'studentDetailModal'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- ヘッダー -->
      <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="bg-white text-blue-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
              ${student.student_number}
            </div>
            <div>
              <h2 class="text-2xl font-bold">${student.student_name}</h2>
              <p class="text-blue-100 mt-1">優先度スコア: ${priority}点</p>
            </div>
          </div>
          <button onclick="closeStudentDetail()" 
                  class="text-white hover:text-gray-200 text-3xl leading-none">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- コンテンツ -->
      <div class="p-6">
        <!-- サマリー -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-blue-600">${cardProgress.filter(c => c.status === 'completed').length}</div>
            <div class="text-sm text-gray-600 mt-1">完了カード</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-green-600">${avgUnderstanding}</div>
            <div class="text-sm text-gray-600 mt-1">平均理解度</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-purple-600">${hours}h ${minutes}m</div>
            <div class="text-sm text-gray-600 mt-1">学習時間</div>
          </div>
          <div class="bg-orange-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-orange-600">${helpStats.reduce((sum, stat) => sum + stat.count, 0)}</div>
            <div class="text-sm text-gray-600 mt-1">ヘルプ回数</div>
          </div>
        </div>

        <!-- タブ -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="flex space-x-4">
            <button onclick="switchStudentTab('cards')" 
                    class="student-tab-btn px-4 py-2 font-medium text-sm border-b-2 border-blue-500 text-blue-600"
                    data-tab="cards">
              学習カード
            </button>
            <button onclick="switchStudentTab('tests')" 
                    class="student-tab-btn px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                    data-tab="tests">
              テスト
            </button>
            <button onclick="switchStudentTab('help')" 
                    class="student-tab-btn px-4 py-2 font-medium text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700"
                    data-tab="help">
              ヘルプ履歴
            </button>
          </nav>
        </div>

        <!-- 学習カードタブ -->
        <div id="student-tab-cards" class="student-tab-content">
          <h3 class="text-lg font-bold text-gray-800 mb-4">学習カード進捗</h3>
          <div class="space-y-3">
            ${cardProgress.length > 0 ? cardProgress.map(card => `
              <div class="border rounded-lg p-4 hover:bg-gray-50">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${
                      card.course_level === 'basic' ? 'bg-green-500' :
                      card.course_level === 'standard' ? 'bg-blue-500' : 'bg-purple-500'
                    } text-white flex items-center justify-center font-bold">
                      ${card.card_number}
                    </div>
                    <div>
                      <div class="font-bold text-gray-800">${card.card_title || '不明'}</div>
                      <div class="text-xs text-gray-500">${
                        card.course_level === 'basic' ? 'じっくりコース' :
                        card.course_level === 'standard' ? 'しっかりコース' : 'ぐんぐんコース'
                      }</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-4">
                    <div class="text-center">
                      <div class="text-2xl">${getUnderstandingEmoji(card.understanding_level)}</div>
                      <div class="text-xs text-gray-500">理解度</div>
                    </div>
                    <div class="px-3 py-1 rounded-full text-xs font-bold ${
                      card.status === 'completed' ? 'bg-green-100 text-green-700' :
                      card.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }">
                      ${card.status === 'completed' ? '完了' :
                        card.status === 'in_progress' ? '学習中' : '未着手'}
                    </div>
                  </div>
                </div>
                ${card.stagnant_minutes > 10 ? `
                  <div class="mt-2 bg-yellow-50 border-l-4 border-yellow-500 p-2 text-xs">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                    ${card.stagnant_minutes}分間停滞中
                  </div>
                ` : ''}
                ${card.help_requested_at && !card.help_resolved_at ? `
                  <div class="mt-2 bg-orange-50 border-l-4 border-orange-500 p-2 text-xs">
                    <i class="fas fa-hand-paper text-orange-600 mr-2"></i>
                    ヘルプ要請中（${card.help_waiting_minutes}分待機）
                  </div>
                ` : ''}
              </div>
            `).join('') : '<div class="text-center text-gray-500 py-8">学習カードのデータがありません</div>'}
          </div>
        </div>

        <!-- テストタブ -->
        <div id="student-tab-tests" class="student-tab-content hidden">
          <h3 class="text-lg font-bold text-gray-800 mb-4">テスト進捗</h3>
          
          <!-- チェックテスト -->
          <div class="mb-6">
            <h4 class="font-bold text-gray-700 mb-3">チェックテスト</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              ${[1,2,3,4,5,6].map(num => {
                const test = checkProgress.find(t => t.problem_number === num)
                const status = test ? test.status : 'not_started'
                return `
                  <div class="border rounded-lg p-3 text-center ${
                    status === 'completed' ? 'bg-green-50 border-green-300' :
                    status === 'failed' ? 'bg-red-50 border-red-300' :
                    status === 'in_progress' ? 'bg-blue-50 border-blue-300' :
                    'bg-gray-50 border-gray-300'
                  }">
                    <div class="text-2xl font-bold mb-1">問${num}</div>
                    <div class="text-xs font-bold ${
                      status === 'completed' ? 'text-green-600' :
                      status === 'failed' ? 'text-red-600' :
                      status === 'in_progress' ? 'text-blue-600' :
                      'text-gray-600'
                    }">
                      ${status === 'completed' ? '✓ 合格' :
                        status === 'failed' ? '✗ 不合格' :
                        status === 'in_progress' ? '実施中' : '未実施'}
                    </div>
                    ${test && test.attempts > 0 ? `<div class="text-xs text-gray-500 mt-1">${test.attempts}回挑戦</div>` : ''}
                  </div>
                `
              }).join('')}
            </div>
          </div>

          <!-- 選択問題 -->
          <div>
            <h4 class="font-bold text-gray-700 mb-3">選択問題</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              ${[1,2,3,4,5,6].map(num => {
                const problem = optionalProgress.find(p => p.problem_number === num)
                const status = problem ? problem.status : 'not_started'
                return `
                  <div class="border rounded-lg p-3 text-center ${
                    status === 'completed' ? 'bg-blue-50 border-blue-300' :
                    status === 'in_progress' ? 'bg-yellow-50 border-yellow-300' :
                    'bg-gray-50 border-gray-300'
                  }">
                    <div class="text-2xl font-bold mb-1">問${num}</div>
                    <div class="text-xs font-bold ${
                      status === 'completed' ? 'text-blue-600' :
                      status === 'in_progress' ? 'text-yellow-600' :
                      'text-gray-600'
                    }">
                      ${status === 'completed' ? '✓ 完了' :
                        status === 'in_progress' ? '取組中' : '未着手'}
                    </div>
                    ${problem && problem.problem_title ? `<div class="text-xs text-gray-500 mt-1">${problem.problem_title}</div>` : ''}
                  </div>
                `
              }).join('')}
            </div>
          </div>
        </div>

        <!-- ヘルプ履歴タブ -->
        <div id="student-tab-help" class="student-tab-content hidden">
          <h3 class="text-lg font-bold text-gray-800 mb-4">ヘルプ統計</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${['ai', 'teacher', 'friend', 'hint'].map(type => {
              const stat = helpStats.find(s => s.help_type === type)
              const count = stat ? stat.count : 0
              const icons = {
                ai: { icon: 'robot', label: 'AI先生', color: 'purple' },
                teacher: { icon: 'user-tie', label: '先生', color: 'blue' },
                friend: { icon: 'user-friends', label: '友達', color: 'green' },
                hint: { icon: 'lightbulb', label: 'ヒント', color: 'yellow' }
              }
              const info = icons[type]
              return `
                <div class="bg-${info.color}-50 border border-${info.color}-200 rounded-lg p-4 text-center">
                  <i class="fas fa-${info.icon} text-${info.color}-500 text-3xl mb-2"></i>
                  <div class="text-2xl font-bold text-gray-800">${count}</div>
                  <div class="text-sm text-gray-600">${info.label}</div>
                </div>
              `
            }).join('')}
          </div>

          <div class="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 class="font-bold text-blue-800 mb-2">
              <i class="fas fa-chart-line mr-2"></i>学習パターン分析
            </h4>
            <ul class="text-sm text-gray-700 space-y-2">
              ${helpStats.length > 0 ? `
                <li><i class="fas fa-check text-green-500 mr-2"></i>
                  最もよく使う支援: ${
                    helpStats.reduce((max, stat) => stat.count > max.count ? stat : max).help_type === 'ai' ? 'AI先生' :
                    helpStats.reduce((max, stat) => stat.count > max.count ? stat : max).help_type === 'teacher' ? '先生' :
                    helpStats.reduce((max, stat) => stat.count > max.count ? stat : max).help_type === 'friend' ? '友達' : 'ヒント'
                  }
                </li>
              ` : ''}
              <li><i class="fas fa-check text-green-500 mr-2"></i>
                平均理解度: ${avgUnderstanding}点
              </li>
              <li><i class="fas fa-check text-green-500 mr-2"></i>
                総学習時間: ${hours}時間${minutes}分
              </li>
            </ul>
          </div>
        </div>

        <!-- アクションボタン -->
        <div class="mt-6 pt-6 border-t border-gray-200 flex gap-3">
          <button onclick="exportStudentReport('${student.student_id}')" 
                  class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
            <i class="fas fa-file-pdf mr-2"></i>個人レポート出力
          </button>
          <button onclick="closeStudentDetail()" 
                  class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
            閉じる
          </button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

// タブ切り替え
function switchStudentTab(tabName) {
  // すべてのタブコンテンツを非表示
  document.querySelectorAll('.student-tab-content').forEach(content => {
    content.classList.add('hidden')
  })
  
  // すべてのタブボタンを非アクティブ化
  document.querySelectorAll('.student-tab-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'text-blue-600')
    btn.classList.add('border-transparent', 'text-gray-500')
  })
  
  // 選択されたタブを表示
  document.getElementById(`student-tab-${tabName}`).classList.remove('hidden')
  
  // 選択されたタブボタンをアクティブ化
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`)
  activeBtn.classList.remove('border-transparent', 'text-gray-500')
  activeBtn.classList.add('border-blue-500', 'text-blue-600')
}
window.switchStudentTab = switchStudentTab

// 児童詳細モーダルを閉じる
function closeStudentDetail() {
  const modal = document.getElementById('studentDetailModal')
  if (modal) {
    modal.remove()
  }
}

// 理解度の絵文字取得
function getUnderstandingEmoji(level) {
  if (level >= 80) return '🤩'
  if (level >= 60) return '😄'
  if (level >= 40) return '😊'
  if (level >= 20) return '😕'
  return '😢'
}

// PDF出力機能
async function exportProgressToPDF() {
  showLoading('PDFを生成中...')
  
  try {
    const element = document.querySelector('.min-h-screen')
    if (!element) {
      throw new Error('出力対象の要素が見つかりません')
    }

    const opt = {
      margin: 10,
      filename: `進捗ボード_${new Date().toLocaleDateString('ja-JP')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    }

    await html2pdf().set(opt).from(element).save()
    
    hideLoading()
    console.log('✅ PDF生成完了')
  } catch (error) {
    hideLoading()
    console.error('PDF生成エラー:', error)
    alert('PDF生成に失敗しました。ブラウザの印刷機能をご利用ください。')
  }
}

// 個人レポート出力（将来実装）
async function exportStudentReport(studentId) {
  alert('個人レポート機能は現在開発中です')
}
window.exportStudentReport = exportStudentReport

// 週次レポート表示
async function showWeeklyReport() {
  showLoading('週次レポートを生成中...')
  
  try {
    // 今週の日付範囲を計算
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek)
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek))
    
    const startDate = startOfWeek.toISOString().split('T')[0]
    const endDate = endOfWeek.toISOString().split('T')[0]
    
    const response = await axios.get(
      `/api/reports/weekly/${state.student.classCode}?startDate=${startDate}&endDate=${endDate}`
    )
    
    hideLoading()
    
    if (!response.data.success) {
      alert('週次レポートの取得に失敗しました')
      return
    }
    
    const stats = response.data.stats
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">週次レポート</h2>
              <p class="text-sm mt-1">${startDate} 〜 ${endDate}</p>
              <p class="text-sm">クラス: ${state.student.classCode}</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-white hover:text-gray-200 text-3xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No.</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">完了カード数</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">平均理解度</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">AI</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">先生</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">友達</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ヒント</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${stats.map(student => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${student.student_number}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${student.student_name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">
                        ${student.completed_cards || 0}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span class="px-2 py-1 ${
                        (student.avg_understanding || 0) >= 80 ? 'bg-green-100 text-green-800' :
                        (student.avg_understanding || 0) >= 60 ? 'bg-blue-100 text-blue-800' :
                        (student.avg_understanding || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      } rounded-full font-bold">
                        ${Math.round(student.avg_understanding || 0)}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      ${student.ai_help_count || 0}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      ${student.teacher_help_count || 0}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      ${student.friend_help_count || 0}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      ${student.hint_help_count || 0}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="mt-6 flex gap-3">
            <button onclick="exportReportToPDF('weekly', '${startDate}', '${endDate}')" 
                    class="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-all">
              <i class="fas fa-file-pdf mr-2"></i>PDF出力
            </button>
            <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
              閉じる
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    hideLoading()
    console.error('週次レポートエラー:', error)
    alert('週次レポートの取得に失敗しました')
  }
}
window.showWeeklyReport = showWeeklyReport
window.loadHistoryTab = loadHistoryTab
window.showHistoryDiff = showHistoryDiff
window.rollbackToHistory = rollbackToHistory

// ==============================================
// 編集履歴機能
// ==============================================

// 履歴タブ表示
async function loadHistoryTab(curriculumId) {
  showLoading('編集履歴を読み込み中...')
  
  try {
    const response = await axios.get(`/api/curriculum/${curriculumId}/history`)
    
    hideLoading()
    
    if (!response.data.success) {
      alert('編集履歴の取得に失敗しました')
      return
    }
    
    const history = response.data.history
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">
                <i class="fas fa-history mr-2"></i>編集履歴
              </h2>
              <p class="text-sm mt-1">変更履歴: ${history.length}件</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-white hover:text-gray-200 text-3xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="p-6">
          ${history.length > 0 ? `
            <div class="space-y-4">
              ${history.map((record, index) => {
                const dataBefore = record.data_before ? JSON.parse(record.data_before) : null
                const dataAfter = record.data_after ? JSON.parse(record.data_after) : null
                const isRollback = record.action && record.action.includes('rollback')
                
                return `
                  <div class="border rounded-lg p-4 hover:bg-gray-50 transition ${
                    isRollback ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                  }">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                          <span class="px-3 py-1 rounded-full text-xs font-bold ${
                            record.action === 'create' ? 'bg-green-100 text-green-700' :
                            record.action === 'update' ? 'bg-blue-100 text-blue-700' :
                            record.action === 'delete' ? 'bg-red-100 text-red-700' :
                            isRollback ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-700'
                          }">
                            ${record.action === 'create' ? '新規作成' :
                              record.action === 'update' ? '更新' :
                              record.action === 'delete' ? '削除' :
                              isRollback ? 'ロールバック' :
                              record.action || '変更'}
                          </span>
                          ${index === 0 ? '<span class="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">最新</span>' : ''}
                        </div>
                        <div class="text-sm text-gray-600">
                          <i class="fas fa-clock mr-2"></i>
                          ${new Date(record.created_at).toLocaleString('ja-JP')}
                        </div>
                        ${record.changed_by_name ? `
                          <div class="text-sm text-gray-600 mt-1">
                            <i class="fas fa-user mr-2"></i>
                            変更者: ${record.changed_by_name}
                          </div>
                        ` : ''}
                      </div>
                      
                      <div class="flex gap-2">
                        ${dataBefore && dataAfter ? `
                          <button onclick="showHistoryDiff(${record.id}, ${curriculumId})" 
                                  class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm">
                            <i class="fas fa-code-branch mr-1"></i>差分表示
                          </button>
                        ` : ''}
                        ${index > 0 && !isRollback ? `
                          <button onclick="rollbackToHistory(${record.id}, ${curriculumId})" 
                                  class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                            <i class="fas fa-undo mr-1"></i>復元
                          </button>
                        ` : ''}
                      </div>
                    </div>
                    
                    ${dataBefore && dataAfter ? `
                      <div class="mt-3 p-3 bg-gray-50 rounded text-xs">
                        <div class="font-bold text-gray-700 mb-2">変更内容のプレビュー:</div>
                        <div class="grid grid-cols-2 gap-4">
                          <div>
                            <div class="text-gray-500 mb-1">変更前:</div>
                            <div class="text-gray-800">${dataBefore.unit_name || '不明'}</div>
                          </div>
                          <div>
                            <div class="text-gray-500 mb-1">変更後:</div>
                            <div class="text-gray-800 font-bold">${dataAfter.unit_name || '不明'}</div>
                          </div>
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `
              }).join('')}
            </div>
          ` : `
            <div class="text-center py-12 text-gray-500">
              <i class="fas fa-history text-6xl mb-4 text-gray-300"></i>
              <p class="text-lg">編集履歴がありません</p>
            </div>
          `}

          <div class="mt-6 flex justify-end">
            <button onclick="this.closest('.fixed').remove()" 
                    class="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
              閉じる
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    hideLoading()
    console.error('履歴読み込みエラー:', error)
    alert('編集履歴の読み込みに失敗しました')
  }
}

// 差分表示
async function showHistoryDiff(historyId, curriculumId) {
  showLoading('差分を計算中...')
  
  try {
    const response = await axios.get(`/api/curriculum/${curriculumId}/history`)
    const history = response.data.history
    const record = history.find(h => h.id === historyId)
    
    hideLoading()
    
    if (!record) {
      alert('履歴レコードが見つかりません')
      return
    }
    
    const dataBefore = JSON.parse(record.data_before)
    const dataAfter = JSON.parse(record.data_after)
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">
                <i class="fas fa-code-branch mr-2"></i>変更差分
              </h2>
              <p class="text-sm mt-1">${new Date(record.created_at).toLocaleString('ja-JP')}</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-white hover:text-gray-200 text-3xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="p-6">
          <div class="space-y-4">
            ${generateDiffView('学年', dataBefore.grade, dataAfter.grade)}
            ${generateDiffView('教科', dataBefore.subject, dataAfter.subject)}
            ${generateDiffView('教科書会社', dataBefore.textbook_company, dataAfter.textbook_company)}
            ${generateDiffView('単元名', dataBefore.unit_name, dataAfter.unit_name)}
            ${generateDiffView('単元目標', dataBefore.unit_goal, dataAfter.unit_goal)}
            ${generateDiffView('非認知能力目標', dataBefore.non_cognitive_goal, dataAfter.non_cognitive_goal)}
          </div>

          <div class="mt-6 flex gap-3">
            <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
              閉じる
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    hideLoading()
    console.error('差分表示エラー:', error)
    alert('差分の表示に失敗しました')
  }
}

// 差分ビュー生成
function generateDiffView(label, before, after) {
  const hasChange = before !== after
  
  return `
    <div class="border rounded-lg p-4 ${hasChange ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'}">
      <div class="font-bold text-gray-700 mb-3 flex items-center">
        ${hasChange ? '<i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>' : '<i class="fas fa-check-circle text-green-600 mr-2"></i>'}
        ${label}
        ${hasChange ? '<span class="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">変更あり</span>' : ''}
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-xs text-gray-500 mb-1">変更前:</div>
          <div class="p-2 bg-red-50 border border-red-200 rounded ${!hasChange ? 'text-gray-500' : 'text-gray-800'}">
            ${before || '（なし）'}
          </div>
        </div>
        <div>
          <div class="text-xs text-gray-500 mb-1">変更後:</div>
          <div class="p-2 bg-green-50 border border-green-200 rounded ${!hasChange ? 'text-gray-500' : 'font-bold text-gray-800'}">
            ${after || '（なし）'}
          </div>
        </div>
      </div>
    </div>
  `
}

// ロールバック実行
async function rollbackToHistory(historyId, curriculumId) {
  if (!confirm('この履歴にロールバックしますか？\n現在の状態は失われます。')) {
    return
  }
  
  showLoading('ロールバック中...')
  
  try {
    const response = await axios.post(`/api/curriculum/${curriculumId}/rollback/${historyId}`)
    
    hideLoading()
    
    if (!response.data.success) {
      alert('ロールバックに失敗しました: ' + response.data.error)
      return
    }
    
    alert('✅ ロールバックが完了しました')
    
    // モーダルを閉じて学習のてびきを再読み込み
    document.querySelectorAll('.fixed.inset-0').forEach(modal => modal.remove())
    loadGuidePage(curriculumId)
  } catch (error) {
    hideLoading()
    console.error('ロールバックエラー:', error)
    alert('ロールバックに失敗しました')
  }
}

// 月次レポート表示
async function showMonthlyReport() {
  showLoading('月次レポートを生成中...')
  
  try {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    
    const response = await axios.get(
      `/api/reports/monthly/${state.student.classCode}?year=${year}&month=${month}`
    )
    
    hideLoading()
    
    if (!response.data.success) {
      alert('月次レポートの取得に失敗しました')
      return
    }
    
    const studentStats = response.data.student_stats
    const curriculumProgress = response.data.curriculum_progress
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold">月次レポート</h2>
              <p class="text-sm mt-1">${year}年${month}月</p>
              <p class="text-sm">クラス: ${state.student.classCode}</p>
            </div>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-white hover:text-gray-200 text-3xl">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="p-6">
          <!-- 児童別統計 -->
          <h3 class="text-lg font-bold text-gray-800 mb-4">児童別学習状況</h3>
          <div class="overflow-x-auto mb-8">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No.</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">氏名</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">完了カード数</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">平均理解度</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">活動日数</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">ヘルプ回数</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${studentStats.map(student => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${student.student_number}</td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${student.student_name}</td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-bold">
                        ${student.completed_cards || 0}
                      </span>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span class="px-2 py-1 ${
                        (student.avg_understanding || 0) >= 80 ? 'bg-green-100 text-green-800' :
                        (student.avg_understanding || 0) >= 60 ? 'bg-blue-100 text-blue-800' :
                        (student.avg_understanding || 0) >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      } rounded-full font-bold">
                        ${Math.round(student.avg_understanding || 0)}
                      </span>
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      ${student.active_days || 0}日
                    </td>
                    <td class="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-700">
                      ${student.total_help_count || 0}回
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- カリキュラム別進捗 -->
          <h3 class="text-lg font-bold text-gray-800 mb-4">カリキュラム別進捗</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            ${curriculumProgress.map(curr => `
              <div class="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <h4 class="font-bold text-gray-800 mb-2">${curr.subject} - ${curr.unit_name}</h4>
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">取組人数:</span>
                  <span class="font-bold text-blue-600">${curr.students_count || 0}名</span>
                </div>
                <div class="flex items-center justify-between text-sm mt-1">
                  <span class="text-gray-600">完了カード:</span>
                  <span class="font-bold text-green-600">${curr.completed_cards_total || 0}枚</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="mt-6 flex gap-3">
            <button onclick="exportReportToPDF('monthly', '${year}', '${month}')" 
                    class="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-all">
              <i class="fas fa-file-pdf mr-2"></i>PDF出力
            </button>
            <button onclick="this.closest('.fixed').remove()" 
                    class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
              閉じる
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    hideLoading()
    console.error('月次レポートエラー:', error)
    alert('月次レポートの取得に失敗しました')
  }
}
window.showMonthlyReport = showMonthlyReport

// レポートPDF出力
async function exportReportToPDF(type, param1, param2) {
  showLoading('PDFを生成中...')
  
  try {
    const modal = document.querySelector('.fixed.inset-0')
    if (!modal) {
      throw new Error('レポートが見つかりません')
    }

    const opt = {
      margin: 10,
      filename: type === 'weekly' 
        ? `週次レポート_${param1}_${param2}.pdf`
        : `月次レポート_${param1}年${param2}月.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    await html2pdf().set(opt).from(modal).save()
    
    hideLoading()
    console.log('✅ レポートPDF生成完了')
  } catch (error) {
    hideLoading()
    console.error('PDF生成エラー:', error)
    alert('PDF生成に失敗しました')
  }
}
window.exportReportToPDF = exportReportToPDF

// ==============================================
// 進捗ボード用ヘルパー関数（新）
// ==============================================

function generateProgressBoardRows(students, curriculums) {
  if (!students || students.length === 0) {
    return '<div class="col-span-full text-center text-gray-500 py-8">進捗データがありません</div>'
  }

  return students.map(student => {
    const currProgress = student.curriculums[0] || {}
    const priority = currProgress.intervention_priority || 0
    const hasHelp = currProgress.has_help_request || false
    const cardProgress = currProgress.card_progress || []
    const checkProgress = currProgress.check_test_progress || []
    const optionalProgress = currProgress.optional_progress || []
    const helpStats = currProgress.help_stats || []

    // 優先度スコアによる背景色
    const bgColor = hasHelp ? 'bg-orange-100' : 
                    priority >= 100 ? 'bg-red-50' :
                    priority >= 60 ? 'bg-yellow-50' : 'bg-white'

    return `
      <div class="grid grid-cols-[150px_1fr] gap-2 py-2 border-b hover:bg-gray-50 ${bgColor}">
        <!-- 児童名 -->
        <div class="flex flex-col justify-center px-2 cursor-pointer hover:bg-blue-50 rounded transition" 
             onclick='showStudentDetail(${JSON.stringify(student).replace(/'/g, "&apos;")})'>
          <div class="font-bold text-sm text-blue-600 hover:text-blue-800">
            ${student.student_name}
            <i class="fas fa-info-circle text-xs ml-1"></i>
          </div>
          <div class="text-xs text-gray-500">No.${student.student_number}</div>
          ${hasHelp ? '<div class="text-xs text-orange-600 font-bold mt-1"><i class="fas fa-hand-paper mr-1"></i>ヘルプ</div>' : ''}
          ${priority >= 60 && !hasHelp ? '<div class="text-xs text-red-600 font-bold mt-1"><i class="fas fa-exclamation-triangle mr-1"></i>停滞</div>' : ''}
        </div>

        <div class="grid grid-cols-[2fr_1fr_2fr_80px] gap-2">
          <!-- 学習カード進捗 -->
          <div class="relative">
            ${generateCardProgressBar(cardProgress)}
            <div class="text-xs text-gray-600 mt-1">
              ${generateHelpTypeIndicators(helpStats)}
            </div>
          </div>

          <!-- チェックテスト -->
          <div class="flex items-center">
            ${generateCheckTestIndicator(checkProgress)}
          </div>

          <!-- 選択問題 -->
          <div class="flex items-center gap-1 flex-wrap">
            ${generateOptionalProblemIndicators(optionalProgress)}
          </div>

          <!-- 優先度スコア -->
          <div class="flex flex-col items-center justify-center">
            <div class="text-lg font-bold ${getPriorityColor(priority)}">${priority}</div>
            <div class="text-xs text-gray-500">優先度</div>
          </div>
        </div>
      </div>
    `
  }).join('')
}

function generateCardProgressBar(cardProgress) {
  if (!cardProgress || cardProgress.length === 0) {
    return '<div class="bg-gray-200 h-8 rounded flex items-center justify-center text-xs text-gray-500">未開始</div>'
  }

  // コース別にカウント
  const basicCards = cardProgress.filter(c => c.course_level === 'basic')
  const standardCards = cardProgress.filter(c => c.course_level === 'standard')
  const advancedCards = cardProgress.filter(c => c.course_level === 'advanced')

  const basicCompleted = basicCards.filter(c => c.status === 'completed').length
  const standardCompleted = standardCards.filter(c => c.status === 'completed').length
  const advancedCompleted = advancedCards.filter(c => c.status === 'completed').length

  const totalCards = 18 // 3コース × 6枚
  const completed = basicCompleted + standardCompleted + advancedCompleted
  const percentComplete = Math.round((completed / totalCards) * 100)

  // 横棒グラフ（3色）
  const basicPercent = (basicCompleted / totalCards) * 100
  const standardPercent = (standardCompleted / totalCards) * 100
  const advancedPercent = (advancedCompleted / totalCards) * 100

  return `
    <div class="relative bg-gray-200 h-8 rounded overflow-hidden flex">
      ${basicPercent > 0 ? `<div class="bg-green-500 h-full" style="width: ${basicPercent}%"></div>` : ''}
      ${standardPercent > 0 ? `<div class="bg-blue-500 h-full" style="width: ${standardPercent}%"></div>` : ''}
      ${advancedPercent > 0 ? `<div class="bg-purple-500 h-full" style="width: ${advancedPercent}%"></div>` : ''}
      <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">
        ${completed}/${totalCards}
      </div>
    </div>
  `
}

function generateCheckTestIndicator(checkProgress) {
  const total = 6 // チェックテスト6問想定
  const completed = checkProgress.filter(p => p.status === 'completed').length
  const failed = checkProgress.filter(p => p.status === 'failed').length

  if (completed === 0 && failed === 0) {
    return '<div class="bg-gray-200 w-full h-8 rounded flex items-center justify-center text-xs">未実施</div>'
  }

  const color = completed === total ? 'bg-green-500' : 
                failed > 0 ? 'bg-red-400' : 'bg-yellow-400'

  return `
    <div class="${color} w-full h-8 rounded flex items-center justify-center text-white text-xs font-bold">
      ${completed}/${total}
      ${failed > 0 ? `<span class="ml-1 text-red-800">×${failed}</span>` : ''}
    </div>
  `
}

function generateOptionalProblemIndicators(optionalProgress) {
  const total = 6 // 選択問題6題想定
  const completed = optionalProgress.filter(p => p.status === 'completed').length

  // 6つの丸を表示
  let html = ''
  for (let i = 1; i <= total; i++) {
    const problem = optionalProgress.find(p => p.problem_number === i)
    const status = problem ? problem.status : 'not_started'
    const bgColor = status === 'completed' ? 'bg-blue-500' : 
                    status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-300'
    
    html += `<div class="${bgColor} w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold">${i}</div>`
  }

  return html
}

function generateHelpTypeIndicators(helpStats) {
  if (!helpStats || helpStats.length === 0) {
    return '<span class="text-gray-400">助け: なし</span>'
  }

  const icons = {
    'ai': '<i class="fas fa-robot text-purple-500" title="AI先生"></i>',
    'teacher': '<i class="fas fa-user-tie text-blue-500" title="先生"></i>',
    'friend': '<i class="fas fa-user-friends text-green-500" title="友達"></i>',
    'hint': '<i class="fas fa-lightbulb text-yellow-500" title="ヒント"></i>'
  }

  return helpStats.map(stat => {
    const icon = icons[stat.help_type] || ''
    return `${icon} ${stat.count}`
  }).join(' ')
}

function getPriorityColor(priority) {
  if (priority >= 100) return 'text-red-600'
  if (priority >= 80) return 'text-orange-600'
  if (priority >= 60) return 'text-yellow-600'
  if (priority >= 40) return 'text-blue-600'
  return 'text-gray-600'
}

function countHelpRequests(students) {
  return students.filter(s => 
    s.curriculums.some(c => c.has_help_request)
  ).length
}

function countStagnant(students) {
  return students.filter(s => 
    s.curriculums.some(c => c.intervention_priority >= 60 && !c.has_help_request)
  ).length
}

function generateHelpRequestList(students) {
  const helpRequests = students.filter(s => 
    s.curriculums.some(c => c.has_help_request)
  )

  if (helpRequests.length === 0) {
    return '<div class="text-gray-500 text-center py-2">なし</div>'
  }

  return helpRequests.map(student => {
    const curr = student.curriculums.find(c => c.has_help_request)
    const card = curr.card_progress.find(c => c.help_requested_at && !c.help_resolved_at)
    const waitingMinutes = card ? card.help_waiting_minutes : 0

    return `
      <div class="bg-white rounded p-2 border-l-4 border-orange-500">
        <div class="flex items-center justify-between">
          <div class="font-bold">${student.student_name}</div>
          <div class="text-xs text-orange-600">${waitingMinutes}分待機</div>
        </div>
        <div class="text-xs text-gray-600 mt-1">
          ${card ? card.card_title : '不明'}
        </div>
      </div>
    `
  }).join('')
}

function generateStagnantList(students) {
  const stagnant = students.filter(s => 
    s.curriculums.some(c => c.intervention_priority >= 60 && !c.has_help_request)
  )

  if (stagnant.length === 0) {
    return '<div class="text-gray-500 text-center py-2">なし</div>'
  }

  return stagnant.map(student => {
    const curr = student.curriculums.find(c => c.intervention_priority >= 60)
    const card = curr.card_progress.find(c => c.stagnant_minutes > 10)
    const stagnantMinutes = card ? card.stagnant_minutes : 0

    return `
      <div class="bg-white rounded p-2 border-l-4 border-red-500">
        <div class="flex items-center justify-between">
          <div class="font-bold">${student.student_name}</div>
          <div class="text-xs text-red-600">${stagnantMinutes}分停滞</div>
        </div>
        <div class="text-xs text-gray-600 mt-1">
          ${card ? card.card_title : '不明'}
        </div>
      </div>
    `
  }).join('')
}

function generateHelpStatsNew(students) {
  const allHelpStats = {}
  students.forEach(student => {
    student.curriculums.forEach(curr => {
      curr.help_stats.forEach(stat => {
        allHelpStats[stat.help_type] = (allHelpStats[stat.help_type] || 0) + stat.count
      })
    })
  })

  const helpTypes = [
    { key: 'ai', label: 'AI先生', icon: 'robot', color: 'purple' },
    { key: 'teacher', label: '先生', icon: 'user-tie', color: 'blue' },
    { key: 'friend', label: '友達', icon: 'user-friends', color: 'green' },
    { key: 'hint', label: 'ヒント', icon: 'lightbulb', color: 'yellow' }
  ]

  return helpTypes.map(type => {
    const count = allHelpStats[type.key] || 0
    return `
      <div class="bg-${type.color}-50 border border-${type.color}-200 rounded p-2 text-center">
        <i class="fas fa-${type.icon} text-${type.color}-500 text-lg"></i>
        <div class="font-bold text-lg mt-1">${count}</div>
        <div class="text-xs text-gray-600">${type.label}</div>
      </div>
    `
  }).join('')
}

// ==============================================
// 問題管理機能
// ==============================================

// 導入問題編集
async function editIntroProblem(courseId, courseIndex) {
  try {
    const response = await axios.get(`/api/course/${courseId}`)
    const course = response.data.course
    const introProblem = course.introduction_problem
    
    if (!introProblem) {
      alert('導入問題が見つかりません')
      return
    }

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>導入問題を編集
            </h3>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                タイトル
              </label>
              <input type="text" id="editIntroProblemTitle" 
                     value="${introProblem.title || ''}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                問題内容
              </label>
              <textarea id="editIntroProblemContent" rows="4"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${introProblem.content || ''}</textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ヒント・答え（任意）
              </label>
              <textarea id="editIntroProblemAnswer" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${introProblem.answer || ''}</textarea>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button onclick="saveIntroProblem(${courseId}, ${courseIndex})"
                    class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
              <i class="fas fa-save mr-2"></i>保存する
            </button>
            <button onclick="this.closest('.fixed').remove()"
                    class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
              キャンセル
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('導入問題読み込みエラー:', error)
    alert('導入問題の読み込みに失敗しました')
  }
}

// 導入問題保存
async function saveIntroProblem(courseId, courseIndex) {
  try {
    showLoading('導入問題を保存中...')
    
    const title = document.getElementById('editIntroProblemTitle').value
    const content = document.getElementById('editIntroProblemContent').value
    const answer = document.getElementById('editIntroProblemAnswer').value

    await axios.put(`/api/course/${courseId}/intro-problem`, {
      title,
      content,
      answer
    })

    hideLoading()
    alert('✅ 導入問題を保存しました')
    
    // モーダルを閉じてページを再読み込み
    document.querySelector('.fixed.inset-0').remove()
    if (state.selectedCurriculum) {
      loadGuidePage(state.selectedCurriculum.id)
    }
  } catch (error) {
    hideLoading()
    console.error('導入問題保存エラー:', error)
    alert('導入問題の保存に失敗しました')
  }
}

// 新規導入問題追加
async function addNewIntroProblem(courseId) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-plus-circle mr-2"></i>導入問題を追加
          </h3>
          <button onclick="this.closest('.fixed').remove()" 
                  class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              タイトル
            </label>
            <input type="text" id="newIntroProblemTitle" 
                   placeholder="例: 学習の目標"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              問題内容
            </label>
            <textarea id="newIntroProblemContent" rows="4" 
                      placeholder="問題文を入力してください"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ヒント・答え（任意）
            </label>
            <textarea id="newIntroProblemAnswer" rows="3"
                      placeholder="ヒントや答えを入力してください"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button onclick="saveNewIntroProblem(${courseId})"
                  class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md">
            <i class="fas fa-plus mr-2"></i>追加する
          </button>
          <button onclick="this.closest('.fixed').remove()"
                  class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

async function saveNewIntroProblem(courseId) {
  try {
    showLoading('導入問題を追加中...')
    
    const title = document.getElementById('newIntroProblemTitle').value
    const content = document.getElementById('newIntroProblemContent').value
    const answer = document.getElementById('newIntroProblemAnswer').value

    if (!title || !content) {
      alert('タイトルと問題内容は必須です')
      hideLoading()
      return
    }

    await axios.put(`/api/course/${courseId}/intro-problem`, {
      title,
      content,
      answer
    })

    hideLoading()
    alert('✅ 導入問題を追加しました')
    
    document.querySelector('.fixed.inset-0').remove()
    if (state.selectedCurriculum) {
      loadGuidePage(state.selectedCurriculum.id)
    }
  } catch (error) {
    hideLoading()
    console.error('導入問題追加エラー:', error)
    alert('導入問題の追加に失敗しました')
  }
}

// チェックテスト編集
async function editCheckTest(curriculumId) {
  try {
    const response = await axios.get(`/api/curriculum/${curriculumId}/metadata`)
    const metadata = response.data
    const checkTest = metadata.common_check_test
    
    if (!checkTest) {
      alert('チェックテストが見つかりません')
      return
    }

    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>チェックテストを編集
            </h3>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea id="editCheckTestDesc" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${checkTest.test_description || ''}</textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                注意事項
              </label>
              <textarea id="editCheckTestNote" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${checkTest.test_note || ''}</textarea>
            </div>
          </div>

          <div class="mb-4">
            <div class="flex justify-between items-center mb-3">
              <h4 class="text-lg font-bold text-gray-800">問題一覧</h4>
              <button onclick="addCheckTestProblem(${curriculumId})"
                      class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all">
                <i class="fas fa-plus mr-2"></i>問題を追加
              </button>
            </div>
            
            <div id="checkTestProblemsList" class="space-y-3">
              ${(checkTest.sample_problems || []).map((problem, index) => `
                <div class="border rounded-lg p-4 bg-gray-50">
                  <div class="flex gap-4">
                    <div class="flex-1">
                      <label class="block text-xs text-gray-600 mb-1">問題 ${index + 1}</label>
                      <input type="text" value="${problem.problem_text}"
                             data-index="${index}" data-field="problem_text"
                             class="check-test-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="w-48">
                      <label class="block text-xs text-gray-600 mb-1">答え</label>
                      <input type="text" value="${problem.answer}"
                             data-index="${index}" data-field="answer"
                             class="check-test-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="flex items-end">
                      <button onclick="deleteCheckTestProblem(${curriculumId}, ${problem.problem_number})"
                              class="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button onclick="saveCheckTest(${curriculumId})"
                    class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
              <i class="fas fa-save mr-2"></i>保存する
            </button>
            <button onclick="this.closest('.fixed').remove()"
                    class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
              キャンセル
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('チェックテスト読み込みエラー:', error)
    alert('チェックテストの読み込みに失敗しました')
  }
}

async function saveCheckTest(curriculumId) {
  try {
    showLoading('チェックテストを保存中...')
    
    const description = document.getElementById('editCheckTestDesc').value
    const note = document.getElementById('editCheckTestNote').value
    
    const problems = []
    document.querySelectorAll('.check-test-input[data-field="problem_text"]').forEach((input, index) => {
      const answerInput = document.querySelector(`.check-test-input[data-index="${index}"][data-field="answer"]`)
      problems.push({
        problem_number: index + 1,
        problem_text: input.value,
        answer: answerInput.value
      })
    })

    await axios.put(`/api/curriculum/${curriculumId}/check-test`, {
      test_description: description,
      test_note: note,
      sample_problems: problems
    })

    hideLoading()
    alert('✅ チェックテストを保存しました')
    
    document.querySelector('.fixed.inset-0').remove()
    if (state.selectedCurriculum) {
      loadGuidePage(state.selectedCurriculum.id)
    }
  } catch (error) {
    hideLoading()
    console.error('チェックテスト保存エラー:', error)
    alert('チェックテストの保存に失敗しました')
  }
}

// チェックテスト問題追加
function addCheckTestProblem(curriculumId) {
  const list = document.getElementById('checkTestProblemsList')
  const index = list.children.length
  
  const newProblem = document.createElement('div')
  newProblem.className = 'border rounded-lg p-4 bg-gray-50'
  newProblem.innerHTML = `
    <div class="flex gap-4">
      <div class="flex-1">
        <label class="block text-xs text-gray-600 mb-1">問題 ${index + 1}</label>
        <input type="text" placeholder="問題文を入力"
               data-index="${index}" data-field="problem_text"
               class="check-test-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="w-48">
        <label class="block text-xs text-gray-600 mb-1">答え</label>
        <input type="text" placeholder="答えを入力"
               data-index="${index}" data-field="answer"
               class="check-test-input w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="flex items-end">
        <button onclick="this.closest('.border').remove()"
                class="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-all">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `
  
  list.appendChild(newProblem)
}

// チェックテスト問題削除
async function deleteCheckTestProblem(curriculumId, problemNumber) {
  if (!confirm('この問題を削除しますか？')) return
  
  try {
    showLoading('問題を削除中...')
    
    await axios.delete(`/api/curriculum/${curriculumId}/check-test/${problemNumber}`)
    
    hideLoading()
    alert('✅ 問題を削除しました')
    
    // モーダルを閉じて再度開く
    document.querySelector('.fixed.inset-0').remove()
    editCheckTest(curriculumId)
  } catch (error) {
    hideLoading()
    console.error('問題削除エラー:', error)
    alert('問題の削除に失敗しました')
  }
}

// 選択問題編集
async function editOptionalProblem(problemId) {
  try {
    const response = await axios.get(`/api/optional-problem/${problemId}`)
    const problem = response.data.problem
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-gray-800">
              <i class="fas fa-edit mr-2"></i>選択問題を編集
            </h3>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                タイトル
              </label>
              <input type="text" id="editOptionalProblemTitle" 
                     value="${problem.problem_title || ''}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea id="editOptionalProblemDesc" rows="3"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${problem.problem_description || ''}</textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                問題内容
              </label>
              <textarea id="editOptionalProblemContent" rows="4"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${problem.problem_content || ''}</textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                学習の意味
              </label>
              <textarea id="editOptionalProblemMeaning" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">${problem.learning_meaning || ''}</textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                難易度
              </label>
              <select id="editOptionalProblemDifficulty"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="easy" ${problem.difficulty_level === 'easy' ? 'selected' : ''}>★ かんたん</option>
                <option value="medium" ${problem.difficulty_level === 'medium' ? 'selected' : ''}>★★ ふつう</option>
                <option value="hard" ${problem.difficulty_level === 'hard' ? 'selected' : ''}>★★★ むずかしい</option>
                <option value="very_hard" ${problem.difficulty_level === 'very_hard' ? 'selected' : ''}>★★★★ とてもむずかしい</option>
              </select>
            </div>
          </div>

          <div class="flex gap-3 mt-6">
            <button onclick="saveOptionalProblem(${problemId})"
                    class="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md">
              <i class="fas fa-save mr-2"></i>保存する
            </button>
            <button onclick="this.closest('.fixed').remove()"
                    class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
              キャンセル
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('選択問題読み込みエラー:', error)
    alert('選択問題の読み込みに失敗しました')
  }
}

async function saveOptionalProblem(problemId) {
  try {
    showLoading('選択問題を保存中...')
    
    const title = document.getElementById('editOptionalProblemTitle').value
    const description = document.getElementById('editOptionalProblemDesc').value
    const content = document.getElementById('editOptionalProblemContent').value
    const meaning = document.getElementById('editOptionalProblemMeaning').value
    const difficulty = document.getElementById('editOptionalProblemDifficulty').value

    await axios.put(`/api/optional-problem/${problemId}`, {
      problem_title: title,
      problem_description: description,
      problem_content: content,
      learning_meaning: meaning,
      difficulty_level: difficulty
    })

    hideLoading()
    alert('✅ 選択問題を保存しました')
    
    document.querySelector('.fixed.inset-0').remove()
    if (state.selectedCurriculum) {
      loadGuidePage(state.selectedCurriculum.id)
    }
  } catch (error) {
    hideLoading()
    console.error('選択問題保存エラー:', error)
    alert('選択問題の保存に失敗しました')
  }
}

// 選択問題削除
async function deleteOptionalProblem(problemId) {
  if (!confirm('この選択問題を削除しますか？')) return
  
  try {
    showLoading('選択問題を削除中...')
    
    await axios.delete(`/api/optional-problem/${problemId}`)
    
    hideLoading()
    alert('✅ 選択問題を削除しました')
    
    if (state.selectedCurriculum) {
      loadGuidePage(state.selectedCurriculum.id)
    }
  } catch (error) {
    hideLoading()
    console.error('選択問題削除エラー:', error)
    alert('選択問題の削除に失敗しました')
  }
}

// 選択問題追加
async function addOptionalProblem(curriculumId) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-plus-circle mr-2"></i>選択問題を追加
          </h3>
          <button onclick="this.closest('.fixed').remove()" 
                  class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              タイトル
            </label>
            <input type="text" id="newOptionalProblemTitle" 
                   placeholder="例: 発展問題"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea id="newOptionalProblemDesc" rows="3"
                      placeholder="問題の説明を入力してください"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              問題内容
            </label>
            <textarea id="newOptionalProblemContent" rows="4"
                      placeholder="問題文を入力してください"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              学習の意味（任意）
            </label>
            <textarea id="newOptionalProblemMeaning" rows="2"
                      placeholder="この問題で何を学べるか"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              難易度
            </label>
            <select id="newOptionalProblemDifficulty"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="easy">★ かんたん</option>
              <option value="medium" selected>★★ ふつう</option>
              <option value="hard">★★★ むずかしい</option>
              <option value="very_hard">★★★★ とてもむずかしい</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button onclick="saveNewOptionalProblem(${curriculumId})"
                  class="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md">
            <i class="fas fa-plus mr-2"></i>追加する
          </button>
          <button onclick="this.closest('.fixed').remove()"
                  class="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-all">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

async function saveNewOptionalProblem(curriculumId) {
  try {
    showLoading('選択問題を追加中...')
    
    const title = document.getElementById('newOptionalProblemTitle').value
    const description = document.getElementById('newOptionalProblemDesc').value
    const content = document.getElementById('newOptionalProblemContent').value
    const meaning = document.getElementById('newOptionalProblemMeaning').value
    const difficulty = document.getElementById('newOptionalProblemDifficulty').value

    if (!title || !content) {
      alert('タイトルと問題内容は必須です')
      hideLoading()
      return
    }

    await axios.post(`/api/curriculum/${curriculumId}/optional-problem`, {
      problem_title: title,
      problem_description: description,
      problem_content: content,
      learning_meaning: meaning,
      difficulty_level: difficulty
    })

    hideLoading()
    alert('✅ 選択問題を追加しました')
    
    document.querySelector('.fixed.inset-0').remove()
    if (state.selectedCurriculum) {
      loadGuidePage(state.selectedCurriculum.id)
    }
  } catch (error) {
    hideLoading()
    console.error('選択問題追加エラー:', error)
    alert('選択問題の追加に失敗しました')
  }
}

// ============================================
// 認証機能
// ============================================

// APIリクエストヘルパー（認証トークン付き）
async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (state.auth.sessionToken) {
    headers['Authorization'] = `Bearer ${state.auth.sessionToken}`
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  })
  
  // 401エラー（認証切れ）の場合、リフレッシュを試みる
  if (response.status === 401 && state.auth.refreshToken) {
    const refreshed = await refreshSession()
    if (refreshed) {
      // リトライ
      headers['Authorization'] = `Bearer ${state.auth.sessionToken}`
      return fetch(url, { ...options, headers })
    } else {
      // リフレッシュ失敗: ログアウト
      logout()
      return response
    }
  }
  
  return response
}

// セッション検証
async function verifySession() {
  try {
    const response = await authFetch('/api/auth/me')
    if (!response.ok) {
      logout()
    }
  } catch (error) {
    console.error('セッション検証エラー:', error)
    logout()
  }
}

// セッション更新
async function refreshSession() {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: state.auth.refreshToken })
    })
    
    if (!response.ok) {
      return false
    }
    
    const data = await response.json()
    state.auth.sessionToken = data.session_token
    localStorage.setItem('session_token', data.session_token)
    
    return true
  } catch (error) {
    console.error('セッション更新エラー:', error)
    return false
  }
}

// ログイン画面表示
function renderLoginPage() {
  state.currentView = 'login'
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center px-4">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <!-- ヘッダー -->
        <div class="text-center mb-8">
          <i class="fas fa-graduation-cap text-6xl text-indigo-600 mb-4"></i>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            自由進度学習支援システム
          </h1>
          <p class="text-gray-600">ログインしてください</p>
        </div>
        
        <!-- ログインフォーム -->
        <form id="loginForm" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-envelope mr-2"></i>メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="example@school.jp"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lock mr-2"></i>パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="パスワードを入力"
            />
          </div>
          
          <!-- エラーメッセージ -->
          <div id="loginError" class="hidden bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span id="loginErrorMessage"></span>
          </div>
          
          <!-- ログインボタン -->
          <button
            type="submit"
            class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <i class="fas fa-sign-in-alt mr-2"></i>ログイン
          </button>
        </form>
        
        <!-- 新規登録リンク -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            アカウントをお持ちでない場合は
            <button onclick="renderRegisterPage()" class="text-indigo-600 hover:text-indigo-800 font-medium">
              新規登録
            </button>
          </p>
        </div>
        
        <!-- デモログイン -->
        <div class="mt-4 text-center">
          <button
            onclick="demoLogin()"
            class="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            <i class="fas fa-user-secret mr-1"></i>デモアカウントでログイン
          </button>
        </div>
      </div>
    </div>
  `
  
  // ログインフォームの送信処理
  document.getElementById('loginForm').addEventListener('submit', handleLogin)
}

// ログイン処理
async function handleLogin(event) {
  event.preventDefault()
  
  const email = document.getElementById('email').value
  const password = document.getElementById('password').value
  const errorDiv = document.getElementById('loginError')
  const errorMessage = document.getElementById('loginErrorMessage')
  
  loadingManager.show('ログイン中...')
  errorDiv.classList.add('hidden')
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      loadingManager.hide()
      errorMessage.textContent = data.error || 'ログインに失敗しました'
      errorDiv.classList.remove('hidden')
      return
    }
    
    // 認証情報を保存
    state.auth.isAuthenticated = true
    state.auth.sessionToken = data.session_token
    state.auth.refreshToken = data.refresh_token
    state.auth.user = data.user
    
    localStorage.setItem('session_token', data.session_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    
    // ユーザー情報をstateに反映
    state.student.id = data.user.id
    state.student.name = data.user.name
    state.student.classCode = data.user.class_code
    
    loadingManager.hide()
    
    // WebSocketに接続
    websocket.connect()
    
    // トップページへ遷移
    renderTopPage()
  } catch (error) {
    loadingManager.hide()
    console.error('ログインエラー:', error)
    errorMessage.textContent = 'ログインに失敗しました。もう一度お試しください。'
    errorDiv.classList.remove('hidden')
  }
}

// 新規登録画面表示
function renderRegisterPage() {
  state.currentView = 'register'
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center px-4 py-8">
      <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <!-- ヘッダー -->
        <div class="text-center mb-8">
          <i class="fas fa-user-plus text-6xl text-indigo-600 mb-4"></i>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            新規登録
          </h1>
          <p class="text-gray-600">アカウントを作成してください</p>
        </div>
        
        <!-- 登録フォーム -->
        <form id="registerForm" class="space-y-4">
          <div>
            <label for="regName" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-user mr-2"></i>氏名
            </label>
            <input
              type="text"
              id="regName"
              name="name"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="山田 太郎"
            />
          </div>
          
          <div>
            <label for="regEmail" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-envelope mr-2"></i>メールアドレス
            </label>
            <input
              type="email"
              id="regEmail"
              name="email"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="example@school.jp"
            />
          </div>
          
          <div>
            <label for="regPassword" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-lock mr-2"></i>パスワード
            </label>
            <input
              type="password"
              id="regPassword"
              name="password"
              required
              minlength="6"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="6文字以上"
            />
          </div>
          
          <div>
            <label for="regRole" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-user-tag mr-2"></i>役割
            </label>
            <select
              id="regRole"
              name="role"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="student">児童・生徒</option>
              <option value="teacher">教師</option>
              <option value="admin">管理者</option>
            </select>
          </div>
          
          <div>
            <label for="regClassCode" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-school mr-2"></i>クラスコード
            </label>
            <input
              type="text"
              id="regClassCode"
              name="class_code"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="CLASS2024A"
            />
          </div>
          
          <div id="studentNumberDiv">
            <label for="regStudentNumber" class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-id-badge mr-2"></i>出席番号
            </label>
            <input
              type="number"
              id="regStudentNumber"
              name="student_number"
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="1"
            />
          </div>
          
          <!-- エラーメッセージ -->
          <div id="registerError" class="hidden bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span id="registerErrorMessage"></span>
          </div>
          
          <!-- 登録ボタン -->
          <button
            type="submit"
            class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
          >
            <i class="fas fa-user-plus mr-2"></i>登録する
          </button>
        </form>
        
        <!-- ログインリンク -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            すでにアカウントをお持ちの場合は
            <button onclick="renderLoginPage()" class="text-indigo-600 hover:text-indigo-800 font-medium">
              ログイン
            </button>
          </p>
        </div>
      </div>
    </div>
  `
  
  // 役割に応じて出席番号の表示を切り替え
  document.getElementById('regRole').addEventListener('change', (e) => {
    const studentNumberDiv = document.getElementById('studentNumberDiv')
    if (e.target.value === 'student') {
      studentNumberDiv.style.display = 'block'
      document.getElementById('regStudentNumber').required = true
    } else {
      studentNumberDiv.style.display = 'none'
      document.getElementById('regStudentNumber').required = false
    }
  })
  
  // 登録フォームの送信処理
  document.getElementById('registerForm').addEventListener('submit', handleRegister)
}

// 新規登録処理
async function handleRegister(event) {
  event.preventDefault()
  
  const name = document.getElementById('regName').value
  const email = document.getElementById('regEmail').value
  const password = document.getElementById('regPassword').value
  const role = document.getElementById('regRole').value
  const classCode = document.getElementById('regClassCode').value
  const studentNumber = role === 'student' ? document.getElementById('regStudentNumber').value : null
  
  const errorDiv = document.getElementById('registerError')
  const errorMessage = document.getElementById('registerErrorMessage')
  
  loadingManager.show('登録中...')
  errorDiv.classList.add('hidden')
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        class_code: classCode,
        student_number: studentNumber
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      loadingManager.hide()
      errorMessage.textContent = data.error || '登録に失敗しました'
      errorDiv.classList.remove('hidden')
      return
    }
    
    loadingManager.hide()
    alert('✅ 登録が完了しました！ログインしてください。')
    renderLoginPage()
  } catch (error) {
    loadingManager.hide()
    console.error('登録エラー:', error)
    errorMessage.textContent = '登録に失敗しました。もう一度お試しください。'
    errorDiv.classList.remove('hidden')
  }
}

// ログアウト処理
async function logout() {
  try {
    if (state.auth.sessionToken) {
      await authFetch('/api/auth/logout', { method: 'POST' })
    }
  } catch (error) {
    console.error('ログアウトエラー:', error)
  }
  
  // WebSocketを切断
  websocket.disconnect()
  
  // ローカルストレージをクリア
  localStorage.removeItem('session_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  
  // 状態をリセット
  state.auth.isAuthenticated = false
  state.auth.sessionToken = null
  state.auth.refreshToken = null
  state.auth.user = null
  
  // ログイン画面へ遷移
  renderLoginPage()
}

// デモログイン
function demoLogin() {
  document.getElementById('email').value = 'demo@school.jp'
  document.getElementById('password').value = 'demo123'
  document.getElementById('loginForm').dispatchEvent(new Event('submit'))
}

// ============================================
// WebSocket リアルタイム通信
// ============================================

// WebSocket接続管理
const websocket = {
  ws: null,
  reconnectTimer: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
  
  // 接続
  connect: function() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }
    
    if (!state.student.classCode) {
      console.error('No class code available')
      return
    }
    
    // WebSocket URLを構築
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const url = `${protocol}//${host}/api/ws?classCode=${state.student.classCode}&userId=${state.student.id}&role=${state.auth.user?.role || 'student'}`
    
    console.log('Connecting to WebSocket:', url)
    
    try {
      this.ws = new WebSocket(url)
      
      this.ws.onopen = (event) => {
        console.log('✅ WebSocket connected')
        this.reconnectAttempts = 0
        
        // Ping/Pong for keep-alive (30秒ごと)
        this.startPingInterval()
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('WebSocket message parse error:', error)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        this.stopPingInterval()
        
        // 自動再接続
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          
          this.reconnectTimer = setTimeout(() => {
            this.connect()
          }, this.reconnectDelay)
        } else {
          console.error('Max reconnect attempts reached')
        }
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  },
  
  // 切断
  disconnect: function() {
    this.stopPingInterval()
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  },
  
  // メッセージ送信
  send: function(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.error('WebSocket is not connected')
    }
  },
  
  // メッセージ処理
  handleMessage: function(data) {
    console.log('WebSocket message:', data)
    
    switch (data.type) {
      case 'connected':
        console.log(`Connected to class: ${data.classCode}, clients: ${data.clientCount}`)
        break
        
      case 'pong':
        // Keep-alive response
        break
        
      case 'progress_updated':
        // 進捗更新通知
        this.onProgressUpdate(data)
        break
        
      case 'help_requested':
        // ヘルプ要請通知（教師のみ）
        this.onHelpRequest(data)
        break
        
      case 'help_resolved':
        // ヘルプ解決通知
        this.onHelpResolve(data)
        break
        
      case 'activity_updated':
        // 活動更新通知（教師のみ）
        this.onActivityUpdate(data)
        break
        
      case 'error':
        console.error('WebSocket error:', data.message)
        break
        
      default:
        console.log('Unknown message type:', data.type)
    }
  },
  
  // 進捗更新ハンドラー
  onProgressUpdate: function(data) {
    console.log('Progress updated:', data)
    
    // 進捗ボードが表示されている場合は自動更新
    if (state.currentView === 'progress') {
      // 進捗ボードを再読み込み（デバウンス付き）
      if (!this.progressUpdateTimer) {
        this.progressUpdateTimer = setTimeout(() => {
          if (state.selectedCurriculum) {
            loadProgressBoard(state.selectedCurriculum.id)
          }
          this.progressUpdateTimer = null
        }, 2000) // 2秒デバウンス
      }
    }
    
    // 通知表示
    if (state.auth.user?.role === 'teacher') {
      showToast(`📝 ${data.studentId}番の児童が進捗を更新しました`, 'info')
    }
  },
  
  // ヘルプ要請ハンドラー（教師用）
  onHelpRequest: function(data) {
    console.log('Help requested:', data)
    
    // 音声通知
    playNotificationSound()
    
    // 目立つ通知表示
    showToast(
      `🆘 ${data.studentName}さんがヘルプを要請しています\n` +
      `カード: ${data.cardTitle}\n` +
      `種類: ${data.helpType}`,
      'warning',
      10000 // 10秒表示
    )
    
    // 進捗ボードが表示されている場合は自動更新
    if (state.currentView === 'progress') {
      setTimeout(() => {
        if (state.selectedCurriculum) {
          loadProgressBoard(state.selectedCurriculum.id)
        }
      }, 1000)
    }
  },
  
  // ヘルプ解決ハンドラー
  onHelpResolve: function(data) {
    console.log('Help resolved:', data)
    
    if (state.auth.user?.role === 'teacher') {
      showToast(`✅ ヘルプが解決されました`, 'success')
      
      // 進捗ボードを更新
      if (state.currentView === 'progress' && state.selectedCurriculum) {
        setTimeout(() => {
          loadProgressBoard(state.selectedCurriculum.id)
        }, 1000)
      }
    }
  },
  
  // 活動更新ハンドラー（教師用）
  onActivityUpdate: function(data) {
    console.log('Activity updated:', data)
    
    // 進捗ボードを更新（デバウンス付き）
    if (state.currentView === 'progress' && !this.activityUpdateTimer) {
      this.activityUpdateTimer = setTimeout(() => {
        if (state.selectedCurriculum) {
          loadProgressBoard(state.selectedCurriculum.id)
        }
        this.activityUpdateTimer = null
      }, 3000)
    }
  },
  
  // Ping/Pongインターバル
  pingInterval: null,
  startPingInterval: function() {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' })
    }, 30000) // 30秒ごと
  },
  
  stopPingInterval: function() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}

// トースト通知表示
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 z-50 max-w-sm p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'warning' ? 'bg-orange-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`
  
  toast.innerHTML = `
    <div class="flex items-start">
      <div class="flex-1 whitespace-pre-line">${message}</div>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `
  
  document.body.appendChild(toast)
  
  // アニメーション
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateX(100%)'
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

// 通知音を再生
function playNotificationSound() {
  try {
    // Web Audio APIで簡単なビープ音を生成
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (error) {
    console.error('通知音の再生に失敗:', error)
  }
}

// WebSocketヘルパー関数：進捗更新を送信
function sendProgressUpdate(studentId, curriculumId, courseId, cardId, status, understandingLevel) {
  websocket.send({
    type: 'progress_update',
    studentId,
    curriculumId,
    courseId,
    cardId,
    status,
    understandingLevel
  })
}

// WebSocketヘルパー関数：ヘルプ要請を送信
function sendHelpRequest(studentId, studentName, curriculumId, cardId, cardTitle, helpType) {
  websocket.send({
    type: 'help_request',
    studentId,
    studentName,
    curriculumId,
    cardId,
    cardTitle,
    helpType
  })
}

// WebSocketヘルパー関数：ヘルプ解決を送信
function sendHelpResolve(studentId) {
  websocket.send({
    type: 'help_resolve',
    studentId
  })
}

// WebSocketヘルパー関数：活動記録を送信
function sendActivity(studentId, cardId) {
  websocket.send({
    type: 'activity',
    studentId,
    cardId
  })
}

// ============================================
// AI問題生成機能
// ============================================

// 問題生成モーダル表示
function showProblemGenerationModal(curriculumId) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">
              <i class="fas fa-magic mr-2"></i>AI問題自動生成
            </h2>
            <p class="text-sm mt-1">Gemini AIが問題を自動生成します</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" 
                  class="text-white hover:text-gray-200 text-3xl">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="p-6">
        <form id="problemGenerationForm" class="space-y-6">
          <!-- 問題タイプ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-list mr-2"></i>問題タイプ
            </label>
            <select id="problemType" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="intro">導入問題</option>
              <option value="practice">練習問題</option>
              <option value="challenge">発展問題</option>
              <option value="check_test">チェックテスト</option>
              <option value="optional">選択問題</option>
            </select>
          </div>

          <!-- 難易度 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-signal mr-2"></i>難易度
            </label>
            <select id="difficultyLevel" required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option value="1">★ かんたん</option>
              <option value="2" selected>★★ ふつう</option>
              <option value="3">★★★ むずかしい</option>
              <option value="4">★★★★ とてもむずかしい</option>
            </select>
          </div>

          <!-- 追加要件 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              <i class="fas fa-pencil-alt mr-2"></i>追加要件（任意）
            </label>
            <textarea id="specificRequirements" rows="3"
                      class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="例: 日常生活に関連した問題にしてください"></textarea>
          </div>

          <!-- 生成ボタン -->
          <div class="flex gap-3">
            <button type="submit"
                    class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg">
              <i class="fas fa-magic mr-2"></i>問題を生成
            </button>
            <button type="button" onclick="this.closest('.fixed').remove()"
                    class="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all">
              キャンセル
            </button>
          </div>
        </form>

        <!-- 生成結果エリア -->
        <div id="generationResult" class="hidden mt-6 space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center mb-2">
              <i class="fas fa-check-circle text-green-600 mr-2"></i>
              <span class="font-bold text-green-800">問題生成完了！</span>
            </div>
            <div id="generatedProblemContent" class="mt-4 space-y-3">
              <!-- 生成された問題がここに表示される -->
            </div>
          </div>

          <div class="flex gap-3">
            <button onclick="saveGeneratedProblem()"
                    class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
              <i class="fas fa-save mr-2"></i>問題を保存
            </button>
            <button onclick="regenerateProblem()"
                    class="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-all">
              <i class="fas fa-redo mr-2"></i>再生成
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // フォーム送信処理
  document.getElementById('problemGenerationForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    await generateProblem(curriculumId)
  })
}

// 問題生成実行
async function generateProblem(curriculumId) {
  const problemType = document.getElementById('problemType').value
  const difficultyLevel = parseInt(document.getElementById('difficultyLevel').value)
  const specificRequirements = document.getElementById('specificRequirements').value
  
  showLoading('AI が問題を生成中...')
  
  try {
    const response = await axios.post('/api/ai/generate-problem', {
      userId: state.student.id,
      curriculumId: curriculumId,
      problemType: problemType,
      difficultyLevel: difficultyLevel,
      specificRequirements: specificRequirements
    })
    
    hideLoading()
    
    if (!response.data.success) {
      alert('問題生成に失敗しました: ' + response.data.error)
      return
    }
    
    // 生成された問題を保存
    window.generatedProblem = response.data.problem
    
    // 結果を表示
    const resultArea = document.getElementById('generationResult')
    const contentArea = document.getElementById('generatedProblemContent')
    
    contentArea.innerHTML = `
      <div class="space-y-3">
        <div>
          <div class="text-sm font-bold text-gray-600 mb-1">タイトル</div>
          <div class="bg-white border border-gray-200 rounded p-3">
            ${response.data.problem.title}
          </div>
        </div>
        
        <div>
          <div class="text-sm font-bold text-gray-600 mb-1">問題内容</div>
          <div class="bg-white border border-gray-200 rounded p-3 whitespace-pre-wrap">
            ${response.data.problem.content}
          </div>
        </div>
        
        ${response.data.problem.solution ? `
          <div>
            <div class="text-sm font-bold text-gray-600 mb-1">解答・解説</div>
            <div class="bg-white border border-gray-200 rounded p-3 whitespace-pre-wrap">
              ${response.data.problem.solution}
            </div>
          </div>
        ` : ''}
        
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span><i class="fas fa-signal mr-1"></i>難易度: ${'★'.repeat(response.data.problem.difficultyLevel)}</span>
          <span><i class="fas fa-clock mr-1"></i>${response.data.responseTime}ms</span>
          ${response.data.tokensUsed ? `<span><i class="fas fa-coins mr-1"></i>${response.data.tokensUsed} tokens</span>` : ''}
        </div>
      </div>
    `
    
    resultArea.classList.remove('hidden')
    resultArea.scrollIntoView({ behavior: 'smooth' })
    
  } catch (error) {
    hideLoading()
    console.error('問題生成エラー:', error)
    alert('問題生成に失敗しました: ' + (error.response?.data?.error || error.message))
  }
}

// 問題を再生成
function regenerateProblem() {
  if (!state.selectedCurriculum) {
    alert('カリキュラムが選択されていません')
    return
  }
  
  // 結果エリアを非表示
  document.getElementById('generationResult').classList.add('hidden')
  
  // 再生成
  generateProblem(state.selectedCurriculum.id)
}

// 生成された問題を保存
async function saveGeneratedProblem() {
  if (!window.generatedProblem) {
    alert('保存する問題がありません')
    return
  }
  
  showLoading('問題を保存中...')
  
  try {
    // 承認APIを呼び出し
    await axios.post(`/api/ai/approve-problem/${window.generatedProblem.id}`, {
      userId: state.student.id,
      approved: true
    })
    
    hideLoading()
    alert('✅ 問題を保存しました！')
    
    // モーダルを閉じる
    document.querySelectorAll('.fixed.inset-0').forEach(modal => modal.remove())
    
    // 学習のてびきを再読み込み
    if (state.selectedCurriculum) {
      loadGuidePage(state.selectedCurriculum.id)
    }
    
  } catch (error) {
    hideLoading()
    console.error('問題保存エラー:', error)
    alert('問題の保存に失敗しました')
  }
}

// グローバルスコープに関数を登録
window.showProblemGenerationModal = showProblemGenerationModal
window.generateProblem = generateProblem
window.regenerateProblem = regenerateProblem
window.saveGeneratedProblem = saveGeneratedProblem

// =====================================
// Phase 9: 学習行動ログ収集機能
// =====================================

// 学習行動ログ収集システム
const BehaviorLogger = {
  // セッションID（ページ読み込み時に生成）
  sessionId: null,
  sessionStartTime: null,
  
  // ログバッファ（一定数貯まったらバッチ送信）
  logBuffer: [],
  maxBufferSize: 10,
  
  // 送信タイマー（一定時間ごとに自動送信）
  autoSendInterval: 30000, // 30秒
  autoSendTimer: null,
  
  // 初期化
  init() {
    this.sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.sessionStartTime = new Date().toISOString()
    
    console.log('📊 学習行動ログ収集開始:', this.sessionId)
    
    // イベントリスナーを設定
    this.setupEventListeners()
    
    // 自動送信タイマーを開始
    this.startAutoSend()
    
    // ページ離脱時に残りのログを送信
    window.addEventListener('beforeunload', () => {
      this.flushLogs(true) // 同期送信
    })
  },
  
  // イベントリスナーを設定
  setupEventListeners() {
    // ページビュー
    this.logAction('page_view', 'page', {
      url: window.location.pathname,
      referrer: document.referrer
    })
    
    // クリックイベント
    document.addEventListener('click', (e) => {
      const target = e.target
      const elementType = this.getElementType(target)
      const elementInfo = this.getElementInfo(target)
      
      if (elementInfo.relevance > 0.5) { // 関連性の高い要素のみログ
        this.logAction('click', elementType, {
          element: elementInfo,
          x: e.clientX,
          y: e.clientY
        })
      }
    })
    
    // ヒントカード表示
    const originalShowHintCard = window.showHintCard
    if (originalShowHintCard) {
      window.showHintCard = (...args) => {
        const [cardId, level] = args
        this.logAction('hint_view', 'hint_card', {
          card_id: cardId,
          hint_level: level
        })
        return originalShowHintCard.apply(window, args)
      }
    }
    
    // AI先生質問
    const originalAskAI = window.askAI
    if (originalAskAI) {
      window.askAI = (...args) => {
        this.logAction('ai_question', 'ai_teacher', {
          question_length: document.getElementById('aiQuestionInput')?.value?.length || 0
        })
        return originalAskAI.apply(window, args)
      }
    }
    
    // 助け要請
    const originalHelpButtons = document.querySelectorAll('[onclick*="requestHelp"]')
    originalHelpButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.logAction('help_request', 'help_button', {
          help_type: btn.textContent.includes('先生') ? 'teacher' : 'peer'
        })
      })
    })
  },
  
  // 要素タイプを判定
  getElementType(element) {
    if (!element) return 'unknown'
    
    const tag = element.tagName.toLowerCase()
    const classes = element.className || ''
    const id = element.id || ''
    
    if (tag === 'button' || element.onclick) return 'button'
    if (tag === 'a') return 'link'
    if (tag === 'input' || tag === 'textarea') return 'input'
    if (tag === 'img') return 'image'
    if (tag === 'video') return 'video'
    if (classes.includes('hint') || id.includes('hint')) return 'hint'
    if (classes.includes('card')) return 'card'
    
    return 'text'
  },
  
  // 要素情報を取得
  getElementInfo(element) {
    if (!element) return { relevance: 0 }
    
    const info = {
      tag: element.tagName?.toLowerCase(),
      id: element.id,
      class: element.className,
      text: element.textContent?.substring(0, 50),
      relevance: 0
    }
    
    // 学習関連要素の関連性スコア
    const learningKeywords = ['hint', 'card', 'problem', 'answer', 'ai', 'help', 'question', 'solution']
    const elementString = `${info.id} ${info.class} ${info.text}`.toLowerCase()
    
    learningKeywords.forEach(keyword => {
      if (elementString.includes(keyword)) {
        info.relevance += 0.2
      }
    })
    
    // ボタンやリンクは関連性を高める
    if (info.tag === 'button' || info.tag === 'a') {
      info.relevance += 0.3
    }
    
    return info
  },
  
  // アクションをログに記録
  logAction(actionType, elementType, metadata = {}) {
    if (!state.student || !state.student.id) {
      // ログイン前はログを記録しない
      return
    }
    
    const log = {
      student_id: state.student.id,
      curriculum_id: state.selectedCurriculum?.id || null,
      learning_card_id: state.selectedCard?.id || null,
      action_type: actionType,
      action_timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      session_duration: Math.floor((Date.now() - new Date(this.sessionStartTime).getTime()) / 1000),
      page_element: elementType,
      element_type: elementType,
      metadata: JSON.stringify(metadata),
      current_understanding_level: state.selectedCard?.understanding_level || null
    }
    
    this.logBuffer.push(log)
    
    // バッファが満杯なら送信
    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flushLogs()
    }
  },
  
  // ログを送信
  async flushLogs(sync = false) {
    if (this.logBuffer.length === 0) return
    
    const logsToSend = [...this.logBuffer]
    this.logBuffer = []
    
    try {
      if (sync) {
        // 同期送信（ページ離脱時）
        navigator.sendBeacon('/api/behavior/logs', JSON.stringify(logsToSend))
      } else {
        // 非同期送信（通常時）
        await axios.post('/api/behavior/logs', logsToSend)
        console.log(`📊 ${logsToSend.length}件の学習行動ログを送信しました`)
      }
    } catch (error) {
      console.error('ログ送信エラー:', error)
      // エラー時はバッファに戻す
      this.logBuffer.unshift(...logsToSend)
    }
  },
  
  // 自動送信を開始
  startAutoSend() {
    this.autoSendTimer = setInterval(() => {
      this.flushLogs()
    }, this.autoSendInterval)
  },
  
  // 自動送信を停止
  stopAutoSend() {
    if (this.autoSendTimer) {
      clearInterval(this.autoSendTimer)
      this.autoSendTimer = null
    }
  }
}

// ログイン成功時に初期化
const originalLogin = window.login
if (originalLogin) {
  window.login = async function(...args) {
    const result = await originalLogin.apply(window, args)
    if (result && state.student) {
      BehaviorLogger.init()
    }
    return result
  }
}

// グローバルスコープに登録
window.BehaviorLogger = BehaviorLogger

// =====================================
// Phase 10: 教師・保護者ダッシュボードUI
// =====================================

// 学習分析ダッシュボードを表示（教師向け）
async function showAnalysisDashboard() {
  if (!state.teacher || !state.teacher.class_code) {
    alert('教師アカウントでログインしてください')
    return
  }
  
  showLoading('クラスの学習分析データを読み込み中...')
  
  try {
    const response = await axios.get(`/api/dashboard/class/${state.teacher.class_code}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'データ取得に失敗しました')
    }
    
    hideLoading()
    renderAnalysisDashboard(response.data)
  } catch (error) {
    hideLoading()
    console.error('ダッシュボード読み込みエラー:', error)
    alert('ダッシュボードの読み込みに失敗しました')
  }
}

// 分析ダッシュボードをレンダリング
function renderAnalysisDashboard(data) {
  const { students, summary, class_code } = data
  
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <!-- ヘッダー -->
      <div class="max-w-7xl mx-auto mb-6">
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-800 mb-2">
                <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                学習分析ダッシュボード
              </h1>
              <p class="text-gray-600">クラス: ${class_code}</p>
            </div>
            <button onclick="showProgressBoard()" 
                    class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-arrow-left mr-2"></i>進捗ボードに戻る
            </button>
          </div>
        </div>
      </div>
      
      <!-- サマリーカード -->
      <div class="max-w-7xl mx-auto mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- 総生徒数 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">総生徒数</p>
                <p class="text-3xl font-bold text-gray-800">${summary.total_students}</p>
              </div>
              <div class="bg-blue-100 rounded-full p-3">
                <i class="fas fa-users text-blue-600 text-2xl"></i>
              </div>
            </div>
          </div>
          
          <!-- 分析済み -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">分析済み</p>
                <p class="text-3xl font-bold text-green-600">${summary.with_profiles}</p>
              </div>
              <div class="bg-green-100 rounded-full p-3">
                <i class="fas fa-check-circle text-green-600 text-2xl"></i>
              </div>
            </div>
          </div>
          
          <!-- 平均スコア -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">平均スコア</p>
                <p class="text-3xl font-bold text-purple-600">${summary.average_score}</p>
              </div>
              <div class="bg-purple-100 rounded-full p-3">
                <i class="fas fa-star text-purple-600 text-2xl"></i>
              </div>
            </div>
          </div>
          
          <!-- 要支援 -->
          <div class="bg-white rounded-lg shadow-md p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-500 text-sm">要支援</p>
                <p class="text-3xl font-bold text-red-600">
                  ${students.filter(s => s.overall_score > 0 && s.overall_score < 60).length}
                </p>
              </div>
              <div class="bg-red-100 rounded-full p-3">
                <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 生徒一覧 -->
      <div class="max-w-7xl mx-auto">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-4">
            <i class="fas fa-list mr-2"></i>生徒別学習プロファイル
          </h2>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">番号</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">氏名</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">学習タイプ</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">推奨コース</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">スコア</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">信頼度</th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${students.map(student => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm">${student.student_number || '-'}</td>
                    <td class="px-4 py-3 text-sm font-medium">${student.student_name}</td>
                    <td class="px-4 py-3 text-sm">
                      ${student.learning_type 
                        ? `<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">${student.learning_type}</span>`
                        : '<span class="text-gray-400">未分析</span>'}
                    </td>
                    <td class="px-4 py-3 text-sm">
                      ${getCourseBadge(student.recommended_course)}
                    </td>
                    <td class="px-4 py-3 text-sm">
                      ${getScoreBadge(student.overall_score)}
                    </td>
                    <td class="px-4 py-3 text-sm">
                      ${getConfidenceBadge(student.confidence_level)}
                    </td>
                    <td class="px-4 py-3 text-sm">
                      <button onclick="showStudentDetail(${student.student_id})" 
                              class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs">
                        <i class="fas fa-eye mr-1"></i>詳細
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
}

// コースバッジ
function getCourseBadge(course) {
  const badges = {
    'じっくりコース': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">🐢 じっくり</span>',
    'しっかりコース': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">🚶 しっかり</span>',
    'ぐんぐんコース': '<span class="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">🚀 ぐんぐん</span>'
  }
  return badges[course] || '<span class="text-gray-400">-</span>'
}

// スコアバッジ
function getScoreBadge(score) {
  if (score === 0) return '<span class="text-gray-400">-</span>'
  if (score >= 80) return `<span class="text-green-600 font-bold">${score}</span>`
  if (score >= 60) return `<span class="text-yellow-600 font-bold">${score}</span>`
  return `<span class="text-red-600 font-bold">${score}</span>`
}

// 信頼度バッジ
function getConfidenceBadge(level) {
  const badges = {
    'high': '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">高</span>',
    'medium': '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">中</span>',
    'low': '<span class="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">低</span>'
  }
  return badges[level] || badges['low']
}

// 生徒詳細を表示
async function showStudentDetail(studentId) {
  showLoading('生徒の詳細データを読み込み中...')
  
  try {
    const response = await axios.get(`/api/dashboard/student/${studentId}`)
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'データ取得に失敗しました')
    }
    
    hideLoading()
    renderStudentDetail(response.data)
  } catch (error) {
    hideLoading()
    console.error('生徒詳細読み込みエラー:', error)
    alert('生徒詳細の読み込みに失敗しました')
  }
}

// 生徒詳細をレンダリング
function renderStudentDetail(data) {
  const { student, profile, plan, recommendations } = data
  
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- ヘッダー -->
      <div class="bg-blue-600 text-white p-6 sticky top-0">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">${student.name} さんの学習プロファイル</h2>
            <p class="text-blue-100">学籍番号: ${student.student_number || '-'} | クラス: ${student.class_code}</p>
          </div>
          <button onclick="this.closest('.fixed').remove()" 
                  class="text-white hover:text-gray-200">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
      </div>
      
      <!-- 内容 -->
      <div class="p-6">
        ${profile ? `
          <!-- プロファイルサマリー -->
          <div class="mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-3">
              <i class="fas fa-user-circle mr-2 text-blue-600"></i>学習プロファイル
            </h3>
            <div class="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p class="text-gray-700 mb-2">${profile.summary}</p>
              <div class="flex gap-2 flex-wrap">
                <span class="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">
                  ${profile.learning_type}
                </span>
                <span class="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">
                  スコア: ${profile.overall_score}
                </span>
                <span class="px-3 py-1 bg-green-600 text-white rounded-full text-sm">
                  ${profile.recommended_course}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 強み・弱み -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 class="text-lg font-bold text-green-600 mb-2">
                <i class="fas fa-check-circle mr-2"></i>強み
              </h4>
              <ul class="space-y-1">
                ${profile.strengths.map(s => `
                  <li class="text-sm text-gray-700">✓ ${s}</li>
                `).join('')}
              </ul>
            </div>
            <div>
              <h4 class="text-lg font-bold text-orange-600 mb-2">
                <i class="fas fa-exclamation-circle mr-2"></i>課題
              </h4>
              <ul class="space-y-1">
                ${profile.weaknesses.map(w => `
                  <li class="text-sm text-gray-700">→ ${w}</li>
                `).join('')}
              </ul>
            </div>
          </div>
          
          <!-- 推奨事項 -->
          ${profile.recommendations ? `
            <div class="mb-6">
              <h4 class="text-lg font-bold text-gray-800 mb-3">
                <i class="fas fa-lightbulb mr-2 text-yellow-500"></i>推奨事項
              </h4>
              
              ${profile.recommendations.for_teacher ? `
                <div class="mb-3">
                  <p class="text-sm font-semibold text-blue-600 mb-1">
                    👨‍🏫 教師向け
                  </p>
                  <ul class="space-y-1">
                    ${profile.recommendations.for_teacher.map(r => `
                      <li class="text-sm text-gray-700 ml-4">• ${r}</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${profile.recommendations.for_parent ? `
                <div class="mb-3">
                  <p class="text-sm font-semibold text-green-600 mb-1">
                    👨‍👩‍👦 保護者向け
                  </p>
                  <ul class="space-y-1">
                    ${profile.recommendations.for_parent.map(r => `
                      <li class="text-sm text-gray-700 ml-4">• ${r}</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : ''}
        ` : `
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
            <p class="text-gray-700">
              <i class="fas fa-info-circle mr-2 text-yellow-500"></i>
              この生徒の学習データが不足しているため、詳細な分析ができません。
            </p>
          </div>
        `}
        
        <!-- アクションボタン -->
        <div class="flex gap-3 justify-end mt-6">
          <button onclick="generateStudentProfile(${student.id})" 
                  class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            <i class="fas fa-sync mr-2"></i>プロファイル再生成
          </button>
          <button onclick="this.closest('.fixed').remove()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            閉じる
          </button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
}

// プロファイル再生成
async function generateStudentProfile(studentId) {
  if (!confirm('この生徒のプロファイルを再生成しますか？\n（数秒かかります）')) {
    return
  }
  
  showLoading('AIが学習プロファイルを分析中...')
  
  try {
    // まず分析実行
    await axios.post(`/api/analysis/patterns/${studentId}`, {
      curriculumId: state.selectedCurriculum?.id
    })
    
    // 次にプロファイル生成
    const response = await axios.post(`/api/analysis/profile/${studentId}`, {
      curriculumId: state.selectedCurriculum?.id
    })
    
    hideLoading()
    
    if (response.data.success) {
      alert('✅ プロファイルを生成しました！')
      // モーダルを閉じて再表示
      document.querySelectorAll('.fixed').forEach(modal => modal.remove())
      await showStudentDetail(studentId)
    } else {
      throw new Error(response.data.error)
    }
  } catch (error) {
    hideLoading()
    console.error('プロファイル生成エラー:', error)
    alert('プロファイル生成に失敗しました: ' + (error.response?.data?.error || error.message))
  }
}

// グローバルスコープに登録
window.showAnalysisDashboard = showAnalysisDashboard
window.showStudentDetail = showStudentDetail
window.generateStudentProfile = generateStudentProfile

// =====================================
// Phase 13: 多言語対応システム
// =====================================

// 言語定義
const i18n = {
  ja: {
    // トップページ
    'app.title': '自由進度学習支援システム',
    'login.title': 'ログイン',
    'login.email': 'メールアドレス',
    'login.password': 'パスワード',
    'login.button': 'ログイン',
    'login.demo.teacher': 'デモ教師',
    'login.demo.student': 'デモ生徒',
    
    // ナビゲーション
    'nav.top': 'トップ',
    'nav.guide': '学習のてびき',
    'nav.plan': '学習計画表',
    'nav.answers': '解答タブ',
    'nav.progress': '進捗ボード',
    'nav.analysis': '学習分析',
    'nav.logout': 'ログアウト',
    
    // コース
    'course.slow': 'じっくりコース',
    'course.normal': 'しっかりコース',
    'course.fast': 'ぐんぐんコース',
    
    // 共通
    'common.loading': '読み込み中...',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.close': '閉じる',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.detail': '詳細',
    'common.yes': 'はい',
    'common.no': 'いいえ',
    
    // 分析
    'analysis.title': '学習分析ダッシュボード',
    'analysis.profile': '学習プロファイル',
    'analysis.strengths': '強み',
    'analysis.weaknesses': '課題',
    'analysis.recommendations': '推奨事項',
  },
  
  en: {
    // Top page
    'app.title': 'Self-Paced Learning Support System',
    'login.title': 'Login',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.button': 'Login',
    'login.demo.teacher': 'Demo Teacher',
    'login.demo.student': 'Demo Student',
    
    // Navigation
    'nav.top': 'Home',
    'nav.guide': 'Learning Guide',
    'nav.plan': 'Learning Plan',
    'nav.answers': 'Answers',
    'nav.progress': 'Progress',
    'nav.analysis': 'Analysis',
    'nav.logout': 'Logout',
    
    // Course
    'course.slow': 'Steady Course',
    'course.normal': 'Regular Course',
    'course.fast': 'Advanced Course',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.detail': 'Detail',
    'common.yes': 'Yes',
    'common.no': 'No',
    
    // Analysis
    'analysis.title': 'Learning Analysis Dashboard',
    'analysis.profile': 'Learning Profile',
    'analysis.strengths': 'Strengths',
    'analysis.weaknesses': 'Challenges',
    'analysis.recommendations': 'Recommendations',
  },
  
  zh: {
    // 顶部页面
    'app.title': '自主进度学习支援系统',
    'login.title': '登录',
    'login.email': '电子邮箱',
    'login.password': '密码',
    'login.button': '登录',
    'login.demo.teacher': '演示教师',
    'login.demo.student': '演示学生',
    
    // 导航
    'nav.top': '首页',
    'nav.guide': '学习指南',
    'nav.plan': '学习计划',
    'nav.answers': '答案',
    'nav.progress': '进度',
    'nav.analysis': '分析',
    'nav.logout': '退出',
    
    // 课程
    'course.slow': '稳步课程',
    'course.normal': '标准课程',
    'course.fast': '进阶课程',
    
    // 通用
    'common.loading': '加载中...',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.close': '关闭',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.detail': '详情',
    'common.yes': '是',
    'common.no': '否',
    
    // 分析
    'analysis.title': '学习分析仪表板',
    'analysis.profile': '学习档案',
    'analysis.strengths': '优势',
    'analysis.weaknesses': '挑战',
    'analysis.recommendations': '建议',
  }
}

// 現在の言語（デフォルトは日本語）
let currentLanguage = localStorage.getItem('language') || 'ja'

// 翻訳関数
function t(key) {
  const translation = i18n[currentLanguage]?.[key]
  return translation || key
}

// 言語切替
function changeLanguage(lang) {
  if (!i18n[lang]) {
    console.error(`Language ${lang} not supported`)
    return
  }
  
  currentLanguage = lang
  localStorage.setItem('language', lang)
  
  // ページを再読み込み（簡易実装）
  location.reload()
}

// グローバルスコープに登録
window.t = t
window.changeLanguage = changeLanguage
window.currentLanguage = currentLanguage
window.i18n = i18n

// =====================================
// Phase 14: チャート可視化 + 研究資料導出
// =====================================

// チャート用カラーパレット
const CHART_COLORS = {
  visual: 'rgba(59, 130, 246, 0.8)',     // 青
  auditory: 'rgba(16, 185, 129, 0.8)',  // 緑
  kinesthetic: 'rgba(251, 146, 60, 0.8)', // オレンジ
  primary: 'rgba(99, 102, 241, 0.8)',   // インディゴ
  success: 'rgba(34, 197, 94, 0.8)',    // 成功
  warning: 'rgba(234, 179, 8, 0.8)',    // 警告
  danger: 'rgba(239, 68, 68, 0.8)'      // 危険
}

// 学習スタイルチャートを表示
function showLearningStyleChart(patterns) {
  const modal = document.createElement('div')
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-chart-pie mr-2 text-blue-600"></i>
          学習スタイル分析（VAKモデル）
        </h3>
        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- レーダーチャート -->
        <div>
          <h4 class="font-semibold text-gray-700 mb-3">総合バランス</h4>
          <canvas id="learningStyleRadar"></canvas>
        </div>
        
        <!-- バーチャート -->
        <div>
          <h4 class="font-semibold text-gray-700 mb-3">スコア詳細</h4>
          <canvas id="learningStyleBar"></canvas>
        </div>
      </div>
      
      <!-- 解説 -->
      <div class="mt-6 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
        <h5 class="font-semibold text-blue-800 mb-2">
          <i class="fas fa-info-circle mr-2"></i>VAKモデルとは
        </h5>
        <p class="text-sm text-gray-700 mb-2">
          VAKモデルは、学習者の優勢な感覚モダリティを3つに分類します：
        </p>
        <ul class="text-sm text-gray-700 space-y-1 ml-4">
          <li>• <strong>Visual（視覚型）</strong>: 図解、動画、カラーコーディングを好む</li>
          <li>• <strong>Auditory（聴覚型）</strong>: 音声説明、議論、リズムを好む</li>
          <li>• <strong>Kinesthetic（体感型）</strong>: 実践、操作、身体活動を好む</li>
        </ul>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // レーダーチャート
  const radarCtx = document.getElementById('learningStyleRadar').getContext('2d')
  new Chart(radarCtx, {
    type: 'radar',
    data: {
      labels: ['視覚型 (Visual)', '聴覚型 (Auditory)', '体感型 (Kinesthetic)'],
      datasets: [{
        label: '学習スタイルスコア',
        data: [
          patterns.visual || 0,
          patterns.auditory || 0,
          patterns.kinesthetic || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20 }
        }
      }
    }
  })
  
  // バーチャート
  const barCtx = document.getElementById('learningStyleBar').getContext('2d')
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['視覚型', '聴覚型', '体感型'],
      datasets: [{
        label: 'スコア (%)',
        data: [
          patterns.visual || 0,
          patterns.auditory || 0,
          patterns.kinesthetic || 0
        ],
        backgroundColor: [
          CHART_COLORS.visual,
          CHART_COLORS.auditory,
          CHART_COLORS.kinesthetic
        ]
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  })
}

// AI予測結果を可視化
async function showPredictionVisualization(studentId) {
  showLoading('AI予測を生成中...')
  
  try {
    // AI予測を生成
    const response = await axios.post(`/api/predictions/${studentId}`, {
      curriculumId: state.selectedCurriculum?.id,
      predictionType: 'all'
    })
    
    hideLoading()
    
    if (!response.data.success) {
      throw new Error(response.data.error)
    }
    
    const predictions = response.data.predictions
    
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-800">
            <i class="fas fa-crystal-ball mr-2 text-purple-600"></i>
            AI学習予測ダッシュボード
          </h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <!-- 来週の予測 -->
        ${predictions.next_week ? `
          <div class="mb-6">
            <h4 class="text-xl font-semibold text-gray-800 mb-3">
              📅 来週の学習予測
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">予想完了カード数</p>
                <p class="text-3xl font-bold text-blue-600">${predictions.next_week.cards_expected}</p>
                <p class="text-xs text-gray-500 mt-1">枚</p>
              </div>
              <div class="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">予想理解度</p>
                <p class="text-3xl font-bold text-green-600">${predictions.next_week.understanding_level.toFixed(1)}</p>
                <p class="text-xs text-gray-500 mt-1">/ 5.0</p>
              </div>
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">予測信頼度</p>
                <p class="text-3xl font-bold text-purple-600">${Math.round(predictions.next_week.confidence * 100)}%</p>
                <p class="text-xs text-gray-500 mt-1">信頼度</p>
              </div>
            </div>
            <div class="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p class="text-sm font-semibold text-blue-800">💡 推奨事項</p>
              <p class="text-sm text-gray-700">${predictions.next_week.recommendation}</p>
            </div>
          </div>
        ` : ''}
        
        <!-- つまずきポイント予測 -->
        ${predictions.struggling_points ? `
          <div class="mb-6">
            <h4 class="text-xl font-semibold text-gray-800 mb-3">
              ⚠️ 注意すべきポイント
            </h4>
            <div class="space-y-2">
              ${predictions.struggling_points.potential_struggles.map(struggle => `
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                  <p class="text-sm text-gray-700">⚠️ ${struggle}</p>
                </div>
              `).join('')}
            </div>
            <div class="mt-3 bg-orange-50 border-l-4 border-orange-600 p-4 rounded">
              <p class="text-sm font-semibold text-orange-800">📋 推奨対応</p>
              <p class="text-sm text-gray-700">${predictions.struggling_points.recommendation}</p>
            </div>
          </div>
        ` : ''}
        
        <!-- 予測チャート -->
        <div class="mb-6">
          <h4 class="text-xl font-semibold text-gray-800 mb-3">
            📊 予測トレンド
          </h4>
          <canvas id="predictionChart"></canvas>
        </div>
        
        <!-- アクションボタン -->
        <div class="flex gap-3 justify-end">
          <button onclick="exportPredictionData(${studentId})" 
                  class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            <i class="fas fa-download mr-2"></i>データをエクスポート
          </button>
          <button onclick="this.closest('.fixed').remove()" 
                  class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            閉じる
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // 予測チャート
    if (predictions.next_week) {
      const chartCtx = document.getElementById('predictionChart').getContext('2d')
      new Chart(chartCtx, {
        type: 'line',
        data: {
          labels: ['現在', '3日後', '1週間後', '2週間後'],
          datasets: [{
            label: '予測理解度',
            data: [
              3.0,
              3.5,
              predictions.next_week.understanding_level,
              Math.min(predictions.next_week.understanding_level + 0.5, 5.0)
            ],
            borderColor: CHART_COLORS.primary,
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4
          }, {
            label: '予測カード完了数',
            data: [
              0,
              Math.round(predictions.next_week.cards_expected * 0.3),
              predictions.next_week.cards_expected,
              Math.round(predictions.next_week.cards_expected * 1.8)
            ],
            borderColor: CHART_COLORS.success,
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          }]
        },
        options: {
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: { display: true, text: '理解度' },
              max: 5
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: { display: true, text: 'カード数' },
              grid: { drawOnChartArea: false }
            }
          }
        }
      })
    }
  } catch (error) {
    hideLoading()
    console.error('予測可視化エラー:', error)
    alert('予測の可視化に失敗しました')
  }
}

// 研究用データエクスポート
async function exportResearchData(classCode, format = 'csv') {
  showLoading(`研究用データを${format.toUpperCase()}形式でエクスポート中...`)
  
  try {
    const response = await axios.get(`/api/research/export/${classCode}?format=${format}`, {
      responseType: format === 'csv' ? 'blob' : 'json'
    })
    
    hideLoading()
    
    if (format === 'csv') {
      // CSVファイルをダウンロード
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `research_data_${classCode}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      alert('✅ CSVファイルをダウンロードしました！')
    } else {
      // JSON形式で表示
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
      modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold text-gray-800">
              <i class="fas fa-database mr-2 text-blue-600"></i>
              研究用データエクスポート
            </h3>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <div class="bg-gray-50 p-4 rounded mb-4">
            <p class="text-sm text-gray-700 mb-2">
              <strong>総生徒数:</strong> ${response.data.total_students}名
            </p>
            <p class="text-sm text-gray-700 mb-2">
              <strong>データ項目数:</strong> ${response.data.metadata.variables.length}項目
            </p>
            <p class="text-sm text-gray-600 italic">
              ${response.data.metadata.note}
            </p>
          </div>
          
          <div class="mb-4">
            <h4 class="font-semibold text-gray-800 mb-2">データプレビュー</h4>
            <pre class="bg-gray-100 p-4 rounded text-xs overflow-x-auto">${JSON.stringify(response.data.data.slice(0, 2), null, 2)}</pre>
          </div>
          
          <div class="flex gap-3 justify-end">
            <button onclick="exportResearchData('${classCode}', 'csv')" 
                    class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
              <i class="fas fa-file-csv mr-2"></i>CSV形式でダウンロード
            </button>
            <button onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(response.data)}, null, 2))" 
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
              <i class="fas fa-copy mr-2"></i>JSONをコピー
            </button>
            <button onclick="this.closest('.fixed').remove()" 
                    class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
              閉じる
            </button>
          </div>
        </div>
      `
      
      document.body.appendChild(modal)
    }
  } catch (error) {
    hideLoading()
    console.error('データエクスポートエラー:', error)
    alert('データのエクスポートに失敗しました')
  }
}

// 予測データエクスポート
async function exportPredictionData(studentId) {
  // 簡易実装：現在の予測データをJSON形式でコピー
  try {
    const response = await axios.post(`/api/predictions/${studentId}`, {
      curriculumId: state.selectedCurriculum?.id,
      predictionType: 'all'
    })
    
    if (response.data.success) {
      const dataStr = JSON.stringify(response.data.predictions, null, 2)
      await navigator.clipboard.writeText(dataStr)
      alert('✅ 予測データをクリップボードにコピーしました！')
    }
  } catch (error) {
    console.error('データエクスポートエラー:', error)
    alert('データのエクスポートに失敗しました')
  }
}

// グローバルスコープに登録
window.showLearningStyleChart = showLearningStyleChart
window.showPredictionVisualization = showPredictionVisualization
window.exportResearchData = exportResearchData
window.exportPredictionData = exportPredictionData

// ==============================================
// Phase 15 & 16: 機械学習 + A/Bテスト
// ==============================================

// TensorFlow.jsベースのリアルタイム学習予測
class RealtimeLearningPredictor {
  constructor(studentId) {
    this.studentId = studentId
    this.model = null
    this.trainingData = []
    this.isReady = false
  }
  
  // モデルの初期化
  async initialize() {
    if (typeof tf === 'undefined') {
      console.warn('⚠️ TensorFlow.jsが読み込まれていません')
      return false
    }
    
    try {
      // 簡易的なニューラルネットワークモデル
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 16, activation: 'relu', inputShape: [5] }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 8, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' })
        ]
      })
      
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      })
      
      this.isReady = true
      console.log('✅ TensorFlow.jsモデル初期化完了')
      return true
    } catch (error) {
      console.error('❌ モデル初期化エラー:', error)
      return false
    }
  }
  
  // リアルタイム学習（新しいデータでモデルを更新）
  async updateModel(newData) {
    if (!this.isReady || !this.model) {
      console.warn('モデルが初期化されていません')
      return
    }
    
    try {
      // 特徴量の準備
      const features = [
        newData.understanding_level || 0,
        newData.completion_time || 0,
        newData.hint_count || 0,
        newData.engagement_score || 0,
        newData.session_duration || 0
      ]
      
      const xs = tf.tensor2d([features])
      const ys = tf.tensor2d([[newData.target_understanding || 0]])
      
      // オンライン学習（1エポックで高速更新）
      await this.model.fit(xs, ys, {
        epochs: 1,
        verbose: 0
      })
      
      xs.dispose()
      ys.dispose()
      
      this.trainingData.push(newData)
      
      // サーバーにも同期
      await axios.post(`/api/ml/update-model/${this.studentId}`, {
        training_data: [newData]
      })
      
      console.log('✅ リアルタイム学習完了 - データ数:', this.trainingData.length)
    } catch (error) {
      console.error('リアルタイム学習エラー:', error)
    }
  }
  
  // 予測実行
  async predict(inputFeatures) {
    if (!this.isReady || !this.model) {
      return null
    }
    
    try {
      const xs = tf.tensor2d([inputFeatures])
      const prediction = this.model.predict(xs)
      const value = await prediction.data()
      
      xs.dispose()
      prediction.dispose()
      
      return value[0]
    } catch (error) {
      console.error('予測エラー:', error)
      return null
    }
  }
}

// A/Bテスト管理クラス
class ABTestManager {
  constructor() {
    this.currentExperiment = null
    this.variant = null
  }
  
  // 実験への参加登録
  async assignToExperiment(experimentName, studentId, classCode) {
    try {
      const response = await axios.post('/api/ab-test/assign', {
        experiment_name: experimentName,
        student_id: studentId,
        class_code: classCode
      })
      
      if (response.data.success) {
        this.currentExperiment = experimentName
        this.variant = response.data.variant
        
        console.log(`✅ A/Bテスト参加: ${experimentName} - ${this.variant}群`)
        
        // localStorage に保存
        localStorage.setItem('ab_test_experiment', experimentName)
        localStorage.setItem('ab_test_variant', this.variant)
        
        return this.variant
      }
    } catch (error) {
      console.error('A/Bテスト割り当てエラー:', error)
      return null
    }
  }
  
  // イベント記録
  async trackEvent(eventType, eventData) {
    if (!this.currentExperiment || !localStorage.getItem('currentUserId')) {
      return
    }
    
    try {
      await axios.post('/api/ab-test/event', {
        experiment_name: this.currentExperiment,
        student_id: parseInt(localStorage.getItem('currentUserId')),
        event_type: eventType,
        event_data: eventData
      })
      
      console.log(`📊 A/Bテストイベント記録: ${eventType}`)
    } catch (error) {
      console.error('イベント記録エラー:', error)
    }
  }
  
  // 実験に基づいた条件分岐
  shouldUseExperimentalFeature(featureName) {
    if (this.variant === 'experimental') {
      return true
    } else if (this.variant === 'control') {
      return false
    }
    
    // 割り当てがない場合はデフォルト動作
    return false
  }
}

// A/Bテスト結果可視化
async function showABTestResults(experimentName) {
  try {
    const response = await axios.get(`/api/ab-test/results/${experimentName}`)
    
    if (!response.data.success) {
      alert('実験結果の取得に失敗しました')
      return
    }
    
    const data = response.data
    
    const modalHtml = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
           onclick="this.remove()">
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
             onclick="event.stopPropagation()">
          
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">
              🧪 A/Bテスト結果: ${experimentName}
            </h2>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- サンプルサイズ -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">コントロール群</div>
              <div class="text-3xl font-bold text-blue-600">
                ${data.control_group.n}人
              </div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">実験群</div>
              <div class="text-3xl font-bold text-green-600">
                ${data.experimental_group.n}人
              </div>
            </div>
          </div>
          
          <!-- メトリクス比較 -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3">📊 メトリクス比較</h3>
            <canvas id="abTestChart" width="800" height="300"></canvas>
          </div>
          
          <!-- 統計分析 -->
          <div class="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 class="text-lg font-semibold mb-3">📈 統計分析</h3>
            
            <div class="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div class="text-sm text-gray-600">効果量 (Cohen's d)</div>
                <div class="text-2xl font-bold ${data.analysis.effect_size > 0 ? 'text-green-600' : 'text-red-600'}">
                  ${data.analysis.effect_size.toFixed(3)}
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-600">改善率</div>
                <div class="text-2xl font-bold ${data.analysis.improvement_percentage > 0 ? 'text-green-600' : 'text-red-600'}">
                  ${data.analysis.improvement_percentage > 0 ? '+' : ''}${data.analysis.improvement_percentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div class="border-t pt-4">
              <div class="flex items-center gap-3">
                <div class="text-2xl">
                  ${data.analysis.is_significant ? '✅' : '⚠️'}
                </div>
                <div>
                  <div class="font-semibold">
                    ${data.analysis.is_significant ? '統計的有意差あり' : '統計的有意差なし'}
                  </div>
                  <div class="text-sm text-gray-600">
                    ${data.analysis.recommendation}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 詳細データ -->
          <div class="border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold">指標</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold">コントロール群</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold">実験群</th>
                  <th class="px-4 py-3 text-center text-sm font-semibold">差分</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-t">
                  <td class="px-4 py-3">理解度（平均）</td>
                  <td class="px-4 py-3 text-center">${data.control_group.avg_understanding.toFixed(2)}</td>
                  <td class="px-4 py-3 text-center">${data.experimental_group.avg_understanding.toFixed(2)}</td>
                  <td class="px-4 py-3 text-center font-semibold ${(data.experimental_group.avg_understanding - data.control_group.avg_understanding) > 0 ? 'text-green-600' : 'text-red-600'}">
                    ${((data.experimental_group.avg_understanding - data.control_group.avg_understanding) > 0 ? '+' : '')}${(data.experimental_group.avg_understanding - data.control_group.avg_understanding).toFixed(2)}
                  </td>
                </tr>
                <tr class="border-t bg-gray-50">
                  <td class="px-4 py-3">完了時間（平均）</td>
                  <td class="px-4 py-3 text-center">${data.control_group.avg_completion_time.toFixed(1)}分</td>
                  <td class="px-4 py-3 text-center">${data.experimental_group.avg_completion_time.toFixed(1)}分</td>
                  <td class="px-4 py-3 text-center font-semibold ${(data.control_group.avg_completion_time - data.experimental_group.avg_completion_time) > 0 ? 'text-green-600' : 'text-red-600'}">
                    ${((data.control_group.avg_completion_time - data.experimental_group.avg_completion_time) > 0 ? '-' : '+')}${Math.abs(data.experimental_group.avg_completion_time - data.control_group.avg_completion_time).toFixed(1)}分
                  </td>
                </tr>
                <tr class="border-t">
                  <td class="px-4 py-3">エンゲージメント</td>
                  <td class="px-4 py-3 text-center">${data.control_group.avg_engagement.toFixed(2)}</td>
                  <td class="px-4 py-3 text-center">${data.experimental_group.avg_engagement.toFixed(2)}</td>
                  <td class="px-4 py-3 text-center font-semibold ${(data.experimental_group.avg_engagement - data.control_group.avg_engagement) > 0 ? 'text-green-600' : 'text-red-600'}">
                    ${((data.experimental_group.avg_engagement - data.control_group.avg_engagement) > 0 ? '+' : '')}${(data.experimental_group.avg_engagement - data.control_group.avg_engagement).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="mt-6 flex justify-end gap-3">
            <button onclick="exportABTestResults('${experimentName}')"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <i class="fas fa-download mr-2"></i>CSV出力
            </button>
            <button onclick="this.closest('.fixed').remove()"
                    class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              閉じる
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
    
    // Chart.jsでグラフ描画
    const ctx = document.getElementById('abTestChart').getContext('2d')
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['理解度', '完了時間（分）', 'エンゲージメント'],
        datasets: [
          {
            label: 'コントロール群',
            data: [
              data.control_group.avg_understanding,
              data.control_group.avg_completion_time / 10, // スケール調整
              data.control_group.avg_engagement
            ],
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2
          },
          {
            label: '実験群',
            data: [
              data.experimental_group.avg_understanding,
              data.experimental_group.avg_completion_time / 10, // スケール調整
              data.experimental_group.avg_engagement
            ],
            backgroundColor: 'rgba(34, 197, 94, 0.6)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 5
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || ''
                if (label) {
                  label += ': '
                }
                if (context.parsed.y !== null) {
                  // 完了時間は元のスケールに戻す
                  if (context.dataIndex === 1) {
                    label += (context.parsed.y * 10).toFixed(1) + '分'
                  } else {
                    label += context.parsed.y.toFixed(2)
                  }
                }
                return label
              }
            }
          }
        }
      }
    })
    
  } catch (error) {
    console.error('A/Bテスト結果表示エラー:', error)
    alert('実験結果の表示に失敗しました')
  }
}

// A/Bテスト結果のCSV出力
async function exportABTestResults(experimentName) {
  try {
    const response = await axios.get(`/api/ab-test/results/${experimentName}`)
    
    if (!response.data.success) {
      alert('データの取得に失敗しました')
      return
    }
    
    const data = response.data
    
    const csv = [
      ['A/Bテスト実験結果', experimentName],
      [],
      ['指標', 'コントロール群', '実験群', '差分', '改善率'],
      [
        '理解度（平均）',
        data.control_group.avg_understanding.toFixed(2),
        data.experimental_group.avg_understanding.toFixed(2),
        (data.experimental_group.avg_understanding - data.control_group.avg_understanding).toFixed(2),
        data.analysis.improvement_percentage.toFixed(1) + '%'
      ],
      [
        '完了時間（分）',
        data.control_group.avg_completion_time.toFixed(1),
        data.experimental_group.avg_completion_time.toFixed(1),
        (data.experimental_group.avg_completion_time - data.control_group.avg_completion_time).toFixed(1),
        '-'
      ],
      [
        'エンゲージメント',
        data.control_group.avg_engagement.toFixed(2),
        data.experimental_group.avg_engagement.toFixed(2),
        (data.experimental_group.avg_engagement - data.control_group.avg_engagement).toFixed(2),
        '-'
      ],
      [],
      ['統計分析'],
      ['効果量 (Cohen\'s d)', data.analysis.effect_size.toFixed(3)],
      ['統計的有意性', data.analysis.is_significant ? '有意' : '有意でない'],
      ['推奨', data.analysis.recommendation],
      [],
      ['サンプルサイズ'],
      ['コントロール群', data.control_group.n + '人'],
      ['実験群', data.experimental_group.n + '人']
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ab_test_${experimentName}_${Date.now()}.csv`
    link.click()
    
    console.log('✅ A/Bテスト結果をCSV出力しました')
  } catch (error) {
    console.error('CSV出力エラー:', error)
    alert('CSV出力に失敗しました')
  }
}

// グローバルインスタンス
window.abTestManager = new ABTestManager()
window.realtimePredictor = null // 生徒ごとに初期化

// グローバルスコープに登録
window.RealtimeLearningPredictor = RealtimeLearningPredictor
window.ABTestManager = ABTestManager
window.showABTestResults = showABTestResults
window.exportABTestResults = exportABTestResults

console.log('✅ Phase 15 & 16: 機械学習 + A/Bテスト機能 読み込み完了')

// ==============================================
// Phase 17-19: 深層学習・マルチモーダル・大規模展開
// ==============================================

// Phase 17: LSTM時系列予測クラス
class LSTMPredictor {
  constructor(studentId) {
    this.studentId = studentId
    this.model = null
    this.sequenceLength = 10
    this.isReady = false
  }
  
  async initialize() {
    if (typeof tf === 'undefined') {
      console.warn('⚠️ TensorFlow.jsが読み込まれていません')
      return false
    }
    
    try {
      // LSTMモデルの構築
      this.model = tf.sequential({
        layers: [
          tf.layers.lstm({ 
            units: 64, 
            returnSequences: true,
            inputShape: [this.sequenceLength, 5] // 5つの特徴量
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.lstm({ units: 32 }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'linear' }) // 理解度予測
        ]
      })
      
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      })
      
      this.isReady = true
      console.log('✅ LSTMモデル初期化完了')
      return true
    } catch (error) {
      console.error('❌ LSTMモデル初期化エラー:', error)
      return false
    }
  }
  
  async predictNext(timeSeriesData) {
    if (!this.isReady || !this.model) {
      console.warn('モデルが初期化されていません')
      return null
    }
    
    try {
      // 最新のsequenceLength件のデータを使用
      const recentData = timeSeriesData.slice(-this.sequenceLength)
      
      if (recentData.length < this.sequenceLength) {
        console.warn('データが不足しています')
        return null
      }
      
      // データの正規化と整形
      const features = recentData.map(d => [
        d.understanding_level / 5.0,
        d.completion_time / 60.0,
        d.engagement_score / 5.0,
        d.hint_count / 10.0,
        d.emotion_state === 'focused' ? 1 : (d.emotion_state === 'struggling' ? -1 : 0)
      ])
      
      const xs = tf.tensor3d([features])
      const prediction = this.model.predict(xs)
      const value = await prediction.data()
      
      xs.dispose()
      prediction.dispose()
      
      // 0-5の範囲にスケーリング
      return Math.max(1, Math.min(5, value[0] * 5))
    } catch (error) {
      console.error('LSTM予測エラー:', error)
      return null
    }
  }
}

// Phase 17: 強化学習エージェント
class ReinforcementLearningAgent {
  constructor(studentId) {
    this.studentId = studentId
    this.qTable = {}
    this.epsilon = 0.1 // 探索率
    this.alpha = 0.1 // 学習率
    this.gamma = 0.9 // 割引率
  }
  
  async initialize() {
    // サーバーからQ-tableを読み込む（実装済みAPIを使用）
    try {
      const response = await axios.get(`/api/rl/agent/${this.studentId}`)
      if (response.data.success && response.data.q_table) {
        this.qTable = response.data.q_table
        console.log('✅ RLエージェント初期化完了')
      }
    } catch (error) {
      console.log('新規RLエージェント作成')
      this.qTable = {}
    }
  }
  
  async selectAction(state) {
    try {
      const response = await axios.post('/api/rl/recommend-action', {
        student_id: this.studentId,
        current_state: state
      })
      
      if (response.data.success) {
        return {
          action: response.data.recommended_action,
          confidence: response.data.confidence || 0.5,
          reason: response.data.reason
        }
      }
    } catch (error) {
      console.error('アクション選択エラー:', error)
    }
    
    // デフォルト
    return {
      action: 'continue',
      confidence: 0.5,
      reason: 'デフォルトアクション'
    }
  }
  
  async updateWithReward(state, action, reward) {
    try {
      await axios.post('/api/rl/take-action', {
        student_id: this.studentId,
        state: state,
        action: action,
        reward: reward
      })
      console.log(`✅ RLエージェント更新: state=${JSON.stringify(state)}, action=${action}, reward=${reward}`)
    } catch (error) {
      console.error('RLエージェント更新エラー:', error)
    }
  }
}

// Phase 18: 音声入力ハンドラー
class VoiceInputHandler {
  constructor(studentId) {
    this.studentId = studentId
    this.recognition = null
    this.isListening = false
  }
  
  initialize() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('⚠️ Web Speech APIがサポートされていません')
      return false
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()
    this.recognition.lang = 'ja-JP'
    this.recognition.continuous = false
    this.recognition.interimResults = false
    
    this.recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      const confidence = event.results[0][0].confidence
      
      console.log('🎤 音声認識結果:', transcript, '信頼度:', confidence)
      
      // サーバーに保存
      try {
        await axios.post('/api/voice/save-transcription', {
          student_id: this.studentId,
          audio_url: '', // 実際のオーディオURLは別途アップロード
          transcription: transcript,
          confidence: confidence,
          language: 'ja',
          duration: 0,
          emotion: 'neutral'
        })
        
        // テキスト解析
        await axios.post('/api/transformer/analyze-text', {
          student_id: this.studentId,
          text_input: transcript,
          analysis_type: 'comprehension'
        })
      } catch (error) {
        console.error('音声データ保存エラー:', error)
      }
      
      this.onTranscript && this.onTranscript(transcript, confidence)
    }
    
    this.recognition.onerror = (event) => {
      console.error('音声認識エラー:', event.error)
      this.isListening = false
    }
    
    this.recognition.onend = () => {
      this.isListening = false
    }
    
    console.log('✅ 音声入力ハンドラー初期化完了')
    return true
  }
  
  startListening() {
    if (this.recognition && !this.isListening) {
      this.recognition.start()
      this.isListening = true
      console.log('🎤 音声入力開始')
    }
  }
  
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      console.log('🎤 音声入力停止')
    }
  }
}

// Phase 19: 大規模展開 - 自治体ダッシュボード
async function showMunicipalityDashboard(municipalityId) {
  try {
    const response = await axios.get(`/api/cross-school/analytics/${municipalityId}`)
    
    if (!response.data.success) {
      alert('自治体データの取得に失敗しました')
      return
    }
    
    const data = response.data
    
    const modalHtml = `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
           onclick="this.remove()">
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
             onclick="event.stopPropagation()">
          
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-3xl font-bold text-gray-800">
              🏫 自治体全体ダッシュボード
            </h2>
            <button onclick="this.closest('.fixed').remove()" 
                    class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <!-- 全体サマリー -->
          <div class="grid grid-cols-4 gap-4 mb-8">
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">総生徒数</div>
              <div class="text-3xl font-bold text-blue-600">
                ${data.overview.total_students}人
              </div>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">平均理解度</div>
              <div class="text-3xl font-bold text-green-600">
                ${data.overview.average_understanding.toFixed(2)}
              </div>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">平均完了時間</div>
              <div class="text-3xl font-bold text-yellow-600">
                ${data.overview.average_completion_time.toFixed(1)}分
              </div>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <div class="text-sm text-gray-600">総カード完了数</div>
              <div class="text-3xl font-bold text-purple-600">
                ${data.overview.total_cards_completed}
              </div>
            </div>
          </div>
          
          <!-- トップ校 -->
          <div class="mb-6">
            <h3 class="text-xl font-semibold mb-3 text-green-700">
              🏆 優秀校
            </h3>
            <div class="grid grid-cols-3 gap-4">
              ${data.top_performing.slice(0, 3).map((school, index) => `
                <div class="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                  <div class="text-lg font-bold">${index + 1}位: ${school.school_name}</div>
                  <div class="text-sm text-gray-600 mt-2">
                    <div>理解度: ${(school.avg_understanding || 0).toFixed(2)}</div>
                    <div>生徒数: ${school.total_students || 0}人</div>
                    <div>完了カード: ${school.total_cards_completed || 0}枚</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- 課題校 -->
          <div class="mb-6">
            <h3 class="text-xl font-semibold mb-3 text-orange-700">
              ⚠️ サポート推奨校
            </h3>
            <div class="grid grid-cols-3 gap-4">
              ${data.struggling.slice(0, 3).map(school => `
                <div class="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                  <div class="text-lg font-bold">${school.school_name}</div>
                  <div class="text-sm text-gray-600 mt-2">
                    <div>理解度: ${(school.avg_understanding || 0).toFixed(2)}</div>
                    <div>生徒数: ${school.total_students || 0}人</div>
                    <div>完了カード: ${school.total_cards_completed || 0}枚</div>
                  </div>
                  <div class="mt-2 text-sm text-orange-700">
                    ➡️ 個別サポートが推奨されます
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- 全学校一覧 -->
          <div class="mb-6">
            <h3 class="text-xl font-semibold mb-3">📊 全学校データ</h3>
            <div class="border rounded-lg overflow-hidden">
              <table class="w-full">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="px-4 py-3 text-left text-sm font-semibold">学校名</th>
                    <th class="px-4 py-3 text-center text-sm font-semibold">生徒数</th>
                    <th class="px-4 py-3 text-center text-sm font-semibold">理解度</th>
                    <th class="px-4 py-3 text-center text-sm font-semibold">完了時間</th>
                    <th class="px-4 py-3 text-center text-sm font-semibold">完了カード</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.schools.map((school, index) => `
                    <tr class="border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                      <td class="px-4 py-3">${school.school_name}</td>
                      <td class="px-4 py-3 text-center">${school.total_students || 0}</td>
                      <td class="px-4 py-3 text-center font-semibold ${(school.avg_understanding || 0) >= 4 ? 'text-green-600' : (school.avg_understanding || 0) < 3 ? 'text-red-600' : 'text-yellow-600'}">
                        ${(school.avg_understanding || 0).toFixed(2)}
                      </td>
                      <td class="px-4 py-3 text-center">${(school.avg_completion_time || 0).toFixed(1)}分</td>
                      <td class="px-4 py-3 text-center">${school.total_cards_completed || 0}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- 推奨事項 -->
          <div class="bg-blue-50 p-6 rounded-lg mb-6">
            <h3 class="text-xl font-semibold mb-3 text-blue-800">💡 推奨事項</h3>
            <ul class="space-y-2 text-gray-700">
              <li>✅ ${data.recommendations.overall}</li>
              <li>🏆 優秀校: ${data.recommendations.top_schools}</li>
              <li>⚠️ 課題校: ${data.recommendations.struggling_schools}</li>
            </ul>
          </div>
          
          <div class="flex justify-end gap-3">
            <button onclick="exportMunicipalityData(${municipalityId})"
                    class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              <i class="fas fa-download mr-2"></i>CSV出力
            </button>
            <button onclick="showResearchDatasetCreator(${municipalityId})"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <i class="fas fa-database mr-2"></i>研究データセット作成
            </button>
            <button onclick="this.closest('.fixed').remove()"
                    class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              閉じる
            </button>
          </div>
        </div>
      </div>
    `
    
    document.body.insertAdjacentHTML('beforeend', modalHtml)
    
  } catch (error) {
    console.error('自治体ダッシュボード表示エラー:', error)
    alert('ダッシュボードの表示に失敗しました')
  }
}

// Phase 19: 自治体データCSV出力
async function exportMunicipalityData(municipalityId) {
  try {
    const response = await axios.get(`/api/cross-school/analytics/${municipalityId}`)
    
    if (!response.data.success) {
      alert('データの取得に失敗しました')
      return
    }
    
    const data = response.data
    
    const csv = [
      ['自治体全体分析レポート'],
      [],
      ['全体サマリー'],
      ['総生徒数', data.overview.total_students],
      ['平均理解度', data.overview.average_understanding.toFixed(2)],
      ['平均完了時間（分）', data.overview.average_completion_time.toFixed(1)],
      ['総カード完了数', data.overview.total_cards_completed],
      [],
      ['学校別データ'],
      ['学校名', '生徒数', '平均理解度', '平均完了時間（分）', '完了カード数'],
      ...data.schools.map(s => [
        s.school_name,
        s.total_students || 0,
        (s.avg_understanding || 0).toFixed(2),
        (s.avg_completion_time || 0).toFixed(1),
        s.total_cards_completed || 0
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `municipality_report_${municipalityId}_${Date.now()}.csv`
    link.click()
    
    console.log('✅ 自治体データをCSV出力しました')
  } catch (error) {
    console.error('CSV出力エラー:', error)
    alert('CSV出力に失敗しました')
  }
}

// Phase 19: 研究データセット作成UI
function showResearchDatasetCreator(municipalityId) {
  const modalHtml = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
         onclick="this.remove()">
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full"
           onclick="event.stopPropagation()">
        
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          📚 研究用データセット作成
        </h2>
        
        <form id="datasetForm" class="space-y-4">
          <div>
            <label class="block text-sm font-semibold mb-2">データセット名</label>
            <input type="text" name="dataset_name" required
                   class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                   placeholder="例: 2024年度個別最適化学習効果検証データ">
          </div>
          
          <div>
            <label class="block text-sm font-semibold mb-2">説明</label>
            <textarea name="description" rows="3" required
                      class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="研究目的、対象期間、使用方法など"></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold mb-2">開始日</label>
              <input type="date" name="start_date" required
                     class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2">終了日</label>
              <input type="date" name="end_date" required
                     class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-semibold mb-2">匿名化レベル</label>
            <select name="anonymization_level" required
                    class="w-full px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500">
              <option value="full">完全匿名化（推奨）</option>
              <option value="partial">部分匿名化</option>
              <option value="aggregated">集計済みデータのみ</option>
            </select>
          </div>
          
          <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 class="font-semibold text-yellow-800 mb-2">⚠️ 倫理的配慮</h3>
            <ul class="text-sm text-yellow-700 space-y-1">
              <li>✓ 学校・保護者からのデータ共有同意を確認済み</li>
              <li>✓ 個人を特定できる情報は含まれません</li>
              <li>✓ 研究目的以外での使用は禁止されます</li>
              <li>✓ 論文発表時には引用情報を記載してください</li>
            </ul>
          </div>
          
          <div class="flex justify-end gap-3 mt-6">
            <button type="button" onclick="this.closest('.fixed').remove()"
                    class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              キャンセル
            </button>
            <button type="submit"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <i class="fas fa-check mr-2"></i>データセット作成
            </button>
          </div>
        </form>
      </div>
    </div>
  `
  
  document.body.insertAdjacentHTML('beforeend', modalHtml)
  
  // フォーム送信処理
  document.getElementById('datasetForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const formData = new FormData(e.target)
    
    try {
      const response = await axios.post('/api/research/create-dataset', {
        dataset_name: formData.get('dataset_name'),
        researcher_id: parseInt(localStorage.getItem('currentUserId')),
        description: formData.get('description'),
        data_collection_start: formData.get('start_date'),
        data_collection_end: formData.get('end_date'),
        school_codes: [], // 自治体の全学校を含む
        anonymization_level: formData.get('anonymization_level')
      })
      
      if (response.data.success) {
        alert('✅ 研究用データセットを作成しました！\n\nデータセットID: ' + response.data.dataset_id + '\n\n研究データエクスポートAPIを使用してデータを取得できます。')
        document.querySelector('.fixed').remove()
      }
    } catch (error) {
      console.error('データセット作成エラー:', error)
      alert('データセットの作成に失敗しました')
    }
  })
}

// グローバルスコープに登録
window.LSTMPredictor = LSTMPredictor
window.ReinforcementLearningAgent = ReinforcementLearningAgent
window.VoiceInputHandler = VoiceInputHandler
window.showMunicipalityDashboard = showMunicipalityDashboard
window.exportMunicipalityData = exportMunicipalityData
window.showResearchDatasetCreator = showResearchDatasetCreator

// 学習カード画像URL編集機能
async function editCardImageUrl(cardId, imageType) {
  const currentUrl = prompt(
    imageType === 'problem' 
      ? '問題画像のURLを入力してください（削除する場合は空欄にしてください）:' 
      : '解答画像のURLを入力してください（削除する場合は空欄にしてください）:'
  )
  
  if (currentUrl === null) return // キャンセル
  
  try {
    const fieldName = imageType === 'problem' ? 'problem_image_url' : 'answer_image_url'
    const response = await axios.put(`/api/card/${cardId}`, {
      [fieldName]: currentUrl
    })
    
    if (response.data.success) {
      alert('✅ 画像URLを更新しました')
      // モーダルを閉じて再度開く（更新を反映）
      closeCardDetail()
      // 再読み込み処理は呼び出し元に委ねる
      window.location.reload()
    }
  } catch (error) {
    console.error('画像URL更新エラー:', error)
    alert('画像URLの更新に失敗しました')
  }
}

window.editCardImageUrl = editCardImageUrl

// ============================================
// 学習スタイル別サンプルページ（プレゼン用サンプル）
// ============================================
function showLearningStyleSamples() {
  const app = document.getElementById('app')
  app.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div class="container mx-auto px-4 max-w-7xl">
        
        <!-- ヘッダー -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-xl p-8 mb-8">
          <button onclick="renderTopPage()" class="text-white hover:text-gray-200 mb-4 flex items-center">
            <i class="fas fa-arrow-left mr-2"></i>トップページに戻る
          </button>
          <div class="text-center">
            <div class="inline-block bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-bold mb-4">
              👥 プレゼン用サンプル
            </div>
            <h1 class="text-4xl font-bold mb-3">
              <i class="fas fa-brain mr-3"></i>
              学習スタイル別サンプル
            </h1>
            <p class="text-xl opacity-90 mb-2">
              視覚・聴覚・体験の優位性に応じた学習カードの違い
            </p>
            <p class="text-sm opacity-75">
              同じ内容（小学4年算数「小数のかけ算」）を3つの学習スタイルで表現
            </p>
          </div>
        </div>

        <!-- 学習スタイルの説明 -->
        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            <i class="fas fa-info-circle mr-2 text-blue-600"></i>
            学習スタイルとは
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-6">
              <div class="text-center mb-4">
                <i class="fas fa-eye text-5xl text-red-600 mb-2"></i>
                <h3 class="text-2xl font-bold text-red-800">視覚優位</h3>
                <p class="text-sm text-red-700 font-bold">Visual Learner</p>
              </div>
              <ul class="space-y-2 text-gray-800 text-sm">
                <li>✓ 図表・イラスト・グラフで理解しやすい</li>
                <li>✓ 色分けや視覚的な整理が効果的</li>
                <li>✓ 見て覚えることが得意</li>
                <li>✓ マインドマップや図解が好き</li>
              </ul>
            </div>
            
            <div class="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6">
              <div class="text-center mb-4">
                <i class="fas fa-volume-up text-5xl text-green-600 mb-2"></i>
                <h3 class="text-2xl font-bold text-green-800">聴覚優位</h3>
                <p class="text-sm text-green-700 font-bold">Auditory Learner</p>
              </div>
              <ul class="space-y-2 text-gray-800 text-sm">
                <li>✓ 言葉での説明が理解しやすい</li>
                <li>✓ 声に出して読むと覚えやすい</li>
                <li>✓ 会話や議論で深まる</li>
                <li>✓ リズムや音で記憶する</li>
              </ul>
            </div>
            
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6">
              <div class="text-center mb-4">
                <i class="fas fa-hands text-5xl text-blue-600 mb-2"></i>
                <h3 class="text-2xl font-bold text-blue-800">体験優位</h3>
                <p class="text-sm text-blue-700 font-bold">Kinesthetic Learner</p>
              </div>
              <ul class="space-y-2 text-gray-800 text-sm">
                <li>✓ 実際に体を動かして学ぶ</li>
                <li>✓ 実験・観察・操作が効果的</li>
                <li>✓ 体験を通じて理解が深まる</li>
                <li>✓ 実物を触って確かめたい</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- サンプル学習カード比較 -->
        <div class="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            <i class="fas fa-book-open mr-2 text-purple-600"></i>
            同じ学習内容の3つの表現方法
          </h2>
          <div class="text-center mb-6">
            <div class="inline-block bg-purple-100 px-6 py-3 rounded-full">
              <p class="text-lg font-bold text-purple-800">学習内容：小学4年算数「小数のかけ算」</p>
              <p class="text-sm text-purple-600">カード1：小数 × 整数の基本</p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- 視覚優位版 -->
            <div class="border-4 border-red-300 rounded-xl overflow-hidden bg-gradient-to-br from-red-50 to-white">
              <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
                <h3 class="text-xl font-bold flex items-center justify-center">
                  <i class="fas fa-eye mr-2"></i>
                  視覚優位版
                </h3>
              </div>
              <div class="p-6 space-y-4">
                
                <!-- AIメディア生成デモボタン -->
                <div class="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg">
                  <p class="text-sm font-bold text-gray-800 mb-2 text-center">
                    <i class="fas fa-magic mr-2"></i>AIメディア生成デモ
                  </p>
                  <div class="flex gap-2">
                    <button onclick="generateVisualDemo()" class="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition transform hover:scale-105 shadow-lg">
                      <i class="fas fa-image mr-1"></i>画像生成
                    </button>
                    <button onclick="generateVideoDemo()" class="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition transform hover:scale-105 shadow-lg">
                      <i class="fas fa-video mr-1"></i>動画生成
                    </button>
                  </div>
                </div>
                
                <!-- デモ表示エリア -->
                <div id="visual-demo-area"></div>
                <div class="bg-white rounded-lg border-2 border-red-200 p-4">
                  <h4 class="font-bold text-red-800 mb-2">📝 問題</h4>
                  <p class="text-gray-800 mb-3">0.3 × 4 を計算しましょう。</p>
                  
                  <div class="bg-red-50 p-4 rounded-lg mb-3">
                    <p class="text-sm font-bold text-red-800 mb-2">🎨 視覚的な表現</p>
                    <div class="space-y-2">
                      <div class="flex items-center">
                        <div class="w-32 h-8 border-2 border-red-400 rounded flex">
                          <div class="w-1/10 bg-red-300 border-r border-red-400 flex items-center justify-center text-xs">0.1</div>
                          <div class="w-1/10 bg-red-300 border-r border-red-400 flex items-center justify-center text-xs">0.1</div>
                          <div class="w-1/10 bg-red-300 flex items-center justify-center text-xs">0.1</div>
                        </div>
                        <span class="ml-2 text-gray-600">0.3</span>
                      </div>
                      <p class="text-center text-gray-600">×</p>
                      <div class="flex items-center">
                        <div class="w-16 h-8 bg-red-200 rounded flex items-center justify-center font-bold">4</div>
                        <span class="ml-2 text-gray-600">個</span>
                      </div>
                      <div class="border-t-2 border-gray-300 pt-2">
                        <p class="text-center text-lg font-bold text-red-600">= 1.2</p>
                      </div>
                    </div>
                  </div>

                  <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <p class="text-sm font-bold text-yellow-800 mb-1">📊 図で確認</p>
                    <div class="grid grid-cols-4 gap-2">
                      ${Array(4).fill(0).map(() => `
                        <div class="h-16 border-2 border-red-300 rounded relative">
                          <div class="h-3/10 bg-red-300 absolute bottom-0 left-0 right-0"></div>
                          <span class="absolute bottom-1 left-1 text-xs">0.3</span>
                        </div>
                      `).join('')}
                    </div>
                    <p class="text-center mt-2 text-sm text-gray-700">合計：1.2</p>
                  </div>
                </div>

                <div class="bg-red-50 rounded-lg p-4">
                  <p class="text-sm font-bold text-red-800 mb-2">💡 ヒント（視覚型）</p>
                  <ol class="text-sm text-gray-700 space-y-1">
                    <li>1. 図を見て、0.3が何個あるか数えてみよう</li>
                    <li>2. 色付きの部分を全部合わせるといくつ？</li>
                    <li>3. 小数点の位置に注意して、図と数字を対応させよう</li>
                  </ol>
                </div>
              </div>
            </div>

            <!-- 聴覚優位版 -->
            <div class="border-4 border-green-300 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-white">
              <div class="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
                <h3 class="text-xl font-bold flex items-center justify-center">
                  <i class="fas fa-volume-up mr-2"></i>
                  聴覚優位版
                </h3>
              </div>
              <div class="p-6 space-y-4">
                
                <!-- AIメディア生成デモボタン -->
                <div class="bg-gradient-to-r from-orange-100 to-yellow-100 p-4 rounded-lg">
                  <p class="text-sm font-bold text-gray-800 mb-2 text-center">
                    <i class="fas fa-magic mr-2"></i>AIメディア生成デモ
                  </p>
                  <div class="flex gap-2">
                    <button onclick="generateAudioDemo()" class="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition transform hover:scale-105 shadow-lg">
                      <i class="fas fa-microphone mr-1"></i>音声生成
                    </button>
                    <button onclick="generateMusicDemo()" class="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition transform hover:scale-105 shadow-lg">
                      <i class="fas fa-music mr-1"></i>音楽生成
                    </button>
                  </div>
                </div>
                
                <!-- デモ表示エリア -->
                <div id="auditory-demo-area"></div>
                <div class="bg-white rounded-lg border-2 border-green-200 p-4">
                  <h4 class="font-bold text-green-800 mb-2">📝 問題</h4>
                  <p class="text-gray-800 mb-3">0.3 × 4 を計算しましょう。</p>
                  
                  <div class="bg-green-50 p-4 rounded-lg mb-3">
                    <p class="text-sm font-bold text-green-800 mb-2">🎵 言葉で考えよう</p>
                    <div class="space-y-3 text-gray-800">
                      <p class="leading-relaxed">
                        「<span class="font-bold text-green-600">れいてんさん</span>が<span class="font-bold text-green-600">よん個</span>」と声に出して読んでみましょう。
                      </p>
                      <p class="leading-relaxed">
                        0.3を4回足すことを考えます：<br>
                        <span class="text-green-600 font-bold">「0.3 たす 0.3 たす 0.3 たす 0.3」</span>
                      </p>
                      <p class="leading-relaxed">
                        または、<br>
                        <span class="text-green-600 font-bold">「3 × 4 = 12」</span>を計算してから、<br>
                        <span class="text-green-600 font-bold">小数点を1つ左に</span>ずらします。
                      </p>
                    </div>
                  </div>

                  <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                    <p class="text-sm font-bold text-yellow-800 mb-1">🗣️ 説明の流れ</p>
                    <ol class="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                      <li><strong>まず</strong>、小数点を無視して 3 × 4 = 12</li>
                      <li><strong>次に</strong>、0.3は小数第一位だから、答えも小数第一位</li>
                      <li><strong>だから</strong>、12 → 1.2 となります</li>
                    </ol>
                  </div>
                </div>

                <div class="bg-green-50 rounded-lg p-4">
                  <p class="text-sm font-bold text-green-800 mb-2">💡 ヒント（聴覚型）</p>
                  <ol class="text-sm text-gray-700 space-y-1">
                    <li>1. 「3 かける 4 は 12」と声に出してみよう</li>
                    <li>2. 「小数点は1つ左」と唱えながら、12 → 1.2</li>
                    <li>3. 友達に説明するつもりで、順番に話してみよう</li>
                  </ol>
                </div>
              </div>
            </div>

            <!-- 体験優位版 -->
            <div class="border-4 border-blue-300 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-white">
              <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                <h3 class="text-xl font-bold flex items-center justify-center">
                  <i class="fas fa-hands mr-2"></i>
                  体験優位版
                </h3>
              </div>
              <div class="p-6 space-y-4">
                
                <!-- AIメディア生成デモボタン -->
                <div class="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg">
                  <p class="text-sm font-bold text-gray-800 mb-2 text-center">
                    <i class="fas fa-magic mr-2"></i>AIインタラクティブ教材生成デモ
                  </p>
                  <button onclick="generateKinestheticDemo()" class="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition transform hover:scale-105 shadow-lg">
                    <i class="fas fa-gamepad mr-2"></i>体験型教材を生成
                  </button>
                </div>
                
                <!-- デモ表示エリア -->
                <div id="kinesthetic-demo-area"></div>
                <div class="bg-white rounded-lg border-2 border-blue-200 p-4">
                  <h4 class="font-bold text-blue-800 mb-2">📝 問題</h4>
                  <p class="text-gray-800 mb-3">0.3 × 4 を計算しましょう。</p>
                  
                  <div class="bg-blue-50 p-4 rounded-lg mb-3">
                    <p class="text-sm font-bold text-blue-800 mb-2">🙌 実際にやってみよう</p>
                    <div class="space-y-3">
                      <div class="bg-white border-2 border-blue-300 rounded-lg p-3">
                        <p class="font-bold text-blue-700 mb-2">📐 準備するもの</p>
                        <ul class="text-sm text-gray-700 space-y-1">
                          <li>• 1Lのペットボトル（または1mの長さ）</li>
                          <li>• 紙コップ（300mlサイズ）を4個</li>
                        </ul>
                      </div>
                      
                      <div class="bg-white border-2 border-blue-300 rounded-lg p-3">
                        <p class="font-bold text-blue-700 mb-2">🎯 やり方</p>
                        <ol class="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                          <li>1Lのペットボトルに水を入れる（1.0）</li>
                          <li>300mlの紙コップを用意する（0.3）</li>
                          <li>紙コップで4回くむ（0.3 × 4）</li>
                          <li>合計の水の量をはかる → <strong class="text-blue-600">1.2L</strong></li>
                        </ol>
                      </div>
                      
                      <div class="bg-white border-2 border-blue-300 rounded-lg p-3">
                        <p class="font-bold text-blue-700 mb-2">🔬 確かめよう</p>
                        <p class="text-sm text-gray-700">
                          実際に水を使って、0.3が4個で1.2になることを<strong>体で感じて</strong>確認してみましょう。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="bg-blue-50 rounded-lg p-4">
                  <p class="text-sm font-bold text-blue-800 mb-2">💡 ヒント（体験型）</p>
                  <ol class="text-sm text-gray-700 space-y-1">
                    <li>1. 指で数えながら、0.3を4回たしてみよう</li>
                    <li>2. ものさしで0.3mを4本並べて、全体の長さを測ろう</li>
                    <li>3. おはじきやブロックを使って、実際に並べてみよう</li>
                  </ol>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- 教育的効果の説明 -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">
            <i class="fas fa-star mr-2 text-yellow-500"></i>
            個別最適化の教育的効果
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border-2 border-purple-300">
              <h3 class="text-xl font-bold text-purple-800 mb-3">
                <i class="fas fa-chart-line mr-2"></i>
                学習効果の向上
              </h3>
              <ul class="space-y-2 text-gray-800">
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-purple-600 mr-2 mt-1"></i>
                  <span>自分に合った方法で理解が深まる</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-purple-600 mr-2 mt-1"></i>
                  <span>苦手意識が減り、学習意欲が向上</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-purple-600 mr-2 mt-1"></i>
                  <span>理解度が平均20-30%向上</span>
                </li>
              </ul>
            </div>

            <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 border-2 border-indigo-300">
              <h3 class="text-xl font-bold text-indigo-800 mb-3">
                <i class="fas fa-users mr-2"></i>
                多様性への対応
              </h3>
              <ul class="space-y-2 text-gray-800">
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-indigo-600 mr-2 mt-1"></i>
                  <span>全ての子どもに学びの機会を提供</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-indigo-600 mr-2 mt-1"></i>
                  <span>発達特性に応じた支援が可能</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-indigo-600 mr-2 mt-1"></i>
                  <span>インクルーシブ教育の実現</span>
                </li>
              </ul>
            </div>

            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-300">
              <h3 class="text-xl font-bold text-green-800 mb-3">
                <i class="fas fa-robot mr-2"></i>
                AI活用の利点
              </h3>
              <ul class="space-y-2 text-gray-800">
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                  <span>教師の負担を軽減しながら個別対応</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                  <span>全教科・全単元で対応可能</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-green-600 mr-2 mt-1"></i>
                  <span>継続的な改善とアップデート</span>
                </li>
              </ul>
            </div>

            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border-2 border-orange-300">
              <h3 class="text-xl font-bold text-orange-800 mb-3">
                <i class="fas fa-graduation-cap mr-2"></i>
                教育の質向上
              </h3>
              <ul class="space-y-2 text-gray-800">
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-orange-600 mr-2 mt-1"></i>
                  <span>エビデンスに基づく指導が可能</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-orange-600 mr-2 mt-1"></i>
                  <span>学習データの蓄積と分析</span>
                </li>
                <li class="flex items-start">
                  <i class="fas fa-check-circle text-orange-600 mr-2 mt-1"></i>
                  <span>個別指導計画の自動生成</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- アクションボタン -->
        <div class="mt-8 text-center">
          <button 
            onclick="renderTopPage()"
            class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition shadow-xl">
            <i class="fas fa-arrow-left mr-2"></i>
            トップページに戻る
          </button>
        </div>

      </div>
    </div>
  `
}

window.showLearningStyleSamples = showLearningStyleSamples

// メディア生成デモ機能
async function generateVisualDemo() {
  const demoArea = document.getElementById('visual-demo-area')
  if (!demoArea) return
  
  demoArea.innerHTML = `
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-600">AIが図解を生成中...</p>
    </div>
  `
  
  try {
    const response = await axios.post('/api/media/generate-image', {
      prompt: '小数のかけ算 0.3 × 4 を視覚的に表現した図解',
      style: 'educational-diagram'
    })
    
    if (response.data.success) {
      demoArea.innerHTML = `
        <div class="bg-white p-4 rounded-lg border-2 border-green-300">
          <h4 class="font-bold text-green-800 mb-3">🎨 AIが生成した図解</h4>
          <img src="${response.data.imageUrl}" alt="生成された図解" class="w-full rounded-lg mb-3 shadow-lg">
          <p class="text-sm text-gray-600 bg-green-50 p-3 rounded">${response.data.note}</p>
        </div>
      `
    }
  } catch (error) {
    console.error('画像生成エラー:', error)
    demoArea.innerHTML = `<p class="text-red-600">生成エラーが発生しました</p>`
  }
}

async function generateVideoDemo() {
  const demoArea = document.getElementById('visual-demo-area')
  if (!demoArea) return
  
  demoArea.innerHTML = `
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="mt-2 text-sm text-gray-600">AIがアニメーションを生成中...</p>
    </div>
  `
  
  try {
    const response = await axios.post('/api/media/generate-video', {
      prompt: '小数のかけ算 0.3 × 4 のアニメーション',
      duration: 5
    })
    
    if (response.data.success) {
      demoArea.innerHTML = `
        <div class="bg-white p-4 rounded-lg border-2 border-green-300">
          <h4 class="font-bold text-green-800 mb-3">🎬 AIが生成したアニメーション</h4>
          <div class="bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg overflow-hidden mb-3 shadow-lg" style="height: 600px; width: 100%;">
            <iframe srcdoc="${response.data.animationHtml.replace(/"/g, '&quot;')}" 
                    style="width: 100%; height: 100%; border: none; display: block;">
            </iframe>
          </div>
          <div class="flex gap-2 mb-3">
            <button onclick="reloadAnimation()" 
                    class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-bold transition shadow-lg">
              <i class="fas fa-redo mr-2"></i>もう一度再生
            </button>
          </div>
          <p class="text-sm text-gray-600 bg-blue-50 p-3 rounded">${response.data.note}</p>
          <p class="text-xs text-gray-500 mt-2">💡 アニメーションは約6秒間再生されます</p>
        </div>
      `
    }
  } catch (error) {
    console.error('動画生成エラー:', error)
    demoArea.innerHTML = `<p class="text-red-600">生成エラーが発生しました</p>`
  }
}

function reloadAnimation() {
  const iframe = document.querySelector('#visual-demo-area iframe')
  if (iframe) {
    iframe.contentWindow.location.reload()
  }
}

async function generateAudioDemo() {
  const demoArea = document.getElementById('auditory-demo-area')
  if (!demoArea) return
  
  demoArea.innerHTML = `
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      <p class="mt-2 text-sm text-gray-600">AIが音声解説を生成中...</p>
    </div>
  `
  
  try {
    const response = await axios.post('/api/media/generate-audio', {
      text: '小数のかけ算の音声解説',
      voice: 'female-teacher'
    })
    
    if (response.data.success) {
      const scriptLines = response.data.scriptText.split('\n').filter(line => line.trim())
      
      demoArea.innerHTML = `
        <div class="bg-white p-4 rounded-lg border-2 border-orange-300">
          <h4 class="font-bold text-orange-800 mb-3">🎙️ AIが生成した音声解説</h4>
          <div class="bg-orange-50 p-4 rounded-lg mb-3">
            <div class="text-center mb-3">
              <i class="fas fa-volume-up text-5xl text-orange-600 mb-3" id="speaker-icon"></i>
              <div>
                <button onclick="speakAudioScript()" id="speak-button"
                        class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-bold text-lg transition transform hover:scale-105 shadow-lg">
                  <i class="fas fa-play mr-2"></i>音声を再生
                </button>
                <button onclick="stopAudioScript()" id="stop-button" style="display:none;"
                        class="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold text-lg transition transform hover:scale-105 shadow-lg ml-2">
                  <i class="fas fa-stop mr-2"></i>停止
                </button>
              </div>
            </div>
            <div class="bg-white p-4 rounded border-2 border-orange-200 mb-3">
              <div id="script-content" class="text-sm text-gray-700 space-y-2">
                ${scriptLines.map((line, index) => `
                  <p id="line-${index}" class="transition-all duration-300">${line}</p>
                `).join('')}
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600 bg-orange-50 p-3 rounded">${response.data.note}</p>
          <p class="text-xs text-gray-500 mt-2">💡 「音声を再生」ボタンをクリックすると、ブラウザの音声合成機能で読み上げます</p>
        </div>
      `
      
      // スクリプトデータを保存
      window.audioScriptData = scriptLines
    }
  } catch (error) {
    console.error('音声生成エラー:', error)
    demoArea.innerHTML = `<p class="text-red-600">生成エラーが発生しました</p>`
  }
}

// 音声読み上げ機能
let speechSynthesis = window.speechSynthesis
let currentUtterance = null
let currentLineIndex = 0
let japaneseVoice = null

// 日本語音声を取得
function getJapaneseVoice() {
  if (japaneseVoice) return japaneseVoice
  
  const voices = speechSynthesis.getVoices()
  // 日本語音声を優先的に選択
  japaneseVoice = voices.find(voice => voice.lang === 'ja-JP') || voices[0]
  return japaneseVoice
}

// ページ読み込み時に音声リストを取得
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = getJapaneseVoice
}

function speakAudioScript() {
  if (!window.audioScriptData) return
  
  // ボタン切り替え
  document.getElementById('speak-button').style.display = 'none'
  document.getElementById('stop-button').style.display = 'inline-block'
  
  currentLineIndex = 0
  speakNextLine()
}

function speakNextLine() {
  if (!window.audioScriptData || currentLineIndex >= window.audioScriptData.length) {
    stopAudioScript()
    return
  }
  
  const line = window.audioScriptData[currentLineIndex]
  const lineElement = document.getElementById(`line-${currentLineIndex}`)
  
  // 現在の行をハイライト
  if (lineElement) {
    document.querySelectorAll('#script-content p').forEach(p => {
      p.style.backgroundColor = ''
      p.style.fontWeight = 'normal'
      p.style.transform = 'scale(1)'
    })
    lineElement.style.backgroundColor = '#fed7aa'
    lineElement.style.fontWeight = 'bold'
    lineElement.style.transform = 'scale(1.05)'
    lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  // スピーカーアイコンをアニメーション
  const icon = document.getElementById('speaker-icon')
  if (icon) {
    icon.classList.add('animate-pulse')
  }
  
  currentUtterance = new SpeechSynthesisUtterance(line)
  const voice = getJapaneseVoice()
  if (voice) {
    currentUtterance.voice = voice
  }
  currentUtterance.lang = 'ja-JP'
  currentUtterance.rate = 0.85  // さらにゆっくり
  currentUtterance.pitch = 1.0  // 自然なピッチ
  currentUtterance.volume = 1.0
  
  currentUtterance.onend = () => {
    currentLineIndex++
    setTimeout(() => speakNextLine(), 800)  // より長い間隔
  }
  
  speechSynthesis.speak(currentUtterance)
}

function stopAudioScript() {
  speechSynthesis.cancel()
  
  // ボタンを元に戻す
  if (document.getElementById('speak-button')) {
    document.getElementById('speak-button').style.display = 'inline-block'
  }
  if (document.getElementById('stop-button')) {
    document.getElementById('stop-button').style.display = 'none'
  }
  
  // ハイライトを解除
  document.querySelectorAll('#script-content p').forEach(p => {
    p.style.backgroundColor = ''
    p.style.fontWeight = 'normal'
    p.style.transform = 'scale(1)'
  })
  
  // アイコンのアニメーションを停止
  const icon = document.getElementById('speaker-icon')
  if (icon) {
    icon.classList.remove('animate-pulse')
  }
  
  currentLineIndex = 0
}

async function generateMusicDemo() {
  const demoArea = document.getElementById('auditory-demo-area')
  if (!demoArea) return
  
  // 曲調選択UIを表示
  demoArea.innerHTML = `
    <div class="bg-white p-6 rounded-lg border-2 border-orange-300">
      <h4 class="font-bold text-orange-800 mb-4 text-center">🎵 音楽の曲調を選んでください</h4>
      <p class="text-sm text-gray-600 mb-4 text-center">好きな曲調を選んで、学習ソングを生成します</p>
      
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button onclick="selectMusicStyle('cheerful-pop')" 
                class="music-style-btn bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white p-4 rounded-lg font-bold transition transform hover:scale-105 shadow-lg">
          <i class="fas fa-smile text-2xl mb-2"></i>
          <div>明るいポップ</div>
          <div class="text-xs opacity-90">元気で楽しい</div>
        </button>
        
        <button onclick="selectMusicStyle('calm-ballad')" 
                class="music-style-btn bg-gradient-to-r from-blue-400 to-cyan-400 hover:from-blue-500 hover:to-cyan-500 text-white p-4 rounded-lg font-bold transition transform hover:scale-105 shadow-lg">
          <i class="fas fa-heart text-2xl mb-2"></i>
          <div>やさしいバラード</div>
          <div class="text-xs opacity-90">ゆったり落ち着く</div>
        </button>
        
        <button onclick="selectMusicStyle('rhythmic-dance')" 
                class="music-style-btn bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white p-4 rounded-lg font-bold transition transform hover:scale-105 shadow-lg">
          <i class="fas fa-music text-2xl mb-2"></i>
          <div>リズミカル</div>
          <div class="text-xs opacity-90">ダンスみたいに</div>
        </button>
        
        <button onclick="selectMusicStyle('acoustic-folk')" 
                class="music-style-btn bg-gradient-to-r from-green-400 to-teal-400 hover:from-green-500 hover:to-teal-500 text-white p-4 rounded-lg font-bold transition transform hover:scale-105 shadow-lg">
          <i class="fas fa-guitar text-2xl mb-2"></i>
          <div>アコースティック</div>
          <div class="text-xs opacity-90">ギターの優しい音</div>
        </button>
      </div>
      
      <p class="text-xs text-gray-500 text-center">💡 選んだ曲調で、AIが学習ソングを生成します</p>
    </div>
  `
}

// 選択された曲調で音楽を生成
async function selectMusicStyle(style) {
  const demoArea = document.getElementById('auditory-demo-area')
  if (!demoArea) return
  
  // 曲調の日本語説明
  const styleDescriptions = {
    'cheerful-pop': {
      name: '明るいポップ',
      prompt: 'A cheerful and upbeat pop song for children, bright melody, energetic rhythm, happy vocals, Japanese children\'s song style'
    },
    'calm-ballad': {
      name: 'やさしいバラード',
      prompt: 'A gentle and calm ballad for children, soft melody, slow tempo, soothing vocals, peaceful atmosphere, Japanese lullaby style'
    },
    'rhythmic-dance': {
      name: 'リズミカル',
      prompt: 'A rhythmic and danceable song for children, catchy beat, fun tempo, energetic vocals, dance-pop style for kids'
    },
    'acoustic-folk': {
      name: 'アコースティック',
      prompt: 'An acoustic folk song for children, gentle guitar, warm melody, soft vocals, natural and organic sound, Japanese folk style'
    }
  }
  
  const selectedStyle = styleDescriptions[style]
  window.selectedMusicStyle = selectedStyle.prompt
  
  demoArea.innerHTML = `
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      <p class="mt-2 text-sm text-gray-600">「${selectedStyle.name}」で学習ソングを生成中...</p>
    </div>
  `
  
  try {
    const response = await axios.post('/api/media/generate-music', {
      lyrics: '小数のかけ算の歌',
      style: selectedStyle.name
    })
    
    if (response.data.success) {
      demoArea.innerHTML = `
        <div class="bg-white p-4 rounded-lg border-2 border-orange-300">
          <h4 class="font-bold text-orange-800 mb-3">🎵 ${selectedStyle.name}の学習ソング</h4>
          <div class="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg mb-3 border-2 border-yellow-300">
            <div class="text-center mb-4">
              <i class="fas fa-music text-6xl text-orange-600 mb-3" id="music-icon"></i>
              <p class="text-lg font-bold text-orange-900 mb-4">🎤 小数のかけ算のうた</p>
              <p class="text-sm text-gray-600 bg-white px-3 py-1 rounded-full inline-block">曲調: ${selectedStyle.name}</p>
            </div>
            <div class="bg-white p-4 rounded border-2 border-orange-200 mb-4">
              <pre id="lyrics-content" class="text-sm text-gray-700 whitespace-pre-wrap font-sans text-center leading-relaxed">${response.data.lyrics}</pre>
            </div>
            
            <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-3">
              <p class="text-sm font-bold text-blue-900 mb-2">
                <i class="fas fa-info-circle mr-2"></i>実際のAI音楽生成について
              </p>
              <p class="text-sm text-gray-700 mb-2">
                本番システムでは、<strong>AIML API</strong>（Suno相当）などの最新AI音楽生成サービスを使用します。
              </p>
              <ul class="text-xs text-gray-600 space-y-1 ml-4">
                <li>✅ 歌詞からメロディーとボーカルを自動生成</li>
                <li>✅ 選んだ曲調で音楽を生成</li>
                <li>✅ 約30秒〜2分の学習ソング</li>
                <li>✅ 覚えやすいリズムとフレーズ</li>
                <li>💰 料金: 約$0.015-0.02 per call</li>
              </ul>
            </div>
            
            <div class="text-center">
              <button onclick="playMusicDemo()" id="play-music-button"
                      class="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-full font-bold text-lg transition transform hover:scale-105 shadow-lg">
                <i class="fas fa-play mr-2"></i>デモ音を再生
              </button>
              <button onclick="stopMusicDemo()" id="stop-music-button" style="display:none;"
                      class="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold text-lg transition transform hover:scale-105 shadow-lg ml-2">
                <i class="fas fa-stop mr-2"></i>停止
              </button>
              <div class="mt-3">
                <button onclick="generateRealSunoMusicWithStyle()" 
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold transition shadow-lg">
                  <i class="fas fa-magic mr-2"></i>🎤 「${selectedStyle.name}」でAI音楽生成
                </button>
              </div>
              <div class="mt-2">
                <button onclick="generateMusicDemo()" 
                        class="text-sm text-gray-600 hover:text-gray-800 underline">
                  <i class="fas fa-redo mr-1"></i>曲調を変更する
                </button>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-600 bg-orange-50 p-3 rounded">${response.data.note}</p>
          <p class="text-xs text-gray-500 mt-2">
            💡 「デモ音を再生」は簡易メロディーです。実際のシステムではAIが完全な楽曲を生成します
          </p>
        </div>
      `
      
      window.musicLyrics = response.data.lyrics
    }
  } catch (error) {
    console.error('音楽生成エラー:', error)
    demoArea.innerHTML = `<p class="text-red-600">生成エラーが発生しました</p>`
  }
}

// 音楽再生機能（Web Audio APIでシンプルなメロディー生成）
let audioContext = null
let musicPlaying = false

function playMusicDemo() {
  if (musicPlaying) return
  
  musicPlaying = true
  document.getElementById('play-music-button').style.display = 'none'
  document.getElementById('stop-music-button').style.display = 'inline-block'
  document.getElementById('music-icon').classList.add('animate-bounce')
  
  // AudioContext初期化
  audioContext = new (window.AudioContext || window.webkitAudioContext)()
  
  // シンプルなメロディーを再生
  const notes = [
    { freq: 523.25, duration: 0.5 }, // C5
    { freq: 587.33, duration: 0.5 }, // D5
    { freq: 659.25, duration: 0.5 }, // E5
    { freq: 698.46, duration: 0.5 }, // F5
    { freq: 783.99, duration: 0.5 }, // G5
    { freq: 783.99, duration: 0.5 }, // G5
    { freq: 659.25, duration: 0.5 }, // E5
    { freq: 523.25, duration: 1.0 }, // C5
  ]
  
  let currentTime = audioContext.currentTime
  
  notes.forEach(note => {
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = note.freq
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0, currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01)
    gainNode.gain.linearRampToValueAtTime(0, currentTime + note.duration)
    
    oscillator.start(currentTime)
    oscillator.stop(currentTime + note.duration)
    
    currentTime += note.duration
  })
  
  // 再生終了後の処理
  setTimeout(() => {
    if (musicPlaying) {
      stopMusicDemo()
    }
  }, currentTime * 1000)
}

function stopMusicDemo() {
  musicPlaying = false
  
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
  
  if (document.getElementById('play-music-button')) {
    document.getElementById('play-music-button').style.display = 'inline-block'
  }
  if (document.getElementById('stop-music-button')) {
    document.getElementById('stop-music-button').style.display = 'none'
  }
  
  const icon = document.getElementById('music-icon')
  if (icon) {
    icon.classList.remove('animate-bounce')
  }
}

async function generateKinestheticDemo() {
  const demoArea = document.getElementById('kinesthetic-demo-area')
  if (!demoArea) return
  
  demoArea.innerHTML = `
    <div class="text-center py-4">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      <p class="mt-2 text-sm text-gray-600">AIが体験型教材を生成中...</p>
    </div>
  `
  
  try {
    const response = await axios.post('/api/media/generate-interactive', {
      topic: '小数のかけ算 0.3 × 4',
      interactionType: 'simulation'
    })
    
    if (response.data.success) {
      demoArea.innerHTML = `
        <div class="bg-white p-4 rounded-lg border-2 border-purple-300">
          <h4 class="font-bold text-purple-800 mb-3">🎮 AIが生成したインタラクティブ教材</h4>
          ${response.data.interactiveHtml}
          <p class="text-sm text-gray-600 bg-purple-50 p-3 rounded mt-3">${response.data.note}</p>
        </div>
      `
      
      // インタラクティブシミュレーターの初期化
      initializeSimulator()
    }
  } catch (error) {
    console.error('インタラクティブ教材生成エラー:', error)
    demoArea.innerHTML = `<p class="text-red-600">生成エラーが発生しました</p>`
  }
}

// シミュレーター用のグローバル変数と関数
let simFilledCount = 0
let simFilledContainers = []

function initializeSimulator() {
  simFilledCount = 0
  simFilledContainers = []
}

window.fillSimContainer = function(num) {
  if (simFilledContainers.includes(num)) return
  
  const container = document.getElementById('sim-container-' + num)
  if (!container) return
  
  const amountDisplay = container.querySelector('.filled-amount')
  
  amountDisplay.style.display = 'block'
  container.style.backgroundColor = '#8B5CF6'
  container.style.transform = 'scale(1.1)'
  setTimeout(() => { container.style.transform = 'scale(1)' }, 200)
  
  simFilledCount++
  simFilledContainers.push(num)
  
  const total = (simFilledCount * 0.3).toFixed(1)
  const totalElement = document.getElementById('sim-total-amount')
  if (totalElement) {
    totalElement.textContent = total
  }
  
  // 計算式を更新
  const calculation = '0.3 × ' + simFilledCount + ' = ' + total
  const calcElement = document.getElementById('sim-calculation-display')
  if (calcElement) {
    calcElement.textContent = calculation
  }
  
  if (simFilledCount === 4) {
    setTimeout(() => {
      if (calcElement) {
        calcElement.textContent = '✅ 正解！ 0.3 × 4 = 1.2 です！'
        calcElement.style.color = '#166534'
        calcElement.style.fontWeight = 'bold'
      }
    }, 500)
  }
}

window.generateVisualDemo = generateVisualDemo
window.generateVideoDemo = generateVideoDemo
window.generateAudioDemo = generateAudioDemo
window.generateMusicDemo = generateMusicDemo
window.generateKinestheticDemo = generateKinestheticDemo

// Suno相当のAI音楽を生成（AIML API経由）
async function generateRealSunoMusic() {
  const demoArea = document.getElementById('auditory-demo-area')
  if (!demoArea) return
  
  demoArea.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mb-4"></div>
      <p class="text-lg font-bold text-purple-800">🎤 AIが実際の曲を生成中...</p>
      <p class="text-sm text-gray-600 mt-2">AIが歌詞をもとに、メロディーとボーカルを生成しています...</p>
      <p class="text-xs text-gray-500 mt-1">この処理には30秒〜1分程度かかります</p>
    </div>
  `
  
  try {
    const response = await axios.post('/api/media/generate-suno-music', {
      lyrics: window.musicLyrics || '小数のかけ算の歌',
      style: 'educational pop japanese children'
    })
    
    if (response.data.success) {
      demoArea.innerHTML = `
        <div class="bg-white p-4 rounded-lg border-2 border-purple-300">
          <h4 class="font-bold text-purple-800 mb-3">🎤 AIが生成した学習ソング</h4>
          <div class="mb-4">
            <audio controls class="w-full">
              <source src="${response.data.musicUrl}" type="audio/mpeg">
            </audio>
          </div>
          <div class="bg-purple-50 p-4 rounded mb-3">
            <h5 class="font-bold text-sm mb-2">歌詞:</h5>
            <pre class="text-sm whitespace-pre-wrap">${response.data.lyrics}</pre>
          </div>
          <p class="text-sm text-gray-600 bg-purple-50 p-3 rounded">${response.data.note}</p>
        </div>
      `
    } else {
      // APIキーが未設定の場合
      demoArea.innerHTML = `
        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-400">
          <h4 class="font-bold text-yellow-800 mb-3">
            <i class="fas fa-key mr-2"></i>AI音楽生成APIキーが必要です
          </h4>
          <div class="bg-white p-4 rounded mb-3 text-left">
            <h5 class="font-bold text-sm mb-2">💡 推奨サービス：AIML API</h5>
            <ul class="text-sm text-gray-700 space-y-2 mb-3">
              <li>✅ Suno相当の高品質AI音楽生成</li>
              <li>✅ 無料トライアルあり</li>
              <li>✅ 約$0.015-0.02 per call</li>
              <li>✅ 簡単な統合</li>
            </ul>
            <h5 class="font-bold text-sm mb-2">設定方法：</h5>
            <pre class="text-xs bg-gray-100 p-3 rounded overflow-x-auto">${response.data.instructions}</pre>
          </div>
          <p class="text-sm text-gray-700">
            <strong>現在はデモ音のみ利用可能です。</strong><br>
            AIML APIキーを設定すると、実際のAI生成音楽が再生できます。
          </p>
          <div class="mt-3">
            <a href="https://aimlapi.com" target="_blank" 
               class="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold">
              AIML APIを始める →
            </a>
          </div>
        </div>
      `
    }
  } catch (error) {
    console.error('AI音楽生成エラー:', error)
    demoArea.innerHTML = `
      <div class="bg-red-50 p-6 rounded-lg border-2 border-red-400">
        <h4 class="font-bold text-red-800 mb-3">
          <i class="fas fa-exclamation-triangle mr-2"></i>エラーが発生しました
        </h4>
        <p class="text-sm text-gray-700 mb-3">${error.message}</p>
        <p class="text-sm text-gray-600">
          <strong>現在はデモ音のみ利用可能です。</strong><br>
          AIML APIキーを設定すると、実際のAI生成音楽が利用できます。
        </p>
        <div class="mt-3">
          <a href="https://aimlapi.com/suno-ai-api" target="_blank" 
             class="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold">
            AIML API ドキュメント →
          </a>
        </div>
      </div>
    `
  }
}

window.generateRealSunoMusic = generateRealSunoMusic

// 選択した曲調でAI音楽を生成
async function generateRealSunoMusicWithStyle() {
  const demoArea = document.getElementById('auditory-demo-area')
  if (!demoArea) return
  
  const musicStyle = window.selectedMusicStyle || 'A cheerful educational pop song for children'
  
  demoArea.innerHTML = `
    <div class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mb-4"></div>
      <p class="text-lg font-bold text-purple-800">🎤 AIが実際の曲を生成中...</p>
      <p class="text-sm text-gray-600 mt-2">選んだ曲調で、メロディーとボーカルを生成しています...</p>
      <p class="text-xs text-gray-500 mt-1">この処理には30秒〜1分程度かかります</p>
    </div>
  `
  
  try {
    const response = await axios.post('/api/media/generate-suno-music', {
      lyrics: window.musicLyrics || '小数のかけ算の歌',
      style: musicStyle
    })
    
    if (response.data.success) {
      demoArea.innerHTML = `
        <div class="bg-white p-4 rounded-lg border-2 border-purple-300">
          <h4 class="font-bold text-purple-800 mb-3">🎤 AIが生成した学習ソング</h4>
          <div class="mb-4">
            <audio controls class="w-full">
              <source src="${response.data.musicUrl}" type="audio/mpeg">
            </audio>
          </div>
          <div class="bg-purple-50 p-4 rounded mb-3">
            <h5 class="font-bold text-sm mb-2">歌詞:</h5>
            <pre class="text-sm whitespace-pre-wrap">${response.data.lyrics}</pre>
          </div>
          <p class="text-sm text-gray-600 bg-purple-50 p-3 rounded">${response.data.note}</p>
          <div class="mt-3 text-center">
            <button onclick="generateMusicDemo()" 
                    class="text-sm text-gray-600 hover:text-gray-800 underline">
              <i class="fas fa-redo mr-1"></i>曲調を変更して再生成
            </button>
          </div>
        </div>
      `
    } else {
      // APIキーが未設定の場合
      demoArea.innerHTML = `
        <div class="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-400">
          <h4 class="font-bold text-yellow-800 mb-3">
            <i class="fas fa-key mr-2"></i>AI音楽生成APIキーが必要です
          </h4>
          <div class="bg-white p-4 rounded mb-3 text-left">
            <h5 class="font-bold text-sm mb-2">💡 推奨サービス：AIML API</h5>
            <ul class="text-sm text-gray-700 space-y-2 mb-3">
              <li>✅ Suno相当の高品質AI音楽生成</li>
              <li>✅ 無料トライアルあり</li>
              <li>✅ 約$0.015-0.02 per call</li>
              <li>✅ 簡単な統合</li>
            </ul>
            <h5 class="font-bold text-sm mb-2">設定方法：</h5>
            <pre class="text-xs bg-gray-100 p-3 rounded overflow-x-auto">${response.data.instructions}</pre>
          </div>
          <p class="text-sm text-gray-700">
            <strong>現在はデモ音のみ利用可能です。</strong><br>
            AIML APIキーを設定すると、実際のAI生成音楽が再生できます。
          </p>
          <div class="mt-3">
            <a href="https://aimlapi.com" target="_blank" 
               class="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold">
              AIML APIを始める →
            </a>
          </div>
        </div>
      `
    }
  } catch (error) {
    console.error('AI音楽生成エラー:', error)
    demoArea.innerHTML = `
      <div class="bg-red-50 p-6 rounded-lg border-2 border-red-400">
        <h4 class="font-bold text-red-800 mb-3">
          <i class="fas fa-exclamation-triangle mr-2"></i>エラーが発生しました
        </h4>
        <p class="text-sm text-gray-700 mb-3">${error.message}</p>
        <p class="text-sm text-gray-600">
          <strong>現在はデモ音のみ利用可能です。</strong><br>
          AIML APIキーを設定すると、実際のAI生成音楽が利用できます。
        </p>
        <div class="mt-3">
          <a href="https://aimlapi.com/suno-ai-api" target="_blank" 
             class="inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold">
            AIML API ドキュメント →
          </a>
        </div>
      </div>
    `
  }
}

window.generateRealSunoMusicWithStyle = generateRealSunoMusicWithStyle

// =============================================================================
// 児童向けクラス進捗確認 & 友達助け合い機能
// =============================================================================

// クラス進捗確認ページ（児童用シンプル版）
async function showClassProgress() {
  state.currentView = 'class-progress'
  
  try {
    showLoading('クラスのみんなの進捗を確認中...')
    
    // クラス進捗データ取得
    const response = await axios.get(`/api/progress/class-peer/${state.student.classCode}/${state.selectedCurriculum.id}`)
    const { peers } = response.data
    
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8 max-w-6xl">
        <!-- ヘッダー -->
        <div class="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg shadow-xl p-8 mb-8">
          <button onclick="loadGuidePage(${state.selectedCurriculum.id})" 
                  class="text-white hover:text-gray-200 mb-4 inline-flex items-center">
            <i class="fas fa-arrow-left mr-2"></i>学習のてびきに戻る
          </button>
          <h1 class="text-4xl font-bold mb-3">
            <i class="fas fa-users mr-3"></i>クラスのみんなの進捗
          </h1>
          <p class="text-xl opacity-90">
            ${state.selectedCurriculum.unit_name}
          </p>
        </div>
        
        <!-- 説明 -->
        <div class="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 mb-8">
          <h3 class="text-xl font-bold text-blue-800 mb-3">
            <i class="fas fa-info-circle mr-2"></i>友達に助けを求めよう！
          </h3>
          <p class="text-gray-700 mb-2">
            たくさん問題をクリアしている友達は、<strong class="text-green-600">「助けられます」</strong>マークがついています。
          </p>
          <p class="text-gray-700">
            困ったときは、その友達に助けを求めてみましょう！
          </p>
        </div>
        
        <!-- クラスメイト一覧 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${peers.map(peer => `
            <div class="bg-white rounded-lg shadow-lg p-6 border-2 ${
              peer.id === state.student.id ? 'border-purple-400 bg-purple-50' : 
              peer.can_help ? 'border-green-400' : 'border-gray-300'
            }">
              <!-- 名前と出席番号 -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="w-12 h-12 rounded-full ${
                    peer.id === state.student.id ? 'bg-purple-400' :
                    peer.can_help ? 'bg-green-400' : 'bg-gray-400'
                  } flex items-center justify-center text-white font-bold text-lg mr-3">
                    ${peer.student_number}
                  </div>
                  <div>
                    <h3 class="text-xl font-bold text-gray-800">
                      ${peer.name}
                      ${peer.id === state.student.id ? '<span class="text-sm text-purple-600">(自分)</span>' : ''}
                    </h3>
                  </div>
                </div>
              </div>
              
              <!-- 進捗情報 -->
              <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-gray-600">完了カード</span>
                  <span class="text-2xl font-bold text-indigo-600">${peer.completed_cards}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3">
                  <div class="bg-gradient-to-r from-indigo-400 to-purple-400 h-3 rounded-full" 
                       style="width: ${Math.min((peer.completed_cards / 18) * 100, 100)}%"></div>
                </div>
              </div>
              
              <!-- ステータス -->
              ${peer.can_help ? `
                <div class="bg-green-50 border-2 border-green-300 rounded-lg p-3 text-center mb-3">
                  <p class="text-green-700 font-bold">
                    <i class="fas fa-hand-holding-heart mr-2"></i>助けられます！
                  </p>
                </div>
              ` : peer.completed_cards > 0 ? `
                <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 text-center mb-3">
                  <p class="text-yellow-700 text-sm">
                    <i class="fas fa-running mr-2"></i>がんばり中
                  </p>
                </div>
              ` : `
                <div class="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 text-center mb-3">
                  <p class="text-gray-600 text-sm">
                    <i class="fas fa-clock mr-2"></i>これから
                  </p>
                </div>
              `}
              
              <!-- アクションボタン -->
              ${peer.can_help && peer.id !== state.student.id ? `
                <button onclick="requestPeerHelp('${peer.id}', '${peer.name}')" 
                        class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition">
                  <i class="fas fa-comments mr-2"></i>助けを求める
                </button>
              ` : peer.id === state.student.id ? `
                <button onclick="checkHelpRequests()" 
                        class="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition">
                  <i class="fas fa-bell mr-2"></i>ヘルプ要請を確認
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `
    
    hideLoading()
  } catch (error) {
    console.error('クラス進捗取得エラー:', error)
    hideLoading()
    alert('クラス進捗の読み込みに失敗しました')
  }
}

// 友達に助けを求める
async function requestPeerHelp(helperId, helperName) {
  // 助けられる友達リストを取得
  try {
    const response = await axios.get(
      `/api/help/available-helpers/${state.student.classCode}/${state.selectedCurriculum.id}/${state.selectedCard}`
    )
    const { helpers } = response.data
    
    if (helpers.length === 0) {
      alert(`${helperName}さんはまだこの問題をクリアしていないようです。\n別の友達に聞いてみましょう！`)
      return
    }
    
    // モーダルを表示
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8">
        <h2 class="text-3xl font-bold text-green-600 mb-6">
          <i class="fas fa-user-friends mr-3"></i>${helperName}さんに助けを求める
        </h2>
        
        <div class="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6">
          <p class="text-gray-700 mb-3">
            ${helperName}さんは、この問題をすでにクリアしています！
          </p>
          <p class="text-gray-700 font-bold">
            どんなことを聞きたいですか？
          </p>
        </div>
        
        <textarea id="helpMessage" 
                  class="w-full border-2 border-gray-300 rounded-lg p-4 mb-6 text-lg" 
                  rows="4" 
                  placeholder="例：この問題のやり方を教えてください"></textarea>
        
        <div class="flex gap-4">
          <button onclick="this.closest('.fixed').remove()" 
                  class="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg">
            キャンセル
          </button>
          <button onclick="sendPeerHelpRequest('${helperId}', '${helperName}')" 
                  class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg">
            <i class="fas fa-paper-plane mr-2"></i>送信する
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('ヘルパー検索エラー:', error)
    alert('エラーが発生しました')
  }
}

// ヘルプ要請を送信
async function sendPeerHelpRequest(helperId, helperName) {
  const message = document.getElementById('helpMessage').value.trim()
  
  if (!message) {
    alert('メッセージを入力してください')
    return
  }
  
  try {
    showLoading('ヘルプ要請を送信中...')
    
    await axios.post('/api/help/request-peer', {
      requester_id: state.student.id,
      helper_id: helperId,
      curriculum_id: state.selectedCurriculum.id,
      learning_card_id: state.selectedCard,
      message: message
    })
    
    hideLoading()
    
    // モーダルを閉じる
    document.querySelectorAll('.fixed.inset-0').forEach(modal => modal.remove())
    
    // 成功メッセージ
    alert(`${helperName}さんにヘルプ要請を送りました！\n\n${helperName}さんが見てくれるまで、もう少し待ってみましょう。`)
  } catch (error) {
    console.error('ヘルプ要請送信エラー:', error)
    hideLoading()
    alert('ヘルプ要請の送信に失敗しました')
  }
}

// 自分宛のヘルプ要請を確認
async function checkHelpRequests() {
  try {
    showLoading('ヘルプ要請を確認中...')
    
    const response = await axios.get(`/api/help/requests-for-me/${state.student.id}`)
    const { requests } = response.data
    
    hideLoading()
    
    if (requests.length === 0) {
      alert('現在、あなた宛のヘルプ要請はありません。')
      return
    }
    
    // モーダルを表示
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-auto p-8">
        <h2 class="text-3xl font-bold text-purple-600 mb-6">
          <i class="fas fa-bell mr-3"></i>あなた宛のヘルプ要請 (${requests.length}件)
        </h2>
        
        <div class="space-y-4">
          ${requests.map(req => `
            <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-xl font-bold text-gray-800">
                  <i class="fas fa-user-circle mr-2"></i>${req.requester_name}さん
                </h3>
                <span class="text-sm text-gray-600">${new Date(req.created_at).toLocaleString('ja-JP')}</span>
              </div>
              
              <div class="bg-white rounded p-4 mb-4">
                <p class="text-sm text-gray-600 mb-2">
                  <strong>単元：</strong>${req.unit_name}
                </p>
                <p class="text-sm text-gray-600 mb-2">
                  <strong>カード：</strong>${req.card_title}
                </p>
                <p class="text-gray-700 font-bold">
                  <i class="fas fa-comment mr-2"></i>${req.message}
                </p>
              </div>
              
              <div class="flex gap-3">
                <button onclick="respondToPeerHelp(${req.id}, 'accepted', '${req.requester_name}')" 
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                  <i class="fas fa-check mr-2"></i>助けに行く
                </button>
                <button onclick="respondToPeerHelp(${req.id}, 'declined', '${req.requester_name}')" 
                        class="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">
                  <i class="fas fa-times mr-2"></i>今は無理
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="mt-6">
          <button onclick="this.closest('.fixed').remove()" 
                  class="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg">
            閉じる
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  } catch (error) {
    console.error('ヘルプ要請確認エラー:', error)
    hideLoading()
    alert('ヘルプ要請の確認に失敗しました')
  }
}

// ヘルプ要請に応答
async function respondToPeerHelp(requestId, response, requesterName) {
  try {
    await axios.post('/api/help/respond-peer', {
      request_id: requestId,
      response: response
    })
    
    if (response === 'accepted') {
      alert(`${requesterName}さんを助けに行きます！\n\n実際の教室では、${requesterName}さんの席に行って教えてあげましょう。`)
    } else {
      alert(`${requesterName}さんに「今は無理」と伝えました。`)
    }
    
    // モーダルを閉じる
    document.querySelectorAll('.fixed.inset-0').forEach(modal => modal.remove())
  } catch (error) {
    console.error('応答送信エラー:', error)
    alert('応答の送信に失敗しました')
  }
}

// グローバルスコープに登録
window.showClassProgress = showClassProgress
window.requestPeerHelp = requestPeerHelp
window.sendPeerHelpRequest = sendPeerHelpRequest
window.checkHelpRequests = checkHelpRequests
window.respondToPeerHelp = respondToPeerHelp


console.log('✅ Phase 17-19: 深層学習・マルチモーダル・大規模展開 機能読み込み完了')


