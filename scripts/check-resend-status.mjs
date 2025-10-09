#!/usr/bin/env node

/**
 * Check Resend Domain Status
 */

import { Resend } from 'resend';

const RESEND_API_KEY = 're_Ps9eqvDb_C8YeZ9TyD4aYHZh88fRmpVqw';
const DOMAIN = 'djamms.app';

const resend = new Resend(RESEND_API_KEY);

async function checkStatus() {
  try {
    console.log('🔍 Checking Resend Domain Status...\n');
    
    // List all domains
    const { data: domains, error: listError } = await resend.domains.list();
    
    if (listError) {
      console.error('❌ Error listing domains:', listError);
      return;
    }
    
    const domain = domains?.data?.find(d => d.name === DOMAIN);
    
    if (!domain) {
      console.error(`❌ Domain ${DOMAIN} not found`);
      return;
    }
    
    console.log('📋 Domain Details:');
    console.log('  ID:', domain.id);
    console.log('  Name:', domain.name);
    console.log('  Status:', domain.status);
    console.log('  Region:', domain.region);
    console.log('  Created:', domain.created_at);
    
    console.log('\n📊 DNS Records:');
    if (domain.records) {
      domain.records.forEach(record => {
        console.log(`  ${record.type}: ${record.name} → ${record.value}`);
      });
    }
    
    if (domain.status === 'verified') {
      console.log('\n✅ Domain is VERIFIED! You can send emails.');
    } else if (domain.status === 'not_started' || domain.status === 'pending') {
      console.log('\n⚠️  Domain is NOT verified yet.');
      console.log('   Status:', domain.status);
      console.log('\n   Try verifying again:');
      console.log('   node scripts/resend-setup.mjs --verify');
    } else {
      console.log('\n❓ Domain status:', domain.status);
    }
    
    // Get detailed domain info
    console.log('\n🔍 Getting detailed domain info...');
    const { data: details, error: detailError } = await resend.domains.get(domain.id);
    
    if (detailError) {
      console.error('Error getting details:', detailError);
      return;
    }
    
    console.log('\n📋 Detailed Status:');
    console.log(JSON.stringify(details, null, 2));
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkStatus();
