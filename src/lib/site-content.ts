import { prisma } from "@/lib/prisma";
import { isPreviewMode } from "@/lib/preview";

// 指定したキー群のサイト文言をまとめて取得する。プレビューモード時のみ下書き値を優先する。
// 呼び出し側は `map[key] ?? フォールバック文言` の形で使い、DB未投入でも壊れないようにする。
export async function getContentMap(keys: string[]): Promise<Record<string, string>> {
  const preview = await isPreviewMode();
  const rows = await prisma.siteContent.findMany({ where: { key: { in: keys } } });
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = (preview ? row.draftValue : null) ?? row.value;
  }
  return map;
}
