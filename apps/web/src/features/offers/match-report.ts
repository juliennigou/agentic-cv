import "server-only";

import {
  countProfileMatches,
  listProfileMatches,
  type ProfileMatch,
  type ProfileMatchCounts
} from "@agentic-cv/db";

/** Nombre de matchs affichés par page. */
export const MATCH_REPORT_PAGE_SIZE = 20;

/** Onglets du rapport : nouveautés des 24 h vs. ensemble du catalogue. */
export type ReportTab = "recent" | "all";

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

/** Totaux des deux onglets, pour les libellés. */
export function getMatchCounts(userId: string): Promise<ProfileMatchCounts> {
  return countProfileMatches(userId);
}

/**
 * Rapport de matching d'un utilisateur, paginé et classé par pertinence.
 * Onglet `recent` : nouveautés des 24 h. Onglet `all` : tout le catalogue actif.
 */
export async function getMatchReport(
  userId: string,
  tab: ReportTab,
  page: number
): Promise<MatchReport> {
  const pageSize = MATCH_REPORT_PAGE_SIZE;
  const { items, total } = await listProfileMatches(userId, {
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
