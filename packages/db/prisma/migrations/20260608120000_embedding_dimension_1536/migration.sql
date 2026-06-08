-- Passage à la dimension native de text-embedding-3-small.
-- Les vecteurs 768 existants ne peuvent pas être castés en vector(1536) :
-- on les invalide et la passe d'embedding les recalculera.
DROP INDEX IF EXISTS "job_offers_embedding_idx";

UPDATE "job_offers"
SET "embedding" = NULL;

ALTER TABLE "job_offers"
  ALTER COLUMN "embedding" TYPE vector(1536);

CREATE INDEX "job_offers_embedding_idx"
  ON "job_offers"
  USING hnsw ("embedding" vector_cosine_ops);
