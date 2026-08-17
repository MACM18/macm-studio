"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/auth-guards";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160),
  phone: z.string().trim().max(40),
});

export async function updateProfile(formData: FormData) {
  const { user } = await requireClient();
  const values = profileSchema.parse(Object.fromEntries(formData));
  await prisma.user.update({ where: { id: user.id }, data: { name: values.name, company: values.company || null, phone: values.phone || null } });
  revalidatePath("/portal/profile");
}
