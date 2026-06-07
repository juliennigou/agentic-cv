-- CV structuré extrait du PDF déposé, stocké en JSON sur le profil candidat.
-- Forme validée par `resumeSchema` (@agentic-cv/shared) à l'écriture.
ALTER TABLE "user_profiles" ADD COLUMN "resume_data" JSONB;
