# Architecture Agentic CV

## Vision

Agentic CV est une plateforme open source pour aider les etudiants et jeunes diplomes a trouver des offres V.I.E, stages, alternances ou premiers jobs, puis a preparer des candidatures adaptees.

Le projet doit rester simple, auto-hebergeable et le plus gratuit possible. La premiere version se concentre d'abord sur un scraper Business France V.I.E, une pipeline ETL generique et une base d'offres propre. L'interface de recherche arrive ensuite, une fois le socle de donnees fiable.

La partie IA sera ajoutee dans un second temps. L'architecture doit donc prevoir les modules agents sans les rendre necessaires a la V1.

## Principes

- Monorepo TypeScript.
- Separation claire entre scraping, ETL, stockage, frontend, authentification et IA.
- Une source d'offres au depart, mais un contrat commun pour pouvoir ajouter d'autres sites.
- Pas de dependance payante obligatoire.
- Compatible avec auto-hebergement, sans dependance forte a une plateforme cloud specifique.
- Backend simple au debut, puis extraction progressive en workers si necessaire.
- Donnees normalisees des le depart pour eviter une dette forte sur les offres.
- Stockage des secrets utilisateur avec prudence, en evitant de stocker des cles API tant que ce n'est pas indispensable.
- Modules concus pour etre testables hors Next.js: le scraper, l'ETL et l'acces base ne doivent pas dependre du frontend.

## Stack cible

### Socle projet

- Framework web: Next.js
- Langage: TypeScript
- UI: Tailwind CSS, shadcn/ui si le projet en a besoin
- Base de donnees: PostgreSQL, avec Supabase comme option simple au depart
- ORM: Prisma
- Scraping: Playwright
- ETL: modules TypeScript internes
- Auth: Supabase Auth
- Stockage documents: Supabase Storage au debut, avec abstraction pour pouvoir basculer vers S3/MinIO/local
- Jobs planifies: script CLI manuel au debut, puis cron auto-heberge

Le premier jalon n'a besoin que de PostgreSQL, Prisma, Playwright, `scraper-core`, `scraper-business-france` et un worker CLI. Auth, storage et UI avancee sont prevus par l'architecture mais peuvent arriver apres validation du scraper.

### V2 et plus

- IA: OpenAI Agents SDK
- Files de jobs: BullMQ + Redis, ou alternative auto-hebergeable
- Observabilite scraping: logs structures, table `scrape_runs`, erreurs par source
- Export documents: DOCX puis PDF
- Multi-sources: autres sites V.I.E, stages, alternances, job boards

## Structure monorepo proposee

```txt
agentic-cv/
  apps/
    web/
      src/
        app/
        components/
        features/
        lib/
        server/
      public/
      package.json

    worker/
      src/
        jobs/
        runners/
        cli/
      package.json

  packages/
    db/
      prisma/
      src/
        client.ts
        repositories/
      package.json

    scraper-core/
      src/
        contracts/
        extractors/
        normalizers/
        dedupe/
        etl/
        types.ts
      package.json

    scraper-business-france/
      src/
        businessFranceScraper.ts
        businessFranceParser.ts
        businessFranceMapper.ts
      package.json

    shared/
      src/
        types/
        constants/
        utils/
      package.json

    ai/
      src/
        agents/
        tools/
        prompts/
        schemas/
      package.json

    documents/
      src/
        resume/
        cover-letter/
        exporters/
      package.json

  docs/
    architecture.md
    cahier-des-charges.md

  package.json
  pnpm-workspace.yaml
  turbo.json
  README.md
```

## Responsabilites par module

### `apps/web`

Application utilisateur.

Responsabilites:

- Afficher les offres.
- Permettre la recherche et les filtres.
- Gerer l'authentification.
- Gerer le profil utilisateur.
- Permettre le depot de documents.
- Exposer les routes serveur necessaires a l'app, principalement pour les usages interactifs.

Dans la V1, `apps/web` peut aussi contenir des actions serveur simples. Les traitements longs restent dans `apps/worker`.

### `apps/worker`

