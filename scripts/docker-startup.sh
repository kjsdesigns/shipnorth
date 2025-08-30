#!/bin/bash

# Reliable Docker startup script for Shipnorth services
# Uses environment variables from .env for all configuration

echo "🚀 Starting Shipnorth services..."

# Source environment variables (available in Docker container)
API_PORT=${API_PORT:-8850}
WEB_PORT=${WEB_PORT:-8849}

echo "📊 Configuration:"
echo "   • API Port: $API_PORT"
echo "   • Web Port: $WEB_PORT"

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "tsx watch" || true
pkill -f "next dev" || true
sleep 2

# Start API service (Express)
echo "🔌 Starting API service on port $API_PORT..."
cd /app/apps/api
PORT=$API_PORT npm run dev > /tmp/api.log 2>&1 &
API_PID=$!
echo "API PID: $API_PID"

# Wait a bit for API to start
sleep 5

# Start Web service (Next.js)
echo "🌐 Starting Web service on port $WEB_PORT..."
cd /app/apps/web
PORT=$WEB_PORT npm run dev > /tmp/web.log 2>&1 &
WEB_PID=$!
echo "Web PID: $WEB_PID"

# Wait for both services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."

# Check API
if curl -s http://localhost:$API_PORT/health > /dev/null; then
    echo "✅ API service is healthy"
else
    echo "❌ API service failed"
    cat /tmp/api.log
fi

# Check Web
if curl -s http://localhost:$WEB_PORT > /dev/null; then
    echo "✅ Web service is healthy"
else
    echo "❌ Web service failed" 
    cat /tmp/web.log
fi

echo "🎉 Startup complete!"
echo "📋 Logs available at /tmp/api.log and /tmp/web.log"
echo "🌐 Services:"
echo "   • Web: http://localhost:$WEB_PORT"
echo "   • API: http://localhost:$API_PORT"

# Keep the script running to maintain processes
wait