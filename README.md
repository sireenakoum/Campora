# 🌟 Campora

🎓 **Campora** is a modern campus management platform that brings students, faculty, and administrators together in one centralized system. 📚 It simplifies academic operations with features like course management, attendance tracking, announcements, and communication tools. 🔒 The platform provides secure role-based access and a seamless experience across all devices. 🚀 Campora's mission is to create a smarter, more connected, and efficient digital campus for everyone. ✨

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router, Lucide React, pdfjs-dist |
| **Backend** | Supabase (Auth, PostgreSQL, Row-Level Security), Vercel serverless functions |
| **Database** | PostgreSQL (managed by Supabase) |
| **AI Assistant** | Google Gemini (via Vercel function `api/chat.js`) |
| **Hosting / Deployment** | Vercel |
| **Version Control** | GitHub |

---

## ✨ Features

- **Authentication & Profiles** — Secure sign-up/login, email verification, password reset, role-based access (student, faculty, admin).
- **Course Management** — Manage courses, attendance, notes, and resources in one place.
- **Announcements & CampusPulse** — Campus-wide announcements and a news feed so nobody misses updates.
- **Messaging & Notifications** — Direct messages with read receipts, notifications, and reporting/blocking.
- **Study Groups** — Search, join, and (for admins) manage study groups.
- **Planner & Todo** — Weekly planner, deadlines dashboard, and to-do lists.
- **AI Assistant (Campora Assistant)** — Gemini-powered chat that answers questions and manages todos, deadlines, and planner entries via tool calling.

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (bundled with Node.js)
- A Supabase project (for backend/database)
- (Optional) A [Google Gemini API key](https://aistudio.google.com/apikey) for the AI assistant

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd Campora
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

The `.env` file should contain:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_key

# Server-side only (used by /api/chat on Vercel)
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** The AI assistant (Gemini) only runs through the Vercel serverless function, so the Gemini key is not needed for local-only frontend development. You will need it when deploying to Vercel.

### 4. Set up the Supabase database

Open the **Supabase Dashboard → SQL Editor** for your project and run the script in [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, Row-Level Security policies, and the trigger that auto-creates a profile on sign-up. It is safe to re-run.

### 5. Run the dev server

```bash
npm run dev
```

Then open the URL printed in the terminal (usually http://localhost:5173).

---

## 🔨 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build the app for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run the oxlint linter |

---

## ☁️ Deploying to Vercel

1. Push the repo to GitHub.
2. Import the repo in the [Vercel dashboard](https://vercel.com).
3. Add the environment variables from `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`) to the project settings.
4. Deploy. Vercel builds the frontend and serves `api/chat.js` as the `/api/chat` serverless function automatically.

---

## 📁 Project Structure

```
├── src/                 # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page-level views (Dashboard, Courses, Messages, etc.)
│   ├── lib/             # Shared logic (auth, Supabase client, queries)
│   ├── types/           # Type definitions
│   └── main.jsx         # Entry point
├── api/                 # Vercel serverless functions
│   └── chat.js          # Gemini-backed AI assistant endpoint
├── supabase/
│   └── schema.sql       # Database schema, RLS policies, triggers, seed data
├── public/              # Static assets
├── .env.example         # Environment variable template
└── package.json
```

---

## 🛡️ Security

- The **Gemini API key** is stored server-side in the Vercel function and never exposed to the browser.
- **Row-Level Security** in Supabase scopes every query to the signed-in user.
- The AI assistant's tool actions (todos, deadlines, planner) run through the same authenticated, RLS-scoped access, so it can only modify the signed-in user's own data.
