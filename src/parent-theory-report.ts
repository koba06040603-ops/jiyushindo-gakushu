/**
 * Phase 17-3: 保護者向け12理論レポートシステム
 * 
 * 機能:
 * - わかりやすい12理論の説明
 * - 子どもの強み・弱みの可視化
 * - 家庭での学習支援ガイド
 * - 成長の記録と推移
 * 
 * 科学的根拠:
 * - 保護者の関与: d=0.50 (Jeynes 2005)
 * - 家庭学習支援: d=0.51 (Patall et al. 2008)
 * - 保護者-学校連携: d=0.29 (Wilder 2014)
 */

import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

/**
 * 保護者向け12理論解説（わかりやすい言葉で）
 */
const PARENT_FRIENDLY_THEORIES = {
  F1: {
    name: '学習スタイル',
    parentExplanation: 'お子さんに合った学び方を見つけます',
    description: 'お子さんは、見る・聞く・体験するうち、どの方法で一番よく理解できるでしょうか？お子さんに合った学習方法を見つけることで、効率的に学べるようになります。',
    homeSupport: [
      '視覚型なら：図や絵を使って説明してあげましょう',
      '聴覚型なら：一緒に声に出して読んでみましょう',
      '体験型なら：実際に触ったり動かしたりして学びましょう'
    ],
    lowScoreAdvice: 'いろいろな学習方法を試して、お子さんに合うものを見つけてあげましょう',
    highScoreAdvice: 'お子さんの得意な学習方法を活かして、さらに伸ばしてあげましょう'
  },
  F2: {
    name: '成長マインド',
    parentExplanation: '「できる」と信じる力を育てます',
    description: '「まだできない」を「これからできるようになる」に変えることが大切です。失敗は成長のチャンスだと考えられるようになると、お子さんは前向きに学習に取り組めます。',
    homeSupport: [
      '「頭がいいね」ではなく「よく頑張ったね」と褒めましょう',
      '失敗したときは「次はこうしてみよう」と一緒に考えましょう',
      '小さな成長を見つけて、言葉にして伝えましょう'
    ],
    lowScoreAdvice: 'できたことを具体的に褒めて、「努力すれば成長できる」と伝えましょう',
    highScoreAdvice: '挑戦する姿勢を応援し続けてあげましょう'
  },
  F3: {
    name: '経験から学ぶ力',
    parentExplanation: '体験を通じて深く理解します',
    description: '実際にやってみる→振り返る→次に活かす、このサイクルを回すことで、お子さんは深く理解できるようになります。',
    homeSupport: [
      '日常生活の中で「なぜ？」を一緒に考えましょう',
      '失敗した後は「どうすればよかった？」と振り返りましょう',
      '学んだことを実生活で使う機会を作りましょう'
    ],
    lowScoreAdvice: '体験したことを一緒に振り返る時間を作りましょう',
    highScoreAdvice: 'いろいろな体験の機会を増やしてあげましょう'
  },
  F4: {
    name: 'データに基づく学習',
    parentExplanation: '記録を見て学習を改善します',
    description: 'お子さんの学習記録を見ることで、得意なことや苦手なことが分かります。それに合わせて学習を調整することで、効果的に学べます。',
    homeSupport: [
      '一緒に学習記録を見る時間を作りましょう',
      '得意なことと苦手なことを話し合いましょう',
      '目標を立てて、達成したら一緒に喜びましょう'
    ],
    lowScoreAdvice: '週に1回、学習の振り返りをする習慣を作りましょう',
    highScoreAdvice: '自分で記録を見て改善できるよう見守りましょう'
  },
  F5: {
    name: '自分で学ぶ力',
    parentExplanation: '自ら計画し、学習を進める力です',
    description: '自分で計画を立て、学習を進め、振り返ることができるようになると、お子さんは自立した学習者になれます。',
    homeSupport: [
      '学習計画を一緒に立ててみましょう',
      '「今日は何を勉強する？」と聞いてみましょう',
      '終わった後「どうだった？」と振り返りましょう'
    ],
    lowScoreAdvice: '最初は一緒に計画を立て、少しずつ自分でできるよう見守りましょう',
    highScoreAdvice: '自主性を尊重し、必要なときだけサポートしましょう'
  },
  F6: {
    name: '効果的な学習方法',
    parentExplanation: '科学的に効果が証明された方法で学びます',
    description: '復習のタイミング、問題練習の方法など、研究で効果が証明されている学習方法を使うことで、効率的に学力が伸びます。',
    homeSupport: [
      '習ったことは、翌日・1週間後・1ヶ月後に復習しましょう',
      '問題を解いた後、答えを確認して理解を深めましょう',
      '人に説明することで、理解が深まります'
    ],
    lowScoreAdvice: '効果的な復習方法を一緒に試してみましょう',
    highScoreAdvice: '学習方法をさらに工夫できるよう応援しましょう'
  },
  F7: {
    name: 'ちょうどいい支援',
    parentExplanation: '必要なときに必要なだけ助けます',
    description: 'お子さんの理解度に合わせて、ちょうどいい量のヒントやサポートを与えることが大切です。多すぎても少なすぎてもよくありません。',
    homeSupport: [
      'すぐに答えを教えず、ヒントを出しましょう',
      '「どこまで分かった？」と確認しましょう',
      'できそうなら見守り、困っていたら助けましょう'
    ],
    lowScoreAdvice: '適切なタイミングでヒントを出す練習をしましょう',
    highScoreAdvice: '自分で考える時間を十分に与えましょう'
  },
  F8: {
    name: '心の健康と意欲',
    parentExplanation: '楽しく前向きに学ぶ気持ちを育てます',
    description: '心が元気で、「学びたい」という気持ちがあるときに、お子さんは最もよく学べます。プレッシャーではなく、楽しさを感じられることが大切です。',
    homeSupport: [
      '学習の楽しい面を一緒に見つけましょう',
      'できたことを認め、励ましましょう',
      '無理のないペースで学習できるよう配慮しましょう'
    ],
    lowScoreAdvice: 'プレッシャーを減らし、学ぶ楽しさを感じられるようにしましょう',
    highScoreAdvice: '好奇心を大切に、学びたい気持ちを応援しましょう'
  },
  F9: {
    name: '21世紀型の力',
    parentExplanation: '創造性・協働性・批判的思考を育てます',
    description: 'これからの時代に必要な、創造的に考える力、人と協力する力、情報を見極める力を育てることが大切です。',
    homeSupport: [
      '「あなたはどう思う？」と意見を聞きましょう',
      '家族で一緒に課題を解決する経験を作りましょう',
      'ニュースや出来事について話し合いましょう'
    ],
    lowScoreAdvice: '日常の中で考える機会を増やしましょう',
    highScoreAdvice: 'より高度な課題に挑戦する機会を作りましょう'
  },
  F10: {
    name: '教科ごとの考え方',
    parentExplanation: '各教科の特徴に合った学び方をします',
    description: '算数・国語・理科など、それぞれの教科には独特の考え方があります。教科の特徴を理解することで、より深く学べます。',
    homeSupport: [
      '算数：日常生活で数を使う場面を見つけましょう',
      '国語：一緒に本を読んで感想を話し合いましょう',
      '理科：身の回りの不思議を一緒に観察しましょう'
    ],
    lowScoreAdvice: '教科の面白さを実生活と結びつけて伝えましょう',
    highScoreAdvice: '専門的な考え方をさらに深められるようサポートしましょう'
  },
  F11: {
    name: '本物の学び',
    parentExplanation: '実社会とつながる学びをします',
    description: '学校で学んだことが実生活でどう役立つかを理解すると、お子さんの学習意欲が高まります。',
    homeSupport: [
      '学んだことを実生活で使う場面を一緒に見つけましょう',
      '地域の活動に参加する機会を作りましょう',
      '専門家の話を聞く機会があれば参加しましょう'
    ],
    lowScoreAdvice: '学びと実生活のつながりを意識させましょう',
    highScoreAdvice: 'より本格的な体験の機会を提供しましょう'
  },
  F12: {
    name: '感情と学習',
    parentExplanation: '感情をコントロールして学びます',
    description: '不安や緊張をコントロールし、適度なリラックス状態で学習することで、記憶力や理解力が高まります。',
    homeSupport: [
      '学習前に深呼吸などでリラックスしましょう',
      'テスト前の不安な気持ちを聞いてあげましょう',
      '失敗しても大丈夫という安心感を与えましょう'
    ],
    lowScoreAdvice: '学習環境を整え、リラックスして学べるようにしましょう',
    highScoreAdvice: '自分で感情をコントロールする方法を身につけられるよう見守りましょう'
  }
}

