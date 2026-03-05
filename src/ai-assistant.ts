// AI学習アシスタント（チャットボット）モジュール - 全教科対応版 + 音声認識対応

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  message_type?: string
}

interface ConversationContext {
  student_id: number
  conversation_id: number
  grade?: string // 学年情報を追加
  personality: {
    name: string
    system_prompt: string
    tone: string
    emoji_usage: number
  }
  recent_messages: ChatMessage[]
  student_progress?: any
}

// 学年別の言葉遣いガイド
const GRADE_LANGUAGE_GUIDE = {
  '1年': {
    vocabulary_level: 'basic',
    sentence_structure: 'simple',
    examples: [
      'かんたんなことばをつかう',
      'みじかいぶんでせつめいする',
      'ひらがなをおおくつかう'
    ],
    instructions: `
- 1年生レベルの言葉遣い: ひらがなを多く使う、漢字は習った範囲のみ
- 短い文で説明（1文10〜15文字程度）
- 「〜だよ」「〜だね」など親しみやすい語尾
- 具体的な例えを使う（おはじき、ブロックなど）
- ステップを細かく分けて、一つずつ丁寧に説明
- わかったか確認しながら進める
`
  },
  '2年': {
    vocabulary_level: 'basic',
    sentence_structure: 'simple',
    examples: [
      'かんたんな言葉を使う',
      '短い文で説明する',
      'ならった漢字を使う'
    ],
    instructions: `
- 2年生レベルの言葉遣い: 習った漢字を適度に使う、ふりがな付き
- 短い文で説明（1文15〜20文字程度）
- 「〜だよ」「〜だね」など親しみやすい語尾
- 身近な例えを使う（おもちゃ、動物など）
- 理由や根拠も簡単に説明する
- 励ましの言葉を多めに入れる
`
  },
  '3年': {
    vocabulary_level: 'standard',
    sentence_structure: 'moderate',
    examples: [
      '3年生で習う言葉を使う',
      'わかりやすい文で説明',
      '漢字とひらがなをバランスよく'
    ],
    instructions: `
- 3年生レベルの言葉遣い: 基本的な漢字を使う、難しい言葉には説明を添える
- 適度な長さの文（1文20〜25文字程度）
- 「〜です」「〜ます」と「〜だよ」を使い分け
- 日常生活の例を使う（買い物、料理など）
- 段落を分けて、わかりやすく構成する
- 例題や練習問題も提示する
`
  },
  '4年': {
    vocabulary_level: 'standard',
    sentence_structure: 'moderate',
    examples: [
      '4年生レベルの言葉で説明',
      '論理的な文章構成',
      '適切な漢字の使用'
    ],
    instructions: `
- 4年生レベルの言葉遣い: 学年相応の漢字を使う、専門用語は簡単に説明
- 適度な長さの文（1文25〜30文字程度）
- 丁寧語を基本とする
- 理由や根拠を示す説明
- 複数の方法や考え方を提示する
- 発展的な内容も少し触れる
`
  },
  '5年': {
    vocabulary_level: 'advanced',
    sentence_structure: 'complex',
    examples: [
      '5年生レベルの語彙で説明',
      '複雑な文章でも理解可能',
      '抽象的な概念も扱える'
    ],
    instructions: `
- 5年生レベルの言葉遣い: やや難しい言葉も使用可能、接続詞を適切に使う
- やや長い文も可（1文30〜40文字程度）
- 丁寧語を基本とする
- 抽象的な概念も段階的に説明
- 複数の視点から説明し、理解を深める
- 応用問題や発展的な内容も含める
`
  },
  '6年': {
    vocabulary_level: 'advanced',
    sentence_structure: 'complex',
    examples: [
      '6年生レベルの語彙で説明',
      '論理的で詳しい説明',
      '中学準備レベルの内容'
    ],
    instructions: `
- 6年生レベルの言葉遣い: 高度な語彙も使用可能、論理的な文章構成
- 長い文も適切に使用（1文40〜50文字程度）
- 丁寧語を基本とする
- 中学校内容も少し先取りして説明可能
- 論理的な思考過程を詳しく説明する
- 関連する他の単元や発展内容も紹介する
`
  },
  '中1': {
    vocabulary_level: 'advanced',
    sentence_structure: 'complex',
    examples: [
      '中学1年生レベルの語彙',
      '論理的な説明',
      '抽象的概念の理解'
    ],
    instructions: `
- 中学1年生レベルの言葉遣い: 専門用語も適切に使用、論理的な説明
- 複雑な文章も使用可能（1文50文字程度）
- 丁寧語を基本とする
- 抽象的な概念も扱える
- 理由や根拠を明確に示す
- 定義や公式は詳しく説明し、具体例も複数提示する
- 関連する発展的な内容や別解も紹介する
`
  },
  '中2': {
    vocabulary_level: 'advanced',
    sentence_structure: 'complex',
    examples: [
      '中学2年生レベルの語彙',
      '高度な論理展開',
      '複数の視点からの説明'
    ],
    instructions: `
- 中学2年生レベルの言葉遣い: 高度な専門用語、複雑な論理展開
- 長い文章も適切に使用（1文50〜60文字程度）
- 丁寧語を基本とする
- 複数の視点や考え方を提示
- 批判的思考を促す
- 定理や法則の証明過程も詳しく説明する
- 高校内容への橋渡しも意識した説明
`
  },
  '中3': {
    vocabulary_level: 'advanced',
    sentence_structure: 'complex',
    examples: [
      '中学3年生レベルの語彙',
      '高校準備レベルの内容',
      '論理的・批判的思考'
    ],
    instructions: `
- 中学3年生レベルの言葉遣い: 高度な語彙、高校準備レベルの内容
- 複雑な文章構成（1文60文字程度まで）
- 丁寧語を基本とする
- 高校内容も適宜先取り
- 論理的・批判的思考を重視
- 受験対策も意識
- 証明や論理展開は段階を追って詳細に説明する
- 実社会への応用例や発展的な内容も紹介する
`
  },
  'default': {
    vocabulary_level: 'standard',
    sentence_structure: 'moderate',
    examples: [],
    instructions: `
- 小中学生全般向けの言葉遣い: わかりやすい言葉、適度な漢字
- 適度な長さの文（1文20〜30文字程度）
- 丁寧語を基本とする
- 具体例を多く使う
- 段階的に詳しく説明する
- 理解度を確認しながら進める
`
  }
}

