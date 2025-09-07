/**
 * Airtable Configuration for Evolve Clinical Study Platform
 * 
 * Update this file with your Airtable credentials and settings
 */

export const airtableConfig = {
  // Airtable API credentials
  apiKey: process.env.AIRTABLE_API_KEY || 'your_api_key_here',
  baseId: process.env.AIRTABLE_BASE_ID || 'your_base_id_here',
  
  // Base settings
  baseName: 'Evolve Clinical Study',
  baseDescription: 'Clinical study platform data management',
  
  // Table settings
  tables: {
    // User management
    users: {
      name: 'Users',
      description: 'User management and authentication data',
      fields: {
        userID: { name: 'UserID', type: 'singleLineText', required: true },
        email: { name: 'Email', type: 'email', required: true },
        assignedGroup: { name: 'AssignedGroup', type: 'singleSelect', options: ['Group A', 'Group B'] },
        onboardingCompleted: { name: 'OnboardingCompleted', type: 'checkbox', defaultValue: false },
        isAdmin: { name: 'IsAdmin', type: 'checkbox', defaultValue: false },
        createdAt: { name: 'CreatedAt', type: 'dateTime' },
        onboardingData: { name: 'OnboardingData', type: 'longText' }
      }
    },
    
    // Content management
    content: {
      name: 'Content',
      description: 'Educational content and videos for study groups',
      fields: {
        title: { name: 'Title', type: 'singleLineText', required: true },
        youtubeVideoID: { name: 'YouTubeVideoID', type: 'singleLineText' },
        group: { name: 'Group', type: 'singleSelect', options: ['Group A', 'Group B'] },
        order: { name: 'Order', type: 'number' },
        questions: { name: 'Questions', type: 'multipleRecordLinks', linkedTable: 'Questions' }
      }
    },
    
    // Assessment questions
    questions: {
      name: 'Questions',
      description: 'Assessment questions for content evaluation',
      fields: {
        questionText: { name: 'QuestionText', type: 'longText', required: true },
        options: { name: 'Options', type: 'longText' },
        type: { name: 'Type', type: 'singleSelect', options: ['single', 'multiple'] },
        video: { name: 'Video', type: 'multipleRecordLinks', linkedTable: 'Content' },
        onboardingQuestion: { name: 'OnboardingQuestion', type: 'checkbox', defaultValue: false }
      }
    },
    
    // User responses
    userResponses: {
      name: 'UserResponses',
      description: 'User responses to assessment questions',
      fields: {
        userID: { name: 'UserID', type: 'singleLineText', required: true },
        questionID: { name: 'QuestionID', type: 'singleLineText', required: true },
        answer: { name: 'Answer', type: 'longText', required: true },
        videoID: { name: 'VideoID', type: 'singleLineText' },
        submittedAt: { name: 'SubmittedAt', type: 'dateTime' }
      }
    },
    
    // User progress
    userProgress: {
      name: 'UserProgress',
      description: 'User progress tracking through study content',
      fields: {
        userID: { name: 'UserID', type: 'singleLineText', required: true },
        videoID: { name: 'VideoID', type: 'singleLineText', required: true },
        watchProgress: { name: 'WatchProgress', type: 'number', defaultValue: 0 },
        completed: { name: 'Completed', type: 'checkbox', defaultValue: false },
        completedAt: { name: 'CompletedAt', type: 'dateTime' },
        dayNumber: { name: 'DayNumber', type: 'number' }
      }
    },
    
    // Answer options
    answerOptions: {
      name: 'AnswerOptions',
      description: 'Answer options for multiple choice questions',
      fields: {
        optionText: { name: 'OptionText', type: 'singleLineText', required: true },
        isCorrect: { name: 'IsCorrect', type: 'checkbox', defaultValue: false },
        questionID: { name: 'QuestionID', type: 'singleLineText', required: true }
      }
    }
  },
  
  // Field validation rules
  validation: {
    email: {
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      message: 'Please enter a valid email address'
    },
    userID: {
      pattern: '^[a-zA-Z0-9_-]+$',
      message: 'UserID must contain only letters, numbers, underscores, and hyphens'
    },
    watchProgress: {
      min: 0,
      max: 100,
      message: 'Watch progress must be between 0 and 100'
    }
  },
  
  // Indexing for better performance
  indexes: [
    { table: 'Users', fields: ['UserID', 'Email'] },
    { table: 'UserResponses', fields: ['UserID', 'QuestionID'] },
    { table: 'UserProgress', fields: ['UserID', 'VideoID'] },
    { table: 'Content', fields: ['Group', 'Order'] },
    { table: 'Questions', fields: ['OnboardingQuestion', 'Type'] }
  ]
};

export default airtableConfig;
