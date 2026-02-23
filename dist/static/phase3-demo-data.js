// ============================================
// Phase 3 デモデータ
// ============================================

// 選択課題成果物のデモデータ
window.DEMO_SUBMISSIONS = {
  3: [ // 山田太郎
    {
      id: 1,
      problem_title: '実生活で使えるかけ算',
      difficulty_level: 'medium',
      submission_type: 'image',
      file_url: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Math+Work+1',
      file_name: 'math-work-1.jpg',
      description: 'お店でおかしを買うときの計算を考えました。1個120円のおかしを8個買ったら960円になります。',
      self_evaluation: 4,
      self_comment: '実際にお店に行って確かめてみました！',
      submitted_at: '2026-01-18T10:30:00',
      teacher_comment: '実生活と結びつけて考えられていて素晴らしいです！次は消費税も計算してみましょう。',
      teacher_evaluation: 5
    },
    {
      id: 2,
      problem_title: '探究問題：かけ算のきまり',
      difficulty_level: 'hard',
      submission_type: 'text',
      description: 'かけ算には交換法則があることを発見しました。3×4=12と4×3=12が同じになるのは、3個のグループが4つでも、4個のグループが3つでも、全部で12個になるからです。図を描いて確かめました。',
      self_evaluation: 5,
      self_comment: '図を描いたらよくわかりました！',
      submitted_at: '2026-01-19T14:20:00'
    }
  ],
  4: [ // 佐藤花子
    {
      id: 3,
      problem_title: '教科横断：社会とつながる問題',
      difficulty_level: 'hard',
      submission_type: 'image',
      file_url: 'https://via.placeholder.com/400x300/06B6D4/FFFFFF?text=Social+Studies',
      file_name: 'social-math.jpg',
      description: '日本の都道府県の人口を使って計算問題を作りました。東京都の人口は約1400万人で、1人が1日3食食べると、1日で4200万食が必要です。',
      self_evaluation: 5,
      self_comment: '社会の勉強と算数がつながって面白かったです！',
      submitted_at: '2026-01-17T13:45:00',
      teacher_comment: '教科を超えて考える力が素晴らしいです。次は1年間ではどうなるか計算してみましょう。',
      teacher_evaluation: 5
    }
  ],
  5: [ // 鈴木次郎
    {
      id: 4,
      problem_title: '基礎問題：九九の練習',
      difficulty_level: 'easy',
      submission_type: 'image',
      file_url: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Practice+Sheet',
      file_name: 'practice.jpg',
      description: '7の段と8の段を毎日練習しています。少しずつ覚えてきました。',
      self_evaluation: 3,
      self_comment: 'まだ間違えるけど、前よりできるようになった。',
      submitted_at: '2026-01-19T11:00:00',
      teacher_comment: '毎日コツコツ頑張っていますね！着実に成長しています。',
      teacher_evaluation: 4
    }
  ]
}

