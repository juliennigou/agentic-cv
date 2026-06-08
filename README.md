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
pnpm hooks:install
pnpm db:generate
pnpm dev
```

Les hooks Git versionnes lancent les controles avant commit/push:

- `pre-commit`: `pnpm format:check` puis `pnpm lint`
- `pre-push`: `pnpm ci:local` (`db:generate`, `typecheck`, `lint`, `format:check`)

Pour rejouer le CI localement sans pousser:

```bash
pnpm ci:local
```

Le premier jalon est le scraper Business France et la pipeline ETL:

```bash
pnpm scrape:business-france
```

Pour lancer le scraper une fois par jour sur un VPS, voir la documentation systemd.

## Documentation

- [Architecture](docs/architecture.md)
- [Cahier des charges](docs/cahier-des-charges.md)
- [Deploiement systemd](docs/deployment-systemd.md)
- [DESIGN.md](DESIGN.md) — design system (tokens, source canonique pour les agents)
- [Direction artistique](docs/direction-artistique.md) — guide detaille (le pourquoi)
