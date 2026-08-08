import { z } from "zod";
import { ApiError } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase";

/** Tag contexts a person's role membership is stored under (Rails `Person::OPS_GUIDE` etc). */
export const ROLE_TAGS = {
  ops_guide: "Ops Guide",
  rgl: "Regional Growth Lead",
  etl: "Emerging Teacher Leader",
} as const;

const personParams = z
  .object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    middle_name: z.string().optional(),
    email: z.string().email().optional(),
    personal_email: z.string().email().optional(),
    phone: z.string().optional(),
    about: z.string().optional(),
    primary_language: z.string().optional(),
    primary_language_other: z.string().optional(),
    preferred_language: z.string().optional(),
    race_ethnicity_other: z.string().optional(),
    lgbtqia: z.boolean().optional(),
    gender: z.string().optional(),
    gender_other: z.string().optional(),
    pronouns: z.string().optional(),
    pronouns_other: z.string().optional(),
    household_income: z.string().optional(),
    montessori_certified: z.string().optional(),
    montessori_certified_year: z.string().optional(),
    active: z.boolean().optional(),
    is_onboarded: z.boolean().optional(),
    role_list: z.array(z.string()).optional(),
    race_ethnicity_list: z.array(z.string()).optional(),
    montessori_certified_level_list: z.array(z.string()).optional(),
    classroom_age_list: z.array(z.string()).optional(),
  })
  .strict();

export type PersonParams = z.infer<typeof personParams>;

/** Rails exposed these params as acts-as-taggable-on lists rather than columns. */
const TAG_LIST_CONTEXTS: Record<string, string> = {
  role_list: "roles",
  race_ethnicity_list: "race_ethnicity",
  montessori_certified_level_list: "montessori_certified_levels",
  classroom_age_list: "classroom_age",
};

/** Accepts either `{ person: {...} }` (as the Rails API did) or a bare object. */
export function parsePersonParams(body: unknown): PersonParams {
  const wrapped = z.object({ person: personParams }).safeParse(body);
  if (wrapped.success) return wrapped.data.person;

  const direct = personParams.safeParse(body);
  if (!direct.success) {
    throw new ApiError(
      422,
      direct.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join(", "),
    );
  }
  return direct.data;
}

export function splitPersonParams(params: PersonParams): {
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

export async function personIdsTaggedWith(tagName: string): Promise<number[]> {
  const { data, error } = await serviceClient()
    .from("taggings")
    .select("taggable_id, tags!inner ( name )")
    .eq("taggable_type", "Person")
    .eq("tags.name", tagName);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => (row as { taggable_id: number }).taggable_id);
}
