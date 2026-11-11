# BlackBook — Sakura Edition

AI-powered personal knowledge system built with React 18, TypeScript, Vite, Tailwind CSS, Three.js, and Supabase.

## Local Development

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Runs offline in Guest Mode (browser `localStorage`) even without `.env`.

## Environment Variables

Configure in `.env` (local) or Vercel Project Settings:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public `anon` key

Set the Gemini API key on Supabase Edge Functions (never in frontend `.env`):

```bash
supabase secrets set GEMINI_API_KEY=your-google-gemini-api-key
```

## Build & Verify

```bash
pnpm typecheck
pnpm test
pnpm build
```
