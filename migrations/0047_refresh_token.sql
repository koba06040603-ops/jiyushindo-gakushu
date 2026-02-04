-- Phase 4-5: リフレッシュトークンの追加

-- auth_sessions テーブルに refresh_token と refresh_expires_at を追加
ALTER TABLE auth_sessions ADD COLUMN refresh_token TEXT;
ALTER TABLE auth_sessions ADD COLUMN refresh_expires_at DATETIME;

-- リフレッシュトークン用のインデックス（UNIQUE制約の代わり）
CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_sessions_refresh_token ON auth_sessions(refresh_token) WHERE refresh_token IS NOT NULL;

SELECT '✅ Migration 0047: refresh_token added successfully' as status;
