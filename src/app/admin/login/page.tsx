import { loginAction } from "../actions";

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  const searchParams = await props.searchParams;
  const hasError = searchParams?.error === "1";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form action={loginAction} className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100">
        <h1 className="mb-6 text-lg font-bold text-zinc-900">管理画面ログイン</h1>

        <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="username">
          ユーザー名
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="mb-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
        />

        <label className="mb-1 block text-sm font-medium text-zinc-700" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mb-4 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
        />
        {hasError && <p className="mb-4 text-sm text-rose-600">ユーザー名またはパスワードが違います。</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}
