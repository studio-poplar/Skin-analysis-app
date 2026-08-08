"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { assertRole } from "./actions";

export async function createFAQAction(formData: FormData) {
  await assertRole("editor");

  const category = String(formData.get("category") ?? "product");
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) redirect("/admin/faq?error=missing");

  const count = await prisma.fAQItem.count({ where: { category } });
  await prisma.fAQItem.create({
    data: { category, question, answer, sortOrder: count },
  });

  redirect("/admin/faq?created=1");
}

export async function updateFAQAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder")) || 0;
  const isActive = formData.get("isActive") === "on";

  await prisma.fAQItem.update({
    where: { id },
    data: { question, answer, sortOrder, isActive },
  });

  redirect("/admin/faq?saved=1");
}

export async function deleteFAQAction(formData: FormData) {
  await assertRole("editor");

  const id = Number(formData.get("id"));
  await prisma.fAQItem.delete({ where: { id } });

  redirect("/admin/faq?saved=1");
}
