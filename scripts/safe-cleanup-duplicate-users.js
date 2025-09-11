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

async function safeCleanupDuplicates() {
  try {
    console.log('🔍 Safe cleanup of duplicate users...\n');
    
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
    
    console.log('📊 Analysis Results:\n');
    
    Object.entries(usersByUID).forEach(([uid, users]) => {
      if (users.length > 1) {
        console.log(`🔴 DUPLICATE: ${users[0].fields.Email} (${users.length} records)`);
        
        // Sort by creation time (newest first) and onboarding completion
        users.sort((a, b) => {
          // Prioritize completed onboarding
          if (a.fields.OnboardingCompleted && !b.fields.OnboardingCompleted) return -1;
          if (!a.fields.OnboardingCompleted && b.fields.OnboardingCompleted) return 1;
          // Then by creation time (newest first)
          return new Date(b.createdTime) - new Date(a.createdTime);
        });
        
        const keepRecord = users[0];
        const deleteRecords = users.slice(1);
        
        console.log(`   ✅ KEEP: ${keepRecord.id} (${keepRecord.fields.AssignedGroup}, Onboarding: ${keepRecord.fields.OnboardingCompleted ? 'Yes' : 'No'}, Created: ${keepRecord.createdTime})`);
        
        deleteRecords.forEach(record => {
          console.log(`   ❌ DELETE: ${record.id} (${record.fields.AssignedGroup}, Onboarding: ${record.fields.OnboardingCompleted ? 'Yes' : 'No'}, Created: ${record.createdTime})`);
        });
        
        console.log('');
      } else {
        console.log(`✅ OK: ${users[0].fields.Email} (${users[0].fields.AssignedGroup})`);
      }
    });
    
    console.log('\n📝 Recommended Actions:');
    console.log('1. Review the analysis above');
    console.log('2. If you want to proceed with cleanup, create a script to delete the marked records');
    console.log('3. The new upsertUser function will prevent future duplicates');
    console.log('\n⚠️  This script only shows analysis - no records were deleted');
    
  } catch (error) {
    console.error('❌ Error analyzing duplicates:', error.message);
  }
}

console.log('🚀 Starting Safe Duplicate Analysis...\n');
safeCleanupDuplicates();
