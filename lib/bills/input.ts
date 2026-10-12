import type { BillInput, BillRecord } from "./types";

// 保存済みの議案から、管理画面で編集する項目だけを取り出す
export function toInput(bill: BillRecord): BillInput {
  return {
    slug: bill.slug,
    council: bill.council,
    sessionName: bill.sessionName,
    billNumber: bill.billNumber,
    name: bill.name,
    status: bill.status,
    committee: bill.committee,
    submittedDate: bill.submittedDate,
    decidedDate: bill.decidedDate,
    sourceUrl: bill.sourceUrl,
    minutesText: bill.minutesText,
    summaryEasy: bill.summaryEasy,
    summaryDetailed: bill.summaryDetailed,
    keyPoints: bill.keyPoints,
    reasons: bill.reasons,
    debatePoints: bill.debatePoints,
    affectedGroups: bill.affectedGroups,
    tags: bill.tags,
    thumbnail: bill.thumbnail,
    displayOrder: bill.displayOrder,
  };
}
