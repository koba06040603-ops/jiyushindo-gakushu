-- ===================================================================
-- ScTN質問紙と全国学力・学習状況調査の統合テーブル
-- 作成日: 2026-01-29
-- 参照: SCTN_NATIONAL_SURVEY_INTEGRATION.md
-- ===================================================================

-- ===================================================================
-- 1. ScTN質問紙結果テーブル（71問、3パッケージ対応）
-- ===================================================================
CREATE TABLE IF NOT EXISTS sctn_survey_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  survey_date DATE NOT NULL,
  package_type TEXT NOT NULL CHECK(package_type IN ('light', 'basic', 'advanced')),
  
  -- ---------------------------------------------------------------
  -- 学校教育の経験（5観点、各2問 = 10問）
  -- ---------------------------------------------------------------
  
  -- (1) 本物の学び（興味や疑問に基づく学習）
  authentic_learning REAL CHECK(authentic_learning >= 1.0 AND authentic_learning <= 5.0),
  
  -- (2) 探究的な学び（課題設定・情報収集・整理分析）
  inquiry_learning REAL CHECK(inquiry_learning >= 1.0 AND inquiry_learning <= 5.0),
  
  -- (3) 個別の学び（自己調整学習）
  individual_learning REAL CHECK(individual_learning >= 1.0 AND individual_learning <= 5.0),
  
  -- (4) 協同の学び（相互調整学習）
  collaborative_learning REAL CHECK(collaborative_learning >= 1.0 AND collaborative_learning <= 5.0),
  
  -- (5) 民主的な学校生活（学級・学校づくりへの参画）
  democratic_school_life REAL CHECK(democratic_school_life >= 1.0 AND democratic_school_life <= 5.0),
  
  -- ---------------------------------------------------------------
  -- 成果の実感（3問）
  -- ---------------------------------------------------------------
  
  -- 授業を通した成長の実感
  growth_through_learning REAL CHECK(growth_through_learning >= 1.0 AND growth_through_learning <= 5.0),
  
  -- 生活を通した成長の実感
  growth_through_school_life REAL CHECK(growth_through_school_life >= 1.0 AND growth_through_school_life <= 5.0),
  
  -- 学校生活の充実感
  school_life_satisfaction REAL CHECK(school_life_satisfaction >= 1.0 AND school_life_satisfaction <= 5.0),
  
  -- ---------------------------------------------------------------
  -- 学びに向かう力（アドバンス版のみ、34問）
  -- ---------------------------------------------------------------
  
  -- 学びの動機（内発的・外発的動機）
  learning_motivation REAL CHECK(learning_motivation >= 1.0 AND learning_motivation <= 5.0),
  
  -- 自己調整学習（見通し・方略・振り返り）
  self_regulation REAL CHECK(self_regulation >= 1.0 AND self_regulation <= 5.0),
  
  -- 相互調整学習（協働的学習態度）
  mutual_regulation REAL CHECK(mutual_regulation >= 1.0 AND mutual_regulation <= 5.0),
  
  -- 粘り強さ（困難への対処・継続力）
  persistence REAL CHECK(persistence >= 1.0 AND persistence <= 5.0),
  
  -- ---------------------------------------------------------------
  -- 人間性（アドバンス版のみ、24問）
  -- ---------------------------------------------------------------
  
  -- 自己効力感（自分への自信）
  self_efficacy REAL CHECK(self_efficacy >= 1.0 AND self_efficacy <= 5.0),
  
  -- 自己受容感（ありのままの自分を受け入れる）
  self_acceptance REAL CHECK(self_acceptance >= 1.0 AND self_acceptance <= 5.0),
  
  -- 他者への受容感（他者への共感）
  acceptance_of_others REAL CHECK(acceptance_of_others >= 1.0 AND acceptance_of_others <= 5.0),
  
  -- 他者からの受容感（他者からの承認）
  acceptance_by_others REAL CHECK(acceptance_by_others >= 1.0 AND acceptance_by_others <= 5.0),
  
  -- 集合効力感（みんなで協力すれば達成できる信念）
  collective_efficacy REAL CHECK(collective_efficacy >= 1.0 AND collective_efficacy <= 5.0),
  
  -- ---------------------------------------------------------------
  -- メタデータ
  -- ---------------------------------------------------------------
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

-- ScTN質問紙結果のインデックス
CREATE INDEX IF NOT EXISTS idx_sctn_student_date ON sctn_survey_results(student_id, survey_date);
CREATE INDEX IF NOT EXISTS idx_sctn_date ON sctn_survey_results(survey_date);
CREATE INDEX IF NOT EXISTS idx_sctn_package ON sctn_survey_results(package_type);

