#!/bin/bash

# Comprehensive Deployment Test Script
# Tests all domains, SSL, and generates a detailed report

echo "=========================================="
echo "DJAMMS DEPLOYMENT TEST SUITE"
echo "=========================================="
echo ""
echo "Testing all deployments after GitHub push..."
echo "Timestamp: $(date)"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test a domain
test_domain() {
    local domain=$1
    local name=$2
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo "Testing: $name ($domain)"
    
    # Test DNS resolution
    DNS=$(dig +short $domain | head -1)
    if [ -z "$DNS" ]; then
        echo -e "  ${RED}✗${NC} DNS: Failed (no resolution)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    else
        echo -e "  ${GREEN}✓${NC} DNS: $DNS"
    fi
    
    # Test HTTPS
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 5 https://$domain 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
        echo -e "  ${GREEN}✓${NC} HTTPS: $HTTP_CODE"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ -z "$HTTP_CODE" ]; then
        echo -e "  ${YELLOW}⏳${NC} HTTPS: Timeout (SSL cert pending?)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "  ${RED}✗${NC} HTTPS: $HTTP_CODE"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# Test all domains
echo "=========================================="
echo "1. DNS & HTTPS TESTS"
echo "=========================================="
echo ""

test_domain "djamms.app" "Landing (Root Domain)"
test_domain "auth.djamms.app" "Auth"
test_domain "player.djamms.app" "Player"
test_domain "admin.djamms.app" "Admin"
test_domain "kiosk.djamms.app" "Kiosk"
test_domain "dashboard.djamms.app" "Dashboard"

echo "=========================================="
echo "2. APPWRITE TESTS"
echo "=========================================="
echo ""

# Test AppWrite custom domain
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo "Testing: AppWrite Custom Domain"
APPWRITE_DNS=$(dig +short 68e5a36e0021b938b3a7.djamms.app | grep "syd.cloud.appwrite.io" | head -1)
if [ -n "$APPWRITE_DNS" ]; then
    echo -e "  ${GREEN}✓${NC} DNS: Points to AppWrite"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "  ${RED}✗${NC} DNS: Not pointing to AppWrite"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test AppWrite API with authentication
API_KEY="standard_25289fad1759542a75506309bd927c04928587ec211c9da1b7ab1817d5fb4a67e2aee4fcd29c36738d9fb2e2e8fe0379f7da761f150940a6d0fe6e89a08cc2d1e5cc95720132db4ed19a13396c9c779c467223c754acbc57abfb48469b866bfccce774903a8de9a93b55f65d2b30254447cb6664661d378b3722a979d9d71f92"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""
echo "Testing: AppWrite Database Access"
DB_RESULT=$(curl -s -H "X-Appwrite-Project: 68cc86c3002b27e13947" -H "X-Appwrite-Key: $API_KEY" https://syd.cloud.appwrite.io/v1/databases/68e57de9003234a84cae)
if echo "$DB_RESULT" | grep -q "djamms_production"; then
    echo -e "  ${GREEN}✓${NC} Database: Accessible (djamms_production)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "  ${RED}✗${NC} Database: Not accessible"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""
echo "Testing: AppWrite Collections"
COLLECTIONS_RESULT=$(curl -s -H "X-Appwrite-Project: 68cc86c3002b27e13947" -H "X-Appwrite-Key: $API_KEY" "https://syd.cloud.appwrite.io/v1/databases/68e57de9003234a84cae/collections")
COLLECTION_COUNT=$(echo "$COLLECTIONS_RESULT" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ "$COLLECTION_COUNT" = "7" ]; then
    echo -e "  ${GREEN}✓${NC} Collections: 7/7 found"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "  ${RED}✗${NC} Collections: $COLLECTION_COUNT/7 found"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "Collections found:"
echo "$COLLECTIONS_RESULT" | python3 -c "import sys, json; data = json.load(sys.stdin); [print('  -', c['\$id'], ':', c['name']) for c in data['collections']]" 2>/dev/null

echo ""
echo "=========================================="
echo "3. SUMMARY"
echo "=========================================="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

# Calculate success rate
SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}=========================================="
    echo "✅ ALL TESTS PASSED!"
    echo -e "==========================================${NC}"
    echo ""
    echo "🎉 Your deployment is fully operational!"
    exit 0
else
    echo -e "${YELLOW}=========================================="
    echo "⚠️  SOME TESTS FAILED"
    echo -e "==========================================${NC}"
    echo ""
    echo "Issues found:"
    echo "- Check failed tests above"
    echo "- SSL certificates may still be provisioning (wait 15-30 min)"
    echo "- Verify Vercel deployments completed"
    exit 1
fi
