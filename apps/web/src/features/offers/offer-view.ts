/**
 * Couche de vue pour les offres: types d'affichage dérivés du modèle `JobOffer`
 * et helpers de formatage. Le frontend ne lit que ces champs normalisés, jamais
 * de données spécifiques à une source (cf. cahier des charges).
 */

export type OfferListItem = {
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
  userState?: OfferUserState;
};

export type OfferDetail = OfferListItem & {
  source: string;
  salary: string | null;
  requirements: string | null;
  scrapedAt: Date;
};

export type OfferApplicationStatus =
  | "saved"
  | "unread"
  | "read"
  | "to_apply"
  | "in_progress"
  | "applied"
  | "completed"
  | "interview"
  | "rejected"
  | "accepted";

export type OfferUserState = {
  favorite: boolean;
  applicationStatus: OfferApplicationStatus | null;
};

export function formatLocation(city: string | null, country: string | null): string | null {
  const value = [city, country].filter(Boolean).join(", ");
  return value.length > 0 ? value : null;
}

export function formatDuration(durationMonths: number | null): string | null {
  if (!durationMonths) {
    return null;
  }
  return `${durationMonths} mois`;
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});

export function formatDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  return dateFormatter.format(date);
}

export function excerpt(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) {
    return clean;
  }
  return `${clean.slice(0, max).trimEnd()}…`;
}
