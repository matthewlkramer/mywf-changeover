import { errorResponse, requireUser } from "@/lib/auth";
import { document, pagination, paginationMeta } from "@/lib/jsonapi";
import { PersonRow, SchoolRow, serializePerson, serializeSchool } from "@/lib/serializers";
import { serviceClient } from "@/lib/supabase";
import { tagListsFor } from "@/lib/tags";

/**
 * Replaces the Searchkick/Elasticsearch-backed Rails search with Postgres
 * `ilike` matching. Only one model is returned per request, as before.
 */
const PERSON_SEARCH_COLUMNS = ["first_name", "last_name", "email", "about"];
const SCHOOL_SEARCH_COLUMNS = ["name", "short_name", "about", "domain"];

function orFilter(columns: string[], query: string): string {
  const escaped = query.replace(/[%,()]/g, " ").trim();
  return columns.map((column) => `${column}.ilike.%${escaped}%`).join(",");
}

function multi(searchParams: URLSearchParams, key: string): string[] {
  return [...searchParams.getAll(`${key}[]`), ...searchParams.getAll(key)].filter(Boolean);
}

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const { page, perPage, from, to } = pagination(url.searchParams, 100);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const models = url.searchParams.get("models") ?? "people";
    const db = serviceClient();

    if (models === "school" || models === "schools") {
      let query = db
        .from("schools")
        .select("*", { count: "exact" })
        .is("deleted_at", null)
        .eq("directory_visible", true)
        .order("name", { ascending: true })
        .range(from, to);
      if (q) query = query.or(orFilter(SCHOOL_SEARCH_COLUMNS, q));

      const states = multi(url.searchParams, "school_filters[address_state]");
      if (states.length > 0) {
        const { data: addresses } = await db
          .from("addresses")
          .select("addressable_id")
          .eq("addressable_type", "School")
          .in("state", states);
        query = query.in(
          "id",
          (addresses ?? []).map((a) => (a as { addressable_id: number }).addressable_id),
        );
      }

      const governanceTypes = multi(url.searchParams, "school_filters[governance_type]");
      if (governanceTypes.length > 0) query = query.in("governance_type", governanceTypes);

      const { data, count, error } = await query;
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as SchoolRow[];
      const tags = await tagListsFor(
        db,
        "School",
        rows.map((row) => row.id),
      );
      return document(
        rows.map((row) => serializeSchool(row, tags.get(row.id))),
        { meta: paginationMeta(page, perPage, count ?? rows.length) },
      );
    }

    let query = db
      .from("people")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("first_name", { ascending: true })
      .range(from, to);
    if (!url.searchParams.has("show_all")) query = query.eq("active", true);
    if (q) query = query.or(orFilter(PERSON_SEARCH_COLUMNS, q));

    const genders = multi(url.searchParams, "people_filters[genders]");
    if (genders.length > 0) query = query.in("gender", genders);

    const languages = multi(url.searchParams, "people_filters[languages]");
    if (languages.length > 0) query = query.in("primary_language", languages);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as PersonRow[];
    const tags = await tagListsFor(
      db,
      "Person",
      rows.map((row) => row.id),
    );
    return document(
      rows.map((row) => serializePerson(row, tags.get(row.id))),
      { meta: paginationMeta(page, perPage, count ?? rows.length) },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
