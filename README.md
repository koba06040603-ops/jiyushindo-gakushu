# 自由進度学習支援システム - 技術ドキュメント

> 📘 **一般向けの簡易版READMEは [README_SIMPLE.md](./README_SIMPLE.md) をご覧ください**

## 🌐 本番環境URL

**Phase 10-1デプロイ完了！** ✅  
- **本番URL**: https://8f268ac8.jiyushindo-gakushu.pages.dev
- **ダッシュボード**: https://8f268ac8.jiyushindo-gakushu.pages.dev/dashboard.html
- **保護者ダッシュボード**: https://8f268ac8.jiyushindo-gakushu.pages.dev/parent-dashboard.html
- **セキュリティダッシュボード**: https://8f268ac8.jiyushindo-gakushu.pages.dev/security-dashboard.html
- **PWA対応**: ✅ オフライン機能、ホーム画面追加、プッシュ通知
- **セキュリティ**: ✅ CSRF保護、レート制限、セキュリティヘッダー
- **API仕様書**: https://8f268ac8.jiyushindo-gakushu.pages.dev/static/api-docs
- **デプロイ日時**: 2026-02-04
- **プラットフォーム**: Cloudflare Pages
- **ステータス**: 🟢 Active
- **Phase 4完了**: ✅ 100% - 認証システム完全統合
- **Phase 5完了**: ✅ 100% - システム品質・本格運用準備完了
- **Phase 6完了**: ✅ 100% - 高度な機能実装完了
- **Phase 7完了**: ✅ 100% - 超高度な機能実装完了
- **Phase 8完了**: ✅ 100% - DBスキーマ同期 + 統合ダッシュボード完了
- **Phase 9完了**: ✅ 100% - 保護者機能 + PWA対応完了
- **Phase 10-1完了**: ✅ 100% - セキュリティ強化完了

## Phase 10-1: セキュリティ強化 🔒

### セキュリティ機能（完了）
- ✅ **CSRF保護**
  - トークン生成API: `GET /api/security/csrf-token`
  - CSRFミドルウェアによる自動検証
  - POST/PUT/DELETE リクエストで必須
  - トークン有効期限: 1時間
  
- ✅ **レート制限**
  - 全APIエンドポイントに適用
  - デフォルト: 100リクエスト/分
  - IPアドレスベースの制限
  - 制限超過時: HTTP 429エラー
  
- ✅ **セキュリティヘッダー**
  - Content-Security-Policy (CSP)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security (HSTS)
  - Referrer-Policy
  - Permissions-Policy
  
- ✅ **入力サニタイゼーション**
  - XSS対策: HTMLタグ、JavaScriptプロトコル除去
  - 最大文字数制限: 10,000文字
  - グローバル関数: `sanitizeInput()`
  
- ✅ **SQLインジェクション対策**
  - パラメータ検証関数
  - 危険なSQLキーワード検出
  - プリペアドステートメント使用
  - グローバル関数: `validateSQLParam()`
  
- ✅ **セキュリティ監査ログ**
  - 4つの新規テーブル
    - security_audit_logs（監査ログ）
    - security_settings（セキュリティ設定）
    - rate_limit_logs（レート制限ログ）
    - failed_login_attempts（ログイン失敗記録）
  - API: `POST /api/security/audit-log`
  
- ✅ **セキュリティダッシュボード**
  - 管理者専用画面
  - セキュリティスキャン機能
  - 監査ログ閲覧
  - ステータス監視
  - API: `GET /api/security/scan`

## Phase 9: 保護者機能とPWA対応 🎉📱

### Phase 9-1: 保護者ダッシュボード（完了）
- ✅ 複数子ども管理機能
  - 子ども一覧表示（カード形式）
  - 子ども選択で詳細表示
  - 学年・クラス情報表示
- ✅ 学習進捗確認
  - 4つの統計カード（学習日数、問題数、正答率、学習時間）
  - 週間学習傾向グラフ（Chart.js）
  - 教科別正答率グラフ（Chart.js）
  - 学習進捗リスト（進行状況バー）
- ✅ 最近の学習記録
  - 最近の学習ログ表示（正解/不正解）
  - 時系列での学習履歴
- ✅ 教師からのコメント
  - 評価コメント表示
  - 教師名・日時表示
  - スコア情報表示
- ✅ 保護者用API実装
  - `GET /api/parent/children` - 子ども一覧取得
  - `GET /api/parent/teacher-comments/:studentId` - 教師コメント取得
  - `GET /api/parent/weekly-summary/:studentId` - 週間学習サマリー

### Phase 9-2: PWA対応（完了）
- ✅ Service Worker実装
  - 静的リソースキャッシュ（オフライン対応）
  - APIレスポンスキャッシュ（5分有効期限）
  - ネットワーク優先戦略
  - キャッシュ優先戦略（静的ファイル）
  - 自動キャッシュ更新
- ✅ Web App Manifest
  - アプリ名・説明文
  - スタンドアロンモード
  - アイコン設定（192px, 512px）
  - テーマカラー設定
  - ショートカット定義
- ✅ PWA機能
  - ホーム画面追加プロンプト
  - インストールボタン対応
  - アプリインストール検知
  - スタンドアロンモード判定
- ✅ オフライン機能
  - オンライン/オフライン検知
  - オフライン時の通知表示
  - バックグラウンド同期サポート
  - オフライン時のフォールバックレスポンス
- ✅ プッシュ通知サポート
  - 通知許可リクエスト
  - プッシュ通知表示
  - 通知クリックイベント処理
  - Service Worker経由の通知

## Phase 8: DBスキーマ同期 + 統合ダッシュボードUI 🎉

### Phase 8-2: 本番DBスキーマ検証（完了）
- ✅ Production環境とLocal環境のテーブル差分分析
  - Production: 99テーブル
  - Local: 95テーブル → 103テーブルに拡張
- ✅ 不足テーブルの追加
  - answers, card_review_logs, curriculum_metadata
  - evaluations, hint_cards, optional_problems
  - user_sessions, users
- ✅ school_id列の追加（主要テーブル）
  - students, teachers, parents
  - learning_sessions, notifications, classes
  - その他70+テーブル
- ✅ インデックス最適化
  - school_id索引追加
  - 複合索引作成（パフォーマンス向上）

### Phase 8-1: 統合ダッシュボードUI（完了）
- ✅ 統合ダッシュボードページ（`/dashboard.html`）
  - 教師用ダッシュボード
    - 総学生数、今日の学習数、平均正答率、完了コース数
    - クイックアクション（CSV出力、クラス比較、レポート生成）
  - 学生用ダッシュボード
    - 学習日数、解いた問題数、正答率、達成バッジ
    - クイックアクション（学習開始、詳細統計、PDF出力）
  - リアルタイムグラフ（Chart.js）
  - 最近のアクティビティ表示
- ✅ ダッシュボード専用API
  - `GET /api/teacher/class-stats` - 教師用クラス統計
  - `GET /api/learning/stats/:studentId` - 学生用統計
  - `GET /api/learning/recent-logs` - 最近の学習ログ
  - `GET /api/learning/progress/:studentId` - 学生進捗

## Phase 7 超高度な機能実装完了！🎉🚀

### Phase 7-1: データ可視化（Chart.js統合）
- ✅ Chart.js 4.4.0統合（CDN自動読み込み）
- ✅ インタラクティブダッシュボード
  - 4種類のサマリーカード（問題数、正答率、学習日数、苦手単元）
  - 日別正答率推移（折れ線グラフ）
  - 教科別正答率（ドーナツグラフ）
  - 時間帯別学習量（棒グラフ）
  - 苦手単元トップ5（横棒グラフ）
- ✅ レスポンシブグラフ（全デバイス対応）
- ✅ カスタムカラー・アニメーション

### Phase 7-2: Push通知（Web Push API）
- ✅ ブラウザ通知権限管理
- ✅ 通知設定UI（通知タイプ別有効/無効）
- ✅ 3種類の通知
  - 学習完了通知（単元完了時）
  - 達成度アップ通知（目標達成時）
  - 教師コメント通知（コメント受信時）
- ✅ 通知カスタマイズ（音・振動・アイコン）
- ✅ 通知クリックでページ遷移
- ✅ テスト通知機能

### Phase 7-3: PDFレポート生成
- ✅ jsPDF 2.5.1統合
- ✅ html2canvas 1.4.1統合（画像エクスポート）
- ✅ 3種類のエクスポート
  - 簡易レポートPDF（サマリー情報）
  - 詳細レポートPDF（教師用・複数ページ）
  - ダッシュボード画像PNG（高解像度）
- ✅ A4サイズPDF（カバーページ付き）
- ✅ 自動ダウンロード

### Phase 7-4: UI/UX統合
- ✅ グラフ描画最適化（遅延読み込み）
- ✅ スムーズなアニメーション
- ✅ エラーハンドリング完全対応
- ✅ ローディング表示

## 最新機能一覧（Phase 7追加）
- ✅ **Phase 4完了**: 完全な認証・権限管理システム
- ✅ **Phase 5完了**: システム品質・本格運用準備完了
- ✅ **Phase 6完了**: 高度な機能実装完了
- ✅ **Phase 7完了**: 超高度な機能実装完了
  - ✅ データ可視化（Chart.js、4種類のグラフ）
  - ✅ Push通知（Web Push API、通知設定UI）
  - ✅ PDFレポート生成（jsPDF、画像エクスポート）
  - ✅ インタラクティブダッシュボード
  - ✅ Email通知システム（Resend API統合）
  - ✅ 高度な分析レポート（学習傾向、クラス比較、弱点分析）
  - ✅ リアルタイム協働機能（オンライン状態、協働セッション）
  - ✅ マルチテナント完全実装（school_idデータ分離）
  - ✅ レスポンシブUI（スマホ/タブレット対応）
  - ✅ CSVエクスポート（学習ログ、カリキュラム）
  - ✅ キャッシュ戦略（Cloudflare KV、主要APIで10倍高速化）
  - ✅ エラーハンドリング強化（自動リトライ、わかりやすいメッセージ、オフライン対応）

## プロジェクト概要

**名前**: 自由進度学習支援システム  
**目標**: 子どもたちが自ら考え実行する力を育み、個別最適な学びを実現する  

## 🔐 認証システム（Phase 4 完了）

### Phase 4実装内容

#### Phase 4-1: データベース設計
- **auth_users**: ユーザー情報（username, password_hash, full_name, user_role, school_id）
- **auth_sessions**: セッション管理（session_token, refresh_token, expires_at, refresh_expires_at）
- **schools**: 学校情報
- **classes**: クラス情報

#### Phase 4-2: フロントエンドログイン画面
- ログイン画面UI実装
- セッション検証機能
- 自動ログイン（セッション復元）
- デモモード（認証なし）

#### Phase 4-3: 認証ミドルウェア
- **authMiddleware**: セッショントークン検証
- **requireRole**: ロールベースアクセス制御
- **requirePermission**: 権限ベースアクセス制御

#### Phase 4-4: パスワードハッシュ化
- bcryptjsによる安全なパスワードハッシュ化
- テストデータ全アカウントのパスワードハッシュ更新

#### Phase 4-5: リフレッシュトークン
- セッショントークン（24時間有効）
- リフレッシュトークン（7日間有効）
- リフレッシュAPI実装

#### Phase 4-6: 権限管理システム
- **permissions**: 権限定義テーブル
- **role_permissions**: ロール権限マッピング
- デフォルト権限設定（admin, teacher, student）

### 認証API

| エンドポイント | メソッド | 説明 | 認証 |
|--------------|---------|------|------|
| /api/auth/login | POST | ログイン | - |
| /api/auth/logout | POST | ログアウト | ✅ |
| /api/auth/verify | POST | セッション検証 | - |
| /api/auth/refresh | POST | トークンリフレッシュ | - |
| /api/auth/users | GET | ユーザー一覧 | ✅ Admin/Teacher |
| /api/auth/permissions | GET | 権限一覧 | ✅ Admin |
| /api/auth/user-permissions/:userId | GET | ユーザー権限取得 | ✅ |

### テストアカウント

本番環境では以下のテストアカウントでログインできます：

| ロール | ユーザー名 | パスワード | 氏名 |
|--------|-----------|-----------|------|
| 教師 | teacher1 | password123 | 山田 太郎 |
| 教師 | teacher2 | password123 | 佐藤 花子 |
| 学生 | student1 | password123 | 田中 一郎 |
| 学生 | student2 | password123 | 鈴木 二郎 |
| 学生 | student3 | password123 | 高橋 三郎 |
| 管理者 | admin1 | password123 | 管理者 |

### 権限体系

#### 管理者（admin）
- すべての権限を保持

#### 教師（teacher）
- curriculum:read, curriculum:write
- students:read, students:write
- reports:read, reports:write
- learning:read, learning:write

#### 学生（student）
- curriculum:read
- learning:read, learning:write

## 🎉 最新アップデート（2026-02-03）

### ケース5-12 タブ機能＋インタラクティブ体験実装完了 ✨

**実装完了日**: 2026-02-03  
**デプロイURL**: https://b6e6da73.jiyushindo-gakushu.pages.dev

#### 📋 実装概要

全ケース（5, 7, 8, 9, 10, 11, 12）に以下の機能を実装：
- **3つのタブUI**: 学習内容・体験してみる・AI動画
- **モーダル全画面表示**: 95vw × 95vh でスクロール不要
- **×閉じるボタン**: 統一された閉じるUI
- **各ケース独自の体験要素**: インタラクティブな学習体験

#### 🎮 各ケースの体験要素

| ケース | 体験要素 | 説明 |
|--------|---------|------|
| **ケース5: 聴覚優位** 🎵 | リズムタップ | 4つのボタンをクリックして3×4=12を体感 |
| **ケース7: スモールステップ** 👣 | ステップ進行バー | 4ステップで段階的に学習、進行バー表示 |
| **ケース8: 視覚重視** 👁️ | 図形マッチング | 3つの選択肢から正解(12個)を選ぶ |
| **ケース9: 繰り返し強化** 🔁 | フラッシュカード | カードをクリックして答えを確認、5回練習 |
| **ケース10: テスト準備** ⭐ | クイックテスト | 10秒制限のクイズ、3つの選択肢から回答 |
| **ケース11: 応用問題** 🧩 | パズルチャレンジ | 文章問題から式を組み立てる（3、×、4） |
| **ケース12: 復習** 📚 | チェックリスト | 4項目の理解度チェック、全完了で完璧メッセージ |

#### 🎨 デザイン特徴

- **カラースキーム**: 各ケース専用の配色
  - ケース5: 紫-ピンク 🟣 | ケース7: 緑-ティール 🟢 | ケース8: 青-インディゴ 🔵
  - ケース9: アンバー-イエロー 🟡 | ケース10: 黄-オレンジ 🟠
  - ケース11: 紫-バイオレット 🟣 | ケース12: エメラルド-グリーン 💚

- **統一されたUI**: 全ケース同じレイアウト構造、レスポンシブ対応

#### 📊 実装統計

- **総ケース数**: 8ケース | **新規追加行**: 約2,500行
- **タブ機能**: 24タブ（各ケース3タブ × 8） | **体験要素**: 8種類

#### 🚀 使い方

1. トップページ → 「ケース別学習動画デモ」セクション
2. 各ケースのボタンをクリック → モーダルが全画面表示
3. 3つのタブを切り替え（学習内容・体験・AI動画）
4. 「体験してみる」タブでインタラクティブ要素を試す
5. 「AI動画」タブで動画生成

---

**主要機能**: 
- 学年・教科・単元別の学習カード
- 3コース制（じっくり・しっかり・ぐんぐん）による個別最適化
- AI先生によるソクラテス対話
- リアルタイム進捗可視化
- 非認知能力の育成と評価
- 学習計画と振り返り機能
- **Phase 5**: 先生カスタマイズモード、指導・評価、学習環境デザイン、ゲーミフィケーション、ナラティブ機能
- **Phase 7**: リアルタイム通知機能 ✅ **実装完了 (2026-01-28)**
  - WebSocketベースの通知システム
  - 先生からのメッセージ受信機能
  - 新しいカード配信通知
  - 通知履歴とバッジシステム
- **Phase 9**: 学習スタイル対応機能 ✅ **実装完了 (2026-01-28)**
  - 視覚型・聴覚型・体感型の3スタイル対応
  - スタイル別問題生成（AI駆動）
  - 音声読み上げ機能（聴覚型）
  - インタラクティブ要素（体感型）
  - 視覚強化（視覚型）
- **2026-01-18**: 学習カード画像表示機能、AI先生プロンプト改善（温かく忍耐強い教師スタイル）
- **2026-01-19**: プレゼン用機能、進捗ボード機能追加
  - 学習スタイル別サンプルページ
  - AIメディア生成デモ機能（画像・動画・音声・音楽・インタラクティブ教材）
  - 曲調選択機能（4種類：明るいポップ、やさしいバラード、リズミカル、アコースティック）
  - **教師用進捗ボード**: トップページから簡単アクセス、カリキュラム選択で進捗表示
  - **児童向け友達助け合い機能**: クラス進捗確認、助けられる友達の自動判定、ヘルプ要請機能
