/**
 * Phase 16-2: AI問題生成のレベル5対応拡張
 * 
 * 目的：AI問題生成に12理論（F1-F12）を統合し、個別最適化された問題を生成
 * 
 * 主要機能：
 * 1. 生徒の12理論プロファイルに基づく問題生成プロンプト最適化
 * 2. 学習様式（F1）に応じた問題形式の選択
 * 3. 自己調整学習（F5）を促す振り返り問題の追加
 * 4. 効果的な学習方略（F6）を組み込んだ問題設計
 */

import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  AI: any;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/problems/generate-with-theory
 * 12理論プロファイルに基づくAI問題生成
 */
app.post('/api/problems/generate-with-theory', async (c) => {
  const { DB, AI } = c.env;
  const { student_id, subject, unit_name, difficulty, count, card_id } = await c.req.json();

  try {
    // 1. 生徒の12理論プロファイル取得
    const profile = await DB.prepare(`
      SELECT * FROM student_theory_profiles WHERE student_id = ? ORDER BY created_at DESC LIMIT 1
    `).bind(student_id).first();

    if (!profile) {
      return c.json({
        success: false,
        error: '12理論プロファイルが未作成です。適性診断を受けてください。'
      }, 400);
    }

    const theoryScores = JSON.parse(profile.theory_scores as string);

    // 2. プロファイルに基づくプロンプト生成
    const prompt = generateTheoryBasedPrompt(theoryScores, subject, unit_name, difficulty, count);

    // 3. AI問題生成
    const aiResponse = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 2048,
      temperature: 0.7
    });

    // 4. AI応答の解析
    const problems = parseAIProblemsResponse(aiResponse.response);

    if (!problems || problems.length === 0) {
      return c.json({
        success: false,
        error: '問題生成に失敗しました。もう一度お試しください。'
      }, 500);
    }

    // 5. 問題をDBに保存（12理論情報付き）
    const savedProblems = [];
    for (const problem of problems) {
      const result = await DB.prepare(`
        INSERT INTO generated_problems 
        (student_id, question, correct_answer, explanation, difficulty, subject, unit_name, 
         problem_type, hints, theory_aligned, theory_codes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        student_id,
        problem.question,
        problem.correct_answer,
        problem.explanation,
        difficulty || 'medium',
        subject,
        unit_name,
        problem.problem_type,
        JSON.stringify(problem.hints || []),
        1, // theory_aligned = true
        JSON.stringify(Object.keys(theoryScores).filter(k => theoryScores[k] > 0.6))
      ).run();

      savedProblems.push({
        ...problem,
        problem_id: result.meta.last_row_id,
        theory_alignment: {
          learning_style: determineLearningStyle(theoryScores),
          self_regulation: theoryScores['F5'] || 0,
          motivation: theoryScores['F8'] || 0
        }
      });
    }

    // 6. AI個別最適化ログ記録
    await DB.prepare(`
      INSERT INTO ai_personalization_log 
      (student_id, action_type, input_theories, theory_scores, recommendation, ai_rationale)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      student_id,
      'problem_generation',
      JSON.stringify(Object.keys(theoryScores).filter(k => theoryScores[k] > 0.6)),
      JSON.stringify(theoryScores),
      JSON.stringify({ generated_count: savedProblems.length }),
      `12理論プロファイルに基づく問題生成。学習様式: ${determineLearningStyle(theoryScores)}`
    ).run();

    return c.json({
      success: true,
      problems: savedProblems,
      count: savedProblems.length,
      theory_profile: {
        learning_style: determineLearningStyle(theoryScores),
        top_theories: Object.entries(theoryScores)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 3)
          .map(([code]) => code)
      }
    });

  } catch (error: any) {
    console.error('❌ 12理論ベース問題生成エラー:', error);
    return c.json({
      success: false,
      error: '問題生成に失敗しました',
      details: error.message
    }, 500);
  }
});

/**
 * POST /api/problems/adaptive-hint
 * 12理論プロファイルに基づく適応的ヒント生成
 */
