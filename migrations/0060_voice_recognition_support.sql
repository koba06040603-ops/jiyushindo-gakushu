-- Phase 28: 音声認識による学習サポート

-- 1. 音声入力履歴テーブル
CREATE TABLE IF NOT EXISTS voice_input_history (
  voice_input_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  
  -- 音声入力情報
  input_type TEXT NOT NULL, -- 'question', 'answer', 'search', 'command'
  input_context TEXT, -- 'chat', 'problem_solving', 'video_search'
  
  -- 音声データ
  audio_url TEXT, -- 録音データのURL（オプション）
  audio_duration_ms INTEGER,
  
  -- 認識結果
  recognized_text TEXT NOT NULL,
  confidence_score REAL, -- 0-1の信頼度
  language TEXT DEFAULT 'ja-JP',
  
  -- 処理結果
  processed_result TEXT, -- AIの応答や検索結果
  was_successful INTEGER DEFAULT 1,
  error_message TEXT,
  
  -- デバイス情報
  device_type TEXT,
  browser_type TEXT,
  
  -- 統計用
  response_time_ms INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_input_student ON voice_input_history(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_input_type ON voice_input_history(input_type, was_successful);

-- 2. 音声コマンド定義テーブル
CREATE TABLE IF NOT EXISTS voice_commands (
  command_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  
  -- コマンド情報
  command_name TEXT NOT NULL,
  command_patterns TEXT NOT NULL, -- JSON array: ["次の問題", "つぎのもんだい", "ネクスト"]
  
  -- コマンドアクション
  action_type TEXT NOT NULL, -- 'navigate', 'control', 'search', 'help'
  action_target TEXT NOT NULL, -- 'next_problem', 'previous_problem', 'submit_answer', etc.
  
  -- 対象画面
  applicable_pages TEXT, -- JSON array: ["/learning", "/chat"]
  
  -- 説明
  description TEXT,
  example_usage TEXT,
  
  -- 統計
  usage_count INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(school_id, command_name)
);

-- デフォルト音声コマンドの挿入
INSERT OR IGNORE INTO voice_commands (school_id, command_name, command_patterns, action_type, action_target, description, example_usage) VALUES
  (1, '次の問題', '["次の問題", "つぎのもんだい", "ネクスト", "次へ"]', 'navigate', 'next_problem', '次の問題に進みます', '「次の問題」と言ってください'),
  (1, '前の問題', '["前の問題", "まえのもんだい", "戻る", "もどる"]', 'navigate', 'previous_problem', '前の問題に戻ります', '「前の問題」と言ってください'),
  (1, '答えを送信', '["答えを送信", "こたえをそうしん", "提出", "ていしゅつ", "送信"]', 'control', 'submit_answer', '答えを送信します', '「答えを送信」と言ってください'),
  (1, 'ヒントを見る', '["ヒントを見る", "ヒント", "hint", "わからない"]', 'control', 'show_hint', 'ヒントを表示します', '「ヒントを見る」と言ってください'),
  (1, '解説を見る', '["解説を見る", "かいせつ", "説明", "せつめい"]', 'control', 'show_explanation', '解説を表示します', '「解説を見る」と言ってください'),
  (1, '動画を探す', '["動画を探す", "どうがをさがす", "ビデオ検索"]', 'search', 'search_videos', '動画を検索します', '「動画を探す」の後に検索ワードを言ってください'),
  (1, 'ヘルプ', '["ヘルプ", "助けて", "たすけて", "使い方", "つかいかた"]', 'help', 'show_help', 'ヘルプを表示します', '「ヘルプ」と言ってください');

CREATE INDEX IF NOT EXISTS idx_voice_commands_active ON voice_commands(is_active, action_type);

-- 3. 音声認識設定テーブル（ユーザーごと）
CREATE TABLE IF NOT EXISTS voice_recognition_settings (
  setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  -- 音声認識設定
  is_enabled INTEGER DEFAULT 1,
  auto_start_recognition INTEGER DEFAULT 0,
  continuous_recognition INTEGER DEFAULT 0,
  
  -- 言語設定
  recognition_language TEXT DEFAULT 'ja-JP',
  alternate_languages TEXT, -- JSON array: ["en-US"]
  
  -- 音声設定
  voice_feedback_enabled INTEGER DEFAULT 1, -- 音声で結果を読み上げる
  voice_speed REAL DEFAULT 1.0, -- 0.5-2.0
  voice_pitch REAL DEFAULT 1.0,
  
  -- フィルター設定
  filter_inappropriate_content INTEGER DEFAULT 1,
  profanity_filter INTEGER DEFAULT 1,
  
  -- UIカスタマイズ
  show_waveform INTEGER DEFAULT 1,
  show_transcription INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  UNIQUE(user_id)
);

-- 4. 音声問題解答テーブル
CREATE TABLE IF NOT EXISTS voice_problem_answers (
  voice_answer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  problem_id INTEGER,
  
  -- 音声入力
  voice_input_id INTEGER, -- 参照: voice_input_history
  raw_transcription TEXT NOT NULL,
  
  -- 解答処理
  parsed_answer TEXT, -- 正規化された解答
  is_correct INTEGER,
  
  -- フィードバック
  feedback_text TEXT,
  feedback_audio_url TEXT, -- 音声フィードバックのURL
  
  -- 評価
  pronunciation_score REAL, -- 発音評価（英語など）
  fluency_score REAL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (voice_input_id) REFERENCES voice_input_history(voice_input_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_answers_student ON voice_problem_answers(student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_answers_problem ON voice_problem_answers(problem_id);

-- 5. 音声学習セッションテーブル
CREATE TABLE IF NOT EXISTS voice_learning_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  
  -- セッション情報
  session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  session_end DATETIME,
  duration_minutes REAL,
  
  -- 音声使用統計
  total_voice_inputs INTEGER DEFAULT 0,
  successful_recognitions INTEGER DEFAULT 0,
  failed_recognitions INTEGER DEFAULT 0,
  avg_confidence_score REAL,
  
  -- 学習成果
  problems_solved_by_voice INTEGER DEFAULT 0,
  voice_commands_used INTEGER DEFAULT 0,
  voice_search_count INTEGER DEFAULT 0,
  
  -- セッション評価
  user_satisfaction_rating INTEGER, -- 1-5
  user_feedback TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_sessions_student ON voice_learning_sessions(student_id, session_start DESC);

-- 6. 音声認識エラーログテーブル
CREATE TABLE IF NOT EXISTS voice_recognition_errors (
  error_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER,
  voice_input_id INTEGER,
  
  -- エラー情報
  error_type TEXT NOT NULL, -- 'no_speech', 'aborted', 'audio_capture', 'network', 'not_allowed', 'service_not_allowed'
  error_code TEXT,
  error_message TEXT,
  
  -- コンテキスト
  browser_type TEXT,
  device_type TEXT,
  os_type TEXT,
  
  -- 音声データ
  attempted_language TEXT,
  audio_duration_ms INTEGER,
  
  -- デバッグ情報
  stack_trace TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (voice_input_id) REFERENCES voice_input_history(voice_input_id)
);

CREATE INDEX IF NOT EXISTS idx_voice_errors_type ON voice_recognition_errors(error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_voice_errors_student ON voice_recognition_errors(student_id, created_at DESC);

-- 7. 音声認識統計ビュー
CREATE VIEW IF NOT EXISTS v_voice_recognition_stats AS
SELECT 
  student_id,
  COUNT(*) as total_inputs,
  SUM(CASE WHEN was_successful = 1 THEN 1 ELSE 0 END) as successful_inputs,
  AVG(confidence_score) as avg_confidence,
  AVG(response_time_ms) as avg_response_time,
  COUNT(DISTINCT DATE(created_at)) as active_days
FROM voice_input_history
GROUP BY student_id;
