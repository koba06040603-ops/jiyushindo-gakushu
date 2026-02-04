# バックアップ・リストア手順書

## 📋 目次

1. [バックアップ戦略](#バックアップ戦略)
2. [自動バックアップ設定](#自動バックアップ設定)
3. [手動バックアップ手順](#手動バックアップ手順)
4. [リストア手順](#リストア手順)
5. [バックアップ検証](#バックアップ検証)
6. [災害復旧計画](#災害復旧計画)

---

## バックアップ戦略

### バックアップの種類

| 種類 | 頻度 | 保持期間 | 説明 |
|------|------|----------|------|
| **フルバックアップ** | 毎日 | 30日 | 全データベースの完全バックアップ |
| **差分バックアップ** | 6時間毎 | 7日 | 前回のフルバックアップからの差分 |
| **トランザクションログ** | リアルタイム | 14日 | 変更履歴の記録 |

### 対象データ

- **Cloudflare D1 Database**: `jiyushindo-gakushu-production`
- **KVストレージ**: キャッシュデータ（オプション）
- **ユーザーアップロードファイル**: R2バケット（該当する場合）

---

## 自動バックアップ設定

### Cloudflare Workers Cronによる自動バックアップ

**wrangler.jsonc に追加:**

```jsonc
{
  "triggers": {
    "crons": [
      "0 2 * * *"  // 毎日午前2時（UTC）にバックアップ実行
    ]
  }
}
```

**src/backup-worker.ts（バックアップWorker）:**

```typescript
import { Hono } from 'hono'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// Cron Triggerで実行されるバックアップ
app.get('/backup/scheduled', async (c) => {
  try {
    const { env } = c
    const timestamp = new Date().toISOString().split('T')[0]
    
    // D1データベースのエクスポート（全テーブル）
    const tables = await env.DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      AND name NOT LIKE '_cf_%'
      AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()
    
    let backupData: any = {
      timestamp: new Date().toISOString(),
      database: 'jiyushindo-gakushu-production',
      tables: {}
    }
    
    // 各テーブルのデータをエクスポート
    for (const table of tables.results || []) {
      const tableName = table.name as string
      const data = await env.DB.prepare(`SELECT * FROM ${tableName}`).all()
      backupData.tables[tableName] = data.results
    }
    
    // KVストレージに保存（またはR2に保存）
    const backupKey = `backup-${timestamp}`
    await env.KV.put(backupKey, JSON.stringify(backupData), {
      expirationTtl: 2592000  // 30日間保持
    })
    
    console.log(`✅ バックアップ完了: ${backupKey}`)
    
    return c.json({ 
      success: true, 
      backupKey,
      tablesBackedUp: Object.keys(backupData.tables).length
    })
    
  } catch (error: any) {
    console.error('❌ バックアップエラー:', error)
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default app
```

---

## 手動バックアップ手順

### ローカル環境でのバックアップ

```bash
# 1. ローカルD1データベースのバックアップ
cd /home/user/webapp

# 2. 全テーブルをSQLファイルにエクスポート
npx wrangler d1 export jiyushindo-gakushu-production --local --output=backup-local-$(date +%Y%m%d).sql

# 3. 本番D1データベースのバックアップ
npx wrangler d1 export jiyushindo-gakushu-production --remote --output=backup-production-$(date +%Y%m%d).sql

# 4. バックアップファイルの圧縮
tar -czf backup-$(date +%Y%m%d).tar.gz backup-*.sql

# 5. 安全な場所に保存
# - AI Driveにアップロード
# - 外部ストレージ（S3, Google Driveなど）にアップロード
```

### API経由でのバックアップ

```bash
# バックアップAPIを実行（管理者権限必要）
curl -X POST https://jiyushindo-gakushu.pages.dev/backup/scheduled \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## リストア手順

### フルリストア（全データベース復元）

```bash
# 1. バックアップファイルの解凍
tar -xzf backup-20260204.tar.gz

# 2. 現在のデータベースのバックアップ（安全のため）
npx wrangler d1 export jiyushindo-gakushu-production --remote --output=pre-restore-backup.sql

# 3. リストア実行（ローカル環境）
npx wrangler d1 execute jiyushindo-gakushu-production --local --file=backup-local-20260204.sql

# 4. リストア実行（本番環境）※注意: 既存データが上書きされます
npx wrangler d1 execute jiyushindo-gakushu-production --remote --file=backup-production-20260204.sql

# 5. リストア後の検証
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="SELECT COUNT(*) FROM users;"
```

### 特定テーブルのみリストア

```bash
# 1. 特定テーブルのバックアップを抽出
grep -A 1000 "CREATE TABLE students" backup-production-20260204.sql > students-backup.sql

# 2. テーブルを削除（既存データを削除）
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="DROP TABLE IF EXISTS students;"

# 3. リストア実行
npx wrangler d1 execute jiyushindo-gakushu-production --remote --file=students-backup.sql
```

---

## バックアップ検証

### 定期的な検証（月次推奨）

```bash
# 1. バックアップファイルの整合性チェック
npx wrangler d1 execute jiyushindo-gakushu-production --local --file=backup-production-20260204.sql

# 2. レコード数の確認
npx wrangler d1 execute jiyushindo-gakushu-production --local --command="
  SELECT 
    'users' as table_name, COUNT(*) as count FROM users
  UNION ALL
  SELECT 'students', COUNT(*) FROM students
  UNION ALL
  SELECT 'teachers', COUNT(*) FROM teachers
  UNION ALL
  SELECT 'learning_sessions', COUNT(*) FROM learning_sessions;
"

# 3. データサンプルの目視確認
npx wrangler d1 execute jiyushindo-gakushu-production --local --command="SELECT * FROM users LIMIT 5;"
```

### 自動検証スクリプト

```bash
#!/bin/bash
# backup-verify.sh

BACKUP_FILE=$1
TEMP_DB="verify-$(date +%s).db"

echo "🔍 バックアップ検証開始: $BACKUP_FILE"

# テスト用DBに復元
npx wrangler d1 execute test-db --local --file=$BACKUP_FILE

# レコード数を確認
echo "📊 レコード数チェック..."
npx wrangler d1 execute test-db --local --command="
  SELECT name, (SELECT COUNT(*) FROM sqlite_master WHERE type='table') as table_count
  FROM sqlite_master WHERE type='database';
"

# データ整合性チェック
echo "✅ 整合性チェック..."
npx wrangler d1 execute test-db --local --command="PRAGMA integrity_check;"

echo "✅ バックアップ検証完了"
```

---

## 災害復旧計画（Disaster Recovery Plan）

### 復旧時間目標（RTO）と復旧ポイント目標（RPO）

| 指標 | 目標 | 説明 |
|------|------|------|
| **RTO** | 1時間以内 | システム復旧までの最大許容時間 |
| **RPO** | 6時間以内 | データ損失の最大許容時間 |

### 災害シナリオと対応手順

#### シナリオ1: データベース破損

**兆候:**
- クエリエラーが多発
- データの不整合

**対応手順:**

```bash
# 1. システムをメンテナンスモードに設定
echo "MAINTENANCE_MODE=true" > .env

# 2. 直近のバックアップからリストア
npx wrangler d1 execute jiyushindo-gakushu-production --remote --file=backup-latest.sql

# 3. データ整合性チェック
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="PRAGMA integrity_check;"

# 4. アプリケーション再起動
npx wrangler pages deploy dist --project-name jiyushindo-gakushu

# 5. メンテナンスモード解除
echo "MAINTENANCE_MODE=false" > .env
```

#### シナリオ2: 誤った大量削除

**対応手順:**

```bash
# 1. 即座にデータベースの現状をバックアップ
npx wrangler d1 export jiyushindo-gakushu-production --remote --output=emergency-backup.sql

# 2. 削除前のバックアップを特定
ls -lht backup-production-*.sql | head -5

# 3. ポイントインタイムリストア（削除前の状態に戻す）
npx wrangler d1 execute jiyushindo-gakushu-production --remote --file=backup-production-20260204-01.sql

# 4. データ検証
npx wrangler d1 execute jiyushindo-gakushu-production --remote --command="SELECT COUNT(*) FROM users;"
```

#### シナリオ3: Cloudflareサービス障害

**対応手順:**

1. **Cloudflare Statusページを確認**: https://www.cloudflarestatus.com/
2. **バックアップデータをローカルに保存**
3. **代替ホスティング環境にデプロイ**（Vercel, Netlifyなど）
4. **DNSをフェイルオーバー先に切り替え**
5. **Cloudflare復旧後、データを同期**

---

## バックアップチェックリスト

### 日次タスク（自動）

- [ ] フルバックアップ実行（午前2時UTC）
- [ ] バックアップ成功通知の確認
- [ ] 前日のバックアップファイルの存在確認

### 週次タスク（手動）

- [ ] バックアップファイルの整合性検証
- [ ] リストアテスト（ステージング環境）
- [ ] ディスク使用量の確認

### 月次タスク（手動）

- [ ] フルリストアテスト（本番環境と同じ構成）
- [ ] 災害復旧訓練
- [ ] バックアップ保持ポリシーの見直し
- [ ] 古いバックアップの削除

---

## トラブルシューティング

### バックアップが失敗する

**原因:**
- ディスク容量不足
- 権限エラー
- ネットワークタイムアウト

**対処法:**

```bash
# ディスク容量確認
df -h

# Wranglerの認証確認
npx wrangler whoami

# ログ確認
npx wrangler d1 export jiyushindo-gakushu-production --remote --output=test.sql 2>&1 | tee backup-error.log
```

### リストアが途中で停止する

**原因:**
- SQLファイルの構文エラー
- 大きすぎるファイル

**対処法:**

```bash
# SQLファイルの構文チェック
sqlite3 < backup-production.sql

# ファイルを分割してリストア
split -l 10000 backup-production.sql backup-part-

# 分割ファイルを順次リストア
for file in backup-part-*; do
  npx wrangler d1 execute jiyushindo-gakushu-production --remote --file=$file
done
```

---

## 参考リンク

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Disaster Recovery Best Practices](https://www.cloudflare.com/learning/cloud/what-is-disaster-recovery/)

---

**最終更新**: 2026-02-04  
**担当者**: システム管理者  
**レビュー**: 月次
