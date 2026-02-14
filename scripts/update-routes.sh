#!/bin/bash
# Update _routes.json - Route root and API to Worker, serve other HTML as static

cd "$(dirname "$0")/.."

echo "🔧 _routes.jsonを更新中..."

# Create updated _routes.json
# Route root (/) and /api/* to Worker, other HTML files are static
cat > dist/_routes.json << 'EOF'
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/adaptive-learning-demo.html",
    "/admin-preview.html",
    "/advanced-features-demo.html",
    "/ai-assistant.html",
    "/ai-chatbot-voice.html",
    "/ai-chatbot.html",
    "/ai-tutor.html",
    "/api-docs.html",
    "/auth-demo.html",
    "/login.html",
    "/cache-dashboard.html",
    "/class-progress-comparison.html",
    "/cognitive-learning.html",
    "/collaborative-reports-demo.html",
    "/curriculum-input.html",
    "/curriculum-problem-generator.html",
    "/dashboard.html",
    "/data-export.html",
    "/download-correct-pdf.html",
    "/download-pptx.html",
    "/download-slides.html",
    "/feature-proposals.html",
    "/feedback-dashboard.html",
    "/gamification-demo.html",
    "/integrated-dashboard.html",
    "/integrated-features-demo.html",
    "/learning-analytics-dashboard.html",
    "/learning-analytics.html",
    "/learning-path.html",
    "/multilingual-pwa-demo.html",
    "/ocr-test.html",
    "/offline.html",
    "/parent-dashboard-demo.html",
    "/parent-dashboard.html",
    "/performance-dashboard.html",
    "/personalized-learning-demo.html",
    "/phase16-theory-dashboard.html",
    "/phase18-realtime-learning.html",
    "/problem-generator.html",
    "/progress-board-demo.html",
    "/proposal.html",
    "/school-management-demo.html",
    "/security-dashboard.html",
    "/spaced-learning-progress-demo.html",
    "/start-learning.html",
    "/student-comments.html",
    "/teacher-comments.html",
    "/teacher-dashboard-demo.html",
    "/teacher-dashboard.html",
    "/teacher-bars-rating.html",
    "/test-buttons.html",
    "/test-case6.html",
    "/theory-assessment.html",
    "/truancy-support-demo.html",
    "/manifest.json",
    "/service-worker.js",
    "/static/*",
    "/*.pptx",
    "/*.pdf"
  ]
}
EOF

echo "✅ _routes.json更新完了"
