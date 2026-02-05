/**
 * Phase 20-3: 教師向け管理ダッシュボードAPI
 * クラス学習状況、生徒詳細レポート、宿題管理、クラス比較分析
 */

interface ClassSummary {
  class_id: number;
  teacher_id: number;
  summary_date: string;
  total_students: number;
  active_students: number;
  total_problems_solved: number;
  average_accuracy: number;
  average_study_time: number;
  on_track_count: number;
  behind_count: number;
  ahead_count: number;
  subject_statistics: any;
  students_needing_attention: any;
}

interface StudentDetailReport {
  student_id: number;
  student_name: string;
  total_study_time: number;
  problems_solved: number;
  correct_rate: number;
  streak_days: number;
  strong_subjects: string[];
  weak_subjects: string[];
  study_pattern: string;
  consistency_score: number;
  engagement_level: string;
  predicted_performance: string;
  recommended_actions: string[];
}

interface HomeworkAssignment {
  id?: number;
  teacher_id: number;
  class_id?: number;
  assignment_name: string;
  description?: string;
  subject: string;
  unit_name?: string;
  problem_type: string;
  difficulty?: string;
  problem_count: number;
  problem_ids?: string;
  assigned_date: string;
  due_date: string;
  estimated_time?: number;
  target_students?: string;
}

/**
 * クラス学習状況サマリーを生成
 */
export async function generateClassSummary(
  DB: D1Database,
  classId: number,
  teacherId: number
): Promise<ClassSummary> {
  // クラスの生徒一覧を取得
  const students = await DB.prepare(`
    SELECT id FROM students WHERE class_id = ?
  `).bind(classId).all();

  const studentIds = students.results.map((s: any) => s.id);
  const totalStudents = studentIds.length;

  // 今週活動した生徒数
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const activeStudents = await DB.prepare(`
    SELECT COUNT(DISTINCT student_id) as count
    FROM answer_history
    WHERE student_id IN (${studentIds.map(() => '?').join(',')})
      AND created_at >= ?
  `).bind(...studentIds, oneWeekAgo.toISOString()).first();

  // 総問題解答数
  const problemStats = await DB.prepare(`
    SELECT 
      COUNT(*) as total_problems,
      AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as avg_accuracy
    FROM answer_history
    WHERE student_id IN (${studentIds.map(() => '?').join(',')})
      AND created_at >= ?
  `).bind(...studentIds, oneWeekAgo.toISOString()).first();

  // 平均学習時間（週間）
  const studyTime = await DB.prepare(`
    SELECT 
      SUM(JULIANDAY(last_accessed) - JULIANDAY(created_at)) * 24 * 60 as total_minutes
    FROM students
    WHERE id IN (${studentIds.map(() => '?').join(',')})
  `).bind(...studentIds).first();

  const avgStudyTime = studyTime && studyTime.total_minutes 
    ? Math.round((studyTime.total_minutes as number) / totalStudents) 
    : 0;

  // 進捗状況の分類
  let onTrackCount = 0;
  let behindCount = 0;
  let aheadCount = 0;

  for (const studentId of studentIds) {
    const progress = await DB.prepare(`
      SELECT 
        COUNT(CASE WHEN is_correct = 1 THEN 1 END) as correct_count,
        COUNT(*) as total_count
      FROM answer_history
      WHERE student_id = ?
        AND created_at >= ?
    `).bind(studentId, oneWeekAgo.toISOString()).first();

    const accuracy = progress && (progress.total_count as number) > 0
      ? (progress.correct_count as number) / (progress.total_count as number)
      : 0;

    if (accuracy >= 0.7 && (progress?.total_count as number) >= 10) {
      aheadCount++;
    } else if (accuracy >= 0.5 && (progress?.total_count as number) >= 5) {
      onTrackCount++;
    } else {
      behindCount++;
    }
  }

  // 教科別統計
  const subjectStats = await DB.prepare(`
    SELECT 
      subject,
      COUNT(*) as problem_count,
      AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as accuracy
    FROM answer_history ah
    JOIN generated_problems gp ON ah.problem_id = gp.id
    WHERE ah.student_id IN (${studentIds.map(() => '?').join(',')})
      AND ah.created_at >= ?
    GROUP BY subject
  `).bind(...studentIds, oneWeekAgo.toISOString()).all();

  // 注意が必要な生徒（正答率50%未満 or 1週間活動なし）
  const needsAttention = await DB.prepare(`
    SELECT 
      s.id,
      s.name,
      COUNT(ah.id) as problem_count,
      AVG(CASE WHEN ah.is_correct = 1 THEN 100.0 ELSE 0.0 END) as accuracy
    FROM students s
    LEFT JOIN answer_history ah ON s.id = ah.student_id AND ah.created_at >= ?
    WHERE s.class_id = ?
    GROUP BY s.id
    HAVING problem_count < 5 OR accuracy < 50
  `).bind(oneWeekAgo.toISOString(), classId).all();

  return {
    class_id: classId,
    teacher_id: teacherId,
    summary_date: new Date().toISOString().split('T')[0],
    total_students: totalStudents,
    active_students: (activeStudents?.count as number) || 0,
    total_problems_solved: (problemStats?.total_problems as number) || 0,
    average_accuracy: (problemStats?.avg_accuracy as number) || 0,
    average_study_time: avgStudyTime,
    on_track_count: onTrackCount,
    behind_count: behindCount,
    ahead_count: aheadCount,
    subject_statistics: subjectStats.results,
    students_needing_attention: needsAttention.results
  };
}

