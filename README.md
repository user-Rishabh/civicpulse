<div align="center">
<img src="https://img.shields.io/badge/CivicPulse-AI%20Powered-blue?style=for-the-badge&logo=firebase&logoColor=white" />
<img src="https://img.shields.io/badge/Gemini%201.5%20Flash-Vision%20AI-4285F4?style=for-the-badge&logo=google&logoColor=white" />
<img src="https://img.shields.io/badge/Firebase-Deployed-FF6C37?style=for-the-badge&logo=firebase&logoColor=white" />
<img src="https://img.shields.io/badge/React%20+%20Vite-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<br/><br/>
 
```
 ██████╗██╗██╗   ██╗██╗ ██████╗    ██████╗ ██╗   ██╗██╗     ███████╗███████╗
██╔════╝██║██║   ██║██║██╔════╝    ██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
██║     ██║██║   ██║██║██║         ██████╔╝██║   ██║██║     ███████╗█████╗  
██║     ██║╚██╗ ██╔╝██║██║         ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝  
╚██████╗██║ ╚████╔╝ ██║╚██████╗    ██║     ╚██████╔╝███████╗███████║███████╗
 ╚═════╝╚═╝  ╚═══╝  ╚═╝ ╚═════╝   ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝
```
 
### 🏙️ Making Cities Smarter, One Report at a Time
 
**AI-powered hyperlocal civic issue reporting platform bridging citizens and municipal officers.**
 
<br/>
Live Demo : https://civicpulse-b545c.web.app/
<br>
Github link: https://github.com/user-Rishabh/civicpulse
<br>
Google Doc Link: 
<br/>
---
 
</div>
## 📌 Problem Statement
 
> **PS2 — Community Hero: Hyperlocal Problem Solver**
 
Communities across India face daily infrastructure challenges — potholes, water leaks, broken streetlights, garbage dumping. Reporting these issues is **fragmented**, **untracked**, and **lacks transparency**. Citizens have no way to know if their complaint was even received, let alone acted upon.
 
**CivicPulse solves this end-to-end.**
 
---
 
## 🚀 Live Demo
 
