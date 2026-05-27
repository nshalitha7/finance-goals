# Financial Goals Tracker

Production-ready full-stack app for creating and tracking financial goals with analytics and forecasting.

## Stack
- React + Vite frontend
- Node.js + Express API
- SQLite (better-sqlite3) persistent storage
- Recharts for data visualizations

## Required Versions
Use these versions (or compatible newer patch versions) for best results:
- **Node.js:** `>=20.0.0` (recommended: `20.20.2`)
- **npm:** `>=10` (recommended: `11.4.2`)

You can verify installed versions with:
```bash
node -v
npm -v
```

## Version Manager (nvm)
If you use `nvm`, run:
```bash
nvm use
npm install
npm run dev
```

> `nvm run dev` is **not** the right command for npm scripts. It tries to run a Node file named `dev`, which causes `MODULE_NOT_FOUND`.

## Features
- CRUD goals with validation
- Deposit/withdrawal transaction logging per goal
- Dashboard with progress bars and achievement celebration
- Analytics: trend charts, contribution history, actual vs planned trajectory
- Summary metrics: total saved, average monthly contribution, completion rate
- Prediction engine: projected completion date, what-if simulator, behind-pace alerts, confidence score

## Run Locally (Step-by-step)
1. **Clone and enter the project**
   ```bash
   git clone <your-repo-url>
   cd finance-goals
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start backend + frontend in development mode**
   ```bash
   npm run dev
   ```
4. **Open the app**
   - Frontend: `http://localhost:5173`
   - API: `http://localhost:4000`

## Production Build & Run
1. Build frontend assets:
```bash
npm run build
```
2. Start API server:
```bash
npm run start
```

## Data Persistence
- Goals and transactions are stored in a local SQLite database at:
  - `server/data.db`
- Data persists across page refreshes and server restarts.

## Project Structure
- `client/` React app
- `server/` Express API and SQLite DB (`server/data.db`)
