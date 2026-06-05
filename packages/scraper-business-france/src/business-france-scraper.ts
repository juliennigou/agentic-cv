import { chromium } from "playwright";
import type { JobScraper, RawJobOffer, ScraperExtractOptions } from "@agentic-cv/scraper-core";

import { mapBusinessFranceJob } from "./business-france-mapper";
import type { BusinessFranceRawJob } from "./business-france-types";

const DEFAULT_START_URL = "https://mon-vie-via.businessfrance.fr/offres/recherche";

export class BusinessFranceScraper implements JobScraper {
  readonly source = "business_france" as const;

  constructor(private readonly startUrl = DEFAULT_START_URL) {}

  async extract(options: ScraperExtractOptions = {}): Promise<RawJobOffer[]> {
    const maxPages = options.maxPages ?? 1;
    const delayMs = options.delayMs ?? 750;
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();
      await page.goto(this.startUrl, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(delayMs);

      const offers: RawJobOffer[] = [];

      for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
        const pageOffers = await this.extractCurrentPageOffers(page);
        offers.push(...pageOffers);

        const hasNextPage = await this.goToNextPage(page);
        if (!hasNextPage) {
          break;
        }

        await page.waitForTimeout(delayMs);
      }

      return offers;
    } finally {
      await browser.close();
    }
  }

  async normalize(raw: RawJobOffer) {
    return mapBusinessFranceJob(raw);
  }

  private async extractCurrentPageOffers(page: import("playwright").Page): Promise<RawJobOffer[]> {
    const scrapedAt = new Date();

    // Selectors are intentionally isolated here because Business France may change its HTML.
    // The first implementation should update these selectors after inspecting the live page.
    const rawJobs = await page.evaluate<BusinessFranceRawJob[]>(() => {
      const cards = Array.from(document.querySelectorAll("[data-testid='job-card'], article, .job-card"));
      const jobs: BusinessFranceRawJob[] = [];

      for (const card of cards) {
        const link = card.querySelector<HTMLAnchorElement>("a[href]");
        const title = card.querySelector<HTMLElement>("h2, h3, [data-testid='job-title']")?.innerText.trim();
        const sourceUrl = link?.href;

        if (!title || !sourceUrl) {
          continue;
        }

        jobs.push({
          title,
          sourceUrl,
          externalId: sourceUrl.split("/").filter(Boolean).at(-1),
          companyName: card.querySelector<HTMLElement>("[data-testid='company'], .company")?.innerText.trim(),
          country: card.querySelector<HTMLElement>("[data-testid='country'], .country")?.innerText.trim(),
          city: card.querySelector<HTMLElement>("[data-testid='city'], .city")?.innerText.trim(),
          description: card.textContent?.trim() ?? title
        });
      }

      return jobs;
    });

    return rawJobs.map((rawJob) => ({
      source: "business_france",
      sourceUrl: rawJob.sourceUrl,
      externalId: rawJob.externalId,
      raw: rawJob,
      scrapedAt
    }));
  }

  private async goToNextPage(page: import("playwright").Page): Promise<boolean> {
    const nextLink = page.locator("a[rel='next'], button[aria-label*='Suivant'], button:has-text('Suivant')").first();
    const count = await nextLink.count();

    if (count === 0 || !(await nextLink.isEnabled())) {
      return false;
    }

    await Promise.all([
      page.waitForLoadState("domcontentloaded").catch(() => undefined),
      nextLink.click()
    ]);

    return true;
  }
}
