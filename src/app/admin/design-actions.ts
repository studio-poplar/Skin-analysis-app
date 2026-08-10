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

// v11差分指示書(節7-22)追加: カテゴリごとのタグ色・枠線色。categoryを自然キーにupsertする。
export async function updateCategoryColorAction(formData: FormData) {
  await assertRole("admin");

  const category = String(formData.get("category") ?? "").trim();
  const tagColorHex = String(formData.get("tagColorHex") ?? "").trim();
  const borderColorHex = String(formData.get("borderColorHex") ?? "").trim();

  if (!category || !/^#[0-9a-fA-F]{6}$/.test(tagColorHex) || !/^#[0-9a-fA-F]{6}$/.test(borderColorHex)) {
    redirect("/admin/design?error=category_color");
  }

  await prisma.categoryColor.upsert({
    where: { category },
    update: { tagColorHex, borderColorHex },
    create: { category, tagColorHex, borderColorHex },
  });

  redirect("/admin/design?saved=1");
}

// 個別カテゴリの色設定を削除し、コード側のグレー系デフォルトに戻す。
export async function resetCategoryColorAction(formData: FormData) {
  await assertRole("admin");

  const category = String(formData.get("category") ?? "").trim();
  await prisma.categoryColor.deleteMany({ where: { category } });

  redirect("/admin/design?saved=1");
}
