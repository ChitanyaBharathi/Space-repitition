# MindForge Backend (FastAPI + Python)

Standalone Python FastAPI REST API service for MindForge Spaced Repetition Card Battler.

## Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anon key
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins (e.g. `http://localhost:5173,https://your-frontend.vercel.app`)

## Local Setup & Development
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
3. Run unit tests:
   ```bash
   pytest tests
   ```

## Vercel Deployment Instructions
Deploy `backend/` as an independent Vercel project:
1. Create a new project in Vercel.
2. Set **Root Directory** to `backend`.
3. Set **Framework Preset** to `Other`.
4. Configure Environment Variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ALLOWED_ORIGINS`.
5. Deploy. The entrypoint `api/index.py` handles all serverless API requests.
