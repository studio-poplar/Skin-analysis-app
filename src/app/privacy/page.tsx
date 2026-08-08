import Link from "next/link";
import { getContentMap } from "@/lib/site-content";

const CONTENT_KEYS = [
  "privacy.heading",
  "privacy.intro",
  "privacy.collected_data",
  "privacy.data_usage",
  "privacy.line_note",
  "privacy.contact",
  "privacy.updated_at",
];

export default async function PrivacyPage() {
  const c = await getContentMap(CONTENT_KEYS);

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-6 text-xl font-bold text-zinc-900">{c["privacy.heading"] ?? "プライバシーポリシー"}</h1>

        <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="text-sm leading-6 text-zinc-600">{c["privacy.intro"]}</p>

          <section>
            <h2 className="mb-1.5 text-sm font-bold text-zinc-900">取得する情報</h2>
            <p className="text-sm leading-6 text-zinc-600">{c["privacy.collected_data"]}</p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-bold text-zinc-900">利用目的</h2>
            <p className="text-sm leading-6 text-zinc-600">{c["privacy.data_usage"]}</p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-bold text-zinc-900">LINEでのご相談について</h2>
            <p className="text-sm leading-6 text-zinc-600">{c["privacy.line_note"]}</p>
          </section>

          <section>
            <h2 className="mb-1.5 text-sm font-bold text-zinc-900">お問い合わせ</h2>
            <p className="text-sm leading-6 text-zinc-600">{c["privacy.contact"]}</p>
          </section>

          <p className="text-xs text-zinc-400">{c["privacy.updated_at"]}</p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-zinc-400 underline">
            トップに戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
