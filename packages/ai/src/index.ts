export {
  EMBEDDING_DIMENSION,
  embedTexts,
  isEmbeddingConfigured,
  type EmbeddingTaskType
} from "./embeddings/gemini";

export {
  isStructuringConfigured,
  structureOffers,
  type OfferToStructure,
  type StructuredOffer
} from "./structuring/gemini";

export { embedQuery } from "./search/query-embedding";
