# 🏆 YourAI – Community Hero

> **AI-powered civic engagement platform** that helps citizens report, verify, track, and resolve community issues using Google Gemini Vision AI.

[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev) [![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org) [![Firebase](https://img.shields.io/badge/Firebase-FFCA28)](https://firebase.google.com) [![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4)](https://ai.google.dev)

---

## ✨ Features

- 🤖 **Gemini Vision AI** – Auto-detects issue type, severity, authority from images/videos
- 🗺️ **Live Geo Map** – Interactive Google Maps with severity markers and heatmaps
- 🔥 **Real-Time Tracking** – Live status updates via Firebase Firestore
- 🏆 **Gamification** – Points, badges (Citizen/Hero/Guardian), city leaderboard
- 📊 **Analytics Dashboard** – Charts: category breakdown, resolution rates, trends
- 🧠 **Predictive Insights** – Gemini-powered forecasts of emerging community issues
- 🚨 **Emergency SOS** – Quick-dial Police/Fire/Ambulance with GPS location sharing
- 👥 **Community Verification** – Nearby citizens upvote and verify issues
- 🛡️ **Authority Dashboard** – Full issue management with priority ranking

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| State | Zustand |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| AI | Google Gemini 1.5 Flash |
| Maps | @react-google-maps/api |
| Charts | Recharts |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/yourai-community-hero.git
cd yourai-community-hero
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in your API keys in `.env`:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

### 3. Start Dev Server

```bash
npm run dev
```

Open `http://localhost:5173`

> **Demo Mode**: The app works fully with mock data without any API keys. All 13 pages are functional for hackathon demos.

---

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** (Email/Password)
4. Enable **Cloud Firestore**
5. Enable **Storage**
6. Copy config keys to `.env`

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /issues/{issueId} {
      allow read: if true;
      allow create, update: if request.auth != null;
    }
    match /verifications/{id} {
      allow read, create: if request.auth != null;
    }
    match /notifications/{id} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🤖 Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create API Key
3. Add to `.env`: `VITE_GEMINI_API_KEY=your_key`

**Gemini Powers:**
- Image/video analysis for civic issue detection
- Auto categorization + severity assessment
- Professional summary generation
- Duplicate issue detection
- Predictive community insights
- Authority recommendation

---

## 🗺️ Google Maps

Enable in [Google Cloud Console](https://console.cloud.google.com):
- Maps JavaScript API
- Visualization API (heatmaps)

---

## 🚢 Deployment

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting  # public: dist, SPA: yes
npm run build
firebase deploy
```

### Vercel

```bash
npm run build
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

> Set all `VITE_*` env vars in your hosting provider dashboard.

---

## 📁 Project Structure

```
src/
├── components/layout/    # Navbar, EmergencyModal
├── components/ui/        # AnimatedBackground
├── contexts/             # AuthContext
├── lib/                  # firebase.ts, gemini.ts
├── pages/                # All 13 pages
├── services/             # geminiService, issueService, userService
├── store/                # Zustand state
├── types/                # TypeScript interfaces
└── App.tsx               # Router
```

---

## 🎮 Points & Badges

| Action | Points |
|--------|--------|
| Report Issue | +50 |
| Verify Issue | +10 |
| Confirm Resolved | +20 |

| Badge | Requirement |
|-------|-------------|
| 🏅 Citizen | Sign up |
| 🦸 Hero | 10 reports |
| 🏆 Champion | 25 reports |
| 🛡️ Guardian | 50 verifications |

---

## 📜 License

MIT – Built with ❤️ for the community using Google Gemini AI.
