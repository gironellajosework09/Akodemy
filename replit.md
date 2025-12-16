# Akodemy - Coding Challenge Platform

## Overview
Akodemy is a comprehensive coding challenge platform built with React and Node.js. It allows students to practice coding in JavaScript, Python, and Java, while faculty can monitor student progress and analytics.

**Current State**: Fully functional MVP with authentication, challenges, code execution, and progress tracking.

## Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB Atlas
- **Code Editor**: Monaco Editor
- **Code Execution**: Judge0 CE API
- **AI Hints**: OpenAI GPT (optional, with fallback)

## Project Structure
```
akodemy/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React context (Auth)
│   │   ├── pages/          # Page components
│   │   │   ├── student/    # Student pages
│   │   │   └── faculty/    # Faculty pages
│   │   └── services/       # API service
│   └── vite.config.js
├── server/                 # Express backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── services/           # External services (Judge0, GPT)
│   ├── middleware/         # Auth middleware
│   └── seed.js             # Database seeder
├── start.js                # Combined startup script
└── package.json
```

## Features

### Student Features
- Login/Register with role-based access
- Dashboard with welcome message
- Profile page with user information
- Achievements page with competency progress bars
- Language selection (JavaScript, Python, Java)
- Difficulty tiers (Beginner, Intermediate, Advanced)
- Challenge list with best time and run count
- Monaco Editor for coding challenges
- **Fullscreen anti-cheat mode** - exits fullscreen ends challenge
- Real-time code execution with Judge0
- AI-powered error hints

### Faculty Features
- Dashboard with analytics (total students, completionists)
- Language engagement chart
- Student list with progress overview
- Individual student profile view with competencies

## Environment Variables
- `MONGODB_URI` - MongoDB Atlas connection string (required)
- `OPENAI_API_KEY` - OpenAI API key for AI hints (optional)
- `JWT_SECRET` - JWT signing secret (auto-generated)
- `JUDGE0_API_URL` - Judge0 API URL (defaults to public API)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Challenges
- `GET /api/challenges` - List challenges (with filters)
- `GET /api/challenges/:id` - Get single challenge

### Code Execution
- `POST /api/execute` - Execute code with Judge0

### Progress
- `GET /api/progress/my-progress` - Get user progress
- `POST /api/progress/save` - Save challenge progress

### Faculty
- `GET /api/faculty/analytics` - Get analytics data
- `GET /api/faculty/students` - List all students
- `GET /api/faculty/student/:id` - Get student details

### Grading (New)
- `POST /api/grading/grade` - Grade code submission with Exercism tests
  - Body: { code, language, exerciseSlug }
  - Returns: { totalTests, passedTests, passRate, competency, score, errors, details }
- `GET /api/grading/cache-stats` - View test file cache statistics

## Running the App
The app runs with `node start.js` which starts both:
- Backend server on port 4000
- Frontend dev server on port 5000

## Database
- Uses MongoDB Atlas (cloud-hosted)
- IP whitelist set to 0.0.0.0/0 for Replit access
- Run `npm run seed` to populate challenges

## Recent Changes
- December 16, 2025: Canonical Test Harness Extraction System
  - Fetches canonical-data.json from Exercism problem-specifications GitHub repo
  - Extracts test cases with inputs/outputs (ignores actual test frameworks)
  - Generates single-file test runners per language:
    - JavaScript: Node.js compatible, no npm modules
    - Python: Single script, no external packages
    - Java: Single Main class, no JUnit/Maven/Gradle
  - Files:
    - server/services/canonical/testFetcher.js - fetches canonical data with 24hr caching
    - server/services/canonical/gradingEngine.js - orchestrates grading pipeline
    - server/services/canonical/runnerGenerators.js - generates language-specific runners
  - API: POST /api/grading/grade
    - Body: { code, language, exerciseSlug }
    - Returns: { total, passed, score, competency, details }
  - Competency Level Mapping:
    - 90-100% = Mastered (green)
    - 75-89% = Proficient (blue)
    - 50-74% = Developing (yellow)
    - 0-49% = Not Started (red)
  - Scoring: score = (passed_tests / total_tests) * 100
  - Judge0 sandbox execution for security

