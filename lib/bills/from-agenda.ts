// 議案一覧(data/agendas.json)の1件から、議案フォームの初期値を作る

import type { AgendaItem } from "@/data/agendas";
import { emptyBillFormValues, type BillFormValues } from "./schema";
import type { BillStatus } from "./types";

// 議決結果の文言から審議の状況を決める(空文字は未議決)
export function statusFromResult(result: string): BillStatus {
  if (!result) return "in_committee";
  if (result.includes("否決")) return "rejected";
  if (result.includes("修正")) return "amended";
  if (result.includes("継続")) return "continued";
  return "enacted";
}

const NUMBER_PREFIXES: [RegExp, string][] = [
  [/^専決/, "senketsu-"],
  [/^諮問/, "shimon-"],
  [/^認定/, "nintei-"],
];

// 例: 名古屋市会 令和8年8月定例会 市長提出 第138号 → nagoya-2026-08-138
export function suggestSlug(item: AgendaItem): string {
  const council = item.council === "aichi_pref" ? "aichi" : "nagoya";
  const digits = item.billNumber.match(/\d+/)?.[0] ?? "0";
  const prefix = NUMBER_PREFIXES.find(([re]) => re.test(item.billNumber))?.[1] ?? "";
  const submitter = item.submitter === "議員提出" ? "giin-" : "";
  return `${council}-${item.sessionMonth}-${submitter}${prefix}${digits}`;
}

export function agendaToFormValues(item: AgendaItem): BillFormValues {
  return {
    ...emptyBillFormValues,
    slug: suggestSlug(item),
    council: item.council,
    sessionName: item.sessionName,
    billNumber: item.billNumber,
    name: item.name,
    status: statusFromResult(item.result),
    committee: item.committee,
    submittedDate: item.submittedDate ?? "",
    decidedDate: item.decidedDate ?? "",
    sourceUrl: item.sourceUrl,
  };
}