// 全教科対応: 学習指導要領ベースの知識ベース
const SUBJECT_KNOWLEDGE_BASE = {
  math: {
    name: '算数・数学',
    key_concepts: [
      '数と計算: 四則演算、分数、小数、百分率',
      '図形: 面積、体積、角度、合同、相似',
      '測定: 長さ、重さ、時間、単位換算',
      '変化と関係: 比例、反比例、グラフ',
      'データの活用: 平均、割合、表とグラフ'
    ],
    teaching_tips: [
      '具体物や図を使って視覚的に理解させる',
      '段階的に難易度を上げる（スモールステップ）',
      '日常生活との関連を示す',
      '間違いを恐れずチャレンジさせる',
      '計算ミスのパターンを分析する'
    ]
  },
  japanese: {
    name: '国語',
    key_concepts: [
      '読解: 主語・述語、指示語、接続語、段落構成',
      '文法: 品詞、敬語、文の構造',
      '語彙: 漢字、ことわざ、慣用句、四字熟語',
      '作文: 構成、表現技法、推敲',
      '読書: 物語文、説明文、詩、短歌、俳句'
    ],
    teaching_tips: [
      '音読で文章の流れを掴む',
      'キーワードに線を引きながら読む',
      '5W1Hで内容を整理する',
      '語彙力を増やすため辞書を活用',
      '日記や感想文で表現力を鍛える'
    ]
  },
  science: {
    name: '理科',
    key_concepts: [
      '物理: 力、運動、エネルギー、電気、磁石',
      '化学: 物質の性質、水溶液、燃焼、酸性・アルカリ性',
      '生物: 植物、動物、人体、生命の連続性',
      '地学: 天気、地層、天体、季節の変化',
      '実験・観察: 仮説、観察、記録、考察'
    ],
    teaching_tips: [
      '実験や観察を通じて体験的に学ぶ',
      '身近な現象と結びつける',
      '予想→実験→結果→考察の流れを大切に',
      '図や表で整理する習慣をつける',
      '疑問を持つ姿勢を育てる'
    ]
  },
  social_studies: {
    name: '社会',
    key_concepts: [
      '地理: 地図の見方、日本の地形・気候、世界の国々',
      '歴史: 古代から現代までの日本の歴史、重要人物',
      '公民: 政治のしくみ、憲法、国際社会',
      '産業: 農業、工業、商業、情報産業',
      '資料活用: 地図、グラフ、年表の読み取り'
    ],
    teaching_tips: [
      '地図や年表を活用して視覚的に理解',
      '歴史の流れを物語として捉える',
      '現代社会との関連を意識する',
      '資料から情報を読み取る訓練',
      'ニュースと関連づけて考える'
    ]
  },
  english: {
    name: '英語',
    key_concepts: [
      '語彙: 基本単語、熟語、慣用表現',
      '文法: 文型、時制、助動詞、前置詞',
      '会話: 挨拶、自己紹介、日常会話',
      '読解: 短文、物語、説明文',
      '作文: 英作文、メール、手紙'
    ],
    teaching_tips: [
      '音読とリスニングで英語のリズムを体得',
      '簡単な文から少しずつ長い文へ',
      '間違いを恐れず話す・書く練習',
      '日本語に訳さず英語のまま理解',
      '実際のコミュニケーションを意識'
    ]
  },
  home_economics: {
    name: '家庭科',
    key_concepts: [
      '衣生活: 衣服の手入れ、裁縫、素材の特徴',
      '食生活: 栄養、調理、食事マナー、食の安全',
      '住生活: 住まいの役割、掃除、整理整頓',
      '家族: 家族の役割、コミュニケーション',
      '消費生活: お金の使い方、買い物の工夫'
    ],
    teaching_tips: [
      '実習を通じて実践的に学ぶ',
      '家庭での実践を促す',
      '安全と衛生に配慮する習慣',
      '家族との協力を意識',
      '持続可能な生活を考える'
    ]
  },
  music: {
    name: '音楽',
    key_concepts: [
      '歌唱: 発声、リズム、音程、表現',
      '器楽: リコーダー、鍵盤楽器、打楽器',
      '鑑賞: クラシック、日本の伝統音楽、世界の音楽',
      '音楽の要素: 旋律、リズム、和音、形式',
      '創作: 簡単な作曲、リズム創作'
    ],
    teaching_tips: [
      '楽しく音楽に親しむことを第一に',
      '表現する喜びを感じさせる',
      '聴く力を育てる',
      '様々なジャンルの音楽に触れる',
      '仲間と協力して演奏する経験'
    ]
  },
  art: {
    name: '図画工作・美術',
    key_concepts: [
      '絵画: デッサン、着彩、構図、色彩',
      '工作: 立体造形、素材の加工、工具の使い方',
      'デザイン: レイアウト、ポスター、パッケージ',
      '鑑賞: 作品の見方、美術史、作家の意図',
      '表現: 想像力、創造力、表現の工夫'
    ],
    teaching_tips: [
      '自由な発想を大切にする',
      '失敗を恐れず試行錯誤させる',
      '作品を通じて自己表現する喜び',
      '他者の作品を尊重する態度',
      '様々な素材や技法に挑戦'
    ]
  },
  physical_education: {
    name: '体育',
    key_concepts: [
      '体つくり運動: 体ほぐし、体力向上',
      '器械運動: マット、跳び箱、鉄棒',
      '陸上運動: 走る、跳ぶ、投げる',
      '球技: ボール運動、ゲーム',
      '表現運動: ダンス、リズム遊び'
    ],
    teaching_tips: [
      '安全に配慮した指導',
      '個人の能力に応じた目標設定',
      '仲間と協力する態度',
      '運動の楽しさを体感',
      '健康的な生活習慣の形成'
    ]
  },
  programming: {
    name: 'プログラミング',
    key_concepts: [
      '順次処理: 命令を順番に実行',
      '反復処理: 繰り返しの考え方',
      '条件分岐: 条件によって処理を変える',
      '変数: データの保存と利用',
      '論理的思考: 問題を分解して解決'
    ],
    teaching_tips: [
      '身近な問題をプログラミングで解決',
      '試行錯誤を繰り返しながら学ぶ',
      'ビジュアルプログラミングから始める',
      '創造的な作品づくり',
      'アルゴリズムの考え方を育てる'
    ]
  }
}

