"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCsv, parseCsvBool } from "@/lib/csv";
import { assertRole } from "./actions";

// 管理画面のドラッグ&ドロップ並び替え(v8)から直接呼び出す(フォーム送信ではなく関数呼び出し)。
// Stepをまたいだ並び替えは対象外のため、呼び出し側で同じstep内のquestionIdのみを渡すこと。
export async function reorderQuestionsAction(orderedQuestionIds: number[]) {
  await assertRole("editor");

  await prisma.$transaction(
    orderedQuestionIds.map((questionId, index) =>
      prisma.question.update({ where: { questionId }, data: { sortOrder: index } })
    )
  );

  revalidatePath("/admin/flow");
  revalidatePath("/diagnosis");
}

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

export async function toggleGenreActiveAction(formData: FormData) {
  await assertRole("editor");

  const genreId = String(formData.get("genreId"));
  const genre = await prisma.genre.findUnique({ where: { genreId } });
  if (genre) {
    await prisma.genre.update({ where: { genreId }, data: { isActive: !genre.isActive } });
  }

  redirect("/admin/flow?saved=1");
}

// ジャンルの物理削除は、配下の症状カテゴリが残っている場合は行わない
// (先にカテゴリを全て削除/移動してもらう必要がある。過去のDiagnosisResultはcategoryId経由でのみ参照するため)
export async function deleteGenreAction(formData: FormData) {
  await assertRole("editor");

  const genreId = String(formData.get("genreId"));
  const categoryCount = await prisma.concernCategory.count({ where: { genreId } });
  if (categoryCount > 0) {
    redirect("/admin/flow?error=genre_has_categories");
  }

  await prisma.genre.delete({ where: { genreId } });

  redirect("/admin/flow?saved=1");
}

export async function toggleCategoryActiveAction(formData: FormData) {
  await assertRole("editor");

  const categoryId = String(formData.get("categoryId"));
  const category = await prisma.concernCategory.findUnique({ where: { categoryId } });
  if (category) {
    await prisma.concernCategory.update({ where: { categoryId }, data: { isActive: !category.isActive } });
  }

  const returnTo = String(formData.get("returnTo") ?? "/admin/flow");
  redirect(`${returnTo}?saved=1`);
}

// 症状カテゴリの物理削除は、過去の診断結果(DiagnosisResult)で参照されている場合は行わない。
// 紐付く一般知識(GeneralKnowledge)・製品マッピング(ProductConcernMap)・お手入れステップ設定(CareStepOrder)は
// スキーマ上onDelete: Cascadeのため自動的に削除される(現在の設定データであり、履歴データではないため問題ない)。
export async function deleteCategoryAction(formData: FormData) {
  await assertRole("editor");

  const categoryId = String(formData.get("categoryId"));
  const resultCount = await prisma.diagnosisResult.count({ where: { categoryId } });
  if (resultCount > 0) {
    redirect("/admin/flow?error=category_has_results");
  }

  await prisma.concernCategory.delete({ where: { categoryId } });

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

// v11追加: 診断フロー管理のCSV入出力(ジャンル)。genreIdをキーに新規追加・上書きする。
// 基本情報・ライフスタイル設問(Question/QuestionOption)はフォーム編集のみで、CSV対象は
// ジャンル・症状カテゴリの表形式データに限定している(指示書の「段階導入」方針による)。
export async function importGenresCsvAction(formData: FormData) {
  await assertRole("editor");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/flow?csvTarget=genres&csvError=missing_file");
  }

  const rows = parseCsv(await file.text());
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lineNo = i + 2;
    const genreId = (r.genreId ?? "").trim();
    const name = (r.name ?? "").trim();
    if (!genreId || !name) {
      errors.push(`${lineNo}行目: genreId/nameが空です`);
      continue;
    }
    const sortOrder = Number(r.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      errors.push(`${lineNo}行目(${genreId}): sortOrderが数値ではありません`);
      continue;
    }
    const data = { name, sortOrder, isActive: parseCsvBool(r.isActive) };
    const existing = await prisma.genre.findUnique({ where: { genreId } });
    if (existing) {
      await prisma.genre.update({ where: { genreId }, data });
      updated++;
    } else {
      await prisma.genre.create({ data: { genreId, ...data } });
      created++;
    }
  }

  revalidatePath("/admin/flow");
  revalidatePath("/diagnosis");
  const params = new URLSearchParams({ csvTarget: "genres", csvCreated: String(created), csvUpdated: String(updated) });
  if (errors.length > 0) params.set("csvErrors", errors.slice(0, 15).join(" / "));
  redirect(`/admin/flow?${params.toString()}`);
}

// v11追加: 診断フロー管理のCSV入出力(症状カテゴリ)。categoryIdをキーに新規追加・上書きする。
// 新規行(未知のcategoryId)は、既存のcreateCategoryActionと同様に空のGeneralKnowledgeも合わせて作成する。
export async function importCategoriesCsvAction(formData: FormData) {
  await assertRole("editor");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/flow?csvTarget=categories&csvError=missing_file");
  }

  const rows = parseCsv(await file.text());
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lineNo = i + 2;
    const categoryId = (r.categoryId ?? "").trim();
    const genreId = (r.genreId ?? "").trim();
    const name = (r.name ?? "").trim();
    if (!categoryId || !genreId || !name) {
      errors.push(`${lineNo}行目: categoryId/genreId/nameが空です`);
      continue;
    }
    const sortOrder = Number(r.sortOrder);
    if (!Number.isFinite(sortOrder)) {
      errors.push(`${lineNo}行目(${categoryId}): sortOrderが数値ではありません`);
      continue;
    }
    const genreExists = await prisma.genre.findUnique({ where: { genreId } });
    if (!genreExists) {
      errors.push(`${lineNo}行目(${categoryId}): genreId「${genreId}」が存在しません`);
      continue;
    }
    const data = {
      genreId,
      name,
      sortOrder,
      isActive: parseCsvBool(r.isActive),
      lineUrlOverride: r.lineUrlOverride?.trim() || null,
      lineMessageOverride: r.lineMessageOverride?.trim() || null,
    };
    const existing = await prisma.concernCategory.findUnique({ where: { categoryId } });
    if (existing) {
      await prisma.concernCategory.update({ where: { categoryId }, data });
      updated++;
    } else {
      await prisma.concernCategory.create({ data: { categoryId, ...data } });
      await prisma.generalKnowledge.create({ data: { categoryId, contentText: "", isSourceVerified: false } });
      created++;
    }
  }

  revalidatePath("/admin/flow");
  revalidatePath("/diagnosis");
  const params = new URLSearchParams({ csvTarget: "categories", csvCreated: String(created), csvUpdated: String(updated) });
  if (errors.length > 0) params.set("csvErrors", errors.slice(0, 15).join(" / "));
  redirect(`/admin/flow?${params.toString()}`);
}