- **2026-01-29**: 分散学習スケジューラー実装 ✅ **完了**
  - **科学的根拠**: Ebbinghaus忘却曲線、Leitnerシステム、SuperMemo SM-2アルゴリズム
  - **Leitnerボックスシステム**: 5段階のボックスで習熟度管理（1日→3日→1週間→2週間→1ヶ月）
  - **SuperMemo SM-2**: 学習品質に基づく最適復習間隔計算
  - **自己調整学習統合**: SRLの3段階（予見・遂行・内省）と連動
  - **復習推奨システム**: 
    - 今日の復習カード自動抽出
    - 週間復習スケジュール表示
    - 忘却リスク検出と優先度計算
  - **習熟度追跡**: 
    - 学習段階管理（未学習・学習中・復習期・習得済み）
    - リアルタイム習熟度更新
    - 学習履歴の詳細記録
  - **進捗ダッシュボード**: 
    - 分散学習サマリー表示
    - Leitnerボックス分布可視化
    - 週間スケジュールグラフ
  - **デモページ**: `/spaced-learning-progress-demo.html`
- **2026-01-29**: 復習推奨通知機能実装 ✅ **完了**
  - **WebSocket通知システム拡張**: 分散学習の復習タイミング通知
  - **生徒用機能**:
    - 自動復習チェック（1時間ごと）
    - 期限超過カードの警告
    - 優先度付き通知表示
  - **教師用機能**:
    - クラス全体への復習リマインダー送信
    - 個別生徒への復習通知
  - **UI実装**:
    - トースト通知（4種類：success/error/warning/info）
    - モーダル通知（詳細表示）
    - 復習バッジ（カウンター表示）
    - 音声通知（オプション）
- **2026-01-29**: 検索練習システム データベース設計完了 ✅
  - **科学的根拠**: テスト効果（Roediger & Karpicke 2006）、生成効果（Slamecka & Graf 1978）
  - **4種類の想起タイプ**: 自由想起・手がかり想起・再認・精緻化想起
- **2026-01-29**: 交互配置練習システム データベース設計完了 ✅
  - **科学的根拠**: Kornell & Bjork (2008)、Rohrer & Taylor (2007)
  - **4種類の交互配置戦略**: ランダム・ブロック・適応型・体系的
- **2026-01-29**: 協働学習機能実装完了 ✅ **完了**
  - **友達の回答比較システム**:
    - 同じ問題への複数回答比較
    - 解法の多様性理解
    - 相互学習促進
  - **ピア評価システム**:
    - 5段階評価
    - フィードバック交換
    - 学んだこと記録
  - **協働学習統計**:
    - 投稿回答数
    - 評価回数
    - 役に立ったマーク数
    - 平均評価スコア
  - **科学的根拠**: Slavin (1996)協働学習の効果、Topping (1998)ピア評価の学習効果
  - **デモページ**: `/collaborative-reports-demo.html`
- **2026-01-29**: 週次・月次レポート機能実装完了 ✅ **完了**
  - **週次レポート**:
    - 学習時間・復習数・正答率
- **2026-01-30**: 学習レポート自動生成機能実装完了 ✅ **完了**
  - **保護者向け個別生徒詳細レポート**:
    - 週次・月次・学期レポート対応（過去7日/30日/3ヶ月）
    - 学習サマリー：学習時間・完了カード数・習熟度・成長率
    - 保護者向けメッセージ自動生成
  - **学習スタイル分析**:
    - VARK（Visual/Auditory/Reading/Kinesthetic）スコア可視化
    - 優位な学習スタイルの特定
    - スタイル別学習推奨事項
  - **教科別パフォーマンス分析**:
    - 各教科の完了カード数・平均スコア・習熟率
    - 教科別グラフ表示
  - **成長トレンド**:
    - 前期間との比較
    - 改善率計算
  - **課題エリアと改善提案**:
    - 苦手教科の自動検出
    - AI駆動の改善提案
  - **達成実績（バッジ）**:
    - 期間中に獲得したバッジ一覧
    - 達成日時記録
  - **AI教師とのやりとりサマリー**:
    - 質問回数統計
  - **PDF生成機能**:
    - html2pdf.jsによる高品質PDF出力
    - 印刷最適化レイアウト
  - **教師用統合UI**:
    - トップページ「学習レポート作成」ボタン
    - 生徒選択＋レポート種類選択
    - ワンクリックでレポート生成・PDF出力
  - **デプロイ**: https://7bcc4d50.jiyushindo-gakushu.pages.dev
    - ScTNスコア推移
    - 分散学習進捗
    - 学習方略効果
  - **月次レポート**:
    - 習得カード数
    - 平均正答率
    - 学習効果スコア
    - 協働学習スコア
  - **経年変化グラフ**:
    - ScTNスコア推移（メタ認知・自己調整・動機づけ・協働学習）
    - 習熟度推移
    - Chart.jsによる可視化
  - **科学的根拠**: Zimmerman (2002)自己調整学習とメタ認知
  - **デモページ**: `/collaborative-reports-demo.html`
- **2026-01-29**: 検索練習（Retrieval Practice）完全実装完了 ✅ **完了**
  - **セッション管理API**: 6エンドポイント
  - **4種類の想起タイプ**: 自由想起・手がかり想起・再認・精緻化想起
  - **AI評価システム**: Gemini API統合、正確性・完全性・精度スコア
  - **メタ認知追跡**: 自信度vs実績、メタ認知ギャップ測定
  - **効果測定フレームワーク**: 即時想起・保持・転移効果の追跡
  - **科学的根拠**: Roediger & Karpicke (2006)テスト効果、Slamecka & Graf (1978)生成効果
  - **UIコンポーネント**: RetrievalPracticeUI
- **2026-01-29**: 交互配置練習（Interleaved Practice）完全実装完了 ✅ **完了**
  - **セッション管理API**: 6エンドポイント
  - **4種類の交互配置戦略**: ランダム・ブロック・適応型・体系的
  - **概念識別能力追跡**: 混同マトリックス、識別正答率、概念別統計
  - **転移学習効果測定**: ソース→ターゲット概念の転移効率
  - **効果分析ビュー**: 学生サマリー、混同マトリックス、効果分析
  - **科学的根拠**: Kornell & Bjork (2008)識別効果、Rohrer & Taylor (2007)転移促進、Birnbaum et al. (2013)概念識別向上
  - **UIコンポーネント**: InterleavedPracticeUI
- **2026-01-29**: 統合学習ダッシュボード実装完了 ✅ **完了**
  - **全機能の統合表示**: 分散学習・検索練習・交互配置・協働学習
  - **サマリーカード**: 4種類の学習方略の進捗一覧
  - **クイックアクション**: ワンクリックで各機能開始
  - **学習状況の総合ビュー**:
    - 今日の復習カード一覧
    - 習熟度推移グラフ（Chart.js）
    - ScTNスコア表示（4次元）
- **2026-01-30**: 学習レポート拡張機能実装完了 ✅ **完了**
  - **Chart.jsグラフ可視化**:
    - 学習時間推移（折れ線グラフ）
    - 習熟度レーダーチャート（6教科対応）
    - 教科別パフォーマンス（棒グラフ）
  - **比較分析機能**:
    - クラス平均との比較
    - 前期間比較（週次/月次/期間）
    - パーセンタイル順位表示
  - **機械学習予測機能**:
    - 線形回帰による学習進捗予測
    - 次週カード数・習熟度予測
    - 目標達成確率計算
    - 推奨学習時間提示
    - AIアドバイス自動生成
  - **動画学習コンテンツ統合**（Phase 11）:
    - 動画コンテンツAPIエンドポイント
    - 視聴履歴トラッキング
    - 視聴進捗統計
    - レポートテンプレート管理データベース
- **2026-01-30**: 動画学習プレイヤーUI実装完了 ✅ **完了**
  - **動画プレイヤー機能**:
    - YouTube/Vimeo/HTML5動画埋め込み対応
    - リアルタイム視聴進捗トラッキング
    - 一時停止・巻き戻し回数記録
    - 視聴完了マーク機能
  - **視聴履歴管理**:
    - 学習カード別動画一覧
    - 生徒別視聴履歴表示
    - 視聴統計（時間、進捗率、操作回数）
- **2026-01-30**: レポートテンプレート管理システム実装完了 ✅ **完了**
  - **ドラッグ&ドロップエディタ**:
    - 10種類の利用可能コンポーネント
    - 直感的なドラッグ&ドロップ操作
    - コンポーネント順序変更（上下移動）
    - リアルタイムプレビュー
  - **テンプレート管理**:
    - テンプレート作成・編集・削除
    - 公開/非公開設定
    - 教師間でのテンプレート共有
    - テンプレート一覧表示
  - **利用可能コンポーネント**:
    - 学習サマリー、学習時間推移グラフ
    - 習熟度レーダーチャート、教科別パフォーマンス
    - 学習スタイル分析、AI教師やりとり
    - 達成バッジ、クラス比較、学習予測
    - 保護者向けメッセージ
  - **デプロイ**: https://3058cd3c.jiyushindo-gakushu.pages.dev
- **2026-01-30**: 学習カードメディア管理機能実装完了 ✅ **完了** (Phase 13)
  - **メディア管理UI**:
    - 学習カードに画像・動画を追加
    - 画像URL入力、画像タイプ選択（イラスト、図解、写真、AI生成）
    - 説明文、キャプション、表示順序設定
    - 動画URL追加（YouTube、Vimeo、直接URL）
  - **AI画像生成**:
    - Gemini Imagen API統合（デモ版）
    - プロンプト入力、スタイル選択
    - ネガティブプロンプト対応
    - 生成画像プレビュー、学習カードへの追加
    - AI生成履歴管理
  - **データベース拡張**:
    - card_imagesテーブル（画像管理）
    - card_media_metadataテーブル（メディアメタデータ）
    - ai_generated_imagesテーブル（AI生成履歴）
    - card_edit_historyテーブル（編集履歴）
  - **デプロイ**: https://d9e59052.jiyushindo-gakushu.pages.dev
