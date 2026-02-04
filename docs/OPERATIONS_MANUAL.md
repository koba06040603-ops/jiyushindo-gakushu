# 運用マニュアル - 自由進度学習支援システム

**バージョン**: 1.0  
**最終更新**: 2026-02-04

---

## 📋 目次

1. [システム概要](#システム概要)
2. [日常運用](#日常運用)
3. [ユーザー管理](#ユーザー管理)
4. [データ管理](#データ管理)
5. [セキュリティ管理](#セキュリティ管理)
6. [パフォーマンス監視](#パフォーマンス監視)
7. [緊急時対応](#緊急時対応)

---

## システム概要

### アーキテクチャ
- **フロントエンド**: HTML/CSS/JavaScript (Tailwind CSS)
- **バックエンド**: Hono (Cloudflare Workers)
- **データベース**: Cloudflare D1 (SQLite)
- **ホスティング**: Cloudflare Pages
- **PWA対応**: Service Worker + Web App Manifest

### 本番環境URL
- メインURL: https://8f268ac8.jiyushindo-gakushu.pages.dev
- ダッシュボード: /dashboard.html
- 保護者ダッシュボード: /parent-dashboard.html
- セキュリティダッシュボード: /security-dashboard.html
- パフォーマンス監視: /performance-dashboard.html

---

## 日常運用

### 毎日のタスク

#### 1. システムヘルスチェック（9:00）
1. パフォーマンス監視ダッシュボードにアクセス
2. システム状態を確認（正常/異常）
3. エラー率が5%以上の場合は調査
4. 平均応答時間が1000ms以上の場合は調査

#### 2. エラーログレビュー（14:00）
1. セキュリティダッシュボードにアクセス
2. 過去24時間のエラーログを確認
3. 重大なエラー（critical/error）を優先対応
4. 繰り返し発生するエラーの根本原因を調査

#### 3. ユーザーサポート（随時）
1. ログインできないユーザーの確認
2. データが正しく表示されない問題の調査
3. パフォーマンスに関する問い合わせ対応

### 週次タスク

#### 毎週月曜日（10:00）
1. **週次レポート作成**
   - 総ユーザー数、アクティブユーザー数
   - 学習ログ総数、平均正答率
   - システム稼働率
   - エラー発生率

2. **データベースメンテナンス**
   ```bash
   # 古いログの削除（90日以上前）
   npx wrangler d1 execute jiyushindo-gakushu-production --remote \
     --command="DELETE FROM performance_metrics WHERE created_at < datetime('now', '-90 days')"
   ```

3. **セキュリティスキャン実行**
   - セキュリティダッシュボードでスキャン実行
   - 推奨事項の確認と対応計画作成

### 月次タスク

#### 毎月1日（13:00）
1. **バックアップ確認**
   - Cloudflare D1の自動バックアップ確認
   - 必要に応じて手動バックアップ実行

2. **パフォーマンスレポート作成**
   - 月間平均応答時間
   - 月間エラー率
   - 月間総リクエスト数
   - ピーク時間帯の分析

3. **セキュリティレビュー**
   - 監査ログの精査
   - 不審なアクセスパターンの確認
   - パスワードポリシーの見直し

---

## ユーザー管理

### 新規ユーザー登録

#### 教師アカウント作成
```sql
-- auth_usersテーブルに挿入
INSERT INTO auth_users (username, password_hash, full_name, user_role, school_id, is_active)
VALUES ('teacher2', '$2a$10$...', '鈴木花子', 'teacher', 1, 1);

-- teachersテーブルに挿入
INSERT INTO teachers (teacher_name, email, school_id)
VALUES ('鈴木花子', 'suzuki@example.com', 1);

-- auth_teachersテーブルに関連付け
INSERT INTO auth_teachers (user_id, teacher_id, school_id)
VALUES (2, 2, 1);
```

#### 学生アカウント作成
```sql
-- auth_usersテーブルに挿入
INSERT INTO auth_users (username, password_hash, full_name, user_role, school_id, is_active)
VALUES ('student2', '$2a$10$...', '佐藤次郎', 'student', 1, 1);

-- studentsテーブルに挿入
INSERT INTO students (student_name, grade_level, school_id)
VALUES ('佐藤次郎', 3, 1);
```

### ユーザー無効化
```sql
UPDATE auth_users 
SET is_active = 0 
WHERE username = 'student1';
```

### パスワードリセット
```bash
# bcryptでハッシュ化した新しいパスワードを設定
npx wrangler d1 execute jiyushindo-gakushu-production --remote \
  --command="UPDATE auth_users SET password_hash = '$2a$10$...' WHERE username = 'teacher1'"
```

---

## データ管理

### データエクスポート

#### 学習ログのエクスポート
1. 管理者アカウントでログイン
2. `/api/export/learning-logs` にアクセス
3. CSVファイルがダウンロードされる

#### カリキュラムのエクスポート
1. 管理者アカウントでログイン
2. `/api/export/curriculum` にアクセス
3. CSVファイルがダウンロードされる

### データクリーンアップ

#### 古いセッションの削除
```sql
DELETE FROM auth_sessions 
WHERE expires_at < datetime('now');
```

#### 古いパフォーマンスメトリクスの削除
```sql
DELETE FROM performance_metrics 
WHERE created_at < datetime('now', '-90 days');
```

---

## セキュリティ管理

### 定期的なセキュリティチェック

#### セキュリティスキャン（週1回）
1. セキュリティダッシュボードにアクセス
2. 「スキャン実行」ボタンをクリック
3. 結果を確認し、推奨事項を実施

#### 監査ログレビュー（日次）
1. セキュリティダッシュボードの監査ログを確認
2. 不審なアクティビティを検出
3. 必要に応じてユーザーアカウントを無効化

### セキュリティインシデント対応

#### 不正アクセスの疑い
1. 該当ユーザーのアカウントを即座に無効化
2. 監査ログから詳細を調査
3. 必要に応じてパスワードリセットを実施
4. インシデントレポート作成

#### データ漏洩の疑い
1. 影響範囲を特定
2. 該当データへのアクセスを即座に遮断
3. ステークホルダーに報告
4. 再発防止策の策定

---

## パフォーマンス監視

### 監視項目

#### 応答時間
- **正常**: 平均 < 500ms
- **注意**: 平均 500-1000ms
- **警告**: 平均 > 1000ms

#### エラー率
- **正常**: < 1%
- **注意**: 1-5%
- **警告**: > 5%

#### システム稼働率
- **目標**: 99.9% (月間)

### アラート設定

#### 高エラー率アラート
- 閾値: 5%
- 通知方法: Email
- 対応: 即座にエラーログを確認し、原因を特定

#### 応答時間アラート
- 閾値: 1000ms
- 通知方法: Email
- 対応: ボトルネックを特定し、最適化を実施

---

## 緊急時対応

### システムダウン時

#### 1. 状況確認（5分以内）
- ヘルスチェックAPIにアクセス: `/api/performance/health`
- Cloudflare Pages ダッシュボードで稼働状態確認
- エラーログの確認

#### 2. 一時的な対応（10分以内）
- ユーザーに状況を通知（メンテナンス画面）
- Cloudflare Pages の再デプロイ
- データベース接続の確認

#### 3. 根本原因の特定（30分以内）
- エラーログの詳細分析
- パフォーマンスメトリクスの確認
- 外部依存サービスの状態確認

#### 4. 復旧（60分以内）
- 問題の修正とデプロイ
- 動作確認
- ユーザーへの復旧通知

### データベースエラー時

#### 1. バックアップからの復旧
```bash
# Cloudflare D1 バックアップから復元
npx wrangler d1 restore jiyushindo-gakushu-production <backup-id>
```

#### 2. データ整合性チェック
```sql
-- 主要テーブルの件数確認
SELECT 'students' as table_name, COUNT(*) as count FROM students
UNION ALL
SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL
SELECT 'learning_logs', COUNT(*) FROM learning_logs;
```

---

## 連絡先

### 技術サポート
- GitHub Issues: https://github.com/koba06040603-ops/jiyushindo-gakushu/issues

### 緊急連絡先
- システム管理者: （連絡先を記入）
- Cloudflare サポート: https://dash.cloudflare.com/

---

## 付録

### 便利なコマンド集

```bash
# データベース接続テスト
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="SELECT 1"

# テーブル一覧
npx wrangler d1 execute jiyushindo-gakushu-production --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# ユーザー数確認
npx wrangler d1 execute jiyushindo-gakushu-production --remote \
  --command="SELECT user_role, COUNT(*) as count FROM auth_users GROUP BY user_role"

# 本日の学習ログ数
npx wrangler d1 execute jiyushindo-gakushu-production --remote \
  --command="SELECT COUNT(*) as count FROM learning_logs WHERE DATE(created_at) = DATE('now')"
```

---

**このマニュアルは定期的に更新してください。**
