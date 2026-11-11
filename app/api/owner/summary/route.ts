import { generateText } from "ai";
import { requireOwner } from "@/lib/owner-session";
import { chatModel, friendlyAiError, googleOptions } from "@/lib/ai/model";
import { ordersVersion, summaryInput } from "@/lib/owner/stats";

// Cache per language for 5 minutes, and only while orders/stock are unchanged (PRD 8.4: save free-tier quota).
const cache = new Map<string, { at: number; version: string; text: string; generatedAt: string }>();
const TTL_MS = 5 * 60_000;

const LANG = {
  en: "English",
  mr: "Marathi (Devanagari script, simple everyday words a home cook uses; use the nameMarathi field for product names; numbers, order numbers and $ amounts as digits)",
} as const;

export async function GET(req: Request) {
  const denied = await requireOwner();
  if (denied) return denied;

  const lang = new URL(req.url).searchParams.get("lang") === "mr" ? "mr" : "en";
  const version = await ordersVersion();
  const hit = cache.get(lang);
  if (hit && hit.version === version && Date.now() - hit.at < TTL_MS) {
    return Response.json({ text: hit.text, lang, generatedAt: hit.generatedAt, cached: true });
  }

  const stats = await summaryInput();
  try {
    const { text } = await generateText({
      model: chatModel,
      providerOptions: googleOptions,
      maxRetries: 1,
      system:
        "You write a short daily briefing for Aai, a busy mother who makes homemade Diwali faral and sells it abroad. " +
        "Use ONLY the numbers in the JSON. Never invent orders, names or amounts. No greeting, no sign-off, no markdown headings.",
      prompt:
        `Language: ${LANG[lang]}.\n` +
        "Write exactly 5 short plain sentences, one per line, no emoji, no bullets, no numbering, no headings, in this order: " +
        "orders today; money today and this week; the best seller; unpaid bills (name them, or say none); " +
        "what to pack first (up to 3 order numbers) and anything running out.\n\n" +
        `DATA:\n${JSON.stringify(stats)}`,
    });
    const generatedAt = new Date().toISOString();
    cache.set(lang, { at: Date.now(), version, text: text.trim(), generatedAt });
    return Response.json({ text: text.trim(), lang, generatedAt, cached: false });
  } catch (err) {
    return Response.json({ error: "AI_UNAVAILABLE", message: friendlyAiError(err) }, { status: 503 });
  }
}
