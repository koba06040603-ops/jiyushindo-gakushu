/**
 * v4統合制御エンジン — 型定義
 * 
 * 設計文書: THEORY_CAUSAL_MODEL.md (Version 2.0, v4子ども観統合版)
 * 基本思想: 「子どもは今この瞬間、学んでいる。12の視座で理解し、理解に基づいて応じる。」
 * 
 * Phase 1 実装対象: F4 (適性×指導交互作用) + F7 (動的随伴足場) + F12 (感情-認知統合)
 * 全12理論の型を定義し、Phase 1 で使用する F4/F7/F12 を先行実装する。
 */

// ============================================================
// Part 1: 12理論 測定プロファイル（子どもの今の姿を映す12の視座）
// ============================================================

/** F1: 感覚チャネル最適化 — この子はどう世界を受け取っているか */
export interface F1_SensoryProfile {
  visual_processing_efficiency: number    // 0-100
  auditory_processing_efficiency: number  // 0-100
  reading_processing_efficiency: number   // 0-100
  kinesthetic_processing_efficiency: number // 0-100
  multimodal_index: number               // マルチモーダル度
}

/** F2: 多元的入口 — この子はどんな道筋で理解に向かうか */
export interface F2_IntelligenceProfile {
  linguistic: number          // 0-100
  logical_mathematical: number // 0-100
  spatial: number             // 0-100
  bodily_kinesthetic: number  // 0-100
  musical: number             // 0-100
  interpersonal: number       // 0-100
  intrapersonal: number       // 0-100
  naturalist: number          // 0-100
  growth_mindset: number      // 0-100 (Dweck 2006)
}

/** F3: 経験変容学習 — この子は経験をどう意味に変えているか */
export interface F3_ExperientialProfile {
  ce_preference: number  // 0-100: 具体的経験
  ro_preference: number  // 0-100: 省察的観察
  ac_preference: number  // 0-100: 抽象的概念化
  ae_preference: number  // 0-100: 能動的実験
  cycle_completion_rate: number  // 0-1
  dominant_style: 'diverging' | 'assimilating' | 'converging' | 'accommodating'
}

/** F4: 適性×指導交互作用 — この子はどんな環境で動きやすいか (Phase 1) */
export interface F4_AptitudeProfile {
  prior_knowledge: number        // 0-100: 当該単元の事前知識量
  general_cognitive_ability: number // 0-100: 一般認知能力
  anxiety_level: number          // 0-100: 学習不安 (高い=不安が強い)
  independence_level: number     // 0-100: 学習独立性 (高い=自律的)
  locus_of_control: number       // 0-100: 統制の所在 (高い=内的統制)
}

/** F5: 多位相自己調整学習 — この子は自分の学びにどう舵を取っているか */
export interface F5_SRLProfile {
  forethought: {
    task_analysis: number      // 0-100
    goal_setting: number       // 0-100
    strategic_planning: number // 0-100
    self_efficacy: number      // 0-100
    outcome_expectation: number // 0-100
    intrinsic_interest: number // 0-100
  }
  performance: {
    attention_focusing: number   // 0-100
    self_instruction: number     // 0-100
    task_strategy_use: number    // 0-100
    self_monitoring: number      // 0-100
    metacognitive_awareness: number // 0-100
  }
  self_reflection: {
    self_evaluation: number     // 0-100
    causal_attribution: number  // 0-100 (高い=努力帰属)
    self_satisfaction: number   // 0-100
    adaptive_inference: number  // 0-100
  }
  developmental_level: 'observation' | 'emulation' | 'self_control' | 'self_regulation'
}

/** F6: 条件付き認知方略 — この子は「知りたい」「覚えたい」にどう向かっているか */
export interface F6_StrategyProfile {
  retrieval_practice_readiness: number  // 0-100
  spacing_optimal_gap: number           // 日数
  interleaving_readiness: boolean       // 交互配置の前提条件充足
  elaboration_prior_knowledge: number   // 0-100
  mastery_level_for_current_unit: number // 0-100: 現在単元の習得度
}

