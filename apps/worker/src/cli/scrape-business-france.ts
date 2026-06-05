import { runBusinessFranceScrape } from "../runners/run-business-france-scrape";

const args = new Set(process.argv.slice(2));
const maxPagesArg = process.argv.find((arg) => arg.startsWith("--max-pages="));
const maxPages = maxPagesArg ? Number(maxPagesArg.split("=")[1]) : undefined;
const maxOffersArg = process.argv.find((arg) => arg.startsWith("--max-offers="));
const maxOffers = maxOffersArg ? Number(maxOffersArg.split("=")[1]) : undefined;
const delayMsArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
const delayMs = delayMsArg ? Number(delayMsArg.split("=")[1]) : undefined;

const result = await runBusinessFranceScrape({
  dryRun: args.has("--dry-run"),
  deactivateMissing: !args.has("--no-deactivate-missing"),
  maxPages: Number.isFinite(maxPages) ? maxPages : undefined,
  maxOffers: Number.isFinite(maxOffers) ? maxOffers : undefined,
  delayMs: Number.isFinite(delayMs) ? delayMs : undefined
});

console.log(JSON.stringify(result, null, 2));
