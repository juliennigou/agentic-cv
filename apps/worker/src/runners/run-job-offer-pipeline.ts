import {
  runBusinessFranceScrape,
  type BusinessFranceScrapeOptions
} from "./run-business-france-scrape";
import {
  runEmbedJobOffers,
  type EmbedJobOffersOptions,
  type EmbedJobOffersResult
} from "./run-embed-job-offers";
import {
  runStructureJobOffers,
  type StructureJobOffersOptions,
  type StructureJobOffersResult
} from "./run-structure-job-offers";

export type JobOfferPipelineOptions = {
  scrape?: BusinessFranceScrapeOptions;
  structure?: StructureJobOffersOptions;
  embed?: EmbedJobOffersOptions;
  log?: (message: string) => void;
};

export type JobOfferPipelineResult = {
  status: "success" | "skipped" | "partial_success" | "failed";
  scrape: Awaited<ReturnType<typeof runBusinessFranceScrape>>;
  structure: StructureJobOffersResult | null;
  embed: EmbedJobOffersResult | null;
  errors: string[];
};

function mergeStatus(result: JobOfferPipelineResult): JobOfferPipelineResult["status"] {
  const statuses = [result.scrape.status, result.structure?.status, result.embed?.status].filter(
    (status): status is Exclude<typeof status, undefined> => status !== undefined
  );

  if (statuses.includes("failed")) {
    return "failed";
  }
  if (statuses.includes("partial_success")) {
    return "partial_success";
  }
  if (statuses.every((status) => status === "skipped")) {
    return "skipped";
  }
  return "success";
}

function collectErrors(result: JobOfferPipelineResult): string[] {
  return [
    ...result.scrape.errors,
    ...(result.structure?.errors ?? []),
    ...(result.embed?.errors ?? [])
  ];
}

/**
 * Pipeline quotidienne complète :
 * scrape Business France → structure les offres → calcule les embeddings.
 */
export async function runJobOfferPipeline(
  options: JobOfferPipelineOptions = {}
): Promise<JobOfferPipelineResult> {
  options.log?.("[pipeline] scrape started");
  const scrape = await runBusinessFranceScrape(options.scrape);
  options.log?.(
    `[pipeline] scrape done: status=${scrape.status}, found=${scrape.found}, created=${scrape.created}, updated=${scrape.updated}, unchanged=${scrape.unchanged}, deactivated=${scrape.deactivated}, failed=${scrape.failed}`
  );
  const result: JobOfferPipelineResult = {
    status: "success",
    scrape,
    structure: null,
    embed: null,
    errors: []
  };

  if (options.scrape?.dryRun) {
    result.status = "skipped";
    result.errors = ["Dry run : structuration et embedding ignorés."];
    options.log?.("[pipeline] dry run: structure/embed skipped");
    return result;
  }

  if (scrape.status === "failed") {
    result.status = "failed";
    result.errors = collectErrors(result);
    options.log?.("[pipeline] failed after scrape");
    return result;
  }

  result.structure = await runStructureJobOffers({
    ...options.structure,
    log: options.structure?.log ?? options.log
  });

  if (result.structure.status === "failed") {
    result.status = "failed";
    result.errors = collectErrors(result);
    options.log?.("[pipeline] failed after structure");
    return result;
  }

  result.embed = await runEmbedJobOffers({
    ...options.embed,
    log: options.embed?.log ?? options.log
  });
  result.status = mergeStatus(result);
  result.errors = collectErrors(result);
  options.log?.(`[pipeline] done: status=${result.status}, errors=${result.errors.length}`);

  return result;
}