/** F7: 動的随伴足場 — この子は手を伸ばしてどこまで届くか (Phase 1) */
export interface F7_ScaffoldProfile {
  zpd_lower_bound: number    // 0-100: 自力到達可能な難易度
  zpd_upper_bound: number    // 0-100: 支援下で到達可能な難易度
  zpd_width: number          // 上限−下限
  current_performance: number // 0-100
  scaffold_dependency: number // 0-100: 足場への依存度
  consecutive_success: number // 連続正解数
  consecutive_failure: number // 連続不正解数
}

/** F8: 三欲求統合動機 — この子は何を求めているか */
export interface F8_MotivationProfile {
  autonomy_satisfaction: number      // 0-100
  competence_satisfaction: number    // 0-100
  relatedness_satisfaction: number   // 0-100
  motivation_quality: 'external' | 'introjected' | 'identified' | 'integrated' | 'intrinsic'
  motivation_continuum_score: number  // 0-100: 外的(0)→内発的(100)
  isolated_autonomy: boolean   // 自律性高+関係性低
  fragile_competence: boolean  // 有能感が社会比較に依存
  surface_autonomy: boolean    // 選択はあるが理由の内在化なし
}

/** F9: 21世紀型メタ認知 — この子は自分の考えを見つめられているか */
export interface F9_MetacognitiveProfile {
  metacognitive_knowledge: number   // 0-100
  metacognitive_regulation: number  // 0-100
  critical_thinking: number         // 0-100
  creative_thinking: number         // 0-100
}

/** F10: 教科固有認知 — この子はその教科の「見方」を身につけつつあるか */
export interface F10_DomainProfile {
  domain_knowledge_stage: 'acclimation' | 'competence' | 'proficiency'  // Alexander MDL
  misconceptions: string[]          // 既知の誤概念
  knowledge_structure_depth: number // 0-100
}

/** F11: 真正文脈学習 — この子にとって学びは「自分のもの」になっているか */
export interface F11_AuthenticProfile {
  personal_relevance: number        // 0-100
  real_world_connection_awareness: number // 0-100
  community_participation: number   // 0-100
}

/** F12: 感情-認知統合 — この子は今どんな気持ちで学んでいるか (Phase 1) */
export interface F12_AffectProfile {
  current_arousal: number       // 0-100: 覚醒度 (最適=50-70)
  current_valence: number       // -100〜+100: 感情の価値
  academic_enjoyment: number    // 0-100
  academic_anxiety: number      // 0-100
  academic_boredom: number      // 0-100
  flow_state_probability: number // 0-1
}

// ============================================================
// Part 2: 12理論の全プロファイルを統合した「子どもの姿」
// ============================================================

/** 12の視座すべてから見た子どもの今の姿 */
export interface AllTheoryProfiles {
  F1: F1_SensoryProfile
  F2: F2_IntelligenceProfile
  F3: F3_ExperientialProfile
  F4: F4_AptitudeProfile
  F5: F5_SRLProfile
  F6: F6_StrategyProfile
  F7: F7_ScaffoldProfile
  F8: F8_MotivationProfile
  F9: F9_MetacognitiveProfile
  F10: F10_DomainProfile
  F11: F11_AuthenticProfile
  F12: F12_AffectProfile
}

// ============================================================
// Part 3: 5つの基幹軸 — プロファイル空間の次元削減
// ============================================================

