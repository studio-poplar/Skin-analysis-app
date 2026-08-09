import { prisma } from "@/lib/prisma";
import {
  createCategoryAction,
  createGenreAction,
  deleteCategoryAction,
  deleteGenreAction,
  toggleCategoryActiveAction,
  toggleGenreActiveAction,
  updateCategoryAction,
  updateGenreAction,
} from "../../flow-actions";
import { SortableQuestionList } from "./SortableQuestionList";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "名前を入力してください。",
  genre_has_categories: "このジャンルには症状カテゴリが残っているため削除できません。先にカテゴリを削除してください。",
  category_has_results: "このカテゴリは過去の診断結果で使われているため削除できません。「非表示にする」をご利用ください。",
};

export default async function AdminFlowPage(props: PageProps<"/admin/flow">) {
  const searchParams = await props.searchParams;
  const created = searchParams?.created === "1";
  const saved = searchParams?.saved === "1";
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;

  const genres = await prisma.genre.findMany({
    orderBy: { sortOrder: "asc" },
    include: { categories: { orderBy: { sortOrder: "asc" } } },
  });

  const resultCounts = await prisma.diagnosisResult.groupBy({
    by: ["categoryId"],
    _count: { categoryId: true },
  });
  const resultCountByCategory = new Map(resultCounts.map((r) => [r.categoryId, r._count.categoryId]));

  const basicQuestions = await prisma.question.findMany({
    where: { step: 1 },
    orderBy: { sortOrder: "asc" },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  const lifestyleQuestions = await prisma.question.findMany({
    where: { step: 2 },
    orderBy: { sortOrder: "asc" },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">診断フロー管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        ジャンルと症状カテゴリの追加・編集・並び順・有効/無効の切り替え、①基本情報の質問文・選択肢の編集ができます。
        「有効」を外すと、実際の診断フローと結果からは非表示になります(データは削除されません)。
      </p>

      {created && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">追加しました。</p>}
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {errorKey && (
        <p className="mb-6 rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {ERROR_MESSAGES[errorKey] ?? "エラーが発生しました。"}
        </p>
      )}

      <section className="mb-10 rounded-2xl border-2 border-zinc-200 p-5">
        <h2 className="mb-4 text-base font-bold text-zinc-900">Step2: 基本情報(年代・性別)</h2>
        <p className="mb-4 text-xs text-zinc-500">左端の「⠿」をドラッグすると表示順を並び替えられます(2026-08-09追加)。</p>
        <SortableQuestionList questions={basicQuestions} />
      </section>

      <section className="mb-10 rounded-2xl border-2 border-zinc-200 p-5">
        <h2 className="mb-4 text-base font-bold text-zinc-900">Step3: ライフスタイル設問(スキンケア・サプリメント)</h2>
        <p className="mb-4 text-xs text-zinc-500">
          質問文・選択肢テキストの編集や選択肢の追加・削除ができます(選択形式(単一/複数選択)自体は編集画面からは変更できません)。
          左端の「⠿」をドラッグすると表示順を並び替えられます(2026-08-09追加)。
        </p>
        <SortableQuestionList questions={lifestyleQuestions} />
      </section>

      <section className="mb-10 rounded-2xl border-2 border-zinc-200 p-5">
        <h2 className="mb-4 text-base font-bold text-zinc-900">Step4・5: 気になること・症状の深掘り</h2>
        <p className="mb-4 text-xs text-zinc-500">
          ジャンル(Step3で選ぶ「気になること」)と、その中の症状カテゴリ(Step4で選ぶ「症状の深掘り」)をまとめて編集します。
        </p>
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">ジャンル・症状カテゴリ</h3>
        <div className="space-y-6">
          {genres.map((genre) => (
            <div key={genre.genreId} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-4">
                <form action={updateGenreAction} className="flex flex-1 flex-wrap items-center gap-2">
                  <input type="hidden" name="genreId" value={genre.genreId} />
                  <input
                    type="text"
                    name="name"
                    defaultValue={genre.name}
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-semibold"
                  />
                  <label className="flex items-center gap-1 text-xs text-zinc-500">
                    並び順
                    <input
                      type="number"
                      name="sortOrder"
                      defaultValue={genre.sortOrder}
                      className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <input type="hidden" name="isActive" value={genre.isActive ? "on" : ""} />
                  <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                    保存
                  </button>
                </form>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    genre.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  {genre.isActive ? "表示中" : "非表示"}
                </span>
                <form action={toggleGenreActiveAction}>
                  <input type="hidden" name="genreId" value={genre.genreId} />
                  <button type="submit" className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                    {genre.isActive ? "非表示にする" : "表示する"}
                  </button>
                </form>
                <form action={deleteGenreAction}>
                  <input type="hidden" name="genreId" value={genre.genreId} />
                  <button
                    type="submit"
                    disabled={genre.categories.length > 0}
                    title={genre.categories.length > 0 ? "症状カテゴリが残っているため削除できません" : undefined}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300 disabled:hover:bg-transparent"
                  >
                    削除する
                  </button>
                </form>
              </div>

              <div className="space-y-3 pl-2">
                {genre.categories.map((cat) => (
                  <details key={cat.categoryId} className="rounded-lg border border-zinc-100 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-zinc-700">
                      {cat.name}
                      <span className="ml-2 text-xs text-zinc-400">({cat.categoryId})</span>
                      {!cat.isActive && <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-400">無効</span>}
                    </summary>
                    <form action={updateCategoryAction} className="mt-3 space-y-2">
                      <input type="hidden" name="categoryId" value={cat.categoryId} />
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          name="name"
                          defaultValue={cat.name}
                          className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                        />
                        <label className="flex items-center gap-1 text-xs text-zinc-500">
                          並び順
                          <input
                            type="number"
                            name="sortOrder"
                            defaultValue={cat.sortOrder}
                            className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                          />
                        </label>
                        <input type="hidden" name="isActive" value={cat.isActive ? "on" : ""} />
                      </div>
                      <label className="block text-xs text-zinc-500">
                        LINE誘導URL(個別、未設定なら共通設定を使用)
                        <input
                          type="text"
                          name="lineUrlOverride"
                          defaultValue={cat.lineUrlOverride ?? ""}
                          placeholder="https://line.me/..."
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block text-xs text-zinc-500">
                        LINEトーク誘導メッセージ(個別)
                        <input
                          type="text"
                          name="lineMessageOverride"
                          defaultValue={cat.lineMessageOverride ?? ""}
                          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                        />
                      </label>
                      <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
                        保存
                      </button>
                    </form>
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          cat.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-500"
                        }`}
                      >
                        {cat.isActive ? "表示中" : "非表示"}
                      </span>
                      <form action={toggleCategoryActiveAction}>
                        <input type="hidden" name="categoryId" value={cat.categoryId} />
                        <input type="hidden" name="returnTo" value="/admin/flow" />
                        <button type="submit" className="rounded-full border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                          {cat.isActive ? "非表示にする" : "表示する"}
                        </button>
                      </form>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="categoryId" value={cat.categoryId} />
                        <button
                          type="submit"
                          disabled={(resultCountByCategory.get(cat.categoryId) ?? 0) > 0}
                          title={
                            (resultCountByCategory.get(cat.categoryId) ?? 0) > 0
                              ? "過去の診断結果で使われているため削除できません"
                              : undefined
                          }
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300 disabled:hover:bg-transparent"
                        >
                          削除する
                        </button>
                      </form>
                    </div>
                  </details>
                ))}

                <form action={createCategoryAction} className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-2">
                  <input type="hidden" name="genreId" value={genre.genreId} />
                  <input
                    type="text"
                    name="name"
                    placeholder="新しい症状カテゴリ名"
                    className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                  />
                  <button type="submit" className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200">
                    追加
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <h3 className="mb-3 mt-6 text-sm font-semibold text-zinc-700">新しいジャンルを追加</h3>
        <form action={createGenreAction} className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
          <input
            type="text"
            name="name"
            placeholder="ジャンル名"
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700">
            追加する
          </button>
        </form>
      </section>
    </div>
  );
}
