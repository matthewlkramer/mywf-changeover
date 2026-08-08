import { serviceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const { count, error } = await serviceClient()
      .from("people")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(error.message);
    return Response.json({ status: "ok", people: count ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ status: "error", message }, { status: 500 });
  }
}
