import { cookies } from "next/headers";
import { getCurrentSession } from "@/lib/admin-session";

export const PREVIEW_COOKIE_NAME = "admin_preview";

// プレビューCookieが立っていて、かつ有効な管理者/編集者セッションがある場合のみtrue
// (一般ユーザーがCookieを偽造しても、ログインセッションがなければ下書きは見えない)
export async function isPreviewMode(): Promise<boolean> {
  const cookieStore = await cookies();
  if (cookieStore.get(PREVIEW_COOKIE_NAME)?.value !== "1") return false;
  const session = await getCurrentSession();
  return session !== null;
}
