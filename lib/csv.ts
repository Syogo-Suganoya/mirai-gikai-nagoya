// RFC 4180 形式の CSV を読み書きする小さなユーティリティ。
// ダブルクォートで囲んだセル(カンマ・改行・"" を含められる)と、Excel が付ける BOM に対応する。

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (inQuotes) throw new Error("閉じられていない「\"」があります");
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // 中身が空の行(末尾の改行など)は捨てる
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}
