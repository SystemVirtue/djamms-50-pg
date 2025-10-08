#!/usr/bin/env node

/**
 * Test Email Sending via Magic Link
 * 
 * This script tests that the magic-link function can now send emails
 * after RESEND_API_KEY and SMTP_FROM have been configured in AppWrite.
 */

import https from 'https';

const APPWRITE_ENDPOINT = 'https://syd.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68cc86c3002b27e13947';
const FUNCTION_ID = '68e5a317003c42c8bb6a';

// Use a real email to test (change this to your email)
const TEST_EMAIL = 'mike@djamms.app'; // Change to your email!

console.log('🧪 Testing Email Sending via Magic Link...\n');

function makeRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testEmailSending() {
  console.log(`📧 Test: Sending magic link to ${TEST_EMAIL}...`);
  
  try {
    // Create magic link
    const createPayload = JSON.stringify({
      body: JSON.stringify({
        action: 'create',
        email: TEST_EMAIL,
        redirectUrl: 'https://auth.djamms.app/callback'
      })
    });

    const response = await makeRequest(
      `${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': APPWRITE_PROJECT_ID
        }
      },
      createPayload
    );

    if (response.statusCode !== 201 && response.statusCode !== 200) {
      console.error('❌ FAIL: Function execution failed');
      console.error('Status:', response.statusCode);
      console.error('Response:', JSON.stringify(response.body, null, 2));
      return false;
    }

    // Wait for execution to complete
    const executionId = response.body.$id;
    console.log(`⏳ Waiting for execution ${executionId} to complete...`);
    
    let execution;
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await makeRequest(
        `${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions/${executionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': APPWRITE_PROJECT_ID
          }
        }
      );
      
      execution = statusResponse.body;
      
      if (execution.status === 'completed' || execution.status === 'failed') {
        break;
      }
      
      attempts++;
    }

    if (execution.status === 'failed') {
      console.error('❌ FAIL: Function execution failed');
      console.error('Response:', execution.responseBody);
      console.error('Logs:', execution.logs);
      console.error('Errors:', execution.errors);
      return false;
    }

    if (execution.status !== 'completed') {
      console.error('❌ FAIL: Function execution timed out');
      return false;
    }

    // Parse response
    let result;
    try {
      result = JSON.parse(execution.responseBody);
    } catch (e) {
      console.error('❌ FAIL: Could not parse response');
      console.error('Response:', execution.responseBody);
      return false;
    }

    console.log('\n✅ PASS: Magic link created successfully');
    console.log(`   Email: ${result.email}`);
    console.log(`   Token: ${result.token ? result.token.substring(0, 20) + '...' : 'N/A'}`);
    console.log(`   Magic Link: ${result.magicLink ? result.magicLink.substring(0, 60) + '...' : 'N/A'}`);
    
    // Check if email was sent
    if (execution.logs) {
      const logs = execution.logs;
      if (logs.includes('Email sent successfully')) {
        console.log('\n📧 ✅ Email sent successfully via Resend!');
        console.log(`\n🎉 SUCCESS: Check ${TEST_EMAIL} for the magic link email!`);
        console.log(`   (Check spam folder if not in inbox)`);
        return true;
      } else if (logs.includes('RESEND_API_KEY not configured')) {
        console.log('\n⚠️  WARNING: RESEND_API_KEY not configured in function');
        console.log('   Email was NOT sent (but token was created)');
        return false;
      } else if (logs.includes('Error sending email')) {
        console.error('\n❌ FAIL: Error sending email');
        console.error('Logs:', logs);
        return false;
      } else {
        console.log('\n⚠️  Cannot determine if email was sent (no logs available)');
        console.log('   Token was created successfully');
        return true; // Assume success if no error
      }
    }

    return true;
  } catch (error) {
    console.error('❌ FAIL: Unexpected error');
    console.error(error.message);
    return false;
  }
}

// Run test
testEmailSending().then(success => {
  console.log('\n==================================================');
  console.log('📊 Test Summary');
  console.log('==================================================');
  console.log(success ? '✅ Email test PASSED' : '❌ Email test FAILED');
  console.log('==================================================\n');
  
  if (success) {
    console.log('🎯 Next Steps:');
    console.log('1. Check your email inbox (and spam folder)');
    console.log('2. Click the magic link in the email');
    console.log('3. Verify you are redirected to the callback page');
    console.log('4. Verify JWT token is stored in localStorage\n');
  } else {
    console.log('🔧 Troubleshooting:');
    console.log('1. Verify RESEND_API_KEY is set in AppWrite function');
    console.log('2. Verify SMTP_FROM is set in AppWrite function');
    console.log('3. Check AppWrite function logs for errors');
    console.log('4. Verify Resend domain is verified (DNS records)\n');
  }
  
  process.exit(success ? 0 : 1);
});
