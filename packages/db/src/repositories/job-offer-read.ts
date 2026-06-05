import { prisma } from "../client";

/** Champs exposés au frontend pour une carte de liste. */
const listSelect = {
  id: true,
  title: true,
  sourceUrl: true,
  companyName: true,
  country: true,
  city: true,
  contractType: true,
  durationMonths: true,
  description: true,
  publishedAt: true
} as const;

/** Champs exposés au frontend pour la page détail. */
const detailSelect = {
  ...listSelect,
  source: true,
  salary: true,
  companyDescription: true,
  requirements: true,
  scrapedAt: true
} as const;

export type JobOfferListItem = Awaited<ReturnType<typeof listActiveJobOffers>>[number];
export type JobOfferDetail = NonNullable<Awaited<ReturnType<typeof getJobOfferById>>>;

export function listActiveJobOffers(limit = 50) {
  return prisma.jobOffer.findMany({
    where: { isActive: true },
    orderBy: [{ publishedAt: "desc" }, { scrapedAt: "desc" }],
    take: limit,
    select: listSelect
  });
}

export function getJobOfferById(id: string) {
  return prisma.jobOffer.findUnique({
    where: { id },
    select: detailSelect
  });
}
