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

async function checkUserGroups() {
  try {
    console.log('🔍 Checking user group assignments...\n');
    
    // Get all users
    const allUsers = await base('Users').select().all();
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in Users table');
      return;
    }
    
    console.log(`📊 Found ${allUsers.length} users:\n`);
    
    allUsers.forEach((user, index) => {
      const fields = user.fields;
      console.log(`${index + 1}. ${fields.Email || 'No email'} (ID: ${user.id})`);
      console.log(`   Assigned Group: "${fields.AssignedGroup || 'Not set'}"`);
      console.log(`   Onboarding Completed: ${fields.OnboardingCompleted ? 'Yes' : 'No'}`);
      console.log(`   Is Admin: ${fields.IsAdmin ? 'Yes' : 'No'}`);
      console.log(`   User ID (Firebase): ${fields.UserID || 'Not set'}`);
      console.log('');
    });
    
    // Group statistics
    const groupStats = {};
    allUsers.forEach(user => {
      const group = user.fields.AssignedGroup || 'Unassigned';
      groupStats[group] = (groupStats[group] || 0) + 1;
    });
    
    console.log('📈 Group Assignment Summary:');
    Object.entries(groupStats).forEach(([group, count]) => {
      console.log(`   ${group}: ${count} user(s)`);
    });
    
    // Check for users without group assignments
    const unassignedUsers = allUsers.filter(user => !user.fields.AssignedGroup);
    if (unassignedUsers.length > 0) {
      console.log(`\n⚠️  ${unassignedUsers.length} user(s) without group assignments:`);
      unassignedUsers.forEach(user => {
        console.log(`   - ${user.fields.Email || user.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking user groups:', error.message);
  }
}

console.log('🚀 Starting User Group Check...\n');
checkUserGroups();
