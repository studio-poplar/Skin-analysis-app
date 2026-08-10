import Link from "next/link";
import { notFound } from "next/navigation";
import { backgroundStyleFor } from "@/lib/background";
import { prisma } from "@/lib/prisma";
import { checkResultSessionStatus, getDiagnosisResult } from "@/lib/diagnosis";
import { resolveCategoryStyle } from "@/lib/product-categories";
import { isPreviewMode } from "@/lib/preview";
import { getContentMap } from "@/lib/site-content";
import { LineCta } from "../LineCta";
import { ShareButtons } from "../ShareButtons";

const CONTENT_KEYS = [
  "result.eyebrow",
  "result.heading",
  "result.summary_label",
  "result.why_label",
  "result.how_label",
  "result.support_label",
  "result.support_empty",
  "result.care_steps_heading",
  "result.related_articles_heading",
  "result.cta_intro",
  "result.back_to_top",
  "result.background_image_url",
];

export default async function DiagnosisResultPage(props: PageProps<"/diagnosis/result/[sessionId]">) {
  const { sessionId } = await props.params;
  const preview = await isPreviewMode();

  // プレビューモード(管理者)は期限切れでも中身を確認できるようにする
  const status = preview ? "ok" : await checkResultSessionStatus(sessionId);
  if (status === "not_found") {
    notFound();
  }
  if (status === "expired") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-full max-w-sm">
          <h1 className="mb-3 text-lg font-bold text-zinc-900">この結果ページの有効期限が切れました</h1>
          <p className="mb-8 text-sm leading-6 text-zinc-600">
            診断結果ページは、作成から一定期間が過ぎるとご覧いただけなくなります。お手数ですが、もう一度診断をお試しください。
          </p>
          <Link
            href="/diagnosis"
            className="inline-flex w-full items-center justify-center rounded-[var(--brand-button-radius)] bg-[var(--brand-primary)] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-primary-hover)]"
          >
            もう一度診断する
          </Link>
        </div>
      </main>
    );
  }

  const [result, c, lineSettings, categoryColorRows] = await Promise.all([
    getDiagnosisResult(sessionId, preview),
    getContentMap(CONTENT_KEYS),
    prisma.lineSettings.findUnique({ where: { id: 1 } }),
    prisma.categoryColor.findMany(),
  ]);
  if (!result) {
    notFound();
  }
  const categoryColorMap = new Map(categoryColorRows.map((r) => [r.category, r]));

  const lineUrl = result.lineOverride?.url || lineSettings?.lineUrl || process.env.NEXT_PUBLIC_LINE_URL || "https://line.me/";
  const lineButtonText = lineSettings?.buttonText || "LINEで相談する";
  const lineCtaIntro = result.lineOverride?.message || c["result.cta_intro"] || "あなたの状態をふまえて、さらに詳しくご相談いただけます。";
  const allBlocks = result.genreGroups.flatMap((g) => g.categoryBlocks);

  return (
    <main className="flex flex-1 flex-col px-6 py-10" style={backgroundStyleFor(c["result.background_image_url"])}>
      <div className="mx-auto w-full max-w-md">
        {preview && (
          <div className="mb-4 rounded-lg bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-800">
            プレビューモード: 下書き内容を表示しています(一般公開画面には反映されていません)
          </div>
        )}
        <p className="mb-2 text-sm font-medium text-rose-600">{c["result.eyebrow"] ?? "改善策の提案"}</p>
        <h1 className="mb-6 text-xl font-bold text-zinc-900">{c["result.heading"] ?? "あなたに合わせたご提案"}</h1>

        {/* 診断結果サマリー */}
        <section className="mb-8">
          <p className="mb-2 text-xs font-semibold text-zinc-500">{c["result.summary_label"] ?? "今回の診断結果"}</p>
          <div className="flex flex-wrap gap-2">
            {allBlocks.map((b) => (
              <span
                key={b.categoryId}
                className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700"
              >
                {b.name}
              </span>
            ))}
          </div>
        </section>

        {/* URLの保存・共有(会員登録なしで後から見返せるようにするための導線) */}
        <section className="mb-8 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-zinc-100">
          <p className="mb-3 text-xs text-zinc-500">
            このページのURLを保存しておくと、あとで診断結果を見返せます。
          </p>
          <ShareButtons />
        </section>

        {/* ジャンル別・カテゴリごとの結果ブロック(診断結果→原因→改善方法→製品の順) */}
        <section className="mb-10 space-y-10">
          {result.genreGroups.map((group) => (
            <div key={group.genreId}>
              <h2 className="mb-3 text-sm font-bold text-zinc-500">{group.genreName}</h2>
              <div className="space-y-4">
                {group.categoryBlocks.map((block) => (
                  <div key={block.categoryId} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
                    <h3 className="mb-4 text-base font-bold text-zinc-900">{block.name}</h3>

                    {/* Why: 原因の説明 */}
                    {block.whyText && (
                      <div className="mb-4">
                        <p className="mb-1.5 text-xs font-semibold text-zinc-400">{c["result.why_label"] ?? "なぜ起こる?"}</p>
                        <p className="text-sm leading-6 text-zinc-600">{block.whyText}</p>
                      </div>
                    )}

                    {/* How: まずできること(セルフケア) */}
                    {block.howText && (
                      <div className="mb-4 rounded-xl bg-emerald-50 p-4">
                        <p className="mb-1.5 text-xs font-semibold text-emerald-700">{c["result.how_label"] ?? "まずできること"}</p>
                        <p className="text-sm leading-6 text-emerald-900">{block.howText}</p>
                      </div>
                    )}

                    {/* Support: それを補完するアイテム */}
                    {block.products.length > 0 ? (
                      <div>
                        <p className="mb-3 text-xs font-semibold text-zinc-400">{c["result.support_label"] ?? "それを補完するアイテム"}</p>
                        <div className="space-y-3">
                          {block.products.map((p) => {
                            const style = resolveCategoryStyle(p.category, categoryColorMap);
                            return (
                            <div key={p.productId} className="rounded-xl border-2 p-3" style={{ borderColor: style.border }}>
                              <a
                                href={p.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-3 transition-colors hover:opacity-80"
                              >
                                <div>
                                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                    <span
                                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                                      style={{ backgroundColor: style.tagBg, color: style.tagText }}
                                    >
                                      {p.category}
                                    </span>
                                    <p className="text-sm font-semibold text-zinc-800">{p.nameJp}</p>
                                    {p.hasAntiWrinkleTest && (
                                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                        抗シワ効能評価試験済み
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-500">¥{p.priceJpy.toLocaleString()}(税込参考価格)</p>
                                </div>
                                <span className="shrink-0 text-xs font-medium text-rose-600">詳しくはこちら</span>
                              </a>
                              {p.summaryText && (
                                <p className="mt-2 border-t border-zinc-50 pt-2 text-xs leading-5 text-zinc-500">
                                  {p.summaryText}
                                  {p.clinicalSourceUrl && (
                                    <a
                                      href={p.clinicalSourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="ml-1 whitespace-nowrap font-medium text-rose-600 underline"
                                    >
                                      科学的根拠
                                    </a>
                                  )}
                                </p>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-3 text-xs font-semibold text-zinc-400">{c["result.support_label"] ?? "それを補完するアイテム"}</p>
                        <p className="rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
                          {c["result.support_empty"] ?? "この症状に対応するご提案は現在準備中です。LINEで個別にご相談ください。"}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* おすすめのお手入れステップ */}
        {result.careSteps.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-base font-bold text-zinc-900">{c["result.care_steps_heading"] ?? "おすすめのお手入れステップ"}</h2>
            <ol className="space-y-3">
              {result.careSteps.map((p, i) => {
                const style = resolveCategoryStyle(p.category, categoryColorMap);
                return (
                  <li
                    key={p.productId}
                    className="flex items-center gap-3 rounded-xl border-2 bg-white p-3"
                    style={{ borderColor: style.border }}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-zinc-700">{p.nameJp}</span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: style.tagBg, color: style.tagText }}
                    >
                      {p.category}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        {/* 関連記事(v11追加、お手入れステップとLINEリンクの間) */}
        {result.relatedArticles.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-base font-bold text-zinc-900">{c["result.related_articles_heading"] ?? "関連記事"}</h2>
            <div className="space-y-2">
              {result.relatedArticles.map((a) => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 transition-colors hover:ring-rose-200"
                >
                  <span className="text-sm font-medium text-zinc-800">{a.title}</span>
                  <span className="shrink-0 text-xs font-medium text-rose-600">読む</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 個別相談CTA */}
        <section className="rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-100">
          {lineSettings?.bannerImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lineSettings.bannerImageUrl} alt="" className="mb-4 w-full rounded-xl object-cover" />
          )}
          <p className="mb-4 text-sm text-zinc-600">{lineCtaIntro}</p>
          <LineCta sessionId={result.sessionId} lineUrl={lineUrl} buttonText={lineButtonText} />
        </section>

        <div className="mt-8 space-y-2 text-center">
          <Link href="/" className="block text-xs text-zinc-400 underline">
            {c["result.back_to_top"] ?? "トップに戻る"}
          </Link>
          <Link href="/faq" className="block text-xs text-zinc-400 underline">
            よくある質問
          </Link>
          <Link href="/privacy" className="block text-xs text-zinc-400 underline">
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </main>
  );
}
