import { Prisma } from "@prisma/client";

import { prisma } from "../client";

/**
 * Matchs sémantiques profil ↔ offres récentes.
 *
 * Le calcul est set-based en SQL : pour chaque profil disposant d'un embedding,
 * on calcule la similarité cosinus `1 - (profil <=> offre)` contre les nouvelles
 * offres, et on upsert dans `job_matches` les paires au-dessus du seuil.
 * Prisma ne type pas `vector` → requêtes brutes encapsulées ici.
 */

/** Seuil de similarité cosinus minimal pour retenir une paire (ajustable). */
const MATCH_SCORE_THRESHOLD = 0.35;
/** Nombre maximal de matchs conservés par profil et par run (ajustable). */
const MATCHES_PER_USER_LIMIT = 30;
/** Fenêtre des « nouvelles offres » à matcher. */
const NEW_OFFER_WINDOW_HOURS = 24;

const num = (n: number) => Prisma.raw(n.toString());

/**
 * Calcule et upsert les matchs des nouvelles offres pour tous les profils
 * embarqués. Renvoie le nombre de paires insérées (les matchs existants ne
 * sont pas dupliqués ; leur score est rafraîchi). Idempotent.
 */
export async function upsertJobOfferMatches(): Promise<number> {
  const inserted = await prisma.$executeRaw(Prisma.sql`
    INSERT INTO job_matches (id, user_id, job_offer_id, score, created_at)
    SELECT gen_random_uuid(), ranked.user_id, ranked.job_offer_id, ranked.score, now()
    FROM (
      SELECT
        p.user_id,
        o.id AS job_offer_id,
        (1 - (p.embedding <=> o.embedding))::float8 AS score,
        row_number() OVER (
          PARTITION BY p.user_id
          ORDER BY p.embedding <=> o.embedding ASC
        ) AS rank
      FROM user_profiles p
      JOIN job_offers o
        ON o.is_active
        AND o.embedding IS NOT NULL
        AND o.first_seen_at >= now() - make_interval(hours => ${num(NEW_OFFER_WINDOW_HOURS)})
      WHERE p.embedding IS NOT NULL
        AND (1 - (p.embedding <=> o.embedding)) >= ${num(MATCH_SCORE_THRESHOLD)}
    ) AS ranked
    WHERE ranked.rank <= ${num(MATCHES_PER_USER_LIMIT)}
    ON CONFLICT (user_id, job_offer_id)
    DO UPDATE SET score = EXCLUDED.score
  `);

  return inserted;
}

/** Champs d'affichage d'un match récent côté rapport in-app. */
export type RecentMatch = {
  jobOfferId: string;
  title: string;
  companyName: string | null;
  country: string | null;
  city: string | null;
  contractType: string | null;
  durationMonths: number | null;
  sourceUrl: string;
  score: number;
  createdAt: Date;
};

export type ListRecentMatchesOptions = {
  /** Fenêtre de fraîcheur des matchs (défaut : 24 h). */
  sinceHours?: number;
  /** Plafond de matchs renvoyés. */
  limit?: number;
};

const DEFAULT_SINCE_HOURS = 24;
const DEFAULT_LIST_LIMIT = 30;

/** Matchs récents d'un utilisateur, joints à l'offre, triés par score décroissant. */
export async function listRecentMatchesForUser(
  userId: string,
  options: ListRecentMatchesOptions = {}
): Promise<RecentMatch[]> {
  const sinceHours = options.sinceHours ?? DEFAULT_SINCE_HOURS;
  const limit = options.limit ?? DEFAULT_LIST_LIMIT;

  return prisma.$queryRaw<RecentMatch[]>(Prisma.sql`
    SELECT
      o.id::text AS "jobOfferId",
      o.title,
      o.company_name AS "companyName",
      o.country,
      o.city,
      o.contract_type AS "contractType",
      o.duration_months AS "durationMonths",
      o.source_url AS "sourceUrl",
      m.score,
      m.created_at AS "createdAt"
    FROM job_matches m
    JOIN job_offers o ON o.id = m.job_offer_id
    WHERE m.user_id = ${userId}::uuid
      AND o.is_active
      AND m.created_at >= now() - make_interval(hours => ${num(sinceHours)})
    ORDER BY m.score DESC, m.created_at DESC
    LIMIT ${limit}
  `);
}

/** Match calculé à la volée contre l'ensemble des offres actives. */
export type ProfileMatch = {
  jobOfferId: string;
  title: string;
  companyName: string | null;
  country: string | null;
  city: string | null;
  contractType: string | null;
  durationMonths: number | null;
  salary: string | null;
  sourceUrl: string;
  score: number;
  /** Offre vue pour la première fois dans la fenêtre « nouvelles offres ». */
  isNew: boolean;
  /** L'offre est déjà dans les favoris de l'utilisateur. */
  isSaved: boolean;
};

/** Filtres rapides communs au rapport (liste et comptage). */
export type ProfileMatchFilters = {
  /** Code pays ISO alpha-2 (optionnel). */
  countryCode?: string | null;
  /** Revenu mensuel minimal en euros (optionnel). */
  minSalary?: number | null;
};

export type ListProfileMatchesOptions = ProfileMatchFilters & {
  /** Restreint aux offres récentes (fenêtre « nouvelles offres »). */
  onlyNew?: boolean;
  /** Pagination : nombre de matchs par page (défaut : 20). */
  limit?: number;
  /** Pagination : décalage (défaut : 0). */
  offset?: number;
};

/** Totaux par onglet du rapport (toutes offres vs. nouveautés). */
export type ProfileMatchCounts = {
  all: number;
  recent: number;
};

