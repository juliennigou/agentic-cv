-- Workspace de candidature : artefacts recollés depuis ChatGPT + état de validation.

-- CreateEnum
CREATE TYPE "ApplicationArtifactKind" AS ENUM ('targeted_resume', 'cover_letter', 'recruiter_message');

-- CreateEnum
CREATE TYPE "ApplicationArtifactStatus" AS ENUM ('draft', 'pasted', 'validated');

-- AlterTable
ALTER TABLE "applications"
  ADD COLUMN "chatgpt_conversation_url" TEXT,
  ADD COLUMN "validated_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "application_artifacts" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "kind" "ApplicationArtifactKind" NOT NULL,
    "content_text" TEXT,
    "status" "ApplicationArtifactStatus" NOT NULL DEFAULT 'draft',
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "application_artifacts_application_id_idx" ON "application_artifacts"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_artifacts_application_id_kind_key" ON "application_artifacts"("application_id", "kind");

-- AddForeignKey
ALTER TABLE "application_artifacts" ADD CONSTRAINT "application_artifacts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
