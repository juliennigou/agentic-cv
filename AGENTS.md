# AGENTS.md

Règles que **tout agent IA** (Claude Code, Codex, Cursor, Gemini CLI…) doit suivre
pour contribuer à ce dépôt. Source unique de vérité — `CLAUDE.md` pointe ici.

> Standard ouvert : <https://agents.md>. Ce fichier prime sur les habitudes par
> défaut de l'agent. En cas de conflit avec une instruction utilisateur explicite,
> l'utilisateur gagne, mais signale le conflit.

---

## 1. Contexte projet

Monorepo TypeScript (pnpm + Turbo). Plateforme open source pour scraper des offres
V.I.E / premiers jobs, les normaliser, et préparer des candidatures.

- Architecture & vision : [docs/architecture.md](docs/architecture.md)
- Design system (tokens, source canonique) : [DESIGN.md](DESIGN.md)
- Le projet doit rester **simple, auto-hébergeable, sans dépendance payante obligatoire**.

```txt
apps/web        # Next.js
apps/worker     # CLI & jobs de scraping
packages/db     # Prisma, client, repositories
packages/scraper-core              # Contrats + pipeline ETL (cœur)
packages/scraper-business-france   # Source concrète
packages/shared | ai | documents   # Transverse / réservé
```

---

## 2. Règles d'or (non négociables)

1. **Ne jamais casser le typecheck.** `pnpm typecheck` doit passer avant de rendre la main.
2. **`strict` TypeScript** : aucun `any` implicite ou explicite non justifié, aucun
   `// @ts-ignore` / `@ts-expect-error` sans commentaire expliquant pourquoi.
3. **Inversion de dépendances** : les contrats (`types`, `interface`) vivent dans
   `scraper-core` ; les implémentations (Prisma, Playwright…) en dépendent, jamais
   l'inverse. `scraper-core`, l'ETL et l'accès base **ne doivent pas dépendre de Next.js**.
4. **Validation aux frontières** : toute donnée externe (scraping, API, env) est
   validée avec **Zod** avant d'entrer dans le domaine. Voir
   `packages/scraper-core/src/normalizers/validate-job-offer.ts`.
5. **Pas de secret en dur.** Lire via env (`.env.example` documente les clés).
   Ne pas committer de `.env`, de clés API, de données scrapées réelles.
6. **Périmètre minimal** : ne change que ce que la tâche demande. Pas de refactor
   opportuniste non sollicité, pas de reformatage de fichiers non touchés.
7. **Pas de dépendance nouvelle sans raison.** Préfère la lib standard / existante.
   Si une dépendance est vraiment nécessaire, justifie-la et privilégie le gratuit/léger.

---

## 3. Style de code

