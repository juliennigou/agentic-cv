import { runEmbedJobOffers } from "../runners/run-embed-job-offers";

const batchSizeArg = process.argv.find((arg) => arg.startsWith("--batch-size="));
const batchSize = batchSizeArg ? Number(batchSizeArg.split("=")[1]) : undefined;
const maxOffersArg = process.argv.find((arg) => arg.startsWith("--max-offers="));
const maxOffers = maxOffersArg ? Number(maxOffersArg.split("=")[1]) : undefined;

const result = await runEmbedJobOffers({
  batchSize: Number.isFinite(batchSize) ? batchSize : undefined,
  maxOffers: Number.isFinite(maxOffers) ? maxOffers : undefined
});

console.log(JSON.stringify(result, null, 2));
