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

// Simulate the fetchUserByFirebaseUID function
async function debugUserLookup(uid) {
  try {
    console.log(`🔍 Debugging user lookup for UID: ${uid}\n`);
    
    // First, get ALL records for this UID (not just maxRecords: 1)
    console.log('📊 Finding ALL records for this UID:');
    const allRecords = await base('Users')
      .select({
        filterByFormula: `{UserID} = "${uid}"`
      })
      .all();
    
    console.log(`Found ${allRecords.length} record(s):\n`);
    
    allRecords.forEach((record, index) => {
      console.log(`${index + 1}. Record ID: ${record.id}`);
      console.log(`   Email: ${record.fields.Email}`);
      console.log(`   Assigned Group: ${record.fields.AssignedGroup}`);
      console.log(`   Onboarding Completed: ${record.fields.OnboardingCompleted}`);
      console.log(`   Created: ${record.createdTime}`);
      console.log('');
    });
    
    // Now simulate what fetchUserByFirebaseUID actually returns
    console.log('🎯 What fetchUserByFirebaseUID returns (maxRecords: 1):');
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = "${uid}"`,
        maxRecords: 1
      })
      .firstPage();
    
    if (records.length > 0) {
      const record = records[0];
      console.log(`✅ Returns: ${record.id}`);
      console.log(`   Email: ${record.fields.Email}`);
      console.log(`   Assigned Group: ${record.fields.AssignedGroup}`);
      console.log(`   This is why the user sees ${record.fields.AssignedGroup} Dashboard!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Debug the GroupB user (imkirthi+gb@gmail.com)
const groupBUserUID = 'Q5mu7MiA00MzmmzJbZIhXV8VXNQ2'; // From the previous output

console.log('🚀 Debugging GroupB User Lookup...\n');
debugUserLookup(groupBUserUID);