app.post('/api/problems/adaptive-hint', async (c) => {
  const { DB, AI } = c.env;
  const { student_id, problem_id, current_answer } = await c.req.json();

  try {
    // 1. 生徒の12理論プロファイル取得
    const profile = await DB.prepare(`
      SELECT * FROM student_theory_profiles WHERE student_id = ? ORDER BY created_at DESC LIMIT 1
    `).bind(student_id).first();

    // 2. 問題情報取得
    const problem = await DB.prepare(`
      SELECT * FROM generated_problems WHERE problem_id = ?
    `).bind(problem_id).first();

    if (!problem) {
      return c.json({ success: false, error: '問題が見つかりません' }, 404);
    }

    const theoryScores = profile ? JSON.parse(profile.theory_scores as string) : {};

    // 3. 理論に基づくヒントプロンプト生成
    const hintPrompt = generateAdaptiveHintPrompt(
      theoryScores,
      problem,
      current_answer
    );

    // 4. AIヒント生成
    const aiResponse = await AI.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt: hintPrompt,
      max_tokens: 512,
      temperature: 0.7
    });

    const hint = aiResponse.response.trim();

    // 5. ヒント使用ログ記録
    await DB.prepare(`
      INSERT INTO ai_personalization_log 
      (student_id, action_type, input_theories, theory_scores, recommendation, ai_rationale)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      student_id,
      'hint_generation',
      JSON.stringify(['F1', 'F5', 'F7']), // 学習様式、自己調整、足場かけ
      JSON.stringify(theoryScores),
      hint,
      `問題ID ${problem_id} の適応的ヒント生成`
    ).run();

    return c.json({
      success: true,
      hint,
      hint_level: determineHintLevel(theoryScores),
      learning_style_adaptation: determineLearningStyle(theoryScores)
    });

  } catch (error: any) {
    console.error('❌ 適応的ヒント生成エラー:', error);
    return c.json({
      success: false,
      error: 'ヒント生成に失敗しました'
    }, 500);
  }
});

/**
 * GET /api/problems/recommended/:studentId
 * 12理論プロファイルに基づく問題推薦
 */
app.get('/api/problems/recommended/:studentId', async (c) => {
  const { DB } = c.env;
  const studentId = c.req.param('studentId');
  const limit = Number(c.req.query('limit')) || 10;
  const subject = c.req.query('subject');

  try {
    // 1. 生徒の12理論プロファイル取得
    const profile = await DB.prepare(`
      SELECT * FROM student_theory_profiles WHERE student_id = ? ORDER BY created_at DESC LIMIT 1
    `).bind(studentId).first();

    if (!profile) {
      return c.json({
        success: true,
        problems: [],
        message: '12理論プロファイルが未作成です。'
      });
    }

    const theoryScores = JSON.parse(profile.theory_scores as string);

    // 2. 理論適合度の高い問題を取得
    let query = `
      SELECT * FROM generated_problems 
      WHERE theory_aligned = 1
    `;
    const params: any[] = [];

    if (subject) {
      query += ` AND subject = ?`;
      params.push(subject);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const problems = await DB.prepare(query).bind(...params).all();

    // 3. 各問題の適合度スコア計算
    const enrichedProblems = problems.results?.map((problem: any) => {
      const problemTheories = problem.theory_codes ? JSON.parse(problem.theory_codes) : [];
      let matchScore = 0;
      
      problemTheories.forEach((theoryCode: string) => {
        matchScore += theoryScores[theoryCode] || 0;
      });
      
      matchScore = problemTheories.length > 0 ? matchScore / problemTheories.length : 0;

      return {
        ...problem,
        match_score: matchScore,
        recommendation_reason: `あなたの学習プロファイルとの適合度: ${Math.round(matchScore * 100)}%`
      };
    }) || [];

    // 4. 適合度でソート
    enrichedProblems.sort((a, b) => b.match_score - a.match_score);

    return c.json({
      success: true,
      problems: enrichedProblems.slice(0, limit),
      theory_profile: {
        learning_style: determineLearningStyle(theoryScores),
        theory_scores: theoryScores
      }
    });

  } catch (error: any) {
    console.error('❌ 問題推薦エラー:', error);
    return c.json({
      success: false,
      error: '問題推薦に失敗しました'
    }, 500);
  }
});

// ============================
// ヘルパー関数
// ============================

/**
 * 12理論プロファイルに基づく問題生成プロンプト作成
 */
function generateTheoryBasedPrompt(
  theoryScores: Record<string, number>,
  subject: string,
  unitName: string,
  difficulty: string,
  count: number
): string {
  const learningStyle = determineLearningStyle(theoryScores);
  const selfRegulation = theoryScores['F5'] || 0;
  const motivation = theoryScores['F8'] || 0;

  let prompt = `あなたは教育のプロフェッショナルです。以下の条件で${count}問の問題を生成してください。

【基本条件】
- 教科: ${subject}
- 単元: ${unitName}
- 難易度: ${difficulty}

【生徒の学習プロファイル】
- 学習様式: ${learningStyle}学習者（F1理論）
- 自己調整学習レベル: ${Math.round(selfRegulation * 100)}%（F5理論）
- 動機づけレベル: ${Math.round(motivation * 100)}%（F8理論）

【問題設計の指針】
`;

  // F1: 学習様式に応じた問題形式
  if (learningStyle === '視覚') {
    prompt += `- 視覚学習者向け: 図表、グラフ、画像を活用した問題を含める\n`;
  } else if (learningStyle === '聴覚') {
    prompt += `- 聴覚学習者向け: 文章での説明が詳しい問題、音声で読み上げやすい問題\n`;
  } else if (learningStyle === '読み書き') {
    prompt += `- 読み書き学習者向け: 文章理解、記述式の問題を含める\n`;
  } else if (learningStyle === '体験') {
    prompt += `- 体験学習者向け: 実践的、具体例を含む問題を設計\n`;
  }

  // F5: 自己調整学習
  if (selfRegulation > 0.6) {
    prompt += `- 自己調整学習促進: 「なぜこの答えになるか説明してください」などのメタ認知を促す要素を追加\n`;
  }

  // F6: 効果的な学習方略
  prompt += `- 学習方略統合: 検索練習（思い出す）、精緻化（理由を考える）、具体例を含める\n`;

  // F8: 動機づけ
  if (motivation > 0.6) {
    prompt += `- 動機づけ配慮: 実生活とのつながり、達成感を感じられる問題設計\n`;
  }

  prompt += `
【出力形式】
各問題を以下のJSON形式で出力してください:
{
  "question": "問題文",
  "correct_answer": "正解",
  "explanation": "解説",
  "problem_type": "multiple_choice/short_answer/calculation",
  "hints": ["ヒント1", "ヒント2"]
}

問題を配列形式で${count}問生成してください。`;

  return prompt;
}

/**
 * 適応的ヒントプロンプト生成
 */
function generateAdaptiveHintPrompt(
  theoryScores: Record<string, number>,
  problem: any,
  currentAnswer: string
): string {
  const learningStyle = determineLearningStyle(theoryScores);
  const scaffoldingLevel = theoryScores['F7'] || 0.5; // 足場かけ理論

  let prompt = `生徒が以下の問題に取り組んでいます。適切なヒントを生成してください。

【問題】
${problem.question}

【正解】
${problem.correct_answer}

【生徒の現在の回答】
${currentAnswer || '未回答'}

【生徒の学習プロファイル】
- 学習様式: ${learningStyle}
- 足場かけレベル: ${scaffoldingLevel < 0.4 ? '手厚い支援が必要' : scaffoldingLevel < 0.7 ? '中程度の支援' : '軽い支援で十分'}

【ヒント生成の指針】
`;

  // F7: 動的足場かけ
  if (scaffoldingLevel < 0.4) {
    prompt += `- 具体的で詳しいヒントを提供\n- ステップバイステップで考え方を示す\n`;
  } else if (scaffoldingLevel < 0.7) {
    prompt += `- 考え方の方向性を示すヒント\n- 完全な答えは示さない\n`;
  } else {
    prompt += `- 軽いヒントのみ\n- 自分で考える余地を残す\n`;
  }

  // F1: 学習様式対応
  if (learningStyle === '視覚') {
    prompt += `- 可能であれば図や視覚的な表現を言葉で説明\n`;
  }

  prompt += `\n適切なヒントを1つ、100文字以内で生成してください。`;

  return prompt;
}

/**
 * 学習様式判定（F1理論）
 */
function determineLearningStyle(theoryScores: Record<string, number>): string {
  // 実際には more detailed logic needed
  // ここでは簡易判定
  const f1Score = theoryScores['F1'] || 0;
  if (f1Score > 0.75) return '視覚';
  if (f1Score > 0.5) return '聴覚';
  if (f1Score > 0.25) return '読み書き';
  return '体験';
}

/**
 * ヒントレベル判定（F7理論）
 */
function determineHintLevel(theoryScores: Record<string, number>): string {
  const f7Score = theoryScores['F7'] || 0.5;
  if (f7Score < 0.4) return 'detailed'; // 詳細
  if (f7Score < 0.7) return 'moderate'; // 中程度
  return 'light'; // 軽い
}

/**
 * AI応答の問題解析（簡易版）
 */
function parseAIProblemsResponse(response: string): any[] {
  try {
    // JSONブロックを抽出
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // フォールバック: 単一オブジェクトの場合
    const singleMatch = response.match(/\{[\s\S]*\}/);
    if (singleMatch) {
      return [JSON.parse(singleMatch[0])];
    }

    return [];
  } catch (error) {
    console.error('AI応答の解析エラー:', error);
    return [];
  }
}

export default app;
