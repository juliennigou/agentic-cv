ALTER TABLE "applications" ALTER COLUMN "status" SET DEFAULT 'unread';
UPDATE "applications" SET "status" = 'unread' WHERE "status" = 'saved';
