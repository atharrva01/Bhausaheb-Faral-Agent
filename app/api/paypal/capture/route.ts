import { z } from "zod";
import { captureCheckout } from "@/lib/checkout";
import { errorResponse } from "@/lib/api";

// Body: { orderId } (OUR order id). The PayPal order id is loaded from the DB.
export async function POST(req: Request) {
  try {
    const { orderId } = z.object({ orderId: z.string().min(1).max(64) }).parse(await req.json());
    return Response.json(await captureCheckout(orderId));
  } catch (err) {
    return errorResponse(err);
  }
}