Execution des traitements non interactifs.

Responsabilites:

- Lancer un scraping manuel ou planifie.
- Executer la pipeline ETL.
- Ecrire les resultats en base.
- Enregistrer les logs de scraping.

Au depart, un simple script CLI suffit:

```txt
pnpm scrape:business-france
```

Plus tard, ce module pourra devenir un worker avec file de jobs. Il ne doit pas dependre de Next.js: il consomme `packages/scraper-core`, les scrapers sources et `packages/db`.

### `packages/scraper-core`

Socle commun de scraping et d'ETL.

Responsabilites:

- Definir les interfaces communes des scrapers.
- Normaliser les donnees brutes.
- Gerer la deduplication.
- Valider les donnees avant insertion.
- Orchestrer la pipeline ETL sans connaitre Prisma directement.
- Fournir une pipeline commune:

```txt
extract -> parse -> normalize -> validate -> dedupe -> persist
```

Contrat simplifie:

```ts
export type ScraperSource = "business_france";

export type RawJobOffer = {
  source: ScraperSource;
  sourceUrl: string;
  externalId?: string;
  raw: unknown;
  scrapedAt: Date;
};

export type NormalizedJobOffer = {
  source: ScraperSource;
  sourceUrl: string;
  externalId?: string;
  title: string;
  companyName?: string;
  country?: string;
  city?: string;
  contractType?: string;
  durationMonths?: number;
  description: string;
  requirements?: string;
  publishedAt?: Date;
  expiresAt?: Date;
  rawData: unknown;
};

export interface JobScraper {
  source: ScraperSource;
  extract(): Promise<RawJobOffer[]>;
  normalize(raw: RawJobOffer): Promise<NormalizedJobOffer>;
}
```

Quand une nouvelle source est ajoutee, elle doit implementer ce contrat et etre enregistree explicitement dans le worker. L'ajout d'une source ne doit pas changer les pages frontend ni le modele public des offres, sauf si un nouveau champ normalise devient vraiment necessaire.

### `packages/scraper-business-france`

Implementation specifique Business France V.I.E.

Responsabilites:

- Naviguer sur le site Business France V.I.E.
- Recuperer les URLs et details d'offres.
- Parser les champs disponibles.
- Mapper les champs vers le format commun.

Ce package ne doit pas connaitre le frontend. Il doit seulement produire des offres normalisees.

Contraintes specifiques:

- Respecter des delais entre pages et details d'offres.
- Limiter le nombre de pages en mode developpement.
- Produire des erreurs exploitables quand un selecteur HTML change.
- Conserver `rawData` pour diagnostiquer les ecarts de parsing sans relancer tout le scraping.

### `packages/db`

Acces base de donnees.

Responsabilites:

- Schema Prisma.
- Client Prisma partage.
- Repositories pour les offres, utilisateurs, documents et runs de scraping.
- Migrations.
- Fonctions d'upsert et de requete reutilisables par `apps/web` et `apps/worker`.

Le schema Prisma vit dans ce package pour eviter les definitions dupliquees entre le web et le worker.

### `packages/ai`

Module reserve a la future partie IA.

Responsabilites futures:

- Agents OpenAI.
- Analyse d'offre.
- Matching profil/offre.
- Generation de CV cible.
- Generation de lettre.
- Outils agents pour lire le profil, lire une offre et produire des documents.

Ce package peut rester quasiment vide en V1.

### `packages/documents`

Generation et gestion documentaire.

Responsabilites:

- Modeles de CV.
- Modeles de lettres.
- Export DOCX/PDF.
- Parsing eventuel de CV importes.

En V1, il sert surtout a cadrer l'endroit ou iront les documents utilisateur.

## Modele de donnees initial

### `users`

Gere par Supabase Auth.

### `user_profiles`

Profil candidat lie a un utilisateur.

Champs principaux:

- `id`
- `user_id`
- `first_name`
- `last_name`
- `phone`
- `location`
- `target_roles`
- `target_countries`
- `skills`
- `languages`
- `created_at`
- `updated_at`

### `user_documents`