-- ===================================================================
-- 2. 全国学力・学習状況調査結果テーブル（63問）
-- ===================================================================
CREATE TABLE IF NOT EXISTS national_survey_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  survey_year INTEGER NOT NULL,
  grade INTEGER NOT NULL CHECK(grade IN (6, 9)), -- 小6 or 中3
  
  -- ---------------------------------------------------------------
  -- 基本的生活習慣等（8問）
  -- ---------------------------------------------------------------
  q01_breakfast INTEGER CHECK(q01_breakfast BETWEEN 1 AND 4),           -- 朝食を毎日食べている
  q02_bedtime INTEGER CHECK(q02_bedtime BETWEEN 1 AND 4),               -- 毎日、同じくらいの時刻に寝ている
  q03_wakeup INTEGER CHECK(q03_wakeup BETWEEN 1 AND 4),                 -- 毎日、同じくらいの時刻に起きている
  q04_ict_study_time INTEGER CHECK(q04_ict_study_time BETWEEN 1 AND 7), -- PC・タブレットを勉強のために使う時間
  q05_game_time INTEGER CHECK(q05_game_time BETWEEN 1 AND 7),           -- テレビゲームをする時間
  q06_sns_time INTEGER CHECK(q06_sns_time BETWEEN 1 AND 7),             -- SNSや動画視聴の時間
  q07_phone_rules INTEGER CHECK(q07_phone_rules BETWEEN 1 AND 4),       -- 携帯電話・スマホの約束を守っている
  q08_health_awareness INTEGER CHECK(q08_health_awareness BETWEEN 1 AND 4), -- 保健室の先生などから教えられたことを普段の生活に役立てている
  
  -- ---------------------------------------------------------------
  -- 挑戦心、達成感、規範意識、自己有用感、幸福感等（11問）
  -- ---------------------------------------------------------------
  q09_self_efficacy INTEGER CHECK(q09_self_efficacy BETWEEN 1 AND 4),   -- 自分には、よいところがある
  q10_teacher_acceptance INTEGER CHECK(q10_teacher_acceptance BETWEEN 1 AND 4), -- 先生は、あなたのよいところを認めてくれている
  q11_future_goals INTEGER CHECK(q11_future_goals BETWEEN 1 AND 4),     -- 将来の夢や目標を持っている
  q12_helping_others INTEGER CHECK(q12_helping_others BETWEEN 1 AND 4), -- 人が困っているときは、進んで助けている
  q13_anti_bullying INTEGER CHECK(q13_anti_bullying BETWEEN 1 AND 4),   -- いじめは、どんな理由があってもいけない
  q14_consultation INTEGER CHECK(q14_consultation BETWEEN 1 AND 4),     -- 困りごとや不安がある時に、先生や学校にいる大人にいつでも相談できる
  q15_helping_society INTEGER CHECK(q15_helping_society BETWEEN 1 AND 4), -- 人の役に立つ人間になりたい
  q16_school_satisfaction INTEGER CHECK(q16_school_satisfaction BETWEEN 1 AND 4), -- 学校に行くのは楽しい
  q17_diverse_opinions INTEGER CHECK(q17_diverse_opinions BETWEEN 1 AND 4), -- 自分と違う意見について考えるのは楽しい
  q18_friend_satisfaction INTEGER CHECK(q18_friend_satisfaction BETWEEN 1 AND 4), -- 友達関係に満足している
  q19_happiness INTEGER CHECK(q19_happiness BETWEEN 1 AND 4),           -- 普段の生活の中で、幸せな気持ちになる
  
  -- ---------------------------------------------------------------
  -- 学習習慣、学習環境等（5問）
  -- ---------------------------------------------------------------
  q20_self_regulated_learning INTEGER CHECK(q20_self_regulated_learning BETWEEN 1 AND 4), -- 分からないことがあったときに、自分で学び方を考え、工夫する
  q21_weekday_study_time INTEGER CHECK(q21_weekday_study_time BETWEEN 1 AND 7), -- 学校の授業時間以外に、平日どれくらい勉強するか
  q22_weekend_study_time INTEGER CHECK(q22_weekend_study_time BETWEEN 1 AND 7), -- 土日にどれくらい勉強するか
  q23_books_at_home INTEGER CHECK(q23_books_at_home BETWEEN 1 AND 6),  -- 家にある本の数
  q24_newspaper_reading INTEGER CHECK(q24_newspaper_reading BETWEEN 1 AND 4), -- 新聞を読んでいるか
  
  -- ---------------------------------------------------------------
  -- 地域や社会に関わる活動の状況等（2問）
  -- ---------------------------------------------------------------
  q25_social_contribution INTEGER CHECK(q25_social_contribution BETWEEN 1 AND 4), -- 地域や社会をよくするために何かしてみたい
  q26_free_time_activities TEXT, -- 放課後や週末に何をして過ごすことが多いか（複数選択、JSON配列）
  
  -- ---------------------------------------------------------------
  -- ICTを活用した学習状況（2問、7小問）
  -- ---------------------------------------------------------------
  q27_ict_frequency INTEGER CHECK(q27_ict_frequency BETWEEN 1 AND 5),   -- 5年生まで（1、2年生のとき）に受けた授業で、PC・タブレットなどのICT機器を、どの程度使用したか
  q28_1_ict_individual_learning INTEGER CHECK(q28_1_ict_individual_learning BETWEEN 1 AND 4), -- 自分のペースで理解しながら学習を進めることができる
  q28_2_ict_quick_search INTEGER CHECK(q28_2_ict_quick_search BETWEEN 1 AND 4), -- 分からないことがあった時に、すぐ調べることができる
  q28_3_ict_enjoyment INTEGER CHECK(q28_3_ict_enjoyment BETWEEN 1 AND 4), -- 楽しみながら学習を進めることができる
  q28_4_ict_multimedia INTEGER CHECK(q28_4_ict_multimedia BETWEEN 1 AND 4), -- 画像や動画、音声等を活用することで、学習内容がよく分かる
  q28_5_ict_expression INTEGER CHECK(q28_5_ict_expression BETWEEN 1 AND 4), -- 自分の考えや意見を分かりやすく伝えることができる
  q28_6_ict_collaborative_learning INTEGER CHECK(q28_6_ict_collaborative_learning BETWEEN 1 AND 4), -- 友達と考えを共有したり比べたりしやすくなる
  q28_7_ict_mutual_learning INTEGER CHECK(q28_7_ict_mutual_learning BETWEEN 1 AND 4), -- 友達と協力しながら学習を進めることができる
  
  -- ---------------------------------------------------------------
  -- 主体的・対話的で深い学びの視点からの授業改善に関する取組状況（9問）
  -- ---------------------------------------------------------------
  q29_presentation_skill INTEGER CHECK(q29_presentation_skill BETWEEN 1 AND 4), -- 自分の考えを発表する機会では、自分の考えがうまく伝わるよう、資料や文章、話の組立てなどを工夫して発表していた
  q30_self_initiated_learning INTEGER CHECK(q30_self_initiated_learning BETWEEN 1 AND 4), -- 課題の解決に向けて、自分で考え、自分から取り組んでいた
  q31_thinking_and_expression INTEGER CHECK(q31_thinking_and_expression BETWEEN 1 AND 4), -- 各教科などで学んだことを生かしながら、自分の考えをまとめる活動を行っていた
  q32_individualized_learning INTEGER CHECK(q32_individualized_learning BETWEEN 1 AND 4), -- 授業は、自分にあった教え方、教材、学習時間などになっていた
  q33_collaborative_thinking INTEGER CHECK(q33_collaborative_thinking BETWEEN 1 AND 4), -- 学級の友達との間で話し合う活動を通じて、自分の考えを深めたり、新たな考え方に気付いたりすることができている
  q34_reflection_and_next_learning INTEGER CHECK(q34_reflection_and_next_learning BETWEEN 1 AND 4), -- 学習した内容について、分かった点や、よく分からなかった点を見直し、次の学習につなげることができている
  q35_knowledge_application INTEGER CHECK(q35_knowledge_application BETWEEN 1 AND 4), -- 授業で学んだことを、次の学習や実生活に結びつけて考えたり、生かしたりすることができると思う
  q36_teacher_support INTEGER CHECK(q36_teacher_support BETWEEN 1 AND 4), -- 先生は、授業やテストで間違えたところや、理解していないところについて、分かるまで教えてくれている
  q37_cooperative_problem_solving INTEGER CHECK(q37_cooperative_problem_solving BETWEEN 1 AND 4), -- 授業や学校生活では、友達や周りの人の考えを大切にして、お互いに協力しながら課題の解決に取り組んでいる
  
  -- ---------------------------------------------------------------
  -- 総合的な学習の時間、学級活動、特別の教科 道徳（4問）
  -- ---------------------------------------------------------------
  q38_inquiry_learning INTEGER CHECK(q38_inquiry_learning BETWEEN 1 AND 4), -- 総合的な学習の時間では、自分で課題を立てて情報を集め整理して、調べたことを発表するなどの学習活動に取り組んでいる
  q39_democratic_classroom INTEGER CHECK(q39_democratic_classroom BETWEEN 1 AND 4), -- あなたの学級では、学級生活をよりよくするために学級会で話し合い、互いの意見のよさを生かして解決方法を決めている
  q40_self_improvement INTEGER CHECK(q40_self_improvement BETWEEN 1 AND 4), -- 学級活動における学級での話合いを生かして、今、自分が努力すべきことを決めて取り組んでいる
  q41_moral_education INTEGER CHECK(q41_moral_education BETWEEN 1 AND 4), -- 道徳の授業では、自分の考えを深めたり、学級やグループで話し合ったりする活動に取り組んでいる
  
  -- ---------------------------------------------------------------
  -- 教科調査（正答率 0.0-1.0）
  -- ---------------------------------------------------------------
  japanese_score REAL CHECK(japanese_score >= 0.0 AND japanese_score <= 1.0), -- 国語正答率
  math_score REAL CHECK(math_score >= 0.0 AND math_score <= 1.0),             -- 算数・数学正答率
  
  -- ---------------------------------------------------------------
  -- メタデータ
  -- ---------------------------------------------------------------
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (student_id) REFERENCES users(user_id)
);