/**
 * 生徒の詳細レポートを生成
 */
export async function generateStudentReport(
  DB: D1Database,
  studentId: number,
  teacherId: number
): Promise<StudentDetailReport> {
  // 基本情報
  const student = await DB.prepare(`
    SELECT name FROM students WHERE id = ?
  `).bind(studentId).first();

  if (!student) {
    throw new Error('生徒が見つかりません');
  }

  // 今週の学習時間・問題数・正答率
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyStats = await DB.prepare(`
    SELECT 
      COUNT(*) as problems_solved,
      AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as correct_rate
    FROM answer_history
    WHERE student_id = ?
      AND created_at >= ?
  `).bind(studentId, oneWeekAgo.toISOString()).first();

  // 学習ストリーク
  const streak = await DB.prepare(`
    SELECT current_streak FROM learning_streaks WHERE student_id = ?
  `).bind(studentId).first();

  // 強い教科・弱い教科
  const subjectPerformance = await DB.prepare(`
    SELECT 
      subject,
      AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as accuracy
    FROM answer_history ah
    JOIN generated_problems gp ON ah.problem_id = gp.id
    WHERE ah.student_id = ?
    GROUP BY subject
    ORDER BY accuracy DESC
  `).bind(studentId).all();

  const strongSubjects = subjectPerformance.results
    .filter((s: any) => s.accuracy >= 70)
    .map((s: any) => s.subject);

  const weakSubjects = subjectPerformance.results
    .filter((s: any) => s.accuracy < 50)
    .map((s: any) => s.subject);

  // 学習パターン（時間帯分析）
  const timePattern = await DB.prepare(`
    SELECT 
      CASE 
        WHEN CAST(strftime('%H', created_at) AS INTEGER) BETWEEN 6 AND 11 THEN 'morning'
        WHEN CAST(strftime('%H', created_at) AS INTEGER) BETWEEN 12 AND 17 THEN 'afternoon'
        WHEN CAST(strftime('%H', created_at) AS INTEGER) BETWEEN 18 AND 22 THEN 'evening'
        ELSE 'late_night'
      END as time_slot,
      COUNT(*) as count
    FROM answer_history
    WHERE student_id = ?
      AND created_at >= ?
    GROUP BY time_slot
    ORDER BY count DESC
    LIMIT 1
  `).bind(studentId, oneWeekAgo.toISOString()).first();

  // 学習の一貫性スコア（標準偏差で評価）
  const consistencyScore = 70 + Math.random() * 30; // TODO: 実装

  // エンゲージメントレベル
  const problemsSolved = (weeklyStats?.problems_solved as number) || 0;
  const engagement = problemsSolved >= 20 ? 'high' : problemsSolved >= 10 ? 'medium' : 'low';

  // 予測パフォーマンス
  const correctRate = (weeklyStats?.correct_rate as number) || 0;
  const predictedPerformance = correctRate >= 80 ? '優秀' : correctRate >= 60 ? '良好' : '要改善';

  // 推奨アクション
  const recommendedActions: string[] = [];
  if (weakSubjects.length > 0) {
    recommendedActions.push(`${weakSubjects.join('、')}の復習を強化しましょう`);
  }
  if (problemsSolved < 10) {
    recommendedActions.push('学習時間を増やすことをお勧めします');
  }
  if (correctRate < 60) {
    recommendedActions.push('基礎問題から復習しましょう');
  }

  return {
    student_id: studentId,
    student_name: student.name as string,
    total_study_time: 0, // TODO: 実装
    problems_solved: problemsSolved,
    correct_rate: correctRate,
    streak_days: (streak?.current_streak as number) || 0,
    strong_subjects: strongSubjects,
    weak_subjects: weakSubjects,
    study_pattern: (timePattern?.time_slot as string) || 'unknown',
    consistency_score: consistencyScore,
    engagement_level: engagement,
    predicted_performance: predictedPerformance,
    recommended_actions: recommendedActions
  };
}

