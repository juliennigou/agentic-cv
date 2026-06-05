import { runBusinessFranceScrape } from "../runners/run-business-france-scrape";

const args = new Set(process.argv.slice(2));
const maxPagesArg = process.argv.find((arg) => arg.startsWith("--max-pages="));
const maxPages = maxPagesArg ? Number(maxPagesArg.split("=")[1]) : undefined;

const result = await runBusinessFranceScrape({
  dryRun: args.has("--dry-run"),
  maxPages: Number.isFinite(maxPages) ? maxPages : undefined
});

console.log(JSON.stringify(result, null, 2));

