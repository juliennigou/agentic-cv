import { PrismaJobOfferRepository, completeScrapeRun, createScrapeRun } from "@agentic-cv/db";
import { BusinessFranceScraper } from "@agentic-cv/scraper-business-france";
import { runJobScraper } from "@agentic-cv/scraper-core";

export type BusinessFranceScrapeOptions = {
  dryRun?: boolean;
  maxPages?: number;
};

export async function runBusinessFranceScrape(options: BusinessFranceScrapeOptions = {}) {
  const scraper = new BusinessFranceScraper();
  const repository = new PrismaJobOfferRepository();
  const scrapeRunId = await createScrapeRun(scraper.source);

  const result = await runJobScraper(scraper, repository, {
    dryRun: options.dryRun,
    maxPages: options.maxPages
  });

  await completeScrapeRun(scrapeRunId, result);
  return result;
}

