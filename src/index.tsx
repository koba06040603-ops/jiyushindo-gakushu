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

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyDxqCzEH5qSEeDexSH_hTd0J8VFrcNECko', {
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
        <script>
          // 動作確認用
          console.log('✅ ページ読み込み完了 - バックエンドAPI正常動作')
          console.log('📍 現在のURL:', window.location.href)
          console.log('🔗 axios読み込み:', typeof axios !== 'undefined' ? '成功' : '失敗')
        </script>
        <script src="/static/app.js"></script>
        <script>
          // app.js読み込み確認
          console.log('✅ app.js読み込み完了')
          console.log('📦 利用可能な関数:', {
            renderTopPage: typeof renderTopPage,
            showTopPage: typeof showTopPage
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
  
  // 環境変数またはハードコードされたAPIキーを使用
  const apiKey = env.GEMINI_API_KEY || 'AIzaSyDxqCzEH5qSEeDexSH_hTd0J8VFrcNECko'
  
  if (!apiKey) {
    console.error('❌ APIキーが設定されていません')
    return c.json({
      error: '単元生成機能は現在利用できません。APIキーが設定されていません。',
      curriculum: null
    })
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
    
    const prompt = `あなたは経験豊富な教育カリキュラムデザイナーです。
以下の情報に基づいて、学習指導要領に沿った単元を設計してください。

【基本情報】
- 学年: ${grade}
- 教科: ${subject}
- 教科書: ${textbook}
- 単元名: ${unitName}${customInfo}

以下のJSON形式で出力してください：

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
  "courses": [
    {
      "course_name": "ゆっくりコース",
      "course_label": "じっくり考えながら進むコース",
      "description": "ひとつひとつていねいに学びたい人におすすめ",
      "color_code": "green",
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
        // カード2〜6も同じ形式（全6枚必須）
      ]
    },
    // 他2コース（しっかり・どんどん）も同じ形式
  ]
}

【重要な要件】
- 各コースは6枚のカード（必須）
- 全カードにanswerフィールド（必須）
- 全カードにhints配列3つ（必須）
- JSONコードブロックなし、完全なJSONのみを出力

必ず完全なJSONのみを出力してください。`
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
    
    console.log('📝 AIレスポンス（最初の300文字）:', aiResponse.substring(0, 300))
    
    // JSONを抽出（複数パターン対応）
    let jsonStr
    const jsonCodeBlock = aiResponse.match(/```json\s*([\s\S]*?)\s*```/)
    const jsonObject = aiResponse.match(/\{[\s\S]*\}/)
    
    if (jsonCodeBlock) {
      jsonStr = jsonCodeBlock[1]
      console.log('✅ JSONコードブロックを検出')
    } else if (jsonObject) {
      jsonStr = jsonObject[0]
      console.log('✅ JSON オブジェクトを検出')
    } else {
      console.error('❌ JSONが見つかりません')
      console.error('   AIレスポンス全文:', aiResponse)
      return c.json({
        error: '単元の生成に失敗しました。AIの応答からJSONを抽出できませんでした。',
        details: aiResponse.substring(0, 300),
        curriculum: null
      })
    }
    
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
  const apiKey = 'AIzaSyDxqCzEH5qSEeDexSH_hTd0J8VFrcNECko'
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
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
  const apiKey = 'AIzaSyDxqCzEH5qSEeDexSH_hTd0J8VFrcNECko'
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
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
      const checkTestJSON = JSON.stringify(problems.common_check_test)
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
            curriculum_id, problem_number, problem_title, problem_content,
            difficulty_level, learning_meaning
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          curriculumId,
          problem.problem_number,
          problem.problem_title,
          problem.problem_description,
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
  const apiKey = 'AIzaSyDxqCzEH5qSEeDexSH_hTd0J8VFrcNECko'
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
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
  const apiKey = 'AIzaSyDxqCzEH5qSEeDexSH_hTd0J8VFrcNECko'
  
  if (!apiKey) {
    return c.json({ error: 'API key not configured' }, 500)
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
            curriculum_id, problem_number, problem_title, problem_content,
            difficulty_level, learning_meaning
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          curriculumId,
          problem.problem_number,
          problem.problem_title,
          problem.problem_description,
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

export default app
