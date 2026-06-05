import type { NormalizedJobOffer, RawJobOffer } from "@agentic-cv/scraper-core";

import type { BusinessFranceApiOfferDetail } from "./business-france-types";

export function mapBusinessFranceJob(rawOffer: RawJobOffer): NormalizedJobOffer {
  const rawJob = rawOffer.raw as BusinessFranceApiOfferDetail;
  const sourceId = getSourceId(rawJob);
  const description = [rawJob.organizationPresentation, rawJob.missionDescription].filter(Boolean).join("\n\n").trim();

  return {
    source: "business_france_vie",
    sourceUrl: rawOffer.sourceUrl,
    externalId: sourceId,
    title: rawJob.missionTitle?.trim() ?? `Offre VIE ${sourceId ?? "Business France"}`,
    companyName: rawJob.organizationName?.trim(),
    country: rawJob.countryName?.trim(),
    city: rawJob.cityName?.trim(),
    contractType: rawJob.missionType?.trim() ?? rawJob.missionTypeEn?.trim(),
    durationMonths: rawJob.missionDuration,
    salary: formatAllowance(rawJob.indemnite),
    description: description || rawJob.missionTitle?.trim() || "Description non disponible.",
    requirements: rawJob.missionProfile?.trim(),
    publishedAt: parseOptionalDate(rawJob.startBroadcastDate ?? rawJob.creationDate),
    expiresAt: parseOptionalDate(rawJob.endBroadcastDate),
    scrapedAt: rawOffer.scrapedAt,
    rawData: rawOffer.raw
  };
}

function parseOptionalDate(value: string | undefined): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getUTCFullYear() <= 1) {
    return undefined;
  }

  return date;
}

function getSourceId(rawJob: BusinessFranceApiOfferDetail): string | undefined {
  if (rawJob.id) {
    return String(rawJob.id);
  }

  return rawJob.reference?.replace(/^VIE/i, "");
}

function formatAllowance(value: number | undefined): string | undefined {
  if (typeof value !== "number") {
    return undefined;
  }

  return `${value.toFixed(2)} EUR`;
}
