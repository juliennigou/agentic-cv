import {
  runJobOfferPipeline,
  type JobOfferPipelineOptions
} from "../runners/run-job-offer-pipeline";

const args = new Set(process.argv.slice(2));

function numberArg(name: string): number | undefined {
  const value = process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];
  const parsed = value ? Number(value) : undefined;
  return Number.isFinite(parsed) ? parsed : undefined;
}

const options: JobOfferPipelineOptions = {
  scrape: {
    dryRun: args.has("--dry-run"),
    deactivateMissing: !args.has("--no-deactivate-missing"),
    maxPages: numberArg("max-pages"),
    maxOffers: numberArg("max-offers"),
    delayMs: numberArg("delay-ms")
  },
  structure: {
    batchSize: numberArg("structure-batch-size"),
    maxOffers: numberArg("structure-max-offers")
  },
  embed: {
    batchSize: numberArg("embed-batch-size"),
    maxOffers: numberArg("embed-max-offers")
  },
  match: {
    batchSize: numberArg("match-batch-size"),
    maxProfiles: numberArg("match-max-profiles")
  },
  log: (message) => console.error(`${new Date().toISOString()} ${message}`)
};

const result = await runJobOfferPipeline(options);

console.log(JSON.stringify(result, null, 2));
