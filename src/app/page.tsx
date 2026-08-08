import Link from "next/link";
import { backgroundStyleFor } from "@/lib/background";
import { getContentMap } from "@/lib/site-content";

export default async function Home() {
  const c = await getContentMap([
    "home.badge",
    "home.heading_line1",
    "home.heading_line2",
    "home.intro",
    "home.step1",
    "home.step2",
    "home.step3",
    "home.cta_button",
    "home.footer_note",
    "home.background_image_url",
  ]);

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center px-6 py-16"
      style={backgroundStyleFor(c["home.background_image_url"])}
    >
      <div className="w-full max-w-md text-center">
        <p className="mb-3 text-sm font-medium tracking-wide text-rose-600">{c["home.badge"] ?? "ageLOC 肌・髪・からだ診断"}</p>
        <h1 className="mb-4 text-2xl font-bold leading-relaxed text-zinc-900 sm:text-3xl">
          {c["home.heading_line1"] ?? "あなたに、"}
          <br />
          {c["home.heading_line2"] ?? "根拠のあるご提案を。"}
        </h1>
        <p className="mb-8 text-sm leading-6 text-zinc-600">
          {c["home.intro"] ??
            "いくつかの質問にお答えいただくと、肌・髪・からだの変化に合わせたケアの考え方とおすすめの製品をご案内します。"}
        </p>

        <div className="mb-8 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-zinc-100">
          <ul className="space-y-3 text-sm text-zinc-700">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600">
                1
              </span>
              {c["home.step1"] ?? "簡単な質問に答える(所要時間 約1分)"}
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600">
                2
              </span>
              {c["home.step2"] ?? "科学的データにもとづくご提案を確認"}
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-semibold text-rose-600">
                3
              </span>
              {c["home.step3"] ?? "気になれば、個別にLINEでご相談"}
            </li>
          </ul>
        </div>

        <Link
          href="/diagnosis"
          className="inline-flex w-full items-center justify-center rounded-[var(--brand-button-radius)] bg-[var(--brand-primary)] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[var(--brand-primary-hover)]"
        >
          {c["home.cta_button"] ?? "診断をはじめる"}
        </Link>

        <p className="mt-4 text-xs text-zinc-400">{c["home.footer_note"] ?? "会員登録は不要です。匿名でご利用いただけます。"}</p>
        <p className="mt-2 space-x-3 text-xs text-zinc-400">
          <Link href="/faq" className="underline">
            よくある質問
          </Link>
          <Link href="/privacy" className="underline">
            プライバシーポリシー
          </Link>
        </p>
      </div>
    </main>
  );
}
