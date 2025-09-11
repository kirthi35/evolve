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

async function fixGroupBOrderValues() {
  try {
    console.log('🔧 Fixing Group B Order values...\n');
    
    // Get all Group B content sorted by title
    const allContent = await base('Content').select({
      filterByFormula: '{TargetGroup} = "Group B"',
      sort: [{ field: 'Title', direction: 'asc' }]
    }).all();
    
    console.log(`Found ${allContent.length} Group B videos to update:\n`);
    
    const updates = [];
    
    allContent.forEach((record, index) => {
      const title = record.fields.Title;
      const currentOrder = record.fields.Order;
      let newOrder = null;
      
      // Extract day number from title
      if (title.includes('Day 1')) {
        newOrder = 1;
      } else if (title.includes('Day 2')) {
        newOrder = 2;
      } else if (title.includes('Day 3')) {
        newOrder = 3;
      }
      
      if (newOrder !== null) {
        console.log(`📝 "${title}": Order ${currentOrder} → ${newOrder}`);
        updates.push({
          id: record.id,
          fields: {
            Order: newOrder
          }
        });
      } else {
        console.log(`⚠️  Skipping "${title}": Could not determine day number`);
      }
    });
    
    if (updates.length === 0) {
      console.log('❌ No updates to perform. Check the titles contain "Day 1", "Day 2", etc.');
      return;
    }
    
    console.log(`\n🚀 Updating ${updates.length} records...`);
    
    // Update records in batches of 10 (Airtable limit)
    const batchSize = 10;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      const updatedRecords = await base('Content').update(batch);
      
      updatedRecords.forEach(record => {
        console.log(`✅ Updated "${record.fields.Title}": Order = ${record.fields.Order}`);
      });
    }
    
    console.log('\n🎉 All Group B Order values updated successfully!');
    console.log('\n🔄 Now refresh your GroupB Dashboard to see Day 1 video.');
    
  } catch (error) {
    console.error('❌ Error updating Group B content:', error.message);
    if (error.message.includes('UNKNOWN_FIELD_NAME')) {
      console.log('💡 The Order field might have a different name in your Airtable base.');
    }
  }
}

console.log('🚀 Starting Group B Order Values Fix...\n');
fixGroupBOrderValues();
