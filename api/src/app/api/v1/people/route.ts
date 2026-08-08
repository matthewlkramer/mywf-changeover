import { ApiError, errorResponse, requireAdmin, requireUser } from "@/lib/auth";
import { document, pagination, paginationMeta } from "@/lib/jsonapi";
import {
  ROLE_TAGS,
  parsePersonParams,
  personIdsTaggedWith,
  splitPersonParams,
} from "@/lib/people";
import { PersonRow, serializePerson, serializePersonBasic } from "@/lib/serializers";
import { serviceClient } from "@/lib/supabase";
import { replaceTagList, tagListsFor } from "@/lib/tags";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const { page, perPage, from, to } = pagination(url.searchParams, 100);
    const db = serviceClient();

    let query = db
      .from("people")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("first_name", { ascending: true })
      .range(from, to);

    for (const [param, tagName] of Object.entries(ROLE_TAGS)) {
      if (url.searchParams.get(param) === null) continue;
      const ids = await personIdsTaggedWith(tagName);
      if (ids.length === 0) {
        return document([], { meta: paginationMeta(page, perPage, 0) });
      }
      query = query.in("id", ids);
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as PersonRow[];
    const meta = paginationMeta(page, perPage, count ?? rows.length);

    if (url.searchParams.has("lightweight") || url.searchParams.has("etl")) {
      return document(rows.map(serializePersonBasic), { meta });
    }

    const tags = await tagListsFor(
      db,
      "Person",
      rows.map((row) => row.id),
    );
    return document(
      rows.map((row) => serializePerson(row, tags.get(row.id))),
      { meta },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { columns, tagLists } = splitPersonParams(parsePersonParams(await request.json()));
    const db = serviceClient();

    const { data, error } = await db.from("people").insert(columns).select("*").single();
    if (error) throw new ApiError(422, error.message);

    const row = data as PersonRow;
    for (const { context, names } of tagLists) {
      await replaceTagList(db, "Person", row.id, context, names);
    }

    const tags = await tagListsFor(db, "Person", [row.id]);
    return Response.json({ data: serializePerson(row, tags.get(row.id)) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
