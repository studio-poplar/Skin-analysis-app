"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type CategoryCount = { categoryId: string; name: string; count: number };
export type MonthlyPoint = { month: string; count: number };
export type AgeGenderTable = {
  ageLabels: string[];
  genderLabels: string[];
  // counts[ageIndex][genderIndex]
  counts: number[][];
};
export type CareDistribution = { label: string; count: number }[];

export type DashboardData = {
  totals: {
    allTime: { sessions: number; lineClicks: number };
    thisMonth: { sessions: number; lineClicks: number };
  };
  categoryCounts: CategoryCount[];
  monthlyTrend: MonthlyPoint[];
  categoryOptions: { categoryId: string; name: string }[];
  ageGenderByCategory: Record<string, AgeGenderTable>;
  careByCategory: Record<string, { skincare: CareDistribution; supplement: CareDistribution }>;
  freeTexts: { skincare: string[]; supplement: string[] };
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <p className="mb-1 text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

export function DashboardCharts({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<"allTime" | "thisMonth">("allTime");
  const [categoryId, setCategoryId] = useState(data.categoryOptions[0]?.categoryId ?? "");

  const totals = data.totals[period];
  const conversionRate = totals.sessions > 0 ? Math.round((totals.lineClicks / totals.sessions) * 1000) / 10 : 0;

  const ageGenderTable = data.ageGenderByCategory[categoryId];
  const careDist = data.careByCategory[categoryId];

  const sortedCategoryCounts = useMemo(
    () => [...data.categoryCounts].sort((a, b) => b.count - a.count),
    [data.categoryCounts]
  );

  return (
    <div className="space-y-10">
      {/* ① サマリー数値 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-500">サマリー</h2>
          <div className="flex rounded-full bg-zinc-100 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setPeriod("thisMonth")}
              className={`rounded-full px-3 py-1 font-semibold ${period === "thisMonth" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}
            >
              今月
            </button>
            <button
              type="button"
              onClick={() => setPeriod("allTime")}
              className={`rounded-full px-3 py-1 font-semibold ${period === "allTime" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}
            >
              累計
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="診断完了数" value={totals.sessions} />
          <StatCard label="LINE相談クリック数" value={totals.lineClicks} />
          <StatCard label="LINE遷移率" value={`${conversionRate}%`} sub="クリック数 ÷ 診断完了数" />
        </div>
      </section>

      {/* ② 悩みカテゴリ別の件数 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-zinc-500">悩みカテゴリ別の件数(全19種)</h2>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100" style={{ height: Math.max(320, sortedCategoryCounts.length * 26) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedCategoryCounts} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#e11d48" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* カテゴリ選択(③・⑤共通) */}
      <section>
        <label className="mb-2 block text-sm font-semibold text-zinc-700">
          悩みカテゴリを選択(③年代×性別・⑤ケア習慣クロス集計に反映されます)
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full max-w-sm rounded-lg border border-zinc-200 px-3 py-1.5 text-sm"
          >
            {data.categoryOptions.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* ③ 年代×性別×悩みの詳細 */}
      <section>
        <h2 className="mb-1 text-sm font-bold text-zinc-500">年代×性別の詳細</h2>
        <p className="mb-3 text-xs text-zinc-400">
          年代の選択肢は過去に一度リネームされているため(節7-1参照)、リネーム前後をまたぐ集計は大まかな年代帯としての参考値としてご覧ください。
        </p>
        {ageGenderTable ? (
          <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                  <th className="py-2 pr-4">年代 \ 性別</th>
                  {ageGenderTable.genderLabels.map((g) => (
                    <th key={g} className="py-2 pr-4 text-right">
                      {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ageGenderTable.ageLabels.map((age, ai) => (
                  <tr key={age} className="border-b border-zinc-50">
                    <td className="py-1.5 pr-4 text-zinc-700">{age}</td>
                    {ageGenderTable.genderLabels.map((g, gi) => (
                      <td key={g} className="py-1.5 pr-4 text-right text-zinc-600">
                        {ageGenderTable.counts[ai]?.[gi] ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">このカテゴリのデータはまだありません。</p>
        )}
      </section>

      {/* ④ 月次の診断完了数推移 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-zinc-500">月次の診断完了数推移</h2>
        <div className="h-64 rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyTrend} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#e11d48" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ⑤ 悩み×ケア習慣のクロス集計 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-zinc-500">悩み×ケア習慣のクロス集計</h2>
        {careDist ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
              <p className="mb-2 text-xs font-semibold text-zinc-500">スキンケア習慣</p>
              <CareDistTable dist={careDist.skincare} />
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
              <p className="mb-2 text-xs font-semibold text-zinc-500">サプリメント習慣</p>
              <CareDistTable dist={careDist.supplement} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">このカテゴリのデータはまだありません。</p>
        )}
      </section>

      {/* ⑥ 自由記述(メーカー名)一覧 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-zinc-500">自由記述(メーカー名)一覧</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FreeTextList title="スキンケア製品のメーカー" items={data.freeTexts.skincare} />
          <FreeTextList title="サプリメントのメーカー" items={data.freeTexts.supplement} />
        </div>
      </section>
    </div>
  );
}

function CareDistTable({ dist }: { dist: CareDistribution }) {
  const total = dist.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return <p className="text-xs text-zinc-400">データがありません。</p>;
  return (
    <table className="w-full text-sm">
      <tbody>
        {dist.map((d) => (
          <tr key={d.label} className="border-b border-zinc-50 last:border-0">
            <td className="py-1.5 pr-3 text-zinc-600">{d.label}</td>
            <td className="py-1.5 text-right font-semibold text-zinc-900">{d.count}件</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FreeTextList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <p className="mb-2 text-xs font-semibold text-zinc-500">
        {title}({items.length}件)
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-400">まだ記入はありません。</p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto text-sm text-zinc-700">
          {items.map((t, i) => (
            <li key={i} className="rounded-lg bg-zinc-50 px-3 py-1.5">
              {t}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
