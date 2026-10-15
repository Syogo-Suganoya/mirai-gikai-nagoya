import type { BillRecord } from "./types";

// 解説(かんたん・くわしい)も4つのセクションも空で、議案名などの基本情報しかない議案
// (「議案一覧から作成」や CSV で取り込んだ直後など)
export function isTitleOnly(
  bill: Pick<
    BillRecord,
    "summaryEasy" | "summaryDetailed" | "keyPoints" | "reasons" | "debatePoints" | "affectedGroups"
  >,
): boolean {
  return (
    !bill.summaryEasy.trim() &&
    !bill.summaryDetailed.trim() &&
    bill.keyPoints.length === 0 &&
    bill.reasons.length === 0 &&
    bill.debatePoints.length === 0 &&
    bill.affectedGroups.length === 0
  );
}
