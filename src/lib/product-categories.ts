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
