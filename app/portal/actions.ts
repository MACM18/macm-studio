"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireClient } from "@/lib/auth-guards";
import { writePrivateText } from "@/lib/private-data";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  company: z.string().trim().max(160),
  phone: z.string().trim().max(40),
});

export async function updateProfile(formData: FormData) {
  const { user } = await requireClient();
  const values = profileSchema.parse(Object.fromEntries(formData));
  await prisma.user.update({ where: { id: user.id }, data: { name: values.name, company: null, companyEncrypted: writePrivateText(values.company), phone: null, phoneEncrypted: writePrivateText(values.phone) } });
  revalidatePath("/portal/profile");
}
