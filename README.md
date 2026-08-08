# mywf-changeover

Working repo for moving the My Wildflower platform off Rails/Heroku and onto TypeScript +
Supabase + Vercel. It holds the frontend, the new backend, and the legacy backend side by side so
the port can proceed incrementally.

| Directory | What it is | Origin |
| --- | --- | --- |
| `api/` | New backend: Next.js route handlers on Supabase, reimplementing the Rails `/v1` JSON API. Deployed from this directory to <https://mywf-changeover.vercel.app>. | written for this changeover |
| `web/` | Existing frontend (Next.js 14, MUI, SWR). Unchanged; already JS, already deploys on Vercel. | [keithtom/wildflower-journey-ui](https://github.com/keithtom/wildflower-journey-ui) |
| `legacy/rails-api/` | The Rails 7 API being replaced. Reference only — not deployed from here. | [matthewlkramer/wildflower-platform](https://github.com/matthewlkramer/wildflower-platform) |

## How the pieces connect

`web/` reads its backend origin from `API_URL` and calls paths like `/v1/people`, so pointing it at
the new backend is a config change:

```
API_URL=https://mywf-changeover.vercel.app/api
```

Two Vercel projects build from this repo on every push to `main`:

| Project | Root directory | URL |
| --- | --- | --- |
| `mywf-changeover` | `api` | <https://mywf-changeover.vercel.app> |
| `mywf-changeover-web` | `web` | <https://mywf-changeover-web.vercel.app> |

`api/src/proxy.ts` allows browser calls from localhost, `*.vercel.app`, and the
`*.wildflowerschools.org` hosts, matching the Rails rack-cors config it replaces.

## Backend port status

Done: schema (31 domain tables), auth, people, schools, search, tag lists, JSON:API serialization.
See `api/README.md` for the Rails-to-TypeScript mapping.

Remaining: workflow engine (`workflow_definition_*` / `workflow_instance_*`), advice/decisions, SSJ
endpoints, documents + file storage, Airtable sync, and Slack notification jobs. Each has its Rails
source under `legacy/rails-api/app/` to port from.

## Importing the legacy data

`api/supabase/migrations/0001` is a direct port of the Rails schema, so switching over is a
data-only copy rather than a transformation:

```bash
RAILS_DATABASE_URL=postgres://…  # legacy DB, read-only access is enough
SUPABASE_DB_URL=postgresql://…   # target Supabase DB
./scripts/import_from_rails.sh --dry-run          # dump only, inspect first
./scripts/import_from_rails.sh --fresh           # truncate target, load, reset sequences
cd api && node --env-file=.env.local scripts/invite_users.mjs --admins-only
```

Caveats:

- Devise's bcrypt hashes are not usable by Supabase Auth, so passwords do not carry over.
  `api/scripts/invite_users.mjs` creates an Auth user per selected legacy `users` row, links it
  through `people.user_id`, and carries `is_admin`; people then set a password via invite or
  reset. Staging has ~50k user rows, so it requires an explicit `--admins-only`, `--emails`, or
  `--limit` selection rather than migrating everyone at once.
- `--fresh` is needed on any re-import: ids and `people.email` collide otherwise. It truncates
  `public` only, so existing Supabase Auth users survive and just need relinking by rerunning
  `invite_users.mjs`.
- `pg_dump` must match the source's major version (staging is PostgreSQL 15) — Ubuntu's default
  client 14 refuses to dump it.
- `good_jobs*` (queue state) and `active_storage_*` (file attachments) are skipped. Attachments
  need a separate copy into Supabase Storage once documents are ported.
- The load runs in one transaction with `session_replication_role = replica`, so a failure leaves
  the target untouched and imported timestamps are not rewritten by the `touch_updated_at`
  triggers.

## Running locally

```bash
# backend on :3000
cd api && npm install && cp .env.example .env.local && npm run dev

# frontend on :3001, pointed at the backend above
cd web && yarn install && API_URL=http://localhost:3000/api yarn dev -p 3001
```
