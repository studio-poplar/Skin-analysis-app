"use client";

import { Fragment, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type CategoryCount = { categoryId: string; name: string; count: number };
export type MonthlyPoint = { month: string; count: number };

// v10: DiagnosisResult単位のフラットな行。③のヒートマップ・詳細パネルはこれをクライアント側で
// フィルタして組み立てる(節A技術メモ「都度サーバーへ問い合わせない」方針に沿う)。
export type SessionCategoryRow = {
  sessionId: string;
  categoryId: string;
  ageIndex: number; // -1: 未回答/不明
  genderLabel: string | null;
  skincareLabel: string | null;
  supplementLabel: string | null;
  durationLabel: string | null; // v10追加: 症状の継続期間
  skincareFreeText: string | null;
  supplementFreeText: string | null;
};

export type DashboardData = {
  totals: {
    allTime: { sessions: number; lineClicks: number };
    thisMonth: { sessions: number; lineClicks: number };
  };
  categoryCounts: CategoryCount[];
  monthlyTrend: MonthlyPoint[];
  categoryOptions: { categoryId: string; name: string; genreName: string }[];
  ageLabels: string[];
  sessionCategoryRows: SessionCategoryRow[];
  freeTexts: { skincare: string[]; supplement: string[] };
};

// 悩み×年代ヒートマップの単色ランプ(rose、薄→濃)。0件は最も薄いステップ、
// 件数が多いほど濃くなる。数値は常に併記するため、色は補助的な手がかりとして使う(dataviz方針)。
const HEAT_STEPS = [
  { bg: "#fff1f2", text: "#57534e" }, // 0件
  { bg: "#fecdd3", text: "#0b0b0b" },
  { bg: "#fda4af", text: "#0b0b0b" },
  { bg: "#fb7185", text: "#ffffff" },
  { bg: "#e11d48", text: "#ffffff" },
  { bg: "#9f1239", text: "#ffffff" },
];

function heatStepFor(count: number, max: number) {
  if (count <= 0 || max <= 0) return 0;
  const frac = count / max;
  return Math.min(HEAT_STEPS.length - 1, 1 + Math.floor(frac * (HEAT_STEPS.length - 2)));
}

const GENDER_TABS = ["全体", "女性", "男性"] as const;
type GenderTab = (typeof GENDER_TABS)[number];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
      <p className="mb-1 text-xs text-zinc-500">{label}</p>
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  );
}

