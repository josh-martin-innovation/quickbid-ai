#!/bin/bash

# QuickBid AI Backend Test Script
# This script tests your backend API to ensure it's working correctly

echo "🧪 Testing QuickBid AI Backend..."
echo "================================"
echo ""

# Test 1: Check if server is running
echo "Test 1: Health Check"
echo "--------------------"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)

if [ "$RESPONSE" -eq 200 ]; then
    echo "✅ Server is running!"
else
    echo "❌ Server is not responding (HTTP $RESPONSE)"
    echo "   Make sure you ran 'npm start' in the backend folder"
    exit 1
fi

echo ""

# Test 2: Generate a test proposal
echo "Test 2: Generate Proposal"
echo "-------------------------"
echo "Sending test job description to API..."
echo ""

PROPOSAL_RESPONSE=$(curl -s -X POST http://localhost:3000/api/generate-proposal \
  -H "Content-Type: application/json" \
  -d '{
    "jobDescription": "We need an experienced React developer to build a modern e-commerce website. Must have experience with Next.js, TypeScript, and Tailwind CSS. Project duration: 2-3 months."
  }')

# Check if response contains "proposal" field
if echo "$PROPOSAL_RESPONSE" | grep -q "proposal"; then
    echo "✅ Proposal generated successfully!"
    echo ""
    echo "📝 Generated Proposal Preview:"
    echo "--------------------------------"
    echo "$PROPOSAL_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['proposal'][:200] + '...')" 2>/dev/null || echo "$PROPOSAL_RESPONSE"
else
    echo "❌ Failed to generate proposal"
    echo "   Response: $PROPOSAL_RESPONSE"
    echo ""
    echo "Common issues:"
    echo "   - KINDO_API_KEY not set in .env file"
    echo "   - Invalid Kindo API key"
    echo "   - Kindo API rate limit exceeded"
    exit 1
fi

echo ""
echo "================================"
echo "🎉 All tests passed!"
echo ""
echo "Next steps:"
echo "1. Install the Chrome extension (see SETUP_GUIDE.md)"
echo "2. Update popup.js with your backend URL"
echo "3. Test on a real Upwork job posting"
echo ""
