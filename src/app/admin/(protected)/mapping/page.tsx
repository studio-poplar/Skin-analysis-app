import { prisma } from "@/lib/prisma";
import {
  addCategoryProductAction,
  removeCategoryProductAction,
  setOptionOverrideAction,
  updateCategoryProductPriorityAction,
} from "../../actions";

export default async function AdminMappingPage(props: PageProps<"/admin/mapping">) {
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";

  const [genres, products, q3Questions] = await Promise.all([
    prisma.genre.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: {
            productMaps: { include: { product: true }, orderBy: { priority: "asc" } },
          },
        },
      },
    }),
    prisma.product.findMany({ where: { isActive: true }, orderBy: { productId: "asc" } }),
    prisma.question.findMany({
      where: { step: 3, parentCategoryId: { not: null } },
      include: {
        options: {
          orderBy: { sortOrder: "asc" },
          include: { productMaps: true },
        },
      },
    }),
  ]);

  const q3ByCategory = new Map(q3Questions.map((q) => [q.parentCategoryId!, q]));

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">カテゴリ×製品マッピング管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        各カテゴリでおすすめする製品と優先順位(数字が小さいほど優先)を設定します。深掘り質問がある回答ごとに、優先順位を無視して特定の製品を指定することもできます。
      </p>
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}

      <div className="space-y-10">
        {genres.map((genre) => (
          <div key={genre.genreId}>
            <h2 className="mb-3 text-sm font-bold text-zinc-500">{genre.name}</h2>
            <div className="space-y-4">
              {genre.categories.map((category) => {
                const mappedProductIds = new Set(category.productMaps.map((m) => m.productId));
                const addableProducts = products.filter((p) => !mappedProductIds.has(p.productId));
                const q3 = q3ByCategory.get(category.categoryId);

                return (
                  <div key={category.categoryId} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
              <h2 className="mb-4 font-semibold text-zinc-900">{category.name}</h2>

              <p className="mb-2 text-xs font-semibold text-zinc-500">優先順位リスト(深掘り質問がない、または個別指定がない場合の提案)</p>
              <div className="mb-4 space-y-2">
                {category.productMaps.map((m) => (
                  <div key={m.mapId} className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2">
                    <form action={updateCategoryProductPriorityAction} className="flex items-center gap-2">
                      <input type="hidden" name="mapId" value={m.mapId} />
                      <span className="flex-1 text-sm text-zinc-700">{m.product.nameJp}</span>
                      <label className="flex items-center gap-1 text-xs text-zinc-500">
                        優先度
                        <input
                          type="number"
                          name="priority"
                          defaultValue={m.priority}
                          min={1}
                          className="w-14 rounded border border-zinc-200 px-1.5 py-1 text-sm"
                        />
                      </label>
                      <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                        更新
                      </button>
                    </form>
                    <form action={removeCategoryProductAction}>
                      <input type="hidden" name="mapId" value={m.mapId} />
                      <button type="submit" className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                        削除
                      </button>
                    </form>
                  </div>
                ))}
                {category.productMaps.length === 0 && (
                  <p className="text-xs text-zinc-400">まだ製品が設定されていません。</p>
                )}
              </div>

              {addableProducts.length > 0 && (
                <form action={addCategoryProductAction} className="mb-4 flex items-center gap-2">
                  <input type="hidden" name="categoryId" value={category.categoryId} />
                  <select name="productId" className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm">
                    {addableProducts.map((p) => (
                      <option key={p.productId} value={p.productId}>
                        {p.nameJp}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="priority"
                    defaultValue={category.productMaps.length + 1}
                    min={1}
                    className="w-16 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                  />
                  <button type="submit" className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700">
                    追加
                  </button>
                </form>
              )}

              {q3 && (
                <div className="mt-4 border-t border-zinc-100 pt-4">
                  <p className="mb-2 text-xs font-semibold text-zinc-500">
                    選択肢ごとの製品指定(任意・優先順位より優先されます)
                  </p>
                  <p className="mb-3 text-xs text-zinc-400">「{q3.questionText}」の回答ごとの指定</p>
                  <div className="space-y-2">
                    {q3.options.map((option) => (
                      <form
                        key={option.optionId}
                        action={setOptionOverrideAction}
                        className="flex items-center gap-2 rounded-lg border border-zinc-100 p-2"
                      >
                        <input type="hidden" name="optionId" value={option.optionId} />
                        <span className="flex-1 text-sm text-zinc-700">{option.optionText}</span>
                        <select
                          name="productId"
                          defaultValue={option.productMaps[0]?.productId ?? ""}
                          className="w-56 rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
                        >
                          <option value="">指定なし(優先順位リストを使用)</option>
                          {products.map((p) => (
                            <option key={p.productId} value={p.productId}>
                              {p.nameJp}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                          保存
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
