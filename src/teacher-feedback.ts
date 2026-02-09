// Phase 27: 教員向けコメント・フィードバック機能 - バックエンドAPI

import { D1Database } from '@cloudflare/workers-types';

// ============================================================
// フィードバック作成
// ============================================================

export async function createTeacherFeedback(
  DB: D1Database,
  teacherId: number,
  studentId: number,
  feedbackData: {
    feedback_type: string;
    comment_text: string;
    related_subject?: string;
    related_unit?: string;
    priority?: string;
    is_visible_to_student?: number;
    is_visible_to_parent?: number;
    tags?: string[];
  }
): Promise<number> {
  try {
    const query = `
      INSERT INTO teacher_feedback (
        school_id, student_id, teacher_id, feedback_type, comment_text,
        related_subject, related_unit, priority, 
        is_visible_to_student, is_visible_to_parent, tags
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await DB.prepare(query).bind(
      studentId,
      teacherId,
      feedbackData.feedback_type,
      feedbackData.comment_text,
      feedbackData.related_subject || null,
      feedbackData.related_unit || null,
      feedbackData.priority || 'normal',
      feedbackData.is_visible_to_student ?? 1,
      feedbackData.is_visible_to_parent ?? 1,
      feedbackData.tags ? JSON.stringify(feedbackData.tags) : null
    ).run();

    return result.meta.last_row_id || 0;
  } catch (error) {
    console.error('フィードバック作成エラー:', error);
    throw error;
  }
}

// ============================================================
// フィードバック取得（生徒向け）
// ============================================================

export async function getStudentFeedback(
  DB: D1Database,
  studentId: number,
  limit: number = 20
): Promise<any[]> {
  try {
    const query = `
      SELECT 
        tf.feedback_id,
        tf.feedback_type,
        tf.comment_text,
        tf.related_subject,
        tf.related_unit,
        tf.priority,
        tf.tags,
        tf.created_at,
        tf.read_by_student_at,
        u.full_name as teacher_name
      FROM teacher_feedback tf
      JOIN users u ON tf.teacher_id = u.user_id
      WHERE tf.student_id = ?
        AND tf.is_visible_to_student = 1
        AND tf.status = 'active'
      ORDER BY tf.created_at DESC
      LIMIT ?
    `;

    const results = await DB.prepare(query).bind(studentId, limit).all();

    return results.results.map((row: any) => ({
      feedback_id: row.feedback_id,
      feedback_type: row.feedback_type,
      comment_text: row.comment_text,
      related_subject: row.related_subject,
      related_unit: row.related_unit,
      priority: row.priority,
      tags: row.tags ? JSON.parse(row.tags) : [],
      created_at: row.created_at,
      is_read: !!row.read_by_student_at,
      teacher_name: row.teacher_name,
    }));
  } catch (error) {
    console.error('生徒フィードバック取得エラー:', error);
    throw error;
  }
}

// ============================================================
// フィードバックテンプレート取得
// ============================================================

export async function getFeedbackTemplates(
  DB: D1Database,
  category?: string
): Promise<any[]> {
  try {
    let query = `
      SELECT 
        template_id,
        template_name,
        category,
        template_text,
        usage_count
      FROM feedback_templates
      WHERE is_active = 1 AND is_public = 1
    `;

    if (category) {
      query += ` AND category = ?`;
    }

    query += ` ORDER BY usage_count DESC, template_name`;

    const stmt = category ? DB.prepare(query).bind(category) : DB.prepare(query);
    const results = await stmt.all();

    return results.results;
  } catch (error) {
    console.error('テンプレート取得エラー:', error);
    throw error;
  }
}

// ============================================================
// フィードバック既読マーク
// ============================================================

export async function markFeedbackAsRead(
  DB: D1Database,
  feedbackId: number,
  readerType: 'student' | 'parent'
): Promise<void> {
  try {
    const column = readerType === 'student' ? 'read_by_student_at' : 'read_by_parent_at';
    const query = `
      UPDATE teacher_feedback
      SET ${column} = CURRENT_TIMESTAMP
      WHERE feedback_id = ? AND ${column} IS NULL
    `;

    await DB.prepare(query).bind(feedbackId).run();
  } catch (error) {
    console.error('既読マークエラー:', error);
    throw error;
  }
}
