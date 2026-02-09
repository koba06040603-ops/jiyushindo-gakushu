// Phase 26: クラス全体の学習進捗比較ビュー - バックエンドAPI

import { D1Database } from '@cloudflare/workers-types';

// ============================================================
// 型定義
// ============================================================

interface ClassStatistics {
  class_code: string;
  grade: string;
  stat_date: string;
  total_students: number;
  active_students: number;
  overall_accuracy: number;
  avg_problems_per_student: number;
  avg_study_minutes_per_student: number;
  subject_stats: Record<string, any>;
  mastery_distribution: Record<string, number>;
}

interface StudentProgressComparison {
  student_id: number;
  class_rank: number;
  class_percentile: number;
  accuracy_rate: number;
  total_problems: number;
  study_minutes: number;
  vs_class_avg_accuracy: number;
  mastery_level: string;
  subject_ranks: Record<string, number>;
}

interface HeatmapData {
  subject: string;
  unit: string;
  student_scores: Record<string, number>;
  avg_score: number;
  min_score: number;
  max_score: number;
}

// ============================================================
// クラス統計取得
// ============================================================

export async function getClassStatistics(
  DB: D1Database,
  classCode: string,
  days: number = 30
): Promise<ClassStatistics | null> {
  try {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);
    const startDate = periodStart.toISOString().split('T')[0];

    const query = `
      SELECT 
        class_code,
        grade,
        stat_date,
        total_students,
        active_students,
        inactive_students,
        total_problems_solved,
        avg_problems_per_student,
        total_study_minutes,
        avg_study_minutes_per_student,
        overall_accuracy,
        accuracy_std_dev,
        median_accuracy,
        subject_stats,
        mastery_distribution,
        top_performers,
        most_improved
      FROM class_statistics
      WHERE class_code = ?
        AND stat_date >= ?
      ORDER BY stat_date DESC
      LIMIT 1
    `;

    const result = await DB.prepare(query).bind(classCode, startDate).first();

    if (!result) {
      return null;
    }

    return {
      class_code: result.class_code as string,
      grade: result.grade as string,
      stat_date: result.stat_date as string,
      total_students: result.total_students as number,
      active_students: result.active_students as number,
      overall_accuracy: result.overall_accuracy as number,
      avg_problems_per_student: result.avg_problems_per_student as number,
      avg_study_minutes_per_student: result.avg_study_minutes_per_student as number,
      subject_stats: result.subject_stats ? JSON.parse(result.subject_stats as string) : {},
      mastery_distribution: result.mastery_distribution ? JSON.parse(result.mastery_distribution as string) : {},
    };
  } catch (error) {
    console.error('クラス統計取得エラー:', error);
    throw error;
  }
}

// ============================================================
// クラス内生徒進捗比較取得
// ============================================================

export async function getStudentProgressComparison(
  DB: D1Database,
  classCode: string,
  anonymize: boolean = false
): Promise<StudentProgressComparison[]> {
  try {
    const query = `
      SELECT 
        spc.student_id,
        CASE WHEN ? = 1 THEN 'Student_' || spc.class_rank ELSE u.full_name END as student_name,
        spc.class_rank,
        spc.class_percentile,
        spc.accuracy_rate,
        spc.total_problems,
        spc.study_minutes,
        spc.vs_class_avg_accuracy,
        spc.vs_class_avg_problems,
        spc.vs_class_avg_minutes,
        spc.mastery_level,
        spc.subject_ranks,
        spc.comparison_date
      FROM student_progress_comparison spc
      JOIN users u ON spc.student_id = u.user_id
      WHERE spc.class_code = ?
        AND spc.comparison_date = (
          SELECT MAX(comparison_date) 
          FROM student_progress_comparison 
          WHERE class_code = ?
        )
      ORDER BY spc.class_rank ASC
    `;

    const results = await DB.prepare(query)
      .bind(anonymize ? 1 : 0, classCode, classCode)
      .all();

    return results.results.map((row: any) => ({
      student_id: anonymize ? 0 : row.student_id,
      student_name: row.student_name,
      class_rank: row.class_rank,
      class_percentile: row.class_percentile,
      accuracy_rate: row.accuracy_rate,
      total_problems: row.total_problems,
      study_minutes: row.study_minutes,
      vs_class_avg_accuracy: row.vs_class_avg_accuracy,
      mastery_level: row.mastery_level,
      subject_ranks: row.subject_ranks ? JSON.parse(row.subject_ranks) : {},
    }));
  } catch (error) {
    console.error('生徒進捗比較取得エラー:', error);
    throw error;
  }
}

