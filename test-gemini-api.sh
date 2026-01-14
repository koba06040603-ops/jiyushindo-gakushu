#!/bin/bash

# Gemini API動作確認スクリプト

echo "🔍 Gemini API動作確認テスト"
echo "================================"
echo ""

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# テスト環境の選択
ENV=$1
if [ "$ENV" = "prod" ]; then
    BASE_URL="https://jiyushindo-gakushu.pages.dev"
    echo "📍 テスト環境: 本番環境"
elif [ "$ENV" = "dev" ]; then
    BASE_URL="http://localhost:3000"
    echo "📍 テスト環境: 開発環境"
else
    echo "${YELLOW}使用法: ./test-gemini-api.sh [dev|prod]${NC}"
    echo ""
    echo "例:"
    echo "  ./test-gemini-api.sh dev   # 開発環境でテスト"
    echo "  ./test-gemini-api.sh prod  # 本番環境でテスト"
    exit 1
fi

echo "🌐 URL: $BASE_URL"
echo ""

# ログインしてトークンを取得（本番環境の場合）
if [ "$ENV" = "prod" ]; then
    echo "🔐 ログイン中..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "demo@school.jp",
            "password": "demo123"
        }')
    
    SESSION_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"session_token":"[^"]*"' | cut -d'"' -f4)
    
    if [ -z "$SESSION_TOKEN" ]; then
        echo "${RED}❌ ログイン失敗${NC}"
        echo "レスポンス: $LOGIN_RESPONSE"
        exit 1
    fi
    
    echo "${GREEN}✅ ログイン成功${NC}"
    echo ""
fi

# テスト1: AI先生APIテスト
echo "📝 テスト1: AI先生API"
echo "---"

if [ "$ENV" = "prod" ]; then
    AI_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/ask" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SESSION_TOKEN" \
        -d '{
            "studentId": 1,
            "curriculumId": 1,
            "cardId": 1,
            "question": "分数の足し算を教えてください",
            "context": "{\"card_title\":\"分数の計算\"}",
            "sessionId": "test-session-'$(date +%s)'"
        }')
else
    AI_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/ask" \
        -H "Content-Type: application/json" \
        -d '{
            "studentId": 1,
            "curriculumId": 1,
            "cardId": 1,
            "question": "分数の足し算を教えてください",
            "context": "{\"card_title\":\"分数の計算\"}",
            "sessionId": "test-session-'$(date +%s)'"
        }')
fi

# エラーチェック
if echo "$AI_RESPONSE" | grep -q "Gemini APIキーが設定されていません"; then
    echo "${RED}❌ Gemini APIキーが設定されていません${NC}"
    echo ""
    echo "設定方法:"
    echo "  開発環境: .dev.varsファイルにGEMINI_API_KEYを設定"
    echo "  本番環境: npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu"
    exit 1
elif echo "$AI_RESPONSE" | grep -q "error"; then
    echo "${RED}❌ エラーが発生しました${NC}"
    echo "レスポンス: $AI_RESPONSE"
    exit 1
elif echo "$AI_RESPONSE" | grep -q "answer"; then
    echo "${GREEN}✅ AI先生が正常に応答しました${NC}"
    ANSWER=$(echo $AI_RESPONSE | grep -o '"answer":"[^"]*"' | cut -d'"' -f4)
    echo ""
    echo "【AI先生の回答】"
    echo "$ANSWER"
    echo ""
else
    echo "${YELLOW}⚠️  予期しないレスポンス${NC}"
    echo "レスポンス: $AI_RESPONSE"
fi

echo ""
echo "---"

# テスト2: 対話履歴取得テスト
echo "📚 テスト2: 対話履歴取得API"
echo "---"

SESSION_ID=$(echo $AI_RESPONSE | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$SESSION_ID" ]; then
    echo "${YELLOW}⚠️  セッションIDが取得できませんでした（スキップ）${NC}"
else
    if [ "$ENV" = "prod" ]; then
        HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/ai/conversations/$SESSION_ID" \
            -H "Authorization: Bearer $SESSION_TOKEN")
    else
        HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/ai/conversations/$SESSION_ID")
    fi
    
    if echo "$HISTORY_RESPONSE" | grep -q "conversations"; then
        echo "${GREEN}✅ 対話履歴が正常に取得されました${NC}"
        TOTAL=$(echo $HISTORY_RESPONSE | grep -o '"total":[0-9]*' | cut -d':' -f2)
        echo "対話履歴件数: $TOTAL"
    else
        echo "${RED}❌ 対話履歴の取得に失敗しました${NC}"
        echo "レスポンス: $HISTORY_RESPONSE"
    fi
fi

echo ""
echo "---"

# テスト3: 問題生成APIテスト（時間がかかるためオプション）
read -p "問題生成APIもテストしますか？（時間がかかります） [y/N]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🎲 テスト3: 問題生成API"
    echo "---"
    
    if [ "$ENV" = "prod" ]; then
        GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/generate-problem" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $SESSION_TOKEN" \
            -d '{
                "curriculumId": 1,
                "courseId": 1,
                "difficultyLevel": "しっかり",
                "requirements": "小学4年生向けの分数の足し算の問題",
                "userId": 1
            }')
    else
        GENERATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/ai/generate-problem" \
            -H "Content-Type: application/json" \
            -d '{
                "curriculumId": 1,
                "courseId": 1,
                "difficultyLevel": "しっかり",
                "requirements": "小学4年生向けの分数の足し算の問題",
                "userId": 1
            }')
    fi
    
    if echo "$GENERATE_RESPONSE" | grep -q "problem"; then
        echo "${GREEN}✅ 問題が正常に生成されました${NC}"
        PROBLEM_TITLE=$(echo $GENERATE_RESPONSE | grep -o '"problem_description":"[^"]*"' | cut -d'"' -f4)
        echo ""
        echo "【生成された問題】"
        echo "$PROBLEM_TITLE"
        echo ""
    else
        echo "${RED}❌ 問題生成に失敗しました${NC}"
        echo "レスポンス: $GENERATE_RESPONSE"
    fi
    
    echo ""
    echo "---"
fi

# 最終結果
echo ""
echo "================================"
echo "✨ テスト完了"
echo ""
echo "詳細情報:"
echo "  環境: $ENV"
echo "  URL: $BASE_URL"
echo "  日時: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

if [ "$ENV" = "dev" ]; then
    echo "💡 ヒント:"
    echo "  - 開発環境でエラーが出る場合は .dev.vars ファイルを確認してください"
    echo "  - APIキー取得: https://makersuite.google.com/app/apikey"
fi

if [ "$ENV" = "prod" ]; then
    echo "💡 ヒント:"
    echo "  - 本番環境でエラーが出る場合は環境変数を確認してください"
    echo "  - 確認: npx wrangler pages secret list --project-name jiyushindo-gakushu"
    echo "  - 設定: npx wrangler pages secret put GEMINI_API_KEY --project-name jiyushindo-gakushu"
fi
