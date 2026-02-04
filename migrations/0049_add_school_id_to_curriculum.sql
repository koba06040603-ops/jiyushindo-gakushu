-- Phase 5-4: マルチテナント - curriculumテーブルにschool_id追加

-- curriculumテーブルにschool_idを追加
ALTER TABLE curriculum ADD COLUMN school_id INTEGER DEFAULT 1;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_curriculum_school_id ON curriculum(school_id);

-- 既存データに school_id = 1 を設定（デフォルト学校）
UPDATE curriculum SET school_id = 1 WHERE school_id IS NULL;

SELECT '✅ Migration 0049: school_id added to curriculum' as status;