// 教師の見取り記録のデモデータ
window.DEMO_OBSERVATIONS = {
  3: [ // 山田太郎
    {
      id: 1,
      observation_date: '2026-01-19',
      observation_type: 'learning_attitude',
      observation_text: '授業中、わからない問題に出会った時も、すぐに諦めずにヒントカードを使って自分で考えようとしていた。粘り強く取り組む姿勢が見られた。',
      context: 'かけ算の筆算の授業中',
      related_activity: 'かけ算の筆算 - 学習カード5',
      non_cognitive_tags: '粘り強さ,メタ認知',
      is_positive: 1,
      is_shared_with_parents: 1,
      teacher_name: '田中先生',
      unit_name: 'かけ算の筆算'
    },
    {
      id: 2,
      observation_date: '2026-01-18',
      observation_type: 'collaboration',
      observation_text: 'グループ学習で、佐藤さんに教えてもらいながら問題を解いていた。わからないところを素直に聞ける姿勢は大切。',
      context: 'グループ活動',
      related_activity: '選択課題2',
      non_cognitive_tags: '協働性',
      is_positive: 1,
      is_shared_with_parents: 0,
      teacher_name: '田中先生',
      unit_name: 'かけ算の筆算'
    },
    {
      id: 3,
      observation_date: '2026-01-17',
      observation_type: 'curiosity',
      observation_text: '「なんで繰り上がるの？」という本質的な疑問を持ち、自分で図を描いて確かめようとしていた。探究心が素晴らしい。',
      context: '個別学習中',
      related_activity: 'かけ算の筆算 - 学習カード3',
      non_cognitive_tags: '好奇心,創造性',
      is_positive: 1,
      is_shared_with_parents: 1,
      teacher_name: '田中先生',
      unit_name: 'かけ算の筆算'
    }
  ],
  4: [ // 佐藤花子
    {
      id: 4,
      observation_date: '2026-01-19',
      observation_type: 'collaboration',
      observation_text: '山田さんや鈴木さんに、わかりやすく丁寧に教えている姿が印象的。相手の理解度を確認しながら説明できている。',
      context: 'グループ活動',
      related_activity: 'かけ算の筆算 - 選択課題',
      non_cognitive_tags: '協働性,メタ認知',
      is_positive: 1,
      is_shared_with_parents: 1,
      teacher_name: '田中先生',
      unit_name: 'かけ算の筆算'
    },
    {
      id: 5,
      observation_date: '2026-01-18',
      observation_type: 'challenge',
      observation_text: '基本問題をすぐに終えて、発展的な問題に自ら挑戦している。難しい問題でも楽しそうに取り組んでいる。',
      context: '個別学習時間',
      related_activity: '選択課題6',
      non_cognitive_tags: '好奇心,挑戦する姿勢',
      is_positive: 1,
      is_shared_with_parents: 1,
      teacher_name: '田中先生',
      unit_name: 'かけ算の筆算'
    }
  ],
  5: [ // 鈴木次郎
    {
      id: 6,
      observation_date: '2026-01-19',
      observation_type: 'learning_attitude',
      observation_text: '最初は自信がなさそうだったが、簡単な問題から始めて徐々に自信をつけてきている。スモールステップが効果的。',
      context: '個別支援時間',
      related_activity: 'かけ算の筆算 - 基礎問題',
      non_cognitive_tags: '粘り強さ,成長マインドセット',
      is_positive: 1,
      is_shared_with_parents: 1,
      teacher_name: '田中先生',
      unit_name: 'かけ算の筆算'
    },
    {
      id: 7,
      observation_date: '2026-01-17',
      observation_type: 'understanding',
      observation_text: '九九カードを使った反復練習で、7の段と8の段が少しずつ言えるようになってきた。着実な成長が見られる。',
      context: '朝学習時間',
      related_activity: '九九の復習',
      non_cognitive_tags: '粘り強さ',
      is_positive: 1,
      is_shared_with_parents: 1,
      teacher_name: '田中先生',
      unit_name: 'かけ算の筆算'
    }
  ]
}

// 生徒の振り返りのデモデータ
window.DEMO_REFLECTIONS = {
  3: [ // 山田太郎
    {
      id: 1,
      reflection_date: '2026-01-19',
      reflection_type: 'daily',
      what_learned: 'かけ算の筆算で繰り上がりがある時は、小さい数字で書いておくことを学びました。',
      what_understood: '繰り上がりを忘れないコツがわかりました。色をつけると見やすいです。',
      what_difficult: '3桁×2桁の計算はまだ時間がかかります。',
      what_enjoyed: '友達と教え合いながら問題を解くのが楽しかったです。',
      next_goals: '3桁×2桁の計算を速く正確にできるようになりたいです。',
      mood_rating: 4,
      effort_rating: 4,
      understanding_rating: 4,
      unit_name: 'かけ算の筆算'
    },
    {
      id: 2,
      reflection_date: '2026-01-17',
      reflection_type: 'weekly',
      what_learned: '今週はかけ算の筆算を集中的に勉強しました。位を揃えることが大切だとわかりました。',
      what_understood: '繰り上がりの仕組みがよくわかるようになってきました。',
      what_difficult: 'まだたまに位を間違えてしまいます。',
      what_enjoyed: '選択課題で自分で問題を作るのが面白かったです。',
      next_goals: 'もっと難しい問題にもチャレンジしたいです。',
      mood_rating: 5,
      effort_rating: 5,
      understanding_rating: 4,
      unit_name: 'かけ算の筆算'
    }
  ],
  4: [ // 佐藤花子
    {
      id: 3,
      reflection_date: '2026-01-19',
      reflection_type: 'daily',
      what_learned: '今日は教科横断の問題で、社会で習った都道府県の人口を使って計算しました。',
      what_understood: '算数は他の教科とつながっていることがわかりました。',
      what_difficult: '大きな数の計算は集中力が必要です。',
      what_enjoyed: '自分で問題を作って、クラスのみんなに出題できて嬉しかったです。',
      next_goals: '理科の実験でも算数を使えるか考えてみたいです。',
      mood_rating: 5,
      effort_rating: 5,
      understanding_rating: 5,
      unit_name: 'かけ算の筆算'
    }
  ],
  5: [ // 鈴木次郎
    {
      id: 4,
      reflection_date: '2026-01-19',
      reflection_type: 'daily',
      what_learned: '7の段と8の段の九九を練習しました。',
      what_understood: '毎日練習すれば少しずつできるようになることがわかりました。',
      what_difficult: '8×7と7×8がごちゃごちゃになります。',
      what_enjoyed: '先生にほめてもらえたのが嬉しかったです。',
      next_goals: '来週は9の段も覚えたいです。',
      mood_rating: 3,
      effort_rating: 4,
      understanding_rating: 3,
      unit_name: 'かけ算の筆算'
    }
  ]
}

