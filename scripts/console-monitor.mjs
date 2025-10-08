#!/usr/bin/env node

/**
 * Console Monitor Script
 * Checks all running dev servers for console errors using Playwright
 */

import { chromium } from '@playwright/test';

const servers = [
  { name: 'Landing', url: 'http://localhost:3000/' },
  { name: 'Player', url: 'http://localhost:3001/player/venue1' },
  { name: 'Auth', url: 'http://localhost:3002/auth/login' },
  { name: 'Admin', url: 'http://localhost:3003/admin/venue1' },
  { name: 'Kiosk', url: 'http://localhost:3004/kiosk/venue1' },
];

async function monitorConsole(name, url) {
  console.log(`\n🔍 Checking ${name} (${url})...`);
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  const warnings = [];
  const logs = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      errors.push(text);
    } else if (type === 'warning') {
      warnings.push(text);
    } else if (type === 'log' || type === 'info') {
      logs.push(text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  // Capture failed requests
  page.on('requestfailed', request => {
    const url = request.url();
    const failure = request.failure();
    errors.push(`Failed Request: ${url} - ${failure?.errorText || 'Unknown error'}`);
  });

  // Capture response errors (404, 500, etc.)
  page.on('response', response => {
    if (response.status() >= 400) {
      errors.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    
    // Wait a bit for React to render and for any async operations
    await page.waitForTimeout(2000);

    // Check for React error boundaries
    const hasErrorBoundary = await page.evaluate(() => {
      return document.body.textContent?.includes('Something went wrong') || 
             document.body.textContent?.includes('Error:');
    });

    console.log(`\n📊 ${name} Results:`);
    console.log(`   ✅ Page loaded successfully`);
    
    if (hasErrorBoundary) {
      console.log(`   ⚠️  React Error Boundary detected`);
    }

    if (errors.length > 0) {
      console.log(`\n   ❌ Errors (${errors.length}):`);
      errors.forEach((err, i) => {
        console.log(`      ${i + 1}. ${err}`);
      });
    } else {
      console.log(`   ✅ No errors`);
    }

    if (warnings.length > 0) {
      console.log(`\n   ⚠️  Warnings (${warnings.length}):`);
      warnings.forEach((warn, i) => {
        console.log(`      ${i + 1}. ${warn}`);
      });
    }

    if (logs.length > 0 && logs.length <= 10) {
      console.log(`\n   📝 Console Logs (${logs.length}):`);
      logs.forEach((log, i) => {
        console.log(`      ${i + 1}. ${log}`);
      });
    } else if (logs.length > 10) {
      console.log(`\n   📝 Console Logs: ${logs.length} messages (showing first 5)`);
      logs.slice(0, 5).forEach((log, i) => {
        console.log(`      ${i + 1}. ${log}`);
      });
    }

  } catch (error) {
    console.log(`   ❌ Failed to load: ${error.message}`);
    errors.push(`Navigation error: ${error.message}`);
  }

  await browser.close();
  
  return { errors, warnings, logs };
}

async function main() {
  console.log('🚀 Starting Console Monitor...\n');
  console.log('=' .repeat(60));

  const results = {};

  for (const server of servers) {
    try {
      results[server.name] = await monitorConsole(server.name, server.url);
    } catch (error) {
      console.log(`\n❌ ${server.name} - Fatal Error: ${error.message}`);
      results[server.name] = { 
        errors: [`Fatal: ${error.message}`], 
        warnings: [], 
        logs: [] 
      };
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary Report:');
  console.log('='.repeat(60));

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const [name, result] of Object.entries(results)) {
    const errorCount = result.errors.length;
    const warningCount = result.warnings.length;
    totalErrors += errorCount;
    totalWarnings += warningCount;

    const status = errorCount === 0 ? '✅' : '❌';
    console.log(`${status} ${name}: ${errorCount} errors, ${warningCount} warnings`);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n🎯 Total: ${totalErrors} errors, ${totalWarnings} warnings across all apps`);

  if (totalErrors === 0) {
    console.log('\n🎉 All apps are running without errors!\n');
  } else {
    console.log('\n⚠️  Please review the errors above and fix them.\n');
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
