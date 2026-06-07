import type { OfferApplicationStatus } from "./offer-view";

export const TRACKED_OFFER_STATUSES = [
  "unread",
  "read",
  "to_apply",
  "in_progress",
  "applied",
  "completed",
  "interview",
  "rejected",
  "accepted"
] as const;

export const OFFER_STATUS_LABELS: Record<OfferApplicationStatus, string> = {
  saved: "Sauvegardée",
  unread: "Non lue",
  read: "Lue",
  to_apply: "À postuler",
  in_progress: "En cours",
  applied: "Postulée",
  completed: "Terminée",
  interview: "Entretien",
  rejected: "Retour négatif",
  accepted: "Retour positif"
};

export function formatOfferStatus(status: OfferApplicationStatus | null): string {
  if (!status) {
    return "Non suivi";
  }

  return OFFER_STATUS_LABELS[status];
}

/**
 * Regroupement des 9 statuts suivis en 4 colonnes lisibles pour le board kanban
 * de la page « Mes VIE ». Source unique réutilisée par la vue kanban et le tri.
 */
export const OFFER_STATUS_GROUPS = [
  { key: "to_review", label: "À traiter", statuses: ["unread", "read"] },
  { key: "to_apply", label: "À postuler", statuses: ["to_apply"] },
  { key: "in_progress", label: "En cours", statuses: ["in_progress", "applied", "interview"] },
  { key: "closed", label: "Terminé", statuses: ["completed", "accepted", "rejected"] }
] as const satisfies ReadonlyArray<{
  key: string;
  label: string;
  statuses: ReadonlyArray<OfferApplicationStatus>;
}>;

export type OfferStatusGroupKey = (typeof OFFER_STATUS_GROUPS)[number]["key"];

/**
 * Renvoie la colonne kanban d'un statut. `null`/inconnu retombe sur « À traiter »
 * (les favoris fraîchement ajoutés démarrent en `unread`).
 */
export function groupForStatus(status: OfferApplicationStatus | null): OfferStatusGroupKey {
  if (!status) {
    return "to_review";
  }

  const group = OFFER_STATUS_GROUPS.find((candidate) =>
    (candidate.statuses as ReadonlyArray<OfferApplicationStatus>).includes(status)
  );

  return group?.key ?? "to_review";
}
