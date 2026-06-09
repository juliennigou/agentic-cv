# Image one-shot du pipeline quotidien (scrape → structure → embed → match).
# Le worker tourne via tsx : aucun build TS nécessaire (les packages workspace
# exportent leur source). Contexte de build = racine du monorepo.
FROM node:22-slim

# OpenSSL : requis par le moteur Prisma.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app
COPY . .

RUN pnpm install --frozen-lockfile && pnpm db:generate

# Migrations idempotentes (no-op si déjà appliquées) puis pipeline complet.
CMD ["sh", "-lc", "pnpm db:deploy && pnpm pipeline:job-offers"]
