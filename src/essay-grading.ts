/**
 * Phase 20-2: 長文・記述問題の自動採点機能
 * 文法・内容・論理性を多角的に評価
 */

interface EssayProblem {
  id?: number;
  student_id: number;
  problem_type: 'essay' | 'short_answer' | 'explanation' | 'proof';
  subject: string;
  unit_name?: string;
  question: string;
  question_type?: string;
  reference_answer: string;
  evaluation_criteria?: string;
  max_score?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface EssayAnswer {
  id?: number;
  problem_id: number;
  student_id: number;
  answer_text: string;
  answer_length?: number;
  writing_time?: number;
}

interface EssayGradingResult {
  total_score: number;
  grade_level: 'A' | 'B' | 'C' | 'D' | 'F';
  content_score: number;
  logic_score: number;
  grammar_score: number;
  completeness_score: number;
  overall_feedback: string;
  content_feedback: string;
  logic_feedback: string;
  grammar_feedback: string;
  improvement_suggestions: string;
  strengths: string;
  weaknesses: string;
  key_concepts_covered: string;
  missing_concepts: string;
}

/**
 * 記述問題のAI自動採点エンジン
 */
export class EssayGradingEngine {
  constructor(private ai: any, private DB: D1Database) {}

  /**
   * 記述解答を採点
   */
  async gradeEssay(
    problem: EssayProblem,
    answer: EssayAnswer,
    useAI: boolean = true
  ): Promise<EssayGradingResult> {
    if (useAI) {
      try {
        return await this.gradeWithAI(problem, answer);
      } catch (error) {
        console.warn('AI採点エラー、ルールベース採点にフォールバック:', error);
        return this.gradeWithRules(problem, answer);
      }
    } else {
      return this.gradeWithRules(problem, answer);
    }
  }

  /**
   * AIを使用した採点
   */
  private async gradeWithAI(
    problem: EssayProblem,
    answer: EssayAnswer
  ): Promise<EssayGradingResult> {
    const prompt = `
あなたは経験豊富な教師です。以下の記述問題の解答を採点してください。

【問題】
${problem.question}

【模範解答】
${problem.reference_answer}

【生徒の解答】
${answer.answer_text}

【教科】${problem.subject}
【問題タイプ】${problem.problem_type}
【最高点】${problem.max_score || 100}点

以下の観点から採点し、JSON形式で返してください：

1. **内容の正確性** (0-100点): 模範解答と比較して内容が正確か
2. **論理性・構成** (0-100点): 論理的な説明ができているか
3. **文法・表現** (0-100点): 文法的に正しく、適切な表現か
4. **完成度** (0-100点): 解答として完成しているか

返答形式（JSON）：
{
  "content_score": 点数,
  "logic_score": 点数,
  "grammar_score": 点数,
  "completeness_score": 点数,
  "overall_feedback": "総合評価コメント",
  "content_feedback": "内容についてのフィードバック",
  "logic_feedback": "論理・構成のフィードバック",
  "grammar_feedback": "文法のフィードバック",
  "improvement_suggestions": "具体的な改善提案",
  "strengths": "良い点",
  "weaknesses": "改善が必要な点",
  "key_concepts_covered": "カバーした重要概念",
  "missing_concepts": "不足している概念"
}
`;

    const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
      prompt,
      max_tokens: 1000
    });

    const result = JSON.parse(response.response);

    // 総合点を計算（各項目の平均）
    const total_score = Math.round(
      (result.content_score + result.logic_score + result.grammar_score + result.completeness_score) / 4
    );

    // 成績レベルを決定
    const grade_level = this.calculateGradeLevel(total_score);

