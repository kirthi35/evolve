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

async function checkGroupBContent() {
  try {
    console.log('🔍 Checking Group B content in Airtable...\n');
    
    // First, let's see all content records
    console.log('📊 All Content Records:');
    const allContent = await base('Content').select().all();
    
    if (allContent.length === 0) {
      console.log('❌ No content found in Content table!');
      return;
    }
    
    console.log(`Total content records: ${allContent.length}\n`);
    
    allContent.forEach((record, index) => {
      const fields = record.fields;
      console.log(`${index + 1}. "${fields.Title || 'Untitled'}" (ID: ${record.id})`);
      console.log(`   Target Group: "${fields.TargetGroup || 'Not set'}"`);
      console.log(`   Release Day: ${fields.ReleaseDay || 'Not set'}`);
      console.log(`   Order: ${fields.Order || 'Not set'}`);
      console.log(`   YouTube URL: ${fields.YouTubeURL ? 'Set' : 'Not set'}`);
      console.log('');
    });
    
    // Now filter for Group B specifically
    console.log('🎯 Group B Content:');
    const groupBContent = allContent.filter(record => record.fields.TargetGroup === 'Group B');
    
    if (groupBContent.length === 0) {
      console.log('❌ No Group B content found!');
      console.log('\n💡 Available Target Groups:');
      const targetGroups = [...new Set(allContent.map(r => r.fields.TargetGroup).filter(Boolean))];
      targetGroups.forEach(group => console.log(`   - "${group}"`));
      return;
    }
    
    console.log(`Found ${groupBContent.length} Group B video(s):\n`);
    
    groupBContent.forEach((record, index) => {
      const fields = record.fields;
      console.log(`${index + 1}. "${fields.Title || 'Untitled'}"`);
      console.log(`   ID: ${record.id}`);
      console.log(`   Release Day: ${fields.ReleaseDay || 'Not set'}`);
      console.log(`   Order: ${fields.Order || 'Not set'}`);
      console.log(`   YouTube URL: ${fields.YouTubeURL || 'Not set'}`);
      console.log('');
    });
    
    // Check for Day 1 specifically
    const day1Videos = groupBContent.filter(record => record.fields.ReleaseDay === 1);
    console.log(`🎯 Day 1 Videos for Group B: ${day1Videos.length}`);
    
    if (day1Videos.length === 0) {
      console.log('❌ No Day 1 video found for Group B!');
      const releaseDays = groupBContent
        .map(r => r.fields.ReleaseDay)
        .filter(day => day !== undefined && day !== null)
        .sort((a, b) => a - b);
      console.log(`📅 Available Release Days for Group B: [${releaseDays.join(', ')}]`);
    } else {
      day1Videos.forEach(video => {
        console.log(`✅ Found: "${video.fields.Title}" (ID: ${video.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure your .env file has:');
    console.log('   AIRTABLE_API_KEY=your_api_key');
    console.log('   AIRTABLE_BASE_ID=your_base_id');
  }
}

console.log('🚀 Starting Group B Content Check...\n');
checkGroupBContent();
