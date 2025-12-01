#!/bin/bash

# Debug script for customers API
TENANT_SLUG=${1:-wondernails}
BASE_URL="http://localhost:3001"

echo "🔍 Debugging customers API for tenant: $TENANT_SLUG"
echo "====================================="

# Step 1: Check if tenant exists
echo ""
echo "1. Checking if tenant exists..."
TENANT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/api/tenants/$TENANT_SLUG")
TENANT_STATUS=$(echo "$TENANT_RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
TENANT_BODY=$(echo "$TENANT_RESPONSE" | sed -e 's/HTTP_STATUS:[0-9]*$//')

echo "   Status: $TENANT_STATUS"
if [ "$TENANT_STATUS" = "200" ]; then
    echo "   ✅ Tenant exists and is accessible"
else
    echo "   ❌ Error response:"
    echo "   $TENANT_BODY"
fi

# Step 2: Check customers API
echo ""
echo "2. Testing customers API..."
CUSTOMERS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/api/tenants/$TENANT_SLUG/customers")
CUSTOMERS_STATUS=$(echo "$CUSTOMERS_RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
CUSTOMERS_BODY=$(echo "$CUSTOMERS_RESPONSE" | sed -e 's/HTTP_STATUS:[0-9]*$//')

echo "   Status: $CUSTOMERS_STATUS"
if [ "$CUSTOMERS_STATUS" = "200" ]; then
    echo "   ✅ Customers API is working"
    # Extract count from JSON if possible
    COUNT=$(echo "$CUSTOMERS_BODY" | grep -o '"count":[0-9]*' | cut -d: -f2)
    if [ -n "$COUNT" ]; then
        echo "   Customers count: $COUNT"
    fi
else
    echo "   ❌ Error response:"
    echo "   $CUSTOMERS_BODY"
fi

# Step 3: Check if we need to create a health check endpoint
echo ""
echo "3. Checking if we can access the application..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)

echo "   Application status: $HEALTH_STATUS"
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "   ✅ Application is running"
else
    echo "   ❌ Application may not be running"
fi

echo ""
echo "Debug complete!"