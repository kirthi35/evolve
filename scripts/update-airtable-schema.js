#!/usr/bin/env node

/**
 * Airtable Schema Updater for Evolve Clinical Study Platform
 * 
 * This script updates the Airtable base schema to match the current codebase.
 * It creates missing tables and fields based on the TypeScript interfaces.
 */

import Airtable from 'airtable';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - Update these with your Airtable credentials
const config = {
  apiKey: process.env.AIRTABLE_API_KEY || 'your_api_key_here',
  baseId: process.env.AIRTABLE_BASE_ID || 'your_base_id_here'
};

// Initialize Airtable
const airtable = new Airtable({ apiKey: config.apiKey });
const base = airtable.base(config.baseId);

// Table definitions based on the current codebase
const tableDefinitions = [
  {
    name: 'Users',
    description: 'User management and authentication data',
    fields: [
      { name: 'UserID', type: 'singleLineText', description: 'Firebase UID' },
      { name: 'Email', type: 'email', description: 'User email address' },
      { name: 'AssignedGroup', type: 'singleSelect', options: ['Group A', 'Group B'], description: 'Study group assignment' },
      { name: 'OnboardingCompleted', type: 'checkbox', description: 'Onboarding completion status' },
      { name: 'IsAdmin', type: 'checkbox', description: 'Admin user flag' },
      { name: 'CreatedAt', type: 'dateTime', description: 'Record creation timestamp' },
      { name: 'OnboardingData', type: 'longText', description: 'JSON data from onboarding questionnaire' }
    ]
  },
  {
    name: 'Content',
    description: 'Educational content and videos for study groups',
    fields: [
      { name: 'Title', type: 'singleLineText', description: 'Content title' },
      { name: 'YouTubeVideoID', type: 'singleLineText', description: 'YouTube video identifier' },
      { name: 'Group', type: 'singleSelect', options: ['Group A', 'Group B'], description: 'Target study group' },
      { name: 'Order', type: 'number', description: 'Content display order' },
      { name: 'Questions', type: 'multipleRecordLinks', linkedTableId: 'Questions', description: 'Array of question record IDs' }
    ]
  },
  {
    name: 'Questions',
    description: 'Assessment questions for content evaluation',
    fields: [
      { name: 'QuestionText', type: 'longText', description: 'Question content' },
      { name: 'Options', type: 'longText', description: 'JSON string of answer options' },
      { name: 'Type', type: 'singleSelect', options: ['single', 'multiple'], description: 'Question type' },
      { name: 'Video', type: 'multipleRecordLinks', linkedTableId: 'Content', description: 'Array of content record IDs' },
      { name: 'OnboardingQuestion', type: 'checkbox', description: 'Flag for onboarding questions' }
    ]
  },
  {
    name: 'UserResponses',
    description: 'User responses to assessment questions',
    fields: [
      { name: 'UserID', type: 'singleLineText', description: 'Firebase UID' },
      { name: 'QuestionID', type: 'singleLineText', description: 'Question record ID' },
      { name: 'Answer', type: 'longText', description: 'User\'s answer' },
      { name: 'VideoID', type: 'singleLineText', description: 'Associated video ID' },
      { name: 'SubmittedAt', type: 'dateTime', description: 'Response submission timestamp' }
    ]
  },
  {
    name: 'UserProgress',
    description: 'User progress tracking through study content',
    fields: [
      { name: 'UserID', type: 'singleLineText', description: 'Firebase UID' },
      { name: 'VideoID', type: 'singleLineText', description: 'Video content ID' },
      { name: 'WatchProgress', type: 'number', description: 'Watch progress percentage (0-100)' },
      { name: 'Completed', type: 'checkbox', description: 'Completion status' },
      { name: 'CompletedAt', type: 'dateTime', description: 'Completion timestamp' },
      { name: 'DayNumber', type: 'number', description: 'Day number for Group B progression' }
    ]
  },
  {
    name: 'AnswerOptions',
    description: 'Answer options for multiple choice questions',
    fields: [
      { name: 'OptionText', type: 'singleLineText', description: 'Answer option text' },
      { name: 'IsCorrect', type: 'checkbox', description: 'Correct answer flag' },
      { name: 'QuestionID', type: 'singleLineText', description: 'Associated question ID' }
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
  'singleSelect': 'singleSelect',
  'multipleRecordLinks': 'multipleRecordLinks'
};

// Get all existing tables
async function getExistingTables() {
  try {
    const tables = await base.tables.list();
    return tables;
  } catch (error) {
    console.error('❌ Error fetching existing tables:', error.message);
    return [];
  }
}

// Create a new table
async function createTable(tableDef) {
  try {
    console.log(`📝 Creating table: ${tableDef.name}`);
    
    const fields = tableDef.fields.map(field => {
      const fieldConfig = {
        name: field.name,
        type: fieldTypeMapping[field.type] || 'singleLineText'
      };

      // Add options for singleSelect fields
      if (field.type === 'singleSelect' && field.options) {
        fieldConfig.options = {
          choices: field.options.map(option => ({ name: option }))
        };
      }

      // Add linked table for multipleRecordLinks
      if (field.type === 'multipleRecordLinks' && field.linkedTableId) {
        fieldConfig.options = {
          linkedTableId: field.linkedTableId
        };
      }

      return fieldConfig;
    });

    const table = await base.tables.create({
      name: tableDef.name,
      description: tableDef.description,
      fields: fields
    });

    console.log(`✅ Created table: ${tableDef.name} (ID: ${table.id})`);
    return table;
  } catch (error) {
    console.error(`❌ Error creating table ${tableDef.name}:`, error.message);
    return null;
  }
}

// Update table fields
async function updateTableFields(tableId, tableDef) {
  try {
    console.log(`🔄 Updating fields for table: ${tableDef.name}`);
    
    const table = base.table(tableId);
    const existingFields = await table.fields.list();
    const existingFieldNames = existingFields.map(field => field.name);

    for (const fieldDef of tableDef.fields) {
      if (!existingFieldNames.includes(fieldDef.name)) {
        console.log(`  ➕ Adding field: ${fieldDef.name}`);
        
        const fieldConfig = {
          name: fieldDef.name,
          type: fieldTypeMapping[fieldDef.type] || 'singleLineText'
        };

        // Add options for singleSelect fields
        if (fieldDef.type === 'singleSelect' && fieldDef.options) {
          fieldConfig.options = {
            choices: fieldDef.options.map(option => ({ name: option }))
          };
        }

        // Add linked table for multipleRecordLinks
        if (fieldDef.type === 'multipleRecordLinks' && fieldDef.linkedTableId) {
          fieldConfig.options = {
            linkedTableId: fieldDef.linkedTableId
          };
        }

        await table.fields.create(fieldConfig);
        console.log(`  ✅ Added field: ${fieldDef.name}`);
      } else {
        console.log(`  ⏭️  Field already exists: ${fieldDef.name}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error updating fields for table ${tableDef.name}:`, error.message);
  }
}

// Main function to update schema
async function updateAirtableSchema() {
  console.log('🚀 Starting Airtable schema update...\n');

  try {
    // Get existing tables
    const existingTables = await getExistingTables();
    const existingTableNames = existingTables.map(table => table.name);

    console.log(`📋 Found ${existingTables.length} existing tables: ${existingTableNames.join(', ')}\n`);

    // Process each table definition
    for (const tableDef of tableDefinitions) {
      console.log(`\n📊 Processing table: ${tableDef.name}`);
      
      if (existingTableNames.includes(tableDef.name)) {
        console.log(`  🔄 Table exists, updating fields...`);
        const table = existingTables.find(t => t.name === tableDef.name);
        await updateTableFields(table.id, tableDef);
      } else {
        console.log(`  ➕ Table doesn't exist, creating new table...`);
        await createTable(tableDef);
      }
    }

    console.log('\n✅ Airtable schema update completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`  - Processed ${tableDefinitions.length} table definitions`);
    console.log(`  - Updated existing tables: ${existingTableNames.length}`);
    console.log(`  - Created new tables: ${tableDefinitions.length - existingTableNames.length}`);

  } catch (error) {
    console.error('\n❌ Error updating Airtable schema:', error.message);
    process.exit(1);
  }
}

// Generate schema documentation
function generateSchemaDocumentation() {
  const documentation = `# Airtable Schema Documentation

## Overview
This document describes the Airtable schema for the Evolve Clinical Study Platform.

## Tables

${tableDefinitions.map(table => `
### ${table.name}
**Description:** ${table.description}

**Fields:**
${table.fields.map(field => `- \`${field.name}\` (${field.type}): ${field.description}`).join('\n')}
`).join('\n')}

## Field Types

- **singleLineText**: Short text fields
- **longText**: Long text fields for descriptions and JSON data
- **email**: Email address fields
- **number**: Numeric fields
- **checkbox**: Boolean fields
- **dateTime**: Date and time fields
- **singleSelect**: Dropdown selection fields
- **multipleRecordLinks**: Links to other tables

## Usage

1. **Run the schema updater:**
   \`\`\`bash
   node scripts/update-airtable-schema.js
   \`\`\`

2. **Set environment variables:**
   \`\`\`bash
   export AIRTABLE_API_KEY="your_api_key"
   export AIRTABLE_BASE_ID="your_base_id"
   \`\`\`

3. **Verify the schema:**
   - Check your Airtable base for the new tables and fields
   - Ensure all field types are correct
   - Test data entry and validation

## Notes

- The script will create missing tables and add missing fields
- Existing data will not be affected
- Field types cannot be changed after creation
- Linked tables must exist before creating references
`;

  const outputDir = path.join(__dirname, '..', 'airtable-schema');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'schema-documentation.md'),
    documentation
  );

  console.log(`📄 Schema documentation saved to: ${path.join(outputDir, 'schema-documentation.md')}`);
}

// Run the script
async function main() {
  console.log('🔧 Airtable Schema Updater for Evolve Clinical Study Platform\n');
  
  // Check if API key and base ID are provided
  if (config.apiKey === 'your_api_key_here' || config.baseId === 'your_base_id_here') {
    console.log('❌ Please set your Airtable credentials:');
    console.log('   export AIRTABLE_API_KEY="your_api_key"');
    console.log('   export AIRTABLE_BASE_ID="your_base_id"');
    console.log('\n   Or update the config object in the script.');
    process.exit(1);
  }

  try {
    await updateAirtableSchema();
    generateSchemaDocumentation();
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
