-- Distingue les présentations entreprise générées par le LLM (entreprise connue,
-- faute de bloc société dans l'offre) des présentations extraites de l'offre.
-- Affichées avec un badge « IA » côté UI.
ALTER TABLE "job_offers"
  ADD COLUMN "company_description_generated" BOOLEAN NOT NULL DEFAULT false;
