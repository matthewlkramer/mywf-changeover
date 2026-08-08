import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Mirrors the Rails app's rack-cors configuration so the existing frontend can
 * call this API from the browser: any localhost dev server, any Vercel
 * deployment, and the production/staging hosts.
 */
const ALLOWED_ORIGINS = [
  /^http:\/\/localhost:\d+$/,
  /^https:\/\/.+\.vercel\.app$/,
  /^https:\/\/(my|my-dev|my-staging|platform|platform-dev|platform-staging)\.wildflowerschools\.org$/,
];

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  if (!origin || !ALLOWED_ORIGINS.some((pattern) => pattern.test(origin))) return headers;

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept");
  headers.set("Access-Control-Expose-Headers", "Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Vary", "Origin");
  return headers;
}

export function proxy(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin"));

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
