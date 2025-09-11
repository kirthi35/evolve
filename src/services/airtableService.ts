import Airtable from 'airtable';
import type {
  User,
  ContentItem,
  Question,
  AnswerOption,
  UserProgress,
  CreateRecordResponse
} from '../types/airtable';

// Initialize Airtable with Personal Access Token
const base = new Airtable({
  apiKey: import.meta.env.VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN
}).base(import.meta.env.VITE_AIRTABLE_BASE_ID);

// Helper function to handle Airtable API responses
const handleAirtableResponse = <T>(records: readonly any[]): T[] => {
  return records.map(record => ({
    id: record.id,
    createdTime: record.createdTime,
    fields: record.fields
  })) as T[];
};

// User operations
export const fetchUserByFirebaseUID = async (uid: string): Promise<User | null> => {
  try {
    console.log('Fetching user by Firebase UID:', uid);
    
    // Get ALL records for this UID to handle duplicates properly
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = "${uid}"`
        // Note: Removed sort by 'Created' field as it doesn't exist
        // We'll handle record selection logic in JavaScript below
      })
      .all();
    
    console.log('Found records for UID:', records.length);
    
    if (records.length === 0) {
      console.log('No user found in Airtable for UID:', uid);
      return null;
    }
    
    // Sort records by creation time (most recent first)
    const sortedRecords = [...records].sort((a: any, b: any) => {
      const timeA = new Date(a.createdTime || 0).getTime();
      const timeB = new Date(b.createdTime || 0).getTime();
      return timeB - timeA; // Most recent first
    });
    
    // If multiple records, log them and choose the best one
    if (sortedRecords.length > 1) {
      console.warn(`⚠️  Found ${sortedRecords.length} duplicate records for UID ${uid}:`);
      sortedRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.id} - Group: ${record.fields.AssignedGroup} - Email: ${record.fields.Email} - Created: ${(record as any).createdTime}`);
      });
      
      // Prefer the most recent record with onboarding completed
      const completedRecords = sortedRecords.filter(r => r.fields.OnboardingCompleted);
      const selectedRecord = completedRecords.length > 0 ? completedRecords[0] : sortedRecords[0];
      
      console.log(`✅ Selected record: ${selectedRecord.id} (Group: ${selectedRecord.fields.AssignedGroup})`);
    }
    
    const record = sortedRecords.length > 1 ? 
      (sortedRecords.filter(r => r.fields.OnboardingCompleted)[0] || sortedRecords[0]) : 
      sortedRecords[0];
      
    console.log('User record found:', { id: record.id, email: record.fields.Email, group: record.fields.AssignedGroup });
    return {
      id: record.id,
      createdTime: (record as any).createdTime || new Date().toISOString(),
      fields: record.fields as User['fields']
    };
  } catch (error) {
    console.error('Error fetching user by Firebase UID:', error);
    throw error;
  }
};

