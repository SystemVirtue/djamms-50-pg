#!/usr/bin/env node

/**
 * Resend Domain Setup Helper
 * 
 * This script helps you:
 * 1. Check if domain exists in Resend
 * 2. Add domain to Resend if needed
 * 3. Get DNS records to add to Vercel
 * 4. Verify domain after DNS records are added
 */

import { Resend } from 'resend';

const RESEND_API_KEY = 're_Ps9eqvDb_C8YeZ9TyD4aYHZh88fRmpVqw';
const DOMAIN = 'djamms.app';

const resend = new Resend(RESEND_API_KEY);

console.log('🔧 Resend Domain Setup Helper\n');
console.log(`Domain: ${DOMAIN}`);
console.log(`API Key: ${RESEND_API_KEY.substring(0, 10)}...\n`);

async function main() {
  try {
    // Step 1: List existing domains
    console.log('📋 Step 1: Checking existing domains...');
    const { data: domains } = await resend.domains.list();
    
    if (domains && domains.data) {
      console.log(`Found ${domains.data.length} domain(s):\n`);
      domains.data.forEach(domain => {
        console.log(`  - ${domain.name}`);
        console.log(`    ID: ${domain.id}`);
        console.log(`    Status: ${domain.status}`);
        console.log(`    Region: ${domain.region || 'N/A'}`);
        console.log(`    Created: ${domain.created_at}\n`);
      });
    }

    // Check if our domain exists
    const existingDomain = domains?.data?.find(d => d.name === DOMAIN);
    
    let domainId;
    
    if (existingDomain) {
      console.log(`✅ Domain ${DOMAIN} already exists!`);
      domainId = existingDomain.id;
      
      if (existingDomain.status === 'verified') {
        console.log('🎉 Domain is already VERIFIED! No further action needed.\n');
        return;
      } else {
        console.log(`⚠️  Domain status: ${existingDomain.status}`);
        console.log('Proceeding to get DNS records...\n');
      }
    } else {
      // Step 2: Add domain
      console.log(`\n📝 Step 2: Adding domain ${DOMAIN} to Resend...`);
      const { data: newDomain, error } = await resend.domains.create({
        name: DOMAIN
      });
      
      if (error) {
        console.error('❌ Error adding domain:', error);
        return;
      }
      
      console.log('✅ Domain added successfully!');
      domainId = newDomain.id;
      console.log(`   Domain ID: ${domainId}\n`);
    }

    // Step 3: Get domain details with DNS records
    console.log('📋 Step 3: Getting DNS records...\n');
    const { data: domainDetails } = await resend.domains.get(domainId);
    
    if (!domainDetails) {
      console.error('❌ Could not retrieve domain details');
      return;
    }

    console.log('=' .repeat(80));
    console.log('DNS RECORDS TO ADD TO VERCEL');
    console.log('=' .repeat(80));
    console.log('\n🌐 VERCEL DOMAIN SETTINGS');
    console.log('Go to: https://vercel.com/settings/domains\n');

    // Display records in Vercel format
    if (domainDetails.records) {
      const records = domainDetails.records;
      
      // MX Record
      console.log('━'.repeat(80));
      console.log('1️⃣  MX RECORD (for receiving bounce notifications)');
      console.log('━'.repeat(80));
      const mxRecord = records.find(r => r.type === 'MX');
      if (mxRecord) {
        console.log('In Vercel:');
        console.log(`  Type:     MX`);
        console.log(`  Name:     send`);
        console.log(`  Value:    ${mxRecord.value}`);
        console.log(`  Priority: 10`);
        console.log(`  TTL:      60 (default)\n`);
        console.log('⚠️  NOTE: Use "send" not "send.djamms.app"');
        console.log('⚠️  NOTE: If Priority 10 is taken, use 11 or 12\n');
      }

      // SPF TXT Record
      console.log('━'.repeat(80));
      console.log('2️⃣  TXT RECORD - SPF (Sender Policy Framework)');
      console.log('━'.repeat(80));
      const spfRecord = records.find(r => r.type === 'TXT' && r.name.includes('send'));
      if (spfRecord) {
        console.log('In Vercel:');
        console.log(`  Type:  TXT`);
        console.log(`  Name:  send`);
        console.log(`  Value: ${spfRecord.value}`);
        console.log(`  TTL:   60 (default)\n`);
        console.log('⚠️  NOTE: Use "send" not "send.djamms.app"\n');
      }

      // DKIM TXT Record
      console.log('━'.repeat(80));
      console.log('3️⃣  TXT RECORD - DKIM (Domain Keys Identified Mail)');
      console.log('━'.repeat(80));
      const dkimRecord = records.find(r => r.type === 'TXT' && r.name.includes('_domainkey'));
      if (dkimRecord) {
        console.log('In Vercel:');
        console.log(`  Type:  TXT`);
        console.log(`  Name:  resend._domainkey`);
        console.log(`  Value: ${dkimRecord.value}`);
        console.log(`  TTL:   60 (default)\n`);
        console.log('⚠️  NOTE: Use "resend._domainkey" not "resend._domainkey.djamms.app"\n');
      }
    }

    console.log('=' .repeat(80));
    console.log('\n📝 STEP-BY-STEP INSTRUCTIONS\n');
    console.log('1. Go to https://vercel.com/settings/domains');
    console.log('2. Find your domain: djamms.app');
    console.log('3. Click "Edit" or manage DNS records');
    console.log('4. Add each of the 3 records above');
    console.log('5. Save changes');
    console.log('6. Wait 5-10 minutes for DNS propagation');
    console.log('7. Run this script again with --verify flag\n');

    console.log('=' .repeat(80));
    console.log('\n⏭️  NEXT STEPS\n');
    console.log('After adding DNS records to Vercel, run:');
    console.log('  node scripts/resend-setup.mjs --verify\n');
    console.log('Or manually verify in Resend dashboard:');
    console.log('  https://resend.com/domains\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

async function verifyDomain() {
  try {
    console.log('🔍 Verifying domain...\n');
    
    // Get domains first
    const { data: domains } = await resend.domains.list();
    const domain = domains?.data?.find(d => d.name === DOMAIN);
    
    if (!domain) {
      console.error(`❌ Domain ${DOMAIN} not found in Resend`);
      console.log('Run the script without --verify flag first to add the domain.');
      return;
    }

    console.log(`Domain ID: ${domain.id}`);
    console.log(`Current Status: ${domain.status}\n`);

    // Attempt verification
    console.log('Attempting to verify DNS records...');
    const { data: result, error } = await resend.domains.verify(domain.id);
    
    if (error) {
      console.error('❌ Verification failed:', error);
      console.log('\nPossible reasons:');
      console.log('  - DNS records not yet propagated (wait 5-10 minutes)');
      console.log('  - DNS records not added correctly to Vercel');
      console.log('  - Wrong values or names used\n');
      console.log('Verify DNS records with:');
      console.log(`  dig send.djamms.app MX`);
      console.log(`  dig send.djamms.app TXT`);
      console.log(`  dig resend._domainkey.djamms.app TXT\n`);
      return;
    }

    console.log('\n🎉 SUCCESS!');
    console.log('Domain verified successfully!');
    console.log('Status:', result.status);
    console.log('\nYou can now send emails from:', DOMAIN);
    console.log('Example: noreply@djamms.app\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Check for --verify flag
const shouldVerify = process.argv.includes('--verify');

if (shouldVerify) {
  verifyDomain();
} else {
  main();
}
