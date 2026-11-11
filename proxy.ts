import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { OWNER_COOKIE, verifyOwnerToken } from "@/lib/owner-session";

// Next 16 "proxy" (formerly middleware). Runs on the Node runtime.
// 1. Owner auth for /owner/* (except /owner/login) and /api/owner/*.
// 2. Give every visitor an anonymous httpOnly `sessionId` cookie (server-side cart key).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ownerArea = pathname === "/owner" || pathname.startsWith("/owner/") || pathname.startsWith("/api/owner");
  if (ownerArea && pathname !== "/owner/login") {
    const ok = await verifyOwnerToken(request.cookies.get(OWNER_COOKIE)?.value);
    if (!ok) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "UNAUTHORIZED", message: "Owner login required" }, { status: 401 });
      }
      const login = new URL("/owner/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

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
