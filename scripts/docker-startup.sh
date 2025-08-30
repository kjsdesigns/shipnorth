#!/bin/bash

# Reliable Docker startup script for Shipnorth services
echo "🚀 Starting Shipnorth services..."

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "tsx watch" || true
pkill -f "next dev" || true
sleep 2

# Start API service (Fastify)
echo "🔌 Starting API service on port 8850..."
cd /app/apps/api-fastify
PORT=8850 npm run dev > /tmp/api.log 2>&1 &
API_PID=$!
echo "API PID: $API_PID"

# Wait a bit for API to start
sleep 5

# Start Web service (Vite)
echo "🌐 Starting Web service on port 8849..."
cd /app/apps/web-vite
npm run dev > /tmp/web.log 2>&1 &
WEB_PID=$!
echo "Web PID: $WEB_PID"

# Wait for both services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

# Check API
if curl -s http://localhost:8850/health > /dev/null; then
    echo "✅ API service is healthy"
else
    echo "❌ API service failed"
    cat /tmp/api.log
fi

# Check Web
if curl -s http://localhost:8849 > /dev/null; then
    echo "✅ Web service is healthy"
else
    echo "❌ Web service failed" 
    cat /tmp/web.log
fi

echo "🎉 Startup complete!"
echo "📋 Logs available at /tmp/api.log and /tmp/web.log"

# Keep the script running to maintain processes
wait