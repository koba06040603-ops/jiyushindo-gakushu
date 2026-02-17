/**
 * F1: 感覚チャネル最適化 (Sensory Channel Optimization) エンジン
 * 
 * 理論的根拠:
 * - Pashler et al. (2008): meshing hypothesis を否定
 *   → 「学習スタイルに合わせる」だけでは効果がない
 * - Mayer (2009): マルチメディア学習原理 d=0.72
 *   → モダリティ効果、冗長性効果は堅固に再現
 * - Paivio (1986): 二重符号化理論 (Dual Coding Theory)
 *   → 視覚と言語の二経路で符号化すると記憶保持が向上
 * 
 * 核心:「スタイルに合わせる」のではなく
 *       **「優位チャネルで入口を作り、別チャネルで多重符号化する」**
 *       — これがPashlerの否定とMayerの肯定を両立させる設計
 * 
 * 子ども観(v4): 「この子はどう世界を受け取っているか」を理解する視座。
 * Carroll作用: 必要学習時間を減少（認知負荷の最適化）
 */

import type {
  F1_SensoryProfile,
  F2_IntelligenceProfile,
  ArchetypeId,
  RealtimeBehaviorData,
  IntegratedControlParameters,
} from './types'

// ============================================================
// Part 1: 入口チャネルの決定
// ============================================================

/** チャネルの種類 */
export type SensoryChannel = 'visual' | 'auditory' | 'reading' | 'kinesthetic'

/** モダリティウェイト */
export interface ModalityWeights {
  visual: number      // 0.0-1.0
  auditory: number    // 0.0-1.0
  text: number        // 0.0-1.0
  kinesthetic: number // 0.0-1.0
}

/**
 * 入口チャネルを決定する
 * 
 * 設計書の原則:
 * - 最も処理効率が高いチャネルで「入口」を作る
 * - これは meshing ではない: 入口は1つ、その後多重符号化
 */
export function determineEntryChannel(
  profile: F1_SensoryProfile,
): { channel: SensoryChannel; confidence: number; reasoning: string } {
  const channels: { channel: SensoryChannel; efficiency: number }[] = [
    { channel: 'visual', efficiency: profile.visual_processing_efficiency },
    { channel: 'auditory', efficiency: profile.auditory_processing_efficiency },
    { channel: 'reading', efficiency: profile.reading_processing_efficiency },
    { channel: 'kinesthetic', efficiency: profile.kinesthetic_processing_efficiency },
  ]

  // 効率順にソート
  channels.sort((a, b) => b.efficiency - a.efficiency)
  const best = channels[0]
  const second = channels[1]

  // 確信度: 最良と次点の差が大きいほど確信度が高い
  const gap = best.efficiency - second.efficiency
  const confidence = Math.min(1.0, gap / 30 + 0.5)  // 差30以上で確信度1.0

  const channelNames: Record<SensoryChannel, string> = {
    visual: '視覚', auditory: '聴覚', reading: '読字', kinesthetic: '体感',
  }

  return {
    channel: best.channel,
    confidence,
    reasoning: `最優位: ${channelNames[best.channel]}(${best.efficiency}) > ${channelNames[second.channel]}(${second.efficiency}), 確信度=${confidence.toFixed(2)}`,
  }
}

// ============================================================
// Part 2: 多重符号化チャネルの選定
// ============================================================

/**
 * 多重符号化に使う追加チャネルを選定する
 * 
 * Paivio (1986) の二重符号化理論:
 * - 入口チャネルとは**異なる**モダリティを1-2個追加
 * - 視覚入口 → 言語/聴覚で追加符号化
 * - 言語入口 → 視覚で追加符号化
 * - 冗長性効果に注意: 同じ情報を同じモダリティで重複させない
 */
