import { createCheckout } from "@/lib/checkout";
import { getSessionId } from "@/lib/session";
import { errorResponse } from "@/lib/api";

// Cart-button checkout. Body: { name, email, address, giftMessage? }. Amounts come from the server cart only.
export async function POST(req: Request) {
  try {
    const result = await createCheckout(await getSessionId(), await req.json(), "cart");
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
