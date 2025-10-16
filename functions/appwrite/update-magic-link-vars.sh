#!/bin/bash
# Update magic-link function environment variables

set -e

FUNCTION_ID="68e5a317003c42c8bb6a"

# Variable IDs from appwrite functions list
ENDPOINT_VAR_ID="68e5a3bb361bb35b59a2"
PROJECT_VAR_ID="68e5a3de638882dfdbe4"
DATABASE_VAR_ID="68e5a3e1da51f21e130b"
API_KEY_VAR_ID="68e5a3e511f36b485652"
JWT_SECRET_VAR_ID="68e5a3e79d9f7be84541"

# Values from .env
ENDPOINT="https://syd.cloud.appwrite.io/v1"
PROJECT_ID="68cc86c3002b27e13947"
DATABASE_ID="68e57de9003234a84cae"
API_KEY="standard_25289fad1759542a75506309bd927c04928587ec211c9da1b7ab1817d5fb4a67e2aee4fcd29c36738d9fb2e2e8fe0379f7da761f150940a6d0fe6e89a08cc2d1e5cc95720132db4ed19a13396c9c779c467223c754acbc57abfb48469b866bfccce774903a8de9a93b55f65d2b30254447cb6664661d378b3722a979d9d71f92"
JWT_SECRET="9cbd9462fceb05f4a95997e04c98e829f112d943e55926c4054262794d67280bcdf14be3d86840f6722346dacb87cfdb8db3a461938efb1dedfa2e0fdb5363a8"
RESEND_API_KEY="re_Ps9eqvDb_C8YeZ9TyD4aYHZh88fRmpVqw"

echo "🔧 Updating magic-link function environment variables..."
echo ""

echo "1️⃣  Updating APPWRITE_ENDPOINT..."
npx appwrite functions update-variable \
  --function-id "$FUNCTION_ID" \
  --variable-id "$ENDPOINT_VAR_ID" \
  --key "APPWRITE_ENDPOINT" \
  --value "$ENDPOINT"

echo ""
echo "2️⃣  Updating APPWRITE_PROJECT_ID..."
npx appwrite functions update-variable \
  --function-id "$FUNCTION_ID" \
  --variable-id "$PROJECT_VAR_ID" \
  --key "APPWRITE_PROJECT_ID" \
  --value "$PROJECT_ID"

echo ""
echo "3️⃣  Updating APPWRITE_DATABASE_ID..."
npx appwrite functions update-variable \
  --function-id "$FUNCTION_ID" \
  --variable-id "$DATABASE_VAR_ID" \
  --key "APPWRITE_DATABASE_ID" \
  --value "$DATABASE_ID"

echo ""
echo "4️⃣  Updating APPWRITE_API_KEY..."
npx appwrite functions update-variable \
  --function-id "$FUNCTION_ID" \
  --variable-id "$API_KEY_VAR_ID" \
  --key "APPWRITE_API_KEY" \
  --value "$API_KEY"

echo ""
echo "5️⃣  Updating JWT_SECRET..."
npx appwrite functions update-variable \
  --function-id "$FUNCTION_ID" \
  --variable-id "$JWT_SECRET_VAR_ID" \
  --key "JWT_SECRET" \
  --value "$JWT_SECRET"

echo ""
echo "6️⃣  Creating RESEND_API_KEY (if doesn't exist)..."
npx appwrite functions create-variable \
  --function-id "$FUNCTION_ID" \
  --key "RESEND_API_KEY" \
  --value "$RESEND_API_KEY" \
  --secret true \
  2>/dev/null || echo "Variable might already exist, try updating manually if needed"

echo ""
echo "✅ All variables updated successfully!"
echo ""
echo "🔄 Redeploying function to apply changes..."
npx appwrite deploy function --function-id "$FUNCTION_ID"

echo ""
echo "🎉 Done! Test the magic link now:"
echo "   1. Open http://localhost:3003 (or your auth app)"
echo "   2. Enter an email address"
echo "   3. Check browser console for logs"
echo "   4. Check your email for the magic link"
