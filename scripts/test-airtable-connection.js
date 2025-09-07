#!/usr/bin/env node

/**
 * Test Airtable Connection
 * Simple script to test if Airtable API is working correctly
 */

import Airtable from 'airtable';
import { airtableConfig } from './airtable-config.js';

const config = {
  apiKey: process.env.AIRTABLE_API_KEY || airtableConfig.apiKey,
  baseId: process.env.AIRTABLE_BASE_ID || airtableConfig.baseId
};

console.log('🧪 Testing Airtable Connection...\n');

console.log('Configuration:');
console.log(`  API Key: ${config.apiKey.substring(0, 10)}...`);
console.log(`  Base ID: ${config.baseId}\n`);

try {
  // Initialize Airtable
  console.log('1. Initializing Airtable...');
  const airtable = new Airtable({ apiKey: config.apiKey });
  console.log('   ✅ Airtable instance created');

  // Get base
  console.log('2. Getting base...');
  const base = airtable.base(config.baseId);
  console.log('   ✅ Base instance created');

  // Test listing tables
  console.log('3. Testing table listing...');
  const tables = await base.tables.list();
  console.log(`   ✅ Found ${tables.length} tables`);
  
  if (tables.length > 0) {
    console.log('   Tables:');
    tables.forEach(table => {
      console.log(`     - ${table.name} (${table.id})`);
    });
  }

  console.log('\n✅ Airtable connection test successful!');
  console.log('The API is working correctly.');

} catch (error) {
  console.error('\n❌ Airtable connection test failed:');
  console.error(`Error: ${error.message}`);
  
  if (error.message.includes('permission')) {
    console.error('\n💡 This might be a permission issue:');
    console.error('   - Check if your API key has access to the base');
    console.error('   - Verify the base ID is correct');
  }
  
  if (error.message.includes('not found')) {
    console.error('\n💡 Base not found:');
    console.error('   - Check if the base ID is correct');
    console.error('   - Verify the base exists and is accessible');
  }
  
  if (error.message.includes('unauthorized')) {
    console.error('\n💡 Authentication failed:');
    console.error('   - Check if your API key is correct');
    console.error('   - Verify the API key format (should start with "pat")');
  }
  
  process.exit(1);
}
