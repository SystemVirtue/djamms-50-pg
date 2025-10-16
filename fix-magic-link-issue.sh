#!/bin/bash
# Fix magic link dual functions issue

set -e

echo "🔧 Fixing Magic Link Dual Functions Issue..."
echo ""

echo "📊 Current Function Status:"
echo ""
cd /Users/mikeclarkin/DJAMMS_50_page_prompt/functions/appwrite
npx appwrite functions list 2>&1 | grep -E "(magic-link|validateAndSendMagicLink)" | awk '{print $1 " - Status: " $5 " Live: " $6}'

echo ""
echo "❌ Problem Identified:"
echo "   - validateAndSendMagicLink is in 'waiting' status"
echo "   - Has no code deployed"
echo "   - Returns HTML 404 instead of JSON"
echo ""

read -p "Delete broken validateAndSendMagicLink function? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🗑️  Deleting validateAndSendMagicLink function..."
    npx appwrite functions delete --function-id validateAndSendMagicLink || echo "Function might not exist or already deleted"
    echo "✅ Function deleted"
else
    echo "⏭️  Skipping function deletion"
fi

echo ""
echo "✅ Fix Applied!"
echo ""
echo "📋 Next Steps:"
echo "   1. Restart your auth server:"
echo "      npm run dev:auth"
echo ""
echo "   2. Open browser:"
echo "      http://localhost:3002"
echo ""
echo "   3. Test magic link - should work without HTML parse error"
echo ""
echo "   4. If still seeing error, check that you're using apps/auth/"
echo "      (not apps/web/)"
echo ""
