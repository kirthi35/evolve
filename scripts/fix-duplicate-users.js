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

async function fixDuplicateUsers() {
  try {
    console.log('🔍 Finding and fixing duplicate users...\n');
    
    // Get all users
    const allUsers = await base('Users').select().all();
    
    // Group users by Firebase UID
    const usersByUID = {};
    allUsers.forEach(user => {
      const uid = user.fields.UserID;
      if (uid) {
        if (!usersByUID[uid]) {
          usersByUID[uid] = [];
        }
        usersByUID[uid].push(user);
      }
    });
    
    console.log('📊 User Analysis:');
    let duplicatesFound = 0;
    const recordsToDelete = [];
    
    Object.entries(usersByUID).forEach(([uid, users]) => {
      if (users.length > 1) {
        duplicatesFound++;
        console.log(`\n🔴 Duplicate found for UID: ${uid}`);
        console.log(`   Email: ${users[0].fields.Email}`);
        console.log(`   ${users.length} records found:`);
        
        // Sort by creation time (keep the most recent)
        users.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
        
        users.forEach((user, index) => {
          const isKeep = index === 0;
          console.log(`   ${index + 1}. ${user.id} (${user.fields.AssignedGroup}) - Created: ${user.createdTime} ${isKeep ? '✅ KEEP' : '❌ DELETE'}`);
          
          if (!isKeep) {
            recordsToDelete.push(user.id);
          }
        });
      } else {
        console.log(`✅ ${users[0].fields.Email}: Single record (${users[0].fields.AssignedGroup})`);
      }
    });
    
    if (duplicatesFound === 0) {
      console.log('\n🎉 No duplicates found!');
      return;
    }
    
    console.log(`\n⚠️  Found ${duplicatesFound} duplicate(s)`);
    console.log(`📝 Will delete ${recordsToDelete.length} duplicate record(s)`);
    
    // Ask for confirmation (simulate with a delay)
    console.log('\n🚨 This will permanently delete duplicate records!');
    console.log('⏳ Proceeding in 3 seconds... (Cancel with Ctrl+C if needed)');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Delete duplicate records in batches
    if (recordsToDelete.length > 0) {
      console.log('\n🗑️  Deleting duplicate records...');
      
      const batchSize = 10;
      for (let i = 0; i < recordsToDelete.length; i += batchSize) {
        const batch = recordsToDelete.slice(i, i + batchSize);
        await base('Users').destroy(batch);
        console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`);
      }
      
      console.log(`\n🎉 Successfully deleted ${recordsToDelete.length} duplicate records!`);
      console.log('🔄 Users should now see the correct dashboard based on their group assignment.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing duplicate users:', error.message);
    console.log('\n💡 Make sure you have delete permissions for the Users table.');
  }
}

console.log('🚀 Starting Duplicate User Fix...\n');
fixDuplicateUsers();
