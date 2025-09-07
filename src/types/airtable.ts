// Airtable data model interfaces

export interface User {
  id: string;
  fields: {
    UserID: string; // Firebase UID
    Email: string;
    AssignedGroup: 'Group A' | 'Group B';
    OnboardingCompleted: boolean;
    IsAdmin: boolean;
    CreatedAt?: string;
  };
}

export interface Content {
  id: string;
  fields: {
    Title: string;
    YouTubeVideoID: string;
    Group: 'Group A' | 'Group B';
    Order: number;
    Questions?: string[]; // Array of question record IDs
  };
}

export interface Question {
  id: string;
  fields: {
    QuestionText: string;
    Options: string; // JSON string of options array
    Type: 'single' | 'multiple';
    Video?: string[]; // Array of content record IDs
    OnboardingQuestion?: boolean;
  };
}

export interface UserResponse {
  id: string;
  fields: {
    UserID: string; // Firebase UID
    QuestionID: string;
    Answer: string;
    VideoID?: string;
    SubmittedAt: string;
  };
}

export interface UserProgress {
  id: string;
  fields: {
    UserID: string; // Firebase UID
    VideoID: string;
    WatchProgress: number; // 0-100
    Completed: boolean;
    CompletedAt?: string;
    DayNumber?: number; // For Group B daily progression
  };
}

// Form data interfaces
export interface OnboardingFormData {
  // Demographics
  age: string;
  gender: string;
  
  // Professional Information
  specialty: string;
  yearsOfExperience: string;
  
  // AI Exposure
  priorAIExposure: string;
  techComfortLevel: string;
  
  // Knowledge Assessment
  preTestKnowledge: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    q5: string;
  };
}

export interface QuestionnaireFormData {
  [questionId: string]: string;
}

// API response interfaces
export interface AirtableResponse<T> {
  records: T[];
  offset?: string;
}

export interface CreateRecordResponse {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
}
