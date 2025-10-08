#!/bin/bash

# DJAMMS Vercel Deployment Script (Fixed for Monorepo)
# Deploy individual apps from project root

set -e

APP=$1

if [ -z "$APP" ]; then
  echo "❌ Error: No app specified"
  echo ""
  echo "Usage: ./scripts/deploy-app.sh [app-name]"
  echo ""
  echo "Available apps:"
  echo "  - landing"
  echo "  - auth"
  echo "  - player"
  echo "  - admin"
  echo "  - kiosk"
  echo "  - dashboard"
  echo ""
  exit 1
fi

# Validate app name
case $APP in
  landing|auth|player|admin|kiosk|dashboard)
    echo "✅ Deploying: $APP"
    ;;
  *)
    echo "❌ Error: Unknown app '$APP'"
    echo "Valid apps: landing, auth, player, admin, kiosk, dashboard"
    exit 1
    ;;
esac

echo ""
echo "📝 Updating vercel.json for $APP..."

# Update vercel.json in project root
cat > vercel.json <<EOF
{
  "buildCommand": "npm run build:$APP",
  "outputDirectory": "apps/$APP/dist",
  "installCommand": "npm install"
}
EOF

echo "✅ vercel.json updated"
echo ""
echo "🚀 Deploying $APP to Vercel..."
echo ""

# Check if .vercel directory exists and remove it to force new project setup
if [ -d ".vercel" ]; then
  echo "🗑️  Removing cached .vercel directory..."
  rm -rf .vercel
fi

# Deploy to Vercel (first deployment will prompt to create new project)
echo "📋 Creating new project: djamms-$APP"
vercel --prod --yes

echo ""
echo "🎉 $APP deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Add environment variables in Vercel dashboard"
echo "  2. Configure custom domain: $APP.djamms.app (or djamms.app for landing)"
echo "  3. Update DNS records on Porkbun"
echo ""
echo "📚 See VERCEL_DEPLOYMENT_STEPBYSTEP.md for details"
