import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { handleWebhookEvent } from "@/server/services/billing";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // @ts-expect-error Stripe TS definitions mismatched for 2024-12-18
  apiVersion: "2024-12-18.acacia",
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    console.error("[Stripe Webhook Signature Error]", err);
    return NextResponse.json({ error: `Webhook Error: ${err instanceof Error ? err.message : String(err)}` }, { status: 400 });
  }

  try {
    await handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[Stripe Webhook Handler Error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
