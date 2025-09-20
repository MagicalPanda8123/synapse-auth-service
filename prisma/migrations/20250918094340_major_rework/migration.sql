/*
  Warnings:

  - You are about to drop the column `accountId` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the column `tokenHash` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the column `used` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[codeId]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codeId` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jti` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CodePurpose" AS ENUM ('VERIFY_EMAIL', 'RESET_PASSWORD');

-- DropForeignKey
ALTER TABLE "public"."PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VerificationToken" DROP CONSTRAINT "VerificationToken_accountId_fkey";

-- DropIndex
DROP INDEX "public"."RefreshToken_accountId_idx";

-- DropIndex
DROP INDEX "public"."VerificationToken_accountId_idx";

-- AlterTable
ALTER TABLE "public"."VerificationToken" DROP COLUMN "accountId",
DROP COLUMN "tokenHash",
DROP COLUMN "used",
ADD COLUMN     "codeId" TEXT NOT NULL,
ADD COLUMN     "jti" TEXT NOT NULL,
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."PasswordResetToken";

-- CreateTable
CREATE TABLE "public"."VerificationCode" (
    "id" TEXT NOT NULL,
    "purpose" "public"."CodePurpose" NOT NULL,
    "accountId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationCode_expiresAt_idx" ON "public"."VerificationCode"("expiresAt");

-- CreateIndex
CREATE INDEX "VerificationCode_accountId_purpose_used_idx" ON "public"."VerificationCode"("accountId", "purpose", "used");

-- CreateIndex
CREATE INDEX "RefreshToken_jti_idx" ON "public"."RefreshToken"("jti");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_codeId_key" ON "public"."VerificationToken"("codeId");

-- CreateIndex
CREATE INDEX "VerificationToken_revoked_idx" ON "public"."VerificationToken"("revoked");

-- AddForeignKey
ALTER TABLE "public"."VerificationCode" ADD CONSTRAINT "VerificationCode_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VerificationToken" ADD CONSTRAINT "VerificationToken_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "public"."VerificationCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
