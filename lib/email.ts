import "server-only";

import nodemailer from "nodemailer";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

function mailTransport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP is not configured.");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    pool: true,
    maxConnections: 2,
    maxMessages: 40,
  });
}

const from = () => process.env.MAIL_FROM ?? "MACM Studio <no-reply@macm.lk>";

function emailFrame(title: string, content: string, footer = "This is a service message from MACM Studio.") {
  return `<!doctype html><html><body style="margin:0;background:#eef7ff;font-family:Manrope,Arial,sans-serif;color:#10203f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:auto;background:#fff;border:1px solid #cfe5ff;border-radius:24px;overflow:hidden"><tr><td style="padding:24px 28px;background:linear-gradient(135deg,#0846c7,#0070f3);color:#fff"><strong style="font-size:20px">MACM</strong><div style="opacity:.82;font-size:13px;margin-top:3px">Websites built with care</div></td></tr><tr><td style="padding:32px 28px"><h1 style="font-size:24px;line-height:1.25;margin:0 0 18px">${escapeHtml(title)}</h1>${content}</td></tr><tr><td style="padding:18px 28px;background:#f7fbff;color:#52627d;font-size:12px">${escapeHtml(footer)}</td></tr></table></td></tr></table></body></html>`;
}

export async function sendOtpEmail(email: string, otp: string) {
  const safeOtp = escapeHtml(otp);
  await mailTransport().sendMail({
    from: from(),
    to: email,
    subject: `${otp} is your MACM sign-in code`,
    text: `Your MACM sign-in code is ${otp}. It expires in 20 minutes and can only be used once. If you did not request this, you can ignore this email.`,
    html: emailFrame(
      "Your secure sign-in code",
      `<p style="margin:0 0 20px;color:#42516a;line-height:1.7">Enter this code to open your MACM client workspace. It expires in 20 minutes.</p><div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#0846c7;background:#eef7ff;border-radius:16px;padding:18px;text-align:center">${safeOtp}</div><p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.6">A new request replaces the previous code. After three incorrect attempts, request a fresh code.</p>`,
      "Do not share this sign-in code with anyone.",
    ),
  });
}

export async function sendLeadNotificationEmail(input: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  projectType: string;
  budgetSummary: string | null;
  notes: string | null;
  submittedAt: Date;
}) {
  const recipient = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!recipient) throw new Error("Lead notification email is not configured.");
  const adminUrl = `${process.env.BETTER_AUTH_URL ?? "https://macm.lk"}/admin/leads/${encodeURIComponent(input.id)}`;
  const details = [
    ["Name", input.name],
    ["Email", input.email],
    ["Phone", input.phone || "Not provided"],
    ["Project", input.projectType],
    ["Submitted", input.submittedAt.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" })],
  ];
  const rows = details.map(([label, value]) => `<tr><td style="padding:10px 0;color:#64748b;font-size:12px;border-bottom:1px solid #e3effb">${escapeHtml(label)}</td><td style="padding:10px 0 10px 18px;color:#10203f;font-weight:600;border-bottom:1px solid #e3effb">${escapeHtml(value)}</td></tr>`).join("");
  const section = (label: string, value: string | null) => value ? `<div style="margin-top:24px"><div style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(label)}</div><div style="margin-top:9px;padding:16px;border-radius:14px;background:#f3f9ff;color:#33445f;line-height:1.65;white-space:pre-line">${escapeHtml(value)}</div></div>` : "";
  await mailTransport().sendMail({
    from: from(),
    to: recipient,
    replyTo: input.email,
    subject: `New MACM enquiry — ${input.projectType}`,
    text: `New MACM website enquiry\n\nName: ${input.name}\nEmail: ${input.email}\nPhone: ${input.phone || "Not provided"}\nProject: ${input.projectType}\n\n${input.budgetSummary || ""}\n\nNotes: ${input.notes || "Not provided"}\n\nReview: ${adminUrl}`,
    html: emailFrame(
      "A new website enquiry arrived.",
      `<p style="margin:0 0 22px;color:#42516a;line-height:1.7">The enquiry has been saved securely. Review it in the admin workspace before approving client access.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>${section("Selected scope", input.budgetSummary)}${section("Customer notes", input.notes)}<p style="margin:26px 0 0"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#0070f3;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:999px">Review enquiry</a></p>`,
      "Replying to this email sends your response directly to the customer.",
    ),
  });
}

export async function sendProjectUpdateEmail(input: {
  email: string;
  customerName: string;
  projectTitle: string;
  updateTitle: string;
  updateBody: string;
  projectId: string;
}) {
  const portalUrl = `${process.env.BETTER_AUTH_URL ?? "https://macm.lk"}/portal/projects/${encodeURIComponent(input.projectId)}`;
  await mailTransport().sendMail({
    from: from(),
    to: input.email,
    subject: `${input.projectTitle}: ${input.updateTitle}`,
    text: `Hello ${input.customerName},\n\n${input.updateTitle}\n\n${input.updateBody}\n\nOpen your secure project workspace: ${portalUrl}`,
    html: emailFrame(
      input.updateTitle,
      `<p style="color:#42516a;line-height:1.7">Hello ${escapeHtml(input.customerName)},</p><p style="color:#42516a;line-height:1.7;white-space:pre-line">${escapeHtml(input.updateBody)}</p><p style="margin:26px 0 0"><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:#0070f3;color:#fff;text-decoration:none;font-weight:700;padding:13px 20px;border-radius:999px">Open project workspace</a></p>`,
    ),
  });
}
