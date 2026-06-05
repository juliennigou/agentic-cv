# CLAUDE.md

Les règles de contribution pour les agents IA de ce dépôt sont centralisées dans
**[AGENTS.md](AGENTS.md)** (standard inter-outils). Lis-le et applique-le.

Rappels prioritaires :

- `pnpm typecheck` doit passer avant de rendre la main.
- TypeScript `strict`, pas d'`any` non justifié.
- Valider les données externes avec Zod aux frontières.
- Accès DB uniquement via les repositories ; `pnpm db:generate` après tout edit du schéma Prisma.
- Frontend : utiliser les tokens de [DESIGN.md](DESIGN.md), jamais de valeurs en dur.
- Conventional Commits ; ne committer/pusher que sur demande, jamais sur `main`.
