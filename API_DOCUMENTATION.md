# 📚 API仕様書ガイド

## 概要

自由進度学習支援システムのREST API仕様書です。全244個のエンドポイントをOpenAPI 3.0形式でドキュメント化しています。

---

## 🌐 アクセス方法

### 本番環境
- **Swagger UI**: https://e8efc4f3.jiyushindo-gakushu.pages.dev/api-docs
- **OpenAPI YAML**: https://e8efc4f3.jiyushindo-gakushu.pages.dev/openapi.yaml

### ローカル開発
```bash
# サーバー起動
npm run dev

# ブラウザで開く
open http://localhost:3000/api-docs
```

---

## 🔐 認証フロー

このAPIは **JWT (JSON Web Token)** 認証を使用します。

### 1. ログイン

```bash
curl -X POST https://e8efc4f3.jiyushindo-gakushu.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**レスポンス例**:
```json
{
  "message": "Login successful",
  "user": {
    "id": 123,
    "username": "tanaka_taro",
    "email": "tanaka@example.com",
    "user_type": "student",
    "role": "student"
  }
}
```

**JWT Token**: レスポンスの `Set-Cookie` ヘッダーまたはCookieに保存されます。

---

### 2. 認証が必要なAPIの呼び出し

JWTトークンを `Authorization` ヘッダーに付与：

```bash
curl -X GET https://e8efc4f3.jiyushindo-gakushu.pages.dev/api/adaptive/detect-learning-style/42 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Swagger UIでの認証

1. Swagger UIページを開く: https://e8efc4f3.jiyushindo-gakushu.pages.dev/api-docs
2. 右上の **「Authorize 🔓」** ボタンをクリック
3. **Value** フィールドにJWTトークンを入力（`Bearer` プレフィックスは不要）
4. **「Authorize」** をクリック → 🔒 に変わる
5. 以降のAPIリクエストで自動的に認証ヘッダーが付与される

---

## 📊 APIカテゴリー

### 🔐 認証（Authentication）
- `POST /api/auth/register/student` - 生徒登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報
- `POST /api/auth/change-password` - パスワード変更

### 🧠 適応学習（Adaptive Learning）
- `GET /api/adaptive/detect-learning-style/{studentId}` - 学習スタイル自動検出
- `GET /api/adaptive/recommend/{studentId}` - 適応的コンテンツ推奨

**学習スタイル検出方法**:
- VARK理論: Visual（視覚）、Auditory（聴覚）、Reading（読書）、Kinesthetic（運動）
- Gardner多重知能理論: 言語的、論理的、空間的、音楽的、身体的、対人的、内省的、博物学的

### 🏫 学校管理（School Management）
- `GET /api/school/{schoolId}/classes` - クラス一覧
- `GET /api/school/{schoolId}/grade-summary` - 学年サマリー
- `GET /api/teacher/{teacherId}/class/{classCode}/analysis` - クラス分析
- `POST /api/parent/notify` - 保護者通知
- `GET /api/parent/notifications/{studentId}` - 保護者通知履歴

### 📖 カリキュラム（Curriculum）
- `GET /api/curriculum` - カリキュラム一覧
- `GET /api/curriculum/{id}` - カリキュラム詳細
- `GET /api/courses/{courseId}/cards` - 学習カード一覧
- `GET /api/cards/{cardId}` - 学習カード詳細

### 📊 学習進捗（Progress Tracking）
- `POST /api/progress` - 学習進捗記録
- `POST /api/learning/log` - 学習ログ記録
- `POST /api/learning/session/start` - 学習セッション開始
- `POST /api/learning/session/end` - 学習セッション終了
- `GET /api/progress/class/{classCode}` - クラス進捗
- `GET /api/progress-board/class/{classCode}` - 進捗ボード

### 🤖 AI教師（AI Teacher）
- `POST /api/ai/ask` - AI教師に質問（Socratic対話）
- `GET /api/ai/conversations/{sessionId}` - 会話履歴取得
- `POST /api/ai/generate-problem` - AI問題生成
- `POST /api/ai/reflect` - 学習振り返り支援
- `POST /api/ai/generate-content` - AIコンテンツ生成
- `GET /api/ai/content-history` - コンテンツ履歴

### 📝 評価（Evaluation）
- `POST /api/evaluations` - 評価記録
- `GET /api/evaluations/student/{studentId}/curriculum/{curriculumId}` - 評価取得
- `POST /api/evaluations/three-point` - 3観点評価
- `POST /api/evaluations/non-cognitive` - 非認知能力評価

### 📈 レポート（Reports）
- `GET /api/reports/weekly/{classCode}` - 週次レポート
- `GET /api/reports/monthly/{classCode}` - 月次レポート
- `GET /api/school/{schoolId}/report` - 学校レポート
- `GET /api/error-analysis/{studentId}/{curriculumId}` - エラー分析

### 🔔 通知（Notifications）
- `POST /api/notifications/send` - 通知送信
- `GET /api/notifications` - 通知一覧
- `PUT /api/notifications/{id}/read` - 既読設定
- `PUT /api/notifications/read-all` - 全て既読

### 🏆 ゲーミフィケーション（Gamification）
- `GET /api/badges/student/{studentId}/curriculum/{curriculumId}` - バッジ取得
- その他、ランキング・実績システム