/** 子どもの今の姿を5つの軸で描写する */
export interface FundamentalAxes {
  /** 軸1: 認知的自律度 (F5×F4×F9) 0-100 */
  cognitive_autonomy: number
  /** 軸2: 感情的安定度 ((100-F4.anxiety)×F12.valence×F8.competence) 0-100 */
  emotional_stability: number
  /** 軸3: 認知的入口選好 (F1×F2ベクトル) — 表示モード最適化用 */
  entry_channel_preference: {
    primary_sensory: keyof F1_SensoryProfile
    primary_intelligence: keyof F2_IntelligenceProfile
  }
  /** 軸4: 方略的成熟度 (F6.mastery×F6.readiness) 0-100 */
  strategic_maturity: number
  /** 軸5: 動機的エネルギー (F8.continuum×F11.relevance×F12.flow) 0-100 */
  motivational_energy: number
}

// ============================================================
// Part 4: 8つの姿（アーキタイプ）— 子どもが今どんなふうに学んでいるか
// ============================================================

/**
 * アーキタイプは分類ではない。
 * 「今この子がどんなふうに学んでいるか」の描写である。
 * 同じ子が、月曜日にはAで、水曜日にはDであることもある。
 */
export type ArchetypeId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H'

export interface ArchetypeDescription {
  id: ArchetypeId
  name_ja: string
  name_en: string
  /** この子の今の姿（v4: 子ども中心の描写） */
  presence: string
  /** 12の視座で見ると */
  perspectives: string
  /** 応じ方 */
  response: string
  /** 各基幹軸の水準 */
  axis_levels: {
    cognitive_autonomy: 'H' | 'M' | 'L'
    emotional_stability: 'H' | 'M' | 'L'
    strategic_maturity: 'H' | 'M' | 'L'
    motivational_energy: 'H' | 'M' | 'L'
  }
  /** 推定出現率 */
  estimated_frequency: number
}