-- 全国学力・学習状況調査結果のインデックス
CREATE INDEX IF NOT EXISTS idx_national_student_year ON national_survey_results(student_id, survey_year);
CREATE INDEX IF NOT EXISTS idx_national_year ON national_survey_results(survey_year);
CREATE INDEX IF NOT EXISTS idx_national_grade ON national_survey_results(grade);

-- ===================================================================
-- 3. ScTN質問紙と全国学調の対応関係テーブル
-- ===================================================================
CREATE TABLE IF NOT EXISTS sctn_national_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sctn_item TEXT NOT NULL,           -- ScTN質問紙の項目名（例: 'self_regulation'）
  national_item TEXT NOT NULL,       -- 全国学調の質問番号（例: 'q20_self_regulated_learning'）
  correlation_type TEXT NOT NULL CHECK(correlation_type IN ('complete_match', 'partial_match', 'conceptual_match')),
  description TEXT,                  -- 対応関係の説明
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(sctn_item, national_item)
);

-- ===================================================================
-- 4. 初期データ挿入：完全一致項目（27項目）
-- ===================================================================
INSERT INTO sctn_national_mapping (sctn_item, national_item, correlation_type, description) VALUES
('self_efficacy', 'q09_self_efficacy', 'complete_match', '自分には、よいところがある'),
('acceptance_by_others', 'q10_teacher_acceptance', 'complete_match', '先生は、あなたのよいところを認めてくれている'),
('learning_motivation', 'q11_future_goals', 'complete_match', '将来の夢や目標を持っている'),
('acceptance_of_others', 'q12_helping_others', 'complete_match', '人が困っているときは、進んで助けている'),
('acceptance_by_others', 'q14_consultation', 'complete_match', '困りごとや不安がある時に、先生や学校にいる大人にいつでも相談できる'),
('acceptance_of_others', 'q15_helping_society', 'complete_match', '人の役に立つ人間になりたい'),
('school_life_satisfaction', 'q16_school_satisfaction', 'complete_match', '学校に行くのは楽しい'),
('collaborative_learning', 'q17_diverse_opinions', 'complete_match', '自分と違う意見について考えるのは楽しい'),
('acceptance_by_others', 'q18_friend_satisfaction', 'complete_match', '友達関係に満足している'),
('self_regulation', 'q20_self_regulated_learning', 'complete_match', '分からないことがあったときに、自分で学び方を考え、工夫する'),
('authentic_learning', 'q25_social_contribution', 'complete_match', '地域や社会をよくするために何かしてみたい'),
('individual_learning', 'q28_1_ict_individual_learning', 'complete_match', '自分のペースで理解しながら学習を進めることができる'),
('self_regulation', 'q28_2_ict_quick_search', 'partial_match', '分からないことがあった時に、すぐ調べることができる'),
('collaborative_learning', 'q28_6_ict_collaborative_learning', 'complete_match', '友達と考えを共有したり比べたりしやすくなる'),
('mutual_regulation', 'q28_7_ict_mutual_learning', 'complete_match', '友達と協力しながら学習を進めることができる'),
('authentic_learning', 'q29_presentation_skill', 'partial_match', '自分の考えを発表する機会では、自分の考えがうまく伝わるよう、資料や文章、話の組立てなどを工夫して発表していた'),
('self_regulation', 'q30_self_initiated_learning', 'complete_match', '課題の解決に向けて、自分で考え、自分から取り組んでいた'),
('authentic_learning', 'q31_thinking_and_expression', 'partial_match', '各教科などで学んだことを生かしながら、自分の考えをまとめる活動を行っていた'),
('individual_learning', 'q32_individualized_learning', 'complete_match', '授業は、自分にあった教え方、教材、学習時間などになっていた'),
('collaborative_learning', 'q33_collaborative_thinking', 'complete_match', '学級の友達との間で話し合う活動を通じて、自分の考えを深めたり、新たな考え方に気付いたりすることができている'),
('self_regulation', 'q34_reflection_and_next_learning', 'complete_match', '学習した内容について、分かった点や、よく分からなかった点を見直し、次の学習につなげることができている'),
('authentic_learning', 'q35_knowledge_application', 'partial_match', '授業で学んだことを、次の学習や実生活に結びつけて考えたり、生かしたりすることができると思う'),
('collaborative_learning', 'q37_cooperative_problem_solving', 'complete_match', '授業や学校生活では、友達や周りの人の考えを大切にして、お互いに協力しながら課題の解決に取り組んでいる'),
('inquiry_learning', 'q38_inquiry_learning', 'complete_match', '総合的な学習の時間では、自分で課題を立てて情報を集め整理して、調べたことを発表するなどの学習活動に取り組んでいる'),
('democratic_school_life', 'q39_democratic_classroom', 'complete_match', 'あなたの学級では、学級生活をよりよくするために学級会で話し合い、互いの意見のよさを生かして解決方法を決めている'),
('self_regulation', 'q40_self_improvement', 'complete_match', '学級活動における学級での話合いを生かして、今、自分が努力すべきことを決めて取り組んでいる'),
('collaborative_learning', 'q41_moral_education', 'complete_match', '道徳の授業では、自分の考えを深めたり、学級やグループで話し合ったりする活動に取り組んでいる');

