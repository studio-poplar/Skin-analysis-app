import { prisma } from "@/lib/prisma";
import {
  publishCategoryNameDraftAction,
  publishKnowledgeDraftAction,
  saveCategoryNameDraftAction,
  saveKnowledgeDraftAction,
  updateKnowledgeAction,
} from "../../actions";

export default async function AdminKnowledgePage(props: PageProps<"/admin/knowledge">) {
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";
  const draftSaved = searchParams?.draftSaved === "1";
  const published = searchParams?.published === "1";

  const genres = await prisma.genre.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        include: { generalKnowledge: true },
      },
    },
  });

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">診断結果管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        カテゴリ名・原因の説明(Why)・改善方法(How)は薬機法の観点で出典確認が必要です。「下書き保存」でひとまず保存し、内容を確認したい場合はヘッダーの「プレビューモード」をONにしてから実際に診断を行うと、下書き内容が反映された結果画面を確認できます。問題なければ「公開」を押してください(公開するまで一般公開画面には反映されません)。
      </p>
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {draftSaved && <p className="mb-6 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">下書きを保存しました。</p>}
      {published && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">公開しました。</p>}

      <div className="space-y-10">
        {genres.map((genre) => (
          <div key={genre.genreId}>
            <h2 className="mb-3 text-sm font-bold text-zinc-500">{genre.name}</h2>
            <div className="space-y-6">
              {genre.categories.map((category) => (
                <div key={category.categoryId} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
                  {/* カテゴリ名(下書き/公開) */}
                  <div className="mb-4 border-b border-zinc-100 pb-4">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-500">カテゴリ名</span>
                      <span className="text-sm font-bold text-zinc-900">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <form action={saveCategoryNameDraftAction} className="flex flex-1 items-center gap-2">
                        <input type="hidden" name="categoryId" value={category.categoryId} />
                        <input
                          type="text"
                          name="draftName"
                          defaultValue={category.draftName ?? ""}
                          placeholder="下書きの新しい名前(空欄なら下書きなし)"
                          className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                        />
                        <button type="submit" className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                          下書き保存
                        </button>
                      </form>
                      {category.draftName && (
                        <form action={publishCategoryNameDraftAction}>
                          <input type="hidden" name="categoryId" value={category.categoryId} />
                          <button type="submit" className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                            公開
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {category.generalKnowledge.map((k) => (
                    <div key={k.knowledgeId}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500">Why / How</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            k.isSourceVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {k.isSourceVerified ? "出典確認済み" : "出典未確認"}
                        </span>
                      </div>

                      {/* 即時公開の編集フォーム */}
                      <form action={updateKnowledgeAction} className="mb-5 rounded-lg border border-zinc-100 p-3">
                        <input type="hidden" name="knowledgeId" value={k.knowledgeId} />
                        <p className="mb-2 text-xs font-semibold text-zinc-400">公開中の内容(保存すると即座に反映されます)</p>
                        <label className="mb-3 block text-sm">
                          <span className="mb-1 block text-zinc-600">原因の説明(Why)</span>
                          <textarea
                            name="contentText"
                            defaultValue={k.contentText}
                            rows={4}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                          />
                        </label>
                        <label className="mb-3 block text-sm">
                          <span className="mb-1 block text-zinc-600">改善方法(How・まずできること)</span>
                          <textarea
                            name="selfCareText"
                            defaultValue={k.selfCareText ?? ""}
                            rows={3}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                          />
                        </label>
                        <label className="mb-3 block text-sm">
                          <span className="mb-1 block text-zinc-600">出典URL</span>
                          <input
                            type="url"
                            name="sourceUrl"
                            defaultValue={k.sourceUrl ?? ""}
                            className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
                          />
                        </label>
                        <label className="mb-3 flex items-center gap-2 text-sm">
                          <input type="checkbox" name="isSourceVerified" defaultChecked={k.isSourceVerified} />
                          出典確認済み
                        </label>
                        <button type="submit" className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
                          保存(即公開)
                        </button>
                      </form>

                      {/* 下書き編集フォーム */}
                      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-xs font-semibold text-amber-700">下書き(プレビューモードでのみ表示され、公開まで一般には見えません)</p>
                          {(k.draftContentText || k.draftSelfCareText) && (
                            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">下書きあり</span>
                          )}
                        </div>
                        <form action={saveKnowledgeDraftAction}>
                          <input type="hidden" name="knowledgeId" value={k.knowledgeId} />
                          <label className="mb-3 block text-sm">
                            <span className="mb-1 block text-zinc-600">原因の説明(Why)の下書き</span>
                            <textarea
                              name="draftContentText"
                              defaultValue={k.draftContentText ?? ""}
                              rows={4}
                              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                            />
                          </label>
                          <label className="mb-3 block text-sm">
                            <span className="mb-1 block text-zinc-600">改善方法(How)の下書き</span>
                            <textarea
                              name="draftSelfCareText"
                              defaultValue={k.draftSelfCareText ?? ""}
                              rows={3}
                              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                            />
                          </label>
                          <button type="submit" className="rounded-full border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">
                            下書き保存
                          </button>
                        </form>
                        {(k.draftContentText || k.draftSelfCareText) && (
                          <form action={publishKnowledgeDraftAction} className="mt-2">
                            <input type="hidden" name="knowledgeId" value={k.knowledgeId} />
                            <button type="submit" className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                              公開する
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
