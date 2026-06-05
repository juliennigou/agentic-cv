import type { ScrapeRunResult } from "@agentic-cv/scraper-core";
import { Prisma } from "@prisma/client";

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
      offersDeactivated: result.deactivated,
      offersFailed: result.failed,
      errorMessage: result.errors.length > 0 ? result.errors.join("\n") : null
    }
  });
}

export async function acquireScrapeLock(
  source: string,
  options: { runId?: string; ttlMs: number }
): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + options.ttlMs);

  await prisma.scrapeLock.deleteMany({
    where: {
      source,
      expiresAt: {
        lt: now
      }
    }
  });

  try {
    await prisma.scrapeLock.create({
      data: {
        source,
        runId: options.runId,
        lockedAt: now,
        expiresAt
      }
    });
    return true;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return false;
    }

    throw error;
  }
}

export async function releaseScrapeLock(source: string, runId?: string): Promise<void> {
  await prisma.scrapeLock.deleteMany({
    where: {
      source,
      ...(runId ? { runId } : {})
    }
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