export const createContent = async (contentData: {
  Title: string;
  TargetGroup: 'Group A' | 'Group B';
  YouTubeURL: string;
  Order: number;
}): Promise<CreateRecordResponse> => {
  try {
    const record = await base('Content').create(contentData);
    return {
      id: record.id,
      fields: record.fields,
      createdTime: (record as any).createdTime || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating content:', error);
    throw error;
  }
};

export const createQuestion = async (questionData: {
  QuestionText: string;
  LinkedVideo: string[];
  OptionA: string;
  OptionB: string;
  OptionC: string;
  OptionD: string;
}): Promise<CreateRecordResponse> => {
  try {
    const record = await base('Questions').create(questionData);
    return {
      id: record.id,
      fields: record.fields,
      createdTime: (record as any).createdTime || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

export const fetchContent = async (): Promise<ContentItem[]> => {
  try {
    const records = await base('Content').select({
      sort: [{ field: 'Order', direction: 'asc' }]
    }).all();
    
    return records.map(record => ({
      id: record.id,
      createdTime: (record as any).createdTime || new Date().toISOString(),
      fields: {
        Title: record.get('Title') as string,
        TargetGroup: record.get('TargetGroup') as 'Group A' | 'Group B',
        YouTubeURL: record.get('YouTubeURL') as string,
        Order: record.get('Order') as number,
        Questions: record.get('Questions') as string[] || [],
        UserProgress: record.get('UserProgress') as string[] || []
      }
    }));
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
};

export const fetchQuestions = async (): Promise<Question[]> => {
  try {
    const records = await base('Questions').select().all();
    
    return records.map(record => ({
      id: record.id,
      createdTime: (record as any).createdTime || new Date().toISOString(),
      fields: {
        QuestionText: record.get('QuestionText') as string,
        LinkedVideo: record.get('LinkedVideo') as string[] || [],
        OptionA: record.get('OptionA') as string,
        OptionB: record.get('OptionB') as string,
        OptionC: record.get('OptionC') as string,
        OptionD: record.get('OptionD') as string,
        UserResponses: record.get('UserResponses') as string[] || []
      }
    }));
  } catch (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }
};

export const createUser = async (userData: {
  UserID: string;
  Email: string;
  AssignedGroup: 'Group A' | 'Group B';
  OnboardingCompleted: boolean;
  IsAdmin: boolean;
  OnboardingData?: string;
}): Promise<CreateRecordResponse> => {
  try {
    // Create user record in Airtable with all data
    const record = await base('Users').create(userData);
    
    return {
      id: record.id,
      fields: record.fields,
      createdTime: (record as any).createdTime || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const upsertUser = async (userData: {
  UserID: string;
  Email: string;
  AssignedGroup: 'Group A' | 'Group B';
  OnboardingCompleted: boolean;
  IsAdmin: boolean;
  OnboardingData?: string;
}): Promise<CreateRecordResponse> => {
  try {
    console.log('Upserting user:', userData.UserID, userData.Email);
    
    // Check if user already exists
    const existingUser = await fetchUserByFirebaseUID(userData.UserID);
    
    if (existingUser) {
      console.log('User exists, checking onboarding status:', existingUser.fields.OnboardingCompleted);
      
      if (existingUser.fields.OnboardingCompleted) {
        console.log('User already completed onboarding, returning existing record');
        return {
          id: existingUser.id,
          fields: existingUser.fields as any,
          createdTime: existingUser.createdTime || new Date().toISOString()
        };
      } else {
        console.log('User exists but onboarding not complete, updating record');
        const updatedRecord = await base('Users').update(existingUser.id, {
          OnboardingCompleted: userData.OnboardingCompleted,
          OnboardingData: userData.OnboardingData,
          // Don't change AssignedGroup if it was already set
          ...(existingUser.fields.AssignedGroup ? {} : { AssignedGroup: userData.AssignedGroup })
        });
        
        return {
          id: updatedRecord.id,
          fields: updatedRecord.fields,
          createdTime: (updatedRecord as any).createdTime || existingUser.createdTime
        };
      }
    } else {
      console.log('User does not exist, creating new record');
      return await createUser(userData);
    }
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
};

// Content operations
export const fetchContentForGroup = async (group: 'Group A' | 'Group B'): Promise<ContentItem[]> => {
  try {
    const records = await base('Content')
      .select({
        filterByFormula: `{TargetGroup} = "${group}"`,
        sort: [{ field: 'Order', direction: 'asc' }]
      })
      .all();

    return handleAirtableResponse<ContentItem>(records);
  } catch (error) {
    console.error('Error fetching content for group:', error);
    throw error;
  }
};

// Question and AnswerOption operations
export const fetchOnboardingQuestions = async (): Promise<Question[]> => {
  try {
    const records = await base('Questions')
      .select({
        filterByFormula: "{Type} = 'Onboarding'",
        sort: [{ field: 'QuestionID', direction: 'asc' }]
      })
      .all();
    
    return handleAirtableResponse<Question>(records);
  } catch (error) {
    console.error('Error fetching onboarding questions:', error);
    throw error;
  }
};

export const fetchQuestionsForVideo = async (videoId: string): Promise<Question[]> => {
  try {
    const records = await base('Questions')
      .select({
        filterByFormula: `FIND("${videoId}", ARRAYJOIN({LinkedVideo})) > 0`,
        sort: [{ field: 'QuestionID', direction: 'asc' }]
      })
      .all();
    
    return handleAirtableResponse<Question>(records);
  } catch (error) {
    console.error('Error fetching questions for video:', error);
    throw error;
  }
};

export const fetchAnswerOptions = async (optionIds: string[]): Promise<AnswerOption[]> => {
  if (!optionIds || optionIds.length === 0) {
    return [];
  }
  const filterByFormula = "OR(" + optionIds.map(id => `RECORD_ID() = '${id}'`).join(',') + ")";
  try {
    const records = await base('AnswerOptions')
      .select({ filterByFormula })
      .all();
    return handleAirtableResponse<AnswerOption>(records);
  } catch (error) {
    console.error('Error fetching answer options:', error);
    throw error;
  }
};

// User response operations
export const fetchUserProgress = async (userRecordId: string): Promise<UserProgress[]> => {
  try {
    const records = await base('UserProgress')
      .select({
        filterByFormula: `FIND("${userRecordId}", ARRAYJOIN({User})) > 0`
      })
      .all();
    return handleAirtableResponse<UserProgress>(records);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
};

export const submitUserResponses = async (responses: Array<{
  User: string[];
  Question: string[];
  SelectedAnswer: string;
}>): Promise<CreateRecordResponse[]> => {
  try {
    const recordsToCreate = responses.map(response => ({
      fields: {
        User: response.User,
        Question: response.Question,
        SelectedAnswer: response.SelectedAnswer,
      }
    }));

    const records = await base('UserResponses').create(recordsToCreate);
    
    return records.map(record => ({
      id: record.id,
      fields: record.fields,
      createdTime: (record as any).createdTime || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error submitting user responses:', error);
    throw error;
  }
};

// User progress operations
export const upsertUserProgress = async (progressData: {
  userRecordId: string;
  videoRecordId: string;
  WatchPercentage: number;
  Status: 'Not Started' | 'In Progress' | 'Completed';
}): Promise<CreateRecordResponse> => {
  try {
    console.log('Upserting user progress:', progressData);
    
    // Check for existing records with more detailed logging
    const filterFormula = `AND(FIND('${progressData.userRecordId}', ARRAYJOIN({User})), FIND('${progressData.videoRecordId}', ARRAYJOIN({Video})))`;
    console.log('Filter formula:', filterFormula);
    
    const existingRecords = await base('UserProgress')
      .select({
        filterByFormula: filterFormula,
        maxRecords: 1
      })
      .firstPage();
    
    console.log('Existing records found:', existingRecords.length);
    
    if (existingRecords.length > 0) {
      console.log('Updating existing record:', existingRecords[0].id);
      const record = await base('UserProgress').update(existingRecords[0].id, {
        WatchPercentage: progressData.WatchPercentage,
        Status: progressData.Status,
      });
      console.log('Updated record:', record.id, record.fields);
      return { id: record.id, fields: record.fields, createdTime: (record as any).createdTime };
    } else {
      console.log('Creating new progress record');
      const record = await base('UserProgress').create({
        User: [progressData.userRecordId],
        Video: [progressData.videoRecordId],
        WatchPercentage: progressData.WatchPercentage,
        Status: progressData.Status,
      });
      console.log('Created new record:', record.id, record.fields);
      return { id: record.id, fields: record.fields, createdTime: (record as any).createdTime };
    }
  } catch (error) {
    console.error('Error upserting user progress:', error);
    console.error('Progress data that failed:', progressData);
    throw error;
  }
};

// Admin operations
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const records = await base('Users')
      .select({
        sort: [{ field: 'Email', direction: 'asc' }]
      })
      .all();
    
    return handleAirtableResponse<User>(records);
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};
