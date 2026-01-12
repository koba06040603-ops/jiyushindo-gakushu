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
// 学習カードページ（次回実装）
// ============================================
function loadCardPage(cardId) {
  alert('学習カードページは次のステップで実装します！')
  // 次のステップで実装予定
}

// ============================================
// 進捗ボードページ（次回実装）
// ============================================
function loadProgressBoard() {
  alert('進捗ボードは次のステップで実装します！')
  // 次のステップで実装予定
}
