#!/usr/bin/env bash
#
# Copies data from the legacy Rails Postgres database into the Supabase project
# behind api/. The Supabase schema is a direct port of the Rails schema, so this
# is a data-only load: no table or column renaming is involved.
#
# What it does NOT copy:
#   - `users`: Devise's bcrypt hashes are not usable by Supabase Auth. The rows
#     are still loaded (so `people.user_id` can be backfilled by email), but each
#     person has to be invited through Supabase Auth to set a password. Run
#     scripts/invite_users.mjs afterwards.
#   - `good_jobs*` / `active_storage_*`: job queue state and Rails file
#     attachments; storage is being moved to Supabase Storage separately.
#
# Usage:
#   RAILS_DATABASE_URL=postgres://...            # source, read-only is enough
#   SUPABASE_DB_URL=postgresql://postgres...     # target
#   ./scripts/import_from_rails.sh [--dry-run]
#
set -euo pipefail

: "${RAILS_DATABASE_URL:?set RAILS_DATABASE_URL to the legacy Rails database}"
: "${SUPABASE_DB_URL:?set SUPABASE_DB_URL to the target Supabase database}"

DUMP_DIR="${DUMP_DIR:-./tmp/rails-import}"
DUMP_FILE="$DUMP_DIR/data.sql"
mkdir -p "$DUMP_DIR"

# Load order matters only for the foreign keys the Rails schema actually
# declares; everything else is unconstrained, so a single transaction with
# triggers disabled is enough.
EXCLUDED_TABLES=(
  good_jobs
  good_job_batches
  good_job_executions
  good_job_processes
  good_job_settings
  active_storage_attachments
  active_storage_blobs
  active_storage_variant_records
  ar_internal_metadata
  schema_migrations
)

exclude_args=()
for table in "${EXCLUDED_TABLES[@]}"; do
  exclude_args+=(--exclude-table-data="public.$table" --exclude-table="public.$table")
done

echo "==> Dumping data from the Rails database"
pg_dump "$RAILS_DATABASE_URL" \
  --data-only \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  --schema=public \
  "${exclude_args[@]}" \
  --file "$DUMP_FILE"

echo "==> Dump written to $DUMP_FILE ($(du -h "$DUMP_FILE" | cut -f1))"

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "==> Dry run: not loading into Supabase"
  exit 0
fi

echo "==> Loading into Supabase (single transaction)"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 --single-transaction -f "$DUMP_FILE"

echo "==> Resetting sequences to the max id of each table"
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE
  r record;
  seq text;
BEGIN
  FOR r IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    seq := pg_get_serial_sequence('public.' || quote_ident(r.table_name), 'id');
    CONTINUE WHEN seq IS NULL;
    EXECUTE format(
      'SELECT setval(%L, COALESCE((SELECT MAX(id) FROM %I), 1))',
      seq, r.table_name
    );
  END LOOP;
END $$;
SQL

echo "==> Row counts after load"
psql "$SUPABASE_DB_URL" -c "
  SELECT 'people' AS table, count(*) FROM people
  UNION ALL SELECT 'schools', count(*) FROM schools
  UNION ALL SELECT 'school_relationships', count(*) FROM school_relationships
  UNION ALL SELECT 'taggings', count(*) FROM taggings
  UNION ALL SELECT 'workflow_instance_workflows', count(*) FROM workflow_instance_workflows
  ORDER BY 1;
"

echo "==> Done. Next: node --env-file=api/.env.local scripts/invite_users.mjs"