export function selectEncodingChannels(
  profile: F1_SensoryProfile,
  entryChannel: SensoryChannel,
): { channels: SensoryChannel[]; reasoning: string } {
  const allChannels: { channel: SensoryChannel; efficiency: number }[] = [
    { channel: 'visual', efficiency: profile.visual_processing_efficiency },
    { channel: 'auditory', efficiency: profile.auditory_processing_efficiency },
    { channel: 'reading', efficiency: profile.reading_processing_efficiency },
    { channel: 'kinesthetic', efficiency: profile.kinesthetic_processing_efficiency },
  ]

  // 入口チャネルを除外し、効率順にソート
  const candidates = allChannels
    .filter(c => c.channel !== entryChannel)
    .sort((a, b) => b.efficiency - a.efficiency)

  // 二重符号化の原則: 異なるモダリティ系統から選ぶ
  // 視覚系（visual）と言語系（reading, auditory）は異なるモダリティ系統
  const isVisualEntry = entryChannel === 'visual' || entryChannel === 'kinesthetic'
  const isVerbalEntry = entryChannel === 'reading' || entryChannel === 'auditory'

  let selected: SensoryChannel[] = []

  if (isVisualEntry) {
    // 視覚系入口 → 言語系を優先的に追加（真の二重符号化）
    const verbalCandidates = candidates.filter(c => c.channel === 'reading' || c.channel === 'auditory')
    if (verbalCandidates.length > 0) {
      selected.push(verbalCandidates[0].channel)
    }
    // 2つ目は残りの最効率チャネル
    const remaining = candidates.filter(c => !selected.includes(c.channel))
    if (remaining.length > 0 && remaining[0].efficiency > 30) {
      selected.push(remaining[0].channel)
    }
  } else if (isVerbalEntry) {
    // 言語系入口 → 視覚系を優先的に追加
    const visualCandidates = candidates.filter(c => c.channel === 'visual' || c.channel === 'kinesthetic')
    if (visualCandidates.length > 0) {
      selected.push(visualCandidates[0].channel)
    }
    const remaining = candidates.filter(c => !selected.includes(c.channel))
    if (remaining.length > 0 && remaining[0].efficiency > 30) {
      selected.push(remaining[0].channel)
    }
  }

  // 最低1チャネルは確保
  if (selected.length === 0 && candidates.length > 0) {
    selected.push(candidates[0].channel)
  }

  return {
    channels: selected,
    reasoning: `入口=${entryChannel} → 追加符号化=[${selected.join(', ')}] (二重符号化理論)`,
  }
}

// ============================================================
// Part 3: モダリティウェイトの算出
// ============================================================

/**
 * 各モダリティの配分ウェイトを算出する
 * 
 * 入口チャネルに最大ウェイト、符号化チャネルに追加ウェイトを配分
 * 合計は1.0に正規化
 */
export function computeModalityWeights(
  profile: F1_SensoryProfile,
  entryChannel: SensoryChannel,
  encodingChannels: SensoryChannel[],
): ModalityWeights {
  // 基本ウェイト: 処理効率に比例
  const raw = {
    visual: profile.visual_processing_efficiency,
    auditory: profile.auditory_processing_efficiency,
    text: profile.reading_processing_efficiency,
    kinesthetic: profile.kinesthetic_processing_efficiency,
  }

  // 入口チャネルにブースト
  const channelToWeight: Record<SensoryChannel, keyof ModalityWeights> = {
    visual: 'visual', auditory: 'auditory', reading: 'text', kinesthetic: 'kinesthetic',
  }
  raw[channelToWeight[entryChannel]] *= 2.0  // 入口は2倍

  // 符号化チャネルにもブースト
  for (const ch of encodingChannels) {
    raw[channelToWeight[ch]] *= 1.5
  }

  // 正規化
  const total = raw.visual + raw.auditory + raw.text + raw.kinesthetic
  return {
    visual: Number((raw.visual / total).toFixed(3)),
    auditory: Number((raw.auditory / total).toFixed(3)),
    text: Number((raw.text / total).toFixed(3)),
    kinesthetic: Number((raw.kinesthetic / total).toFixed(3)),
  }
}

