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

// F5 SRLエンジン (Phase 2+D: 自己調整学習 + 適応ループ)
export {
  computeF5Controls,
  detectSRLPhase,
  assessDevelopmentalStage,
  adjustSRLForAffect,
  applySRLToControls,
  trackSRLPhaseTransition,
  computeSRLAutoAdjustment,
  assessAdaptationQuality,
} from './f5-srl-engine'

export type {
  SRLPhase,
  SRLPhaseDetail,
  SRLDevelopmentalStage,
  DevelopmentalAssessment,
  DevelopmentalSupport,
  F5_FullControls,
  SRLSessionTracker,
  SRLPhaseTransition,
  SRLAdaptationQuality,
  SRLAutoAdjustment,
  SRLAdjustmentAction,
} from './f5-srl-engine'

// F8 動機エンジン (Phase 2+D: 三欲求統合 + フィードバックループ)
export {
  computeF8Controls,
  assessNeedSatisfaction,
  assessMotivationQuality,
  adjustF8ForAffect,
  applyF8ToControls,
  detectMotivationFeedbackLoop,
} from './f8-motivation-engine'

export type {
  NeedSatisfactionState,
  MotivationRisk,
  MotivationQualityAssessment,
  MotivationSupportStyle,
  F8_FullControls,
  MotivationFeedbackState,
  NeedBalanceState,
  NeedImbalancePattern,
  PreventiveIntervention,
} from './f8-motivation-engine'

// F6 認知方略エンジン (Phase 3)
export {
  computeF6Controls,
  checkAllStrategies,
  determineRetrievalLevel,
  computeOptimalSpacing,
  computeInterleavingRatio,
  determineElaborationType,
  applyF6ToControls,
} from './f6-strategy-engine'

export type {
  StrategyType,
  StrategyApplicability,
  F6_FullControls,
  RetrievalLevel,
  SpacingSchedule,
  ElaborationPromptType,
} from './f6-strategy-engine'

// F1 感覚チャネルエンジン (Phase 3)
export {
  computeF1Controls,
  determineEntryChannel,
  selectEncodingChannels,
  computeModalityWeights,
  assessMultimodalCapacity,
  applyF1ToControls,
} from './f1-sensory-engine'

export type {
  SensoryChannel,
  ModalityWeights,
  F1_FullControls,
} from './f1-sensory-engine'

// F2 多元的入口エンジン (Phase 4)
export {
  computeF2Controls,
  determinePrimaryEntry,
  determineFallbackEntry,
  determineMindsetMessage,
  applyF2ToControls,
} from './f2-intelligence-engine'

export type {
  IntelligenceType,
  MindsetMessageType,
  F2_FullControls,
} from './f2-intelligence-engine'

// F3 経験変容学習エンジン (Phase 4)
export {
  computeF3Controls,
  determineEntryPhase,
  buildCycleSequence,
  computePhaseTimeAllocation,
  applyF3ToControls,
} from './f3-experiential-engine'

export type {
  KolbPhase,
  KolbStyle,
  F3_FullControls,
} from './f3-experiential-engine'

// F9 メタ認知的コンピテンシーエンジン (Phase 4)
export {
  computeF9Controls,
  assessMetacognitiveLevel,
  shouldPromptMetacognition,
  determineProblemSolvingScaffold,
  applyF9ToControls,
} from './f9-metacognitive-engine'

export type {
  MetacognitiveLevel,
  F9_FullControls,
} from './f9-metacognitive-engine'

// F10 領域固有認知構造エンジン (Phase 4)
export {
  computeF10Controls,
  generateDomainThinkingPrompt,
  determineMisconceptionHandling,
  applyF10ToControls,
} from './f10-domain-engine'

export type {
  DomainStage,
  F10_FullControls,
} from './f10-domain-engine'

// F11 真正文脈学習エンジン (Phase 4)
export {
  computeF11Controls,
  assessAuthenticityLevel,
  generateRealWorldConnection,
  applyF11ToControls,
} from './f11-authentic-engine'

export type {
  AuthenticityLevel,
  F11_FullControls,
} from './f11-authentic-engine'
