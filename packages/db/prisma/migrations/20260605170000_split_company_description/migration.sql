-- AlterTable: présentation entreprise séparée de la mission
ALTER TABLE "job_offers" ADD COLUMN "company_description" TEXT;

-- Backfill depuis rawData (Business France) : on isole la présentation entreprise
-- et on remplace la description par la mission seule.
UPDATE "job_offers"
SET
  "company_description" = NULLIF("raw_data"->>'organizationPresentation', ''),
  "description" = COALESCE(NULLIF("raw_data"->>'missionDescription', ''), "description")
WHERE "source" = 'business_france_vie';

-- Le texte source de l'embedding a changé : on force le recalcul.
UPDATE "job_offers" SET "embedding" = NULL;
