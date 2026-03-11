# 🌿 EcoVibe 2.0 — Sustainable Campus Life

A full-stack sustainability web app for college students to track carbon footprint, earn EcoPoints, trade pre-loved items, and build a greener campus community.

## ✨ Features

- **📊 CO2 Tracking** — Log transport, food, electricity & waste with real CO2 calculations
- **🏆 Dashboard** — Interactive charts, leaderboard, streaks & personalized eco-tips
- **🛍️ GreenSwap** — Student exchange & waste-to-craft marketplace with image uploads
- **📝 Social Feed** — Share sustainability wins with likes, comments & tags
- **🎯 Challenges** — Daily/weekly eco-challenges with badge system
- **🎁 Rewards** — Redeem EcoPoints for real campus rewards with QR codes
- **🗺️ Campus Map** — Interactive map with pickup locations & navigation
- **🤖 AI Tips** — Rule-based (+ optional AI) personalized sustainability suggestions

## 🚀 Quick Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings → API** and copy your **Project URL** and **anon public key**

### 2. Run Database Schema
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `supabase/schema.sql` and run it
3. This creates all tables, RLS policies, storage buckets, and seed data

### 3. Disable Email Confirmation (Important!)
1. Go to **Authentication → Providers → Email** in Supabase Dashboard
2. **Turn OFF** "Confirm email" toggle (since we use synthetic emails)
3. Save changes

### 4. Configure Environment
```bash
cp .env.example .env
```
Edit `.env` and fill in your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AI_API_KEY=optional-gemini-api-key
```

### 5. Install & Run
```bash
npm install
npm run dev
```
Open http://localhost:5173

## 📁 Project Structure
```
src/
├── main.jsx                  # Entry point
├── App.jsx                   # Router + providers
├── index.css                 # Tailwind + global styles
├── lib/
│   ├── supabase.js           # Supabase client
│   ├── co2Calculator.js      # CO2 emissions engine
│   └── ecoTips.js            # AI suggestion engine
├── contexts/
│   └── AuthContext.jsx       # Auth state management
├── components/
│   ├── Layout.jsx            # App shell
│   ├── Navbar.jsx            # Top navigation
│   ├── Sidebar.jsx           # Side navigation
│   ├── Modal.jsx             # Reusable modal
│   ├── Toast.jsx             # Toast notifications
│   ├── LoadingSkeleton.jsx   # Loading states
│   └── ProtectedRoute.jsx    # Route guard
└── pages/
    ├── Landing.jsx           # Public landing page
    ├── Login.jsx             # Student ID login
    ├── Signup.jsx            # Registration
    ├── Dashboard.jsx         # Main dashboard
    ├── CO2Tracking.jsx       # CO2 logging + history
    ├── GreenSwap.jsx         # Marketplace
    ├── CampusMap.jsx         # Interactive map
    ├── Feed.jsx              # Social feed
    ├── Challenges.jsx        # Eco-challenges
    ├── Rewards.jsx           # Rewards + redemption
    └── Profile.jsx           # User profile
```

## 🔐 Authentication
Login uses **Student ID** (not email). Internally, the app generates a synthetic email `{studentId}@ecovibe.local` for Supabase auth, keeping the UI clean.

## 🗄️ Database Tables
`profiles` · `co2_logs` · `marketplace_listings` · `swap_requests` · `campus_points` · `posts` · `post_likes` · `post_comments` · `challenges` · `challenge_completions` · `rewards` · `redemptions` · `badges` · `user_badges`

All tables have Row Level Security (RLS) enabled.

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS v4
- **Backend**: Supabase (Postgres + Auth + Storage)
- **Charts**: Recharts
- **Icons**: Lucide React
- **QR Codes**: qrcode.react
- **Animations**: Framer Motion (available), CSS transitions

## 📦 Deployment
```bash
npm run build  # Creates dist/ folder
```
Deploy `dist/` to Vercel, Netlify, or any static host.
# EcoVibe-
