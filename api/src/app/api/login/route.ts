import { z } from "zod";
import { ApiError, errorResponse } from "@/lib/auth";
import { anonClient, serviceClient } from "@/lib/supabase";

const credentials = z.object({
  user: z.object({ email: z.string().email(), password: z.string() }),
});

/**
 * Replacement for Devise's `POST /login`. Returns the Supabase access token
 * both in the body and in the `Authorization` header, which is where the
 * existing UI reads it from before storing it in the `auth` cookie.
 */
export async function POST(request: Request) {
  try {
    const parsed = credentials.safeParse(await request.json());
    if (!parsed.success) throw new ApiError(422, "email and password are required");
    const { email, password } = parsed.data.user;

    const { data, error } = await anonClient().auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new ApiError(401, "Invalid email or password");

    const { data: person } = await serviceClient()
      .from("people")
      .select("external_identifier, first_name, last_name, is_admin")
      .eq("user_id", data.user.id)
      .maybeSingle();

    return Response.json(
      {
        data: {
          id: person?.external_identifier ?? data.user.id,
          type: "user",
          attributes: {
            email: data.user.email,
            firstName: person?.first_name ?? null,
            lastName: person?.last_name ?? null,
            isAdmin: person?.is_admin ?? false,
            personId: person?.external_identifier ?? null,
          },
        },
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
      { headers: { Authorization: data.session.access_token } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
