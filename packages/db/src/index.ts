export { prisma } from "./client";
export { PrismaJobOfferRepository } from "./repositories/job-offer-repository";
export {
  listOffersNeedingEmbedding,
  setOfferEmbedding,
  type OfferNeedingEmbedding
} from "./repositories/job-offer-embedding-repository";
export {
  listOffersNeedingStructuring,
  setOfferStructured,
  type OfferNeedingStructuring
} from "./repositories/job-offer-structuring-repository";
export {
  searchJobOffers,
  listActiveOfferCountries,
  type SearchJobOffersParams,
  type JobOfferSearchResult,
  type OfferCountry
} from "./repositories/job-offer-search-repository";
export {
  getJobOfferById,
  listActiveJobOffers,
  type JobOfferDetail,
  type JobOfferListItem
} from "./repositories/job-offer-read";
export {
  getOrCreateUserProfile,
  updateUserProfile,
  type UserProfileDetail,
  type UserProfileInput,
  type UserProfileUpdateInput
} from "./repositories/user-profile-repository";
export {
  acquireScrapeLock,
  completeScrapeRun,
  createScrapeRun,
  releaseScrapeLock
} from "./repositories/scrape-run-repository";
