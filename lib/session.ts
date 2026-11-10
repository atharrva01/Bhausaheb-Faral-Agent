import { cookies } from "next/headers";

export const SESSION_COOKIE = "sessionId";

/** Anonymous visitor session id (set by proxy.ts). Throws if missing, which only happens if proxy is bypassed. */
export async function getSessionId(): Promise<string> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) throw new Error("Missing session cookie");
  return id;
}
