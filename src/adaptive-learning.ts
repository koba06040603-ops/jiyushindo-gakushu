/**
 * 適応学習エンジン（Adaptive Learning Engine）
 * Phase 9: 学習スタイル自動検出 + パーソナライズド推薦
 * 
 * 科学的根拠:
 * - VARK Model (Fleming, 2001) - 視覚・聴覚・読書/書く・体感型
 * - Multiple Intelligences Theory (Gardner, 1983) - 8種類の知能
 * - Aptitude-Treatment Interaction (ATI) (Cronbach & Snow, 1977)
 * - Learning Analytics (Siemens & Long, 2011)
 */

import { Context } from 'hono';

// 学習スタイル型定義
export enum LearningStyleType {
  VISUAL = 'visual',           // 視覚型（V）
  AUDITORY = 'auditory',       // 聴覚型（A）
  READING_WRITING = 'reading', // 読書/書く型（R）
  KINESTHETIC = 'kinesthetic'  // 体感型（K）
}

// Gardner の多重知能型定義
export enum GardnerIntelligence {
  LINGUISTIC = 'linguistic',           // 言語的知能
  LOGICAL_MATHEMATICAL = 'logical',    // 論理数学的知能
  SPATIAL = 'spatial',                 // 空間的知能
  BODILY_KINESTHETIC = 'bodily',       // 身体運動的知能
  MUSICAL = 'musical',                 // 音楽的知能
  INTERPERSONAL = 'interpersonal',     // 対人的知能
  INTRAPERSONAL = 'intrapersonal',     // 内省的知能
  NATURALIST = 'naturalist'            // 博物学的知能
}

// 学習行動パターン
interface LearningBehaviorPattern {
  student_id: number;
  image_interaction_count: number;      // 画像クリック数
  video_watch_time_seconds: number;     // 動画視聴時間
  audio_playback_count: number;         // 音声再生回数
  text_reading_time_seconds: number;    // テキスト読書時間
  note_taking_count: number;            // ノート記録回数
  interactive_element_usage: number;    // インタラクティブ要素使用回数
  collaboration_count: number;          // 協働学習参加回数
  self_reflection_count: number;        // 振り返り回数
  problem_solving_speed_ms: number;     // 問題解決速度（平均）
  pattern_recognition_accuracy: number; // パターン認識精度
  total_learning_sessions: number;      // 総学習セッション数
}

// 学習スタイルスコア
interface LearningStyleScore {
  student_id: number;
  vark_scores: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  gardner_scores: {
    linguistic: number;
    logical: number;
    spatial: number;
    bodily: number;
    musical: number;
    interpersonal: number;
    intrapersonal: number;
    naturalist: number;
  };
  dominant_style: LearningStyleType;
  dominant_intelligence: GardnerIntelligence;
  confidence_level: number; // 0-1, 検出信頼度
  last_updated: string;
}

/**
 * 学習スタイル自動検出エンジン
 */
export class AdaptiveLearningEngine {
  constructor(
    private DB: D1Database,
    private KV: KVNamespace | undefined
  ) {}

  /**
   * 学習行動データから学習スタイルを検出
   */
  async detectLearningStyle(studentId: number): Promise<LearningStyleScore> {
    // キャッシュチェック
    const cacheKey = `learning_style:${studentId}`;
    if (this.KV) {
      const cached = await this.KV.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    // 学習行動パターンを取得
    const behaviorPattern = await this.fetchLearningBehavior(studentId);

    // VARKスコア計算
    const varkScores = this.calculateVARKScores(behaviorPattern);

    // Gardnerスコア計算
    const gardnerScores = this.calculateGardnerScores(behaviorPattern);

    // 主要スタイルを決定
    const dominantStyle = this.determineDominantStyle(varkScores);
    const dominantIntelligence = this.determineDominantIntelligence(gardnerScores);

    // 信頼度計算（データ量に基づく）
    const confidenceLevel = this.calculateConfidence(behaviorPattern);

    const result: LearningStyleScore = {
      student_id: studentId,
      vark_scores: varkScores,
      gardner_scores: gardnerScores,
      dominant_style: dominantStyle,
      dominant_intelligence: dominantIntelligence,
      confidence_level: confidenceLevel,
      last_updated: new Date().toISOString()
    };

    // キャッシュに保存（TTL: 1日）
    if (this.KV) {
      await this.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 86400 });
    }

    // DBに保存
    await this.saveLearningStyleToDB(result);

