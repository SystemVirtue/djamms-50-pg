#!/bin/bash
# Monitor AppWrite deployment status

SITE_ID="djamms-unified"
DEPLOYMENT_ID="68e7be9a4fe996c27571"

echo "🔍 Monitoring AppWrite deployment..."
echo "Site ID: $SITE_ID"
echo "Deployment ID: $DEPLOYMENT_ID"
echo ""

while true; do
  STATUS=$(appwrite sites get-deployment \
    --site-id "$SITE_ID" \
    --deployment-id "$DEPLOYMENT_ID" 2>&1 | grep "^status :" | awk '{print $3}')
  
  echo "[$(date +%H:%M:%S)] Status: $STATUS"
  
  if [ "$STATUS" = "ready" ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Getting site URL..."
    appwrite sites get --site-id "$SITE_ID" 2>&1 | grep -E "(live|deploymentId)"
    echo ""
    echo "🎉 Your site is live!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "📋 Build logs:"
    appwrite sites get-deployment \
      --site-id "$SITE_ID" \
      --deployment-id "$DEPLOYMENT_ID" 2>&1 | grep -A 50 "buildLogs"
    break
  fi
  
  sleep 10
done
