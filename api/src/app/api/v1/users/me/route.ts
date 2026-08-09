import { errorResponse, requireUser } from "@/lib/auth";
import { userDocument } from "@/lib/users";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { data, included } = await userDocument(user.userId, user.email);
    return Response.json({ data, included });
  } catch (error) {
    return errorResponse(error);
  }
}
