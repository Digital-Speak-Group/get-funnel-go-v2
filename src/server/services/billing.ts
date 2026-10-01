import "server-only";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db/client";
import { organizations, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { env } from "@/lib/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // @ts-expect-error Stripe TS definitions mismatched for 2024-12-18
  apiVersion: "2024-12-18.acacia",
});

// We need to define standard plans
export const PLANS = {
  trial: { name: "Trial", credits: 1, priceId: null },
  pro: { name: "Pro", credits: 50, priceId: process.env.STRIPE_PRICE_PRO },
  agency: { name: "Agency", credits: 500, priceId: process.env.STRIPE_PRICE_AGENCY },
} as const;

export type PlanType = keyof typeof PLANS;

export async function createCheckoutSession(orgId: string, plan: PlanType, returnUrl: string) {
  const priceId = PLANS[plan]?.priceId;
  if (!priceId) throw new Error("Invalid plan or missing price ID");

  // Get or create stripe customer
  const orgResult = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  const org = orgResult[0];
  if (!org) throw new Error("Org not found");

  let customerId = org.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { orgId },
    });
    customerId = customer.id;
    await db.update(organizations).set({ stripeCustomerId: customerId }).where(eq(organizations.id, orgId));
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
    client_reference_id: orgId,
  });

  logger.info("Created checkout session", { orgId, plan });
  return { url: session.url };
}

export async function handleWebhookEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode === "subscription") {
      const orgId = session.client_reference_id;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;
      
      if (orgId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscription(orgId, customerId, subscription);
      }
    }
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    
    // Find org by customerId
    const orgResult = await db.select().from(organizations).where(eq(organizations.stripeCustomerId, customerId)).limit(1);
    const org = orgResult[0];
    
    if (org) {
      await upsertSubscription(org.id, customerId, subscription);
    }
  }
  
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    
    // Find org by customerId
    const orgResult = await db.select().from(organizations).where(eq(organizations.stripeCustomerId, customerId)).limit(1);
    const org = orgResult[0];
    
    if (org) {
      await upsertSubscription(org.id, customerId, subscription);
      logger.info("Subscription deleted", { orgId: org.id, stripeSubscriptionId: subscription.id });
    }
  }
}

async function upsertSubscription(orgId: string, customerId: string, subscription: Stripe.Subscription) {
  // Determine plan from price
  const priceId = subscription.items.data[0]?.price.id;
  let planKey: PlanType = "trial";
  
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      planKey = key as PlanType;
      break;
    }
  }

  // Access period fields via index signature to satisfy strict types
  const sub = subscription as unknown as Record<string, unknown>;
  const periodStart = new Date((sub.current_period_start as number) * 1000);
  const periodEnd = new Date((sub.current_period_end as number) * 1000);
  const cancelAtEnd = Boolean(sub.cancel_at_period_end);

  await db.transaction(async (tx) => {
    // Upsert subscription
    await tx.insert(subscriptions).values({
      orgId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      plan: planKey,
      status: subscription.status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: cancelAtEnd,
    }).onConflictDoUpdate({
      target: [subscriptions.orgId],
      set: {
        stripeSubscriptionId: subscription.id,
        plan: planKey,
        status: subscription.status,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: cancelAtEnd,
        updatedAt: new Date(),
      },
    });

    // Update org plan
    if (subscription.status === "active" || subscription.status === "trialing") {
      await tx.update(organizations).set({ plan: planKey }).where(eq(organizations.id, orgId));
    } else {
      // Revert to trial if cancelled/past due
      await tx.update(organizations).set({ plan: "trial" }).where(eq(organizations.id, orgId));
    }
  });
}
