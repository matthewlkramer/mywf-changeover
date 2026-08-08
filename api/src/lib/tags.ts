import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Replacement for acts-as-taggable-on's `<context>_list` attributes: tags live
 * in `tags` and are attached polymorphically through `taggings`.
 */
export type TagLists = Record<string, string[]>;

type TaggingRow = {
  taggable_id: number;
  context: string | null;
  tags: { name: string | null } | null;
};

export async function tagListsFor(
  db: SupabaseClient,
  taggableType: "Person" | "School",
  taggableIds: number[],
): Promise<Map<number, TagLists>> {
  const byId = new Map<number, TagLists>();
  if (taggableIds.length === 0) return byId;

  const { data, error } = await db
    .from("taggings")
    .select("taggable_id, context, tags ( name )")
    .eq("taggable_type", taggableType)
    .in("taggable_id", taggableIds);
  if (error) throw new Error(error.message);

  for (const row of (data ?? []) as unknown as TaggingRow[]) {
    if (!row.context || !row.tags?.name) continue;
    const lists = byId.get(row.taggable_id) ?? {};
    const list = lists[row.context] ?? [];
    list.push(row.tags.name);
    lists[row.context] = list;
    byId.set(row.taggable_id, lists);
  }
  return byId;
}

export async function replaceTagList(
  db: SupabaseClient,
  taggableType: "Person" | "School",
  taggableId: number,
  context: string,
  names: string[],
): Promise<void> {
  const { error: deleteError } = await db
    .from("taggings")
    .delete()
    .eq("taggable_type", taggableType)
    .eq("taggable_id", taggableId)
    .eq("context", context);
  if (deleteError) throw new Error(deleteError.message);

  if (names.length === 0) return;

  const { data: tags, error: upsertError } = await db
    .from("tags")
    .upsert(
      names.map((name) => ({ name })),
      { onConflict: "name", ignoreDuplicates: false },
    )
    .select("id, name");
  if (upsertError) throw new Error(upsertError.message);

  const { error: insertError } = await db.from("taggings").insert(
    (tags ?? []).map((tag) => ({
      tag_id: tag.id,
      taggable_type: taggableType,
      taggable_id: taggableId,
      context,
    })),
  );
  if (insertError) throw new Error(insertError.message);
}
