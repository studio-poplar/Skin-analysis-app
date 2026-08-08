"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertRole } from "./actions";

export async function updateLineSettingsAction(formData: FormData) {
  await assertRole("editor");

  const lineUrl = String(formData.get("lineUrl") ?? "").trim();
  const buttonText = String(formData.get("buttonText") ?? "").trim();
  const bannerImageUrl = String(formData.get("bannerImageUrl") ?? "").trim();

  if (!lineUrl || !buttonText) redirect("/admin/line?error=missing");

  await prisma.lineSettings.upsert({
    where: { id: 1 },
    update: { lineUrl, buttonText, bannerImageUrl: bannerImageUrl || null },
    create: { id: 1, lineUrl, buttonText, bannerImageUrl: bannerImageUrl || null },
  });

  redirect("/admin/line?saved=1");
}
