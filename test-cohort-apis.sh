#!/bin/bash

API_URL="http://localhost:3001/api/v1"

echo "================================"
echo "Testing Cohort APIs"
echo "================================"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s http://localhost:3001/health | jq .
echo ""

# Test 2: Get Auth URL (no auth needed)
echo "2. Testing Get Google Auth URL..."
curl -s "$API_URL/auth/google/url" | jq .
echo ""

# Test 3: Get all cohorts (requires auth - will fail without token)
echo "3. Testing Get All Cohorts (without auth - should fail)..."
curl -s "$API_URL/cohorts" | jq .
echo ""

# Test 4: Test CORS
echo "4. Testing CORS for cohorts endpoint..."
curl -s -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type,Authorization" \
     -X OPTIONS "$API_URL/cohorts" -v 2>&1 | grep -E "(< HTTP|< Access-Control)"
echo ""

# Test 5: Check if API is accepting JSON
echo "5. Testing API accepts JSON..."
curl -s -X POST "$API_URL/cohorts" \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Cohort","year":2024,"department":"Computer Science"}' | jq .
echo ""

echo "================================"
echo "API Tests Complete"
echo "================================"
echo ""
echo "Note: Most endpoints require authentication."
echo "To fully test, you need to:"
echo "1. Login via the web interface"
echo "2. Get the JWT token from browser localStorage"
echo "3. Use it in the Authorization header"