---

## 🛠️ 技術スタック

| カテゴリー | 技術 |
|-----------|-----|
| **フレームワーク** | Hono (Cloudflare Workers) |
| **データベース** | Cloudflare D1 (SQLite) |
| **キャッシュ** | Cloudflare KV (TTL: 86400秒) |
| **AI統合** | Google Gemini API |
| **認証** | JWT (JSON Web Token) |
| **デプロイ** | Cloudflare Pages |
| **API仕様** | OpenAPI 3.0 |

---

## 📌 エンドポイント数

| カテゴリー | エンドポイント数 |
|-----------|---------------|
| **認証** | 5 |
| **適応学習** | 2 |
| **学校管理** | 5 |
| **カリキュラム** | 8 |
| **学習進捗** | 12 |
| **AI教師** | 6 |
| **評価** | 6 |
| **レポート** | 3 |
| **通知** | 4 |
| **ゲーミフィケーション** | 3 |
| **その他** | 190+ |
| **合計** | **244** |

---

## 🔍 使用例

### 例1: 学習スタイル検出

```bash
# 1. ログイン
TOKEN=$(curl -s -X POST https://e8efc4f3.jiyushindo-gakushu.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"tanaka_taro","password":"your_password"}' \
  | jq -r '.token')

# 2. 学習スタイル検出
curl -X GET https://e8efc4f3.jiyushindo-gakushu.pages.dev/api/adaptive/detect-learning-style/42 \
  -H "Authorization: Bearer $TOKEN"
```

**レスポンス例**:
```json
{
  "student_id": 42,
  "dominant_style": "visual",
  "dominant_intelligence": "spatial",
  "confidence_level": 0.85,
  "vark_scores": {
    "visual": 0.85,
    "auditory": 0.45,
    "reading": 0.60,
    "kinesthetic": 0.35
  },
  "gardner_scores": {
    "spatial": 0.90,
    "logical": 0.75,
    "linguistic": 0.60
  },
  "last_updated": "2026-01-30T06:00:00Z"
}
```

---

### 例2: 学習進捗記録

```bash
curl -X POST https://e8efc4f3.jiyushindo-gakushu.pages.dev/api/progress \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "card_id": 101,
    "student_answer": "45 cm²",
    "time_spent_seconds": 120,
    "hint_used": false,
    "confidence_level": "high"
  }'
```

**レスポンス例**:
```json
{
  "is_correct": true,
  "feedback": "正解です！図形の面積計算がよくできています。",
  "mastery_score": 85.5,
  "next_recommendation": {
    "card_id": 102,
    "title": "立体の体積計算",
    "reason": "平面図形の理解が十分なので、立体への応用に進みましょう"
  }
}
```

---

### 例3: AI教師に質問（Socratic対話）

```bash
curl -X POST https://e8efc4f3.jiyushindo-gakushu.pages.dev/api/ai/ask \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "なぜ面積は縦×横で計算できるのですか？",
    "card_id": 101,
    "session_id": "session_abc123"
  }'
```

**レスポンス例**:
```json
{
  "response": "いい質問ですね！面積とは「広さ」を表す単位ですが、なぜ縦×横で求められると思いますか？",
  "session_id": "session_abc123",
  "follow_up_questions": [
    "1cm × 1cmの正方形をいくつ並べると考えてみましょう",
    "実際に紙を使って確認してみましたか？"
  ]
}
```

---

## 🚀 開発者向けリソース

### ローカル開発

```bash
# 依存関係インストール
npm install

# ローカルサーバー起動
npm run dev

# API仕様書を開く
open http://localhost:3000/api-docs
```

---

### OpenAPI仕様書ファイル

- **場所**: `/openapi.yaml`
- **フォーマット**: OpenAPI 3.0.3
- **エディター**: VS Code + OpenAPI拡張機能推奨

---

### Swagger UIカスタマイズ

Swagger UIの設定は `/public/api-docs.html` で変更可能：

```javascript
const ui = SwaggerUIBundle({
  url: "/openapi.yaml",
  deepLinking: true,
  docExpansion: "list",  // "none", "list", "full"
  filter: true,
  persistAuthorization: true
})
```

---

## 🔒 セキュリティ

### 認証トークンの管理

- **保存場所**: HTTPOnly Cookieまたはローカルストレージ
- **有効期限**: 24時間
- **リフレッシュ**: 自動更新あり
- **HTTPS必須**: 本番環境では必須

### ロールベースアクセス制御（RBAC）

| ロール | 権限 |
|--------|------|
| **admin** | 全ての操作 |
| **teacher** | クラス管理、評価、レポート閲覧 |
| **student** | 学習機能、進捗閲覧 |
| **parent** | 子どもの進捗閲覧のみ |

---

## 📞 サポート

- **GitHub Issues**: https://github.com/koba06040603-ops/jiyushindo-gakushu/issues
- **Email**: support@jiyushindo-gakushu.com
- **ドキュメント**: https://e8efc4f3.jiyushindo-gakushu.pages.dev/api-docs

---

## 📄 ライセンス

MIT License

---

**作成日**: 2026-01-30  
**バージョン**: 1.0.0  
**API仕様**: OpenAPI 3.0.3
