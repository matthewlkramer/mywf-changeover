/**
 * Seeds a Supabase project with an admin auth user, its linked `people` row, and
 * a couple of demo schools so the API can be exercised end to end.
 *
 * Usage: SEED_EMAIL=... SEED_PASSWORD=... node --env-file=.env.local scripts/seed.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_EMAIL;
const password = process.env.SEED_PASSWORD;

if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}
if (!email || !password) {
  throw new Error("SEED_EMAIL and SEED_PASSWORD are required");
}

const db = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: created, error: createError } = await db.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

let userId = created?.user?.id;
if (createError) {
  if (!/already/i.test(createError.message)) throw createError;
  const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
  userId = list.users.find((user) => user.email === email)?.id;
  if (!userId) throw new Error(`Could not find existing auth user ${email}`);
}

const { data: person, error: personError } = await db
  .from("people")
  .upsert(
    {
      email,
      first_name: "Seed",
      last_name: "Admin",
      user_id: userId,
      is_admin: true,
      active: true,
    },
    { onConflict: "email" },
  )
  .select("id, external_identifier")
  .single();
if (personError) throw personError;

const { error: schoolsError } = await db.from("schools").upsert(
  [
    {
      name: "Demo Wildflower School",
      short_name: "Demo",
      status: "Open",
      governance_type: "Independent",
      directory_visible: true,
      airtable_id: "seed-demo-1",
    },
    {
      name: "Second Demo School",
      short_name: "Demo 2",
      status: "Emerging",
      governance_type: "Charter",
      directory_visible: true,
      airtable_id: "seed-demo-2",
    },
  ],
  { onConflict: "airtable_id" },
);
if (schoolsError) throw schoolsError;

const { data: tag, error: tagError } = await db
  .from("tags")
  .upsert({ name: "Ops Guide" }, { onConflict: "name" })
  .select("id")
  .single();
if (tagError) throw tagError;

const { count: existingTaggings } = await db
  .from("taggings")
  .select("id", { count: "exact", head: true })
  .eq("tag_id", tag.id)
  .eq("taggable_type", "Person")
  .eq("taggable_id", person.id)
  .eq("context", "roles");

if (!existingTaggings) {
  const { error: taggingError } = await db.from("taggings").insert({
    tag_id: tag.id,
    taggable_type: "Person",
    taggable_id: person.id,
    context: "roles",
  });
  if (taggingError) throw taggingError;
}

console.log(`Seeded admin ${email} (person ${person.external_identifier}) and 2 demo schools`);