🔗 **[https://civicpulse-b545c.web.app](https://civicpulse-b545c.web.app)**
 
| Role | Email | Password |
|------|-------|----------|
| 👤 Citizen | `citizen@demo.com` | `demo1234` |
| 👮 Officer | `officer@demo.com` | `demo1234` |
 
---
 
## ✨ Features
 
### 🤖 AI-Powered Issue Reporting
```
📸 Upload Photo/Video
        ↓
🧠 Gemini 1.5 Flash Vision Analyzes
        ↓
📋 Auto-generates Full Report:
   • Category (Pothole / Water Leak / Streetlight / Garbage...)
   • Severity (Low / Medium / High / Critical)
   • Department Assignment (BMC Roads / Water Supply / Electricity...)
   • AI Action Plan
   • Estimated Resolution Time
        ↓
🔔 Officer Notified via Email
        ↓
📍 Geo-tagged & Mapped in Real-time
```
 
### 👥 Community Verification System
- Citizens upload their own photo of the same issue
- **Gemini compares both images** to confirm it's the same location/problem
- Verified issues get **severity bumped** automatically
- Verifier earns **+200 points** 
- Officer gets notified when multiple citizens verify
### 👷 Officer Work Completion Verification
- Officer uploads "work started" photo → Gemini verifies
- Officer uploads "completion" photo → **Gemini AI validates resolution**
- Issue auto-marked as `Resolved` after AI confirmation
- Citizen notified of resolution
### 💬 Real-time Citizen-Officer Chat
- Direct Firestore-powered messaging per issue
- **Gemini AI generates context-aware replies** as officer
- Smart reply suggestions for citizens
- Live typing indicator
### 🗺️ Interactive Issue Map
- **Leaflet.js** geo-tagged issue visualization
- Color-coded severity markers (Critical 🔴 / High 🟠 / Medium 🟡 / Low 🟢)
- Filter by: All Issues / My Issues / Critical / Pending
- Available for both Citizen and Officer dashboards
### 📊 City Health Score
- Real-time score (0-100) calculated from Firestore data
- Drops when new issues reported, rises when resolved
- Officers directly responsible for improving the score
- Live stats: Total / Pending / Critical / Resolved
### 🏆 Gamification System
| Badge | Requirement |
|-------|------------|
| 🌱 First Reporter | Submit first civic issue |
| ⭐ Active Citizen | Report 3+ issues |
| 🏆 Community Hero | Report 5+ issues |
| ✅ Problem Solver | Get 1 issue resolved |
| 🔥 City Influencer | Receive 10+ upvotes |
| 👑 City Champion | 10+ reports, 5+ resolved |
 
### 🔔 Notification System
- Real-time Firestore notification bell
- EmailJS email alerts for issue updates
- Live telemetry ticker on landing page
- In-app notification center with mark-as-read
---
 
## 🏗️ Architecture
 
```
┌─────────────────────────────────────────────────────────┐
│                      CIVICPULSE                         │
├──────────────────┬──────────────────────────────────────┤
│   CITIZEN SIDE   │           OFFICER SIDE               │
├──────────────────┼──────────────────────────────────────┤
│ 📋 Dashboard     │ 🎯 Command Center Dashboard         │
│ 📸 Report Issue  │ 🔍 Analyze Reports                  │
│ 📍 Track Reports │ 💬 Department Messages              │
│ 💬 Send Message  │ ✅ Submit Review (AI Verify)        │
│ 👥 Community Feed│ 🗺️ Issue Map                        │
│ 🗺️ Issue Map     │                                     │
└──────────────────┴──────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │    GOOGLE STACK       │
              ├───────────────────────┤
              │ Gemini 1.5 Flash      │
              │ Firebase Auth         │
              │ Cloud Firestore       │
              │ Firebase Hosting      │
              └───────────────────────┘
```
 
---
 
## 🛠️ Tech Stack
 
### Frontend
| Technology | Usage |
|------------|-------|
| ⚛️ React 18 + Vite | Core framework |
| 🎨 Tailwind CSS | Styling |
| 🎭 Framer Motion | Animations & transitions |
| 🗺️ Leaflet.js | Interactive maps |
 
### Backend & Database
| Technology | Usage |
|------------|-------|
| 🔥 Firebase Auth | Role-based authentication (Citizen/Officer) |
| 📄 Cloud Firestore | Real-time database |
| 🚀 Firebase Hosting | Production deployment |
 
### AI & Integrations
| Technology | Usage |
|------------|-------|
| 🧠 Gemini 1.5 Flash Vision | Photo/video analysis, verification, chat |
| 📧 EmailJS | Email notifications |
| 🗺️ OpenStreetMap + CARTO | Map tiles |
 
---
 
## 🔄 Complete User Flow
 
```
CITIZEN                          GEMINI AI                    OFFICER
   │                                 │                            │
   │──── Upload Photo/Video ────────►│                            │
   │                                 │── Analyze & Categorize     │
   │◄─── Full AI Report ────────────│                            │
   │                                 │                            │
   │──── Submit Report ──────────────────────────────────────────►│
   │                                 │                            │── Review Issue
   │                                 │                            │── Upload Work Photo
   │                                 │◄─── Verify Work Started ───│
   │                                 │                            │
   │                                 │◄─── Verify Completion ─────│
   │◄─── Issue Resolved Notification ────────────────────────────│
   │                                 │                            │
```
 
---
 
## 🚀 Getting Started
 
### Prerequisites
- Node.js 18+
- Firebase account
- Gemini API key (Google AI Studio)
### Installation
 
```bash
# Clone the repository
git clone https://github.com/user-Rishabh/civicpulse.git
cd civicpulse
 
# Install dependencies
npm install
 
# Set up environment variables
cp .env.example .env
# Add your Firebase config and Gemini API key
 
# Start development server
npm run dev
```
 
### Environment Variables
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```
 
### Deploy to Firebase
```bash
npm run build
firebase deploy --only hosting
```
 
---
 
## 📁 Project Structure
 
```
civicpulse/
├── src/
│   ├── components/
│   │   ├── IssueMap.jsx          # Leaflet map component
│   │   └── ...
│   ├── context/
│   │   ├── AuthContext.jsx       # Firebase auth context
│   │   └── ThemeContext.jsx      # Dark/Light theme
│   ├── lib/
│   │   ├── firebase.js           # Firebase config
│   │   └── gemini.js             # Gemini API calls
│   ├── pages/
│   │   ├── Landing.jsx           # Landing page
│   │   ├── CitizenDashboard.jsx  # Citizen portal
│   │   ├── OfficerDashboard.jsx  # Officer portal
│   │   └── Login.jsx             # Auth page
│   └── App.jsx
├── public/
├── firebase.json
├── .firebaserc
└── vite.config.js
```
 
---
 
## 🎯 Agentic AI Pipeline
 
CivicPulse implements a **3-stage autonomous AI pipeline**:
 
```
STAGE 1: ISSUE INTAKE AGENT
├── Receives photo/video from citizen
├── Gemini Vision: Detects issue type
├── Classifies: Category + Severity + Department
├── Generates: Action plan + Resolution estimate
└── Output: Complete structured report
 
STAGE 2: COMMUNITY VERIFICATION AGENT  
├── Receives verification photo from another citizen
├── Gemini: Compares original vs verification image
├── Validates: Same location? Same issue?
├── If verified: Bumps severity + awards points
└── Output: Verification result + officer notification
 
STAGE 3: RESOLUTION VERIFICATION AGENT
├── Receives completion photo from officer
├── Gemini: Compares issue photo vs resolved photo
├── Validates: Issue actually fixed?
├── If confirmed: Marks resolved + notifies citizen
└── Output: Resolution confirmation + city health score update
```
 
---
 
## 📸 Screenshots
 
| Landing Page | Citizen Dashboard |
|-------------|------------------|
| AI-powered hero with live telemetry | Report tracking with live workflow |
 
| Officer Command Center | Community Feed |
|----------------------|----------------|
| City health score + issue management | Real-time civic social feed |
 
---
 
## 👨‍💻 Built By
 
**Rishabh Mishra** 
VESIT Mumbai, B.Tech AI & Data Science 

[![GitHub](https://img.shields.io/badge/GitHub-user--Rishabh-181717?style=flat&logo=github)](https://github.com/user-Rishabh)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-mrishabh27-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/mrishabh27)
 
---
 
## 🏆 Hackathon
 
Built for **Vibe2Ship Hackathon 2026** by Coding Ninjas × Google for Developers  
Problem Statement: **PS2 — Community Hero: Hyperlocal Problem Solver**  
---
 
<div align="center">
**⭐ Star this repo if CivicPulse made you believe in smarter cities!**
 
`Made with ❤️ in Mumbai` · `Powered by Gemini AI` · `Built on Firebase`
 
</div>
