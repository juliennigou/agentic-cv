import "server-only";

import { listProfileMatches, type ProfileMatch } from "@agentic-cv/db";

/** Nombre de matchs affichés par page. */
export const MATCH_REPORT_PAGE_SIZE = 20;

/** Match enrichi pour l'affichage : score normalisé en pourcentage entier. */
export type ReportMatch = ProfileMatch & {
  scorePercent: number;
};

export type MatchReport = {
  items: ReportMatch[];
  total: number;
  /** Page courante (1-indexée). */
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Normalise un numéro de page brut (query param) en entier ≥ 1. */
export function parseReportPage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}

/**
 * Rapport de matching d'un utilisateur sur l'ensemble des offres actives,
 * paginé et classé par pertinence. Les offres récentes sont marquées `isNew`.
 */
export async function getMatchReport(userId: string, page: number): Promise<MatchReport> {
  const pageSize = MATCH_REPORT_PAGE_SIZE;
  const { items, total } = await listProfileMatches(userId, {
    limit: pageSize,
    offset: (page - 1) * pageSize
  });

  return {
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
