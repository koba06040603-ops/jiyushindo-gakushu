/**
 * Gemini 構造化出力（responseSchema）定義
 * ============================================================
 * 【背景】2026-09 実測ベンチマーク（scripts/bench/test-schema.mjs）にて、
 * responseMimeType: 'application/json' のみでは 10枚カード生成時に
 * JSON 構造破損（余分な括弧・未終端文字列）が高頻度で発生することを確認。
 *
 *   gemini-3.8-flash  schema なし: 成功 2/6  → schema あり: 6/6
 *   gemini-3.7-flash  schema なし: 成功 3/6  → schema あり: 6/6
 *
 * finishReason は STOP（トークン切れではない）ため、maxOutputTokens 増加では
 * 解決しない。responseSchema による構造強制が唯一の有効な対策。
 *
 * 本モジュールのスキーマを generationConfig.responseSchema に渡すこと。
 */

/** Gemini OpenAPI サブセット スキーマ型 */
export interface GeminiSchema {
  type: 'object' | 'array' | 'string' | 'integer' | 'number' | 'boolean'
  properties?: Record<string, GeminiSchema>
  items?: GeminiSchema
  required?: string[]
  enum?: string[]
  description?: string
  nullable?: boolean
}

// ============================================================
// 1. 学習カード生成スキーマ（最重要 — 自由進度学習の中核）
// ============================================================
export const HINT_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    hint_level: { type: 'integer', description: '1=気づきを促す, 2=方針を示す, 3=手順を示す（答えは書かない）' },
    hint_text: { type: 'string', description: '答えそのものを含めないヒント文' },
    thinking_tool_suggestion: { type: 'string', description: '使える思考ツール' },
  },
  required: ['hint_level', 'hint_text'],
}

export const MULTIMEDIA_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', description: 'illustration / diagram / animation / chart など' },
    description: { type: 'string', description: '生成すべき視覚教材の具体的な説明' },
  },
  required: ['type', 'description'],
}

/**
 * 学習カードスキーマ
 *
 * ⚠️ 重要: フィールド名は必ず「プロンプトが指示する名前」と一致させること。
 * responseSchema はプロンプトより優先されるため、ここで別名を定義すると
 * プロンプト通りの名前で返ってこず、保存側が値を見つけられなくなる。
 * （2026-09: title/question で定義した結果、保存側が探す card_title /
 *   problem_description が生成されず「問題の説明を生成中です」という
 *   プレースホルダーのまま保存される障害が発生した）
 *
 * 保存側が参照する必須フィールド（src/index.tsx requiredFields）:
 *   card_number, card_title, problem_description, answer
 */
export const LEARNING_CARD_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    card_number: { type: 'integer' },
    card_title: { type: 'string', description: '魅力的なタイトル（20字以内）' },
    card_type: { type: 'string' },
    textbook_page: { type: 'string' },
    problem_description: { type: 'string', description: '具体的な問題文（100-200字）' },
    new_terms: { type: 'string', description: '新出用語（カンマ区切り）。答えを含めない' },
    example_problem: { type: 'string', description: '本問題とは別の答えになる例題' },
    example_solution: { type: 'string', description: '例題の解き方' },
    example_answer: { type: 'string', description: 'answer とは必ず異なる値' },
    example_image_description: { type: 'string', nullable: true },
    real_world_connection: { type: 'string' },
    answer: { type: 'string', description: '自動採点可能な明確な答え' },
    answer_keywords: { type: 'array', items: { type: 'string' }, description: '採点用キーワード3つ' },
    answer_explanation: { type: 'string', description: '途中式・計算過程を含む100字以上の解説' },
    ai_teacher_message: { type: 'string', description: '励ましメッセージ。答えを含めない' },
    ai_teacher_advice: { type: 'string', description: '学び方アドバイス。答えを含めない' },
    teacher_help_keywords: { type: 'string', description: '質問用キーワード。答えを含めない' },
    hints: { type: 'array', items: HINT_SCHEMA },
    difficulty_level: { type: 'string' },
    // 比例・反比例用（他の単元では空でよい）
    basic_item: { type: 'string', description: '比例・反比例の必須基礎 B1〜B7 のいずれか（該当しない単元は空）' },
    bloom_level: { type: 'string', description: 'remember/understand/apply/analyze/evaluate/create のいずれか' },
  },
  required: [
    'card_number', 'card_title', 'problem_description', 'answer',
    'answer_keywords', 'answer_explanation',
    'example_problem', 'example_answer',
    'hints', 'ai_teacher_message',
  ],
}

export const CARDS_RESPONSE_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: { cards: { type: 'array', items: LEARNING_CARD_SCHEMA } },
  required: ['cards'],
}

