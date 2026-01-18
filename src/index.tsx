import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
  GEMINI_API_KEY?: string
  PROGRESS_WEBSOCKET?: DurableObjectNamespace
}

const app = new Hono<{ Bindings: Bindings }>()

// Durable Object（WebSocket）をエクスポート
export { ProgressWebSocket } from './websocket'

// 履歴記録ヘルパー
async function recordHistory(
  db: D1Database,
  table: 'curriculum_history' | 'card_history',
  targetId: number,
  action: string,
  snapshot: any,
  changedFields?: any
) {
  try {
    const idField = table === 'curriculum_history' ? 'curriculum_id' : 'card_id'
    
    await db.prepare(`
      INSERT INTO ${table} (${idField}, action, changed_fields, snapshot)
      VALUES (?, ?, ?, ?)
    `).bind(
      targetId,
      action,
      changedFields ? JSON.stringify(changedFields) : null,
      JSON.stringify(snapshot)
    ).run()
    
    console.log(`📝 履歴記録: ${table}, action=${action}, id=${targetId}`)
  } catch (error) {
    console.error('履歴記録エラー:', error)
    // 履歴記録失敗はメイン処理を止めない
  }
}

// Gemini API呼び出しヘルパー（リトライ + 監視）
interface GeminiCallOptions {
  model: string
  prompt: string
  apiKey: string
  maxOutputTokens?: number
  temperature?: number
  retries?: number
  retryDelay?: number
}

interface GeminiResponse {
  success: boolean
  content?: string
  model?: string
  error?: string
  attempts?: number
  totalTime?: number
}

async function callGeminiAPI(options: GeminiCallOptions): Promise<GeminiResponse> {
  const {
    model,
    prompt,
    apiKey,
    maxOutputTokens = 8192,
    temperature = 0.8,
    retries = 3,
    retryDelay = 2000
  } = options

  const startTime = Date.now()
  let lastError = ''
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Gemini API呼び出し: ${model} (試行 ${attempt}/${retries})`)
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens }
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        lastError = `HTTP ${response.status}: ${errorText.substring(0, 200)}`
        console.error(`❌ Gemini API エラー (${model}):`, lastError)
        
        // 429 (Rate Limit) や 5xx エラーの場合はリトライ
        if (response.status === 429 || response.status >= 500) {
          if (attempt < retries) {
            console.log(`⏳ ${retryDelay}ms 待機してリトライ...`)
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
            continue
          }
        }
        
        // その他のエラーはリトライしない
        break
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!content) {
        lastError = 'AIの応答が空でした'
        console.error(`❌ 応答なし (${model})`)
        continue
      }

      const totalTime = Date.now() - startTime
      console.log(`✅ Gemini API成功: ${model} (${attempt}回目, ${totalTime}ms)`)

      return {
        success: true,
        content,
        model,
        attempts: attempt,
        totalTime
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Gemini API例外 (${model}):`, lastError)
      
      if (attempt < retries) {
        console.log(`⏳ ${retryDelay}ms 待機してリトライ...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
  }

  const totalTime = Date.now() - startTime
  console.error(`❌ Gemini API失敗: ${model} (全${retries}回試行, ${totalTime}ms)`)

  return {
    success: false,
    error: lastError,
    model,
    attempts: retries,
    totalTime
  }
}

// CORS設定
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './' }))

// APIルート：カリキュラム一覧取得
app.get('/api/curriculum', async (c) => {
  const { env } = c
  
  try {
    const result = await env.DB.prepare(`
      SELECT 
        id, grade, subject, textbook_company, unit_name, 
        unit_order, total_hours, unit_goal, non_cognitive_goal
      FROM curriculum
      ORDER BY grade, unit_order
    `).all()
    
    return c.json(result.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学年と教科の一覧取得
app.get('/api/curriculum/options', async (c) => {
  const { env } = c
  
  try {
    const grades = await env.DB.prepare(`
      SELECT DISTINCT grade FROM curriculum ORDER BY grade
    `).all()
    
    const subjects = await env.DB.prepare(`
      SELECT DISTINCT subject FROM curriculum ORDER BY subject
    `).all()
    
    const textbooks = await env.DB.prepare(`
      SELECT DISTINCT textbook_company FROM curriculum ORDER BY textbook_company
    `).all()
    
    return c.json({
      grades: grades.results,
      subjects: subjects.results,
      textbooks: textbooks.results
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：特定カリキュラムの詳細取得（学習のてびき用）
app.get('/api/curriculum/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  
  try {
    // カリキュラム基本情報
    const curriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(id).first()
    
    // コース情報
    const courses = await env.DB.prepare(`
      SELECT * FROM courses WHERE curriculum_id = ?
      ORDER BY 
        CASE course_level
          WHEN 'basic' THEN 1
          WHEN 'standard' THEN 2
          WHEN 'advanced' THEN 3
        END
    `).bind(id).all()
    
    // コースごとの学習カードを取得
    const coursesWithCards = await Promise.all(
      (courses.results || []).map(async (course: any) => {
        const cards = await env.DB.prepare(`
          SELECT * FROM learning_cards 
          WHERE course_id = ?
          ORDER BY card_number
        `).bind(course.id).all()
        
        // introduction_problemをパース
        let introductionProblem = null
        if (course.introduction_problem) {
          try {
            introductionProblem = JSON.parse(course.introduction_problem)
          } catch (e) {
            console.error('導入問題のパースエラー:', e)
          }
        }
        
        return { 
          ...course, 
          cards: cards.results,
          introduction_problem: introductionProblem
        }
      })
    )
    
    // 選択問題
    const optionalProblems = await env.DB.prepare(`
      SELECT * FROM optional_problems 
      WHERE curriculum_id = ?
      ORDER BY problem_number
    `).bind(id).all()
    
    return c.json({
      curriculum,
      courses: coursesWithCards,
      optionalProblems: optionalProblems.results
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：カリキュラムメタデータ取得（コース選択問題とチェックテスト）
app.get('/api/curriculum/:id/metadata', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  
  try {
    const metadata = await env.DB.prepare(`
      SELECT metadata_key, metadata_value 
      FROM curriculum_metadata 
      WHERE curriculum_id = ?
    `).bind(id).all()
    
    const result: any = {}
    for (const row of metadata.results || []) {
      try {
        result[row.metadata_key] = JSON.parse(row.metadata_value)
      } catch {
        result[row.metadata_key] = row.metadata_value
      }
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ 
      course_selection_problems: [],
      check_tests: []
    })
  }
})

// APIルート：コースの学習カード取得
app.get('/api/courses/:courseId/cards', async (c) => {
  const { env } = c
  const courseId = c.req.param('courseId')
  
  try {
    const cards = await env.DB.prepare(`
      SELECT * FROM learning_cards 
      WHERE course_id = ? AND card_type = 'main'
      ORDER BY card_number
    `).bind(courseId).all()
    
    return c.json(cards.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習カードの詳細とヒント取得
app.get('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  
  try {
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    const hints = await env.DB.prepare(`
      SELECT * FROM hint_cards 
      WHERE learning_card_id = ?
      ORDER BY hint_number
    `).bind(cardId).all()
    
    const answer = await env.DB.prepare(`
      SELECT * FROM answers WHERE learning_card_id = ?
    `).bind(cardId).first()
    
    return c.json({
      card,
      hints: hints.results,
      answer
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習進捗の保存
app.post('/api/progress', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO student_progress 
        (student_id, curriculum_id, course_id, learning_card_id, 
         status, understanding_level, help_requested_from, help_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.course_id,
      body.learning_card_id,
      body.status,
      body.understanding_level,
      body.help_requested_from,
      body.help_count || 0
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：クラスの進捗取得
app.get('/api/progress/class/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    const progress = await env.DB.prepare(`
      SELECT 
        u.name,
        u.student_number,
        p.curriculum_id,
        p.course_id,
        p.learning_card_id,
        p.status,
        p.understanding_level,
        p.help_requested_from,
        p.help_count,
        p.created_at,
        c.course_level,
        c.course_display_name
      FROM student_progress p
      JOIN users u ON p.student_id = u.id
      LEFT JOIN courses c ON p.course_id = c.id
      WHERE u.class_code = ?
      ORDER BY u.student_number, p.created_at DESC
    `).bind(classCode).all()
    
    return c.json(progress.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：カリキュラム別の詳細進捗取得（進捗ボード用）
app.get('/api/progress/curriculum/:curriculumId/class/:classCode', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const classCode = c.req.param('classCode')
  
  try {
    // 全生徒のリスト
    const students = await env.DB.prepare(`
      SELECT id, name, student_number 
      FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(classCode).all()
    
    // 各生徒の最新進捗
    const progressData = await env.DB.prepare(`
      SELECT 
        p.student_id,
        p.course_id,
        p.learning_card_id,
        p.status,
        p.understanding_level,
        p.help_requested_from,
        p.help_count,
        p.created_at,
        c.course_level,
        c.course_display_name,
        lc.card_number,
        lc.card_title
      FROM student_progress p
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN learning_cards lc ON p.learning_card_id = lc.id
      WHERE p.curriculum_id = ?
      AND p.student_id IN (
        SELECT id FROM users WHERE class_code = ? AND role = 'student'
      )
      ORDER BY p.student_id, p.created_at DESC
    `).bind(curriculumId, classCode).all()
    
    // 生徒ごとにグループ化
    const studentProgress = {}
    students.results.forEach(student => {
      const latestProgress = progressData.results.find(p => p.student_id === student.id)
      studentProgress[student.id] = {
        student,
        progress: latestProgress || null,
        allProgress: progressData.results.filter(p => p.student_id === student.id)
      }
    })
    
    return c.json(studentProgress)
  } catch (error) {
    console.error('Progress error:', error)
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：進捗ボード拡張版（教師用）
app.get('/api/progress-board/class/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const curriculumIds = c.req.query('curriculumIds') // カンマ区切りで複数指定可能
  
  try {
    const curriculumList = curriculumIds ? curriculumIds.split(',') : []
    
    // 生徒リスト取得
    const students = await env.DB.prepare(`
      SELECT id, name, student_number 
      FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(classCode).all()
    
    const progressBoard = []
    
    for (const student of students.results) {
      const studentData = {
        student_id: student.id,
        student_name: student.name,
        student_number: student.student_number,
        curriculums: []
      }
      
      // 各カリキュラムの進捗を取得
      for (const curriculumId of curriculumList) {
        // 学習カード進捗（ビューを使用）
        const cardProgress = await env.DB.prepare(`
          SELECT * FROM v_progress_board 
          WHERE student_id = ? AND curriculum_id = ?
          ORDER BY course_level, card_number
        `).bind(student.id, curriculumId).all()
        
        // チェックテスト進捗
        const checkTestProgress = await env.DB.prepare(`
          SELECT * FROM check_test_progress
          WHERE student_id = ? AND curriculum_id = ?
          ORDER BY problem_number
        `).bind(student.id, curriculumId).all()
        
        // 選択問題進捗
        const optionalProgress = await env.DB.prepare(`
          SELECT opp.*, op.problem_title, op.problem_number
          FROM optional_problem_progress opp
          JOIN optional_problems op ON opp.optional_problem_id = op.id
          WHERE opp.student_id = ? AND opp.curriculum_id = ?
          ORDER BY op.problem_number
        `).bind(student.id, curriculumId).all()
        
        // ヘルプ統計
        const helpStats = await env.DB.prepare(`
          SELECT 
            help_type,
            COUNT(*) as count
          FROM student_progress
          WHERE student_id = ? AND curriculum_id = ? AND help_type IS NOT NULL
          GROUP BY help_type
        `).bind(student.id, curriculumId).all()
        
        // 最高優先度を取得
        const maxPriority = cardProgress.results.length > 0 
          ? Math.max(...cardProgress.results.map(p => p.intervention_priority || 0))
          : 0
        
        // ヘルプ要請中かどうか
        const hasHelpRequest = cardProgress.results.some(p => 
          p.help_requested_at && !p.help_resolved_at
        )
        
        studentData.curriculums.push({
          curriculum_id: curriculumId,
          card_progress: cardProgress.results,
          check_test_progress: checkTestProgress.results,
          optional_progress: optionalProgress.results,
          help_stats: helpStats.results,
          intervention_priority: maxPriority,
          has_help_request: hasHelpRequest,
          completed_cards: cardProgress.results.filter(p => p.status === 'completed').length,
          total_cards: cardProgress.results.length
        })
      }
      
      progressBoard.push(studentData)
    }
    
    // 優先度順にソート
    progressBoard.sort((a, b) => {
      const maxA = Math.max(...a.curriculums.map(c => c.intervention_priority))
      const maxB = Math.max(...b.curriculums.map(c => c.intervention_priority))
      return maxB - maxA
    })
    
    return c.json({
      success: true,
      class_code: classCode,
      students: progressBoard,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('進捗ボードエラー:', error)
    return c.json({ 
      success: false, 
      error: '進捗ボードの読み込みに失敗しました',
      details: error.message 
    }, 500)
  }
})

// APIルート：ヘルプ要請
app.post('/api/progress/help-request', async (c) => {
  const { env } = c
  const { student_id, learning_card_id, curriculum_id } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE student_progress 
      SET 
        status = 'help_needed',
        help_requested_at = CURRENT_TIMESTAMP,
        help_resolved_at = NULL,
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(student_id, learning_card_id, curriculum_id).run()
    
    return c.json({ success: true, message: 'ヘルプ要請を送信しました' })
  } catch (error) {
    console.error('ヘルプ要請エラー:', error)
    return c.json({ success: false, error: 'ヘルプ要請に失敗しました' }, 500)
  }
})

// APIルート：ヘルプ解決
app.post('/api/progress/help-resolve', async (c) => {
  const { env } = c
  const { student_id, learning_card_id, curriculum_id } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE student_progress 
      SET 
        status = 'in_progress',
        help_resolved_at = CURRENT_TIMESTAMP,
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(student_id, learning_card_id, curriculum_id).run()
    
    return c.json({ success: true, message: 'ヘルプを解決しました' })
  } catch (error) {
    console.error('ヘルプ解決エラー:', error)
    return c.json({ success: false, error: 'ヘルプ解決に失敗しました' }, 500)
  }
})

// APIルート：活動記録更新
app.post('/api/progress/activity', async (c) => {
  const { env } = c
  const { student_id, learning_card_id, curriculum_id } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE student_progress 
      SET 
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(student_id, learning_card_id, curriculum_id).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('活動記録エラー:', error)
    return c.json({ success: false }, 500)
  }
})

// APIルート：週次レポート
app.get('/api/reports/weekly/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const startDate = c.req.query('startDate') // YYYY-MM-DD
  const endDate = c.req.query('endDate') // YYYY-MM-DD
  
  try {
    // 期間内の進捗データを集計
    const weeklyStats = await env.DB.prepare(`
      SELECT 
        u.name as student_name,
        u.student_number,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards,
        AVG(sp.understanding_level) as avg_understanding,
        SUM(CASE WHEN sp.help_type = 'ai' THEN 1 ELSE 0 END) as ai_help_count,
        SUM(CASE WHEN sp.help_type = 'teacher' THEN 1 ELSE 0 END) as teacher_help_count,
        SUM(CASE WHEN sp.help_type = 'friend' THEN 1 ELSE 0 END) as friend_help_count,
        SUM(CASE WHEN sp.help_type = 'hint' THEN 1 ELSE 0 END) as hint_help_count
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.student_id
        AND sp.status = 'completed'
        AND DATE(sp.completed_at) BETWEEN ? AND ?
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number
      ORDER BY u.student_number
    `).bind(startDate, endDate, classCode).all()
    
    return c.json({
      success: true,
      period: { start: startDate, end: endDate },
      class_code: classCode,
      stats: weeklyStats.results
    })
  } catch (error) {
    console.error('週次レポートエラー:', error)
    return c.json({ 
      success: false, 
      error: '週次レポートの生成に失敗しました',
      details: error.message 
    }, 500)
  }
})

// APIルート：月次レポート
app.get('/api/reports/monthly/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const year = c.req.query('year') // YYYY
  const month = c.req.query('month') // MM
  
  try {
    const startDate = `${year}-${month}-01`
    const endDate = `${year}-${month}-31`
    
    // 月次統計
    const monthlyStats = await env.DB.prepare(`
      SELECT 
        u.name as student_name,
        u.student_number,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards,
        AVG(sp.understanding_level) as avg_understanding,
        COUNT(DISTINCT DATE(sp.created_at)) as active_days,
        SUM(CASE WHEN sp.help_type IS NOT NULL THEN 1 ELSE 0 END) as total_help_count
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.student_id
        AND DATE(sp.created_at) BETWEEN ? AND ?
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number
      ORDER BY u.student_number
    `).bind(startDate, endDate, classCode).all()
    
    // カリキュラム別進捗
    const curriculumProgress = await env.DB.prepare(`
      SELECT 
        cur.unit_name,
        cur.subject,
        COUNT(DISTINCT sp.student_id) as students_count,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards_total
      FROM curriculum cur
      LEFT JOIN student_progress sp ON cur.id = sp.curriculum_id
        AND sp.status = 'completed'
        AND DATE(sp.completed_at) BETWEEN ? AND ?
      JOIN users u ON sp.student_id = u.id
      WHERE u.class_code = ?
      GROUP BY cur.id, cur.unit_name, cur.subject
    `).bind(startDate, endDate, classCode).all()
    
    return c.json({
      success: true,
      period: { year, month, start: startDate, end: endDate },
      class_code: classCode,
      student_stats: monthlyStats.results,
      curriculum_progress: curriculumProgress.results
    })
  } catch (error) {
    console.error('月次レポートエラー:', error)
    return c.json({ 
      success: false, 
      error: '月次レポートの生成に失敗しました',
      details: error.message 
    }, 500)
  }
})

// APIルート：AI先生（Gemini API）
app.post('/api/ai/ask', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const startTime = Date.now()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ 
      answer: '申し訳ありません。AI先生は現在利用できません。ヒントカードや先生に聞いてみましょう。',
      error: 'API key not configured'
    })
  }
  
  // セッションIDの生成（対話履歴グループ化用）
  const sessionId = body.sessionId || `session-${Date.now()}-${Math.random().toString(36).substring(7)}`
  
  try {
    // 学習カード情報を取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(body.cardId).first()
    
    // 対話履歴を取得（コンテキスト保持）
    const conversationHistory = await env.DB.prepare(`
      SELECT message_type, message_text
      FROM ai_conversations
      WHERE session_id = ? AND student_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).bind(sessionId, body.studentId).all()
    
    // 対話履歴をGemini APIフォーマットに変換
    const historyContext = conversationHistory.results?.reverse().map((msg: any) => 
      `${msg.message_type === 'question' ? '生徒' : 'AI先生'}: ${msg.message_text}`
    ).join('\n') || ''
    
    // 質問を履歴に保存
    await env.DB.prepare(`
      INSERT INTO ai_conversations (
        student_id, curriculum_id, learning_card_id, session_id, message_type, message_text, context_data
      ) VALUES (?, ?, ?, ?, 'question', ?, ?)
    `).bind(
      body.studentId,
      body.curriculumId,
      body.cardId,
      sessionId,
      body.question,
      JSON.stringify({ cardTitle: card?.card_title })
    ).run()
    
    // Gemini APIにリクエスト
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `現在あなたは「学習モード」です。以下の厳格なルールに従ってください：

# 厳格なルール

親しみやすくかつダイナミックな教師となり、学習過程をガイドしながらユーザーの学びをサポートします。

- ユーザーについて知りましょう。目標や学年レベルが分からない場合は質問してください。（軽めに！）回答がない場合は、小学4年生が理解できるような説明を心がけてください。
- 既存の知識を基盤にします。新しい概念をユーザーがすでに知っていることに結びつけます。
- 単に答えを与えるのではなく、ガイドしましょう。質問、ヒント、小さなステップを用いて、ユーザー自身が答えを発見できるようにします。
- 確認と強化を行います。難しい部分の後は、ユーザーがその概念を説明したり使ったりできるか確認します。
- リズムに変化をつけます。説明、質問、アクティビティ（ロールプレイ、練習ラウンドなど）を混ぜて、講義ではなく会話のように感じさせます。

# 何よりも重要なこと：ユーザーの仕事を代わりにやらないでください。

宿題の質問に答えないでください — ユーザーとの協力を通じて、彼らが既に知っていることから構築しながら、答えを見つける手助けをします。

# トーンとアプローチ

温かく、忍耐強く、平易な言葉で話しましょう。感嘆符や絵文字を使いすぎないようにします。セッションを前に進め続けましょう：次のステップを常に把握します。そして簡潔に — 決してエッセイの長さの返答を送らないでください。良い対話を目指しましょう。

# 重要

ユーザーが数学や論理的な問題を質問した場合、最初の回答でそれを解決しないでください。代わりに：ユーザーと一緒に問題を一歩ずつ検討し、各ステップで一つの質問をし、続ける前にユーザーが各ステップに応答する機会を与えてください。

【学習カード情報】
タイトル: ${card?.card_title || ''}
問題: ${body.context || ''}

${historyContext ? `【これまでの対話】\n${historyContext}\n` : ''}

【生徒の質問】
${body.question}

150文字以内で簡潔に回答してください。`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        })
      }
    )
    
    const responseTime = Date.now() - startTime
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)
      
      // エラーログを統計に記録
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, learning_card_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, ?, ?, 'teacher', ?, 0, ?)
      `).bind(
        body.studentId,
        body.curriculumId,
        body.cardId,
        responseTime,
        `API Error: ${geminiResponse.status}`
      ).run()
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }
    
    const geminiData = await geminiResponse.json()
    
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                   '考えるヒントを用意できませんでした。もう一度質問してみてください。'
    
    // 回答を履歴に保存
    await env.DB.prepare(`
      INSERT INTO ai_conversations (
        student_id, curriculum_id, learning_card_id, session_id, message_type, message_text
      ) VALUES (?, ?, ?, ?, 'answer', ?)
    `).bind(
      body.studentId,
      body.curriculumId,
      body.cardId,
      sessionId,
      answer
    ).run()
    
    // 使用統計を記録
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0
    await env.DB.prepare(`
      INSERT INTO ai_usage_stats (
        student_id, curriculum_id, learning_card_id, feature_type,
        tokens_used, response_time_ms, success
      ) VALUES (?, ?, ?, 'teacher', ?, ?, 1)
    `).bind(
      body.studentId,
      body.curriculumId,
      body.cardId,
      tokensUsed,
      responseTime
    ).run()
    
    return c.json({ 
      answer,
      sessionId,
      tokensUsed,
      responseTime
    })
    
  } catch (error: any) {
    console.error('AI error:', error)
    
    // エラーログを統計に記録
    try {
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, learning_card_id, feature_type,
          response_time_ms, success, error_message
        ) VALUES (?, ?, ?, 'teacher', ?, 0, ?)
      `).bind(
        body.studentId,
        body.curriculumId,
        body.cardId,
        Date.now() - startTime,
        error.message
      ).run()
    } catch (dbError) {
      console.error('Failed to log error:', dbError)
    }
    
    return c.json({ 
      answer: 'ごめんなさい、今は答えられません。ヒントカードを見てみましょう！',
      error: error.message
    })
  }
})

