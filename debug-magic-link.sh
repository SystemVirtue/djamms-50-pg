#!/bin/bash

echo "=================================="
echo "🔍 DJAMMS Magic Link Debug Report"
echo "=================================="
echo ""

echo "📁 Current Directory:"
pwd
echo ""

echo "🌍 Environment Variables in .env:"
echo "-----------------------------------"
if [ -f .env ]; then
    echo "✅ .env file exists"
    echo ""
    echo "VITE_APPWRITE variables:"
    grep "^VITE_APPWRITE" .env | while read line; do
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)
        # Truncate long values
        if [ ${#value} -gt 60 ]; then
            value="${value:0:60}..."
        fi
        echo "  $key = $value"
    done
    echo ""
    
    echo "🚨 Checking for BROKEN function URLs:"
    if grep -q "VITE_APPWRITE_FUNCTION.*https://" .env 2>/dev/null; then
        echo "  ❌ FOUND BROKEN FUNCTION URLS (these should be IDs only):"
        grep "VITE_APPWRITE_FUNCTION.*https://" .env
    else
        echo "  ✅ No function URLs found (good - should only be IDs)"
    fi
else
    echo "❌ .env file NOT FOUND!"
fi
echo ""

echo "🏃 Running Processes:"
echo "-----------------------------------"
echo "Vite dev servers:"
ps aux | grep -E "vite.*--port" | grep -v grep | awk '{print "  Port:", $NF, "PID:", $2, "Status:", $8}'
echo ""

echo "📝 Config File Check:"
echo "-----------------------------------"
echo "Checking packages/shared/src/config/env.ts:"
if [ -f packages/shared/src/config/env.ts ]; then
    echo "  ✅ Config file exists"
    echo ""
    echo "  Hardcoded function IDs:"
    grep -A 3 "functions: {" packages/shared/src/config/env.ts
else
    echo "  ❌ Config file not found"
fi
echo ""

echo "🌐 apps/web Environment:"
echo "-----------------------------------"
if [ -f apps/web/.env ]; then
    echo "  ✅ apps/web/.env exists"
    cat apps/web/.env
else
    echo "  ❌ apps/web/.env not found (will use root .env)"
fi
echo ""

echo "🔧 Recommended Actions:"
echo "-----------------------------------"

# Check if vite servers are running
if ps aux | grep -q "vite.*--port" | grep -v grep; then
    echo "  ⚠️  Vite servers are running - they need to be restarted to pick up .env changes"
    echo "     Run: pkill -f vite && npm run dev:auth"
else
    echo "  ℹ️  No Vite servers currently running"
fi

# Check for broken env vars
if grep -q "VITE_APPWRITE_FUNCTION.*https://" .env 2>/dev/null; then
    echo "  ❌ CRITICAL: Remove function URLs from .env"
    echo "     Edit .env and delete lines containing:"
    grep "VITE_APPWRITE_FUNCTION.*https://" .env | awk '{print "       - " $0}'
fi

# Check which Login.tsx would be used
if [ -d apps/web ]; then
    echo "  ⚠️  apps/web exists - which app are you running?"
    echo "     - apps/auth uses: apps/auth/src/components/Login.tsx"
    echo "     - apps/web uses:  apps/web/src/routes/auth/Login.tsx"
fi

echo ""
echo "=================================="
echo "✅ Debug report complete"
echo "=================================="
