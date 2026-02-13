# 🔄 引き継ぎドキュメント（最新版）

**更新日時**: 2026-02-13  
**プロジェクト**: 自由進度学習支援システム  
**現在の状態**: Phase 18-2 全タスク完了 ✅

---

## 📊 現在の状況

### ✅ 全タスク完了済み

1. **Phase 1-18 完全実装済み**（認証、AI、理論統合、リアルタイム適応学習、予測分析）

2. **Task1: カリキュラム実データ生成 ✅**
   - 総データ: **3,608件**（ダミーデータ0件、すべて実データ）
   - 195組み合わせ（9学年 x 最大7教科 x 5社）を**完全カバー**
   - Gemini API 5並列バッチ処理で効率的に生成

3. **Task2: テスト対策システム ✅**
   - 4ステップUI（範囲設定 → 学習計画 → 学習実行 → 振り返り）
   - カリキュラムDB選択 + 自由テキスト入力のハイブリッド範囲設定
   - AI学習スケジュール提案（優先順位・時間配分）
   - URL: `/static/test-preparation`

4. **Task3: 学習カード動的枚数 ✅**
   - `/api/units/analyze` で単元分析
   - 4〜15枚の動的カード枚数決定
   - 単元の複雑さ・難易度に基づく自動調整

5. **Task4: 自己調整学習支援UI ✅**
   - ポモドーロタイマー（15分/25分/自由モード）
   - セルフモニタリング（集中度・疲労度ゲージ）
   - AIベースのペース調整提案
   - 学習戦略提案API

6. **Task5: 振り返り機能（KPT法）✅**
   - KPT法による振り返りUI（Keep/Problem/Try）
   - 自信度Before/After比較チャート
   - AI振り返り分析（改善アドバイス・励まし・次の目標）
   - 感情記録機能

### 📝 次にやるべきこと（候補）

1. **Cloudflareへの本番デプロイ**（APIトークンが必要）
2. **GitHubリポジトリへのプッシュ**
3. **追加教科・単元データの充実**（音楽・美術・体育・技術・家庭など未対応教科）
4. **過去の振り返りデータを活用した学習パス最適化**
5. **テスト成績の時系列分析ダッシュボード**
6. **保護者ダッシュボードへのテスト対策連携**

---

## 🔧 技術スタック

### 主要技術

- **フレームワーク**: Hono (Cloudflare Workers)
- **デプロイ**: Cloudflare Pages
- **データベース**: Cloudflare D1 (SQLite)
- **AI**: Gemini API (`gemini-3-flash-preview`)
- **フロントエンド**: Vanilla JS + TailwindCSS + Chart.js

### 重要なファイル

```
webapp/
├── src/
│   ├── index.tsx                          # メインHonoアプリ
│   ├── problem-generator.ts               # 問題生成エンジン
│   ├── card-theory-integration.ts         # 学習カード×理論統合
│   ├── ai-problem-theory-integration.ts   # AI問題×理論統合
│   └── ...（Phase 1-18の各実装ファイル）
├── public/
│   └── static/
│       ├── test-preparation.html          # テスト対策プランページ
│       ├── curriculum-problem-generator.html
│       └── app.js                         # フロントエンドロジック
├── scripts/
│   ├── parallel-curriculum-generator.cjs  # 並列データ生成（最新）
│   ├── generate-real-curriculum-data.js
│   └── hybrid-curriculum-generator.cjs
├── migrations/
│   ├── 0070_level5_theory_framework.sql
│   ├── 0071_phase16_ai_problem_theory.sql
│   ├── 0072_phase17_dynamic_optimization.sql
│   ├── 0073_phase18_realtime_learning.sql
│   └── 0074_phase18_ml_abtest.sql
├── wrangler.jsonc                         # Cloudflare設定
└── README.md                              # 技術ドキュメント
```

### データベーススキーマ

**主要テーブル**:
- `curriculum`: カリキュラムデータ（**3,608件、全て実データ、195組み合わせ完全カバー**）
- `test_preparation_plans`: テスト対策プラン
- `test_study_logs`: テスト対策学習ログ
- `test_performance_feedback`: テスト結果フィードバック
- `metacognition_logs`: メタ認知ログ
- `cards`: 学習カード
- `generated_problems`: AI生成問題
- `student_theory_profiles`: 生徒の12理論プロファイル
- `theory_assessment_items`: 理論適性診断項目
- `learning_sessions`: 学習セッション
- `progress_logs`: 進捗ログ