/** 8つの姿の定義 */
export const ARCHETYPES: Record<ArchetypeId, ArchetypeDescription> = {
  A: {
    id: 'A',
    name_ja: '自律的探究者',
    name_en: 'Autonomous Explorer',
    presence: '知りたいことがあり、自分のやり方で進んでいる。夢中になっている。',
    perspectives: '舵取り(F5)が育ち、感情(F12)は安定し、方略(F6)を自分で選び、学びが自分のもの(F11)になっている。',
    response: 'この子のそばにいる。求められたら応じる。最善の応答は、邪魔をしないこと。',
    axis_levels: { cognitive_autonomy: 'H', emotional_stability: 'H', strategic_maturity: 'H', motivational_energy: 'H' },
    estimated_frequency: 0.08,
  },
  B: {
    id: 'B',
    name_ja: '堅実な努力家',
    name_en: 'Steady Worker',
    presence: 'コツコツと取り組んでいる。着実に前に進んでいる。',
    perspectives: '感情(F12)が安定し、動機(F8)のエネルギーがある。方略(F6)と舵取り(F5)は伸びしろがある。',
    response: '見守りながら、少しずつ高い方略への道を拓く。',
    axis_levels: { cognitive_autonomy: 'M', emotional_stability: 'H', strategic_maturity: 'M', motivational_energy: 'H' },
    estimated_frequency: 0.15,
  },
  C: {
    id: 'C',
    name_ja: '直感的冒険者',
    name_en: 'Intuitive Adventurer',
    presence: '直感で動く。型にはまらない。面白いものに飛びつく。',
    perspectives: '感情(F12)は安定しているが、方略(F6)が未成熟。動機(F8)はあるが持続に課題。',
    response: '冒険を認めつつ、振り返りの習慣を静かに育てる。',
    axis_levels: { cognitive_autonomy: 'M', emotional_stability: 'H', strategic_maturity: 'L', motivational_energy: 'M' },
    estimated_frequency: 0.10,
  },
  D: {
    id: 'D',
    name_ja: '慎重な完璧主義者',
    name_en: 'Cautious Perfectionist',
    presence: '丁寧に考える力がある。でも「間違えたらどうしよう」が先に来る。それでも前に進もうとしている。',
    perspectives: '舵取り(F5)と方略(F6)はあるが、感情(F12)の不安が強く、有能感(F8)が揺らぎやすい。',
    response: '「間違えても大丈夫」を言葉ではなく体験で伝える。安心できる環境を。この子の慎重さは強み。',
    axis_levels: { cognitive_autonomy: 'H', emotional_stability: 'L', strategic_maturity: 'H', motivational_energy: 'L' },
    estimated_frequency: 0.12,
  },
  E: {
    id: 'E',
    name_ja: '社交的学習者',
    name_en: 'Social Learner',
    presence: '友達と一緒だと輝く。人との関わりの中で学ぶ。',
    perspectives: '関係性(F8)が高く、動機(F8)のエネルギーがある。認知(F5)と方略(F6)は中程度。',
    response: '関わり合いの力を活かしつつ、一人でも進める力を育てる。',
    axis_levels: { cognitive_autonomy: 'M', emotional_stability: 'M', strategic_maturity: 'M', motivational_energy: 'H' },
    estimated_frequency: 0.15,
  },
  F: {
    id: 'F',
    name_ja: '不安定な挑戦者',
    name_en: 'Unstable Challenger',
    presence: '挑戦したい気持ちはある。でも感情の波が大きい。良い時と悪い時の差が激しい。',
    perspectives: '感情(F12)の安定度が低く、不安(F4)が高い。方略(F6)の道具箱がまだ少ない。',
    response: '感情の安定を最優先に。良い波の時にそっと方略を渡す。',
    axis_levels: { cognitive_autonomy: 'L', emotional_stability: 'L', strategic_maturity: 'L', motivational_energy: 'M' },
    estimated_frequency: 0.12,
  },
  G: {
    id: 'G',
    name_ja: '受動的依存者',
    name_en: 'Passive Dependent',
    presence: 'ノートを開いているが、鉛筆が動かない。でもこの子の中にも力はある。',
    perspectives: '舵取り(F5)がまだ小さく、学びが自分のもの(F11)になっていない。方略(F6)の道具箱が少ない。',
    response: '小さな「できた」の体験を丁寧に積む。「なぜ学ぶか」が自分事になる瞬間は、必ず来る。待つ。',
    axis_levels: { cognitive_autonomy: 'L', emotional_stability: 'M', strategic_maturity: 'L', motivational_energy: 'L' },
    estimated_frequency: 0.18,
  },
  H: {
    id: 'H',
    name_ja: '学習回避者',
    name_en: 'Learning Avoider',
    presence: '机に伏せている。あるいは窓の外を見ている。でも、この子の中にも力はある。今は深く眠っている。',
    perspectives: '感情(F12)の安全が確保されていない可能性が高い。求めているもの(F8)のいずれもが満たされていない。',
    response: 'まず「ここにいていい」。安全を。小さな興味の芽を見逃さない。教師との連携が特に大切。',
    axis_levels: { cognitive_autonomy: 'L', emotional_stability: 'L', strategic_maturity: 'L', motivational_energy: 'L' },
    estimated_frequency: 0.10,
  },
}

// ============================================================
// Part 5: 統合制御パラメータ — AIが実際に制御する変数
// ============================================================

/** 12理論から導出される統合制御パラメータの完全な型 */
export interface IntegratedControlParameters {
  /** 表示・提示の制御 */
  presentation: {
    entry_channel: 'visual' | 'auditory' | 'reading' | 'kinesthetic'  // F1
    encoding_channels: string[]                                         // F1
    concept_entry_intelligence: string                                  // F2
    fallback_intelligence: string                                       // F2
    kolb_entry_phase: 'CE' | 'RO' | 'AC' | 'AE'                       // F3
    domain_thinking_prompt: string                                      // F10
    real_world_connection: string                                       // F11
  }

  /** 構造・難易度の制御 */
  structure: {
    structure_level: number           // F4: 0.0-1.0 (連続値)
    difficulty_zpd_position: number   // F7: 0.0-1.0
    solution_path_openness: number    // F4: 0.0-1.0
    error_tolerance: number           // F4: 0.0-1.0
  }

