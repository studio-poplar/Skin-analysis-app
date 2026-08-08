import Link from "next/link";
import { backgroundStyleFor } from "@/lib/background";
import { prisma } from "@/lib/prisma";
import { getContentMap } from "@/lib/site-content";

const CATEGORY_LABELS: Record<string, string> = {
  product: "製品について",
  site: "このサイトについて",
};

export default async function FaqPage() {
  const [items, c] = await Promise.all([
    prisma.fAQItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    getContentMap(["faq.background_image_url"]),
  ]);

  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category)!.push(item);
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-10" style={backgroundStyleFor(c["faq.background_image_url"])}>
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-6 text-xl font-bold text-zinc-900">よくある質問</h1>

        <div className="space-y-8">
          {["product", "site"].map((category) => {
            const categoryItems = grouped.get(category) ?? [];
            if (categoryItems.length === 0) return null;
            return (
              <section key={category}>
                <h2 className="mb-3 text-sm font-bold text-zinc-500">{CATEGORY_LABELS[category] ?? category}</h2>
                <div className="space-y-3">
                  {categoryItems.map((item) => (
                    <details key={item.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
                      <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                        {item.question}
                      </summary>
                      <p className="mt-3 text-sm leading-6 whitespace-pre-wrap text-zinc-600">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {items.length === 0 && <p className="text-sm text-zinc-400">現在、公開中の質問はありません。</p>}

        <div className="mt-10 space-y-2 text-center">
          <Link href="/" className="block text-xs text-zinc-400 underline">
            トップに戻る
          </Link>
          <Link href="/privacy" className="block text-xs text-zinc-400 underline">
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </main>
  );
}
