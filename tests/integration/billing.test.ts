import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { db } from "@/lib/db/client";
import { organizations, subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { handleWebhookEvent, createCheckoutSession, PLANS } from "@/server/services/billing";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";
import { env } from "@/lib/env";

const testPool = new Pool({ connectionString: env.DATABASE_URL });
const testDb = drizzle({ client: testPool, schema });

async function setupDb() {
  await testDb.delete(subscriptions);
  await testDb.delete(organizations);
}

// Mock stripe
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: {
        create: vi.fn().mockResolvedValue({ id: "cus_test123" }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: "https://checkout.stripe.com/test" }),
        },
      },
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: "sub_test123",
          customer: "cus_test123",
          status: "active",
          current_period_start: 1672531200,
          current_period_end: 1675209600,
          cancel_at_period_end: false,
          items: {
            data: [{ price: { id: "price_pro" } }],
          },
        }),
      },
    })),
  };
});

// Since process.env variables are used for price IDs
process.env.STRIPE_PRICE_PRO = "price_pro";

describe.skip("Billing & Subscriptions", () => {
  beforeAll(async () => {
    await setupDb();
  });

  afterAll(async () => {
    await testPool.end();
  });

  beforeEach(async () => {
    await setupDb();
  });

  it("creates a checkout session and updates org customer ID", async () => {
    const [{ id: orgId }] = await testDb.insert(organizations).values({
      name: "Test Org",
      slug: "test-org",
    }).returning();

    const result = await createCheckoutSession(orgId, "pro", "http://localhost/return");
    expect(result.url).toBe("https://checkout.stripe.com/test");

    const updatedOrg = await testDb.query.organizations.findFirst({
      where: eq(organizations.id, orgId)
    });
    expect(updatedOrg?.stripeCustomerId).toBe("cus_test123");
  });

  it("handles checkout.session.completed webhook", async () => {
    const [{ id: orgId }] = await testDb.insert(organizations).values({
      name: "Test Org",
      slug: "test-org",
      stripeCustomerId: "cus_test123",
      plan: "trial",
    }).returning();

    const mockEvent = {
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          client_reference_id: orgId,
          subscription: "sub_test123",
          customer: "cus_test123",
        },
      },
    } as any;

    await handleWebhookEvent(mockEvent);

    const sub = await testDb.query.subscriptions.findFirst({
      where: eq(subscriptions.orgId, orgId)
    });
    
    expect(sub).toBeDefined();
    expect(sub?.plan).toBe("pro");
    expect(sub?.status).toBe("active");

    const org = await testDb.query.organizations.findFirst({
      where: eq(organizations.id, orgId)
    });
    expect(org?.plan).toBe("pro");
  });
});
