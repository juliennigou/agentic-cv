import { embedQuery } from "@agentic-cv/ai";
import { debugSearchJobOffers } from "@agentic-cv/db";

const query =
  process.argv
    .find((arg) => arg.startsWith("--query="))
    ?.split("=")[1]
    ?.trim() ?? "";
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1];
const limit = limitArg ? Number(limitArg) : 10;
const sortArg = process.argv.find((arg) => arg.startsWith("--sort="))?.split("=")[1];
const sort = sortArg === "date" || sortArg === "relevance" ? sortArg : "relevance";
const noEmbedding = process.argv.includes("--no-embedding");
const SEARCH_PAGE_SIZE = 50;

if (query.length === 0) {
  throw new Error('Usage: pnpm debug:search -- --query="inge ia"');
}

const queryVector = noEmbedding ? null : await embedQuery(query);
const debugLimit = sort === "date" ? SEARCH_PAGE_SIZE : limit;
const results = await debugSearchJobOffers({
  query,
  queryVector,
  limit: Number.isFinite(debugLimit) ? debugLimit : 10
});
const sortedResults =
  sort === "date"
    ? [...results].sort((left, right) => {
        const leftTime = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
        const rightTime = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;
        return rightTime - leftTime;
      })
    : results;
const displayedResults = sortedResults.slice(0, Number.isFinite(limit) ? limit : 10);

console.log(
  JSON.stringify(
    {
      query,
      sort,
      sortScope: sort === "date" ? "top 50 pertinence côté client" : "ranking DB",
      semanticEnabled: Boolean(queryVector),
      vectorDimension: queryVector?.length ?? null,
      results: displayedResults.map((offer, index) => ({
        position: index + 1,
        title: offer.title,
        companyName: offer.companyName,
        country: offer.country,
        publishedAt: offer.publishedAt,
        lexicalRank: offer.lexicalRank ? Number(offer.lexicalRank) : null,
        semanticRank: offer.semanticRank ? Number(offer.semanticRank) : null,
        recencyRank: offer.recencyRank ? Number(offer.recencyRank) : null,
        lexicalScore: offer.lexicalScore,
        semanticScore: offer.semanticScore,
        recencyScore: offer.recencyScore,
        totalScore: offer.totalScore
      }))
    },
    null,
    2
  )
);
