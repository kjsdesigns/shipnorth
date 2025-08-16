#!/bin/bash
set -e

echo "🔄 Ensuring local and dev environment synchronicity..."

# 1. Build the Next.js app with dev API URL
echo "📦 Building Next.js app with dev API configuration..."
cd apps/web
NEXT_PUBLIC_API_URL=https://rv6q5b27n2.execute-api.ca-central-1.amazonaws.com npm run build
cd ../..

# 2. Deploy the updated web stack
echo "🚀 Deploying web stack..."
cd infrastructure
npm run cdk deploy ShipnorthWeb-dev -- --require-approval never
cd ..

# 3. Verify deployment
echo "✅ Verifying deployment..."
curl -s -f https://d3i19husj7b5d7.cloudfront.net/login/ > /dev/null && echo "✅ Web frontend is accessible" || echo "❌ Web frontend failed"
curl -s -f https://rv6q5b27n2.execute-api.ca-central-1.amazonaws.com/health > /dev/null && echo "✅ API backend is accessible" || echo "❌ API backend failed"

# 4. Run E2E tests to verify synchronicity
echo "🧪 Running E2E tests to verify synchronicity..."
TEST_ENV=dev npm run test:e2e

echo "🎉 Environment synchronicity verified!"
echo ""
echo "📍 URLs:"
echo "   Local:  http://localhost:3001"
echo "   Dev:    https://d3i19husj7b5d7.cloudfront.net"
echo ""
echo "Both environments now serve the same Next.js application!"