#!/bin/bash

# Start all development servers and monitor their status

echo "🚀 Starting all development servers..."
echo ""

# Start servers in background
npm run dev:landing > /tmp/dev-landing.log 2>&1 &
PID_LANDING=$!
echo "✓ Landing server starting (PID: $PID_LANDING) - http://localhost:3000"

npm run dev:auth > /tmp/dev-auth.log 2>&1 &
PID_AUTH=$!
echo "✓ Auth server starting (PID: $PID_AUTH) - http://localhost:3002"

npm run dev:player > /tmp/dev-player.log 2>&1 &
PID_PLAYER=$!
echo "✓ Player server starting (PID: $PID_PLAYER) - http://localhost:3001"

npm run dev:admin > /tmp/dev-admin.log 2>&1 &
PID_ADMIN=$!
echo "✓ Admin server starting (PID: $PID_ADMIN) - http://localhost:3003"

npm run dev:kiosk > /tmp/dev-kiosk.log 2>&1 &
PID_KIOSK=$!
echo "✓ Kiosk server starting (PID: $PID_KIOSK) - http://localhost:3004"

echo ""
echo "⏳ Waiting for servers to be ready..."
sleep 8

echo ""
echo "📊 Server Status:"
echo "=================="

# Check each port
check_port() {
    local port=$1
    local name=$2
    if lsof -i:$port | grep -q LISTEN; then
        echo "✅ $name (port $port) - RUNNING"
        return 0
    else
        echo "❌ $name (port $port) - FAILED"
        return 1
    fi
}

check_port 3000 "Landing"
check_port 3002 "Auth"
check_port 3001 "Player"
check_port 3003 "Admin"
check_port 3004 "Kiosk"

echo ""
echo "💡 URLs:"
echo "   Landing: http://localhost:3000/"
echo "   Auth:    http://localhost:3002/auth/login"
echo "   Player:  http://localhost:3001/player/venue1"
echo "   Admin:   http://localhost:3003/admin/venue1"
echo "   Kiosk:   http://localhost:3004/kiosk/venue1"
echo ""
echo "📝 Logs are in /tmp/dev-*.log"
echo "🛑 To stop all servers: killall node"
echo ""
