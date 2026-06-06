-- Marqueur d'idempotence pour la passe de structuration LLM (mission ↔ entreprise).
-- NULL = offre à (re)structurer. Toutes les offres existantes repassent donc
-- automatiquement par la passe de structuration au prochain run.
ALTER TABLE "job_offers" ADD COLUMN "structured_at" TIMESTAMP(3);
