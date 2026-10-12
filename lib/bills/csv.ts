// 議案の CSV インポートの列定義と、1行を議案の入力値に変換する処理。
// 「この法律のポイント」などのセクションは CSV では扱わず、取り込み後に編集画面で入力する。

import type { CouncilKey } from "@/data/councils";
import {
  billFormSchema,
  billToFormValues,
  emptyBillFormValues,
  formValuesToInput,
  type BillFormValues,
} from "./schema";
import { BILL_STATUSES, billStatusLabels, type BillInput, type BillStatus } from "./types";

export const CSV_COLUMNS = [
  { key: "slug", label: "URL識別子(必須・半角英小文字/数字/ハイフン)" },
  { key: "council", label: "議会(aichi_pref / nagoya_city / 愛知県議会 / 名古屋市会)" },
  { key: "session_name", label: "会期(例: 令和8年2月定例会)" },
  { key: "bill_number", label: "議案番号(例: 第1号)" },
  { key: "name", label: "議案名" },
  { key: "status", label: "審議の状況(introduced 等、または「可決」などの表示名)" },
  { key: "committee", label: "付託委員会" },
  { key: "submitted_date", label: "提出日(YYYY-MM-DD)" },
  { key: "decided_date", label: "議決日(YYYY-MM-DD)" },
  { key: "source_url", label: "出典 URL" },
  { key: "summary_easy", label: "かんたん解説" },
  { key: "summary_detailed", label: "くわしい解説" },
  { key: "minutes_text", label: "会議録の要約(AIチャット用)" },
  { key: "tags", label: "タグ(カンマ区切り。セル全体を\"で囲む)" },
] as const;

type CsvKey = (typeof CSV_COLUMNS)[number]["key"];

const COUNCIL_ALIASES: Record<string, CouncilKey> = {
  aichi_pref: "aichi_pref",
  愛知県議会: "aichi_pref",
  愛知県: "aichi_pref",
  nagoya_city: "nagoya_city",
  名古屋市会: "nagoya_city",
  名古屋市議会: "nagoya_city",
  名古屋市: "nagoya_city",
};

function toStatus(value: string): BillStatus | null {
  const v = value.trim();
  if ((BILL_STATUSES as readonly string[]).includes(v)) return v as BillStatus;
  const byLabel = BILL_STATUSES.find((s) => billStatusLabels[s] === v);
  if (byLabel) return byLabel;
  if (v === "成立" || v === "原案可決") return "enacted";
  return null;
}

export type CsvRowResult =
  | { line: number; ok: true; action: "create" | "update"; input: BillInput }
  | { line: number; ok: false; slug: string; errors: string[] };

// ヘッダー行の列名から、CSV の各列がどの項目かを決める(列の順番は自由。知らない列は無視する)
export function readHeader(header: string[]): { columns: (CsvKey | null)[]; errors: string[] } {
  const keys = CSV_COLUMNS.map((c) => c.key) as readonly string[];
  const columns = header.map((h) => {
    const key = h.trim();
    return keys.includes(key) ? (key as CsvKey) : null;
  });
  const errors = columns.includes("slug") ? [] : ["1行目(見出し)に slug 列がありません"];
  return { columns, errors };
}

// 既存の議案(同じ slug)があればそれに CSV の列を上書きし、なければ新規作成の値を作る
export function rowToInput(
  line: number,
  row: string[],
  columns: (CsvKey | null)[],
  existing: BillInput | undefined,
): CsvRowResult {
  // 既存の議案の更新では、空欄のセルは「変更しない」として扱う(一部の列だけ書きかえられるように)
  const cell: Partial<Record<CsvKey, string>> = {};
  columns.forEach((key, i) => {
    const value = (row[i] ?? "").trim();
    if (key && !(existing && value === "")) cell[key] = value;
  });

  const errors: string[] = [];
  const base: BillFormValues = existing ? billToFormValues(existing) : { ...emptyBillFormValues };
  const values: BillFormValues = { ...base };

  if (cell.slug !== undefined) values.slug = cell.slug;
  if (cell.council !== undefined) {
    const council = COUNCIL_ALIASES[cell.council];
    if (council) values.council = council;
    else errors.push(`議会「${cell.council}」が分かりません`);
  }
  if (cell.status) {
    const status = toStatus(cell.status);
    if (status) values.status = status;
    else errors.push(`審議の状況「${cell.status}」が分かりません`);
  }
  if (cell.session_name !== undefined) values.sessionName = cell.session_name;
  if (cell.bill_number !== undefined) values.billNumber = cell.bill_number;
  if (cell.name !== undefined) values.name = cell.name;
  if (cell.committee !== undefined) values.committee = cell.committee;
  if (cell.submitted_date !== undefined) values.submittedDate = cell.submitted_date;
  if (cell.decided_date !== undefined) values.decidedDate = cell.decided_date;
  if (cell.source_url !== undefined) values.sourceUrl = cell.source_url;
  if (cell.summary_easy !== undefined) values.summaryEasy = cell.summary_easy;
  if (cell.summary_detailed !== undefined) values.summaryDetailed = cell.summary_detailed;
  if (cell.minutes_text !== undefined) values.minutesText = cell.minutes_text;
  if (cell.tags !== undefined) values.tagsText = cell.tags;

  const parsed = billFormSchema.safeParse(values);
  if (!parsed.success) {
    errors.push(...parsed.error.issues.map((i) => i.message));
  }
  if (errors.length > 0 || !parsed.success) {
    return { line, ok: false, slug: values.slug, errors };
  }
  return { line, ok: true, action: existing ? "update" : "create", input: formValuesToInput(parsed.data) };
}
