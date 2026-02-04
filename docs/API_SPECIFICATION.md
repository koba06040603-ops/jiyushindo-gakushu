# API仕様書 - 自由進度学習支援システム

**バージョン**: 2.0  
**最終更新**: 2026-02-04  
**ベースURL**: `https://8f268ac8.jiyushindo-gakushu.pages.dev`

---

## 📋 目次

1. [認証API](#認証api)
2. [学習管理API](#学習管理api)
3. [保護者API](#保護者api)
4. [セキュリティAPI](#セキュリティapi)
5. [パフォーマンス監視API](#パフォーマンス監視api)
6. [エクスポートAPI](#エクスポートapi)
7. [エラーコード](#エラーコード)

---

## 認証API

### POST /api/auth/login
ユーザーログイン

**リクエスト:**
```json
{
  "username": "teacher1",
  "password": "password123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "user_id": 1,
    "username": "teacher1",
    "full_name": "山田太郎",
    "user_role": "teacher",
    "school_id": 1
  },
  "session_token": "abc123...",
  "refresh_token": "def456..."
}
```

**エラーレスポンス:**
- `401 Unauthorized`: 認証情報が無効
- `500 Internal Server Error`: サーバーエラー

---

### POST /api/auth/logout
ユーザーログアウト

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

---

### GET /api/auth/verify
セッション検証

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
{
  "valid": true,
  "user": {
    "user_id": 1,
    "username": "teacher1",
    "user_role": "teacher"
  }
}
```

---

## 学習管理API

### GET /api/learning/stats/:studentId
学生の学習統計取得

**パラメータ:**
- `studentId` (path): 学生ID

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
{
  "totalDays": 45,
  "totalProblems": 320,
  "accuracy": 85.5,
  "badges": 12
}
```

---

### POST /api/learning/log
学習ログ記録

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**リクエスト:**
```json
{
  "student_id": 1,
  "curriculum_id": 10,
  "card_id": 25,
  "is_correct": 1,
  "time_spent": 120,
  "hint_used": 0
}
```

**レスポンス:**
```json
{
  "success": true,
  "log_id": 1234
}
```

---

### GET /api/learning/progress/:studentId
学生の進捗取得

**パラメータ:**
- `studentId` (path): 学生ID

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
[
  {
    "id": 1,
    "unit_name": "分数の計算",
    "subject": "算数",
    "status": "in_progress",
    "started_at": "2026-01-15T10:00:00Z",
    "completed_at": null
  }
]
```

---

## 保護者API

### GET /api/parent/children
保護者の子ども一覧取得

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
{
  "success": true,
  "children": [
    {
      "student_id": 1,
      "student_name": "田中太郎",
      "grade_level": 3,
      "relationship_type": "parent"
    }
  ]
}
```

---

### GET /api/parent/teacher-comments/:studentId
教師からのコメント取得

**パラメータ:**
- `studentId` (path): 学生ID

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
[
  {
    "evaluation_id": 1,
    "comment": "よく頑張っています",
    "score": 85,
    "max_score": 100,
    "subject": "算数",
    "teacher_name": "山田先生",
    "created_at": "2026-02-01T15:30:00Z"
  }
]
```

---

## セキュリティAPI

### GET /api/security/csrf-token
CSRFトークン取得

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
{
  "success": true,
  "csrfToken": "abc123def456...",
  "expiresIn": 3600
}
```

---

### GET /api/security/scan
セキュリティスキャン実行（管理者のみ）

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
{
  "success": true,
  "report": {
    "timestamp": "2026-02-04T12:00:00Z",
    "checks": {
      "csrfProtection": true,
      "rateLimiting": true,
      "securityHeaders": true,
      "inputSanitization": true,
      "sqlInjectionProtection": true
    },
    "recommendations": [
      "CSRFトークンを永続化ストレージに保存することを推奨"
    ]
  }
}
```

---

## パフォーマンス監視API

### POST /api/performance/metrics
パフォーマンスメトリクス記録

**リクエスト:**
```json
{
  "metric_type": "api_response_time",
  "endpoint": "/api/learning/stats/1",
  "response_time_ms": 125,
  "status_code": 200
}
```

**レスポンス:**
```json
{
  "success": true
}
```

---

### POST /api/performance/error-log
エラーログ記録

**リクエスト:**
```json
{
  "error_type": "javascript",
  "error_message": "Uncaught TypeError",
  "stack_trace": "at line 42...",
  "endpoint": "/dashboard.html",
  "severity": "error"
}
```

**レスポンス:**
```json
{
  "success": true
}
```

---

### GET /api/performance/dashboard
パフォーマンスダッシュボードデータ取得（管理者のみ）

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```json
{
  "success": true,
  "metrics": {
    "avgResponseTime": 145.5,
    "errorRate": 1.2,
    "endpointPerformance": [
      {
        "endpoint": "/api/learning/stats/:id",
        "request_count": 1234,
        "avg_time": 125,
        "min_time": 50,
        "max_time": 350
      }
    ],
    "errorSummary": [
      {
        "error_type": "javascript",
        "severity": "error",
        "count": 15
      }
    ]
  }
}
```

---

### GET /api/performance/health
システムヘルスチェック

**レスポンス:**
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 25
    },
    "api": {
      "status": "healthy",
      "responseTime": 50
    }
  },
  "timestamp": "2026-02-04T12:00:00Z"
}
```

---

## エクスポートAPI

### GET /api/export/learning-logs
学習ログCSVエクスポート

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**クエリパラメータ:**
- `studentId` (optional): 学生IDでフィルタ
- `startDate` (optional): 開始日（YYYY-MM-DD）
- `endDate` (optional): 終了日（YYYY-MM-DD）

**レスポンス:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename=learning_logs.csv

ID,学生名,単元名,正答,時間,作成日時
1,田中太郎,分数の計算,1,120,2026-02-04 10:00:00
```

---

### GET /api/export/curriculum
カリキュラムCSVエクスポート

**ヘッダー:**
- `Authorization: Bearer <session_token>`

**レスポンス:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename=curriculum.csv

ID,学年,教科,教科書会社,単元名,単元順序,総時数,作成日時
1,3,算数,東京書籍,分数の計算,5,10,2026-01-01 00:00:00
```

---

## エラーコード

| コード | 説明 |
|--------|------|
| 200 | 成功 |
| 400 | リクエストが無効 |
| 401 | 認証が必要 |
| 403 | 権限がありません |
| 404 | リソースが見つかりません |
| 429 | レート制限超過 |
| 500 | サーバーエラー |

---

## 認証

すべての保護されたエンドポイントは、リクエストヘッダーに以下を含める必要があります：

```
Authorization: Bearer <session_token>
```

セッショントークンは `/api/auth/login` から取得できます。

---

## レート制限

- デフォルト: **100リクエスト/分** (IPベース)
- 制限超過時: `HTTP 429 Too Many Requests`

---

## セキュリティ

### CSRF保護
POST/PUT/DELETEリクエストには、以下のヘッダーが必要です：

```
X-CSRF-Token: <csrf_token>
```

CSRFトークンは `/api/security/csrf-token` から取得できます。

---

## サポート

技術的な質問やバグ報告は、以下にお問い合わせください：
- GitHub: https://github.com/koba06040603-ops/jiyushindo-gakushu
- 本番環境: https://8f268ac8.jiyushindo-gakushu.pages.dev
