# Synergy: the repository

- Repository: https://github.com/Zidarc/SynergyIBA
- GitHub description: A real-time simulated coin trading dashboard consisting of a static frontend (HTML/CSS/JS), Netlify serverless functions, and Supabase (Postgres) as the backend
- Main language: JavaScript
- Last pushed: 2025-11-16

## README

# Synergy IBA — Coin Trading Dashboard

A real-time simulated coin trading dashboard consisting of a static frontend (HTML/CSS/JS), Netlify serverless functions, and Supabase (Postgres) as the backend. This README expands on setup, architecture, API, data model, deployment, and troubleshooting.

## Table of contents
- Project overview
- Key features
- Online Links
- Architecture & flow
- Repository layout (important files)
- Local setup (Windows)
- Environment variables
- Running & development
- API endpoints (examples)
- Supabase data model (schema)
- Security & best practices
- Deployment (Netlify)
- Testing & maintenance
- Troubleshooting

## Project overview
This project simulates a trading environment where:
- A MasterCoins row holds canonical coin prices and percent changes.
- Teams (users) hold coin quantities and free money.
- Serverless functions read/update Supabase and recalculate team worth and leaderboard.

## Key features
- Dashboard showing master prices, percent change, and per-team holdings.
- Buy/sell transactions via serverless endpoint.
- Periodic MasterCoins updates that propagate to team valuations.
- Leaderboard (total_worth) recalculation routine.

## Online Links

## User Trading Panel
https://synergy-iba.netlify.app/

**Credentials**
- Team Name: `TestUsers`
- Password: `TestUser`
You can trade here and check realtime updates.

## Admin Update Panel
https://adminpagesynergy.netlify.app/
Enter test values here to trigger realtime stock updates visible on the user panel.

## Architecture & flow
1. Frontend (static files in src/) fetches data from Netlify functions.
2. Netlify functions (functions/*.js) use SUPABASE_URL and SUPABASE_KEY to read/write Supabase.
3. Supabase stores MasterCoins and team rows in a `userdata` table.
4. A separate function recalculates `total_worth` for leaderboard updates.

## Repository layout (most relevant files)
- src/
  - index.html, user.html, dummy.html
  - js/
    - teamdata.js (set/get team key)
    - login.js (signIn)
    - user.js (main UI logic: readdata, master price handling)
    - dummy.js (demo/testing)
  - css/
    - index.css, user.css
- functions/
  - read.js — read team row
  - update.js — handle buy/sell updates (uses Decimal.js)
  - mainfunction.js — update MasterCoins / propagate changes
  - totalworth.js — recalc and persist teams' total_worth
- netlify.toml — Netlify settings
- package.json — build scripts & deps
- .gitignore
- Readme.md — this file

## Local setup (Windows)
Prerequisites:
- Node.js (16+ recommended)
- npm
- (Optional) Netlify CLI for local function testing: npm i -g netlify-cli

Steps:
1. Clone repo:
   - git clone 
2. Install dependencies:
   - npm install
3. Create `.env` in repo root (ignored by git) with:
   - SUPABASE_URL=
   - SUPABASE_KEY=
4. Start frontend (Parcel):
   - npx parcel build src/*.html --no-scope-hoist
5. (Optional) Run Netlify dev to test functions locally:
   - netlify dev
   Netlify will pick up netlify.toml and functions/ directory.

## Environment variables
- SUPABASE_URL — your Supabase project URL
- SUPABASE_KEY — service_role key (server-side functions) or anon key for client

Add these to:
- Local `.env` for development (functions read process.env)
- Netlify Dashboard > Site settings > Build & deploy > Environment > Environment variables for production

## Running & development notes
- Build command (from package.json): npm run build
- For frontend live-reload: npx parcel src/user.html
- For serverless function debugging: netlify dev
- Browser localStorage is used to store team key (team auth is minimal).

## API endpoints (Netlify functions) — examples
Endpoints accept GET query parameters as implemented in functions/*.js. Examples assume local netlify dev or deployed site.

1. Read team:
   - GET /.netlify/functions/read?teamkey=TEAM_KEY
   - cURL:
     - curl "http://localhost:8888/.netlify/functions/read?teamkey=TEAMKEY123"

2. Update (buy/sell):
   - GET /.netlify/functions/update?cointype=BTC&teamId=&transactiontype=buy&coinval=10
   - cURL:
     - curl "http://localhost:8888/.netlify/functions/update?cointype=BTC&teamId=3&transactiontype=sell&coinval=5"

3. Master update / bulk:
   - GET /.netlify/functions/mainfunction?changes=
   - See functions/mainfunction.js for expected payload/format.

4. Recalculate total worth:
   - GET /.netlify/functions/totalworth

Note: Endpoints and query parameter names are defined in the function files. Validate exact key names and accepted values there.

## Supabase data model (userdata table)
Primary table: userdata
- Team_password (text) — used as team key / login token
- Team_name (text)
- Stock (numeric[] or text JSON) — master prices (for MasterCoins) or holdings (for teams)
- StockChange (numeric[] or text JSON) — percent changes array for MasterCoins
- free_money (numeric) — team's cash balance
- total_worth (numeric) — aggregated value of holdings + free_money
- id (primary key)
Notes:
- The functions expect arrays for Stock and StockChange. Check the exact column types in your Supabase table (text JSON vs numeric[]). Adjust functions accordingly.

## Security & best practices
- Use service_role key only in server-side functions. Never embed it in frontend JS.
- Validate and sanitize all inputs in functions/update.js to prevent invalid transactions.

## Deployment (Netlify)
1. Create a Netlify site connected to this repo.
2. In Netlify UI, set environment variables SUPABASE_URL and SUPABASE_KEY.
3. Build command: npm run build
4. Publish directory: dist (or as configured by your bundler)
5. Verify functions deployed (Netlify Functions tab) and test endpoints.

## Testing & maintenance
- Add unit tests for financial arithmetic (use Decimal.js where precision matters).

## Troubleshooting
- 401/403 from Supabase: ensure SUPABASE_KEY is valid for the attempted operation.
- Function errors: check Netlify function logs or netlify dev output in terminal.
- Incorrect arrays: verify Stock and StockChange values types stored i

(README cut short here)
