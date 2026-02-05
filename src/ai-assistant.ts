// AI学習アシスタント（チャットボット）モジュール

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  message_type?: string
}

interface ConversationContext {
  student_id: number
  conversation_id: number
  personality: {
    name: string
    system_prompt: string
    tone: string
    emoji_usage: number
  }
  recent_messages: ChatMessage[]
  student_progress?: any
}

// Gemini APIを使ってチャット応答を生成
export async function generateChatResponse(
  context: ConversationContext,
  userMessage: string,
  apiKey: string
): Promise<{ content: string; message_type: string }> {
  
  // コンテキストに基づいたシステムプロンプトを構築
  const systemPrompt = `${context.personality.system_prompt}

【生徒の情報】
- 生徒ID: ${context.student_id}
${context.student_progress ? `- 最近の学習状況: ${JSON.stringify(context.student_progress)}` : ''}

【会話の履歴】
${context.recent_messages.map(m => `${m.role}: ${m.content}`).join('\n')}

【重要な指示】
- 生徒の年齢や学年に合わせた言葉遣いで話してください
- ${context.personality.emoji_usage ? '絵文字を適度に使って親しみやすく' : '絵文字は使わずに丁寧に'}
- トーン: ${context.personality.tone}
- 質問には段階的に答え、理解を確認しながら進めてください
- 励ましの言葉を忘れずに
- 学習のモチベーションを高めることを意識してください`

  // Gemini APIリクエスト
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
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
            parts: [{ text: `${systemPrompt}\n\n生徒: ${userMessage}` }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 1024
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates[0]?.content?.parts[0]?.text || 'すみません、もう一度質問していただけますか？'

  // メッセージタイプを判定
  let message_type = 'text'
  if (userMessage.includes('わからない') || userMessage.includes('教えて')) {
    message_type = 'problem_help'
  } else if (userMessage.includes('やる気') || userMessage.includes('頑張') || userMessage.includes('モチベ')) {
    message_type = 'motivation'
  } else if (userMessage.includes('どうすれば') || userMessage.includes('方法')) {
    message_type = 'advice'
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