function countBy(values: (string | null)[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
}

function DistTable({ dist }: { dist: { label: string; count: number }[] }) {
  if (dist.length === 0) return <p className="text-xs text-zinc-400">データがありません。</p>;
  const sorted = [...dist].sort((a, b) => b.count - a.count);
  return (
    <table className="w-full text-sm">
      <tbody>
        {sorted.map((d) => (
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

export function DashboardCharts({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<"allTime" | "thisMonth">("allTime");
  const [genderTab, setGenderTab] = useState<GenderTab>("全体");
  const [selectedCell, setSelectedCell] = useState<{ categoryId: string; ageIndex: number } | null>(null);

  const totals = data.totals[period];
  const conversionRate = totals.sessions > 0 ? Math.round((totals.lineClicks / totals.sessions) * 1000) / 10 : 0;

  const sortedCategoryCounts = useMemo(
    () => [...data.categoryCounts].sort((a, b) => b.count - a.count),
    [data.categoryCounts]
  );

  // 現在のタブ(性別)条件を満たす行だけに絞り込む
  const rowsForTab = useMemo(
    () => data.sessionCategoryRows.filter((r) => genderTab === "全体" || r.genderLabel === genderTab),
    [data.sessionCategoryRows, genderTab]
  );

  // 悩み×年代のセルごとの件数(ヒートマップ本体)
  const heatmapCounts = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const c of data.categoryOptions) map.set(c.categoryId, data.ageLabels.map(() => 0));
    for (const r of rowsForTab) {
      if (r.ageIndex < 0) continue;
      const row = map.get(r.categoryId);
      if (row) row[r.ageIndex] += 1;
    }
    return map;
  }, [data.categoryOptions, data.ageLabels, rowsForTab]);

  const maxCount = useMemo(() => {
    let max = 0;
    for (const row of heatmapCounts.values()) {
      for (const v of row) max = Math.max(max, v);
    }
    return max;
  }, [heatmapCounts]);

  // 選択中セルに絞った詳細データ
  const cellRows = useMemo(() => {
    if (!selectedCell) return [];
    return rowsForTab.filter((r) => r.categoryId === selectedCell.categoryId && r.ageIndex === selectedCell.ageIndex);
  }, [rowsForTab, selectedCell]);

  const cellFreeTexts = useMemo(() => {
    const seen = new Set<string>();
    const skincare: string[] = [];
    const supplement: string[] = [];
    for (const r of cellRows) {
      if (seen.has(r.sessionId)) continue;
      seen.add(r.sessionId);
      if (r.skincareFreeText) skincare.push(r.skincareFreeText);
      if (r.supplementFreeText) supplement.push(r.supplementFreeText);
    }
    return { skincare, supplement };
  }, [cellRows]);

  const selectedCategory = selectedCell ? data.categoryOptions.find((c) => c.categoryId === selectedCell.categoryId) : null;
  const selectedAgeLabel = selectedCell ? data.ageLabels[selectedCell.ageIndex] : null;

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

      {/* ③ 悩み×年代 ヒートマップ(v10: プルダウンからヒートマップ化) */}
      <section>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-zinc-500">悩み×年代のヒートマップ</h2>
          <div className="flex rounded-full bg-zinc-100 p-0.5 text-xs">
            {GENDER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setGenderTab(tab)}
                className={`rounded-full px-3 py-1 font-semibold ${genderTab === tab ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-3 text-xs text-zinc-400">
          年代の選択肢は過去に一度リネームされているため(節7-1参照)、リネーム前後をまたぐ集計は大まかな年代帯としての参考値としてご覧ください。セルをクリックすると詳細が下に表示されます。
        </p>

        <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `minmax(150px, auto) repeat(${data.ageLabels.length}, minmax(52px, 1fr))` }}
          >
            <div />
            {data.ageLabels.map((age) => (
              <div key={age} className="px-1 pb-2 text-center text-[10px] font-semibold text-zinc-500">
                {age}
              </div>
            ))}
            {data.categoryOptions.map((c) => (
              <Fragment key={c.categoryId}>
                <div className="flex items-center pr-2 text-xs font-medium text-zinc-700" title={c.genreName}>
                  {c.name}
                </div>
                {data.ageLabels.map((_, ageIndex) => {
                  const count = heatmapCounts.get(c.categoryId)?.[ageIndex] ?? 0;
                  const step = HEAT_STEPS[heatStepFor(count, maxCount)];
                  const isSelected = selectedCell?.categoryId === c.categoryId && selectedCell?.ageIndex === ageIndex;
                  return (
                    <button
                      key={ageIndex}
                      type="button"
                      title={`${c.name} × ${data.ageLabels[ageIndex]}: ${count}件`}
                      onClick={() => setSelectedCell(isSelected ? null : { categoryId: c.categoryId, ageIndex })}
                      style={{ backgroundColor: step.bg, color: step.text }}
                      className={`flex h-8 items-center justify-center rounded text-[11px] font-semibold transition-transform hover:scale-105 ${
                        isSelected ? "ring-2 ring-zinc-900" : ""
                      }`}
                    >
                      {count > 0 ? count : ""}
                    </button>
                  );
                })}
              </Fragment>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-400">
            <span>少ない</span>
            {HEAT_STEPS.map((s, i) => (
              <span key={i} className="h-3 w-5 rounded" style={{ backgroundColor: s.bg }} />
            ))}
            <span>多い</span>
          </div>
        </div>
      </section>

      {/* セル詳細パネル(v10、旧⑤ケア習慣クロス集計はここに統合) */}
      {selectedCell && selectedCategory && (
        <section className="rounded-xl border-2 border-zinc-900 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900">
              {selectedCategory.name} × {selectedAgeLabel} {genderTab !== "全体" && `× ${genderTab}`}
            </h2>
            <button type="button" onClick={() => setSelectedCell(null)} className="text-xs text-zinc-400 hover:text-zinc-600">
              閉じる
            </button>
          </div>

          <p className="mb-4 text-sm text-zinc-600">
            該当者数: <span className="text-lg font-bold text-zinc-900">{cellRows.length}</span>件
          </p>

          {cellRows.length === 0 ? (
            <p className="text-xs text-zinc-400">このセルに該当するデータはまだありません。</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-zinc-100 p-4">
                  <p className="mb-2 text-xs font-semibold text-zinc-500">スキンケア習慣</p>
                  <DistTable dist={countBy(cellRows.map((r) => r.skincareLabel))} />
                </div>
                <div className="rounded-xl border border-zinc-100 p-4">
                  <p className="mb-2 text-xs font-semibold text-zinc-500">サプリメント習慣</p>
                  <DistTable dist={countBy(cellRows.map((r) => r.supplementLabel))} />
                </div>
                <div className="rounded-xl border border-zinc-100 p-4">
                  <p className="mb-2 text-xs font-semibold text-zinc-500">症状の継続期間</p>
                  <DistTable dist={countBy(cellRows.map((r) => r.durationLabel))} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FreeTextList title="スキンケア製品のメーカー(このセル内)" items={cellFreeTexts.skincare} />
                <FreeTextList title="サプリメントのメーカー(このセル内)" items={cellFreeTexts.supplement} />
              </div>
            </div>
          )}
        </section>
      )}

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

      {/* ⑥ 自由記述(メーカー名)一覧(全体) */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-zinc-500">自由記述(メーカー名)一覧(全体)</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FreeTextList title="スキンケア製品のメーカー" items={data.freeTexts.skincare} />
          <FreeTextList title="サプリメントのメーカー" items={data.freeTexts.supplement} />
        </div>
      </section>
    </div>
  );
}