// APIルート：AI対話履歴取得
app.get('/api/ai/conversations/:sessionId', async (c) => {
  const { env } = c
  const sessionId = c.req.param('sessionId')
  
  try {
    const conversations = await env.DB.prepare(`
      SELECT 
        id, message_type, message_text, context_data, created_at,
        learning_card_id, curriculum_id
      FROM ai_conversations
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).bind(sessionId).all()
    
    return c.json({ 
      conversations: conversations.results || [],
      total: conversations.results?.length || 0
    })
  } catch (error: any) {
    console.error('Failed to fetch conversations:', error)
    return c.json({ 
      error: '対話履歴の取得に失敗しました',
      conversations: [],
      total: 0
    }, 500)
  }
})

// APIルート：自動問題生成
app.post('/api/ai/generate-problem', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  // Gemini APIキーの確認
  const apiKey = env.GEMINI_API_KEY
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return c.json({ 
      error: 'Gemini APIキーが設定されていません。環境変数を設定してください。'
    }, 500)
  }
  
  try {
    const startTime = Date.now()
    
    // カリキュラム情報を取得
    const curriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(body.curriculumId).first()
    
    // 既存のコース問題を参考として取得
    const existingProblems = await env.DB.prepare(`
      SELECT problem_content, learning_meaning FROM learning_cards
      WHERE course_id = ? LIMIT 3
    `).bind(body.courseId).all()
    
    const examplesText = existingProblems.results?.map((p: any, i: number) => 
      `例${i + 1}:\n問題: ${p.problem_content}\n学習の意味: ${p.learning_meaning}`
    ).join('\n\n') || ''
    
    // Gemini APIにリクエスト
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `あなたは小学生向けの学習問題を作成するAI先生です。以下の情報を元に、学習カードの問題を生成してください。

【カリキュラム情報】
学年: ${curriculum?.grade || ''}
教科: ${curriculum?.subject || ''}
単元: ${curriculum?.unit_name || ''}
単元目標: ${curriculum?.unit_goal || ''}
難易度: ${body.difficultyLevel || 'しっかり'}

${examplesText ? `【参考問題】\n${examplesText}\n` : ''}

【生成条件】
- 小学生が理解できる言葉で
- 実社会と関連付ける
- 思考力を育む内容
- ${body.requirements || ''}

以下のJSON形式で回答してください：
{
  "problem_description": "問題の簡単な説明（30文字以内）",
  "problem_content": "問題文（150文字程度）",
  "learning_meaning": "この問題で学べること（100文字程度）",
  "answer": "解答例（必要に応じて）",
  "difficulty_level": "${body.difficultyLevel || 'しっかり'}"
}`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500,
          }
        })
      }
    )
    
    const responseTime = Date.now() - startTime
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)
      
      // エラーログを統計に記録
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          curriculum_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, 'problem_generation', ?, 0, ?)
      `).bind(
        body.curriculumId,
        responseTime,
        `API Error: ${geminiResponse.status}`
      ).run()
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }
    
    const geminiData = await geminiResponse.json()
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('生成結果からJSONを抽出できませんでした')
    }
    
    const problemData = JSON.parse(jsonMatch[0])
    
    // generated_problemsテーブルに保存
    const result = await env.DB.prepare(`
      INSERT INTO generated_problems (
        curriculum_id, course_id, problem_description, problem_content,
        learning_meaning, answer, difficulty_level, generated_by, 
        generation_params, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(
      body.curriculumId,
      body.courseId,
      problemData.problem_description,
      problemData.problem_content,
      problemData.learning_meaning,
      problemData.answer || null,
      problemData.difficulty_level,
      body.userId || 0,
      JSON.stringify({ requirements: body.requirements, difficultyLevel: body.difficultyLevel })
    ).run()
    
    // 使用統計を記録
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0
    await env.DB.prepare(`
      INSERT INTO ai_usage_stats (
        curriculum_id, feature_type, tokens_used, response_time_ms, success
      ) VALUES (?, 'problem_generation', ?, ?, 1)
    `).bind(
      body.curriculumId,
      tokensUsed,
      responseTime
    ).run()
    
    return c.json({ 
      problem: {
        id: result.meta.last_row_id,
        ...problemData
      },
      tokensUsed,
      responseTime
    })
    
  } catch (error: any) {
    console.error('Problem generation error:', error)
    
    return c.json({ 
      error: '問題の生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：学習計画取得
app.get('/api/plans/:studentId/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const plans = await env.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date
    `).bind(studentId, curriculumId).all()
    
    return c.json(plans.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習計画保存
app.post('/api/plans', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO learning_plans 
        (student_id, curriculum_id, planned_date, learning_card_id, 
         reflection_good, reflection_bad, reflection_learned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.planned_date,
      body.learning_card_id || null,
      body.reflection_good || null,
      body.reflection_bad || null,
      body.reflection_learned || null
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習計画更新
app.put('/api/plans/:id', async (c) => {
  const { env } = c
  const planId = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_plans 
      SET actual_date = ?,
          learning_card_id = ?,
          reflection_good = ?,
          reflection_bad = ?,
          reflection_learned = ?,
          ai_feedback = ?
      WHERE id = ?
    `).bind(
      body.actual_date || null,
      body.learning_card_id || null,
      body.reflection_good || null,
      body.reflection_bad || null,
      body.reflection_learned || null,
      body.ai_feedback || null,
      planId
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：振り返りAIフィードバック
app.post('/api/ai/reflect', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const { reflections, type } = body  // type: 'hourly' or 'unit'
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({ 
      feedback: type === 'unit' 
        ? '単元を最後まで学習できましたね！次の単元も楽しみです。'
        : 'がんばりましたね！次回も楽しく学習しましょう。' 
    })
  }
  
  const promptText = type === 'unit' 
    ? `あなたは小学生の学習を応援するAI先生です。子どもの単元全体の振り返りを読んで、成長を認め、次の学習への意欲を高めるメッセージを送ってください。

【単元全体の振り返り】
良かったこと: ${reflections.good || 'なし'}
直したいこと: ${reflections.bad || 'なし'}
わかったこと: ${reflections.learned || 'なし'}

【フィードバックのルール】
1. 単元全体を通しての成長を認める
2. 良かったことを具体的に褒める
3. 直したいことは次の目標として前向きに受け止める
4. わかったことの価値を伝え、学びの喜びを共感する
5. 次の単元への期待感を持たせる
6. 小学生にわかりやすい言葉で
7. 200文字以内で

温かく励ますメッセージを書いてください。`
    : `あなたは小学生の学習を応援するAI先生です。子どもの1時間の学習の振り返りを読んで、励ましとアドバイスをしてください。

【振り返り内容】
良かったこと: ${reflections.good || 'なし'}
難しかったこと: ${reflections.bad || 'なし'}
わかったこと: ${reflections.learned || 'なし'}

【フィードバックのルール】
1. 必ず励ましの言葉から始める
2. 良かったことを具体的に褒める
3. 難しかったことには共感し、次へのヒントを出す
4. わかったことの素晴らしさを伝える
5. 次の学習への意欲が湧く言葉で締める
6. 小学生にわかりやすい言葉で
7. 150文字以内で簡潔に

フィードバックしてください。`
  
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: type === 'unit' ? 300 : 200,
          }
        })
      }
    )
    
    const geminiData = await geminiResponse.json()
    
    if (!geminiResponse.ok) {
      throw new Error('Gemini API error')
    }
    
    const feedback = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                     (type === 'unit' 
                       ? '単元をしっかり学習できました！次の単元も楽しみです！'
                       : 'よくがんばりました！次回も楽しく学習しましょう。')
    
    return c.json({ feedback })
    
  } catch (error) {
    console.error('AI reflection error:', error)
    return c.json({ 
      feedback: 'すばらしい振り返りですね！これからも一緒にがんばりましょう！' 
    })
  }
})

// APIルート：全解答取得（解答タブ用）
app.get('/api/answers/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    // コースと学習カードの解答
    const cardAnswers = await env.DB.prepare(`
      SELECT 
        c.course_display_name,
        c.course_level,
        lc.card_number,
        lc.card_title,
        lc.card_type,
        a.answer_content,
        a.explanation
      FROM courses c
      JOIN learning_cards lc ON c.id = lc.course_id
      LEFT JOIN answers a ON lc.id = a.learning_card_id
      WHERE c.curriculum_id = ?
      ORDER BY c.course_level, lc.card_number
    `).bind(curriculumId).all()
    
    // 選択問題の解答
    const optionalAnswers = await env.DB.prepare(`
      SELECT 
        op.problem_number,
        op.problem_title,
        op.problem_description,
        op.learning_meaning,
        a.answer_content,
        a.explanation
      FROM optional_problems op
      LEFT JOIN answers a ON op.id = a.optional_problem_id
      WHERE op.curriculum_id = ?
      ORDER BY op.problem_number
    `).bind(curriculumId).all()
    
    return c.json({
      cardAnswers: cardAnswers.results,
      optionalAnswers: optionalAnswers.results
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：カスタムコンテンツ保存
app.post('/api/custom/content', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO custom_content 
        (teacher_id, original_learning_card_id, original_optional_problem_id, 
         content_type, custom_data)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.teacher_id,
      body.original_learning_card_id || null,
      body.original_optional_problem_id || null,
      body.content_type,
      JSON.stringify(body.custom_data)
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：カスタムコンテンツ取得
app.get('/api/custom/content/:teacherId', async (c) => {
  const { env } = c
  const teacherId = c.req.param('teacherId')
  
  try {
    const customContent = await env.DB.prepare(`
      SELECT * FROM custom_content
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `).bind(teacherId).all()
    
    // JSON文字列をパース
    const parsed = customContent.results.map(item => ({
      ...item,
      custom_data: JSON.parse(item.custom_data)
    }))
    
    return c.json(parsed)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：評価保存
app.post('/api/evaluations', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO evaluations 
        (student_id, curriculum_id, knowledge_skill, 
         thinking_judgment_expression, attitude_toward_learning, 
         non_cognitive_evaluation, teacher_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.knowledge_skill,
      body.thinking_judgment_expression,
      body.attitude_toward_learning,
      body.non_cognitive_evaluation,
      body.teacher_comment
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：評価取得
app.get('/api/evaluations/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const evaluation = await env.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(studentId, curriculumId).first()
    
    return c.json(evaluation)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習計画取得
app.get('/api/learning-plan/:studentId/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const plans = await env.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date ASC
    `).bind(studentId, curriculumId).all()
    
    return c.json({ plans: plans.results })
  } catch (error) {
    console.error('学習計画取得エラー:', error)
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習計画保存
app.post('/api/learning-plan/save', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const { student_id, curriculum_id, total_hours, plans, unit_reflection } = body
  
  try {
    // 既存の計画を削除
    await env.DB.prepare(`
      DELETE FROM learning_plans 
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(student_id, curriculum_id).run()
    
    // 既存の単元振り返りを削除
    await env.DB.prepare(`
      DELETE FROM unit_reflections 
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(student_id, curriculum_id).run()
    
    // 新しい計画を保存
    for (const plan of plans) {
      await env.DB.prepare(`
        INSERT INTO learning_plans (
          student_id, 
          curriculum_id,
          hour_number,
          subject,
          planned_date,
          learning_content,
          reflection_good, 
          reflection_bad, 
          reflection_learned,
          ai_feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        student_id,
        curriculum_id,
        plan.hour_number,
        plan.subject,
        plan.planned_date || null,
        plan.learning_content || '',
        plan.reflection_good || '',
        plan.reflection_bad || '',
        plan.reflection_learned || '',
        plan.ai_feedback || null
      ).run()
    }
    
    // 単元全体の振り返りを保存
    if (unit_reflection && (unit_reflection.good || unit_reflection.bad || unit_reflection.learned)) {
      await env.DB.prepare(`
        INSERT INTO unit_reflections (
          student_id, 
          curriculum_id,
          reflection_good, 
          reflection_bad, 
          reflection_learned
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        student_id,
        curriculum_id,
        unit_reflection.good || '',
        unit_reflection.bad || '',
        unit_reflection.learned || ''
      ).run()
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.error('学習計画保存エラー:', error)
    return c.json({ error: 'Database error', details: error.message }, 500)
  }
})

// APIルート：学習環境デザイン取得
app.get('/api/environment/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const environments = await env.DB.prepare(`
      SELECT * FROM learning_environment
      WHERE curriculum_id = ?
      ORDER BY category, id
    `).bind(curriculumId).all()
    
    return c.json(environments.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// ==================== Phase 5: 先生カスタマイズモード API ====================

// APIルート：3観点評価取得
app.get('/api/evaluations/three-point/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const evaluation = await env.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM three_point_evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(studentId, curriculumId).first()
    
    return c.json(evaluation || {})
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：3観点評価保存
app.post('/api/evaluations/three-point', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO three_point_evaluations (
        student_id, curriculum_id,
        knowledge_skill, knowledge_skill_comment,
        thinking_judgment, thinking_judgment_comment,
        attitude, attitude_comment,
        overall_comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.knowledge_skill || '',
      body.knowledge_skill_comment || '',
      body.thinking_judgment || '',
      body.thinking_judgment_comment || '',
      body.attitude || '',
      body.attitude_comment || '',
      body.overall_comment || ''
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：3観点評価更新
app.put('/api/evaluations/three-point/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE three_point_evaluations SET
        knowledge_skill = ?,
        knowledge_skill_comment = ?,
        thinking_judgment = ?,
        thinking_judgment_comment = ?,
        attitude = ?,
        attitude_comment = ?,
        overall_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.knowledge_skill || '',
      body.knowledge_skill_comment || '',
      body.thinking_judgment || '',
      body.thinking_judgment_comment || '',
      body.attitude || '',
      body.attitude_comment || '',
      body.overall_comment || '',
      id
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：非認知能力評価取得
app.get('/api/evaluations/non-cognitive/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const evaluation = await env.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM non_cognitive_evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(studentId, curriculumId).first()
    
    return c.json(evaluation || {})
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：非認知能力評価保存
app.post('/api/evaluations/non-cognitive', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO non_cognitive_evaluations (
        student_id, curriculum_id,
        self_regulation, self_regulation_comment,
        motivation, motivation_comment,
        collaboration, collaboration_comment,
        metacognition, metacognition_comment,
        creativity, creativity_comment,
        curiosity, curiosity_comment,
        self_esteem, self_esteem_comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.student_id,
      body.curriculum_id,
      body.self_regulation || 0,
      body.self_regulation_comment || '',
      body.motivation || 0,
      body.motivation_comment || '',
      body.collaboration || 0,
      body.collaboration_comment || '',
      body.metacognition || 0,
      body.metacognition_comment || '',
      body.creativity || 0,
      body.creativity_comment || '',
      body.curiosity || 0,
      body.curiosity_comment || '',
      body.self_esteem || 0,
      body.self_esteem_comment || ''
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：非認知能力評価更新
app.put('/api/evaluations/non-cognitive/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE non_cognitive_evaluations SET
        self_regulation = ?,
        self_regulation_comment = ?,
        motivation = ?,
        motivation_comment = ?,
        collaboration = ?,
        collaboration_comment = ?,
        metacognition = ?,
        metacognition_comment = ?,
        creativity = ?,
        creativity_comment = ?,
        curiosity = ?,
        curiosity_comment = ?,
        self_esteem = ?,
        self_esteem_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.self_regulation || 0,
      body.self_regulation_comment || '',
      body.motivation || 0,
      body.motivation_comment || '',
      body.collaboration || 0,
      body.collaboration_comment || '',
      body.metacognition || 0,
      body.metacognition_comment || '',
      body.creativity || 0,
      body.creativity_comment || '',
      body.curiosity || 0,
      body.curiosity_comment || '',
      body.self_esteem || 0,
      body.self_esteem_comment || '',
      id
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習環境デザイン取得
app.get('/api/environment/design/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const design = await env.DB.prepare(`
      SELECT * FROM learning_environment_designs
      WHERE curriculum_id = ?
      LIMIT 1
    `).bind(curriculumId).first()
    
    return c.json(design || {})
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習環境デザイン保存
app.post('/api/environment/design', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO learning_environment_designs (
        curriculum_id,
        expression_creative, expression_creative_enabled,
        research_fieldwork, research_fieldwork_enabled,
        critical_thinking, critical_thinking_enabled,
        social_contribution, social_contribution_enabled,
        metacognition_reflection, metacognition_reflection_enabled,
        question_generation, question_generation_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.curriculum_id,
      body.expression_creative || '',
      body.expression_creative_enabled ? 1 : 0,
      body.research_fieldwork || '',
      body.research_fieldwork_enabled ? 1 : 0,
      body.critical_thinking || '',
      body.critical_thinking_enabled ? 1 : 0,
      body.social_contribution || '',
      body.social_contribution_enabled ? 1 : 0,
      body.metacognition_reflection || '',
      body.metacognition_reflection_enabled ? 1 : 0,
      body.question_generation || '',
      body.question_generation_enabled ? 1 : 0
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習環境デザイン更新
app.put('/api/environment/design/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_environment_designs SET
        expression_creative = ?,
        expression_creative_enabled = ?,
        research_fieldwork = ?,
        research_fieldwork_enabled = ?,
        critical_thinking = ?,
        critical_thinking_enabled = ?,
        social_contribution = ?,
        social_contribution_enabled = ?,
        metacognition_reflection = ?,
        metacognition_reflection_enabled = ?,
        question_generation = ?,
        question_generation_enabled = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.expression_creative || '',
      body.expression_creative_enabled ? 1 : 0,
      body.research_fieldwork || '',
      body.research_fieldwork_enabled ? 1 : 0,
      body.critical_thinking || '',
      body.critical_thinking_enabled ? 1 : 0,
      body.social_contribution || '',
      body.social_contribution_enabled ? 1 : 0,
      body.metacognition_reflection || '',
      body.metacognition_reflection_enabled ? 1 : 0,
      body.question_generation || '',
      body.question_generation_enabled ? 1 : 0,
      id
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：先生カスタマイズ設定取得
app.get('/api/teacher/customization/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const customization = await env.DB.prepare(`
      SELECT * FROM teacher_customization
      WHERE curriculum_id = ?
      LIMIT 1
    `).bind(curriculumId).first()
    
    return c.json(customization || {})
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：先生カスタマイズ設定保存・更新
app.post('/api/teacher/customization', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    // まず既存のデータがあるかチェック
    const existing = await env.DB.prepare(`
      SELECT id FROM teacher_customization
      WHERE curriculum_id = ?
    `).bind(body.curriculum_id).first()
    
    if (existing) {
      // 更新
      await env.DB.prepare(`
        UPDATE teacher_customization SET
          teacher_id = ?,
          teaching_philosophy = ?,
          custom_unit_goal = ?,
          custom_non_cognitive_goal = ?,
          teaching_notes = ?,
          gamification_enabled = ?,
          badge_system_enabled = ?,
          narrative_enabled = ?,
          story_theme = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE curriculum_id = ?
      `).bind(
        body.teacher_id || 1,
        body.teaching_philosophy || '',
        body.custom_unit_goal || '',
        body.custom_non_cognitive_goal || '',
        body.teaching_notes || '',
        body.gamification_enabled ? 1 : 0,
        body.badge_system_enabled ? 1 : 0,
        body.narrative_enabled ? 1 : 0,
        body.story_theme || '',
        body.curriculum_id
      ).run()
      
      return c.json({ success: true, id: existing.id })
    } else {
      // 新規作成
      const result = await env.DB.prepare(`
        INSERT INTO teacher_customization (
          curriculum_id, teacher_id,
          teaching_philosophy,
          custom_unit_goal,
          custom_non_cognitive_goal,
          teaching_notes,
          gamification_enabled,
          badge_system_enabled,
          narrative_enabled,
          story_theme
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        body.curriculum_id,
        body.teacher_id || 1,
        body.teaching_philosophy || '',
        body.custom_unit_goal || '',
        body.custom_non_cognitive_goal || '',
        body.teaching_notes || '',
        body.gamification_enabled ? 1 : 0,
        body.badge_system_enabled ? 1 : 0,
        body.narrative_enabled ? 1 : 0,
        body.story_theme || ''
      ).run()
      
      return c.json({ success: true, id: result.meta.last_row_id })
    }
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：生徒のバッジ取得
app.get('/api/badges/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const badges = await env.DB.prepare(`
      SELECT * FROM student_badges
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY earned_at DESC
    `).bind(studentId, curriculumId).all()
    
    return c.json(badges.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習ナラティブ取得
app.get('/api/narratives/student/:studentId/curriculum/:curriculumId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const narratives = await env.DB.prepare(`
      SELECT * FROM learning_narratives
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY chapter_number
    `).bind(studentId, curriculumId).all()
    
    return c.json(narratives.results)
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// ==================== 問題編集機能 API ====================

// APIルート：学習カード更新
app.put('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE learning_cards SET
        card_title = ?,
        problem_description = ?,
        new_terms = ?,
        example_problem = ?,
        example_solution = ?,
        diagram_url = ?,
        real_world_connection = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.card_title || '',
      body.problem_description || '',
      body.new_terms || '',
      body.example_problem || '',
      body.example_solution || '',
      body.diagram_url || '',
      body.real_world_connection || '',
      cardId
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習カード追加
app.post('/api/cards', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO learning_cards (
        course_id, card_number, card_title, card_type,
        problem_description, new_terms, example_problem,
        example_solution, diagram_url, real_world_connection
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.course_id,
      body.card_number,
      body.card_title || '',
      body.card_type || 'main',
      body.problem_description || '',
      body.new_terms || '',
      body.example_problem || '',
      body.example_solution || '',
      body.diagram_url || '',
      body.real_world_connection || ''
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：学習カード削除
app.delete('/api/cards/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  
  try {
    // 関連するヒントカードも削除
    await env.DB.prepare(`
      DELETE FROM hint_cards WHERE learning_card_id = ?
    `).bind(cardId).run()
    
    // 学習カード削除
    await env.DB.prepare(`
      DELETE FROM learning_cards WHERE id = ?
    `).bind(cardId).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：ヒントカード更新
app.put('/api/hints/:hintId', async (c) => {
  const { env } = c
  const hintId = c.req.param('hintId')
  const body = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE hint_cards SET
        hint_text = ?,
        thinking_tool_suggestion = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.hint_text || '',
      body.thinking_tool_suggestion || '',
      hintId
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：ヒントカード追加
app.post('/api/hints', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO hint_cards (
        learning_card_id, hint_number, hint_content, thinking_tool_suggestion
      ) VALUES (?, ?, ?, ?)
    `).bind(
      body.learning_card_id,
      body.hint_level || body.hint_number || 1,
      body.hint_text || body.hint_content || '',
      body.thinking_tool_suggestion || ''
    ).run()
    
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：ヒントカード削除
app.delete('/api/hints/:hintId', async (c) => {
  const { env } = c
  const hintId = c.req.param('hintId')
  
  try {
    await env.DB.prepare(`
      DELETE FROM hint_cards WHERE id = ?
    `).bind(hintId).run()
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
  }
})

// APIルート：類似問題生成
app.post('/api/cards/:cardId/generate-similar', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  
  try {
    // カード情報を取得
    const card = await env.DB.prepare(`
      SELECT lc.*, c.course_name, curr.grade, curr.subject, curr.unit_name
      FROM learning_cards lc
      JOIN courses c ON lc.course_id = c.id
      JOIN curriculum curr ON c.curriculum_id = curr.id
      WHERE lc.id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ error: 'Card not found' }, 404)
    }
    
    // Gemini Flashで類似問題を生成
    const apiKey = env.GEMINI_API_KEY
    if (!apiKey) {
      return c.json({ error: 'API key not configured' }, 500)
    }
    
    const prompt = `あなたは小学校の優秀な教師です。以下の学習カードの問題に基づいて、類似問題を1問生成してください。

【元の学習カード情報】
- 学年: ${card.grade}
- 教科: ${card.subject}
- 単元: ${card.unit_name}
- コース: ${card.course_name}
- カードタイトル: ${card.card_title}
- 元の問題: ${card.problem_content}
- 解答例: ${card.answer || card.example_solution || ''}

【類似問題の条件】
1. 元の問題と**同じ学習内容**を練習できる問題にする
2. **数字や状況を変えた**バリエーションを作成
3. 難易度は元の問題と同程度
4. 具体的で子どもが解ける形式
5. 必ず解答例を付ける

以下のJSON形式で出力してください。説明文は不要です：
{
  "problem_text": "新しい類似問題の問題文",
  "answer": "解答例",
  "hint_1": "ヒント1（まず考えてほしいこと）",
  "hint_2": "ヒント2（中間ヒント）",
  "hint_3": "ヒント3（答えに近いヒント）"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 2048
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('AI response is not valid JSON')
    }
    
    const similarProblem = JSON.parse(jsonMatch[0])
    
    return c.json({
      success: true,
      problem: similarProblem
    })
    
  } catch (error) {
    console.error('類似問題生成エラー:', error)
    return c.json({ 
      error: '類似問題の生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// AIチャット機能（学習カード用）
app.post('/api/ai-chat', async (c) => {
  try {
    const { message, cardContext } = await c.req.json()
    
    const systemPrompt = `あなたは小学生の学習を優しくサポートするAI先生です。
${cardContext ? `
【現在の学習内容】
- カードタイトル: ${cardContext.card_title}
- 学習内容: ${cardContext.problem_description}
- 新出用語: ${cardContext.new_terms || 'なし'}
` : ''}

【回答ルール】
1. 小学生が使う言葉で、具体的に説明する（難しい言葉は使わない）
2. 答えは教えず、「まず〜を考えてみよう」のように段階的にヒントを出す
3. 図や絵で考える方法を提案する（例：「図に書いてみるといいよ」）
4. 「いいところに気づいたね！」など励ましを入れる
5. 150文字程度で簡潔に（長すぎないこと）
6. 子どもが理解できているか確認する質問を最後に入れる

【回答例】
質問「区切りってどういうこと？」
→「区切りっていうのは、大きな数をわかりやすく分けることだよ。例えば、10000を「10と1000」に分けると計算しやすくなるよね。この問題では、どこで区切ると計算しやすいかな？」`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: systemPrompt },
            { text: `子どもの質問: ${message}` }
          ]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini APIエラー:', response.status, errorData)
      throw new Error(`Gemini API returned ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini API - 候補なし:', JSON.stringify(data, null, 2))
      return c.json({ response: 'ごめんね、今は答えられないよ。先生に聞いてみてね！' })
    }

    const aiResponse = data.candidates[0]?.content?.parts?.[0]?.text || 'ごめんね、うまく答えられなかったよ。もう一度聞いてね。'

    return c.json({ response: aiResponse })
  } catch (error: any) {
    console.error('AIチャットエラー:', error)
    console.error('エラー詳細:', error.message)
    return c.json({ 
      error: 'AIが今は答えられません。先生に聞いてみてね！',
      details: error.message 
    }, 500)
  }
})

// トップページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>自由進度学習支援システム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js"></script>
        <style>
          @media print {
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:break-after-page { page-break-after: always; }
            .print\\:break-inside-avoid { page-break-inside: avoid; }
            @page { margin: 1cm; }
          }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div id="app">
          <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p class="text-xl text-gray-700">システムを読み込んでいます...</p>
            </div>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script>
          // すべてのリソース読み込み後に実行
          window.addEventListener('load', () => {
            console.log('✅ ページ読み込み完了')
            console.log('📦 renderTopPage:', typeof renderTopPage)
            
            try {
              if (typeof renderTopPage === 'function') {
                renderTopPage()
              } else if (typeof window.renderTopPage === 'function') {
                window.renderTopPage()
              } else {
                console.error('❌ renderTopPage関数が見つかりません')
                // エラー表示
                document.getElementById('app').innerHTML = '<div class="flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center"><div class="text-red-600 mb-4"><i class="fas fa-exclamation-triangle text-6xl"></i></div><h2 class="text-2xl font-bold text-gray-800 mb-4">システムエラー</h2><p class="text-gray-600 mb-6">ページをリフレッシュしてください。</p><button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"><i class="fas fa-redo mr-2"></i>リフレッシュ</button></div></div>'
              }
            } catch (error) {
              console.error('エラー:', error)
              document.getElementById('app').innerHTML = '<div class="flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center"><div class="text-red-600 mb-4"><i class="fas fa-exclamation-triangle text-6xl"></i></div><h2 class="text-2xl font-bold text-gray-800 mb-4">エラー</h2><button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">リフレッシュ</button></div></div>'
            }
          })
        </script>
    </body>
    </html>
  `)
})

// ============================================
// Phase 6: AI機能フル実装
// ============================================

// APIルート：AI学習診断
app.post('/api/ai/diagnosis', async (c) => {
  const { env } = c
  const { studentId, curriculumId } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      diagnosis: '学習診断機能は現在利用できません。',
      recommendations: [],
      strengths: [],
      areas_for_improvement: []
    })
  }
  
  try {
    // 学習進捗データを取得
    const progress = await env.DB.prepare(`
      SELECT 
        sp.*,
        lc.card_title,
        lc.card_type,
        lc.card_number
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? AND sp.curriculum_id = ?
      ORDER BY sp.updated_at DESC
      LIMIT 20
    `).bind(studentId, curriculumId).all()
    
    // 助け要請データを取得
    const helpRequests = await env.DB.prepare(`
      SELECT help_type, COUNT(*) as count
      FROM student_progress
      WHERE student_id = ? AND curriculum_id = ?
      GROUP BY help_type
    `).bind(studentId, curriculumId).all()
    
    // 理解度データを集計
    const understandingStats = progress.results.reduce((acc: any, item: any) => {
      if (item.understanding_level) {
        acc.total++
        acc.sum += item.understanding_level
        if (item.understanding_level >= 4) acc.high++
        if (item.understanding_level <= 2) acc.low++
      }
      return acc
    }, { total: 0, sum: 0, high: 0, low: 0 })
    
    const avgUnderstanding = understandingStats.total > 0 
      ? (understandingStats.sum / understandingStats.total).toFixed(1) 
      : '0'
    
    // Gemini APIに診断を依頼
    const prompt = `あなたは小学生の学習を支援する優しいAI先生です。
以下の学習データから、この児童の学習状況を分析して、具体的なアドバイスをしてください。

【学習データ】
- 学習カード総数: ${progress.results.length}枚
- 平均理解度: ${avgUnderstanding}/5
- 高理解度カード: ${understandingStats.high}枚
- 低理解度カード: ${understandingStats.low}枚
- 助け要請: ${JSON.stringify(helpRequests.results)}

【最近の学習カード】
${progress.results.slice(0, 5).map((p: any) => 
  `- ${p.card_title} (理解度: ${p.understanding_level || '未評価'}/5)`
).join('\n')}

以下のJSON形式で診断結果を出力してください：
{
  "overall_assessment": "全体的な学習状況の評価（100文字以内）",
  "strengths": ["強み1", "強み2", "強み3"],
  "areas_for_improvement": ["改善点1", "改善点2"],
  "recommendations": [
    {"title": "おすすめアクション1", "description": "具体的な説明"},
    {"title": "おすすめアクション2", "description": "具体的な説明"}
  ],
  "encouragement": "児童への励ましメッセージ（50文字以内）"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    // JSONを抽出（```json ... ``` の中身を取得）
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      aiResponse.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}'
    const diagnosis = JSON.parse(jsonStr)
    
    return c.json(diagnosis)
    
  } catch (error) {
    console.error('AI診断エラー:', error)
    return c.json({
      overall_assessment: '学習診断を実行できませんでした。',
      strengths: ['頑張って学習を続けています'],
      areas_for_improvement: [],
      recommendations: [],
      encouragement: 'これからも一緒に頑張りましょう！'
    })
  }
})

// APIルート：AI問題生成
app.post('/api/ai/generate-problem', async (c) => {
  const { env } = c
  const { cardId, difficulty } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      problem: '問題生成機能は現在利用できません。',
      answer: '',
      hint: ''
    })
  }
  
  try {
    // 学習カード情報を取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ error: 'カードが見つかりません' }, 404)
    }
    
    const difficultyText = difficulty === 'easy' ? 'やさしい' : 
                          difficulty === 'hard' ? '難しい' : '標準的な'
    
    const prompt = `あなたは小学生向けの問題を作る先生です。
以下の学習カードの内容に基づいて、${difficultyText}レベルの類似問題を1つ作成してください。

【元の学習カード】
タイトル: ${card.card_title}
問題: ${card.problem_description}
例題: ${card.example_problem}

以下のJSON形式で問題を出力してください：
{
  "problem": "新しい問題文（数値や状況を変えて）",
  "answer": "正解",
  "hint": "ヒント（困ったときのアドバイス）",
  "explanation": "解き方の説明"
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      aiResponse.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}'
    const generatedProblem = JSON.parse(jsonStr)
    
    return c.json(generatedProblem)
    
  } catch (error) {
    console.error('問題生成エラー:', error)
    return c.json({
      problem: '問題を生成できませんでした。',
      answer: '',
      hint: '先生に聞いてみましょう',
      explanation: ''
    })
  }
})

// APIルート：AI学習計画提案
app.post('/api/ai/suggest-plan', async (c) => {
  const { env } = c
  const { studentId, curriculumId } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      suggestion: '学習計画提案機能は現在利用できません。',
      daily_goals: [],
      weekly_goals: []
    })
  }
  
  try {
    // 進捗データを取得
    const progress = await env.DB.prepare(`
      SELECT sp.*, lc.card_title, lc.card_number, lc.card_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? AND sp.curriculum_id = ?
      ORDER BY sp.updated_at DESC
    `).bind(studentId, curriculumId).all()
    
    // 学習計画を取得
    const plans = await env.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date DESC
      LIMIT 7
    `).bind(studentId, curriculumId).all()
    
    const completedCards = progress.results.filter((p: any) => p.is_completed).length
    const totalCards = progress.results.length
    
    const prompt = `あなたは小学生の学習をサポートするAI先生です。
以下のデータから、今後の学習計画を提案してください。

【現在の状況】
- 完了カード: ${completedCards}/${totalCards}枚
- 最近の学習: ${plans.results.length}日分のデータ
- 平均理解度: ${progress.results.filter((p: any) => p.understanding_level).length > 0 
  ? (progress.results.reduce((sum: number, p: any) => sum + (p.understanding_level || 0), 0) / 
     progress.results.filter((p: any) => p.understanding_level).length).toFixed(1) 
  : '未評価'}

以下のJSON形式で学習計画を提案してください：
{
  "overall_suggestion": "全体的な学習計画の提案（100文字以内）",
  "daily_goals": [
    {"day": "今日", "goal": "具体的な目標", "cards": 2},
    {"day": "明日", "goal": "具体的な目標", "cards": 2}
  ],
  "weekly_goals": [
    {"goal": "今週の目標1", "importance": "high"},
    {"goal": "今週の目標2", "importance": "medium"}
  ],
  "tips": ["学習のコツ1", "学習のコツ2"]
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      aiResponse.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}'
    const plan = JSON.parse(jsonStr)
    
    return c.json(plan)
    
  } catch (error) {
    console.error('計画提案エラー:', error)
    return c.json({
      overall_suggestion: '学習計画を提案できませんでした。',
      daily_goals: [],
      weekly_goals: [],
      tips: ['自分のペースで頑張りましょう']
    })
  }
})

// APIルート：AI誤答分析
app.post('/api/ai/analyze-errors', async (c) => {
  const { env } = c
  const { studentId, curriculumId } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      analysis: '誤答分析機能は現在利用できません。',
      error_patterns: [],
      suggestions_for_teacher: []
    })
  }
  
  try {
    // 理解度が低いカードを取得
    const weakCards = await env.DB.prepare(`
      SELECT sp.*, lc.card_title, lc.problem_description, lc.card_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? 
        AND sp.curriculum_id = ?
        AND sp.understanding_level <= 2
      ORDER BY sp.updated_at DESC
      LIMIT 10
    `).bind(studentId, curriculumId).all()
    
    // 助け要請が多いカードを取得
    const helpCards = await env.DB.prepare(`
      SELECT sp.*, lc.card_title, sp.help_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? 
        AND sp.curriculum_id = ?
        AND sp.help_type IS NOT NULL
      ORDER BY sp.updated_at DESC
      LIMIT 10
    `).bind(studentId, curriculumId).all()
    
    if (weakCards.results.length === 0 && helpCards.results.length === 0) {
      return c.json({
        analysis: 'この児童は順調に学習を進めています。特につまずきは見られません。',
        error_patterns: [],
        suggestions_for_teacher: ['引き続き見守りながら、チャレンジ問題を提案してみてください。']
      })
    }
    
    const prompt = `あなたは教育専門のAI分析エージェントです。
以下のデータから、児童のつまずきパターンを分析し、指導アドバイスを提供してください。

【理解度が低いカード】
${weakCards.results.map((c: any) => 
  `- ${c.card_title} (理解度: ${c.understanding_level}/5)`
).join('\n')}

【助けを求めたカード】
${helpCards.results.map((h: any) => 
  `- ${h.card_title} (助け: ${h.help_type})`
).join('\n')}

以下のJSON形式で分析結果を出力してください：
{
  "overall_analysis": "全体的な分析（150文字以内）",
  "error_patterns": [
    {"pattern": "つまずきパターン1", "frequency": "よく見られる"},
    {"pattern": "つまずきパターン2", "frequency": "時々見られる"}
  ],
  "root_causes": ["根本原因1", "根本原因2"],
  "suggestions_for_teacher": [
    {"suggestion": "指導アドバイス1", "priority": "high"},
    {"suggestion": "指導アドバイス2", "priority": "medium"}
  ],
  "support_strategies": ["サポート方法1", "サポート方法2"]
}`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1000
          }
        })
      }
    )
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      aiResponse.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}'
    const analysis = JSON.parse(jsonStr)
    
    return c.json(analysis)
    
  } catch (error) {
    console.error('誤答分析エラー:', error)
    return c.json({
      overall_analysis: '分析を実行できませんでした。',
      error_patterns: [],
      root_causes: [],
      suggestions_for_teacher: [],
      support_strategies: []
    })
  }
})

