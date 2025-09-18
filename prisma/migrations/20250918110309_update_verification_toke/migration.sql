/*
  Warnings:

  - A unique constraint covering the columns `[jti]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_jti_key" ON "public"."VerificationToken"("jti");
