import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAllowlistedAdmin } from "@/lib/identity";

export async function currentPrincipal() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { approvedLeads: { where: { status: "APPROVED" }, select: { id: true }, take: 1 } },
  });
  if (!user || user.status !== "ACTIVE") return null;
  if (user.role === "ADMIN" && !isAllowlistedAdmin(user.email)) return null;
  if (user.role === "CLIENT" && user.approvedLeads.length === 0) return null;
  return { session: session.session, user };
}

export async function requireClient() {
  const principal = await currentPrincipal();
  if (!principal) redirect("/sign-in?next=/portal");
  if (principal.user.role === "ADMIN") redirect("/admin");
  return principal;
}

export async function requireAdmin() {
  const principal = await currentPrincipal();
  if (!principal) redirect("/sign-in?next=/admin");
  if (principal.user.role !== "ADMIN" || !isAllowlistedAdmin(principal.user.email)) redirect("/portal");
  return principal;
}
