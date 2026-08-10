"use server";

import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
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

// v11追加: 背景画像のファイルアップロード対応。Vercel Blobにアップロードし、
// 得られたURLをそのままSiteContent.value(即公開)として保存する。
// BLOB_READ_WRITE_TOKEN未設定の環境(ローカル開発でBlobストアを紐付けていない場合等)では
// put()がエラーを投げるため、その場合はURL入力欄からの設定を案内する。
export async function uploadBackgroundImageAction(formData: FormData) {
  await assertRole("editor");

  const key = String(formData.get("key"));
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/admin/content?uploadError=missing_file#${key}`);
  }

  try {
    const blob = await put(`background-images/${key}-${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: false,
    });
    await prisma.siteContent.update({ where: { key }, data: { value: blob.url } });
  } catch {
    redirect(`/admin/content?uploadError=upload_failed#${key}`);
  }

  redirect(`/admin/content?saved=1#${key}`);
}
