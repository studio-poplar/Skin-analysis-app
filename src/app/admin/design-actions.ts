"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertRole } from "./actions";

const ALLOWED_BUTTON_STYLES = ["rounded-full", "rounded-lg", "square"];
const ALLOWED_FONT_FAMILIES = ["sans", "serif", "mono"];

export async function updateDesignSettingsAction(formData: FormData) {
  await assertRole("admin");

  const primaryColorHex = String(formData.get("primaryColorHex") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const faviconUrl = String(formData.get("faviconUrl") ?? "").trim();
  const buttonStyle = ALLOWED_BUTTON_STYLES.includes(String(formData.get("buttonStyle")))
    ? String(formData.get("buttonStyle"))
    : "rounded-full";
  const bodyTextColorHex = String(formData.get("bodyTextColorHex") ?? "").trim();
  const fontFamily = ALLOWED_FONT_FAMILIES.includes(String(formData.get("fontFamily")))
    ? String(formData.get("fontFamily"))
    : "sans";

  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColorHex)) {
    redirect("/admin/design?error=color");
  }
  if (bodyTextColorHex && !/^#[0-9a-fA-F]{6}$/.test(bodyTextColorHex)) {
    redirect("/admin/design?error=color");
  }

  await prisma.designSettings.upsert({
    where: { id: 1 },
    update: {
      primaryColorHex,
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      buttonStyle,
      bodyTextColorHex: bodyTextColorHex || null,
      fontFamily,
    },
    create: {
      id: 1,
      primaryColorHex,
      logoUrl: logoUrl || null,
      faviconUrl: faviconUrl || null,
      buttonStyle,
      bodyTextColorHex: bodyTextColorHex || null,
      fontFamily,
    },
  });

  redirect("/admin/design?saved=1");
}
