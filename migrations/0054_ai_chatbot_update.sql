-- Phase 23: AI チャットボット - 既存テーブルの拡張
-- 全教科対応のAIアシスタント

-- 1. chat_conversations テーブル（会話セッション）
CREATE TABLE IF NOT EXISTS chat_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER NOT NULL,
  title TEXT,
  subject TEXT,
  grade TEXT,
  message_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(user_id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_student ON chat_conversations(student_id, updated_at DESC);

-- 2. chat_messages テーブル（メッセージ）
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,
  topic TEXT,
  question_type TEXT,
  ai_model TEXT DEFAULT 'gemini-2.0-flash-exp',
  tokens_used INTEGER,
  response_time_ms INTEGER,
  has_attachment INTEGER DEFAULT 0,
  attachment_url TEXT,
  is_helpful INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES chat_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);

-- 3. chat_quick_replies テーブル（クイック返信テンプレート）
CREATE TABLE IF NOT EXISTS chat_quick_replies (
  reply_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  grade TEXT,
  category TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_quick_replies_subject ON chat_quick_replies(subject, grade, display_order);

-- 4. chat_knowledge_base テーブル（知識ベース）
CREATE TABLE IF NOT EXISTS chat_knowledge_base (
  knowledge_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  grade TEXT,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT,
  difficulty_level TEXT DEFAULT 'standard',
  source TEXT,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_knowledge_base_subject ON chat_knowledge_base(subject, grade, topic);
CREATE INDEX IF NOT EXISTS idx_chat_knowledge_base_verified ON chat_knowledge_base(is_verified, subject);

-- 5. chat_statistics テーブル（統計）
CREATE TABLE IF NOT EXISTS chat_statistics (
  stat_id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL DEFAULT 1,
  student_id INTEGER,
  stat_date DATE NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  messages_by_subject TEXT,
  avg_response_time_ms REAL,
  helpful_rate REAL,
  total_tokens_used INTEGER,
  peak_hour INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_chat_statistics_student_date ON chat_statistics(student_id, stat_date DESC);

-- 6. chat_feedback テーブル（フィードバック）
CREATE TABLE IF NOT EXISTS chat_feedback (
  feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  rating INTEGER,
  feedback_type TEXT,
  feedback_text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES chat_messages(id),
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_feedback_message ON chat_feedback(message_id);

-- デフォルトのクイック返信を挿入（全教科対応）
INSERT OR IGNORE INTO chat_quick_replies (school_id, subject, category, reply_text, display_order) VALUES
  -- 算数
  (1, '算数', 'getting_started', 'この問題の解き方を教えて', 1),
  (1, '算数', 'getting_started', '計算のコツを教えて', 2),
  (1, '算数', 'getting_started', 'もっと簡単な例を見せて', 3),
  (1, '算数', 'common_questions', '分数の計算がわかりません', 4),
  (1, '算数', 'common_questions', '図形の面積の求め方を教えて', 5),
  
  -- 国語
  (1, '国語', 'getting_started', 'この漢字の意味を教えて', 1),
  (1, '国語', 'getting_started', '文章の読み方のコツを教えて', 2),
  (1, '国語', 'getting_started', 'この言葉の使い方を教えて', 3),
  (1, '国語', 'common_questions', '主語と述語の見つけ方を教えて', 4),
  (1, '国語', 'common_questions', '作文の書き方を教えて', 5),
  
  -- 理科
  (1, '理科', 'getting_started', 'この実験について教えて', 1),
  (1, '理科', 'getting_started', '観察のポイントを教えて', 2),
  (1, '理科', 'getting_started', 'なぜそうなるのか教えて', 3),
  (1, '理科', 'common_questions', '植物の育ち方について教えて', 4),
  (1, '理科', 'common_questions', '星の動きについて教えて', 5),
  
  -- 社会
  (1, '社会', 'getting_started', 'この地図の見方を教えて', 1),
  (1, '社会', 'getting_started', '歴史の覚え方を教えて', 2),
  (1, '社会', 'getting_started', 'この出来事について教えて', 3),
  (1, '社会', 'common_questions', '都道府県の特徴を教えて', 4),
  (1, '社会', 'common_questions', '時代の流れを教えて', 5),
  
  -- 英語
  (1, '英語', 'getting_started', 'この単語の意味を教えて', 1),
  (1, '英語', 'getting_started', '発音のコツを教えて', 2),
  (1, '英語', 'getting_started', '文の作り方を教えて', 3),
  (1, '英語', 'common_questions', '英語で挨拶する方法を教えて', 4),
  (1, '英語', 'common_questions', '簡単な会話を教えて', 5),
  
  -- 学習方法・総合
  (1, '総合', 'study_tips', '勉強のやる気が出ない時はどうすればいい？', 1),
  (1, '総合', 'study_tips', '効率的な勉強方法を教えて', 2),
  (1, '総合', 'study_tips', 'テストの前にやることを教えて', 3),
  (1, '総合', 'study_tips', '暗記のコツを教えて', 4),
  (1, '総合', 'study_tips', '復習の仕方を教えて', 5);

-- 知識ベースの初期データ（全教科対応）
INSERT OR IGNORE INTO chat_knowledge_base (school_id, subject, grade, topic, content, keywords, difficulty_level, source, is_verified) VALUES
  -- 算数
  (1, '算数', '3年', '掛け算の筆算', '掛け算の筆算では、下の数の一の位から順番に計算します。位をそろえて書くことが大切です。', '掛け算,筆算,計算,位', 'basic', '学習指導要領', 1),
  (1, '算数', '4年', '小数の計算', '小数の足し算・引き算は、小数点をそろえて計算します。小数点の位置に注意しましょう。', '小数,計算,小数点,足し算,引き算', 'standard', '学習指導要領', 1),
  (1, '算数', '5年', '分数の足し算', '分数の足し算は、分母を同じにしてから分子だけを足します。分母が違う場合は通分が必要です。', '分数,足し算,通分,分母,分子', 'standard', '学習指導要領', 1),
  (1, '算数', '6年', '比例', '比例とは、一方の量が2倍、3倍になると、もう一方の量も2倍、3倍になる関係です。y=axの式で表せます。', '比例,関係,式,グラフ', 'advanced', '学習指導要領', 1),
  
  -- 国語
  (1, '国語', '3年', '主語と述語', '主語は「だれが」「なにが」を表し、述語は「どうする」「どんなだ」「なんだ」を表します。', '主語,述語,文法,文の構造', 'basic', '学習指導要領', 1),
  (1, '国語', '4年', '指示語', '指示語（これ、それ、あれ、どれ）は、前に出てきた言葉を受けます。何を指すか考えましょう。', '指示語,読解,文脈', 'standard', '学習指導要領', 1),
  (1, '国語', '5年', '段落構成', '文章は、はじめ・なか・おわり の3つの部分で構成されることが多いです。それぞれの役割を理解しましょう。', '段落,構成,文章,読解', 'standard', '学習指導要領', 1),
  (1, '国語', '6年', '敬語', '敬語には、尊敬語・謙譲語・丁寧語の3種類があります。相手や場面に応じて使い分けましょう。', '敬語,尊敬語,謙譲語,丁寧語', 'advanced', '学習指導要領', 1),
  
  -- 理科
  (1, '理科', '3年', '植物の育ち方', '植物は、種子から芽が出て、根・茎・葉が育ちます。日光と水が必要です。', '植物,育ち方,種子,芽,根,茎,葉', 'basic', '学習指導要領', 1),
  (1, '理科', '4年', '電気の働き', '乾電池の+極と-極をつなぐと電気が流れます。豆電球やモーターを動かすことができます。', '電気,乾電池,回路,豆電球', 'standard', '学習指導要領', 1),
  (1, '理科', '5年', '物の溶け方', '物が水に溶けると、見えなくなりますが、なくなったわけではありません。水溶液全体に均等に広がっています。', '水溶液,溶ける,溶解,物質', 'standard', '学習指導要領', 1),
  (1, '理科', '6年', '燃焼の条件', '物が燃えるには、燃える物、酸素、一定以上の温度の3つの条件が必要です。', '燃焼,条件,酸素,化学変化', 'advanced', '学習指導要領', 1),
  
  -- 社会
  (1, '社会', '3年', '地図記号', '地図記号は、地図の中で特定の場所や施設を表す記号です。学校は〒、病院は十字など。', '地図,記号,読み方,地理', 'basic', '学習指導要領', 1),
  (1, '社会', '4年', '都道府県', '日本には47の都道府県があります。位置や特産物を覚えましょう。', '都道府県,日本,地理,特産物', 'standard', '学習指導要領', 1),
  (1, '社会', '5年', '米作り', '日本の米作りは、田植えから稲刈りまで多くの工程があります。気候や地形に適した方法で行われます。', '米作り,農業,田植え,稲刈り', 'standard', '学習指導要領', 1),
  (1, '社会', '6年', '日本の歴史', '日本の歴史は、縄文時代から現代まで長い時間をかけて発展してきました。', '歴史,日本,時代,年表', 'advanced', '学習指導要領', 1),
  
  -- 英語
  (1, '英語', '3年', 'アルファベット', 'アルファベットは26文字あります。大文字と小文字を正しく書けるようにしましょう。', 'アルファベット,ABC,大文字,小文字', 'basic', '学習指導要領', 1),
  (1, '英語', '4年', '挨拶', '英語の挨拶：Hello（こんにちは）、Good morning（おはよう）、Thank you（ありがとう）など。', '挨拶,会話,英会話,基本表現', 'basic', '学習指導要領', 1),
  (1, '英語', '5年', '自己紹介', 'I am ~（私は～です）、My name is ~（私の名前は～です）という表現で自己紹介ができます。', '自己紹介,英会話,be動詞', 'standard', '学習指導要領', 1),
  (1, '英語', '6年', '現在進行形', '現在進行形はbe動詞+動詞のing形で「～しているところです」という意味を表します。', '現在進行形,文法,be動詞,ing形', 'advanced', '学習指導要領', 1);
