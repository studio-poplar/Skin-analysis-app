"use client";

import { markLineClickAction } from "../actions";

export function LineCta({
  sessionId,
  lineUrl,
  buttonText,
}: {
  sessionId: string;
  lineUrl: string;
  buttonText: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        void markLineClickAction(sessionId);
        window.open(lineUrl, "_blank", "noopener,noreferrer");
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--brand-button-radius)] bg-[#06C755] px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:brightness-95"
    >
      {buttonText}
    </button>
  );
}