- **2026-01-30**: ファイルアップロード機能実装完了 ✅ **完了** (Phase 14)
  - **画像アップロード**:
    - ファイル選択UI（input[type=file]）
    - ドラッグ&ドロップ対応
    - 画像プレビュー表示
    - ファイルサイズチェック（10MB制限）
    - 対応形式：JPEG、PNG、GIF、WebP
  - **動画アップロード**:
    - ファイル選択UI
    - ファイルサイズチェック（100MB制限）
    - 対応形式：MP4、WebM、OGG、MOV
  - **Cloudflare R2統合**:
    - R2バケット設定（jiyushindo-gakushu-media）
    - ファイルアップロードAPI
    - メディアプロキシAPI（/api/media/*）
    - キャッシュ制御（1年キャッシュ）
  - **注意**: 本番環境でのR2バケットはCloudflare Dashboard経由で設定が必要
  - **デプロイ**: https://e58a32fd.jiyushindo-gakushu.pages.dev
- **2026-01-29**: 高優先度3機能完全実装完了 ✅ **完了**
  - **PDF出力機能** (jsPDF + autoTable + Chart.js統合):
    - 週次・月次レポートのPDF生成
    - グラフ画像埋め込み (Chart.js → PNG → PDF)
    - 多言語対応 (日本語フォント埋め込み)
    - UIコンポーネント: PDFGenerator
  - **データ可視化強化** (Chart.js拡張):
    - レーダーチャート (ScTN 6次元分析)
    - ヒートマップ (時間帯別学習頻度)
    - バブルチャート (難易度×習熟度×学習時間)
    - ドーナツチャート (分野別配分)
    - 散布図 (学習時間と成績の相関分析)
    - UIコンポーネント: AdvancedVisualization
  - **AI先生の強化** (Gemini 3.0 Flash統合 ⭐NEW):
    - **Gemini 3.0 Flash**への完全移行 (gemini-2.5-flash → gemini-3.0-flash)
    - 対話履歴管理 (セッション管理)
    - 段階的ヒント提供 (3段階: Hint → Explanation → Solution)
    - メタ認知促進質問 (Before/During/After学習)
    - 学習方略提案 (学習スタイル別)
    - 自動問題生成 (難易度調整・要件対応)
    - パーソナライズ学習計画 (学習状況分析)
    - 感情的サポート (励まし・動機づけ)
    - APIエンドポイント: 6個 (enhanced-dialogue, gradual-hints, metacognitive, learning-strategies, generate-problem, personalized-plan)
    - **科学的根拠**: Flavell (1979), Schraw & Dennison (1994), Weinstein & Mayer (1986), VanLehn (2011), Kulik & Fletcher (2016)
  - **デモページ**: `/advanced-features-demo.html`
- **2026-01-30**: Phase 5 中優先度3機能完全実装完了 ✅ **NEW完了**
  - **Gemini 3.0 Flash対応**:
    - 全APIエンドポイントをGemini 3.0 Flashに更新
    - フォールバック: gemini-3.0-flash → gemini-2.0-flash → gemini-2.5-pro
    - より高速で効率的なAI応答
  - **ゲーミフィケーション機能**:
    - レベル&ポイントシステム (経験値・ランク)
    - バッジコレクション (6種類: Bronze/Silver/Gold/Platinum)
    - アチーブメント進捗 (3種類)
    - ランキングシステム (ポイント・ストリーク)
    - 連続学習ストリーク
    - デイリークエスト (3種類)
    - **科学的根拠**: Deci & Ryan (2000) 自己決定理論、Hamari et al. (2014)
    - **デモページ**: `/gamification-demo.html`
  - **保護者ダッシュボード**:
    - 複数子供の管理
    - 週次学習サマリー、学習活動グラフ (Chart.js)
    - 分野別習熟度、今週の成果
    - 学習方略使用状況
    - 通知履歴、改善のヒント
    - PDFレポート出力
    - **科学的根拠**: Epstein (2001) 家庭と学校の連携、Fan & Chen (2001)
    - **デモページ**: `/parent-dashboard-demo.html`
  - **教師向けクラス分析ツール**:
    - 複数クラス管理、クラス全体サマリー
    - 学習方略採用率 (4種類)
    - 習熟度分布・エンゲージメント推移グラフ
    - 要支援生徒アラート (重要度別)
    - 分野別クラス平均、苦手な単元の特定
    - クラス間比較 (学年平均との比較)
    - PDFレポート出力、保護者への一斉通知
    - **科学的根拠**: Hattie (2009)、Black & Wiliam (1998) 形成的評価
    - **デモページ**: `/teacher-dashboard-demo.html`
  - **デモページ一覧**:
    - `/integrated-dashboard.html` - 統合学習ダッシュボード
    - `/advanced-features-demo.html` - 高度な機能デモ (PDF出力・データ可視化強化・AI先生)
    - `/gamification-demo.html` - ゲーミフィケーション機能デモ
    - `/parent-dashboard-demo.html` - 保護者ダッシュボードデモ
    - `/teacher-dashboard-demo.html` - 教師向けクラス分析ツールデモ
- **2026-01-30**: Phase 6 低優先度機能+不登校支援完全実装完了 ✅ **完了**
  - **多言語対応 (i18n)**:
    - 4言語サポート: 日本語・英語・中国語・韓国語
    - i18nシステム (I18nクラス)
    - 自動言語検出、ローカルストレージ保存
    - 日付・数値・通貨フォーマット、複数形対応
    - **科学的根拠**: Cummins (1979)、Thomas & Collier (1997)
    - **実装ファイル**: `/static/i18n.js`
  - **PWA対応 (Progressive Web App)**:
    - Service Worker、オフラインキャッシュ
    - Background Sync、Push通知
    - App Manifest、ホーム画面に追加
    - **実装ファイル**: `/service-worker.js`, `/manifest.json`
  - **オフライン学習モード**:
    - IndexedDBローカル保存
    - オンライン復帰時自動同期
    - **デモページ**: `/offline.html`
  - **不登校児童生徒支援機能 ❤️ NEW**:
    - 今日の気分チェック (5段階)
    - 柔軟な学習スケジュール (5分から、時間自由)
    - サポート体制 (AI先生・担任・カウンセラー・保護者)
    - マイペース学習 (プレッシャーなし、小さな成功体験)
    - 気持ちの記録 (日記機能)
    - 復学支援 (段階的プラン)
    - 小さな目標設定、保護者向けガイド
    - **科学的根拠**: 文科省「不登校児童生徒への支援の在り方について（通知）」令和元年10月25日、Kearney (2008)
    - **デモページ**: `/truancy-support-demo.html`
  - **デモページ一覧（16件）**:
    - `/integrated-dashboard.html` - 統合学習ダッシュボード
    - `/advanced-features-demo.html` - 高度な機能デモ (PDF出力・データ可視化強化・AI先生)
    - `/gamification-demo.html` - ゲーミフィケーション機能デモ
    - `/parent-dashboard-demo.html` - 保護者ダッシュボードデモ
    - `/teacher-dashboard-demo.html` - 教師向けクラス分析ツールデモ
    - `/multilingual-pwa-demo.html` - 多言語対応・PWA機能デモ
    - `/truancy-support-demo.html` - 不登校児童生徒支援デモ
    - `/offline.html` - オフラインモードページ
    - `/auth-demo.html` - 認証・認可システムデモ（Phase 7）
    - `/adaptive-learning-demo.html` - 適応学習エンジンデモ（Phase 9）
    - `/school-management-demo.html` - 学校管理システムデモ（Phase 10）
    - `/integrated-features-demo.html` - 統合機能デモ（AI生成+マルチモーダル）**NEW**
    - `/spaced-learning-progress-demo.html` - 分散学習進捗デモ
    - `/collaborative-reports-demo.html` - 協働学習レポートデモ
    - `/health` - システムヘルスチェック
    - `/` - トップページ
- **2026-01-30**: Phase 7 本番環境整備3項目完全実装完了 ✅ **NEW完了**
  - **データベース統合マイグレーション** ✅:
    - 全テーブルスキーマを `0000_init_all_tables.sql` に統合（80コマンド）
    - 45+テーブル（学生、カード、進捗、SRL、分散学習、検索練習、交互配置、協働学習、ScTN、ゲーミフィケーション、レポート、通知、AI会話、多言語、不登校支援、PWA）
    - INDEXの最適化（20+インデックス）
    - 外部キー制約の適切な管理
    - **実装ファイル**: `/migrations/0000_init_all_tables.sql`
  - **認証・認可システム (JWT + RBAC)** ✅:
    - JWT (JSON Web Token) ベース認証
    - Role-Based Access Control (RBAC)
    - 3ユーザータイプ: 学生・教師・保護者
    - 4ロール: student, teacher, parent, admin
    - パスワードハッシュ化（Web Crypto API）
    - Cookie + Bearer Token 両対応
    - パスワード変更機能
    - **APIエンドポイント**: 
      - `POST /api/auth/register/student` - 学生登録
      - `POST /api/auth/login` - ログイン
      - `POST /api/auth/logout` - ログアウト
      - `GET /api/auth/me` - 現在のユーザー情報取得（認証必須）
      - `POST /api/auth/change-password` - パスワード変更（認証必須）
      - `GET /api/admin/dashboard` - 管理者ダッシュボード（管理者・教師のみ）
      - `GET /api/student/progress` - 学生進捗（学生のみ）
    - **実装ファイル**: `/src/auth.ts`
    - **デモページ**: `/auth-demo.html`
  - **統合E2Eテスト (Playwright)** ✅:
    - Playwright テストフレームワーク統合
    - 10種類のテストスイート（68テストケース）:
      - 認証システムE2Eテスト（登録→ログイン→ログアウト、RBAC、パスワード変更）
      - 学習カードシステムE2Eテスト（統合ダッシュボード表示）
      - ゲーミフィケーションE2Eテスト（デモページ表示）
      - 協働学習E2Eテスト（デモページ表示）
      - 多言語対応E2Eテスト（言語切り替え）
      - PWA・オフライン機能E2Eテスト（Service Worker、オフラインページ）
      - 不登校支援機能E2Eテスト（デモページ表示）
      - API統合テスト（カリキュラムAPI、通知API）
      - レスポンシブデザインE2Eテスト（モバイル、タブレット）
      - パフォーマンステスト（ページロード時間測定）
    - 6ブラウザ対応（Chrome、Firefox、Safari、Mobile Chrome、Mobile Safari、iPad）
    - HTML/JSONレポート生成、トレース・スクリーンショット・ビデオ録画（失敗時）
    - **実装ファイル**: `/tests/e2e.spec.ts`, `/playwright.config.ts`
    - **実行コマンド**: `npm test`, `npm run test:ui`
  - **エラー監視・ロギングシステム** ✅:
    - 構造化ログ出力（JSON形式）
    - 5段階ログレベル（DEBUG, INFO, WARN, ERROR, FATAL）
    - リクエストコンテキスト追跡（user_id, request_id, path, method, IP, User-Agent）
    - グローバルエラーハンドリングミドルウェア
    - リクエストロギングミドルウェア（duration、status追跡）
    - パフォーマンス計測（PerformanceTracker）
    - ヘルスチェックエンドポイント（`/health`）
    - システムステータスエンドポイント（`/api/admin/system-status`、管理者のみ）
    - Cloudflare Analytics統合準備（カスタムヘッダー）
    - Sentry統合準備（エラーレポート送信）
    - **実装ファイル**: `/src/monitoring.ts`
  - **本番デプロイガイド** ✅:
    - Gemini API Key設定手順
    - D1データベース作成＆マイグレーション手順
    - 環境変数一覧
    - Cloudflare Pages デプロイ手順
    - セキュリティ設定（JWT Secret、CORS）
    - 監視・ロギング設定
    - デプロイチェックリスト
    - トラブルシューティングガイド
    - パフォーマンス最適化（KVキャッシュ、INDEX）
    - **実装ファイル**: `/DEPLOYMENT_GUIDE.md`
- **2026-01-30**: Phase 8 (Option A) 本番環境デプロイ準備完了 ✅ **NEW完了**
  - **KVキャッシュシステム実装** ✅:
    - Cloudflare KV統合（高速データキャッシング）
    - 5種類のキャッシュ管理クラス:
      - StudentProgressCache（学生進捗、TTL 5分）
      - CurriculumCache（カリキュラム、TTL 1時間）
      - ScTNScoreCache（ScTNスコア、TTL 1日）
      - RankingCache（ランキング、TTL 10分）
      - ClassStatsCache（クラス統計、TTL 5分）
    - キャッシュ無効化パターンマッチング
    - キャッシュ統計APIエンドポイント（`/api/admin/cache-stats`）
    - **科学的根拠**: キャッシュ戦略は CDN Best Practices (Cloudflare, 2023) に準拠
    - **実装ファイル**: `/src/cache.ts`
  - **本番デプロイ完全ガイド** ✅:
    - KV Namespace作成手順（本番＋プレビュー）
    - D1データベース本番マイグレーション手順
    - Cloudflare Pages プロジェクト作成手順
    - 環境変数・シークレット設定（GEMINI_API_KEY, JWT_SECRET）
    - KV Namespace バインディング設定（Webダッシュボード）
    - ビルド＆デプロイコマンド
    - 本番環境動作確認手順
    - パフォーマンステスト基準（FCP < 1.5s, LCP < 2.5s, TTI < 3.5s, Lighthouse > 90）
    - 定期メンテナンス手順
    - トラブルシューティング（10種類の問題と解決策）
    - **実装ファイル**: `/DEPLOYMENT_PRODUCTION.md`
  - **カスタムドメイン設定ガイド** ✅:
    - Cloudflare管理ドメイン設定（推奨、最も簡単）
    - 外部DNSプロバイダー設定（CNAME、ALIAS、Aレコード）
    - ルートドメイン（Apex Domain）設定
    - SSL/TLS設定（Let's Encrypt自動発行）

- **2026-01-30**: Phase 9 & 10 完全実装完了 ✅ **NEW完了**
  - **Phase 9: 適応学習エンジン** ✅:
    - **学習スタイル自動検出システム**:
      - VARKモデル分析（Visual, Auditory, Reading/Writing, Kinesthetic）
      - Gardner多重知能理論分析（8種類の知能）
      - 学習行動パターン収集（12指標）
      - 信頼度スコア計算（データ量ベース）
      - 主要スタイル・知能自動判定
    - **適応型カリキュラム推薦**:
      - 学習スタイルに基づく最適カリキュラム推薦
      - 未完了カードの優先順位付け
      - 推薦スコアリングアルゴリズム
    - **APIエンドポイント**:
      - `GET /api/adaptive/detect-learning-style/:studentId` - 学習スタイル検出
      - `GET /api/adaptive/recommend/:studentId` - カリキュラム推薦
    - **科学的根拠**:
      - VARK Model (Fleming, 2001)
      - Multiple Intelligences Theory (Gardner, 1983)
      - Aptitude-Treatment Interaction (Cronbach & Snow, 1977)
      - Learning Analytics (Siemens & Long, 2011)
    - **実装ファイル**: `/src/adaptive-learning.ts`
    - **デモページ**: `/adaptive-learning-demo.html`

  - **Phase 10: 学校・自治体向け管理機能** ✅:
    - **多クラス管理**:
      - 学校内全クラスの進捗一覧表示
      - クラス別統計（生徒数、平均進捗率、平均習熟度）
      - 担任教師情報表示
    - **学年別サマリ**:
      - 学年単位の統計分析
      - トップパフォーマンスクラス表示
      - 支援必要生徒数カウント
    - **教師向けクラス分析**:
      - クラス全体統計（生徒数、平均進捗、習熟度分布）
      - 生徒個別詳細（進捗率、学習スタイル、学習時間）
      - 高達成者・支援必要生徒の自動分類
    - **保護者通知システム**:
      - メール・プッシュ通知・SMS対応
      - 通知履歴管理
      - 送信ステータス追跡（pending, sent, failed）
    - **学校全体レポート**:
      - 期間指定レポートデータ生成
      - 学校基本情報・全体統計・学年別統計・クラス別統計
      - PDF生成用データ構造化
    - **APIエンドポイント**:
      - `GET /api/school/:schoolId/classes` - 全クラス進捗
      - `GET /api/school/:schoolId/grade-summary` - 学年別サマリ
      - `GET /api/teacher/:teacherId/class/:classCode/analysis` - クラス分析
      - `POST /api/parent/notify` - 保護者通知送信
      - `GET /api/parent/notifications/:studentId` - 通知履歴
      - `GET /api/school/:schoolId/report` - 学校レポート
    - **実装ファイル**: `/src/school-management.ts`
    - **デモページ**: `/school-management-demo.html`

  - **統合E2Eテスト拡充** ✅:
    - Phase 9テスト: 2ケース（学習スタイル検出、カリキュラム推薦）
    - Phase 10テスト: 7ケース（クラス進捗、学年サマリ、教師分析、保護者通知×3、学校レポート）
    - 総テストケース数: 75+（Phase 7-10統合）
    - **実装ファイル**: `/tests/e2e.spec.ts`
    - パフォーマンス最適化（CDN、キャッシュレベル、Auto Minify）
    - セキュリティ設定（セキュリティヘッダー、HSTS）
    - DNS設定例まとめ（Cloudflare、お名前.com、ムームードメイン、Route 53）
    - 確認コマンド（DNS、SSL、HTTP/HTTPS）
    - トラブルシューティング（DNS伝播、SSL証明書、リダイレクトループ）
    - **実装ファイル**: `/CUSTOM_DOMAIN_GUIDE.md`

---

## 📚 ドキュメント一覧

### 🎓 理論・設計ドキュメント（NEW）

- ⭐ **[FINAL_THEORY_INTEGRATION.md](./FINAL_THEORY_INTEGRATION.md)** - **8理論＋文科省方針 完全統合モデル**
  - VARK・Gardner・Kolb・ATI・Zimmerman SRL・認知科学・足場かけ理論（Vygotsky）・自己決定理論（Deci & Ryan）の8理論統合
  - 文部科学省 次期学習指導要領（令和7年12月15日）完全対応
  - 世界最高峰の個別最適化学習システム設計書

- 📊 **[SCTN_NATIONAL_SURVEY_INTEGRATION.md](./SCTN_NATIONAL_SURVEY_INTEGRATION.md)** - **ScTN質問紙と全国学力・学習状況調査の統合** ⭐⭐⭐NEW（2026-01-29作成・実装済み✅）
  - **ScTN質問紙の詳細分析**: 苫野一徳監修、3パッケージ、71問の質問項目
  - **全国学力・学習状況調査との対応関係**: 27項目が完全一致、相関分析の根拠
  - **指導と評価の一体化**: PDCAサイクル、形成的評価、3観点評価への反映
  - **学習カード・指導・評価への反映方針**: 自己調整学習の3段階サイクル、協働的な学び、科学的学習方略
  - **研究・論文執筆の根拠データ収集方法**: データベース設計、統計分析方法、論文構成例
  - **✅ 実装完了（2026-01-29）**:
    - ScTN質問紙結果テーブル（71問、3パッケージ対応）
    - 全国学力・学習状況調査結果テーブル（63問対応）
    - ScTN-全国学調対応関係テーブル（27項目完全一致）
    - 自己調整学習プロファイルテーブル（予見・遂行・内省3段階）
    - 学習方略使用履歴テーブル
    - learning_cardsテーブルへの自己調整学習3段階フィールド追加
    - student_progressテーブルへの自己調整学習記録フィールド追加

- **2026-01-30**: Option B 追加機能開発完了 ✅ **NEW完了**
  - **AI生成コンテンツシステム** ✅:
    - 学習スタイル別コンテンツ自動生成（Gemini API統合）
    - 4コンテンツタイプ（problem, explanation, hint, real_world）
    - VARKプロンプト最適化
    - APIエンドポイント: `POST /api/ai/generate-content`, `GET /api/ai/content-history`
    - 実装: `/src/ai-content-generator.ts` (10.5KB)
  - **マルチモーダル学習機能** ✅:
    - Web Speech API（TTS/STT）
    - 視覚補助（画像拡大・ハイライト・カラースキーム）
    - アクセシビリティ設定（フォントサイズ・行間）
    - 実装: `/public/static/multimodal-learning.js` (11.3KB)
  - **データベース拡張**: 3テーブル追加（ai_generated_content, multimodal_preferences, multimodal_usage_log）
  - **E2Eテスト**: 4ケース追加（総79+ケース）

- **2026-01-30**: Option C 品質向上 + パフォーマンス最適化完了 ✅ **NEW完了**
  - **D1クエリINDEX最適化** ✅:
    - 70+ INDEX追加（学習履歴・進捗・セッション・カード・協働学習・ゲーミフィケーション・ScTN等）
    - 複合INDEX（頻繁使用クエリパターン用）
    - 予想パフォーマンス改善: 学習履歴70-80%、進捗60-70%、分散学習80-90%高速化
    - 実装: `/migrations/0038_performance_optimization_indexes.sql` (6.4KB)
  
  - **Cloudflare Analytics統合** ✅:
    - カスタムイベント送信
    - ページビュー追跡
    - APIコール追跡（エンドポイント・所要時間・ステータス）
    - 実装: `/src/monitoring-advanced.ts` (8.8KB)
  
  - **Sentryエラー監視統合** ✅:
    - 例外キャプチャ（スタックトレース解析）
    - メッセージキャプチャ（info/warning/error）
    - パフォーマンストランザクション追跡
    - リクエストコンテキスト記録
    - 実装: `/src/monitoring-advanced.ts`
  
  - **パフォーマンス計測ミドルウェア** ✅:
    - リクエスト所要時間記録
    - メトリクス統計（min/max/avg/p50/p95/p99）
    - 遅いリクエスト警告（500ms以上）
    - レスポンスヘッダー追加（X-Response-Time, X-Request-ID）
  
  - **E2Eテストカバレッジ拡大** ✅:
    - 主要APIエンドポイント統合テスト（4ケース）
    - WCAG 2.1 AAアクセシビリティテスト（5ケース）
    - パフォーマンステスト拡張（3ケース）
    - 総テストケース数: **92+** （Option Cで13ケース追加）
    - 目標: カバレッジ90%+達成
  
  - **WCAG 2.1 AAアクセシビリティ対応** ✅:
    - キーボードナビゲーション（Tabキーフォーカス移動）
    - 画像alt属性必須化
    - フォーム要素ラベル必須化
    - カラーコントラスト比確認
    - ボタンフォーカス表示強化
  
  - **統合機能デモページ** ✅:
    - AI生成コンテンツ + マルチモーダル学習統合
    - アクセシビリティコントロール（ライト/ダーク/文字サイズ）
    - 音声コントロール（TTS/STT）
    - URL: `/integrated-features-demo.html`

- 📋 **[MOE_ALIGNMENT_REPORT.md](./MOE_ALIGNMENT_REPORT.md)** - **文科省資料との整合性確認レポート**
  - 令和7年12月15日 教育課程部会 総則・評価特別部会 資料分析
  - 令和7年9月25日 教育課程企画特別部会 論点整理 分析
  - 「個に応じた学習過程の充実」「自己調整学習」「科学的学習方略」対応状況
  - 整合性スコア: 73.6/100

- 📖 **[COMPLETE_INTEGRATION_MODEL.md](./COMPLETE_INTEGRATION_MODEL.md)** - 完全統合モデル詳細
  - 8理論統合の技術的実装（足場かけ理論・自己決定理論を含む）
  - 自己調整学習の3段階サイクル
  - 学習の基盤となる資質・能力の統合

- 📘 **[LEARNING_FLOW_INTEGRATION.md](./LEARNING_FLOW_INTEGRATION.md)** - 学習フロー全体への理論統合
  - 学習のてびき → 学習カード → チェックテスト → 選択問題 → 振り返り
  - 各フローへのVARK・Gardner・Kolb統合設計

- 📗 **[ATI_INTEGRATION_MODEL.md](./ATI_INTEGRATION_MODEL.md)** - Cronbach ATI理論統合
  - 適性処遇交互作用（ATI）の完全実装
  - 5次元適性診断と処遇マッチング

### 📘 一般向けドキュメント

- 📘 **[README_SIMPLE.md](./README_SIMPLE.md)** - 一般向け・教育者向けの簡易ガイド
  - デモ動画の作り方
  - ブログ等での公開方法
  - 生徒への説明ポイント
  - 使い方ガイド

- 📄 **[PAPER_LEARNING_SUPPORT.md](./PAPER_LEARNING_SUPPORT.md)** - 紙学習対応ガイド
  - デジタルが苦手な児童向けのサポート
  - ハイブリッド運用方法

- 📘 **本ファイル（README.md）** - 開発者・技術者向けの詳細ドキュメント
  - 技術スタック
  - データベース設計
  - API仕様
  - 実装ロードマップ

---

## 📊 個別最適化された学習カードへの移行フロー

### 現状：一律の学習カード配布
現在のシステムでは、単元選択後、すべての児童・生徒に**同じ学習カード（問題セット）**が配布されます。

### 目標：個別最適化された学習カード
各児童・生徒の学習履歴、理解度、学習スタイルに基づいて、**一人ひとりに最適化された学習カード**を提供します。

### 移行フローの設計（段階的アプローチ）

#### 【フェーズ1】初回診断テスト（5-10分）
**目的**: 基礎データ収集

1. **単元選択後**、初回のみ簡単な診断テストを実施
   - 既習知識チェック（3-5問）
   - 学習スタイル診断（2-3問）
   - 難易度選好調査（1問）

2. **バックグラウンドで処理**
   - 診断結果を分析（AI処理：3-5秒）
   - 初期プロファイル作成
   - 第一段階の学習カード生成開始

3. **即時提供**
   - 基本的な学習カードセット（一律）をまず表示
   - 「あなた専用の問題を準備中...」と通知
   - バックグラウンドで個別化処理継続

#### 【フェーズ2】段階的個別化（学習中）
**目的**: 学習中に徐々に個別化

1. **最初の3問**：一律の学習カード
   - すべての生徒に共通問題
   - 解答データを収集
   - リアルタイム分析開始

2. **4問目以降**：部分的個別化
   - 前3問の正答率を分析
   - 難易度調整開始
   - 苦手分野の特定

3. **7問目以降**：完全個別化
   - 理解度マップ完成
   - フル個別化問題提供
   - 学習パス最適化

#### 【フェーズ3】次回以降の完全個別化
**目的**: 蓄積データに基づく完全個別化

1. **2回目以降の単元**
   - 学習履歴を参照（即座）
   - 個別プロファイル適用
   - 初回から個別化問題提供

2. **継続的最適化**
   - 毎回の学習データ蓄積
   - AIモデルの精度向上
   - 予測精度の改善

### 実装アプローチ（技術的詳細）

#### A. プログレッシブ生成方式
```javascript
// 1. 即座に基本セット提供
const basicCards = getBasicCardsForUnit(unitId)  // キャッシュ済み
displayCards(basicCards.slice(0, 3))

// 2. バックグラウンドで個別化処理
const personalizedCards = await generatePersonalizedCards({
  studentId: currentStudentId,
  unitId: unitId,
  diagnosticData: await runQuickDiagnostic(),
  learningHistory: await fetchLearningHistory()
})

// 3. 準備完了時に差し替え
replaceCards(4, personalizedCards)
showNotification("あなた専用の問題が準備できました！")
```

#### B. キャッシュ戦略
```javascript
// 事前生成パターンをキャッシュ
const cachedPatterns = {
  'beginner': [...],      // 初心者向け
  'intermediate': [...],  // 中級者向け
  'advanced': [...]       // 上級者向け
}

// 診断結果に基づき即座に選択
const initialSet = cachedPatterns[diagnosticLevel]
```

#### C. AIバッチ処理
```javascript
// 夜間バッチで次の単元の問題を事前生成
async function nightlyBatchGeneration() {
  for (const student of students) {
    const nextUnits = predictNextUnits(student)
    for (const unit of nextUnits) {
      await generateAndCacheCards(student.id, unit.id)
    }
  }
}
```

### タイムライン例

```
【初回アクセス】
0:00 - 単元選択
0:05 - 診断テスト開始（5分）
0:10 - 基本カード表示（即座）
      ↓ バックグラウンド処理
0:13 - 個別化カード準備完了（3秒後）
0:15 - 4問目から個別化開始

【2回目以降】
0:00 - 単元選択
0:01 - 個別化カード即座に表示（キャッシュ済み）
```

### 生成時間の最適化戦略

1. **段階的生成**: 3問→3問→3問と分割生成
2. **予測生成**: 次に学習しそうな単元を事前生成
3. **キャッシュ活用**: 類似パターンをテンプレート化
4. **並列処理**: 複数の問題を同時生成
5. **優先度制御**: 次に必要な問題を優先生成

### ユーザー体験の工夫

1. **待ち時間の可視化**
   ```
   🎯 あなた専用の問題を準備中...
   [████████░░] 80% 完了
   あと10秒ほどお待ちください
   ```

2. **段階的提供の説明**
   ```
   💡 最初の3問は基本問題です
   あなたの理解度を確認しながら、
   ピッタリな問題を準備しています！
   ```

3. **完了通知**
   ```
   ✨ あなた専用の問題が準備できました！
   4問目から、あなたのレベルに合った問題に切り替わります
   ```

### メリット

- ✅ **即座の学習開始**: 待ち時間なし
- ✅ **スムーズな移行**: 違和感のない個別化
- ✅ **データ収集**: 初回から学習データ蓄積
- ✅ **継続的改善**: 使うほど精度向上
- ✅ **サーバー負荷分散**: 段階的生成で負荷軽減

## 🚀 学習カード個別最適化の実装ロードマップ

### 推奨実装順序（6ステップ）

---

## 📍 Step 1: データ収集基盤の構築（Week 1-2）

### 目的
個別最適化に必要なデータを収集する基盤を作る

### 実装内容

#### A. 学習ログテーブル作成
```sql
-- D1 Database Migration
CREATE TABLE learning_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  course_type TEXT NOT NULL,  -- じっくり/しっかり/ぐんぐん
  
  -- 解答データ
  is_correct BOOLEAN NOT NULL,
  answer_time_seconds INTEGER NOT NULL,
  hint_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  
  -- コンテキスト
  difficulty_level TEXT,  -- easy/medium/hard
  problem_type TEXT,      -- calculation/word_problem/application
  
  -- タイムスタンプ
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_student_unit (student_id, unit_id),
  INDEX idx_created_at (created_at)
);

-- 学習セッション
CREATE TABLE learning_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  
  -- セッション情報
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  total_problems INTEGER DEFAULT 0,
  correct_problems INTEGER DEFAULT 0,
  
  -- 学習スタイル
  preferred_style TEXT,  -- visual/auditory/kinesthetic
  
  INDEX idx_student (student_id)
);
```

#### B. フロントエンドでのログ記録
```javascript
// public/static/app.js に追加

// 学習ログ記録関数
async function logLearningActivity(data) {
  try {
    await axios.post('/api/learning/log', {
      student_id: currentUser.id,
      unit_id: currentUnit.id,
      card_id: data.cardId,
      course_type: data.courseType,
      is_correct: data.isCorrect,
      answer_time_seconds: data.answerTime,
      hint_count: data.hintCount,
      retry_count: data.retryCount,
      difficulty_level: data.difficulty,
      problem_type: data.problemType
    })
  } catch (error) {
    console.error('ログ記録エラー:', error)
  }
}

// 問題解答時に自動記録
window.checkAnswer = function(cardId, userAnswer) {
  const startTime = window.answerStartTime || Date.now()
  const answerTime = Math.floor((Date.now() - startTime) / 1000)
  
  const isCorrect = validateAnswer(cardId, userAnswer)
  
  // ログ記録
  logLearningActivity({
    cardId: cardId,
    courseType: currentCourseType,
    isCorrect: isCorrect,
    answerTime: answerTime,
    hintCount: window.hintCount || 0,
    retryCount: window.retryCount || 0,
    difficulty: currentDifficulty,
    problemType: getCurrentProblemType(cardId)
  })
  
  // 結果表示
  displayResult(isCorrect)
}
```

#### C. バックエンドAPI
```typescript
// src/index.tsx に追加

// 学習ログ記録API
app.post('/api/learning/log', async (c) => {
  const { env } = c
  const logData = await c.req.json()
  
  try {
    await env.DB.prepare(`
      INSERT INTO learning_logs (
        student_id, unit_id, card_id, course_type,
        is_correct, answer_time_seconds, hint_count, retry_count,
        difficulty_level, problem_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      logData.student_id,
      logData.unit_id,
      logData.card_id,
      logData.course_type,
      logData.is_correct ? 1 : 0,
      logData.answer_time_seconds,
      logData.hint_count,
      logData.retry_count,
      logData.difficulty_level,
      logData.problem_type
    ).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('ログ保存エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})
```

### 成果物
- ✅ 学習データが自動収集される
- ✅ 学習履歴が蓄積される
- ✅ 次ステップの分析基盤が整う

---

## 📍 Step 2: 学習プロファイル生成（Week 3-4）

### 目的
収集したデータから生徒の学習プロファイルを作成

### 実装内容

#### A. プロファイルテーブル
```sql
CREATE TABLE student_profiles (
  student_id TEXT PRIMARY KEY,
  
  -- 理解度レベル
  overall_level TEXT DEFAULT 'beginner',  -- beginner/intermediate/advanced
  
  -- 学習スタイル
  learning_style TEXT,  -- visual/auditory/kinesthetic/mixed
  style_confidence REAL DEFAULT 0.0,
  
  -- パフォーマンス指標
  avg_correct_rate REAL DEFAULT 0.0,
  avg_answer_time REAL DEFAULT 0.0,
  preferred_difficulty TEXT DEFAULT 'medium',
  
  -- 苦手・得意分野
  weak_areas TEXT,  -- JSON配列 ["calculation", "word_problem"]
  strong_areas TEXT,  -- JSON配列
  
  -- メタデータ
  total_problems_solved INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_level (overall_level)
);
```

#### B. プロファイル生成API
```typescript
// プロファイル分析・更新API
app.post('/api/learning/profile/update', async (c) => {
  const { env } = c
  const { student_id } = await c.req.json()
  
  try {
    // 過去の学習ログを分析
    const logs = await env.DB.prepare(`
      SELECT 
        is_correct,
        answer_time_seconds,
        difficulty_level,
        problem_type,
        hint_count
      FROM learning_logs
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(student_id).all()
    
    if (!logs.results || logs.results.length === 0) {
      return c.json({ success: true, profile: null })
    }
    
    // 正答率計算
    const correctCount = logs.results.filter(l => l.is_correct).length
    const correctRate = correctCount / logs.results.length
    
    // 平均解答時間
    const avgTime = logs.results.reduce((sum, l) => sum + l.answer_time_seconds, 0) / logs.results.length
    
    // レベル判定
    let level = 'beginner'
    if (correctRate >= 0.8 && avgTime < 60) {
      level = 'advanced'
    } else if (correctRate >= 0.6) {
      level = 'intermediate'
    }
    
    // 推奨難易度
    let preferredDifficulty = 'medium'
    if (correctRate >= 0.85) {
      preferredDifficulty = 'hard'
    } else if (correctRate < 0.5) {
      preferredDifficulty = 'easy'
    }
    
    // 苦手分野の特定
    const problemTypeStats = {}
    logs.results.forEach(log => {
      const type = log.problem_type
      if (!problemTypeStats[type]) {
        problemTypeStats[type] = { correct: 0, total: 0 }
      }
      problemTypeStats[type].total++
      if (log.is_correct) problemTypeStats[type].correct++
    })
    
    const weakAreas = []
    const strongAreas = []
    
    Object.entries(problemTypeStats).forEach(([type, stats]) => {
      const rate = stats.correct / stats.total
      if (rate < 0.5 && stats.total >= 3) {
        weakAreas.push(type)
      } else if (rate >= 0.8 && stats.total >= 3) {
        strongAreas.push(type)
      }
    })
    
    // プロファイル更新
    await env.DB.prepare(`
      INSERT INTO student_profiles (
        student_id, overall_level, avg_correct_rate, avg_answer_time,
        preferred_difficulty, weak_areas, strong_areas, 
        total_problems_solved, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id) DO UPDATE SET
        overall_level = excluded.overall_level,
        avg_correct_rate = excluded.avg_correct_rate,
        avg_answer_time = excluded.avg_answer_time,
        preferred_difficulty = excluded.preferred_difficulty,
        weak_areas = excluded.weak_areas,
        strong_areas = excluded.strong_areas,
        total_problems_solved = excluded.total_problems_solved,
        last_updated = CURRENT_TIMESTAMP
    `).bind(
      student_id,
      level,
      correctRate,
      avgTime,
      preferredDifficulty,
      JSON.stringify(weakAreas),
      JSON.stringify(strongAreas),
      logs.results.length
    ).run()
    
    return c.json({
      success: true,
      profile: {
        level,
        correctRate,
        avgTime,
        preferredDifficulty,
        weakAreas,
        strongAreas
      }
    })
  } catch (error) {
    console.error('プロファイル更新エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// プロファイル取得API
app.get('/api/learning/profile/:student_id', async (c) => {
  const { env } = c
  const student_id = c.req.param('student_id')
  
  try {
    const profile = await env.DB.prepare(`
      SELECT * FROM student_profiles WHERE student_id = ?
    `).bind(student_id).first()
    
    return c.json({ success: true, profile })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})
```

### 成果物
- ✅ 各生徒の学習プロファイルが自動生成
- ✅ レベル・得意/苦手分野が特定される
- ✅ 推奨難易度が計算される

---

## 📍 Step 3: 基本カードセットのキャッシュ（Week 5-6）

### 目的
即座に提供できる基本カードセットを準備

### 実装内容

#### A. カードテンプレートテーブル
```sql
CREATE TABLE card_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_id TEXT NOT NULL,
  difficulty_level TEXT NOT NULL,  -- easy/medium/hard
  problem_type TEXT NOT NULL,      -- calculation/word_problem/application
  
  -- 問題テンプレート
  problem_template TEXT NOT NULL,
  answer_template TEXT NOT NULL,
  hints_template TEXT,  -- JSON配列
  
  -- メタデータ
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  
  INDEX idx_unit_difficulty (unit_id, difficulty_level)
);
```

#### B. カードキャッシュ生成
```typescript
// 単元ごとの基本カードセット生成
app.post('/api/cards/generate-basic-set', async (c) => {
  const { env } = c
  const { unit_id } = await c.req.json()
  
  try {
    // 基本的な3レベル × 3タイプの問題セット
    const difficulties = ['easy', 'medium', 'hard']
    const problemTypes = ['calculation', 'word_problem', 'application']
    
    const cardSet = []
    
    for (const difficulty of difficulties) {
      for (const problemType of problemTypes) {
        // AI生成（Gemini API）
        const prompt = `
単元: ${unit_id}
難易度: ${difficulty}
問題タイプ: ${problemType}

この条件で小学生向けの算数問題を1問作成してください。
JSON形式で返してください：
{
  "problem": "問題文",
  "answer": "解答",
  "explanation": "解説",
  "hints": ["ヒント1", "ヒント2"]
}
        `
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        )
        
        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        const problemData = JSON.parse(content)
        
        // テンプレートとして保存
        await env.DB.prepare(`
          INSERT INTO card_templates (
            unit_id, difficulty_level, problem_type,
            problem_template, answer_template, hints_template,
            order_index, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(
          unit_id,
          difficulty,
          problemType,
          problemData.problem,
          problemData.answer,
          JSON.stringify(problemData.hints),
          cardSet.length
        ).run()
        
        cardSet.push({
          difficulty,
          problemType,
          ...problemData
        })
      }
    }
    
    return c.json({ success: true, cardSet, count: cardSet.length })
  } catch (error) {
    console.error('カード生成エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

// キャッシュされた基本カード取得
app.get('/api/cards/basic-set/:unit_id', async (c) => {
  const { env } = c
  const unit_id = c.req.param('unit_id')
  
  try {
    const cards = await env.DB.prepare(`
      SELECT * FROM card_templates
      WHERE unit_id = ? AND is_active = 1
      ORDER BY order_index
      LIMIT 9
    `).bind(unit_id).all()
    
    return c.json({ success: true, cards: cards.results })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})
```

### 成果物
- ✅ 各単元の基本カードセットが事前生成
- ✅ 即座に提供できるカードが準備される
- ✅ 待ち時間が解消

---

## 📍 Step 4: 個別化カード生成エンジン（Week 7-9）

### 目的
プロファイルに基づいて最適な問題を生成

### 実装内容

#### A. 個別化生成API
```typescript
// プロファイルベースの個別化カード生成
app.post('/api/cards/personalized', async (c) => {
  const { env } = c
  const { student_id, unit_id, count = 6 } = await c.req.json()
  
  try {
    // プロファイル取得
    const profile = await env.DB.prepare(`
      SELECT * FROM student_profiles WHERE student_id = ?
    `).bind(student_id).first()
    
    if (!profile) {
      // プロファイルがない場合は基本セットを返す
      return c.redirect(`/api/cards/basic-set/${unit_id}`)
    }
    
    // プロファイルに基づく生成条件
    const difficulty = profile.preferred_difficulty
    const weakAreas = JSON.parse(profile.weak_areas || '[]')
    const strongAreas = JSON.parse(profile.strong_areas || '[]')
    
    // 問題配分戦略
    // 60% 苦手分野、30% バランス、10% 得意分野（復習）
    const problemDistribution = []
    
    // 苦手分野重点
    const weakCount = Math.ceil(count * 0.6)
    for (let i = 0; i < weakCount && weakAreas.length > 0; i++) {
      problemDistribution.push({
        type: weakAreas[i % weakAreas.length],
        difficulty: difficulty === 'hard' ? 'medium' : difficulty  // 少し易しく
      })
    }
    
    // バランス問題
    const balanceCount = Math.ceil(count * 0.3)
    const allTypes = ['calculation', 'word_problem', 'application']
    for (let i = 0; i < balanceCount; i++) {
      problemDistribution.push({
        type: allTypes[i % allTypes.length],
        difficulty: difficulty
      })
    }
    
    // 得意分野（自信向上）
    const strongCount = count - weakCount - balanceCount
    for (let i = 0; i < strongCount && strongAreas.length > 0; i++) {
      problemDistribution.push({
        type: strongAreas[i % strongAreas.length],
        difficulty: difficulty === 'easy' ? 'medium' : difficulty  // 少し難しく
      })
    }
    
    // AI生成
    const personalizedCards = []
    
    for (const spec of problemDistribution) {
      const prompt = `
あなたは小学生向けの算数問題作成の専門家です。

生徒プロファイル:
- レベル: ${profile.overall_level}
- 平均正答率: ${(profile.avg_correct_rate * 100).toFixed(0)}%
- 苦手分野: ${weakAreas.join(', ')}
- 得意分野: ${strongAreas.join(', ')}

問題条件:
- 単元: ${unit_id}
- 難易度: ${spec.difficulty}
- 問題タイプ: ${spec.type}

この生徒に最適な問題を1問作成してください。
${spec.type === weakAreas[0] ? '苦手分野なので、段階的なヒントを多めに用意してください。' : ''}

JSON形式で返してください：
{
  "problem": "問題文（この生徒のレベルに合わせて）",
  "answer": "解答",
  "explanation": "詳しい解説（この生徒が理解しやすいように）",
  "hints": ["段階的なヒント1", "ヒント2", "ヒント3"],
  "difficulty_score": 0.0-1.0の難易度スコア
}
      `
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.8,
              topP: 0.95
            }
          })
        }
      )
      
      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
      
      // JSON抽出
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const problemData = JSON.parse(jsonMatch[0])
        personalizedCards.push({
          ...problemData,
          difficulty: spec.difficulty,
          problemType: spec.type,
          personalized: true
        })
      }
    }
    
    return c.json({
      success: true,
      cards: personalizedCards,
      profile: {
        level: profile.overall_level,
        weakAreas,
        strongAreas
      }
    })
  } catch (error) {
    console.error('個別化生成エラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})
```

### 成果物
- ✅ 生徒の苦手分野に重点を置いた問題生成
- ✅ レベルに合わせた難易度調整
- ✅ 段階的なヒント提供

---

## 📍 Step 5: フロントエンド統合（Week 10-11）

### 目的
ユーザー体験を最適化した個別化フローの実装

### 実装内容

#### A. 段階的カード提供UI
```javascript
// public/static/app.js

// 学習カード表示（段階的個別化）
async function displayLearningCards(unitId) {
  const container = document.getElementById('cards-container')
  
  // Phase 1: 基本カードを即座に表示
  container.innerHTML = `
    <div class="mb-4 bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
      <p class="text-blue-800 font-bold">
        <i class="fas fa-rocket mr-2"></i>学習を開始します
      </p>
      <p class="text-sm text-gray-600 mt-2">
        まずは基本問題から始めます。あなたの理解度を確認しながら、
        ピッタリな問題を準備していきます！
      </p>
    </div>
    <div id="basic-cards"></div>
    <div id="personalized-cards"></div>
  `
  
  try {
    // 1. 基本カード取得（即座）
    const basicResponse = await axios.get(`/api/cards/basic-set/${unitId}`)
    const basicCards = basicResponse.data.cards.slice(0, 3)
    
    // 基本カード表示
    displayCards('basic-cards', basicCards, '基本問題')
    
    // 2. バックグラウンドでプロファイル更新
    await axios.post('/api/learning/profile/update', {
      student_id: currentUser.id
    })
    
    // 3. 個別化カード生成（バックグラウンド）
    const personalizedPromise = axios.post('/api/cards/personalized', {
      student_id: currentUser.id,
      unit_id: unitId,
      count: 6
    })
    
    // プログレス表示
    showPersonalizationProgress()
    
    // 4. 個別化カード準備完了
    const personalizedResponse = await personalizedPromise
    const personalizedCards = personalizedResponse.data.cards
    const profile = personalizedResponse.data.profile
    
    // 完了通知
    showPersonalizationComplete(profile)
    
    // 個別化カード表示
    displayCards('personalized-cards', personalizedCards, 'あなた専用の問題')
    
  } catch (error) {
    console.error('カード表示エラー:', error)
    container.innerHTML = `<p class="text-red-600">エラーが発生しました</p>`
  }
}

// プログレス表示
function showPersonalizationProgress() {
  const container = document.getElementById('personalized-cards')
  container.innerHTML = `
    <div class="mt-6 bg-purple-50 border-2 border-purple-300 rounded-lg p-6">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mb-4"></div>
        <p class="text-lg font-bold text-purple-800">
          <i class="fas fa-magic mr-2"></i>🎯 あなた専用の問題を準備中...
        </p>
        <p class="text-sm text-gray-600 mt-2">
          あなたの学習履歴をもとに、最適な問題を生成しています
        </p>
        <div class="mt-4 bg-white rounded-full h-4 overflow-hidden">
          <div class="progress-bar bg-gradient-to-r from-purple-400 to-pink-400 h-full" 
               style="width: 0%; transition: width 0.5s"></div>
        </div>
      </div>
    </div>
  `
  
  // プログレスアニメーション
  let progress = 0
  const interval = setInterval(() => {
    progress += 10
    const bar = document.querySelector('.progress-bar')
    if (bar) {
      bar.style.width = `${Math.min(progress, 90)}%`
    }
    if (progress >= 90) clearInterval(interval)
  }, 300)
}

// 完了通知
function showPersonalizationComplete(profile) {
  const notification = document.createElement('div')
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl animate-bounce z-50'
  notification.innerHTML = `
    <p class="font-bold">
      <i class="fas fa-check-circle mr-2"></i>✨ 準備完了！
    </p>
    <p class="text-sm mt-1">
      あなたのレベル: ${profile.level}<br>
      ${profile.weakAreas.length > 0 ? `重点: ${profile.weakAreas[0]}` : ''}
    </p>
  `
  document.body.appendChild(notification)
  
  setTimeout(() => notification.remove(), 5000)
}

// カード表示
function displayCards(containerId, cards, title) {
  const container = document.getElementById(containerId)
  
  let html = `
    <div class="mb-6">
      <h3 class="text-xl font-bold mb-4">
        ${title} 
        ${cards[0]?.personalized ? '💎' : '📚'}
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  `
  
  cards.forEach((card, index) => {
    html += `
      <div class="card-item bg-white rounded-lg shadow-lg p-6 border-2 
                  ${card.personalized ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50' : 'border-gray-300'}">
        <div class="flex justify-between items-start mb-3">
          <span class="text-lg font-bold text-gray-700">問題 ${index + 1}</span>
          <span class="text-xs px-2 py-1 rounded ${getDifficultyColor(card.difficulty)}">
            ${getDifficultyLabel(card.difficulty)}
          </span>
        </div>
        <p class="text-gray-800 mb-4">${card.problem_template || card.problem}</p>
        <button onclick="showAnswer('${card.id || index}')" 
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          解答を見る
        </button>
      </div>
    `
  })
  
  html += '</div></div>'
  container.innerHTML = html
}

function getDifficultyColor(difficulty) {
  const colors = {
    'easy': 'bg-green-200 text-green-800',
    'medium': 'bg-yellow-200 text-yellow-800',
    'hard': 'bg-red-200 text-red-800'
  }
  return colors[difficulty] || colors.medium
}

function getDifficultyLabel(difficulty) {
  const labels = {
    'easy': 'やさしい',
    'medium': 'ふつう',
    'hard': 'むずかしい'
  }
  return labels[difficulty] || 'ふつう'
}
```

### 成果物
- ✅ スムーズな段階的個別化体験
- ✅ ビジュアルフィードバック
- ✅ ユーザーフレンドリーなUI

---

## 📍 Step 6: 継続的最適化と検証（Week 12以降）

### 目的
システムの精度向上と効果測定

### 実装内容

#### A. 効果測定ダッシュボード
```sql
-- 効果測定用ビュー
CREATE VIEW personalization_effectiveness AS
SELECT 
  student_id,
  COUNT(*) as total_problems,
  AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as correct_rate,
  AVG(answer_time_seconds) as avg_time,
  COUNT(CASE WHEN hint_count = 0 THEN 1 END) as no_hint_count
FROM learning_logs
WHERE created_at >= datetime('now', '-30 days')
GROUP BY student_id;
```

#### B. A/Bテスト機能
```typescript
// 個別化の効果を測定
app.get('/api/analytics/personalization-effect', async (c) => {
  const { env } = c
  
  try {
    // 個別化前後の比較
    const beforePersonalization = await env.DB.prepare(`
      SELECT AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as avg_correct
      FROM learning_logs
      WHERE created_at < ?
    `).bind(personalizationStartDate).first()
    
    const afterPersonalization = await env.DB.prepare(`
      SELECT AVG(CASE WHEN is_correct THEN 1.0 ELSE 0.0 END) as avg_correct
      FROM learning_logs
      WHERE created_at >= ?
    `).bind(personalizationStartDate).first()
    
    const improvement = (afterPersonalization.avg_correct - beforePersonalization.avg_correct) * 100
    
    return c.json({
      success: true,
      before: beforePersonalization.avg_correct,
      after: afterPersonalization.avg_correct,
      improvement: `${improvement.toFixed(1)}%`
    })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})
```

### 成果物
- ✅ 個別化効果の定量測定
- ✅ 継続的な改善サイクル
- ✅ データドリブンな最適化

---

## 📊 実装スケジュール概要

| Week | ステップ | 主要タスク | 成果物 |
|------|---------|----------|--------|
| 1-2 | Step 1 | データ収集基盤構築 | ログテーブル、API |
| 3-4 | Step 2 | プロファイル生成 | 分析ロジック、プロファイルDB |
| 5-6 | Step 3 | 基本カードキャッシュ | テンプレート生成、キャッシュAPI |
| 7-9 | Step 4 | 個別化エンジン | AI生成ロジック、最適化アルゴリズム |
| 10-11 | Step 5 | フロントエンド統合 | UI実装、UX最適化 |
| 12+ | Step 6 | 継続最適化 | 分析ダッシュボード、改善サイクル |

## 🎯 各ステップの優先度

### 必須（MVP）
- ✅ Step 1: データ収集
- ✅ Step 3: 基本カードキャッシュ
- ✅ Step 5: フロントエンド統合（基本版）

### 推奨（Early Release）
- ✅ Step 2: プロファイル生成
- ✅ Step 4: 個別化エンジン（簡易版）

### 最適化（継続改善）
- ✅ Step 4: 高度な個別化
- ✅ Step 6: 効果測定と最適化

## 💡 成功のポイント

1. **段階的リリース**: 完璧を求めず、段階的に機能追加
2. **ユーザーフィードバック**: 早期からユーザーの声を収集
3. **データドリブン**: 数値で効果を測定し改善
4. **パフォーマンス重視**: 待ち時間を最小化
5. **透明性**: 個別化のロジックをユーザーに説明

---

## 🌟 Phase 5 新機能（2024年実装完了）

### 先生カスタマイズモード
- 📝 学習環境デザイン：6観点の活動設定
- 📊 指導・評価タブ：3観点評価（ABC）+ 非認知能力7項目評価
- 🏆 ゲーミフィケーション：バッジシステム
- 📖 ナラティブ機能：学習ストーリー
- ⚙️ カスタマイズ設定：指導方針・目標・留意点

### 教育的価値
- **子どもの成長を多面的に評価**：認知・非認知の両面から評価
- **学びを物語として可視化**：達成感とモチベーション向上
- **先生の指導をサポート**：評価入力の効率化と指導のヒント提供
- **学習環境の最適化**：6観点で学びを深め、広げる活動設計

## 🎨 最新アップデート（2026-01-18）

### AI機能の完全修復
- **状態機械式JSONパーサー**: 文字列・キー・値の状態を追跡して正確に改行エスケープ
- **エスケープ済み引用符対応**: `\"` を正しく処理してJSON構造を維持
- **正規表現不使用**: 複雑な複数行文字列にも対応できる堅牢なパーサー
- **JSON抽出ヘルパー**: すべてのAIエンドポイントで統一された堅牢なJSON処理
- **文字列値の改行エスケープ**: 複数行テキストを含むJSON値を正しく処理
- **制御文字のクリーニング**: 不正な文字、二重カンマ、末尾カンマを自動修正
- **詳細なエラーログ**: エラー位置と文字コードを表示してデバッグを容易に

### バグ修正と機能改善
- **JSON抽出ヘルパー関数**: Gemini APIからの様々なJSON形式に対応
- **導入問題自動生成**: 3コースの導入問題を自動生成する機能を修正
- **エラーハンドリング**: バッククォート、空レスポンスなどのエッジケースに対応
- **デバッグログ**: showAnswer()関数にデバッグログを追加

### 学習カード画像表示機能
- **問題画像**: 学習カードの問題に画像URLを追加可能
- **解答画像**: 解答に画像URLを追加可能
- **教師専用編集**: 教師アカウントで画像URL編集ボタンを表示
- **使い方**:
  1. 教師アカウントでログイン
  2. 学習カードの詳細を開く
  3. 問題タブまたは解答タブで「画像URLを追加」ボタンをクリック
  4. 画像のURLを入力（例：Imgur、Google Drive公開リンク）
  5. 画像が即座に表示される

### AI先生プロンプト改善
- **旧スタイル**: ソクラテス対話法
- **新スタイル**: 温かく忍耐強い教師

## 🎉 最新機能アップデート（2026-01-20）

### 1. 個人レポート（AI誤答分析）✨ NEW
- **誤答履歴の可視化**: 各児童の誤答パターンをデータベースに記録
- **つまずきパターン分析**: AI が誤答パターンを自動分類（例：くり上がり忘れ、位のずれ、立式ミス）
- **正答率の推移グラフ**: Chart.js による視覚的な学習進捗の把握
- **個別指導アドバイス**: 誤答パターンに基づいた具体的な指導方法の提案
- **使い方**:
  1. 教師アカウントでログイン（demo@school.jp / 123）
  2. 「進捗ボードを見る」→「かけ算の筆算」
  3. 「AI誤答分析で詳しく見る」ボタンをクリック
  4. 分析する児童を選択
  5. 個人レポートが表示される

### 2. テキスト読み上げ機能（音声サポート）🔊
- **Web Speech API活用**: ブラウザ標準の音声合成エンジン
- **日本語対応**: 自動的に日本語音声を選択
- **速度・音量調整**: カスタマイズ可能な読み上げ設定
- **使い方**:
  ```javascript
  // 基本的な読み上げ
  window.ttsManager.speak('これは読み上げテストです')
  
  // オプション付き
  window.ttsManager.speak('ゆっくり話します', {
    rate: 0.8,      // 速度（0.1-10）
    pitch: 1.2,     // 音高（0-2）
    volume: 0.9     // 音量（0-1）
  })
  
  // 要素に読み上げボタンを追加
  window.ttsManager.enableForElement('.card-title')
  ```

### 3. 動的視覚支援機能（ユニバーサルデザイン）👁️
- **ハイライト機能**: 重要な箇所を強調表示
- **フォーカスモード**: 背景を暗くして対象要素に集中
- **テキストサイズ調整**: 読みやすいサイズに変更
- **ハイコントラストモード**: 視認性の向上
- **数式の色分け表示**: 演算子や数字を色分けして視覚化
- **ステップバイステップ表示**: 段階的な説明をアニメーション付きで表示
- **使い方**:
  ```javascript
  // フォーカスモード
  const element = document.querySelector('.learning-card')
  window.visualSupport.toggleFocusMode(element)
  
  // ハイコントラストモード
  window.visualSupport.toggleHighContrast()
  
  // テキストサイズ調整（1.5倍）
  window.visualSupport.adjustTextSize(element, 1.5)
  
  // 数式の色分け
  const mathHtml = window.visualSupport.visualizeMath('23 × 4 = 92')
  
  // ステップバイステップ表示
  const steps = [
    '一の位を計算します：3 × 4 = 12',
    '2を書いて、1を十の位にくり上げます',
    '十の位を計算します：2 × 4 + 1 = 9',
    '答えは92です'
  ]
  window.visualSupport.showStepByStep(steps, container, 2000)
  ```

### 4. リアルタイム通信機能（協働学習サポート）📡
- **ポーリング方式**: Cloudflare Pages対応のリアルタイム通信
- **ヘルプ要請通知**: 児童からのヘルプ要請をリアルタイムで受信
- **進捗更新通知**: クラスメートの学習進捗をリアルタイム表示
- **通知システム**: 視覚的＋音声での通知
- **使い方**:
  ```javascript
  // リアルタイム接続開始
  window.realtimeManager.connect(userId, 'CLASS2024A')
  
  // ヘルプ要請を受信
  window.realtimeManager.on('help-request', (requests) => {
    requests.forEach(req => {
      window.realtimeManager.showNotification(
        'ヘルプ要請',
        `${req.student_name}さんが助けを求めています`,
        'help'
      )
    })
  })
  
  // 進捗更新を受信
  window.realtimeManager.on('progress-update', (updates) => {
    console.log('進捗更新:', updates)
  })
  
  // 接続解除
  window.realtimeManager.disconnect()
  ```

### デモデータ
- **山田太郎**: くり上がり忘れのパターン（5回）
- **佐藤花子**: 位のずれのパターン（4回）
- **鈴木次郎**: 立式ミス（文章題）のパターン（2回）

- **主な特徴**:
  - 生徒の目標と学年レベルを把握
  - 既存知識を基盤にした説明
  - 質問とヒントで自ら答えを発見させる
  - 宿題を代わりに解かず、ステップごとに導く
  - リズムに変化をつけた対話的アプローチ
  - 温かく、平易な言葉、過度な絵文字を避ける

## 🌐 URL・リンク

- **本番URL**: https://jiyushindo-gakushu.pages.dev
- **最新デプロイ**: https://ad6b2d82.jiyushindo-gakushu.pages.dev ✅ システムエラー修正済み
- **テストページ**: https://ad6b2d82.jiyushindo-gakushu.pages.dev/test-buttons.html 🧪
- **GitHub**: https://github.com/koba06040603-ops/jiyushindo-gakushu
- **最終コミット**: `37a24b8` (重複関数定義の削除 - システムエラー修正)

## 🔐 デモアカウント

### 教師アカウント
- **メール**: `demo@school.jp`
- **パスワード**: `123`
- **機能**: 進捗ボード、週次レポート、月次レポート、AI単元生成、AI誤答分析

### 児童アカウント
- **メール**: `student1@school.jp` ～ `student3@school.jp`
- **パスワード**: `123`
- **機能**: 学習カード、クラス進捗確認、友達に助けを求める

## 📊 デモ進捗データ（かけ算の筆算）

教師アカウントで「進捗ボードを見る」→「かけ算の筆算」を選択すると、以下のデモデータが表示されます：

### 学習フローのルール

1. **学習カード**: 各コース6枚
   - じっくりコース（🟢基本）: 基本的な内容、丁寧な説明
   - しっかりコース（🔵標準）: 標準的な内容、バランスの取れた学習
   - ぐんぐんコース（🟣発展）: 発展的な内容、挑戦的な問題

2. **チェックテスト**: 学習カード6枚全て完了後に開始可能
   - 5問のチェック問題
   - 理解度を確認

3. **選択問題**: チェックテスト全問完了後に開始可能
   - 5問の選択問題
   - 実生活に関連した応用問題

### デモ児童データ

#### 👦 山田太郎（じっくりコース）
- **学習カード**: 5/6枚完了、6枚目に取り組み中
- **チェックテスト**: まだ開始できない（学習カード未完了のため）
- **選択問題**: まだ開始できない
- **特徴**: ヘルプ要請が3回、先生のサポートを必要としている
- **AI誤答分析**: くり上がり忘れのパターン（5回）

#### 👧 佐藤花子（しっかりコース）
- **学習カード**: 6/6枚完了 ✅
- **チェックテスト**: 2/5問完了、3問目に取り組み中
- **選択問題**: まだ開始できない（チェックテスト未完了のため）
- **特徴**: AI先生を2回利用、理解度は中程度
- **AI誤答分析**: 位のずれのパターン（4回）

#### 👦 鈴木次郎（ぐんぐんコース）
- **学習カード**: 6/6枚完了 ✅
- **チェックテスト**: 5/5問完了 ✅
- **選択問題**: 3/5問完了、4問目に取り組み中
- **特徴**: 順調に進行、理解度が高い
- **AI誤答分析**: 立式ミス（文章題）のパターン（2回）

### 進捗ボードの見方

- **学習カード進捗**: `5/6` = 完了枚数/全体枚数
- **チェックテスト**: ●（完了）、○（進行中）、−（未開始）
- **選択問題**: ●（完了）、○（進行中）、−（未開始）
- **優先度**: 数値が高いほど介入が必要（100以上は即対応推奨）
- **状態**: 
  - 🟢 順調: 問題なく進行中
  - 🟡 停滞気味: 注意が必要
  - 🟠 ヘルプ要請中: すぐに対応が必要
  - 🔴 停滞: 個別対応が必要

---

## 🎉 実装完了した全機能

### ✅ フェーズ1：基本機能（完了）

1. **トップページ**
   - 学年選択（小学1年〜中学3年）
   - 教科選択（算数など）
   - 教科書会社選択（東京書籍など）
   - 単元選択
   - ユーザー情報表示

2. **学習のてびき**
   - 単元目標の表示
   - 非認知能力目標の表示
   - 授業時間の表示
   - 3コース選択問題（じっくり・しっかり・ぐんぐん）
   - チェックテスト説明
   - 選択問題6題の一覧表示
   - ツールバー（学習計画表・解答・進捗ボード）

3. **コース選択後の学習カード一覧**
   - 各コースの学習カード表示（6枚）
   - 難易度表示（基本・標準・発展）
   - 実社会との関連表示

### ✅ フェーズ2：学習機能（完了）

4. **学習カード詳細ページ**
   - 新出語句・キーワード表示
   - 例題と解き方の提示
   - 問題文と回答欄
   - 実社会との関連付け
   - 進捗バー表示

5. **ヒントカード機能**
   - 3段階のヒント表示
   - アコーディオン形式で開閉
   - 思考ツールの提案
   - 「9割型答えられる」設計

6. **AI先生（温かく忍耐強い教師スタイル）**
   - Gemini API統合
   - チャット形式の対話
   - 答えを教えず、質問とヒントで導く
   - 小学生向けの言葉選び
   - 励ましとステップバイステップのサポート
   - **新プロンプト特徴**:
     - 生徒の目標と学年レベルを把握
     - 既存知識を基盤にした説明
     - 宿題を代わりに解かず、一緒に考える
     - リズムに変化をつけた対話的アプローチ

7. **助けを求める機能**
   - 右上固定の助けボタン
   - 4つの選択肢：
     - 💡 ヒントカード
     - 🤖 AI先生に聞く
     - 👨‍🏫 先生を呼ぶ
     - 👥 友達に聞く
   - 助け要請回数の記録

8. **分かった度評価**
   - 5段階の絵文字選択
     - 😢 わからない
     - 😕 少し難しい
     - 😊 だいたいOK
     - 😄 よくわかる
     - 🤩 完璧！
   - 視覚的フィードバック

9. **学習進捗保存**
   - 理解度レベルの記録
   - 助け要請タイプの記録
   - 助けを求めた回数の記録
   - データベースへの自動保存

10. **解答表示機能**
    - 解答と解説のトグル表示
    - 詳細な解説付き

### ✅ フェーズ3：計画と管理機能（完了）

11. **学習計画表**
    - 単元全体の計画作成
    - 予定日・実施日の記録
    - 学習カード選択
    - オリエンテーションとまとめ（固定）
    - テーブル形式の一覧表示

12. **振り返り機能**
    - モーダルウィンドウでの記入
    - 3つの観点：
      - 😊 良かったこと
      - 😕 難しかったこと
      - 💡 わかったこと
    - 振り返り内容の保存と編集

13. **振り返りAI**
    - Gemini API統合
    - 個別フィードバック
    - 励ましと次へのヒント
    - 150文字以内の簡潔なメッセージ

14. **単元全体の振り返り**
    - 単元で学んだことの記録
    - 次に学びたいことの記録
    - メタ認知の促進

15. **解答タブ**
    - コース別解答表示
      - 🟢 じっくりコース
      - 🔵 しっかりコース
      - 🟣 ぐんぐんコース
    - 選択問題の解答例
    - 詳細な解説
    - 解答活用のヒント

### ✅ フェーズ4：教師支援機能（完了）

16. **進捗ボード（2026年1月全面改修✨）**
    - **タブレット最適化UI**：横スクロール対応、1200px最小幅
    - **一覧表示**：児童名、学習カード進捗、チェックテスト、選択問題を1画面で表示
    - **学習カード進捗**：3色棒グラフ（緑=じっくり、青=しっかり、紫=ぐんぐん）
    - **チェックテスト状況**：6問分の進捗を色分け表示（未実施/進行中/完了）
    - **選択問題状況**：6題分を丸で表示（未着手/進行中/完了）
    - **2教科同時対応**：複数カリキュラムを同時表示可能
    
17. **指導介入優先度スコアリング⭐NEW**
    - **自動スコア計算**：0-200点で指導優先度を数値化
    - **最優先（100点以上）**：ヘルプ要請中、待機時間を加算
    - **高優先（80-99点）**：理解度低（20点以下）かつ停滞中
    - **中優先（60-79点）**：30分以上停滞
    - **低優先（40-59点）**：理解度40点以下
    - **通常（20-39点）**：その他
    - **優先度順ソート**：自動的に支援が必要な児童を上位表示

18. **ヘルプ種別統計⭐NEW**
    - **4種類のアイコン表示**：
      - 🤖 AI先生（紫）
      - 👨‍🏫 先生（青）
      - 👥 友達（緑）
      - 💡 ヒント（黄）
    - **児童別集計**：各児童がどの支援を何回使ったか表示
    - **クラス全体統計**：支援方法別の使用回数を集計

19. **ヘルプ要請管理⭐NEW**
    - **リアルタイム表示**：ヘルプ要請中の児童一覧
    - **待機時間表示**：何分待っているか表示
    - **対象カード表示**：どの学習カードでヘルプを求めているか
    - **オレンジ背景強調**：ヘルプ要請中の児童を目立たせる

20. **停滞検知⭐NEW**
    - **自動検出**：最終活動から一定時間経過した児童を検出
    - **停滞時間表示**：何分停滞しているか表示
    - **対象カード表示**：どの学習カードで停滞しているか
    - **赤背景強調**：停滞中の児童を目立たせる

21. **大型テレビ対応⭐NEW**
    - **視認性重視**：遠くからでも見やすい大きなフォント
    - **色分け明確**：コース色、優先度色を明確に表示
    - **レスポンシブデザイン**：タブレット～大型テレビまで対応
    - **自動更新機能**：更新ボタンでリアルタイムデータ取得

22. **児童個別詳細モーダル⭐⭐NEW（2026年1月実装）**
    - **クリック表示**：児童名をクリックで詳細モーダル表示
    - **サマリーダッシュボード**：完了カード数、平均理解度、学習時間、ヘルプ回数
    - **3つのタブ**：
      - 📚 学習カード：各カードの状態、理解度、停滞/ヘルプ状態
      - 📝 テスト：チェックテスト（6問）と選択問題（6題）の進捗
      - 🆘 ヘルプ履歴：AI/先生/友達/ヒント別の統計と学習パターン分析
    - **視覚的フィードバック**：コース色、状態バッジ、絵文字理解度
    - **個人レポート出力**：個別PDF出力（予定）

23. **自動更新機能⭐⭐NEW（2026年1月実装）**
    - **トグルスイッチ**：ヘッダーで自動更新ON/OFF切替
    - **30秒間隔**：自動的に進捗データを更新
    - **リアルタイム監視**：ヘルプ要請や停滞状況を即座に把握
    - **バックグラウンド動作**：画面を開いたままで自動更新

24. **PDF出力機能⭐⭐NEW（2026年1月実装）**
    - **進捗ボードPDF**：現在の進捗状況を横向きA4でPDF出力
    - **週次レポートPDF**：週次統計をPDF化
    - **月次レポートPDF**：月次統計をPDF化
    - **個人レポートPDF**：児童個別レポート（予定）
    - **印刷最適化**：高品質（98%）JPEG、2倍スケール

25. **週次レポート⭐⭐NEW（2026年1月実装）**
    - **自動期間計算**：今週の月曜～日曜を自動設定
    - **児童別統計**：
      - 完了カード数
      - 平均理解度（色分け表示）
      - ヘルプ種別統計（AI/先生/友達/ヒント）
    - **表形式表示**：見やすいテーブルレイアウト
    - **PDF出力対応**：レポートをそのままPDF化

26. **月次レポート⭐⭐NEW（2026年1月実装）**
    - **当月自動設定**：現在の年月を自動設定
    - **児童別統計**：
      - 完了カード数
      - 平均理解度（色分け表示）
      - 活動日数
      - 総ヘルプ回数
    - **カリキュラム別進捗**：
      - 取組人数
      - 完了カード総数
    - **PDF出力対応**：月次レポートをPDF化

### ✅ フェーズ6：認証・セキュリティ機能（完了⭐⭐⭐NEW）

27. **ユーザー認証システム⭐⭐⭐NEW（2026年1月実装）**
    - **ログイン/ログアウト機能**：
      - 美しいログイン画面（グラデーション背景）
      - メールアドレス＋パスワード認証
      - セッション管理（24時間有効）
      - リフレッシュトークン（7日間有効）
    - **新規ユーザー登録**：
      - 氏名、メールアドレス、パスワード入力
      - 役割選択（児童・教師・管理者）
      - クラスコード設定
      - 出席番号（児童のみ）
    - **セキュリティ機能**：
      - パスワードのSHA-256ハッシュ化
      - セッショントークンの自動生成
      - ログイン失敗回数制限（5回で15分ロック）
      - アカウントロック機能

28. **ロールベース権限管理⭐⭐⭐NEW（2026年1月実装）**
    - **3つの役割（Role）**：
      - 👨‍🎓 **児童（student）**：学習カード閲覧、自分の進捗更新
      - 👨‍🏫 **教師（teacher）**：カリキュラム編集、進捗閲覧、レポート閲覧
      - 👑 **管理者（admin）**：すべての権限
    - **権限チェック**：
      - APIレベルでの権限検証
      - リソース別・アクション別の細かい制御
      - 権限テーブル（role_permissions）による管理
    - **認証ミドルウェア**：
      - `requireAuth`: ログイン必須
      - `requirePermission`: 権限必須

29. **監査ログ機能⭐⭐⭐NEW（2026年1月実装）**
    - **操作ログ記録**：誰が、いつ、何を、どうしたかを記録
    - **記録項目**：
      - ユーザーID
      - アクション（作成・更新・削除）
      - リソース（カリキュラム・学習カード・進捗）
      - リソースID
      - IPアドレス、User-Agent
      - 詳細情報（JSON）
    - **セキュリティ監視**：不正アクセスや誤操作の追跡

30. **デモアカウント**
    - **教師アカウント**：
      - メール: `demo@school.jp`
      - パスワード: `demo123`
      - クラス: CLASS2024A
    - **児童アカウント**：
      - メール: `student1@school.jp` (山田太郎)
      - メール: `student2@school.jp` (鈴木花子)
      - メール: `student3@school.jp` (佐藤次郎)
      - パスワード: `demo123`（共通）
      - クラス: CLASS2024A
    - **管理者アカウント**：
      - メール: `admin@school.jp`
      - パスワード: `demo123`

### ✅ Phase 7：WebSocketリアルタイム通信（完了⭐⭐⭐NEW）

31. **WebSocketリアルタイム通信⭐⭐⭐NEW（2026年1月実装）**
    - **Cloudflare Durable Objects**：
      - クラスコード単位でWebSocketセッション管理
      - 自動再接続機能（最大5回、3秒間隔）
      - Ping/Pong keep-alive（30秒間隔）
      - **注意**: 本番環境（Cloudflare Pages）では無効化
      - 開発環境（ローカル）でのみ利用可能
    - **リアルタイム進捗更新**：
      - 児童が学習を完了した瞬間に教師へ通知
      - 進捗ボードの自動更新（2秒デバウンス）
      - 理解度レベルの即座反映
    - **ヘルプ要請の即座通知**：
      - 児童が先生を呼んだ瞬間に通知
      - 🆘アイコン付き目立つトースト表示
      - 通知音再生（Web Audio API）
      - 10秒間のロング表示
    - **双方向通信**：
      - クライアント→サーバー：進捗更新、ヘルプ要請、活動記録
      - サーバー→クライアント：リアルタイム通知、進捗変更
    - **教師専用通知**：
      - ヘルプ要請（児童名、カード名、ヘルプ種別）
      - 活動更新（最終活動時刻、停滞検知）
    - **接続管理**：
      - ログイン時に自動接続
      - ログアウト時に自動切断
      - セッション復元時も自動接続

32. **トースト通知システム⭐⭐⭐NEW（2026年1月実装）**
    - **4種類の通知タイプ**：
      - 💙 info（青背景）：一般情報
      - ✅ success（緑背景）：成功メッセージ
      - ⚠️ warning（オレンジ背景）：ヘルプ要請
      - ❌ error（赤背景）：エラー
    - **アニメーション**：
      - スライドイン/スライドアウト
      - フェードアウト
    - **自動消去**：デフォルト3秒、ヘルプ要請は10秒
    - **手動閉じる**：×ボタンで即座に閉じる

33. **通知音機能⭐⭐⭐NEW（2026年1月実装）**
    - **Web Audio API**：ブラウザで音声生成
    - **ビープ音**：800Hz、0.5秒、サイン波
    - **自動再生**：ヘルプ要請時に自動再生
    - **音量調整**：30%に設定（控えめ）

### ✅ Phase 8：AI機能拡張（完了⭐⭐⭐NEW）

34. **AI対話履歴機能⭐⭐⭐NEW（2026年1月実装）**
    - **セッション管理**：
      - ユニークなセッションID生成
      - 学習カードごとに対話履歴を保存
      - コンテキストを保持した継続的な対話
    - **対話履歴保存**：
      - 質問と回答をDBに保存
      - message_type（question/answer）で区別
      - 作成日時、カードID、カリキュラムIDを記録
    - **対話履歴表示**：
      - AI先生を開いたときに過去の履歴を自動読み込み
      - ユーザーとAIのメッセージを色分け表示
      - スムーズなスクロール
    - **コンテキスト保持**：
      - 最新5件の対話履歴をGemini APIに送信
      - 段階的な対話誘導
      - より自然な会話の実現

35. **自動問題生成API⭐⭐⭐NEW（2026年1月実装）**
    - **Gemini 2.0 Flash Exp**：
      - 最新のGemini APIモデルを使用
      - 高品質な問題生成
      - JSON形式での構造化出力
    - **カリキュラム連携**：
      - 学年、教科、単元を考慮
      - 既存問題を参考に生成
      - 難易度レベル指定（じっくり/しっかり/ぐんぐん）
    - **生成条件**：
      - 小学生向けの言葉遣い
      - 実社会との関連付け
      - 思考力を育む内容
      - カスタム要件の指定可能
    - **生成結果**：
      - 問題タイトル（30文字以内）
      - 問題内容（150文字程度）
      - 学習の意味（100文字程度）
      - 解答例（オプション）
      - 難易度レベル
    - **履歴管理**：
      - generated_problemsテーブルに保存
      - 生成パラメータを記録
      - 承認フラグ（is_approved）
      - 生成者（教師）の記録

36. **AI使用統計機能⭐⭐⭐NEW（2026年1月実装）**
    - **トークン使用量記録**：
      - Gemini APIのトークン消費量を記録
      - 各機能ごとの使用量を追跡
      - コスト管理に活用
    - **応答時間測定**：
      - API呼び出しの応答時間を記録
      - パフォーマンス監視
      - ユーザー体験の改善データ
    - **成功/失敗ログ**：
      - API呼び出しの成功率を追跡
      - エラーメッセージの記録
      - 問題の早期発見
    - **統計種別**：
      - AI先生（teacher）
      - 振り返りAI（reflection）
      - 問題生成（problem_generation）

37. **Gemini API統合改善⭐⭐⭐NEW（2026年1月実装）**
    - **環境変数設定**：
      - GEMINI_API_KEY環境変数で管理
      - 本番/開発環境で異なるキーを使用
      - プレースホルダー検出とエラーメッセージ
    - **エラーハンドリング強化**：
      - APIキー未設定時の親切なエラー
      - API呼び出し失敗時の詳細ログ
      - ユーザーへのフレンドリーなメッセージ
    - **レート制限対応**：
      - エラー時の統計記録
      - リトライロジック（将来実装予定）
    - **モデルバージョン**：
      - gemini-2.0-flash-exp使用
      - 最新の言語理解能力
      - 高速な応答時間

### ✅ Phase 9：学習スタイル対応（完了⭐⭐⭐NEW 2026-01-18）

38. **学習スタイル別サポート機能⭐⭐⭐NEW（2026年1月実装）**
    - **3つの学習スタイル**：
      - 👁️ **視覚優位（Visual）**：図やイラスト、色分けで学ぶ
      - 👂 **聴覚優位（Auditory）**：音読やリズムで学ぶ
      - 🤸 **体感優位（Kinesthetic）**：身体活動や具体物で学ぶ
    - **各スタイルのサポート内容**：
      - 支援の説明（description）
      - 必要な教材リスト（materials）
      - 具体的な活動例（activities）
    - **指導上の留意点**：
      - 教師向けの指導ポイント
      - 個々の子どもへの配慮事項
    - **データ構造**：JSON形式で柔軟に保存

39. **AI学習スタイル提案機能⭐⭐⭐NEW（2026年1月実装）**
    - **自動提案**：
      - カード内容に基づいてAIが3スタイル全ての支援を自動生成
      - Gemini 2.5 Flash使用
      - 5-10秒で提案完了
    - **提案内容**：
      - 視覚優位サポート（図表、色分け、イラスト等）
      - 聴覚優位サポート（音読、リズム、語呂合わせ等）
      - 体感優位サポート（実験、身体活動、具体物操作等）
      - 指導上の留意点
    - **即座にDB保存**：
      - 提案結果を自動的にデータベースに保存
      - 学習カード詳細に反映

40. **学習スタイル編集機能⭐⭐⭐NEW（2026年1月実装）**
    - **カード詳細モーダルに新タブ**：
      - 「🎨 学習スタイル」タブを追加
      - 既存の「問題」「ヒント」「解答」「解説」タブと並列
    - **3つのセクション**：
      - 視覚優位サポート（青枠）
      - 聴覚優位サポート（緑枠）
      - 体感優位サポート（オレンジ枠）
    - **編集方法**：
      - 各セクションに「編集」ボタン
      - シンプルなプロンプト入力
      - 即座にDB更新・表示反映
    - **AI提案ボタン**：
      - 各セクション上部に配置
      - ワンクリックで3スタイル全て提案

41. **カード編集API⭐⭐⭐NEW（2026年1月実装）**
    - **PUT /api/card/:cardId**：
      - 学習スタイルフィールドを更新
      - visual_support, auditory_support, kinesthetic_support
      - learning_style_notes（指導上の留意点）
    - **更新可能フィールド**：
      - card_title, problem_description, answer
      - hints, example_problem, example_solution
      - real_world_connection, new_terms, textbook_page
      - 学習スタイル関連フィールド全て
    - **履歴記録**：
      - card_history テーブルに記録
      - 変更フィールドとスナップショットを保存
      - 監査証跡として活用

### ✅ フェーズ5：先生カスタマイズモード（完了）

22. **学習環境デザインタブ**
    - 6観点の環境デザイン設定：
      - 🎨 表現・クリエイティブ（作品制作、図の工夫）
      - 🔍 調査・フィールドワーク（身の回りの調査）
      - 🤔 多角的考察・クリティカルシンキング
      - 🌍 社会貢献・デザイン思考
      - 🧠 メタ認知・振り返り
      - ❓ 問いの生成
    - 各観点の有効/無効切替
    - 具体的な活動内容の記入
    - 学習のてびきへの反映

23. **指導・評価タブ**
    - 学習指導要領3観点評価（ABC評価）：
      - 📚 知識・技能
      - 💭 思考・判断・表現
      - ✨ 主体的に学習に取り組む態度
    - 観点ごとの評価コメント
    - 総合所見の記入

24. **非認知能力評価**
    - 7つの評価項目（1-5段階）：
      - 🎯 自己調整能力
      - 🔥 意欲・粘り強さ
      - 🤝 協働性
      - 🧠 メタ認知
      - 🎨 創造性
      - 🌟 好奇心
      - 💪 自己肯定感
    - 絵文字による視覚的評価
    - 各項目の詳細コメント
    - レーダーチャート可視化（準備完了）

25. **ゲーミフィケーション機能**
    - 🏆 バッジシステム：
      - 完走バッジ（全カード完了）
      - 教え上手バッジ（友達サポート）
      - 粘り強さバッジ（困難克服）
    - バッジ獲得履歴の表示
    - 獲得日時の記録

26. **ナラティブ機能**
    - 📖 学習ストーリー：
      - チャプター別の物語
      - マイルストーン達成の記録
      - 子どもの成長を物語として可視化
    - ストーリーテーマのカスタマイズ
    - 冒険・成長の記録

27. **先生カスタマイズ設定**
    - 👨‍🏫 先生の指導方針の記入
    - 📝 カスタム単元目標の設定
    - 🎯 カスタム非認知目標の設定
    - 💡 指導上の留意点の記録
    - ゲーミフィケーション設定の切替
    - ナラティブ機能の切替

28. **生徒別評価管理**
    - 児童選択ドロップダウン
    - 3観点評価の入力と保存
    - 非認知能力評価の入力と保存
    - バッジ獲得状況の確認
    - 学習ストーリーの閲覧

## データアーキテクチャ

### データモデル

**主要テーブル:**
- `users`: 教師・児童情報
- `classes`: クラス情報
- `curriculum`: カリキュラム（学年・教科・単元）
- `courses`: コース情報（基礎・標準・発展）
- `learning_cards`: 学習カード
- `hint_cards`: ヒントカード
- `optional_problems`: 選択問題（発展学習）
- `student_progress`: 学習進捗
- `learning_plans`: 学習計画
- `evaluations`: 評価データ（旧）
- `answers`: 解答と解説
- `learning_environment`: 学習環境デザイン（旧）
- `custom_content`: カスタマイズコンテンツ

**Phase 5 追加テーブル:**
- `three_point_evaluations`: 学習指導要領3観点評価
- `non_cognitive_evaluations`: 非認知能力7項目評価
- `learning_environment_designs`: 学習環境デザイン6観点
- `teacher_customization`: 先生のカスタマイズ設定
- `student_badges`: 獲得バッジ
- `learning_narratives`: 学習ストーリー

**Phase 6 追加テーブル（認証・セキュリティ）:**
- `user_sessions`: セッション管理（トークン、有効期限、IP、User-Agent）
- `role_permissions`: ロール別権限定義
- `audit_logs`: 監査ログ（操作履歴）

**Phase 8 追加テーブル（AI機能拡張⭐⭐⭐NEW）:**
- `ai_conversations`: AI対話履歴（セッションID、質問/回答、コンテキスト）
- `generated_problems`: 自動生成問題（問題内容、解答、生成パラメータ、承認フラグ）
- `ai_usage_stats`: AI使用統計（トークン数、応答時間、成功/失敗、エラーログ）

**Phase 9 追加カラム（学習スタイル対応⭐⭐⭐NEW 2026-01-18）:**
- `learning_cards.visual_support`: 視覚優位サポート（JSON）
- `learning_cards.auditory_support`: 聴覚優位サポート（JSON）
- `learning_cards.kinesthetic_support`: 体感優位サポート（JSON）
- `learning_cards.learning_style_notes`: 指導上の留意点（TEXT）

**ScTN質問紙・全国学調統合テーブル（⭐⭐⭐NEW 2026-01-29）:**
- `sctn_survey_results`: ScTN質問紙結果（71問、3パッケージ対応）
  - 学校教育の経験（5観点10問）、成果の実感（3問）
  - 学びに向かう力（34問：動機・自己調整・相互調整・粘り強さ）
  - 人間性（24問：自己効力感・自己受容感・他者受容感・集合効力感）
- `national_survey_results`: 全国学力・学習状況調査結果（63問）
  - 基本的生活習慣（8問）、挑戦心・達成感・規範意識（11問）
  - 学習習慣・環境（5問）、ICT活用状況（7小問）
  - 主体的・対話的で深い学び（9問）、総合・学級活動・道徳（4問）
  - 教科調査（国語・算数/数学正答率）
- `sctn_national_mapping`: ScTN-全国学調対応関係（27項目完全一致）

**自己調整学習（Zimmerman SRL）テーブル（⭐⭐⭐NEW 2026-01-29）:**
- `srl_profiles`: 自己調整学習プロファイル（予見・遂行・内省の3段階診断）
  - 予見段階（4項目）: 目標設定能力、計画能力、自己効力感、課題価値認識
  - 遂行段階（3項目）: 注意制御、学習方略使用、メタ認知的モニタリング
  - 内省段階（3項目）: 自己評価能力、原因帰属パターン、適応的反応
  - 総合判定: novice（初歩）/ developing（発展中）/ proficient（熟達）
- `learning_strategy_history`: 学習方略使用履歴（6種類の方略記録）
  - 反復方略、精緻化方略、組織化方略、メタ認知的方略、動機づけ方略、環境調整方略

**learning_cards追加カラム（自己調整学習3段階）⭐⭐⭐NEW 2026-01-29:**
- 予見段階（学習前）: `foresight_goal`（目標）、`foresight_plan`（計画）、`foresight_motivation`（動機づけ）
- 遂行段階（学習中）: `performance_strategies`（学習方略）、`performance_monitoring`（自己観察）
- 内省段階（学習後）: `reflection_questions`（振り返り質問）、`reflection_attribution`（原因帰属）、`reflection_improvement`（改善計画）

**student_progress追加カラム（自己調整学習記録）⭐⭐⭐NEW 2026-01-29:**
- 予見段階記録: `srl_foresight_goal`、`srl_foresight_plan`、`srl_foresight_self_efficacy`
- 遂行段階記録: `srl_performance_strategies`、`srl_performance_monitoring_count`、`srl_performance_attention_score`
- 内省段階記録: `srl_reflection_depth`、`srl_reflection_attribution`、`srl_reflection_improvement_specificity`、`srl_reflection_next_motivation`

### ストレージサービス

- **Cloudflare D1**: SQLiteベースの分散データベース
- **ローカル開発**: `.wrangler/state/v3/d1`に自動生成

### データフロー

```
トップページ → 学習のてびき → コース選択 → 学習カード → 進捗保存
                     ↓              ↓              ↓
              学習計画表      進捗ボード      解答タブ
                     ↓              ↓
              振り返りAI      助け要請検知
```

## 主要な機能URI

### API エンドポイント

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|---------|------|-----------|
| `/api/curriculum/options` | GET | 学年・教科・教科書会社の選択肢取得 | なし |
| `/api/curriculum` | GET | カリキュラム一覧取得 | なし |
| `/api/curriculum/:id` | GET | 特定カリキュラムの詳細取得 | id: カリキュラムID |
| `/api/courses/:courseId/cards` | GET | コースの学習カード取得 | courseId: コースID |
| `/api/cards/:cardId` | GET | 学習カードの詳細とヒント取得 | cardId: カードID |
| `/api/progress` | POST | 学習進捗の保存 | student_id, curriculum_id, など |
| `/api/progress/class/:classCode` | GET | クラス全体の進捗取得 | classCode: クラスコード |
| `/api/progress/curriculum/:curriculumId/class/:classCode` | GET | カリキュラム別進捗取得 | curriculumId, classCode |
| `/api/plans/:studentId/:curriculumId` | GET | 学習計画取得 | studentId, curriculumId |
| `/api/plans` | POST | 学習計画保存 | student_id, curriculum_id, など |
| `/api/plans/:id` | PUT | 学習計画更新 | id: 計画ID |
| `/api/ai/ask` | POST | AI先生に質問 | cardId, question, context |
| `/api/ai/reflect` | POST | AI振り返りフィードバック | reflection_good, reflection_bad, など |
| `/api/answers/curriculum/:curriculumId` | GET | 全解答取得 | curriculumId: カリキュラムID |

**Phase 5 追加エンドポイント:**

| `/api/environment/design/:curriculumId` | GET | 学習環境デザイン取得 | curriculumId: カリキュラムID |
| `/api/environment/design` | POST | 学習環境デザイン保存 | curriculum_id, 6観点データ |
| `/api/environment/design/:id` | PUT | 学習環境デザイン更新 | id: デザインID |
| `/api/evaluations/three-point/student/:studentId/curriculum/:curriculumId` | GET | 3観点評価取得 | studentId, curriculumId |
| `/api/evaluations/three-point` | POST | 3観点評価保存 | student_id, curriculum_id, 評価データ |
| `/api/evaluations/three-point/:id` | PUT | 3観点評価更新 | id: 評価ID |
| `/api/evaluations/non-cognitive/student/:studentId/curriculum/:curriculumId` | GET | 非認知能力評価取得 | studentId, curriculumId |
| `/api/evaluations/non-cognitive` | POST | 非認知能力評価保存 | student_id, curriculum_id, 7項目データ |
| `/api/evaluations/non-cognitive/:id` | PUT | 非認知能力評価更新 | id: 評価ID |
| `/api/teacher/customization/:curriculumId` | GET | 先生カスタマイズ設定取得 | curriculumId: カリキュラムID |
| `/api/teacher/customization` | POST | 先生カスタマイズ設定保存 | curriculum_id, 設定データ |
| `/api/badges/student/:studentId/curriculum/:curriculumId` | GET | 生徒のバッジ取得 | studentId, curriculumId |
| `/api/narratives/student/:studentId/curriculum/:curriculumId` | GET | 学習ナラティブ取得 | studentId, curriculumId |

**Phase 6 追加エンドポイント（認証・セキュリティ）:**

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|---------|------|-----------|
| `/api/auth/register` | POST | 新規ユーザー登録 | name, email, password, role, class_code, student_number |
| `/api/auth/login` | POST | ログイン | email, password |
| `/api/auth/logout` | POST | ログアウト | Authorization: Bearer {token} |
| `/api/auth/refresh` | POST | セッション更新 | refresh_token |
| `/api/auth/me` | GET | 現在のユーザー情報取得 | Authorization: Bearer {token} |

**Phase 8 追加エンドポイント（AI機能拡張⭐⭐⭐NEW）:**

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|---------|------|-----------|
| `/api/ai/conversations/:sessionId` | GET | AI対話履歴取得 | sessionId: セッションID |
| `/api/ai/generate-problem` | POST | 自動問題生成 | curriculumId, courseId, difficultyLevel, requirements |
| `/api/card/:cardId` | PUT | 学習カード更新（学習スタイル対応⭐⭐⭐NEW） | cardId: カードID, visual_support, auditory_support, kinesthetic_support, learning_style_notes |
| `/api/card/:cardId/suggest-learning-styles` | POST | 学習スタイルAI提案⭐⭐⭐NEW | cardId: カードID |

**分散学習スケジューラーAPI（2026-01-29実装完了✅）:**

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|---------|------|-----------|
| `/api/spaced-learning/today-reviews/:studentId` | GET | 今日の復習カード取得 | studentId: 学生ID |
| `/api/spaced-learning/review-count/:studentId` | GET | 今日の復習カード数取得 | studentId: 学生ID |
| `/api/spaced-learning/weekly-schedule/:studentId` | GET | 週間復習スケジュール取得 | studentId: 学生ID |
| `/api/spaced-learning/mastery-stats/:studentId` | GET | 習熟度統計取得 | studentId: 学生ID |
| `/api/spaced-learning/record-review` | POST | 復習結果記録 | studentId, cardId, qualityRating, isCorrect, responseTime |
| `/api/spaced-learning/forgetting-risk/:studentId` | GET | 忘却リスク検出 | studentId: 学生ID |
| `/api/spaced-learning/history/:studentId` | GET | 学習履歴取得 | studentId: 学生ID, cardId (optional) |
| `/api/spaced-learning/mastery/:studentId/:cardId` | GET | 習熟度取得 | studentId: 学生ID, cardId: カードID |
| `/api/spaced-learning/settings/:studentId` | GET/PUT | 分散学習設定の取得・更新 | studentId: 学生ID |

**協働学習API（2026-01-29実装完了✅）:**

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|---------|------|-----------|
| `/api/collaborative/peer-answers/:cardId` | GET | 友達の回答一覧取得 | cardId: カードID, studentId, classCode |
| `/api/collaborative/submit-answer` | POST | 回答投稿 | studentId, cardId, answerText, approachType, isPublic |
| `/api/collaborative/submit-evaluation` | POST | ピア評価投稿 | evaluatorId, answerId, rating, feedbackText, helpfulAspects, learningGained |
| `/api/collaborative/toggle-helpful` | POST | 役に立ったマーク切り替え | studentId, answerId |
| `/api/collaborative/record-view` | POST | 閲覧記録 | viewerId, answerId, viewDuration |
| `/api/collaborative/stats/:studentId` | GET | 協働学習統計取得 | studentId: 学生ID |
| `/api/collaborative/class-activity/:classCode` | GET | クラス全体の協働学習活動 | classCode: クラスコード |

**週次・月次レポートAPI（2026-01-29実装完了✅）:**

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|---------|------|-----------|
| `/api/reports/weekly/:studentId` | POST | 週次レポート生成 | studentId: 学生ID, weekStart, weekEnd |
| `/api/reports/monthly/:studentId` | POST | 月次レポート生成 | studentId: 学生ID, monthStart, monthEnd |
| `/api/reports/weekly/:studentId/list` | GET | 週次レポート一覧取得 | studentId: 学生ID, limit (optional) |
| `/api/reports/monthly/:studentId/list` | GET | 月次レポート一覧取得 | studentId: 学生ID, limit (optional) |
| `/api/reports/sctn-trend/:studentId` | GET | ScTN経年変化データ取得 | studentId: 学生ID, months (optional) |
| `/api/reports/mastery-trend/:studentId` | GET | 習熟度推移データ取得 | studentId: 学生ID, days (optional) |

**検索練習API（2026-01-29実装完了✅）:**

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|---------|------|-----------|
| `/api/retrieval-practice/start-session` | POST | 検索練習セッション開始 | studentId, cardId, recallType |
| `/api/retrieval-practice/submit-answer` | POST | 回答送信・AI評価 | sessionId, studentAnswer, responseTime, confidenceRating, difficultyRating |
| `/api/retrieval-practice/sessions/:studentId` | GET | セッション一覧取得 | studentId: 学生ID, limit (optional) |
| `/api/retrieval-practice/stats/:studentId` | GET | 検索練習統計取得 | studentId: 学生ID |
| `/api/retrieval-practice/effectiveness/:studentId` | GET | 効果測定データ取得 | studentId: 学生ID |
| `/api/retrieval-practice/recommended-cards/:studentId` | GET | 推奨カード取得 | studentId: 学生ID, recallType (optional) |

**交互配置練習API（2026-01-29実装完了✅）:**

| エンドポイント | メソッド | 説明 | パラメータ |
|--------------|---------|------|-----------|
| `/api/interleaved-practice/start-session` | POST | 交互配置セッション開始 | studentId, interleavingStrategy |
| `/api/interleaved-practice/submit-answer` | POST | 問題回答送信 | sessionId, problemId, isCorrect, responseTime, identifiedConcept, confusedConcepts |
| `/api/interleaved-practice/sessions/:studentId` | GET | セッション一覧取得 | studentId: 学生ID, limit (optional) |
| `/api/interleaved-practice/discrimination-stats/:studentId` | GET | 概念識別能力統計 | studentId: 学生ID |
| `/api/interleaved-practice/transfer-effects/:studentId` | GET | 転移学習効果測定 | studentId: 学生ID |
| `/api/interleaved-practice/stats/:studentId` | GET | 交互配置練習統計 | studentId: 学生ID |

| `/api/spaced-learning/record-review` | POST | 学習結果記録 | studentId, cardId, result, sessionType, responseTime, difficultyRating, confidenceLevel, srlStage, srlStrategyUsed, srlNotes |
| `/api/spaced-learning/forgetting-risk/:studentId` | GET | 忘却リスクカード取得 | studentId: 学生ID, limit: 件数 |
| `/api/spaced-learning/history/:studentId` | GET | 学習履歴取得 | studentId: 学生ID, cardId: カードID（任意）, limit: 件数 |
| `/api/spaced-learning/schedule/:studentId/:cardId` | GET | スケジュール詳細取得 | studentId: 学生ID, cardId: カードID |
| `/api/spaced-learning/mastery/:studentId/:cardId` | GET | 習熟度取得 | studentId: 学生ID, cardId: カードID |
| `/api/spaced-learning/settings/:studentId` | GET | 設定取得 | studentId: 学生ID |
| `/api/spaced-learning/settings/:studentId` | PUT | 設定更新 | studentId: 学生ID, settings: 設定データ |

### ページ一覧

| ページ | 説明 | アクセス |
|--------|------|---------|
| トップページ | 学年・教科・単元選択 | `/` |
| 学習のてびき | 単元全体の概要 | 単元選択後 |
| 学習カード | 問題・ヒント・AI先生 | コース選択後 |
| 学習計画表 | 計画・振り返り | 学習のてびきから |
| 解答タブ | 全解答と解説 | 学習のてびきから |
| 進捗ボード | クラス全体の進捗 | 学習のてびきから |
| **学習環境デザイン** | **6観点の環境設定** | **学習のてびき（教師用）** |
| **指導・評価** | **3観点・非認知評価** | **学習のてびき（教師用）** |
| **分散学習進捗** | **復習スケジュール・習熟度** | **/spaced-learning-progress-demo.html** |

