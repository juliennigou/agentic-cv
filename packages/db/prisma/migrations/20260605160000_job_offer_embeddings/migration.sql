-- Enable pgvector (idempotent ; déjà présent sur Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable: colonne d'embedding sémantique (Gemini, 768 dim)
ALTER TABLE "job_offers" ADD COLUMN "embedding" vector(768);

-- Index ANN pour la recherche par similarité cosinus
CREATE INDEX "job_offers_embedding_idx" ON "job_offers" USING hnsw ("embedding" vector_cosine_ops);
