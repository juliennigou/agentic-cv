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