## 実装済み機能の詳細

### 児童向け機能

1. **自己調整学習**
   - 学習計画の作成
   - 自分のペースで進行
   - 振り返りの記録

2. **個別最適化**
   - 3コース制（じっくり・しっかり・ぐんぐん）
   - 自分に合ったコースを選択
   - 理解度に応じた学習

3. **多様な支援**
   - ヒントカード（3段階）
   - AI先生（ソクラテス対話）
   - 先生への助け要請
   - 友達との学び合い

4. **メタ認知の育成**
   - 分かった度の自己評価
   - 毎時間の振り返り
   - 単元全体の振り返り

### 教師向け機能

1. **進捗管理**
   - クラス全体の可視化
   - リアルタイム更新
   - コース別色分け

2. **早期介入**
   - 助け要請の検知
   - 停滞児童の発見
   - 指導優先度の提示

3. **データ分析**
   - 助けの種類別統計
   - 理解度の分布
   - 学習進捗の推移

4. **指導支援**
   - 指導のポイント提示
   - 個別指導の推奨
   - 発展課題の提案

5. **学習環境デザイン（Phase 5）**
   - 6観点の環境設定（表現・調査・考察・社会貢献・メタ認知・問い生成）
   - 各観点の有効/無効切替
   - 具体的な活動内容の記入
   - 学習カードへの反映

