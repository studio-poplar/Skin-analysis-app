"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertRole } from "./actions";

export async function createGenreAction(formData: FormData) {
  await assertRole("editor");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/flow?error=missing");

  const count = await prisma.genre.count();
  const genreId = `genre-${Date.now().toString(36)}`;

  await prisma.genre.create({
    data: { genreId, name, sortOrder: count + 1 },
  });

  redirect("/admin/flow?created=1");
}

export async function updateGenreAction(formData: FormData) {
  await assertRole("editor");

  const genreId = String(formData.get("genreId"));
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder")) || 1;
  const isActive = formData.get("isActive") === "on";

  await prisma.genre.update({
    where: { genreId },
    data: { name, sortOrder, isActive },
  });

  redirect("/admin/flow?saved=1");
}

export async function createCategoryAction(formData: FormData) {
  await assertRole("editor");

  const genreId = String(formData.get("genreId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/flow?error=missing");

  const count = await prisma.concernCategory.count({ where: { genreId } });
  const categoryId = `${genreId.slice(0, 2).toUpperCase()}-${Date.now().toString(36)}`;

  const category = await prisma.concernCategory.create({
    data: { categoryId, genreId, name, sortOrder: count + 1 },
  });

  // 新規カテゴリにも一般知識(Why/How)の空行を用意しておく(未入力なら管理画面で追記できる)。
  await prisma.generalKnowledge.create({
    data: { categoryId: category.categoryId, contentText: "", isSourceVerified: false },
  });

  redirect("/admin/flow?created=1");
}

export async function updateCategoryAction(formData: FormData) {
  await assertRole("editor");

  const categoryId = String(formData.get("categoryId"));
  const name = String(formData.get("name") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder")) || 1;
  const isActive = formData.get("isActive") === "on";
  const lineUrlOverride = String(formData.get("lineUrlOverride") ?? "").trim();
  const lineMessageOverride = String(formData.get("lineMessageOverride") ?? "").trim();

  await prisma.concernCategory.update({
    where: { categoryId },
    data: {
      name,
      sortOrder,
      isActive,
      lineUrlOverride: lineUrlOverride || null,
      lineMessageOverride: lineMessageOverride || null,
    },
  });

  redirect("/admin/flow?saved=1");
}

export async function updateBasicQuestionAction(formData: FormData) {
  await assertRole("editor");

  const questionId = Number(formData.get("questionId"));
  const questionText = String(formData.get("questionText") ?? "").trim();

  await prisma.question.update({ where: { questionId }, data: { questionText } });

  redirect("/admin/flow?saved=1");
}

export async function updateBasicOptionAction(formData: FormData) {
  await assertRole("editor");

  const optionId = Number(formData.get("optionId"));
  const optionText = String(formData.get("optionText") ?? "").trim();

  await prisma.questionOption.update({ where: { optionId }, data: { optionText } });

  redirect("/admin/flow?saved=1");
}

export async function addBasicOptionAction(formData: FormData) {
  await assertRole("editor");

  const questionId = Number(formData.get("questionId"));
  const optionText = String(formData.get("optionText") ?? "").trim();
  if (!optionText) redirect("/admin/flow?error=missing");

  const count = await prisma.questionOption.count({ where: { questionId } });
  await prisma.questionOption.create({ data: { questionId, optionText, sortOrder: count } });

  redirect("/admin/flow?saved=1");
}

export async function removeBasicOptionAction(formData: FormData) {
  await assertRole("editor");

  const optionId = Number(formData.get("optionId"));
  await prisma.questionOption.delete({ where: { optionId } });

  redirect("/admin/flow?saved=1");
}