Documents deposes ou generes.

Champs principaux:

- `id`
- `user_id`
- `type`: `base_resume`, `tailored_resume`, `cover_letter`, `other`
- `file_name`
- `storage_path`
- `mime_type`
- `size_bytes`
- `checksum`
- `created_at`

### `job_offers`

Offres normalisees.

Champs principaux:

- `id`
- `source`
- `external_id`
- `source_url`
- `title`
- `company_name`
- `country`
- `city`
- `contract_type`
- `duration_months`
- `salary`
- `description`
- `requirements`
- `published_at`
- `expires_at`
- `scraped_at`
- `content_hash`
- `raw_data`
- `is_active`
- `created_at`
- `updated_at`

Contraintes recommandees:

- Unique sur `source + external_id` quand `external_id` existe.
- Unique fallback sur `source + source_url`.
- `content_hash` pour detecter les modifications.
- `is_active` pour masquer une offre disparue de la source sans la supprimer immediatement.

### `scrape_runs`

Historique des executions de scraping.

Champs principaux:

- `id`
- `source`
- `status`: `running`, `success`, `partial_success`, `failed`
- `started_at`
- `finished_at`
- `offers_found`
- `offers_created`
- `offers_updated`
- `offers_failed`
- `error_message`

### `saved_jobs`

Offres sauvegardees par un utilisateur.

Champs principaux:

- `id`
- `user_id`
- `job_offer_id`
- `created_at`

### `applications`

Suivi simple de candidature.

Champs principaux:

- `id`
- `user_id`
- `job_offer_id`
- `status`: `saved`, `to_apply`, `applied`, `interview`, `rejected`, `accepted`
- `notes`
- `applied_at`
- `created_at`
- `updated_at`

## Pipeline ETL

La pipeline de scraping doit etre commune a toutes les sources.

```txt
1. Start scrape run
2. Extract raw offers from source
3. Normalize each raw offer
4. Validate required fields
5. Compute dedupe keys and content hash
6. Upsert job offer
7. Mark missing offers as inactive when the run is complete and reliable
8. Record created/updated/unchanged/failed counts
9. Close scrape run
```

### Extraction

Recupere les donnees depuis la source.

Pour Business France, Playwright est recommande car le site peut avoir du contenu dynamique, des filtres et de la pagination.

### Normalisation

Convertit une offre source vers `NormalizedJobOffer`.

Objectif: le reste de l'application ne doit jamais dependre de la structure Business France.

### Validation

Champs minimum requis:

- `source`
- `sourceUrl`
- `title`
- `description`

Les autres champs peuvent etre optionnels au depart.

### Deduplication

Ordre de priorite:

1. `source + externalId`
2. `source + sourceUrl`
3. `source + normalized title + company + country`, seulement en fallback prudent

### Persistance

L'ecriture doit faire un upsert:

- Creation si nouvelle offre.
- Mise a jour si l'offre existe et que `content_hash` a change.
- Rien si l'offre existe sans changement.
- Desactivation prudente si une offre auparavant presente n'est plus retrouvee lors d'un run complet.

Une suppression physique doit rester exceptionnelle. Garder les offres inactives aide a conserver l'historique, les sauvegardes utilisateur et les candidatures liees.

## Authentification

Supabase Auth est le choix le plus simple pour garder le projet gratuit et auto-hebergeable.

Fonctionnalites de la phase compte:

- Connexion email/password.
- Session utilisateur.
- Profil candidat.
- Upload de documents rattaches au compte.

Les politiques RLS Supabase devront garantir:

- Un utilisateur ne peut lire que son profil.
- Un utilisateur ne peut lire que ses documents.
- Les offres sont lisibles publiquement ou par les utilisateurs connectes selon le choix produit.

Pour limiter le verrouillage, le coeur metier ne doit pas supposer que l'auth est forcement Supabase. Supabase Auth peut etre l'implementation de la phase compte, mais les tables applicatives doivent rester lisibles comme des tables PostgreSQL classiques.

## Gestion des cles API IA

La partie IA n'est pas en V1.