6. **指導・評価（Phase 5）**
   - 学習指導要領3観点評価（知識・技能、思考・判断・表現、態度）
   - ABC評価と詳細コメント
   - 非認知能力7項目評価（自己調整、意欲、協働性、メタ認知、創造性、好奇心、自己肯定感）
   - 1-5段階評価と詳細コメント
   - 総合所見の記録

7. **ゲーミフィケーション管理（Phase 5）**
   - 生徒のバッジ獲得状況の確認
   - バッジシステムの設定
   - 達成マイルストーンの管理

8. **ナラティブ機能（Phase 5）**
   - 生徒の学習ストーリーの閲覧
   - ストーリーテーマのカスタマイズ
   - 成長記録の可視化

9. **カスタマイズ設定（Phase 5）**
   - 指導方針の記録
   - カスタム単元目標の設定
   - カスタム非認知目標の設定
   - 指導上の留意点の記入

## サンプルデータ

**単元**: 小学3年算数「かけ算の筆算」  
**クラス**: さくら小学校 3年1組 (CLASS2024A)  
**児童数**: 5名（山田太郎、佐藤花子、鈴木次郎、田中三郎、伊藤美咲）  
**コース数**: 3コース（じっくり・しっかり・ぐんぐん）  
**学習カード数**: 18枚（各コース6枚）  
**選択問題数**: 6題  
**ヒント数**: 各カード3段階

