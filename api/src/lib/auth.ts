import { serviceClient, userClient } from "@/lib/supabase";

export type CurrentUser = {
  userId: string;
  email: string | null;
  personId: number | null;
  personExternalId: string | null;
  isAdmin: boolean;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : header.trim();
}

/**
 * Resolves the Supabase auth user behind a request and joins it to the `people`
 * row that carries the app-level role. Mirrors Rails' `current_user`.
 */
export async function currentUser(request: Request): Promise<CurrentUser | null> {
  const token = bearerToken(request);
  if (!token) return null;

  const { data, error } = await userClient(token).auth.getUser();
  if (error || !data.user) return null;

  const { data: person } = await serviceClient()
    .from("people")
    .select("id, external_identifier, is_admin")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    personId: person?.id ?? null,
    personExternalId: person?.external_identifier ?? null,
    isAdmin: person?.is_admin ?? false,
  };
}

export async function requireUser(request: Request): Promise<CurrentUser> {
  const user = await currentUser(request);
  if (!user) throw new ApiError(401, "Must be signed in");
  return user;
}

export async function requireAdmin(request: Request): Promise<CurrentUser> {
  const user = await requireUser(request);
  if (!user.isAdmin) throw new ApiError(403, "Must be an admin");
  return user;
}

/** Turns thrown ApiErrors into responses; anything else becomes a 500. */
export function errorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { errors: [error.message], status: error.status },
      { status: error.status },
    );
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ errors: [message], status: 500 }, { status: 500 });
}
