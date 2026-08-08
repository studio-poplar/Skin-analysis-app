import type { CSSProperties } from "react";

// SiteContentの `*.background_image_url` の値からページ背景用のインラインstyleを組み立てる
export function backgroundStyleFor(url: string | undefined): CSSProperties | undefined {
  if (!url) return undefined;
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}
