// v11追加: 管理画面のCSV入出力用の軽量ユーティリティ。
// 依存ライブラリを増やさず、RFC4180相当(カンマ・改行・ダブルクォートを含むフィールドの引用符処理)を
// 手書きで実装している。Excel等で編集し直すことを想定し、UTF-8 BOM付きで出力する。

export function toCsv(rows: Record<string, string | number | boolean | null>[], columns: string[]): string {
  const esc = (v: string | number | boolean | null): string => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const header = columns.map(esc).join(",");
  const body = rows.map((row) => columns.map((col) => esc(row[col])).join(","));
  return "﻿" + [header, ...body].join("\r\n") + "\r\n";
}

// シンプルなCSVパーサ。引用符で囲まれたフィールド内のカンマ・改行・エスケープされたダブルクォート("")に対応する。
export function parseCsv(text: string): Record<string, string>[] {
  const content = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (inQuotes) {
      if (ch === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\r") {
      // \r\n の \n 側で改行確定するため、ここでは何もしない
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  if (nonEmptyRows.length === 0) return [];
  const header = nonEmptyRows[0];
  return nonEmptyRows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => {
      obj[key] = r[i] ?? "";
    });
    return obj;
  });
}

export function parseCsvBool(v: string | undefined): boolean {
  const s = (v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "on";
}
