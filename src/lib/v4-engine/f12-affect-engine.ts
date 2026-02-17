/**
 * F12: 感情-認知統合 (Affect-Cognition Integration) エンジン
 * — 感情ゲーティング層
 * 
 * 理論的根拠:
 * - Pekrun (2006): 学業感情の制御-価値理論 (r=.30-.50)
 * - Immordino-Yang (2016): 感情は認知の基盤
 * - 逆U字カーブ: 適度な覚醒と正の感情が最適な認知パフォーマンスをもたらす
 * 
 * 子ども観(v4): 「この子は今どんな気持ちで学んでいるか」を理解する視座。
 * 
 * **設計書の最重要原則**:
 * FRAMEWORK_COMPARISON.md 推奨構造: 感情層 > 認知層 > 社会層
 * 感情は他のすべてに先行する。感情が安全でなければ、認知は働かない。
 * 
 * Carroll作用: 有効学習時間を増加（感情調整 → 集中度 × 認知パフォーマンス）
 */

import type {
  F12_AffectProfile,
  F8_MotivationProfile,
  ArchetypeId,
  RealtimeBehaviorData,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: 感情状態の推定
// ============================================================

/** 感情状態の分類 */
export type AffectState =
  | 'crisis'       // 危機: 学習継続が困難（不安極大、覚醒極大/極小）
  | 'anxious'      // 不安: 覚醒高+価値負
  | 'bored'        // 退屈: 覚醒低+価値中立/負
  | 'frustrated'   // 挫折: 連続失敗+感情悪化
  | 'comfortable'  // 安心: 適度な覚醒+正の価値
  | 'flow'         // フロー: 最適覚醒+高い没入
  | 'excited'      // 興奮: 覚醒高+価値正（やや不安定）

/** 感情ゲーティングの判定結果 */
export interface AffectGatingResult {
  /** 推定された感情状態 */
  state: AffectState
  /** 緊急度 (0-1): 高いほど即座の介入が必要 */
  urgency: number
  /** 感情ゲーティングにより制御パラメータの上書きが必要か */
  requires_override: boolean
  /** 上書きする制御値（部分的） */
  overrides: Partial<AffectControlOverrides>
  /** 教師への通知が必要か */
  teacher_alert: boolean
  /** 推定の根拠 */
  reasoning: string
}

/** 感情ゲーティングによる制御パラメータ上書き */
export interface AffectControlOverrides {
  arousal_regulation: 'increase' | 'maintain' | 'decrease'
  emotional_message_type: 'encouraging' | 'calming' | 'neutral' | 'celebrating'
  /** 難易度位置の上限を強制 */
  max_difficulty_zpd_position: number
  /** 足場のfrustation_controlを強制ON */
  force_frustration_control: boolean
  /** 足場のsoft_languageを強制ON */
  force_soft_language: boolean
  /** 構造化度の下限を強制 */
  min_structure_level: number
}

// ============================================================
// Part 2: 感情状態の推定ロジック
// ============================================================

/**
 * F12プロファイルとリアルタイム行動から感情状態を推定する
 * 
 * Pekrunの制御-価値理論に基づく:
 * - 高覚醒 + 負の価値 → 不安
 * - 低覚醒 + 負/中立の価値 → 退屈
 * - 適度覚醒 + 正の価値 → 楽しさ/フロー
 * - 高覚醒 + 正の価値 → 興奮（要注意）
 */
export function estimateAffectState(
  profile: F12_AffectProfile,
  behavior: RealtimeBehaviorData
): AffectState {
  const { current_arousal, current_valence, academic_anxiety, academic_boredom, flow_state_probability } = profile

  // 危機判定（最優先）
  if (isCrisisState(profile, behavior)) {
    return 'crisis'
  }

  // フロー判定
  if (flow_state_probability > 0.7 && current_arousal >= 40 && current_arousal <= 80 && current_valence > 20) {
    return 'flow'
  }

  // 不安判定
  if (academic_anxiety > 60 || (current_arousal > 70 && current_valence < -20)) {
    return 'anxious'
  }

  // 退屈判定
  if (academic_boredom > 60 || (current_arousal < 30 && current_valence < 10)) {
    return 'bored'
  }

  // 挫折判定（行動パターンから）
  if (behavior.consecutive_errors >= 3 && current_valence < 0) {
    return 'frustrated'
  }

  // 興奮判定
  if (current_arousal > 75 && current_valence > 30) {
    return 'excited'
  }

  // 安心（デフォルト）
  return 'comfortable'
}

/**
 * 危機状態の判定
 * 
 * 危機 = 学習継続が困難な状態
 * - 不安が極めて高い (>80)
 * - 覚醒が極端に低い (<15) = 完全な離脱
 * - 連続5回以上の失敗 + 感情の急激な悪化
 */
function isCrisisState(profile: F12_AffectProfile, behavior: RealtimeBehaviorData): boolean {
  // 不安が極度に高い
  if (profile.academic_anxiety > 80) return true

  // 完全な離脱（覚醒極低）
  if (profile.current_arousal < 15 && behavior.idle_time_seconds > 120) return true

  // 連続失敗 + 感情悪化
  if (behavior.consecutive_errors >= 5 && profile.current_valence < -50) return true

  return false
}

// ============================================================
// Part 3: 感情ゲーティング — 感情が先行する制御
// ============================================================

/**
 * 感情ゲーティングの実行
 * 
 * 3層制御の最重要原則: 感情層 > 認知層 > 社会層
 * 感情が安全でなければ、認知制御（F4, F6等）は意味をなさない。
 * 
 * この関数は、他のすべての制御パラメータ算出の**前に**実行され、
 * 結果が「requires_override: true」の場合、認知層の出力を上書きする。
 */
export function executeAffectGating(
  affectProfile: F12_AffectProfile,
  motivationProfile: F8_MotivationProfile | null,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId
): AffectGatingResult {
  const state = estimateAffectState(affectProfile, behavior)

  switch (state) {
    case 'crisis':
      return handleCrisis(affectProfile, behavior, archetype)
    case 'anxious':
      return handleAnxious(affectProfile, behavior, archetype)
    case 'bored':
      return handleBored(affectProfile, behavior, archetype)
    case 'frustrated':
      return handleFrustrated(affectProfile, behavior, archetype)
    case 'flow':
      return handleFlow(affectProfile, archetype)
    case 'excited':
      return handleExcited(affectProfile, archetype)
    case 'comfortable':
    default:
      return handleComfortable(affectProfile, archetype)
  }
}

// ============================================================
// Part 4: 各感情状態への応答ロジック
// ============================================================

/** 危機対応: 学習の一時停止を推奨 */
function handleCrisis(
  profile: F12_AffectProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId
): AffectGatingResult {
  return {
    state: 'crisis',
    urgency: 1.0,
    requires_override: true,
    overrides: {
      arousal_regulation: profile.current_arousal > 60 ? 'decrease' : 'increase',
      emotional_message_type: 'calming',
      max_difficulty_zpd_position: 0.1,  // 絶対に失敗しない問題のみ
      force_frustration_control: true,
      force_soft_language: true,
      min_structure_level: 0.9,  // 完全な構造化
    },
    teacher_alert: true,  // 教師に必ず通知
    reasoning: `危機状態を検出: 不安=${profile.academic_anxiety}, 覚醒=${profile.current_arousal}, ` +
      `連続失敗=${behavior.consecutive_errors}。学習の一時停止を推奨。教師の介入を要請。`,
  }
}

/** 不安対応: 安心を優先 */
function handleAnxious(
  profile: F12_AffectProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId
): AffectGatingResult {
  // 不安が高い子（D型特に）にはより手厚い対応
  const isHighlySensitive = archetype === 'D' || archetype === 'F' || archetype === 'H'

  return {
    state: 'anxious',
    urgency: 0.7,
    requires_override: true,
    overrides: {
      arousal_regulation: 'decrease',
      emotional_message_type: 'calming',
      max_difficulty_zpd_position: isHighlySensitive ? 0.3 : 0.4,
      force_frustration_control: true,
      force_soft_language: true,
      min_structure_level: isHighlySensitive ? 0.6 : 0.5,
    },
    teacher_alert: profile.academic_anxiety > 75,
    reasoning: `不安状態: 不安=${profile.academic_anxiety}, 覚醒=${profile.current_arousal}。` +
      `「間違えても大丈夫」を体験で伝える。`,
  }
}

/** 退屈対応: 新しい刺激を */
function handleBored(
  profile: F12_AffectProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId
): AffectGatingResult {
  return {
    state: 'bored',
    urgency: 0.5,
    requires_override: true,
    overrides: {
      arousal_regulation: 'increase',
      emotional_message_type: 'encouraging',
      // 退屈 → 難易度を少し上げて刺激を（ただしZPD内）
      max_difficulty_zpd_position: 0.75,
      force_frustration_control: false,
      force_soft_language: false,
      min_structure_level: 0,  // 構造化は不要（むしろ自由度を）
    },
    teacher_alert: behavior.idle_time_seconds > 180,  // 3分以上のアイドルは通知
    reasoning: `退屈状態: 退屈=${profile.academic_boredom}, 覚醒=${profile.current_arousal}。` +
      `新しい扉を見せる。難易度を少し上げる。`,
  }
}

/** 挫折対応: 足元を支える */
function handleFrustrated(
  profile: F12_AffectProfile,
  behavior: RealtimeBehaviorData,
  archetype: ArchetypeId
): AffectGatingResult {
  return {
    state: 'frustrated',
    urgency: 0.6,
    requires_override: true,
    overrides: {
      arousal_regulation: 'decrease',
      emotional_message_type: 'calming',
      max_difficulty_zpd_position: 0.3,  // 手が届くところに戻す
      force_frustration_control: true,
      force_soft_language: true,
      min_structure_level: 0.5,
    },
    teacher_alert: behavior.consecutive_errors >= 5,
    reasoning: `挫折状態: 連続失敗=${behavior.consecutive_errors}, 感情価値=${profile.current_valence}。` +
      `手が届くところに戻す。「やり方が合わなかっただけ」を一緒に見つける。`,
  }
}

/** フロー状態: 邪魔をしない */
function handleFlow(
  profile: F12_AffectProfile,
  archetype: ArchetypeId
): AffectGatingResult {
  return {
    state: 'flow',
    urgency: 0.0,  // 緊急度ゼロ — 最善の応答は何もしないこと
    requires_override: false,
    overrides: {},
    teacher_alert: false,
    reasoning: `フロー状態: フロー確率=${profile.flow_state_probability}。` +
      `この子は夢中になっている。最善の応答は、邪魔をしないこと。`,
  }
}

/** 興奮状態: 見守りつつ安定化を */
function handleExcited(
  profile: F12_AffectProfile,
  archetype: ArchetypeId
): AffectGatingResult {
  return {
    state: 'excited',
    urgency: 0.2,
    requires_override: false,  // 強制上書きはしないが、モニタリングする
    overrides: {
      arousal_regulation: 'maintain',  // 覚醒度はそのまま維持
      emotional_message_type: 'neutral',
    },
    teacher_alert: false,
    reasoning: `興奮状態: 覚醒=${profile.current_arousal}, 感情価値=${profile.current_valence}。` +
      `良い興奮。見守りつつ、不安定化しないかモニタリング。`,
  }
}

/** 安心状態: 認知制御に任せる */
function handleComfortable(
  profile: F12_AffectProfile,
  archetype: ArchetypeId
): AffectGatingResult {
  return {
    state: 'comfortable',
    urgency: 0.0,
    requires_override: false,
    overrides: {},
    teacher_alert: false,
    reasoning: `安心状態: 覚醒=${profile.current_arousal}, 感情価値=${profile.current_valence}。` +
      `認知制御（F4, F6, F7等）に委ねる。`,
  }
}

// ============================================================
// Part 5: 感情制御パラメータの統合
// ============================================================

/**
 * 感情ゲーティングの結果を統合制御パラメータに適用する
 * 
 * 原則: 感情層の上書きは認知層の計算結果より**常に優先**される
 */
export function applyAffectGating(
  controls: IntegratedControlParameters,
  gatingResult: AffectGatingResult
): IntegratedControlParameters {
  if (!gatingResult.requires_override) {
    return controls
  }

  const overrides = gatingResult.overrides
  const updated = { ...controls }

  // 感情関連の直接上書き
  if (overrides.arousal_regulation) {
    updated.motivation = { ...updated.motivation, arousal_regulation: overrides.arousal_regulation }
  }
  if (overrides.emotional_message_type && overrides.emotional_message_type !== 'celebrating') {
    updated.motivation = {
      ...updated.motivation,
      emotional_message_type: overrides.emotional_message_type as 'encouraging' | 'calming' | 'neutral',
    }
  }

  // 難易度の上限制限
  if (overrides.max_difficulty_zpd_position !== undefined) {
    updated.structure = {
      ...updated.structure,
      difficulty_zpd_position: Math.min(
        updated.structure.difficulty_zpd_position,
        overrides.max_difficulty_zpd_position
      ),
    }
  }

  // 構造化度の下限制限
  if (overrides.min_structure_level !== undefined && overrides.min_structure_level > 0) {
    updated.structure = {
      ...updated.structure,
      structure_level: Math.max(
        updated.structure.structure_level,
        overrides.min_structure_level
      ),
    }
  }

  // 足場の強制ON
  if (overrides.force_frustration_control) {
    updated.scaffold = { ...updated.scaffold, frustration_control: true }
  }
  if (overrides.force_soft_language) {
    updated.scaffold = { ...updated.scaffold, soft_language: true }
  }

  // 教師アラートフラグ
  if (gatingResult.teacher_alert) {
    updated._teacher_alert = true
  }

  return updated
}

// ============================================================
// Part 6: 覚醒度の逆U字カーブに基づく最適覚醒度の算出
// ============================================================

/**
 * Yerkes-Dodson の逆U字則に基づく最適覚醒度レンジの算出
 * 
 * 課題の難易度が高い → 最適覚醒度は低め (40-55)
 * 課題の難易度が低い → 最適覚醒度は高め (55-70)
 */
export function computeOptimalArousalRange(
  taskDifficulty: number  // 0-100
): { lower: number; upper: number } {
  // 難しい課題 → 低覚醒が最適（集中が必要）
  // 簡単な課題 → 高覚醒でもOK（退屈防止）
  const center = 60 - (taskDifficulty / 100) * 15  // 45-60 の範囲
  return {
    lower: Math.max(30, center - 10),
    upper: Math.min(80, center + 10),
  }
}
