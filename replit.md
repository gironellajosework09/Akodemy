# Akodemy

## Overview

Akodemy is a coding challenge platform designed for students to practice programming skills. It provides exercises sourced from Exercism across JavaScript, Python, and Java, with automated test execution, scoring, and badge progression. The platform supports three user roles: students, faculty, and administrators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with Vite as the build tool
- **Routing**: React Router v6 for client-side navigation
- **Styling**: Tailwind CSS with custom theme colors (akodemy purple, gold, gray)
- **Code Editor**: Monaco Editor integration for in-browser coding
- **Charts**: Recharts for analytics visualization
- **PDF Generation**: jspdf and html2canvas for certificate/report generation
- **API Client**: Axios with interceptors for authentication token management

### Backend Architecture

- **Framework**: Express.js REST API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with bcryptjs password hashing
- **Role-based Access**: Middleware for student, faculty, and admin authorization
- **Code Execution**: Judge0 API integration for running user code
- **AI Hints**: OpenAI GPT integration for rephrasing error messages into beginner-friendly hints

### Data Models

- **User**: Supports students, faculty, and admin roles with SSO integration capabilities
- **Challenge**: Coding exercises with difficulty levels (beginner/intermediate/advanced), starter code, and test cases
- **Submission**: Tracks user attempts with status, output, and completion state
- **ChallengeAnswer/LatestAnswer**: Stores user solutions with scoring and attempt history
- **Badge**: Achievement system tied to language and difficulty mastery
- **Otp**: Time-limited codes for password reset via email

### Test and Grading System

- **Canonical Tests**: Fetches and caches test cases from Exercism's problem-specifications repository
- **Test Runners**: Generates language-specific test suites (Jest for JS, pytest for Python, JUnit for Java)
- **Scoring**: Calculates pass rates and competency levels based on test results
- **Score Verification**: Detects and logs scoring mismatches for data integrity

### Key Design Decisions

1. **Exercism Integration**: Exercises, test cases, and starter templates are synced from Exercism's GitHub repositories, providing a large library of curated challenges
2. **Remote Code Execution**: Uses Judge0 API rather than local execution for security and consistency across environments
3. **Competency Mapping**: Challenges are organized into 6 competency areas (Variables, Control Structures, Functions, Arrays, OOP, Error Handling)
4. **Badge Progression**: Three-tier badges per language encourage skill advancement

## External Dependencies

### Third-Party Services

- **MongoDB**: Document database for all application data (connection via MONGODB_URI environment variable)
- **Judge0 API**: Remote code execution service (JUDGE0_API_URL)
- **OpenAI API**: GPT-3.5-turbo for error message rephrasing (OPENAI_API_KEY)
- **Gmail SMTP**: Email delivery for OTP codes (GMAIL_USER, GMAIL_APP_PASSWORD)
- **GitHub API**: Fetching Exercism exercise data and test files (optional GITHUB_TOKEN for rate limits)

### Environment Variables Required

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for signing authentication tokens
- `JUDGE0_API_URL` - Judge0 API endpoint
- `OPENAI_API_KEY` - OpenAI API key (optional, falls back to basic hints)
- `GMAIL_USER` and `GMAIL_APP_PASSWORD` - Email service credentials
- `SSO_SHARED_SECRET` - For SSO integration with external portal (optional)

### NPM Dependencies (Notable)

- Backend: express, mongoose, bcryptjs, jsonwebtoken, axios, openai, @iarna/toml, xlsx
- Frontend: react, react-router-dom, @monaco-editor/react, axios, recharts, lucide-react, tailwindcss