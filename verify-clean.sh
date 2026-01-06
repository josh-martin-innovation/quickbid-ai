#!/bin/bash

# QuickBid AI - Verification Script
# Checks that LinkedIn code is completely removed

echo "🔍 Verifying QuickBid AI is clean..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0

# Check settings.js for LinkedIn references
echo "📄 Checking settings.js..."
if grep -i "linkedin" quickbid-extension/settings.js > /dev/null 2>&1; then
    echo -e "${RED}❌ FAIL: Found 'linkedin' in settings.js${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✅ PASS: No LinkedIn code in settings.js${NC}"
fi

# Check server.js for LinkedIn endpoint
echo "📄 Checking server.js..."
if grep -i "parse-linkedin" quickbid-backend/server.js > /dev/null 2>&1; then
    echo -e "${RED}❌ FAIL: Found 'parse-linkedin' endpoint in server.js${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✅ PASS: No LinkedIn endpoint in server.js${NC}"
fi

# Check popup.js has correct URL
echo "📄 Checking popup.js backend URL..."
if grep "quickbid-ai-backend.onrender.com" quickbid-extension/popup.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Correct backend URL in popup.js${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Backend URL might be incorrect in popup.js${NC}"
fi

# Check settings.js has correct URL
echo "📄 Checking settings.js backend URL..."
if grep "quickbid-ai-backend.onrender.com" quickbid-extension/settings.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Correct backend URL in settings.js${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: Backend URL might be incorrect in settings.js${NC}"
fi

# Count tabs in settings.html (look for button.tab with data-tab attribute)
echo "📄 Checking settings.html tabs..."
tab_count=$(grep -E 'button.*class="tab.*data-tab=' quickbid-extension/settings.html | wc -l)
if [ "$tab_count" -eq 2 ]; then
    echo -e "${GREEN}✅ PASS: Correct number of tabs (2)${NC}"
elif [ "$tab_count" -gt 2 ]; then
    echo -e "${RED}❌ FAIL: Found $tab_count tabs (expected 2)${NC}"
    echo "   One might be the LinkedIn tab"
    errors=$((errors + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Found $tab_count tabs (expected 2)${NC}"
fi

# Verify the two tabs are Upload and Manual
echo "📄 Verifying tab names..."
if grep 'data-tab="upload"' quickbid-extension/settings.html > /dev/null 2>&1 && \
   grep 'data-tab="manual"' quickbid-extension/settings.html > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Correct tab names (upload, manual)${NC}"
else
    echo -e "${RED}❌ FAIL: Missing expected tabs${NC}"
    errors=$((errors + 1))
fi

# Check that there's NO linkedin tab
echo "📄 Checking for LinkedIn tab..."
if grep -i 'data-tab="linkedin"' quickbid-extension/settings.html > /dev/null 2>&1; then
    echo -e "${RED}❌ FAIL: Found LinkedIn tab in settings.html${NC}"
    errors=$((errors + 1))
else
    echo -e "${GREEN}✅ PASS: No LinkedIn tab found${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo "   QuickBid AI is clean and ready for deployment"
    exit 0
else
    echo -e "${RED}❌ $errors CHECK(S) FAILED${NC}"
    echo "   Please review the errors above"
    exit 1
fi
