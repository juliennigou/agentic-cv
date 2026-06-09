import "server-only";

import {
  countProfileMatches,
  listProfileMatches,
  type ProfileMatch,
  type ProfileMatchCounts,
  type ProfileMatchFilters
} from "@agentic-cv/db";

import { SALARY_FILTER_STEPS } from "./match-report-constants";

/** Nombre de matchs affichés par page. */
export const MATCH_REPORT_PAGE_SIZE = 20;

/** Onglets du rapport : nouveautés des 24 h vs. ensemble du catalogue. */
export type ReportTab = "recent" | "all";

/** Filtres rapides résolus depuis les query params. */
export type ReportFilters = {
  countryCode: string | null;
  minSalary: number | null;
};

/** Match enrichi pour l'affichage : score normalisé en pourcentage entier. */
export type ReportMatch = ProfileMatch & {
  scorePercent: number;
};

export type MatchReport = {
  tab: ReportTab;
  items: ReportMatch[];
  total: number;
  /** Page courante (1-indexée). */
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Normalise l'onglet brut (query param) ; défaut : nouveautés des 24 h. */
export function parseReportTab(raw: string | string[] | undefined): ReportTab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "all" ? "all" : "recent";
}

/** Normalise un numéro de page brut (query param) en entier ≥ 1. */
export function parseReportPage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}

/** Normalise les filtres rapides (pays ISO alpha-2, revenu minimal). */
export function parseReportFilters(
  params: Record<string, string | string[] | undefined>
): ReportFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  const country = first(params.country).trim().toUpperCase();
  const minSalaryRaw = Number.parseInt(first(params.minSalary), 10);
  const minSalary = SALARY_FILTER_STEPS.includes(
    minSalaryRaw as (typeof SALARY_FILTER_STEPS)[number]
  )
    ? minSalaryRaw
    : null;

  return {
    countryCode: country.length > 0 ? country : null,
    minSalary
  };
}

function toDbFilters(filters: ReportFilters): ProfileMatchFilters {
  return { countryCode: filters.countryCode, minSalary: filters.minSalary };
}

/** Totaux des deux onglets (top 25 %, filtres appliqués), pour les libellés. */
export function getMatchCounts(
  userId: string,
  filters: ReportFilters
): Promise<ProfileMatchCounts> {
  return countProfileMatches(userId, toDbFilters(filters));
}

/**
 * Rapport de matching d'un utilisateur, restreint au top 25 % pertinent,
 * paginé et classé. Onglet `recent` : nouveautés des 24 h. Onglet `all` : tout
 * le catalogue actif. Les filtres pays/revenu s'appliquent dans les deux cas.
 */
export async function getMatchReport(
  userId: string,
  tab: ReportTab,
  page: number,
  filters: ReportFilters
): Promise<MatchReport> {
  const pageSize = MATCH_REPORT_PAGE_SIZE;
  const { items, total } = await listProfileMatches(userId, {
    ...toDbFilters(filters),
    onlyNew: tab === "recent",
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  return {
    tab,
    items: items.map((match) => ({
      ...match,
      scorePercent: Math.round(match.score * 100)
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}
