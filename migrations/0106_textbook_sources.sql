-- 0106: 教科書取り込み（単元ごと・教師のみ）
-- 原本は R2 の非公開キー（private/textbooks/）に保存し、D1 には読み取り後の学習内容（整理済みテキスト）を保存する。
-- 保存期間は1年（expires_at）。期限切れは次回の一覧・アップロード時に削除する。
CREATE TABLE IF NOT EXISTS textbook_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grade TEXT NOT NULL,
  subject TEXT NOT NULL,
  textbook_company TEXT NOT NULL DEFAULT '',
  unit_name TEXT NOT NULL,
  page_label TEXT NOT NULL DEFAULT '',
  r2_key TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT '',
  file_size INTEGER NOT NULL DEFAULT 0,
  extracted_text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'uploaded',
  error_message TEXT NOT NULL DEFAULT '',
  uploaded_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  expires_at DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_textbook_sources_unit
  ON textbook_sources(grade, subject, textbook_company, unit_name, status);
CREATE INDEX IF NOT EXISTS idx_textbook_sources_expires
  ON textbook_sources(expires_at);
