#!/bin/bash

# DJAMMS Vercel Deployment Script
# This script deploys all apps to Vercel with production domains

set -e

echo "🚀 DJAMMS Vercel Deployment Script"
echo "===================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel
echo "🔐 Logging into Vercel..."
vercel login

# Function to deploy an app
deploy_app() {
    local app_name=$1
    local app_path=$2
    local domain=$3
    
    echo ""
    echo "📦 Deploying $app_name..."
    echo "   Path: $app_path"
    echo "   Domain: $domain"
    
    cd "$app_path"
    
    # Deploy to production
    vercel --prod --yes
    
    echo "✅ $app_name deployed!"
    
    cd - > /dev/null
}

# Deploy all apps
echo ""
echo "Starting deployments..."
echo ""

deploy_app "Landing Page" "apps/landing" "djamms.app"
deploy_app "Auth App" "apps/auth" "auth.djamms.app"
deploy_app "Player App" "apps/player" "player.djamms.app"
deploy_app "Admin App" "apps/admin" "admin.djamms.app"
deploy_app "Kiosk App" "apps/kiosk" "kiosk.djamms.app"
deploy_app "Dashboard App" "apps/dashboard" "dashboard.djamms.app"

echo ""
echo "🎉 All apps deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure custom domains in Vercel dashboard"
echo "   2. Add environment variables for each project"
echo "   3. Update DNS records on Porkbun"
echo "   4. Test all apps at production URLs"
echo ""
echo "📚 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
