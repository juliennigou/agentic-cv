import { z } from "zod";

import type { NormalizedJobOffer } from "../types";

const normalizedJobOfferSchema = z.object({
  source: z.literal("business_france"),
  sourceUrl: z.string().url(),
  title: z.string().min(1),
  description: z.string().min(1)
});

export function validateNormalizedJobOffer(offer: NormalizedJobOffer): void {
  normalizedJobOfferSchema.parse(offer);
}

