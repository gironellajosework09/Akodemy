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

## Running the App
The app runs with `node start.js` which starts both:
- Backend server on port 4000
- Frontend dev server on port 5000

## Database
- Uses MongoDB Atlas (cloud-hosted)
- IP whitelist set to 0.0.0.0/0 for Replit access
- Run `npm run seed` to populate challenges

## Recent Changes
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
