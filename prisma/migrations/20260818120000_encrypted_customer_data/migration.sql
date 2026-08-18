ALTER TABLE "User" ADD COLUMN "companyEncrypted" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneEncrypted" TEXT;

ALTER TABLE "Lead" ADD COLUMN "phoneEncrypted" TEXT;
ALTER TABLE "Lead" ADD COLUMN "budgetSummaryEncrypted" TEXT;
ALTER TABLE "Lead" ADD COLUMN "notesEncrypted" TEXT;
ALTER TABLE "Lead" ADD COLUMN "scopeEncrypted" TEXT;

ALTER TABLE "Project" ADD COLUMN "summaryEncrypted" TEXT;
ALTER TABLE "ProjectUpdate" ADD COLUMN "bodyEncrypted" TEXT;
ALTER TABLE "ProjectLink" ADD COLUMN "urlEncrypted" TEXT;

ALTER TABLE "ProjectUpdate" ALTER COLUMN "body" DROP NOT NULL;
ALTER TABLE "ProjectLink" ALTER COLUMN "url" DROP NOT NULL;
