import { errorResponse, requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return Response.json({
      data: {
        id: user.personExternalId ?? user.userId,
        type: "user",
        attributes: {
          email: user.email,
          isAdmin: user.isAdmin,
          personId: user.personExternalId,
        },
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
