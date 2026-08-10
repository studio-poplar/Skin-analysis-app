"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  createSessionToken,
  hashPassword,
  roleSatisfies,
  verifySessionToken,
  type AdminRole,
} from "@/lib/admin-auth";
import { PREVIEW_COOKIE_NAME } from "@/lib/preview";
import { parseCsv, parseCsvBool } from "@/lib/csv";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user || (await hashPassword(password)) !== user.passwordHash) {
    redirect("/admin/login?error=1");
  }

  const token = await createSessionToken(user.id, user.role as AdminRole);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8時間
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(PREVIEW_COOKIE_NAME);
  redirect("/admin/login");
}

export async function togglePreviewAction(formData: FormData) {
  await assertRole("editor");

  const cookieStore = await cookies();
  const turnOn = cookieStore.get(PREVIEW_COOKIE_NAME)?.value !== "1";
  if (turnOn) {
    cookieStore.set(PREVIEW_COOKIE_NAME, "1", { httpOnly: true, sameSite: "lax", path: "/" });
  } else {
    cookieStore.delete(PREVIEW_COOKIE_NAME);
  }

  const returnTo = String(formData.get("returnTo") ?? "/admin");
  redirect(returnTo);
}

export async function assertRole(required: AdminRole) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  if (!session || !roleSatisfies(session, required)) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function updateProductAction(formData: FormData) {
  await assertRole("editor");

  const productId = Number(formData.get("productId"));
  const category = String(formData.get("category") ?? "");
  const priceJpy = Number(formData.get("priceJpy"));
  const isActive = formData.get("isActive") === "on";
  const summaryText = String(formData.get("summaryText") ?? "");
  const hasAntiWrinkleTest = formData.get("hasAntiWrinkleTest") === "on";
  const sourceUrl = String(formData.get("sourceUrl") ?? "");

  await prisma.product.update({
    where: { productId },
    data: { category, priceJpy, isActive },
  });

  await prisma.productClinicalData.upsert({
    where: { productId },
    update: { summaryText, hasAntiWrinkleTest, sourceUrl: sourceUrl || null },
    create: { productId, summaryText, hasAntiWrinkleTest, sourceUrl: sourceUrl || null },
  });

  redirect("/admin/products?saved=1");
}

export async function createProductAction(formData: FormData) {
  await assertRole("editor");

  const productCode = String(formData.get("productCode") ?? "").trim();
  const nameJp = String(formData.get("nameJp") ?? "").trim();
  const nameUsRef = String(formData.get("nameUsRef") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const priceJpy = Number(formData.get("priceJpy")) || 0;
  const productUrl = String(formData.get("productUrl") ?? "").trim();
  const summaryText = String(formData.get("summaryText") ?? "").trim();
  const hasAntiWrinkleTest = formData.get("hasAntiWrinkleTest") === "on";
  const sourceUrl = String(formData.get("sourceUrl") ?? "").trim();

  if (!productCode || !nameJp) {
    redirect("/admin/products?error=missing");
  }

  const existing = await prisma.product.findUnique({ where: { productCode } });
  if (existing) {
    redirect("/admin/products?error=duplicate");
  }

  const product = await prisma.product.create({
    data: {
      productCode,
      nameJp,
      nameUsRef: nameUsRef || null,
      category,
      priceJpy,
      productUrl: productUrl || "",
      isActive: true,
    },
  });

  await prisma.productClinicalData.create({
    data: {
      productId: product.productId,
      summaryText,
      hasAntiWrinkleTest,
      sourceUrl: sourceUrl || null,
    },
  });

  redirect("/admin/products?created=1");
}

export async function toggleProductActiveAction(formData: FormData) {
  await assertRole("editor");

  const productId = Number(formData.get("productId"));
  const product = await prisma.product.findUnique({ where: { productId } });
  if (product) {
    await prisma.product.update({ where: { productId }, data: { isActive: !product.isActive } });
  }

  redirect("/admin/products?saved=1");
}

// 製品の物理削除は、過去の診断結果(DiagnosisResult.recommendedProductIds)で参照されている場合は行わない。
// recommendedProductIdsはJSON配列(FK制約なし)のため、DB制約ではなくアプリ側でraw SQLのJSON包含検索によりチェックする。
async function isProductReferencedInPastResults(productId: number): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint as count FROM diagnosis_results
    WHERE recommended_product_ids @> ${JSON.stringify([productId])}::jsonb
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}