    return {
      total_score,
      grade_level,
      ...result
    };
  }

  /**
   * ルールベースの採点
   */
  private gradeWithRules(
    problem: EssayProblem,
    answer: EssayAnswer
  ): Promise<EssayGradingResult> {
    const referenceWords = this.extractKeywords(problem.reference_answer);
    const answerWords = this.extractKeywords(answer.answer_text);

    // キーワード一致率を計算
    const matchCount = referenceWords.filter(word => answerWords.includes(word)).length;
    const matchRate = matchCount / referenceWords.length;

    // 長さによる完成度評価
    const answerLength = answer.answer_text.length;
    const referenceLength = problem.reference_answer.length;
    const lengthRate = Math.min(answerLength / referenceLength, 1.2);

    // スコア計算
    const content_score = Math.round(matchRate * 100);
    const completeness_score = Math.round(lengthRate * 80);
    const logic_score = this.evaluateLogic(answer.answer_text);
    const grammar_score = this.evaluateGrammar(answer.answer_text);

    const total_score = Math.round(
      (content_score + logic_score + grammar_score + completeness_score) / 4
    );

    return Promise.resolve({
      total_score,
      grade_level: this.calculateGradeLevel(total_score),
      content_score,
      logic_score,
      grammar_score,
      completeness_score,
      overall_feedback: this.generateOverallFeedback(total_score),
      content_feedback: `キーワード一致率: ${Math.round(matchRate * 100)}%`,
      logic_feedback: '論理的な説明を心がけましょう。',
      grammar_feedback: '文法を再確認しましょう。',
      improvement_suggestions: this.generateImprovementSuggestions(total_score, matchRate),
      strengths: matchRate > 0.7 ? '重要なポイントを押さえています。' : '努力が見られます。',
      weaknesses: matchRate < 0.5 ? '重要なキーワードが不足しています。' : '細部の表現に改善の余地があります。',
      key_concepts_covered: `${matchCount}個の重要概念をカバーしています。`,
      missing_concepts: `${referenceWords.length - matchCount}個の概念が不足しています。`
    });
  }

  /**
   * キーワード抽出
   */
  private extractKeywords(text: string): string[] {
    // 簡易的なキーワード抽出（実際にはより高度な形態素解析を使用）
    return text
      .replace(/[、。！？,.!?]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2);
  }

  /**
   * 論理性の評価
   */
  private evaluateLogic(text: string): number {
    let score = 60;

    // 接続詞の使用
    const conjunctions = ['しかし', 'そして', 'また', 'なぜなら', 'したがって', 'つまり'];
    const usedConjunctions = conjunctions.filter(c => text.includes(c)).length;
    score += usedConjunctions * 5;

    // 段落構成
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * 文法の評価
   */
  private evaluateGrammar(text: string): number {
    let score = 70;

    // 文の終わり方
    const sentences = text.split(/[。！？]/);
    const properEndings = sentences.filter(s => /[だです]$/.test(s.trim())).length;
    score += (properEndings / sentences.length) * 20;

    // 敬体・常体の統一
    const desu = (text.match(/です/g) || []).length;
    const da = (text.match(/だ(?=[。、])/g) || []).length;
    if (desu > 0 && da === 0 || desu === 0 && da > 0) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * 成績レベルを計算
   */
  private calculateGradeLevel(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 75) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * 総合フィードバックを生成
   */
  private generateOverallFeedback(score: number): string {
    if (score >= 90) {
      return '素晴らしい解答です！内容、論理性、表現ともに優れています。';
    } else if (score >= 75) {
      return '良い解答です。基本的なポイントは押さえられていますが、さらに深い理解を目指しましょう。';
    } else if (score >= 60) {
      return 'まずまずの解答です。重要なポイントをもう少し詳しく説明できるとより良くなります。';
    } else if (score >= 40) {
      return '基本的な理解は見られますが、内容の正確性や論理性に改善の余地があります。';
    } else {
      return '基礎からもう一度復習しましょう。教科書を読み直すことをお勧めします。';
    }
  }

  /**
   * 改善提案を生成
   */
  private generateImprovementSuggestions(score: number, matchRate: number): string {
    const suggestions: string[] = [];

    if (matchRate < 0.5) {
      suggestions.push('重要なキーワードを押さえましょう。');
    }

    if (score < 60) {
      suggestions.push('問題文をよく読んで、何を答えるべきか確認しましょう。');
      suggestions.push('模範解答を参考に、必要な要素を含めましょう。');
    }

    suggestions.push('解答する前に、簡単な構成メモを作ると良いでしょう。');

    return suggestions.join('\n');
  }

  /**
   * 採点結果をデータベースに保存
   */
  async saveGradingResult(
    answerId: number,
    studentId: number,
    result: EssayGradingResult,
    aiModel: string = 'rule-based'
  ): Promise<void> {
    await this.DB.prepare(`
      INSERT INTO essay_grading (
        answer_id, student_id, total_score, grade_level,
        content_score, logic_score, grammar_score, completeness_score,
        overall_feedback, content_feedback, logic_feedback, grammar_feedback,
        improvement_suggestions, strengths, weaknesses,
        key_concepts_covered, missing_concepts, ai_model
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      answerId,
      studentId,
      result.total_score,
      result.grade_level,
      result.content_score,
      result.logic_score,
      result.grammar_score,
      result.completeness_score,
      result.overall_feedback,
      result.content_feedback,
      result.logic_feedback,
      result.grammar_feedback,
      result.improvement_suggestions,
      result.strengths,
      result.weaknesses,
      result.key_concepts_covered,
      result.missing_concepts,
      aiModel
    ).run();
  }
}
