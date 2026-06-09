/**
 * Constantes du rapport partagées entre le module serveur (`match-report.ts`,
 * marqué `server-only`) et le composant client de filtres (`report-filters.tsx`).
 * Aucun accès DB ici : ce fichier doit rester importable côté client.
 */

/** Tranches de revenu mensuel minimal (€) proposées en filtre rapide. */
export const SALARY_FILTER_STEPS = [2000, 2500, 3000, 3500, 4000] as const;
