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
    
    // コースごとの学習カードを取得
    const coursesWithCards = await Promise.all(
      (courses.results || []).map(async (course: any) => {
        const cards = await env.DB.prepare(`
          SELECT * FROM learning_cards 
          WHERE course_id = ?
          ORDER BY card_number
        `).bind(course.id).all()
        return { ...course, cards: cards.results }
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
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
    
    const systemPrompt = `あなたは小学生の学習を支援する優しいAI先生です。
${cardContext ? `
現在の学習内容:
- カードタイトル: ${cardContext.card_title}
- 学習内容: ${cardContext.problem_description}
- 新出用語: ${cardContext.new_terms || 'なし'}
` : ''}

以下のルールを守ってください：
1. 小学生にも分かりやすい言葉で説明する
2. すぐに答えを教えず、考え方のヒントを与える
3. 励ましの言葉を入れる
4. 具体例や図で説明する方法を提案する
5. 200文字以内で簡潔に回答する`

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=AIzaSyD_eJYK2gY-_enQ6j2XeRwGAfjBZ5Dgs7I', {
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
    const prompt = `あなたは小中学校の教育専門家です。以下の情報に基づいて、学習指導要領に沿った主要な単元名を10個提案してください。

学年: ${grade}
教科: ${subject}
教科書会社: ${textbook}

【出力形式】
- 単元名のみをリスト形式で出力してください
- 各単元名は1行に1つ
- 番号や記号は不要
- 学習指導要領に基づいた正確な単元名を使用
- 学年に適した順序で並べる
- 説明文は不要

例:
かけ算の筆算
わり算の筆算
小数のかけ算
分数のたし算とひき算`

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

    if (!response.ok) {
      // フォールバック: Gemini 2.5 Flash
      const fallbackResponse = await fetch(
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
      
      if (!fallbackResponse.ok) {
        throw new Error('単元候補の生成に失敗しました')
      }
      
      const data = await fallbackResponse.json()
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      // レスポンスから単元名を抽出
      const units = aiResponse
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.match(/^[\d\.\-\*]+/) && line.length > 2 && line.length < 50)
        .slice(0, 10)
      
      return c.json({
        success: true,
        units,
        model_used: 'gemini-2.5-flash'
      })
    }

    const data = await response.json()
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // レスポンスから単元名を抽出
    const units = aiResponse
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^[\d\.\-\*]+/) && line.length > 2 && line.length < 50)
      .slice(0, 10)
    
    return c.json({
      success: true,
      units,
      model_used: 'gemini-3-flash-preview'
    })
    
  } catch (error) {
    console.error('単元候補生成エラー:', error)
    return c.json({
      error: '単元候補の生成に失敗しました。',
      units: []
    })
  }
})

