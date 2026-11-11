"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { OWNER_COOKIE, checkOwnerPassword, ownerCookieOptions, signOwnerSession } from "@/lib/owner-session";

// Slow down password guessing (in-memory, per IP; fine for a demo).
const attempts = new Map<string, number[]>();

export async function login(_prev: { error: string } | null, form: FormData): Promise<{ error: string }> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const recent = (attempts.get(ip) ?? []).filter((t) => t > Date.now() - 10 * 60_000);
  if (recent.length >= 10) return { error: "Too many attempts. Please wait a few minutes." };

  const password = String(form.get("password") ?? "");
  if (!checkOwnerPassword(password)) {
    attempts.set(ip, [...recent, Date.now()]);
    return { error: "Wrong password." };
  }
  attempts.delete(ip);

  (await cookies()).set(OWNER_COOKIE, await signOwnerSession(), ownerCookieOptions);
  const next = String(form.get("next") ?? "");
  redirect(next.startsWith("/owner") ? next : "/owner");
}

export async function logout() {
  (await cookies()).delete(OWNER_COOKIE);
  redirect("/owner/login");
}

/** English / मराठी switch for the shop side. */
export async function setOwnerLang(lang: "en" | "mr") {
  (await cookies()).set("owner_lang", lang === "mr" ? "mr" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