  /** 足場の制御 */
  scaffold: {
    // 認知的足場 (F7の6機能)
    recruitment: boolean
    reduction_of_dof: number             // 0.0-1.0
    direction_maintenance: boolean
    marking_critical: boolean
    demonstration_level: 'none' | 'partial' | 'full'
    // 動機付け的足場 (F7+F8+F12)
    frustration_control: boolean
    encouragement: boolean
    soft_language: boolean
    // 随伴ルール (F7)
    success_threshold_to_fade: number
    failure_threshold_to_add: number
    fade_rate: number                    // 0.0-1.0
    // ヒント制御 (F4+F7)
    hint_proactiveness: number           // 0.0-1.0
  }

  /** 認知方略の制御 */
  cognitive_strategy: {
    retrieval_mode: 'recognition' | 'cued_recall' | 'free_recall'  // F6
    retrieval_with_feedback: boolean                                 // F6
    spacing_interval_days: number                                    // F6
    interleaving_enabled: boolean                                    // F6 (条件付き)
    interleaving_ratio: number                                       // F6
    elaboration_prompt_type: 'why' | 'how' | 'compare' | 'connect' | 'none'  // F6
  }

  /** 自己調整学習の制御 */
  srl: {
    goal_prompt_type: 'none' | 'template' | 'example' | 'guided'    // F5
    self_monitoring_interval: number                                  // F5
    reflection_prompt_type: 'none' | 'binary' | 'scaled' | 'open_ended'  // F5
    attribution_guidance: boolean                                     // F5
    think_aloud_modeling: boolean                                     // F5
    improvement_planning: boolean                                     // F5
  }

  /** 動機づけ・感情の制御 */
  motivation: {
    progress_display: 'self_growth' | 'none'                          // F8
    mastery_criteria: 'absolute'                                      // F8
    language_style: 'inviting' | 'directive'                          // F8
    choice_with_rationale: boolean                                    // F8
    arousal_regulation: 'increase' | 'maintain' | 'decrease'          // F12
    emotional_message_type: 'encouraging' | 'calming' | 'neutral'    // F12
    peer_sharing_opportunity: boolean                                  // F8
    micro_success_feedback: boolean                                    // F8+F7
  }

  /** 特別フラグ (Type H 等) */
  _teacher_alert: boolean
  _human_intervention_recommended: boolean
}

// ============================================================
// Part 6: リアルタイム行動データ — 子どもの「今」を観察する
// ============================================================

/** 直近の学習行動から観察される「今」のデータ */
export interface RealtimeBehaviorData {
  /** 連続正解数 */
  consecutive_successes: number
  /** 連続不正解数 */
  consecutive_errors: number
  /** 直近セッションの正答率 (0-1) */
  recent_accuracy: number
  /** 直近の応答時間 (ms) */
  recent_response_time_ms: number
  /** ヒント使用回数 (直近セッション) */
  hint_usage_count: number
  /** アイドル時間 (秒) — 長時間無操作の検出 */
  idle_time_seconds: number
  /** 直近の感情推定（UIインタラクションパターンから） */
  estimated_affect: {
    arousal: number   // 0-100
    valence: number   // -100〜+100
  }
  /** 現在のSRL位相（行動パターンから推定） */
  current_srl_phase: 'forethought' | 'performance' | 'self_reflection' | 'unknown'
  /** セッション開始からの経過時間 (分) */
  session_duration_minutes: number
  /** 現在の問題の難易度レベル */
  current_problem_difficulty: number  // 0-100
}

// ============================================================
// Part 7: アーキタイプ遷移モデル
// ============================================================

/** 姿の変化を理解する基準 */
export interface TransitionCriteria {
  from: ArchetypeId
  to: ArchetypeId
  conditions: TransitionCondition[]
  /** すべての条件を満たす必要がある期間（週） */
  sustained_weeks: number
}

export interface TransitionCondition {
  metric: string
  operator: '>=' | '<=' | '>' | '<' | '=='
  threshold: number
}

