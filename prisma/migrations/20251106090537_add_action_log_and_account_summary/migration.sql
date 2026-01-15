-- CreateEnum
CREATE TYPE "public"."LogAction" AS ENUM ('ACCOUNT_CREATED', 'ACCOUNT_UPDATED', 'ACCOUNT_BANNED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_ACTIVATED', 'PASSWORD_CHANGED', 'EMAIL_VERIFIED');

-- CreateTable
CREATE TABLE "public"."AccountLog" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "action" "public"."LogAction" NOT NULL,
    "performedBy" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSummary" (
    "id" TEXT NOT NULL,
    "totalUsers" INTEGER NOT NULL,
    "activeUsers" INTEGER NOT NULL,
    "suspendedUsers" INTEGER NOT NULL,
    "pendingUsers" INTEGER NOT NULL,
    "newUsers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountLog_accountId_idx" ON "public"."AccountLog"("accountId");

-- CreateIndex
CREATE INDEX "AccountLog_action_idx" ON "public"."AccountLog"("action");

-- CreateIndex
CREATE INDEX "AccountLog_createdAt_idx" ON "public"."AccountLog"("createdAt");

-- CreateIndex
CREATE INDEX "UserSummary_createdAt_idx" ON "public"."UserSummary"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."AccountLog" ADD CONSTRAINT "AccountLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
