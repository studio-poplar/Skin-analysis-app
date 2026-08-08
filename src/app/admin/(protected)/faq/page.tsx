import { prisma } from "@/lib/prisma";
import { createFAQAction, deleteFAQAction, updateFAQAction } from "../../faq-actions";

const CATEGORY_LABELS: Record<string, string> = {
  product: "製品についてのFAQ",
  site: "このサイトについてのFAQ",
};

export default async function AdminFaqPage(props: PageProps<"/admin/faq">) {
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";
  const created = searchParams?.created === "1";
  const error = searchParams?.error;

  const items = await prisma.fAQItem.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category)!.push(item);
  }
  // "site"カテゴリがまだ空でも、追加フォームで選べるように見出しは常に出す
  if (!grouped.has("site")) grouped.set("site", []);

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">FAQ管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        よくある質問の質問文・回答・並び順・公開/非公開を管理します。「製品についてのFAQ」は公式サイト情報をベースにした初期データです。「このサイトについてのFAQ」は運営者が今後追加していく枠です。
      </p>
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {created && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">追加しました。</p>}
      {error === "missing" && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">質問と回答は必須です。</p>
      )}

      <div className="space-y-10">
        {["product", "site"].map((category) => (
          <section key={category}>
            <h2 className="mb-3 text-sm font-bold text-zinc-500">{CATEGORY_LABELS[category] ?? category}</h2>
            <div className="space-y-3">
              {(grouped.get(category) ?? []).map((item) => (
                <form
                  key={item.id}
                  action={updateFAQAction}
                  className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <label className="mb-2 block text-sm">
                    <span className="mb-1 block text-zinc-600">質問</span>
                    <input
                      type="text"
                      name="question"
                      defaultValue={item.question}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                    />
                  </label>
                  <label className="mb-3 block text-sm">
                    <span className="mb-1 block text-zinc-600">回答</span>
                    <textarea
                      name="answer"
                      defaultValue={item.answer}
                      rows={3}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-1 text-xs text-zinc-500">
                      並び順
                      <input
                        type="number"
                        name="sortOrder"
                        defaultValue={item.sortOrder}
                        className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                      />
                    </label>
                    <label className="flex items-center gap-1 text-xs text-zinc-500">
                      <input type="checkbox" name="isActive" defaultChecked={item.isActive} />
                      公開する
                    </label>
                    <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                      保存
                    </button>
                  </div>
                </form>
              ))}
              {(grouped.get(category) ?? []).length === 0 && (
                <p className="text-xs text-zinc-400">まだ質問がありません。</p>
              )}
            </div>

            <details className="mt-3 rounded-xl border border-dashed border-zinc-300 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-600">
                「{CATEGORY_LABELS[category] ?? category}」に質問を追加
              </summary>
              <form action={createFAQAction} className="mt-3 space-y-2">
                <input type="hidden" name="category" value={category} />
                <label className="block text-sm">
                  <span className="mb-1 block text-zinc-600">質問</span>
                  <input type="text" name="question" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-zinc-600">回答</span>
                  <textarea name="answer" rows={3} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
                </label>
                <button type="submit" className="rounded-full bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">
                  追加する
                </button>
              </form>
            </details>
          </section>
        ))}
      </div>

      <div className="mt-10 border-t border-zinc-100 pt-6">
        <h2 className="mb-3 text-sm font-bold text-zinc-500">削除</h2>
        <p className="mb-3 text-xs text-zinc-400">誤って追加した質問はここから削除できます(削除は元に戻せません)。</p>
        <div className="space-y-2">
          {items.map((item) => (
            <form key={item.id} action={deleteFAQAction} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2">
              <input type="hidden" name="id" value={item.id} />
              <span className="flex-1 truncate text-xs text-zinc-500">{item.question}</span>
              <button type="submit" className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                削除する
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
