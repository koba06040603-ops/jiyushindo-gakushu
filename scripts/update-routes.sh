#!/bin/bash
# Update _routes.json - Allow all static files, only route /api/* to Worker

cd "$(dirname "$0")/.."

echo "🔧 _routes.jsonを更新中..."

# Create updated _routes.json
# Only route API requests to Worker, everything else is static
cat > dist/_routes.json << 'EOF'
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
EOF

echo "✅ _routes.json更新完了"