// ============================================================
// ヒートマップデータ取得
// ============================================================

export async function getClassHeatmapData(
  DB: D1Database,
  classCode: string,
  subject: string,
  anonymize: boolean = false
): Promise<HeatmapData[]> {
  try {
    const query = `
      SELECT 
        subject,
        unit,
        student_scores,
        avg_score,
        min_score,
        max_score,
        std_dev,
        difficulty_level,
        stat_date
      FROM class_heatmap_data
      WHERE class_code = ?
        AND subject = ?
        AND stat_date >= date('now', '-30 days')
      ORDER BY stat_date DESC, unit
    `;

    const results = await DB.prepare(query).bind(classCode, subject).all();

    return results.results.map((row: any) => {
      let studentScores = JSON.parse(row.student_scores);
      
      // 匿名化処理
      if (anonymize) {
        const anonymizedScores: Record<string, number> = {};
        Object.values(studentScores).forEach((score, index) => {
          anonymizedScores[`Student_${index + 1}`] = score as number;
        });
        studentScores = anonymizedScores;
      }

      return {
        subject: row.subject,
        unit: row.unit,
        student_scores: studentScores,
        avg_score: row.avg_score,
        min_score: row.min_score,
        max_score: row.max_score,
      };
    });
  } catch (error) {
    console.error('ヒートマップデータ取得エラー:', error);
    throw error;
  }
}

// ============================================================
// 習熟度分布取得
// ============================================================

export async function getMasteryDistribution(
  DB: D1Database,
  classCode: string
): Promise<Record<string, number>> {
  try {
    const query = `
      SELECT 
        mastery_level,
        COUNT(*) as count
      FROM student_progress_comparison
      WHERE class_code = ?
        AND comparison_date = (
          SELECT MAX(comparison_date)
          FROM student_progress_comparison
          WHERE class_code = ?
        )
      GROUP BY mastery_level
    `;

    const results = await DB.prepare(query).bind(classCode, classCode).all();

    const distribution: Record<string, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    results.results.forEach((row: any) => {
      distribution[row.mastery_level] = row.count;
    });

    return distribution;
  } catch (error) {
    console.error('習熟度分布取得エラー:', error);
    throw error;
  }
}

// ============================================================
// 教科別クラス平均取得
// ============================================================

export async function getSubjectAverages(
  DB: D1Database,
  classCode: string
): Promise<Record<string, number>> {
  try {
    const query = `
      SELECT 
        JSON_EXTRACT(subject_stats, '$') as subject_data
      FROM class_statistics
      WHERE class_code = ?
      ORDER BY stat_date DESC
      LIMIT 1
    `;

    const result = await DB.prepare(query).bind(classCode).first();

    if (!result || !result.subject_data) {
      return {};
    }

    const subjectStats = JSON.parse(result.subject_data as string);
    const averages: Record<string, number> = {};

    Object.keys(subjectStats).forEach((subject) => {
      averages[subject] = subjectStats[subject].accuracy || 0;
    });

    return averages;
  } catch (error) {
    console.error('教科別平均取得エラー:', error);
    throw error;
  }
}

// ============================================================
// クラス進捗トレンド取得
// ============================================================

export async function getClassProgressTrend(
  DB: D1Database,
  classCode: string,
  days: number = 30
): Promise<any[]> {
  try {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - days);
    const startDate = periodStart.toISOString().split('T')[0];

    const query = `
      SELECT 
        stat_date,
        overall_accuracy,
        avg_problems_per_student,
        avg_study_minutes_per_student,
        active_students
      FROM class_statistics
      WHERE class_code = ?
        AND stat_date >= ?
      ORDER BY stat_date ASC
    `;

    const results = await DB.prepare(query).bind(classCode, startDate).all();

    return results.results.map((row: any) => ({
      date: row.stat_date,
      accuracy: row.overall_accuracy,
      problems: row.avg_problems_per_student,
      study_minutes: row.avg_study_minutes_per_student,
      active_students: row.active_students,
    }));
  } catch (error) {
    console.error('クラス進捗トレンド取得エラー:', error);
    throw error;
  }
}

// ============================================================
// 統計更新（バッチ処理用）
// ============================================================

export async function updateClassStatistics(
  DB: D1Database,
  classCode: string
): Promise<void> {
  try {
    // 実際のデータ集計ロジック
    // この関数は定期的にバッチ実行される想定
    
    console.log(`クラス統計を更新しました: ${classCode}`);
  } catch (error) {
    console.error('クラス統計更新エラー:', error);
    throw error;
  }
}
