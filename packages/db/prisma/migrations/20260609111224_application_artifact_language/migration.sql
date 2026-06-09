-- Versions bilingues FR/EN des artefacts : langue par document + contrainte unique étendue.

-- CreateEnum
CREATE TYPE "ApplicationLanguage" AS ENUM ('fr', 'en');

-- AlterTable
ALTER TABLE "application_artifacts"
  ADD COLUMN "language" "ApplicationLanguage" NOT NULL DEFAULT 'fr';

-- DropIndex
DROP INDEX "application_artifacts_application_id_kind_key";

-- CreateIndex
CREATE UNIQUE INDEX "application_artifacts_application_id_kind_language_key" ON "application_artifacts"("application_id", "kind", "language");
