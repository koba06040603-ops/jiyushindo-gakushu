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
          <button onclick="alert('進捗ボードは次のステップで実装します')" 
                  class="bg-purple-600 text-white py-4 px-6 rounded-lg font-bold hover:bg-purple-700 transition flex items-center justify-center">
            <i class="fas fa-chart-bar mr-2"></i>
            進捗ボード
          </button>
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
// 進捗ボードページ（次回実装）
// ============================================
function loadProgressBoard() {
  alert('進捗ボードは次のステップで実装します！')
  // 次のステップで実装予定
}
