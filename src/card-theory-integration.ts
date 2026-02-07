/**
 * Phase 16-1: 学習カードへの12理論統合
 * 
 * 目的：学習カードに12理論（F1-F12）を統合し、個別最適化された学習体験を提供
 * 
 * 主要機能：
 * 1. 学習カード取得時に生徒の12理論プロファイルを統合
 * 2. 理論ベースのカード推薦
 * 3. カードごとの理論適合度評価
 * 4. AI個別最適化ログの記録
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * GET /api/cards/:cardId/with-theory/:studentId
 * 学習カードを12理論プロファイルと統合して取得
 */
app.get('/api/cards/:cardId/with-theory/:studentId', async (c) => {
  const { DB } = c.env;
  const cardId = c.req.param('cardId');
  const studentId = c.req.param('studentId');

  try {
    // 1. 学習カード基本情報取得
    const card = await DB.prepare(`
      SELECT * FROM cards WHERE id = ?
    `).bind(cardId).first();

    if (!card) {
      return c.json({ success: false, error: 'カードが見つかりません' }, 404);
    }

    // 2. 生徒の12理論プロファイル取得
    const profile = await DB.prepare(`
      SELECT * FROM student_theory_profiles WHERE student_id = ? ORDER BY created_at DESC LIMIT 1
    `).bind(studentId).first();

    if (!profile) {
      // プロファイルがない場合は基本カード情報のみ返す
      return c.json({
        success: true,
        card,
        theory_profile: null,
        theory_alignment: null,
        recommendations: []
      });
    }

    // 3. カード×理論の対応情報取得
    const alignments = await DB.prepare(`
      SELECT * FROM card_theory_alignment WHERE card_id = ?
    `).bind(cardId).all();

    // 4. 生徒プロファイルとカード対応を照合して適合度スコア算出
    const theoryScores = JSON.parse(profile.theory_scores as string);
    const matchScores: Record<string, number> = {};
    let totalMatchScore = 0;
    let primaryTheories: string[] = [];

    if (alignments.results && alignments.results.length > 0) {
      alignments.results.forEach((alignment: any) => {
        const theoryCode = alignment.theory_code;
        const studentScore = theoryScores[theoryCode] || 0;
        const alignmentStrength = alignment.alignment_strength;

        // 適合度スコア計算（primary=1.0, secondary=0.7, supportive=0.4）
        let weight = 0.4;
        if (alignmentStrength === 'primary') {
          weight = 1.0;
          primaryTheories.push(theoryCode);
        } else if (alignmentStrength === 'secondary') {
          weight = 0.7;
        }

        const matchScore = studentScore * weight;
        matchScores[theoryCode] = matchScore;
        totalMatchScore += matchScore;
      });
    }

    // 5. 個別最適化推薦生成
    const recommendations = generateRecommendations(theoryScores, alignments.results, card);

    // 6. AI個別最適化ログ記録
    await DB.prepare(`
      INSERT INTO ai_personalization_log 
      (student_id, action_type, input_theories, theory_scores, recommendation, ai_rationale)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      studentId,
      'card_retrieval',
      JSON.stringify(primaryTheories),
      JSON.stringify(matchScores),
      JSON.stringify(recommendations),
      `学習カード取得時の12理論プロファイル統合。総合適合度: ${(totalMatchScore / (primaryTheories.length || 1)).toFixed(2)}`
    ).run();

    return c.json({
      success: true,
      card,
      theory_profile: {
        ...profile,
        theory_scores: theoryScores
      },
      theory_alignment: {
        total_match_score: totalMatchScore,
        average_match_score: primaryTheories.length > 0 ? totalMatchScore / primaryTheories.length : 0,
        match_scores: matchScores,
        primary_theories: primaryTheories,
        alignments: alignments.results
      },
      recommendations
    });

  } catch (error: any) {
    console.error('❌ 12理論統合カード取得エラー:', error);
    return c.json({ success: false, error: '12理論統合カード取得に失敗しました' }, 500);
  }
});

/**
 * POST /api/cards/:cardId/theory-alignment
 * 学習カードと理論の対応関係を登録・更新
 */
app.post('/api/cards/:cardId/theory-alignment', async (c) => {
  const { DB } = c.env;
  const cardId = c.req.param('cardId');
  const { theory_code, alignment_strength, design_rationale, expected_effect } = await c.req.json();

  try {
    // 既存の対応関係を削除してから挿入（UPSERT相当）
    await DB.prepare(`
      DELETE FROM card_theory_alignment WHERE card_id = ? AND theory_code = ?
    `).bind(cardId, theory_code).run();

    await DB.prepare(`
      INSERT INTO card_theory_alignment (card_id, theory_code, alignment_strength, design_rationale, expected_effect)
      VALUES (?, ?, ?, ?, ?)
    `).bind(cardId, theory_code, alignment_strength, design_rationale, expected_effect).run();

    return c.json({
      success: true,
      message: '理論対応関係を登録しました',
      alignment: {
        card_id: cardId,
        theory_code,
        alignment_strength,
        design_rationale,
        expected_effect
      }
    });

  } catch (error: any) {
    console.error('❌ 理論対応関係登録エラー:', error);
    return c.json({ success: false, error: '理論対応関係の登録に失敗しました' }, 500);
  }
});

/**
 * GET /api/cards/recommended/:studentId
 * 生徒の12理論プロファイルに基づくカード推薦
 */
app.get('/api/cards/recommended/:studentId', async (c) => {
  const { DB } = c.env;
  const studentId = c.req.param('studentId');
  const limit = Number(c.req.query('limit')) || 10;
  const courseId = c.req.query('courseId');

  try {
    // 1. 生徒の12理論プロファイル取得
    const profile = await DB.prepare(`
      SELECT * FROM student_theory_profiles WHERE student_id = ? ORDER BY created_at DESC LIMIT 1
    `).bind(studentId).first();

    if (!profile) {
      return c.json({
        success: true,
        cards: [],
        message: '12理論プロファイルが未作成です。適性診断を受けてください。'
      });
    }

    const theoryScores = JSON.parse(profile.theory_scores as string);

    // 2. 上位3つの強い理論を特定
    const topTheories = Object.entries(theoryScores)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([code]) => code);

    // 3. これらの理論に対応するカードを取得
    let query = `
      SELECT DISTINCT
        c.*,
        cta.theory_code,
        cta.alignment_strength,
        cta.expected_effect
      FROM cards c
      INNER JOIN card_theory_alignment cta ON c.id = cta.card_id
      WHERE cta.theory_code IN (?, ?, ?)
        AND cta.alignment_strength IN ('primary', 'secondary')
    `;
    
    const params: any[] = [...topTheories];
    
    if (courseId) {
      query += ` AND c.course_id = ?`;
      params.push(courseId);
    }

    query += ` ORDER BY 
      CASE cta.alignment_strength 
        WHEN 'primary' THEN 1
        WHEN 'secondary' THEN 2
        ELSE 3
      END,
      c.created_at DESC
      LIMIT ?
    `;
    params.push(limit);

    const cards = await DB.prepare(query).bind(...params).all();

    // 4. 各カードの適合度スコアを計算
    const enrichedCards = cards.results?.map((card: any) => {
      const studentScore = theoryScores[card.theory_code] || 0;
      const weight = card.alignment_strength === 'primary' ? 1.0 : 0.7;
      const matchScore = studentScore * weight;

      return {
        ...card,
        match_score: matchScore,
        recommendation_reason: generateCardRecommendationReason(card.theory_code, studentScore, card.expected_effect)
      };
    }) || [];

    // 5. 適合度スコアでソート
    enrichedCards.sort((a, b) => b.match_score - a.match_score);

    return c.json({
      success: true,
      cards: enrichedCards,
      student_theory_profile: {
        top_theories: topTheories,
        theory_scores: theoryScores
      },
      recommendation_summary: `あなたの強みは ${topTheories.join('、')} です。これらに最適化されたカードを推薦します。`
    });

  } catch (error: any) {
    console.error('❌ 12理論ベースカード推薦エラー:', error);
    return c.json({ success: false, error: 'カード推薦に失敗しました' }, 500);
  }
});

/**
 * GET /api/cards/:cardId/theory-stats
 * カードの理論適用統計（どの理論がどれだけ効果的だったか）
 */
app.get('/api/cards/:cardId/theory-stats', async (c) => {
  const { DB } = c.env;
  const cardId = c.req.param('cardId');

  try {
    // 1. カードの理論対応情報
    const alignments = await DB.prepare(`
      SELECT * FROM card_theory_alignment WHERE card_id = ?
    `).bind(cardId).all();

    // 2. このカードでの学習ログから効果測定
    const stats = await DB.prepare(`
      SELECT 
        cta.theory_code,
        COUNT(DISTINCT pl.student_id) as student_count,
        AVG(CASE WHEN pl.is_correct = 1 THEN 1.0 ELSE 0.0 END) as avg_correctness,
        AVG(pl.time_spent) as avg_time_spent,
        SUM(pl.is_correct) as correct_count,
        COUNT(*) as total_attempts
      FROM card_theory_alignment cta
      LEFT JOIN progress_logs pl ON pl.card_id = cta.card_id
      WHERE cta.card_id = ?
      GROUP BY cta.theory_code
    `).bind(cardId).all();

    return c.json({
      success: true,
      card_id: cardId,
      theory_alignments: alignments.results,
      theory_stats: stats.results,
      summary: {
        total_theories: alignments.results?.length || 0,
        total_students: stats.results?.[0]?.student_count || 0,
        overall_correctness: stats.results?.length > 0 
          ? stats.results.reduce((sum: number, s: any) => sum + (s.avg_correctness || 0), 0) / stats.results.length
          : 0
      }
    });

  } catch (error: any) {
    console.error('❌ カード理論統計取得エラー:', error);
    return c.json({ success: false, error: 'カード理論統計の取得に失敗しました' }, 500);
  }
});

// ============================
// ヘルパー関数
// ============================

/**
 * 個別最適化推薦を生成
 */
function generateRecommendations(theoryScores: Record<string, number>, alignments: any[], card: any): string[] {
  const recommendations: string[] = [];

  // F1: 戦略的学習様式理論
  if (theoryScores['F1'] > 0.7) {
    const learningStyle = determineLearningStyle(theoryScores);
    recommendations.push(`あなたの学習様式（${learningStyle}）に最適化: このカードは${learningStyle}学習者向けに設計されています。`);
  }

  // F5: 統合的自己調整学習理論
  if (theoryScores['F5'] > 0.7) {
    recommendations.push(`自己調整学習を活用: このカードを学ぶ前に「目標」を設定し、学んだ後に「振り返り」を行いましょう。`);
  }

  // F6: エビデンスベースド学習方略体系
  if (theoryScores['F6'] > 0.7) {
    recommendations.push(`効果的な学習方略: 分散学習（何日かに分けて復習）、検索練習（テストで思い出す）を活用しましょう。`);
  }

  // F8: ウェルビーイング統合動機づけ理論
  if (theoryScores['F8'] > 0.6) {
    recommendations.push(`動機づけサポート: このカードで「なぜ学ぶのか」を考え、自分の成長を実感しましょう。`);
  }

  // カードの主要理論に基づく推薦
  if (alignments && alignments.length > 0) {
    const primaryAlignment = alignments.find((a: any) => a.alignment_strength === 'primary');
    if (primaryAlignment && primaryAlignment.expected_effect) {
      recommendations.push(`期待される効果: ${primaryAlignment.expected_effect}`);
    }
  }

  return recommendations;
}

/**
 * 学習様式を判定（F1理論）
 */
function determineLearningStyle(theoryScores: Record<string, number>): string {
  // 簡易判定（実際にはより詳細なロジックが必要）
  const f1Score = theoryScores['F1'] || 0;
  if (f1Score > 0.8) return '視覚';
  if (f1Score > 0.6) return '聴覚';
  if (f1Score > 0.4) return '読み書き';
  return '体験';
}

/**
 * カード推薦理由を生成
 */
function generateCardRecommendationReason(theoryCode: string, studentScore: number, expectedEffect: string): string {
  const theoryNames: Record<string, string> = {
    'F1': '戦略的学習様式理論',
    'F2': '統合的能力発達理論',
    'F3': '深化的経験学習理論',
    'F4': 'データ駆動型適応指導理論',
    'F5': '統合的自己調整学習理論',
    'F6': 'エビデンスベースド学習方略体系',
    'F7': '動的足場かけ理論',
    'F8': 'ウェルビーイング統合動機づけ理論',
    'F9': '21世紀型コンピテンシー理論',
    'F10': '領域固有認知発達理論',
    'F11': '真正学習・実践参加理論',
    'F12': '神経情動統合学習理論'
  };

  const theoryName = theoryNames[theoryCode] || theoryCode;
  const scorePercent = Math.round(studentScore * 100);

  return `あなたの ${theoryName} スコア（${scorePercent}%）に基づく推薦。${expectedEffect || '最適な学習効果が期待できます。'}`;
}

export default app;
