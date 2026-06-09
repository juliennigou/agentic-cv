-- pgvector déjà activé (cf. 20260605160000_job_offer_embeddings).

-- Embedding sémantique du profil (1536 dim, aligné sur job_offers.embedding).
-- Accès uniquement via $queryRaw/$executeRaw (Prisma ne type pas vector).
ALTER TABLE "user_profiles" ADD COLUMN "embedding" vector(1536);
ALTER TABLE "user_profiles" ADD COLUMN "embedding_updated_at" TIMESTAMP(3);

-- Matchs profil ↔ offre récente (similarité cosinus 0–1).
-- CreateTable
CREATE TABLE "job_matches" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_offer_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_matches_user_id_job_offer_id_key" ON "job_matches"("user_id", "job_offer_id");

-- CreateIndex
CREATE INDEX "job_matches_user_id_created_at_idx" ON "job_matches"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_matches" ADD CONSTRAINT "job_matches_job_offer_id_fkey" FOREIGN KEY ("job_offer_id") REFERENCES "job_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
