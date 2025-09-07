#!/usr/bin/env node

/**
 * Simple runner script for Airtable schema updater
 * Usage: node scripts/run-schema-update.js
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Running Airtable Schema Updater...\n');

// Check if environment variables are set
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.log('❌ Please set your Airtable credentials:');
  console.log('   export AIRTABLE_API_KEY="your_api_key"');
  console.log('   export AIRTABLE_BASE_ID="your_base_id"');
  console.log('\n   Or create a .env file with:');
  console.log('   AIRTABLE_API_KEY=your_api_key');
  console.log('   AIRTABLE_BASE_ID=your_base_id');
  process.exit(1);
}

try {
  // Run the main schema updater script
  execSync('node scripts/update-airtable-schema.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('\n✅ Airtable schema update completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('  1. Verify the tables in your Airtable base');
  console.log('  2. Check that all fields are created correctly');
  console.log('  3. Test data entry and validation');
  console.log('  4. Update your application code if needed');
} catch (error) {
  console.error('\n❌ Error running Airtable schema updater:');
  console.error(error.message);
  process.exit(1);
}