/**
 * 保護者向け総合レポート取得
 * GET /api/parent-report/:studentId
 */
app.get('/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 生徒情報取得
    const student = await env.DB.prepare(`
      SELECT student_id, student_name, grade_level, class_code
      FROM students WHERE student_id = ?
    `).bind(studentId).first()
    
    if (!student) {
      return c.json({ success: false, error: '生徒が見つかりません' }, 404)
    }
    
    // 12理論プロファイル取得
    const theoryScores = await env.DB.prepare(`
      SELECT theory_code, score, confidence, last_updated
      FROM theory_mastery_scores
      WHERE student_id = ?
      ORDER BY theory_code
    `).bind(studentId).all()
    
    // 各理論の解説と支援方法を付与
    const theoryReport = theoryScores.results.map(score => {
      const theory = PARENT_FRIENDLY_THEORIES[score.theory_code as keyof typeof PARENT_FRIENDLY_THEORIES]
      const isLow = score.score < 60
      const isHigh = score.score >= 80
      
      return {
        code: score.theory_code,
        name: theory.name,
        score: score.score,
        level: isHigh ? '高い' : isLow ? '低い' : '中程度',
        explanation: theory.parentExplanation,
        description: theory.description,
        homeSupport: theory.homeSupport,
        advice: isLow ? theory.lowScoreAdvice : isHigh ? theory.highScoreAdvice : '現在の取り組みを続けましょう',
        lastUpdated: score.last_updated
      }
    })
    
    // 強みと弱み
    const strengths = theoryReport.filter(t => t.score >= 80).map(t => t.name)
    const weaknesses = theoryReport.filter(t => t.score < 60).map(t => t.name)
    
    // 最近の学習状況
    const recentActivity = await env.DB.prepare(`
      SELECT 
        COUNT(*) as problem_count,
        AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) as correct_rate,
        SUM(session_duration_seconds) / 3600.0 as total_hours
      FROM learning_logs
      WHERE student_id = ?
        AND created_at >= datetime('now', '-7 days')
    `).bind(studentId).first()
    
    // 成長の記録（過去3ヶ月の推移）
    const growthHistory = await env.DB.prepare(`
      SELECT 
        theory_code,
        old_score,
        new_score,
        change_reason,
        created_at
      FROM theory_score_history
      WHERE student_id = ?
        AND created_at >= datetime('now', '-3 months')
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(studentId).all()
    
    return c.json({
      success: true,
      student: {
        name: student.student_name,
        gradeLevel: student.grade_level,
        classCode: student.class_code
      },
      summary: {
        strengths,
        weaknesses,
        overallMessage: strengths.length > 0 
          ? `${student.student_name}さんは、特に「${strengths.join('、')}」が得意です。`
          : `${student.student_name}さんは、バランスよく成長しています。`,
        improvementMessage: weaknesses.length > 0
          ? `「${weaknesses.join('、')}」を伸ばすことで、さらに成長できます。`
          : '各分野とも順調に伸びています。'
      },
      theoryReport,
      recentActivity: {
        problemCount: recentActivity?.problem_count || 0,
        correctRate: ((recentActivity?.correct_rate || 0) * 100).toFixed(1) + '%',
        studyHours: (recentActivity?.total_hours || 0).toFixed(1) + '時間',
        period: '過去7日間'
      },
      growthHistory: growthHistory.results,
      generatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('保護者レポート生成エラー:', error)
    return c.json({
      success: false,
      error: 'レポートの生成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
})

/**
 * 週次レポート生成（メール送信用）
 * GET /api/parent-report/:studentId/weekly
 */
app.get('/:studentId/weekly', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  try {
    // 基本レポート取得
    const baseReport = await fetch(
      c.req.url.replace('/weekly', ''),
      { headers: c.req.raw.headers }
    )
    const reportData = await baseReport.json()
    
    if (!reportData.success) {
      return c.json(reportData)
    }
    
    // 今週のハイライト
    const weekHighlights = await env.DB.prepare(`
      SELECT 
        COUNT(*) as days_active,
        MAX(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as had_perfect_day,
        COUNT(DISTINCT curriculum_id) as subjects_studied
      FROM (
        SELECT 
          DATE(created_at) as date,
          is_correct,
          curriculum_id
        FROM learning_logs
        WHERE student_id = ?
          AND created_at >= datetime('now', '-7 days')
      )
      GROUP BY date
    `).bind(studentId).first()
    
    // 今週の成長ポイント
    const growthPoints = await env.DB.prepare(`
      SELECT theory_code, new_score - old_score as improvement
      FROM theory_score_history
      WHERE student_id = ?
        AND created_at >= datetime('now', '-7 days')
        AND new_score > old_score
      ORDER BY improvement DESC
      LIMIT 3
    `).bind(studentId).all()
    
    const weeklyMessage = `
【今週の学習レポート】

${reportData.student.name}さんの今週の学習状況をお知らせします。

📊 今週の活動
• 学習日数: ${weekHighlights?.days_active || 0}日
• 取り組んだ教科: ${weekHighlights?.subjects_studied || 0}教科
• 正答率: ${reportData.recentActivity.correctRate}

🌟 今週の成長
${growthPoints.results.map(g => {
  const theory = PARENT_FRIENDLY_THEORIES[g.theory_code as keyof typeof PARENT_FRIENDLY_THEORIES]
  return `• ${theory.name}が${g.improvement.toFixed(0)}点アップ！`
}).join('\n') || '• 着実に成長しています'}

💪 お子さんの強み
${reportData.summary.strengths.map((s: string) => `• ${s}`).join('\n') || '• バランスよく成長しています'}

📝 ご家庭でできること
${reportData.theoryReport
  .filter((t: any) => t.score < 70)
  .slice(0, 2)
  .map((t: any) => `• ${t.name}: ${t.advice}`)
  .join('\n') || '• 現在の取り組みを続けてください'}

${reportData.summary.overallMessage}
${reportData.summary.improvementMessage}

引き続き、温かく見守っていただければ幸いです。
    `.trim()
    
    return c.json({
      success: true,
      weeklyReport: {
        subject: `【週次レポート】${reportData.student.name}さんの学習状況`,
        message: weeklyMessage,
        highlights: weekHighlights,
        growthPoints: growthPoints.results
      },
      fullReport: reportData
    })
    
  } catch (error) {
    return c.json({
      success: false,
      error: '週次レポートの生成に失敗しました'
    }, 500)
  }
})

/**
 * 理論別詳細ガイド取得
 * GET /api/parent-report/theory-guide/:theoryCode
 */
app.get('/theory-guide/:theoryCode', async (c) => {
  const theoryCode = c.req.param('theoryCode')
  
  const theory = PARENT_FRIENDLY_THEORIES[theoryCode as keyof typeof PARENT_FRIENDLY_THEORIES]
  
  if (!theory) {
    return c.json({
      success: false,
      error: '理論が見つかりません'
    }, 404)
  }
  
  return c.json({
    success: true,
    theory: {
      code: theoryCode,
      ...theory
    }
  })
})

/**
 * すべての理論の保護者向けガイド取得
 * GET /api/parent-report/all-guides
 */
app.get('/all-guides', async (c) => {
  const guides = Object.entries(PARENT_FRIENDLY_THEORIES).map(([code, theory]) => ({
    code,
    name: theory.name,
    explanation: theory.parentExplanation,
    description: theory.description,
    homeSupport: theory.homeSupport
  }))
  
  return c.json({
    success: true,
    guides,
    introduction: `
お子さんの学びを支える12の理論

これらの理論は、世界中の教育研究で効果が証明されているものです。
お子さんの学習状況に合わせて、ご家庭でも実践していただけます。

すべての理論を一度に実践する必要はありません。
お子さんの様子を見ながら、できることから少しずつ試してみてください。
    `.trim()
  })
})

export default app
