-- DropIndex
DROP INDEX "public"."Account_createdAt_idx";

-- CreateIndex
CREATE INDEX "Account_createdAt_id_idx" ON "public"."Account"("createdAt", "id");
