# CHEMLAB — Base44 Dev Environment

## Stack
- Vite 8 + React 19 + TypeScript (frontend only, no backend server)
- Supabase for auth/profiles/classrooms (external — credentials required for those features)

## Running
```
docker compose -f docker-compose.base44.yml up -d
```
- Vite dev server on internal port 5173, mapped to host port 3000.
- Source is bind-mounted; edits hot-reload without rebuild.
- `npm install` runs on every container start (lockfile-preserving).

## Environment / Secrets
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are **required at boot** — `src/lib/supabase.ts` throws without them.
- `.env.base44-defaults` holds placeholder values so the app boots; real values in `/run/base44/app.env` override them.
- The lab page (`/`) works without valid Supabase credentials. Auth, onboarding, teacher/student dashboards, and classroom features require real Supabase credentials + the migration in `supabase/migrations/`.

## Supabase Migration
- `supabase/migrations/20261002000000_quiz_activity_schema.sql` defines the `profiles` table and quiz/classroom schema. Apply it in the Supabase dashboard for auth/profile features to work.

## Verification
- `curl http://localhost:3000/` returns the Vite-served HTML with `/src/main.tsx`.
- Healthcheck: node fetch to `http://localhost:5173/`.
