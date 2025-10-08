#!/bin/bash

# Deploy a new Vercel project for a specific app
# Usage: ./scripts/deploy-new-project.sh <app-name>
# Example: ./scripts/deploy-new-project.sh auth

APP_NAME=$1

if [ -z "$APP_NAME" ]; then
  echo "Usage: ./scripts/deploy-new-project.sh <app-name>"
  echo "Available apps: landing, auth, player, admin, kiosk, dashboard"
  exit 1
fi

# Validate app name
VALID_APPS=("landing" "auth" "player" "admin" "kiosk" "dashboard")
if [[ ! " ${VALID_APPS[@]} " =~ " ${APP_NAME} " ]]; then
  echo "Error: Invalid app name '$APP_NAME'"
  echo "Valid apps: ${VALID_APPS[*]}"
  exit 1
fi

echo "🚀 Deploying djamms-$APP_NAME as a new Vercel project..."

# Remove .vercel directory to force new project creation
if [ -d ".vercel" ]; then
  echo "📁 Removing .vercel directory to create new project..."
  rm -rf .vercel
fi

# Update root vercel.json with app-specific settings
cat > vercel.json << EOF
{
  "buildCommand": "npm run build:$APP_NAME",
  "outputDirectory": "apps/$APP_NAME/dist",
  "installCommand": "npm install",
  "framework": null
}
EOF

echo "✅ Updated vercel.json for $APP_NAME"

# Deploy to production
echo "🚢 Deploying to Vercel..."
vercel --prod --yes

echo ""
echo "✨ Deployment complete!"
echo ""
echo "⚠️  IMPORTANT: You still need to add environment variables in the Vercel dashboard:"
echo "   1. Go to https://vercel.com/djamms-admins-projects"
echo "   2. Click on the newly created project"
echo "   3. Go to Settings > Environment Variables"
echo "   4. Add the variables from VERCEL_ENV_VARS_GUIDE.md for the $APP_NAME app"
echo ""
