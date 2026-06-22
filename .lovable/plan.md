## Goal
Provide a one-click setup script that recreates this project's backend (database schema + edge functions) in a freshly remixed project, in case Lovable's automatic remix backend copy fails.

## What gets created

### 1. `scripts/setup-backend.mjs` (the one-click script)
A Node.js script the user runs once in the remixed project:

```
node scripts/setup-backend.mjs
```

It will:
1. Read target project credentials from env vars (`SUPABASE_DB_URL`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`) or prompt for them.
2. Apply every SQL migration in `supabase/migrations/` in order against the target database using `psql` (or `pg` npm client as fallback).
3. Deploy every edge function under `supabase/functions/*` using the Supabase CLI (`npx supabase functions deploy <name> --project-ref ...`).
4. Print a checklist of secrets the user must add manually in the remixed project (`LOVABLE_API_KEY`, `GOOGLE_MAPS_API_KEY`, etc., excluding auto-managed ones).
5. Log success/failure per step so the user can re-run safely (idempotent: migrations skip if already applied, function deploys overwrite).

### 2. `scripts/README.md`
Plain-language instructions:
- When to run it (only if automatic remix fails to copy backend)
- Prerequisites (Supabase CLI installed, access token from new Lovable Cloud project)
- How to get each value
- What it does NOT do (does not copy data rows, does not copy storage objects, does not configure auth providers)

### 3. `scripts/secrets-checklist.json`
Machine-readable list of required secrets so the script can verify them and print a clear "add these" list.

## What the script will NOT do
- Copy row data (the remixed project starts empty, same as a normal remix)
- Re-create Lovable-managed secrets (`SUPABASE_*`, `LOVABLE_API_KEY` are auto-provisioned)
- Configure connector-managed secrets (`GOOGLE_MAPS_*` must be re-connected via Connectors UI)
- Touch the original project's data

## Technical details
- Migrations are applied with `psql "$SUPABASE_DB_URL" -f <file>` in filename order; the Supabase migrations table (`supabase_migrations.schema_migrations`) is used to skip already-applied files.
- Edge functions deployed via Supabase CLI (`npx -y supabase@latest`). Functions discovered by scanning `supabase/functions/*/index.ts`.
- The script is plain `.mjs` with zero runtime dependencies beyond Node 18+ and the Supabase CLI invoked through `npx`.

## Out of scope
- Auto-running the script after remix (not possible from inside the codebase)
- Migrating storage buckets or auth users
- Recreating connector configurations
