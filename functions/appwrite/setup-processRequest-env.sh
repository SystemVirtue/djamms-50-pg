#!/bin/bash

# Add environment variables for processRequest function
# Function ID: 68e5acf100104d806321

echo "🔧 Setting up environment variables for processRequest function..."
echo ""
echo "Please run these commands in your terminal to add environment variables:"
echo ""

# Get values from .env
ENDPOINT=$(grep VITE_APPWRITE_ENDPOINT .env | cut -d '=' -f2)
PROJECT_ID=$(grep VITE_APPWRITE_PROJECT_ID .env | cut -d '=' -f2)
DATABASE_ID=$(grep VITE_APPWRITE_DATABASE_ID .env | cut -d '=' -f2)
API_KEY=$(grep VITE_APPWRITE_API_KEY .env | cut -d '=' -f2)

echo "cd functions/appwrite"
echo ""
echo "# Add APPWRITE_ENDPOINT"
echo "appwrite functions createVariable \\"
echo "  --functionId 68e5acf100104d806321 \\"
echo "  --key APPWRITE_ENDPOINT \\"
echo "  --value \"$ENDPOINT\""
echo ""
echo "# Add APPWRITE_PROJECT_ID"
echo "appwrite functions createVariable \\"
echo "  --functionId 68e5acf100104d806321 \\"
echo "  --key APPWRITE_PROJECT_ID \\"
echo "  --value \"$PROJECT_ID\""
echo ""
echo "# Add APPWRITE_DATABASE_ID"
echo "appwrite functions createVariable \\"
echo "  --functionId 68e5acf100104d806321 \\"
echo "  --key APPWRITE_DATABASE_ID \\"
echo "  --value \"$DATABASE_ID\""
echo ""
echo "# Add APPWRITE_API_KEY"
echo "appwrite functions createVariable \\"
echo "  --functionId 68e5acf100104d806321 \\"
echo "  --key APPWRITE_API_KEY \\"
echo "  --value \"$API_KEY\""
echo ""
echo "✅ After running these commands, your processRequest function will be ready!"
