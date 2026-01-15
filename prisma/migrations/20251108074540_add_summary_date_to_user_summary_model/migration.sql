/*
  Warnings:

  - Added the required column `summaryDate` to the `UserSummary` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."UserSummary_createdAt_idx";

-- AlterTable
ALTER TABLE "public"."UserSummary" ADD COLUMN     "summaryDate" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "UserSummary_summaryDate_idx" ON "public"."UserSummary"("summaryDate");
