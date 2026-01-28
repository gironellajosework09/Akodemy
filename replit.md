# Akodemy

## Overview

Akodemy is a full-stack coding challenge platform designed for students to practice programming skills across JavaScript, Python, and Java. The platform features a progressive learning system with challenges organized by difficulty levels (beginner, intermediate, advanced), competency tracking, badge achievements, and faculty analytics. Content is sourced from and synchronized with Exercism's open-source exercise repository.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with Vite as the build tool
- **Styling**: Tailwind CSS with custom Akodemy theme colors (purple, gold, gray)
- **Routing**: React Router DOM for client-side navigation
- **Code Editor**: Monaco Editor for in-browser code editing
- **HTTP Client**: Axios with interceptors for auth token handling and automatic logout on 401 responses
- **Charts**: Recharts for analytics visualizations
- **PDF Generation**: jsPDF with html2canvas for certificate/report generation

### Backend Architecture
- **Runtime**: Node.js 22 with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with bcrypt password hashing
- **Role-Based Access Control**: Three roles - `admin`, `student`, `faculty`
- **API Structure**: RESTful routes organized by domain:
  - `/api/auth` - Authentication, SSO, password reset with OTP
  - `/api/challenges` - Challenge CRUD and listing
  - `/api/execute` - Code execution via Judge0 API
  - `/api/progress` - Student progress tracking
  - `/api/faculty` - Faculty analytics dashboard
  - `/api/badges` - Achievement badge system
  - `/api/grading` - Test-based grading engine
  - `/api/scoring` - Score calculation
  - `/api/users` - User profile management

### Data Models
- **User**: Students, faculty, and admins with SSO support (CCIS portal integration)
- **Challenge**: Programming exercises with starter code, test cases, and difficulty ratings
- **Submission**: Code submissions with execution status and scoring
- **ChallengeAnswer/LatestAnswer**: Detailed answer tracking with attempt history
- **Badge**: Achievement badges by language and difficulty level
- **OTP**: Time-limited one-time passwords for password reset

### Code Execution
- **External Service**: Judge0 API for sandboxed code execution
- **Supported Languages**: JavaScript (ID 63), Python (ID 71), Java (ID 62)
- **Error Handling**: Optional OpenAI GPT-3.5 integration for beginner-friendly error explanations

### Test Synchronization System
- **Exercism Integration**: Fetches canonical test data from Exercism's GitHub repositories
- **TOML Parser**: Parses `tests.toml` files for test case definitions
- **Test Generators**: Generates Jest (JS), pytest (Python), and JUnit (Java) test files
- **Caching**: Local canonical-cache directory stores fetched test data

### Grading Engine
- Canonical test fetcher with caching
- Score verification with mismatch logging
- Competency level calculation based on pass rates

## External Dependencies

### Third-Party Services
- **MongoDB**: Primary database (connection via `MONGODB_URI` environment variable)
- **Judge0 API**: Code execution service (`JUDGE0_API_URL`, defaults to ce.judge0.com)
- **OpenAI API**: Optional error message rephrasing (`OPENAI_API_KEY`)
- **Gmail SMTP**: OTP email delivery via nodemailer (`GMAIL_APP_PASSWORD`, `GMAIL_USER`)

### External APIs
- **GitHub API**: Fetches Exercism exercise content and test files
- **Exercism Repositories**: Source for challenges, starter code, and canonical tests

### SSO Integration
- CCIS Portal single sign-on support with shared secret verification
- Configurable via `SSO_SHARED_SECRET`, `SSO_ISSUER`, `SSO_AUDIENCE`

### Environment Variables Required
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing key
- `GMAIL_APP_PASSWORD` - For email OTP delivery
- `GITHUB_TOKEN` - Optional, for higher GitHub API rate limits
- `OPENAI_API_KEY` - Optional, for AI-powered error hints