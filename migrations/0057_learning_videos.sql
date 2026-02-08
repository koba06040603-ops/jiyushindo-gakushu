-- Phase 25: 学習動画ライブラリ

-- 1. 動画テーブル
CREATE TABLE IF NOT EXISTS learning_videos (
  video_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  
  -- 動画情報
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- 動画ソース
  video_type TEXT NOT NULL DEFAULT 'youtube',  -- 'youtube', 'vimeo', 'url', 'upload'
  video_url TEXT NOT NULL,                     -- YouTube URL, 埋め込みURL, etc.
  video_id_external TEXT,                      -- YouTube ID, Vimeo ID, etc.
  duration_seconds INTEGER,                    -- 動画の長さ（秒）
  
  -- カテゴリ・タグ
  subject TEXT NOT NULL,                       -- 教科
  grade TEXT,                                  -- 学年（複数の場合はJSON配列）
  unit TEXT,                                   -- 単元
  tags TEXT,                                   -- タグ（JSON配列）
  difficulty_level TEXT DEFAULT 'standard',    -- 'basic', 'standard', 'advanced'
  
  -- 作成者
  created_by INTEGER NOT NULL,                 -- 教員ID
  created_by_name TEXT,
  
  -- 公開設定
  is_public INTEGER DEFAULT 0,                 -- 校内公開
  is_featured INTEGER DEFAULT 0,               -- おすすめ動画
  is_active INTEGER DEFAULT 1,
  
  -- 統計
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  completion_rate REAL DEFAULT 0,              -- 平均視聴完了率
  
  -- メタデータ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  published_at DATETIME,
  
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_videos_subject ON learning_videos(subject, grade);
CREATE INDEX IF NOT EXISTS idx_videos_creator ON learning_videos(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_featured ON learning_videos(is_featured, view_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_school ON learning_videos(school_id, is_active);

-- 2. 動画視聴履歴テーブル
CREATE TABLE IF NOT EXISTS video_watch_history (
  watch_id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  
  -- 視聴情報
  watch_start DATETIME NOT NULL,
  watch_end DATETIME,
  watch_duration_seconds INTEGER,              -- 実際の視聴時間
  completion_percentage REAL DEFAULT 0,        -- 視聴完了率（0-100）
  
  -- 視聴状態
  is_completed INTEGER DEFAULT 0,              -- 最後まで見たか
  last_position_seconds INTEGER DEFAULT 0,     -- 最後に見た位置
  
  -- デバイス情報
  device_type TEXT,                            -- 'desktop', 'mobile', 'tablet'
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (video_id) REFERENCES learning_videos(video_id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_student ON video_watch_history(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_history_video ON video_watch_history(video_id, created_at DESC);

-- 3. 動画評価テーブル
CREATE TABLE IF NOT EXISTS video_ratings (
  rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  
  -- 評価
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),  -- 1-5星
  is_liked INTEGER DEFAULT 0,                  -- いいね
  
  -- コメント
  comment TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (video_id) REFERENCES learning_videos(video_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(video_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_video_ratings_video ON video_ratings(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_ratings_user ON video_ratings(user_id, created_at DESC);

-- 4. 動画プレイリストテーブル
CREATE TABLE IF NOT EXISTS video_playlists (
  playlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  
  -- プレイリスト情報
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- カテゴリ
  subject TEXT,
  grade TEXT,
  
  -- 作成者
  created_by INTEGER NOT NULL,
  created_by_name TEXT,
  
  -- 公開設定
  is_public INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  
  -- 統計
  video_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_playlists_creator ON video_playlists(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_subject ON video_playlists(subject, grade);

-- 5. プレイリスト-動画関連テーブル
CREATE TABLE IF NOT EXISTS playlist_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playlist_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  
  -- 順序
  display_order INTEGER NOT NULL DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (playlist_id) REFERENCES video_playlists(playlist_id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES learning_videos(video_id) ON DELETE CASCADE,
  UNIQUE(playlist_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist ON playlist_videos(playlist_id, display_order);
CREATE INDEX IF NOT EXISTS idx_playlist_videos_video ON playlist_videos(video_id);

-- 6. おすすめ動画ログテーブル（レコメンデーションシステム用）
CREATE TABLE IF NOT EXISTS video_recommendations (
  recommendation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  video_id INTEGER NOT NULL,
  
  -- おすすめ理由
  reason TEXT,                                 -- 'similar_content', 'popular', 'teacher_pick', 'ai_suggested'
  recommendation_score REAL DEFAULT 0,         -- おすすめスコア（0-1）
  
  -- 結果
  is_clicked INTEGER DEFAULT 0,
  is_watched INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (video_id) REFERENCES learning_videos(video_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_student ON video_recommendations(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_video ON video_recommendations(video_id);

-- 7. トリガー: 動画視聴完了時の統計更新
CREATE TRIGGER IF NOT EXISTS update_video_stats_on_complete
AFTER UPDATE ON video_watch_history
WHEN NEW.is_completed = 1 AND OLD.is_completed = 0
BEGIN
  UPDATE learning_videos
  SET 
    view_count = view_count + 1,
    completion_rate = (
      SELECT AVG(completion_percentage)
      FROM video_watch_history
      WHERE video_id = NEW.video_id
        AND is_completed = 1
    )
  WHERE video_id = NEW.video_id;
END;

-- 9. デフォルトデータ: サンプル動画（教員が追加する例）
-- Note: 実際のデータはアプリケーションから挿入されます