export type ProfileMatchesPage = {
  items: ProfileMatch[];
  /** Nombre total de matchs (top 25 %) après filtres, toutes pages confondues. */
  total: number;
};

const DEFAULT_PROFILE_MATCH_LIMIT = 20;
/** On ne retient que le quart le plus pertinent : score ≥ 75ᵉ percentile. */
const TOP_PERCENTILE = 0.75;

type ProfileMatchRow = ProfileMatch & { total: number };

/** Montant numérique extrait du salaire texte (« 2607.35 EUR » → 2607.35). */
const salaryAmount = Prisma.sql`NULLIF(regexp_replace(o.salary, '[^0-9.]', '', 'g'), '')::numeric`;

/** Fragment WHERE des filtres pays / revenu (partagé liste ↔ comptage). */
function buildMatchFilters(filters: ProfileMatchFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [];
  if (filters.countryCode) {
    parts.push(Prisma.sql`AND o.country_code = ${filters.countryCode}`);
  }
  if (typeof filters.minSalary === "number") {
    parts.push(Prisma.sql`AND ${salaryAmount} >= ${num(filters.minSalary)}`);
  }
  return parts.length > 0 ? Prisma.join(parts, " ") : Prisma.empty;
}

/**
 * Seuil de pertinence du rapport : score au 75ᵉ percentile de TOUTES les offres
 * actives pour ce profil. On ne garde que le quart supérieur (top 25 %), de
 * façon stable quels que soient les filtres pays/revenu appliqués ensuite.
 */
const cutoffCte = (userId: string) => Prisma.sql`
  cutoff AS (
    SELECT percentile_cont(${num(TOP_PERCENTILE)}) WITHIN GROUP (
      ORDER BY 1 - (p.embedding <=> o.embedding)
    ) AS min_score
    FROM user_profiles p
    JOIN job_offers o ON o.is_active AND o.embedding IS NOT NULL
    WHERE p.user_id = ${userId}::uuid AND p.embedding IS NOT NULL
  )
`;

/**
 * Classement personnalisé des offres actives par similarité avec le profil,
 * restreint au top 25 % le plus pertinent, filtrable (pays/revenu) et paginé —
 * les meilleures correspondances d'abord. `count(*) OVER ()` renvoie le total
 * filtré (avant LIMIT/OFFSET). Page vide si le profil n'a pas d'embedding.
 */
export async function listProfileMatches(
  userId: string,
  options: ListProfileMatchesOptions = {}
): Promise<ProfileMatchesPage> {
  const limit = options.limit ?? DEFAULT_PROFILE_MATCH_LIMIT;
  const offset = options.offset ?? 0;
  const newFilter = options.onlyNew
    ? Prisma.sql`AND o.first_seen_at >= now() - make_interval(hours => ${num(NEW_OFFER_WINDOW_HOURS)})`
    : Prisma.empty;
  const filters = buildMatchFilters(options);

  const rows = await prisma.$queryRaw<ProfileMatchRow[]>(Prisma.sql`
    WITH ${cutoffCte(userId)}
    SELECT
      o.id::text AS "jobOfferId",
      o.title,
      o.company_name AS "companyName",
      o.country,
      o.city,
      o.contract_type AS "contractType",
      o.duration_months AS "durationMonths",
      o.salary,
      o.source_url AS "sourceUrl",
      (1 - (p.embedding <=> o.embedding))::float8 AS score,
      (o.first_seen_at >= now() - make_interval(hours => ${num(NEW_OFFER_WINDOW_HOURS)})) AS "isNew",
      EXISTS (
        SELECT 1 FROM saved_jobs s
        WHERE s.user_id = p.user_id AND s.job_offer_id = o.id
      ) AS "isSaved",
      (count(*) OVER ())::int AS total
    FROM user_profiles p
    JOIN job_offers o ON o.is_active AND o.embedding IS NOT NULL
    CROSS JOIN cutoff c
    WHERE p.user_id = ${userId}::uuid
      AND p.embedding IS NOT NULL
      AND (1 - (p.embedding <=> o.embedding)) >= c.min_score
      ${newFilter}
      ${filters}
    ORDER BY score DESC, o.first_seen_at DESC
    LIMIT ${num(limit)} OFFSET ${num(offset)}
  `);

  const total = rows[0]?.total ?? 0;
  const items = rows.map(({ total: _total, ...match }) => match);
  return { items, total };
}

/**
 * Totaux par onglet (toutes vs. nouveautés des 24 h) dans le top 25 % pertinent,
 * après application des filtres pays/revenu — pour des compteurs d'onglets justes.
 */
export async function countProfileMatches(
  userId: string,
  filters: ProfileMatchFilters = {}
): Promise<ProfileMatchCounts> {
  const filterSql = buildMatchFilters(filters);

  const rows = await prisma.$queryRaw<ProfileMatchCounts[]>(Prisma.sql`
    WITH ${cutoffCte(userId)}
    SELECT
      count(*)::int AS all,
      count(*) FILTER (
        WHERE o.first_seen_at >= now() - make_interval(hours => ${num(NEW_OFFER_WINDOW_HOURS)})
      )::int AS recent
    FROM user_profiles p
    JOIN job_offers o ON o.is_active AND o.embedding IS NOT NULL
    CROSS JOIN cutoff c
    WHERE p.user_id = ${userId}::uuid
      AND p.embedding IS NOT NULL
      AND (1 - (p.embedding <=> o.embedding)) >= c.min_score
      ${filterSql}
  `);

  return rows[0] ?? { all: 0, recent: 0 };
}
