import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Render health check. Also pings the DB so a broken DATABASE_URL shows up immediately.
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "up" });
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
