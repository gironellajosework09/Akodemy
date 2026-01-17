# Akodemy

## Overview

Akodemy is a coding challenge platform designed for learning and practicing programming skills. It provides interactive coding exercises sourced from Exercism, supports multiple programming languages (JavaScript, Python, Java), and includes features for both students and faculty. The platform enables code execution, automated grading, progress tracking, and competency-based learning paths.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with Vite as the build tool
- **Styling**: Tailwind CSS with custom color theme (purple/gold branding)
- **Code Editor**: Monaco Editor (@monaco-editor/react) for in-browser coding
- **Routing**: React Router DOM for client-side navigation
- **HTTP Client**: Axios with interceptors for API calls and auth token handling
- **Charts**: Recharts for progress visualization
- **Icons**: Lucide React for UI icons

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **API Design**: RESTful endpoints organized by domain (auth, challenges, execute, progress, faculty, grading)
- **Authentication**: JWT-based with middleware for protected routes and role-based access (student/faculty)
- **Code Execution**: Integration with Judge0 API for sandboxed code execution
- **AI Integration**: OpenAI GPT for rephrasing error messages into beginner-friendly hints

### Data Storage
- **Database**: MongoDB with Mongoose ODM
- **Collections**:
  - Users (with competency tracking per language)
  - Challenges (with test cases, starter code, difficulty levels)
  - Submissions (code attempts with status and results)
  - ChallengeAnswers/LatestAnswers (tracking student progress)
  - OTPs (for password reset functionality)
  - Badges (achievement badges earned by users per language/difficulty)

### External Content Sync
- **Exercism Integration**: Scripts to sync exercises, tests, and templates from Exercism's GitHub repositories
- **Canonical Test Cache**: Local cache of Exercism's canonical test data in `server/canonical-cache/`
- **Test Formats**: Support for TOML-based test specifications and language-specific test file formats

### Key Design Patterns
- **Monorepo Structure**: Single repository with separate client/server packages
- **Proxy Configuration**: Vite dev server proxies `/api` requests to backend (port 5175)
- **Competency Indexing**: Challenges mapped to 6 competency areas per language
- **Multi-language Support**: Unified grading system with language-specific test generators

## External Dependencies

### Third-Party APIs
- **Judge0**: Code execution sandbox service for running student code safely
- **OpenAI**: GPT-3.5 for generating helpful error message hints
- **GitHub API**: Fetching Exercism exercise content and test specifications

### Email Service
- **Nodemailer**: Gmail SMTP for sending OTP codes during password reset
- **Environment Variables**: `GMAIL_APP_PASSWORD` and optional `GMAIL_USER`

### Database
- **MongoDB**: Primary data store (connection via `MONGODB_URI` environment variable)

### Content Source
- **Exercism**: Open-source coding exercises from exercism.org repositories
- **Canonical Data**: JSON-formatted test specifications cached locally for offline grading

## Recent Changes

- January 17, 2026: UX Improvements - Navigation Flow & Transitions
  - Next Challenge Flow: "Next" button in result modal now shows instructions first (same as "Retry")
  - Smooth Transitions: Added CSS animations (fade-in, modal-in, slide-up, shake) to all modals
  - Accessibility: Animations respect prefers-reduced-motion preference
  - Login Error UX: Error messages shown without clearing inputs, red border and shake on error, focus management

- January 17, 2026: Gamified Badging & Title System
  - Badge Model: Stores badges with status (claimable/claimed) and equipped flag
  - Badge States: locked -> claimable (on completion) -> claimed (manual) -> equipped (active title)
  - Badge Service Functions:
    - checkAndUnlockBadge(): Unlocks badge when all challenges completed (does NOT auto-claim)
    - claimBadge(): Manual claim via button click
    - equipBadge()/unequipBadge(): Set/unset badge as profile title (only one at a time)
    - getEquippedBadge(): Get currently equipped badge
  - Badge Routes: /api/badges/my-badges, /api/badges/progress, /api/badges/equipped, /api/badges/claim, /api/badges/equip, /api/badges/unequip
  - Badge Mapping:
    - Java: Java Barista (beginner), Java Brewer (intermediate), Java Roast Master (advanced)
    - Python: Python Catcher (beginner), Python Handler (intermediate), Python Expert (advanced)
    - JavaScript: Script Starter (beginner), Script Engineer (intermediate), Script Architect (advanced)
  - UI Components:
    - BadgeDisplay: Shows all 9 badges with Claim buttons for claimable, Equip toggle for claimed
    - BadgeUnlockedModal: Congratulations modal with Claim Badge button when tier completed
    - ClaimSuccessModal: Celebratory modal after claiming
  - Profile Integration: Equipped badge title shown under user name
  - Gamified Flow: Complete challenges -> Badge unlocked -> Manual claim -> Equip as title

- January 17, 2026: Complete Test Case Sync from Exercism
  - Full test sync: 417/417 challenges (100%) now have test cases
  - Total test cases: 6,186 across JavaScript, Python, and Java
  - fullTestSync.js: Fetches canonical-data.json from Exercism problem-specifications
  - fallbackTestGenerator.js: Provides tests for 28 platform-specific exercises without canonical data
  - Input/output normalization ensures compatibility with grading engine
  - Both testCases and canonicalTests fields populated for all challenges

- January 17, 2026: Enhanced Autograder Pipeline
  - Test Alignment Analyzer: Compares platform tests vs Exercism canonical data
  - Canonical Test Converter: Strict normalization and sync from canonical-data.json
  - Execution Contract: Defines strict input/output/error handling and scoring rules
  - Score Verification Service: Detects score mismatches between stored and computed values
  - ScoreMismatchLog Model: Persists mismatch events to MongoDB for audit
  - New API endpoints (faculty-only):
    - POST /api/grading/analyze-alignment - Analyze test alignment
    - POST /api/grading/convert-tests - Convert and sync tests for exercise
    - POST /api/grading/sync-all-tests - Sync all tests for language
    - POST /api/grading/verify-scores - Verify recent submissions
    - POST /api/grading/verify-submission/:id - Verify specific submission
    - GET /api/grading/mismatch-logs - View score mismatch logs
    - GET /api/grading/execution-contract - View grading contract spec
  - Unit tests for converter and execution contract logic