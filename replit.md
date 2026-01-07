# Akodemy - Coding Challenge Platform

## Overview
Akodemy is a comprehensive coding challenge platform designed for students to practice programming in JavaScript, Python, and Java. It provides a robust environment for coding challenges, real-time code execution, and AI-powered error hints. For faculty, the platform offers tools to monitor student progress and performance analytics. The project aims to deliver a fully functional MVP with authentication, diverse challenges, and progress tracking, fostering a dynamic learning experience. The business vision is to provide an accessible and effective platform for coding education, leveraging modern web technologies and AI to enhance learning and teaching.

## User Preferences
- I prefer clear and concise summaries.
- I appreciate well-structured code.
- I expect iterative development with clear communication.
- Please ask for confirmation before making significant architectural changes or adding new external dependencies.
- Ensure all changes are well-documented and follow best practices.
- I prefer detailed explanations for complex solutions or design choices.

## System Architecture

### UI/UX Decisions
The platform features a consistent dark theme (`gray-900` background, `gray-800` cards) across all pages, including a dynamic landing page with animated stats and a faculty dashboard preview. Navigation includes a prominent Akodemy logo, a Home button, and a user-role-appropriate dashboard. Modals are used for challenge entry, submission summaries, and logout confirmations. The challenge editor is responsive, adapting to mobile (tab-based interface) and desktop (side-by-side editor/output) views. Progress bars are color-coded to indicate competency levels (e.g., gray for not started, green for mastered).

### Technical Implementations
Akodemy is built with a React 18 frontend (Vite, TailwindCSS) and a Node.js + Express backend. MongoDB Atlas is used for database management. The Monaco Editor provides the in-browser coding environment, while the Judge0 CE API handles real-time code execution. AI-powered error hints are optionally provided via OpenAI GPT. Role-based authentication (student/faculty) is implemented, alongside a secure OTP-based password reset mechanism using Nodemailer with Gmail SMTP.

### Feature Specifications
- **Authentication**: User registration, login, JWT-based authentication, and a secure password reset flow with OTPs. Password strength is enforced, and previous passwords are checked.
- **Student Features**:
    - Dashboard with personalized greetings and achievements showcasing competency progress.
    - Language and difficulty selection for challenges.
    - Monaco Editor with a fullscreen anti-cheat mode.
    - Real-time code execution and AI error hints.
    - Challenge entry modal displays summary, best time, and history before starting.
    - Submission flow saves to `ChallengeAnswer` and `LatestAnswer` models.
- **Faculty Features**:
    - Dashboard displaying analytics, including total students, completion rates, language engagement, and competency distribution charts.
    - Ability to view individual student profiles and progress.
    - Faculty-specific APIs for analytics and student management.
- **Challenge Management**: Challenges are stored in MongoDB with canonical tests. A grading engine uses stored canonical tests for evaluation, with a fallback to GitHub if necessary. Challenges are sourced and synced from Exercism problem specifications.
- **Code Execution**: Integrates with Judge0 for secure code execution and provides detailed test case feedback.
- **Progress Tracking**: Tracks student progress, attempts, scores, and best times for each challenge, dynamically computing competencies based on actual submissions.

### System Design Choices
- **API-First Approach**: All interactions between the frontend and backend occur via a well-defined RESTful API.
- **Modular Design**: The project is structured into `client` and `server` directories, with clear separation of concerns (models, routes, services).
- **Database Schema**: MongoDB models (`User`, `Otp`, `Challenge`, `ChallengeAnswer`, `LatestAnswer`, `Submission`) are designed to support role-based access, detailed progress tracking, and efficient challenge management. `ChallengeAnswer` stores comprehensive submission history, while `LatestAnswer` provides quick access to the most recent submission. OTPs are managed in a dedicated collection with TTL indexes for automatic expiry.
- **Error Handling**: Comprehensive error handling is implemented, particularly for authentication flows (e.g., OTP verification, password strength).
- **Scalability**: Designed to be scalable using MongoDB Atlas for the database and external APIs for compute-intensive tasks like code execution (Judge0).

## External Dependencies
- **MongoDB Atlas**: Cloud-hosted NoSQL database for all application data.
- **Judge0 CE API**: Used for real-time code compilation and execution.
- **OpenAI GPT**: (Optional) Integrated for generating AI-powered error hints for students.
- **Nodemailer**: Utilized for sending emails, specifically for OTP-based password resets via Gmail SMTP.
- **Exercism Problem Specifications (GitHub)**: Source for coding challenges and their canonical tests, synced into the Akodemy database.
- **Monaco Editor**: Integrated into the frontend for the interactive code editing experience.
- **html2canvas & jsPDF**: Used for generating PDF reports of student achievements.

## Recent Changes
- January 7, 2026: Instruction-First Challenge Experience
  - Two-modal flow before coding starts:
    1. Challenge Entry Modal: Shows best time, runs, latest code preview
    2. Instructions Modal: Full scrollable instructions with numbered steps, "Start Coding" button
  - Instructions mandatory to view before coding begins
  - Editor opens with instructions minimized by default
  - "View Instructions" accordion button during coding (toggles to "Hide Instructions")
  - Smooth expand/collapse for instructions panel
  - Run button positioned at bottom right (mobile and desktop)
  - Finish button disabled until code is run at least once
  - View Latest Submission modal (read-only) during coding
  - History Panel shows all previous attempts
  - New component: InstructionsModal.jsx
  - Results Modal shows: Attempt number, Time spent, Runs, Pass/Fail status
  - Retry button follows same instruction-first flow (does not reuse editor state)
  - Hard copy-paste blocking in code editor (Ctrl+C/V/X, right-click, clipboard events)
  - Visual notice in editor header: "Copy & paste is disabled"
  - Toast notification when blocked action attempted
  - UX Rules: Modal mandatory, instructions visible first, editor never blocked, no auto-load of previous code