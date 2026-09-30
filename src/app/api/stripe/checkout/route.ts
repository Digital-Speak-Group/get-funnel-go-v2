import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createCheckoutSession } from "@/server/services/billing";
import { z } from "zod";

const RequestSchema = z.object({
  plan: z.enum(["trial", "pro", "agency"]),
  returnUrl: z.string().url(),
});

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { plan, returnUrl } = parsed.data;

    // trial cannot be bought
    if (plan === "trial") {
      return NextResponse.json({ error: "Cannot checkout trial plan" }, { status: 400 });
    }

    const { url } = await createCheckoutSession(session.activeOrgId, plan, returnUrl);
    
    if (!url) {
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (err: unknown) {
    console.error("[Stripe Checkout Error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
