#!/usr/bin/env node

/**
 * Airtable REST API Schema Updater
 * Uses Airtable REST API directly instead of the JavaScript library
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

// Table definitions
const tableDefinitions = [
  {
    name: 'Users',
    description: 'User management and authentication data',
    fields: [
      { name: 'UserID', type: 'singleLineText' },
      { name: 'Email', type: 'email' },
      { name: 'AssignedGroup', type: 'singleSelect', options: ['Group A', 'Group B'] },
      { name: 'OnboardingCompleted', type: 'checkbox' },
      { name: 'IsAdmin', type: 'checkbox' },
      { name: 'CreatedAt', type: 'dateTime' },
      { name: 'OnboardingData', type: 'longText' }
    ]
  },
  {
    name: 'Content',
    description: 'Educational content and videos for study groups',
    fields: [
      { name: 'Title', type: 'singleLineText' },
      { name: 'YouTubeVideoID', type: 'singleLineText' },
      { name: 'Group', type: 'singleSelect', options: ['Group A', 'Group B'] },
      { name: 'Order', type: 'number' }
    ]
  },
  {
    name: 'Questions',
    description: 'Assessment questions for content evaluation',
    fields: [
      { name: 'QuestionText', type: 'longText' },
      { name: 'Options', type: 'longText' },
      { name: 'Type', type: 'singleSelect', options: ['single', 'multiple'] },
      { name: 'OnboardingQuestion', type: 'checkbox' }
    ]
  },
  {
    name: 'UserResponses',
    description: 'User responses to assessment questions',
    fields: [
      { name: 'UserID', type: 'singleLineText' },
      { name: 'QuestionID', type: 'singleLineText' },
      { name: 'Answer', type: 'longText' },
      { name: 'VideoID', type: 'singleLineText' },
      { name: 'SubmittedAt', type: 'dateTime' }
    ]
  },
  {
    name: 'UserProgress',
    description: 'User progress tracking through study content',
    fields: [
      { name: 'UserID', type: 'singleLineText' },
      { name: 'VideoID', type: 'singleLineText' },
      { name: 'WatchProgress', type: 'number' },
      { name: 'Completed', type: 'checkbox' },
      { name: 'CompletedAt', type: 'dateTime' },
      { name: 'DayNumber', type: 'number' }
    ]
  },
  {
    name: 'AnswerOptions',
    description: 'Answer options for multiple choice questions',
    fields: [
      { name: 'OptionText', type: 'singleLineText' },
      { name: 'IsCorrect', type: 'checkbox' },
      { name: 'QuestionID', type: 'singleLineText' }
    ]
  }
];

// Field type mapping for Airtable API
const fieldTypeMapping = {
  'singleLineText': 'singleLineText',
  'longText': 'longText',
  'email': 'email',
  'number': 'number',
  'checkbox': 'checkbox',
  'dateTime': 'dateTime',
  'singleSelect': 'singleSelect'
};

// Get field configuration for Airtable API
function getFieldConfig(field) {
  const fieldConfig = {
    name: field.name,
    type: fieldTypeMapping[field.type] || 'singleLineText'
  };

  // Add specific options for different field types
  if (field.type === 'singleSelect' && field.options) {
    fieldConfig.options = {
      choices: field.options.map(option => ({ name: option }))
    };
  }

  if (field.type === 'checkbox') {
    fieldConfig.options = {
      icon: 'check',
      color: 'greenBright'
    };
  }

  if (field.type === 'number') {
    fieldConfig.options = {
      precision: 0
    };
  }

  return fieldConfig;
}

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

// Get existing tables
async function getExistingTables() {
  try {
    console.log('🔍 Fetching existing tables...');
    const response = await makeAirtableRequest('/tables');
    console.log(`   Found ${response.tables.length} tables`);
    return response.tables;
  } catch (error) {
    console.error('❌ Error fetching existing tables:', error.message);
    return [];
  }
}

// Create a new table
async function createTable(tableDef) {
  try {
    console.log(`📝 Creating table: ${tableDef.name}`);
    
    const fields = tableDef.fields.map(field => getFieldConfig(field));

    const tableData = {
      name: tableDef.name,
      description: tableDef.description,
      fields: fields
    };

    const table = await makeAirtableRequest('/tables', 'POST', tableData);
    console.log(`✅ Created table: ${tableDef.name} (ID: ${table.id})`);
    return table;
  } catch (error) {
    console.error(`❌ Error creating table ${tableDef.name}:`, error.message);
    return null;
  }
}

// Main function
async function updateAirtableSchema() {
  console.log('🚀 Starting Airtable schema update using REST API...\n');

  // Validate configuration
  if (config.apiKey === 'your_api_key_here' || config.baseId === 'your_base_id_here') {
    throw new Error('Please set your Airtable credentials in airtable-config.js or environment variables');
  }

  if (!config.apiKey.startsWith('pat')) {
    throw new Error('API key should start with "pat". Please check your Airtable API key format.');
  }

  if (!config.baseId.startsWith('app')) {
    throw new Error('Base ID should start with "app". Please check your Airtable Base ID format.');
  }

  try {
    // Get existing tables
    const existingTables = await getExistingTables();
    const existingTableNames = existingTables.map(table => table.name);

    console.log(`📋 Found ${existingTables.length} existing tables: ${existingTableNames.join(', ')}\n`);

    // Process each table definition
    for (const tableDef of tableDefinitions) {
      console.log(`\n📊 Processing table: ${tableDef.name}`);
      
      if (existingTableNames.includes(tableDef.name)) {
        console.log(`  ⏭️  Table already exists: ${tableDef.name}`);
      } else {
        console.log(`  ➕ Creating new table: ${tableDef.name}`);
        await createTable(tableDef);
      }
    }

    console.log('\n✅ Airtable schema update completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  - Processed ${tableDefinitions.length} table definitions`);
    console.log(`  - Existing tables: ${existingTableNames.length}`);
    console.log(`  - New tables created: ${tableDefinitions.length - existingTableNames.length}`);

  } catch (error) {
    console.error('\n❌ Error updating Airtable schema:', error.message);
    process.exit(1);
  }
}

// Run the script
async function main() {
  console.log('🔧 Airtable REST API Schema Updater for Evolve Clinical Study Platform\n');
  
  try {
    await updateAirtableSchema();
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  }
}

main();
