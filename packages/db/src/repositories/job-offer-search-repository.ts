import { Prisma } from "@prisma/client";

import { prisma } from "../client";

/**
 * Recherche hybride des offres (Reciprocal Rank Fusion).
 *
 * Fusionne trois classements par les rangs (échelles incompatibles autrement) :
 *  - sémantique  : distance cosinus `embedding <=> requête` (si vecteur fourni) ;
 *  - lexical     : full-text français `ts_rank_cd(fts, websearch_to_tsquery)` ;
 *  - récence     : `published_at DESC` (signal faible).
 * Score = Σ poids · 1/(k + rang). Filtres appliqués dans le sous-ensemble `filtered`.
 *
 * Recherche EXACTE sur le sous-ensemble filtré (~800 offres) : recall parfaite,
 * pas de souci de post-filtrage HNSW. Dégrade proprement (full-text seul) si le
 * vecteur de requête est absent (Gemini indispo). Requête vide → tri par date.
 *
 * Détail : docs/recherche-hybride.md
 */

/** Constantes RRF, ajustables. */
const RRF_K = 50;
const CANDIDATES = 40;
const RECENCY_POOL = 1000;
const WEIGHT_LEXICAL = 1.0;
const WEIGHT_SEMANTIC = 1.0;
const WEIGHT_RECENCY = 0.3;
const DEFAULT_PAGE_SIZE = 50;

const num = (n: number) => Prisma.raw(n.toString());

export type SearchJobOffersParams = {
  /** Texte libre (optionnel). Vide → mode « parcourir » trié par date. */
  query?: string;
  /** Codes pays ISO (déjà résolus depuis région + affinage). Vide → tous pays. */
  countryCodes?: string[];
  /** Filtre type de contrat (optionnel). */
  contractType?: string | null;
  /** Vecteur d'embedding de la requête, ou null si indisponible. */
  queryVector?: number[] | null;
  limit?: number;
  offset?: number;
};

/** Champs exposés au frontend (même forme que JobOfferListItem). */
export type JobOfferSearchResult = {
  id: string;
  title: string;
  sourceUrl: string;
  companyName: string | null;
  country: string | null;
  city: string | null;
  contractType: string | null;
  durationMonths: number | null;
  description: string;
  publishedAt: Date | null;
};

const SELECT_FIELDS = Prisma.sql`
  f.id::text AS id,
  f.title,
  f.source_url AS "sourceUrl",
  f.company_name AS "companyName",
  f.country,
  f.city,
  f.contract_type AS "contractType",
  f.duration_months AS "durationMonths",
  f.description,
  f.published_at AS "publishedAt"
`;

export type OfferCountry = { code: string; name: string };

/** Pays distincts (code ISO + nom FR) présents parmi les offres actives. */
export async function listActiveOfferCountries(): Promise<OfferCountry[]> {
  return prisma.$queryRaw<OfferCountry[]>`
    SELECT DISTINCT country_code AS code, country AS name
    FROM job_offers
    WHERE is_active = true
      AND country_code IS NOT NULL
      AND country IS NOT NULL
    ORDER BY country
  `;
}

function buildFilter(params: SearchJobOffersParams): Prisma.Sql {
  const conditions: Prisma.Sql[] = [Prisma.sql`is_active = true`];

  if (params.countryCodes && params.countryCodes.length > 0) {
    conditions.push(Prisma.sql`country_code = ANY(ARRAY[${Prisma.join(params.countryCodes)}])`);
  }
  if (params.contractType) {
    conditions.push(Prisma.sql`contract_type = ${params.contractType}`);
  }

  return Prisma.join(conditions, " AND ");
}

export async function searchJobOffers(
  params: SearchJobOffersParams
): Promise<JobOfferSearchResult[]> {
  const limit = params.limit ?? DEFAULT_PAGE_SIZE;
  const offset = params.offset ?? 0;
  const query = params.query?.trim() ?? "";
  const where = buildFilter(params);

  // Mode « parcourir » : pas de texte → tri par date sur le sous-ensemble filtré.
  if (query.length === 0) {
    return prisma.$queryRaw<JobOfferSearchResult[]>(Prisma.sql`
      WITH filtered AS (SELECT * FROM job_offers WHERE ${where})
      SELECT ${SELECT_FIELDS}
      FROM filtered f
      ORDER BY f.published_at DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `);
  }

  // Mode recherche : RRF lexical (+ sémantique si vecteur) (+ récence faible).
  const ctes: Prisma.Sql[] = [Prisma.sql`filtered AS (SELECT * FROM job_offers WHERE ${where})`];
  const joins: Prisma.Sql[] = [];
  const scoreTerms: Prisma.Sql[] = [];
  const matchConds: Prisma.Sql[] = [];

  // Lexical (toujours présent en mode recherche).
  ctes.push(Prisma.sql`
    lexical AS (
      SELECT f.id,
        row_number() OVER (ORDER BY ts_rank_cd(f.fts, q.query) DESC) AS rank
      FROM filtered f, websearch_to_tsquery('french', ${query}) AS q(query)
      WHERE f.fts @@ q.query
      ORDER BY ts_rank_cd(f.fts, q.query) DESC
      LIMIT ${CANDIDATES}
    )
  `);
  joins.push(Prisma.sql`LEFT JOIN lexical l ON l.id = f.id`);
  scoreTerms.push(Prisma.sql`${num(WEIGHT_LEXICAL)} * coalesce(1.0 / (${num(RRF_K)} + l.rank), 0)`);
  matchConds.push(Prisma.sql`l.id IS NOT NULL`);

  // Sémantique (seulement si un vecteur de requête est disponible).
  if (params.queryVector && params.queryVector.length > 0) {
    const vectorLiteral = `[${params.queryVector.join(",")}]`;
    ctes.push(Prisma.sql`
      semantic AS (
        SELECT id,
          row_number() OVER (ORDER BY embedding <=> ${vectorLiteral}::vector) AS rank
        FROM filtered
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorLiteral}::vector
        LIMIT ${CANDIDATES}
      )
    `);
    joins.push(Prisma.sql`LEFT JOIN semantic s ON s.id = f.id`);
    scoreTerms.push(
      Prisma.sql`${num(WEIGHT_SEMANTIC)} * coalesce(1.0 / (${num(RRF_K)} + s.rank), 0)`
    );
    matchConds.push(Prisma.sql`s.id IS NOT NULL`);
  }

  // Récence (signal faible, toujours présent).
  ctes.push(Prisma.sql`
    recency AS (
      SELECT id, row_number() OVER (ORDER BY published_at DESC NULLS LAST) AS rank
      FROM filtered
      ORDER BY published_at DESC NULLS LAST
      LIMIT ${RECENCY_POOL}
    )
  `);
  joins.push(Prisma.sql`LEFT JOIN recency r ON r.id = f.id`);
  scoreTerms.push(Prisma.sql`${num(WEIGHT_RECENCY)} * coalesce(1.0 / (${num(RRF_K)} + r.rank), 0)`);

  return prisma.$queryRaw<JobOfferSearchResult[]>(Prisma.sql`
    WITH ${Prisma.join(ctes, ", ")}
    SELECT ${SELECT_FIELDS}
    FROM filtered f
    ${Prisma.join(joins, " ")}
    WHERE ${Prisma.join(matchConds, " OR ")}
    ORDER BY (${Prisma.join(scoreTerms, " + ")}) DESC, f.published_at DESC NULLS LAST
    LIMIT ${limit} OFFSET ${offset}
  `);
}
