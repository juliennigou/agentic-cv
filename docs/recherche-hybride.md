# Recherche hybride des offres (RRF : sémantique + full-text + filtres)

> Plan d'implémentation de référence. Objectif : une recherche **robuste et fiable**
> où l'utilisateur tape un texte (« ingénieur IA »), choisit une zone géographique
> (ex. Asie) et obtient les offres **actives** pertinentes, classées par pertinence.

## 1. Méthode retenue : Reciprocal Rank Fusion (RRF)

Méthode standard et éprouvée pour combiner recherche **sémantique** (pgvector) et
**full-text** (`tsvector`/`ts_rank`) sans calibrage fragile.

- On lance deux recherches séparées, chacune produit un **classement**.
- On fusionne par les **rangs** (pas les scores) : `score = Σ poids · 1/(k + rang)`, `k ≈ 50`.
- Raison : la distance cosinus (0–1) et `ts_rank` (flottant non borné) sont sur des
  échelles incompatibles ; les additionner directement est l'erreur classique.
- Gain mesuré dans la littérature : sémantique seul ≈ 62 % de précision → hybride ≈ 84 %.

Sources :

- Supabase, _Hybrid search_ (fonction `hybrid_search()` de référence, notre stack) —
  https://supabase.com/docs/guides/ai/hybrid-search
- ParadeDB, _Hybrid Search in PostgreSQL: The Missing Manual_ —
  https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual
- pgvector (post-filtrage HNSW & recall) —
  https://dev.to/mongodb/no-pre-filtering-in-pgvector-means-reduced-ann-recall-1aa1

### Adaptations pour notre cas

1. **Recherche exacte** sur le sous-ensemble filtré (~800 offres actives) : pas
   d'approximation HNSW, donc recall parfaite même sur un filtre sélectif (ex. « Asie »
   ≈ 30 offres). On rebranchera HNSW + _iterative index scans_ (pgvector ≥ 0.8) si le
   volume dépasse quelques milliers de lignes.
2. **Récence = 3ᵉ signal RRF à poids faible** (et non un tri secondaire bricolé) :
   `is_active` reste le _gate_, la pertinence domine, la fraîcheur donne un léger
   coup de pouce — sans casser les échelles.
3. **Dégradation gracieuse native** : si Gemini est indisponible/quota épuisé → la liste
   sémantique est vide → résultats = full-text seul. Si une offre n'a pas d'embedding →
   elle reste trouvable via le lexical. Requête vide → tri par date (mode « parcourir »).

## 2. Schéma & migration (`packages/db`)

Migration `*_job_offer_search` :

```sql
-- Code pays ISO alpha-2 (depuis raw_data.countryId), pour un filtrage géo robuste.
ALTER TABLE "job_offers" ADD COLUMN "country_code" TEXT;
UPDATE "job_offers" SET "country_code" = NULLIF(raw_data->>'countryId', '');
CREATE INDEX "job_offers_country_code_idx" ON "job_offers" ("country_code");

-- Vecteur full-text généré (français) sur titre + mission + entreprise.
ALTER TABLE "job_offers" ADD COLUMN "fts" tsvector GENERATED ALWAYS AS (
  to_tsvector('french',
    coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(company_name,''))
) STORED;
CREATE INDEX "job_offers_fts_idx" ON "job_offers" USING gin ("fts");
```

- Prisma : ajouter `countryCode String? @map("country_code")`. Le `fts` reste **hors
  Prisma** (géré en SQL, comme `embedding`).
- Scraper : `NormalizedJobOffer.countryCode` (depuis `rawJob.countryId`), report dans
  `toJobOfferCreateInput` / `toJobOfferUpdateInput`. Pas besoin dans le content-hash.

## 3. Taxonomie géographique (`packages/shared`)

Aucune notion de région dans les données → on la fournit, **clé = code ISO**.
7 régions couvrant les 76 pays présents (cas limites TR, MX, AM ajustables) :