Aligne-toi sur le code existant (lis un fichier voisin avant d'écrire). Conventions
observées et à respecter :

- **ESM** partout (`"type": "module"`), imports avec extension si requis par le runtime.
- **Double quotes**, **point-virgules**, **indentation 2 espaces**.
- **`type` par défaut**, `interface` réservé aux contrats étendables/implémentables
  (ex. `JobScraper`, `JobOfferRepository`).
- **`import type`** pour les imports de types uniquement.
- **Ordre des imports** : externes d'abord, puis `@agentic-cv/*`, puis relatifs,
  séparés par une ligne vide.
- **Nommage** : `PascalCase` pour types/classes, `camelCase` pour variables/fonctions,
  **kebab-case** pour les noms de fichiers, `SCREAMING_SNAKE_CASE` pour les constantes globales.
- **Enums de domaine** = unions de littéraux string en `snake_case`
  (ex. `"business_france_vie"`, `"partial_success"`), pas d'`enum` TS.
- Fonctions pures et petites ; effets de bord (DB, réseau, fs) isolés dans des
  modules dédiés (repositories, scrapers).
- **Commentaires** : rares, en français, sur le _pourquoi_ pas le _quoi_. Pas de
  commentaire qui paraphrase le code.

---

## 4. Commandes

Toujours via **pnpm** (jamais npm/yarn). `pnpm@9.15.4`.

```bash
pnpm install                  # corepack enable d'abord si besoin
pnpm db:generate              # régénère le client Prisma (requis après edit du schema)
pnpm typecheck                # OBLIGATOIRE avant de finir
pnpm lint                     # ESLint (qualité/bugs) ; --fix dispo via lint:fix
pnpm format                   # Prettier --write ; format:check pour vérifier (CI)
pnpm build                    # build Turbo
pnpm dev                      # dev (Next + worker)
pnpm scrape:business-france   # lance le scraper
```

Filtrer un package : `pnpm --filter @agentic-cv/<pkg> <script>`.

---

## 5. Base de données (Prisma)

- Schéma : `packages/db/prisma/schema.prisma`. **Après toute modif** :
  `pnpm db:generate`, puis créer une migration via `pnpm db:migrate`.
- Accès DB **uniquement via les repositories** (`packages/db/src/repositories/`),
  jamais de `prisma.*` dispersé dans le code applicatif.
- Les repositories implémentent les interfaces de `scraper-core` (ex.
  `PrismaJobOfferRepository implements JobOfferRepository`).
- Ne jamais éditer une migration déjà committée ; en créer une nouvelle.
- **Colonnes que Prisma ne sait pas représenter** (types `Unsupported(...)` comme
  `embedding vector(1536)` / `fts tsvector`, colonnes `GENERATED ALWAYS AS … STORED`,
  index GIN/HNSW sur ces colonnes) : elles sont déclarées au mieux dans le schéma
  (`fts Unsupported("tsvector")?`) pour éviter un `DROP COLUMN`, mais Prisma ne peut
  pas exprimer le `GENERATED` ni les index sur colonnes `Unsupported`. `migrate dev`
  proposera donc toujours un diff résiduel (drop des index `embedding`/`fts`, `ALTER
COLUMN fts DROP DEFAULT`). **Ne pas appliquer ce diff.**
  - Pour appliquer les migrations existantes : `pnpm --filter @agentic-cv/db exec
prisma migrate deploy` (jamais de diff, jamais de drop).
  - Pour créer une _vraie_ nouvelle migration : `prisma migrate dev --create-only`,
    puis **supprimer à la main** les `DROP INDEX`/`DROP DEFAULT` parasites ci-dessus
    du fichier généré avant de committer.
  - Prisma lancé depuis `packages/db` ne charge pas le `.env` racine : exporter les
    vars d'abord (`set -a && source ../../.env && set +a`).

---

## 6. Tests & vérification

- Avant de rendre la main : **`pnpm typecheck` (et `pnpm lint`) doivent passer.**
- Quand tu ajoutes/changes une logique métier (normalisation, ETL, mapping),
  fournis ou mets à jour un test si un harnais existe ; sinon décris la
  vérification manuelle effectuée.
- Ne déclare pas une tâche « terminée » sans avoir exécuté la vérification.
  Si un test échoue, dis-le avec la sortie — ne masque pas l'échec.

---

## 7. Git & commits

- **Conventional Commits** : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`, `ci:`. Sujet à l'impératif, concis.
- Ne committe/push **que si l'utilisateur le demande**. Ne touche pas à `main`
  directement : crée une branche.
- Pas de fichiers générés, `node_modules/`, `.env`, ou artefacts dans les commits
  (cf. `.gitignore`).
- PR : description claire du quoi/pourquoi, et la commande de vérification utilisée.

---

## 8. Frontend (apps/web)

- Respecter **[DESIGN.md](DESIGN.md)** : utiliser les **tokens** du design system,
  jamais de valeurs codées en dur (couleurs, espacements, typo).
- Tailwind + shadcn/ui si besoin. Composants accessibles (WCAG AA visé).
- Garder la logique métier hors des composants : la déléguer aux packages.

---

## 9. Périmètre IA / agents (V2)

La couche IA (OpenAI Agents SDK) est **prévue mais non requise en V1**. Ne pas la
rendre nécessaire au socle scraping/ETL. Concevoir les modules pour rester
testables hors Next.js et hors IA.

---

## 10. Code smells & critères de refactoring

Signaux d'un code à revoir (d'après Fowler/Beck). Un agent qui en produit ou en
croise un **doit le corriger ou le signaler**, pas le propager.

- **Fonction longue** : > ~40 lignes ou faisant plusieurs choses → découper en
  fonctions nommées par intention.
- **Liste de paramètres trop longue** : > 3-4 paramètres → passer un objet typé
  (`type Options = { … }`), cohérent avec le style du projet.
- **Obsession des primitifs** : empiler `string`/`number` bruts là où un `type`
  riche exprime mieux le domaine (ex. unions `snake_case`, objets normalisés).
  Le projet privilégie déjà les types riches — garde ce cap.
- **Code dupliqué (DRY)** : même bloc copié-collé → extraire une fonction/util
  partagée (dans `shared` ou `scraper-core` selon la portée).
- **Nom mystérieux** : variable/fonction dont l'intention n'est pas évidente →
  renommer (longueur du nom proportionnelle à la portée).
- **Couplage fort / shotgun surgery** : un changement oblige à toucher plein de
  modules éparpillés → revoir les frontières, respecter l'inversion de dépendances.
- **Classe/module fourre-tout** : trop de responsabilités → séparer.
- **Éléments paresseux** : wrapper/abstraction qui n'apporte rien → supprimer.
- **`any`, casts, `@ts-ignore`** : odeurs de type → préférer un typage correct ou
  une validation Zod ; si vraiment inévitable, commenter le pourquoi.

> La couverture de tests et les métriques (complexité cyclomatique…) sont des
> indicateurs, pas des preuves : 100 % de couverture avec des assertions faibles
> donne une fausse confiance. Vise des tests qui valident le comportement réel.