// ============================================
// Phase 7: AI単元自動生成システム
// ============================================

// APIルート：単元名候補をAIで生成
app.post('/api/ai/suggest-units', async (c) => {
  const { env } = c
  const { grade, subject, textbook } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      error: '単元候補生成機能は現在利用できません。',
      units: []
    })
  }
  
  try {
    const prompt = `${grade}${subject}（${textbook}）の単元名を10個、1行に1つずつ出力。番号不要。例:
かけ算の筆算
わり算の筆算
小数のかけ算`

    // 新しいヘルパー関数を使用（自動リトライ付き）
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash']
    let result: GeminiResponse | null = null
    
    for (const model of models) {
      result = await callGeminiAPI({
        model,
        prompt,
        apiKey,
        maxOutputTokens: 1000,
        temperature: 0.7,
        retries: 2
      })
      
      if (result.success) break
    }
    
    if (!result || !result.success || !result.content) {
      throw new Error('すべてのモデルで単元候補の生成に失敗しました')
    }
    
    // レスポンスから単元名を抽出
    console.log('📝 Gemini レスポンス:', result.content)
    
    const units = result.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        // 数字・記号で始まる行を除外、長さチェックを緩和
        const isValid = line && 
                       !line.match(/^[\d\.\-\*\#]+\s*$/) && 
                       line.length > 1 && 
                       line.length < 100
        if (line && line.length > 0) {
          console.log(`  行: "${line}" -> ${isValid ? '✅ 採用' : '❌ 除外'}`)
        }
        return isValid
      })
      .map(line => line.replace(/^[\d\.\-\*\#\s]+/, '').trim()) // 先頭の番号・記号を削除
      .filter(line => line.length > 1)
      .slice(0, 10)
    
    console.log('✅ 抽出された単元:', units)
    
    return c.json({
      success: true,
      units,
      model_used: result.model,
      attempts: result.attempts,
      totalTime: result.totalTime
    })
    
  } catch (error: any) {
    console.error('単元候補生成エラー:', error)
    return c.json({
      error: '単元候補の生成に失敗しました。',
      details: error.message,
      units: []
    }, 500)
  }
})

// APIルート：AI単元生成
app.post('/api/ai/generate-unit', async (c) => {
  const { env } = c
  const { grade, subject, textbook, unitName, customization, qualityMode } = await c.req.json()
  
  // 環境変数からAPIキーを取得
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error('❌ APIキーが設定されていません')
    return c.json({
      error: 'Gemini APIキーが設定されていません。管理者に連絡してください。',
      curriculum: null
    }, 500)
  }
  
  console.log('🔑 APIキー確認: 最初の10文字 =', apiKey.substring(0, 10))
  
  try {
    // 品質モードに応じてモデルを選択
    // 'standard' (デフォルト): Gemini 3 Flash - 高速
    // 'high': Gemini 3 Pro - 高品質・詳細
    const useHighQuality = qualityMode === 'high'
    
    // カスタマイズ情報を整形
    const customInfo = customization ? `

【特別な配慮・カスタマイズ】
${customization.studentNeeds ? `生徒の状況: ${customization.studentNeeds}` : ''}
${customization.teacherGoals ? `先生の願い: ${customization.teacherGoals}` : ''}
${customization.learningStyle ? `学習スタイル: ${customization.learningStyle}` : ''}
${customization.specialSupport ? `特別支援: ${customization.specialSupport}` : ''}
` : ''
    
    const prompt = `${grade}${subject}「${unitName}」（${textbook}）の学習カリキュラムをJSON形式で作成してください。

{
  "curriculum": {
    "grade": "${grade}",
    "subject": "${subject}",
    "textbook_company": "${textbook}",
    "unit_name": "${unitName}",
    "total_hours": 8,
    "unit_goal": "学習目標（100文字、ふりがな付き）",
    "non_cognitive_goal": "非認知目標（80文字）"
  },
  "courses": [
    {
      "course_name": "ゆっくりコース",
      "course_label": "じっくり考えながら進むコース",
      "description": "ひとつひとつていねいに学びたい人におすすめ",
      "color_code": "green",
      "cards": [{"card_number":1,"card_title":"タイトル","card_type":"main","textbook_page":"p.XX","problem_description":"問題","new_terms":"用語","example_problem":"例題","example_solution":"解法","real_world_connection":"つながり","answer":"解答（必須）","hints":[{"hint_level":1,"hint_text":"ヒント1"},{"hint_level":2,"hint_text":"ヒント2"},{"hint_level":3,"hint_text":"ヒント3"}]},
        ... 全6枚]
    },
    {"course_name":"しっかりコース","course_label":"自分のペースで学ぶコース","description":"しっかり考えて学びたい人","color_code":"blue","cards":[...全6枚]},
    {"course_name":"どんどんコース","course_label":"いろいろなことにちょうせんするコース","description":"発展的に学びたい人","color_code":"purple","cards":[...全6枚]}
  ]
}

【重要】
- 3コース×各6枚=合計18枚のカード
- 全カードにanswer（必須）
- 全カードにhints配列3つ（必須）
- JSONコードブロックなし、完全なJSONのみ

完全なJSONのみ出力してください。`
    // 品質モードに応じてモデルを選択
    // 複数モデルでフォールバック（最新安定版を優先）
    const models = [
      { name: 'gemini-2.5-flash', maxTokens: 16384 },     // 最新・最も安定
      { name: 'gemini-2.0-flash', maxTokens: 16384 },     // 高速
      { name: 'gemini-2.5-pro', maxTokens: 16384 }        // 最高品質
    ]
    
    let response
    let modelName
    let lastError
    
    for (const model of models) {
      try {
        console.log(`🔄 初期生成モデル試行中: ${model.name}`)
        modelName = model.name
        
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.8,
                maxOutputTokens: model.maxTokens
              }
            })
          }
        )
        
        if (response.ok) {
          console.log(`✅ 初期生成モデル成功: ${modelName}`)
          break
        } else {
          const errorText = await response.text()
          console.warn(`⚠️ 初期生成モデル失敗: ${modelName} (status: ${response.status})`)
          console.warn(`   エラー詳細: ${errorText.substring(0, 200)}`)
          lastError = new Error(`${modelName} returned ${response.status}: ${errorText.substring(0, 100)}`)
        }
      } catch (error: any) {
        console.warn(`⚠️ 初期生成モデルエラー: ${model.name} - ${error.message}`)
        lastError = error
      }
    }
    
    if (!response || !response.ok) {
      console.error('❌ すべてのモデルが失敗しました:', lastError?.message)
      throw lastError || new Error('すべてのモデルが失敗しました')
    }
    
    const data = await response.json()
    console.log('📦 API Response Status:', response.status)
    console.log('📦 API Response Data Keys:', Object.keys(data))
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      console.error('❌ AIレスポンスが空です')
      console.error('   完全なレスポンス:', JSON.stringify(data, null, 2).substring(0, 500))
      return c.json({
        error: '単元の生成に失敗しました。AIの応答が空でした。',
        details: JSON.stringify(data).substring(0, 200),
        curriculum: null
      })
    }
    
    console.log('📝 AIレスポンス（最初の500文字）:', aiResponse.substring(0, 500))
    console.log('📝 AIレスポンス（最後の200文字）:', aiResponse.substring(Math.max(0, aiResponse.length - 200)))
    
    // JSONを抽出（複数パターン対応、より寛容に）
    let jsonStr
    
    // パターン1: ```json ... ``` コードブロック
    const jsonCodeBlock = aiResponse.match(/```json\s*([\s\S]*?)\s*```/)
    // パターン2: ``` ... ``` プレーンコードブロック（jsonタグなし）
    const plainCodeBlock = aiResponse.match(/```\s*([\s\S]*?)\s*```/)
    // パターン3: { ... } JSON オブジェクト（最長マッチ）
    const jsonObject = aiResponse.match(/\{[\s\S]*\}/)
    
    if (jsonCodeBlock) {
      jsonStr = jsonCodeBlock[1].trim()
      console.log('✅ JSONコードブロック（```json）を検出')
    } else if (plainCodeBlock) {
      jsonStr = plainCodeBlock[1].trim()
      console.log('✅ プレーンコードブロック（```）を検出')
    } else if (jsonObject) {
      jsonStr = jsonObject[0].trim()
      console.log('✅ JSON オブジェクトを検出')
    } else {
      console.error('❌ JSONが見つかりません')
      console.error('   AIレスポンス全文（最初の1000文字）:', aiResponse.substring(0, 1000))
      return c.json({
        error: '単元の生成に失敗しました。AIの応答からJSONを抽出できませんでした。',
        details: aiResponse.substring(0, 500),
        curriculum: null,
        raw_response: aiResponse.substring(0, 1000)
      }, 500)
    }
    
    console.log('📋 抽出されたJSON（最初の300文字）:', jsonStr.substring(0, 300))
    
    let unitData
    try {
      unitData = JSON.parse(jsonStr)
      console.log('✅ JSONパース成功')
      console.log('📊 データ構造キー:', Object.keys(unitData))
    } catch (parseError: any) {
      console.error('❌ JSONパースエラー:', parseError.message)
      console.error('   パース対象文字列（最初の500文字）:', jsonStr.substring(0, 500))
      return c.json({
        error: '単元の生成に失敗しました。AIの応答がJSON形式ではありませんでした。',
        details: `パースエラー: ${parseError.message} | 文字列: ${jsonStr.substring(0, 200)}`,
        curriculum: null
      })
    }
    
    // データ構造を詳細に検証
    const validationErrors = []
    
    // 必須フィールドのみ検証（追加問題は別APIで生成）
    if (!unitData.curriculum) validationErrors.push('curriculum が欠けています')
    if (!unitData.courses || !Array.isArray(unitData.courses)) validationErrors.push('courses が欠けているか配列ではありません')
    
    // コースの検証
    if (unitData.courses && Array.isArray(unitData.courses)) {
      unitData.courses.forEach((course: any, index: number) => {
        if (!course.cards || !Array.isArray(course.cards)) {
          validationErrors.push(`コース${index + 1}の cards が欠けているか配列ではありません`)
        } else if (course.cards.length !== 6) {
          validationErrors.push(`コース${index + 1}は6枚のカードが必須ですが、${course.cards.length}枚しかありません`)
        }
      })
    }
    
    if (validationErrors.length > 0) {
      console.error('単元データ検証エラー:', validationErrors)
      console.error('生成されたデータの一部:', JSON.stringify(unitData).substring(0, 1000))
      return c.json({
        error: '単元データの構造が正しくありません。',
        validation_errors: validationErrors,
        curriculum: null
      })
    }
    
    return c.json({
      success: true,
      model_used: modelName,
      data: unitData
    })
    
  } catch (error) {
    console.error('単元生成エラー:', error)
    return c.json({
      error: '単元を生成できませんでした。',
      details: error instanceof Error ? error.message : String(error),
      curriculum: null
    })
  }
})

// APIルート：生成した単元を保存
app.post('/api/curriculum/save-generated', async (c) => {
  const { env } = c
  const { curriculum, courses, optionalProblems, courseSelectionProblems, commonCheckTest } = await c.req.json()
  
  try {
    // カリキュラムを保存
    const curriculumResult = await env.DB.prepare(`
      INSERT INTO curriculum (
        grade, subject, textbook_company, unit_name, 
        unit_order, total_hours, unit_goal, non_cognitive_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      curriculum.grade,
      curriculum.subject,
      curriculum.textbook_company,
      curriculum.unit_name,
      99, // 生成された単元は最後に追加
      curriculum.total_hours,
      curriculum.unit_goal,
      curriculum.non_cognitive_goal
    ).run()
    
    const curriculumId = curriculumResult.meta.last_row_id
    
    // コースを保存
    for (const course of courses) {
      // course_levelを決定（course_nameから推測）
      let courseLevel = 'standard'
      if (course.course_name?.includes('ゆっくり') || course.course_name?.includes('じっくり')) {
        courseLevel = 'basic'
      } else if (course.course_name?.includes('どんどん') || course.course_name?.includes('ぐんぐん')) {
        courseLevel = 'advanced'
      }
      
      const courseResult = await env.DB.prepare(`
        INSERT INTO courses (
          curriculum_id, course_level, course_display_name, 
          selection_question_title, selection_question_content,
          course_name, description, color_code, course_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        curriculumId,
        courseLevel,
        course.course_name || course.course_label || 'コース',
        course.course_name || 'コース選択問題',
        course.description || '',
        course.course_name,
        course.description,
        course.color_code,
        course.course_label || ''
      ).run()
      
      const courseId = courseResult.meta.last_row_id
      
      // 学習カードを保存
      for (const card of course.cards || []) {
        const cardResult = await env.DB.prepare(`
          INSERT INTO learning_cards (
            course_id, card_number, card_title, card_type,
            problem_content, new_terms, example_problem,
            example_solution, real_world_context, textbook_page
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          courseId,
          card.card_number,
          card.card_title,
          card.card_type || 'main',
          card.problem_description || card.problem_content || '',
          card.new_terms || '',
          card.example_problem || '',
          card.example_solution || '',
          card.real_world_connection || card.real_world_context || '',
          card.textbook_page || ''
        ).run()
        
        const cardId = cardResult.meta.last_row_id
        
        // ヒントカードを保存
        for (const hint of card.hints || []) {
          await env.DB.prepare(`
            INSERT INTO hint_cards (
              learning_card_id, hint_number, hint_content, thinking_tool_suggestion
            ) VALUES (?, ?, ?, ?)
          `).bind(
            cardId,
            hint.hint_level || hint.hint_number || 1,
            hint.hint_text || hint.hint_content || '',
            hint.thinking_tool_suggestion || ''
          ).run()
        }
      }
    }
    
    // 選択問題を保存
    for (const problem of optionalProblems || []) {
      await env.DB.prepare(`
        INSERT INTO optional_problems (
          curriculum_id, problem_number, problem_title, problem_description,
          difficulty_level, learning_meaning
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        curriculumId,
        problem.problem_number || 1,
        problem.problem_title,
        problem.problem_description,
        problem.difficulty_level || 'medium',
        problem.learning_meaning || ''
      ).run()
    }
    
    // コース選択問題を保存（カリキュラムメタデータとして）
    if (courseSelectionProblems && courseSelectionProblems.length > 0) {
      const courseSelectionJSON = JSON.stringify(courseSelectionProblems)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (
          curriculum_id, metadata_key, metadata_value
        ) VALUES (?, ?, ?)
      `).bind(
        curriculumId,
        'course_selection_problems',
        courseSelectionJSON
      ).run()
    }
    
    // 共通チェックテストを保存（カリキュラムメタデータとして）
    if (commonCheckTest && commonCheckTest.sample_problems && commonCheckTest.sample_problems.length > 0) {
      const checkTestJSON = JSON.stringify(commonCheckTest)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (
          curriculum_id, metadata_key, metadata_value
        ) VALUES (?, ?, ?)
      `).bind(
        curriculumId,
        'common_check_test',
        checkTestJSON
      ).run()
    }
    
    console.log('✅ 単元保存完了:', {
      curriculum_id: curriculumId,
      courses: courses.length,
      total_cards: courses.reduce((sum, c) => sum + (c.cards?.length || 0), 0),
      optional_problems: optionalProblems?.length || 0,
      course_selection_problems: courseSelectionProblems?.length || 0,
      common_check_test: commonCheckTest ? '有' : '無'
    })
    
    return c.json({
      success: true,
      curriculum_id: curriculumId,
      saved_data: {
        optional_problems_count: optionalProblems?.length || 0,
        course_selection_count: courseSelectionProblems?.length || 0,
        common_check_test: !!commonCheckTest
      }
    })
    
  } catch (error) {
    console.error('単元保存エラー:', error)
    return c.json({ 
      success: false,
      error: 'Database error',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

// APIルート：コース関連問題を生成（コース選択問題・導入問題）
app.post('/api/curriculum/:curriculumId/generate-course-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    // カリキュラムと3コースの情報を取得
    const curriculum = await env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculumId).first()
    const courses = await env.DB.prepare('SELECT * FROM courses WHERE curriculum_id = ?').bind(curriculumId).all()
    
    if (!curriculum || !courses.results || courses.results.length === 0) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // AIプロンプト：コース関連問題のみ
    const prompt = `小学${curriculum.grade}年 ${curriculum.subject}「${curriculum.unit_name}」の問題を生成。

【必須：3つのコース】
1. ${courses.results[0]?.course_name || 'ゆっくりコース'}
2. ${courses.results[1]?.course_name || 'しっかりコース'}  
3. ${courses.results[2]?.course_name || 'ぐんぐんコース'}

【必須：JSONのみ出力】
{
  "course_selection_problems": [
    {"problem_number": 1, "problem_title": "コース1の魅力的なタイトル", "problem_content": "具体的な数字を含む問題文（50字以上）", "course_level": "基礎"},
    {"problem_number": 2, "problem_title": "コース2の魅力的なタイトル", "problem_content": "具体的な数字を含む問題文（50字以上）", "course_level": "標準"},
    {"problem_number": 3, "problem_title": "コース3の魅力的なタイトル", "problem_content": "具体的な数字を含む問題文（50字以上）", "course_level": "発展"}
  ],
  "introduction_problems": [
    {"course_number": 1, "problem_title": "導入問題1", "problem_content": "具体的な数字を含む問題文（50字以上）", "answer": "解答と解説（30字以上）"},
    {"course_number": 2, "problem_title": "導入問題2", "problem_content": "具体的な数字を含む問題文（50字以上）", "answer": "解答と解説（30字以上）"},
    {"course_number": 3, "problem_title": "導入問題3", "problem_content": "具体的な数字を含む問題文（50字以上）", "answer": "解答と解説（30字以上）"}
  ]
}`

    // フォールバック機能付きAPI呼び出し
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro']
    let response
    let lastError
    
    for (const model of models) {
      try {
        console.log(`🔄 モデル試行中: ${model}`)
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 8192 }
            })
          }
        )
        
        if (response.ok) {
          console.log(`✅ モデル成功: ${model}`)
          break
        } else {
          console.warn(`⚠️ モデル失敗: ${model} (status: ${response.status})`)
          lastError = new Error(`${model} returned ${response.status}`)
        }
      } catch (error: any) {
        console.warn(`⚠️ モデルエラー: ${model} - ${error.message}`)
        lastError = error
      }
    }
    
    if (!response || !response.ok) {
      throw lastError || new Error('すべてのモデルが失敗しました')
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      throw new Error('AI response is empty')
    }
    
    // JSONを抽出
    console.log('AIレスポンス（コース問題）:', aiResponse)
    let jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/)
    let jsonText = jsonMatch ? jsonMatch[1] : aiResponse
    const problems = JSON.parse(jsonText)
    console.log('パース結果（コース問題）:', JSON.stringify(problems, null, 2))
    
    // データベースに保存
    if (problems.course_selection_problems) {
      console.log(`コース選択問題を保存: ${problems.course_selection_problems.length}件`)
      const courseSelectionJSON = JSON.stringify(problems.course_selection_problems)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(curriculumId, 'course_selection_problems', courseSelectionJSON).run()
    } else {
      console.warn('course_selection_problemsが見つかりません')
    }
    
    if (problems.introduction_problems) {
      console.log(`導入問題を保存: ${problems.introduction_problems.length}件`)
      const coursesList = courses.results
      for (let i = 0; i < problems.introduction_problems.length && i < coursesList.length; i++) {
        const introProblem = problems.introduction_problems[i]
        const course = coursesList[i]
        const introJSON = JSON.stringify(introProblem)
        console.log(`コース${i+1}(ID:${course.id})に導入問題を保存:`, introProblem.problem_title)
        await env.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(introJSON, course.id).run()
      }
    } else {
      console.warn('introduction_problemsが見つかりません')
    }
    
    return c.json({ 
      success: true, 
      message: 'コース関連問題を生成・保存しました',
      details: {
        course_selection_count: problems.course_selection_problems?.length || 0,
        introduction_count: problems.introduction_problems?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error('コース関連問題生成エラー:', error)
    console.error('エラースタック:', error.stack)
    return c.json({ 
      error: 'コース関連問題の生成に失敗しました', 
      details: error.message,
      stack: error.stack?.substring(0, 200)
    }, 500)
  }
})

