import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Next 16 "proxy" (formerly middleware).
// 1. Give every visitor an anonymous httpOnly `sessionId` cookie (server-side cart key).
// 2. Owner auth for /owner and /api/owner is added in M4.
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const sessionId = crypto.randomUUID();
  // Set on the request too, so server components and route handlers see it on this very first request.
  request.cookies.set(SESSION_COOKIE, sessionId);
  const response = NextResponse.next({ request: { headers: request.headers } });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export const config = {
  // Skip static assets and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|products/).*)"],
};
