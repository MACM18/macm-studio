ALTER TABLE "Lead"
  ADD COLUMN "confirmationEmailStatus" "DeliveryStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
  ADD COLUMN "confirmationEmailAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "confirmationEmailLastError" TEXT;

CREATE INDEX "Lead_confirmationEmailStatus_idx" ON "Lead"("confirmationEmailStatus");
