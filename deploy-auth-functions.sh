#!/bin/bash

# Deploy New Authentication Functions to AppWrite
# This script deploys the validateAndSendMagicLink and setupUserProfile functions

set -e

echo "🚀 Deploying Authentication Functions to AppWrite"
echo "=================================================="
echo ""

# Check if appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    echo "❌ AppWrite CLI not found. Please install it first:"
    echo "   npm install -g appwrite-cli"
    exit 1
fi

# Navigate to functions directory
cd "$(dirname "$0")/functions/appwrite"

echo "📍 Current directory: $(pwd)"
echo ""

# Read project info from config
PROJECT_ID=$(grep -o '"projectId": "[^"]*' appwrite.config.json | cut -d'"' -f4)
echo "📦 Project ID: $PROJECT_ID"
echo ""

# Function 1: validateAndSendMagicLink
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  Deploying: validateAndSendMagicLink"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if function already exists
FUNCTION_ID_1="validateAndSendMagicLink"

echo "📋 Creating function: $FUNCTION_ID_1"
appwrite functions create \
  --function-id "$FUNCTION_ID_1" \
  --name "Validate and Send Magic Link" \
  --runtime "node-18.0" \
  --execute "any" \
  --timeout 15 \
  --enabled true \
  2>/dev/null || echo "ℹ️  Function already exists, updating..."

echo ""
echo "📦 Creating deployment for: $FUNCTION_ID_1"
echo "   (This may take a minute...)"

appwrite functions create-deployment \
  --function-id "$FUNCTION_ID_1" \
  --code "./src/validateAndSendMagicLink" \
  --activate true \
  --entrypoint "main.js"

echo "✅ validateAndSendMagicLink deployed!"
echo ""

# Function 2: setupUserProfile
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  Deploying: setupUserProfile"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FUNCTION_ID_2="setupUserProfile"

echo "📋 Creating function: $FUNCTION_ID_2"
appwrite functions create \
  --function-id "$FUNCTION_ID_2" \
  --name "Setup User Profile" \
  --runtime "node-18.0" \
  --execute "any" \
  --timeout 15 \
  --enabled true \
  2>/dev/null || echo "ℹ️  Function already exists, updating..."

echo ""
echo "📦 Creating deployment for: $FUNCTION_ID_2"
echo "   (This may take a minute...)"

appwrite functions create-deployment \
  --function-id "$FUNCTION_ID_2" \
  --code "./src/setupUserProfile" \
  --activate true \
  --entrypoint "main.js"

echo "✅ setupUserProfile deployed!"
echo ""

# Set environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  Setting Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "Please set these environment variables in the AppWrite Console:"
echo ""
echo "For BOTH functions (validateAndSendMagicLink and setupUserProfile):"
echo "1. Go to: https://cloud.appwrite.io/console/project-$PROJECT_ID/functions"
echo "2. Click on each function"
echo "3. Go to 'Settings' tab"
echo "4. Add these environment variables:"
echo ""
echo "   APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1"
echo "   APPWRITE_PROJECT_ID=$PROJECT_ID"
echo "   APPWRITE_API_KEY=<your-server-api-key>"
echo "   APPWRITE_DATABASE_ID=main-db"
echo "   FRONTEND_URL=https://djamms.app"
echo ""
echo "ℹ️  Note: You'll need to create a Server API Key with:"
echo "   - Scope: users.read"
echo "   - Scope: databases.write"
echo ""

# Get function URLs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  Function URLs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add these to your frontend .env file:"
echo ""
echo "VITE_APPWRITE_FUNCTION_VALIDATE_MAGIC_LINK=https://cloud.appwrite.io/v1/functions/$FUNCTION_ID_1/executions"
echo "VITE_APPWRITE_FUNCTION_SETUP_USER_PROFILE=https://cloud.appwrite.io/v1/functions/$FUNCTION_ID_2/executions"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. ✅ Functions deployed"
echo "2. ⏳ Set environment variables (see instructions above)"
echo "3. ⏳ Update frontend .env with function URLs"
echo "4. ⏳ Add venueId field to users collection"
echo "5. ⏳ Test the new authentication flow"
echo ""
