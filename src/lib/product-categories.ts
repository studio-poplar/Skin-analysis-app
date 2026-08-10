export const PRODUCT_CATEGORIES = [
  "化粧水",
  "美容液(部分用)",
  "美容液(顔・首用)",
  "美容液(顔・首・デコルテ用)",
  "クリーム",
  "乳液(SPF付き)",
  "洗顔デバイス",
  "ヘアケア",
  "美容機器",
  "サプリメント",
  "ボディケア",
  "メイクアップ",
  "オーラルケア",
  "洗顔料",
  "セット商品",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// v11追加: 診断結果ページ「それを補完するアイテム」でカテゴリを一目で区別できるようにするための
// タグ・枠線の配色。Tailwindはクラス名を静的に解析するため、`bg-${color}-100`のような動的生成では
// なく、カテゴリごとに完全なクラス文字列をここで固定して持つ。
export const PRODUCT_CATEGORY_STYLES: Record<string, { badge: string; border: string }> = {
  "化粧水": { badge: "bg-sky-100 text-sky-700", border: "border-sky-300" },
  "美容液(部分用)": { badge: "bg-violet-100 text-violet-700", border: "border-violet-300" },
  "美容液(顔・首用)": { badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-300" },
  "美容液(顔・首・デコルテ用)": { badge: "bg-purple-100 text-purple-700", border: "border-purple-300" },
  "クリーム": { badge: "bg-amber-100 text-amber-700", border: "border-amber-300" },
  "乳液(SPF付き)": { badge: "bg-orange-100 text-orange-700", border: "border-orange-300" },
  "洗顔デバイス": { badge: "bg-cyan-100 text-cyan-700", border: "border-cyan-300" },
  "ヘアケア": { badge: "bg-teal-100 text-teal-700", border: "border-teal-300" },
  "美容機器": { badge: "bg-slate-200 text-slate-700", border: "border-slate-400" },
  "サプリメント": { badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-300" },
  "ボディケア": { badge: "bg-pink-100 text-pink-700", border: "border-pink-300" },
  "メイクアップ": { badge: "bg-fuchsia-100 text-fuchsia-700", border: "border-fuchsia-300" },
  "オーラルケア": { badge: "bg-lime-100 text-lime-700", border: "border-lime-300" },
  "洗顔料": { badge: "bg-blue-100 text-blue-700", border: "border-blue-300" },
  "セット商品": { badge: "bg-zinc-200 text-zinc-700", border: "border-zinc-400" },
};

const FALLBACK_CATEGORY_STYLE = { badge: "bg-zinc-100 text-zinc-600", border: "border-zinc-200" };

export function categoryStyleFor(category: string): { badge: string; border: string } {
  return PRODUCT_CATEGORY_STYLES[category] ?? FALLBACK_CATEGORY_STYLE;
}
