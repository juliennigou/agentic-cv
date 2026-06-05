-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ScrapeRunStatus" AS ENUM ('running', 'skipped', 'success', 'partial_success', 'failed');

-- CreateEnum
CREATE TYPE "UserDocumentType" AS ENUM ('base_resume', 'tailored_resume', 'cover_letter', 'other');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('saved', 'to_apply', 'applied', 'interview', 'rejected', 'accepted');

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "target_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_countries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_documents" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "UserDocumentType" NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_offers" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT,
    "source_url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company_name" TEXT,
    "country" TEXT,
    "city" TEXT,
    "contract_type" TEXT,
    "duration_months" INTEGER,
    "salary" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "scraped_at" TIMESTAMP(3) NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content_hash" TEXT NOT NULL,
    "raw_data" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_runs" (
    "id" UUID NOT NULL,
    "source" TEXT NOT NULL,
    "status" "ScrapeRunStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "offers_found" INTEGER NOT NULL DEFAULT 0,
    "offers_created" INTEGER NOT NULL DEFAULT 0,
    "offers_updated" INTEGER NOT NULL DEFAULT 0,
    "offers_unchanged" INTEGER NOT NULL DEFAULT 0,
    "offers_deactivated" INTEGER NOT NULL DEFAULT 0,
    "offers_failed" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "scrape_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrape_locks" (
    "source" TEXT NOT NULL,
    "run_id" UUID,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scrape_locks_pkey" PRIMARY KEY ("source")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_offer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_offer_id" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'saved',
    "notes" TEXT,
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "user_documents_user_id_idx" ON "user_documents"("user_id");

-- CreateIndex
CREATE INDEX "job_offers_source_is_active_idx" ON "job_offers"("source", "is_active");

-- CreateIndex
CREATE INDEX "job_offers_country_idx" ON "job_offers"("country");

-- CreateIndex
CREATE INDEX "job_offers_published_at_idx" ON "job_offers"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_offers_source_external_id_key" ON "job_offers"("source", "external_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_offers_source_source_url_key" ON "job_offers"("source", "source_url");

-- CreateIndex
CREATE INDEX "scrape_runs_source_started_at_idx" ON "scrape_runs"("source", "started_at");

-- CreateIndex
CREATE INDEX "scrape_locks_expires_at_idx" ON "scrape_locks"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_user_id_job_offer_id_key" ON "saved_jobs"("user_id", "job_offer_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_job_offer_id_key" ON "applications"("user_id", "job_offer_id");

-- AddForeignKey
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_offer_id_fkey" FOREIGN KEY ("job_offer_id") REFERENCES "job_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_offer_id_fkey" FOREIGN KEY ("job_offer_id") REFERENCES "job_offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

