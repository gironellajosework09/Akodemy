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
- December 3, 2025: Initial MVP release
  - Full authentication system
  - 15 coding challenges (5 per language)
  - Monaco Editor integration
  - Judge0 code execution
  - Fullscreen anti-cheat mode
  - Faculty analytics dashboard
