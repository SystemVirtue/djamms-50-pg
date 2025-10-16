import { test, expect } from '@playwright/test';

test.describe('Auth Magic Link - Console Error Monitoring', () => {
  let consoleMessages: any[] = [];
  let consoleErrors: any[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture all console messages
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
      
      if (msg.type() === 'error') {
        consoleErrors.push({
          text: text,
          timestamp: new Date().toISOString()
        });
      }
      
      // Log to test output
      console.log(`[${msg.type()}] ${text}`);
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
      consoleErrors.push({
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
  });

  test('should monitor console when sending magic link', async ({ page }) => {
    // Reset message arrays
    consoleMessages = [];
    consoleErrors = [];

    console.log('\n=== Starting Auth Test ===\n');

    // Navigate to auth page with longer timeout
    await page.goto('http://localhost:3003', { timeout: 30000 });
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('✓ Page loaded');

    // Check if login form is visible
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    console.log('✓ Email input visible');

    // Enter email address
    const testEmail = 'test@example.com';
    await emailInput.fill(testEmail);
    console.log(`✓ Filled email: ${testEmail}`);

    // Wait a moment for any validation
    await page.waitForTimeout(500);

    // Find and click submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    console.log('✓ Submit button visible');

    // Click submit and wait for response
    console.log('\n=== Clicking Submit Button ===\n');
    await submitButton.click();

    // Wait for API call to complete (or fail)
    await page.waitForTimeout(5000);

    // Print all console messages
    console.log('\n=== All Console Messages ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
    });

    // Print errors separately
    console.log('\n=== Console Errors ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.text}`);
        if (err.stack) {
          console.log(`   Stack: ${err.stack}`);
        }
      });
    } else {
      console.log('No console errors detected');
    }

    // Check for specific error patterns
    const htmlError = consoleErrors.find(err => 
      err.text.includes('Unexpected token') || 
      err.text.includes('<!DOCTYPE')
    );

    const magicLinkError = consoleErrors.find(err => 
      err.text.includes('Magic link') || 
      err.text.includes('magic link')
    );

    if (htmlError) {
      console.log('\n❌ DETECTED: HTML response error (function not deployed)');
      console.log('   Error:', htmlError.text);
    }

    if (magicLinkError) {
      console.log('\n❌ DETECTED: Magic link error');
      console.log('   Error:', magicLinkError.text);
    }

    // Look for success indicators
    const successMessages = consoleMessages.filter(msg => 
      msg.text.includes('✅') || 
      msg.text.includes('Magic link sent') ||
      msg.text.includes('completed')
    );

    if (successMessages.length > 0) {
      console.log('\n✅ Success indicators found:');
      successMessages.forEach(msg => {
        console.log(`   ${msg.text}`);
      });
    }

    // Check for magic link logs
    const magicLinkLogs = consoleMessages.filter(msg => 
      msg.text.includes('Magic Link Send') ||
      msg.text.includes('Magic link execution') ||
      msg.text.includes('endpoint:') ||
      msg.text.includes('functionId:')
    );

    if (magicLinkLogs.length > 0) {
      console.log('\n📋 Magic Link Configuration:');
      magicLinkLogs.forEach(msg => {
        console.log(`   ${msg.text}`);
      });
    }

    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Success indicators: ${successMessages.length}`);
    console.log(`Magic link logs: ${magicLinkLogs.length}`);

    // The test will show all output but won't fail
    // This is for monitoring purposes
    console.log('\n=== Test Complete ===\n');
  });

  test('should capture detailed execution result', async ({ page }) => {
    consoleMessages = [];
    consoleErrors = [];

    console.log('\n=== Detailed Execution Result Test ===\n');

    await page.goto('http://localhost:3003', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('monitor@test.com');

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait longer to capture all async operations
    await page.waitForTimeout(8000);

    // Look for the new detailed logging
    const executionResult = consoleMessages.find(msg => 
      msg.text.includes('Magic link execution result')
    );

    if (executionResult) {
      console.log('\n📊 Execution Result Found:');
      console.log(executionResult.text);

      // Try to extract status from logs
      const statusLog = consoleMessages.find(msg => msg.text.includes('status:'));
      const statusCodeLog = consoleMessages.find(msg => msg.text.includes('statusCode:'));
      const responseLog = consoleMessages.find(msg => msg.text.includes('response:'));

      if (statusLog) console.log('   Status:', statusLog.text);
      if (statusCodeLog) console.log('   Status Code:', statusCodeLog.text);
      if (responseLog) console.log('   Response:', responseLog.text);
    } else {
      console.log('\n⚠️  No execution result found in logs');
    }

    // Check for error details
    const errorDetails = consoleMessages.find(msg => 
      msg.text.includes('Error details:')
    );

    if (errorDetails) {
      console.log('\n❌ Error Details Found:');
      console.log(errorDetails.text);
    }
  });
});
