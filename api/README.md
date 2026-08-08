# wildflower-platform-next

TypeScript/Supabase reimplementation of the Rails
[wildflower-platform](https://github.com/matthewlkramer/wildflower-platform) API, deployable on
Vercel. The existing [wildflower-journey-ui](https://github.com/keithtom/wildflower-journey-ui)
frontend can point at it by setting `API_URL` to this app's origin plus `/api`.

## Status

Scaffold. Ported so far:

| Rails | Here |
| --- | --- |
| `db/schema.rb` (31 domain tables) | `supabase/migrations/0001_init_from_rails_schema.sql` |
| Devise + `users` table | Supabase Auth; `people.user_id` links to `auth.users` |
| `POST /login` | `src/app/api/login/route.ts` |
| `V1::PeopleController` | `src/app/api/v1/people/**` |
| `V1::SchoolsController` | `src/app/api/v1/schools/**` |
| `V1::SearchController` (Searchkick) | `src/app/api/v1/search/route.ts` (Postgres `ilike`) |
| `acts-as-taggable-on` | `src/lib/tags.ts` |
| `jsonapi-serializer` (camelLower, `external_identifier` as id) | `src/lib/jsonapi.ts`, `src/lib/serializers.ts` |

Not yet ported: the workflow engine (`workflow_definition_*` / `workflow_instance_*`), advice
decisions, documents/storage, SSJ endpoints, Airtable sync, and Slack notification jobs.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in the Supabase project values
npm run dev
```

Apply migrations to a Supabase project in order:

```bash
psql "$SUPABASE_DB_URL" -1 -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init_from_rails_schema.sql
psql "$SUPABASE_DB_URL" -1 -v ON_ERROR_STOP=1 -f supabase/migrations/0002_supabase_adaptations.sql
```

`scripts/schema_convert.py` regenerates `0001` from the Rails repo's `db/schema.rb`, so the port can
be refreshed if the Rails schema changes:

```bash
python3 scripts/schema_convert.py ../wildflower-platform/db/schema.rb \
  > supabase/migrations/0001_init_from_rails_schema.sql
```

## Authorization model

Route handlers authenticate the caller's Supabase access token, resolve the matching `people` row,
and then use the service-role key for data access. RLS is enabled on every table with no policies,
so the database is unreachable except through these handlers.
