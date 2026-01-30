/**
 * AI生成コンテンツシステム
 * 学習スタイル別に最適化されたコンテンツを自動生成
 * 
 * 機能:
 * - 学習スタイルに基づくプロンプト最適化
 * - Gemini APIによるコンテンツ生成
 * - 視覚型・聴覚型・読書型・体感型に対応
 * - 問題・解説・ヒント・実世界応用の生成
 */

import { Context } from 'hono';

// 学習スタイル別プロンプトテンプレート
const LEARNING_STYLE_PROMPTS = {
  visual: {
    prefix: '視覚的な要素を重視して、',
    elements: [
      '図解やダイアグラムの説明を含める',
      '色分けや視覚的なパターンを使用',
      'イメージしやすい具体例を提供',
      'ステップを視覚的に表現'
    ]
  },
  auditory: {
    prefix: '音声で聞きやすいように、',
    elements: [
      '会話形式や対話的な表現を使用',
      'リズムや韻を意識した説明',
      '口頭で説明しやすい言葉遣い',
      '音やリズムに関連する例を使用'
    ]
  },
  reading: {
    prefix: '詳細な文章説明を重視して、',
    elements: [
      '論理的で体系的な説明',
      '定義や用語を明確に記載',
      '段階的な説明と要約を提供',
      '引用や参考文献の形式を使用'
    ]
  },
  kinesthetic: {
    prefix: '実践的な体験を重視して、',
    elements: [
      '実際に手を動かす例を提供',
      '現実世界での応用例',
      'ステップバイステップの実践手順',
      '実験や試行錯誤を促す内容'
    ]
  }
};

// コンテンツ生成リクエスト
export interface ContentGenerationRequest {
  topic: string;              // トピック（例: 「分数の足し算」）
  learning_style: string;      // 学習スタイル（visual, auditory, reading, kinesthetic）
  grade_level: number;         // 学年（1-12）
  content_type: string;        // コンテンツタイプ（problem, explanation, hint, real_world）
  difficulty: number;          // 難易度（1-5）
  language?: string;           // 言語（デフォルト: ja）
}

// 生成されたコンテンツ
export interface GeneratedContent {
  topic: string;
  learning_style: string;
  content_type: string;
  content: string;
  visual_elements?: string[]; // 視覚型向け追加要素
  audio_script?: string;       // 聴覚型向け音声スクリプト
  practice_activity?: string;  // 体感型向け実践アクティビティ
  reading_notes?: string;      // 読書型向け補足ノート
  metadata: {
    generated_at: string;
    model: string;
    token_count?: number;
  };
}

/**
 * AI生成コンテンツエンジン
 */
export class AIContentGenerator {
  constructor(
    private GEMINI_API_KEY: string | undefined,
    private DB: D1Database,
    private KV: KVNamespace | undefined
  ) {}

  /**
   * 学習スタイル別コンテンツ生成
   */
  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    if (!this.GEMINI_API_KEY) {
      throw new Error('Gemini API Key is not configured');
    }

    // キャッシュチェック
    const cacheKey = `ai_content:${request.topic}:${request.learning_style}:${request.content_type}:${request.difficulty}`;
    if (this.KV) {
      const cached = await this.KV.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // プロンプト生成
    const prompt = this.buildPrompt(request);

    // Gemini API呼び出し
    const generatedText = await this.callGeminiAPI(prompt);

    // コンテンツ構造化
    const content = this.structureContent(generatedText, request);

    // キャッシュ保存（TTL: 1日）
    if (this.KV) {
      await this.KV.put(cacheKey, JSON.stringify(content), { expirationTtl: 86400 });
    }

    // DB保存
    await this.saveContentToDB(content, request);

    return content;
  }

