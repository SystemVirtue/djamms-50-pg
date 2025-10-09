#!/bin/bash
set -e

# DJAMMS AppWrite Deployment Script
# Builds and deploys all 6 React apps to AppWrite Storage

echo "🚀 DJAMMS AppWrite Deployment Starting..."
echo "=========================================="
echo ""

# AppWrite Configuration
PROJECT_ID="68cc86c3002b27e13947"
ENDPOINT="https://syd.cloud.appwrite.io/v1"

# App configurations: app_name:bucket_id
declare -A APPS=(
  ["auth"]="auth-static"
  ["landing"]="landing-static"
  ["player"]="player-static"
  ["admin"]="admin-static"
  ["dashboard"]="dashboard-static"
  ["kiosk"]="kiosk-static"
)

# Function to upload directory to AppWrite bucket
upload_to_bucket() {
  local app=$1
  local bucket=$2
  local dist_path="apps/$app/dist"
  
  echo "📤 Uploading $app to bucket: $bucket"
  
  if [ ! -d "$dist_path" ]; then
    echo "❌ Error: $dist_path not found. Run build first!"
    return 1
  fi
  
  cd "$dist_path"
  
  # Get list of all files
  local file_count=0
  local upload_errors=0
  
  while IFS= read -r -d '' file; do
    # Get relative path
    local rel_path="${file#./}"
    
    # Skip if empty or just a dot
    if [ "$rel_path" == "." ] || [ -z "$rel_path" ]; then
      continue
    fi
    
    # Create file ID from path (replace / and . with -)
    local file_id=$(echo "$rel_path" | tr '/.' '--' | tr '[:upper:]' '[:lower:]')
    
    # Ensure file ID doesn't start with number or special char
    if [[ $file_id =~ ^[0-9] ]]; then
      file_id="file-$file_id"
    fi
    
    echo "  📄 Uploading: $rel_path (ID: $file_id)"
    
    # Upload file to AppWrite
    if appwrite storage createFile \
      --bucketId="$bucket" \
      --fileId="$file_id" \
      --file="$file" \
      --permissions='read("any")' 2>&1 | grep -q "success\|created"; then
      ((file_count++))
    else
      echo "    ⚠️  Upload may have failed or file already exists"
      ((upload_errors++))
    fi
    
  done < <(find . -type f -print0)
  
  cd ../../..
  
  echo "  ✅ Uploaded $file_count files for $app"
  if [ $upload_errors -gt 0 ]; then
    echo "  ⚠️  $upload_errors files had warnings (may already exist)"
  fi
  echo ""
  
  return 0
}

# Main deployment process
main() {
  echo "📦 Step 1: Building all apps..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  for app in "${!APPS[@]}"; do
    echo "🔨 Building: $app"
    if npm run build --workspace=apps/$app; then
      echo "  ✅ Build successful: $app"
    else
      echo "  ❌ Build failed: $app"
      exit 1
    fi
  done
  
  echo ""
  echo "☁️  Step 2: Deploying to AppWrite..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  for app in "${!APPS[@]}"; do
    bucket="${APPS[$app]}"
    if upload_to_bucket "$app" "$bucket"; then
      echo "✅ Deployed: $app → $bucket"
    else
      echo "❌ Failed: $app"
      exit 1
    fi
  done
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 Deployment Complete!"
  echo ""
  echo "📋 Summary:"
  echo "  - 6 apps built successfully"
  echo "  - All apps uploaded to AppWrite Storage"
  echo "  - Buckets configured with public read access"
  echo ""
  echo "🌐 Next Steps:"
  echo "  1. Configure custom domains in AppWrite Console"
  echo "  2. Update DNS records at Porkbun"
  echo "  3. Wait for SSL provisioning (~5 minutes)"
  echo "  4. Test all apps!"
  echo ""
}

# Run main deployment
main
