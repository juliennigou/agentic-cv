export { prisma } from "./client";
export { PrismaJobOfferRepository } from "./repositories/job-offer-repository";
export {
  acquireScrapeLock,
  completeScrapeRun,
  createScrapeRun,
  releaseScrapeLock
} from "./repositories/scrape-run-repository";
