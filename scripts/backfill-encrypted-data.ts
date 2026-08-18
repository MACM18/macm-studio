import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";
import { encryptJson, encryptText, decryptJson, decryptText, isEncryptedValue } from "../lib/data-encryption.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
if (!process.env.DATA_ENCRYPTION_KEY) throw new Error("DATA_ENCRYPTION_KEY is required.");

const apply = process.argv.includes("--apply");
const confirmBackup = process.argv.includes("--confirm-backup");
if (apply && !confirmBackup) throw new Error("Refusing to write without --confirm-backup after a verified production backup.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 3 }) });
let changed = 0;

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, company: true, phone: true, companyEncrypted: true, phoneEncrypted: true } });
  for (const row of users) {
    const data: Record<string, string | null> = {};
    if (!isEncryptedValue(row.companyEncrypted) && row.company !== null) { const value = encryptText(row.company); if (decryptText(value) !== row.company) throw new Error("User company verification failed."); data.companyEncrypted = value; }
    if (!isEncryptedValue(row.phoneEncrypted) && row.phone !== null) { const value = encryptText(row.phone); if (decryptText(value) !== row.phone) throw new Error("User phone verification failed."); data.phoneEncrypted = value; }
    if (Object.keys(data).length) { changed++; if (apply) await prisma.user.update({ where: { id: row.id }, data }); }
  }

  const leads = await prisma.lead.findMany({ select: { id: true, phone: true, budgetSummary: true, notes: true, scope: true, phoneEncrypted: true, budgetSummaryEncrypted: true, notesEncrypted: true, scopeEncrypted: true } });
  for (const row of leads) {
    const data: Record<string, string | null> = {};
    if (!isEncryptedValue(row.phoneEncrypted) && row.phone !== null) { const value = encryptText(row.phone); if (decryptText(value) !== row.phone) throw new Error("Lead phone verification failed."); data.phoneEncrypted = value; }
    if (!isEncryptedValue(row.budgetSummaryEncrypted) && row.budgetSummary !== null) { const value = encryptText(row.budgetSummary); if (decryptText(value) !== row.budgetSummary) throw new Error("Lead budget verification failed."); data.budgetSummaryEncrypted = value; }
    if (!isEncryptedValue(row.notesEncrypted) && row.notes !== null) { const value = encryptText(row.notes); if (decryptText(value) !== row.notes) throw new Error("Lead notes verification failed."); data.notesEncrypted = value; }
    if (!isEncryptedValue(row.scopeEncrypted) && row.scope !== null) { const value = encryptJson(row.scope); if (JSON.stringify(decryptJson(value)) !== JSON.stringify(row.scope)) throw new Error("Lead scope verification failed."); data.scopeEncrypted = value; }
    if (Object.keys(data).length) { changed++; if (apply) await prisma.lead.update({ where: { id: row.id }, data }); }
  }

  const projects = await prisma.project.findMany({ select: { id: true, summary: true, summaryEncrypted: true } });
  for (const row of projects) if (!isEncryptedValue(row.summaryEncrypted) && row.summary !== null) { const value = encryptText(row.summary); if (decryptText(value) !== row.summary) throw new Error("Project summary verification failed."); changed++; if (apply) await prisma.project.update({ where: { id: row.id }, data: { summaryEncrypted: value } }); }
  const updates = await prisma.projectUpdate.findMany({ select: { id: true, body: true, bodyEncrypted: true } });
  for (const row of updates) if (!isEncryptedValue(row.bodyEncrypted) && row.body !== null) { const value = encryptText(row.body); if (decryptText(value) !== row.body) throw new Error("Project update verification failed."); changed++; if (apply) await prisma.projectUpdate.update({ where: { id: row.id }, data: { bodyEncrypted: value } }); }
  const links = await prisma.projectLink.findMany({ select: { id: true, url: true, urlEncrypted: true } });
  for (const row of links) if (!isEncryptedValue(row.urlEncrypted) && row.url) { const value = encryptText(row.url); if (decryptText(value) !== row.url) throw new Error("Project link verification failed."); changed++; if (apply) await prisma.projectLink.update({ where: { id: row.id }, data: { urlEncrypted: value } }); }

  process.stdout.write(`${apply ? "Applied" : "Dry run"}: ${changed} records ready for encrypted backfill.\n`);
}

main().finally(() => prisma.$disconnect());
