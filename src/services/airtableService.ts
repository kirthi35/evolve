import Airtable from 'airtable';
import type {
  User,
  Content,
  Question,
  AnswerOption,
  UserResponse,
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
    const records = await base('Users')
      .select({
        filterByFormula: `{UserID} = "${uid}"`,
        maxRecords: 1
      })
      .firstPage();
    
    if (records.length === 0) {
      return null;
    }
    
    const record = records[0];
    return {
      id: record.id,
      createdTime: record.createdTime,
      fields: record.fields as User['fields']
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
      ...userData,
      LastLogin: new Date().toISOString()
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

// Functions from master branch for admin content creation
export const createContent = async (contentData: {
  Name: string;
  Group: 'Group A' | 'Group B';
  Type: 'Video';
  URL: string;
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
  Text: string;
  Type: 'multiple-choice' | 'free-text';
  Video: string[];
  Order: number;
  Options?: string;
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


// Content operations
export const fetchContentForGroup = async (group: 'Group A' | 'Group B'): Promise<Content[]> => {
  try {
    const records = await base('Content')
      .select({
        filterByFormula: `{TargetGroup} = "${group}"`,
        sort: [{ field: 'Order', direction: 'asc' }]
      })
      .all();

    return handleAirtableResponse<Content>(records);
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
    const existingRecords = await base('UserProgress')
      .select({
        filterByFormula: `AND(FIND('${progressData.userRecordId}', ARRAYJOIN({User})), FIND('${progressData.videoRecordId}', ARRAYJOIN({Video})))`,
        maxRecords: 1
      })
      .firstPage();
    
    if (existingRecords.length > 0) {
      const record = await base('UserProgress').update(existingRecords[0].id, {
        WatchPercentage: progressData.WatchPercentage,
        Status: progressData.Status,
      });
      return { id: record.id, fields: record.fields, createdTime: (record as any).createdTime };
    } else {
      const record = await base('UserProgress').create({
        User: [progressData.userRecordId],
        Video: [progressData.videoRecordId],
        WatchPercentage: progressData.WatchPercentage,
        Status: progressData.Status,
      });
      return { id: record.id, fields: record.fields, createdTime: (record as any).createdTime };
    }
  } catch (error) {
    console.error('Error upserting user progress:', error);
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
