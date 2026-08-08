"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertRole } from "./actions";

export async function addImageAction(formData: FormData) {
  await assertRole("editor");

  const url = String(formData.get("url") ?? "").trim();
  const altText = String(formData.get("altText") ?? "").trim();
  const folder = String(formData.get("folder") ?? "").trim();
  const usage = String(formData.get("usage") ?? "").trim();

  if (!url) redirect("/admin/images?error=missing");

  await prisma.siteImage.create({
    data: { url, altText: altText || null, folder: folder || null, usage: usage || null },
  });

  redirect("/admin/images?created=1");
}

export async function updateImageAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  const url = String(formData.get("url") ?? "").trim();
  const altText = String(formData.get("altText") ?? "").trim();
  const folder = String(formData.get("folder") ?? "").trim();
  const usage = String(formData.get("usage") ?? "").trim();

  await prisma.siteImage.update({
    where: { id },
    data: { url, altText: altText || null, folder: folder || null, usage: usage || null },
  });

  redirect("/admin/images?saved=1");
}

export async function deleteImageAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  await prisma.siteImage.delete({ where: { id } });

  redirect("/admin/images?deleted=1");
}
