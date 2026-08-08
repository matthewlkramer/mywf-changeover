import { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, errorResponse, requireAdmin, requireUser } from "@/lib/auth";
import { parseSchoolParams, splitSchoolParams } from "@/lib/schools";
import {
  PersonRow,
  SchoolRow,
  serializePersonBasic,
  serializeSchool,
} from "@/lib/serializers";
import { serviceClient } from "@/lib/supabase";
import { Resource } from "@/lib/jsonapi";
import { replaceTagList, tagListsFor } from "@/lib/tags";

async function findSchool(db: SupabaseClient, externalId: string): Promise<SchoolRow> {
  const { data, error } = await db
    .from("schools")
    .select("*")
    .eq("external_identifier", externalId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new ApiError(404, "School not found");
  return data as SchoolRow;
}

/** People currently related to a school, as `included` resources. */
async function relatedPeople(db: SupabaseClient, schoolId: number): Promise<Resource[]> {
  const { data, error } = await db
    .from("school_relationships")
    .select("people ( * )")
    .eq("school_id", schoolId)
    .is("deleted_at", null)
    .is("end_date", null);
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => (row as unknown as { people: PersonRow | null }).people)
    .filter((person): person is PersonRow => Boolean(person))
    .map(serializePersonBasic);
}

export async function GET(request: Request, ctx: RouteContext<"/api/v1/schools/[id]">) {
  try {
    await requireUser(request);
    const { id } = await ctx.params;
    const db = serviceClient();
    const school = await findSchool(db, id);
    const tags = await tagListsFor(db, "School", [school.id]);

    return Response.json({
      data: serializeSchool(school, tags.get(school.id)),
      included: await relatedPeople(db, school.id),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/v1/schools/[id]">) {
  try {
    await requireAdmin(request);
    const { id } = await ctx.params;
    const db = serviceClient();
    const school = await findSchool(db, id);

    const { columns, tagLists } = splitSchoolParams(parseSchoolParams(await request.json()));
    if (Object.keys(columns).length > 0) {
      const { error } = await db.from("schools").update(columns).eq("id", school.id);
      if (error) throw new ApiError(422, error.message);
    }
    for (const { context, names } of tagLists) {
      await replaceTagList(db, "School", school.id, context, names);
    }

    const updated = await findSchool(db, id);
    const tags = await tagListsFor(db, "School", [updated.id]);
    return Response.json({ data: serializeSchool(updated, tags.get(updated.id)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/v1/schools/[id]">) {
  try {
    await requireAdmin(request);
    const { id } = await ctx.params;
    const db = serviceClient();
    const school = await findSchool(db, id);

    const { error } = await db
      .from("schools")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", school.id);
    if (error) throw new ApiError(422, error.message);

    return Response.json({ message: "School removed" });
  } catch (error) {
    return errorResponse(error);
  }
}
