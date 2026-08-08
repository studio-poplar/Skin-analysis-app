import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [productCount, unverifiedKnowledgeCount, sessionCount, lineClickCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.generalKnowledge.count({ where: { isSourceVerified: false } }),
    prisma.diagnosisSession.count(),
    prisma.diagnosisSession.count({ where: { lineRedirectClicked: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-zinc-900">ダッシュボード</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="取扱中の製品" value={productCount} />
        <StatCard label="出典未確認の一般知識" value={unverifiedKnowledgeCount} warn={unverifiedKnowledgeCount > 0} />
        <StatCard label="診断完了数" value={sessionCount} />
        <StatCard label="LINE相談クリック数" value={lineClickCount} />
      </div>

      {unverifiedKnowledgeCount > 0 && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          「一般知識」セクションに出典未確認の項目が{unverifiedKnowledgeCount}件あります。公開前に薬機法の観点で表現・出典を確認してください。
          <Link href="/admin/knowledge" className="ml-2 font-semibold underline">
            確認する
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/products"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 hover:ring-rose-200"
        >
          <p className="mb-1 font-semibold text-zinc-900">製品管理</p>
          <p className="text-sm text-zinc-500">価格・取扱状況・臨床データ要約を編集します。</p>
        </Link>
        <Link
          href="/admin/knowledge"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 hover:ring-rose-200"
        >
          <p className="mb-1 font-semibold text-zinc-900">一般知識管理</p>
          <p className="text-sm text-zinc-500">カテゴリ別の一般知識テキストと出典確認フラグを編集します。</p>
        </Link>
        <Link
          href="/admin/mapping"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-zinc-100 hover:ring-rose-200"
        >
          <p className="mb-1 font-semibold text-zinc-900">提案マッピング</p>
          <p className="text-sm text-zinc-500">カテゴリ・回答ごとにおすすめする製品を調整します。</p>
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <p className="mb-1 text-xs text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold ${warn ? "text-amber-600" : "text-zinc-900"}`}>{value}</p>
    </div>
  );
}
