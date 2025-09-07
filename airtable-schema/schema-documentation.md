# Airtable Schema Documentation

## Overview
This document describes the Airtable schema for the Evolve Clinical Study Platform.

## Tables


### Users
**Description:** User management and authentication data

**Fields:**
- `UserID` (singleLineText): No description
- `Email` (email): No description
- `AssignedGroup` (singleSelect): No description
- `OnboardingCompleted` (checkbox): No description
- `IsAdmin` (checkbox): No description
- `CreatedAt` (dateTime): No description
- `OnboardingData` (longText): No description


### Content
**Description:** Educational content and videos for study groups

**Fields:**
- `Title` (singleLineText): No description
- `YouTubeVideoID` (singleLineText): No description
- `Group` (singleSelect): No description
- `Order` (number): No description


### Questions
**Description:** Assessment questions for content evaluation

**Fields:**
- `QuestionText` (longText): No description
- `Options` (longText): No description
- `Type` (singleSelect): No description
- `OnboardingQuestion` (checkbox): No description


### UserResponses
**Description:** User responses to assessment questions

**Fields:**
- `UserID` (singleLineText): No description
- `QuestionID` (singleLineText): No description
- `Answer` (longText): No description
- `VideoID` (singleLineText): No description
- `SubmittedAt` (dateTime): No description


### UserProgress
**Description:** User progress tracking through study content

**Fields:**
- `UserID` (singleLineText): No description
- `VideoID` (singleLineText): No description
- `WatchProgress` (number): No description
- `Completed` (checkbox): No description
- `CompletedAt` (dateTime): No description
- `DayNumber` (number): No description


### AnswerOptions
**Description:** Answer options for multiple choice questions

**Fields:**
- `OptionText` (singleLineText): No description
- `IsCorrect` (checkbox): No description
- `QuestionID` (singleLineText): No description


## Field Types

- **singleLineText**: Short text fields
- **longText**: Long text fields for descriptions and JSON data
- **email**: Email address fields
- **number**: Numeric fields
- **checkbox**: Boolean fields
- **dateTime**: Date and time fields
- **singleSelect**: Dropdown selection fields

## Usage

1. **Run the schema updater:**
   ```bash
   npm run update-airtable
   ```

2. **Set environment variables (optional):**
   ```bash
   export AIRTABLE_API_KEY="your_api_key"
   export AIRTABLE_BASE_ID="your_base_id"
   ```

3. **Verify the schema:**
   - Check your Airtable base for the new tables and fields
   - Ensure all field types are correct
   - Test data entry and validation

## Notes

- The script will create missing tables and add missing fields
- Existing data will not be affected
- Field types cannot be changed after creation
- The script uses Airtable REST API for better compatibility

## Generated on: 2025-09-07T18:40:45.587Z
