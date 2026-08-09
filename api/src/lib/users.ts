import { Resource, camelizeKeys } from "@/lib/jsonapi";
import { ROLE_TAGS } from "@/lib/people";
import { serviceClient } from "@/lib/supabase";
import { tagListsFor } from "@/lib/tags";

/**
 * Builds the document `V1::UserSerializer` produced, which the frontend relies
 * on at login and on every `/v1/users/:id` refresh: it reads the person id out
 * of `relationships`, then the person's role list, onboarding flag and `isOg?`
 * out of `included`. Anything missing there makes the UI throw mid-login.
 */
export type UserDocument = {
  data: Resource & { relationships: Record<string, unknown> };
  included: Resource[];
};

type PersonRow = {
  id: number;
  external_identifier: string;
  email: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  phone: string | null;
  image_url: string | null;
  updated_at: string | null;
  is_onboarded: boolean | null;
  preferred_language: string | null;
  active: boolean | null;
  end_date: string | null;
  affiliated_at: string | null;
  is_admin: boolean | null;
};

type SchoolRelationshipRow = {
  id: number;
  school_id: number | null;
  start_date: string | null;
  end_date: string | null;
};

type SchoolRow = {
  id: number;
  external_identifier: string;
  name: string | null;
  status: string | null;
  affiliated: boolean | null;
};

type AddressRow = {
  external_identifier: string;
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
};

const VISIBLE_SCHOOL_STATUSES = ["Open", "Emerging"];

export async function userDocument(
  userId: string,
  email: string | null,
): Promise<UserDocument> {
  const db = serviceClient();

  const { data: person } = await db
    .from("people")
    .select(
      "id, external_identifier, email, first_name, middle_name, last_name, phone, image_url, updated_at, is_onboarded, preferred_language, active, end_date, affiliated_at, is_admin",
    )
    .eq("user_id", userId)
    .maybeSingle<PersonRow>();

  const data: Resource & { relationships: Record<string, unknown> } = {
    id: person?.external_identifier ?? userId,
    type: "user",
    attributes: {
      email: person?.email ?? email,
      firstName: person?.first_name ?? null,
      lastName: person?.last_name ?? null,
      isAdmin: person?.is_admin ?? false,
      hasPassword: true,
      imageUrl: person?.image_url ?? null,
      // The SSJ workflow tables are not ported yet, and the UI treats a missing
      // `ssj` as "this user is not in a start-up journey".
      ssj: null,
      schools: [],
    },
    relationships: { person: { data: null } },
  };

  if (!person) return { data, included: [] };

  const [tagLists, relationships, address] = await Promise.all([
    tagListsFor(db, "Person", [person.id]),
    db
      .from("school_relationships")
      .select("id, school_id, start_date, end_date")
      .eq("person_id", person.id)
      .is("deleted_at", null)
      .returns<SchoolRelationshipRow[]>(),
    db
      .from("addresses")
      .select("external_identifier, line1, line2, city, state, zip, country")
      .eq("addressable_type", "Person")
      .eq("addressable_id", person.id)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  const roleList = tagLists.get(person.id)?.roles ?? [];
  if (relationships.error) throw new Error(relationships.error.message);
  const relationshipRows = relationships.data ?? [];

  // The imported schema carries no foreign key from school_relationships to
  // schools, so PostgREST cannot embed the school and it is fetched by id.
  const schoolIds = relationshipRows
    .map((row) => row.school_id)
    .filter((id): id is number => id !== null);

  const [relationshipRoles, schools] = await Promise.all([
    schoolRelationshipRoles(relationshipRows.map((row) => row.id)),
    schoolIds.length === 0
      ? Promise.resolve({ data: [] as SchoolRow[] })
      : db
          .from("schools")
          .select("id, external_identifier, name, status, affiliated")
          .in("id", schoolIds)
          .returns<SchoolRow[]>(),
  ]);

  const schoolsById = new Map((schools.data ?? []).map((school) => [school.id, school]));

  data.attributes.schools = relationshipRows
    .map((row) => ({ row, school: row.school_id ? schoolsById.get(row.school_id) : undefined }))
    .filter(({ school }) => VISIBLE_SCHOOL_STATUSES.includes(school?.status ?? ""))
    .map(({ row, school }) => ({
      id: school?.external_identifier ?? null,
      name: school?.name ?? null,
      workflowId: null,
      workflowIds: [],
      affiliated: school?.affiliated ?? null,
      start_date: row.start_date,
      end_date: row.end_date,
      role_list: relationshipRoles.get(row.id)?.roles ?? [],
    }));

  const personResource: Resource = {
    id: person.external_identifier,
    type: "person",
    attributes: {
      ...camelizeKeys({
        email: person.email,
        first_name: person.first_name,
        middle_name: person.middle_name,
        last_name: person.last_name,
        phone: person.phone,
        image_url: person.image_url,
        updated_at: person.updated_at,
        is_onboarded: person.is_onboarded,
        preferred_language: person.preferred_language,
        active: person.active,
        end_date: person.end_date,
        role_list: roleList,
      }),
      "isOg?": roleList.includes(ROLE_TAGS.ops_guide),
      "isRgl?": roleList.includes(ROLE_TAGS.rgl),
      showSsj: false,
      ssjPhase: null,
      showNetwork:
        roleList.includes("Foundation Partner") || Boolean(person.affiliated_at),
    },
    relationships: { address: { data: null } },
  };

  const included: Resource[] = [personResource];

  if (address.data) {
    const addressRow = address.data as AddressRow;
    personResource.relationships = {
      address: { data: { id: addressRow.external_identifier, type: "address" } },
    };
    included.push({
      id: addressRow.external_identifier,
      type: "address",
      attributes: camelizeKeys({
        line1: addressRow.line1,
        line2: addressRow.line2,
        city: addressRow.city,
        state: addressRow.state,
        zip: addressRow.zip,
        country: addressRow.country,
      }),
    });
  }

  data.relationships = {
    person: { data: { id: person.external_identifier, type: "person" } },
  };

  return { data, included };
}

/** School relationship roles are tagged the same way people's roles are. */
async function schoolRelationshipRoles(ids: number[]) {
  if (ids.length === 0) return new Map<number, Record<string, string[]>>();
  const db = serviceClient();
  const { data } = await db
    .from("taggings")
    .select("taggable_id, context, tags ( name )")
    .eq("taggable_type", "SchoolRelationship")
    .in("taggable_id", ids);

  const byId = new Map<number, Record<string, string[]>>();
  for (const row of (data ?? []) as unknown as {
    taggable_id: number;
    context: string | null;
    tags: { name: string | null } | null;
  }[]) {
    if (!row.context || !row.tags?.name) continue;
    const lists = byId.get(row.taggable_id) ?? {};
    lists[row.context] = [...(lists[row.context] ?? []), row.tags.name];
    byId.set(row.taggable_id, lists);
  }
  return byId;
}
