"use client";

import { useMemo, useRef, useState } from "react";

type PickableProduct = { productId: number; nameJp: string; productCode: string };

// 「優先順位リスト」への製品追加フォーム用の検索付きセレクタ(v9追加)。
// 製品数が多い(2026-08時点で約90件)ため、素のドロップダウンでは目的の製品を探しにくいという要望に対応。
// 入力欄に製品名・製品コードの一部を入力すると候補が絞り込まれ、クリックで選択すると
// hidden inputにproductIdがセットされてフォーム送信できる(<select>の代替)。
export function ProductPicker({
  name,
  products,
  placeholder,
}: {
  name: string;
  products: PickableProduct[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PickableProduct | null>(null);
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products
      .filter((p) => p.nameJp.toLowerCase().includes(q) || p.productCode.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, products]);

  function choose(p: PickableProduct) {
    setSelected(p);
    setQuery(p.nameJp);
    setOpen(false);
  }

  function handleChange(value: string) {
    setQuery(value);
    setSelected(null);
    setOpen(true);
  }

  return (
    <div className="relative flex-1">
      <input type="hidden" name={name} value={selected?.productId ?? ""} />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // クリックによる選択(mousedown→onBlur→click)が先に処理されるよう、少し遅らせてから閉じる
          blurTimer.current = setTimeout(() => setOpen(false), 150);
        }}
        placeholder={placeholder ?? "製品名またはコードで検索"}
        autoComplete="off"
        className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm"
      />
      {open && matches.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-lg">
          {matches.map((p) => (
            <li key={p.productId}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (blurTimer.current) clearTimeout(blurTimer.current);
                  choose(p);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              >
                {p.nameJp}
                <span className="ml-2 text-xs text-zinc-400">{p.productCode}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query && matches.length === 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-400 shadow-lg">
          該当する製品がありません
        </div>
      )}
    </div>
  );
}
