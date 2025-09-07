# Airtable Field Specification for Evolve Clinical Study Platform

This document provides a comprehensive list of all fields required for each table in the Airtable base, based on the current codebase analysis.

## Table 1: Users

**Purpose**: Store user management and authentication data

| Field Name | Field Type | Description | Required | Options/Validation |
|------------|------------|-------------|----------|-------------------|
| `UserID` | Single line text | Firebase UID (Primary identifier) | ✅ Yes | Unique, Firebase UID format |
| `Email` | Email | User's email address | ✅ Yes | Valid email format |
| `AssignedGroup` | Single select | Study group assignment | ✅ Yes | Group A, Group B |
| `OnboardingCompleted` | Checkbox | Whether user completed onboarding | ✅ Yes | Default: false |
| `IsAdmin` | Checkbox | Admin user flag | ✅ Yes | Default: false |
| `CreatedAt` | Date | Record creation timestamp | ✅ Yes | Auto-generated |
| `LastLogin` | Date | Last login timestamp | ❌ No | Optional tracking |
| `OnboardingData` | Long text | JSON string of onboarding responses | ❌ No | Stores questionnaire data |
| `UserResponses` | Multiple record links | Links to UserResponses table | ❌ No | Auto-populated |
| `Progress` | Multiple record links | Links to UserProgress table | ❌ No | Auto-populated |

## Table 2: Content

**Purpose**: Store educational content and videos for study groups

| Field Name | Field Type | Description | Required | Options/Validation |
|------------|------------|-------------|----------|-------------------|
| `VideoID` | Single line text | Primary identifier for video | ✅ Yes | Unique identifier |
| `Title` | Single line text | Video/content title | ✅ Yes | Descriptive title |
| `YouTubeURL` | URL | YouTube video URL | ❌ No | Valid YouTube URL format |
| `YouTubeVideoID` | Single line text | YouTube video identifier | ❌ No | YouTube video ID only |
| `TargetGroup` | Single select | Target study group | ✅ Yes | Group A, Group B |
| `Group` | Single select | Alternative field name for TargetGroup | ❌ No | Group A, Group B |
| `Order` | Number | Display order for content | ✅ Yes | Integer, 0+ |
| `ReleaseDay` | Number | Day number for Group B daily unlock | ❌ No | Integer, 1-30 |
| `Questions` | Multiple record links | Links to Questions table | ❌ No | Auto-populated |

## Table 3: Questions

**Purpose**: Store assessment questions for content evaluation

| Field Name | Field Type | Description | Required | Options/Validation |
|------------|------------|-------------|----------|-------------------|
| `QuestionID` | Number | Autonumber for display | ❌ No | Auto-incrementing |
| `QuestionText` | Long text | The question content | ✅ Yes | Full question text |
| `Type` | Single select | Question type classification | ✅ Yes | Onboarding, Video |
| `LinkedVideo` | Multiple record links | Links to Content table | ❌ No | Associated videos |
| `Video` | Multiple record links | Alternative field name for LinkedVideo | ❌ No | Associated videos |
| `AnswerOptions` | Multiple record links | Links to AnswerOptions table | ❌ No | Available answer choices |
| `CorrectAnswer` | Single line text | Text of correct answer | ❌ No | Correct answer text |
| `OnboardingQuestion` | Checkbox | Flag for onboarding questions | ❌ No | Default: false |
| `Options` | Long text | JSON string of answer options | ❌ No | Alternative to AnswerOptions links |

## Table 4: UserResponses

**Purpose**: Store user responses to assessment questions

| Field Name | Field Type | Description | Required | Options/Validation |
|------------|------------|-------------|----------|-------------------|
| `ResponseID` | Number | Autonumber for display | ❌ No | Auto-incrementing |
| `User` | Multiple record links | Links to Users table | ✅ Yes | User who responded |
| `UserID` | Single line text | Firebase UID (alternative to User link) | ❌ No | Firebase UID |
| `Question` | Multiple record links | Links to Questions table | ✅ Yes | Question being answered |
| `QuestionID` | Single line text | Question record ID (alternative to Question link) | ❌ No | Question record ID |
| `SelectedAnswer` | Single line text | User's selected answer | ✅ Yes | Answer text |
| `Answer` | Long text | Alternative field name for SelectedAnswer | ❌ No | Answer text |
| `Timestamp` | Date | Response submission time | ✅ Yes | Auto-generated |
| `SubmittedAt` | Date | Alternative field name for Timestamp | ❌ No | Submission time |
| `VideoID` | Single line text | Associated video ID | ❌ No | Video context |

## Table 5: UserProgress

**Purpose**: Track user progress through study content

