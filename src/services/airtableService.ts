import Airtable from 'airtable';
import type { 
  User, 
  Content, 
  Question, 
  CreateRecordResponse 
} from '../types/airtable';

// Initialize Airtable with Personal Access Token
const base = new Airtable({
  apiKey: import.meta.env.VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN
}).base(import.meta.env.VITE_AIRTABLE_BASE_ID);

// Debug logging
console.log('Airtable Base ID:', import.meta.env.VITE_AIRTABLE_BASE_ID);
console.log('Airtable Token exists:', !!import.meta.env.VITE_AIRTABLE_PERSONAL_ACCESS_TOKEN);

// Helper function to handle Airtable API responses
const handleAirtableResponse = <T>(records: readonly any[]): T[] => {
  return records.map(record => ({
    id: record.id,
    fields: record.fields
  })) as T[];
};

// User operations
export const fetchUserByFirebaseUID = async (uid: string): Promise<User | null> => {
  try {
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = "${uid}"`,
        maxRecords: 1
      })
      .firstPage();
    
    if (records.length === 0) {
      return null;
    }
    
    return {
      id: records[0].id,
      fields: records[0].fields as User['fields']
    };
  } catch (error) {
    console.error('Error fetching user by Firebase UID:', error);
    throw error;
  }
};

export const createUser = async (userData: {
  UserID: string;
  Email: string;
  AssignedGroup: 'Group A' | 'Group B';
  OnboardingCompleted: boolean;
  IsAdmin: boolean;
}): Promise<CreateRecordResponse> => {
  try {
    const record = await base('Users').create({
      UserID: userData.UserID,
      Email: userData.Email,
      AssignedGroup: userData.AssignedGroup,
      OnboardingCompleted: userData.OnboardingCompleted,
      IsAdmin: userData.IsAdmin,
      CreatedAt: new Date().toISOString()
    });
    
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

// Question operations
export const fetchOnboardingQuestions = async (): Promise<Question[]> => {
  try {
    const records = await base('Questions')
      .select({
        filterByFormula: '{OnboardingQuestion} = TRUE()',
        sort: [{ field: 'Order', direction: 'asc' }]
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
        filterByFormula: `FIND("${videoId}", ARRAYJOIN({Video})) > 0`,
        sort: [{ field: 'Order', direction: 'asc' }]
      })
      .all();
    
    return handleAirtableResponse<Question>(records);
  } catch (error) {
    console.error('Error fetching questions for video:', error);
    throw error;
  }
};

// Content operations
export const fetchContentForGroup = async (group: 'Group A' | 'Group B'): Promise<Content[]> => {
  try {
    const records = await base('Content')
      .select({
        filterByFormula: `{Group} = "${group}"`,
        sort: [{ field: 'Order', direction: 'asc' }]
      })
      .all();
    
    return handleAirtableResponse<Content>(records);
  } catch (error) {
    console.error('Error fetching content for group:', error);
    throw error;
  }
};

// User response operations
export const submitUserResponses = async (responses: Array<{
  UserID: string;
  QuestionID: string;
  Answer: string;
  VideoID?: string;
}>): Promise<CreateRecordResponse[]> => {
  try {
    const records = await base('UserResponses').create(
      responses.map(response => ({
        UserID: response.UserID,
        QuestionID: response.QuestionID,
        Answer: response.Answer,
        VideoID: response.VideoID || '',
        SubmittedAt: new Date().toISOString()
      }))
    );
    
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
export const updateUserProgress = async (progressData: {
  UserID: string;
  VideoID: string;
  WatchProgress: number;
  Completed: boolean;
  DayNumber?: number;
}): Promise<CreateRecordResponse> => {
  try {
    // First, check if a progress record already exists
    const existingRecords = await base('UserProgress')
      .select({
        filterByFormula: `AND({UserID} = "${progressData.UserID}", {VideoID} = "${progressData.VideoID}")`,
        maxRecords: 1
      })
      .firstPage();
    
    if (existingRecords.length > 0) {
      // Update existing record
      const record = await base('UserProgress').update(existingRecords[0].id, {
        WatchProgress: progressData.WatchProgress,
        Completed: progressData.Completed,
        CompletedAt: progressData.Completed ? new Date().toISOString() : '',
        DayNumber: progressData.DayNumber || ''
      });
      
      return {
        id: record.id,
        fields: record.fields,
        createdTime: (record as any).createdTime || new Date().toISOString()
      };
    } else {
      // Create new record
      const record = await base('UserProgress').create({
        UserID: progressData.UserID,
        VideoID: progressData.VideoID,
        WatchProgress: progressData.WatchProgress,
        Completed: progressData.Completed,
        CompletedAt: progressData.Completed ? new Date().toISOString() : '',
        DayNumber: progressData.DayNumber || ''
      });
      
      return {
        id: record.id,
        fields: record.fields,
        createdTime: (record as any).createdTime || new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
};

// Admin operations
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const records = await base('Users')
      .select({
        sort: [{ field: 'CreatedAt', direction: 'desc' }]
      })
      .all();
    
    return handleAirtableResponse<User>(records);
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
};
