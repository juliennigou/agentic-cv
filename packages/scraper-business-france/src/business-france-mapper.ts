import type { NormalizedJobOffer, RawJobOffer } from "@agentic-cv/scraper-core";

import type { BusinessFranceRawJob } from "./business-france-types";

export function mapBusinessFranceJob(rawOffer: RawJobOffer): NormalizedJobOffer {
  const rawJob = rawOffer.raw as BusinessFranceRawJob;

  return {
    source: "business_france",
    sourceUrl: rawJob.sourceUrl,
    externalId: rawJob.externalId,
    title: rawJob.title,
    companyName: rawJob.companyName,
    country: rawJob.country,
    city: rawJob.city,
    contractType: rawJob.contractType,
    durationMonths: rawJob.durationMonths,
    salary: rawJob.salary,
    description: rawJob.description,
    requirements: rawJob.requirements,
    publishedAt: parseOptionalDate(rawJob.publishedAt),
    expiresAt: parseOptionalDate(rawJob.expiresAt),
    scrapedAt: rawOffer.scrapedAt,
    rawData: rawOffer.raw
  };
}

function parseOptionalDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

