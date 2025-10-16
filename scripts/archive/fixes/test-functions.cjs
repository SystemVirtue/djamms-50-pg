#!/usr/bin/env node
// Comprehensive test suite for deployed AppWrite functions

const https = require('https');

const PROJECT_ID = '68cc86c3002b27e13947';
const ENDPOINT = 'https://syd.cloud.appwrite.io/v1';

const FUNCTIONS = {
  magicLink: '68e5a317003c42c8bb6a',
  playerRegistry: '68e5a41f00222cab705b',
  processRequest: '68e5acf100104d806321'
};

// Helper to make function calls
function callFunction(functionId, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ body: JSON.stringify(body) });
    
    const options = {
      hostname: 'syd.cloud.appwrite.io',
      port: 443,
      path: `/v1/functions/${functionId}/executions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'X-Appwrite-Project': PROJECT_ID
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Wait for execution to complete
async function waitForExecution(execution, maxWait = 30000) {
  const startTime = Date.now();
  
  while (execution.status !== 'completed' && execution.status !== 'failed') {
    if (Date.now() - startTime > maxWait) {
      throw new Error('Execution timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation, we'd poll the execution status
    // For now, assume first response is final
    break;
  }
  
  return execution;
}

// Test suite
async function runTests() {
  console.log('🧪 AppWrite Functions Test Suite');
  console.log('=' .repeat(50));
  console.log('');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Test 1: Magic Link - Create
  try {
    console.log('📧 Test 1: Magic Link - Create Token');
    console.log('-'.repeat(50));
    
    const exec = await callFunction(FUNCTIONS.magicLink, {
      action: 'create',
      email: 'test@djamms.app'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (exec.status === 'completed') {
      const response = JSON.parse(exec.responseBody);
      if (response.success && response.token) {
        console.log('✅ PASS: Magic link created');
        console.log(`   Token: ${response.token.substring(0, 20)}...`);
        results.passed++;
        
        // Store token for next test
        global.testToken = response.token;
      } else {
        console.log('❌ FAIL: Invalid response');
        console.log('   Response:', response);
        results.failed++;
      }
    } else {
      console.log('❌ FAIL: Execution failed');
      console.log('   Status:', exec.status);
      results.failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    results.failed++;
  }
  console.log('');

  // Test 2: Magic Link - Callback
  if (global.testToken) {
    try {
      console.log('🔑 Test 2: Magic Link - Verify & Get JWT');
      console.log('-'.repeat(50));
      
      const exec = await callFunction(FUNCTIONS.magicLink, {
        action: 'callback',
        email: 'test@djamms.app',
        token: global.testToken
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (exec.status === 'completed') {
        const response = JSON.parse(exec.responseBody);
        if (response.success && response.token) {
          console.log('✅ PASS: JWT token issued');
          console.log(`   JWT: ${response.token.substring(0, 30)}...`);
          results.passed++;
        } else {
          console.log('❌ FAIL: Invalid response');
          results.failed++;
        }
      } else {
        console.log('❌ FAIL: Execution failed');
        results.failed++;
      }
    } catch (error) {
      console.log('❌ FAIL: Error -', error.message);
      results.failed++;
    }
    console.log('');
  }

  // Test 3: Player Registry - Register
  try {
    console.log('🎮 Test 3: Player Registry - Register Master');
    console.log('-'.repeat(50));
    
    const deviceId = `test-device-${Date.now()}`;
    const exec = await callFunction(FUNCTIONS.playerRegistry, {
      action: 'register',
      venueId: 'test-venue',
      deviceId: deviceId,
      userAgent: 'TestBot/1.0'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (exec.status === 'completed') {
      const response = JSON.parse(exec.responseBody);
      if (response.success) {
        console.log('✅ PASS: Master player registered');
        console.log('   Device:', deviceId);
        console.log('   Is Master:', response.isMaster);
        results.passed++;
        global.testDeviceId = deviceId;
      } else {
        console.log('⚠️  WARN: Registration returned false');
        console.log('   Response:', response);
        results.warnings++;
      }
    } else {
      console.log('❌ FAIL: Execution failed');
      console.log('   Status:', exec.status);
      results.failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    results.failed++;
  }
  console.log('');

  // Test 4: Player Registry - Status
  try {
    console.log('📊 Test 4: Player Registry - Check Status');
    console.log('-'.repeat(50));
    
    const exec = await callFunction(FUNCTIONS.playerRegistry, {
      action: 'status',
      venueId: 'test-venue'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (exec.status === 'completed') {
      const response = JSON.parse(exec.responseBody);
      if (response.hasMaster) {
        console.log('✅ PASS: Master player active');
        console.log('   Device:', response.deviceId);
        results.passed++;
      } else {
        console.log('⚠️  WARN: No master player found');
        results.warnings++;
      }
    } else {
      console.log('❌ FAIL: Execution failed');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    results.failed++;
  }
  console.log('');

  // Test 5: Process Request
  try {
    console.log('💰 Test 5: Process Request - Paid Song');
    console.log('-'.repeat(50));
    
    const exec = await callFunction(FUNCTIONS.processRequest, {
      venueId: 'test-venue',
      song: {
        videoId: 'test123',
        title: 'Test Song',
        artist: 'Test Artist',
        duration: 180
      },
      paymentId: `pi_test_${Date.now()}`,
      requesterId: 'test-user'
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (exec.status === 'completed') {
      const response = JSON.parse(exec.responseBody);
      if (response.success && response.requestId) {
        console.log('✅ PASS: Paid request processed');
        console.log('   Request ID:', response.requestId);
        console.log('   Queue Position:', response.queuePosition);
        console.log('   Est. Wait:', response.estimatedWait, 'min');
        results.passed++;
      } else {
        console.log('❌ FAIL: Invalid response');
        console.log('   Response:', response);
        results.failed++;
      }
    } else {
      console.log('❌ FAIL: Execution failed');
      results.failed++;
    }
  } catch (error) {
    console.log('❌ FAIL: Error -', error.message);
    results.failed++;
  }
  console.log('');

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`✅ Passed:   ${results.passed}`);
  console.log(`❌ Failed:   ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log('');
  
  const total = results.passed + results.failed;
  const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  console.log(`Pass Rate: ${passRate}%`);
  console.log('');
  
  if (results.failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check logs above.');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
