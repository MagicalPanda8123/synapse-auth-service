-- AlterTable
ALTER TABLE "public"."UserSummary" ADD COLUMN     "newActiveUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "newBannedUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "newPendingUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "newSuspendedUsers" INTEGER NOT NULL DEFAULT 0;
