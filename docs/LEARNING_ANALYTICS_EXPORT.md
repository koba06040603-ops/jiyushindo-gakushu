# 学習履歴の長期分析とデータエクスポート機能

## 概要
Phase 24として、学習履歴の長期分析ダッシュボードと学習データの匿名化エクスポート機能を実装しました。
これにより、生徒の1年間の学習履歴を可視化し、成長曲線や学習パターンの分析が可能になります。
また、研究目的での学習データのエクスポートにも対応しています。

## 実装日
2026年2月8日

## 実装内容

### 1. データベース設計

#### ビュー（Views）
- `v_learning_history_summary`: 日別・教科別の学習統計
- `v_monthly_learning_stats`: 月別の学習統計
- `v_growth_curve`: 成長曲線分析用（7日移動平均）

#### テーブル
- `learning_patterns`: 学習パターン分析結果
  - 学習時間帯パターン（朝/午前/午後/夕方/夜）
  - 曜日パターン（平日/休日）
  - 学習継続性（連続日数、平均問題数）
  - 教科バランス（多様性スコア、優位教科）
  - 学習効率スコア

- `export_history`: エクスポート履歴
  - エクスポート種別（個人/匿名化）
  - 形式（CSV/JSON/Excel）
  - フィルター条件（期間、学年、教科）
  - 匿名化設定（レベル）
  - ファイル情報

- `anonymization_mapping`: 匿名化マッピング
  - エクスポートIDと元の生徒IDの対応
  - 匿名ID（A001, A002, ...）

- `learning_statistics_cache`: 統計キャッシュ
  - 日次/週次/月次/年次統計
  - クラス・学年内ランキング
  - 目標達成率

- `export_templates`: エクスポートテンプレート
  - 研究用エクスポート
  - 学習進捗レポート
  - 管理者用統計

### 2. バックエンドAPI

#### 分析API (/api/analytics)

**サマリーデータ取得**
```
GET /api/analytics/summary?days=365&subject=算数
```
- 総問題数、平均正答率、総学習時間
- 最長連続日数、現在の連続日数
- 前期間との比較データ

**成長曲線取得**
```
GET /api/analytics/growth-curve?days=365&subject=算数
```
- 日別の正答率推移
- 7日移動平均による平滑化
- 教科別のデータ

**月別統計取得**
```
GET /api/analytics/monthly-stats?months=12&subject=算数
```
- 月別の問題数、正答率
- 月別の学習時間（時間単位）

**教科別統計取得**
```
GET /api/analytics/subject-stats?days=365
```
- 教科ごとの問題数、正答率
- 教科ごとの学習時間

**学習パターン取得**
```
GET /api/analytics/learning-patterns?days=90
```
- 最も集中できる時間帯
- 最もアクティブな曜日
- 学習効率スコア
- 教科バランス
- 改善率

#### エクスポートAPI (/api/export)

**エクスポート統計取得**
```
GET /api/export/stats?date_from=2025-01-01&date_to=2026-02-08&subjects=算数,国語
```
- 対象レコード数
- 推定ファイルサイズ

**エクスポート実行**
```
POST /api/export/create
{
  "export_type": "anonymized",  // "individual" or "anonymized"
  "format": "csv",               // "csv", "json", or "excel"
  "date_from": "2025-01-01",
  "date_to": "2026-02-08",
  "subjects": ["算数", "国語"],
  "anonymization_level": "full", // "basic", "standard", or "full"
  "purpose": "学術研究のため"
}
```

レスポンス:
```json
{
  "success": true,
  "data": {
    "download_url": "data:text/csv;base64,...",
    "file_name": "learning_data_1707390123456.csv",
    "file_size": 123456,
    "record_count": 1000
  }
}
```

**エクスポート履歴取得**
```
GET /api/export/history
```

### 3. フロントエンド

#### 学習履歴ダッシュボード (`/learning-analytics-dashboard.html`)

**機能**
- サマリーカード（総問題数、平均正答率、総学習時間、最長連続日数）
- 成長曲線グラフ（Chart.js）
  - 教科別の正答率推移
  - 7日移動平均
- 学習量の推移グラフ
  - 月別の問題数
- 教科別学習割合グラフ（ドーナツチャート）
- 学習時間帯の傾向グラフ（レーダーチャート）
- 学習パターン分析
  - 最も集中できる時間帯
  - 最もアクティブな曜日
  - 学習効率スコア
- 教科別成績分析（プログレスバー）
- AIによる学習アドバイス

**フィルター**
- 期間選択（7日/30日/90日/180日/365日）
- 教科選択（すべて/各教科）
- 表示タイプ（日別/週別/月別）

#### データエクスポート画面 (`/data-export.html`)

**機能**
- エクスポート設定フォーム
  - エクスポート種別（個人/匿名化）
  - 出力形式（CSV/JSON/Excel）
  - データ期間（開始日〜終了日）
  - 教科選択（複数選択可能）
  - 匿名化レベル（基本/標準/完全）
  - 使用目的（任意）

- クイックテンプレート
  - 研究用エクスポート
  - 進捗レポート
  - 月次統計

- データプレビュー
- 統計情報表示
  - 総レコード数
  - 推定ファイルサイズ
  - データ期間

- エクスポート履歴一覧
  - 日時、種別、形式、レコード数、サイズ
  - 再ダウンロード機能

- ダウンロード進行状況モーダル