// ============================================================
// 2. コース生成スキーマ（カード群 + コースメタ情報）
// ⚠️ トップレベルのキーも /api/ai/generate-course のプロンプトに合わせること
// ============================================================
export const COURSE_RESPONSE_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    course_name: { type: 'string' },
    name: { type: 'string' },
    label: { type: 'string' },
    description: { type: 'string' },
    color_code: { type: 'string' },
    cards: { type: 'array', items: LEARNING_CARD_SCHEMA },
  },
  required: ['cards'],
}

// ============================================================
// 3. 学習状態分析スキーマ（軽量・高頻度タスク）
// ============================================================
export const LEARNING_STATE_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    state: { type: 'string', enum: ['stagnant', 'growing', 'mastered'] },
    cause: { type: 'string' },
    next_action: { type: 'string' },
    difficulty_adjust: { type: 'integer', description: '-1=易しく, 0=維持, 1=難しく' },
    encouragement: { type: 'string', description: '児童向けの励まし' },
  },
  required: ['state', 'next_action', 'difficulty_adjust', 'encouragement'],
}

// ============================================================
// 4. 形成的フィードバックスキーマ
// ============================================================
export const FEEDBACK_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    is_correct: { type: 'boolean' },
    misconception: { type: 'string', description: '誤概念の特定' },
    feedback: { type: 'string', description: '答えを教えず気づきを促す言葉がけ' },
    next_hint: { type: 'string' },
  },
  required: ['is_correct', 'feedback'],
}

// ============================================================
// 5. 記述式採点スキーマ
// ============================================================
export const GRADING_SCHEMA: GeminiSchema = {
  type: 'object',
  properties: {
    score: { type: 'integer' },
    max_score: { type: 'integer' },
    is_correct: { type: 'boolean' },
    matched_keywords: { type: 'array', items: { type: 'string' } },
    missing_points: { type: 'array', items: { type: 'string' } },
    feedback: { type: 'string' },
  },
  required: ['score', 'is_correct', 'feedback'],
}

// ============================================================
// 生成設定ビルダー
// ============================================================
export interface GeminiGenConfig {
  temperature: number
  maxOutputTokens: number
  responseMimeType?: string
  responseSchema?: GeminiSchema
  topP?: number
}

/**
 * タスクに応じた generationConfig を生成する。
 * schema を渡した場合、JSON 構造破損を防ぐ構造化出力モードになる。
 *
 * @param schema   responseSchema（省略時は mimeType のみの緩い JSON モード）
 * @param opts     temperature / maxOutputTokens の上書き
 */
export function buildGeminiConfig(
  schema?: GeminiSchema,
  opts: Partial<Pick<GeminiGenConfig, 'temperature' | 'maxOutputTokens' | 'topP'>> = {}
): GeminiGenConfig {
  const cfg: GeminiGenConfig = {
    temperature: opts.temperature ?? 0.2,
    maxOutputTokens: opts.maxOutputTokens ?? 16384,
    responseMimeType: 'application/json',
  }
  if (opts.topP !== undefined) cfg.topP = opts.topP
  if (schema) cfg.responseSchema = schema
  return cfg
}

/**
 * Gemini 応答テキストを堅牢に JSON パースする。
 * responseSchema 使用時でもまれに発生する破損に対するサルベージ層。
 *
 * 1. そのままパース
 * 2. ```json フェンス除去
 * 3. 最初の { 〜 最後の } を抽出
 * 4. 末尾の余分な閉じ括弧を削除して再試行
 */
export function parseGeminiJSON<T = any>(raw: string): { ok: true; data: T } | { ok: false; error: string } {
  if (!raw || !raw.trim()) return { ok: false, error: 'empty response' }

  const attempts: string[] = []
  const cleaned = raw.trim()
  attempts.push(cleaned)

  // フェンス除去
  const defenced = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  if (defenced !== cleaned) attempts.push(defenced)

  // 最初の { 〜 最後の }
  const first = defenced.indexOf('{')
  const last = defenced.lastIndexOf('}')
  if (first >= 0 && last > first) attempts.push(defenced.slice(first, last + 1))

  for (const a of attempts) {
    try {
      return { ok: true, data: JSON.parse(a) as T }
    } catch { /* 次の候補へ */ }
  }

  // 末尾の余分な閉じ括弧を1つずつ削って再試行（観測された破損パターン: ...}]}]）
  let salvage = attempts[attempts.length - 1] ?? defenced
  for (let i = 0; i < 5; i++) {
    salvage = salvage.replace(/[\]\}]\s*$/, '').trimEnd()
    for (const suffix of ['}', ']}', '"}]}', '"}]}]']) {
      try {
        return { ok: true, data: JSON.parse(salvage + suffix) as T }
      } catch { /* 次へ */ }
    }
  }

  return { ok: false, error: `JSON parse failed (len=${raw.length}, tail=${raw.slice(-60)})` }
}