- December 15, 2025: Earlier - Scoring System & Dashboard Enhancements
  - Faculty dashboard now shows per-competency student distribution chart
  - New API: GET /api/faculty/competency-student-distribution
  - Achievements: removed mastery labels, restored x/y numbers on progress bars
  - Results overlay: hidden scrollbar with CSS

- December 15, 2025: Results Overlay & Navigation Update
  - Added ResultsOverlay component that displays after finishing or exiting a challenge
  - Shows score percentage, tests passed, time taken (no XP as requested)
  - Includes test results list with pass/fail status for each test case
  - Challenge info displayed with title, language, and difficulty badge
  - Two action buttons: Back to Challenges, Next Challenge
  - Container fits within viewport height (max-h-[95vh])
  - Added Home button to navigation header before My Profile button
  - Home button navigates to appropriate dashboard based on user role

- December 10, 2025: Profile Page Enhancements
  - Student profile page made fully responsive for mobile devices
  - Faculty profile button now correctly navigates to /faculty/profile
  - Created FacultyProfile.jsx page for faculty users
  - Profile details are now editable with Save Changes button
  - Backend PUT /api/auth/profile endpoint for saving user profile updates
  - Removed x/y numbers from achievements progress bars (kept legend only)
  - Added PDF download button for achievements using html2canvas + jsPDF
  - Faculty dashboard shows new competency distribution chart
  - Stacked bar chart shows percentage of students at each mastery level per language

- December 10, 2025: Mobile Responsive Design & Navigation
  - Added back buttons to Language Selection, Difficulty Selection, and Challenge List pages
  - Back buttons placed below header with proper navigation targets
  - Pagination added to Challenge List (6 items on mobile, 12 on desktop)
  - Pagination resets when switching language/difficulty
  - All selection pages now responsive with single-column grid on mobile
  - Header made smaller on mobile (icon only for profile button)
  - Challenge Editor redesigned for both mobile and desktop:
    - Toggleable instructions accordion at top (uniform across all views)
    - Mobile: Tab-based interface (Code Editor / Output tabs)
    - Desktop: Side-by-side editor and output
    - Compact header with truncated title

- December 10, 2025: Complete Dark Theme & UI Consistency Update
  - Added dynamic landing page as the home page before login
  - Hero section with animated stats from database
  - Features section highlighting platform capabilities
  - Faculty section with mock dashboard preview
  - CTA section with gradient background
  - Login page redesigned to match dark theme
  - ALL pages updated to consistent dark theme (gray-900 background, gray-800 cards)
  - All student pages use shared Layout component for consistency
  - All faculty pages use shared Layout component for consistency
  - Added ConfirmDialog component for logout confirmation
  - "Are you sure you want to logout?" dialog on all pages
  - Fixed faculty StudentProfileView - competencies now dynamic from real submissions
  - Added backend endpoint for computing student competencies dynamically
  - Challenge editor exit confirmation dialog added

- December 4, 2025: Comprehensive Exercism Integration
  - Full Exercism sync fetches ALL 411+ challenges from GitHub (149 JS, 150 Python, 146 Java)
  - Deterministic competency mapping using keyword matching + consistent hash fallback
  - Dynamic progress tracking computed from actual user submissions (no hardcoded values)
  - Profile shows 6 competency categories per language with accurate totals
  - Color-coded progress bars: gray (not started), red (<40%), yellow (40-79%), green (80%+)
  - Sync endpoint restricted to faculty users for security

- December 4, 2025: UI/UX Improvements
  - Header updated with Akodemy logo and brand name (replaced welcome text)
  - Added logout button to header
  - Fixed competency progress bar labels with proper alignment
  - Added legend showing mastery levels (Needs Practice, Developing, Mastered)
  - Challenges now sorted by difficulty (beginner first)
  - Fixed fullscreen button not working in challenge editor

- December 4, 2025: Enhanced features
  - Loading spinners for login/register buttons
  - Personalized welcome message with user's name
  - Test case validation with pass/fail feedback
  - Fixed backend stability (0.0.0.0 binding, proper port cleanup)

- December 3, 2025: Initial MVP release
  - Full authentication system
  - Monaco Editor integration
  - Judge0 code execution
  - Fullscreen anti-cheat mode
  - Faculty analytics dashboard
