// グローバル状態管理
const state = {
  currentView: 'top', // 'top', 'guide', 'card', 'progress'
  selectedCurriculum: null,
  selectedCourse: null,
  selectedCard: null,
  student: {
    id: 1, // デモ用
    name: '山田太郎',
    classCode: 'CLASS2024A'
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
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
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 class="text-4xl font-bold text-indigo-600 mb-2">
          <i class="fas fa-graduation-cap mr-3"></i>
          自由進度学習支援システム
        </h1>
        <p class="text-gray-600">学びのハンドルは、あなたの手の中に</p>
      </div>

      <!-- ユーザー情報 -->
      <div class="bg-white rounded-lg shadow p-4 mb-6">
        <div class="flex items-center">
          <i class="fas fa-user-circle text-3xl text-indigo-500 mr-3"></i>
          <div>
            <p class="text-sm text-gray-500">ログイン中</p>
            <p class="font-bold text-lg">${state.student.name}</p>
          </div>
        </div>
      </div>

      <!-- 学習選択カード -->
      <div class="bg-white rounded-lg shadow-lg p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-book-open mr-2"></i>
          学習する単元を選びましょう
        </h2>

        <!-- 選択フォーム -->
        <div class="space-y-6">
          <!-- 学年選択 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-layer-group mr-2"></i>学年
            </label>
            <select id="gradeSelect" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none">
              <option value="">選択してください</option>
            </select>
          </div>

          <!-- 教科選択 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-calculator mr-2"></i>教科
            </label>
            <select id="subjectSelect" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none">
              <option value="">選択してください</option>
            </select>
          </div>

          <!-- 教科書会社選択 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-building mr-2"></i>教科書会社
            </label>
            <select id="textbookSelect" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none">
              <option value="">選択してください</option>
            </select>
          </div>

          <!-- 単元選択 -->
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">
              <i class="fas fa-list mr-2"></i>単元
            </label>
            <select id="unitSelect" class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none">
              <option value="">選択してください</option>
            </select>
          </div>

          <!-- 開始ボタン -->
          <button 
            id="startButton" 
            disabled
            class="w-full bg-indigo-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed">
            <i class="fas fa-rocket mr-2"></i>
            学習を始める
          </button>
        </div>
      </div>

      <!-- 学習履歴（今後実装） -->
      <div class="bg-white rounded-lg shadow p-6 mt-6">
        <h3 class="text-lg font-bold text-gray-800 mb-3">
          <i class="fas fa-history mr-2"></i>最近の学習
        </h3>
        <p class="text-gray-500 text-sm">学習履歴がここに表示されます</p>
      </div>
    </div>
  `

  // データ読み込みとイベント設定
  await loadTopPageData()
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

      curricula.forEach(item => {
        const option = document.createElement('option')
        option.value = item.id
        option.textContent = `${item.unit_order}. ${item.unit_name}`
        unitSelect.appendChild(option)
      })
    } catch (error) {
      console.error('単元リスト読み込みエラー:', error)
    }
  }

  // 単元選択時にボタン有効化
  unitSelect.addEventListener('change', () => {
    startButton.disabled = !unitSelect.value
  })
}

// ============================================
// 学習のてびきページ
// ============================================
async function loadGuidePage(curriculumId) {
  state.currentView = 'guide'
  
  try {
    const response = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum, courses, optionalProblems } = response.data
    
    state.selectedCurriculum = curriculum

    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <!-- ヘッダー -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button onclick="renderTopPage()" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>トップページに戻る
          </button>
          <h1 class="text-3xl font-bold text-indigo-600 mb-2">
            学習のてびき
          </h1>
          <p class="text-xl font-bold text-gray-800">
            ${curriculum.grade}年 ${curriculum.subject} - ${curriculum.unit_name}
          </p>
        </div>

        <!-- 学習情報入力 -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">学年</label>
              <input type="text" value="${curriculum.grade}年" readonly class="w-full p-2 bg-gray-100 rounded">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">組</label>
              <input type="text" value="1組" readonly class="w-full p-2 bg-gray-100 rounded">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">名前</label>
              <input type="text" value="${state.student.name}" readonly class="w-full p-2 bg-gray-100 rounded">
            </div>
          </div>
        </div>

        <!-- ツールバー -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button onclick="loadLearningPlan(${curriculum.id})" 
                  class="bg-green-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center">
            <i class="fas fa-calendar-alt mr-2"></i>
            学習計画表
          </button>
          <button onclick="loadAnswersTab(${curriculum.id})" 
                  class="bg-blue-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center">
            <i class="fas fa-book-open mr-2"></i>
            解答を見る
          </button>
          <button onclick="loadProgressBoard(${curriculum.id})" 
                  class="bg-purple-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center">
            <i class="fas fa-chart-bar mr-2"></i>
            進捗ボード
          </button>
        </div>

        <!-- 教師用ツールバー -->
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-4 mb-6">
          <h3 class="text-white font-bold mb-3 flex items-center">
            <i class="fas fa-chalkboard-teacher mr-2"></i>
            教師用ツール（Phase 5）
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onclick="toggleTeacherMode()" 
                    class="bg-white text-indigo-600 py-3 px-4 rounded-lg font-bold hover:bg-indigo-50 transition flex items-center justify-center">
              <i class="fas fa-user-cog mr-2"></i>
              先生モード切替
            </button>
            <button onclick="loadEvaluationPage(${curriculum.id})" 
                    class="bg-white text-purple-600 py-3 px-4 rounded-lg font-bold hover:bg-purple-50 transition flex items-center justify-center">
              <i class="fas fa-clipboard-check mr-2"></i>
              指導・評価
            </button>
            <button onclick="loadEnvironmentDesignPage(${curriculum.id})" 
                    class="bg-white text-pink-600 py-3 px-4 rounded-lg font-bold hover:bg-pink-50 transition flex items-center justify-center">
              <i class="fas fa-palette mr-2"></i>
              学習環境デザイン
            </button>
          </div>
        </div>

        <!-- 単元の目標 -->
        <div class="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6 mb-6">
          <h2 class="text-xl font-bold text-blue-800 mb-3">
            <i class="fas fa-bullseye mr-2"></i>単元の目標
          </h2>
          <p class="text-gray-800 leading-relaxed">${curriculum.unit_goal}</p>
        </div>

        <!-- 非認知能力の目標 -->
        <div class="bg-green-50 border-l-4 border-green-500 rounded-lg p-6 mb-6">
          <h2 class="text-xl font-bold text-green-800 mb-3">
            <i class="fas fa-heart mr-2"></i>心の成長目標
          </h2>
          <p class="text-gray-800 leading-relaxed">${curriculum.non_cognitive_goal}</p>
        </div>

        <!-- 単元時数 -->
        <div class="bg-white rounded-lg shadow p-4 mb-6">
          <p class="text-gray-700">
            <i class="fas fa-clock mr-2"></i>
            <strong>授業時間：</strong> 全${curriculum.total_hours}時間
          </p>
        </div>

        <!-- コース選択問題 -->
        <div class="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            <i class="fas fa-route mr-2"></i>
            あなたに合った学習コースを選びましょう
          </h2>
          <p class="text-gray-600 mb-6">
            次の3つの問題を見て、自分に合ったコースを1つ選んでください。<br>
            どのコースを選んでも、この単元で大切なことが学べます！
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            ${courses.map((course, index) => `
              <div class="border-4 border-gray-200 rounded-lg p-6 hover:border-indigo-500 transition cursor-pointer" 
                   onclick="selectCourse(${course.id})">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-xl font-bold text-gray-800">
                    ${course.course_display_name}
                  </h3>
                  <div class="w-12 h-12 rounded-full ${
                    index === 0 ? 'bg-green-100 text-green-600' :
                    index === 1 ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-100 text-purple-600'
                  } flex items-center justify-center font-bold text-xl">
                    ${index + 1}
                  </div>
                </div>
                <div class="bg-gray-50 rounded p-4 mb-4">
                  <p class="font-bold text-gray-700 mb-2">${course.selection_question_title}</p>
                  <pre class="text-sm text-gray-800 whitespace-pre-wrap font-sans">${course.selection_question_content}</pre>
                </div>
                <button class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-bold hover:bg-indigo-700 transition">
                  このコースで学習する
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- チェックテスト説明 -->
        <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-6 mb-6">
          <h2 class="text-xl font-bold text-yellow-800 mb-3">
            <i class="fas fa-check-circle mr-2"></i>チェックテスト
          </h2>
          <p class="text-gray-800">
            学習カードを終えたら、チェックテストに挑戦しましょう。<br>
            チェックテストに合格すると、さらに楽しい選択問題に進めます！
          </p>
        </div>

        <!-- 選択問題（発展学習）一覧 -->
        <div class="bg-white rounded-lg shadow-lg p-8">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">
            <i class="fas fa-star mr-2 text-yellow-500"></i>
            選択問題（やってみたい問題を選ぼう！）
          </h2>
          <p class="text-gray-600 mb-6">
            チェックテスト合格後に、好きな問題に挑戦できます。全部やってもいいし、興味のあるものだけでもOK！
          </p>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${optionalProblems.map((problem, index) => `
              <div class="border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                <div class="flex items-start mb-3">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold mr-3 flex-shrink-0">
                    ${problem.problem_number}
                  </div>
                  <h3 class="text-lg font-bold text-gray-800">${problem.problem_title}</h3>
                </div>
                <p class="text-gray-600 text-sm mb-4">${problem.problem_description}</p>
                <div class="flex items-center text-sm text-gray-500">
                  <i class="fas fa-tag mr-2"></i>
                  <span>${getCategoryLabel(problem.problem_category)}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
  } catch (error) {
    console.error('学習のてびき読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
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
      </div>
    `
  } catch (error) {
    console.error('コース読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
  }
}

// グローバルスコープに関数を登録
window.renderTopPage = renderTopPage
window.loadGuidePage = loadGuidePage
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
            <div class="text-right">
              <div class="inline-block px-4 py-2 rounded-lg ${
                card.difficulty_level === 'minimum' ? 'bg-green-100 text-green-700' :
                card.difficulty_level === 'standard' ? 'bg-blue-100 text-blue-700' :
                'bg-purple-100 text-purple-700'
              }">
                <i class="fas fa-signal mr-2"></i>
                ${card.difficulty_level === 'minimum' ? '基本' : card.difficulty_level === 'standard' ? '標準' : '発展'}
              </div>
            </div>
          </div>
        </div>

        <!-- 助けを求めるボタン（右上固定） -->
        <div class="fixed top-20 right-4 z-50 space-y-2">
          <button onclick="showHelpMenu()" 
                  class="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition flex items-center justify-center">
            <i class="fas fa-hand-paper text-2xl"></i>
          </button>
        </div>

        <!-- ヘルプメニュー（モーダル） -->
        <div id="helpMenu" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 class="text-2xl font-bold text-gray-800 mb-6">
              <i class="fas fa-question-circle mr-2 text-indigo-600"></i>
              助けを求める
            </h3>
            <div class="space-y-4">
              <button onclick="showHints(); closeHelpMenu()" 
                      class="w-full bg-yellow-500 text-white py-4 px-6 rounded-lg font-bold hover:bg-yellow-600 transition flex items-center justify-center">
                <i class="fas fa-lightbulb mr-3 text-xl"></i>
                ヒントカード
              </button>
              <button onclick="showAITeacher(); closeHelpMenu()" 
                      class="w-full bg-blue-500 text-white py-4 px-6 rounded-lg font-bold hover:bg-blue-600 transition flex items-center justify-center">
                <i class="fas fa-robot mr-3 text-xl"></i>
                AI先生に聞く
              </button>
              <button onclick="callTeacher(); closeHelpMenu()" 
                      class="w-full bg-green-500 text-white py-4 px-6 rounded-lg font-bold hover:bg-green-600 transition flex items-center justify-center">
                <i class="fas fa-chalkboard-teacher mr-3 text-xl"></i>
                先生を呼ぶ
              </button>
              <button onclick="askFriend(); closeHelpMenu()" 
                      class="w-full bg-purple-500 text-white py-4 px-6 rounded-lg font-bold hover:bg-purple-600 transition flex items-center justify-center">
                <i class="fas fa-user-friends mr-3 text-xl"></i>
                友達に聞く
              </button>
              <button onclick="closeHelpMenu()" 
                      class="w-full bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-bold hover:bg-gray-400 transition">
                閉じる
              </button>
            </div>
          </div>
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
            ${answer ? `
              <div id="answerSection" class="hidden bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
                <h3 class="text-lg font-bold text-green-800 mb-4">
                  <i class="fas fa-check-circle mr-2"></i>解答
                </h3>
                <div class="bg-white rounded-lg p-4 mb-4">
                  <pre class="text-gray-800 whitespace-pre-wrap font-sans">${answer.answer_content}</pre>
                </div>
                ${answer.explanation ? `
                  <div class="bg-white rounded-lg p-4">
                    <h4 class="font-bold text-gray-800 mb-2">
                      <i class="fas fa-info-circle mr-2"></i>解説
                    </h4>
                    <pre class="text-gray-800 whitespace-pre-wrap font-sans">${answer.explanation}</pre>
                  </div>
                ` : ''}
              </div>
            ` : ''}
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
    addAIMessage('こんにちは！AI先生です。何か質問はありますか？一緒に考えましょう！', 'ai')
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
  addAIMessage('考え中...', 'ai', true)
  
  try {
    // Gemini APIを呼び出す（バックエンド経由）
    const response = await axios.post('/api/ai/ask', {
      cardId: state.selectedCard,
      question: question,
      context: window.currentCardData.card.problem_content
    })
    
    // ローディングメッセージを削除
    const aiChat = document.getElementById('aiChat')
    const loadingMsg = aiChat.querySelector('.loading-message')
    if (loadingMsg) loadingMsg.remove()
    
    // AI の回答を追加
    addAIMessage(response.data.answer, 'ai')
    
  } catch (error) {
    console.error('AI質問エラー:', error)
    const aiChat = document.getElementById('aiChat')
    const loadingMsg = aiChat.querySelector('.loading-message')
    if (loadingMsg) loadingMsg.remove()
    addAIMessage('申し訳ありません。今は答えられません。先生やヒントカードを試してみてください。', 'ai')
  }
}

