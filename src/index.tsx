import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
  GEMINI_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS設定
app.use('/api/*', cors())

// 静的ファイル配信
app.use('/static/*', serveStatic({ root: './public' }))

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
    
    // 選択問題
    const optionalProblems = await env.DB.prepare(`
      SELECT * FROM optional_problems 
      WHERE curriculum_id = ?
      ORDER BY problem_number
    `).bind(id).all()
    
    return c.json({
      curriculum,
      courses: courses.results,
      optionalProblems: optionalProblems.results
    })
  } catch (error) {
    return c.json({ error: 'Database error' }, 500)
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

// APIルート：AI先生（Gemini API）
app.post('/api/ai/ask', async (c) => {
  const { env } = c
  const body = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    return c.json({ 
      answer: '申し訳ありません。AI先生は現在利用できません。ヒントカードや先生に聞いてみましょう。' 
    })
  }
  
  try {
    // 学習カード情報を取得
    const card = await env.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(body.cardId).first()
    
    // Gemini APIにリクエスト（最新のv1エンドポイント）
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `あなたは小学生の学習を支援するAI先生です。ソクラテス対話の手法を使い、子どもが自分で考えられるように導いてください。

【学習カード情報】
タイトル: ${card?.card_title || ''}
問題: ${body.context || ''}

【生徒の質問】
${body.question}

【回答のルール】
1. 答えを直接教えず、考えるヒントを出す
2. 小学生にわかりやすい言葉で
3. 励ましの言葉を入れる
4. 質問で返して考えを引き出す
5. 150文字以内で簡潔に

回答してください。`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          }
        })
      }
    )
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }
    
    const geminiData = await geminiResponse.json()
    
    const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                   '考えるヒントを用意できませんでした。もう一度質問してみてください。'
    
    return c.json({ answer })
    
  } catch (error) {
    console.error('AI error:', error)
    return c.json({ 
      answer: 'ごめんなさい、今は答えられません。ヒントカードを見てみましょう！' 
    })
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
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({ 
      feedback: 'がんばりましたね！次回も楽しく学習しましょう。' 
    })
  }
  
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `あなたは小学生の学習を応援するAI先生です。子どもの振り返りを読んで、励ましとアドバイスをしてください。

【振り返り内容】
良かったこと: ${body.reflection_good || 'なし'}
難しかったこと: ${body.reflection_bad || 'なし'}
わかったこと: ${body.reflection_learned || 'なし'}

【フィードバックのルール】
1. 必ず励ましの言葉から始める
2. 良かったことを具体的に褒める
3. 難しかったことには共感し、次へのヒントを出す
4. わかったことの素晴らしさを伝える
5. 次の学習への意欲が湧く言葉で締める
6. 小学生にわかりやすい言葉で
7. 150文字以内で簡潔に

フィードバックしてください。`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 200,
          }
        })
      }
    )
    
    const geminiData = await geminiResponse.json()
    
    if (!geminiResponse.ok) {
      throw new Error('Gemini API error')
    }
    
    const feedback = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 
                     'よくがんばりました！次回も楽しく学習しましょう。'
    
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
        learning_card_id, hint_level, hint_text, thinking_tool_suggestion
      ) VALUES (?, ?, ?, ?)
    `).bind(
      body.learning_card_id,
      body.hint_level,
      body.hint_text || '',
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
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

// APIルート：AI単元生成
app.post('/api/ai/generate-unit', async (c) => {
  const { env } = c
  const { grade, subject, textbook, unitName, customization } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      error: '単元生成機能は現在利用できません。',
      curriculum: null
    })
  }
  
  try {
    // カスタマイズ情報を整形
    const customInfo = customization ? `

【特別な配慮・カスタマイズ】
${customization.studentNeeds ? `生徒の状況: ${customization.studentNeeds}` : ''}
${customization.teacherGoals ? `先生の願い: ${customization.teacherGoals}` : ''}
${customization.learningStyle ? `学習スタイル: ${customization.learningStyle}` : ''}
${customization.specialSupport ? `特別支援: ${customization.specialSupport}` : ''}
` : ''
    
    const prompt = `あなたは経験豊富な教育カリキュラムデザイナーです。
以下の情報に基づいて、自由進度学習に最適な単元を設計してください。

【基本情報】
- 学年: ${grade}
- 教科: ${subject}
- 教科書: ${textbook}
- 単元名: ${unitName}${customInfo}

以下のJSON形式で、完全な単元を出力してください：