// ============================================================
// Part 4: マルチモーダル度の評価
// ============================================================

/**
 * この子がマルチモーダル型かシングルモーダル型かを評価する
 * 
 * multimodal_index が高い子は複数チャネルを同時に活用できる
 * → 符号化チャネルを増やしてよい
 * 
 * multimodal_index が低い子は1チャネルに集中する
 * → 入口チャネルに集中、符号化は1チャネルのみ
 */
export function assessMultimodalCapacity(
  profile: F1_SensoryProfile,
): { capacity: 'high' | 'medium' | 'low'; max_channels: number; reasoning: string } {
  const idx = profile.multimodal_index

  if (idx >= 70) {
    return {
      capacity: 'high',
      max_channels: 3,  // 入口 + 2符号化
      reasoning: `マルチモーダル度${idx} → 高: 3チャネル同時活用可`,
    }
  }
  if (idx >= 40) {
    return {
      capacity: 'medium',
      max_channels: 2,  // 入口 + 1符号化
      reasoning: `マルチモーダル度${idx} → 中: 2チャネル活用`,
    }
  }
  return {
    capacity: 'low',
    max_channels: 1,  // 入口のみ（符号化は最小限）
    reasoning: `マルチモーダル度${idx} → 低: 1チャネルに集中`,
  }
}

// ============================================================
// Part 5: F1制御パラメータの全体算出
// ============================================================

/** F1から導出される感覚チャネル制御パラメータの全体 */
export interface F1_FullControls {
  /** 入口チャネル */
  entry: {
    channel: SensoryChannel
    confidence: number
  }
  /** 多重符号化チャネル */
  encoding: {
    channels: SensoryChannel[]
  }
  /** モダリティウェイト */
  modality_weights: ModalityWeights
  /** マルチモーダル容量 */
  multimodal: {
    capacity: 'high' | 'medium' | 'low'
    max_channels: number
  }
  /** 推論の根拠 */
  reasoning: string
}

/**
 * F1の全制御パラメータを算出
 */
export function computeF1Controls(
  profile: F1_SensoryProfile,
  archetype: ArchetypeId,
): F1_FullControls {
  // 入口チャネル
  const entryResult = determineEntryChannel(profile)

  // マルチモーダル容量
  const multimodal = assessMultimodalCapacity(profile)

  // 多重符号化チャネル（容量制限を適用）
  const encodingResult = selectEncodingChannels(profile, entryResult.channel)
  const limitedChannels = encodingResult.channels.slice(0, multimodal.max_channels - 1)

  // アーキタイプ補正
  // Type H/G: 認知負荷を最小化 → 符号化チャネルを最小限に
  let finalChannels = limitedChannels
  if (archetype === 'H') {
    finalChannels = limitedChannels.slice(0, 1)  // 最大1チャネル
  }

  // モダリティウェイト
  const weights = computeModalityWeights(profile, entryResult.channel, finalChannels)

  return {
    entry: { channel: entryResult.channel, confidence: entryResult.confidence },
    encoding: { channels: finalChannels },
    modality_weights: weights,
    multimodal: { capacity: multimodal.capacity, max_channels: multimodal.max_channels },
    reasoning: `${entryResult.reasoning}。符号化=[${finalChannels.join(', ')}]。${multimodal.reasoning}`,
  }
}

// ============================================================
// Part 6: F1制御パラメータから IntegratedControlParameters への適用
// ============================================================

/**
 * F1制御パラメータを統合制御パラメータのpresentationセクションに適用する
 */
export function applyF1ToControls(
  controls: IntegratedControlParameters,
  f1Controls: F1_FullControls,
): IntegratedControlParameters {
  const updated = { ...controls }
  updated.presentation = {
    ...updated.presentation,
    entry_channel: f1Controls.entry.channel,
    encoding_channels: f1Controls.encoding.channels,
  }
  return updated
}
