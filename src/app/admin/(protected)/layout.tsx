import { cookies } from "next/headers";
import Link from "next/link";
import { logoutAction, togglePreviewAction } from "../actions";
import { getCurrentSession } from "@/lib/admin-session";
import { PREVIEW_COOKIE_NAME } from "@/lib/preview";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  const isAdmin = session?.role === "admin";
  const cookieStore = await cookies();
  const previewOn = cookieStore.get(PREVIEW_COOKIE_NAME)?.value === "1";

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-y-2 px-6 py-4">
          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium text-zinc-600">
            <Link href="/admin" className="hover:text-zinc-900">
              ダッシュボード
            </Link>
            <Link href="/admin/flow" className="hover:text-zinc-900">
              診断フロー管理
            </Link>
            <Link href="/admin/products" className="hover:text-zinc-900">
              製品管理
            </Link>
            <Link href="/admin/knowledge" className="hover:text-zinc-900">
              診断結果管理
            </Link>
            <Link href="/admin/mapping" className="hover:text-zinc-900">
              提案マッピング
            </Link>
            <Link href="/admin/line" className="hover:text-zinc-900">
              LINE導線管理
            </Link>
            <Link href="/admin/content" className="hover:text-zinc-900">
              ページ文言管理
            </Link>
            <Link href="/admin/images" className="hover:text-zinc-900">
              画像管理
            </Link>
            <Link href="/admin/faq" className="hover:text-zinc-900">
              FAQ管理
            </Link>
            <Link href="/admin/articles" className="hover:text-zinc-900">
              関連記事管理
            </Link>
            {isAdmin && (
              <Link href="/admin/design" className="hover:text-zinc-900">
                デザイン設定
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/users" className="hover:text-zinc-900">
                ユーザー管理
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <form action={togglePreviewAction}>
              <input type="hidden" name="returnTo" value="/admin/knowledge" />
              <button
                type="submit"
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  previewOn ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                }`}
              >
                プレビューモード: {previewOn ? "ON" : "OFF"}
              </button>
            </form>
            <form action={logoutAction}>
              <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-600">
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
