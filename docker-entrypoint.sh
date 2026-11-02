#!/usr/bin/env bash
# Scrie /app/.dev.vars din env-ul containerului (doar cheile non-goale, fără log)
# și pornește workerd prin wrangler Pages dev.
set -euo pipefail

DEV_VARS=/app/.dev.vars
: > "$DEV_VARS"

if [ -n "${CLERK_SECRET_KEY:-}" ]; then
  printf 'CLERK_SECRET_KEY=%s\n' "$CLERK_SECRET_KEY" >> "$DEV_VARS"
fi

if [ -n "${PUBLIC_CLERK_PUBLISHABLE_KEY:-}" ]; then
  printf 'PUBLIC_CLERK_PUBLISHABLE_KEY=%s\n' "$PUBLIC_CLERK_PUBLISHABLE_KEY" >> "$DEV_VARS"
fi

chmod 600 "$DEV_VARS"

exec wrangler pages dev /app/dist/client --ip 0.0.0.0 --port 4321
