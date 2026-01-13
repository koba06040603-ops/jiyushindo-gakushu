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
        <div class="flex items-center">
          <i class="fas fa-user-circle text-3xl text-indigo-500 mr-3"></i>
          <div>
            <p class="text-sm text-gray-500">ログイン中</p>
            <p class="font-bold text-lg">${state.student.name}</p>
          </div>
        </div>
      </div>

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
    
    //コース選択問題と共通チェックテストをメタデータから取得
    let courseSelectionProblems = []
    let commonCheckTest = null
    try {
      const metaResponse = await axios.get(`/api/curriculum/${curriculumId}/metadata`)
      courseSelectionProblems = metaResponse.data.course_selection_problems || []
      commonCheckTest = metaResponse.data.common_check_test || null
    } catch (metaError) {
      console.log('メタデータなし、デフォルト表示')
    }
    
    state.selectedCurriculum = curriculum
    state.courses = courses

    const app = document.getElementById('app')
    app.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
        <div class="container mx-auto px-4 max-w-5xl">
          
          <!-- 戻るボタン -->
          <button onclick="renderTopPage()" class="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center text-lg font-semibold transition">
            <i class="fas fa-arrow-left mr-2"></i>トップページにもどる
          </button>

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
                        <div class="bg-white rounded-lg p-3 border-2 ${index === 0 ? 'border-green-300' : index === 1 ? 'border-blue-300' : 'border-purple-300'} mb-3">
                          <div class="flex items-center mb-2">
                            <i class="fas fa-star ${iconClasses} mr-2"></i>
                            <p class="text-sm font-bold text-gray-800">${course.introduction_problem.problem_title}</p>
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
                      ` : ''}
                      
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
                      📝 ${commonCheckTest.test_description}
                    </h4>
                    <p class="text-sm text-gray-600 text-center mb-4">
                      ${commonCheckTest.test_note}
                    </p>
                    <div class="space-y-3">
                      ${commonCheckTest.sample_problems.map((problem, index) => `
                        <div class="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-white rounded-lg p-3">
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
                          </div>
                        </div>
                      `).join('')}
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
              <div class="grid grid-cols-3 gap-4">
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
                <button onclick="loadAnswersTab(${curriculum.id})" 
                        class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition shadow-lg flex items-center justify-center">
                  <i class="fas fa-book-open mr-2"></i>
                  こたえを見る
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `
  } catch (error) {
    console.error('学習のてびき読み込みエラー:', error)
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
                  <pre class="text-gray-800 whitespace-pre-wrap font-sans">${answer?.answer_content || card.answer || card.example_solution || '解答は準備中です'}</pre>
                </div>
                ${(answer?.explanation || card.real_world_connection) ? `
                  <div class="bg-white rounded-lg p-4">
                    <h4 class="font-bold text-gray-800 mb-2">
                      <i class="fas fa-info-circle mr-2"></i>解説
                    </h4>
                    <pre class="text-gray-800 whitespace-pre-wrap font-sans">${answer?.explanation || card.real_world_connection}</pre>
                  </div>
                ` : ''}
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
    // カード情報を取得
    const cardContext = window.currentCardData ? {
      card_title: window.currentCardData.card.card_title,
      problem_description: window.currentCardData.card.problem_description,
      new_terms: window.currentCardData.card.new_terms
    } : null
    
    // AIチャットAPIを呼び出す
    const response = await axios.post('/api/ai-chat', {
      message: question,
      cardContext: cardContext
    })
    
    // ローディングメッセージを削除
    const loadingMsg = document.getElementById(loadingId)
    if (loadingMsg) loadingMsg.remove()
    
    // AIの回答を追加
    addAIMessage(response.data.response, 'ai')
    
  } catch (error) {
    console.error('AI質問エラー:', error)
    console.error('エラー詳細:', error.response?.data || error.message)
    const loadingMsg = document.getElementById(loadingId)
    if (loadingMsg) loadingMsg.remove()
    
    // より具体的なエラーメッセージ
    const errorMsg = error.response?.data?.error || error.message || 'エラーが発生しました'
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
          
          <!-- AI誤答分析ボタン（Phase 6） -->
          <div class="mt-4 pt-4 border-t border-indigo-200">
            <button onclick="loadAIErrorAnalysis()" 
                    class="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center shadow-lg">
              <i class="fas fa-microscope mr-2"></i>
              AI誤答分析で詳しく見る
              <span class="ml-2 text-xs bg-white text-red-600 px-2 py-0.5 rounded animate-pulse">NEW</span>
            </button>
          </div>
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
              <input type="text" id="genUnitName" placeholder="例: かけ算の筆算（または上のボタンで候補から選択）" 
                     class="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none">
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
      
      // 1秒後に学習のてびきページへ
      setTimeout(() => {
        loadGuidePage(curriculumId)
      }, 1000)
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
          <button onclick="saveLearningPlan()" 
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
                <div class="bg-white p-3 rounded-lg">
                  <p class="text-sm font-bold text-orange-800 mb-2">📝 解答</p>
                  <p class="text-gray-700">${card.example_solution || '解答例は例題の解き方を参照してください'}</p>
                </div>
                ${card.real_world_connection ? `
                  <div class="bg-white p-3 rounded-lg mt-2">
                    <p class="text-sm font-bold text-blue-800 mb-2">💡 解説</p>
                    <p class="text-gray-700">${card.real_world_connection}</p>
                  </div>
                ` : ''}
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
              📝 ${commonCheckTest.test_description}
            </h3>
            <p class="text-sm text-gray-700 mb-4">${commonCheckTest.test_note}</p>
            <div class="bg-white rounded-lg p-4">
              <p class="font-bold text-gray-800 mb-2">
                問題数: ${commonCheckTest.problems_count}題
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

function saveLearningPlan() {
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

window.adjustCardTime = adjustCardTime
window.moveCard = moveCard
window.saveLearningPlan = saveLearningPlan

