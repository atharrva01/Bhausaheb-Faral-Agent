// Owner auth (PRD 10.3): password from OWNER_PASSWORD, signed httpOnly cookie (jose HS256).
// Used by proxy.ts and by API route handlers (defence in depth).
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { createHash, timingSafeEqual } from "node:crypto";

export const OWNER_COOKIE = "owner_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(secret);
}

export function checkOwnerPassword(input: string): boolean {
  const expected = process.env.OWNER_PASSWORD;
  if (!expected) return false;
  // Hash both sides so lengths match and comparison is constant-time.
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function signOwnerSession(): Promise<string> {
  return new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(key());
}

export async function verifyOwnerToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.role === "owner";
  } catch {
    return false;
  }
}

export const ownerCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

export async function isOwner(): Promise<boolean> {
  return verifyOwnerToken((await cookies()).get(OWNER_COOKIE)?.value);
}

/** For /api/owner/* handlers: returns a 401 Response if not logged in, else null. */
export async function requireOwner(): Promise<Response | null> {
  return (await isOwner()) ? null : Response.json({ error: "UNAUTHORIZED", message: "Owner login required" }, { status: 401 });
}
