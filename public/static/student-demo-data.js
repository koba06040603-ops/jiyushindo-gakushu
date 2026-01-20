// 生徒別のデモデータ定義
const STUDENT_DEMO_DATA = {
  // 山田太郎（studentId: 3）
  3: {
    name: '山田太郎',
    summary: '山田太郎さんは、かけ算の筆算において「繰り上がりの忘れ」が最も多く見られます。しかし、最近5日間で正答率が33%→75%へと大きく改善しており、学習意欲が高く成長が著しいです。',
    errorPatterns: [
      { pattern: '繰り上がりの忘れ', count: 5 },
      { pattern: '位取りのミス', count: 3 },
      { pattern: '計算の順序間違い', count: 2 }
    ],
    rootCauses: [
      '繰り上がりの概念理解が不十分',
      '位取りの意識が弱い',
      '計算手順の定着が不足'
    ],
    suggestions: [
      { priority: 'high', text: '繰り上がりの視覚化：色分けやマーカーで繰り上がりを明示する' },
      { priority: 'high', text: '位取り表の活用：マス目を使って位を揃える練習' },
      { priority: 'medium', text: '計算手順の口頭確認：「一の位から計算する」と声に出させる' },
      { priority: 'low', text: '成功体験の積み重ね：簡単な問題から徐々にレベルアップ' }
    ],
    accuracyTrend: [
      { date: '01-15', accuracy: 33.3 },
      { date: '01-16', accuracy: 42.9 },
      { date: '01-17', accuracy: 57.1 },
      { date: '01-18', accuracy: 62.5 },
      { date: '01-19', accuracy: 75.0 }
    ],
    optional: {
      totalAttempts: 12,
      completed: 10,
      completionRate: 83,
      classAverage: 8,
      difficulty: { easy: 2, medium: 5, hard: 5 },
      comment: '難しい問題にも積極的に挑戦しており、探究心が旺盛です！この調子で頑張りましょう。'
    },
    nonCognitive: {
      grit: 80,
      selfRegulation: 70,
      collaboration: 65,
      curiosity: 85,
      metacognition: 75
    },
    nonCognitiveHistory: [
      {
        date: '2026-01-06',
        week: 1,
        grit: 70,
        selfRegulation: 65,
        collaboration: 60,
        curiosity: 80,
        metacognition: 68
      },
      {
        date: '2026-01-13',
        week: 2,
        grit: 75,
        selfRegulation: 68,
        collaboration: 63,
        curiosity: 83,
        metacognition: 72
      },
      {
        date: '2026-01-20',
        week: 3,
        grit: 80,
        selfRegulation: 70,
        collaboration: 65,
        curiosity: 85,
        metacognition: 75
      }
    ],
    strengths: ['好奇心: 選択課題に積極的（クラストップ）', '粘り強さ: 誤答後も諦めずに再挑戦'],
    growthAreas: ['協働性: 友達への教え合いを増やそう', '自己調整: 学習ペースをもう少し安定させよう'],
    overallAdvice: '山田太郎さんは、<strong class="text-yellow-300">認知面・非認知面ともにバランス良く成長</strong>しています。特に<strong class="text-yellow-300">好奇心が高く</strong>（85点）、難しい問題にも積極的に挑戦する姿勢が素晴らしいです。選択課題への取り組みは<strong>クラストップレベル</strong>（12回、クラス平均8回）で、探究心が旺盛です。正答率も<strong>5日間で33%→75%に大きく改善</strong>しており、粘り強さ（80点）も高い水準です。<br><br><i class="fas fa-arrow-right mr-2"></i><strong>今後の成長ポイント:</strong> 友達との教え合いを通じて<strong>協働性</strong>を高めることで、さらなる成長が期待できます。また、学習ペースをもう少し安定させることで、<strong>自己調整力</strong>も向上するでしょう。',
    support: [
      { title: '個別指導', detail: '休み時間に10分程度、繰り上がりの練習' },
      { title: 'ペア学習', detail: '理解が進んでいる佐藤花子さんとペアを組む' },
      { title: '家庭学習', detail: '毎日5問、繰り上がりのある問題を練習' }
    ]
  },
  
  // 佐藤花子（studentId: 4）
  4: {
    name: '佐藤花子',
    summary: '佐藤花子さんは、かけ算の筆算において非常に高い理解度を示しています。正答率は常に80%以上を維持しており、クラスのリーダー的存在です。他の児童への教え方も上手で、協働性が特に優れています。',
    errorPatterns: [
      { pattern: '複雑な繰り上がりの計算ミス', count: 2 },
      { pattern: '問題文の読み間違い', count: 1 }
    ],
    rootCauses: [
      '複雑な計算での注意力の一時的な低下',
      '問題文を急いで読む傾向'
    ],
    suggestions: [
      { priority: 'low', text: '複雑な問題：二度見直す習慣をつける' },
      { priority: 'low', text: '問題文：重要な数字に線を引く練習' },
      { priority: 'medium', text: '発展的な問題にチャレンジ：より高度な計算問題' }
    ],
    accuracyTrend: [
      { date: '01-15', accuracy: 83.3 },
      { date: '01-16', accuracy: 85.7 },
      { date: '01-17', accuracy: 87.5 },
      { date: '01-18', accuracy: 90.0 },
      { date: '01-19', accuracy: 91.7 }
    ],
    optional: {
      totalAttempts: 15,
      completed: 14,
      completionRate: 93,
      classAverage: 8,
      difficulty: { easy: 1, medium: 6, hard: 8 },
      comment: 'さらに難しい問題にも挑戦し、着実に力をつけています。友達への説明も丁寧で素晴らしいです！'
    },
    nonCognitive: {
      grit: 85,
      selfRegulation: 90,
      collaboration: 95,
      curiosity: 80,
      metacognition: 88
    },
    nonCognitiveHistory: [
      {
        date: '2026-01-06',
        week: 1,
        grit: 82,
        selfRegulation: 88,
        collaboration: 92,
        curiosity: 78,
        metacognition: 85
      },
      {
        date: '2026-01-13',
        week: 2,
        grit: 84,
        selfRegulation: 89,
        collaboration: 94,
        curiosity: 79,
        metacognition: 87
      },
      {
        date: '2026-01-20',
        week: 3,
        grit: 85,
        selfRegulation: 90,
        collaboration: 95,
        curiosity: 80,
        metacognition: 88
      }
    ],
    strengths: ['協働性: 友達への教え方が上手（クラス1位）', '自己調整: 計画的な学習習慣が確立'],
    growthAreas: ['好奇心: さらに高度な問題への挑戦', 'メタ認知: 自分の間違いパターンの分析'],
    overallAdvice: '佐藤花子さんは、<strong class="text-yellow-300">全ての面で非常に高い水準</strong>を維持しています。特に<strong class="text-yellow-300">協働性が優れており</strong>（95点）、クラスのリーダーとして友達をサポートする姿勢が素晴らしいです。正答率も<strong>83%→92%へと安定的に向上</strong>しており、学習習慣が確立しています。<br><br><i class="fas fa-arrow-right mr-2"></i><strong>今後の成長ポイント:</strong> 既に基礎は十分に身についているので、<strong>発展的な問題</strong>や<strong>応用問題</strong>にチャレンジすることで、さらなる成長が期待できます。また、<strong>自分の学習方法を言語化</strong>して友達に伝えることで、メタ認知能力もさらに向上するでしょう。',
    support: [
      { title: '発展学習', detail: '3桁×2桁など、より高度な問題にチャレンジ' },
      { title: 'ピア・チューター', detail: '山田太郎さんなど、サポートが必要な友達のメンター役' },
      { title: '学習リーダー', detail: 'グループ学習のリーダーとして、全体の学習をサポート' }
    ]
  },
  
  // 鈴木次郎（studentId: 5）
  5: {
    name: '鈴木次郎',
    summary: '鈴木次郎さんは、かけ算の筆算において着実に理解を深めています。最初は苦手意識がありましたが、諦めずに取り組む姿勢が見られ、正答率も徐々に向上しています（25%→50%）。マイペースですが、確実に前進しています。',
    errorPatterns: [
      { pattern: '九九の記憶違い', count: 8 },
      { pattern: '繰り上がりの忘れ', count: 6 },
      { pattern: '位取りのミス', count: 4 }
    ],
    rootCauses: [
      '九九の基礎が不十分',
      '計算スピードへの焦り',
      '自信のなさからくる不安'
    ],
    suggestions: [
      { priority: 'high', text: '九九の復習：7の段、8の段を重点的に' },
      { priority: 'high', text: 'スモールステップ：簡単な問題から確実にクリア' },
      { priority: 'medium', text: '成功体験の積み重ね：できた問題を記録して見える化' },
      { priority: 'medium', text: '時間を気にしない練習：焦らずゆっくり確実に' }
    ],
    accuracyTrend: [
      { date: '01-15', accuracy: 25.0 },
      { date: '01-16', accuracy: 28.6 },
      { date: '01-17', accuracy: 37.5 },
      { date: '01-18', accuracy: 42.9 },
      { date: '01-19', accuracy: 50.0 }
    ],
    optional: {
      totalAttempts: 5,
      completed: 3,
      completionRate: 60,
      classAverage: 8,
      difficulty: { easy: 4, medium: 1, hard: 0 },
      comment: '簡単な問題から着実に取り組んでいます。焦らず自分のペースで頑張りましょう！'
    },
    nonCognitive: {
      grit: 75,
      selfRegulation: 60,
      collaboration: 55,
      curiosity: 65,
      metacognition: 58
    },
    nonCognitiveHistory: [
      {
        date: '2026-01-06',
        week: 1,
        grit: 68,
        selfRegulation: 55,
        collaboration: 50,
        curiosity: 60,
        metacognition: 52
      },
      {
        date: '2026-01-13',
        week: 2,
        grit: 72,
        selfRegulation: 58,
        collaboration: 53,
        curiosity: 63,
        metacognition: 55
      },
      {
        date: '2026-01-20',
        week: 3,
        grit: 75,
        selfRegulation: 60,
        collaboration: 55,
        curiosity: 65,
        metacognition: 58
      }
    ],
    strengths: ['粘り強さ: 諦めずに取り組む姿勢', '成長意欲: 徐々に難しい問題にも挑戦'],
    growthAreas: ['自己調整: 学習計画を立てて取り組む習慣', '協働性: 友達に質問する勇気を持つ'],
    overallAdvice: '鈴木次郎さんは、<strong class="text-yellow-300">着実に成長</strong>しています。最初は苦手意識がありましたが、<strong>諦めずに取り組む姿勢</strong>（粘り強さ75点）が素晴らしいです。正答率も<strong>5日間で25%→50%に倍増</strong>しており、確実に前進しています。<br><br><i class="fas fa-arrow-right mr-2"></i><strong>今後の成長ポイント:</strong> まずは<strong>九九の基礎</strong>をしっかり固めることが最優先です。焦らず、<strong>スモールステップ</strong>で一つずつクリアしていきましょう。また、<strong>友達や先生に質問する勇気</strong>を持つことで、より効率的に学習できます。',
    support: [
      { title: '九九の反復練習', detail: '毎日5分、苦手な段（7の段、8の段）を集中練習' },
      { title: 'マンツーマン指導', detail: '週2回、先生と1対1で基礎を確認' },
      { title: '励ましと承認', detail: '小さな成功を見逃さず、積極的にほめる' }
    ]
  }
}

// 名前ベースのアクセスも可能にする
STUDENT_DEMO_DATA['山田太郎'] = STUDENT_DEMO_DATA[3]
STUDENT_DEMO_DATA['佐藤花子'] = STUDENT_DEMO_DATA[4]
STUDENT_DEMO_DATA['鈴木次郎'] = STUDENT_DEMO_DATA[5]

// グローバルに公開
window.STUDENT_DEMO_DATA = STUDENT_DEMO_DATA

// この定義を使ってレポートを生成する共通関数を作成
function generateStudentReport(studentId, studentName) {
  const data = STUDENT_DEMO_DATA[studentId] || STUDENT_DEMO_DATA[studentName]
  if (!data) {
    return null // デモデータがない場合
  }
  
  return data
}

window.generateStudentReport = generateStudentReport