{
  "curriculum": {
    "grade": "${grade}",
    "subject": "${subject}",
    "textbook_company": "${textbook}",
    "unit_name": "${unitName}",
    "total_hours": 8,
    "unit_goal": "この単元で達成すべき学習目標（100文字程度）",
    "non_cognitive_goal": "非認知能力の目標（意欲、粘り強さ、協調性など）（80文字程度）"
  },
  "courses": [
    {
      "course_name": "じっくりコース",
      "description": "基礎をしっかり学びたい人向け",
      "color_code": "green",
      "cards": [
        {
          "card_number": 1,
          "card_title": "学習カードのタイトル",
          "card_type": "main",
          "problem_description": "問題文・課題の説明",
          "new_terms": "新しく出てくる言葉や用語",
          "example_problem": "例題",
          "example_solution": "例題の解き方・考え方",
          "real_world_connection": "実社会とのつながり・生活での活用",
          "hints": [
            {
              "hint_level": 1,
              "hint_text": "ヒント1（まず考えてほしいこと）",
              "thinking_tool_suggestion": "使える思考ツール（図・表・絵など）"
            },
            {
              "hint_level": 2,
              "hint_text": "ヒント2（もう少し詳しく）"
            },
            {
              "hint_level": 3,
              "hint_text": "ヒント3（ほぼ答えに近いヒント）"
            }
          ]
        }
      ]
    },
    {
      "course_name": "しっかりコース",
      "description": "標準的なペースで学びたい人向け",
      "color_code": "blue",
      "cards": []
    },
    {
      "course_name": "ぐんぐんコース",
      "description": "発展的な内容にチャレンジしたい人向け",
      "color_code": "purple",
      "cards": []
    }
  ],
  "optional_problems": [
    {
      "problem_title": "選択問題のタイトル",
      "problem_description": "発展的な問題や実践的な課題",
      "difficulty_level": "hard",
      "hint_text": "この問題のヒント"
    }
  ]
}

【重要な設計指針】
1. じっくりコース: 6枚（基礎重視）
2. しっかりコース: 6枚（標準的）
3. ぐんぐんコース: 6枚（発展的）
4. 各カードには必ず3段階のヒントを用意
5. 実社会とのつながりを重視
6. 子どもが自分で考え、試行錯誤できる内容
7. ${customization?.studentNeeds ? 'カスタマイズ要望を最優先に反映' : ''}

必ず完全なJSONのみを出力してください。説明文は不要です。`

    // Gemini 2.0 Flash Thinkingを使用（推奨）
    let modelName = 'gemini-2.0-flash-thinking-exp-01-21'
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
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
    
    // フォールバック: Gemini 2.5 Flashを使用
    if (!response.ok) {
      console.log('Gemini 2.0 failed, falling back to 2.5 Flash')
      modelName = 'gemini-2.5-flash'
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
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
    }
    
    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    
    // JSONを抽出
    const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      aiResponse.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}'
    
    let unitData
    try {
      unitData = JSON.parse(jsonStr)
    } catch (parseError) {
      // JSON解析エラーの場合、再試行
      console.error('JSON parse error:', parseError)
      return c.json({
        error: '単元の生成に失敗しました。もう一度お試しください。',
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
      curriculum: null
    })
  }
})

// APIルート：生成した単元を保存
app.post('/api/curriculum/save-generated', async (c) => {
  const { env } = c
  const { curriculum, courses, optionalProblems } = await c.req.json()
  
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
      const courseResult = await env.DB.prepare(`
        INSERT INTO courses (
          curriculum_id, course_name, description, color_code
        ) VALUES (?, ?, ?, ?)
      `).bind(
        curriculumId,
        course.course_name,
        course.description,
        course.color_code
      ).run()
      
      const courseId = courseResult.meta.last_row_id
      
      // 学習カードを保存
      for (const card of course.cards || []) {
        const cardResult = await env.DB.prepare(`
          INSERT INTO learning_cards (
            course_id, card_number, card_title, card_type,
            problem_description, new_terms, example_problem,
            example_solution, real_world_connection
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          courseId,
          card.card_number,
          card.card_title,
          card.card_type || 'main',
          card.problem_description,
          card.new_terms || '',
          card.example_problem || '',
          card.example_solution || '',
          card.real_world_connection || ''
        ).run()
        
        const cardId = cardResult.meta.last_row_id
        
        // ヒントカードを保存
        for (const hint of card.hints || []) {
          await env.DB.prepare(`
            INSERT INTO hint_cards (
              learning_card_id, hint_level, hint_text, thinking_tool_suggestion
            ) VALUES (?, ?, ?, ?)
          `).bind(
            cardId,
            hint.hint_level,
            hint.hint_text,
            hint.thinking_tool_suggestion || ''
          ).run()
        }
      }
    }
    
    // 選択問題を保存
    for (const problem of optionalProblems || []) {
      await env.DB.prepare(`
        INSERT INTO optional_problems (
          curriculum_id, problem_title, problem_description,
          difficulty_level, hint_text
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        curriculumId,
        problem.problem_title,
        problem.problem_description,
        problem.difficulty_level || 'medium',
        problem.hint_text || ''
      ).run()
    }
    
    return c.json({
      success: true,
      curriculum_id: curriculumId
    })
    
  } catch (error) {
    console.error('単元保存エラー:', error)
    return c.json({ error: 'Database error' }, 500)
  }
})

export default app