| Région            | Codes ISO                                                                     |
| ----------------- | ----------------------------------------------------------------------------- |
| `europe`          | AT BE BG CH CZ DE DK EE ES FI GB GR HU IE IT LU MD MT NL NO PL PT RO SE SI SK |
| `asie`            | AM CN HK ID IN JP KH KR MY PH SG TH TW VN                                     |
| `moyen_orient`    | AE OM QA SA TR                                                                |
| `amerique_nord`   | CA US MX PR                                                                   |
| `amerique_latine` | AR BR CL CO PE                                                                |
| `afrique`         | AO CD CG CI DJ ET GA GN KE KM MA MG MR MU NG SN TG TN TZ UG                   |
| `oceanie`         | AU NZ                                                                         |

Helpers : `listRegions()`, `regionCountryCodes(region)`, `countriesForRegion(region)`.

## 4. Embedding de requête + cache (`packages/ai`)

- `embedQuery(text)` : `embedTexts([text], { taskType: "RETRIEVAL_QUERY" })`.
- **Cache mémoire** (clé = texte normalisé minuscule/trim, TTL ~10 min) pour économiser
  le quota sur requêtes répétées.
- Renvoie `null` proprement si Gemini indisponible → le RRF dégrade en lexical.

## 5. Repository `searchJobOffers()` (`packages/db`)

Un seul `$queryRaw` avec CTEs ; filtres appliqués **dans chaque sous-requête** :

```
filtered  → is_active + country_code = ANY($codes) si fourni (+ contractType, durée… opt.)
semantic  → row_number() OVER (ORDER BY embedding <=> $qvec) LIMIT $cand   (si $qvec non null)
lexical   → row_number() OVER (ORDER BY ts_rank_cd(fts, q) DESC) LIMIT $cand
            avec q = websearch_to_tsquery('french', $q)
recency   → row_number() OVER (ORDER BY published_at DESC) LIMIT $pool
final     → score = wSem/(k+rank_s) + wLex/(k+rank_l) + wRec/(k+rank_r)
            ORDER BY score DESC, published_at DESC NULLS LAST
            LIMIT $limit OFFSET $offset
```

- **Requête vide** (filtres seuls) → on saute semantic/lexical → tri `published_at DESC`.
- Params validés par Zod à la frontière (action serveur). Retourne le type
  `JobOfferListItem` existant (+ `score` interne, non exposé).

### Constantes par défaut (`SEARCH_DEFAULTS`, ajustables)

| Param                    | Défaut          |
| ------------------------ | --------------- |
| `rrfK`                   | 50              |
| candidats / côté         | 40              |
| `wLex` / `wSem` / `wRec` | 1.0 / 1.0 / 0.3 |
| taille de page           | 50              |

## 6. UI web (`apps/web`)

- `OffersPage` : lit `searchParams { q, region, country }`, appelle `searchJobOffers(...)`
  (déjà `force-dynamic`).
- `OfferSearch` : **formulaire GET** (submit → query params, 100 % serveur, zéro
  dépendance JS → robuste). Select **région** (taxonomie) + select **pays** dépendant
  (optionnel). Réutilise `OfferCard` + états vide / zéro résultat existants.

## 7. Séquencement & vérification

1. Migration + `pnpm db:generate` + backfill `country_code` (le `fts` se remplit seul).
2. **Full-text + filtres + RRF testables immédiatement** (sans dépendre du quota Gemini).
3. Le **sémantique s'allume** dès que les embeddings sont peuplés (rien à changer).
4. `pnpm typecheck` / `lint` / `format` verts à chaque étape.

## 8. Hors-scope (itérations futures)

- BM25 via `pg_search`/ParadeDB si `ts_rank` insuffisant (manque l'IDF global).
- HNSW + _iterative index scans_ si le volume grossit.
- Toggle UI « trier par date » ; facettes (durée, type de contrat) ; pagination avancée.
