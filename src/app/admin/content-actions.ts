"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertRole } from "./actions";

export async function updateContentAction(formData: FormData) {
  await assertRole("editor");

  const key = String(formData.get("key"));
  const value = String(formData.get("value") ?? "");

  await prisma.siteContent.update({ where: { key }, data: { value } });

  redirect("/admin/content?saved=1");
}

export async function saveContentDraftAction(formData: FormData) {
  await assertRole("editor");

  const key = String(formData.get("key"));
  const draftValue = String(formData.get("draftValue") ?? "");

  await prisma.siteContent.update({ where: { key }, data: { draftValue: draftValue || null } });

  redirect("/admin/content?draftSaved=1");
}

export async function publishContentDraftAction(formData: FormData) {
  await assertRole("editor");

  const key = String(formData.get("key"));
  const row = await prisma.siteContent.findUnique({ where: { key } });
  if (row?.draftValue) {
    await prisma.siteContent.update({ where: { key }, data: { value: row.draftValue, draftValue: null } });
  }

  redirect("/admin/content?published=1");
}
