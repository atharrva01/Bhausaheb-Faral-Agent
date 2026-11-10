import { z } from "zod";
import { getCart, updateCart, setCartCountry, MAX_QTY_PER_LINE } from "@/lib/cart";
import { getSessionId } from "@/lib/session";
import { errorResponse } from "@/lib/api";

export async function GET() {
  try {
    return Response.json(await getCart(await getSessionId()));
  } catch (err) {
    return errorResponse(err);
  }
}

const bodySchema = z.union([
  z.object({
    action: z.enum(["add", "set"]),
    productId: z.string().min(1),
    quantity: z.number().int().min(0).max(MAX_QTY_PER_LINE),
  }),
  z.object({ action: z.literal("country"), country: z.string().length(2).nullable() }),
]);

export async function POST(req: Request) {
  try {
    const sessionId = await getSessionId();
    const body = bodySchema.parse(await req.json());
    const cart =
      body.action === "country"
        ? await setCartCountry(sessionId, body.country)
        : await updateCart(sessionId, [{ productId: body.productId, quantity: body.quantity }], body.action);
    return Response.json(cart);
  } catch (err) {
    return errorResponse(err);
  }
}
