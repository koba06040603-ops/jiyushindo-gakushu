-- Phase 25: 保護者向けリアルタイム通知システム

-- 1. 通知設定テーブル
CREATE TABLE IF NOT EXISTS notification_settings (
  setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'parent', -- 'parent', 'teacher', 'student'
  
  -- 通知種別の有効/無効
  learning_start INTEGER DEFAULT 1,      -- 学習開始通知
  learning_end INTEGER DEFAULT 1,        -- 学習終了通知
  achievement INTEGER DEFAULT 1,         -- 成果達成通知
  badge_earned INTEGER DEFAULT 1,        -- バッジ獲得通知
  weakness_found INTEGER DEFAULT 1,      -- 弱点発見通知
  milestone_reached INTEGER DEFAULT 1,   -- マイルストーン達成通知
  weekly_summary INTEGER DEFAULT 1,      -- 週次サマリー
  monthly_summary INTEGER DEFAULT 1,     -- 月次サマリー
  
  -- 通知方法
  in_app_notification INTEGER DEFAULT 1,  -- アプリ内通知
  email_notification INTEGER DEFAULT 1,   -- メール通知
  push_notification INTEGER DEFAULT 0,    -- プッシュ通知（今後実装）
  
  -- 通知タイミング
  quiet_hours_start TIME,                -- 静かな時間帯開始（例: 22:00）
  quiet_hours_end TIME,                  -- 静かな時間帯終了（例: 07:00）
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);