export async function deleteProductAction(formData: FormData) {
  await assertRole("editor");

  const productId = Number(formData.get("productId"));
  if (await isProductReferencedInPastResults(productId)) {
    redirect("/admin/products?error=product_has_results");
  }

  await prisma.product.delete({ where: { productId } });

  redirect("/admin/products?saved=1");
}

// v11追加: CSVアップロードで製品を一括登録・更新する。productCodeをキーに既存行を上書き、
// 無ければ新規作成する。行単位でバリデーションし、不正な行はスキップして続行する
// (全体を差し戻すのではなく、正常な行だけを反映する方式。指示書の「詳細は実装時に決定」を受けての判断)。
export async function importProductsCsvAction(formData: FormData) {
  await assertRole("editor");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/admin/products?csvError=missing_file");
  }

  const text = await file.text();
  const rows = parseCsv(text);

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const lineNo = i + 2; // 1行目はヘッダーのため

    const productCode = (r.productCode ?? "").trim();
    const nameJp = (r.nameJp ?? "").trim();
    if (!productCode || !nameJp) {
      errors.push(`${lineNo}行目: productCode/nameJpが空です`);
      continue;
    }

    const category = (r.category ?? "").trim();
    if (!PRODUCT_CATEGORIES.includes(category as (typeof PRODUCT_CATEGORIES)[number])) {
      errors.push(`${lineNo}行目(${productCode}): カテゴリ「${category}」は不正です`);
      continue;
    }

    const priceJpy = Number(r.priceJpy);
    if (!Number.isFinite(priceJpy)) {
      errors.push(`${lineNo}行目(${productCode}): 価格が数値ではありません`);
      continue;
    }

    const productData = {
      nameJp,
      nameUsRef: r.nameUsRef?.trim() || null,
      category,
      priceJpy,
      productUrl: r.productUrl?.trim() ?? "",
      isActive: parseCsvBool(r.isActive),
    };

    const existing = await prisma.product.findUnique({ where: { productCode } });
    let productId: number;
    if (existing) {
      await prisma.product.update({ where: { productCode }, data: productData });
      productId = existing.productId;
      updated++;
    } else {
      const createdProduct = await prisma.product.create({ data: { productCode, ...productData } });
      productId = createdProduct.productId;
      created++;
    }

    const clinicalData = {
      summaryText: r.summaryText ?? "",
      hasAntiWrinkleTest: parseCsvBool(r.hasAntiWrinkleTest),
      sourceUrl: r.sourceUrl?.trim() || null,
    };
    await prisma.productClinicalData.upsert({
      where: { productId },
      update: clinicalData,
      create: { productId, ...clinicalData },
    });
  }

  const params = new URLSearchParams();
  params.set("csvCreated", String(created));
  params.set("csvUpdated", String(updated));
  if (errors.length > 0) params.set("csvErrors", errors.slice(0, 15).join(" / "));
  redirect(`/admin/products?${params.toString()}`);
}

export async function updateKnowledgeAction(formData: FormData) {
  await assertRole("editor");

  const knowledgeId = Number(formData.get("knowledgeId"));
  const contentText = String(formData.get("contentText") ?? "");
  const selfCareText = String(formData.get("selfCareText") ?? "");
  const sourceUrl = String(formData.get("sourceUrl") ?? "");
  const isSourceVerified = formData.get("isSourceVerified") === "on";

  await prisma.generalKnowledge.update({
    where: { knowledgeId },
    data: { contentText, selfCareText: selfCareText || null, sourceUrl: sourceUrl || null, isSourceVerified },
  });

  redirect("/admin/knowledge?saved=1");
}

export async function saveKnowledgeDraftAction(formData: FormData) {
  await assertRole("editor");

  const knowledgeId = Number(formData.get("knowledgeId"));
  const draftContentText = String(formData.get("draftContentText") ?? "");
  const draftSelfCareText = String(formData.get("draftSelfCareText") ?? "");

  await prisma.generalKnowledge.update({
    where: { knowledgeId },
    data: {
      draftContentText: draftContentText || null,
      draftSelfCareText: draftSelfCareText || null,
    },
  });

  redirect("/admin/knowledge?draftSaved=1");
}

export async function publishKnowledgeDraftAction(formData: FormData) {
  await assertRole("editor");

  const knowledgeId = Number(formData.get("knowledgeId"));
  const row = await prisma.generalKnowledge.findUnique({ where: { knowledgeId } });
  if (row) {
    await prisma.generalKnowledge.update({
      where: { knowledgeId },
      data: {
        contentText: row.draftContentText ?? row.contentText,
        selfCareText: row.draftSelfCareText ?? row.selfCareText,
        draftContentText: null,
        draftSelfCareText: null,
      },
    });
  }

  redirect("/admin/knowledge?published=1");
}

