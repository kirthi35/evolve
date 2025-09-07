// Airtable data model interfaces

export interface User {
  id: string;
  createdTime?: string;
  fields: {
    UserID: string; // Firebase UID
    Email: string;
    IsAdmin: boolean;
    AssignedGroup: 'Group A' | 'Group B';
    OnboardingCompleted: boolean;
    LastLogin?: string; // Optional - set when user logs in
    OnboardingData?: string; // JSON string of onboarding responses
    UserResponses?: string[]; // Link to UserResponses table
    Progress?: string[]; // Link to UserProgress table
  };
}

export interface ContentItem {
  id: string;
  createdTime?: string;
  fields: {
    Title: string;
    TargetGroup: 'Group A' | 'Group B';
    YouTubeURL: string;
    Order: number;
    Questions?: string[]; // Link to Questions table
    UserProgress?: string[]; // Link to UserProgress table
  };
}

export interface Question {
  id: string;
  createdTime?: string;
  fields: {
    QuestionText: string;
    LinkedVideo?: string[]; // Link to Content table
    OptionA: string;
    OptionB: string;
    OptionC: string;
    OptionD: string;
    UserResponses?: string[]; // Link to UserResponses table
  };
}

// New table for flexible answer options
export interface AnswerOption {
  id: string;
  fields: {
    Question: string[]; // Link to the parent Question
    OptionText: string;
  };
}

export interface UserResponse {
  id: string;
  fields: {
    ResponseID?: number; // Autonumber
    User: string[]; // Link to Users table
    Question: string[]; // Link to Questions table
    SelectedAnswer: string;
    Timestamp: string; // Created time
  };
}

export interface UserProgress {
  id: string;
  fields: {
    ProgressID?: number; // Autonumber
    User: string[]; // Link to Users table
    Video: string[]; // Link to Content table
    WatchPercentage: number; // 0-100
    Status: 'Not Started' | 'In Progress' | 'Completed';
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
  
  // Knowledge Assessment (maps question record ID to selected answer text)
  preTestKnowledge: Record<string, string>;
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