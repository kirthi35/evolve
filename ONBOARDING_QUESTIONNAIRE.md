# Onboarding Questionnaire

This document describes the comprehensive onboarding questionnaire implemented for the clinical study.

## Overview

The onboarding questionnaire collects pre-exposure parameters from participants to help understand their background and tailor their experience in the study.

## Parameters Collected

### 1. Demographics
- **Age**: Numeric input for participant age
- **Gender**: Dropdown selection (Male, Female, Other, Prefer not to say)

### 2. Professional Information
- **Clinical Specialty**: Dropdown with 17 medical specialties including:
  - Internal Medicine, Surgery, Pediatrics, Obstetrics & Gynecology
  - Psychiatry, Radiology, Anesthesiology, Emergency Medicine
  - Family Medicine, Dermatology, Ophthalmology, Orthopedics
  - Cardiology, Neurology, Oncology, Pathology, Other

- **Years of Experience**: Radio button selection with classifications:
  - <1 year (Interns/fresh grads)
  - 1–5 years (Early career)
  - 6–10 years (Mid-career)
  - >10 years (Senior consultants)

### 3. Prior AI Exposure
- **AI Exposure Classification**: Radio button selection with detailed descriptions:
  - **None**: Never interacted with AI in any form
  - **Minimal**: Watched YouTube videos or followed AI-related news
  - **Moderate**: Attended webinars, CMEs, or read articles about AI in medicine
  - **High**: Completed formal course (>10 hours) or contributed to AI-based project

- **Technology Comfort Level**: Likert scale (1-5) rating comfort with technology

### 4. Pre-test Knowledge Assessment
Five multiple-choice questions to assess baseline knowledge of AI in healthcare:

1. Primary purpose of machine learning in medical imaging
2. Common applications of AI in healthcare
3. Definition of "bias" in AI systems
4. Regulatory body for AI medical devices in the US
5. Main advantage of AI-assisted diagnosis

## Implementation

### Files Created/Modified

1. **`src/components/dashboard/OnboardingQuestionnaire.tsx`**
   - Main questionnaire component
   - Uses React Hook Form for form management
   - Includes validation and error handling
   - Responsive design with Tailwind CSS

2. **`src/types/airtable.ts`**
   - Updated `OnboardingFormData` interface
   - Defines structure for all collected parameters

3. **`src/pages/OnboardingPage.tsx`**
   - Updated to use the new questionnaire component
   - Handles form submission and data storage
   - Integrates with existing Airtable service

### Usage

The questionnaire is automatically displayed during the onboarding process. Users must complete all required fields before proceeding to the main study interface.

### Data Storage

All responses are stored in Airtable as JSON in the `OnboardingData` field, allowing for easy analysis and reporting.

## Validation

- All fields are required
- Age must be a valid number
- Form validation provides clear error messages
- Submit button is disabled during processing

## Styling

The questionnaire uses a clean, professional design with:
- Card-based layout for better organization
- Hover effects for interactive elements
- Clear section headers and descriptions
- Responsive grid layout for form fields
- Consistent color scheme with the application theme