// 教科横断評価のデモデータ
window.DEMO_CROSS_EVALUATIONS = {
  3: [ // 山田太郎
    {
      id: 1,
      evaluation_period_start: '2026-01-13',
      evaluation_period_end: '2026-01-19',
      reading_comprehension: 65,
      writing_expression: 70,
      logical_thinking: 75,
      creative_thinking: 80,
      problem_solving: 72,
      persistence_score: 80,
      self_regulation_score: 70,
      collaboration_score: 65,
      curiosity_score: 85,
      metacognition_score: 75,
      growth_mindset_score: 78,
      overall_comment: '好奇心が高く、新しいことに積極的に取り組む姿勢が素晴らしい。粘り強さも向上している。',
      strengths: '探究心が旺盛で、なぜそうなるのかを考えることができる。図を使って説明する力も育っている。',
      areas_for_growth: '協働性と自己調整力をさらに伸ばすことで、より安定した学習が可能になる。',
      recommendations: '友達との教え合い活動を増やし、自分の学習計画を立てる練習を取り入れる。'
    }
  ],
  4: [ // 佐藤花子
    {
      id: 2,
      evaluation_period_start: '2026-01-13',
      evaluation_period_end: '2026-01-19',
      reading_comprehension: 90,
      writing_expression: 88,
      logical_thinking: 92,
      creative_thinking: 85,
      problem_solving: 91,
      persistence_score: 85,
      self_regulation_score: 90,
      collaboration_score: 95,
      curiosity_score: 80,
      metacognition_score: 88,
      growth_mindset_score: 87,
      overall_comment: 'すべての能力において高いレベルを維持。特に協働性が際立っている。',
      strengths: '他者に教える力が優れており、自分の理解を言語化できる。全教科で安定した高い成績。',
      areas_for_growth: '既に高いレベルだが、さらなる挑戦として、複雑な問題や新しい分野への探究を深める。',
      recommendations: '発展的な課題やプロジェクト学習を提供し、リーダーシップを育成する機会を増やす。'
    }
  ],
  5: [ // 鈴木次郎
    {
      id: 3,
      evaluation_period_start: '2026-01-13',
      evaluation_period_end: '2026-01-19',
      reading_comprehension: 55,
      writing_expression: 58,
      logical_thinking: 60,
      creative_thinking: 65,
      problem_solving: 62,
      persistence_score: 75,
      self_regulation_score: 60,
      collaboration_score: 55,
      curiosity_score: 65,
      metacognition_score: 58,
      growth_mindset_score: 70,
      overall_comment: '着実に成長している。特に粘り強さと成長マインドセットが向上している。',
      strengths: '諦めずに取り組む姿勢が育っている。基礎的な問題には確実に取り組める。',
      areas_for_growth: '自己調整力と協働性を高めることで、学習効率が向上する。',
      recommendations: 'スモールステップでの成功体験を積み重ね、友達とのペア学習で自信をつける。'
    }
  ]
}

// Phase 3 デモデータを読み込む関数
window.loadPhase3DemoData = function(studentId) {
  console.log(`📦 Phase 3デモデータを読み込み: studentId=${studentId}`)
  
  // グローバルステートに保存
  window.phase3State.currentStudentId = studentId
  window.phase3State.submissions = window.DEMO_SUBMISSIONS[studentId] || []
  window.phase3State.observations = window.DEMO_OBSERVATIONS[studentId] || []
  window.phase3State.reflections = window.DEMO_REFLECTIONS[studentId] || []
  window.phase3State.evaluations = window.DEMO_CROSS_EVALUATIONS[studentId] || []
  
  console.log(`✅ デモデータ読み込み完了:`, {
    submissions: window.phase3State.submissions.length,
    observations: window.phase3State.observations.length,
    reflections: window.phase3State.reflections.length,
    evaluations: window.phase3State.evaluations.length
  })
}

console.log('✅ Phase 3 デモデータを読み込みました')
