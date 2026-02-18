# MatchNearby API

FastAPI backend for the MatchNearby mobile app. Fetches football fixture data from API-Football, transforms it to match the frontend contract, caches it in Supabase, and serves clean JSON.

## Architecture

```
React Native App (Lovable)
       │
       │  GET /api/matches?date=2026-03-15&filter=league
       ▼
┌──────────────────────────────┐
│  FastAPI (this project)      │
│  Validates → checks DB →     │
│  syncs if stale → responds   │
└──────┬───────────────┬───────┘
       │               │
       ▼               ▼
  Supabase         API-Football
  (cache + DB)     (source of truth)
```

The frontend never calls API-Football directly. The backend handles authentication, caching, and data transformation.

## Quick Start

```bash
cd matchnearby-api
python -m venv .venv
source .venv/bin/activate          # macOS/Linux
pip install -r requirements.txt
cp .env.example .env               # then fill in your keys
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** for interactive API documentation.

## Before First Run

1. Sign up at [api-football.com](https://www.api-football.com/) and get your API key
2. Create a Supabase project at [supabase.com](https://supabase.com)
3. Run `supabase_schema.sql` in Supabase Dashboard → SQL Editor
4. Copy your Supabase URL + service_role key into `.env`

## Endpoints

| Method | Path            | Description                        |
|--------|-----------------|------------------------------------|
| GET    | `/api/matches`  | Matches by date or upcoming        |
| GET    | `/api/filters`  | Available filter options (SDUI)    |
| GET    | `/api/sorts`    | Available sort options (SDUI)      |
| GET    | `/health`       | Health check for hosting platform  |

## Deploy to Railway

1. Push to GitHub
2. Connect the repo in Railway
3. Add environment variables in the Railway dashboard
4. Railway auto-detects the Dockerfile and deploys
