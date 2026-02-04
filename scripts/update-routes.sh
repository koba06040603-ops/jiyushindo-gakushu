#!/bin/bash
# Update _routes.json to include all HTML files in exclude list

cd "$(dirname "$0")/.."

echo "🔧 _routes.jsonを更新中..."

# Create updated _routes.json
# HTMLファイルはexcludeリストに追加してCloudflare Pagesが直接配信
cat > dist/_routes.json << 'EOF'
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/adaptive-learning-demo.html",
    "/admin-preview.html",
    "/advanced-features-demo.html",
    "/ai-tutor.html",
    "/api-docs.html",
    "/auth-demo.html",
    "/cache-dashboard.html",
    "/collaborative-reports-demo.html",
    "/dashboard.html",
    "/gamification-demo.html",
    "/integrated-dashboard.html",
    "/integrated-features-demo.html",
    "/manifest.json",
    "/multilingual-pwa-demo.html",
    "/ocr-test.html",
    "/offline.html",
    "/parent-dashboard-demo.html",
    "/parent-dashboard.html",
    "/performance-dashboard.html",
    "/personalized-learning-demo.html",
    "/problem-generator.html",
    "/progress-board-demo.html",
    "/proposal.html",
    "/school-management-demo.html",
    "/security-dashboard.html",
    "/service-worker.js",
    "/spaced-learning-progress-demo.html",
    "/static/*",
    "/teacher-dashboard-demo.html",
    "/test-buttons.html",
    "/truancy-support-demo.html"
  ]
}
EOF

echo "✅ _routes.json更新完了"
