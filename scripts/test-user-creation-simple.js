#!/usr/bin/env node

/**
 * Simple test to verify user creation works without LastLogin field
 */

import { airtableConfig } from './airtable-config.js';

const config = {
  apiKey: process.env.AIRTABLE_API_KEY || airtableConfig.apiKey,
  baseId: process.env.AIRTABLE_BASE_ID || airtableConfig.baseId
};

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

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
    console.log('🧪 Testing user creation (without LastLogin field)...\n');

    // Test data (minimal required fields)
    const testUserData = {
      fields: {
        UserID: 'test_user_' + Date.now(),
        Email: 'test@example.com',
        AssignedGroup: 'Group A',
        OnboardingCompleted: true,
        IsAdmin: false
      }
    };

    console.log('📝 Creating test user...');
    console.log('   UserID:', testUserData.fields.UserID);
    console.log('   Email:', testUserData.fields.Email);
    console.log('   Group:', testUserData.fields.AssignedGroup);

    const record = await makeAirtableRequest('/Users', 'POST', testUserData);

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
  console.log('🔧 Testing User Creation (Fixed Version)\n');
  
  try {
    await testUserCreation();
    console.log('\n✅ User creation test completed successfully!');
    console.log('\n📋 The LastLogin field error should now be resolved.');
    console.log('   - User creation works without LastLogin field');
    console.log('   - Only required fields are sent to Airtable');
    console.log('   - OnboardingData is excluded to avoid field errors');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();