  /**
   * プロンプト構築
   */
  private buildPrompt(request: ContentGenerationRequest): string {
    const styleConfig = LEARNING_STYLE_PROMPTS[request.learning_style as keyof typeof LEARNING_STYLE_PROMPTS] || LEARNING_STYLE_PROMPTS.reading;
    const language = request.language || 'ja';

    let prompt = `あなたは教育専門家です。以下の条件で学習コンテンツを生成してください。

トピック: ${request.topic}
学年: ${request.grade_level}年生
難易度: ${request.difficulty}/5
コンテンツタイプ: ${this.getContentTypeDescription(request.content_type)}
学習スタイル: ${this.getLearningStyleDescription(request.learning_style)}

${styleConfig.prefix}以下の要素を含めてください:
${styleConfig.elements.map((e, i) => `${i + 1}. ${e}`).join('\n')}

`;

    // コンテンツタイプ別の追加指示
    switch (request.content_type) {
      case 'problem':
        prompt += `
問題を作成する際の要件:
- 学年レベルに適した難易度
- 明確な問題文
- 学習スタイルに合った表現
- 実生活に関連する内容（可能な場合）
`;
        break;
      case 'explanation':
        prompt += `
解説を作成する際の要件:
- 初心者でも理解できる説明
- 段階的なステップ
- 具体例を複数含める
- よくある間違いとその対策
`;
        break;
      case 'hint':
        prompt += `
ヒントを作成する際の要件:
- 答えを直接言わない
- 考え方のきっかけを提供
- 段階的なヒント（3段階程度）
`;
        break;
      case 'real_world':
        prompt += `
実世界応用例を作成する際の要件:
- 日常生活での応用
- 職業での活用例
- 社会での重要性
- 興味を引く具体例
`;
        break;
    }

    prompt += `\n${language === 'ja' ? '日本語' : '英語'}で回答してください。`;

    return prompt;
  }

  /**
   * Gemini API呼び出し
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  /**
   * コンテンツ構造化
   */
  private structureContent(
    generatedText: string,
    request: ContentGenerationRequest
  ): GeneratedContent {
    const content: GeneratedContent = {
      topic: request.topic,
      learning_style: request.learning_style,
      content_type: request.content_type,
      content: generatedText,
      metadata: {
        generated_at: new Date().toISOString(),
        model: 'gemini-1.5-flash',
        token_count: generatedText.length
      }
    };

    // 学習スタイル別追加要素
    switch (request.learning_style) {
      case 'visual':
        content.visual_elements = this.extractVisualElements(generatedText);
        break;
      case 'auditory':
        content.audio_script = this.createAudioScript(generatedText);
        break;
      case 'kinesthetic':
        content.practice_activity = this.extractPracticeActivity(generatedText);
        break;
      case 'reading':
        content.reading_notes = this.createReadingNotes(generatedText);
        break;
    }

    return content;
  }

  /**
   * 視覚要素抽出
   */
  private extractVisualElements(text: string): string[] {
    const elements: string[] = [];
    
    // 図解が必要な箇所を抽出
    const diagramMatches = text.match(/図[0-9０-９]+|図解|ダイアグラム|チャート/g);
    if (diagramMatches) {
      elements.push(...diagramMatches);
    }

    // ステップや番号付きリストを抽出
    const stepMatches = text.match(/^[0-9０-９]+\.|ステップ[0-9０-９]+/gm);
    if (stepMatches) {
      elements.push(...stepMatches);
    }

    return elements;
  }

