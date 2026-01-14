-- バージョン管理・履歴機能

-- 1. 単元編集履歴テーブル
CREATE TABLE IF NOT EXISTS curriculum_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  curriculum_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'duplicate'
  changed_by TEXT DEFAULT 'system',
  changed_fields TEXT, -- JSON: {"field": "old_value -> new_value"}
  snapshot TEXT, -- JSON: 全データのスナップショット
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_curriculum_history_curriculum ON curriculum_history(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_history_created ON curriculum_history(created_at);

-- 2. カード編集履歴テーブル
CREATE TABLE IF NOT EXISTS card_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'reorder'
  changed_by TEXT DEFAULT 'system',
  changed_fields TEXT, -- JSON
  snapshot TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (card_id) REFERENCES learning_cards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_card_history_card ON card_history(card_id);
CREATE INDEX IF NOT EXISTS idx_card_history_created ON card_history(created_at);