Pour la future version, trois strategies sont possibles:

1. Ne pas stocker les cles API utilisateur. L'utilisateur la fournit au moment de generer.
2. Stocker une cle chiffree cote serveur.
3. Utiliser une cle plateforme avec quotas ou credits.

Pour un projet open source gratuit, la strategie recommandee au debut est:

- Ne pas stocker les cles API.
- Permettre a l'utilisateur d'utiliser sa propre cle au moment de la generation.
- Ajouter le stockage chiffre seulement si l'usage le justifie.

## Phasage technique

### Phase 1: Scraper et ETL

Objectif: obtenir une base fiable d'offres Business France.

Livrables:

- Monorepo initialise.
- Prisma + Supabase PostgreSQL.
- Schema `job_offers` et `scrape_runs`.
- `scraper-core`.
- `scraper-business-france`.
- Script CLI de scraping.
- Upsert + deduplication.
- Logs d'execution.
- Tests unitaires sur normalisation, validation et deduplication.
- Mode dry-run pour verifier un scraping sans ecriture en base.

### Phase 2: Auth et comptes

Objectif: permettre a un utilisateur d'avoir un espace personnel avant d'ajouter les workflows personnalises.

Livrables:

- Supabase Auth.
- Table `user_profiles`.
- Table `user_documents`.
- Upload de documents.
- Politiques RLS.
- Dashboard utilisateur minimal, meme si l'interface offres reste encore simple.

### Phase 3: Front offres et compte

Objectif: rendre la recherche d'offres agreable et connecter les offres au compte utilisateur.

Livrables:

- Liste d'offres.
- Recherche textuelle.
- Filtres simples.
- Page detail.
- Sauvegarde d'offres.
- Debut de suivi candidature.
- Consultation des documents utilisateur.

La consultation des offres peut rester publique. Les fonctionnalites personnelles, comme la sauvegarde, les documents et le suivi de candidature, exigent une session.

### Phase 4: IA

Objectif: adapter les candidatures.

Livrables:

- Integration OpenAI Agents SDK.
- Analyse d'une offre.
- Matching simple profil/offre.
- Generation de CV cible.
- Generation de lettre.
- Historique des documents generes.

## Strategie d'hebergement gratuit

Option simple:

- Application Next.js sur un serveur personnel.
- PostgreSQL Supabase gratuit, Neon gratuit, ou instance Postgres auto-hebergee.
- Supabase Storage gratuit ou stockage local compatible S3.
- Cron systeme pour lancer le scraper.

Option full auto-hebergee:

- Docker Compose.
- Next.js app.
- Worker Node.js.
- PostgreSQL.
- Supabase auto-heberge seulement si necessaire.
- MinIO pour stockage fichiers.

La V1 doit pouvoir tourner localement avec:

```txt
pnpm install
pnpm db:migrate
pnpm scrape:business-france
pnpm dev
```

Le deploiement cible minimal doit aussi fonctionner sans file de jobs, sans service IA et sans stockage objet externe. Ces briques doivent rester activables plus tard, pas necessaires au premier lancement.

## Risques et points d'attention

- Respect des conditions d'utilisation des sites scrapes.
- Eviter un scraping agressif: delais, pagination controlee, user-agent clair.
- Les structures HTML peuvent changer.
- Les cles API utilisateur sont sensibles.
- Les documents CV contiennent des donnees personnelles.
- RLS et permissions doivent etre traitees des la phase auth.
- Le scraping doit etre observable pour diagnostiquer les echecs.
- Playwright peut etre couteux en ressources sur un petit serveur: limiter la concurrence par defaut.
- Le couplage a Supabase doit rester volontaire: Postgres doit rester la base de portabilite.

## Decision recommandee pour demarrer

Demarrer par un monorepo `pnpm` avec:

- `apps/web`
- `apps/worker`
- `packages/db`
- `packages/scraper-core`
- `packages/scraper-business-france`
- `packages/shared`

Laisser `packages/ai` et `packages/documents` comme dossiers prevus mais non prioritaires, ou les creer seulement au moment de la phase correspondante.
