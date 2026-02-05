# パフォーマンステスト結果

## 1. バンドルサイズ分析

### 現在の状態
- **Workerバンドル**: 695.43 KB / 10 MB制限 = 6.95%
- **余裕**: 9,304.57 KB = 93.05%

### ファイルサイズ詳細
-rw-r--r-- 1 user user 680K Feb  5 01:46 dist/_worker.js

### 主要HTMLファイル
-rw-r--r-- 1 user user  18K Jan 30 04:00 public/adaptive-learning-demo.html
-rw-r--r-- 1 user user  22K Feb  3 02:43 public/admin-preview.html
-rw-r--r-- 1 user user  30K Jan 30 00:07 public/advanced-features-demo.html
-rw-r--r-- 1 user user  29K Feb  4 11:30 public/ai-tutor.html
-rw-r--r-- 1 user user 8.1K Jan 30 07:03 public/api-docs.html
-rw-r--r-- 1 user user  22K Jan 30 03:23 public/auth-demo.html
-rw-r--r-- 1 user user  19K Feb  4 05:58 public/cache-dashboard.html
-rw-r--r-- 1 user user  21K Feb  4 23:16 public/cognitive-learning.html
-rw-r--r-- 1 user user  17K Jan 29 23:19 public/collaborative-reports-demo.html
-rw-r--r-- 1 user user  19K Feb  4 05:56 public/dashboard.html

## 2. ソースコード分析

### TypeScriptファイル行数
  31608 total
    418 adaptive-learning.ts
    419 ai-content-generator.ts
    994 ai-feedback.ts
    499 ai-tutor.ts
    428 auth.ts
    704 cache.ts
    488 gamification.ts
    636 learning-path.ts
    388 monitoring-advanced.ts
    295 monitoring.ts
    777 problem-generator.ts
    612 report-generator.ts
    424 school-management.ts
    327 spaced-repetition.ts
    672 websocket.ts