---

## 🚀 次のステップ（Sonnet 4.6が実行すべきタスク）

### Task 1: カリキュラムデータ生成の完全自動化（最優先）

**目標**: 195組み合わせすべての実データ生成

**アプローチ案**:

#### オプションA: バッチ分割生成（推奨）
```bash
# 5社を順次実行（1社あたり39組み合わせ）
# 各バッチで10分タイムアウト、成功分をSQLに保存

# バッチ1: 東京書籍（39組）
node scripts/generate-batch-1-tokyo.cjs

# バッチ2: 大日本図書（39組）
node scripts/generate-batch-2-dainippon.cjs

# ... 以下同様
```

#### オプションB: 手動キュレーション + AI補完
```
1. 実際の教科書カリキュラムをWeb検索で取得
2. 主要な単元名（10-15個）を手動でリスト化
3. Gemini APIで単元目標を生成
4. SQLファイルに統合
```

#### オプションC: 既存150件を拡張
```
1. 小学5年算数60件 → 他学年の算数に転用
2. 小学6年社会90件 → 他学年の社会に転用
3. パターン認識で類似単元名を生成
```

**実装手順**:
1. `scripts/batch-generator/` ディレクトリ作成
2. 各出版社ごとのバッチスクリプト作成
3. 10分タイムアウトで順次実行
4. 成功分を `migrations/curriculum_data_batch_*.sql` に保存
5. すべて完了後、DBに一括投入

---

### Task 2: テスト対策と学習システムの連携

**実装項目**:

1. **テスト範囲入力UI** (`/static/test-preparation.html` 拡張)
   - カリキュラムDB選択UI（既存）
   - 自由テキスト入力フィールド追加
   - 両方を組み合わせた範囲指定

2. **新APIエンドポイント**
   ```typescript
   // テスト対策プラン作成
   POST /api/test-preparation/create-plan
   {
     curriculum_ids: [123, 456, 789],  // DBから選択
     custom_topics: ["追加の単元1", "追加の単元2"],  // 自由入力
     test_date: "2026-03-15",
     student_id: 1
   }

   // 個別傾向分析
   GET /api/test-preparation/weakness-analysis/:studentId
   
   // 学習システムへのフィードバック
   POST /api/learning/feedback-from-test
   ```

3. **データベース拡張**
   ```sql
   CREATE TABLE test_preparation_plans (
     id INTEGER PRIMARY KEY,
     student_id INTEGER,
     test_date DATE,
     curriculum_ids TEXT,  -- JSON配列
     custom_topics TEXT,   -- JSON配列
     created_at DATETIME
   );

   CREATE TABLE test_performance_feedback (
     id INTEGER PRIMARY KEY,
     student_id INTEGER,
     test_plan_id INTEGER,
     weakness_areas TEXT,  -- JSON配列
     strength_areas TEXT,  -- JSON配列
     recommendations TEXT, -- JSON配列
     created_at DATETIME
   );
   ```

---

### Task 3: 学習カード枚数の動的調整

**実装項目**:

1. **単元分析エンジン**
   ```typescript
   // src/modules/unit-learning/dynamic-card-generator.ts
   
   async function analyzeUnitComplexity(unitId: number): Promise<{
     content_items: number,      // 内容項目数
     difficulty: 'easy' | 'medium' | 'hard',
     estimated_cards: number     // 推奨カード枚数
   }> {
     // カリキュラムDBの unit_goal を分析
     // Gemini APIで内容項目を抽出
     // 項目数に応じてカード枚数を決定
     //   - 内容項目 1-3個: 6枚
     //   - 内容項目 4-6個: 12枚
     //   - 内容項目 7-10個: 18枚
     //   - 内容項目 11+個: 24枚
   }
   ```

2. **新APIエンドポイント**
   ```typescript
   // 単元分析
   GET /api/units/:unitId/analyze
   
   // 動的カード生成
   POST /api/cards/generate-dynamic
   {
     unit_id: 123,
     student_id: 1,
     auto_adjust_count: true
   }
   ```

---

### Task 4: 自己調整学習支援（テスト対策計画表UI）

**実装項目**:

