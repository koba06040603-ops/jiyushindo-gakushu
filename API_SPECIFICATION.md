# API仕様書 - 自由進度学習支援システム

## 📋 概要

**ベースURL**: `https://jiyushindo-gakushu.com`  
**API Version**: 1.0  
**認証方式**: JWT Bearer Token  

---

## 🔑 認証

### POST /api/auth/login
ユーザーログイン

**Request Body**:
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": 1,
    "email": "student@example.com",
    "role": "student",
    "user_type": "student"
  }
}
```

### POST /api/auth/register/student
学生ユーザー登録

**Request Body**:
```json
{
  "email": "newstudent@example.com",
  "password": "SecurePass123!",
  "student_name": "山田 太郎",
  "grade_level": 5
}
```

**Response (201)**:
```json
{
  "success": true,
  "user_id": 123,
  "message": "User registered successfully"
}
```

---

## 📊 学習進捗API

### GET /api/progress/:studentId
学生の学習進捗を取得

**Headers**: `Authorization: Bearer {token}`

**Response (200)**:
```json
{
  "success": true,
  "progress": [
    {
      "progress_id": 1,
      "student_id": 1,
      "card_id": 10,
      "status": "completed",
      "mastery_score": 85.5,
      "attempt_count": 3
    }
  ]
}
```

---

## 🎯 適応学習API

### GET /api/adaptive/detect-learning-style/:studentId
学習スタイル自動検出

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "dominant_style": "visual",
    "dominant_intelligence": "spatial",
    "vark_scores": {
      "visual": 35,
      "auditory": 25,
      "reading": 20,
      "kinesthetic": 20
    },
    "confidence_level": 0.85
  }
}
```

### GET /api/adaptive/recommend/:studentId?count=5
適応型カリキュラム推奨

**Query Parameters**:
- `count` (optional): 推奨カード数（デフォルト: 5）

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "card_id": 15,
      "card_title": "分数の足し算",
      "difficulty_level": "standard",
      "match_score": 0.92,
      "reason": "Visual learner - includes diagrams"
    }
  ]
}
```

---

## 🤖 AI生成コンテンツAPI

### POST /api/ai/generate-content
学習スタイル別コンテンツ生成

**Request Body**:
```json
{
  "topic": "二次方程式の解の公式",
  "learning_style": "visual",
  "content_type": "explanation",
  "grade_level": 9
}
```

**Response (200)**:
```json
{
  "success": true,
  "content": {
    "main_content": "二次方程式 ax²+bx+c=0 の解は...",
    "visual_elements": ["図1: 放物線のグラフ", "図2: 解の公式の導出"],
    "difficulty_level": "medium"
  }
}
```

---

## 🏫 学校管理API

### GET /api/school/:schoolId/classes
学校のクラス一覧取得

**Response (200)**:
```json
{
  "success": true,
  "data": [
    {
      "class_id": 1,
      "class_code": "2024-5A",
      "class_name": "5年A組",
      "teacher_name": "鈴木 先生",
      "student_count": 32
    }
  ]
}
```

### GET /api/teacher/:teacherId/class/:classCode/analysis
クラス分析データ取得

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "class_stats": {
      "total_students": 32,
      "average_progress": 67.5,
      "completion_rate": 0.72
    },
    "top_performers": [...],
    "need_support": [...]
  }
}
```

---

## 🎮 ゲーミフィケーションAPI

### GET /api/gamification/achievements/:studentId
学生の実績取得

**Response (200)**:
```json
{
  "success": true,
  "achievements": [
    {
      "achievement_id": 1,
      "title": "連続学習7日達成",
      "description": "7日間連続で学習しました",
      "unlocked_at": "2026-01-25T10:30:00Z"
    }
  ]
}
```

---

## 📈 レポートAPI

### GET /api/school/:schoolId/report?start_date=&end_date=
学校レポートデータ取得

**Query Parameters**:
- `start_date` (optional): 開始日 (YYYY-MM-DD)
- `end_date` (optional): 終了日 (YYYY-MM-DD)

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "school_info": {...},
    "overall_stats": {
      "total_students": 450,
      "average_completion_rate": 0.68,
      "total_learning_hours": 2340
    },
    "grade_stats": [...],
    "report_period": {
      "start": "2026-01-01",
      "end": "2026-01-30"
    }
  }
}
```

---

## ❤️ ヘルスチェック

### GET /health
システムヘルスチェック

**Response (200)**:
```json
{
  "status": "healthy",
  "uptime_seconds": 3600,
  "database_status": "connected",
  "api_status": {
    "gemini": "available"
  }
}
```

---

## 🚨 エラーレスポンス

全てのAPIエンドポイントは以下の形式でエラーを返します：

**Response (400/401/403/404/500)**:
```json
{
  "success": false,
  "error": "Error message here"
}
```

**HTTPステータスコード**:
- `200`: 成功
- `201`: 作成成功
- `400`: リクエストエラー
- `401`: 認証エラー（未ログイン）
- `403`: 権限エラー（アクセス拒否）
- `404`: リソースが見つからない
- `500`: サーバーエラー

---

## 📚 データモデル

### Student（学生）
```typescript
{
  student_id: number;
  student_name: string;
  grade_level: number;      // 1-12
  email: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  created_at: string;       // ISO 8601
}
```

### LearningCard（学習カード）
```typescript
{
  card_id: number;
  subject: string;
  grade_level: number;
  unit_name: string;
  card_title: string;
  card_type: 'standard' | 'challenge' | 'review' | 'optional';
  difficulty_level: 'easy' | 'standard' | 'hard';
  problem_text: string;
  correct_answer: string;
  explanation: string;
}
```

### StudentProgress（学生進捗）
```typescript
{
  progress_id: number;
  student_id: number;
  card_id: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  attempt_count: number;
  correct_count: number;
  mastery_score: number;    // 0-100
  last_attempt_date: string;
}
```

---

## 🔐 セキュリティ

### JWT認証
全ての認証が必要なエンドポイントは、以下のヘッダーが必要：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### CORS
許可されたオリジンからのリクエストのみ受け付けます。

### レート制限
- 認証API: 10 requests/分
- その他API: 100 requests/分

---

## 📖 使用例（cURL）

### ログイン
```bash
curl -X POST https://jiyushindo-gakushu.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"pass123"}'
```

### 学習進捗取得（認証あり）
```bash
curl -X GET https://jiyushindo-gakushu.com/api/progress/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔗 関連ドキュメント

- [デプロイガイド](/DEPLOYMENT_PRODUCTION.md)
- [GitHub自動デプロイ](/GITHUB_AUTO_DEPLOY.md)
- [カスタムドメイン設定](/CUSTOM_DOMAIN_CHECKLIST.md)

---

**作成日**: 2026-01-30  
**最終更新**: 2026-01-30  
**バージョン**: 1.0
