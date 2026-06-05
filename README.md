# Agentic CV

Plateforme open source pour scraper des offres V.I.E / premiers jobs, les normaliser, puis aider des etudiants a preparer leurs candidatures.

## Stack

- Next.js
- TypeScript
- PostgreSQL
- Prisma
- Supabase
- Playwright
- OpenAI Agents SDK, plus tard

## Structure

```txt
apps/
  web/                  # Application Next.js
  worker/               # CLI et jobs de scraping
packages/
  db/                   # Prisma, client DB, repositories
  scraper-core/         # Contrats et pipeline ETL
  scraper-business-france/
  shared/
  ai/                   # Reserve pour la phase IA
  documents/            # Reserve pour CV, lettres, exports
docs/
```

## Demarrage

`pnpm` est le gestionnaire de paquets cible.

```bash
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
pnpm db:generate
pnpm dev
```

Le premier jalon est le scraper Business France et la pipeline ETL:

```bash
pnpm scrape:business-france
```

## Documentation

- [Architecture](docs/architecture.md)
- [Cahier des charges](docs/cahier-des-charges.md)