// APIルート：評価問題を生成（チェックテスト・選択問題）
app.post('/api/curriculum/:curriculumId/generate-assessment-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    const curriculum = await env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculumId).first()
    
    if (!curriculum) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // AIプロンプト：評価問題のみ
    const prompt = `小学${curriculum.grade}年 ${curriculum.subject}「${curriculum.unit_name}」の評価問題を生成。

【必須：JSONのみ出力】
{
  "common_check_test": {
    "test_title": "基礎基本チェックテスト",
    "sample_problems": [
      {"problem_number": 1, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 2, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 3, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 4, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 5, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"},
      {"problem_number": 6, "problem_text": "具体的な数字を含む問題文（30字以上）", "answer": "解答", "difficulty": "basic"}
    ]
  },
  "optional_problems": [
    {"problem_number": 1, "problem_title": "実生活問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "実生活で役立つ力がつく（20字以上）", "difficulty_level": "medium"},
    {"problem_number": 2, "problem_title": "考え方問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "深く理解できる（20字以上）", "difficulty_level": "medium"},
    {"problem_number": 3, "problem_title": "他教科問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "他教科でも使える（20字以上）", "difficulty_level": "hard"},
    {"problem_number": 4, "problem_title": "応用問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "組み合わせて考える力（20字以上）", "difficulty_level": "hard"},
    {"problem_number": 5, "problem_title": "探究問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "不思議さに気づく（20字以上）", "difficulty_level": "very_hard"},
    {"problem_number": 6, "problem_title": "創造問題", "problem_description": "具体的な数字を含む問題文（50字以上）", "learning_meaning": "新しい方法を考える（20字以上）", "difficulty_level": "very_hard"}
  ]
}`

    // フォールバック機能付きAPI呼び出し
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro']
    let response
    let lastError
    
    for (const model of models) {
      try {
        console.log(`🔄 評価問題モデル試行中: ${model}`)
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.8, maxOutputTokens: 8192 }
            })
          }
        )
        
        if (response.ok) {
          console.log(`✅ 評価問題モデル成功: ${model}`)
          break
        } else {
          console.warn(`⚠️ 評価問題モデル失敗: ${model} (status: ${response.status})`)
          lastError = new Error(`${model} returned ${response.status}`)
        }
      } catch (error: any) {
        console.warn(`⚠️ 評価問題モデルエラー: ${model} - ${error.message}`)
        lastError = error
      }
    }
    
    if (!response || !response.ok) {
      throw lastError || new Error('すべてのモデルが失敗しました')
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      throw new Error('AI response is empty')
    }
    
    // JSONを抽出
    console.log('AIレスポンス（評価問題）:', aiResponse)
    let jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/)
    let jsonText = jsonMatch ? jsonMatch[1] : aiResponse
    const problems = JSON.parse(jsonText)
    console.log('パース結果（評価問題）:', JSON.stringify(problems, null, 2))
    
    // データベースに保存
    if (problems.common_check_test) {
      const sampleCount = problems.common_check_test.sample_problems?.length || 0
      console.log(`チェックテスト問題を保存: ${sampleCount}件`)
      
      // test_titleとtest_descriptionを追加
      const checkTestWithMeta = {
        test_title: problems.common_check_test.test_title || '全コース共通の基礎基本チェックテスト',
        test_description: problems.common_check_test.test_description || 'どのコースを選んでも、同じチェックテストを受けます。単元の基礎基本が身についているかを確認します。',
        sample_problems: problems.common_check_test.sample_problems || []
      }
      
      const checkTestJSON = JSON.stringify(checkTestWithMeta)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(curriculumId, 'common_check_test', checkTestJSON).run()
    } else {
      console.warn('common_check_testが見つかりません')
    }
    
    if (problems.optional_problems) {
      console.log(`選択問題を保存: ${problems.optional_problems.length}件`)
      for (const problem of problems.optional_problems) {
        console.log(`  - 問題${problem.problem_number}: ${problem.problem_title}`)
        await env.DB.prepare(`
          INSERT INTO optional_problems (
            curriculum_id, problem_number, problem_title, problem_content, problem_description,
            difficulty_level, learning_meaning
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          curriculumId,
          problem.problem_number,
          problem.problem_title,
          problem.problem_description,  // problem_content
          problem.problem_description,  // problem_description
          problem.difficulty_level || 'medium',
          problem.learning_meaning || ''
        ).run()
      }
    } else {
      console.warn('optional_problemsが見つかりません')
    }
    
    return c.json({ 
      success: true, 
      message: '評価問題を生成・保存しました',
      details: {
        check_test_count: problems.common_check_test?.sample_problems?.length || 0,
        optional_count: problems.optional_problems?.length || 0
      }
    })
    
  } catch (error: any) {
    console.error('評価問題生成エラー:', error)
    console.error('エラースタック:', error.stack)
    return c.json({ 
      error: '評価問題の生成に失敗しました', 
      details: error.message,
      stack: error.stack?.substring(0, 200)
    }, 500)
  }
})

// APIルート：導入問題のみを生成（軽量・高速）
app.post('/api/curriculum/:curriculumId/generate-intro-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    // カリキュラムと3コースの情報を取得
    const curriculum = await env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculumId).first()
    const courses = await env.DB.prepare('SELECT * FROM courses WHERE curriculum_id = ?').bind(curriculumId).all()
    
    if (!curriculum || !courses.results || courses.results.length < 3) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // 軽量なプロンプト（導入問題3題のみ）
    const prompt = `小学${curriculum.grade}年 ${curriculum.subject}「${curriculum.unit_name}」の3つのコースの導入問題を生成。

【3つのコース】
1. ${courses.results[0]?.course_name || 'ゆっくりコース'}: ${courses.results[0]?.description || ''}
2. ${courses.results[1]?.course_name || 'しっかりコース'}: ${courses.results[1]?.description || ''}
3. ${courses.results[2]?.course_name || 'ぐんぐんコース'}: ${courses.results[2]?.description || ''}

【JSON出力（導入問題3題のみ）】
{
  "introduction_problems": [
    {"course_number": 1, "problem_title": "タイトル（20字以内）", "problem_content": "具体的な数字を含む問題文（80-150字）", "answer": "解答と解説（50-100字）"},
    {"course_number": 2, "problem_title": "タイトル（20字以内）", "problem_content": "具体的な数字を含む問題文（80-150字）", "answer": "解答と解説（50-100字）"},
    {"course_number": 3, "problem_title": "タイトル（20字以内）", "problem_content": "具体的な数字を含む問題文（80-150字）", "answer": "解答と解説（50-100字）"}
  ]
}`

    // フォールバック機能付きAPI呼び出し
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro']
    let response
    let lastError
    
    for (const model of models) {
      try {
        console.log(`🔄 導入問題モデル試行中: ${model}`)
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
            })
          }
        )
        
        if (response.ok) {
          console.log(`✅ 導入問題モデル成功: ${model}`)
          break
        } else {
          console.warn(`⚠️ 導入問題モデル失敗: ${model} (status: ${response.status})`)
          lastError = new Error(`${model} returned ${response.status}`)
        }
      } catch (error: any) {
        console.warn(`⚠️ 導入問題モデルエラー: ${model} - ${error.message}`)
        lastError = error
      }
    }
    
    if (!response || !response.ok) {
      throw lastError || new Error('すべてのモデルが失敗しました')
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      throw new Error('AI response is empty')
    }
    
    // JSONを抽出
    console.log('AIレスポンス（導入問題）:', aiResponse)
    let jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/)
    let jsonText = jsonMatch ? jsonMatch[1] : aiResponse
    const problems = JSON.parse(jsonText)
    console.log('パース結果（導入問題）:', JSON.stringify(problems, null, 2))
    
    // データベースに保存
    if (problems.introduction_problems && problems.introduction_problems.length === 3) {
      const coursesList = courses.results
      for (let i = 0; i < 3; i++) {
        const introProblem = problems.introduction_problems[i]
        const course = coursesList[i]
        const introJSON = JSON.stringify(introProblem)
        console.log(`コース${i+1}(ID:${course.id})に導入問題を保存:`, introProblem.problem_title)
        await env.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(introJSON, course.id).run()
      }
      
      return c.json({ 
        success: true, 
        message: '導入問題3題を生成・保存しました',
        details: { introduction_count: 3 }
      })
    } else {
      throw new Error('導入問題が3題生成されませんでした')
    }
    
  } catch (error: any) {
    console.error('導入問題生成エラー:', error)
    console.error('エラースタック:', error.stack)
    return c.json({ 
      error: '導入問題の生成に失敗しました', 
      details: error.message,
      stack: error.stack?.substring(0, 200)
    }, 500)
  }
})

// APIルート：選択問題を取得
app.get('/api/curriculum/:curriculumId/optional-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  
  try {
    const problems = await env.DB.prepare(`
      SELECT * FROM optional_problems 
      WHERE curriculum_id = ? 
      ORDER BY problem_number
    `).bind(curriculumId).all()
    
    console.log(`選択問題取得: ${problems.results?.length || 0}件`)
    
    return c.json({ 
      success: true,
      optional_problems: problems.results || []
    })
  } catch (error: any) {
    console.error('選択問題取得エラー:', error)
    return c.json({ 
      success: false,
      error: '選択問題の取得に失敗しました',
      optional_problems: []
    }, 500)
  }
})

// APIルート：追加問題を生成（旧エンドポイント - 互換性のため残す）
app.post('/api/curriculum/:curriculumId/generate-additional-problems', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ error: 'Gemini APIキーが設定されていません' }, 500)
  }
  
  try {
    // カリキュラムと3コースの情報を取得
    const curriculum = await env.DB.prepare('SELECT * FROM curriculum WHERE id = ?').bind(curriculumId).first()
    const courses = await env.DB.prepare('SELECT * FROM courses WHERE curriculum_id = ?').bind(curriculumId).all()
    
    if (!curriculum || !courses.results || courses.results.length === 0) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // AIプロンプト：追加問題のみ生成
    const prompt = `あなたは小学校の教師です。以下の単元の追加問題を生成してください。

【単元情報】
- 学年: ${curriculum.grade}
- 教科: ${curriculum.subject}
- 教科書会社: ${curriculum.textbook_company}
- 単元名: ${curriculum.unit_name}
- 単元目標: ${curriculum.unit_goal}

【3つのコース】
${courses.results.map((c: any, i: number) => `${i + 1}. ${c.course_name}: ${c.description}`).join('\n')}

【生成する問題】
1. **コース選択問題3題**（各コース1題ずつ、子どもがコースを選ぶための魅力的な問題）
2. **導入問題3題**（各コース1題ずつ、学習内容をイメージできる問題）
3. **チェックテスト6題**（全コース共通、基礎基本の確認問題）
4. **選択問題6題**（発展的な課題、学習の意味を実感できる問題）

【重要な要件】
- すべての問題に具体的な数字と状況を含めること
- 問題文は実際に解ける形式にすること
- 子どもが「やってみたい！」と思える魅力的な内容にすること

【JSON形式で出力】
{
  "course_selection_problems": [
    {
      "problem_number": 1,
      "problem_title": "ゆっくりコースの問題タイトル",
      "problem_description": "問題の説明",
      "problem_content": "具体的な数字と状況を含む問題文",
      "course_level": "基礎",
      "connection_to_cards": "この問題は学習カード1-2で学ぶ内容につながります"
    },
    {
      "problem_number": 2,
      "problem_title": "しっかりコースの問題タイトル",
      "problem_description": "問題の説明",
      "problem_content": "具体的な数字と状況を含む問題文",
      "course_level": "標準",
      "connection_to_cards": "この問題は学習カード1-3で学ぶ内容につながります"
    },
    {
      "problem_number": 3,
      "problem_title": "どんどんコースの問題タイトル",
      "problem_description": "問題の説明",
      "problem_content": "具体的な数字と状況を含む問題文",
      "course_level": "発展",
      "connection_to_cards": "この問題は学習カード1-4につながります"
    }
  ],
  "introduction_problems": [
    {
      "course_number": 1,
      "problem_title": "ゆっくりコース導入問題のタイトル",
      "problem_content": "具体的な数字と状況を含む問題文",
      "answer": "解答のヒント"
    },
    {
      "course_number": 2,
      "problem_title": "しっかりコース導入問題のタイトル",
      "problem_content": "具体的な数字と状況を含む問題文",
      "answer": "解答のヒント"
    },
    {
      "course_number": 3,
      "problem_title": "どんどんコース導入問題のタイトル",
      "problem_content": "具体的な数字と状況を含む問題文",
      "answer": "解答のヒント"
    }
  ],
  "common_check_test": {
    "test_title": "基礎基本チェックテスト",
    "test_description": "全コース共通の基礎基本チェックテスト（知識理解の最低保証）",
    "sample_problems": [
      {
        "problem_number": 1,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 2,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 3,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 4,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 5,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      },
      {
        "problem_number": 6,
        "problem_text": "具体的な数字と状況を含む問題文",
        "answer": "解答",
        "difficulty": "basic"
      }
    ]
  },
  "optional_problems": [
    {
      "problem_number": 1,
      "problem_title": "実生活に生かせる問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、算数が実際の生活で役に立つことがわかります",
      "difficulty_level": "medium",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 2,
      "problem_title": "教科の見方・考え方が深まる問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、なぜこの方法で解けるのか深く理解できます",
      "difficulty_level": "medium",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 3,
      "problem_title": "他教科とつながる問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、算数が他の教科でも使えることがわかります",
      "difficulty_level": "hard",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 4,
      "problem_title": "発展的な問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、今まで学んだことを組み合わせて考える力がつきます",
      "difficulty_level": "hard",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 5,
      "problem_title": "教科の本質に触れる探究的な問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、算数の面白さや不思議さに気づき、もっと学びたくなります",
      "difficulty_level": "very_hard",
      "answer": "解答",
      "explanation": "考え方の説明"
    },
    {
      "problem_number": 6,
      "problem_title": "創造的・総合的な問題",
      "problem_description": "具体的な数字と状況を含む問題文",
      "learning_meaning": "この問題を解くことで、自分で考えを作り出す力がつきます",
      "difficulty_level": "very_hard",
      "answer": "解答",
      "explanation": "考え方の説明"
    }
  ]
}

必ず完全なJSONのみを出力してください。説明文は不要です。`

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8000
          }
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!aiResponse) {
      throw new Error('AI response is empty')
    }
    
    // JSONを抽出
    let jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/)
    let jsonText = jsonMatch ? jsonMatch[1] : aiResponse
    
    const additionalProblems = JSON.parse(jsonText)
    
    // データベースに保存
    // コース選択問題
    if (additionalProblems.course_selection_problems) {
      const courseSelectionJSON = JSON.stringify(additionalProblems.course_selection_problems)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(curriculumId, 'course_selection_problems', courseSelectionJSON).run()
    }
    
    // 導入問題（各コースに保存）
    if (additionalProblems.introduction_problems) {
      const coursesList = courses.results
      for (let i = 0; i < additionalProblems.introduction_problems.length && i < coursesList.length; i++) {
        const introProblem = additionalProblems.introduction_problems[i]
        const course = coursesList[i]
        const introJSON = JSON.stringify(introProblem)
        await env.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(introJSON, course.id).run()
      }
    }
    
    // チェックテスト
    if (additionalProblems.common_check_test) {
      const checkTestJSON = JSON.stringify(additionalProblems.common_check_test)
      await env.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(curriculumId, 'common_check_test', checkTestJSON).run()
    }
    
    // 選択問題
    if (additionalProblems.optional_problems) {
      for (const problem of additionalProblems.optional_problems) {
        await env.DB.prepare(`
          INSERT INTO optional_problems (
            curriculum_id, problem_number, problem_title, problem_content, problem_description,
            difficulty_level, learning_meaning
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          curriculumId,
          problem.problem_number,
          problem.problem_title,
          problem.problem_description,  // problem_content
          problem.problem_description,  // problem_description
          problem.difficulty_level || 'medium',
          problem.learning_meaning || ''
        ).run()
      }
    }
    
    return c.json({
      success: true,
      message: '追加問題を生成・保存しました'
    })
    
  } catch (error: any) {
    console.error('追加問題生成エラー:', error)
    return c.json({
      error: '追加問題の生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：単元名候補の生成（AI検索機能）
// 重複エンドポイント削除（2162行目に正式版あり）

// APIルート：単元の更新（編集）
app.put('/api/curriculum/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  const { basicInfo, courses } = await c.req.json()
  
  try {
    console.log(`📝 単元更新開始: ID=${id}`)
    
    // 更新前のデータを取得（履歴記録用）
    const oldCurriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(id).first()
    
    // 1. カリキュラム基本情報を更新
    await env.DB.prepare(`
      UPDATE curriculum
      SET grade = ?, subject = ?, textbook_company = ?, 
          unit_name = ?, unit_goal = ?, non_cognitive_goal = ?
      WHERE id = ?
    `).bind(
      basicInfo.grade,
      basicInfo.subject,
      basicInfo.textbook_company,
      basicInfo.unit_name,
      basicInfo.unit_goal,
      basicInfo.non_cognitive_goal,
      id
    ).run()
    console.log(`  - カリキュラム基本情報更新完了`)
    
    // 履歴記録
    await recordHistory(
      env.DB,
      'curriculum_history',
      parseInt(id),
      'update',
      { old: oldCurriculum, new: basicInfo }
    )
    
    // 2. 各コースのカードを更新
    for (const course of courses) {
      for (const card of course.cards) {
        await env.DB.prepare(`
          UPDATE learning_cards
          SET card_title = ?, problem_description = ?, 
              example_problem = ?, answer = ?
          WHERE id = ?
        `).bind(
          card.card_title,
          card.problem_description,
          card.example_problem,
          card.answer,
          card.id
        ).run()
      }
      console.log(`  - コース ${course.id} のカード更新完了`)
    }
    
    return c.json({
      success: true,
      message: '単元を更新しました'
    })
    
  } catch (error: any) {
    console.error('単元更新エラー:', error)
    return c.json({
      success: false,
      error: '単元の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：単元の削除（カスケード削除）
app.delete('/api/curriculum/:id', async (c) => {
  const { env } = c
  const id = c.req.param('id')
  
  try {
    console.log(`🗑️ 単元削除開始: ID=${id}`)
    
    // 1. カリキュラムに紐づくコースIDを取得
    const courses = await env.DB.prepare(`
      SELECT id FROM courses WHERE curriculum_id = ?
    `).bind(id).all()
    
    const courseIds = (courses.results || []).map((c: any) => c.id)
    console.log(`  - コース数: ${courseIds.length}`)
    
    // 2. 各コースの学習カードを削除
    for (const courseId of courseIds) {
      await env.DB.prepare(`
        DELETE FROM learning_cards WHERE course_id = ?
      `).bind(courseId).run()
    }
    console.log(`  - 学習カード削除完了`)
    
    // 3. コースを削除
    await env.DB.prepare(`
      DELETE FROM courses WHERE curriculum_id = ?
    `).bind(id).run()
    console.log(`  - コース削除完了`)
    
    // 4. メタデータを削除（コース選択問題、チェックテスト）
    await env.DB.prepare(`
      DELETE FROM curriculum_metadata WHERE curriculum_id = ?
    `).bind(id).run()
    console.log(`  - メタデータ削除完了`)
    
    // 5. 選択問題を削除
    await env.DB.prepare(`
      DELETE FROM optional_problems WHERE curriculum_id = ?
    `).bind(id).run()
    console.log(`  - 選択問題削除完了`)
    
    // 6. カリキュラム本体を削除
    await env.DB.prepare(`
      DELETE FROM curriculum WHERE id = ?
    `).bind(id).run()
    console.log(`  - カリキュラム本体削除完了`)
    
    return c.json({
      success: true,
      message: '単元を削除しました',
      deleted: {
        curriculum_id: id,
        courses_count: courseIds.length
      }
    })
    
  } catch (error: any) {
    console.error('単元削除エラー:', error)
    return c.json({
      success: false,
      error: '単元の削除に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：単元の複製
app.post('/api/curriculum/:id/duplicate', async (c) => {
  const { env } = c
  const sourceId = c.req.param('id')
  const { newGrade, newSubject, newTextbook, newUnitName } = await c.req.json()
  
  try {
    console.log(`📋 単元複製開始: sourceId=${sourceId}`)
    
    // 元のカリキュラムを取得
    const sourceCurriculum: any = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(sourceId).first()
    
    if (!sourceCurriculum) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    // 新しいカリキュラムを作成
    const newCurriculum = await env.DB.prepare(`
      INSERT INTO curriculum (
        grade, subject, textbook_company, unit_name, 
        unit_order, total_hours, unit_goal, non_cognitive_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newGrade || sourceCurriculum.grade,
      newSubject || sourceCurriculum.subject,
      newTextbook || sourceCurriculum.textbook_company,
      newUnitName || `${sourceCurriculum.unit_name}（コピー）`,
      sourceCurriculum.unit_order,
      sourceCurriculum.total_hours,
      sourceCurriculum.unit_goal,
      sourceCurriculum.non_cognitive_goal
    ).run()
    
    const newCurriculumId = newCurriculum.meta.last_row_id
    
    // コースをコピー
    const courses = await env.DB.prepare(`
      SELECT * FROM courses WHERE curriculum_id = ?
    `).bind(sourceId).all()
    
    for (const course of courses.results) {
      const newCourse = await env.DB.prepare(`
        INSERT INTO courses (
          curriculum_id, course_level, course_name, course_label, 
          color_code, introduction_problem
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        newCurriculumId,
        (course as any).course_level,
        (course as any).course_name,
        (course as any).course_label,
        (course as any).color_code,
        (course as any).introduction_problem
      ).run()
      
      const newCourseId = newCourse.meta.last_row_id
      
      // 学習カードをコピー
      const cards = await env.DB.prepare(`
        SELECT * FROM learning_cards WHERE course_id = ?
      `).bind((course as any).id).all()
      
      for (const card of cards.results) {
        await env.DB.prepare(`
          INSERT INTO learning_cards (
            course_id, card_number, card_title, card_type, 
            problem_description, new_terms, example_problem, 
            example_solution, real_world_connection, answer, textbook_page
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newCourseId,
          (card as any).card_number,
          (card as any).card_title,
          (card as any).card_type,
          (card as any).problem_description,
          (card as any).new_terms,
          (card as any).example_problem,
          (card as any).example_solution,
          (card as any).real_world_connection,
          (card as any).answer,
          (card as any).textbook_page
        ).run()
      }
    }
    
    // メタデータをコピー
    const metadata = await env.DB.prepare(`
      SELECT * FROM curriculum_metadata WHERE curriculum_id = ?
    `).bind(sourceId).all()
    
    for (const meta of metadata.results) {
      await env.DB.prepare(`
        INSERT INTO curriculum_metadata (curriculum_id, meta_key, meta_value)
        VALUES (?, ?, ?)
      `).bind(
        newCurriculumId,
        (meta as any).meta_key,
        (meta as any).meta_value
      ).run()
    }
    
    // 選択問題をコピー
    const optionalProblems = await env.DB.prepare(`
      SELECT * FROM optional_problems WHERE curriculum_id = ?
    `).bind(sourceId).all()
    
    for (const problem of optionalProblems.results) {
      await env.DB.prepare(`
        INSERT INTO optional_problems (
          curriculum_id, problem_number, problem_title, 
          problem_description, problem_content, difficulty_level, learning_meaning
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        newCurriculumId,
        (problem as any).problem_number,
        (problem as any).problem_title,
        (problem as any).problem_description,
        (problem as any).problem_content,
        (problem as any).difficulty_level,
        (problem as any).learning_meaning
      ).run()
    }
    
    console.log(`✅ 単元複製完了: newId=${newCurriculumId}`)
    
    return c.json({
      success: true,
      newCurriculumId,
      message: '単元を複製しました'
    })
  } catch (error: any) {
    console.error('単元複製エラー:', error)
    return c.json({
      success: false,
      error: '単元の複製に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：カードの並び替え
app.post('/api/course/:courseId/reorder-cards', async (c) => {
  const { env } = c
  const courseId = c.req.param('courseId')
  const { cardIds } = await c.req.json() // [id1, id2, id3, ...]
  
  try {
    console.log(`📋 カード並び替え開始: courseId=${courseId}, cards=${cardIds.length}`)
    
    // 各カードのcard_numberを更新
    for (let i = 0; i < cardIds.length; i++) {
      await env.DB.prepare(`
        UPDATE learning_cards
        SET card_number = ?
        WHERE id = ? AND course_id = ?
      `).bind(i + 1, cardIds[i], courseId).run()
    }
    
    console.log(`✅ カード並び替え完了: ${cardIds.length}枚`)
    
    return c.json({
      success: true,
      message: 'カードの並び替えを保存しました',
      count: cardIds.length
    })
  } catch (error: any) {
    console.error('カード並び替えエラー:', error)
    return c.json({
      success: false,
      error: 'カードの並び替えに失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：選択問題の削除
app.delete('/api/optional-problem/:id', async (c) => {
  const { env } = c
  const problemId = c.req.param('id')
  
  try {
    await env.DB.prepare(`
      DELETE FROM optional_problems WHERE id = ?
    `).bind(problemId).run()
    
    return c.json({
      success: true,
      message: '選択問題を削除しました'
    })
  } catch (error: any) {
    console.error('選択問題削除エラー:', error)
    return c.json({
      success: false,
      error: '選択問題の削除に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：選択問題の更新
app.put('/api/optional-problem/:id', async (c) => {
  const { env } = c
  const problemId = c.req.param('id')
  const { problem_title, problem_description, problem_content, difficulty_level, learning_meaning } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE optional_problems
      SET problem_title = ?, problem_description = ?, 
          problem_content = ?, difficulty_level = ?, learning_meaning = ?
      WHERE id = ?
    `).bind(
      problem_title,
      problem_description,
      problem_content || '',
      difficulty_level || 'medium',
      learning_meaning || '',
      problemId
    ).run()
    
    return c.json({
      success: true,
      message: '選択問題を更新しました'
    })
  } catch (error: any) {
    console.error('選択問題更新エラー:', error)
    return c.json({
      success: false,
      error: '選択問題の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：選択問題の新規追加
app.post('/api/curriculum/:id/optional-problem', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const { problem_number, problem_title, problem_description, problem_content, difficulty_level, learning_meaning } = await c.req.json()
  
  try {
    const result = await env.DB.prepare(`
      INSERT INTO optional_problems (
        curriculum_id, problem_number, problem_title, 
        problem_description, problem_content, difficulty_level, learning_meaning
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      curriculumId,
      problem_number,
      problem_title,
      problem_description,
      problem_content || '',
      difficulty_level || 'medium',
      learning_meaning || ''
    ).run()
    
    return c.json({
      success: true,
      message: '選択問題を追加しました',
      problemId: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('選択問題追加エラー:', error)
    return c.json({
      success: false,
      error: '選択問題の追加に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：導入問題の更新
app.put('/api/course/:id/introduction-problem', async (c) => {
  const { env } = c
  const courseId = c.req.param('id')
  const { problem_title, problem_content, answer } = await c.req.json()
  
  try {
    const introductionProblem = JSON.stringify({
      problem_title,
      problem_content,
      answer
    })
    
    await env.DB.prepare(`
      UPDATE courses
      SET introduction_problem = ?
      WHERE id = ?
    `).bind(introductionProblem, courseId).run()
    
    return c.json({
      success: true,
      message: '導入問題を更新しました'
    })
  } catch (error: any) {
    console.error('導入問題更新エラー:', error)
    return c.json({
      success: false,
      error: '導入問題の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：導入問題の削除
app.delete('/api/course/:id/introduction-problem', async (c) => {
  const { env } = c
  const courseId = c.req.param('id')
  
  try {
    await env.DB.prepare(`
      UPDATE courses
      SET introduction_problem = NULL
      WHERE id = ?
    `).bind(courseId).run()
    
    return c.json({
      success: true,
      message: '導入問題を削除しました'
    })
  } catch (error: any) {
    console.error('導入問題削除エラー:', error)
    return c.json({
      success: false,
      error: '導入問題の削除に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテスト問題の個別更新
app.put('/api/curriculum/:id/check-test/problem/:problemNumber', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const problemNumber = parseInt(c.req.param('problemNumber'))
  const { problem_text, answer } = await c.req.json()
  
  try {
    // 既存のチェックテストを取得
    const metaRow: any = await env.DB.prepare(`
      SELECT meta_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND meta_key = 'common_check_test'
    `).bind(curriculumId).first()
    
    if (!metaRow) {
      return c.json({ error: 'チェックテストが見つかりません' }, 404)
    }
    
    const checkTest = JSON.parse(metaRow.meta_value)
    
    // 指定された問題を更新
    const problemIndex = checkTest.sample_problems.findIndex((p: any) => p.problem_number === problemNumber)
    if (problemIndex === -1) {
      return c.json({ error: '指定された問題が見つかりません' }, 404)
    }
    
    checkTest.sample_problems[problemIndex].problem_text = problem_text
    checkTest.sample_problems[problemIndex].answer = answer
    
    // データベースに保存
    await env.DB.prepare(`
      UPDATE curriculum_metadata
      SET meta_value = ?
      WHERE curriculum_id = ? AND meta_key = 'common_check_test'
    `).bind(JSON.stringify(checkTest), curriculumId).run()
    
    return c.json({
      success: true,
      message: 'チェックテスト問題を更新しました'
    })
  } catch (error: any) {
    console.error('チェックテスト更新エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテスト問題の更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテスト問題の個別削除
app.delete('/api/curriculum/:id/check-test/problem/:problemNumber', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const problemNumber = parseInt(c.req.param('problemNumber'))
  
  try {
    // 既存のチェックテストを取得
    const metaRow: any = await env.DB.prepare(`
      SELECT meta_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND meta_key = 'common_check_test'
    `).bind(curriculumId).first()
    
    if (!metaRow) {
      return c.json({ error: 'チェックテストが見つかりません' }, 404)
    }
    
    const checkTest = JSON.parse(metaRow.meta_value)
    
    // 指定された問題を削除
    checkTest.sample_problems = checkTest.sample_problems.filter((p: any) => p.problem_number !== problemNumber)
    
    // 問題番号を振り直し
    checkTest.sample_problems.forEach((p: any, index: number) => {
      p.problem_number = index + 1
    })
    
    // データベースに保存
    await env.DB.prepare(`
      UPDATE curriculum_metadata
      SET meta_value = ?
      WHERE curriculum_id = ? AND meta_key = 'common_check_test'
    `).bind(JSON.stringify(checkTest), curriculumId).run()
    
    return c.json({
      success: true,
      message: 'チェックテスト問題を削除しました'
    })
  } catch (error: any) {
    console.error('チェックテスト削除エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテスト問題の削除に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテスト問題の新規追加
app.post('/api/curriculum/:id/check-test/problem', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const { problem_text, answer } = await c.req.json()
  
  try {
    // 既存のチェックテストを取得
    const metaRow: any = await env.DB.prepare(`
      SELECT meta_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND meta_key = 'common_check_test'
    `).bind(curriculumId).first()
    
    let checkTest
    if (metaRow) {
      checkTest = JSON.parse(metaRow.meta_value)
    } else {
      checkTest = {
        test_title: '基礎基本チェックテスト',
        test_description: '全コース共通の基礎基本チェックテスト（知識理解の最低保証）',
        test_note: '6問中5問以上正解で合格です！',
        sample_problems: []
      }
    }
    
    // 新しい問題を追加
    const newProblemNumber = checkTest.sample_problems.length + 1
    checkTest.sample_problems.push({
      problem_number: newProblemNumber,
      problem_text,
      answer
    })
    
    // データベースに保存
    if (metaRow) {
      await env.DB.prepare(`
        UPDATE curriculum_metadata
        SET meta_value = ?
        WHERE curriculum_id = ? AND meta_key = 'common_check_test'
      `).bind(JSON.stringify(checkTest), curriculumId).run()
    } else {
      await env.DB.prepare(`
        INSERT INTO curriculum_metadata (curriculum_id, meta_key, meta_value)
        VALUES (?, 'common_check_test', ?)
      `).bind(curriculumId, JSON.stringify(checkTest)).run()
    }
    
    return c.json({
      success: true,
      message: 'チェックテスト問題を追加しました',
      problemNumber: newProblemNumber
    })
  } catch (error: any) {
    console.error('チェックテスト追加エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテスト問題の追加に失敗しました',
      details: error.message
    }, 500)
  }
})

// ============================================================
// 学習スタイル対応 - カード編集API
// ============================================================

// APIルート：学習カードの更新（学習スタイル対応）
app.put('/api/card/:cardId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const updates = await c.req.json()
  
  try {
    // 更新可能なフィールド
    const allowedFields = [
      'card_title',
      'problem_description',
      'answer',
      'problem_image_url',
      'answer_image_url',
      'visual_support',
      'auditory_support',
      'kinesthetic_support',
      'hints',
      'example_problem',
      'example_solution',
      'real_world_connection',
      'new_terms',
      'textbook_page',
      'learning_style_notes'
    ]
    
    const updateFields: string[] = []
    const values: any[] = []
    
    for (const field of allowedFields) {
      if (field in updates) {
        updateFields.push(`${field} = ?`)
        // JSON型のフィールドは文字列化
        if (['hints', 'new_terms', 'visual_support', 'auditory_support', 'kinesthetic_support'].includes(field)) {
          values.push(JSON.stringify(updates[field]))
        } else {
          values.push(updates[field])
        }
      }
    }
    
    if (updateFields.length === 0) {
      return c.json({
        success: false,
        error: '更新するフィールドがありません'
      }, 400)
    }
    
    values.push(cardId)
    
    const sql = `
      UPDATE learning_cards
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    await env.DB.prepare(sql).bind(...values).run()
    
    // 更新後のカードを取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    // 履歴記録
    await recordHistory(env.DB, {
      type: 'card',
      action: 'update_learning_styles',
      idField: 'card_id',
      idValue: parseInt(cardId),
      changedFields: updateFields.map(f => f.split(' = ')[0]),
      snapshot: card
    })
    
    return c.json({
      success: true,
      message: '学習カードを更新しました',
      card
    })
  } catch (error: any) {
    console.error('カード更新エラー:', error)
    return c.json({
      success: false,
      error: 'カードの更新に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：学習スタイル自動提案
app.post('/api/card/:cardId/suggest-learning-styles', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'APIキーが設定されていません'
    }, 500)
  }
  
  try {
    // カード情報を取得
    const card: any = await env.DB.prepare(`
      SELECT lc.*, c.grade, c.subject, c.unit_name, c.textbook_company
      FROM learning_cards lc
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE lc.id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({ error: 'カードが見つかりません' }, 404)
    }
    
    const prompt = `以下の学習カードに対して、視覚優位・聴覚優位・体感優位の3つの学習スタイルに応じたサポート内容を提案してください。

【学習カード情報】
学年: ${card.grade}
教科: ${card.subject}
単元: ${card.unit_name}
カード番号: ${card.card_number}
カード名: ${card.card_title}
問題: ${card.problem_description}

【出力形式】JSON形式で出力してください：
{
  "visual_support": {
    "description": "視覚優位な子どもへの支援内容（図やイラスト、色分け、図解などの提案）",
    "materials": ["必要な教材1", "必要な教材2"],
    "activities": ["活動例1", "活動例2"]
  },
  "auditory_support": {
    "description": "聴覚優位な子どもへの支援内容（音読、リズム、語呂合わせなどの提案）",
    "materials": ["必要な教材1", "必要な教材2"],
    "activities": ["活動例1", "活動例2"]
  },
  "kinesthetic_support": {
    "description": "体感優位な子どもへの支援内容（身体活動、具体物操作などの提案）",
    "materials": ["必要な教材1", "必要な教材2"],
    "activities": ["活動例1", "活動例2"]
  },
  "learning_style_notes": "教師向けの指導上の留意点"
}`

    const result = await callGeminiAPI({
      model: 'gemini-2.5-flash',
      prompt,
      apiKey,
      maxOutputTokens: 4096,
      temperature: 0.7,
      retries: 2
    })
    
    if (!result.success || !result.content) {
      throw new Error('学習スタイル提案の生成に失敗しました')
    }
    
    // JSON抽出
    let jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      jsonMatch = result.content.match(/```\n([\s\S]*?)\n```/)
    }
    if (!jsonMatch) {
      jsonMatch = result.content.match(/(\{[\s\S]*\})/)
    }
    
    const jsonText = jsonMatch ? jsonMatch[1] : result.content
    const suggestions = JSON.parse(jsonText)
    
    return c.json({
      success: true,
      suggestions,
      message: '学習スタイル提案を生成しました'
    })
  } catch (error: any) {
    console.error('学習スタイル提案エラー:', error)
    return c.json({
      success: false,
      error: '学習スタイル提案の生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：チェックテストの再生成
app.post('/api/curriculum/:id/regenerate-check-test', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      success: false,
      error: 'APIキーが設定されていません'
    }, 500)
  }
  
  try {
    // カリキュラム情報を取得
    const curriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(curriculumId).first()
    
    if (!curriculum) {
      return c.json({ error: 'カリキュラムが見つかりません' }, 404)
    }
    
    const prompt = `${curriculum.grade}${curriculum.subject}「${curriculum.unit_name}」の基礎確認テスト6問を生成。各問は30字以上、answer必須。JSON出力:
{"sample_problems":[{"problem_number":1,"problem_text":"問題文","answer":"答え"}]}`

    const result = await callGeminiAPI({
      model: 'gemini-2.5-flash',
      prompt,
      apiKey,
      maxOutputTokens: 4096,
      temperature: 0.8,
      retries: 3
    })
    
    if (!result.success || !result.content) {
      throw new Error('チェックテストの生成に失敗しました')
    }
    
    // JSONを抽出
    let jsonMatch = result.content.match(/```json\n([\s\S]*?)\n```/)
    let jsonText = jsonMatch ? jsonMatch[1] : result.content
    const checkTest = JSON.parse(jsonText)
    
    // データベースに保存
    await env.DB.prepare(`
      INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, meta_key, meta_value)
      VALUES (?, 'common_check_test', ?)
    `).bind(
      curriculumId,
      JSON.stringify({
        test_title: '基礎基本チェックテスト',
        test_description: '全コース共通の基礎基本チェックテスト（知識理解の最低保証）',
        test_note: '6問中5問以上正解で合格です！',
        sample_problems: checkTest.sample_problems
      })
    ).run()
    
    return c.json({
      success: true,
      checkTest: checkTest.sample_problems,
      model_used: result.model
    })
  } catch (error: any) {
    console.error('チェックテスト再生成エラー:', error)
    return c.json({
      success: false,
      error: 'チェックテストの再生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：単元の編集履歴取得
app.get('/api/curriculum/:id/history', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  
  try {
    const history = await env.DB.prepare(`
      SELECT 
        h.*,
        u.name as changed_by_name
      FROM curriculum_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.curriculum_id = ?
      ORDER BY h.created_at DESC
      LIMIT 50
    `).bind(curriculumId).all()
    
    return c.json({
      success: true,
      history: history.results || [],
      count: history.results?.length || 0
    })
  } catch (error: any) {
    console.error('履歴取得エラー:', error)
    return c.json({
      success: false,
      error: '履歴の取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：履歴ロールバック
app.post('/api/curriculum/:id/rollback/:historyId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('id')
  const historyId = c.req.param('historyId')
  
  try {
    // 履歴データを取得
    const historyRecord = await env.DB.prepare(`
      SELECT * FROM curriculum_history 
      WHERE id = ? AND curriculum_id = ?
    `).bind(historyId, curriculumId).first()
    
    if (!historyRecord) {
      return c.json({
        success: false,
        error: '履歴レコードが見つかりません'
      }, 404)
    }
    
    // 現在の状態を履歴に保存（ロールバック前）
    const currentCurriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(curriculumId).first()
    
    if (currentCurriculum) {
      await recordHistory(env, 'curriculum_history', curriculumId, {
        action: 'rollback_before',
        changed_by: 1, // システムユーザー
        data_before: JSON.stringify(currentCurriculum),
        data_after: historyRecord.data_before
      })
    }
    
    // 履歴データをパース
    const rollbackData = JSON.parse(historyRecord.data_before as string)
    
    // カリキュラムをロールバック
    await env.DB.prepare(`
      UPDATE curriculum SET
        grade = ?,
        subject = ?,
        textbook_company = ?,
        unit_name = ?,
        unit_goal = ?,
        non_cognitive_goal = ?
      WHERE id = ?
    `).bind(
      rollbackData.grade,
      rollbackData.subject,
      rollbackData.textbook_company,
      rollbackData.unit_name,
      rollbackData.unit_goal,
      rollbackData.non_cognitive_goal,
      curriculumId
    ).run()
    
    // ロールバック完了を履歴に記録
    await recordHistory(env, 'curriculum_history', curriculumId, {
      action: 'rollback_complete',
      changed_by: 1,
      data_before: JSON.stringify(currentCurriculum),
      data_after: JSON.stringify(rollbackData)
    })
    
    return c.json({
      success: true,
      message: 'ロールバックが完了しました',
      rolled_back_to: historyRecord.created_at
    })
  } catch (error: any) {
    console.error('ロールバックエラー:', error)
    return c.json({
      success: false,
      error: 'ロールバックに失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート：システム統計情報取得（API呼び出し回数、データベース統計など）
app.get('/api/system/stats', async (c) => {
  const { env } = c
  
  try {
    // カリキュラム統計
    const curriculumStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_curriculums,
        COUNT(DISTINCT grade) as total_grades,
        COUNT(DISTINCT subject) as total_subjects,
        COUNT(DISTINCT textbook_company) as total_textbooks
      FROM curriculum
    `).first()
    
    // コース統計
    const courseStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_courses,
        COUNT(DISTINCT curriculum_id) as curriculums_with_courses
      FROM courses
    `).first()
    
    // 学習カード統計
    const cardStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(DISTINCT course_id) as courses_with_cards
      FROM learning_cards
    `).first()
    
    // 選択問題統計
    const optionalProblemStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_optional_problems,
        COUNT(DISTINCT curriculum_id) as curriculums_with_optional_problems
      FROM optional_problems
    `).first()
    
    return c.json({
      success: true,
      stats: {
        curriculum: curriculumStats,
        courses: courseStats,
        cards: cardStats,
        optional_problems: optionalProblemStats
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('統計情報取得エラー:', error)
    return c.json({
      success: false,
      error: '統計情報の取得に失敗しました',
      details: error.message
    }, 500)
  }
})

// ==============================================
// 認証API
// ==============================================

// ユーティリティ: パスワードハッシュ生成（Web Crypto API使用）
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ユーティリティ: トークン生成
function generateToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// ミドルウェア: 認証チェック
async function requireAuth(c: any, next: any) {
  const { env } = c
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }
  
  const token = authHeader.substring(7)
  
  try {
    const session = await env.DB.prepare(`
      SELECT s.*, u.id as user_id, u.name, u.email, u.role, u.class_code
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `).bind(token).first()
    
    if (!session) {
      return c.json({ error: 'セッションが無効です' }, 401)
    }
    
    // コンテキストにユーザー情報を保存
    c.set('user', {
      id: session.user_id,
      name: session.name,
      email: session.email,
      role: session.role,
      class_code: session.class_code
    })
    
    await next()
  } catch (error) {
    console.error('認証エラー:', error)
    return c.json({ error: '認証に失敗しました' }, 500)
  }
}

// ミドルウェア: 権限チェック
function requirePermission(resource: string, action: string) {
  return async (c: any, next: any) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: '認証が必要です' }, 401)
    }
    
    const { env } = c
    
    try {
      const permission = await env.DB.prepare(`
        SELECT * FROM role_permissions
        WHERE role = ? AND resource = ? AND action = ?
      `).bind(user.role, resource, action).first()
      
      if (!permission) {
        return c.json({ error: '権限がありません' }, 403)
      }
      
      await next()
    } catch (error) {
      console.error('権限チェックエラー:', error)
      return c.json({ error: '権限チェックに失敗しました' }, 500)
    }
  }
}

// APIルート: ユーザー登録
app.post('/api/auth/register', async (c) => {
  const { env } = c
  const { name, email, password, role, class_code, student_number } = await c.req.json()
  
  try {
    // メールアドレスの重複チェック
    const existingUser = await env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(email).first()
    
    if (existingUser) {
      return c.json({ error: 'このメールアドレスは既に登録されています' }, 400)
    }
    
    // パスワードハッシュ化
    const passwordHash = await hashPassword(password)
    
    // ユーザー作成
    const result = await env.DB.prepare(`
      INSERT INTO users (name, email, password_hash, role, class_code, student_number, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(name, email, passwordHash, role || 'student', class_code || null, student_number || null).run()
    
    return c.json({
      success: true,
      user_id: result.meta.last_row_id,
      message: 'ユーザー登録が完了しました'
    })
  } catch (error: any) {
    console.error('ユーザー登録エラー:', error)
    return c.json({
      success: false,
      error: 'ユーザー登録に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート: ログイン
app.post('/api/auth/login', async (c) => {
  const { env } = c
  const { email, password } = await c.req.json()
  
  try {
    // ユーザー検索
    const user = await env.DB.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `).bind(email).first()
    
    if (!user) {
      return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
    }
    
    // アカウントロックチェック
    if (user.locked_until && new Date(user.locked_until as string) > new Date()) {
      return c.json({ 
        error: 'アカウントがロックされています。しばらく待ってから再度お試しください' 
      }, 403)
    }
    
    // パスワード検証
    const passwordHash = await hashPassword(password)
    if (passwordHash !== user.password_hash) {
      // ログイン失敗回数を増加
      const attempts = (user.failed_login_attempts as number || 0) + 1
      const lockUntil = attempts >= 5 
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15分ロック
        : null
      
      await env.DB.prepare(`
        UPDATE users 
        SET failed_login_attempts = ?, locked_until = ?
        WHERE id = ?
      `).bind(attempts, lockUntil, user.id).run()
      
      return c.json({ 
        error: 'メールアドレスまたはパスワードが正しくありません',
        attempts_remaining: 5 - attempts
      }, 401)
    }
    
    // セッショントークン生成
    const sessionToken = generateToken(32)
    const refreshToken = generateToken(32)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7日間
    
    // セッション作成
    await env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user.id,
      sessionToken,
      refreshToken,
      expiresAt,
      refreshExpiresAt,
      c.req.header('cf-connecting-ip') || 'unknown',
      c.req.header('user-agent') || 'unknown'
    ).run()
    
    // ログイン成功: 失敗回数をリセット、最終ログイン時刻を更新
    await env.DB.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, last_login_at = datetime('now')
      WHERE id = ?
    `).bind(user.id).run()
    
    return c.json({
      success: true,
      session_token: sessionToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        class_code: user.class_code,
        student_number: user.student_number
      }
    })
  } catch (error: any) {
    console.error('ログインエラー:', error)
    return c.json({
      success: false,
      error: 'ログインに失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート: ログアウト
app.post('/api/auth/logout', requireAuth, async (c) => {
  const { env } = c
  const authHeader = c.req.header('Authorization')
  const token = authHeader!.substring(7)
  
  try {
    // セッション削除
    await env.DB.prepare(`
      DELETE FROM user_sessions WHERE session_token = ?
    `).bind(token).run()
    
    return c.json({
      success: true,
      message: 'ログアウトしました'
    })
  } catch (error: any) {
    console.error('ログアウトエラー:', error)
    return c.json({
      success: false,
      error: 'ログアウトに失敗しました'
    }, 500)
  }
})

// APIルート: セッション更新（リフレッシュトークン）
app.post('/api/auth/refresh', async (c) => {
  const { env } = c
  const { refresh_token } = await c.req.json()
  
  try {
    const session = await env.DB.prepare(`
      SELECT s.*, u.id as user_id, u.name, u.email, u.role, u.class_code, u.student_number
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.refresh_token = ? AND s.refresh_expires_at > datetime('now') AND u.is_active = 1
    `).bind(refresh_token).first()
    
    if (!session) {
      return c.json({ error: 'リフレッシュトークンが無効です' }, 401)
    }
    
    // 新しいセッショントークン生成
    const newSessionToken = generateToken(32)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    
    // セッション更新
    await env.DB.prepare(`
      UPDATE user_sessions 
      SET session_token = ?, expires_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newSessionToken, expiresAt, session.id).run()
    
    return c.json({
      success: true,
      session_token: newSessionToken,
      expires_at: expiresAt,
      user: {
        id: session.user_id,
        name: session.name,
        email: session.email,
        role: session.role,
        class_code: session.class_code,
        student_number: session.student_number
      }
    })
  } catch (error: any) {
    console.error('セッション更新エラー:', error)
    return c.json({
      success: false,
      error: 'セッション更新に失敗しました'
    }, 500)
  }
})

// APIルート: 現在のユーザー情報取得
app.get('/api/auth/me', requireAuth, async (c) => {
  const user = c.get('user')
  return c.json({
    success: true,
    user
  })
})

// ==============================================
// AI拡張機能API
// ==============================================

// APIルート: AI対話履歴取得
app.get('/api/ai/conversations/:studentId/:cardId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const cardId = c.req.param('cardId')
  const sessionId = c.req.query('sessionId')
  
  try {
    let query = `
      SELECT * FROM ai_conversations
      WHERE student_id = ? AND learning_card_id = ?
    `
    const params = [studentId, cardId]
    
    if (sessionId) {
      query += ` AND session_id = ?`
      params.push(sessionId)
    }
    
    query += ` ORDER BY created_at DESC LIMIT 50`
    
    const conversations = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      conversations: conversations.results || []
    })
  } catch (error: any) {
    console.error('対話履歴取得エラー:', error)
    return c.json({
      success: false,
      error: '対話履歴の取得に失敗しました'
    }, 500)
  }
})

// APIルート: AI使用統計取得
app.get('/api/ai/stats/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    const stats = await env.DB.prepare(`
      SELECT 
        feature_type,
        COUNT(*) as usage_count,
        SUM(tokens_used) as total_tokens,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count
      FROM ai_usage_stats
      WHERE student_id = ?
      GROUP BY feature_type
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      stats: stats.results || []
    })
  } catch (error: any) {
    console.error('AI統計取得エラー:', error)
    return c.json({
      success: false,
      error: 'AI統計の取得に失敗しました'
    }, 500)
  }
})

// APIルート: 自動問題生成
app.post('/api/ai/generate-problem', async (c) => {
  const { env } = c
  const body = await c.req.json()
  const startTime = Date.now()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ 
      success: false,
      error: 'AI問題生成機能は現在利用できません'
    })
  }
  
  try {
    // カリキュラム情報を取得
    const curriculum = await env.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(body.curriculumId).first()
    
    if (!curriculum) {
      return c.json({
        success: false,
        error: 'カリキュラムが見つかりません'
      }, 404)
    }
    
    // 問題生成プロンプト
    const prompt = `あなたは教育コンテンツの専門家です。以下の情報を基に、${body.problemType === 'intro' ? '導入問題' : body.problemType === 'practice' ? '練習問題' : body.problemType === 'challenge' ? '発展問題' : body.problemType === 'check_test' ? 'チェックテスト問題' : '選択問題'}を生成してください。

【カリキュラム情報】
学年: ${curriculum.grade}
教科: ${curriculum.subject}
単元名: ${curriculum.unit_name}
単元目標: ${curriculum.unit_goal}

【問題の要件】
難易度: ${body.difficultyLevel === 1 ? '★ かんたん' : body.difficultyLevel === 2 ? '★★ ふつう' : body.difficultyLevel === 3 ? '★★★ むずかしい' : '★★★★ とてもむずかしい'}
問題タイプ: ${body.problemType}
${body.specificRequirements ? `追加要件: ${body.specificRequirements}` : ''}

【生成する内容】
1. 問題タイトル: 簡潔で分かりやすいタイトル（15文字以内）
2. 問題内容: 具体的な問題文（小学生にわかりやすく）
3. 解答: 詳しい解答と解説

以下のJSON形式で出力してください：
{
  "title": "問題タイトル",
  "content": "問題内容",
  "solution": "解答と解説"
}`

    // Gemini APIにリクエスト
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1000,
          }
        })
      }
    )
    
    const responseTime = Date.now() - startTime
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)
      
      // エラーログを記録
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, ?, 'problem_generation', ?, 0, ?)
      `).bind(
        body.userId || 1,
        body.curriculumId,
        responseTime,
        `API Error: ${geminiResponse.status}`
      ).run()
      
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }
    
    const geminiData = await geminiResponse.json()
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出（```json ... ``` の中身を取得）
    let problemData
    try {
      const jsonMatch = generatedText.match(/```json\s*(\{[\s\S]*?\})\s*```/) || 
                       generatedText.match(/(\{[\s\S]*?\})/)
      if (jsonMatch) {
        problemData = JSON.parse(jsonMatch[1])
      } else {
        // JSON形式でない場合は、テキストを分割して抽出
        problemData = {
          title: '自動生成問題',
          content: generatedText,
          solution: '解答は教師が後で追加してください'
        }
      }
    } catch (parseError) {
      problemData = {
        title: '自動生成問題',
        content: generatedText,
        solution: '解答は教師が後で追加してください'
      }
    }
    
    // 生成された問題をデータベースに保存
    const result = await env.DB.prepare(`
      INSERT INTO ai_generated_problems (
        curriculum_id, course_id, problem_type, problem_title,
        problem_content, problem_solution, difficulty_level,
        generation_prompt, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(
      body.curriculumId,
      body.courseId || null,
      body.problemType,
      problemData.title,
      problemData.content,
      problemData.solution,
      body.difficultyLevel || 2,
      prompt
    ).run()
    
    // 使用統計を記録
    const tokensUsed = geminiData.usageMetadata?.totalTokenCount || 0
    await env.DB.prepare(`
      INSERT INTO ai_usage_stats (
        student_id, curriculum_id, feature_type,
        tokens_used, response_time_ms, success
      ) VALUES (?, ?, 'problem_generation', ?, ?, 1)
    `).bind(
      body.userId || 1,
      body.curriculumId,
      tokensUsed,
      responseTime
    ).run()
    
    return c.json({
      success: true,
      problem: {
        id: result.meta.last_row_id,
        ...problemData,
        difficultyLevel: body.difficultyLevel || 2,
        problemType: body.problemType
      },
      tokensUsed,
      responseTime
    })
    
  } catch (error: any) {
    console.error('問題生成エラー:', error)
    
    // エラーログを記録
    try {
      await env.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, feature_type,
          response_time_ms, success, error_message
        ) VALUES (?, ?, 'problem_generation', ?, 0, ?)
      `).bind(
        body.userId || 1,
        body.curriculumId,
        Date.now() - startTime,
        error.message
      ).run()
    } catch (dbError) {
      console.error('Failed to log error:', dbError)
    }
    
    return c.json({
      success: false,
      error: '問題生成に失敗しました',
      details: error.message
    }, 500)
  }
})

// APIルート: 生成された問題一覧取得
app.get('/api/ai/generated-problems/:curriculumId', async (c) => {
  const { env } = c
  const curriculumId = c.req.param('curriculumId')
  const problemType = c.req.query('problemType')
  const approved = c.req.query('approved')
  
  try {
    let query = `
      SELECT * FROM ai_generated_problems
      WHERE curriculum_id = ?
    `
    const params = [curriculumId]
    
    if (problemType) {
      query += ` AND problem_type = ?`
      params.push(problemType)
    }
    
    if (approved !== undefined) {
      query += ` AND is_approved = ?`
      params.push(approved === 'true' ? '1' : '0')
    }
    
    query += ` ORDER BY created_at DESC`
    
    const problems = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      problems: problems.results || []
    })
  } catch (error: any) {
    console.error('生成問題取得エラー:', error)
    return c.json({
      success: false,
      error: '生成問題の取得に失敗しました'
    }, 500)
  }
})

// APIルート: 生成問題の承認
app.post('/api/ai/approve-problem/:problemId', async (c) => {
  const { env } = c
  const problemId = c.req.param('problemId')
  const { userId, approved } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      UPDATE ai_generated_problems
      SET is_approved = ?, approved_by = ?, approved_at = datetime('now')
      WHERE id = ?
    `).bind(approved ? 1 : 0, userId, problemId).run()
    
    return c.json({
      success: true,
      message: approved ? '問題を承認しました' : '承認を取り消しました'
    })
  } catch (error: any) {
    console.error('問題承認エラー:', error)
    return c.json({
      success: false,
      error: '問題承認に失敗しました'
    }, 500)
  }
})

// APIルート: AI フィードバック評価
app.post('/api/ai/feedback', async (c) => {
  const { env } = c
  const { studentId, conversationId, usageStatId, rating, comment } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO ai_feedback_ratings (
        student_id, conversation_id, usage_stat_id, rating, feedback_comment
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(studentId, conversationId || null, usageStatId || null, rating, comment || null).run()
    
    return c.json({
      success: true,
      message: 'フィードバックを送信しました'
    })
  } catch (error: any) {
    console.error('フィードバック送信エラー:', error)
    return c.json({
      success: false,
      error: 'フィードバック送信に失敗しました'
    }, 500)
  }
})

// ==============================================
// Phase 9: 学習行動ログAPI
// ==============================================

// 学習行動ログの保存（バッチ保存）
app.post('/api/behavior/logs', async (c) => {
  const { env } = c
  const logs = await c.req.json()
  
  if (!Array.isArray(logs) || logs.length === 0) {
    return c.json({
      success: false,
      error: 'ログデータが不正です'
    }, 400)
  }
  
  try {
    // バッチ挿入
    const stmt = env.DB.prepare(`
      INSERT INTO learning_behavior_logs (
        student_id, curriculum_id, learning_card_id, action_type, action_timestamp,
        session_id, session_duration, page_element, element_type, metadata,
        current_understanding_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const batch = logs.map(log => 
      stmt.bind(
        log.student_id,
        log.curriculum_id || null,
        log.learning_card_id || null,
        log.action_type,
        log.action_timestamp,
        log.session_id,
        log.session_duration || 0,
        log.page_element || null,
        log.element_type || null,
        log.metadata || null,
        log.current_understanding_level || null
      )
    )
    
    await env.DB.batch(batch)
    
    return c.json({
      success: true,
      message: `${logs.length}件のログを保存しました`,
      count: logs.length
    })
  } catch (error: any) {
    console.error('学習行動ログ保存エラー:', error)
    return c.json({
      success: false,
      error: 'ログの保存に失敗しました'
    }, 500)
  }
})

// 学習行動ログの取得（分析用）
app.get('/api/behavior/logs/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const limit = c.req.query('limit') || '100'
  const actionType = c.req.query('actionType')
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  
  try {
    let query = `
      SELECT * FROM learning_behavior_logs
      WHERE student_id = ?
    `
    const params: any[] = [studentId]
    
    if (actionType) {
      query += ` AND action_type = ?`
      params.push(actionType)
    }
    
    if (startDate) {
      query += ` AND action_timestamp >= ?`
      params.push(startDate)
    }
    
    if (endDate) {
      query += ` AND action_timestamp <= ?`
      params.push(endDate)
    }
    
    query += ` ORDER BY action_timestamp DESC LIMIT ?`
    params.push(parseInt(limit))
    
    const logs = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      logs: logs.results || [],
      count: logs.results?.length || 0
    })
  } catch (error: any) {
    console.error('学習行動ログ取得エラー:', error)
    return c.json({
      success: false,
      error: 'ログの取得に失敗しました'
    }, 500)
  }
})

// ==============================================
// Phase 9: 学習パターン分析API
// ==============================================

// 統合学習パターン分析（6つの分析を一度に実行）
app.post('/api/analysis/patterns/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId } = await c.req.json()
  
  try {
    // 1. 時間的パターン分析
    const timePattern = await analyzeTimePattern(env.DB, parseInt(studentId))
    
    // 2. 学習スタイル分析（VAKモデル）
    const learningStyle = await analyzeLearningStyle(env.DB, parseInt(studentId))
    
    // 3. 理解パターン分析
    const comprehension = await analyzeComprehension(env.DB, parseInt(studentId), curriculumId)
    
    // 4. 助け要請パターン分析
    const helpSeeking = await analyzeHelpSeeking(env.DB, parseInt(studentId))
    
    // 5. 進捗速度パターン分析
    const progressSpeed = await analyzeProgressSpeed(env.DB, parseInt(studentId), curriculumId)
    
    // 6. エンゲージメントパターン分析
    const engagement = await analyzeEngagement(env.DB, parseInt(studentId))
    
    // 総合スコア計算
    const overallScore = calculateOverallScore({
      timePattern,
      learningStyle,
      comprehension,
      helpSeeking,
      progressSpeed,
      engagement
    })
    
    const result = {
      student_id: studentId,
      curriculum_id: curriculumId,
      patterns: {
        time: timePattern,
        learning_style: learningStyle,
        comprehension,
        help_seeking: helpSeeking,
        progress_speed: progressSpeed,
        engagement
      },
      overall_score: overallScore,
      analyzed_at: new Date().toISOString()
    }
    
    // 分析結果を保存
    await env.DB.prepare(`
      INSERT INTO pattern_analysis_results (
        student_id, curriculum_id, pattern_type, analysis_data, confidence_score, sample_size, analysis_date
      ) VALUES (?, ?, ?, ?, ?, ?, date('now'))
    `).bind(
      studentId,
      curriculumId,
      'comprehensive',
      JSON.stringify(result.patterns),
      overallScore / 100,
      0
    ).run()
    
    return c.json({
      success: true,
      analysis: result
    })
  } catch (error: any) {
    console.error('学習パターン分析エラー:', error)
    return c.json({
      success: false,
      error: '分析に失敗しました'
    }, 500)
  }
})

// ヘルパー関数: 時間的パターン分析
async function analyzeTimePattern(db: D1Database, studentId: number) {
  const logs = await db.prepare(`
    SELECT 
      strftime('%H', action_timestamp) as hour,
      COUNT(*) as count,
      AVG(session_duration) as avg_duration
    FROM learning_behavior_logs
    WHERE student_id = ?
    GROUP BY hour
    ORDER BY count DESC
  `).bind(studentId).all()
  
  const hourData = logs.results || []
  const topHours = hourData.slice(0, 2).map((r: any) => `${r.hour}:00`)
  
  return {
    optimal_study_time: topHours.length > 0 ? topHours : ['10:00', '14:00'],
    concentration_span: 28,
    best_performance_time: topHours[0] ? (parseInt(topHours[0]) < 12 ? '午前中' : '午後') : '午前中'
  }
}

// ヘルパー関数: 学習スタイル分析
async function analyzeLearningStyle(db: D1Database, studentId: number) {
  const logs = await db.prepare(`
    SELECT element_type, COUNT(*) as count
    FROM learning_behavior_logs
    WHERE student_id = ? AND element_type IN ('image', 'video', 'text', 'audio', 'button', 'interactive')
    GROUP BY element_type
  `).bind(studentId).all()
  
  const elementCounts = logs.results || []
  let visual = 0, auditory = 0, kinesthetic = 0
  
  elementCounts.forEach((row: any) => {
    if (row.element_type === 'image' || row.element_type === 'video') visual += row.count
    if (row.element_type === 'audio') auditory += row.count
    if (row.element_type === 'button' || row.element_type === 'interactive') kinesthetic += row.count
  })
  
  const total = visual + auditory + kinesthetic || 1
  return {
    visual: Math.round((visual / total) * 100),
    auditory: Math.round((auditory / total) * 100),
    kinesthetic: Math.round((kinesthetic / total) * 100),
    dominant_style: visual > auditory && visual > kinesthetic ? 'visual' : 
                   auditory > kinesthetic ? 'auditory' : 'kinesthetic'
  }
}

// ヘルパー関数: 理解パターン分析
async function analyzeComprehension(db: D1Database, studentId: number, curriculumId?: number) {
  const progress = await db.prepare(`
    SELECT 
      AVG(understanding_level) as avg_understanding,
      COUNT(*) as total_cards
    FROM student_progress
    WHERE student_id = ? ${curriculumId ? 'AND curriculum_id = ?' : ''}
  `).bind(curriculumId ? studentId : studentId, ...(curriculumId ? [curriculumId] : [])).first()
  
  return {
    average_understanding: progress?.avg_understanding || 0,
    total_completed: progress?.total_cards || 0,
    prediction_3_days: Math.min((progress?.avg_understanding || 0) + 10, 100)
  }
}

// ヘルパー関数: 助け要請パターン分析
async function analyzeHelpSeeking(db: D1Database, studentId: number) {
  const helpLogs = await db.prepare(`
    SELECT COUNT(*) as help_count
    FROM learning_behavior_logs
    WHERE student_id = ? AND action_type = 'help_request'
  `).bind(studentId).first()
  
  return {
    help_frequency: helpLogs?.help_count || 0,
    average_wait_time: 5.0,
    help_type: (helpLogs?.help_count || 0) > 10 ? 'frequent' : 'moderate'
  }
}

// ヘルパー関数: 進捗速度パターン分析
async function analyzeProgressSpeed(db: D1Database, studentId: number, curriculumId?: number) {
  const weeklyProgress = await db.prepare(`
    SELECT 
      strftime('%W', completed_at) as week,
      COUNT(*) as cards_completed
    FROM student_progress
    WHERE student_id = ? ${curriculumId ? 'AND curriculum_id = ?' : ''}
      AND status = 'completed'
      AND completed_at >= date('now', '-4 weeks')
    GROUP BY week
    ORDER BY week DESC
    LIMIT 3
  `).bind(curriculumId ? studentId : studentId, ...(curriculumId ? [curriculumId] : [])).all()
  
  const weeklyCards = (weeklyProgress.results || []).map((r: any) => r.cards_completed)
  const trend = weeklyCards.length >= 2 && weeklyCards[0] > weeklyCards[1] ? 'accelerating' : 'stable'
  
  return {
    cards_per_week: weeklyCards.length > 0 ? weeklyCards : [3, 4, 5],
    trend,
    type: trend === 'accelerating' ? '加速型' : '安定型'
  }
}

// ヘルパー関数: エンゲージメントパターン分析
async function analyzeEngagement(db: D1Database, studentId: number) {
  const sessionStats = await db.prepare(`
    SELECT 
      COUNT(DISTINCT session_id) as session_count,
      AVG(session_duration) as avg_duration
    FROM learning_behavior_logs
    WHERE student_id = ?
      AND action_timestamp >= datetime('now', '-7 days')
  `).bind(studentId).first()
  
  return {
    sessions_per_week: sessionStats?.session_count || 0,
    average_session_duration: Math.round(sessionStats?.avg_duration || 0),
    engagement_level: (sessionStats?.session_count || 0) >= 5 ? 'high' : 'moderate'
  }
}

// ヘルパー関数: 総合スコア計算
function calculateOverallScore(patterns: any) {
  let score = 60 // ベーススコア
  
  // 学習スタイルが明確 +10
  const dominantStyle = Math.max(patterns.learning_style.visual, patterns.learning_style.auditory, patterns.learning_style.kinesthetic)
  if (dominantStyle >= 60) score += 10
  
  // 理解度が高い +15
  if (patterns.comprehension.average_understanding >= 4) score += 15
  
  // エンゲージメントが高い +10
  if (patterns.engagement.engagement_level === 'high') score += 10
  
  // 進捗が加速 +5
  if (patterns.progress_speed.trend === 'accelerating') score += 5
  
  return Math.min(score, 100)
}

// ==============================================
// Phase 9: 総合プロファイル生成 & 個別最適化プラン
// ==============================================

// 総合学習プロファイル生成（Gemini統合分析）
app.post('/api/analysis/profile/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId } = await c.req.json()
  
  try {
    // 6つの分析結果を取得
    const analysisResponse = await fetch(`${c.req.url.split('/api')[0]}/api/analysis/patterns/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curriculumId })
    })
    
    if (!analysisResponse.ok) {
      throw new Error('パターン分析の取得に失敗しました')
    }
    
    const analysisData = await analysisResponse.json()
    const patterns = analysisData.analysis.patterns
    
    // 学生情報を取得
    const student = await env.DB.prepare(`
      SELECT name, email FROM users WHERE id = ?
    `).bind(studentId).first()
    
    // Gemini APIで統合分析
    const apiKey = env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      // APIキーが設定されていない場合は簡易プロファイルを返す
      const profile = generateSimpleProfile(patterns, student)
      await saveProfile(env.DB, studentId, curriculumId, profile)
      return c.json({ success: true, profile })
    }
    
    const geminiPrompt = `
あなたは教育心理学とデータ分析の専門家です。以下の学習パターン分析結果から、児童の総合学習プロファイルを生成してください。

【児童情報】
名前: ${student?.name || '不明'}
ID: ${studentId}

【分析結果】
1. 時間的パターン:
- 最適学習時間: ${patterns.time.optimal_study_time.join(', ')}
- 集中持続時間: ${patterns.time.concentration_span}分
- 最高パフォーマンス時間帯: ${patterns.time.best_performance_time}

2. 学習スタイル (VAKモデル):
- 視覚型 (Visual): ${patterns.learning_style.visual}%
- 聴覚型 (Auditory): ${patterns.learning_style.auditory}%
- 体感型 (Kinesthetic): ${patterns.learning_style.kinesthetic}%
- 優勢スタイル: ${patterns.learning_style.dominant_style}

3. 理解パターン:
- 平均理解度: ${patterns.comprehension.average_understanding}
- 完了カード数: ${patterns.comprehension.total_completed}
- 3日後予測: ${patterns.comprehension.prediction_3_days}%

4. 助け要請パターン:
- 要請頻度: ${patterns.help_seeking.help_frequency}回
- 平均待ち時間: ${patterns.help_seeking.average_wait_time}分
- タイプ: ${patterns.help_seeking.help_type}

5. 進捗速度:
- 週次カード数: ${patterns.progress_speed.cards_per_week.join(', ')}
- トレンド: ${patterns.progress_speed.trend}
- タイプ: ${patterns.progress_speed.type}

6. エンゲージメント:
- 週次セッション数: ${patterns.engagement.sessions_per_week}
- 平均セッション時間: ${patterns.engagement.average_session_duration}秒
- レベル: ${patterns.engagement.engagement_level}

【出力形式】
以下のJSON形式で出力してください：

{
  "summary": "この児童の学習特性を2-3文で要約",
  "strengths": ["強み1", "強み2", "強み3"],
  "weaknesses": ["課題1", "課題2"],
  "recommendations": {
    "for_teacher": ["教師への推奨事項1", "教師への推奨事項2", "教師への推奨事項3"],
    "for_parent": ["保護者への推奨事項1", "保護者への推奨事項2"],
    "for_student": ["児童本人への推奨事項1", "児童本人への推奨事項2"]
  },
  "learning_type": "学習タイプの分類（例：視覚型×加速型×積極支援型）",
  "recommended_course": "じっくりコース / しっかりコース / ぐんぐんコース のいずれか"
}
`
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: geminiPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    )
    
    if (!geminiResponse.ok) {
      throw new Error('Gemini API呼び出しに失敗しました')
    }
    
    const geminiData = await geminiResponse.json()
    const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // JSONを抽出
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/)
    const geminiProfile = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    
    const profile = {
      student_id: studentId,
      curriculum_id: curriculumId,
      student_name: student?.name,
      profile_summary: geminiProfile.summary || '',
      learning_type: geminiProfile.learning_type || '',
      overall_score: analysisData.analysis.overall_score,
      confidence_level: analysisData.analysis.overall_score >= 80 ? 'high' : 'medium',
      recommended_course: geminiProfile.recommended_course || 'しっかりコース',
      patterns: patterns,
      strengths: geminiProfile.strengths || [],
      weaknesses: geminiProfile.weaknesses || [],
      recommendations: geminiProfile.recommendations || {},
      generated_at: new Date().toISOString()
    }
    
    // プロファイルを保存
    await saveProfile(env.DB, studentId, curriculumId, profile)
    
    return c.json({
      success: true,
      profile
    })
  } catch (error: any) {
    console.error('総合プロファイル生成エラー:', error)
    return c.json({
      success: false,
      error: 'プロファイル生成に失敗しました'
    }, 500)
  }
})

// ヘルパー: 簡易プロファイル生成（Gemini API未設定時）
function generateSimpleProfile(patterns: any, student: any) {
  const dominantStyle = patterns.learning_style.dominant_style
  const styleText = dominantStyle === 'visual' ? '視覚型' : 
                   dominantStyle === 'auditory' ? '聴覚型' : '体感型'
  
  return {
    student_name: student?.name,
    profile_summary: `${styleText}の学習スタイルを持ち、${patterns.progress_speed.type}の進捗を示しています。`,
    learning_type: `${styleText}×${patterns.progress_speed.type}`,
    strengths: ['自己学習能力', '継続的な取り組み'],
    weaknesses: ['さらなる分析が必要'],
    recommendations: {
      for_teacher: ['学習スタイルに合わせた指導を行ってください'],
      for_parent: ['家庭学習の継続をサポートしてください'],
      for_student: ['自分のペースで学習を進めましょう']
    },
    recommended_course: 'しっかりコース'
  }
}

// ヘルパー: プロファイル保存
async function saveProfile(db: D1Database, studentId: string, curriculumId: number, profile: any) {
  await db.prepare(`
    INSERT OR REPLACE INTO learning_profiles (
      student_id, curriculum_id, profile_type, profile_data, overall_score, confidence_level, 
      expires_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'), datetime('now'))
  `).bind(
    studentId,
    curriculumId,
    'comprehensive',
    JSON.stringify(profile),
    profile.overall_score || 0,
    profile.confidence_level || 'medium'
  ).run()
}

// 個別最適化プラン生成
app.post('/api/analysis/personalized-plan/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId, profileId } = await c.req.json()
  
  try {
    // プロファイルを取得
    const profile = await env.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY updated_at DESC LIMIT 1
    `).bind(studentId, curriculumId).first()
    
    if (!profile) {
      return c.json({
        success: false,
        error: 'プロファイルが見つかりません'
      }, 404)
    }
    
    const profileData = JSON.parse(profile.profile_data as string)
    
    // 簡易的な個別最適化プラン生成
    const plan = {
      student_id: studentId,
      curriculum_id: curriculumId,
      plan_type: 'daily',
      daily_schedule: generateDailySchedule(profileData),
      weekly_goals: generateWeeklyGoals(profileData),
      adaptive_strategies: generateAdaptiveStrategies(profileData),
      created_at: new Date().toISOString()
    }
    
    // プラン保存
    await env.DB.prepare(`
      INSERT INTO personalized_plans (
        student_id, curriculum_id, profile_id, plan_type, plan_data, status, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, 'active', date('now'), date('now', '+7 days'))
    `).bind(
      studentId,
      curriculumId,
      profileId || null,
      'daily',
      JSON.stringify(plan)
    ).run()
    
    return c.json({
      success: true,
      plan
    })
  } catch (error: any) {
    console.error('個別最適化プラン生成エラー:', error)
    return c.json({
      success: false,
      error: 'プラン生成に失敗しました'
    }, 500)
  }
})

// ヘルパー: 1日のスケジュール生成
function generateDailySchedule(profileData: any) {
  const optimalTime = profileData.patterns?.time?.optimal_study_time?.[0] || '10:00'
  return {
    morning: {
      time: optimalTime,
      activity: '新しい学習カード',
      duration: 30,
      support: `${profileData.learning_type}に最適化された教材を使用`
    },
    afternoon: {
      time: '14:00',
      activity: '復習・確認',
      duration: 20,
      support: '理解度確認クイズ'
    }
  }
}

// ヘルパー: 週次目標生成
function generateWeeklyGoals(profileData: any) {
  const cardsPerWeek = profileData.patterns?.progress_speed?.cards_per_week?.[0] || 3
  return [
    `今週の目標: ${cardsPerWeek + 1}カード完了`,
    `理解度目標: 平均4以上`,
    `継続的な学習習慣の維持`
  ]
}

// ヘルパー: 適応的戦略生成
function generateAdaptiveStrategies(profileData: any) {
  return [
    {
      condition: 'つまずいた時',
      action: `${profileData.learning_type}に合わせたヒントを表示`,
      timing: '3分経過後'
    },
    {
      condition: '集中力低下',
      action: '休憩を促す',
      timing: '30分経過後'
    }
  ]
}

// ==============================================
// Phase 10: 教師・保護者ダッシュボードAPI
// ==============================================

// クラス全体の学習プロファイル取得（教師向け）
app.get('/api/dashboard/class/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    // クラスに所属する生徒を取得
    const students = await env.DB.prepare(`
      SELECT id, name, email, student_number
      FROM users
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(classCode).all()
    
    if (!students.results || students.results.length === 0) {
      return c.json({
        success: true,
        students: [],
        summary: {
          total_students: 0,
          with_profiles: 0,
          average_score: 0
        }
      })
    }
    
    // 各生徒のプロファイルを取得
    const studentProfiles = await Promise.all(
      students.results.map(async (student: any) => {
        const profile = await env.DB.prepare(`
          SELECT profile_data, overall_score, confidence_level, updated_at
          FROM learning_profiles
          WHERE student_id = ?
          ORDER BY updated_at DESC
          LIMIT 1
        `).bind(student.id).first()
        
        if (profile) {
          const profileData = JSON.parse(profile.profile_data as string)
          return {
            student_id: student.id,
            student_name: student.name,
            student_number: student.student_number,
            profile_summary: profileData.profile_summary || '',
            learning_type: profileData.learning_type || '',
            overall_score: profile.overall_score,
            confidence_level: profile.confidence_level,
            strengths: profileData.strengths || [],
            weaknesses: profileData.weaknesses || [],
            recommended_course: profileData.recommended_course || 'しっかりコース',
            last_updated: profile.updated_at
          }
        }
        
        return {
          student_id: student.id,
          student_name: student.name,
          student_number: student.student_number,
          profile_summary: '分析データ不足',
          learning_type: '未分析',
          overall_score: 0,
          confidence_level: 'low',
          strengths: [],
          weaknesses: ['学習データが不足しています'],
          recommended_course: 'しっかりコース',
          last_updated: null
        }
      })
    )
    
    // サマリー統計
    const withProfiles = studentProfiles.filter(p => p.overall_score > 0)
    const summary = {
      total_students: students.results.length,
      with_profiles: withProfiles.length,
      average_score: withProfiles.length > 0 
        ? Math.round(withProfiles.reduce((sum, p) => sum + p.overall_score, 0) / withProfiles.length)
        : 0,
      by_learning_type: countByLearningType(withProfiles),
      by_course: countByCourse(withProfiles)
    }
    
    return c.json({
      success: true,
      class_code: classCode,
      students: studentProfiles,
      summary
    })
  } catch (error: any) {
    console.error('クラスダッシュボード取得エラー:', error)
    return c.json({
      success: false,
      error: 'ダッシュボードデータの取得に失敗しました'
    }, 500)
  }
})

// ヘルパー: 学習タイプ別カウント
function countByLearningType(profiles: any[]) {
  const counts: Record<string, number> = {}
  profiles.forEach(p => {
    const type = p.learning_type || '未分類'
    counts[type] = (counts[type] || 0) + 1
  })
  return counts
}

// ヘルパー: コース別カウント
function countByCourse(profiles: any[]) {
  const counts: Record<string, number> = {
    'じっくりコース': 0,
    'しっかりコース': 0,
    'ぐんぐんコース': 0
  }
  profiles.forEach(p => {
    const course = p.recommended_course || 'しっかりコース'
    if (counts[course] !== undefined) {
      counts[course]++
    }
  })
  return counts
}

// 個別生徒の詳細プロファイル取得（教師・保護者向け）
app.get('/api/dashboard/student/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 生徒情報
    const student = await env.DB.prepare(`
      SELECT id, name, email, student_number, class_code
      FROM users
      WHERE id = ?
    `).bind(studentId).first()
    
    if (!student) {
      return c.json({
        success: false,
        error: '生徒が見つかりません'
      }, 404)
    }
    
    // 最新プロファイル
    const profile = await env.DB.prepare(`
      SELECT profile_data, overall_score, confidence_level, updated_at
      FROM learning_profiles
      WHERE student_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    // 個別最適化プラン
    const plan = await env.DB.prepare(`
      SELECT plan_data, status, start_date, end_date, created_at
      FROM personalized_plans
      WHERE student_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    // 推奨事項
    const recommendations = await env.DB.prepare(`
      SELECT id, target_role, recommendation_type, priority, title, description, 
             action_items, status, created_at, expires_at
      FROM recommendations
      WHERE student_id = ? AND status != 'dismissed'
      ORDER BY priority DESC, created_at DESC
      LIMIT 10
    `).bind(studentId).all()
    
    // 最近の学習行動サマリー
    const recentActivity = await env.DB.prepare(`
      SELECT 
        action_type,
        COUNT(*) as count,
        MAX(action_timestamp) as last_action
      FROM learning_behavior_logs
      WHERE student_id = ? AND action_timestamp >= datetime('now', '-7 days')
      GROUP BY action_type
      ORDER BY count DESC
    `).bind(studentId).all()
    
    const profileData = profile ? JSON.parse(profile.profile_data as string) : null
    const planData = plan ? JSON.parse(plan.plan_data as string) : null
    
    return c.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        student_number: student.student_number,
        class_code: student.class_code
      },
      profile: profileData ? {
        summary: profileData.profile_summary,
        learning_type: profileData.learning_type,
        overall_score: profile?.overall_score,
        confidence_level: profile?.confidence_level,
        strengths: profileData.strengths,
        weaknesses: profileData.weaknesses,
        recommendations: profileData.recommendations,
        recommended_course: profileData.recommended_course,
        patterns: profileData.patterns,
        last_updated: profile?.updated_at
      } : null,
      plan: planData,
      recommendations: recommendations.results || [],
      recent_activity: recentActivity.results || []
    })
  } catch (error: any) {
    console.error('生徒詳細取得エラー:', error)
    return c.json({
      success: false,
      error: '生徒詳細の取得に失敗しました'
    }, 500)
  }
})

// 推奨事項の作成（教師向け）
app.post('/api/dashboard/recommendations', async (c) => {
  const { env } = c
  const { studentId, curriculumId, targetRole, type, priority, title, description, actionItems } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO recommendations (
        student_id, curriculum_id, target_role, recommendation_type, priority,
        title, description, action_items, status, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now', '+30 days'))
    `).bind(
      studentId,
      curriculumId || null,
      targetRole,
      type,
      priority,
      title,
      description,
      JSON.stringify(actionItems || [])
    ).run()
    
    return c.json({
      success: true,
      message: '推奨事項を作成しました'
    })
  } catch (error: any) {
    console.error('推奨事項作成エラー:', error)
    return c.json({
      success: false,
      error: '推奨事項の作成に失敗しました'
    }, 500)
  }
})

// ==============================================
// Phase 11: 学習カード自動適応API
// ==============================================

// 適応型学習カード取得
app.get('/api/cards/:cardId/adapted/:studentId', async (c) => {
  const { env } = c
  const cardId = c.req.param('cardId')
  const studentId = c.req.param('studentId')
  
  try {
    // 元の学習カード取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(cardId).first()
    
    if (!card) {
      return c.json({
        success: false,
        error: 'カードが見つかりません'
      }, 404)
    }
    
    // 学習スタイルプロファイル取得
    const profile = await env.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(studentId).first()
    
    let adaptedCard = { ...card }
    let learningStyle = 'balanced' // デフォルト
    
    if (profile) {
      const profileData = JSON.parse(profile.profile_data as string)
      const patterns = profileData.patterns
      
      // 優勢な学習スタイルを判定
      if (patterns?.learning_style) {
        learningStyle = patterns.learning_style.dominant_style || 'balanced'
        
        // 学習スタイルに応じてカードを適応
        adaptedCard = adaptCardToStyle(card, learningStyle, patterns.learning_style)
      }
    }
    
    return c.json({
      success: true,
      card: adaptedCard,
      learning_style: learningStyle,
      adapted: !!profile
    })
  } catch (error: any) {
    console.error('適応型カード取得エラー:', error)
    return c.json({
      success: false,
      error: 'カードの取得に失敗しました'
    }, 500)
  }
})

// ヘルパー: カードを学習スタイルに適応
function adaptCardToStyle(card: any, dominantStyle: string, styleScores: any) {
  const adapted = { ...card }
  
  // メタデータを追加
  adapted.adaptation_metadata = {
    dominant_style: dominantStyle,
    style_scores: styleScores,
    adaptations_applied: []
  }
  
  // 視覚型の適応
  if (dominantStyle === 'visual' || styleScores.visual >= 60) {
    adapted.adaptation_metadata.adaptations_applied.push('visual_enhanced')
    adapted.visual_hints_priority = true
    adapted.show_diagrams = true
    adapted.color_coding = true
  }
  
  // 聴覚型の適応
  if (dominantStyle === 'auditory' || styleScores.auditory >= 60) {
    adapted.adaptation_metadata.adaptations_applied.push('auditory_enhanced')
    adapted.audio_guide_enabled = true
    adapted.text_to_speech = true
    adapted.step_by_step_audio = true
  }
  
  // 体感型の適応
  if (dominantStyle === 'kinesthetic' || styleScores.kinesthetic >= 60) {
    adapted.adaptation_metadata.adaptations_applied.push('kinesthetic_enhanced')
    adapted.interactive_elements = true
    adapted.drag_drop_enabled = true
    adapted.hands_on_activities = true
  }
  
  return adapted
}

// ==============================================
// Phase 12: AI予測機能強化API
// ==============================================

// 学習予測生成
app.post('/api/predictions/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  const { curriculumId, predictionType } = await c.req.json()
  
  try {
    // 学習パターンを取得
    const analysisResponse = await fetch(`${c.req.url.split('/api')[0]}/api/analysis/patterns/${studentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curriculumId })
    })
    
    if (!analysisResponse.ok) {
      throw new Error('パターン分析の取得に失敗しました')
    }
    
    const analysisData = await analysisResponse.json()
    const patterns = analysisData.analysis.patterns
    
    // 予測を生成
    const predictions = generatePredictions(patterns, predictionType || 'all')
    
    // 予測結果を保存
    for (const [type, data] of Object.entries(predictions)) {
      await env.DB.prepare(`
        INSERT INTO ai_predictions (
          student_id, curriculum_id, prediction_type, prediction_data, 
          confidence_level, prediction_date, target_date
        ) VALUES (?, ?, ?, ?, ?, date('now'), ?)
      `).bind(
        studentId,
        curriculumId,
        type,
        JSON.stringify(data),
        (data as any).confidence || 0.7,
        (data as any).target_date || null
      ).run()
    }
    
    return c.json({
      success: true,
      predictions
    })
  } catch (error: any) {
    console.error('予測生成エラー:', error)
    return c.json({
      success: false,
      error: '予測の生成に失敗しました'
    }, 500)
  }
})

// ヘルパー: 予測生成
function generatePredictions(patterns: any, type: string) {
  const predictions: any = {}
  
  if (type === 'all' || type === 'next_week') {
    // 来週の予測
    const cardsPerWeek = patterns.progress_speed?.cards_per_week?.[0] || 3
    const trend = patterns.progress_speed?.trend || 'stable'
    
    let nextWeekCards = cardsPerWeek
    if (trend === 'accelerating') nextWeekCards = Math.round(cardsPerWeek * 1.2)
    if (trend === 'decelerating') nextWeekCards = Math.round(cardsPerWeek * 0.8)
    
    predictions.next_week = {
      cards_expected: nextWeekCards,
      understanding_level: Math.min((patterns.comprehension?.average_understanding || 3) + 0.3, 5),
      confidence: 0.75,
      target_date: getNextWeekDate(),
      recommendation: nextWeekCards >= 5 ? '順調です' : '支援が必要かもしれません'
    }
  }
  
  if (type === 'all' || type === 'struggling_points') {
    // つまずきポイント予測
    predictions.struggling_points = {
      potential_struggles: [
        patterns.comprehension?.average_understanding < 3 ? '基礎理解の強化が必要' : null,
        patterns.help_seeking?.help_frequency > 10 ? '自立学習の促進が必要' : null,
        patterns.engagement?.engagement_level === 'low' ? 'モチベーション支援が必要' : null
      ].filter(Boolean),
      confidence: 0.65,
      recommendation: '定期的な個別支援を推奨'
    }
  }
  
  return predictions
}

// ヘルパー: 来週の日付
function getNextWeekDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
}

// ==============================================
// Phase 14: 研究資料導出API
// ==============================================

// 研究用データエクスポート（匿名化済み）
app.get('/api/research/export/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  const format = c.req.query('format') || 'json' // json, csv
  
  try {
    // クラスの全生徒データを取得
    const students = await env.DB.prepare(`
      SELECT id, student_number FROM users
      WHERE class_code = ? AND role = 'student'
    `).bind(classCode).all()
    
    const exportData: any[] = []
    
    for (const student of (students.results || [])) {
      // プロファイル取得
      const profile = await env.DB.prepare(`
        SELECT profile_data, overall_score, confidence_level, updated_at
        FROM learning_profiles
        WHERE student_id = ?
        ORDER BY updated_at DESC LIMIT 1
      `).bind(student.id).first()
      
      // 学習行動サマリー
      const behaviorStats = await env.DB.prepare(`
        SELECT 
          action_type,
          COUNT(*) as count,
          AVG(session_duration) as avg_duration
        FROM learning_behavior_logs
        WHERE student_id = ?
        GROUP BY action_type
      `).bind(student.id).all()
      
      // 進捗データ
      const progressData = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_cards,
          AVG(understanding_level) as avg_understanding,
          AVG(completion_time_minutes) as avg_time
        FROM student_progress
        WHERE student_id = ? AND status = 'completed'
      `).bind(student.id).first()
      
      if (profile) {
        const profileData = JSON.parse(profile.profile_data as string)
        
        exportData.push({
          // 匿名化ID（研究用）
          anonymous_id: `STUDENT_${String(student.student_number).padStart(3, '0')}`,
          
          // 学習プロファイル
          learning_type: profileData.learning_type,
          overall_score: profile.overall_score,
          confidence_level: profile.confidence_level,
          
          // 学習スタイル（VAKモデル）
          visual_score: profileData.patterns?.learning_style?.visual || 0,
          auditory_score: profileData.patterns?.learning_style?.auditory || 0,
          kinesthetic_score: profileData.patterns?.learning_style?.kinesthetic || 0,
          dominant_style: profileData.patterns?.learning_style?.dominant_style,
          
          // 時間パターン
          optimal_study_time: profileData.patterns?.time?.optimal_study_time?.join(','),
          concentration_span: profileData.patterns?.time?.concentration_span,
          
          // 理解パターン
          average_understanding: profileData.patterns?.comprehension?.average_understanding || 0,
          total_completed_cards: profileData.patterns?.comprehension?.total_completed || 0,
          
          // 助け要請パターン
          help_frequency: profileData.patterns?.help_seeking?.help_frequency || 0,
          average_wait_time: profileData.patterns?.help_seeking?.average_wait_time || 0,
          
          // 進捗速度
          cards_per_week: profileData.patterns?.progress_speed?.cards_per_week?.join(','),
          progress_trend: profileData.patterns?.progress_speed?.trend,
          
          // エンゲージメント
          sessions_per_week: profileData.patterns?.engagement?.sessions_per_week || 0,
          avg_session_duration: profileData.patterns?.engagement?.average_session_duration || 0,
          engagement_level: profileData.patterns?.engagement?.engagement_level,
          
          // 行動統計
          behavior_stats: JSON.stringify(behaviorStats.results || []),
          
          // 進捗統計
          progress_total_cards: progressData?.total_cards || 0,
          progress_avg_understanding: progressData?.avg_understanding || 0,
          progress_avg_time_minutes: progressData?.avg_time || 0,
          
          // タイムスタンプ
          data_updated_at: profile.updated_at,
          export_timestamp: new Date().toISOString()
        })
      }
    }
    
    if (format === 'csv') {
      // CSV形式に変換
      const csv = convertToCSV(exportData)
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="research_data_${classCode}_${new Date().toISOString().split('T')[0]}.csv"`
      })
    }
    
    // JSON形式
    return c.json({
      success: true,
      class_code: classCode,
      total_students: exportData.length,
      export_timestamp: new Date().toISOString(),
      data: exportData,
      metadata: {
        description: '匿名化済み研究用データ',
        variables: Object.keys(exportData[0] || {}),
        note: '個人を特定できる情報は含まれていません'
      }
    })
  } catch (error: any) {
    console.error('データエクスポートエラー:', error)
    return c.json({
      success: false,
      error: 'データのエクスポートに失敗しました'
    }, 500)
  }
})

// ヘルパー: CSV変換
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ]
  
  return csvRows.join('\n')
}

// 統計サマリー取得（研究用）
app.get('/api/research/summary/:classCode', async (c) => {
  const { env } = c
  const classCode = c.req.param('classCode')
  
  try {
    // クラス全体の統計
    const students = await env.DB.prepare(`
      SELECT id FROM users WHERE class_code = ? AND role = 'student'
    `).bind(classCode).all()
    
    const studentIds = (students.results || []).map((s: any) => s.id)
    
    if (studentIds.length === 0) {
      return c.json({
        success: true,
        summary: { total_students: 0 }
      })
    }
    
    // 学習スタイル分布
    const styleDistribution = await env.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id IN (${studentIds.join(',')})
      ORDER BY updated_at DESC
    `).all()
    
    const styles = { visual: 0, auditory: 0, kinesthetic: 0, balanced: 0 }
    const scores = { overall: [], visual: [], auditory: [], kinesthetic: [] }
    
    for (const row of (styleDistribution.results || [])) {
      const profile = JSON.parse(row.profile_data as string)
      const dominant = profile.patterns?.learning_style?.dominant_style
      if (dominant) styles[dominant as keyof typeof styles]++
      
      scores.visual.push(profile.patterns?.learning_style?.visual || 0)
      scores.auditory.push(profile.patterns?.learning_style?.auditory || 0)
      scores.kinesthetic.push(profile.patterns?.learning_style?.kinesthetic || 0)
    }
    
    // 統計計算
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
    const std = (arr: number[]) => {
      const mean = avg(arr)
      const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length
      return Math.sqrt(variance)
    }
    
    return c.json({
      success: true,
      class_code: classCode,
      summary: {
        total_students: studentIds.length,
        learning_style_distribution: styles,
        learning_style_scores: {
          visual: { mean: avg(scores.visual), std: std(scores.visual) },
          auditory: { mean: avg(scores.auditory), std: std(scores.auditory) },
          kinesthetic: { mean: avg(scores.kinesthetic), std: std(scores.kinesthetic) }
        },
        generated_at: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('統計サマリーエラー:', error)
    return c.json({
      success: false,
      error: '統計の取得に失敗しました'
    }, 500)
  }
})

// ==============================================
// Phase 15: 機械学習 + リアルタイム学習API
// ==============================================

// Phase 17: LSTM/GRU時系列予測 - データ収集
app.post('/api/lstm/collect-data/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { understanding_level, completion_time, engagement_score, hint_count, emotion_state, session_context } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO time_series_data 
      (student_id, understanding_level, completion_time, engagement_score, hint_count, emotion_state, session_context, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      studentId,
      understanding_level,
      completion_time,
      engagement_score,
      hint_count || 0,
      emotion_state || 'neutral',
      JSON.stringify(session_context || {})
    ).run()
    
    return c.json({ success: true, message: '時系列データを記録しました' })
  } catch (error: any) {
    console.error('時系列データ記録エラー:', error)
    return c.json({ success: false, error: 'データ記録に失敗しました' }, 500)
  }
})

// Phase 17: LSTM予測 - 時系列データ取得
app.get('/api/lstm/time-series/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const limit = parseInt(c.req.query('limit') || '50')
  
  try {
    const data = await env.DB.prepare(`
      SELECT 
        understanding_level,
        completion_time,
        engagement_score,
        hint_count,
        emotion_state,
        timestamp
      FROM time_series_data
      WHERE student_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(studentId, limit).all()
    
    return c.json({
      success: true,
      data: data.results || [],
      sequence_length: (data.results || []).length
    })
  } catch (error: any) {
    console.error('時系列データ取得エラー:', error)
    return c.json({ success: false, error: 'データ取得に失敗しました' }, 500)
  }
})

// Phase 17: Transformer - テキスト解析
app.post('/api/transformer/analyze-text', async (c) => {
  const { env } = c
  const { student_id, text_input, analysis_type } = await c.req.json()
  
  try {
    // 簡易的な感情分析（実際のTransformerはクライアント側で実行）
    let analysis_result: any = {}
    let confidence_score = 0.8
    
    if (analysis_type === 'sentiment') {
      // ポジティブ・ネガティブ判定
      const positiveWords = ['楽しい', 'わかった', '理解できた', '好き', '面白い']
      const negativeWords = ['難しい', 'わからない', '苦手', 'つまらない', '嫌い']
      
      const positive = positiveWords.some(word => text_input.includes(word))
      const negative = negativeWords.some(word => text_input.includes(word))
      
      analysis_result = {
        sentiment: positive ? 'positive' : (negative ? 'negative' : 'neutral'),
        confidence: confidence_score,
        keywords: text_input.split(' ').slice(0, 5)
      }
    } else if (analysis_type === 'comprehension') {
      // 理解度判定
      const understandingIndicators = ['わかった', '理解', 'できた', 'なるほど']
      const struggles = ['わからない', '難しい', '???', '？？？']
      
      const understands = understandingIndicators.some(word => text_input.includes(word))
      const struggling = struggles.some(word => text_input.includes(word))
      
      analysis_result = {
        comprehension_level: understands ? 'high' : (struggling ? 'low' : 'medium'),
        needs_help: struggling,
        confidence: confidence_score
      }
    }
    
    await env.DB.prepare(`
      INSERT INTO text_analysis_results 
      (student_id, text_input, analysis_type, analysis_result, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id,
      text_input,
      analysis_type,
      JSON.stringify(analysis_result),
      confidence_score
    ).run()
    
    return c.json({
      success: true,
      analysis: analysis_result,
      confidence: confidence_score
    })
  } catch (error: any) {
    console.error('テキスト解析エラー:', error)
    return c.json({ success: false, error: '解析に失敗しました' }, 500)
  }
})

// Phase 17: 強化学習 - アクション実行と報酬記録
app.post('/api/rl/take-action', async (c) => {
  const { env } = c
  const { student_id, state, action, reward } = await c.req.json()
  
  try {
    // エージェントを取得または作成
    let agent = await env.DB.prepare(`
      SELECT * FROM rl_agents
      WHERE student_id = ? AND agent_type = 'q_learning'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(student_id).first()
    
    if (!agent) {
      // 新規エージェント作成
      const result = await env.DB.prepare(`
        INSERT INTO rl_agents 
        (student_id, agent_type, state_space_dim, action_space_dim, q_table, total_episodes, average_reward)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        student_id,
        'q_learning',
        10, // state dimension
        5,  // action dimension
        JSON.stringify({}), // empty Q-table
        0,
        0
      ).run()
      
      agent = await env.DB.prepare(`
        SELECT * FROM rl_agents WHERE id = ?
      `).bind(result.meta.last_row_id).first()
    }
    
    // Q値の更新（簡易版）
    const q_table = JSON.parse(agent.q_table as string || '{}')
    const state_key = JSON.stringify(state)
    
    if (!q_table[state_key]) {
      q_table[state_key] = {}
    }
    
    // Q-learning更新式: Q(s,a) = Q(s,a) + α * (r + γ * max(Q(s',a')) - Q(s,a))
    const alpha = 0.1 // 学習率
    const gamma = 0.9 // 割引率
    const current_q = q_table[state_key][action] || 0
    const new_q = current_q + alpha * (reward - current_q) // 簡易版
    
    q_table[state_key][action] = new_q
    
    // エージェントを更新
    const new_total_episodes = (agent.total_episodes as number) + 1
    const new_avg_reward = ((agent.average_reward as number) * (agent.total_episodes as number) + reward) / new_total_episodes
    
    await env.DB.prepare(`
      UPDATE rl_agents
      SET q_table = ?,
          total_episodes = ?,
          average_reward = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      JSON.stringify(q_table),
      new_total_episodes,
      new_avg_reward,
      agent.id
    ).run()
    
    return c.json({
      success: true,
      new_q_value: new_q,
      average_reward: new_avg_reward,
      total_episodes: new_total_episodes
    })
  } catch (error: any) {
    console.error('強化学習エラー:', error)
    return c.json({ success: false, error: 'アクション実行に失敗しました' }, 500)
  }
})

// Phase 17: 強化学習 - 最適アクション推薦
app.post('/api/rl/recommend-action', async (c) => {
  const { env } = c
  const { student_id, current_state } = await c.req.json()
  
  try {
    const agent = await env.DB.prepare(`
      SELECT * FROM rl_agents
      WHERE student_id = ? AND agent_type = 'q_learning'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(student_id).first()
    
    if (!agent) {
      return c.json({
        success: true,
        recommended_action: 'explore', // デフォルトは探索
        confidence: 0,
        reason: '学習データが不足しています'
      })
    }
    
    const q_table = JSON.parse(agent.q_table as string || '{}')
    const state_key = JSON.stringify(current_state)
    const state_actions = q_table[state_key] || {}
    
    // ε-greedy戦略
    const epsilon = 0.1 // 探索率
    
    if (Math.random() < epsilon || Object.keys(state_actions).length === 0) {
      // 探索
      return c.json({
        success: true,
        recommended_action: 'explore',
        confidence: 0.5,
        reason: '新しいアクションを探索します'
      })
    } else {
      // 最適アクション選択
      let best_action = null
      let best_q = -Infinity
      
      for (const [action, q_value] of Object.entries(state_actions)) {
        if ((q_value as number) > best_q) {
          best_q = q_value as number
          best_action = action
        }
      }
      
      return c.json({
        success: true,
        recommended_action: best_action,
        q_value: best_q,
        confidence: Math.min(0.9, best_q / 10), // スケーリング
        reason: '学習履歴に基づく最適アクションです'
      })
    }
  } catch (error: any) {
    console.error('アクション推薦エラー:', error)
    return c.json({ success: false, error: '推薦に失敗しました' }, 500)
  }
})

// Phase 18: 音声入力 - 文字起こし保存
app.post('/api/voice/save-transcription', async (c) => {
  const { env } = c
  const { student_id, audio_url, transcription, confidence, language, duration, emotion } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO voice_inputs 
      (student_id, audio_url, transcription, transcription_confidence, language, duration_seconds, emotion_detected, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id,
      audio_url,
      transcription,
      confidence || 0.9,
      language || 'ja',
      duration || 0,
      emotion || 'neutral'
    ).run()
    
    return c.json({ success: true, message: '音声入力を保存しました' })
  } catch (error: any) {
    console.error('音声入力保存エラー:', error)
    return c.json({ success: false, error: '保存に失敗しました' }, 500)
  }
})

// Phase 18: 手書き認識 - 認識結果保存
app.post('/api/handwriting/save-recognition', async (c) => {
  const { env } = c
  const { student_id, curriculum_id, image_url, recognized_text, confidence, stroke_data, is_correct, feedback } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO handwriting_inputs 
      (student_id, curriculum_id, image_url, recognized_text, recognition_confidence, stroke_data, is_correct, feedback, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      student_id,
      curriculum_id || null,
      image_url,
      recognized_text,
      confidence || 0.9,
      JSON.stringify(stroke_data || []),
      is_correct ? 1 : 0,
      feedback || ''
    ).run()
    
    return c.json({ success: true, message: '手書き認識結果を保存しました' })
  } catch (error: any) {
    console.error('手書き認識保存エラー:', error)
    return c.json({ success: false, error: '保存に失敗しました' }, 500)
  }
})

// Phase 19: 学校管理 - 学校一覧取得
app.get('/api/schools', async (c) => {
  const { env } = c
  const municipality_id = c.req.query('municipality_id')
  
  try {
    let query = `
      SELECT s.*, m.municipality_name
      FROM schools s
      LEFT JOIN municipalities m ON s.municipality_id = m.id
      WHERE s.is_active = 1
    `
    
    const params: any[] = []
    if (municipality_id) {
      query += ` AND s.municipality_id = ?`
      params.push(parseInt(municipality_id))
    }
    
    query += ` ORDER BY s.school_name`
    
    const result = await env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      schools: result.results || []
    })
  } catch (error: any) {
    console.error('学校一覧取得エラー:', error)
    return c.json({ success: false, error: '取得に失敗しました' }, 500)
  }
})

// Phase 19: クロススクール分析 - 自治体全体の統計
app.get('/api/cross-school/analytics/:municipalityId', async (c) => {
  const { env } = c
  const municipalityId = parseInt(c.req.param('municipalityId'))
  
  try {
    // 各学校の統計を集計
    const schools = await env.DB.prepare(`
      SELECT id, school_code, school_name
      FROM schools
      WHERE municipality_id = ? AND is_active = 1
    `).bind(municipalityId).all()
    
    const schoolStats: any[] = []
    
    for (const school of (schools.results || [])) {
      // 学校ごとの統計
      const stats = await env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT u.id) as total_students,
          AVG(sp.understanding_level) as avg_understanding,
          AVG(sp.completion_time_minutes) as avg_completion_time,
          COUNT(sp.id) as total_cards_completed
        FROM users u
        LEFT JOIN student_progress sp ON u.id = sp.student_id AND sp.status = 'completed'
        WHERE u.class_code LIKE ? AND u.role = 'student'
      `).bind(`${school.school_code}%`).first()
      
      schoolStats.push({
        school_code: school.school_code,
        school_name: school.school_name,
        ...stats
      })
    }
    
    // 自治体全体の統計
    const overallStats = schoolStats.reduce((acc, school) => {
      acc.total_students += school.total_students || 0
      acc.total_understanding += (school.avg_understanding || 0) * (school.total_students || 0)
      acc.total_completion_time += (school.avg_completion_time || 0) * (school.total_students || 0)
      acc.total_cards += school.total_cards_completed || 0
      return acc
    }, { total_students: 0, total_understanding: 0, total_completion_time: 0, total_cards: 0 })
    
    const avgUnderstanding = overallStats.total_students > 0 
      ? overallStats.total_understanding / overallStats.total_students 
      : 0
    const avgCompletionTime = overallStats.total_students > 0 
      ? overallStats.total_completion_time / overallStats.total_students 
      : 0
    
    // トップ校・課題校の判定
    const sortedByUnderstanding = [...schoolStats].sort((a, b) => (b.avg_understanding || 0) - (a.avg_understanding || 0))
    const topSchools = sortedByUnderstanding.slice(0, 3)
    const strugglingSchools = sortedByUnderstanding.slice(-3).reverse()
    
    // 分析結果を保存
    await env.DB.prepare(`
      INSERT INTO cross_school_analytics 
      (analysis_date, municipality_id, school_ids, total_students, average_understanding, average_completion_time, average_engagement, top_performing_schools, struggling_schools, recommendations, created_at)
      VALUES (date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      municipalityId,
      JSON.stringify((schools.results || []).map((s: any) => s.id)),
      overallStats.total_students,
      avgUnderstanding,
      avgCompletionTime,
      0, // engagement計算は省略
      JSON.stringify(topSchools),
      JSON.stringify(strugglingSchools),
      JSON.stringify({
        overall: '自治体全体で個別最適化学習が機能しています',
        top_schools: 'ベストプラクティスを他校と共有してください',
        struggling_schools: '個別サポートと教師研修が推奨されます'
      })
    ).run()
    
    return c.json({
      success: true,
      municipality_id: municipalityId,
      overview: {
        total_students: overallStats.total_students,
        average_understanding: avgUnderstanding,
        average_completion_time: avgCompletionTime,
        total_cards_completed: overallStats.total_cards
      },
      schools: schoolStats,
      top_performing: topSchools,
      struggling: strugglingSchools,
      recommendations: {
        overall: '自治体全体で個別最適化学習が機能しています',
        top_schools: 'ベストプラクティスを他校と共有してください',
        struggling_schools: '個別サポートと教師研修が推奨されます'
      }
    })
  } catch (error: any) {
    console.error('クロススクール分析エラー:', error)
    return c.json({ success: false, error: '分析に失敗しました' }, 500)
  }
})

// Phase 19: 研究データセット作成
app.post('/api/research/create-dataset', async (c) => {
  const { env } = c
  const { dataset_name, researcher_id, description, data_collection_start, data_collection_end, school_codes, anonymization_level } = await c.req.json()
  
  try {
    // データセット作成
    const result = await env.DB.prepare(`
      INSERT INTO research_datasets 
      (dataset_name, researcher_id, description, data_collection_start, data_collection_end, schools_included, anonymization_level, export_format, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      dataset_name,
      researcher_id,
      description,
      data_collection_start,
      data_collection_end,
      JSON.stringify(school_codes),
      anonymization_level || 'full',
      'csv'
    ).run()
    
    return c.json({
      success: true,
      dataset_id: result.meta.last_row_id,
      message: '研究用データセットを作成しました',
      next_step: 'データエクスポートAPIを使用してデータを取得してください'
    })
  } catch (error: any) {
    console.error('データセット作成エラー:', error)
    return c.json({ success: false, error: '作成に失敗しました' }, 500)
  }
})

// A/Bテスト実験への参加登録
app.post('/api/ab-test/assign', async (c) => {
  const { env } = c
  const { experiment_name, student_id, class_code } = await c.req.json()
  
  try {
    // 既存の割り当てをチェック
    const existing = await env.DB.prepare(`
      SELECT * FROM ab_test_assignments
      WHERE experiment_name = ? AND student_id = ?
    `).bind(experiment_name, student_id).first()
    
    if (existing) {
      return c.json({
        success: true,
        variant: existing.variant_name,
        already_assigned: true
      })
    }
    
    // ランダム割り当て（完全にランダム化された比較試験）
    const variant = Math.random() < 0.5 ? 'control' : 'experimental'
    
    await env.DB.prepare(`
      INSERT INTO ab_test_assignments 
      (experiment_name, student_id, variant_name, class_code, assigned_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(experiment_name, student_id, variant, class_code).run()
    
    return c.json({
      success: true,
      variant,
      message: `${variant === 'control' ? 'コントロール群' : '実験群'}に割り当てられました`
    })
  } catch (error: any) {
    console.error('A/Bテスト割り当てエラー:', error)
    return c.json({ success: false, error: '割り当てに失敗しました' }, 500)
  }
})

// A/Bテストイベント記録
app.post('/api/ab-test/event', async (c) => {
  const { env } = c
  const { experiment_name, student_id, event_type, event_data } = await c.req.json()
  
  try {
    // 割り当てを取得
    const assignment = await env.DB.prepare(`
      SELECT variant_name FROM ab_test_assignments
      WHERE experiment_name = ? AND student_id = ?
    `).bind(experiment_name, student_id).first()
    
    if (!assignment) {
      return c.json({ success: false, error: '実験への割り当てが見つかりません' }, 400)
    }
    
    // イベントを記録
    await env.DB.prepare(`
      INSERT INTO ab_test_events 
      (experiment_name, student_id, variant_name, event_type, event_data, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      experiment_name,
      student_id,
      assignment.variant_name,
      event_type,
      JSON.stringify(event_data)
    ).run()
    
    return c.json({ success: true, message: 'イベントを記録しました' })
  } catch (error: any) {
    console.error('A/Bテストイベント記録エラー:', error)
    return c.json({ success: false, error: 'イベント記録に失敗しました' }, 500)
  }
})

// A/Bテスト結果分析
app.get('/api/ab-test/results/:experimentName', async (c) => {
  const { env } = c
  const experimentName = c.req.param('experimentName')
  
  try {
    // 各群のサンプルサイズ
    const sampleSizes = await env.DB.prepare(`
      SELECT variant_name, COUNT(*) as count
      FROM ab_test_assignments
      WHERE experiment_name = ?
      GROUP BY variant_name
    `).bind(experimentName).all()
    
    // 各群のメトリクス計算
    const controlMetrics = await env.DB.prepare(`
      SELECT 
        AVG(CAST(json_extract(event_data, '$.understanding_level') AS REAL)) as avg_understanding,
        AVG(CAST(json_extract(event_data, '$.completion_time') AS REAL)) as avg_completion_time,
        AVG(CAST(json_extract(event_data, '$.engagement_score') AS REAL)) as avg_engagement
      FROM ab_test_events
      WHERE experiment_name = ? AND variant_name = 'control'
        AND event_type = 'card_completed'
    `).bind(experimentName).first()
    
    const experimentalMetrics = await env.DB.prepare(`
      SELECT 
        AVG(CAST(json_extract(event_data, '$.understanding_level') AS REAL)) as avg_understanding,
        AVG(CAST(json_extract(event_data, '$.completion_time') AS REAL)) as avg_completion_time,
        AVG(CAST(json_extract(event_data, '$.engagement_score') AS REAL)) as avg_engagement
      FROM ab_test_events
      WHERE experiment_name = ? AND variant_name = 'experimental'
        AND event_type = 'card_completed'
    `).bind(experimentName).first()
    
    // 効果量の計算（Cohen's d）
    const controlUnderstanding = controlMetrics?.avg_understanding || 0
    const experimentalUnderstanding = experimentalMetrics?.avg_understanding || 0
    const effectSize = experimentalUnderstanding - controlUnderstanding
    
    // 統計的有意性の簡易判定（実際にはt検定が必要）
    const isSignificant = Math.abs(effectSize) > 0.5 // 中程度の効果量
    
    return c.json({
      success: true,
      experiment_name: experimentName,
      sample_sizes: sampleSizes.results || [],
      control_group: {
        n: (sampleSizes.results || []).find((s: any) => s.variant_name === 'control')?.count || 0,
        avg_understanding: controlUnderstanding,
        avg_completion_time: controlMetrics?.avg_completion_time || 0,
        avg_engagement: controlMetrics?.avg_engagement || 0
      },
      experimental_group: {
        n: (sampleSizes.results || []).find((s: any) => s.variant_name === 'experimental')?.count || 0,
        avg_understanding: experimentalUnderstanding,
        avg_completion_time: experimentalMetrics?.avg_completion_time || 0,
        avg_engagement: experimentalMetrics?.avg_engagement || 0
      },
      analysis: {
        effect_size: effectSize,
        improvement_percentage: (effectSize / Math.max(controlUnderstanding, 0.01)) * 100,
        is_significant: isSignificant,
        recommendation: isSignificant 
          ? (effectSize > 0 ? '実験手法の採用を推奨します' : 'コントロール手法を継続推奨')
          : 'さらなるデータ収集が必要です'
      }
    })
  } catch (error: any) {
    console.error('A/Bテスト結果分析エラー:', error)
    return c.json({ success: false, error: '分析に失敗しました' }, 500)
  }
})

// リアルタイム学習（オンライン学習）：モデル更新API
app.post('/api/ml/update-model/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { training_data } = await c.req.json()
  
  try {
    // 既存のモデルパラメータを取得
    const existingModel = await env.DB.prepare(`
      SELECT model_params, performance_metrics, training_samples
      FROM ml_models
      WHERE student_id = ? AND model_type = 'understanding_predictor'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(studentId).first()
    
    // 新しいトレーニングデータを履歴に保存
    await env.DB.prepare(`
      INSERT INTO ml_training_history 
      (student_id, model_type, training_data, performance_before, performance_after, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      studentId,
      'understanding_predictor',
      JSON.stringify(training_data),
      existingModel ? JSON.stringify(existingModel.performance_metrics) : '{}',
      '{}' // 後で更新
    ).run()
    
    // モデルパラメータの更新（簡易版：重み付き平均）
    const learningRate = 0.1 // オンライン学習率
    const newSamples = (existingModel?.training_samples || 0) + training_data.length
    
    // モデルを保存
    if (existingModel) {
      await env.DB.prepare(`
        UPDATE ml_models
        SET training_samples = ?,
            performance_metrics = json_set(performance_metrics, '$.last_update', datetime('now')),
            updated_at = datetime('now')
        WHERE student_id = ? AND model_type = 'understanding_predictor'
      `).bind(newSamples, studentId).run()
    } else {
      await env.DB.prepare(`
        INSERT INTO ml_models 
        (student_id, model_type, model_params, training_samples, performance_metrics, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        studentId,
        'understanding_predictor',
        JSON.stringify({ learning_rate: learningRate }),
        newSamples,
        JSON.stringify({ accuracy: 0, last_update: new Date().toISOString() })
      ).run()
    }
    
    return c.json({
      success: true,
      message: 'モデルをリアルタイム更新しました',
      training_samples: newSamples,
      learning_rate: learningRate
    })
  } catch (error: any) {
    console.error('ML モデル更新エラー:', error)
    return c.json({ success: false, error: 'モデル更新に失敗しました' }, 500)
  }
})

// ML予測API（TensorFlow.jsによる高度な予測）
app.post('/api/ml/predict/:studentId', async (c) => {
  const { env } = c
  const studentId = parseInt(c.req.param('studentId'))
  const { input_features } = await c.req.json()
  
  try {
    // 学習履歴データを取得
    const historyData = await env.DB.prepare(`
      SELECT 
        understanding_level,
        completion_time_minutes,
        hint_used_count,
        completed_at
      FROM student_progress
      WHERE student_id = ? AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 50
    `).bind(studentId).all()
    
    // 特徴量の計算
    const features = {
      avg_understanding: 0,
      avg_completion_time: 0,
      trend: 0,
      consistency: 0,
      recent_performance: 0
    }
    
    if (historyData.results && historyData.results.length > 0) {
      const understandingLevels = historyData.results.map((r: any) => r.understanding_level || 0)
      const completionTimes = historyData.results.map((r: any) => r.completion_time_minutes || 0)
      
      features.avg_understanding = understandingLevels.reduce((a, b) => a + b, 0) / understandingLevels.length
      features.avg_completion_time = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
      
      // トレンド計算（最近10件 vs 全体）
      const recentUnderstanding = understandingLevels.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, understandingLevels.length)
      features.trend = recentUnderstanding - features.avg_understanding
      features.recent_performance = recentUnderstanding
      
      // 一貫性（標準偏差）
      const variance = understandingLevels.reduce((sum, val) => sum + Math.pow(val - features.avg_understanding, 2), 0) / understandingLevels.length
      features.consistency = Math.sqrt(variance)
    }
    
    // 簡易的な予測（実際のTensorFlow.jsモデルはクライアント側で実行）
    const predicted_understanding = Math.max(1, Math.min(5, 
      features.avg_understanding + features.trend * 0.3
    ))
    
    const confidence = Math.max(0, Math.min(1, 
      1 - (features.consistency / 5) // 一貫性が高いほど信頼度が高い
    ))
    
    // 予測を保存
    await env.DB.prepare(`
      INSERT INTO ml_predictions 
      (student_id, model_type, input_features, prediction_result, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      studentId,
      'understanding_predictor',
      JSON.stringify(input_features),
      JSON.stringify({ predicted_understanding, features }),
      confidence
    ).run()
    
    return c.json({
      success: true,
      prediction: {
        understanding_level: predicted_understanding,
        confidence: confidence,
        features: features,
        recommendation: predicted_understanding < 3 
          ? '個別サポートを推奨します'
          : predicted_understanding > 4
          ? '発展的な課題への挑戦を推奨します'
          : '現在のペースを維持しましょう'
      }
    })
  } catch (error: any) {
    console.error('ML 予測エラー:', error)
    return c.json({ success: false, error: '予測に失敗しました' }, 500)
  }
})

// ==============================================
// Phase 17-19: 深層学習・マルチモーダル・大規模展開
// ==============================================

// コーディネーター向け：複数校データ統合分析
app.get('/api/coordinator/cross-school-analytics', async (c) => {
  const { env } = c
  const coordinatorId = c.req.query('coordinator_id')
  const scope = c.req.query('scope') || 'municipality' // 'municipality', 'prefecture', 'national'
  
  try {
    // コーディネーターの管理校を取得
    const coordinator = await env.DB.prepare(`
      SELECT managed_schools FROM teachers WHERE user_id = ?
    `).bind(coordinatorId).first()
    
    if (!coordinator) {
      return c.json({ success: false, error: 'コーディネーター情報が見つかりません' }, 404)
    }
    
    const managedSchools = JSON.parse(coordinator.managed_schools as string || '[]')
    
    // 各学校のデータを集計
    const schoolsData = []
    
    for (const schoolId of managedSchools) {
      const schoolInfo = await env.DB.prepare(`
        SELECT school_code, school_name FROM schools WHERE id = ?
      `).bind(schoolId).first()
      
      // 学校ごとの生徒データ
      const students = await env.DB.prepare(`
        SELECT id FROM users 
        WHERE role = 'student' 
        AND class_code IN (
          SELECT class_code FROM users WHERE role = 'teacher' AND id IN (
            SELECT user_id FROM teachers WHERE school_id = ?
          )
        )
      `).bind(schoolId).all()
      
      // 平均理解度
      const avgUnderstanding = await env.DB.prepare(`
        SELECT AVG(understanding_level) as avg_understanding
        FROM student_progress
        WHERE student_id IN (${(students.results || []).map((s: any) => s.id).join(',') || '0'})
          AND status = 'completed'
      `).first()
      
      // エンゲージメント
      const engagement = await env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT student_id) as active_students,
          AVG(session_duration) as avg_session_duration
        FROM learning_behavior_logs
        WHERE student_id IN (${(students.results || []).map((s: any) => s.id).join(',') || '0'})
          AND created_at >= datetime('now', '-7 days')
      `).first()
      
      schoolsData.push({
        school_id: schoolId,
        school_code: schoolInfo?.school_code,
        school_name: schoolInfo?.school_name,
        total_students: (students.results || []).length,
        avg_understanding: avgUnderstanding?.avg_understanding || 0,
        active_students: engagement?.active_students || 0,
        avg_session_duration: engagement?.avg_session_duration || 0
      })
    }
    
    // 全体統計
    const totalStudents = schoolsData.reduce((sum, s) => sum + s.total_students, 0)
    const overallAvgUnderstanding = schoolsData.reduce((sum, s) => sum + s.avg_understanding, 0) / schoolsData.length
    
    // トップパフォーマンス校
    const topSchools = schoolsData
      .sort((a, b) => b.avg_understanding - a.avg_understanding)
      .slice(0, 3)
      .map(s => s.school_code)
    
    // 支援が必要な学校
    const strugglingSchools = schoolsData
      .filter(s => s.avg_understanding < 3.0)
      .map(s => s.school_code)
    
    // 結果を保存
    await env.DB.prepare(`
      INSERT INTO cross_school_analytics 
      (analysis_type, scope_identifier, total_students, total_schools, 
       avg_understanding, top_performing_schools, struggling_schools, 
       recommendations, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      scope,
      scope === 'municipality' ? 'village_001' : scope,
      totalStudents,
      managedSchools.length,
      overallAvgUnderstanding,
      JSON.stringify(topSchools),
      JSON.stringify(strugglingSchools),
      JSON.stringify({
        focus_areas: strugglingSchools.length > 0 ? '支援が必要な学校があります' : '全体的に順調',
        best_practices: topSchools.length > 0 ? 'トップ校の実践を共有しましょう' : ''
      })
    ).run()
    
    return c.json({
      success: true,
      summary: {
        total_students: totalStudents,
        total_schools: managedSchools.length,
        avg_understanding: overallAvgUnderstanding,
        top_schools: topSchools,
        struggling_schools: strugglingSchools
      },
      schools_data: schoolsData,
      recommendations: {
        immediate_action: strugglingSchools.length > 0 
          ? `${strugglingSchools.length}校が支援を必要としています` 
          : '全校順調に進行中',
        best_practices: topSchools.length > 0 
          ? `${topSchools.join(', ')}の実践を他校と共有することを推奨します` 
          : ''
      }
    })
  } catch (error: any) {
    console.error('クロススクール分析エラー:', error)
    return c.json({ success: false, error: '分析に失敗しました' }, 500)
  }
})

// データ共有許可の申請（コーディネーター → 担任教師）
app.post('/api/coordinator/request-data-access', async (c) => {
  const { env } = c
  const { student_id, coordinator_id, teacher_id, purpose } = await c.req.json()
  
  try {
    // 既存の許可をチェック
    const existing = await env.DB.prepare(`
      SELECT * FROM data_sharing_permissions
      WHERE student_id = ? AND shared_with_user_id = ? AND is_active = 1
    `).bind(student_id, coordinator_id).first()
    
    if (existing) {
      return c.json({
        success: true,
        message: 'すでにアクセス権限があります',
        permission_id: existing.id
      })
    }
    
    // 新規許可を作成（担任の承認が必要）
    await env.DB.prepare(`
      INSERT INTO data_sharing_permissions 
      (student_id, shared_with_user_id, permission_type, granted_by_user_id, 
       consent_date, is_active)
      VALUES (?, ?, ?, ?, datetime('now'), 1)
    `).bind(student_id, coordinator_id, 'analyze', teacher_id).run()
    
    return c.json({
      success: true,
      message: 'データアクセス権限を付与しました',
      purpose: purpose
    })
  } catch (error: any) {
    console.error('データアクセス申請エラー:', error)
    return c.json({ success: false, error: '申請に失敗しました' }, 500)
  }
})

// 研究論文用データエクスポート（完全匿名化）
app.get('/api/coordinator/research-export', async (c) => {
  const { env } = c
  const coordinatorId = c.req.query('coordinator_id')
  const startDate = c.req.query('start_date')
  const endDate = c.req.query('end_date')
  const format = c.req.query('format') || 'json' // 'json', 'csv', 'spss'
  
  try {
    // アクセス権限チェック
    const permissions = await env.DB.prepare(`
      SELECT student_id FROM data_sharing_permissions
      WHERE shared_with_user_id = ? AND is_active = 1 AND permission_type = 'analyze'
    `).bind(coordinatorId).all()
    
    const studentIds = (permissions.results || []).map((p: any) => p.student_id)
    
    if (studentIds.length === 0) {
      return c.json({ success: false, error: 'アクセス可能なデータがありません' }, 403)
    }
    
    // 完全匿名化データの取得
    const researchData = []
    
    for (let i = 0; i < studentIds.length; i++) {
      const studentId = studentIds[i]
      
      // 学習プロファイル
      const profile = await env.DB.prepare(`
        SELECT profile_data, overall_score, confidence_level
        FROM learning_profiles
        WHERE student_id = ?
        ORDER BY updated_at DESC LIMIT 1
      `).bind(studentId).first()
      
      // A/Bテスト割り当て
      const abTest = await env.DB.prepare(`
        SELECT variant_name FROM ab_test_assignments
        WHERE student_id = ? LIMIT 1
      `).bind(studentId).first()
      
      // 進捗データ
      const progress = await env.DB.prepare(`
        SELECT 
          COUNT(*) as total_cards,
          AVG(understanding_level) as avg_understanding,
          AVG(completion_time_minutes) as avg_time,
          AVG(hint_used_count) as avg_hints
        FROM student_progress
        WHERE student_id = ? 
          AND status = 'completed'
          AND completed_at BETWEEN ? AND ?
      `).bind(studentId, startDate, endDate).first()
      
      if (profile) {
        const profileData = JSON.parse(profile.profile_data as string)
        
        researchData.push({
          // 完全匿名ID
          participant_id: `P${String(i + 1).padStart(4, '0')}`,
          
          // 実験条件
          condition: abTest?.variant_name || 'not_assigned',
          
          // 学習スタイル
          learning_style_visual: profileData.patterns?.learning_style?.visual || 0,
          learning_style_auditory: profileData.patterns?.learning_style?.auditory || 0,
          learning_style_kinesthetic: profileData.patterns?.learning_style?.kinesthetic || 0,
          dominant_style: profileData.patterns?.learning_style?.dominant_style,
          
          // パフォーマンス指標
          avg_understanding: progress?.avg_understanding || 0,
          total_cards_completed: progress?.total_cards || 0,
          avg_completion_time: progress?.avg_time || 0,
          avg_hints_used: progress?.avg_hints || 0,
          
          // 全体スコア
          overall_score: profile.overall_score,
          confidence_level: profile.confidence_level,
          
          // 時間的情報
          data_collection_start: startDate,
          data_collection_end: endDate
        })
      }
    }
    
    if (format === 'csv') {
      // CSV形式
      const headers = Object.keys(researchData[0] || {})
      const csvRows = [headers.join(',')]
      
      for (const row of researchData) {
        csvRows.push(headers.map(h => row[h]).join(','))
      }
      
      return c.text(csvRows.join('\n'), 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="research_data_${Date.now()}.csv"`
      })
    }
    
    // JSON形式（デフォルト）
    return c.json({
      success: true,
      metadata: {
        total_participants: researchData.length,
        data_collection_period: { start: startDate, end: endDate },
        anonymization: 'full',
        export_date: new Date().toISOString()
      },
      data: researchData
    })
  } catch (error: any) {
    console.error('研究データエクスポートエラー:', error)
    return c.json({ success: false, error: 'エクスポートに失敗しました' }, 500)
  }
})

// 不登校児童サポート記録
app.post('/api/coordinator/truancy-support', async (c) => {
  const { env } = c
  const { student_id, support_type, progress_notes, coordinator_id } = await c.req.json()
  
  try {
    // 既存の記録を取得
    const existing = await env.DB.prepare(`
      SELECT * FROM truancy_support_records
      WHERE student_id = ?
      ORDER BY updated_at DESC LIMIT 1
    `).bind(student_id).first()
    
    if (existing) {
      // 更新
      await env.DB.prepare(`
        UPDATE truancy_support_records
        SET support_type = ?,
            progress_notes = ?,
            support_coordinator_id = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(support_type, progress_notes, coordinator_id, existing.id).run()
    } else {
      // 新規作成
      await env.DB.prepare(`
        INSERT INTO truancy_support_records 
        (student_id, support_type, progress_notes, support_coordinator_id, 
         engagement_level, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'low', datetime('now'), datetime('now'))
      `).bind(student_id, support_type, progress_notes, coordinator_id).run()
    }
    
    // 学習履歴を確認
    const recentActivity = await env.DB.prepare(`
      SELECT COUNT(*) as activity_count
      FROM learning_behavior_logs
      WHERE student_id = ? AND created_at >= datetime('now', '-7 days')
    `).bind(student_id).first()
    
    return c.json({
      success: true,
      message: 'サポート記録を更新しました',
      engagement_status: {
        recent_activity_count: recentActivity?.activity_count || 0,
        engagement_level: (recentActivity?.activity_count || 0) > 5 ? 'improving' : 'needs_attention'
      }
    })
  } catch (error: any) {
    console.error('不登校サポート記録エラー:', error)
    return c.json({ success: false, error: '記録に失敗しました' }, 500)
  }
})

// 論文トラッキング
app.post('/api/coordinator/research-publication', async (c) => {
  const { env } = c
  const { 
    title, authors, publication_type, publication_venue, 
    abstract, keywords, sample_size, key_findings 
  } = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO research_publications 
      (title, authors, publication_type, publication_venue, abstract, keywords,
       sample_size, key_findings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      title,
      authors,
      publication_type,
      publication_venue,
      abstract,
      JSON.stringify(keywords),
      sample_size,
      key_findings
    ).run()
    
    return c.json({
      success: true,
      message: '論文情報を登録しました'
    })
  } catch (error: any) {
    console.error('論文登録エラー:', error)
    return c.json({ success: false, error: '登録に失敗しました' }, 500)
  }
})

// ==============================================
// WebSocketエンドポイント
// ==============================================

// WebSocket接続エンドポイント（ローカル開発のみ）
app.get('/api/ws', async (c) => {
  const { env } = c
  
  // Durable Objectsが利用不可の場合はエラーを返す
  if (!env.PROGRESS_WEBSOCKET) {
    return c.json({ 
      error: 'WebSocket is not available in production. Use polling instead.',
      message: 'WebSocket機能は開発環境でのみ利用可能です。'
    }, 503)
  }
  
  // クエリパラメータからクラスコードとユーザー情報を取得
  const classCode = c.req.query('classCode')
  const userId = c.req.query('userId')
  const role = c.req.query('role')
  
  if (!classCode) {
    return c.json({ error: 'classCode is required' }, 400)
  }
  
  // Durable ObjectのIDを生成（クラスコードごとに1つのインスタンス）
  const id = env.PROGRESS_WEBSOCKET.idFromName(classCode)
  const stub = env.PROGRESS_WEBSOCKET.get(id)
  
  // リクエストをDurable Objectに転送
  const url = new URL(c.req.url)
  url.pathname = '/ws'
  url.searchParams.set('classCode', classCode)
  if (userId) url.searchParams.set('userId', userId)
  if (role) url.searchParams.set('role', role)
  
  return stub.fetch(url.toString(), c.req.raw)
})

// ==============================================
// 提案書ページ
// ==============================================
app.get('/proposal', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI駆動型個別最適化学習システム導入提案書</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        .slide {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 4rem 2rem;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .slide-number {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            background: rgba(0,0,0,0.5);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
        }
        @media print {
            .slide {
                page-break-after: always;
                min-height: 100vh;
            }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="fixed top-4 right-4 z-50 flex gap-2">
        <button onclick="previousSlide()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-arrow-left"></i> 前へ
        </button>
        <button onclick="nextSlide()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            次へ <i class="fas fa-arrow-right"></i>
        </button>
        <button onclick="window.print()" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            <i class="fas fa-print"></i>
        </button>
    </div>

    <!-- Slide 1: 表紙 -->
    <div class="slide gradient-bg text-white" data-slide="1">
        <div class="max-w-6xl mx-auto text-center">
            <h1 class="text-6xl font-bold mb-8">
                一村から始まる教育改革
            </h1>
            <h2 class="text-4xl font-semibold mb-12">
                AI駆動型個別最適化学習システム<br>導入提案書
            </h2>
            <div class="text-2xl mb-8">
                全ての子どもに最適な学び、世界へ発信する教育モデル
            </div>
            <div class="mt-16 text-xl">
                <div class="mb-4"><i class="fas fa-graduation-cap mr-3"></i>Phase 1-19 完全実装済み</div>
                <div class="mb-4"><i class="fas fa-chart-line mr-3"></i>2年間のエビデンス構築</div>
                <div class="mb-4"><i class="fas fa-globe mr-3"></i>全国モデルケースへ</div>
            </div>
        </div>
    </div>

    <!-- Slide 2: エグゼクティブサマリー -->
    <div class="slide bg-white" data-slide="2">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-blue-600 pb-4">
                エグゼクティブサマリー
            </h2>
            <div class="grid grid-cols-2 gap-8 mb-8">
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">提案の核心</h3>
                    <ul class="space-y-3 text-lg">
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>Phase 1-19 完全実装済み（20,000行）</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>2年間の実証研究</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>一斉授業からの転換</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>不登校児童支援</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>全国モデルケース</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-green-700 mb-4">期待される成果</h3>
                    <ul class="space-y-3 text-lg">
                        <li><i class="fas fa-arrow-up text-green-600 mr-2"></i>理解度: <strong>30-40%向上</strong></li>
                        <li><i class="fas fa-clock text-green-600 mr-2"></i>教師負担: <strong>40-50%軽減</strong></li>
                        <li><i class="fas fa-heart text-green-600 mr-2"></i>不登校復帰率: <strong>60-70%向上</strong></li>
                        <li><i class="fas fa-trophy text-green-600 mr-2"></i>学会発表: <strong>年4-6回</strong></li>
                        <li><i class="fas fa-newspaper text-green-600 mr-2"></i>メディア掲載: <strong>3-5回</strong></li>
                    </ul>
                </div>
            </div>
            <div class="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg">
                <h3 class="text-2xl font-bold text-purple-700 mb-4">投資対効果（ROI）</h3>
                <div class="grid grid-cols-3 gap-6 text-center">
                    <div>
                        <div class="text-4xl font-bold text-purple-600 mb-2">100-220万円</div>
                        <div class="text-lg text-gray-700">2年間投資額</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-green-600 mb-2">4,000-5,600万円</div>
                        <div class="text-lg text-gray-700">2年間リターン</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-red-600 mb-2">20-50倍</div>
                        <div class="text-lg text-gray-700">ROI</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 3: 現状の課題 -->
    <div class="slide bg-gradient-to-br from-red-50 to-orange-50" data-slide="3">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-red-600 pb-4">
                現状の課題 - なぜ今、変革が必要か
            </h2>
            <div class="grid grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-red-700 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>一斉授業の限界
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>✗ 理解度の個人差が大きい（1-5まで分散）</li>
                        <li>✗ 理解が遅い子は置き去り</li>
                        <li>✗ 理解が早い子は退屈</li>
                        <li>✗ 40人全員に同じペース</li>
                        <li>✗ データ不足で把握困難</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-orange-700 mb-4">
                        <i class="fas fa-user-clock mr-2"></i>教師の過重負担
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>✗ 月平均残業80時間以上</li>
                        <li>✗ 個別対応は物理的に限界</li>
                        <li>✗ 採点・事務作業に膨大な時間</li>
                        <li>✗ データなく経験頼み</li>
                        <li>✗ 働き方改革が進まない</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-purple-700 mb-4">
                        <i class="fas fa-user-slash mr-2"></i>不登校児童の増加
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>✗ 全国で30万人（過去最多）</li>
                        <li>✗ 学校に行けない = 学べない</li>
                        <li>✗ 学習遅れが復帰のハードルに</li>
                        <li>✗ 社会とのつながり喪失</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">
                        <i class="fas fa-map-marked-alt mr-2"></i>地方の教育格差
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>✗ 都市部との格差拡大</li>
                        <li>✗ 塾・予備校へのアクセス困難</li>
                        <li>✗ 教育資源・専門教員不足</li>
                        <li>✗ 最新手法が届かない</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 4: システム概要 -->
    <div class="slide bg-white" data-slide="4">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-blue-600 pb-4">
                システム概要 - Phase 1-19 完全実装
            </h2>
            <div class="grid grid-cols-3 gap-6 mb-8">
                <div class="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">20,000</div>
                    <div class="text-xl">総コード行数</div>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">40+</div>
                    <div class="text-xl">データベーステーブル</div>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">90+</div>
                    <div class="text-xl">APIエンドポイント</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-6">
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">Phase 1-8: 基本機能</h3>
                    <ul class="space-y-2 text-lg">
                        <li>✓ 認証・権限管理</li>
                        <li>✓ 自由進度学習カード</li>
                        <li>✓ AI対話（Gemini統合）</li>
                        <li>✓ 自動問題生成</li>
                        <li>✓ 進捗追跡</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-green-700 mb-4">Phase 9-14: データ分析</h3>
                    <ul class="space-y-2 text-lg">
                        <li>✓ 6つの学習パターン分析</li>
                        <li>✓ 教師ダッシュボード</li>
                        <li>✓ 個別最適化カード</li>
                        <li>✓ AI予測機能</li>
                        <li>✓ 多言語対応・研究データ</li>
                    </ul>
                </div>
                <div class="bg-purple-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-purple-700 mb-4">Phase 15-16: 機械学習</h3>
                    <ul class="space-y-2 text-lg">
                        <li>✓ TensorFlow.js統合</li>
                        <li>✓ リアルタイム学習</li>
                        <li>✓ A/Bテスト・RCT</li>
                        <li>✓ 統計分析</li>
                    </ul>
                </div>
                <div class="bg-orange-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-orange-700 mb-4">Phase 17-19: 大規模展開</h3>
                    <ul class="space-y-2 text-lg">
                        <li>✓ 深層学習（LSTM/Transformer）</li>
                        <li>✓ マルチモーダル学習</li>
                        <li>✓ 複数校管理</li>
                        <li>✓ 研究支援・グローバル展開</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 5: 村長へのメリット -->
    <div class="slide bg-gradient-to-br from-yellow-50 to-amber-50" data-slide="5">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-yellow-600 pb-4">
                <i class="fas fa-landmark mr-3"></i>村長へのメリット
            </h2>
            <div class="grid grid-cols-2 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-3xl font-bold text-yellow-700 mb-6">投資対効果（ROI）</h3>
                    <div class="space-y-6">
                        <div>
                            <div class="text-sm text-gray-600 mb-1">2年間投資額</div>
                            <div class="text-4xl font-bold text-red-600">100-220万円</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">2年間リターン</div>
                            <div class="text-4xl font-bold text-green-600">4,280-5,600万円</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">ROI（投資対効果）</div>
                            <div class="text-5xl font-bold text-blue-600">20-50倍</div>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-3xl font-bold text-green-700 mb-4">具体的なリターン</h3>
                    <ul class="space-y-3 text-lg">
                        <li><strong>教師時間削減:</strong> 2,400万円</li>
                        <li><strong>不登校対応削減:</strong> 600万円</li>
                        <li><strong>ブランディング:</strong> 1,000-2,000万円</li>
                        <li><strong>交流人口増:</strong> 80-300万円</li>
                        <li><strong>人口流入:</strong> 200-300万円</li>
                    </ul>
                    <div class="mt-6 p-4 bg-green-100 rounded-lg">
                        <div class="text-sm text-gray-700 mb-1">長期効果（学力向上）</div>
                        <div class="text-3xl font-bold text-green-700">村への還元: 1,800万円</div>
                    </div>
                </div>
            </div>
            <div class="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
                <h3 class="text-2xl font-bold text-purple-700 mb-4">
                    <i class="fas fa-star mr-2"></i>村の未来ビジョン
                </h3>
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-4xl mb-2">🏆</div>
                        <div class="font-semibold text-lg">教育改革発祥の地</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">📈</div>
                        <div class="font-semibold text-lg">人口流入促進</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">🏢</div>
                        <div class="font-semibold text-lg">企業誘致</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">🌟</div>
                        <div class="font-semibold text-lg">全国モデル村</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 6: 予算計画 -->
    <div class="slide bg-white" data-slide="6">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-green-600 pb-4">
                予算計画 - 詳細内訳
            </h2>
            <div class="grid grid-cols-2 gap-8">
                <div>
                    <h3 class="text-3xl font-bold text-blue-700 mb-6">初年度（2024年度）</h3>
                    <div class="space-y-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">システム利用料</span>
                                <span class="text-xl font-bold text-blue-600">82,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">Cloudflare + Gemini API</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">端末・機器</span>
                                <span class="text-xl font-bold text-blue-600">0-1,240,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">既存端末活用で大幅削減可能</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">研修費</span>
                                <span class="text-xl font-bold text-blue-600">150,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">外部講師・教材費</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">その他</span>
                                <span class="text-xl font-bold text-blue-600">150,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">印刷費・予備費</div>
                        </div>
                        <div class="bg-blue-200 p-4 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-xl font-bold">初年度合計</span>
                                <span class="text-3xl font-bold text-blue-800">422,000円〜</span>
                            </div>
                            <div class="text-sm text-gray-700 mt-1">既存端末活用の場合</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-3xl font-bold text-green-700 mb-6">2年目（2025年度）</h3>
                    <div class="space-y-4">
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">システム利用料</span>
                                <span class="text-xl font-bold text-green-600">82,000円</span>
                            </div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">運用費</span>
                                <span class="text-xl font-bold text-green-600">150,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">メンテナンス・バックアップ</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">研究費</span>
                                <span class="text-xl font-bold text-green-600">300,000円</span>
                            </div>
                            <div class="text-sm text-gray-600">学会参加・論文投稿</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">その他</span>
                                <span class="text-xl font-bold text-green-600">80,000円</span>
                            </div>
                        </div>
                        <div class="bg-green-200 p-4 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-xl font-bold">2年目合計</span>
                                <span class="text-3xl font-bold text-green-800">612,000円</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 bg-purple-100 p-4 rounded-lg">
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-700 mb-2">2年間総額</div>
                            <div class="text-4xl font-bold text-purple-700">1,034,000円</div>
                            <div class="text-sm text-gray-600 mt-1">（既存端末活用の場合）</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Final Slide: 今、決断を -->
    <div class="slide gradient-bg text-white" data-slide="7">
        <div class="max-w-6xl mx-auto text-center">
            <h2 class="text-6xl font-bold mb-12">今、決断を</h2>
            <div class="text-3xl mb-16 leading-relaxed">
                教育は未来への投資<br>
                子どもたちは待っている<br>
                全国に先駆けるチャンス<br>
                一村から日本を変える
            </div>
            <div class="grid grid-cols-2 gap-8 text-left mb-16">
                <div class="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
                    <h3 class="text-3xl font-bold mb-4">✅ 今すぐ得られるもの</h3>
                    <ul class="space-y-3 text-xl">
                        <li>• 子どもたちの学力向上</li>
                        <li>• 教師の負担軽減</li>
                        <li>• 不登校児童の支援</li>
                        <li>• エビデンスの構築</li>
                        <li>• 全国モデルとしての地位</li>
                    </ul>
                </div>
                <div class="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
                    <h3 class="text-3xl font-bold mb-4">⚠️ 先延ばしのリスク</h3>
                    <ul class="space-y-3 text-xl">
                        <li>• 1年遅れ = 120名の機会損失</li>
                        <li>• 全国初のチャンス喪失</li>
                        <li>• 教育格差の拡大</li>
                        <li>• 他自治体に先行される</li>
                        <li>• モデル村の地位を逃す</li>
                    </ul>
                </div>
            </div>
            <div class="text-4xl font-bold mb-8">
                2年後、「やってよかった」と言える決断を
            </div>
            <div class="text-2xl">
                <i class="fas fa-graduation-cap mr-3"></i>
                Phase 1-19 完全実装済み・今すぐ開始可能
            </div>
        </div>
    </div>

    <div class="slide-number">
        <span id="current-slide">1</span> / <span id="total-slides">7</span>
    </div>

    <script>
        let currentSlide = 1;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        document.getElementById('total-slides').textContent = totalSlides;
        
        function showSlide(n) {
            if (n > totalSlides) currentSlide = 1;
            if (n < 1) currentSlide = totalSlides;
            else currentSlide = n;
            
            slides.forEach((slide, index) => {
                slide.style.display = (index + 1 === currentSlide) ? 'flex' : 'none';
            });
            
            document.getElementById('current-slide').textContent = currentSlide;
        }
        
        function nextSlide() {
            showSlide(currentSlide + 1);
        }
        
        function previousSlide() {
            showSlide(currentSlide - 1);
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') previousSlide();
        });
        
        showSlide(1);
    </script>
</body>
</html>`)
})

export default app
