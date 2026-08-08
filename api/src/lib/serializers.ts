import { Attributes, Resource, camelizeKeys } from "@/lib/jsonapi";
import { TagLists } from "@/lib/tags";

export type PersonRow = {
  id: number;
  external_identifier: string;
  [column: string]: unknown;
};

export type SchoolRow = PersonRow;

const PERSON_ATTRIBUTES = [
  "email",
  "first_name",
  "middle_name",
  "last_name",
  "phone",
  "journey_state",
  "preferred_language",
  "personal_email",
  "about",
  "primary_language",
  "primary_language_other",
  "updated_at",
  "race_ethnicity_other",
  "lgbtqia",
  "gender",
  "gender_other",
  "pronouns",
  "pronouns_other",
  "household_income",
  "montessori_certified",
  "montessori_certified_year",
  "start_date",
  "end_date",
  "active",
  "is_onboarded",
  "image_url",
] as const;

const SCHOOL_ATTRIBUTES = [
  "name",
  "short_name",
  "website",
  "phone",
  "email",
  "governance_type",
  "calendar",
  "max_enrollment",
  "facebook",
  "instagram",
  "status",
  "timezone",
  "domain",
  "hero_image_url",
  "hero_image2_url",
  "logo_url",
  "about",
  "about_es",
  "affiliation_date",
  "affiliated",
  "closed_on",
  "num_classrooms",
  "charter_string",
  "opened_on",
  "updated_at",
  "expected_start_date",
  "facility_type",
  "directory_visible",
] as const;

function pick(row: PersonRow, columns: readonly string[]): Attributes {
  const out: Attributes = {};
  for (const column of columns) out[column] = row[column] ?? null;
  return out;
}

/** Rails exposed these tag contexts as `<name>List` attributes. */
const PERSON_TAG_ATTRIBUTES: Record<string, string> = {
  roles: "role_list",
  race_ethnicity: "race_ethnicity_list",
  montessori_certified_levels: "montessori_certified_level_list",
  classroom_age: "classroom_age_list",
};

const SCHOOL_TAG_ATTRIBUTES: Record<string, string> = {
  tuition_assistance_types: "tuition_assistance_type_list",
  ages_served: "ages_served_list",
};

function tagAttributes(
  mapping: Record<string, string>,
  lists: TagLists | undefined,
): Attributes {
  const out: Attributes = {};
  for (const [context, attribute] of Object.entries(mapping)) {
    out[attribute] = lists?.[context] ?? [];
  }
  return out;
}

export function serializePerson(row: PersonRow, tags?: TagLists): Resource {
  return {
    id: row.external_identifier,
    type: "person",
    attributes: camelizeKeys({
      ...pick(row, PERSON_ATTRIBUTES),
      ...tagAttributes(PERSON_TAG_ATTRIBUTES, tags),
    }),
  };
}

/** Equivalent of `V1::PersonBasicSerializer` (the `lightweight`/`etl` variants). */
export function serializePersonBasic(row: PersonRow): Resource {
  return {
    id: row.external_identifier,
    type: "person",
    attributes: camelizeKeys({
      ...pick(row, ["first_name", "last_name", "email", "image_url", "active"]),
    }),
  };
}

export function serializeSchool(row: SchoolRow, tags?: TagLists): Resource {
  return {
    id: row.external_identifier,
    type: "school",
    attributes: camelizeKeys({
      ...pick(row, SCHOOL_ATTRIBUTES),
      ...tagAttributes(SCHOOL_TAG_ATTRIBUTES, tags),
    }),
  };
}

export function serializeSchoolName(row: SchoolRow): Resource {
  return {
    id: row.external_identifier,
    type: "school",
    attributes: { name: row.name ?? null },
  };
}
