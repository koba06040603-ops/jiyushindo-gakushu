# index.tsx モジュール分割計画

## 現状分析

- **ファイルサイズ**: 23,505行、788KB
- **問題点**: すべてのAPIエンドポイントが1ファイルに集中
- **影響**: ビルド時間増加、メンテナンス性低下、Git差分が大きい

## 分割戦略

### 🎯 目標
- index.tsxを10個のモジュールに分割
- 各モジュールは2,000-3,000行以内
- 機能別に明確に分離

### 📦 モジュール構成

#### 1. `src/routes/auth.ts` - 認証関連
- POST /api/auth/register/student
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/change-password
- 認証ミドルウェア

#### 2. `src/routes/admin.ts` - 管理者機能
- GET /api/admin/system-status
- GET /api/admin/cache-stats
- GET /api/admin/dashboard
- 管理者専用エンドポイント

#### 3. `src/routes/student.ts` - 学生機能
- GET /api/student/progress
- 学生プロフィール
- 学習履歴

#### 4. `src/routes/ai-tutor.ts` - AIチューター
- POST /api/ai-tutor/ask
- GET /api/ai-tutor/history
- GET /api/ai-tutor/suggestions
- POST /api/ai-tutor/feedback

#### 5. `src/routes/problem-generator.ts` - 問題生成
- POST /api/problems/generate
- GET /api/problems/history
- GET /api/problems/performance
- POST /api/problems/:id/submit

#### 6. `src/routes/feedback.ts` - フィードバック
- POST /api/feedback/grade
- POST /api/feedback/explanation
- GET /api/feedback/advice
- GET /api/feedback/weekly-report
- GET /api/feedback/monthly-report

#### 7. `src/routes/learning-path.ts` - 学習経路
- GET /api/learning-path/mastery
- GET /api/learning-path/curriculum
- GET /api/learning-path/prediction
- POST /api/learning-path/reinforcement
- GET /api/learning-path/weak-areas

#### 8. `src/routes/gamification.ts` - ゲーミフィケーション
- GET /api/gamification/badges
- GET /api/gamification/level
- GET /api/gamification/streak
- POST /api/gamification/activity
- GET /api/gamification/messages

#### 9. `src/routes/cognitive.ts` - 認知科学最適化
- POST /api/cognitive/cards
- GET /api/cognitive/cards/:id
- POST /api/cognitive/cards/:id/review
- GET /api/cognitive/due
- GET /api/cognitive/stats

#### 10. `src/routes/monitoring.ts` - モニタリング
- GET /health
- GET /api/admin/performance-metrics
- キャッシュ管理
- パフォーマンス追跡

### 🔧 実装方法

#### ステップ1: ルーターファイル作成
各カテゴリーごとに独立したルーターファイルを作成

#### ステップ2: エンドポイント移行
index.tsxから各ルーターにコピー＆ペースト

#### ステップ3: index.tsxで統合
```typescript
import { Hono } from 'hono'
import authRoutes from './routes/auth'
import adminRoutes from './routes/admin'
// ... 他のルーター

const app = new Hono()

// ルーターを統合
app.route('/api/auth', authRoutes)
app.route('/api/admin', adminRoutes)
// ...

export default app
```

## ⚠️ 注意事項

### リスク
- **ビルドエラー**: 依存関係の循環参照
- **型エラー**: 共有型定義の管理
- **動作検証**: すべてのエンドポイントのテストが必要

### 軽減策
- 段階的な移行（1モジュールずつ）
- 各ステップでビルド＆テスト
- Git commitを細かく分ける

## 📊 期待効果

- **メンテナンス性**: ファイルサイズ80%削減
- **ビルド時間**: 若干の改善（HMR高速化）
- **可読性**: 機能別に整理され、理解しやすい
- **Git差分**: 変更箇所が明確に

## 🚀 実装優先度

### 今回実施する分割
時間とリスクを考慮し、**最も重要な3モジュール**のみ分割：

1. **ゲーミフィケーション** (gamification.ts) - 最近追加、独立性が高い
2. **フィードバック** (feedback.ts) - 明確な境界
3. **学習経路** (learning-path.ts) - 独立したロジック

### 将来の分割
残りのモジュールは次のフェーズで実施

## 📝 結論

**今回の方針**:
- 完全な分割は時間がかかりすぎる
- 重要な3モジュールのみ分割（リスク最小化）
- 効果は限定的だが、将来の拡張に備える
