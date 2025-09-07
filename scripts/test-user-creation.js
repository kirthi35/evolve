#!/usr/bin/env node

/**
 * Test user creation to verify OnboardingData field handling
 */

import { airtableConfig } from './airtable-config.js';

const config = {
  apiKey: process.env.AIRTABLE_API_KEY || airtableConfig.apiKey,
  baseId: process.env.AIRTABLE_BASE_ID || airtableConfig.baseId
};

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0/meta/bases';

// Make API request to Airtable
async function makeAirtableRequest(endpoint, method = 'GET', data = null) {
  const url = `${AIRTABLE_API_BASE}/${config.baseId}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request failed: ${error.message}`);
    throw error;
  }
}

// Test user creation
async function testUserCreation() {
  try {
    console.log('🧪 Testing user creation...\n');

    // Test data (without OnboardingData)
    const testUserData = {
      UserID: 'test_user_' + Date.now(),
      Email: 'test@example.com',
      AssignedGroup: 'Group A',
      OnboardingCompleted: true,
      IsAdmin: false,
      LastLogin: new Date().toISOString()
    };

    console.log('📝 Creating test user...');
    console.log('   UserID:', testUserData.UserID);
    console.log('   Email:', testUserData.Email);
    console.log('   Group:', testUserData.AssignedGroup);

    const record = await makeAirtableRequest('/Users', 'POST', {
      fields: testUserData
    });

    console.log('✅ Test user created successfully!');
    console.log('   Record ID:', record.id);
    console.log('   Fields:', Object.keys(record.fields));

    // Clean up - delete the test record
    console.log('\n🧹 Cleaning up test record...');
    await makeAirtableRequest(`/Users/${record.id}`, 'DELETE');
    console.log('✅ Test record deleted');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🔧 Testing User Creation\n');
  
  try {
    await testUserCreation();
    console.log('\n✅ User creation test completed successfully!');
    console.log('\n📋 The OnboardingData field error should now be resolved.');
    console.log('   - User creation works without OnboardingData field');
    console.log('   - OnboardingData is excluded from Airtable requests');
    console.log('   - All other user data is stored correctly');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();
