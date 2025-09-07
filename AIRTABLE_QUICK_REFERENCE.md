# Airtable Tables - Quick Reference

## 📋 Table Overview

| Table | Purpose | Key Fields | Records |
|-------|---------|------------|---------|
| **Users** | User management | UserID, Email, AssignedGroup | User accounts |
| **Content** | Educational videos | VideoID, Title, TargetGroup | Video content |
| **Questions** | Assessment questions | QuestionText, Type | Quiz questions |
| **UserResponses** | User answers | User, Question, SelectedAnswer | User responses |
| **UserProgress** | Progress tracking | User, Video, WatchPercentage | Progress data |
| **AnswerOptions** | Answer choices | Question, OptionText, IsCorrect | MCQ options |

---

## 🔑 Users Table

**Primary Key**: `UserID` (Firebase UID)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UserID` | Single line text | ✅ | Firebase UID |
| `Email` | Email | ✅ | User email |
| `AssignedGroup` | Single select | ✅ | Group A or Group B |
| `OnboardingCompleted` | Checkbox | ✅ | Onboarding status |
| `IsAdmin` | Checkbox | ✅ | Admin flag |
| `CreatedAt` | Date | ✅ | Creation timestamp |
| `LastLogin` | Date | ❌ | Last login time |
| `OnboardingData` | Long text | ❌ | JSON questionnaire data |

---

## 🎥 Content Table

**Primary Key**: `VideoID`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `VideoID` | Single line text | ✅ | Unique video ID |
| `Title` | Single line text | ✅ | Video title |
| `YouTubeVideoID` | Single line text | ❌ | YouTube video ID |
| `TargetGroup` | Single select | ✅ | Group A or Group B |
| `Order` | Number | ✅ | Display order |
| `ReleaseDay` | Number | ❌ | Day for Group B unlock |

---

## ❓ Questions Table

**Primary Key**: `QuestionID` (Autonumber)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `QuestionText` | Long text | ✅ | Question content |
| `Type` | Single select | ✅ | Onboarding or Video |
| `LinkedVideo` | Multiple record links | ❌ | Associated videos |
| `AnswerOptions` | Multiple record links | ❌ | Answer choices |
| `CorrectAnswer` | Single line text | ❌ | Correct answer text |
| `OnboardingQuestion` | Checkbox | ❌ | Onboarding flag |

---

## 📝 UserResponses Table

**Primary Key**: `ResponseID` (Autonumber)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `User` | Multiple record links | ✅ | User who responded |
| `Question` | Multiple record links | ✅ | Question answered |
| `SelectedAnswer` | Single line text | ✅ | User's answer |
| `Timestamp` | Date | ✅ | Response time |
| `VideoID` | Single line text | ❌ | Associated video |

---

## 📊 UserProgress Table

**Primary Key**: `ProgressID` (Autonumber)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `User` | Multiple record links | ✅ | User making progress |
| `Video` | Multiple record links | ✅ | Video being watched |
| `WatchPercentage` | Number | ✅ | 0-100 progress |
| `Status` | Single select | ✅ | Not Started/In Progress/Completed |
| `Completed` | Checkbox | ❌ | Completion status |
| `CompletedAt` | Date | ❌ | Completion time |
| `DayNumber` | Number | ❌ | Group B day number |

---

## 🎯 AnswerOptions Table

**Primary Key**: `OptionID` (Autonumber)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Question` | Multiple record links | ✅ | Parent question |
| `OptionText` | Single line text | ✅ | Answer option text |
| `IsCorrect` | Checkbox | ❌ | Correct answer flag |

---

## 🔗 Table Relationships

```
Users (1) ←→ (Many) UserResponses
Users (1) ←→ (Many) UserProgress
Content (1) ←→ (Many) Questions
Questions (1) ←→ (Many) AnswerOptions
Questions (1) ←→ (Many) UserResponses
Content (1) ←→ (Many) UserProgress
```

---

## 📊 Field Type Summary

| Type | Count | Purpose |
|------|-------|---------|
| Single line text | 15 | IDs, names, titles |
| Long text | 4 | Questions, descriptions |
| Email | 1 | User emails |
| Number | 6 | Percentages, counts, orders |
| Checkbox | 8 | Boolean flags |
| Date | 5 | Timestamps |
| Single select | 4 | Dropdown choices |
| Multiple record links | 8 | Table relationships |

---

## ⚡ Quick Stats

- **Total Tables**: 6
- **Total Fields**: 51
- **Required Fields**: 25
- **Optional Fields**: 26
- **Relationship Fields**: 8
- **Indexed Fields**: 12 (recommended)

---

## 🚀 Usage Examples

### Create a new user
```javascript
{
  UserID: "firebase_uid_123",
  Email: "user@example.com",
  AssignedGroup: "Group A",
  OnboardingCompleted: false,
  IsAdmin: false
}
```

### Track video progress
```javascript
{
  User: ["recUser123"],
  Video: ["recVideo456"],
  WatchPercentage: 75,
  Status: "In Progress"
}
```

### Record user response
```javascript
{
  User: ["recUser123"],
  Question: ["recQuestion789"],
  SelectedAnswer: "Option A",
  Timestamp: "2024-01-15T10:30:00Z"
}
```
