"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { deliverLeadWebhook } from "@/lib/lead-webhook";
import { normalizeEmail } from "@/lib/identity";
import { milestoneWeightsAreValid } from "@/lib/project-progress";
import { paymentMilestonesFromScope } from "@/lib/scope";
import { sendProjectUpdateEmail } from "@/lib/email";

const text = (formData: FormData, key: string, maximum: number) => String(formData.get(key) ?? "").trim().slice(0, maximum);
const optionalDate = (value: string) => value ? new Date(`${value}T00:00:00.000Z`) : null;

async function audit(actorId: string, action: string, entityType: string, entityId: string, metadata?: Record<string, string | number | boolean | null>) {
  await prisma.auditLog.create({ data: { actorId, action, entityType, entityId, metadata } });
}

export async function approveLead(leadId: string) {
  const { user: admin } = await requireAdmin();
  let result: { projectId: string; alreadyApproved: boolean };
  try {
    result = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id: leadId }, include: { project: true } });
    if (!lead) throw new Error("Lead not found.");
    if (lead.project) return { projectId: lead.project.id, alreadyApproved: true };
    if (lead.status === "REJECTED") throw new Error("Rejected leads must be returned to pending before approval.");

    const email = normalizeEmail(lead.email);
    const customer = await tx.user.upsert({
      where: { email },
      create: { email, name: lead.name, phone: lead.phone, emailVerified: true, role: "CLIENT", status: "ACTIVE" },
      update: { name: lead.name, phone: lead.phone, emailVerified: true, status: "ACTIVE" },
    });
    if (customer.role !== "CLIENT") throw new Error("An administrator account cannot be converted into a customer.");

    const payments = paymentMilestonesFromScope(lead.scope);
    const project = await tx.project.create({
      data: {
        ownerId: customer.id,
        leadId: lead.id,
        title: lead.projectType,
        summary: lead.notes || lead.budgetSummary,
        milestones: {
          create: [
            { sortOrder: 1, title: "Planning and direction", description: "Scope, content, and visual direction are agreed.", weight: 20, paymentAmount: payments.kickoff, paymentCurrency: payments.currency },
            { sortOrder: 2, title: "Working website", description: "The main website experience is built and ready for review.", weight: 60, paymentAmount: payments.demo, paymentCurrency: payments.currency },
            { sortOrder: 3, title: "Final handover", description: "Final checks, launch, and handover are completed.", weight: 20, paymentAmount: payments.handover, paymentCurrency: payments.currency },
          ],
        },
      },
    });
    await tx.lead.update({ where: { id: lead.id }, data: { status: "APPROVED", reviewedAt: new Date(), approvedById: admin.id, approvedCustomerId: customer.id } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "lead.approved", entityType: "Lead", entityId: lead.id, metadata: { customerId: customer.id, projectId: project.id } } });
      return { projectId: project.id, alreadyApproved: false };
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    // A concurrent repeat may lose the unique lead/project race after the other
    // transaction succeeds. Treat that as the same successful approval.
    const existingProject = await prisma.project.findUnique({ where: { leadId }, select: { id: true } });
    if (!existingProject) throw error;
    result = { projectId: existingProject.id, alreadyApproved: true };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  redirect(`/admin/projects/${result.projectId}`);
}

export async function rejectLead(leadId: string) {
  const { user: admin } = await requireAdmin();
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { status: true, project: { select: { id: true } } } });
  if (!lead || lead.project || lead.status === "APPROVED") throw new Error("This lead can no longer be rejected.");
  await prisma.lead.update({ where: { id: leadId }, data: { status: "REJECTED", reviewedAt: new Date(), approvedById: admin.id } });
  await audit(admin.id, "lead.rejected", "Lead", leadId);
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function returnLeadToPending(leadId: string) {
  const { user: admin } = await requireAdmin();
  await prisma.lead.update({ where: { id: leadId, project: null }, data: { status: "PENDING", reviewedAt: null, approvedById: null } });
  await audit(admin.id, "lead.reopened", "Lead", leadId);
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function retryLeadWebhook(leadId: string) {
  const { user: admin } = await requireAdmin();
  const delivered = await deliverLeadWebhook(leadId);
  await audit(admin.id, "lead.webhook_retried", "Lead", leadId, { delivered });
  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function setClientAccess(clientId: string, status: "ACTIVE" | "SUSPENDED") {
  const { user: admin } = await requireAdmin();
  const client = await prisma.user.findUnique({ where: { id: clientId }, select: { role: true } });
  if (!client || client.role !== "CLIENT") throw new Error("Client not found.");
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: clientId }, data: { status } });
    if (status === "SUSPENDED") await tx.session.deleteMany({ where: { userId: clientId } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: `client.${status.toLowerCase()}`, entityType: "User", entityId: clientId } });
  });
  revalidatePath(`/admin/clients/${clientId}`);
}

const clientProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254).transform(normalizeEmail),
  company: z.string().trim().max(160),
  phone: z.string().trim().max(40),
});

export async function updateClientProfile(clientId: string, formData: FormData) {
  const { user: admin } = await requireAdmin();
  const values = clientProfileSchema.parse(Object.fromEntries(formData));
  const client = await prisma.user.findFirst({ where: { id: clientId, role: "CLIENT" }, select: { email: true } });
  if (!client) throw new Error("Client not found.");
  const emailChanged = client.email !== values.email;
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: clientId }, data: { name: values.name, email: values.email, company: values.company || null, phone: values.phone || null } });
    if (emailChanged) {
      await tx.session.deleteMany({ where: { userId: clientId } });
      await tx.verification.deleteMany({ where: { identifier: { contains: client.email } } });
    }
    await tx.auditLog.create({ data: { actorId: admin.id, action: "client.profile_updated", entityType: "User", entityId: clientId, metadata: { emailChanged } } });
  });
  revalidatePath(`/admin/clients/${clientId}`);
}

const projectSchema = z.object({
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(4000),
  status: z.enum(["PLANNING", "IN_PROGRESS", "REVIEW", "ON_HOLD", "COMPLETE", "CANCELLED"]),
  visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  startDate: z.string(),
  targetDate: z.string(),
});

