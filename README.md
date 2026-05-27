# Financial Goals Tracker

Production-ready full-stack app for creating and tracking financial goals with analytics and forecasting.

## Stack
- React + Vite frontend
- Node.js + Express API
- SQLite (better-sqlite3) persistent storage
- Recharts for data visualizations

## Features
- CRUD goals with validation
- Deposit/withdrawal transaction logging per goal
- Dashboard with progress bars and achievement celebration
- Analytics: trend charts, contribution history, actual vs planned trajectory
- Summary metrics: total saved, average monthly contribution, completion rate
- Prediction engine: projected completion date, what-if simulator, behind-pace alerts, confidence score

## Run locally
```bash
npm install
npm run dev
```
- Frontend: http://localhost:5173
- API: http://localhost:4000

## Build & start
```bash
npm run build
npm run start
```

## Project structure
- `client/` React app
- `server/` Express API and SQLite DB (`server/data.db`)