-- 2. 通知履歴テーブル
CREATE TABLE IF NOT EXISTS notification_history (
  notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL,        -- 通知受信者ID
  student_id INTEGER,                   -- 関連する生徒ID（保護者通知の場合）
  
  -- 通知内容
  notification_type TEXT NOT NULL,      -- 'learning_start', 'achievement', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data TEXT,                           -- JSON形式の追加データ
  
  -- 通知方法
  delivery_method TEXT NOT NULL,       -- 'in_app', 'email', 'push'
  
  -- ステータス
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  is_sent INTEGER DEFAULT 0,           -- 送信済みフラグ（メール用）
  sent_at DATETIME,
  
  -- 優先度
  priority TEXT DEFAULT 'normal',      -- 'low', 'normal', 'high', 'urgent'
  
  -- リンク
  action_url TEXT,                     -- 通知をクリックした時のリンク先
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,                 -- 通知の有効期限
  
  FOREIGN KEY (recipient_id) REFERENCES users(user_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_history_recipient ON notification_history(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_student ON notification_history(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_unread ON notification_history(recipient_id, is_read, created_at DESC);

-- 3. 週次サマリーテーブル
CREATE TABLE IF NOT EXISTS weekly_summaries (
  summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  parent_id INTEGER,
  
  -- 期間
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  
  -- 学習統計
  total_study_time INTEGER DEFAULT 0,      -- 総学習時間（秒）
  total_problems_solved INTEGER DEFAULT 0, -- 解いた問題数
  correct_rate REAL DEFAULT 0,            -- 正答率
  streak_days INTEGER DEFAULT 0,          -- 連続学習日数
  
  -- 教科別統計（JSON形式）
  subject_stats TEXT,                     -- {"算数": {"problems": 50, "accuracy": 85}, ...}
  
  -- 成果
  badges_earned INTEGER DEFAULT 0,
  achievements TEXT,                      -- JSON配列
  
  -- 弱点と改善
  weak_areas TEXT,                       -- JSON配列
  improvement_areas TEXT,                -- JSON配列
  
  -- AIからの推奨
  ai_recommendations TEXT,               -- JSON配列
  
  -- 送信ステータス
  is_sent INTEGER DEFAULT 0,
  sent_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (parent_id) REFERENCES users(user_id),
  UNIQUE(student_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_summaries_student ON weekly_summaries(student_id, year DESC, week_number DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_summaries_parent ON weekly_summaries(parent_id, created_at DESC);

-- 4. 保護者-生徒関連テーブルの拡張
ALTER TABLE parent_student_relations ADD COLUMN is_primary INTEGER DEFAULT 1;
ALTER TABLE parent_student_relations ADD COLUMN is_active INTEGER DEFAULT 1;

-- 5. 学習セッションへのカラム追加（既存テーブルを拡張）
ALTER TABLE learning_sessions ADD COLUMN subject TEXT;
ALTER TABLE learning_sessions ADD COLUMN problems_solved INTEGER DEFAULT 0;
ALTER TABLE learning_sessions ADD COLUMN correct_answers INTEGER DEFAULT 0;
ALTER TABLE learning_sessions ADD COLUMN duration_seconds INTEGER;

-- 6. トリガー: 学習開始通知の自動生成
CREATE TRIGGER IF NOT EXISTS notify_learning_start
AFTER INSERT ON learning_sessions
WHEN NEW.session_end IS NULL
BEGIN
  -- 保護者に学習開始通知を送信
  INSERT INTO notification_history (
    recipient_id, 
    student_id, 
    notification_type, 
    title, 
    message, 
    delivery_method,
    action_url
  )
  SELECT 
    psr.parent_id,
    NEW.student_id,
    'learning_start',
    (SELECT name FROM users WHERE id = NEW.student_id) || 'さんが学習を開始しました',
    '科目: ' || COALESCE(NEW.subject, '未選択') || '
開始時刻: ' || strftime('%H:%M', NEW.session_start),
    'in_app',
    '/parent/student/' || NEW.student_id
  FROM parent_student_relations psr
  JOIN notification_settings ns ON ns.user_id = psr.parent_id
  WHERE psr.student_id = NEW.student_id
    AND psr.is_active = 1
    AND ns.learning_start = 1
    AND ns.in_app_notification = 1;
END;

-- 7. トリガー: 学習終了通知の自動生成
CREATE TRIGGER IF NOT EXISTS notify_learning_end
AFTER UPDATE ON learning_sessions
WHEN NEW.session_end IS NOT NULL AND OLD.session_end IS NULL
BEGIN
  -- 保護者に学習終了通知を送信
  INSERT INTO notification_history (
    recipient_id, 
    student_id, 
    notification_type, 
    title, 
    message, 
    delivery_method,
    action_url
  )
  SELECT 
    psr.parent_id,
    NEW.student_id,
    'learning_end',
    (SELECT name FROM users WHERE id = NEW.student_id) || 'さんが学習を終了しました',
    '学習時間: ' || (NEW.duration_seconds / 60) || '分
解いた問題: ' || NEW.problems_solved || '問
正答率: ' || ROUND(CAST(NEW.correct_answers AS REAL) / NULLIF(NEW.problems_solved, 0) * 100, 1) || '%',
    'in_app',
    '/parent/student/' || NEW.student_id
  FROM parent_student_relations psr
  JOIN notification_settings ns ON ns.user_id = psr.parent_id
  WHERE psr.student_id = NEW.student_id
    AND psr.is_active = 1
    AND ns.learning_end = 1
    AND ns.in_app_notification = 1;
END;

-- 8. デフォルトデータ: 通知テンプレート
CREATE TABLE IF NOT EXISTS notification_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO notification_templates (template_name, notification_type, title_template, message_template, priority) VALUES
  ('learning_start', 'learning_start', 
   '{{student_name}}さんが学習を開始しました', 
   '科目: {{subject}}
開始時刻: {{start_time}}', 
   'normal'),
  
  ('learning_end', 'learning_end', 
   '{{student_name}}さんが学習を終了しました', 
   '学習時間: {{duration}}分
解いた問題: {{problems}}問
正答率: {{accuracy}}%', 
   'normal'),
  
  ('badge_earned', 'achievement', 
   '🏆 {{student_name}}さんがバッジを獲得しました！', 
   'バッジ: {{badge_name}}
説明: {{badge_description}}', 
   'high'),
  
  ('milestone_reached', 'achievement', 
   '🎉 {{student_name}}さんがマイルストーンを達成！', 
   'マイルストーン: {{milestone_name}}
達成内容: {{milestone_description}}', 
   'high'),
  
  ('weakness_found', 'weakness_found', 
   '⚠️ {{student_name}}さんの苦手分野が見つかりました', 
   '科目: {{subject}}
単元: {{unit}}
推奨: {{recommendation}}', 
   'normal'),
  
  ('weekly_summary', 'weekly_summary', 
   '📊 {{student_name}}さんの今週の学習サマリー', 
   '学習時間: {{total_time}}時間
問題数: {{total_problems}}問
正答率: {{accuracy}}%
連続学習: {{streak}}日', 
   'normal');
