# Airtable Schema Management Scripts

This directory contains scripts for managing the Airtable schema for the Evolve Clinical Study Platform.

## Scripts

### 1. `update-airtable-schema.js`
Main script that updates the Airtable base schema to match the current codebase.

**Features:**
- Creates missing tables
- Adds missing fields to existing tables
- Preserves existing data
- Generates schema documentation

### 2. `airtable-config.js`
Configuration file containing table definitions and field specifications.

### 3. `run-schema-update.js`
Simple runner script that checks environment variables and runs the schema updater.

## Setup

### 1. Install Dependencies
```bash
npm install airtable
```

### 2. Set Environment Variables
```bash
# Option 1: Export environment variables
export AIRTABLE_API_KEY="your_api_key_here"
export AIRTABLE_BASE_ID="your_base_id_here"

# Option 2: Create a .env file
echo "AIRTABLE_API_KEY=your_api_key_here" > .env
echo "AIRTABLE_BASE_ID=your_base_id_here" >> .env
```

### 3. Get Your Airtable Credentials

**API Key:**
1. Go to https://airtable.com/account
2. Generate a new personal access token
3. Copy the token

**Base ID:**
1. Open your Airtable base
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY/viwZZZZZZZZZZZZZZ`
3. The Base ID is the part after `/app` and before `/tbl`

## Usage

### Run Schema Update
```bash
# Using the runner script (recommended)
node scripts/run-schema-update.js

# Or run directly
node scripts/update-airtable-schema.js
```

### Using npm scripts
Add to your package.json:
```json
{
  "scripts": {
    "update-airtable": "node scripts/run-schema-update.js"
  }
}
```

Then run:
```bash
npm run update-airtable
```

## Tables Created

The script will create/update the following tables:

### 1. Users
- UserID (Firebase UID)
- Email
- AssignedGroup (Group A/Group B)
- OnboardingCompleted
- IsAdmin
- CreatedAt
- OnboardingData (JSON)

### 2. Content
- Title
- YouTubeVideoID
- Group (Group A/Group B)
- Order
- Questions (linked to Questions table)

### 3. Questions
- QuestionText
- Options (JSON)
- Type (single/multiple)
- Video (linked to Content table)
- OnboardingQuestion

### 4. UserResponses
- UserID
- QuestionID
- Answer
- VideoID
- SubmittedAt

### 5. UserProgress
- UserID
- VideoID
- WatchProgress (0-100)
- Completed
- CompletedAt
- DayNumber

### 6. AnswerOptions
- OptionText
- IsCorrect
- QuestionID

## Field Types

- **singleLineText**: Short text fields
- **longText**: Long text fields for descriptions and JSON data
- **email**: Email address fields with validation
- **number**: Numeric fields
- **checkbox**: Boolean fields
- **dateTime**: Date and time fields
- **singleSelect**: Dropdown selection fields
- **multipleRecordLinks**: Links to other tables

## Safety Features

- **Non-destructive**: Only adds missing fields, never removes existing ones
- **Data preservation**: Existing data is never modified
- **Error handling**: Comprehensive error handling and logging
- **Validation**: Field type validation and constraints

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify your API key is correct
   - Ensure the API key has access to the base

2. **Base Not Found**
   - Check your Base ID is correct
   - Ensure the base exists and is accessible

3. **Permission Denied**
   - Verify your API key has write permissions
   - Check if the base allows schema modifications

4. **Field Creation Failed**
   - Some field types may not be supported
   - Check Airtable documentation for field type limitations

### Debug Mode

Set debug environment variable for detailed logging:
```bash
DEBUG=true node scripts/update-airtable-schema.js
```

## Output

The script generates:
- Console output with progress and status
- Schema documentation in `airtable-schema/schema-documentation.md`
- Error logs for troubleshooting

## Next Steps

After running the schema update:

1. **Verify Tables**: Check your Airtable base for the new tables
2. **Test Fields**: Ensure all field types are correct
3. **Data Entry**: Test creating records with the new schema
4. **Update Code**: Update your application code if needed
5. **Backup**: Consider backing up your base before major changes

## Support

For issues or questions:
- Check the console output for error messages
- Verify your Airtable credentials
- Review the generated documentation
- Check Airtable API documentation for field type limitations
