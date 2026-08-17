-- Add direct delivery tracking without deleting historical n8n webhook metadata.
ALTER TABLE "Lead"
  ADD COLUMN "emailStatus" "DeliveryStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
  ADD COLUMN "emailAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "emailLastError" TEXT,
  ADD COLUMN "telegramStatus" "DeliveryStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
  ADD COLUMN "telegramAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "telegramLastError" TEXT;

CREATE INDEX "Lead_emailStatus_idx" ON "Lead"("emailStatus");
CREATE INDEX "Lead_telegramStatus_idx" ON "Lead"("telegramStatus");