### 4. データ処理モジュール

#### `learning-analytics.ts`
- `getYearlyLearningHistory()`: 年間学習履歴取得
- `getMonthlyStats()`: 月別統計取得
- `getGrowthCurve()`: 成長曲線データ取得
- `analyzeLearningPattern()`: 学習パターン分析
- `getSeasonalTrends()`: 季節別傾向取得
- `compareWithPeers()`: ピア比較
- `getImprovementRate()`: 改善率計算

#### `data-export.ts`
- `fetchExportData()`: エクスポートデータ取得
- `anonymizeData()`: データ匿名化処理
- `convertToCSV()`: CSV形式変換
- `convertToJSON()`: JSON形式変換
- `convertToExcel()`: Excel形式変換
- `recordExport()`: エクスポート履歴記録
- `generateStatisticsSummary()`: 統計サマリー生成

### 5. 匿名化レベル

#### 基本（basic）
- 名前を匿名ID（A001, A002, ...）に置換
- 学年・クラスは保持
- 学習データはそのまま

#### 標準（standard）
- すべての個人情報を削除
- 学年のみ保持
- 学習データは保持

#### 完全（full）
- すべての識別情報を削除
- 統計データのみ（個別記録なし）
- 集計済みデータのみ提供

## 技術仕様

### 使用技術
- **バックエンド**: Hono（Cloudflare Workers）、TypeScript
- **データベース**: Cloudflare D1（SQLite）
- **フロントエンド**: HTML5、Tailwind CSS、Chart.js、Axios
- **認証**: JWT（Bearer Token）

### パフォーマンス
- 統計キャッシュテーブルによる高速アクセス
- ビュー（View）による複雑なクエリの簡素化
- トリガーによる自動統計更新
- インデックス最適化

### セキュリティ
- 認証必須（authMiddleware）
- ユーザーは自分のデータのみアクセス可能
- 匿名化処理による個人情報保護
- エクスポート履歴の記録

## 使用方法

### 学習履歴ダッシュボード

1. `/learning-analytics-dashboard.html` にアクセス
2. フィルターで期間・教科を選択
3. グラフで成長曲線や学習パターンを確認
4. AIアドバイスを参考に学習計画を立てる
5. 印刷ボタンでレポート出力

### データエクスポート

1. `/data-export.html` にアクセス
2. エクスポート設定を選択
   - 種別（個人/匿名化）
   - 形式（CSV/JSON/Excel）
   - 期間・教科
3. または、クイックテンプレートを選択
4. データプレビューで確認
5. エクスポート実行ボタンをクリック
6. ダウンロード完了後、ファイルを取得

### 研究用データ

1. エクスポート種別で「匿名化データ」を選択
2. 匿名化レベルで「完全」を選択
3. 使用目的に「学術研究のため」と入力
4. 教科を選択して全期間を指定
5. CSV形式でエクスポート
6. エクスポート履歴から再ダウンロード可能

## 教育効果

### 生徒向け
- 自分の成長を可視化できる
- 学習パターンを理解できる
- 効果的な学習時間帯を発見できる
- 継続的なモチベーション維持

### 教員向け
- 生徒の長期的な成長を把握
- 学習パターンの傾向分析
- 個別指導の根拠データ
- 教科バランスの確認

### 研究者向け
- 完全匿名化データの提供
- CSV/JSON/Excel形式対応
- 統計分析用のデータ構造
- 学術研究への活用

## 実装工数
- データベース設計: 0.5日
- バックエンドAPI: 1日
- フロントエンド: 1日
- テスト・調整: 0.5日
- **合計: 3日**

## 本番情報
- **本番URL**: https://272c9618.jiyushindo-gakushu.pages.dev/
- **ダッシュボード**: `/learning-analytics-dashboard.html`
- **エクスポート**: `/data-export.html`
- **ステータス**: 本番稼働中 ✅
- **デプロイ日時**: 2026年2月8日

## 実装ファイル
```
webapp/
├── migrations/
│   └── 0055_learning_analytics_export.sql   (7,249文字)
├── src/
│   ├── learning-analytics.ts                 (7,770文字)
│   ├── data-export.ts                        (7,949文字)
│   └── index.tsx                             (API統合)
├── public/
│   ├── learning-analytics-dashboard.html     (25,463文字)
│   └── data-export.html                      (30,170文字)
└── docs/
    └── LEARNING_ANALYTICS_EXPORT.md          (このファイル)
```

## 今後の拡張

### 予定している機能
- R2ストレージへのファイル保存
- 定期自動エクスポート
- メール通知機能
- PDFレポート生成
- 保護者向けレポート
- クラス全体の統計比較
- 目標設定と達成度追跡

## 制約事項
- エクスポートファイルはBase64エンコードしたdata URL
- 大量データの場合、ブラウザのメモリ制限に注意
- エクスポート履歴は最新20件まで表示
- 統計キャッシュは日次更新（トリガー）

## 関連ドキュメント
- `AI_CHATBOT_IMPLEMENTATION.md`: AIチャットボット機能
- `VOICE_RECOGNITION_IMPLEMENTATION.md`: 音声認識機能
- `README.md`: プロジェクト概要

## ライセンス
このプロジェクトは松川村自由進度学習システムの一部です。

---

**実装者**: Claude (AI Assistant)
**実装日**: 2026年2月8日
**バージョン**: 1.0.0
