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
- `POST /api/auth/register` - Register new user (with password validation)
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request OTP for password reset
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/resend-otp` - Resend OTP code

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

### Grading
- `POST /api/grading/grade` - Grade code submission with canonical tests
  - Body: { code, language, exerciseSlug }
  - Returns: { exercise, language, total, passed, score, competency, competencyColor, details }
- `GET /api/grading/sync-status` - View canonical test sync statistics
- `POST /api/grading/sync-canonical-tests` - Trigger sync of all canonical tests (faculty only)

## Running the App
The app runs with `node start.js` which starts both:
- Backend server on port 4000
- Frontend dev server on port 5000

## Database
- Uses MongoDB Atlas (cloud-hosted)
- IP whitelist set to 0.0.0.0/0 for Replit access
- Run `npm run seed` to populate challenges

## Recent Changes
- January 7, 2026: Enhanced Authentication System
  - Added "Forgot Password" option to login page
  - Password requirements enforced: min 8 chars, uppercase, lowercase, number, special char
  - Password strength indicator (Weak/Medium/Strong) - weak passwords rejected
  - New password cannot be same as current or previous password
  - OTP-based password reset flow:
    - 6-character alphanumeric OTP sent via Gmail SMTP
    - OTP expires after 2 minutes
    - Resend Code option available after expiry
    - OTP input with red shake animation on error
    - Confirmation dialog before proceeding to reset
  - Password reset form with New Password + Confirm Password
  - All auth buttons have loading spinners during processing
  - Backend endpoints: forgot-password, verify-otp, reset-password, resend-otp
  - User model extended with previousPassword and resetOtp fields
  - Email service using nodemailer with Gmail SMTP (akodemy.aeoncarde@gmail.com)

- December 16, 2025: Database Canonical Test Storage System
  - Canonical tests now stored in database instead of on-demand fetching
  - Challenge model extended with canonicalTests and canonicalTestsMeta fields
  - Sync script fetches from Exercism problem-specifications GitHub repo
  - Results: 389/417 exercises synced (93%), 6,230 total test cases stored
  - By language: JavaScript (130/2,070 tests), Python (127/2,051 tests), Java (132/2,109 tests)
  - 28 exercises not found (language-specific without canonical data)
  - Judge0 service updated with base64 encoding for special character handling
  - Safe connection handling - sync reuses existing DB connection when called via API
  - Files:
    - server/services/canonical/syncCanonicalTests.js - database sync script
    - server/services/canonical/gradingEngine.js - uses stored tests, falls back to GitHub
    - server/services/canonical/runnerGenerators.js - generates language-specific runners
  - API Endpoints:
    - POST /api/grading/grade - grade submission with stored canonical tests
    - GET /api/grading/sync-status - view sync statistics
    - POST /api/grading/sync-canonical-tests - trigger sync (faculty only)
  - Competency Level Mapping:
    - 90-100% = Mastered (green)
    - 75-89% = Proficient (blue)
    - 50-74% = Developing (yellow)
    - 0-49% = Not Started (red)

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