| Field Name | Field Type | Description | Required | Options/Validation |
|------------|------------|-------------|----------|-------------------|
| `ProgressID` | Number | Autonumber for display | ❌ No | Auto-incrementing |
| `User` | Multiple record links | Links to Users table | ✅ Yes | User making progress |
| `UserID` | Single line text | Firebase UID (alternative to User link) | ❌ No | Firebase UID |
| `Video` | Multiple record links | Links to Content table | ✅ Yes | Video being watched |
| `VideoID` | Single line text | Video identifier (alternative to Video link) | ❌ No | Video ID |
| `WatchPercentage` | Number | Watch progress percentage | ✅ Yes | 0-100, integer |
| `WatchProgress` | Number | Alternative field name for WatchPercentage | ❌ No | 0-100, integer |
| `Status` | Single select | Progress status | ✅ Yes | Not Started, In Progress, Completed |
| `Completed` | Checkbox | Completion status | ❌ No | Default: false |
| `CompletedAt` | Date | Completion timestamp | ❌ No | When completed |
| `DayNumber` | Number | Day number for Group B progression | ❌ No | Integer, 1-30 |

## Table 6: AnswerOptions

**Purpose**: Store answer options for multiple choice questions

| Field Name | Field Type | Description | Required | Options/Validation |
|------------|------------|-------------|----------|-------------------|
| `OptionID` | Number | Autonumber for display | ❌ No | Auto-incrementing |
| `Question` | Multiple record links | Links to Questions table | ✅ Yes | Parent question |
| `QuestionID` | Single line text | Question record ID (alternative to Question link) | ❌ No | Question record ID |
| `OptionText` | Single line text | The answer option text | ✅ Yes | Option text content |
| `IsCorrect` | Checkbox | Whether this is the correct answer | ❌ No | Default: false |

## Field Type Specifications

### Single Line Text
- **Purpose**: Short text fields (names, IDs, titles)
- **Max Length**: 255 characters
- **Validation**: No special characters for IDs

### Long Text
- **Purpose**: Long content (questions, descriptions, JSON data)
- **Max Length**: 100,000 characters
- **Validation**: JSON format for structured data

### Email
- **Purpose**: Email addresses
- **Validation**: Standard email format validation
- **Unique**: Should be unique per user

### Number
- **Purpose**: Numeric values (percentages, counts, orders)
- **Precision**: Integer for most fields
- **Validation**: Range validation (0-100 for percentages)

### Checkbox
- **Purpose**: Boolean values
- **Default**: Usually false
- **Options**: Check icon, green color

### Date/DateTime
- **Purpose**: Timestamps and dates
- **Format**: ISO 8601 format
- **Auto-generated**: For creation timestamps

### Single Select
- **Purpose**: Dropdown selections
- **Options**: Predefined choices
- **Colors**: Different colors for each option

### Multiple Record Links
- **Purpose**: Relationships between tables
- **Behavior**: Auto-populated based on relationships
- **Performance**: Indexed for better performance

## Data Validation Rules

### UserID (Firebase UID)
- **Format**: Firebase UID format
- **Length**: 28 characters
- **Pattern**: `^[a-zA-Z0-9_-]+$`

### Email
- **Pattern**: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
- **Unique**: Must be unique across all users

### WatchProgress/Percentage
- **Range**: 0-100
- **Type**: Integer
- **Validation**: `>= 0 AND <= 100`

### AssignedGroup/TargetGroup
- **Options**: Group A, Group B
- **Required**: Must be one of the valid options

## Indexing Recommendations

### Primary Indexes
- `Users.UserID` (Primary key)
- `Content.VideoID` (Primary key)
- `Questions.QuestionID` (Primary key)

### Performance Indexes
- `UserResponses.UserID + QuestionID`
- `UserProgress.UserID + VideoID`
- `Content.TargetGroup + Order`
- `Questions.Type + OnboardingQuestion`

### Search Indexes
- `Users.Email`
- `Content.Title`
- `Questions.QuestionText`

## Notes

1. **Field Naming**: Some fields have alternative names (e.g., `TargetGroup` vs `Group`) for backward compatibility
2. **Links vs IDs**: Both linked fields and ID fields are provided for flexibility
3. **JSON Storage**: Some complex data is stored as JSON strings in long text fields
4. **Auto-population**: Many link fields are auto-populated based on relationships
5. **Validation**: All required fields should have appropriate validation rules
6. **Performance**: Consider indexing frequently queried fields for better performance

## Implementation Status

✅ **All tables created** in Airtable base
✅ **Core fields implemented** for basic functionality
⚠️ **Some optional fields** may need manual addition
⚠️ **Field validation rules** may need manual configuration in Airtable
⚠️ **Indexing** should be configured for optimal performance