/** 設計書に定義された遷移パス */
export const TRANSITION_PATHS: TransitionCriteria[] = [
  {
    from: 'G', to: 'F',
    conditions: [
      { metric: 'recent_accuracy', operator: '>=', threshold: 0.60 },
      { metric: 'F5.forethought.goal_setting', operator: '>=', threshold: 40 },
    ],
    sustained_weeks: 3,
  },
  {
    from: 'F', to: 'E',
    conditions: [
      { metric: 'F4.anxiety_level', operator: '<=', threshold: 50 },
      { metric: 'F8.relatedness_satisfaction', operator: '>=', threshold: 50 },
    ],
    sustained_weeks: 2,
  },
  {
    from: 'F', to: 'B',
    conditions: [
      { metric: 'F4.anxiety_level', operator: '<=', threshold: 50 },
      { metric: 'F6.mastery_level_for_current_unit', operator: '>=', threshold: 50 },
    ],
    sustained_weeks: 2,
  },
  {
    from: 'D', to: 'B',
    conditions: [
      { metric: 'F4.anxiety_level', operator: '<=', threshold: 50 },
      { metric: 'F8.motivation_continuum_score', operator: '>=', threshold: 50 },
    ],
    sustained_weeks: 4,
  },
  {
    from: 'B', to: 'A',
    conditions: [
      { metric: 'F5.developmental_level', operator: '==', threshold: 4 }, // self_regulation
      { metric: 'axes.cognitive_autonomy', operator: '>=', threshold: 60 },
      { metric: 'axes.emotional_stability', operator: '>=', threshold: 60 },
      { metric: 'axes.strategic_maturity', operator: '>=', threshold: 60 },
      { metric: 'axes.motivational_energy', operator: '>=', threshold: 60 },
    ],
    sustained_weeks: 4,
  },
]

// ============================================================
// Part 8: 因果チェーンマトリクス — 理論間の相互影響
// ============================================================

/**
 * 横断的相互作用マトリクス
 * influence_matrix[A][B] = A が B に与える影響の強さ (0.0-1.0)
 * 設計書 Part 3.3 より
 */
export const INFLUENCE_MATRIX: Record<string, Record<string, number>> = {
  F1:  { F1: 0, F2: 0.2, F3: 0.1, F4: 0.3, F5: 0, F6: 0.2, F7: 0, F8: 0, F9: 0, F10: 0, F11: 0, F12: 0 },
  F2:  { F1: 0.2, F2: 0, F3: 0.2, F4: 0, F5: 0, F6: 0, F7: 0.1, F8: 0.1, F9: 0.2, F10: 0.3, F11: 0, F12: 0 },
  F3:  { F1: 0, F2: 0, F3: 0, F4: 0, F5: 0.3, F6: 0, F7: 0, F8: 0.2, F9: 0.3, F10: 0.2, F11: 0.4, F12: 0 },
  F4:  { F1: 0.3, F2: 0, F3: 0, F4: 0, F5: 0, F6: 0, F7: 0.4, F8: 0.3, F9: 0, F10: 0, F11: 0, F12: 0.3 },
  F5:  { F1: 0, F2: 0, F3: 0.3, F4: 0, F5: 0, F6: 0.5, F7: 0, F8: 0.4, F9: 0.3, F10: 0, F11: 0, F12: 0.2 },
  F6:  { F1: 0.2, F2: 0, F3: 0, F4: 0, F5: 0.5, F6: 0, F7: 0, F8: 0, F9: 0, F10: 0.2, F11: 0, F12: 0 },
  F7:  { F1: 0, F2: 0.1, F3: 0, F4: 0.4, F5: 0, F6: 0, F7: 0, F8: 0.5, F9: 0, F10: 0, F11: 0, F12: 0.3 },
  F8:  { F1: 0, F2: 0.1, F3: 0.2, F4: 0.3, F5: 0.4, F6: 0, F7: 0.5, F8: 0, F9: 0, F10: 0, F11: 0.3, F12: 0.4 },
  F9:  { F1: 0, F2: 0.2, F3: 0.3, F4: 0, F5: 0.3, F6: 0, F7: 0, F8: 0, F9: 0, F10: 0.2, F11: 0.3, F12: 0 },
  F10: { F1: 0, F2: 0.3, F3: 0.2, F4: 0, F5: 0, F6: 0.2, F7: 0, F8: 0, F9: 0.2, F10: 0, F11: 0.2, F12: 0 },
  F11: { F1: 0, F2: 0, F3: 0.4, F4: 0, F5: 0, F6: 0, F7: 0, F8: 0.3, F9: 0.3, F10: 0.2, F11: 0, F12: 0.2 },
  F12: { F1: 0, F2: 0, F3: 0, F4: 0.3, F5: 0.2, F6: 0, F7: 0.3, F8: 0.4, F9: 0, F10: 0, F11: 0.2, F12: 0 },
}

