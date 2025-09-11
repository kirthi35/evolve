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

async function fixGroupBReleaseDays() {
  try {
    console.log('🔧 Fixing Group B Release Days and Order values...\n');
    
    // Get all Group B content
    const allContent = await base('Content').select({
      filterByFormula: '{TargetGroup} = "Group B"',
      sort: [{ field: 'Title', direction: 'asc' }]
    }).all();
    
    console.log(`Found ${allContent.length} Group B videos to update:\n`);
    
    const updates = [];
    
    allContent.forEach((record, index) => {
      const title = record.fields.Title;
      let releaseDay = null;
      let order = null;
      
      // Extract day number from title
      if (title.includes('Day 1')) {
        releaseDay = 1;
        order = 1;
      } else if (title.includes('Day 2')) {
        releaseDay = 2;
        order = 2;
      } else if (title.includes('Day 3')) {
        releaseDay = 3;
        order = 3;
      }
      
      if (releaseDay && order) {
        console.log(`📝 Will update "${title}": ReleaseDay=${releaseDay}, Order=${order}`);
        updates.push({
          id: record.id,
          fields: {
            ReleaseDay: releaseDay,
            Order: order
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
        console.log(`✅ Updated "${record.fields.Title}": ReleaseDay=${record.fields.ReleaseDay}, Order=${record.fields.Order}`);
      });
    }
    
    console.log('\n🎉 All Group B videos updated successfully!');
    console.log('\n🔄 Now refresh your GroupB Dashboard to see Day 1 video.');
    
  } catch (error) {
    console.error('❌ Error updating Group B content:', error);
    console.log('\n💡 Make sure you have write permissions to the Airtable base.');
  }
}

console.log('🚀 Starting Group B Release Day Fix...\n');
fixGroupBReleaseDays();
