import "server-only";

import { listRecentMatchesForUser, type RecentMatch } from "@agentic-cv/db";

/** Fenêtre du rapport : dernières 24 h de matchs. */
const REPORT_WINDOW_HOURS = 24;
const REPORT_LIMIT = 30;

/** Match enrichi pour l'affichage : score normalisé en pourcentage entier. */
export type DailyReportMatch = RecentMatch & {
  scorePercent: number;
};

/** Matchs récents (dernières 24 h) d'un utilisateur, prêts à afficher. */
export async function getDailyReport(userId: string): Promise<DailyReportMatch[]> {
  const matches = await listRecentMatchesForUser(userId, {
    sinceHours: REPORT_WINDOW_HOURS,
    limit: REPORT_LIMIT
  });

  return matches.map((match) => ({
    ...match,
    scorePercent: Math.round(match.score * 100)
  }));
}
