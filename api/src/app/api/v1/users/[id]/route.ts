import { ApiError, errorResponse, requireUser } from "@/lib/auth";
import { userDocument } from "@/lib/users";

/**
 * Rails looked the user up by `external_identifier`. The frontend gets that id
 * by decoding the `sub` claim of the token in its `auth` cookie, which for a
 * Supabase token is the auth user's uuid, so both that and `me` resolve to the
 * caller. Only admins can read another user.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;

    const isSelf = id === "me" || id === user.userId || id === user.personExternalId;
    if (!isSelf && !user.isAdmin) throw new ApiError(403, "Must be an admin");
    if (!isSelf) throw new ApiError(404, "User not found");

    const { data, included } = await userDocument(user.userId, user.email);
    return Response.json({ data, included });
  } catch (error) {
    return errorResponse(error);
  }
}
