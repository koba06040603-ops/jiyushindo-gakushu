-- Phase 5: サンプルデータ追加

-- 学習環境デザイン（小3算数「かけ算の筆算」用）
INSERT INTO learning_environment_designs (
  curriculum_id,
  expression_creative,
  expression_creative_enabled,
  research_fieldwork,
  research_fieldwork_enabled,
  critical_thinking,
  critical_thinking_enabled,
  social_contribution,
  social_contribution_enabled,
  metacognition_reflection,
  metacognition_reflection_enabled,
  question_generation,
  question_generation_enabled
) VALUES (
  1,
  'かけ算の図を工夫して描く活動、オリジナルの問題を作成してみましょう',
  1,
  '身の回りでかけ算が使われている場面を探そう（スーパーの陳列、教室の机など）',
  1,
  'なぜ筆算の方が便利なのか、どんな場面で使うと良いか考えよう',
  1,
  '低学年の友達に教える「かけ算の筆算」説明ポスターを作ろう',
  1,
  '自分の学び方を振り返り、「どうやって理解できたか」を説明しよう',
  1,
  '「もし2桁×3桁だったら？」「もし小数だったら？」次の学びへの問いを作ろう',
  1
);

-- 先生のカスタマイズ設定
INSERT INTO teacher_customization (
  curriculum_id,
  teacher_id,
  teaching_philosophy,
  custom_unit_goal,
  custom_non_cognitive_goal,
  teaching_notes,
  gamification_enabled,
  badge_system_enabled,
  narrative_enabled,
  story_theme
) VALUES (
  1,
  1,
  '子どもたちが自分で考え、試行錯誤しながら理解を深めることを大切にします。間違いを恐れず、友達と学び合う姿勢を育てたいです。',
  '2桁×1桁の筆算の仕組みを理解し、正確に計算できるようになる。また、かけ算が日常生活のどこで使われているか気づくことができる。',
  '粘り強く問題に取り組む姿勢、友達に優しく教える協働性、自分の学び方を振り返るメタ認知能力を育てる。',
  '位取りの概念が難しい子には十の位と一の位を色分けして説明。図や具体物を使って視覚的に理解させる。計算ミスが多い子には途中式をしっかり書かせる。',
  1,
  1,
  1,
  '算数冒険者の旅〜かけ算の山を登ろう〜'
);

-- 3観点評価のサンプル（山田太郎くん）
INSERT INTO three_point_evaluations (
  student_id,
  curriculum_id,
  knowledge_skill,
  knowledge_skill_comment,
  thinking_judgment,
  thinking_judgment_comment,
  attitude,
  attitude_comment,
  overall_comment
) VALUES (
  2,
  1,
  'A',
  '2桁×1桁の筆算を正確に計算できる。位取りの概念もよく理解している。',
  'B',
  '筆算の仕組みを図を使って説明できる。応用問題ではもう少し工夫が必要。',
  'A',
  '粘り強く問題に取り組み、わからないところは積極的に質問する姿勢が素晴らしい。',
  '筆算の基礎はしっかり身についています。次は応用問題や文章題にも挑戦してみましょう。'
);

-- 非認知能力評価のサンプル（山田太郎くん）
INSERT INTO non_cognitive_evaluations (
  student_id,
  curriculum_id,
  self_regulation,
  self_regulation_comment,
  motivation,
  motivation_comment,
  collaboration,
  collaboration_comment,
  metacognition,
  metacognition_comment,
  creativity,
  creativity_comment,
  curiosity,
  curiosity_comment,
  self_esteem,
  self_esteem_comment
) VALUES (
  2,
  1,
  4,
  '学習計画を立て、自分のペースで進めることができる。振り返りもしっかり書けている。',
  5,
  '難しい問題でも「もう一回やってみる！」と意欲的に取り組む姿勢が素晴らしい。',
  4,
  '友達に優しく教える姿が見られる。困っている友達に気づいて声をかけられる。',
  3,
  '自分の理解度を振り返ることはできるが、「どうやって学んだか」の説明はまだ発展途上。',
  4,
  'オリジナルの問題を作ったり、図を工夫して描いたりする創造性が見られる。',
  5,
  '「もし〇〇だったら？」と次の学びへの問いを自分で作れる好奇心が素晴らしい。',
  4,
  '「できた！」という達成感を感じており、自信を持って学習に取り組んでいる。'
);

-- バッジのサンプル
INSERT INTO student_badges (student_id, curriculum_id, badge_type, badge_name, badge_description) VALUES
(2, 1, 'completion', '完走バッジ', '全ての学習カードを完了しました！'),
(2, 1, 'help_giver', '教え上手バッジ', '友達に3回以上教えてあげました'),
(3, 1, 'perseverance', '粘り強さバッジ', '難しい問題に何度も挑戦しました');

-- ナラティブのサンプル
INSERT INTO learning_narratives (student_id, curriculum_id, chapter_number, chapter_title, story_content, milestone_reached) VALUES
(2, 1, 1, '算数冒険の始まり', '山田太郎くんは、かけ算の山に登る冒険を始めました。最初は高い山に見えたけれど、一歩ずつ登っていくことにしました。', 1),
(2, 1, 2, '10のまとまりの発見', '山を登る途中、太郎くんは「10のまとまり」という魔法の道具を見つけました。これを使うと計算がずっと簡単になることに気づきました！', 1),
(2, 1, 3, '筆算の秘密を解く', 'ついに太郎くんは筆算の秘密を解き明かしました。位を揃えて書くことで、大きな数のかけ算もできるようになったのです。仲間たちも一緒に喜んでくれました。', 1);
