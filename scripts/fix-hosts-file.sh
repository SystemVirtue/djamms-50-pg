#!/bin/bash

# Script to fix /etc/hosts file by removing djamms production domain overrides
# This will allow player.djamms.app and admin.djamms.app to resolve to Vercel production servers

echo "🔧 DJAMMS Hosts File Fix Script"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ This script must be run with sudo"
    echo "Usage: sudo ./scripts/fix-hosts-file.sh"
    exit 1
fi

# Show current problematic entries
echo "📋 Current problematic entries in /etc/hosts:"
grep -E "(player|admin)\.djamms\.app" /etc/hosts || echo "  (none found)"
echo ""

# Backup the hosts file
BACKUP_FILE="/etc/hosts.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Creating backup: $BACKUP_FILE"
cp /etc/hosts "$BACKUP_FILE"
echo "✅ Backup created"
echo ""

# Remove the djamms entries
echo "🗑️  Removing localhost overrides for player.djamms.app and admin.djamms.app..."
sed -i '' '/127\.0\.0\.1.*player\.djamms\.app/d' /etc/hosts
sed -i '' '/127\.0\.0\.1.*admin\.djamms\.app/d' /etc/hosts
echo "✅ Entries removed"
echo ""

# Verify removal
echo "🔍 Verifying removal..."
if grep -E "(player|admin)\.djamms\.app" /etc/hosts > /dev/null; then
    echo "⚠️  Warning: Some djamms entries still present:"
    grep -E "(player|admin)\.djamms\.app" /etc/hosts
else
    echo "✅ All djamms localhost overrides removed successfully"
fi
echo ""

# Flush DNS cache
echo "🔄 Flushing DNS cache..."
dscacheutil -flushcache
killall -HUP mDNSResponder
echo "✅ DNS cache flushed"
echo ""

echo "🎉 Hosts file fix complete!"
echo ""
echo "Next steps:"
echo "1. Test SSL connections:"
echo "   curl -I https://player.djamms.app"
echo "   curl -I https://admin.djamms.app"
echo ""
echo "2. Run full deployment test:"
echo "   ./scripts/test-deployment.sh"
echo ""
echo "3. If you need to restore the backup:"
echo "   sudo cp $BACKUP_FILE /etc/hosts"
