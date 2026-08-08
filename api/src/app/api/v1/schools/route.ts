import { ApiError, errorResponse, requireAdmin, requireUser } from "@/lib/auth";
import { document, pagination, paginationMeta } from "@/lib/jsonapi";
import { parseSchoolParams, schoolIdsForPerson, splitSchoolParams } from "@/lib/schools";
import { SchoolRow, serializeSchool, serializeSchoolName } from "@/lib/serializers";
import { serviceClient } from "@/lib/supabase";
import { replaceTagList, tagListsFor } from "@/lib/tags";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    const url = new URL(request.url);
    const { page, perPage, from, to } = pagination(url.searchParams, 50);
    const db = serviceClient();

    let query = db
      .from("schools")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .range(from, to);

    const status = url.searchParams.get("status");
    if (status) query = query.eq("status", status);

    const personId = url.searchParams.get("person_id");
    if (personId) {
      const ids = await schoolIdsForPerson(personId, url.searchParams.get("role"));
      if (ids.length === 0) {
        return document([], { meta: paginationMeta(page, perPage, 0) });
      }
      query = query.in("id", ids);
    }

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as SchoolRow[];
    const meta = paginationMeta(page, perPage, count ?? rows.length);

    if (url.searchParams.has("name_only")) {
      return document(rows.map(serializeSchoolName), { meta });
    }

    const tags = await tagListsFor(
      db,
      "School",
      rows.map((row) => row.id),
    );
    return document(
      rows.map((row) => serializeSchool(row, tags.get(row.id))),
      { meta },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const { columns, tagLists } = splitSchoolParams(parseSchoolParams(await request.json()));
    const db = serviceClient();

    const { data, error } = await db.from("schools").insert(columns).select("*").single();
    if (error) throw new ApiError(422, error.message);

    const row = data as SchoolRow;
    for (const { context, names } of tagLists) {
      await replaceTagList(db, "School", row.id, context, names);
    }

    const tags = await tagListsFor(db, "School", [row.id]);
    return Response.json({ data: serializeSchool(row, tags.get(row.id)) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
