import type { ScrapeRunResult } from "@agentic-cv/scraper-core";

import { prisma } from "../client";

export async function createScrapeRun(source: string): Promise<string> {
  const scrapeRun = await prisma.scrapeRun.create({
    data: {
      source,
      status: "running"
    }
  });

  return scrapeRun.id;
}

export async function completeScrapeRun(scrapeRunId: string, result: ScrapeRunResult): Promise<void> {
  await prisma.scrapeRun.update({
    where: { id: scrapeRunId },
    data: {
      status: result.status,
      finishedAt: new Date(),
      offersFound: result.found,
      offersCreated: result.created,
      offersUpdated: result.updated,
      offersUnchanged: result.unchanged,
      offersFailed: result.failed,
      errorMessage: result.errors.length > 0 ? result.errors.join("\n") : null
    }
  });
}