// APIルート：AI単元生成
app.post('/api/ai/generate-unit', async (c) => {
  const { env } = c
  const { grade, subject, textbook, unitName, customization, qualityMode } = await c.req.json()
  
  const apiKey = env.GEMINI_API_KEY
  
  if (!apiKey) {
    return c.json({
      error: '単元生成機能は現在利用できません。',
      curriculum: null
    })
  }
  
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
    
    const prompt = `あなたは経験豊富な教育カリキュラムデザイナーです。
子どもたちがワクワクしながら主体的に学べる単元を設計してください。

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
    "unit_goal": "この単元で達成すべき学習目標（子どもが理解できる言葉で100文字程度、漢字にはふりがなを付ける）",
    "non_cognitive_goal": "非認知能力の目標（意欲、粘り強さ、協調性など）（80文字程度）"
  },
  "course_selection_problems": [
    {
      "problem_number": 1,
      "problem_title": "ゆっくりコースの入り口問題（例：お店で買い物してみよう）",
      "problem_description": "このコースで最初に出会う魅力的な問題。基礎的だけど「やってみたい！」と思える具体的な問題文を書く",
      "problem_content": "【必須・具体例】たろうくんは、100円を持ってお店に行きました。50円のえんぴつと30円の消しゴムを買いました。おつりはいくらでしょうか？（このような具体的な数字と状況を含む問題を必ず書く）",
      "course_level": "基礎",
      "connection_to_cards": "この問題は学習カード1-2で学ぶ内容につながります"
    },
    {
      "problem_number": 2,
      "problem_title": "しっかりコースの入り口問題（例：いろいろな方法で考えよう）",
      "problem_description": "このコースの特徴が伝わる魅力的な問題。標準的だけど工夫が必要で「考えてみたい！」と思える問題",
      "problem_content": "【必須・具体例】花子さんは、クッキーを友だちに配ります。1人に3枚ずつ配ると、4枚あまります。1人に4枚ずつ配ると、8枚足りません。友だちは何人いますか？（このような具体的な数字と状況を含む問題を必ず書く）",
      "course_level": "標準",
      "connection_to_cards": "この問題は学習カード1-3で学ぶ内容につながります"
    },
    {
      "problem_number": 3,
      "problem_title": "どんどんコースの入り口問題（例：深く考えてチャレンジ）",
      "problem_description": "このコースの発展性が伝わる魅力的な問題。「これが解けたらすごい！」「挑戦してみたい！」と思える問題",
      "problem_content": "【必須・具体例】学校の花だんに、赤い花と白い花をうえました。赤い花は白い花より12本多く、赤い花と白い花を合わせると40本です。赤い花と白い花は、それぞれ何本ずつですか？（このような具体的な数字と状況を含む、深く考える問題を必ず書く）",
      "course_level": "発展",
      "connection_to_cards": "この問題は学習カード1-4や選択問題1-2につながります"
    }
  ],
  "courses": [
    {
      "course_name": "ゆっくりコース",
      "course_label": "じっくり考えながら進むコース",
      "description": "ひとつひとつていねいに学びたい人におすすめ",
      "color_code": "green",
      "introduction_problem": {
        "problem_title": "ゆっくりコース導入問題のタイトル（必須・魅力的なタイトル）",
        "problem_content": "具体的な問題文（必須・実際に解ける問題、数字や状況を含む）",
        "answer": "解答のヒント（必須・子どもが理解できる解答）"
      },
      "cards": [
        {
          "card_number": 1,
          "card_title": "学習カード1のタイトル",
          "card_type": "main",
          "textbook_page": "教科書のページ（例: p.24-25）",
          "problem_description": "問題文・課題の説明",
          "new_terms": "新しく出てくる言葉や用語",
          "example_problem": "例題",
          "example_solution": "例題の解き方・考え方",
          "real_world_connection": "実社会とのつながり・生活での活用",
          "answer": "この学習カードの解答・答え（必須）",
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
        },
        {
          "card_number": 2,
          "card_title": "学習カード2のタイトル",
          "card_type": "main",
          "textbook_page": "p.26-27",
          "problem_description": "問題文",
          "new_terms": "新出用語",
          "example_problem": "例題",
          "example_solution": "解き方",
          "real_world_connection": "つながり",
          "answer": "カード2の解答（必須）",
          "hints": [
            {"hint_level": 1, "hint_text": "ヒント1（必須）"},
            {"hint_level": 2, "hint_text": "ヒント2（必須）"},
            {"hint_level": 3, "hint_text": "ヒント3（必須）"}
          ]
        },
        {
          "card_number": 3,
          "card_title": "学習カード3のタイトル",
          "card_type": "main",
          "textbook_page": "p.28-29",
          "problem_description": "問題文",
          "new_terms": "新出用語",
          "example_problem": "例題",
          "example_solution": "解き方",
          "real_world_connection": "つながり",
          "answer": "カード3の解答（必須）",
          "hints": [
            {"hint_level": 1, "hint_text": "ヒント1（必須）"},
            {"hint_level": 2, "hint_text": "ヒント2（必須）"},
            {"hint_level": 3, "hint_text": "ヒント3（必須）"}
          ]
        },
        {
          "card_number": 4,
          "card_title": "学習カード4のタイトル",
          "card_type": "main",
          "textbook_page": "p.30-31",
          "problem_description": "問題文",
          "new_terms": "新出用語",
          "example_problem": "例題",
          "example_solution": "解き方",
          "real_world_connection": "つながり",
          "answer": "カード4の解答（必須）",
          "hints": [
            {"hint_level": 1, "hint_text": "ヒント1（必須）"},
            {"hint_level": 2, "hint_text": "ヒント2（必須）"},
            {"hint_level": 3, "hint_text": "ヒント3（必須）"}
          ]
        },
        {
          "card_number": 5,
          "card_title": "学習カード5のタイトル",
          "card_type": "main",
          "textbook_page": "p.32-33",
          "problem_description": "問題文",
          "new_terms": "新出用語",
          "example_problem": "例題",
          "example_solution": "解き方",
          "real_world_connection": "つながり",
          "answer": "カード5の解答（必須）",
          "hints": [
            {"hint_level": 1, "hint_text": "ヒント1（必須）"},
            {"hint_level": 2, "hint_text": "ヒント2（必須）"},
            {"hint_level": 3, "hint_text": "ヒント3（必須）"}
          ]
        },
        {
          "card_number": 6,
          "card_title": "学習カード6のタイトル",
          "card_type": "main",
          "textbook_page": "p.34-35",
          "problem_description": "問題文",
          "new_terms": "新出用語",
          "example_problem": "例題",
          "example_solution": "解き方",
          "real_world_connection": "つながり",
          "answer": "カード6の解答（必須）",
          "hints": [
            {"hint_level": 1, "hint_text": "ヒント1（必須）"},
            {"hint_level": 2, "hint_text": "ヒント2（必須）"},
            {"hint_level": 3, "hint_text": "ヒント3（必須）"}
          ]
        }
      ]
    },
    {
      "course_name": "しっかりコース",
      "course_label": "自分のペースで学ぶコース",
      "description": "いろいろな方法で学びたい人におすすめ",
      "color_code": "blue",
      "introduction_problem": {
        "problem_title": "しっかりコース導入問題のタイトル（必須・魅力的なタイトル）",
        "problem_content": "具体的な問題文（必須・実際に解ける問題、数字や状況を含む）",
        "answer": "解答のヒント（必須・子どもが理解できる解答）"
      },
      "cards": [
        {"card_number": 1, "card_title": "カード1", "card_type": "main", "textbook_page": "p.24", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード1の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 2, "card_title": "カード2", "card_type": "main", "textbook_page": "p.26", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード2の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 3, "card_title": "カード3", "card_type": "main", "textbook_page": "p.28", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード3の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 4, "card_title": "カード4", "card_type": "main", "textbook_page": "p.30", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード4の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 5, "card_title": "カード5", "card_type": "main", "textbook_page": "p.32", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード5の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 6, "card_title": "カード6", "card_type": "main", "textbook_page": "p.34", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード6の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]}
      ]
    },
    {
      "course_name": "どんどんコース",
      "course_label": "いろいろなことにちょうせんするコース",
      "description": "自分で考えを深めたい人におすすめ",
      "color_code": "purple",
      "introduction_problem": {
        "problem_title": "どんどんコース導入問題のタイトル（必須・魅力的なタイトル）",
        "problem_content": "具体的な問題文（必須・実際に解ける問題、数字や状況を含む）",
        "answer": "解答のヒント（必須・子どもが理解できる解答）"
      },
      "cards": [
        {"card_number": 1, "card_title": "カード1", "card_type": "main", "textbook_page": "p.24", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード1の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 2, "card_title": "カード2", "card_type": "main", "textbook_page": "p.26", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード2の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 3, "card_title": "カード3", "card_type": "main", "textbook_page": "p.28", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード3の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 4, "card_title": "カード4", "card_type": "main", "textbook_page": "p.30", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード4の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 5, "card_title": "カード5", "card_type": "main", "textbook_page": "p.32", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード5の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]},
        {"card_number": 6, "card_title": "カード6", "card_type": "main", "textbook_page": "p.34", "problem_description": "問題", "new_terms": "用語", "example_problem": "例題", "example_solution": "解法", "real_world_connection": "つながり", "answer": "カード6の解答（必須）", "hints": [{"hint_level": 1, "hint_text": "ヒント1"}, {"hint_level": 2, "hint_text": "ヒント2"}, {"hint_level": 3, "hint_text": "ヒント3"}]}
      ]
    }
  ],
  "common_check_test": {
    "test_description": "全コース共通の基礎基本チェックテスト（知識理解の最低保証）",
    "test_note": "どのコースを選んでも、同じチェックテストを受けます。単元の基礎基本が身についているかを確認します。",
    "problems_count": 6,
    "sample_problems": [
      {
        "problem_number": 1,
        "problem_text": "具体的な基礎問題文1（数字や状況を含む、実際に解ける問題）",
        "answer": "簡潔な解答例",
        "difficulty": "basic"
      },
      {
        "problem_number": 2,
        "problem_text": "具体的な基礎問題文2",
        "answer": "簡潔な解答例",
        "difficulty": "basic"
      },
      {
        "problem_number": 3,
        "problem_text": "具体的な基礎問題文3",
        "answer": "簡潔な解答例",
        "difficulty": "basic"
      },
      {
        "problem_number": 4,
        "problem_text": "具体的な基礎問題文4",
        "answer": "簡潔な解答例",
        "difficulty": "basic"
      },
      {
        "problem_number": 5,
        "problem_text": "具体的な基礎問題文5",
        "answer": "簡潔な解答例",
        "difficulty": "basic"
      },
      {
        "problem_number": 6,
        "problem_text": "具体的な基礎問題文6",
        "answer": "簡潔な解答例",
        "difficulty": "basic"
      }
    ]
  },
  "optional_problems": [
    {
      "problem_number": 1,
      "problem_title": "【必須】選択問題1：実生活に生かせる問題（魅力的なタイトルをつける）",
      "problem_description": "【必須・具体例】学習したことを実際の生活で使える問題。例：お店の商品の値段を比べて、どっちがお得か考えよう。このような具体的な数字と状況を含む問題を書く。",
      "learning_meaning": "【必須】この問題を解くことで、算数が実際の生活で役に立つことがわかります。買い物で損をしない力がつきます。",
      "difficulty_level": "medium",
      "answer": "【必須】解答と解説をここに書く",
      "explanation": "【必須】考え方の説明をここに書く"
    },
    {
      "problem_number": 2,
      "problem_title": "【必須】選択問題2：教科の見方・考え方が深まる問題",
      "problem_description": "【必須・具体例】学習した内容を深く理解できる問題。図や表を使って考えよう。このような具体的な数字と状況を含む問題を書く。",
      "learning_meaning": "【必須】この問題を解くことで、なぜこの方法で解けるのか、深く理解できます。",
      "difficulty_level": "medium",
      "answer": "【必須】解答と解説",
      "explanation": "【必須】考え方の説明"
    },
    {
      "problem_number": 3,
      "problem_title": "【必須】選択問題3：他教科とつながる問題",
      "problem_description": "【必須・具体例】算数と理科や社会、体育などがつながる問題。このような具体的な数字と状況を含む問題を書く。",
      "learning_meaning": "【必須】この問題を解くことで、算数が他の教科でも使えることがわかります。",
      "difficulty_level": "hard",
      "answer": "【必須】解答と解説",
      "explanation": "【必須】考え方の説明"
    },
    {
      "problem_number": 4,
      "problem_title": "【必須】選択問題4：発展的な問題",
      "problem_description": "【必須・具体例】学習したことを応用して解く、少し難しい問題。このような具体的な数字と状況を含む問題を書く。",
      "learning_meaning": "【必須】この問題を解くことで、今まで学んだことを組み合わせて考える力がつきます。",
      "difficulty_level": "hard",
      "answer": "【必須】解答と解説",
      "explanation": "【必須】考え方の説明"
    },
    {
      "problem_number": 5,
      "problem_title": "【必須】選択問題5：教科の本質に触れる探究的な問題",
      "problem_description": "【必須・具体例】「なぜそうなるのか？」を深く考える問題。自分で予想して、確かめてみよう。このような具体的な数字と状況を含む問題を書く。",
      "learning_meaning": "【必須】この問題を解くことで、算数の面白さや不思議さに気づき、もっと学びたくなります。",
      "difficulty_level": "very_hard",
      "answer": "【必須】解答と解説",
      "explanation": "【必須】考え方の説明"
    },
    {
      "problem_number": 6,
      "problem_title": "【必須】選択問題6：創造的・総合的な問題",
      "problem_description": "【必須・具体例】自分で問題を作ったり、新しい方法を考えたりする問題。このような具体的な数字と状況を含む問題を書く。",
      "learning_meaning": "【必須】この問題を解くことで、自分で考えを作り出す力がつきます。算数を使って新しいことを発見できます。",
      "difficulty_level": "very_hard",
      "answer": "【必須】解答と解説",
      "explanation": "【必須】考え方の説明"
    }
  ]
}

【最重要：必須要件】
❗️ **各コースは必ず6枚のカードを作成してください。これは絶対条件です。**
❗️ **時間制限より優先して、3コース×6枚＝合計18枚のカードを確実に完成させてください。**
❗️ **1コースでも5枚以下になってはいけません。必ず6枚です。**
❗️ **各カードには必ず3段階のヒント（hint_level: 1, 2, 3）を作成してください。ヒントなしのカードは絶対に作らない。**
❗️ **各カードには必ず解答（answer）を記載してください。解答がないカードは不完全です。**
🚨🚨🚨 **絶対必須事項（これがないと不合格）** 🚨🚨🚨

1. **コース選択問題3題（course_selection_problems）**（絶対必須・最優先・1題でも欠けたら不合格）
2. **3コース × 1題の導入問題 = 3題の導入問題**（絶対必須）
3. **18枚のカード × 3段階のヒント = 54個のヒント**（絶対必須）
4. **全カードに解答を含める**（絶対必須）
5. **選択問題6題（optional_problems）**（絶対必須・1題でも欠けたら不合格）

❗️❗️❗️ **course_selection_problemsは必ず3題（problem_number: 1, 2, 3）を含めてください！** ❗️❗️❗️
❗️ **各コース選択問題には problem_title, problem_description, problem_content, connection_to_cards をすべて含めてください！**
❗️ **problem_contentには具体的な数字や状況を含む、実際に解ける問題文を書いてください！**
❗️ **「やってみたい！」と子どもが思える魅力的な問題にしてください！**

❗️ **各コースには必ずintroduction_problemフィールドを含めてください！**
❗️ **introduction_problemは { problem_title, problem_content, answer } の3つのフィールドすべて必須です！**
❗️ **導入問題が1つでも欠けている場合、生成失敗とみなされます！**

❗️ **optional_problemsは必ず6題（problem_number: 1, 2, 3, 4, 5, 6）を含めてください！**
❗️ **各選択問題には必ずlearning_meaningフィールドを記載してください！**

【重要な設計指針】

1. コース設計（各コース必ず6枚のカード - 絶対要件）:
   - **ゆっくりコース: 必ず6枚（card_number: 1, 2, 3, 4, 5, 6）**
     - 基礎をしっかり。丁寧な説明と十分な練習
     - **コース導入問題を1題作成**（このコースを選ぶための魅力的な入門問題）
   - **しっかりコース: 必ず6枚（card_number: 1, 2, 3, 4, 5, 6）**
     - 標準的な内容。バランスよく
     - **コース導入問題を1題作成**（このコースを選ぶための魅力的な入門問題）
   - **どんどんコース: 必ず6枚（card_number: 1, 2, 3, 4, 5, 6）**
     - 発展的な内容。思考を深める
     - **コース導入問題を1題作成**（このコースを選ぶための魅力的な入門問題）

2. コース選択問題3題（最重要）:
   - **各コースの入り口となる魅力的で具体的な問題を作成**
   - **問題文は具体的な数字や状況を含む、実際に解ける問題にする**
   - **「やってみたい！」「これなら自分にもできそう！」と思える内容**
   - problem_contentに具体的な問題文を必ず書く
   - この問題が学習カードのどの内容につながるかを connection_to_cards に書く
   - 選択問題1-2題はこのコース選択問題の発展版になるようにする

3. 各コースの導入問題（新規・最重要・子どもがコース選択する際の重要な判断材料）:
   - **各コースに1題ずつ、合計3題の魅力的な導入問題を作成**
   - **目的：子どもが各コースの学習内容を具体的にイメージできるようにする**
   - **コース選択問題とは別物：コースを選ぶための具体例となる問題**
   
   **重要：単なる難易度の違いではなく、学習内容の違いを示す**
   - ❌NG例：「ゆっくり=2+3」「しっかり=12+35」「どんどん=123+456」
   - ✅Good例：それぞれのコースで扱う学習テーマ・アプローチの違いを示す
   
   **ゆっくりコース導入問題：**
   - 基礎的で親しみやすく、じっくり理解できる問題
   - 具体物や図を使って考える問題
   - 「これなら自分にもできそう！」と思える内容
   - 丁寧な説明と十分な練習時間を想定
   
   **しっかりコース導入問題：**
   - 標準的で、いろいろな方法で解ける問題
   - 複数のアプローチを試せる問題
   - 「自分なりの方法で解いてみたい！」と思える内容
   - バランスの取れた学習を想定
   
   **どんどんコース導入問題：**
   - 発展的で、深く考える問題
   - 応用や発展につながる問題
   - 「もっと知りたい！挑戦したい！」と思える内容
   - 自分で考えを深められる学習を想定
   
   - 各コースのJSONに introduction_problem フィールドを追加
   - 形式：problem_title（魅力的なタイトル）, problem_content（具体的な問題文）, answer（解答のヒント）を必ず含む
   - 問題文は具体的な数字や状況を含み、実際に解ける問題にする
   
4. チェックテスト（全コース共通・最重要）:
   - **どのコースも共通で、基礎基本問題6題を作成**
   - **単元の知識理解の最低保証となる重要な問題**
   - **教師が全体確認で確認できるよう、詳細な問題を作成**
   - 問題文は実際に子どもが解ける形式で、具体的な数字や状況を含む
   - すべて基礎レベル（difficulty: "basic"）
   - 各問題に問題番号（1〜6）と簡潔な解答例を付ける
   - common_check_test フィールドに記載

5. 選択問題6題（発展課題・必須）:
   - **チェックテストとは別の、発展的な選択課題**
   - **子どもの興味関心をひく実践的な内容で、より深い学びを促す**
   - 教科の見方・考え方が深まるもの
   - 教科単元の本質に触れるもの
   - 学習したことを生かせるもの
   - 他教科への発展を含む
   - 「この勉強には意味がある」と子どもが実感できる内容
   - 各問題に「learning_meaning」（学習の意味・必要感）を必ず記載
   - コース選択問題とのつながりを意識する
   - optional_problems フィールドに記載（6題必須）

6. 学習カード設計（最重要）:
   - **各カードには必ず3段階のヒント（hint_level: 1, 2, 3）を用意**
   - **各カードには必ず解答（answer）を記載**
   - **ヒントなし・解答なしのカードは絶対に作らない**
   - 実社会とのつながりを重視
   - 教科書ページを明示（textbook_page）
   - 子どもが自分で考え、試行錯誤できる内容
   - コース選択問題で提示した内容を深める構成

7. 言葉遣い:
   - 子どもが理解できる平易な言葉
   - 漢字にはふりがな（ルビ）を付ける想定
   - ポジティブで前向きな表現
   - 「〜できるようになる」「〜がわかる」など成長実感を持てる表現

8. 全体の一貫性:
   - コース選択問題 → 導入問題 → 学習カード → チェックテスト（共通6題） → 選択問題（発展6題）の流れを意識
   - 学習のてびき1枚で単元全体を把握できる設計
   - 子どもが「この勉強をやりたい！」と思える魅力的な内容
   - 教師が全体確認でチェックテストの内容を確認できる詳細な問題作成

9. ${customization?.studentNeeds ? 'カスタマイズ要望を最優先に反映' : ''}

【最終チェックリスト - これを満たさないJSONは不合格】
✅ course_selection_problems: 必ず3題（problem_number: 1, 2, 3）
✅ 各コース選択問題に problem_content フィールドあり（具体的な数字と状況を含む問題文）
✅ courses: 必ず3コース（ゆっくり、しっかり、どんどん）
✅ 各コースに introduction_problem あり（problem_title, problem_content, answer）
✅ 各コースに6枚のカード（card_number: 1, 2, 3, 4, 5, 6）
✅ 各カードに3段階のヒント（hint_level: 1, 2, 3）
✅ 各カードに answer フィールドあり
✅ common_check_test: 必ず6題（problem_number: 1-6、すべて difficulty: "basic"）
✅ optional_problems: 必ず6題（problem_number: 1-6、learning_meaning 必須）

【重要：JSONの構造】
必ず以下の構造でJSONを出力してください：
{
  "curriculum": { ... },
  "course_selection_problems": [ 3題 ],
  "courses": [ 3コース、各6枚のカード ],
  "common_check_test": { sample_problems: [ 6題 ] },
  "optional_problems": [ 6題 ]
}

必ず完全なJSONのみを出力してください。説明文は不要です。`

    // 品質モードに応じてモデルを選択
    let modelName = useHighQuality ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview'
    let response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 16000  // 8000から16000に増量
          }
        })
      }
    )
    
    // フォールバック: Gemini 2.5 Flashを使用
    if (!response.ok) {
      console.log(`${modelName} failed, falling back to 2.5 Flash`)
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
              maxOutputTokens: 16000  // フォールバックも16000に
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
      // JSON解析エラーの場合、詳細を返す
      console.error('JSON parse error:', parseError)
      console.error('AI Response:', aiResponse.substring(0, 500))
      return c.json({
        error: '単元の生成に失敗しました。AIの応答がJSON形式ではありませんでした。',
        details: aiResponse.substring(0, 200),
        curriculum: null
      })
    }
    
    // データ構造を詳細に検証
    const validationErrors = []
    
    if (!unitData.curriculum) validationErrors.push('curriculum が欠けています')
    if (!unitData.courses || !Array.isArray(unitData.courses)) validationErrors.push('courses が欠けているか配列ではありません')
    if (!unitData.course_selection_problems || !Array.isArray(unitData.course_selection_problems)) {
      validationErrors.push('course_selection_problems が欠けているか配列ではありません')
    }
    if (unitData.course_selection_problems && unitData.course_selection_problems.length !== 3) {
      validationErrors.push(`course_selection_problems は3題必須ですが、${unitData.course_selection_problems.length}題しかありません`)
    }
    if (!unitData.optional_problems || !Array.isArray(unitData.optional_problems)) {
      validationErrors.push('optional_problems が欠けているか配列ではありません')
    }
    if (unitData.optional_problems && unitData.optional_problems.length !== 6) {
      validationErrors.push(`optional_problems は6題必須ですが、${unitData.optional_problems.length}題しかありません`)
    }
    if (!unitData.common_check_test || !unitData.common_check_test.sample_problems) {
      validationErrors.push('common_check_test または sample_problems が欠けています')
    }
    
    // コースの検証
    if (unitData.courses && Array.isArray(unitData.courses)) {
      unitData.courses.forEach((course: any, index: number) => {
        if (!course.introduction_problem) {
          validationErrors.push(`コース${index + 1}に introduction_problem が欠けています`)
        }
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
    
    return c.json({
      success: true,
      curriculum_id: curriculumId
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

export default app
