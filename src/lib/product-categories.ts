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

export type CategoryStyle = { tagBg: string; tagText: string; border: string };

// v11(節7-21)で導入し、v11差分指示書(節7-22)で管理画面(/admin/design)から設定可能にした。
// カテゴリごとのタグ色・枠線色は`CategoryColor`テーブルに保存され、管理画面で自由な16進数カラーを
// 設定できるため、Tailwindの固定クラス文字列ではなくインラインstyleで適用する。
// 未設定のカテゴリはこのグレー系のデフォルトにフォールバックする(指示書の要件どおり)。
export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  tagBg: "#e4e4e7",
  tagText: "#3f3f46",
  border: "#a1a1aa",
};

// 相対輝度からタグの文字色(黒 or 白)を自動判定する。管理画面ではタグ背景色・枠線色の2つだけを
// 設定すればよいようにし、コントラストの取れる文字色は自動計算する(dataviz方針: 塗りの明度で
// 白/インクを選ぶ)。
export function contrastingTextColor(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return "#0b0b0b";
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0b0b0b" : "#ffffff";
}

export function resolveCategoryStyle(
  category: string,
  colorMap: Map<string, { tagColorHex: string; borderColorHex: string }>
): CategoryStyle {
  const override = colorMap.get(category);
  if (!override) return DEFAULT_CATEGORY_STYLE;
  return {
    tagBg: override.tagColorHex,
    tagText: contrastingTextColor(override.tagColorHex),
    border: override.borderColorHex,
  };
}
