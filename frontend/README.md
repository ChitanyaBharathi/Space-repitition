# MindForge Frontend (React 18 + Vite)

Standalone SPA frontend for MindForge Spaced Repetition Card Battler.

## Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase public anon key
- `VITE_API_URL`: Backend FastAPI HTTPS API URL (e.g. `https://your-backend.vercel.app`)

## Local Setup & Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run Vite development server:
   ```bash
   npm run dev
   ```
3. Run unit tests:
   ```bash
   npm run test
   ```
4. Run production build check:
   ```bash
   npm run build
   ```

## Vercel Deployment Instructions
Deploy `frontend/` as an independent Vercel project:
1. Create a new project in Vercel.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Set **Build Command** to `npm run build` and **Output Directory** to `dist`.
5. Configure Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`.
6. Deploy. The `vercel.json` rewrites ensure SPA routing works seamlessly.
