#!/usr/bin/env node

/**
 * Add OnboardingData field to Users table in Airtable
 * This script adds the missing OnboardingData field that stores JSON questionnaire responses
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { airtableConfig } from './airtable-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
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

// Get table information
async function getTableInfo(tableName) {
  try {
    console.log(`🔍 Getting table information for: ${tableName}`);
    const response = await makeAirtableRequest('/tables');
    const table = response.tables.find(t => t.name === tableName);
    
    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }
    
    console.log(`✅ Found table: ${table.name} (ID: ${table.id})`);
    console.log(`   Fields: ${table.fields.length}`);
    
    return table;
  } catch (error) {
    console.error(`❌ Error getting table info:`, error.message);
    throw error;
  }
}

// Add OnboardingData field to Users table
async function addOnboardingDataField() {
  try {
    console.log('🚀 Adding OnboardingData field to Users table...\n');

    // Get Users table info
    const usersTable = await getTableInfo('Users');
    
    // Check if OnboardingData field already exists
    const existingField = usersTable.fields.find(field => field.name === 'OnboardingData');
    if (existingField) {
      console.log('✅ OnboardingData field already exists!');
      console.log(`   Field ID: ${existingField.id}`);
      console.log(`   Field Type: ${existingField.type}`);
      return;
    }

    // Add the OnboardingData field
    console.log('📝 Adding OnboardingData field...');
    const fieldData = {
      name: 'OnboardingData',
      type: 'longText'
    };

    const newField = await makeAirtableRequest(`/tables/${usersTable.id}/fields`, 'POST', fieldData);
    
    console.log('✅ Successfully added OnboardingData field!');
    console.log(`   Field ID: ${newField.id}`);
    console.log(`   Field Type: ${newField.type}`);
    console.log(`   Field Name: ${newField.name}`);

  } catch (error) {
    console.error('❌ Error adding OnboardingData field:', error.message);
    throw error;
  }
}

// Main function
async function main() {
  console.log('🔧 Adding OnboardingData Field to Users Table\n');
  
  // Validate configuration
  if (config.apiKey === 'your_api_key_here' || config.baseId === 'your_base_id_here') {
    console.error('❌ Please set your Airtable credentials in airtable-config.js');
    process.exit(1);
  }

  if (!config.apiKey.startsWith('pat')) {
    console.error('❌ API key should start with "pat". Please check your Airtable API key format.');
    process.exit(1);
  }

  if (!config.baseId.startsWith('app')) {
    console.error('❌ Base ID should start with "app". Please check your Airtable Base ID format.');
    process.exit(1);
  }

  try {
    await addOnboardingDataField();
    console.log('\n✅ OnboardingData field addition completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Test user signup to ensure the field works');
    console.log('  2. Check your Airtable base to see the new field');
    console.log('  3. Verify that onboarding data is being stored correctly');
  } catch (error) {
    console.error('\n❌ Script execution failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
