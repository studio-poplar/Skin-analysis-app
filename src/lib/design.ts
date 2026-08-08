// ブランドカラーのホバー用シェードを簡易的に生成する(hexを一定割合だけ暗くする)
export function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return hex;
  const r = Math.max(0, (num >> 16) - Math.round(255 * amount));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * amount));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function buttonRadiusFor(style: string): string {
  if (style === "square") return "0px";
  if (style === "rounded-lg") return "0.5rem";
  return "9999px";
}

export function fontFamilyStackFor(fontFamily: string): string | undefined {
  if (fontFamily === "serif") return "ui-serif, Georgia, 'Hiragino Mincho ProN', 'Yu Mincho', serif";
  if (fontFamily === "mono") return "ui-monospace, SFMono-Regular, 'Courier New', monospace";
  return undefined; // "sans"はTailwindのfont-sansクラス(既定)をそのまま使う
}
