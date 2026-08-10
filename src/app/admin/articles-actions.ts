"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertRole } from "./actions";

// v11追加: 診断結果ページ「関連記事」セクション用の記事(RelatedArticle)のCRUD。
// 製品(Product)に手動で紐付ける(依頼者の判断、カテゴリ単位ではなく製品単位)。

export async function createArticleAction(formData: FormData) {
  await assertRole("editor");

  const productId = Number(formData.get("productId"));
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!productId || !title || !url) {
    redirect("/admin/articles?error=missing");
  }

  const count = await prisma.relatedArticle.count({ where: { productId } });
  await prisma.relatedArticle.create({ data: { productId, title, url, sortOrder: count } });

  revalidatePath("/admin/articles");
  redirect("/admin/articles?created=1");
}

export async function updateArticleAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder")) || 0;
  if (!title || !url) {
    redirect("/admin/articles?error=missing");
  }

  await prisma.relatedArticle.update({ where: { id }, data: { title, url, sortOrder } });

  revalidatePath("/admin/articles");
  redirect("/admin/articles?saved=1");
}

export async function toggleArticleActiveAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  const article = await prisma.relatedArticle.findUnique({ where: { id } });
  if (article) {
    await prisma.relatedArticle.update({ where: { id }, data: { isActive: !article.isActive } });
  }

  revalidatePath("/admin/articles");
  redirect("/admin/articles?saved=1");
}

export async function deleteArticleAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  await prisma.relatedArticle.delete({ where: { id } });

  revalidatePath("/admin/articles");
  redirect("/admin/articles?saved=1");
}
