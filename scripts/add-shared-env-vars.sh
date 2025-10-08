#!/bin/bash

# Add shared environment variables to all Vercel projects
# This will add the same variables to all 6 projects

echo "🔐 Adding Environment Variables to All Vercel Projects..."
echo ""

# Define all projects
PROJECTS=(
  "djamms-landing"
  "djamms-auth"
  "djamms-player"
  "djamms-admin"
  "djamms-kiosk"
  "djamms-dashboard"
)

# Shared variables (used by all apps)
echo "📦 Adding shared AppWrite configuration..."
for project in "${PROJECTS[@]}"; do
  echo "  → $project"
  vercel env add VITE_APPWRITE_ENDPOINT production preview development --yes -S djamms-admins-projects -p "$project" <<< "https://syd.cloud.appwrite.io/v1"
  vercel env add VITE_APPWRITE_PROJECT_ID production preview development --yes -S djamms-admins-projects -p "$project" <<< "68cc86c3002b27e13947"
  vercel env add VITE_APPWRITE_DATABASE_ID production preview development --yes -S djamms-admins-projects -p "$project" <<< "68e57de9003234a84cae"
done

echo ""
echo "🔒 Adding JWT secret..."
for project in "${PROJECTS[@]}"; do
  echo "  → $project"
  vercel env add VITE_JWT_SECRET production preview development --yes -S djamms-admins-projects -p "$project" <<< "9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8"
done

echo ""
echo "✅ Shared variables added to all projects!"
echo ""
echo "📋 Next step: Add app-specific variables manually:"
echo "   - Landing: AUTH_URL, PLAYER_URL"
echo "   - Auth: USERS_COLLECTION_ID, MAGIC_LINK_FUNCTION_ID, etc."
echo "   - Player: YOUTUBE_API_KEY, QUEUE_COLLECTION_ID, etc."
echo "   - Admin: PROCESS_REQUEST_FUNCTION_ID, etc."
echo "   - Kiosk: Similar to admin"
echo "   - Dashboard: Similar to admin"
echo ""
echo "💡 Or use the Vercel dashboard to copy-paste remaining variables"
echo "   See VERCEL_ENV_VARS_BATCH_ADD.md for the complete list"
echo ""
