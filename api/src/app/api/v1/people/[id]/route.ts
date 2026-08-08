import { ApiError, errorResponse, requireAdmin, requireUser } from "@/lib/auth";
import { parsePersonParams, splitPersonParams } from "@/lib/people";
import { PersonRow, serializePerson } from "@/lib/serializers";
import { serviceClient } from "@/lib/supabase";
import { replaceTagList, tagListsFor } from "@/lib/tags";
import { SupabaseClient } from "@supabase/supabase-js";

async function findPerson(db: SupabaseClient, externalId: string): Promise<PersonRow> {
  const { data, error } = await db
    .from("people")
    .select("*")
    .eq("external_identifier", externalId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new ApiError(404, "Person not found");
  return data as PersonRow;
}

export async function GET(request: Request, ctx: RouteContext<"/api/v1/people/[id]">) {
  try {
    await requireUser(request);
    const { id } = await ctx.params;
    const db = serviceClient();
    const person = await findPerson(db, id);
    const tags = await tagListsFor(db, "Person", [person.id]);
    return Response.json({ data: serializePerson(person, tags.get(person.id)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/v1/people/[id]">) {
  try {
    const user = await requireUser(request);
    const { id } = await ctx.params;
    const db = serviceClient();
    const person = await findPerson(db, id);

    if (!user.isAdmin && person.id !== user.personId) {
      throw new ApiError(401, "Must be signed in");
    }

    const { columns, tagLists } = splitPersonParams(parsePersonParams(await request.json()));
    if (Object.keys(columns).length > 0) {
      const { error } = await db.from("people").update(columns).eq("id", person.id);
      if (error) throw new ApiError(422, error.message);
    }
    for (const { context, names } of tagLists) {
      await replaceTagList(db, "Person", person.id, context, names);
    }

    const updated = await findPerson(db, id);
    const tags = await tagListsFor(db, "Person", [updated.id]);
    return Response.json({ data: serializePerson(updated, tags.get(updated.id)) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Soft delete, matching acts_as_paranoid + `People::Offboard`. */
export async function DELETE(request: Request, ctx: RouteContext<"/api/v1/people/[id]">) {
  try {
    await requireAdmin(request);
    const { id } = await ctx.params;
    const db = serviceClient();
    const person = await findPerson(db, id);
    const now = new Date().toISOString();

    const { error } = await db
      .from("people")
      .update({ deleted_at: now, active: false, end_date: now.slice(0, 10) })
      .eq("id", person.id);
    if (error) throw new ApiError(422, error.message);

    await db
      .from("school_relationships")
      .update({ end_date: now.slice(0, 10) })
      .eq("person_id", person.id)
      .is("end_date", null);

    return Response.json({ message: "Person removed" });
  } catch (error) {
    return errorResponse(error);
  }
}