// AIチャットメッセージ追加
function addAIMessage(message, sender, isLoading = false) {
  const aiChat = document.getElementById('aiChat')
  const messageDiv = document.createElement('div')
  messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} ${isLoading ? 'loading-message' : ''}`
  
  messageDiv.innerHTML = `
    <div class="${sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'} rounded-lg p-3 max-w-[80%] shadow">
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
  
  alert('先生に助けを求めました。先生が来るまで他の問題に取り組んでもOKです。')
}

// 友達に聞く
function askFriend() {
  window.currentHelpType = 'friend'
  window.helpCount++
  
  alert('この学習カードをクリアした友達に聞いてみましょう！\n\n※実際のクラスでは、進捗ボードで誰ができているか確認できます。')
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
  const answerSection = document.getElementById('answerSection')
  if (answerSection) {
    answerSection.classList.toggle('hidden')
    if (!answerSection.classList.contains('hidden')) {
      answerSection.scrollIntoView({ behavior: 'smooth' })
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
            <div class="bg-gradient-to-r from-yellow-600 to-orange-500 p-6">
              <h2 class="text-2xl font-bold text-white">
                <i class="fas fa-star mr-2"></i>
                選択問題の解答
              </h2>
            </div>
            
            <div class="p-6 space-y-6">
              ${optionalAnswers.map(answer => `
                <div class="border-2 border-gray-200 rounded-lg p-6">
                  <h3 class="text-lg font-bold text-gray-800 mb-4">
                    <span class="inline-block w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold mr-3">
                      ${answer.problem_number}
                    </span>
                    ${answer.problem_title}
                  </h3>
                  
                  ${answer.answer_content ? `
                    <div class="bg-green-50 border-l-4 border-green-500 rounded p-4 mb-4">
                      <h4 class="font-bold text-green-800 mb-2">
                        <i class="fas fa-check-circle mr-2"></i>解答例
                      </h4>
                      <pre class="text-gray-800 whitespace-pre-wrap font-sans text-sm">${answer.answer_content}</pre>
                    </div>
                  ` : ''}
                  
                  ${answer.explanation ? `
                    <div class="bg-blue-50 border-l-4 border-blue-500 rounded p-4">
                      <h4 class="font-bold text-blue-800 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>解説・ポイント
                      </h4>
                      <pre class="text-gray-800 whitespace-pre-wrap font-sans text-sm">${answer.explanation}</pre>
                    </div>
                  ` : ''}
                  
                  ${!answer.answer_content && !answer.explanation ? `
                    <p class="text-gray-500 text-sm">選択問題は自由な取り組みです。正解は一つではありません。</p>
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
async function loadProgressBoard(curriculumId) {
  state.currentView = 'progress'
  
  try {
    // カリキュラム情報取得
    const currResponse = await axios.get(`/api/curriculum/${curriculumId}`)
    const { curriculum, courses } = currResponse.data
    
    // 進捗データ取得
    const progressResponse = await axios.get(`/api/progress/curriculum/${curriculumId}/class/${state.student.classCode}`)
    const studentProgress = progressResponse.data
    
    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="container mx-auto px-4 py-8">
        <!-- ヘッダー -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <button onclick="loadGuidePage(${curriculumId})" class="text-indigo-600 hover:text-indigo-800 mb-4">
            <i class="fas fa-arrow-left mr-2"></i>学習のてびきに戻る
          </button>
          <h1 class="text-3xl font-bold text-purple-600 mb-2">
            <i class="fas fa-chart-bar mr-2"></i>
            進捗ボード
          </h1>
          <p class="text-xl text-gray-800">
            ${curriculum.grade}年 ${curriculum.subject} - ${curriculum.unit_name}
          </p>
        </div>

        <!-- コース凡例 -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h3 class="text-lg font-bold text-gray-800 mb-4">
            <i class="fas fa-palette mr-2"></i>
            コースの色分け
          </h3>
          <div class="flex flex-wrap gap-4">
            <div class="flex items-center">
              <div class="w-6 h-6 bg-green-500 rounded mr-2"></div>
              <span class="font-bold">じっくりコース</span>
              <span class="text-sm text-gray-600 ml-2">(基礎)</span>
            </div>
            <div class="flex items-center">
              <div class="w-6 h-6 bg-blue-500 rounded mr-2"></div>
              <span class="font-bold">しっかりコース</span>
              <span class="text-sm text-gray-600 ml-2">(標準)</span>
            </div>
            <div class="flex items-center">
              <div class="w-6 h-6 bg-purple-500 rounded mr-2"></div>
              <span class="font-bold">ぐんぐんコース</span>
              <span class="text-sm text-gray-600 ml-2">(発展)</span>
            </div>
            <div class="flex items-center ml-8">
              <i class="fas fa-hand-paper text-orange-500 mr-2"></i>
              <span class="font-bold text-orange-600">助けを求めています</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-pause-circle text-red-500 mr-2"></i>
              <span class="font-bold text-red-600">停滞中（10分以上）</span>
            </div>
          </div>
        </div>

        <!-- 進捗グラフ -->
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 class="text-xl font-bold text-gray-800 mb-6">
            <i class="fas fa-users mr-2"></i>
            クラス全体の進捗状況
          </h3>
          
          <div class="space-y-4">
            ${generateProgressBars(studentProgress, courses.results)}
          </div>
        </div>

        <!-- 助け要請・停滞一覧 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 助け要請 -->
          <div class="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-6">
            <h3 class="text-lg font-bold text-orange-800 mb-4">
              <i class="fas fa-hand-paper mr-2"></i>
              助けを求めている児童
            </h3>
            <div class="space-y-3">
              ${generateHelpRequests(studentProgress)}
            </div>
          </div>

          <!-- 停滞中 -->
          <div class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
            <h3 class="text-lg font-bold text-red-800 mb-4">
              <i class="fas fa-pause-circle mr-2"></i>
              停滞している児童
            </h3>
            <div class="space-y-3">
              ${generateStuckStudents(studentProgress)}
            </div>
          </div>
        </div>

        <!-- 助け要請の統計 -->
        <div class="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 class="text-xl font-bold text-gray-800 mb-6">
            <i class="fas fa-chart-pie mr-2"></i>
            助けの種類別統計
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${generateHelpStats(studentProgress)}
          </div>
        </div>

        <!-- 理解度の分布 -->
        <div class="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h3 class="text-xl font-bold text-gray-800 mb-6">
            <i class="fas fa-smile mr-2"></i>
            理解度の分布
          </h3>
          <div class="grid grid-cols-5 gap-4">
            ${generateUnderstandingDistribution(studentProgress)}
          </div>
        </div>

        <!-- 教師用メモ -->
        <div class="bg-indigo-50 rounded-lg p-6 mt-6">
          <h3 class="text-lg font-bold text-indigo-800 mb-3">
            <i class="fas fa-lightbulb mr-2"></i>
            指導のポイント
          </h3>
          <ul class="text-sm text-gray-700 space-y-2">
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <span>オレンジ色のマークがついている児童には優先的に声をかけましょう</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <span>停滞している児童には、ヒントカードを勧めるか、友達との学び合いを促しましょう</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <span>理解度が低い児童には、個別指導の時間を設けましょう</span>
            </li>
            <li class="flex items-start">
              <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
              <span>進度が早い児童には、選択問題や発展課題を勧めましょう</span>
            </li>
          </ul>
        </div>
      </div>
    `
  } catch (error) {
    console.error('進捗ボード読み込みエラー:', error)
    alert('データの読み込みに失敗しました')
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

