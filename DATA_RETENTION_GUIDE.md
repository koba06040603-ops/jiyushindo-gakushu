# 📦 データ長期保存ガイド

**自由進度学習支援システム - データ保存戦略**  
**最終更新**: 2026年1月20日

---

## 目次

1. [保存戦略の概要](#1-保存戦略の概要)
2. [推奨方式：自動エクスポート](#2-推奨方式自動エクスポート)
3. [オプション：Cloudflare R2ストレージ](#3-オプションcloudflare-r2ストレージ)
4. [オプション：学校NAS連携](#4-オプション学校nas連携)
5. [データ復元手順](#5-データ復元手順)
6. [卒業時のデータ引き継ぎ](#6-卒業時のデータ引き継ぎ)

---

## 1. 保存戦略の概要

### 🎯 目的

**子どもたちの振り返り文章を永久保存**しながら、**サーバーに負担をかけない**方式を実現します。

### 📊 3つの保存オプション比較

| 項目 | 自動エクスポート | R2ストレージ | 学校NAS |
|-----|----------------|-------------|---------|
| **コスト** | 無料 | 月100円 | 無料 |
| **サーバー負担** | なし | 極小 | なし |
| **閲覧方法** | Excel | システム | Excel |
| **インターネット** | 不要 | 必要 | 不要 |
| **推奨度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 2. 推奨方式：自動エクスポート

### 🎯 概要

毎月末に全生徒の振り返りデータを自動でCSVファイルに出力し、学校のファイルサーバーに保存します。

### ✅ メリット

- **完全無料**: 追加コストゼロ
- **学校管理**: データは学校が完全に所有
- **サーバー負担なし**: クラウドストレージ不使用
- **オフライン閲覧**: インターネット不要でExcelで開ける
- **長期保存**: 10年でも80MB程度

### 📅 実装スケジュール

```
毎月末 深夜2時:
  ├── システムが全生徒データをCSV生成
  ├── 学校指定フォルダに自動保存
  ├── 管理者にメール通知
  └── 前月分データを圧縮してアーカイブ
```

### 📁 ファイル構造

```
/school-data/
├── 2026/
│   ├── 01/
│   │   ├── reflections_2026_01.csv (全生徒の振り返り)
│   │   ├── progress_2026_01.csv (進捗データ)
│   │   └── observations_2026_01.csv (教師の見取り)
│   ├── 02/
│   │   └── ...
│   └── 12/
│       └── ...
├── 2027/
│   └── ...
└── archive/
    ├── 2026_full_backup.zip (年度末の完全バックアップ)
    └── 2027_full_backup.zip
```

### 💾 データ量試算

```
生徒数: 100名
振り返り頻度: 週1回 × 40週 = 年間40回
1回あたり: 約2KB (テキストのみ)

月間データ量:
  100名 × 4回 × 2KB = 800KB (約1MB未満)

年間データ量:
  100名 × 40回 × 2KB = 8MB

10年間保存:
  8MB × 10年 = 80MB (USBメモリ1本で十分)
```

### 🔧 実装コード（管理者向け）

システムに以下のAPIを追加済みです：

```typescript
// 全生徒の振り返りデータをエクスポート
GET /api/export/all-reflections/csv?year=2026&month=01

// レスポンス: CSV形式
学生番号,氏名,振り返り日,カリキュラム,学んだこと,理解したこと,難しかったこと,...
001,山田太郎,2026-01-15,かけ算の筆算,くり上がりの方法,位を揃えること,...
```

### 📋 管理者マニュアル

#### **月次エクスポート手順**（手動の場合）

1. システムに管理者としてログイン
2. 「データ管理」→「一括エクスポート」メニューを開く
3. 対象年月を選択（例：2026年1月）
4. 「エクスポート開始」ボタンをクリック
5. ダウンロードされたCSVを以下に保存：
   ```
   \\server\school-data\2026\01\reflections_2026_01.csv
   ```
6. エクスポートログを確認（成功件数を記録）

#### **自動エクスポート設定**（推奨）

```yaml
# 学校のPCで以下のスケジュールタスクを設定

タスク名: 月次振り返りエクスポート
実行タイミング: 毎月1日 2:00
実行コマンド:
  curl -o "\\server\school-data\$(date +%Y)\$(date +%m)\reflections_$(date +%Y_%m).csv" \
    "https://your-system.pages.dev/api/export/all-reflections/csv?year=$(date +%Y)&month=$(date +%m)"

通知先: admin@school.jp
```

---

## 3. オプション：Cloudflare R2ストレージ

### 🎯 概要

クラウドストレージに直接保存し、システムから直接閲覧できる方式です。

### ✅ メリット

- **システム統合**: アプリから直接過去データ閲覧可能
- **低コスト**: 月額100円程度
- **自動バックアップ**: 手動作業不要
- **高可用性**: 99.9%稼働保証

### 💰 コスト詳細

```
Cloudflare R2料金（2026年1月時点）:

ストレージ料金:
  $0.015 per GB/月
  
読み取り操作:
  無料（Class B: 10,000回/秒まで）
  
書き込み操作:
  $4.50 per 100万回
  実質無料（月1,000回程度の書き込み）

実際のコスト試算:
  100名 × 10年分データ = 80MB
  月額: 80MB × $0.015/GB = 約0.2円
  
  ※実際は画像データ等も含めて月額100円程度を想定
```

### 🔧 実装手順

#### ステップ1: R2バケット作成

```bash
# Wrangler CLIで実行（管理者PC）
npx wrangler r2 bucket create jiyushindo-reflections

# 出力例:
Created bucket 'jiyushindo-reflections'
```

#### ステップ2: wrangler.jsonc設定

```jsonc
{
  "name": "jiyushindo-gakushu",
  "r2_buckets": [
    {
      "binding": "REFLECTIONS_BUCKET",
      "bucket_name": "jiyushindo-reflections"
    }
  ]
}
```

#### ステップ3: システムコード追加

```typescript
// 振り返り保存時に自動的にR2へもバックアップ
app.post('/api/reflections', async (c) => {
  const { env } = c
  const data = await c.req.json()
  
  // 通常のDB保存
  await env.DB.prepare(
    `INSERT INTO student_reflections (student_id, content, ...) VALUES (?, ?, ...)`
  ).bind(data.studentId, data.content, ...).run()
  
  // R2に長期保存用コピー（非同期）
  const key = `reflections/${data.studentId}/${new Date().toISOString()}.json`
  await env.REFLECTIONS_BUCKET.put(key, JSON.stringify(data))
  
  return c.json({ success: true })
})

// 過去データの取得
app.get('/api/reflections/history/:studentId', async (c) => {
  const { env } = c
  const studentId = c.req.param('studentId')
  
  // R2から全期間のデータを取得
  const list = await env.REFLECTIONS_BUCKET.list({
    prefix: `reflections/${studentId}/`
  })
  
  const reflections = []
  for (const item of list.objects) {
    const obj = await env.REFLECTIONS_BUCKET.get(item.key)
    reflections.push(await obj.json())
  }
  
  return c.json({ reflections })
})
```

### 📊 R2ダッシュボード

管理者は以下のURLで使用状況を確認できます：
```
https://dash.cloudflare.com/
→ R2
→ jiyushindo-reflections
→ メトリクス（ストレージ使用量、リクエスト数）
```

---

## 4. オプション：学校NAS連携

### 🎯 概要

学校の既存ファイルサーバー（NAS）に直接保存する方式です。

### ✅ メリット

- **完全に学内管理**: インターネット不要
- **無制限容量**: 既存設備を活用
- **セキュリティ**: 学校ネットワーク内のみアクセス
- **コスト無料**: 追加費用なし

### 🔧 実装手順

#### ステップ1: NAS共有フォルダ作成

```
NASサーバー: \\nas-server\education
共有フォルダ: \\nas-server\education\jiyushindo-data

アクセス権限:
  - 読み取り: 全教職員
  - 書き込み: システム管理者のみ
```

#### ステップ2: エクスポートスクリプト設置

学校の管理者PCに以下のスクリプトを設置：

```powershell
# export-to-nas.ps1
# 毎月1日深夜2時に実行

$year = Get-Date -Format "yyyy"
$month = Get-Date -Format "MM"
$date = Get-Date -Format "yyyy-MM-dd"

# システムからCSVをダウンロード
$url = "https://your-system.pages.dev/api/export/all-reflections/csv?year=$year&month=$month"
$output = "\\nas-server\education\jiyushindo-data\$year\$month\reflections_${year}_${month}.csv"

# ディレクトリ作成
New-Item -ItemType Directory -Force -Path "\\nas-server\education\jiyushindo-data\$year\$month"

# ダウンロード実行
Invoke-WebRequest -Uri $url -OutFile $output

# ログ記録
Add-Content "\\nas-server\education\jiyushindo-data\export-log.txt" "$date - Export completed: $output"

# 管理者にメール通知（オプション）
Send-MailMessage `
  -To "admin@school.jp" `
  -From "system@school.jp" `
  -Subject "振り返りデータエクスポート完了" `
  -Body "エクスポート完了: $output" `
  -SmtpServer "mail.school.jp"
```

#### ステップ3: Windowsタスクスケジューラ登録

```
1. タスクスケジューラを開く
2. 「タスクの作成」
3. 全般タブ:
   名前: 月次振り返りエクスポート
   ユーザー: システム管理者アカウント
   最上位の特権で実行: チェック
   
4. トリガータブ:
   新規 → 月次 → 1日 → 2:00
   
5. 操作タブ:
   プログラム: powershell.exe
   引数: -File "C:\scripts\export-to-nas.ps1"
   
6. 設定タブ:
   失敗した場合は再実行: 3回
```

---

## 5. データ復元手順

### 🔄 CSVからシステムへの復元

万が一データベースが破損した場合、CSVから復元できます：

```bash
# 1. システムにログイン（管理者）

# 2. 復元APIを呼び出し
curl -X POST https://your-system.pages.dev/api/restore/reflections \
  -F "csv=@reflections_2026_01.csv" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 3. 復元結果確認
{
  "success": true,
  "imported": 3000,
  "skipped": 0,
  "errors": []
}
```

### 📋 復元時の注意点

- 既存データとの重複チェック：同一学生・同一日付の振り返りは上書きされません
- 文字化け防止：CSVはUTF-8 BOM付きで保存されているため自動認識
- エラーハンドリング：不正なデータはスキップされログに記録

---

## 6. 卒業時のデータ引き継ぎ

### 🎓 保護者へのデータ配布

卒業時に、6年間の成長記録を保護者へお渡しする手順：

#### **方式A: USBメモリ配布（推奨）**

```
1. システムから個人データをエクスポート
   GET /api/export/student/:studentId/full
   
2. 出力されるファイル:
   山田太郎_学習記録_6年間.zip
   ├── reflections.csv (振り返り全文)
   ├── progress.csv (学習進捗)
   ├── observations.csv (教師の見取り)
   ├── achievements.csv (成果物一覧)
   └── summary.pdf (6年間の成長レポート)

3. USBメモリにコピーして配布
   容量: 1人あたり約50MB（6年分）
   コスト: USBメモリ 約300円/本
```

#### **方式B: 保護者マイページからダウンロード**

```
1. 保護者が保護者用アカウントでログイン
2. 「卒業データダウンロード」メニューを開く
3. 「6年間のデータをダウンロード」ボタンをクリック
4. ZIPファイルがダウンロード（パスワード保護オプション）
```

#### **配布時の説明文サンプル**

```markdown
お子様の6年間の学習記録

保護者各位

お子様の小学校6年間の学習記録をお渡しします。
このデータには以下が含まれています：

【収録内容】
✅ 振り返り文章（約240回分）
✅ 学習進捗記録
✅ 教師の観察記録
✅ 成果物・作品
✅ AI成長分析レポート

【ファイルの開き方】
- reflections.csv: Microsoft Excelで開けます
- summary.pdf: PDFリーダーで開けます

【保管について】
- 大切な思い出として保管してください
- 進学先への提出は不要です
- 10年後にお子様と一緒に見返すと
  成長を実感できます

【注意事項】
- 個人情報が含まれますので大切に保管してください
- SNS等への公開はご遠慮ください

[学校名]
[担任名]
[日付]
```

---

## 7. よくある質問

### Q1: 自動エクスポートが失敗した場合は？

**A**: 管理者にメールで通知され、手動で再実行できます。

```
失敗パターン:
1. ネットワークエラー
   → 再実行で解決（自動リトライ3回）

2. 保存先フォルダがない
   → フォルダを作成して再実行

3. ディスク容量不足
   → 古いバックアップを削除

手動再実行コマンド:
curl "https://your-system.pages.dev/api/export/reflections/csv" \
  -o "reflections_backup.csv"
```

---

### Q2: 3ヶ月以上前のデータを見たい場合は？

**A**: エクスポート済みCSVをExcelで開いて検索できます。

```
手順:
1. \\nas-server\education\jiyushindo-data\2025\09\
   にある reflections_2025_09.csv を開く
   
2. Excel の「フィルター」機能で特定の生徒を検索
   例: 学生番号=001 の山田太郎さんのデータのみ表示
   
3. 必要に応じてPDF化して面談資料として使用
```

---

### Q3: システム移行時にデータを引き継げますか？

**A**: はい、標準的なCSV形式なのでどんなシステムでも読み込めます。

```
対応形式:
✅ CSV (Excel, Google Sheets等で開ける)
✅ JSON (プログラムで処理可能)
✅ PDF (印刷・保管用)

他システムへのインポート例:
- Google Classroom
- Microsoft Teams for Education
- 独自開発システム
- AI分析ツール
```

---

## 8. 管理者チェックリスト

### 月次作業（毎月1日）

```
□ 前月のエクスポートが正常に完了したか確認
□ ファイルサイズが妥当か確認（急激な増加は異常）
□ バックアップファイルが開けるかテスト
□ ディスク容量を確認（残り10GB以上推奨）
```

### 年次作業（年度末）

```
□ 全学年のデータを年度別フォルダに整理
□ 卒業生データを保護者配布用に準備
□ 過去3年分のデータを圧縮してアーカイブ
□ 不要になった古いバックアップを削除
```

### 緊急時対応

```
□ バックアップの保存場所を全教職員に周知
□ 復元手順書を印刷して保管
□ システム管理者の連絡先を掲示
```

---

## 9. サポート連絡先

データ保存に関するご質問・トラブル時は：

```
システム管理者: [担当教諭名]
内線: [内線番号]
メール: admin@school.jp
受付時間: 平日 9:00-17:00
```

技術サポート:
```
開発者サポート（緊急時のみ）
GitHub: https://github.com/koba06040603-ops/jiyushindo-gakushu
Issue報告: 上記リポジトリの「Issues」タブから
```

---

**最終更新**: 2026年1月20日  
**次回見直し**: 2027年1月（年1回更新）  
**承認**: [学校長署名]