export async function updateProject(projectId: string, formData: FormData) {
  const { user: admin } = await requireAdmin();
  const values = projectSchema.parse(Object.fromEntries(formData));
  if (values.visibility === "PUBLISHED") {
    const milestones = await prisma.projectMilestone.findMany({ where: { projectId }, select: { weight: true } });
    if (!milestoneWeightsAreValid(milestones)) throw new Error("Milestone weights must total 100 before publishing.");
  }
  await prisma.project.update({
    where: { id: projectId },
    data: {
      title: values.title,
      summary: values.summary || null,
      status: values.status,
      visibility: values.visibility,
      startDate: optionalDate(values.startDate),
      targetDate: optionalDate(values.targetDate),
      publishedAt: values.visibility === "PUBLISHED" ? new Date() : null,
    },
  });
  await audit(admin.id, "project.updated", "Project", projectId, { status: values.status, visibility: values.visibility });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal`);
}

const milestoneSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000),
  weight: z.coerce.number().int().min(0).max(100),
  progress: z.coerce.number().int().min(0).max(100),
  state: z.enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "COMPLETE"]),
  dueDate: z.string(),
  paymentAmount: z.union([z.literal(""), z.coerce.number().int().min(0)]),
  paymentCurrency: z.string().trim().max(8),
  paymentStatus: z.enum(["PENDING", "PAID", "OVERDUE", "NOT_APPLICABLE"]),
});

export async function updateMilestone(milestoneId: string, formData: FormData) {
  const { user: admin } = await requireAdmin();
  const values = milestoneSchema.parse(Object.fromEntries(formData));
  const milestone = await prisma.projectMilestone.update({
    where: { id: milestoneId },
    data: {
      title: values.title,
      description: values.description || null,
      weight: values.weight,
      progress: values.progress,
      state: values.state,
      dueDate: optionalDate(values.dueDate),
      completedAt: values.state === "COMPLETE" ? new Date() : null,
      paymentAmount: values.paymentAmount === "" ? null : values.paymentAmount,
      paymentCurrency: values.paymentCurrency || null,
      paymentStatus: values.paymentStatus,
    },
  });
  await audit(admin.id, "milestone.updated", "ProjectMilestone", milestoneId, { projectId: milestone.projectId, progress: values.progress, paymentStatus: values.paymentStatus });
  revalidatePath(`/admin/projects/${milestone.projectId}`);
  revalidatePath(`/portal/projects/${milestone.projectId}`);
}

export async function addProjectLink(projectId: string, formData: FormData) {
  const { user: admin } = await requireAdmin();
  const label = text(formData, "label", 100);
  const url = z.string().url().refine((value) => new URL(value).protocol === "https:", "Only HTTPS links are allowed.").parse(text(formData, "url", 2000));
  if (!label) throw new Error("A link label is required.");
  const last = await prisma.projectLink.aggregate({ where: { projectId }, _max: { sortOrder: true } });
  const link = await prisma.projectLink.create({ data: { projectId, label, url, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
  await audit(admin.id, "project_link.created", "ProjectLink", link.id, { projectId });
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);
}

export async function deleteProjectLink(linkId: string) {
  const { user: admin } = await requireAdmin();
  const link = await prisma.projectLink.delete({ where: { id: linkId } });
  await audit(admin.id, "project_link.deleted", "ProjectLink", linkId, { projectId: link.projectId });
  revalidatePath(`/admin/projects/${link.projectId}`);
  revalidatePath(`/portal/projects/${link.projectId}`);
}

export async function createProjectUpdate(projectId: string, formData: FormData) {
  const { user: admin } = await requireAdmin();
  const title = text(formData, "title", 160);
  const body = text(formData, "body", 8000);
  if (title.length < 2 || body.length < 2) throw new Error("An update needs a title and message.");
  const update = await prisma.projectUpdate.create({ data: { projectId, authorId: admin.id, title, body } });
  await audit(admin.id, "project_update.created", "ProjectUpdate", update.id, { projectId });
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateDraftProjectUpdate(updateId: string, formData: FormData) {
  const { user: admin } = await requireAdmin();
  const title = text(formData, "title", 160);
  const body = text(formData, "body", 8000);
  if (title.length < 2 || body.length < 2) throw new Error("An update needs a title and message.");
  const existing = await prisma.projectUpdate.findUnique({ where: { id: updateId }, select: { projectId: true, status: true } });
  if (!existing || existing.status !== "DRAFT") throw new Error("Only draft updates can be edited.");
  await prisma.projectUpdate.update({ where: { id: updateId }, data: { title, body } });
  await audit(admin.id, "project_update.edited", "ProjectUpdate", updateId, { projectId: existing.projectId });
  revalidatePath(`/admin/projects/${existing.projectId}`);
}

async function notifyUpdate(updateId: string) {
  const update = await prisma.projectUpdate.findUnique({ where: { id: updateId }, include: { project: { include: { owner: true } } } });
  if (!update || update.status !== "PUBLISHED") throw new Error("Published update not found.");
  try {
    await sendProjectUpdateEmail({
      email: update.project.owner.email,
      customerName: update.project.owner.name,
      projectTitle: update.project.title,
      updateTitle: update.title,
      updateBody: update.body,
      projectId: update.projectId,
    });
    await prisma.projectUpdate.update({ where: { id: updateId }, data: { notificationStatus: "SENT", notificationError: null } });
    return true;
  } catch (error) {
    await prisma.projectUpdate.update({ where: { id: updateId }, data: { notificationStatus: "FAILED", notificationError: error instanceof Error ? error.message.slice(0, 500) : "Email failed" } });
    return false;
  }
}

export async function publishProjectUpdate(updateId: string) {
  const { user: admin } = await requireAdmin();
  const update = await prisma.projectUpdate.findUnique({ where: { id: updateId } });
  if (!update) throw new Error("Update not found.");
  if (update.status === "PUBLISHED") return;
  await prisma.projectUpdate.update({ where: { id: updateId }, data: { status: "PUBLISHED", publishedAt: new Date(), notificationStatus: "PENDING", notificationError: null } });
  const delivered = await notifyUpdate(updateId);
  await audit(admin.id, "project_update.published", "ProjectUpdate", updateId, { projectId: update.projectId, delivered });
  revalidatePath(`/admin/projects/${update.projectId}`);
  revalidatePath(`/portal/projects/${update.projectId}`);
}

export async function retryProjectUpdateEmail(updateId: string) {
  const { user: admin } = await requireAdmin();
  const update = await prisma.projectUpdate.findUnique({ where: { id: updateId }, select: { projectId: true, status: true } });
  if (!update || update.status !== "PUBLISHED") throw new Error("Only published updates can be retried.");
  const delivered = await notifyUpdate(updateId);
  await audit(admin.id, "project_update.notification_retried", "ProjectUpdate", updateId, { projectId: update.projectId, delivered });
  revalidatePath(`/admin/projects/${update.projectId}`);
}
