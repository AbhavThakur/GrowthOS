# GrowthOS × career-ops Integration Plan

> **Vercel URL:** https://personalgrowthos.vercel.app/  
> **Architecture:** Option C — Separate backend worker  
> **Last updated:** 29 May 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  GrowthOS UI (Vercel)                                   │
│  https://personalgrowthos.vercel.app                    │
│  React + Vite + Firebase Client SDK                     │
└────────────┬───────────────────────────┬────────────────┘
             │ reads (Firestore)         │ creates searchRun
             ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│  Firebase                                               │
│  • Auth (Google + email/password + allowlist)            │
│  • Firestore (companies, jobs, searchRuns, reports)      │
│  • Storage (reports/*, pdfs/*)                           │
└────────────┬───────────────────────────┬────────────────┘
             │                           │ reads searchRun
             │                           │ writes jobs/reports
             ▼                           ▼
┌─────────────────────────────────────────────────────────┐
│  career-ops Worker (Render/Railway)                      │
│  Node.js server using firebase-admin SDK                 │
│  Runs scan.mjs → parses pipeline/history → syncs to DB  │
└─────────────────────────────────────────────────────────┘
```

---

## Status Tracker

### ✅ DONE — Code Changes

| #   | Item                                  | Repo       | Files                                                        |
| --- | ------------------------------------- | ---------- | ------------------------------------------------------------ |
| 1   | Firebase Storage export added         | GrowthOS   | `src/firebase.js`                                            |
| 2   | Role-based career constants           | GrowthOS   | `src/data/careerRoles.js`                                    |
| 3   | Firestore/Storage career data helpers | GrowthOS   | `src/services/careerData.js`                                 |
| 4   | Jobs/Search page with async search    | GrowthOS   | `src/pages/Jobs.jsx`                                         |
| 5   | Jobs tab wired into Career page       | GrowthOS   | `src/pages/Career.jsx`                                       |
| 6   | Companies page read-only MVP          | GrowthOS   | `src/pages/Companies.jsx`                                    |
| 7   | Profile labels changed to role-based  | GrowthOS   | `src/data/constants.js`                                      |
| 8   | Google Auth + email allowlist         | GrowthOS   | `src/context/AuthContext.jsx`, `src/components/AuthGate.jsx` |
| 9   | Firestore security rules              | GrowthOS   | `firestore.rules`                                            |
| 10  | Storage security rules                | GrowthOS   | `storage.rules`                                              |
| 11  | Firebase config file                  | GrowthOS   | `firebase.json`, `firestore.indexes.json`                    |
| 12  | Worker server (HTTP + search handler) | career-ops | `worker/server.mjs`                                          |
| 13  | Worker data parser/sync               | career-ops | `worker/career-data-sync.mjs`                                |
| 14  | firebase-admin dependency added       | career-ops | `package.json`                                               |
| 15  | Worker env vars documented            | career-ops | `.env.example`                                               |
| 16  | GrowthOS env vars documented          | GrowthOS   | `.env.example`                                               |

### ⏳ TODO — Manual Steps (You)

| #   | Item                                    | Where                                                   | Notes                                                   |
| --- | --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| M1  | Enable Google Sign-In provider          | Firebase Console → Auth → Sign-in method                | Toggle Google to "Enabled"                              |
| M2  | Add Vercel domain to authorized domains | Firebase Console → Auth → Settings → Authorized domains | Add `personalgrowthos.vercel.app`                       |
| M3  | Deploy Firestore rules                  | Terminal                                                | `firebase deploy --only firestore:rules`                |
| M4  | Deploy Storage rules                    | Terminal                                                | `firebase deploy --only storage`                        |
| M5  | Generate Firebase service account key   | Firebase Console → Project Settings → Service accounts  | Download JSON for Render worker                         |
| M6  | Set Vercel env vars                     | Vercel Dashboard → Settings → Environment Variables     | See [Vercel Env Vars](#vercel-env-vars) below           |
| M7  | Redeploy GrowthOS on Vercel             | Vercel Dashboard or `git push`                          | After env vars are set                                  |
| M8  | Create Render/Railway service           | Render Dashboard                                        | See [Worker Deploy](#worker-deploy-renderrailway) below |
| M9  | Set Render env vars                     | Render Dashboard → Environment                          | See [Worker Env Vars](#worker-env-vars) below           |
| M10 | Run seed scripts                        | Terminal                                                | After worker is deployed (see below)                    |
| M11 | Verify end-to-end flow                  | Browser                                                 | Sign in → Jobs tab → trigger search → see results       |

### 🔧 TODO — Code Changes (I Can Handle)

| #   | Item                                          | Repo       | Status      | Depends on |
| --- | --------------------------------------------- | ---------- | ----------- | ---------- |
| C1  | Companies Firestore seed script               | career-ops | Not started | —          |
| C2  | Jobs/pipeline Firestore seed script           | career-ops | Not started | —          |
| C3  | Wire Companies page to Firestore              | GrowthOS   | Not started | M3, M10    |
| C4  | Add Aanya/PM role keywords to portals.yml     | career-ops | Not started | —          |
| C5  | Add report/PDF upload to worker sync          | career-ops | Not started | M5         |
| C6  | Add loading skeleton to Jobs page             | GrowthOS   | Not started | —          |
| C7  | Add "last scanned" timestamp to company cards | GrowthOS   | Not started | C3         |
| C8  | Add search history page/section               | GrowthOS   | Not started | —          |

### 🚀 FUTURE — Phase 2 (Real-Time Search)

| #   | Item                                              | Notes                                                     |
| --- | ------------------------------------------------- | --------------------------------------------------------- |
| F1  | Worker runs full scan.mjs on search request       | Currently syncs existing data; needs Playwright on Render |
| F2  | Scheduled worker cron (daily/every-3-days)        | Auto-scan without manual trigger                          |
| F3  | Push notifications for new high-score jobs        | Firebase Cloud Messaging                                  |
| F4  | Report generation from worker                     | Generate eval reports and upload to Storage               |
| F5  | PDF generation from worker                        | Generate tailored CVs and upload to Storage               |
| F6  | Companies page write-back (add company)           | Remove read-only restriction                              |
| F7  | Status mutation from GrowthOS (apply, skip, etc.) | Controlled write-back to career-ops                       |
| F8  | Interview prep integration                        | Show interview-prep files in GrowthOS                     |

---

## Environment Variables

### Vercel Env Vars

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

```env
# Firebase Client SDK (already set if app was deployed before)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Career integration (NEW)
VITE_CAREER_API_BASE_URL=https://your-career-worker.onrender.com
VITE_ALLOWED_AUTH_EMAILS=your@email.com,aanya@email.com
```

### Worker Env Vars

Set these in **Render Dashboard → Service → Environment**:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your_project.appspot.com

# CORS
ALLOWED_ORIGIN=https://personalgrowthos.vercel.app

# Optional: scan behavior
CAREER_WORKER_RUN_SCAN=true

# For first-time testing only — remove after confirming auth works
# CAREER_WORKER_ALLOW_UNAUTHENTICATED=true
```

---

## Worker Deploy (Render/Railway)

### Option A: Render

1. Create a **New Web Service** on Render
2. Connect to your career-ops repo (or push worker/ separately)
3. Settings:
   - **Root Directory:** (leave empty if full repo, or set to `worker/` if separate)
   - **Build Command:** `npm install`
   - **Start Command:** `npm run worker`
   - **Instance Type:** Free
4. Add env vars from [Worker Env Vars](#worker-env-vars)
5. Deploy

### Option B: Railway

1. Create a new project → Deploy from GitHub
2. Same settings as Render
3. Railway auto-detects Node.js; set start command to `npm run worker`

### Important Notes

- Render free tier sleeps after 15 min of inactivity — first request after sleep takes ~30s
- This is fine for MVP since search is async (user sees "queued" → "running" → "completed")
- For always-on, upgrade to paid tier or use Railway's free tier (which has usage limits but no sleep)

---

## Seed Scripts Usage

Once I create the seed scripts (C1, C2), you'll run them like:

```bash
# From career-ops root, with .env containing Firebase Admin credentials
cd /Users/A3100515/Proj/career-ops

# Seed companies from bellandur-companies.md into Firestore
node worker/seed-companies.mjs

# Seed existing scan-history/pipeline jobs into Firestore
node worker/seed-jobs.mjs
```

These are one-time scripts. After seeding, the worker handles ongoing sync.

---

## Verification Checklist

After all manual steps are done, verify:

- [ ] Visit https://personalgrowthos.vercel.app
- [ ] Click "Continue with Google" → signs in with your allowlisted email
- [ ] Navigate to Career → Jobs tab
- [ ] See "No jobs found" (before seeding) or actual jobs (after seeding)
- [ ] Click "Start async search" → status shows "queued"
- [ ] Worker picks up the search → status changes to "running" → "completed"
- [ ] Job cards appear with company, title, location, score, apply link
- [ ] Report/PDF links work (after C5 is done)
- [ ] Career → Companies tab shows Bellandur companies from Firestore (after C3)
- [ ] Sign in with non-allowlisted email → rejected

---

## Risks & Mitigations

| Risk                                    | Severity | Mitigation                                                                       |
| --------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| Render free tier cold starts            | Medium   | UI already handles async status; consider paid tier later                        |
| Playwright not available on Render free | High     | Worker only syncs parsed data for now; full scan needs paid tier with Playwright |
| Firebase rules too restrictive          | Low      | Test with emulator first; rules allow signed-in reads                            |
| No jobs match role keywords             | Medium   | Role keyword lists are broad; will improve with usage                            |
| Service account key exposure            | High     | Never commit .env; use Render's env var UI                                       |
| Firestore read costs                    | Low      | 200 jobs × 2 users = negligible on free tier                                     |

---

## Decision Log

| Date        | Decision                      | Rationale                                           |
| ----------- | ----------------------------- | --------------------------------------------------- |
| 29 May 2026 | Firebase-first (no Supabase)  | Already integrated; avoids two auth systems         |
| 29 May 2026 | Render/Railway for worker     | Free tier; separates long-running scans from Vercel |
| 29 May 2026 | Async search                  | Prevents timeout; better UX for slow scans          |
| 29 May 2026 | Role-based profiles           | Avoids personal names; extensible for future roles  |
| 29 May 2026 | GrowthOS read-only MVP        | Safer; avoids corrupting career-ops data            |
| 29 May 2026 | Google Auth + email allowlist | Private access; easy for both users                 |

---

## Quick Commands Reference

```bash
# GrowthOS
cd /Users/A3100515/Proj/GrowthOS/GrowthOs
npm run dev          # local dev server
npm run build        # production build
npm run lint         # ESLint check
firebase deploy --only firestore:rules   # deploy Firestore rules
firebase deploy --only storage           # deploy Storage rules

# career-ops worker
cd /Users/A3100515/Proj/career-ops
npm run worker       # start worker server locally (needs .env)
npm run worker:sync  # test job parsing locally (no Firebase needed)
npm run scan         # run career-ops scanner
npm run verify       # check pipeline health
```
