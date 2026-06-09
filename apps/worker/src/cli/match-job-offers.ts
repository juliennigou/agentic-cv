import { runMatchJobOffers } from "../runners/run-match-job-offers";

const batchSizeArg = process.argv.find((arg) => arg.startsWith("--batch-size="));
const batchSize = batchSizeArg ? Number(batchSizeArg.split("=")[1]) : undefined;
const maxProfilesArg = process.argv.find((arg) => arg.startsWith("--max-profiles="));
const maxProfiles = maxProfilesArg ? Number(maxProfilesArg.split("=")[1]) : undefined;

const result = await runMatchJobOffers({
  batchSize: Number.isFinite(batchSize) ? batchSize : undefined,
  maxProfiles: Number.isFinite(maxProfiles) ? maxProfiles : undefined
});

console.log(JSON.stringify(result, null, 2));
