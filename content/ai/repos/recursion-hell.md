# Recursion Hell: the repository

- Repository: https://github.com/Zidarc/Cyber-Loop
- GitHub description: A real-time team-based puzzle game built with a Vite + React frontend and a TypeScript/Express backend. Made for DevDay'26
- Main language: JavaScript
- Live site: https://recursion-hell.vercel.app
- Last pushed: 2026-05-23

## README

# 🚀 Cyber Loop

[](https://recursion-hell.vercel.app/)

**Live Demo:** https://recursion-hell.vercel.app/

---

## ✨ About

Cyber Loop is a real-time team-based puzzle game built with a Vite + React frontend and a TypeScript/Express backend. The project demonstrates modern web development patterns including authentication, game logic, and a responsive UI.

## 🚧 Quick Links

- Frontend: [cyber-loop-frontend](cyber-loop-frontend)
- Backend: [cyber-loop-server](cyber-loop-server)

---

## 🧰 Tech Stack

- Frontend: React (Vite), Tailwind CSS, React Router
- Backend: Express (TypeScript), SQLite (dev), Supabase integrations
- Auth: JWT
- Dev & Test: ESLint, Vitest, tsx

---

## ⚡ Local Setup (Recommended)

Follow these steps to run both the frontend and backend locally.

### 1) Backend (API)

Open a terminal and:

```bash
cd cyber-loop-server
npm install
# copy or create .env based on .env.example and set DB / Supabase keys
# example: cp .env.example .env
npm run dev
```

Common scripts:

- `npm run dev` — run backend in development
- `npm test` — run server tests
- `npm run build` / `npm run start` — production build & start

Default dev URL: http://localhost:3000

Health check: `http://localhost:3000/health` → `{ "status": "ok" }`

### 2) Frontend (Client)

In a separate terminal:

```bash
cd cyber-loop-frontend
npm install
npm run dev
```

Open the app at http://localhost:5173 (Vite default).

Common scripts:

- `npm run dev` — start frontend dev server
- `npm run build` — build for production
- `npm run preview` — preview production build

---

## 🔧 Environment & Notes

- Backend may use SQLite locally and Supabase for production features. Check `cyber-loop-server/src/config/supabase.ts` for Supabase wiring.
- Ensure environment variables (JWT secret, Supabase keys, DB paths) are set in the backend `.env`.
- If you need to test auth flows, use the provided test accounts or seed scripts in `cyber-loop-server/data`.

---

## 🧪 Tests

- Backend tests: run `cd cyber-loop-server && npm test`.
- Frontend: add/extend tests inside `cyber-loop-frontend` as desired (Vite + React testing setup).

---

## 📦 Deployment

- Frontend is configured for Vercel (see `vercel.json`).
- Backend can be deployed on any Node host; consider using Docker or a serverless platform with a managed database for production.

---

## 🗂 Project Structure (high level)

- `cyber-loop-frontend/` — React app, components in `src/components`, pages in `src/pages`
- `cyber-loop-server/` — TypeScript Express app, controllers/services under `src/`

---

## 👥 Team

- Hunza Shahzadi — Frontend Developer — https://github.com/hunzashahzadi23
- Abdul Rahman — Frontend Developer — https://github.com/AbdulRahman10725