  /**
   * 音声スクリプト作成
   */
  private createAudioScript(text: string): string {
    // 音声読み上げ用に最適化
    return text
      .replace(/\n+/g, '、')
      .replace(/[（(].*?[)）]/g, '') // 括弧内を削除
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 実践アクティビティ抽出
   */
  private extractPracticeActivity(text: string): string {
    const activitySection = text.match(/実践|やってみよう|試してみよう|アクティビティ[\s\S]*?(?=\n\n|$)/i);
    return activitySection ? activitySection[0] : '実際に手を動かして試してみましょう。';
  }

  /**
   * 読書ノート作成
   */
  private createReadingNotes(text: string): string {
    // 重要ポイントを箇条書きで抽出
    const bullets = text.match(/^[-・•]\s*.+$/gm) || [];
    return bullets.join('\n') || '主要なポイントをノートにまとめましょう。';
  }

  /**
   * コンテンツタイプ説明
   */
  private getContentTypeDescription(type: string): string {
    const descriptions: Record<string, string> = {
      problem: '学習問題',
      explanation: '詳細な解説',
      hint: 'ヒント',
      real_world: '実世界での応用例'
    };
    return descriptions[type] || type;
  }

  /**
   * 学習スタイル説明
   */
  private getLearningStyleDescription(style: string): string {
    const descriptions: Record<string, string> = {
      visual: '視覚型学習者向け（図解やビジュアル重視）',
      auditory: '聴覚型学習者向け（音声や会話重視）',
      reading: '読書型学習者向け（詳細な文章重視）',
      kinesthetic: '体感型学習者向け（実践や体験重視）'
    };
    return descriptions[style] || style;
  }

  /**
   * DBへの保存
   */
  private async saveContentToDB(content: GeneratedContent, request: ContentGenerationRequest) {
    await this.DB.prepare(`
      INSERT INTO ai_generated_content (
        topic, learning_style, content_type, grade_level, difficulty,
        content, visual_elements, audio_script, practice_activity, reading_notes,
        model, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      content.topic,
      content.learning_style,
      content.content_type,
      request.grade_level,
      request.difficulty,
      content.content,
      JSON.stringify(content.visual_elements || []),
      content.audio_script || null,
      content.practice_activity || null,
      content.reading_notes || null,
      content.metadata.model,
      content.metadata.generated_at
    ).run();
  }

  /**
   * 生成履歴取得
   */
  async getGenerationHistory(filters: {
    topic?: string;
    learning_style?: string;
    content_type?: string;
    limit?: number;
  }) {
    let query = 'SELECT * FROM ai_generated_content WHERE 1=1';
    const bindings: any[] = [];

    if (filters.topic) {
      query += ' AND topic LIKE ?';
      bindings.push(`%${filters.topic}%`);
    }

    if (filters.learning_style) {
      query += ' AND learning_style = ?';
      bindings.push(filters.learning_style);
    }

    if (filters.content_type) {
      query += ' AND content_type = ?';
      bindings.push(filters.content_type);
    }

    query += ' ORDER BY generated_at DESC LIMIT ?';
    bindings.push(filters.limit || 20);

    const result = await this.DB.prepare(query).bind(...bindings).all();
    return result.results;
  }
}

/**
 * AI生成コンテンツテーブル
 */
export const AI_CONTENT_MIGRATION = `
-- AI生成コンテンツテーブル
CREATE TABLE IF NOT EXISTS ai_generated_content (
  content_id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  learning_style TEXT NOT NULL CHECK(learning_style IN ('visual', 'auditory', 'reading', 'kinesthetic')),
  content_type TEXT NOT NULL CHECK(content_type IN ('problem', 'explanation', 'hint', 'real_world')),
  grade_level INTEGER NOT NULL CHECK(grade_level BETWEEN 1 AND 12),
  difficulty INTEGER NOT NULL CHECK(difficulty BETWEEN 1 AND 5),
  content TEXT NOT NULL,
  visual_elements TEXT,
  audio_script TEXT,
  practice_activity TEXT,
  reading_notes TEXT,
  model TEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_content_topic ON ai_generated_content(topic);
CREATE INDEX IF NOT EXISTS idx_ai_content_style ON ai_generated_content(learning_style);
CREATE INDEX IF NOT EXISTS idx_ai_content_type ON ai_generated_content(content_type);
CREATE INDEX IF NOT EXISTS idx_ai_content_grade ON ai_generated_content(grade_level);
`;
