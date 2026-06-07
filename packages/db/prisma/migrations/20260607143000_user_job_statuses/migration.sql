ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'unread';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'read';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'completed';
