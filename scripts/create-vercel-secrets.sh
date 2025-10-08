#!/bin/bash

echo "🔐 Creating Vercel Shared Secrets..."
echo ""
echo "This will create secrets that can be referenced across all 6 projects."
echo "Format: @secret_name in environment variables"
echo ""

# AppWrite Configuration
echo "📦 Creating AppWrite configuration secrets..."
vercel secrets add vite_appwrite_endpoint "https://syd.cloud.appwrite.io/v1"
vercel secrets add vite_appwrite_project_id "68cc86c3002b27e13947"
vercel secrets add vite_appwrite_database_id "68e57de9003234a84cae"

# Collection IDs (from DATABASE_SCHEMA_COMPLETE.md)
echo ""
echo "📦 Creating collection ID secrets..."
vercel secrets add vite_appwrite_users_collection_id "users"
vercel secrets add vite_appwrite_venues_collection_id "venues"
vercel secrets add vite_appwrite_queue_collection_id "queue"
vercel secrets add vite_appwrite_nowplaying_collection_id "nowplaying"
vercel secrets add vite_appwrite_tracks_collection_id "tracks"

# Security
echo ""
echo "🔒 Creating security secrets..."
vercel secrets add vite_jwt_secret "9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8"

# APIs
echo ""
echo "🎥 Creating API key secrets..."
vercel secrets add vite_youtube_api_key "AIzaSyCdLbPNZnlHlXbk4XUUyp0of1G8_ru_Few"

# AppWrite Function IDs (from VERCEL_ENV_VARS_BATCH_ADD.md)
echo ""
echo "⚡ Creating function ID secrets..."
vercel secrets add vite_auth_magic_link_function_id "authmagiclink"
vercel secrets add vite_process_request_function_id "processRequest"

# Production URLs
echo ""
echo "🌐 Creating production URL secrets..."
vercel secrets add vite_landing_url "https://djamms.app"
vercel secrets add vite_auth_url "https://auth.djamms.app"
vercel secrets add vite_player_url "https://player.djamms.app"
vercel secrets add vite_admin_url "https://admin.djamms.app"
vercel secrets add vite_kiosk_url "https://kiosk.djamms.app"
vercel secrets add vite_dashboard_url "https://dashboard.djamms.app"

# Auth callback
echo ""
echo "🔗 Creating auth callback URL secret..."
vercel secrets add vite_appwrite_magic_redirect "https://auth.djamms.app/auth/callback"

echo ""
echo "✅ All secrets created successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to each project's environment variables page"
echo "   2. Add variables that reference these secrets"
echo "   3. Format: Key = VITE_APPWRITE_ENDPOINT, Value = @vite_appwrite_endpoint"
echo "   4. See VERCEL_SECRETS_REFERENCE.md for exact variables per project"
echo ""
echo "💡 Tip: Secrets are shared across all projects in your team/account"
echo "   Change a secret once, and all projects using it will update"
echo ""
