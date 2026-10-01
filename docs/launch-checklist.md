# GetFunnels SaaS Launch Checklist

Use this checklist to ensure all prerequisites are met before deploying GetFunnels SaaS V1 to production.

## 1. Environment Variables 🔐

Ensure the production environment contains the following keys, with correct live values (no test keys):

- [ ] `NEXT_PUBLIC_APP_URL` — Full URL (e.g. `https://app.getfunnels.com`)
- [ ] `DATABASE_URL` — Production Postgres connection string (with `sslmode=require` if applicable)
- [ ] `AUTH_SECRET` — A secure 32-byte string (generate using `openssl rand -hex 32`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (if applicable for V1)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase Anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (Backend only)
- [ ] `STRIPE_SECRET_KEY` — Stripe LIVE secret key (`sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` — Stripe LIVE webhook secret (`whsec_...`)
- [ ] `STRIPE_PRICE_PRO` — Stripe live Price ID for the Pro plan
- [ ] `STRIPE_PRICE_AGENCY` — Stripe live Price ID for the Agency plan
- [ ] `ANTHROPIC_API_KEY` — Claude API key
- [ ] `RESEND_API_KEY` — Resend API key for email delivery

## 2. Stripe Configuration 💳

- [ ] Ensure Stripe products and prices (Pro, Agency) are created in the Live mode dashboard.
- [ ] Set up the Stripe Webhook endpoint in the dashboard, pointing to `https://<DOMAIN>/api/stripe/webhook`.
- [ ] Verify webhook listens for: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- [ ] Copy the live `STRIPE_WEBHOOK_SECRET` to the environment.

## 3. DNS & Domain Setup 🌐

- [ ] Point the main domain (e.g., `app.getfunnels.com`) to the Vercel (or VPS) production deployment.
- [ ] Configure `A` and `CNAME` records correctly.
- [ ] Ensure SSL certificate is provisioned and active.
- [ ] Ensure email sending domain (via Resend) has its DNS records configured (DKIM, SPF, DMARC) and is verified.

## 4. Database Initialization 🗄️

- [ ] Ensure production database backups (PITR) are enabled.
- [ ] Run production database migrations: `npm run db:migrate`.
- [ ] Run the database seed for core dependencies (e.g., system themes, legacy templates): `npm run db:seed`.

## 5. Third-Party Checks ✅

- [ ] Add the production domain to Supabase Auth's allowed redirect URLs.
- [ ] Verify Anthropic API limits (ensure you are on a paid/unrestricted tier).
- [ ] Add domain to any CAPTCHA or analytics providers.

## 6. Support & Runbook 🚨

- [ ] Error tracking (Sentry or similar) is active in production.
- [ ] Ensure structured logs (JSON) are correctly ingested (e.g., Datadog, Axiom, or Vercel logs).
- [ ] Establish a runbook for investigating failed generations (using `orgId` and `deckId`).
- [ ] Verify customer support inbox / notification channels are live.

## 7. Pre-Flight Verification 🛫

- [ ] Perform a full signup flow on the production URL.
- [ ] Test the upgrade flow via Stripe Live Mode (use a real credit card, then refund it).
- [ ] Generate one deck using live AI keys.
- [ ] Open the presentation audience link on a mobile device to verify latency and layout.
- [ ] Export the generated deck to PDF.
