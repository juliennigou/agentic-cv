-- Recherche hybride : filtre géo robuste (code ISO) + index full-text français.

-- Code pays ISO alpha-2, extrait du raw Business France (raw_data.countryId).
ALTER TABLE "job_offers" ADD COLUMN "country_code" TEXT;
UPDATE "job_offers" SET "country_code" = NULLIF("raw_data"->>'countryId', '');
CREATE INDEX "job_offers_country_code_idx" ON "job_offers" ("country_code");

-- Vecteur full-text généré (français) sur titre + mission + entreprise.
-- Colonne STORED -> reste à jour automatiquement, indexable en GIN.
ALTER TABLE "job_offers" ADD COLUMN "fts" tsvector GENERATED ALWAYS AS (
  to_tsvector(
    'french',
    coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("company_name", '')
  )
) STORED;
CREATE INDEX "job_offers_fts_idx" ON "job_offers" USING gin ("fts");
