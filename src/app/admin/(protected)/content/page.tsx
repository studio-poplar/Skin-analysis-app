import { prisma } from "@/lib/prisma";
import { publishContentDraftAction, saveContentDraftAction, updateContentAction } from "../../content-actions";

// 実際に閲覧者へ表示している画面(Step)ごとにグルーピングする。
// 1つのキーが複数Stepの画面で使い回されている場合(選択のヒント文言・次へボタン等)は、
// 該当する全てのStepに重複表示する(データ上は同じ1件のSiteContentを指す)。
const STEP_GROUPS: { title: string; keys: string[] }[] = [
  { title: "Step1: ホーム", keys: ["home.badge", "home.heading_line1", "home.heading_line2", "home.intro", "home.step1", "home.step2", "home.step3", "home.cta_button", "home.footer_note"] },
  { title: "Step2: 基本情報(年代・性別)", keys: ["diagnosis.step1_label", "diagnosis.step1_heading", "diagnosis.age_label", "diagnosis.gender_label", "diagnosis.next_button"] },
  { title: "Step3・4: 気になること・症状の深掘り", keys: ["diagnosis.step2_label", "diagnosis.step2_heading", "diagnosis.multi_select_hint", "diagnosis.symptom_heading_template", "diagnosis.next_button", "diagnosis.submit_button", "diagnosis.loading_text"] },
  { title: "Step5: 改善策の提案(結果画面)", keys: ["result.eyebrow", "result.heading", "result.summary_label", "result.why_label", "result.how_label", "result.support_label", "result.support_empty", "result.care_steps_heading", "result.cta_intro", "result.back_to_top"] },
];

export default async function AdminContentPage(props: PageProps<"/admin/content">) {
  const searchParams = await props.searchParams;
  const saved = searchParams?.saved === "1";
  const draftSaved = searchParams?.draftSaved === "1";
  const published = searchParams?.published === "1";

  const contents = await prisma.siteContent.findMany({ orderBy: [{ page: "asc" }, { key: "asc" }] });
  const byKey = new Map(contents.map((c) => [c.key, c]));
  const groupedKeys = new Set(STEP_GROUPS.flatMap((g) => g.keys));
  const ungrouped = contents.filter((c) => !groupedKeys.has(c.key));

  function ContentCard({ c }: { c: (typeof contents)[number] }) {
    return (
      <div key={c.key} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-800">{c.label}</p>
          <span className="text-xs text-zinc-400">{c.key}</span>
        </div>

        <form action={updateContentAction} className="mb-3 flex items-center gap-2">
          <input type="hidden" name="key" value={c.key} />
          <input
            type="text"
            name="value"
            defaultValue={c.value}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white hover:bg-zinc-700">
            保存(即公開)
          </button>
        </form>

        <form action={saveContentDraftAction} className="flex items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 p-2">
          <input type="hidden" name="key" value={c.key} />
          <input
            type="text"
            name="draftValue"
            defaultValue={c.draftValue ?? ""}
            placeholder="下書き(プレビューモードでのみ表示)"
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-full border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100">
            下書き保存
          </button>
        </form>
        {c.draftValue && (
          <form action={publishContentDraftAction} className="mt-2">
            <input type="hidden" name="key" value={c.key} />
            <button type="submit" className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600">
              公開する
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-zinc-900">ページ文言管理</h1>
      <p className="mb-6 text-sm text-zinc-500">
        実際にユーザーが見る画面の流れ(Step1〜5)に合わせて文言をグルーピングしています。「保存(即公開)」はすぐに反映され、「下書き保存」はヘッダーの「プレビューモード」をONにしたときのみ確認でき、「公開」を押すまで一般公開画面には反映されません。
      </p>
      {saved && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">保存しました。</p>}
      {draftSaved && <p className="mb-6 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700">下書きを保存しました。</p>}
      {published && <p className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">公開しました。</p>}

      <div className="space-y-10">
        {STEP_GROUPS.map((group) => {
          const items = group.keys.map((k) => byKey.get(k)).filter((c): c is NonNullable<typeof c> => Boolean(c));
          if (items.length === 0) return null;
          return (
            <section key={group.title} className="rounded-2xl border-2 border-zinc-200 p-5">
              <h2 className="mb-4 text-base font-bold text-zinc-900">{group.title}</h2>
              <div className="space-y-4">
                {items.map((c) => (
                  <ContentCard key={c.key} c={c} />
                ))}
              </div>
            </section>
          );
        })}

        {ungrouped.length > 0 && (
          <section className="rounded-2xl border-2 border-dashed border-zinc-300 p-5">
            <h2 className="mb-4 text-base font-bold text-zinc-500">その他(診断フローのStepに属さないページ)</h2>
            <div className="space-y-4">
              {ungrouped.map((c) => (
                <ContentCard key={c.key} c={c} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
