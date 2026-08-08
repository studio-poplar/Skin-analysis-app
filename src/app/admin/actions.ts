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
  if (!keyword) redirect("/admin/products?error=missing");

  const count = await prisma.careStepOrder.count();
  await prisma.careStepOrder.create({ data: { keyword, sortOrder: count } });

  redirect("/admin/products?saved=1");
}

export async function updateCareStepAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  const keyword = String(formData.get("keyword") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder")) || 0;

  await prisma.careStepOrder.update({ where: { id }, data: { keyword, sortOrder } });

  redirect("/admin/products?saved=1");
}

export async function removeCareStepAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  await prisma.careStepOrder.delete({ where: { id } });

  redirect("/admin/products?saved=1");
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
