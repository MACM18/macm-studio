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

function emailFrame(title: string, content: string) {
  return `<!doctype html><html><body style="margin:0;background:#eef7ff;font-family:Manrope,Arial,sans-serif;color:#10203f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:auto;background:#fff;border:1px solid #cfe5ff;border-radius:24px;overflow:hidden"><tr><td style="padding:24px 28px;background:linear-gradient(135deg,#0846c7,#0070f3);color:#fff"><strong style="font-size:20px">MACM</strong><div style="opacity:.82;font-size:13px;margin-top:3px">Client workspace</div></td></tr><tr><td style="padding:32px 28px"><h1 style="font-size:24px;line-height:1.25;margin:0 0 18px">${escapeHtml(title)}</h1>${content}</td></tr><tr><td style="padding:18px 28px;background:#f7fbff;color:#52627d;font-size:12px">This is a service message from MACM Studio. Please do not share sign-in codes.</td></tr></table></td></tr></table></body></html>`;
}

export async function sendOtpEmail(email: string, otp: string) {
  const safeOtp = escapeHtml(otp);
  await mailTransport().sendMail({
    from: from(),
    to: email,
    subject: `${otp} is your MACM sign-in code`,
    text: `Your MACM sign-in code is ${otp}. It expires in 5 minutes and can only be used once. If you did not request this, you can ignore this email.`,
    html: emailFrame(
      "Your secure sign-in code",
      `<p style="margin:0 0 20px;color:#42516a;line-height:1.7">Enter this code to open your MACM client workspace. It expires in five minutes.</p><div style="font-size:34px;font-weight:700;letter-spacing:10px;color:#0846c7;background:#eef7ff;border-radius:16px;padding:18px;text-align:center">${safeOtp}</div><p style="margin:20px 0 0;color:#64748b;font-size:13px;line-height:1.6">A new request replaces the previous code. After three incorrect attempts, request a fresh code.</p>`,
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
