# Backend recovery for remixed projects

If you remix this project and the automatic backend copy fails (or only partially succeeds), run **`scripts/setup-backend.mjs`** in the remixed project to recreate the database schema and redeploy every edge function.

## When to use this

Only after a remix where the new project has missing tables, missing functions, or runtime errors that look like "relation does not exist" or "function not found". A normal successful remix does NOT need this script.

## What it does

1. Applies every SQL file in `supabase/migrations/` to the **new** project's database, in order. Already-applied migrations are skipped, so the script is safe to re-run.
2. Deploys every edge function under `supabase/functions/*` to the new project.
3. Prints a checklist of secrets you still need to add or reconnect manually.

## What it does NOT do

- Does not copy row data (tables are recreated empty, same as a normal remix).
- Does not copy storage objects.
- Does not configure auth providers or email templates.
- Does not recreate Lovable-managed secrets (`SUPABASE_*`, `LOVABLE_API_KEY`). Those are auto-provisioned by Lovable Cloud.
- Does not reconfigure connectors (Google Maps, etc.). Reconnect those from the Connectors panel.

## Prerequisites

- Node.js 18 or newer.
- PostgreSQL client tools (`psql`) installed and on your PATH.
- The Supabase CLI is invoked automatically via `npx`, so no separate install is needed.
- Three values from the **remixed** (target) project:
  - `SUPABASE_DB_URL` - the Postgres connection string for the new project.
  - `SUPABASE_PROJECT_REF` - the new project's id.
  - `SUPABASE_ACCESS_TOKEN` - a Supabase access token (`sbp_...`) with rights on the new project.

Lovable Cloud users: ask Lovable Support for these values if they are not visible in your project settings. The Lovable Cloud UI does not expose the service role key or DB password directly.

## Run it

From the remixed project root:

```bash
SUPABASE_DB_URL='postgresql://...' \
SUPABASE_PROJECT_REF='xxxxxxxxxxxxxx' \
SUPABASE_ACCESS_TOKEN='sbp_...' \
node scripts/setup-backend.mjs
```

Or just run it with no env vars and it will prompt for each value:

```bash
node scripts/setup-backend.mjs
```

If a migration fails, fix the cause and re-run. Migrations that already applied will be skipped automatically.

## Troubleshooting

- **`psql: command not found`** - install PostgreSQL client tools (`brew install libpq` on macOS, `apt-get install postgresql-client` on Debian/Ubuntu).
- **Edge function deploy fails with 401** - the access token is wrong or lacks permission on the target project.
- **Migration fails with permission error** - the DB URL is for a read-only role. Use the connection string that includes the database password for the postgres user.
