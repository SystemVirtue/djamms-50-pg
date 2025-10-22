#!/bin/bash
source .env
appwrite client --endpoint $APPWRITE_ENDPOINT --project-id $APPWRITE_PROJECT_ID --key $APPWRITE_API_KEY
appwrite sites list-deployments --site-id 68f0ea9700352a1e01f8 | head -30
