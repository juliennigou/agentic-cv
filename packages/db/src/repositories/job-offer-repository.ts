import type { Prisma } from "@prisma/client";
import type { JobOfferRepository, NormalizedJobOffer } from "@agentic-cv/scraper-core";

import { prisma } from "../client";

type UpsertableJobOffer = NormalizedJobOffer & {
  contentHash: string;
};

export class PrismaJobOfferRepository implements JobOfferRepository {
  async upsertOffer(offer: UpsertableJobOffer): Promise<"created" | "updated" | "unchanged"> {
    const where = offer.externalId
      ? { source_externalId: { source: offer.source, externalId: offer.externalId } }
      : { source_sourceUrl: { source: offer.source, sourceUrl: offer.sourceUrl } };

    const existingOffer = await prisma.jobOffer.findUnique({ where });

    if (!existingOffer) {
      await prisma.jobOffer.create({ data: toJobOfferCreateInput(offer) });
      return "created";
    }

    if (existingOffer.contentHash === offer.contentHash) {
      return "unchanged";
    }

    await prisma.jobOffer.update({
      where: { id: existingOffer.id },
      data: toJobOfferUpdateInput(offer)
    });

    return "updated";
  }
}

function toJobOfferCreateInput(offer: UpsertableJobOffer): Prisma.JobOfferCreateInput {
  return {
    source: offer.source,
    externalId: offer.externalId,
    sourceUrl: offer.sourceUrl,
    title: offer.title,
    companyName: offer.companyName,
    country: offer.country,
    city: offer.city,
    contractType: offer.contractType,
    durationMonths: offer.durationMonths,
    salary: offer.salary,
    description: offer.description,
    requirements: offer.requirements,
    publishedAt: offer.publishedAt,
    expiresAt: offer.expiresAt,
    scrapedAt: offer.scrapedAt,
    contentHash: offer.contentHash,
    rawData: offer.rawData as Prisma.InputJsonValue,
    isActive: true
  };
}

function toJobOfferUpdateInput(offer: UpsertableJobOffer): Prisma.JobOfferUpdateInput {
  return {
    title: offer.title,
    companyName: offer.companyName,
    country: offer.country,
    city: offer.city,
    contractType: offer.contractType,
    durationMonths: offer.durationMonths,
    salary: offer.salary,
    description: offer.description,
    requirements: offer.requirements,
    publishedAt: offer.publishedAt,
    expiresAt: offer.expiresAt,
    scrapedAt: offer.scrapedAt,
    contentHash: offer.contentHash,
    rawData: offer.rawData as Prisma.InputJsonValue,
    isActive: true
  };
}

