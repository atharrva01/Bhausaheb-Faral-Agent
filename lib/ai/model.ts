// Gemini model from env with automatic fallback (PRD 8.5).
import "server-only";
import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { APICallError, wrapLanguageModel, type LanguageModelMiddleware } from "ai";

const PRIMARY = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const FALLBACK = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

// 429 = free-tier quota, 503 = "high demand", 404 = model retired for this key, 500 = transient.
const FALLBACK_STATUSES = new Set([404, 429, 500, 503]);

function shouldFallBack(err: unknown) {
  return APICallError.isInstance(err) && FALLBACK_STATUSES.has(err.statusCode ?? 0);
}

const fallbackModel = google(FALLBACK);

const fallbackMiddleware: LanguageModelMiddleware = {
  specificationVersion: "v4",
  wrapStream: async ({ doStream, params }) => {
    try {
      return await doStream();
    } catch (err) {
      if (!shouldFallBack(err) || PRIMARY === FALLBACK) throw err;
      console.warn(`[ai] ${PRIMARY} failed (${(err as APICallError).statusCode}); falling back to ${FALLBACK}`);
      return fallbackModel.doStream(params);
    }
  },
  wrapGenerate: async ({ doGenerate, params }) => {
    try {
      return await doGenerate();
    } catch (err) {
      if (!shouldFallBack(err) || PRIMARY === FALLBACK) throw err;
      console.warn(`[ai] ${PRIMARY} failed (${(err as APICallError).statusCode}); falling back to ${FALLBACK}`);
      return fallbackModel.doGenerate(params);
    }
  },
};

export const chatModel = wrapLanguageModel({ model: google(PRIMARY), middleware: fallbackMiddleware });

/** Short replies, low latency: we don't need deep reasoning to fill a cart. */
export const googleOptions = {
  google: { thinkingConfig: { thinkingLevel: "minimal" } } satisfies GoogleLanguageModelOptions,
};

/** What the customer sees when the model call fails. Never leaks provider details. */
export function friendlyAiError(err: unknown): string {
  const status = APICallError.isInstance(err) ? err.statusCode : undefined;
  console.error("[ai] chat error", status ?? "", err instanceof Error ? err.message : err);
  if (status === 429 || status === 503) {
    return "Aai's assistant is busy with lots of Diwali orders right now. Please try again in a few seconds.";
  }
  return "Sorry, the assistant ran into a problem. Please try again, or use the Add to cart buttons.";
}
