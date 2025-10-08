#!/usr/bin/env node

/**
 * Direct API test for magic link authentication
 * Tests the AppWrite function directly without browser automation
 */

const APPWRITE_ENDPOINT = 'https://syd.cloud.appwrite.io/v1';
const PROJECT_ID = '68cc86c3002b27e13947';
const FUNCTION_ID = '68e5a317003c42c8bb6a';

async function testMagicLinkAPI() {
  console.log('🧪 Testing Magic Link API...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  let passed = 0;
  let failed = 0;

  // Test 1: Create Magic Link
  console.log('Test 1: Creating magic link...');
  try {
    const createResponse = await fetch(`${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({
        body: JSON.stringify({
          action: 'create',
          email: testEmail,
          redirectUrl: 'http://localhost:3002/auth/callback',
        }),
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`HTTP ${createResponse.status}: ${await createResponse.text()}`);
    }

    const createData = await createResponse.json();
    const createBody = JSON.parse(createData.responseBody);

    if (!createBody.success) {
      throw new Error(`Create failed: ${createBody.error}`);
    }

    if (!createBody.magicLink || !createBody.token) {
      throw new Error('Missing magicLink or token in response');
    }

    // Verify URL format
    if (!createBody.magicLink.includes('secret=') || !createBody.magicLink.includes('userId=')) {
      throw new Error(`Invalid URL format: ${createBody.magicLink}`);
    }

    console.log('✅ PASS: Magic link created successfully');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Token: ${createBody.token.substring(0, 20)}...`);
    console.log(`   URL format: ${createBody.magicLink.split('?')[0]}?secret=...&userId=...`);
    passed++;

    // Test 2: Verify Magic Link
    console.log('\nTest 2: Verifying magic link...');
    const verifyResponse = await fetch(`${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({
        body: JSON.stringify({
          action: 'verify',
          secret: createBody.token,
          userId: testEmail,
        }),
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error(`HTTP ${verifyResponse.status}: ${await verifyResponse.text()}`);
    }

    const verifyData = await verifyResponse.json();
    const verifyBody = JSON.parse(verifyData.responseBody);

    if (!verifyBody.success) {
      throw new Error(`Verify failed: ${verifyBody.error}`);
    }

    if (!verifyBody.token || !verifyBody.user) {
      throw new Error('Missing JWT token or user in response');
    }

    if (verifyBody.user.email !== testEmail) {
      throw new Error(`Email mismatch: expected ${testEmail}, got ${verifyBody.user.email}`);
    }

    console.log('✅ PASS: Magic link verified successfully');
    console.log(`   JWT: ${verifyBody.token.substring(0, 30)}...`);
    console.log(`   User ID: ${verifyBody.user.userId}`);
    console.log(`   Role: ${verifyBody.user.role}`);
    passed++;

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 3: Invalid Token
  console.log('\nTest 3: Testing invalid token...');
  try {
    const invalidResponse = await fetch(`${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({
        body: JSON.stringify({
          action: 'verify',
          secret: 'invalid_token_12345',
          userId: testEmail,
        }),
      }),
    });

    const invalidData = await invalidResponse.json();
    const invalidBody = JSON.parse(invalidData.responseBody);

    if (invalidBody.success) {
      throw new Error('Invalid token was accepted (should have been rejected)');
    }

    console.log('✅ PASS: Invalid token correctly rejected');
    console.log(`   Error message: ${invalidBody.error}`);
    passed++;

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    failed++;
  }

  // Test 4: Duplicate verification (token should be marked as used)
  console.log('\nTest 4: Testing token reuse prevention...');
  try {
    // Create a new link
    const newCreateResponse = await fetch(`${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({
        body: JSON.stringify({
          action: 'create',
          email: `reuse-test-${Date.now()}@example.com`,
          redirectUrl: 'http://localhost:3002/auth/callback',
        }),
      }),
    });

    const newCreateData = await newCreateResponse.json();
    const newCreateBody = JSON.parse(newCreateData.responseBody);
    const token = newCreateBody.token;

    // Verify once
    await fetch(`${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({
        body: JSON.stringify({
          action: 'verify',
          secret: token,
          userId: newCreateBody.magicLink.match(/userId=([^&]+)/)[1],
        }),
      }),
    });

    // Try to verify again (should fail)
    const reuseResponse = await fetch(`${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': PROJECT_ID,
      },
      body: JSON.stringify({
        body: JSON.stringify({
          action: 'verify',
          secret: token,
          userId: newCreateBody.magicLink.match(/userId=([^&]+)/)[1],
        }),
      }),
    });

    const reuseData = await reuseResponse.json();
    const reuseBody = JSON.parse(reuseData.responseBody);

    if (reuseBody.success) {
      throw new Error('Token reuse was allowed (should have been prevented)');
    }

    console.log('✅ PASS: Token reuse correctly prevented');
    console.log(`   Error message: ${reuseBody.error}`);
    passed++;

  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    failed++;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/4`);
  console.log(`❌ Failed: ${failed}/4`);
  console.log(`Success Rate: ${Math.round((passed / 4) * 100)}%`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Magic link authentication is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
testMagicLinkAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
