"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clearAllDiagnosisHistoryAction,
  clearDiagnosisHistoryByRangeAction,
  previewHistoryDeleteCountAction,
} from "../history-actions";

// 追加実装指示書v9-A: テストデータ一括削除用。admin専用(呼び出し元のpage.tsxでisAdmin時のみ描画)。
// 削除は即実行にせず、確認ダイアログを必ず挟む。期間指定は事前に件数を確認してからのみ実行できる。
export function ClearHistoryPanel({ totalSessions }: { totalSessions: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  function handleClearAll() {
    if (totalSessions === 0) return;
    const ok = window.confirm(
      `本当に${totalSessions}件の診断履歴をすべて削除しますか?この操作は取り消せません。`
    );
    if (!ok) return;

    setMessage(null);
    startTransition(async () => {
      const { deletedCount } = await clearAllDiagnosisHistoryAction();
      setMessage(`${deletedCount}件の診断履歴を削除しました。`);
      router.refresh();
    });
  }

  function handlePreview() {
    if (!fromDate && !toDate) {
      setMessage("開始日または終了日を指定してください。");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const count = await previewHistoryDeleteCountAction(fromDate || undefined, toDate || undefined);
      setPreviewCount(count);
    });
  }

  function handleClearRange() {
    if (previewCount === null || previewCount === 0) return;
    const ok = window.confirm(
      `指定期間内の${previewCount}件の診断履歴を削除しますか?この操作は取り消せません。`
    );
    if (!ok) return;

    setMessage(null);
    startTransition(async () => {
      const { deletedCount } = await clearDiagnosisHistoryByRangeAction(fromDate || undefined, toDate || undefined);
      setMessage(`${deletedCount}件の診断履歴を削除しました。`);
      setPreviewCount(null);
      setFromDate("");
      setToDate("");
      router.refresh();
    });
  }

  return (
    <section className="mt-12 rounded-xl border border-rose-100 bg-rose-50/40 p-5">
      <h2 className="mb-1 text-sm font-bold text-rose-700">診断履歴のクリア(管理者専用)</h2>
      <p className="mb-4 text-xs text-zinc-500">
        テスト用に投入した診断履歴を一括削除するための機能です。本番運用開始後は、実際のユーザーの診断履歴を誤って消さないよう、テスト目的でこのボタンを使わないでください。
      </p>

      <div className="mb-5">
        <button
          type="button"
          onClick={handleClearAll}
          disabled={isPending || totalSessions === 0}
          className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          全履歴クリア(現在{totalSessions}件)
        </button>
      </div>

      <div className="border-t border-rose-100 pt-4">
        <p className="mb-2 text-xs font-semibold text-zinc-600">期間指定クリア</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-zinc-500">
            開始日
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPreviewCount(null);
              }}
              className="mt-1 block rounded-lg border border-zinc-200 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-zinc-500">
            終了日
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPreviewCount(null);
              }}
              className="mt-1 block rounded-lg border border-zinc-200 px-2 py-1 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPending}
            className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            件数を確認
          </button>
          {previewCount !== null && (
            <button
              type="button"
              onClick={handleClearRange}
              disabled={isPending || previewCount === 0}
              className="rounded-full border border-rose-300 bg-white px-4 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {previewCount}件を削除する
            </button>
          )}
        </div>
      </div>

      {message && <p className="mt-4 text-xs text-zinc-600">{message}</p>}
    </section>
  );
}
