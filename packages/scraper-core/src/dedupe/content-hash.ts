import { createHash } from "node:crypto";

import type { NormalizedJobOffer } from "../types";

export function computeJobOfferContentHash(offer: NormalizedJobOffer): string {
  const stablePayload = {
    title: offer.title,
    companyName: offer.companyName,
    country: offer.country,
    city: offer.city,
    contractType: offer.contractType,
    durationMonths: offer.durationMonths,
    salary: offer.salary,
    description: offer.description,
    requirements: offer.requirements,
    publishedAt: offer.publishedAt?.toISOString(),
    expiresAt: offer.expiresAt?.toISOString()
  };

  return createHash("sha256").update(JSON.stringify(stablePayload)).digest("hex");
}

