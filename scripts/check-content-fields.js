import Airtable from 'airtable';
import { airtableConfig } from './airtable-config.js';

const config = {
  apiKey: process.env.AIRTABLE_API_KEY || airtableConfig.apiKey,
  baseId: process.env.AIRTABLE_BASE_ID || airtableConfig.baseId
};

// Initialize Airtable
const base = new Airtable({
  apiKey: config.apiKey
}).base(config.baseId);

async function checkContentFields() {
  try {
    console.log('🔍 Checking Content table fields...\n');
    
    // Get one record to see available fields
    const records = await base('Content').select({ maxRecords: 1 }).all();
    
    if (records.length === 0) {
      console.log('❌ No records found in Content table');
      return;
    }
    
    const record = records[0];
    console.log('📊 Available fields in Content table:');
    console.log(`Record ID: ${record.id}\n`);
    
    Object.keys(record.fields).forEach(fieldName => {
      const value = record.fields[fieldName];
      const type = typeof value;
      console.log(`  ${fieldName}: ${type} = ${JSON.stringify(value)}`);
    });
    
    console.log('\n🎯 Expected fields for GroupB Dashboard:');
    const expectedFields = ['Title', 'TargetGroup', 'YouTubeURL', 'Order', 'ReleaseDay'];
    expectedFields.forEach(field => {
      const exists = field in record.fields;
      console.log(`  ${field}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    });
    
    // Check if there are similar field names
    console.log('\n🔍 Possible alternative field names:');
    Object.keys(record.fields).forEach(fieldName => {
      const lower = fieldName.toLowerCase();
      if (lower.includes('release') || lower.includes('day') || lower.includes('order')) {
        console.log(`  📌 "${fieldName}" - might be the field we need`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error checking Content fields:', error);
  }
}

console.log('🚀 Checking Content table structure...\n');
checkContentFields();