-- ===================================================================
-- 5. 統計分析用ビュー
-- ===================================================================

-- ScTN質問紙の記述統計
CREATE VIEW IF NOT EXISTS sctn_descriptive_stats AS
SELECT 
  package_type,
  COUNT(*) as sample_size,
  AVG(authentic_learning) as avg_authentic_learning,
  AVG(inquiry_learning) as avg_inquiry_learning,
  AVG(individual_learning) as avg_individual_learning,
  AVG(collaborative_learning) as avg_collaborative_learning,
  AVG(democratic_school_life) as avg_democratic_school_life,
  AVG(self_regulation) as avg_self_regulation,
  AVG(mutual_regulation) as avg_mutual_regulation,
  AVG(persistence) as avg_persistence,
  AVG(self_efficacy) as avg_self_efficacy,
  AVG(self_acceptance) as avg_self_acceptance,
  AVG(acceptance_of_others) as avg_acceptance_of_others,
  AVG(acceptance_by_others) as avg_acceptance_by_others,
  AVG(collective_efficacy) as avg_collective_efficacy
FROM sctn_survey_results
GROUP BY package_type;

-- ScTN質問紙と全国学調の統合ビュー（相関分析用）
CREATE VIEW IF NOT EXISTS sctn_national_integrated AS
SELECT 
  s.student_id,
  s.survey_date,
  s.self_regulation as sctn_self_regulation,
  s.mutual_regulation as sctn_mutual_regulation,
  s.learning_motivation as sctn_learning_motivation,
  s.self_efficacy as sctn_self_efficacy,
  s.collaborative_learning as sctn_collaborative_learning,
  n.q20_self_regulated_learning,
  n.q28_7_ict_mutual_learning,
  n.q33_collaborative_thinking,
  n.q34_reflection_and_next_learning,
  n.q09_self_efficacy,
  n.japanese_score,
  n.math_score
FROM sctn_survey_results s
LEFT JOIN national_survey_results n 
  ON s.student_id = n.student_id
  AND CAST(strftime('%Y', s.survey_date) AS INTEGER) = n.survey_year;