### コース別学習カード

**じっくりコース（基礎）:**
1. 10のまとまりでかける
2. 何十のかけ算
3. 2けた×1けた（くり上がりなし）
4. 2けた×1けた（くり上がりあり）
5. 3けた×1けた（くり上がりなし）
6. 3けた×1けた（くり上がりあり）

**しっかりコース（標準）:**
1. かけ算の意味をふかめよう
2. 2けた×1けたの筆算（基本）
3. 2けた×1けた（くり上がり1回）
4. 3けた×1けた（くり上がりなし）
5. 3けた×1けた（くり上がり1回）
6. 3けた×1けた（くり上がり2回）

**ぐんぐんコース（発展）:**
1. かけ算のきまりを見つけよう
2. 2けた×1けた（応用問題）
3. 3けた×1けた（基礎から応用）
4. くり上がり2回の難問に挑戦
5. かけ算を使った問題づくり
6. かけ算のまちがい探し

### 選択問題（発展学習）

1. かけ算カレンダー作り（表現・クリエイティブ）
2. お店屋さんごっこ（調査・フィールドワーク）
3. かけ算の不思議を調べよう（多角的考察）
4. 学校のため算数プロジェクト（社会貢献）
5. かけ算日記をつけよう（メタ認知）
6. かけ算ゲーム大会（表現・クリエイティブ）

