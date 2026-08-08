import { prisma } from "@/lib/prisma";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";
import {
  addCareStepAction,
  createProductAction,
  deleteProductAction,
  removeCareStepAction,
  toggleProductActiveAction,
  updateCareStepAction,
  updateProductAction,
} from "../../actions";

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";
  const created = searchParams?.created === "1";
  const error = searchParams?.error;

  const products = await prisma.product.findMany({
    include: { clinicalData: true },
    orderBy: { productId: "asc" },
  });

  const careSteps = await prisma.careStepOrder.findMany({ where: { categoryId: null }, orderBy: { sortOrder: "asc" } });

  // 過去の診断結果(DiagnosisResult.recommendedProductIds、JSON配列)で参照されている製品IDの一覧
  const pastResults = await prisma.diagnosisResult.findMany({ select: { recommendedProductIds: true } });
  const referencedProductIds = new Set<number>();
  for (const r of pastResults) {
    for (const id of (r.recommendedProductIds as number[]) ?? []) referencedProductIds.add(id);
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-900">製品管理</h1>
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {created && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">製品を追加しました。</p>}
      {error === "missing" && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">製品コードと製品名は必須です。</p>
      )}
      {error === "duplicate" && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">その製品コードは既に使われています。</p>
      )}
      {error === "product_has_results" && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          この製品は過去の診断結果で使われているため削除できません。「取扱中」のチェックを外して非表示にしてください。
        </p>
      )}

      <details className="mb-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <summary className="cursor-pointer font-semibold text-zinc-900">おすすめのお手入れステップの並び順(全体共通のデフォルト)</summary>
        <p className="mt-2 mb-4 text-xs text-zinc-500">
          結果画面の「おすすめのお手入れステップ」に表示する順番です。製品のカテゴリ名にキーワードが含まれる製品が、この順序で並びます(キーワードに一致しない製品はステップ表示の対象外になります)。
          症状カテゴリごとに個別の順番を設定したい場合は、<a href="/admin/mapping" className="underline">提案マッピング管理</a>から設定できます(未設定のカテゴリはここでの設定が使われます)。
        </p>
        <div className="mb-4 space-y-2">
          {careSteps.map((step) => (
            <div key={step.id} className="flex items-center gap-2">
              <form action={updateCareStepAction} className="flex flex-1 items-center gap-2">
                <input type="hidden" name="id" value={step.id} />
                <input
                  type="number"
                  name="sortOrder"
                  defaultValue={step.sortOrder}
                  className="w-16 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                />
                <input
                  type="text"
                  name="keyword"
                  defaultValue={step.keyword}
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                />
                <button type="submit" className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                  保存
                </button>
              </form>
              <form action={removeCareStepAction}>
                <input type="hidden" name="id" value={step.id} />
                <button type="submit" className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                  削除
                </button>
              </form>
            </div>
          ))}
        </div>
        <form action={addCareStepAction} className="flex items-center gap-2">
          <input
            type="text"
            name="keyword"
            placeholder="新しいキーワード(例: 化粧水)"
            className="flex-1 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200">
            追加
          </button>
        </form>
      </details>

      <details className="mb-8 rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
        <summary className="cursor-pointer font-semibold text-zinc-900">新しい製品を追加</summary>
        <form action={createProductAction} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">製品コード</span>
              <input
                type="text"
                name="productCode"
                required
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">日本版製品名</span>
              <input
                type="text"
                name="nameJp"
                required
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">参照元US製品名(任意・内部管理用)</span>
            <input
              type="text"
              name="nameUsRef"
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">カテゴリ</span>
              <select name="category" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm">
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">価格(円)</span>
              <input
                type="number"
                name="priceJpy"
                defaultValue={0}
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">購入ページURL</span>
            <input
              type="url"
              name="productUrl"
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-600">臨床データ要約</span>
            <textarea
              name="summaryText"
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="hasAntiWrinkleTest" />
              抗シワ効能評価試験済み
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-zinc-600">出典URL</span>
              <input
                type="url"
                name="sourceUrl"
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              />
            </label>
          </div>

          <button
            type="submit"
            className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            追加する
          </button>
        </form>
      </details>

      <div className="space-y-6">
        {products.map((p) => (
          <div key={p.productId} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <form
            action={updateProductAction}
          >
            <input type="hidden" name="productId" value={p.productId} />
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold text-zinc-900">{p.nameJp}</p>
              <span className="text-xs text-zinc-400">{p.productCode}</span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600">カテゴリ</span>
                <select
                  name="category"
                  defaultValue={p.category}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                >
                  {!PRODUCT_CATEGORIES.includes(p.category as (typeof PRODUCT_CATEGORIES)[number]) && (
                    <option value={p.category}>{p.category}(旧値)</option>
                  )}
                  {PRODUCT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600">価格(円)</span>
                <input
                  type="number"
                  name="priceJpy"
                  defaultValue={p.priceJpy}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                />
              </label>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={p.isActive} />
                取扱中
              </label>
            </div>

            <label className="mb-3 block text-sm">
              <span className="mb-1 block text-zinc-600">臨床データ要約</span>
              <textarea
                name="summaryText"
                defaultValue={p.clinicalData?.summaryText ?? ""}
                rows={3}
                className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
              />
            </label>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="hasAntiWrinkleTest"
                  defaultChecked={p.clinicalData?.hasAntiWrinkleTest ?? false}
                />
                抗シワ効能評価試験済み
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-zinc-600">出典URL</span>
                <input
                  type="url"
                  name="sourceUrl"
                  defaultValue={p.clinicalData?.sourceUrl ?? ""}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                />
              </label>
            </div>

            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              保存
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"
              }`}
            >
              {p.isActive ? "表示中" : "非表示"}
            </span>
            <form action={toggleProductActiveAction}>
              <input type="hidden" name="productId" value={p.productId} />
              <button type="submit" className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                {p.isActive ? "非表示にする" : "表示する"}
              </button>
            </form>
            <form action={deleteProductAction}>
              <input type="hidden" name="productId" value={p.productId} />
              <button
                type="submit"
                disabled={referencedProductIds.has(p.productId)}
                title={referencedProductIds.has(p.productId) ? "過去の診断結果で使われているため削除できません" : undefined}
                className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300 disabled:hover:bg-transparent"
              >
                削除する
              </button>
            </form>
          </div>
          </div>
        ))}
      </div>
    </div>
  );
}
