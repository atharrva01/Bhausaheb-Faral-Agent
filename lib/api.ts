import { ZodError } from "zod";
import { CheckoutError } from "@/lib/checkout";

/** Uniform JSON error responses for route handlers. */
export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return Response.json(
      { error: "VALIDATION", message: err.issues[0]?.message ?? "Invalid input", issues: err.issues },
      { status: 400 },
    );
  }
  if (err instanceof CheckoutError) {
    const status = err.code === "NOT_FOUND" ? 404 : err.code === "RATE_LIMITED" ? 429 : err.code === "PAYPAL_ERROR" ? 502 : 400;
    return Response.json({ error: err.code, message: err.message }, { status });
  }
  console.error(err);
  return Response.json({ error: "INTERNAL", message: "Something went wrong. Please try again." }, { status: 500 });
}
