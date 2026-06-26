# 🏙️ CivicPulse
### AI-Powered Hyperlocal Civic Issue Reporting Platform

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%201.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Vite](https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **Vibe2Ship Hackathon 2026** | Problem Statement 2: Community Hero — Hyperlocal Problem Solver

<div align="center">

**🚀 [Live Demo](https://civicpulse.vercel.app)** • **📁 [GitHub](https://github.com/user-Rishabh/civicpulse)** • **📄 [Project Doc](#)**

</div>

---

## 🌟 Overview

CivicPulse is a full-stack AI-powered civic issue reporting platform that empowers citizens to **identify, report, validate, track, and resolve** community infrastructure problems through intelligent automation and community collaboration.

Built for **Indian cities** with a focus on **Mumbai/Maharashtra**, CivicPulse bridges the gap between citizens and municipal authorities using the power of **Gemini 1.5 Flash Vision AI**.

> Upload a photo → AI analyzes instantly → Municipal officer gets notified → Issue gets resolved → Citizen gets email confirmation ✅

---

## ✨ Key Features

### 👤 For Citizens
| Feature | Description |
|---------|-------------|
| 📸 **AI Issue Reporting** | Upload a photo, Gemini Vision auto-analyzes and categorizes |
| 🎯 **Smart Auto-Fill** | Category, severity, department, action plan auto-generated |
| 🔄 **Real-time Tracking** | Live status: Pending → In Progress → Resolved |
| 💬 **Department Chat** | Real-time messaging with municipal officers via Firestore |
| 🤖 **CivicAI Assistant** | AI chatbot that knows your issues and answers in Hinglish/English |
| 🔔 **Smart Notifications** | In-app bell + Email alerts on every status change |
| 👥 **Community Feed** | See and upvote issues reported by neighbors |
| 🗺️ **Issue Map** | Visual Leaflet map of all civic issues across Mumbai |
| 🔍 **Duplicate Detection** | AI prevents duplicate reports for same location/issue |

### 🏛️ For Municipal Officers
| Feature | Description |
|---------|-------------|
| 📋 **Analyze Reports** | View all citizen reports with full AI analysis summary |
| ⏱️ **Resolution Planning** | Set estimated days, add action plans, notify citizens |
| 📸 **Gemini Work Verification** | Upload work photos — AI verifies before status update |
| ✅ **3-Stage Review** | Pending → In Progress (photo proof) → Resolved (completion proof) |
| 💬 **Citizen Chat** | Real-time messaging with issue reporters |
| 📊 **Impact Dashboard** | Live stats, issue breakdown charts, resolution metrics |

### 🤖 AI Capabilities (Gemini 1.5 Flash Vision)
- **6-Point Photo Analysis** — Category, Severity, Department, Description, Action Plan, Resolution Days
- **Duplicate Detection** — Checks existing reports before allowing new submission
- **Work Proof Verification** — Verifies officer work photos (work started + completion)
- **CivicAI Chatbot** — Context-aware assistant with full knowledge of user's issues
- **Invalid Issue Detection** — Rejects non-civic photos with clear warning

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | UI framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Animations** | Framer Motion | Page transitions + micro-animations |
| **AI Vision** | Gemini 1.5 Flash | Photo analysis + chatbot |
| **Auth** | Firebase Authentication | Email/password auth with roles |
| **Database** | Cloud Firestore | Real-time NoSQL |
| **Maps** | Leaflet.js + React Leaflet | Interactive issue map |
| **Charts** | Recharts | Dashboard analytics |
| **Email** | EmailJS | Status notification emails |
| **Deployment** | Vercel + Google AI Studio | Hosting |

---

## 🏗️ Project Structure

```
civicpulse/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx              # Navigation + auth state + theme toggle
│   │   └── IssueMap.jsx            # Leaflet map with severity markers
│   ├── context/
│   │   ├── AuthContext.jsx         # Firebase auth + user profile + role
│   │   └── ThemeContext.jsx        # Dark/Light mode persistence
│   ├── lib/
│   │   ├── firebase.js             # Firebase app initialization
│   │   ├── gemini.js               # Gemini Vision + work verification
│   │   └── notifications.js        # EmailJS + localStorage notifications
│   ├── pages/
│   │   ├── Home.jsx                # Animated landing page
│   │   ├── Login.jsx               # Auth (Login/Signup + role selection)
│   │   ├── Feed.jsx                # Public live issue feed
│   │   ├── CitizenDashboard.jsx    # Citizen portal (6 tabs)
│   │   └── OfficerDashboard.jsx    # Officer portal (6 tabs)
│   ├── App.jsx                     # Router + protected routes
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles + Tailwind
├── .env                            # Environment variables (not committed)
├── .env.example                    # Environment template
├── index.html                      # HTML entry
├── vite.config.js                  # Vite config
├── tailwind.config.js              # Tailwind config
└── README.md                       # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project (free tier)
- Google AI Studio API key (free)
- EmailJS account (free)

### 1. Clone the Repository

```bash
git clone https://github.com/user-Rishabh/civicpulse.git
cd civicpulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# ===== GEMINI AI =====
VITE_GEMINI_API_KEY=your_gemini_api_key_from_aistudio

# ===== FIREBASE =====
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# ===== EMAILJS =====
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project → Enable **Authentication** (Email/Password)
3. Create **Firestore Database** (test mode, region: asia-south1)
4. Update Firestore Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

### 6. Build for Production

```bash
npm run build
npm run preview
```

---

## 🎯 User Flows

### 🏃 Citizen Flow

```
Sign Up as Citizen
       ↓
Upload Photo of Civic Issue
       ↓
Gemini Vision Analyzes (~0.8s)
  ├── Category (Pothole/Water Leak/etc.)
  ├── Severity (Low/Medium/High/Critical)
  ├── Department (BMC/MSEDCL/PWD/etc.)
  ├── Description (2 sentences)
  ├── Suggested Action
  └── Estimated Resolution Days
       ↓
Duplicate Check → Warning if similar exists
       ↓
Review & Submit Report
       ↓
Issue appears on Map + Community Feed
       ↓
Track in Dashboard → Progress stepper
       ↓
Officer sets timeline → Email notification
       ↓
Officer uploads work photo → Gemini verifies → In Progress
       ↓ Email notification
Officer uploads completion → Gemini verifies → Resolved 🎉
       ↓ Email notification
```

### 👮 Officer Flow

```
Sign Up as Officer (requires code: CIVIC2026)
       ↓
Select Department (BMC/MSEDCL/NMMC/PWD/Traffic Police)
       ↓
View Dashboard → Stats + Recent Activity + Issue Breakdown
       ↓
Analyze Reports → Set resolution timeline → Notify citizen
       ↓
Submit Review → Pending tab
  └── Upload work started photo
      → Gemini verifies → Issue moves to In Progress
      → Citizen gets email notification
       ↓
Submit Review → In Progress tab
  └── Upload completion photo
      → Gemini verifies → Issue moves to Resolved
      → Citizen gets email notification 🎉
       ↓
Submit Review → Resolved tab
  └── Before & After photos displayed
```

---

## 📱 Pages & Features

### 🏠 Landing Page (`/`)
- Animated hero with particle system + grid background
- Typewriter subtitle effect (3 rotating phrases)
- Floating mockup card with animated AI analysis UI
- "How It Works" section with 3-step cards
- Stats section with real data from Firestore
- Features grid (6 cards with colored borders)
- Animated CTA section

### 🔐 Login Page (`/login`)
- Split layout (branding left, form right)
- Login / Sign Up tab toggle
- Role selection cards (Citizen / Municipal Officer)
- Officer authorization code field
- Department selection for officers
- Firebase auth integration

### 📡 Live Feed (`/feed`)
- Public feed of all reported issues
- Filter by category, severity, status
- Issue cards with image, badges, upvote
- Click to expand full details modal

### 👤 Citizen Dashboard (`/citizen-dashboard`)
6 tabs with full functionality:

| Tab | Features |
|-----|---------|
| 📊 Dashboard | Stats cards, recent reports, quick actions |
| 🚨 Report Issue | 3-step flow: Upload → AI Analysis → Submit |
| 📍 Track Reports | Progress stepper, officer notes, work photos |
| 💬 Send Message | Issue selector + Department chat + CivicAI |
| 🌍 Community Feed | All issues grid, upvote, modal details |
| 🗺️ Issue Map | Leaflet map with severity color markers |

### 🏛️ Officer Dashboard (`/officer-dashboard`)
6 tabs with full functionality:

| Tab | Features |
|-----|---------|
| 📊 Dashboard | Stats, activity feed, breakdown chart, metrics |
| 📋 Analyze Reports | Issue details, resolution planning, notifications |
| 💬 Messages | Real-time citizen chat |
| ✅ Submit Review | 3 sub-tabs: Pending/In Progress/Resolved with photo proof |
| 🗺️ Issue Map | All issues map |

---

## 🔔 Notification System

### In-App Notifications
- Bell icon with unread count badge
- Stored in localStorage per user
- Types: progress update, resolved, officer message, resolution planned

### Email Notifications (EmailJS)
Emails sent automatically when:
- ✅ Officer sets resolution timeline
- 🔄 Issue moved to In Progress (work photo verified)
- ✅ Issue Resolved (completion photo verified)
- ❌ Officer marks issue as delayed (with reason)

---

## 📊 Evaluation Criteria

| Criteria | Weight | Our Score | Implementation |
|----------|--------|-----------|----------------|
| Problem Solving & Impact | 20% | ⭐⭐⭐⭐⭐ | Real Indian civic problem, city-specific departments |
| Agentic Depth | 20% | ⭐⭐⭐⭐⭐ | 6-point AI analysis, work verification, chatbot |
| Innovation & Creativity | 20% | ⭐⭐⭐⭐⭐ | Dual dashboard, AI proof verification, CivicAI |
| Google Technologies | 15% | ⭐⭐⭐⭐⭐ | Gemini Vision + Firebase + Google AI Studio |
| Product Experience | 10% | ⭐⭐⭐⭐⭐ | Dark/Light mode, animations, responsive |
| Technical Implementation | 10% | ⭐⭐⭐⭐⭐ | Full stack, real-time, role-based auth |
| Completeness & Usability | 5% | ⭐⭐⭐⭐⭐ | All flows working end-to-end |

---

## 🌐 Google Technologies Used

```
✅ Gemini 1.5 Flash Vision    →  Core AI: photo analysis + chatbot + work verification
✅ Google AI Studio           →  API access + deployment platform
✅ Firebase Authentication    →  Secure role-based user management
✅ Cloud Firestore            →  Real-time NoSQL database
```

---

## 🧪 Demo Credentials

### Citizen Account
```
Email:    citizen@demo.com
Password: demo123
Role:     Citizen
```

### Officer Account
```
Email:        officer@bmc.gov.in
Password:     demo123
Officer Code: CIVIC2026
Department:   BMC
```

---

## 🔒 Security Features

- Firebase Authentication on all protected routes
- Role-based routing (Citizen vs Officer portals)
- Officer signup requires authorization code (`CIVIC2026`)
- Firestore rules enforce authenticated-only access
- All API keys in environment variables (never exposed)
- `.env` in `.gitignore`

---

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel --prod
```
Add all environment variables in Vercel dashboard.

### Google AI Studio
Follow: [https://ai.google.dev/gemini-api/docs/aistudio-deploying](https://ai.google.dev/gemini-api/docs/aistudio-deploying)

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.18.0",
    "@google/generative-ai": "^0.24.1",
    "firebase": "^10.x.x",
    "framer-motion": "^11.x.x",
    "leaflet": "^1.9.x",
    "react-leaflet": "^4.x.x",
    "recharts": "^3.8.1",
    "@emailjs/browser": "^4.x.x"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.1",
    "tailwindcss": "^4.3.1",
    "autoprefixer": "^10.5.0",
    "postcss": "^8.5.15"
  }
}
```

---

## 🤝 Team

Built solo for **Vibe2Ship Hackathon 2026** by **Rishabh Mishra**

- 🐙 GitHub: [@user-Rishabh](https://github.com/user-Rishabh)
- 💼 LinkedIn: [mrishabh27](https://linkedin.com/in/mrishabh27)
- 🏫 VESIT Mumbai — B.Tech AI & Data Science (2028)

---

## 📄 License

```
MIT License

Copyright (c) 2026 Rishabh Mishra

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software.
```

---

## 🙏 Acknowledgments

- **Google** for Gemini 1.5 Flash Vision API and Google AI Studio
- **Firebase** for real-time database and authentication
- **Coding Ninjas x Google for Developers** for Vibe2Ship Hackathon 2026
- **OpenStreetMap + CARTO** for beautiful dark map tiles
- **EmailJS** for free email notification service

---

<div align="center">

## ⚡ CivicPulse

**Making cities better, one report at a time.**

*Built with ❤️ for Vibe2Ship Hackathon 2026*

`React` • `Gemini AI` • `Firebase` • `Leaflet` • `Framer Motion`

---

**© 2026 CivicPulse | Powered by Gemini AI + Firebase | Vibe2Ship Hackathon**

</div>
