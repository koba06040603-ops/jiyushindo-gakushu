-- Phase 11-2: データベースインデックス最適化（最小限版）
-- 確実に存在するテーブルの重要インデックスのみ追加

-- users テーブル
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- インデックス作成完了
SELECT '✅ 基本インデックス最適化が完了しました' as message;
