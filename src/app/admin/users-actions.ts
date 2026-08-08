"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/admin-auth";
import { getCurrentSession } from "@/lib/admin-session";
import { assertRole } from "./actions";

export async function createUserAction(formData: FormData) {
  await assertRole("admin");

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "editor") === "admin" ? "admin" : "editor";

  if (!username || !password) {
    redirect("/admin/users?error=missing");
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    redirect("/admin/users?error=duplicate");
  }

  await prisma.adminUser.create({
    data: { username, passwordHash: await hashPassword(password), role },
  });

  redirect("/admin/users?created=1");
}

export async function resetPasswordAction(formData: FormData) {
  await assertRole("admin");

  const userId = Number(formData.get("userId"));
  const password = String(formData.get("password") ?? "");

  if (!password) {
    redirect("/admin/users?error=missing");
  }

  await prisma.adminUser.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
  });

  redirect("/admin/users?saved=1");
}

export async function deleteUserAction(formData: FormData) {
  await assertRole("admin");

  const userId = Number(formData.get("userId"));
  const session = await getCurrentSession();
  if (session?.userId === userId) {
    redirect("/admin/users?error=self");
  }

  const target = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (target?.role === "admin") {
    const adminCount = await prisma.adminUser.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      redirect("/admin/users?error=lastadmin");
    }
  }

  await prisma.adminUser.delete({ where: { id: userId } });
  redirect("/admin/users?deleted=1");
}
