#!/bin/bash

echo "========== D1データベース確認 =========="
echo ""
echo "📊 カリキュラム一覧を取得..."
npx wrangler d1 execute webapp-production --local --command="SELECT id, grade, subject, unit_name, created_at FROM curriculum ORDER BY created_at DESC LIMIT 5"

echo ""
echo "📊 コース一覧を取得..."
npx wrangler d1 execute webapp-production --local --command="SELECT id, curriculum_id, course_name FROM courses LIMIT 10"

echo ""
echo "📊 カリキュラム総数..."
npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) as total FROM curriculum"
