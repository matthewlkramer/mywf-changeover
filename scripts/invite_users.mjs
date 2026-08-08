/**
 * Creates Supabase Auth users for the legacy Rails `users` rows and links each
 * one to its `people` row via `people.user_id`, plus carries over `is_admin`.
 *
 * Devise password hashes are not portable, so accounts are created without a
 * password: pass --invite to send Supabase invite emails, or leave it off and
 * have people use password reset.
 *
 * Usage:
 *   node --env-file=api/.env.local scripts/invite_users.mjs [--invite] [--limit N]
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const invite = process.argv.includes("--invite");
const limitFlag = process.argv.indexOf("--limit");
const limit = limitFlag === -1 ? null : Number(process.argv[limitFlag + 1]);

const db = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Existing auth users, keyed by email, so the script is re-runnable. */
async function existingAuthUsers() {
  const byEmail = new Map();
  for (let page = 1; ; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const user of data.users) {
      if (user.email) byEmail.set(user.email.toLowerCase(), user.id);
    }
    if (data.users.length < 1000) break;
  }
  return byEmail;
}

let query = db
  .from("users")
  .select("email, person_id, is_admin")
  .is("deleted_at", null)
  .order("email");
if (limit) query = query.limit(limit);

const { data: legacyUsers, error: usersError } = await query;
if (usersError) throw usersError;

const authUsers = await existingAuthUsers();
let created = 0;
let linked = 0;
const failures = [];

for (const legacy of legacyUsers ?? []) {
  const email = legacy.email?.trim().toLowerCase();
  if (!email) continue;

  let userId = authUsers.get(email);
  if (!userId) {
    const { data, error } = invite
      ? await db.auth.admin.inviteUserByEmail(email)
      : await db.auth.admin.createUser({ email, email_confirm: false });
    if (error) {
      failures.push(`${email}: ${error.message}`);
      continue;
    }
    userId = data.user.id;
    created += 1;
  }

  // Rails `users.person_id` referenced people.id, which the data import preserves.
  const { error: linkError } = await db
    .from("people")
    .update({ user_id: userId, is_admin: legacy.is_admin ?? false })
    .eq("id", legacy.person_id);
  if (linkError) {
    failures.push(`${email}: ${linkError.message}`);
    continue;
  }
  linked += 1;
}

console.log(`auth users created: ${created}, people linked: ${linked}`);
if (failures.length > 0) {
  console.log(`failures (${failures.length}):`);
  for (const failure of failures) console.log(`  ${failure}`);
  process.exitCode = 1;
}
