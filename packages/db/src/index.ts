export { prisma } from "./client";
export { PrismaJobOfferRepository } from "./repositories/job-offer-repository";
export {
  getJobOfferById,
  listActiveJobOffers,
  type JobOfferDetail,
  type JobOfferListItem
} from "./repositories/job-offer-read";
export {
  acquireScrapeLock,
  completeScrapeRun,
  createScrapeRun,
  releaseScrapeLock
} from "./repositories/scrape-run-repository";
