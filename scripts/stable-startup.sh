#!/bin/bash

# Stable startup script for Fastify + Vite + PostgreSQL stack
echo "🚀 Starting Shipnorth Stable Stack..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h shipnorth-postgres -p 5432 -U shipnorth; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
pkill -f "fastify\|vite\|node.*8849\|node.*8850" || true
sleep 2

# Start Fastify API server (more stable than Express)
echo "🔌 Starting Fastify API on port 8850..."
cd /app/apps/api-fastify
PORT=8850 npm run dev > /tmp/api.log 2>&1 &
API_PID=$!
echo "Fastify API PID: $API_PID"

# Wait for API to start
sleep 5

# Start Vite frontend (much faster and more stable than Next.js)
echo "🌐 Starting Vite frontend on port 8849..."
cd /app/apps/web-vite
npm run dev > /tmp/web.log 2>&1 &
WEB_PID=$!
echo "Vite Web PID: $WEB_PID"

# Wait for services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 10

# Health checks
echo "🔍 Running health checks..."

# Check API health
if curl -s http://localhost:8850/health > /dev/null; then
    echo "✅ Fastify API is healthy"
else
    echo "❌ Fastify API failed to start"
    echo "API logs:"
    cat /tmp/api.log
fi

# Check Vite health 
if curl -s http://localhost:8849 > /dev/null; then
    echo "✅ Vite frontend is healthy"
else
    echo "❌ Vite frontend failed to start"
    echo "Web logs:"
    cat /tmp/web.log
fi

echo "🎉 Stable stack startup complete!"
echo "📋 API logs: /tmp/api.log"
echo "📋 Web logs: /tmp/web.log" 
echo "🌐 Web: http://localhost:8849"
echo "🔌 API: http://localhost:8850"

# Keep script running to maintain processes
wait