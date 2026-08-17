CREATE SCHEMA IF NOT EXISTS "public";
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "LeadStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "DeliveryStatus" AS ENUM ('NOT_ATTEMPTED', 'PENDING', 'SENT', 'FAILED');
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'IN_PROGRESS', 'REVIEW', 'ON_HOLD', 'COMPLETE', 'CANCELLED');
CREATE TYPE "PortalVisibility" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "MilestoneState" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETE');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'NOT_APPLICABLE');
CREATE TYPE "UpdateStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false, "image" TEXT,
  "company" TEXT, "phone" TEXT, "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Session" (
  "id" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "token" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  "ipAddress" TEXT, "userAgent" TEXT, "userId" TEXT NOT NULL, CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Account" (
  "id" TEXT NOT NULL, "accountId" TEXT NOT NULL, "providerId" TEXT NOT NULL, "userId" TEXT NOT NULL,
  "accessToken" TEXT, "refreshToken" TEXT, "idToken" TEXT, "accessTokenExpiresAt" TIMESTAMP(3),
  "refreshTokenExpiresAt" TIMESTAMP(3), "scope" TEXT, "password" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Verification" (
  "id" TEXT NOT NULL, "identifier" TEXT NOT NULL, "value" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RateLimit" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "count" INTEGER NOT NULL, "lastRequest" BIGINT NOT NULL,
  CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Lead" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL, "phone" TEXT, "projectType" TEXT NOT NULL,
  "budgetSummary" TEXT, "notes" TEXT, "scope" JSONB, "status" "LeadStatus" NOT NULL DEFAULT 'PENDING',
  "webhookStatus" "DeliveryStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED', "webhookAttempts" INTEGER NOT NULL DEFAULT 0,
  "webhookLastError" TEXT, "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "reviewedAt" TIMESTAMP(3),
  "approvedCustomerId" TEXT, "approvedById" TEXT, CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LeadSubmissionLimit" (
  "key" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 0, "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "LeadSubmissionLimit_pkey" PRIMARY KEY ("key")
);
CREATE TABLE "Project" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "summary" TEXT, "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
  "visibility" "PortalVisibility" NOT NULL DEFAULT 'DRAFT', "startDate" TIMESTAMP(3), "targetDate" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3), "ownerId" TEXT NOT NULL, "leadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectMilestone" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "sortOrder" INTEGER NOT NULL,
  "weight" INTEGER NOT NULL, "progress" INTEGER NOT NULL DEFAULT 0, "state" "MilestoneState" NOT NULL DEFAULT 'NOT_STARTED',
  "dueDate" TIMESTAMP(3), "completedAt" TIMESTAMP(3), "paymentAmount" INTEGER, "paymentCurrency" TEXT,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectUpdate" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "authorId" TEXT NOT NULL, "title" TEXT NOT NULL, "body" TEXT NOT NULL,
  "status" "UpdateStatus" NOT NULL DEFAULT 'DRAFT', "publishedAt" TIMESTAMP(3),
  "notificationStatus" "DeliveryStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED', "notificationError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ProjectLink" (
  "id" TEXT NOT NULL, "projectId" TEXT NOT NULL, "label" TEXT NOT NULL, "url" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProjectLink_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL, "actorId" TEXT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL, "entityId" TEXT NOT NULL,
  "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");
CREATE INDEX "Verification_expiresAt_idx" ON "Verification"("expiresAt");
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");
CREATE INDEX "Lead_status_submittedAt_idx" ON "Lead"("status", "submittedAt");
CREATE INDEX "Lead_email_idx" ON "Lead"("email");
CREATE INDEX "Lead_webhookStatus_idx" ON "Lead"("webhookStatus");
CREATE UNIQUE INDEX "Project_leadId_key" ON "Project"("leadId");
CREATE INDEX "Project_ownerId_visibility_idx" ON "Project"("ownerId", "visibility");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "ProjectMilestone_projectId_idx" ON "ProjectMilestone"("projectId");
CREATE INDEX "ProjectMilestone_paymentStatus_idx" ON "ProjectMilestone"("paymentStatus");
CREATE UNIQUE INDEX "ProjectMilestone_projectId_sortOrder_key" ON "ProjectMilestone"("projectId", "sortOrder");
CREATE INDEX "ProjectUpdate_projectId_status_publishedAt_idx" ON "ProjectUpdate"("projectId", "status", "publishedAt");
CREATE UNIQUE INDEX "ProjectLink_projectId_sortOrder_key" ON "ProjectLink"("projectId", "sortOrder");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_approvedCustomerId_fkey" FOREIGN KEY ("approvedCustomerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProjectLink" ADD CONSTRAINT "ProjectLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