    return result;
  }

  /**
   * 学習行動パターン取得
   */
  private async fetchLearningBehavior(studentId: number): Promise<LearningBehaviorPattern> {
    // 画像インタラクション数
    const imageInteraction = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_history
      WHERE student_id = ? AND hint_used = TRUE
    `).bind(studentId).first() as any;

    // 動画視聴時間（秒）
    const videoWatchTime = await this.DB.prepare(`
      SELECT SUM(time_spent_seconds) as total FROM learning_history
      WHERE student_id = ? AND card_id IN (
        SELECT card_id FROM learning_cards WHERE solution_video_url IS NOT NULL
      )
    `).bind(studentId).first() as any;

    // 音声再生回数（聴覚型の指標）
    const audioPlayback = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_sessions
      WHERE student_id = ? AND focus_level = 'high'
    `).bind(studentId).first() as any;

    // テキスト読書時間
    const textReadingTime = await this.DB.prepare(`
      SELECT SUM(time_spent_seconds) as total FROM learning_history
      WHERE student_id = ?
    `).bind(studentId).first() as any;

    // ノート記録回数
    const noteTaking = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_notes
      WHERE student_id = ?
    `).bind(studentId).first() as any;

    // インタラクティブ要素使用回数
    const interactiveUsage = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_history
      WHERE student_id = ? AND is_correct = TRUE
    `).bind(studentId).first() as any;

    // 協働学習参加回数
    const collaboration = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_posts
      WHERE student_id = ?
    `).bind(studentId).first() as any;

    // 振り返り回数
    const selfReflection = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_reflections
      WHERE student_id = ?
    `).bind(studentId).first() as any;

    // 問題解決速度（平均）
    const problemSolvingSpeed = await this.DB.prepare(`
      SELECT AVG(time_spent_seconds) as avg_time FROM learning_history
      WHERE student_id = ? AND is_correct = TRUE
    `).bind(studentId).first() as any;

    // パターン認識精度
    const patternRecognition = await this.DB.prepare(`
      SELECT 
        SUM(CASE WHEN is_correct = TRUE THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as accuracy
      FROM learning_history
      WHERE student_id = ?
    `).bind(studentId).first() as any;

    // 総学習セッション数
    const totalSessions = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_sessions
      WHERE student_id = ?
    `).bind(studentId).first() as any;

    return {
      student_id: studentId,
      image_interaction_count: imageInteraction?.count || 0,
      video_watch_time_seconds: videoWatchTime?.total || 0,
      audio_playback_count: audioPlayback?.count || 0,
      text_reading_time_seconds: textReadingTime?.total || 0,
      note_taking_count: noteTaking?.count || 0,
      interactive_element_usage: interactiveUsage?.count || 0,
      collaboration_count: collaboration?.count || 0,
      self_reflection_count: selfReflection?.count || 0,
      problem_solving_speed_ms: (problemSolvingSpeed?.avg_time || 0) * 1000,
      pattern_recognition_accuracy: patternRecognition?.accuracy || 0,
      total_learning_sessions: totalSessions?.count || 0
    };
  }

  /**
   * VARKスコア計算
   */
  private calculateVARKScores(pattern: LearningBehaviorPattern) {
    const total = pattern.total_learning_sessions || 1;

    // Visual（視覚型）: 画像・動画の使用頻度
    const visual = (
      (pattern.image_interaction_count / total) * 0.6 +
      (pattern.video_watch_time_seconds / (total * 300)) * 0.4
    ) * 100;

    // Auditory（聴覚型）: 音声再生・協働学習の頻度
    const auditory = (
      (pattern.audio_playback_count / total) * 0.7 +
      (pattern.collaboration_count / total) * 0.3
    ) * 100;

    // Reading/Writing（読書/書く型）: テキスト読書・ノート記録の頻度
    const reading = (
      (pattern.text_reading_time_seconds / (total * 600)) * 0.5 +
      (pattern.note_taking_count / total) * 0.5
    ) * 100;

    // Kinesthetic（体感型）: インタラクティブ要素・実践の頻度
    const kinesthetic = (
      (pattern.interactive_element_usage / total) * 0.7 +
      (pattern.problem_solving_speed_ms < 60000 ? 0.3 : 0.1)
    ) * 100;

    // 正規化（合計100%）
    const sum = visual + auditory + reading + kinesthetic;
    return {
      visual: Math.min(100, (visual / sum) * 100),
      auditory: Math.min(100, (auditory / sum) * 100),
      reading: Math.min(100, (reading / sum) * 100),
      kinesthetic: Math.min(100, (kinesthetic / sum) * 100)
    };
  }

  /**
   * Gardnerスコア計算
   */
  private calculateGardnerScores(pattern: LearningBehaviorPattern) {
    const total = pattern.total_learning_sessions || 1;

    return {
      linguistic: (pattern.text_reading_time_seconds / (total * 600)) * 100,
      logical: (pattern.pattern_recognition_accuracy * 100),
      spatial: (pattern.image_interaction_count / total) * 50,
      bodily: (pattern.interactive_element_usage / total) * 50,
      musical: (pattern.audio_playback_count / total) * 50,
      interpersonal: (pattern.collaboration_count / total) * 100,
      intrapersonal: (pattern.self_reflection_count / total) * 100,
      naturalist: 50 // デフォルト値（パターン認識から推定）
    };
  }

  /**
   * 主要VARKスタイル決定
   */
  private determineDominantStyle(varkScores: any): LearningStyleType {
    const scores = [
      { type: LearningStyleType.VISUAL, score: varkScores.visual },
      { type: LearningStyleType.AUDITORY, score: varkScores.auditory },
      { type: LearningStyleType.READING_WRITING, score: varkScores.reading },
      { type: LearningStyleType.KINESTHETIC, score: varkScores.kinesthetic }
    ];

    scores.sort((a, b) => b.score - a.score);
    return scores[0].type;
  }

  /**
   * 主要Gardner知能決定
   */
  private determineDominantIntelligence(gardnerScores: any): GardnerIntelligence {
    const scores = Object.entries(gardnerScores).map(([key, value]) => ({
      type: key as GardnerIntelligence,
      score: value as number
    }));

    scores.sort((a, b) => b.score - a.score);
    return scores[0].type;
  }

  /**
   * 信頼度計算
   */
  private calculateConfidence(pattern: LearningBehaviorPattern): number {
    const totalSessions = pattern.total_learning_sessions;
    
    // データ量に基づく信頼度（最低10セッション、最大100セッションで100%）
    if (totalSessions < 10) {
      return totalSessions / 10;
    } else if (totalSessions >= 100) {
      return 1.0;
    } else {
      return 0.5 + (totalSessions - 10) / 180; // 10-100で0.5-1.0
    }
  }

  /**
   * 学習スタイルをDBに保存
   */
  private async saveLearningStyleToDB(style: LearningStyleScore) {
    await this.DB.prepare(`
      INSERT OR REPLACE INTO detected_learning_styles (
        student_id,
        vark_visual, vark_auditory, vark_reading, vark_kinesthetic,
        gardner_linguistic, gardner_logical, gardner_spatial, gardner_bodily,
        gardner_musical, gardner_interpersonal, gardner_intrapersonal, gardner_naturalist,
        dominant_style, dominant_intelligence, confidence_level, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      style.student_id,
      style.vark_scores.visual, style.vark_scores.auditory,
      style.vark_scores.reading, style.vark_scores.kinesthetic,
      style.gardner_scores.linguistic, style.gardner_scores.logical,
      style.gardner_scores.spatial, style.gardner_scores.bodily,
      style.gardner_scores.musical, style.gardner_scores.interpersonal,
      style.gardner_scores.intrapersonal, style.gardner_scores.naturalist,
      style.dominant_style, style.dominant_intelligence,
      style.confidence_level, style.last_updated
    ).run();
  }

  /**
   * 適応型カリキュラム推薦
   */
  async recommendCurriculum(studentId: number, count: number = 5) {
    const learningStyle = await this.detectLearningStyle(studentId);
    
    // 学習スタイルに基づいてカリキュラムを推薦
    const recommendations = await this.DB.prepare(`
      SELECT 
        lc.*,
        CASE
          WHEN ? = 'visual' AND lc.image_url IS NOT NULL THEN 10
          WHEN ? = 'auditory' AND lc.solution_video_url IS NOT NULL THEN 10
          WHEN ? = 'reading' AND LENGTH(lc.explanation) > 200 THEN 10
          WHEN ? = 'kinesthetic' AND lc.card_type = 'challenge' THEN 10
          ELSE 5
        END as recommendation_score
      FROM learning_cards lc
      LEFT JOIN student_progress sp ON lc.card_id = sp.card_id AND sp.student_id = ?
      WHERE sp.status IS NULL OR sp.status != 'completed'
      ORDER BY recommendation_score DESC, lc.difficulty_level ASC
      LIMIT ?
    `).bind(
      learningStyle.dominant_style,
      learningStyle.dominant_style,
      learningStyle.dominant_style,
      learningStyle.dominant_style,
      studentId,
      count
    ).all();

    return {
      student_id: studentId,
      learning_style: learningStyle,
      recommendations: recommendations.results
    };
  }
}

