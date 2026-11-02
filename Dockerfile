# syntax=docker/dockerfile:1

# ---- Build ------------------------------------------------------------------
# Astro 7 + @astrojs/cloudflare: static assets + Pages SSR worker (dist/client)
FROM node:24-bookworm-slim AS builder

# workerd (pornește în timpul build-ului) are nevoie de CA-urile sistemului
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cheia publică Clerk e inlinată în build (import.meta.env), deci ARG + ENV.
# E non-secret (public key) și nu rămâne în imaginea finală.
ARG PUBLIC_CLERK_PUBLISHABLE_KEY
ENV PUBLIC_CLERK_PUBLISHABLE_KEY=${PUBLIC_CLERK_PUBLISHABLE_KEY} \
    NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- Runner -----------------------------------------------------------------
# workerd prin `wrangler pages dev` — identic cu runtime-ul de producție.
FROM node:24-bookworm-slim AS runner

# HOME scriibil pentru cache-ul CLI-ului wrangler; metrici dezactivate.
ENV NODE_ENV=production \
    WRANGLER_SEND_METRICS=false \
    HOME=/home/node

# CA certificates: workerd (outbound TLS, ex. API-ul Clerk) le cere la runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# wrangler nu e dependență directă (tranzitivă a @astrojs/cloudflare) → global, pinned.
RUN npm install -g wrangler@4.156.0 --no-audit --no-fund \
    && npm cache clean --force

WORKDIR /app

# Doar output-ul de build; niciun sursă, niciun secret în layere.
COPY --from=builder /app/dist/client ./dist/client
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && mkdir -p /home/node/.wrangler \
    && chown -R node:node /app /home/node

USER node
EXPOSE 4321

# Node are fetch nativ — fără curl în imagine.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4321/').then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["docker-entrypoint.sh"]
