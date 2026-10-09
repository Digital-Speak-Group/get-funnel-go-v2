FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
# src/lib/env.ts validates the whole schema at module load, so every required
# key must be set or `next build` throws "Invalid environment variables".
# NEXT_PUBLIC_* are inlined into the client bundle at build time, so they must be
# the REAL values for this environment — they cannot be fixed at runtime. Compose
# passes them from .env; the defaults only keep a bare `docker build` working.
ARG NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy"
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_dummy"
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Server-side keys are read at runtime; these dummies only satisfy the
# build-time schema check and never reach the runner stage.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/getfunnels"
ENV SUPABASE_SERVICE_ROLE_KEY="dummy"
ENV GROQ_API_KEY="dummy"
ENV AI_MODEL_FAST="dummy"
ENV AI_MODEL_QUALITY="dummy"
ENV STRIPE_SECRET_KEY="dummy"
ENV STRIPE_WEBHOOK_SECRET="dummy"
ENV RESEND_API_KEY="dummy"

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
