-- Phase 22: 教員向けコメント・フィードバック機能
-- 教員が児童の学習に対してコメント・フィードバックを送信する機能

-- 1. teacher_comments テーブル（教員コメント）
CREATE TABLE IF NOT EXISTS teacher_comments (
  comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  comment_type TEXT NOT NULL DEFAULT 'general', -- general, learning_card, mistake_note, encouragement
  target_type TEXT, -- learning_card, answer, mistake, progress
  target_id INTEGER, -- 対象のID（learning_card_id, answer_id, mistake_idなど）
  subject TEXT, -- 教科
  unit_name TEXT, -- 単元名
  comment_text TEXT NOT NULL,
  sentiment TEXT DEFAULT 'positive', -- positive, neutral, constructive
  is_read INTEGER DEFAULT 0, -- 児童が読んだかどうか
  read_at DATETIME, -- 読んだ日時
  is_pinned INTEGER DEFAULT 0, -- ピン留め
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_teacher_comments_student ON teacher_comments(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_comments_teacher ON teacher_comments(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_comments_target ON teacher_comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_teacher_comments_unread ON teacher_comments(student_id, is_read, created_at DESC);

-- 2. comment_templates テーブル（コメントテンプレート）
CREATE TABLE IF NOT EXISTS comment_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER, -- NULLの場合は学校共通テンプレート
  template_name TEXT NOT NULL,
  template_category TEXT DEFAULT 'encouragement', -- encouragement, feedback, guidance, praise
  template_text TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_comment_templates_teacher ON comment_templates(teacher_id, template_category);
CREATE INDEX IF NOT EXISTS idx_comment_templates_usage ON comment_templates(usage_count DESC);

-- 3. comment_reactions テーブル（コメントへのリアクション）
CREATE TABLE IF NOT EXISTS comment_reactions (
  reaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  reaction_type TEXT NOT NULL DEFAULT 'like', -- like, heart, smile, thumbs_up, star
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES teacher_comments(comment_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  UNIQUE(comment_id, student_id) -- 1コメント1リアクションのみ
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_student ON comment_reactions(student_id, created_at DESC);

-- 4. comment_attachments テーブル（コメント添付ファイル）
CREATE TABLE IF NOT EXISTS comment_attachments (
  attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  file_type TEXT NOT NULL, -- image, document, audio
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (comment_id) REFERENCES teacher_comments(comment_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment ON comment_attachments(comment_id);

-- 5. comment_statistics テーブル（コメント統計）
CREATE TABLE IF NOT EXISTS comment_statistics (
  stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  teacher_id INTEGER NOT NULL,
  stat_date DATE NOT NULL,
  total_comments INTEGER DEFAULT 0,
  comments_by_type TEXT, -- JSON: {"general": 10, "learning_card": 5, ...}
  comments_by_sentiment TEXT, -- JSON: {"positive": 12, "constructive": 3, ...}
  avg_response_time_minutes REAL, -- 平均応答時間（分）
  student_read_rate REAL, -- 児童既読率（%）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(user_id),
  UNIQUE(teacher_id, stat_date)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_comment_statistics_teacher_date ON comment_statistics(teacher_id, stat_date DESC);

-- デフォルトのコメントテンプレートを挿入
INSERT OR IGNORE INTO comment_templates (school_id, template_name, template_category, template_text) VALUES
  -- 励まし系
  (1, 'よくできました！', 'encouragement', 'よくできました！この調子で頑張りましょう！'),
  (1, '成長を感じます', 'encouragement', '最近の成長がすばらしいです。この調子で続けていきましょう。'),
  (1, '前回より良くなっています', 'encouragement', '前回よりも良くなっています。努力が実を結んでいますね。'),
  (1, 'チャレンジ精神が素晴らしい', 'encouragement', 'チャレンジする姿勢が素晴らしいです。失敗を恐れずに挑戦しましょう。'),
  
  -- フィードバック系
  (1, 'もう一度復習しましょう', 'feedback', 'この単元をもう一度復習してみましょう。基礎からゆっくり確認していきましょう。'),
  (1, '考え方は合っています', 'feedback', '考え方の方向性は合っています。計算の部分を見直してみましょう。'),
  (1, 'ヒントを参考に', 'feedback', 'ヒントを参考にしながら、もう一度チャレンジしてみましょう。'),
  (1, '時間をかけてじっくり', 'feedback', '焦らず、時間をかけてじっくり考えることが大切です。'),
  
  -- 指導系
  (1, 'この部分を重点的に', 'guidance', 'この部分を重点的に学習すると、さらに理解が深まります。'),
  (1, '図を描いてみましょう', 'guidance', '問題を図に描いてみると、より理解しやすくなります。試してみましょう。'),
  (1, '例題を参考に', 'guidance', '教科書の例題を参考にしながら、解き方を確認してみましょう。'),
  (1, 'ステップごとに確認', 'guidance', '1つずつステップを踏んで、順番に確認していきましょう。'),
  
  -- 称賛系
  (1, '完璧です！', 'praise', '完璧です！理解度が高いですね。次の単元も楽しみです。'),
  (1, '説明がわかりやすい', 'praise', 'あなたの説明はとてもわかりやすいです。他の友達の見本になりますね。'),
  (1, '応用力が素晴らしい', 'praise', '応用問題もしっかり解けていますね。応用力が素晴らしいです。'),
  (1, '集中力が高い', 'praise', '集中して取り組む姿勢が素晴らしいです。その調子で続けましょう。');

-- 統計用トリガー（コメント作成時）
CREATE TRIGGER IF NOT EXISTS update_comment_stats_on_insert
AFTER INSERT ON teacher_comments
BEGIN
  INSERT OR REPLACE INTO comment_statistics (
    school_id, teacher_id, stat_date, 
    total_comments, created_at, updated_at
  )
  SELECT 
    NEW.school_id,
    NEW.teacher_id,
    DATE(NEW.created_at),
    COALESCE(
      (SELECT total_comments FROM comment_statistics 
       WHERE teacher_id = NEW.teacher_id AND stat_date = DATE(NEW.created_at)), 
      0
    ) + 1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;
END;

-- 統計用トリガー（コメント既読時）
CREATE TRIGGER IF NOT EXISTS update_comment_stats_on_read
AFTER UPDATE OF is_read ON teacher_comments
WHEN NEW.is_read = 1 AND OLD.is_read = 0
BEGIN
  UPDATE comment_statistics
  SET 
    student_read_rate = (
      SELECT CAST(COUNT(*) AS REAL) * 100.0 / 
        (SELECT COUNT(*) FROM teacher_comments WHERE teacher_id = NEW.teacher_id AND DATE(created_at) = stat_date)
      FROM teacher_comments
      WHERE teacher_id = NEW.teacher_id 
        AND DATE(created_at) = stat_date
        AND is_read = 1
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE teacher_id = NEW.teacher_id 
    AND stat_date = DATE(NEW.created_at);
END;
