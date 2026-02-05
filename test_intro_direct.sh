#!/bin/bash

echo "=========================================="
echo "導入問題生成テスト（本番環境）"
echo "=========================================="
echo ""
echo "カリキュラムID: 50"
echo "単元: 小学6年 国語「海の命」"
echo ""

# 最新デプロイURL
URL="https://a99674e6.jiyushindo-learning.pages.dev"

echo "🔄 導入問題を生成中..."
echo ""

curl -X POST "${URL}/api/curriculum/50/generate-intro-problems" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTPステータス: %{http_code}\n" \
  -s | jq '.'

echo ""
echo "=========================================="
