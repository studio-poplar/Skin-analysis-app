"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertRole } from "./actions";

// 診断履歴(DiagnosisSession)の削除。追加実装指示書v9-A対応。
// DiagnosisResultはスキーマ上onDelete: Cascadeのため、DiagnosisSessionを削除すれば連動して削除される。
// LINEクリック数(lineRedirectClicked)もDiagnosisSession自体の列のため、同時に削除される。
// 本番運用開始後に実データを誤って消してしまうリスクが最も高い機能のため、admin専用とする。

function rangeToDateFilter(fromDate?: string, toDate?: string): { gte?: Date; lt?: Date } {
  const range: { gte?: Date; lt?: Date } = {};
  if (fromDate) range.gte = new Date(`${fromDate}T00:00:00`);
  if (toDate) {
    const end = new Date(`${toDate}T00:00:00`);
    end.setDate(end.getDate() + 1); // 終了日を含めるため翌日0時未満とする
    range.lt = end;
  }
  return range;
}

export async function previewHistoryDeleteCountAction(fromDate?: string, toDate?: string): Promise<number> {
  await assertRole("admin");

  const range = rangeToDateFilter(fromDate, toDate);
  return prisma.diagnosisSession.count({
    where: range.gte || range.lt ? { startedAt: range } : undefined,
  });
}

export async function clearAllDiagnosisHistoryAction(): Promise<{ deletedCount: number }> {
  await assertRole("admin");

  const { count } = await prisma.diagnosisSession.deleteMany({});
  revalidatePath("/admin");
  return { deletedCount: count };
}

// 期間未指定での誤った全件削除を防ぐため、開始日・終了日のいずれかは必須にする。
export async function clearDiagnosisHistoryByRangeAction(
  fromDate?: string,
  toDate?: string
): Promise<{ deletedCount: number }> {
  await assertRole("admin");

  const range = rangeToDateFilter(fromDate, toDate);
  if (!range.gte && !range.lt) {
    throw new Error("削除範囲(開始日または終了日)を指定してください。");
  }

  const { count } = await prisma.diagnosisSession.deleteMany({ where: { startedAt: range } });
  revalidatePath("/admin");
  return { deletedCount: count };
}
