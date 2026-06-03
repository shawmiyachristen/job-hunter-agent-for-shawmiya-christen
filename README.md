# Job Hunter Agent for Shawmiya Christen 🚀

An autonomous, scheduled AI-powered job search agent and visual dashboard. It runs 4 times per day in the background, crawls job listings from major platforms, parses your PDF/Word CV, performs deep compatibility analysis using Gemini AI, generates tailored cover letters, and suggests CV enhancements.

Presented in a premium dark glassmorphism dashboard.

---

## Key Features

1. **CV Multi-Format Parser**: Extracts raw text from PDF (`pdf-parse`) and Word `.docx` (`mammoth`) uploads.
2. **AI-Driven Profile Extraction**: Uses Gemini 2.5 Flash to automatically index and structure your resume text into technical skills, soft skills, tools, and a summary.
3. **Structured Compatibility Scoring**: Rates crawled job listings on a strict scale of 1 to 10 based on skill overlaps.
4. **Skill Gap Analytics**: Pinpoints overlapping skills and identifies missing skill requirements.
5. **Auto-Generated Cover Letters**: Creates personalized, context-aware cover letters matching the job's posting language (English/French).
6. **Custom CV Enhancements**: Yields action items to optimize your resume specifically for each individual role.
7. **Scheduled Agent Runs**: Runs automatically 4 times per day (every 6 hours) via `node-cron` locally or native Vercel Cron webhooks.
8. **Premium Dark Glassmorphism Dashboard**: Sleek interface featuring ambient neon animations, real-time developer log streaming, interactive resume uploads, and detailed matching card views.
9. **Crawler Fault-Tolerance**: Connects to 5 major job boards:
   - **Welcome to the Jungle**
   - **APEC**
   - **Indeed**
   - **JobTeaser**
   - **Cadremploi**
   *Includes intelligent mock fallbacks to guarantee uptime if sites block requests or trigger Cloudflare captchas.*

---

## Folder Structure

```
job-hunter-agent/
├── data/                  # Local JSON DB storage (gitignored)
│   └── db.json
├── public/                # SPA Static Frontend Assets
│   ├── css/
│   │   └── styles.css     # Premium Glassmorphic Styling
│   ├── js/
│   │   └── app.js         # Frontend controller and API fetchers
│   └── index.html         # Main dashboard layout
├── src/                   # Backend Application Source
│   ├── config/
│   ├── controllers/
│   ├── models/
│   │   └── db.js          # File-based JSON Database (or ephemeral serverless fallback)
│   ├── routes/
│   │   └── api.js         # Express REST API routes
│   ├── scrapers/
│   │   ├── wttjScraper.js
│   │   ├── apecScraper.js
│   │   ├── indeedScraper.js
│   │   ├── jobteaserScraper.js
│   │   ├── cadremploiScraper.js
│   │   └── scraperManager.js # Coordinates scraper runs and triggers matching
│   └── services/
│       ├── cvParserService.js # Extracts text from docx/pdf buffers
│       ├── geminiService.js   # Interfaces with Gemini API
│       └── schedulerService.js # Runs background cron scheduler (node-cron)
├── .env                   # Configuration file (gitignored)
├── .env.example
├── package.json           # Scripts and package manifests
├── vercel.json            # Vercel Serverless Routing & Cron Webhook rules
├── test-runner.js         # Suite for verifying core backend systems
└── server.js              # Application entrypoint
```

---

## Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Gemini API Key (obtained from [Google AI Studio](https://aistudio.google.com/))

### Installation
1. Clone or open the repository files.
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Edit the `.env` file and insert your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   PORT=3000
   ```
   *Note: If no API key is specified, the application will automatically enter "Demo Mode" with simulated matches so you can still test the interface.*

### Running the App
- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
- Access the web dashboard at **`http://localhost:3000`** in your browser.

### Verifying Code (Tests)
To execute the automated verification test suite checking database, parsers, Gemini APIs, and scraping schemas:
```bash
npm test
```

---

## Scheduled Job Hunting Timing

- **Local / VPS Environment**:
  The application starts a background scheduler using `node-cron` immediately on boot. By default, it runs **4 times per day** (every 6 hours) at the pattern `0 */6 * * *` to fetch new listings throughout the day. You can customize this local schedule inside the dashboard's "Settings" tab.
- **Serverless / Vercel Environment (Hobby vs Pro)**:
  Background cron processes cannot run persistently inside serverless container architectures. Instead, the backend exposes a secure GET endpoint at `/api/cron`.
  - **Vercel Hobby Plan (Demo)**: Configured for **1 run per day** (`0 6 * * *`) due to the Vercel Hobby free tier limits (which enforce a maximum of daily cron executions).
  - **Vercel Pro Plan**: You can upgrade the schedule to **4 runs per day** (`0 6,12,18,0 * * *`) to match the local schedule.

---

## Deployment Guide

### Vercel Deployment

This project is configured out-of-the-box for serverless deployment on [Vercel](https://vercel.com).

1. **Vercel Config (`vercel.json`)**:
   Enforces routing rules sending all requests to `server.js` (managed by `@vercel/node`) and configures Vercel Cron (once per day for Hobby tier):
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "server.js" }
     ],
     "crons": [
       {
         "path": "/api/cron?secret=YOUR_CRON_SECRET",
         "schedule": "0 6 * * *"
       }
     ]
   }
   ```
2. **Environment Variables**:
   Configure these in your Vercel Dashboard project settings:
   - `GEMINI_API_KEY`: Your Google Gen AI Key.
   - `CRON_SECRET`: A secure random token of your choice.
   - `EPHEMERAL_DB`: Set to `true` (forces in-memory database fallback to avoid read-only filesystem issues).
3. **Database Persistence**:
   Since serverless functions are ephemeral, local `db.json` files are cleared when instances spin down. If you need permanent persistence on Vercel:
   - The application supports in-memory caching for standard usage.
   - For complete persistent records, you can expand `src/models/db.js` to read/write from a remote database (e.g. Supabase, MongoDB, or Vercel KV) using the configuration hooks provided.

### GitHub Actions Deployment

To automate deployments or code quality checks:

1. Create a GitHub Actions workflow in `.github/workflows/deploy.yml`:
   ```yaml
   name: CI/CD Pipeline

   on:
     push:
       branches: [ main, master ]
     pull_request:
       branches: [ main, master ]

   jobs:
     verify:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Set up Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         - name: Install dependencies
           run: npm install
         - name: Run verification test suite
           run: npm test

     deploy-vercel:
       needs: verify
       if: github.event_name == 'push'
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v20
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             working-directory: ./
             vercel-args: '--prod'
   ```
2. Define the secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) inside your GitHub repository settings under "Secrets and Variables > Actions".
