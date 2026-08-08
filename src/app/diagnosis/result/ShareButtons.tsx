"use client";

import { useState } from "react";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // クリップボードAPIが使えない環境向けのフォールバック
      window.prompt("このURLをコピーしてください", window.location.href);
    }
  }

  function handleLineShare() {
    const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        {copied ? "コピーしました" : "URLをコピー"}
      </button>
      <button
        type="button"
        onClick={handleLineShare}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#06C755] bg-white px-4 py-2 text-xs font-semibold text-[#06C755] transition-colors hover:bg-[#06C755]/5"
      >
        LINEで共有
      </button>
    </div>
  );
}