1. **計画表作成UI** (`/static/test-preparation.html` 拡張)
   - カレンダービュー（テスト日まで）
   - 学習項目のドラッグ&ドロップ配置
   - 1日あたりの学習時間設定
   - 復習タイミング自動提案

2. **メタ認知支援機能**
   ```typescript
   // 学習前の振り返り
   POST /api/metacognition/pre-study
   {
     student_id: 1,
     planned_topics: ["分数の計算", "小数の計算"],
     confidence_level: 3  // 1-5
   }

   // 学習中のモニタリング
   POST /api/metacognition/during-study
   {
     student_id: 1,
     difficulty_encountered: true,
     time_spent_minutes: 30
   }

   // 学習後の振り返り
   POST /api/metacognition/post-study
   {
     student_id: 1,
     understanding_level: 4,  // 1-5
     needs_review: false
   }
   ```

3. **AIアドバイス生成**
   - Gemini APIで計画表を分析
   - 過度な詰め込みを警告
   - 復習タイミングを最適化提案
   - 弱点分野の優先順位提案

---

### Task 5: 振り返り機能

**実装項目**:

1. **学習履歴レビューUI**
   - 週次・月次の学習サマリー
   - グラフ可視化（Chart.js）
   - 達成度と改善点の自動抽出

2. **改善提案システム**
   ```typescript
   POST /api/reflection/generate-suggestions
   {
     student_id: 1,
     period: 'weekly' | 'monthly',
     focus_areas: ['weak_subjects', 'study_habits']
   }
   ```

---

## 🔑 重要な環境変数・設定

### Cloudflare設定

```jsonc
// wrangler.jsonc
{
  "name": "jiyushindo-gakushu",
  "compatibility_date": "2024-01-01",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "jiyushindo-gakushu-production",
      "database_id": "c01fd96b-f795-4b53-8ad8-3b9ea98859ee"
    }
  ]
}
```

### Gemini API Key

```bash
# .dev.vars（ローカル開発）
GEMINI_API_KEY=AIzaSyA9XZlvZxX80n3UGIziXsTKtClch0WIp3M
```

### デプロイコマンド

```bash
# ビルド（300秒タイムアウト推奨）
npm run build

# ローカルDB操作
npx wrangler d1 execute jiyushindo-gakushu-production --local --file=<SQL_FILE>

# デプロイ
npx wrangler pages deploy dist --project-name jiyushindo-gakushu
```

---

## 📖 参考リソース

### ドキュメント

- **README.md**: 技術的な詳細ドキュメント（2,000行以上）
- **README_SIMPLE.md**: 一般向けREADME
- **docs/level5_ultimate_education_framework.md**: レベル5理論体系
- **docs/LEVEL5_IMPLEMENTATION_REPORT.md**: 実装レポート

### デプロイURL

- **本番**: https://jiyushindo-gakushu.pages.dev
- **最新プレビュー**: https://ecfd50ca.jiyushindo-gakushu.pages.dev
- **テスト対策**: https://jiyushindo-gakushu.pages.dev/static/test-preparation

---

## ⚠️ 注意事項

### よくある問題と解決策

1. **Gemini API タイムアウト**
   - 解決策: バッチサイズを小さく、リトライロジック実装

2. **JSON抽出失敗**
   - 原因: Geminiが説明文を含めて返す
   - 解決策: プロンプトに「JSON配列のみ出力」を強調

3. **並列実行時のレート制限**
   - 解決策: DELAY_MS を増やす（500ms → 1000ms）

4. **データベースロック**
   - 解決策: トランザクション内でのSQLコマンド数を制限（< 500行）

---

## ✅ Sonnet 4.6 への引き継ぎチェックリスト

- [ ] このドキュメント全体を読み、現状を理解
- [ ] Task 1（データ生成）から着手
- [ ] 各タスク完了後、README.mdを更新
- [ ] Git commitを頻繁に実行（コミットメッセージは日本語可）
- [ ] デプロイ後、URLをREADMEに記載
- [ ] ユーザーに進捗報告（定期的に）

---

## 📞 連絡事項

**このドキュメントは2026-02-13時点の状態を反映しています。**

**Sonnet 4.6へ**: このドキュメントを読んで、Task 1から順次実装してください。データ生成が最優先です。成功を祈ります！🚀