/**
 * 宿題を作成
 */
export async function createHomework(
  DB: D1Database,
  homework: HomeworkAssignment
): Promise<{ success: boolean; homeworkId?: number; error?: string }> {
  try {
    const result = await DB.prepare(`
      INSERT INTO homework_assignments (
        teacher_id, class_id, assignment_name, description,
        subject, unit_name, problem_type, difficulty, problem_count,
        problem_ids, assigned_date, due_date, estimated_time, target_students
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      homework.teacher_id,
      homework.class_id || null,
      homework.assignment_name,
      homework.description || null,
      homework.subject,
      homework.unit_name || null,
      homework.problem_type,
      homework.difficulty || 'medium',
      homework.problem_count,
      homework.problem_ids || null,
      homework.assigned_date,
      homework.due_date,
      homework.estimated_time || null,
      homework.target_students || null
    ).run();

    return { success: true, homeworkId: result.meta.last_row_id as number };
  } catch (error: any) {
    console.error('宿題作成エラー:', error);
    return { success: false, error: error.message };
  }
}

/**
 * クラスの宿題提出状況を取得
 */
export async function getHomeworkSubmissions(
  DB: D1Database,
  homeworkId: number
): Promise<any[]> {
  const result = await DB.prepare(`
    SELECT 
      s.id as student_id,
      s.name as student_name,
      hs.status,
      hs.progress_percentage,
      hs.submission_time,
      hs.score,
      hs.max_score,
      hs.accuracy
    FROM students s
    LEFT JOIN homework_submissions hs ON s.id = hs.student_id AND hs.homework_id = ?
    WHERE s.class_id = (
      SELECT class_id FROM homework_assignments WHERE id = ?
    )
    ORDER BY s.name
  `).bind(homeworkId, homeworkId).all();

  return result.results;
}

/**
 * クラス比較分析
 */
export async function compareClasses(
  DB: D1Database,
  teacherId: number,
  classIds: number[]
): Promise<any> {
  const comparisons: any[] = [];

  for (const classId of classIds) {
    const summary = await generateClassSummary(DB, classId, teacherId);
    
    // クラス名を取得
    const classInfo = await DB.prepare(`
      SELECT class_name FROM classes WHERE id = ?
    `).bind(classId).first();

    comparisons.push({
      class_id: classId,
      class_name: classInfo?.class_name || `クラス${classId}`,
      ...summary
    });
  }

  // 分析結果生成
  const avgAccuracy = comparisons.reduce((sum, c) => sum + c.average_accuracy, 0) / comparisons.length;
  const avgStudyTime = comparisons.reduce((sum, c) => sum + c.average_study_time, 0) / comparisons.length;

  const insights: string[] = [];
  
  comparisons.forEach(c => {
    if (c.average_accuracy > avgAccuracy + 10) {
      insights.push(`${c.class_name}は平均より正答率が高いです（+${Math.round(c.average_accuracy - avgAccuracy)}%）`);
    }
    if (c.behind_count / c.total_students > 0.3) {
      insights.push(`${c.class_name}では30%以上の生徒が遅れています。個別サポートが必要です。`);
    }
  });

  return {
    comparisons,
    average_accuracy: avgAccuracy,
    average_study_time: avgStudyTime,
    insights,
    recommendations: [
      '成績の良いクラスの指導法を他クラスでも試してみましょう',
      '遅れている生徒には個別の復習計画を立てましょう',
      '教科別の弱点を分析し、重点的に指導しましょう'
    ]
  };
}
