import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/admin-session";
import { createUserAction, deleteUserAction, resetPasswordAction } from "../../users-actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "ユーザー名とパスワードを入力してください。",
  duplicate: "そのユーザー名は既に使われています。",
  self: "自分自身は削除できません。",
  lastadmin: "最後の管理者アカウントは削除できません。",
};

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const session = await getCurrentSession();
  if (session?.role !== "admin") {
    redirect("/admin");
  }

  const searchParams = await props.searchParams;
  const created = searchParams?.created === "1";
  const saved = searchParams?.saved === "1";
  const deleted = searchParams?.deleted === "1";
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  const users = await prisma.adminUser.findMany({ orderBy: { id: "asc" } });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">ユーザー管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        管理者(admin)はすべての操作、編集者(editor)はユーザー管理・デザイン設定以外の操作が行えます。
      </p>

      {created && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">ユーザーを追加しました。</p>}
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">パスワードを更新しました。</p>}
      {deleted && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">ユーザーを削除しました。</p>}
      {errorKey && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {ERROR_MESSAGES[errorKey] ?? "エラーが発生しました。"}
        </p>
      )}

      <div className="mb-8 space-y-3">
        {users.map((u) => (
          <div key={u.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-zinc-900">
                {u.username}
                {u.id === session.userId && <span className="ml-2 text-xs text-zinc-400">(あなた)</span>}
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  u.role === "admin" ? "bg-rose-100 text-rose-700" : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {u.role === "admin" ? "管理者" : "編集者"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form action={resetPasswordAction} className="flex items-center gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <input
                  type="password"
                  name="password"
                  placeholder="新しいパスワード"
                  className="w-40 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                />
                <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                  パスワード変更
                </button>
              </form>
              {u.id !== session.userId && (
                <form action={deleteUserAction}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button type="submit" className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                    削除
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <h2 className="mb-4 font-semibold text-zinc-900">新しいユーザーを追加</h2>
        <form action={createUserAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">ユーザー名</span>
              <input type="text" name="username" required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">パスワード</span>
              <input type="password" name="password" required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">権限</span>
            <select name="role" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm">
              <option value="editor">編集者(editor)</option>
              <option value="admin">管理者(admin)</option>
            </select>
          </label>
          <button type="submit" className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            追加する
          </button>
        </form>
      </div>
    </div>
  );
}
