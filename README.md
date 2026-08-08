# mywf-changeover

Working repo for moving the My Wildflower platform off Rails/Heroku and onto TypeScript +
Supabase + Vercel. It holds the frontend, the new backend, and the legacy backend side by side so
the port can proceed incrementally.

| Directory | What it is | Origin |
| --- | --- | --- |
| `api/` | New backend: Next.js route handlers on Supabase, reimplementing the Rails `/v1` JSON API. Deployed. | written for this changeover |
| `web/` | Existing frontend (Next.js 14, MUI, SWR). Unchanged; already JS, already deploys on Vercel. | [keithtom/wildflower-journey-ui](https://github.com/keithtom/wildflower-journey-ui) |
| `legacy/rails-api/` | The Rails 7 API being replaced. Reference only — not deployed from here. | [matthewlkramer/wildflower-platform](https://github.com/matthewlkramer/wildflower-platform) |

## How the pieces connect

`web/` reads its backend origin from `API_URL` and calls paths like `/v1/people`, so pointing it at
the new backend is a config change:

```
API_URL=https://wildflower-platform-next.vercel.app/api
```

## Backend port status

Done: schema (31 domain tables), auth, people, schools, search, tag lists, JSON:API serialization.
See `api/README.md` for the Rails-to-TypeScript mapping.

Remaining: workflow engine (`workflow_definition_*` / `workflow_instance_*`), advice/decisions, SSJ
endpoints, documents + file storage, Airtable sync, and Slack notification jobs. Each has its Rails
source under `legacy/rails-api/app/` to port from.

## Running locally

```bash
# backend on :3000
cd api && npm install && cp .env.example .env.local && npm run dev

# frontend on :3001, pointed at the backend above
cd web && yarn install && API_URL=http://localhost:3000/api yarn dev -p 3001
```