// ============================================================
// Part 9: 時間スケール別の制御マッピング
// ============================================================

export type TimeScale = 'instant' | 'session' | 'weekly' | 'long_term'

export interface TimeScaleMapping {
  scale: TimeScale
  description: string
  primary_theories: string[]
  control_nature: string
}

export const TIME_SCALE_MAPPINGS: TimeScaleMapping[] = [
  {
    scale: 'instant',
    description: '問題単位',
    primary_theories: ['F7', 'F12', 'F4'],
    control_nature: '難易度調整、感情検出、足場の随伴的切替',
  },
  {
    scale: 'session',
    description: 'セッション単位',
    primary_theories: ['F1', 'F5', 'F6'],
    control_nature: '表示モード、SRL位相プロンプト、検索練習',
  },
  {
    scale: 'weekly',
    description: '週単位',
    primary_theories: ['F6', 'F3', 'F8'],
    control_nature: '間隔効果、Kolbサイクル完走、動機づけ充足チェック',
  },
  {
    scale: 'long_term',
    description: '月〜学期単位',
    primary_theories: ['F2', 'F4', 'F5', 'F10'],
    control_nature: '知能プロファイル更新、ATI重み調整、SRL発達段階の理解更新',
  },
]

// ============================================================
// Part 10: エフェクトサイズ参照テーブル
// ============================================================

export interface EffectSizeReference {
  theory: string
  source: string
  effect_size: string
  notes: string
}

export const EFFECT_SIZES: EffectSizeReference[] = [
  { theory: 'F1', source: 'Mayer (2009)', effect_size: 'd≈0.72', notes: 'マルチメディア学習原理' },
  { theory: 'F6', source: 'Roediger & Karpicke (2006)', effect_size: 'd=0.80', notes: '検索練習' },
  { theory: 'F6', source: 'Cepeda et al. (2006)', effect_size: 'd=0.85', notes: '間隔効果 (254研究)' },
  { theory: 'F6', source: 'Rohrer et al. (2014)', effect_size: 'd=0.43', notes: '交互配置 (4年生幾何)' },
  { theory: 'F6', source: 'Dunlosky et al. (2013)', effect_size: 'd=0.85-2.57', notes: '精緻的質問' },
  { theory: 'F6', source: 'Mayer (2009)', effect_size: 'd=0.72', notes: '二重符号化' },
  { theory: 'F6', source: 'Dunlosky et al. (2013)', effect_size: 'd=0.75', notes: '精緻化' },
  { theory: 'F10', source: 'Chi et al. (1981)', effect_size: 'd≈0.92', notes: '専門家-初心者研究' },
  { theory: 'F11', source: 'Palincsar & Brown (1984)', effect_size: '15%→85%', notes: '相互教授法の読解力' },
  { theory: 'F12', source: 'Pekrun (2006/2007)', effect_size: 'r=.30-.50', notes: '学業感情と成績の相関' },
]
