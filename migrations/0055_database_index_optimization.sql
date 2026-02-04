-- Phase 11-2: データベースインデックス最適化（最小限版）
-- 確実に存在するテーブルの重要インデックスのみ追加

-- students テーブル
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);

-- teachers テーブル
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

-- curriculum テーブル
CREATE INDEX IF NOT EXISTS idx_curriculum_school ON curriculum(school_id);

-- インデックス作成完了
SELECT '✅ 基本インデックス最適化が完了しました' as message;