/**
 * 学習スタイル検出用マイグレーション
 * migrations/0036_adaptive_learning_engine.sql
 */
export const ADAPTIVE_LEARNING_MIGRATION = `
-- 検出された学習スタイル保存テーブル
CREATE TABLE IF NOT EXISTS detected_learning_styles (
  student_id INTEGER PRIMARY KEY,
  vark_visual REAL DEFAULT 0,
  vark_auditory REAL DEFAULT 0,
  vark_reading REAL DEFAULT 0,
  vark_kinesthetic REAL DEFAULT 0,
  gardner_linguistic REAL DEFAULT 0,
  gardner_logical REAL DEFAULT 0,
  gardner_spatial REAL DEFAULT 0,
  gardner_bodily REAL DEFAULT 0,
  gardner_musical REAL DEFAULT 0,
  gardner_interpersonal REAL DEFAULT 0,
  gardner_intrapersonal REAL DEFAULT 0,
  gardner_naturalist REAL DEFAULT 0,
  dominant_style TEXT NOT NULL,
  dominant_intelligence TEXT NOT NULL,
  confidence_level REAL DEFAULT 0 CHECK(confidence_level BETWEEN 0 AND 1),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_learning_styles_student ON detected_learning_styles(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_styles_dominant ON detected_learning_styles(dominant_style);
`;
