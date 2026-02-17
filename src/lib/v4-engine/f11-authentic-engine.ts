/**
 * F11: 真正文脈学習 (Authentic Context Learning) エンジン
 * 
 * 理論的根拠:
 * - Herrington & Oliver (2000): 真正な学習環境の9要素
 * - Lave & Wenger (1991): 状況的学習理論 — 正統的周辺参加 (LPP)
 * - Brown, Collins & Duguid (1989): 認知的徒弟制度 — 知識は文脈に埋め込まれている
 * 
 * 核心: 学びを「教室の中だけのもの」にしない。
 *       実生活・地域社会との接点を作ることで、
 *       学びが「自分のもの」になり、忍耐力（学習時間配当）が向上する。
 * 
 * 子ども観(v4): 「この子にとって学びは『自分のもの』になっているか」を理解する視座。
 * Carroll作用: 有効学習時間を増加（意味づけ → 忍耐力の向上）
 */

import type {
  F11_AuthenticProfile,
  ArchetypeId,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: 真正性レベルの評価
// ============================================================

/** 真正性レベル */
export type AuthenticityLevel = 'high' | 'moderate' | 'low'

/** F11から導出される制御パラメータ */
export interface F11_FullControls {
  /** 真正性レベル */
  level: AuthenticityLevel
  /** 実生活との接続ポイント */
  real_world_connection: string
  /** 本物の文脈での課題設定 */
  authentic_task_framing: boolean
  /** 地域・社会との関連づけ */
  community_relevance: boolean
  /** 推論の根拠 */
  reasoning: string
}

/**
 * 真正性レベルを評価する
 */
export function assessAuthenticityLevel(
  profile: F11_AuthenticProfile,
): AuthenticityLevel {
  const average = (profile.personal_relevance + 
    profile.real_world_connection_awareness + 
    profile.community_participation) / 3

  if (average >= 60) return 'high'
  if (average >= 35) return 'moderate'
  return 'low'
}

// ============================================================
// Part 2: 実生活接続の制御
// ============================================================

/**
 * 実生活との接続ポイントのメッセージを生成する
 * 
 * 原則:
 * - 真正性が低い子: 身近な例から接続（「お買い物で使うよ」）
 * - 真正性が高い子: より深い社会的接続（「この問題を解くと…」）
 */
export function generateRealWorldConnection(
  profile: F11_AuthenticProfile,
  archetype: ArchetypeId,
): string {
  const level = assessAuthenticityLevel(profile)

  switch (level) {
    case 'low':
      return '身近な日常生活の場面と結びつけて提示（買い物、料理、遊びなど）'
    case 'moderate':
      return '家庭・学校生活での具体的な活用場面を示す'
    case 'high':
      return '地域社会の課題や実際の問題解決と結びつけて提示'
  }
}

/**
 * 本物の文脈での課題設定をすべきか
 * 
 * 真正性が低い子こそ必要だが、Type H は認知負荷に注意
 */
export function shouldFrameAuthenticTask(
  profile: F11_AuthenticProfile,
  archetype: ArchetypeId,
): boolean {
  // Type H: 最小限の文脈で認知負荷を抑える
  if (archetype === 'H') return false

  // 真正性が低い・中程度: 文脈づけで動機を高める
  const level = assessAuthenticityLevel(profile)
  return level !== 'high'  // 高い子はすでに内在化しているので不要
}

/**
 * 地域・社会との関連づけをすべきか
 */
export function shouldConnectCommunity(
  profile: F11_AuthenticProfile,
  archetype: ArchetypeId,
): boolean {
  // community_participationがある程度あり、かつ真正性がまだ成長途上
  if (profile.community_participation < 20) return false
  if (archetype === 'H') return false
  return profile.personal_relevance < 70
}

// ============================================================
// Part 3: F11制御パラメータの全体算出
// ============================================================

/**
 * F11の全制御パラメータを算出
 */
export function computeF11Controls(
  profile: F11_AuthenticProfile,
  archetype: ArchetypeId,
): F11_FullControls {
  const level = assessAuthenticityLevel(profile)
  const real_world_connection = generateRealWorldConnection(profile, archetype)
  const authentic_task_framing = shouldFrameAuthenticTask(profile, archetype)
  const community_relevance = shouldConnectCommunity(profile, archetype)

  const reasoning = `真正性=${level}(個人的関連=${profile.personal_relevance}, ` +
    `実世界=${profile.real_world_connection_awareness}, ` +
    `地域参加=${profile.community_participation}), ` +
    `タスク文脈=${authentic_task_framing ? 'ON' : 'OFF'}, ` +
    `地域接続=${community_relevance ? 'ON' : 'OFF'}`

  return {
    level,
    real_world_connection,
    authentic_task_framing,
    community_relevance,
    reasoning,
  }
}

// ============================================================
// Part 4: 統合制御への適用
// ============================================================

/**
 * F11制御パラメータを統合制御パラメータのpresentationセクションに適用
 */
export function applyF11ToControls(
  controls: IntegratedControlParameters,
  f11Controls: F11_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }
  updated.presentation = {
    ...updated.presentation,
    real_world_connection: f11Controls.real_world_connection,
  }
  return updated
}
