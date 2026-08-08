import { z } from "zod";
import { ApiError } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase";

const schoolParams = z
  .object({
    name: z.string().optional(),
    short_name: z.string().optional(),
    website: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    governance_type: z.string().optional(),
    calendar: z.string().optional(),
    max_enrollment: z.number().int().optional(),
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    status: z.string().optional(),
    timezone: z.string().optional(),
    domain: z.string().optional(),
    about: z.string().optional(),
    about_es: z.string().optional(),
    affiliated: z.boolean().optional(),
    affiliation_date: z.string().optional(),
    opened_on: z.string().optional(),
    closed_on: z.string().optional(),
    expected_start_date: z.string().optional(),
    num_classrooms: z.number().int().optional(),
    facility_type: z.string().optional(),
    directory_visible: z.boolean().optional(),
    ages_served_list: z.array(z.string()).optional(),
    tuition_assistance_type_list: z.array(z.string()).optional(),
  })
  .strict();

export type SchoolParams = z.infer<typeof schoolParams>;

const TAG_LIST_CONTEXTS: Record<string, string> = {
  ages_served_list: "ages_served",
  tuition_assistance_type_list: "tuition_assistance_types",
};

export function parseSchoolParams(body: unknown): SchoolParams {
  const wrapped = z.object({ school: schoolParams }).safeParse(body);
  if (wrapped.success) return wrapped.data.school;

  const direct = schoolParams.safeParse(body);
  if (!direct.success) {
    throw new ApiError(
      422,
      direct.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join(", "),
    );
  }
  return direct.data;
}

export function splitSchoolParams(params: SchoolParams): {
  columns: Record<string, unknown>;
  tagLists: Array<{ context: string; names: string[] }>;
} {
  const columns: Record<string, unknown> = {};
  const tagLists: Array<{ context: string; names: string[] }> = [];
  for (const [key, value] of Object.entries(params)) {
    const context = TAG_LIST_CONTEXTS[key];
    if (context) {
      tagLists.push({ context, names: (value as string[]) ?? [] });
    } else {
      columns[key] = value;
    }
  }
  return { columns, tagLists };
}

/**
 * School ids a person is related to, optionally narrowed to a relationship role
 * (Rails filtered `SchoolRelationship` by tag; the role is stored on `kind`).
 */
export async function schoolIdsForPerson(
  personExternalId: string,
  role: string | null,
): Promise<number[]> {
  const db = serviceClient();
  const { data: person, error: personError } = await db
    .from("people")
    .select("id")
    .eq("external_identifier", personExternalId)
    .maybeSingle();
  if (personError) throw new Error(personError.message);
  if (!person) return [];

  let query = db
    .from("school_relationships")
    .select("school_id")
    .eq("person_id", person.id)
    .is("deleted_at", null);
  if (role) query = query.eq("kind", role);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => (row as { school_id: number }).school_id);
}
