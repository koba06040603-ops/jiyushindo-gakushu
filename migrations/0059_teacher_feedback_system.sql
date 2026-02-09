-- Phase 27: 教員向けコメント・フィードバック機能

-- 1. 教員コメントテーブル（拡張版）
CREATE TABLE IF NOT EXISTS teacher_feedback (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  
  -- 対象
  student_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  
  -- コメント内容
  feedback_type TEXT NOT NULL, -- 'encouragement', 'guidance', 'correction', 'praise', 'concern'
  comment_text TEXT NOT NULL,
  
  -- 関連情報
  related_subject TEXT,
  related_unit TEXT,
  related_problem_id INTEGER,
  related_session_id INTEGER,
  
  -- 可視性設定
  is_visible_to_student INTEGER DEFAULT 1,
  is_visible_to_parent INTEGER DEFAULT 1,
  is_private_note INTEGER DEFAULT 0, -- 教員間のみ共有
  
  -- タグ
  tags TEXT, -- JSON array: ["弱点克服", "努力賞", "要注意"]
  
  -- 優先度・緊急度
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  requires_followup INTEGER DEFAULT 0,
  followup_deadline DATE,
  
  -- ステータス
  status TEXT DEFAULT 'active', -- 'active', 'resolved', 'archived'
  resolved_at DATETIME,
  resolved_by INTEGER,
  
  -- 既読管理
  read_by_student_at DATETIME,
  read_by_parent_at DATETIME,
  
  -- 添付ファイル（将来拡張用）
  attachment_url TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (teacher_id) REFERENCES users(user_id),
  FOREIGN KEY (resolved_by) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_feedback_student ON teacher_feedback(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_feedback_teacher ON teacher_feedback(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_feedback_status ON teacher_feedback(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_feedback_followup ON teacher_feedback(requires_followup, followup_deadline);

-- 2. フィードバックテンプレートテーブル
CREATE TABLE IF NOT EXISTS feedback_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER,
  
  -- テンプレート情報
  template_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'encouragement', 'guidance', 'correction', 'praise'
  
  -- テンプレート本文（変数置換対応）
  template_text TEXT NOT NULL, -- 例: "{student_name}さん、{subject}の正答率が{accuracy}%になりましたね！"
  
  -- 使用条件
  applicable_subjects TEXT, -- JSON array
  applicable_grades TEXT,
  
  -- 統計
  usage_count INTEGER DEFAULT 0,
  last_used_at DATETIME,
  
  -- 公開設定
  is_public INTEGER DEFAULT 0, -- 学校全体で共有
  is_active INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (teacher_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_templates_category ON feedback_templates(category, is_public);

-- デフォルトテンプレートの挿入
INSERT OR IGNORE INTO feedback_templates (template_id, school_id, template_name, category, template_text, is_public) VALUES
  (1, 1, '正答率向上の励まし', 'encouragement', '{student_name}さん、{subject}の正答率が{improvement}%向上しましたね！この調子で頑張りましょう。', 1),
  (2, 1, '連続学習の称賛', 'praise', '{consecutive_days}日連続で学習に取り組んでいますね。素晴らしい努力です！', 1),
  (3, 1, '弱点克服のアドバイス', 'guidance', '{subject}の{unit}が少し苦手なようです。{advice}を試してみましょう。', 1),
  (4, 1, '学習時間の励まし', 'encouragement', '今週は{study_hours}時間も勉強しましたね。とても頑張っています！', 1),
  (5, 1, '復習の推奨', 'guidance', '{subject}の復習をお勧めします。特に{weak_units}を重点的に見直しましょう。', 1);

-- 3. フィードバック履歴（教員の確認用）
CREATE TABLE IF NOT EXISTS feedback_history (
  history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id INTEGER NOT NULL,
  
  -- 変更内容
  action_type TEXT NOT NULL, -- 'created', 'updated', 'resolved', 'archived', 'read'
  action_by INTEGER NOT NULL,
  
  -- 変更詳細
  old_value TEXT,
  new_value TEXT,
  
  -- メモ
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (feedback_id) REFERENCES teacher_feedback(feedback_id) ON DELETE CASCADE,
  FOREIGN KEY (action_by) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_history_feedback ON feedback_history(feedback_id, created_at DESC);

-- 4. 学生の学習アクションに対する教員のリアクションテーブル
CREATE TABLE IF NOT EXISTS teacher_reactions (
  reaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  
  -- 対象アクション
  student_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'answer', 'session_complete', 'milestone', 'video_watched'
  action_id INTEGER NOT NULL, -- answer_history.id, session.id, etc.
  
  -- リアクション
  reaction_type TEXT NOT NULL, -- 'like', 'star', 'medal', 'comment'
  reaction_icon TEXT, -- emoji or icon name
  
  -- コメント（簡易版）
  quick_comment TEXT,
  
  -- 可視性
  is_visible_to_student INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (teacher_id) REFERENCES users(user_id),
  UNIQUE(teacher_id, action_type, action_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_reactions_student ON teacher_reactions(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_reactions_action ON teacher_reactions(action_type, action_id);

-- 5. フィードバック通知設定テーブル
CREATE TABLE IF NOT EXISTS feedback_notification_settings (
  setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL, -- 'student', 'parent', 'teacher'
  
  -- 通知設定
  notify_new_feedback INTEGER DEFAULT 1,
  notify_feedback_updates INTEGER DEFAULT 1,
  notify_followup_required INTEGER DEFAULT 1,
  notify_feedback_resolved INTEGER DEFAULT 1,
  
  -- 通知チャネル
  email_notifications INTEGER DEFAULT 1,
  app_notifications INTEGER DEFAULT 1,
  
  -- 通知頻度
  notification_frequency TEXT DEFAULT 'immediate', -- 'immediate', 'daily_digest', 'weekly_digest'
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(user_id)
);

-- 6. トリガー: フィードバック作成時に通知を生成
CREATE TRIGGER IF NOT EXISTS notify_on_feedback_created
AFTER INSERT ON teacher_feedback
WHEN NEW.is_visible_to_student = 1 OR NEW.is_visible_to_parent = 1
BEGIN
  -- 実際の通知送信はアプリケーション側で処理
  -- ここでは履歴記録のみ
  INSERT INTO feedback_history (feedback_id, action_type, action_by)
  VALUES (NEW.feedback_id, 'created', NEW.teacher_id);
END;

-- 7. トリガー: フィードバック既読時の記録
CREATE TRIGGER IF NOT EXISTS track_feedback_read
AFTER UPDATE OF read_by_student_at, read_by_parent_at ON teacher_feedback
BEGIN
  INSERT INTO feedback_history (
    feedback_id, 
    action_type, 
    action_by, 
    notes
  )
  VALUES (
    NEW.feedback_id,
    'read',
    COALESCE(NEW.student_id, 0),
    CASE 
      WHEN NEW.read_by_student_at IS NOT NULL AND OLD.read_by_student_at IS NULL THEN 'read_by_student'
      WHEN NEW.read_by_parent_at IS NOT NULL AND OLD.read_by_parent_at IS NULL THEN 'read_by_parent'
      ELSE 'read'
    END
  );
END;