// 教科を自動検出
function detectSubject(message: string): string | null {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.match(/算数|数学|計算|面積|体積|図形|分数|小数|掛け算|割り算|足し算|引き算/)) return 'math'
  if (lowerMessage.match(/国語|読解|漢字|文法|作文|読書|物語|説明文/)) return 'japanese'
  if (lowerMessage.match(/理科|実験|観察|化学|物理|生物|地学|植物|動物|天気/)) return 'science'
  if (lowerMessage.match(/社会|歴史|地理|公民|地図|年表/)) return 'social_studies'
  if (lowerMessage.match(/英語|english|英会話|単語|文法/)) return 'english'
  if (lowerMessage.match(/家庭科|料理|裁縫|栄養/)) return 'home_economics'
  if (lowerMessage.match(/音楽|楽器|歌|リコーダー/)) return 'music'
  if (lowerMessage.match(/図工|美術|絵|工作|デザイン/)) return 'art'
  if (lowerMessage.match(/体育|運動|スポーツ|体操/)) return 'physical_education'
  if (lowerMessage.match(/プログラミング|コード|scratch|スクラッチ/i)) return 'programming'
  
  return null
}

// Gemini APIを使ってチャット応答を生成（全教科対応版）
export async function generateChatResponse(
  context: ConversationContext,
  userMessage: string,
  apiKey: string
): Promise<{ content: string; message_type: string }> {
  
  // 教科を検出
  const detectedSubject = detectSubject(userMessage)
  let subjectContext = ''
  
  if (detectedSubject && SUBJECT_KNOWLEDGE_BASE[detectedSubject]) {
    const subject = SUBJECT_KNOWLEDGE_BASE[detectedSubject]
    subjectContext = `

【${subject.name}に関する指導のポイント】
重要概念:
${subject.key_concepts.map(c => `- ${c}`).join('\n')}

指導のコツ:
${subject.teaching_tips.map(t => `- ${t}`).join('\n')}
`
  }
  
  // 学年別の言葉遣いガイドを取得
  const gradeGuide = GRADE_LANGUAGE_GUIDE[context.grade || 'default'] || GRADE_LANGUAGE_GUIDE['default']
  
  // コンテキストに基づいたシステムプロンプトを構築
  const systemPrompt = `${context.personality.system_prompt}

【生徒の情報】
- 生徒ID: ${context.student_id}
${context.grade ? `- 学年: ${context.grade}` : ''}
${context.student_progress ? `- 最近の学習状況: ${JSON.stringify(context.student_progress)}` : ''}

【会話の履歴】
${context.recent_messages.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}
${subjectContext}

【重要な指示】
- あなたは小学生から中学生向けの学習支援AIアシスタントです
${gradeGuide.instructions}
- ${context.personality.emoji_usage ? '絵文字を適度に使って親しみやすく（😊📚✨など）' : '絵文字は使わずに丁寧に'}
- トーン: ${context.personality.tone}
- 質問には段階的に答え、理解を確認しながら進めてください
- まず生徒が自分で考えられるようにヒントを出し、それでもわからなければ詳しく説明
- 励ましの言葉を忘れずに（「よくできたね！」「いい質問だね！」など）
- 学習のモチベーションを高めることを意識してください
- 難しい用語は避け、具体例や身近な例えを使って説明
- 回答は300〜500文字程度で、わかりやすく丁寧に説明してください
- 複雑な内容は段落を分けて、ステップバイステップで説明
- 音声読み上げを考慮し、句読点を適切に配置してください
- 必要に応じて例題や具体例を提示してください`

  // Gemini APIリクエスト
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n生徒の質問: ${userMessage}` }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024  // 512→1024に増加（より詳しい説明が可能）
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates[0]?.content?.parts[0]?.text || 'すみません、もう一度質問していただけますか？ 😊'

  // メッセージタイプを判定
  let message_type = 'text'
  if (userMessage.includes('わからない') || userMessage.includes('教えて') || userMessage.includes('どうやって') || userMessage.includes('なぜ')) {
    message_type = 'problem_help'
  } else if (userMessage.includes('やる気') || userMessage.includes('頑張') || userMessage.includes('モチベ') || userMessage.includes('疲れ')) {
    message_type = 'motivation'
  } else if (userMessage.includes('どうすれば') || userMessage.includes('方法') || userMessage.includes('コツ')) {
    message_type = 'advice'
  } else if (detectedSubject) {
    message_type = `subject_${detectedSubject}`
  }

  return { content, message_type }
}

// 会話履歴を取得
export async function getConversationHistory(
  db: D1Database,
  student_id: number,
  conversation_id?: number,
  limit: number = 10
) {
  let query: string
  let params: any[]

  if (conversation_id) {
    query = `
      SELECT cm.*, cc.conversation_title
      FROM chat_messages cm
      JOIN chat_conversations cc ON cm.conversation_id = cc.id
      WHERE cc.id = ? AND cc.student_id = ?
      ORDER BY cm.created_at DESC
      LIMIT ?
    `
    params = [conversation_id, student_id, limit]
  } else {
    // 最新のアクティブな会話を取得
    query = `
      SELECT cm.*, cc.conversation_title
      FROM chat_messages cm
      JOIN chat_conversations cc ON cm.conversation_id = cc.id
      WHERE cc.student_id = ? AND cc.is_active = 1
      ORDER BY cm.created_at DESC
      LIMIT ?
    `
    params = [student_id, limit]
  }

  const result = await db.prepare(query).bind(...params).all()
  return result.results.reverse() // 古い順に並び替え
}

// 新しい会話を作成
export async function createConversation(
  db: D1Database,
  student_id: number,
  title?: string
) {
  const result = await db.prepare(`
    INSERT INTO chat_conversations (student_id, conversation_title, is_active)
    VALUES (?, ?, 1)
    RETURNING id
  `).bind(student_id, title || '新しい会話').run()

  return result.results[0]?.id
}

// メッセージを保存
export async function saveMessage(
  db: D1Database,
  conversation_id: number,
  role: string,
  content: string,
  message_type: string = 'text',
  metadata?: any
) {
  await db.prepare(`
    INSERT INTO chat_messages (conversation_id, role, content, message_type, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    conversation_id,
    role,
    content,
    message_type,
    metadata ? JSON.stringify(metadata) : null
  ).run()

  // 会話の最終更新時刻を更新
  await db.prepare(`
    UPDATE chat_conversations
    SET last_message_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(conversation_id).run()
}

// 生徒のアシスタント設定を取得
export async function getStudentAssistantSettings(
  db: D1Database,
  student_id: number
) {
  const result = await db.prepare(`
    SELECT sas.*, ap.name, ap.description, ap.system_prompt, ap.tone, ap.emoji_usage
    FROM student_assistant_settings sas
    LEFT JOIN assistant_personalities ap ON sas.personality_id = ap.id
    WHERE sas.student_id = ?
  `).bind(student_id).first()

  if (!result) {
    // デフォルト設定を返す
    const defaultPersonality = await db.prepare(`
      SELECT * FROM assistant_personalities WHERE is_default = 1 LIMIT 1
    `).first()

    return {
      student_id,
      personality_id: defaultPersonality?.id || 1,
      preferred_language: 'ja',
      help_level: 'medium',
      motivation_frequency: 'normal',
      ...defaultPersonality
    }
  }

  return result
}

// FAQを検索
export async function searchFAQ(
  db: D1Database,
  query: string,
  limit: number = 5
) {
  // キーワードで検索
  const keywords = query.split(/\s+/).filter(k => k.length > 1)
  const searchPattern = keywords.map(k => `%${k}%`).join('')

  const result = await db.prepare(`
    SELECT * FROM assistant_faq
    WHERE question LIKE ? OR keywords LIKE ? OR answer LIKE ?
    ORDER BY usage_count DESC
    LIMIT ?
  `).bind(searchPattern, searchPattern, searchPattern, limit).all()

  return result.results
}

// 会話分析を記録
export async function recordChatAnalytics(
  db: D1Database,
  student_id: number,
  question_category: string,
  sentiment?: string,
  response_helpful?: number
) {
  await db.prepare(`
    INSERT INTO chat_analytics (student_id, question_category, sentiment, response_helpful)
    VALUES (?, ?, ?, ?)
  `).bind(student_id, question_category, sentiment || null, response_helpful || null).run()
}

// 生徒の最近の学習状況を取得（コンテキスト用）
export async function getStudentLearningContext(
  db: D1Database,
  student_id: number
) {
  // 最近の学習履歴
  const recentActivity = await db.prepare(`
    SELECT 
      COUNT(*) as total_problems,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
      AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) * 100 as correct_rate
    FROM problem_answers
    WHERE student_id = ? AND answered_at >= datetime('now', '-7 days')
  `).bind(student_id).first()

  // 現在のストリーク
  const streak = await db.prepare(`
    SELECT current_streak FROM students WHERE id = ?
  `).bind(student_id).first()

  // 最近の間違いノート
  const recentMistakes = await db.prepare(`
    SELECT subject, COUNT(*) as count
    FROM mistake_notebook
    WHERE student_id = ? AND is_mastered = 0
    GROUP BY subject
    ORDER BY count DESC
    LIMIT 3
  `).bind(student_id).all()

  return {
    total_problems: recentActivity?.total_problems || 0,
    correct_rate: Math.round(recentActivity?.correct_rate || 0),
    current_streak: streak?.current_streak || 0,
    weak_subjects: recentMistakes.results.map((m: any) => m.subject)
  }
}
