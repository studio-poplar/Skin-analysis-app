import { prisma } from "@/lib/prisma";
import { ProductPicker } from "../../ProductPicker";
import {
  createArticleAction,
  deleteArticleAction,
  toggleArticleActiveAction,
  updateArticleAction,
} from "../../articles-actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "製品・タイトル・URLをすべて入力してください。",
};

export default async function AdminArticlesPage(props: PageProps<"/admin/articles">) {
  const searchParams = await props.searchParams;
  const created = searchParams?.created === "1";
  const saved = searchParams?.saved === "1";
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  const [products, articles] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, orderBy: { productId: "asc" } }),
    prisma.relatedArticle.findMany({
      include: { product: true },
      orderBy: [{ productId: "asc" }, { sortOrder: "asc" }],
    }),
  ]);

  const articlesByProduct = new Map<number, typeof articles>();
  for (const a of articles) {
    if (!articlesByProduct.has(a.productId)) articlesByProduct.set(a.productId, []);
    articlesByProduct.get(a.productId)!.push(a);
  }
  const productsWithArticles = products.filter((p) => articlesByProduct.has(p.productId));

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">関連記事管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        診断結果ページの「おすすめのお手入れステップ」に登場する製品に、外部記事(使い方・成分解説など)を手動で紐付けます。
        結果ページには、その診断結果のお手入れステップに含まれる製品の関連記事が最大3件まで表示されます。
      </p>

      {created && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">記事を追加しました。</p>}
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {errorKey && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {ERROR_MESSAGES[errorKey] ?? "エラーが発生しました。"}
        </p>
      )}

      <div className="mb-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <h2 className="mb-4 font-semibold text-zinc-900">新しい記事を追加</h2>
        <form action={createArticleAction} className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">紐付ける製品</span>
            <ProductPicker name="productId" products={products} placeholder="製品名またはコードで検索" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">記事タイトル</span>
            <input type="text" name="title" required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">記事URL(外部リンク・別タブで開きます)</span>
            <input type="url" name="url" required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm" />
          </label>
          <button type="submit" className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            追加する
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {productsWithArticles.length === 0 && (
          <p className="text-sm text-zinc-400">まだ関連記事が登録されていません。</p>
        )}
        {productsWithArticles.map((p) => (
          <div key={p.productId} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-zinc-900">{p.nameJp}</p>
              <span className="text-xs text-zinc-400">{p.productCode}</span>
            </div>
            <div className="space-y-2">
              {(articlesByProduct.get(p.productId) ?? []).map((a) => (
                <div key={a.id} className="rounded-lg border border-zinc-100 p-3">
                  <form action={updateArticleAction} className="mb-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <input
                      type="text"
                      name="title"
                      defaultValue={a.title}
                      className="min-w-[10rem] flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                    />
                    <input
                      type="url"
                      name="url"
                      defaultValue={a.url}
                      className="min-w-[12rem] flex-[2] rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                    />
                    <label className="flex items-center gap-1 text-xs text-zinc-500">
                      並び順
                      <input
                        type="number"
                        name="sortOrder"
                        defaultValue={a.sortOrder}
                        className="w-14 rounded-lg border border-zinc-200 px-1.5 py-1 text-sm"
                      />
                    </label>
                    <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                      保存
                    </button>
                  </form>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        a.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"
                      }`}
                    >
                      {a.isActive ? "表示中" : "非表示"}
                    </span>
                    <form action={toggleArticleActiveAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                        {a.isActive ? "非表示にする" : "表示する"}
                      </button>
                    </form>
                    <form action={deleteArticleAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                        削除する
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