// GeneralKnowledgeはDiagnosisResultから直接参照されない(結果画面はcategoryId経由でその都度取得するだけ)ため、
// 物理削除しても過去の診断結果セッションには影響しない。
export async function deleteKnowledgeAction(formData: FormData) {
  await assertRole("editor");

  const knowledgeId = Number(formData.get("knowledgeId"));
  await prisma.generalKnowledge.delete({ where: { knowledgeId } });

  redirect("/admin/knowledge?saved=1");
}

export async function createKnowledgeForCategoryAction(formData: FormData) {
  await assertRole("editor");

  const categoryId = String(formData.get("categoryId"));
  await prisma.generalKnowledge.create({
    data: { categoryId, contentText: "", isSourceVerified: false },
  });

  redirect("/admin/knowledge?created=1");
}

export async function saveCategoryNameDraftAction(formData: FormData) {
  await assertRole("editor");

  const categoryId = String(formData.get("categoryId"));
  const draftName = String(formData.get("draftName") ?? "").trim();

  await prisma.concernCategory.update({
    where: { categoryId },
    data: { draftName: draftName || null },
  });

  redirect("/admin/knowledge?draftSaved=1");
}

export async function publishCategoryNameDraftAction(formData: FormData) {
  await assertRole("editor");

  const categoryId = String(formData.get("categoryId"));
  const category = await prisma.concernCategory.findUnique({ where: { categoryId } });
  if (category?.draftName) {
    await prisma.concernCategory.update({
      where: { categoryId },
      data: { name: category.draftName, draftName: null },
    });
  }

  redirect("/admin/knowledge?published=1");
}

export async function addCategoryProductAction(formData: FormData) {
  await assertRole("editor");

  const categoryId = String(formData.get("categoryId"));
  const productId = Number(formData.get("productId"));
  const priority = Number(formData.get("priority")) || 1;

  if (!productId || Number.isNaN(productId)) {
    redirect("/admin/mapping?error=missing_product");
  }

  const existing = await prisma.productConcernMap.findFirst({ where: { categoryId, productId } });
  if (!existing) {
    await prisma.productConcernMap.create({ data: { categoryId, productId, priority } });
  }

  redirect("/admin/mapping?saved=1");
}

export async function updateCategoryProductPriorityAction(formData: FormData) {
  await assertRole("editor");

  const mapId = Number(formData.get("mapId"));
  const priority = Number(formData.get("priority")) || 1;

  await prisma.productConcernMap.update({ where: { mapId }, data: { priority } });

  redirect("/admin/mapping?saved=1");
}

export async function removeCategoryProductAction(formData: FormData) {
  await assertRole("editor");

  const mapId = Number(formData.get("mapId"));
  await prisma.productConcernMap.delete({ where: { mapId } });

  redirect("/admin/mapping?saved=1");
}

export async function addCareStepAction(formData: FormData) {
  await assertRole("editor");

  const keyword = String(formData.get("keyword") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim() || null;
  const returnTo = String(formData.get("returnTo") ?? "/admin/products");
  if (!keyword) redirect(`${returnTo}?error=missing`);

  const count = await prisma.careStepOrder.count({ where: { categoryId } });
  await prisma.careStepOrder.create({ data: { keyword, categoryId, sortOrder: count } });

  redirect(`${returnTo}?saved=1`);
}

export async function updateCareStepAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  const keyword = String(formData.get("keyword") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder")) || 0;
  const returnTo = String(formData.get("returnTo") ?? "/admin/products");

  await prisma.careStepOrder.update({ where: { id }, data: { keyword, sortOrder } });

  redirect(`${returnTo}?saved=1`);
}

export async function removeCareStepAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  const returnTo = String(formData.get("returnTo") ?? "/admin/products");
  await prisma.careStepOrder.delete({ where: { id } });

  redirect(`${returnTo}?saved=1`);
}

export async function setOptionOverrideAction(formData: FormData) {
  await assertRole("editor");

  const optionId = Number(formData.get("optionId"));
  const productIdRaw = String(formData.get("productId") ?? "");

  await prisma.optionProductMap.deleteMany({ where: { optionId } });
  if (productIdRaw) {
    await prisma.optionProductMap.create({ data: { optionId, productId: Number(productIdRaw) } });
  }

  redirect("/admin/mapping?saved=1");
}
