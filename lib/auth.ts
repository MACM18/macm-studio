import "server-only";

import { createHmac } from "node:crypto";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { isAllowlistedAdmin, normalizeEmail } from "@/lib/identity";
import { sendOtpEmail } from "@/lib/email";
import { consumeAuthEmailLimit } from "@/lib/auth-rate-limit";

const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret && process.env.NODE_ENV === "production") {
  throw new Error("BETTER_AUTH_SECRET is required in production.");
}

export const auth = betterAuth({
  appName: "MACM Client Workspace",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: authSecret ?? "development-only-secret-change-before-production",
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: false },
  user: {
    additionalFields: {
      company: { type: "string", required: false },
      phone: { type: "string", required: false },
      role: { type: ["CLIENT", "ADMIN"], defaultValue: "CLIENT", input: false },
      status: { type: ["ACTIVE", "SUSPENDED"], defaultValue: "ACTIVE", input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 20,
    customRules: {
      "/email-otp/send-verification-otp": { window: 60, max: 3 },
      "/sign-in/email-otp": { window: 300, max: 6 },
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "macm",
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { email: true, role: true, status: true, approvedLeads: { where: { status: "APPROVED" }, select: { id: true }, take: 1 } },
          });
          if (!user || user.status !== "ACTIVE") return false;
          if (user.role === "ADMIN" && !isAllowlistedAdmin(user.email)) return false;
          if (user.role === "CLIENT" && user.approvedLeads.length === 0) return false;
        },
      },
    },
  },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 20 * 60,
      allowedAttempts: 3,
      disableSignUp: true,
      resendStrategy: "rotate",
      storeOTP: {
        hash: async (otp) => createHmac("sha256", authSecret ?? "development-only-secret-change-before-production").update(otp).digest("hex"),
      },
      rateLimit: { window: 60, max: 3 },
      sendVerificationOTP: async ({ email, otp, type }) => {
        if (type !== "sign-in") return;
        const normalized = normalizeEmail(email);
        const user = await prisma.user.findUnique({
          where: { email: normalized },
          select: { role: true, status: true, approvedLeads: { where: { status: "APPROVED" }, select: { id: true }, take: 1 } },
        });
        const permitted = user?.status === "ACTIVE" && (
          user.role === "ADMIN" ? isAllowlistedAdmin(normalized) : user.approvedLeads.length > 0
        );
        if (permitted && await consumeAuthEmailLimit(normalized, 3, 15 * 60)) await sendOtpEmail(normalized, otp);
      },
    }),
  ],
});
