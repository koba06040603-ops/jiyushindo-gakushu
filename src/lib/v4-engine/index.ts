/**
 * v4統合制御エンジン — バレルエクスポート
 */

// 型定義
export type {
  F1_SensoryProfile,
  F2_IntelligenceProfile,
  F3_ExperientialProfile,
  F4_AptitudeProfile,
  F5_SRLProfile,
  F6_StrategyProfile,
  F7_ScaffoldProfile,
  F8_MotivationProfile,
  F9_MetacognitiveProfile,
  F10_DomainProfile,
  F11_AuthenticProfile,
  F12_AffectProfile,
  AllTheoryProfiles,
  FundamentalAxes,
  ArchetypeId,
  ArchetypeDescription,
  IntegratedControlParameters,
  RealtimeBehaviorData,
  TransitionCriteria,
  TransitionCondition,
  TimeScale,
  TimeScaleMapping,
  EffectSizeReference,
} from './types'

// 定数
export {
  ARCHETYPES,
  INFLUENCE_MATRIX,
  TRANSITION_PATHS,
  TIME_SCALE_MAPPINGS,
  EFFECT_SIZES,
} from './types'

// 統合制御エンジン
export {
  computeIntegratedControls,
  computeFundamentalAxes,
  understandCurrentPresence,
  getArchetypeDefaults,
} from './integrated-control'

// F4 ATI エンジン
export {
  computeATIStructure,
  computeF4Controls,
  shouldAdjustStructure,
  estimateATILearningEffect,
} from './f4-ati-engine'

// F7 足場エンジン
export {
  computeF7Controls,
  computeContingencyRule,
  computeZPDPosition,
  estimateZPD,
  determineScaffoldFunctions,
} from './f7-scaffold-engine'

// F12 感情ゲーティング
export {
  executeAffectGating,
  applyAffectGating,
  estimateAffectState,
  computeOptimalArousalRange,
} from './f12-affect-engine'