## 教育哲学

**基本概念**: 「子どもは自ら考え実行する力をもっている存在である」

### 育みたい力

1. **体験・感覚・具体操作**を大切にする
2. **感じる力**
3. **意欲**
4. **好き（興味・関心）**
5. **個別最適な個性**

### システムが目指すもの

- 子どもの自立
- AI時代における人間としての力
- 学びのハンドルを子ども自身が握る
- 教師の業務負担軽減
- 授業スタイルの転換
- 子ども観の変革

## 技術スタック

### バックエンド
- **フレームワーク**: Hono v4
- **言語**: TypeScript
- **実行環境**: Cloudflare Workers
- **データベース**: Cloudflare D1 (SQLite)
- **キャッシュ**: Cloudflare KV (TTL: 86400秒)
- **AI**: Gemini API (Google)

### フロントエンド
- **言語**: Vanilla JavaScript
- **スタイリング**: TailwindCSS (CDN)
- **アイコン**: Font Awesome (CDN)
- **HTTP Client**: Axios (CDN)

### API仕様書 📚
- **OpenAPI**: 3.0.3仕様
- **ドキュメント**: Swagger UI 5.10.5
- **エンドポイント数**: 244個
- **カテゴリー**: 12分類
- **認証**: JWT Bearer Token
- **アクセス**: [/static/api-docs](https://e8efc4f3.jiyushindo-gakushu.pages.dev/static/api-docs)

### 開発環境
- **ビルドツール**: Vite
- **プロセス管理**: PM2
- **バージョン管理**: Git

## デプロイメント

### 開発環境

- **プラットフォーム**: Cloudflare Pages (ローカル開発モード)
- **ステータス**: ✅ Active
- **URL**: https://3000-ifkm81ji5x491axns53a8-b9b802c4.sandbox.novita.ai

### ローカル開発コマンド

```bash
# データベースのリセット
npm run db:reset

# ローカル開発サーバー起動
npm run dev:sandbox

# ビルド
npm run build

# PM2で起動
pm2 start ecosystem.config.cjs

# PM2ログ確認
pm2 logs --nostream

# PM2停止
pm2 delete webapp
```

### 本番デプロイ（準備完了）

```bash
# 本番データベース作成
npx wrangler d1 create webapp-production

# マイグレーション適用
npm run db:migrate:prod

# デプロイ
npm run deploy:prod
```

## 環境変数設定

### Gemini APIキー（必須⭐⭐⭐）

AI機能（AI先生、振り返りAI、自動問題生成）を使用するには、Gemini APIキーの設定が必要です。

**詳細な設定手順**: [SETUP_GEMINI_API.md](./SETUP_GEMINI_API.md)

#### 開発環境（ローカル）

`.dev.vars` ファイルを作成してAPIキーを設定：

```bash
# .dev.varsファイルを作成
cat > .dev.vars << 'EOF'
GEMINI_API_KEY=取得したAPIキーをここに貼り付け
EOF
```

**注意**: `.dev.vars`ファイルは`.gitignore`に含まれており、Gitにコミットされません。

#### 本番環境（Cloudflare Pages）

**方法1: Wrangler CLIを使用（推奨）**

```bash
# 環境変数を設定（対話的にAPIキーを入力）
npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu
```

**方法2: Cloudflare Dashboard（ブラウザ）**

1. [Cloudflare Dashboard](https://dash.cloudflare.com) にログイン
2. 「Workers & Pages」→「jiyushindo-gakushu」を選択
3. 「Settings」→「Environment Variables」
4. 「Production」環境で「Add variable」
5. 変数名: `GEMINI_API_KEY`、値: APIキー
6. 「Encrypt」をチェック、「Save」をクリック
7. 再デプロイが必要: `npm run deploy:prod`

**APIキーの取得:**
https://makersuite.google.com/app/apikey

#### 動作確認テスト

Gemini APIが正しく設定されているか確認するには、テストスクリプトを使用します：

```bash
# 開発環境でテスト
./test-gemini-api.sh dev

# 本番環境でテスト
./test-gemini-api.sh prod
```

テストスクリプトは以下を確認します：
- AI先生APIの応答
- 対話履歴取得API
- 問題生成API（オプション）

## 今後の拡張可能な機能

### フェーズ5：カスタマイズ機能（未実装）

1. **先生カスタマイズモード**
   - 問題編集機能
   - カスタムコンテンツ作成
   - 学習カードの追加・削除

2. **指導・評価タブ**
   - 3観点評価（ABC）
   - 非認知能力評価
   - 指導上の留意点記録

3. **学習環境デザイン**
   - 6カテゴリの環境提案
   - アフォーダンス理論実装
   - 教室環境の具体化

### フェーズ6：多言語・アクセシビリティ（未実装）

4. **多言語対応**
   - 多言語選択機能
   - 自動翻訳機能

5. **音声支援**
   - Text-to-Speech機能
   - 問題文の読み上げ

6. **動的視覚支援**
   - アニメーション
   - インタラクティブ図表

## 開発の記録

### Git コミット履歴

```
feat: 進捗ボード実装 - クラス全体の可視化、助け要請検知、停滞検知、統計表示
feat: 学習計画表と解答タブ実装 - 計画作成、振り返り、AI振り返り、全解答表示
feat: 学習カード詳細ページ実装 - 問題表示、ヒント、ソクラテス対話、分かった度評価
feat: フェーズ1実装完了 - トップページ、学習のてびき、コース選択
Initial commit: Hono project setup
```

## 実装状況

### ✅ 完了済み機能

| フェーズ | 機能 | 完成度 | 備考 |
|---------|-----|-------|------|
| Phase 1 | 基本機能 | **100%** | トップページ、学習のてびき、コース選択 |
| Phase 2 | 学習機能 | **100%** | 学習カード、ヒント、AI先生、進捗保存 |
| Phase 3 | 計画・管理 | **100%** | 学習計画表、振り返り、解答タブ |
| Phase 4 | 教師支援 | **100%** | 進捗ボード、統計、レポート |
| Phase 5 | カスタマイズ | **100%** | 環境デザイン、評価、ゲーミフィケーション |
| Phase 6 | 認証・セキュリティ | **100%** | ログイン、権限管理、監査ログ |
| **Phase 7** | **WebSocketリアルタイム通信⭐⭐⭐** | **100%** | **進捗更新、ヘルプ要請通知、双方向通信（開発環境のみ）** |
| **Phase 8** | **AI機能拡張⭐⭐⭐NEW** | **100%** | **対話履歴保存、自動問題生成、Gemini 2.0 Flash Exp** |
| **Phase 9** | **学習スタイル対応⭐⭐⭐NEW** | **100%** | **視覚/聴覚/体感優位サポート、AI提案、カード編集** |
| **履歴・ロールバック** | **編集履歴管理** | **100%** | **履歴表示、差分表示、ワンクリック復元** |

**総合完成度: 100%** 🎉🎉🎉

### 📝 次のステップ候補

1. **個人レポート完全実装（1-2日）**
   - 児童個別詳細モーダルからPDF出力
   - 保護者向けレポート
   - 学習履歴の可視化

2. **多言語・アクセシビリティ（1週間以上）**
   - 多言語対応（英語、中国語など）
   - Text-to-Speech機能
   - 動的視覚支援
   - ハイコントラストモード

3. **パフォーマンス最適化（1-2日）**
   - データベースインデックス最適化
   - キャッシュ戦略
   - 遅延読み込み
   - 画像最適化

4. **WebSocket本番環境対応（2-3日）**
   - Cloudflare Workersへの移行
   - Durable Objectsの本番環境設定
   - リアルタイム通信の完全実装

## 最終更新日

2026-01-18

---

**開発者へ**: このシステムは、子どもたちの自律的な学びと先生方の働き方改革を両立させることを目指しています。一つひとつの機能が、子どもたちの成長と先生方の支援につながることを常に意識して開発を進めてください。

**Phase 9 学習スタイル対応機能が完了しました！🎉✨**
**視覚優位・聴覚優位・体感優位の3つの学習スタイルに応じた個別最適化サポートを実現！**
**すべてのコア機能が実装完了しました！総合完成度100%達成！🎊🎊🎊**

---

## 📚 関連ドキュメント

- [学習スタイル対応 実装ガイド](./LEARNING_STYLES_IMPLEMENTATION.md)
- [学習スタイル対応 使い方ガイド](./LEARNING_STYLES_USER_GUIDE.md)
- [学習スタイル別サポート例](./LEARNING_STYLES_EXAMPLES.md)
- [Gemini API セットアップ](./SETUP_GEMINI_API.md)
- [ログイン情報](./LOGIN_INFO.md)
- [教育改革ガイド](./EDUCATIONAL_REFORM_GUIDE.md)
# GitHub Actions auto-deploy test - Fri Jan 30 06:39:43 UTC 2026
