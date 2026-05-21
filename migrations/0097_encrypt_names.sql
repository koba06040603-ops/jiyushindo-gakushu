-- =============================================================================
-- マイグレーション 0097: 氏名カラムの暗号化対応
-- 作成日: 2026-04-20
-- 作成背景: SE米田氏 追加指摘「氏名は暗号化されていないのか」への対応
-- =============================================================================
--
-- 変更内容:
--   1. auth_users テーブルに full_name_hash カラムを追加（氏名検索用 SHA-256 ハッシュ）
--   2. 既存平文データの暗号化は、管理者APIの POST /api/admin/encrypt-pii で
--      アプリ起動後に実行する（ENCRYPTION_KEY が必要なため）
--
-- 本マイグレーションは「カラム追加」のみを行う。実データの暗号化は
-- crypto-utils.ts の migratePIIEncryption 関数で行う（冪等性保証済み）。
-- =============================================================================

-- auth_users.full_name_hash カラムの追加
-- 既存テーブルへの後方互換性のある変更
ALTER TABLE auth_users ADD COLUMN full_name_hash TEXT DEFAULT '';

-- full_name_hash による氏名検索の高速化
CREATE INDEX IF NOT EXISTS idx_auth_users_full_name_hash
  ON auth_users(full_name_hash);

-- マイグレーション記録（任意）
-- INSERT INTO migration_log (version, description, applied_at) VALUES
--   ('0097', 'Add full_name_hash column for encrypted name search', datetime('now'));
